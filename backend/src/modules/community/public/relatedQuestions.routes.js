const router = require('express').Router();
const ctrl = require('./public.controller');

// Public endpoint to search related discussion questions
router.get('/', ctrl.relatedQuestions);

module.exports = router;
