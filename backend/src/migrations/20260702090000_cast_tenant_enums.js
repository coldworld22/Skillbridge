/**
 * Normalize and cast tenant-aware status/role columns to enum types.
 * This fixes older deployments where the columns were text and allowed
 * out-of-range values, which blocked subscription/tenant state enforcement.
 */

async function ensureEnumTypes(knex) {
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active','disabled');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE membership_role AS ENUM ('tenant_admin','instructor','student');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE membership_status AS ENUM ('active','pending','revoked');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_state') THEN
        CREATE TYPE subscription_state AS ENUM ('trial','active','grace','suspended','cancelled');
      END IF;
    END$$;
  `);
}

exports.up = async function up(knex) {
  await ensureEnumTypes(knex);

  await knex.transaction(async (trx) => {
    if (await trx.schema.hasTable("users")) {
      await trx.raw(`
        UPDATE users
        SET status = 'active'
        WHERE status IS NULL OR status NOT IN ('active','disabled');
      `);
      await trx.raw(`
        ALTER TABLE users ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE users ALTER COLUMN status TYPE user_status USING status::user_status;
        ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
        ALTER TABLE users ALTER COLUMN status SET NOT NULL;
      `);
    }

    if (await trx.schema.hasTable("tenant_memberships")) {
      await trx.raw(`
        UPDATE tenant_memberships
        SET role = 'tenant_admin'
        WHERE role IS NULL OR role NOT IN ('tenant_admin','instructor','student');
        UPDATE tenant_memberships
        SET status = 'active'
        WHERE status IS NULL OR status NOT IN ('active','pending','revoked');
      `);
      await trx.raw(`
        ALTER TABLE tenant_memberships ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE tenant_memberships ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE tenant_memberships ALTER COLUMN role TYPE membership_role USING role::membership_role;
        ALTER TABLE tenant_memberships ALTER COLUMN role SET DEFAULT 'tenant_admin';
        ALTER TABLE tenant_memberships ALTER COLUMN role SET NOT NULL;
        ALTER TABLE tenant_memberships ALTER COLUMN status TYPE membership_status USING status::membership_status;
        ALTER TABLE tenant_memberships ALTER COLUMN status SET DEFAULT 'active';
        ALTER TABLE tenant_memberships ALTER COLUMN status SET NOT NULL;
      `);
    }

    if (await trx.schema.hasTable("tenants")) {
      await trx.raw(`
        UPDATE tenants
        SET status = 'active'
        WHERE status IS NULL OR status NOT IN ('trial','active','grace','suspended','cancelled');
      `);
      await trx.raw(`
        ALTER TABLE tenants ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE tenants ALTER COLUMN status TYPE subscription_state USING status::subscription_state;
        ALTER TABLE tenants ALTER COLUMN status SET DEFAULT 'active';
        ALTER TABLE tenants ALTER COLUMN status SET NOT NULL;
      `);
    }
  });
};

exports.down = async function down(knex) {
  await knex.transaction(async (trx) => {
    if (await trx.schema.hasTable("users")) {
      await trx.raw(`
        ALTER TABLE users
        ALTER COLUMN status DROP NOT NULL,
        ALTER COLUMN status DROP DEFAULT,
        ALTER COLUMN status TYPE text USING status::text;
      `);
    }

    if (await trx.schema.hasTable("tenant_memberships")) {
      await trx.raw(`
        ALTER TABLE tenant_memberships
        ALTER COLUMN role DROP NOT NULL,
        ALTER COLUMN role DROP DEFAULT,
        ALTER COLUMN role TYPE text USING role::text,
        ALTER COLUMN status DROP NOT NULL,
        ALTER COLUMN status DROP DEFAULT,
        ALTER COLUMN status TYPE text USING status::text;
      `);
    }

    if (await trx.schema.hasTable("tenants")) {
      await trx.raw(`
        ALTER TABLE tenants
        ALTER COLUMN status DROP NOT NULL,
        ALTER COLUMN status DROP DEFAULT,
        ALTER COLUMN status TYPE text USING status::text;
      `);
    }
  });
};

// Run outside the global migration transaction since we manage our own.
exports.config = { transaction: false };
