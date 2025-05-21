// 📁 migrations/YYYYMMDD_create_integrations_table.js

exports.up = function(knex) {
  return knex.schema.createTable('integrations', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();         // e.g., "OpenAI", "Google Calendar"
    table.string('type').notNullable();         // e.g., "AI", "Calendar", "Captcha"
    table.boolean('active').defaultTo(false);
    table.jsonb('config');                      // JSON: keys, secrets, URLs
    table.string('icon');                       // optional UI display icon
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('integrations');
};
