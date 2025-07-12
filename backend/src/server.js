// ─── SkillBridge Backend – Main Server Entry Point ───

const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { Server } = require("socket.io");
const { passport, initStrategies } = require("./config/passport");
const db = require("./config/database");
const path = require("path");
require("dotenv").config();
// ─── Database Migration for Online Classes Moderation ───
const app = express();
const server = http.createServer(app);

// 🌐 Fix CORS (must be very early)
let FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
if (FRONTEND_URL.startsWith("FRONTEND_URL=")) {
  FRONTEND_URL = FRONTEND_URL.replace(/^FRONTEND_URL=/, "");
}
const ALLOWED_ORIGINS = FRONTEND_URL.split(',').map(o => o.trim());

(async () => {
  try {
    const hasStatus = await db.schema.hasColumn("online_classes", "moderation_status");
    const hasReason = await db.schema.hasColumn("online_classes", "rejection_reason");
    if (!hasStatus || !hasReason) {
      await db.schema.alterTable("online_classes", table => {
        if (!hasStatus) table.enu("moderation_status", ["Pending", "Approved", "Rejected"]).defaultTo("Pending");
        if (!hasReason) table.text("rejection_reason");
      });
      await db.raw("ALTER TABLE online_classes DROP CONSTRAINT IF EXISTS online_classes_moderation_status_check");
      await db.raw("ALTER TABLE online_classes ADD CONSTRAINT online_classes_moderation_status_check CHECK (moderation_status IS NULL OR moderation_status IN ('Pending','Approved','Rejected'))");
      console.log("ℹ️ Ensured online_classes has moderation_status and rejection_reason columns");
    }
  } catch (err) {
    console.error("Error ensuring moderation columns:", err);
  }
})();

app.disable("etag");
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(session({
  secret: process.env.SESSION_SECRET || "skillbridge",
  resave: false,
  saveUninitialized: false,
}));

(async () => {
  try {
    await initStrategies();
  } catch (err) {
    console.error("Failed to init social login strategies", err);
  }
})();
app.use(passport.initialize());

// 🌐 CORS Middleware (Dynamic)
// Ensure CORS headers are always present, even on errors
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // ⚠️ Preflight must be short-circuited
  }
  next();
});



app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

// ─── Routes ───
app.use("/api/auth", require("./modules/auth/routes/auth.routes"));
app.use("/api/users", require("./modules/users/user.routes"));
app.use("/api/verify", require("./modules/verify/verify.routes"));
app.use("/api/certificates", require("./modules/users/tutorials/certificate/certificatePublic.routes"));
app.use("/api/bookings/admin", require("./modules/bookings/bookings.routes"));
app.use("/api/bookings/student", require("./modules/bookings/student.routes"));
app.use("/api/bookings/instructor", require("./modules/bookings/instructor.routes"));
app.use("/api/community/admin", require("./modules/community/admin/admin.routes"));
app.use("/api/roles", require("./modules/roles/roles.routes"));
app.use("/api/plans", require("./modules/plans/plans.routes"));
app.use("/api/payment-methods", require("./modules/paymentMethods/paymentMethods.public.routes"));
app.use("/api/payments/admin", require("./modules/payments/payments.routes"));
app.use("/api/payment-methods/admin", require("./modules/paymentMethods/paymentMethods.routes"));
app.use("/api/payments/config", require("./modules/paymentConfig/paymentConfig.routes"));
app.use("/api/social-login/config", require("./modules/socialLoginConfig/socialLoginConfig.routes"));
app.use("/api/app-config", require("./modules/appConfig/appConfig.routes"));
app.use("/api/payouts/admin", require("./modules/payouts/payouts.routes"));
app.use("/api/ads", require("./modules/ads/ads.routes"));
app.use("/api/groups", require("./modules/groups/groups.routes"));
app.use("/api/offers", require("./modules/offers/offers.routes"));
app.use("/api/offers/:offerId/responses", require("./modules/offers/offerResponses.routes"));
app.use("/api/instructors", require("./modules/instructors/instructor.routes"));
app.use("/api/students", require("./modules/students/student.routes"));
app.use("/api/cart", require("./modules/cart/cart.routes"));
app.use("/api/notifications", require("./modules/notifications/notifications.routes"));
app.use("/api/messages", require("./modules/messages/messages.routes"));
app.use("/api/chat", require("./modules/chat/chat.routes"));

app.get("/", (req, res) => res.send("🚀 SkillBridge API is live."));

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});
const rooms = {}, participants = {}, callMessages = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, name, role }) => {
    rooms[roomId] = rooms[roomId] || [];
    participants[roomId] = participants[roomId] || [];
    rooms[roomId].push(socket.id);
    participants[roomId].push({ id: socket.id, name, role: role || "participant", isMuted: false });
    socket.join(roomId);
    socket.emit("all-users", rooms[roomId].filter((id) => id !== socket.id));

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
      participants[roomId] = participants[roomId].filter((p) => p.id !== socket.id);
      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });
});

app.get("/api/video-calls/:roomId/participants", (req, res) => {
  res.json(participants[req.params.roomId] || []);
});
app.get("/api/video-calls/:roomId/messages", (req, res) => {
  res.json(callMessages[req.params.roomId] || []);
});
app.post("/api/video-calls/:roomId/messages", (req, res) => {
  const { sender, text } = req.body || {};
  const roomId = req.params.roomId;
  if (!text?.trim()) return res.status(400).json({ message: "Message text required" });
  const message = { id: Date.now(), sender: sender || "Anonymous", text: text.trim(), timestamp: new Date().toISOString() };
  callMessages[roomId] = callMessages[roomId] || [];
  callMessages[roomId].push(message);
  res.status(201).json(message);
});

// ✅ Final fallback CORS headers in case route errors skip the first middleware
// Final fallback CORS headers on errors
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  console.error("❌", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});



app.use(require("./middleware/errorHandler"));
app.use((err, req, res, next) => {
  console.error("❌", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
