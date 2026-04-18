// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// const winston = require("winston");

// // Routes
// const smartapiRoutes = require("./routes/smartapi");
// const allocationRoutes = require("./routes/allocation");
// const amfiRoutes = require("./routes/amfi");
// const marketRoutes = require("./routes/market");
// const dashboardRoutes = require("./routes/dashboard");
// // ...after existing app.use() lines:
// app.use("/api/dashboard", dashboardRoutes);

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Logger
// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.colorize(),
//     winston.format.simple(),
//   ),
//   transports: [new winston.transports.Console()],
// });

// // Middleware
// app.use(helmet({ contentSecurityPolicy: false }));
// app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));
// app.use(express.json({ limit: "10mb" }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000,
//   max: 100,
//   message: { error: "Too many requests, please slow down." },
// });
// app.use("/api/", limiter);

// // Request logging
// app.use((req, res, next) => {
//   logger.info(`${req.method} ${req.path}`);
//   next();
// });

// // Routes
// app.use("/api/smartapi", smartapiRoutes);
// app.use("/api/allocation", allocationRoutes);
// app.use("/api/amfi", amfiRoutes);
// app.use("/api/market", marketRoutes);

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "ok",
//     timestamp: new Date().toISOString(),
//     version: "1.0.0",
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   logger.error(err.stack);
//   res
//     .status(500)
//     .json({ error: "Internal server error", message: err.message });
// });

// app.listen(PORT, () => {
//   logger.info(
//     `🚀 Wealth Allocator backend running on http://localhost:${PORT}`,
//   );
// });

// module.exports = app;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const fs = require("fs");
const path = require("path");

// Routes
const smartapiRoutes = require("./routes/smartapi");
const allocationRoutes = require("./routes/allocation");
const amfiRoutes = require("./routes/amfi");
const marketRoutes = require("./routes/market");
const dashboardRoutes = require("./routes/dashboard"); // ✅ require stays here

const app = express(); // ✅ app is defined FIRST
const PORT = process.env.PORT || 3001;
const FRONTEND_DIST_DIR = path.resolve(__dirname, "../frontend/dist");
const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const enforceCorsOrigins = configuredOrigins.length > 0;

// Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple(),
  ),
  transports: [new winston.transports.Console()],
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        !enforceCorsOrigins ||
        configuredOrigins.includes("*") ||
        configuredOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please slow down." },
});
app.use("/api/", limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/smartapi", smartapiRoutes);
app.use("/api/allocation", allocationRoutes);
app.use("/api/amfi", amfiRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/dashboard", dashboardRoutes); // ✅ moved to here

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

if (fs.existsSync(FRONTEND_DIST_DIR)) {
  app.use(express.static(FRONTEND_DIST_DIR));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST_DIR, "index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  logger.info(
    `🚀 Wealth Allocator backend running on port ${PORT}`,
  );
  if (fs.existsSync(FRONTEND_DIST_DIR)) {
    logger.info(`📦 Serving frontend build from ${FRONTEND_DIST_DIR}`);
  }
});

module.exports = app;
