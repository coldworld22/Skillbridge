const express = require('express');
const router = express.Router();
const { csrfCookieOptions } = require('../utils/cookie');

router.get('/', (req, res) => {
  const token = req.csrfToken();
  res.cookie('csrfToken', token, csrfCookieOptions);
  return res.status(204).json();
});

module.exports = router;
