// 📁 migrations/YYYYMMDD_create_admin_audit_logs_table.js

exports.up = function(knex) {
  return knex.schema.createTable('admin_audit_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('admin_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable(); // e.g., "DELETE_USER", "UPDATE_PLAN"
    table.text('description'); // what happened
    table.jsonb('meta');       // optional: affected record, before/after, etc.
    table.timestamp('performed_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('admin_audit_logs');
};
