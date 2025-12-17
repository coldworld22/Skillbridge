/**
 * Adds a features JSONB column to plans and seeds feature limits for existing plans.
 */

exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("plans", "features");
  if (!hasColumn) {
    await knex.schema.alterTable("plans", (table) => {
      table.jsonb("features").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    });
  }

  const seedFeatures = (features) => knex.raw("?", [features]);

  await knex("plans")
    .where({ slug: "basic" })
    .update({
      features: seedFeatures({
        max_users: 20,
        max_instructors: 3,
        max_classes: 20,
        max_books: 50,
        max_book_categories: 20,
        storage_bytes: 5_368_709_120, // 5 GB
        marketplace_enabled: false,
      }),
    });

  await knex("plans")
    .where({ slug: "regular" })
    .update({
      features: seedFeatures({
        max_users: 100,
        max_instructors: 10,
        max_classes: 100,
        max_books: 200,
        max_book_categories: 50,
        storage_bytes: 21_474_836_480, // 20 GB
        marketplace_enabled: true,
      }),
    });

  await knex("plans")
    .where({ slug: "prime" })
    .update({
      features: seedFeatures({
        max_users: 500,
        max_instructors: 50,
        max_classes: 500,
        max_books: 1000,
        max_book_categories: 100,
        storage_bytes: 107_374_182_400, // 100 GB
        marketplace_enabled: true,
      }),
    });

  await knex("plans")
    .where({ slug: "instructor-basic" })
    .update({
      features: seedFeatures({
        max_users: 10,
        max_instructors: 1,
        max_classes: 10,
        max_books: 20,
        max_book_categories: 10,
        storage_bytes: 2_147_483_648, // 2 GB
        marketplace_enabled: true,
      }),
    });

  await knex("plans")
    .where({ slug: "instructor-pro" })
    .update({
      features: seedFeatures({
        max_users: 50,
        max_instructors: 5,
        max_classes: 50,
        max_books: 200,
        max_book_categories: 50,
        storage_bytes: 10_737_418_240, // 10 GB
        marketplace_enabled: true,
      }),
    });

  await knex("plans")
    .where({ slug: "default-tenant-plan" })
    .update({
      features: seedFeatures({
        max_users: 200,
        max_instructors: 20,
        max_classes: 200,
        max_books: 500,
        max_book_categories: 100,
        storage_bytes: 21_474_836_480, // 20 GB
        marketplace_enabled: true,
      }),
    });
};

exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("plans", "features");
  if (hasColumn) {
    await knex.schema.alterTable("plans", (table) => {
      table.dropColumn("features");
    });
  }
};
