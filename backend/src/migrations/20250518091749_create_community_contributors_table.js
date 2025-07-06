// 📁 migrations/YYYYMMDD_create_community_contributors_table.js

exports.up = function(knex) {
  return knex.schema.createTable('community_contributors', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.integer('discussions_count').defaultTo(0);
    table.integer('replies_count').defaultTo(0);
    table.integer('votes_received').defaultTo(0);
    table.integer('accepted_answers').defaultTo(0);
    table.integer('score').defaultTo(0); // custom logic: points system
    table.timestamp('last_activity');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_contributors');
};
