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










// 🔐 Protect all admin routes
router.use(verifyToken, isAdmin);

// ─────────────────────────────────────────────
// 📤 Avatar Upload (FormData: avatar)
// ─────────────────────────────────────────────
router.patch("/:id/avatar", upload.single("avatar"), controller.updateAvatar);



// ─────────────────────────────────────────────
// 📄 Identity Document Upload (image or pdf)
// ─────────────────────────────────────────────
router.post(
  "/profile/identity",
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
  controller.uploadIdentityDoc
);

// ---------------------------------------------------------------------------
// 📊 Dashboard stats
// ---------------------------------------------------------------------------
router.get("/dashboard-stats", controller.getDashboardStats);





// ─────────────────────────────────────────────
// 📄 Admin Change any Password
// ─────────────────────────────────────────────
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
