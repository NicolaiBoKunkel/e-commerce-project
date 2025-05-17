const amqp = require("amqplib");
const { redis } = require("./redis");

async function startRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  const queue = "ORDER_EVENTS";

  await channel.assertQueue(queue, { durable: true });
  console.log(`Listening to queue: ${queue}`);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const event = JSON.parse(msg.content.toString());
      console.log("Event received:", event);

      const { type, userId, message, orderId, failedProducts } = event;

      // Validate required fields based on type
      if ((type === "ORDER_PLACED" || type === "ORDER_SHIPPED") && (!userId || !message)) {
        console.warn("Missing fields in ORDER_PLACED/SHIPPED message:", event);
        channel.ack(msg);
        return;
      }

      if (type === "STOCK_UPDATE_FAILED" && (!userId || !orderId || !failedProducts)) {
        console.warn("Missing fields in STOCK_UPDATE_FAILED message:", event);
        channel.ack(msg);
        return;
      }

      // For ORDER_PLACED or ORDER_SHIPPED, create user-facing notification
      if (type === "ORDER_PLACED" || type === "ORDER_SHIPPED") {
        const notification = {
          type,
          message,
          seen: false,
          timestamp: new Date().toISOString(),
        };

        try {
          const redisKey = `notifications:user:${userId}`;
          await redis.lPush(redisKey, JSON.stringify(notification));
          console.log(`Saved notification for user ${userId}`);
        } catch (error) {
          console.error("Failed to save notification:", error);
        }
      }

      channel.ack(msg);
    }
  });
}

module.exports = { startRabbitMQ };
