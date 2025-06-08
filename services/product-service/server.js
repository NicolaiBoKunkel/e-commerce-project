require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("./models/Product");
const { authenticateToken, requireAdmin } = require("./middleware/auth");
const { startRabbitMQ } = require("./rabbit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // still good for other JSON routes

// Serve uploaded images statically
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/products_db";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await startRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Product Service running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes

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

app.post("/products", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      imageUrl
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid ID", error: err.message });
  }
});

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

app.get("/internal/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
