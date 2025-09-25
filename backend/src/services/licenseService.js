const axios = require('axios');
const db = require('../config/database');

const ENVATO_SALE_URL = 'https://api.envato.com/v3/market/author/sale';
const PLACEHOLDER_EMAIL = 'license@placeholder.invalid';

const normaliseDomain = (domain) => {
  if (typeof domain !== 'string') {
    return domain === undefined ? undefined : null;
  }
  const trimmed = domain.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const upsertLicense = async (purchaseCode, { domain, email, verifiedAt }) => {
  const existing = await db('licenses').where({ purchase_code: purchaseCode }).first();
  const payload = {
    verified_at: verifiedAt,
    status: 'active',
  };

  if (domain !== undefined) {
    payload.domain = domain;
  }

  if (email && (!existing || !existing.email)) {
    payload.email = email;
  }

  if (existing) {
    await db('licenses').where({ id: existing.id }).update(payload);
    return existing.id;
  }

  await db('licenses').insert({
    purchase_code: purchaseCode,
    domain: domain ?? null,
    email: email || PLACEHOLDER_EMAIL,
    status: 'active',
    verified_at: verifiedAt,
  });

  const inserted = await db('licenses').where({ purchase_code: purchaseCode }).first();
  return inserted?.id;
};

async function validatePurchaseCode(code, domain) {
  const verifiedAt = new Date();
  const normalisedDomain = normaliseDomain(domain);
  const token = process.env.ENVATO_TOKEN;

  if (token) {
    try {
      const { data } = await axios.get(`${ENVATO_SALE_URL}?code=${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data || data.error || !data.item) {
        return { valid: false, message: 'Invalid purchase code' };
      }

      const envatoEmail = typeof data?.buyer_email === 'string' ? data.buyer_email : null;
      const licenseId = await upsertLicense(code, {
        domain: normalisedDomain,
        email: envatoEmail,
        verifiedAt,
      });

      return { valid: true, message: 'License verified with Envato', licenseId };
    } catch (error) {
      if (error?.response?.status === 404) {
        return { valid: false, message: 'Invalid purchase code' };
      }

      return {
        valid: false,
        message: 'Unable to verify purchase code with Envato. Please try again later.',
      };
    }
  }

  if (code === 'DEMO-CODE-1234') {
    const licenseId = await upsertLicense(code, {
      domain: normalisedDomain,
      email: PLACEHOLDER_EMAIL,
      verifiedAt,
    });

    return { valid: true, message: 'Demo license accepted', licenseId };
  }

  return { valid: false, message: 'Invalid purchase code' };
}

module.exports = { validatePurchaseCode };
