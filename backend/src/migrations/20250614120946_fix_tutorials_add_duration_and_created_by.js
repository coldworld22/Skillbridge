exports.up = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    // 🔁 Fix wrong type for category_id if needed
    table.dropColumn('category_id');
  }).then(() => {
    return knex.schema.alterTable('tutorials', function(table) {
      // ✅ Re-add with correct type
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');

      // ✅ Add missing duration_minutes column
      table.integer('duration_minutes').defaultTo(0);

      // ✅ Add created_by (foreign key to users table)
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');

      // Optional: updated_by
      table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tutorials', function(table) {
    table.dropColumn('category_id');
    table.dropColumn('duration_minutes');
    table.dropColumn('created_by');
    table.dropColumn('updated_by');
  }).then(() => {
    return knex.schema.alterTable('tutorials', function(table) {
      // Revert category_id as integer (only if originally used)
      table.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
    });
  });
};
