// Secant to Tangent (chapter 'derivatives'). Port of Modules/Derivatives/SecantToTangentControl.vb.
// problem = { kind:'quad'|'cubic'|'sqrt', phys: null|'dist'|'proj', co:[c0,c1,c2,c3], a, dlt, hv, side, showTri }
//   quad : f(x) = c2 x^2 + c1 x + c0        (phys 'dist': s(t) = k t^2 metres;  'proj': h(t) = -5 t^2 + v0 t metres)
//   cubic: f(x) = c3 x^3 + c1 x + c0        sqrt: f(x) = sqrt(x), a a perfect square
// The slider h (> 0) with the left/right choice replaces the VB animation; the secant through P(a,f(a)) and Q(a+h,f(a+h))
// rotates into the dashed tangent as h -> 0.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (n === 0) n = 0;
    return { n, d };
  }
  const frVal = (x) => x.n / x.d;
  const frAdd = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
  const frMul = (x, y) => fr(x.n * y.n, x.d * y.d);
  const frNeg = (x) => fr(-x.n, x.d);
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function frS(x) { return x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d; }
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dec === undefined ? 2 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  function lineS(m, c) {
    let body = '';
    if (m.n !== 0) {
      if (m.d === 1 && m.n === 1) body = 'x';
      else if (m.d === 1 && m.n === -1) body = '−x';
      else if (m.d === 1) body = S(m.n) + 'x';
      else body = '(' + frS(m) + ')x';
    }
    if (body === '') return 'y = ' + frS(c);
    if (c.n === 0) return 'y = ' + body;
    return 'y = ' + body + (c.n < 0 ? ' − ' : ' + ') + frS(fr(Math.abs(c.n), c.d));
  }
  const frP = (x) => (x.n < 0 || x.d !== 1 ? '(' + frS(x) + ')' : frS(x));
  function xA(a) { return a === 0 ? 'x' : (a > 0 ? '(x − ' + a + ')' : '(x + ' + (-a) + ')'); }
  function ptSlope(fa, m, a) {
    const left = fa.n === 0 ? 'y' : (fa.n < 0 ? 'y + ' + frS(fr(-fa.n, fa.d)) : 'y − ' + frS(fa));
    if (m.n === 0) return left + ' = 0';
    const coef = m.d === 1 ? (Math.abs(m.n) === 1 ? (m.n < 0 ? '−' : '') : S(m.n)) : '(' + frS(m) + ')';
    return left + ' = ' + coef + xA(a);
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

  // ---------- model ----------
  const vname = (p) => (p.phys ? 't' : 'x');
  const fname = (p) => (p.phys === 'dist' ? 's' : p.phys === 'proj' ? 'h' : 'f');
  const unitM = (p) => (p.phys ? ' m' : '');
  const unitV = (p) => (p.phys ? ' m/s' : '');
  function F(p, x) {
    let y;
    if (p.kind === 'inv') y = Math.abs(x) < 1e-9 ? NaN : 1 / x;
    else if (p.kind === 'sqrt') y = x < 0 ? NaN : Math.sqrt(x);
    else if (p.kind === 'cubic') y = p.co[3] * x * x * x + p.co[1] * x + p.co[0];
    else y = p.co[2] * x * x + p.co[1] * x + p.co[0];
    return (isFinite(y) && Math.abs(y) < 1e5) ? y : NaN;
  }
  function fStr(p) {
    const v = vname(p);
    if (p.kind === 'sqrt') return '√x';
    if (p.kind === 'inv') return '1/x';
    if (p.kind === 'cubic') return poly([[p.co[3], v + '³'], [p.co[1], v], [p.co[0], '']]);
    return poly([[p.co[2], v + '²'], [p.co[1], v], [p.co[0], '']]);
  }
  const sqrtA = (p) => Math.round(Math.sqrt(p.a));
  const valFr = (p) => p.kind === 'inv' ? fr(1, p.a) : fr(p.kind === 'sqrt' ? sqrtA(p) : F(p, p.a));
  function slopeFr(p) {
    const a = p.a;
    if (p.kind === 'inv') return fr(-1, a * a);
    if (p.kind === 'sqrt') return fr(1, 2 * sqrtA(p));
    if (p.kind === 'cubic') return fr(3 * p.co[3] * a * a + p.co[1]);
    return fr(2 * p.co[2] * a + p.co[1]);
  }
  // average rate on [a, a+d] (exact)
  function avgFr(p, d) { if (p.kind === 'inv') return fr(-1, p.a * (p.a + d)); return fr(F(p, p.a + d) - F(p, p.a), d); }
  // closed form of the difference quotient (independent of F)
  function dqNum(p, h) {
    const a = p.a;
    if (p.kind === 'inv') return -1 / (a * (a + h));
    if (p.kind === 'sqrt') return 1 / (Math.sqrt(a + h) + Math.sqrt(a));
    if (p.kind === 'cubic') return p.co[3] * (3 * a * a + 3 * a * h + h * h) + p.co[1];
    return p.co[2] * (2 * a + h) + p.co[1];
  }
  function dqClosed(p) {
    const a = p.a;
    if (p.kind === 'inv') return `−1/(${a}(${a}+h))`;
    if (p.kind === 'sqrt') return `1/(√(${a}+h) + ${sqrtA(p)})`;
    if (p.kind === 'cubic') return poly([[3 * p.co[3] * a * a + p.co[1], ''], [3 * p.co[3] * a, 'h'], [p.co[3], 'h²']]);
    return poly([[2 * p.co[2] * a + p.co[1], ''], [p.co[2], 'h']]);
  }
  const hasLeftLimit = (p) => !(p.kind === 'sqrt' || p.kind === 'inv' || p.phys); // x >= 0 domains
  function hEff(p) {
    let h = p.hv;
    if (p.side < 0) {
      h = -h;
      if (!hasLeftLimit(p)) h = -Math.min(p.hv, p.a * 0.95);
    }
    return Math.abs(h) < 1e-9 ? 1e-9 : h;
  }
  function view(p) {
    const a = p.a;
    if (hasLeftLimit(p)) return [a - 3.5, a + 4];
    return [Math.max(0, a - 3.5), a + 4];
  }

  function focus(p) {
    const y = F(p, p.a);
    return (isFinite(p.a) && isFinite(y)) ? { x: p.a, y } : null;
  }

  function createProblem(rng) { return gen(rng, rng.nextInt(0, 10)); }
  function gen(rng, r) {
    const p = { kind: 'quad', phys: null, co: [0, 0, 1, 0], a: 1, dlt: 1, hv: 2, side: 1, showTri: true };
    if (r <= 2) { // generic quadratic
      p.co = [rng.nextInt(-3, 4), rng.nextInt(-4, 5), rng.nonZeroInt(-2, 2), 0];
      p.a = rng.nextInt(-2, 3); p.dlt = rng.pick([1, 2]);
    } else if (r === 3) { // x^2
      p.co = [0, 0, rng.pick([1, 2, 3]), 0];
      p.a = rng.nextInt(-3, 4); p.dlt = rng.pick([1, 2]);
    } else if (r === 4 || r === 5) { // cubic
      p.kind = 'cubic'; p.co = [rng.nextInt(-2, 3), rng.nextInt(-3, 4), 0, rng.pick([-1, 1])];
      p.a = rng.nextInt(-2, 3); p.dlt = rng.pick([1, 2]);
    } else if (r === 6) { // sqrt
      p.kind = 'sqrt'; p.co = [0, 0, 0, 0];
      const pr = rng.pick([[1, 4], [1, 9], [4, 9], [4, 16], [9, 16]]);
      p.a = pr[0]; p.dlt = pr[1] - pr[0];
    } else if (r === 7) { // distance-time
      p.phys = 'dist'; p.co = [0, 0, rng.pick([1, 2, 3, 5]), 0];
      p.a = rng.nextInt(1, 5); p.dlt = rng.pick([1, 2]);
    } else if (r === 10) { // 1/x
      p.kind = 'inv'; p.co = [0, 0, 0, 0]; p.a = rng.pick([1, 2, 3]); p.dlt = rng.pick([1, 2]);
    } else { // projectile
      p.phys = 'proj'; const v0 = rng.pick([20, 30, 40]); p.co = [0, v0, -5, 0];
      p.a = rng.nextInt(1, v0 / 10 + 1); p.dlt = rng.pick([1, 2]);
    }
    return p;
  }

  function problemStatement(p) {
    const A = S(p.a), B = S(p.a + p.dlt), v = vname(p), F_ = fname(p);
    if (p.phys === 'dist') {
      return Tx(`Bir cismin konumu s(t) = ${fStr(p)} (s metre, t saniye). [${A}, ${B}] s aralığındaki ORTALAMA hızı bulalım; ardından h → 0 limitiyle t = ${A} s anındaki ANLIK hızı birimleriyle hesaplayalım.`,
        `A body's position is s(t) = ${fStr(p)} (s in metres, t in seconds). Let's find the AVERAGE velocity on [${A}, ${B}] s, then use the limit h → 0 to find the INSTANTANEOUS velocity at t = ${A} s (with units).`);
    }
    if (p.phys === 'proj') {
      return Tx(`Yukarı fırlatılan bir cismin yüksekliği h(t) = ${fStr(p)} (h metre, t saniye). [${A}, ${B}] s aralığındaki ortalama dikey hızı ve t = ${A} s anındaki anlık dikey hızı bulalım. Cisim bu anda yükseliyor mu, alçalıyor mu?`,
        `A projectile's height is h(t) = ${fStr(p)} (h in metres, t in seconds). Let's find the average vertical velocity on [${A}, ${B}] s and the instantaneous vertical velocity at t = ${A} s. Is the object rising or falling at that moment?`);
    }
    return Tx(`f(x) = ${fStr(p)} için [${A}, ${B}] aralığındaki ortalama değişim hızını bulalım. Fark oranını h cinsinden sadeleştirip h → 0 limitiyle x = ${A} noktasındaki anlık değişim hızını (teğet eğimini) ve teğet doğrusunun denklemini bulabiliriz.`,
      `For f(x) = ${fStr(p)}, let's find the average rate of change on [${A}, ${B}]. We can simplify the difference quotient in terms of h, then use h → 0 to get the instantaneous rate of change (tangent slope) at x = ${A} and the equation of the tangent line.`);
  }

  function concept() {
    return Tx(
      [
        'ORTALAMA VE ANLIK DEĞİŞİM HIZI',
        "f'nin x = a ile x = a + h arasındaki ORTALAMA değişim hızı, grafikteki P(a, f(a)) ve Q(a+h, f(a+h)) noktalarından geçen KESEN doğrunun eğimidir. h → 0 iken Q, P'ye yaklaşır; kesen TEĞETE dönüşür ve eğimi ANLIK değişim hızı olan f'(a)'ya yaklaşır.",
        '',
        'FORMÜLLER',
        '   Ortalama değişim hızı:  [f(a+h) − f(a)] / h  = Δy/Δx',
        "   Türevin tanımı:  f'(a) = lim(h→0) [f(a+h) − f(a)] / h",
        "   Alternatif:  f'(a) = lim(x→a) [f(x) − f(a)] / (x − a)",
        "   Teğet doğrusu:  y − f(a) = f'(a)·(x − a)",
        '',
        'YORUMLAR',
        '   - Fizik: ortalama hız = Δs/Δt; anlık hız = s\'(t) (hız göstergesi).',
        '   - Geometri: kesenin eğimi → teğetin eğimi.',
        "   - Birim: f'(a) birimi = (f birimi)/(x birimi); konum m, zaman s ise hız m/s.",
        '',
        'YÖNTEM (tanımdan türev)',
        '   1. f(a+h) ifadesini yazıp açarız.',
        '      - Polinom: (a+h)² = a² + 2ah + h²,  (a+h)³ = a³ + 3a²h + 3ah² + h³.',
        '      - Kesir (1/x): ortak payda: 1/(a+h) − 1/a = −h / (a(a+h)).',
        '      - Kök (√x): eşlenikle çarparız: (√(a+h) − √a)(√(a+h) + √a) = h.',
        '   2. f(a+h) − f(a) farkını sadeleştiririz (a\'lı terimler yok olur, pay h\'ın katı olur).',
        '   3. h\'ye böler, h çarpanını sadeleştiririz (h ≠ 0 olduğundan bunu rahatça yapabiliriz).',
        '   4. h → 0 limitini alırız (artık doğrudan yerine koyabiliriz).',
        "   5. Sonuç f'(a) (ya da genel x için f'(x)) olur. Teğet: y − f(a) = f'(a)(x − a).",
        '',
        'ÖZEL DURUMLAR / DİKKAT EDİLECEKLER',
        '   - h = 0 koyamayız (0/0 çıkar); önce cebirle sadeleştirmek gerekir, limit de bu yüzden gereklidir.',
        '   - h negatif de olabilir (sol kesen); sol ve sağ kesen aynı limite gitmelidir.',
        "   - Köşe noktasında (|x|, x = 0) iki yönün eğimleri farklıdır; türev yoktur.",
        '   - Ortalama değişim hızı bir ARALIK için, anlık hız bir AN içindir; ikisi karıştırılmamalıdır.',
        '   - (a+h)² = a² + h² yazmak sık yapılan hatadır; doğrusu a² + 2ah + h².',
        '',
        'MİNİ ÖRNEK',
        "f(x) = x², a = 3: [(3+h)² − 9]/h = (6h + h²)/h = 6 + h → 6. Yani f'(3) = 6; teğet: y − 9 = 6(x − 3). h = 1 için kesen eğimi 7, h = 0,1 için 6,1: 6'ya yaklaşıyor.",
        '',
        'KAYDIRICI',
        'h kaydırıcısını küçülttüğümüzde turuncu kesen, kesikli teğete dönüşür. Sağdan (h > 0) ve soldan (h < 0) yaklaşmayı karşılaştırabiliriz; ikisi de aynı değere gider.',
      ].join('\n'),
      [
        'AVERAGE VS. INSTANTANEOUS RATE OF CHANGE',
        'The AVERAGE rate of change of f between x = a and x = a + h is the slope of the SECANT line through P(a, f(a)) and Q(a+h, f(a+h)). As h → 0, Q slides to P, the secant turns into the TANGENT and its slope approaches the INSTANTANEOUS rate of change f\'(a).',
        '',
        'FORMULAS',
        '   Average rate of change:  [f(a+h) − f(a)] / h  = Δy/Δx',
        "   Definition of the derivative:  f'(a) = lim(h→0) [f(a+h) − f(a)] / h",
        "   Alternative:  f'(a) = lim(x→a) [f(x) − f(a)] / (x − a)",
        "   Tangent line:  y − f(a) = f'(a)·(x − a)",
        '',
        'INTERPRETATIONS',
        "   - Physics: average velocity = Δs/Δt; instantaneous velocity = s'(t) (the speedometer).",
        '   - Geometry: slope of secant → slope of tangent.',
        "   - Units: unit of f'(a) = (unit of f)/(unit of x); position in m and time in s give m/s.",
        '',
        'METHOD (derivative from the definition)',
        '   1. We write f(a+h) and expand it.',
        '      - Polynomial: (a+h)² = a² + 2ah + h²,  (a+h)³ = a³ + 3a²h + 3ah² + h³.',
        '      - Fraction (1/x): common denominator: 1/(a+h) − 1/a = −h / (a(a+h)).',
        '      - Root (√x): we multiply by the conjugate: (√(a+h) − √a)(√(a+h) + √a) = h.',
        '   2. We simplify the difference f(a+h) − f(a) (the a-only terms cancel, the numerator is a multiple of h).',
        '   3. We divide by h and cancel the factor h (allowed since h ≠ 0 inside the limit).',
        '   4. We take the limit h → 0 (now plain substitution works).',
        "   5. The result is f'(a) (or f'(x) for general x). Tangent: y − f(a) = f'(a)(x − a).",
        '',
        'SPECIAL CASES / PITFALLS',
        '   - We cannot plug in h = 0 (0/0); we simplify algebraically first, which is why the limit is needed.',
        '   - h may be negative too (left secant); left and right secants must reach the same limit.',
        '   - At a corner (|x|, x = 0) the two sides have different slopes; there is no derivative.',
        '   - Average rate belongs to an INTERVAL, instantaneous rate to a single MOMENT; it helps to keep them apart.',
        '   - Writing (a+h)² = a² + h² is a classic error; the correct expansion is a² + 2ah + h².',
        '',
        'MINI EXAMPLE',
        "f(x) = x², a = 3: [(3+h)² − 9]/h = (6h + h²)/h = 6 + h → 6. So f'(3) = 6; tangent: y − 9 = 6(x − 3). For h = 1 the secant slope is 7, for h = 0.1 it is 6.1: it approaches 6.",
        '',
        'SLIDER',
        'If we shrink the h slider, the orange secant turns into the dashed tangent. We can compare approaching from the right (h > 0) and from the left (h < 0); both go to the same value.',
      ].join('\n'));
  }

  function algebra(p) {
    const a = p.a, A = P(a), v = vname(p), F_ = fname(p);
    const L = [];
    const DQ = Tx('Fark oranı', 'Difference quotient');
    if (p.kind === 'cubic') {
      const c3 = p.co[3], c1 = p.co[1];
      L.push(`${F_}(${S(a)}+h) − ${F_}(${S(a)}) = ${P(c3)}[(${S(a)}+h)³ − ${A}³]` + (c1 !== 0 ? ` + ${P(c1)}h` : ''));
      L.push(`= ${P(c3)}(${poly([[3 * a * a, 'h'], [3 * a, 'h²'], [1, 'h³']])})` + (c1 !== 0 ? ` + ${P(c1)}h` : '') + `    [(a+h)³ = a³ + 3a²h + 3ah² + h³]`);
      L.push(`= ${poly([[3 * c3 * a * a + c1, 'h'], [3 * c3 * a, 'h²'], [c3, 'h³']])}`);
    } else if (p.kind === 'inv') {
      L.push(`1/(${a}+h) − 1/${a} = (${a} − (${a}+h)) / (${a}(${a}+h))    [${Tx('ortak payda','common denominator')}]`);
      L.push(`= −h / (${a}(${a}+h))`);
    } else if (p.kind === 'sqrt') {
      const r = sqrtA(p);
      L.push(`(√(${a}+h) − √${a}) / h  ·  (√(${a}+h) + √${a}) / (√(${a}+h) + √${a})`);
      L.push(`= ((${a}+h) − ${a}) / (h (√(${a}+h) + ${r})) = h / (h (√(${a}+h) + ${r}))`);
    } else {
      const c2 = p.co[2], c1 = p.co[1];
      L.push(`${F_}(${S(a)}+h) − ${F_}(${S(a)}) = ${P(c2)}[(${S(a)}+h)² − ${A}²]` + (c1 !== 0 ? ` + ${P(c1)}h` : ''));
      L.push(`= ${P(c2)}(${poly([[2 * a, 'h'], [1, 'h²']])})` + (c1 !== 0 ? ` + ${P(c1)}h` : '') + `    [(a+h)² − a² = 2ah + h²]`);
      L.push(`= ${poly([[2 * c2 * a + c1, 'h'], [c2, 'h²']])}`);
    }
    L.push(`${DQ} = ${dqClosed(p)}`);
    return L;
  }

  function solveSteps(p) {
    const a = p.a, A = S(a), v = vname(p), F_ = fname(p);
    const steps = [];
    const fa = valFr(p), m = slopeFr(p), d = p.dlt, b = a + d;
    const um = unitM(p), uv = unitV(p);
    steps.push(Tx(`── 1) Veri ──\n${F_}(${v}) = ${fStr(p)},  ${v} = ${A}\n${F_}(${A}) = ${frS(fa)}${um}   ⇒ P(${A}, ${frS(fa)})`,
      `── 1) Given ──\n${F_}(${v}) = ${fStr(p)},  ${v} = ${A}\n${F_}(${A}) = ${frS(fa)}${um}   ⇒ P(${A}, ${frS(fa)})`));
    const fb = p.kind === 'inv' ? fr(1, b) : fr(F(p, b));
    const av = avgFr(p, d);
    steps.push(Tx(`── 2) Ortalama değişim hızı [${A}, ${S(b)}] ──\n${F_}(${S(b)}) = ${frS(fb)}${um}\nΔ${F_}/Δ${v} = (${frS(fb)} − ${P(fa.n)}${fa.d === 1 ? '' : '/' + fa.d}) / ${d} = ${frS(av)}${uv}\nBu, P ve Q(${S(b)}, ${frS(fb)}) noktalarından geçen kesenin eğimidir.`,
      `── 2) Average rate of change on [${A}, ${S(b)}] ──\n${F_}(${S(b)}) = ${frS(fb)}${um}\nΔ${F_}/Δ${v} = (${frS(fb)} − ${P(fa.n)}${fa.d === 1 ? '' : '/' + fa.d}) / ${d} = ${frS(av)}${uv}\nThis is the slope of the secant through P and Q(${S(b)}, ${frS(fb)}).`));
    steps.push(Tx(`── 3) Fark oranı (h cinsinden) ──\n${algebra(p).join('\n')}`, `── 3) Difference quotient (in terms of h) ──\n${algebra(p).join('\n')}`));
    // slider state
    const h = hEff(p);
    const Q = a + h;
    const sq = (F(p, Q) - F(p, a)) / h;
    steps.push(Tx(`── 4) Kaydırıcı: h = ${nf(h, 3)} ──\nQ(${nf(Q, 3)}, ${nf(F(p, Q), 3)}); kesen eğimi = ${nf(sq, 4)}${uv}  (kapalı formdan: ${nf(dqNum(p, h), 4)})\nTeğet eğimi = ${nf(frVal(m), 4)}${uv}; aradaki fark ${nf(sq - frVal(m), 4)}.`,
      `── 4) Slider: h = ${nf(h, 3)} ──\nQ(${nf(Q, 3)}, ${nf(F(p, Q), 3)}); secant slope = ${nf(sq, 4)}${uv}  (from the closed form: ${nf(dqNum(p, h), 4)})\nTangent slope = ${nf(frVal(m), 4)}${uv}; the gap is ${nf(sq - frVal(m), 4)}.`));
    // table
    const hs = [1, 0.5, 0.1, 0.01, 0.001];
    const dq = (x) => (F(p, a + x) - F(p, a)) / x;
    const rowR = hs.map((x) => `h = ${nf(x, 3)}: ${nf(dq(x), 4)}`).join('   |   ');
    const okL = hasLeftLimit(p);
    const hl = okL ? hs : hs.filter((x) => x < a);
    const rowL = hl.map((x) => `h = ${nf(-x, 3)}: ${nf(dq(-x), 4)}`).join('   |   ');
    steps.push(Tx(`── 5) Sayısal tablo ──\nSağdan (h → 0⁺):  ${rowR}\nSoldan (h → 0⁻):  ${rowL}\nİki taraf da ${nf(frVal(m), 4)} değerine yaklaşıyor.`,
      `── 5) Numerical table ──\nFrom the right (h → 0⁺):  ${rowR}\nFrom the left (h → 0⁻):  ${rowL}\nBoth sides approach ${nf(frVal(m), 4)}.`));
    // limit
    let limTxt;
    if (p.kind === 'sqrt') limTxt = `lim(h→0) ${dqClosed(p)} = 1/(${sqrtA(p)} + ${sqrtA(p)}) = ${frS(m)}`;
    else limTxt = `lim(h→0) (${dqClosed(p)}) = ${frS(m)}`;
    steps.push(Tx(`── 6) Limit: anlık değişim hızı ──\n${F_}'(${A}) = ${limTxt}${uv}\n(h sadeleştikten sonra h → 0 doğrudan yerine koymadır.)`,
      `── 6) Limit: instantaneous rate ──\n${F_}'(${A}) = ${limTxt}${uv}\n(After cancelling h, h → 0 is plain substitution.)`));
    // tangent
    const c = frAdd(fa, frNeg(frMul(m, fr(a))));
    steps.push(Tx(`── 7) Teğet doğrusu ──\n${ptSlope(fa, m, a)}  ⇒  ${lineS(m, c)}${p.phys ? `\n(${v} yerine x, ${F_} yerine y yazılmıştır.)` : ''}`,
      `── 7) Tangent line ──\n${ptSlope(fa, m, a)}  ⇒  ${lineS(m, c)}${p.phys ? `\n(${v} written as x, ${F_} as y.)` : ''}`));
    // interpretation
    const gap = p.kind === 'sqrt' ? null : (p.kind === 'cubic' ? `${P(p.co[3])}·(3a + h)·h` : `${P(p.co[2])}·h`);
    let interp;
    if (p.phys) {
      const rising = m.n > 0, still = m.n === 0;
      interp = Tx(`Ortalama hız ${frS(av)} m/s bir ARALIK için, anlık hız ${frS(m)} m/s bir AN içindir. ${still ? 'Hız 0: cisim bir an durur (en yüksek nokta).' : (rising ? 'Hız pozitif: cisim yükseliyor/ilerliyor.' : 'Hız negatif: cisim alçalıyor/geri gidiyor.')}`,
        `Average velocity ${frS(av)} m/s belongs to an INTERVAL, instantaneous velocity ${frS(m)} m/s to a single MOMENT. ${still ? 'Velocity 0: the object momentarily stops (highest point).' : (rising ? 'Positive velocity: the object is rising/moving forward.' : 'Negative velocity: the object is falling/moving backward.')}`);
    } else {
      interp = Tx(`Kesen eğimi ${frS(av)} (aralık için) ile teğet eğimi ${frS(m)} (nokta için) farklıdır; h küçüldükçe kesen eğimi teğet eğimine yaklaşır` + (p.kind === 'quad' ? `: kesen eğimi − teğet eğimi = ${P(p.co[2])}·h.` : '.'),
        `The secant slope ${frS(av)} (interval) differs from the tangent slope ${frS(m)} (single point); as h shrinks the secant slope approaches the tangent slope` + (p.kind === 'quad' ? `: secant slope − tangent slope = ${P(p.co[2])}·h.` : '.'));
    }
    steps.push(Tx(`── 8) Yorum ──\n${interp}`, `── 8) Interpretation ──\n${interp}`));
    return steps;
  }

  function draw(canvas, p) {
    try {
      const xMin = p.a - 3.75, xMax = p.a + 3.75;
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= 120; i++) {
        const y = F(p, xMin + (xMax - xMin) * i / 120);
        if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
      }
      if (!isFinite(lo)) { lo = -5; hi = 5; }
      lo = Math.min(lo, 0); hi = Math.max(hi, 0);
      if (hi - lo > 60) { const c = F(p, p.a); lo = c - 30; hi = c + 30; }
      const pad = Math.max(0.8, (hi - lo) * 0.12);
      const cy = isFinite(F(p, p.a)) ? F(p, p.a) : (lo + hi) / 2, hh = (hi - lo) / 2 + pad;
      canvas.setViewport(xMin, xMax, cy - hh, cy + hh);
      const a = p.a, fa = F(p, a), m = frVal(slopeFr(p));
      const h = hEff(p), q = a + h, fq = F(p, q);
      canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 3, label: `${fname(p)}(${vname(p)}) = ${fStr(p)}` });
      // tangent (dashed grey)
      canvas.addSegment({ x1: xMin, y1: fa + m * (xMin - a), x2: xMax, y2: fa + m * (xMax - a), color: canvas.gray(), thickness: 1.8, dashed: true });
      if (isFinite(fq) && isFinite(fa)) {
        const sl = (fq - fa) / h;
        canvas.addSegment({ x1: xMin, y1: fa + sl * (xMin - a), x2: xMax, y2: fa + sl * (xMax - a), color: canvas.orange(), thickness: 2.5 });
        if (p.showTri) {
          canvas.addSegment({ x1: a, y1: fa, x2: q, y2: fa, color: canvas.green(), thickness: 1.5, dashed: true });
          canvas.addSegment({ x1: q, y1: fa, x2: q, y2: fq, color: canvas.green(), thickness: 1.5, dashed: true });
        }
        canvas.addMarker({ x: q, y: fq, color: canvas.orange(), radius: 6, label: 'Q' });
      }
      canvas.addMarker({ x: a, y: fa, color: canvas.gold(), radius: 7, label: `P(${nf(a, 2)}, ${nf(fa, 2)})` });
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, hp) {
    hp.addSlider({
      caption: Tx('İki nokta arasındaki uzaklık (h) → 0', 'Separation between the two points (h) → 0'),
      min: 0.05, max: 3, step: 0.05,
      get: () => getProblem().hv,
      set: (v) => { getProblem().hv = Math.max(0.05, Math.min(3, v)); },
    });
    hp.addRadioGroup({
      name: 'secantSide',
      options: [{ label: Tx('Sağdan (h > 0)', 'From the right (h > 0)'), value: 1 }, { label: Tx('Soldan (h < 0)', 'From the left (h < 0)'), value: -1 }],
      get: () => getProblem().side,
      set: (v) => { getProblem().side = Number(v) < 0 ? -1 : 1; },
    });
    hp.addCheckbox({
      caption: Tx('Δx ve Δy üçgenini göster', 'Show the Δx / Δy triangle'),
      get: () => getProblem().showTri,
      set: (v) => { getProblem().showTri = !!v; },
    });
  }

  Topics.register('derivatives', {
    id: 'secantToTangent',
    tabTitle: () => Tx('Kesenden Teğete', 'Secant to Tangent'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^\s+- (Fizik|Physics):/, make: (rng) => gen(rng, rng.pick([7, 8])) },
      { match: /^\s+- (Polinom|Polynomial):/, make: (rng) => gen(rng, rng.pick([0, 3, 4])) },
      { match: /^\s+- (Kesir|Fraction) \(1\/x\)/, make: (rng) => gen(rng, 10) },
      { match: /^\s+- (Kök|Root) \(√x\)/, make: (rng) => gen(rng, 6) },
    ],
  });
})();
