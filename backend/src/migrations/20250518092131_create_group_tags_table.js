// 📁 migrations/YYYYMMDD_create_group_tags_table.js

exports.up = function(knex) {
  return knex.schema.createTable('group_tags', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('slug').notNullable().unique();
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('group_tags');
};
