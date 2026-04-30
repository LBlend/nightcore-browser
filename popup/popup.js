const enabledEl   = document.getElementById('enabled');
const controlsEl  = document.getElementById('controls');
const speedBtns   = document.querySelectorAll('.speed-btn');
const bassEl      = document.getElementById('bass');
const bassValEl   = document.getElementById('bass-val');

let state = { enabled: false, speed: 1.25, bass: 6 };

function updateUI() {
  enabledEl.checked = state.enabled;
  controlsEl.classList.toggle('dimmed', !state.enabled);
  speedBtns.forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === state.speed);
  });
  bassEl.value = state.bass;
  bassValEl.textContent = `${state.bass} dB`;
}

async function pushState() {
  chrome.storage.local.set(state);

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    return;
  }
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'NIGHTCORE_STATE',
      enabled: state.enabled,
      speed: state.speed,
      bass: state.bass,
    });
  } catch {
    // Content script not yet loaded on this page — state is saved to storage
    // and will be applied when the page is next visited.
  }
}

// Load persisted state
chrome.storage.local.get(['enabled', 'speed', 'bass'], (data) => {
  state.enabled = data.enabled ?? false;
  state.speed   = data.speed   ?? 1.25;
  state.bass    = data.bass    ?? 6;
  updateUI();
});

enabledEl.addEventListener('change', () => {
  state.enabled = enabledEl.checked;
  updateUI();
  pushState();
});

speedBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    state.speed = parseFloat(btn.dataset.speed);
    updateUI();
    pushState();
  });
});

bassEl.addEventListener('input', () => {
  state.bass = parseInt(bassEl.value, 10);
  bassValEl.textContent = `${state.bass} dB`;
});

bassEl.addEventListener('change', () => {
  state.bass = parseInt(bassEl.value, 10);
  pushState();
});
