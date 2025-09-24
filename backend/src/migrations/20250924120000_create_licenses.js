exports.up = async function up(knex) {
  const hasLicensesTable = await knex.schema.hasTable('licenses');

  if (!hasLicensesTable) {
    await knex.schema.createTable('licenses', (table) => {
      table.increments('id').primary();
      table.string('purchase_code').unique().notNullable();
      table.string('domain').nullable();
      table.timestamp('verified_at').nullable();
      table.string('status').defaultTo('active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    return;
  }

  const hasVerifiedAt = await knex.schema.hasColumn('licenses', 'verified_at');
  if (!hasVerifiedAt) {
    await knex.schema.alterTable('licenses', (table) => {
      table.timestamp('verified_at').nullable();
    });
  }

  await knex.schema.alterTable('licenses', (table) => {
    table.string('domain').nullable().alter();
  });
};

exports.down = async function down(knex) {
  const hasLicensesTable = await knex.schema.hasTable('licenses');
  if (!hasLicensesTable) {
    return;
  }

  const hasEmailColumn = await knex.schema.hasColumn('licenses', 'email');
  if (!hasEmailColumn) {
    await knex.schema.dropTable('licenses');
    return;
  }

  const hasVerifiedAt = await knex.schema.hasColumn('licenses', 'verified_at');
  if (hasVerifiedAt) {
    await knex.schema.alterTable('licenses', (table) => {
      table.dropColumn('verified_at');
    });
  }

  await knex.schema.alterTable('licenses', (table) => {
    table.string('domain').notNullable().alter();
  });
};
