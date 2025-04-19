const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const validateOrder = require("../utils/validateExternal");

router.post("/", async (req, res) => {
  const { userId, products } = req.body;

  try {
    const totalAmount = await validateOrder(userId, products);

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

const axios = require("axios");
router.get("/", async (req, res) => {
  try {
    const orders = await Order.findAll();

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        let userInfo = { id: order.userId, username: "Unknown", email: "N/A" };

        try {
          const userRes = await axios.get(`http://user-service:5001/internal/users/${order.userId}`);
          userInfo = userRes.data;
        } catch (err) {
          console.warn("Could not fetch user info:", err.message);
        }

        const productsWithDetails = await Promise.all(
          order.products.map(async (item) => {
            try {
              const productRes = await axios.get(`http://product-service:5002/internal/products/${item.productId}`);
              return {
                ...productRes.data,
                quantity: item.quantity
              };
            } catch (err) {
              console.warn(`Could not fetch product ${item.productId}:`, err.message);
              return {
                _id: item.productId,
                name: "Unknown Product",
                price: 0,
                quantity: item.quantity
              };
            }
          })
        );

        return {
          ...order.toJSON(),
          user: userInfo,
          products: productsWithDetails
        };
      })
    );

    res.json(enrichedOrders);
  } catch (err) {
    console.error("Failed to fetch all orders:", err.message);
    res.status(500).json({ message: "Error retrieving orders" });
  }
});

router.get("/:id", async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});


router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { userId: req.params.userId } });

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const productsWithDetails = await Promise.all(
          order.products.map(async (item) => {
            try {
              const productRes = await axios.get(`http://product-service:5002/internal/products/${item.productId}`);
              return {
                ...productRes.data,
                quantity: item.quantity,
              };
            } catch (err) {
              console.warn(`Could not fetch product ${item.productId}:`, err.message);
              return {
                _id: item.productId,
                name: "Unknown Product",
                price: 0,
                quantity: item.quantity,
              };
            }
          })
        );

        return {
          ...order.toJSON(),
          products: productsWithDetails,
        };
      })
    );

    res.json(enrichedOrders);
  } catch (err) {
    console.error("Failed to fetch user orders:", err.message);
    res.status(500).json({ message: "Error retrieving user orders" });
  }
});



module.exports = router;
