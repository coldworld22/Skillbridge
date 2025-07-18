// 📁 src/utils/email.js
const nodemailer = require("nodemailer");
const emailConfigService = require("../modules/emailConfig/emailConfig.service");
const appConfigService = require("../modules/appConfig/appConfig.service");
const { frontendBase } = require("./frontend");

// Common footer used in transactional emails
const EMAIL_FOOTER =
  '<p style="font-size:12px;color:#555;margin-top:20px">SkillBridge © 2025 • All rights reserved<br/>Visit us: <a href="https://eduskillbridge.net">https://eduskillbridge.net</a></p>';

// Skip actual email sending when true
const EMAILS_DISABLED = process.env.DISABLE_EMAILS === "true";

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

  if (EMAILS_DISABLED) {
    console.log(`[EMAIL DISABLED] OTP for ${to}: ${otp}`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    "support@eduskillbridge.net"
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();
  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : "https://eduskillbridge.net/logo.png";
  const support = app.contactEmail || "support@eduskillbridge.net";

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
        <p>Thank you,<br/>The SkillBridge Team</p>
        ${EMAIL_FOOTER}
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

  if (EMAILS_DISABLED) {
    console.log(`[EMAIL DISABLED] Password change notice for ${to}`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    "support@eduskillbridge.net"
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();
  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : "https://eduskillbridge.net/logo.png";
  const support = app.contactEmail || "support@eduskillbridge.net";

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

        <p>Thank you,<br/>The SkillBridge Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password change notice sent to ${to}`);
  } catch (error) {
    console.error("Error sending password change email: ", error);
  }
};

// Send welcome email to newly registered user
exports.sendWelcomeEmail = async (to, name) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();

  if (EMAILS_DISABLED) {
    console.log(`[EMAIL DISABLED] Welcome email for ${to}`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    "support@eduskillbridge.net"
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : "https://eduskillbridge.net/logo.png";
  const support = app.contactEmail || "support@eduskillbridge.net";

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Welcome to ${fromName}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello${name ? ` ${name}` : ""},</p>
        <p>Thank you for registering with <strong>${fromName}</strong>! All you have to do is complete your profile and verify your email and phone number.</p>
        <p>If you have any questions, reach us at <a href="mailto:${support}">${support}</a>.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error("Error sending welcome email: ", error);
  }
};

// Notify admins of new user registration
exports.sendNewUserAdminEmail = async (to, user) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();

  if (EMAILS_DISABLED) {
    console.log(`[EMAIL DISABLED] New user notice to ${to}`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    "support@eduskillbridge.net"
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : "https://eduskillbridge.net/logo.png";

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `New user registered on ${fromName}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>A new user has registered on <strong>${fromName}</strong>:</p>
        <p><strong>Name:</strong> ${user.full_name}<br/>
           <strong>Email:</strong> ${user.email}</p>
        <p>Please ensure they complete their profile and verification steps.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Admin new user notice sent to ${to}`);
  } catch (error) {
    console.error("Error sending admin new user email: ", error);
  }
};
