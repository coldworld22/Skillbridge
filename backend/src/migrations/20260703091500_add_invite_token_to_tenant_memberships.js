exports.up = async (knex) => {
  const hasTable = await knex.schema.hasTable("tenant_memberships");
  if (!hasTable) return;

  const hasInviteToken = await knex.schema.hasColumn(
    "tenant_memberships",
    "invite_token",
  );

  if (!hasInviteToken) {
    await knex.schema.alterTable("tenant_memberships", (table) => {
      table.uuid("invite_token").unique();
    });
  }
};

exports.down = async (knex) => {
  const hasTable = await knex.schema.hasTable("tenant_memberships");
  if (!hasTable) return;

  const hasInviteToken = await knex.schema.hasColumn(
    "tenant_memberships",
    "invite_token",
  );

  if (hasInviteToken) {
    await knex.schema.alterTable("tenant_memberships", (table) => {
      table.dropColumn("invite_token");
    });
  }
};
