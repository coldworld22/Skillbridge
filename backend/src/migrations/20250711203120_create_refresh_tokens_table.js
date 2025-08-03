exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('refresh_tokens');
};
