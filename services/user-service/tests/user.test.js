const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(express.json());

// Step 1: Create test DB connection
const sequelize = new Sequelize("sqlite::memory:", { logging: false });

// Step 2: Define User model inline (based on your real one)
const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("user", "admin"),
    allowNull: false,
    defaultValue: "user",
  },
});

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Register route
  app.post("/register", async (req, res) => {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed, role });
    res.status(201).json({ message: "User registered" });
  });

  // Login route
  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, "testsecret", { expiresIn: "1h" });
    res.json({ token });
  });
});

describe("User API", () => {
  test("Register a new user", async () => {
    const res = await request(app).post("/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      role: "user",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered");
  });

  test("Login with correct credentials", async () => {
    const res = await request(app).post("/login").send({
      username: "testuser",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("Login with wrong credentials", async () => {
    const res = await request(app).post("/login").send({
      username: "testuser",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(400);
  });
});
