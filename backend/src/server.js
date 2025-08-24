const logger = require('./utils/logger.js');
// ─── SkillBridge Backend – Main Server Entry Point ───

const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const { Server } = require("socket.io");
const { passport, initStrategies } = require("./config/passport");
const db = require("./config/database");
const { verifyToken } = require("./middleware/auth/authMiddleware");
const verifyEnrollment = require("./middleware/auth/verifyEnrollment");
const verifyHostRole = require("./middleware/auth/verifyHostRole");
const csrf = require("./middleware/csrf");
const path = require("path");
const startLessonReminderJob = require("./jobs/lessonReminderJob");
const { startLessonLiveJob } = require("./jobs/lessonLiveJob");
const startCartReminderJob = require("./jobs/cartReminderJob");
const startClassReminderJob = require("./jobs/classReminderJob");
const startCleanupJob = require("./jobs/cleanupJob");
const startContributorStatsJob = require("./jobs/contributorStatsJob");
const { createLessonRoomLink } = require("./utils/roomLink");
const { refreshCookieOptions } = require("./utils/cookie");
require("dotenv").config();

// Ensure required environment secrets are present
const requiredSecrets = ["JWT_SECRET", "REFRESH_TOKEN_SECRET"];
const missingSecrets = requiredSecrets.filter((key) => !process.env[key]);
if (missingSecrets.length) {
  throw new Error(
    `Missing required environment variables: ${missingSecrets.join(", ")}`
  );
}


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

// Set reasonable body parser limits; routes needing more can override per-route
const defaultBodyLimit = "10mb";
app.use(express.json({ limit: defaultBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: defaultBodyLimit }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(csrf);

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "skillbridge",
  resave: false,
  saveUninitialized: false,
  cookie: { ...refreshCookieOptions },
};

if (process.env.REDIS_URL) {
  const redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(console.error);
  sessionOptions.store = new RedisStore({ client: redisClient });
}

app.use(session(sessionOptions));

app.use(passport.initialize());



// Restrict direct PDF access from the uploads folder
const uploadsPath = path.join(__dirname, "../uploads");
const serveUploads = express.static(uploadsPath);
const blockPdfMiddleware = (req, res, next) => {
  if (req.path.toLowerCase().endsWith(".pdf")) {
    return res.status(403).json({ message: "Direct PDF access is forbidden" });
  }
  return serveUploads(req, res, next);
};
app.use("/uploads", blockPdfMiddleware);
app.use("/api/uploads", blockPdfMiddleware);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

const installerPath = path.join(__dirname, "../../install");
app.use("/install", express.static(installerPath));

// ─── Routes ───
app.use("/api/auth", require("./modules/auth/routes/auth.routes"));
app.use("/api/users", require("./modules/users/user.routes"));
app.use("/api/verify", require("./modules/verify/verify.routes"));
app.use("/api/license", require("./modules/license/license.routes"));
app.use(
  "/api/certificates",
  require("./modules/users/tutorials/certificate/certificatePublic.routes")
);
app.use(
  "/api/certificates/admin",
  require("./modules/users/tutorials/certificate/certificateAdmin.routes")
);
app.use("/api/certificate-templates", require("./modules/certificateTemplates/certificateTemplates.routes"));
app.use("/api/bookings/admin", require("./modules/bookings/bookings.routes"));
app.use("/api/bookings/student", require("./modules/bookings/student.routes"));
app.use("/api/bookings/instructor", require("./modules/bookings/instructor.routes"));
app.use("/api/community/admin", require("./modules/community/admin/admin.routes"));
app.use("/api/community", require("./modules/community/public/public.routes"));
app.use("/api/related-questions", require("./modules/community/public/relatedQuestions.routes"));
app.use("/api/roles", require("./modules/roles/roles.routes"));
app.use("/api/plans", require("./modules/plans/plans.routes"));
// Register admin routes before public routes to prevent public routes from catching
// requests intended for admin endpoints such as "/api/payment-methods/admin".
app.use(
  "/api/payment-methods/admin",
  require("./modules/paymentMethods/paymentMethods.routes")
);
app.use(
  "/api/payment-methods",
  require("./modules/paymentMethods/paymentMethods.public.routes")
);
app.use("/api/payments/student", require("./modules/payments/student.routes"));
app.use("/api/payments/bank", require("./modules/payments/bank.routes"));
app.use("/api/payments/crypto", require("./modules/payments/crypto.routes"));
// Alias for NOWPayments crypto gateway
app.use(
  "/api/payments/nowpayments",
  require("./modules/payments/crypto.routes")
);
// PayPal order creation and callback
app.use(
  "/api/payments/paypal",
  require("./modules/payments/paypal.routes")
);
app.use("/api/payments/admin", require("./modules/payments/payments.routes"));
app.use(
  "/api/admin/payments/bank",
  require("./modules/payments/bank.admin.routes")
);
app.use("/api/payments/config", require("./modules/paymentConfig/paymentConfig.routes"));
app.use("/api/messages/config", require("./modules/messagesConfig/messagesConfig.routes"));
app.use("/api/social-login/config", require("./modules/socialLoginConfig/socialLoginConfig.routes"));
app.use("/api/app-config", require("./modules/appConfig/appConfig.routes"));
app.use("/api/third-party-config", require("./modules/thirdPartyConfig/thirdPartyConfig.routes"));
app.use("/api/google-analytics", require("./modules/googleAnalytics/googleAnalytics.routes"));
app.use("/api/adsense", require("./modules/adsense/adsense.routes"));
app.use("/api/ai-assistance", require("./modules/ai/ai.routes"));
app.use("/api/email-config", require("./modules/emailConfig/emailConfig.routes"));
app.use("/api/contact-config", require("./modules/contactConfig/contactConfig.routes"));
app.use("/api/contact", require("./modules/contact/contact.routes"));
app.use("/api/seo-config", require("./modules/seoConfig/seoConfig.routes"));
app.use("/api/popup-announcements", require("./modules/popupAnnouncements/popupAnnouncements.routes"));
app.use("/api/policies", require("./modules/policies/policies.routes"));
app.use("/api/payouts/admin", require("./modules/payouts/payouts.routes"));
app.use("/api/ads", require("./modules/ads/ads.routes"));
app.use("/api/coupons", require("./modules/coupons/coupons.routes"));
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
app.use("/api/moderation", require("./modules/moderation/moderation.routes"));
app.use("/api/languages", require("./modules/languages/languages.routes"));
app.use("/api/currencies", require("./modules/currencies/currencies.routes"));
app.use("/api/blog", require("./modules/blog/blog.routes"));
app.use("/api/faqs", require("./modules/faqs/faqs.routes"));
app.use("/api/support", require("./modules/support/support.routes"));
app.use("/api/tickets", require("./modules/tickets/tickets.routes"));
app.use("/api/media", require("./modules/media/media.routes"));
app.use("/api/book-categories", require("./modules/bookCategories/bookCategories.routes"));
app.use("/api/books", require("./modules/books/book.routes"));
app.use("/api/instructor/books", require("./modules/books/instructorBook.routes"));
app.use("/api/book-reviews", require("./modules/bookReviews/bookReview.routes"));
app.use("/api/library", require("./modules/library/library.routes"));
app.use("/api/search", require("./modules/search/search.routes"));
app.use("/api/install", require("./modules/install/install.routes"));

// Generate secure video room link for a lesson
app.post("/api/users/classes/lessons/:lessonId/room", verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await db("class_lessons as l")
      .join("online_classes as c", "l.class_id", "c.id")
      .select("l.class_id", "c.instructor_id")
      .where("l.id", lessonId)
      .first();
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    const isInstructor = lesson.instructor_id === req.user.id;
    let isStudent = false;
    if (!isInstructor) {
      const enrollment = await db("class_enrollments")
        .where({ class_id: lesson.class_id, user_id: req.user.id })
        .first();
      if (enrollment) isStudent = true;
    }
    if (!isInstructor && !isStudent)
      return res.status(403).json({ message: "Not allowed" });
    const link = createLessonRoomLink(lessonId);
    res.json(link);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate room link" });
  }
});

app.get("/", (req, res) => res.send("🚀 SkillBridge API is live."));

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});
const rooms = {}, participants = {};

const userSockets = {};
global.io = io;
global.userSockets = userSockets;

io.on("connection", (socket) => {
  socket.on("register", ({ userId }) => {
    if (!userId) return;
    userSockets[userId] = socket.id;
    socket.userId = userId;
  });

  socket.on("call-user", async ({ to, roomId }) => {
    const from = socket.userId;
    const target = userSockets[to];
    if (from && target) {
      try {
        const caller = await db("users")
          .select("full_name")
          .where({ id: from })
          .first();
        io.to(target).emit("incoming-call", {
          chatId: from,
          roomId,
          name: caller?.full_name || "",
        });
      } catch (err) {
        logger.error("Failed to handle call-user event", err);
      }
    }
  });

  socket.on("call-accepted", ({ chatId, roomId }) => {
    const target = userSockets[chatId];
    if (socket.userId && target) {
      io.to(target).emit("call-accepted", { chatId: socket.userId, roomId });
    }
  });

  socket.on("call-declined", ({ chatId }) => {
    const target = userSockets[chatId];
    if (socket.userId && target) {
      io.to(target).emit("call-declined", { chatId: socket.userId });
    }
  });

  socket.on("call-cancelled", ({ chatId }) => {
    const target = userSockets[chatId];
    if (socket.userId && target) {
      io.to(target).emit("call-cancelled", { chatId: socket.userId });
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId && userSockets[socket.userId] === socket.id) {
      delete userSockets[socket.userId];
    }
  });

  socket.on("join-room", ({ roomId, name, role }) => {
    rooms[roomId] = rooms[roomId] || [];
    participants[roomId] = participants[roomId] || [];
    rooms[roomId].push(socket.id);
    const participant = { id: socket.id, name, role: role || "participant", isMuted: false };
    participants[roomId].push(participant);
    socket.join(roomId);
    socket.emit("all-users", rooms[roomId].filter((id) => id !== socket.id));

    db("video_call_participants")
      .insert({ room_id: roomId, socket_id: socket.id, name, role: role || "participant" })
      .returning("id")
      .then(([row]) => {
        socket.participantDbId = row.id;
      })
      .catch((err) => logger.error("Failed to store participant", err));

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
      if (!rooms[roomId].length) {
        delete rooms[roomId];
        delete participants[roomId];
      }
      if (socket.participantDbId) {
        db("video_call_participants")
          .where({ id: socket.participantDbId })
          .update({ left_at: new Date() })
          .catch((err) => logger.error("Failed to update participant leave", err));
      }
    });
  });
});

app.get(
  "/api/video-calls/:roomId/participants",
  verifyToken,
  verifyEnrollment,
  async (req, res) => {
    try {
      const rows = await db("video_call_participants")
        .select(
          "socket_id as id",
          "name",
          "role",
          "is_muted as isMuted",
          "joined_at"
        )
        .where({ room_id: req.params.roomId })
        .andWhere("left_at", null);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  }
);

app.patch(
  "/api/video-calls/:roomId/participants/:id",
  verifyToken,
  verifyHostRole,
  async (req, res) => {
    const { roomId, id } = req.params;
    const { isMuted, role } = req.body || {};
    const updateData = {};
    if (typeof isMuted === "boolean") updateData.is_muted = isMuted;
    if (role) updateData.role = role;
    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "No fields to update" });
    try {
      await db("video_call_participants")
        .where({ room_id: roomId, socket_id: id })
        .andWhere("left_at", null)
        .update(updateData);
      if (participants[roomId]) {
        const p = participants[roomId].find((p) => p.id === id);
        if (p) {
          if (typeof isMuted === "boolean") p.isMuted = isMuted;
          if (role) p.role = role;
        }
      }
      const [participant] = await db("video_call_participants")
        .select(
          "socket_id as id",
          "name",
          "role",
          "is_muted as isMuted"
        )
        .where({ room_id: roomId, socket_id: id })
        .andWhere("left_at", null);
      io.to(roomId).emit("participant-updated", participant);
      res.json(participant);
    } catch (err) {
      res.status(500).json({ message: "Failed to update participant" });
    }
  }
);

app.delete(
  "/api/video-calls/:roomId/participants/:id",
  verifyToken,
  verifyHostRole,
  async (req, res) => {
    const { roomId, id } = req.params;
    try {
      await db("video_call_participants")
        .where({ room_id: roomId, socket_id: id })
        .andWhere("left_at", null)
        .update({ left_at: new Date() });
      if (participants[roomId]) {
        participants[roomId] = participants[roomId].filter((p) => p.id !== id);
      }
      io.to(roomId).emit("participant-removed", { id });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to remove participant" });
    }
  }
);

app.get("/api/video-calls/:roomId/messages", verifyToken, async (req, res) => {
  try {
    const messages = await db("video_call_messages")
      .where({ room_id: req.params.roomId })
      .orderBy("timestamp", "asc");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

app.post(
  "/api/video-calls/:roomId/messages",
  verifyToken,
  verifyEnrollment,
  async (req, res) => {
    const { text } = req.body || {};
    const roomId = req.params.roomId;
    if (!text?.trim())
      return res.status(400).json({ message: "Message text required" });
    try {
      const [message] = await db("video_call_messages")
        .insert({
          room_id: roomId,
          sender_id: req.user.id,
          sender: req.user.full_name,
          text: text.trim(),
        })
        .returning("*");
      io.to(roomId).emit("call-message", message);
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Failed to store message" });
    }
  },
);

app.use(require("./middleware/errorHandler"));
const PORT = process.env.PORT || 5002;

async function startServer() {
  try {
    await db.migrate.latest({ directory: path.join(__dirname, "migrations") });
    logger.log("✅ Database migrations up to date");
    await initStrategies();
    server.listen(PORT, "0.0.0.0", () => {
      logger.log(`✅ Server running on port ${PORT}`);
    });
    startLessonReminderJob();
    startLessonLiveJob();
    startClassReminderJob();
    startCartReminderJob();
    startCleanupJob();
    startContributorStatsJob();
  } catch (err) {
    logger.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

module.exports = { app, server, io, rooms, participants, startServer };
