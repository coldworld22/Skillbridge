exports.up = async (knex) => {
  const hasColumn = await knex.schema.hasColumn("payments", "coupon_id");
  if (hasColumn) return;
  await knex.schema.alterTable("payments", (table) => {
    table
      .uuid("coupon_id")
      .nullable()
      .references("id")
      .inTable("coupons")
      .onDelete("SET NULL");
  });
};

exports.down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn("payments", "coupon_id");
  if (!hasColumn) return;
  await knex.schema.alterTable("payments", (table) => {
    table.dropColumn("coupon_id");
  });
};
