exports.up = function(knex) {
  return knex.schema.table('groups', function(table) {
    table.enu('status', ['pending', 'active', 'inactive', 'suspended']).defaultTo('pending').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('groups', function(table) {
    table.dropColumn('status');
  });
};
