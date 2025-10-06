const axios = require('axios');
const db = require('../config/database');

const ENVATO_SALE_URL = 'https://api.envato.com/v3/market/author/sale';
const PLACEHOLDER_EMAIL = 'license@placeholder.invalid';

const parseTruthy = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const isDemoBypassEnabled = () => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return parseTruthy(process.env.LICENSE_DEMO_BYPASS);
};

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

async function validatePurchaseCode(code, domain, options = {}) {
  const verifiedAt = new Date();
  const normalisedDomain = normaliseDomain(domain);
  const token = process.env.ENVATO_TOKEN;
  const shouldPersist = options.persist ?? (typeof normalisedDomain === 'string' && normalisedDomain.length > 0);
  let licenseId = null;

  if (token) {
    try {
      let licenseId = null;
      const { data } = await axios.get(`${ENVATO_SALE_URL}?code=${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data || data.error || !data.item) {
        return { valid: false, message: 'Invalid purchase code', licenseId: null };
      }

      const envatoEmail = typeof data?.buyer_email === 'string' ? data.buyer_email : null;
      if (shouldPersist) {
        licenseId = await upsertLicense(code, {
          domain: normalisedDomain,
          email: envatoEmail,
          verifiedAt,
        });
      }

      return { valid: true, message: 'License verified with Envato', licenseId };
    } catch (error) {
      if (error?.response?.status === 404) {
        return { valid: false, message: 'Invalid purchase code', licenseId: null };
      }

      return {
        valid: false,
        message: 'Unable to verify purchase code with Envato. Please try again later.',
        licenseId: null,
      };
    }
  }

  if (code === 'DEMO-CODE-1234' && isDemoBypassEnabled()) {
    let licenseId = null;
    if (shouldPersist) {
      licenseId = await upsertLicense(code, {
        domain: normalisedDomain,
        email: PLACEHOLDER_EMAIL,
        verifiedAt,
      });
    }

    return { valid: true, message: 'Demo license accepted', licenseId };
  }

  return { valid: false, message: 'Invalid purchase code', licenseId: null };
}

module.exports = { validatePurchaseCode };
