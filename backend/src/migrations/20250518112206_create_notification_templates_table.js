// 📁 migrations/YYYYMMDD_create_notification_templates_table.js

exports.up = function(knex) {
  return knex.schema.createTable('notification_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type').notNullable().unique(); // e.g., "class_reminder", "booking_update"
    table.string('title').notNullable();
    table.text('message').notNullable(); // body with dynamic placeholders
    table.boolean('active').defaultTo(true);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notification_templates');
};
