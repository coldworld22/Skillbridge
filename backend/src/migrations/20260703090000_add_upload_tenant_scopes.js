/**
 * Ensure upload-related tables have tenant_id set for multitenancy:
 * - users (avatars)
 * - payments (receipts)
 * - admin_profiles/student_profiles (identity docs)
 * - messages (chat DMs)
 */

const TABLES = {
  users: {
    userColumn: "id",
    nullable: true,
    onDelete: "SET NULL",
  },
  payments: {
    userColumn: "user_id",
    nullable: false,
    onDelete: "CASCADE",
  },
  admin_profiles: {
    userColumn: "user_id",
    nullable: false,
    onDelete: "CASCADE",
  },
  student_profiles: {
    userColumn: "user_id",
    nullable: false,
    onDelete: "CASCADE",
  },
  messages: {
    senderColumn: "sender_id",
    receiverColumn: "receiver_id",
    nullable: false,
    onDelete: "CASCADE",
  },
};

const getFallbackTenantId = async (knex) => {
  const hasTenants = await knex.schema.hasTable("tenants");
  if (!hasTenants) return null;
  const row = await knex("tenants").select("id").orderBy("created_at", "asc").first();
  return row?.id || null;
};

const ensureTenantColumn = async (knex, tableName) => {
  const hasTable = await knex.schema.hasTable(tableName);
  if (!hasTable) return false;
  const hasTenantId = await knex.schema.hasColumn(tableName, "tenant_id");
  if (!hasTenantId) {
    await knex.schema.alterTable(tableName, (table) => {
      table.uuid("tenant_id").nullable();
    });
  }
  return true;
};

const backfillFromMemberships = async (knex, tableName, config) => {
  const hasMemberships = await knex.schema.hasTable("tenant_memberships");
  if (!hasMemberships) return;

  if (config.senderColumn && config.receiverColumn) {
    await knex.raw(
      `
        UPDATE ${tableName} AS t
        SET tenant_id = COALESCE(
          (
            SELECT tm.tenant_id
            FROM tenant_memberships tm
            WHERE tm.user_id = t.${config.senderColumn}
            ORDER BY tm.created_at ASC
            LIMIT 1
          ),
          (
            SELECT tm.tenant_id
            FROM tenant_memberships tm
            WHERE tm.user_id = t.${config.receiverColumn}
            ORDER BY tm.created_at ASC
            LIMIT 1
          )
        )
        WHERE t.tenant_id IS NULL
      `,
    );
    return;
  }

  const userColumn = config.userColumn;
  if (!userColumn) return;
  await knex.raw(
    `
      UPDATE ${tableName} AS t
      SET tenant_id = tm.tenant_id
      FROM LATERAL (
        SELECT tenant_id
        FROM tenant_memberships
        WHERE user_id = t.${userColumn}
        ORDER BY created_at ASC
        LIMIT 1
      ) tm
      WHERE t.tenant_id IS NULL AND tm.tenant_id IS NOT NULL
    `,
  );
};

const backfillFallbackTenant = async (knex, tableName, fallbackTenantId) => {
  if (!fallbackTenantId) return;
  await knex(tableName)
    .whereNull("tenant_id")
    .update({ tenant_id: fallbackTenantId });
};

const addTenantConstraints = async (knex, tableName, config) => {
  const hasTenants = await knex.schema.hasTable("tenants");
  if (!hasTenants) return;
  if (!config.nullable) {
    await knex.schema.alterTable(tableName, (table) => {
      table.uuid("tenant_id").notNullable().alter();
    });
  }
  const constraintName = `${tableName}_tenant_id_foreign`;
  await knex.raw(
    `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
      ) THEN
        ALTER TABLE ${tableName}
          ADD CONSTRAINT ${constraintName}
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE ${config.onDelete};
      END IF;
    END$$;
    `,
  );
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS ${tableName}_tenant_idx ON ${tableName}(tenant_id);`,
  );
};

exports.up = async function up(knex) {
  const fallbackTenantId = await getFallbackTenantId(knex);

  for (const [tableName, config] of Object.entries(TABLES)) {
    const exists = await ensureTenantColumn(knex, tableName);
    if (!exists) continue;

    await backfillFromMemberships(knex, tableName, config);
    await backfillFallbackTenant(knex, tableName, fallbackTenantId);
    await addTenantConstraints(knex, tableName, config);
  }
};

exports.down = async function down(knex) {
  for (const tableName of Object.keys(TABLES)) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (!hasTable) continue;
    const hasColumn = await knex.schema.hasColumn(tableName, "tenant_id");
    if (!hasColumn) continue;

    await knex.raw(`DROP INDEX IF EXISTS ${tableName}_tenant_idx;`);
    await knex.raw(
      `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_tenant_id_foreign;`,
    );
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn("tenant_id");
    });
  }
};
