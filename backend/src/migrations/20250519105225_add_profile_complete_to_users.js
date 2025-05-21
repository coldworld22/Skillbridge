exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('profile_complete').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('profile_complete');
  });
};
