require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const { sequelize, connectWithRetry } = require("./sequelize");
const User = require("./models/User");


const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Fake in-memory database
const users = [];

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Register
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed, role });

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});


// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );    
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});


app.get("/profile", authMiddleware, async (req, res) => {
  try {
    // Fetch orders from order-service
    const orderResponse = await axios.get(`http://order-service:5003/order/user/${req.user.id}`);

    res.json({
      message: `Welcome ${req.user.username}! This is your profile.`,
      user: req.user,
      orders: orderResponse.data,
    });
  } catch (err) {
    console.error("Failed to fetch orders:", err.message);
    res.status(500).json({ message: "Could not fetch profile with orders" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});


app.get("/internal/users/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});


connectWithRetry().then(() => {
  return sequelize.sync();
}).then(() => {
  app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to start user service:", err);
});


