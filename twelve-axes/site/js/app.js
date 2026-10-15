/* Twelve Axes: interface. */
(function () {
  var TA = window.TA, E = TA.engine;
  var app = document.getElementById('app');
  var KEY = 'twelveAxes.v3', THEME_KEY = 'twelveAxes.theme', AUTO_KEY = 'twelveAxes.auto';
  var LIKERT = ['Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neutral', 'Somewhat agree', 'Agree', 'Strongly agree'];
  var CHOICE = ['Strongly A', 'Lean A', 'Neither', 'Lean B', 'Strongly B'];
  // Likert rows run from agree (top) to disagree (bottom); codes 8..2.
  var ROWS = [{ c: 8, k: 'a3' }, { c: 7, k: 'a2' }, { c: 6, k: 'a1' }, { c: 5, k: 'n0' }, { c: 4, k: 'd1' }, { c: 3, k: 'd2' }, { c: 2, k: 'd3' }];
  var CORE_N = TA.items.filter(function (i) { return i.part === 'core'; }).length;
  var THEORY_N = TA.items.filter(function (i) { return i.part === 'theory'; }).length;
  var MOD_SIZES = TA.families.filter(function (f) { return f.mod; }).map(function (f) { return TA.items.filter(function (i) { return i.part === 'mod' && i.fam === f.id; }).length; });
  var MOD_MIN = Math.min.apply(null, MOD_SIZES), MOD_MAX = Math.max.apply(null, MOD_SIZES);
  var FAM_COLORS = { ml: '#8a1c1c', mao: '#c4412f', trot: '#6b2d5c', classic: '#8a6a2e', leftcom: '#3a3a3a', auto: '#2f6f73', anarch: '#141414', demsoc: '#b04a5a', econ: '#3b6ea5', repub: '#2f5d3a', eco: '#5b8a2f' };
  var inFrame = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

  var S = fresh();
  function fresh() {
    return { phase: 'intro', answers: {}, queue: [], pos: 0, segs: [], next: null, mods: [], shared: false, done: false, withTheory: false };
  }

  /* ---------- persistence ---------- */
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  function fetchKey(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save() { if (!S.shared) store(KEY, JSON.stringify(S)); }
  function load() { try { var s = JSON.parse(fetchKey(KEY) || 'null'); return s && s.answers ? s : null; } catch (e) { return null; } }
  function clearSaved() { store(KEY, null); }
  var auto = fetchKey(AUTO_KEY) !== '0';

  /* ---------- theme ---------- */
  function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); }
  applyTheme(fetchKey(THEME_KEY));
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function toggleTheme() {
    var next = isDark() ? 'light' : 'dark';
    applyTheme(next); store(THEME_KEY, next);
    var b = document.getElementById('themeBtn'); if (b) b.innerHTML = themeIcon();
  }
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function themeIcon() { return isDark() ? SUN : MOON; }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function famName(id) { return E.famById[id].n; }
  function famMembers(id) { return TA.tendencies.filter(function (t) { return t.fam === id; }); }
  function pct(v) { return Math.round(v); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function labelFor(item, e) {
    if (item.t === 'm') { var t = item.opts[e].t; return String.fromCharCode(65 + e) + ': ' + (t.length > 90 ? t.slice(0, 88).replace(/\s+\S*$/, '') + '…' : t); }
    return item.t === 'c' ? CHOICE[Math.max(0, Math.min(4, Math.round(e * 2) + 2))] : LIKERT[Math.max(0, Math.min(6, Math.round(e * 3) + 3))];
  }
  function strength(v, a) {
    if (v === null || v === undefined) return { label: 'No answers', pole: '', share: null };
    var m = Math.abs(v);
    var label = m < 0.15 ? 'Balanced' : m < 0.4 ? 'Leaning' : m < 0.7 ? 'Strong' : 'Very strong';
    return { label: label, pole: m < 0.15 ? '' : (v < 0 ? a.neg : a.pos), share: Math.round(50 + 50 * m) };
  }
  var ARROW = '<svg class="arr" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  var CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  var CROSS = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';
  var DASH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 8h8"/></svg>';
  var MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    (function () { var s = ''; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 12, x = 14 * Math.cos(a), y = 14 * Math.sin(a); s += '<line x1="' + (16 - x).toFixed(2) + '" y1="' + (16 - y).toFixed(2) + '" x2="' + (16 + x).toFixed(2) + '" y2="' + (16 + y).toFixed(2) + '"/>'; } return s; })() +
    '</g><circle cx="16" cy="16" r="3.2" fill="currentColor"/></svg>';

  function header(kind) {
    var nav = kind === 'landing' ? '<nav class="nav" aria-label="Sections"><a href="#how">How it works</a><a href="#axes">The 12 axes</a><a href="#depth">Versions</a><a href="#families">Tendencies</a><a href="#faq">FAQ</a></nav>' : '';
    var action = kind === 'landing' ? '<button class="btn primary small startbtn" data-act="start-std">Start ' + ARROW + '</button>'
      : kind === 'quiz' ? '<button class="btn soft small" data-act="home">Save &amp; exit</button>'
        : '<button class="btn soft small" data-act="home">Start page</button>';
    return '<header class="top"><div class="wrap topin">' +
      '<button class="mark" data-act="home" aria-label="Twelve Axes, start page">' + MARK + '<b>Twelve <span>Axes</span></b></button>' + nav +
      '<div class="right"><button class="iconbtn" id="themeBtn" data-act="theme" aria-label="Switch light or dark theme">' + themeIcon() + '</button>' + action + '</div>' +
      '</div></header>';
  }
  function render(html) { app.innerHTML = html; window.scrollTo(0, 0); }
  function counts() {
    var core = CORE_N, drillLo = MOD_MIN * 2, drillHi = MOD_MAX * 3;
    return { std: (core + drillLo) + '–' + (core + drillHi), full: (core + drillLo + THEORY_N) + '–' + (core + drillHi + THEORY_N) };
  }

  /* ---------- flow ---------- */
  function addSegment(ids, label, next) {
    S.segs.push({ start: S.queue.length, len: ids.length, label: label });
    S.queue = S.queue.concat(ids);
    S.next = next;
  }
  function start(withTheory) {
    S = fresh();
    S.withTheory = !!withTheory;
    S.phase = 'q';
    addSegment(E.part1Order(), 'Part 1 · Core', 'pickMods');
    save(); show();
  }
  function atEnd() {
    if (S.next === 'pickMods') {
      S.mods = E.pickModules(S.answers);
      addSegment(E.moduleOrder(S.mods), 'Part 2 · Drill-down', 'theoryOffer');
      S.phase = 'interlude';
    } else if (S.next === 'theoryOffer') {
      if (S.withTheory) return startTheory();
      S.phase = 'theoryOffer';
    } else {
      S.phase = 'results';
    }
    save(); show();
  }
  function advance() {
    S.pos++;
    save();
    if (S.pos >= S.queue.length) atEnd(); else show();
  }
  function back() { if (S.pos > 0) { S.pos--; S.phase = 'q'; save(); show(); } }
  function show() {
    if (S.phase === 'q') return renderQ();
    if (S.phase === 'interlude') return renderInterlude();
    if (S.phase === 'theoryOffer') return renderTheoryOffer();
    if (S.phase === 'results') return renderResults();
    renderIntro();
  }

  /* ---------- landing ---------- */
  function exampleCard() {
    var t = E.tById.council, fit = 86;
    var rows = TA.axes.map(function (a) {
      var st = strength(t.p[a.id], a);
      var name = st.pole || 'Balanced';
      return '<div class="exrow"><span>' + esc(name) + '</span><i><span style="width:' + (st.share || 50) + '%"></span></i><em>' + (st.share || 50) + '%</em></div>';
    }).join('');
    return '<div class="stack" aria-label="Example result">' +
      '<span class="eyebrow dot exlabel">Example result</span>' +
      '<div class="ghostcard g1"><b>Luxemburgism</b></div><div class="ghostcard g2"><b>Autogestion</b></div>' +
      '<div class="excard"><div class="exhead"><span>Twelve Axes</span><span>Result</span></div>' +
      '<div class="exfam">' + esc(famName(t.fam)) + '</div><h3>' + esc(t.n) + '</h3>' +
      '<div class="exfit"><b>' + fit + '%</b><span>match</span></div>' +
      '<div class="exaxes"><div class="t">Your 12 axes</div>' + rows + '</div>' +
      '<div class="exfoot"><span>Runner-up: Luxemburgism</span><span>81%</span></div></div></div>';
  }
  function renderIntro() {
    var saved = load();
    var resumable = saved && saved.phase !== 'intro' && Object.keys(saved.answers).length;
    var c = counts();
    var axisCards = TA.axes.map(function (a, i) {
      return '<article class="axcard"><h3><small>' + pad(i + 1) + '</small>' + esc(a.n) + '</h3>' +
        '<div class="poles"><span>' + esc(a.neg) + '</span><i>↔</i><span>' + esc(a.pos) + '</span></div><p>' + esc(a.d) + '</p></article>';
    }).join('');
    var famCards = TA.families.map(function (f) {
      return '<article class="famcard"><h3><i style="background:' + (FAM_COLORS[f.id] || 'var(--ink-3)') + '"></i>' + esc(f.n) + '</h3><ul>' +
        famMembers(f.id).map(function (t) { return '<li>' + esc(t.n) + '</li>'; }).join('') + '</ul></article>';
    }).join('');
    var faq = [
      ['How long does it take?', 'The standard version is ' + c.std + ' questions, about 35 to 45 minutes. Adding the theory module brings it to ' + c.full + '. Your progress is saved in this browser, so you can stop and come back.'],
      ['Are my answers collected anywhere?', 'No. The test runs entirely in your browser. Answers are stored only in this browser\'s local storage, and the results code you can copy contains them so you can reopen or share your result yourself.'],
      ['How is my result calculated?', 'Each tendency has a hand-built position on every scale. For agree/disagree questions the test compares your answer with what each tendency would say; for multiple-choice questions each option sits at a position on the scales, so in-between answers count as themselves. Where a tradition has a specific documented line, that answer is set by hand. Drill-down answers only reorder tendencies within their own family.'],
      ['Why are so many questions scenarios with several options?', 'Real positions are often hybrids, like a democratic rupture or legitimate illegality. A scale running only between two poles would average those positions into the middle and misread them.'],
      ['Why does it ask about history?', 'Judgments about Kronstadt, the Constituent Assembly, Hungary 1956 or the historic compromise separate tendencies that sound alike in the abstract. Each historical question has a one-line summary, and you can mark any of them as unfamiliar.'],
      ['What does the match percentage mean?', '100% would mean your answers are identical to the tendency\'s profile. Most people\'s best match lands between 70% and 85%. Below 70% the results page tells you no single tendency fits closely.'],
      ['How was the test checked?', 'Thousands of simulated respondents per tendency, with noise and drift, plus answer sheets written by hand for 18 real positions, from Lenin and Bordiga to Bellamy, Lefebvre and Saito. All 18 land on the expected tendency.'],
      ['Can I see or export my answers?', 'Yes. The results page can export every question you answered, with all the options and your choice marked, as Markdown.']
    ].map(function (q) { return '<details><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('');

    render(header('landing') + '<main>' +
      '<section class="hero"><div class="wrap hero-grid"><div>' +
      '<span class="eyebrow">Socialist tendency test</span>' +
      '<h1>Which socialist are you, <em>really?</em></h1>' +
      '<p class="lede">Find where you stand among ' + TA.tendencies.length + ' tendencies of the socialist left, from council communism and Left Eurocommunism to labor republicanism, autogestion and degrowth communism.</p>' +
      '<div class="row"><button class="btn primary big" data-act="start-std">Start the test ' + ARROW + '</button><a class="btn big" href="#axes">See the 12 axes</a></div>' +
      '<div class="ticks"><span>Free</span><span>Anonymous</span><span>No sign-up</span><span>Answers stay in your browser</span></div>' +
      (resumable ? '<div class="resume"><span><b>You have a test in progress.</b> ' + Object.keys(saved.answers).length + ' answers saved.</span><span class="row"><button class="btn primary small" data-act="resume">Resume</button><button class="btn ghost small" data-act="restart-confirm">Start over</button></span></div>' : '') +
      '</div>' + exampleCard() + '</div></section>' +

      '<section class="block band" id="how"><div class="wrap">' +
      '<span class="eyebrow">How it works</span><h2 class="h2">Three parts, one result</h2>' +
      '<p class="sub" style="margin-top:0.8rem">The test starts broad, then narrows in on the traditions closest to you.</p>' +
      '<ol class="steps">' +
      '<li><span class="no">01</span><h3>Core questions</h3><p>' + CORE_N + ' questions on the twelve axes, plus capitalism, legality and violence, social values, the national question, Marxist feminism, republican freedom, self-management and technology. Many are scenarios with in-between answers.</p></li>' +
      '<li><span class="no">02</span><h3>Drill-down</h3><p>The two families closest to you (three when it\'s close) get ' + MOD_MIN + ' to ' + MOD_MAX + ' targeted questions each, written to separate tendencies that look alike on the axes.</p></li>' +
      '<li><span class="no">03</span><h3>Your result</h3><p>Your closest tendencies with match scores, all twelve axes, tags, the answers that decided it, and optionally your school of Marxist theory.</p></li>' +
      '</ol></div></section>' +

      '<section class="block" id="axes"><div class="wrap">' +
      '<div class="sechead"><div><span class="eyebrow">The 12 axes</span><h2 class="h2">What each axis measures</h2></div>' +
      '<p class="sub">Strategy is split into two axes, Transition and Arena, so positions like a democratic rupture or legitimate illegality register as themselves instead of averaging out.</p></div>' +
      '<div class="axgrid">' + axisCards + '</div></div></section>' +

      '<section class="block alt" id="depth"><div class="wrap">' +
      '<span class="eyebrow">Versions</span><h2 class="h2">Choose the depth</h2>' +
      '<p class="sub" style="margin:0.8rem 0 2rem">Both versions use the same core and drill-down. The complete version adds ' + THEORY_N + ' questions on Marxist theory, and you can also add it later from the results page.</p>' +
      '<div class="depth">' +
      '<article class="dcard rec"><div class="kicker"><span>Standard</span><span class="badge">Recommended</span></div>' +
      '<div class="num"><b>' + c.std + '</b><span>questions</span></div>' +
      '<ul><li>' + CORE_N + ' core questions</li><li>2 or 3 drill-down modules</li><li>' + TA.tendencies.length + ' tendencies, ' + TA.families.length + ' families</li></ul>' +
      '<div class="time">About 35 to 45 minutes</div>' +
      '<button class="btn primary" data-act="start-std">Start standard ' + ARROW + '</button></article>' +
      '<article class="dcard"><div class="kicker"><span>Complete</span></div>' +
      '<div class="num"><b>' + c.full + '</b><span>questions</span></div>' +
      '<ul><li>Everything in standard</li><li>' + THEORY_N + ' theory questions</li><li>' + TA.schools.length + ' schools, from dialectical materialism to Political Marxism</li></ul>' +
      '<div class="time">About 50 to 60 minutes</div>' +
      '<button class="btn" data-act="start-full">Start complete ' + ARROW + '</button></article>' +
      '</div></div></section>' +

      '<section class="block" id="families"><div class="wrap">' +
      '<div class="sechead"><div><span class="eyebrow">Tendencies</span><h2 class="h2">' + TA.tendencies.length + ' tendencies in ' + TA.families.length + ' families</h2></div>' +
      '<p class="sub">Families group tendencies by lineage. Your result ranks every tendency, and the drill-down separates the ones within your closest families.</p></div>' +
      '<div class="famgrid">' + famCards + '</div></div></section>' +

      '<section class="block alt" id="faq"><div class="wrap sechead" style="align-items:start">' +
      '<div><span class="eyebrow">FAQ</span><h2 class="h2">Questions people ask first</h2>' +
      '<p class="sub" style="margin-top:0.8rem">Have a results code? Paste it here to reopen a result.</p>' +
      '<form class="codeform" id="codeForm"><input id="codeIn" aria-label="Results code" placeholder="Code starting with R3" autocomplete="off" spellcheck="false"><button class="btn" type="submit">View results</button></form>' +
      '<div class="err" id="codeErr" hidden>That code isn\'t valid. Check that you copied all of it.</div></div>' +
      '<div class="faq">' + faq + '</div></div></section>' +
      '</main>' + foot());
    document.getElementById('codeForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = E.decode(document.getElementById('codeIn').value.trim().replace(/^#/, ''));
      if (!a || !Object.keys(a).length) { document.getElementById('codeErr').hidden = false; return; }
      S = fresh(); S.answers = a; S.phase = 'results'; S.shared = true; show();
    });
  }
  function foot() {
    return '<footer class="foot"><div class="wrap"><span>Twelve Axes scores you against hand-built profiles of each tendency. A match describes how close your answers are to a tradition\'s positions, not which group you should join.</span></div></footer>';
  }

  /* ---------- question ---------- */
  function segOf(pos) {
    for (var i = S.segs.length - 1; i >= 0; i--) if (pos >= S.segs[i].start) return S.segs[i];
    return S.segs[0];
  }
  function chipFor(it) {
    if (it.part === 'theory') return { i: 'T', t: 'Theory' };
    if (it.part === 'mod') return { i: 'D', t: 'Drill-down · ' + famName(it.fam) };
    if (it.h) return { i: 'H', t: 'History' };
    if (it.t === 'm') return { i: '?', t: 'Scenario' };
    return { i: '±', t: 'Statement' };
  }
  function renderQ() {
    var id = S.queue[S.pos], it = E.itemById[id], seg = segOf(S.pos);
    var n = S.pos - seg.start + 1, code = S.answers[id] || 0;
    var done = (n - 1) / seg.len, segs = Math.min(12, seg.len), bars = '';
    for (var s = 0; s < segs; s++) {
      var f = Math.max(0, Math.min(1, done * segs - s));
      bars += '<i><span style="width:' + (f * 100).toFixed(0) + '%"></span></i>';
    }
    var rows;
    if (it.t === 'm') {
      rows = it.opts.map(function (o, k) {
        var on = code === k + 2;
        return '<button class="opt mc' + (on ? ' on' : '') + '" data-code="' + (k + 2) + '" aria-pressed="' + on + '"><span class="ic">' + String.fromCharCode(65 + k) + '</span><span>' + esc(o.t) + '</span><span class="radio"></span></button>';
      }).join('');
    } else {
      rows = ROWS.map(function (r) {
        var on = code === r.c, icon = r.k[0] === 'a' ? CHECK : r.k[0] === 'd' ? CROSS : DASH;
        return '<button class="opt ' + r.k + (on ? ' on' : '') + '" data-code="' + r.c + '" aria-pressed="' + on + '"><span class="ic">' + icon + '</span><span>' + LIKERT[r.c - 2] + '</span><span class="radio"></span></button>';
      }).join('');
    }
    var chip = chipFor(it);
    render(header('quiz') + '<main class="quiz">' +
      '<div class="qmeta"><span>' + esc(seg.label) + ' · Question <b>' + n + '</b> of ' + seg.len + '</span><span>' + Math.round(100 * done) + '% complete</span></div>' +
      '<div class="segbar" aria-hidden="true">' + bars + '</div>' +
      '<article class="qcard"><div class="qnum" aria-hidden="true">' + pad(n) + '</div>' +
      '<span class="chip"><i>' + esc(chip.i) + '</i>' + esc(chip.t) + '</span>' +
      (it.h ? '<div class="ctx"><b>Historical context</b>' + esc(it.ctx) + '</div>' : '') +
      '<h2 class="qtext" id="qtext">' + esc(it.q) + '</h2>' +
      '<div class="opts" role="group" aria-labelledby="qtext">' + rows + '</div>' +
      '<button class="unsure' + (code === 1 ? ' on' : '') + '" data-code="1" aria-pressed="' + (code === 1) + '">' + (it.h ? 'I\'m not familiar with this' : it.t === 'm' ? 'None of these fits / unsure' : 'Unsure / no view') + '</button>' +
      '</article>' +
      '<div class="qnav"><button class="btn soft" data-act="back"' + (S.pos === 0 ? ' disabled' : '') + '>← Back</button>' +
      '<div class="mid"><button class="toggle" role="switch" aria-checked="' + auto + '" data-act="auto"><span class="sw"></span>Advance on answer</button></div>' +
      '<button class="btn primary next" data-act="next"' + (code ? '' : ' disabled') + '>' + (S.done && S.pos >= S.queue.length - 1 ? 'Finish' : 'Next') + ' ' + ARROW + '</button></div>' +
      (S.done ? '<div class="row" style="justify-content:center;margin-top:1rem"><button class="btn ghost small" data-act="results">Back to results</button></div>' : '') +
      '<div class="keys">Keys: ' + (it.t === 'm' ? 'A–' + String.fromCharCode(64 + it.opts.length) + ' or 1–' + it.opts.length : '1 (strongly agree) to 7 (strongly disagree)') + ' to answer · 0 for unsure · Enter for next · Backspace to go back</div>' +
      '</main>');
  }
  var busy = false;
  function choose(code) {
    if (busy) return;
    var id = S.queue[S.pos];
    S.answers[id] = code; save();
    app.querySelectorAll('[data-code]').forEach(function (b) {
      var on = +b.getAttribute('data-code') === code;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
    var nx = app.querySelector('[data-act="next"]'); if (nx) nx.disabled = false;
    if (!auto) return;
    busy = true;
    setTimeout(function () { busy = false; advance(); }, 170);
  }

  /* ---------- interludes ---------- */
  function famFitRows(list, mark) {
    return list.map(function (f) {
      var on = mark.indexOf(f.fam) >= 0;
      return '<div class="famfit' + (on ? ' on' : '') + '"><span>' + esc(famName(f.fam)) + '</span><span class="meter"><span style="width:' + pct(f.fit) + '%"></span></span><span style="text-align:right">' + pct(f.fit) + '%</span></div>';
    }).join('');
  }
  function renderInterlude() {
    var fams = E.rankFamilies(E.scoreTendencies(S.answers)).slice(0, 5);
    var seg = S.segs[S.segs.length - 1];
    render(header('quiz') + '<main class="quiz"><div class="panel">' +
      '<span class="eyebrow">Part 1 complete</span><h2>Your closest families</h2>' +
      '<div class="famfits">' + famFitRows(fams, S.mods) + '</div>' +
      '<p>Part 2 has ' + seg.len + ' questions from the <b>' + S.mods.map(famName).map(esc).join('</b>, <b>') + '</b> modules' + (S.mods.length > 2 ? ', because your second and third families were nearly tied' : '') + '. They are written to separate tendencies that look alike on the twelve axes.</p>' +
      '<div class="row"><button class="btn primary" data-act="continue">Continue to Part 2 ' + ARROW + '</button><button class="btn ghost" data-act="skip-results">Skip to results (less precise)</button></div>' +
      '</div></main>');
  }
  function renderTheoryOffer() {
    render(header('quiz') + '<main class="quiz"><div class="panel">' +
      '<span class="eyebrow">Part 2 complete</span><h2>One optional module left</h2>' +
      '<p>The theory module has ' + THEORY_N + ' questions on dialectics, value, crisis, the state, the origins of capitalism, space and social reproduction. It places you among ' + TA.schools.length + ' schools of Marxist theory and does not change your tendency result.</p>' +
      '<div class="row"><button class="btn primary" data-act="theory">Take the theory module ' + ARROW + '</button><button class="btn" data-act="results">See my results</button></div>' +
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
  function ring(fit) {
    var r = 42, c = 2 * Math.PI * r, d = (c * Math.max(0, Math.min(100, fit)) / 100).toFixed(1);
    return '<div class="ring" role="img" aria-label="' + pct(fit) + '% match"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="8"/>' +
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="var(--red)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + d + ' ' + c.toFixed(1) + '"/></svg>' +
      '<div class="lbl"><div><b>' + pct(fit) + '%</b><span>match</span></div></div></div>';
  }
  function axisCard(a, sc, no) {
    var s = sc[a.id] || { v: null }, v = s.v, st = strength(v, a);
    var x = v === null ? 50 : 50 + v * 50, left = Math.min(50, x), width = Math.abs(x - 50);
    var lean = v === null ? '' : v < -0.15 ? 'neg' : v > 0.15 ? 'pos' : '';
    var pill = v === null ? 'No answers' : st.pole ? st.label + ' · ' + st.share + '% ' + st.pole : 'Balanced';
    return '<article class="axres"><div class="lab"><b>' + (no ? '<small>' + pad(no) + '</small>' : '') + esc(a.n) + '</b>' +
      '<span class="row" style="gap:0.35rem">' + (s.mixed ? '<span class="pill red" title="Your answers on this scale pointed in different directions">Mixed</span>' : '') + '<span class="pill">' + esc(pill) + '</span></span></div>' +
      '<div class="track" role="img" aria-label="' + esc(a.n + ': ' + pill) + '">' +
      (v === null ? '' : '<span class="fill" style="left:' + left.toFixed(1) + '%;width:' + width.toFixed(1) + '%"></span><span class="pin" style="left:' + x.toFixed(1) + '%"></span>') +
      '</div><div class="ends"><span class="' + (lean === 'neg' ? 'lean' : '') + '">' + esc(a.neg) + '</span><span class="' + (lean === 'pos' ? 'lean' : '') + '">' + esc(a.pos) + '</span></div></article>';
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
    L.push('# Twelve Axes: answers', '', 'Results code: ' + E.encode(answers), 'Questions answered: ' + ids.length, '', '## Results', '', 'Top matches:');
    scores.slice(0, 6).forEach(function (s, i) { L.push((i + 1) + '. ' + s.t.n + ' (' + famName(s.t.fam) + ') ' + pct(s.fit) + '%'); });
    L.push('', 'Axes (-100 to +100):');
    TA.axes.concat(TA.supp).forEach(function (a) {
      var v = sc[a.id] && sc[a.id].v;
      L.push('- ' + a.n + ' (' + a.neg + ' -100 / ' + a.pos + ' +100): ' + (v === null || v === undefined ? 'no answers' : Math.round(v * 100)));
    });
    if (tags.length) L.push('', 'Tags: ' + tags.map(function (t) { return t.n; }).join(', '));
    if (schools) L.push('', 'Theory schools: ' + schools.slice(0, 3).map(function (x) { return x.s.n + ' ' + pct(x.fit) + '%'; }).join(', '));
    var lastSec = null, n = 0;
    ids.forEach(function (id) {
      var it = E.itemById[id], code = answers[id];
      var sec = it.part === 'core' ? 'Part 1: Core' : it.part === 'theory' ? 'Part 3: Theory' : 'Drill-down: ' + famName(it.fam);
      if (sec !== lastSec) { L.push('', '## ' + sec); lastSec = sec; }
      n++;
      L.push('', '### ' + n + '. [' + it.id + '] ' + it.q);
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
    if (E.famById[top.t.fam].mod && !drilled[top.t.fam]) notes.push('Your top match comes from the ' + famName(top.t.fam) + ' family, which you haven\'t taken the drill-down for. Taking it below will sharpen the result.');
    var why = E.explain(answers, top.t, second.t, 4).map(function (w) {
      return '<li><q>' + esc(w.it.q) + '</q><div class="ans"><span>You: <b>' + esc(labelFor(w.it, w.r)) + '</b></span><span>' + esc(top.t.n) + ': <b>' + esc(labelFor(w.it, w.ea)) + '</b></span><span>' + esc(second.t.n) + ': <b>' + esc(labelFor(w.it, w.eb)) + '</b></span></div></li>';
    }).join('');
    var others = TA.families.filter(function (f) { return f.mod && !drilled[f.id]; });
    var best = {}; scores.forEach(function (s) { if (best[s.t.fam] === undefined) best[s.t.fam] = s.fit; });
    others.sort(function (a, b) { return best[b.id] - best[a.id]; });
    var code = E.encode(answers);
    if (!inFrame && !S.shared) { try { history.replaceState(null, '', '#' + code); } catch (e) { /* ignore */ } }
    var link = location.href.split('#')[0] + '#' + code;

    var theoryCard = schools
      ? '<article class="card sidecard"><div class="kicker"><span>Theory school</span><span>' + pct(schools[0].fit) + '%</span></div><h3>' + esc(schools[0].s.n) + '</h3><p>' + esc(schools[0].s.f) + '</p></article>'
      : (S.shared ? '' : '<article class="card sidecard"><div class="kicker"><span>Theory school</span></div><h3>Not taken yet</h3><p style="margin-bottom:0.8rem">' + THEORY_N + ' questions place you among ' + TA.schools.length + ' schools of Marxist theory.</p><button class="btn small" data-act="theory">Take the theory module ' + ARROW + '</button></article>');

    render(header('results') + '<main class="res"><div class="wrap">' +
      (S.shared ? '<div class="note" style="margin:0 0 1.2rem">You\'re viewing results from a shared code. <button class="btn ghost small" data-act="home">Take the test yourself</button></div>' : '') +
      '<div class="resgrid">' +
      '<article class="card maincard"><div class="headrow"><div style="min-width:0"><span class="pill dark">' + esc(famName(top.t.fam)) + '</span><h1>' + esc(top.t.n) + '</h1></div>' + ring(top.fit) + '</div>' +
      '<p class="blurb">' + esc(top.t.d) + '</p><div class="figs">Associated with: ' + esc(top.t.f) + '</div>' +
      notes.map(function (n) { return '<div class="note">' + esc(n) + '</div>'; }).join('') + '</article>' +
      '<div class="side">' +
      '<article class="card sidecard"><div class="kicker"><span>Runner-up</span><span>' + pct(second.fit) + '%</span></div><h3>' + esc(second.t.n) + '</h3><p>' + esc(famName(second.t.fam)) + '</p></article>' +
      theoryCard +
      (tags.length ? '<article class="card sidecard"><div class="kicker"><span>Tags</span><span>' + tags.length + '</span></div><div class="tagwrap">' + tags.map(function (t) { return '<span class="pill" title="' + esc(t.d) + '">' + esc(t.n) + '</span>'; }).join('') + '</div></article>' : '') +
      '</div></div>' +

      '<section class="rsec"><h2>Your closest tendencies</h2><p class="muted">Every tendency is scored against all your answers; drill-downs separate tendencies within a family.</p><div class="rank">' + rankRows(scores.slice(0, 6)) + '</div>' +
      '<details class="all"><summary>Full ranking of all ' + scores.length + ' tendencies</summary><div class="rank">' + rankRows(scores.slice(6), 6) + '</div></details></section>' +
      (why ? '<section class="rsec"><h2>Why ' + esc(top.t.n) + ' over ' + esc(second.t.n) + '</h2><p class="muted">The answers that separated your top two matches most.</p><ul class="why">' + why + '</ul></section>' : '') +
      '<section class="rsec"><h2>The twelve axes</h2><p class="muted">Where you sit between each pair of poles. 50% is the midpoint.</p><div class="axgrid-res">' + TA.axes.map(function (a, i) { return axisCard(a, sc, i + 1); }).join('') + '</div></section>' +
      '<section class="rsec"><h2>Other scales</h2><div class="axgrid-res">' + TA.supp.map(function (a) { return axisCard(a, sc); }).join('') + '</div></section>' +
      (schools ? '<section class="rsec"><h2>Theoretical orientation</h2><p class="muted">' + esc(schools[0].s.d) + '</p><div class="rank schools">' + schools.slice(0, 3).map(function (s, i) {
        return '<div class="r"><span class="n">' + (i + 1) + '</span><span class="nm"><b>' + esc(s.s.n) + '</b><i>' + esc(s.s.f) + '</i></span><span class="meter"><span style="width:' + pct(s.fit) + '%"></span></span><span class="pct">' + pct(s.fit) + '%</span></div>';
      }).join('') + '</div></section>' : '') +
      (S.shared || !others.length ? '' : '<section class="rsec"><h2>Check another family</h2><p class="muted">Each drill-down adds ' + MOD_MIN + ' to ' + MOD_MAX + ' questions and sharpens the ranking inside that family. Sorted by your current best fit.</p><div class="more-fams">' +
        others.map(function (f) { return '<button class="btn small soft" data-fam="' + f.id + '">' + esc(f.n) + ' · ' + pct(best[f.id]) + '%</button>'; }).join('') + '</div></section>') +
      '<section class="rsec card"><h2 style="font-size:1.3rem">Save, share or export</h2>' +
      '<p class="muted small" style="margin-top:0.4rem">The code holds all your answers. Paste it on the start page to reopen these results.</p>' +
      '<div class="share"><input class="field" id="codeOut" aria-label="Results code" readonly value="' + esc(code) + '"><button class="btn" data-copy="codeOut">Copy code</button></div>' +
      (inFrame ? '' : '<div class="share"><input class="field" id="linkOut" aria-label="Results link" readonly value="' + esc(link) + '"><button class="btn" data-copy="linkOut">Copy link</button></div>') +
      '<p class="muted small" style="margin:1.2rem 0 0.6rem">Export lists every question you answered, in order, with all options and your choice marked [x], as Markdown.</p>' +
      '<div class="row"><button class="btn" data-act="export">Show export</button><button class="btn" data-copy="exportOut" hidden id="exportCopy">Copy all</button>' +
      (inFrame ? '' : '<button class="btn" data-act="download" hidden id="exportDl">Download .md</button>') + '</div>' +
      '<textarea id="exportOut" class="export" aria-label="Exported answers" readonly hidden></textarea></section>' +
      '<div class="row" style="margin-top:2rem">' + (S.shared ? '<button class="btn primary" data-act="home">Take the test yourself</button>' :
        '<button class="btn soft" data-act="review">Review my answers</button><button class="btn ghost" data-act="restart-confirm">Start over</button>') + '</div>' +
      '</div></main>' + foot());
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
      try { navigator.clipboard.writeText(inp.value).then(done, function () { inp.select(); }); } catch (e) { inp.select(); }
      return;
    }
    switch (act) {
      case 'theme': return toggleTheme();
      case 'start-std': return start(false);
      case 'start-full': return start(true);
      case 'resume': S = load() || fresh(); return show();
      case 'restart-confirm':
        t.textContent = 'Erase all answers and restart?';
        t.setAttribute('data-act', 'restart');
        t.classList.add('primary'); t.classList.remove('ghost');
        return;
      case 'restart': clearSaved(); return start(false);
      case 'home':
        if (S.shared) { S = load() || fresh(); if (S.phase === 'results') S.phase = 'intro'; }
        else if (S.phase !== 'intro') { save(); S = load() || fresh(); S.phase = 'intro'; }
        try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { /* ignore */ }
        return renderIntro();
      case 'back': return back();
      case 'next': if (S.answers[S.queue[S.pos]]) advance(); return;
      case 'auto':
        auto = !auto; store(AUTO_KEY, auto ? '1' : '0'); t.setAttribute('aria-checked', auto);
        return;
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
    var it = E.itemById[S.queue[S.pos]];
    var n = parseInt(ev.key, 10);
    if (it.t === 'm') {
      var size = it.opts.length;
      if (n >= 1 && n <= size) { ev.preventDefault(); return choose(n + 1); }
      if (/^[a-e]$/i.test(ev.key)) {
        var li = ev.key.toLowerCase().charCodeAt(0) - 97;
        if (li < size) { ev.preventDefault(); return choose(li + 2); }
      }
    } else if (n >= 1 && n <= 7) { ev.preventDefault(); return choose(ROWS[n - 1].c); }
    if (ev.key === '0' || ev.key === 'u' || ev.key === 'U') { ev.preventDefault(); return choose(1); }
    if (ev.key === 'Enter' && S.answers[S.queue[S.pos]]) { ev.preventDefault(); return advance(); }
    if (ev.key === 'Backspace' || ev.key === 'ArrowLeft') { ev.preventDefault(); return back(); }
  });

  /* ---------- boot ---------- */
  var hash = (location.hash || '').replace(/^#/, '');
  var fromHash = hash.indexOf('R3') === 0 ? E.decode(hash) : null;
  var saved = load();
  if (fromHash && Object.keys(fromHash).length) {
    if (saved && E.encode(saved.answers) === hash) { S = saved; S.phase = 'results'; }
    else { S = fresh(); S.answers = fromHash; S.phase = 'results'; S.shared = true; }
  } else if (saved && saved.phase === 'results') {
    S = saved;
  }
  show();
})();
