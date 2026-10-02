// Generates data/names.js (country names in English, Spanish and French) from
// Natural Earth 1:10m Admin 0 countries. Usage: node data/build-names.mjs ne_10m_admin_0_countries.geojson
import fs from "fs";

const src = JSON.parse(fs.readFileSync(process.argv[2]));
const names = { en: {}, es: {}, fr: {} };
for (const f of src.features) {
  const p = f.properties;
  names.en[p.ADM0_A3] = p.NAME_EN;
  names.es[p.ADM0_A3] = p.NAME_ES;
  names.fr[p.ADM0_A3] = p.NAME_FR;
}
// Pieces split off France and the Netherlands by build-data.mjs.
const split = {
  GUF: ["French Guiana", "Guayana Francesa", "Guyane"],
  GLP: ["Guadeloupe", "Guadalupe", "Guadeloupe"],
  MTQ: ["Martinique", "Martinica", "Martinique"],
  REU: ["Réunion", "Reunión", "La Réunion"],
  MYT: ["Mayotte", "Mayotte", "Mayotte"],
  BES: ["Caribbean Netherlands", "Caribe Neerlandés", "Pays-Bas caribéens"],
};
for (const [id, [en, es, fr]] of Object.entries(split)) Object.assign(names, { en: { ...names.en, [id]: en }, es: { ...names.es, [id]: es }, fr: { ...names.fr, [id]: fr } });
// Display names that read better than Natural Earth's for players.
Object.assign(names.es, { SWZ: "Esuatini", TWN: "Taiwán", CZE: "Chequia", FSM: "Micronesia", COD: "RD del Congo" });
Object.assign(names.fr, { CHN: "Chine", FSM: "Micronésie", COD: "RD du Congo" });
fs.writeFileSync(new URL("./names.js", import.meta.url), "window.NAMES=" + JSON.stringify(names) + ";\n");
console.log("ids", Object.keys(names.en).length);
