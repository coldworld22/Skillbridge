const db = require("../../../config/database");

exports.getTopContributors = async (limit = 20) => {
  return db("community_contributors")
    .join("users", "community_contributors.user_id", "users.id")
    .select(
      "users.full_name as name",
      "users.avatar_url as avatar",
      "community_contributors.discussions_count as contributions",
      "community_contributors.score as reputation"
    )
    .orderBy("community_contributors.score", "desc")
    .limit(limit);
};
