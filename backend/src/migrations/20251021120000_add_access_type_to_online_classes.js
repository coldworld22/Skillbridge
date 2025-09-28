exports.up = async function () {
  // This migration is intentionally left empty. The access_type column is now
  // fully managed by later migrations that ensure a consistent enum type.
};

exports.down = async function () {
  // No-op: nothing was changed in the up migration.
};
