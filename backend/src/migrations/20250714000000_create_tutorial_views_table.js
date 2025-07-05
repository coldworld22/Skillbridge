exports.up = function(knex) {
  return knex.schema.createTable('tutorial_views', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.uuid('viewer_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('viewed_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_views');
};
