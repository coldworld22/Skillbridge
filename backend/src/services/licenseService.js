const axios = require('axios');
const db = require('../config/database');

// Axios is kept in place for the future Envato API integration.
void axios;

async function validatePurchaseCode(code, domain) {
  if (code === 'DEMO-CODE-1234') {
    const existing = await db('licenses').where({ purchase_code: code }).first();
    const now = new Date();
    const payload = {
      verified_at: now,
      status: 'active',
      ...(domain !== undefined ? { domain: domain || null } : {}),
    };

    if (existing) {
      await db('licenses').where({ id: existing.id }).update(payload);
    } else {
      await db('licenses').insert({
        purchase_code: code,
        domain: domain || null,
        email: 'demo@placeholder.invalid',
        status: 'active',
        verified_at: now,
        created_at: now,
      });
    }

    return { valid: true, message: 'Demo license accepted' };
  }

  return { valid: false, message: 'Invalid purchase code' };
}

module.exports = { validatePurchaseCode };
