const axios = require('axios');
const db = require('../config/database');
let hasEmailColumnCache;
async function hasEmailColumn() {
  if (typeof hasEmailColumnCache === 'boolean') {
    return hasEmailColumnCache;
  }
  try {
    hasEmailColumnCache = await db.schema.hasColumn('licenses', 'email');
  } catch (error) {
    hasEmailColumnCache = false;
  }
  return hasEmailColumnCache;
}

async function validatePurchaseCode(code, domain) {
  if (code === 'DEMO-CODE-1234') {
    const now = new Date();
    const existing = await db('licenses').where({ purchase_code: code }).first();
    const payload = {
      purchase_code: code,
      domain: domain || null,
      verified_at: now,
      status: 'active',
    };

    if (await hasEmailColumn()) {
      payload.email = 'demo@example.com';
    }

    if (existing) {
      await db('licenses').where({ id: existing.id }).update(payload);
    } else {
      await db('licenses').insert(payload);
    }

    return { valid: true, message: 'Demo license accepted' };
  }

  // const response = await axios.get(
  //   `https://api.envato.com/v3/market/author/sale?code=${code}`,
  //   { headers: { Authorization: `Bearer ${process.env.ENVATO_TOKEN}` } }
  // );
  return { valid: false, message: 'Invalid purchase code' };
}

module.exports = { validatePurchaseCode };
