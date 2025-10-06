const logger = require('../utils/logger.js');
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const APP_DOMAIN = process.env.APP_DOMAIN || "example.com";
exports.seed = async function (knex) {
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

  const email = `support@${APP_DOMAIN}`;

  let superAdminUser = await knex("users").where({ email }).first();
  let generatedPassword;

  const buildRandomPassword = () => {
    const base = crypto.randomBytes(32).toString("base64");
    const sanitized = base.replace(/[^a-zA-Z0-9]/g, "");
    if (sanitized.length >= 32) {
      return sanitized.slice(0, 32);
    }
    return sanitized || crypto.randomBytes(32).toString("hex");
  };

  if (!superAdminUser) {
    const rawPassword = process.env.SUPERADMIN_INITIAL_PASSWORD;
    if (!rawPassword) {
      generatedPassword = buildRandomPassword();
    }

    const passwordToHash = rawPassword || generatedPassword;
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const [insertedUser] = await knex("users")
      .insert({
        full_name: "Platform Owner",
        email,
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

    const insertedUserId = insertedUser?.id ?? insertedUser;
    superAdminUser = await knex("users").where({ id: insertedUserId }).first();

    if (generatedPassword) {
      logger.log(
        `🔐 Generated SuperAdmin password for ${email}: ${generatedPassword}`
      );
    }
  } else if (superAdminUser.role !== "SuperAdmin") {
    await knex("users")
      .where({ id: superAdminUser.id })
      .update({ role: "SuperAdmin", updated_at: knex.fn.now() });
    superAdminUser.role = "SuperAdmin";
  }

  const userId = superAdminUser.id;
  const roleId = roleRecord.id || roleRecord;

  const existingProfile = await knex("admin_profiles").where({ user_id: userId }).first();
  if (!existingProfile) {
    await knex("admin_profiles").insert({
      user_id: userId,
      job_title: "Super Administrator",
      department: "Management",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  }

  const existingUserRole = await knex("user_roles")
    .where({ user_id: userId, role_id: roleId })
    .first();
  if (!existingUserRole) {
    await knex("user_roles").insert({
      user_id: userId,
      role_id: roleId,
    });
  }

  logger.log("✅ SuperAdmin role and account ensured");
};
