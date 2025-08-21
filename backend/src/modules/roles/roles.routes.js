const express = require("express");
const router = express.Router();
const controller = require("./roles.controller");
const { verifyToken, hasPermission } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.get("/permissions", hasPermission("view_permissions"), controller.getPermissions);
router.post("/permissions", hasPermission("manage_permissions"), controller.createPermission);
router.put("/permissions/:id", hasPermission("manage_permissions"), controller.updatePermission);
router.delete("/permissions/:id", hasPermission("manage_permissions"), controller.deletePermission);

router.post("/", hasPermission("manage_roles"), controller.createRole);
router.get("/", hasPermission("view_roles"), controller.getRoles);
router.get("/:id", hasPermission("view_roles"), controller.getRole);
router.put("/:id", hasPermission("manage_roles"), controller.updateRole);
router.delete("/:id", hasPermission("manage_roles"), controller.deleteRole);

router.post("/:id/permissions", hasPermission("manage_roles"), controller.assignPermissions);

module.exports = router;
