require("dotenv").config();
const express = require("express");
const { sequelize } = require("./sequelize");
const orderRoutes = require("./routes/orders");
const { connectRabbitMQ } = require("./rabbit");

const app = express();
app.use(express.json());
app.use("/order", orderRoutes);

const PORT = process.env.PORT || 5003;

sequelize
  .sync()
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
