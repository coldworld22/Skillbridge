exports.up = function(knex) {
  return knex.schema.table('tutorials', function(table) {
    table.jsonb('included_plans').notNullable().defaultTo('[]');
  });
};

exports.down = function(knex) {
  return knex.schema.table('tutorials', function(table) {
    table.dropColumn('included_plans');
  });
};
