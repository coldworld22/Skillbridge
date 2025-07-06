exports.up = async function(knex) {
  const exists = await knex.schema.hasTable("user_social_links");

  if (!exists) {
    await knex.schema.createTable("user_social_links", (table) => {
      table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
      table.string("platform", 50).notNullable();
      table.text("url").notNullable();
      table.primary(["user_id", "platform"]);
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  } else {
    // Optional: add created_at if missing
    const hasCreatedAt = await knex.schema.hasColumn("user_social_links", "created_at");
    if (!hasCreatedAt) {
      await knex.schema.alterTable("user_social_links", (table) => {
        table.timestamp("created_at").defaultTo(knex.fn.now());
      });
    }
  }
};

exports.down = async function(knex) {
  // This does not drop the table—just clean rollback
  const exists = await knex.schema.hasTable("user_social_links");
  if (exists) {
    await knex.schema.alterTable("user_social_links", (table) => {
      table.dropColumn("created_at");
    });
  }
};
