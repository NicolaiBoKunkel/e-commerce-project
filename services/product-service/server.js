require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5002;

app.get("/", (req, res) => {
  res.send("Product Service is running...");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "product-service" });
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
