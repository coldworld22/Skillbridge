const router = require("express").Router();
const controller = require("./cart.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.post("/add", verifyToken, controller.addItem);
router.get("/", verifyToken, controller.getItems);
router.put("/update/:id", verifyToken, controller.updateItem);
router.delete("/remove/:id", verifyToken, controller.removeItem);

module.exports = router;
