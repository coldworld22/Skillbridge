const db = require("../../config/database");

module.exports = {
  async create(data) {
    const [row] = await db("online_classes").insert(data).returning("*");
    return row;
  },

  async findById(id) {
    return db("online_classes").where({ id }).first();
  },

  async update(id, data) {
    const [row] = await db("online_classes").where({ id }).update(data).returning("*");
    return row;
  },

  async remove(id) {
    return db("online_classes").where({ id }).del();
  },
};
