exports.up = function(knex) {
  return knex.schema.createTable('ticket_attachments', function(table) {
    table.increments('id');
    table.integer('message_id').references('id').inTable('ticket_messages');
    table.string('file_url');
    table.string('file_name');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ticket_attachments');
};
