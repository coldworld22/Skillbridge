exports.up = async function (knex) {
  await knex.schema.alterTable('online_classes', (table) => {
    table
      .enu('access_type', ['paid', 'free'], {
        useNative: true,
        enumName: 'online_classes_access_type_enum',
      })
      .notNullable()
      .defaultTo('paid');
  });

  await knex('online_classes')
    .whereNull('access_type')
    .update({ access_type: 'paid' });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('online_classes', (table) => {
    table.dropColumn('access_type');
  });
  await knex.raw('DROP TYPE IF EXISTS online_classes_access_type_enum');
};
