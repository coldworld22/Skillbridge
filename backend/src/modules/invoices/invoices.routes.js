const router = require("express").Router();
const controller = require("./invoices.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/", controller.getInvoices);
router.get("/:id", controller.getInvoice);
router.get("/:id/download", controller.downloadInvoice);

module.exports = router;
