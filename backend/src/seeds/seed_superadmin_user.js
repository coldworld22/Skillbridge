const logger = require('../utils/logger.js');
const bcrypt = require("bcrypt");

const APP_DOMAIN = process.env.APP_DOMAIN || "example.com";
exports.seed = async function (knex) {
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

  // 🔐 Create SuperAdmin User with a fixed password
  const rawPassword = "Javaheat@18880";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const [superAdminUserId] = await knex("users")
    .insert({
      full_name: "Platform Owner",
      email: `support@${APP_DOMAIN}`,
      phone: "+966531505513",
      password_hash: hashedPassword,
      role: "SuperAdmin",
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

  logger.log("✅ SuperAdmin seeded");
};
