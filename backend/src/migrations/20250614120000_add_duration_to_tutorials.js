exports.up = function(knex) {
  return knex.schema.table('tutorials', function(table) {
    table.integer('duration');
  });
};

exports.down = function(knex) {
  return knex.schema.table('tutorials', function(table) {
    table.dropColumn('duration');
  });
};
