const express = require('express');
const router = express.Router();
const { csrfCookieOptions } = require('../utils/cookie');
const logger = require('../utils/logger');

router.get('/', (req, res) => {
  if (typeof req.csrfToken === 'function') {
    try {
      const token = req.csrfToken();
      res.cookie('csrfToken', token, csrfCookieOptions);
    } catch (err) {
      logger.warn(
        `⚠️ Failed to issue CSRF cookie on CSRF route: ${err.message}`
      );
    }
  } else {
    logger.warn(
      '⚠️ CSRF token helper missing on CSRF route; skipping csrfToken cookie. Verify session/Redis configuration.'
    );
  }
  return res.status(204).json();
});

module.exports = router;
