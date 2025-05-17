const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const Order = sequelize.define("Order", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  products: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "SHIPPED", "FAILED",),
    defaultValue: "PENDING",
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
});

module.exports = Order;
