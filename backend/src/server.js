// ─────────────────────────────────────────────────────────────────────────────
// 📁 SkillBridge Backend – Main Server Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
require("dotenv").config(); // ✅ Load environment variables from .env file
// Allow overriding the allowed origin via FRONTEND_URL env var.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const db = require("./config/database");

// Ensure new moderation columns exist even if migrations haven't been run
(async () => {
  try {
    const hasStatus = await db.schema.hasColumn(
      "online_classes",
      "moderation_status",
    );
    const hasReason = await db.schema.hasColumn(
      "online_classes",
      "rejection_reason",
    );
    if (!hasStatus || !hasReason) {
      await db.schema.alterTable("online_classes", (table) => {
        if (!hasStatus) {
          table
            .enu("moderation_status", ["Pending", "Approved", "Rejected"])
            .defaultTo("Pending");
        }
        if (!hasReason) {
          table.text("rejection_reason");
        }
      });
      await db.raw(
        "ALTER TABLE online_classes DROP CONSTRAINT IF EXISTS online_classes_moderation_status_check",
      );
      await db.raw(
        "ALTER TABLE online_classes ADD CONSTRAINT online_classes_moderation_status_check CHECK (moderation_status IS NULL OR moderation_status IN ('Pending','Approved','Rejected'))",
      );
      console.log(
        "ℹ️ Ensured online_classes has moderation_status and rejection_reason columns",
      );
    }
  } catch (err) {
    console.error("Error ensuring moderation columns:", err);
  }
})();

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
const paymentMethodsPublicRoutes = require("./modules/paymentMethods/paymentMethods.public.routes");
const paymentConfigRoutes = require("./modules/paymentConfig/paymentConfig.routes");
const payoutRoutes = require("./modules/payouts/payouts.routes");
const adsRoutes = require("./modules/ads/ads.routes");
const publicInstructorRoutes = require("./modules/instructors/instructor.routes");
const cartRoutes = require("./modules/cart/cart.routes");
const notificationRoutes = require("./modules/notifications/notifications.routes");
const messageRoutes = require("./modules/messages/messages.routes");
const chatRoutes = require("./modules/chat/chat.routes");
const offersRoutes = require("./modules/offers/offers.routes");
const offerResponseRoutes = require("./modules/offers/offerResponses.routes");
const socialLoginConfigRoutes = require("./modules/socialLoginConfig/socialLoginConfig.routes");
const appConfigRoutes = require("./modules/appConfig/appConfig.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});
app.disable("etag"); // prevent 304 responses due to ETag
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
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
// Increase payload limit to handle image uploads or larger requests
app.use(express.json({ limit: "10mb" }));

// 🍪 Parse cookies from incoming requests
app.use(cookieParser());

// 🌐 Allow frontend to communicate with backend (CORS)
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
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

app.use("/api/auth", authRoutes); // 🔐 Auth: login, register, password reset
app.use("/api/users", userRoutes); // 👤 Users: profile, avatar, demo video
app.use("/api/verify", verifyRoutes); // ✅ OTP: send/confirm email/phone
app.use("/api/certificates", certificatePublicRoutes); // 🎓 Public certificate verification
app.use("/api/bookings/admin", adminBookingRoutes); // 📅 Admin bookings management
app.use("/api/bookings/student", studentBookingRoutes); // 🎒 Student bookings
app.use("/api/bookings/instructor", instructorBookingRoutes); // 👩‍🏫 Instructor bookings
app.use("/api/community/admin", adminCommunityRoutes); // 🗣️ Admin community management
app.use("/api/roles", roleRoutes); // 🛡️ Role and permission management
app.use("/api/plans", planRoutes); // 💳 Subscription plans
app.use("/api/payment-methods", paymentMethodsPublicRoutes); // 💳 Public payment methods
app.use("/api/payments/admin", paymentRoutes); // 💵 Payments management
app.use("/api/payment-methods/admin", paymentMethodRoutes); // 💳 Payment methods
app.use("/api/payments/config", paymentConfigRoutes); // ⚙️ Payment settings
app.use("/api/social-login/config", socialLoginConfigRoutes); // 🔑 Social login settings
app.use("/api/app-config", appConfigRoutes); // 🛠️ Application settings
app.use("/api/payouts/admin", payoutRoutes); // 🏦 Instructor payouts
app.use("/api/ads", adsRoutes); // 📢 Advertisements
app.use("/api/offers", offersRoutes); // 📚 Learning marketplace offers
app.use("/api/offers/:offerId/responses", offerResponseRoutes); // 💬 Offer negotiations
app.use("/api/instructors", publicInstructorRoutes); // 📚 Public instructor listing
app.use("/api/cart", cartRoutes); // 🛒 Shopping cart
app.use("/api/notifications", notificationRoutes); // 🔔 User notifications
app.use("/api/messages", messageRoutes); // 💬 User messages
app.use("/api/chat", chatRoutes); // 💬 Direct chat

// 🩺 Health check (for CI/CD or uptime monitoring)
app.get("/", (req, res) => {
  res.send("🚀 SkillBridge API is live.");
});

// Endpoint to retrieve participants in a room
app.get("/api/video-calls/:roomId/participants", (req, res) => {
  const { roomId } = req.params;
  res.json(participants[roomId] || []);
});

// Simple in-memory store for call messages
const callMessages = {};

// Retrieve all messages for a room
app.get("/api/video-calls/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  res.json(callMessages[roomId] || []);
});

// Post a new message to a room
app.post("/api/video-calls/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  const { sender, text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Message text required" });
  }
  const message = {
    id: Date.now(),
    sender: sender || "Anonymous",
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };
  if (callMessages[roomId]) {
    callMessages[roomId].push(message);
  } else {
    callMessages[roomId] = [message];
  }
  res.status(201).json(message);
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
// 🎥 Socket.io Signaling for Video Calls
// ─────────────────────────────────────────────────────────────────────────────

const rooms = {};
// Track participants with additional info
const participants = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, name, role }) => {
    if (rooms[roomId]) {
      rooms[roomId].push(socket.id);
    } else {
      rooms[roomId] = [socket.id];
    }

    if (participants[roomId]) {
      participants[roomId].push({
        id: socket.id,
        name,
        role: role || "participant",
        isMuted: false,
      });
    } else {
      participants[roomId] = [
        { id: socket.id, name, role: role || "participant", isMuted: false },
      ];
    }

    const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
    socket.emit("all-users", otherUsers);
    socket.join(roomId);

    socket.on("sending-signal", (payload) => {
      io.to(payload.userToSignal).emit("user-joined", {
        signal: payload.signal,
        callerID: payload.callerID,
      });
    });

    socket.on("returning-signal", (payload) => {
      io.to(payload.callerID).emit("receiving-returned-signal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on("disconnect", () => {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (participants[roomId]) {
        participants[roomId] = participants[roomId].filter(
          (p) => p.id !== socket.id,
        );
      }
      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 Start Server
// ─────────────────────────────────────────────────────────────────────────────

// Default to port 5000 to match example env and docker-compose
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
