exports.up = function(knex) {
  return knex.schema.table('tutorial_chapters', function(table) {
    table.integer('duration');
  });
};

exports.down = function(knex) {
  return knex.schema.table('tutorial_chapters', function(table) {
    table.dropColumn('duration');
  });
};
