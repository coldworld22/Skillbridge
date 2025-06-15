// ─────────────────────────────────────────────────────────────────────────────
// 📁 SkillBridge Backend – Main Server Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // ✅ Load environment variables from .env file

// ───── Import Route Modules ─────
const authRoutes = require("./modules/auth/routes/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const verifyRoutes = require("./modules/verify/verify.routes"); // ✅ OTP routes
const certificatePublicRoutes = require("./modules/users/tutorials/certificate/certificatePublic.routes");
const adminBookingRoutes = require("./modules/bookings/bookings.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.disable('etag');       // prevent 304 responses due to ETag
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 Global Middleware Setup
// ─────────────────────────────────────────────────────────────────────────────
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 Global Middleware Setup
// ─────────────────────────────────────────────────────────────────────────────

// 🧠 Parse incoming JSON bodies
app.use(express.json());

// 🍪 Parse cookies from incoming requests
app.use(cookieParser());

// 🌐 Allow frontend to communicate with backend (CORS)
app.use(
  cors({
    origin: "http://localhost:3000", // ✅ Replace with your frontend domain
    credentials: true,
  })
);

// 📋 HTTP request logger
app.use(morgan("dev"));

// 📁 Serve uploaded static files (avatars, identity, etc.)
// Optional: Support both `/uploads` and `/api/uploads`
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));



// ─────────────────────────────────────────────────────────────────────────────
// 📦 API Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);      // 🔐 Auth: login, register, password reset
app.use("/api/users", userRoutes);     // 👤 Users: profile, avatar, demo video
app.use("/api/verify", verifyRoutes);  // ✅ OTP: send/confirm email/phone
app.use("/api/certificates", certificatePublicRoutes); // 🎓 Public certificate verification
app.use("/api/bookings/admin", adminBookingRoutes); // 📅 Admin bookings management

// 🩺 Health check (for CI/CD or uptime monitoring)
app.get("/", (req, res) => {
  res.send("🚀 SkillBridge API is live.");
});

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ Global Error Handler
// ─────────────────────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`❌ Error: ${message}`);
  res.status(status).json({ message });
});

// ─────────────────────────────────────────────────────────────────────────────
// 📦 Custom Error Handler Middleware
// ─────────────────────────────────────────────────────────────────────────────


app.use(errorHandler); // ✅ After all routes


// ─────────────────────────────────────────────────────────────────────────────
// 🚀 Start Server
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
