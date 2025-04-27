const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => console.error("Redis Client Error", err));

async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("Connected to Redis");
  }
}

module.exports = { redis, connectRedis };
