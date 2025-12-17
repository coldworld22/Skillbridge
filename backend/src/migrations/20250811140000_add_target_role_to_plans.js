exports.up = function (knex) {
  return knex.schema.alterTable('plans', (table) => {
    table.enu('target_role', ['student', 'instructor']).notNullable().defaultTo('student');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('plans', (table) => {
    table.dropColumn('target_role');
  });
};
