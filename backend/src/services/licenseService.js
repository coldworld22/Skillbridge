const axios = require('axios');
const db = require('../config/database');

async function validatePurchaseCode(code, domain) {
  if (!code) {
    throw new Error('Purchase code is required');
  }

  if (code === 'DEMO-CODE-1234') {
    const verifiedAt = new Date();
    const normalizedDomain = typeof domain === 'string' && domain.trim() !== ''
      ? domain.trim()
      : null;

    const existing = await db('licenses').where({ purchase_code: code }).first();

    const updatePayload = {
      verified_at: verifiedAt,
      status: 'active',
    };

    if (typeof domain !== 'undefined') {
      updatePayload.domain = normalizedDomain;
    }

    if (existing) {
      await db('licenses').where({ id: existing.id }).update(updatePayload);
    } else {
      await db('licenses').insert({
        purchase_code: code,
        domain: normalizedDomain,
        email: null,
        ip: null,
        status: 'active',
        verified_at: verifiedAt,
      });
    }

    return { valid: true, message: 'Demo license accepted' };
  }

  return { valid: false, message: 'Invalid purchase code' };
}

module.exports = { validatePurchaseCode };
