exports.up = function(knex) {
  return knex.schema
    .createTable('offers', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('description');
      table.decimal('budget', 10, 2);
      table.string('timeframe');
      table.string('offer_type');
      table.string('status').defaultTo('open');
      table.timestamps(true, true);
    })
    .createTable('offer_responses', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('offer_id').notNullable().references('id').inTable('offers').onDelete('CASCADE');
      table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('proposed_price', 10, 2);
      table.string('estimated_time');
      table.text('notes');
      table.string('status').defaultTo('pending');
      table.timestamp('responded_at').defaultTo(knex.fn.now());
    })
    .createTable('offer_messages', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('response_id').notNullable().references('id').inTable('offer_responses').onDelete('CASCADE');
      table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('message');
      table.uuid('reply_to_id').references('id').inTable('offer_messages').onDelete('SET NULL');
      table.timestamp('sent_at').defaultTo(knex.fn.now());
    })
    .createTable('offer_tags', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable().unique();
      table.string('slug').notNullable().unique();
      table.timestamps(true, true);
    })
    .createTable('offer_tag_map', function(table) {
      table.uuid('offer_id').notNullable().references('id').inTable('offers').onDelete('CASCADE');
      table.uuid('tag_id').notNullable().references('id').inTable('offer_tags').onDelete('CASCADE');
      table.primary(['offer_id', 'tag_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('offer_tag_map')
    .dropTableIfExists('offer_tags')
    .dropTableIfExists('offer_messages')
    .dropTableIfExists('offer_responses')
    .dropTableIfExists('offers');
};
