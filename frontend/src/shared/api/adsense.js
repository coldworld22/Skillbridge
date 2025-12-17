export default function handler(req, res) {
    // Simulated response from the backend (this will later be fetched from the database)
    res.status(200).json({
      enabled: true, // Admin can toggle this ON/OFF
      clientID: "ca-pub-XXXXXXXXXX", // AdSense Publisher ID
      slotID: "1234567890", // AdSense Ad Slot ID
    });
  }
  