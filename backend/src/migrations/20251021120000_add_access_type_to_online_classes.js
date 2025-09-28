exports.up = async function (knex) {
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

  const hasColumn = await knex.schema.hasColumn('online_classes', 'access_type');

  if (!hasColumn) {
    await knex.raw(
      "ALTER TABLE online_classes ADD COLUMN access_type online_class_access_type NOT NULL DEFAULT 'paid'"
    );
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('online_classes', 'access_type');

  if (hasColumn) {
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
