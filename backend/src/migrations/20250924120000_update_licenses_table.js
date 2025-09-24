const isPostgres = (knex) => {
  const client = knex?.client?.config?.client;
  return client === 'pg' || client === 'postgres' || client === 'postgresql';
};

exports.up = async function (knex) {
  const hasLicenses = await knex.schema.hasTable('licenses');

  if (!hasLicenses) {
    await knex.schema.createTable('licenses', (table) => {
      table.increments('id').primary();
      table.string('purchase_code').unique().notNullable();
      table.string('domain').nullable();
      table.timestamp('verified_at').nullable();
      table.string('status').defaultTo('active');
    });
    return;
  }

  const hasVerifiedAt = await knex.schema.hasColumn('licenses', 'verified_at');
  if (!hasVerifiedAt) {
    await knex.schema.alterTable('licenses', (table) => {
      table.timestamp('verified_at').nullable();
    });
  }

  if (isPostgres(knex)) {
    await knex.raw('ALTER TABLE licenses ALTER COLUMN domain DROP NOT NULL');
    try {
      await knex.raw('ALTER TABLE licenses ALTER COLUMN email DROP NOT NULL');
    } catch (error) {
      if (error && error.message && !error.message.includes('email')) {
        throw error;
      }
    }
  }
};

exports.down = async function (knex) {
  const hasLicenses = await knex.schema.hasTable('licenses');
  if (!hasLicenses) {
    return;
  }

  const hasVerifiedAt = await knex.schema.hasColumn('licenses', 'verified_at');
  if (hasVerifiedAt) {
    await knex.schema.alterTable('licenses', (table) => {
      table.dropColumn('verified_at');
    });
  }

  if (isPostgres(knex)) {
    try {
      await knex.raw('ALTER TABLE licenses ALTER COLUMN domain SET NOT NULL');
    } catch (error) {
      if (!error || !error.message || !error.message.includes('does not exist')) {
        throw error;
      }
    }

    try {
      await knex.raw('ALTER TABLE licenses ALTER COLUMN email SET NOT NULL');
    } catch (error) {
      if (
        !error ||
        !error.message ||
        (!error.message.includes('does not exist') && !error.message.includes('email'))
      ) {
        throw error;
      }
    }
  }
};
