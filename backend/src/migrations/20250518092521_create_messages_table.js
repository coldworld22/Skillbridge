// 📁 migrations/YYYYMMDD_create_messages_table.js

exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('receiver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.text('message').notNullable();
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};
