/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasDateOfBirth = await knex.schema.hasColumn('users', 'date_of_birth');
  const hasEmailVerified = await knex.schema.hasColumn('users', 'is_email_verified');
  const hasPhoneVerified = await knex.schema.hasColumn('users', 'is_phone_verified');
  const hasProfileComplete = await knex.schema.hasColumn('users', 'profile_complete');
  const hasAvatarUrl = await knex.schema.hasColumn('users', 'avatar_url');

  return knex.schema.alterTable('users', function (table) {
    if (!hasDateOfBirth) table.date('date_of_birth');
    if (!hasEmailVerified) table.boolean('is_email_verified').defaultTo(false);
    if (!hasPhoneVerified) table.boolean('is_phone_verified').defaultTo(false);
    if (!hasProfileComplete) table.boolean('profile_complete').defaultTo(false);
    if (!hasAvatarUrl) table.string('avatar_url');
  });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasGender = await knex.schema.hasColumn('users', 'gender');
  const hasDateOfBirth = await knex.schema.hasColumn('users', 'date_of_birth');
  const hasEmailVerified = await knex.schema.hasColumn('users', 'is_email_verified');
  const hasPhoneVerified = await knex.schema.hasColumn('users', 'is_phone_verified');
  const hasProfileComplete = await knex.schema.hasColumn('users', 'profile_complete');
  const hasAvatarUrl = await knex.schema.hasColumn('users', 'avatar_url');

  return knex.schema.alterTable('users', function (table) {
    if (hasGender) table.dropColumn('gender');
    if (hasDateOfBirth) table.dropColumn('date_of_birth');
    if (hasEmailVerified) table.dropColumn('is_email_verified');
    if (hasPhoneVerified) table.dropColumn('is_phone_verified');
    if (hasProfileComplete) table.dropColumn('profile_complete');
    if (hasAvatarUrl) table.dropColumn('avatar_url');
  });
};