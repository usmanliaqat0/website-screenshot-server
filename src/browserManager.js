const { chromium } = require("playwright");

const BROWSER_ARGS = Object.freeze([
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--disable-gpu",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
]);

const USER_AGENTS = Object.freeze({
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  desktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

class BrowserManager {
  constructor() {
    this.browser = null;
    this.isInitializing = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.browser?.isConnected()) return this.browser;

    if (this.isInitializing) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = this._launchBrowser();

    try {
      await this.initPromise;
      return this.browser;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  async _launchBrowser() {
    try {
      console.log("Launching Chromium browser...");
      this.browser = await chromium.launch({
        headless: true,
        args: BROWSER_ARGS,
      });

      console.log("Browser launched successfully");
      this.browser.on("disconnected", () => {
        console.log("Browser disconnected, clearing reference");
        this.browser = null;
      });
    } catch (error) {
      console.error("Failed to launch browser:", error);
      this.browser = null;
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  async getBrowser() {
    if (!this.browser?.isConnected()) {
      await this.initialize();
    }
    return this.browser;
  }

  async createContext(deviceConfig) {
    const browser = await this.getBrowser();

    const contextOptions = {
      viewport: {
        width: deviceConfig.width,
        height: deviceConfig.height,
      },
      deviceScaleFactor:
        deviceConfig.deviceScaleFactor || deviceConfig.scaleFactor || 1,
      isMobile: deviceConfig.isMobile,
      hasTouch: deviceConfig.hasTouch,
      userAgent: deviceConfig.isMobile
        ? USER_AGENTS.mobile
        : USER_AGENTS.desktop,
      reducedMotion: "reduce",
      colorScheme: "light",
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      acceptDownloads: false,
    };

    return browser.newContext(contextOptions);
  }

  async close() {
    if (this.browser) {
      console.log("Closing browser...");
      try {
        await this.browser.close();
      } catch (error) {
        console.error("Error closing browser:", error);
      }
      this.browser = null;
    }
  }
}

module.exports = new BrowserManager();
