exports.up = async function(knex) {
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check,
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('Student', 'Instructor', 'Admin', 'SuperAdmin'));
  `);
};

exports.down = async function(knex) {
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check,
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('Student', 'Instructor', 'Admin'));
  `);
};
