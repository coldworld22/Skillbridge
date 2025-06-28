const router = require("express").Router();
const controller = require("./offers.controller");
const validate = require("../../middleware/validate");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const validator = require("./offers.validator");

router.post("/", verifyToken, validate(validator.create), controller.createOffer);
router.get("/", controller.getOffers);
router.get("/:id", controller.getOfferById);
router.put("/:id", verifyToken, validate(validator.update), controller.updateOffer);
router.delete("/:id", verifyToken, controller.deleteOffer);

module.exports = router;
