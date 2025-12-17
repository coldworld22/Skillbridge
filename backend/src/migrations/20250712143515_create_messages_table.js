/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('sender_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .uuid('receiver_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .uuid('booking_id')
      .references('id')
      .inTable('bookings')
      .onDelete('CASCADE');
    table.text('message');
    table.string('file_url');
    table.string('audio_url');
    table
      .uuid('reply_to_id')
      .references('id')
      .inTable('messages')
      .onDelete('SET NULL');
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at');
    table.boolean('pinned').defaultTo(false);
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};
