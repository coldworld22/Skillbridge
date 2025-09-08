const router = require('express').Router();
const controller = require('./install.controller');

// Guard installation endpoints behind an environment flag.
// This prevents the install API from being accessible in production
// and encourages using CLI scripts for deployment.
router.use((req, res, next) => {
  if (process.env.INSTALL_API_ENABLED === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installation via API is disabled.' });
});

router.get('/prereqs', controller.checkPrereqs);
router.post('/run', controller.runInstall);

module.exports = router;
