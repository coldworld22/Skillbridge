const express = require("express");
const router = express.Router();
const controller = require("./admin.controller");
const tagsController = require("./tags.controller");
const announcementsController = require("./announcements.controller");
const reportsController = require("./reports.controller");
const contributorsController = require("./contributors.controller");
const settingsController = require("./settings.controller");

const {
  verifyToken,
  isAdmin,
} = require("../../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isAdmin,
);

// Discussions

router.get("/discussions", controller.getDiscussions);
router.get("/discussions/:id", controller.getDiscussion);
router.delete(
  "/discussions/:id",
  requireEntitlement("community.discussion.delete"),
  controller.deleteDiscussion,
);
router.patch(
  "/discussions/:id/lock",
  requireEntitlement("community.discussion.update"),
  controller.lockDiscussion,
);
router.patch(
  "/discussions/:id/unlock",
  requireEntitlement("community.discussion.update"),
  controller.unlockDiscussion,
);

// Dashboard stats
router.get("/stats", controller.getDashboardData);

// Contributors
router.get("/contributors", contributorsController.listContributors);

// Tags
router.get("/tags", tagsController.listTags);
router.post(
  "/tags",
  requireEntitlement("community.tag.manage"),
  tagsController.createTag,
);
router.patch(
  "/tags/:id",
  requireEntitlement("community.tag.manage"),
  tagsController.updateTag,
);
router.delete(
  "/tags/:id",
  requireEntitlement("community.tag.manage"),
  tagsController.deleteTag,
);

// Announcements
router.get("/announcements", announcementsController.listAnnouncements);
router.post(
  "/announcements",
  requireEntitlement("community.announcement.manage"),
  announcementsController.createAnnouncement,
);
router.patch(
  "/announcements/:id",
  requireEntitlement("community.announcement.manage"),
  announcementsController.updateAnnouncement,
);
router.delete(
  "/announcements/:id",
  requireEntitlement("community.announcement.manage"),
  announcementsController.deleteAnnouncement,
);

// Reports
router.get("/reports", reportsController.listReports);
router.patch(
  "/reports/:id",
  requireEntitlement("community.report.manage"),
  reportsController.updateReport,
);

// Settings
router.get("/settings", settingsController.getSettings);
router.put(
  "/settings",
  requireEntitlement("community.report.manage"),
  settingsController.updateSettings,
);

module.exports = router;
