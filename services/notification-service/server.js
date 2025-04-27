require("dotenv").config();
const express = require("express");
const { connectRedis } = require("./redis");
const { startRabbitMQ } = require("./rabbit");

const app = express();
app.use(express.json());

app.use("/notifications", require("./routes/notifications"));

app.get("/health", (req, res) => res.send("🔔 Notification Service Running"));

const PORT = process.env.PORT || 5004;

app.listen(PORT, async () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
  await connectRedis();
  await startRabbitMQ();
});
