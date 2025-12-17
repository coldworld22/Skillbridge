const router = require("express").Router();
const controller = require("./blog.controller");
const upload = require("./blogUploadMiddleware");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

router.get("/", controller.getPosts);
router.get("/slug/:slug", controller.getPostBySlug);
router.get("/:id", controller.getPost);
router.post(
  "/",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("blog.manage"),
  isAdmin,
  upload.single("image"),
  checkAndConsumeStorage(),
  controller.createPost,
);
router.put(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("blog.manage"),
  isAdmin,
  upload.single("image"),
  checkAndConsumeStorage(),
  controller.updatePost,
);
router.delete(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("blog.manage"),
  isAdmin,
  controller.deletePost,
);

module.exports = router;
