// 📁 migrations/YYYYMMDD_create_notifications_table.js

exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // e.g., 'class_update', 'booking_alert'
    table.text('message').notNullable();
    table.boolean('read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('read_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
