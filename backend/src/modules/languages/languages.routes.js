const router = require("express").Router();
const controller = require("./languages.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const upload = require("./languageIconUploadMiddleware");

router.get("/", controller.listLanguages);
router.post("/", verifyToken, isAdmin, upload.single("icon"), controller.createLanguage);
router.put("/:id", verifyToken, isAdmin, upload.single("icon"), controller.updateLanguage);
router.delete("/:id", verifyToken, isAdmin, controller.deleteLanguage);

module.exports = router;
