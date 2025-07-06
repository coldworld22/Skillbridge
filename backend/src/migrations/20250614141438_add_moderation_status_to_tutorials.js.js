// 📁 migrations/20250614_add_moderation_status_to_tutorials.js
exports.up = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.enu('moderation_status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.dropColumn('moderation_status');
  });
};
