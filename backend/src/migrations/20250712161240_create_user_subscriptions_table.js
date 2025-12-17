exports.up = function(knex) {
  return knex.schema.createTable('user_subscriptions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.timestamp('start_date').defaultTo(knex.fn.now());
    table.timestamp('end_date');
    table.string('status').defaultTo('active');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_subscriptions');
};
