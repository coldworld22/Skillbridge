const router = require("express").Router();
const controller = require("./bank.controller");
const upload = require("./paymentReceiptUpload.middleware");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.post(
  "/initiate",
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  controller.initiateBankPayment
);

module.exports = router;
