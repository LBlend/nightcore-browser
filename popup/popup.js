/* global NightcoreSettings */
'use strict';

const enabledEl  = document.getElementById('enabled');
const controlsEl = document.getElementById('controls');
const speedBtns  = document.querySelectorAll('.speed-btn');
const bassEl     = document.getElementById('bass');
const bassValEl  = document.getElementById('bass-val');

let state = { ...NightcoreSettings.DEFAULTS };

function render() {
  enabledEl.checked = state.enabled;
  controlsEl.classList.toggle('dimmed', !state.enabled);
  speedBtns.forEach((btn) => {
    const active = Number(btn.dataset.speed) === state.speed;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.disabled = !state.enabled;
  });
  bassEl.value = state.bass;
  bassEl.disabled = !state.enabled;
  bassValEl.textContent = `${state.bass} dB`;
}

// Content scripts listen for storage changes, so saving is all that's needed
// to update every open tab.
function save(patch) {
  state = NightcoreSettings.sanitize({ ...state, ...patch });
  render();
  chrome.storage.local.set(state);
}

chrome.storage.local.get(NightcoreSettings.KEYS, (data) => {
  state = NightcoreSettings.sanitize(data);
  render();
});

enabledEl.addEventListener('change', () => {
  save({ enabled: enabledEl.checked });
});

speedBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    save({ speed: Number(btn.dataset.speed) });
  });
});

bassEl.addEventListener('input', () => {
  save({ bass: Number(bassEl.value) });
});

render();
