exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name').notNullable();
    table.string('email').notNullable().unique();
    table.string('phone').unique();
    table.text('password_hash').notNullable();
    table.enu('role', ['Student', 'Instructor', 'User', 'Admin']).notNullable();
    table.string('avatar_url');
    table.boolean('is_email_verified').defaultTo(false);
    table.boolean('is_phone_verified').defaultTo(false);
    table.enu('status', ['active', 'inactive', 'banned']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
