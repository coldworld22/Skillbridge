const router = require("express").Router();
const ctrl = require("./tutorialCertificate.controller");
const { verifyToken, isStudent } = require("../../../../middleware/auth/authMiddleware");

router.post("/:tutorialId/certificate/generate", verifyToken, isStudent, ctrl.generateCertificate);

module.exports = router;
