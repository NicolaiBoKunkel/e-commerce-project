require("dotenv").config();
const express = require("express");
const { sequelize } = require("./sequelize");
const orderRoutes = require("./routes/orders");
const { connectRabbitMQ } = require("./rabbit");
const { register, httpRequestCounter } = require("./metrics");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });
  next();
});

app.use("/order", orderRoutes);

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

const PORT = process.env.PORT || 5003;

sequelize
  .sync({})
  .then(async () => {
    console.log("Order DB synced");
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync DB or start server:", err);
  });
