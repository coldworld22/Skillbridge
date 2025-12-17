exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    table.string('color').defaultTo('#1F2937');
    table.string('style');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    table.dropColumn('color');
    table.dropColumn('style');
  });
};
