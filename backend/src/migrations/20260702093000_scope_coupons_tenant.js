/**
 * Scope coupons to tenants and enforce uniqueness per tenant.
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
  const hasCoupons = await knex.schema.hasTable("coupons");
  if (!hasCoupons) return;

  await knex.transaction(async (trx) => {
    const hasTenants = await trx.schema.hasTable("tenants");
    if (!hasTenants) {
      throw new Error("tenants table must exist before scoping coupons");
    }

    const hasTenantId = await trx.schema.hasColumn("coupons", "tenant_id");
    if (!hasTenantId) {
      await trx.schema.alterTable("coupons", (table) => {
        table.uuid("tenant_id");
      });
    }

    const hasMemberships = await trx.schema.hasTable("tenant_memberships");
    if (hasMemberships) {
      await trx.raw(`
        UPDATE coupons c
        SET tenant_id = tm.tenant_id
        FROM tenant_memberships tm
        WHERE c.instructor_id = tm.user_id
          AND tm.status = 'active'
          AND c.tenant_id IS NULL
      `);
    }

    const fallbackTenantId = await ensureDefaultTenant(trx);
    if (fallbackTenantId) {
      await trx("coupons")
        .whereNull("tenant_id")
        .update({ tenant_id: fallbackTenantId });
    }

    await trx.raw(`
      ALTER TABLE coupons
      ALTER COLUMN tenant_id SET NOT NULL;
    `);

    await trx.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'coupons'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name IN ('coupons_tenant_fk','coupons_tenant_id_foreign')
        ) THEN
          ALTER TABLE coupons
          ADD CONSTRAINT coupons_tenant_fk
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await trx.raw(`ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_code_unique;`);

    await trx.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'coupons_tenant_code_unique'
        ) THEN
          ALTER TABLE coupons
          ADD CONSTRAINT coupons_tenant_code_unique UNIQUE (tenant_id, code);
        END IF;
      END$$;
    `);

    await trx.raw(`
      CREATE INDEX IF NOT EXISTS coupons_tenant_idx ON coupons(tenant_id);
    `);
  });
};

exports.down = async function down(knex) {
  const hasCoupons = await knex.schema.hasTable("coupons");
  if (!hasCoupons) return;

  await knex.transaction(async (trx) => {
    await trx.raw(`
      ALTER TABLE coupons
      DROP CONSTRAINT IF EXISTS coupons_tenant_code_unique;
    `);
    await trx.raw(`DROP INDEX IF EXISTS coupons_tenant_idx;`);

    await trx.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'coupons_code_unique'
        ) THEN
          ALTER TABLE coupons
          ADD CONSTRAINT coupons_code_unique UNIQUE (code);
        END IF;
      END$$;
    `);

    await trx.raw(`
      ALTER TABLE coupons
      DROP CONSTRAINT IF EXISTS coupons_tenant_fk,
      DROP CONSTRAINT IF EXISTS coupons_tenant_id_foreign;
    `);

    const hasTenantId = await trx.schema.hasColumn("coupons", "tenant_id");
    if (hasTenantId) {
      await trx.raw(`
        ALTER TABLE coupons
        ALTER COLUMN tenant_id DROP NOT NULL;
      `);
    }
  });
};

// Run outside the global migration transaction since we manage our own.
exports.config = { transaction: false };
