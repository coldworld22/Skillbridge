
// 📁 src/services/mailService.js
const { getSettings } = require("../modules/emailConfig/emailConfig.service");
const createTransporter = require("../utils/email").createTransporter;

module.exports = {
  sendMail: async ({ to, subject, html, from }) => {
    const cfg = (await getSettings()) || {};
    const transporter = await createTransporter();

    const fromEmail = (cfg.fromEmail || process.env.SMTP_USER || "").trim();
    const fromName = (cfg.fromName || process.env.SMTP_NAME || "SkillBridge").trim();

    const mailOptions = {
      from: from || `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Sending email to ${to}`);
    } catch (err) {
      console.error("Failed to send email", err);
    }
  },
};