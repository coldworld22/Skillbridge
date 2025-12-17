/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('video_call_participants', (table) => {
    table.increments('id').primary();
    table.string('room_id').notNullable();
    table.string('socket_id').notNullable();
    table.string('name').notNullable();
    table.string('role').defaultTo('participant');
    table.boolean('is_muted').defaultTo(false);
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('left_at');
  });

  await knex.schema.createTable('video_call_messages', (table) => {
    table.increments('id').primary();
    table.string('room_id').notNullable();
    table.uuid('sender_id');
    table.string('sender');
    table.text('text').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('video_call_messages');
  await knex.schema.dropTableIfExists('video_call_participants');
};
