/**
 * Certificate admin routes
 */
const router = require("express").Router();
const ctrl = require("./certificates.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/", ctrl.list);
router.get("/:id/download", ctrl.download);
router.get("/:id", ctrl.getOne);
router.patch("/:id/approve", ctrl.approve);
router.patch("/:id/reject", ctrl.reject);
router.patch("/:id/revoke", ctrl.reject); // legacy alias

module.exports = router;
