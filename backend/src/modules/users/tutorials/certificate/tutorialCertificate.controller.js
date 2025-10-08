const service = require("./certificate.service");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const AppError = require("../../../../utils/AppError");
const db = require("../../../../config/database");
const notificationService = require("../../../notifications/notifications.service");
const { requireUserAndTutorial } = require("../utils");

exports.generateCertificate = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);

  // 1. Validate completion (including assignments)
  const completed = await service.isUserCompletedTutorial(userId, tutorialId);
  if (!completed)
    throw new AppError(
      "You must complete the tutorial and all assignments to receive a certificate.",
      403,
    );

  // 2. Avoid duplicates
  const existing = await service.findExisting(userId, tutorialId);
  if (existing) return sendSuccess(res, existing, "Certificate already issued");

  // 3. Create new
  const newCert = await service.issueCertificate({ userId, tutorialId });

  // 4. Notify user
  const tutorial = await db("tutorials").where({ id: tutorialId }).first();
  await notificationService.createNotification({
    user_id: userId,
    type: "certificate_issued",
    message: `Your certificate for "${tutorial?.title || "tutorial"}" is now available.`,
  });

  sendSuccess(res, newCert, "Certificate issued successfully");
});
