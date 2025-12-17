exports.up = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.boolean('is_active').notNullable().defaultTo(false);
    table.unique('title');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.dropUnique('title');
    table.dropColumn('is_active');
  });
};
