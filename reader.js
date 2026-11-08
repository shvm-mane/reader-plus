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

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    ::selection { background: Highlight; color: HighlightText; }
    .root {
      min-height: 100vh; display: flow-root;
      background: var(--bg); color: var(--fg);
      font-family: var(--font); font-size: var(--size); line-height: var(--lh);
      letter-spacing: var(--ls); word-spacing: var(--ws);
      -webkit-font-smoothing: antialiased;
    }
    .sepia { --bg: #F8F1E3; --fg: #4F321C; --muted: #A08E78; --line: #E4D8C2; --link: #3E6189; --visited: #6E4E86; }
    .dark  { --bg: #151515; --fg: #8D8D93; --muted: #5E5E63; --line: #2A2A2C; --link: #7F98BD; --visited: #9C88B8; }
    .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 { color: #C7C7CC; }
    .serif { --font: "New York", ui-serif, Georgia, serif; }
    .sans  { --font: "SF Pro Text", -apple-system, system-ui, sans-serif; }
    .justify .body { text-align: justify; hyphens: auto; }

    article { max-width: var(--width); margin: 0 auto; padding: 72px 24px 120px; }
    .meta { font: 13px -apple-system, system-ui, sans-serif; letter-spacing: 0; color: var(--muted); margin: 0 0 8px; }
    h1 { font-size: 1.8em; line-height: 1.2; font-weight: 600; margin: 0 0 .6em; }
    .dek { font-size: 1.1em; color: var(--muted); margin: 0 0 1.4em; }
    .body :is(h1, h2, h3, h4, h5, h6), .body :is(h1, h2, h3, h4, h5, h6) * { font-weight: 600; }
    .body h1, .body h2, .body h3, .body h4 { line-height: 1.3; margin: 1.6em 0 .6em; text-align: left; }
    .body h1 { font-size: 1.4em; } .body h2 { font-size: 1.25em; } .body h3 { font-size: 1.1em; }
    p { margin: 0 0 1em; }
    a { color: var(--link); text-decoration: underline; text-decoration-color: currentColor; text-underline-offset: 2px; }
    a:visited { color: var(--visited); }
    img, video, figure, iframe, svg { max-width: 100%; height: auto; border-radius: 0; }
    figure { margin: 1.5em 0; }
    figcaption { font-size: .75em; color: var(--muted); margin-top: .5em; }
    blockquote { margin: 1.2em 0; padding-left: 1em; border-left: 2px solid var(--line); color: var(--muted); }
    pre, code { font: .8em ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0; word-spacing: 0; }
    pre { overflow-x: auto; padding: 1em; border: 1px solid var(--line); text-align: left; }
    table { border-collapse: collapse; max-width: 100%; display: block; overflow-x: auto; font-size: .85em; }
    td, th { border: 1px solid var(--line); padding: 4px 8px; }
    hr { border: 0; border-top: 1px solid var(--line); margin: 2em 0; }

    .toc { position: fixed; left: 16px; bottom: 16px; font: 12px/1.4 -apple-system, system-ui, sans-serif; letter-spacing: 0; word-spacing: 0; color: var(--muted); }
    .toc > b { display: block; padding: 4px 6px; font: 13px -apple-system, system-ui, sans-serif; cursor: default; user-select: none; }
    .toc > ul { display: none; position: absolute; left: 0; bottom: 100%; width: 240px; max-height: calc(100vh - 80px); overflow-y: auto; padding: 8px 10px; background: var(--bg); border: 1px solid var(--line); }
    .toc:hover > ul { display: block; }
    /* rows are 24px tall; chevron box is 12px wide, so its centre is x=6, y=12 */
    .toc ul { list-style: none; margin: 0; padding: 0; }
    .toc > ul { padding: 8px 10px; }
    .toc > ul > li + li { margin-top: 8px; }
    .toc span { display: block; padding: 4px 0; line-height: 16px; cursor: pointer; }
    .toc span:hover { color: var(--fg); }
    .toc li > span { padding-left: 12px; }
    .toc summary { list-style: none; display: flex; cursor: pointer; }
    .toc summary::-webkit-details-marker { display: none; }
    .toc summary::before { content: "›"; flex: none; width: 12px; height: 24px; line-height: 24px; text-align: center; }
    .toc details[open] > summary::before { transform: rotate(90deg); }
    /* tree lines: trunk starts under the parent's chevron centre, ├── / └── per child */
    .toc details > ul { margin-left: 6px; padding-left: 16px; cursor: pointer; }
    .toc details > ul > li { position: relative; }
    .toc details > ul > li::before, .toc details > ul > li::after { content: ""; position: absolute; left: -16px; border: 0 solid var(--muted); border-radius: 0; pointer-events: none; }
    .toc details > ul > li::before { top: 0; bottom: 0; border-left-width: 1px; }
    .toc details > ul > li:last-child::before { bottom: auto; height: 12px; }
    .toc details > ul > li::after { top: 12px; width: 14px; border-top-width: 1px; }
    .toc details > ul > li:not(:has(details))::after { width: 22px; }
    .toc details > ul:hover > li::before, .toc details > ul:hover > li::after { border-color: var(--fg); }
    .aa { position: fixed; right: 16px; bottom: 16px; font: 12px -apple-system, system-ui, sans-serif; color: var(--muted); }
    .aa > span { display: block; padding: 4px 6px; cursor: default; user-select: none; text-align: right; font-size: 13px; }
    .panel { display: none; position: absolute; right: 0; bottom: 100%; padding: 8px 10px; background: var(--bg); border: 1px solid var(--line); white-space: nowrap; user-select: none; }
    .aa:hover .panel { display: block; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 24px; }
    .row b { font-weight: 400; }
    .ctl { display: grid; grid-template-columns: repeat(3, 1fr); width: 9.6em; text-align: center; }
    .pair { grid-template-columns: 1fr 1fr; }
    .ctl i { font-style: normal; color: var(--fg); }
    button { all: unset; cursor: pointer; padding: 2px 6px; color: var(--muted); font: inherit; }
    button:hover, button.on { color: var(--fg); }
    .sep { height: 1px; background: var(--line); margin: 6px 0; }
  `;

  const stepper = (k, label) =>
    `<div class="row"><b>${label}</b><span class="ctl"><button data-k="${k}" data-d="-1">−</button><i data-v="${k}"></i><button data-k="${k}" data-d="1">+</button></span></div>`;
  const choice = (k, label, opts) =>
    `<div class="row"><b>${label}</b><span class="ctl pair">${opts.map(([v, t]) => `<button data-k="${k}" data-v="${v}">${t}</button>`).join("")}</span></div>`;

  const host = document.createElement("div");
  host.id = ID;
  host.style.cssText = "all:initial;display:block;position:relative;z-index:2147483647";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = STYLE;

  const root = document.createElement("div");

  const meta = [article.siteName, article.byline].filter(Boolean).join(" · ");
  const art = document.createElement("article");
  art.innerHTML = `${meta ? `<p class="meta"></p>` : ""}<h1></h1><p class="dek"></p><div class="body"></div>`;
  if (meta) art.querySelector(".meta").textContent = meta;
  art.querySelector("h1").textContent = article.title || document.title;
  const body = art.querySelector(".body");
  body.innerHTML = article.content;
  // standfirst + lead figure usually sit outside the article body Readability picks
  const dek = (article.excerpt || "").trim();
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (dek && !norm(body.textContent).includes(norm(dek).slice(0, 40))) art.querySelector(".dek").textContent = dek;
  else art.querySelector(".dek").remove();
  const leadImg = document.querySelector("main figure img, article figure img");
  if (leadImg && !body.querySelector("img")) {
    const fig = document.createElement("figure");
    const img = document.createElement("img");
    img.src = leadImg.currentSrc || leadImg.src;
    img.alt = leadImg.alt;
    fig.append(img);
    const cap = leadImg.closest("figure").querySelector("figcaption");
    if (cap) fig.append(Object.assign(document.createElement("figcaption"), { textContent: cap.textContent.trim() }));
    body.prepend(fig);
  }

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
    } else prefs[k] = typeof DEFAULTS[k] === "boolean" ? b.dataset.v === "true" : b.dataset.v;
    apply();
    chrome.storage.local.set({ prefs });
  });

  // outline: nested tree of the article's headings
  const toc = document.createElement("nav");
  toc.className = "toc";
  const tree = [], stack = [{ lvl: 0, kids: tree }];
  body.querySelectorAll("h1, h2, h3, h4").forEach((h) => {
    if (!h.textContent.trim()) return;
    const n = { h, lvl: +h.tagName[1], kids: [] };
    while (stack.at(-1).lvl >= n.lvl) stack.pop();
    stack.at(-1).kids.push(n);
    stack.push(n);
  });
  const build = (nodes) => {
    const ul = document.createElement("ul");
    for (const n of nodes) {
      const li = document.createElement("li");
      const t = document.createElement("span");
      t.textContent = n.h.textContent.trim();
      t.onclick = (e) => { e.preventDefault(); n.h.scrollIntoView(); };
      if (n.kids.length) {
        const d = document.createElement("details");
        const sm = document.createElement("summary");
        sm.append(t);
        const kids = build(n.kids);
        kids.onclick = (e) => { if (e.target === kids) d.open = false; }; // click the line to collapse
        d.append(sm, kids);
        li.append(d);
      } else li.append(t);
      ul.append(li);
    }
    return ul;
  };
  if (tree.length) toc.append(Object.assign(document.createElement("b"), { textContent: "Contents" }), build(tree));

  root.append(toc, art, aa);
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
