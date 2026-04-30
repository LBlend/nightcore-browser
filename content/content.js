(() => {
  'use strict';

  const BASS_FREQ = 150;  // Hz — lowshelf center frequency

  let state = { enabled: false, speed: 1.25, bass: 6 };

  // WeakMap so GC can clean up detached elements
  const audioChains = new WeakMap();

  function buildChain(el) {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(el);
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = BASS_FREQ;
      bass.gain.value = 0;
      src.connect(bass);
      bass.connect(ctx.destination);
      audioChains.set(el, { ctx, bass });
      return { ctx, bass };
    } catch (err) {
      // Element may already be captured by another AudioContext
      console.warn('[Nightcore] Could not attach to element:', err.message);
      return null;
    }
  }

  function applyState(el) {
    if (!(el instanceof HTMLMediaElement)) return;

    if (state.enabled) {
      el.playbackRate = state.speed;
      // preservesPitch = false means pitch rises with speed (the nightcore effect)
      el.preservesPitch = false;
      el.mozPreservesPitch = false;

      const chain = audioChains.has(el) ? audioChains.get(el) : buildChain(el);
      if (chain) {
        chain.bass.gain.value = state.bass;
        chain.ctx.resume().catch(() => {});
      }
    } else {
      el.playbackRate = 1;
      el.preservesPitch = true;
      el.mozPreservesPitch = true;

      if (audioChains.has(el)) {
        audioChains.get(el).bass.gain.value = 0;
      }
    }
  }

  function applyToAll() {
    document.querySelectorAll('video, audio').forEach(applyState);
  }

  // Handle media elements that start playing after the extension is enabled
  document.addEventListener('play', (e) => {
    if (state.enabled) applyState(e.target);
  }, true);

  // Handle media elements injected into the DOM dynamically (e.g. YouTube player)
  const observer = new MutationObserver((mutations) => {
    if (!state.enabled) return;
    for (const mut of mutations) {
      for (const node of mut.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node instanceof HTMLMediaElement) applyState(node);
        node.querySelectorAll?.('video, audio').forEach(applyState);
      }
    }
  });

  function startObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  }

  // Load persisted state and apply on page load
  chrome.storage.local.get(['enabled', 'speed', 'bass'], (data) => {
    state.enabled = data.enabled ?? false;
    state.speed   = data.speed   ?? 1.25;
    state.bass    = data.bass    ?? 6;
    if (state.enabled) applyToAll();
  });

  // Receive state updates from the popup
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type !== 'NIGHTCORE_STATE') return;
    state.enabled = msg.enabled;
    state.speed   = msg.speed;
    state.bass    = msg.bass ?? state.bass;
    applyToAll();
    sendResponse({ ok: true });
    return true;
  });
})();
