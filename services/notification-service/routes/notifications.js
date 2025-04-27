const express = require("express");
const { redis } = require("../redis");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  const key = `notifications:user:${req.params.userId}`;

  try {
    const raw = await redis.lRange(key, 0, -1); // get all
    const parsed = raw.map((msg) => JSON.parse(msg));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

module.exports = router;
