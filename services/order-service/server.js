require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5003;

app.get("/", (req, res) => {
  res.send("Order Service is running...");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
