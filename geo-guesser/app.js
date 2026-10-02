(() => {
  "use strict";
  const MAX_TRIES = 3;
  const MARKER_PX = 10; // countries smaller than this on screen get a clickable marker
  const REVEAL_MS = 2600; // how long a missed country stays labelled (input is never blocked meanwhile)
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Motion ----------
  // Springs are described the way Apple does: damping ratio (1 = no overshoot) and response (seconds).
  function spring({ from, to, velocity = 0, response = 0.35, damping = 1, onUpdate, onDone }) {
    const stiffness = (2 * Math.PI / response) ** 2;
    const friction = (4 * Math.PI * damping) / response;
    let x = from, v = velocity, last = performance.now(), raf = 0;
    const handle = { stop() { cancelAnimationFrame(raf); raf = 0; }, get value() { return x; }, get running() { return raf !== 0; } };
    if (reduceMotion.matches) { x = to; onUpdate(to, 0); onDone && onDone(); return handle; }
    function step(now) {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
      for (let i = 0; i < n; i++) { v += (-stiffness * (x - to) - friction * v) * h; x += v * h; }
      if (Math.abs(v) < 2 && Math.abs(x - to) < 0.3) { x = to; raf = 0; onUpdate(x, 0); onDone && onDone(); return; }
      onUpdate(x, v);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return handle;
  }
  // Critically damped spring sampled as an easing curve, for CSS transitions and d3 zoom transitions.
  const EASE_RESPONSE = 0.35;
  const EASE_OMEGA = (2 * Math.PI) / EASE_RESPONSE;
  const EASE_MS = Math.round((9.23 / EASE_OMEGA) * 1000); // time to settle within 0.1%
  const springEase = (t) => { const s = 9.23 * t; return (1 - (1 + s) * Math.exp(-s)) / (1 - 10.23 * Math.exp(-9.23)); };
  (function exposeEasing() {
    const pts = Array.from({ length: 33 }, (_, i) => +springEase(i / 32).toFixed(4));
    const value = `linear(${pts.join(", ")})`;
    if (window.CSS && CSS.supports("transition-timing-function", value)) {
      document.documentElement.style.setProperty("--ease-spring", value);
      document.documentElement.style.setProperty("--spring-ms", EASE_MS + "ms");
    }
  })();
  const transitionMs = () => (reduceMotion.matches ? 0 : EASE_MS);
  const rubberband = (overshoot, dimension, c = 0.55) => (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const haptic = (pattern) => { try { navigator.vibrate && navigator.vibrate(pattern); } catch {} };

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

  // ---------- Home ----------
  let mode = "click";
  try { mode = localStorage.getItem("atlas-drill:mode") || "click"; } catch {}
  function setMode(m) {
    mode = m;
    $("seg").dataset.mode = m;
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
      const notable = g.name === "Notable groups";
      const sec = document.createElement("section");
      sec.className = "group";
      sec.innerHTML = `<h2 class="t-title">${g.name}${notable ? "" : ` <small>${g.regions[0].ids.length} countries</small>`}</h2><div class="cards"></div>`;
      const cards = sec.querySelector(".cards");
      for (const r of g.regions) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "card press";
        const best = getBest(r.id, mode);
        b.innerHTML = `<span class="t-headline">${r.name}</span>
          <span class="meta t-foot"><span>${r.ids.length} countries</span>${best ? `<span class="best">Best ${best.acc}% · ${fmtTime(best.ms)}</span>` : ""}</span>
          <span class="frame">${frameText(r.bbox)}</span>`;
        b.onclick = () => startGame(r, r.ids);
        cards.appendChild(b);
      }
      root.appendChild(sec);
    }
  }

  // ---------- Map ----------
  const svg = d3.select("#map");
  const zoomLayer = svg.append("g");
  let landSel, markerSel, hitSel, labelLayer, zoomK = 1, sizeOf = new Map();
  let W = 0, H = 0, insetTop = 0, insetBottom = 0;
  let dragging = false, history = [], inertia = 0;

  const panBounds = (k) => ({ minX: W - W * k, maxX: 0, minY: H - H * k, maxY: 0 });
  // Past the edge the map resists progressively instead of stopping dead.
  const soft = (v, lo, hi, dim) => (v > hi ? hi + rubberband(v - hi, dim) : v < lo ? lo - rubberband(lo - v, dim) : v);

  const zoom = d3.zoom()
    .scaleExtent([1, 80])
    .clickDistance(6)
    .constrain((t) => {
      const b = panBounds(t.k);
      if (dragging && !reduceMotion.matches) {
        history.push({ t: performance.now(), x: t.x, y: t.y });
        if (history.length > 10) history.shift();
        return d3.zoomIdentity.translate(soft(t.x, b.minX, b.maxX, W), soft(t.y, b.minY, b.maxY, H)).scale(t.k);
      }
      return d3.zoomIdentity.translate(clamp(t.x, b.minX, b.maxX), clamp(t.y, b.minY, b.maxY)).scale(t.k);
    })
    .on("start", (e) => {
      if (!e.sourceEvent) return;
      stopInertia(); // grabbing a moving map stops it where it is
      const type = e.sourceEvent.type;
      dragging = type === "mousedown" || type === "touchstart" || type === "pointerdown";
      history = [];
    })
    .on("zoom", (e) => {
      zoomLayer.attr("transform", e.transform);
      zoomK = e.transform.k;
      applyZoomScale();
      if (e.sourceEvent && /move/.test(e.sourceEvent.type)) releasePress();
    })
    .on("end", (e) => {
      if (!e.sourceEvent || !dragging) return;
      dragging = false;
      const now = performance.now();
      const recent = history.filter((s) => now - s.t < 100);
      let vx = 0, vy = 0;
      if (recent.length >= 2 && now - recent[recent.length - 1].t < 50) {
        const a = recent[0], b = recent[recent.length - 1], dt = (b.t - a.t) / 1000;
        if (dt > 0) { vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt; }
      }
      startInertia(d3.zoomTransform(svg.node()), vx, vy);
    });
  svg.call(zoom).on("dblclick.zoom", null);

  // After a drag the map keeps the finger's velocity and decays like a scroll view;
  // anything past an edge springs back, carrying the same velocity into the spring.
  function startInertia(t0, vx, vy) {
    stopInertia();
    if (reduceMotion.matches) { vx = vy = 0; }
    const b = panBounds(t0.k);
    const axes = [
      { p: t0.x, v: vx, lo: b.minX, hi: b.maxX },
      { p: t0.y, v: vy, lo: b.minY, hi: b.maxY },
    ];
    const omega = (2 * Math.PI) / 0.4, stiffness = omega * omega, friction = 2 * omega;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
      let moving = false;
      for (const a of axes) {
        for (let i = 0; i < n; i++) {
          if (a.p > a.hi || a.p < a.lo) {
            const edge = a.p > a.hi ? a.hi : a.lo;
            a.v += (-stiffness * (a.p - edge) - friction * a.v) * h;
          } else {
            a.v *= Math.pow(0.998, h * 1000);
          }
          a.p += a.v * h;
        }
        const outside = a.p > a.hi + 0.3 || a.p < a.lo - 0.3;
        if (Math.abs(a.v) > 4 || outside) moving = true;
        else { a.v = 0; a.p = clamp(a.p, a.lo, a.hi); }
      }
      svg.call(zoom.transform, d3.zoomIdentity.translate(axes[0].p, axes[1].p).scale(t0.k));
      inertia = moving ? requestAnimationFrame(frame) : 0;
    };
    inertia = requestAnimationFrame(frame);
  }
  function stopInertia() { if (inertia) cancelAnimationFrame(inertia); inertia = 0; }

  function makeProjection(region, w, h) {
    let [Wb, S, E, N] = region.bbox;
    if (E < Wb) E += 360;
    const pts = [];
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) pts.push([Wb + ((E - Wb) * i) / 12, S + ((N - S) * j) / 12]);
    const p = d3.geoAzimuthalEqualArea().rotate([-(Wb + E) / 2, -(S + N) / 2]).clipAngle(90).precision(0.2);
    const pad = Math.min(24, w * 0.04);
    p.fitExtent([[pad, insetTop + pad / 2], [w - pad, h - insetBottom]], { type: "MultiPoint", coordinates: pts });
    p.clipExtent([[-4, -4], [w + 4, h + 4]]);
    return { p, center: [(Wb + E) / 2, (S + N) / 2] };
  }

  function drawMap() {
    stopInertia();
    const box = $("game").getBoundingClientRect();
    W = Math.max(320, box.width); H = Math.max(240, box.height);
    lastW = box.width; lastH = box.height;
    insetTop = $("strip").offsetHeight;
    insetBottom = Math.min(72, H * 0.1);
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    zoomLayer.selectAll("*").remove();
    const { p, center } = makeProjection(G.region, W, H);
    const path = d3.geoPath(p);
    $("proj").textContent = `Lambert azimuthal equal-area · ${fmtLat(center[1])} ${fmtLon(center[0])}`;

    zoom.extent([[0, 0], [W, H]]).translateExtent([[0, 0], [W, H]]);
    zoomLayer.append("rect").attr("class", "sea").attr("width", W).attr("height", H);
    zoomLayer.append("path").attr("class", "grat").attr("d", path(d3.geoGraticule().step([10, 10])()));

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
        if (xy && xy[0] >= 0 && xy[0] <= W && xy[1] >= 0 && xy[1] <= H) markers.push({ id: f.id, x: xy[0], y: xy[1], size });
      }
    }
    G.labelPoint = (id) => { const f = byId.get(id); return f && p(f.properties.l); };
    markerSel = zoomLayer.append("g").selectAll("circle").data(markers).join("circle")
      .attr("class", "mk").attr("data-id", (m) => m.id).attr("cx", (m) => m.x).attr("cy", (m) => m.y);
    // Generous invisible hit targets around small markers.
    hitSel = zoomLayer.append("g").selectAll("circle").data(markers).join("circle")
      .attr("class", "mkhit").attr("data-hit", (m) => m.id).attr("cx", (m) => m.x).attr("cy", (m) => m.y);
    labelLayer = zoomLayer.append("g");

    for (const sel of [landSel, hitSel]) {
      const idOf = (d) => (d.f ? d.f.id : d.id);
      sel.on("pointerdown", (e, d) => press(idOf(d)))
        .on("click", (e, d) => onMapClick(idOf(d)))
        .on("pointermove", (e, d) => showTip(e, idOf(d)))
        .on("pointerleave", hideTip);
    }

    svg.call(zoom.transform, d3.zoomIdentity);
    paintAll();
    for (const id of G.reveals.keys()) addLabel(id);
  }

  function applyZoomScale() {
    if (!markerSel) return;
    const hide = (m) => (m.size * zoomK > 16 ? "none" : null);
    markerSel.attr("r", 5.5 / zoomK).attr("display", hide);
    hitSel.attr("r", 15 / zoomK).attr("display", hide);
    labelLayer.selectAll("text").attr("font-size", 13 / zoomK).style("stroke-width", 3.5 / zoomK + "px");
  }

  // Feedback on pointer-down; the answer itself commits on release (click).
  function press(id) {
    if (G.over || G.mode !== "click") return;
    zoomLayer.selectAll(`[data-id="${id}"]`).classed("pressed", true);
  }
  function releasePress() { zoomLayer.selectAll(".pressed").classed("pressed", false); }
  window.addEventListener("pointerup", () => requestAnimationFrame(releasePress));
  window.addEventListener("pointercancel", releasePress);

  function classFor(id) {
    const r = G.results.get(id);
    return r === 1 ? "r1" : r === 2 ? "r2" : r === 3 ? "r3" : r === 0 ? "rmiss" : "";
  }
  function paint(id) {
    const cls = classFor(id);
    const cur = G.mode === "type" && G.current === id && !G.over ? " current" : "";
    const rev = G.reveals.has(id) ? " reveal" : "";
    zoomLayer.selectAll(`[data-id="${id}"]`).each(function () {
      const base = this.tagName === "circle" ? "mk" : "land " + (G.set.has(id) ? "on" : "off");
      this.setAttribute("class", `${base} ${cls}${cur}${rev}`.trim());
    });
  }
  function paintAll() { for (const id of G.set) paint(id); applyZoomScale(); }

  function flashWrong(id) {
    const els = zoomLayer.selectAll(`[data-id="${id}"]`);
    els.classed("wrongflash", true);
    setTimeout(() => els.classed("wrongflash", false), 650);
  }
  function addLabel(id) {
    const xy = G.labelPoint && G.labelPoint(id);
    if (!xy || !labelLayer) return;
    labelLayer.selectAll(`[data-label="${id}"]`).remove();
    labelLayer.append("text").attr("class", "lbl").attr("data-label", id).attr("x", xy[0]).attr("y", xy[1] - 9 / zoomK).text(nameOf(id));
    applyZoomScale();
  }
  function removeLabel(id) { labelLayer && labelLayer.selectAll(`[data-label="${id}"]`).remove(); }
  function clearLabels() { labelLayer && labelLayer.selectAll("text").remove(); }

  // Zoom in on a tiny country so a revealed or highlighted microstate is actually visible.
  function focusOn(id) {
    const size = sizeOf.get(id);
    const xy = G.labelPoint(id);
    if (!xy || size === undefined || size * zoomK >= 6) return;
    stopInertia();
    const k = Math.min(12, Math.max(zoomK, 4));
    const cy = (insetTop + H - insetBottom) / 2;
    svg.transition().duration(transitionMs()).ease(springEase)
      .call(zoom.transform, d3.zoomIdentity.translate(W / 2 - k * xy[0], cy - k * xy[1]).scale(k));
  }

  // ---------- Tooltip & toast ----------
  const tip = $("tip");
  function showTip(e, id) {
    const open = G.over || (G.results.has(id) && !(G.mode === "type" && G.current === id));
    if (!open || e.pointerType === "touch") return hideTip();
    const box = $("game").getBoundingClientRect();
    tip.textContent = nameOf(id);
    tip.hidden = false;
    tip.style.left = Math.min(e.clientX - box.left + 14, box.width - tip.offsetWidth - 8) + "px";
    tip.style.top = e.clientY - box.top + 16 + "px";
  }
  function hideTip() { tip.hidden = true; }

  let toastTimer;
  function toast(text, kind = "") {
    const t = $("toast");
    const glyph = kind === "good" ? "✓" : kind === "bad" ? "✕" : "";
    t.innerHTML = `${glyph ? `<span class="glyph" aria-hidden="true">${glyph}</span>` : ""}<span></span>`;
    t.lastChild.textContent = text;
    t.className = `toast glass ${kind}`;
    t.style.setProperty("--toast-y", `${$("strip").offsetHeight + 12}px`);
    void t.offsetWidth;
    t.classList.add("show"); // drops in from the top and leaves the same way
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  // ---------- Game state ----------
  const G = { results: new Map(), set: new Set(), reveals: new Map() };
  let timerId;

  function startGame(region, ids) {
    for (const timer of G.reveals.values()) clearTimeout(timer);
    Object.assign(G, {
      region, mode, ids, set: new Set(region.ids), queue: shuffle(ids), idx: 0, tries: 0,
      results: new Map(), reveals: new Map(), over: false, current: null, start: performance.now(), elapsed: 0,
    });
    $("home").hidden = true;
    $("game").hidden = false;
    hideSheet();
    $("prompt").innerHTML = "";
    $("where").textContent = `${region.name} · ${G.mode === "click" ? "Click mode" : "Type mode"}`;
    $("game").className = "mode-" + G.mode;
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
    return `<span class="tries" role="img" aria-label="${MAX_TRIES - G.tries} of ${MAX_TRIES} tries left">${Array.from({ length: MAX_TRIES }, (_, i) => `<i class="${i < G.tries ? "used" : ""}"></i>`).join("")}</span>`;
  }

  function renderPrompt() {
    const el = $("prompt");
    if (G.over) { el.innerHTML = `<span class="target">Finished</span>`; return; }
    if (G.mode === "click") {
      el.innerHTML = `<span class="verb t-cap">Find</span><span class="target">${nameOf(G.current)}</span>${triesDots()}`;
      return;
    }
    const input = $("guess");
    if (input) { input.value = ""; input.classList.remove("invalid"); updateTries(); return; }
    el.innerHTML = `<form class="answer" id="answer" autocomplete="off">
        <input id="guess" type="text" placeholder="Country name" aria-label="Name the highlighted country" spellcheck="false" autocapitalize="off" enterkeyhint="go">
        <button class="btn press" type="submit">Guess</button>
        <button class="btn plain press" type="button" id="skip">Skip</button>
      </form>${triesDots()}`;
    $("answer").onsubmit = (e) => { e.preventDefault(); onTyped($("guess").value); };
    $("guess").oninput = () => $("guess").classList.remove("invalid");
    $("skip").onclick = () => giveUp();
    if (window.matchMedia("(pointer: fine)").matches) $("guess").focus();
  }
  function updateTries() {
    const t = document.querySelector("#prompt .tries");
    if (t) t.outerHTML = triesDots();
  }

  function nextPrompt() {
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
    G.results.set(G.current, result);
    paint(G.current);
    updateStats();
  }

  function onMapClick(id) {
    if (G.over || G.mode !== "click") return;
    if (id === G.current) {
      settle(G.tries + 1);
      haptic(8);
      toast(nameOf(id), "good");
      nextPrompt();
      return;
    }
    G.tries++;
    flashWrong(id);
    haptic(18);
    if (G.tries >= MAX_TRIES) return reveal(`That's ${nameOf(id)}. ${nameOf(G.current)} is shown in red`);
    const left = MAX_TRIES - G.tries;
    toast(`That's ${nameOf(id)}. ${left} ${left === 1 ? "try" : "tries"} left`, "bad");
    updateTries();
  }

  function onTyped(text) {
    if (G.over || !text.trim()) return;
    const id = identify(text);
    const input = $("guess");
    if (id === G.current) {
      settle(G.tries + 1);
      haptic(8);
      toast(nameOf(id), "good");
      nextPrompt();
      return;
    }
    input.classList.add("invalid");
    if (!id) { toast("Not a country name I recognise"); return; }
    G.tries++;
    haptic(18);
    if (G.tries >= MAX_TRIES) return reveal(`It was ${nameOf(G.current)}`);
    const left = MAX_TRIES - G.tries;
    toast(`Not ${nameOf(id)}. ${left} ${left === 1 ? "try" : "tries"} left`, "bad");
    input.select();
    updateTries();
  }

  function giveUp() {
    if (G.over) return;
    G.tries = MAX_TRIES;
    reveal(`Skipped: it was ${nameOf(G.current)}`);
  }

  // The missed country stays marked and labelled for a moment, but the next prompt starts immediately.
  function reveal(msg) {
    const id = G.current;
    settle(0);
    haptic([24, 60, 24]);
    clearTimeout(G.reveals.get(id));
    G.reveals.set(id, setTimeout(() => { G.reveals.delete(id); removeLabel(id); paint(id); }, REVEAL_MS));
    paint(id);
    addLabel(id);
    toast(msg, "bad");
    if (G.mode === "click") focusOn(id);
    nextPrompt();
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
    const sw = (c) => `<i style="width:.6rem;height:.6rem;border-radius:50%;display:inline-block;background:var(${c})"></i>`;
    const bestNote = newBest ? "New best for this region and mode."
      : best && fullRun ? `Your best: ${best.acc}% in ${fmtTime(best.ms)}.`
      : fullRun ? "" : "Rounds on missed countries don't count toward your best.";
    $("sheet-body").innerHTML = `
      <h2 class="t-title" id="sheet-title" data-drag>${G.region.name}${fullRun ? "" : " · missed ones"}</h2>
      <div class="figures">
        <div><b>${acc}%</b><span class="t-cap">Accuracy</span></div>
        <div><b>${fmtTime(G.elapsed)}</b><span class="t-cap">Time</span></div>
      </div>
      <div class="breakdown t-foot">
        <span>${sw("--green")} 1st try ${counts[0]}</span>
        <span>${sw("--yellow")} 2nd ${counts[1]}</span>
        <span>${sw("--orange")} 3rd ${counts[2]}</span>
        <span>${sw("--red")} Missed ${counts[3]}</span>
      </div>
      ${missed.length ? `<div><p class="note t-foot">Missed. Tap one to see it on the map.</p><div class="chips">${missed.map((id) => `<button type="button" class="press" data-id="${id}">${nameOf(id)}</button>`).join("")}</div></div>` : `<p class="note t-foot">No misses.</p>`}
      <p class="note t-foot">${bestNote} Accuracy gives full credit on the 1st try, two-thirds on the 2nd and one-third on the 3rd. Drag this sheet down to explore the map; hovering shows every name.</p>
      <div class="actions">
        ${missed.length ? `<button class="btn press" type="button" id="r-missed">Retry ${missed.length} missed</button>` : ""}
        <button class="btn press ${missed.length ? "plain" : ""}" type="button" id="r-again">Play again</button>
        <button class="btn plain press" type="button" id="r-home">Choose region</button>
      </div>`;
    $("sheet-body").querySelectorAll(".chips button").forEach((b) => (b.onclick = () => {
      closeSheet(0, () => { clearLabels(); addLabel(b.dataset.id); focusOn(b.dataset.id); });
    }));
    if (missed.length) $("r-missed").onclick = () => startGame(G.region, missed);
    $("r-again").onclick = () => startGame(G.region, G.region.ids);
    $("r-home").onclick = goHome;
    openSheet();
  }

  // ---------- Results sheet ----------
  const sheet = $("sheet"), scrim = $("scrim");
  let sheetY = 0, closedY = 0, sheetAnim = null, sheetDrag = null;
  function setSheetY(y) {
    sheetY = y;
    sheet.style.transform = `translateY(${y}px)`;
    scrim.style.opacity = closedY ? clamp(1 - y / closedY, 0, 1) : 1;
  }
  function measureSheet() {
    const r = sheet.getBoundingClientRect(), g = $("game").getBoundingClientRect();
    closedY = g.bottom - (r.top - sheetY) + 8; // far enough to sit fully below the bottom edge
  }
  function openSheet() {
    sheet.hidden = false; scrim.hidden = false;
    sheetAnim && sheetAnim.stop();
    sheetY = 0; sheet.style.transform = "none";
    measureSheet();
    setSheetY(closedY);
    sheetAnim = spring({ from: closedY, to: 0, response: 0.35, damping: 1, onUpdate: setSheetY });
    $("prompt").innerHTML = `<span class="target">Finished</span>`;
  }
  // Leaves along the same path it arrived on, continuing whatever velocity the finger gave it.
  function closeSheet(velocity = 0, after) {
    sheetAnim && sheetAnim.stop();
    measureSheet();
    sheetAnim = spring({
      from: sheetY, to: closedY, velocity, response: 0.3, damping: 1, onUpdate: setSheetY,
      onDone: () => { hideSheet(); showReturn(); after && after(); },
    });
  }
  function hideSheet() { sheetAnim && sheetAnim.stop(); sheetDrag = null; sheet.hidden = true; scrim.hidden = true; }
  function showReturn() {
    $("prompt").innerHTML = `<button class="btn press" type="button" id="r-show">Show results</button>`;
    $("r-show").onclick = openSheet;
  }

  sheet.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("[data-drag], .grabber") || e.button > 0) return;
    const wasMoving = sheetAnim && sheetAnim.running;
    sheetAnim && sheetAnim.stop(); // grab it mid-flight: continue from where it is on screen
    sheetDrag = { id: e.pointerId, y0: e.clientY, from: sheetY, live: wasMoving, hist: [{ t: e.timeStamp, y: e.clientY }] };
    sheet.setPointerCapture(e.pointerId);
  });
  sheet.addEventListener("pointermove", (e) => {
    const d = sheetDrag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.live) {
      if (Math.abs(e.clientY - d.y0) < 10) return; // small hysteresis before committing to a drag
      d.live = true; d.y0 = e.clientY;
    }
    const raw = d.from + (e.clientY - d.y0);
    setSheetY(raw < 0 ? -rubberband(-raw, sheet.offsetHeight) : raw);
    d.hist.push({ t: e.timeStamp, y: e.clientY });
    if (d.hist.length > 8) d.hist.shift();
  });
  const endSheetDrag = (e) => {
    const d = sheetDrag;
    if (!d || e.pointerId !== d.id) return;
    sheetDrag = null;
    if (!d.live) return;
    const recent = d.hist.filter((s) => e.timeStamp - s.t < 100);
    let v = 0;
    if (recent.length >= 2) { const a = recent[0], b = recent[recent.length - 1]; if (b.t > a.t) v = ((b.y - a.y) / (b.t - a.t)) * 1000; }
    if (e.timeStamp - d.hist[d.hist.length - 1].t > 60) v = 0;
    // Decide from where the flick is heading, not where the finger let go.
    if (sheetY + project(v) > closedY * 0.45) closeSheet(v);
    else sheetAnim = spring({ from: sheetY, to: 0, velocity: v, response: 0.3, damping: Math.abs(v) > 300 ? 0.8 : 1, onUpdate: setSheetY });
  };
  sheet.addEventListener("pointerup", endSheetDrag);
  sheet.addEventListener("pointercancel", endSheetDrag);
  scrim.addEventListener("click", () => closeSheet());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });

  function goHome() {
    clearInterval(timerId);
    G.over = true;
    stopInertia();
    hideSheet();
    $("game").hidden = true;
    $("home").hidden = false;
    renderHome();
  }
  $("back").onclick = goHome;

  const zoomBy = (f) => { stopInertia(); svg.transition().duration(transitionMs()).ease(springEase).call(zoom.scaleBy, f); };
  $("z-in").onclick = () => zoomBy(1.8);
  $("z-out").onclick = () => zoomBy(1 / 1.8);
  $("z-reset").onclick = () => { stopInertia(); svg.transition().duration(transitionMs()).ease(springEase).call(zoom.transform, d3.zoomIdentity); };

  let resizeTimer, lastW = 0, lastH = 0;
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (!G.region || $("game").hidden || (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 2)) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawMap, 150);
  }).observe($("game"));

  setMode(mode);
})();
