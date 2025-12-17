const router = require("express").Router();
const controller = require("./offers.controller");
const tagController = require("./offerTag.controller");
const validate = require("../../middleware/validate");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const ensureVerified = require("../../middleware/ensureVerified");
const validator = require("./offers.validator");

const optionalAuth = (req, res, next) => {
  const hasToken =
    (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")) ||
    (req.cookies && req.cookies.token);

  if (hasToken) {
    return verifyToken(req, res, next);
  }

  return next();
};

router.post(
  "/",
  verifyToken,
  ensureVerified,
  validate(validator.create),
  controller.createOffer
);
router.get("/", optionalAuth, controller.getOffers);

// Tags need to be registered before parameterised routes to avoid UUID casting errors
router.get("/tags", tagController.listTags);
router.post("/tags", verifyToken, tagController.createTag);

router.get("/:id", optionalAuth, controller.getOfferById);
router.put(
  "/:id",
  verifyToken,
  ensureVerified,
  validate(validator.update),
  controller.updateOffer
);
router.delete("/:id", verifyToken, ensureVerified, controller.deleteOffer);

module.exports = router;
