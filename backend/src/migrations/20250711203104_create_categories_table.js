exports.up = function(knex) {
  return knex.schema.createTable("categories", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()")); // ✅ إضافة default
    table.string("name").notNullable();
    table.uuid("parent_id").nullable().references("id").inTable("categories").onDelete("SET NULL"); // ✅ ربط self-reference
    table.string("status").notNullable().defaultTo("active");
    table.string("slug").notNullable().unique(); // ✅ slug يجب أن يكون فريدًا
    table.string("image_url");
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("categories");
};
