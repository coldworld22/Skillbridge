// 📁 migrations/xxxx_create_instructor_documents_table.js

exports.up = async function(knex) {
  await knex.schema.createTable("instructor_documents", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.string("type", 100).notNullable(); // e.g., 'course_certificate', 'university_certificate'
    table.string("file_url", 1024).notNullable(); // Cloud/S3 path or filename
    table.timestamp("uploaded_at").defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists("instructor_documents");
};
