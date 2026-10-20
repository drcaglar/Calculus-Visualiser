// Derivatives of inverse functions and inverse trigonometric functions (chapter 'derivatives'; Thomas 3.8-3.9, Stewart 3.6).
// problem.kind: 'invPoly' f = A x^3 + B x + C, (f^-1)'(b) | 'invExp' f = base^x + x, (f^-1)'(b)
//   'asinK' arcsin(kx) | 'acosK' arccos(kx) | 'atanK' arctan(kx) | 'atanSq' arctan(x^2) | 'atanExp' arctan(e^x)
//   'xacos' x arccos x | 'xatan' x arctan x | 'asecK' arcsec(kx)
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 4 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
  }
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = (n) => (n === 1 ? '' : String(n).split('').map((c) => SUP[c] || c).join(''));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  function fr(n, d) { if (d === undefined) d = 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g; if (n === 0) { n = 0; d = 1; } return { n, d }; }
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const frV = (x) => x.n / x.d;
  const cf = (c, s) => (c === 1 ? s : c === -1 ? '−' + s : S(c) + s);
  const plus = (a, b) => (b[0] === '−' ? `${a} − ${b.slice(1)}` : `${a} + ${b}`);
  const cl = (v) => (isFinite(v) && Math.abs(v) < 1e4 ? v : NaN);
  function lineStr(m, c) { // y = m x + c
    const a = Math.abs(m) < 5e-5 ? '' : (Math.abs(m - 1) < 5e-5 ? 'x' : Math.abs(m + 1) < 5e-5 ? '−x' : nf(m) + 'x');
    if (!a) return 'y = ' + nf(c);
    if (Math.abs(c) < 5e-5) return 'y = ' + a;
    return 'y = ' + a + (c < 0 ? ' − ' + nf(-c) : ' + ' + nf(c));
  }
  const RNG = new Rng();
  const PI = Math.PI;
  const P = (s) => { s = String(s); return (s[0] === '−' || s[0] === '-') ? '(' + s + ')' : s; };

  const KINDS = ['invPoly', 'invExp', 'asinK', 'acosK', 'atanK', 'atanSq', 'atanExp', 'xacos', 'xatan', 'asecK', 'acotK', 'acscK'];
  const isInv = (k) => k === 'invPoly' || k === 'invExp';
  function kindName(k) {
    switch (k) {
      case 'invPoly': return Tx('(f⁻¹)′(b), polinom f', '(f⁻¹)′(b), polynomial f');
      case 'invExp': return Tx('(f⁻¹)′(b), üstel f', '(f⁻¹)′(b), exponential f');
      case 'asinK': return 'arcsin(kx)';
      case 'acosK': return 'arccos(kx)';
      case 'atanK': return 'arctan(kx)';
      case 'atanSq': return 'arctan(x²)';
      case 'atanExp': return 'arctan(eˣ)';
      case 'xacos': return 'x·arccos x';
      case 'xatan': return 'x·arctan x';
      case 'acotK': return 'arccot(kx)';
      case 'acscK': return 'arccsc(kx)';
      default: return 'arcsec(kx)';
    }
  }

  // ---------- the functions ----------
  const asinOK = (u) => Math.abs(u) < 1;
  function F(p, x) {
    switch (p.kind) {
      case 'invPoly': return p.A * x * x * x + p.B * x + p.C;
      case 'invExp': return (p.base === 0 ? Math.exp(x) : Math.pow(p.base, x)) + x;
      case 'asinK': return asinOK(p.k * x) ? Math.asin(p.k * x) : NaN;
      case 'acosK': return asinOK(p.k * x) ? Math.acos(p.k * x) : NaN;
      case 'atanK': return Math.atan(p.k * x);
      case 'atanSq': return Math.atan(x * x);
      case 'atanExp': return Math.atan(Math.exp(x));
      case 'xacos': return asinOK(x) ? x * Math.acos(x) : NaN;
      case 'xatan': return x * Math.atan(x);
      case 'acotK': return PI / 2 - Math.atan(p.k * x);
      case 'acscK': return Math.abs(p.k * x) > 1 ? Math.asin(1 / (p.k * x)) : NaN;
      default: return Math.abs(p.k * x) > 1 ? Math.acos(1 / (p.k * x)) : NaN;
    }
  }
  function D(p, x) {
    let y;
    switch (p.kind) {
      case 'invPoly': y = 3 * p.A * x * x + p.B; break;
      case 'invExp': y = (p.base === 0 ? 1 : Math.log(p.base)) * (p.base === 0 ? Math.exp(x) : Math.pow(p.base, x)) + 1; break;
      case 'asinK': y = asinOK(p.k * x) ? p.k / Math.sqrt(1 - p.k * p.k * x * x) : NaN; break;
      case 'acosK': y = asinOK(p.k * x) ? -p.k / Math.sqrt(1 - p.k * p.k * x * x) : NaN; break;
      case 'atanK': y = p.k / (1 + p.k * p.k * x * x); break;
      case 'atanSq': y = 2 * x / (1 + Math.pow(x, 4)); break;
      case 'atanExp': y = Math.exp(x) / (1 + Math.exp(2 * x)); break;
      case 'xacos': y = asinOK(x) ? Math.acos(x) - x / Math.sqrt(1 - x * x) : NaN; break;
      case 'xatan': y = Math.atan(x) + x / (1 + x * x); break;
      case 'acotK': y = -p.k / (1 + p.k * p.k * x * x); break;
      case 'acscK': y = Math.abs(p.k * x) > 1 ? -1 / (Math.abs(x) * Math.sqrt(p.k * p.k * x * x - 1)) : NaN; break;
      default: y = Math.abs(p.k * x) > 1 ? 1 / (Math.abs(x) * Math.sqrt(p.k * p.k * x * x - 1)) : NaN;
    }
    return isFinite(y) ? y : NaN;
  }
  // inverse of the increasing function f (bisection on [-12, 12])
  function Finv(p, y) {
    let lo = -12, hi = 12;
    if (!(F(p, lo) <= y && y <= F(p, hi))) return NaN;
    for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (F(p, m) < y) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  // ---------- strings ----------
  function fStr(p) {
    switch (p.kind) {
      case 'invPoly': {
        let s = cf(p.A, 'x³');
        s = plus(s, cf(p.B, 'x'));
        if (p.C !== 0) s = plus(s, S(p.C));
        return s;
      }
      case 'invExp': return `${p.base === 0 ? 'e' : p.base}^x + x`;
      case 'asinK': return `arcsin(${cf(p.k, 'x')})`;
      case 'acosK': return `arccos(${cf(p.k, 'x')})`;
      case 'atanK': return `arctan(${cf(p.k, 'x')})`;
      case 'atanSq': return 'arctan(x²)';
      case 'atanExp': return 'arctan(e^x)';
      case 'xacos': return 'x·arccos x';
      case 'xatan': return 'x·arctan x';
      case 'acotK': return `arccot(${cf(p.k, 'x')})`;
      case 'acscK': return `arccsc(${cf(p.k, 'x')})`;
      default: return `arcsec(${cf(p.k, 'x')})`;
    }
  }
  const k2 = (p) => (p.k * p.k === 1 ? '' : String(p.k * p.k));
  function dStr(p) {
    switch (p.kind) {
      case 'invPoly': return plus(cf(3 * p.A, 'x²'), S(p.B));
      case 'invExp': return p.base === 0 ? 'e^x + 1' : `ln ${p.base}·${p.base}^x + 1`;
      case 'asinK': return `${S(p.k)} / √(1 − ${k2(p)}x²)`;
      case 'acosK': return `${S(-p.k)} / √(1 − ${k2(p)}x²)`;
      case 'atanK': return `${S(p.k)} / (1 + ${k2(p)}x²)`;
      case 'atanSq': return '2x / (1 + x⁴)';
      case 'atanExp': return 'e^x / (1 + e^(2x))';
      case 'xacos': return 'arccos x − x / √(1 − x²)';
      case 'xatan': return 'arctan x + x / (1 + x²)';
      case 'acotK': return `${S(-p.k)} / (1 + ${k2(p)}x²)`;
      case 'acscK': return `−1 / (|x|·√(${k2(p)}x² − 1))`;
      default: return `1 / (|x|·√(${k2(p)}x² − 1))`;
    }
  }
  function domStr(p) { // interval where f' exists
    const e = p.k === 1 ? '1' : `1/${p.k}`;
    switch (p.kind) {
      case 'asinK': case 'acosK': return `(−${e}, ${e})`;
      case 'xacos': return '(−1, 1)';
      case 'asecK': case 'acscK': return `(−∞, −${e}) ∪ (${e}, ∞)`;
      default: return '(−∞, ∞)';
    }
  }
  const needDom = (k) => k === 'asinK' || k === 'acosK' || k === 'asecK' || k === 'acscK' || k === 'xacos';

  // ---------- generation ----------
  const TS = [fr(0), fr(3, 5), fr(-3, 5), fr(4, 5), fr(-4, 5), fr(1, 2), fr(-1, 2)];
  function gen(rng, kind) {
    const p = { kind, a: 1, aS: '1', x: 1, showD: true, showTan: true };
    switch (kind) {
      case 'invPoly': {
        p.A = rng.pick([1, 1, 2]); p.B = rng.pick([1, 2, 3]); p.C = rng.nextInt(-3, 4);
        p.a = rng.pick([-2, -1, 0, 1, 2]); break;
      }
      case 'invExp':
        p.base = rng.pick([0, 2, 3, 2]);
        p.a = p.base === 0 ? 0 : rng.pick([0, 1, 2]); break;
      case 'asinK': case 'acosK': {
        p.k = rng.pick([1, 2, 3, 4]); const t = rng.pick(TS); const a = fr(t.n, t.d * p.k);
        p.a = frV(a); p.aS = frS(a); break;
      }
      case 'atanK': case 'acotK': p.k = rng.pick([1, 2, 3, -1, -2]); p.a = rng.pick([-2, -1, 1, 2]); break;
      case 'atanSq': p.a = rng.pick([-2, -1, 1, 2]); break;
      case 'atanExp': p.a = rng.pick([-1, 0, 1]); break;
      case 'xacos': {
        const t = rng.pick([fr(0), fr(3, 5), fr(-3, 5), fr(4, 5), fr(-4, 5)]);
        p.a = frV(t); p.aS = frS(t); break;
      }
      case 'xatan': p.a = rng.pick([-2, -1, 1, 2]); break;
      case 'acscK': default: {
        p.k = rng.pick([1, 2, 3]);
        do { p.a = rng.pick([-3, -2, -1, 1, 2, 3]); } while (Math.abs(p.k * p.a) <= 1);
      }
    }
    if (!/\//.test(p.aS) || p.aS === '1') { if (Number.isInteger(p.a)) p.aS = S(p.a); }
    if (isInv(kind)) p.b = F(p, p.a);
    p.x = p.a;
    return p;
  }
  function createProblem(rng) {
    return gen(rng, rng.pick(['invPoly', 'invPoly', 'invExp', 'asinK', 'acosK', 'atanK', 'atanSq', 'atanExp', 'xacos', 'xatan', 'asecK']));
  }

  function problemStatement(p) {
    if (isInv(p.kind)) {
      const b = S(Math.round(p.b));
      return Tx(`f(x) = ${fStr(p)} fonksiyonu birebirdir (sürekli artandır). f⁻¹ formülünü yazmadan (f⁻¹)′(${b}) değerini bulalım. Sonra f⁻¹ grafiğine x = ${b} noktasında çizilen teğetin denklemi nedir, hesaplayalım.`,
        `The function f(x) = ${fStr(p)} is one-to-one (always increasing). Without writing a formula for f⁻¹, let's find (f⁻¹)′(${b}). Then we can work out the equation of the tangent to the graph of f⁻¹ at x = ${b}.`);
    }
    const dom = needDom(p.kind);
    return Tx(`f(x) = ${fStr(p)} fonksiyonunun türevini bulalım. Sonra f′(${p.aS}) değerini ve x = ${p.aS} noktasındaki teğet doğrusunun denklemini yazalım${dom ? '; ayrıca f′ türevinin var olduğu x aralığını da belirleyelim' : ''}.`,
      `Let's find the derivative of f(x) = ${fStr(p)}. Then we can evaluate f′(${p.aS}) and write the tangent line at x = ${p.aS}${dom ? '; we can also decide on which x-interval f′ exists' : ''}.`);
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      [
        'TERS FONKSİYON VE TERS TRİGONOMETRİK TÜREVLER',
        'Bir fonksiyonun tersinin türevini, tersin formülünü bulmadan hesaplayabiliriz. Ters trigonometrik fonksiyonlar (arcsin, arctan ...) mühendislikte açı bulmak için sürekli kullanılır: robot kolu açıları, eğik düzlem, titreşim fazı, sensör kalibrasyonu.',
        '',
        'TERS FONKSİYONUN TÜREVİ',
        'f birebir ve türevlenebilir, f′(a) ≠ 0 ve f(a) = b olsun. O zaman:',
        '   (f⁻¹)′(b) = 1 / f′(a),   yani   (f⁻¹)′(b) = 1 / f′(f⁻¹(b))',
        'Neden? f⁻¹(f(x)) = x eşitliğinin türevini zincir kuralıyla alırsak (f⁻¹)′(f(x))·f′(x) = 1 gelir.',
        '',
        'ANLAMI (GRAFİK)',
        'f⁻¹ grafiği, f grafiğinin y = x doğrusuna göre aynadaki görüntüsüdür. (a, b) noktasındaki teğet eğimi m ise, ayna görüntüsü olan (b, a) noktasındaki teğetin eğimi 1/m olur: eğimler çarpımı 1\'dir.',
        '',
        'YÖNTEM: (f⁻¹)′(b)',
        '   1. f\'nin birebir olduğunu görelim (f′ hep pozitif ya da hep negatif).',
        '   2. f(a) = b denklemini çözüp a\'yı bulalım (çoğu zaman küçük tam sayılar denenir).',
        '   3. f′(a) değerini hesaplayalım (f⁻¹ formülü gerekmez).',
        '   4. (f⁻¹)′(b) = 1 / f′(a) deriz.',
        '',
        'TERS TRİGONOMETRİK TÜREVLER',
        '   - (arcsin x)′ = 1/√(1 − x²)        (−1 < x < 1)',
        '   - (arccos x)′ = −1/√(1 − x²)       (−1 < x < 1)',
        '   - (arctan x)′ = 1/(1 + x²)          (her x)',
        '   - (arccot x)′ = −1/(1 + x²)         (her x)',
        '   - (arcsec x)′ = 1/(|x|√(x² − 1))   (|x| > 1)',
        '   - (arccsc x)′ = −1/(|x|√(x² − 1))  (|x| > 1)',
        'Zincirli hal: (arcsin g)′ = g′/√(1 − g²),  (arctan g)′ = g′/(1 + g²) ve benzerleri.',
        '',
        'ARCSIN TÜREVİNİN KISA ÇIKARIMI',
        'y = arcsin x ise sin y = x olur. Kapalı türev: cos y·y′ = 1, yani y′ = 1/cos y. y, [−π/2, π/2] aralığında olduğundan cos y ≥ 0 ve cos y = √(1 − sin² y) = √(1 − x²). Sonuç: y′ = 1/√(1 − x²).',
        '',
        'DİKKAT EDİLECEKLER',
        '   - arcsin ve arccos türevleri yalnızca −1 < x < 1 için vardır; uç noktalarda eğim sonsuz (dikey teğet) olur.',
        '   - (f⁻¹)′(b) = 1/f′(a): f′ hesaplanan nokta a\'dır, b değil. 1/f′ ile (1/f)′ de farklı şeylerdir.',
        '   - f⁻¹ ile 1/f aynı değildir; f⁻¹(x) ters fonksiyon, 1/f(x) çarpmaya göre terstir.',
        '   - arccos türevi arcsin türevinin tam eksilisidir (arcsin x + arccos x = π/2).',
        '',
        'MİNİ ÖRNEK',
        'f(x) = x³ + x, b = 2: f(1) = 2 olduğundan a = 1. f′(x) = 3x² + 1, f′(1) = 4, dolayısıyla (f⁻¹)′(2) = 1/4.',
        '',
        'KAYDIRICI',
        'Kaydırıcıyla noktayı gezdirebiliriz. Polinom/üstel örneklerde f ve f⁻¹ teğetlerinin eğimleri çarpımı hep 1\'dir. Ters trigonometrik örneklerde teğetin eğimi, kesikli f′ eğrisinin yüksekliğine eşittir.',
      ].join('\n'),
      [
        'DERIVATIVES OF INVERSE AND INVERSE TRIGONOMETRIC FUNCTIONS',
        'We can find the derivative of an inverse function without ever writing the inverse formula. Inverse trig functions (arcsin, arctan ...) are used to recover angles in engineering: robot-arm angles, inclined planes, vibration phase, sensor calibration.',
        '',
        'DERIVATIVE OF AN INVERSE FUNCTION',
        'Let f be one-to-one and differentiable with f′(a) ≠ 0 and f(a) = b. Then:',
        '   (f⁻¹)′(b) = 1 / f′(a),   that is   (f⁻¹)′(b) = 1 / f′(f⁻¹(b))',
        'Why? Differentiating f⁻¹(f(x)) = x with the chain rule gives (f⁻¹)′(f(x))·f′(x) = 1.',
        '',
        'WHAT DOES IT MEAN? (GRAPH)',
        'The graph of f⁻¹ is the mirror image of the graph of f in the line y = x. If the tangent at (a, b) has slope m, the mirrored tangent at (b, a) has slope 1/m: the two slopes multiply to 1.',
        '',
        'METHOD: (f⁻¹)′(b)',
        '   1. Check that f is one-to-one (f′ stays positive or stays negative).',
        '   2. Solve f(a) = b to find a (often by trying small integers).',
        '   3. Compute f′(a) (no formula for f⁻¹ needed).',
        '   4. Then (f⁻¹)′(b) = 1 / f′(a).',
        '',
        'INVERSE TRIGONOMETRIC DERIVATIVES',
        '   - (arcsin x)′ = 1/√(1 − x²)        (−1 < x < 1)',
        '   - (arccos x)′ = −1/√(1 − x²)       (−1 < x < 1)',
        '   - (arctan x)′ = 1/(1 + x²)          (all x)',
        '   - (arccot x)′ = −1/(1 + x²)         (all x)',
        '   - (arcsec x)′ = 1/(|x|√(x² − 1))   (|x| > 1)',
        '   - (arccsc x)′ = −1/(|x|√(x² − 1))  (|x| > 1)',
        'Chain forms: (arcsin g)′ = g′/√(1 − g²),  (arctan g)′ = g′/(1 + g²) and so on.',
        '',
        'SHORT DERIVATION OF THE ARCSIN DERIVATIVE',
        'If y = arcsin x then sin y = x. Implicit differentiation: cos y·y′ = 1, so y′ = 1/cos y. Since y lies in [−π/2, π/2], cos y ≥ 0 and cos y = √(1 − sin² y) = √(1 − x²). Result: y′ = 1/√(1 − x²).',
        '',
        'COMMON PITFALLS',
        '   - The arcsin and arccos derivatives exist only for −1 < x < 1; at the end points the slope is infinite (vertical tangent).',
        '   - (f⁻¹)′(b) = 1/f′(a): f′ is evaluated at a, not at b. Also (f⁻¹)′ is not the same as (1/f)′.',
        '   - f⁻¹ is not 1/f; f⁻¹(x) is the inverse function, 1/f(x) is the reciprocal.',
        '   - The arccos derivative is exactly the negative of the arcsin one (arcsin x + arccos x = π/2).',
        '',
        'MINI EXAMPLE',
        'f(x) = x³ + x, b = 2: since f(1) = 2, a = 1. f′(x) = 3x² + 1, f′(1) = 4, so (f⁻¹)′(2) = 1/4.',
        '',
        'SLIDER',
        'With the slider we can move the point. In the polynomial/exponential examples the slopes of the tangents of f and f⁻¹ always multiply to 1. In the inverse-trig examples the tangent slope equals the height of the dashed f′ curve.',
      ].join('\n'));
  }

  // ---------- steps ----------
  const hdr = (n, tr, en) => `── ${n}) ${Tx(tr, en)} ──`;
  function invSteps(p) {
    const L = [];
    const a = p.a, b = Math.round(p.b), fp = D(p, a);
    const f = fStr(p), d = dStr(p);
    L.push([hdr(1, 'f birebir mi?', 'Is f one-to-one?'),
      `f(x) = ${f},  f′(x) = ${d}`,
      Tx(`${p.kind === 'invPoly' ? `Her x için f′(x) = ${d} ≥ ${p.B} > 0` : (p.base === 0 ? 'e^x > 0 olduğundan f′(x) = e^x + 1 > 1 > 0' : `${p.base}^x > 0 ve ln ${p.base} > 0 olduğundan f′(x) > 1 > 0`)}; f hep artandır, dolayısıyla birebirdir ve tersi vardır.`,
        `${p.kind === 'invPoly' ? `For every x, f′(x) = ${d} ≥ ${p.B} > 0` : (p.base === 0 ? 'Since e^x > 0, f′(x) = e^x + 1 > 1 > 0' : `Since ${p.base}^x > 0 and ln ${p.base} > 0, f′(x) > 1 > 0`)}; f is always increasing, hence one-to-one, and the inverse exists.`)].join('\n'));
    const trial = [a - 1, a, a + 1].map((t) => `f(${S(t)}) = ${S(Math.round(F(p, t) * 1e9) / 1e9 === Math.round(F(p, t)) ? Math.round(F(p, t)) : nf(F(p, t)))}`);
    L.push([hdr(2, 'f(a) = b denklemini çözelim', 'Solve f(a) = b'),
      Tx(`f⁻¹ formülü yazmadan a'yı bulmak için f(a) = ${S(b)} denklemini çözeriz. Küçük tam sayıları deneyelim:`,
        `To find a without a formula for f⁻¹ we solve f(a) = ${S(b)}. Let's try small integers:`),
      trial.join(',  '),
      Tx(`f(${S(a)}) = ${S(b)} olduğundan a = ${S(a)}. f artan olduğu için başka çözüm yoktur.`, `Since f(${S(a)}) = ${S(b)}, a = ${S(a)}. Because f is increasing there is no other solution.`)].join('\n'));
    const ln_ = p.kind === 'invExp' && p.base !== 0 ? Tx(` (ln ${p.base} ≈ ${nf(Math.log(p.base))})`, ` (ln ${p.base} ≈ ${nf(Math.log(p.base))})`) : '';
    let fpLine;
    if (p.kind === 'invPoly') fpLine = `f′(${S(a)}) = ${3 * p.A}·(${S(a)})² + ${p.B} = ${S(fp)}`;
    else if (p.base === 0) fpLine = `f′(${S(a)}) = e^(${S(a)}) + 1 = ${a === 0 ? '1 + 1 = 2' : '≈ ' + nf(fp)}`;
    else fpLine = `f′(${S(a)}) = ln ${p.base}·${p.base}^(${S(a)}) + 1 ≈ ${nf(fp)}`;
    L.push([hdr(3, 'f′(a) değerini hesaplayalım', 'Compute f′(a)'), fpLine + ln_].join('\n'));
    const exact = (p.kind === 'invPoly' || (p.kind === 'invExp' && p.base === 0 && a === 0)) ? frS(fr(1, Math.round(fp))) : null;
    L.push([hdr(4, 'Ters fonksiyon türevi formülü', 'Inverse-function derivative formula'),
      '(f⁻¹)′(b) = 1 / f′(a)',
      `(f⁻¹)′(${S(b)}) = 1 / f′(${S(a)}) = 1 / ${nf(fp)} = ${exact ? exact + ' ≈ ' : '≈ '}${nf(1 / fp)}`.replace('= ≈', '≈')].join('\n'));
    const m = 1 / fp, c = a - m * b;
    L.push([hdr(5, 'f⁻¹ grafiğine teğet', 'Tangent to the graph of f⁻¹'),
      Tx(`Teğet noktası (b, a) = (${S(b)}, ${S(a)}) ve eğim 1/f′(a) = ${nf(m)}. f grafiğindeki teğetin (a, b) = (${S(a)}, ${S(b)}) noktasındaki eğimi ${nf(fp)}'dir; ayna görüntüsünde eğim tersine döner.`,
        `The point of tangency is (b, a) = (${S(b)}, ${S(a)}) with slope 1/f′(a) = ${nf(m)}. The tangent to f at (a, b) = (${S(a)}, ${S(b)}) has slope ${nf(fp)}; in the mirror image the slope becomes its reciprocal.`),
      `y − ${S(a)} = ${nf(m)}·(x − ${S(b)})`.replace('y − −', 'y + '), lineStr(m, c)].join('\n'));
    const h = 1e-4, num = (Finv(p, b + h) - Finv(p, b - h)) / (2 * h);
    L.push([hdr(6, 'Kontrol', 'Check'),
      Tx(`f⁻¹ sayısal olarak (ikiye bölme ile) hesaplanıp (f⁻¹(b+h) − f⁻¹(b−h)) / (2h), h = 0,0001 alınırsa ${nf(num)} bulunur; formülle bulduğumuz ${nf(m)} ile aynıdır.`,
        `Computing f⁻¹ numerically (by bisection) and taking (f⁻¹(b+h) − f⁻¹(b−h)) / (2h) with h = 0.0001 gives ${nf(num)}, the same as the ${nf(m)} from the formula.`),
      Tx('Ayrıca iki teğetin eğimlerinin çarpımı f′(a)·(1/f′(a)) = 1 olmalıdır.', 'Also the product of the two tangent slopes should be f′(a)·(1/f′(a)) = 1.')].join('\n'));
    return L;
  }

  function arcSteps(p) {
    const L = [];
    const a = p.a, as = p.aS, k = p.k;
    const kx = k === undefined ? '' : cf(k, 'x');
    const ru = (ts, es) => Tx(ts, es);
    switch (p.kind) {
      case 'asinK': case 'acosK': {
        const sgn = p.kind === 'acosK' ? '−' : '';
        const nm = p.kind === 'acosK' ? 'arccos' : 'arcsin';
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = ${nm}(g(x)) ve iç fonksiyon g(x) = ${kx}, g′(x) = ${S(k)}.`, `f(x) = ${nm}(g(x)) with inner function g(x) = ${kx}, g′(x) = ${S(k)}.`),
          Tx(`Kural: (${nm} g)′ = ${sgn}g′ / √(1 − g²).`, `Rule: (${nm} g)′ = ${sgn}g′ / √(1 − g²).`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'),
          `f′(x) = ${sgn}${S(k)} / √(1 − (${kx})²) = ${dStr(p)}`].join('\n'));
        break;
      }
      case 'atanK':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = arctan(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Kural: (arctan g)′ = g′ / (1 + g²).`, `f(x) = arctan(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Rule: (arctan g)′ = g′ / (1 + g²).`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'), `f′(x) = ${S(k)} / (1 + (${kx})²) = ${dStr(p)}`].join('\n'));
        break;
      case 'acotK':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = arccot(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Kural: (arccot g)′ = −g′ / (1 + g²). (Burada arccot, (0, π) değerli olandır: arccot u = π/2 − arctan u.)`, `f(x) = arccot(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Rule: (arccot g)′ = −g′ / (1 + g²). (Here arccot is the one with values in (0, π): arccot u = π/2 − arctan u.)`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'), `f′(x) = −${P(S(k))} / (1 + (${kx})²) = ${dStr(p)}`].join('\n'));
        break;
      case 'acscK':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = arccsc(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Kural: (arccsc g)′ = −g′ / (|g|·√(g² − 1)).`, `f(x) = arccsc(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Rule: (arccsc g)′ = −g′ / (|g|·√(g² − 1)).`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'),
          `f′(x) = −${P(S(k))} / (|${kx}|·√((${kx})² − 1)) = ${dStr(p)}`,
          k > 1 ? Tx(`Payda ve paydadaki ${k} sadeleşir (|${kx}| = ${k}|x| olduğundan).`, `The factor ${k} cancels (since |${kx}| = ${k}|x|).`) : ''].filter(Boolean).join('\n'));
        break;
      case 'atanSq':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx('f(x) = arctan(g(x)), g(x) = x², g′(x) = 2x. Kural: (arctan g)′ = g′ / (1 + g²).', 'f(x) = arctan(g(x)), g(x) = x², g′(x) = 2x. Rule: (arctan g)′ = g′ / (1 + g²).')].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'), 'f′(x) = 2x / (1 + (x²)²) = 2x / (1 + x⁴)'].join('\n'));
        break;
      case 'atanExp':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx('f(x) = arctan(g(x)), g(x) = eˣ, g′(x) = eˣ. Kural: (arctan g)′ = g′ / (1 + g²).', 'f(x) = arctan(g(x)), g(x) = eˣ, g′(x) = eˣ. Rule: (arctan g)′ = g′ / (1 + g²).')].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'), 'f′(x) = e^x / (1 + (e^x)²) = e^x / (1 + e^(2x))'].join('\n'));
        break;
      case 'xacos':
        L.push([hdr(1, 'Çarpım kuralını seçelim', 'Choose the product rule'),
          'u = x,  v = arccos x', 'u′ = 1,  v′ = −1/√(1 − x²)', '(u·v)′ = u′v + uv′'].join('\n'));
        L.push([hdr(2, 'Yerine koyalım', 'Substitute'),
          'f′(x) = 1·arccos x + x·(−1/√(1 − x²))', `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      case 'xatan':
        L.push([hdr(1, 'Çarpım kuralını seçelim', 'Choose the product rule'),
          'u = x,  v = arctan x', 'u′ = 1,  v′ = 1/(1 + x²)', '(u·v)′ = u′v + uv′'].join('\n'));
        L.push([hdr(2, 'Yerine koyalım', 'Substitute'),
          'f′(x) = 1·arctan x + x·1/(1 + x²)', `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      default:
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = arcsec(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Kural: (arcsec g)′ = g′ / (|g|·√(g² − 1)).`, `f(x) = arcsec(g(x)), g(x) = ${kx}, g′ = ${S(k)}. Rule: (arcsec g)′ = g′ / (|g|·√(g² − 1)).`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'),
          `f′(x) = ${S(k)} / (|${kx}|·√((${kx})² − 1)) = ${dStr(p)}`,
          k > 1 ? Tx(`Payda ve paydadaki ${k} sadeleşir (|${kx}| = ${k}|x| olduğundan).`, `The factor ${k} cancels (since |${kx}| = ${k}|x|).`) : ''].filter(Boolean).join('\n'));
    }
    let n = L.length + 1;
    if (needDom(p.kind)) {
      L.push([hdr(n, 'f′ nerede vardır?', 'Where does f′ exist?'),
        (p.kind === 'asecK' || p.kind === 'acscK')
          ? Tx(`√ içinin pozitif ve paydanın sıfırdan farklı olması için ${p.k === 1 ? '|x| > 1' : `|${p.k}x| > 1`} gerekir.`, `For the radicand to be positive and the denominator non-zero we need ${p.k === 1 ? '|x| > 1' : `|${p.k}x| > 1`}.`)
          : Tx(`√'in içi pozitif olmalı: ${p.kind === 'xacos' ? '1 − x² > 0' : `1 − ${k2(p)}x² > 0`}, yani ${p.kind === 'xacos' ? '|x| < 1' : (p.k === 1 ? '|x| < 1' : `|x| < 1/${p.k}`)}.`,
            `The radicand must be positive: ${p.kind === 'xacos' ? '1 − x² > 0' : `1 − ${k2(p)}x² > 0`}, i.e. ${p.kind === 'xacos' ? '|x| < 1' : (p.k === 1 ? '|x| < 1' : `|x| < 1/${p.k}`)}.`),
        Tx(`f′ yalnızca ${domStr(p)} içinde vardır; ${as} bu aralıkta olduğundan hesaplayabiliriz. Uç noktalarda teğet dikeydir.`,
          `f′ exists only on ${domStr(p)}; ${as} lies in it, so we can evaluate. At the end points the tangent is vertical.`)].join('\n'));
      n += 1;
    }
    return L;
  }

  function solveSteps(p) {
    if (isInv(p.kind)) return invSteps(p);
    const out = arcSteps(p);
    let n = out.length + 1;
    const a = p.a, fa = F(p, a), da = D(p, a);
    const lines = [hdr(n, `x = ${p.aS} noktasında değer ve eğim`, `Value and slope at x = ${p.aS}`)];
    const k = p.k;
    if (p.kind === 'asinK' || p.kind === 'acosK') {
      const t = fr(Math.round(k * a * 60), 60);
      const s = Math.sqrt(1 - frV(t) * frV(t));
      lines.push(`${cf(k, 'x')} = ${S(k)}·(${p.aS}) = ${frS(t)},  1 − (${frS(t)})² = ${frS(fr(t.d * t.d - t.n * t.n, t.d * t.d))},  √ ≈ ${nf(s)}`);
    } else if (p.kind === 'xacos') {
      const s = Math.sqrt(1 - a * a);
      lines.push(`arccos(${p.aS}) ≈ ${nf(Math.acos(a))},  √(1 − (${p.aS})²) ≈ ${nf(s)}`);
    }
    lines.push(`f(${p.aS}) ≈ ${nf(fa)}`);
    lines.push(Tx(`f′(x) ifadesinde x = ${p.aS} alırsak:`, `Putting x = ${p.aS} into f′(x):`));
    lines.push(`f′(${p.aS}) ≈ ${nf(da)}`);
    out.push(lines.join('\n'));
    n += 1;
    out.push([hdr(n, 'Teğet doğrusu', 'Tangent line'),
      Tx('Nokta-eğim biçimi: y − f(a) = f′(a)·(x − a).', 'Point-slope form: y − f(a) = f′(a)·(x − a).'),
      `y − ${nf(fa)} = ${nf(da)}·(x − ${a < 0 ? '(' + p.aS + ')' : p.aS})`.replace('y − −', 'y + '),
      lineStr(da, fa - da * a)].join('\n'));
    n += 1;
    const h = 1e-4, num = (F(p, a + h) - F(p, a - h)) / (2 * h);
    out.push([hdr(n, 'Kontrol', 'Check'),
      Tx(`Sayısal türev: (f(a+h) − f(a−h)) / (2h), h = 0,0001 → ${nf(num)}. Bulduğumuz f′(${p.aS}) ≈ ${nf(da)} ile aynı çıktı.`,
        `Numerical derivative: (f(a+h) − f(a−h)) / (2h) with h = 0.0001 gives ${nf(num)}, matching f′(${p.aS}) ≈ ${nf(da)}.`),
      Tx('Grafikte teğetin eğimi, f′ eğrisinin (kesikli) a noktasındaki yüksekliğine eşit olmalıdır.', 'On the graph the tangent slope should equal the height of the dashed f′ curve at a.')].join('\n'));
    return out;
  }

  // ---------- graph ----------
  function drawInv(canvas, p) {
    const V = 8;
    canvas.setViewport(-V, V, -V, V);
    canvas.addFunction({ evaluator: (x) => cl(F(p, x)), color: canvas.accent(), thickness: 3, label: 'f' });
    canvas.addFunction({ evaluator: (x) => cl(Finv(p, x)), color: canvas.green(), thickness: 3, label: 'f⁻¹' });
    canvas.addSegment({ x1: -V, y1: -V, x2: V, y2: V, color: canvas.gray(), thickness: 1.5, dashed: true });
    const x0 = p.x, y0 = F(p, x0), m = D(p, x0);
    if (isFinite(y0) && isFinite(m) && m > 0) {
      if (p.showTan) {
        canvas.addSegment({ x1: -V, y1: y0 + m * (-V - x0), x2: V, y2: y0 + m * (V - x0), color: canvas.orange(), thickness: 2 });
        canvas.addSegment({ x1: -V, y1: x0 + (-V - y0) / m, x2: V, y2: x0 + (V - y0) / m, color: canvas.red(), thickness: 2 });
        canvas.addSegment({ x1: x0, y1: y0, x2: y0, y2: x0, color: canvas.gray(), thickness: 1, dashed: true });
      }
      if (Math.abs(x0) <= V && Math.abs(y0) <= V) canvas.addMarker({ x: x0, y: y0, color: canvas.orange(), radius: 6, label: `(${nf(x0, 2)}, ${nf(y0, 2)}) m = ${nf(m, 2)}` });
      if (Math.abs(x0) <= V && Math.abs(y0) <= V) canvas.addMarker({ x: y0, y: x0, color: canvas.red(), radius: 6, label: `(${nf(y0, 2)}, ${nf(x0, 2)}) m = ${nf(1 / m, 2)}` });
    }
    const b = F(p, p.a);
    if (isFinite(b) && Math.abs(b) <= V) {
      canvas.addMarker({ x: p.a, y: b, color: canvas.gold(), shape: 'diamond', radius: 7, hollow: true, label: `(a, b)` });
      canvas.addMarker({ x: b, y: p.a, color: canvas.gold(), shape: 'diamond', radius: 7, hollow: true, label: `(b, a)` });
    }
  }
  function drawArc(canvas, p) {
    canvas.setViewport(-4, 4, -4, 4);
    canvas.addFunction({ evaluator: (x) => cl(F(p, x)), color: canvas.accent(), thickness: 3, label: 'f(x)' });
    if (p.showD) canvas.addFunction({ evaluator: (x) => cl(D(p, x)), color: canvas.purple(), thickness: 2.5, dashed: true, label: 'f′(x)' });
    if (p.kind === 'atanK' || p.kind === 'atanExp') {
      const sg = p.kind === 'atanK' && p.k < 0 ? -1 : 1;
      canvas.addGuideLine({ axis: 'horizontal', position: sg * PI / 2, color: canvas.gray(), label: sg > 0 ? 'π/2' : '−π/2' });
      if (p.kind === 'atanK') canvas.addGuideLine({ axis: 'horizontal', position: -sg * PI / 2, color: canvas.gray() });
    }
    const x = p.x, fx = F(p, x), dx = D(p, x);
    if (p.showTan && isFinite(fx) && isFinite(dx) && Math.abs(dx) < 1e3) {
      canvas.addSegment({ x1: -4, y1: fx + dx * (-4 - x), x2: 4, y2: fx + dx * (4 - x), color: canvas.orange(), thickness: 2 });
      canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray() });
      canvas.addMarker({ x, y: fx, color: canvas.orange(), radius: 6, label: `f = ${nf(fx, 2)}` });
      if (p.showD && Math.abs(dx) <= 4) canvas.addMarker({ x, y: dx, color: canvas.purple(), radius: 6, label: `f′ = ${nf(dx, 2)}` });
    }
    const fa = F(p, p.a);
    if (isFinite(fa)) canvas.addMarker({ x: p.a, y: fa, color: canvas.gold(), shape: 'diamond', radius: 7, label: `a = ${p.aS}` });
  }
  function draw(canvas, p) {
    try { if (isInv(p.kind)) drawInv(canvas, p); else drawArc(canvas, p); } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSelect({
      options: KINDS.map((k) => ({ label: kindName(k), value: k })),
      get: () => getProblem().kind,
      set: (v) => { Object.assign(getProblem(), gen(RNG, v)); },
    });
    h.addSlider({
      caption: Tx('Nokta (x)', 'Point (x)'), min: -3, max: 3, step: 0.05,
      get: () => getProblem().x,
      set: (v) => { getProblem().x = Math.max(-3, Math.min(3, v)); },
    });
    h.addCheckbox({
      caption: Tx('Teğetleri göster', 'Show the tangents'),
      get: () => getProblem().showTan,
      set: (v) => { getProblem().showTan = !!v; },
    });
    h.addCheckbox({
      caption: Tx('f′ eğrisini göster (ters trigonometrik örneklerde)', 'Show the f′ curve (inverse-trig examples)'),
      get: () => getProblem().showD,
      set: (v) => { getProblem().showD = !!v; },
    });
  }

  Topics.register('derivatives', {
    id: 'inverseDerivatives',
    tabTitle: () => Tx('Ters Fonksiyon ve Ters Trigonometrik Türevler', 'Derivatives of Inverse Functions and Inverse Trigonometric Functions'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s+- \(arcsin x\)′ = /, make: (rng) => gen(rng, 'asinK') },
      { match: /^\s+- \(arccos x\)′ = /, make: (rng) => gen(rng, 'acosK') },
      { match: /^\s+- \(arctan x\)′ = /, make: (rng) => gen(rng, 'atanK') },
      { match: /^\s+- \(arccot x\)′ = /, make: (rng) => gen(rng, 'acotK') },
      { match: /^\s+- \(arcsec x\)′ = /, make: (rng) => gen(rng, 'asecK') },
      { match: /^\s+- \(arccsc x\)′ = /, make: (rng) => gen(rng, 'acscK') },
      { match: /^(Zincirli hal|Chain forms): /, make: (rng) => gen(rng, rng.pick(['atanSq', 'atanExp', 'asinK', 'atanK'])) },
      { match: /^(TERS FONKSİYONUN TÜREVİ|DERIVATIVE OF AN INVERSE FUNCTION)$/, make: (rng) => gen(rng, rng.pick(['invPoly', 'invExp'])) },
      { match: /^(ARCSIN TÜREVİNİN KISA ÇIKARIMI|SHORT DERIVATION OF THE ARCSIN DERIVATIVE)$/, make: (rng) => gen(rng, 'asinK') },
    ],
  });
})();
