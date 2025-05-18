const amqp = require("amqplib");
const { redis } = require("./redis");

async function startRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq");
    const channel = await connection.createChannel();

    // Use the fanout exchange
    await channel.assertExchange("order_events", "fanout", { durable: true });

    // Declare and bind a queue just for this service
    const queue = "order_events_notification";
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, "order_events", "");

    console.log(`Notification Service listening to exchange via queue: ${queue}`);

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      let event;
      try {
        event = JSON.parse(msg.content.toString());
        console.log("Event received:", event);
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

      // Store user notification
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
    console.error("Failed to start RabbitMQ consumer in notification-service:", err.message);
  }
}

module.exports = { startRabbitMQ };
