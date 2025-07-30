const db = require("../../config/database");

exports.createCoupon = async (data) => {
  const [row] = await db("coupons").insert(data).returning("*");
  return row;
};

exports.getCoupons = () => {
  return db("coupons").orderBy("created_at", "desc");
};

exports.getCouponById = (id) => {
  return db("coupons").where({ id }).first();
};

exports.findByCode = (code) => {
  return db("coupons").whereRaw("LOWER(code) = LOWER(?)", [code]).first();
};

exports.updateCoupon = async (id, data) => {
  const [row] = await db("coupons").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteCoupon = (id) => {
  return db("coupons").where({ id }).del();
};
