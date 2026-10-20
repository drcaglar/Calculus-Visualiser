// Tangent as Rate of Change (chapter 'derivatives'). Port of Modules/Derivatives/TangentRateControl.vb.
// problem = { kind:'poly'|'sin'|'cos'|'exp', mode:'at'|'horiz'|'slope',
//             co:[c0,c1,c2,c3] (poly: sum co[i] x^i), k, c (exp: k e^(c x)),
//             a, aStr, aRat (number|null), ti (index into TRIG_TABLE), ln2 (exp: a = ln 2 ?),
//             s, q (target slope / parallel line y = s x + q), pts:[x0,...], x (explorer point), showNormal }
// Exact values are carried as {n,d,r} = (n/d)*sqrt(r), r in {1,3}.
// The slider moves the explorer point x (replaces the VB TransportBar animation); the tangent there is drawn in orange.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  // ---------- exact helpers ----------
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
  // (n/d)*sqrt(r)
  function ev(n, d, r) {
    const f = fr(n, d);
    if (f.n === 0) return { n: 0, d: 1, r: 1 };
    return { n: f.n, d: f.d, r: r || 1 };
  }
  const evVal = (v) => (v.n / v.d) * Math.sqrt(v.r);
  const evZero = (v) => v.n === 0;
  const evNeg = (v) => ev(-v.n, v.d, v.r);
  const evAbs = (v) => ev(Math.abs(v.n), v.d, v.r);
  const evScale = (v, k) => ev(v.n * k, v.d, v.r);
  const evInv = (v) => ev(v.d, v.n * v.r, v.r); // 1/((n/d)sqrt r) = (d/(n r)) sqrt r
  function evS(v) {
    if (v.r === 1) return frS(v);
    const neg = v.n < 0, ab = Math.abs(v.n);
    const body = (ab === 1 ? '' : String(ab)) + '√' + v.r;
    return (neg ? '−' : '') + body + (v.d === 1 ? '' : '/' + v.d);
  }
  const evRat = (v) => (v.r === 1 ? fr(v.n, v.d) : null);
  function lineS(m, c) { // y = m x + c with fraction m, c
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

  // ---------- polynomials ----------
  const SUP = ['', '', '²', '³', '⁴'];
  const evalP = (co, x) => co.reduceRight((acc, c) => acc * x + c, 0);
  const derivP = (co) => co.slice(1).map((c, i) => c * (i + 1));
  function polyStr(co, v) {
    let s = '';
    for (let i = co.length - 1; i >= 0; i--) {
      const c = co[i];
      if (c === 0) continue;
      const ab = Math.abs(c);
      const lab = i === 0 ? '' : (i === 1 ? v : v + SUP[i]);
      const body = lab === '' ? String(ab) : (ab === 1 ? lab : ab + lab);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    }
    return s || '0';
  }
  function termH(list) { // [[coef,label],...] -> string
    let s = '';
    list.forEach((t) => {
      const c = t[0], l = t[1];
      if (c === 0) return;
      const ab = Math.abs(c);
      const body = l === '' ? String(ab) : (ab === 1 ? l : ab + l);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }

  // ---------- trig exact table (a, sin a, cos a) ----------
  const TRIG_TABLE = [
    { s: '0', v: 0, sin: ev(0, 1, 1), cos: ev(1, 1, 1) },
    { s: 'π/6', v: Math.PI / 6, sin: ev(1, 2, 1), cos: ev(1, 2, 3) },
    { s: 'π/3', v: Math.PI / 3, sin: ev(1, 2, 3), cos: ev(1, 2, 1) },
    { s: 'π/2', v: Math.PI / 2, sin: ev(1, 1, 1), cos: ev(0, 1, 1) },
    { s: '2π/3', v: 2 * Math.PI / 3, sin: ev(1, 2, 3), cos: ev(-1, 2, 1) },
    { s: 'π', v: Math.PI, sin: ev(0, 1, 1), cos: ev(-1, 1, 1) },
  ];

  // ---------- model ----------
  function F(p, x) {
    let y;
    switch (p.kind) {
      case 'sin': y = p.k * Math.sin(x); break;
      case 'cos': y = p.k * Math.cos(x); break;
      case 'exp': y = p.k * Math.exp(p.c * x); break;
      default: y = evalP(p.co, x);
    }
    return (isFinite(y) && Math.abs(y) < 1e6) ? y : NaN;
  }
  function dF(p, x) {
    let y;
    switch (p.kind) {
      case 'sin': y = p.k * Math.cos(x); break;
      case 'cos': y = -p.k * Math.sin(x); break;
      case 'exp': y = p.k * p.c * Math.exp(p.c * x); break;
      default: y = evalP(derivP(p.co), x);
    }
    return (isFinite(y) && Math.abs(y) < 1e6) ? y : NaN;
  }
  const kStr = (k) => (k === 1 ? '' : k === -1 ? '−' : S(k));
  function fStr(p) {
    switch (p.kind) {
      case 'sin': return kStr(p.k) + 'sin x';
      case 'cos': return kStr(p.k) + 'cos x';
      case 'exp': return kStr(p.k) + 'e^(' + (p.c === 1 ? '' : p.c === -1 ? '−' : S(p.c)) + 'x)';
      default: return polyStr(p.co, 'x');
    }
  }
  function dStr(p) { // f'(x) as text
    switch (p.kind) {
      case 'sin': return kStr(p.k) + 'cos x';
      case 'cos': return kStr(-p.k) + 'sin x';
      case 'exp': { const kc = p.k * p.c; return kStr(kc) + 'e^(' + (p.c === 1 ? '' : p.c === -1 ? '−' : S(p.c)) + 'x)'; }
      default: return polyStr(derivP(p.co), 'x');
    }
  }
  // exact f(a), f'(a) at an arbitrary x0 of the problem (integers for poly)
  function exactAt(p, x0) {
    switch (p.kind) {
      case 'sin': { const T = TRIG_TABLE[p.ti]; return { fa: evScale(T.sin, p.k), m: evScale(T.cos, p.k) }; }
      case 'cos': { const T = TRIG_TABLE[p.ti]; return { fa: evScale(T.cos, p.k), m: evScale(T.sin, -p.k) }; }
      case 'exp': {
        const e = p.ln2 ? p.c : 0; // e^(c a) = 2^e
        const num = e >= 0 ? Math.pow(2, e) : 1, den = e >= 0 ? 1 : Math.pow(2, -e);
        return { fa: ev(p.k * num, den, 1), m: ev(p.k * p.c * num, den, 1) };
      }
      default: return { fa: ev(evalP(p.co, x0), 1, 1), m: ev(evalP(derivP(p.co), x0), 1, 1) };
    }
  }
  function aStrOf(p, x0) {
    if (p.kind === 'sin' || p.kind === 'cos') return p.aStr;
    if (p.kind === 'exp') return p.aStr;
    return S(x0);
  }

  // ---------- problem ----------
  function createProblem(rng) { return gen(rng, rng.nextInt(0, 16)); }
  function gen(rng, r) {
    const p = { kind: 'poly', mode: 'at', co: [0, 0], k: 1, c: 1, a: 0, aStr: '0', aRat: 0, ti: 0, ln2: false, s: 0, q: 0, pts: [], x: 0, showNormal: true };
    if (r <= 3) { // quadratic, tangent at a
      const A = rng.pick([-2, -1, 1, 2]);
      p.co = [rng.nextInt(-4, 5), rng.nonZeroInt(-5, 5), A];
      p.a = rng.nextInt(-3, 4);
    } else if (r <= 5) { // cubic, tangent at a
      p.co = [rng.nextInt(-3, 4), rng.nonZeroInt(-4, 4), 0, rng.pick([-1, 1])];
      p.a = rng.nextInt(-2, 3);
    } else if (r === 6 || r === 7) { // quadratic: horizontal tangent
      const A = rng.pick([-2, -1, 1, 2]);
      const x0 = rng.nonZeroInt(-3, 3);
      p.mode = 'horiz';
      p.co = [rng.nextInt(-4, 5), -2 * A * x0, A];
      p.pts = [x0];
    } else if (r === 8) { // cubic: horizontal tangents
      const A = rng.pick([-1, 1]);
      const x0 = rng.pick([1, 2]);
      p.mode = 'horiz';
      p.co = [rng.nextInt(-3, 4), -3 * A * x0 * x0, 0, A];
      p.pts = [-x0, x0];
    } else if (r === 9 || r === 10) { // quadratic: tangent parallel to a given line
      const A = rng.pick([-2, -1, 1, 2]);
      const x0 = rng.nextInt(-3, 4);
      const B = rng.nonZeroInt(-5, 5);
      p.mode = 'slope';
      p.co = [rng.nextInt(-4, 5), B, A];
      p.s = 2 * A * x0 + B;
      p.q = rng.nextInt(-3, 4);
      p.pts = [x0];
    } else if (r === 11) { // cubic: tangent parallel to a given line
      const A = rng.pick([-1, 1]);
      const x0 = rng.pick([1, 2]);
      const B = rng.nonZeroInt(-4, 4);
      p.mode = 'slope';
      p.co = [rng.nextInt(-3, 4), B, 0, A];
      p.s = 3 * A * x0 * x0 + B;
      p.q = rng.nextInt(-3, 4);
      p.pts = [-x0, x0];
    } else if (r === 12 || r === 13) { // k sin x or k cos x at a special angle
      p.kind = r === 12 ? 'sin' : 'cos';
      p.k = rng.nonZeroInt(-3, 3);
      p.ti = rng.nextInt(0, TRIG_TABLE.length);
      p.a = TRIG_TABLE[p.ti].v;
      p.aStr = TRIG_TABLE[p.ti].s;
      p.aRat = p.ti === 0 ? 0 : null;
    } else { // k e^(c x), a = 0 or ln 2
      p.kind = 'exp';
      p.k = rng.nonZeroInt(-3, 3);
      p.c = rng.pick([-1, 1, 2]);
      p.ln2 = rng.nextInt(0, 2) === 1;
      p.a = p.ln2 ? Math.LN2 : 0;
      p.aStr = p.ln2 ? 'ln 2' : '0';
      p.aRat = p.ln2 ? null : 0;
    }
    if (p.mode === 'at' && p.kind === 'poly') p.aRat = p.a;
    if (p.mode !== 'at') { p.a = p.pts[p.pts.length - 1]; p.aRat = p.a; }
    p.x = Math.max(-4, Math.min(4, p.a));
    return p;
  }

  // ---------- statement ----------
  function slopeLineS(p) { return 'y = ' + (p.s === 0 ? '' : (p.s === 1 ? 'x' : p.s === -1 ? '−x' : S(p.s) + 'x')) + (p.q === 0 ? (p.s === 0 ? '0' : '') : (p.s === 0 ? S(p.q) : (p.q < 0 ? ' − ' + Math.abs(p.q) : ' + ' + p.q))); }
  function problemStatement(p) {
    const f = fStr(p);
    if (p.mode === 'horiz') {
      return Tx(`f(x) = ${f} fonksiyonunun grafiğinde teğetin YATAY olduğu noktaları bulalım ve bu noktalardaki teğet doğruların denklemlerini yazalım.`,
        `On the graph of f(x) = ${f}, let's find the point(s) where the tangent line is HORIZONTAL and write the equation of the tangent line there.`);
    }
    if (p.mode === 'slope') {
      return Tx(`f(x) = ${f} fonksiyonunun grafiğinde, teğeti ${slopeLineS(p)} doğrusuna PARALEL olan noktaları bulalım ve bu noktalardaki teğet doğruların denklemlerini yazalım.`,
        `On the graph of f(x) = ${f}, let's find the point(s) where the tangent line is PARALLEL to the line ${slopeLineS(p)} and write the equation of the tangent line there.`);
    }
    return Tx(`f(x) = ${f} için x = ${p.aStr === '0' && p.kind === 'poly' ? '0' : aStrOf(p, p.a)} noktasındaki teğetin eğimini, teğet doğrusunun ve normal doğrusunun denklemini bulalım; teğetin x ekseniyle yaptığı açıyı da hesaplayalım.`,
      `For f(x) = ${f}, let's find the slope of the tangent at x = ${aStrOf(p, p.a)}, the equations of the tangent and normal lines there, and the angle the tangent makes with the x-axis.`);
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      [
        'TEĞET DOĞRU VE DEĞİŞİM HIZI',
        "f'(a), f grafiğinin (a, f(a)) noktasındaki TEĞET doğrunun eğimidir ve aynı zamanda f'nin o noktadaki ANLIK değişim hızıdır. Bir eğrinin her noktasının kendi eğimi vardır; teğet, eğriye o noktada en iyi uyan doğrudur.",
        '',
        'FORMÜLLER',
        "   f'(a) = lim(h→0) [f(a+h) − f(a)] / h",
        '   Teğet:  y = f(a) + f\'(a)·(x − a)   (nokta-eğim: y − f(a) = f\'(a)(x − a))',
        "   Normal (dik) doğru:  y = f(a) − (1/f'(a))·(x − a)   (f'(a) ≠ 0)",
        "   Teğetin x ekseniyle açısı:  θ = arctan f'(a)   (−90° < θ < 90°)",
        "   Lineer yaklaşım:  f(x) ≈ f(a) + f'(a)·(x − a),  x, a'ya yakınken.",
        '   Hızlı türevler:  (xⁿ)\' = n·xⁿ⁻¹,  (sin x)\' = cos x,  (cos x)\' = −sin x,  (e^(cx))\' = c·e^(cx)',
        '',
        'EĞİM İŞARETİ',
        "   - f'(a) > 0: f artıyor; teğet yukarı eğimli (θ > 0).",
        "   - f'(a) < 0: f azalıyor; teğet aşağı eğimli (θ < 0).",
        "   - f'(a) = 0: yatay teğet (olası tepe, çukur ya da büküm).",
        "   - |f'(a)| büyükse grafik dik, küçükse yatıktır.",
        '',
        'YÖNTEM (a noktasında teğet bulma)',
        '   1. Önce noktayı bulalım: (a, f(a)).',
        "   2. f'(x)'i hesaplayalım (limit tanımıyla ya da kurallarla).",
        "   3. f'(a)'yı bularak eğimi elde ederiz.",
        '   4. Nokta-eğim denklemine yazarız: y − f(a) = f\'(a)(x − a).',
        '   5. İstersek y = mx + n biçimine düzenleyebiliriz; normal için eğim −1/m olur.',
        '',
        'YÖNTEM (eğimi verilen teğet / paralel / yatay teğet)',
        "   1. f'(x) = istenen eğim denklemini kurarız (yatay teğet: f'(x) = 0; y = sx + q'ya paralel: f'(x) = s; dik: f'(x) = −1/s).",
        '   2. Denklemi çözerek x değerlerini buluruz (bir parabolde bir, kübikte çoğunlukla iki nokta).',
        '   3. Her x için y = f(x) ile noktayı, sonra teğet denklemini yazarız.',
        '',
        'ÖZEL DURUMLAR / DİKKAT EDİLECEKLER',
        "   - Eğim için f'(a) kullanılır, f(a) değil (sık yapılan bir karışıklık).",
        '   - Teğet, grafiği başka noktalarda da kesebilir; yalnızca yakın çevrede "dokunur".',
        '   - Dikey teğette eğim tanımsızdır (ör. x^(1/3), x = 0); türev yoktur.',
        '   - Türevli olmak sürekli olmayı gerektirir; tersi doğru değildir.',
        '   - Paralel doğruların eğimleri eşit, dik doğruların eğimlerinin çarpımı −1\'dir.',
        '',
        'MİNİ ÖRNEK',
        "f(x) = x² + 1, a = 2: f(2) = 5, f'(x) = 2x, f'(2) = 4. Teğet: y − 5 = 4(x − 2), yani y = 4x − 3. Normal: y − 5 = −(1/4)(x − 2). Açı: θ = arctan 4 ≈ 76°.",
        '',
        'KAYDIRICI',
        'Turuncu nokta grafik üzerinde gezdirilebilir ve teğeti anında döner: her noktanın kendi eğimi vardır. Altın nokta sorudaki noktadır.',
      ].join('\n'),
      [
        'THE TANGENT LINE AND THE RATE OF CHANGE',
        "f'(a) is the slope of the TANGENT line to the graph of f at (a, f(a)), and also the INSTANTANEOUS rate of change of f there. Every point of a smooth curve has its own slope; the tangent is the straight line that best matches the curve at that point.",
        '',
        'FORMULAS',
        "   f'(a) = lim(h→0) [f(a+h) − f(a)] / h",
        "   Tangent:  y = f(a) + f'(a)·(x − a)   (point-slope: y − f(a) = f'(a)(x − a))",
        "   Normal (perpendicular) line:  y = f(a) − (1/f'(a))·(x − a)   (f'(a) ≠ 0)",
        "   Angle with the x-axis:  θ = arctan f'(a)   (−90° < θ < 90°)",
        "   Linear approximation:  f(x) ≈ f(a) + f'(a)·(x − a)  for x near a.",
        "   Quick derivatives:  (xⁿ)' = n·xⁿ⁻¹,  (sin x)' = cos x,  (cos x)' = −sin x,  (e^(cx))' = c·e^(cx)",
        '',
        'SIGN OF THE SLOPE',
        "   - f'(a) > 0: f is increasing; the tangent slopes up (θ > 0).",
        "   - f'(a) < 0: f is decreasing; the tangent slopes down (θ < 0).",
        "   - f'(a) = 0: horizontal tangent (possible peak, valley or inflection).",
        "   - A large |f'(a)| means a steep graph, a small one a flat graph.",
        '',
        'METHOD (tangent at a given point a)',
        '   1. First we find the point: (a, f(a)).',
        "   2. We compute f'(x) (from the limit definition or with the rules).",
        "   3. We evaluate f'(a) to get the slope.",
        "   4. We use point-slope form: y − f(a) = f'(a)(x − a).",
        '   5. We can rearrange to y = mx + b if needed; for the normal use slope −1/m.',
        '',
        'METHOD (tangent with a prescribed slope / parallel / horizontal)',
        "   1. We set up f'(x) = required slope (horizontal: f'(x) = 0; parallel to y = sx + q: f'(x) = s; perpendicular: f'(x) = −1/s).",
        '   2. We solve for x (a parabola gives one point, a cubic often two).',
        '   3. For each x we find y = f(x), then write the tangent equation.',
        '',
        'SPECIAL CASES / PITFALLS',
        "   - The slope is f'(a), not f(a).",
        '   - A tangent may cross the graph elsewhere; it only "touches" locally.',
        '   - At a vertical tangent there is no slope (e.g. x^(1/3) at x = 0); no derivative.',
        '   - Differentiable implies continuous; the converse is false.',
        '   - Parallel lines have equal slopes; perpendicular slopes multiply to −1.',
        '',
        'MINI EXAMPLE',
        "f(x) = x² + 1, a = 2: f(2) = 5, f'(x) = 2x, f'(2) = 4. Tangent: y − 5 = 4(x − 2), i.e. y = 4x − 3. Normal: y − 5 = −(1/4)(x − 2). Angle: θ = arctan 4 ≈ 76°.",
        '',
        'SLIDER',
        'The orange point can be moved along the graph and its tangent rotates instantly: every point has its own slope. The gold point is the one from the question.',
      ].join('\n'));
  }

  // ---------- steps ----------
  function pointSlope(fa, m, aStr) {
    if (evZero(m)) return 'y = ' + evS(fa);
    const left = evZero(fa) ? 'y' : (fa.n < 0 ? 'y + ' + evS(evAbs(fa)) : 'y − ' + evS(fa));
    const aZero = aStr === '0';
    let right;
    if (m.r === 1 && m.d === 1 && Math.abs(m.n) === 1) {
      const sgn = m.n < 0 ? '−' : '';
      right = aZero ? sgn + 'x' : (sgn ? '−(x − ' + aStr + ')' : 'x − ' + aStr);
    } else {
      const c = '(' + evS(m) + ')';
      right = aZero ? c + 'x' : c + '(x − ' + aStr + ')';
    }
    return left + ' = ' + right;
  }
  function tangentText(fa, m, aStr, aRat) {
    const rm = evRat(m), rf = evRat(fa);
    if (aRat !== null && rm && rf) {
      const c = frAdd(rf, frNeg(frMul(rm, fr(aRat))));
      const ps = pointSlope(fa, m, aStr);
      return ps + '  ⇒  ' + lineS(rm, c);
    }
    return pointSlope(fa, m, aStr);
  }
  function dqLines(p, a) {
    const L = [];
    if (p.kind === 'poly' && p.co.length === 3) {
      const A = p.co[2], B = p.co[1];
      L.push(`f(a+h) − f(a) = ${P(A)}[(a+h)² − a²] + ${P(B)}h = ${P(A)}(2a·h + h²) + ${P(B)}h`);
      L.push(`${Tx('Fark oranı', 'Difference quotient')} = ${P(A)}(2a + h) + ${P(B)} = ${termH([[2 * A * a + B, ''], [A, 'h']])}   (a = ${S(a)})`);
    } else if (p.kind === 'poly') {
      const A = p.co[3], B = p.co[1];
      L.push(`f(a+h) − f(a) = ${P(A)}[(a+h)³ − a³] + ${P(B)}h = ${P(A)}(3a²h + 3a·h² + h³) + ${P(B)}h`);
      L.push(`${Tx('Fark oranı', 'Difference quotient')} = ${P(A)}(3a² + 3a·h + h²) + ${P(B)} = ${termH([[3 * A * a * a + B, ''], [3 * A * a, 'h'], [A, 'h²']])}   (a = ${S(a)})`);
    }
    return L;
  }

  function stepsAt(p, a, tag) {
    const steps = [];
    let n = 1;
    const E = exactAt(p, a), fa = E.fa, m = E.m;
    const aS = aStrOf(p, a);
    steps.push(Tx(`── ${n}) Nokta ──\nf(x) = ${fStr(p)},  a = ${aS}\nf(${aS}) = ${evS(fa)}   ⇒ P(${aS}, ${evS(fa)})`,
      `── ${n}) The point ──\nf(x) = ${fStr(p)},  a = ${aS}\nf(${aS}) = ${evS(fa)}   ⇒ P(${aS}, ${evS(fa)})`));
    n++;
    if (p.kind === 'poly') {
      const dl = dqLines(p, a);
      steps.push(Tx(`── ${n}) Limit tanımıyla türev ──\n${dl.join('\n')}\nm = lim(h→0) (…) = ${evS(m)}\nKontrol (kuvvet kuralı): f'(x) = ${dStr(p)}  ⇒  f'(${aS}) = ${evS(m)}.`,
        `── ${n}) Derivative from the definition ──\n${dl.join('\n')}\nm = lim(h→0) (…) = ${evS(m)}\nCheck (power rule): f'(x) = ${dStr(p)}  ⇒  f'(${aS}) = ${evS(m)}.`));
    } else {
      steps.push(Tx(`── ${n}) Türev ──\nf'(x) = ${dStr(p)}   (türev tablosu: (sin x)' = cos x, (cos x)' = −sin x, (e^(cx))' = c·e^(cx))\nm = f'(${aS}) = ${evS(m)}`,
        `── ${n}) The derivative ──\nf'(x) = ${dStr(p)}   (derivative table: (sin x)' = cos x, (cos x)' = −sin x, (e^(cx))' = c·e^(cx))\nm = f'(${aS}) = ${evS(m)}`));
    }
    n++;
    const sgnTr = evZero(m) ? "f'(a) = 0: teğet yatay (olası tepe, çukur ya da büküm)." : (m.n > 0 ? "f'(a) > 0: f bu noktada artıyor, teğet yukarı eğimli." : "f'(a) < 0: f bu noktada azalıyor, teğet aşağı eğimli.");
    const sgnEn = evZero(m) ? "f'(a) = 0: the tangent is horizontal (possible peak, valley or inflection)." : (m.n > 0 ? "f'(a) > 0: f is increasing here, the tangent slopes up." : "f'(a) < 0: f is decreasing here, the tangent slopes down.");
    steps.push(Tx(`── ${n}) Eğim ──\nm = f'(${aS}) = ${evS(m)} ≈ ${nf(evVal(m), 3)}\n${sgnTr}`, `── ${n}) Slope ──\nm = f'(${aS}) = ${evS(m)} ≈ ${nf(evVal(m), 3)}\n${sgnEn}`));
    n++;
    const tl = tangentText(fa, m, aS, tag);
    steps.push(Tx(`── ${n}) Teğet doğrusu ──\ny − f(a) = f'(a)(x − a)\n${tl}`, `── ${n}) Tangent line ──\ny − f(a) = f'(a)(x − a)\n${tl}`));
    n++;
    if (evZero(m)) {
      steps.push(Tx(`── ${n}) Normal doğru ──\nm = 0 ⇒ teğet yatay (y = ${evS(fa)}); ona dik doğru DİKEYDİR: x = ${aS} (eğimi tanımsız).`,
        `── ${n}) Normal line ──\nm = 0 ⇒ the tangent is horizontal (y = ${evS(fa)}); the perpendicular is VERTICAL: x = ${aS} (its slope does not exist).`));
    } else {
      const mn = evNeg(evInv(m));
      const nl = tangentText(fa, mn, aS, tag);
      steps.push(Tx(`── ${n}) Normal doğru ──\nEğim = −1/m = ${evS(mn)}\n${nl}`, `── ${n}) Normal line ──\nSlope = −1/m = ${evS(mn)}\n${nl}`));
    }
    n++;
    const th = Math.atan(evVal(m)) * 180 / Math.PI;
    steps.push(Tx(`── ${n}) Teğetin açısı ──\nθ = arctan(m) = arctan(${nf(evVal(m), 3)}) ≈ ${nf(th, 2)}°  (x ekseninin pozitif yönüne göre)`,
      `── ${n}) Angle of the tangent ──\nθ = arctan(m) = arctan(${nf(evVal(m), 3)}) ≈ ${nf(th, 2)}°  (measured from the positive x-axis)`));
    return steps;
  }

  function stepsWhere(p) {
    const steps = [];
    const hor = p.mode === 'horiz';
    const f = fStr(p), d = dStr(p);
    const target = hor ? 0 : p.s;
    let n = 1;
    steps.push(Tx(`── ${n}) Fikir ──\nTeğetin eğimi f'(x)'tir. ${hor ? 'Yatay teğet için eğimin 0 olması gerekir:' : `${slopeLineS(p)} doğrusunun eğimi ${S(p.s)}; paralel doğruların eğimleri eşit olduğundan`} f'(x) = ${S(target)}.`,
      `── ${n}) Idea ──\nThe slope of the tangent is f'(x). ${hor ? 'A horizontal tangent needs slope 0, so' : `The line ${slopeLineS(p)} has slope ${S(p.s)}; parallel lines have equal slopes, so`} f'(x) = ${S(target)}.`));
    n++;
    steps.push(Tx(`── ${n}) Türev ──\nf(x) = ${f}  ⇒  f'(x) = ${d}   (kuvvet kuralı)`, `── ${n}) The derivative ──\nf(x) = ${f}  ⇒  f'(x) = ${d}   (power rule)`));
    n++;
    const quad = p.co.length === 3;
    let solTr, solEn;
    const x0 = p.pts[p.pts.length - 1];
    if (quad) {
      const A = p.co[2], B = p.co[1];
      const rhs = target - B;
      solTr = `${d} = ${S(target)}  ⇒  ${S(2 * A)}x = ${S(rhs)}  ⇒  x = ${S(x0)}`;
      solEn = solTr;
    } else {
      const A = p.co[3], B = p.co[1];
      const rhs = target - B;
      solTr = `${d} = ${S(target)}  ⇒  ${S(3 * A)}x² = ${S(rhs)}  ⇒  x² = ${S(x0 * x0)}  ⇒  x = ${P(-x0)}  veya  x = ${S(x0)}`;
      solEn = `${d} = ${S(target)}  ⇒  ${S(3 * A)}x² = ${S(rhs)}  ⇒  x² = ${S(x0 * x0)}  ⇒  x = ${P(-x0)}  or  x = ${S(x0)}`;
    }
    steps.push(Tx(`── ${n}) Denklemi çözme ──\n${solTr}`, `── ${n}) Solve the equation ──\n${solEn}`));
    n++;
    const ys = p.pts.map((x) => evalP(p.co, x));
    const ptTxt = p.pts.map((x, i) => `f(${S(x)}) = ${S(ys[i])}  ⇒  (${S(x)}, ${S(ys[i])})`).join('\n');
    steps.push(Tx(`── ${n}) Noktalar ──\n${ptTxt}`, `── ${n}) The points ──\n${ptTxt}`));
    n++;
    const tl = p.pts.map((x, i) => {
      const c = ys[i] - target * x;
      return `x = ${S(x)}: y − ${P(ys[i])} = ${S(target)}(x − ${P(x)})  ⇒  ${lineS(fr(target), fr(c))}`;
    }).join('\n');
    steps.push(Tx(`── ${n}) Teğet doğruları ──\n${tl}`, `── ${n}) Tangent lines ──\n${tl}`));
    return steps;
  }

  function solveSteps(p) {
    let steps;
    if (p.mode === 'at') steps = stepsAt(p, p.a, p.aRat);
    else steps = stepsWhere(p);
    // explorer reading
    const x = p.x, fx = F(p, x), sx = dF(p, x);
    const n = steps.length + 1;
    const th = Math.atan(sx) * 180 / Math.PI;
    steps.push(Tx(`── ${n}) Kaydırıcıdaki nokta ──\nx = ${nf(x, 2)}: f(x) ≈ ${nf(fx, 3)}, eğim f'(x) ≈ ${nf(sx, 3)}, teğet açısı ≈ ${nf(th, 1)}°.\n${Math.abs(sx) < 0.05 ? 'Eğim ≈ 0: teğet yatay (durağan nokta).' : (sx > 0 ? 'Eğim pozitif: grafik artıyor.' : 'Eğim negatif: grafik azalıyor.')}\nNoktayı kaydırarak izleyebiliriz: teğet sürekli döner, her noktanın kendi eğimi vardır.`,
      `── ${n}) The slider point ──\nx = ${nf(x, 2)}: f(x) ≈ ${nf(fx, 3)}, slope f'(x) ≈ ${nf(sx, 3)}, tangent angle ≈ ${nf(th, 1)}°.\n${Math.abs(sx) < 0.05 ? 'Slope ≈ 0: the tangent is horizontal (stationary point).' : (sx > 0 ? 'Positive slope: the graph is rising.' : 'Negative slope: the graph is falling.')}\nIf we drag the point, the tangent keeps rotating, every point has its own slope.`));
    return steps;
  }

  // ---------- drawing ----------
  const X0 = -4, X1 = 4;
  let vx0 = X0, vx1 = X1;
  function focus(p) {
    const x = p.mode === 'at' ? p.a : p.pts[p.pts.length - 1];
    const y = F(p, x);
    return (isFinite(x) && isFinite(y)) ? { x, y } : null;
  }
  function viewY(p) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 160; i++) {
      const y = F(p, X0 + (X1 - X0) * i / 160);
      if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    if (!isFinite(lo)) { lo = -6; hi = 6; }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (hi - lo > 50) { const ya = F(p, p.a); const c = isFinite(ya) ? ya : 0; lo = c - 25; hi = c + 25; }
    const pad = Math.max(1, (hi - lo) * 0.1);
    return [lo - pad, hi + pad];
  }
  function drawLine(canvas, p, x0, y0, m, color, thick, dashed) {
    if (!isFinite(m) || !isFinite(y0)) return;
    canvas.addSegment({ x1: vx0, y1: y0 + m * (vx0 - x0), x2: vx1, y2: y0 + m * (vx1 - x0), color, thickness: thick, dashed });
  }
  function draw(canvas, p) {
    try {
      const [yLo0, yHi0] = viewY(p);
      const fp = focus(p) || { x: (X0 + X1) / 2, y: (yLo0 + yHi0) / 2 };
      const hw = (X1 - X0) / 2, hh = (yHi0 - yLo0) / 2;
      const yLo = fp.y - hh, yHi = fp.y + hh;
      vx0 = fp.x - hw; vx1 = fp.x + hw;
      canvas.setViewport(vx0, vx1, yLo, yHi);
      canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 3, label: 'f(x) = ' + fStr(p) });
      const pts = p.mode === 'at' ? [p.a] : p.pts;
      pts.forEach((x0) => {
        const y0 = F(p, x0), m = dF(p, x0);
        if (!isFinite(y0) || !isFinite(m)) return;
        drawLine(canvas, p, x0, y0, m, canvas.green(), 2, true);
        if (p.showNormal && p.mode === 'at') {
          if (Math.abs(m) < 1e-9) canvas.addSegment({ x1: x0, y1: yLo, x2: x0, y2: yHi, color: canvas.blue(), thickness: 1.5, dashed: true });
          else drawLine(canvas, p, x0, y0, -1 / m, canvas.blue(), 1.5, true);
        }
        canvas.addMarker({ x: x0, y: y0, color: canvas.gold(), radius: 7, label: `(${nf(x0, 2)}, ${nf(y0, 2)})` });
      });
      if (p.mode === 'slope') {
        // the parallel reference line y = s x + q
        drawLine(canvas, p, 0, p.q, p.s, canvas.gray(), 1.5, true);
      }
      const x = p.x, fx = F(p, x), sx = dF(p, x);
      if (isFinite(fx) && isFinite(sx)) {
        drawLine(canvas, p, x, fx, sx, canvas.orange(), 2.5, false);
        canvas.addMarker({ x, y: fx, color: canvas.orange(), radius: 6, label: `m = ${nf(sx, 2)}` });
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: Tx('Nokta konumu (x)', 'Point position (x)'), min: X0, max: X1, step: 0.05,
      get: () => getProblem().x,
      set: (v) => { getProblem().x = Math.max(X0, Math.min(X1, v)); },
    });
    h.addCheckbox({
      caption: Tx('Normal doğruyu göster (soru noktasında)', 'Show the normal line (at the question point)'),
      get: () => getProblem().showNormal,
      set: (v) => { getProblem().showNormal = !!v; },
    });
  }

  Topics.register('derivatives', {
    id: 'tangentRate',
    tabTitle: () => Tx('Değişim Hızı Olarak Teğet', 'Tangent as Rate of Change'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus,
    buildControls,
    _test: { F, dF }, // numeric self-checks (tests/)
    challenge: {
      prompt: (p) => {
        const f = fStr(p);
        if (p.mode === 'horiz') return Tx(`f(x) = ${f} grafiğinde teğetin YATAY olduğu noktalardan x değeri EN BÜYÜK olanın x değeri kaçtır?`, `On the graph of f(x) = ${f}, what is the x-value of the LARGEST point where the tangent is HORIZONTAL?`);
        if (p.mode === 'slope') return Tx(`f(x) = ${f} grafiğinde teğetin eğimi ${S(p.s)} olan noktalardan x değeri EN BÜYÜK olanın x değeri kaçtır?`, `On the graph of f(x) = ${f}, what is the x-value of the LARGEST point where the tangent has slope ${S(p.s)}?`);
        return Tx(`f(x) = ${f} için x = ${aStrOf(p, p.a)} noktasında teğetin eğimi f′(a) kaçtır? (Ondalık, 2 basamak.)`, `For f(x) = ${f}, what is the tangent slope f′(a) at x = ${aStrOf(p, p.a)}? (Decimal, 2 places.)`);
      },
      target: (p) => (p.mode === 'at' ? dF(p, p.a) : p.a),
      tol: (p) => { const t = p.mode === 'at' ? dF(p, p.a) : p.a; return Math.max(0.011, 0.005 * Math.abs(t)); },
      hint: (p) => (p.mode === 'at' ? Tx('Önce türevi yazalım, sonra x = a koyalım.', 'First write the derivative, then plug in x = a.') : Tx('Önce f′(x) = istenen eğim denklemini kuralım.', 'First set up the equation f′(x) = the required slope.')),
    },
    links: [
      { match: /^(YÖNTEM \(a noktasında|METHOD \(tangent at a given point)/, make: (rng) => gen(rng, rng.nextInt(0, 6)) },
      { match: /^(YÖNTEM \(eğimi verilen|METHOD \(tangent with a prescribed)/, make: (rng) => gen(rng, rng.nextInt(9, 12)) },
      { match: /^\s+- f'\(a\) = 0:/, make: (rng) => gen(rng, rng.nextInt(6, 9)) },
      { match: /^\s+(Hızlı türevler|Quick derivatives):/, make: (rng) => gen(rng, rng.nextInt(12, 16)) },
    ],
  });
})();
