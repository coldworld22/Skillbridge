const db = require("../../config/database");

exports.searchClasses = async (q) => {
  return db("online_classes")
    .whereILike("title", `%${q}%`)
    .orWhereILike("description", `%${q}%`)
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchTutorials = async (q) => {
  return db("tutorials")
    .whereILike("title", `%${q}%`)
    .orWhereILike("description", `%${q}%`)
    .select("id", "title", "cover_image as cover", "slug")
    .limit(5);
};

exports.searchInstructors = async (q) => {
  return db("users")
    .whereILike("full_name", `%${q}%`)
    .andWhereRaw("LOWER(role) = ?", ["instructor"])
    .select("id", "full_name", "avatar_url")
    .limit(5);
};

exports.searchOffers = async (q) => {
  return db("offers")
    .whereILike("title", `%${q}%`)
    .orWhereILike("description", `%${q}%`)
    .select("id", "title")
    .limit(5);
};

exports.searchCommunity = async (q) => {
  return db("community_discussions")
    .whereILike("title", `%${q}%`)
    .orWhereILike("content", `%${q}%`)
    .select("id", "title")
    .limit(5);
};

exports.searchBlog = async (q) => {
  return db("blog_posts")
    .whereILike("title", `%${q}%`)
    .orWhereILike("excerpt", `%${q}%`)
    .select("id", "title", "slug", "image_url as image")
    .limit(5);
};
