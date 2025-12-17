exports.up = async function (knex) {
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'online_classes_access_type_enum'
      ) THEN
        CREATE TYPE online_classes_access_type_enum AS ENUM ('paid', 'free');
      END IF;
    END
    $$;
  `);

  await knex.schema.raw(`
    ALTER TABLE online_classes
    ADD COLUMN IF NOT EXISTS access_type online_classes_access_type_enum
    NOT NULL DEFAULT 'paid';
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(
    'ALTER TABLE online_classes DROP COLUMN IF EXISTS access_type;'
  );
  await knex.schema.raw(
    'DROP TYPE IF EXISTS online_classes_access_type_enum;'
  );
};
