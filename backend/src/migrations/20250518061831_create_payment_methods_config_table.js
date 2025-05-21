// 📁 migrations/YYYYMMDD_create_payment_methods_config_table.js

exports.up = function(knex) {
  return knex.schema.createTable('payment_methods_config', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();          // e.g., Stripe, Bank Transfer
    table.string('type').notNullable();          // Gateway, Manual, Crypto
    table.string('icon');                        // Optional icon URL
    table.boolean('active').defaultTo(true);
    table.jsonb('settings');                     // JSON config object
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payment_methods_config');
};
