const fs = require("fs").promises;
const path = require("path");
const cron = require("node-cron");

class CleanupService {
  constructor(uploadsDir, cleanupIntervalHours = 10) {
    this.uploadsDir = uploadsDir;
    this.cleanupIntervalHours = cleanupIntervalHours;
    this.isRunning = false;
    this.lastCleanup = null;
    this.cleanupStats = {
      totalDeleted: 0,
      lastRun: null,
      errors: [],
    };
  }

  /**
   * Parse filename to extract creation date
   * Expected format: YYYY-MM-DD_HH-MM-SS_device_random.png
   */
  parseFileDate(filename) {
    try {
      const parts = filename.split("_");
      if (parts.length < 2) return null;

      const dateStr = parts[0]; // YYYY-MM-DD
      const timeStr = parts[1]; // HH-MM-SS

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ||
        !/^\d{2}-\d{2}-\d{2}$/.test(timeStr)
      ) {
        return null;
      }

      const dateTimeStr = `${dateStr}T${timeStr.replace(/-/g, ":")}`;
      return new Date(dateTimeStr);
    } catch (error) {
      console.warn(
        `Failed to parse date from filename: ${filename}`,
        error.message
      );
      return null;
    }
  }

  /**
   * Check if file is older than the cleanup interval
   */
  isFileOlderThan(filePath, hours) {
    try {
      const stats = require("fs").statSync(filePath);
      const fileAge = Date.now() - stats.mtime.getTime();
      const hoursInMs = hours * 60 * 60 * 1000;
      return fileAge > hoursInMs;
    } catch (error) {
      console.warn(`Failed to get file stats for: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * Get all image files in uploads directory
   */
  async getImageFiles() {
    try {
      const files = await fs.readdir(this.uploadsDir);
      return files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].includes(ext);
      });
    } catch (error) {
      console.error("Failed to read uploads directory:", error.message);
      return [];
    }
  }

  /**
   * Clean up old screenshots
   */
  async cleanupOldScreenshots() {
    if (this.isRunning) {
      console.log("Cleanup already in progress, skipping...");
      return { success: false, message: "Cleanup already in progress" };
    }

    this.isRunning = true;
    const startTime = new Date();
    let deletedCount = 0;
    const errors = [];

    try {
      console.log(
        `Starting cleanup of screenshots older than ${this.cleanupIntervalHours} hours...`
      );

      const imageFiles = await this.getImageFiles();
      console.log(`Found ${imageFiles.length} image files to check`);

      const deletePromises = imageFiles.map(async (filename) => {
        const filePath = path.join(this.uploadsDir, filename);

        try {
          // First try to parse date from filename
          const fileDate = this.parseFileDate(filename);
          let shouldDelete = false;

          if (fileDate) {
            // Use parsed date from filename
            const fileAge = Date.now() - fileDate.getTime();
            const hoursInMs = this.cleanupIntervalHours * 60 * 60 * 1000;
            shouldDelete = fileAge > hoursInMs;
          } else {
            // Fallback to file modification time
            shouldDelete = this.isFileOlderThan(
              filePath,
              this.cleanupIntervalHours
            );
          }

          if (shouldDelete) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`Deleted old screenshot: ${filename}`);
            return { filename, deleted: true };
          } else {
            return { filename, deleted: false };
          }
        } catch (error) {
          const errorMsg = `Failed to process ${filename}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          return { filename, deleted: false, error: errorMsg };
        }
      });

      const results = await Promise.all(deletePromises);
      const successfulDeletions = results.filter((r) => r.deleted).length;

      this.cleanupStats.totalDeleted += successfulDeletions;
      this.cleanupStats.lastRun = new Date();
      this.cleanupStats.errors = [...this.cleanupStats.errors, ...errors];

      const duration = Date.now() - startTime.getTime();
      console.log(
        `Cleanup completed in ${duration}ms. Deleted ${successfulDeletions} files.`
      );

      return {
        success: true,
        deletedCount: successfulDeletions,
        totalChecked: imageFiles.length,
        duration: duration,
        errors: errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Cleanup failed:", error);
      errors.push(`Cleanup failed: ${error.message}`);
      this.cleanupStats.errors = [...this.cleanupStats.errors, ...errors];

      return {
        success: false,
        error: error.message,
        deletedCount: 0,
        errors: errors,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the scheduled cleanup (runs every 12 hours)
   */
  startScheduledCleanup() {
    console.log("Starting scheduled cleanup service (every 12 hours)");

    // Run cleanup every 12 hours at minute 0
    cron.schedule("0 */12 * * *", async () => {
      console.log("Scheduled cleanup triggered");
      await this.cleanupOldScreenshots();
    });

    // Also run cleanup on startup after 1 minute
    setTimeout(async () => {
      console.log("Running initial cleanup on startup");
      await this.cleanupOldScreenshots();
    }, 60000);
  }

  /**
   * Stop the scheduled cleanup
   */
  stopScheduledCleanup() {
    cron.destroy();
    console.log("Scheduled cleanup service stopped");
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastCleanup: this.lastCleanup,
      cleanupIntervalHours: this.cleanupIntervalHours,
      stats: this.cleanupStats,
      nextScheduledRun: this.getNextScheduledRun(),
    };
  }

  /**
   * Get next scheduled run time
   */
  getNextScheduledRun() {
    const now = new Date();
    const nextRun = new Date(now);

    // Find next 12-hour interval (0:00, 12:00)
    const currentHour = now.getHours();
    if (currentHour < 12) {
      nextRun.setHours(12, 0, 0, 0);
    } else {
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
    }

    return nextRun.toISOString();
  }
}

module.exports = CleanupService;
