/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasGender = await knex.schema.hasColumn('users', 'gender');
  if (!hasGender) {
    await knex.schema.alterTable('users', function(table) {
      table.string('gender');
    });
  }
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasGender = await knex.schema.hasColumn('users', 'gender');
  if (hasGender) {
    await knex.schema.alterTable('users', function(table) {
      table.dropColumn('gender');
    });
  }
};
