
// 📁 src/services/mailService.js
const { getSettings } = require("../modules/emailConfig/emailConfig.service");
const createTransporter = require("../utils/email").createTransporter;

module.exports = {
  sendMail: async ({ to, subject, html, from }) => {
    const cfg = (await getSettings()) || {};
    const transporter = await createTransporter();
    const mailOptions = {
      from: from || cfg.fromEmail || process.env.SMTP_USER,
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