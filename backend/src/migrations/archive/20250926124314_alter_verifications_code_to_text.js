/**
 * Migrate verifications.code to TEXT to permanently remove length constraints.
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

  await knex.schema.alterTable('verifications', (table) => {
    table.text('code').notNullable().alter();
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

  if (!codeInfo || codeInfo.type !== 'text') {
    return;
  }

  const hasLongCodes = await knex('verifications')
    .whereRaw('char_length(code) > 255')
    .first();

  if (hasLongCodes) {
    throw new Error(
      'Cannot shrink verifications.code to length 255 because data longer than 255 characters exists.'
    );
  }
  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 255).notNullable().alter();
  });
};
