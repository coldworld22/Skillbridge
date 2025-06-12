const router = require("express").Router();
const ctrl = require("./tutorialCertificate.controller");
const { verifyToken, isStudent } = require("../../../middleware/authMiddleware");

router.post("/:tutorialId/certificate/generate", verifyToken, isStudent, ctrl.generateCertificate);

module.exports = router;
