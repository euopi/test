(() => {
  "use strict";

  // ---------- storage (never fatal: private windows can block it) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem("iptv:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("iptv:" + k, JSON.stringify(v)); return true; } catch { return false; } },
  };

  // Playlist bodies can be several MB, past localStorage's ~5 MB cap, so they
  // live in IndexedDB. The list of playlists (names, URLs) stays in localStorage.
  const texts = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open("iptv", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("texts");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction("texts", mode);
        const req = fn(t.objectStore("texts"));
        t.oncomplete = () => res(req && req.result);
        t.onerror = t.onabort = () => rej(t.error);
      });
    };
    return {
      get: (id) => tx("readonly", (st) => st.get(id)).catch(() => undefined),
      set: (id, text) => tx("readwrite", (st) => st.put(text, id)).then(() => true, () => false),
      del: (id) => tx("readwrite", (st) => st.delete(id)).catch(() => {}),
    };
  })();

  const storageOK = (() => { try { localStorage.setItem("iptv:t", "1"); localStorage.removeItem("iptv:t"); return true; } catch { return false; } })();

  const $ = (s) => document.querySelector(s);
  const el = {
    source: $("#source"), loadBtn: $("#load-btn"), stats: $("#stats"),
    special: $("#special"), groupsTitle: $("#groups-title"), groupFilter: $("#group-filter"), groupList: $("#group-list"),
    search: $("#search"), category: $("#category"), listTitle: $("#list-title"), list: $("#list"),
    video: $("#video"), overlay: $("#overlay"), now: $(".now"), nowLogo: $("#now-logo"), nowName: $("#now-name"),
    nowMeta: $("#now-meta"), fav: $("#fav-btn"), prev: $("#prev-btn"), next: $("#next-btn"),
    dialog: $("#m3u-dialog"), dlgClose: $("#dlg-close"), saved: $("#saved"), addForm: $("#add-form"),
    m3uName: $("#m3u-name"), m3uUrl: $("#m3u-url"), m3uFile: $("#m3u-file"), m3uError: $("#m3u-error"), m3uGo: $("#m3u-go"),
    exportBtn: $("#export-btn"), importFile: $("#import-file"), storageWarn: $("#storage-warn"),
  };

  const state = {
    source: "builtin",
    channels: [], groups: [], byKey: new Map(),
    view: { type: "all" }, query: "", category: "",
    visible: [], rendered: 0,
    current: null, dead: new Set(),
  };

  // ---------- sources ----------
  function loadBuiltin() {
    const data = window.IPTV_DATA;
    if (!data) return [];
    const out = [];
    for (const [code, list] of Object.entries(data.channels)) {
      const c = data.countries[code] || { name: code, flag: "" };
      for (const ch of list) {
        out.push({
          key: ch.id, name: ch.n, logo: ch.l || "", urls: ch.s, cats: ch.k || [],
          group: code, groupLabel: `${c.flag} ${c.name}`.trim(), quality: ch.q || "",
        });
      }
    }
    return out;
  }

  // An HLS stream (rather than a channel list) has these tags. If someone saves
  // a stream link, treat it as a one-channel playlist instead of listing its
  // quality variants or video segments as "channels".
  const isStream = (text) => /#EXT-X-(STREAM-INF|TARGETDURATION|MEDIA-SEQUENCE)/i.test(text);

  function parseM3U(text, url) {
    if (isStream(text)) {
      if (!url) return [];
      const name = decodeURIComponent(url.split(/[?#]/)[0].split("/").pop() || "Stream").replace(/\.m3u8?$/i, "");
      return [{ key: "m3u:" + url, name, logo: "", urls: [url], cats: [], group: "Streams", groupLabel: "Streams", quality: "" }];
    }
    const lines = text.split(/\r?\n/);
    const out = [];
    let info = null;
    const attr = (s, name) => { const m = s.match(new RegExp(name + '="([^"]*)"', "i")); return m ? m[1].trim() : ""; };
    for (let raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("#EXTINF")) {
        const comma = line.indexOf(",", line.lastIndexOf('"') + 1);
        info = {
          name: (comma >= 0 ? line.slice(comma + 1) : "").trim() || attr(line, "tvg-name"),
          logo: attr(line, "tvg-logo"),
          group: attr(line, "group-title"),
          id: attr(line, "tvg-id"),
        };
      } else if (line.startsWith("#EXTGRP:") && info) {
        info.group = info.group || line.slice(8).trim();
      } else if (!line.startsWith("#")) {
        const i = info || { name: line, logo: "", group: "", id: "" };
        const group = i.group.split(";")[0] || "Ungrouped";
        const key = "m3u:" + line;
        // same channel listed twice with different URLs: merge as fallbacks
        const prev = out.find((c) => c.name === i.name && c.group === group);
        if (prev) prev.urls.push(line);
        else out.push({ key, name: i.name || "Untitled", logo: i.logo, urls: [line], cats: [], group, groupLabel: group, quality: "" });
        info = null;
      }
    }
    return out;
  }

  function setChannels(list) {
    state.channels = list;
    state.byKey = new Map(list.map((c) => [c.key, c]));
    const counts = new Map();
    for (const c of list) {
      const g = counts.get(c.group) || { id: c.group, label: c.groupLabel, count: 0 };
      g.count++; counts.set(c.group, g);
    }
    state.groups = [...counts.values()].sort((a, b) =>
      b.count - a.count || a.label.localeCompare(b.label));
    if (state.source === "builtin") {
      state.groups.sort((a, b) => a.label.replace(/^\S+\s/, "").localeCompare(b.label.replace(/^\S+\s/, "")));
    }

    const cats = new Map();
    for (const c of list) for (const k of c.cats) cats.set(k, (cats.get(k) || 0) + 1);
    el.category.innerHTML = '<option value="">All categories</option>' +
      [...cats.entries()].sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `<option value="${esc(k)}">${esc(k)} (${n})</option>`).join("");
    el.category.hidden = cats.size === 0;
    state.category = "";

    el.groupsTitle.textContent = state.source === "builtin" ? "Countries" : "Groups";
    el.stats.textContent = list.length
      ? `${list.length.toLocaleString()} channels · ${state.groups.length} ${state.source === "builtin" ? "countries" : "groups"}`
      : "";
    state.dead.clear();
    clearSearch();
    renderGroups();
    refresh();
  }

  // ---------- saved playlists ----------
  // each: { id, name, url (blank for files), updated (ms) }
  const playlists = () => store.get("playlists", []);
  const savePlaylists = (list) => store.set("playlists", list);
  const playlistById = (id) => playlists().find((p) => p.id === id);
  const STALE_MS = 6 * 60 * 60 * 1000;

  function renderSourceOptions() {
    el.source.innerHTML = '<option value="builtin">World (iptv-org)</option>' +
      playlists().map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    el.source.value = state.source;
  }

  async function fetchText(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`server answered ${r.status}`);
    return r.text();
  }

  // Pulls a URL playlist again and stores the new copy. Returns the channel list.
  async function refreshPlaylist(p) {
    const text = await fetchText(p.url);
    const list = parseM3U(text, p.url);
    if (!list.length) throw new Error("no channels in it any more");
    await texts.set(p.id, text);
    savePlaylists(playlists().map((x) => x.id === p.id ? { ...x, updated: Date.now() } : x));
    return { list, text };
  }

  async function switchSource(src) {
    const p = src === "builtin" ? null : playlistById(src);
    if (!p) src = "builtin";
    state.source = src;
    store.set("source", src);
    state.view = { type: "all" };
    renderSourceOptions();
    if (!p) { setChannels(loadBuiltin()); return; }

    const cached = await texts.get(p.id);
    if (state.source !== src) return;
    if (cached) setChannels(parseM3U(cached, p.url));
    else { setChannels([]); el.listTitle.textContent = p.url ? "Downloading playlist…" : ""; }

    // keep URL playlists current without making you re-add them
    if (p.url && (!cached || Date.now() - (p.updated || 0) > STALE_MS)) {
      try {
        const fresh = await refreshPlaylist(p);
        if (state.source === src && fresh.text !== cached) setChannels(fresh.list);
      } catch (err) {
        if (!cached && state.source === src) {
          el.list.innerHTML = `<li class="empty">Couldn't download “${esc(p.name)}” (${esc(err.message)}). Try again from Playlists → ⟳.</li>`;
        }
      }
    } else if (!p.url && !cached) {
      el.list.innerHTML = `<li class="empty">This playlist's file wasn't saved by the browser. Remove it and add the file again.</li>`;
    }
  }

  function renderSaved() {
    const list = playlists();
    el.saved.innerHTML = list.length ? list.map((p) => `
      <li data-id="${esc(p.id)}" class="${p.id === state.source ? "current" : ""}">
        <span class="pl-info" data-act="open" title="Open">
          <div>${esc(p.name)}</div>
          <small>${p.url ? esc(p.url) : "From a file"}${p.updated ? " · updated " + new Date(p.updated).toLocaleDateString() : ""}</small>
        </span>
        ${p.url ? '<button class="icon" data-act="refresh" title="Download again">⟳</button>' : ""}
        <button class="icon" data-act="rename" title="Rename">✎</button>
        <button class="icon" data-act="delete" title="Remove">🗑</button>
      </li>`).join("") : '<li class="none">No saved playlists yet.</li>';
  }

  function openPlaylists() {
    el.m3uError.textContent = "";
    el.storageWarn.hidden = storageOK;
    renderSaved();
    el.dialog.showModal();
  }

  const newId = () => "pl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  async function addPlaylist(name, url, text) {
    const id = newId();
    const nameGuess = url ? decodeURIComponent(url.split(/[?#]/)[0].split("/").pop() || "").replace(/\.m3u8?$/i, "") : "";
    const entry = { id, name: name || nameGuess || "Playlist " + (playlists().length + 1), url: url || "", updated: Date.now() };
    const stored = await texts.set(id, text);
    if (!stored && !url) throw new Error("the browser refused to store the file");
    savePlaylists([...playlists(), entry]);
    return entry;
  }

  // ---------- favorites & recent (per source) ----------
  const favKey = () => "fav:" + state.source;
  const recentKey = () => "recent:" + state.source;
  const favs = () => new Set(store.get(favKey(), []));
  function toggleFav(ch) {
    const f = favs();
    f.has(ch.key) ? f.delete(ch.key) : f.add(ch.key);
    store.set(favKey(), [...f]);
    renderGroups(); renderNow();
    if (state.view.type === "fav") refresh(); else markList();
  }
  function pushRecent(ch) {
    const r = store.get(recentKey(), []).filter((k) => k !== ch.key);
    r.unshift(ch.key);
    store.set(recentKey(), r.slice(0, 40));
  }

  // ---------- rendering ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const initials = (n) => esc(n.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "TV");

  function renderGroups() {
    const f = favs();
    const recentN = store.get(recentKey(), []).filter((k) => state.byKey.has(k)).length;
    const items = [
      { type: "all", label: "📺 All channels", n: state.channels.length },
      { type: "fav", label: "⭐ Favorites", n: [...f].filter((k) => state.byKey.has(k)).length },
      { type: "recent", label: "🕘 Recently watched", n: recentN },
    ];
    el.special.innerHTML = items.map((it) =>
      `<li data-type="${it.type}" class="${state.view.type === it.type ? "active" : ""}"><span class="grow">${it.label}</span><span class="n">${it.n}</span></li>`).join("");

    const q = el.groupFilter.value.trim().toLowerCase();
    const gs = q ? state.groups.filter((g) => g.label.toLowerCase().includes(q)) : state.groups;
    el.groupList.innerHTML = gs.map((g) =>
      `<li data-group="${esc(g.id)}" class="${state.view.type === "group" && state.view.group === g.id ? "active" : ""}"><span class="grow">${esc(g.label)}</span><span class="n">${g.count}</span></li>`).join("");
  }

  function computeVisible() {
    let list;
    const v = state.view;
    if (v.type === "fav") list = [...favs()].map((k) => state.byKey.get(k)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    else if (v.type === "recent") list = store.get(recentKey(), []).map((k) => state.byKey.get(k)).filter(Boolean);
    else if (v.type === "group") list = state.channels.filter((c) => c.group === v.group);
    else list = state.channels;

    const q = state.query.trim().toLowerCase();
    // searching always spans the whole source, not just the open group
    if (q) list = (v.type === "group" ? state.channels : list).filter((c) => c.name.toLowerCase().includes(q));
    if (state.category) list = list.filter((c) => c.cats.includes(state.category));
    if (v.type === "all" && !q) list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function refresh() {
    state.visible = computeVisible();
    state.rendered = 0;
    el.list.innerHTML = "";
    el.list.scrollTop = 0;
    const v = state.view;
    const title = state.query ? `Results for “${state.query}”`
      : v.type === "fav" ? "Favorites" : v.type === "recent" ? "Recently watched"
      : v.type === "group" ? (state.groups.find((g) => g.id === v.group) || {}).label : "All channels";
    el.listTitle.textContent = `${title} · ${state.visible.length.toLocaleString()}`;
    if (!state.visible.length) {
      const msg = !state.channels.length && state.source !== "builtin"
        ? "This playlist is empty."
        : v.type === "fav" && !state.query ? "No favorites yet. Press F or ☆ while watching a channel."
        : "Nothing matches.";
      el.list.innerHTML = `<li class="empty">${msg}</li>`;
      return;
    }
    renderMore();
  }

  const PAGE = 200;
  function renderMore() {
    const f = favs();
    const slice = state.visible.slice(state.rendered, state.rendered + PAGE);
    const showGroup = state.view.type !== "group" || state.query;
    const html = slice.map((c, i) => {
      const idx = state.rendered + i;
      const sub = [showGroup ? c.groupLabel : "", c.cats.slice(0, 2).join(", "), c.quality].filter(Boolean).join(" · ");
      const cls = [state.current === c ? "playing" : "", state.dead.has(c.key) ? "dead" : ""].join(" ");
      return `<li data-i="${idx}" class="${cls}">
        <span class="thumb">${c.logo ? `<img loading="lazy" src="${esc(c.logo)}" alt="" onerror="this.replaceWith(document.createTextNode('${initials(c.name)}'))">` : initials(c.name)}</span>
        <span class="meta"><div>${esc(c.name)}</div><small>${esc(sub)}</small></span>
        ${f.has(c.key) ? '<span class="star">★</span>' : ""}
      </li>`;
    }).join("");
    el.list.insertAdjacentHTML("beforeend", html);
    state.rendered += slice.length;
  }

  function markList() {
    const f = favs();
    for (const li of el.list.querySelectorAll("li[data-i]")) {
      const c = state.visible[+li.dataset.i];
      li.classList.toggle("playing", c === state.current);
      li.classList.toggle("dead", state.dead.has(c.key));
      const star = li.querySelector(".star");
      if (f.has(c.key) && !star) li.insertAdjacentHTML("beforeend", '<span class="star">★</span>');
      if (!f.has(c.key) && star) star.remove();
    }
  }

  function renderNow() {
    const c = state.current;
    el.now.hidden = !c;
    if (!c) return;
    el.nowName.textContent = c.name;
    el.nowMeta.textContent = [c.groupLabel, c.cats.join(", "), c.quality].filter(Boolean).join(" · ");
    el.nowLogo.src = c.logo || "";
    el.nowLogo.hidden = !c.logo;
    const on = favs().has(c.key);
    el.fav.textContent = on ? "★" : "☆";
    el.fav.classList.toggle("on", on);
  }

  // ---------- playback ----------
  let hls = null, attempt = 0, stallTimer = null, playToken = 0;

  function teardown() {
    clearTimeout(stallTimer);
    if (hls) { hls.destroy(); hls = null; }
    el.video.removeAttribute("src");
    el.video.load();
  }

  function showOverlay(msg) { el.overlay.textContent = msg; el.overlay.hidden = !msg; }

  function play(ch) {
    state.current = ch;
    attempt = 0;
    pushRecent(ch);
    renderNow(); markList(); renderGroups();
    document.title = `${ch.name} · IPTV`;
    tryUrl(++playToken);
  }

  function tryUrl(token) {
    const ch = state.current;
    teardown();
    if (attempt >= ch.urls.length) {
      state.dead.add(ch.key);
      markList();
      showOverlay(`Couldn't play ${ch.name}. The stream is offline, geo-blocked, or refuses browser playback.`);
      return;
    }
    const url = ch.urls[attempt];
    showOverlay(`Tuning in to ${ch.name}…` + (attempt ? ` (backup ${attempt})` : ""));
    const fail = () => { if (token === playToken) { attempt++; tryUrl(token); } };
    stallTimer = setTimeout(fail, 15000);

    const isHls = /\.m3u8?(\?|$)/i.test(url) || !/\.(mp4|webm|ogg|mp3|aac)(\?|$)/i.test(url);
    if (isHls && window.Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) fail(); });
      hls.loadSource(url);
      hls.attachMedia(el.video);
    } else {
      el.video.src = url; // Safari plays HLS natively; also handles mp4/webm
    }
    el.video.onerror = fail;
    el.video.play().catch(() => { /* autoplay with sound may be blocked; controls still work */ });
  }

  el.video.addEventListener("playing", () => { clearTimeout(stallTimer); showOverlay(""); });

  function stop() {
    playToken++;
    teardown();
    state.current = null;
    showOverlay("Pick a channel to start watching");
    document.title = "IPTV";
    renderNow(); markList();
  }

  function step(dir) {
    const list = state.visible;
    if (!list.length) return;
    let i = list.indexOf(state.current);
    i = i < 0 ? 0 : (i + dir + list.length) % list.length;
    while (state.rendered <= i) renderMore();
    play(list[i]);
    el.list.querySelector(`li[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }

  // ---------- events ----------
  el.special.addEventListener("click", (e) => {
    const li = e.target.closest("li"); if (!li) return;
    state.view = { type: li.dataset.type };
    clearSearch(); renderGroups(); refresh();
  });
  el.groupList.addEventListener("click", (e) => {
    const li = e.target.closest("li"); if (!li) return;
    state.view = { type: "group", group: li.dataset.group };
    clearSearch(); renderGroups(); refresh();
  });
  el.groupFilter.addEventListener("input", renderGroups);
  function clearSearch() { state.query = ""; el.search.value = ""; }

  let searchTimer;
  el.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = el.search.value; refresh(); }, 120);
  });
  el.category.addEventListener("change", () => { state.category = el.category.value; refresh(); });

  el.list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]"); if (!li) return;
    play(state.visible[+li.dataset.i]);
  });
  el.list.addEventListener("scroll", () => {
    if (el.list.scrollTop + el.list.clientHeight > el.list.scrollHeight - 400 && state.rendered < state.visible.length) renderMore();
  });

  el.fav.addEventListener("click", () => state.current && toggleFav(state.current));
  el.prev.addEventListener("click", () => step(-1));
  el.next.addEventListener("click", () => step(1));
  el.source.addEventListener("change", () => switchSource(el.source.value));

  el.loadBtn.addEventListener("click", openPlaylists);
  el.dlgClose.addEventListener("click", () => el.dialog.close());

  el.addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    el.m3uError.textContent = "";
    const file = el.m3uFile.files[0];
    const url = el.m3uUrl.value.trim();
    let text = "";
    try {
      if (file) text = await file.text();
      else if (url) text = await fetchText(url);
      else { el.m3uError.textContent = "Give a URL or pick a file."; return; }
    } catch (err) {
      el.m3uError.textContent = `Couldn't fetch it (${err.message}). The host probably blocks browser downloads (CORS); download the file and pick it here instead.`;
      return;
    }
    if (!parseM3U(text, file ? "" : url).length) {
      el.m3uError.textContent = file && isStream(text)
        ? "That file is a single video stream, not a channel list. Paste its web address in the URL box instead."
        : "No channels found in that playlist.";
      return;
    }
    let entry;
    try {
      entry = await addPlaylist(el.m3uName.value.trim() || (file ? file.name.replace(/\.m3u8?$/i, "") : ""), file ? "" : url, text);
    } catch (err) { el.m3uError.textContent = `Couldn't save it: ${err.message}.`; return; }
    el.addForm.reset();
    el.dialog.close();
    switchSource(entry.id);
  });

  el.saved.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    const id = btn.closest("li").dataset.id;
    const p = playlistById(id); if (!p) return;
    const act = btn.dataset.act;
    if (act === "open") { el.dialog.close(); switchSource(id); }
    else if (act === "rename") {
      const name = prompt("Rename playlist", p.name);
      if (name && name.trim()) {
        savePlaylists(playlists().map((x) => x.id === id ? { ...x, name: name.trim().slice(0, 60) } : x));
        renderSaved(); renderSourceOptions();
      }
    } else if (act === "delete") {
      if (!confirm(`Remove “${p.name}”? Its favorites go with it.`)) return;
      savePlaylists(playlists().filter((x) => x.id !== id));
      texts.del(id);
      store.set("fav:" + id, []); store.set("recent:" + id, []);
      if (state.source === id) switchSource("builtin"); else renderSourceOptions();
      renderSaved();
    } else if (act === "refresh") {
      btn.disabled = true; btn.textContent = "…";
      el.m3uError.textContent = "";
      try {
        const fresh = await refreshPlaylist(p);
        if (state.source === id) setChannels(fresh.list);
      } catch (err) {
        el.m3uError.textContent = `Couldn't update “${p.name}”: ${err.message}.`;
      }
      renderSaved();
    }
  });

  el.exportBtn.addEventListener("click", async () => {
    const out = { app: "iptv", version: 1, playlists: [] };
    for (const p of playlists()) {
      out.playlists.push({ ...p, text: p.url ? undefined : await texts.get(p.id), favorites: store.get("fav:" + p.id, []) });
    }
    out.builtinFavorites = store.get("fav:builtin", []);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: "application/json" }));
    a.download = "iptv-playlists.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  el.importFile.addEventListener("change", async () => {
    const f = el.importFile.files[0]; el.importFile.value = "";
    if (!f) return;
    el.m3uError.textContent = "";
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.playlists)) throw new Error("not an IPTV backup file");
      const have = new Set(playlists().map((p) => (p.url || "") + "|" + p.name));
      let added = 0;
      for (const p of data.playlists) {
        if (have.has((p.url || "") + "|" + p.name)) continue;
        if (!p.url && !p.text) continue;
        const entry = await addPlaylist(p.name, p.url || "", p.text || "");
        if (p.url) savePlaylists(playlists().map((x) => x.id === entry.id ? { ...x, updated: 0 } : x));
        if (Array.isArray(p.favorites)) store.set("fav:" + entry.id, p.favorites);
        added++;
      }
      if (Array.isArray(data.builtinFavorites)) {
        store.set("fav:builtin", [...new Set([...store.get("fav:builtin", []), ...data.builtinFavorites])]);
      }
      renderSaved(); renderSourceOptions(); renderGroups();
      el.m3uError.textContent = added ? "" : "Nothing new in that backup.";
    } catch (err) {
      el.m3uError.textContent = `Import failed: ${err.message}.`;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (el.dialog.open) return;
    const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) { e.preventDefault(); el.search.focus(); return; }
    if (e.key === "Escape") { if (typing) document.activeElement.blur(); else stop(); return; }
    if (typing) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); step(-1); }
    else if (e.key.toLowerCase() === "f" && state.current) toggleFav(state.current);
  });

  // ---------- boot ----------
  if (!window.Hls) showOverlay("hls.js failed to load (offline?). Only Safari can play streams without it.");
  (async () => {
    // carry over the single playlist older versions of this app kept
    const legacy = store.get("m3u", "");
    if (legacy) {
      try {
        const entry = await addPlaylist("My playlist", "", legacy);
        store.set("fav:" + entry.id, store.get("fav:m3u", []));
        if (store.get("source") === "m3u") store.set("source", entry.id);
        localStorage.removeItem("iptv:m3u");
      } catch { /* keep the legacy copy and try again next time */ }
    }
    switchSource(store.get("source", "builtin"));
  })();
})();
