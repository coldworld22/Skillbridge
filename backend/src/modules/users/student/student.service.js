const db = require("../../../config/database");

// 🔹 Get full student profile
const getStudentProfile = async (userId) => {
    const [user] = await db("users")
        .where({ id: userId })
        .select("id", "full_name", "email", "phone", "avatar_url", "gender", "date_of_birth", "profile_complete");

    const [student] = await db("student_profiles")
        .where({ user_id: userId })
        .select("education_level", "topics", "learning_goals", "identity_doc_url");

    const socialLinks = await db("user_social_links")
        .where({ user_id: userId })
        .select("platform", "url");

    return { ...user, student, social_links: socialLinks };
};

// 🔹 Update student + profile + links in a transaction
const updateStudentProfile = async (userId, userData, studentData, socialLinks = []) => {
    try {
        return await db.transaction(async (trx) => {
            const requiredUserFields = ["full_name", "phone", "gender", "date_of_birth"];
            const hasUserFields = requiredUserFields.every((f) => userData && userData[f]);
            const hasStudentDetails = studentData && studentData.education_level;
            const hasSocialLinks = Array.isArray(socialLinks) && socialLinks.length > 0;

            const profileComplete = hasUserFields && hasStudentDetails && hasSocialLinks;

            const userUpdateData = { ...userData };
            if (profileComplete) userUpdateData.profile_complete = true;

            const updated = await trx("users").where({ id: userId }).update(userUpdateData);
            if (updated === 0) throw new Error("Failed to update user record");

            const existing = await trx("student_profiles").where({ user_id: userId }).first();
            if (existing) {
                const updatedProfile = await trx("student_profiles").where({ user_id: userId }).update(studentData);
                if (updatedProfile === 0) throw new Error("Failed to update student profile");
            } else {
                const insertedProfile = await trx("student_profiles").insert({ user_id: userId, ...studentData });
                if (!insertedProfile || insertedProfile.length === 0) throw new Error("Failed to create student profile");
            }

            await trx("user_social_links").where({ user_id: userId }).del();
            for (const link of socialLinks) {
                if (link.url) {
                    const insertedLink = await trx("user_social_links").insert({ user_id: userId, platform: link.platform, url: link.url });
                    if (!insertedLink || insertedLink.length === 0) throw new Error("Failed to add social link");
                }
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
