exports.up = function(knex) {
  return knex.schema.createTable('social_accounts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('provider', ['google', 'facebook', 'apple']).notNullable();
    table.string('provider_id').notNullable();
    table.string('email');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('social_accounts');
};
