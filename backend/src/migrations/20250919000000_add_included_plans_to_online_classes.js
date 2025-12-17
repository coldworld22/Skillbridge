exports.up = function(knex) {
  return knex.schema.table('online_classes', function(table) {
    table.jsonb('included_plans').notNullable().defaultTo('[]');
  });
};

exports.down = function(knex) {
  return knex.schema.table('online_classes', function(table) {
    table.dropColumn('included_plans');
  });
};
