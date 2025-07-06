// 📁 migrations/YYYYMMDD_create_community_tags_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_tags', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('slug').notNullable().unique();
    table.text('description');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_tags');
};
