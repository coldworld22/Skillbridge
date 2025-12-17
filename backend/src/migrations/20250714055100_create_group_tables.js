exports.up = function(knex) {
  return knex.schema
    .createTable('groups', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('creator_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description');
      table.string('visibility').defaultTo('public');
      table.boolean('requires_approval').defaultTo(false);
      table.string('cover_image');
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
      table.integer('max_size');
      table.string('timezone');
      table.string('status').defaultTo('pending');
      table.jsonb('permissions');
      table.timestamps(true, true);
    })
    .createTable('group_members', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('role').defaultTo('member');
      table.boolean('disabled').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['group_id', 'user_id']);
    })
    .createTable('group_join_requests', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('status').defaultTo('pending');
      table.timestamp('requested_at').defaultTo(knex.fn.now());
      table.timestamp('responded_at');
      table.unique(['group_id', 'user_id']);
    })
    .createTable('group_messages', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
      table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('content');
      table.string('file_url');
      table.string('audio_url');
      table.timestamp('sent_at').defaultTo(knex.fn.now());
    })
    .createTable('group_tags', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable().unique();
      table.string('slug').notNullable().unique();
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('group_tag_map', function(table) {
      table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
      table.uuid('tag_id').notNullable().references('id').inTable('group_tags').onDelete('CASCADE');
      table.primary(['group_id', 'tag_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('group_tag_map')
    .dropTableIfExists('group_tags')
    .dropTableIfExists('group_messages')
    .dropTableIfExists('group_join_requests')
    .dropTableIfExists('group_members')
    .dropTableIfExists('groups');
};
