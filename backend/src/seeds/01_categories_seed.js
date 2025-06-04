// 📁 seeds/01_categories_seed.js
const { v4: uuidv4 } = require("uuid");

exports.seed = async function (knex) {
  // 1️⃣ حذف جميع البيانات القديمة
  await knex("categories").del();

  // 2️⃣ التصنيفات الرئيسية (جذرية)
  const devId = uuidv4();
  const designId = uuidv4();

  const rootCategories = [
    {
      id: devId,
      name: "Development",
      slug: "development",
      status: "active",
      parent_id: null,
      image_url: "/uploads/categories/dev.jpg",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: designId,
      name: "Design",
      slug: "design",
      status: "active",
      parent_id: null,
      image_url: "/uploads/categories/design.jpg",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // 3️⃣ التصنيفات الفرعية
  const subCategories = [
    {
      id: uuidv4(),
      name: "Web Development",
      slug: "web-development",
      status: "active",
      parent_id: devId,
      image_url: "/uploads/categories/web.jpg",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: "Mobile Development",
      slug: "mobile-development",
      status: "active",
      parent_id: devId,
      image_url: "/uploads/categories/mobile.jpg",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: "UI/UX Design",
      slug: "ui-ux-design",
      status: "active",
      parent_id: designId,
      image_url: "/uploads/categories/uiux.jpg",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // 4️⃣ إدخال الكل دفعة واحدة
  await knex("categories").insert([...rootCategories, ...subCategories]);
};
