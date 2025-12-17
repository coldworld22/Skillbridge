exports.up = function(knex) {
  return knex.schema.createTable('community_views', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('discussion_id').notNullable().references('id').inTable('community_discussions').onDelete('CASCADE');
    table.uuid('viewer_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_views');
};
