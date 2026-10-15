/* Scoring engine. Pure functions, shared by the site and the validation script. */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var E = (TA.engine = {});

  var CORE = TA.axes.map(function (a) { return a.id; });
  var SUPP = TA.supp.map(function (a) { return a.id; });
  var KEY_W = 2, SET_W = 1, NULL_W = 0.3, OVERRIDE_W = 2.5;
  var MODULE_LAMBDA = 1;
  // A third drill-down runs when the third family is this close to the second.
  E.THIRD_MODULE_MARGIN = 1.2;

  E.CORE = CORE; E.SUPP = SUPP;

  /* ---------- profiles ---------- */
  function buildProfile(t) {
    var P = {}, key = {}, i, d, v;
    for (i = 0; i < t.k.length; i++) key[t.k[i]] = 1;
    for (i = 0; i < CORE.length; i++) {
      d = CORE[i]; v = t.p[d];
      P[d] = (v === undefined || v === null) ? { v: 0, w: NULL_W } : { v: v, w: key[d] ? KEY_W : SET_W };
    }
    var rup = t.p.rupture;
    var defs = { rel: -0.5, nv: (rup != null && rup < 0) ? -0.5 : 0.3, soc: -0.3, nat: 0, cap: -1 };
    var defW = { rel: 0.5, nv: 0.5, soc: 0.4, nat: 0.3, cap: 1 };
    for (i = 0; i < SUPP.length; i++) {
      d = SUPP[i]; v = t.p[d];
      P[d] = (v === undefined) ? { v: defs[d], w: defW[d] } : { v: v, w: key[d] ? KEY_W : SET_W };
    }
    return P;
  }
  TA.tendencies.forEach(function (t) { t.P = buildProfile(t); t.kind = 't'; });
  TA.schools.forEach(function (s) {
    s.P = {}; s.kind = 's';
    TA.theoryDims.forEach(function (d) { s.P[d.id] = { v: s.p[d.id], w: 1 }; });
  });

  E.tById = {}; TA.tendencies.forEach(function (t) { E.tById[t.id] = t; });
  E.famById = {}; TA.families.forEach(function (f) { E.famById[f.id] = f; });
  E.itemById = {}; TA.items.forEach(function (it, idx) {
    it.idx = idx; E.itemById[it.id] = it;
    if (it.t === 'm') {
      it.dims = it.opts[0].v ? Object.keys(it.opts[0].v) : null;
      var keys = {};
      it.opts.forEach(function (o) { if (o.tag) for (var g in o.tag) keys[g] = 1; });
      it.mtags = Object.keys(keys);
    }
  });

  /* ---------- answers ---------- */
  // Codes: 0 = not answered, 1 = unsure/unfamiliar, 2.. = scale point or option index + 2.
  E.scaleSize = function (item) { return item.t === 'm' ? item.opts.length : item.t === 'c' ? 5 : 7; };
  E.value = function (item, code) {
    if (!code || code < 2) return null;
    if (item.t === 'm') return code - 2;
    return item.t === 'c' ? (code - 4) / 2 : (code - 5) / 3;
  };

  /* ---------- expectations and errors ---------- */
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
  function prefs(x) { return Array.isArray(x) ? x : [x]; }
  function optDist(item, a, b) {
    var s = 0, n = 0;
    item.dims.forEach(function (d) { var q = item.opts[a].v[d] - item.opts[b].v[d]; s += q * q; n++; });
    return n ? s / n : 0;
  }
  // Squared error of each option for an entity (null if the item does not score it).
  function optionErrors(item, ent) {
    var x = item.x && item.x[ent.id] !== undefined ? prefs(item.x[ent.id]) : null;
    var out = [], i, k;
    if (x) {
      for (i = 0; i < item.opts.length; i++) {
        if (item.dims) {
          var best = 9;
          for (k = 0; k < x.length; k++) best = Math.min(best, optDist(item, i, x[k]) + (k ? 0.15 : 0));
          out.push(best);
        } else {
          k = x.indexOf(i);
          out.push(k === 0 ? 0 : k > 0 ? 1 : 3);
        }
      }
      return { errs: out, w: OVERRIDE_W };
    }
    if (!item.dims) return null;
    var wsum = 0;
    item.dims.forEach(function (d) { wsum += ent.P[d] ? ent.P[d].w : 0; });
    if (!wsum) return null;
    for (i = 0; i < item.opts.length; i++) {
      var s = 0;
      item.dims.forEach(function (d) {
        var p = ent.P[d]; if (!p) return;
        var q = item.opts[i].v[d] - p.v; s += p.w * q * q;
      });
      out.push(s / wsum);
    }
    return { errs: out, w: wsum / item.dims.length };
  }
  E.optionErrors = optionErrors;

  // Expected Likert answer (null if not scored).
  function expectL(item, ent) {
    if (item.x && item.x[ent.id] !== undefined) return { e: item.x[ent.id], w: OVERRIDE_W };
    return fromLoadings(item, ent.P);
  }
  E.expectAny = expectL;

  function scores(item, ent) {
    if (item.part === 'mod' && ent.kind === 't' && ent.fam !== item.fam) return false;
    if ((item.part === 'theory') !== (ent.kind === 's')) return false;
    return true;
  }
  // Squared error and weight of an answer for an entity, or null.
  E.err = function (item, code, ent) {
    if (!scores(item, ent)) return null;
    var r = E.value(item, code);
    if (r === null) return null;
    if (item.t === 'm') {
      var oe = optionErrors(item, ent);
      return oe ? { e2: oe.errs[r], w: oe.w } : null;
    }
    var ex = expectL(item, ent);
    return ex ? { e2: (r - ex.e) * (r - ex.e), w: ex.w } : null;
  };
  // What an entity would answer: a scale value for Likert, an option index for multiple choice.
  E.expected = function (item, ent) {
    if (item.t === 'm') {
      var oe = optionErrors(item, ent); if (!oe) return null;
      var bi = 0; oe.errs.forEach(function (e, i) { if (e < oe.errs[bi]) bi = i; });
      return bi;
    }
    var ex = expectL(item, ent);
    return ex ? ex.e : null;
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
    var src = item.l || (item.opts && item.opts[0].v), best = null, bv = 0, d;
    if (src) for (d in src) if (Math.abs(src[d]) >= bv) { bv = Math.abs(src[d]); best = d; }
    return best || item.id;
  }
  // Shuffle, then repair so no two neighbors measure the same scale or are both multiple choice.
  function spread(items, seed) {
    var a = shuffle(items, seed), out = [], pool = a.slice();
    while (pool.length) {
      var prev = out.length ? out[out.length - 1] : null, k = 0;
      while (k < pool.length && prev && (primary(pool[k]) === primary(prev) || (pool[k].t === 'm' && prev.t === 'm'))) k++;
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
    return spread(TA.items.filter(function (i) { return i.part === 'theory'; }), 1848).map(function (i) { return i.id; });
  };

  /* ---------- tendency scoring ---------- */
  function answered(answers, part) {
    var out = [], id, it;
    for (id in answers) {
      it = E.itemById[id];
      if (!it || (part && it.part !== part)) continue;
      if (answers[id] >= 2) out.push({ it: it, code: answers[id], r: E.value(it, answers[id]) });
    }
    return out;
  }
  E.answered = answered;

  function fitFromMse(m) { return Math.max(0, 100 * (1 - Math.sqrt(m) / 2)); }
  E.fitFromMse = fitFromMse;

  function mse(list, ent) {
    var sse = 0, W = 0;
    for (var i = 0; i < list.length; i++) {
      var r = E.err(list[i].it, list[i].code, ent);
      if (!r) continue;
      sse += r.w * r.e2; W += r.w;
    }
    return W ? sse / W : null;
  }

  // Every tendency, best first, with fit (0-100).
  E.scoreTendencies = function (answers) {
    var core = answered(answers, 'core'), mod = answered(answers, 'mod');
    var res = TA.tendencies.map(function (t) {
      var c = mse(core, t);
      return { t: t, mse: c === null ? 4 : c, mmse: mse(mod, t) };
    });
    // Modules separate tendencies within a family: members are penalized by
    // how much worse they fit the module than the family's best member.
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

  E.rankFamilies = function (scores) {
    var best = {}, order = [];
    scores.forEach(function (s) {
      if (best[s.t.fam] === undefined) { best[s.t.fam] = s.fit; order.push(s.t.fam); }
    });
    return order.map(function (f) { return { fam: f, fit: best[f] }; });
  };
  // Two closest families with modules, plus a third when it is nearly tied with the second.
  E.pickModules = function (answers) {
    var fams = E.rankFamilies(E.scoreTendencies(answers)).filter(function (f) { return E.famById[f.fam].mod; });
    var out = fams.slice(0, 2);
    if (fams[2] && fams[1].fit - fams[2].fit <= E.THIRD_MODULE_MARGIN) out.push(fams[2]);
    return out.map(function (f) { return f.fam; });
  };

  /* ---------- scale scores ---------- */
  E.scaleScores = function (answers) {
    var acc = {};
    CORE.concat(SUPP).forEach(function (d) { acc[d] = { num: 0, den: 0, vals: [] }; });
    function add(d, v, w) {
      if (!acc[d]) return;
      acc[d].num += v * w; acc[d].den += w;
      if (w >= 0.5) acc[d].vals.push(v);
    }
    answered(answers, 'core').forEach(function (a) {
      if (a.it.t === 'm') {
        if (!a.it.dims) return;
        a.it.dims.forEach(function (d) { add(d, a.it.opts[a.r].v[d], 1); });
      } else if (a.it.l) {
        for (var d in a.it.l) add(d, a.r * (a.it.l[d] > 0 ? 1 : -1), Math.abs(a.it.l[d]));
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
  E.tagScores = function (answers) {
    var acc = {};
    function add(g, v, w) { acc[g] = acc[g] || { num: 0, den: 0 }; acc[g].num += v * w; acc[g].den += w; }
    answered(answers).forEach(function (a) {
      if (a.it.t === 'm') {
        var o = a.it.opts[a.r];
        (a.it.mtags || []).forEach(function (g) { add(g, (o.tag && o.tag[g]) || 0, 1); });
      } else if (a.it.tag) {
        for (var g in a.it.tag) add(g, a.r * (a.it.tag[g] > 0 ? 1 : -1), Math.abs(a.it.tag[g]));
      }
    });
    var out = {};
    for (var g in acc) out[g] = acc[g].den ? acc[g].num / acc[g].den : null;
    return out;
  };
  E.tags = function (answers, scales) {
    var ts = E.tagScores(answers), out = [];
    function it(g) { return ts[g] === undefined ? null : ts[g]; }
    function sv(d) { return scales[d] ? scales[d].v : null; }
    var tech = sv('tech');
    var rules = {
      fem: function () { return it('fem') >= 0.5; },
      race: function () { return it('race') >= 0.5; },
      queer: function () { return it('queer') >= 0.5; },
      ind: function () { return it('ind') >= 0.45; },
      degrowth: function () { return it('degrowth') >= 0.5; },
      accel: function () { return it('accel') >= 0.4 && tech !== null && tech <= -0.2; },
      skeptic: function () { return it('skeptic') >= 0.4 && tech !== null && tech >= 0.1; },
      autog: function () { return it('autog') >= 0.5; },
      commons: function () { return it('commons') >= 0.55; },
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
    if (th.length < 10) return null;
    return TA.schools.map(function (s) {
      var m = mse(th, s);
      return { s: s, mse: m === null ? 4 : m, fit: fitFromMse(m === null ? 4 : m) };
    }).sort(function (a, b) { return a.mse - b.mse; });
  };

  /* ---------- explanation ---------- */
  // Answers that most favored tendency a over tendency b.
  E.explain = function (answers, a, b, n) {
    var out = [];
    answered(answers).forEach(function (x) {
      if (x.it.part === 'theory') return;
      var ea = E.err(x.it, x.code, a), eb = E.err(x.it, x.code, b);
      if (!ea || !eb) return;
      var pa = E.expected(x.it, a), pb = E.expected(x.it, b);
      if (x.it.t === 'm' ? pa === pb : Math.abs(pa - pb) < 0.4) return;
      var gain = eb.w * eb.e2 - ea.w * ea.e2;
      if (gain > 0.05) out.push({ it: x.it, r: x.r, ea: pa, eb: pb, gain: gain });
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
    while (bytes.length && bytes[bytes.length - 1] === 0) bytes.pop();
    var s = '', bits = 0, buf = 0;
    for (i = 0; i < bytes.length; i++) {
      buf = (buf << 8) | bytes[i]; bits += 8;
      while (bits >= 6) { bits -= 6; s += B64[(buf >> bits) & 63]; }
    }
    if (bits) s += B64[(buf << (6 - bits)) & 63];
    return 'R2' + s;
  };
  E.decode = function (code) {
    if (!code || code.indexOf('R2') !== 0) return null;
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
      if (c > 8 || (c >= 2 && c - 2 >= E.scaleSize(TA.items[i]))) return null;
      if (c) answers[TA.items[i].id] = c;
    }
    return answers;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
