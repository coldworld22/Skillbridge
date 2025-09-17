const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const userModel = require('../users/user.model');
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

const hasSetupSecretConfigured = () => {
  const secret = process.env.INSTALL_SETUP_SECRET;
  return typeof secret === 'string' && secret.trim() !== '';
};

const shouldBypassInstallAuth = async () => {
  if (hasSetupSecretConfigured()) {
    return false;
  }

  try {
    const admins = await userModel.findAdmins();
    if (Array.isArray(admins)) {
      return admins.length === 0;
    }
    return true;
  } catch (_error) {
    return false;
  }
};

// Require an authenticated administrator for install endpoints when an admin
// exists or when a setup secret is configured.
const enforceInstallAuth = async (req, res, next) => {
  if (await shouldBypassInstallAuth()) {
    return next();
  }

  return verifyToken(req, res, (err) => {
    if (err) {
      return next(err);
    }
    return isAdmin(req, res, next);
  });
};

router.use(enforceInstallAuth);

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
