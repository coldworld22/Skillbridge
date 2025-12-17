const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { z } = require('zod');

const DEFAULT_PURCHASE_CODE = 'Javaheat@18880';

const parseBooleanFlag = (value) => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on', 'enable', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(normalized)) {
    return false;
  }
  return undefined;
};

const resolveInstallerConfig = () => {
  const authFlag = parseBooleanFlag(process.env.INSTALL_REQUIRE_AUTH);
  const requireAuth = authFlag === undefined ? false : authFlag;
  let purchaseCode = '';
  if (Object.prototype.hasOwnProperty.call(process.env, 'INSTALL_PURCHASE_CODE')) {
    purchaseCode = (process.env.INSTALL_PURCHASE_CODE || '').trim();
  } else if (Object.prototype.hasOwnProperty.call(process.env, 'INSTALL_SETUP_SECRET')) {
    purchaseCode = (process.env.INSTALL_SETUP_SECRET || '').trim();
  } else {
    purchaseCode = DEFAULT_PURCHASE_CODE;
  }
  return {
    requireAuth,
    purchaseCode,
  };
};

const isInstallerEnabled = (req, res, next) => {
  if (process.env.INSTALL_API_ENABLED?.toLowerCase() === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installation via API is disabled.' });
};

const requireInstallerAccess = (req, res, next) => {
  const { requireAuth, purchaseCode } = resolveInstallerConfig();
  const providedSecret =
    (req.get('X-Install-Purchase-Code') ||
      req.get('X-Install-Setup-Secret') ||
      '').trim();

  if (purchaseCode) {
    if (!providedSecret) {
      return res
        .status(403)
        .json({
          message: 'Installer locked. Purchase code required.',
          code: 'INSTALL_LOCKED',
        });
    }
    if (providedSecret !== purchaseCode) {
      return res
        .status(403)
        .json({
          message: 'Installer locked. Purchase code invalid.',
          code: 'INSTALL_LOCKED',
        });
    }
  }

  if (!requireAuth) {
    return next();
  }

  return verifyToken(req, res, () => isAdmin(req, res, next));
};

router.use(isInstallerEnabled);

router.get('/config', (req, res) => {
  const { requireAuth, purchaseCode } = resolveInstallerConfig();
  res.json({
    authRequired: Boolean(requireAuth),
    secretRequired: Boolean(purchaseCode),
    purchaseCodeRequired: Boolean(purchaseCode),
  });
});

router.get(
  '/prereqs',
  validate({ query: z.object({}).strict() }),
  controller.checkPrereqs,
);

router.use(requireInstallerAccess);

const runSchema = z
  .object({
    mode: z.enum(['development', 'production']).default('development'),
    domain: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'production' && !data.domain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Domain is required for production installs.',
        path: ['domain'],
      });
    }
  });

router.post(
  '/run',
  validate({ body: runSchema }),
  controller.runInstall,
);

module.exports = router;
