const db = require('../../config/database');

exports.activate = async ({ purchase_code, domain, email, ip }) => {
  const existing = await db('licenses').where({ purchase_code }).first();
  if (existing) {
    await db('licenses')
      .where({ id: existing.id })
      .update({ domain, email, ip, status: 'active', last_check: db.fn.now() });
    return { ...existing, domain, email, ip, status: 'active' };
  }
  const [license] = await db('licenses')
    .insert({ purchase_code, domain, email, ip, status: 'active' })
    .returning('*');
  return license;
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
