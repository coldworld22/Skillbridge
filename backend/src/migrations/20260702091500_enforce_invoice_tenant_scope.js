/**
 * Fully enforce tenant scoping for invoices even when legacy deployments
 * lacked payments.tenant_id. Backfills from payments and memberships, then
 * falls back to the default tenant before adding NOT NULL + FK.
 */

async function ensureDefaultTenant(trx) {
  const existing = await trx("tenants").where({ slug: "default" }).first("id");
  if (existing?.id) return existing.id;

  const hasPlans = await trx.schema.hasTable("plans");
  if (!hasPlans) {
    throw new Error("plans table is required to create the default tenant plan");
  }

  const hasTargetRole = await trx.schema.hasColumn("plans", "target_role");
  const planPayload = {
    name: "Legacy",
    slug: "default-tenant-plan",
    price_monthly: 0,
    price_yearly: 0,
    currency: "USD",
    recommended: false,
    active: true,
  };
  if (hasTargetRole) {
    planPayload.target_role = "student";
  }

  const [plan] = await trx("plans")
    .insert(planPayload)
    .onConflict("slug")
    .merge()
    .returning("id");

  const planId =
    plan?.id || (await trx("plans").first("id").orderBy("created_at"))?.id;

  const [tenant] = await trx("tenants")
    .insert({
      name: "Default Tenant",
      slug: "default",
      status: "active",
      plan_id: planId || null,
      branding: {},
    })
    .onConflict("slug")
    .merge()
    .returning("id");

  return tenant?.id;
}

exports.up = async function up(knex) {
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (!hasInvoices) return;

  await knex.transaction(async (trx) => {
    const hasTenants = await trx.schema.hasTable("tenants");
    if (!hasTenants) {
      throw new Error("tenants table must exist before enforcing invoice scoping");
    }

    const hasTenantId = await trx.schema.hasColumn("invoices", "tenant_id");
    if (!hasTenantId) {
      await trx.schema.alterTable("invoices", (table) => {
        table.uuid("tenant_id");
      });
    }

    const hasPaymentsTable = await trx.schema.hasTable("payments");
    const hasPaymentsTenant =
      hasPaymentsTable && (await trx.schema.hasColumn("payments", "tenant_id"));
    const hasMemberships = await trx.schema.hasTable("tenant_memberships");

    if (hasPaymentsTenant) {
      await trx.raw(`
        UPDATE invoices i
        SET tenant_id = p.tenant_id
        FROM payments p
        WHERE i.payment_id = p.id
          AND i.tenant_id IS NULL
      `);
    }

    if (hasMemberships) {
      await trx.raw(`
        UPDATE invoices i
        SET tenant_id = tm.tenant_id
        FROM tenant_memberships tm
        WHERE i.user_id = tm.user_id
          AND tm.status = 'active'
          AND i.tenant_id IS NULL
      `);
    }

    const fallbackTenantId = await ensureDefaultTenant(trx);
    if (fallbackTenantId) {
      await trx("invoices").whereNull("tenant_id").update({ tenant_id: fallbackTenantId });
    }

    await trx.raw(`
      ALTER TABLE invoices
      ALTER COLUMN tenant_id SET NOT NULL;
    `);

    await trx.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'invoices'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name IN ('invoices_tenant_fk','invoices_tenant_id_foreign')
        ) THEN
          ALTER TABLE invoices
          ADD CONSTRAINT invoices_tenant_fk
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await trx.raw(`
      CREATE INDEX IF NOT EXISTS invoices_tenant_idx ON invoices(tenant_id);
    `);
  });
};

exports.down = async function down(knex) {
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (!hasInvoices) return;

  await knex.transaction(async (trx) => {
    await trx.raw(`
      DROP INDEX IF EXISTS invoices_tenant_idx;
    `);

    await trx.raw(`
      ALTER TABLE invoices
      DROP CONSTRAINT IF EXISTS invoices_tenant_fk,
      DROP CONSTRAINT IF EXISTS invoices_tenant_id_foreign;
    `);

    const hasTenantId = await trx.schema.hasColumn("invoices", "tenant_id");
    if (hasTenantId) {
      await trx.raw(`
        ALTER TABLE invoices
        ALTER COLUMN tenant_id DROP NOT NULL;
      `);
    }
  });
};

// Run outside the global migration transaction since we manage our own.
exports.config = { transaction: false };
