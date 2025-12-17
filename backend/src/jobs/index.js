const startLessonReminderJob = require('./lessonReminderJob');
const { startLessonLiveJob } = require('./lessonLiveJob');
const startCartReminderJob = require('./cartReminderJob');
const startClassReminderJob = require('./classReminderJob');
const startCleanupJob = require('./cleanupJob');
const startContributorStatsJob = require('./contributorStatsJob');
const startSubscriptionReminderJob = require('./subscriptionReminderJob');

function startJobs() {
  startLessonReminderJob();
  startLessonLiveJob();
  startClassReminderJob();
  startCartReminderJob();
  startCleanupJob();
  startContributorStatsJob();
  startSubscriptionReminderJob();
}

module.exports = startJobs;
