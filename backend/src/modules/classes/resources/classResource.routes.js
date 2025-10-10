const express = require("express");
const router = express.Router();
const { verifyToken, isInstructorOrAdmin } = require("../../../middleware/auth/authMiddleware");
const controller = require("./classResource.controller");
const upload = require("./classResourceUpload");

router.get("/class/:classId", controller.listByClass);

router.post(
  "/class/:classId",
  verifyToken,
  isInstructorOrAdmin,
  upload.single("file"),
  controller.createResource
);

router.delete(
  "/:resourceId",
  verifyToken,
  isInstructorOrAdmin,
  controller.deleteResource
);

module.exports = router;
