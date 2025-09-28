exports.up = async function (knex) {
  const columnExists = await knex.schema.hasColumn('online_classes', 'access_type');

  const {
    rows: [typeExists],
  } = await knex.raw(
    "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'online_class_access_type') AS exists"
  );

  if (!typeExists?.exists) {
    await knex.raw(
      "CREATE TYPE online_class_access_type AS ENUM ('paid', 'free')"
    );
  }

  if (!columnExists) {
    await knex.raw(
      "ALTER TABLE online_classes ADD COLUMN IF NOT EXISTS access_type online_class_access_type NOT NULL DEFAULT 'paid'"
    );
    return;
  }

  const columnInfo = await knex('information_schema.columns')
    .select('udt_name', 'data_type')
    .where({
      table_schema: 'public',
      table_name: 'online_classes',
      column_name: 'access_type',
    })
    .first();

  if (!columnInfo) {
    return;
  }

  if (columnInfo.udt_name !== 'online_class_access_type') {
    await knex.raw(
      "UPDATE online_classes SET access_type = 'paid' WHERE access_type IS NULL OR access_type NOT IN ('paid', 'free')"
    );
    await knex.raw(
      'ALTER TABLE online_classes ALTER COLUMN access_type DROP DEFAULT'
    );
    await knex.raw(
      "ALTER TABLE online_classes ALTER COLUMN access_type TYPE online_class_access_type USING access_type::online_class_access_type"
    );
  } else {
    await knex.raw(
      "UPDATE online_classes SET access_type = 'paid' WHERE access_type IS NULL"
    );
  }

  await knex.raw(
    "ALTER TABLE online_classes ALTER COLUMN access_type SET DEFAULT 'paid'"
  );
  await knex.raw(
    "ALTER TABLE online_classes ALTER COLUMN access_type SET NOT NULL"
  );
};

exports.down = async function (knex) {
  const columnExists = await knex.schema.hasColumn('online_classes', 'access_type');

  if (columnExists) {
    await knex.raw('ALTER TABLE online_classes DROP COLUMN access_type');
  }

  const {
    rows: [typeExists],
  } = await knex.raw(
    "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'online_class_access_type') AS exists"
  );

  if (typeExists?.exists) {
    const {
      rows: [usage],
    } = await knex.raw(
      "SELECT EXISTS (SELECT 1 FROM pg_attribute WHERE atttypid = 'online_class_access_type'::regtype) AS in_use"
    );

    if (!usage?.in_use) {
      await knex.raw('DROP TYPE online_class_access_type');
    }
  }
};
