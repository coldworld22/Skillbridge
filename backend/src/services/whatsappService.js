module.exports = {
  sendWhatsApp: async ({ to, message }) => {
    // Integrate with Twilio or another provider here
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
  },
};
