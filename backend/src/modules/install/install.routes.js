const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { z } = require('zod');

// Guard installation endpoints behind an environment flag to prevent accidental
// exposure in production deployments.
router.use((req, res, next) => {
  if (process.env.INSTALL_API_ENABLED?.toLowerCase() === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installation via API is disabled.' });
});

// Require an authenticated administrator for all install endpoints.
router.use(verifyToken, isAdmin);

// No input is accepted for these endpoints; validate empty payloads strictly.
const emptySchema = z.object({}).strict();
router.get('/prereqs', validate({ query: emptySchema }), controller.checkPrereqs);
router.post('/run', validate({ body: emptySchema }), controller.runInstall);

module.exports = router;
