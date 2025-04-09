const axios = require("axios");

const validateOrder = async (userId, products) => {
  // Validate user
  const userRes = await axios.get(`http://user-service:5001/internal/users/${userId}`);
  if (!userRes.data) throw new Error("Invalid user");

  // Validate products and calculate total
  let total = 0;
  for (const product of products) {
    const productRes = await axios.get(`http://product-service:5002/internal/products/${product.productId}`);
    if (!productRes.data) throw new Error(`Invalid product: ${product.productId}`);
    total += productRes.data.price * product.quantity;
  }

  return total;
};

module.exports = validateOrder;
