const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const mailService = require("../../services/mailService");
const appConfigService = require("../appConfig/appConfig.service");
const AppError = require("../../utils/AppError");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");

exports.submitForm = catchAsync(async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    throw new AppError("Name, email and message are required", 400);
  }
  const app = (await appConfigService.getSettings()) || {};
  const to = app.contactEmail || process.env.SUPPORT_EMAIL;
  const html = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p>${message}</p>
  `;
  await mailService.sendMail({
    to,
    from: `${name} <${email}>`,
    subject: `New contact form submission`,
    html,
  });
  const admins = await userModel.findAdmins();
  const note = `New contact message from ${name} (${email})`;
  const results = await Promise.allSettled(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "contact_message",
        message: note,
      })
    )
  );
  results.forEach((r, idx) => {
    if (r.status === "rejected") {
      logger.error(
        `Failed to notify admin ${admins[idx].id}:`,
        r.reason?.message || r.reason
      );
    }
  });
  sendSuccess(res, null, "Message sent");
});
