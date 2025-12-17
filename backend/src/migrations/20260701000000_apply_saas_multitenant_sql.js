const fs = require("fs");
const path = require("path");

exports.up = async function up(knex) {
  const sqlPath = path.resolve(
    __dirname,
    "../../../migrations/saas_multitenant.sql",
  );

  let sql;
  try {
    sql = await fs.promises.readFile(sqlPath, "utf8");
  } catch (err) {
    throw new Error(
      `Failed to read saas_multitenant.sql at ${sqlPath}: ${err.message}`,
    );
  }

  if (!sql || !sql.trim()) {
    throw new Error(`saas_multitenant.sql was empty at ${sqlPath}`);
  }

  await knex.raw(sql);
};

exports.down = async function down(knex) {
  // The source SQL is idempotent and establishes core tenant tables/constraints.
  // Rolling it back safely would require carefully dropping the shared enums and
  // columns across many tables, which is out of scope here. Provide a no-op to
  // satisfy Knex's migration contract without attempting a destructive rollback.
  await knex.raw("-- no down migration for saas_multitenant.sql");
};
