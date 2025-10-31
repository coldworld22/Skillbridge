const router = require('express').Router();
const controller = require('./install.controller');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validate = require('../../middleware/validate');
const { z } = require('zod');

const isInstallerEnabled = (req, res, next) => {
  if (process.env.INSTALL_API_ENABLED?.toLowerCase() === 'true') {
    return next();
  }
  return res.status(403).json({ message: 'Installation via API is disabled.' });
};

const requireInstallerAccess = (req, res, next) => {
  const expectedSecret = (process.env.INSTALL_SETUP_SECRET || '').trim();
  const providedSecret = (req.get('X-Install-Setup-Secret') || '').trim();

  if (expectedSecret) {
    if (!providedSecret) {
      return res
        .status(403)
        .json({ message: 'Installer locked.', code: 'INSTALL_LOCKED' });
    }
    if (providedSecret !== expectedSecret) {
      return res
        .status(403)
        .json({ message: 'Installer locked.', code: 'INSTALL_LOCKED' });
    }
  }

  return verifyToken(req, res, () => isAdmin(req, res, next));
};

router.use(isInstallerEnabled, requireInstallerAccess);

router.get(
  '/prereqs',
  validate({ query: z.object({}).strict() }),
  controller.checkPrereqs,
);

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
