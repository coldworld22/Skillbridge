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
const studentBookingRoutes = require("./modules/bookings/student.routes");
const instructorBookingRoutes = require("./modules/bookings/instructor.routes");
const adminCommunityRoutes = require("./modules/community/admin/admin.routes");
const roleRoutes = require("./modules/roles/roles.routes");
const planRoutes = require("./modules/plans/plans.routes");
const paymentRoutes = require("./modules/payments/payments.routes");
const paymentMethodRoutes = require("./modules/paymentMethods/paymentMethods.routes");
const paymentConfigRoutes = require("./modules/paymentConfig/paymentConfig.routes");
const payoutRoutes = require("./modules/payouts/payouts.routes");
const adsRoutes = require("./modules/ads/ads.routes");
const publicInstructorRoutes = require("./modules/instructors/instructor.routes");
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
// Allow overriding the allowed origin via FRONTEND_URL env var. This is useful
// when the frontend runs on a different port (e.g. 3001 in Docker).
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// 📋 HTTP request logger
app.use(morgan("dev"));

// 📁 Serve uploaded static files (avatars, identity, etc.)
// Support both `/uploads` and `/api/uploads` to allow direct access in production
// Use project root uploads directory (one level above backend)
// Example paths from modules resolve to "../../uploads"
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/api/uploads", express.static(uploadsDir));
app.use("/uploads", express.static(uploadsDir));



// ─────────────────────────────────────────────────────────────────────────────
// 📦 API Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);      // 🔐 Auth: login, register, password reset
app.use("/api/users", userRoutes);     // 👤 Users: profile, avatar, demo video
app.use("/api/verify", verifyRoutes);  // ✅ OTP: send/confirm email/phone
app.use("/api/certificates", certificatePublicRoutes); // 🎓 Public certificate verification
app.use("/api/bookings/admin", adminBookingRoutes); // 📅 Admin bookings management
app.use("/api/bookings/student", studentBookingRoutes); // 🎒 Student bookings
app.use("/api/bookings/instructor", instructorBookingRoutes); // 👩‍🏫 Instructor bookings
app.use("/api/community/admin", adminCommunityRoutes); // 🗣️ Admin community management
app.use("/api/roles", roleRoutes); // 🛡️ Role and permission management
app.use("/api/plans", planRoutes); // 💳 Subscription plans
app.use("/api/payments/admin", paymentRoutes); // 💵 Payments management
app.use("/api/payment-methods/admin", paymentMethodRoutes); // 💳 Payment methods
app.use("/api/payments/config", paymentConfigRoutes); // ⚙️ Payment settings
app.use("/api/payouts/admin", payoutRoutes); // 🏦 Instructor payouts
app.use("/api/ads", adsRoutes); // 📢 Advertisements
app.use("/api/instructors", publicInstructorRoutes); // 📚 Public instructor listing

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

// Default to port 5000 to match example env and docker-compose
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
