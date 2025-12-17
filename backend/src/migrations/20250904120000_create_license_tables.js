exports.up = async function (knex) {
  await knex.schema.createTable('licenses', (table) => {
    table.increments('id').primary();
    table.string('purchase_code').unique().notNullable();
    table.string('domain').notNullable();
    table.string('email').notNullable();
    table.string('ip');
    table.string('status').defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_check');
  });

  await knex.schema.createTable('license_logs', (table) => {
    table.increments('id').primary();
    table
      .integer('license_id')
      .references('id')
      .inTable('licenses')
      .onDelete('CASCADE');
    table.string('action').notNullable();
    table.string('ip');
    table.string('domain');
    table.string('device');
    table.string('status');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('suspicious_logs', (table) => {
    table.increments('id').primary();
    table
      .integer('license_id')
      .references('id')
      .inTable('licenses')
      .onDelete('CASCADE');
    table.string('issue').notNullable();
    table.text('details');
    table.string('severity').defaultTo('medium');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('suspicious_logs');
  await knex.schema.dropTableIfExists('license_logs');
  await knex.schema.dropTableIfExists('licenses');
};
