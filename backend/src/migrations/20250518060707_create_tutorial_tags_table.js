// 📁 migrations/YYYYMMDD_create_tutorial_tags_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_tags', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_tags');
};
