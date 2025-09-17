const path = require("path");
const fs = require("fs").promises;
const browserManager = require("./browserManager");
const { DEVICE_PRESETS } = require("./config");

class ScreenshotService {
  constructor(baseUrl = null) {
    this.timeout = 60000; // Reduced from 300s to 60s
    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.baseUrl = baseUrl;
    this.waitConfig = Object.freeze({
      networkIdleTimeout: 8000, // Reduced from 15s
      animationTimeout: 5000, // Reduced from 10s
      lazyContentTimeout: 8000, // Reduced from 15s
      stabilityTimeout: 5000, // Reduced from 10s
      stabilityChecks: 2, // Reduced from 3
      maxRetries: 2, // Reduced from 3
      apiWaitTimeout: 10000, // Reduced from 20s
    });
  }

  async ensureUploadsDirectory() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      console.log(`Creating uploads directory: ${this.uploadsDir}`);
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  validateUrl(url) {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("URL must use HTTP or HTTPS protocol");
    }
  }

  generateFilename(device) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${device}_${random}.png`;
  }

  async captureScreenshot(url, device) {
    this.validateUrl(url);

    const deviceConfig = DEVICE_PRESETS[device];
    if (!deviceConfig) {
      throw new Error(`Unknown device: ${device}`);
    }

    let context, page;

    try {
      console.log(`Starting screenshot capture for ${device}: ${url}`);

      context = await browserManager.createContext(deviceConfig);
      page = await context.newPage();

      page.setDefaultTimeout(this.timeout);
      page.setDefaultNavigationTimeout(this.timeout);

      console.log(`Navigating to ${url}...`);
      await this.navigateAndWaitForCompleteWithRetry(page, url);

      console.log(`Triggering lazy loading for ${device}...`);
      await this.triggerLazyLoading(page);

      const filename = this.generateFilename(device);
      const filepath = path.join(this.uploadsDir, filename);

      console.log(`Capturing screenshot for ${device}...`);

      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: "png",
        animations: "disabled",
        optimizeForSpeed: true,
      });

      console.log(`Screenshot saved: ${filename}`);

      const imageUrl = this.baseUrl
        ? `${this.baseUrl}/uploads/${filename}`
        : `/uploads/${filename}`;

      return {
        device,
        filename,
        url: imageUrl,
        viewport: { width: deviceConfig.width, height: deviceConfig.height },
      };
    } catch (error) {
      console.error(`Screenshot failed for ${device}:`, error.message);
      throw new Error(
        `Screenshot capture failed for ${device}: ${error.message}`
      );
    } finally {
      await Promise.allSettled([page?.close(), context?.close()]);
    }
  }

  async navigateAndWaitForCompleteWithRetry(page, url) {
    let lastError;

    for (let attempt = 1; attempt <= this.waitConfig.maxRetries; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/${this.waitConfig.maxRetries} for ${url}`
        );
        await this.navigateAndWaitForComplete(page, url);
        return;
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed: ${error.message}`);

        if (attempt < this.waitConfig.maxRetries) {
          console.log(`Retrying in 2 seconds...`);
          await page.waitForTimeout(2000);
        }
      }
    }

    throw new Error(
      `Failed after ${this.waitConfig.maxRetries} attempts: ${lastError.message}`
    );
  }

  async navigateAndWaitForComplete(page, url) {
    console.log("Starting optimized page navigation and waiting...");

    // Navigate and wait for basic load
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: this.timeout,
    });

    // Quick initial content check
    await this.waitForInitialContent(page);

    // Network idle with shorter timeout
    try {
      console.log("Waiting for network idle...");
      await page.waitForLoadState("networkidle", {
        timeout: this.waitConfig.networkIdleTimeout,
      });
      console.log("Network idle achieved");
    } catch (error) {
      console.log("Network idle timeout - continuing");
    }

    // Run parallel optimizations
    await Promise.all([
      this.waitForActiveApiRequests(page),
      this.waitForDynamicContent(page),
      this.waitForAnimationsComplete(page),
    ]);

    // Final stability check (simplified)
    await this.waitForPageStability(page);

    console.log("Optimized page loading complete");
  }
  async captureMultiple(url, devices) {
    await this.ensureUploadsDirectory();

    console.log(
      `Capturing screenshots for ${devices.length} devices: ${devices.join(
        ", "
      )}`
    );

    const screenshotPromises = devices.map((device) =>
      this.captureScreenshot(url, device).catch((error) => ({
        device,
        error: error.message,
        success: false,
      }))
    );

    const results = await Promise.all(screenshotPromises);
    const successful = results.filter((result) => !result.error);
    const failed = results.filter((result) => result.error);

    console.log(
      `Screenshots completed: ${successful.length} successful, ${failed.length} failed`
    );

    return {
      url,
      screenshots: successful,
      errors: failed,
      total: devices.length,
      successful: successful.length,
      timestamp: new Date().toISOString(),
    };
  }

  async waitForAnimationsComplete(page) {
    try {
      await page.waitForFunction(
        () => {
          const animations = document.getAnimations();
          const runningAnimations = animations.filter(
            (anim) => anim.playState === "running"
          );
          return runningAnimations.length === 0;
        },
        { timeout: this.waitConfig.animationTimeout }
      );
      console.log("Animations completed");
    } catch (error) {
      console.log("Animation timeout - proceeding");
    }
  }

  async waitForActiveApiRequests(page) {
    try {
      console.log("Waiting for active API requests to complete...");

      await page.evaluate(() => {
        if (window.__requestsPatched) return;

        window.__pendingRequests = 0;
        window.__requestsPatched = true;
        window.__originalFetch = window.fetch;
        window.__originalXHR = window.XMLHttpRequest;

        window.fetch = function (...args) {
          const url = args[0];
          if (
            typeof url === "string" &&
            (url.includes(".css") ||
              url.includes(".js") ||
              url.includes(".woff"))
          ) {
            return window.__originalFetch(...args);
          }

          window.__pendingRequests++;
          console.log(
            `Fetch started: ${url}, pending: ${window.__pendingRequests}`
          );

          return window.__originalFetch(...args).finally(() => {
            window.__pendingRequests = Math.max(
              0,
              window.__pendingRequests - 1
            );
            console.log(
              `Fetch completed: ${url}, pending: ${window.__pendingRequests}`
            );
          });
        };

        const OriginalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
          const xhr = new OriginalXHR();
          const originalSend = xhr.send;

          xhr.send = function (...args) {
            if (
              this.responseType === "document" ||
              (this._url && this._url.match(/\.(css|js|woff|woff2)$/))
            ) {
              return originalSend.apply(this, args);
            }

            window.__pendingRequests++;
            console.log(`XHR started, pending: ${window.__pendingRequests}`);

            const cleanup = () => {
              window.__pendingRequests = Math.max(
                0,
                window.__pendingRequests - 1
              );
              console.log(
                `XHR completed, pending: ${window.__pendingRequests}`
              );
            };

            xhr.addEventListener("load", cleanup);
            xhr.addEventListener("error", cleanup);
            xhr.addEventListener("abort", cleanup);
            xhr.addEventListener("timeout", cleanup);

            return originalSend.apply(this, args);
          };

          const originalOpen = xhr.open;
          xhr.open = function (method, url, ...args) {
            xhr._url = url;
            return originalOpen.apply(this, [method, url, ...args]);
          };

          return xhr;
        };

        if (window.jQuery && window.jQuery.ajaxSetup) {
          window.jQuery.ajaxSetup({
            beforeSend: function () {
              window.__pendingRequests++;
              console.log(
                `jQuery AJAX started, pending: ${window.__pendingRequests}`
              );
            },
            complete: function () {
              window.__pendingRequests = Math.max(
                0,
                window.__pendingRequests - 1
              );
              console.log(
                `jQuery AJAX completed, pending: ${window.__pendingRequests}`
              );
            },
          });
        }
      });

      let attempts = 0;
      const maxAttempts = 8; // Further reduced from 15

      console.log("Monitoring API requests and loading states...");
      while (attempts < maxAttempts) {
        const isComplete = await page.evaluate(() => {
          const pendingRequests = window.__pendingRequests || 0;
          const hasLoadingIndicators = document.querySelector(
            '.loading, .spinner, [data-loading="true"], .loader, [aria-busy="true"]'
          );

          return pendingRequests === 0 && !hasLoadingIndicators;
        });

        if (isComplete) {
          break;
        }

        await page.waitForTimeout(500); // Reduced from 1000ms
        attempts++;
      }

      console.log(`API monitoring completed after ${attempts} attempts`);
      await page.waitForTimeout(500); // Reduced from 1000ms

      console.log("All API requests completed");
    } catch (error) {
      console.log("API request timeout - proceeding anyway");
    }
  }

  async waitForInitialContent(page) {
    try {
      console.log("Waiting for initial content...");
      await page.waitForFunction(
        () => {
          const body = document.body;
          return body && body.children.length > 0;
        },
        { timeout: 15000 } // Reduced from 30000ms
      );
      console.log("Initial content loaded");
    } catch (error) {
      console.log("Initial content timeout - proceeding");
    }
  }

  async waitForDynamicContent(page) {
    try {
      console.log("Quick dynamic content check...");

      await page.evaluate(() => {
        window.__contentObserver = new MutationObserver(() => {
          window.__lastMutation = Date.now();
        });

        window.__contentObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });

        window.__lastMutation = Date.now();
      });

      await page.waitForFunction(
        () => {
          const now = Date.now();
          const timeSinceLastMutation = now - (window.__lastMutation || now);
          return timeSinceLastMutation > 800; // Reduced from 1500ms
        },
        { timeout: 10000 } // Reduced from 20000ms
      );

      await page.evaluate(() => {
        if (window.__contentObserver) {
          window.__contentObserver.disconnect();
        }
      });

      console.log("Dynamic content stabilized");
    } catch (error) {
      console.log("Dynamic content timeout - proceeding");
    }
  }

  async waitForPageStability(page) {
    try {
      let previousHeight = 0;
      let stableCount = 0;
      const requiredStableCount = this.waitConfig.stabilityChecks;

      console.log("Quick stability check...");
      for (let i = 0; i < 4; i++) {
        // Further reduced from 8
        const height = await page.evaluate(() =>
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          )
        );

        if (height === previousHeight) {
          stableCount++;
          if (stableCount >= requiredStableCount) {
            console.log("Page height stabilized");
            break;
          }
        } else {
          stableCount = 0;
        }

        previousHeight = height;
        await page.waitForTimeout(300); // Reduced from 500ms
      }

      // Quick final check for loading indicators
      await page.waitForFunction(
        () =>
          document.readyState === "complete" &&
          !document.querySelector('.loading, .spinner, [data-loading="true"]'),
        { timeout: this.waitConfig.stabilityTimeout }
      );

      console.log("Page stability confirmed");
    } catch (error) {
      console.log("Stability timeout - proceeding");
    }
  }

  async triggerLazyLoading(page) {
    try {
      console.log("Triggering optimized lazy loading...");

      // Get page dimensions
      const { pageHeight, viewportHeight } = await page.evaluate(() => ({
        pageHeight: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        ),
        viewportHeight: window.innerHeight,
      }));

      // Reduced scroll steps for efficiency
      const scrollSteps = Math.min(Math.ceil(pageHeight / viewportHeight), 5);

      // Quick scroll with reduced delays
      for (let i = 0; i <= scrollSteps; i++) {
        const scrollPosition = (i / scrollSteps) * pageHeight;
        await page.evaluate((pos) => {
          window.scrollTo(0, pos);
          window.dispatchEvent(new Event("scroll"));
        }, scrollPosition);

        await page.waitForTimeout(200); // Reduced from 500ms
      }

      // Return to top quickly
      await page.evaluate(() => window.scrollTo(0, 0));

      // Trigger lazy images more efficiently
      await page.evaluate(() => {
        const lazyImages = document.querySelectorAll(
          'img[data-src], img[loading="lazy"]'
        );
        lazyImages.forEach((img) => {
          if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
          }
        });

        // Dispatch events
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("resize"));
      });

      await page.waitForTimeout(800); // Reduced from 2000ms

      console.log("Optimized lazy loading complete");
    } catch (error) {
      console.log("Lazy loading trigger failed - proceeding");
    }
  }
}

module.exports = ScreenshotService;
