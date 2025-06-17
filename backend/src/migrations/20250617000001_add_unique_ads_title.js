exports.up = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.unique('title');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.dropUnique('title');
  });
};
