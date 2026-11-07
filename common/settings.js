// Settings shared by the popup and the content script.
// eslint-disable-next-line no-unused-vars
const NightcoreSettings = (() => {
  'use strict';

  const SPEEDS = Object.freeze([1.25, 1.5]);
  const MAX_BASS = 12; // dB
  const DEFAULTS = Object.freeze({ enabled: false, speed: 1.25, bass: 6 });

  // Storage can contain anything (older versions, manual edits), so never trust it.
  function sanitize(data) {
    const bass = data?.bass;
    return {
      enabled: data?.enabled === true,
      speed: SPEEDS.includes(data?.speed) ? data.speed : DEFAULTS.speed,
      bass: Number.isInteger(bass) && bass >= 0 && bass <= MAX_BASS ? bass : DEFAULTS.bass,
    };
  }

  return Object.freeze({
    SPEEDS,
    MAX_BASS,
    DEFAULTS,
    KEYS: Object.freeze(Object.keys(DEFAULTS)),
    sanitize,
  });
})();
