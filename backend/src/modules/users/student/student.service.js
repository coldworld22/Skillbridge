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

// 🔹 Update student + profile + links
const updateStudentProfile = async (userId, userData, studentData, socialLinks = []) => {
    await db("users").where({ id: userId }).update({
        ...userData,
        profile_complete: true,
    });

    const existing = await db("student_profiles").where({ user_id: userId }).first();
    if (existing) {
        await db("student_profiles").where({ user_id: userId }).update(studentData);
    } else {
        await db("student_profiles").insert({ user_id: userId, ...studentData });
    }

    await db("user_social_links").where({ user_id: userId }).del();
    for (const link of socialLinks) {
        if (link.url) {
            await db("user_social_links").insert({ user_id: userId, platform: link.platform, url: link.url });
        }
    }
};



module.exports = {
    getStudentProfile,
    updateStudentProfile,
};
