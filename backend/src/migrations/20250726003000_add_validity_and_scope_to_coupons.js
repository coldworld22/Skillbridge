exports.up = function(knex) {
  return knex.schema.alterTable('coupons', function(table) {
    table.timestamp('starts_at');
    table.enum('applies_to', ['tutorial', 'class', 'plan', 'book']);
    table.uuid('applies_to_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('coupons', function(table) {
    table.dropColumn('starts_at');
    table.dropColumn('applies_to');
    table.dropColumn('applies_to_id');
  });
};
