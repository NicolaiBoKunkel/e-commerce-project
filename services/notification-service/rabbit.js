const amqp = require("amqplib");
const { redis } = require("./redis");

async function startRabbitMQ() {
  const queue = "order_events_notification";
  const exchange = "order_events";
  const retryInterval = 5000; // Retry every 5 seconds

  async function tryConnect() {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq");
      const channel = await connection.createChannel();

      await channel.assertExchange(exchange, "fanout", { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, "");

      console.log(`Notification Service listening to exchange via queue: ${queue}`);

      channel.consume(queue, async (msg) => {
        if (!msg) return;

        let event;
        try {
          event = JSON.parse(msg.content.toString());
        } catch (err) {
          console.warn("Failed to parse message:", err.message);
          channel.ack(msg);
          return;
        }

        const { type, userId, message, orderId, failedProducts } = event;

        if (
          (["ORDER_PLACED", "ORDER_SHIPPED", "ORDER_FAILED"].includes(type) &&
            (!userId || !message))
        ) {
          console.warn(`Missing fields in ${type} message:`, event);
          channel.ack(msg);
          return;
        }

        if (type === "STOCK_UPDATE_FAILED" && (!userId || !orderId || !failedProducts)) {
          console.warn("Missing fields in STOCK_UPDATE_FAILED message:", event);
          channel.ack(msg);
          return;
        }

        if (["ORDER_PLACED", "ORDER_SHIPPED", "ORDER_FAILED"].includes(type)) {
          const notification = {
            type,
            message,
            seen: false,
            timestamp: new Date().toISOString(),
          };

          try {
            const redisKey = `notifications:user:${userId}`;
            await redis.lPush(redisKey, JSON.stringify(notification));
            console.log(`Saved ${type} notification for user ${userId}`);
          } catch (error) {
            console.error("Failed to save notification:", error);
          }
        }

        channel.ack(msg);
      });
    } catch (err) {
      console.error("RabbitMQ connection failed in notification-service:", err.message);
      console.log(`Retrying in ${retryInterval / 1000}s...`);
      setTimeout(tryConnect, retryInterval);
    }
  }

  tryConnect(); // Start the first attempt
}

module.exports = { startRabbitMQ };
