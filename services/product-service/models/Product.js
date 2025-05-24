const mongoose = require("mongoose");

/**
 * @typedef Product
 * @property {string} name - Name of the product (required).
 * @property {string} description - Optional description of the product.
 * @property {number} price - Price of the product (required).
 * @property {string} category - Optional category this product belongs to.
 * @property {number} stock - Current inventory count. Defaults to 0.
 * @property {string} imageUrl - URL to the product's image.
 * @property {boolean} isDeleted - Marks product as deleted (tombstone pattern).
 * @property {Date} createdAt - Timestamp of creation (auto-generated).
 * @property {Date} updatedAt - Timestamp of last update (auto-generated).
 */

/**
 * Mongoose schema for the Product model.
 * 
 * This schema represents product data used in the e-commerce platform.
 * It includes fields such as price, category, and stock level.
 * The `isDeleted` flag is used to implement the tombstone pattern for soft deletes.
 */
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  stock: { type: Number, default: 0 },
  imageUrl: String,
  isDeleted: { type: Boolean, default: false } // Tombstone flag
}, { timestamps: true });

/**
 * Mongoose model for interacting with the products collection in MongoDB.
 * @type {mongoose.Model<Product>}
 */
module.exports = mongoose.model("Product", productSchema);
