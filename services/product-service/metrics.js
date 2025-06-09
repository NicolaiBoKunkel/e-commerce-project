const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

const stockUpdateFailures = new client.Counter({
  name: "stock_update_failures_total",
  help: "Number of stock update failures due to insufficient stock",
});

register.registerMetric(httpRequestCounter);
register.registerMetric(stockUpdateFailures);

module.exports = {
  register,
  httpRequestCounter,
  stockUpdateFailures,
};
