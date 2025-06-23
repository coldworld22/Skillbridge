exports.up = function(knex) {
  return knex.schema.alterTable('online_classes', function(table) {
    table.string('slug').notNullable().unique().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('online_classes', function(table) {
    table.string('slug').alter();
  });
};
