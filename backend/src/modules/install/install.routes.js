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

    let secretProvided = false;
    if (setupSecret.length > 0) {
      const providedSecretHeader = req.get('X-Install-Setup-Secret');
      const providedSecret =
        typeof providedSecretHeader === 'string' ? providedSecretHeader.trim() : '';
      secretProvided = constantTimeEquals(providedSecret, setupSecret);
      if (!secretProvided) {
        return res.status(403).json({
          code: 'INSTALL_LOCKED',
          message: 'Installer locked. Provide a valid setup secret.',
        });
      }
    }

    const adminExists = await determineAdminPresence();

    if (!adminExists) {
      return next();
    }

    if (secretProvided) {
      return next();
    }

    if (!secretValid) {
      return respondInstallerLocked(res);
    }

    const adminTokenPresent = hasAdminToken(req);

    if (!adminTokenPresent) {
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

const preprocessOptional = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  return value;
};

const optionalString = z.preprocess(preprocessOptional, z.string().min(1)).optional();
const optionalEmail = z.preprocess(preprocessOptional, z.string().email()).optional();
const optionalUrl = z.preprocess(preprocessOptional, z.string().url()).optional();
const optionalPort = z
  .preprocess((value) => {
    const processed = preprocessOptional(value);
    if (processed === undefined) {
      return undefined;
    }
    if (typeof processed === 'number') {
      return processed;
    }
    if (typeof processed === 'string') {
      if (!/^\d+$/.test(processed)) {
        return processed;
      }
      return Number(processed);
    }
    return processed;
  }, z.number().int().min(1).max(65535))
  .optional();

const optionalBoolean = z
  .preprocess((value) => {
    const processed = preprocessOptional(value);
    if (processed === undefined) {
      return undefined;
    }
    if (typeof processed === 'boolean') {
      return processed;
    }
    if (typeof processed === 'string') {
      const normalized = processed.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false;
      }
      return processed;
    }
    return processed;
  }, z.boolean())
  .optional();

const logoFileSchema = z
  .object({
    filename: optionalString,
    mimeType: optionalString,
    data: z.preprocess(preprocessOptional, z.string().min(1)),
  })
  .strict();

const installSchema = z
  .object({
    adminEmail: z.string().trim().email(),
    adminPassword: z.string().min(8),
    supportEmail: optionalEmail,
    appName: optionalString,
    logoUrl: optionalUrl,
    logoFile: logoFileSchema.optional(),
    smtpHost: optionalString,
    smtpPort: optionalPort,
    smtpUsername: optionalString,
    smtpPassword: optionalString,
    smtpFromEmail: optionalEmail,
    smtpFromName: optionalString,
    smtpEncryption: optionalString,
    smtpSecure: optionalBoolean,
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
