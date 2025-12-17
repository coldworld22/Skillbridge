const express = require("express");
const router = express.Router({ mergeParams: true });
const controller = require("./classRule.controller");
const { verifyToken } = require("../../../middleware/auth/authMiddleware");
const verifyPermission = require("../../../middleware/auth/verifyPermission");

router.use(verifyToken, verifyPermission("ADD_ONLINE_CLASS_RULE"));

router.post("/", controller.createRule);
router.get("/", controller.getRules);
router.put("/:ruleId", controller.updateRule);
router.delete("/:ruleId", controller.deleteRule);

module.exports = router;
