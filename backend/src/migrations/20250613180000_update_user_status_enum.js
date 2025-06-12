exports.up = function(knex) {
  return knex.raw(`DO $$
  BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'banned'));
  EXCEPTION WHEN duplicate_object THEN END$$;`);
};

exports.down = function(knex) {
  return knex.raw(`DO $$
  BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status IN ('pending', 'active', 'banned'));
  EXCEPTION WHEN duplicate_object THEN END$$;`);
};
