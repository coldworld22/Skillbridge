// 📁 migrations/YYYYMMDD_create_transactions_table.js

exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.enu('type', ['payment', 'payout', 'refund', 'commission']).notNullable();
    table.string('source'); // e.g., 'class', 'tutorial', 'ad'
    table.uuid('source_id'); // ID of the source item
    table.string('reference'); // Optional external ref
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};
