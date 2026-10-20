// Applications of Derivatives quiz bank. Ports Modules/Preliminaries/QuizBankPart2.vb (module QuizBankApplications, 12 generators)
// and adds many exam-only generators (window.ExamPools.applications) for the printable question sets.
// Every generator carries a numeric `.level` (1 easy, 2 medium, 3 hard). Questions may carry a non-enumerable `_v`
// verification spec (used only by the offline test harness, never by the UI).
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const Q = makeQuestion;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const frac = (n, d) => {
    if (d === 0) return tx('tanımsız', 'undefined');
    const g = gcd(n, d); n /= g; d /= g;
    if (d < 0) { n = -n; d = -d; }
    if (n === 0) return '0';
    return d === 1 ? String(n) : `${n}/${d}`;
  };
  const nz = (rng, lo, hi) => { let v; do { v = rng.nextInt(lo, hi + 1); } while (v === 0); return v; };
  const plus = (n) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`);
  const num = (v) => String(Math.round(v * 1e6) / 1e6);
  const sup = (n) => ('⁰¹²³⁴⁵⁶⁷⁸⁹'[n] !== undefined && n >= 0 && n <= 9 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[n] : `^${n}`);
  const polyStr = (...c) => {      // LOW-order coefficients first
    let s = '';
    for (let d = c.length - 1; d >= 0; d--) {
      const v = c[d];
      if (v === 0) continue;
      const mag = Math.abs(v);
      let body;
      if (d === 0) body = String(mag);
      else { const x = d === 1 ? 'x' : 'x' + sup(d); body = mag === 1 ? x : mag + x; }
      if (s === '') s += (v < 0 ? '-' : '') + body; else s += (v < 0 ? ' - ' : ' + ') + body;
    }
    return s === '' ? '0' : s;
  };
  const xs = (h) => (h === 0 ? 'x' : h > 0 ? `x - ${h}` : `x + ${-h}`);
  const piS = (n) => (n === 1 ? 'π' : `${n}π`);
  const NINF = '−∞', PINF = '∞';
  const iv = (a, b) => `(${a === null ? NINF : a}, ${b === null ? PINF : b})`;
  const un = (...parts) => parts.join(' ∪ ');

  const FILL_NOTES = () => [
    tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'),
    tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'),
  ];
  // cleans sign / coefficient glitches from template substitution: "x - -3" -> "x + 3", "1x" -> "x", "2x + 0" -> "2x"
  const fixS = (s) => (typeof s === 'string'
    ? s.replace(/([+−-]) -(?=\d)/g, (m, sg) => (sg === '+' ? '- ' : '+ '))
      .replace(/ [+-] 0x(?![\w])/g, '')
      .replace(/ \+ 0(?=[ )=→]|$)/g, '')
      .replace(/(^|[^\w.²³])1(?=x(?![\w])|cos\(|sin\(|e\^)/g, '$1')
      .replace(/\(x\)\(/g, 'x(').replace(/\)\(x\)/g, ')x')
    : s);
  // filler wrong answers for "Nπ"-type answers
  const piFill = (n) => [n + 1, n + 2, Math.max(1, n - 1), n + 3, n + 4].map((v) => [piS(v), tx('Katsayıda küçük bir hesap hatası.', 'A small slip in the coefficient.')]);
  // mk(topic, text, correct, [[wrong, note], ...], solution, rng, plot, unit?) - integer answers get correct+-1..3 filler;
  // `unit` (optional string) is appended to every option.
  function mk(topic, text, correct, pairs, sol, rng, plot, unit) {
    text = fixS(text); correct = fixS(correct); sol = sol.map(fixS);
    pairs = pairs.map((p) => [fixS(p[0]), p[1]]);
    const wrongs = pairs.map((p) => p[0]);
    const notes = pairs.map((p) => p[1]);
    if (/^-?\d+$/.test(correct)) {
      const c = parseInt(correct, 10);
      const fn = FILL_NOTES();
      [1, -1, 2, -2, 3, -3].forEach((d, i) => { wrongs.push(String(c + d)); notes.push(fn[i]); });
    }
    if (unit) { correct += ' ' + unit; for (let i = 0; i < wrongs.length; i++) wrongs[i] += ' ' + unit; }
    return Q(topic, text, correct, wrongs, sol, rng, notes, plot);
  }
  function chk(q, spec) { Object.defineProperty(q, '_v', { value: spec, enumerable: false }); return q; }

  class PlotSpec {
    constructor(xMin, xMax, yMin, yMax) {
      this.xMin = xMin; this.xMax = xMax; this.yMin = yMin; this.yMax = yMax;
      this.curves = []; this.points = []; this.segments = [];
    }
    addCurve(f, dashed) { this.curves.push({ f: (x) => { const v = f(x); return typeof v === 'number' && isFinite(v) ? v : NaN; }, dashed: !!dashed }); return this; }
    addSegment(x1, y1, x2, y2, dashed) { this.segments.push({ x1, y1, x2, y2, dashed: !!dashed }); return this; }
    addPoint(x, y, label, hollow) { this.points.push({ x, y, label: label || '', hollow: !!hollow }); return this; }
  }
  const rangeY = (f, x0, x1, extra) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 60; i++) { const v = f(x0 + (x1 - x0) * i / 60); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    (extra || []).forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    if (!isFinite(lo)) { lo = -5; hi = 5; }
    const pad = Math.max(1, (hi - lo) * 0.12);
    return [lo - pad, hi + pad];
  };
  const plotOf = (f, x0, x1, extra) => { const [lo, hi] = rangeY(f, x0, x1, extra); return new PlotSpec(x0, x1, lo, hi).addCurve(f); };

  const T = {
    crit: () => tx('Kritik noktalar', 'Critical points'),
    abs: () => tx('Mutlak ekstremum (kapalı aralık)', 'Absolute extrema on a closed interval'),
    mono: () => tx('Artan / azalan aralıklar', 'Increasing / decreasing intervals'),
    loc: () => tx('Yerel ekstremum ve ikinci türev testi', 'Local extrema and the second derivative test'),
    mvt: () => tx('Ortalama değer ve Rolle teoremi', 'Mean Value Theorem and Rolle\'s theorem'),
    conc: () => tx('Konkavlık ve büküm noktaları', 'Concavity and inflection points'),
    opt: () => tx('Optimizasyon', 'Optimization'),
    rel: () => tx('İlgili değişim hızları', 'Related rates'),
    lh: () => tx('L\'Hôpital kuralı', 'L\'Hôpital\'s rule'),
    newt: () => tx('Newton yöntemi', 'Newton\'s method'),
    lin: () => tx('Lineerleştirme ve diferansiyel', 'Linearization and differentials'),
    sk: () => tx('Eğri çizimi', 'Curve sketching'),
  };

  // =====================================================================================================
  // Ported from QuizBankPart2.vb (QuizBankApplications)
  // =====================================================================================================

  function apCritical(rng) {
    const a = rng.nextInt(2, 6);
    const f = (x) => x * x * x - 3 * a * a * x;
    const q = mk(T.crit(),
      tx(`f(x) = ${polyStr(0, -3 * a * a, 0, 1)} fonksiyonunun kritik noktaları hangisidir?`, `Which are the critical points of f(x) = ${polyStr(0, -3 * a * a, 0, 1)}?`),
      tx(`x = ${-a} ve x = ${a}`, `x = ${-a} and x = ${a}`),
      [[tx(`x = 0 ve x = ${a}`, `x = 0 and x = ${a}`), tx(`x = 0 kritik nokta değil: f'(0) = -${3 * a * a}, sıfır değil.`, `x = 0 is not critical here: f'(0) = -${3 * a * a}, which is not zero.`)],
        [tx(`x = ${a * a} ve x = ${-a * a}`, `x = ${a * a} and x = ${-a * a}`), tx(`x² = ${a * a} denkleminde karekök almayı unuttun (x = ±${a * a}).`, `In x² = ${a * a} you forgot to take the square root (x = ±${a * a}).`)],
        [`x = ${a}`, tx(`Yalnızca pozitif kökü aldın; x² = ${a * a} iki kök verir.`, `You kept only the positive root; x² = ${a * a} has two roots.`)],
        [`x = ${-3 * a * a}`, tx('f\'(x) = 0 denkleminde x² çarpanını yok sayıp sabit terimi kök sandın.', 'You ignored the x² factor in f\'(x) = 0 and took the constant term as the root.')]],
      [`f'(x) = 3x² - ${3 * a * a} = 0`, `x² = ${a * a}  →  x = ±${a}`], rng, plotOf(f, -(a + 1.5), a + 1.5));
    return chk(q, { t: 'zeros', fp: (x) => 3 * x * x - 3 * a * a, n: 2 });
  }

  function apMonotone(rng) {
    const p = nz(rng, -4, 4), c = rng.nextInt(-5, 6);
    const f = (x) => x * x - 2 * p * x + c;
    const q = mk(T.mono(),
      tx(`f(x) = ${polyStr(c, -2 * p, 1)} fonksiyonu hangi aralıkta AZALANDIR?`, `On which interval is f(x) = ${polyStr(c, -2 * p, 1)} DECREASING?`),
      iv(null, p),
      [[iv(p, null), tx(`Eşitsizliği ters çevirdin: x > ${p} aralığında f' > 0'dır (artan).`, `You reversed the inequality: f' > 0 for x > ${p}, so f increases there.`)],
        [iv(null, -p), tx(`Kritik noktanın işaretini yanlış aldın (${-p} yerine ${p} olmalı).`, `You got the sign of the critical point wrong (it is ${p}, not ${-p}).`)],
        [iv(-p, null), tx('Hem kritik noktanın işaretini hem eşitsizlik yönünü yanlış aldın.', 'You got both the sign of the critical point and the inequality direction wrong.')]],
      [`f'(x) = 2x ${plus(-2 * p)} = 2(${xs(p)})`, `f'(x) < 0  ⇔  x < ${p}  →  ${iv(null, p)}`], rng, plotOf(f, -(Math.abs(p) + 4), Math.abs(p) + 4));
    return chk(q, { t: 'intervals', fp: (x) => 2 * x - 2 * p, want: 'dec' });
  }

  function apMinValue(rng) {
    const h = nz(rng, -3, 3), c = rng.nextInt(-6, 7);
    const ans = c - h * h;
    const f = (x) => x * x - 2 * h * x + c;
    const q = mk(T.loc(),
      tx(`f(x) = ${polyStr(c, -2 * h, 1)} fonksiyonunun yerel minimum değeri kaçtır?`, `What is the local minimum value of f(x) = ${polyStr(c, -2 * h, 1)}?`),
      String(ans),
      [[String(c), tx('Kritik noktada değil, x = 0\'da f(0) = c değerini aldın.', 'You evaluated f(0) = c instead of f at the critical point.')],
        [String(h), tx(`Minimumun x-koordinatını (${h}) verdin, fonksiyon değerini değil.`, `You gave the x-coordinate (${h}) of the minimum, not the function value.`)],
        [String(-h * h), tx('Sabit terimi c\'yi unutup yalnızca -h² değerini verdin.', 'You forgot the constant c and gave only the -h² part.')]],
      [`f'(x) = 2x ${plus(-2 * h)} = 0  →  x = ${h}`, `f(${h}) = ${ans}`], rng, plotOf(f, -(Math.abs(h) + 4), Math.abs(h) + 4));
    return chk(q, { t: 'extrema', f, lo: -50, hi: 50, want: 'min', local: [h - 4, h + 4] });
  }

  function apInflection(rng) {
    const p = nz(rng, -3, 3), q0 = rng.nextInt(-5, 6);
    const f = (x) => x * x * x - 3 * p * x * x + q0 * x;
    const q = mk(T.conc(),
      tx(`f(x) = ${polyStr(0, q0, -3 * p, 1)} fonksiyonunun büküm noktasının x koordinatı kaçtır?`, `What is the x-coordinate of the inflection point of f(x) = ${polyStr(0, q0, -3 * p, 1)}?`),
      String(p),
      [[String(-p), tx('f\'\' = 0 çözerken işareti ters aldın (x = -p).', 'You flipped the sign when solving f\'\'(x) = 0.')],
        [String(3 * p), tx('x² katsayısının büyüklüğünü doğrudan cevap aldın; f\'\' = 0 denklemini çözmelisin.', 'You used the size of the x² coefficient directly instead of solving f\'\'(x) = 0.')],
        [String(2 * p), tx('f\'\' = 0 denklemini sadeleştirirken yanlış bölme yaptın.', 'You mis-simplified f\'\'(x) = 0 with a wrong division.')]],
      [`f''(x) = 6x ${plus(-6 * p)} = 0`, tx(`x = ${p} (işaret değiştirir → büküm noktası)`, `x = ${p} (sign changes → inflection point)`)], rng, plotOf(f, -(Math.abs(p) + 3), Math.abs(p) + 3));
    return chk(q, { t: 'inflect', fpp: (x) => 6 * x - 6 * p });
  }

  function apRect(rng) {
    const n = rng.nextInt(2, 8), per = 8 * n, ans = 4 * n * n;
    const A = (x) => x * (per / 2 - x);
    const q = mk(T.opt(),
      tx(`${per} m'lik çitle çevrilecek dikdörtgen bir bahçenin en büyük alanı kaç m²'dir?`, `What is the maximum area, in m², of a rectangular garden enclosed by ${per} m of fencing?`),
      String(ans),
      [[String(2 * n), tx(`Alan yerine bir kenar uzunluğunu (${2 * n}) aldın.`, `You gave a side length (${2 * n}) instead of the area.`)],
        [String(n * n), tx(`Kenarı ${n} aldın; çevrenin dörtte biri başka bir uzunluk verir.`, `You took the side as ${n}; a quarter of the fence gives a different length.`)],
        [String(per), tx(`Alan yerine çevreyi (${per}) verdin.`, `You gave the perimeter (${per}) instead of the area.`)]],
      [`2x + 2y = ${per}  →  y = ${per / 2} - x`, tx(`A = x(${per / 2} - x): en büyük değer x = ${per / 4} (kare)`, `A = x(${per / 2} - x): maximum at x = ${per / 4} (a square)`), `A = ${2 * n}·${2 * n} = ${ans}`], rng, null, 'm²');
    return chk(q, { t: 'extrema', f: A, lo: 0, hi: per / 2, want: 'max' });
  }

  function apSum(rng) {
    const m = rng.nextInt(2, 7);
    const f = (x) => x + m * m / x;
    const q = mk(T.opt(),
      tx(`x > 0 için f(x) = x + ${m * m}/x fonksiyonunun en küçük değeri kaçtır?`, `For x > 0, what is the minimum value of f(x) = x + ${m * m}/x?`),
      String(2 * m),
      [[String(m), tx(`Fonksiyon değerini değil, kritik noktayı (x = ${m}) verdin.`, `You gave the critical point (x = ${m}) rather than the function value.`)],
        [String(m * m), tx('Kritik noktanın karesini verdin; f\'yi kritik noktada hesaplamadın.', 'You gave the square of the critical point without evaluating f there.')],
        [String(m * m + 1), tx(`f'yi kritik noktada değil x = 1'de hesapladın (1 + ${m * m}).`, `You evaluated f at x = 1 (1 + ${m * m}) instead of at the critical point.`)]],
      [`f'(x) = 1 - ${m * m}/x² = 0  →  x = ${m}`, `f(${m}) = ${m} + ${m} = ${2 * m}`], rng, plotOf(f, 0.4, 2 * m + 2, [0, 3 * m + 2]));
    return chk(q, { t: 'extrema', f, lo: 1e-3, hi: 400, want: 'min' });
  }

  function apRates(rng) {
    const r = rng.nextInt(2, 8), c = rng.nextInt(1, 5);
    const A = (t) => Math.PI * (r + c * t) * (r + c * t);
    const q = mk(T.rel(),
      tx(`Yarıçapı r = ${r} cm iken saniyede ${c} cm artan bir dairenin alanı hangi hızla artar?`, `A circle's radius grows at ${c} cm per second. At r = ${r} cm, how fast is its area increasing?`),
      piS(2 * r * c),
      [[piS(r * r * c), tx('Alanı dr/dt ile çarptın; A = πr² ifadesinin türevini almadın.', 'You multiplied the area by dr/dt without differentiating A = πr².')],
        [piS(r * c), tx('dA/dt = 2πr·(dr/dt) formülündeki 2 çarpanını unuttun.', 'You forgot the factor 2 in dA/dt = 2πr·(dr/dt).')],
        [piS(4 * r * c), tx('2 yerine 4 katsayısı kullandın.', 'You used the factor 4 instead of 2.')],
        [piS(2 * r), tx(`dr/dt = ${c} çarpanını unuttun.`, `You forgot the factor dr/dt = ${c}.`)],
        [piS(2 * r * c + 2), tx('Doğru formüle küçük bir toplama hatası eklenmiş.', 'A small addition slip on top of the right formula.')]].concat(piFill(2 * r * c)),
      ['A = πr²  →  dA/dt = 2πr·(dr/dt)', `dA/dt = 2π·${r}·${c} = ${piS(2 * r * c)}`], rng, null, 'cm²/s');
    return chk(q, { t: 'rate', g: A, t0: 0 });
  }

  function apLHopital(rng) {
    const a = nz(rng, -4, 4), b = rng.nextInt(1, 5);
    if (rng.nextInt(0, 2) === 0) {
      const q = mk(T.lh(),
        tx(`lim(x→0) (e^(${a}x) - 1) / (${b}x) limiti kaçtır?`, `What is lim(x→0) (e^(${a}x) - 1) / (${b}x)?`),
        frac(a, b),
        [[frac(b, a), tx('Türev oranını ters çevirdin (b/a).', 'You inverted the ratio of derivatives (b/a).')],
          ['1', tx('(eᵘ - 1)/u → 1 limitini kullanıp x katsayılarının oranını unuttun.', 'You used (eᵘ - 1)/u → 1 and ignored the ratio of the coefficients.')],
          ['0', tx('x = 0 yazıp pay 0 olduğu için sonucu 0 sandın; bu 0/0 belirsizliği.', 'You put x = 0 and, seeing a zero numerator, answered 0; it is a 0/0 form.')],
          ['∞', tx('Paydayı 0 sanıp ∞ dedin; pay da 0, L\'Hôpital uygulanmalı.', 'You saw a zero denominator and said infinity; the numerator is 0 too, so use L\'Hôpital.')],
          [frac(-a, b), tx('İşaret hatası: türev sonucunun işareti yanlış alınmış.', 'Sign slip: the sign of the derivative result was taken wrongly.')],
          [frac(a * b, 1), tx('Katsayıları bölmek yerine çarpmışsın.', 'You multiplied the coefficients instead of dividing.')]],
        [tx('0/0 belirsizliği: pay ve paydanın türevini al.', '0/0 indeterminate form: differentiate numerator and denominator.'), `(${a}e^(${a}x)) / ${b} → ${a}/${b} = ${frac(a, b)}`], rng);
      return chk(q, { t: 'limit', f: (x) => (Math.exp(a * x) - 1) / (b * x), at: 0 });
    }
    const a2 = rng.nextInt(2, 6);
    const q = mk(T.lh(),
      tx(`lim(x→0) (1 - cos(${a2}x)) / x² limiti kaçtır?`, `What is lim(x→0) (1 - cos(${a2}x)) / x²?`),
      frac(a2 * a2, 2),
      [[frac(a2, 2), tx(`İkinci L'Hôpital adımında iç çarpanı ${a2} yalnızca bir kez aldın.`, `In the second L'Hôpital step you took the inner factor ${a2} only once instead of twice.`)],
        [frac(1, 2), tx(`(1 - cos x)/x² → 1/2 standart limitini kullanıp ${a2} katsayısını unuttun.`, `You used the standard limit (1 - cos x)/x² → 1/2 and ignored the coefficient ${a2}.`)],
        ['0', tx('x = 0 yazıp 0 buldun; bu 0/0 belirsizliği.', 'You put x = 0 and got 0; it is a 0/0 form.')],
        [String(a2 * a2), tx('Paydanın türevinden gelen 2\'ye bölmeyi unuttun.', 'You forgot to divide by the 2 that comes from differentiating x².')]],
      [tx(`0/0: bir kez türev → (${a2} sin(${a2}x)) / (2x), yine 0/0`, `0/0: differentiate once → (${a2} sin(${a2}x)) / (2x), again 0/0`),
        tx(`bir kez daha türev → ${a2 * a2} cos(${a2}x) / 2 → ${frac(a2 * a2, 2)}`, `differentiate once more → ${a2 * a2} cos(${a2}x) / 2 → ${frac(a2 * a2, 2)}`)], rng);
    return chk(q, { t: 'limit', f: (x) => (1 - Math.cos(a2 * x)) / (x * x), at: 0 });
  }

  function apNewton(rng) {
    const k = rng.nextInt(1, 6), n = rng.nextInt(2, 20);
    const f = (x) => x * x - n;
    const xm = Math.max(k, Math.sqrt(n)) + 1.5;
    const plot = plotOf(f, -xm, xm).addPoint(k, f(k));
    const q = mk(T.newt(),
      tx(`f(x) = x² - ${n} için x₀ = ${k} alınırsa Newton yönteminin bir adım sonraki x₁ değeri kaçtır?`, `For f(x) = x² - ${n} with x₀ = ${k}, what is x₁ after one step of Newton's method?`),
      frac(k * k + n, 2 * k),
      [[frac(k * k - n, 2 * k), tx('x₀ - f/f\' yerine yalnızca f(x₀)/f\'(x₀) oranını verdin.', 'You gave only the ratio f(x₀)/f\'(x₀) instead of x₀ - f(x₀)/f\'(x₀).')],
        [frac(k * k + n, k), tx('Paydada 2 çarpanını unuttun (f\'(x) = 2x).', 'You dropped the factor 2 in the denominator (f\'(x) = 2x).')],
        [frac(n, 2 * k), tx('Kesirleri birleştirirken x₀² terimini düşürdün.', 'You dropped the x₀² term when combining the fractions.')],
        [frac(k * k + n, 2 * k + 1), tx('Türevi 2x + 1 sandın; f\'(x) = 2x\'tir.', 'You took the derivative as 2x + 1; f\'(x) is 2x.')],
        [frac(2 * k * k + n, 2 * k), tx('Cebir hatası: x₀ - f/f\' hesabında x₀² iki kez sayılmış.', 'Algebra slip: x₀² was counted twice in x₀ - f/f\'.')]],
      ['x₁ = x₀ - f(x₀)/f\'(x₀)', `f(${k}) = ${k * k - n},  f'(${k}) = ${2 * k}`, `x₁ = ${k} - (${k * k - n})/${2 * k} = ${frac(k * k + n, 2 * k)}`], rng, plot);
    return chk(q, { t: 'newton', f, df: (x) => 2 * x, x0: k, steps: 1 });
  }

  function apLinear(rng) {
    const m = rng.nextInt(3, 9), d = rng.pick([1, 2, -1, -2]);
    const fmt = (v) => String(Math.round(v * 1000) / 1000);
    const correct = m + d / (2 * m);
    const f = (x) => (x < 0 ? NaN : Math.sqrt(x));
    const plot = new PlotSpec(-0.15 * m * m, 1.5 * m * m, -0.3 * m, 1.5 * m).addCurve(f).addPoint(m * m, m);
    const q = mk(T.lin(),
      tx(`Lineerleştirme kullanarak √${m * m + d} değerini yaklaşık olarak hesaplayın (f(x) = √x, a = ${m * m}).`, `Use linearization to approximate √${m * m + d} (f(x) = √x, a = ${m * m}).`),
      fmt(correct),
      [[fmt(m + d / m), tx('f\'(a) = 1/(2√a) yerine 1/√a kullandın (2 çarpanı eksik).', 'You used 1/√a instead of f\'(a) = 1/(2√a) (the factor 2 is missing).')],
        [fmt(m + d), tx('Eğimi 1 aldın; f\'(a) = 1/(2√a) hesaplanmalıydı.', 'You used slope 1 instead of computing f\'(a) = 1/(2√a).')],
        [fmt(m + d / (4 * m)), tx('f\'(a) paydasını yanlışlıkla iki katına çıkardın.', 'You wrongly doubled the denominator of f\'(a).')],
        [fmt(m - d / (2 * m)), tx('Düzeltme teriminin işaretini ters aldın.', 'You reversed the sign of the correction term.')]],
      ['L(x) = f(a) + f\'(a)(x - a),  f\'(x) = 1/(2√x)', `L(${m * m + d}) = ${m} + ${d}/${2 * m} = ${fmt(correct)}`], rng, plot);
    return chk(q, { t: 'approx', truth: Math.sqrt(m * m + d), tol: d * d / (8 * m * m * m) * 1.2 + 0.001 });
  }

  function apMvt(rng) {
    const a = rng.nextInt(-3, 3), b = a + rng.nextInt(1, 6);
    const f = (x) => x * x;
    const plot = plotOf(f, a - 1, b + 1).addSegment(a, a * a, b, b * b, true).addPoint(a, a * a).addPoint(b, b * b);
    const q = mk(T.mvt(),
      tx(`f(x) = x² fonksiyonu için [${a}, ${b}] aralığında Ortalama Değer Teoremini sağlayan c değeri kaçtır?`, `For f(x) = x² on [${a}, ${b}], what value of c satisfies the Mean Value Theorem?`),
      frac(a + b, 2),
      [[frac(b - a, 2), tx('Aralığın yarı uzunluğunu verdin; c, f\'(c) = ortalama eğim denkleminden bulunur.', 'You gave half the interval length; c comes from f\'(c) = average slope.')],
        [String(a + b), tx('2c = eğim denkleminde 2\'ye bölmeyi unuttun.', 'You forgot to divide by 2 in 2c = slope.')],
        [frac(a + b, 4), tx('2c = eğim denkleminde iki kez böldün.', 'You divided twice in 2c = slope.')],
        [String(a), tx('Aralığın sol uç noktasını verdin.', 'You gave the left endpoint of the interval.')],
        [String(b), tx('Aralığın sağ uç noktasını verdin.', 'You gave the right endpoint of the interval.')],
        [frac(a + b + 1, 2), tx('Ortalama eğimi toplarken küçük bir hata yaptın.', 'You made a small slip when adding for the average slope.')],
        [frac(a + b - 1, 2), tx('Ortalama eğimi toplarken küçük bir hata yaptın.', 'You made a small slip when adding for the average slope.')]],
      [`[f(b) - f(a)]/(b - a) = (${b * b} - ${a * a})/${b - a} = ${a + b}`, `f'(c) = 2c = ${a + b}  →  c = ${frac(a + b, 2)}`], rng, plot);
    return chk(q, { t: 'mvt', f, a, b });
  }

  function apSecondTest(rng) {
    const a = rng.nextInt(1, 5), atPos = rng.nextInt(0, 2) === 0, x = atPos ? a : -a;
    const f = (u) => u * u * u - 3 * a * a * u;
    const mn = tx('yerel minimum', 'local minimum'), mxs = tx('yerel maksimum', 'local maximum');
    const correct = atPos ? mn : mxs;
    const q = mk(T.loc(),
      tx(`f(x) = ${polyStr(0, -3 * a * a, 0, 1)} fonksiyonunun x = ${x} noktasındaki davranışı nedir?`, `What is the behavior of f(x) = ${polyStr(0, -3 * a * a, 0, 1)} at x = ${x}?`),
      correct,
      [[atPos ? mxs : mn, tx('İkinci türev testini ters uyguladın: f\'\' > 0 yukarı bükeydir (minimum), f\'\' < 0 aşağı bükeydir (maksimum).', 'You applied the second derivative test backwards: f\'\' > 0 is concave up (minimum), f\'\' < 0 concave down (maximum).')],
        [tx('büküm noktası', 'inflection point'), tx('Büküm noktasında f\'\' = 0 olmalı; burada f\'\' sıfırdan farklı.', 'An inflection point needs f\'\' = 0; here f\'\' is nonzero.')],
        [tx('kritik nokta değildir', 'not a critical point'), tx('Burada f\'(x) = 0 olduğu için nokta kritik bir noktadır.', 'Here f\'(x) = 0, so this point is a critical point.')]],
      [tx(`f'(x) = 3x² - ${3 * a * a}, f'(${x}) = 0 (kritik nokta)`, `f'(x) = 3x² - ${3 * a * a}, f'(${x}) = 0 (critical point)`),
        `f''(x) = 6x, f''(${x}) = ${6 * x} ${x > 0 ? '> 0' : '< 0'}`,
        tx(`f'' ${x > 0 ? 'pozitif → yukarı bükey → ' : 'negatif → aşağı bükey → '}${correct}`, `f'' ${x > 0 ? 'positive → concave up → ' : 'negative → concave down → '}${correct}`)], rng, plotOf(f, -(a + 1.5), a + 1.5));
    return chk(q, { t: 'classify', f, x0: x, kind: atPos ? 'min' : 'max' });
  }

  // =====================================================================================================
  // New generators
  // =====================================================================================================

  // --- shared cubic f(x) = 2x^3 - 3(p+q)x^2 + 6pq x + r,  f' = 6(x-p)(x-q),  p < q ---
  function cubicParams(rng) {
    const p = rng.nextInt(-3, 3), q = p + rng.nextInt(1, 4), r = rng.nextInt(-3, 4);
    const f = (x) => 2 * x * x * x - 3 * (p + q) * x * x + 6 * p * q * x + r;
    const poly = polyStr(r, 6 * p * q, -3 * (p + q), 2);
    return { p, q, r, f, poly, fp: (x) => 6 * (x - p) * (x - q) };
  }

  function absSetup(rng) {
    for (let t = 0; t < 500; t++) {
      const c = cubicParams(rng);
      const lo = rng.nextInt(-4, 2), hi = lo + rng.nextInt(3, 7);
      const cand = [{ x: lo, k: 'end' }, { x: hi, k: 'end' }];
      const outside = [];
      [c.p, c.q].forEach((x) => { if (x > lo && x < hi) cand.push({ x, k: 'crit' }); else outside.push({ x, k: 'out' }); });
      if (cand.length < 3) continue;
      cand.forEach((o) => { o.y = c.f(o.x); });
      outside.forEach((o) => { o.y = c.f(o.x); });
      const ys = cand.map((o) => o.y);
      const mx = Math.max(...ys), mn = Math.min(...ys);
      if (ys.filter((y) => y === mx).length !== 1 || ys.filter((y) => y === mn).length !== 1) continue;
      if (Math.abs(mx) > 400 || Math.abs(mn) > 400) continue;
      return Object.assign(c, { lo, hi, cand, outside, mx, mn, xmax: cand.find((o) => o.y === mx).x, xmin: cand.find((o) => o.y === mn).x });
    }
    throw new Error('absSetup failed');
  }
  function absSteps(s) {
    const st = [tx(`f'(x) = 6(${xs(s.p)})(${xs(s.q)}) = 0  →  x = ${s.p}, x = ${s.q}`, `f'(x) = 6(${xs(s.p)})(${xs(s.q)}) = 0  →  x = ${s.p}, x = ${s.q}`)];
    const inside = s.cand.filter((o) => o.k === 'crit').map((o) => o.x);
    st.push(tx(`[${s.lo}, ${s.hi}] içindeki kritik noktalar: ${inside.join(', ')}`, `Critical points inside [${s.lo}, ${s.hi}]: ${inside.join(', ')}`));
    st.push(tx('Adaylar: ' + s.cand.map((o) => `f(${o.x}) = ${o.y}`).join(',  '), 'Candidates: ' + s.cand.map((o) => `f(${o.x}) = ${o.y}`).join(',  ')));
    return st;
  }
  function absPlot(s) {
    const plot = plotOf(s.f, s.lo - 1, s.hi + 1, s.cand.map((o) => o.y));
    plot.addPoint(s.lo, s.f(s.lo)).addPoint(s.hi, s.f(s.hi));
    return plot;
  }
  function absWrongs(s, want) {
    const best = want === 'max' ? s.mx : s.mn;
    const out = [];
    s.cand.filter((o) => o.y !== best).forEach((o) => {
      out.push([String(o.y), o.k === 'end'
        ? tx(`Bu, f(${o.x}) uç nokta değeri; adaylar karşılaştırılınca ${want === 'max' ? 'en büyük' : 'en küçük'} değildir.`, `This is the endpoint value f(${o.x}); it is not the ${want === 'max' ? 'largest' : 'smallest'} candidate.`)
        : tx(`Bu, f(${o.x}) yerel ekstremum değeri; uç noktalar da karşılaştırılmalı, ${want === 'max' ? 'daha büyük' : 'daha küçük'} aday var.`, `This is the local extremum value f(${o.x}); the endpoints must be compared too, and a ${want === 'max' ? 'larger' : 'smaller'} candidate exists.`)]);
    });
    s.outside.forEach((o) => out.push([String(o.y), tx(`x = ${o.x} aralığın dışında kalıyor; o noktadaki değeri hesaba katmamalıydın.`, `x = ${o.x} lies outside the interval; its value must not be considered.`)]));
    return out;
  }

  function exCubicMax(rng) {
    const s = absSetup(rng);
    const q = mk(T.abs(), tx(`f(x) = ${s.poly} fonksiyonunun [${s.lo}, ${s.hi}] aralığındaki mutlak maksimum değeri kaçtır?`, `What is the absolute maximum value of f(x) = ${s.poly} on [${s.lo}, ${s.hi}]?`),
      String(s.mx), absWrongs(s, 'max'), absSteps(s).concat([tx(`En büyük aday: f(${s.xmax}) = ${s.mx}`, `Largest candidate: f(${s.xmax}) = ${s.mx}`)]), rng, absPlot(s));
    return chk(q, { t: 'extrema', f: s.f, lo: s.lo, hi: s.hi, want: 'max' });
  }
  function exCubicMin(rng) {
    const s = absSetup(rng);
    const q = mk(T.abs(), tx(`f(x) = ${s.poly} fonksiyonunun [${s.lo}, ${s.hi}] aralığındaki mutlak minimum değeri kaçtır?`, `What is the absolute minimum value of f(x) = ${s.poly} on [${s.lo}, ${s.hi}]?`),
      String(s.mn), absWrongs(s, 'min'), absSteps(s).concat([tx(`En küçük aday: f(${s.xmin}) = ${s.mn}`, `Smallest candidate: f(${s.xmin}) = ${s.mn}`)]), rng, absPlot(s));
    return chk(q, { t: 'extrema', f: s.f, lo: s.lo, hi: s.hi, want: 'min' });
  }
  function exCubicArg(rng) {
    const s = absSetup(rng);
    const wrongs = s.cand.filter((o) => o.x !== s.xmax).map((o) => [String(o.x), o.k === 'end'
      ? tx(`x = ${o.x} uç noktasında f = ${o.y}; bu, en büyük değer değil.`, `At the endpoint x = ${o.x}, f = ${o.y}, which is not the largest value.`)
      : tx(`x = ${o.x} kritik nokta, ama f(${o.x}) = ${o.y} en büyük aday değil.`, `x = ${o.x} is critical, but f(${o.x}) = ${o.y} is not the largest candidate.`)]);
    s.outside.forEach((o) => wrongs.push([String(o.x), tx(`x = ${o.x} aralığın dışında.`, `x = ${o.x} lies outside the interval.`)]));
    const q = mk(T.abs(), tx(`f(x) = ${s.poly} fonksiyonu [${s.lo}, ${s.hi}] aralığında mutlak maksimumuna hangi x değerinde ulaşır?`, `At which x does f(x) = ${s.poly} attain its absolute maximum on [${s.lo}, ${s.hi}]?`),
      String(s.xmax), wrongs, absSteps(s).concat([tx(`En büyük aday f(${s.xmax}) = ${s.mx} ⇒ x = ${s.xmax}`, `Largest candidate f(${s.xmax}) = ${s.mx} ⇒ x = ${s.xmax}`)]), rng, absPlot(s));
    return chk(q, { t: 'extrema', f: s.f, lo: s.lo, hi: s.hi, want: 'argmax' });
  }

  function exQuad(rng) {
    const h = rng.nextInt(-3, 4), c = rng.nextInt(-5, 6);
    const r1 = rng.nextInt(1, 4); let r2 = rng.nextInt(1, 5); if (r1 === r2) r2 = r1 + 1;
    const lo = h - r1, hi = h + r2, f = (x) => x * x - 2 * h * x + c;
    const fv = c - h * h, flo = f(lo), fhi = f(hi), wantMax = rng.nextInt(0, 2) === 0;
    const poly = polyStr(c, -2 * h, 1);
    const ans = wantMax ? Math.max(flo, fhi) : fv;
    const wr = wantMax
      ? [[String(Math.min(flo, fhi)), tx('Daha küçük uç nokta değerini aldın; iki uç nokta değerinden büyüğü gerekir.', 'You took the smaller endpoint value; the larger of the two is needed.')],
        [String(fv), tx('Tepe noktası (minimum) değerini verdin; maksimum uç noktada.', 'You gave the vertex (minimum) value; the maximum is at an endpoint.')],
        [String(c), tx('f(0) değerini aldın; 0 aday nokta değil.', 'You took f(0); 0 is not a candidate point.')]]
      : [[String(flo), tx(`Sol uç nokta değeri f(${lo}); minimum kritik noktadadır.`, `Left endpoint value f(${lo}); the minimum is at the critical point.`)],
        [String(fhi), tx(`Sağ uç nokta değeri f(${hi}); minimum kritik noktadadır.`, `Right endpoint value f(${hi}); the minimum is at the critical point.`)],
        [String(c), tx('f(0) değerini aldın; kritik nokta x = ' + h + '.', 'You took f(0); the critical point is x = ' + h + '.')]];
    const q = mk(T.abs(), tx(`f(x) = ${poly} fonksiyonunun [${lo}, ${hi}] aralığındaki mutlak ${wantMax ? 'maksimum' : 'minimum'} değeri kaçtır?`, `What is the absolute ${wantMax ? 'maximum' : 'minimum'} value of f(x) = ${poly} on [${lo}, ${hi}]?`),
      String(ans), wr, [`f'(x) = 2x ${plus(-2 * h)} = 0  →  x = ${h} ∈ [${lo}, ${hi}]`, `f(${lo}) = ${flo},  f(${h}) = ${fv},  f(${hi}) = ${fhi}`,
        tx(`${wantMax ? 'En büyük' : 'En küçük'} değer: ${ans}`, `${wantMax ? 'Largest' : 'Smallest'} value: ${ans}`)], rng, plotOf(f, lo - 1, hi + 1, [flo, fhi]).addPoint(lo, flo).addPoint(hi, fhi));
    return chk(q, { t: 'extrema', f, lo, hi, want: wantMax ? 'max' : 'min' });
  }

  // --- increasing / decreasing from cubic ---
  function incDecCubic(rng) {
    const c = cubicParams(rng), p = c.p, q = c.q, inc = rng.nextInt(0, 2) === 0;
    const out = un(iv(null, p), iv(q, null)), mid = iv(p, q);
    const correct = inc ? out : mid;
    const wr = [
      [inc ? mid : out, tx('Aralıkları ters seçtin: f\' işaretini yanlış yorumladın.', 'You swapped the intervals: f\' sign read the wrong way.')],
      [inc ? un(iv(null, -q), iv(-p, null)) : iv(-q, -p), tx('Kritik noktaların işaretini ters aldın (f\' = 0 için x = p, x = q).', 'You flipped the signs of the critical points (f\' = 0 gives x = p and x = q).')],
      [inc ? iv(q, null) : iv(null, q), tx('Aralığın yalnızca bir parçasını aldın; işaret tablosunu tamamlamadın.', 'You kept only part of the answer; the sign chart was not completed.')],
      [inc ? iv(null, p) : iv(null, p), tx('Yalnızca ilk işaret bölgesine baktın.', 'You looked only at the first sign region.')],
      [un(iv(null, q), iv(p, null)), tx('Kritik noktaları yanlış eşleştirdin.', 'You matched the critical points wrongly.')],
    ];
    const q1 = mk(T.mono(), tx(`f(x) = ${c.poly} fonksiyonu hangi aralıklarda ${inc ? 'ARTANDIR' : 'AZALANDIR'}?`, `On which intervals is f(x) = ${c.poly} ${inc ? 'INCREASING' : 'DECREASING'}?`),
      correct, wr, [`f'(x) = 6x² ${plus(-6 * (p + q))}x ${plus(6 * p * q)} = 6(${xs(p)})(${xs(q)})`,
        tx(`İşaret tablosu: x < ${p} için f' > 0, ${p} < x < ${q} için f' < 0, x > ${q} için f' > 0`, `Sign chart: f' > 0 for x < ${p}, f' < 0 for ${p} < x < ${q}, f' > 0 for x > ${q}`),
        tx(`${inc ? 'Artan' : 'Azalan'}: ${correct}`, `${inc ? 'Increasing' : 'Decreasing'}: ${correct}`)], rng, plotOf(c.f, p - 3, q + 3));
    return chk(q1, { t: 'intervals', fp: c.fp, want: inc ? 'inc' : 'dec' });
  }

  function grFprime(rng) {
    const p = rng.nextInt(-3, 2), q = p + rng.nextInt(2, 5), up = rng.nextInt(0, 2) === 0;
    const fp = (x) => (up ? 1 : -1) * (x - p) * (x - q);
    const outs = un(iv(null, p), iv(q, null)), mid = iv(p, q);
    const correct = up ? outs : mid;
    const plot = plotOf(fp, p - 2, q + 2, [0]).addPoint(p, 0).addPoint(q, 0);
    const q1 = mk(T.mono(), tx(`Aşağıda f fonksiyonunun TÜREVİ f' çizilmiştir (x = ${p} ve x = ${q} noktalarında x eksenini keser). f hangi aralıklarda artandır?`, `The graph shows the DERIVATIVE f' of a function f (it crosses the x-axis at x = ${p} and x = ${q}). On which intervals is f increasing?`),
      correct, [[up ? mid : outs, tx('f\' grafiğinin yüksekliğini f\'nin kendisi sanıp işareti ters okudun; f artan ⇔ f\' > 0.', 'You read the sign of f\' the wrong way; f increases exactly where f\' > 0 (graph above the axis).')],
        [iv(null, q), tx('Tüm sol bölgeyi seçtin; f\' işaret değiştiriyor.', 'You took the whole left region; f\' changes sign.')],
        [iv(p, null), tx('Tüm sağ bölgeyi seçtin; f\' işaret değiştiriyor.', 'You took the whole right region; f\' changes sign.')],
        [up ? iv(p, q) : un(iv(null, -q), iv(-p, null)), tx('Kökleri yanlış okudun.', 'You misread the roots.')]],
      [tx(`f artan ⇔ f'(x) > 0 ⇔ f' grafiği x ekseninin ÜSTÜNDE`, `f increasing ⇔ f'(x) > 0 ⇔ the graph of f' lies ABOVE the x-axis`),
        tx(`f' ${up ? 'x < ' + p + ' ve x > ' + q + ' için pozitif' : (p + ' < x < ' + q + ' için pozitif')}`, `f' is positive ${up ? 'for x < ' + p + ' and x > ' + q : 'for ' + p + ' < x < ' + q}`), correct], rng, plot);
    return chk(q1, { t: 'intervals', fp, want: 'inc' });
  }

  function incDecDouble(rng) {
    const a = rng.nextInt(-3, 2), b = a + rng.nextInt(1, 4);
    const fp = (x) => (x - a) * (x - a) * (x - b);
    const q = mk(T.mono(), tx(`f'(x) = (${xs(a)})²(${xs(b)}) olan f fonksiyonu hangi aralıkta AZALANDIR? (en geniş aralık)`, `f'(x) = (${xs(a)})²(${xs(b)}). On which interval is f DECREASING? (the largest interval)`),
      iv(null, b),
      [[un(iv(null, a), iv(a, b)), tx(`x = ${a} kritik nokta, ama f' orada işaret değiştirmez (çarpan kareli); f azalmaya devam eder.`, `x = ${a} is critical but f' does not change sign there (squared factor), so f keeps decreasing through it.`)],
        [iv(b, null), tx('Azalan değil artan aralığı seçtin.', 'You picked the increasing interval.')],
        [iv(null, a), tx(`(${xs(a)})² her zaman ≥ 0 olduğundan işareti belirleyen yalnızca (${xs(b)}) çarpanıdır.`, `Since (${xs(a)})² ≥ 0 the sign is decided only by the factor (${xs(b)}).`)],
        [iv(a, b), tx(`x = ${a} noktasında işaret değiştiğini sandın; kareli çarpan işaret değiştirmez.`, `You assumed the sign changes at x = ${a}; a squared factor does not change sign.`)]],
      [tx(`Kritik noktalar: x = ${a} ve x = ${b}`, `Critical points: x = ${a} and x = ${b}`),
        tx(`(${xs(a)})² ≥ 0 ⇒ f'nin işareti (${xs(b)}) ile aynı`, `(${xs(a)})² ≥ 0 ⇒ the sign of f' equals the sign of (${xs(b)})`),
        tx(`x < ${b} için f' ≤ 0 (yalnız x = ${a}'da 0) ⇒ azalan: ${iv(null, b)}`, `f' ≤ 0 for x < ${b} (zero only at x = ${a}) ⇒ decreasing: ${iv(null, b)}`)], rng, plotOf(fp, Math.min(a, b) - 2, b + 2, [0]));
    return chk(q, { t: 'intervals', fp, want: 'dec' });
  }

  function localFirst(rng) {
    const a = rng.nextInt(-3, 2), b = a + rng.nextInt(1, 4), e = rng.nextInt(1, 4);
    const fp = (x) => Math.pow(x - a, e) * (x - b);
    const sgn = e % 2 === 1;
    const mx = tx('yerel maksimum', 'local maximum'), mn = tx('yerel minimum', 'local minimum'), no = tx('yerel ekstremum yok', 'no local extremum'), ab = tx('mutlak maksimum (kesin)', 'absolute maximum (certain)');
    const correct = sgn ? mx : no;
    const ex = e === 1 ? '' : sup(e);
    const q = mk(T.loc(), tx(`f'(x) = (${xs(a)})${ex}(${xs(b)}) ise f fonksiyonunun x = ${a} noktasındaki durumu nedir?`, `If f'(x) = (${xs(a)})${ex}(${xs(b)}), what happens to f at x = ${a}?`),
      correct, [[sgn ? no : mx, sgn ? tx('f\' burada işaret değiştirir (+ → −), yani yerel maksimum vardır.', 'f\' does change sign here (+ to −), so there is a local maximum.') : tx(`Çarpan çift kuvvetli (${e}); f' işaret değiştirmez, ekstremum oluşmaz.`, `The factor has an even power (${e}); f' does not change sign, so there is no extremum.`)],
        [mn, tx('Minimum, f\'nin − → + değiştirdiği yerde olur; burada tersi ya da hiç değişmez.', 'A minimum needs f\' to go − to +; here it is the opposite or no change.')],
        [ab, tx('İşaret tablosu yalnızca yerel davranışı verir; mutlak ekstremum için bütün aralık incelenmelidir.', 'A sign chart only gives local behaviour; absolute extrema need the whole domain.')]],
      [tx(`Kritik noktalar: x = ${a}, x = ${b}`, `Critical points: x = ${a}, x = ${b}`),
        tx(`(${xs(a)})${ex} ${sgn ? 'tek kuvvet: işaret değiştirir' : 'çift kuvvet: işaret değiştirmez'}`, `(${xs(a)})${ex} ${sgn ? 'is an odd power: it changes sign' : 'is an even power: it does not change sign'}`),
        sgn ? tx(`x < ${a}: f' > 0, ${a} < x < ${b}: f' < 0 ⇒ x = ${a}'da + → −: yerel maksimum`, `x < ${a}: f' > 0, ${a} < x < ${b}: f' < 0 ⇒ + to − at x = ${a}: local maximum`) : tx(`x = ${a} civarında f' < 0 (iki yanda da) ⇒ ekstremum yok`, `f' < 0 on both sides of x = ${a} ⇒ no extremum`)], rng);
    return chk(q, { t: 'classify', f: null, fp, x0: a, kind: sgn ? 'max' : 'none' });
  }

  function localClassify(rng) {
    const c = cubicParams(rng), isMax = rng.nextInt(0, 2) === 0, ans = isMax ? c.p : c.q;
    const other = isMax ? c.q : c.p;
    const q = mk(T.loc(), tx(`f(x) = ${c.poly} fonksiyonunun yerel ${isMax ? 'maksimumu' : 'minimumu'} hangi x değerinde oluşur?`, `At which x does f(x) = ${c.poly} have its local ${isMax ? 'maximum' : 'minimum'}?`),
      String(ans), [[String(other), tx('Kritik noktaları doğru buldun ama maksimum/minimum rolünü ters verdin; f\' işaretine bak.', 'You found the critical points but swapped which is max and which is min; check the sign of f\'.')],
        [String(-ans), tx('Kritik noktanın işaretini ters aldın.', 'You flipped the sign of the critical point.')],
        [String(c.p + c.q), tx('İki kritik noktanın toplamını verdin.', 'You gave the sum of the two critical points.')],
        [String(c.f(ans)), tx('x değeri yerine fonksiyon değerini verdin.', 'You gave the function value instead of x.')]],
      [`f'(x) = 6(${xs(c.p)})(${xs(c.q)})  →  x = ${c.p}, ${c.q}`, `f''(x) = 12x ${plus(-6 * (c.p + c.q))}`,
        tx(`f''(${c.p}) = ${12 * c.p - 6 * (c.p + c.q)} < 0 ⇒ maksimum;  f''(${c.q}) = ${12 * c.q - 6 * (c.p + c.q)} > 0 ⇒ minimum`, `f''(${c.p}) = ${12 * c.p - 6 * (c.p + c.q)} < 0 ⇒ maximum;  f''(${c.q}) = ${12 * c.q - 6 * (c.p + c.q)} > 0 ⇒ minimum`)], rng, plotOf(c.f, c.p - 3, c.q + 3));
    return chk(q, { t: 'classify', f: c.f, x0: ans, kind: isMax ? 'max' : 'min' });
  }

  // --- Mean Value Theorem & Rolle ---
  function mvtCubic(rng) {
    const m = rng.nextInt(1, 5), f = (x) => x * x * x;
    const q = mk(T.mvt(), tx(`f(x) = x³ için [${-m}, ${2 * m}] aralığında Ortalama Değer Teoremini sağlayan c ∈ (${-m}, ${2 * m}) değeri kaçtır?`, `For f(x) = x³ on [${-m}, ${2 * m}], what c ∈ (${-m}, ${2 * m}) satisfies the Mean Value Theorem?`),
      String(m), [[String(-m), tx(`c = −${m} da 3c² = ${3 * m * m} denklemini sağlar, ama açık aralığın (${-m}, ${2 * m}) dışındadır (uç nokta).`, `c = −${m} also solves 3c² = ${3 * m * m} but is an endpoint, outside the open interval (${-m}, ${2 * m}).`)],
        [String(2 * m), tx('Sağ uç noktayı verdin; c açık aralığın içindedir.', 'You gave the right endpoint; c lies inside the open interval.')],
        [frac(m, 2), tx('Ortalama eğimi yanlış hesapladın; (f(b) − f(a))/(b − a) = ' + 3 * m * m + '.', 'You mis-computed the average slope; (f(b) − f(a))/(b − a) = ' + 3 * m * m + '.')],
        [String(3 * m * m), tx('Ortalama eğimi (' + 3 * m * m + ') verdin, c değerini değil.', 'You gave the average slope (' + 3 * m * m + '), not c.')]],
      [`[f(b) - f(a)]/(b - a) = (${8 * m * m * m} - ${-m * m * m})/${3 * m} = ${3 * m * m}`, `f'(c) = 3c² = ${3 * m * m}  →  c = ±${m}`, tx(`Yalnızca c = ${m} açık aralıktadır.`, `Only c = ${m} lies in the open interval.`)], rng,
      plotOf(f, -m - 1, 2 * m + 1).addSegment(-m, -m * m * m, 2 * m, 8 * m * m * m, true).addPoint(-m, -m * m * m).addPoint(2 * m, 8 * m * m * m));
    return chk(q, { t: 'mvt', f, a: -m, b: 2 * m });
  }

  function mvtSqrt(rng) {
    const [s, t] = rng.pick([[1, 3], [1, 5], [2, 4], [3, 5], [0, 2], [0, 4], [1, 7], [2, 6]]);
    const a = s * s, b = t * t, cc = ((s + t) / 2) * ((s + t) / 2), f = (x) => Math.sqrt(x);
    const q = mk(T.mvt(), tx(`f(x) = √x için [${a}, ${b}] aralığında Ortalama Değer Teoremini sağlayan c kaçtır?`, `For f(x) = √x on [${a}, ${b}], what value of c satisfies the Mean Value Theorem?`),
      String(cc), [[frac(a + b, 2), tx('Aralığın orta noktasını aldın; c, f\'(c) = ortalama eğim denkleminden bulunur.', 'You took the midpoint of the interval; c comes from f\'(c) = average slope.')],
        [frac(s + t, 2), tx('1/(2√c) = ortalama eğim denkleminde √c değerini verdin, c\'yi değil.', 'You gave √c from 1/(2√c) = average slope instead of c.')],
        [String(s + t), tx('√c = (s+t)/2 çözümünde 2\'ye bölmeyi unuttun.', 'You forgot to divide by 2 when solving for √c.')],
        [String(cc + 1), tx('Karesini alırken küçük bir hata yaptın.', 'A small slip when squaring.')],
        [String(Math.max(0, cc - 1)), tx('Karesini alırken küçük bir hata yaptın.', 'A small slip when squaring.')]],
      [`[f(b) - f(a)]/(b - a) = (${t} - ${s})/(${b} - ${a}) = 1/${s + t}`, `f'(c) = 1/(2√c) = 1/${s + t}  →  √c = ${frac(s + t, 2)}`, `c = ${cc}`], rng,
      plotOf(f, Math.max(0, a - 1), b + 1).addSegment(a, s, b, t, true).addPoint(a, s).addPoint(b, t));
    return chk(q, { t: 'mvt', f, a, b });
  }

  function rolleK(rng) {
    const a = rng.nextInt(-3, 2), b = a + rng.nextInt(2, 6), m = rng.nextInt(1, 6);
    const k = -(a + b), f = (x) => x * x + k * x + m;
    const q = mk(T.mvt(), tx(`f(x) = x² + kx + ${m} fonksiyonu [${a}, ${b}] aralığında Rolle teoreminin koşullarını sağlıyor. k kaçtır?`, `f(x) = x² + kx + ${m} satisfies the hypotheses of Rolle's theorem on [${a}, ${b}]. What is k?`),
      String(k), [[String(a + b), tx('f(a) = f(b) denkleminde işareti ters çözdün.', 'You solved f(a) = f(b) with the wrong sign.')],
        [frac(-(a + b), 2), tx('c = −k/2 (f\'(c) = 0) değerini verdin, k\'yi değil.', 'You gave c = −k/2 (where f\'(c) = 0) rather than k.')],
        [String(a * b), tx('Köklerin çarpımını verdin; Rolle koşulu f(a) = f(b) ifadesinden gelir.', 'You gave a product of the endpoints; Rolle\'s condition is f(a) = f(b).')],
        [String(b - a), tx('Aralığın uzunluğunu verdin.', 'You gave the interval length.')]],
      [`f(${a}) = f(${b})  ⇒  ${a * a} ${plus(a)}k = ${b * b} ${plus(b)}k`, `${a * a - b * b} = ${b - a}k  →  k = ${k}`, tx(`Kontrol: f'(c) = 0 için c = ${frac(-k, 2)} ∈ (${a}, ${b})`, `Check: f'(c) = 0 gives c = ${frac(-k, 2)} ∈ (${a}, ${b})`)], rng);
    return chk(q, { t: 'root', g: (v) => (a * a + v * a) - (b * b + v * b) });
  }

  function mvtApplies(rng) {
    const k = rng.nextInt(-3, 4), abs = rng.nextInt(0, 2) === 0;
    const good = `[${k + 1}, ${k + 4}]`;
    const bads = [`[${k - 2}, ${k + 2}]`, `[${k - 3}, ${k + 1}]`, `[${k - 1}, ${k + 3}]`, `[${k - 4}, ${k + 4}]`];
    const fs = abs ? `f(x) = |${xs(k)}|` : `f(x) = 1/(${xs(k)})`;
    const why = abs ? tx(`|${xs(k)}| x = ${k} noktasında türevlenemez.`, `|${xs(k)}| is not differentiable at x = ${k}.`) : tx(`1/(${xs(k)}) x = ${k} noktasında tanımsız (süreksiz).`, `1/(${xs(k)}) is undefined (discontinuous) at x = ${k}.`);
    const q = mk(T.mvt(), tx(`Hangi aralıkta ${fs} için Ortalama Değer Teoremi uygulanabilir?`, `On which interval can the Mean Value Theorem be applied to ${fs}?`),
      good, bads.map((b2) => [b2, tx(`Aralık x = ${k} noktasını içeriyor: ${why}`, `The interval contains x = ${k}: ${why}`)]),
      [tx('MDT: f [a, b] üzerinde sürekli ve (a, b) içinde türevlenebilir olmalı.', 'MVT needs f continuous on [a, b] and differentiable on (a, b).'), why, tx(`Bu yüzden aralık x = ${k} noktasını içermemeli: ${good}`, `So the interval must avoid x = ${k}: ${good}`)], rng);
    return chk(q, { t: 'mvtint', k });
  }

  // --- concavity & inflection ---
  function concQuartic(rng) {
    const p = rng.nextInt(1, 5), up = rng.nextInt(0, 2) === 0;
    const f = (x) => x * x * x * x - 6 * p * p * x * x;
    const outs = un(iv(null, -p), iv(p, null)), mid = iv(-p, p), correct = up ? outs : mid;
    const q = mk(T.conc(), tx(`f(x) = ${polyStr(0, 0, -6 * p * p, 0, 1)} fonksiyonu hangi aralıklarda ${up ? 'YUKARI' : 'AŞAĞI'} bükeydir?`, `On which intervals is f(x) = ${polyStr(0, 0, -6 * p * p, 0, 1)} concave ${up ? 'UP' : 'DOWN'}?`),
      correct, [[up ? mid : outs, tx('Yukarı/aşağı bükeyliği ters aldın: f\'\' > 0 yukarı bükeydir.', 'You swapped concave up/down: f\'\' > 0 means concave up.')],
        [up ? iv(0, null) : iv(null, 0), tx('Kritik noktayı (x = 0) büküm noktası sandın; f\'\' = 0 denklemini çözmelisin.', 'You used x = 0 (where f\' vanishes) as the split; solve f\'\' = 0 instead.')],
        [up ? un(iv(null, -3 * p), iv(3 * p, null)) : iv(-3 * p, 3 * p), tx('x² = ' + p * p + ' çözümünde p katsayısını yanlış kullandın.', 'You mishandled the factor when solving x² = ' + p * p + '.')],
        [up ? iv(p, null) : iv(0, p), tx('İşaret tablosunun yalnızca bir kısmını aldın.', 'You kept only part of the sign chart.')]],
      [`f'(x) = 4x³ ${plus(-12 * p * p)}x,  f''(x) = 12x² ${plus(-12 * p * p)} = 12(${xs(p)})(${xs(-p)})`,
        tx(`f'' > 0 için x < ${-p} veya x > ${p};  f'' < 0 için ${-p} < x < ${p}`, `f'' > 0 for x < ${-p} or x > ${p};  f'' < 0 for ${-p} < x < ${p}`), correct], rng, plotOf(f, -p - 2, p + 2));
    return chk(q, { t: 'intervals', fp: (x) => 12 * x * x - 12 * p * p, want: up ? 'inc' : 'dec' });
  }

  function inflPoint(rng) {
    const p = nz(rng, -3, 3), qq = rng.nextInt(-4, 5), r = rng.nextInt(-5, 6);
    const f = (x) => x * x * x - 3 * p * x * x + qq * x + r;
    const yp = f(p);
    const q = mk(T.conc(), tx(`f(x) = ${polyStr(r, qq, -3 * p, 1)} fonksiyonunun büküm noktası hangisidir?`, `What is the inflection point of f(x) = ${polyStr(r, qq, -3 * p, 1)}?`),
      `(${p}, ${yp})`, [[`(${p}, ${r})`, tx('y-koordinatı için f(0) = sabit terim aldın; f(x_b) hesaplanmalı.', 'You used f(0), the constant, for the y-coordinate; evaluate f at the inflection x.')],
        [`(${-p}, ${f(-p)})`, tx('f\'\' = 0 çözümünde x\'in işaretini ters aldın.', 'You flipped the sign of x when solving f\'\' = 0.')],
        [`(${yp}, ${p})`, tx('Koordinatları ters yazdın (x, y) yerine (y, x).', 'You wrote the coordinates as (y, x) instead of (x, y).')],
        [`(${p}, ${yp + qq})`, tx('f\'(x) ile f(x) karıştı: y için hesapta bir terim yanlış.', 'A term slipped in the y-computation.')],
        [`(${p}, ${yp - 1})`, tx('y-koordinatında küçük bir hesap hatası.', 'A small arithmetic slip in the y-coordinate.')]],
      [`f''(x) = 6x ${plus(-6 * p)} = 0  →  x = ${p}`, tx(`f'' işareti ${p}'de değişir ⇒ büküm noktası`, `f'' changes sign at ${p} ⇒ inflection point`), `f(${p}) = ${yp}  →  (${p}, ${yp})`], rng, plotOf(f, p - 3, p + 3));
    return chk(q, { t: 'inflect', fpp: (x) => 6 * x - 6 * p, f, ptx: p, pty: yp });
  }

  function inflCount(rng) {
    const roots = [];
    while (roots.length < 3) { const v = rng.nextInt(-3, 4); if (roots.indexOf(v) < 0) roots.push(v); }
    roots.sort((u, w) => u - w);
    let e = [rng.nextInt(1, 4), rng.nextInt(1, 4), rng.nextInt(1, 4)];
    const count = e.filter((v) => v % 2 === 1).length;
    const fpp = (x) => roots.reduce((acc, r, i) => acc * Math.pow(x - r, e[i]), 1);
    const term = (r, ex) => `(${xs(r)})${ex === 1 ? '' : sup(ex)}`;
    const fs = roots.map((r, i) => term(r, e[i])).join('');
    const wr = [[3, tx('Her kökü büküm noktası saydın; çift kuvvetli köklerde f\'\' işaret değiştirmez.', 'You counted every root; at roots with an even power f\'\' does not change sign.')],
      [Math.min(count + 1, 4), tx('Bir çift kuvvetli kökü de saydın.', 'You counted an even-power root as well.')],
      [Math.max(count - 1, 0), tx('Bir tek kuvvetli kökü saymadın.', 'You missed an odd-power root.')], [count === 0 ? 4 : 0, tx('Yanlış sayım.', 'Wrong count.')], [4, tx('Yanlış sayım.', 'Wrong count.')], [0, tx('Yanlış sayım.', 'Wrong count.')], [1, tx('Yanlış sayım.', 'Wrong count.')], [2, tx('Yanlış sayım.', 'Wrong count.')]]
      .map((w) => [String(w[0]), w[1]]);
    const q = mk(T.conc(), tx(`Bir f fonksiyonunun ikinci türevi f''(x) = ${fs} ise f'nin kaç büküm noktası vardır?`, `If f''(x) = ${fs}, how many inflection points does f have?`),
      String(count), wr, [tx(`f'' = 0 kökleri: x = ${roots.join(', ')}`, `Roots of f'': x = ${roots.join(', ')}`),
        tx('Büküm noktası için f\'\' işaret değiştirmelidir: yalnız tek kuvvetli çarpanlar işareti değiştirir.', 'An inflection needs f\'\' to change sign: only odd-power factors change sign.'),
        tx(`Tek kuvvetli kök sayısı = ${count}`, `Number of odd-power roots = ${count}`)], rng);
    return chk(q, { t: 'signchanges', fpp, lo: -5, hi: 5 });
  }

  // --- optimization ---
  function optSumProduct(rng) {
    const n = rng.nextInt(2, 9), f = (x) => x * (2 * n - x);
    const q = mk(T.opt(), tx(`Toplamları ${2 * n} olan iki pozitif sayının çarpımı en çok kaç olabilir?`, `Two positive numbers have sum ${2 * n}. What is the largest possible product?`),
      String(n * n), [[String(2 * n), tx('Toplamı verdin, çarpımı değil.', 'You gave the sum, not the product.')], [String(n), tx('Sayılardan birini verdin.', 'You gave one of the numbers.')], [String(n * (n + 1)), tx('Sayıları n ve n+1 aldın; toplamları 2n olmaz.', 'You used n and n+1, whose sum is not 2n.')]],
      [`y = ${2 * n} - x,  P(x) = x(${2 * n} - x)`, `P'(x) = ${2 * n} - 2x = 0  →  x = ${n}`, `P(${n}) = ${n}·${n} = ${n * n}`], rng, null);
    return chk(q, { t: 'extrema', f, lo: 0, hi: 2 * n, want: 'max' });
  }

  function optWall(rng) {
    const n = rng.nextInt(2, 8), P = 8 * n, f = (x) => x * (P - 2 * x);
    const q = mk(T.opt(), tx(`Bir duvara yaslanan dikdörtgen bir bahçenin duvar olmayan üç kenarı için ${P} m çit var. Bahçenin en büyük alanı kaç m²'dir?`, `A rectangular garden borders a wall and fencing of ${P} m is used for the other three sides. What is the largest possible area in m²?`),
      String(8 * n * n), [[String(P * P / 16), tx('Dört kenarı çitle çevrilmiş (kare) gibi hesapladın; bir kenar duvar.', 'You treated it as a fully fenced square; one side is the wall.')],
        [String(4 * n * n), tx('Dört kenarlı durumun alanı; duvar kenarı çit gerektirmez.', 'That is the four-sided answer; the wall side needs no fence.')], [String(4 * n), tx('Bir kenar uzunluğunu verdin.', 'You gave a side length.')], [String(P * P / 8 + n), tx('Alan formülünde bir terim yanlış.', 'A term in the area formula is wrong.')]],
      [`2x + y = ${P}  →  y = ${P} - 2x`, `A(x) = x(${P} - 2x),  A'(x) = ${P} - 4x = 0  →  x = ${2 * n}, y = ${4 * n}`, `A = ${2 * n}·${4 * n} = ${8 * n * n}`], rng, null, 'm²');
    return chk(q, { t: 'extrema', f, lo: 0, hi: P / 2, want: 'max' });
  }

  function optProfitQty(rng) {
    const b = rng.nextInt(1, 4), m = rng.nextInt(3, 10), c = rng.nextInt(2, 7), a = c + 2 * b * m, F = rng.nextInt(10, 60);
    const P = (x) => (a - b * x) * x - c * x - F;
    const q = mk(T.opt(), tx(`Birim fiyatı p = ${a} - ${b === 1 ? '' : b}x TL olan bir ürünün üretim maliyeti C(x) = ${c}x + ${F} TL'dir. Kârı en büyükleyen üretim miktarı x kaçtır?`, `A product sells at price p = ${a} - ${b === 1 ? '' : b}x dollars per unit and costs C(x) = ${c}x + ${F} to make. Which production level x maximizes profit?`),
      String(m), [[String(2 * m), tx('Kâr yerine ikiye bölmeyi unuttun: P\' = 0 denkleminde 2b ile bölmelisin.', 'You forgot the factor 2: P\' = 0 requires dividing by 2b.')], [String(a - c), tx('Marjinal gelir = marjinal maliyet denkleminde b katsayısını unuttun.', 'You forgot the coefficient b in marginal revenue = marginal cost.')], [String(F), tx('Sabit maliyeti verdin; türevde yok olur.', 'You gave the fixed cost, which disappears in the derivative.')]],
      [`R(x) = x·p = ${a}x - ${b === 1 ? '' : b}x²,  P(x) = R(x) - C(x) = ${polyStr(-F, a - c, -b)}`, `P'(x) = ${a - c} - ${2 * b}x = 0`, `x = ${frac(a - c, 2 * b)} = ${m}`], rng);
    return chk(q, { t: 'extrema', f: P, lo: 0, hi: a / b, want: 'argmax' });
  }

  function optProfitMax(rng) {
    const b = rng.nextInt(1, 4), m = rng.nextInt(3, 10), c = rng.nextInt(2, 7), a = c + 2 * b * m, F = rng.nextInt(10, 60);
    const P = (x) => (a - b * x) * x - c * x - F;
    const best = b * m * m - F;
    const q = mk(T.opt(), tx(`Fiyat p = ${a} - ${b === 1 ? '' : b}x TL, maliyet C(x) = ${c}x + ${F} TL ise en büyük kâr kaç TL'dir?`, `With price p = ${a} - ${b === 1 ? '' : b}x dollars and cost C(x) = ${c}x + ${F}, what is the maximum profit in dollars?`),
      String(best), [[String(b * m * m), tx('Sabit maliyeti çıkarmayı unuttun.', 'You forgot to subtract the fixed cost.')], [String(P(a - c) ), tx(`x = ${a - c} aldın (2b ile bölmeyi unuttun); kâr burada maksimum değil.`, `You used x = ${a - c} (forgot to divide by 2b); profit is not maximal there.`)], [String(m * (a - b * m)), tx('Maksimum geliri verdin, kârı değil.', 'You gave the revenue at the optimum, not the profit.')], [String(m), tx('Üretim miktarını verdin, kârı değil.', 'You gave the quantity, not the profit.')]],
      [`P(x) = ${polyStr(-F, a - c, -b)},  P'(x) = ${a - c} - ${2 * b}x = 0  →  x = ${m}`, `P(${m}) = ${b * m * m} - ${F} = ${best}`], rng);
    return chk(q, { t: 'extrema', f: P, lo: 0, hi: a / b, want: 'max' });
  }

  function optBox(rng) {
    const k = rng.nextInt(1, 5), S = 6 * k, V = (x) => x * (S - 2 * x) * (S - 2 * x);
    const q = mk(T.opt(), tx(`${S} cm kenarlı kare bir kartonun köşelerinden eş kareler kesilip kenarlar katlanarak üstü açık bir kutu yapılıyor. Kutunun en büyük hacmi kaç cm³ olur?`, `Equal squares are cut from the corners of a ${S} cm × ${S} cm sheet and the sides folded up to make an open box. What is the maximum volume in cm³?`),
      String(16 * k * k * k), [[String(8 * k * k * k), tx(`x = ${2 * k} (= ${S}/3) aldın; V' = 0 çözümü x = ${k}.`, `You used x = ${2 * k} (= ${S}/3); V' = 0 gives x = ${k}.`)], [String(k), tx('Kesilen karenin kenarını verdin, hacmi değil.', 'You gave the cut size, not the volume.')], [String(4 * k * k), tx('Taban alanını verdin, hacmi değil.', 'You gave the base area, not the volume.')], [String(12 * k * k * k), tx('Yüksekliği veya tabanı yanlış hesapladın.', 'The base or height was computed wrongly.')]],
      [`V(x) = x(${S} - 2x)²,  0 < x < ${S / 2}`, `V'(x) = (${S} - 2x)(${S} - 6x) = 0  →  x = ${k}`, `V(${k}) = ${k}·${4 * k}² = ${16 * k * k * k}`], rng, null, 'cm³');
    return chk(q, { t: 'extrema', f: V, lo: 0, hi: S / 2, want: 'max' });
  }

  function optCan(rng) {
    const k = rng.nextInt(1, 6), Vol = 2 * k * k * k;
    const S = (r) => 2 * Math.PI * r * r + 2 * Math.PI * Vol / r;
    const q = mk(T.opt(), tx(`Hacmi ${Vol}π cm³ olan kapaklı silindirik bir kutunun en küçük yüzey alanı kaç cm²'dir?`, `A closed cylindrical can must hold ${Vol}π cm³. What is the minimum surface area in cm²?`),
      piS(6 * k * k), [[piS(4 * k * k), tx('Yalnızca yan yüzey alanını (2πrh) verdin; iki tabanı unuttun.', 'You gave only the lateral area (2πrh) and forgot the two bases.')], [piS(10 * k * k), tx(`r = ${2 * k} aldın; yüzey alanının türevini sıfırlayan r = ${k}.`, `You used r = ${2 * k}; S\' = 0 gives r = ${k}.`)], [piS(8 * k * k), tx('Kapak ve tabanı yanlış saydın.', 'The bases were counted wrongly.')], [piS(12 * k * k), tx('Yan yüzeyi iki kez saydın.', 'You counted the lateral area twice.')], [piS(2 * k * k), tx('Yalnızca iki tabanı hesapladın.', 'You computed only the two bases.')]].concat(piFill(6 * k * k)),
      [`πr²h = ${Vol}π  →  h = ${Vol}/r²`, `S(r) = 2πr² + 2πrh = 2πr² + ${2 * Vol}π/r`, `S'(r) = 4πr - ${2 * Vol}π/r² = 0  →  r³ = ${Vol / 2}  →  r = ${k}, h = ${2 * k}`, `S = 2π·${k * k} + 2π·${k}·${2 * k} = ${6 * k * k}π`], rng, null, 'cm²');
    return chk(q, { t: 'extrema', f: S, lo: 0.05, hi: 30, want: 'min', pi: true });
  }

  function optDistance(rng) {
    const t = rng.nextInt(1, 4), a = 2 * t * t * t + t;
    const g = (x) => (x - a) * (x - a) + x * x * x * x;
    const q = mk(T.opt(), tx(`y = x² parabolü üzerinde (${a}, 0) noktasına en yakın noktanın x-koordinatı kaçtır?`, `On the parabola y = x², which point is closest to (${a}, 0)? Give its x-coordinate.`),
      String(t), [[String(a), tx('Verilen noktanın x-koordinatını verdin.', 'You gave the x-coordinate of the given point.')], [frac(a, 2), tx('Orta nokta mantığıyla yarısını aldın; mesafe türevi sıfırlanmalı.', 'You halved it by a midpoint idea; set the distance derivative to zero.')], [String(t * t), tx('Parabolün y-koordinatını verdin.', 'You gave the y-coordinate of the closest point.')], [String(-t), tx('Parabol üzerinde sadece pozitif x, (a,0)\'a daha yakındır.', 'Only the positive x is nearer to the given point.')]],
      [`d² = (x - ${a})² + (x²)²`, `(d²)' = 2(x - ${a}) + 4x³ = 0  →  2x³ + x = ${a}`, tx(`x = ${t}: 2·${t * t * t} + ${t} = ${a} ✓ (2x³ + x artan, tek kök)`, `x = ${t}: 2·${t * t * t} + ${t} = ${a} ✓ (2x³ + x is increasing, single root)`)], rng, plotOf((x) => x * x, -3, Math.max(a, 3) + 1).addPoint(a, 0));
    return chk(q, { t: 'extrema', f: g, lo: -10, hi: 10, want: 'argmin' });
  }

  // --- related rates ---
  function relSolids(rng) {
    const r = rng.nextInt(2, 9), c = rng.nextInt(1, 5), h = rng.nextInt(2, 9), kind = rng.nextInt(0, 3);
    let text, corr, wr, sol, g, unit;
    if (kind === 0) {
      g = (t) => 4 / 3 * Math.PI * Math.pow(r + c * t, 3); unit = 'cm³/s';
      text = tx(`Yarıçapı r = ${r} cm iken saniyede ${c} cm artan bir kürenin hacmi hangi hızla artar?`, `A sphere's radius grows at ${c} cm/s. At r = ${r} cm, how fast is its volume increasing?`);
      corr = piS(4 * r * r * c);
      wr = [[piS(r * r * c), tx('V = 4πr³/3 türevinde 4 çarpanını unuttun.', 'You lost the factor 4 in dV/dt = 4πr²·dr/dt.')], [piS(4 * r * r), tx('dr/dt çarpanını unuttun.', 'You forgot the factor dr/dt.')], [piS(8 * r * c), tx('Yüzey alanının türevini (8πrc) aldın; hacmin değil.', 'You differentiated the surface area (8πrc) instead of the volume.')], [`${frac(4 * r * r * r * c, 3)}π`, tx('Türev almadan V\'yi dr/dt ile çarptın.', 'You multiplied V by dr/dt without differentiating.')], [piS(4 * r * c), tx('r² yerine r kullandın.', 'You used r instead of r².')]];
      sol = ['V = (4/3)πr³  →  dV/dt = 4πr²·(dr/dt)', `dV/dt = 4π·${r}²·${c} = ${piS(4 * r * r * c)}`];
    } else if (kind === 1) {
      g = (t) => 4 * Math.PI * Math.pow(r + c * t, 2); unit = 'cm²/s';
      text = tx(`Yarıçapı r = ${r} cm iken saniyede ${c} cm artan bir kürenin yüzey alanı hangi hızla artar?`, `A sphere's radius grows at ${c} cm/s. At r = ${r} cm, how fast is its surface area increasing?`);
      corr = piS(8 * r * c);
      wr = [[piS(4 * r * c), tx('S = 4πr² türevinde 2 çarpanını unuttun.', 'You lost the factor 2 in dS/dt = 8πr·dr/dt.')], [piS(8 * r), tx('dr/dt çarpanını unuttun.', 'You forgot the factor dr/dt.')], [piS(4 * r * r * c), tx('Hacmin türevini (4πr²·c) aldın.', 'You differentiated the volume (4πr²·c) instead.')], [piS(16 * r * c), tx('Fazladan bir 2 çarpanı kullandın.', 'You used an extra factor 2.')], [piS(8 * r * c + 4), tx('Küçük bir toplama hatası.', 'A small addition slip.')]];
      sol = ['S = 4πr²  →  dS/dt = 8πr·(dr/dt)', `dS/dt = 8π·${r}·${c} = ${piS(8 * r * c)}`];
    } else {
      g = (t) => Math.PI * Math.pow(r + c * t, 2) * h; unit = 'cm³/s';
      text = tx(`Yüksekliği h = ${h} cm sabit olan bir silindirin yarıçapı saniyede ${c} cm artıyor. r = ${r} cm iken hacmi hangi hızla artar?`, `A cylinder of fixed height h = ${h} cm has radius growing at ${c} cm/s. At r = ${r} cm, how fast is the volume increasing?`);
      corr = piS(2 * r * h * c);
      wr = [[piS(r * h * c), tx('V = πr²h türevinde 2 çarpanını unuttun.', 'You lost the factor 2 in dV/dt = 2πrh·dr/dt.')], [piS(r * r * c), tx('h çarpanını ve türevi karıştırdın.', 'You mixed up the factor h with the derivative.')], [piS(2 * r * h), tx('dr/dt çarpanını unuttun.', 'You forgot the factor dr/dt.')], [piS(r * r * h * c), tx('Türev almadan V\'yi dr/dt ile çarptın.', 'You multiplied V by dr/dt without differentiating.')], [piS(2 * r * c), tx('h çarpanını unuttun.', 'You forgot the constant factor h.')]];
      sol = ['V = πr²h  (h sabit)  →  dV/dt = 2πrh·(dr/dt)', `dV/dt = 2π·${r}·${h}·${c} = ${piS(2 * r * h * c)}`];
    }
    const nPi = parseInt(corr, 10) || 1;
    const q = mk(T.rel(), text, corr, wr.concat(piFill(nPi)), sol, rng, null, unit);
    return chk(q, { t: 'rate', g, t0: 0 });
  }

  function relLadder(rng) {
    const [x0, y0, L0] = rng.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]]);
    const v = rng.nextInt(1, 5), x = x0, y = y0, L = L0;
    const yy = (t) => Math.sqrt(L * L - (x + v * t) * (x + v * t));
    const ans = frac(x * v, y);
    const q = mk(T.rel(), tx(`${L} m uzunluğundaki bir merdiven dik bir duvara dayalıdır. Merdivenin alt ucu duvardan ${v} m/s hızla uzaklaşırken, alt uç duvardan ${x} m uzaktayken üst ucun duvar boyunca kayma hızı kaç m/s'dir? (aşağı doğru hız büyüklüğü)`, `A ${L} m ladder leans against a vertical wall. Its foot slides away from the wall at ${v} m/s. When the foot is ${x} m from the wall, how fast (in m/s) is the top sliding down the wall? (give the speed)`),
      ans, [[frac(y * v, x), tx('Oranı ters yazdın: dy/dt = −(x/y)·dx/dt.', 'You inverted the ratio: dy/dt = −(x/y)·dx/dt.')], [String(v), tx('Üst ucun hızını alt ucun hızına eşitledin; iki hız farklıdır.', 'You equated the two speeds; they differ.')], [frac(L * v, y), tx('x yerine merdiven uzunluğunu kullandın.', 'You used the ladder length in place of x.')], [frac(x * v, L), tx('y yerine L ile böldün.', 'You divided by L instead of y.')], [frac(y * v, L), tx('x ve y rolleri karışmış, paydada L kullanılmış.', 'x and y were mixed up and L used in the denominator.')]],
      [`x² + y² = ${L}²  →  2x·x' + 2y·y' = 0  →  y' = −(x/y)·x'`, tx(`y = √(${L}² − ${x}²) = ${y}`, `y = √(${L}² − ${x}²) = ${y}`), `y' = −(${x}/${y})·${v} = −${ans}`, tx(`Hız büyüklüğü: ${ans} m/s`, `Speed: ${ans} m/s`)], rng, null, 'm/s');
    return chk(q, { t: 'rate', g: yy, t0: 0, abs: true });
  }

  function relCars(rng) {
    const [a0, b0, s0] = rng.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10]]);
    const k = rng.nextInt(1, 4), x = a0 * k, y = b0 * k, s = s0 * k, u = rng.nextInt(20, 61), w = rng.nextInt(20, 61);
    const dist = (t) => Math.hypot(x + u * t, y + w * t);
    const ans = frac(x * u + y * w, s);
    const q = mk(T.rel(), tx(`Bir kavşaktan bir araç doğuya ${u} km/sa, diğeri kuzeye ${w} km/sa hızla uzaklaşıyor. Birincisi kavşaktan ${x} km, ikincisi ${y} km uzaktayken aralarındaki uzaklık kaç km/sa hızla artar?`, `Two cars leave an intersection, one going east at ${u} km/h and one going north at ${w} km/h. When they are ${x} km and ${y} km from the intersection, how fast is the distance between them increasing (km/h)?`),
      ans, [[String(u + w), tx('Hızları topladın; uzaklık Pisagor ile bağlıdır, doğrusal toplam değildir.', 'You added the speeds; the distance obeys the Pythagorean relation, not a plain sum.')], [frac(x * w + y * u, s), tx('Hızları karşılıklı çarptın (x·w + y·u); doğrusu x·u + y·w.', 'You paired the wrong speed with each distance (x·w + y·u); it is x·u + y·w.')], [frac(x * u + y * w, s * s), tx('s ile bölmen gerekirken s² ile böldün.', 'You divided by s² instead of s.')], [String(x * u + y * w), tx('Son adımda s = ' + s + ' ile bölmeyi unuttun.', 'You forgot the final division by s = ' + s + '.')], [frac(x * u - y * w, s), tx('İşaret hatası: iki araç da uzaklaşıyor, terimler toplanır.', 'Sign slip: both cars move away, so the terms add.')]],
      [`s² = x² + y²  →  s·s' = x·x' + y·y'`, tx(`s = √(${x}² + ${y}²) = ${s} km`, `s = √(${x}² + ${y}²) = ${s} km`), `s' = (${x}·${u} + ${y}·${w})/${s} = ${ans}`], rng, null, 'km/h');
    return chk(q, { t: 'rate', g: dist, t0: 0 });
  }

  function relCone(rng) {
    const h0 = rng.nextInt(2, 7), c = rng.nextInt(1, 10);
    const hOf = (t) => Math.cbrt(12 * (Math.PI * h0 * h0 * h0 / 12 + c * Math.PI * t) / Math.PI);
    const ans = frac(4 * c, h0 * h0);
    const q = mk(T.rel(), tx(`Yüksekliği, tabanının yarıçapının iki katı olan (h = 2r) ters duran bir koniye ${c}π cm³/s hızla su dolduruluyor. Su yüksekliği ${h0} cm iken yükseklik kaç cm/s hızla artar?`, `Water pours into an inverted cone whose height is twice its base radius (h = 2r) at ${c}π cm³/s. When the water is ${h0} cm deep, how fast (cm/s) is the depth rising?`),
      ans, [[frac(c, h0 * h0), tx('V = πh³/12 yerine V = πh³/3 kullandın (r = h/2 yerine r = h).', 'You used V = πh³/3 (r = h instead of r = h/2).')], [frac(12 * c, h0 * h0), tx('V = πh³/12 türevinde 3 çarpanını unuttun.', 'You lost the factor 3 from differentiating h³.')], [frac(4 * c, h0), tx('dV/dt = πh²h\'/4 denkleminde h² yerine h kullandın.', 'You used h instead of h² in dV/dt = πh²h\'/4.')], [frac(c, 4 * h0 * h0), tx('Yarıçap-yükseklik ilişkisini ters kurdun.', 'You set up the radius-height relation the wrong way round.')], [frac(2 * c, h0 * h0), tx('Katsayı hatası.', 'A coefficient slip.')]],
      [`r = h/2:  V = (1/3)π(h/2)²h = πh³/12`, `dV/dt = (π h²/4)·dh/dt  →  dh/dt = 4(dV/dt)/(π h²)`, `dh/dt = 4·${c}π/(π·${h0}²) = ${ans}`], rng, null, 'cm/s');
    return chk(q, { t: 'rate', g: hOf, t0: 0 });
  }

  // --- L'Hopital ---
  function lhSin(rng) {
    const a = nz(rng, -5, 5), b = rng.nextInt(1, 6);
    const q = mk(T.lh(), tx(`lim(x→0) sin(${a}x) / (${b}x) limiti kaçtır?`, `What is lim(x→0) sin(${a}x) / (${b}x)?`),
      frac(a, b), [[frac(b, a), tx('Türev oranını ters yazdın.', 'You inverted the ratio of derivatives.')], ['1', tx('sin u / u → 1 limitini katsayıları hesaba katmadan uyguladın.', 'You used sin u / u → 1 without the coefficients.')], ['0', tx('x = 0 yazıp pay 0 olduğundan 0 sandın; bu 0/0 belirsizliği.', 'You substituted x = 0 and answered 0; it is a 0/0 form.')], [frac(-a, b), tx('İşaret hatası.', 'Sign slip.')], [frac(a * b, 1), tx('Katsayıları çarptın.', 'You multiplied the coefficients.')]],
      [tx('0/0 belirsizliği: pay ve paydanın türevini al.', '0/0 form: differentiate numerator and denominator.'), `${a}cos(${a}x) / ${b} → ${a}/${b} = ${frac(a, b)}`], rng);
    return chk(q, { t: 'limit', f: (x) => Math.sin(a * x) / (b * x), at: 0 });
  }

  function lhInfInf(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const a = rng.nextInt(1, 6), b = rng.nextInt(-4, 5), c = rng.nextInt(1, 6), d = rng.nextInt(1, 6);
      const f = (x) => (a * x * x + b * x) / (c * x * x - d);
      const q = mk(T.lh(), tx(`lim(x→∞) (${polyStr(0, b, a)}) / (${polyStr(-d, 0, c)}) limiti kaçtır?`, `What is lim(x→∞) (${polyStr(0, b, a)}) / (${polyStr(-d, 0, c)})?`),
        frac(a, c), [[frac(c, a), tx('Katsayı oranını ters yazdın.', 'You inverted the coefficient ratio.')], ['0', tx('Pay ve paydanın ikisi de sonsuza gider (∞/∞); derece eşit olduğundan limit 0 olmaz.', 'Both tend to infinity (∞/∞); with equal degrees the limit is not 0.')], ['∞', tx('Pay paydaya göre daha hızlı büyümez; dereceler eşit.', 'The numerator does not outgrow the denominator; the degrees are equal.')], [frac(a, d), tx('Paydada x² katsayısı c yerine sabit terimi aldın.', 'You used the constant in the denominator instead of the x² coefficient.')], [frac(b, c), tx('x katsayısını aldın; baş katsayılar belirler.', 'You used the x coefficient; leading coefficients decide.')]],
        [tx('∞/∞ belirsizliği: iki kez türev al.', '∞/∞ form: differentiate twice.'), `(${2 * a}x ${plus(b)}) / (${2 * c}x) → ∞/∞`, `${2 * a} / ${2 * c} = ${frac(a, c)}`], rng);
      return chk(q, { t: 'limit', f, at: Infinity });
    }
    const a = rng.nextInt(1, 6), b = rng.nextInt(1, 6);
    const q = mk(T.lh(), tx(`lim(x→∞) (${a === 1 ? '' : a}x + ln x) / (${b === 1 ? '' : b}x) limiti kaçtır?`, `What is lim(x→∞) (${a === 1 ? '' : a}x + ln x) / (${b === 1 ? '' : b}x)?`),
      frac(a, b), [['∞', tx('ln x de büyür, ama x kadar hızlı büyümez; limit sonlu.', 'ln x grows too, but much slower than x, so the limit is finite.')], ['0', tx('∞/∞ belirsizliğini 0 sandın.', 'You took ∞/∞ to be 0.')], [frac(a + 1, b), tx('ln x türevi 1/x → 0 olur, 1 olmaz.', 'The derivative of ln x is 1/x → 0, not 1.')], [frac(b, a), tx('Oranı ters yazdın.', 'You inverted the ratio.')], ['1', tx('Katsayıları hesaba katmadın.', 'You ignored the coefficients.')]],
      [tx('∞/∞: pay ve paydanın türevi', '∞/∞: differentiate numerator and denominator'), `(${a} + 1/x) / ${b} → ${a}/${b}`, frac(a, b)], rng);
    return chk(q, { t: 'limit', f: (x) => (a * x + Math.log(x)) / (b * x), at: Infinity });
  }

  function lhRepeated(rng) {
    const a = nz(rng, -3, 3);
    if (rng.nextInt(0, 2) === 0) {
      const q = mk(T.lh(), tx(`lim(x→0) (e^(${a}x) − 1 − (${a})x) / x² limiti kaçtır?`, `What is lim(x→0) (e^(${a}x) − 1 − (${a})x) / x²?`),
        frac(a * a, 2), [[frac(a, 2), tx('İkinci türevde a² yerine a aldın.', 'In the second derivative you got a instead of a².')], ['0', tx('Bir kez türevden sonra hâlâ 0/0; ikinci kez türev gerekir.', 'After one derivative it is still 0/0; differentiate again.')], [String(a * a), tx('Paydanın türevi 2\'ye bölmeyi unuttun.', 'You forgot to divide by the 2 from (x²)\'\'.')], [frac(1, 2), tx('Standart limit e^u − 1 − u ≈ u²/2 için a katsayısını unuttun.', 'You used e^u − 1 − u ≈ u²/2 and forgot the coefficient a.')], ['∞', tx('Belirsizlik çözülmeden ∞ dedin.', 'You said ∞ without resolving the indeterminate form.')]],
        [tx(`0/0: türev → (${a}e^(${a}x) − ${a}) / (2x), yine 0/0`, `0/0: derivative → (${a}e^(${a}x) − ${a}) / (2x), again 0/0`), `(${a * a}e^(${a}x)) / 2 → ${a * a}/2 = ${frac(a * a, 2)}`], rng);
      return chk(q, { t: 'limit', f: (x) => (Math.exp(a * x) - 1 - a * x) / (x * x), at: 0 });
    }
    const q = mk(T.lh(), tx(`lim(x→0) (${a}x − sin(${a}x)) / x³ limiti kaçtır?`, `What is lim(x→0) (${a}x − sin(${a}x)) / x³?`),
      frac(a * a * a, 6), [[frac(a * a * a, 3), tx('Üçüncü türevde paydadaki 3! = 6 yerine 3 kullandın.', 'The denominator (x³)\'\'\' is 6, not 3.')], [frac(a * a, 2), tx('İkinci adımda durdun; hâlâ 0/0.', 'You stopped after two steps; it is still 0/0.')], ['0', tx('İlk adımdan sonra 0/0 devam eder.', 'The 0/0 form persists after one step.')], [frac(-a * a * a, 6), tx('İşaret hatası: sin türevleri −cos, −sin işaretini taşır.', 'Sign slip: derivatives of sin alternate signs.')], [frac(a, 6), tx('İç çarpanı yalnızca bir kez aldın.', 'You took the inner factor only once.')]],
      [tx(`0/0 → türev: (${a} − ${a}cos(${a}x)) / (3x²)`, `0/0 → derivative: (${a} − ${a}cos(${a}x)) / (3x²)`), tx(`yine 0/0 → (${a * a}·sin(${a}x)) / (6x)`, `again 0/0 → (${a * a}·sin(${a}x)) / (6x)`), tx(`yine 0/0 → ${a * a * a}cos(${a}x) / 6 → ${frac(a * a * a, 6)}`, `again 0/0 → ${a * a * a}cos(${a}x) / 6 → ${frac(a * a * a, 6)}`)], rng);
    return chk(q, { t: 'limit', f: (x) => (a * x - Math.sin(a * x)) / (x * x * x), at: 0, tol: 2e-2 });
  }

  function lhRewrite(rng) {
    const a = nz(rng, -6, 6), kind = rng.nextInt(0, 2);
    const wr = [['0', tx('0·∞ biçimini 0 sandın; kesre çevirip L\'Hôpital uygulamalısın.', 'You took 0·∞ to be 0; rewrite as a quotient and use L\'Hôpital.')], ['1', tx('sin u / u → 1 limitini katsayıyı hesaba katmadan uyguladın.', 'You used the standard limit without the coefficient.')], ['∞', tx('x → ∞ iken çarpanı sonsuz sanıp ∞ dedin.', 'You took the factor x → ∞ to give ∞.')], [frac(1, a), tx('Katsayıyı ters aldın.', 'You inverted the coefficient.')], [String(a * a), tx('Katsayıyı kareledin.', 'You squared the coefficient.')], [String(-a), tx('İşaret hatası.', 'Sign slip.')]];
    if (kind === 0) {
      const q = mk(T.lh(), tx(`lim(x→∞) x·sin(${a}/x) limiti kaçtır?`, `What is lim(x→∞) x·sin(${a}/x)?`), String(a), wr,
        [tx(`0·∞ biçimi: u = 1/x ile yaz: sin(${a}u) / u`, `0·∞ form: write with u = 1/x: sin(${a}u) / u`), tx('u → 0 için 0/0: L\'Hôpital', 'u → 0 gives 0/0: L\'Hôpital'), `${a}cos(${a}u) / 1 → ${a}`], rng);
      return chk(q, { t: 'limit', f: (x) => x * Math.sin(a / x), at: Infinity });
    }
    const q = mk(T.lh(), tx(`lim(x→∞) x·(e^(${a}/x) − 1) limiti kaçtır?`, `What is lim(x→∞) x·(e^(${a}/x) − 1)?`), String(a), wr,
      [tx(`0·∞ biçimi: u = 1/x ile yaz: (e^(${a}u) − 1) / u`, `0·∞ form: write with u = 1/x: (e^(${a}u) − 1) / u`), tx('u → 0 için 0/0: L\'Hôpital', 'u → 0 gives 0/0: L\'Hôpital'), `${a}e^(${a}u) / 1 → ${a}`], rng);
    return chk(q, { t: 'limit', f: (x) => x * (Math.exp(a / x) - 1), at: Infinity });
  }

  function lhOneInf(rng) {
    const a = nz(rng, -3, 3), b = rng.nextInt(1, 4), p = a * b;
    const e = (v) => (v === 0 ? '1' : v === 1 ? 'e' : v === -1 ? 'e^(-1)' : `e^(${v})`);
    const q = mk(T.lh(), tx(`lim(x→∞) (1 + ${a}/x)^(${b === 1 ? '' : b}x) limiti kaçtır?`, `What is lim(x→∞) (1 + ${a}/x)^(${b === 1 ? '' : b}x)?`),
      e(p), [['1', tx('1^∞ belirsizliğini 1 sandın.', 'You treated 1^∞ as 1.')], [e(a), tx('Üstteki b çarpanını unuttun.', 'You forgot the exponent factor b.')], [e(b), tx('a katsayısını unuttun.', 'You forgot the coefficient a.')], ['∞', tx('Taban 1\'e, üs sonsuza gider diye ∞ dedin.', 'You said ∞ because the exponent grows.')], [e(-p), tx('İşaret hatası.', 'Sign slip.')], [e(p + 1), tx('Küçük bir toplama hatası.', 'A small addition slip.')]],
      [tx(`L = ${b}x·ln(1 + ${a}/x) = ${b}·ln(1 + ${a}/x) / (1/x), 0/0 biçimi`, `ln L = ${b}x·ln(1 + ${a}/x) = ${b}·ln(1 + ${a}/x) / (1/x), a 0/0 form`), tx(`L'Hôpital: ${b}·${a} = ${p}`, `L'Hôpital gives ${b}·${a} = ${p}`), `L = ${e(p)}`], rng);
    return chk(q, { t: 'limit', f: (x) => Math.pow(1 + a / x, b * x), at: Infinity, tol: 1e-3, expParse: true });
  }

  // --- Newton ---
  function newtonCubic(rng) {
    const k = rng.nextInt(1, 4); let n; do { n = rng.nextInt(2, 21); } while (n === k * k * k);
    const x1 = (2 * k * k * k + n) / (3 * k * k);
    const f = (x) => x * x * x - n;
    const q = mk(T.newt(), tx(`f(x) = x³ − ${n} için x₀ = ${k} alınırsa Newton yönteminin x₁ değeri kaçtır?`, `For f(x) = x³ − ${n} with x₀ = ${k}, what is x₁ after one step of Newton's method?`),
      frac(2 * k * k * k + n, 3 * k * k), [[frac(k * k * k - n, 3 * k * k), tx('Yalnızca f(x₀)/f\'(x₀) oranını verdin; x₀\'ı çıkarmadın.', 'You gave only f(x₀)/f\'(x₀) instead of x₀ minus it.')], [frac(2 * k * k * k + n, 3 * k), tx('f\'(x) = 3x² yerine 3x kullandın.', 'You used 3x instead of f\'(x) = 3x².')], [frac(3 * k * k * k - n, 3 * k * k), tx('Ortak paydada −(x₀³ − n) açılırken n değerinin işaretini ters aldın.', 'Expanding −(x₀³ − n) over the common denominator, you flipped the sign of n.')], [frac(k * k * k + n, 3 * k * k), tx('Ortak paydada x₀ terimini 3x₀³ yerine x₀³ yazdın.', 'Over the common denominator you wrote x₀³ instead of 3x₀³.')], [frac(2 * k * k * k - n, 3 * k * k), tx('−(x₀³ − n) açılımını −x₀³ − n yaptın; doğrusu −x₀³ + n.', 'You expanded −(x₀³ − n) as −x₀³ − n; it is −x₀³ + n.')]],
      ['x₁ = x₀ − f(x₀)/f\'(x₀),  f\'(x) = 3x²', `f(${k}) = ${k * k * k - n},  f'(${k}) = ${3 * k * k}`, `x₁ = ${k} − (${k * k * k - n})/${3 * k * k} = ${frac(2 * k * k * k + n, 3 * k * k)}`], rng);
    return chk(q, { t: 'newton', f, df: (x) => 3 * x * x, x0: k, steps: 1 });
  }

  function newton2(rng) {
    const n = rng.pick([2, 3, 5, 6, 7]), k = rng.nextInt(1, 4);
    const P1 = k * k + n, Q1 = 2 * k;
    const x1 = P1 / Q1, f = (x) => x * x - n;
    const P2 = P1 * P1 + n * Q1 * Q1, Q2 = 2 * P1 * Q1;
    const q = mk(T.newt(), tx(`f(x) = x² − ${n} ve x₀ = ${k} için Newton yöntemiyle x₂ değeri kaçtır?`, `For f(x) = x² − ${n} with x₀ = ${k}, what is x₂ from Newton's method?`),
      frac(P2, Q2), [[frac(P1, Q1), tx('Yalnızca bir adım yaptın (x₁).', 'You did only one step (x₁).')], [frac(P1 * P1 + n * Q1 * Q1, P1 * Q1), tx('İkinci adımda paydadaki 2 çarpanını unuttun (f\'(x₁) = 2x₁).', 'In step two you dropped the factor 2 in f\'(x₁) = 2x₁.')], [frac(P1 * P1 - n * Q1 * Q1, 2 * P1 * Q1), tx('x₁ − f(x₁)/f\'(x₁) yerine yalnızca f(x₁)/f\'(x₁) değerini verdin.', 'You gave only f(x₁)/f\'(x₁) instead of x₁ − f(x₁)/f\'(x₁).')], [frac(k * k + n + 2 * k, 2 * k), tx('İkinci adımda x₀\'ı yeniden kullandın.', 'You reused x₀ in step two.')], [frac(P2 + 1, Q2), tx('Pay hesabında küçük bir hata.', 'A small slip in the numerator.')]],
      [`x₁ = ${k} − (${k * k} − ${n})/${2 * k} = ${frac(P1, Q1)}`, `x₂ = x₁ − (x₁² − ${n})/(2x₁) = (x₁² + ${n})/(2x₁)`, `x₂ = ${frac(P2, Q2)}`], rng);
    return chk(q, { t: 'newton', f, df: (x) => 2 * x, x0: k, steps: 2 });
  }

  // --- linearization / differentials ---
  function linCbrt(rng) {
    const r = rng.pick([2, 3, 4]), a = r * r * r, d = rng.pick([1, 2, -1, -2]);
    const ans = frac(3 * r * r * r + d, 3 * r * r);
    const q = mk(T.lin(), tx(`Lineerleştirme ile ∛${a + d} değerini yaklaşık hesaplayın (f(x) = ∛x, a = ${a}).`, `Use linearization to approximate ∛${a + d} (f(x) = ∛x, a = ${a}).`),
      ans, [[frac(3 * r + d, 3 * r), tx('f\'(a) = 1/(3a^(2/3)) yerine 1/(3∛a) kullandın.', 'You used 1/(3∛a) instead of f\'(a) = 1/(3·a^(2/3)).')], [frac(r + d, 1), tx('Eğimi 1 aldın.', 'You used slope 1.')], [frac(3 * r + d, 3), tx('Eğimi 1/3 aldın; f\'(a) = 1/(3r²).', 'You used slope 1/3; f\'(a) = 1/(3r²).')], [frac(3 * r * r * r - d, 3 * r * r), tx('Düzeltme teriminin işaretini ters aldın.', 'You reversed the sign of the correction.')], [frac(r * r + d, r * r), tx('Eğimi 1/r² aldın (3 çarpanı eksik).', 'The factor 3 is missing from the slope.')]],
      ['L(x) = f(a) + f\'(a)(x − a),  f\'(x) = 1/(3x^(2/3))', `f(${a}) = ${r},  f'(${a}) = 1/${3 * r * r}`, `L(${a + d}) = ${r} + ${d}/${3 * r * r} = ${ans}`], rng);
    return chk(q, { t: 'approx', truth: Math.cbrt(a + d), tol: 0.03 });
  }

  function linExpLn(rng) {
    const d = rng.pick([1, 2, 3, 4, 5]), kind = rng.nextInt(0, 2);
    const dd = d / 100;
    if (kind === 0) {
      const q = mk(T.lin(), tx(`a = 0 noktasında lineerleştirme kullanarak e^${num(dd)} değerini yaklaşık hesaplayın.`, `Use linearization at a = 0 to approximate e^${num(dd)}.`),
        num(1 + dd), [[num(dd), tx('Sabit terim f(0) = 1\'i unuttun.', 'You forgot the constant f(0) = 1.')], [num(1 - dd), tx('Düzeltme işaretini ters aldın.', 'You reversed the sign of the correction.')], [num(1 + 2 * dd), tx('Eğimi 2 aldın; f\'(0) = e⁰ = 1.', 'You used slope 2; f\'(0) = e⁰ = 1.')], [num(1 + dd * dd / 2 + dd), tx('İkinci mertebe terimi ekledin; lineerleştirme birinci mertebedir.', 'You added a second-order term; linearization is first order.')]],
        ['L(x) = f(0) + f\'(0)x = 1 + x', `L(${num(dd)}) = 1 + ${num(dd)} = ${num(1 + dd)}`], rng);
      return chk(q, { t: 'approx', truth: Math.exp(dd), tol: 0.003 });
    }
    const q = mk(T.lin(), tx(`a = 1 noktasında lineerleştirme kullanarak ln(${num(1 + dd)}) değerini yaklaşık hesaplayın.`, `Use linearization at a = 1 to approximate ln(${num(1 + dd)}).`),
      num(dd), [[num(1 + dd), tx('f(1) = ln 1 = 0; sabit terim 0\'dır, 1 değil.', 'f(1) = ln 1 = 0, so the constant is 0, not 1.')], [num(-dd), tx('İşaret hatası.', 'Sign slip.')], [num(2 * dd), tx('Eğimi 2 aldın; f\'(1) = 1/1 = 1.', 'You used slope 2; f\'(1) = 1.')], [num(dd * dd), tx('x − a farkını kareledin.', 'You squared the difference x − a.')]],
      ['L(x) = f(1) + f\'(1)(x − 1) = 0 + 1·(x − 1)', `L(${num(1 + dd)}) = ${num(dd)}`], rng);
    return chk(q, { t: 'approx', truth: Math.log(1 + dd), tol: 0.003 });
  }

  function diffDy(rng) {
    const p = rng.nextInt(-4, 5), x0 = rng.nextInt(1, 5), dx = rng.pick([0.1, 0.2, 0.5, 0.05]);
    const ans = num((2 * x0 + p) * dx);
    const q = mk(T.lin(), tx(`y = x² ${plus(p)}x için x = ${x0} ve dx = ${dx} iken dy diferansiyeli kaçtır?`, `For y = x² ${plus(p)}x with x = ${x0} and dx = ${dx}, what is the differential dy?`).replace(/\+ 0x/, ''),
      ans, [[num(2 * x0 + p), tx('dx ile çarpmayı unuttun.', 'You forgot to multiply by dx.')], [num(2 * x0 * dx), tx('Türevde doğrusal terimin katkısını unuttun.', 'You dropped the contribution of the linear term.')], [num(((x0 + dx) * (x0 + dx) + p * (x0 + dx)) - (x0 * x0 + p * x0)), tx('Bu, gerçek değişim Δy; diferansiyel dy = f\'(x)dx idi.', 'That is the actual change Δy; the differential is dy = f\'(x)dx.')], [num((x0 * x0 + p * x0) * dx), tx('f(x)·dx hesapladın; f\'(x)·dx olmalı.', 'You computed f(x)·dx; it should be f\'(x)·dx.')], [num((2 * x0 - p) * dx), tx('Türevde işaret hatası.', 'Sign slip in the derivative.')], [num(Number(ans) + dx), tx('Küçük bir toplama hatası.', 'A small addition slip.')], [num(Number(ans) * 2), tx('Katsayıyı iki katına çıkardın.', 'You doubled the result.')], [num(Number(ans) + 2 * dx), tx('Küçük bir toplama hatası.', 'A small addition slip.')]],
      [`dy = f'(x)dx = (2x ${plus(p)})dx`, `dy = (${2 * x0} ${plus(p)})·${dx} = ${ans}`], rng);
    return chk(q, { t: 'approx', truth: (2 * x0 + p) * dx, tol: 1e-9 });
  }

  function diffCube(rng) {
    const s = rng.nextInt(4, 13), ds = rng.pick([0.1, 0.2, 0.5]);
    const ans = num(3 * s * s * ds);
    const q = mk(T.lin(), tx(`Kenarı ${s} cm ölçülen bir küpün ölçümünde ±${ds} cm hata vardır. Diferansiyel kullanarak hacimdeki yaklaşık hata kaç cm³'tür?`, `The edge of a cube is measured as ${s} cm with an error of ±${ds} cm. Use differentials to estimate the error in the volume, in cm³.`),
      ans, [[num(3 * s * ds), tx('V = s³ türevinde 3s yazdın; 3s² olmalı.', 'You wrote 3s for the derivative of s³; it is 3s².')], [num(s * s * ds), tx('Türevde 3 çarpanını unuttun.', 'You lost the factor 3.')], [num(3 * s * s), tx('ds ile çarpmayı unuttun.', 'You forgot to multiply by ds.')], [num(s * s * s * ds), tx('V\'yi ds ile çarptın; dV = V\'(s)ds olmalı.', 'You multiplied V by ds; dV = V\'(s)ds.')], [num(6 * s * ds), tx('V = s³ yerine yüzey alanı türevi (6s) kullandın.', 'You used the derivative of the surface area (6s).')]],
      ['V = s³  →  dV = 3s² ds', `dV = 3·${s}²·${ds} = ${ans}`], rng, null, 'cm³');
    return chk(q, { t: 'approx', truth: 3 * s * s * ds, tol: 1e-9 });
  }

  // --- curve sketching facts ---
  function csAsymptotes(rng) {
    let a, b, c;
    do { a = nz(rng, -4, 4); b = rng.nextInt(-5, 6); c = nz(rng, -4, 4); } while (a * c + b === 0);
    const correct = `x = ${c}, y = ${a}`;
    const q = mk(T.sk(), tx(`f(x) = (${polyStr(b, a)}) / (${xs(c)}) fonksiyonunun düşey ve yatay asimptotları nelerdir?`, `What are the vertical and horizontal asymptotes of f(x) = (${polyStr(b, a)}) / (${xs(c)})?`),
      correct, [[`x = ${-c}, y = ${a}`, tx('Düşey asimptot paydanın kökündedir: x − c = 0 ⇒ x = c.', 'The vertical asymptote is at the root of the denominator: x − c = 0 gives x = c.')], [`x = ${a}, y = ${c}`, tx('Düşey ve yatay asimptotu karıştırdın.', 'You swapped vertical and horizontal.')], [`x = ${c}, y = ${b}`, tx('Yatay asimptot baş katsayıların oranıdır, sabit terim değil.', 'The horizontal asymptote is the ratio of leading coefficients, not the constant.')], [`x = ${c}, y = ${-a}`, tx('Yatay asimptotun işaretini ters aldın.', 'You flipped the sign of the horizontal asymptote.')], [`x = ${c}, y = 0`, tx('Dereceler eşit olduğundan yatay asimptot 0 değildir.', 'With equal degrees the horizontal asymptote is not 0.')]],
      [tx(`Payda 0: x = ${c} (pay ≠ 0 ⇒ düşey asimptot)`, `Denominator 0: x = ${c} (numerator ≠ 0 ⇒ vertical asymptote)`), tx(`x → ±∞: f → ${a}/1 = ${a}`, `x → ±∞: f → ${a}/1 = ${a}`), correct], rng);
    return chk(q, { t: 'asym', f: (x) => (a * x + b) / (x - c), a, c });
  }

  function csSymmetry(rng) {
    const kind = rng.nextInt(0, 3), a = nz(rng, -4, 4), b = nz(rng, -4, 4), c = nz(rng, -4, 4);
    const EV = tx('Çift fonksiyon (y eksenine göre simetrik)', 'Even (symmetric about the y-axis)'), OD = tx('Tek fonksiyon (orijine göre simetrik)', 'Odd (symmetric about the origin)'), NE = tx('Ne çift ne tek', 'Neither even nor odd'), BO = tx('Hem çift hem tek', 'Both even and odd');
    let expr, ans, why;
    if (kind === 0) { expr = polyStr(c, 0, b, 0, a); ans = EV; why = tx('f(−x) = f(x): yalnız çift kuvvetler.', 'f(−x) = f(x): only even powers.'); }
    else if (kind === 1) { expr = polyStr(0, b, 0, a); ans = OD; why = tx('f(−x) = −f(x): yalnız tek kuvvetler.', 'f(−x) = −f(x): only odd powers.'); }
    else { expr = polyStr(c, b, a); ans = NE; why = tx('Hem tek hem çift kuvvetli terim var: f(−x) ne f(x) ne −f(x).', 'It has both odd and even powers: f(−x) is neither f(x) nor −f(x).'); }
    const wrongs = [EV, OD, NE, BO].filter((o) => o !== ans).map((o) => [o, o === BO ? tx('Yalnız f(x) = 0 hem çift hem tektir.', 'Only f(x) = 0 is both even and odd.') : tx('f(−x) ifadesini hesaplayıp f(x) ile karşılaştır.', 'Compute f(−x) and compare with f(x).')]);
    const q = mk(T.sk(), tx(`f(x) = ${expr} fonksiyonunun simetrisi hakkında ne söylenebilir?`, `What can be said about the symmetry of f(x) = ${expr}?`), ans, wrongs,
      [tx(`f(−x) = ${expr.replace(/x/g, '(−x)')}`, `f(−x) = ${expr.replace(/x/g, '(−x)')}`), why, ans], rng);
    return chk(q, { t: 'sym', f: kind === 0 ? (x) => a * x ** 4 + b * x * x + c : kind === 1 ? (x) => a * x ** 3 + b * x : (x) => a * x * x + b * x + c, kind });
  }

  function csIntercepts(rng) {
    const a = rng.nextInt(1, 5); let c; do { c = nz(rng, -4, 4); } while (Math.abs(c) === a);
    const yi = frac(-a * a, -c);
    const correct = tx(`x-kesişimleri: x = ±${a}; düşey asimptot: x = ${c}`, `x-intercepts: x = ±${a}; vertical asymptote: x = ${c}`);
    const q = mk(T.sk(), tx(`f(x) = (x² − ${a * a}) / (${xs(c)}) fonksiyonunun x-kesişimleri ve düşey asimptotu hangisidir?`, `Which lists the x-intercepts and the vertical asymptote of f(x) = (x² − ${a * a}) / (${xs(c)})?`),
      correct, [[tx(`x-kesişimleri: x = ±${a}; düşey asimptot: x = ${-c}`, `x-intercepts: x = ±${a}; vertical asymptote: x = ${-c}`), tx('Payda x − c = 0 ⇒ x = c; işareti ters aldın.', 'Denominator x − c = 0 gives x = c; you flipped the sign.')],
        [tx(`x-kesişimleri: x = ${c}; düşey asimptot: x = ±${a}`, `x-intercepts: x = ${c}; vertical asymptote: x = ±${a}`), tx('Pay ve paydanın rollerini karıştırdın.', 'You swapped the roles of numerator and denominator.')],
        [tx(`x-kesişimleri: x = ${a * a}; düşey asimptot: x = ${c}`, `x-intercepts: x = ${a * a}; vertical asymptote: x = ${c}`), tx('x² = ' + a * a + ' denkleminde karekökü unuttun.', 'You forgot the square root in x² = ' + a * a + '.')],
        [tx(`x-kesişimleri: x = ${a}; düşey asimptot: x = ${c}`, `x-intercepts: x = ${a}; vertical asymptote: x = ${c}`), tx('Yalnızca pozitif kökü aldın.', 'You kept only the positive root.')]],
      [tx(`Pay = 0: x² = ${a * a} ⇒ x = ±${a} (payda ≠ 0)`, `Numerator = 0: x² = ${a * a} ⇒ x = ±${a} (denominator ≠ 0)`), tx(`Payda = 0: x = ${c} (pay ≠ 0) ⇒ düşey asimptot`, `Denominator = 0: x = ${c} (numerator ≠ 0) ⇒ vertical asymptote`), tx(`y-kesişimi: f(0) = ${yi}`, `y-intercept: f(0) = ${yi}`)], rng);
    return chk(q, { t: 'icpt', f: (x) => (x * x - a * a) / (x - c), a, c });
  }

  function csOblique(rng) {
    const c = nz(rng, -3, 3), b = rng.nextInt(-4, 5), d = rng.nextInt(1, 6);
    const m = b + c, ya = `y = x ${plus(m)}`.replace(' + 0', '').replace(/ - 0$/, ''), correct = `x = ${c}, ${m === 0 ? 'y = x' : ya}`;
    const mk2 = (cc, mm) => `x = ${cc}, ${mm === 0 ? 'y = x' : 'y = x ' + plus(mm)}`;
    const R = c * c + b * c + d;
    const f = (x) => (x * x + b * x + d) / (x - c);
    const q = mk(T.sk(), tx(`f(x) = (${polyStr(d, b, 1)}) / (${xs(c)}) fonksiyonunun düşey ve eğik asimptotları nelerdir?`, `What are the vertical and oblique asymptotes of f(x) = (${polyStr(d, b, 1)}) / (${xs(c)})?`),
      correct, [[mk2(c, b - c), tx('Bölmede sentetik bölme işaretini yanlış kullandın (x − c için kök +c).', 'You used the wrong sign in synthetic division (root +c for x − c).')], [mk2(c, b), tx('Bölümün sabit terimi b + c; yalnızca b aldın.', 'The quotient constant is b + c; you used b only.')], [mk2(-c, m), tx('Düşey asimptot x = c; işareti ters aldın.', 'The vertical asymptote is x = c; you flipped the sign.')], [mk2(c, m + R), tx('Kalanı bölüme ekledin; kalan terim 0\'a gider.', 'You added the remainder to the quotient; the remainder term vanishes.')], [mk2(c, -m), tx('Bölümün işaretini ters aldın.', 'You flipped the sign of the quotient constant.')]],
      [tx(`Bölme: x² ${plus(b)}x ${plus(d)} = (${xs(c)})(x ${plus(m)}) ${plus(R)}`, `Division: x² ${plus(b)}x ${plus(d)} = (${xs(c)})(x ${plus(m)}) ${plus(R)}`), tx(`f(x) = x ${plus(m)} + ${R}/(${xs(c)}) ⇒ eğik asimptot ${m === 0 ? 'y = x' : 'y = x ' + plus(m)}`, `f(x) = x ${plus(m)} + ${R}/(${xs(c)}) ⇒ oblique asymptote ${m === 0 ? 'y = x' : 'y = x ' + plus(m)}`), tx(`Düşey asimptot: x = ${c}${R === 0 ? ' (pay sadeleşir mi kontrol et)' : ''}`, `Vertical asymptote: x = ${c}${R === 0 ? ' (check cancellation)' : ''}`)], rng);
    if (R === 0) return csOblique(rng);
    return chk(q, { t: 'oblique', f, m: 1, n: m });
  }

  // =====================================================================================================
  // Levels, lists, registration
  // =====================================================================================================

  const L1 = [apCritical, apMonotone, apMinValue, apInflection, apRect, apRates, apNewton, apLinear, apMvt,
    optSumProduct, mvtApplies, csAsymptotes, csSymmetry, lhSin, diffDy];
  const L2 = [apSum, apLHopital, apSecondTest, exQuad, incDecCubic, grFprime, localClassify, rolleK, mvtCubic, mvtSqrt,
    concQuartic, inflPoint, relSolids, optWall, optProfitQty, lhInfInf, newtonCubic, linCbrt, linExpLn, diffCube, csIntercepts, csOblique];
  const L3 = [exCubicMax, exCubicMin, exCubicArg, incDecDouble, localFirst, inflCount, optBox, optCan, optDistance, optProfitMax,
    relLadder, relCars, relCone, lhRepeated, lhRewrite, lhOneInf, newton2];
  L1.forEach((g) => { g.level = 1; });
  L2.forEach((g) => { g.level = 2; });
  L3.forEach((g) => { g.level = 3; });

  // Regular 10-question quiz: the 12 ported VB generators plus a couple of new ones for uncovered topics.
  const GENERATORS = [
    apCritical, apMonotone, apMinValue, apInflection, apRect, apSum, apRates, apLHopital, apNewton, apLinear, apMvt, apSecondTest,
    exQuad, csAsymptotes, mvtCubic,
  ];
  const EXTRA = L1.concat(L2, L3).filter((g) => GENERATORS.indexOf(g) < 0);

  Topics.register('applications', {
    type: 'quiz',
    tabTitle: () => tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  window.ExamPools = window.ExamPools || {};
  window.ExamPools.applications = GENERATORS.concat(EXTRA);
})();
