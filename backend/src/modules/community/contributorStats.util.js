const db = require("../../config/database");

async function updateContributorStats(userId, scoreDelta = 0, countDelta = 0) {
  if (!userId) return;
  const updates = {};
  if (countDelta !== 0) {
    updates.discussions_count = db.raw("community_contributors.discussions_count + ?", [countDelta]);
  }
  if (scoreDelta !== 0) {
    updates.score = db.raw("community_contributors.score + ?", [scoreDelta]);
  }
  if (!Object.keys(updates).length) return;
  await db("community_contributors")
    .insert({
      user_id: userId,
      discussions_count: Math.max(countDelta, 0),
      score: scoreDelta,
    })
    .onConflict("user_id")
    .merge(updates);
}

module.exports = { updateContributorStats };

