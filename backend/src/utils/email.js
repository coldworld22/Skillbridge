const logger = require('./logger.js');
// 📁 src/utils/email.js
const nodemailer = require("nodemailer");
const emailConfigService = require("../modules/emailConfig/emailConfig.service");
const appConfigService = require("../modules/appConfig/appConfig.service");
const { frontendBase } = require("./frontend");

const APP_DOMAIN = process.env.APP_DOMAIN;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
const DEFAULT_LOGO = APP_DOMAIN ? `https://${APP_DOMAIN}/logo.png` : "";
const EMAIL_FOOTER = APP_DOMAIN
  ? `<p style="font-size:12px;color:#555;margin-top:20px">SkillBridge © 2025 • All rights reserved<br/>Visit us: <a href="https://${APP_DOMAIN}">https://${APP_DOMAIN}</a></p>`
  : "";

// Skip actual email sending when true
const EMAILS_DISABLED = process.env.DISABLE_EMAILS === "true";

async function createTransporter() {
  if (EMAILS_DISABLED) {
    return null;
  }
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
      process.env.SMTP_SECURE === "true" ||
      port === 465,
    requireTLS: cfg.encryption === "TLS",
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
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();
  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;
  const support = app.contactEmail || SUPPORT_EMAIL;

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
    logger.log(`OTP sent to ${to}`);
  } catch (error) {
    logger.error("Error sending email: ", error);
  }
};

// Notify user of successful password change
exports.sendPasswordChangeEmail = async (to) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();
  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;
  const support = app.contactEmail || SUPPORT_EMAIL;

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
    logger.log(`Password change notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending password change email: ", error);
  }
};

// Send welcome email to newly registered user
exports.sendWelcomeEmail = async (to, name) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;
  const support = app.contactEmail || SUPPORT_EMAIL;

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
    logger.log(`Welcome email sent to ${to}`);
  } catch (error) {
    logger.error("Error sending welcome email: ", error);
  }
};

// Notify admins of new user registration
exports.sendNewUserAdminEmail = async (to, user) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

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
    logger.log(`Admin new user notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending admin new user email: ", error);
  }
};

// Notify instructor when a lesson is scheduled
exports.sendLessonScheduledEmail = async (
  to,
  lessonTitle,
  dateTime,
  classTitle
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const formatted = new Date(dateTime).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Lesson scheduled for ${classTitle}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>A new lesson <strong>${lessonTitle}</strong> for your class <strong>${classTitle}</strong> has been scheduled.</p>
        <p><strong>Date & Time:</strong> ${formatted}</p>
        <p>We will remind you 24 hours before it begins.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Lesson scheduled notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending lesson scheduled email: ", error);
  }
};

// Reminder email 24h before a lesson starts
exports.sendLessonReminderEmail = async (
  to,
  lessonTitle,
  dateTime,
  classTitle
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const formatted = new Date(dateTime).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Upcoming lesson reminder for ${classTitle}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>This is a reminder that your lesson <strong>${lessonTitle}</strong> for the class <strong>${classTitle}</strong> is scheduled to begin in 24 hours.</p>
        <p><strong>Start Time:</strong> ${formatted}</p>

        <p>Please be prepared and ensure all materials are ready.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Lesson reminder sent to ${to}`);
  } catch (error) {
    logger.error("Error sending lesson reminder email: ", error);
  }
};

// Notify students of a new class assignment
exports.sendAssignmentEmail = async (
  to,
  assignmentTitle,
  classTitle,
  dueDate
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;
  const support = app.contactEmail || SUPPORT_EMAIL;

  const due = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", { dateStyle: "long" })
    : null;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `New assignment for ${classTitle}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>A new assignment <strong>${assignmentTitle}</strong> has been posted for your class <strong>${classTitle}</strong>.</p>
        ${due ? `<p><strong>Due Date:</strong> ${due}</p>` : ""}
        <p>Please log in to view the details and submit your work.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Assignment notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending assignment email: ", error);
  }
};

/**
 * Notify admins when a user submits a support ticket
 * @param {string} to - Admin email address
 * @param {string} userName - Name of the user who created the ticket
 * @param {string} subjectTitle - Ticket subject
 * @param {string} ticketNumber - Generated ticket number
 */
exports.sendSupportTicketAdminEmail = async (
  to,
  userName,
  subjectTitle,
  ticketNumber
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `New support ticket from ${userName}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>User <strong>${userName}</strong> created a new support ticket.</p>
        <p><strong>Subject:</strong> ${subjectTitle}</p>
        <p><strong>Ticket #:</strong> ${ticketNumber}</p>
        <p>Please sign in to the admin panel to respond.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Support ticket admin notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending admin ticket email: ", error);
  }
};

/**
 * Acknowledge ticket submission to the user
 * @param {string} to - User email address
 * @param {string} name - User full name
 * @param {string} subjectTitle - Ticket subject
 * @param {string} ticketNumber - Generated ticket number
 */
exports.sendSupportTicketUserEmail = async (
  to,
  name,
  subjectTitle,
  ticketNumber
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `We received your support ticket`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>We have received your support ticket titled "${subjectTitle}".</p>
        <p>Your ticket number is <strong>#${ticketNumber}</strong>.</p>
        <p>Our team will respond within 24 hours. If you do not hear from us by then, please submit your ticket again.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Support ticket receipt sent to ${to}`);
  } catch (error) {
    logger.error("Error sending ticket receipt email: ", error);
  }
};

// Notify user about ticket updates like replies or status changes
exports.sendSupportTicketUpdateEmail = async (
  to,
  name,
  subjectTitle,
  updateMessage
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Update on your support ticket`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>${updateMessage}</p>
        <p><strong>Ticket:</strong> ${subjectTitle}</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Support ticket update sent to ${to}`);
  } catch (error) {
    logger.error("Error sending ticket update email: ", error);
  }
};

// Notify admins when a new tutorial is created
exports.sendTutorialCreatedAdminEmail = async (
  to,
  instructorName,
  tutorialTitle
) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `New tutorial awaiting review`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Instructor <strong>${instructorName}</strong> has submitted a new tutorial titled "${tutorialTitle}".</p>
        <p>Please review it at your earliest convenience.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Tutorial created admin notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending tutorial created admin email: ", error);
  }
};

// Confirm tutorial creation to the instructor
exports.sendTutorialCreatedInstructorEmail = async (to, tutorialTitle) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Your tutorial was submitted`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Your tutorial "${tutorialTitle}" was created successfully and is awaiting admin review.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Tutorial created instructor notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending tutorial created instructor email: ", error);
  }
};

// Notify instructor when a tutorial is approved
exports.sendTutorialApprovedEmail = async (to, tutorialTitle) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Your tutorial was approved`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Your tutorial "${tutorialTitle}" has been approved and is now published on the platform.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Tutorial approved notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending tutorial approved email: ", error);
  }
};

// Notify instructor when a tutorial is rejected
exports.sendTutorialRejectedEmail = async (to, tutorialTitle, reason) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const reasonLine = reason ? `<p>Reason: ${reason}</p>` : "";

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Your tutorial was rejected`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Your tutorial "${tutorialTitle}" was rejected.${reasonLine}</p>
        <p>You may edit it and resubmit for review.</p>

        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Tutorial rejection notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending tutorial rejected email: ", error);
  }
};

// Notify users when a new community question is posted
exports.sendNewDiscussionEmail = async (to, askerName, questionTitle) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `New question posted on ${fromName}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>${askerName} just asked a new question:</p>
        <p><strong>${questionTitle}</strong></p>
        <p>Visit the community forum to view and reply.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`New discussion notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending new discussion email: ", error);
  }
};

// Reminder email for abandoned cart items
exports.sendCartReminderEmail = async (to, itemName) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Don't forget your cart item`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>You left <strong>${itemName}</strong> in your cart.</p>
        <p>Don't let the chance slip away! Complete your purchase now.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Cart reminder email sent to ${to}`);
  } catch (error) {
    logger.error("Error sending cart reminder email: ", error);
  }
};

// Notify user immediately when they add an item to their cart
exports.sendCartAddedEmail = async (to, itemName) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Item added to your cart`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>You just added <strong>${itemName}</strong> to your cart.</p>
        <p>Complete your purchase anytime to secure it.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Cart added notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending cart added email: ", error);
  }
};

// Notify instructor that their ad was submitted for review
exports.sendAdSubmissionEmail = async (to, name, adTitle) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Your ad "${adTitle}" was submitted`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello${name ? ` ${name}` : ""},</p>
        <p>Your advertisement <strong>${adTitle}</strong> has been submitted successfully and is awaiting review.</p>
        <p>You will receive another email once it has been approved.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Ad submission notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending ad submission email: ", error);
  }
};

// Notify admins when a new ad is created by an instructor
exports.sendNewAdAdminEmail = async (to, instructorName, adTitle) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `New ad submitted: ${adTitle}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>${instructorName || "An instructor"} submitted a new advertisement titled <strong>${adTitle}</strong>.</p>
        <p>Please review and approve it at your earliest convenience.</p>
        <p>Thank you,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Admin new ad notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending new ad admin email: ", error);
  }
};

// Notify instructor when their ad is approved
exports.sendAdApprovalEmail = async (to, adTitle) => {
  const cfg = (await emailConfigService.getSettings()) || {};
  const app = (await appConfigService.getSettings()) || {};
  const transporter = await createTransporter();
  if (!transporter) {
    logger.log(`Emails disabled. Email to ${to} not sent.`);
    return;
  }

  const fromEmail = (
    cfg.fromEmail ||
    process.env.SMTP_USER ||
    SUPPORT_EMAIL
  ).trim();

  const fromName = (
    cfg.fromName ||
    process.env.SMTP_NAME ||
    app.appName ||
    "SkillBridge"
  ).trim();

  const logo = app.logo_url
    ? `${frontendBase}${app.logo_url}`
    : DEFAULT_LOGO;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    replyTo: cfg.replyTo || fromEmail,
    to,
    subject: `Your ad "${adTitle}" was approved`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <img src="${logo}" alt="${fromName}" style="max-width:150px;margin-bottom:20px"/>
        <p>Hello,</p>
        <p>Your advertisement <strong>${adTitle}</strong> has been reviewed and approved. It is now live on the platform.</p>
        <p>Thank you for advertising with us!</p>
        <p>Best regards,<br/>The ${fromName} Team</p>
        ${EMAIL_FOOTER}
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Ad approval notice sent to ${to}`);
  } catch (error) {
    logger.error("Error sending ad approval email: ", error);
  }
};
