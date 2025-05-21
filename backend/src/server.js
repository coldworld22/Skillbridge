// ─────────────────────────────────────────────────────────────────────────────
// 📁 SkillBridge Backend – Main Server Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // ✅ Load environment variables from .env file

// ───── Import Route Modules ─────
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 Global Middleware Setup
// ─────────────────────────────────────────────────────────────────────────────

// 🧠 Parse incoming JSON bodies
app.use(express.json());

// 🍪 Parse cookies from incoming requests
app.use(cookieParser());

// 🌐 Allow frontend to communicate with backend (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: "http://localhost:3000", // ✅ Your frontend app origin
    credentials: true,               // ✅ Allow cookies in cross-origin requests
  })
);

// 📋 Log HTTP requests (development only)
app.use(morgan("dev"));

// 📁 Serve static files (e.g. uploaded avatars)
app.use("/uploads", express.static("uploads"));

// ─────────────────────────────────────────────────────────────────────────────
// 📦 API Routes
// ─────────────────────────────────────────────────────────────────────────────

// 🔐 Auth routes (login, register, refresh, logout, OTP, reset password)
app.use("/api/auth", authRoutes);

// 👤 User routes (CRUD, profile editing, role updates, export)
app.use("/api/users", userRoutes);

// 🩺 Health check route (optional, for CI/CD or uptime bots)
app.get("/", (req, res) => {
  res.send("🚀 SkillBridge API is live.");
});

// ─────────────────────────────────────────────────────────────────────────────
//  Global Error Handler (Optional)
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 Start Server
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
