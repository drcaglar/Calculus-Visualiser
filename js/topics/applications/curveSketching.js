// Curve Sketching (chapter 'applications'). Port of Modules/Applications/CurveSketchingControl.vb, extended.
// problem = { kind, ...params, stage, shade }
//   kinds: cubicOdd, cubicTouch, quartic, hyper, xOverX2, twoVA, slant, xexp, xlnx, lnOverX, xsin, xsqrt
// The stage slider (0..6) reveals the checklist like the desktop tab: domain, intercepts, symmetry,
// f' (monotonicity + extrema), f'' (concavity + inflections), asymptotes, then the full curve.
// Exact values are written in "calculator syntax" (explicit *, /, sqrt(...), e^(...), pi) and pretty-printed by P().
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  // ---------- small helpers ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function rat(n, d) {                    // reduced fraction, ASCII minus, valid JS
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (n === 0) n = 0;
    return d === 1 ? String(n) : n + '/' + d;
  }
  const M = (s) => String(s).replace(/-/g, '−');
  // calculator syntax -> display
  function P(s) {
    return String(s).replace(/√\((\d+)\)/g, '√$1').replace(/\^([234])(?![\d])/g, (m, d) => ({ 2: '²', 3: '³', 4: '⁴' }[d])).replace(/\*/g, '·').replace(/-/g, '−');
  }
  function nf(v, dec) {
    if (!isFinite(v)) return Tx('tanımsız', 'not defined');
    let s = v.toFixed(dec === undefined ? 4 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  // exact string + decimal when it is not an integer
  function ex(S, v) {
    const d = nf(v, 4);
    const pS = P(S);
    return (/^[−\d]+$/.test(pS) || pS === d) ? pS : pS + ' ≈ ' + d;
  }
  function poly(terms) {
    let s = '';
    terms.forEach((t) => {
      const c = t[0], l = t[1];
      if (c === 0) return;
      const ab = Math.abs(c);
      const body = l === '' ? String(ab) : (ab === 1 ? l : ab + l);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }
  const pk = (k) => (k === 0 ? '' : (k < 0 ? ' − ' + (-k) : ' + ' + k));
  function Hdr(n, text) { return '── ' + n + ') ' + text + ' ──'; }
  const clip = (v) => (isFinite(v) && Math.abs(v) < 1e7 ? v : NaN);
  const INF = Infinity;
  const pt = (x, S) => ({ x, S });

  // ---------- state ----------
  let forcedKind = 'random';
  const KINDS = ['cubicOdd', 'cubicTouch', 'quartic', 'hyper', 'xOverX2', 'twoVA', 'slant', 'xexp', 'xlnx', 'lnOverX', 'xsin', 'xsqrt'];
  function kindLabel(k) {
    switch (k) {
      case 'cubicOdd': return Tx('Tek kübik: x³ − 3m²x', 'Odd cubic: x³ − 3m²x');
      case 'cubicTouch': return Tx('Kübik: eksene teğet kök', 'Cubic: double root touching the axis');
      case 'quartic': return Tx('Dördüncü derece (W / M şekli)', 'Quartic (W shape)');
      case 'hyper': return Tx('Hiperbol: (ax + b)/(x − c)', 'Hyperbola: (ax + b)/(x − c)');
      case 'xOverX2': return Tx('x/(x² + m²)', 'x/(x² + m²)');
      case 'twoVA': return Tx('x²/(x² − m²): iki dikey asimptot', 'x²/(x² − m²): two vertical asymptotes');
      case 'slant': return Tx('Eğik asimptotlu rasyonel', 'Rational with a slant asymptote');
      case 'xexp': return Tx('x·e^(−kx)', 'x·e^(−kx)');
      case 'xlnx': return Tx('xⁿ ln x (n = 1, 2)', 'xⁿ ln x (n = 1, 2)');
      case 'lnOverX': return Tx('ln x / xⁿ', 'ln x / xⁿ');
      case 'xsin': return Tx('x − 2 sin x, [0, 2π]', 'x − 2 sin x on [0, 2π]');
      case 'xsqrt': return Tx('x·√(3t² − x)', 'x·√(3t² − x)');
      default: return Tx('Rastgele', 'Random');
    }
  }

  function createProblem(rng, kindArg) {
    const kind = kindArg || (forcedKind === 'random' ? rng.pick(KINDS) : forcedKind);
    const p = { kind, stage: 6, shade: true };
    const I = (a, b) => rng.nextInt(a, b + 1);
    switch (kind) {
      case 'cubicOdd': p.m = I(1, 3); break;
      case 'cubicTouch': p.m = I(1, 2); p.s = rng.pick([1, -1]); break;
      case 'quartic': p.m = I(1, 3); p.k = I(1, p.m * p.m + 2); break;
      case 'hyper': {
        p.a = rng.nonZeroInt(-3, 3); p.c = rng.nonZeroInt(-3, 3);
        do { p.b = I(-6, 6); } while (p.a * p.c + p.b === 0);
        break;
      }
      case 'xOverX2': p.m = I(1, 3); break;
      case 'twoVA': p.m = I(1, 3); break;
      case 'slant': p.c = I(-2, 2); p.q = I(-2, 2); p.k = I(1, 3); break;
      case 'xexp': p.k = I(1, 3); break;
      case 'xlnx': p.n = I(1, 2); break;
      case 'lnOverX': p.n = I(1, 2); break;
      case 'xsin': break;
      default: p.t = I(1, 2); break; // xsqrt
    }
    return p;
  }

  // ---------- specifications ----------
  // sp = { fS, f, f1, f2, domTR/domEN, lo, hi, loClosed, hiClosed, yint:{y,S}|null, xints:[{x,S}], xnote?, symm:{type,tr,en},
  //        asy:[[tr,en]...], vas:[x], has:[y], slant:{m,b}|null, crit:[{x,S,yS}], infl:[{x,S,yS}], b1:[pt], b2:[pt],
  //        d1Solve:[tr,en], d2Solve:[tr,en], dS, d2S, view:[x0,x1,(y0,y1)], ends:[{x,S,yS,open}], trend:[tr,en] }
  function spec(p) {
    const sp = { lo: -INF, hi: INF, loClosed: false, hiClosed: false, vas: [], has: [], slant: null, crit: [], infl: [], ends: [], xints: [], yint: null, asy: [], b1: [], b2: [] };
    switch (p.kind) {
      case 'cubicOdd': {
        const m = p.m, m2 = m * m, m3 = m2 * m;
        sp.fS = 'x³ − ' + 3 * m2 + 'x';
        sp.f = (x) => clip(x * x * x - 3 * m2 * x); sp.f1 = (x) => 3 * x * x - 3 * m2; sp.f2 = (x) => 6 * x;
        sp.dom = ['Tanım kümesi: polinom olduğu için tüm reel sayılar, ℝ.', 'Domain: it is a polynomial, so all real numbers, ℝ.'];
        sp.yint = { y: 0, S: '0' };
        sp.xints = [pt(-m * Math.sqrt(3), '-' + (m === 1 ? '' : m + '*') + '√(3)'), pt(0, '0'), pt(m * Math.sqrt(3), (m === 1 ? '' : m + '*') + '√(3)')];
        sp.xnote = ['x³ − ' + 3 * m2 + 'x = x(x² − ' + 3 * m2 + ') = 0 ⇒ x = 0 veya x = ±' + (m === 1 ? '' : m) + '√3.', 'x³ − ' + 3 * m2 + 'x = x(x² − ' + 3 * m2 + ') = 0 ⇒ x = 0 or x = ±' + (m === 1 ? '' : m) + '√3.'];
        sp.symm = { type: 'odd', tr: 'f(−x) = (−x)³ − ' + 3 * m2 + '(−x) = −x³ + ' + 3 * m2 + 'x = −f(x) ⇒ TEK fonksiyon: grafik orijine göre simetrik.', en: 'f(−x) = (−x)³ − ' + 3 * m2 + '(−x) = −x³ + ' + 3 * m2 + 'x = −f(x) ⇒ ODD function: the graph is symmetric about the origin.' };
        sp.asy = [['Polinom olduğundan dikey ya da yatay asimptot yok. Uçlarda: x → +∞ iken f → +∞, x → −∞ iken f → −∞ (baş terim x³).', 'A polynomial has no vertical or horizontal asymptote. End behaviour: f → +∞ as x → +∞ and f → −∞ as x → −∞ (leading term x³).']];
        sp.dS = '3x² − ' + 3 * m2;
        sp.d1Solve = ['3x² − ' + 3 * m2 + ' = 3(x − ' + m + ')(x + ' + m + ') = 0 ⇒ x = ' + M(-m) + ' ve x = ' + m + ' (kritik noktalar).', '3x² − ' + 3 * m2 + ' = 3(x − ' + m + ')(x + ' + m + ') = 0 ⇒ x = ' + M(-m) + ' and x = ' + m + ' (critical points).'];
        sp.crit = [{ x: -m, S: String(-m), yS: String(2 * m3) }, { x: m, S: String(m), yS: String(-2 * m3) }];
        sp.b1 = [pt(-m, String(-m)), pt(m, String(m))];
        sp.d2S = '6x'; sp.d2Solve = ['6x = 0 ⇒ x = 0.', '6x = 0 ⇒ x = 0.'];
        sp.infl = [{ x: 0, S: '0', yS: '0' }]; sp.b2 = [pt(0, '0')];
        sp.view = [-2.4 * m, 2.4 * m];
        break;
      }
      case 'cubicTouch': {
        const m = p.m, s = p.s, m2 = m * m, m3 = m2 * m, c = 2 * s * m3;
        sp.fS = 'x³ − ' + 3 * m2 + 'x' + (c < 0 ? ' − ' + (-c) : ' + ' + c);
        sp.f = (x) => clip(x * x * x - 3 * m2 * x + c); sp.f1 = (x) => 3 * x * x - 3 * m2; sp.f2 = (x) => 6 * x;
        sp.dom = ['Tanım kümesi: polinom, ℝ.', 'Domain: polynomial, ℝ.'];
        sp.yint = { y: c, S: String(c) };
        const dbl = s * m, sim = -2 * s * m;       // double root and simple root
        sp.xints = [pt(Math.min(dbl, sim), String(Math.min(dbl, sim))), pt(Math.max(dbl, sim), String(Math.max(dbl, sim)))];
        sp.xnote = ['Çarpanlara ayır: f(x) = (x ' + (s > 0 ? '−' : '+') + ' ' + m + ')²(x ' + (s > 0 ? '+' : '−') + ' ' + 2 * m + ') ⇒ x = ' + M(dbl) + ' ÇİFT kök (eksene teğet) ve x = ' + M(sim) + ' tek kök (eksenden geçer).',
          'Factor: f(x) = (x ' + (s > 0 ? '−' : '+') + ' ' + m + ')²(x ' + (s > 0 ? '+' : '−') + ' ' + 2 * m + ') ⇒ x = ' + M(dbl) + ' is a DOUBLE root (the graph touches the axis) and x = ' + M(sim) + ' a simple root (the graph crosses).'];
        sp.symm = { type: 'none', tr: 'f(−x) = −x³ + ' + 3 * m2 + 'x' + (c < 0 ? ' − ' + (-c) : ' + ' + c) + ' ne f(x) ne de −f(x) ⇒ ne çift ne tek (ancak (0, ' + M(c) + ') noktasına göre nokta simetrisi vardır).',
          en: 'f(−x) = −x³ + ' + 3 * m2 + 'x' + (c < 0 ? ' − ' + (-c) : ' + ' + c) + ' equals neither f(x) nor −f(x) ⇒ neither even nor odd (though it is point-symmetric about (0, ' + M(c) + ')).' };
        sp.asy = [['Polinom: asimptot yok. x → +∞ iken f → +∞, x → −∞ iken f → −∞.', 'Polynomial: no asymptote. f → +∞ as x → +∞ and f → −∞ as x → −∞.']];
        sp.dS = '3x² − ' + 3 * m2;
        sp.d1Solve = ['3x² − ' + 3 * m2 + ' = 3(x − ' + m + ')(x + ' + m + ') = 0 ⇒ x = ' + M(-m) + ', x = ' + m + '.', '3x² − ' + 3 * m2 + ' = 3(x − ' + m + ')(x + ' + m + ') = 0 ⇒ x = ' + M(-m) + ', x = ' + m + '.'];
        sp.crit = [{ x: -m, S: String(-m), yS: String(2 * m3 + c) }, { x: m, S: String(m), yS: String(-2 * m3 + c) }];
        sp.b1 = [pt(-m, String(-m)), pt(m, String(m))];
        sp.d2S = '6x'; sp.d2Solve = ['6x = 0 ⇒ x = 0.', '6x = 0 ⇒ x = 0.'];
        sp.infl = [{ x: 0, S: '0', yS: String(c) }]; sp.b2 = [pt(0, '0')];
        sp.view = [-3 * m, 3 * m];
        break;
      }
      case 'quartic': {
        const m = p.m, k = p.k, m2 = m * m, m4 = m2 * m2;
        sp.fS = 'x⁴ − ' + 2 * m2 + 'x²' + pk(m4 - k * k);
        sp.f = (x) => clip(x * x * x * x - 2 * m2 * x * x + m4 - k * k); sp.f1 = (x) => 4 * x * (x * x - m2); sp.f2 = (x) => 12 * x * x - 4 * m2;
        sp.dom = ['Tanım kümesi: polinom, ℝ.', 'Domain: polynomial, ℝ.'];
        sp.yint = { y: m4 - k * k, S: String(m4 - k * k) };
        sp.xnote = [`f(x) = (x² − ${m2})² − ${k * k} = (x² − ${m2 + k})(x² − ${m2 - k}) olduğundan kökler x² = ${m2 + k} ve x² = ${m2 - k} denklemlerinden gelir.`,
          `Since f(x) = (x² − ${m2})² − ${k * k} = (x² − ${m2 + k})(x² − ${m2 - k}), the roots come from x² = ${m2 + k} and x² = ${m2 - k}.`];
        const rt = [];
        const sq = (n) => { const r = Math.round(Math.sqrt(n)); return r * r === n ? String(r) : '√(' + n + ')'; };
        const sqv = (n) => Math.sqrt(n);
        const big = m2 + k, small = m2 - k;
        rt.push(pt(-sqv(big), '-' + sq(big)));
        if (small > 0) { rt.push(pt(-sqv(small), '-' + sq(small))); rt.push(pt(sqv(small), sq(small))); }
        else if (small === 0) rt.push(pt(0, '0'));
        rt.push(pt(sqv(big), sq(big)));
        sp.xints = rt.sort((u, v) => u.x - v.x);
        sp.symm = { type: 'even', tr: 'f(−x) = (−x)⁴ − ' + 2 * m2 + '(−x)² + ' + (m4 - k * k) + ' = f(x) ⇒ ÇİFT fonksiyon: grafik y eksenine göre simetrik.', en: 'f(−x) = (−x)⁴ − ' + 2 * m2 + '(−x)² + ' + (m4 - k * k) + ' = f(x) ⇒ EVEN function: the graph is symmetric about the y-axis.' };
        sp.asy = [['Polinom: asimptot yok. x → ±∞ iken f → +∞ (baş terim x⁴, katsayı pozitif).', 'Polynomial: no asymptote. f → +∞ as x → ±∞ (leading term x⁴ with positive coefficient).']];
        sp.dS = '4x³ − ' + 4 * m2 + 'x';
        sp.d1Solve = [`4x³ − ${4 * m2}x = 4x(x − ${m})(x + ${m}) = 0 ⇒ x = ${M(-m)}, 0, ${m} (kritik noktalar).`, `4x³ − ${4 * m2}x = 4x(x − ${m})(x + ${m}) = 0 ⇒ x = ${M(-m)}, 0, ${m} (critical points).`];
        sp.crit = [{ x: -m, S: String(-m), yS: String(-k * k) }, { x: 0, S: '0', yS: String(m4 - k * k) }, { x: m, S: String(m), yS: String(-k * k) }];
        sp.b1 = [pt(-m, String(-m)), pt(0, '0'), pt(m, String(m))];
        sp.d2S = '12x² − ' + 4 * m2;
        sp.d2Solve = [`12x² − ${4 * m2} = 4(3x² − ${m2}) = 0 ⇒ x² = ${rat(m2, 3)} ⇒ x = ±${m === 1 ? '' : m}√3/3.`, `12x² − ${4 * m2} = 4(3x² − ${m2}) = 0 ⇒ x² = ${rat(m2, 3)} ⇒ x = ±${m === 1 ? '' : m}√3/3.`];
        const xi = m * Math.sqrt(3) / 3, yi = rat(4 * m4 - 9 * k * k, 9);
        const xiS = (m === 1 ? '' : m + '*') + '√(3)/3';
        sp.infl = [{ x: -xi, S: '-' + xiS, yS: yi }, { x: xi, S: xiS, yS: yi }]; sp.b2 = [pt(-xi, '-' + xiS), pt(xi, xiS)];
        sp.view = [-(sqv(big) + 0.7), sqv(big) + 0.7];
        break;
      }
      case 'hyper': {
        const a = p.a, b = p.b, c = p.c, K0 = a * c + b;
        sp.fS = '(' + poly([[a, 'x'], [b, '']]) + ') / (x' + pk(-c) + ')';
        sp.f = (x) => (Math.abs(x - c) < 1e-9 ? NaN : clip((a * x + b) / (x - c)));
        sp.f1 = (x) => -K0 / ((x - c) * (x - c)); sp.f2 = (x) => 2 * K0 / Math.pow(x - c, 3);
        sp.dom = ['Payda x' + pk(-c) + ' = 0 ⇒ x = ' + M(c) + ' yasak. Tanım kümesi: ℝ ∖ {' + M(c) + '}.', 'Denominator x' + pk(-c) + ' = 0 ⇒ x = ' + M(c) + ' is excluded. Domain: ℝ ∖ {' + M(c) + '}.'];
        sp.yint = { y: -b / c, S: rat(-b, c) };
        sp.xints = [pt(-b / a, rat(-b, a))];
        sp.xnote = ['Pay = 0: ' + poly([[a, 'x'], [b, '']]) + ' = 0 ⇒ x = ' + M(rat(-b, a)) + ' (x = ' + M(c) + ' olmadığı için geçerli).', 'Numerator = 0: ' + poly([[a, 'x'], [b, '']]) + ' = 0 ⇒ x = ' + M(rat(-b, a)) + ' (valid because it is not x = ' + M(c) + ').'];
        sp.symm = { type: 'none', tr: 'f(−x) ne f(x) ne de −f(x) ⇒ ne çift ne tek. (f(x) = ' + a + ' + ' + M(K0) + '/(x' + pk(-c) + ') olduğundan (' + M(c) + ', ' + a + ') noktasına göre nokta simetrisi vardır.)', en: 'f(−x) equals neither f(x) nor −f(x) ⇒ neither even nor odd. (Since f(x) = ' + a + ' + ' + M(K0) + '/(x' + pk(-c) + ') it is point-symmetric about (' + M(c) + ', ' + a + ').)' };
        const sgn = K0 > 0 ? '+∞' : '−∞', sgn2 = K0 > 0 ? '−∞' : '+∞';
        sp.vas = [c]; sp.has = [a];
        sp.asy = [
          ['Dikey: x → ' + M(c) + '⁺ iken pay ' + M(K0) + ' (x = ' + M(c) + ' için), payda 0⁺ ⇒ f → ' + sgn + '; x → ' + M(c) + '⁻ iken f → ' + sgn2 + '. Dikey asimptot x = ' + M(c) + '.', 'Vertical: as x → ' + M(c) + '⁺ the numerator tends to ' + M(K0) + ' and the denominator to 0⁺ ⇒ f → ' + sgn + '; as x → ' + M(c) + '⁻, f → ' + sgn2 + '. Vertical asymptote x = ' + M(c) + '.'],
          ['Yatay: x → ±∞ iken f → ' + a + '/1 = ' + a + ' (aynı derece, baş katsayılar oranı). Yatay asimptot y = ' + a + '.', 'Horizontal: as x → ±∞, f → ' + a + '/1 = ' + a + ' (equal degrees, ratio of leading coefficients). Horizontal asymptote y = ' + a + '.'],
        ];
        sp.dS = M(-K0) + '/(x' + pk(-c) + ')²';
        sp.d1Solve = ['Pay sabit (' + M(-K0) + ' ≠ 0) olduğundan f′ hiçbir yerde 0 olmaz; payda (x' + pk(-c) + ')² yalnızca x = ' + M(c) + '\'de 0 (tanım dışı). Kritik nokta YOK.', 'The numerator is the non-zero constant ' + M(-K0) + ', so f′ is never 0; the denominator (x' + pk(-c) + ')² vanishes only at x = ' + M(c) + ' (outside the domain). There are NO critical points.'];
        sp.b1 = [pt(c, String(c))];
        sp.d2S = M(2 * K0) + '/(x' + pk(-c) + ')³';
        sp.d2Solve = ['Pay sabit (' + M(2 * K0) + ' ≠ 0): f″ = 0 çözümü yok. Büküm noktası YOK; bükeylik yalnızca x = ' + M(c) + '\'de (dikey asimptotta) değişir.', 'The numerator is the non-zero constant ' + M(2 * K0) + ': f″ = 0 has no solution. There are NO inflection points; concavity changes only at x = ' + M(c) + ' (the vertical asymptote).'];
        sp.b2 = [pt(c, String(c))];
        const lo = Math.min(c, -b / a, 0) - 4, hi = Math.max(c, -b / a, 0) + 4;
        sp.view = [lo, hi, a - 7, a + 7];
        break;
      }
      case 'xOverX2': {
        const m = p.m, m2 = m * m;
        sp.fS = 'x / (x² + ' + m2 + ')';
        sp.f = (x) => x / (x * x + m2); sp.f1 = (x) => (m2 - x * x) / Math.pow(x * x + m2, 2); sp.f2 = (x) => 2 * x * (x * x - 3 * m2) / Math.pow(x * x + m2, 3);
        sp.dom = ['Payda x² + ' + m2 + ' ≥ ' + m2 + ' > 0 her x için; tanım kümesi ℝ.', 'The denominator x² + ' + m2 + ' ≥ ' + m2 + ' > 0 for every x; domain ℝ.'];
        sp.yint = { y: 0, S: '0' }; sp.xints = [pt(0, '0')];
        sp.xnote = ['Pay x = 0 ⇒ tek x-kesişimi x = 0 (orijin).', 'Numerator x = 0 ⇒ the only x-intercept is x = 0 (the origin).'];
        sp.symm = { type: 'odd', tr: 'f(−x) = −x/(x² + ' + m2 + ') = −f(x) ⇒ TEK fonksiyon: orijine göre simetrik.', en: 'f(−x) = −x/(x² + ' + m2 + ') = −f(x) ⇒ ODD function: symmetric about the origin.' };
        sp.has = [0];
        sp.asy = [['Dikey asimptot yok (payda hiç 0 olmaz). Yatay: x → ±∞ iken derece(pay) < derece(payda) ⇒ f → 0. Yatay asimptot y = 0.', 'No vertical asymptote (the denominator is never 0). Horizontal: as x → ±∞ the numerator has lower degree ⇒ f → 0. Horizontal asymptote y = 0.']];
        sp.dS = '(' + m2 + ' − x²)/(x² + ' + m2 + ')²';
        sp.d1Solve = ['Bölüm kuralı: f′ = [1·(x² + ' + m2 + ') − x·2x]/(x² + ' + m2 + ')² = (' + m2 + ' − x²)/(x² + ' + m2 + ')². Pay = 0 ⇒ x = ±' + m + '.', 'Quotient rule: f′ = [1·(x² + ' + m2 + ') − x·2x]/(x² + ' + m2 + ')² = (' + m2 + ' − x²)/(x² + ' + m2 + ')². Numerator = 0 ⇒ x = ±' + m + '.'];
        sp.crit = [{ x: -m, S: String(-m), yS: rat(-1, 2 * m) }, { x: m, S: String(m), yS: rat(1, 2 * m) }];
        sp.b1 = [pt(-m, String(-m)), pt(m, String(m))];
        sp.d2S = '2x(x² − ' + 3 * m2 + ')/(x² + ' + m2 + ')³';
        sp.d2Solve = ['Türev ve sadeleştirme sonrası f″ = 2x(x² − ' + 3 * m2 + ')/(x² + ' + m2 + ')³. Pay = 0 ⇒ x = 0 veya x = ±' + (m === 1 ? '' : m) + '√3.', 'After differentiating and simplifying, f″ = 2x(x² − ' + 3 * m2 + ')/(x² + ' + m2 + ')³. Numerator = 0 ⇒ x = 0 or x = ±' + (m === 1 ? '' : m) + '√3.'];
        const xi = m * Math.sqrt(3), xiS = (m === 1 ? '' : m + '*') + '√(3)', yv = '√(3)/' + 4 * m;
        sp.infl = [{ x: -xi, S: '-' + xiS, yS: '-' + yv }, { x: 0, S: '0', yS: '0' }, { x: xi, S: xiS, yS: yv }];
        sp.b2 = [pt(-xi, '-' + xiS), pt(0, '0'), pt(xi, xiS)];
        sp.view = [-5 * m, 5 * m];
        break;
      }
      case 'twoVA': {
        const m = p.m, m2 = m * m;
        sp.fS = 'x² / (x² − ' + m2 + ')';
        sp.f = (x) => (Math.abs(x * x - m2) < 1e-9 ? NaN : clip(x * x / (x * x - m2)));
        sp.f1 = (x) => -2 * m2 * x / Math.pow(x * x - m2, 2); sp.f2 = (x) => 2 * m2 * (3 * x * x + m2) / Math.pow(x * x - m2, 3);
        sp.dom = ['Payda x² − ' + m2 + ' = (x − ' + m + ')(x + ' + m + ') = 0 ⇒ x = ±' + m + ' yasak. Tanım kümesi: ℝ ∖ {' + M(-m) + ', ' + m + '}.', 'Denominator x² − ' + m2 + ' = (x − ' + m + ')(x + ' + m + ') = 0 ⇒ x = ±' + m + ' are excluded. Domain: ℝ ∖ {' + M(-m) + ', ' + m + '}.'];
        sp.yint = { y: 0, S: '0' }; sp.xints = [pt(0, '0')];
        sp.xnote = ['Pay x² = 0 ⇒ x = 0 (çift kök: grafik x eksenine TEĞET).', 'Numerator x² = 0 ⇒ x = 0 (a double root: the graph TOUCHES the x-axis).'];
        sp.symm = { type: 'even', tr: 'f(−x) = (−x)²/((−x)² − ' + m2 + ') = f(x) ⇒ ÇİFT fonksiyon: y eksenine göre simetrik.', en: 'f(−x) = (−x)²/((−x)² − ' + m2 + ') = f(x) ⇒ EVEN function: symmetric about the y-axis.' };
        sp.vas = [-m, m]; sp.has = [1];
        sp.asy = [
          ['Dikey: x → ' + m + '⁺ iken payda 0⁺, pay ' + m2 + ' > 0 ⇒ f → +∞; x → ' + m + '⁻ iken payda 0⁻ ⇒ f → −∞. Çift simetri ile x = ' + M(-m) + ' için de: x → ' + M(-m) + '⁻ iken +∞, x → ' + M(-m) + '⁺ iken −∞. Dikey asimptotlar x = ±' + m + '.',
            'Vertical: as x → ' + m + '⁺ the denominator is 0⁺ and the numerator ' + m2 + ' > 0 ⇒ f → +∞; as x → ' + m + '⁻ the denominator is 0⁻ ⇒ f → −∞. By evenness at x = ' + M(-m) + ': +∞ as x → ' + M(-m) + '⁻ and −∞ as x → ' + M(-m) + '⁺. Vertical asymptotes x = ±' + m + '.'],
          ['Yatay: x → ±∞ iken f = 1/(1 − ' + m2 + '/x²) → 1. Yatay asimptot y = 1.', 'Horizontal: as x → ±∞, f = 1/(1 − ' + m2 + '/x²) → 1. Horizontal asymptote y = 1.'],
        ];
        sp.dS = M(-2 * m2) + 'x/(x² − ' + m2 + ')²';
        sp.d1Solve = ['Bölüm kuralı: f′ = [2x(x² − ' + m2 + ') − x²·2x]/(x² − ' + m2 + ')² = ' + M(-2 * m2) + 'x/(x² − ' + m2 + ')². Pay = 0 ⇒ x = 0 (±' + m + ' tanım dışı).', 'Quotient rule: f′ = [2x(x² − ' + m2 + ') − x²·2x]/(x² − ' + m2 + ')² = ' + M(-2 * m2) + 'x/(x² − ' + m2 + ')². Numerator = 0 ⇒ x = 0 (±' + m + ' are outside the domain).'];
        sp.crit = [{ x: 0, S: '0', yS: '0' }];
        sp.b1 = [pt(-m, String(-m)), pt(0, '0'), pt(m, String(m))];
        sp.d2S = M(2 * m2) + '(3x² + ' + m2 + ')/(x² − ' + m2 + ')³';
        sp.d2Solve = ['f″ = 2' + (m2 === 1 ? '' : m2) + '(3x² + ' + m2 + ')/(x² − ' + m2 + ')³. Pay 3x² + ' + m2 + ' > 0 her x için ⇒ f″ = 0 olmaz. Büküm noktası YOK; işaret yalnızca x = ±' + m + '\'de (asimptotlarda) değişir.', 'f″ = 2' + (m2 === 1 ? '' : m2) + '(3x² + ' + m2 + ')/(x² − ' + m2 + ')³. The numerator 3x² + ' + m2 + ' > 0 for all x ⇒ f″ is never 0. There are NO inflection points; the sign changes only at x = ±' + m + ' (the asymptotes).'];
        sp.b2 = [pt(-m, String(-m)), pt(m, String(m))];
        sp.view = [-3 * m, 3 * m, -4, 5];
        break;
      }
      case 'slant': {
        const c = p.c, q = p.q, k = p.k, k2 = k * k;
        const num = poly([[1, 'x²'], [q - c, 'x'], [k2 - c * q, '']]);
        sp.fS = '(' + num + ') / ' + (c === 0 ? 'x' : '(x' + pk(-c) + ')');
        sp.f = (x) => (Math.abs(x - c) < 1e-9 ? NaN : clip(x + q + k2 / (x - c)));
        sp.f1 = (x) => 1 - k2 / ((x - c) * (x - c)); sp.f2 = (x) => 2 * k2 / Math.pow(x - c, 3);
        sp.dom = ['Payda ' + (c === 0 ? 'x' : 'x' + pk(-c)) + ' = 0 ⇒ x = ' + M(c) + ' yasak. Tanım kümesi: ℝ ∖ {' + M(c) + '}.', 'Denominator ' + (c === 0 ? 'x' : 'x' + pk(-c)) + ' = 0 ⇒ x = ' + M(c) + ' is excluded. Domain: ℝ ∖ {' + M(c) + '}.'];
        if (c !== 0) sp.yint = { y: q - k2 / c, S: rat(q * c - k2, c) };
        const D = (q + c) * (q + c) - 4 * k2;
        if (D > 0) {
          const sD = Math.sqrt(D), r = Math.round(sD);
          if (r * r === D) sp.xints = [pt((c - q - sD) / 2, rat(c - q - r, 2)), pt((c - q + sD) / 2, rat(c - q + r, 2))];
          else sp.xints = [pt((c - q - sD) / 2, '(' + (c - q) + '-√(' + D + '))/2'), pt((c - q + sD) / 2, '(' + (c - q) + '+√(' + D + '))/2')];
        } else if (D === 0) sp.xints = [pt((c - q) / 2, rat(c - q, 2))];
        const dsc = 'Δ = (' + (q - c) + ')² − 4·(' + (k2 - c * q) + ') = ' + D;
        sp.xnote = ['Pay = 0: ' + num + ' = 0, ' + M(dsc) + (D > 0 ? ' > 0 ⇒ iki kök.' : D === 0 ? ' ⇒ bir (çift) kök.' : ' < 0 ⇒ gerçek kök YOK (x eksenini kesmez).'),
          'Numerator = 0: ' + num + ' = 0, ' + M(dsc) + (D > 0 ? ' > 0 ⇒ two roots.' : D === 0 ? ' ⇒ one (double) root.' : ' < 0 ⇒ NO real root (the graph never meets the x-axis).')];
        sp.symm = { type: 'none', tr: 'f(−x) ne f(x) ne de −f(x) ⇒ ne çift ne tek. (f(x) = x ' + pk(q) + ' + ' + k2 + '/(x' + pk(-c) + ') olduğundan (' + M(c) + ', ' + M(c + q) + ') noktasına göre nokta simetrisi vardır.)',
          en: 'f(−x) equals neither f(x) nor −f(x) ⇒ neither even nor odd. (Since f(x) = x ' + pk(q) + ' + ' + k2 + '/(x' + pk(-c) + ') it is point-symmetric about (' + M(c) + ', ' + M(c + q) + ').)' };
        sp.vas = [c]; sp.slant = { m: 1, b: q };
        sp.asy = [
          ['Dikey: x → ' + M(c) + '⁺ iken f → +∞, x → ' + M(c) + '⁻ iken f → −∞ (' + k2 + '/(x' + pk(-c) + ') terimi). Dikey asimptot x = ' + M(c) + '.', 'Vertical: as x → ' + M(c) + '⁺, f → +∞ and as x → ' + M(c) + '⁻, f → −∞ (the term ' + k2 + '/(x' + pk(-c) + ')). Vertical asymptote x = ' + M(c) + '.'],
          ['Eğik: pay derecesi (2) = payda derecesi (1) + 1. Bölme: f(x) = x ' + pk(q) + ' + ' + k2 + '/(x' + pk(-c) + '); son terim x → ±∞ iken 0\'a gider ⇒ eğik asimptot y = x' + pk(q) + '. Yatay asimptot yok.', 'Slant: numerator degree (2) = denominator degree (1) + 1. Division gives f(x) = x ' + pk(q) + ' + ' + k2 + '/(x' + pk(-c) + '); the last term tends to 0 as x → ±∞ ⇒ slant asymptote y = x' + pk(q) + '. There is no horizontal asymptote.'],
        ];
        sp.dS = '1 − ' + k2 + '/(x' + pk(-c) + ')²';
        sp.d1Solve = ['f′ = 1 − ' + k2 + '/(x' + pk(-c) + ')² = 0 ⇒ (x' + pk(-c) + ')² = ' + k2 + ' ⇒ x' + pk(-c) + ' = ±' + k + ' ⇒ x = ' + M(c - k) + ' ve x = ' + M(c + k) + '.', 'f′ = 1 − ' + k2 + '/(x' + pk(-c) + ')² = 0 ⇒ (x' + pk(-c) + ')² = ' + k2 + ' ⇒ x' + pk(-c) + ' = ±' + k + ' ⇒ x = ' + M(c - k) + ' and x = ' + M(c + k) + '.'];
        sp.crit = [{ x: c - k, S: String(c - k), yS: String(c + q - 2 * k) }, { x: c + k, S: String(c + k), yS: String(c + q + 2 * k) }];
        sp.b1 = [pt(c - k, String(c - k)), pt(c, String(c)), pt(c + k, String(c + k))];
        sp.d2S = M(2 * k2) + '/(x' + pk(-c) + ')³';
        sp.d2Solve = ['Pay sabit (' + 2 * k2 + ' ≠ 0) ⇒ f″ = 0 olmaz: büküm noktası YOK. İşaret yalnızca x = ' + M(c) + '\'de (asimptotta) değişir.', 'The numerator is the non-zero constant ' + 2 * k2 + ' ⇒ f″ is never 0: NO inflection points. The sign changes only at x = ' + M(c) + ' (the asymptote).'];
        sp.b2 = [pt(c, String(c))];
        sp.view = [c - k - 5, c + k + 5];
        break;
      }
      case 'xexp': {
        const k = p.k;
        sp.fS = 'x·e^(−' + (k === 1 ? '' : k) + 'x)';
        sp.f = (x) => clip(x * Math.exp(-k * x)); sp.f1 = (x) => (1 - k * x) * Math.exp(-k * x); sp.f2 = (x) => k * (k * x - 2) * Math.exp(-k * x);
        sp.dom = ['Tanım kümesi: x ve e^(−kx) her yerde tanımlı ⇒ ℝ.', 'Domain: x and e^(−kx) are defined everywhere ⇒ ℝ.'];
        sp.yint = { y: 0, S: '0' }; sp.xints = [pt(0, '0')];
        sp.xnote = ['x·e^(−kx) = 0 ⇒ x = 0 (üstel çarpan hiçbir zaman 0 olmaz).', 'x·e^(−kx) = 0 ⇒ x = 0 (the exponential factor is never 0).'];
        sp.symm = { type: 'none', tr: 'f(−x) = −x·e^(' + (k === 1 ? '' : k) + 'x) ne f(x) ne de −f(x) ⇒ ne çift ne tek.', en: 'f(−x) = −x·e^(' + (k === 1 ? '' : k) + 'x) equals neither f(x) nor −f(x) ⇒ neither even nor odd.' };
        sp.has = [0];
        sp.asy = [['Dikey asimptot yok (sürekli). x → +∞: x·e^(−kx) = x/e^(kx) → 0 (L\'Hôpital ya da üstel hızı) ⇒ yatay asimptot y = 0 (sağda). x → −∞: x → −∞ ve e^(−kx) → +∞ ⇒ f → −∞ (soldaki ucta asimptot yok).',
          'No vertical asymptote (continuous). As x → +∞: x·e^(−kx) = x/e^(kx) → 0 (L\'Hôpital or exponential growth) ⇒ horizontal asymptote y = 0 on the right. As x → −∞: x → −∞ and e^(−kx) → +∞ ⇒ f → −∞ (no asymptote at the left end).']];
        sp.dS = '(1 − ' + (k === 1 ? '' : k) + 'x)e^(−' + (k === 1 ? '' : k) + 'x)';
        sp.d1Solve = ['Çarpım kuralı: f′ = e^(−kx) + x·(−k)e^(−kx) = (1 − ' + (k === 1 ? '' : k) + 'x)e^(−' + (k === 1 ? '' : k) + 'x). e^(−kx) > 0 olduğundan f′ = 0 ⇒ 1 − ' + (k === 1 ? '' : k) + 'x = 0 ⇒ x = ' + rat(1, k) + '.', 'Product rule: f′ = e^(−kx) + x·(−k)e^(−kx) = (1 − ' + (k === 1 ? '' : k) + 'x)e^(−' + (k === 1 ? '' : k) + 'x). Since e^(−kx) > 0, f′ = 0 ⇒ 1 − ' + (k === 1 ? '' : k) + 'x = 0 ⇒ x = ' + rat(1, k) + '.'];
        sp.crit = [{ x: 1 / k, S: rat(1, k), yS: '1/(' + (k === 1 ? '' : k + '*') + 'e)' }];
        sp.b1 = [pt(1 / k, rat(1, k))];
        sp.d2S = (k === 1 ? '' : k) + '(' + (k === 1 ? '' : k) + 'x − 2)e^(−' + (k === 1 ? '' : k) + 'x)';
        sp.d2Solve = ['f″ = (−k)e^(−kx) − k(1 − kx)e^(−kx)·... düzenlenince f″ = ' + (k === 1 ? '' : k) + '(' + (k === 1 ? '' : k) + 'x − 2)e^(−' + (k === 1 ? '' : k) + 'x). f″ = 0 ⇒ ' + (k === 1 ? '' : k) + 'x − 2 = 0 ⇒ x = ' + rat(2, k) + '.', 'Differentiating f′ again gives f″ = ' + (k === 1 ? '' : k) + '(' + (k === 1 ? '' : k) + 'x − 2)e^(−' + (k === 1 ? '' : k) + 'x). f″ = 0 ⇒ ' + (k === 1 ? '' : k) + 'x − 2 = 0 ⇒ x = ' + rat(2, k) + '.'];
        sp.d2Solve[0] = 'f′ = (1 − ' + (k === 1 ? '' : k) + 'x)e^(−' + (k === 1 ? '' : k) + 'x) türetilince f″ = ' + (k === 1 ? '' : k) + '(' + (k === 1 ? '' : k) + 'x − 2)e^(−' + (k === 1 ? '' : k) + 'x). f″ = 0 ⇒ ' + (k === 1 ? '' : k) + 'x − 2 = 0 ⇒ x = ' + rat(2, k) + '.';
        sp.infl = [{ x: 2 / k, S: rat(2, k), yS: '2/(' + (k === 1 ? '' : k + '*') + 'e^(2))' }]; sp.b2 = [pt(2 / k, rat(2, k))];
        sp.view = [-1.2 / k, 6 / k];
        break;
      }
      case 'xlnx': {
        const n = p.n, nS = n === 1 ? '' : '²';
        sp.fS = 'x' + nS + ' ln x';
        sp.f = (x) => (x > 0 ? clip(Math.pow(x, n) * Math.log(x)) : NaN);
        sp.f1 = (x) => (x > 0 ? Math.pow(x, n - 1) * (n * Math.log(x) + 1) : NaN);
        sp.f2 = (x) => (x > 0 ? Math.pow(x, n - 2) * (n * (n - 1) * Math.log(x) + 2 * n - 1) : NaN);
        sp.lo = 0; sp.dom = ['ln x yalnızca x > 0 için tanımlı ⇒ tanım kümesi (0, ∞).', 'ln x is defined only for x > 0 ⇒ domain (0, ∞).'];
        sp.xints = [pt(1, '1')];
        sp.xnote = ['x' + nS + ' ln x = 0 ⇒ (x > 0 olduğundan) ln x = 0 ⇒ x = 1. y-kesişimi YOK (x = 0 tanım dışı).', 'x' + nS + ' ln x = 0 ⇒ (since x > 0) ln x = 0 ⇒ x = 1. There is NO y-intercept (x = 0 is outside the domain).'];
        sp.symm = { type: 'none', tr: 'Tanım kümesi (0, ∞) 0 etrafında simetrik değil ⇒ çift/tek sorusu anlamsız; simetri YOK.', en: 'The domain (0, ∞) is not symmetric about 0 ⇒ the even/odd question does not apply; NO symmetry.' };
        sp.ends = [{ x: 0, S: '0', yS: '0', open: true }];
        sp.asy = [['Dikey asimptot yok: x → 0⁺ iken x' + nS + ' ln x → 0 (0·(−∞) belirsizliği, L\'Hôpital ile 0), yani eğri başlangıç noktasına (0,0) ULAŞMADAN (açık uç) yaklaşır. x → ∞ iken f → +∞ (asimptot yok).',
          'No vertical asymptote: as x → 0⁺, x' + nS + ' ln x → 0 (a 0·(−∞) indeterminacy, 0 by L\'Hôpital), so the curve approaches the origin (0,0) WITHOUT reaching it (open end). As x → ∞, f → +∞ (no asymptote).']];
        sp.dS = n === 1 ? 'ln x + 1' : 'x(2 ln x + 1)';
        sp.d1Solve = n === 1 ? ['f′ = 1·ln x + x·(1/x) = ln x + 1 = 0 ⇒ ln x = −1 ⇒ x = 1/e.', 'f′ = 1·ln x + x·(1/x) = ln x + 1 = 0 ⇒ ln x = −1 ⇒ x = 1/e.']
          : ['f′ = 2x ln x + x²·(1/x) = x(2 ln x + 1). x > 0 olduğundan f′ = 0 ⇒ 2 ln x + 1 = 0 ⇒ ln x = −1/2 ⇒ x = e^(−1/2).', 'f′ = 2x ln x + x²·(1/x) = x(2 ln x + 1). Since x > 0, f′ = 0 ⇒ 2 ln x + 1 = 0 ⇒ ln x = −1/2 ⇒ x = e^(−1/2).'];
        sp.crit = n === 1 ? [{ x: Math.exp(-1), S: '1/e', yS: '-1/e' }] : [{ x: Math.exp(-0.5), S: 'e^(-1/2)', yS: '-1/(2*e)' }];
        sp.b1 = [pt(sp.crit[0].x, sp.crit[0].S)];
        sp.d2S = n === 1 ? '1/x' : '2 ln x + 3';
        sp.d2Solve = n === 1 ? ['f″ = 1/x > 0 (x > 0). f″ hiçbir yerde 0 olmaz ⇒ büküm noktası YOK; eğri her yerde yukarı bükey.', 'f″ = 1/x > 0 (x > 0). f″ is never 0 ⇒ NO inflection points; the curve is concave up everywhere.']
          : ['f″ = 2 ln x + x·(2/x) + ... = 2 ln x + 3 (f′ = 2x ln x + x türetilince). f″ = 0 ⇒ ln x = −3/2 ⇒ x = e^(−3/2).', 'Differentiating f′ = 2x ln x + x gives f″ = 2 ln x + 2 + 1 = 2 ln x + 3. f″ = 0 ⇒ ln x = −3/2 ⇒ x = e^(−3/2).'];
        if (n === 2) sp.d2Solve[0] = 'f′ = 2x ln x + x türetilince f″ = 2 ln x + 2 + 1 = 2 ln x + 3. f″ = 0 ⇒ ln x = −3/2 ⇒ x = e^(−3/2).';
        if (n === 2) { sp.infl = [{ x: Math.exp(-1.5), S: 'e^(-3/2)', yS: '-3/(2*e^(3))' }]; sp.b2 = [pt(Math.exp(-1.5), 'e^(-3/2)')]; }
        sp.view = [-0.3, 3.2];
        break;
      }
      case 'lnOverX': {
        const n = p.n, nS = n === 1 ? '' : '²';
        sp.fS = 'ln x / x' + nS;
        sp.f = (x) => (x > 0 ? clip(Math.log(x) / Math.pow(x, n)) : NaN);
        sp.f1 = (x) => (x > 0 ? Math.pow(x, -n - 1) * (1 - n * Math.log(x)) : NaN);
        sp.f2 = (x) => (x > 0 ? Math.pow(x, -n - 2) * (n * (n + 1) * Math.log(x) - (2 * n + 1)) : NaN);
        sp.lo = 0; sp.dom = ['ln x için x > 0 ve payda x' + nS + ' ≠ 0 ⇒ tanım kümesi (0, ∞).', 'ln x needs x > 0 and the denominator x' + nS + ' ≠ 0 ⇒ domain (0, ∞).'];
        sp.xints = [pt(1, '1')];
        sp.xnote = ['ln x / x' + nS + ' = 0 ⇒ ln x = 0 ⇒ x = 1. y-kesişimi YOK (x = 0 tanım dışı).', 'ln x / x' + nS + ' = 0 ⇒ ln x = 0 ⇒ x = 1. There is NO y-intercept (x = 0 is outside the domain).'];
        sp.symm = { type: 'none', tr: 'Tanım kümesi (0, ∞) simetrik değil ⇒ simetri YOK.', en: 'The domain (0, ∞) is not symmetric ⇒ NO symmetry.' };
        sp.vas = [0]; sp.has = [0];
        sp.asy = [
          ['Dikey: x → 0⁺ iken ln x → −∞ ve x' + nS + ' → 0⁺ ⇒ f → −∞. Dikey asimptot x = 0 (y ekseni).', 'Vertical: as x → 0⁺, ln x → −∞ and x' + nS + ' → 0⁺ ⇒ f → −∞. Vertical asymptote x = 0 (the y-axis).'],
          ['Yatay: x → ∞ iken ∞/∞ biçimi; L\'Hôpital: (1/x)/(' + (n === 1 ? '1' : '2x') + ') = ' + (n === 1 ? '1/x' : '1/(2x²)') + ' → 0 ⇒ yatay asimptot y = 0 (eğri x ekseninin ÜSTÜNDEN yaklaşır, x > 1 için ln x > 0).', 'Horizontal: as x → ∞ the form is ∞/∞; L\'Hôpital: (1/x)/(' + (n === 1 ? '1' : '2x') + ') = ' + (n === 1 ? '1/x' : '1/(2x²)') + ' → 0 ⇒ horizontal asymptote y = 0 (the curve approaches from ABOVE the x-axis since ln x > 0 for x > 1).'],
        ];
        sp.dS = '(1 − ' + (n === 1 ? '' : '2 ') + 'ln x)/x' + (n === 1 ? '²' : '³');
        sp.d1Solve = n === 1 ? ['Bölüm kuralı: f′ = [(1/x)·x − ln x·1]/x² = (1 − ln x)/x². f′ = 0 ⇒ ln x = 1 ⇒ x = e.', 'Quotient rule: f′ = [(1/x)·x − ln x·1]/x² = (1 − ln x)/x². f′ = 0 ⇒ ln x = 1 ⇒ x = e.']
          : ['Bölüm kuralı: f′ = [(1/x)·x² − ln x·2x]/x⁴ = (1 − 2 ln x)/x³. f′ = 0 ⇒ ln x = 1/2 ⇒ x = e^(1/2).', 'Quotient rule: f′ = [(1/x)·x² − ln x·2x]/x⁴ = (1 − 2 ln x)/x³. f′ = 0 ⇒ ln x = 1/2 ⇒ x = e^(1/2).'];
        sp.crit = n === 1 ? [{ x: Math.E, S: 'e', yS: '1/e' }] : [{ x: Math.exp(0.5), S: 'e^(1/2)', yS: '1/(2*e)' }];
        sp.b1 = [pt(sp.crit[0].x, sp.crit[0].S)];
        sp.d2S = n === 1 ? '(2 ln x − 3)/x³' : '(6 ln x − 5)/x⁴';
        sp.d2Solve = n === 1 ? ['f′ = (1 − ln x)x⁻² türetilince f″ = (2 ln x − 3)/x³. f″ = 0 ⇒ ln x = 3/2 ⇒ x = e^(3/2).', 'Differentiating f′ = (1 − ln x)x⁻² gives f″ = (2 ln x − 3)/x³. f″ = 0 ⇒ ln x = 3/2 ⇒ x = e^(3/2).']
          : ['f′ = (1 − 2 ln x)x⁻³ türetilince f″ = (6 ln x − 5)/x⁴. f″ = 0 ⇒ ln x = 5/6 ⇒ x = e^(5/6).', 'Differentiating f′ = (1 − 2 ln x)x⁻³ gives f″ = (6 ln x − 5)/x⁴. f″ = 0 ⇒ ln x = 5/6 ⇒ x = e^(5/6).'];
        sp.infl = n === 1 ? [{ x: Math.exp(1.5), S: 'e^(3/2)', yS: '3/(2*e^(3/2))' }] : [{ x: Math.exp(5 / 6), S: 'e^(5/6)', yS: '5/6*e^(-5/3)' }];
        sp.b2 = [pt(sp.infl[0].x, sp.infl[0].S)];
        sp.view = n === 1 ? [-0.6, 12, -3.5, 1.2] : [-0.3, 7, -3.5, 1.2];
        break;
      }
      case 'xsin': {
        const PI = Math.PI;
        sp.fS = 'x − 2 sin x,  0 ≤ x ≤ 2π';
        sp.f = (x) => (x >= -1e-12 && x <= 2 * PI + 1e-12 ? x - 2 * Math.sin(x) : NaN);
        sp.f1 = (x) => 1 - 2 * Math.cos(x); sp.f2 = (x) => 2 * Math.sin(x);
        sp.lo = 0; sp.hi = 2 * PI; sp.loClosed = true; sp.hiClosed = true;
        sp.dom = ['Verilen kapalı aralık: tanım kümesi [0, 2π].', 'Given closed interval: domain [0, 2π].'];
        sp.yint = { y: 0, S: '0' };
        let lo = 1, hi = 2.5; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if ((mid - 2 * Math.sin(mid)) * (lo - 2 * Math.sin(lo)) <= 0) hi = mid; else lo = mid; }
        const r2 = (lo + hi) / 2;
        sp.xints = [pt(0, '0'), pt(r2, nf(r2, 4))];
        sp.xnote = ['x = 2 sin x: x = 0 bir köktür. Başka kök: g(x) = x − 2 sin x için g(1) = ' + nf(1 - 2 * Math.sin(1), 3) + ' < 0 < g(2) = ' + nf(2 - 2 * Math.sin(2), 3) + ' (ara değer teoremi) ⇒ [1, 2] aralığında bir kök; sayısal olarak (ikiye bölme) x ≈ ' + nf(r2, 4) + '. (Bu kök cebirle bulunamaz, yaklaşıktır.)',
          'x = 2 sin x: x = 0 is a root. Another root: for g(x) = x − 2 sin x, g(1) = ' + nf(1 - 2 * Math.sin(1), 3) + ' < 0 < g(2) = ' + nf(2 - 2 * Math.sin(2), 3) + ' (intermediate value theorem) ⇒ a root in [1, 2]; numerically (bisection) x ≈ ' + nf(r2, 4) + '. (This root cannot be found by algebra; it is approximate.)'];
        sp.symm = { type: 'none', tr: 'Aralık [0, 2π] 0 etrafında simetrik değil ⇒ çift/tek değil. Yine de f(2π − x) = 2π − f(x) olduğundan (π, π) noktasına göre nokta simetrisi vardır.', en: 'The interval [0, 2π] is not symmetric about 0 ⇒ not even/odd. However f(2π − x) = 2π − f(x), so the graph is point-symmetric about (π, π).' };
        sp.ends = [{ x: 0, S: '0', yS: '0', open: false }, { x: 2 * PI, S: '2*π', yS: '2*π', open: false }];
        sp.asy = [['f sürekli ve aralık sınırlı ⇒ asimptot yok. Uç noktalar: f(0) = 0, f(2π) = 2π ≈ ' + nf(2 * PI, 3) + '.', 'f is continuous on a bounded interval ⇒ no asymptotes. Endpoints: f(0) = 0, f(2π) = 2π ≈ ' + nf(2 * PI, 3) + '.']];
        sp.dS = '1 − 2 cos x';
        sp.d1Solve = ['f′ = 1 − 2 cos x = 0 ⇒ cos x = 1/2 ⇒ [0, 2π] içinde x = π/3 ve x = 5π/3.', 'f′ = 1 − 2 cos x = 0 ⇒ cos x = 1/2 ⇒ in [0, 2π]: x = π/3 and x = 5π/3.'];
        sp.crit = [{ x: PI / 3, S: 'π/3', yS: 'π/3 - √(3)' }, { x: 5 * PI / 3, S: '5*π/3', yS: '5*π/3 + √(3)' }];
        sp.b1 = [pt(PI / 3, 'π/3'), pt(5 * PI / 3, '5π/3')];
        sp.d2S = '2 sin x';
        sp.d2Solve = ['f″ = 2 sin x = 0 ⇒ [0, 2π] içinde x = π (uçlar 0 ve 2π de sıfırdır ama uç noktadır).', 'f″ = 2 sin x = 0 ⇒ in [0, 2π]: x = π (0 and 2π also give 0 but they are endpoints).'];
        sp.infl = [{ x: PI, S: 'π', yS: 'π' }]; sp.b2 = [pt(PI, 'π')];
        sp.view = [-0.6, 6.9, -1.8, 8];
        break;
      }
      default: { // xsqrt
        const t = p.t, m = 3 * t * t;
        sp.fS = 'x·√(' + m + ' − x)';
        sp.f = (x) => (x <= m + 1e-12 ? clip(x * Math.sqrt(Math.max(0, m - x))) : NaN);
        sp.f1 = (x) => (x < m ? (2 * m - 3 * x) / (2 * Math.sqrt(m - x)) : NaN); sp.f2 = (x) => (x < m ? (3 * x - 4 * m) / (4 * Math.pow(m - x, 1.5)) : NaN);
        sp.hi = m; sp.hiClosed = true;
        sp.dom = ['Kök içi ≥ 0: ' + m + ' − x ≥ 0 ⇒ x ≤ ' + m + '. Tanım kümesi: (−∞, ' + m + '].', 'Radicand ≥ 0: ' + m + ' − x ≥ 0 ⇒ x ≤ ' + m + '. Domain: (−∞, ' + m + '].'];
        sp.yint = { y: 0, S: '0' }; sp.xints = [pt(0, '0'), pt(m, String(m))];
        sp.xnote = ['x·√(' + m + ' − x) = 0 ⇒ x = 0 veya ' + m + ' − x = 0 ⇒ x = ' + m + ' (tanım kümesinin sağ ucu).', 'x·√(' + m + ' − x) = 0 ⇒ x = 0 or ' + m + ' − x = 0 ⇒ x = ' + m + ' (the right end of the domain).'];
        sp.symm = { type: 'none', tr: 'Tanım kümesi (−∞, ' + m + '] simetrik değil ⇒ simetri YOK.', en: 'The domain (−∞, ' + m + '] is not symmetric ⇒ NO symmetry.' };
        sp.ends = [{ x: m, S: String(m), yS: '0', open: false }];
        sp.asy = [['Asimptot yok: eğri x = ' + m + ' noktasında biter. x → −∞ iken x → −∞ ve √(' + m + ' − x) → +∞ ⇒ f → −∞ (çarpım sınırsız büyür, bir doğruya yaklaşmaz).', 'No asymptotes: the curve ends at x = ' + m + '. As x → −∞, x → −∞ and √(' + m + ' − x) → +∞ ⇒ f → −∞ (the product grows without bound and follows no line).']];
        sp.dS = '(' + 2 * m + ' − 3x)/(2√(' + m + ' − x))';
        sp.d1Solve = ['Çarpım ve zincir kuralı: f′ = √(' + m + ' − x) − x/(2√(' + m + ' − x)) = (' + 2 * m + ' − 3x)/(2√(' + m + ' − x)). Pay = 0 ⇒ x = ' + rat(2 * m, 3) + '. (x = ' + m + '\'de f′ tanımsız: dikey teğet, uç nokta.)', 'Product and chain rule: f′ = √(' + m + ' − x) − x/(2√(' + m + ' − x)) = (' + 2 * m + ' − 3x)/(2√(' + m + ' − x)). Numerator = 0 ⇒ x = ' + rat(2 * m, 3) + '. (At x = ' + m + ' f′ does not exist: vertical tangent at the endpoint.)'];
        sp.crit = [{ x: 2 * m / 3, S: rat(2 * m, 3), yS: String(2 * t * t * t) }];
        sp.b1 = [pt(2 * m / 3, rat(2 * m, 3))];
        sp.d2S = '(3x − ' + 4 * m + ')/(4(' + m + ' − x)^(3/2))';
        sp.d2Solve = ['Türeve devam: f″ = (3x − ' + 4 * m + ')/(4(' + m + ' − x)^(3/2)). Pay = 0 ⇒ x = ' + rat(4 * m, 3) + ' > ' + m + ' tanım kümesinin DIŞINDA ⇒ büküm noktası YOK. Tanım kümesinde x < ' + m + ' < ' + rat(4 * m, 3) + ' ⇒ f″ < 0: eğri her yerde aşağı bükey.', 'Differentiating again: f″ = (3x − ' + 4 * m + ')/(4(' + m + ' − x)^(3/2)). Numerator = 0 ⇒ x = ' + rat(4 * m, 3) + ' > ' + m + ' lies OUTSIDE the domain ⇒ NO inflection point. In the domain x < ' + m + ' < ' + rat(4 * m, 3) + ' ⇒ f″ < 0: the curve is concave down everywhere.'];
        sp.view = [-m - 1, m + 1.2];
        break;
      }
    }
    return sp;
  }

  // ---------- sign tables ----------
  function intervals(sp, bps, fn) {
    const pts = bps.slice().sort((a, b) => a.x - b.x);
    const edges = [{ x: sp.lo, S: sp.lo === -INF ? '−∞' : P(String(sp.lo)), closed: sp.loClosed }].concat(pts.map((q) => ({ x: q.x, S: P(q.S), closed: false })), [{ x: sp.hi, S: sp.hi === INF ? '+∞' : (sp.hi === 2 * Math.PI ? '2π' : P(String(sp.hi))), closed: sp.hiClosed }]);
    const out = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i], b = edges[i + 1];
      let tx;
      if (isFinite(a.x) && isFinite(b.x)) tx = (a.x + b.x) / 2; else if (!isFinite(a.x) && isFinite(b.x)) tx = b.x - 1; else if (isFinite(a.x)) tx = a.x + 1; else tx = 0;
      const v = fn(tx);
      const sgn = !isFinite(v) ? '?' : (v > 1e-12 ? '+' : (v < -1e-12 ? '−' : '0'));
      out.push({ a, b, sign: sgn, label: (a.closed ? '[' : '(') + a.S + ', ' + b.S + (b.closed ? ']' : ')') });
    }
    return out;
  }

  // ---------- statement ----------
  function problemStatement(p) {
    const sp = spec(p);
    return Tx('f(x) = ' + sp.fS + ' fonksiyonunun grafiğini kontrol listesiyle çizin: tanım kümesi, eksenlerle kesişimler, simetri, asimptotlar, f′ ile artan/azalan aralıklar ve yerel ekstremumlar, f″ ile bükeylik ve büküm noktaları. İşaret tablolarını yazıp grafiği çizin.',
      'Sketch the graph of f(x) = ' + sp.fS + ' using the checklist: domain, intercepts, symmetry, asymptotes, f′ for increasing/decreasing intervals and local extrema, f″ for concavity and inflection points. Write the sign charts and draw the graph.');
  }

  // ---------- steps ----------
  function solveSteps(p) {
    const sp = spec(p), st = [];
    let n = 0;
    const H = (tr, en) => st.push(Hdr(++n, Tx(tr, en)));
    const T = (tr, en) => st.push(Tx(tr, en));
    const TP = (pair) => st.push(Tx(pair[0], pair[1]));

    H('Tanım kümesi', 'Domain');
    TP(sp.dom);

    H('Eksenlerle kesişimler', 'Intercepts');
    if (sp.yint) T('y-kesişimi: f(0) = ' + ex(sp.yint.S, sp.yint.y) + ' ⇒ (0, ' + ex(sp.yint.S, sp.yint.y) + ').', 'y-intercept: f(0) = ' + ex(sp.yint.S, sp.yint.y) + ' ⇒ (0, ' + ex(sp.yint.S, sp.yint.y) + ').');
    else T('y-kesişimi: x = 0 tanım kümesinde olmadığından y eksenini KESMEZ.', 'y-intercept: x = 0 is not in the domain, so the graph does NOT meet the y-axis.');
    if (sp.xnote) TP(sp.xnote);
    if (sp.xints.length) T('x-kesişimleri: ' + sp.xints.map((q) => '(' + ex(q.S, q.x) + ', 0)').join(',  ') + '.', 'x-intercepts: ' + sp.xints.map((q) => '(' + ex(q.S, q.x) + ', 0)').join(',  ') + '.');
    else T('x-kesişimi YOK.', 'There are NO x-intercepts.');

    H('Simetri', 'Symmetry');
    T(sp.symm.tr, sp.symm.en);

    H('Asimptotlar ve uç davranışı', 'Asymptotes and end behaviour');
    sp.asy.forEach(TP);

    H('Birinci türev: artan/azalan aralıklar, yerel ekstremumlar', 'First derivative: monotonicity and local extrema');
    T('f′(x) = ' + P(sp.dS) + '.', 'f′(x) = ' + P(sp.dS) + '.');
    TP(sp.d1Solve);
    const t1 = intervals(sp, sp.b1, sp.f1);
    if (t1.length) {
      T('f′ işaret tablosu (sınır noktaları: ' + (sp.b1.map((q) => P(q.S)).join(', ') || '—') + '):  ' + t1.map((r) => r.label + ': f′ ' + (r.sign === '+' ? '> 0 ↗ artan' : r.sign === '−' ? '< 0 ↘ azalan' : '= 0')).join('   |   ') + '.',
        'Sign chart of f′ (boundaries: ' + (sp.b1.map((q) => P(q.S)).join(', ') || '—') + '):  ' + t1.map((r) => r.label + ': f′ ' + (r.sign === '+' ? '> 0 ↗ increasing' : r.sign === '−' ? '< 0 ↘ decreasing' : '= 0')).join('   |   ') + '.');
    }
    if (sp.crit.length) {
      sp.crit.forEach((c) => {
        const i = sp.b1.findIndex((q) => Math.abs(q.x - c.x) < 1e-9);
        const sl = t1[i].sign, sr = t1[i + 1].sign;
        const yv = evalExact(c.yS);
        const yTxt = ex(c.yS, yv);
        if (sl === '+' && sr === '−') T('x = ' + P(sp.b1[i].S) + ': f′ + → − ⇒ YEREL MAKSİMUM, f(' + P(sp.b1[i].S) + ') = ' + yTxt + '.', 'x = ' + P(sp.b1[i].S) + ': f′ + → − ⇒ LOCAL MAXIMUM, f(' + P(sp.b1[i].S) + ') = ' + yTxt + '.');
        else if (sl === '−' && sr === '+') T('x = ' + P(sp.b1[i].S) + ': f′ − → + ⇒ YEREL MİNİMUM, f(' + P(sp.b1[i].S) + ') = ' + yTxt + '.', 'x = ' + P(sp.b1[i].S) + ': f′ − → + ⇒ LOCAL MINIMUM, f(' + P(sp.b1[i].S) + ') = ' + yTxt + '.');
        else T('x = ' + P(sp.b1[i].S) + ': f′ işaret değiştirmiyor ⇒ ekstremum DEĞİL.', 'x = ' + P(sp.b1[i].S) + ': f′ does not change sign ⇒ NOT an extremum.');
      });
    } else T('Kritik nokta olmadığından yerel ekstremum YOK; fonksiyon tanım aralıklarının her birinde monotondur.', 'With no critical points there are NO local extrema; the function is monotonic on each interval of its domain.');
    if (sp.ends.length) T('Uç noktalar: ' + sp.ends.map((e) => '(' + P(e.S) + ', ' + ex(e.yS, evalExact(e.yS)) + ')' + (e.open ? ' (açık uç)' : '')).join(', ') + '.', 'Endpoints: ' + sp.ends.map((e) => '(' + P(e.S) + ', ' + ex(e.yS, evalExact(e.yS)) + ')' + (e.open ? ' (open end)' : '')).join(', ') + '.');

    H('İkinci türev: bükeylik ve büküm noktaları', 'Second derivative: concavity and inflection points');
    T('f″(x) = ' + P(sp.d2S) + '.', 'f″(x) = ' + P(sp.d2S) + '.');
    TP(sp.d2Solve);
    const t2 = intervals(sp, sp.b2, sp.f2);
    T('f″ işaret tablosu (sınır noktaları: ' + (sp.b2.map((q) => P(q.S)).join(', ') || '—') + '):  ' + t2.map((r) => r.label + ': f″ ' + (r.sign === '+' ? '> 0 ∪ yukarı bükey' : r.sign === '−' ? '< 0 ∩ aşağı bükey' : '= 0')).join('   |   ') + '.',
      'Sign chart of f″ (boundaries: ' + (sp.b2.map((q) => P(q.S)).join(', ') || '—') + '):  ' + t2.map((r) => r.label + ': f″ ' + (r.sign === '+' ? '> 0 ∪ concave up' : r.sign === '−' ? '< 0 ∩ concave down' : '= 0')).join('   |   ') + '.');
    if (sp.infl.length) {
      sp.infl.forEach((c) => {
        const i = sp.b2.findIndex((q) => Math.abs(q.x - c.x) < 1e-9);
        const sl = t2[i].sign, sr = t2[i + 1].sign, yTxt = ex(c.yS, evalExact(c.yS));
        if (sl !== sr) T('x = ' + P(sp.b2[i].S) + ': f″ ' + sl + ' → ' + sr + ' ⇒ BÜKÜM NOKTASI (' + P(sp.b2[i].S) + ', ' + yTxt + ').', 'x = ' + P(sp.b2[i].S) + ': f″ ' + sl + ' → ' + sr + ' ⇒ INFLECTION POINT (' + P(sp.b2[i].S) + ', ' + yTxt + ').');
        else T('x = ' + P(sp.b2[i].S) + ': f″ işaret değiştirmiyor ⇒ büküm noktası DEĞİL.', 'x = ' + P(sp.b2[i].S) + ': f″ does not change sign ⇒ NOT an inflection point.');
      });
    } else T('Bükeylik tanım kümesinde değişmediği için (ya da yalnızca asimptotta değiştiği için) büküm noktası YOK.', 'Concavity does not change inside the domain (or only at an asymptote), so there are NO inflection points.');

    H('Hepsini birleştir ve çiz', 'Combine everything and sketch');
    const listTR = [], listEN = [];
    const add = (tr, en) => { listTR.push(tr); listEN.push(en); };
    if (sp.yint) add('y-kesişimi (0, ' + ex(sp.yint.S, sp.yint.y) + ')', 'y-intercept (0, ' + ex(sp.yint.S, sp.yint.y) + ')');
    sp.xints.forEach((q) => add('x-kesişimi (' + ex(q.S, q.x) + ', 0)', 'x-intercept (' + ex(q.S, q.x) + ', 0)'));
    sp.crit.forEach((c, i) => { const k = sp.b1.findIndex((q) => Math.abs(q.x - c.x) < 1e-9); const sl = t1[k].sign, sr = t1[k + 1].sign; const nm = sl === '+' && sr === '−' ? ['yerel max', 'local max'] : sl === '−' && sr === '+' ? ['yerel min', 'local min'] : ['düz nokta', 'flat point']; add(nm[0] + ' (' + ex(c.S, c.x) + ', ' + ex(c.yS, evalExact(c.yS)) + ')', nm[1] + ' (' + ex(c.S, c.x) + ', ' + ex(c.yS, evalExact(c.yS)) + ')'); });
    sp.infl.forEach((c) => add('büküm (' + ex(c.S, c.x) + ', ' + ex(c.yS, evalExact(c.yS)) + ')', 'inflection (' + ex(c.S, c.x) + ', ' + ex(c.yS, evalExact(c.yS)) + ')'));
    sp.vas.forEach((v) => add('dikey asimptot x = ' + nf(v, 4), 'vertical asymptote x = ' + nf(v, 4)));
    sp.has.forEach((v) => add('yatay asimptot y = ' + nf(v, 4), 'horizontal asymptote y = ' + nf(v, 4)));
    if (sp.slant) add('eğik asimptot y = x' + pk(sp.slant.b), 'slant asymptote y = x' + pk(sp.slant.b));
    T('Önemli noktalar: ' + listTR.join(';  ') + '.', 'Key points: ' + listEN.join(';  ') + '.');
    T('Çizim: asimptotları kesikli çiz, noktaları işaretle, sonra işaret tablolarına uygun şekilde bağla: artan/azalan ve yukarı/aşağı bükey bölgelerin dört birleşimi (↗∪ hızlanarak yükselir, ↗∩ yavaşlayarak yükselir, ↘∪ yavaşlayarak düşer, ↘∩ hızlanarak düşer). Sonucu kaydırıcıyla adım adım açılan grafikle karşılaştırın.',
      'Drawing: draw the asymptotes dashed, mark the points, then join them consistently with the sign charts, using the four combinations of rising/falling and concave up/down (↗∪ rising faster, ↗∩ rising slower, ↘∪ falling slower, ↘∩ falling faster). Compare with the graph revealed step by step by the slider.');
    return st;
  }

  // evaluate a calculator-syntax exact string (used for numeric parts of the text)
  function evalExact(s) {
    try {
      const js = String(s).replace(/π/g, 'Math.PI').replace(/√\(/g, 'Math.sqrt(').replace(/e\^\(/g, 'Math.exp(').replace(/\be\b/g, 'Math.E').replace(/\^/g, '**');
      const v = Function('"use strict";return (' + js + ')')();
      return isFinite(v) ? v : NaN;
    } catch (e) { return NaN; }
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      'AMAÇ\n' +
      'Bir fonksiyonun grafiğini noktalar yerine türevlerin anlattığı HİKAYEYE bakarak çizmek: nerede artıyor/azalıyor, nasıl büküyor, uçlarda ne yapıyor.\n' +
      '\n' +
      'YÖNTEM (kontrol listesi)\n' +
      '   1. TANIM KÜMESİ: payda ≠ 0, kök içi ≥ 0, ln içi > 0 gibi koşullar. Dikey çizgi çizilecek yasak noktaları not et.\n' +
      '   2. KESİŞİMLER: y-ekseni f(0); x-ekseni f(x) = 0. Simetri: f(−x) = f(x) çift (y eksenine simetrik), f(−x) = −f(x) tek (orijine simetrik); periyot var mı?\n' +
      '   3. ASİMPTOTLAR: Dikey: x = a\'da lim f = ±∞. Yatay: lim(x→±∞) f = L → y = L. Eğik: f(x) = mx + b + (→0) ise y = mx + b (rasyonel fonksiyonda pay derecesi = payda derecesi + 1).\n' +
      '   4. f\' İLE: f\' = 0 veya tanımsız olan KRİTİK noktaları bul; işaret tablosu ile artan/azalan aralıkları ve yerel max/min\'i belirle.\n' +
      '   5. f\'\' İLE: f\'\' = 0 veya tanımsız noktaları bul; işaret tablosu ile yukarı/aşağı bükey aralıkları ve büküm noktalarını belirle.\n' +
      '   6. TÜM BİLGİYİ BİRLEŞTİR: önemli noktaları (kesişim, ekstremum, büküm) işaretle, asimptotları kesikli çiz, eğriyi işaret bilgisine uygun şekilde bağla.\n' +
      '\n' +
      'İŞARET TABLOSU ÖZETİ\n' +
      'f\' + → artan ↗, f\' − → azalan ↘; f\'\' + → ∪, f\'\' − → ∩. Dört birleşim: ↗∪ (hızlanarak yükselir), ↗∩ (yavaşlayarak yükselir), ↘∪ (yavaşlayarak düşer), ↘∩ (hızlanarak düşer).\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '   • f\' işaret değiştirirse ekstremum: + → − yerel MAKS, − → + yerel MİN; işaret değişmezse (ör. x³ için x = 0) ekstremum yok.\n' +
      '   • Çift kökte grafik x eksenine TEĞET olur (işaret değişmez), tek kökte eksenden GEÇER.\n' +
      '   • Tanım aralığı kapalıysa uç noktalar mutlak ekstremum adayıdır; ln ya da kök gibi açık uçlarda limiti kontrol et.\n' +
      '   • Eğik asimptot için polinom bölmesi yap: f = (x² + …)/(x − c) = x + q + K/(x − c).\n' +
      '\n' +
      'TUZAKLAR\n' +
      '   • Kritik nokta ≠ ekstremum; işaret değişimi kontrol edilmeli.\n' +
      '   • Yatay/eğik asimptot sonlu x\'te kesilebilir; dikey asimptot kesilemez.\n' +
      '   • Tanım kümesi dışındaki noktalarla ayrılan aralıklar için ayrı ayrı işaret tablosu gerekir.\n' +
      '   • f\'\'(c) = 0 tek başına büküm noktası değildir; bükeylik gerçekten değişmeli.\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      'f(x) = x/(x²+1): tanım kümesi ℝ, tek fonksiyon, yatay asimptot y = 0. f\' = (1−x²)/(x²+1)² → x = ±1 kritik; (−1,1)\'de artan, dışında azalan: x = −1\'de yerel min (−1/2), x = 1\'de yerel max (1/2). Böylece grafik orijinden geçen ince bir "S" şeklindedir.\n' +
      '\n' +
      'HAFIZA İPUCU: "Önce nerede yaşar (tanım), sonra eksenlere vurduğu yer, sonra uçlarda ne yapar (asimptot), sonra f\' ile eğimin, f\'\' ile eğriliğin hikâyesi."\n' +
      '\n' +
      'KAYDIRICI: "Adım" kaydırıcısı kontrol listesini VB sürümündeki gibi sırayla açar (0: tanım, 1: kesişimler, 2: simetri, 3: monotonluk, 4: bükeylik, 5: asimptotlar, 6: tam eğri). Eğriyi görmeden önce tahmininizi yapın.',
      'GOAL\n' +
      'Sketch a function\'s graph not by plotting points but by reading the STORY the derivatives tell: where it rises or falls, how it bends, and what it does at the ends.\n' +
      '\n' +
      'METHOD (checklist)\n' +
      '   1. DOMAIN: conditions such as denominator ≠ 0, radicand ≥ 0, ln argument > 0. Note excluded points where vertical lines will be drawn.\n' +
      '   2. INTERCEPTS: y-axis f(0); x-axis f(x) = 0. Symmetry: f(−x) = f(x) even (about the y-axis), f(−x) = −f(x) odd (about the origin); any periodicity?\n' +
      '   3. ASYMPTOTES: Vertical: lim f = ±∞ at x = a. Horizontal: lim(x→±∞) f = L → y = L. Slant: if f(x) = mx + b + (→0) then y = mx + b (rational function: numerator degree = denominator degree + 1).\n' +
      '   4. USE f\': find CRITICAL points (f\' = 0 or does not exist); a sign chart gives increasing/decreasing intervals and local max/min.\n' +
      '   5. USE f\'\': find points where f\'\' = 0 or does not exist; a sign chart gives concave up/down intervals and inflection points.\n' +
      '   6. COMBINE EVERYTHING: mark the key points (intercepts, extrema, inflections), draw asymptotes dashed, and join the pieces consistently with the sign information.\n' +
      '\n' +
      'SIGN CHART SUMMARY\n' +
      'f\' + → increasing ↗, f\' − → decreasing ↘; f\'\' + → ∪, f\'\' − → ∩. Four combinations: ↗∪ (rising faster), ↗∩ (rising slower), ↘∪ (falling slower), ↘∩ (falling faster).\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '   • An extremum needs a sign change of f\': + → − local MAX, − → + local MIN; no sign change (e.g. x = 0 for x³) means no extremum.\n' +
      '   • At a double root the graph TOUCHES the x-axis (no sign change); at a simple root it CROSSES.\n' +
      '   • On a closed domain the endpoints are candidates for absolute extrema; at open ends such as ln or a square root check the limit.\n' +
      '   • For a slant asymptote do polynomial division: f = (x² + …)/(x − c) = x + q + K/(x − c).\n' +
      '\n' +
      'PITFALLS\n' +
      '   • Critical point ≠ extremum; always check for a sign change.\n' +
      '   • A horizontal/slant asymptote can be crossed at finite x; a vertical one cannot.\n' +
      '   • Intervals separated by points outside the domain need separate sign charts.\n' +
      '   • f\'\'(c) = 0 alone is not an inflection point; the concavity must really change.\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      'f(x) = x/(x²+1): domain ℝ, odd function, horizontal asymptote y = 0. f\' = (1−x²)/(x²+1)² → x = ±1 critical; increasing on (−1,1), decreasing outside: local min at x = −1 (−1/2), local max at x = 1 (1/2). So the graph is a thin "S" through the origin.\n' +
      '\n' +
      'MEMORY AID: "First where it lives (domain), then where it hits the axes, then what it does at the ends (asymptotes), then f\' tells the slope story and f\'\' the bending story."\n' +
      '\n' +
      'SLIDER: The "stage" slider reveals the checklist one item at a time like the desktop tab (0: domain, 1: intercepts, 2: symmetry, 3: monotonicity, 4: concavity, 5: asymptotes, 6: the full curve). Make your own prediction before the curve appears.');
  }

  // ---------- drawing ----------
  function autoY(fn, x0, x1, extra) {
    const vals = [];
    for (let i = 0; i <= 400; i++) {
      const v = fn(x0 + (x1 - x0) * i / 400);
      if (isFinite(v) && Math.abs(v) < 1e6) vals.push(v);
    }
    vals.sort((u, v) => u - v);
    let lo = 0, hi = 1;
    if (vals.length) { lo = vals[Math.floor(vals.length * 0.03)]; hi = vals[Math.min(vals.length - 1, Math.ceil(vals.length * 0.97) - 1)]; }
    (extra || []).forEach((e) => { if (isFinite(e) && Math.abs(e) < 1e5) { lo = Math.min(lo, e); hi = Math.max(hi, e); } });
    let span = hi - lo;
    if (!(span > 1e-6)) span = 1;
    const pad = Math.max(span * 0.18, 0.3);
    return [lo - pad, hi + pad];
  }

  function draw(canvas, p) {
    const sp = spec(p);
    const stage = Math.max(0, Math.min(6, Math.round(p.stage)));
    const f = (x) => { try { const v = sp.f(x); return isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
    const x0 = sp.view[0], x1 = sp.view[1];
    const pts = [];
    sp.crit.concat(sp.infl).forEach((c) => pts.push(f(c.x)));
    sp.xints.forEach(() => pts.push(0));
    if (sp.yint) pts.push(sp.yint.y);
    sp.ends.forEach((e) => pts.push(evalExact(e.yS)));
    let y0, y1;
    if (sp.view.length >= 4) { y0 = sp.view[2]; y1 = sp.view[3]; } else { const yr = autoY(f, x0, x1, pts); y0 = yr[0]; y1 = yr[1]; }
    canvas.setViewport(x0, x1, y0, y1);

    // stage 0: domain (excluded parts + vertical lines at excluded points)
    if (isFinite(sp.lo) && sp.lo > x0) canvas.addRegion({ xMin: x0, xMax: sp.lo, color: 'rgba(136,140,150,0.22)' });
    if (isFinite(sp.hi) && sp.hi < x1) canvas.addRegion({ xMin: sp.hi, xMax: x1, color: 'rgba(136,140,150,0.22)' });
    sp.vas.forEach((v) => canvas.addGuideLine({ axis: 'vertical', position: v, color: canvas.gray() }));

    // stage 3 / 4: shading
    if (p.shade && (stage === 3 || stage >= 4)) {
      const bps = stage === 3 ? sp.b1 : sp.b2, fn = stage === 3 ? sp.f1 : sp.f2;
      intervals(sp, bps, fn).forEach((r) => {
        const a = Math.max(x0, isFinite(r.a.x) ? r.a.x : x0), b = Math.min(x1, isFinite(r.b.x) ? r.b.x : x1);
        if (b - a < 1e-9 || r.sign === '?') return;
        const col = stage === 3 ? (r.sign === '+' ? 'rgba(30,144,255,0.16)' : 'rgba(255,140,66,0.18)') : (r.sign === '+' ? 'rgba(60,179,113,0.16)' : 'rgba(147,112,219,0.18)');
        canvas.addRegion({ xMin: a, xMax: b, color: col });
      });
    }
    // stage 5: asymptotes
    if (stage >= 5) {
      sp.has.forEach((y) => canvas.addGuideLine({ axis: 'horizontal', position: y, color: canvas.gray() }));
      if (sp.slant) canvas.addFunction({ evaluator: (x) => sp.slant.m * x + sp.slant.b, color: canvas.gray(), thickness: 1.5, dashed: true });
    }
    // stage 6: the curve
    if (stage >= 6) canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
    // stage 1: intercepts
    if (stage >= 1) {
      sp.xints.forEach((q) => canvas.addMarker({ x: q.x, y: 0, color: canvas.gold(), radius: 6 }));
      if (sp.yint) canvas.addMarker({ x: 0, y: sp.yint.y, color: canvas.blue(), radius: 6 });
    }
    // stage 2: symmetry
    if (stage >= 2) {
      if (sp.symm.type === 'even') canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.purple() });
      else if (sp.symm.type === 'odd') canvas.addMarker({ x: 0, y: 0, color: canvas.purple(), radius: 9, hollow: true });
    }
    // stage 3: extrema
    if (stage >= 3) {
      sp.crit.forEach((c) => { const y = f(c.x); if (isFinite(y)) canvas.addMarker({ x: c.x, y, color: canvas.gold(), shape: 'diamond', radius: 7 }); });
      sp.ends.forEach((e) => { const y = evalExact(e.yS); if (isFinite(y)) canvas.addMarker({ x: e.x, y, color: canvas.orange(), radius: 6, hollow: !!e.open }); });
    }
    // stage 4: inflections
    if (stage >= 4) sp.infl.forEach((c) => { const y = f(c.x); if (isFinite(y)) canvas.addMarker({ x: c.x, y, color: canvas.green(), shape: 'square', radius: 6 }); });
  }

  function buildControls(rightCol, getProblem, helpers) {
    helpers.addSelect({
      options: [{ label: Tx('Örnek türü: Rastgele', 'Example type: Random'), value: 'random' }].concat(KINDS.map((k) => ({ label: kindLabel(k), value: k }))),
      get: () => forcedKind,
      set: (v) => { forcedKind = String(v); helpers.regenerate(); },
    });
    helpers.addSlider({
      caption: Tx('Adım (0 tanım … 6 tam eğri)', 'Stage (0 domain … 6 full curve)'),
      min: 0, max: 6, step: 1,
      get: () => getProblem().stage,
      set: (v) => { getProblem().stage = Math.max(0, Math.min(6, Math.round(v))); },
    });
    helpers.addCheckbox({
      caption: Tx('Bölge gölgelerini göster (adım 3: artan/azalan, adım 4+: bükeylik)', 'Show region shading (stage 3: monotonicity, stage 4+: concavity)'),
      get: () => getProblem().shade,
      set: (v) => { getProblem().shade = !!v; },
    });
  }

  Topics.register('applications', {
    id: 'curveSketching',
    tabTitle: () => Tx('Eğri Çizimi', 'Curve Sketching'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*1\. (TANIM KÜMESİ|DOMAIN):/, make: (rng) => createProblem(rng, 'xlnx') },
      { match: /^\s*3\. (ASİMPTOTLAR|ASYMPTOTES):/, make: (rng) => createProblem(rng, 'hyper') },
      { match: /^\s*• (f' işaret değiştirirse|An extremum needs)/, make: (rng) => createProblem(rng, 'cubicOdd') },
      { match: /^\s*• (Çift kökte|At a double root)/, make: (rng) => createProblem(rng, 'cubicTouch') },
      { match: /^\s*• (Tanım aralığı kapalıysa|On a closed domain)/, make: (rng) => createProblem(rng, 'xsqrt') },
      { match: /^\s*• (Eğik asimptot için|For a slant asymptote)/, make: (rng) => createProblem(rng, 'slant') },
    ],
    _kinds: KINDS,
    _spec: spec,
    _eval: evalExact,
    _intervals: intervals,
    _setKind: (k) => { forcedKind = k; },
  });
})();
