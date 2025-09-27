exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('online_classes', 'access_type');

  if (!hasColumn) {
    await knex.schema.alterTable('online_classes', (table) => {
      table
        .enu('access_type', ['paid', 'free'], {
          useNative: true,
          enumName: 'online_class_access_type',
        })
        .notNullable()
        .defaultTo('paid');
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('online_classes', 'access_type');

  if (hasColumn) {
    await knex.schema.alterTable('online_classes', (table) => {
      table.dropColumn('access_type');
    });
  }

  const {
    rows: [typeExists],
  } = await knex.raw(
    "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'online_class_access_type') AS exists"
  );

  if (typeExists?.exists) {
    await knex.raw('DROP TYPE online_class_access_type');
  }
};
