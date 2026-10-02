import fs from 'fs';
import * as topo from 'topojson-server';
import * as simp from 'topojson-simplify';
import * as client from 'topojson-client';
import { geoArea, geoBounds } from 'd3-geo';

const src = JSON.parse(fs.readFileSync('ne10.geojson'));
// Pieces merged into the internationally recognised state they sit inside.
const MERGE = { SOL: 'SOM', CYN: 'CYP', CNM: 'CYP', KAB: 'KAZ', USG: 'CUB' };
const DROP = new Set(['ATA']);
// Overseas parts split off France / Netherlands so they aren't clickable as the mainland.
function splitPart(code, poly) {
  const xs = poly[0].map(c => c[0]), ys = poly[0].map(c => c[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  if (code === 'FRA') {
    if (cx < -50 && cy < 7) return ['GUF', 'French Guiana'];
    if (cx < -60 && cy > 15.7 && cy < 16.6) return ['GLP', 'Guadeloupe'];
    if (cx < -60 && cy < 15) return ['MTQ', 'Martinique'];
    if (cx > 50) return ['REU', 'Réunion'];
    if (cx > 40) return ['MYT', 'Mayotte'];
  }
  if (code === 'NLD' && cx < -60) return ['BES', 'Caribbean Netherlands'];
  return null;
}
const groups = new Map();
function add(id, name, polys, label) {
  if (!groups.has(id)) groups.set(id, { id, name, polys: [], label });
  const g = groups.get(id); g.polys.push(...polys); if (label && !g.label) g.label = label;
}
for (const f of src.features) {
  const p = f.properties; let code = p.ADM0_A3;
  if (DROP.has(code)) continue;
  const g = f.geometry; const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
  const label = [+p.LABEL_X.toFixed(3), +p.LABEL_Y.toFixed(3)];
  if (MERGE[code]) { add(MERGE[code], null, polys, null); continue; }
  if (code === 'FRA' || code === 'NLD') {
    for (const poly of polys) {
      const s = splitPart(code, poly);
      if (s) add(s[0], s[1], [poly], null); else add(code, p.NAME, [poly], label);
    }
    continue;
  }
  add(code, p.NAME, polys, label);
}
const fc = { type: 'FeatureCollection', features: [] };
for (const g of groups.values()) {
  const feat = { type: 'Feature', id: g.id, properties: { n: g.name }, geometry: { type: 'MultiPolygon', coordinates: g.polys } };
  // d3 expects clockwise exterior rings; reverse any polygon that would cover the globe.
  feat.geometry.coordinates = g.polys.map(poly => {
    const a = geoArea({ type: 'Polygon', coordinates: poly });
    return a > 2 * Math.PI ? poly.map(r => r.slice().reverse()) : poly;
  });
  if (!g.label) { const b = geoBounds(feat); g.label = [+((b[0][0] + b[1][0]) / 2).toFixed(3), +((b[0][1] + b[1][1]) / 2).toFixed(3)]; }
  if (g.id === 'KIR') g.label = [172.98, 1.42]; // Tarawa, not Kiritimati
  feat.properties.l = g.label;
  fc.features.push(feat);
}
let t = topo.topology({ c: fc }, 1e5);
// Merge pieces into one dissolved shape per country (removes e.g. the Somalia/Somaliland line).
const geoms = t.objects.c.geometries;
const merged = {};
for (const gm of geoms) { (merged[gm.id] ||= []).push(gm); }
t.objects.c.geometries = Object.entries(merged).map(([id, arr]) => ({ ...client.mergeArcs(t, arr), id, properties: arr.find(a => a.properties.n)?.properties || arr[0].properties }));
t = simp.presimplify(t);
// Never simplify arcs of small countries/islands (microstates would collapse to nothing).
const areaOf = {}; for (const f of fc.features) areaOf[f.id] = (areaOf[f.id] || 0) + geoArea(f) * 6371 ** 2;
const walk = (a, fn) => Array.isArray(a) ? a.forEach(x => walk(x, fn)) : fn(a);
for (const gm of t.objects.c.geometries) {
  if (areaOf[gm.id] > 3000) continue;
  walk(gm.arcs, i => { for (const pt of t.arcs[i < 0 ? ~i : i]) pt[2] = Infinity; });
}
const thr = +process.argv[2] || 1e-4;
t = simp.simplify(t, simp.quantile(t, thr));
t = simp.filter(t, simp.filterAttachedWeight(t, 0, simp.planarRingArea));
const out = 'window.WORLD=' + JSON.stringify(t) + ';\n';
fs.writeFileSync('world-topo.js', out);
console.log('features', t.objects.c.geometries.length, 'bytes', out.length);
