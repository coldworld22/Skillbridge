const express = require('express');
const router = express.Router();
const metrics = require('../utils/metrics');

router.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/observability', (_req, res) => {
  res.status(200).json({ status: 'ok', metrics: metrics.snapshot() });
});

module.exports = router;
