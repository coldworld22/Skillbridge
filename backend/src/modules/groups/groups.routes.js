const router = require("express").Router();
const ctrl = require("./groups.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const upload = require("./groupUploadMiddleware");

router.get("/tags", ctrl.listTags);
router.get("/my", verifyToken, ctrl.getMyGroups);
router.post("/:id/join", verifyToken, ctrl.joinGroup);
router.get("/:id/members", verifyToken, ctrl.listMembers);
router.post("/:id/members/:memberId/manage", verifyToken, ctrl.manageMember);
router.post("/", verifyToken, upload, ctrl.createGroup);
router.get("/", ctrl.listGroups);
router.get("/:id", ctrl.getGroup);
router.patch("/:id", verifyToken, upload, ctrl.updateGroup);
router.delete("/:id", verifyToken, ctrl.deleteGroup);

module.exports = router;
