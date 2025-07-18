const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");
const validateOrder = require("../utils/validateExternal");
const { publishEvent } = require("../rabbit");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { orderStatusCounter } = require("../metrics");

// CREATE order and publish notification event
router.post("/", async (req, res) => {
  const { userId, products, idempotencyKey } = req.body;

  try {
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ where: { idempotencyKey } });
      if (existingOrder) {
        return res.status(200).json({
          message: "Duplicate request — returning existing order",
          order: existingOrder,
        });
      }
    }

    const totalAmount = await validateOrder(userId, products);

    const newOrder = await Order.create({
      userId,
      products,
      totalAmount,
      idempotencyKey: idempotencyKey || null,
    });

    orderStatusCounter.inc({ status: "PENDING" });

    publishEvent({
      type: "ORDER_PLACED",
      userId,
      message: `Your order #${newOrder.id} has been placed!`,
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all orders (admin view)
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
          user: userInfo,
          products: productsWithDetails,
        };
      })
    );

    res.json(enrichedOrders);
  } catch (err) {
    console.error("Failed to fetch all orders:", err.message);
    res.status(500).json({ message: "Error retrieving orders" });
  }
});

// GET single order by ID
router.get("/:id", async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

// GET orders for a specific user
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

// UPDATE order status (e.g. to "shipped")
router.patch(
  "/:orderId/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.orderId;

    if (!["PENDING", "SHIPPED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    try {
      const order = await Order.findByPk(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      order.status = status;
      await order.save();

      if (status === "SHIPPED") {
        orderStatusCounter.inc({ status: "SHIPPED" });

        publishEvent({
          type: "ORDER_SHIPPED",
          userId: order.userId,
          orderId: order.id,
          message: `Your order #${order.id} has been shipped!`,
          products: order.products,
        });
      }

      res.json(order);
    } catch (err) {
      console.error("Failed to update order status:", err.message);
      res.status(500).json({ error: "Could not update order status" });
    }
  }
);

module.exports = router;
