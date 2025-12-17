exports.up = function(knex) {
  return knex.schema
    .createTable('support_tickets', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('subject').notNullable();
      table.string('status').notNullable().defaultTo('open');
      table.timestamps(true, true);
    })
    .createTable('support_messages', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('ticket_id').notNullable().references('id').inTable('support_tickets').onDelete('CASCADE');
      table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('message').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('support_messages')
    .dropTable('support_tickets');
};
