// 📁 migrations/20250615000000_add_locked_to_community_discussions.js
exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('community_discussions', 'locked');
  if (!exists) {
    await knex.schema.alterTable('community_discussions', function(table) {
      table.boolean('locked').defaultTo(false);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('community_discussions', function(table) {
    table.dropColumn('locked');
  });
};
