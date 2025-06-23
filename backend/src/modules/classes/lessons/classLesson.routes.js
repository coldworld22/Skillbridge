const router = require("express").Router();
const ctrl = require("./classLesson.controller");

router.get("/class/:classId", ctrl.getLessonsByClass);

module.exports = router;
