require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5004;

app.get("/", (req, res) => {
  res.send("Notification Service is running...");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
