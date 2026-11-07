/* global NightcoreSettings */
(() => {
  'use strict';

  const BASS_FREQ = 150; // Hz, lowshelf corner frequency

  let state = { ...NightcoreSettings.DEFAULTS };

  // Elements whose speed/pitch we changed, so disabling only restores those and
  // leaves media the extension never touched alone.
  const modified = new WeakSet();
  // Elements we tried to route through Web Audio. An element can only ever be
  // captured once, so never try twice.
  const captureAttempted = new WeakSet();

  // One AudioContext and filter shared by every element in the frame. Browsers
  // limit how many AudioContexts a page can have, so one per element doesn't scale.
  let audioCtx = null;
  let bassFilter = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      bassFilter = audioCtx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = BASS_FREQ;
      bassFilter.gain.value = 0;
      bassFilter.connect(audioCtx.destination);
      // The context starts suspended until the page has had a user gesture.
      // Capture elements once it is actually running.
      audioCtx.addEventListener('statechange', () => {
        if (audioCtx.state === 'running') applyToAll();
      });
    }
    resumeAudio();
    return audioCtx;
  }

  function resumeAudio() {
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  }

  // Web Audio outputs silence for cross-origin media loaded without CORS, so
  // capturing it would mute the element instead of boosting it.
  function canCapture(el) {
    if (el.srcObject) return true;
    if (!el.currentSrc) return false; // nothing loaded yet; retried on 'play'
    let url;
    try {
      url = new URL(el.currentSrc, location.href);
    } catch {
      return false;
    }
    if (url.protocol === 'data:') return true;
    // blob: URLs report the origin of the document that created them
    return url.origin === location.origin || el.crossOrigin !== null;
  }

  function attachBass(el) {
    if (captureAttempted.has(el) || !canCapture(el)) return;
    const ctx = getAudioContext();
    // Capturing while the context is suspended would silence the element until
    // the user interacts with the page. Wait for 'statechange' instead.
    if (ctx.state !== 'running') return;
    captureAttempted.add(el);
    try {
      ctx.createMediaElementSource(el).connect(bassFilter);
    } catch (err) {
      // The page (or another extension) already captured this element
      console.warn('[Nightcore] Could not attach bass boost to element:', err.message);
    }
  }

  function updateBassGain() {
    if (!bassFilter) return;
    const gain = state.enabled ? state.bass : 0;
    // Ramp instead of jumping to avoid clicks while dragging the slider
    bassFilter.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.02);
  }

  function applyState(el) {
    if (!(el instanceof HTMLMediaElement)) return;

    if (state.enabled) {
      modified.add(el);
      // defaultPlaybackRate survives the element loading a new source, which
      // resets playbackRate (e.g. the next video in a playlist).
      if (el.defaultPlaybackRate !== state.speed) el.defaultPlaybackRate = state.speed;
      if (el.playbackRate !== state.speed) el.playbackRate = state.speed;
      // preservesPitch = false means pitch rises with speed (the nightcore effect)
      el.preservesPitch = false;
      if (state.bass > 0) attachBass(el);
    } else if (modified.has(el)) {
      modified.delete(el);
      el.defaultPlaybackRate = 1;
      el.playbackRate = 1;
      el.preservesPitch = true;
    }
  }

  function applyToAll() {
    document.querySelectorAll('video, audio').forEach(applyState);
    updateBassGain();
  }

  // 'loadstart' and 'play' don't bubble, but a capturing listener on the
  // document still sees them for every media element in it. That covers
  // elements added later (single-page apps) and elements switching source.
  for (const type of ['loadstart', 'play']) {
    document.addEventListener(type, (e) => {
      if (state.enabled) applyState(e.target);
    }, true);
  }

  // A user gesture is what allows a suspended AudioContext to start
  for (const type of ['pointerdown', 'keydown']) {
    document.addEventListener(type, resumeAudio, true);
  }

  chrome.storage.local.get(NightcoreSettings.KEYS, (data) => {
    state = NightcoreSettings.sanitize(data);
    applyToAll();
  });

  // The popup only writes to storage. Reacting to storage changes updates every
  // open tab and frame right away, not just the active tab.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const next = { ...state };
    for (const [key, { newValue }] of Object.entries(changes)) next[key] = newValue;
    state = NightcoreSettings.sanitize(next);
    applyToAll();
  });
})();
