// 📁 migrations/YYYYMMDD_create_policies_table.js

exports.up = function(knex) {
  return knex.schema.createTable('policies', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();        // e.g., "Privacy Policy"
    table.string('slug').notNullable().unique(); // e.g., "privacy-policy"
    table.text('content').notNullable();        // HTML or plain text
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('policies');
};
