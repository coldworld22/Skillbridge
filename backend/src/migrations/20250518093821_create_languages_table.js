// 📁 migrations/YYYYMMDD_create_languages_table.js

exports.up = function(knex) {
  return knex.schema.createTable('languages', function(table) {
    table.increments('id').primary();
    table.string('label').notNullable();       // e.g., "Arabic"
    table.string('code').notNullable().unique(); // e.g., "ar", "en"
    table.boolean('rtl').defaultTo(false);     // Right-to-left support
    table.boolean('active').defaultTo(true);
    table.boolean('default').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('languages');
};
