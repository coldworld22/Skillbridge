exports.up = async function(knex) {
  await knex.raw(`
    ALTER TABLE tutorials
    DROP CONSTRAINT IF EXISTS tutorials_status_check,
    ADD CONSTRAINT tutorials_status_check
    CHECK (status IN ('draft','published','archived','suspended'))
  `);
};

exports.down = async function(knex) {
  await knex.raw(`
    ALTER TABLE tutorials
    DROP CONSTRAINT IF EXISTS tutorials_status_check,
    ADD CONSTRAINT tutorials_status_check
    CHECK (status IN ('draft','published','archived'))
  `);
};
