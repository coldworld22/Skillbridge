exports.up = function(knex) {
  return knex.schema.createTable('admin_audit_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('admin_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable();
    table.jsonb('details').defaultTo('{}');
    table.string('ip_address');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('admin_audit_logs');
};
