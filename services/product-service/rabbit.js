const amqp = require("amqplib");
const Product = require("./models/Product");

let channel;

async function startRabbitMQ() {
  const queue = "order_events_product";
  const exchange = "order_events";
  const retryInterval = 5000; // 5 seconds

  async function tryConnect() {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq");
      channel = await connection.createChannel();

      await channel.assertExchange(exchange, "fanout", { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, "");

      console.log(`Product Service listening to exchange via queue: ${queue}`);

      channel.consume(queue, async (msg) => {
        if (!msg) return;

        let event;
        try {
          event = JSON.parse(msg.content.toString());
          console.log("Product Service received event:", event);
        } catch (err) {
          console.error("Failed to parse message:", err.message);
          channel.ack(msg);
          return;
        }

        if (event.type === "ORDER_SHIPPED" && Array.isArray(event.products)) {
          const failedProducts = [];

          for (const item of event.products) {
            try {
              const product = await Product.findById(item.productId);
              if (product && typeof item.quantity === "number") {
                if (product.stock >= item.quantity) {
                  const original = product.stock;
                  product.stock -= item.quantity;
                  await product.save();
                  console.log(`Reduced stock of '${product.name}' from ${original} to ${product.stock}`);
                } else {
                  console.warn(
                    `Insufficient stock for '${product.name}' — requested: ${item.quantity}, available: ${product.stock}`
                  );
                  failedProducts.push({
                    productId: item.productId,
                    requested: item.quantity,
                    available: product.stock,
                  });
                }
              }
            } catch (err) {
              console.error(`Failed to update stock for product ${item.productId}:`, err.message);
            }
          }

          if (failedProducts.length > 0) {
            const compensationEvent = {
              type: "STOCK_UPDATE_FAILED",
              orderId: event.orderId || null,
              userId: event.userId,
              failedProducts,
            };

            channel.publish(exchange, "", Buffer.from(JSON.stringify(compensationEvent)), {
              persistent: true,
            });

            console.log("Published STOCK_UPDATE_FAILED event:", compensationEvent);
          }
        }

        channel.ack(msg);
      });
    } catch (err) {
      console.error("Product Service failed to connect to RabbitMQ:", err.message);
      console.log(`Retrying in ${retryInterval / 1000}s...`);
      setTimeout(tryConnect, retryInterval);
    }
  }

  tryConnect();
}

module.exports = { startRabbitMQ };
