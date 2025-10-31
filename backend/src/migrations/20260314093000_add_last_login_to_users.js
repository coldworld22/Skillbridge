exports.up = async function (knex) {
  const hasUsersTable = await knex.schema.hasTable("users");
  if (!hasUsersTable) return;

  const hasLastLoginAt = await knex.schema.hasColumn("users", "last_login_at");
  if (!hasLastLoginAt) {
    await knex.schema.alterTable("users", (table) => {
      table.timestamp("last_login_at");
    });
  }

  const hasLastLoginIp = await knex.schema.hasColumn("users", "last_login_ip");
  if (!hasLastLoginIp) {
    await knex.schema.alterTable("users", (table) => {
      table.string("last_login_ip", 45);
    });
  }
};

exports.down = async function (knex) {
  const hasUsersTable = await knex.schema.hasTable("users");
  if (!hasUsersTable) return;

  const hasLastLoginAt = await knex.schema.hasColumn("users", "last_login_at");
  const hasLastLoginIp = await knex.schema.hasColumn("users", "last_login_ip");

  if (hasLastLoginAt || hasLastLoginIp) {
    await knex.schema.alterTable("users", (table) => {
      if (hasLastLoginAt) {
        table.dropColumn("last_login_at");
      }
      if (hasLastLoginIp) {
        table.dropColumn("last_login_ip");
      }
    });
  }
};
