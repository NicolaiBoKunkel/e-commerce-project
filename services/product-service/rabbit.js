const amqp = require("amqplib");
const Product = require("./models/Product");

async function startRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "ORDER_EVENTS";

    await channel.assertQueue(queue, { durable: true });
    console.log(`Product Service listening to queue: ${queue}`);

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      let event;
      try {
        event = JSON.parse(msg.content.toString());
        console.log("Product Service received event:", event);
      } catch (parseErr) {
        console.error("Failed to parse message:", parseErr);
        channel.ack(msg);
        return;
      }

      if (event.type === "ORDER_SHIPPED" && Array.isArray(event.products)) {
        for (const item of event.products) {
          try {
            const product = await Product.findById(item.productId);
            if (product && typeof item.quantity === "number") {
              const original = product.stock;
              product.stock = Math.max(product.stock - item.quantity, 0);
              await product.save();
              console.log(
                `Reduced stock of '${product.name}' from ${original} to ${product.stock}`
              );
            }
          } catch (err) {
            console.error(
              `Failed to update stock for product ${item.productId}:`,
              err.message
            );
          }
        }
      }

      channel.ack(msg);
    });
  } catch (err) {
    console.error("Product Service failed to start RabbitMQ consumer:", err.message);
  }
}

module.exports = { startRabbitMQ };
