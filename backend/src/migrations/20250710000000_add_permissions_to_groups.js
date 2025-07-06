exports.up = function(knex) {
  return knex.schema.table('groups', function(table) {
    table.jsonb('permissions').defaultTo('{}');
  });
};

exports.down = function(knex) {
  return knex.schema.table('groups', function(table) {
    table.dropColumn('permissions');
  });
};
