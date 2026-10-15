#!/usr/bin/env node
/* Simulates respondents from every tendency's expected answers plus noise,
   runs them through the same adaptive flow as the site, and reports how often
   the right tendency comes out on top. Then scores the hand-written persona
   answer sheets in tools/personas.js.
   Usage: node tools/validate.js [noise=0.35] [runs=150] [drift=0] */
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
  return Object.assign({}, t, { P, shift: {} });
}
function answer(item, ent) {
  if (rand() < 0.05) return 1; // unsure
  if (item.t === 'm') {
    const fake = Object.assign({}, ent, { kind: item.part === 'theory' ? 's' : 't', fam: item.fam || ent.fam });
    const oe = E.optionErrors(item, fake);
    if (!oe) return 2 + Math.floor(rand() * item.opts.length);
    // Choose with probability falling off with squared error; noise sets the temperature.
    const temp = 2 * NOISE * NOISE + (DRIFT ? DRIFT * DRIFT : 0) + 0.02;
    const w = oe.errs.map((e) => Math.exp(-e / temp)), tot = w.reduce((a, b) => a + b, 0);
    let u = rand() * tot, i = 0;
    while (u > w[i] && i < w.length - 1) { u -= w[i]; i++; }
    return 2 + i;
  }
  const ex = E.expectAny(item, ent);
  let e = ex ? ex.e : 0;
  const sd = ex ? NOISE : 0.6;
  if (ex && DRIFT && item.x && item.x[ent.id] !== undefined) {
    if (ent.shift[item.id] === undefined) ent.shift[item.id] = gauss() * DRIFT;
    e += ent.shift[item.id];
  }
  const r = Math.max(-1, Math.min(1, e + gauss() * sd));
  return item.t === 'c' ? Math.round(r * 2) + 4 : Math.round(r * 3) + 5;
}

function simulate(t0) {
  const t = drifted(t0);
  const answers = {};
  E.part1Order().forEach((id) => { answers[id] = answer(E.itemById[id], t); });
  const fams = E.pickModules(answers);
  E.moduleOrder(fams).forEach((id) => { answers[id] = answer(E.itemById[id], t); });
  return { answers, fams };
}

const confusion = {}, fits = [];
let top1 = 0, top3 = 0, famHit = 0, total = 0, third = 0;
const perT = [];
for (const t of TA.tendencies) {
  let h1 = 0, h3 = 0, fh = 0;
  for (let i = 0; i < RUNS; i++) {
    const { answers, fams } = simulate(t);
    if (fams.length > 2) third++;
    const sc = E.scoreTendencies(answers);
    const rank = sc.findIndex((s) => s.t.id === t.id);
    fits.push(sc[rank].fit);
    if (rank === 0) h1++; else {
      const k = t.id + ' -> ' + sc[0].t.id;
      confusion[k] = (confusion[k] || 0) + 1;
    }
    if (rank < 3) h3++;
    if (fams.indexOf(t.fam) >= 0 || !E.famById[t.fam].mod) fh++;
  }
  top1 += h1; top3 += h3; famHit += fh; total += RUNS;
  perT.push({ id: t.id, top1: h1 / RUNS, top3: h3 / RUNS, fam_ok: fh / RUNS });
}
fits.sort((a, b) => a - b);
const pctl = (p) => fits[Math.floor(p * (fits.length - 1))].toFixed(1);

console.log(`noise sd=${NOISE}, drift sd=${DRIFT}, ${RUNS} runs per tendency, ${TA.tendencies.length} tendencies, ${TA.items.length} items`);
console.log(`overall top-1 ${(100 * top1 / total).toFixed(1)}%  top-3 ${(100 * top3 / total).toFixed(1)}%  right family drilled ${(100 * famHit / total).toFixed(1)}%  third module used ${(100 * third / total).toFixed(0)}%`);
console.log(`fit of the true tendency: p10 ${pctl(0.1)}  median ${pctl(0.5)}  p90 ${pctl(0.9)}`);
console.log('\nweakest tendencies (top-1 < 70%):');
perT.filter((p) => p.top1 < 0.7).sort((a, b) => a.top1 - b.top1).forEach((p) =>
  console.log(`  ${p.id.padEnd(13)} top1 ${(p.top1 * 100).toFixed(0).padStart(3)}%  top3 ${(p.top3 * 100).toFixed(0).padStart(3)}%  family ${(p.fam_ok * 100).toFixed(0)}%`));
console.log('\nconfusions above 10% of runs:');
Object.entries(confusion).filter(([, n]) => n / RUNS > 0.1).sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`  ${k.padEnd(28)} ${(100 * n / RUNS).toFixed(0)}%`));

// Theory schools
let tHit = 0, tTop3 = 0, tTot = 0;
const tMiss = {};
for (const s of TA.schools) {
  for (let i = 0; i < RUNS; i++) {
    const answers = {};
    const sd = drifted(s); E.theoryOrder().forEach((id) => { answers[id] = answer(E.itemById[id], sd); });
    const sc = E.scoreSchools(answers);
    const rank = sc.findIndex((x) => x.s.id === s.id);
    if (rank === 0) tHit++; else tMiss[s.id + ' -> ' + sc[0].s.id] = (tMiss[s.id + ' -> ' + sc[0].s.id] || 0) + 1;
    if (rank < 3) tTop3++;
    tTot++;
  }
}
console.log(`\ntheory schools top-1 ${(100 * tHit / tTot).toFixed(1)}%  top-3 ${(100 * tTop3 / tTot).toFixed(1)}%`);
Object.entries(tMiss).filter(([, n]) => n / RUNS > 0.1).sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`  ${k.padEnd(28)} ${(100 * n / RUNS).toFixed(0)}%`));

// Personas
try {
  const personas = require('./personas.js');
  console.log('\npersonas:');
  for (const p of personas) {
    const answers = p.answers(E);
    const fams = E.pickModules(answers);
    if (p.modules) Object.assign(answers, p.modules(E, fams));
    const sc = E.scoreTendencies(answers);
    const rank = sc.findIndex((s) => p.expect.indexOf(s.t.id) >= 0);
    const ok = rank === 0 ? 'PASS' : rank < 3 ? 'near' : 'FAIL';
    console.log(`  ${ok.padEnd(4)} ${p.name.padEnd(24)} expected ${p.expect.join('/').padEnd(22)} got ${sc.slice(0, 3).map((s) => `${s.t.id} ${s.fit.toFixed(0)}`).join(', ')}  drilled ${fams.join(',')}`);
  }
} catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
