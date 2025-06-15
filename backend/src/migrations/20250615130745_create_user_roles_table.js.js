// 📁 migrations/20250615130745_create_user_roles_table.js

exports.up = function(knex) {
  return knex.schema.createTable('user_roles', function(table) {
    table.uuid('user_id').notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.integer('role_id').notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');

    table.primary(['user_id', 'role_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_roles');
};
