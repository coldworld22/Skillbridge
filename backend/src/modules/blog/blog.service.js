const db = require("../../config/database");

exports.createPost = async (data) => {
  const [row] = await db("blog_posts").insert(data).returning("*");
  return row;
};

exports.getPosts = () => db("blog_posts").orderBy("published_at", "desc");

exports.getPostById = (id) => db("blog_posts").where({ id }).first();

exports.findBySlug = (slug) => db("blog_posts").where({ slug }).first();

exports.updatePost = async (id, data) => {
  const [row] = await db("blog_posts").where({ id }).update(data).returning("*");
  return row;
};

exports.deletePost = (id) => db("blog_posts").where({ id }).del();
