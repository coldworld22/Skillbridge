exports.up = function (knex) {
  return knex.schema.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS tutorials_slug_unique_idx ON tutorials (slug)'
  );
};

exports.down = function (knex) {
  return knex.schema.raw(
    'DROP INDEX IF EXISTS tutorials_slug_unique_idx'
  );
};
