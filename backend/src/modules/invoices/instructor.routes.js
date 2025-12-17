const router = require("express").Router();
const controller = require("./invoices.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructor);

router.get("/", controller.getMyInvoices);
router.get("/payment/:paymentId", controller.getMyInvoiceByPaymentId);
router.get("/:id/download", controller.downloadInvoice);
router.get("/:id", controller.getMyInvoice);

module.exports = router;
