// 📁 20250617104450_add_unique_title_to_ads.js

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
