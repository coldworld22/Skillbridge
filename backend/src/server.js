require("dotenv").config();

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
const redisClient = require("./utils/redisClient");
const socketStore = require("./utils/socketStore");
const cache = require("./utils/cache");
const rateLimit = require("express-rate-limit");
const { passport, initStrategies } = require("./config/passport");
const db = require("./config/database");
const csrf = require("./middleware/csrf");
const path = require("path");
const { refreshCookieOptions } = require("./utils/cookie");
const startJobs = require("./jobs");
const { initSockets, state: socketState } = require("./sockets");
const routes = require("./routes");
const config = require("./config/env");

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

// Configure security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 🌐 Fix CORS (must be very early)
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((url) => {
    try {
      return new URL(url.trim()).origin;
    } catch {
      throw new Error(`Invalid FRONTEND_URL: ${url}`);
    }
  });
const APP_DOMAIN = process.env.APP_DOMAIN;
const defaultOrigins = APP_DOMAIN
  ? [`https://${APP_DOMAIN}`, `https://www.${APP_DOMAIN}`]
  : [];
const ALLOWED_ORIGINS = Array.from(
  new Set([
    ...defaultOrigins,
    ...FRONTEND_ORIGINS,
  ])
);
// 🌐 CORS must run before body parsing so even 4xx responses include the header
const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    const err = new Error("Origin not allowed");
    err.status = 403;
    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(err);
  },
  credentials: true,
};
app.use(cors(corsOptions));
// Ensure preflight requests get CORS headers
app.options("*", cors(corsOptions));

// Translate CORS errors into JSON responses
app.use((err, req, res, next) => {
  if (err && err.message === "Origin not allowed") {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  return next(err);
});

// Set reasonable body parser limits; routes needing more can override per-route
const defaultBodyLimit = "10mb";
app.use(express.json({ limit: defaultBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: defaultBodyLimit }));
app.use(cookieParser());
app.use(
  morgan("dev", {
    skip: (req) =>
      config.NODE_ENV === "production" && req.url === "/api/health",
  })
);
const sessionOptions = {
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { ...refreshCookieOptions },
};

if (redisClient) {
  sessionOptions.store = new RedisStore({ client: redisClient });
} else if (config.NODE_ENV === "production") {
  const msg = "REDIS_URL is required in production for session persistence";
  logger.error(`❌ ${msg}`);
  throw new Error(msg);
}

app.use(session(sessionOptions));

app.use(csrf);

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(passport.initialize());
app.use(passport.session());



// Restrict direct PDF access from the uploads folder
const uploadsPath = path.join(__dirname, "../uploads");
const serveUploads = express.static(uploadsPath, {
  maxAge: "1h",
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=3600");
  },
});
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

if (config.ENABLE_INSTALL) {
  const installerPath = path.join(__dirname, "../../install");
  app.use(
    "/install",
    express.static(installerPath, { maxAge: "1h" })
  );
}

// ─── Routes ───
app.use(routes);
app.use(require("./middleware/errorHandler"));
const PORT = config.PORT;

async function startServer() {
  if (redisClient) {
    try {
      await redisClient.connect();
      await socketStore.clearAll();
    } catch (err) {
      logger.error("❌ Failed to connect to Redis:", err);
      process.exit(1);
    }
  }

  try {
    await db.connectWithRetry();
    // Migrations are handled via the dedicated `npm run migrate` script.
    // Only warn here if the database is behind so the server can still start.
    const migrationDir = path.join(__dirname, "migrations");
    const [, pending] = await db.migrate.list({ directory: migrationDir });
    if (pending.length) {
      logger.warn(
        `⚠️ Pending migrations detected. Run \"npm run migrate\" before starting the server.`
      );
    } else {
      logger.log("✅ Database migrations up to date");
    }
    await initStrategies();
    await new Promise((resolve, reject) => {
      server.listen(PORT, "0.0.0.0", (err) => {
        if (err) {
          reject(err);
          return;
        }
        logger.log(`✅ Server running on port ${PORT}`);
        initSockets(server, ALLOWED_ORIGINS);
        const { io, userSockets } = socketState;
        global.io = io;
        global.userSockets = userSockets;
        resolve();
      });
    });
    startJobs();
  } catch (err) {
    logger.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

if (config.NODE_ENV !== "test") {
  startServer();
}

module.exports = {
  app,
  server,
  startServer,
  clearServerCache,
  get io() {
    return socketState.io;
  },
  get rooms() {
    return socketState.rooms;
  },
  get participants() {
    return socketState.participants;
  },
};
