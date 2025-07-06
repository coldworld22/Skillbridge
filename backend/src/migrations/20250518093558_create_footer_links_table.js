// 📁 migrations/YYYYMMDD_create_footer_links_table.js

exports.up = function(knex) {
  return knex.schema.createTable('footer_links', function(table) {
    table.increments('id').primary();
    table.string('label').notNullable();         // e.g., "About", "Contact"
    table.string('url').notNullable();           // e.g., "/about", "https://..."
    table.string('group').defaultTo('quick');    // e.g., quick, legal, explore
    table.integer('order').defaultTo(0);         // ordering within group
    table.boolean('visible').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('footer_links');
};
