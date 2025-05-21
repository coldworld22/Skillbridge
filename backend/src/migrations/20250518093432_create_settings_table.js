// 📁 migrations/YYYYMMDD_create_settings_table.js

exports.up = function(knex) {
  return knex.schema.createTable('settings', function(table) {
    table.string('key').primary();
    table.text('value'); // JSON string or raw string
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('settings');
};
