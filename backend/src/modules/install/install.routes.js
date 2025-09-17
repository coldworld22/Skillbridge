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
const extractToken = (req) => {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const parts = authHeader.split(' ');
    const token = parts[1]?.trim();
    if (token) {
      return token;
    }
  }

  const cookieToken = typeof req.cookies?.token === 'string' ? req.cookies.token.trim() : '';
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

const enforceInstallerGuard = async (req, res, next) => {
  try {
    const adminExists = await hasExistingAdmin();
    if (!adminExists) {
      return next();
    }

    const token = extractToken(req);
    if (!token) {
      return res.status(403).json({
        code: 'INSTALL_LOCKED',
        message:
          'Installation locked: An administrator already exists. Sign in to manage this instance.',
      });
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
