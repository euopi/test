(() => {
  "use strict";
  const MAX_TRIES = 3;
  const MARKER_PX = 10; // countries smaller than this on screen get a clickable marker
  const $ = (id) => document.getElementById(id);

  // ---------- Geometry ----------
  const features = topojson.feature(WORLD, WORLD.objects.c).features.filter((f) => f.geometry);
  // Quantisation can flip a tiny island ring; d3 would then fill the whole globe.
  for (const f of features) {
    f.geometry.coordinates = f.geometry.coordinates.filter((poly) => poly[0] && poly[0].length >= 4).map((poly) =>
      d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map((r) => r.slice().reverse()) : poly
    );
  }
  const byId = new Map(features.map((f) => [f.id, f]));
  const nameOf = (id) => (COUNTRIES[id] ? COUNTRIES[id][0] : byId.get(id)?.properties.n || id);

  // ---------- Name matching ----------
  const norm = (s) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[.'’]/g, "").replace(/&/g, " and ").replace(/\bst\b/g, "saint")
      .replace(/[^a-z0-9]+/g, " ").replace(/\bthe\b/g, " ").replace(/\s+/g, " ").trim();
  const aliasTable = new Map();
  for (const [id, names] of Object.entries(COUNTRIES)) for (const n of names) aliasTable.set(norm(n), id);

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0]; row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }
  // Returns a country id, or null if the text isn't a recognisable country name.
  function identify(text) {
    const q = norm(text);
    if (!q) return null;
    if (aliasTable.has(q)) return aliasTable.get(q);
    if (q.length < 5) return null;
    const allowed = q.length >= 10 ? 2 : 1;
    const hits = new Set();
    for (const [alias, id] of aliasTable) if (alias.length >= 5 && lev(q, alias) <= allowed) hits.add(id);
    return hits.size === 1 ? [...hits][0] : null;
  }

  // ---------- Persistence (best scores only) ----------
  const bestKey = (r, m) => `atlas-drill:best:${r}:${m}`;
  function getBest(r, m) { try { return JSON.parse(localStorage.getItem(bestKey(r, m))); } catch { return null; } }
  function setBest(r, m, v) { try { localStorage.setItem(bestKey(r, m), JSON.stringify(v)); } catch {} }

  // ---------- Helpers ----------
  const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const deg = (v) => +Math.abs(v).toFixed(1);
  const fmtLat = (v) => `${deg(v)}°${v >= 0 ? "N" : "S"}`;
  const fmtLon = (v) => { v = ((v + 540) % 360) - 180; return `${deg(v)}°${v >= 0 ? "E" : "W"}`; };
  const frameText = (b) => `${fmtLat(b[1])}–${fmtLat(b[3])} · ${fmtLon(b[0])}–${fmtLon(b[2])}`;
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const allRegions = REGION_GROUPS.flatMap((g) => g.regions);

  // ---------- Home ----------
  let mode = "click";
  try { mode = localStorage.getItem("atlas-drill:mode") || "click"; } catch {}
  function setMode(m) {
    mode = m;
    $("mode-click").setAttribute("aria-pressed", m === "click");
    $("mode-type").setAttribute("aria-pressed", m === "type");
    try { localStorage.setItem("atlas-drill:mode", m); } catch {}
    renderHome();
  }
  $("mode-click").onclick = () => setMode("click");
  $("mode-type").onclick = () => setMode("type");

  function renderHome() {
    const root = $("groups");
    root.innerHTML = "";
    for (const g of REGION_GROUPS) {
      const sec = document.createElement("section");
      sec.className = "group";
      const total = g.regions[0].ids.length;
      sec.innerHTML = `<h2>${g.name}${g.name !== "Notable groups" ? ` <small>${total} countries</small>` : ""}</h2><div class="cards"></div>`;
      const cards = sec.querySelector(".cards");
      g.regions.forEach((r, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "card" + (i === 0 && g.name !== "Notable groups" ? " primary" : "");
        const best = getBest(r.id, mode);
        b.innerHTML = `<span class="name">${r.name}</span>
          <span class="meta"><span>${r.ids.length} countries</span>${best ? `<span class="best">Best ${best.acc}% · ${fmtTime(best.ms)}</span>` : ""}</span>
          <span class="meta"><span>${frameText(r.bbox)}</span></span>`;
        b.onclick = () => startGame(r, r.ids);
        cards.appendChild(b);
      });
      root.appendChild(sec);
    }
  }

  // ---------- Map ----------
  const svg = d3.select("#map");
  const zoomLayer = svg.append("g");
  let sea, gratPath, landSel, markerSel, labelLayer, zoomK = 1, sizeOf = new Map();
  const zoom = d3.zoom().scaleExtent([1, 80]).clickDistance(5).on("zoom", (e) => {
    zoomLayer.attr("transform", e.transform);
    zoomK = e.transform.k;
    applyZoomScale();
  });
  svg.call(zoom).on("dblclick.zoom", null);

  function makeProjection(region, w, h) {
    let [W, S, E, N] = region.bbox;
    if (E < W) E += 360;
    const pts = [];
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) pts.push([W + ((E - W) * i) / 12, S + ((N - S) * j) / 12]);
    const p = d3.geoAzimuthalEqualArea().rotate([-(W + E) / 2, -(S + N) / 2]).clipAngle(90).precision(0.2);
    const pad = Math.min(24, w * 0.04);
    p.fitExtent([[pad, pad], [w - pad, h - pad]], { type: "MultiPoint", coordinates: pts });
    p.clipExtent([[-4, -4], [w + 4, h + 4]]);
    return { p, center: [(W + E) / 2, (S + N) / 2] };
  }

  function drawMap() {
    const box = $("mapwrap").getBoundingClientRect();
    const w = Math.max(320, box.width), h = Math.max(240, box.height);
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    lastW = box.width; lastH = box.height;
    zoomLayer.selectAll("*").remove();
    const { p, center } = makeProjection(G.region, w, h);
    const path = d3.geoPath(p);
    $("proj").textContent = `Lambert azimuthal equal-area · centre ${fmtLat(center[1])} ${fmtLon(center[0])}`;

    zoom.extent([[0, 0], [w, h]]).translateExtent([[0, 0], [w, h]]);
    sea = zoomLayer.append("rect").attr("class", "sea").attr("width", w).attr("height", h);
    gratPath = zoomLayer.append("path").attr("class", "grat").attr("d", path(d3.geoGraticule().step([10, 10])()));

    const drawn = [];
    for (const f of features) {
      const d = path(f);
      if (d) drawn.push({ f, d });
    }
    landSel = zoomLayer.append("g").selectAll("path").data(drawn).join("path")
      .attr("d", (o) => o.d)
      .attr("data-id", (o) => o.f.id)
      .attr("class", (o) => "land " + (G.set.has(o.f.id) ? "on" : "off"));

    sizeOf = new Map();
    const markers = [];
    for (const { f } of drawn) {
      if (!G.set.has(f.id)) continue;
      const size = Math.sqrt(path.area(f));
      sizeOf.set(f.id, size);
      if (size < MARKER_PX) {
        const xy = p(f.properties.l);
        if (xy && xy[0] >= 0 && xy[0] <= w && xy[1] >= 0 && xy[1] <= h) markers.push({ id: f.id, x: xy[0], y: xy[1], size });
      }
    }
    G.labelPoint = (id) => { const f = byId.get(id); return f && p(f.properties.l); };
    markerSel = zoomLayer.append("g").selectAll("circle").data(markers).join("circle")
      .attr("class", "mk").attr("data-id", (m) => m.id).attr("cx", (m) => m.x).attr("cy", (m) => m.y);
    labelLayer = zoomLayer.append("g");

    landSel.on("click", (e, o) => onMapClick(o.f.id))
      .on("pointermove", (e, o) => showTip(e, o.f.id))
      .on("pointerleave", hideTip);
    markerSel.on("click", (e, m) => onMapClick(m.id))
      .on("pointermove", (e, m) => showTip(e, m.id))
      .on("pointerleave", hideTip);

    svg.call(zoom.transform, d3.zoomIdentity);
    paintAll();
  }

  function applyZoomScale() {
    if (!markerSel) return;
    markerSel.attr("r", 5.5 / zoomK).attr("display", (m) => (m.size * zoomK > 16 ? "none" : null));
    labelLayer.selectAll("text").attr("font-size", 13 / zoomK).style("stroke-width", 3.5 / zoomK + "px");
  }

  function classFor(id) {
    const r = G.results.get(id);
    if (r === 1) return "r1";
    if (r === 2) return "r2";
    if (r === 3) return "r3";
    if (r === 0) return "rmiss";
    return "";
  }
  function paint(id) {
    const cls = classFor(id);
    const cur = G.mode === "type" && G.current === id && !G.over && !G.revealing ? " current" : "";
    const rev = G.revealing === id ? " reveal" : "";
    zoomLayer.selectAll(`[data-id="${id}"]`).each(function () {
      const el = d3.select(this);
      const base = this.tagName === "circle" ? "mk" : "land " + (G.set.has(id) ? "on" : "off");
      el.attr("class", `${base} ${cls}${cur}${rev}`.trim());
    });
  }
  function paintAll() { for (const id of G.set) paint(id); applyZoomScale(); }

  function flashWrong(id) {
    const els = zoomLayer.selectAll(`[data-id="${id}"]`);
    els.classed("wrongflash", true);
    setTimeout(() => els.classed("wrongflash", false), 650);
  }
  function addLabel(id, cls = "") {
    const xy = G.labelPoint(id);
    if (!xy) return;
    labelLayer.append("text").attr("class", "lbl " + cls).attr("x", xy[0]).attr("y", xy[1] - 9 / zoomK).text(nameOf(id));
    applyZoomScale();
  }
  function clearLabels() { labelLayer && labelLayer.selectAll("text").remove(); }

  // Zoom in on a tiny target so a revealed or highlighted microstate is actually visible.
  function focusOn(id) {
    const size = sizeOf.get(id);
    const xy = G.labelPoint(id);
    if (!xy || size === undefined || size * zoomK >= 6) return;
    const box = $("mapwrap").getBoundingClientRect();
    const k = Math.min(12, Math.max(zoomK, 4));
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(box.width / 2 - k * xy[0], box.height / 2 - k * xy[1]).scale(k));
  }

  // ---------- Tooltip & toast ----------
  const tip = $("tip");
  function showTip(e, id) {
    const answered = G.results.has(id);
    const open = G.over || (answered && !(G.mode === "type" && G.current === id));
    if (!open) return hideTip();
    const box = $("mapwrap").getBoundingClientRect();
    tip.textContent = nameOf(id);
    tip.hidden = false;
    tip.style.left = Math.min(e.clientX - box.left + 12, box.width - tip.offsetWidth - 6) + "px";
    tip.style.top = e.clientY - box.top + 14 + "px";
  }
  function hideTip() { tip.hidden = true; }
  let toastTimer;
  function toast(text, kind = "") {
    const t = $("toast");
    t.textContent = text;
    t.className = "toast " + kind;
    t.style.opacity = 1;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.style.opacity = 0), 1800);
  }

  // ---------- Game state ----------
  const G = { results: new Map(), set: new Set() };
  let timerId;

  function startGame(region, ids) {
    Object.assign(G, {
      region, mode, ids, set: new Set(region.ids), queue: shuffle(ids), idx: 0, tries: 0,
      results: new Map(), over: false, revealing: null, current: null, start: performance.now(), elapsed: 0,
    });
    $("home").hidden = true;
    $("game").hidden = false;
    $("results").hidden = true;
    $("where").textContent = `${region.name} · ${G.mode === "click" ? "Click mode" : "Type mode"}`;
    document.querySelector("#game").className = "playing " + G.mode;
    drawMap();
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
    nextPrompt();
  }

  function tick() {
    if (!G.over) G.elapsed = performance.now() - G.start;
    $("s-time").textContent = fmtTime(G.elapsed);
  }

  function accuracy() {
    let pts = 0;
    for (const r of G.results.values()) pts += r === 0 ? 0 : MAX_TRIES + 1 - r;
    return G.results.size ? Math.round((pts / (MAX_TRIES * G.results.size)) * 100) : null;
  }
  function updateStats() {
    $("s-prog").textContent = `${G.results.size}/${G.ids.length}`;
    const a = accuracy();
    $("s-acc").textContent = a === null ? "–" : a + "%";
  }

  function triesDots() {
    return `<span class="tries" aria-label="${MAX_TRIES - G.tries} tries left">${Array.from({ length: MAX_TRIES }, (_, i) => `<i class="${i < G.tries ? "used" : ""}"></i>`).join("")}</span>`;
  }

  function renderPrompt() {
    const el = $("prompt");
    if (G.over) { el.innerHTML = `<span class="target">Finished</span>`; return; }
    if (G.mode === "click") {
      el.innerHTML = `<span class="verb">Find</span><span class="target">${nameOf(G.current)}</span>${triesDots()}`;
    } else {
      const keep = document.activeElement && document.activeElement.id === "guess";
      el.innerHTML = `<form class="answer" id="answer" autocomplete="off">
          <input id="guess" type="text" placeholder="Country name" aria-label="Country name" spellcheck="false" autocapitalize="off">
          <button class="btn" type="submit">Guess</button>
          <button class="btn ghost" type="button" id="skip">Skip</button>
        </form>${triesDots()}`;
      $("answer").onsubmit = (e) => { e.preventDefault(); onTyped($("guess").value); };
      $("skip").onclick = () => giveUp();
      if (keep || window.matchMedia("(pointer: fine)").matches) $("guess").focus();
    }
  }
  function updateTries() {
    const t = document.querySelector(".tries");
    if (t) t.outerHTML = triesDots();
  }

  function nextPrompt() {
    clearLabels();
    G.revealing = null;
    G.tries = 0;
    if (G.idx >= G.queue.length) return finish();
    const prev = G.current;
    G.current = G.queue[G.idx++];
    if (prev) paint(prev);
    paint(G.current);
    updateStats();
    renderPrompt();
    if (G.mode === "type") focusOn(G.current);
  }

  function settle(result) {
    const id = G.current;
    G.results.set(id, result);
    paint(id);
    updateStats();
  }

  function onMapClick(id) {
    if (G.over || G.mode !== "click" || G.revealing) return;
    if (id === G.current) {
      settle(G.tries + 1);
      toast(`✓ ${nameOf(id)}`, "good");
      nextPrompt();
      return;
    }
    G.tries++;
    flashWrong(id);
    if (G.tries >= MAX_TRIES) return reveal(`That's ${nameOf(id)}. Here's ${nameOf(G.current)}.`);
    const left = MAX_TRIES - G.tries;
    toast(`That's ${nameOf(id)}. ${left} ${left === 1 ? "try" : "tries"} left`, "bad");
    updateTries();
  }

  function onTyped(text) {
    if (G.over || G.revealing || !text.trim()) return;
    const id = identify(text);
    const input = $("guess");
    if (id === G.current) {
      settle(G.tries + 1);
      toast(`✓ ${nameOf(id)}`, "good");
      nextPrompt();
      return;
    }
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
    if (!id) { toast("I don't know that country name. Check the spelling."); return; }
    G.tries++;
    if (G.tries >= MAX_TRIES) return reveal(`It was ${nameOf(G.current)}`);
    const left = MAX_TRIES - G.tries;
    toast(`Not ${nameOf(id)}. ${left} ${left === 1 ? "try" : "tries"} left`, "bad");
    input.value = "";
    updateTries();
  }

  function giveUp() {
    if (G.over || G.revealing) return;
    G.tries = MAX_TRIES;
    reveal(`Skipped: it was ${nameOf(G.current)}`);
  }

  function reveal(msg) {
    settle(0);
    G.revealing = G.current;
    paint(G.current);
    updateTries();
    addLabel(G.current);
    focusOn(G.current);
    toast(msg, "bad");
    setTimeout(() => {
      if (G.revealing !== G.current) return;
      G.revealing = null;
      paint(G.current);
      nextPrompt();
    }, 1900);
  }

  function finish() {
    G.over = true;
    G.elapsed = performance.now() - G.start;
    tick();
    const prev = G.current;
    G.current = null;
    if (prev) paint(prev);
    renderPrompt();
    const acc = accuracy();
    const counts = [1, 2, 3, 0].map((k) => [...G.results.values()].filter((v) => v === k).length);
    const missed = G.ids.filter((id) => G.results.get(id) === 0);
    const fullRun = G.ids.length === G.region.ids.length;
    const best = getBest(G.region.id, G.mode);
    let newBest = false;
    if (fullRun && (!best || acc > best.acc || (acc === best.acc && G.elapsed < best.ms))) {
      setBest(G.region.id, G.mode, { acc, ms: Math.round(G.elapsed) });
      newBest = true;
    }
    const res = $("results");
    res.innerHTML = `<div class="sheet" role="dialog" aria-label="Results">
      <h2>${G.region.name}${fullRun ? "" : " · missed ones"}</h2>
      <div class="big">
        <div><b>${acc}%</b><span>Accuracy</span></div>
        <div><b>${fmtTime(G.elapsed)}</b><span>Time</span></div>
      </div>
      <div class="breakdown">
        <span><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--t1)"></i> 1st try ${counts[0]}</span>
        <span><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--t2)"></i> 2nd ${counts[1]}</span>
        <span><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--t3)"></i> 3rd ${counts[2]}</span>
        <span><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--miss)"></i> Missed ${counts[3]}</span>
      </div>
      ${missed.length ? `<div><p class="note">Missed (tap to see on the map):</p><div class="missed">${missed.map((id) => `<button type="button" data-id="${id}">${nameOf(id)}</button>`).join("")}</div></div>` : `<p class="note">No misses.</p>`}
      <p class="note">${newBest ? "New best for this region and mode." : best && fullRun ? `Best: ${best.acc}% in ${fmtTime(best.ms)}.` : fullRun ? "" : "Practice rounds on missed countries don't count toward your best."} Accuracy gives full credit on the 1st try, two-thirds on the 2nd, one-third on the 3rd. Hover the map to see every name.</p>
      <div class="actions">
        ${missed.length ? `<button class="btn" type="button" id="r-missed">Retry the ${missed.length} missed</button>` : ""}
        <button class="btn ${missed.length ? "ghost" : ""}" type="button" id="r-again">Play again</button>
        <button class="btn ghost" type="button" id="r-map">View map</button>
        <button class="btn ghost" type="button" id="r-home">Choose region</button>
      </div>
    </div>`;
    res.hidden = false;
    res.querySelectorAll(".missed button").forEach((b) => (b.onclick = () => {
      res.hidden = true;
      clearLabels();
      addLabel(b.dataset.id);
      focusOn(b.dataset.id);
      showReturn();
    }));
    if (missed.length) $("r-missed").onclick = () => startGame(G.region, missed);
    $("r-again").onclick = () => startGame(G.region, G.region.ids);
    $("r-map").onclick = () => { res.hidden = true; showReturn(); };
    $("r-home").onclick = goHome;
  }
  function showReturn() {
    $("prompt").innerHTML = `<button class="btn" type="button" id="r-show">Show results</button>`;
    $("r-show").onclick = () => { $("results").hidden = false; renderPrompt(); };
  }

  function goHome() {
    clearInterval(timerId);
    G.over = true;
    $("game").hidden = true;
    $("home").hidden = false;
    renderHome();
  }
  $("back").onclick = goHome;
  $("z-in").onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1.8);
  $("z-out").onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.8);
  $("z-reset").onclick = () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);

  let resizeTimer, lastW = 0, lastH = 0;
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (!G.region || $("game").hidden || (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 2)) return;
    lastW = width; lastH = height;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawMap();
      if (G.revealing) addLabel(G.revealing);
    }, 150);
  }).observe($("mapwrap"));

  setMode(mode);
})();
