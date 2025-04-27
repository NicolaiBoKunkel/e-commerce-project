const amqp = require("amqplib");

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER_EVENTS", { durable: true });
    console.log("Connected to RabbitMQ from order-service");
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err.message);
  }
}

function publishEvent(event) {
  if (!channel) {
    console.warn("No RabbitMQ channel available to publish event");
    return;
  }

  channel.sendToQueue("ORDER_EVENTS", Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });
}

module.exports = { connectRabbitMQ, publishEvent };
