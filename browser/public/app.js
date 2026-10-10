/*global BareMux, __uv$config*/
const PREFIX = location.origin + __uv$config.prefix;
const SEARCH = "https://duckduckgo.com/?q=";
const STORE_KEY = "sidebar-browser:tabs";

const $ = (id) => document.getElementById(id);
const tabsEl = $("tabs");
const framesEl = $("frames");
const urlInput = $("url");
const statusEl = $("status");

let tabs = [];
let activeId = null;
let nextId = 1;
let ready = false;

// ---- URL helpers ---------------------------------------------------------

function toUrl(input) {
  const text = input.trim();
  if (!text) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return text;
  // "example.com", "localhost:3000", "example.com/path" but not "two words"
  if (!/\s/.test(text) && /^[^/]+\.[^/]+|^localhost(:\d+)?(\/|$)/i.test(text)) return "https://" + text;
  return SEARCH + encodeURIComponent(text);
}

function proxify(url) {
  return PREFIX + __uv$config.encodeUrl(url);
}

// Proxied pages report addresses under /service/; turn them back into real ones.
function unproxify(url) {
  if (url && url.startsWith(PREFIX)) {
    try {
      return __uv$config.decodeUrl(url.slice(PREFIX.length));
    } catch {
      return url;
    }
  }
  return url;
}

// ---- Proxy setup ---------------------------------------------------------

async function setupProxy() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are unavailable. Open this over https:// or http://localhost.");
  }
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  const conn = new BareMux.BareMuxConnection("/baremux/worker.js");
  const wisp = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
  await conn.setTransport("/epoxy/index.mjs", [{ wisp }]);
}

// ---- Tabs ----------------------------------------------------------------

function createTab(url, { activate = true } = {}) {
  const tab = { id: nextId++, url: url || "", title: url || "New Tab", favicon: "", loading: false, frame: null };
  tabs.push(tab);
  if (activate) activateTab(tab.id);
  else render();
  save();
  return tab;
}

function getTab(id) {
  return tabs.find((t) => t.id === id);
}

function activeTab() {
  return getTab(activeId);
}

function ensureFrame(tab) {
  if (tab.frame) return tab.frame;
  const frame = document.createElement("iframe");
  frame.setAttribute("allow", "fullscreen; clipboard-read; clipboard-write; autoplay; encrypted-media; picture-in-picture");
  frame.addEventListener("load", () => onFrameLoad(tab));
  framesEl.appendChild(frame);
  tab.frame = frame;
  return frame;
}

function activateTab(id) {
  activeId = id;
  const tab = activeTab();
  // Restored tabs load lazily, the first time they're shown.
  if (tab && tab.url && ready && !tab.frame) navigate(tab, tab.url);
  render();
  save();
}

function closeTab(id) {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1) return;
  const [tab] = tabs.splice(index, 1);
  if (tab.frame) tab.frame.remove();
  if (activeId === id) {
    const next = tabs[index] || tabs[index - 1];
    activeId = null;
    if (next) activateTab(next.id);
  }
  render();
  save();
}

function navigate(tab, url) {
  tab.url = url;
  tab.loading = true;
  if (ready) ensureFrame(tab).src = proxify(url);
  render();
  save();
}

// ---- Reading state back out of the proxied page --------------------------
// Proxied pages are served from our own origin, so we can reach into them.

function frameWindow(tab) {
  try {
    return tab.frame && tab.frame.contentWindow;
  } catch {
    return null;
  }
}

function syncFromFrame(tab) {
  const win = frameWindow(tab);
  if (!win) return;
  let changed = false;
  try {
    const href = win.location.href;
    if (href.startsWith(PREFIX)) {
      const real = unproxify(href);
      if (real !== tab.url) {
        tab.url = real;
        changed = true;
      }
    }
    const title = win.document.title || tab.url;
    if (title !== tab.title) {
      tab.title = title;
      changed = true;
    }
  } catch {
    // Page in an odd state (about:blank, mid-navigation). Ignore.
  }
  if (changed) {
    render();
    save();
  }
}

function findFavicon(tab) {
  const win = frameWindow(tab);
  try {
    const link = win.document.querySelector('link[rel~="icon"], link[rel="shortcut icon"]');
    // UV's client hooks make .href return the original URL; the raw attribute may be rewritten.
    const href = link && (link.href || link.getAttribute("href"));
    const real = href ? unproxify(new URL(href, tab.url).href) : new URL("/favicon.ico", tab.url).href;
    return proxify(real);
  } catch {
    return "";
  }
}

function onFrameLoad(tab) {
  tab.loading = false;
  syncFromFrame(tab);
  tab.favicon = findFavicon(tab);
  hookFrame(tab);
  render();
  save();
}

function hookFrame(tab) {
  const win = frameWindow(tab);
  if (!win) return;
  try {
    // Popups and target=_blank links open as sidebar tabs instead of real windows.
    win.open = (url) => {
      if (url) createTab(resolveFrom(tab, String(url)));
      return null;
    };
    win.document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        const target = (a.getAttribute("target") || "").toLowerCase();
        if (target === "_blank" || e.ctrlKey || e.metaKey || e.button === 1) {
          e.preventDefault();
          e.stopPropagation();
          createTab(resolveFrom(tab, a.href), { activate: !(e.ctrlKey || e.metaKey) });
        }
      },
      true
    );
    win.addEventListener("pagehide", () => {
      tab.loading = true;
      render();
    });
    win.document.addEventListener("keydown", onKeyDown, true);
  } catch {
    // Some pages lock these down; the tab still works, just without the hooks.
  }
}

function resolveFrom(tab, url) {
  try {
    return unproxify(new URL(unproxify(url), tab.url).href);
  } catch {
    return url;
  }
}

// SPAs change URL and title without firing load, so poll the visible tab.
setInterval(() => {
  const tab = activeTab();
  if (tab) syncFromFrame(tab);
}, 500);

// ---- Rendering -----------------------------------------------------------

function render() {
  tabsEl.textContent = "";
  for (const tab of tabs) {
    const li = document.createElement("li");
    li.className = (tab.id === activeId ? "active " : "") + (tab.loading ? "loading" : "");
    li.title = tab.url;
    li.addEventListener("click", () => activateTab(tab.id));
    li.addEventListener("auxclick", (e) => e.button === 1 && closeTab(tab.id));

    const icon = document.createElement("img");
    icon.alt = "";
    if (tab.favicon) icon.src = tab.favicon;
    icon.onerror = () => (icon.style.visibility = "hidden");

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = tab.title || tab.url || "New Tab";

    const close = document.createElement("button");
    close.textContent = "×";
    close.title = "Close tab (Alt+W)";
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    li.append(icon, title, close);
    tabsEl.appendChild(li);
  }

  const tab = activeTab();
  if (document.activeElement !== urlInput) urlInput.value = tab ? tab.url : "";
  $("empty").hidden = Boolean(tab && tab.url);
  for (const t of tabs) if (t.frame) t.frame.hidden = t.id !== activeId || !t.url;
}

// ---- Persistence ---------------------------------------------------------

function save() {
  try {
    const data = { active: tabs.findIndex((t) => t.id === activeId), tabs: tabs.map(({ url, title, favicon }) => ({ url, title, favicon })) };
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    // Storage blocked; session just won't be restored.
  }
}

function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!data || !Array.isArray(data.tabs)) return;
    for (const saved of data.tabs) {
      if (!saved.url) continue;
      tabs.push({ id: nextId++, url: saved.url, title: saved.title || saved.url, favicon: saved.favicon || "", loading: false, frame: null });
    }
    const active = tabs[data.active] || tabs[0];
    if (active) activeId = active.id;
  } catch {
    // Corrupt or blocked storage; start fresh.
  }
}

// ---- Controls ------------------------------------------------------------

$("url-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const url = toUrl(urlInput.value);
  if (!url) return;
  urlInput.blur();
  const tab = activeTab();
  if (tab) navigate(tab, url);
  else createTab(url);
});

urlInput.addEventListener("focus", () => urlInput.select());
urlInput.addEventListener("blur", () => render());

$("new-tab").addEventListener("click", newTab);

function newTab() {
  createTab("");
  urlInput.focus();
}

function goBack() {
  const win = frameWindow(activeTab() || {});
  if (win) win.history.back();
}

function goForward() {
  const win = frameWindow(activeTab() || {});
  if (win) win.history.forward();
}

function reload() {
  const tab = activeTab();
  if (!tab || !tab.url) return;
  const win = frameWindow(tab);
  try {
    win.location.reload();
  } catch {
    navigate(tab, tab.url);
  }
}

$("back").addEventListener("click", goBack);
$("forward").addEventListener("click", goForward);
$("reload").addEventListener("click", reload);

// Ctrl+T / Ctrl+W belong to the host browser and can't be captured, so use Alt.
function onKeyDown(e) {
  const key = e.key.toLowerCase();
  let handled = true;
  if (e.altKey && key === "t") newTab();
  else if (e.altKey && key === "w") activeId && closeTab(activeId);
  else if (e.altKey && key === "r") reload();
  else if (e.altKey && e.key === "ArrowLeft") goBack();
  else if (e.altKey && e.key === "ArrowRight") goForward();
  else if ((e.ctrlKey || e.metaKey) && key === "l") urlInput.focus();
  else if (e.altKey && /^[1-9]$/.test(e.key)) {
    const tab = tabs[Number(e.key) - 1];
    if (tab) activateTab(tab.id);
  } else handled = false;
  if (handled) e.preventDefault();
}
document.addEventListener("keydown", onKeyDown, true);

// ---- Boot ----------------------------------------------------------------

restore();
render();

setupProxy()
  .then(() => {
    ready = true;
    statusEl.textContent = "Proxy connected";
    const tab = activeTab();
    if (tab) activateTab(tab.id);
    else if (!tabs.length) urlInput.focus();
  })
  .catch((err) => {
    statusEl.textContent = "Proxy failed: " + (err && err.message ? err.message : err);
    statusEl.classList.add("error");
    console.error(err);
  });
