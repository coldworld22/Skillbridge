const db = require('../../config/database');

const normaliseDomain = (domain) => {
  if (typeof domain !== 'string') {
    return domain === undefined ? undefined : null;
  }
  const trimmed = domain.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

const normaliseEmail = (email) => {
  if (typeof email !== 'string') {
    return email;
  }
  return email.trim();
};

exports.activate = async ({ purchase_code, domain, email, ip }) => {
  const updatePayload = { status: 'active', last_check: db.fn.now() };
  if (domain !== undefined) {
    updatePayload.domain = domain;
  }
  if (email !== undefined) {
    updatePayload.email = email;
  }
  if (ip !== undefined) {
    updatePayload.ip = ip;
  }

  const existing = await db('licenses').where({ purchase_code }).first();
  const normalisedIp = typeof ip === 'string' ? ip.trim() : ip;
  const payload = {
    domain: normaliseDomain(domain),
    email: normaliseEmail(email),
    ip: normalisedIp && normalisedIp.length ? normalisedIp : null,
    status: 'active',
    last_check: new Date(),
  };

  if (existing) {
    await db('licenses').where({ id: existing.id }).update(updatePayload);
    return db('licenses').where({ id: existing.id }).first();
  }

  const insertPayload = {
    purchase_code,
    status: 'active',
    last_check: db.fn.now(),
  };
  if (domain !== undefined) {
    insertPayload.domain = domain;
  }
  if (email !== undefined) {
    insertPayload.email = email;
  }
  if (ip !== undefined) {
    insertPayload.ip = ip;
  }

  const inserted = await db('licenses').insert(insertPayload).returning('id');

  let licenseId;
  if (Array.isArray(inserted) && inserted.length > 0) {
    const value = inserted[0];
    if (value && typeof value === 'object') {
      licenseId = value.id ?? value;
    } else {
      licenseId = value;
    }
  } else if (inserted && typeof inserted === 'object') {
    licenseId = inserted.id ?? inserted;
  } else {
    licenseId = inserted;
  }

  if (!licenseId) {
    return db('licenses').where({ purchase_code }).orderBy('id', 'desc').first();
  }

  return db('licenses').where({ id: licenseId }).first();
};

exports.findByCode = (purchase_code) =>
  db('licenses').where({ purchase_code }).first();

exports.update = (id, data) => db('licenses').where({ id }).update(data);

exports.logAction = (license_id, action, { ip, domain, device, status }) =>
  db('license_logs').insert({ license_id, action, ip, domain, device, status });

exports.markSuspicious = (license_id, issue, details, severity = 'medium') =>
  db('suspicious_logs').insert({ license_id, issue, details, severity });

exports.listLogs = () =>
  db('license_logs as l')
    .leftJoin('licenses as lic', 'l.license_id', 'lic.id')
    .select(
      'l.id',
      'l.action',
      'l.ip',
      'l.domain',
      'l.device',
      'l.status',
      'l.timestamp',
      'lic.purchase_code'
    )
    .orderBy('l.timestamp', 'desc');

exports.getStatus = async () => {
  const license = await db('licenses').first();
  if (!license) return null;
  const [{ count }] = await db('suspicious_logs')
    .where({ license_id: license.id })
    .count('id as count');
  return {
    ...license,
    unauthorized_count: Number(count) || 0,
  };
};
