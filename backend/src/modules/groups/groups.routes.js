const router = require("express").Router();
const ctrl = require("./groups.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.get("/tags", ctrl.listTags);
router.get("/my", verifyToken, ctrl.getMyGroups);
router.post("/:id/join", verifyToken, ctrl.joinGroup);
router.post("/", verifyToken, ctrl.createGroup);
router.get("/", ctrl.listGroups);
router.get("/:id", ctrl.getGroup);
router.patch("/:id", verifyToken, ctrl.updateGroup);
router.delete("/:id", verifyToken, ctrl.deleteGroup);

module.exports = router;
