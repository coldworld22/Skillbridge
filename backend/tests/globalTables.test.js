const fs = require('fs');
const path = require('path');

const GLOBAL_TABLES = [
  'plans',
  'plan_features',
  'tenants',
  'tenant_memberships',
  'tenant_domains',
  'subscriptions',
  'feature_overrides',
  'usage_counters',
  'users',
];

const SQL_PATH = path.join(
  __dirname,
  '..',
  '..',
  'migrations',
  'saas_multitenant.sql'
);

const extractTenantTables = (sql) => {
  const match = sql.match(/tenant_tables\s+TEXT\[]\s*:=\s*ARRAY\[(.*?)\];/s);
  if (!match) {
    throw new Error('tenant_tables array not found in saas_multitenant.sql');
  }

  return match[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/'/g, '').trim());
};

describe('global tables are not tenant-scoped', () => {
  test('tenant_tables excludes global tables', () => {
    const sql = fs.readFileSync(SQL_PATH, 'utf8');
    const tenantTables = extractTenantTables(sql);

    GLOBAL_TABLES.forEach((table) => {
      expect(tenantTables).not.toContain(table);
    });
  });
});
