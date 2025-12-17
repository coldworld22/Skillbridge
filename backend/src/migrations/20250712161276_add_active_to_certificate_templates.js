exports.up = function(knex) {
  return knex.schema.alterTable('certificate_templates', function(table) {
    table.boolean('active').defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('certificate_templates', function(table) {
    table.dropColumn('active');
  });
};
