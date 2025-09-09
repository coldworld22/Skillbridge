const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const cache = require('../utils/cache');

const router = express.Router();

router.post('/clear', requireAdmin, async (_req, res) => {
  try {
    const clearFn = global.clearServerCache;
    if (typeof clearFn !== 'function') {
      throw new Error('Cache clear function not available');
    }
    await global.clearServerCache();
    res.status(200).json({ status: 'success', message: 'Cache cleared' });
  } catch (err) {
    console.error('Failed to clear cache', err);
    res
      .status(500)
      .json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
