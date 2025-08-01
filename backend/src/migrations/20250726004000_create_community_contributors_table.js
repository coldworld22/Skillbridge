exports.up = function(knex) {
  return knex.schema.createTable('community_contributors', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.integer('discussions_count').notNullable().defaultTo(0);
    table.integer('score').notNullable().defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_contributors');
};
