const express = require("express");
const router = express.Router();
const controller = require("./roles.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/permissions", controller.getPermissions);
router.post("/permissions", controller.createPermission);
router.put("/permissions/:id", controller.updatePermission);
router.delete("/permissions/:id", controller.deletePermission);

router.post("/", controller.createRole);
router.get("/", controller.getRoles);
router.get("/:id", controller.getRole);
router.put("/:id", controller.updateRole);
router.delete("/:id", controller.deleteRole);

router.post("/:id/permissions", controller.assignPermissions);

module.exports = router;
