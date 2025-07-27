exports.up = function(knex) {
  return knex.schema.createTable('ticket_messages', function(table) {
    table.increments('id');
    table.integer('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
    table.integer('sender_id').references('id').inTable('users');
    table.text('message');
    table.boolean('is_internal_note').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ticket_messages');
};
