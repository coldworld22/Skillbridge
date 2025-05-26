exports.up = function (knex) {
  return knex.schema.createTable("admin_profiles", function (table) {
    table.uuid("user_id").primary().references("id").inTable("users").onDelete("CASCADE");
    table.string("department").notNullable().defaultTo("General");
    table.jsonb("permissions").defaultTo("{}");
    table.text("notes").nullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("admin_profiles");
};
