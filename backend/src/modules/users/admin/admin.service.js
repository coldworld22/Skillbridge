// 📁 src/modules/users/admin/admin.service.js

const db = require("../../../config/database");

/**
 * Fetch admin profile data by user_id
 * @param {string} userId
 */
exports.getAdminProfile = (userId) => {
  return db("admin_profiles").where({ user_id: userId }).first();
};

/**
 * Create or update admin profile details
 * @param {string} userId
 * @param {object} data - { gender, date_of_birth, avatar_url, identity_doc_url, etc. }
 */
exports.updateAdminProfile = async (userId, data) => {
  const exists = await db("admin_profiles").where({ user_id: userId }).first();

  const profileData = {
    ...data,
    updated_at: new Date(),
  };

  if (exists) {
    await db("admin_profiles").where({ user_id: userId }).update(profileData);
  } else {
    await db("admin_profiles").insert({
      user_id: userId,
      ...profileData,
      created_at: new Date(),
    });
  }
};
