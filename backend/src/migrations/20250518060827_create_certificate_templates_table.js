// 📁 migrations/YYYYMMDD_create_certificate_templates_table.js

exports.up = function(knex) {
  return knex.schema.createTable('certificate_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('type').defaultTo('Completion'); // Completion, Excellence, etc.
    table.string('font_family').defaultTo('Georgia, serif');
    table.string('title_font').defaultTo("'Great Vibes', cursive");
    table.string('border_color').defaultTo('#FACC15');
    table.string('logo');         // logo image URL
    table.string('background');   // background image URL
    table.boolean('show_qr').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('certificate_templates');
};
