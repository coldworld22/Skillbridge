const express = require("express");
const db = require("../config/database");
const router = express.Router();

// Test API - Check Server Status
router.get("/status", (req, res) => {
  res.json({ success: true, message: "SkillBridge API is now running 🚀" });
});

// Test API - Check Database Connection
router.get("/db-test", async (req, res) => {
  try {
    const users = await db("users").select("*");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error", error });
  }
});

module.exports = router;
