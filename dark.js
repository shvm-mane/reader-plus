// Per-site dark mode, toggled with the "dark" command (background.js stores hostnames).
// invert + hue-rotate(180deg) flips light/dark but keeps hues (HN orange stays the same orange).
// A darken-blended overlay then lifts pure black to the reader's #151515 without dimming colours.
// Media is flipped back so photos and videos look normal.
(() => {
  const host = location.hostname;
  const style = document.createElement("style");
  style.textContent = `
    :where(html) { background-color: #fff; }
    html { filter: invert(1) hue-rotate(180deg) !important; }
    html::after { content: ""; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
      background: #EAEAEA; mix-blend-mode: darken; }
    img, video, canvas, iframe, embed, object, svg image, [style*="background-image"], #reader\\+ {
      filter: invert(1) hue-rotate(180deg) !important; }`;
  const set = (on) => (on ? document.documentElement.append(style) : style.remove());
  chrome.storage.local.get("dark", (r) => set(r.dark && r.dark[host]));
  chrome.storage.onChanged.addListener((c) => c.dark && set(c.dark.newValue && c.dark.newValue[host]));
})();
