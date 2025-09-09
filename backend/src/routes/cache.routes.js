const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();
const { clear } = require('../utils/cache');

router.post('/clear', requireAdmin, async (_req, res) => {
  try {
    const clearFn = global.clearServerCache || clear;

    if (!clearFn) {
      return res
        .status(503)
        .json({ status: 'error', message: 'Cache clear function not available' });
    }

    await clearFn();
    res.status(200).json({ status: 'success', message: 'Cache cleared' });
  } catch (err) {
    console.error('Failed to clear cache', err);
    res
      .status(500)
      .json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
