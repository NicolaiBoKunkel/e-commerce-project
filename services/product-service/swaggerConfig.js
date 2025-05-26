// swaggerConfig.js
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product Service API",
      version: "1.0.0",
      description: "API documentation for the Product Service",
    },
    servers: [
      {
        url: "http://localhost:5002",
      },
    ],
  },
  apis: ["./server.js", "./models/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
