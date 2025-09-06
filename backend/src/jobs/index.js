const startLessonReminderJob = require('./lessonReminderJob');
const { startLessonLiveJob } = require('./lessonLiveJob');
const startCartReminderJob = require('./cartReminderJob');
const startClassReminderJob = require('./classReminderJob');
const startCleanupJob = require('./cleanupJob');
const startContributorStatsJob = require('./contributorStatsJob');

function startJobs() {
  startLessonReminderJob();
  startLessonLiveJob();
  startClassReminderJob();
  startCartReminderJob();
  startCleanupJob();
  startContributorStatsJob();
}

module.exports = startJobs;
