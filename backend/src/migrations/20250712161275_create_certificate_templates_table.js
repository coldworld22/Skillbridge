exports.up = function(knex) {
  return knex.schema.createTable('certificate_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('type').defaultTo('Completion');
    table.string('font_family').defaultTo('Georgia, serif');
    table.string('title_font').defaultTo("'Great Vibes', cursive");
    table.string('border_color').defaultTo('#FACC15');
    table.string('logo');
    table.string('background');
    table.boolean('show_qr').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('certificate_templates');
};
