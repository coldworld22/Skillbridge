/**
 * Make instructor_wallets tenant-scoped by switching to a composite primary key
 * and backfilling tenant_id for existing rows.
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
  const hasWallets = await knex.schema.hasTable("instructor_wallets");
  if (!hasWallets) return;

  await knex.transaction(async (trx) => {
    const hasTenants = await trx.schema.hasTable("tenants");
    const hasMemberships = await trx.schema.hasTable("tenant_memberships");
    if (!hasTenants || !hasMemberships) {
      throw new Error("tenants and tenant_memberships tables must exist before scoping instructor_wallets");
    }

    const hasTenantId = await trx.schema.hasColumn("instructor_wallets", "tenant_id");
    if (!hasTenantId) {
      await trx.schema.alterTable("instructor_wallets", (table) => {
        table.uuid("tenant_id");
      });
    }

    const fallbackTenantId = await ensureDefaultTenant(trx);

    await trx.raw(`
      UPDATE instructor_wallets w
      SET tenant_id = tm.tenant_id
      FROM tenant_memberships tm
      WHERE w.instructor_id = tm.user_id
        AND tm.status = 'active'
        AND w.tenant_id IS NULL
    `);

    if (fallbackTenantId) {
      await trx("instructor_wallets").whereNull("tenant_id").update({ tenant_id: fallbackTenantId });
    }

    await trx.raw(`
      ALTER TABLE instructor_wallets
      DROP CONSTRAINT IF EXISTS instructor_wallets_pkey;
    `);

    await trx.raw(`
      ALTER TABLE instructor_wallets
      ALTER COLUMN tenant_id SET NOT NULL;
    `);

    await trx.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'instructor_wallets'
            AND constraint_name = 'instructor_wallets_tenant_fk'
        ) THEN
          ALTER TABLE instructor_wallets
          ADD CONSTRAINT instructor_wallets_tenant_fk
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await trx.raw(`
      ALTER TABLE instructor_wallets
      ADD CONSTRAINT instructor_wallets_pkey PRIMARY KEY (tenant_id, instructor_id);
    `);
  });
};

exports.down = async function down(knex) {
  const hasWallets = await knex.schema.hasTable("instructor_wallets");
  if (!hasWallets) return;

  await knex.transaction(async (trx) => {
    await trx.raw(`
      ALTER TABLE instructor_wallets
      DROP CONSTRAINT IF EXISTS instructor_wallets_pkey;
    `);

    await trx.raw(`
      ALTER TABLE instructor_wallets
      ADD CONSTRAINT instructor_wallets_pkey PRIMARY KEY (instructor_id);
    `);

    await trx.raw(`
      ALTER TABLE instructor_wallets
      DROP CONSTRAINT IF EXISTS instructor_wallets_tenant_fk;
    `);

    const hasTenantId = await trx.schema.hasColumn("instructor_wallets", "tenant_id");
    if (hasTenantId) {
      await trx.raw(`
        ALTER TABLE instructor_wallets
        ALTER COLUMN tenant_id DROP NOT NULL;
      `);
    }
  });
};

// Run outside the global migration transaction since we manage our own.
exports.config = { transaction: false };
