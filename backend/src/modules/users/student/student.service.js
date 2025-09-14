const db = require("../../../config/database");
const { allowedPlatforms } = require("../common/socialPlatforms");

// Normalize and sanitize social links
const normalizeUrl = (url = "") => {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const sanitizeSocialLinks = (links) =>
  Array.isArray(links)
    ? links
        .filter(
          (link) =>
            link &&
            typeof link.url === "string" &&
            typeof link.platform === "string" &&
            allowedPlatforms.includes(link.platform.trim().toLowerCase()) &&
            link.url.trim()
        )
        .map((link) => ({
          platform: link.platform.trim().toLowerCase(),
          url: normalizeUrl(link.url),
        }))
    : [];

// 🔹 Get full student profile
const getStudentProfile = async (userId) => {
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

  const [student] = await db("student_profiles")
    .where({ user_id: userId })
    .select("education_level", "topics", "learning_goals", "identity_doc_url");

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  return { ...user, student, social_links: socialLinks };
};

// 🔹 Update student + profile + links in a transaction
const updateStudentProfile = async (
  userId,
  userData = {},
  studentData = {},
  socialLinks = []
) => {
  const sanitizedLinks = sanitizeSocialLinks(socialLinks);

  try {
    return await db.transaction(async (trx) => {
      const requiredUserFields = [
        "full_name",
        "phone",
        "gender",
        "date_of_birth",
      ];
      const hasUserFields = requiredUserFields.every(
        (f) => userData && userData[f]
      );
      const hasStudentDetails = studentData && studentData.education_level;
      const hasSocialLinks = sanitizedLinks.length > 0;

      const profileComplete =
        hasUserFields && hasStudentDetails && hasSocialLinks;

      const updated = await trx("users")
        .where({ id: userId })
        .update({ ...userData, profile_complete: profileComplete });
      if (updated === 0) throw new Error("Failed to update user record");

      const existing = await trx("student_profiles")
        .where({ user_id: userId })
        .first();
      if (existing) {
        const updatedProfile = await trx("student_profiles")
          .where({ user_id: userId })
          .update(studentData);
        if (updatedProfile === 0)
          throw new Error("Failed to update student profile");
      } else {
        const insertedProfile = await trx("student_profiles").insert({
          user_id: userId,
          ...studentData,
        });
        if (!insertedProfile || insertedProfile.length === 0)
          throw new Error("Failed to create student profile");
      }

      await trx("user_social_links").where({ user_id: userId }).del();
      for (const link of sanitizedLinks) {
        const insertedLink = await trx("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: link.url,
        });
        if (!insertedLink || insertedLink.length === 0)
          throw new Error("Failed to add social link");
      }

      return { profile_complete: profileComplete };
    });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
};

