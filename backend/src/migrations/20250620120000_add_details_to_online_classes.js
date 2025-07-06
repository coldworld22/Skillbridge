exports.up = function(knex) {
  return knex.schema.alterTable('online_classes', function(table) {
    table.decimal('price', 10, 2);
    table.integer('max_students');
    table.string('language');
    table.boolean('allow_installments').defaultTo(false);
    table.string('slug');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('online_classes', function(table) {
    table.dropColumn('price');
    table.dropColumn('max_students');
    table.dropColumn('language');
    table.dropColumn('allow_installments');
    table.dropColumn('slug');
  });
};
