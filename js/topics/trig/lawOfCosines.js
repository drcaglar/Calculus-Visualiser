// Laws of Cosines and Sines (chapter 'trig'): solving ANY triangle. Thomas 1.3.
// problem = { type:'sas'|'sss'|'asa'|'aas'|'ssa', a,b,c (sides), A,B,C (angles, degrees) }
//   sas: a, b, C given      sss: a, b, c given      asa: A, B, c (c between the angles) given
//   aas: A, B, a (a opposite A) given      ssa: a, b, A (A opposite a) given -> 0, 1 or 2 triangles
// The triangle is always drawn with A at the left end of the base, inside the fixed window -8..8 x -6..6
// (large triangles are drawn at a reduced scale; the labels always show the true values).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dec === undefined ? 2 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const sinD = (d) => Math.sin(d * D2R), cosD = (d) => Math.cos(d * D2R);
  const acosD = (c) => Math.acos(Math.max(-1, Math.min(1, c))) * R2D;
  const asinD = (s) => Math.asin(Math.max(-1, Math.min(1, s))) * R2D;
  const dg = (v) => nf(v, 2) + '°';
  const EPS = 1e-9;

  // ---------- solving ----------
  function solve(p) {
    const tris = [];
    let reason = '';
    switch (p.type) {
      case 'sas': {
        const c = Math.sqrt(p.a * p.a + p.b * p.b - 2 * p.a * p.b * cosD(p.C));
        const A = acosD((p.b * p.b + c * c - p.a * p.a) / (2 * p.b * c));
        tris.push({ a: p.a, b: p.b, c, A, B: 180 - A - p.C, C: p.C });
        break;
      }
      case 'sss': {
        const { a, b, c } = p;
        if (!(a + b > c + EPS && a + c > b + EPS && b + c > a + EPS)) { reason = 'ineq'; break; }
        const A = acosD((b * b + c * c - a * a) / (2 * b * c));
        const B = acosD((a * a + c * c - b * b) / (2 * a * c));
        tris.push({ a, b, c, A, B, C: 180 - A - B });
        break;
      }
      case 'asa': {
        const C = 180 - p.A - p.B;
        if (C <= 0.5) { reason = 'angles'; break; }
        tris.push({ a: p.c * sinD(p.A) / sinD(C), b: p.c * sinD(p.B) / sinD(C), c: p.c, A: p.A, B: p.B, C });
        break;
      }
      case 'aas': {
        const C = 180 - p.A - p.B;
        if (C <= 0.5) { reason = 'angles'; break; }
        tris.push({ a: p.a, b: p.a * sinD(p.B) / sinD(p.A), c: p.a * sinD(C) / sinD(p.A), A: p.A, B: p.B, C });
        break;
      }
      default: { // ssa
        const sB = p.b * sinD(p.A) / p.a;
        if (sB > 1 + EPS) { reason = 'none'; break; }
        const B1 = sB >= 1 ? 90 : asinD(sB);
        [B1, 180 - B1].forEach((B, i) => {
          if (i === 1 && Math.abs(B - B1) < 1e-7) return;
          const C = 180 - p.A - B;
          if (C <= 1e-7) return;
          tris.push({ a: p.a, b: p.b, c: p.a * sinD(C) / sinD(p.A), A: p.A, B, C });
        });
      }
    }
    return { tris, reason };
  }
  const areaOf = (t) => 0.5 * t.a * t.b * sinD(t.C);
  const heron = (t) => { const s = (t.a + t.b + t.c) / 2; return Math.sqrt(Math.max(0, s * (s - t.a) * (s - t.b) * (s - t.c))); };

  // ---------- generation ----------
  const DEF = { a: 5, b: 6, c: 7, A: 40, B: 60, C: 80 };
  const SAS_NICE = [[3, 8, 60], [5, 8, 60], [8, 15, 60], [7, 15, 60], [3, 5, 120], [7, 8, 120], [5, 16, 120], [3, 4, 90], [5, 12, 90], [6, 8, 90], [6, 6, 60]];
  const SSS_NICE = [[3, 4, 5], [4, 5, 6], [5, 7, 8], [6, 7, 10], [7, 8, 9], [5, 12, 13], [8, 10, 12], [6, 9, 11], [7, 10, 12], [5, 6, 7], [7, 8, 13]];
  function genSSA(rng, kind) {
    for (let t = 0; t < 400; t++) {
      let A, b, a;
      if (kind === 'two') {
        A = rng.pick([30, 35, 40, 45, 50, 55, 60]); b = rng.nextInt(7, 15);
        const h = b * sinD(A), lo = Math.floor(h) + 1, hi = b - 1;
        if (lo > hi) continue;
        a = rng.nextInt(lo, hi + 1);
        if (!(a > h + 0.05)) continue;
      } else if (kind === 'none') {
        A = rng.pick([30, 40, 45, 50, 60, 70]); b = rng.nextInt(6, 15);
        const h = b * sinD(A);
        a = Math.floor(h) - rng.nextInt(1, 3);
        if (a < 2) continue;
      } else if (kind === 'right') {
        A = 30; b = rng.pick([6, 8, 10, 12, 14]); a = b / 2;
      } else {
        A = rng.pick([30, 40, 50, 60, 110, 120, 130]); b = rng.nextInt(4, 11);
        a = A > 90 ? b + rng.nextInt(1, 5) : b + rng.nextInt(0, 5);
      }
      return Object.assign({}, DEF, { type: 'ssa', a, b, A });
    }
    return Object.assign({}, DEF, { type: 'ssa', a: 8, b: 10, A: 40 });
  }
  function genType(rng, type) {
    const p = Object.assign({}, DEF, { type });
    if (type === 'sas') {
      if (rng.nextDouble() < 0.6) {
        const t = rng.pick(SAS_NICE); const sw = rng.nextDouble() < 0.5;
        p.a = sw ? t[1] : t[0]; p.b = sw ? t[0] : t[1]; p.C = t[2];
      } else { p.a = rng.nextInt(3, 13); p.b = rng.nextInt(3, 13); p.C = rng.nextInt(6, 30) * 5; }
    } else if (type === 'sss') {
      if (rng.nextDouble() < 0.6) {
        const t = rng.pick(SSS_NICE).slice();
        for (let i = 2; i > 0; i--) { const j = rng.nextInt(0, i + 1); const x = t[i]; t[i] = t[j]; t[j] = x; }
        p.a = t[0]; p.b = t[1]; p.c = t[2];
      } else {
        for (let k = 0; k < 200; k++) {
          const a = rng.nextInt(3, 13), b = rng.nextInt(3, 13), c = rng.nextInt(3, 13);
          if (a + b > c + 1 && a + c > b + 1 && b + c > a + 1) { p.a = a; p.b = b; p.c = c; break; }
        }
      }
    } else if (type === 'asa' || type === 'aas') {
      p.A = rng.nextInt(6, 19) * 5; p.B = rng.nextInt(6, 19) * 5;
      while (p.A + p.B > 150) p.B -= 5;
      const s = rng.nextInt(4, 15);
      if (type === 'asa') p.c = s; else p.a = s;
    } else {
      return genSSA(rng, rng.pick(['two', 'two', 'one', 'none', 'right']));
    }
    return p;
  }
  function createProblem(rng) { return genType(rng, rng.pick(['sas', 'sss', 'asa', 'aas', 'ssa', 'sas', 'ssa'])); }

  // ---------- texts ----------
  const FIELDS = { sas: ['a', 'b', 'C'], sss: ['a', 'b', 'c'], asa: ['A', 'B', 'c'], aas: ['A', 'B', 'a'], ssa: ['a', 'b', 'A'] };
  const isAng = (f) => f === f.toUpperCase();
  const gv = (p, f) => (isAng(f) ? f + ' = ' + dg(p[f]) : f + ' = ' + nf(p[f]));
  const givenList = (p) => FIELDS[p.type].map((f) => gv(p, f)).join(', ');
  const typeName = (t) => ({
    sas: Tx('SAS (iki kenar + aralarındaki açı)', 'SAS (two sides + included angle)'),
    sss: Tx('SSS (üç kenar)', 'SSS (three sides)'),
    asa: Tx('ASA (iki açı + aradaki kenar)', 'ASA (two angles + included side)'),
    aas: Tx('AAS (iki açı + bir karşı kenar)', 'AAS (two angles + a non-included side)'),
    ssa: Tx('SSA (iki kenar + karşı açı, belirsiz durum)', 'SSA (two sides + opposite angle, ambiguous case)'),
  }[t]);

  function concept() {
    return Tx(
`TANIM
Bir üçgenin üç kenarı (a, b, c) ve üç açısı (A, B, C) vardır; her kenar, adını taşıyan açının karşısındadır (a kenarı A açısının karşısında). Dik üçgen olmasa bile, yeterli veri varsa bütün kenar ve açıları bulabiliriz. Buna "üçgeni çözmek" denir. İki teorem işimizi görür.

TEMEL FORMÜLLER
Kosinüs teoremi:   c² = a² + b² − 2ab·cos C   (a² ve b² için de aynı biçimde)
Açı için:          cos C = (a² + b² − c²) / (2ab)
Sinüs teoremi:     a / sin A = b / sin B = c / sin C
Açılar toplamı:    A + B + C = 180°
Alan:              S = ½·a·b·sin C      Heron: S = √( s(s−a)(s−b)(s−c) ),  s = (a+b+c)/2

ANLAMI NE?
Kosinüs teoremi Pisagor teoreminin genel halidir: C = 90° ise cos C = 0 olur ve c² = a² + b² kalır. −2ab·cos C terimi, açı dik değilken gereken "düzeltme"dir. Sinüs teoremi ise "büyük açının karşısında büyük kenar vardır" fikrinin sayısal halidir.

HANGİ TEOREM, NE ZAMAN? (YÖNTEM)
1) Elimizdeki veriyi tanıyalım: SSS, SAS, ASA, AAS ya da SSA.
2) SAS → kosinüs teoremiyle üçüncü kenar, sonra açılar.
3) SSS → kosinüs teoremiyle açılar (üçüncü açı 180°'den bulunur).
4) ASA / AAS → üçüncü açı = 180° − A − B; sonra sinüs teoremiyle kenarlar.
5) SSA → sinüs teoremi; 0, 1 ya da 2 üçgen çıkabilir.
6) Sonunda açılar toplamını ve "büyük kenar – büyük açı" ilişkisini kontrol edelim.

BELİRSİZ DURUM (SSA)
a, b kenarları ve A açısı verilsin; h = b·sin A olsun.
• a < h : üçgen yok (a kenarı karşı kola ulaşamaz).
• a = h : tek üçgen, B = 90° (dik üçgen).
• h < a < b : iki üçgen vardır, B₁ = arcsin(b·sin A / a) ve B₂ = 180° − B₁.
• a ≥ b : tek üçgen (B₂ ile A'nın toplamı 180°'yi aşar).
arcsin yalnızca dar açıyı verir; geniş açıyı (180° − B) kendimiz düşünmeliyiz.

DİKKAT EDİLECEKLER
• Hesap makinesi derece (DEG) modunda olmalı.
• Açı bulurken mümkünse kosinüs teoremini seçelim: arccos 0°–180° arasında tek açı verir, belirsizlik çıkmaz.
• SSS'de üçgen eşitsizliği şart: her kenar diğer ikisinin toplamından küçük olmalı.
• cos negatifse açı geniştir (90°'den büyük).

MİNİ ÖRNEK
a = 5, b = 8, C = 60° (SAS): c² = 25 + 64 − 2·5·8·½ = 49, yani c = 7.

MÜHENDİSLİKTE
Kuvvet çokgenlerinde iki kuvvetin bileşkesi (R² = F₁² + F₂² + 2F₁F₂·cos θ), kol–biyel gibi mekanizmalarda eleman uzunlukları ve arazide üçgenleme (nirengi) ile mesafe ölçümünde bu teoremler kullanılır.`,
`DEFINITION
A triangle has three sides (a, b, c) and three angles (A, B, C); each side sits opposite the angle with the same letter (side a is opposite angle A). Even when the triangle has no right angle, we can find every side and angle if enough data is given. This is called "solving the triangle", and two theorems do the job.

KEY FORMULAS
Law of cosines:   c² = a² + b² − 2ab·cos C   (same pattern for a² and b²)
For an angle:     cos C = (a² + b² − c²) / (2ab)
Law of sines:     a / sin A = b / sin B = c / sin C
Angle sum:        A + B + C = 180°
Area:             S = ½·a·b·sin C      Heron: S = √( s(s−a)(s−b)(s−c) ),  s = (a+b+c)/2

WHAT DOES IT MEAN?
The law of cosines is Pythagoras' theorem in general form: if C = 90° then cos C = 0 and c² = a² + b² remains. The term −2ab·cos C is the "correction" needed when the angle is not a right angle. The law of sines is the numerical version of "the larger angle faces the larger side".

WHICH THEOREM, WHEN? (METHOD)
1) Recognise the data: SSS, SAS, ASA, AAS or SSA.
2) SAS → law of cosines for the third side, then the angles.
3) SSS → law of cosines for the angles (the third angle comes from 180°).
4) ASA / AAS → third angle = 180° − A − B; then the law of sines for the sides.
5) SSA → law of sines; there can be 0, 1 or 2 triangles.
6) Finally check the angle sum and "larger side – larger angle".

THE AMBIGUOUS CASE (SSA)
Let sides a, b and angle A be given, and h = b·sin A.
• a < h : no triangle (side a cannot reach the other arm).
• a = h : one triangle, B = 90° (right triangle).
• h < a < b : two triangles, B₁ = arcsin(b·sin A / a) and B₂ = 180° − B₁.
• a ≥ b : one triangle (B₂ plus A would exceed 180°).
arcsin only returns an acute angle; we have to think of the obtuse one (180° − B) ourselves.

PITFALLS
• The calculator must be in degree (DEG) mode.
• To find an angle, prefer the law of cosines: arccos gives a single angle between 0° and 180°, so there is no ambiguity.
• For SSS the triangle inequality is required: each side must be smaller than the sum of the other two.
• A negative cosine means an obtuse angle (greater than 90°).

MINI EXAMPLE
a = 5, b = 8, C = 60° (SAS): c² = 25 + 64 − 2·5·8·½ = 49, so c = 7.

IN ENGINEERING
Force polygons (resultant of two forces: R² = F₁² + F₂² + 2F₁F₂·cos θ), element lengths in linkages such as the slider-crank, and distance measurement by triangulation in surveying all use these theorems.`);
  }

  function problemStatement(p) {
    const g = givenList(p);
    switch (p.type) {
      case 'sas': return Tx(`Bir ABC üçgeninde ${g} veriliyor (C açısı a ve b kenarlarının arasında). Üçüncü kenarı (c) ve A, B açılarını bulalım. Ayrıca üçgenin alanı kaç olur?`,
        `In triangle ABC, ${g} are given (angle C lies between sides a and b). Let's find the third side c and the angles A and B. What is the area of the triangle?`);
      case 'sss': return Tx(`Bir ABC üçgeninin kenarları ${g} olarak veriliyor. Üçgen gerçekten çizilebilir mi? Çizilebiliyorsa A, B, C açılarını ve alanı bulalım.`,
        `The sides of triangle ABC are ${g}. Can such a triangle really be drawn? If so, let's find the angles A, B, C and the area.`);
      case 'asa': return Tx(`Bir ABC üçgeninde ${g} veriliyor (c kenarı A ve B açılarının arasında). Üçüncü açıyı (C) ve a, b kenarlarını bulalım.`,
        `In triangle ABC, ${g} are given (side c lies between angles A and B). Let's find the third angle C and the sides a and b.`);
      case 'aas': return Tx(`Bir ABC üçgeninde ${g} veriliyor (a kenarı A açısının karşısında). Üçüncü açıyı (C) ve b, c kenarlarını bulalım.`,
        `In triangle ABC, ${g} are given (side a is opposite angle A). Let's find the third angle C and the sides b and c.`);
      default: return Tx(`Bir ABC üçgeninde ${g} veriliyor (A açısı a kenarının karşısında). Bu verilere uyan kaç üçgen vardır? Varsa hepsinin diğer açılarını, kenarını ve alanını bulalım.`,
        `In triangle ABC, ${g} are given (angle A is opposite side a). How many triangles fit this data? Let's find the remaining angles, side and area of each one.`);
    }
  }

  // ---------- steps ----------
  const H = (tr, en) => Tx(tr, en);
  function areaStep(t, n) {
    const s = (t.a + t.b + t.c) / 2;
    return H(`── ${n}) Alan ──\nS = ½·a·b·sin C = ½·${nf(t.a)}·${nf(t.b)}·sin ${dg(t.C)} = ${nf(areaOf(t), 3)} (birim²).\nHeron ile kontrol: s = (a+b+c)/2 = ${nf(s, 3)}; S = √(s(s−a)(s−b)(s−c)) = ${nf(heron(t), 3)} ✓ (iki yoldan aynı sonuç).`,
      `── ${n}) Area ──\nS = ½·a·b·sin C = ½·${nf(t.a)}·${nf(t.b)}·sin ${dg(t.C)} = ${nf(areaOf(t), 3)} (unit²).\nCheck with Heron: s = (a+b+c)/2 = ${nf(s, 3)}; S = √(s(s−a)(s−b)(s−c)) = ${nf(heron(t), 3)} ✓ (same result both ways).`);
  }
  function checkStep(t, n) {
    const r1 = t.a / sinD(t.A), r2 = t.b / sinD(t.B), r3 = t.c / sinD(t.C);
    const big = (t.a >= t.b && t.a >= t.c) ? 'a' : (t.b >= t.c ? 'b' : 'c');
    const bigA = (t.A >= t.B && t.A >= t.C) ? 'A' : (t.B >= t.C ? 'B' : 'C');
    return H(`── ${n}) Kontrol ──\nAçılar: ${dg(t.A)} + ${dg(t.B)} + ${dg(t.C)} = ${dg(t.A + t.B + t.C)} ✓.\nSinüs teoremi oranları: a/sin A = ${nf(r1, 3)}, b/sin B = ${nf(r2, 3)}, c/sin C = ${nf(r3, 3)} ✓ (üçü de eşit).\nEn büyük kenar ${big}, en büyük açının (${bigA}) karşısında ✓.`,
      `── ${n}) Check ──\nAngles: ${dg(t.A)} + ${dg(t.B)} + ${dg(t.C)} = ${dg(t.A + t.B + t.C)} ✓.\nLaw of sines ratios: a/sin A = ${nf(r1, 3)}, b/sin B = ${nf(r2, 3)}, c/sin C = ${nf(r3, 3)} ✓ (all three equal).\nThe longest side is ${big}, opposite the largest angle (${bigA}) ✓.`);
  }
  function cosLine(nm, x, y, z, ang) { // z opposite the angle: z² = x² + y² − 2xy cos
    return `${nm}² = ${x}² + ${y}² − 2·${x}·${y}·cos ${dg(ang)}`;
  }

  function solveSteps(p) {
    const { tris, reason } = solve(p);
    const s = [];
    const intro = (extra) => H(`── 1) Veriyi tanıyalım ──\nVerilenler: ${givenList(p)}. Bu bir ${typeName(p.type)} durumu. ${extra}`,
      `── 1) Recognise the data ──\nGiven: ${givenList(p)}. This is the ${typeName(p.type)} situation. ${extra}`);
    if (p.type === 'sas') {
      const t = tris[0];
      s.push(intro(H('İki kenar ve aralarındaki açı bilindiğinden önce kosinüs teoremiyle karşıdaki kenarı bulabiliriz.', 'Since two sides and the angle between them are known, the law of cosines gives the opposite side first.')));
      s.push(H(`── 2) Üçüncü kenar (kosinüs teoremi) ──\nc² = a² + b² − 2ab·cos C = ${nf(p.a)}² + ${nf(p.b)}² − 2·${nf(p.a)}·${nf(p.b)}·cos ${dg(p.C)}\nc² = ${nf(p.a * p.a)} + ${nf(p.b * p.b)} − ${nf(2 * p.a * p.b)}·(${nf(cosD(p.C), 4)}) = ${nf(t.c * t.c, 3)}\nc = √${nf(t.c * t.c, 3)} = ${nf(t.c, 3)}.`,
        `── 2) Third side (law of cosines) ──\nc² = a² + b² − 2ab·cos C = ${nf(p.a)}² + ${nf(p.b)}² − 2·${nf(p.a)}·${nf(p.b)}·cos ${dg(p.C)}\nc² = ${nf(p.a * p.a)} + ${nf(p.b * p.b)} − ${nf(2 * p.a * p.b)}·(${nf(cosD(p.C), 4)}) = ${nf(t.c * t.c, 3)}\nc = √${nf(t.c * t.c, 3)} = ${nf(t.c, 3)}.`));
      s.push(H(`── 3) A açısı (yine kosinüs teoremi) ──\ncos A = (b² + c² − a²) / (2bc) = (${nf(p.b * p.b)} + ${nf(t.c * t.c, 3)} − ${nf(p.a * p.a)}) / (2·${nf(p.b)}·${nf(t.c, 3)}) = ${nf(cosD(t.A), 4)}\nA = arccos(${nf(cosD(t.A), 4)}) = ${dg(t.A)}.\n(Açıyı kosinüsle bulmak güvenlidir: arccos geniş açıları da doğru verir.)`,
        `── 3) Angle A (law of cosines again) ──\ncos A = (b² + c² − a²) / (2bc) = (${nf(p.b * p.b)} + ${nf(t.c * t.c, 3)} − ${nf(p.a * p.a)}) / (2·${nf(p.b)}·${nf(t.c, 3)}) = ${nf(cosD(t.A), 4)}\nA = arccos(${nf(cosD(t.A), 4)}) = ${dg(t.A)}.\n(Finding the angle with the cosine is safe: arccos also returns obtuse angles correctly.)`));
      s.push(H(`── 4) B açısı ──\nB = 180° − A − C = 180° − ${dg(t.A)} − ${dg(p.C)} = ${dg(t.B)}.`, `── 4) Angle B ──\nB = 180° − A − C = 180° − ${dg(t.A)} − ${dg(p.C)} = ${dg(t.B)}.`));
      s.push(areaStep(t, 5)); s.push(checkStep(t, 6));
    } else if (p.type === 'sss') {
      if (!tris.length) {
        s.push(intro(H('Önce üçgen eşitsizliğine bakalım.', 'Let us first look at the triangle inequality.')));
        s.push(H(`── 2) Üçgen eşitsizliği ──\nHer kenar, diğer ikisinin toplamından küçük olmalı. Burada a + b = ${nf(p.a + p.b)}, a + c = ${nf(p.a + p.c)}, b + c = ${nf(p.b + p.c)} ve kenarlar ${nf(p.a)}, ${nf(p.b)}, ${nf(p.c)}; bu koşullardan biri sağlanmıyor.\nKenarlar uç uca eklenip kapanamaz, bu yüzden böyle bir üçgen yoktur.`,
          `── 2) Triangle inequality ──\nEach side must be smaller than the sum of the other two. Here a + b = ${nf(p.a + p.b)}, a + c = ${nf(p.a + p.c)}, b + c = ${nf(p.b + p.c)} with sides ${nf(p.a)}, ${nf(p.b)}, ${nf(p.c)}; one of these conditions fails.\nThe sides cannot close up, so no such triangle exists.`));
        return s;
      }
      const t = tris[0];
      s.push(intro(H('Üç kenar biliniyorsa açılar doğrudan kosinüs teoremiyle bulunur.', 'When all three sides are known, the angles follow directly from the law of cosines.')));
      s.push(H(`── 2) Üçgen eşitsizliği ──\na + b = ${nf(p.a + p.b)} > ${nf(p.c)} = c, a + c = ${nf(p.a + p.c)} > ${nf(p.b)} = b, b + c = ${nf(p.b + p.c)} > ${nf(p.a)} = a. Koşullar sağlanıyor, üçgen çizilebilir ✓.`,
        `── 2) Triangle inequality ──\na + b = ${nf(p.a + p.b)} > ${nf(p.c)} = c, a + c = ${nf(p.a + p.c)} > ${nf(p.b)} = b, b + c = ${nf(p.b + p.c)} > ${nf(p.a)} = a. The conditions hold, so the triangle exists ✓.`));
      s.push(H(`── 3) A açısı ──\ncos A = (b² + c² − a²) / (2bc) = (${nf(p.b * p.b)} + ${nf(p.c * p.c)} − ${nf(p.a * p.a)}) / (2·${nf(p.b)}·${nf(p.c)}) = ${nf(cosD(t.A), 4)}\nA = ${dg(t.A)}.`,
        `── 3) Angle A ──\ncos A = (b² + c² − a²) / (2bc) = (${nf(p.b * p.b)} + ${nf(p.c * p.c)} − ${nf(p.a * p.a)}) / (2·${nf(p.b)}·${nf(p.c)}) = ${nf(cosD(t.A), 4)}\nA = ${dg(t.A)}.`));
      s.push(H(`── 4) B açısı ──\ncos B = (a² + c² − b²) / (2ac) = (${nf(p.a * p.a)} + ${nf(p.c * p.c)} − ${nf(p.b * p.b)}) / (2·${nf(p.a)}·${nf(p.c)}) = ${nf(cosD(t.B), 4)}\nB = ${dg(t.B)}.`,
        `── 4) Angle B ──\ncos B = (a² + c² − b²) / (2ac) = (${nf(p.a * p.a)} + ${nf(p.c * p.c)} − ${nf(p.b * p.b)}) / (2·${nf(p.a)}·${nf(p.c)}) = ${nf(cosD(t.B), 4)}\nB = ${dg(t.B)}.`));
      s.push(H(`── 5) C açısı ──\nC = 180° − A − B = 180° − ${dg(t.A)} − ${dg(t.B)} = ${dg(t.C)}.`, `── 5) Angle C ──\nC = 180° − A − B = 180° − ${dg(t.A)} − ${dg(t.B)} = ${dg(t.C)}.`));
      s.push(areaStep(t, 6)); s.push(checkStep(t, 7));
    } else if (p.type === 'asa' || p.type === 'aas') {
      if (!tris.length) {
        s.push(intro(H('Önce üçüncü açıyı bulalım.', 'Let us first find the third angle.')));
        s.push(H(`── 2) Açı toplamı ──\nA + B = ${dg(p.A + p.B)} ≥ 180° olduğundan C = 180° − A − B pozitif çıkmıyor; böyle bir üçgen yoktur.`, `── 2) Angle sum ──\nA + B = ${dg(p.A + p.B)} is at least 180°, so C = 180° − A − B is not positive; no such triangle exists.`));
        return s;
      }
      const t = tris[0];
      const asa = p.type === 'asa';
      s.push(intro(H('İki açı biliniyorsa üçüncüsü hemen bulunur; sonra sinüs teoremiyle kenarları hesaplayabiliriz.', 'If two angles are known the third follows at once; then the law of sines gives the sides.')));
      s.push(H(`── 2) Üçüncü açı ──\nC = 180° − A − B = 180° − ${dg(p.A)} − ${dg(p.B)} = ${dg(t.C)}.`, `── 2) Third angle ──\nC = 180° − A − B = 180° − ${dg(p.A)} − ${dg(p.B)} = ${dg(t.C)}.`));
      if (asa) {
        s.push(H(`── 3) Sinüs teoremi ──\nBilinen çift: c ve karşısındaki C açısı. c / sin C = ${nf(t.c)} / sin ${dg(t.C)} = ${nf(t.c / sinD(t.C), 4)}. Bu ortak oran, diğer kenarlar için de geçerlidir.`,
          `── 3) Law of sines ──\nThe known pair is c and its opposite angle C. c / sin C = ${nf(t.c)} / sin ${dg(t.C)} = ${nf(t.c / sinD(t.C), 4)}. This common ratio holds for the other sides too.`));
        s.push(H(`── 4) a kenarı ──\na = c·sin A / sin C = ${nf(t.c)}·sin ${dg(p.A)} / sin ${dg(t.C)} = ${nf(t.a, 3)}.`, `── 4) Side a ──\na = c·sin A / sin C = ${nf(t.c)}·sin ${dg(p.A)} / sin ${dg(t.C)} = ${nf(t.a, 3)}.`));
        s.push(H(`── 5) b kenarı ──\nb = c·sin B / sin C = ${nf(t.c)}·sin ${dg(p.B)} / sin ${dg(t.C)} = ${nf(t.b, 3)}.`, `── 5) Side b ──\nb = c·sin B / sin C = ${nf(t.c)}·sin ${dg(p.B)} / sin ${dg(t.C)} = ${nf(t.b, 3)}.`));
      } else {
        s.push(H(`── 3) Sinüs teoremi ──\nBilinen çift: a ve karşısındaki A açısı. a / sin A = ${nf(t.a)} / sin ${dg(p.A)} = ${nf(t.a / sinD(p.A), 4)}. Bu ortak oran, diğer kenarlar için de geçerlidir.`,
          `── 3) Law of sines ──\nThe known pair is a and its opposite angle A. a / sin A = ${nf(t.a)} / sin ${dg(p.A)} = ${nf(t.a / sinD(p.A), 4)}. This common ratio holds for the other sides too.`));
        s.push(H(`── 4) b kenarı ──\nb = a·sin B / sin A = ${nf(t.a)}·sin ${dg(p.B)} / sin ${dg(p.A)} = ${nf(t.b, 3)}.`, `── 4) Side b ──\nb = a·sin B / sin A = ${nf(t.a)}·sin ${dg(p.B)} / sin ${dg(p.A)} = ${nf(t.b, 3)}.`));
        s.push(H(`── 5) c kenarı ──\nc = a·sin C / sin A = ${nf(t.a)}·sin ${dg(t.C)} / sin ${dg(p.A)} = ${nf(t.c, 3)}.`, `── 5) Side c ──\nc = a·sin C / sin A = ${nf(t.a)}·sin ${dg(t.C)} / sin ${dg(p.A)} = ${nf(t.c, 3)}.`));
      }
      s.push(H(`── 6) Kosinüs teoremiyle ters kontrol ──\nc² = a² + b² − 2ab·cos C → ${nf(t.a * t.a, 3)} + ${nf(t.b * t.b, 3)} − 2·${nf(t.a, 3)}·${nf(t.b, 3)}·(${nf(cosD(t.C), 4)}) = ${nf(t.a * t.a + t.b * t.b - 2 * t.a * t.b * cosD(t.C), 3)} ve c² = ${nf(t.c * t.c, 3)} ✓.`,
        `── 6) Cross-check with the law of cosines ──\nc² = a² + b² − 2ab·cos C → ${nf(t.a * t.a, 3)} + ${nf(t.b * t.b, 3)} − 2·${nf(t.a, 3)}·${nf(t.b, 3)}·(${nf(cosD(t.C), 4)}) = ${nf(t.a * t.a + t.b * t.b - 2 * t.a * t.b * cosD(t.C), 3)} and c² = ${nf(t.c * t.c, 3)} ✓.`));
      s.push(areaStep(t, 7)); s.push(checkStep(t, 8));
    } else { // ssa
      const h = p.b * sinD(p.A), sB = h / p.a;
      s.push(intro(H('Bu durumda sinüs teoremi sin B değerini verir ama B için iki aday çıkabilir; bu yüzden önce h = b·sin A yüksekliğine bakalım.', 'Here the law of sines gives sin B, but two candidates for B may appear; so let us first look at the height h = b·sin A.')));
      const rel = p.a < h - EPS ? 'lt' : (Math.abs(p.a - h) < EPS ? 'eq' : (p.a < p.b ? 'mid' : 'ge'));
      s.push(H(`── 2) Yükseklik ile karşılaştıralım ──\nh = b·sin A = ${nf(p.b)}·sin ${dg(p.A)} = ${nf(h, 3)}.\na = ${nf(p.a)} ve b = ${nf(p.b)}.\n${{ lt: 'a < h: a kenarı karşı kola ulaşamaz.', eq: 'a = h: kenar karşı kola tam dik değer; tek (dik) üçgen.', mid: 'h < a < b: a kenarı karşı kolu iki noktada keser; iki üçgen beklenir.', ge: 'a ≥ b: tek üçgen beklenir.' }[rel]}`,
        `── 2) Compare with the height ──\nh = b·sin A = ${nf(p.b)}·sin ${dg(p.A)} = ${nf(h, 3)}.\na = ${nf(p.a)} and b = ${nf(p.b)}.\n${{ lt: 'a < h: side a cannot reach the other arm.', eq: 'a = h: side a just touches the other arm; one (right) triangle.', mid: 'h < a < b: side a cuts the other arm at two points; two triangles are expected.', ge: 'a ≥ b: one triangle is expected.' }[rel]}`));
      s.push(H(`── 3) Sinüs teoremi ──\nsin B = b·sin A / a = ${nf(p.b)}·sin ${dg(p.A)} / ${nf(p.a)} = ${nf(sB, 4)}.`, `── 3) Law of sines ──\nsin B = b·sin A / a = ${nf(p.b)}·sin ${dg(p.A)} / ${nf(p.a)} = ${nf(sB, 4)}.`));
      if (!tris.length) {
        s.push(H(`── 4) Sonuç ──\nsin B = ${nf(sB, 4)} > 1 olamaz (sinüs en çok 1'dir). Bu verilere uyan üçgen yoktur (0 çözüm).\nYanıt kontrolü: a = ${nf(p.a)} < h = ${nf(h, 3)} olduğu için a kenarı karşı kola ulaşmaz ✓.`,
          `── 4) Conclusion ──\nsin B = ${nf(sB, 4)} > 1 is impossible (a sine is at most 1). No triangle fits this data (0 solutions).\nCheck: a = ${nf(p.a)} < h = ${nf(h, 3)}, so side a never reaches the other arm ✓.`));
        return s;
      }
      const B1 = tris[0].B;
      s.push(H(`── 4) Dar ve geniş aday ──\nB₁ = arcsin(${nf(sB, 4)}) = ${dg(B1)}.\nİkinci aday B₂ = 180° − B₁ = ${dg(180 - B1)}.\nA + B₂ = ${dg(p.A + 180 - B1)} ${p.A + 180 - B1 < 180 - 1e-7 ? '< 180°, yani B₂ de geçerli' : '≥ 180°, yani B₂ olamaz'}.`,
        `── 4) Acute and obtuse candidates ──\nB₁ = arcsin(${nf(sB, 4)}) = ${dg(B1)}.\nSecond candidate B₂ = 180° − B₁ = ${dg(180 - B1)}.\nA + B₂ = ${dg(p.A + 180 - B1)} ${p.A + 180 - B1 < 180 - 1e-7 ? '< 180°, so B₂ is valid too' : '≥ 180°, so B₂ is impossible'}.`));
      tris.forEach((t, i) => {
        const nm = tris.length === 2 ? (i === 0 ? '₁' : '₂') : '';
        s.push(H(`── ${5 + i}) Üçgen${nm}: C${nm}, c${nm} ve alan ──\nC${nm} = 180° − A − B${nm} = ${dg(t.C)}.\nc${nm} = a·sin C${nm} / sin A = ${nf(p.a)}·sin ${dg(t.C)} / sin ${dg(p.A)} = ${nf(t.c, 3)}.\nAlan = ½·a·b·sin C${nm} = ${nf(areaOf(t), 3)} (birim²).`,
          `── ${5 + i}) Triangle${nm}: C${nm}, c${nm} and area ──\nC${nm} = 180° − A − B${nm} = ${dg(t.C)}.\nc${nm} = a·sin C${nm} / sin A = ${nf(p.a)}·sin ${dg(t.C)} / sin ${dg(p.A)} = ${nf(t.c, 3)}.\nArea = ½·a·b·sin C${nm} = ${nf(areaOf(t), 3)} (unit²).`));
      });
      const k = 5 + tris.length;
      s.push(H(`── ${k}) Kontrol ve sonuç ──\n${tris.map((t, i) => `Kosinüs teoremiyle: b² + c² − 2bc·cos A = ${nf(p.b * p.b + t.c * t.c - 2 * p.b * t.c * cosD(p.A), 3)} ve a² = ${nf(p.a * p.a, 3)} ✓${tris.length === 2 ? ' (üçgen ' + (i + 1) + ')' : ''}`).join('\n')}\nSonuç: bu verilere uyan ${tris.length} üçgen vardır${tris.length === 2 ? ' (grafikte ikincisi kesikli turuncu ile çizildi)' : ''}.`,
        `── ${k}) Check and conclusion ──\n${tris.map((t, i) => `Law of cosines: b² + c² − 2bc·cos A = ${nf(p.b * p.b + t.c * t.c - 2 * p.b * t.c * cosD(p.A), 3)} and a² = ${nf(p.a * p.a, 3)} ✓${tris.length === 2 ? ' (triangle ' + (i + 1) + ')' : ''}`).join('\n')}\nConclusion: ${tris.length} triangle${tris.length === 2 ? 's fit' : ' fits'} this data${tris.length === 2 ? ' (the second one is drawn dashed orange on the graph)' : ''}.`));
    }
    return s;
  }

  // ---------- drawing ----------
  let HND = {};
  function updateSliders(p) {
    try {
      const vis = FIELDS[p.type] || [];
      Object.keys(HND).forEach((f) => {
        const blk = HND[f] && HND[f].input && HND[f].input.parentElement;
        if (blk && blk.style) blk.style.display = vis.indexOf(f) >= 0 ? '' : 'none';
      });
    } catch (e) { /* ignore */ }
  }
  const GIVEN_SIDES = { sas: 'ab', sss: 'abc', asa: 'c', aas: 'a', ssa: 'ab' };
  const GIVEN_ANGS = { sas: 'C', sss: '', asa: 'AB', aas: 'AB', ssa: 'A' };

  function draw(canvas, p) {
    try {
      updateSliders(p);
      canvas.setViewport(-8, 8, -6, 6);
      const { tris } = solve(p);
      const gs = GIVEN_SIDES[p.type], ga = GIVEN_ANGS[p.type];
      const gold = canvas.gold(), green = canvas.green();
      let pts = [], t0 = tris[0];
      if (!t0 && p.type !== 'ssa') return;
      const bb = p.type === 'ssa' ? p.b : t0.b, AA = p.type === 'ssa' ? p.A : t0.A;
      const Cr = [bb * cosD(AA), bb * sinD(AA)];
      pts.push([0, 0], Cr);
      if (t0) tris.forEach((t) => pts.push([t.c, 0]));
      else { pts.push([Cr[0] - p.a, Cr[1] - p.a], [Cr[0] + p.a, Cr[1] + p.a], [Cr[0] + p.a, 0]); }
      if (p.type !== 'ssa') pts = [[0, 0], [t0.c, 0], Cr];
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const sc = Math.min(1, 12.5 / Math.max(1e-9, x1 - x0), 9 / Math.max(1e-9, y1 - y0));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const T = (q) => [(q[0] - cx) * sc, (q[1] - cy) * sc];
      const Ap = T([0, 0]), Cp = T(Cr);
      const cen = (a, b, c) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
      const seg = (u, v, col, dashed, th) => canvas.addSegment({ x1: u[0], y1: u[1], x2: v[0], y2: v[1], color: col, dashed: !!dashed, thickness: th || 3 });
      const sideLab = (u, v, ce, text, col) => {
        const mx = (u[0] + v[0]) / 2, my = (u[1] + v[1]) / 2;
        let nx = -(v[1] - u[1]), ny = v[0] - u[0];
        const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
        if ((mx - ce[0]) * nx + (my - ce[1]) * ny < 0) { nx = -nx; ny = -ny; }
        canvas.addMarker({ x: mx + nx * 0.55, y: my + ny * 0.55, color: col, radius: 2, label: text });
      };
      const arc = (V, U, W, r, col) => {
        const a1 = Math.atan2(U[1] - V[1], U[0] - V[0]); let d = Math.atan2(W[1] - V[1], W[0] - V[0]) - a1;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        canvas.addParametric({ xOfT: (t) => V[0] + r * Math.cos(a1 + d * t), yOfT: (t) => V[1] + r * Math.sin(a1 + d * t), tMin: 0, tMax: 1, samples: 40, color: col, thickness: 2 });
      };
      if (!t0) { // ssa, no triangle: the ray, the side b and the short arc of radius a that misses the ray
        const R = T([Cr[0] + p.a, 0]);
        seg(Ap, [R[0], R[1]], canvas.gray(), true, 2);
        seg(Ap, Cp, canvas.accent(), false);
        const rr = p.a * sc;
        canvas.addParametric({ xOfT: (t) => Cp[0] + rr * Math.cos(t), yOfT: (t) => Cp[1] + rr * Math.sin(t), tMin: -Math.PI, tMax: 0, samples: 80, color: canvas.orange(), dashed: true, thickness: 2 });
        arc(Ap, [Ap[0] + 1, Ap[1]], Cp, 0.9, gold);
        canvas.addMarker({ x: Ap[0], y: Ap[1], color: gold, radius: 5, label: 'A = ' + dg(p.A) });
        canvas.addMarker({ x: Cp[0], y: Cp[1], color: canvas.accent(), radius: 5, label: 'C' });
        sideLab(Ap, Cp, [Cp[0], Cp[1] - 5], 'b = ' + nf(p.b), gold);
        canvas.addMarker({ x: Cp[0] + rr * 0.7, y: Cp[1] - rr * 0.7, color: gold, radius: 2, label: 'a = ' + nf(p.a) + Tx(' (ulaşamıyor)', ' (falls short)') });
        return;
      }
      const t = tris[0];
      const Bp = T([t.c, 0]);
      const ce = cen(Ap, Bp, Cp);
      seg(Ap, Bp, canvas.accent()); seg(Bp, Cp, canvas.accent()); seg(Cp, Ap, canvas.accent());
      const two = tris.length === 2;
      const colS = (k) => (gs.indexOf(k) >= 0 ? gold : green), colA = (k) => (ga.indexOf(k) >= 0 ? gold : green);
      const rA = Math.min(1, 0.28 * Math.min(Math.hypot(Bp[0] - Ap[0], Bp[1] - Ap[1]), Math.hypot(Cp[0] - Ap[0], Cp[1] - Ap[1])));
      const rB = Math.min(1, 0.28 * Math.min(Math.hypot(Ap[0] - Bp[0], Ap[1] - Bp[1]), Math.hypot(Cp[0] - Bp[0], Cp[1] - Bp[1])));
      const rC = Math.min(1, 0.28 * Math.min(Math.hypot(Ap[0] - Cp[0], Ap[1] - Cp[1]), Math.hypot(Bp[0] - Cp[0], Bp[1] - Cp[1])));
      arc(Ap, Bp, Cp, rA, colA('A')); arc(Bp, Cp, Ap, rB, colA('B')); arc(Cp, Ap, Bp, rC, colA('C'));
      sideLab(Bp, Cp, ce, 'a = ' + nf(t.a), colS('a'));
      sideLab(Cp, Ap, ce, 'b = ' + nf(t.b), colS('b'));
      sideLab(Ap, Bp, ce, 'c = ' + nf(t.c), colS('c'));
      canvas.addMarker({ x: Ap[0], y: Ap[1], color: colA('A'), radius: 6, label: 'A = ' + dg(t.A) });
      canvas.addMarker({ x: Bp[0], y: Bp[1], color: colA('B'), radius: 6, label: 'B = ' + dg(t.B) });
      canvas.addMarker({ x: Cp[0], y: Cp[1], color: colA('C'), radius: 6, label: 'C = ' + dg(t.C) + (two ? '  (C′ = ' + dg(tris[1].C) + ')' : '') });
      if (two) {
        const t2 = tris[1], B2 = T([t2.c, 0]);
        const orange = canvas.orange();
        seg(Ap, B2, orange, true, 2.5); seg(B2, Cp, orange, true, 2.5);
        canvas.addMarker({ x: B2[0], y: B2[1], color: orange, radius: 6, label: 'B′ = ' + dg(t2.B) });
        sideLab(Ap, B2, [B2[0], B2[1] - 3], 'c′ = ' + nf(t2.c), orange);
        arc(B2, Cp, Ap, Math.min(1, 0.28 * Math.hypot(Ap[0] - B2[0], Ap[1] - B2[1])), orange);
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    const mk = (type) => ({ label: typeName(type), value: type });
    const sel = h.addSelect({
      options: ['sas', 'sss', 'asa', 'aas', 'ssa'].map(mk),
      get: () => getProblem().type,
      set: (v) => { Object.assign(getProblem(), genType(new Rng(), v)); },
    });
    const sl = (f, cap, min, max) => {
      HND[f] = h.addSlider({
        caption: cap, min, max, step: 1,
        get: () => getProblem()[f],
        set: (v) => { getProblem()[f] = Math.round(Math.max(min, Math.min(max, v))); },
      });
    };
    sl('a', Tx('a kenarı', 'side a'), 2, 20);
    sl('b', Tx('b kenarı', 'side b'), 2, 20);
    sl('c', Tx('c kenarı', 'side c'), 2, 20);
    sl('A', Tx('A açısı (°)', 'angle A (°)'), 10, 150);
    sl('B', Tx('B açısı (°)', 'angle B (°)'), 10, 150);
    sl('C', Tx('C açısı (°)', 'angle C (°)'), 10, 170);
    selHandle = sel;
  }
  let selHandle = null;

  Topics.register('trig', {
    id: 'lawOfCosines',
    tabTitle: () => Tx('Kosinüs ve Sinüs Teoremi', 'Laws of Cosines and Sines'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw: (canvas, p) => { try { if (selHandle && selHandle.refreshFromModel) selHandle.refreshFromModel(); } catch (e) { /* ignore */ } draw(canvas, p); },
    buildControls,
    links: [
      { match: /^(Kosinüs teoremi|Law of cosines):/, make: (rng) => genType(rng, 'sas') },
      { match: /^(Açı için|For an angle):/, make: (rng) => genType(rng, 'sss') },
      { match: /^(Sinüs teoremi|Law of sines):/, make: (rng) => genType(rng, 'asa') },
      { match: /^4\) ASA \/ AAS/, make: (rng) => genType(rng, 'aas') },
      { match: /^• a < h :/, make: (rng) => genSSA(rng, 'none') },
      { match: /^• a = h :/, make: (rng) => genSSA(rng, 'right') },
      { match: /^• h < a < b :/, make: (rng) => genSSA(rng, 'two') },
      { match: /^• a ≥ b :/, make: (rng) => genSSA(rng, 'one') },
    ],
    _solve: solve,
  });
})();
