// 📁 src/modules/users/tutorials/tutorial.service.js
const db = require("../../../config/database");

exports.createTutorial = async (data) => {
  const [tutorial] = await db("tutorials").insert(data).returning("*");
  return tutorial;
};

exports.getAllTutorials = async () => {
  return db("tutorials")
    .whereNot("status", "archived")
    .orderBy("created_at", "desc");
};

exports.getTutorialById = async (id) => {
  return db("tutorials").where({ id }).first();
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

exports.getFeaturedTutorials = async () => {
  return db("tutorials")
    .where({ status: "published" })
    .orderBy("created_at", "desc")
    .limit(6);
};

exports.getPublishedTutorials = async () => {
  return db("tutorials")
    .where({ status: "published" })
    .orderBy("created_at", "desc");
};

exports.getPublicTutorialDetails = async (id) => {
  const tutorial = await db("tutorials")
    .where({ id, status: "published" })
    .first();

  if (!tutorial) return null;

  const chapters = await db("tutorial_chapters")
    .where({ tutorial_id: id })
    .orderBy("order");

  return { ...tutorial, chapters };
};
