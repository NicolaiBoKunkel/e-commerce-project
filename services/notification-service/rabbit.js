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

      const { type, userId, message } = event;

      if (!userId || !message) {
        console.warn("Missing fields in message:", event);
        channel.ack(msg);
        return;
      }

      const redisKey = `notifications:user:${userId}`;
      await redis.lPush(redisKey, JSON.stringify({
        type,
        message,
        seen: false,
        timestamp: new Date().toISOString(),
      }));

      channel.ack(msg);
    }
  });
}

module.exports = { startRabbitMQ };
