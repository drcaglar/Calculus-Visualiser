// Derivatives of exponential and logarithmic functions (chapter 'derivatives'; Thomas 3.8, Stewart 3.1 / 3.6).
// problem.kind: 'expk' c e^(kx) | 'aexp' b^(mx+n) | 'logG' ln g or log_b g (g linear or x^2+c) | 'lnabs' ln|px+q|
//   'xe' x^n e^(kx) | 'xln' x^n ln x | 'expOverPow' e^(kx)/x^n | 'lnOverPow' ln x / x^n   (product / quotient rules)
//   'ldX' x^(kx) | 'ldSin' x^(sin x) | 'ldBase' (x^2+c)^x | 'ldProd' x^m (x+b)^n / (x+d)^r  (logarithmic differentiation)
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
  const SUB = { 2: '₂', 3: '₃', 10: '₁₀' };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  function fr(n, d) { if (d === undefined) d = 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g; if (n === 0) { n = 0; d = 1; } return { n, d }; }
  const frAdd = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
  const frMul = (x, y) => fr(x.n * y.n, x.d * y.d);
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const frV = (x) => x.n / x.d;
  const cf = (c, s) => (c === 1 ? s : c === -1 ? '−' + s : S(c) + s);
  const plus = (a, b) => (b[0] === '−' ? `${a} − ${b.slice(1)}` : `${a} + ${b}`);
  const xp = (n) => (n === 0 ? '1' : n === 1 ? 'x' : 'x' + sup(n));
  const linStr = (p, q) => { const a = cf(p, 'x'); return q === 0 ? a : plus(a, S(q)); };
  const ex = (k) => (k === 1 ? 'e^x' : k === -1 ? 'e^(−x)' : `e^(${S(k)}x)`);
  const cl = (v) => (isFinite(v) && Math.abs(v) < 1e4 ? v : NaN);
  function lineStr(m, c) { // y = m x + c
    const a = Math.abs(m) < 5e-5 ? '' : (Math.abs(m - 1) < 5e-5 ? 'x' : Math.abs(m + 1) < 5e-5 ? '−x' : nf(m) + 'x');
    if (!a) return 'y = ' + nf(c);
    if (Math.abs(c) < 5e-5) return 'y = ' + a;
    return 'y = ' + a + (c < 0 ? ' − ' + nf(-c) : ' + ' + nf(c));
  }
  const RNG = new Rng();

  const KINDS = ['expk', 'aexp', 'logG', 'lnabs', 'xe', 'xln', 'expOverPow', 'lnOverPow', 'ldX', 'ldSin', 'ldBase', 'ldProd'];
  function kindName(k) {
    switch (k) {
      case 'expk': return Tx('c·e^(kx)', 'c·e^(kx)');
      case 'aexp': return Tx('a^(g(x)) (genel taban)', 'a^(g(x)) (general base)');
      case 'logG': return Tx('ln g(x) ve log_a g(x)', 'ln g(x) and log_a g(x)');
      case 'lnabs': return Tx('ln|g(x)|', 'ln|g(x)|');
      case 'xe': return Tx('xⁿ·e^(kx) (çarpım)', 'xⁿ·e^(kx) (product)');
      case 'xln': return Tx('xⁿ·ln x (çarpım)', 'xⁿ·ln x (product)');
      case 'expOverPow': return Tx('e^(kx)/xⁿ (bölüm)', 'e^(kx)/xⁿ (quotient)');
      case 'lnOverPow': return Tx('ln x/xⁿ (bölüm)', 'ln x/xⁿ (quotient)');
      case 'ldX': return Tx('x^(kx) (logaritmik türev)', 'x^(kx) (logarithmic diff.)');
      case 'ldSin': return Tx('x^(sin x) (logaritmik türev)', 'x^(sin x) (logarithmic diff.)');
      case 'ldBase': return Tx('(x²+c)^x (logaritmik türev)', '(x²+c)^x (logarithmic diff.)');
      default: return Tx('çarpım/bölüm/kuvvet (logaritmik türev)', 'product/quotient/powers (logarithmic diff.)');
    }
  }
  const isLD = (k) => k === 'ldX' || k === 'ldSin' || k === 'ldBase' || k === 'ldProd';

  // ---------- the functions ----------
  function gOf(p, x) { return p.gk === 'quad' ? x * x + p.gq : p.gp * x + p.gq; }
  function F(p, x) {
    let y;
    switch (p.kind) {
      case 'expk': y = p.c * Math.exp(p.k * x); break;
      case 'aexp': y = Math.pow(p.b, p.m * x + p.n); break;
      case 'logG': { const g = gOf(p, x); y = g > 0 ? (p.B ? Math.log(g) / Math.log(p.B) : Math.log(g)) : NaN; break; }
      case 'lnabs': { const g = p.gp * x + p.gq; y = g !== 0 ? Math.log(Math.abs(g)) : NaN; break; }
      case 'xe': y = Math.pow(x, p.n) * Math.exp(p.k * x); break;
      case 'xln': y = x > 0 ? Math.pow(x, p.n) * Math.log(x) : NaN; break;
      case 'expOverPow': y = x !== 0 ? Math.exp(p.k * x) / Math.pow(x, p.n) : NaN; break;
      case 'lnOverPow': y = x > 0 ? Math.log(x) / Math.pow(x, p.n) : NaN; break;
      case 'ldX': y = x > 0 ? Math.pow(x, p.k * x) : NaN; break;
      case 'ldSin': y = x > 0 ? Math.pow(x, Math.sin(x)) : NaN; break;
      case 'ldBase': y = Math.pow(x * x + p.c, x); break;
      default: y = (x > 0 && x + p.d !== 0) ? Math.pow(x, p.m) * Math.pow(x + p.b, p.n) / Math.pow(x + p.d, p.r) : NaN;
    }
    return y;
  }
  function D(p, x) {
    let y;
    switch (p.kind) {
      case 'expk': y = p.c * p.k * Math.exp(p.k * x); break;
      case 'aexp': y = p.m * Math.log(p.b) * Math.pow(p.b, p.m * x + p.n); break;
      case 'logG': {
        const g = gOf(p, x); const dg = p.gk === 'quad' ? 2 * x : p.gp;
        y = g > 0 ? dg / (g * (p.B ? Math.log(p.B) : 1)) : NaN; break;
      }
      case 'lnabs': { const g = p.gp * x + p.gq; y = g !== 0 ? p.gp / g : NaN; break; }
      case 'xe': y = Math.exp(p.k * x) * (p.n * Math.pow(x, p.n - 1) + p.k * Math.pow(x, p.n)); break;
      case 'xln': y = x > 0 ? Math.pow(x, p.n - 1) * (p.n * Math.log(x) + 1) : NaN; break;
      case 'expOverPow': y = x !== 0 ? Math.exp(p.k * x) * (p.k * x - p.n) / Math.pow(x, p.n + 1) : NaN; break;
      case 'lnOverPow': y = x > 0 ? (1 - p.n * Math.log(x)) / Math.pow(x, p.n + 1) : NaN; break;
      case 'ldX': y = x > 0 ? Math.pow(x, p.k * x) * p.k * (Math.log(x) + 1) : NaN; break;
      case 'ldSin': y = x > 0 ? Math.pow(x, Math.sin(x)) * (Math.cos(x) * Math.log(x) + Math.sin(x) / x) : NaN; break;
      case 'ldBase': { const u = x * x + p.c; y = Math.pow(u, x) * (Math.log(u) + 2 * x * x / u); break; }
      default: y = (x > 0 && x + p.d !== 0) ? F(p, x) * (p.m / x + p.n / (x + p.b) - p.r / (x + p.d)) : NaN;
    }
    return isFinite(y) ? y : NaN;
  }
  function Dnum(p, x) {
    const h = 1e-5 * Math.max(1, Math.abs(x));
    const y = (F(p, x + h) - F(p, x - h)) / (2 * h);
    return isFinite(y) ? y : NaN;
  }

  // ---------- strings ----------
  const gStr = (p) => (p.gk === 'quad' ? plus('x²', S(p.gq)) : linStr(p.gp, p.gq));
  const lgName = (p) => (p.B ? 'log' + SUB[p.B] : 'ln');
  function fStr(p) {
    switch (p.kind) {
      case 'expk': return cf(p.c, ex(p.k));
      case 'aexp': return `${p.b}^(${linStr(p.m, p.n)})`;
      case 'logG': return `${lgName(p)}(${gStr(p)})`;
      case 'lnabs': return `ln|${linStr(p.gp, p.gq)}|`;
      case 'xe': return `${xp(p.n)}·${ex(p.k)}`;
      case 'xln': return `${xp(p.n)}·ln x`;
      case 'expOverPow': return `${ex(p.k)} / ${xp(p.n)}`;
      case 'lnOverPow': return `ln x / ${xp(p.n)}`;
      case 'ldX': return `x^(${cf(p.k, 'x')})`;
      case 'ldSin': return 'x^(sin x)';
      case 'ldBase': return `(${plus('x²', S(p.c))})^x`;
      default: return `x${sup(p.m)}·(x + ${p.b})${sup(p.n)} / (x + ${p.d})${sup(p.r)}`;
    }
  }
  function dStr(p) {
    switch (p.kind) {
      case 'expk': return cf(p.c * p.k, ex(p.k));
      case 'aexp': return `${p.m === 1 ? '' : p.m === -1 ? '−' : S(p.m) + '·'}ln ${p.b}·${p.b}^(${linStr(p.m, p.n)})`;
      case 'logG': {
        const num = p.gk === 'quad' ? '2x' : S(p.gp);
        const den = p.B ? `((${gStr(p)})·ln ${p.B})` : `(${gStr(p)})`;
        return `${num} / ${den}`;
      }
      case 'lnabs': return `${S(p.gp)} / (${linStr(p.gp, p.gq)})`;
      case 'xe': return `${ex(p.k)}·(${plus(p.n === 1 ? '1' : cf(p.n, xp(p.n - 1)), cf(p.k, xp(p.n)))})`;
      case 'xln': return p.n === 1 ? 'ln x + 1' : `${xp(p.n - 1)}·(${p.n}ln x + 1)`;
      case 'expOverPow': return `${ex(p.k)}·(${cf(p.k, 'x')} − ${p.n}) / ${xp(p.n + 1)}`;
      case 'lnOverPow': return `(1 − ${p.n === 1 ? '' : p.n}ln x) / ${xp(p.n + 1)}`;
      case 'ldX': return `x^(${cf(p.k, 'x')})·${p.k === 1 ? '' : p.k + '·'}(ln x + 1)`;
      case 'ldSin': return 'x^(sin x)·(cos x·ln x + sin x / x)';
      case 'ldBase': return `(${plus('x²', S(p.c))})^x·(ln(${plus('x²', S(p.c))}) + 2x² / (${plus('x²', S(p.c))}))`;
      default: return `f(x)·(${p.m} / x + ${p.n} / (x + ${p.b}) − ${p.r} / (x + ${p.d}))`;
    }
  }

  // ---------- generation ----------
  function gen(rng, kind) {
    const p = { kind, a: 1, x: 1, showD: true, showTan: true };
    switch (kind) {
      case 'expk': p.c = rng.pick([1, 1, 2, 3, -1, -2, 4]); p.k = rng.pick([-3, -2, -1, 1, 2, 3]); p.a = rng.pick([-1, 0, 0, 1]); break;
      case 'aexp': p.b = rng.pick([2, 3, 5, 10]); p.m = rng.pick([-2, -1, 1, 1, 2, 3]); p.n = rng.pick([-1, 0, 0, 1, 2]); p.a = rng.pick([-1, 0, 0, 1]); break;
      case 'logG':
        p.B = rng.pick([0, 0, 2, 3, 10]);
        if (rng.nextInt(0, 2)) { p.gk = 'quad'; p.gp = 1; p.gq = rng.nextInt(1, 6); p.a = rng.pick([-2, -1, 1, 2]); }
        else { p.gk = 'lin'; p.gp = rng.pick([1, 2, 3, 4]); p.gq = rng.nextInt(1, 6); p.a = rng.pick([0, 1, 2]); }
        break;
      case 'lnabs': {
        p.gk = 'lin';
        do { p.gp = rng.pick([1, 2, 3, -1, -2]); p.gq = rng.nextInt(-3, 4); p.a = rng.nextInt(-3, 4); } while (p.gp * p.a + p.gq === 0);
        break;
      }
      case 'xe': p.n = rng.pick([1, 2, 2, 3]); p.k = rng.pick([-2, -1, 1, 1, 2]); p.a = rng.pick([-1, 1, 1, 2]); break;
      case 'xln': p.n = rng.pick([1, 2, 3]); p.a = rng.pick([1, 2, 3]); break;
      case 'expOverPow': p.n = rng.pick([1, 2]); p.k = rng.pick([1, 1, 2, -1]); p.a = rng.pick([-1, 1, 2]); break;
      case 'lnOverPow': p.n = rng.pick([1, 2, 3]); p.a = rng.pick([1, 2, 3]); break;
      case 'ldX': p.k = rng.pick([1, 1, 2, 3]); p.a = rng.pick([1, 2]); break;
      case 'ldSin': p.a = rng.pick([1, 2, 3]); break;
      case 'ldBase': p.c = rng.pick([1, 1, 2, 3]); p.a = rng.pick([0, 1, 2]); break;
      default:
        p.m = rng.pick([1, 2, 3]); p.n = rng.pick([2, 3, 4]); p.r = rng.pick([1, 2, 3]);
        p.b = rng.pick([1, 2, 3]); p.d = rng.pick([1, 2, 3]); p.a = rng.pick([1, 2, 3]);
    }
    p.x = p.a;
    return p;
  }
  function createProblem(rng) {
    return gen(rng, rng.pick(['expk', 'aexp', 'logG', 'logG', 'lnabs', 'xe', 'xln', 'expOverPow', 'lnOverPow', 'ldX', 'ldSin', 'ldBase', 'ldProd', 'ldProd']));
  }

  function problemStatement(p) {
    const A_ = S(p.a);
    if (isLD(p.kind)) {
      return Tx(`f(x) = ${fStr(p)} fonksiyonunun türevini logaritmik türev alma yöntemiyle bulalım (x > 0 için çalışalım). Sonra f′(${A_}) değerini ve x = ${A_} noktasındaki teğet doğrusunun denklemini yazalım.`,
        `Let's find the derivative of f(x) = ${fStr(p)} by logarithmic differentiation (working for x > 0). Then we can evaluate f′(${A_}) and write the tangent line at x = ${A_}.`);
    }
    return Tx(`f(x) = ${fStr(p)} fonksiyonunun türevini bulalım. Sonra f′(${A_}) değerini (sayısal olarak) ve x = ${A_} noktasındaki teğet doğrusunun denklemini yazalım.`,
      `Let's find the derivative of f(x) = ${fStr(p)}. Then we can evaluate f′(${A_}) (numerically) and write the equation of the tangent line at x = ${A_}.`);
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      [
        'ÜSTEL VE LOGARİTMİK FONKSİYONLARIN TÜREVLERİ',
        'eˣ, aˣ, ln x ve log_a x fonksiyonları mühendislikte (soğuma-ısınma, bozunma, kapasitör yükü, desibel ölçeği, büyüme modelleri) sürekli karşımıza çıkar. Bu tabda hepsinin türevini ve x^x gibi "tabanı da üssü de değişen" fonksiyonların türevini görüyoruz.',
        '',
        'e SAYISI NEDİR?',
        'e ≈ 2,71828 sayısı, aˣ eğrisinin x = 0\'daki teğetinin eğiminin tam 1 olduğu tabandır. Genel tabanda (aˣ)′ at 0 = ln a olur; a = e seçilince ln e = 1 gelir. Bu yüzden eˣ türevi kendisine eşit olan tek (sabit çarpana kadar) fonksiyondur.',
        '',
        'FORMÜL TABLOSU',
        '   - (eˣ)′ = eˣ                          zincirli: (e^g)′ = g′·e^g',
        '   - (aˣ)′ = aˣ·ln a                      zincirli: (a^g)′ = g′·a^g·ln a',
        '   - (ln x)′ = 1/x   (x > 0)              zincirli: (ln g)′ = g′/g',
        '   - (ln|x|)′ = 1/x   (x ≠ 0)             zincirli: (ln|g|)′ = g′/g',
        '   - (log_a x)′ = 1/(x·ln a)              zincirli: (log_a g)′ = g′/(g·ln a)',
        '',
        'ANLAMI',
        'eˣ\'in eğimi her noktada yüksekliğine eşittir: büyüdükçe daha hızlı büyür. ln x ise eˣ\'in aynadaki görüntüsüdür; x büyüdükçe eğimi 1/x ile küçülür, yani yavaşça yükselir.',
        '',
        'LOGARİTMİK TÜREV ALMA (YÖNTEM)',
        '   1. y = f(x) yazalım ve iki tarafın doğal logaritmasını (ln) alalım.',
        '   2. Logaritma kurallarıyla açalım: ln(AB) = ln A + ln B;  ln(A/B) = ln A − ln B;  ln(Aⁿ) = n·ln A. Çarpımlar toplama, kuvvetler çarpmaya döner.',
        '   3. İki tarafın x\'e göre türevini alalım (soldaki ln y için zincir kuralı: y′/y).',
        '   4. y′/y ifadesini bulduktan sonra y\' = y·(sağ taraf) diyerek y\'yi buluruz; y yerine başlangıç fonksiyonunu yazarız.',
        '   Bu yöntem x^x, x^(sin x), (f(x))^(g(x)) gibi değişken üslü fonksiyonlar ve uzun çarpım/bölüm/kuvvet ifadeleri için çok işe yarar.',
        '',
        'DİKKAT EDİLECEKLER',
        '   - (xˣ)′ ≠ x·xˣ⁻¹ (kuvvet kuralı sabit üs içindir) ve ≠ xˣ·ln x (üstel kuralı sabit taban içindir). Doğrusu xˣ(ln x + 1).',
        '   - ln g için g > 0 olmalıdır; ln|g| için g ≠ 0 yeterlidir.',
        '   - (ln x)′ = 1/x ama (log_a x)′ = 1/(x ln a): a ≠ e ise ln a payda kalır.',
        '   - (aˣ)′ = aˣ·ln a: ln a çarpanı unutulmamalıdır; zincirli halde g′ de eklenir.',
        '',
        'MİNİ ÖRNEK',
        'f(x) = x^x: ln y = x ln x → y′/y = ln x + 1 → f′(x) = x^x (ln x + 1). x = 1\'de f′(1) = 1.',
        '',
        'KAYDIRICI',
        'Kaydırıcıyla teğet noktasını gezdirebiliriz; teğetin eğimi, kesikli f′ eğrisinin o x\'teki yüksekliğine eşittir.',
      ].join('\n'),
      [
        'DERIVATIVES OF EXPONENTIAL AND LOGARITHMIC FUNCTIONS',
        'The functions eˣ, aˣ, ln x and log_a x appear constantly in engineering (cooling and heating, decay, capacitor charge, the decibel scale, growth models). In this tab we meet their derivatives, and the derivatives of "variable base and variable exponent" functions such as x^x.',
        '',
        'WHAT IS THE NUMBER e?',
        'e ≈ 2.71828 is the base for which the tangent to aˣ at x = 0 has slope exactly 1. For a general base the slope at 0 is ln a, and with a = e we get ln e = 1. That is why eˣ is (up to a constant multiple) the one function equal to its own derivative.',
        '',
        'FORMULA TABLE',
        '   - (eˣ)′ = eˣ                          chain form: (e^g)′ = g′·e^g',
        '   - (aˣ)′ = aˣ·ln a                      chain form: (a^g)′ = g′·a^g·ln a',
        '   - (ln x)′ = 1/x   (x > 0)              chain form: (ln g)′ = g′/g',
        '   - (ln|x|)′ = 1/x   (x ≠ 0)             chain form: (ln|g|)′ = g′/g',
        '   - (log_a x)′ = 1/(x·ln a)              chain form: (log_a g)′ = g′/(g·ln a)',
        '',
        'WHAT DOES IT MEAN?',
        'The slope of eˣ at every point equals its height: the higher it is, the faster it climbs. ln x is the mirror image of eˣ; its slope 1/x shrinks as x grows, so it rises ever more slowly.',
        '',
        'LOGARITHMIC DIFFERENTIATION (METHOD)',
        '   1. Write y = f(x) and take the natural logarithm (ln) of both sides.',
        '   2. Expand with the log rules: ln(AB) = ln A + ln B;  ln(A/B) = ln A − ln B;  ln(Aⁿ) = n·ln A. Products become sums and powers become multiples.',
        '   3. Differentiate both sides with respect to x (on the left, the chain rule gives y′/y).',
        '   4. Once y′/y is found, y′ = y·(right-hand side); substitute the original function for y.',
        '   It is ideal for x^x, x^(sin x), (f(x))^(g(x)) and for long products, quotients and powers.',
        '',
        'COMMON PITFALLS',
        '   - (xˣ)′ is NOT x·xˣ⁻¹ (the power rule is for a constant exponent) and NOT xˣ·ln x (the exponential rule is for a constant base). The correct result is xˣ(ln x + 1).',
        '   - ln g needs g > 0; ln|g| only needs g ≠ 0.',
        '   - (ln x)′ = 1/x but (log_a x)′ = 1/(x ln a): when a ≠ e the factor ln a stays in the denominator.',
        '   - (aˣ)′ = aˣ·ln a: do not forget ln a; in the chain form g′ is also a factor.',
        '',
        'MINI EXAMPLE',
        'f(x) = x^x: ln y = x ln x → y′/y = ln x + 1 → f′(x) = x^x (ln x + 1). At x = 1, f′(1) = 1.',
        '',
        'SLIDER',
        'With the slider we can move the point of tangency; the slope of the tangent equals the height of the dashed f′ curve at that x.',
      ].join('\n'));
  }

  // ---------- steps ----------
  function ldSteps(p) {
    const L = [];
    const hdr = (n, tr, en) => `── ${n}) ${Tx(tr, en)} ──`;
    const y = fStr(p);
    let lnY, dl, res;
    switch (p.kind) {
      case 'ldX':
        lnY = `ln y = ${p.k === 1 ? '' : p.k}x·ln x`;
        dl = `y′/y = ${p.k === 1 ? '' : p.k + '·'}(ln x + x·(1/x)) = ${p.k === 1 ? '' : p.k + '·'}(ln x + 1)`;
        break;
      case 'ldSin':
        lnY = 'ln y = (sin x)·ln x';
        dl = 'y′/y = cos x·ln x + sin x·(1/x) = cos x·ln x + sin x / x';
        break;
      case 'ldBase':
        lnY = `ln y = x·ln(${plus('x²', S(p.c))})`;
        dl = `y′/y = ln(${plus('x²', S(p.c))}) + x·2x/(${plus('x²', S(p.c))}) = ln(${plus('x²', S(p.c))}) + 2x²/(${plus('x²', S(p.c))})`;
        break;
      default:
        lnY = `ln y = ${p.m === 1 ? '' : p.m}ln x + ${p.n === 1 ? '' : p.n}ln(x + ${p.b}) − ${p.r === 1 ? '' : p.r}ln(x + ${p.d})`;
        dl = `y′/y = ${p.m} / x + ${p.n} / (x + ${p.b}) − ${p.r} / (x + ${p.d})`;
    }
    L.push([hdr(1, 'Yöntemi seçelim', 'Choosing the method'),
      Tx(`Üs de taban da x'e bağlı olduğundan kuvvet kuralı ya da üstel kural tek başına yetmez. Bu durumda iki tarafın doğal logaritmasını alıp türev alırız (logaritmik türev alma).`,
        `Because the base and/or exponent depend on x, neither the power rule nor the exponential rule alone is enough. We take the natural log of both sides and then differentiate (logarithmic differentiation).`)].join('\n'));
    L.push([hdr(2, 'İki tarafın ln\'sini alalım', 'Take ln of both sides'),
      `y = ${y}`,
      p.kind === 'ldProd'
        ? Tx('ln(AB) = ln A + ln B, ln(A/B) = ln A − ln B ve ln(Aⁿ) = n ln A kurallarıyla açarsak:', 'Expanding with ln(AB) = ln A + ln B, ln(A/B) = ln A − ln B and ln(Aⁿ) = n ln A:')
        : Tx('ln(Aᴮ) = B·ln A kuralıyla üs aşağı iner:', 'The rule ln(Aᴮ) = B·ln A brings the exponent down:'),
      lnY].join('\n'));
    L.push([hdr(3, 'x\'e göre türev alalım', 'Differentiate with respect to x'),
      Tx('Sol tarafta (ln y)′ = y′/y (zincir kuralı). Sağ tarafta gerektiğinde çarpım kuralı kullanılır:', 'On the left (ln y)′ = y′/y (chain rule). On the right we use the product rule where needed:'),
      dl].join('\n'));
    L.push([hdr(4, 'y′\'yü yalnız bırakalım', 'Solve for y′'),
      Tx('Her iki tarafı y ile çarparsak y′ = y·(y′/y) olur:', 'Multiplying both sides by y gives y′ = y·(y′/y):'),
      `f′(x) = ${dStr(p)}`].join('\n'));
    return L;
  }
  function stdSteps(p) {
    const L = [];
    const hdr = (n, tr, en) => `── ${n}) ${Tx(tr, en)} ──`;
    const f = fStr(p);
    switch (p.kind) {
      case 'expk':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = ${f}; sabit çarpanlı bir üstel fonksiyon. İç fonksiyon u = ${S(p.k)}x olsun, u′ = ${S(p.k)}.`, `f(x) = ${f}; an exponential with a constant multiple. Let the inner function be u = ${S(p.k)}x, so u′ = ${S(p.k)}.`),
          Tx('Zincir kuralı: (e^u)′ = u′·e^u.', 'Chain rule: (e^u)′ = u′·e^u.')].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'),
          `f′(x) = ${S(p.c)}·${S(p.k)}·${ex(p.k)} = ${dStr(p)}`].join('\n'));
        break;
      case 'aexp':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`Taban ${p.b} sabit, üs g(x) = ${linStr(p.m, p.n)} değişken. Kural: (a^g)′ = g′·a^g·ln a.`, `The base ${p.b} is constant and the exponent is g(x) = ${linStr(p.m, p.n)}. Rule: (a^g)′ = g′·a^g·ln a.`),
          `g′(x) = ${S(p.m)},  ln ${p.b} ≈ ${nf(Math.log(p.b))}`].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'),
          `f′(x) = ${S(p.m)}·${p.b}^(${linStr(p.m, p.n)})·ln ${p.b} = ${dStr(p)}`].join('\n'));
        break;
      case 'logG': {
        const dg = p.gk === 'quad' ? '2x' : S(p.gp);
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`İç fonksiyon g(x) = ${gStr(p)}, g′(x) = ${dg}. ${p.B ? `${lgName(p)} için kural: (log_a g)′ = g′ / (g·ln a), burada a = ${p.B}, ln ${p.B} ≈ ${nf(Math.log(p.B))}.` : 'Kural: (ln g)′ = g′ / g.'}`,
            `The inner function is g(x) = ${gStr(p)}, g′(x) = ${dg}. ${p.B ? `Rule for ${lgName(p)}: (log_a g)′ = g′ / (g·ln a), with a = ${p.B}, ln ${p.B} ≈ ${nf(Math.log(p.B))}.` : 'Rule: (ln g)′ = g′ / g.'}`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'), `f′(x) = ${dStr(p)}`,
          Tx(`Tanım kümesi: ${p.gk === 'quad' ? 'x² + c > 0 her x için sağlanır.' : `${linStr(p.gp, p.gq)} > 0 olmalı.`}`, `Domain: ${p.gk === 'quad' ? 'x² + c > 0 holds for every x.' : `we need ${linStr(p.gp, p.gq)} > 0.`}`)].join('\n'));
        break;
      }
      case 'lnabs':
        L.push([hdr(1, 'Yapıyı tanıyalım', 'Recognise the structure'),
          Tx(`f(x) = ln|g(x)| ve g(x) = ${linStr(p.gp, p.gq)}, g′ = ${S(p.gp)}. Mutlak değerli logaritmanın türevi (ln|g|)′ = g′/g'dir; g hem pozitif hem negatif olabilir (g ≠ 0).`,
            `f(x) = ln|g(x)| with g(x) = ${linStr(p.gp, p.gq)}, g′ = ${S(p.gp)}. The derivative of the absolute-value log is (ln|g|)′ = g′/g; g may be positive or negative (g ≠ 0).`)].join('\n'));
        L.push([hdr(2, 'Türevi yazalım', 'Write the derivative'), `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      case 'xe':
        L.push([hdr(1, 'Çarpım kuralını seçelim', 'Choose the product rule'),
          `u = ${xp(p.n)},  v = ${ex(p.k)}`, `u′ = ${p.n === 1 ? '1' : cf(p.n, xp(p.n - 1))},  v′ = ${cf(p.k, ex(p.k))}  ${Tx('(zincir kuralı)', '(chain rule)')}`,
          '(u·v)′ = u′·v + u·v′'].join('\n'));
        L.push([hdr(2, 'Yerine koyalım', 'Substitute'),
          `f′(x) = ${p.n === 1 ? '1' : cf(p.n, xp(p.n - 1))}·${ex(p.k)} + ${xp(p.n)}·${cf(p.k, ex(p.k))}`,
          Tx(`Ortak çarpan ${ex(p.k)} dışarı alınırsa:`, `Factoring out ${ex(p.k)}:`), `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      case 'xln':
        L.push([hdr(1, 'Çarpım kuralını seçelim', 'Choose the product rule'),
          `u = ${xp(p.n)},  v = ln x`, `u′ = ${p.n === 1 ? '1' : cf(p.n, xp(p.n - 1))},  v′ = 1/x`].join('\n'));
        L.push([hdr(2, 'Yerine koyalım', 'Substitute'),
          `f′(x) = ${p.n === 1 ? '1' : cf(p.n, xp(p.n - 1))}·ln x + ${xp(p.n)}·(1/x) = ${p.n === 1 ? '' : p.n + xp(p.n - 1) + '·'}ln x + ${xp(p.n - 1)}`,
          `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      case 'expOverPow':
        L.push([hdr(1, 'Bölüm kuralını seçelim', 'Choose the quotient rule'),
          `u = ${ex(p.k)},  v = ${xp(p.n)}`, `u′ = ${cf(p.k, ex(p.k))},  v′ = ${cf(p.n, xp(p.n - 1))}`, '(u/v)′ = (u′v − uv′) / v²'].join('\n'));
        L.push([hdr(2, 'Yerine koyalım', 'Substitute'),
          `f′(x) = (${cf(p.k, ex(p.k))}·${xp(p.n)} − ${ex(p.k)}·${cf(p.n, xp(p.n - 1))}) / ${xp(2 * p.n)}`,
          Tx(`Pay ve paydadaki ortak çarpan ${ex(p.k)}${p.n > 1 ? '·' + xp(p.n - 1) : ''} sadeleşir:`, `The common factor ${ex(p.k)}${p.n > 1 ? '·' + xp(p.n - 1) : ''} cancels:`),
          `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      case 'lnOverPow':
        L.push([hdr(1, 'Bölüm kuralını seçelim', 'Choose the quotient rule'),
          `u = ln x,  v = ${xp(p.n)}`, `u′ = 1/x,  v′ = ${cf(p.n, xp(p.n - 1))}`, '(u/v)′ = (u′v − uv′) / v²'].join('\n'));
        L.push([hdr(2, 'Yerine koyalım', 'Substitute'),
          `f′(x) = ((1/x)·${xp(p.n)} − ln x·${cf(p.n, xp(p.n - 1))}) / ${xp(2 * p.n)} = ${xp(p.n - 1)}·(1 − ${p.n === 1 ? '' : p.n}ln x) / ${xp(2 * p.n)}`,
          `f′(x) = ${dStr(p)}`].join('\n'));
        break;
      default:
    }
    return L;
  }
  function solveSteps(p) {
    const out = isLD(p.kind) ? ldSteps(p) : stdSteps(p);
    const hdr = (n, tr, en) => `── ${n}) ${Tx(tr, en)} ──`;
    let n = out.length;
    const a = p.a, fa = F(p, a), da = D(p, a);
    n += 1;
    const lines = [hdr(n, `x = ${S(a)} noktasında değer ve eğim`, `Value and slope at x = ${S(a)}`)];
    if (p.kind === 'ldProd') {
      const A_ = a;
      const Fa = fr(Math.pow(A_, p.m) * Math.pow(A_ + p.b, p.n), Math.pow(A_ + p.d, p.r));
      const Lq = frAdd(frAdd(fr(p.m, A_), fr(p.n, A_ + p.b)), fr(-p.r, A_ + p.d));
      const Dq = frMul(Fa, Lq);
      lines.push(`f(${S(a)}) = ${a}${sup(p.m)}·${a + p.b}${sup(p.n)} / ${a + p.d}${sup(p.r)} = ${frS(Fa)}`);
      lines.push(`y′/y = ${p.m}/${a} + ${p.n}/${a + p.b} − ${p.r}/${a + p.d} = ${frS(Lq)}`);
      lines.push(`f′(${S(a)}) = ${frS(Fa)}·(${frS(Lq)}) = ${frS(Dq)} ≈ ${nf(frV(Dq))}`);
    } else {
      lines.push(`f(${S(a)}) ≈ ${nf(fa)}`);
      lines.push(Tx(`f′(x) ifadesinde x = ${S(a)} alırsak:`, `Putting x = ${S(a)} into f′(x):`));
      lines.push(`f′(${S(a)}) ≈ ${nf(da)}`);
    }
    out.push(lines.join('\n'));
    n += 1;
    out.push([hdr(n, 'Teğet doğrusu', 'Tangent line'),
      Tx('Nokta-eğim biçimi: y − f(a) = f′(a)·(x − a).', 'Point-slope form: y − f(a) = f′(a)·(x − a).'),
      `y − ${nf(fa)} = ${nf(da)}·(x − ${S(a)})`.replace('y − −', 'y + '),
      lineStr(da, fa - da * a)].join('\n'));
    n += 1;
    const h = 0.001, num = (F(p, a + h) - F(p, a - h)) / (2 * h);
    out.push([hdr(n, 'Kontrol', 'Check'),
      Tx(`Sayısal türev: (f(a+h) − f(a−h)) / (2h), h = 0,001 → ${nf(num)}. Bulduğumuz f′(${S(a)}) ≈ ${nf(da)} ile aynı çıktı, yani formülümüz doğru görünüyor.`,
        `Numerical derivative: (f(a+h) − f(a−h)) / (2h) with h = 0.001 gives ${nf(num)}, matching f′(${S(a)}) ≈ ${nf(da)}; so the formula looks right.`),
      Tx('Grafikte teğetin eğimi, f′ eğrisinin (kesikli) a noktasındaki yüksekliğine eşit olmalıdır.', 'On the graph the tangent slope should equal the height of the dashed f′ curve at a.')].join('\n'));
    return out;
  }

  // ---------- graph ----------
  function draw(canvas, p) {
    try {
      canvas.setViewport(-5, 5, -6, 6);
      canvas.addFunction({ evaluator: (x) => cl(F(p, x)), color: canvas.accent(), thickness: 3, label: 'f(x)' });
      if (p.showD) canvas.addFunction({ evaluator: (x) => cl(D(p, x)), color: canvas.purple(), thickness: 2.5, dashed: true, label: 'f′(x)' });
      const x = p.x, fx = F(p, x), dx = D(p, x);
      if (p.showTan && isFinite(fx) && isFinite(dx) && Math.abs(fx) < 1e4 && Math.abs(dx) < 1e4) {
        canvas.addSegment({ x1: -5, y1: fx + dx * (-5 - x), x2: 5, y2: fx + dx * (5 - x), color: canvas.orange(), thickness: 2, dashed: false });
        canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray() });
        canvas.addMarker({ x, y: fx, color: canvas.orange(), radius: 6, label: `f = ${nf(fx, 2)}` });
        if (p.showD) canvas.addMarker({ x, y: dx, color: canvas.purple(), radius: 6, label: `f′ = ${nf(dx, 2)}` });
      }
      const fa = F(p, p.a);
      if (isFinite(fa) && Math.abs(fa) < 1e4) canvas.addMarker({ x: p.a, y: fa, color: canvas.gold(), shape: 'diamond', radius: 7, label: `a = ${S(p.a)}` });
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSelect({
      options: KINDS.map((k) => ({ label: kindName(k), value: k })),
      get: () => getProblem().kind,
      set: (v) => { Object.assign(getProblem(), gen(RNG, v)); },
    });
    h.addSlider({
      caption: Tx('Teğet noktası (x)', 'Point of tangency (x)'), min: -4, max: 4, step: 0.05,
      get: () => getProblem().x,
      set: (v) => { getProblem().x = Math.max(-4, Math.min(4, v)); },
    });
    h.addCheckbox({
      caption: Tx('f′ eğrisini göster', 'Show the f′ curve'),
      get: () => getProblem().showD,
      set: (v) => { getProblem().showD = !!v; },
    });
    h.addCheckbox({
      caption: Tx('Teğeti göster', 'Show the tangent'),
      get: () => getProblem().showTan,
      set: (v) => { getProblem().showTan = !!v; },
    });
  }

  Topics.register('derivatives', {
    id: 'expLogDerivatives',
    tabTitle: () => Tx('Üstel ve Logaritmik Fonksiyonların Türevleri', 'Derivatives of Exponential and Logarithmic Functions'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s+- \(eˣ\)′ = eˣ\s{2,}/, make: (rng) => gen(rng, 'expk') },
      { match: /^\s+- \(aˣ\)′ = aˣ·ln a\s{2,}/, make: (rng) => gen(rng, 'aexp') },
      { match: /^\s+- \(ln x\)′ = 1\/x\s+\(x > 0\)/, make: (rng) => { const p = gen(rng, 'logG'); p.B = 0; return p; } },
      { match: /^\s+- \(ln\|x\|\)′ = 1\/x\s/, make: (rng) => gen(rng, 'lnabs') },
      { match: /^\s+- \(log_a x\)′ = 1\/\(x·ln a\)\s/, make: (rng) => { const p = gen(rng, 'logG'); p.B = rng.pick([2, 3, 10]); return p; } },
      { match: /^(LOGARİTMİK TÜREV ALMA|LOGARITHMIC DIFFERENTIATION) \(/, make: (rng) => gen(rng, rng.pick(['ldX', 'ldSin', 'ldBase', 'ldProd'])) },
    ],
  });
})();
