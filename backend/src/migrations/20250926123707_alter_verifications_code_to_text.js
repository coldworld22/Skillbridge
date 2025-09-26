/**
 * Expand the verifications.code column so hashed OTPs fit without truncation.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('verifications');
  if (!hasTable) {
    return;
  }

  const columnInfo = await knex('verifications').columnInfo();
  const codeInfo = columnInfo.code;

  if (codeInfo && codeInfo.maxLength && Number(codeInfo.maxLength) >= 255) {
    return;
  }

  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 255).notNullable().alter();
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('verifications');
  if (!hasTable) {
    return;
  }

  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 10).notNullable().alter();
  });
};
