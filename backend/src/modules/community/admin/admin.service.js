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

// Aggregate numbers for the admin dashboard
exports.getDashboardData = async () => {
  const [discussionsRow] = await db("community_discussions").count();
  const [pendingReportsRow] = await db("community_reports")
    .where({ status: "pending" })
    .count();
  const [contributorsRow] = await db("community_contributors").count();
  const [repliesRow] = await db("community_replies")
    .where("created_at", ">=", db.raw("now() - interval '7 days'"))
    .count();

  const top = await db("community_contributors")
    .join("users", "community_contributors.user_id", "users.id")
    .orderBy("community_contributors.score", "desc")
    .first(
      "users.full_name as name",
      "users.avatar_url as avatar",
      "community_contributors.discussions_count as contributions",
      "community_contributors.score as reputation"
    );

  const activityData = [];
  for (let i = 4; i >= 0; i--) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [dCount] = await db("community_discussions")
      .whereBetween("created_at", [start, end])
      .count();
    const [rCount] = await db("community_reports")
      .whereBetween("reported_at", [start, end])
      .count();
    const [replyCount] = await db("community_replies")
      .whereBetween("created_at", [start, end])
      .count();

    activityData.push({
      date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      discussions: parseInt(dCount.count, 10) || 0,
      reports: parseInt(rCount.count, 10) || 0,
      replies: parseInt(replyCount.count, 10) || 0,
    });
  }

  return {
    totalDiscussions: parseInt(discussionsRow.count, 10) || 0,
    pendingReports: parseInt(pendingReportsRow.count, 10) || 0,
    contributors: parseInt(contributorsRow.count, 10) || 0,
    repliesThisWeek: parseInt(repliesRow.count, 10) || 0,
    topContributor: top || null,
    activityData,
  };
};
