const express = require('express');
const router = express.Router();

router.post('/clear', async (_req, res) => {
  try {
    if (global.clearServerCache) {
      await global.clearServerCache();
    }
    res.status(200).json({ status: 'cleared' });
  } catch (err) {
    console.error('Failed to clear cache', err);
    res.status(500).json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
