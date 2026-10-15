/* Hand-written answer sheets for the core questions. Numbers are the 7-point
   scale (1 = strongly disagree, 7 = strongly agree), letters are options of
   multiple-choice questions, ? is unsure. Sheets are written from each
   figure's documented positions, independently of the tendency profiles.
   Drill-down answers come from the sheet when given (mod), otherwise from the
   expected tendency's own module answers, so the core sheet alone decides
   which family is reached. */
function parse(str) {
  const out = {};
  str.trim().split(/\s+/).forEach((pair) => { const [k, v] = pair.split(':'); out[k] = v; });
  return out;
}
function toAnswers(E, sheet) {
  const a = {};
  for (const id in sheet) {
    const it = E.itemById[id];
    if (!it) throw new Error('unknown item ' + id);
    const v = sheet[id];
    if (v === '?') { a[id] = 1; continue; }
    if (it.t === 'm') {
      const i = v.charCodeAt(0) - 65;
      if (i < 0 || i >= it.opts.length) throw new Error('bad option ' + id + ':' + v);
      a[id] = i + 2;
    } else a[id] = parseInt(v, 10) + 1;
  }
  return a;
}
function persona(name, expect, core, mod) {
  return {
    name, expect,
    answers: (E) => toAnswers(E, parse(core)),
    modules: (E, fams) => {
      const own = mod ? toAnswers(E, parse(mod)) : {};
      const t = E.tById[expect[0]], a = {};
      E.TA_items = E.TA_items || Object.values(E.itemById);
      E.TA_items.forEach((it) => {
        if (it.part !== 'mod' || fams.indexOf(it.fam) < 0) return;
        if (own[it.id]) { a[it.id] = own[it.id]; return; }
        if (it.fam !== t.fam || !it.x || it.x[t.id] === undefined) { a[it.id] = 1; return; }
        const x = it.x[t.id];
        a[it.id] = it.t === 'm' ? (Array.isArray(x) ? x[0] : x) + 2 : Math.round(x * 3) + 5;
      });
      return a;
    }
  };
}

module.exports = [
  persona('James Connolly', ['connolly'], `
    s1:E s2:C s3:7 s4:1 s5:7 s6:? s7:C s8:7 s9:7 s10:D s11:5 s12:6 s13:3 s14:6 s15:2
    o1:B o2:5 o3:5 o4:5 o5:A o6:6 o7:4 o8:5
    st1:C st2:4 st3:6 st5:6 st6:6 st7:? st8:5
    f1:? f2:5 f3:6 f4:7 f6:C f7:5 f8:5
    c1:C c2:3 c4:3 c5:3 c6:5 c8:6
    k1:C k2:5 k3:2 k5:5 k6:2 k7:D k8:7
    w1:3 w2:B w3:7 w5:6 w6:6 w8:5
    g2:6 g7:7
    e2:3 e3:5 e5:3 e6:3
    i1:B i3:B i6:6 i8:3
    cap1:7 cap2:1 cap3:1 cap4:3 nv1:E nv2:7 nv3:3
    soc1:5 soc2:3 nat1:7 nat2:1 nat3:3 ind2:5
    fm1:B fm3:4 re1:5 re2:B re3:7
    ag1:5 ag2:5 ag3:B ag4:5`),

  persona('Ira Steward (labor republican)', ['laborrep'], `
    s1:B s2:D s3:3 s4:5 s5:5 s7:C s8:4 s9:4 s10:B s11:3 s12:6 s13:5 s15:4
    o1:C o2:3 o3:4 o4:6 o5:B o6:3 o7:5
    st1:A st2:4 st3:5 st6:5 st8:5
    f1:A f2:7 f3:2 f4:7 f6:A f7:7 f8:3
    c1:A c2:5 c4:6 c5:6 c6:7 c8:4
    k1:C k2:3 k3:1 k5:5 k6:2 k7:C k8:4
    w1:4 w2:A w3:6 w5:5 w6:7 w8:3
    g2:5
    e2:3 e3:4 e5:3 e6:3
    i1:B i3:A i6:5 i8:2
    cap1:6 cap2:2 cap3:3 cap4:6 nv1:B nv2:2 nv3:5
    soc1:5 soc2:4 nat1:5 nat2:4 nat3:4
    fm1:B fm2:3 fm3:4 re1:7 re2:B re3:7
    ag1:5 ag2:6 ag3:B ag4:5 ai4:7`),

  persona('Edward Bellamy', ['commonwealth'], `
    s1:B s2:A s3:2 s4:6 s5:2 s7:A s8:2 s9:4 s10:B s11:3 s12:3 s13:7 s14:2 s15:4
    o1:B o2:4 o3:4 o4:3 o5:B o6:3 o7:4
    st1:A st2:2 st3:5 st6:3 st7:? st8:7
    f1:A f2:6 f3:3 f4:4 f6:A f7:6 f8:4
    c1:C c2:2 c4:2 c5:2 c6:2 c7:? c8:7
    k1:A k2:7 k3:5 k5:3 k6:6 k7:A k8:2
    w1:6 w2:A w3:6 w5:5 w6:7 w8:3
    g2:5
    e1:A e2:2 e3:6 e5:2 e6:2
    i1:A i3:A i6:4 i8:3
    cap1:7 cap2:1 cap3:1 cap4:3 nv1:A nv2:1 nv3:7
    soc1:5 soc2:4 nat1:4 nat2:4 nat3:4
    fm1:A fm3:3 re1:5 re2:C re3:7
    ag1:3 ag2:3 ag3:A ag4:3 ai1:6 ai2:5`),

  persona('You (left Eurocommunist)', ['lefteuro'], `
    s1:D s2:B s3:6 s4:2 s5:7 s6:B s7:B s8:5 s9:6 s10:C s11:3 s12:5 s13:6 s14:5 s15:3
    o1:B o2:7 o3:6 o4:5 o5:A o6:3 o7:5 o8:3
    st1:B st2:7 st3:7 st4:2 st5:7 st6:6 st7:2 st8:6
    f1:B f2:2 f3:6 f4:7 f5:6 f6:B f7:6 f8:5
    c1:B c2:5 c3:1 c4:6 c5:6 c6:2 c7:B c8:6
    k1:C k2:4 k3:3 k4:7 k5:7 k6:2 k7:C k8:6
    w1:2 w2:B w3:7 w4:2 w5:6 w6:7 w7:5 w8:3
    g1:C g2:5 g3:2 g4:7 g5:6 g6:7 g7:5 g8:3
    v1:D v2:6 v3:? v4:5 v5:6 v6:B v7:4 v8:4
    e1:C e2:6 e3:6 e4:6 e5:3 e6:5 e7:7 e8:B
    i1:B i2:4 i3:B i5:4 i6:7 i7:2 i8:4
    cap1:7 cap2:1 cap3:5 cap4:2 nv1:D nv2:7 nv3:2
    soc1:4 soc2:2 soc3:7 nat1:2 nat2:2 nat3:2 ind1:3 ind2:1
    ag1:7 ag2:6 ag3:C ag4:7 ai1:5 ai2:1 ai3:5 ai4:6 ai5:6 ai6:1`,
  `d1:D d2:C d3:2 d4:7 d5:2 d6:1 d7:B d8:2 d9:2 d10:1 d11:7 d12:7 d13:7 d14:5
   au1:5 au2:3 au3:3 au4:3 au5:5 au6:5 au7:4 au8:2 au9:3 au10:6 au11:7 au12:7 au13:5 au14:6`),

  persona('Lenin', ['ml', 'orthotrot'], `
    s1:E s2:C s3:7 s4:1 s5:6 s6:C s7:C s8:7 s9:7 s10:D s11:6 s12:6 s13:2 s14:7 s15:1
    o1:A o2:7 o3:7 o4:2 o5:A o6:7 o7:2 o8:1
    st1:C st2:2 st3:7 st4:7 st5:7 st6:3 st7:6 st8:7
    f1:D f2:2 f3:7 f4:4 f5:7 f6:C f7:2 f8:7
    c1:B c2:3 c3:? c4:3 c5:2 c6:5 c7:? c8:7
    k1:A k2:7 k3:6 k4:? k5:3 k6:6 k7:A k8:3
    w1:1 w2:C w3:3 w4:? w5:7 w6:1 w7:? w8:5
    g1:? g2:6 g3:? g4:? g5:? g6:? g7:7 g8:?
    v1:? v2:? v3:? v4:? v5:? v6:? v7:? v8:?
    e1:? e2:1 e3:7 e4:? e5:1 e6:2 e7:? e8:?
    i1:A i2:5 i3:A i5:3 i6:7 i7:? i8:4
    cap1:7 cap2:1 cap3:1 cap4:1 nv1:E nv2:7 nv3:1
    soc1:3 soc2:1 soc3:? nat1:7 nat2:2 nat3:2 ind1:? ind2:2
    ag1:? ag2:? ag3:? ag4:3`),

  persona('Enrico Berlinguer', ['eurocomm'], `
    s1:B s2:A s3:2 s4:6 s5:3 s6:A s7:A s8:2 s9:3 s10:B s11:2 s12:3 s13:7 s14:5 s15:6
    o1:B o2:6 o3:5 o4:3 o5:B o6:5 o7:3 o8:4
    st1:A st2:3 st3:6 st4:4 st5:6 st6:4 st7:5 st8:6
    f1:A f2:7 f3:3 f4:7 f5:3 f6:B f7:7 f8:3
    c1:B c2:4 c3:4 c4:5 c5:6 c6:7 c7:B c8:5
    k1:B k2:5 k3:4 k4:4 k5:4 k6:4 k7:B k8:3
    w1:? w2:B w3:7 w4:3 w5:5 w6:6 w7:2 w8:3
    g1:C g2:5 g7:4
    v1:C v2:2 v3:2 v4:4 v5:6 v6:B v7:2 v8:?
    e2:4 e3:4 e5:5 e6:4
    i1:B i2:4 i3:B i5:4 i6:6 i8:2
    cap1:5 cap2:3 cap3:4 cap4:3 nv1:A nv2:2 nv3:7
    soc1:5 soc2:3 nat1:6 nat2:3 nat3:5 ind2:2
    ag1:4 ag2:4 ag3:B ag4:4`,
  `d1:B d2:B d3:7 d4:2 d5:2 d6:2 d7:A d8:4 d9:2 d10:3 d11:5 d12:4 d13:6 d14:7`),

  persona('Nicos Poulantzas', ['lefteuro'], `
    s1:C s2:B s3:6 s4:3 s5:6 s6:B s7:B s8:5 s9:6 s10:C s11:3 s12:5 s13:6 s14:4 s15:3
    o1:B o2:4 o3:5 o4:5 o5:B o6:3 o7:5 o8:6
    st1:B st2:5 st3:5 st4:2 st5:6 st6:6 st7:4 st8:6
    f1:B f2:7 f3:3 f4:7 f5:2 f6:B f7:6 f8:4
    c1:C c2:3 c4:4 c5:4 c6:5 c7:B c8:6
    k1:C k2:5 k3:2 k4:5 k5:6 k6:2 k7:B k8:5
    w1:3 w2:B w3:6 w4:4 w5:6 w6:4 w8:4
    g1:C g2:6 g7:5
    v1:C v2:1 v3:1 v4:4 v5:7 v6:B v7:2 v8:4
    e2:4 e3:3 e5:4 e6:5
    i1:B i2:3 i3:C i5:5 i6:5 i8:4
    cap1:7 cap2:1 cap3:2 cap4:2 nv1:B nv2:4 nv3:5
    soc1:3 soc2:2 soc3:6 nat1:6 nat2:3 nat3:4 ind2:2
    ag1:6 ag2:6 ag3:B ag4:6`,
  `d1:D d2:C d3:2 d4:6 d5:2 d6:1 d7:B d8:2 d9:2 d10:2 d11:7 d12:7 d13:4 d14:7`),

  persona('Eduard Bernstein', ['bernstein'], `
    s1:B s2:A s3:2 s4:6 s5:3 s6:A s7:A s8:3 s9:2 s10:A s11:1 s12:3 s13:7 s14:1 s15:6
    o1:B o2:3 o3:4 o4:4 o5:B o6:3 o7:4
    st1:A st2:3 st3:6 st5:6 st6:4 st8:7
    f1:A f2:7 f3:4 f4:7 f5:1 f6:A f7:7 f8:2
    c1:B c2:6 c4:6 c5:7 c6:7 c7:A c8:4
    k1:B k2:4 k3:4 k5:4 k6:5 k7:C k8:2
    w2:B w3:6 w5:4 w6:5 w8:3
    g2:4 g7:3
    e2:2 e3:5 e5:2 e6:2
    i1:A i3:A i5:3 i6:5 i8:2
    cap1:5 cap2:3 cap3:4 cap4:4 nv1:A nv2:1 nv3:6
    soc1:5 soc2:3 nat1:4 nat2:4 nat3:4 ind2:1
    ag1:4 ag2:4 ag4:4`),

  persona('Amadeo Bordiga', ['bordiga'], `
    s1:E s2:C s3:7 s4:1 s5:4 s6:C s7:D s8:4 s9:7 s10:D s11:7 s12:6 s13:1 s14:7 s15:1
    o1:A o2:7 o3:7 o4:1 o5:D o6:6 o7:3 o8:1
    st1:C st2:2 st3:7 st4:6 st5:7 st6:2 st8:7
    f1:D f2:1 f3:7 f4:2 f5:7 f6:E f7:1 f8:7
    c1:D c2:1 c3:1 c4:1 c5:1 c6:2 c8:7
    k1:A k2:3 k3:5 k4:1 k5:2 k6:4 k8:2
    w1:1 w2:C w3:1 w4:7 w5:7 w6:1 w8:5
    g2:7 g4:6 g5:1 g6:1 g7:7 g8:1
    v1:D v2:1 v3:2 v4:1 v5:5 v6:D v7:1 v8:2
    e2:4 e3:4 e5:4 e6:4
    i1:A i2:7 i3:A i5:1 i6:7 i7:1 i8:6
    cap1:7 cap2:1 cap3:1 cap4:1 nv1:E nv2:7 nv3:3
    soc1:2 soc2:1 soc3:4 nat1:3 nat2:6 nat3:2 ind2:1
    ag1:2 ag2:2 ag4:2`),

  persona('Murray Bookchin', ['socialeco'], `
    s2:D s3:5 s4:2 s5:6 s6:B s7:B s8:4 s9:6 s10:D s11:5 s12:5 s13:4 s14:2 s15:3
    o1:C o2:4 o3:6 o4:4 o5:C o6:4 o7:5 o8:6
    st1:D st2:7 st3:2 st4:1 st5:2 st6:7 st7:2 st8:3
    f2:6 f3:2 f4:6 f5:2 f6:D f7:6 f8:3
    c1:D c2:2 c3:1 c4:2 c5:2 c6:4 c7:B c8:6
    k1:D k2:2 k3:1 k4:3 k5:7 k6:1 k7:D k8:3
    w1:2 w2:C w3:4 w5:6 w6:2 w8:4
    g1:C g2:7 g5:2 g7:5 g8:2
    v1:D v2:1 v3:1 v4:2 v5:7 v6:C v7:1 v8:2
    e1:D e2:6 e3:2 e4:1 e5:6 e6:7 e8:C
    i1:C i2:3 i3:C i5:6 i6:2 i8:5
    cap1:7 cap2:1 cap3:1 cap4:2 nv1:B nv2:4 nv3:3
    soc1:2 soc2:1 soc3:6 nat1:3 nat2:6 nat3:3 ind1:5 ind2:5
    ag1:7 ag2:6 ag3:C ag4:7 ai1:4 ai2:2 ai3:6 ai4:6 ai5:5 ai6:3`),

  persona('Peter Kropotkin', ['ancom'], `
    s1:E s2:C s3:7 s4:1 s5:7 s6:C s7:C s8:7 s9:7 s10:D s11:6 s12:7 s13:1 s15:2
    o1:D o2:2 o3:2 o4:7 o5:C o6:3 o7:7 o8:7
    st1:D st2:7 st3:1 st4:1 st5:1 st6:7 st7:1 st8:1
    f2:5 f3:1 f4:7 f6:D f7:6 f8:2
    c1:D c2:1 c4:1 c5:1 c6:3 c7:B c8:6
    k1:D k2:1 k3:1 k4:4 k5:7 k6:1 k7:D k8:5
    w1:1 w2:C w3:3 w5:7 w6:2 w8:6
    g2:7
    e2:2 e3:4 e5:3 e6:4
    i1:B i6:5 i8:5
    cap1:7 cap2:1 cap3:1 cap4:1 nv1:E nv2:6 nv3:3
    soc1:3 soc2:1 nat1:5 nat2:4 nat3:4 ind2:6
    ag1:6 ag2:6 ag3:C ag4:7`),

  persona('Henri Lefebvre', ['autog'], `
    s1:D s2:B s3:5 s4:2 s5:7 s6:B s7:C s8:6 s9:6 s10:C s11:5 s12:6 s13:4 s14:5 s15:3
    o1:C o2:3 o3:4 o4:6 o5:C o6:3 o7:6 o8:6
    st1:B st2:6 st3:4 st4:2 st5:6 st6:7 st7:3 st8:4
    f1:B f2:6 f3:3 f4:7 f5:3 f6:B f7:6 f8:4
    c1:C c2:3 c3:2 c4:4 c5:3 c6:4 c7:B c8:6
    k1:D k2:3 k3:1 k4:5 k5:7 k6:1 k7:D k8:6
    w1:2 w2:B w3:4 w5:6 w6:3 w8:5
    g1:C g2:6 g7:5
    v1:C v2:1 v3:1 v4:4 v5:7 v6:C v7:2 v8:3
    e1:B e2:5 e3:3 e5:5 e6:6 e8:B
    i1:B i2:3 i3:C i5:5 i6:3 i8:5
    cap1:7 cap2:1 cap3:1 cap4:2 nv1:B nv2:4 nv3:4
    soc1:2 soc2:2 soc3:6 nat1:5 nat2:4 nat3:4 ind1:5 ind2:4
    ag1:7 ag2:7 ag3:C ag4:7 ai1:5 ai3:6 ai4:6`),

  persona('Anton Pannekoek', ['council'], `
    s1:E s2:C s3:7 s4:1 s5:7 s6:C s7:D s8:7 s9:7 s10:D s11:7 s12:7 s13:1 s14:5 s15:1
    o1:D o2:1 o3:2 o4:7 o5:C o6:2 o7:7 o8:7
    st1:C st2:5 st3:4 st4:1 st5:5 st6:6 st8:5
    f2:3 f3:5 f4:6 f5:4 f6:D f7:4 f8:4
    c1:D c2:1 c3:1 c4:1 c5:1 c6:2 c7:B c8:6
    k1:D k2:1 k3:1 k4:3 k5:6 k6:1 k7:D k8:7
    w1:1 w2:C w3:2 w5:7 w6:1 w8:6
    g2:7 g6:1 g7:6
    v1:D v2:1 v3:1 v4:2 v5:7 v6:D v7:1 v8:2
    e2:3 e3:4 e5:3 e6:4
    i1:A i2:6 i3:A i5:2 i6:7 i8:4
    cap1:7 cap2:1 cap3:1 cap4:1 nv1:D nv2:6 nv3:3
    soc1:3 soc2:1 soc3:4 nat1:2 nat2:7 nat3:2 ind2:2
    ag1:4 ag2:5 ag3:C ag4:5`),

  persona('Olof Palme', ['socdem'], `
    s1:B s2:A s3:2 s4:7 s5:3 s6:A s7:A s8:2 s9:2 s10:A s11:1 s12:3 s13:7 s14:2 s15:6
    o1:B o2:5 o3:4 o4:4 o5:B o6:3 o7:4
    st1:A st2:2 st3:7 st6:3 st7:6 st8:7
    f1:A f2:7 f3:4 f4:7 f5:1 f6:A f7:7 f8:2
    c1:A c2:6 c3:3 c4:6 c5:7 c6:7 c7:A c8:3
    k1:B k2:3 k3:4 k4:4 k5:4 k6:5 k7:C k8:2
    w2:B w3:6 w5:4 w6:5 w7:2 w8:4
    g1:C g2:6 g3:1 g5:3 g6:7 g7:4 g8:1
    v1:C v2:1 v3:1 v4:3 v5:7 v6:C v7:1 v8:2
    e2:3 e3:4 e4:5 e5:3 e6:3
    i1:B i2:4 i3:B i5:4 i6:5 i7:3 i8:2
    cap1:3 cap2:6 cap3:6 cap4:3 nv1:A nv2:1 nv3:6
    soc1:4 soc2:2 soc3:5 nat1:6 nat2:3 nat3:4 ind1:4 ind2:2
    ag1:4 ag2:4 ag3:B ag4:4`),

  persona('Sahra Wagenknecht', ['leftcon'], `
    s1:B s2:A s3:3 s4:6 s5:3 s6:D s7:A s8:2 s9:3 s10:B s11:2 s12:3 s13:6 s14:3 s15:6
    o1:B o2:4 o3:5 o4:3 o5:A o6:3 o7:5 o8:4
    st1:A st2:3 st3:7 st4:4 st5:5 st6:3 st7:6 st8:7
    f1:A f2:7 f3:3 f4:6 f5:3 f6:A f7:6 f8:4
    c1:B c2:5 c3:4 c4:6 c5:6 c6:7 c7:A c8:4
    k1:A k2:5 k3:4 k4:3 k5:3 k6:5 k7:B k8:2
    w1:4 w2:A w3:7 w4:3 w5:3 w6:7 w7:5 w8:2
    g1:A g2:3 g3:7 g4:2 g5:7 g6:1 g7:7 g8:5
    v1:C v2:3 v4:5 v5:4 v6:B v7:3 v8:5
    e1:B e2:2 e3:5 e4:3 e5:2 e6:2 e8:B
    i1:A i2:7 i3:A i5:2 i6:6 i7:2 i8:1
    cap1:4 cap2:5 cap3:5 cap4:6 nv1:A nv2:1 nv3:6
    soc1:6 soc2:7 soc3:3 nat1:4 nat2:3 nat3:3 ind1:3 ind2:2
    ag1:3 ag2:3 ag3:A ag4:3 ai1:4 ai2:2 ai3:4 ai4:4 ai5:5 ai6:3`),

  persona('Deng Xiaoping', ['deng'], `
    o1:A o2:7 o3:6 o4:2 o5:A o6:6 o7:2 o8:1
    st2:1 st3:7 st4:6 st5:7 st6:2 st7:7 st8:7
    f1:D f2:1 f3:7 f4:2 f5:6 f6:E f7:1 f8:7
    c1:B c2:6 c3:7 c4:7 c5:7 c6:7 c7:A c8:5
    k1:A k2:6 k3:7 k4:4 k5:2 k6:7 k7:A k8:1
    w1:7 w2:A w3:7 w4:2 w5:4 w6:7 w8:2
    g1:A g2:2 g3:6 g4:1 g5:7 g6:2 g7:6 g8:7
    v1:A v2:5 v3:5 v4:5 v5:3 v6:A v7:5 v8:4
    e1:A e2:1 e3:7 e4:7 e5:1 e6:1 e7:1 e8:A
    i1:A i2:6 i3:A i5:2 i6:6 i7:3 i8:2
    cap1:4 cap2:3 cap3:5 cap4:2 nv2:5 nv3:2
    soc1:6 soc2:4 soc3:2 nat1:3 nat2:3 nat3:3 ind1:1 ind2:1
    ag1:2 ag2:3 ag3:A ag4:2 ai1:6 ai2:6 ai3:4 ai4:4 ai5:1 ai6:2`),

  persona('Tony Cliff', ['cliff'], `
    s1:E s2:C s3:7 s4:1 s5:7 s6:B s7:C s8:7 s9:7 s10:D s11:6 s12:7 s13:2 s14:7 s15:2
    o1:A o2:7 o3:6 o4:4 o5:B o6:6 o7:4 o8:4
    st1:C st2:4 st3:6 st4:5 st5:7 st6:5 st7:4 st8:6
    f1:C f2:5 f3:6 f4:7 f5:6 f6:C f7:5 f8:4
    c1:C c2:2 c3:1 c4:2 c5:3 c6:4 c7:B c8:7
    k1:C k2:4 k3:2 k4:4 k5:5 k6:2 k7:B k8:6
    w1:1 w2:C w3:2 w4:7 w5:7 w6:1 w7:5 w8:6
    g1:C g2:7 g3:2 g4:7 g5:2 g6:3 g7:6 g8:1
    v1:D v2:1 v3:1 v4:2 v5:7 v6:D v7:1 v8:2
    e2:4 e3:5 e5:3 e6:3
    i1:B i2:5 i3:C i5:3 i6:7 i7:4 i8:5
    cap1:7 cap2:1 cap3:1 cap4:1 nv1:E nv2:7 nv3:3
    soc1:2 soc2:1 soc3:7 nat1:7 nat2:2 nat3:3 ind1:5 ind2:3
    ag1:5 ag2:5 ag3:B ag4:5`),

  persona('Kohei Saito', ['degrowth'], `
    s1:C s2:B s3:5 s4:3 s5:7 s7:C s8:5 s9:6 s10:C s11:4 s12:6 s13:4 s15:3
    o1:C o2:3 o3:4 o4:6 o5:C o6:3 o7:5 o8:6
    st1:B st2:5 st3:4 st5:5 st6:7 st7:4 st8:5
    f1:B f2:6 f3:3 f4:7 f6:B f7:6 f8:4
    c1:C c2:2 c3:2 c4:3 c5:3 c6:5 c7:B c8:7
    k1:D k2:4 k3:2 k5:7 k6:2 k7:D k8:5
    w1:2 w2:C w3:4 w5:6 w6:2 w8:5
    g1:C g2:6 g5:3 g8:2
    v1:C v2:1 v3:1 v4:4 v5:6 v6:C v7:2 v8:3
    e1:C e2:7 e3:1 e4:2 e5:7 e6:7 e7:6 e8:C
    i1:C i2:2 i3:C i5:6 i6:3 i7:6 i8:5
    cap1:7 cap2:1 cap3:1 cap4:2 nv1:B nv2:4 nv3:4
    soc1:2 soc2:1 soc3:7 nat1:5 nat2:4 nat3:4 ind1:7 ind2:6
    ag1:7 ag2:7 ag3:C ag4:7 ai1:6 ai2:2 ai3:7 ai4:6 ai5:6 ai6:4`)
];
