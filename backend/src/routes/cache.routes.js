const express = require('express');
const router = express.Router();

// POST /api/admin/cache/clear
router.post('/clear', (_req, res) => {
  // Placeholder for server-side cache clearing logic
  res.json({ message: 'Server cache cleared' });
});

module.exports = router;
