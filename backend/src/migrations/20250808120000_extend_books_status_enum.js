const TABLE_NAME = 'books';

exports.up = async function (knex) {
  await knex.schema.raw(`ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT IF EXISTS books_status_check`);
  await knex.schema.raw(
    `ALTER TABLE ${TABLE_NAME} ADD CONSTRAINT books_status_check CHECK (status IN ('pending','approved','rejected','active','inactive'))`
  );
};

exports.down = async function (knex) {
  await knex.schema.raw(`ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT IF EXISTS books_status_check`);
  await knex.schema.raw(
    `ALTER TABLE ${TABLE_NAME} ADD CONSTRAINT books_status_check CHECK (status IN ('pending','approved','rejected'))`
  );
};
