/**
 * Certificate admin routes
 */
const router = require("express").Router();
const ctrl = require("./certificates.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/", ctrl.list);

module.exports = router;
