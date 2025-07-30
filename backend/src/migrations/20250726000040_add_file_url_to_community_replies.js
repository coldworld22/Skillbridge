exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('community_replies', 'file_url');
  if (!hasColumn) {
    return knex.schema.alterTable('community_replies', table => {
      table.string('file_url');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('community_replies', table => {
    table.dropColumn('file_url');
  });
};
