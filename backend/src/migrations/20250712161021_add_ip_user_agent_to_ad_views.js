exports.up = function (knex) {
  return knex.schema.table('ad_views', function (table) {
    table.string('ip_address');
    table.text('user_agent');
  });
};

exports.down = function (knex) {
  return knex.schema.table('ad_views', function (table) {
    table.dropColumn('ip_address');
    table.dropColumn('user_agent');
  });
};
