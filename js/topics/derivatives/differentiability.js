// The Derivative as a Function and Differentiability (chapter 'derivatives'). Thomas 3.2, Stewart 2.7-2.8.
// problem.type:
//   'def'      f'(x) from the limit definition (symbolic): fk 'quad' A x^2+B x+C | 'cubic' A x^3+B x+C | 'inv' K/x | 'sqrt' sqrt(x+M); x0 asked, xs = slider point
//   'diff'     two-piece function (c + s(x-a) + q(x-a)^2 on each side): one-sided derivatives at a, differentiable?  (a, c, s1, s2, q1, q2)
//   'classify' ck 'corner' m|x-a|+c | 'cusp' c+m (x-a)^(2/3) | 'vert' c+m (x-a)^(1/3) | 'jump' (discontinuity): which kind of non-differentiability?
//   'piece'    f = L(x) for x<a, k x + m for x>=a: choose k (and m) so that f is differentiable at a  (dk, dm sliders = deviation from the answer)
// The Cartesian window is fixed (-6..6 x -8..8); sliders move the probe point / the junction / the slopes on it.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (s) => { s = String(s); return (s[0] === '−' || s[0] === '-') ? '(' + s + ')' : s; };
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 3 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
  }
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = (n) => (n === 1 ? '' : String(n).split('').map((c) => SUP[c] || c).join(''));
  const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const cbrt = (t) => (t < 0 ? -Math.pow(-t, 1 / 3) : Math.pow(t, 1 / 3));
  const INF = (s) => (s > 0 ? '+∞' : '−∞');
  const xa = (a) => (a === 0 ? 'x' : a > 0 ? `(x − ${a})` : `(x + ${-a})`);
  function poly(cs, v) { // cs[i] = coefficient of v^i
    v = v || 'x';
    let out = '';
    for (let pw = cs.length - 1; pw >= 0; pw--) {
      const c = cs[pw];
      if (!c) continue;
      const ac = Math.abs(c);
      let body;
      if (pw === 0) body = String(ac);
      else body = (ac === 1 ? '' : String(ac)) + (pw === 1 ? v : (v.length > 1 && v[0] !== '(' ? '(' + v + ')' : v) + sup(pw));
      out += out === '' ? (c < 0 ? '−' : '') + body : (c < 0 ? ' − ' : ' + ') + body;
    }
    return out || '0';
  }
  const cf = (n) => (n === 1 ? '' : n === -1 ? '−' : S(n));
  const ad = (n) => (n < 0 ? ' − ' : ' + ') + Math.abs(n);
  const lc = (ts) => { let o = ''; for (const [c, v] of ts) { if (!c) continue; const ac = Math.abs(c); const b = v === '' ? String(ac) : (ac === 1 ? '' : String(ac)) + v; o += o === '' ? (c < 0 ? '−' : '') + b : (c < 0 ? ' − ' : ' + ') + b; } return o || '0'; };
  const adT = (n) => (n < 0 ? ' − ' : ' + ') + (Math.abs(n) === 1 ? '' : Math.abs(n));
  const safe = (v) => (isFinite(v) && Math.abs(v) < 40 ? v : NaN);

  // ---------- 'def' model ----------
  function defModel(p) {
    const { A, B, C, K, Mm } = p;
    switch (p.fk) {
      case 'quad': return { f: (x) => A * x * x + B * x + C, d: (x) => 2 * A * x + B, fS: poly([C, B, A]), dS: poly([B, 2 * A]) };
      case 'cubic': return { f: (x) => A * x * x * x + B * x + C, d: (x) => 3 * A * x * x + B, fS: poly([C, B, 0, A]), dS: poly([B, 0, 3 * A]) };
      case 'inv': return { f: (x) => (Math.abs(x) < 1e-9 ? NaN : K / x), d: (x) => (Math.abs(x) < 1e-9 ? NaN : -K / (x * x)), fS: (K === 1 ? '' : S(K)) + '/x', dS: S(-K) + '/x²' };
      default: {
        const inner = Mm === 0 ? 'x' : 'x + ' + Mm;
        return { f: (x) => (x + Mm < 1e-12 ? NaN : Math.sqrt(x + Mm)), d: (x) => (x + Mm < 1e-9 ? NaN : 1 / (2 * Math.sqrt(x + Mm))), fS: '√(' + inner + ')', dS: '1/(2√(' + inner + '))', inner };
      }
    }
  }
  function genDef(rng) {
    const fk = rng.pick(['quad', 'quad', 'cubic', 'inv', 'sqrt']);
    const p = { type: 'def', fk, A: 1, B: 0, C: 0, K: 1, Mm: 0, x0: 1, xs: 1, a: 0, c: 0, s1: 1, s2: -1, q1: 0, q2: 0 };
    if (fk === 'quad') { p.A = rng.pick([1, 2, 3, -1, -2]); p.B = rng.nextInt(-5, 6); p.C = rng.nextInt(-4, 5); p.x0 = rng.nextInt(-2, 4); }
    else if (fk === 'cubic') { p.A = rng.pick([1, 2, -1, -2]); p.B = rng.nextInt(-4, 5); p.C = rng.nextInt(-3, 4); p.x0 = rng.nextInt(-2, 3); }
    else if (fk === 'inv') { p.K = rng.pick([1, 2, 3, 4, -1, -2, -3]); p.x0 = rng.pick([-2, -1, 1, 2, 3]); }
    else { p.Mm = rng.nextInt(0, 6); p.x0 = rng.pick([1, 4]) - p.Mm; }
    p.xs = p.x0;
    return p;
  }

  // ---------- two-sided models for diff / classify / piece ----------
  function sideModel(p) {
    if (p.type === 'diff') {
      const { a, c, s1, s2, q1, q2 } = p;
      return {
        a, yl: c, yr: c, slL: s1, slR: s2,
        fl: (x) => c + s1 * (x - a) + q1 * (x - a) * (x - a), fr: (x) => c + s2 * (x - a) + q2 * (x - a) * (x - a),
        dl: (x) => s1 + 2 * q1 * (x - a), dr: (x) => s2 + 2 * q2 * (x - a),
      };
    }
    if (p.type === 'classify') {
      const { a, c, mm: m } = p;
      if (p.ck === 'corner') return { a, yl: c, yr: c, slL: -m, slR: m, fl: (x) => c - m * (x - a), fr: (x) => c + m * (x - a), dl: () => -m, dr: () => m };
      if (p.ck === 'cusp') {
        const f = (x) => c + m * cbrt(x - a) * cbrt(x - a), d = (x) => (2 * m / 3) / cbrt(x - a);
        return { a, yl: c, yr: c, slL: -sgn(m) * Infinity, slR: sgn(m) * Infinity, fl: f, fr: f, dl: d, dr: d };
      }
      if (p.ck === 'vert') {
        const f = (x) => c + m * cbrt(x - a), d = (x) => (m / 3) / (cbrt(x - a) * cbrt(x - a));
        return { a, yl: c, yr: c, slL: sgn(m) * Infinity, slR: sgn(m) * Infinity, fl: f, fr: f, dl: d, dr: d };
      }
      const s = p.s, J = p.J;
      return { a, yl: c, yr: c + J, slL: s, slR: s, fl: (x) => c + s * (x - a), fr: (x) => c + J + s * (x - a), dl: () => s, dr: () => s };
    }
    // piece
    const pm = pieceInfo(p);
    const k = pm.k + p.dk, m = pm.m + p.dm;
    return { a: p.a, yl: pm.Lv, yr: k * p.a + m, slL: pm.Ld, slR: k, fl: pm.L, fr: (x) => k * x + m, dl: pm.Ldf, dr: () => k };
  }
  function pieceInfo(p) {
    const { a, al, be, ga } = p;
    let L, Ldf, LS, LdS;
    if (p.cub) { L = (x) => al * x * x * x + be * x + ga; Ldf = (x) => 3 * al * x * x + be; LS = poly([ga, be, 0, al]); LdS = poly([be, 0, 3 * al]); }
    else { L = (x) => al * x * x + be * x + ga; Ldf = (x) => 2 * al * x + be; LS = poly([ga, be, al]); LdS = poly([be, 2 * al]); }
    const Lv = L(a), Ld = Ldf(a);
    return { L, Ldf, LS, LdS, Lv, Ld, k: Ld, m: Lv - Ld * a };
  }

  // ---------- generation ----------
  function base() { return { type: 'def', fk: 'quad', A: 1, B: 0, C: 0, K: 1, Mm: 0, x0: 1, xs: 1, a: 0, c: 0, s1: 1, s2: -1, q1: 0, q2: 0, ck: 'corner', mm: 1, J: 2, s: 1, al: 1, be: 0, ga: 0, cub: false, onlyK: false, dk: 0, dm: 0 }; }
  function genType(rng, type) {
    const p = Object.assign(base(), { type });
    if (type === 'def') return Object.assign(p, genDef(rng));
    if (type === 'diff') {
      p.a = rng.nextInt(-3, 4); p.c = rng.nextInt(-3, 4); p.s1 = rng.nonZeroInt(-3, 3);
      p.q1 = rng.pick([-1, 0, 0, 1]); p.q2 = rng.pick([-1, 0, 0, 1]);
      const r = rng.nextDouble();
      if (r < 0.4) p.s2 = p.s1;
      else if (r < 0.7) { p.s2 = -p.s1; p.q1 = 0; p.q2 = 0; }
      else { do { p.s2 = rng.nextInt(-3, 4); } while (p.s2 === p.s1); }
    } else if (type === 'classify') {
      p.ck = rng.pick(['corner', 'cusp', 'vert', 'jump']);
      p.a = rng.nextInt(-3, 4); p.c = rng.nextInt(-3, 4); p.mm = rng.pick([1, 2, 3, -1, -2]);
      p.J = rng.pick([2, 3, -2, -3]); p.s = rng.pick([-1, 0, 1, 2]);
    } else {
      p.cub = rng.nextDouble() < 0.3;
      p.onlyK = rng.nextDouble() < 0.35;
      for (let t = 0; t < 200; t++) {
        if (p.cub) { p.a = rng.nextInt(-1, 3); p.al = rng.pick([1, -1]); p.be = rng.nextInt(-3, 4); p.ga = rng.nextInt(-3, 4); }
        else { p.a = rng.nextInt(-2, 4); p.al = rng.pick([1, 2, -1, -2]); p.be = rng.nextInt(-3, 4); p.ga = rng.nextInt(-3, 4); }
        const pm = pieceInfo(p);
        if (Math.abs(pm.k) <= 8 && Math.abs(pm.m) <= 9 && Math.abs(pm.Lv) <= 9) break;
      }
      p.dk = 0; p.dm = 0;
    }
    return p;
  }
  function defK(rng, fk) { let p = genType(rng, 'def'); while (p.fk !== fk) p = genType(rng, 'def'); return p; }
  function forceCk(rng, ck) { const p = genType(rng, 'classify'); p.ck = ck; return p; }
  function createProblem(rng) { return genType(rng, rng.pick(['def', 'def', 'diff', 'diff', 'classify', 'piece', 'piece'])); }

  // ---------- texts ----------
  function concept() {
    return Tx(
`TANIM
Bir f fonksiyonunun türev fonksiyonu, her x için eğimi veren limittir:
f'(x) = lim(h→0) [ f(x+h) − f(x) ] / h
Belirli bir a noktasında: f'(a) = lim(h→0) [ f(a+h) − f(a) ] / h. Bu limit grafikte (a, f(a)) noktasındaki teğetin eğimidir. Limit varsa ve sonlu bir sayıysa f, a'da "türevlenebilir" denir.

TANIMDAN ÇIKAN TEMEL TÜREVLER
f(x) = c      →  f'(x) = 0
f(x) = x²     →  f'(x) = 2x
f(x) = x³     →  f'(x) = 3x²
f(x) = 1/x    →  f'(x) = −1/x²
f(x) = √x     →  f'(x) = 1/(2√x)

YÖNTEM (TANIMDAN TÜREV)
1) f(x+h) ifadesini yazıp açalım (parantezleri açalım).
2) f(x+h) − f(x) farkında h'siz terimler birbirini götürür; geriye h çarpanlı terimler kalır.
3) h'yi ortak parantezine alıp (f(x+h) − f(x))/h oranında sadeleştirelim.
4) h → 0 limitini alalım.
• 1/x gibi kesirlerde önce ortak payda; √ içeren ifadelerde eşleniğiyle çarpıp 0/0 belirsizliğini kaldırırız.

TEK TARAFLI TÜREVLER
Soldan: f'₋(a) = lim(h→0⁻) [f(a+h) − f(a)]/h,  sağdan: f'₊(a) = lim(h→0⁺) [f(a+h) − f(a)]/h.
f'(a) vardır ⇔ ikisi de vardır ve eşittir.

TÜREVLENEMEYEN DÖRT DURUM
• KÖŞE: |x − a| gibi; sol ve sağ eğim sonlu ama farklı (−1 ve +1).
• SİVRİ UÇ (cusp): (x − a)^(2/3); eğimler −∞ ve +∞ (zıt yönde dikey).
• DİKEY TEĞET: (x − a)^(1/3); eğim iki yanda da +∞ (ya da −∞); teğet dikey doğrudur.
• SÜREKSİZLİK: sıçrama varsa limit yoktur, türev de yoktur.

TÜREVLENEBİLİR ⇒ SÜREKLİ (tersi yanlış)
f(a+h) − f(a) = [ (f(a+h) − f(a))/h ] · h → f'(a)·0 = 0 olduğundan türevlenebilir fonksiyon süreklidir. Ama |x| sürekli olduğu hâlde x = 0'da türevlenemez.

PARÇALI FONKSİYON (BİRLEŞTİRME NOKTASI)
Sol parça L(x), sağ parça R(x), birleşim noktası a ise iki koşul gerekir:
(1) süreklilik: L(a) = R(a);   (2) eğim eşitliği: L'(a) = R'(a).

PÜF NOKTALARI
• Sürekli olmak türevlenebilir olmak için yetmez; önce süreklilik, sonra tek taraflı eğimler incelenir.
• Sınırsız eğim (±∞) türev olmadığı anlamına gelir; teğet dikey olabilir.

MİNİ ÖRNEK
f(x) = x² için: (f(x+h) − f(x))/h = (2xh + h²)/h = 2x + h → 2x.

MÜHENDİSLİKTE
Hız (konumun türevi), ivme, ısı akışı ve eğrilerin teğeti türevle bulunur. Köşe veya sıçrama, mekanizmada ani yön değişimi ya da darbe demektir.`,
`DEFINITION
The derivative function of f gives the slope at every x through a limit:
f'(x) = lim(h→0) [ f(x+h) − f(x) ] / h
At one point a: f'(a) = lim(h→0) [ f(a+h) − f(a) ] / h. On the graph this is the slope of the tangent at (a, f(a)). If the limit exists and is a finite number, f is "differentiable" at a.

BASIC DERIVATIVES FROM THE DEFINITION
f(x) = c      →  f'(x) = 0
f(x) = x²     →  f'(x) = 2x
f(x) = x³     →  f'(x) = 3x²
f(x) = 1/x    →  f'(x) = −1/x²
f(x) = √x     →  f'(x) = 1/(2√x)

METHOD (DERIVATIVE FROM THE DEFINITION)
1) Write f(x+h) and expand it.
2) In f(x+h) − f(x) the terms without h cancel; only terms with a factor h remain.
3) Factor h out and cancel it in (f(x+h) − f(x))/h.
4) Take the limit h → 0.
• For fractions such as 1/x, use a common denominator first; for square roots, multiply by the conjugate to remove the 0/0 form.

ONE-SIDED DERIVATIVES
From the left: f'₋(a) = lim(h→0⁻) [f(a+h) − f(a)]/h, from the right: f'₊(a) = lim(h→0⁺) [f(a+h) − f(a)]/h.
f'(a) exists ⇔ both exist and are equal.

FOUR WAYS TO FAIL TO BE DIFFERENTIABLE
• CORNER: like |x − a|; left and right slopes are finite but different (−1 and +1).
• CUSP: (x − a)^(2/3); slopes −∞ and +∞ (vertical, in opposite directions).
• VERTICAL TANGENT: (x − a)^(1/3); slope +∞ (or −∞) on both sides; the tangent is a vertical line.
• DISCONTINUITY: with a jump the limit does not exist, so neither does the derivative.

DIFFERENTIABLE ⇒ CONTINUOUS (the converse is false)
f(a+h) − f(a) = [ (f(a+h) − f(a))/h ] · h → f'(a)·0 = 0, so a differentiable function is continuous. But |x| is continuous and still not differentiable at x = 0.

PIECEWISE FUNCTION (JOINING POINT)
With left piece L(x), right piece R(x) and junction a, two conditions are needed:
(1) continuity: L(a) = R(a);   (2) equal slopes: L'(a) = R'(a).

COMMON PITFALLS
• Continuity is not enough; check continuity first, then the one-sided slopes.
• An unbounded slope means there is no derivative.

MINI EXAMPLE
For f(x) = x²: (f(x+h) − f(x))/h = (2xh + h²)/h = 2x + h → 2x.

IN ENGINEERING
Velocity (derivative of position), acceleration, heat flux and tangents of curves all come from derivatives. A corner or a jump means a sudden change of direction or an impact in a mechanism.`);
  }

  function statement(p) {
    if (p.type === 'def') {
      const m = defModel(p);
      return Tx(`f(x) = ${m.fS} fonksiyonunun türevini limit tanımından (f(x+h) − f(x))/h oranıyla bulalım. Sonra f'(${nf(p.x0, 2)}) kaç olur?`,
        `Let's find the derivative of f(x) = ${m.fS} from the limit definition (f(x+h) − f(x))/h. Then, what is f'(${nf(p.x0, 2)})?`);
    }
    if (p.type === 'diff') {
      return Tx(`f(x) = ${pieceStrs(p).join('; ')} fonksiyonu x = ${S(p.a)} noktasında türevlenebilir mi? Soldan ve sağdan türevleri bulup karşılaştıralım.`,
        `Is f(x) = ${pieceStrs(p).join('; ')} differentiable at x = ${S(p.a)}? Let's find the left and right derivatives and compare them.`);
    }
    if (p.type === 'classify') {
      return Tx(`f(x) = ${classStr(p)} fonksiyonunun x = ${S(p.a)} noktasındaki durumunu inceleyelim. Türevlenebilir mi? Değilse nedeni köşe, sivri uç, dikey teğet ya da süreksizlik hangisi?`,
        `Let's examine f(x) = ${classStr(p)} at x = ${S(p.a)}. Is it differentiable? If not, is the reason a corner, a cusp, a vertical tangent or a discontinuity?`);
    }
    const pi = pieceInfo(p);
    const right = p.onlyK ? `k·x + ${S(pi.m)}`.replace('+ −', '− ') : 'k·x + m';
    const unk = p.onlyK ? Tx('k', 'k') : Tx('k ve m', 'k and m');
    return Tx(`f(x) = ${pi.LS}  (x < ${S(p.a)}),  ${right}  (x ≥ ${S(p.a)}) fonksiyonunun x = ${S(p.a)} noktasında türevlenebilir olması için ${unk} sabitleri kaç olmalı?`,
      `For which value(s) of ${unk} is f(x) = ${pi.LS}  (x < ${S(p.a)}),  ${right}  (x ≥ ${S(p.a)}) differentiable at x = ${S(p.a)}?`);
  }
  function pieceStrs(p) {
    const L = poly([p.c, p.s1, p.q1], xa(p.a)), R = poly([p.c, p.s2, p.q2], xa(p.a));
    return [`${L}  (x < ${S(p.a)})`, `${R}  (x ≥ ${S(p.a)})`];
  }
  function classStr(p) {
    const u = xa(p.a), m = p.mm, c = p.c;
    const cs = c === 0 ? '' : (c < 0 ? ' − ' + (-c) : ' + ' + c);
    const co = m === 1 ? '' : m === -1 ? '−' : String(m);
    if (p.ck === 'corner') return `${co}|${p.a === 0 ? 'x' : 'x ' + (p.a > 0 ? '− ' + p.a : '+ ' + (-p.a))}|${cs}`;
    if (p.ck === 'cusp') return `${co}${u}^(2/3)${cs}`;
    if (p.ck === 'vert') return `${co}${u}^(1/3)${cs}`;
    const L = poly([c, p.s], u), R = poly([c + p.J, p.s], u);
    return `${L}  (x < ${S(p.a)}),  ${R}  (x ≥ ${S(p.a)})`;
  }

  // ---------- steps ----------
  const T = (tr, en) => Tx(tr, en);
  function stepsDef(p) {
    const m = defModel(p), { A, B, C, K, Mm } = p;
    const x0 = p.x0, val = m.d(x0);
    const out = [];
    out.push(T(`── 1) Tanımı yazalım ──\nf(x) = ${m.fS}\nf'(x) = lim(h→0) [ f(x+h) − f(x) ] / h`, `── 1) Write the definition ──\nf(x) = ${m.fS}\nf'(x) = lim(h→0) [ f(x+h) − f(x) ] / h`));
    let e1, e2, e3, e4;
    if (p.fk === 'quad') {
      e1 = `f(x+h) = ${lc([[A, '(x+h)²'], [B, '(x+h)'], [C, '']])}
        = ${lc([[A, 'x²'], [2 * A, 'xh'], [A, 'h²'], [B, 'x'], [B, 'h'], [C, '']])}`;
      e2 = `f(x+h) − f(x) = ${lc([[2 * A, 'xh'], [A, 'h²'], [B, 'h']])} = h·(${lc([[2 * A, 'x'], [A, 'h'], [B, '']])})`;
      e3 = `[f(x+h) − f(x)]/h = ${lc([[2 * A, 'x'], [A, 'h'], [B, '']])}   (${T('h ≠ 0 olduğu için h sadeleşti', 'h ≠ 0, so h cancels')})`;
      e4 = `h → 0:  f'(x) = ${m.dS}`;
    } else if (p.fk === 'cubic') {
      e1 = `f(x+h) = ${lc([[A, '(x+h)³'], [B, '(x+h)'], [C, '']])}
        = ${lc([[A, 'x³'], [3 * A, 'x²h'], [3 * A, 'xh²'], [A, 'h³'], [B, 'x'], [B, 'h'], [C, '']])}`;
      e2 = `f(x+h) − f(x) = ${lc([[3 * A, 'x²h'], [3 * A, 'xh²'], [A, 'h³'], [B, 'h']])} = h·(${lc([[3 * A, 'x²'], [3 * A, 'xh'], [A, 'h²'], [B, '']])})`;
      e3 = `[f(x+h) − f(x)]/h = ${lc([[3 * A, 'x²'], [3 * A, 'xh'], [A, 'h²'], [B, '']])}   (h ≠ 0)`;
      e4 = `h → 0:  f'(x) = ${m.dS}`;
    } else if (p.fk === 'inv') {
      const kk = K === 1 ? '' : S(K);
      e1 = `f(x+h) = ${S(K)}/(x+h)`;
      e2 = `f(x+h) − f(x) = ${S(K)}/(x+h) − ${S(K)}/x = ${S(K)}·[x − (x+h)] / [x(x+h)] = ${S(-K)}h / [x(x+h)]   (ortak payda / common denominator)`;
      e3 = `[f(x+h) − f(x)]/h = ${S(-K)} / [x(x+h)]   (${T('h sadeleşti', 'h cancels')})`;
      e4 = `h → 0:  f'(x) = ${S(-K)}/(x·x) = ${m.dS}`;
      void kk;
    } else {
      const q = Mm === 0 ? 'x' : `x + ${Mm}`;
      e1 = `f(x+h) = √(${Mm === 0 ? 'x + h' : q + ' + h'})`;
      e2 = `f(x+h) − f(x) = √(${q} + h) − √(${q})   (0/0 olacağı için eşlenik ile çarparız / 0/0 form: multiply by the conjugate)\n[√(${q} + h) − √(${q})]/h · [√(${q} + h) + √(${q})]/[√(${q} + h) + √(${q})] = [(${q} + h) − (${q})] / ( h·[√(${q} + h) + √(${q})] ) = h / ( h·[√(${q} + h) + √(${q})] )`;
      e3 = `[f(x+h) − f(x)]/h = 1 / [√(${q} + h) + √(${q})]   (${T('h ≠ 0, h sadeleşti', 'h ≠ 0, so h cancels')})`;
      e4 = `h → 0:  f'(x) = 1 / (2√(${q})) = ${m.dS}`;
    }
    out.push(T(`── 2) f(x+h) ve farkı ──\n${e1}\n${e2}`, `── 2) f(x+h) and the difference ──\n${e1}\n${e2}`));
    out.push(T(`── 3) h'yi sadeleştirelim ──\n${e3}`, `── 3) Cancel h ──\n${e3}`));
    out.push(T(`── 4) Limit ──\n${e4}\n\nİşlem boyunca h ≠ 0 aldık; limit h → 0 iken oranın yaklaştığı değeri verir.`, `── 4) Take the limit ──\n${e4}\n\nWe kept h ≠ 0 throughout; the limit is the value the ratio approaches as h → 0.`));
    out.push(T(`── 5) x = ${nf(x0, 2)} noktasında değer ──\nf'(${nf(x0, 2)}) = ${nf(val, 4)}\nBu, (${nf(x0, 2)}, ${nf(m.f(x0), 3)}) noktasındaki teğetin eğimidir.`,
      `── 5) Value at x = ${nf(x0, 2)} ──\nf'(${nf(x0, 2)}) = ${nf(val, 4)}\nThis is the slope of the tangent at (${nf(x0, 2)}, ${nf(m.f(x0), 3)}).`));
    const hh = 1e-4, nd = (m.f(x0 + hh) - m.f(x0)) / hh;
    out.push(T(`── 6) Kontrol ──\nh = 0,0001 ile sayısal eğim: (f(x₀+h) − f(x₀))/h ≈ ${nf(nd, 3)}  ✓ (≈ ${nf(val, 3)}).\nGrafikte f artanken f' > 0, azalırken f' < 0 olmalıdır; f'(x) = 0 olan yerde f'in teğeti yataydır.`,
      `── 6) Check ──\nNumerical slope with h = 0.0001: (f(x₀+h) − f(x₀))/h ≈ ${nf(nd, 3)}  ✓ (≈ ${nf(val, 3)}).\nOn the graph f' > 0 where f increases, f' < 0 where it decreases, and where f'(x) = 0 the tangent is horizontal.`));
    return out;
  }

  function stepsDiff(p) {
    const { a, c, s1, s2, q1, q2 } = p;
    const out = [];
    const dl = poly([0, s1, q1], 'h'), dr = poly([0, s2, q2], 'h');
    const ql = poly([s1, q1], 'h'), qr = poly([s2, q2], 'h');
    out.push(T(`── 1) Süreklilik ──\nf(${S(a)}) = ${S(c)} (sağ parça, x ≥ ${S(a)}).\nSoldan limit = ${S(c)}, sağdan limit = ${S(c)} → f, ${S(a)}'da sürekli. (Süreksiz olsaydı türevlenemezdi.)`,
      `── 1) Continuity ──\nf(${S(a)}) = ${S(c)} (right piece, x ≥ ${S(a)}).\nLeft limit = ${S(c)}, right limit = ${S(c)} → f is continuous at ${S(a)}. (If it were discontinuous it could not be differentiable.)`));
    out.push(T(`── 2) Soldan türev ──\nh < 0 için sol parça geçerli: f(${S(a)}+h) − f(${S(a)}) = ${dl}\nf'₋(${S(a)}) = lim(h→0⁻) ${ql} = ${S(s1)}`,
      `── 2) Left derivative ──\nFor h < 0 the left piece applies: f(${S(a)}+h) − f(${S(a)}) = ${dl}\nf'₋(${S(a)}) = lim(h→0⁻) ${ql} = ${S(s1)}`));
    out.push(T(`── 3) Sağdan türev ──\nh > 0 için sağ parça geçerli: f(${S(a)}+h) − f(${S(a)}) = ${dr}\nf'₊(${S(a)}) = lim(h→0⁺) ${qr} = ${S(s2)}`,
      `── 3) Right derivative ──\nFor h > 0 the right piece applies: f(${S(a)}+h) − f(${S(a)}) = ${dr}\nf'₊(${S(a)}) = lim(h→0⁺) ${qr} = ${S(s2)}`));
    if (s1 === s2) {
      out.push(T(`── 4) Karşılaştıralım ──\nf'₋(${S(a)}) = ${S(s1)} = f'₊(${S(a)}) olduğundan f, x = ${S(a)}'da TÜREVLENEBİLİR ve f'(${S(a)}) = ${S(s1)}.\nGrafikte iki parça aynı teğetle birleşir; köşe yoktur.`,
        `── 4) Compare ──\nf'₋(${S(a)}) = ${S(s1)} = f'₊(${S(a)}), so f IS DIFFERENTIABLE at x = ${S(a)} and f'(${S(a)}) = ${S(s1)}.\nOn the graph the two pieces join with the same tangent; there is no corner.`));
    } else {
      out.push(T(`── 4) Karşılaştıralım ──\nf'₋(${S(a)}) = ${S(s1)} ≠ ${S(s2)} = f'₊(${S(a)}) olduğundan f, x = ${S(a)}'da TÜREVLENEMEZ.\nFonksiyon sürekli ama grafikte bir KÖŞE var: sürekli olmak türevlenebilmek için yetmez.`,
        `── 4) Compare ──\nf'₋(${S(a)}) = ${S(s1)} ≠ ${S(s2)} = f'₊(${S(a)}), so f is NOT differentiable at x = ${S(a)}.\nThe function is continuous but its graph has a CORNER: continuity is not enough for differentiability.`));
    }
    const fl = poly([s1, 2 * q1], xa(a)), fr = poly([s2, 2 * q2], xa(a));
    out.push(T(`── 5) f' fonksiyonu ──\nf'(x) = ${fl}  (x < ${S(a)}),  ${fr}  (x > ${S(a)}).\n${s1 === s2 ? `x = ${S(a)}'da f'(${S(a)}) = ${S(s1)} ile boşluk kapanır.` : `x = ${S(a)}'da f' tanımsızdır: grafikte iki içi boş nokta (${S(s1)} ve ${S(s2)}) görülür.`}`,
      `── 5) The function f' ──\nf'(x) = ${fl}  (x < ${S(a)}),  ${fr}  (x > ${S(a)}).\n${s1 === s2 ? `At x = ${S(a)} the gap closes with f'(${S(a)}) = ${S(s1)}.` : `At x = ${S(a)} f' does not exist: the graph shows two hollow points (${S(s1)} and ${S(s2)}).`}`));
    return out;
  }

  function stepsClassify(p) {
    const { a, c, mm: m } = p;
    const out = [];
    const ck = p.ck;
    if (ck === 'jump') {
      const s = p.s, J = p.J;
      const qL = s === 0 ? S(-J) + '/h' : S(s) + (J < 0 ? ' + ' : ' − ') + Math.abs(J) + '/h';
      out.push(T(`── 1) Süreklilik ──\nSoldan limit = ${S(c)}, f(${S(a)}) = ${S(c + J)} (sağ parça). Sıçrama = ${S(J)} ≠ 0.\nf, x = ${S(a)}'da SÜREKSİZ.`,
        `── 1) Continuity ──\nLeft limit = ${S(c)}, f(${S(a)}) = ${S(c + J)} (right piece). Jump = ${S(J)} ≠ 0.\nf is DISCONTINUOUS at x = ${S(a)}.`));
      out.push(T(`── 2) Fark oranı ──\nSoldan: [f(${S(a)}+h) − f(${S(a)})]/h = [${lc([[c, ''], [s, 'h']])} − (${S(c + J)})]/h = ${qL} → ${INF(sgn(J))} (h → 0⁻).\nSağdan: = ${S(s)} (sonlu), ama soldan sınırsız.`,
        `── 2) Difference quotient ──\nFrom the left: [f(${S(a)}+h) − f(${S(a)})]/h = [${lc([[c, ''], [s, 'h']])} − (${S(c + J)})]/h = ${qL} → ${INF(sgn(J))} (h → 0⁻).\nFrom the right: = ${S(s)} (finite), but the left side is unbounded.`));
      out.push(T(`── 3) Sonuç ──\nTÜREV YOK: neden SÜREKSİZLİK (sıçrama). Türevlenebilir ⇒ sürekli olduğundan, sürekli olmayan bir noktada türev olamaz.`,
        `── 3) Conclusion ──\nNO DERIVATIVE: the reason is a DISCONTINUITY (jump). Since differentiable ⇒ continuous, there can be no derivative where f is not continuous.`));
      return out;
    }
    const diffq = {
      corner: [`f(${S(a)}+h) − f(${S(a)}) = ${S(m)}|h|`, `${S(m)}|h|/h`, `h → 0⁺: ${S(m)}|h|/h = ${S(m)};  h → 0⁻: ${S(m)}|h|/h = ${S(-m)}`],
      cusp: [`f(${S(a)}+h) − f(${S(a)}) = ${S(m)}·h^(2/3)`, `${S(m)}h^(2/3)/h = ${S(m)}/h^(1/3)`, `h → 0⁺: ${S(m)}/h^(1/3) → ${INF(sgn(m))};  h → 0⁻: → ${INF(-sgn(m))}`],
      vert: [`f(${S(a)}+h) − f(${S(a)}) = ${S(m)}·h^(1/3)`, `${S(m)}h^(1/3)/h = ${S(m)}/h^(2/3)`, `h → 0⁺ ve h → 0⁻: ${S(m)}/h^(2/3) → ${INF(sgn(m))} (h^(2/3) > 0)`],
    }[ck];
    const nameTr = { corner: 'KÖŞE', cusp: 'SİVRİ UÇ (cusp)', vert: 'DİKEY TEĞET' }[ck], nameEn = { corner: 'CORNER', cusp: 'CUSP', vert: 'VERTICAL TANGENT' }[ck];
    const why = {
      corner: [`Sol ve sağ eğim sonlu ama farklı (${S(-m)} ≠ ${S(m)}): iki yarım doğru bir açıyla birleşir.`, `Left and right slopes are finite but different (${S(-m)} ≠ ${S(m)}): two half-lines meet at an angle.`],
      cusp: [`Eğimler zıt işaretli sonsuza gider (${INF(-sgn(m))} ve ${INF(sgn(m))}): eğri aynı dikey doğrultuya iki yandan zıt yönde yaklaşır.`, `The slopes go to infinity with opposite signs (${INF(-sgn(m))} and ${INF(sgn(m))}): the curve meets the vertical direction from both sides with opposite orientation.`],
      vert: [`İki yanda da eğim ${INF(sgn(m))}: eğri sürekli ve teğet dikey doğrudur x = ${S(a)}; sonsuz eğim sonlu türev sayılmaz.`, `The slope is ${INF(sgn(m))} on both sides: the curve is continuous and the tangent is the vertical line x = ${S(a)}; an infinite slope is not a finite derivative.`],
    }[ck];
    out.push(T(`── 1) Süreklilik ──\nf(${S(a)}) = ${S(c)} ve limit de ${S(c)}: f sürekli (süreksizlik yok).`, `── 1) Continuity ──\nf(${S(a)}) = ${S(c)} and the limit is ${S(c)} too: f is continuous (no jump).`));
    out.push(T(`── 2) Fark oranı ──\n${diffq[0]}\nOran = ${diffq[1]}\n${diffq[2]}`, `── 2) Difference quotient ──\n${diffq[0]}\nQuotient = ${diffq[1]}\n${diffq[2]}`));
    out.push(T(`── 3) Tek taraflı eğimler ──\nf'₋(${S(a)}) = ${ck === 'corner' ? S(-m) : INF(ck === 'cusp' ? -sgn(m) : sgn(m))},  f'₊(${S(a)}) = ${ck === 'corner' ? S(m) : INF(sgn(m))}\n${why[0]}`,
      `── 3) One-sided slopes ──\nf'₋(${S(a)}) = ${ck === 'corner' ? S(-m) : INF(ck === 'cusp' ? -sgn(m) : sgn(m))},  f'₊(${S(a)}) = ${ck === 'corner' ? S(m) : INF(sgn(m))}\n${why[1]}`));
    out.push(T(`── 4) Sonuç ──\nf, x = ${S(a)}'da sürekli ama TÜREVLENEMEZ; neden: ${nameTr}.\n(Sürekli olmak türevlenebilirliği garanti etmez.)`, `── 4) Conclusion ──\nf is continuous at x = ${S(a)} but NOT differentiable; the reason: ${nameEn}.\n(Continuity does not guarantee differentiability.)`));
    return out;
  }

  function stepsPiece(p) {
    const pi = pieceInfo(p), a = p.a, k = pi.k, m = pi.m;
    const out = [];
    const ka = `k·${P(S(a))}`;
    out.push(T(`── 1) İki koşulu yazalım ──\nSol parça L(x) = ${pi.LS},  sağ parça R(x) = ${p.onlyK ? `kx + ${S(m)}`.replace('+ −', '− ') : 'kx + m'}.\n(1) Süreklilik: L(${S(a)}) = R(${S(a)})\n(2) Eğim eşitliği: L'(${S(a)}) = R'(${S(a)})`,
      `── 1) Write the two conditions ──\nLeft piece L(x) = ${pi.LS},  right piece R(x) = ${p.onlyK ? `kx + ${S(m)}`.replace('+ −', '− ') : 'kx + m'}.\n(1) Continuity: L(${S(a)}) = R(${S(a)})\n(2) Equal slopes: L'(${S(a)}) = R'(${S(a)})`));
    out.push(T(`── 2) Sol parçanın değerleri ──\nL(${S(a)}) = ${S(pi.Lv)}\nL'(x) = ${pi.LdS}  →  L'(${S(a)}) = ${S(pi.Ld)}\nSağ parçada R'(x) = k.`,
      `── 2) Values of the left piece ──\nL(${S(a)}) = ${S(pi.Lv)}\nL'(x) = ${pi.LdS}  →  L'(${S(a)}) = ${S(pi.Ld)}\nFor the right piece R'(x) = k.`));
    out.push(T(`── 3) Eğim koşulundan k ──\nk = L'(${S(a)}) = ${S(k)}`, `── 3) k from the slope condition ──\nk = L'(${S(a)}) = ${S(k)}`));
    if (p.onlyK) {
      out.push(T(`── 4) Süreklilik kontrolü ──\nR(${S(a)}) = ${S(k)}·${P(S(a))}${ad(m)} = ${S(k * a)}${ad(m)} = ${S(k * a + m)} = L(${S(a)}) ✓\nVerilen m = ${S(m)} ile süreklilik de sağlanıyor; bu yüzden k = ${S(k)} yeterlidir.`,
        `── 4) Continuity check ──\nR(${S(a)}) = ${S(k)}·${P(S(a))}${ad(m)} = ${S(k * a)}${ad(m)} = ${S(k * a + m)} = L(${S(a)}) ✓\nWith the given m = ${S(m)} continuity also holds, so k = ${S(k)} works.`));
    } else {
      out.push(T(`── 4) Süreklilikten m ──\n${ka} + m = ${S(pi.Lv)}  →  m = ${S(pi.Lv)} − (${S(k * a)}) = ${S(m)}`, `── 4) m from continuity ──\n${ka} + m = ${S(pi.Lv)}  →  m = ${S(pi.Lv)} − (${S(k * a)}) = ${S(m)}`));
    }
    out.push(T(`── 5) Sonuç ve kontrol ──\nk = ${S(k)}${p.onlyK ? '' : `,  m = ${S(m)}`}.\nf(x) = ${pi.LS}  (x < ${S(a)});  ${poly([m, k])}  (x ≥ ${S(a)}).\nKontrol: R(${S(a)}) = ${S(k * a + m)} = L(${S(a)}) ✓,  R' = ${S(k)} = L'(${S(a)}) ✓.\nGrafikte kaydırıcılarla k veya m'yi değiştirirsek birleşim noktasında sıçrama ya da köşe oluştuğunu görebiliriz.`,
      `── 5) Result and check ──\nk = ${S(k)}${p.onlyK ? '' : `,  m = ${S(m)}`}.\nf(x) = ${pi.LS}  (x < ${S(a)});  ${poly([m, k])}  (x ≥ ${S(a)}).\nCheck: R(${S(a)}) = ${S(k * a + m)} = L(${S(a)}) ✓,  R' = ${S(k)} = L'(${S(a)}) ✓.\nWith the sliders we can change k or m and see a jump or a corner appear at the junction.`));
    return out;
  }
  function solveSteps(p) { return p.type === 'def' ? stepsDef(p) : p.type === 'diff' ? stepsDiff(p) : p.type === 'classify' ? stepsClassify(p) : stepsPiece(p); }

  // ---------- drawing ----------
  const HND = {};
  const FIELDS = { def: ['xs'], diff: ['a', 's2'], classify: ['a', 'mm', 'c'], piece: ['dk', 'dm'] };
  function updateSliders(p) {
    try {
      const vis = FIELDS[p.type] || [];
      Object.keys(HND).forEach((f) => {
        const blk = HND[f] && HND[f].input && HND[f].input.parentElement;
        if (blk && blk.style) blk.style.display = vis.indexOf(f) >= 0 ? '' : 'none';
      });
    } catch (e) { /* ignore */ }
  }
  function draw(canvas, p) {
    try {
      updateSliders(p);
      canvas.setViewport(-6, 6, -8, 8);
      const acc = canvas.accent(), pur = canvas.purple(), gold = canvas.gold(), org = canvas.orange(), grn = canvas.green();
      if (p.type === 'def') {
        const m = defModel(p);
        canvas.addFunction({ evaluator: (x) => safe(m.f(x)), color: acc, thickness: 3, label: 'f' });
        canvas.addFunction({ evaluator: (x) => safe(m.d(x)), color: pur, thickness: 3, label: "f'" });
        const x = p.xs, y = m.f(x), d = m.d(x);
        if (isFinite(y) && isFinite(d)) {
          canvas.addFunction({ evaluator: (t) => y + d * (t - x), color: org, thickness: 2, dashed: true });
          canvas.addMarker({ x, y, color: gold, radius: 6, label: `f = ${nf(y, 2)}` });
          canvas.addMarker({ x, y: d, color: pur, radius: 6, label: `f' = ${nf(d, 2)}` });
          canvas.addSegment({ x1: x, y1: y, x2: x, y2: d, color: canvas.gray(), dashed: true, thickness: 1.5 });
        }
        if (p.fk === 'inv') canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.gray() });
        return;
      }
      const m = sideModel(p), a = m.a;
      canvas.addFunction({ evaluator: (x) => (x < a ? safe(m.fl(x)) : NaN), color: acc, thickness: 3, label: 'f' });
      canvas.addFunction({ evaluator: (x) => (x >= a ? safe(m.fr(x)) : NaN), color: acc, thickness: 3 });
      canvas.addFunction({ evaluator: (x) => (x < a ? safe(m.dl(x)) : NaN), color: pur, thickness: 2.5, label: "f'" });
      canvas.addFunction({ evaluator: (x) => (x > a ? safe(m.dr(x)) : NaN), color: pur, thickness: 2.5 });
      canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: `x = ${S(a)}` });
      if (isFinite(m.slL)) canvas.addFunction({ evaluator: (x) => (x <= a && x >= a - 3 ? m.yl + m.slL * (x - a) : NaN), color: org, thickness: 2, dashed: true });
      if (isFinite(m.slR)) canvas.addFunction({ evaluator: (x) => (x >= a && x <= a + 3 ? m.yr + m.slR * (x - a) : NaN), color: grn, thickness: 2, dashed: true });
      const same = Math.abs(m.yl - m.yr) < 1e-9;
      if (same) canvas.addMarker({ x: a, y: m.yr, color: gold, radius: 6, label: `f(${S(a)}) = ${nf(m.yr, 2)}` });
      else {
        canvas.addMarker({ x: a, y: m.yl, color: gold, radius: 6, hollow: true, label: nf(m.yl, 2) });
        canvas.addMarker({ x: a, y: m.yr, color: gold, radius: 6, label: `f(${S(a)}) = ${nf(m.yr, 2)}` });
      }
      const inf = (v) => (isFinite(v) ? nf(v, 2) : INF(v));
      if (isFinite(m.slL) && isFinite(m.slR) && Math.abs(m.slL - m.slR) < 1e-9) canvas.addMarker({ x: a, y: m.slL, color: pur, radius: 6, label: `f'(${S(a)}) = ${nf(m.slL, 2)}` });
      else {
        if (isFinite(m.slL)) canvas.addMarker({ x: a, y: m.slL, color: org, radius: 6, hollow: true, label: `f'₋ = ${inf(m.slL)}` });
        if (isFinite(m.slR)) canvas.addMarker({ x: a, y: m.slR, color: grn, radius: 6, hollow: true, label: `f'₊ = ${inf(m.slR)}` });
        if (!isFinite(m.slL) || !isFinite(m.slR)) canvas.addMarker({ x: a, y: m.yl + 0.0, color: org, radius: 2, label: `f'₋ = ${inf(m.slL)}, f'₊ = ${inf(m.slR)}` });
      }
    } catch (e) { /* never throw */ }
  }

  // ---------- controls ----------
  let selHandle = null;
  function buildControls(rightCol, getProblem, h) {
    const names = {
      def: Tx('Tanımdan türev', 'Derivative from the definition'), diff: Tx('Türevlenebilir mi? (tek taraflı eğimler)', 'Differentiable? (one-sided slopes)'),
      classify: Tx('Türevlenemeyen durumu sınıfla', 'Classify the non-differentiability'), piece: Tx('Parçalı fonksiyon: k ve m', 'Piecewise function: k and m'),
    };
    selHandle = h.addSelect({
      options: ['def', 'diff', 'classify', 'piece'].map((v) => ({ label: names[v], value: v })),
      get: () => getProblem().type,
      set: (v) => { Object.assign(getProblem(), genType(new Rng(), v)); },
    });
    const sl = (f, cap, min, max, step, tf) => {
      HND[f] = h.addSlider({
        caption: cap, min, max, step,
        get: () => getProblem()[f],
        set: (v) => { const q = getProblem(); q[f] = Math.max(min, Math.min(max, step >= 1 ? Math.round(v) : v)); if (tf) tf(q); },
      });
    };
    sl('xs', Tx('Teğet noktası x', 'Tangent point x'), -4, 4, 0.25);
    sl('a', Tx('Nokta a', 'Point a'), -3, 3, 1);
    sl('s2', Tx('Sağ eğim s₂', 'Right slope s₂'), -3, 3, 1);
    sl('mm', Tx('Katsayı m', 'Coefficient m'), -3, 3, 1, (q) => { if (q.mm === 0) q.mm = 1; });
    sl('c', Tx('Yükseklik c', 'Height c'), -3, 3, 1);
    sl('dk', Tx('k değişimi', 'Change in k'), -3, 3, 1);
    sl('dm', Tx('m değişimi', 'Change in m'), -3, 3, 1);
  }

  Topics.register('derivatives', {
    id: 'differentiability',
    tabTitle: () => Tx('Türev Fonksiyonu ve Türevlenebilirlik', 'The Derivative as a Function and Differentiability'),
    concept,
    problemStatement: statement,
    createProblem,
    solveSteps,
    draw: (canvas, p) => { try { if (selHandle && selHandle.refreshFromModel) selHandle.refreshFromModel(); } catch (e) { /* ignore */ } draw(canvas, p); },
    buildControls,
    links: [
      { match: /^f\(x\) = x²\s+→/, make: (rng) => { const p = defK(rng, 'quad'); p.A = 1; p.B = 0; p.C = 0; return p; } },
      { match: /^f\(x\) = x³\s+→/, make: (rng) => { const p = defK(rng, 'cubic'); p.A = 1; p.B = 0; p.C = 0; return p; } },
      { match: /^f\(x\) = 1\/x\s+→/, make: (rng) => { const p = defK(rng, 'inv'); p.K = 1; return p; } },
      { match: /^f\(x\) = √x\s+→/, make: (rng) => { const p = defK(rng, 'sqrt'); p.Mm = 0; p.x0 = rng.pick([1, 4]); p.xs = p.x0; return p; } },
      { match: /^• (1\/x gibi kesirlerde|For fractions such as 1\/x)/, make: (rng) => defK(rng, rng.pick(['inv', 'sqrt'])) },
      { match: /^(TEK TARAFLI TÜREVLER|ONE-SIDED DERIVATIVES)$/, make: (rng) => genType(rng, 'diff') },
      { match: /^• (KÖŞE|CORNER):/, make: (rng) => forceCk(rng, 'corner') },
      { match: /^• (SİVRİ UÇ|CUSP)/, make: (rng) => forceCk(rng, 'cusp') },
      { match: /^• (DİKEY TEĞET|VERTICAL TANGENT):/, make: (rng) => forceCk(rng, 'vert') },
      { match: /^• (SÜREKSİZLİK|DISCONTINUITY):/, make: (rng) => forceCk(rng, 'jump') },
      { match: /^(TÜREVLENEBİLİR ⇒ SÜREKLİ|DIFFERENTIABLE ⇒ CONTINUOUS)/, make: (rng) => forceCk(rng, 'corner') },
      { match: /^(PARÇALI FONKSİYON|PIECEWISE FUNCTION)/, make: (rng) => genType(rng, 'piece') },
    ],
    _model: (p) => (p.type === 'def' ? defModel(p) : sideModel(p)),
    _piece: pieceInfo,
  });
})();
