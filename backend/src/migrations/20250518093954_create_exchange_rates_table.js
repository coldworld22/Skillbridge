// 📁 migrations/YYYYMMDD_create_exchange_rates_table.js

exports.up = function(knex) {
  return knex.schema.createTable('exchange_rates', function(table) {
    table.increments('id').primary();
    table.string('base_currency').notNullable();   // e.g., "USD"
    table.string('target_currency').notNullable(); // e.g., "SAR"
    table.decimal('rate', 10, 6).notNullable();
    table.date('date').notNullable();              // Rate date (e.g., 2025-05-18)
    table.unique(['base_currency', 'target_currency', 'date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('exchange_rates');
};
