const logger = require('./utils/logger.js');
// ─── SkillBridge Backend – Main Server Entry Point ───

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const rateLimit = require("express-rate-limit");
const { passport, initStrategies } = require("./config/passport");
const db = require("./config/database");
const csrf = require("./middleware/csrf");
const path = require("path");
const { refreshCookieOptions } = require("./utils/cookie");
const startJobs = require("./jobs");
const { initSockets, state: socketState } = require("./sockets");
const routes = require("./routes");
require("dotenv").config();

// Ensure required environment secrets are present
const requiredSecrets = [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "SESSION_SECRET",
];
const dbKey =
  process.env.NODE_ENV === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL";
requiredSecrets.push(dbKey);
const missingSecrets = requiredSecrets.filter((key) => !process.env[key]);
if (missingSecrets.length) {
  console.error(
    `❌ Missing required environment variables: ${missingSecrets.join(", ")}`
  );
  process.exit(1);
}


// ─── Express and HTTP Setup ───

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Security headers
// By default, Helmet sets Cross-Origin-Resource-Policy: same-origin which blocks
// loading images/files from api.<domain> on www.<domain>. Since we legitimately
// serve public assets from the API domain to the web app domain, relax CORP to
// "cross-origin" and disable COEP (not needed here) to prevent
// ERR_BLOCKED_BY_RESPONSE.NotSameOrigin on images/videos.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// 🌐 Fix CORS (must be very early)
let FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
if (FRONTEND_URL.startsWith("FRONTEND_URL=")) {
  FRONTEND_URL = FRONTEND_URL.replace(/^FRONTEND_URL=/, "");
}
const APP_DOMAIN = process.env.APP_DOMAIN;
const defaultOrigins = APP_DOMAIN
  ? [`https://${APP_DOMAIN}`, `https://www.${APP_DOMAIN}`]
  : [];
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
        // Deny the request without throwing so Express can return 403
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Set reasonable body parser limits; routes needing more can override per-route.
// Large content editors (such as the admin class builder which can embed
// sizeable HTML payloads) can legitimately exceed the old 10 MB default, so the
// limit is now configurable via DEFAULT_BODY_LIMIT.  We default to 25 MB to
// cover these cases while still protecting the server from unbounded payloads.
const defaultBodyLimit = process.env.DEFAULT_BODY_LIMIT || "25mb";
app.use(express.json({ limit: defaultBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: defaultBodyLimit }));
app.use(cookieParser());
app.use(
  morgan("dev", {
    skip: (req) =>
      process.env.NODE_ENV === "production" && req.url === "/api/health",
  })
);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required");
}
const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { ...refreshCookieOptions },
};

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  sessionOptions.store = new RedisStore({ client: redisClient });
} else if (process.env.NODE_ENV === "production") {
  const msg = "REDIS_URL is required in production for session persistence";
  logger.error(`❌ ${msg}`);
  throw new Error(msg);
}

app.use(session(sessionOptions));

app.use(csrf);

const rateLimitWindowMs = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 1000);
const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.originalUrl.startsWith("/socket.io") ||
    req.originalUrl.startsWith("/api/uploads"),
});
app.use(limiter);

app.use(passport.initialize());
app.use(passport.session());



// Restrict direct PDF access from the uploads folder
const uploadsPath = path.join(__dirname, "../uploads");
const serveUploads = express.static(uploadsPath);
const blockPdfMiddleware = (req, res, next) => {
  const lowerPath = (req.path || '').toLowerCase();
  const isPdf = lowerPath.endsWith('.pdf');
  // Allow preview PDFs under the dedicated previews folder or when explicitly marked
  // as preview via query flag for backward compatibility with old paths.
  const allowPreview =
    lowerPath.includes('/books/previews/') ||
    req.query?.preview === '1' ||
    req.query?.preview === 'true';

  if (isPdf && !allowPreview) {
    return res.status(403).json({ message: 'Direct PDF access is forbidden' });
  }
  return serveUploads(req, res, next);
};
app.use("/uploads", blockPdfMiddleware);
app.use("/api/uploads", blockPdfMiddleware);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

if (process.env.ENABLE_INSTALL === "true") {
  const installerPath = path.join(__dirname, "../../install");
  app.use("/install", express.static(installerPath));
}

// ─── Routes ───
app.use(routes);

// Initialize sockets
initSockets(server, ALLOWED_ORIGINS);
const { io, rooms, participants, userSockets } = socketState;
global.io = io;
global.userSockets = userSockets;

app.use(require("./middleware/errorHandler"));
const PORT = process.env.PORT || 5002;

async function startServer() {
  if (redisClient) {
    try {
      await redisClient.connect();
    } catch (err) {
      logger.error("❌ Failed to connect to Redis:", err);
      process.exit(1);
    }
  }

  try {
    await db.connectWithRetry();
    const migrationDir = path.join(__dirname, "migrations");
    try {
      const [batch, migrations] = await db.migrate.latest({
        directory: migrationDir,
      });
      if (migrations.length) {
        logger.log(
          `✅ Ran ${migrations.length} database migration${
            migrations.length === 1 ? "" : "s"
          } (batch ${batch})`
        );
      } else {
        logger.log("✅ Database migrations up to date");
      }
    } catch (migrationErr) {
      logger.error("❌ Failed to run database migrations:", migrationErr);
      throw migrationErr;
    }
    await initStrategies();
    server.listen(PORT, "0.0.0.0", () => {
      logger.log(`✅ Server running on port ${PORT}`);
    });
    startJobs();
  } catch (err) {
    logger.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

module.exports = { app, server, io, rooms, participants, startServer };
