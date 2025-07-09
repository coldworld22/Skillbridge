/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    table
      .integer('role_id')
      .unsigned()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table
      .integer('permission_id')
      .unsigned()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');
    table
      .uuid('assigned_by')
      .references('id')
      .inTable('users');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.primary(['role_id', 'permission_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('role_permissions');
};
