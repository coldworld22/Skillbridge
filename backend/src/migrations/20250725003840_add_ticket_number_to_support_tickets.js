exports.up = function(knex) {
  return knex.schema.table('support_tickets', function(table) {
    table.string('ticket_number').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.table('support_tickets', function(table) {
    table.dropColumn('ticket_number');
  });
};
