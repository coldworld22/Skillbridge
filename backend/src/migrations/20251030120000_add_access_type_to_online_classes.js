exports.up = async function () {
  // Access type column is fully managed by earlier migrations.
  // This migration is now a no-op to avoid duplicating column definitions.
};

exports.down = async function () {
  // No-op.
};
