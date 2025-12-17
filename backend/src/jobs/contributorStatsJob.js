const logger = require('../utils/logger.js');
const db = require("../config/database");

function startContributorStatsJob() {
  const DAY = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const discussionCounts = await db('community_discussions')
        .select('user_id')
        .count({ cnt: '*' })
        .groupBy('user_id');
      const replyCounts = await db('community_replies')
        .select('user_id')
        .count({ cnt: '*' })
        .groupBy('user_id');
      const voteScores = await db('community_discussions as d')
        .leftJoin('community_votes as v', 'd.id', 'v.discussion_id')
        .select('d.user_id')
        .sum({ score: 'v.vote' })
        .groupBy('d.user_id');
      const stats = {};
      discussionCounts.forEach(r => {
        stats[r.user_id] = { count: parseInt(r.cnt, 10) || 0, score: 0 };
      });
      replyCounts.forEach(r => {
        stats[r.user_id] = stats[r.user_id] || { count: 0, score: 0 };
        stats[r.user_id].count += parseInt(r.cnt, 10) || 0;
      });
      voteScores.forEach(r => {
        stats[r.user_id] = stats[r.user_id] || { count: 0, score: 0 };
        stats[r.user_id].score = parseInt(r.score, 10) || 0;
      });
      for (const [userId, data] of Object.entries(stats)) {
        await db('community_contributors')
          .insert({ user_id: userId, discussions_count: data.count, score: data.score })
          .onConflict('user_id')
          .merge({ discussions_count: data.count, score: data.score });
      }
    } catch (err) {
      logger.error('Error reconciling contributor stats:', err.message);
    }
  }, DAY);
}

module.exports = startContributorStatsJob;
