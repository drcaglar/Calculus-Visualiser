// Derivative Explorer (chapter 'derivatives'). Port of Modules/Derivatives/DerivativeExplorerControl.vb.
// The VB tab shows f (coloured by its slope) on top and f' below. Here both are overlaid on one canvas:
// f coloured by slope (blue = rising, orange = falling), f' in purple, a point (x, f(x)) with its tangent and the matching
// point (x, f'(x)); critical points are gold diamonds on f and gold circles on the f' zero-crossings.
// problem = { kind:'quad'|'cubic'|'flat'|'quartic'|'sin'|'cos'|'exp'|'xe'|'abs',
//             a,h,k (quad: a(x-h)^2+k; flat: a(x-h)^3+k), r1,r2,s,d (cubic), m (quartic/abs), c (exp/xe), x, show flags }
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const X0 = -4, X1 = 4;

  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dec === undefined ? 2 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  const SUPS = ['', '', '²', '³', '⁴'];
  function polyStr(co) {
    let s = '';
    for (let i = co.length - 1; i >= 0; i--) {
      const c = co[i];
      if (c === 0) continue;
      const ab = Math.abs(c);
      const lab = i === 0 ? '' : (i === 1 ? 'x' : 'x' + SUPS[i]);
      const body = lab === '' ? String(ab) : (ab === 1 ? lab : ab + lab);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    }
    return s || '0';
  }
  const derivP = (co) => (co.length <= 1 ? [0] : co.slice(1).map((c, i) => c * (i + 1)));
  const evalP = (co, x) => co.reduceRight((acc, c) => acc * x + c, 0);
  const lin = (r) => (r === 0 ? 'x' : r > 0 ? '(x − ' + r + ')' : '(x + ' + (-r) + ')');
  const kS = (k) => (k === 1 ? '' : k === -1 ? '−' : S(k));

  const KINDS = ['quad', 'cubic', 'flat', 'quartic', 'sin', 'cos', 'exp', 'xe', 'abs'];
  function kindName(k) {
    return {
      quad: Tx('İkinci derece', 'Quadratic'), cubic: Tx('Kübik (iki durağan nokta)', 'Cubic (two stationary points)'),
      flat: Tx('Kübik (yatay büküm)', 'Cubic (flat inflection)'), quartic: Tx('Dördüncü derece', 'Quartic'),
      sin: Tx('Sinüs', 'Sine'), cos: Tx('Kosinüs', 'Cosine'), exp: Tx('Üstel', 'Exponential'),
      xe: Tx('x·e^(cx) (çarpım)', 'x·e^(cx) (product)'), abs: Tx('Mutlak değer |x² − k²| (köşeler)', 'Absolute value |x² − k²| (corners)'),
    }[k];
  }

  // ---------- model: returns the function, its derivatives, strings and critical/inflection data ----------
  function model(p) {
    const o = { cr: [], infl: [], full: true };
    switch (p.kind) {
      case 'quad': {
        const co = [p.a * p.h * p.h + p.k, -2 * p.a * p.h, p.a];
        o.fs = polyStr(co); o.ds = polyStr(derivP(co)); o.dds = S(2 * p.a);
        o.fact = `${S(2 * p.a)}${lin(p.h)}`;
        o.F = (x) => evalP(co, x); o.dF = (x) => evalP(derivP(co), x); o.ddF = () => 2 * p.a;
        o.cr = [{ x: p.h, xs: S(p.h), ys: S(p.k), yv: p.k }];
        break;
      }
      case 'cubic': {
        const t = (p.r1 + p.r2) / 2;
        const co = [p.d, p.s * 3 * p.r1 * p.r2, -p.s * 3 * t, p.s];
        o.fs = polyStr(co); o.ds = polyStr(derivP(co)); o.dds = polyStr(derivP(derivP(co)));
        o.fact = `${S(3 * p.s)}${lin(p.r1)}${lin(p.r2)}`;
        o.F = (x) => evalP(co, x); o.dF = (x) => evalP(derivP(co), x); o.ddF = (x) => evalP(derivP(derivP(co)), x);
        o.cr = [p.r1, p.r2].map((r) => ({ x: r, xs: S(r), ys: S(evalP(co, r)), yv: evalP(co, r) }));
        o.infl = [{ x: t, xs: S(t) }];
        break;
      }
      case 'flat': {
        // a (x-h)^3 + k
        const a = p.a, h = p.h;
        const co = [a * (-h * h * h) + p.k, a * 3 * h * h, -a * 3 * h, a];
        o.fs = polyStr(co); o.ds = polyStr(derivP(co)); o.dds = polyStr(derivP(derivP(co)));
        o.fact = `${S(3 * a)}${lin(h)}²`;
        o.F = (x) => evalP(co, x); o.dF = (x) => evalP(derivP(co), x); o.ddF = (x) => evalP(derivP(derivP(co)), x);
        o.cr = [{ x: h, xs: S(h), ys: S(p.k), yv: p.k }];
        o.infl = [{ x: h, xs: S(h) }];
        break;
      }
      case 'quartic': {
        const m = p.m, s = p.s;
        const co = [p.d, 0, -2 * s * m * m, 0, s];
        o.fs = polyStr(co); o.ds = polyStr(derivP(co)); o.dds = polyStr(derivP(derivP(co)));
        o.fact = `${S(4 * s)}x(x − ${m})(x + ${m})`;
        o.F = (x) => evalP(co, x); o.dF = (x) => evalP(derivP(co), x); o.ddF = (x) => evalP(derivP(derivP(co)), x);
        o.cr = [-m, 0, m].map((r) => ({ x: r, xs: S(r), ys: S(evalP(co, r)), yv: evalP(co, r) }));
        const q = m / Math.sqrt(3);
        o.infl = [{ x: -q, xs: `−${m}/√3 ≈ ${nf(-q, 2)}` }, { x: q, xs: `${m}/√3 ≈ ${nf(q, 2)}` }];
        break;
      }
      case 'sin': {
        const k = p.k;
        o.fs = `${kS(k)}sin x`; o.ds = `${kS(k)}cos x`; o.dds = `${kS(-k)}sin x`; o.fact = o.ds;
        o.F = (x) => k * Math.sin(x); o.dF = (x) => k * Math.cos(x); o.ddF = (x) => -k * Math.sin(x);
        o.cr = [-Math.PI / 2, Math.PI / 2].map((r, i) => ({ x: r, xs: i === 0 ? '−π/2' : 'π/2', ys: S(k * Math.sin(r)), yv: k * Math.sin(r) }));
        o.infl = [{ x: -Math.PI, xs: '−π' }, { x: 0, xs: '0' }, { x: Math.PI, xs: 'π' }];
        o.full = false;
        break;
      }
      case 'cos': {
        const k = p.k;
        o.fs = `${kS(k)}cos x`; o.ds = `${kS(-k)}sin x`; o.dds = `${kS(-k)}cos x`; o.fact = o.ds;
        o.F = (x) => k * Math.cos(x); o.dF = (x) => -k * Math.sin(x); o.ddF = (x) => -k * Math.cos(x);
        o.cr = [-Math.PI, 0, Math.PI].map((r, i) => ({ x: r, xs: ['−π', '0', 'π'][i], ys: S(k * Math.cos(r)), yv: k * Math.cos(r) }));
        o.infl = [{ x: -Math.PI / 2, xs: '−π/2' }, { x: Math.PI / 2, xs: 'π/2' }];
        o.full = false;
        break;
      }
      case 'exp': {
        const k = p.k, c = p.c, e = 'e^' + (c === 1 ? 'x' : '(−x)');
        o.fs = `${kS(k)}${e}`; o.ds = `${kS(k * c)}${e}`; o.dds = `${kS(k)}${e}`; o.fact = o.ds;
        o.F = (x) => k * Math.exp(c * x); o.dF = (x) => k * c * Math.exp(c * x); o.ddF = (x) => k * Math.exp(c * x);
        break;
      }
      case 'xe': {
        const c = p.c, e = 'e^' + (c === 1 ? 'x' : '(−x)');
        o.fs = `x·${e}`; o.ds = `(1 ${c === 1 ? '+' : '−'} x)·${e}`; o.dds = `${c === 1 ? '(x + 2)' : '(x − 2)'}·${e}`; o.fact = o.ds;
        o.F = (x) => x * Math.exp(c * x); o.dF = (x) => (1 + c * x) * Math.exp(c * x); o.ddF = (x) => c * (2 + c * x) * Math.exp(c * x);
        const xc = -1 / c, yc = xc * Math.exp(c * xc);
        o.cr = [{ x: xc, xs: S(xc), ys: (c === 1 ? '−1/e' : '1/e') + ' ≈ ' + nf(yc, 2), yv: yc }];
        o.infl = [{ x: -2 / c, xs: S(-2 / c) }];
        break;
      }
      default: { // abs: |x^2 - m^2|
        const m = p.m;
        o.fs = `|x² − ${m * m}|`; o.ds = `2x·sgn(x² − ${m * m})`; o.dds = `±2`; o.fact = `{ −2x: |x| < ${m};  2x: |x| > ${m} }`;
        o.F = (x) => Math.abs(x * x - m * m);
        o.dF = (x) => (Math.abs(Math.abs(x) - m) < 1e-9 ? NaN : 2 * x * Math.sign(x * x - m * m));
        o.ddF = (x) => (Math.abs(Math.abs(x) - m) < 1e-9 ? NaN : 2 * Math.sign(x * x - m * m));
        o.cr = [
          { x: -m, xs: S(-m), ys: '0', yv: 0, corner: true },
          { x: 0, xs: '0', ys: S(m * m), yv: m * m },
          { x: m, xs: S(m), ys: '0', yv: 0, corner: true },
        ];
        o.infl = [{ x: -m, xs: S(-m), corner: true }, { x: m, xs: S(m), corner: true }];
      }
    }
    return o;
  }

  const F = (p, x) => { const y = model(p).F(x); return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN; };
  const dF = (p, x) => { const y = model(p).dF(x); return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN; };

  // ---------- generation ----------
  function genKind(rng, kind) {
    const p = { kind, a: 1, h: 0, k: 0, r1: -1, r2: 1, s: 1, d: 0, m: 1, c: 1, x: -3, showD: true, showTan: true, showReg: true, showCrit: true };
    switch (kind) {
      case 'quad': p.a = rng.pick([-2, -1, 1, 2]); p.h = rng.nextInt(-2, 3); p.k = rng.nextInt(-3, 4); break;
      case 'cubic': {
        let r1, r2;
        do { r1 = rng.nextInt(-3, 4); r2 = rng.nextInt(-3, 4); } while (r1 >= r2 || (r1 + r2) % 2 !== 0 || r2 - r1 > 4);
        p.r1 = r1; p.r2 = r2; p.s = rng.pick([-1, 1]); p.d = rng.nextInt(-3, 4); break;
      }
      case 'flat': p.a = rng.pick([-1, 1]); p.h = rng.nextInt(-2, 3); p.k = rng.nextInt(-3, 4); break;
      case 'quartic': p.m = rng.pick([1, 1, 2]); p.s = rng.pick([-1, 1]); p.d = rng.nextInt(-3, 4); break;
      case 'sin': case 'cos': p.k = rng.nonZeroInt(-3, 3); break;
      case 'exp': p.k = rng.pick([-2, -1, 1, 2]); p.c = rng.pick([-1, 1]); break;
      case 'xe': p.c = rng.pick([-1, 1]); break;
      default: p.m = rng.pick([1, 2]);
    }
    p.x = Math.max(X0, Math.min(X1, rng.nextInt(-3, 0) + 0));
    return p;
  }
  const RNG = new Rng();
  function createProblem(rng) {
    return genKind(rng, rng.pick(['quad', 'cubic', 'cubic', 'flat', 'quartic', 'quartic', 'sin', 'cos', 'exp', 'xe', 'abs']));
  }

  // ---------- sign analysis ----------
  function intervals(o, which) { // which: 'd' (f') or 'dd' (f'')
    const pts = (which === 'd' ? o.cr : o.infl).map((q) => q.x).filter((x) => x > X0 + 1e-9 && x < X1 - 1e-9).sort((u, v) => u - v);
    const bounds = [X0].concat(pts, [X1]);
    const f = which === 'd' ? o.dF : o.ddF;
    const out = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const mid = (bounds[i] + bounds[i + 1]) / 2;
      const v = f(mid);
      out.push({ lo: bounds[i], hi: bounds[i + 1], sign: v > 1e-9 ? 1 : (v < -1e-9 ? -1 : 0), loI: i, hiI: i });
    }
    return { pts, out };
  }
  function xTxt(o, list, x) { // label of a boundary
    if (Math.abs(x - X0) < 1e-9) return S(X0);
    if (Math.abs(x - X1) < 1e-9) return S(X1);
    const q = list.find((c) => Math.abs(c.x - x) < 1e-9);
    return q ? q.xs : nf(x, 2);
  }
  function classify(o) {
    const iv = intervals(o, 'd');
    const res = [];
    iv.pts.forEach((x, i) => {
      const q = o.cr.find((c) => Math.abs(c.x - x) < 1e-9);
      const sL = iv.out[i].sign, sR = iv.out[i + 1].sign;
      let type = 'none';
      if (sL > 0 && sR < 0) type = 'max'; else if (sL < 0 && sR > 0) type = 'min';
      res.push({ q, sL, sR, type });
    });
    return { iv, res };
  }

  // ---------- text ----------
  function problemStatement(p) {
    const o = model(p);
    return Tx(`f(x) = ${o.fs} fonksiyonunun türevi f′(x) nedir, birlikte bulalım. Sonra kritik noktalara bakalım; f′'nin işaretinden f'nin artan/azalan olduğu aralıkları ve yerel ekstremumları (tepe/çukur) bulalım; f″ ile bükeyliği de yorumlayalım. (Grafikteki ${S(X0)} ≤ x ≤ ${X1} aralığında çalışalım.)`,
      `Let's find the derivative f′(x) of f(x) = ${o.fs}. Then we can look at the critical points; from the sign of f′ we find where f is increasing/decreasing and the local extrema (peaks/valleys), and use f″ to discuss concavity. (We work on the interval ${S(X0)} ≤ x ≤ ${X1} shown in the graph.)`);
  }

  function concept() {
    return Tx(
      [
        'TÜREV BİR FONKSİYONDUR',
        'f′(x), her x için f grafiğinin teğet eğimini veren YENİ bir fonksiyondur. f ve f′ grafiklerini yan yana (burada aynı eksende) incelemek f hakkında çok şey anlatır: üstteki asıl eğri eğimine göre renklenir (artan yerlerde mavi, azalan yerlerde turuncu, anlık yatay yerlerde altın); mor eğri f′\'nin kendisidir.',
        '',
        'f′ İLE f ARASINDAKİ İLİŞKİ',
        '   - f′(x) > 0 olduğu aralıkta f ARTAR.',
        '   - f′(x) < 0 olduğu aralıkta f AZALIR.',
        '   - f′(x) = 0 ve işaret değiştiriyor: yerel tepe (+ → −) ya da çukur (− → +).',
        '   - f′ artıyorsa f yukarı bükey (f″ > 0); f′ azalıyorsa aşağı bükey (f″ < 0).',
        '   - f′\'nin tepe/çukur noktaları f\'nin büküm noktalarıdır (f″ işaret değiştirir).',
        '',
        'KRİTİK NOKTALAR',
        '   f\'nin tanım aralığının iç noktasında f′(x) = 0 olması (durağan nokta) ya da f′(x)\'in TANIMSIZ olması (köşe, sivri uç, dikey teğet).',
        '   Yerel ekstremumlar yalnızca kritik noktalarda olabilir.',
        '',
        'TÜREVİN OLMADIĞI YERLER',
        '   - Köşe (ör. |x|, x = 0)',
        '   - Sivri uç (cusp)',
        '   - Dikey teğet',
        '   - Süreksizlik noktaları',
        '   (Türevli olmak sürekli olmayı gerektirir; tersi doğru değildir.)',
        '',
        'YÖNTEM (f′ üzerinden f hakkında yorum)',
        '   1. f′(x)\'i hesaplayıp çarpanlarına ayırırız.',
        '   2. f′ = 0 olan (ve f′ tanımsız olan) x değerlerini işaretleriz: bunlar kritik noktalardır.',
        '   3. Kritik noktaların böldüğü her aralıkta f′\'nin işaretine bakarız (işaret tablosu): artan/azalan bölgeler bulunur.',
        '   4. İşaret + → − ise tepe, − → + ise çukur; işaret değişmiyorsa ekstremum YOKTUR.',
        '   5. f″\'nün işaretine bakarak bükeyliği ve büküm noktalarını buluruz.',
        '   6. Son olarak köşe ya da süreksizlik olup olmadığına bakarız.',
        '',
        'DİKKAT EDİLECEKLER',
        '   - f′(x) = 0 tepe/çukur olduğunu garanti etmez (ör. x³, x = 0: yatay büküm).',
        '   - f′ büyükse f hızlı değişir; bu f′\'nin hızlı değiştiği anlamına gelmez.',
        '   - f′ grafiği f\'nin değerlerini değil EĞİMLERİNİ gösterir.',
        '   - Yerel ekstremumun değeri f(c) ile hesaplanır, f′(c) ile değil.',
        '',
        'MİNİ ÖRNEK',
        'f(x) = x³ − 3x: f′ = 3x² − 3 = 3(x−1)(x+1). f′ = 0 için x = −1, 1. x = −1\'de + → −: tepe, f(−1) = 2; x = 1\'de − → +: çukur, f(1) = −2. f″ = 6x: x = 0\'da büküm.',
        '',
        'KAYDIRICI',
        'Noktayı gezdirdiğimizde: f′ pozitifken turuncu teğet yukarı eğimli (f artıyor), negatifken aşağı eğimlidir; f′ mor eğrisinin sıfırı kestiği x değerlerinde teğet yataydır.',
      ].join('\n'),
      [
        'THE DERIVATIVE IS A FUNCTION',
        'f′(x) is a NEW function giving the tangent slope of the graph of f at every x. Looking at the graphs of f and f′ side by side (here on the same axes) tells us a lot about f: the original curve is coloured by its slope (blue where rising, orange where falling, gold where momentarily flat); the purple curve is f′ itself.',
        '',
        'RELATING f′ TO f',
        '   - Where f′(x) > 0, f is INCREASING.',
        '   - Where f′(x) < 0, f is DECREASING.',
        '   - f′(x) = 0 with a sign change: local peak (+ to −) or valley (− to +).',
        '   - If f′ is increasing, f is concave up (f″ > 0); if f′ is decreasing, concave down (f″ < 0).',
        '   - Peaks/valleys of f′ are inflection points of f (f″ changes sign).',
        '',
        'CRITICAL POINTS',
        '   Interior points of the domain where f′(x) = 0 (stationary points) or where f′(x) does NOT EXIST (corner, cusp, vertical tangent).',
        '   Local extrema can only occur at critical points.',
        '',
        'WHERE THE DERIVATIVE FAILS TO EXIST',
        '   - Corners (e.g. |x| at x = 0)',
        '   - Cusps',
        '   - Vertical tangents',
        '   - Discontinuities',
        '   (Differentiable implies continuous; the converse is false.)',
        '',
        'METHOD (reading f from f′)',
        '   1. We compute f′(x) and factor it.',
        '   2. We mark the x values where f′ = 0 (and where f′ does not exist): the critical points.',
        '   3. We check the sign of f′ on each interval they create (sign table): increasing/decreasing regions.',
        '   4. A sign change + to − means a peak, − to + a valley; no sign change means NO extremum.',
        '   5. We use the sign of f″ for concavity and inflection points.',
        '   6. Finally we check for corners or discontinuities.',
        '',
        'PITFALLS',
        '   - f′(x) = 0 does not guarantee an extremum (e.g. x³ at x = 0: flat inflection).',
        '   - A large f′ means f changes quickly, not that f′ itself does.',
        '   - The graph of f′ shows SLOPES of f, not values of f.',
        '   - The value of a local extremum is f(c), not f′(c).',
        '',
        'MINI EXAMPLE',
        'f(x) = x³ − 3x: f′ = 3x² − 3 = 3(x−1)(x+1). f′ = 0 at x = −1, 1. At x = −1 the sign goes + to −: peak, f(−1) = 2; at x = 1 it goes − to +: valley, f(1) = −2. f″ = 6x: inflection at x = 0.',
        '',
        'SLIDER',
        'If we move the point, while f′ is positive the orange tangent slopes up (f rising), while negative it slopes down; at the x values where the purple f′ curve crosses zero the tangent is horizontal.',
      ].join('\n'));
  }

  function signWord(s, d) {
    if (d) return s > 0 ? Tx('f′ > 0  →  f ARTAN', 'f′ > 0  →  f INCREASING') : (s < 0 ? Tx('f′ < 0  →  f AZALAN', 'f′ < 0  →  f DECREASING') : 'f′ = 0');
    return s > 0 ? Tx('f″ > 0  →  yukarı bükey (∪)', 'f″ > 0  →  concave up (∪)') : (s < 0 ? Tx('f″ < 0  →  aşağı bükey (∩)', 'f″ < 0  →  concave down (∩)') : 'f″ = 0');
  }

  function solveSteps(p) {
    const o = model(p);
    const steps = [];
    const rangeNote = Tx(`(${S(X0)} ≤ x ≤ ${X1} aralığında)`, `(on ${S(X0)} ≤ x ≤ ${X1})`);
    // 1
    const factNote = p.kind === 'abs' ? '' : `\nf′(x) = ${o.fact}`;
    const how = {
      quad: Tx('kuvvet kuralı', 'power rule'), cubic: Tx('kuvvet kuralı (sonra çarpanlara ayırma)', 'power rule (then factoring)'), flat: Tx('kuvvet kuralı (tam kare çarpan)', 'power rule (perfect-square factor)'),
      quartic: Tx('kuvvet kuralı (sonra çarpanlara ayırma)', 'power rule (then factoring)'), sin: '(sin x)′ = cos x', cos: '(cos x)′ = −sin x', exp: '(e^(cx))′ = c·e^(cx)',
      xe: Tx('çarpım kuralı: (x·eᶜˣ)′ = eᶜˣ + c·x·eᶜˣ', 'product rule: (x·e^(cx))′ = e^(cx) + c·x·e^(cx)'), abs: Tx('parçalı: |u| = u (u ≥ 0) ya da −u (u < 0)', 'piecewise: |u| = u (u ≥ 0) or −u (u < 0)'),
    }[p.kind];
    steps.push(Tx(`── 1) Türev ──\nf(x) = ${o.fs}\nf′(x) = ${o.ds}   [${how}]${factNote}`, `── 1) The derivative ──\nf(x) = ${o.fs}\nf′(x) = ${o.ds}   [${how}]${factNote}`));
    // 2 critical points
    const crl = o.cr.filter((c) => c.x > X0 && c.x < X1);
    let crTr, crEn;
    if (!crl.length) {
      crTr = `f′(x) = ${o.ds} hiçbir x için 0 olmaz (${p.kind === 'exp' || p.kind === 'xe' ? 'eᶜˣ her zaman pozitiftir' : 'denklemin çözümü yok'}) ve f′ her yerde tanımlıdır ⇒ kritik nokta YOK; f tek yönlüdür.`;
      crEn = `f′(x) = ${o.ds} is never 0 (${p.kind === 'exp' || p.kind === 'xe' ? 'e^(cx) is always positive' : 'the equation has no solution'}) and f′ exists everywhere ⇒ NO critical points; f is monotonic.`;
    } else {
      const zero = crl.filter((c) => !c.corner), corn = crl.filter((c) => c.corner);
      crTr = (zero.length ? `f′(x) = 0 ⇒ ${o.fact} = 0 ⇒ x = ${zero.map((c) => c.xs).join(', ')}` : '') +
        (corn.length ? `\nf′ şu noktalarda TANIMSIZDIR (köşe): x = ${corn.map((c) => c.xs).join(', ')}` : '') +
        `\nKritik noktalar: ${crl.map((c) => `(${c.xs}, ${c.ys})`).join('   ')}`;
      crEn = (zero.length ? `f′(x) = 0 ⇒ ${o.fact} = 0 ⇒ x = ${zero.map((c) => c.xs).join(', ')}` : '') +
        (corn.length ? `\nf′ DOES NOT EXIST at (corner): x = ${corn.map((c) => c.xs).join(', ')}` : '') +
        `\nCritical points: ${crl.map((c) => `(${c.xs}, ${c.ys})`).join('   ')}`;
    }
    steps.push(Tx(`── 2) Kritik noktalar ${rangeNote} ──\n${crTr}`, `── 2) Critical points ${rangeNote} ──\n${crEn}`));
    // 3 sign table
    const cl = classify(o);
    const tbl = cl.iv.out.map((r) => `(${xTxt(o, o.cr, r.lo)}, ${xTxt(o, o.cr, r.hi)}):  ${signWord(r.sign, true)}`);
    steps.push(Tx(`── 3) f′ işaret tablosu ──\n${tbl.join('\n')}`, `── 3) Sign table of f′ ──\n${tbl.join('\n')}`));
    // 4 classification
    if (!cl.res.length) {
      steps.push(Tx('── 4) Ekstremumlar ──\nKritik nokta olmadığından yerel tepe ya da çukur yoktur.', '── 4) Extrema ──\nThere are no critical points, hence no local peaks or valleys.'));
    } else {
      const L = cl.res.map((r) => {
        const sg = (s) => (s > 0 ? '+' : s < 0 ? '−' : '0');
        const t = r.type;
        const tr = t === 'max' ? 'YEREL TEPE (maksimum)' : (t === 'min' ? 'YEREL ÇUKUR (minimum)' : 'EKSTREMUM YOK (işaret değişmiyor)');
        const en = t === 'max' ? 'LOCAL MAXIMUM' : (t === 'min' ? 'LOCAL MINIMUM' : 'NO EXTREMUM (no sign change)');
        return { tr: `x = ${r.q.xs}: f′ işareti ${sg(r.sL)} → ${sg(r.sR)} ⇒ ${tr}; f(${r.q.xs}) = ${r.q.ys}`, en: `x = ${r.q.xs}: f′ goes ${sg(r.sL)} → ${sg(r.sR)} ⇒ ${en}; f(${r.q.xs}) = ${r.q.ys}` };
      });
      let note = '';
      if (cl.res.some((r) => r.type === 'none')) note = Tx('\nf′(c) = 0 olması tek başına ekstremum demek değildir: işaret değişimi gerekir (burada yatay büküm).', '\nf′(c) = 0 alone does not make an extremum: the sign must change (here a flat inflection).');
      if (cl.res.some((r) => r.q.corner)) note += Tx('\nKöşelerde f′ yoktur, ama f\'nin yine de yerel ekstremumu olabilir (burada çukur).', '\nAt a corner f′ does not exist, yet f can still have an extremum (here a valley).');
      steps.push(Tx(`── 4) Ekstremumlar (birinci türev testi) ──\n${L.map((l) => l.tr).join('\n')}${note}`, `── 4) Extrema (first-derivative test) ──\n${L.map((l) => l.en).join('\n')}${note}`));
    }
    // 5 concavity
    const cc = intervals(o, 'dd');
    const ctbl = cc.out.map((r) => `(${xTxt(o, o.infl, r.lo)}, ${xTxt(o, o.infl, r.hi)}):  ${signWord(r.sign, false)}`);
    const flips = [];
    cc.pts.forEach((x, i) => { if (cc.out[i].sign * cc.out[i + 1].sign < 0) flips.push(o.infl.find((c) => Math.abs(c.x - x) < 1e-9)); });
    let inflTr, inflEn;
    if (!cc.pts.length) { inflTr = 'f″ işaret değiştirmiyor ⇒ büküm noktası yok.'; inflEn = 'f″ does not change sign ⇒ no inflection point.'; }
    else if (!flips.length) { inflTr = 'f″ işaret değiştirmiyor ⇒ büküm noktası yok.'; inflEn = 'f″ does not change sign ⇒ no inflection point.'; }
    else {
      const cornerOnly = flips.every((q) => q && q.corner);
      inflTr = cornerOnly ? `Bükeylik x = ${flips.map((q) => q.xs).join(', ')} noktalarında değişir, fakat f orada türevlenemez (köşe); bunlar büküm değil köşe noktalarıdır.` : `Büküm noktaları (f″ işaret değiştirir): x = ${flips.map((q) => q.xs).join(', ')}.`;
      inflEn = cornerOnly ? `Concavity changes at x = ${flips.map((q) => q.xs).join(', ')}, but f is not differentiable there (corners); they are corners, not inflection points.` : `Inflection points (f″ changes sign): x = ${flips.map((q) => q.xs).join(', ')}.`;
    }
    steps.push(Tx(`── 5) Bükeylik ──\nf″(x) = ${o.dds}\n${ctbl.join('\n')}\n${inflTr}`, `── 5) Concavity ──\nf″(x) = ${o.dds}\n${ctbl.join('\n')}\n${inflEn}`));
    // 6 slider reading
    const x = p.x, fx = o.F(x), sx = o.dF(x);
    let beh;
    if (!isFinite(sx)) beh = Tx('f′(x) tanımsız (köşe)', 'f′(x) does not exist (corner)');
    else if (Math.abs(sx) < 0.05) beh = Tx('f′(x) ≈ 0  →  durağan nokta', 'f′(x) ≈ 0  →  stationary point');
    else if (sx > 0) beh = Tx('f′(x) > 0  →  f artan', 'f′(x) > 0  →  f is increasing');
    else beh = Tx('f′(x) < 0  →  f azalan', 'f′(x) < 0  →  f is decreasing');
    steps.push(Tx(`── 6) Kaydırıcıdaki nokta ──\nx = ${nf(x, 2)}: f(x) = ${nf(fx, 3)},  f′(x) = ${nf(sx, 3)}\n${beh}\nÜst eğri bu noktada ${isFinite(sx) && Math.abs(sx) >= 0.05 ? (sx > 0 ? 'mavi' : 'turuncu') : 'altın'} renktedir; mor eğri de aynı x'te ${nf(sx, 3)} yüksekliğindedir.`,
      `── 6) The slider point ──\nx = ${nf(x, 2)}: f(x) = ${nf(fx, 3)},  f′(x) = ${nf(sx, 3)}\n${beh}\nThe curve is ${isFinite(sx) && Math.abs(sx) >= 0.05 ? (sx > 0 ? 'blue' : 'orange') : 'gold'} here; the purple curve is at height ${nf(sx, 3)} at the same x.`));
    return steps;
  }

  // ---------- drawing ----------
  function focus(p) {
    const y = model(p).F(p.x);
    return (isFinite(p.x) && isFinite(y)) ? { x: p.x, y } : null;
  }
  function draw(canvas, p) {
    try {
      try { if (selHandle && selHandle.refreshFromModel) selHandle.refreshFromModel(); } catch (e) { /* ignore */ }
      const o = model(p);
      const ys = [];
      for (let i = 0; i <= 200; i++) {
        const x = X0 + (X1 - X0) * i / 200;
        const y = o.F(x); if (isFinite(y)) ys.push(y);
        if (p.showD) { const d = o.dF(x); if (isFinite(d)) ys.push(d); }
      }
      ys.sort((u, v) => u - v);
      let lo = -4, hi = 4;
      if (ys.length > 10) { lo = ys[Math.floor(ys.length * 0.04)]; hi = ys[Math.min(ys.length - 1, Math.floor(ys.length * 0.96))]; }
      o.cr.forEach((c) => { lo = Math.min(lo, c.yv); hi = Math.max(hi, c.yv); });
      lo = Math.max(-30, Math.min(lo, 0)); hi = Math.min(30, Math.max(hi, 0));
      if (hi - lo < 4) { const c = (hi + lo) / 2; lo = c - 2; hi = c + 2; }
      const pad = (hi - lo) * 0.1;
      const fc = focus(p) || { x: 0, y: (lo + hi) / 2 };
      const hh = Math.max(hi - fc.y, fc.y - lo) + pad;
      canvas.setViewport(fc.x - 4, fc.x + 4, fc.y - hh, fc.y + hh);
      // increasing / decreasing regions
      if (p.showReg) {
        const iv = intervals(o, 'd').out;
        iv.forEach((r) => {
          if (r.sign === 0) return;
          canvas.addRegion({ xMin: r.lo, xMax: r.hi, color: r.sign > 0 ? 'rgba(30,144,255,0.10)' : 'rgba(255,120,30,0.10)' });
        });
      }
      const ev = (x) => { const y = o.F(x); return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN; };
      canvas.addFunction({ evaluator: ev, colorBySlope: true, color: canvas.accent(), thickness: 3.5, label: 'f(x) = ' + o.fs });
      if (p.showD) {
        canvas.addFunction({ evaluator: (x) => { const y = o.dF(x); return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN; }, color: canvas.purple(), thickness: 3, label: "f′(x)" });
      }
      if (p.showCrit) {
        o.cr.forEach((c) => {
          if (c.x < X0 || c.x > X1) return;
          canvas.addMarker({ x: c.x, y: c.yv, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${nf(c.x, 2)}, ${nf(c.yv, 2)})` });
          if (p.showD) canvas.addMarker({ x: c.x, y: 0, color: canvas.gold(), radius: 5, hollow: !!c.corner });
        });
      }
      const x = p.x, fx = o.F(x), sx = o.dF(x);
      canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray() });
      if (p.showTan && isFinite(fx) && isFinite(sx)) {
        canvas.addSegment({ x1: x - 1.2, y1: fx - 1.2 * sx, x2: x + 1.2, y2: fx + 1.2 * sx, color: canvas.orange(), thickness: 2.5 });
      }
      if (isFinite(fx)) canvas.addMarker({ x, y: fx, color: canvas.accent(), radius: 7, label: `f = ${nf(fx, 2)}` });
      if (p.showD && isFinite(sx)) canvas.addMarker({ x, y: sx, color: canvas.purple(), radius: 7, label: `f′ = ${nf(sx, 2)}` });
    } catch (e) { /* never throw */ }
  }

  let selHandle = null;
  function buildControls(rightCol, getProblem, h) {
    selHandle = h.addSelect({
      options: KINDS.map((k) => ({ label: kindName(k), value: k })),
      get: () => getProblem().kind,
      set: (v) => { Object.assign(getProblem(), genKind(RNG, v)); },
    });
    h.addSlider({
      caption: Tx('Nokta konumu (x)', 'Point position (x)'), min: X0, max: X1, step: 0.05,
      get: () => getProblem().x,
      set: (v) => { getProblem().x = Math.max(X0, Math.min(X1, v)); },
    });
    h.addCheckbox({ caption: Tx("f′ grafiğini göster (mor)", "Show the graph of f′ (purple)"), get: () => getProblem().showD, set: (v) => { getProblem().showD = !!v; } });
    h.addCheckbox({ caption: Tx('Teğeti göster', 'Show the tangent'), get: () => getProblem().showTan, set: (v) => { getProblem().showTan = !!v; } });
    h.addCheckbox({ caption: Tx('Artan / azalan bölgeleri boya', 'Shade increasing / decreasing regions'), get: () => getProblem().showReg, set: (v) => { getProblem().showReg = !!v; } });
    h.addCheckbox({ caption: Tx('Kritik noktaları işaretle', 'Mark the critical points'), get: () => getProblem().showCrit, set: (v) => { getProblem().showCrit = !!v; } });
  }

  Topics.register('derivatives', {
    id: 'derivativeExplorer',
    tabTitle: () => Tx('Türev Kaşifi', 'Derivative Explorer'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^\s+- (f′\(x\) > 0 olduğu aralıkta|Where f′\(x\) > 0,)/, make: (rng) => { const p = genKind(rng, 'exp'); p.k = rng.pick([1, 2]); p.c = 1; return p; } },
      { match: /^\s+- (f′\(x\) < 0 olduğu aralıkta|Where f′\(x\) < 0,)/, make: (rng) => { const p = genKind(rng, 'exp'); p.k = rng.pick([1, 2]); p.c = -1; return p; } },
      { match: /^\s+- (f′\(x\) = 0 ve işaret|f′\(x\) = 0 with a sign)/, make: (rng) => genKind(rng, rng.pick(['quad', 'cubic'])) },
      { match: /^\s+- (f′ artıyorsa|If f′ is increasing)/, make: (rng) => genKind(rng, rng.pick(['cubic', 'sin', 'cos'])) },
      { match: /^\s+- (f′'nin tepe\/çukur|Peaks\/valleys of f′)/, make: (rng) => genKind(rng, rng.pick(['cubic', 'quartic'])) },
      { match: /^\s+- (Köşe|Corners) /, make: (rng) => genKind(rng, 'abs') },
      { match: /^\s+- (Sivri uç|Cusps)/, tab: 'differentiability' },
      { match: /^\s+- (Dikey teğet|Vertical tangents)/, tab: 'differentiability' },
      { match: /^\s+- (Süreksizlik noktaları|Discontinuities)/, tab: 'differentiability' },
    ],
  });
})();
