exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.string('file_url');
    table.string('audio_url');
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('file_url');
    table.dropColumn('audio_url');
  });
};
