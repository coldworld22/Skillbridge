// 📁 migrations/YYYYMMDD_create_integration_logs_table.js

exports.up = function(knex) {
  return knex.schema.createTable('integration_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('integration_id').notNullable().references('id').inTable('integrations').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action').notNullable(); // e.g., "prompt", "calendar_sync"
    table.text('details');                // optional metadata
    table.timestamp('executed_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('integration_logs');
};
