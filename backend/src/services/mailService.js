
// 📁 src/services/mailService.js
module.exports = {
  sendMail: async ({ to, subject, html }) => {
    // Integrate with SMTP, SendGrid, or Resend
    console.log(`Sending email to ${to}`);
  },
};