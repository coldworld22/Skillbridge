const express = require("express");
const router = express.Router();
const controller = require("./certificateTemplates.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const upload = require("./certificateTemplateUpload.middleware");

router.use(verifyToken, isAdmin);

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/upload", upload, controller.upload);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.patch("/:id/toggle", controller.toggle);
router.delete("/:id", controller.remove);

module.exports = router;
