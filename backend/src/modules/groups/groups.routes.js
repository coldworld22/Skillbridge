const router = require("express").Router();
const ctrl = require("./groups.controller");
const msgCtrl = require("./groupMessages.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const upload = require("./groupUploadMiddleware");
const msgUpload = require("./groupMessageUpload.middleware");

router.get("/tags", ctrl.listTags);
router.get("/my", verifyToken, ctrl.getMyGroups);
router.post("/:id/join", verifyToken, ctrl.joinGroup);
router.get("/:id/members", verifyToken, ctrl.listMembers);
router.post("/:id/members/:memberId/manage", verifyToken, ctrl.manageMember);
router.get("/:id/requests", verifyToken, ctrl.listJoinRequests);
router.post("/requests/:requestId", verifyToken, ctrl.manageJoinRequest);
router.get("/:id/permissions", verifyToken, ctrl.getGroupPermissions);
router.put("/:id/permissions", verifyToken, ctrl.updateGroupPermissions);
router.get("/:id/messages", verifyToken, msgCtrl.getMessages);
router.post("/:id/messages", verifyToken, msgUpload, msgCtrl.sendMessage);
router.delete("/messages/:id", verifyToken, msgCtrl.deleteMessage);

router.post("/:id/typing", verifyToken, msgCtrl.updateTyping);
router.get("/:id/typing", verifyToken, msgCtrl.getTyping);


router.post("/", verifyToken, upload, ctrl.createGroup);
router.get("/", ctrl.listGroups);
router.get("/:id", ctrl.getGroup);
router.patch("/:id", verifyToken, upload, ctrl.updateGroup);
router.delete("/:id", verifyToken, ctrl.deleteGroup);

module.exports = router;
