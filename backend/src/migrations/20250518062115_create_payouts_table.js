// 📁 migrations/YYYYMMDD_create_payouts_table.js

exports.up = function(knex) {
  return knex.schema.createTable('payouts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.enu('status', ['pending', 'approved', 'rejected', 'paid']).defaultTo('pending');
    table.text('notes'); // optional reason if rejected
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('paid_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payouts');
};
