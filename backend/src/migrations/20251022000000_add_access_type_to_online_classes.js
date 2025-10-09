exports.up = function (knex) {
  return knex.schema.table('online_classes', function (table) {
    table
      .enu('access_type', ['paid', 'free'], {
        useNative: true,
        enumName: 'online_classes_access_type_enum',
        existingType: false,
      })
      .notNullable()
      .defaultTo('paid');
  });
};

exports.down = function (knex) {
  return knex.schema
    .table('online_classes', function (table) {
      table.dropColumn('access_type');
    })
    .then(() =>
      knex.schema.raw(
        "DROP TYPE IF EXISTS online_classes_access_type_enum"
      )
    );
};
