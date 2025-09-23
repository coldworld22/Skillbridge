const crypto = require('crypto');
const router = require('express').Router();
const controller = require('./install.controller');
const { hasExistingAdmin } = require('./install.helpers');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { hasExistingAdmin } = require('./install.helpers');
const userModel = require('../users/user.model');
const { z } = require('zod');
const userModel = require('../users/user.model');

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

const encodeLength = (value) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
};

const constantTimeEquals = (a, b) => {
  const provided = Buffer.from(typeof a === 'string' ? a : '', 'utf8');
  const expected = Buffer.from(typeof b === 'string' ? b : '', 'utf8');

  const providedHash = crypto.createHash('sha256').update(provided).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();

  const hashesMatch = crypto.timingSafeEqual(providedHash, expectedHash);
  const lengthsMatch = crypto.timingSafeEqual(
    encodeLength(provided.length),
    encodeLength(expected.length)
  );

  return hashesMatch && lengthsMatch;
};

const respondInstallerLocked = (res) =>
  res.status(403).json({ message: 'Installer locked', code: 'INSTALL_LOCKED' });

const hasAdminToken = (req) =>
  typeof req.headers.authorization === 'string' || Boolean(req.cookies?.token);
const enforceInstallerGuard = async (req, res, next) => {
  try {
    const setupSecret =
      typeof process.env.INSTALL_SETUP_SECRET === 'string'
        ? process.env.INSTALL_SETUP_SECRET.trim()
        : '';
    const secretRequired = setupSecret.length > 0;
    const providedSecretHeader = req.get('X-Install-Setup-Secret');
    const providedSecret =
      typeof providedSecretHeader === 'string' ? providedSecretHeader.trim() : '';
    const secretValid = secretRequired && constantTimeEquals(providedSecret, setupSecret);
    const adminExists = await determineAdminPresence();

    if (!adminExists) {
      if (secretRequired && !secretValid) {
        return res.status(403).json({
          code: 'INSTALL_LOCKED',
          message: 'Installer locked. Provide a valid setup secret.',
        });
      }
      return next();
    }
    if (secretValid) {
      return next();
    }

    const adminTokenPresent = hasAdminToken(req);

    if (!adminTokenPresent) {
      if (secretRequired) {
        return res.status(403).json({
          code: 'INSTALL_LOCKED',
          message: 'Installer locked. Provide a valid setup secret.',
        });
      }
      return respondInstallerLocked(res);
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

const optionalTrimmed = (schema) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      const trimmed = String(value).trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }, schema)
    .optional();

const optionalBoolean = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
        return false;
      }
    }

    return value;
  }, z.boolean())
  .optional();

const optionalPort = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!/^\d+$/.test(trimmed)) {
        return trimmed;
      }
      return Number.parseInt(trimmed, 10);
    }

    return value;
  }, z.number().int().min(1).max(65535))
  .optional();

const base64Data = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      const normalized = value.replace(/\s+/g, '');
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized);
    },
    { message: 'Logo file data must be valid base64.' }
  );

const logoFileSchema = z
  .object({
    filename: z.string().trim().min(1),
    data: base64Data,
    contentType: optionalTrimmed(z.string().min(1)),
  })
  .strict();

const installSchema = z
  .object({
    adminEmail: z.string().trim().email(),
    adminPassword: z.string().min(8),
    appName: optionalTrimmed(z.string().min(1).max(120)),
    supportEmail: optionalTrimmed(z.string().email()),
    supportUrl: optionalTrimmed(z.string().url()),
    smtpHost: optionalTrimmed(z.string().min(1).max(255)),
    smtpPort: optionalPort,
    smtpSecure: optionalBoolean,
    smtpUser: optionalTrimmed(z.string().min(1).max(255)),
    smtpPass: optionalTrimmed(z.string().min(1)),
    smtpFromEmail: optionalTrimmed(z.string().email()),
    smtpFromName: optionalTrimmed(z.string().min(1).max(255)),
    logoUrl: optionalTrimmed(z.string().url()),
    logoFile: logoFileSchema.optional(),
  })
  .strict();

router.get('/prereqs', validate({ query: emptySchema }), controller.checkPrereqs);
router.post('/run', validate({ body: installSchema }), controller.runInstall);

module.exports = { requireInstallApiEnabled, router };
