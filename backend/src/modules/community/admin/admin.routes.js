const express = require("express");
const router = express.Router();
const controller = require("./admin.controller");
const tagsController = require("./tags.controller");
const announcementsController = require("./announcements.controller");
const reportsController = require("./reports.controller");
const contributorsController = require("./contributors.controller");
const settingsController = require("./settings.controller");

const { verifyToken, isAdmin } = require("../../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

// Discussions


router.get("/discussions", controller.getDiscussions);
router.get("/discussions/:id", controller.getDiscussion);
router.delete("/discussions/:id", controller.deleteDiscussion);
router.patch("/discussions/:id/lock", controller.lockDiscussion);
router.patch("/discussions/:id/unlock", controller.unlockDiscussion);

// Dashboard stats
router.get("/stats", controller.getDashboardData);

// Contributors
router.get("/contributors", contributorsController.listContributors);


// Tags
router.get("/tags", tagsController.listTags);
router.post("/tags", tagsController.createTag);
router.patch("/tags/:id", tagsController.updateTag);
router.delete("/tags/:id", tagsController.deleteTag);

// Announcements
router.get("/announcements", announcementsController.listAnnouncements);
router.post("/announcements", announcementsController.createAnnouncement);
router.patch("/announcements/:id", announcementsController.updateAnnouncement);
router.delete("/announcements/:id", announcementsController.deleteAnnouncement);

// Reports
router.get("/reports", reportsController.listReports);
router.patch("/reports/:id", reportsController.updateReport);

// Settings
router.get("/settings", settingsController.getSettings);
router.put("/settings", settingsController.updateSettings);

module.exports = router;
