const express = require('express');
const router = express.Router();
const { csrfCookieOptions } = require('../utils/cookie');
const logger = require('../utils/logger');

router.get('/', (req, res) => {
  let issuedToken = null;

  if (typeof req.csrfToken === 'function') {
    try {
      issuedToken = req.csrfToken();
      res.cookie('csrfToken', issuedToken, csrfCookieOptions);
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

  const status = issuedToken ? 200 : 204;
  return res.status(status).json({ token: issuedToken });
});

module.exports = router;
