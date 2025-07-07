// 📁 migrations/YYYYMMDD_create_categories_table.js

<<<<<<< HEAD
exports.up = function(knex) {
  return knex.schema.createTable('categories', function(table) {
=======
exports.up = function (knex) {
  return knex.schema.createTable('categories', function (table) {
>>>>>>> b2ebd48 (fgf)
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.text('description');
    table.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('categories');
};
