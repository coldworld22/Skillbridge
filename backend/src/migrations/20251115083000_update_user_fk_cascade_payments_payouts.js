/**
 * Ensure payment- and payout-related user references inherit user deletions.
 *
 * Existing databases need their foreign keys rebuilt with ON DELETE CASCADE so
 * that removing a user also removes dependent payment/payout rows instead of
 * throwing FK violations (409 in the dashboard).
 *
 * @param {import('knex')} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('payments', (table) => {
    table.dropForeign('user_id');
  });

  await knex.schema.alterTable('payments', (table) => {
    table
      .foreign('user_id')
      .references('users.id')
      .onDelete('CASCADE');
  });

  await knex.schema.alterTable('payouts', (table) => {
    table.dropForeign('instructor_id');
  });

  await knex.schema.alterTable('payouts', (table) => {
    table
      .foreign('instructor_id')
      .references('users.id')
      .onDelete('CASCADE');
  });
};

/**
 * Revert the FK behavior back to RESTRICT (no cascading delete).
 *
 * @param {import('knex')} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('payments', (table) => {
    table.dropForeign('user_id');
  });

  await knex.schema.alterTable('payments', (table) => {
    table.foreign('user_id').references('users.id');
  });

  await knex.schema.alterTable('payouts', (table) => {
    table.dropForeign('instructor_id');
  });

  await knex.schema.alterTable('payouts', (table) => {
    table.foreign('instructor_id').references('users.id');
  });
};
