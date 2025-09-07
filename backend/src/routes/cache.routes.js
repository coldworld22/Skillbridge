const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth/authMiddleware');
const { createClient } = require('redis');

const router = express.Router();

router.post('/clear', verifyToken, isAdmin, async (_req, res) => {
  const client = createClient({ url: process.env.REDIS_URL });
  try {
    await client.connect();
    await client.flushAll();
    await client.disconnect();
    res.json({ message: 'Cache cleared' });
  } catch (err) {
    await client.disconnect();
    res.status(500).json({ message: 'Failed to clear cache' });
  }
});

module.exports = router;
