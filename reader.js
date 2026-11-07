(() => {
  const ID = "reader+";
  const existing = document.getElementById(ID);
  if (existing) return existing.__close();

  const article = new Readability(document.cloneNode(true)).parse();

  if (!article || !article.content) {
    const n = document.createElement("div");
    n.id = ID;
    n.textContent = "No article found.";
    n.style.cssText =
      "all:initial;position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
      "background:#151515;color:#8D8D93;font:13px -apple-system,system-ui,sans-serif;padding:8px 14px;cursor:pointer";
    n.__close = () => n.remove();
    n.onclick = n.__close;
    document.documentElement.appendChild(n);
    return;
  }

  // [min, max, step, unit, decimals]
  const RANGES = {
    size:  [14, 32, 1, "px", 0],
    lh:    [1.2, 2.4, 0.1, "", 1],
    ls:    [-0.02, 0.1, 0.01, "em", 2],
    ws:    [0, 0.5, 0.05, "em", 2],
    width: [24, 52, 2, "em", 0],
  };
  const DEFAULTS = { theme: "sepia", font: "serif", justify: false, size: 20, lh: 1.6, ls: 0, ws: 0, width: 34 };

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .root {
      min-height: 100vh; display: flow-root;
      background: var(--bg); color: var(--fg);
      font-family: var(--font); font-size: var(--size); line-height: var(--lh);
      letter-spacing: var(--ls); word-spacing: var(--ws);
      -webkit-font-smoothing: antialiased;
    }
    .sepia { --bg: #F8F1E3; --fg: #4F321C; --muted: #A08E78; --line: #E4D8C2; }
    .dark  { --bg: #151515; --fg: #8D8D93; --muted: #5E5E63; --line: #2A2A2C; }
    .serif { --font: "New York", ui-serif, Georgia, serif; }
    .sans  { --font: "SF Pro Text", -apple-system, system-ui, sans-serif; }
    .justify .body { text-align: justify; hyphens: auto; }

    article { max-width: var(--width); margin: 0 auto; padding: 72px 24px 120px; }
    .meta { font: 13px -apple-system, system-ui, sans-serif; letter-spacing: 0; color: var(--muted); margin: 0 0 8px; }
    h1 { font-size: 1.8em; line-height: 1.2; font-weight: 600; margin: 0 0 1.4em; }
    .body h1, .body h2, .body h3, .body h4 { line-height: 1.3; font-weight: 600; margin: 1.6em 0 .6em; text-align: left; }
    .body h1 { font-size: 1.4em; } .body h2 { font-size: 1.25em; } .body h3 { font-size: 1.1em; }
    p { margin: 0 0 1em; }
    a { color: inherit; text-decoration: underline; text-decoration-color: var(--muted); text-underline-offset: 2px; }
    img, video, figure, iframe, svg { max-width: 100%; height: auto; border-radius: 0; }
    figure { margin: 1.5em 0; }
    figcaption { font-size: .75em; color: var(--muted); margin-top: .5em; }
    blockquote { margin: 1.2em 0; padding-left: 1em; border-left: 2px solid var(--line); color: var(--muted); }
    pre, code { font: .8em ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0; word-spacing: 0; }
    pre { overflow-x: auto; padding: 1em; border: 1px solid var(--line); text-align: left; }
    table { border-collapse: collapse; max-width: 100%; display: block; overflow-x: auto; font-size: .85em; }
    td, th { border: 1px solid var(--line); padding: 4px 8px; }
    hr { border: 0; border-top: 1px solid var(--line); margin: 2em 0; }

    .aa { position: fixed; right: 16px; bottom: 16px; font: 12px -apple-system, system-ui, sans-serif; color: var(--muted); }
    .aa > span { display: block; padding: 4px 6px; cursor: default; user-select: none; text-align: right; font-size: 13px; }
    .panel { display: none; position: absolute; right: 0; bottom: 100%; padding: 8px 10px; background: var(--bg); border: 1px solid var(--line); white-space: nowrap; user-select: none; }
    .aa:hover .panel { display: block; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 24px; }
    .row b { font-weight: 400; }
    .ctl { display: flex; align-items: center; }
    .ctl i { font-style: normal; min-width: 3.4em; text-align: center; color: var(--fg); }
    button { all: unset; cursor: pointer; padding: 2px 6px; color: var(--muted); font: inherit; }
    button:hover, button.on { color: var(--fg); }
    .sep { height: 1px; background: var(--line); margin: 6px 0; }
  `;

  const stepper = (k, label) =>
    `<div class="row"><b>${label}</b><span class="ctl"><button data-k="${k}" data-d="-1">−</button><i data-v="${k}"></i><button data-k="${k}" data-d="1">+</button></span></div>`;
  const choice = (k, label, opts) =>
    `<div class="row"><b>${label}</b><span class="ctl">${opts.map(([v, t]) => `<button data-k="${k}" data-v="${v}">${t}</button>`).join("")}</span></div>`;

  const host = document.createElement("div");
  host.id = ID;
  host.style.cssText = "all:initial;display:block;position:relative;z-index:2147483647";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = CSS;

  const root = document.createElement("div");

  const meta = [article.siteName, article.byline].filter(Boolean).join(" · ");
  const art = document.createElement("article");
  art.innerHTML = `${meta ? `<p class="meta"></p>` : ""}<h1></h1><div class="body"></div>`;
  if (meta) art.querySelector(".meta").textContent = meta;
  art.querySelector("h1").textContent = article.title || document.title;
  art.querySelector(".body").innerHTML = article.content;

  const aa = document.createElement("div");
  aa.className = "aa";
  aa.innerHTML = `
    <div class="panel">
      ${choice("theme", "Theme", [["sepia", "Sepia"], ["dark", "Dark"]])}
      ${choice("font", "Font", [["serif", "Serif"], ["sans", "Sans"]])}
      ${choice("justify", "Align", [["false", "Left"], ["true", "Justify"]])}
      <div class="sep"></div>
      ${stepper("size", "Size")}
      ${stepper("lh", "Line height")}
      ${stepper("ls", "Letter spacing")}
      ${stepper("ws", "Word spacing")}
      ${stepper("width", "Width")}
      <div class="sep"></div>
      <div class="row"><b></b><button data-reset>Reset</button></div>
    </div>
    <span>Aa</span>`;

  let prefs = { ...DEFAULTS };
  const apply = () => {
    root.className = `root ${prefs.theme} ${prefs.font}${prefs.justify ? " justify" : ""}`;
    hide.textContent = HIDE + `html,html>*{background:${prefs.theme === "dark" ? "#151515" : "#F8F1E3"}!important}`;
    for (const [k, [, , , unit, dec]] of Object.entries(RANGES)) {
      root.style.setProperty(`--${k}`, prefs[k] + unit);
      aa.querySelector(`[data-v="${k}"]`).textContent = prefs[k].toFixed(dec);
    }
    aa.querySelectorAll("button[data-v]").forEach((b) => b.classList.toggle("on", String(prefs[b.dataset.k]) === b.dataset.v));
  };

  aa.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const k = b.dataset.k;
    if (b.hasAttribute("data-reset")) prefs = { ...DEFAULTS };
    else if (b.dataset.d) {
      const [min, max, step, , dec] = RANGES[k];
      prefs[k] = +Math.min(max, Math.max(min, prefs[k] + step * b.dataset.d)).toFixed(dec);
    } else prefs[k] = k === "justify" ? b.dataset.v === "true" : b.dataset.v;
    apply();
    chrome.storage.local.set({ prefs });
  });

  root.append(art, aa);
  shadow.append(style, root);

  const html = document.documentElement;
  const scrollY = window.scrollY;
  const hide = document.createElement("style");
  const HIDE = "html>body{display:none!important}html{overflow:auto!important;margin:0!important;padding:0!important}";
  const onKey = (e) => { if (e.key === "Escape") host.__close(); };
  host.__close = () => {
    host.remove();
    hide.remove();
    window.scrollTo(0, scrollY);
    document.removeEventListener("keydown", onKey, true);
  };

  chrome.storage.local.get("prefs", (r) => {
    const saved = (r && r.prefs) || {};
    for (const k in DEFAULTS) if (typeof saved[k] === typeof DEFAULTS[k]) prefs[k] = saved[k];
    if (!["sepia", "dark"].includes(prefs.theme)) prefs.theme = DEFAULTS.theme;
    apply();
    html.append(hide, host);
    window.scrollTo(0, 0);
    document.addEventListener("keydown", onKey, true);
  });
})();
