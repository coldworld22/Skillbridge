exports.up = function(knex) {
  return knex.schema.createTable('class_lessons', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('class_id').notNullable().references('id').inTable('online_classes').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.timestamp('start_time');
    table.integer('order');
    table.string('topic_file_url');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('class_lessons');
};
