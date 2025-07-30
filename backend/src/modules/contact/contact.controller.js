const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const mailService = require("../../services/mailService");
const appConfigService = require("../appConfig/appConfig.service");
const AppError = require("../../utils/AppError");

exports.submitForm = catchAsync(async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    throw new AppError("Name, email and message are required", 400);
  }
  const app = (await appConfigService.getSettings()) || {};
  const to = app.contactEmail || process.env.CONTACT_EMAIL || "support@eduskillbridge.net";
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
  sendSuccess(res, null, "Message sent");
});
