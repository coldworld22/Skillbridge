const express = require('express');
const router = express.Router();

router.post('/clear', async (_req, res) => {
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
    res.status(500).json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
