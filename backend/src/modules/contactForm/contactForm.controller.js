const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const contactConfigService = require("../contactConfig/contactConfig.service");
const { sendContactFormEmail } = require("../../utils/email");

exports.submitForm = catchAsync(async (req, res) => {
  const { name, email, message } = req.body;
  const cfg = (await contactConfigService.getSettings()) || {};
  const to = cfg.formRecipient || cfg.email || "support@eduskillbridge.net";
  await sendContactFormEmail(to, name, email, message);
  sendSuccess(res, null, "Message sent");
});
