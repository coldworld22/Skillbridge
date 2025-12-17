exports.up = async (knex) => {
  const hasTable = await knex.schema.hasTable("class_resources");
  if (hasTable) return;

  await knex.schema.createTable("class_resources", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("class_id")
      .notNullable()
      .references("id")
      .inTable("online_classes")
      .onDelete("CASCADE");
    table.string("title").notNullable();
    table
      .enu("resource_type", ["file", "link"], {
        useNative: true,
        enumName: "class_resource_type",
      })
      .notNullable();
    table.text("resource_url").notNullable();
    table.string("mime_type");
    table.integer("size");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("class_resources");
  await knex.raw("DROP TYPE IF EXISTS class_resource_type");
};
