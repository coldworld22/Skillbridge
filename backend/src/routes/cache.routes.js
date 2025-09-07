const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth/authMiddleware');

const router = express.Router();

router.post('/clear', verifyToken, isAdmin, async (_req, res) => {
  try {
    if (global.cacheManager && typeof global.cacheManager.flush === 'function') {
      await global.cacheManager.flush();
    }
    if (global.caches && typeof global.caches.keys === 'function') {
      const keys = await global.caches.keys();
      await Promise.all(keys.map((key) => global.caches.delete(key)));
    }
    if (global.redisClient && typeof global.redisClient.flushall === 'function') {
      await global.redisClient.flushall();
    }
    return res.json({ message: 'Cache cleared' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to clear cache' });
  }
});

module.exports = router;
