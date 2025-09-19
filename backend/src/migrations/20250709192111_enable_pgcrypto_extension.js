exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
};

exports.down = async function down() {
  // Intentionally left blank to keep dependent defaults using pgcrypto
};
