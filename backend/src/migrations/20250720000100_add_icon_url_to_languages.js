exports.up = function(knex) {
  return knex.schema.table('languages', (table) => {
    table.string('icon_url');
  });
};

exports.down = function(knex) {
  return knex.schema.table('languages', (table) => {
    table.dropColumn('icon_url');
  });
};
