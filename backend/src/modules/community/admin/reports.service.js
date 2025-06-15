const db = require("../../../config/database");

exports.getAllReports = async () => {
  return db("community_reports").select("*").orderBy("reported_at", "desc");
};

exports.updateStatus = async (id, status) => {
  const [row] = await db("community_reports").where({ id }).update({ status }).returning("*");
  return row;
};
