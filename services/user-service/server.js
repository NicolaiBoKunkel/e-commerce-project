require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.send("User Service is running...");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
