const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const validateOrder = require("../utils/validateExternal"); // ✅ Correct import

router.post("/", async (req, res) => {
  const { userId, products } = req.body;

  try {
    const totalAmount = await validateOrder(userId, products); // ✅ validate both and compute total

    const newOrder = await Order.create({
      userId,
      products,
      totalAmount,
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const orders = await Order.findAll();
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});


router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { userId: req.params.userId } });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
