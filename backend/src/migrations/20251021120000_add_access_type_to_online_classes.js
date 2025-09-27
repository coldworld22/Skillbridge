exports.up = function (knex) {
  return knex.schema.table('online_classes', function (table) {
    table
      .enu('access_type', ['paid', 'free'])
      .notNullable()
      .defaultTo('paid');
  });
};

exports.down = function (knex) {
  return knex.schema.table('online_classes', function (table) {
    table.dropColumn('access_type');
  });
};
