require("dotenv").config();
const express = require("express");
const { sequelize } = require("./sequelize");
const orderRoutes = require("./routes/orders");

const app = express();
app.use(express.json());
app.use("/order", orderRoutes);

const PORT = process.env.PORT || 5003;

sequelize.sync({ force: true }).then(() => {
  console.log("✅ Order DB synced with `force: true` — table recreated");
  app.listen(PORT, () => {
    console.log(`🚀 Order Service running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Failed to sync DB or start server:", err);
});

