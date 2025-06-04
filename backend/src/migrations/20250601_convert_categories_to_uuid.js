const { v4: uuidv4 } = require("uuid");

exports.up = async function (knex) {
  // 1. أنشئ جدول جديد بعمود UUID
  await knex.schema.createTable("categories_temp", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.uuid("parent_id").nullable();
    table.string("status").notNullable().defaultTo("active");
    table.string("slug").notNullable();
    table.string("image_url");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 2. نسخ البيانات من الجدول القديم للجدول الجديد
  const oldCategories = await knex("categories").select("*");

  // خريطة لتعديل parent_id المرتبط بـ id القديم
  const idMap = {};
  for (const cat of oldCategories) {
    idMap[cat.id] = uuidv4();
  }

  // أدخل البيانات مع تحويل IDs و parent_ids
  for (const cat of oldCategories) {
    await knex("categories_temp").insert({
      id: idMap[cat.id],
      name: cat.name,
      parent_id: cat.parent_id ? idMap[cat.parent_id] : null,
      status: cat.status || "active",
      slug: cat.slug || "",
      image_url: cat.image_url || null,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    });
  }

  // 3. حذف الجدول القديم
  await knex.schema.dropTable("categories");

  // 4. إعادة تسمية الجدول الجديد
  await knex.schema.renameTable("categories_temp", "categories");
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("categories");
};
