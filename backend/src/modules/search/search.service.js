const db = require("../../config/database");

exports.searchClasses = async (q) => {
  const term = `%${q}%`;
  return db("online_classes")
    .whereRaw("title ILIKE ?", [term])
    .orWhereRaw("description ILIKE ?", [term])
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchTutorials = async (q) => {

  const term = `%${q}%`;
  return db("tutorials")
    .whereRaw("title ILIKE ?", [term])
    .orWhereRaw("description ILIKE ?", [term])
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchInstructors = async (q) => {
  const term = `%${q}%`;
  return db("users")
    .whereRaw("full_name ILIKE ?", [term])
    .andWhereRaw("LOWER(role) = ?", ["instructor"])
    .select("id", "full_name", "avatar_url")
    .limit(5);
};

exports.searchOffers = async (q) => {
  const term = `%${q}%`;
  return db("offers")
    .whereRaw("title ILIKE ?", [term])
exports.searchCommunity = async (q) => {
  const term = `%${q}%`;
  return db("community_discussions")
    .whereRaw("title ILIKE ?", [term])
    .orWhereRaw("content ILIKE ?", [term])
    .select("id", "title")
    .limit(5);
};

exports.searchBlog = async (q) => {
  const term = `%${q}%`;
  return db("blog_posts")
    .whereRaw("title ILIKE ?", [term])
    .orWhereRaw("excerpt ILIKE ?", [term])
    .select("id", "title", "slug", "image_url as image")
    .limit(5);
};
