// 📁 20250712000000_add_unique_title_to_tutorials.js
exports.up = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.unique('title');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.dropUnique('title');
  });
};
