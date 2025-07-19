const router = require("express").Router();
const controller = require("./languages.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.listLanguages);
router.post("/", verifyToken, isAdmin, controller.createLanguage);
router.put("/:id", verifyToken, isAdmin, controller.updateLanguage);
router.delete("/:id", verifyToken, isAdmin, controller.deleteLanguage);

module.exports = router;
