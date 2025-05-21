// 📁 migrations/YYYYMMDD_create_plans_table.js

exports.up = function(knex) {
  return knex.schema.createTable('plans', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();           // e.g., Basic, Premium
    table.string('slug').notNullable().unique();  // e.g., "basic", "premium"
    table.decimal('price_monthly', 10, 2).defaultTo(0);
    table.decimal('price_yearly', 10, 2).defaultTo(0);
    table.string('currency').defaultTo('USD');
    table.boolean('recommended').defaultTo(false);
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('plans');
};
