exports.up = function (knex) {
  return knex.schema.alterTable('plans', (table) => {
    table.integer('max_courses');
    table.integer('ad_credits').defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('plans', (table) => {
    table.dropColumn('max_courses');
    table.dropColumn('ad_credits');
  });
};
