// 📁 migrations/YYYYMMDD_create_payments_table.js

exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('method_id').notNullable().references('id').inTable('payment_methods_config').onDelete('SET NULL');
    table.enu('item_type', ['class', 'tutorial', 'subscription', 'ad']).notNullable();
    table.uuid('item_id').notNullable(); // class_id, tutorial_id, etc.
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.enu('status', ['pending', 'paid', 'failed', 'refunded']).defaultTo('pending');
    table.string('reference_id'); // from Stripe, PayPal, etc.
    table.timestamp('paid_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
