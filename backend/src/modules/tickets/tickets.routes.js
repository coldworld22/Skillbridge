const router = require('express').Router();
const controller = require('./tickets.controller');
const validate = require('../../middleware/validate');
const { verifyToken, isAdmin } = require('../../middleware/auth/authMiddleware');
const validation = require('./tickets.validation');
const multer = require('multer');
const upload = multer({ dest: 'uploads/ticket_attachments' });

router.use(verifyToken);

router.get('/', isAdmin, controller.getAllTickets);
router.get('/:id', controller.getTicketById);
router.post('/', validate(validation.createTicketSchema), controller.createTicket);
router.post('/:id/reply', validate(validation.replySchema), controller.addMessage);
router.post('/:id/note', isAdmin, validate(validation.replySchema), controller.addNote);
router.put('/:id/status', isAdmin, validate(validation.statusSchema), controller.updateStatus);
router.put('/:id/priority', isAdmin, validate(validation.prioritySchema), controller.updatePriority);
router.put('/:id/assign', isAdmin, validate(validation.assignSchema), controller.assignTicket);
router.post('/:messageId/upload', upload.single('file'), controller.uploadAttachment);

module.exports = router;
