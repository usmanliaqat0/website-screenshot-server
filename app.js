const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");

const captureRoutes = require("./src/routes/capture");
const staticMiddleware = require("./src/middleware/static");
const {
  errorHandler,
  notFoundHandler,
  requestId,
  requestLogger,
} = require("./src/middleware/errorHandler");
const browserManager = require("./src/browserManager");

const app = express();
const PORT = 3000;
const UPLOADS_PATH = path.join(__dirname, "uploads");
const IS_PRODUCTION = false;

const RATE_LIMIT_CONFIG = {
  windowMs: 900000,
  max: 1000,
  message: {
    error: "Too many requests",
    message:
      "Too many screenshot requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
};

const HELMET_CONFIG = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

const CORS_CONFIG = {
  origin: true,
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.set("trust proxy", "loopback");

app.use(helmet(HELMET_CONFIG));
app.use(cors(CORS_CONFIG));
app.use(rateLimit(RATE_LIMIT_CONFIG));

const BODY_LIMIT = "50mb";

app.use(requestId);
app.use(requestLogger);
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use(staticMiddleware(UPLOADS_PATH));
app.use("/", captureRoutes);

const getHealthStatus = (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    environment: "development",
  });
};

const getApiInfo = (req, res) => {
  res.json({
    name: "Website Screenshot Server",
    description:
      "Production-ready Node.js API for capturing full-page website screenshots using Playwright",
    version: "1.0.0",
    features: [
      "Multi-device screenshot capture (mobile, tablet, laptop, desktop)",
      "Section screenshot capture with CSS selectors",
      "Parallel processing for concurrent screenshots",
      "Full-page screenshot capture with smart content detection",
      "Rate limiting and security headers",
      "Request logging and health monitoring",
      "File management and cleanup utilities",
      "Comprehensive error handling and validation",
    ],
    endpoints: {
      "POST /capture": {
        description: "Capture full-page screenshots for specified device types",
        body: {
          url: "string (required) - Website URL to capture",
          devices:
            "array (required) - Device types: mobile, tablet, laptop, desktop",
        },
        example: { url: "https://example.com", devices: ["mobile", "desktop"] },
        response: "Returns screenshot URLs, viewport info, and capture summary",
      },
      "POST /capture/section": {
        description: "Capture screenshots of specific page sections/elements",
        body: {
          url: "string (required) - Website URL to capture",
          devices: "array (required) - Device types",
          selector: "string (required) - CSS selector for target element",
        },
        example: {
          url: "https://example.com",
          devices: ["mobile", "desktop"],
          selector: ".hero-section",
        },
        response:
          "Returns section screenshot URLs, element bounds, and capture summary",
      },
      "GET /capture/devices": {
        description:
          "List all available device presets with viewport configurations",
        response:
          "Device names, viewport dimensions, scale factors, and mobile flags",
      },
      "DELETE /capture/clear": {
        description: "Delete all screenshot images from uploads directory",
        response: "Deletion count and success status",
      },
      "GET /health": {
        description: "Server health check with uptime and version information",
        response: "Status, timestamp, uptime, version, and environment",
      },
      "GET /": {
        description: "API documentation and server information",
      },
      "GET /uploads/{filename}": {
        description:
          "Direct access to captured screenshot files with caching headers",
      },
    },
    devicePresets: {
      mobile: { width: 375, height: 812, scaleFactor: 2, isMobile: true },
      tablet: { width: 768, height: 1024, scaleFactor: 2, isMobile: true },
      laptop: { width: 1366, height: 768, scaleFactor: 1, isMobile: false },
      desktop: { width: 1920, height: 1080, scaleFactor: 1, isMobile: false },
    },
    usage: {
      basicScreenshot:
        'POST /capture with {"url": "https://example.com", "devices": ["desktop"]}',
      sectionScreenshot:
        'POST /capture/section with {"url": "https://example.com", "devices": ["mobile", "desktop"], "selector": ".hero-section"}',
      multipleDevices: "POST /capture with all device types in devices array",
      checkDevices: "GET /capture/devices to see all available presets",
      healthCheck: "GET /health for server status and monitoring",
      clearImages: "DELETE /capture/clear to remove all screenshots",
    },
    rateLimits: {
      maxRequests: 1000,
      windowMs: 900000,
      description: "1000 requests per 15-minute window per IP address",
    },
    serverInfo: {
      port: 3000,
      environment: "development",
      browser: "Chromium (Playwright)",
      uploadPath: "./uploads",
    },
  });
};

app.get("/health", getHealthStatus);
app.get("/", getApiInfo);

app.use(notFoundHandler);
app.use(errorHandler);

const SHUTDOWN_TIMEOUT = 30000;

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed.");

    try {
      await browserManager.close();
      console.log("Browser closed.");
      console.log("Graceful shutdown completed.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
};

const initializeServer = async () => {
  try {
    await browserManager.initialize();
    console.log("Browser initialized successfully");
  } catch (error) {
    console.error("Failed to initialize browser:", error);
  }
};

const server = app.listen(PORT, () => {
  console.log(`Screenshot Server running on port ${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_PATH}`);
  console.log(`Environment: development`);
  console.log(`API Documentation: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);

  initializeServer();
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

module.exports = app;
