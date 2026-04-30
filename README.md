# Nightcore Browser

Had claude make this for personal use. Might as well make it public

A browser extension for Chrome and Firefox that applies a nightcore effect to any audio or video on the page.

## Features

- 1.25× or 1.5× playback speed with natural pitch shift
- Works on any `<audio>` or `<video>` element — YouTube, SoundCloud, direct files, etc.
- Settings persist per-browser and are restored on every page load
- Handles dynamically injected media (single-page apps)

## Installation

### Firefox

1. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**
2. Select `manifest.json` from this folder

### Chrome / Chromium / Edge

1. Go to `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select this folder

## Known limitations

- **Cross-origin iframes:** content scripts only run in the top frame by default. Audio inside a sandboxed iframe on a different origin won't be affected.
- **AudioContext capture:** each media element can only be captured by one `AudioContext`. If a site has already done so internally, the extension logs a warning and skips that element.
- **YouTube autoplay policy:** the AudioContext is created on first use and resumed immediately. If the browser blocks it before a user gesture, disable and re-enable the extension after interacting with the page.
