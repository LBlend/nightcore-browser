# Nightcore Browser

Had claude make this for personal use. Might as well make it public

A browser extension for Chrome and Firefox that applies a nightcore effect to any audio or video on the page.

## Features

- 1.25× or 1.5× playback speed with natural pitch shift
- Adjustable bass boost (0–12 dB)
- Works on any `<audio>` or `<video>` element — YouTube, SoundCloud, direct files, embedded players, etc.
- Settings persist per-browser, apply to all open tabs immediately and are restored on every page load
- Handles dynamically injected media (single-page apps)

## Installation

Download this repo and make sure it's unzipped, or download the zip attached to the [latest release](https://github.com/LBlend/nightcore-browser/releases/latest).

### Chrome / Chromium / Edge

1. Go to `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select this folder

### Firefox

Requires Firefox 140 or newer.

1. Go to `about:debugging#/runtime/this-firefox` and click **Load Temporary Add-on...**
2. Select `manifest.json` from this folder
3. If nothing happens on a page, open `about:addons`, select the extension, and allow access to websites under **Permissions**

Temporary add-ons are removed when Firefox restarts. To install it permanently, the extension has to be signed through [addons.mozilla.org](https://addons.mozilla.org/developers/).

## Known limitations

- **Bass boost needs a user gesture:** browsers don't let audio processing start before you've interacted with the page. Speed and pitch apply right away; the bass boost kicks in after your first click or key press on the page.
- **Cross-origin media:** the browser outputs silence when audio from another origin is routed through Web Audio without CORS, so the bass boost is skipped for such media (speed and pitch still work). If a player switches an element that's already boosted to a cross-origin source, that element goes silent until the page is reloaded.
- **Already captured media:** a media element can only be connected to Web Audio once. If a site (or another extension) has already done so, the extension logs a warning and only applies speed and pitch to it.
- **Clipping:** a strong bass boost on loud tracks can clip. Lower the boost if you hear distortion.
- **Shadow DOM and detached media:** media elements inside shadow roots or never added to the page aren't detected.

## Privacy

The extension doesn't collect or share any data. See the [privacy policy](PRIVACY.md).

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
