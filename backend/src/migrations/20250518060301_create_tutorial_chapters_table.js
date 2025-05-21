// 📁 migrations/YYYYMMDD_create_tutorial_chapters_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorial_chapters', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('content'); // optional explanation or notes
    table.string('video_url'); // video file or YouTube link
    table.integer('order'); // order within tutorial
    table.boolean('is_preview').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_chapters');
};
