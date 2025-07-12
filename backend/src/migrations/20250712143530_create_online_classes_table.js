exports.up = function(knex) {
  return knex.schema.createTable('online_classes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('description');
    table.string('level');
    table.string('cover_image');
    table.date('start_date');
    table.date('end_date');
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.decimal('price', 10, 2);
    table.integer('max_students');
    table.string('language');
    table.string('demo_video_url');
    table.boolean('allow_installments').defaultTo(false);
    table.enu('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.enu('moderation_status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
    table.text('rejection_reason');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('online_classes');
};
