/**
 * Ensure verifications.code can store hashed OTP values by widening it to TEXT
 * when older deployments still have it capped at VARCHAR(10).
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

  if (!codeInfo || codeInfo.type === 'text') {
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

  await knex.schema.alterTable('verifications', (table) => {
    table.string('code', 10).notNullable().alter();
  });
};
