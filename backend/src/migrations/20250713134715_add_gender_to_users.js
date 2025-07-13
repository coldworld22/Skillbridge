// migrations/xxxx_add_gender_to_users.js
exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.string('gender');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('gender');
  });
};
