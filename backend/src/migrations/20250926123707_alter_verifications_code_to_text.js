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
  const codeInfo = columnInfo && columnInfo.code;

  if (!codeInfo) {
    return;
  }

  if (codeInfo.type === 'text') {
    return;
  }

  if (codeInfo.maxLength && Number(codeInfo.maxLength) >= 255) {
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

  const columnInfo = await knex('verifications').columnInfo();
  const codeInfo = columnInfo && columnInfo.code;

  if (!codeInfo || codeInfo.type === 'text') {
    return;
  }

  if (codeInfo.maxLength && Number(codeInfo.maxLength) <= 10) {
    return;
  }

  const hasLongCodes = await knex('verifications')
    .whereRaw('char_length(code) > 10')
    .first();

  if (hasLongCodes) {
    throw new Error(
      'Cannot shrink verifications.code to length 10 because data longer than 10 characters exists.'
    );
  }

  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 10).notNullable().alter();
  });
};
