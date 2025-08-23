const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.seed = async function(knex) {
  // Clear existing user accounts but keep role definitions
  await knex("user_roles").del();
  await knex("users").del();

  // Ensure the SuperAdmin role exists
  let roleRecord = await knex("roles").where({ name: "SuperAdmin" }).first();
  if (!roleRecord) {
    [roleRecord] = await knex("roles")
      .insert({
        name: "SuperAdmin",
        description: "Platform owner with full access",
        created_at: knex.fn.now(),
      })
      .returning("*");
  }

  // 🔐 Create SuperAdmin User
  const rawPassword =
    process.env.SUPERADMIN_INITIAL_PASSWORD || crypto.randomBytes(16).toString("hex");
  if (!process.env.SUPERADMIN_INITIAL_PASSWORD) {
    console.log(`🔐 Generated SuperAdmin password: ${rawPassword}`);
  }
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const [superAdminUserId] = await knex("users")
    .insert({
      full_name: "Platform Owner",
      email: "support@eduskillbridge.net",
      phone: "+966531505513",
      password_hash: hashedPassword,
      role: "SuperAdmin", // ✅ Role matches updated enum constraint
      avatar_url: null,
      is_email_verified: true,
      status: "active",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning("id");

  // Create matching admin profile
  await knex("admin_profiles").insert({
    user_id: superAdminUserId.id || superAdminUserId,
    job_title: "Super Administrator",
    department: "Management",
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });

  // 🔗 Link user to role (if using a many-to-many system)
  await knex("user_roles").insert({
    user_id: superAdminUserId.id || superAdminUserId,
    role_id: roleRecord.id || roleRecord,
  });

  console.log("✅ SuperAdmin seeded");
};
