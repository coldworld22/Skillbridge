const { ROLE_NAMES } = require("../utils/enums");

exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name').notNullable();
    table.string('email').notNullable().unique();
    table.string('phone').unique();
    table.text('password_hash').notNullable();
    table.enu('role', ROLE_NAMES).notNullable();
    table.string('avatar_url');
    table.boolean('is_email_verified').defaultTo(false);
    table.enu("status", ["pending", "active", "banned"]).notNullable().defaultTo("pending");
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
