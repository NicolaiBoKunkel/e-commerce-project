const amqp = require("amqplib");
const Order = require("./models/Order");
const { orderStatusCounter } = require("./metrics");

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://rabbitmq");
    channel = await connection.createChannel();

    // Setup fanout exchange
    await channel.assertExchange("order_events", "fanout", { durable: true });

    // Each service gets its own queue bound to the exchange
    const queue = "order_events_order";
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, "order_events", "");

    await channel.assertQueue("order_events_notification", { durable: true });
    await channel.bindQueue("order_events_notification", "order_events", "");

    console.log("Connected to RabbitMQ from order-service");

    channel.consume(queue, async (msg) => {
      console.log("order-service: received raw message");
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

      if (event.type === "STOCK_UPDATE_FAILED" && event.orderId) {
        console.log("order-service: handling STOCK_UPDATE_FAILED");
        try {
          const order = await Order.findByPk(event.orderId);
          if (order) {
            order.status = "FAILED";
            await order.save();

            orderStatusCounter.inc({ status: "FAILED" });

            console.log(`Order #${order.id} marked as FAILED due to stock update failure`);

            publishEvent({
              type: "ORDER_FAILED",
              userId: order.userId,
              orderId: order.id,
              message: `Order #${order.id} failed due to insufficient stock.`,
            });
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

  // Publish to the exchange instead of a queue
  channel.publish("order_events", "", Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });
}

module.exports = { connectRabbitMQ, publishEvent };
