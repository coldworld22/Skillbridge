// 📁 migrations/YYYYMMDD_create_currencies_table.js

exports.up = function(knex) {
  return knex.schema.createTable('currencies', function(table) {
    table.increments('id').primary();
    table.string('label').notNullable();        // e.g., "US Dollar"
    table.string('code').notNullable().unique(); // e.g., "USD"
    table.string('symbol').notNullable();       // e.g., "$"
    table.decimal('exchange_rate', 10, 4).notNullable().defaultTo(1); // relative to default
    table.boolean('active').defaultTo(true);
    table.boolean('default').defaultTo(false);
    table.boolean('auto_update').defaultTo(true); // toggle if rate updates automatically
    table.timestamp('last_updated').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('currencies');
};
