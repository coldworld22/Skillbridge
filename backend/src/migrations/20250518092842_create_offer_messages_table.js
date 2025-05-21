// 📁 migrations/YYYYMMDD_create_offer_messages_table.js

exports.up = function(knex) {
  return knex.schema.createTable('offer_messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('response_id').notNullable().references('id').inTable('offer_responses').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('message').notNullable();
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('offer_messages');
};
