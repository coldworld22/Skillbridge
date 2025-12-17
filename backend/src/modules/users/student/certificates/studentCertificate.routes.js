const router = require("express").Router();
const ctrl = require("./studentCertificate.controller");
const { verifyToken, isStudent } = require("../../../../middleware/auth/authMiddleware");

router.get("/", verifyToken, isStudent, ctrl.listMine);
router.get("/:id", verifyToken, isStudent, ctrl.getMine);

module.exports = router;
