const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

register.registerMetric(httpRequestCounter);

module.exports = {
  register,
  httpRequestCounter,
};
