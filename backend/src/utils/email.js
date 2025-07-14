// 📁 src/utils/email.js
const nodemailer = require("nodemailer");
const emailConfigService = require("../modules/emailConfig/emailConfig.service");

async function createTransporter() {
  const cfg = (await emailConfigService.getSettings()) || {};

  const host = (cfg.smtpHost || process.env.SMTP_HOST || "").trim();
  const port = parseInt(cfg.smtpPort || process.env.SMTP_PORT, 10);
  const user = (cfg.username || process.env.SMTP_USER || "").trim();
  const pass = (cfg.password || process.env.SMTP_PASS || "").trim();

  return nodemailer.createTransport({
    host,
    port,
    secure:
      cfg.encryption === "SSL" ||
      cfg.encryption === "TLS" ||
      process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });
}

exports.createTransporter = createTransporter;

// Send OTP Email using saved configuration or env vars
exports.sendOtpEmail = async (to, otp) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  const mailOptions = {
    from: cfg.fromEmail || process.env.SMTP_USER,
    to,
    subject: "Your OTP for SkillBridge",
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${to}`);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};
