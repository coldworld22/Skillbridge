/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.string('gender');
    table.date('date_of_birth');
    table.boolean('is_email_verified').defaultTo(false);
    table.boolean('is_phone_verified').defaultTo(false);
    table.boolean('profile_complete').defaultTo(false);
    table.string('avatar_url');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('gender');
    table.dropColumn('date_of_birth');
    table.dropColumn('is_email_verified');
    table.dropColumn('is_phone_verified');
    table.dropColumn('profile_complete');
    table.dropColumn('avatar_url');
  });
};
