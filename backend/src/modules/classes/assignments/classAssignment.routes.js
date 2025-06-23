const router = require("express").Router();
const ctrl = require("./classAssignment.controller");

router.get("/class/:classId", ctrl.getAssignmentsByClass);

module.exports = router;
