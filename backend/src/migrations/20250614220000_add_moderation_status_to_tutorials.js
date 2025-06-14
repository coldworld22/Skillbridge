// 📁 migrations/20250614220000_add_moderation_status_to_tutorials.js
exports.up = async function(knex) {
  const hasModeration = await knex.schema.hasColumn("tutorials", "moderation_status");
  const hasRejectionReason = await knex.schema.hasColumn("tutorials", "rejection_reason");

  return knex.schema.alterTable("tutorials", function(table) {
    if (!hasModeration) {
      table.enu("moderation_status", ["pending", "approved", "rejected"]).defaultTo("pending");
    }
    if (!hasRejectionReason) {
      table.text("rejection_reason");
    }
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("tutorials", function(table) {
    table.dropColumn("moderation_status");
    table.dropColumn("rejection_reason");
  });
};
