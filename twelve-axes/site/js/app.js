/* Twelve Axes: interface. */
(function () {
  var TA = window.TA, E = TA.engine;
  var app = document.getElementById('app');
  var KEY = 'twelveAxes.v2';
  var LIKERT = ['Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neutral', 'Somewhat agree', 'Agree', 'Strongly agree'];
  var CHOICE = ['Strongly A', 'Lean A', 'Neither', 'Lean B', 'Strongly B'];
  var SIZES7 = ['s3', 's2', 's1', 's0', 's1', 's2', 's3'];
  var SIZES5 = ['s3', 's1', 's0', 's1', 's3'];
  var CORE_N = TA.items.filter(function (i) { return i.part === 'core'; }).length;
  var THEORY_N = TA.items.filter(function (i) { return i.part === 'theory'; }).length;
  var inFrame = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

  var S = fresh();
  function fresh() {
    return { phase: 'intro', answers: {}, queue: [], pos: 0, segs: [], next: null, mods: [], shared: false, done: false };
  }

  /* ---------- persistence ---------- */
  function save() {
    if (S.shared) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.answers ? s : null; } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function famName(id) { return E.famById[id].n; }
  function famCount(id) { return TA.tendencies.filter(function (t) { return t.fam === id; }).length; }
  function modCount(id) { return TA.items.filter(function (i) { return i.part === 'mod' && i.fam === id; }).length; }
  function pct(v) { return Math.round(v); }
  function signed(v) { var n = Math.round(v * 100); return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n); }
  function labelFor(item, e) {
    if (item.t === 'm') { var t = item.opts[e].t; return String.fromCharCode(65 + e) + ': ' + (t.length > 90 ? t.slice(0, 88).replace(/\s+\S*$/, '') + '\u2026' : t); }
    return item.t === 'c' ? CHOICE[Math.max(0, Math.min(4, Math.round(e * 2) + 2))] : LIKERT[Math.max(0, Math.min(6, Math.round(e * 3) + 3))];
  }
  var MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    (function () { var s = ''; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 12, x = 14 * Math.cos(a), y = 14 * Math.sin(a); s += '<line x1="' + (16 - x).toFixed(2) + '" y1="' + (16 - y).toFixed(2) + '" x2="' + (16 + x).toFixed(2) + '" y2="' + (16 + y).toFixed(2) + '"/>'; } return s; })() +
    '</g><circle cx="16" cy="16" r="3.2" fill="currentColor"/></svg>';
  function mast(meta) {
    return '<header class="mast"><button class="mark" data-act="home" aria-label="Twelve Axes, back to start">' + MARK + '<b>Twelve Axes</b></button>' +
      '<div class="meta">' + (meta || TA.tendencies.length + ' tendencies &middot; 12 axes') + '</div></header>';
  }
  function render(html) { app.innerHTML = html; window.scrollTo(0, 0); }

  /* ---------- flow ---------- */
  function addSegment(ids, label, next) {
    S.segs.push({ start: S.queue.length, len: ids.length, label: label });
    S.queue = S.queue.concat(ids);
    S.next = next;
  }
  function start() {
    S = fresh();
    S.phase = 'q';
    addSegment(E.part1Order(), 'Part 1 · Core', 'pickMods');
    save(); show();
  }
  function atEnd() {
    if (S.next === 'pickMods') {
      S.mods = E.pickModules(S.answers);
      addSegment(E.moduleOrder(S.mods), 'Part 2 · ' + S.mods.map(famName).join(' / '), 'theoryOffer');
      S.phase = 'interlude';
    } else if (S.next === 'theoryOffer') {
      S.phase = 'theoryOffer';
    } else {
      S.phase = 'results';
    }
    save(); show();
  }
  function answer(code) {
    var id = S.queue[S.pos];
    S.answers[id] = code;
    S.pos++;
    save();
    if (S.pos >= S.queue.length) atEnd(); else show();
  }
  function back() {
    if (S.pos > 0) { S.pos--; S.phase = 'q'; save(); show(); }
  }
  function show() {
    if (S.phase === 'q') return renderQ();
    if (S.phase === 'interlude') return renderInterlude();
    if (S.phase === 'theoryOffer') return renderTheoryOffer();
    if (S.phase === 'results') return renderResults();
    renderIntro();
  }

  /* ---------- intro ---------- */
  function renderIntro() {
    var saved = load();
    var resumable = saved && saved.phase !== 'intro' && Object.keys(saved.answers).length;
    var axes = TA.axes.map(function (a, i) {
      return '<li><span class="no">' + (i + 1) + '</span><div><div class="nm">' + esc(a.n) + '</div><div class="poles">' + esc(a.neg) + ' ↔ ' + esc(a.pos) + '</div></div></li>';
    }).join('');
    var fams = TA.families.map(function (f) { return '<span class="chip">' + esc(f.n) + '<i>' + famCount(f.id) + '</i></span>'; }).join('');
    render(mast() +
      '<main>' +
      '<div class="eyebrow">A socialist tendency test</div>' +
      '<h1 class="display" style="margin-top:0.5rem">Twelve Axes</h1>' +
      '<p class="lede">Find where you stand among ' + TA.tendencies.length + ' tendencies of the socialist left, from Marxism-Leninism and council communism to mutualism, liberation theology and degrowth communism.</p>' +
      '<div class="facts"><span><b>' + CORE_N + '</b> core questions</span><span><b>25&ndash;40</b> drill-down questions</span><span><b>' + THEORY_N + '</b> optional theory questions</span><span><b>35&ndash;50</b> minutes</span></div>' +
      '<div class="row">' +
      (resumable ? '<button class="btn primary" data-act="resume">Resume where you left off</button><button class="btn" data-act="restart-confirm">Start over</button>'
        : '<button class="btn primary" data-act="start">Start the test</button>') +
      '</div>' +
      '<h2 class="sec">How it works</h2>' +
      '<ol class="steps">' +
      '<li><span class="no">1</span><div><b>Core.</b> Everyone answers the same ' + CORE_N + ' questions on the twelve axes, plus shorter blocks on capitalism, religion, legality and violence, social values, the national question, liberation politics, self-management beyond the workplace, and technology and AI. Many questions are scenarios with several answers, including in-between positions.</div></li>' +
      '<li><span class="no">2</span><div><b>Drill-down.</b> The test picks the two families of tendencies closest to your answers (three when the race is close) and asks 10 to 16 targeted questions from each to separate the tendencies inside them.</div></li>' +
      '<li><span class="no">3</span><div><b>Theory (optional).</b> ' + THEORY_N + ' questions place you among ' + TA.schools.length + ' schools of Marxist theory, from dialectical materialism and Political Marxism to value-form and social reproduction theory.</div></li>' +
      '</ol>' +
      '<p class="muted small" style="margin-top:1rem">Answer what you actually think, not what your tradition is supposed to think. Pick the option closest to your view even when none is exact. Use "Unsure" for questions you have no view on, and "Unfamiliar" for historical events you don\'t know. Skipped questions are left out of the scoring. Your progress is saved in this browser.</p>' +
      '<h2 class="sec">The twelve axes</h2>' +
      '<ul class="axes-list">' + axes + '</ul>' +
      '<h2 class="sec">Families covered <small>tendencies per family</small></h2>' +
      '<div class="fams">' + fams + '</div>' +
      '<h2 class="sec">Have a results code?</h2>' +
      '<form class="code-entry" id="codeForm"><input id="codeIn" aria-label="Results code" placeholder="Paste a code starting with R2" autocomplete="off" spellcheck="false"><button class="btn" type="submit">View results</button></form>' +
      '<div class="err" id="codeErr" hidden>That code isn\'t valid. Check that you copied all of it.</div>' +
      '</main>' + foot());
    var form = document.getElementById('codeForm');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = E.decode(document.getElementById('codeIn').value.trim().replace(/^#/, ''));
      if (!a || !Object.keys(a).length) { document.getElementById('codeErr').hidden = false; return; }
      S = fresh(); S.answers = a; S.phase = 'results'; S.shared = true; show();
    });
  }
  function foot() {
    return '<footer class="foot">Twelve Axes scores you against hand-built profiles of each tendency. A match describes how close your answers are to that tradition\'s positions, not which group you should join.</footer>';
  }

  /* ---------- question ---------- */
  function segOf(pos) {
    for (var i = S.segs.length - 1; i >= 0; i--) if (pos >= S.segs[i].start) return S.segs[i];
    return S.segs[0];
  }
  function renderQ() {
    var id = S.queue[S.pos], it = E.itemById[id], seg = segOf(S.pos);
    var n = S.pos - seg.start + 1, code = S.answers[id] || 0;
    var size = E.scaleSize(it), labels = it.t === 'c' ? CHOICE : LIKERT, sizes = it.t === 'c' ? SIZES5 : SIZES7;
    var answerUi;
    if (it.t === 'm') {
      answerUi = '<div class="mc" role="group" aria-labelledby="qtext">' + it.opts.map(function (o, k) {
        return '<button class="mopt' + (code === k + 2 ? ' on' : '') + '" data-code="' + (k + 2) + '" aria-pressed="' + (code === k + 2) + '"><b>' + String.fromCharCode(65 + k) + '</b><span>' + esc(o.t) + '</span></button>';
      }).join('') + '</div>';
    } else {
      var dots = '';
      for (var k = 0; k < size; k++) {
        dots += '<button class="dot ' + sizes[k] + (code === k + 2 ? ' on' : '') + '" data-code="' + (k + 2) + '" aria-label="' + esc(labels[k]) + '" aria-pressed="' + (code === k + 2) + '" title="' + esc(labels[k]) + '"></button>';
      }
      answerUi = (it.t === 'c' ? '<div class="opts"><div class="opt"><b>A</b><span>' + esc(it.opts[0]) + '</span></div><div class="opt"><b>B</b><span>' + esc(it.opts[1]) + '</span></div></div>' : '') +
        '<div class="scale" role="group" aria-labelledby="qtext">' + dots + '</div>' +
        '<div class="scale-ends" aria-hidden="true"><span>' + (it.t === 'c' ? 'A' : 'Disagree') + '</span><span>' + (it.t === 'c' ? 'Neither' : 'Neutral') + '</span><span>' + (it.t === 'c' ? 'B' : 'Agree') + '</span></div>';
    }
    var html = mast(esc(seg.label)) +
      '<main>' +
      '<div class="qtop"><span>' + esc(seg.label) + '</span><span class="count">' + n + ' / ' + seg.len + '</span></div>' +
      '<div class="bar" aria-hidden="true"><span style="width:' + (100 * (n - 1) / seg.len).toFixed(1) + '%"></span></div>' +
      (it.h ? '<div class="ctx"><span class="eyebrow">Historical context</span>' + esc(it.ctx) + '</div>' : '') +
      '<p class="qtext' + (it.t === 'm' ? ' short' : '') + '" id="qtext">' + esc(it.q) + '</p>' +
      answerUi +
      (it.t === 'm' ? '' : '<div class="pick" id="pick" aria-live="polite">' + (code >= 2 ? esc(labels[code - 2]) : code === 1 ? (it.h ? 'Unfamiliar' : 'Unsure') : '') + '</div>') +
      '<div class="qfoot">' +
      '<button class="btn ghost" data-act="back"' + (S.pos === 0 ? ' disabled' : '') + '>← Back</button>' +
      '<button class="btn ghost unsure' + (code === 1 ? ' on' : '') + '" data-code="1">' + (it.h ? 'Unfamiliar with this' : it.t === 'm' ? 'None of these / unsure' : 'Unsure / no view') + '</button>' +
      (S.done ? '<button class="btn" data-act="results">Back to results</button>' : '') +
      '</div>' +
      '<div class="keys">Keys: ' + (it.t === 'm' ? 'A–' + String.fromCharCode(64 + size) : '1–' + size) + ' to answer, 0 for ' + (it.h ? 'unfamiliar' : 'unsure') + ', Backspace to go back</div>' +
      '</main>';
    render(html);
    app.querySelectorAll('.dot').forEach(function (b) {
      b.addEventListener('mouseenter', function () { document.getElementById('pick').textContent = b.getAttribute('aria-label'); });
      b.addEventListener('mouseleave', function () {
        var c = S.answers[id] || 0;
        document.getElementById('pick').textContent = c >= 2 ? labels[c - 2] : '';
      });
    });
  }
  var busy = false;
  function choose(code) {
    if (busy) return;
    busy = true;
    app.querySelectorAll('[data-code]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-code') === code); });
    setTimeout(function () { busy = false; answer(code); }, 140);
  }

  /* ---------- interludes ---------- */
  function renderInterlude() {
    var fams = E.rankFamilies(E.scoreTendencies(S.answers)).slice(0, 4);
    var list = fams.map(function (f) {
      var drilled = S.mods.indexOf(f.fam) >= 0;
      return '<div><span>' + (drilled ? '<b>' + esc(famName(f.fam)) + '</b>' : esc(famName(f.fam))) + '</span><span>' + pct(f.fit) + '% best fit</span></div>';
    }).join('');
    var seg = S.segs[S.segs.length - 1];
    render(mast('Part 1 complete') + '<main><div class="panel">' +
      '<div class="eyebrow">Part 1 complete</div>' +
      '<h2 style="font:800 2rem/1 var(--display);text-transform:uppercase;margin-top:0.5rem">Your closest families</h2>' +
      '<div class="fam-pick">' + list + '</div>' +
      '<p>Part 2 has ' + seg.len + ' questions from the <b>' + S.mods.map(famName).map(esc).join('</b>, <b>') + '</b> modules' + (S.mods.length > 2 ? ', because your second and third families were nearly tied' : '') + '. They are written to separate tendencies that look alike on the twelve axes.</p>' +
      '<div class="row"><button class="btn primary" data-act="continue">Continue to Part 2</button><button class="btn ghost" data-act="skip-results">Skip to results (less precise)</button></div>' +
      '</div></main>');
  }
  function renderTheoryOffer() {
    render(mast('Part 2 complete') + '<main><div class="panel">' +
      '<div class="eyebrow">Part 2 complete</div>' +
      '<h2 style="font:800 2rem/1 var(--display);text-transform:uppercase;margin-top:0.5rem">One optional module left</h2>' +
      '<p style="margin-top:0.8rem">The theory module has ' + THEORY_N + ' questions on dialectics, value theory, crisis, the state, the origins of capitalism, space and social reproduction. It places you among ' + TA.schools.length + ' schools of Marxist theory and does not change your tendency result.</p>' +
      '<div class="row"><button class="btn primary" data-act="theory">Take the theory module</button><button class="btn" data-act="results">See my results</button></div>' +
      '</div></main>');
  }
  function startTheory() {
    var ids = E.theoryOrder().filter(function (id) { return !S.answers[id]; });
    if (!ids.length) { S.phase = 'results'; save(); return show(); }
    S.pos = S.queue.length;
    addSegment(ids, 'Part 3 · Theory', 'results');
    S.phase = 'q'; save(); show();
  }
  function startExtraModule(fam) {
    var ids = E.moduleOrder([fam]).filter(function (id) { return !S.answers[id]; });
    if (!ids.length) return;
    S.pos = S.queue.length;
    if (S.mods.indexOf(fam) < 0) S.mods.push(fam);
    addSegment(ids, 'Extra · ' + famName(fam), 'results');
    S.phase = 'q'; save(); show();
  }

  /* ---------- results ---------- */
  function bar(v, neg, pos, mixed) {
    var x = v === null ? 50 : 50 + v * 50;
    var left = Math.min(50, x), width = Math.abs(x - 50);
    var lean = v === null ? '' : v < -0.1 ? 'neg' : v > 0.1 ? 'pos' : '';
    return '<div class="track" role="img" aria-label="' + esc(v === null ? 'No answers' : signed(v) + ' between ' + neg + ' and ' + pos) + '">' +
      (v === null ? '' : '<span class="fill" style="left:' + left.toFixed(1) + '%;width:' + width.toFixed(1) + '%"></span><span class="pin" style="left:' + x.toFixed(1) + '%"></span>') +
      '</div><div class="ends"><span class="' + (lean === 'neg' ? 'lean' : '') + '">' + esc(neg) + '</span><span class="' + (lean === 'pos' ? 'lean' : '') + '">' + esc(pos) + '</span></div>';
  }
  function axisRow(a, sc, no) {
    var s = sc[a.id] || { v: null };
    return '<div class="ax"><div class="lab"><b>' + (no ? '<em>' + no + '</em>' : '') + esc(a.n) + (s.mixed ? '<span class="flag" title="Your answers on this scale pointed in different directions">mixed</span>' : '') + '</b>' +
      '<span>' + (s.v === null ? 'no answers' : signed(s.v)) + '</span></div>' + bar(s.v, a.neg, a.pos) + '</div>';
  }
  function rankRows(list, offset) {
    return list.map(function (s, i) {
      return '<div class="r"><span class="n">' + (i + 1 + (offset || 0)) + '</span><span class="nm"><b>' + esc(s.t.n) + '</b><i>' + esc(famName(s.t.fam)) + '</i></span>' +
        '<span class="meter"><span style="width:' + pct(s.fit) + '%"></span></span><span class="pct">' + pct(s.fit) + '%</span></div>';
    }).join('');
  }
  /* ---------- export ---------- */
  // Markdown: readable as plain text, and keeps structure when pasted into a doc or an LLM.
  function exportText() {
    var answers = S.answers, scores = E.scoreTendencies(answers), sc = E.scaleScores(answers);
    var schools = E.scoreSchools(answers), tags = E.tags(answers, sc);
    var ids = S.queue.length ? S.queue.slice() : [];
    TA.items.forEach(function (it) { if (answers[it.id] && ids.indexOf(it.id) < 0) ids.push(it.id); });
    ids = ids.filter(function (id) { return answers[id]; });
    var L = [];
    L.push('# Twelve Axes: answers');
    L.push('');
    L.push('Results code: ' + E.encode(answers));
    L.push('Questions answered: ' + ids.length);
    L.push('');
    L.push('## Results');
    L.push('');
    L.push('Top matches:');
    scores.slice(0, 6).forEach(function (s, i) { L.push((i + 1) + '. ' + s.t.n + ' (' + famName(s.t.fam) + ') ' + pct(s.fit) + '%'); });
    L.push('');
    L.push('Axes (-100 to +100):');
    TA.axes.concat(TA.supp).forEach(function (a) {
      var v = sc[a.id] && sc[a.id].v;
      L.push('- ' + a.n + ' (' + a.neg + ' -100 / ' + a.pos + ' +100): ' + (v === null || v === undefined ? 'no answers' : Math.round(v * 100)));
    });
    if (tags.length) { L.push(''); L.push('Tags: ' + tags.map(function (t) { return t.n; }).join(', ')); }
    if (schools) { L.push(''); L.push('Theory schools: ' + schools.slice(0, 3).map(function (x) { return x.s.n + ' ' + pct(x.fit) + '%'; }).join(', ')); }
    var lastSec = null, n = 0;
    ids.forEach(function (id) {
      var it = E.itemById[id], code = answers[id];
      var sec = it.part === 'core' ? 'Part 1: Core' : it.part === 'theory' ? 'Part 3: Theory' : 'Drill-down: ' + famName(it.fam);
      if (sec !== lastSec) { L.push(''); L.push('## ' + sec); lastSec = sec; }
      n++;
      L.push('');
      L.push('### ' + n + '. [' + it.id + '] ' + it.q);
      if (it.h) L.push('Context: ' + it.ctx);
      var opts = it.t === 'm' ? it.opts.map(function (o, k) { return String.fromCharCode(65 + k) + '. ' + o.t; })
        : it.t === 'c' ? CHOICE.map(function (c, k) { return c + (k === 0 ? ' (A: ' + it.opts[0] + ')' : k === 4 ? ' (B: ' + it.opts[1] + ')' : ''); })
        : LIKERT.slice();
      opts.forEach(function (o, k) { L.push('- [' + (code === k + 2 ? 'x' : ' ') + '] ' + o); });
      L.push('- [' + (code === 1 ? 'x' : ' ') + '] ' + (it.h ? 'Unfamiliar' : 'Unsure / no view'));
    });
    return L.join('\n') + '\n';
  }

  function renderResults() {
    if (!S.shared && !S.done) { S.done = true; save(); }
    var answers = S.answers;
    var scores = E.scoreTendencies(answers), top = scores[0], second = scores[1];
    var sc = E.scaleScores(answers), tags = E.tags(answers, sc), schools = E.scoreSchools(answers);
    var core = E.answered(answers, 'core'), coreL = core.filter(function (a) { return a.it.t === 'l'; });
    var notes = [];
    if (core.length < CORE_N / 2) notes.push('You answered fewer than half of the core questions, so these results rest on thin evidence.');
    var dec = 0; coreL.forEach(function (a) { dec += Math.abs(a.r); }); dec = coreL.length ? dec / coreL.length : 0;
    if (coreL.length && dec < 0.28) notes.push('Most of your answers were neutral or mild, so every match is weak and the ranking is unstable.');
    var acq = 0; coreL.forEach(function (a) { acq += a.r; }); acq = coreL.length ? acq / coreL.length : 0;
    if (acq > 0.4) notes.push('You agreed with most statements, including ones that point in opposite directions. Balanced question wording cancels some of this, but treat close calls with caution.');
    if (acq < -0.4) notes.push('You disagreed with most statements, including ones that point in opposite directions. Treat close calls with caution.');
    if (top.fit < 70) notes.push('Your answers don\'t sit close to any single tendency (best match ' + pct(top.fit) + '%). The ranking still shows which traditions you are nearest to, but read the top result as approximate.');
    var drilled = {}; E.answered(answers, 'mod').forEach(function (a) { drilled[a.it.fam] = 1; });
    if (E.famById[top.t.fam].mod && !drilled[top.t.fam]) {
      notes.push('Your top match comes from the ' + famName(top.t.fam) + ' family, which you haven\'t taken the drill-down for. Taking it below will sharpen the result.');
    }
    var why = E.explain(answers, top.t, second.t, 4).map(function (w) {
      return '<li><q>' + esc(w.it.q) + '</q><div class="ans">You: <b>' + esc(labelFor(w.it, w.r)) + '</b> &middot; ' + esc(top.t.n) + ': <b>' + esc(labelFor(w.it, w.ea)) + '</b> &middot; ' + esc(second.t.n) + ': <b>' + esc(labelFor(w.it, w.eb)) + '</b></div></li>';
    }).join('');
    var others = TA.families.filter(function (f) { return f.mod && !drilled[f.id]; });
    var best = {}; scores.forEach(function (s) { if (best[s.t.fam] === undefined) best[s.t.fam] = s.fit; });
    others.sort(function (a, b) { return best[b.id] - best[a.id]; });
    var code = E.encode(answers);
    if (!inFrame && !S.shared) { try { history.replaceState(null, '', '#' + code); } catch (e) { /* ignore */ } }
    var link = location.href.split('#')[0] + '#' + code;

    var html = mast('Results') + '<main>' +
      (S.shared ? '<div class="note" style="margin:0 0 1.5rem">You\'re viewing results from a shared code. <button class="btn ghost" data-act="home" style="min-height:auto;padding:0">Take the test yourself</button></div>' : '') +
      '<section class="hero-res">' +
      '<div class="eyebrow">Your closest tendency</div>' +
      '<div class="top"><h1>' + esc(top.t.n) + '</h1><div class="fitbig"><b>' + pct(top.fit) + '%</b><span>match</span></div></div>' +
      '<div class="famlabel">' + esc(famName(top.t.fam)) + ' family</div>' +
      '<p class="blurb">' + esc(top.t.d) + '</p>' +
      '<div class="figs">Associated with: ' + esc(top.t.f) + '</div>' +
      notes.map(function (n) { return '<div class="note">' + esc(n) + '</div>'; }).join('') +
      '</section>' +
      '<h2 class="sec">Runners-up</h2><div class="rank">' + rankRows(scores.slice(0, 6)) + '</div>' +
      (why ? '<h2 class="sec">Why ' + esc(top.t.n) + ' over ' + esc(second.t.n) + '</h2><p class="muted small">The answers that separated your top two matches most.</p><ul class="why">' + why + '</ul>' : '') +
      (tags.length ? '<h2 class="sec">Tags <small>' + tags.length + '</small></h2><div class="tags">' + tags.map(function (t) { return '<div class="tag"><b>' + esc(t.n) + '</b><span>' + esc(t.d) + '</span></div>'; }).join('') + '</div>' : '') +
      '<h2 class="sec">The twelve axes <small>−100 to +100</small></h2>' +
      '<div class="axes-res">' + TA.axes.map(function (a, i) { return axisRow(a, sc, i + 1); }).join('') + '</div>' +
      '<h2 class="sec">Other scales</h2>' +
      '<div class="axes-res small-set">' + TA.supp.map(function (a) { return axisRow(a, sc); }).join('') + '</div>' +
      '<h2 class="sec">Theoretical orientation</h2>' +
      (schools ? '<div class="rank schools">' + schools.slice(0, 3).map(function (s, i) {
        return '<div class="r"><span class="n">' + (i + 1) + '</span><span class="nm"><b>' + esc(s.s.n) + '</b><i>' + esc(s.s.f) + '</i></span><span class="meter"><span style="width:' + pct(s.fit) + '%"></span></span><span class="pct">' + pct(s.fit) + '%</span></div>';
      }).join('') + '</div><p class="blurb small" style="font-size:1rem">' + esc(schools[0].s.d) + '</p>'
        : '<p>You haven\'t taken the theory module. It has ' + THEORY_N + ' questions and places you among ' + TA.schools.length + ' schools of Marxist theory.</p>' + (S.shared ? '' : '<button class="btn" data-act="theory">Take the theory module</button>')) +
      (S.shared || !others.length ? '' : '<h2 class="sec">Check another family</h2><p class="muted small">Each drill-down adds 8 to 16 questions and sharpens the ranking inside that family. Sorted by your current best fit.</p><div class="more-fams">' +
        others.map(function (f) { return '<button class="btn" data-fam="' + f.id + '">' + esc(f.n) + ' &middot; ' + pct(best[f.id]) + '%</button>'; }).join('') + '</div>') +
      '<details class="all"><summary>Full ranking of all ' + scores.length + ' tendencies</summary><div class="rank">' + rankRows(scores) + '</div></details>' +
      '<h2 class="sec">Save or share</h2>' +
      '<p class="muted small">This code holds all of your answers. Paste it on the start page to reopen these results.</p>' +
      '<div class="share"><input id="codeOut" aria-label="Results code" readonly value="' + esc(code) + '"><button class="btn" data-copy="codeOut">Copy code</button></div>' +
      (inFrame ? '' : '<div class="share" style="margin-top:0.5rem"><input id="linkOut" aria-label="Results link" readonly value="' + esc(link) + '"><button class="btn" data-copy="linkOut">Copy link</button></div>') +
      '<h2 class="sec">Export answers</h2>' +
      '<p class="muted small">Every question you answered, in the order you saw it, with all the options and the one you picked marked [x]. Markdown, so it reads as plain text and keeps its structure in a document.</p>' +
      '<div class="row"><button class="btn" data-act="export">Show export</button>' +
      '<button class="btn" data-copy="exportOut" hidden id="exportCopy">Copy all</button>' +
      (inFrame ? '' : '<button class="btn" data-act="download" hidden id="exportDl">Download .md</button>') + '</div>' +
      '<textarea id="exportOut" class="export" aria-label="Exported answers" readonly hidden></textarea>' +
      '<div class="row" style="margin-top:2rem">' + (S.shared ? '<button class="btn" data-act="home">Take the test yourself</button>' :
        '<button class="btn" data-act="review">Review my answers</button><button class="btn ghost" data-act="restart-confirm">Start over</button>') + '</div>' +
      '</main>' + foot();
    render(html);
  }

  /* ---------- events ---------- */
  app.addEventListener('click', function (ev) {
    var t = ev.target.closest('button');
    if (!t) return;
    var act = t.getAttribute('data-act'), codeAttr = t.getAttribute('data-code');
    if (codeAttr && S.phase === 'q') return choose(+codeAttr);
    if (t.hasAttribute('data-fam')) return startExtraModule(t.getAttribute('data-fam'));
    if (t.hasAttribute('data-copy')) {
      var inp = document.getElementById(t.getAttribute('data-copy'));
      var label = t.textContent;
      var done = function () { t.textContent = 'Copied'; setTimeout(function () { t.textContent = label; }, 1600); };
      try {
        navigator.clipboard.writeText(inp.value).then(done, function () { inp.select(); });
      } catch (e) { inp.select(); }
      return;
    }
    switch (act) {
      case 'start': return start();
      case 'resume': S = load() || fresh(); return show();
      case 'restart-confirm':
        t.textContent = 'Erase all answers and restart?';
        t.setAttribute('data-act', 'restart');
        t.classList.add('primary');
        return;
      case 'restart': clearSaved(); return start();
      case 'home':
        if (S.shared) { S = load() || fresh(); if (S.phase === 'results') S.phase = 'intro'; }
        else if (S.phase !== 'intro') { save(); S = load() || fresh(); S.phase = 'intro'; }
        try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { /* ignore */ }
        return renderIntro();
      case 'back': return back();
      case 'continue': S.phase = 'q'; save(); return show();
      case 'skip-results': S.phase = 'results'; save(); return show();
      case 'theory': return startTheory();
      case 'results': S.phase = 'results'; save(); return show();
      case 'export': {
        var ta = document.getElementById('exportOut');
        ta.value = exportText(); ta.hidden = false;
        document.getElementById('exportCopy').hidden = false;
        var dl = document.getElementById('exportDl'); if (dl) dl.hidden = false;
        t.hidden = true; ta.focus(); ta.select();
        return;
      }
      case 'download': {
        try {
          var blob = new Blob([document.getElementById('exportOut').value], { type: 'text/markdown' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'twelve-axes-answers.md';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        } catch (e) { /* fall back to copy */ }
        return;
      }
      case 'review': S.pos = 0; S.phase = 'q'; save(); return show();
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (S.phase !== 'q' || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
    var it = E.itemById[S.queue[S.pos]], size = E.scaleSize(it);
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= size) { ev.preventDefault(); return choose(n + 1); }
    if (it.t === 'm' && /^[a-e]$/i.test(ev.key)) {
      var li = ev.key.toLowerCase().charCodeAt(0) - 97;
      if (li < size) { ev.preventDefault(); return choose(li + 2); }
    }
    if (ev.key === '0' || ev.key === 'u' || ev.key === 'U') { ev.preventDefault(); return choose(1); }
    if (ev.key === 'Backspace' || ev.key === 'ArrowLeft') { ev.preventDefault(); return back(); }
  });

  /* ---------- boot ---------- */
  var hash = (location.hash || '').replace(/^#/, '');
  var fromHash = hash.indexOf('R2') === 0 ? E.decode(hash) : null;
  var saved = load();
  if (fromHash && Object.keys(fromHash).length) {
    if (saved && E.encode(saved.answers) === hash) { S = saved; S.phase = 'results'; }
    else { S = fresh(); S.answers = fromHash; S.phase = 'results'; S.shared = true; }
  } else if (saved && saved.phase === 'results') {
    S = saved;
  }
  show();
})();
