const express = require("express");
const router = express.Router();
const controller = require("./certificateTemplates.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const validate = require("../../middleware/validate");
const {
  createTemplate,
  updateTemplate,
} = require("./certificateTemplates.validation");
const upload = require("./certificateTemplateUpload.middleware");

router.use(verifyToken, isAdmin);

router.get("/", controller.list);
router.post("/", validate(createTemplate), controller.create);
router.post("/upload", upload, controller.upload);
router.get("/:id", controller.get);
router.put("/:id", validate(updateTemplate), controller.update);
router.patch("/:id/toggle", controller.toggle);
router.post("/:id/duplicate", controller.duplicate);
router.delete("/:id", controller.remove);

module.exports = router;
