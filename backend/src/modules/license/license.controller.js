const service = require('./license.service');
const { validatePurchaseCode } = require('../../services/licenseService');

/**
 * POST /api/license/verify
 * Validate a purchase code during installation.
 */
exports.verifyPurchaseCode = async (req, res, next) => {
  const { purchase_code, domain } = req.body;
  try {
    if (!purchase_code) {
      return res.status(400).json({ error: 'Purchase code required' });
    }

    const result = await validatePurchaseCode(purchase_code, domain);
    if (result.valid) {
      return res.json({ success: true, message: result.message });
    }

    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/license/activate
 * Activate a license after verifying purchase code via Envato API.
 */
exports.activateLicense = async (req, res, next) => {
  const { purchase_code, domain, email, ip } = req.body;
  try {
    const result = await validatePurchaseCode(purchase_code, domain, { persist: true });
    if (!result?.valid) {
      return res.status(400).json({ success: false, message: result?.message || 'Invalid purchase code' });
    }

    const license = await service.activate({ purchase_code, domain, email, ip });
    await service.logAction(license.id, 'activate', { ip, domain, status: 'success' });

    res.json({ success: true, data: license, message: result.message });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/license/validate
 * Validate license and domain during routine checks.
 */
exports.validateLicense = async (req, res, next) => {
  const { purchase_code, domain, ip } = req.body;
  try {
    const license = await service.findByCode(purchase_code);
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }
    if (license.domain !== domain) {
      await service.markSuspicious(license.id, 'domain_mismatch', `Expected ${license.domain} but got ${domain}`);
      await service.logAction(license.id, 'validate', { ip, domain, status: 'domain_mismatch' });
      return res.status(403).json({ message: 'Domain mismatch' });
    }
    await service.update(license.id, { last_check: new Date() });
    await service.logAction(license.id, 'validate', { ip, domain, status: 'success' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/license/deactivate
 * Deactivate a license when moving installations.
 */
exports.deactivateLicense = async (req, res, next) => {
  const { purchase_code, domain } = req.body;
  try {
    const license = await service.findByCode(purchase_code);
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }
    await service.update(license.id, { status: 'inactive' });
    await service.logAction(license.id, 'deactivate', {
      status: 'success',
      domain: domain || license.domain,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/license/logs
 * List license logs for admin dashboard.
 */
exports.listLogs = async (_req, res, next) => {
  try {
    const logs = await service.listLogs();
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/license/status
 * Return current license status and suspicious count.
 */
exports.getStatus = async (_req, res, next) => {
  try {
    const status = await service.getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
};
