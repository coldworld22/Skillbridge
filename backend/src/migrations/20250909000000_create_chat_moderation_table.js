const TABLE_NAME = 'chat_moderation';

exports.up = function (knex) {
  return knex.schema.createTable(TABLE_NAME, (table) => {
    table.increments('id').primary();
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('message').notNullable();
    table.jsonb('matched_words').notNullable().defaultTo('[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists(TABLE_NAME);
};
