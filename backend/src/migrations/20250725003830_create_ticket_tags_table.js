exports.up = function(knex) {
  return knex.schema.createTable('ticket_tags', function(table) {
    table.increments('id');
    table.integer('ticket_id').references('id').inTable('tickets');
    table.string('tag');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ticket_tags');
};
