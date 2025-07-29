const router = require("express").Router();
const ctrl = require("./public.controller");

router.get("/discussions", ctrl.listDiscussions);
router.get("/discussions/:id", ctrl.getDiscussion);

module.exports = router;
