const express = require("express");

const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=86400",
});

const STATIC_OPTIONS = Object.freeze({
  maxAge: "1d",
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    }
  },
});

const validatePath = (req, res, next) => {
  if (req.path.includes("..") || req.path.includes("~")) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (req.path && !req.path.toLowerCase().endsWith(".png")) {
    return res.status(403).json({ error: "Only PNG files are allowed" });
  }

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  next();
};

const getUploadsInfo = (req, res) => {
  res.json({
    message: "Screenshots upload directory",
    note: "Access individual files at /uploads/{filename}.png",
  });
};

const staticMiddleware = (uploadsPath) => {
  const router = express.Router();

  router.use(
    "/uploads",
    validatePath,
    express.static(uploadsPath, STATIC_OPTIONS)
  );
  router.get("/uploads", getUploadsInfo);

  return router;
};

module.exports = staticMiddleware;
