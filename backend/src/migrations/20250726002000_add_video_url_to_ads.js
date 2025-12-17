exports.up = function (knex) {
  return knex.schema.alterTable('ads', function (table) {
    table.string('video_url');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('ads', function (table) {
    table.dropColumn('video_url');
  });
};
