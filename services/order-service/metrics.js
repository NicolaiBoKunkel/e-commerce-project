const client = require("prom-client");

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

const orderStatusCounter = new client.Counter({
  name: "order_status_total",
  help: "Number of orders by status",
  labelNames: ["status"]
});

register.registerMetric(httpRequestCounter);
register.registerMetric(orderStatusCounter);

module.exports = {
  register,
  httpRequestCounter,
  orderStatusCounter,
};
