const router = require("express").Router();
const controller = require("./library.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.get("/", verifyToken, isStudent, controller.listLibrary);

module.exports = router;
