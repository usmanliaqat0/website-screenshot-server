const path = require("path");
const fs = require("fs").promises;
const browserManager = require("./browserManager");
const { DEVICE_PRESETS } = require("./config");

class ScreenshotService {
  constructor(baseUrl = null, options = {}) {
    const parseMs = (val, fallback) => {
      const n = Number(val);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    const envFastMode = String(process.env.FAST_MODE || "").toLowerCase();
    this.fastMode = Boolean(
      options.fastMode ?? (envFastMode === "1" || envFastMode === "true")
    );

    const defaultPageTimeout = this.fastMode ? 15000 : 30000;
    this.timeout = parseMs(process.env.PAGE_TIMEOUT_MS, defaultPageTimeout);

    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.baseUrl = baseUrl;

    const baseWaits = {
      networkIdleTimeout: this.fastMode ? 1500 : 12000,
      animationTimeout: this.fastMode ? 1000 : 5000,
      lazyContentTimeout: this.fastMode ? 1500 : 12000,
      stabilityTimeout: this.fastMode ? 1000 : 8000,
      stabilityChecks: this.fastMode ? 1 : 2,
      maxRetries: this.fastMode ? 1 : 2,
      apiWaitTimeout: this.fastMode ? 1500 : 12000,
    };

    this.waitConfig = Object.freeze({
      networkIdleTimeout: parseMs(
        process.env.NETWORK_IDLE_TIMEOUT_MS,
        baseWaits.networkIdleTimeout
      ),
      animationTimeout: parseMs(
        process.env.ANIMATION_TIMEOUT_MS,
        baseWaits.animationTimeout
      ),
      lazyContentTimeout: parseMs(
        process.env.LAZY_CONTENT_TIMEOUT_MS,
        baseWaits.lazyContentTimeout
      ),
      stabilityTimeout: parseMs(
        process.env.STABILITY_TIMEOUT_MS,
        baseWaits.stabilityTimeout
      ),
      stabilityChecks: Number(
        process.env.STABILITY_CHECKS ?? baseWaits.stabilityChecks
      ),
      maxRetries: Number(process.env.MAX_RETRIES ?? baseWaits.maxRetries),
      apiWaitTimeout: parseMs(
        process.env.API_WAIT_TIMEOUT_MS,
        baseWaits.apiWaitTimeout
      ),
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

  generateFilename(device, section = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sectionSuffix = section
      ? `_${section.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "";
    return `${timestamp}_${device}${sectionSuffix}_${random}.png`;
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

  async captureSectionScreenshot(url, device, selector) {
    this.validateUrl(url);

    const deviceConfig = DEVICE_PRESETS[device];
    if (!deviceConfig) {
      throw new Error(`Unknown device: ${device}`);
    }

    let context, page;

    try {
      console.log(
        `Starting section screenshot capture for ${device}: ${url} (selector: ${selector})`
      );

      context = await browserManager.createContext(deviceConfig);
      page = await context.newPage();

      page.setDefaultTimeout(this.timeout);
      page.setDefaultNavigationTimeout(this.timeout);

      console.log(`Navigating to ${url}...`);
      await this.navigateAndWaitForCompleteWithRetry(page, url);

      console.log(`Triggering lazy loading for ${device}...`);
      await this.triggerLazyLoading(page);

      // Wait for the element to be present and visible
      console.log(`Waiting for element with selector: ${selector}`);
      await page.waitForSelector(selector, {
        visible: true,
        timeout: 10000,
      });

      // Get element bounding box
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found with selector: ${selector}`);
      }

      const boundingBox = await element.boundingBox();
      if (!boundingBox) {
        throw new Error(
          `Element is not visible or has no dimensions: ${selector}`
        );
      }

      console.log(`Element found at position: ${JSON.stringify(boundingBox)}`);

      const filename = this.generateFilename(device, selector);
      const filepath = path.join(this.uploadsDir, filename);

      console.log(`Capturing section screenshot for ${device}...`);

      // Capture screenshot of the specific element
      await element.screenshot({
        path: filepath,
        type: "png",
        animations: "disabled",
        optimizeForSpeed: true,
      });

      console.log(`Section screenshot saved: ${filename}`);

      const imageUrl = this.baseUrl
        ? `${this.baseUrl}/uploads/${filename}`
        : `/uploads/${filename}`;

      return {
        device,
        filename,
        url: imageUrl,
        viewport: { width: deviceConfig.width, height: deviceConfig.height },
        selector,
        elementBounds: {
          x: Math.round(boundingBox.x),
          y: Math.round(boundingBox.y),
          width: Math.round(boundingBox.width),
          height: Math.round(boundingBox.height),
        },
      };
    } catch (error) {
      console.error(`Section screenshot failed for ${device}:`, error.message);
      throw new Error(
        `Section screenshot capture failed for ${device}: ${error.message}`
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

    await page.goto(url, {
      waitUntil: this.fastMode ? "domcontentloaded" : "load",
      timeout: this.timeout,
    });

    await this.waitForInitialContent(page);

    try {
      console.log("Waiting for network idle...");
      await page.waitForLoadState("networkidle", {
        timeout: this.waitConfig.networkIdleTimeout,
      });
      console.log("Network idle achieved");
    } catch (error) {
      console.log("Network idle timeout - continuing");
    }

    await this.waitForFonts(page);

    await this.waitForAllImages(page);

    await Promise.all([
      this.waitForActiveApiRequests(page),
      this.waitForDynamicContent(page),
      this.waitForAnimationsComplete(page),
    ]);

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

  async captureMultipleSections(url, devices, selector) {
    await this.ensureUploadsDirectory();

    console.log(
      `Capturing section screenshots for ${
        devices.length
      } devices: ${devices.join(", ")} (selector: ${selector})`
    );

    const screenshotPromises = devices.map((device) =>
      this.captureSectionScreenshot(url, device, selector).catch((error) => ({
        device,
        error: error.message,
        success: false,
      }))
    );

    const results = await Promise.all(screenshotPromises);
    const successful = results.filter((result) => !result.error);
    const failed = results.filter((result) => result.error);

    console.log(
      `Section screenshots completed: ${successful.length} successful, ${failed.length} failed`
    );

    return {
      url,
      selector,
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

  async waitForFonts(page) {
    try {
      console.log("Waiting for fonts to be ready...");
      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      });
      console.log("Fonts ready");
    } catch (error) {
      console.log("Font readiness timeout - proceeding");
    }
  }

  async waitForAllImages(page) {
    try {
      console.log("Ensuring all images are loaded (time-limited)...");
      const deadlineMs =
        Date.now() + (this.waitConfig.lazyContentTimeout || 1500);

      await page.evaluate(async (deadline) => {
        const timeLeft = () => Math.max(0, deadline - Date.now());

        const withTimeout = (p, ms) =>
          new Promise((resolve) => {
            let settled = false;
            const to = setTimeout(() => {
              if (!settled) {
                settled = true;
                resolve(true);
              }
            }, ms);
            p.finally(() => {
              if (!settled) {
                settled = true;
                clearTimeout(to);
                resolve(true);
              }
            });
          });

        const loadImage = (img) =>
          new Promise((resolve) => {
            try {
              if (img.complete && img.naturalWidth > 0) return resolve(true);
              const done = () => resolve(true);
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            } catch {
              resolve(true);
            }
          });

        const images = Array.from(document.images || []);
        const promises = images.map((img) =>
          withTimeout(loadImage(img), Math.max(50, timeLeft()))
        );
        await Promise.race([
          Promise.all(promises),
          new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, timeLeft()))
          ),
        ]);
      }, deadlineMs);
      console.log("Image load wait done (not blocking)");
    } catch (error) {
      console.log("Image load wait error - proceeding");
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
      const maxAttempts = 8;

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

        await page.waitForTimeout(500);
        attempts++;
      }

      console.log(`API monitoring completed after ${attempts} attempts`);
      await page.waitForTimeout(500);

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
        { timeout: 15000 }
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
          return timeSinceLastMutation > 800;
        },
        { timeout: 10000 }
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
        await page.waitForTimeout(300);
      }
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
      await page.evaluate(() => {
        const setEager = (img) => {
          try {
            img.loading = "eager";
            if (img.hasAttribute("data-src") && !img.src) {
              img.src = img.getAttribute("data-src");
            }
            if (img.hasAttribute("data-srcset") && !img.srcset) {
              img.srcset = img.getAttribute("data-srcset");
            }
          } catch {}
        };

        document.querySelectorAll("img").forEach(setEager);
        document.querySelectorAll("picture source").forEach((s) => {
          if (s.hasAttribute("data-srcset") && !s.srcset) {
            s.srcset = s.getAttribute("data-srcset");
          }
        });

        const OriginalIO = window.IntersectionObserver;
        if (OriginalIO && !window.__ioPatched) {
          window.__ioPatched = true;
          window.IntersectionObserver = function (cb, options) {
            const fake = new OriginalIO(cb, options);
            setTimeout(() => {
              try {
                cb(
                  [
                    {
                      isIntersecting: true,
                      intersectionRatio: 1,
                    },
                  ],
                  fake
                );
              } catch {}
            }, 0);
            return fake;
          };
        }
      });

      const budgetMs = this.fastMode ? 1500 : 5000;
      const deadline = Date.now() + budgetMs;

      let iterations = 0;
      while (Date.now() < deadline && iterations < 40) {
        const { y, max, vh } = await page.evaluate(() => ({
          y: window.scrollY || window.pageYOffset || 0,
          max:
            Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight
            ) - window.innerHeight,
          vh: window.innerHeight,
        }));

        const atBottom = y >= max - 2;
        if (atBottom) break;

        const next = Math.min(y + Math.floor(vh * 0.9), max);
        await page.evaluate((pos) => {
          window.scrollTo(0, pos);
          window.dispatchEvent(new Event("scroll"));
        }, next);
        await page.waitForTimeout(this.fastMode ? 120 : 200);

        iterations++;
      }

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        window.dispatchEvent(new Event("scroll"));
      });
      await page.waitForTimeout(this.fastMode ? 150 : 300);

      await page.evaluate(() => {
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("resize"));
      });

      await page.waitForTimeout(this.fastMode ? 250 : 600);
      await this.waitForAllImages(page);

      console.log("Optimized lazy loading complete");
    } catch (error) {
      console.log("Lazy loading trigger failed - proceeding");
    }
  }
}

module.exports = ScreenshotService;
