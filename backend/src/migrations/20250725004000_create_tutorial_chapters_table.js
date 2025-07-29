exports.up = function(knex) {
  return knex.schema.createTable('tutorial_chapters', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tutorial_id').notNullable().references('id').inTable('tutorials').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('video_url');
    table.integer('duration');
    table.integer('order');
    table.boolean('is_preview').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorial_chapters');
};
