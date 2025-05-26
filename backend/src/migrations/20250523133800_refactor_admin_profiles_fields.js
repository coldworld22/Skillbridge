exports.up = async function (knex) {
  // Step 1: Backup the admin_profiles table
  await knex.raw(`CREATE TABLE IF NOT EXISTS admin_profiles_backup AS TABLE admin_profiles`);

  // Step 2: Safely check for columns before updating
  const hasAvatar = await knex.schema.hasColumn("admin_profiles", "avatar_url");
  const hasGender = await knex.schema.hasColumn("admin_profiles", "gender");
  const hasDob = await knex.schema.hasColumn("admin_profiles", "date_of_birth");

  if (hasAvatar || hasGender || hasDob) {
    const updateFields = [];
    if (hasAvatar) updateFields.push(`avatar_url = COALESCE(u.avatar_url, ap.avatar_url)`);
    if (hasGender) updateFields.push(`gender = COALESCE(u.gender, ap.gender)`);
    if (hasDob) updateFields.push(`date_of_birth = COALESCE(u.date_of_birth, ap.date_of_birth)`);

    await knex.raw(`
      UPDATE users u
      SET ${updateFields.join(", ")}
      FROM admin_profiles ap
      WHERE ap.user_id = u.id
    `);
  }

  // Step 3: Drop columns if they exist
  await knex.schema.alterTable("admin_profiles", (table) => {
    if (hasAvatar) table.dropColumn("avatar_url");
    if (hasGender) table.dropColumn("gender");
    if (hasDob) table.dropColumn("date_of_birth");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("admin_profiles", (table) => {
    table.string("avatar_url").nullable();
    table.string("gender", 255).nullable();
    table.date("date_of_birth").nullable();
  });

  await knex.raw(`
    UPDATE admin_profiles ap
    SET
      avatar_url = b.avatar_url,
      gender = b.gender,
      date_of_birth = b.date_of_birth
    FROM admin_profiles_backup b
    WHERE ap.user_id = b.user_id
  `);
};
