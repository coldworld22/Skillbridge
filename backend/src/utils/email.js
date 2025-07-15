// 📁 src/utils/email.js
const nodemailer = require("nodemailer");
const emailConfigService = require("../modules/emailConfig/emailConfig.service");
const appConfigService = require("../modules/appConfig/appConfig.service");

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
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    "no-reply@eduskillbridge.net"
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${process.env.FRONTEND_URL || ""}${app.logo_url}`
    : "https://eduskillbridge.net/logo.png";
  const support = app.contactEmail || "support@eduskillbridge.net";

  const footer = `<p style="font-size:12px;color:#555;margin-top:20px">${fromName} © 2025 • All rights reserved<br/>Visit us: <a href="https://eduskillbridge.net">https://eduskillbridge.net</a></p>`;


  const footer =
    '<p style="font-size:12px;color:#555;margin-top:20px">SkillBridge © 2025 • All rights reserved<br/>Visit us: <a href="https://eduskillbridge.net">https://eduskillbridge.net</a></p>';
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,

    subject: `Your OTP for ${fromName}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for verifying your ${fromName} account is:</p>
        <p style="font-size:24px"><strong>🔐 ${otp}</strong></p>
        <p>This code is valid for 15 minutes. Please do not share it with anyone.</p>
        <p>If you didn’t request this, please ignore this message or contact us at <a href="mailto:${support}">${support}</a>.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>

        ${footer}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${to}`);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

// Notify user of successful password change
exports.sendPasswordChangeEmail = async (to) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    "no-reply@eduskillbridge.net"
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${process.env.FRONTEND_URL || ""}${app.logo_url}`
    : "https://eduskillbridge.net/logo.png";
  const support = app.contactEmail || "support@eduskillbridge.net";

  const footer = `<p style="font-size:12px;color:#555;margin-top:20px">${fromName} © 2025 • All rights reserved<br/>Visit us: <a href="https://eduskillbridge.net">https://eduskillbridge.net</a></p>`;


  const footer =
    '<p style="font-size:12px;color:#555;margin-top:20px">SkillBridge © 2025 • All rights reserved<br/>Visit us: <a href="https://eduskillbridge.net">https://eduskillbridge.net</a></p>';
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,

    subject: `Your ${fromName} password was changed`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Your ${fromName} password was changed successfully.</p>
        <p>If you did not request this change, please contact us <strong>immediately</strong> at <a href="mailto:${support}">${support}</a>.</p>
        <p>For your security, we recommend regularly updating your password and not sharing it with others.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>

        ${footer}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password change notice sent to ${to}`);
  } catch (error) {
    console.error("Error sending password change email: ", error);
  }
};
