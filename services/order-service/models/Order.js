const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const Order = sequelize.define("Order", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  products: {
    type: DataTypes.JSONB, // ✅ Store array of { productId, quantity }
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "SHIPPED", "DELIVERED"),
    defaultValue: "PENDING",
  },
});

module.exports = Order;
