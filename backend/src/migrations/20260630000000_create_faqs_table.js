// The faqs table existed in deployed databases but was never created by a
// migration, so fresh databases failed at 20260701000000. Guarded with
// hasTable so existing databases are left untouched.
exports.up = async function up(knex) {
  if (await knex.schema.hasTable("faqs")) return;
  await knex.schema.createTable("faqs", (table) => {
    table.increments("id").primary();
    table.string("question", 500).notNullable();
    table.text("answer").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("faqs");
};
