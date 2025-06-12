const service = require("./certificate.service");

exports.generateCertificate = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const userId = req.user.id;

  // 1. Validate completion
  const completed = await service.isUserCompletedTutorial(userId, tutorialId);
  if (!completed) throw new AppError("You must complete the tutorial to receive a certificate.", 403);

  // 2. Avoid duplicates
  const existing = await service.findExisting(userId, tutorialId);
  if (existing) return sendSuccess(res, existing, "Certificate already issued");

  // 3. Create new
  const newCert = await service.issueCertificate({ userId, tutorialId });
  sendSuccess(res, newCert, "Certificate issued successfully");
});
