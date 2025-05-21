// 📁 migrations/YYYYMMDD_create_invoices_table.js

exports.up = function(knex) {
  return knex.schema.createTable('invoices', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('payment_id').notNullable().references('id').inTable('payments').onDelete('CASCADE');
    table.string('invoice_number').notNullable().unique();
    table.string('file_url'); // stored PDF/receipt
    table.timestamp('issued_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('invoices');
};
