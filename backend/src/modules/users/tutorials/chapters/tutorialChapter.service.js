const db = require("../../../../config/database");

exports.create = async (data) => {
  await db("tutorial_chapters").insert(data);
  return data;
};

exports.update = async (id, updates) => {
  await db("tutorial_chapters").where({ id }).update(updates);
  return this.findById(id);
};

exports.findById = async (id) => {
  return db("tutorial_chapters").where({ id }).first();
};

exports.getByTutorial = async (tutorial_id) => {
  return db("tutorial_chapters")
    .where({ tutorial_id })
    .orderBy("order", "asc");
};

exports.delete = async (id) => {
  return db("tutorial_chapters").where({ id }).del();
};
