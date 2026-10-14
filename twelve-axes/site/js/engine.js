/* Scoring engine. Pure functions, shared by the site and the validation script. */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var E = (TA.engine = {});

  var CORE = TA.axes.map(function (a) { return a.id; });
  var SUPP = TA.supp.map(function (a) { return a.id; });
  var KEY_W = 2, SET_W = 1, NULL_W = 0.3, OVERRIDE_W = 2.5;
  var MODULE_LAMBDA = 1;

  E.CORE = CORE; E.SUPP = SUPP;

  /* ---------- profiles ---------- */
  function buildProfile(t) {
    var P = {}, key = {}, i, d, v;
    for (i = 0; i < t.k.length; i++) key[t.k[i]] = 1;
    for (i = 0; i < CORE.length; i++) {
      d = CORE[i]; v = t.p[d];
      P[d] = (v === undefined || v === null) ? { v: 0, w: NULL_W } : { v: v, w: key[d] ? KEY_W : SET_W };
    }
    var path = t.p.path;
    var defs = { rel: -0.5, nv: (path != null && path < 0) ? -0.5 : 0.3, soc: -0.3, nat: 0, cap: -1 };
    var defW = { rel: 0.5, nv: 0.5, soc: 0.4, nat: 0.3, cap: 1 };
    for (i = 0; i < SUPP.length; i++) {
      d = SUPP[i]; v = t.p[d];
      P[d] = (v === undefined) ? { v: defs[d], w: defW[d] } : { v: v, w: key[d] ? KEY_W : SET_W };
    }
    return P;
  }
  TA.tendencies.forEach(function (t) { t.P = buildProfile(t); });
  TA.schools.forEach(function (s) {
    s.P = {};
    TA.theoryDims.forEach(function (d) { s.P[d.id] = { v: s.p[d.id], w: 1 }; });
  });

  E.tById = {}; TA.tendencies.forEach(function (t) { E.tById[t.id] = t; });
  E.famById = {}; TA.families.forEach(function (f) { E.famById[f.id] = f; });
  E.itemById = {}; TA.items.forEach(function (it, idx) { it.idx = idx; E.itemById[it.id] = it; });

  /* ---------- answer values ---------- */
  // Codes: 0 = not answered, 1 = unsure/unfamiliar, 2..8 = 7-point scale, 2..6 = 5-point choice.
  E.value = function (item, code) {
    if (!code || code < 2) return null;
    return item.t === 'c' ? (code - 4) / 2 : (code - 5) / 3;
  };
  E.scaleSize = function (item) { return item.t === 'c' ? 5 : 7; };

  /* ---------- expectations ---------- */
  function fromLoadings(item, P) {
    if (!item.l) return null;
    var num = 0, den = 0, lsum = 0, d, l, p;
    for (d in item.l) {
      l = item.l[d]; p = P[d];
      if (!p) continue;
      num += l * p.v * p.w; den += Math.abs(l) * p.w; lsum += Math.abs(l);
    }
    if (!den) return null;
    var e = num / den;
    return { e: e > 1 ? 1 : e < -1 ? -1 : e, w: den / lsum };
  }
  // Expected answer of tendency/school ent on item; null when the item does not score it.
  E.expect = function (item, ent) {
    if (item.x && item.x[ent.id] !== undefined) return { e: item.x[ent.id], w: OVERRIDE_W };
    if (item.part === 'mod') return null;
    return fromLoadings(item, ent.P);
  };
  // Same, ignoring the family restriction (used to simulate respondents).
  E.expectAny = function (item, ent) {
    if (item.x && item.x[ent.id] !== undefined) return { e: item.x[ent.id], w: OVERRIDE_W };
    return fromLoadings(item, ent.P);
  };

  /* ---------- question order ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, seed) {
    var r = rng(seed), a = arr.slice(), i, j, tmp;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
    return a;
  }
  function primary(item) {
    var best = null, bv = 0, d;
    if (item.l) for (d in item.l) if (Math.abs(item.l[d]) > bv) { bv = Math.abs(item.l[d]); best = d; }
    return best || item.id;
  }
  // Shuffle, then repair so that no two neighbors measure the same scale.
  function spread(items, seed) {
    var a = shuffle(items, seed), out = [], pool = a.slice();
    while (pool.length) {
      var last = out.length ? primary(out[out.length - 1]) : null, k = 0;
      while (k < pool.length && primary(pool[k]) === last) k++;
      if (k === pool.length) k = 0;
      out.push(pool.splice(k, 1)[0]);
    }
    return out;
  }
  E.part1Order = function () {
    return spread(TA.items.filter(function (i) { return i.part === 'core'; }), 1917).map(function (i) { return i.id; });
  };
  E.moduleOrder = function (fams) {
    var lists = fams.map(function (f, n) {
      return shuffle(TA.items.filter(function (i) { return i.part === 'mod' && i.fam === f; }), 1871 + n);
    });
    var out = [], i, n, max = Math.max.apply(null, lists.map(function (l) { return l.length; }).concat(0));
    for (i = 0; i < max; i++) for (n = 0; n < lists.length; n++) if (lists[n][i]) out.push(lists[n][i].id);
    return out;
  };
  E.theoryOrder = function () {
    return shuffle(TA.items.filter(function (i) { return i.part === 'theory'; }), 1848).map(function (i) { return i.id; });
  };

  /* ---------- tendency scoring ---------- */
  function answered(answers, part) {
    var out = [], id, it, r;
    for (id in answers) {
      it = E.itemById[id];
      if (!it || (part && it.part !== part)) continue;
      r = E.value(it, answers[id]);
      if (r !== null) out.push({ it: it, r: r });
    }
    return out;
  }
  E.answered = answered;

  function fitFromMse(m) { return Math.max(0, 100 * (1 - Math.sqrt(m) / 2)); }
  E.fitFromMse = fitFromMse;

  // Returns every tendency, best first, with fit (0-100).
  E.scoreTendencies = function (answers) {
    var core = answered(answers, 'core'), mod = answered(answers, 'mod');
    var drilled = {};
    mod.forEach(function (a) { drilled[a.it.fam] = 1; });
    var res = TA.tendencies.map(function (t) {
      var sse = 0, W = 0, msse = 0, mW = 0, i, ex, a;
      for (i = 0; i < core.length; i++) {
        a = core[i]; ex = E.expect(a.it, t);
        if (!ex) continue;
        sse += ex.w * (a.r - ex.e) * (a.r - ex.e); W += ex.w;
      }
      for (i = 0; i < mod.length; i++) {
        a = mod[i];
        if (a.it.fam !== t.fam) continue;
        ex = E.expect(a.it, t);
        if (!ex) continue;
        msse += ex.w * (a.r - ex.e) * (a.r - ex.e); mW += ex.w;
      }
      return { t: t, mse: W ? sse / W : 4, mmse: mW ? msse / mW : null, drilled: !!drilled[t.fam] };
    });
    // Modules separate tendencies within a family: members are penalized by
    // how much worse they fit the module than the family's best fit.
    var bestMod = {};
    res.forEach(function (s) {
      if (s.mmse === null) return;
      if (bestMod[s.t.fam] === undefined || s.mmse < bestMod[s.t.fam]) bestMod[s.t.fam] = s.mmse;
    });
    res.forEach(function (s) {
      s.adj = s.mse + (s.mmse === null ? 0 : MODULE_LAMBDA * (s.mmse - bestMod[s.t.fam]));
      s.fit = fitFromMse(s.adj);
    });
    res.sort(function (a, b) { return a.adj - b.adj; });
    return res;
  };

  // Families ranked by their best tendency.
  E.rankFamilies = function (scores) {
    var best = {}, order = [];
    scores.forEach(function (s) {
      if (best[s.t.fam] === undefined) { best[s.t.fam] = s.fit; order.push(s.t.fam); }
    });
    return order.map(function (f) { return { fam: f, fit: best[f] }; });
  };
  E.pickModules = function (answers, n) {
    return E.rankFamilies(E.scoreTendencies(answers))
      .filter(function (f) { return E.famById[f.fam].mod; })
      .slice(0, n || 2).map(function (f) { return f.fam; });
  };

  /* ---------- scale scores ---------- */
  E.scaleScores = function (answers) {
    var acc = {}, all = answered(answers, 'core');
    CORE.concat(SUPP).forEach(function (d) { acc[d] = { num: 0, den: 0, vals: [] }; });
    all.forEach(function (a) {
      if (!a.it.l) return;
      for (var d in a.it.l) {
        if (!acc[d]) continue;
        var l = a.it.l[d];
        acc[d].num += a.r * l; acc[d].den += Math.abs(l);
        if (Math.abs(l) >= 0.5) acc[d].vals.push(a.r * (l > 0 ? 1 : -1));
      }
    });
    var out = {};
    Object.keys(acc).forEach(function (d) {
      var A = acc[d], n = A.vals.length, mean = 0, sd = 0;
      A.vals.forEach(function (v) { mean += v; }); mean = n ? mean / n : 0;
      A.vals.forEach(function (v) { sd += (v - mean) * (v - mean); }); sd = n > 1 ? Math.sqrt(sd / (n - 1)) : 0;
      out[d] = { v: A.den ? A.num / A.den : null, n: n, mixed: n >= 4 && sd > 0.75 };
    });
    return out;
  };

  /* ---------- tags ---------- */
  E.tags = function (answers, scales) {
    var acc = {}, out = [];
    answered(answers).forEach(function (a) {
      if (!a.it.tag) return;
      for (var g in a.it.tag) {
        acc[g] = acc[g] || { num: 0, den: 0 };
        acc[g].num += a.r * a.it.tag[g]; acc[g].den += Math.abs(a.it.tag[g]);
      }
    });
    function itemTag(g) { return acc[g] && acc[g].den ? acc[g].num / acc[g].den : null; }
    function sv(d) { return scales[d] ? scales[d].v : null; }
    var tech = sv('tech');
    var rules = {
      fem: function () { return itemTag('fem') >= 0.5; },
      race: function () { return itemTag('race') >= 0.5; },
      queer: function () { return itemTag('queer') >= 0.5; },
      ind: function () { return itemTag('ind') >= 0.45; },
      degrowth: function () { return itemTag('degrowth') >= 0.5; },
      accel: function () { return itemTag('accel') >= 0.45 && tech !== null && tech <= -0.2; },
      skeptic: function () { return itemTag('skeptic') >= 0.4 && tech !== null && tech >= 0.1; },
      commons: function () { return itemTag('commons') >= 0.55; },
      eco: function () { return tech !== null && tech >= 0.35; },
      campist: function () { return sv('geo') !== null && sv('geo') <= -0.4; },
      relig: function () { return sv('rel') !== null && sv('rel') >= 0.35; },
      socon: function () { return sv('soc') !== null && sv('soc') >= 0.3; },
      pacifist: function () { return sv('nv') !== null && sv('nv') >= 0.5; },
      natlib: function () { return sv('nat') !== null && sv('nat') >= 0.5; },
      antinat: function () { return sv('nat') !== null && sv('nat') <= -0.5; }
    };
    TA.tags.forEach(function (t) { if (rules[t.id] && rules[t.id]()) out.push(t); });
    return out;
  };

  /* ---------- theory schools ---------- */
  E.scoreSchools = function (answers) {
    var th = answered(answers, 'theory');
    if (th.length < 6) return null;
    return TA.schools.map(function (s) {
      var sse = 0, W = 0;
      th.forEach(function (a) {
        var ex = E.expect(a.it, s);
        if (!ex) return;
        sse += ex.w * (a.r - ex.e) * (a.r - ex.e); W += ex.w;
      });
      var m = W ? sse / W : 4;
      return { s: s, mse: m, fit: fitFromMse(m) };
    }).sort(function (a, b) { return a.mse - b.mse; });
  };

  /* ---------- explanation ---------- */
  // Answers that most favored tendency a over tendency b.
  E.explain = function (answers, a, b, n) {
    var out = [];
    answered(answers).forEach(function (x) {
      if (x.it.part === 'theory') return;
      if (x.it.part === 'mod' && (x.it.fam !== a.fam || x.it.fam !== b.fam)) return;
      var ea = E.expect(x.it, a), eb = E.expect(x.it, b);
      if (!ea || !eb) return;
      var gain = eb.w * (x.r - eb.e) * (x.r - eb.e) - ea.w * (x.r - ea.e) * (x.r - ea.e);
      if (gain > 0.05 && Math.abs(ea.e - eb.e) >= 0.4) out.push({ it: x.it, r: x.r, ea: ea.e, eb: eb.e, gain: gain });
    });
    out.sort(function (p, q) { return q.gain - p.gain; });
    return out.slice(0, n || 4);
  };

  /* ---------- results code ---------- */
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  E.encode = function (answers) {
    var n = TA.items.length, bytes = [], i, hi, lo;
    for (i = 0; i < n; i += 2) {
      hi = answers[TA.items[i].id] || 0;
      lo = i + 1 < n ? (answers[TA.items[i + 1].id] || 0) : 0;
      bytes.push((hi << 4) | lo);
    }
    // Trim trailing zero bytes to keep codes short.
    while (bytes.length && bytes[bytes.length - 1] === 0) bytes.pop();
    var s = '', bits = 0, buf = 0;
    for (i = 0; i < bytes.length; i++) {
      buf = (buf << 8) | bytes[i]; bits += 8;
      while (bits >= 6) { bits -= 6; s += B64[(buf >> bits) & 63]; }
    }
    if (bits) s += B64[(buf << (6 - bits)) & 63];
    return 'R1' + s;
  };
  E.decode = function (code) {
    if (!code || code.indexOf('R1') !== 0) return null;
    var s = code.slice(2), bytes = [], bits = 0, buf = 0, i, v;
    for (i = 0; i < s.length; i++) {
      v = B64.indexOf(s[i]);
      if (v < 0) return null;
      buf = ((buf << 6) | v) & 0xffff; bits += 6;
      if (bits >= 8) { bits -= 8; bytes.push((buf >> bits) & 255); }
    }
    var answers = {}, n = TA.items.length;
    for (i = 0; i < n; i++) {
      var byte = bytes[i >> 1] || 0, c = (i % 2 === 0) ? byte >> 4 : byte & 15;
      if (c > 8) return null;
      if (c) answers[TA.items[i].id] = c;
    }
    return answers;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
