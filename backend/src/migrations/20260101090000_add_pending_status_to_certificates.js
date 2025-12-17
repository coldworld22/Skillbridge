const hasStatusEnum = async (knex) => {
  const { rows } = await knex.raw(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_type
      WHERE typname = 'certificates_status_enum'
    ) as exists;
  `);
  return rows?.[0]?.exists;
};

exports.up = async function up(knex) {
  if (await hasStatusEnum(knex)) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'certificates_status_enum'
            AND e.enumlabel = 'pending'
        ) THEN
          ALTER TYPE certificates_status_enum ADD VALUE 'pending';
        END IF;
      END$$;
    `);
    return;
  }

  await knex.raw(`
    ALTER TABLE certificates
    DROP CONSTRAINT IF EXISTS certificates_status_check;
  `);
  await knex.raw(`
    ALTER TABLE certificates
    ADD CONSTRAINT certificates_status_check
    CHECK (status = ANY (ARRAY['issued', 'revoked', 'pending']));
  `);
};

exports.down = async function down(knex) {
  await knex('certificates')
    .where({ status: 'pending' })
    .update({ status: 'issued' });

  if (await hasStatusEnum(knex)) {
    await knex.raw(`
      ALTER TYPE certificates_status_enum RENAME TO certificates_status_enum_old;
      CREATE TYPE certificates_status_enum AS ENUM ('issued', 'revoked');
      ALTER TABLE certificates
        ALTER COLUMN status
        TYPE certificates_status_enum
        USING status::text::certificates_status_enum;
      DROP TYPE certificates_status_enum_old;
    `);
    return;
  }

  await knex.raw(`
    ALTER TABLE certificates
    DROP CONSTRAINT IF EXISTS certificates_status_check;
  `);
  await knex.raw(`
    ALTER TABLE certificates
    ADD CONSTRAINT certificates_status_check
    CHECK (status = ANY (ARRAY['issued', 'revoked']));
  `);
};
