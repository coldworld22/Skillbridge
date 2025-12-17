// 📁 src/modules/users/admin/admin.routes.js

const express = require("express");
const router = express.Router();

const controller = require("./admin.controller");
const validate = require("../../../middleware/validate");
const { adminProfileSchema } = require("./admin.validator");
const { verifyToken, isAdmin, isSuperAdmin } = require("../../../middleware/auth/authMiddleware");
const upload = require("./adminUploadMiddleware");
const categoryRoutes = require("../categories/category.routes");
const instructorAdminRoutes = require("./instructors/instructorAdmin.routes");
// const classRoutes = require("../classes/class.routes");
const logger = require("../../../utils/logger");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../middleware/storage");










// 🔐 Protect all admin routes
router.use(verifyToken, isAdmin, resolveTenant, ensureTenantMembership(), enforceTenantStatus());

// ─────────────────────────────────────────────
// 📤 Avatar Upload (FormData: avatar)
// ─────────────────────────────────────────────
router.patch(
  "/:id/avatar",
  (req, res, next) => {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized avatar update" });
    }
    next();
  },
  requireEntitlement("user.asset.upload"),
  upload.single("avatar"),
  checkAndConsumeStorage(),
  controller.updateAvatar
);



// ─────────────────────────────────────────────
// 📄 Identity Document Upload (image or pdf)
// ─────────────────────────────────────────────
router.post(
  "/profile/identity",
  requireEntitlement("user.asset.upload"),
  (req, res, next) => {
    upload.single("identity")(req, res, (err) => {
      if (err) {
        logger.error("Multer upload error:", err.message);
        return res.status(400).json({ message: err.message });
      }
      if (process.env.NODE_ENV !== "production") {
        logger.debug("Identity document upload request received");
      }
      next();
    });
  },
  checkAndConsumeStorage(),
  controller.uploadIdentityDoc
);

// ---------------------------------------------------------------------------
// 📊 Dashboard stats
// ---------------------------------------------------------------------------
router.get("/dashboard-stats", controller.getDashboardStats);





// ─────────────────────────────────────────────
// 📄 Admin Change any Password
// ─────────────────────────────────────────────
router.patch("/change-password", controller.changePassword);
router.post("/reset-password/:userId", isSuperAdmin, controller.resetPasswordAsAdmin);

// ─────────────────────────────────────────────
// 📋 Modular route loading
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// 📋 Instructor management (GET/POST/PATCH)
// ─────────────────────────────────────────────
router.use("/instructors", instructorAdminRoutes);

// ─────────────────────────────────────────────
// 📋 Category CRUD (GET/POST/PUT/DELETE )
// ─────────────────────────────────────────────
router.use("/categories", categoryRoutes);


// ─────────────────────────────────────────────
// 📋 Class CRUD (GET/POST/PUT/DELETE )
// ─────────────────────────────────────────────
// router.use("/classes", classRoutes);
// ─────────────────────────────────────────────
// 📋 Profile CRUD (GET/PUT)
// GET /api/users/admin/profile
// PUT /api/users/admin/profile
// ─────────────────────────────────────────────
router.get("/profile", controller.getProfile);
router.put("/profile", validate(adminProfileSchema), controller.updateProfile);

// ─────────────────────────────────────────────
// 📋 User management routes
// ─────────────────────────────────────────────
router.use("/", require("../usersmanagement/users.routes"));

module.exports = router;
