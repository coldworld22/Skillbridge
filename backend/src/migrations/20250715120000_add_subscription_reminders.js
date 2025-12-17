exports.up = async function (knex) {
  const hasRenewalColumn = await knex.schema.hasColumn(
    "user_subscriptions",
    "renewal_notice_sent_at"
  );
  const hasExpiryColumn = await knex.schema.hasColumn(
    "user_subscriptions",
    "expiry_notice_sent_at"
  );

  await knex.schema.table("user_subscriptions", (table) => {
    if (!hasRenewalColumn) {
      table.timestamp("renewal_notice_sent_at", { useTz: true }).nullable();
    }
    if (!hasExpiryColumn) {
      table.timestamp("expiry_notice_sent_at", { useTz: true }).nullable();
    }
  });
};

exports.down = async function (knex) {
  const hasRenewalColumn = await knex.schema.hasColumn(
    "user_subscriptions",
    "renewal_notice_sent_at"
  );
  const hasExpiryColumn = await knex.schema.hasColumn(
    "user_subscriptions",
    "expiry_notice_sent_at"
  );

  await knex.schema.table("user_subscriptions", (table) => {
    if (hasRenewalColumn) {
      table.dropColumn("renewal_notice_sent_at");
    }
    if (hasExpiryColumn) {
      table.dropColumn("expiry_notice_sent_at");
    }
  });
};
