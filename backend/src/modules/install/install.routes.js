const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { z } = require('zod');

// Guard installation endpoints behind an environment flag to prevent accidental
// exposure in production deployments.
const requireInstallApiEnabled = (req, res, next) => {
  if (process.env.INSTALL_API_ENABLED?.toLowerCase() === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installer API disabled' });
};

router.use(requireInstallApiEnabled);
const enforceInstallerGuard = async (req, res, next) => {
  try {
    const setupSecret =
      typeof process.env.INSTALL_SETUP_SECRET === 'string'
        ? process.env.INSTALL_SETUP_SECRET.trim()
        : '';

    if (setupSecret.length > 0) {
      const providedSecret = req.get('x-install-setup-secret');
      if (typeof providedSecret === 'string' && providedSecret === setupSecret) {
        return next();
      }
    }

    return verifyToken(req, res, (err) => {
      if (err) {
        return next(err);
      }
      return isAdmin(req, res, next);
    });
  } catch (error) {
    return next(error);
  }
};

router.use(enforceInstallerGuard);

// No input is accepted for the prereqs endpoint; validate empty payloads strictly.
const emptySchema = z.object({}).strict();

const installSchema = z
  .object({
    adminEmail: z.string().trim().email(),
    adminPassword: z.string().min(8),
  })
  .strict();

router.get('/prereqs', validate({ query: emptySchema }), controller.checkPrereqs);
router.post('/run', validate({ body: installSchema }), controller.runInstall);

module.exports = { requireInstallApiEnabled, router };
