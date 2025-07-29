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
const startLessonReminderJob = require("./jobs/lessonReminderJob");
require("dotenv").config();


// ─── Express and HTTP Setup ───

const app = express();
const server = http.createServer(app);

// 🌐 Fix CORS (must be very early)
let FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
if (FRONTEND_URL.startsWith("FRONTEND_URL=")) {
  FRONTEND_URL = FRONTEND_URL.replace(/^FRONTEND_URL=/, "");
}
const defaultOrigins = [
  "https://eduskillbridge.net",
  "https://www.eduskillbridge.net",
];
const ALLOWED_ORIGINS = Array.from(
  new Set([
    ...defaultOrigins,
    ...FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/$/, "")),
  ])
);

app.disable("etag");
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
// 🌐 CORS must run before body parsing so even 4xx responses include the header
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// Increase body parser limits for large class uploads
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(session({
  secret: process.env.SESSION_SECRET || "skillbridge",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());



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
app.use("/api/certificates/admin", require("./modules/certificates/certificates.routes"));
app.use("/api/bookings/admin", require("./modules/bookings/bookings.routes"));
app.use("/api/bookings/student", require("./modules/bookings/student.routes"));
app.use("/api/bookings/instructor", require("./modules/bookings/instructor.routes"));
app.use("/api/community/admin", require("./modules/community/admin/admin.routes"));
app.use("/api/community", require("./modules/community/public/public.routes"));
app.use("/api/roles", require("./modules/roles/roles.routes"));
app.use("/api/plans", require("./modules/plans/plans.routes"));
app.use("/api/payment-methods", require("./modules/paymentMethods/paymentMethods.public.routes"));
app.use("/api/payments/admin", require("./modules/payments/payments.routes"));
app.use("/api/payment-methods/admin", require("./modules/paymentMethods/paymentMethods.routes"));
app.use("/api/payments/config", require("./modules/paymentConfig/paymentConfig.routes"));
app.use("/api/messages/config", require("./modules/messagesConfig/messagesConfig.routes"));
app.use("/api/social-login/config", require("./modules/socialLoginConfig/socialLoginConfig.routes"));
app.use("/api/app-config", require("./modules/appConfig/appConfig.routes"));
app.use("/api/third-party-config", require("./modules/thirdPartyConfig/thirdPartyConfig.routes"));
app.use("/api/ai-assistance", require("./modules/ai/ai.routes"));
app.use("/api/email-config", require("./modules/emailConfig/emailConfig.routes"));
app.use("/api/contact-config", require("./modules/contactConfig/contactConfig.routes"));
app.use("/api/seo-config", require("./modules/seoConfig/seoConfig.routes"));
app.use("/api/popup-announcements", require("./modules/popupAnnouncements/popupAnnouncements.routes"));
app.use("/api/policies", require("./modules/policies/policies.routes"));
app.use("/api/payouts/admin", require("./modules/payouts/payouts.routes"));
app.use("/api/ads", require("./modules/ads/ads.routes"));
app.use("/api/groups", require("./modules/groups/groups.routes"));
app.use("/api/offers", require("./modules/offers/offers.routes"));
app.use("/api/offers/:offerId/responses", require("./modules/offers/offerResponses.routes"));
app.use("/api/instructors", require("./modules/instructors/instructor.routes"));
app.use("/api/students", require("./modules/students/student.routes"));
app.use("/api/cart", require("./modules/cart/cart.routes"));
app.use("/api/notifications", require("./modules/notifications/notifications.routes"));
app.use("/api/system-errors", require("./modules/errorLogs/errorLogs.routes"));
app.use("/api/messages", require("./modules/messages/messages.routes"));
app.use("/api/chat", require("./modules/chat/chat.routes"));
app.use("/api/languages", require("./modules/languages/languages.routes"));
app.use("/api/currencies", require("./modules/currencies/currencies.routes"));
app.use("/api/blog", require("./modules/blog/blog.routes"));
app.use("/api/support", require("./modules/support/support.routes"));
app.use("/api/tickets", require("./modules/tickets/tickets.routes"));
app.use("/api/media", require("./modules/media/media.routes"));

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

app.use(require("./middleware/errorHandler"));
const PORT = process.env.PORT || 5002;

async function startServer() {
  try {
    await db.migrate.latest({ directory: path.join(__dirname, "migrations") });
    console.log("✅ Database migrations up to date");
    await initStrategies();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
    startLessonReminderJob();
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
