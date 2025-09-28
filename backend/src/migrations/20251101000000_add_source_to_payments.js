exports.up = function (knex) {
  return knex.schema.alterTable('payments', function (table) {
    table.string('source');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('payments', function (table) {
    table.dropColumn('source');
  });
};
