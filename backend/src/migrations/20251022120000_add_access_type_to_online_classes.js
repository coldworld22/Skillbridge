exports.up = async function (knex) {
  return knex.schema.alterTable('online_classes', (table) => {
    table
      .enu('access_type', ['paid', 'free'], {
        useNative: true,
        enumName: 'online_class_access_type',
      })
      .notNullable()
      .defaultTo('paid');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('online_classes', (table) => {
    table.dropColumn('access_type');
  });
  await knex.raw('DROP TYPE IF EXISTS online_class_access_type');
};
