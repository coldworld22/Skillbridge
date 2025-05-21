// 📁 src/utils/email.js
const nodemailer = require("nodemailer");

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send OTP Email
exports.sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
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
