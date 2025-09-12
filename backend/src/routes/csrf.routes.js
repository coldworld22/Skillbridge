const express = require('express');
const router = express.Router();

// Endpoint to trigger CSRF cookie generation
router.get('/', (_req, res) => res.status(204).end());

module.exports = router;
