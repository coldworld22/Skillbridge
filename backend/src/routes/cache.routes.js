const express = require('express');
const router = express.Router();
const clearServerCache = require('../utils/cache');

router.post('/clear', async (_req, res) => {
  try {
    await clearServerCache();
    res
      .status(200)
      .json({ status: 'success', message: 'Cache cleared' });
  } catch (err) {
    console.error('Failed to clear cache', err);
    res
      .status(500)
      .json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
