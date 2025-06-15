const db = require("../../../config/database");

exports.getAllDiscussions = async () => {
  return db("community_discussions").select("*").orderBy("created_at", "desc");
};

exports.getDiscussionById = async (id) => {
  return db("community_discussions").where({ id }).first();
};

exports.deleteDiscussion = async (id) => {
  return db("community_discussions").where({ id }).del();
};

exports.setLocked = async (id, locked) => {
  const [row] = await db("community_discussions")
    .where({ id })
    .update({ locked, updated_at: db.fn.now() })
    .returning("*");
  return row;
};
