// 📁 migrations/YYYYMMDD_create_tutorials_table.js

exports.up = function(knex) {
  return knex.schema.createTable('tutorials', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('instructor_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('description');
    table.string('level'); // beginner, intermediate, advanced
    table.string('preview_video');
    table.string('cover_image');
    table.enu('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.boolean('is_paid').defaultTo(false);
    table.decimal('price', 10, 2);
    table.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tutorials');
};
