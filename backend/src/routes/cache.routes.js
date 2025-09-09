const express = require('express');
const router = express.Router();

router.post('/clear', async (_req, res) => {
  try {
    if (typeof global.clearServerCache === 'function') {
      await global.clearServerCache();
      return res.status(200).json({ status: 'cleared' });
    }

    return res.status(503).json({
      status: 'error',
      message: 'Server cache clearing is not available',
    });
  } catch (err) {
    console.error('Failed to clear cache', err);
    res
      .status(500)
      .json({ status: 'error', message: 'Failed to clear cache' });
  }
});

module.exports = router;
