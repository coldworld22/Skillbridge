const db = require("../../config/database");

exports.createClass = async (data) => {
  const [created] = await db("online_classes").insert(data).returning("*");
  return created;
};

exports.getAllClasses = async () => {
  return db("online_classes").orderBy("created_at", "desc");
};

exports.getClassById = async (id) => {
  return db("online_classes").where({ id }).first();
};

exports.updateClass = async (id, data) => {
  const [updated] = await db("online_classes").where({ id }).update(data).returning("*");
  return updated;
};

exports.deleteClass = async (id) => {
  return db("online_classes").where({ id }).del();
};

exports.getPublishedClasses = async () => {
  return db("online_classes")
    .where({ status: "published" })
    .orderBy("created_at", "desc");
};

exports.getPublicClassDetails = async (id) => {
  return db("online_classes")
    .where({ id, status: "published" })
    .first();
};
