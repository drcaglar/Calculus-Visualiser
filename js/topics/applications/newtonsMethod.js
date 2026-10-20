// Newton's Method (chapter 'applications'). Port of Modules/Applications/NewtonsMethodControl.vb, extended.
// problem = { kind, ...params, x0, k, m }
//   success kinds: cubic (x^3 - a x - b), cosm (cos x - k x), sqrtN (x^2 - N), cuberoot (x^3 - N),
//                  lnx (x + ln x), expeq (e^x - k), quintic (x^5 + x - k)
//   failure kinds: cycle (x^3 - 2x + 2, x0 = 0 or 1), flat (x^2 - c with f'(x0) = 0 or tiny),
//                  overshoot (x^3 - x - 1, x0 = 0.5), multiple (double root, linear convergence),
//                  otherRoot (x^3 - 3x + 1 from x0 = 0.9 lands on a root that is not the nearest one)
// The slider k draws the first k tangent lines (cobweb); the x0 slider changes the start and re-runs the table.
// Iterates are computed in double precision and printed rounded to 6 decimals; the stated roots are those limits.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const co = (a) => (a === 1 ? '' : String(a));
  const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  const sb = (n) => String(n).split('').map((d) => SUB[+d]).join('');
  const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function nf(v, dec) {
    if (!isFinite(v)) return Tx('tanımsız', 'not defined');
    let s = v.toFixed(dec === undefined ? 6 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  function sci(v) { // short scientific notation for errors
    if (!isFinite(v)) return Tx('tanımsız', 'not defined');
    if (v === 0) return '0';
    const e = v.toExponential(1).split('e');
    const ex = parseInt(e[1], 10);
    const exs = (ex < 0 ? '⁻' : '') + String(Math.abs(ex)).split('').map((d) => SUPD[d]).join('');
    return e[0] + '×10' + exs;
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
  function Hdr(n, text) { return '── ' + n + ') ' + text + ' ──'; }
  const clipv = (v) => (isFinite(v) && Math.abs(v) < 1e7 ? v : NaN);
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }

  // ---------- state shared with the controls ----------
  let forcedKind = 'random';

  const KINDS = ['cubic', 'cosm', 'sqrtN', 'cuberoot', 'lnx', 'expeq', 'quintic', 'cycle', 'flat', 'overshoot', 'multiple', 'otherRoot'];
  function kindLabel(k) {
    switch (k) {
      case 'cubic': return Tx('Kübik: x³ − ax − b = 0', 'Cubic: x³ − ax − b = 0');
      case 'cosm': return Tx('cos x = kx denklemi', 'The equation cos x = kx');
      case 'sqrtN': return Tx('√N hesabı: x² − N = 0', 'Computing √N: x² − N = 0');
      case 'cuberoot': return Tx('Küp kök: x³ − N = 0', 'Cube root: x³ − N = 0');
      case 'lnx': return Tx('x + ln x = 0', 'x + ln x = 0');
      case 'expeq': return Tx('eˣ = k (ln k hesabı)', 'eˣ = k (computing ln k)');
      case 'quintic': return Tx('Beşinci derece: x⁵ + x − k = 0', 'Quintic: x⁵ + x − k = 0');
      case 'cycle': return Tx('Başarısız: 2 noktalı döngü', 'Failure: a 2-cycle');
      case 'flat': return Tx('Başarısız: yatay teğet (f′ ≈ 0)', 'Failure: horizontal tangent (f′ ≈ 0)');
      case 'overshoot': return Tx('Başarısız: kötü başlangıç, kaotik gezinti', 'Failure: bad start, chaotic wandering');
      case 'multiple': return Tx('Çift kök: yalnızca doğrusal yakınsama', 'Double root: only linear convergence');
      case 'vertical': return Tx('Başarısız: köşeli / dikey teğetli kök (∛x)', 'Failure: root with a vertical tangent (∛x)');
      case 'otherRoot': return Tx('Beklenmeyen köke gidiş', 'Landing on an unexpected root');
      default: return Tx('Rastgele', 'Random');
    }
  }

  // ---------- model ----------
  function spec(p) {
    const sp = { name: '' };
    switch (p.kind) {
      case 'cubic': {
        const a = p.a, b = p.b;
        sp.f = (x) => clipv(x * x * x - a * x - b); sp.df = (x) => 3 * x * x - a;
        sp.fS = poly([[1, 'x³'], [-a, 'x'], [-b, '']]); sp.dfS = poly([[3, 'x²'], [-a, '']]);
        sp.rule = Tx('kuvvet kuralı: (x³)′ = 3x², (ax)′ = a, sabitin türevi 0', 'power rule: (x³)′ = 3x², (ax)′ = a, constant → 0');
        sp.view = [-3, 4]; break;
      }
      case 'cosm': {
        const k = p.k2;
        sp.f = (x) => clipv(Math.cos(x) - k * x); sp.df = (x) => -Math.sin(x) - k;
        sp.fS = 'cos x − ' + co(k) + 'x'; sp.dfS = '−sin x − ' + k;
        sp.rule = Tx('(cos x)′ = −sin x, (kx)′ = k', '(cos x)′ = −sin x, (kx)′ = k');
        sp.view = [-1, 3]; break;
      }
      case 'sqrtN': {
        const N = p.N;
        sp.f = (x) => x * x - N; sp.df = (x) => 2 * x;
        sp.fS = 'x² − ' + N; sp.dfS = '2x';
        sp.rule = Tx('(x²)′ = 2x, sabit → 0', '(x²)′ = 2x, constant → 0');
        sp.view = [-1, Math.max(4, Math.ceil(Math.sqrt(N)) + 2)]; break;
      }
      case 'cuberoot': {
        const N = p.N;
        sp.f = (x) => clipv(x * x * x - N); sp.df = (x) => 3 * x * x;
        sp.fS = 'x³ − ' + N; sp.dfS = '3x²';
        sp.rule = Tx('(x³)′ = 3x², sabit → 0', '(x³)′ = 3x², constant → 0');
        sp.view = [-1, 4]; break;
      }
      case 'lnx': {
        sp.f = (x) => (x > 0 ? x + Math.log(x) : NaN); sp.df = (x) => (x > 0 ? 1 + 1 / x : NaN);
        sp.fS = 'x + ln x'; sp.dfS = '1 + 1/x';
        sp.rule = Tx('(x)′ = 1, (ln x)′ = 1/x; tanım kümesi x > 0', '(x)′ = 1, (ln x)′ = 1/x; domain x > 0');
        sp.view = [0, 3]; break;
      }
      case 'expeq': {
        const k = p.k2;
        sp.f = (x) => clipv(Math.exp(x) - k); sp.df = (x) => Math.exp(x);
        sp.fS = 'eˣ − ' + k; sp.dfS = 'eˣ';
        sp.rule = Tx('(eˣ)′ = eˣ, sabit → 0', '(eˣ)′ = eˣ, constant → 0');
        sp.view = [-1, 3.5]; break;
      }
      case 'quintic': {
        const k = p.k2;
        sp.f = (x) => clipv(Math.pow(x, 5) + x - k); sp.df = (x) => 5 * Math.pow(x, 4) + 1;
        sp.fS = poly([[1, 'x⁵'], [1, 'x'], [-k, '']]); sp.dfS = '5x⁴ + 1';
        sp.rule = Tx('(x⁵)′ = 5x⁴, (x)′ = 1; f′ her zaman ≥ 1 olduğundan sıfıra bölme olmaz', '(x⁵)′ = 5x⁴, (x)′ = 1; f′ ≥ 1 always, so there is never a division by zero');
        sp.view = [-1.5, 2]; break;
      }
      case 'cycle': {
        sp.f = (x) => clipv(x * x * x - 2 * x + 2); sp.df = (x) => 3 * x * x - 2;
        sp.fS = 'x³ − 2x + 2'; sp.dfS = '3x² − 2';
        sp.rule = Tx('kuvvet kuralı', 'power rule');
        sp.view = [-2.5, 2]; break;
      }
      case 'flat': {
        const c = p.c;
        sp.f = (x) => x * x - c; sp.df = (x) => 2 * x;
        sp.fS = 'x² − ' + c; sp.dfS = '2x';
        sp.rule = Tx('(x²)′ = 2x', '(x²)′ = 2x');
        sp.view = [-3, 3]; break;
      }
      case 'overshoot': {
        sp.f = (x) => clipv(x * x * x - x - 1); sp.df = (x) => 3 * x * x - 1;
        sp.fS = 'x³ − x − 1'; sp.dfS = '3x² − 1';
        sp.rule = Tx('kuvvet kuralı', 'power rule');
        sp.view = [-2, 2.5]; break;
      }
      case 'multiple': {
        const m = p.m2;
        sp.f = (x) => clipv(x * x - 2 * m * x + m * m); sp.df = (x) => 2 * x - 2 * m;
        sp.fS = poly([[1, 'x²'], [-2 * m, 'x'], [m * m, '']]) + ' = (x − ' + m + ')²'; sp.dfS = poly([[2, 'x'], [-2 * m, '']]);
        sp.rule = Tx('kuvvet kuralı; f′(' + m + ') = 0: kök ÇİFT (katlı)', 'power rule; f′(' + m + ') = 0: the root is DOUBLE (multiple)');
        sp.view = [m - 3, m + 3.5]; break;
      }
      case 'vertical': {
        const c = p.c, u = c === 0 ? 'x' : (c > 0 ? '(x − ' + c + ')' : '(x + ' + (-c) + ')');
        sp.f = (x) => Math.cbrt(x - c); sp.df = (x) => (x === c ? NaN : 1 / (3 * Math.pow(Math.cbrt(x - c), 2)));
        sp.fS = '∛' + u; sp.dfS = '1 / (3·∛' + (c === 0 ? 'x²' : u + '²') + ')';
        sp.rule = Tx('(∛u)′ = 1/(3·∛u²); kökte (u = 0) türev TANIMSIZ: dikey teğet', '(∛u)′ = 1/(3·∛u²); at the root (u = 0) the derivative is UNDEFINED: a vertical tangent');
        sp.view = [c - 3, c + 3]; break;
      }
      default: { // otherRoot
        sp.f = (x) => clipv(x * x * x - 3 * x + 1); sp.df = (x) => 3 * x * x - 3;
        sp.fS = 'x³ − 3x + 1'; sp.dfS = '3x² − 3';
        sp.rule = Tx('kuvvet kuralı', 'power rule');
        sp.view = [-2.5, 2.5]; break;
      }
    }
    sp.success = ['cubic', 'cosm', 'sqrtN', 'cuberoot', 'lnx', 'expeq', 'quintic'].indexOf(p.kind) >= 0;
    return sp;
  }

  // Newton iteration history. status: 'conv' | 'flat' | 'undef' | 'diverge' | 'max'
  function iterate(sp, x0, maxN) {
    const hist = [x0];
    let status = 'max';
    for (let i = 0; i < maxN; i++) {
      const x = hist[hist.length - 1];
      const fx = sp.f(x), d = sp.df(x);
      if (!isFinite(fx) || !isFinite(d)) { status = 'undef'; break; }
      if (Math.abs(fx) < 1e-12) { status = 'conv'; break; }
      if (Math.abs(d) < 1e-9) { status = 'flat'; break; }
      const xn = x - fx / d;
      if (!isFinite(xn) || Math.abs(xn) > 1e6) { status = 'diverge'; break; }
      hist.push(xn);
      if (Math.abs(xn - x) < 1e-13) { status = 'conv'; break; }
    }
    return { hist, status };
  }

  function createProblem(rng, kindArg, x0Arg) {
    const kind = kindArg || (forcedKind === 'random' ? rng.pick(KINDS) : forcedKind);
    const p = { kind, k: 2, m: 3 };
    const I = (a, b) => rng.nextInt(a, b + 1);
    for (let tries = 0; tries < 50; tries++) {
      switch (kind) {
        case 'cubic': p.a = I(1, 3); p.b = I(1, 6); break;
        case 'cosm': p.k2 = I(1, 2); p.x0 = rng.pick([0, 1]); break;
        case 'sqrtN': p.N = rng.pick([2, 3, 5, 6, 7, 10, 11, 13]); break;
        case 'cuberoot': p.N = rng.pick([2, 3, 4, 5, 7, 9, 10]); break;
        case 'lnx': p.x0 = 1; break;
        case 'expeq': p.k2 = rng.pick([2, 3, 5, 10]); break;
        case 'quintic': p.k2 = I(1, 5); p.x0 = 1; break;
        case 'cycle': p.x0 = rng.pick([0, 1]); break;
        case 'flat': p.c = rng.pick([2, 3, 5]); p.x0 = rng.pick([0, 0.1]); if (x0Arg !== undefined) p.x0 = x0Arg; break;
        case 'vertical': p.c = rng.pick([0, 0, 1, -1]); p.x0 = p.c + rng.pick([1, -1, 0.5, -0.5]); break;
        case 'overshoot': p.x0 = 0.5; break;
        case 'multiple': p.m2 = I(1, 3); p.x0 = p.m2 + 2; break;
        default: p.x0 = 0.9; break;
      }
      const sp = spec(p);
      // choose the start for the generic success kinds by simulation
      if (p.kind === 'cubic') {
        let r = 10; for (let x = 10; x > -10; x -= 0.001) { if (sp.f(x) * sp.f(x - 0.001) <= 0) { r = x; break; } }
        const c0 = Math.ceil(r) === r ? r + 1 : Math.ceil(r);
        p.x0 = c0;
      } else if (p.kind === 'sqrtN') {
        const fl = Math.floor(Math.sqrt(p.N)); p.x0 = rng.pick([fl, fl + 1]);
      } else if (p.kind === 'cuberoot') {
        p.x0 = rng.pick([1, 2]);
      } else if (p.kind === 'expeq') {
        p.x0 = p.k2 === 10 ? 2 : rng.pick([1, 2]);
      }
      if (!sp.success) break;
      const it = iterate(sp, p.x0, 12);
      if (it.status === 'conv' && it.hist.length - 1 <= 9) break;
    }
    return p;
  }

  // roots of f in [-8, 8] by sign changes + bisection (for the explanatory sentences only)
  function rootsOf(sp) {
    const out = [];
    let prev = -8, fp = sp.f(prev);
    for (let x = -8 + 0.01; x <= 8.0001; x += 0.01) {
      const fx = sp.f(x);
      if (isFinite(fp) && isFinite(fx) && fp * fx < 0) {
        let lo = prev, hi = x;
        for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (sp.f(lo) * sp.f(mid) <= 0) hi = mid; else lo = mid; }
        out.push((lo + hi) / 2);
      }
      prev = x; fp = fx;
    }
    return out;
  }

  function bracket(sp, r) {
    const hs = [1, 0.5, 0.25];
    for (let i = 0; i < hs.length; i++) {
      const h = hs[i], lo = Math.floor(r / h) * h, hi = lo + h;
      const a = sp.f(lo), b = sp.f(hi);
      if (isFinite(a) && isFinite(b) && a * b < 0) return [lo, hi];
    }
    return null;
  }

  const fx0Txt = (p, sp) => 'f(x) = ' + sp.fS;

  function problemStatement(p) {
    const sp = spec(p), x0 = S(+p.x0.toFixed(4));
    if (p.kind === 'sqrtN') {
      return Tx('f(x) = x² − ' + p.N + ' fonksiyonuna Newton yöntemini x₀ = ' + x0 + ' ile uygulayarak √' + p.N + ' sayısını yaklaşık olarak hesaplayın: x₁, x₂, x₃ yaklaşımlarını bulun ve sonucu gerçek değerle karşılaştırın.',
        'Apply Newton\'s method to f(x) = x² − ' + p.N + ' with x₀ = ' + x0 + ' to approximate √' + p.N + ': find the approximations x₁, x₂, x₃ and compare with the true value.');
    }
    if (p.kind === 'expeq') {
      return Tx('f(x) = eˣ − ' + p.k2 + ' fonksiyonuna Newton yöntemini x₀ = ' + x0 + ' ile uygulayarak ln ' + p.k2 + ' sayısını yaklaşık olarak bulun (x₁, x₂, x₃ ve yaklaşık kök).',
        'Apply Newton\'s method to f(x) = eˣ − ' + p.k2 + ' with x₀ = ' + x0 + ' to approximate ln ' + p.k2 + ' (find x₁, x₂, x₃ and the approximate root).');
    }
    if (sp.success) {
      return Tx('f(x) = ' + sp.fS + ' = 0 denkleminin kökünü Newton yöntemiyle, x₀ = ' + x0 + ' başlangıç tahmini kullanarak bulun: x₁, x₂, x₃ yaklaşımlarını hesaplayın ve kökü 6 ondalık basamağa kadar yaklaşık olarak verin.',
        'Find the root of f(x) = ' + sp.fS + ' = 0 with Newton\'s method, using the starting guess x₀ = ' + x0 + ': compute the approximations x₁, x₂, x₃ and give the root to about 6 decimal places.');
    }
    switch (p.kind) {
      case 'cycle': return Tx('f(x) = ' + sp.fS + ' için Newton yöntemini x₀ = ' + x0 + ' ile başlatın ve ilk birkaç adımı hesaplayın. Dizi köke yaklaşıyor mu? Ne olduğunu açıklayın.', 'For f(x) = ' + sp.fS + ' start Newton\'s method at x₀ = ' + x0 + ' and compute the first few steps. Does the sequence approach a root? Explain what happens.');
      case 'flat': return Tx('f(x) = ' + sp.fS + ' için Newton yöntemini x₀ = ' + x0 + ' ile başlatın. İlk adımda ne olur? Bu başlangıç noktası uygun mudur?', 'For f(x) = ' + sp.fS + ' start Newton\'s method at x₀ = ' + x0 + '. What happens in the first step? Is this a suitable starting point?');
      case 'overshoot': return Tx('f(x) = ' + sp.fS + ' için Newton yöntemini x₀ = ' + x0 + ' ile başlatın ve ilk adımları hesaplayın. Dizi düzgünce bir köke yakınsıyor mu? Nedenini f′(x₀) ile açıklayın.', 'For f(x) = ' + sp.fS + ' start Newton\'s method at x₀ = ' + x0 + ' and compute the first steps. Does the sequence settle smoothly on a root? Explain using f′(x₀).');
      case 'multiple': return Tx('f(x) = ' + sp.fS + ' için Newton yöntemini x₀ = ' + x0 + ' ile başlatın. Yakınsama hızı nasıldır? Her adımda hata nasıl değişir?', 'For f(x) = ' + sp.fS + ' start Newton\'s method at x₀ = ' + x0 + '. How fast does it converge? How does the error change from step to step?');
      case 'vertical': return Tx('f(x) = ' + sp.fS + ' fonksiyonunun kökü x = ' + S(p.c) + ' noktasıdır. Newton yöntemini x₀ = ' + x0 + ' ile başlatıp ilk adımları hesaplayalım: dizi köke yaklaşıyor mu?', 'The root of f(x) = ' + sp.fS + ' is x = ' + S(p.c) + '. Let\'s start Newton\'s method at x₀ = ' + x0 + ' and compute the first steps: does the sequence approach the root?');
      default: return Tx('f(x) = ' + sp.fS + ' için Newton yöntemini x₀ = ' + x0 + ' ile başlatın ve dizinin hangi köke gittiğini bulun. f\'nin üç kökünü işaret değişiminden yaklaşık belirleyip dizinin gittiği kökü onlarla karşılaştırın.', 'For f(x) = ' + sp.fS + ' start Newton\'s method at x₀ = ' + x0 + ' and find which root the sequence goes to. Locate the three roots of f from sign changes and compare.');
    }
  }

  // ---------- steps ----------
  function solveSteps(p) {
    const sp = spec(p), st = [];
    let n = 0;
    const H = (tr, en) => st.push(Hdr(++n, Tx(tr, en)));
    const T = (tr, en) => st.push(Tx(tr, en));
    const it = iterate(sp, p.x0, 10), hist = it.hist;
    const x0s = nf(p.x0, 4);

    H('Fonksiyon ve türevi', 'The function and its derivative');
    T('f(x) = ' + sp.fS + '. Aranan: f(x) = 0 denkleminin kökü.', 'f(x) = ' + sp.fS + '. Wanted: a root of f(x) = 0.');
    T('f′(x) = ' + sp.dfS + '   (' + sp.rule + ').', 'f′(x) = ' + sp.dfS + '   (' + sp.rule + ').');

    const fin = hist[hist.length - 1];
    let rootGuess = NaN;
    if (it.status === 'conv') rootGuess = fin;
    if (sp.success && isFinite(rootGuess)) {
      H('Köke yakın bir başlangıç seç (ARA DEĞER TEOREMİ)', 'Pick a start near the root (INTERMEDIATE VALUE THEOREM)');
      const br = bracket(sp, rootGuess);
      if (br) {
        T('f sürekli ve f(' + nf(br[0], 2) + ') = ' + nf(sp.f(br[0]), 4) + ' ile f(' + nf(br[1], 2) + ') = ' + nf(sp.f(br[1]), 4) + ' zıt işaretli ⇒ kök [' + nf(br[0], 2) + ', ' + nf(br[1], 2) + '] aralığındadır.',
          'f is continuous and f(' + nf(br[0], 2) + ') = ' + nf(sp.f(br[0]), 4) + ', f(' + nf(br[1], 2) + ') = ' + nf(sp.f(br[1]), 4) + ' have opposite signs ⇒ a root lies in [' + nf(br[0], 2) + ', ' + nf(br[1], 2) + '].');
      }
      T('Başlangıç tahmini x₀ = ' + x0s + ' alınır (bu aralığa yakın; f′(x₀) = ' + nf(sp.df(p.x0), 4) + ' ≠ 0).', 'Take the starting guess x₀ = ' + x0s + ' (close to that interval; f′(x₀) = ' + nf(sp.df(p.x0), 4) + ' ≠ 0).');
    } else {
      H('Başlangıç tahmini', 'The starting guess');
      T('x₀ = ' + x0s + ' alınıyor. f(x₀) = ' + nf(sp.f(p.x0), 4) + ', f′(x₀) = ' + nf(sp.df(p.x0), 4) + '.', 'We take x₀ = ' + x0s + '. f(x₀) = ' + nf(sp.f(p.x0), 4) + ', f′(x₀) = ' + nf(sp.df(p.x0), 4) + '.');
    }

    H('Newton formülü', 'Newton\'s formula');
    T('Teğet: y = f(xₙ) + f′(xₙ)(x − xₙ). y = 0 koyunca xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ).', 'Tangent: y = f(xₙ) + f′(xₙ)(x − xₙ). Setting y = 0 gives xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ).');
    const sub = (s) => s.replace(/eˣ/g, 'e^(xₙ)').replace(/x/g, 'xₙ');
    T('Bu fonksiyon için: xₙ₊₁ = xₙ − (' + sub(sp.fS.split(' = ')[0]) + ') / (' + sub(sp.dfS) + ').', 'For this function: xₙ₊₁ = xₙ − (' + sub(sp.fS.split(' = ')[0]) + ') / (' + sub(sp.dfS) + ').');
    if (p.kind === 'sqrtN') T('Sadeleştirince xₙ₊₁ = (xₙ + ' + p.N + '/xₙ)/2: eski adıyla "Babil (ortalama) yöntemi" — tahmin ile ' + p.N + '/tahmin değerlerinin ortalaması.', 'Simplifying gives xₙ₊₁ = (xₙ + ' + p.N + '/xₙ)/2: the old "Babylonian (averaging) method" — the average of the guess and ' + p.N + '/guess.');

    H('İterasyonlar (6 ondalığa yuvarlanmış; her adım yuvarlanmamış değerle hesaplandı)', 'Iterations (rounded to 6 decimals; each step computed from the unrounded value)');
    for (let i = 0; i < hist.length - 1; i++) {
      const x = hist[i], fx = sp.f(x), d = sp.df(x), xn = hist[i + 1];
      T('n = ' + i + ':  x' + sb(i) + ' = ' + nf(x) + ',  f(x' + sb(i) + ') = ' + nf(fx) + ',  f′(x' + sb(i) + ') = ' + nf(d) + '  ⇒  x' + sb(i + 1) + ' = ' + nf(x) + ' − (' + nf(fx) + ')/(' + nf(d) + ') = ' + nf(xn) + '.',
        'n = ' + i + ':  x' + sb(i) + ' = ' + nf(x) + ',  f(x' + sb(i) + ') = ' + nf(fx) + ',  f′(x' + sb(i) + ') = ' + nf(d) + '  ⇒  x' + sb(i + 1) + ' = ' + nf(x) + ' − (' + nf(fx) + ')/(' + nf(d) + ') = ' + nf(xn) + '.');
    }
    if (it.status === 'flat') {
      const x = hist[hist.length - 1];
      T('n = ' + (hist.length - 1) + ':  x' + sb(hist.length - 1) + ' = ' + nf(x) + ',  f′(x' + sb(hist.length - 1) + ') = ' + nf(sp.df(x)) + ' = 0 ⇒ bölme yapılamaz, yöntem DURUR.',
        'n = ' + (hist.length - 1) + ':  x' + sb(hist.length - 1) + ' = ' + nf(x) + ',  f′(x' + sb(hist.length - 1) + ') = ' + nf(sp.df(x)) + ' = 0 ⇒ division is impossible, the method STOPS.');
    } else if (it.status === 'undef') {
      T('Son tahmin f\'nin tanım kümesi dışında: yöntem devam edemez.', 'The latest guess lies outside the domain of f: the method cannot continue.');
    }

    if (p.kind === 'sqrtN' && it.status === 'conv') {
      // exact fractions
      let a = Math.round(hist[0]), b = 1;
      const fracs = [a + '/' + b];
      for (let i = 0; i < 3; i++) {
        const na = a * a + p.N * b * b, nb = 2 * a * b, g = gcd(na, nb);
        a = na / g; b = nb / g; fracs.push(b === 1 ? String(a) : a + '/' + b);
      }
      H('Tam kesirlerle kontrol', 'Exact-fraction check');
      T('x = p/q için xₙ₊₁ = (p² + ' + p.N + 'q²)/(2pq) olduğundan tahminler TAM kesirlerdir: x₀ = ' + fracs[0] + ', x₁ = ' + fracs[1] + ', x₂ = ' + fracs[2] + ', x₃ = ' + fracs[3] + '. Ondalık değerler yukarıdakilerle uyuşur.',
        'For x = p/q, xₙ₊₁ = (p² + ' + p.N + 'q²)/(2pq), so the iterates are EXACT fractions: x₀ = ' + fracs[0] + ', x₁ = ' + fracs[1] + ', x₂ = ' + fracs[2] + ', x₃ = ' + fracs[3] + '. Their decimals match the table above.');
    }

    H('Sonuç', 'Conclusion');
    if (sp.success && it.status === 'conv') {
      const r = fin;
      T('Yaklaşık kök: x ≈ ' + nf(r) + ' (|f(x)| ≈ ' + sci(Math.abs(sp.f(r))) + '). Bu, yukarıdaki yuvarlanmış tablonun son satırıdır.',
        'Approximate root: x ≈ ' + nf(r) + ' (|f(x)| ≈ ' + sci(Math.abs(sp.f(r))) + '). This is the last row of the rounded table above.');
      if (p.kind === 'sqrtN') T('Gerçek değer √' + p.N + ' = ' + nf(Math.sqrt(p.N), 6) + '.', 'True value √' + p.N + ' = ' + nf(Math.sqrt(p.N), 6) + '.');
      if (p.kind === 'expeq') T('Gerçek değer ln ' + p.k2 + ' = ' + nf(Math.log(p.k2), 6) + '.', 'True value ln ' + p.k2 + ' = ' + nf(Math.log(p.k2), 6) + '.');
      if (p.kind === 'cuberoot') T('Gerçek değer ∛' + p.N + ' = ' + nf(Math.cbrt(p.N), 6) + '.', 'True value ∛' + p.N + ' = ' + nf(Math.cbrt(p.N), 6) + '.');
      H('Yakınsama hızı: karesel', 'Speed of convergence: quadratic');
      const errs = [];
      for (let i = 0; i < hist.length - 1 && i < 5; i++) errs.push('|x' + sb(i) + ' − x| = ' + sci(Math.abs(hist[i] - r)));
      T('Hatalar: ' + errs.join(',  ') + '. Hata her adımda kabaca KARELENİR: doğru basamak sayısı yaklaşık ikiye katlanır (basit köklerde).',
        'Errors: ' + errs.join(',  ') + '. The error is roughly SQUARED each step: the number of correct digits about doubles (for simple roots).');
    } else {
      switch (p.kind) {
        case 'cycle': {
          const isCyc = hist.length >= 3 && Math.abs(hist[2] - hist[0]) < 1e-9;
          if (isCyc) {
            T('Dizi: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  Her iki adımda bir kendini tekrar eder: x₂ = x₀. Dizi bir köke YAKINSAMAZ.',
              'The sequence ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  repeats every two steps: x₂ = x₀. It does NOT converge to a root.');
            T('Neden? 0 ve 1 noktalarındaki teğetlerin x-eksenini kestiği noktalar birbirinin başlangıç noktasına denk gelir; f gerçek kökü (≈ ' + nf(rootsOf(sp)[0], 4) + ') bu iki noktadan uzaktır. Çare: başlangıcı köke yaklaştırın (ör. x₀ = −1,5) ya da kökü önce işaret değişimiyle sıkıştırın (ikiye bölme).',
              'Why? The tangents at 0 and at 1 hit the x-axis exactly at each other starting point; the real root (≈ ' + nf(rootsOf(sp)[0], 4) + ') is far from both. Remedy: start closer to the root (e.g. x₀ = −1.5) or first bracket it by sign change (bisection).');
          } else {
            T('Bu başlangıç noktasında dizi 2 noktalı döngüye girmiyor: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  Döngü yalnızca x₀ = 0 ve x₀ = 1 başlangıçlarında oluşur; başlangıç tahmini sonucu belirler. Gerçek kök ≈ ' + nf(rootsOf(sp)[0], 4) + '.',
              'From this start the sequence does not enter the 2-cycle: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  The cycle occurs only for x₀ = 0 and x₀ = 1; the starting guess decides the outcome. The real root is ≈ ' + nf(rootsOf(sp)[0], 4) + '.');
          }
          break;
        }
        case 'flat': {
          if (it.status === 'flat') {
            T('f′(x₀) = 2·' + nf(p.x0) + ' = 0: teğet YATAYDIR ve x-eksenini kesmez; Newton formülünde sıfıra bölme olur. Bu x₀ kullanılamaz.', 'f′(x₀) = 2·' + nf(p.x0) + ' = 0: the tangent is HORIZONTAL and never meets the x-axis; Newton\'s formula would divide by zero. This x₀ cannot be used.');
          } else {
            T('f′(x₀) = ' + nf(sp.df(p.x0)) + ' çok küçük olduğundan x₁ = ' + nf(hist[1]) + ' köke çok uzağa FIRLAR (kök ≈ ' + nf(Math.sqrt(p.c), 4) + '). Sonraki adımlarda dizi yine de yaklaşır ama çok adım harcar.', 'Because f′(x₀) = ' + nf(sp.df(p.x0)) + ' is tiny, x₁ = ' + nf(hist[1]) + ' SHOOTS far from the root (root ≈ ' + nf(Math.sqrt(p.c), 4) + '). Later steps do approach it, but many steps are wasted.');
          }
          T('Çare: f′ ≈ 0 olan yerlerden (f\'nin sıfırlarından) uzak, köke yakın bir x₀ seçin.', 'Remedy: pick x₀ near the root and away from zeros of f′.');
          break;
        }
        case 'overshoot': {
          T('f′(x₀) = ' + nf(sp.df(p.x0)) + '; gerçek kök ≈ 1,324718. Adımlar: ' + hist.slice(0, 8).map((v) => nf(v, 2)).join(', ') + ' …  ' + (it.status === 'conv' ? 'Dizi sonunda yakınsar.' : 'Bu adımlarda düzgün bir yakınsama yoktur.') + (Math.abs(sp.df(p.x0)) < 1 ? ' Teğet neredeyse yatay olduğundan x₁ köke ters yönde çok uzağa atlar.' : ''),
            'f′(x₀) = ' + nf(sp.df(p.x0)) + '; the real root is ≈ 1.324718. Steps: ' + hist.slice(0, 8).map((v) => nf(v, 2)).join(', ') + ' …  ' + (it.status === 'conv' ? 'The sequence does converge in the end.' : 'There is no smooth convergence in these steps.') + (Math.abs(sp.df(p.x0)) < 1 ? ' Because the tangent is almost flat, x₁ jumps far away on the wrong side of the root.' : ''));
          T('Ders: kötü seçilmiş x₀ (teğetin neredeyse yatay olduğu yer) diziyi köke uzak yerlere savurabilir. İşaret değişimiyle bulunan [1, 2] aralığından x₀ = 1,5 almak sorunsuz yakınsar.', 'Lesson: a badly chosen x₀ (where the tangent is almost flat) can throw the sequence far from the root. Taking x₀ = 1.5 from the sign-change interval [1, 2] converges without trouble.');
          break;
        }
        case 'multiple': {
          const m = p.m2;
          T('Formül sadeleşir: xₙ₊₁ = xₙ − (xₙ − ' + m + ')²/(2(xₙ − ' + m + ')) = (xₙ + ' + m + ')/2. Hata HER ADIMDA YARIYA iner: |xₙ − ' + m + '| = ' + nf(Math.abs(p.x0 - m), 4) + '/2ⁿ.',
            'The formula simplifies: xₙ₊₁ = xₙ − (xₙ − ' + m + ')²/(2(xₙ − ' + m + ')) = (xₙ + ' + m + ')/2. The error is HALVED EVERY STEP: |xₙ − ' + m + '| = ' + nf(Math.abs(p.x0 - m), 4) + '/2ⁿ.');
          T('Dizi: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  Kök x = ' + m + '. f′(' + m + ') = 0 olduğu için (katlı kök) yakınsama yalnızca DOĞRUSALDIR (basamak başına birkaç adım gerekir), basit köklerdeki karesel hıza göre çok yavaştır.',
            'Sequence: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  The root is x = ' + m + '. Since f′(' + m + ') = 0 (multiple root) convergence is only LINEAR (several steps per digit), far slower than the quadratic speed at simple roots.');
          break;
        }
        case 'otherRoot': {
          const rs = rootsOf(sp);
          let near = rs[0];
          rs.forEach((v) => { if (Math.abs(v - p.x0) < Math.abs(near - p.x0)) near = v; });
          const same = it.status === 'conv' && Math.abs(fin - near) < 1e-3;
          T('f fonksiyonunun üç kökü (işaret değişimi + ikiye bölme): ' + rs.map((v) => nf(v, 4)).join(', ') + '. x₀ = ' + x0s + ' için en yakın kök ' + nf(near, 4) + '. Newton dizisi ' + (it.status === 'conv' ? 'x ≈ ' + nf(fin, 6) + ' köküne' : 'hiçbir köke') + ' gider' + (it.status === 'conv' ? (same ? ' (en yakın kök).' : ' — en yakın kök DEĞİL!') : '.'),
            'The three roots of f (sign change + bisection): ' + rs.map((v) => nf(v, 4)).join(', ') + '. For x₀ = ' + x0s + ' the nearest root is ' + nf(near, 4) + '. The Newton sequence goes to ' + (it.status === 'conv' ? 'the root x ≈ ' + nf(fin, 6) : 'no root') + (it.status === 'conv' ? (same ? ' (the nearest root).' : ' — NOT the nearest root!') : '.'));
          T('f′(x₀) = ' + nf(sp.df(p.x0)) + '; |x₁ − x₀| = ' + nf(Math.abs((hist[1] === undefined ? p.x0 : hist[1]) - p.x0), 4) + '. Teğet küçük eğimliyse ilk adım uzağa taşar ve dizi başka bir köke düşebilir: başlangıç tahmini hangi kökü bulacağınızı belirler.',
            'f′(x₀) = ' + nf(sp.df(p.x0)) + '; |x₁ − x₀| = ' + nf(Math.abs((hist[1] === undefined ? p.x0 : hist[1]) - p.x0), 4) + '. If the tangent has a small slope the first step carries far and the sequence can fall onto another root: the starting guess decides which root you find.');
          break;
        }
        case 'vertical': {
          const u0 = p.x0 - p.c;
          T('Sadeleşir: f/f′ = ∛u · 3∛u² = 3u (u = x − ' + S(p.c) + '), yani xₙ₊₁ − ' + S(p.c) + ' = (xₙ − ' + S(p.c) + ') − 3(xₙ − ' + S(p.c) + ') = −2(xₙ − ' + S(p.c) + '). Kökten uzaklık HER ADIMDA İKİYE KATLANIR ve işaret değiştirir.',
            'It simplifies: f/f′ = ∛u · 3∛u² = 3u (u = x − ' + S(p.c) + '), so xₙ₊₁ − ' + S(p.c) + ' = (xₙ − ' + S(p.c) + ') − 3(xₙ − ' + S(p.c) + ') = −2(xₙ − ' + S(p.c) + '). The distance from the root DOUBLES EVERY STEP and flips sign.');
          T('Dizi: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  Uzaklık |xₙ − ' + S(p.c) + '| = ' + nf(Math.abs(u0), 4) + '·2ⁿ: dizi köke YAKINSAMAZ, ıraksar.',
            'Sequence: ' + hist.slice(0, 7).map((v) => nf(v, 4)).join(' → ') + ' …  The distance is |xₙ − ' + S(p.c) + '| = ' + nf(Math.abs(u0), 4) + '·2ⁿ: it does NOT converge, it diverges.');
          T('Neden? Köklerde teğet DİKEYDİR (f′ tanımsız, sonsuz eğim); f köşeli / sivri olduğu için teğet yaklaşımı kökün yakınında bile iyi değildir. Newton, f′(r) sonlu ve sıfırdan farklı olan türevlenebilir köklerde çalışır.',
            'Why? The tangent at the root is VERTICAL (f′ undefined, infinite slope); because f has a sharp point there, the tangent line is a bad model even close to the root. Newton works at differentiable roots where f′(r) is finite and nonzero.');
          break;
        }
        default:
          T('Dizi ' + (it.status === 'conv' ? 'x ≈ ' + nf(fin, 6) + ' değerine yakınsadı.' : 'bu adımlarda yakınsamadı.'), 'The sequence ' + (it.status === 'conv' ? 'converged to x ≈ ' + nf(fin, 6) + '.' : 'did not converge in these steps.'));
      }
    }
    return st;
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      'AMAÇ\n' +
      'f(x) = 0 denkleminin kökünü, cebirle çözülemediğinde (ör. cos x = x, x⁵ + x − 1 = 0) sayısal olarak bulmak.\n' +
      '\n' +
      'GEOMETRİK FİKİR\n' +
      'Mevcut tahmin xₙ\'de eğriye teğet çiz; teğetin x-eksenini kestiği nokta bir sonraki, genellikle daha iyi tahmin xₙ₊₁\'dir.\n' +
      '\n' +
      'NEWTON İTERASYON FORMÜLÜ\n' +
      '   xₙ₊₁ = xₙ − f(xₙ) / f\'(xₙ)\n' +
      '(Teğet: y = f(xₙ) + f\'(xₙ)(x − xₙ); y = 0 konunca formül çıkar.)\n' +
      '\n' +
      'YÖNTEM\n' +
      '   1. f(x) ve f\'(x) yaz.\n' +
      '   2. Köke yakın bir başlangıç x₀ seç (grafik veya işaret değişimi; ara değer teoremi).\n' +
      '   3. xₙ₊₁ = xₙ − f(xₙ)/f\'(xₙ) hesapla.\n' +
      '   4. |xₙ₊₁ − xₙ| veya |f(xₙ₊₁)| yeterince küçük olana dek tekrarla.\n' +
      '\n' +
      'YAKINSAMA\n' +
      'Basit köke yakınken yakınsama İKİNCİ DERECEDENDİR: doğru basamak sayısı her adımda kabaca ikiye katlanır (1 → 2 → 4 → 8 basamak).\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '   • f(x) = x² − N için formül xₙ₊₁ = (xₙ + N/xₙ)/2 olur (Babil yöntemi, √N).\n' +
      '   • f(x) = xᵏ − N için xₙ₊₁ = ((k−1)xₙ + N/xₙᵏ⁻¹)/k (k. dereceden kök).\n' +
      '   • Bir kökün yerini anlamak için önce işaret değişimine bak: f(a)·f(b) < 0 ⇒ [a, b]\'de kök vardır.\n' +
      '\n' +
      'TUZAKLAR\n' +
      '   • f\'(xₙ) = 0 ise bölme yapılamaz (yatay teğet x-eksenini kesmez).\n' +
      '   • f\'(xₙ) çok küçükse bir sonraki tahmin köke çok uzağa fırlar.\n' +
      '   • Kötü x₀ başka köke gidebilir, iraksayabilir veya döngüye girebilir (ör. f = x³ − 2x + 2, x₀ = 0 ⇒ 0 ↔ 1 döngüsü).\n' +
      '   • Katlı köklerde (f\'(r) = 0) yakınsama yalnızca doğrusaldır.\n' +
      '   • Süreksiz veya köşeli fonksiyonlarda (|x|, ∛x) başarısız olabilir.\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      '√2\'yi bul: f = x² − 2, f\' = 2x. xₙ₊₁ = xₙ − (xₙ² − 2)/(2xₙ) = (xₙ + 2/xₙ)/2. x₀ = 1 → x₁ = 1,5 → x₂ = 1,41667 → x₃ = 1,414216 (gerçek 1,414214).\n' +
      '\n' +
      'HAFIZA İPUCU: "Teğeti çiz, x-eksenine in, yeni tahmin orada."\n' +
      '\n' +
      'KAYDIRICILAR: İterasyon kaydırıcısı ilk k teğeti (turuncu) ve iterasyon noktalarını (x₀, x₁, …) gösterir. Başlangıç kaydırıcısı x₀\'ı değiştirir; köke yakın, uzak ve yatay teğet yakınında başlayarak farkı görün.',
      'GOAL\n' +
      'Find roots of f(x) = 0 numerically when algebra fails (e.g. cos x = x, x⁵ + x − 1 = 0).\n' +
      '\n' +
      'GEOMETRIC IDEA\n' +
      'Draw the tangent to the curve at the current guess xₙ; where that tangent crosses the x-axis is the next, usually better, guess xₙ₊₁.\n' +
      '\n' +
      'NEWTON ITERATION FORMULA\n' +
      '   xₙ₊₁ = xₙ − f(xₙ) / f\'(xₙ)\n' +
      '(Tangent: y = f(xₙ) + f\'(xₙ)(x − xₙ); setting y = 0 gives the formula.)\n' +
      '\n' +
      'METHOD\n' +
      '   1. Write f(x) and f\'(x).\n' +
      '   2. Choose a starting value x₀ near the root (graph or sign change; intermediate value theorem).\n' +
      '   3. Compute xₙ₊₁ = xₙ − f(xₙ)/f\'(xₙ).\n' +
      '   4. Repeat until |xₙ₊₁ − xₙ| or |f(xₙ₊₁)| is small enough.\n' +
      '\n' +
      'CONVERGENCE\n' +
      'Near a simple root convergence is QUADRATIC: the number of correct digits roughly doubles each step (1 → 2 → 4 → 8 digits).\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '   • For f(x) = x² − N the formula becomes xₙ₊₁ = (xₙ + N/xₙ)/2 (the Babylonian method for √N).\n' +
      '   • For f(x) = xᵏ − N: xₙ₊₁ = ((k−1)xₙ + N/xₙᵏ⁻¹)/k (k-th root).\n' +
      '   • To locate a root first look for a sign change: f(a)·f(b) < 0 ⇒ there is a root in [a, b].\n' +
      '\n' +
      'PITFALLS\n' +
      '   • If f\'(xₙ) = 0 you cannot divide (a horizontal tangent never meets the x-axis).\n' +
      '   • If f\'(xₙ) is tiny the next guess shoots far from the root.\n' +
      '   • A bad x₀ can land on another root, diverge or cycle (e.g. f = x³ − 2x + 2, x₀ = 0 gives a 0 ↔ 1 cycle).\n' +
      '   • At multiple roots (f\'(r) = 0) convergence is only linear.\n' +
      '   • It can fail for discontinuous or cornered functions (|x|, ∛x).\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      'Find √2: f = x² − 2, f\' = 2x. xₙ₊₁ = xₙ − (xₙ² − 2)/(2xₙ) = (xₙ + 2/xₙ)/2. x₀ = 1 → x₁ = 1.5 → x₂ = 1.41667 → x₃ = 1.414216 (true 1.414214).\n' +
      '\n' +
      'MEMORY AID: "Draw the tangent, slide down to the x-axis, the new guess is there."\n' +
      '\n' +
      'SLIDERS: The iteration slider shows the first k tangents (orange) and the iterates (x₀, x₁, …). The start slider changes x₀; try starting near the root, far from it and near a flat tangent to see the difference.');
  }

  // ---------- drawing ----------
  function autoY(fn, x0, x1, extra) {
    const vals = [];
    for (let i = 0; i <= 300; i++) {
      const v = fn(x0 + (x1 - x0) * i / 300);
      if (isFinite(v) && Math.abs(v) < 1e6) vals.push(v);
    }
    vals.sort((u, v) => u - v);
    let lo = 0, hi = 1;
    if (vals.length) { lo = vals[Math.floor(vals.length * 0.03)]; hi = vals[Math.min(vals.length - 1, Math.ceil(vals.length * 0.97) - 1)]; }
    (extra || []).forEach((e) => { if (isFinite(e) && Math.abs(e) < 1e4) { lo = Math.min(lo, e); hi = Math.max(hi, e); } });
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    let span = hi - lo;
    if (!(span > 1e-6)) span = 1;
    const pad = Math.max(span * 0.15, 0.3);
    return [lo - pad, hi + pad];
  }

  function draw(canvas, p) {
    const sp = spec(p);
    const it = iterate(sp, p.x0, 12), hist = it.hist;
    const kmax = hist.length - 1;
    const k = Math.max(0, Math.min(Math.round(p.k), 12, kmax));
    let x0 = sp.view[0], x1 = sp.view[1];
    const upto = hist.slice(0, k + 1).filter((v) => Math.abs(v) <= 15);
    upto.forEach((v) => { x0 = Math.min(x0, v - 0.5); x1 = Math.max(x1, v + 0.5); });
    const f = (x) => { try { const v = sp.f(x); return isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
    const yr = autoY(f, x0, x1, upto.map(f));
    canvas.setViewport(x0, x1, yr[0], yr[1]);
    canvas.addGuideLine({ axis: 'horizontal', position: 0, color: canvas.gray() });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
    for (let i = 0; i <= k && i < hist.length; i++) {
      const xi = hist[i], fi = f(xi);
      if (!isFinite(xi) || Math.abs(xi) > 1e4) continue;
      canvas.addMarker({ x: xi, y: 0, color: i === k ? canvas.gold() : canvas.accent(), radius: i === k ? 7 : 5, label: 'x' + sb(i) });
      if (isFinite(fi) && Math.abs(fi) < 1e4) {
        canvas.addSegment({ x1: xi, y1: 0, x2: xi, y2: fi, color: canvas.gray(), thickness: 1, dashed: true });
        if (i < k && i + 1 < hist.length && Math.abs(hist[i + 1]) < 1e4) canvas.addSegment({ x1: xi, y1: fi, x2: hist[i + 1], y2: 0, color: canvas.orange(), thickness: 2 });
      }
    }
    if (it.status === 'conv' && k === kmax) {
      canvas.addMarker({ x: hist[kmax], y: 0, color: canvas.green(), shape: 'circle', radius: 9, hollow: true });
    }
  }

  function buildControls(rightCol, getProblem, helpers) {
    helpers.addSelect({
      options: [{ label: Tx('Örnek türü: Rastgele', 'Example type: Random'), value: 'random' }].concat(KINDS.concat(['vertical']).map((k) => ({ label: kindLabel(k), value: k }))),
      get: () => forcedKind,
      set: (v) => { forcedKind = String(v); helpers.regenerate(); },
    });
    helpers.addSlider({
      caption: Tx('İterasyon sayısı k (çizilen teğetler)', 'Iteration count k (tangents drawn)'),
      min: 0, max: 8, step: 1,
      get: () => getProblem().k,
      set: (v) => { getProblem().k = Math.max(0, Math.min(8, Math.round(v))); },
    });
    helpers.addSlider({
      caption: Tx('Başlangıç tahmini x₀', 'Initial guess x₀'),
      min: -5, max: 5, step: 0.1,
      get: () => getProblem().x0,
      set: (v) => { getProblem().x0 = Math.round(v * 10) / 10; },
    });
  }

  Topics.register('applications', {
    id: 'newtonsMethod',
    tabTitle: () => Tx('Newton Yöntemi', 'Newton\'s Method'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    _test: { spec, iterate }, // numeric self-checks (tests/)
    challenge: {
      title: ['🎯 Önce x₁’i tahmin edelim', '🎯 Let’s predict x₁ first'],
      prompt: (p) => { const sp = spec(p), x0 = S(+p.x0.toFixed(4)); return Tx(`f(x) = ${sp.fS} ve x₀ = ${x0} için Newton adımı x₁ = x₀ − f(x₀)/f′(x₀) kaçtır? (4 ondalık basamak.)`, `For f(x) = ${sp.fS} and x₀ = ${x0}, what is the Newton step x₁ = x₀ − f(x₀)/f′(x₀)? (4 decimals.)`); },
      target: (p) => { const sp = spec(p), h = iterate(sp, p.x0, 1).hist; return h.length > 1 ? h[1] : p.x0; },
      tol: () => 0.0006,
      hint: () => Tx('Önce f(x₀) ve f′(x₀) değerlerini ayrı ayrı hesaplayalım.', 'First compute f(x₀) and f′(x₀) separately.'),
    },
    links: [
      { match: /^\s*(NEWTON İTERASYON FORMÜLÜ|NEWTON ITERATION FORMULA)$/, make: (rng) => createProblem(rng, 'cubic') },
      { match: /^\s*(YAKINSAMA|CONVERGENCE)$/, make: (rng) => createProblem(rng, 'quintic') },
      { match: /^\s*• (f\(x\) = x² − N için|For f\(x\) = x² − N)/, make: (rng) => createProblem(rng, 'sqrtN') },
      { match: /^\s*• (f\(x\) = xᵏ − N için|For f\(x\) = xᵏ − N)/, make: (rng) => createProblem(rng, 'cuberoot') },
      { match: /^\s*• (Bir kökün yerini|To locate a root)/, make: (rng) => createProblem(rng, 'lnx') },
      { match: /^\s*• (f'\(xₙ\) = 0 ise|If f'\(xₙ\) = 0)/, make: (rng) => createProblem(rng, 'flat', 0) },
      { match: /^\s*• (f'\(xₙ\) çok küçükse|If f'\(xₙ\) is tiny)/, make: (rng) => createProblem(rng, 'flat', 0.1) },
      { match: /^\s*• (Kötü x₀|A bad x₀)/, make: (rng) => createProblem(rng, 'cycle') },
      { match: /^\s*• (Katlı köklerde|At multiple roots)/, make: (rng) => createProblem(rng, 'multiple') },
      { match: /^\s*• (Süreksiz veya köşeli|It can fail for discontinuous)/, make: (rng) => createProblem(rng, 'vertical') },
    ],
    _kinds: KINDS,
    _spec: spec,
    _iterate: iterate,
    _setKind: (k) => { forcedKind = k; },
  });
})();
