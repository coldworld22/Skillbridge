const router = require("express").Router();
const controller = require("./bookCategories.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.listCategories);
router.post("/", verifyToken, isAdmin, controller.createCategory);
router.put("/:id", verifyToken, isAdmin, controller.updateCategory);
router.delete("/:id", verifyToken, isAdmin, controller.deleteCategory);

module.exports = router;
