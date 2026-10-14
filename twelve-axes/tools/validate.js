#!/usr/bin/env node
/* Simulates respondents from every tendency's expected answers plus noise,
   runs them through the same adaptive flow as the site, and reports how
   often the right tendency comes out on top.
   Usage: node tools/validate.js [noise=0.35] [runs=150] */
const path = require('path');
const SITE = path.join(__dirname, '..', 'site', 'js');
['data-meta.js', 'data-tendencies.js', 'data-items.js', 'data-modules.js', 'data-theory.js', 'engine.js']
  .forEach((f) => require(path.join(SITE, f)));
const TA = globalThis.TA, E = TA.engine;

const NOISE = parseFloat(process.argv[2] || '0.35');
const RUNS = parseInt(process.argv[3] || '150', 10);
// Per-respondent drift: each simulated person holds the tendency's positions
// shifted by this much (sd), so they are not perfect archetypes.
const DRIFT = parseFloat(process.argv[4] || '0');

let seed = 42;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function gauss() { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function drifted(t) {
  if (!DRIFT) return t;
  const P = {};
  for (const d in t.P) P[d] = { v: Math.max(-1, Math.min(1, t.P[d].v + gauss() * DRIFT)), w: t.P[d].w };
  return { id: t.id, P, shift: {} };
}
function answer(item, ent) {
  if (rand() < 0.05) return 1; // unsure
  const ex = E.expectAny(item, ent);
  let e = ex ? ex.e : 0;
  const sd = ex ? NOISE : 0.6;
  if (ex && DRIFT && item.x && item.x[ent.id] !== undefined) {
    const k = item.id; if (ent.shift[k] === undefined) ent.shift[k] = gauss() * DRIFT; e += ent.shift[k];
  }
  const r = Math.max(-1, Math.min(1, e + gauss() * sd));
  return item.t === 'c' ? Math.round(r * 2) + 4 : Math.round(r * 3) + 5;
}

function simulate(t0) {
  const t = drifted(t0);
  const answers = {};
  E.part1Order().forEach((id) => { answers[id] = answer(E.itemById[id], t); });
  const fams = E.pickModules(answers, 2);
  E.moduleOrder(fams).forEach((id) => { answers[id] = answer(E.itemById[id], t); });
  return { answers, fams };
}

const confusion = {};
let top1 = 0, top3 = 0, famHit = 0, total = 0;
const perT = [];
for (const t of TA.tendencies) {
  let h1 = 0, h3 = 0, fh = 0;
  for (let i = 0; i < RUNS; i++) {
    const { answers, fams } = simulate(t);
    const sc = E.scoreTendencies(answers);
    const rank = sc.findIndex((s) => s.t.id === t.id);
    if (rank === 0) h1++; else {
      const k = t.id + ' -> ' + sc[0].t.id;
      confusion[k] = (confusion[k] || 0) + 1;
    }
    if (rank < 3) h3++;
    if (fams.indexOf(t.fam) >= 0 || !E.famById[t.fam].mod) fh++;
  }
  top1 += h1; top3 += h3; famHit += fh; total += RUNS;
  perT.push({ id: t.id, fam: t.fam, top1: h1 / RUNS, top3: h3 / RUNS, fam_ok: fh / RUNS });
}

console.log(`noise sd=${NOISE}, drift sd=${DRIFT}, ${RUNS} runs per tendency, ${TA.tendencies.length} tendencies, ${TA.items.length} items`);
console.log(`overall top-1 ${(100 * top1 / total).toFixed(1)}%  top-3 ${(100 * top3 / total).toFixed(1)}%  right family drilled ${(100 * famHit / total).toFixed(1)}%`);
console.log('\nweakest tendencies (top-1 < 70%):');
perT.filter((p) => p.top1 < 0.7).sort((a, b) => a.top1 - b.top1).forEach((p) =>
  console.log(`  ${p.id.padEnd(13)} top1 ${(p.top1 * 100).toFixed(0).padStart(3)}%  top3 ${(p.top3 * 100).toFixed(0).padStart(3)}%  family ${(p.fam_ok * 100).toFixed(0)}%`));
console.log('\nconfusions above 10% of runs:');
Object.entries(confusion).filter(([, n]) => n / RUNS > 0.1).sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`  ${k.padEnd(28)} ${(100 * n / RUNS).toFixed(0)}%`));

// Theory schools
let tHit = 0, tTot = 0;
const tMiss = {};
for (const s of TA.schools) {
  for (let i = 0; i < RUNS; i++) {
    const answers = {};
    const sd = drifted(s); E.theoryOrder().forEach((id) => { answers[id] = answer(E.itemById[id], sd); });
    const sc = E.scoreSchools(answers);
    if (sc[0].s.id === s.id) tHit++; else tMiss[s.id + ' -> ' + sc[0].s.id] = (tMiss[s.id + ' -> ' + sc[0].s.id] || 0) + 1;
    tTot++;
  }
}
console.log(`\ntheory schools top-1 ${(100 * tHit / tTot).toFixed(1)}%`);
Object.entries(tMiss).filter(([, n]) => n / RUNS > 0.15).sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`  ${k.padEnd(28)} ${(100 * n / RUNS).toFixed(0)}%`));

// Sanity: degenerate answer patterns
function flat(code) { const a = {}; TA.items.forEach((it) => { if (it.part === 'core') a[it.id] = it.t === 'c' ? Math.min(code, 6) : code; }); return a; }
for (const [label, code] of [['all neutral', 5], ['all strongly agree', 8], ['all strongly disagree', 2]]) {
  const sc = E.scoreTendencies(flat(code));
  console.log(`${label.padEnd(22)} -> ${sc.slice(0, 3).map((s) => `${s.t.id} ${s.fit.toFixed(0)}`).join(', ')}`);
}
