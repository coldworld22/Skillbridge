exports.up = function(knex) {
  return knex.schema.createTable('online_classes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.string('level'); // beginner, intermediate, advanced
    table.string('cover_image');
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.enu('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('online_classes');
};