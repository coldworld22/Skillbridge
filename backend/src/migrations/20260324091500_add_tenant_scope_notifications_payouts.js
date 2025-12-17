/**
 * Ensure tenant scoping for notifications, payouts, and instructor wallets.
 * - Creates minimal tenant tables when missing
 * - Backfills tenant_id using active memberships
 * - Enforces NOT NULL + FK constraints and tenant indexes
 */

const TABLES_TO_SCOPE = [
  { table: "notifications", userColumn: "user_id" },
  { table: "payouts", userColumn: "instructor_id" },
  { table: "instructor_wallets", userColumn: "instructor_id" },
];

async function ensureTenantTables(trx) {
  const hasTenants = await trx.schema.hasTable("tenants");
  if (!hasTenants) {
    await trx.schema.createTable("tenants", (table) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(trx.raw("uuid_generate_v4()"));
      table.text("name").notNullable();
      table.text("slug").notNullable().unique();
      table.text("status").notNullable().defaultTo("active");
      table
        .uuid("plan_id")
        .references("id")
        .inTable("plans")
        .onDelete("SET NULL");
      table.jsonb("branding").notNullable().defaultTo({});
      table.timestamps(true, true);
    });
  }

  const hasMemberships = await trx.schema.hasTable("tenant_memberships");
  if (!hasMemberships) {
    await trx.schema.createTable("tenant_memberships", (table) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(trx.raw("uuid_generate_v4()"));
      table
        .uuid("tenant_id")
        .notNullable()
        .references("id")
        .inTable("tenants")
        .onDelete("CASCADE");
      table
        .uuid("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("role").notNullable().defaultTo("tenant_admin");
      table.text("status").notNullable().defaultTo("active");
      table.uuid("invited_by").references("id").inTable("users");
      table.timestamps(true, true);
      table.unique(["tenant_id", "user_id"]);
      table.index(["user_id"]);
      table.index(["tenant_id", "role"]);
    });
  }

  const hasDomains = await trx.schema.hasTable("tenant_domains");
  if (!hasDomains) {
    await trx.schema.createTable("tenant_domains", (table) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(trx.raw("uuid_generate_v4()"));
      table
        .uuid("tenant_id")
        .notNullable()
        .references("id")
        .inTable("tenants")
        .onDelete("CASCADE");
      table.text("domain").notNullable().unique();
      table.text("status").notNullable().defaultTo("pending");
      table.text("verification_token").notNullable();
      table.timestamp("verified_at");
      table.timestamps(true, true);
      table.index(["domain"]);
    });
  }
}

async function ensureDefaultTenant(trx) {
  const existing = await trx("tenants").first("id");
  if (existing?.id) return existing.id;

  const [plan] = await trx("plans")
    .insert({
      name: "Legacy",
      slug: "default-tenant-plan",
      price_monthly: 0,
      price_yearly: 0,
      currency: "USD",
      recommended: false,
      active: true,
      target_role: "student",
    })
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

async function backfillTenant(trx, table, userColumn, fallbackTenantId) {
  const hasTenantId = await trx.schema.hasColumn(table, "tenant_id");
  if (!hasTenantId) {
    await trx.schema.alterTable(table, (tbl) => {
      tbl.uuid("tenant_id");
    });
  }

  // Prefer active membership matches when available
  await trx.raw(
    `
    UPDATE ${table} AS t
    SET tenant_id = tm.tenant_id
    FROM tenant_memberships tm
    WHERE t.${userColumn} = tm.user_id
      AND tm.status = 'active'
      AND t.tenant_id IS NULL
  `
  );

  if (fallbackTenantId) {
    await trx(table).whereNull("tenant_id").update({ tenant_id: fallbackTenantId });
  }

  await trx.raw(
    `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = '${table}' AND constraint_name = '${table}_tenant_fk'
      ) THEN
        ALTER TABLE ${table}
        ADD CONSTRAINT ${table}_tenant_fk
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
      END IF;
    END$$;
  `
  );

  await trx.schema.alterTable(table, (tbl) => {
    tbl.uuid("tenant_id").notNullable().alter();
  });

  await trx.raw(
    `CREATE INDEX IF NOT EXISTS ${table}_tenant_idx ON ${table}(tenant_id);`
  );

  if (table === "instructor_wallets") {
    await trx.raw(
      `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'instructor_wallets' AND indexname = 'instructor_wallets_tenant_instructor_unique'
        ) THEN
          CREATE UNIQUE INDEX instructor_wallets_tenant_instructor_unique
          ON instructor_wallets (tenant_id, instructor_id);
        END IF;
      END$$;
    `
    );
  }
}

exports.up = async (knex) => {
  await knex.transaction(async (trx) => {
    await ensureTenantTables(trx);
    const fallbackTenantId = await ensureDefaultTenant(trx);

    for (const entry of TABLES_TO_SCOPE) {
      await backfillTenant(trx, entry.table, entry.userColumn, fallbackTenantId);
    }
  });
};

exports.down = async (knex) => {
  await knex.transaction(async (trx) => {
    for (const entry of TABLES_TO_SCOPE) {
      const hasTenantId = await trx.schema.hasColumn(entry.table, "tenant_id");
      if (hasTenantId) {
        await trx.raw(
          `ALTER TABLE ${entry.table} DROP CONSTRAINT IF EXISTS ${entry.table}_tenant_fk;`
        );
        await trx.raw(
          `DROP INDEX IF EXISTS ${entry.table}_tenant_idx;`
        );
        if (entry.table === "instructor_wallets") {
          await trx.raw(
            `DROP INDEX IF EXISTS instructor_wallets_tenant_instructor_unique;`
          );
        }
        await trx.schema.alterTable(entry.table, (tbl) => {
          tbl.dropColumn("tenant_id");
        });
      }
    }
  });
};
