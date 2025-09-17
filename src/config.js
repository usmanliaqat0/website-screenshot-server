const DEVICE_PRESETS = Object.freeze({
  mobile: Object.freeze({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }),
  tablet: Object.freeze({
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }),
  laptop: Object.freeze({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  }),
  desktop: Object.freeze({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  }),
});

const VALID_DEVICES = Object.freeze(Object.keys(DEVICE_PRESETS));

module.exports = Object.freeze({
  DEVICE_PRESETS,
  VALID_DEVICES,
});
