exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('licenses');

  if (!hasTable) {
    await knex.schema.createTable('licenses', (table) => {
      table.increments('id').primary();
      table.string('purchase_code').unique().notNullable();
      table.string('domain').nullable();
      table.string('email').nullable();
      table.string('ip').nullable();
      table.timestamp('verified_at').nullable();
      table.string('status').defaultTo('active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('last_check').nullable();
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

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('licenses');
  if (!hasTable) return;

  const hasVerifiedAt = await knex.schema.hasColumn('licenses', 'verified_at');
  if (hasVerifiedAt) {
    await knex.schema.alterTable('licenses', (table) => {
      table.dropColumn('verified_at');
    });
  }

  await knex('licenses').whereNull('domain').update({ domain: '' });
  await knex('licenses').whereNull('email').update({ email: '' });

  await knex.schema.alterTable('licenses', (table) => {
    table.string('domain').notNullable().alter();
    table.string('email').notNullable().alter();
  });
};
