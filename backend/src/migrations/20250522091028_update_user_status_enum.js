exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_status_check,
    ADD CONSTRAINT users_status_check
    CHECK (status IN ('pending', 'active', 'banned'));
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_status_check,
    ADD CONSTRAINT users_status_check
    CHECK (status IN ('active', 'banned'));
  `);
};
