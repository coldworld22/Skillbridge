exports.up = function (knex) {
  return knex.raw('CREATE INDEX tutorials_lower_title_idx ON tutorials (LOWER(title));');
};

exports.down = function (knex) {
  return knex.raw('DROP INDEX IF EXISTS tutorials_lower_title_idx;');
};
