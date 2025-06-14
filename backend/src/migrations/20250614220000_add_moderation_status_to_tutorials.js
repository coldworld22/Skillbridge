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
  // Knex's `enu` helper automatically creates a CHECK constraint that doesn't
  // allow NULL values. We need to drop that default constraint and replace it
  // with one that permits `NULL` so drafts can be saved without a moderation
  // status. Running the DROP and ADD as separate statements avoids issues with
  // drivers that reject multi‑statement queries.
  await knex.raw(
    `ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_moderation_status_check`
  );
  await knex.raw(
    `ALTER TABLE tutorials ADD CONSTRAINT tutorials_moderation_status_check CHECK (moderation_status IS NULL OR moderation_status IN ('pending','approved','rejected'))`
  );
};

exports.down = function(knex) {
  return knex.schema.alterTable("tutorials", function(table) {
    table.dropColumn("moderation_status");
    table.dropColumn("rejection_reason");
  });
};
