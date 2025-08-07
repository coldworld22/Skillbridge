const TABLE_NAME = 'books';
const ENUM_NAME = 'enum_books_status';

exports.up = async function (knex) {
  await knex.schema.raw(`ALTER TYPE ${ENUM_NAME} ADD VALUE IF NOT EXISTS 'active';`);
  await knex.schema.raw(`ALTER TYPE ${ENUM_NAME} ADD VALUE IF NOT EXISTS 'inactive';`);
};

exports.down = async function (knex) {
  // PostgreSQL does not support easily removing enum values
  // so this migration is irreversible
};
