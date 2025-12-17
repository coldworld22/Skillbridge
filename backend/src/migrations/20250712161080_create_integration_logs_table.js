exports.up = function(knex) {
  return knex.schema.createTable('integration_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('integration_id').notNullable().references('id').inTable('integrations').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action');
    table.jsonb('details');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('integration_logs');
};
