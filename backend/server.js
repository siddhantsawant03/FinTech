require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// Routes
const smartapiRoutes = require("./routes/smartapi");
const allocationRoutes = require("./routes/allocation");
const amfiRoutes = require("./routes/amfi");
const marketRoutes = require("./routes/market");

const app = express();
const PORT = process.env.PORT || 3001;

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
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      " https://fin-tech-roan.vercel.app",
    ],
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

// Health check
// app.get("/api/health", (req, res) => {
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  logger.info(
    `🚀 Wealth Allocator backend running on http://localhost:${PORT}`,
  );
});

module.exports = app;
