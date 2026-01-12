const router = require("express").Router();
const controller = require("./invoices.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.get("/", controller.getMyInvoices);
router.get("/payment/:paymentId", controller.getMyInvoiceByPaymentId);
router.get("/:id/download", controller.downloadInvoice);
router.get("/:id", controller.getMyInvoice);

module.exports = router;
