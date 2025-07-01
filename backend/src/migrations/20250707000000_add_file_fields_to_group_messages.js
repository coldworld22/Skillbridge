exports.up = function(knex) {
  return knex.schema.table('group_messages', function(table) {
    table.string('file_url');
    table.string('audio_url');
  });
};

exports.down = function(knex) {
  return knex.schema.table('group_messages', function(table) {
    table.dropColumn('file_url');
    table.dropColumn('audio_url');
  });
};
