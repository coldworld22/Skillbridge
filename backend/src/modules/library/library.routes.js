const router = require("express").Router();
const controller = require("./library.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.get("/", verifyToken, isStudent, controller.listLibrary);
router.get("/download/:bookId", verifyToken, isStudent, controller.downloadBook);

module.exports = router;
