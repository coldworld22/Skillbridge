const axios = require('axios');
const db = require('../config/database');

async function validatePurchaseCode(code, domain) {
  const trimmedCode = code ? code.trim() : '';
  const normalizedDomain = domain ? domain.trim() || null : null;

  if (!trimmedCode) {
    return { valid: false, message: 'Purchase code required' };
  }

  if (trimmedCode === 'DEMO-CODE-1234') {
    const now = new Date();
    const existing = await db('licenses').where({ purchase_code: trimmedCode }).first();

    const licenseData = {
      domain: normalizedDomain,
      verified_at: now,
      status: 'active',
      last_check: now,
    };

    if (existing) {
      await db('licenses').where({ id: existing.id }).update(licenseData);
    } else {
      await db('licenses').insert({ purchase_code: trimmedCode, ...licenseData });
    }

    return { valid: true, message: 'Demo license accepted' };
  }

  // FUTURE: replace with Envato API call
  // const response = await axios.get(
  //   `https://api.envato.com/v3/market/author/sale?code=${trimmedCode}`,
  //   { headers: { Authorization: `Bearer ${process.env.ENVATO_TOKEN}` } }
  // );

  return { valid: false, message: 'Invalid purchase code' };
}

module.exports = { validatePurchaseCode };
