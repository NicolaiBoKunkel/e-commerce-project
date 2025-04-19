require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Proxy requests to microservices
app.use(
  "/user",
  createProxyMiddleware({
    target: "http://user-service:5001",
    changeOrigin: true,
    pathRewrite: {
      "^/user": "",
    },
  })
);

app.use("/product", createProxyMiddleware({ target: "http://product-service:5002", changeOrigin: true }));
app.use("/order", createProxyMiddleware({ target: "http://order-service:5003", changeOrigin: true }));
app.use("/notification", createProxyMiddleware({ target: "http://notification-service:5004", changeOrigin: true }));

app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
