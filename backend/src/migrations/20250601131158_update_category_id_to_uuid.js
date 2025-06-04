exports.up = async function (knex) {
  // تحويل الحقول إلى UUID
  await knex.schema.alterTable("categories", (table) => {
    table.uuid("id").primary().alter();
    table.uuid("parent_id").nullable().alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.integer("id").primary().alter();
    table.integer("parent_id").nullable().alter();
  });
};
