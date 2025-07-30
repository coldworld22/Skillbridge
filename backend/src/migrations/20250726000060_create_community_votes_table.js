exports.up = function(knex) {
  return knex.schema.createTable('community_votes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('discussion_id').notNullable().references('id').inTable('community_discussions').onDelete('CASCADE');
    table.integer('vote').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'discussion_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_votes');
};
