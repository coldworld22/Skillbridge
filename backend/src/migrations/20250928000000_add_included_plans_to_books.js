const TABLE_NAME = 'books';

exports.up = function(knex) {
  return knex.schema.alterTable(TABLE_NAME, function(table) {
    table.jsonb('included_plans').notNullable().defaultTo('[]');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable(TABLE_NAME, function(table) {
    table.dropColumn('included_plans');
  });
};
