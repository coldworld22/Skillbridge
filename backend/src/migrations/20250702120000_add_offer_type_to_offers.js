exports.up = function(knex) {
  return knex.schema.table('offers', function(table) {
    table.enu('offer_type', ['class', 'tutorial']).defaultTo('class');
  });
};

exports.down = function(knex) {
  return knex.schema.table('offers', function(table) {
    table.dropColumn('offer_type');
  });
};
