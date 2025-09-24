exports.up = function(knex) {
  return knex.schema.alterTable('password_resets', function(table) {
    table.dropColumn('code');
  });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('password_resets', function(table) {
      table.string('code', 10).defaultTo('').notNullable();
    })
    .then(function() {
      return knex.raw('ALTER TABLE password_resets ALTER COLUMN code DROP DEFAULT');
    });
};
