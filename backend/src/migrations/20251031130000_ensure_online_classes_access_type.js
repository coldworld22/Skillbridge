const TABLE_NAME = 'online_classes';
const COLUMN_NAME = 'access_type';
const ENUM_NAME = 'online_class_access_type';
const ENUM_VALUES = ['paid', 'free'];

const ensureEnumType = async (knex) => {
  const {
    rows: [typeExists],
  } = await knex.raw(
    "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ?) AS exists",
    [ENUM_NAME]
  );

  if (!typeExists?.exists) {
    const valuesSql = ENUM_VALUES.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
    await knex.raw(`CREATE TYPE ${ENUM_NAME} AS ENUM (${valuesSql})`);
  }
};

const ensureColumnConstraints = async (knex) => {
  await knex.raw(
    `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${COLUMN_NAME} SET DEFAULT '${ENUM_VALUES[0]}'::${ENUM_NAME}`
  );
  await knex.raw(`ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${COLUMN_NAME} SET NOT NULL`);
};

exports.up = async function up(knex) {
  await ensureEnumType(knex);

  const hasColumn = await knex.schema.hasColumn(TABLE_NAME, COLUMN_NAME);

  if (!hasColumn) {
    await knex.raw(
      `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} ${ENUM_NAME} NOT NULL DEFAULT '${ENUM_VALUES[0]}'::${ENUM_NAME}`
    );
    return;
  }

  const columnInfo = await knex('information_schema.columns')
    .select('udt_name')
    .where({
      table_schema: 'public',
      table_name: TABLE_NAME,
      column_name: COLUMN_NAME,
    })
    .first();

  if (columnInfo?.udt_name !== ENUM_NAME) {
    const allowedValuesSql = ENUM_VALUES.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
    await knex.raw(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${COLUMN_NAME} TYPE ${ENUM_NAME} USING CASE
        WHEN ${COLUMN_NAME}::text IN (${allowedValuesSql})
          THEN ${COLUMN_NAME}::text::${ENUM_NAME}
        ELSE '${ENUM_VALUES[0]}'::${ENUM_NAME}
      END`
    );
  }

  await knex(TABLE_NAME)
    .whereNull(COLUMN_NAME)
    .update({ [COLUMN_NAME]: ENUM_VALUES[0] });

  await ensureColumnConstraints(knex);
};

exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn(TABLE_NAME, COLUMN_NAME);

  if (hasColumn) {
    await knex.raw(`ALTER TABLE ${TABLE_NAME} DROP COLUMN ${COLUMN_NAME}`);
  }

  const {
    rows: [typeExists],
  } = await knex.raw(
    "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ?) AS exists",
    [ENUM_NAME]
  );

  if (typeExists?.exists) {
    const {
      rows: [usage],
    } = await knex.raw(
      `SELECT EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE atttypid = '${ENUM_NAME}'::regtype
      ) AS in_use`
    );

    if (!usage?.in_use) {
      await knex.raw(`DROP TYPE ${ENUM_NAME}`);
    }
  }
};
