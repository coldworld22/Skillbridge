exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('licenses');

  if (!hasTable) {
    await knex.schema.createTable('licenses', (table) => {
      table.increments('id').primary();
      table.string('purchase_code').unique().notNullable();
      table.string('domain').nullable();
      table.timestamp('verified_at').nullable();
      table.string('status').defaultTo('active');
    });
    return;
  }

  await knex.schema.alterTable('licenses', (table) => {
    table.string('domain').nullable().alter();
    table.string('email').nullable().alter();
  });

  const hasVerifiedAt = await knex.schema.hasColumn('licenses', 'verified_at');
  if (!hasVerifiedAt) {
    await knex.schema.alterTable('licenses', (table) => {
      table.timestamp('verified_at').nullable();
    });
  }
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('licenses');
  if (!hasTable) {
    return;
  }

  const hasEmail = await knex.schema.hasColumn('licenses', 'email');
  if (!hasEmail) {
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
    table.string('email').notNullable().alter();
  });
};
