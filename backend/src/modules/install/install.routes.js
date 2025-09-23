const crypto = require('crypto');
const router = require('express').Router();
const controller = require('./install.controller');
const { hasExistingAdmin } = require('./install.helpers');
const userModel = require('../users/user.model');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { hasExistingAdmin } = require('./install.helpers');
const userModel = require('../users/user.model');
const { z } = require('zod');
const { hasExistingAdmin } = require('./install.helpers');
const userModel = require('../users/user.model');

const LOGO_MAX_BYTES = 5 * 1024 * 1024;

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

const respondInstallerLocked = (res, message = 'Installer locked') =>
  res.status(403).json({ message, code: 'INSTALL_LOCKED' });

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
    const secretConfigured = setupSecret.length > 0;
    let secretValid = false;

    if (secretConfigured) {
      const providedSecretHeader = req.get('X-Install-Setup-Secret');
      const providedSecret =
        typeof providedSecretHeader === 'string' ? providedSecretHeader.trim() : '';

      secretValid = constantTimeEquals(providedSecret, setupSecret);
    }

    const requireAuth = adminExists && !secretValid;

    if (!requireAuth) {
      return next();
    }

    const adminTokenPresent = hasAdminToken(req);

    if (!adminTokenPresent) {
      await determineAdminPresence();
      const message = secretConfigured
        ? 'Installer locked. Provide a valid setup secret.'
        : 'Installer locked';
      return respondInstallerLocked(res, message);
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

const normalizePort = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : Number.NaN;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN;
  }
  return Number.NaN;
};

const installSchema = z
  .object({
    adminEmail: z.string().trim().email(),
    adminPassword: z.string().min(8),
    databaseUrl: z.string().trim().min(1),
    databaseUser: z.string().trim().min(1),
    databasePassword: z.string().min(1),
    smtpHost: z.string().trim().min(1),
    smtpPort: z
      .union([z.string(), z.number()])
      .transform((value) => normalizePort(value))
      .refine((value) => Number.isInteger(value) && value > 0 && value <= 65535, {
        message: 'SMTP port must be between 1 and 65535.',
      }),
    smtpUser: z.string().trim().min(1),
    smtpPassword: z.string().min(1),
    defaultFromEmail: z.string().trim().email(),
    appDisplayName: z.string().trim().min(1),
    logoUrl: z
      .string()
      .trim()
      .url()
      .refine((value) => /^https?:/i.test(value), {
        message: 'Logo URL must use http or https.',
      })
      .optional(),
    logoFile: z
      .object({
        name: z.string().trim().min(1),
        type: z.string().trim().optional(),
        size: z.number().int().nonnegative(),
        data: z.string().min(1),
        encoding: z.string().trim().optional(),
      })
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasUrl = typeof value.logoUrl === 'string' && value.logoUrl.length > 0;
    const hasFile = value.logoFile && typeof value.logoFile === 'object';

    if (!hasUrl && !hasFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['logoFile'],
        message: 'Provide a logo URL or upload a file.',
      });
    }

    if (hasFile) {
      const file = value.logoFile;
      if (file.size <= 0 || file.size > LOGO_MAX_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['logoFile', 'size'],
          message: 'Logo uploads must be 5 MB or smaller.',
        });
      }

      if (file.encoding && file.encoding.toLowerCase() !== 'base64') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['logoFile', 'encoding'],
          message: 'Unsupported logo encoding. Expected base64.',
        });
      }

      if (typeof file.data !== 'string' || file.data.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['logoFile', 'data'],
          message: 'Logo file data is required.',
        });
      } else {
        const normalized = file.data.replace(/\s+/g, '');
        try {
          const buffer = Buffer.from(normalized, 'base64');
          if (!buffer || buffer.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['logoFile', 'data'],
              message: 'Logo file data is not valid base64.',
            });
          }
        } catch (err) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['logoFile', 'data'],
            message: `Logo file data is invalid: ${err.message || 'unable to decode'}.`,
          });
        }
      }
    }
  });

router.get('/prereqs', validate({ query: emptySchema }), controller.checkPrereqs);
router.post('/run', validate({ body: installSchema }), controller.runInstall);

module.exports = { requireInstallApiEnabled, router };
