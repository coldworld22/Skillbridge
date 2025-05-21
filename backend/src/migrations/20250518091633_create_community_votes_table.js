// 📁 migrations/YYYYMMDD_create_community_votes_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_votes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('discussion_id').references('id').inTable('community_discussions').onDelete('CASCADE');
    table.uuid('reply_id').references('id').inTable('community_replies').onDelete('CASCADE');
    table.enu('type', ['upvote', 'downvote']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Prevent multiple votes on the same discussion/reply
    table.unique(['user_id', 'discussion_id']);
    table.unique(['user_id', 'reply_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_votes');
};
