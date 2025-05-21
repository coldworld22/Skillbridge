exports.up = function(knex) {
  return knex.schema.createTable('role_permissions', function(table) {
    table.integer('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.primary(['role_id', 'permission_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('role_permissions');
};
