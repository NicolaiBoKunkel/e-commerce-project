const amqp = require("amqplib");
const Order = require("./models/Order");

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER_EVENTS", { durable: true });

    console.log("Connected to RabbitMQ from order-service");

    // Start consuming events (for compensation logic)
    channel.consume("ORDER_EVENTS", async (msg) => {
      if (!msg) return;

      let event;
      try {
        event = JSON.parse(msg.content.toString());
        console.log("Order Service received event:", event);
      } catch (err) {
        console.error("Failed to parse message:", err.message);
        channel.ack(msg);
        return;
      }

      // Handle compensation if product-service fails to update stock
      if (event.type === "STOCK_UPDATE_FAILED" && event.orderId) {
        try {
          const order = await Order.findByPk(event.orderId);
          if (order) {
            order.status = "FAILED";
            await order.save();
            console.log(`Order #${order.id} marked as FAILED due to stock update failure`);
          } else {
            console.warn(`No order found with ID ${event.orderId}`);
          }
        } catch (err) {
          console.error("Compensation error:", err.message);
        }
      }

      channel.ack(msg);
    });

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
