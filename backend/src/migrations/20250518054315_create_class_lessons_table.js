exports.up = function(knex) {
  return knex.schema.createTable('class_lessons', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('content'); // lesson notes or description
    table.integer('order'); // lesson order
    table.string('video_url'); // optional video link
    table.timestamp('start_time'); // scheduled start
    table.timestamp('end_time'); // scheduled end
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_lessons');
};
