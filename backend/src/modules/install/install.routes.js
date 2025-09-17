const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const userModel = require('../users/user.model');
const { z } = require('zod');
const { hasExistingAdmin } = require('./install.helpers');

// Guard installation endpoints behind an environment flag to prevent accidental
// exposure in production deployments.
const requireInstallApiEnabled = (req, res, next) => {
  if (process.env.INSTALL_API_ENABLED?.toLowerCase() === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installer API disabled' });
};

router.use(requireInstallApiEnabled);
const determineAdminPresence = async () => {
  try {
    const bypassCache = process.env.NODE_ENV === 'test';
    return await hasExistingAdmin({ bypassCache });
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      try {
        const admins = await userModel.findAdmins();
        return Array.isArray(admins) && admins.length > 0;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }

    throw error;
  }
};

const enforceInstallerGuard = async (req, res, next) => {
  try {
    const setupSecret =
      typeof process.env.INSTALL_SETUP_SECRET === 'string'
        ? process.env.INSTALL_SETUP_SECRET.trim()
        : '';
    const adminExists = await determineAdminPresence();
    const requireAuth = adminExists || (setupSecret.length > 0 && req.method === 'GET');

    if (!requireAuth) {
      return next();
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
