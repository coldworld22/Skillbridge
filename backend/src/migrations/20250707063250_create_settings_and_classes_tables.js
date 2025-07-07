exports.up = function(knex) {
  return knex.schema
    .createTable('settings', function(table) {
      table.string('key').primary();
      table.text('value');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('online_classes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('instructor_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('title').notNullable();
      table.text('description');
      table.string('level');
      table.string('cover_image');
      table.timestamp('start_date');
      table.timestamp('end_date');
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
      table.decimal('price', 10, 2);
      table.integer('max_students');
      table.string('language');
      table.string('demo_video_url');
      table.boolean('allow_installments').defaultTo(false);
      table.string('slug').notNullable().unique();
      table.enu('status', ['draft','published','archived']).defaultTo('draft');
      table.enu('moderation_status', ['Pending','Approved','Rejected']).defaultTo('Pending');
      table.text('rejection_reason');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('class_tags', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable().unique();
      table.string('slug').notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('class_tag_map', function(table) {
      table.uuid('class_id').references('id').inTable('online_classes').onDelete('CASCADE');
      table.uuid('tag_id').references('id').inTable('class_tags').onDelete('CASCADE');
      table.primary(['class_id','tag_id']);
    })
    .createTable('class_enrollments', function(table) {
      table.uuid('class_id').references('id').inTable('online_classes').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.enu('status',['active','completed']).defaultTo('active');
      table.timestamp('enrolled_at').defaultTo(knex.fn.now());
      table.primary(['class_id','user_id']);
    })
    .createTable('class_views', function(table) {
      table.increments('id').primary();
      table.uuid('class_id').references('id').inTable('online_classes').onDelete('CASCADE');
      table.uuid('viewer_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('ip_address');
      table.string('user_agent');
      table.timestamp('viewed_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('class_views')
    .dropTableIfExists('class_enrollments')
    .dropTableIfExists('class_tag_map')
    .dropTableIfExists('class_tags')
    .dropTableIfExists('online_classes')
    .dropTableIfExists('settings');
};
