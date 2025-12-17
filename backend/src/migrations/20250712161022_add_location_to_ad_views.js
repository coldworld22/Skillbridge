exports.up = function (knex) {
  return knex.schema.table('ad_views', function (table) {
    table.string('location');
  });
};

exports.down = function (knex) {
  return knex.schema.table('ad_views', function (table) {
    table.dropColumn('location');
  });
};
