const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();
const clearServerCache = require('../utils/cache');

router.post('/clear', requireAdmin, async (_req, res) => {
  try {
    if (typeof global.clearServerCache !== 'function') {
      return res
        .status(500)
        .json({ status: 'error', message: 'Cache clearing function not defined' });
    }
    await global.clearServerCache();
    res.status(200).json({ status: 'cleared' });
  } catch (err) {
    console.error('Failed to clear cache', err);
    res
      .status(500)
      .json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
