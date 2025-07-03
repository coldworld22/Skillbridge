// 📁 src/modules/users/tutorials/tutorial.service.js
const db = require("../../../config/database");

exports.createTutorial = async (data) => {
  const [tutorial] = await db("tutorials").insert(data).returning("*");
  return tutorial;
};

exports.getAllTutorials = async () => {
  return db("tutorials")
    .leftJoin("categories", "tutorials.category_id", "categories.id")
    .leftJoin("users", "tutorials.instructor_id", "users.id")
    .whereNot("tutorials.status", "archived")
    .orderBy("tutorials.created_at", "desc")
    .select(
      "tutorials.*",
      "categories.name as category_name",
      "categories.image_url as category_image_url",
      "users.full_name as instructor_name"
    );
};

exports.getTutorialById = async (id) => {
  return db("tutorials")
    .leftJoin("categories", "tutorials.category_id", "categories.id")
    .leftJoin("users", "tutorials.instructor_id", "users.id")
    .where("tutorials.id", id)
    .first(
      "tutorials.*",
      "categories.name as category_name",
      "categories.image_url as category_image_url",
      "users.full_name as instructor_name"
    );
};

exports.updateTutorial = async (id, data) => {
  const [updated] = await db("tutorials").where({ id }).update(data).returning("*");
  return updated;
};

exports.updateStatus = async (id, data) => {
  return db("tutorials").where({ id }).update(data);
};

exports.permanentlyDeleteTutorial = async (id) => {
  return db("tutorials").where({ id }).del();
};

exports.togglePublishStatus = async (id) => {
  const tutorial = await db("tutorials").where({ id }).first();
  const newStatus = tutorial.status === "published" ? "draft" : "published";
  return db("tutorials").where({ id }).update({ status: newStatus });
};

exports.updateModeration = async (id, status, reason = null) => {
  return db("tutorials").where({ id }).update({
    moderation_status: status,
    rejection_reason: reason
  });
};

exports.bulkUpdateModeration = async (ids, status) => {
  return db("tutorials").whereIn("id", ids).update({
    moderation_status: status
  });
};

exports.bulkUpdateStatus = async (ids, status) => {
  return db("tutorials").whereIn("id", ids).update({ status });
};

exports.bulkDeleteTutorials = async (ids) => {
  return db("tutorials").whereIn("id", ids).del();
};

exports.getArchivedTutorials = async () => {
  return db("tutorials")
    .where({ status: "archived" })
    .orderBy("updated_at", "desc");
};

exports.getFeaturedTutorials = async () => {
  return db("tutorials")
    .where({ status: "published", moderation_status: "Approved" })
    .orderBy("created_at", "desc")
    .limit(6);
};

exports.getPublishedTutorials = async () => {
  return db("tutorials")
    .where({ status: "published", moderation_status: "Approved" })
    .orderBy("created_at", "desc");
};

exports.getTutorialsByCategory = async (categoryId) => {
  return db("tutorials")
    .where({
      category_id: categoryId,
      status: "published",
      moderation_status: "Approved",
    })
    .orderBy("created_at", "desc");
};

exports.getPublicTutorialDetails = async (id) => {
  const tutorial = await db("tutorials")
    .where({ id, status: "published", moderation_status: "Approved" })
    .first();

  if (!tutorial) return null;

  const chapters = await db("tutorial_chapters")
    .where({ tutorial_id: id })
    .orderBy("order");

  return { ...tutorial, chapters };
};

exports.addTutorialTags = async (tutorialId, tagIds) => {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ tutorial_id: tutorialId, tag_id }));
  await db("tutorial_tag_map").insert(rows);
};

exports.getTutorialTags = async (tutorialId) => {
  return db("tutorial_tag_map as m")
    .join("tags as t", "m.tag_id", "t.id")
    .where("m.tutorial_id", tutorialId)
    .select("t.id", "t.name", "t.slug");
};
