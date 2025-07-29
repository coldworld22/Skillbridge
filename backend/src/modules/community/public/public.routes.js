const router = require("express").Router();
const ctrl = require("./public.controller");
const { verifyToken } = require("../../../middleware/auth/authMiddleware");

router.get("/discussions", ctrl.listDiscussions);
router.get("/discussions/:id", ctrl.getDiscussion);
router.post("/discussions", verifyToken, ctrl.createDiscussion);

module.exports = router;
