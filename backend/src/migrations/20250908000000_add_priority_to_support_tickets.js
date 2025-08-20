exports.up = function (knex) {
  return knex.schema.hasColumn('support_tickets', 'priority').then((exists) => {
    if (!exists) {
      return knex.schema.table('support_tickets', function (table) {
        table.string('priority').defaultTo('medium');
      });
    }
  });
};

exports.down = function (knex) {
  return knex.schema.hasColumn('support_tickets', 'priority').then((exists) => {
    if (exists) {
      return knex.schema.table('support_tickets', function (table) {
        table.dropColumn('priority');
      });
    }
  });
};
