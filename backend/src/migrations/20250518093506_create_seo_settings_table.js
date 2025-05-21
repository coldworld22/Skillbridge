// 📁 migrations/YYYYMMDD_create_seo_settings_table.js

exports.up = function(knex) {
  return knex.schema.createTable('seo_settings', function(table) {
    table.string('page').primary(); // e.g., "/", "/about", "/tutorials"
    table.string('title');
    table.string('description');
    table.text('keywords');
    table.text('meta_json'); // for OpenGraph, TwitterCard, JSON-LD
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('seo_settings');
};
