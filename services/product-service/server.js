require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Product = require("./models/Product");
const { authenticateToken, requireAdmin } = require("./middleware/auth");
const { startRabbitMQ } = require("./rabbit");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/products_db";

/**
 * Connects to MongoDB and starts the Express server
 * after initializing RabbitMQ listeners.
 */
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await startRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Product Service running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

/**
 * @route GET /products
 * @group Products - Fetch all non-deleted products or all if admin
 * @param {boolean} includeDeleted.query - If true, includes deleted (admin only)
 * @returns {Array.<Product>} 200 - List of products
 * @returns {Error} 403 - Unauthorized access
 */
app.get("/products", async (req, res) => {
  const includeDeleted = req.query.includeDeleted === "true";

  if (includeDeleted) {
    try {
      await authenticateToken(req, res, async () => {
        await requireAdmin(req, res, async () => {
          const products = await Product.find({});
          return res.json(products);
        });
      });
    } catch (err) {
      return res.status(403).json({ error: "Admin access required to view deleted products" });
    }
  } else {
    try {
      const products = await Product.find({ isDeleted: false });
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * @route POST /products
 * @group Products - Create a new product (admin only)
 * @param {Product.model} body.body.required - Product data
 * @returns {Product.model} 201 - Newly created product
 * @returns {Error} 400 - Validation error
 */
app.post("/products", authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body;
  try {
    const product = await Product.create({ name, description, price, stock, category, imageUrl });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route GET /products/:id
 * @group Products - Get a product by ID
 * @param {string} id.path.required - Product ID
 * @returns {Product.model} 200 - Product data
 * @returns {Error} 404 - Product not found
 */
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid ID", error: err.message });
  }
});

/**
 * @route PUT /products/:id
 * @group Products - Update a product by ID (admin only)
 * @param {string} id.path.required - Product ID
 * @param {Product.model} body.body.required - Updated product data
 * @returns {Product.model} 200 - Updated product
 * @returns {Error} 404 - Product not found
 */
app.put("/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
});

/**
 * @route DELETE /products/:id
 * @group Products - Soft delete a product (admin only)
 * @param {string} id.path.required - Product ID
 * @returns {string} 200 - Confirmation message
 * @returns {Error} 404 - Product not found
 */
app.delete("/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product marked as deleted" });
  } catch (err) {
    res.status(400).json({ message: "Delete failed", error: err.message });
  }
});

/**
 * @route GET /internal/products/:id
 * @group Internal - Get any product (even deleted)
 * @param {string} id.path.required - Product ID
 * @returns {Product.model} 200 - Product data
 * @returns {Error} 404 - Product not found
 */
app.get("/internal/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
