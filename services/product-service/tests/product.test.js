const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Product = require("../models/Product");
const app = require("../server");

jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, res, next) => next(),
  requireAdmin: (req, res, next) => next(),
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

afterEach(async () => {
  await Product.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Product API", () => {
  it("should create a product", async () => {
    const res = await request(app).post("/products").send({
      name: "Test Product",
      description: "Test description",
      price: 99,
      category: "Test",
      stock: 50,
      imageUrl: "/test.png",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Test Product");
  });

  it("should fetch all products", async () => {
    await Product.create({
      name: "Rock",
      price: 1,
      stock: 100,
      category: "Nature",
      imageUrl: "/uploads/test.jpg",
    });

    const res = await request(app).get("/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Rock");
  });
});
