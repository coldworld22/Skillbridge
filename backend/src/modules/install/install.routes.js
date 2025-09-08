const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { z } = require('zod');

// Guard installation endpoints behind an environment flag.
// This prevents the install API from being accessible in production
// and encourages using CLI scripts for deployment.
router.use((req, res, next) => {
  if (process.env.INSTALL_API_ENABLED === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installation via API is disabled.' });
});

// Require authenticated administrator for all install endpoints
router.use(verifyToken, isAdmin);

const emptySchema = z.object({}).strict();
router.get('/prereqs', validate({ query: emptySchema }), controller.checkPrereqs);
router.post('/run', validate({ body: emptySchema }), controller.runInstall);

module.exports = router;
