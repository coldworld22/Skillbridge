// 📁 migrations/YYYYMMDD_create_group_messages_table.js

exports.up = function(knex) {
  return knex.schema.createTable('group_messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('group_messages');
};
