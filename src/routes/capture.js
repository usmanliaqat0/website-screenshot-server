const express = require("express");
const ScreenshotService = require("../screenshotService");
const { VALID_DEVICES } = require("../config");

const router = express.Router();

const VALIDATION_ERRORS = Object.freeze({
  MISSING_URL: { error: "URL is required", code: "MISSING_URL" },
  MISSING_DEVICES: {
    error: "Devices array is required and must not be empty",
    code: "MISSING_DEVICES",
    validDevices: VALID_DEVICES,
  },
  MISSING_SELECTOR: {
    error: "Selector is required for section capture",
    code: "MISSING_SELECTOR",
  },
  INVALID_SELECTOR: {
    error:
      "Invalid selector format. Must be a valid CSS selector (element, class, or ID)",
    code: "INVALID_SELECTOR",
    examples: [
      "div",
      ".class-name",
      "#element-id",
      "section.hero",
      "header#main-header",
    ],
  },
  INVALID_DEVICE_COUNT: {
    error: "At least 1 device is required, maximum is all available devices",
    code: "INVALID_DEVICE_COUNT",
    validDevices: VALID_DEVICES,
  },
});

const validateCaptureRequest = (req, res, next) => {
  const { url, devices } = req.body;

  if (!url) {
    return res.status(400).json(VALIDATION_ERRORS.MISSING_URL);
  }

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json(VALIDATION_ERRORS.MISSING_DEVICES);
  }

  const invalidDevices = devices.filter(
    (device) => !VALID_DEVICES.includes(device)
  );

  if (invalidDevices.length > 0) {
    return res.status(400).json({
      error: `Invalid devices: ${invalidDevices.join(", ")}`,
      code: "INVALID_DEVICES",
      invalidDevices,
      validDevices: VALID_DEVICES,
    });
  }

  req.body.devices = [...new Set(devices)];
  next();
};

const validateSectionCaptureRequest = (req, res, next) => {
  const { url, devices, selector } = req.body;

  if (!url) {
    return res.status(400).json(VALIDATION_ERRORS.MISSING_URL);
  }

  if (!selector || typeof selector !== "string" || selector.trim() === "") {
    return res.status(400).json(VALIDATION_ERRORS.MISSING_SELECTOR);
  }

  // Enhanced CSS selector validation - more permissive for complex selectors
  const trimmedSelector = selector.trim();

  // Check for basic safety - no script injection attempts
  if (
    trimmedSelector.includes("<") ||
    trimmedSelector.includes(">") ||
    trimmedSelector.includes("javascript:") ||
    trimmedSelector.includes("data:")
  ) {
    return res.status(400).json({
      error: "Invalid selector: contains potentially unsafe characters",
      code: "INVALID_SELECTOR",
      examples: [
        "div",
        ".class-name",
        "#element-id",
        "section.hero",
        "header#main-header",
      ],
    });
  }

  // Check if it's a space-separated class string (common mistake)
  if (
    trimmedSelector.includes(" ") &&
    !trimmedSelector.startsWith(".") &&
    !trimmedSelector.startsWith("#") &&
    !trimmedSelector.startsWith("[")
  ) {
    return res.status(400).json({
      error:
        "Invalid selector format. Space-separated classes need to be chained with dots",
      code: "INVALID_SELECTOR",
      message: `You provided: "${trimmedSelector}"`,
      suggestion: `Try: ".${trimmedSelector.split(" ").join(".")}"`,
      examples: [
        "div",
        ".class-name",
        "#element-id",
        "section.hero",
        "header#main-header",
        ".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed.e-con.e-parent.e-lazyloaded",
        ".class1.class2.class3",
        "[data-id='bb4cf52']",
      ],
    });
  }

  // More permissive pattern that handles complex class combinations
  const selectorPattern =
    /^[a-zA-Z*][a-zA-Z0-9\-_]*(\.[a-zA-Z0-9\-_]+)*(#[a-zA-Z0-9\-_]+)*(\[[a-zA-Z0-9\-_=*"'^$~|:]+(\s*[a-zA-Z0-9\-_=*"'^$~|:]+\s*)*\])*(\s+[a-zA-Z*][a-zA-Z0-9\-_]*(\.[a-zA-Z0-9\-_]+)*(#[a-zA-Z0-9\-_]+)*(\[[a-zA-Z0-9\-_=*"'^$~|:]+(\s*[a-zA-Z0-9\-_=*"'^$~|:]+\s*)*\])*)*$/;

  if (!selectorPattern.test(trimmedSelector)) {
    return res.status(400).json({
      error: "Invalid selector format. Must be a valid CSS selector",
      code: "INVALID_SELECTOR",
      examples: [
        "div",
        ".class-name",
        "#element-id",
        "section.hero",
        "header#main-header",
        ".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed.e-con.e-parent.e-lazyloaded",
        ".class1.class2.class3",
        "[data-id='bb4cf52']",
      ],
    });
  }

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json(VALIDATION_ERRORS.INVALID_DEVICE_COUNT);
  }

  if (devices.length > VALID_DEVICES.length) {
    return res.status(400).json(VALIDATION_ERRORS.INVALID_DEVICE_COUNT);
  }

  const invalidDevices = devices.filter(
    (device) => !VALID_DEVICES.includes(device)
  );

  if (invalidDevices.length > 0) {
    return res.status(400).json({
      error: `Invalid devices: ${invalidDevices.join(", ")}`,
      code: "INVALID_DEVICES",
      invalidDevices,
      validDevices: VALID_DEVICES,
    });
  }

  req.body.devices = [...new Set(devices)];
  req.body.selector = selector.trim();
  next();
};

const createSuccessResponse = (result) => {
  const response = {
    success: true,
    url: result.url,
    timestamp: result.timestamp,
    summary: {
      total: result.total,
      successful: result.successful,
      failed: result.errors.length,
    },
    screenshots: result.screenshots.map((screenshot) => ({
      device: screenshot.device,
      url: screenshot.url,
      viewport: screenshot.viewport,
    })),
  };

  if (result.errors.length > 0) {
    response.errors = result.errors.map((error) => ({
      device: error.device,
      message: error.error,
    }));
  }

  return response;
};

const captureScreenshots = async (req, res) => {
  const { url, devices, fastMode } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const screenshotService = new ScreenshotService(baseUrl, {
    fastMode: Boolean(fastMode),
  });

  try {
    console.log(
      `Screenshot request: ${url} for devices: ${devices.join(", ")}`
    );
    const watchdogMs = Number(process.env.CAPTURE_WATCHDOG_MS || 60000);

    const watchdog = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`CAPTURE_WATCHDOG_TIMEOUT_${watchdogMs}`)),
        watchdogMs
      )
    );

    const result = await Promise.race([
      screenshotService.captureMultiple(url, devices),
      watchdog,
    ]);

    const response = createSuccessResponse(result);
    const statusCode = result.successful > 0 ? 200 : 500;

    res.status(statusCode).json(response);
  } catch (error) {
    const message = String(error?.message || "");
    const isWatchdog = message.startsWith("CAPTURE_WATCHDOG_TIMEOUT_");
    const code = isWatchdog ? "CAPTURE_TIMEOUT" : "CAPTURE_ERROR";
    const status = isWatchdog ? 504 : 500;

    console.error("Screenshot capture error:", error);
    res.status(status).json({
      success: false,
      error: isWatchdog ? "Capture timed out" : "Screenshot capture failed",
      message: isWatchdog ? "Global watchdog exceeded" : error.message,
      code,
    });
  }
};

const captureSectionScreenshots = async (req, res) => {
  const { url, devices, selector, fastMode } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const screenshotService = new ScreenshotService(baseUrl, {
    fastMode: Boolean(fastMode),
  });

  try {
    console.log(
      `Section screenshot request: ${url} for devices: ${devices.join(
        ", "
      )} (selector: ${selector})`
    );
    const watchdogMs = Number(process.env.CAPTURE_WATCHDOG_MS || 60000);

    const watchdog = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`CAPTURE_WATCHDOG_TIMEOUT_${watchdogMs}`)),
        watchdogMs
      )
    );

    const result = await Promise.race([
      screenshotService.captureMultipleSections(url, devices, selector),
      watchdog,
    ]);

    const response = createSuccessResponse(result);
    const statusCode = result.successful > 0 ? 200 : 500;

    res.status(statusCode).json(response);
  } catch (error) {
    const message = String(error?.message || "");
    const isWatchdog = message.startsWith("CAPTURE_WATCHDOG_TIMEOUT_");
    const code = isWatchdog ? "CAPTURE_TIMEOUT" : "CAPTURE_ERROR";
    const status = isWatchdog ? 504 : 500;

    console.error("Section screenshot capture error:", error);
    res.status(status).json({
      success: false,
      error: isWatchdog
        ? "Capture timed out"
        : "Section screenshot capture failed",
      message: isWatchdog ? "Global watchdog exceeded" : error.message,
      code,
    });
  }
};

router.post("/capture", validateCaptureRequest, captureScreenshots);
router.post(
  "/capture/section",
  validateSectionCaptureRequest,
  captureSectionScreenshots
);

const getDevicesInfo = (req, res) => {
  const { DEVICE_PRESETS } = require("../config");

  const devices = Object.entries(DEVICE_PRESETS).map(([name, config]) => ({
    name,
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor,
    isMobile: config.isMobile,
  }));

  res.json({
    success: true,
    devices,
    total: devices.length,
  });
};

router.get("/capture/devices", getDevicesInfo);

const deleteAllImages = async (req, res) => {
  const fs = require("fs").promises;
  const path = require("path");

  try {
    const uploadsPath = path.join(__dirname, "../../uploads");

    const files = await fs.readdir(uploadsPath);

    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].includes(ext);
    });

    if (imageFiles.length === 0) {
      return res.json({
        success: true,
        message: "No images found to delete",
        deletedCount: 0,
      });
    }

    const deletePromises = imageFiles.map((file) =>
      fs.unlink(path.join(uploadsPath, file))
    );

    await Promise.all(deletePromises);

    console.log(`Deleted ${imageFiles.length} images from uploads folder`);

    res.json({
      success: true,
      message: `Successfully deleted ${imageFiles.length} images`,
      deletedCount: imageFiles.length,
    });
  } catch (error) {
    console.error("Error deleting images:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete images",
      message: error.message,
      code: "DELETE_ERROR",
    });
  }
};

router.delete("/capture/clear", deleteAllImages);

module.exports = router;
