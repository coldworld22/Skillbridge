// 📁 migrations/YYYYMMDD_create_notification_preferences_table.js

exports.up = function(knex) {
  return knex.schema.createTable('notification_preferences', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('email_enabled').defaultTo(true);
    table.boolean('in_app_enabled').defaultTo(true);
    table.boolean('sms_enabled').defaultTo(false);
    table.boolean('class_updates').defaultTo(true);
    table.boolean('booking_alerts').defaultTo(true);
    table.boolean('system_announcements').defaultTo(true);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notification_preferences');
};
