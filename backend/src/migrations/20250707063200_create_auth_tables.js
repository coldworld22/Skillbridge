exports.up = function(knex) {
  return knex.schema
    // Roles table
    .createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Permissions table
    .createTable('permissions', function(table) {
      table.increments('id').primary();
      table.string('code').notNullable().unique();
      table.string('label');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Role permissions mapping
    .createTable('role_permissions', function(table) {
      table.integer('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
      table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.primary(['role_id', 'permission_id']);
    })
    // User roles mapping
    .createTable('user_roles', function(table) {
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
      table.primary(['user_id', 'role_id']);
    })
    // Social accounts for OAuth logins
    .createTable('social_accounts', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enu('provider', ['google', 'facebook', 'apple']).notNullable();
      table.string('provider_id').notNullable();
      table.string('email');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Password reset OTPs
    .createTable('password_resets', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('code').unique().notNullable();
      table.timestamp('expires_at').notNullable();
      table.boolean('used').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Email/phone verification OTPs
    .createTable('verifications', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enu('type', ['email', 'phone']).notNullable();
      table.string('code').notNullable();
      table.timestamp('expires_at').notNullable();
      table.boolean('verified').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Categories table used across the app
    .createTable('categories', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable().unique();
      table.text('description');
      table.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL');
      table.string('slug').unique();
      table.string('status').defaultTo('active');
      table.string('image_url');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('categories')
    .dropTableIfExists('verifications')
    .dropTableIfExists('password_resets')
    .dropTableIfExists('social_accounts')
    .dropTableIfExists('user_roles')
    .dropTableIfExists('role_permissions')
    .dropTableIfExists('permissions')
    .dropTableIfExists('roles');
};
