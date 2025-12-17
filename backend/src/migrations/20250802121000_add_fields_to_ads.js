exports.up = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.timestamp('start_at');
    table.timestamp('end_at');
    table.specificType('target_roles', 'text[]').defaultTo('{}');
    table.string('ad_type');
    table.integer('priority').defaultTo(0);
    table.boolean('allow_branding').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.dropColumn('start_at');
    table.dropColumn('end_at');
    table.dropColumn('target_roles');
    table.dropColumn('ad_type');
    table.dropColumn('priority');
    table.dropColumn('allow_branding');
  });
};
