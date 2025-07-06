const { ROLE_NAMES } = require("../utils/enums");

exports.up = async function(knex) {
  const roles = ROLE_NAMES.map((r) => `'${r}'`).join(', ');
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check,
    ADD CONSTRAINT users_role_check
    CHECK (role IN (${roles}));
  `);
};

exports.down = async function(knex) {
  const roles = ROLE_NAMES.filter((r) => r !== 'SuperAdmin')
    .map((r) => `'${r}'`)
    .join(', ');
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check,
    ADD CONSTRAINT users_role_check
    CHECK (role IN (${roles}));
  `);
};
