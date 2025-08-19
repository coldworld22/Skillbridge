const router = require("express").Router();
const controller = require("./blog.controller");
const upload = require("./blogUploadMiddleware");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.getPosts);
router.get("/slug/:slug", controller.getPostBySlug);
router.get("/:id", controller.getPost);
router.post("/", verifyToken, isAdmin, upload.single("image"), controller.createPost);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), controller.updatePost);
router.delete("/:id", verifyToken, isAdmin, controller.deletePost);

module.exports = router;
