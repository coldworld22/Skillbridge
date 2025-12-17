exports.up = async function (knex) {
  await knex.schema.raw(`
    DO $$
    DECLARE enum_type text;
    BEGIN
      SELECT format('%I.%I', ns.nspname, t.typname) INTO enum_type
      FROM pg_type t
      JOIN pg_attribute a ON a.atttypid = t.oid
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      WHERE c.relname = 'coupons'
        AND a.attname = 'applies_to'
        AND t.typtype = 'e';

      IF enum_type IS NOT NULL THEN
        EXECUTE format(
          'ALTER TYPE %s ADD VALUE IF NOT EXISTS ''book''' ,
          enum_type
        );
      END IF;
    END $$;
  `);
};

exports.down = async function () {
  // Removing a value from a PostgreSQL enum requires recreating the type,
  // which risks data loss. We intentionally leave this as a no-op.
};
