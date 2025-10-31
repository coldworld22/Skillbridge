const router = require("express").Router();
const controller = require("./languages.controller");
const { verifyToken, hasPermission } = require("../../middleware/auth/authMiddleware");
const upload = require("./languageIconUploadMiddleware");

router.get("/", controller.listLanguages);
router.post(
  "/",
  verifyToken,
  hasPermission("manage_languages"),
  upload,
  controller.createLanguage
);
router.put(
  "/:id",
  verifyToken,
  hasPermission("manage_languages"),
  upload,
  controller.updateLanguage
);
router.delete(
  "/:id",
  verifyToken,
  hasPermission("manage_languages"),
  controller.deleteLanguage
);

module.exports = router;
