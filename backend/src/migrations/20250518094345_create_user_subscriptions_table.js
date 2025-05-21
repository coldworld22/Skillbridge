// 📁 migrations/YYYYMMDD_create_user_subscriptions_table.js

exports.up = function(knex) {
  return knex.schema.createTable('user_subscriptions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.enu('billing_cycle', ['monthly', 'yearly']).notNullable();
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').notNullable();
    table.boolean('auto_renew').defaultTo(true);
    table.enu('status', ['active', 'cancelled', 'expired']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id']); // one active subscription per user
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_subscriptions');
};
