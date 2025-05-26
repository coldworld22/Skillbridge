/**
 * Instructor Profile Service
 * @file instructor.service.js
 */

const db = require("../../../config/database");

// ✅ Utility to validate URL (basic)
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// 🔹 Get full instructor profile (user + instructor + social + certificates)
const getInstructorProfile = async (userId) => {
  const [user] = await db("users")
    .where({ id: userId })
    .select(
      "id",
      "full_name",
      "email",
      "phone",
      "avatar_url",
      "gender",
      "date_of_birth",
      "profile_complete"
    );

  const [instructor] = await db("instructor_profiles")
    .where({ user_id: userId })
    .select(
      "expertise",
      "experience",
      "certifications",
      "availability",
      "pricing",
      "demo_video_url"
    );

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  const certificates = await db("instructor_certificates")
    .where({ user_id: userId })
    .select("id", "title", "file_url", "created_at");

  return {
    ...user,
    instructor,
    social_links: socialLinks,
    certificates,
  };
};

// 🔹 Update instructor user data, profile data, and social links in a transaction
const updateInstructorProfile = async (userId, userData, instructorData, socialLinks = []) => {
  await db.transaction(async (trx) => {
    // ✅ Update users table
    await trx("users").where({ id: userId }).update({
      ...userData,
      profile_complete: true,
    });

    // ✅ Upsert instructor profile
    const existing = await trx("instructor_profiles").where({ user_id: userId }).first();
    if (existing) {
      await trx("instructor_profiles").where({ user_id: userId }).update(instructorData);
    } else {
      await trx("instructor_profiles").insert({ user_id: userId, ...instructorData });
    }

    // ✅ Replace social links
    await trx("user_social_links").where({ user_id: userId }).del();
    for (const link of socialLinks) {
      if (link.url && isValidUrl(link.url)) {
        await trx("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: link.url,
        });
      }
    }
  });
};

module.exports = {
  getInstructorProfile,
  updateInstructorProfile,
};
