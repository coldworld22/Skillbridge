const db = require("../../config/database");

exports.getAll = async () => {
  const rows = await db("popup_announcements")
    .select("*")
    .orderBy("created_at", "desc");
  return rows.map((r) => ({
    ...r,
    pages: Array.isArray(r.pages) ? r.pages : JSON.parse(r.pages || "[]"),
  }));
};

exports.getActive = async ({ audience = "guest", page }) => {
  const now = new Date();
  // determine allowed audiences based on viewer
  const allowed = ["all"];
  if (audience === "student" || audience === "instructor") {
    allowed.push("logged-in", audience);
  } else if (audience === "logged-in") {
    allowed.push("logged-in");
  }

  const rows = await db("popup_announcements")
    .select("*")
    .where({ active: true })
    .where(function () {
      this.whereNull("start_date").orWhere("start_date", "<=", now);
    })
    .where(function () {
      this.whereNull("end_date").orWhere("end_date", ">=", now);
    })
    .whereIn("audience", allowed)
    .orderBy("created_at", "desc");

  return rows
    .map((r) => ({
      ...r,
      pages: Array.isArray(r.pages) ? r.pages : JSON.parse(r.pages || "[]"),
    }))
    .filter((r) => !page || r.pages.length === 0 || r.pages.includes(page));
};

exports.create = async (data) => {
  const [row] = await db("popup_announcements")
    .insert(data)
    .returning("*");
  return {
    ...row,
    pages: Array.isArray(row.pages) ? row.pages : JSON.parse(row.pages || "[]"),
  };
};

exports.update = async (id, data) => {
  const [row] = await db("popup_announcements")
    .where({ id })
    .update(data)
    .returning("*");
  return {
    ...row,
    pages: Array.isArray(row.pages) ? row.pages : JSON.parse(row.pages || "[]"),
  };
};

exports.remove = async (id) => {
  return db("popup_announcements").where({ id }).del();
};
