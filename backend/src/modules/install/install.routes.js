const crypto = require('crypto');
const { Router } = require('express');
const { z } = require('zod');
const validate = require('../../middleware/validate');
const logoUpload = require('../appConfig/appLogoUploadMiddleware');
const { hasExistingAdmin: resolveHasExistingAdminStatus } = require('./install.helpers');
const controller = require('./install.controller');

const router = Router();

let cachedConfig;
const getConfig = () => {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  try {
    // eslint-disable-next-line global-require
    cachedConfig = require('../../config/env');
  } catch (error) {
    cachedConfig = null;
  }

  return cachedConfig;
};

const normalizeBooleanCandidate = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const unquoted = trimmed.replace(/^['"]+|['"]+$/g, '');
  return unquoted.trim().toLowerCase();
};

const toBool = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = normalizeBooleanCandidate(value);
  if (!normalized) {
    return false;
  }

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return false;
};

const readExplicitBoolean = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  return toBool(value);
};

const resolveEnvOverride = () => {
  const installFlag = readExplicitBoolean(process.env.INSTALL_API_ENABLED);
  const enableFlag = readExplicitBoolean(process.env.ENABLE_INSTALL);

  if (installFlag === null && enableFlag === null) {
    return null;
  }

  return Boolean(installFlag || enableFlag);
};

const requireInstallApiEnabled = (req, res, next) => {
  const envOverride = resolveEnvOverride();
  if (envOverride !== null) {
    if (envOverride) {
      return next();
    }
    return res.status(403).json({ message: 'Installer API disabled' });
  }

  const config = getConfig();
  if (config?.INSTALL_API_ENABLED || config?.ENABLE_INSTALL) {
    return next();
  }
  return res.status(403).json({ message: 'Installer API disabled' });
};

router.use(requireInstallApiEnabled);

const timingSafeEquals = (a, b) => {
  const aBuffer = Buffer.from(String(a || ''), 'utf8');
  const bBuffer = Buffer.from(String(b || ''), 'utf8');
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const respondInstallerLocked = (res, message = 'Installer locked. Provide a valid setup secret.') =>
  res.status(403).json({ message, code: 'INSTALL_LOCKED' });

const enforceInstallerGuard = async (req, res, next) => {
  try {
    const bypassCache = process.env.NODE_ENV === 'test';
    const adminExists = await resolveHasExistingAdminStatus({ bypassCache });
    const setupSecret = typeof process.env.INSTALL_SETUP_SECRET === 'string'
      ? process.env.INSTALL_SETUP_SECRET.trim()
      : '';

    if (setupSecret) {
      const provided = (req.get('x-install-setup-secret') || '').trim();
      if (provided && timingSafeEquals(provided, setupSecret)) {
        return next();
      }
      return respondInstallerLocked(res);
    }

    if (!adminExists) {
      return next();
    }

    return respondInstallerLocked(
      res,
      'Installer locked. Configure INSTALL_SETUP_SECRET to allow automated setup or manage the instance through the admin UI.'
    );
  } catch (error) {
    return next(error);
  }
};

router.use(enforceInstallerGuard);

const optionalTrimmed = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => (typeof value === 'string' ? value.trim() : ''))
  .transform((value) => (value.length ? value : undefined));

const optionalEmail = optionalTrimmed.refine(
  (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  { message: 'Must be a valid email address.' }
);

const optionalUrl = optionalTrimmed.refine(
  (value) =>
    !value ||
    /^https?:\/\//i.test(value),
  { message: 'Logo URL must start with http:// or https://.' }
);

const booleanFromForm = z
  .union([z.string(), z.boolean(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }
    return false;
  });

const installSchema = z
  .object({
    adminEmail: z.string().trim().email(),
    adminPassword: z.string().min(8),
    appName: z.string().trim().min(1),
    supportEmail: z.string().trim().email(),
    codecanyonKey: optionalTrimmed.refine((value) => !value || value.length >= 6, {
      message: 'Codecanyon key must be at least 6 characters.',
    }),
    logoUrl: optionalUrl,
    smtpHost: z.string().trim().min(1),
    smtpPort: z
      .union([z.string(), z.number()])
      .transform((value) => {
        const numeric = Number.parseInt(String(value).trim(), 10);
        return Number.isFinite(numeric) ? numeric : NaN;
      })
      .refine((value) => Number.isInteger(value) && value >= 1 && value <= 65535, {
        message: 'SMTP port must be between 1 and 65535.',
      }),
    smtpUsername: z.string().trim().min(1),
    smtpPassword: z.string().min(1),
    smtpSecure: booleanFromForm.optional(),
    smtpFromEmail: optionalEmail,
    smtpFromName: optionalTrimmed,
  })
  .strict();

router.get('/prereqs', controller.checkPrereqs);
router.post('/run', logoUpload.single('logoFile'), validate({ body: installSchema }), controller.runInstall);

module.exports = { router, requireInstallApiEnabled };
