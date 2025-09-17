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
  const { url, devices } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const screenshotService = new ScreenshotService(baseUrl);

  try {
    console.log(
      `Screenshot request: ${url} for devices: ${devices.join(", ")}`
    );
    const result = await screenshotService.captureMultiple(url, devices);

    const response = createSuccessResponse(result);
    const statusCode = result.successful > 0 ? 200 : 500;

    res.status(statusCode).json(response);
  } catch (error) {
    console.error("Screenshot capture error:", error);
    res.status(500).json({
      success: false,
      error: "Screenshot capture failed",
      message: error.message,
      code: "CAPTURE_ERROR",
    });
  }
};

router.post("/capture", validateCaptureRequest, captureScreenshots);

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
