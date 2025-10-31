const logger = require('./utils/logger.js');
require('./utils/dns');
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
const fs = require("fs");
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

const defaultApiHosts = [];
if (APP_DOMAIN) {
  defaultApiHosts.push(`${APP_DOMAIN}`, `www.${APP_DOMAIN}`, `api.${APP_DOMAIN}`);
}
const allowedApiHosts = Array.from(
  new Set(
    [
      ...(process.env.ALLOWED_API_HOSTS || "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
      ...defaultApiHosts,
      process.env.API_HOST,
      "localhost",
      "127.0.0.1",
    ]
      .filter(Boolean)
      .map((host) => host.toLowerCase())
  )
);
const allowedHostSet = new Set(allowedApiHosts);
const allowedOriginSet = new Set(ALLOWED_ORIGINS);
if (APP_DOMAIN) {
  allowedOriginSet.add(`https://${APP_DOMAIN}`);
  allowedOriginSet.add(`https://www.${APP_DOMAIN}`);
  allowedOriginSet.add(`https://api.${APP_DOMAIN}`);
}

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

// Block requests that come from untrusted hosts or browser origins to limit phishing proxies.
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const hostHeader = (req.headers.host || "").toLowerCase();
  if (hostHeader) {
    const hostname = hostHeader.replace(/:\d+$/, "");
    if (!allowedHostSet.has(hostname)) {
      logger.warn(`Rejected request with invalid host header: ${hostHeader}`);
      return res.status(403).json({ message: "Forbidden host" });
    }
  }

  const originHeader = req.headers.origin;
  if (originHeader) {
    if (!allowedOriginSet.has(originHeader)) {
      logger.warn(`Rejected request with invalid origin header: ${originHeader}`);
      return res.status(403).json({ message: "Origin not allowed" });
    }
  } else if (req.headers.referer) {
    try {
      const refererOrigin = new URL(req.headers.referer).origin;
      if (!allowedOriginSet.has(refererOrigin)) {
        logger.warn(
          `Rejected request with invalid referer header: ${req.headers.referer}`
        );
        return res.status(403).json({ message: "Referer not allowed" });
      }
    } catch (error) {
      logger.warn(`Failed to parse referer header: ${req.headers.referer}`);
      return res.status(403).json({ message: "Invalid referer" });
    }
  }

  return next();
});

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
const MemoryStore = session.MemoryStore;

class AdaptiveSessionStore extends session.Store {
  constructor(initialStore) {
    super();
    this.activeStore = initialStore;
    this.redisStore = null;
    this.loggedFallback = false;
  }

  useRedis(store) {
    this.redisStore = store;
    this.activeStore = store;
    this.loggedFallback = false;
  }

  fallbackToMemory() {
    const alreadyMemory = this.activeStore instanceof MemoryStore;
    if (!alreadyMemory) {
      this.activeStore = new MemoryStore();
    }
    if (!this.loggedFallback) {
      this.loggedFallback = true;
      logger.warn(
        "⚠️ Falling back to in-memory session store; sessions will reset on restart."
      );
    }
  }

  get(sid, callback) {
    this.activeStore.get(sid, callback);
  }

  set(sid, sessionData, callback) {
    this.activeStore.set(sid, sessionData, callback);
  }

  destroy(sid, callback) {
    this.activeStore.destroy(sid, callback);
  }

  touch(sid, sessionData, callback) {
    if (typeof this.activeStore.touch === "function") {
      this.activeStore.touch(sid, sessionData, callback);
    } else if (callback) {
      callback();
    }
  }
}

const adaptiveStore = new AdaptiveSessionStore(new MemoryStore());

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { ...refreshCookieOptions },
  store: adaptiveStore,
};

let redisClient;
let redisStore;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (err) => {
    logger.error("❌ Redis client error:", err);
    adaptiveStore.fallbackToMemory();
  });
  redisStore = new RedisStore({ client: redisClient });
} else if (process.env.NODE_ENV === "production") {
  const msg = "REDIS_URL is required in production for session persistence";
  logger.error(`❌ ${msg}`);
  throw new Error(msg);
}

app.use(session(sessionOptions));

app.use(csrf);

app.use(passport.initialize());
app.use(passport.session());

const rateLimitWindowMs = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 1000);

const parseSkipPrefixes = (raw) =>
  (raw || "")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);

const defaultSkipPrefixes = [
  "/socket.io",
  "/api/uploads",
  "/api/messages",
  "/api/notifications",
  "/api/chat",
  "/api/popup-announcements",
  "/api/languages",
  "/api/groups/my",
];

const configuredSkipPrefixes = parseSkipPrefixes(
  process.env.RATE_LIMIT_SKIP_PREFIXES
);
const rateLimitSkipPrefixes = configuredSkipPrefixes.length
  ? configuredSkipPrefixes
  : defaultSkipPrefixes;

const resolveClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  if (typeof forwarded === "string" && forwarded.length) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }
  return req.ip || req.connection?.remoteAddress || "";
};

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === "OPTIONS") return true;
    const url = req.originalUrl || req.url || "";
    return rateLimitSkipPrefixes.some((prefix) => url.startsWith(prefix));
  },
  keyGenerator: (req) => {
    const baseIp = resolveClientIp(req);
    const userId =
      req.user?.id ||
      req.session?.passport?.user ||
      req.session?.user?.id ||
      null;
    if (userId) {
      return `${userId}:${baseIp}`;
    }
    const ua = req.headers["user-agent"] || "";
    return `${baseIp}:${ua.slice(0, 64)}`;
  },
});
app.use(limiter);



// Restrict direct PDF access for protected uploads (e.g., paid books)
const uploadsPath = path.join(__dirname, "../uploads");
const serveUploads = express.static(uploadsPath);
const blockPdfMiddleware = (req, res, next) => {
  const lowerPath = (req.path || '').toLowerCase();
  const isPdf = lowerPath.endsWith('.pdf');
  const isBookAsset = lowerPath.startsWith('/books/');
  const isPreviewFile = lowerPath.startsWith('/books/previews/');
  const previewFlag = req.query?.preview;
  const allowLegacyPreview =
    typeof previewFlag === 'string' &&
    (previewFlag === '1' || previewFlag.toLowerCase() === 'true');

  if (isPdf && isBookAsset && !isPreviewFile && !allowLegacyPreview) {
    return res.status(403).json({ message: 'Direct PDF access is forbidden' });
  }
  return serveUploads(req, res, next);
};
app.use("/uploads", blockPdfMiddleware);
app.use("/api/uploads", blockPdfMiddleware);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader(
    "Permissions-Policy",
    "microphone=(self), camera=(), geolocation=()"
  );
  next();
});

const installerPath = path.join(__dirname, "../install");
const shouldServeInstaller =
  (process.env.ENABLE_INSTALL || "").toLowerCase() === "true" ||
  (process.env.INSTALL_API_ENABLED || "").toLowerCase() === "true";
logger.debug?.("Installer flags", {
  shouldServeInstaller,
  installerPath,
  exists: fs.existsSync(installerPath),
});
if (shouldServeInstaller && fs.existsSync(installerPath)) {
  const installerIndex = path.join(installerPath, "index.html");
  logger.log(`📦 Serving installer assets from ${installerPath}`);
  const sendInstaller = (req, res) => {
    const wildcard = req.params?.wildcard || "";
    const relativePath = wildcard.replace(/^\/+/, "");
    if (relativePath) {
      const candidate = path.join(installerPath, relativePath);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return res.sendFile(candidate, (err) => {
          if (err) {
            logger.error("Failed to send installer asset", {
              asset: candidate,
              error: err.message,
            });
            res.status(500).send("Installer asset unavailable");
          }
        });
      }
    }
    return res.sendFile(installerIndex, (err) => {
      if (err) {
        logger.error("Failed to send installer index", {
          asset: installerIndex,
          error: err.message,
        });
        res.status(err.statusCode || 500).send("Installer unavailable");
      }
    });
  };

  app.get("/install", sendInstaller);
  app.get("/install/", sendInstaller);
  app.get("/install/:wildcard(*)", sendInstaller);
}

const docsPath = path.join(__dirname, "../docs");
if (fs.existsSync(docsPath)) {
  logger.log(`📚 Serving documentation from ${docsPath}`);
  app.get("/docs", (req, res) => res.redirect(301, "/docs/"));
  app.use(
    "/docs",
    express.static(docsPath, {
      index: "index.html",
      extensions: ["html", "htm"],
    }),
  );
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
      if (redisStore) {
        adaptiveStore.useRedis(redisStore);
        logger.log("✅ Connected to Redis for session storage");
      }
    } catch (err) {
      logger.error("❌ Failed to connect to Redis:", err);
      adaptiveStore.fallbackToMemory();
      try {
        await redisClient.quit();
      } catch (quitErr) {
        logger.debug("Redis client quit error:", quitErr);
      }
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
