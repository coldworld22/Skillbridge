const router = require("express").Router();
const ctrl = require("./certificateAdmin.controller");
const { verifyToken, isAdmin } = require("../../../../middleware/auth/authMiddleware");

router.patch("/:id/revoke", verifyToken, isAdmin, ctrl.revokeCertificate);

module.exports = router;
