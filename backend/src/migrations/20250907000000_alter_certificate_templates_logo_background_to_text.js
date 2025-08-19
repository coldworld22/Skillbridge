exports.up = function (knex) {
  return knex.schema.alterTable('certificate_templates', function (table) {
    table.text('logo').alter();
    table.text('background').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('certificate_templates', function (table) {
    table.string('logo').alter();
    table.string('background').alter();
  });
};
