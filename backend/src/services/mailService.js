const logger = require('../utils/logger.js');

// 📁 src/services/mailService.js
const { getSettings } = require("../modules/emailConfig/emailConfig.service");
const createTransporter = require("../utils/email").createTransporter;

module.exports = {
  sendMail: async ({ to, subject, html, from, attachments }) => {
    const cfg = (await getSettings()) || {};
    const transporter = await createTransporter();
    if (!transporter) {
      logger.log(
        `Email delivery skipped for ${to} (transporter not configured or emails disabled)`
      );
      return;
    }

    const fromEmail = (cfg.fromEmail || process.env.SMTP_USER || "").trim();
    const fromName = (cfg.fromName || process.env.SMTP_NAME || "SkillBridge").trim();

    const mailOptions = {
      from: from || `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
      attachments,
    };
    try {
      await transporter.sendMail(mailOptions);
      logger.log(`Sending email to ${to}`);
    } catch (err) {
      logger.error("Failed to send email", err);
    }
  },
};
