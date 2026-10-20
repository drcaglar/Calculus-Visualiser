// Derivatives quiz bank. Ports Modules/Preliminaries/QuizBankPart2.vb (module QuizBankDerivatives, 13 generators)
// and adds many exam-only generators (window.ExamPools.derivatives) for the printable exam sets.
// Every generator carries a numeric `.level` (1 easy, 2 medium, 3 hard). Questions also carry a non-enumerable
// `_v` verification spec (used only by the offline test harness, never by the UI).
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
  const par = (v) => (v < 0 ? `(${v})` : String(v));
  const cf = (n) => (n === 1 ? '' : n === -1 ? '-' : String(n));
  const sup = (n) => ('⁰¹²³⁴⁵⁶⁷⁸⁹'[n] !== undefined && n >= 0 && n <= 9 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[n] : `^${n}`);
  const ipow = (b, n) => { let r = 1; for (let i = 0; i < n; i++) r *= b; return r; };
  // coefficient * body ("body" may start with '-'): ct(3,'sin(x)') = '3sin(x)', ct(-1,'x') = '-x'
  const ct = (k, body) => {
    if (body[0] === '-') { k = -k; body = body.slice(1); }
    if (k === 0) return '0';
    if (k === 1) return body;
    if (k === -1) return '-' + body;
    return /^[0-9]/.test(body) ? `${k}·${body}` : `${k}${body}`;
  };
  // joins signed terms: ['3x','-2','x²'] -> '3x - 2 + x²'
  const sumS = (parts) => {
    parts = parts.filter((p) => p !== '' && p !== '0');
    if (!parts.length) return '0';
    let s = parts[0];
    for (let i = 1; i < parts.length; i++) s += parts[i][0] === '-' ? ` - ${parts[i].slice(1)}` : ` + ${parts[i]}`;
    return s;
  };
  const xp = (n) => (n === 0 ? '1' : n === 1 ? 'x' : 'x' + sup(n));
  const pc = (k, n) => (n === 0 ? String(k) : ct(k, xp(n)));
  const ax = (k) => (k === 1 ? 'x' : k === -1 ? '-x' : `${k}x`);
  const ex = (k) => (k === 1 ? 'e^x' : `e^(${ax(k)})`);
  const pw = (name, n, arg) => (n === 1 ? `${name}(${arg})` : `${name}${sup(n)}(${arg})`);
  // polynomial from LOW-order coefficients: polyStr(c0, c1, c2) = c2 x^2 + c1 x + c0
  const polyStr = (...c) => {
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
  const evalPoly = (x, ...c) => { let r = 0; for (let d = c.length - 1; d >= 0; d--) r = r * x + c[d]; return r; };
  const tvar = (s) => s.replace(/x/g, 't');
  const lineStr = (m, b) => {
    const mp = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
    return b === 0 ? `y = ${mp}` : `y = ${mp} ${plus(b)}`;
  };
  const lin2 = (A, B, C) => `${sumS([A ? ct(A, 'x') : '', B ? ct(B, 'y') : ''])} = ${C}`;
  // standard form Ax + By = C, reduced, first coefficient positive
  const std = (A, B, C) => {
    const g = gcd(gcd(A, B), C); A /= g; B /= g; C /= g;
    if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; C = -C; }
    return lin2(A, B, C);
  };
  const dif = (a, b) => (b === 0 ? String(a) : `${a} ${plus(-b)}`);
  const and2 = (v, a, b) => `${v} = ${a} ${tx('ve', 'and')} ${v} = ${b}`;

  const FILL_NOTES = () => [
    tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'),
    tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'),
  ];
  // "x - -3" -> "x + 3", "x + -3" -> "x - 3"
  const fixS = (s) => (typeof s === 'string' ? s.replace(/([+−-]) -(?=\d)/g, (m, sg) => (sg === '+' ? '- ' : '+ ')) : s);
  function mk(topic, text, correct, pairs, sol, rng, plot) {
    text = fixS(text); correct = fixS(correct); sol = sol.map(fixS);
    pairs = pairs.map((p) => [fixS(p[0]), p[1]]);
    const wrongs = pairs.map((p) => p[0]);
    const notes = pairs.map((p) => p[1]);
    if (/^-?\d+$/.test(correct)) {
      const c = parseInt(correct, 10);
      const fn = FILL_NOTES();
      [1, -1, 2, -2, 3, -3].forEach((d, i) => { wrongs.push(String(c + d)); notes.push(fn[i]); });
    }
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
    for (let i = 0; i <= 40; i++) { const v = f(x0 + (x1 - x0) * i / 40); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    (extra || []).forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    if (!isFinite(lo)) { lo = -5; hi = 5; }
    return [lo - 1.5, hi + 1.5];
  };
  const circlePlot = (r, x, y) => {
    const p = new PlotSpec(-1.3 * r, 1.3 * r, -1.3 * r, 1.3 * r);
    p.addCurve((t) => Math.sqrt(r * r - t * t)).addCurve((t) => -Math.sqrt(r * r - t * t)).addPoint(x, y, 'P');
    return p;
  };

  const T = {
    def: () => tx('Türevin limit tanımı', 'Limit definition of the derivative'),
    tan: () => tx('Teğet ve normal doğrusu', 'Tangent and normal lines'),
    rate: () => tx('Ortalama ve anlık değişim hızı', 'Average and instantaneous rate of change'),
    pow: () => tx('Kuvvet, sabit ve toplam kuralları', 'Power, constant and sum rules'),
    prod: () => tx('Çarpım kuralı', 'Product rule'),
    quo: () => tx('Bölüm kuralı', 'Quotient rule'),
    chain: () => tx('Zincir kuralı', 'Chain rule'),
    trig: () => tx('Trigonometrik fonksiyonların türevi', 'Derivatives of trigonometric functions'),
    exp: () => tx('Üstel ve logaritmik türevler', 'Exponential and logarithmic derivatives'),
    imp: () => tx('Kapalı türev', 'Implicit differentiation'),
    high: () => tx('Yüksek mertebeden türev ve hareket', 'Higher-order derivatives and motion'),
    hor: () => tx('Yatay teğet ve kritik noktalar', 'Horizontal tangents and critical points'),
    dif: () => tx('Türevlenebilirlik', 'Differentiability'),
    gr: () => tx('Grafikten türev', 'Derivatives from graphs'),
  };

  // =====================================================================================================
  // LEVEL 1 (and ported VB generators)
  // =====================================================================================================

  // VB DvPolyExpr
  function dvPolyExpr(rng) {
    const a = nz(rng, -3, 3), b = nz(rng, -4, 4), c = nz(rng, -5, 5), d = nz(rng, -5, 5);
    const dp = (...cc) => `f'(x) = ${polyStr(...cc)}`;
    const q = mk(T.pow(),
      tx(`f(x) = ${polyStr(d, c, b, a)} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${polyStr(d, c, b, a)}?`),
      dp(c, 2 * b, 3 * a),
      [[dp(c, 2 * b, a), tx('x³ teriminde üssü indirdin ama 3 ile çarpmayı unuttun (ax³ → ax²).', 'You lowered the exponent of the x³ term but forgot to multiply by 3.')],
        [dp(c, b, 3 * a), tx('x² teriminin türevinde üssü çarpan olarak 2 ile çarpmayı unuttun.', 'For the x² term you forgot to multiply by the exponent 2.')],
        [dp(0, c, 2 * b, 3 * a), tx('Üsleri bir azaltmadın; katsayılar doğru ama üsler hâlâ eski.', 'You did not lower the exponents by one; the coefficients are right but the powers are still the old ones.')],
        [dp(c + d, 2 * b, 3 * a), tx('Sabitin türevi 0\'dır; sabit terimi türeve eklemişsin.', 'The derivative of a constant is 0; you carried the constant term into the derivative.')]],
      [tx('(xⁿ)\' = n·xⁿ⁻¹ ve sabitin türevi 0.', '(xⁿ)\' = n·xⁿ⁻¹ and the derivative of a constant is 0.'),
        `(${ct(a, 'x³')})' = ${ct(3 * a, 'x²')},  (${ct(b, 'x²')})' = ${ct(2 * b, 'x')},  (${ct(c, 'x')})' = ${c},  (${d})' = 0`,
        dp(c, 2 * b, 3 * a)], rng);
    return chk(q, { t: 'expr', f: (x) => evalPoly(x, d, c, b, a), xs: [-1.3, 0.6, 1.7] });
  }

  // VB DvPolyAt
  function dvPolyAt(rng) {
    const a = nz(rng, -3, 3), b = rng.nextInt(-4, 5), c = rng.nextInt(-5, 6), d = rng.nextInt(-5, 6), k = rng.nextInt(-3, 4);
    const f = (x) => evalPoly(x, d, c, b, a);
    const ans = 3 * a * k * k + 2 * b * k + c;
    const [lo, hi] = rangeY(f, -4, 4, [f(k)]);
    const q = mk(T.pow(),
      tx(`f(x) = ${polyStr(d, c, b, a)} ise f'(${k}) kaçtır?`, `If f(x) = ${polyStr(d, c, b, a)}, what is f'(${k})?`), String(ans),
      [[String(f(k)), tx(`f(${k}) değerini hesapladın; önce türev almayı unuttun.`, `You evaluated f(${k}) itself and skipped differentiating first.`)],
        [String(6 * a * k + 2 * b), tx('İkinci türevi aldın (6ax + 2b) ve onu hesapladın.', 'You differentiated twice (second derivative) and evaluated that.')],
        [String(3 * a * k * k + b * k + c), tx('x² teriminin türevinde üssü çarpan olarak 2 ile çarpmayı unuttun (bx² → bx).', 'For the x² term you forgot to multiply by the exponent 2 (bx² became bx).')]],
      [`f'(x) = ${polyStr(c, 2 * b, 3 * a)}`, `f'(${k}) = ${ans}`], rng,
      new PlotSpec(-4, 4, lo, hi).addCurve(f).addPoint(k, f(k)));
    return chk(q, { t: 'val', f, x: k, ord: 1, ans: String(ans) });
  }

  // VB DvDefinition
  function dvDefinition(rng) {
    const a = nz(rng, -4, 4);
    if (rng.nextInt(0, 2) === 0) {
      const q = mk(T.def(), tx(`lim(h→0) [(${a} + h)² - ${par(a)}²] / h limiti kaçtır?`, `What is lim(h→0) [(${a} + h)² - ${par(a)}²] / h?`), String(2 * a),
        [[String(a), tx('Üssü indirirken 2 ile çarpmayı unuttun; a yazdın.', 'You forgot the factor 2 when lowering the exponent and wrote a.')],
          [String(a * a), tx('Limit yerine f(a) = a² değerini verdin.', 'You gave f(a) = a² instead of the limit.')],
          ['0', tx('h = 0 koyup 0 buldun; 0/0 belirsizliği, önce açıp h\'yi sadeleştirmelisin.', 'You put h = 0 and got 0; it is a 0/0 form, so expand and cancel h first.')]],
        [tx('Bu, f(x) = x² için f\'(a) tanımıdır.', 'This is the definition of f\'(a) for f(x) = x².'), `f'(x) = 2x  →  f'(${a}) = ${2 * a}`], rng);
      return chk(q, { t: 'lim', g: (h) => ((a + h) ** 2 - a * a) / h, ans: String(2 * a) });
    }
    const q = mk(T.def(), tx(`lim(h→0) [(${a} + h)³ - (${a})³] / h limiti kaçtır?`, `What is lim(h→0) [(${a} + h)³ - (${a})³] / h?`), String(3 * a * a),
      [[String(3 * a), tx('x³ türevini 3x olarak aldın; üssü doğru indirmedin.', 'You differentiated x³ as 3x; the exponent was not lowered correctly.')],
        [String(a * a * a), tx('Limit yerine f(a) = a³ değerini verdin.', 'You gave f(a) = a³ instead of the limit.')],
        ['0', tx('h = 0 koyup 0 buldun; 0/0 belirsizliği, önce açıp h\'yi sadeleştirmelisin.', 'You put h = 0 and got 0; it is a 0/0 form, so expand and cancel h first.')]],
      [tx('Bu, f(x) = x³ için f\'(a) tanımıdır.', 'This is the definition of f\'(a) for f(x) = x³.'), `f'(x) = 3x²  →  f'(${a}) = ${3 * a * a}`], rng);
    return chk(q, { t: 'lim', g: (h) => ((a + h) ** 3 - a ** 3) / h, ans: String(3 * a * a) });
  }

  // VB DvTangent
  function dvTangentParab(rng) {
    const a = nz(rng, -4, 4);
    const f = (x) => x * x;
    const q = mk(T.tan(), tx(`y = x² eğrisine x = ${a} noktasında çizilen teğetin denklemi hangisidir?`, `Which is the equation of the tangent to the curve y = x² at x = ${a}?`), lineStr(2 * a, -a * a),
      [[lineStr(a, -a * a), tx(`Eğim olarak 2a yerine x-koordinatı ${a} değerini aldın; eğim y' = 2x'tir.`, `You used the x-value ${a} as the slope instead of y' = 2x at that point.`)],
        [lineStr(2 * a, a * a), tx('Eğim doğru ama y-kesenin işareti yanlış; b = y₀ - m·x₀ hesaplanmalı.', 'The slope is right but the intercept has the wrong sign; it should be y₀ - m·x₀.')],
        [lineStr(2 * a, -a), tx('y-keseni olarak -x₀ aldın; kesen b = y₀ - m·x₀ ile bulunur.', 'You used -x₀ as the intercept; it is found from b = y₀ - m·x₀.')],
        [lineStr(2 * a, a), tx('y-keseni olarak x₀ aldın; kesen b = y₀ - m·x₀ ile bulunur.', 'You used x₀ as the intercept; it is found from b = y₀ - m·x₀.')],
        [lineStr(2 * a, -2 * a * a), tx('y = m(x - x₀) yazıp + y₀ terimini eklemeyi unuttun.', 'You wrote y = m(x - x₀) but forgot to add the + y₀ term.')],
        [lineStr(2 * a, -a * a + 1), tx('Eğim doğru, ama kesende 1\'lik bir hesap hatası var.', 'The slope is right, but there is an off-by-one slip in the intercept.')]],
      [tx(`Eğim: y' = 2x → m = ${2 * a}`, `Slope: y' = 2x → m = ${2 * a}`), tx(`Nokta: (${a}, ${a * a})`, `Point: (${a}, ${a * a})`),
        `y - ${a * a} = ${2 * a}(x - ${par(a)})  →  ${lineStr(2 * a, -a * a)}`], rng,
      new PlotSpec(-5, 5, -2, 26).addCurve(f).addPoint(a, a * a));
    return chk(q, { t: 'line', f, k: a, ans: lineStr(2 * a, -a * a) });
  }

  // VB DvAvgRate
  function dvAvgRate(rng) {
    const p = nz(rng, -3, 3), q0 = rng.nextInt(-4, 5), a = rng.nextInt(0, 3), b = a + rng.nextInt(1, 4);
    const f = (x) => p * x * x + q0 * x;
    const ans = p * (a + b) + q0;
    const [lo, hi] = rangeY(f, -0.5, b + 1, [f(a), f(b)]);
    const q = mk(T.rate(),
      tx(`s(t) = ${tvar(polyStr(0, q0, p))} için [${a}, ${b}] aralığındaki ortalama değişim hızı kaçtır?`, `For s(t) = ${tvar(polyStr(0, q0, p))}, what is the average rate of change on [${a}, ${b}]?`),
      String(ans),
      [[String(2 * p * b + q0), tx('Sağ uçtaki anlık hızı s\'(b) hesapladın; ortalama hız için (s(b) - s(a))/(b - a) gerekir.', 'You computed the instantaneous rate s\'(b) at the right end instead of the average rate.')],
        [String(2 * p * a + q0), tx('Sol uçtaki anlık hızı s\'(a) hesapladın; ortalama hız bir bölümdür.', 'You computed the instantaneous rate s\'(a) at the left end; an average rate is a difference quotient.')],
        [String(p * (b - a) + q0), tx('(b² - a²)/(b - a) sadeleşmesini yanlış yaptın; p·(b - a) yazdın.', 'You simplified (b² - a²)/(b - a) wrongly and wrote p·(b - a).')]],
      [tx('Ortalama hız = [s(b) - s(a)] / (b - a)', 'Average rate = [s(b) - s(a)] / (b - a)'), `s(${b}) = ${f(b)},  s(${a}) = ${f(a)}`, `(${dif(f(b), f(a))}) / ${b - a} = ${ans}`], rng,
      new PlotSpec(-0.5, b + 1, lo, hi).addCurve(f).addPoint(a, f(a)).addPoint(b, f(b)).addSegment(a, f(a), b, f(b), true));
    return chk(q, { t: 'avg', f, a, b, ans: String(ans) });
  }

  // VB DvInstRate
  function dvInstRate(rng) {
    const p = nz(rng, -3, 3), q0 = rng.nextInt(-4, 5), t0 = rng.nextInt(1, 5);
    const f = (x) => p * x * x + q0 * x;
    const ans = 2 * p * t0 + q0;
    const [lo, hi] = rangeY(f, -0.5, t0 + 2, [f(t0)]);
    const q = mk(T.rate(),
      tx(`s(t) = ${tvar(polyStr(0, q0, p))} konum fonksiyonuna sahip bir cismin t = ${t0} anındaki hızı kaçtır?`, `An object has position function s(t) = ${tvar(polyStr(0, q0, p))}. What is its velocity at t = ${t0}?`),
      String(ans),
      [[String(f(t0)), tx(`Hız yerine konumu s(${t0}) hesapladın; türev almalıydın.`, `You computed the position s(${t0}) rather than the velocity s'(${t0}).`)],
        [String(p * t0 + q0), tx('p·t² teriminin türevinde üssü (2) ile çarpmayı unuttun.', 'You forgot to multiply by the exponent 2 when differentiating p·t².')],
        [String(2 * p), tx('Yalnızca ikinci türevi (ivme) 2p verdin; t ve q terimlerini unuttun.', 'You gave only the second derivative (acceleration) 2p and dropped the t and q terms.')]],
      [tx('Anlık hız = s\'(t)', 'Instantaneous velocity = s\'(t)'), `s'(t) = ${tvar(polyStr(q0, 2 * p))}`, `s'(${t0}) = ${ans}`], rng,
      new PlotSpec(-0.5, t0 + 2, lo, hi).addCurve(f).addPoint(t0, f(t0)));
    return chk(q, { t: 'val', f, x: t0, ord: 1, ans: String(ans) });
  }

  // VB DvTrig
  function dvTrigBasic(rng) {
    const a = nz(rng, -4, 4), b = nz(rng, -4, 4), atZero = rng.nextInt(0, 2) === 0;
    const ans = atZero ? a : -b;
    const where = atZero ? '0' : 'π/2';
    const f = (x) => a * Math.sin(x) + b * Math.cos(x);
    const q = mk(T.trig(),
      tx(`f(x) = ${ct(a, 'sin x')} ${b < 0 ? '-' : '+'} ${ct(Math.abs(b), 'cos x')} ise f'(${where}) kaçtır?`, `If f(x) = ${ct(a, 'sin x')} ${b < 0 ? '-' : '+'} ${ct(Math.abs(b), 'cos x')}, what is f'(${where})?`),
      String(ans),
      [[String(-ans), tx('İşaret hatası: cos x\'in türevinin -sin x olduğunu ve değerleri kontrol et.', 'Sign slip: recheck that (cos x)\' = -sin x and the values of sin and cos there.')],
        [String(a + b), tx('Katsayıları topladın; sin ve cos değerlerini yerine koymadın.', 'You added the coefficients instead of substituting the values of sin and cos.')],
        [String(a * b), tx('Katsayıları çarptın; türevi alıp noktada hesaplaman gerekirdi.', 'You multiplied the coefficients instead of differentiating and evaluating.')]],
      ['(sin x)\' = cos x,  (cos x)\' = -sin x', `f'(x) = ${sumS([ct(a, 'cos x'), ct(-b, 'sin x')])}`,
        `x = ${where}: cos = ${atZero ? 1 : 0}, sin = ${atZero ? 0 : 1}  →  ${ans}`], rng);
    return chk(q, { t: 'val', f, x: atZero ? 0 : Math.PI / 2, ord: 1, ans: String(ans) });
  }

  // VB DvExpLog
  function dvExpLog(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const a = nz(rng, -4, 4);
      const q = mk(T.exp(), tx(`f(x) = e^(${ax(a)}) ise f'(0) kaçtır?`, `If f(x) = e^(${ax(a)}), what is f'(0)?`), String(a),
        [['1', tx('Zincir çarpanı a\'yı unuttun: e^(ax) türevini e^(ax) sandın, e⁰ = 1.', 'You forgot the chain factor a: you took (e^(ax))\' as e^(ax), giving e⁰ = 1.')],
          ['0', tx('e⁰ değerini 0 sandın.', 'You treated e⁰ as 0.')],
          [String(a * a), tx('Zincir çarpanını iki kez uyguladın (a·a).', 'You applied the chain factor twice (a·a).')]],
        ['(e^(ax))\' = a·e^(ax)', `f'(0) = ${a}·e⁰ = ${a}`], rng);
      return chk(q, { t: 'val', f: (x) => Math.exp(a * x), x: 0, ord: 1, ans: String(a) });
    }
    const k = rng.nextInt(2, 8);
    const q = mk(T.exp(), tx(`f(x) = ln x ise f'(${k}) kaçtır?`, `If f(x) = ln x, what is f'(${k})?`), frac(1, k),
      [[frac(-1, k), tx('İşaret hatası: ln x\'in türevi 1/x\'tir, negatif değil.', 'Sign slip: the derivative of ln x is 1/x, not negative.')],
        [String(k), tx(`Kesri ters çevirdin: 1/${k} yerine ${k} yazdın.`, `You inverted the fraction: you wrote ${k} instead of 1/${k}.`)],
        [`ln ${k}`, tx(`Türev yerine f(${k}) = ln ${k} değerini hesapladın.`, `You evaluated f(${k}) = ln ${k} instead of the derivative.`)],
        [frac(1, k * k), tx('1/x\'in türevini almışsın gibi: ln x\'in türevi sadece 1/x\'tir.', 'You mixed this up with differentiating 1/x: the derivative of ln x is simply 1/x.')]],
      ['(ln x)\' = 1/x', `f'(${k}) = 1/${k}`], rng);
    return chk(q, { t: 'val', f: Math.log, x: k, ord: 1, ans: frac(1, k) });
  }

  // new L1: single power term
  function dvBasicPow(rng) {
    const a = nz(rng, -4, 4), n = rng.nextInt(3, 7), c = nz(rng, -5, 5);
    const dp = (s) => `f'(x) = ${s}`;
    const q = mk(T.pow(),
      tx(`f(x) = ${sumS([ct(a, xp(n)), String(c)])} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${sumS([ct(a, xp(n)), String(c)])}?`),
      dp(pc(a * n, n - 1)),
      [[dp(pc(a, n - 1)), tx('Üssü indirdin ama üssü katsayıyla çarpmayı unuttun.', 'You lowered the exponent but forgot to multiply the coefficient by it.')],
        [dp(pc(a * n, n)), tx('Katsayıyı çarptın ama üssü bir azaltmadın.', 'You multiplied by the exponent but did not lower it by one.')],
        [dp(sumS([pc(a * n, n - 1), String(c)])), tx('Sabitin türevi 0\'dır; sabit terimi türeve taşımışsın.', 'The derivative of a constant is 0; you carried the constant into the derivative.')],
        [dp(pc(a * n * (n - 1), n - 2)), tx('Türevi iki kez almışsın (ikinci türev).', 'You differentiated twice (second derivative).')]],
      [tx('Kuvvet kuralı: (axⁿ)\' = a·n·xⁿ⁻¹; sabitin türevi 0.', 'Power rule: (axⁿ)\' = a·n·xⁿ⁻¹; the derivative of a constant is 0.'),
        `(${ct(a, xp(n))})' = ${pc(a * n, n - 1)},  (${c})' = 0`], rng);
    return chk(q, { t: 'expr', f: (x) => a * x ** n + c, xs: [-1.4, 0.7, 1.6] });
  }

  // new L1: tangent slope on a parabola
  function dvTanSlope(rng) {
    const a = nz(rng, -3, 3), b = rng.nextInt(-4, 5), c = rng.nextInt(-4, 5), k = rng.nextInt(-3, 4);
    const f = (x) => a * x * x + b * x + c;
    const m = 2 * a * k + b;
    const [lo, hi] = rangeY(f, -4, 4, [f(k)]);
    const q = mk(T.tan(),
      tx(`y = ${polyStr(c, b, a)} eğrisine (${k}, ${f(k)}) noktasında çizilen teğetin eğimi kaçtır?`, `What is the slope of the tangent to y = ${polyStr(c, b, a)} at the point (${k}, ${f(k)})?`),
      String(m),
      [[String(f(k)), tx('Eğim yerine noktanın y-koordinatını (f değerini) yazdın; eğim f\'(x₀)\'dır.', 'You gave the y-coordinate f(x₀) instead of the slope f\'(x₀).')],
        [String(a * k + b), tx('x² teriminin türevinde 2 çarpanını unuttun.', 'You forgot the factor 2 in the derivative of the x² term.')],
        [String(-m), tx('Eğimin işaretini ters aldın.', 'You flipped the sign of the slope.')],
        [String(2 * a * k), tx('Doğrusal terimin türevi b\'yi atladın.', 'You dropped b, the derivative of the linear term.')]],
      [`y' = ${polyStr(b, 2 * a)}`, tx(`Eğim = y'(${k}) = ${m}`, `Slope = y'(${k}) = ${m}`)], rng,
      new PlotSpec(-4, 4, lo, hi).addCurve(f).addPoint(k, f(k), 'P'));
    return chk(q, { t: 'val', f, x: k, ord: 1, ans: String(m) });
  }

  // new L1: horizontal tangent of a parabola
  function dvHorizEasy(rng) {
    const s = nz(rng, -4, 4), c = rng.nextInt(-5, 6);
    const f = (x) => x * x + 2 * s * x + c;
    const [lo, hi] = rangeY(f, -7, 7);
    const q = mk(T.hor(),
      tx(`f(x) = ${polyStr(c, 2 * s, 1)} eğrisinin teğeti hangi x değerinde yataydır?`, `At which value of x is the tangent to f(x) = ${polyStr(c, 2 * s, 1)} horizontal?`),
      `x = ${-s}`,
      [[`x = ${s}`, tx('2x + 2s = 0 denkleminde sabit terimi karşıya atarken işareti değiştirmeyi unuttun.', 'You forgot to flip the sign when moving the constant term across in 2x + 2s = 0.')],
        [`x = ${-2 * s}`, tx('Denklemi 2 ile bölmeyi unuttun (2x = -2s\'den x = -2s yazdın).', 'You forgot to divide by 2 (from 2x = -2s you wrote x = -2s).')],
        [`x = ${2 * s}`, tx('Hem işareti hem de 2 ile bölmeyi atladın.', 'You missed both the sign change and the division by 2.')],
        ['x = 0', tx('Yatay teğet her zaman y-ekseninde olmaz; f\'(x) = 0 denklemini çözmelisin.', 'The horizontal tangent is not always at x = 0; solve f\'(x) = 0.')]],
      [tx('Yatay teğet ⇔ f\'(x) = 0', 'Horizontal tangent ⇔ f\'(x) = 0'), `f'(x) = ${polyStr(2 * s, 2)} = 0`, `x = ${-s}`], rng,
      new PlotSpec(-7, 7, lo, hi).addCurve(f));
    return chk(q, { t: 'zeros', g: (x) => 2 * x + 2 * s, zs: [-s], ans: `x = ${-s}` });
  }

  // new L1: derivative of a straight line from its graph
  function dvGraphLine(rng) {
    const m = nz(rng, -3, 3), b = rng.nextInt(-3, 4), x1 = rng.nextInt(-3, 1), x2 = x1 + rng.nextInt(1, 4);
    const f = (x) => m * x + b;
    const [lo, hi] = rangeY(f, -5, 5);
    const q = mk(T.gr(),
      tx(`Grafikte doğrusal bir f fonksiyonu gösterilmiştir; grafik A(${x1}, ${f(x1)}) ve B(${x2}, ${f(x2)}) noktalarından geçer. f'(3) kaçtır?`, `The graph shows a linear function f passing through A(${x1}, ${f(x1)}) and B(${x2}, ${f(x2)}). What is f'(3)?`),
      String(m),
      [[String(b), tx('Eğim yerine y-keseni olan f(0) değerini yazdın.', 'You gave the y-intercept f(0) instead of the slope.')],
        [String(-m), tx('Eğimi hesaplarken y farkını ters sırada aldın.', 'You subtracted the y-values in the wrong order.')],
        [String(f(3)), tx('f\'(3) yerine f(3) değerini hesapladın.', 'You computed f(3) instead of f\'(3).')]],
      [tx('Doğrunun türevi her noktada eğimine eşittir.', 'The derivative of a line equals its slope at every point.'),
        `m = (${dif(f(x2), f(x1))}) / (${dif(x2, x1)}) = ${m}`], rng,
      new PlotSpec(-5, 5, lo, hi).addCurve(f).addPoint(x1, f(x1), 'A').addPoint(x2, f(x2), 'B'));
    return chk(q, { t: 'val', f, x: 3, ord: 1, ans: String(m) });
  }

  // new L1: which function is differentiable at x = a
  function dvDiffWhich(rng) {
    const a = rng.nextInt(-3, 4);
    const s = a === 0 ? 'x' : `(x ${plus(-a)})`;
    const sx = a === 0 ? 'x' : `x ${plus(-a)}`;
    const fs = {
      sq: { s: a === 0 ? 'f(x) = x²' : `f(x) = ${s}²`, f: (x) => (x - a) ** 2 },
      abs: { s: `f(x) = |${sx}|`, f: (x) => Math.abs(x - a) },
      cbrt: { s: `f(x) = ${s}^(1/3)`, f: (x) => Math.cbrt(x - a) },
      inv: { s: `f(x) = 1/${s}`, f: (x) => 1 / (x - a) },
      sqrt: { s: `f(x) = √|${sx}|`, f: (x) => Math.sqrt(Math.abs(x - a)) },
    };
    const nm = (k) => fs[k].s;
    const q = mk(T.dif(),
      tx(`Aşağıdaki fonksiyonlardan hangisi x = ${a} noktasında türevlenebilirdir?`, `Which of the following functions is differentiable at x = ${a}?`),
      nm('sq'),
      [[nm('abs'), tx(`Grafikte x = ${a}'da bir köşe vardır: sol eğim −1, sağ eğim +1 olduğundan türev yoktur.`, `The graph has a corner at x = ${a}: left slope −1 and right slope +1, so the derivative does not exist.`)],
        [nm('cbrt'), tx(`x = ${a}'da düşey teğet vardır; eğim sonsuza gider, türev yoktur.`, `There is a vertical tangent at x = ${a}; the slope is infinite, so the derivative does not exist.`)],
        [nm('inv'), tx(`Fonksiyon x = ${a}'da tanımsızdır (düşey asimptot); süreksiz olduğundan türevlenemez.`, `The function is not defined at x = ${a} (vertical asymptote); it is not continuous, hence not differentiable.`)],
        [nm('sqrt'), tx(`x = ${a}'da sivri uç (cusp) vardır; eğimler −∞ ve +∞'a gider.`, `There is a cusp at x = ${a}; the slopes tend to −∞ and +∞.`)]],
      [tx(`|${sx}|, ${s}^(1/3), 1/${s}, √|${sx}| fonksiyonları x = ${a}'da türevlenemez (köşe, düşey teğet, süreksizlik, sivri uç).`, `|${sx}|, ${s}^(1/3), 1/${s}, √|${sx}| are not differentiable at x = ${a} (corner, vertical tangent, discontinuity, cusp).`),
        tx(`${s}² düzgün bir parabol olup f'(${a}) = 0 vardır.`, `${s}² is a smooth parabola with f'(${a}) = 0.`)], rng);
    return chk(q, { t: 'none' });
  }

  // =====================================================================================================
  // LEVEL 2
  // =====================================================================================================

  // VB DvProduct
  function dvProduct(rng) {
    const a = rng.nextInt(-4, 5), b = nz(rng, -4, 4), k = rng.nextInt(-3, 4);
    const f = (x) => (x * x + a) * (x + b);
    const ans = 2 * k * (k + b) + (k * k + a);
    const q = mk(T.prod(),
      tx(`f(x) = (${polyStr(a, 0, 1)})(${polyStr(b, 1)}) ise f'(${k}) kaçtır?`, `If f(x) = (${polyStr(a, 0, 1)})(${polyStr(b, 1)}), what is f'(${k})?`), String(ans),
      [[String(2 * k), tx('Yalnızca u\' = 2x değerini aldın; çarpım kuralının geri kalanını unuttun.', 'You took only u\' = 2x and ignored the rest of the product rule.')],
        [String(f(k)), tx(`f'(${k}) yerine f(${k}) değerini hesapladın (türev almadın).`, `You computed f(${k}) instead of f'(${k}) (no differentiation).`)]],
      ['(u·v)\' = u\'v + uv\'', `u = ${polyStr(a, 0, 1)},  v = ${polyStr(b, 1)}`, `f'(${k}) = ${2 * k}·${par(k + b)} + ${k * k + a}·1 = ${ans}`], rng);
    return chk(q, { t: 'val', f, x: k, ord: 1, ans: String(ans) });
  }

  // VB DvQuotient
  function dvQuotient(rng) {
    let a, k;
    do { a = nz(rng, -4, 4); k = rng.nextInt(-3, 4); } while (k + a === 0);
    const den = (k + a) * (k + a);
    const f = (x) => x / (x + a);
    const q = mk(T.quo(),
      tx(`f(x) = x/(${polyStr(a, 1)}) ise f'(${k}) kaçtır?`, `If f(x) = x/(${polyStr(a, 1)}), what is f'(${k})?`), frac(a, den),
      [[frac(-a, den), tx('Pay farkını ters sırayla aldın (uv\' - u\'v); işaret yanlış.', 'You subtracted in the wrong order (uv\' - u\'v), so the sign is wrong.')],
        [frac(a, k + a), tx('Paydayı karelemeyi unuttun (v² yerine v).', 'You forgot to square the denominator (v instead of v²).')],
        [frac(1, den), tx('Pay olarak yalnızca u\' = 1 aldın; u\'v - uv\' farkını hesaplamadın.', 'You used only u\' = 1 as the numerator instead of u\'v - uv\'.')],
        [frac(k, den), tx(`Pay olarak u = x değerini (${k}) aldın; u'v - uv' hesaplanmalıydı.`, `You used u = x (that is ${k}) as the numerator instead of u'v - uv'.`)],
        [frac(a, den + 1), tx('Paydayı hesaplarken (x + a)² değerine 1 eklemişsin.', 'Slip in the denominator: you added 1 to the value of the squared denominator.')],
        [frac(a + 1, den), tx('Payı sadeleştirirken hata yaptın (a yerine a + 1).', 'You slipped when simplifying the numerator (a + 1 instead of a).')],
        [frac(2 * a, den), tx('Pay terimlerini birleştirirken payı iki katına çıkardın.', 'You doubled the numerator when combining its terms.')]],
      ['(u/v)\' = (u\'v - uv\') / v²', `f'(x) = [1·(${polyStr(a, 1)}) - x·1] / (${polyStr(a, 1)})² = ${a}/(${polyStr(a, 1)})²`, `f'(${k}) = ${frac(a, den)}`], rng);
    return chk(q, { t: 'val', f, x: k, ord: 1, ans: frac(a, den) });
  }

  // VB DvChain
  function dvChain(rng) {
    const n = rng.nextInt(2, 4), a = nz(rng, -3, 3), b = rng.nextInt(-3, 4), k = rng.nextInt(-2, 3);
    const inner = a * k + b, ans = n * a * ipow(inner, n - 1);
    const f = (x) => (a * x + b) ** n;
    const nm1 = n - 1 === 1 ? '' : sup(n - 1);
    const q = mk(T.chain(),
      tx(`f(x) = (${polyStr(b, a)})${sup(n)} ise f'(${k}) kaçtır?`, `If f(x) = (${polyStr(b, a)})${sup(n)}, what is f'(${k})?`), String(ans),
      [[String(n * ipow(inner, n - 1)), tx(`İç fonksiyonun türevi olan ${a} çarpanını unuttun (zincir kuralı eksik).`, `You forgot the inner derivative factor ${a} (incomplete chain rule).`)],
        [String(a * ipow(inner, n)), tx('Dış fonksiyona kuvvet kuralı uygulamadın; yalnızca iç türevle çarptın.', 'You did not apply the power rule to the outer function; you only used the inner derivative.')],
        [String(n * a * ipow(inner, n)), tx('Üssü bir azaltmayı unuttun (n·a·uⁿ yazdın).', 'You did not lower the exponent by one (you wrote n·a·uⁿ).')]],
      [tx(`Zincir kuralı: f' = ${n}·(${polyStr(b, a)})${nm1}·(${a})`, `Chain rule: f' = ${n}·(${polyStr(b, a)})${nm1}·(${a})`), tx(`x = ${k}: iç fonksiyon = ${inner}`, `x = ${k}: inner function = ${inner}`),
        `f'(${k}) = ${n}·${ipow(inner, n - 1)}·${a} = ${ans}`], rng);
    return chk(q, { t: 'val', f, x: k, ord: 1, ans: String(ans) });
  }

  // VB DvImplicit
  function dvImplicit(rng) {
    const t = rng.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]);
    const x = t[0] * (rng.nextInt(0, 2) === 0 ? 1 : -1), y = t[1] * (rng.nextInt(0, 2) === 0 ? 1 : -1), r = t[2];
    const q = mk(T.imp(),
      tx(`x² + y² = ${r * r} çemberinde (${x}, ${y}) noktasındaki dy/dx kaçtır?`, `On the circle x² + y² = ${r * r}, what is dy/dx at the point (${x}, ${y})?`), frac(-x, y),
      [[frac(x, y), tx('Eksi işaretini kaybettin: 2x + 2y·y\' = 0 denkleminde 2x\'i karşıya atarken işaret değişir.', 'You lost the minus sign: moving 2x across 2x + 2y·y\' = 0 flips its sign.')],
        [frac(y, x), tx('Kesri ters çevirdin (y/x); y\' yalnız bırakılırken x ile y yer değiştirmemeli.', 'You inverted the fraction (y/x); x and y must not swap when isolating y\'.')],
        [frac(-y, x), tx('y\' çözerken x ve y\'nin rollerini karıştırdın.', 'You mixed up the roles of x and y while solving for y\'.')],
        [frac(-x, -y), tx('x ve y\'nin işaretlerini yerine koyarken hata yaptın.', 'You made a sign slip when substituting the signs of x and y.')]],
      [tx('Her iki tarafı x\'e göre türet: 2x + 2y·y\' = 0', 'Differentiate both sides with respect to x: 2x + 2y·y\' = 0'), 'y\' = -x/y', `y' = -(${x})/(${y}) = ${frac(-x, y)}`], rng,
      circlePlot(r, x, y));
    return chk(q, { t: 'imp', F: (X, Y) => X * X + Y * Y - r * r, x, y, ans: frac(-x, y) });
  }

  // VB DvSecond
  function dvSecond(rng) {
    const a = nz(rng, -3, 3), b = rng.nextInt(-4, 5), c = rng.nextInt(-4, 5), k = rng.nextInt(-3, 4);
    const f = (x) => evalPoly(x, 0, c, b, a);
    const ans = 6 * a * k + 2 * b;
    const [lo, hi] = rangeY(f, -4, 4);
    const q = mk(T.high(),
      tx(`f(x) = ${polyStr(0, c, b, a)} ise f''(${k}) kaçtır?`, `If f(x) = ${polyStr(0, c, b, a)}, what is f''(${k})?`), String(ans),
      [[String(3 * a * k * k + 2 * b * k + c), tx(`Yalnızca birinci türevi alıp ${k} noktasında hesapladın.`, `You stopped after the first derivative and evaluated it at ${k}.`)],
        [String(6 * a * k), tx('bx² teriminin ikinci türevi olan 2b\'yi unuttun.', 'You dropped the 2b that comes from the second derivative of bx².')],
        [String(6 * a + 2 * b), tx(`6a·x ifadesinde x = ${k} yerine koymadan 6a yazdın.`, `You wrote 6a without substituting x = ${k} into 6ax.`)]],
      [`f'(x) = ${polyStr(c, 2 * b, 3 * a)}`, `f''(x) = ${polyStr(2 * b, 6 * a)}`, `f''(${k}) = ${ans}`], rng,
      new PlotSpec(-4, 4, lo, hi).addCurve(f));
    return chk(q, { t: 'val', f, x: k, ord: 2, ans: String(ans) });
  }

  // new L2: product rule, expression answer
  function dvProductExpr(rng) {
    const m = rng.nextInt(2, 4), v = rng.nextInt(0, 3);
    let text, ans, wr, f, xsA, sol;
    if (v === 0) {
      text = `${xp(m)}·e^x`; f = (x) => x ** m * Math.exp(x); xsA = [-0.8, 0.5, 1.3];
      ans = `${xp(m - 1)}(${polyStr(m, 1)})·e^x`;
      wr = [[`${pc(m, m - 1)}·e^x`, tx('Yalnızca u\'v aldın; uv\' (xᵐ·eˣ) terimini unuttun.', 'You kept only u\'v and dropped the uv\' term (xᵐ·eˣ).')],
        [`${xp(m)}·e^x`, tx('Yalnızca uv\' aldın; u\'v terimini unuttun.', 'You kept only uv\' and dropped the u\'v term.')],
        [`${xp(m - 1)}(${polyStr(-m, 1)})·e^x`, tx('İşaret hatası: terimleri çıkardın; çarpım kuralında toplanır.', 'Sign error: you subtracted the terms; the product rule adds them.')],
        [`${xp(m)}(${polyStr(m, 1)})·e^x`, tx('Ortak çarpan alırken üssü bir azaltmayı unuttun.', 'When factoring you forgot to lower the power by one.')]];
      sol = [`u = ${xp(m)},  v = e^x`, `f' = ${pc(m, m - 1)}·e^x + ${xp(m)}·e^x`, `= ${ans}`];
    } else if (v === 1) {
      text = `${xp(m)}·sin(x)`; f = (x) => x ** m * Math.sin(x); xsA = [-0.8, 0.5, 1.3];
      ans = `${pc(m, m - 1)}·sin(x) + ${xp(m)}·cos(x)`;
      wr = [[`${pc(m, m - 1)}·sin(x) - ${xp(m)}·cos(x)`, tx('Çarpım kuralında bölüm kuralının eksi işaretini kullandın.', 'You used the minus sign of the quotient rule in the product rule.')],
        [`${pc(m, m - 1)}·cos(x)`, tx('Her çarpanın türevini ayrı ayrı çarptın (u\'·v\'); bu yanlıştır.', 'You multiplied the derivatives separately (u\'·v\'), which is wrong.')],
        [`${xp(m)}·cos(x)`, tx('Yalnızca uv\' aldın; u\'v terimini unuttun.', 'You kept only uv\' and dropped the u\'v term.')],
        [`${pc(m, m - 1)}·sin(x) + ${xp(m)}·sin(x)`, tx('(sin x)\' = cos x olmalıydı; sin x\'in türevini sin x aldın.', 'You took (sin x)\' as sin x; it is cos x.')]];
      sol = [`u = ${xp(m)},  v = sin(x)`, `f' = ${pc(m, m - 1)}·sin(x) + ${xp(m)}·cos(x)`];
    } else {
      text = `${xp(m)}·ln(x)`; f = (x) => x ** m * Math.log(x); xsA = [0.7, 1.5, 2.6];
      ans = `${pc(m, m - 1)}·ln(x) + ${xp(m - 1)}`;
      wr = [[`${pc(m, m - 1)}·ln(x)`, tx('uv\' terimini unuttun: xᵐ·(1/x) = xᵐ⁻¹ eksik.', 'You dropped the uv\' term: xᵐ·(1/x) = xᵐ⁻¹ is missing.')],
        [`${pc(m, m - 1)}·ln(x) + ${xp(m)}`, tx('xᵐ·(1/x) sadeleşince xᵐ⁻¹ olur, xᵐ değil.', 'xᵐ·(1/x) simplifies to xᵐ⁻¹, not xᵐ.')],
        [`${pc(m, m - 1)}·ln(x) - ${xp(m - 1)}`, tx('İşaret hatası: çarpım kuralı toplamadır.', 'Sign error: the product rule adds the two terms.')],
        [pc(m, m - 2), tx('u\'·v\' çarptın: (xᵐ)\'·(1/x); çarpım kuralı bu değildir.', 'You multiplied u\'·v\' = (xᵐ)\'·(1/x), which is not the product rule.')]];
      sol = [`u = ${xp(m)},  v = ln(x)`, `f' = ${pc(m, m - 1)}·ln(x) + ${xp(m)}·(1/x)`, `= ${ans}`];
    }
    const q = mk(T.prod(), tx(`f(x) = ${text} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${text}?`), `f'(x) = ${ans}`,
      wr.map((w) => [`f'(x) = ${w[0]}`, w[1]]), ['(u·v)\' = u\'v + uv\'', ...sol], rng);
    return chk(q, { t: 'expr', f, xs: xsA });
  }

  // new L2: quotient rule, expression answer
  function dvQuotExpr(rng) {
    const v = rng.nextInt(0, 3);
    const dp = (s) => `f'(x) = ${s}`;
    if (v === 0) {
      let a, b, c, k;
      do { a = nz(rng, -3, 3); b = rng.nextInt(-4, 5); c = nz(rng, -4, 4); k = a * c - b; } while (k === 0 || k === a * c + b);
      const den = `(${polyStr(c, 1)})²`;
      const q = mk(T.quo(), tx(`f(x) = (${polyStr(b, a)})/(${polyStr(c, 1)}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = (${polyStr(b, a)})/(${polyStr(c, 1)})?`),
        dp(`${k}/${den}`),
        [[dp(`${-k}/${den}`), tx('Payı ters sırayla aldın (uv\' - u\'v); işaret yanlış.', 'You took the numerator in the wrong order (uv\' - u\'v); the sign is wrong.')],
          [dp(`${a * c + b}/${den}`), tx('Payda u\'v - uv\' farkı yerine toplam aldın.', 'You added instead of subtracting in u\'v - uv\'.')],
          [dp(`${k}/(${polyStr(c, 1)})`), tx('Paydayı karelemeyi unuttun.', 'You forgot to square the denominator.')],
          [dp(`${a}/${den}`), tx('Payda yalnızca u\' = a aldın; u\'v - uv\' hesaplanmadı.', 'You used only u\' = a in the numerator instead of u\'v - uv\'.')]],
        ['(u/v)\' = (u\'v - uv\') / v²', `u'v - uv' = ${a}(${polyStr(c, 1)}) - (${polyStr(b, a)})·1 = ${k}`, dp(`${k}/${den}`)], rng);
      return chk(q, { t: 'expr', f: (x) => (a * x + b) / (x + c), xs: [0.37, 1.21, 2.43] });
    }
    if (v === 1) {
      const c = nz(rng, -4, 4);
      const den = `(${polyStr(c, 1)})²`;
      const q = mk(T.quo(), tx(`f(x) = x²/(${polyStr(c, 1)}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = x²/(${polyStr(c, 1)})?`),
        dp(`(${polyStr(0, 2 * c, 1)})/${den}`),
        [[dp(`(${polyStr(0, -2 * c, -1)})/${den}`), tx('Payı ters sırayla aldın (uv\' - u\'v); işaret yanlış.', 'You took the numerator in the wrong order (uv\' - u\'v); the sign is wrong.')],
          [dp(`(${polyStr(0, 2 * c, 1)})/(${polyStr(c, 1)})`), tx('Paydayı karelemeyi unuttun.', 'You forgot to square the denominator.')],
          [dp(`(${polyStr(0, 2 * c, 3)})/${den}`), tx('Payda u\'v - uv\' yerine u\'v + uv\' aldın.', 'You used u\'v + uv\' instead of u\'v - uv\' in the numerator.')],
          [dp(`2x/${den}`), tx('Payda yalnızca u\' = 2x aldın.', 'You used only u\' = 2x in the numerator.')]],
        ['(u/v)\' = (u\'v - uv\') / v²', `u'v - uv' = 2x(${polyStr(c, 1)}) - x²·1 = ${polyStr(0, 2 * c, 1)}`, dp(`(${polyStr(0, 2 * c, 1)})/${den}`)], rng);
      return chk(q, { t: 'expr', f: (x) => x * x / (x + c), xs: [0.37, 1.21, 2.43] });
    }
    const q = mk(T.quo(), tx('f(x) = sin(x)/x fonksiyonunun türevi hangisidir?', 'Which is the derivative of f(x) = sin(x)/x?'),
      dp('(x·cos(x) - sin(x))/x²'),
      [[dp('(x·cos(x) + sin(x))/x²'), tx('Payda u\'v - uv\' yerine toplam aldın.', 'You added instead of subtracting in the numerator.')],
        [dp('(sin(x) - x·cos(x))/x²'), tx('Payı ters sırayla aldın; işaret yanlış.', 'You took the numerator in the wrong order; the sign is wrong.')],
        [dp('(x·cos(x) - sin(x))/x'), tx('Paydayı karelemeyi unuttun.', 'You forgot to square the denominator.')],
        [dp('cos(x)'), tx('Payın ve paydanın türevlerini ayrı ayrı alıp böldün (u\'/v\'); bölüm kuralı bu değildir.', 'You differentiated numerator and denominator separately (u\'/v\'); that is not the quotient rule.')]],
      ['(u/v)\' = (u\'v - uv\') / v²', 'u = sin x,  v = x', 'f\'(x) = (cos(x)·x - sin(x)·1)/x²'], rng);
    return chk(q, { t: 'expr', f: (x) => Math.sin(x) / x, xs: [0.7, 1.4, 2.5] });
  }

  // new L2: chain rule, expression answer (power / root / reciprocal power)
  function dvChainExpr(rng) {
    const v = rng.nextInt(0, 3);
    const dp = (s) => `f'(x) = ${s}`;
    if (v === 0) {
      const p = nz(rng, -3, 3), qq = nz(rng, -4, 4), n = rng.nextInt(3, 5);
      const inner = `(${polyStr(qq, 0, p)})`;
      const nm = sup(n - 1);
      const q = mk(T.chain(), tx(`f(x) = (${polyStr(qq, 0, p)})${sup(n)} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = (${polyStr(qq, 0, p)})${sup(n)}?`),
        dp(`${ct(2 * n * p, 'x')}${inner}${nm}`),
        [[dp(`${n}${inner}${nm}`), tx('İç fonksiyonun türevini (2px) hiç hesaba katmadın.', 'You ignored the derivative of the inner function (2px) completely.')],
          [dp(`${n * p}${inner}${nm}`), tx('İç türevi p·x² için p aldın; x² → 2x unutuldu.', 'You took p as the inner derivative; x² → 2x was forgotten.')],
          [dp(`${ct(2 * n * p, 'x')}${inner}${sup(n)}`), tx('Üssü bir azaltmayı unuttun.', 'You did not lower the exponent by one.')],
          [dp(`${ct(2 * p, 'x')}${inner}${nm}`), tx('Dış fonksiyonun türevinden gelen n çarpanını unuttun.', 'You forgot the factor n from differentiating the outer power.')]],
        [tx('Zincir kuralı: dış türev × iç türev', 'Chain rule: outer derivative × inner derivative'), `f'(x) = ${n}${inner}${nm}·${ct(2 * p, 'x')}`, dp(`${ct(2 * n * p, 'x')}${inner}${nm}`)], rng);
      return chk(q, { t: 'expr', f: (x) => (p * x * x + qq) ** n, xs: [-1.2, 0.6, 1.5] });
    }
    if (v === 1) {
      const p = nz(rng, -4, 4), qq = rng.nextInt(-5, 6);
      const inner = polyStr(qq, p);
      const q = mk(T.chain(), tx(`f(x) = √(${inner}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = √(${inner})?`),
        dp(`${p}/(2√(${inner}))`),
        [[dp(`${p}/√(${inner})`), tx('Kökün türevinden gelen 2 çarpanını unuttun.', 'You forgot the 2 that comes from differentiating the square root.')],
          [dp(`1/(2√(${inner}))`), tx('İç fonksiyonun türevi olan çarpanı unuttun.', 'You forgot the inner-derivative factor.')],
          [dp(`${p}/(2(${inner}))`), tx('Kök işaretini kaldırdın; (√u)\' = u\'/(2√u) olmalıdır.', 'You dropped the root; (√u)\' = u\'/(2√u).')],
          [dp(`${2 * p}/√(${inner})`), tx('2 çarpanını paydadan paya taşıdın; yön ters.', 'You moved the 2 from the denominator to the numerator.')]],
        ['(√u)\' = u\'/(2√u)', `u = ${inner},  u' = ${p}`, dp(`${p}/(2√(${inner}))`)], rng);
      return chk(q, { t: 'expr', f: (x) => Math.sqrt(p * x + qq), xsFn: () => [0.6, 1.3, 2.4].map((t) => (t - qq) / p) });
    }
    const p = nz(rng, -3, 3), qq = nz(rng, -4, 4);
    const inner = polyStr(qq, p);
    const q = mk(T.chain(), tx(`f(x) = 1/(${inner})² fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = 1/(${inner})²?`),
      dp(`${-2 * p}/(${inner})³`),
      [[dp(`${2 * p}/(${inner})³`), tx('Negatif üssün işaretini kaybettin: (u⁻²)\' = -2u⁻³·u\'.', 'You lost the sign of the negative power: (u⁻²)\' = -2u⁻³·u\'.')],
        [dp(`${-2 * p}/(${inner})²`), tx('Üssü azaltırken -2 yerine -1 gibi davrandın; yeni üs 3 olmalı.', 'You did not lower the power properly; the new power must be 3 in the denominator.')],
        [dp('-2/(' + inner + ')³'), tx('İç fonksiyonun türevini (p) unuttun.', 'You forgot the inner derivative p.')],
        [dp(`${-p}/(${inner})³`), tx('Üstten gelen 2 çarpanını unuttun.', 'You forgot the factor 2 coming from the power.')]],
      [tx('1/u² = u⁻² yaz ve zincir kuralını uygula.', 'Write 1/u² = u⁻² and apply the chain rule.'), `f' = -2u⁻³·u' = -2(${inner})⁻³·${par(p)}`, dp(`${-2 * p}/(${inner})³`)], rng);
    return chk(q, { t: 'expr', f: (x) => 1 / (p * x + qq) ** 2, xsFn: () => [0.6, 1.3, 2.4].map((t) => (t - qq) / p) });
  }

  // new L2: chain rule with trig
  function dvChainTrig(rng) {
    const a = nz(rng, -4, 4), b = rng.nextInt(-3, 4), v = rng.nextInt(0, 3);
    const u = polyStr(b, a);
    const dp = (s) => `f'(x) = ${s}`;
    let name, f, ans, wr, sol;
    if (v === 0) {
      name = `sin(${u})`; f = (x) => Math.sin(a * x + b); ans = ct(a, `cos(${u})`);
      wr = [[`cos(${u})`, tx('İç fonksiyonun türevi olan a çarpanını unuttun.', 'You forgot the inner-derivative factor a.')],
        [ct(-a, `cos(${u})`), tx('sin\'in türevi +cos\'tur; gereksiz bir eksi işareti koydun.', 'The derivative of sin is +cos; you added an unneeded minus sign.')],
        [ct(a, `sin(${u})`), tx('sin\'in türevini sin sandın.', 'You took the derivative of sin as sin.')],
        [ct(-a, `sin(${u})`), tx('sin ile cos\'un türevlerini karıştırdın.', 'You mixed up the derivatives of sin and cos.')]];
      sol = ['(sin u)\' = cos u · u\'', dp(ans)];
    } else if (v === 1) {
      name = `cos(${u})`; f = (x) => Math.cos(a * x + b); ans = ct(-a, `sin(${u})`);
      wr = [[ct(a, `sin(${u})`), tx('(cos u)\' = -sin u · u\'; eksi işaretini unuttun.', '(cos u)\' = -sin u · u\'; you forgot the minus sign.')],
        [`-sin(${u})`, tx('İç fonksiyonun türevi olan a çarpanını unuttun.', 'You forgot the inner-derivative factor a.')],
        [ct(a, `cos(${u})`), tx('cos\'un türevini cos sandın.', 'You took the derivative of cos as cos.')],
        [ct(-a, `cos(${u})`), tx('cos\'un türevi -sin\'dir, -cos değil.', 'The derivative of cos is -sin, not -cos.')]];
      sol = ['(cos u)\' = -sin u · u\'', dp(ans)];
    } else {
      name = `tan(${u})`; f = (x) => Math.tan(a * x + b); ans = ct(a, `sec²(${u})`);
      wr = [[`sec²(${u})`, tx('İç fonksiyonun türevi olan a çarpanını unuttun.', 'You forgot the inner-derivative factor a.')],
        [ct(a, `sec(${u})`), tx('tan\'ın türevi sec²\'dir; kareyi unuttun.', 'The derivative of tan is sec²; you dropped the square.')],
        [ct(-a, `sec²(${u})`), tx('tan\'ın türevi pozitiftir (+sec²); eksi işaret yanlış.', 'The derivative of tan is positive (+sec²); the minus sign is wrong.')],
        [ct(a, `sec(${u})·tan(${u})`), tx('sec x\'in türevi ile tan x\'in türevini karıştırdın.', 'You confused the derivative of sec x with that of tan x.')]];
      sol = ['(tan u)\' = sec²u · u\'', dp(ans)];
    }
    const q = mk(T.chain(), tx(`f(x) = ${name} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${name}?`), dp(ans),
      wr.map((w) => [dp(w[0]), w[1]]), sol, rng);
    return chk(q, { t: 'expr', f, xsFn: () => [0.05, 0.12, 0.2].map((t) => (t - b) / a) , tanSafe: v === 2 });
  }

  // new L2: derivatives of tan/sec/csc/cot (the four that are easy to mix up)
  function dvTrigSix(rng) {
    const c = nz(rng, -3, 3);
    const D = { tan: 'sec²(x)', sec: 'sec(x)·tan(x)', csc: '-csc(x)·cot(x)', cot: '-csc²(x)' };
    const F = { tan: Math.tan, sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x) };
    const names = ['tan', 'sec', 'csc', 'cot'];
    const g = rng.pick(names);
    const dp = (nmk) => `f'(x) = ${ct(c, D[nmk])}`;
    const note = (w) => ({
      tan: tx('Bu, tan x\'in türevidir (sec²x); soru başka bir fonksiyonu soruyor.', 'This is the derivative of tan x (sec²x); the question asks about another function.'),
      sec: tx('Bu, sec x\'in türevidir (sec x tan x); fonksiyonları karıştırdın.', 'This is the derivative of sec x (sec x tan x); you mixed up the functions.'),
      csc: tx('Bu, csc x\'in türevidir (-csc x cot x); fonksiyonları karıştırdın.', 'This is the derivative of csc x (-csc x cot x); you mixed up the functions.'),
      cot: tx('Bu, cot x\'in türevidir (-csc²x); fonksiyonları karıştırdın.', 'This is the derivative of cot x (-csc²x); you mixed up the functions.'),
    }[w]);
    const wrongs = names.filter((n) => n !== g).map((n) => [dp(n), note(n)]);
    wrongs.push([`f'(x) = ${ct(-c, D[g])}`, tx('"Ko-" ile başlayan fonksiyonların türevi eksi işaretlidir; işareti ters aldın.', 'Derivatives of the "co-" functions carry a minus sign; you got the sign the wrong way.')]);
    const q = mk(T.trig(), tx(`f(x) = ${ct(c, g + '(x)')} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${ct(c, g + '(x)')}?`), dp(g), wrongs,
      [`(${g} x)' = ${D[g].replace(/\(x\)/g, ' x')}`.replace('² x', '²x'), dp(g)], rng);
    return chk(q, { t: 'expr', f: (x) => c * F[g](x), xs: [0.55, 0.9, 1.25] });
  }

  // new L2: exponential derivative
  function dvExpDeriv(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const a = rng.pick([2, 3, 5]);
      const dp = (s) => `f'(x) = ${s}`;
      const q = mk(T.exp(), tx(`f(x) = ${a}^x fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${a}^x?`), dp(`${a}^x·ln(${a})`),
        [[dp(`x·${a}^(x - 1)`), tx('Kuvvet kuralını uyguladın; ama burada üs değişkendir, taban sabit.', 'You applied the power rule, but here the exponent is the variable and the base is constant.')],
          [dp(`${a}^x`), tx('ln a çarpanını unuttun (yalnızca eˣ kendi türevidir).', 'You forgot the factor ln a (only eˣ is its own derivative).')],
          [dp(`${a}^x/ln(${a})`), tx('ln a ile çarpmak yerine böldün (integral kuralı karışmış).', 'You divided by ln a instead of multiplying (this is the integration rule).')],
          [dp(`${a}^x·ln(x)`), tx('ln a yerine ln x yazdın.', 'You wrote ln x instead of ln a.')]],
        ['(aˣ)\' = aˣ·ln a', dp(`${a}^x·ln(${a})`)], rng);
      return chk(q, { t: 'expr', f: (x) => a ** x, xs: [-0.9, 0.4, 1.7] });
    }
    const c = nz(rng, -4, 4), k = rng.pick([-3, -2, 2, 3]);
    const dp = (s) => `f'(x) = ${s}`;
    const q = mk(T.exp(), tx(`f(x) = ${ct(c, ex(k))} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${ct(c, ex(k))}?`), dp(ct(c * k, ex(k))),
      [[dp(ct(c, ex(k))), tx('Üstteki ifadenin türevi olan k çarpanını (zincir kuralı) unuttun.', 'You forgot the chain-rule factor k from the exponent.')],
        [dp(ct(c * k, `x·e^(${polyStr(-1, k)})`)), tx('Kuvvet kuralını uyguladın; ama üs değişkendir.', 'You applied the power rule, but the exponent is the variable.')],
        [dp(ct(c * k * k, ex(k))), tx('Zincir çarpanı k\'yı iki kez uyguladın.', 'You applied the chain factor k twice.')],
        [dp(ct(-c * k, ex(k))), tx('Gereksiz bir işaret değişimi yaptın.', 'You introduced an unneeded sign change.')]],
      ['(e^u)\' = e^u·u\'', `u = ${ax(k)},  u' = ${k}`, dp(ct(c * k, ex(k)))], rng);
    return chk(q, { t: 'expr', f: (x) => c * Math.exp(k * x), xs: [-0.7, 0.3, 0.9] });
  }

  // new L2: logarithmic derivative
  function dvLogDeriv(rng) {
    const v = rng.nextInt(0, 3);
    const dp = (s) => `f'(x) = ${s}`;
    if (v === 0) {
      const p = nz(rng, -4, 4), qq = nz(rng, -5, 5), inner = polyStr(qq, p);
      const q = mk(T.exp(), tx(`f(x) = ln(${inner}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ln(${inner})?`), dp(`${p}/(${inner})`),
        [[dp(`1/(${inner})`), tx('İç fonksiyonun türevi olan p çarpanını unuttun.', 'You forgot the inner-derivative factor p.')],
          [dp(`${p}/x`), tx('İçerideki ifadeyi x ile değiştirdin; payda ax + b olmalı.', 'You replaced the inside by x; the denominator must be the whole inner expression.')],
          [dp(`${-p}/(${inner})`), tx('Gereksiz bir eksi işareti koydun.', 'You added an unneeded minus sign.')],
          [dp(`ln(${p})/(${inner})`), tx('p çarpanı yerine ln p yazdın.', 'You wrote ln p instead of the factor p.')]],
        ['(ln u)\' = u\'/u', dp(`${p}/(${inner})`)], rng);
      return chk(q, { t: 'expr', f: (x) => Math.log(p * x + qq), xsFn: () => [0.6, 1.3, 2.4].map((t) => (t - qq) / p) });
    }
    if (v === 1) {
      const b = rng.pick([2, 3, 5, 10]), sub = { 2: '₂', 3: '₃', 5: '₅', 10: '₁₀' }[b];
      const q = mk(T.exp(), tx(`f(x) = log${sub}(x) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = log${sub}(x)?`), dp(`1/(x·ln(${b}))`),
        [[dp(`ln(${b})/x`), tx('ln b payda olmalıdır: (log_b x)\' = 1/(x ln b).', 'ln b belongs in the denominator: (log_b x)\' = 1/(x ln b).')],
          [dp('1/x'), tx('Bu, doğal logaritmanın türevidir; taban b için ln b ile bölmelisin.', 'That is the derivative of the natural log; for base b you must also divide by ln b.')],
          [dp(`1/(${b}·ln(x))`), tx('ln b ile ln x\'i karıştırdın.', 'You mixed up ln b and ln x.')],
          [dp(`x·ln(${b})`), tx('Türevi 1/x yerine x\'le çarpıp yazdın.', 'You multiplied by x instead of dividing by it.')]],
        ['log_b x = ln x / ln b', '(log_b x)\' = 1/(x·ln b)'], rng);
      return chk(q, { t: 'expr', f: (x) => Math.log(x) / Math.log(b), xs: [0.7, 1.6, 3.1] });
    }
    const c = rng.nextInt(1, 6);
    const q = mk(T.exp(), tx(`f(x) = ln(x² + ${c}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ln(x² + ${c})?`), dp(`2x/(x² + ${c})`),
      [[dp(`1/(x² + ${c})`), tx('İç fonksiyonun türevi olan 2x çarpanını unuttun.', 'You forgot the inner-derivative factor 2x.')],
        [dp(`x/(x² + ${c})`), tx('(x²)\' = 2x idi; 2 çarpanını unuttun.', 'The inner derivative is 2x; you dropped the 2.')],
        [dp(`2x/(x² + ${c})²`), tx('(ln u)\' = u\'/u; paydada u\'yu kareledin.', '(ln u)\' = u\'/u; you squared u in the denominator.')],
        [dp(`2x·ln(x² + ${c})`), tx('ln\'in türevini ln ile çarpma sandın.', 'You multiplied by the log instead of dividing by the argument.')]],
      ['(ln u)\' = u\'/u', `u = x² + ${c},  u' = 2x`, dp(`2x/(x² + ${c})`)], rng);
    return chk(q, { t: 'expr', f: (x) => Math.log(x * x + c), xs: [-1.1, 0.5, 1.8] });
  }

  // new L2: equation of a tangent line (cubic)
  function dvTangentLine(rng) {
    let A, B, C, D, k, m;
    do { A = nz(rng, -2, 2); B = rng.nextInt(-3, 4); C = rng.nextInt(-3, 4); D = rng.nextInt(-4, 5); k = nz(rng, -2, 2); m = 3 * A * k * k + 2 * B * k + C; } while (m === 0);
    const f = (x) => evalPoly(x, D, C, B, A);
    const y0 = f(k), b = y0 - m * k;
    const [lo, hi] = rangeY(f, k - 3, k + 3, [y0]);
    const pl = new PlotSpec(k - 3, k + 3, lo, hi).addCurve(f).addPoint(k, y0, 'P');
    const q = mk(T.tan(),
      tx(`y = ${polyStr(D, C, B, A)} eğrisine x = ${k} noktasında çizilen teğetin denklemi hangisidir?`, `Which is the equation of the tangent to y = ${polyStr(D, C, B, A)} at x = ${k}?`),
      lineStr(m, b),
      [[lineStr(m, y0), tx('Kesen olarak y₀\'ı aldın; b = y₀ − m·x₀ hesaplanmalı.', 'You used y₀ as the intercept; it must be b = y₀ − m·x₀.')],
        [lineStr(m, y0 + m * k), tx('b = y₀ − m·x₀ yerine y₀ + m·x₀ yazdın (işaret hatası).', 'You wrote y₀ + m·x₀ instead of y₀ − m·x₀ (sign slip).')],
        [lineStr(y0 === 0 ? 1 : y0, 0), tx('Eğim olarak türev yerine f(x₀) değerini aldın.', 'You used f(x₀) as the slope instead of f\'(x₀).')],
        [lineStr(-m, b), tx('Eğimin işaretini ters aldın.', 'You flipped the sign of the slope.')],
        [lineStr(m, -b), tx('Kesen b = y₀ − m·x₀ değerinin işaretini ters aldın.', 'You flipped the sign of the intercept b = y₀ − m·x₀.')]],
      [`y' = ${polyStr(C, 2 * B, 3 * A)}  →  m = y'(${k}) = ${m}`, `y(${k}) = ${y0}`, `${y0 === 0 ? 'y' : 'y ' + plus(-y0)} = ${cf(m)}(x ${plus(-k)})  →  ${lineStr(m, b)}`], rng, pl);
    return chk(q, { t: 'line', f, k, ans: lineStr(m, b) });
  }

  // new L2: equation of a normal line
  function dvNormalLine(rng) {
    let a, b, c, k, m;
    do { a = nz(rng, -2, 2); b = rng.nextInt(-3, 4); c = rng.nextInt(-3, 4); k = rng.nextInt(-2, 3); m = 2 * a * k + b; } while (Math.abs(m) < 2);
    const f = (x) => a * x * x + b * x + c;
    const y0 = f(k);
    const [lo, hi] = rangeY(f, k - 3, k + 3, [y0]);
    const q = mk(T.tan(),
      tx(`y = ${polyStr(c, b, a)} eğrisinin (${k}, ${y0}) noktasındaki normal doğrusunun (teğete dik doğru) denklemi hangisidir?`, `Which is the equation of the normal line (perpendicular to the tangent) to y = ${polyStr(c, b, a)} at (${k}, ${y0})?`),
      std(1, m, k + m * y0),
      [[std(m, -1, m * k - y0), tx('Bu, normalin değil, teğetin denklemidir.', 'This is the equation of the tangent, not the normal.')],
        [std(1, -m, k - m * y0), tx('Dik doğrunun eğimi −1/m; işareti ters yazdın.', 'The perpendicular slope is −1/m; you got the sign wrong.')],
        [std(m, 1, m * k + y0), tx('Eğimi −m aldın; dik eğim −1/m olmalıdır (negatif ters).', 'You used −m as the slope; the perpendicular slope is −1/m (negative reciprocal).')],
        [std(1, m, k + m * k), tx('Doğru noktadan geçirirken y₀ yerine x₀ kullandın.', 'You used x₀ in place of y₀ when forcing the line through the point.')],
        [std(1, m, k + y0), tx('Sağ taraftaki sabitte m çarpanını (m·y₀) unuttun.', 'You forgot the factor m (m·y₀) in the constant on the right.')],
        [std(1, m, k - m * y0), tx('Sağ taraftaki sabitin işaretini yanlış aldın.', 'You got the sign of the constant on the right wrong.')]],
      [tx(`y' = ${polyStr(b, 2 * a)}  →  m_teğet = ${m}`, `y' = ${polyStr(b, 2 * a)}  →  m_tan = ${m}`), tx(`Normalin eğimi = −1/${par(m)}`, `Normal slope = −1/${par(m)}`),
        tx(`y − ${par(y0)} = −(1/${par(m)})(x − ${par(k)})  →  ${std(1, m, k + m * y0)}`, `y − ${par(y0)} = −(1/${par(m)})(x − ${par(k)})  →  ${std(1, m, k + m * y0)}`)], rng,
      new PlotSpec(k - 3, k + 3, lo, hi).addCurve(f).addPoint(k, y0, 'P'));
    return chk(q, { t: 'std', f, k, kind: 'norm', ans: std(1, m, k + m * y0) });
  }

  // new L2: implicit differentiation on an ellipse
  function dvImpEllipse(rng) {
    const bb = rng.nextInt(2, 5), x0 = nz(rng, -3, 3), y0 = nz(rng, -3, 3);
    const c = x0 * x0 + bb * y0 * y0;
    const ans = frac(-x0, bb * y0);
    const xr = Math.sqrt(c);
    const pl = new PlotSpec(-xr * 1.3, xr * 1.3, -Math.sqrt(c / bb) * 1.5, Math.sqrt(c / bb) * 1.5);
    pl.addCurve((t) => Math.sqrt((c - t * t) / bb)).addCurve((t) => -Math.sqrt((c - t * t) / bb)).addPoint(x0, y0, 'P');
    const q = mk(T.imp(),
      tx(`x² + ${bb}y² = ${c} elipsinde (${x0}, ${y0}) noktasındaki dy/dx kaçtır?`, `On the ellipse x² + ${bb}y² = ${c}, what is dy/dx at the point (${x0}, ${y0})?`), ans,
      [[frac(x0, bb * y0), tx('Eksi işaretini kaybettin: 2x + 2b·y·y\' = 0 ⇒ y\' = −x/(b·y).', 'You lost the minus sign: 2x + 2b·y·y\' = 0 ⇒ y\' = −x/(b·y).')],
        [frac(-x0, y0), tx('y² teriminin katsayısı olan b\'yi paydada unuttun.', 'You forgot the coefficient b of y² in the denominator.')],
        [frac(-bb * x0, y0), tx('b çarpanını paya yazdın; payda olmalı.', 'You put the factor b in the numerator; it belongs in the denominator.')],
        [frac(-y0, bb * x0), tx('x ile y\'nin rollerini karıştırdın.', 'You swapped the roles of x and y.')],
        [frac(-x0, 2 * bb * y0), tx('2x ve 2by·y\' terimlerindeki 2\'leri sadeleştirmeden bir 2 daha ekledin.', 'You added an extra factor 2 instead of cancelling the 2s.')]],
      [tx('Her iki tarafı x\'e göre türet: 2x + 2b·y·y\' = 0', 'Differentiate both sides with respect to x: 2x + 2b·y·y\' = 0'), `y' = -x/(${bb}y)`, `y' = -(${x0})/(${bb}·${par(y0)}) = ${ans}`], rng, pl);
    return chk(q, { t: 'imp', F: (X, Y) => X * X + bb * Y * Y - c, x: x0, y: y0, ans });
  }

  // new L2: horizontal tangents of a cubic
  function dvHorizCubic(rng) {
    const dpLines = (g) => [tx('Yatay teğet ⇔ f\'(x) = 0', 'Horizontal tangent ⇔ f\'(x) = 0'), g];
    if (rng.nextInt(0, 2) === 0) {
      const s = rng.nextInt(1, 4), c = rng.nextInt(-4, 5);
      const q = mk(T.hor(), tx(`f(x) = ${polyStr(c, -3 * s * s, 0, 1)} eğrisinin teğeti hangi x değerlerinde yataydır?`, `At which x-values is the tangent to f(x) = ${polyStr(c, -3 * s * s, 0, 1)} horizontal?`),
        and2('x', -s, s),
        [[`x = ${s}`, tx('x² = s² denkleminin yalnızca pozitif kökünü aldın; ±s olmalı.', 'You took only the positive root of x² = s²; both ±s work.')],
          [and2('x', -s * s, s * s), tx('x² = s² denkleminden x = ±s yerine ±s² yazdın.', 'From x² = s² you wrote ±s² instead of ±s.')],
          [and2('x', -3 * s * s, 3 * s * s), tx('3x² = 3s² denklemini 3 ile bölmeden köklerini aldın.', 'You took roots of 3x² = 3s² without dividing by 3.')],
          ['x = 0', tx('x = 0 yalnızca x³ − 3s²x için bir ekstremum değildir; f\'(0) = −3s² ≠ 0.', 'x = 0 is not special here: f\'(0) = −3s² ≠ 0.')]],
        dpLines(`f'(x) = ${polyStr(-3 * s * s, 0, 3)} = 3(x − ${s})(x + ${s}) = 0`), rng);
      return chk(q, { t: 'zeros', g: (x) => 3 * x * x - 3 * s * s, zs: [-s, s], ans: and2('x', -s, s) });
    }
    const p = nz(rng, -3, 3);
    const lo = Math.min(0, -2 * p), hi = Math.max(0, -2 * p);
    const q = mk(T.hor(), tx(`f(x) = ${polyStr(0, 0, 3 * p, 1)} eğrisinin teğeti hangi x değerlerinde yataydır?`, `At which x-values is the tangent to f(x) = ${polyStr(0, 0, 3 * p, 1)} horizontal?`),
      and2('x', lo, hi),
      [[and2('x', Math.min(0, -p), Math.max(0, -p)), tx('f\'(x) = 3x² + 6px = 3x(x + 2p); ikinci kök −2p, −p değil.', 'f\'(x) = 3x² + 6px = 3x(x + 2p); the second root is −2p, not −p.')],
        [and2('x', Math.min(0, 2 * p), Math.max(0, 2 * p)), tx('İkinci kökün işaretini ters aldın.', 'You flipped the sign of the second root.')],
        [`x = ${-2 * p}`, tx('x = 0 kökünü (ortak x çarpanını) kaybettin.', 'You lost the root x = 0 (the common factor x).')],
        ['x = 0', tx('Ortak x çarpanından yalnızca x = 0 kökünü aldın; x + 2p = 0 kökü de var.', 'You took only x = 0 from the common factor; x + 2p = 0 gives another root.')]],
      dpLines(`f'(x) = ${polyStr(0, 6 * p, 3)} = 3x(x ${plus(2 * p)}) = 0`), rng);
    return chk(q, { t: 'zeros', g: (x) => 3 * x * x + 6 * p * x, zs: [0, -2 * p], ans: and2('x', lo, hi) });
  }

  // new L2: mean value / average = instantaneous
  function dvMeanRate(rng) {
    const p = nz(rng, -3, 3), q0 = rng.nextInt(-4, 5), a = rng.nextInt(0, 4), b = a + rng.nextInt(1, 5);
    const f = (t) => p * t * t + q0 * t;
    const ans = frac(a + b, 2);
    const q = mk(T.rate(),
      tx(`s(t) = ${tvar(polyStr(0, q0, p))} için [${a}, ${b}] aralığında anlık hız, ortalama hıza hangi t anında eşittir?`, `For s(t) = ${tvar(polyStr(0, q0, p))}, at what time t in [${a}, ${b}] does the instantaneous velocity equal the average velocity over the interval?`),
      ans,
      [[String(a + b), tx('2pt + q = p(a + b) + q denkleminde t = (a + b)/2 yerine t = a + b yazdın (2\'ye bölmeyi unuttun).', 'You wrote t = a + b instead of (a + b)/2 (you forgot to divide by 2).')],
        [frac(b - a, 2), tx('Aralığın yarı uzunluğunu aldın; orta nokta (a + b)/2 olmalı.', 'You took half the interval length; the midpoint is (a + b)/2.')],
        [frac(b, 2), tx('Orta nokta yerine b/2 yazdın.', 'You wrote b/2 instead of the midpoint (a + b)/2.')],
        [frac(a + b, 3), tx('Ortalamayı 2 yerine 3 ile böldün.', 'You divided by 3 instead of 2.')],
        [frac(a + b + 1, 2), tx('Orta noktayı hesaplarken küçük bir toplama hatası yaptın.', 'You made a small addition slip when computing the midpoint.')],
        [frac(a + b - 1, 2), tx('Orta noktayı hesaplarken küçük bir çıkarma hatası yaptın.', 'You made a small subtraction slip when computing the midpoint.')]],
      [`s'(t) = ${tvar(polyStr(q0, 2 * p))}`, tx(`Ortalama hız = (s(${b}) − s(${a}))/${b - a} = ${p * (a + b) + q0}`, `Average velocity = (s(${b}) − s(${a}))/${b - a} = ${p * (a + b) + q0}`),
        `${tvar(polyStr(q0, 2 * p))} = ${p * (a + b) + q0}  →  t = ${ans}`], rng);
    return chk(q, { t: 'mvt', f, a, b, ans });
  }

  // new L2: particle at rest
  function dvRestTimes(rng) {
    let p, r;
    do { p = rng.nextInt(0, 5); r = p + 2 * rng.nextInt(1, 3); } while (r > 7);
    const h = (p + r) / 2;
    const s = (t) => t ** 3 - 3 * h * t * t + 3 * p * r * t;
    const q = mk(T.high(),
      tx(`Bir cismin konumu s(t) = ${tvar(polyStr(0, 3 * p * r, -3 * h, 1))} (t ≥ 0) ile veriliyor. Cisim hangi anlarda durur (v = 0)?`, `A particle's position is s(t) = ${tvar(polyStr(0, 3 * p * r, -3 * h, 1))} (t ≥ 0). At which times is it at rest (v = 0)?`),
      and2('t', p, r),
      [[and2('t', -r, -p === 0 ? 0 : -p), tx('Çarpanlardan (t − p)(t − r) = 0 kökleri alırken işaretleri ters aldın.', 'From the factors (t − p)(t − r) = 0 you took the roots with the wrong signs.')],
        [`t = ${h}`, tx('Bu, ivmenin sıfır olduğu andır (s\'\' = 0), hızın değil.', 'This is where the acceleration is zero (s\'\' = 0), not the velocity.')],
        [`t = ${p + r}`, tx('İki kökün toplamını tek kök sandın.', 'You took the sum of the two roots as a single root.')],
        [`t = ${3 * p * r === 0 ? h + 1 : 3 * p * r}`, tx('Hız denkleminin sabit teriminden (3pr) kökü okudun.', 'You read the root from the constant term (3pr) of the velocity equation.')]],
      [`v(t) = s'(t) = ${tvar(polyStr(3 * p * r, -6 * h, 3))} = 3(t − ${p})(t − ${r})`, and2('t', p, r)], rng);
    return chk(q, { t: 'zeros', g: (t) => 3 * t * t - 6 * h * t + 3 * p * r, zs: [p, r], ans: and2('t', p, r), sf: s });
  }

  // new L2: |x - a| differentiability
  function dvDiffAbs(rng) {
    const a = rng.nextInt(-3, 4), c = rng.nextInt(1, 4), b = rng.nextInt(-3, 4);
    const sx = a === 0 ? 'x' : `x ${plus(-a)}`;
    const f = (x) => c * Math.abs(x - a) + b;
    const [lo, hi] = rangeY(f, a - 4, a + 4);
    const DNE = tx(`f'(${a}) yoktur (sol eğim ${-c}, sağ eğim ${c})`, `f'(${a}) does not exist (left slope ${-c}, right slope ${c})`);
    const q = mk(T.dif(),
      tx(`f(x) = ${c === 1 ? '' : c}|${sx}|${b === 0 ? '' : ' ' + plus(b)} fonksiyonu için aşağıdakilerden hangisi doğrudur?`, `Which statement is true for f(x) = ${c === 1 ? '' : c}|${sx}|${b === 0 ? '' : ' ' + plus(b)}?`),
      DNE,
      [[tx(`f'(${a}) = 0`, `f'(${a}) = 0`), tx('Burası en küçük değer noktasıdır ama grafik sivri bir köşedir; yatay teğet yoktur.', 'This is the minimum point, but the graph has a sharp corner; there is no horizontal tangent.')],
        [tx(`f'(${a}) = ${c}`, `f'(${a}) = ${c}`), tx('Yalnızca sağ taraftaki eğimi aldın; sol taraf −c eğimlidir.', 'You used only the right-hand slope; the left-hand slope is −c.')],
        [tx(`f'(${a}) = ${-c}`, `f'(${a}) = ${-c}`), tx('Yalnızca sol taraftaki eğimi aldın; sağ taraf +c eğimlidir.', 'You used only the left-hand slope; the right-hand slope is +c.')]],
      [tx(`x < ${a} için f' = ${-c}, x > ${a} için f' = ${c}`, `For x < ${a}, f' = ${-c}; for x > ${a}, f' = ${c}`), tx('Tek taraflı türevler farklı olduğundan türev yoktur (köşe).', 'The one-sided derivatives differ, so the derivative does not exist (corner).')], rng,
      new PlotSpec(a - 4, a + 4, lo, hi).addCurve(f));
    return chk(q, { t: 'none' });
  }

  // new L2: horizontal tangent from the graph
  function dvGraphZero(rng) {
    let h, k0;
    do { h = nz(rng, -3, 3); k0 = nz(rng, -4, 4); } while (k0 === h || k0 === -h);
    const s = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const f = (x) => s * (x - h) * (x - h) + k0;
    const [lo, hi] = rangeY(f, h - 4, h + 4);
    const q = mk(T.gr(),
      tx('Grafikte bir f fonksiyonu gösterilmiştir. f\'(x) = 0 olan x değeri hangisidir?', 'The graph of a function f is shown. At which value of x is f\'(x) = 0?'),
      `x = ${h}`,
      [[`x = ${k0}`, tx('Tepe noktasının y-koordinatını x değeri sandın; x-koordinatına bakmalısın.', 'You used the y-coordinate of the vertex as an x-value; read its x-coordinate.')],
        [`x = ${-h}`, tx('Tepe noktasının x-koordinatının işaretini ters okudun.', 'You read the sign of the vertex x-coordinate the wrong way.')],
        [`x = ${h + 1}`, tx('Tepe noktasını bir birim yanlış okudun.', 'You misread the vertex by one unit.')],
        [`x = ${h - 1}`, tx('Tepe noktasını bir birim yanlış okudun.', 'You misread the vertex by one unit.')]],
      [tx('Yatay teğetin olduğu nokta grafiğin tepe (ekstremum) noktasıdır.', 'The tangent is horizontal at the vertex (extremum) of the graph.'), tx(`Tepe noktasının x-koordinatı ${h}.`, `The vertex has x-coordinate ${h}.`)], rng,
      new PlotSpec(h - 4, h + 4, lo, hi).addCurve(f));
    return chk(q, { t: 'zeros', g: (x) => 2 * s * (x - h), zs: [h], ans: `x = ${h}` });
  }

  // new L2: slope of a tangent drawn on a graph
  function dvGraphTangent(rng) {
    let a, b, c, x0, m;
    do { a = rng.pick([-2, -1, 1, 2]); b = rng.nextInt(-3, 4); c = rng.nextInt(-3, 4); x0 = rng.nextInt(-2, 3); m = 2 * a * x0 + b; } while (m === 0 || Math.abs(m) > 5);
    const f = (x) => a * x * x + b * x + c;
    const y0 = f(x0), qx = x0 + 2, qy = y0 + 2 * m;
    const [lo, hi] = rangeY(f, x0 - 4, x0 + 4, [y0, qy, y0 - 2 * m]);
    const pl = new PlotSpec(x0 - 4, x0 + 4, lo, hi).addCurve(f)
      .addSegment(x0 - 2, y0 - 2 * m, x0 + 2, qy, true).addPoint(x0, y0, `P`).addPoint(qx, qy, 'Q');
    const q = mk(T.gr(),
      tx(`Grafikte y = f(x) eğrisi ve P(${x0}, ${y0}) noktasındaki teğeti (kesikli) gösterilmiştir. Teğet ayrıca Q(${qx}, ${qy}) noktasından geçer. f'(${x0}) kaçtır?`, `The graph shows y = f(x) and its tangent (dashed) at P(${x0}, ${y0}). The tangent also passes through Q(${qx}, ${qy}). What is f'(${x0})?`),
      String(m),
      [[String(2 * m), tx('Yalnızca yükselişi (Δy) aldın; Δx = 2\'ye bölmeyi unuttun.', 'You used only the rise (Δy); you forgot to divide by Δx = 2.')],
        [String(-m), tx('Δy ve Δx\'i ters sırayla çıkardın; işaret değişti.', 'You subtracted Δy and Δx in opposite orders; the sign flipped.')],
        [String(y0), tx('Eğim yerine P noktasının y-koordinatını yazdın.', 'You gave the y-coordinate of P instead of the slope.')]],
      [tx('Teğetin eğimi f\'(x₀)\'a eşittir.', 'The slope of the tangent equals f\'(x₀).'), `m = (${dif(qy, y0)}) / (${dif(qx, x0)}) = ${m}`], rng, pl);
    return chk(q, { t: 'val', f, x: x0, ord: 1, ans: String(m) });
  }

  // new L2: limit definition giving a derivative function
  function dvDefQuad(rng) {
    const a = nz(rng, -3, 3), b = rng.nextInt(-4, 5), c = nz(rng, -5, 5);
    const dp = (...cc) => `f'(x) = ${polyStr(...cc)}`;
    const q = mk(T.def(),
      tx(`f(x) = ${polyStr(c, b, a)} için lim(h→0) [f(x + h) − f(x)] / h limiti nedir?`, `For f(x) = ${polyStr(c, b, a)}, what is lim(h→0) [f(x + h) − f(x)] / h?`),
      dp(b, 2 * a),
      [[dp(b, a), tx('(x + h)² açılımındaki 2xh terimini 1xh almışsın; 2a·x olmalı.', 'You treated the 2xh term of (x + h)² as xh; it should give 2a·x.')],
        [dp(b + c, 2 * a), tx('Sabit terim farkta sadeleşir; türeve c eklememeliydin.', 'The constant cancels in the difference; c must not appear in the derivative.')],
        [dp(c, b, a), tx('Limit yerine f(x)\'in kendisini yazdın.', 'You wrote f(x) itself instead of the limit.')],
        [dp(0, b, 2 * a), tx('Üsleri bir azaltmadın; türev yerine "katsayıyı 2 ile çarpılmış" bir fonksiyon yazdın.', 'You did not lower the powers; you wrote a function with the coefficient doubled instead of the derivative.')]],
      [`f(x + h) − f(x) = ${sumS([ct(2 * a, 'xh'), ct(a, 'h²'), ct(b, 'h')])}`,
        tx('h ile böl ve h → 0 al:', 'Divide by h and let h → 0:'), dp(b, 2 * a)], rng);
    return chk(q, { t: 'expr', f: (x) => a * x * x + b * x + c, xs: [-1.3, 0.4, 1.9] });
  }

  // =====================================================================================================
  // LEVEL 3
  // =====================================================================================================

  // power of a trig function: chain rule applied twice
  function dvChainTrigPow(rng) {
    const n = rng.nextInt(2, 5), a = nz(rng, -4, 4), useSin = rng.nextInt(0, 2) === 0;
    const arg = ax(a);
    const dp = (s) => `f'(x) = ${s}`;
    const base = useSin ? 'sin' : 'cos', other = useSin ? 'cos' : 'sin';
    const sgn = useSin ? 1 : -1;
    const mkS = (k, powN, tr) => ct(k, `${pw(base, powN, arg)}·${other}(${arg})`);
    const ans = mkS(sgn * n * a, n - 1);
    const f = useSin ? (x) => Math.sin(a * x) ** n : (x) => Math.cos(a * x) ** n;
    const q = mk(T.chain(), tx(`f(x) = ${pw(base, n, arg)} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${pw(base, n, arg)}?`), dp(ans),
      [[dp(mkS(sgn * n, n - 1)), tx('En içteki ax ifadesinin türevi olan a çarpanını unuttun.', 'You forgot the factor a from the innermost expression ax.')],
        [dp(ct(sgn * n * a, pw(base, n - 1, arg))), tx(`${base} fonksiyonunun türevini (${useSin ? 'cos' : '−sin'}) zincire eklemeyi unuttun.`, `You left out the derivative of ${base} (${useSin ? 'cos' : '−sin'}) in the chain.`)],
        [dp(mkS(sgn * n * a, n)), tx('Kuvvet kuralında üssü bir azaltmayı unuttun.', 'You did not lower the power by one in the power rule.')],
        [dp(mkS(-sgn * n * a, n - 1)), tx(`${useSin ? 'sin' : 'cos'} x\'in türevinin işaretini karıştırdın.`, `You got the sign of the derivative of ${useSin ? 'sin' : 'cos'} wrong.`)]],
      [tx('Üç katmanlı zincir: (uⁿ)\' · (trig)\' · (ax)\'', 'Three-layer chain: (uⁿ)\' · (trig)\' · (ax)\''),
        `f' = ${n}·${pw(base, n - 1, arg)}·${useSin ? '' : '(-'}${other}(${arg})${useSin ? '' : ')'}·${par(a)}`, dp(ans)], rng);
    return chk(q, { t: 'expr', f, xs: [0.31, 0.57, 0.83].map((t) => t / Math.abs(a)) });
  }

  // nested compositions
  function dvChainNested(rng) {
    const a = rng.pick([2, 3]), v = rng.nextInt(0, 3);
    const dp = (s) => `f'(x) = ${s}`;
    let name, ans, wr, f, xsA, sol;
    if (v === 0) {
      const E = `e^(${a}x)`;
      name = `sin(${E})`; ans = `${a}${E}·cos(${E})`; f = (x) => Math.sin(Math.exp(a * x)); xsA = [-0.6, 0.1, 0.4];
      wr = [[`${E}·cos(${E})`, tx('e^(ax)\'in türevindeki a çarpanını unuttun.', 'You forgot the factor a from differentiating e^(ax).')],
        [`cos(${E})`, tx('İçteki e^(ax) fonksiyonunun türevini hiç çarpmadın.', 'You never multiplied by the derivative of the inner function e^(ax).')],
        [`${a}${E}·sin(${E})`, tx('sin\'in türevini sin sandın.', 'You took the derivative of sin as sin.')],
        [`-${a}${E}·cos(${E})`, tx('Gereksiz bir eksi işareti koydun.', 'You added an unneeded minus sign.')]];
      sol = [tx('Dıştan içe: sin → cos(·), sonra e^(ax) → a·e^(ax)', 'Outside in: sin → cos(·), then e^(ax) → a·e^(ax)'), dp(ans)];
    } else if (v === 1) {
      name = `ln(cos(${a}x))`; ans = `-${a}tan(${a}x)`; f = (x) => Math.log(Math.cos(a * x)); xsA = [0.05, 0.2, 0.35];
      wr = [[`${a}tan(${a}x)`, tx('cos\'un türevindeki eksi işaretini kaybettin.', 'You lost the minus sign from the derivative of cos.')],
        ['-tan(' + a + 'x)', tx('Sonda ax\'in türevi olan a çarpanını unuttun.', 'You forgot the final factor a from differentiating ax.')],
        [`-${a}cot(${a}x)`, tx('-sin/cos oranını cot sandın; sin/cos = tan.', 'You read −sin/cos as −cot; sin/cos is tan.')],
        [`-${a}/cos(${a}x)`, tx('Payda sin(ax) yerine 1 bıraktın; (ln u)\' = u\'/u ile u\' = −a·sin(ax) olmalı.', 'You left 1 in the numerator instead of sin(ax); (ln u)\' = u\'/u with u\' = −a·sin(ax).')]];
      sol = [`(ln u)' = u'/u,  u = cos(${a}x),  u' = -${a}sin(${a}x)`, `f' = -${a}sin(${a}x)/cos(${a}x)`, dp(ans)];
    } else {
      name = `e^(sin(${a}x))`; ans = `${a}cos(${a}x)·e^(sin(${a}x))`; f = (x) => Math.exp(Math.sin(a * x)); xsA = [-0.7, 0.2, 0.9];
      wr = [[`cos(${a}x)·e^(sin(${a}x))`, tx('Sinüsün içindeki ax\'in türevi olan a çarpanını unuttun.', 'You forgot the factor a from the argument ax of the sine.')],
        [`${a}·e^(sin(${a}x))`, tx('sin(ax)\'in türevi olan cos(ax) çarpanını unuttun.', 'You forgot the factor cos(ax) from differentiating sin(ax).')],
        [`${a}cos(${a}x)·e^(cos(${a}x))`, tx('Üsteki sin\'i cos\'a çevirdin; üs aynı kalmalı.', 'You changed the exponent sin into cos; the exponent stays the same.')],
        [`${a}sin(${a}x)·e^(sin(${a}x))`, tx('sin\'in türevini sin aldın.', 'You took the derivative of sin as sin.')]];
      sol = [`(e^u)' = e^u·u',  u = sin(${a}x),  u' = ${a}cos(${a}x)`, dp(ans)];
    }
    const q = mk(T.chain(), tx(`f(x) = ${name} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${name}?`), dp(ans), wr.map((w) => [dp(w[0]), w[1]]), sol, rng);
    return chk(q, { t: 'expr', f, xs: xsA });
  }

  // product of a power and a composite
  function dvProdChain(rng) {
    const m = rng.nextInt(2, 4), k = nz(rng, -3, 3);
    const dp = (s) => `f'(x) = ${s}`;
    if (rng.nextInt(0, 2) === 0) {
      const q = mk(T.prod(), tx(`f(x) = ${xp(m)}·${ex(k)} fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${xp(m)}·${ex(k)}?`),
        dp(`${xp(m - 1)}(${polyStr(m, k)})·${ex(k)}`),
        [[dp(`${xp(m - 1)}(${polyStr(m, 1)})·${ex(k)}`), tx('e^(kx)\'in türevindeki k çarpanını unuttun (zincir kuralı).', 'You forgot the factor k from differentiating e^(kx) (chain rule).')],
          [dp(`${ct(k, xp(m))}·${ex(k)}`), tx('Yalnızca uv\' terimini aldın; u\'v terimini unuttun.', 'You kept only the uv\' term and dropped u\'v.')],
          [dp(`${pc(m * k, m - 1)}·${ex(k)}`), tx('Her çarpanın türevini ayrı ayrı çarptın (u\'·v\').', 'You multiplied the derivatives separately (u\'·v\').')],
          [dp(`${xp(m)}(${polyStr(m, k)})·${ex(k)}`), tx('Ortak çarpan alırken x\'in üssünü bir azaltmayı unuttun.', 'When factoring out you forgot to lower the power of x.')]],
        ['(u·v)\' = u\'v + uv\'', `u = ${xp(m)},  v = ${ex(k)},  v' = ${k}${ex(k)}`, `f' = ${sumS([`${pc(m, m - 1)}·${ex(k)}`, `${ct(k, xp(m))}·${ex(k)}`])}`, dp(`${xp(m - 1)}(${polyStr(m, k)})·${ex(k)}`)], rng);
      return chk(q, { t: 'expr', f: (x) => x ** m * Math.exp(k * x), xs: [-0.7, 0.4, 1.1] });
    }
    const arg = ax(k);
    const ans = sumS([`${pc(m, m - 1)}·sin(${arg})`, ct(k, `${xp(m)}·cos(${arg})`)]);
    const q = mk(T.prod(), tx(`f(x) = ${xp(m)}·sin(${arg}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${xp(m)}·sin(${arg})?`), dp(ans),
      [[dp(sumS([`${pc(m, m - 1)}·sin(${arg})`, `${xp(m)}·cos(${arg})`])), tx('sin(kx)\'in türevindeki k çarpanını unuttun.', 'You forgot the factor k from differentiating sin(kx).')],
        [dp(sumS([`${pc(m, m - 1)}·sin(${arg})`, ct(-k, `${xp(m)}·cos(${arg})`)])), tx('İkinci terimin işaretini ters aldın.', 'You flipped the sign of the second term.')],
        [dp(`${pc(m, m - 1)}·${ct(k, `cos(${arg})`)}`), tx('Her çarpanın türevini ayrı ayrı çarptın (u\'·v\').', 'You multiplied the derivatives separately (u\'·v\').')],
        [dp(ct(k, `${xp(m)}·cos(${arg})`)), tx('Yalnızca uv\' terimini aldın; u\'v terimini unuttun.', 'You kept only uv\' and dropped u\'v.')]],
      ['(u·v)\' = u\'v + uv\'', `u = ${xp(m)},  v = sin(${arg}),  v' = ${k}cos(${arg})`, dp(ans)], rng);
    return chk(q, { t: 'expr', f: (x) => x ** m * Math.sin(k * x), xs: [-0.7, 0.4, 1.1] });
  }

  // quotient with an exponential numerator
  function dvQuotChain(rng) {
    const a = rng.pick([-2, -1, 1, 2]), b = nz(rng, -3, 3);
    const dp = (s) => `f'(x) = ${s}`;
    const den = `(${polyStr(b, 1)})²`;
    const fm = (num) => dp(`${ex(a)}(${num})/${den}`);
    const q = mk(T.quo(), tx(`f(x) = ${ex(a)}/(${polyStr(b, 1)}) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = ${ex(a)}/(${polyStr(b, 1)})?`),
      fm(polyStr(a * b - 1, a)),
      [[fm(polyStr(a * b + 1, a)), tx('Payda u\'v − uv\' yerine u\'v + uv\' aldın.', 'You used u\'v + uv\' in the numerator instead of u\'v − uv\'.')],
        [fm(polyStr(b - 1, 1)), tx('u = e^(ax)\'in türevindeki a çarpanını unuttun (zincir).', 'You forgot the factor a in the derivative of u = e^(ax) (chain rule).')],
        [fm(polyStr(1 - a * b, -a)), tx('Payı ters sırayla aldın (uv\' − u\'v); işaret yanlış.', 'You took the numerator in the wrong order (uv\' − u\'v); the sign is wrong.')],
        [dp(`${ex(a)}(${polyStr(a * b - 1, a)})/(${polyStr(b, 1)})`), tx('Paydayı karelemeyi unuttun.', 'You forgot to square the denominator.')]],
      ['(u/v)\' = (u\'v − uv\') / v²', `u = ${ex(a)},  u' = ${ct(a, ex(a))};  v = ${polyStr(b, 1)},  v' = 1`, `u'v − uv' = ${ex(a)}[${ct(a, `(${polyStr(b, 1)})`)} − 1] = ${ex(a)}(${polyStr(a * b - 1, a)})`, fm(polyStr(a * b - 1, a))], rng);
    return chk(q, { t: 'expr', f: (x) => Math.exp(a * x) / (x + b), xs: [0.6, 1.4, 2.3] });
  }

  // trig quotient that simplifies
  function dvQuotTrig(rng) {
    const a = rng.pick([1, 2, 3]), arg = ax(a), v = rng.nextInt(0, 2);
    const dp = (s) => `f'(x) = ${s}`;
    const nm = (s) => (a === 1 ? s : s);
    if (v === 0) {
      const q = mk(T.quo(), tx(`f(x) = sin(${arg})/(1 + cos(${arg})) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = sin(${arg})/(1 + cos(${arg}))?`),
        dp(`${a}/(1 + cos(${arg}))`),
        [[dp(`${-a}/(1 + cos(${arg}))`), tx('sin² + cos² = 1 sadeleşmesinde işareti kaybettin.', 'You lost the sign while using sin² + cos² = 1.')],
          [dp(`${a}/(1 + cos(${arg}))²`), tx('Payı sadeleştirdikten sonra paydayı hâlâ kare bıraktın (pay 1 + cos oldu, bir çarpan sadeleşir).', 'After simplifying the numerator you kept the square; one factor (1 + cos) cancels.')],
          [dp(`${ct(a, `cos(${arg})`)}/(1 + cos(${arg}))²`), tx('Payı u\'v − uv\' olarak hesaplamadın; yalnızca u\'yu aldın.', 'You used only u\' as the numerator instead of u\'v − uv\'.')],
          [dp(`${a}/(1 - cos(${arg}))`), tx('Paydadaki işareti ters aldın.', 'You flipped the sign inside the denominator.')]],
        ['(u/v)\' = (u\'v − uv\')/v²', `u'v − uv' = ${a}[cos(${arg})(1 + cos(${arg})) + sin²(${arg})] = ${a}(1 + cos(${arg}))`, tx('Bir (1 + cos) çarpanı sadeleşir.', 'One factor (1 + cos) cancels.'), dp(`${a}/(1 + cos(${arg}))`)], rng);
      return chk(q, { t: 'expr', f: (x) => Math.sin(a * x) / (1 + Math.cos(a * x)), xs: [0.3, 0.6, 0.9].map((t) => t / a) });
    }
    const q = mk(T.quo(), tx(`f(x) = cos(${arg})/(1 - sin(${arg})) fonksiyonunun türevi hangisidir?`, `Which is the derivative of f(x) = cos(${arg})/(1 - sin(${arg}))?`),
      dp(`${a}/(1 - sin(${arg}))`),
      [[dp(`${-a}/(1 - sin(${arg}))`), tx('Sadeleşme sırasında işaret kaybettin.', 'You lost a sign while simplifying.')],
        [dp(`${a}/(1 - sin(${arg}))²`), tx('Sadeleştirmeden sonra paydayı kare bıraktın; bir çarpan sadeleşir.', 'After simplifying you kept the square; one factor cancels.')],
        [dp(`${a}/(1 + sin(${arg}))`), tx('Paydadaki işareti ters aldın.', 'You flipped the sign inside the denominator.')],
        [dp(`${ct(-a, `sin(${arg})`)}/(1 - sin(${arg}))²`), tx('Payda yalnızca u\' = −a·sin(ax) aldın; u\'v − uv\' hesaplanmalıydı.', 'You used only u\' = −a·sin(ax) as numerator instead of u\'v − uv\'.')]],
      ['(u/v)\' = (u\'v − uv\')/v²', `u'v − uv' = ${a}[−sin(${arg})(1 − sin(${arg})) + cos²(${arg})] = ${a}(1 − sin(${arg}))`, tx('Bir (1 − sin) çarpanı sadeleşir.', 'One factor (1 − sin) cancels.'), dp(`${a}/(1 - sin(${arg}))`)], rng);
    return chk(q, { t: 'expr', f: (x) => Math.cos(a * x) / (1 - Math.sin(a * x)), xs: [0.3, 0.6, 0.9].map((t) => -t / a) });
  }

  // tangent line to an implicit curve (standard form)
  function dvImpTangent(rng) {
    let x0, y0;
    do { x0 = nz(rng, -3, 3); y0 = nz(rng, -3, 3); } while (2 * x0 + y0 === 0 || x0 + 2 * y0 === 0);
    const A = 2 * x0 + y0, B = x0 + 2 * y0, c = x0 * x0 + x0 * y0 + y0 * y0;
    const F = (x, y) => x * x + x * y + y * y - c;
    const ans = std(A, B, 2 * c);
    const q = mk(T.imp(),
      tx(`x² + xy + y² = ${c} eğrisinin (${x0}, ${y0}) noktasındaki teğetinin denklemi hangisidir?`, `Which is the equation of the tangent to the curve x² + xy + y² = ${c} at the point (${x0}, ${y0})?`),
      ans,
      [[std(B, A, 2 * c), tx('Katsayıları yer değiştirdin (Fₓ ile F_y karışmış).', 'You swapped the coefficients (Fₓ and F_y mixed up).')],
        [std(B, -A, B * x0 - A * y0), tx('Bu, teğetin değil normalin denklemidir.', 'This is the equation of the normal, not the tangent.')],
        [std(A, B, c), tx('Sabit terimi 2c yerine c aldın; (x₀, y₀) denklemi sağlamalıdır.', 'You used c instead of 2c on the right; the point (x₀, y₀) must satisfy the equation.')],
        [std(2 * x0, B, 2 * x0 * x0 + B * y0), tx('xy teriminin türevindeki y\'yi (y·1) unuttun: Fₓ = 2x + y olmalı.', 'You forgot the y from differentiating xy: Fₓ should be 2x + y.')]],
      [tx('Her iki tarafı türet: 2x + y + x·y\' + 2y·y\' = 0', 'Differentiate: 2x + y + x·y\' + 2y·y\' = 0'), `y' = -(2x + y)/(x + 2y) = ${frac(-A, B)}`,
        `${A}(x − ${par(x0)}) + ${B}(y − ${par(y0)}) = 0  →  ${ans}`], rng,
      (() => { const p = new PlotSpec(-5, 5, -5, 5); p.addPoint(x0, y0, 'P'); p.addCurve((t) => { const D = t * t - 4 * (t * t - c); return D < 0 ? NaN : (-t + Math.sqrt(D)) / 2; }); p.addCurve((t) => { const D = t * t - 4 * (t * t - c); return D < 0 ? NaN : (-t - Math.sqrt(D)) / 2; }); return p; })());
    return chk(q, { t: 'gradline', F, x: x0, y: y0, ans, kind: 'tan' });
  }

  // slope on an implicit curve (product terms)
  function dvImpSlope(rng) {
    if (rng.nextInt(0, 3) === 0) {
      const P = rng.pick([[2, 4], [4, 2]]);
      const [x0, y0] = P;
      const ans = frac(3 * y0 - x0 * x0, y0 * y0 - 3 * x0);
      const q = mk(T.imp(), tx(`x³ + y³ = 9xy eğrisinde (${x0}, ${y0}) noktasındaki dy/dx kaçtır?`, `On the curve x³ + y³ = 9xy, what is dy/dx at the point (${x0}, ${y0})?`), ans,
        [[frac(x0 * x0 - 3 * y0, y0 * y0 - 3 * x0), tx('y\' terimlerini toplarken işaret hatası yaptın.', 'You made a sign error while collecting the y\' terms.')],
          [frac(y0 * y0 - 3 * x0, 3 * y0 - x0 * x0), tx('Kesri ters çevirdin (y\' yalnız bırakılırken pay ve payda karıştı).', 'You inverted the fraction (numerator and denominator swapped when isolating y\').')],
          [frac(3 * y0 - x0 * x0, y0 * y0 + 3 * x0), tx('Paydadaki 9x·y türevinden gelen −9x/3 teriminin işaretini yanlış aldın.', 'You got the sign of the term from the derivative of 9xy wrong in the denominator.')],
          [frac(3 * y0 + x0 * x0, y0 * y0 - 3 * x0), tx('Paydaki x² teriminin işaretini yanlış taşıdın.', 'You moved the x² term across with the wrong sign.')]],
        [tx('Türet: 3x² + 3y²·y\' = 9y + 9x·y\'', 'Differentiate: 3x² + 3y²·y\' = 9y + 9x·y\''), 'y\'(3y² − 9x) = 9y − 3x²  →  y\' = (3y − x²)/(y² − 3x)', `y' = ${ans}`], rng);
      return chk(q, { t: 'imp', F: (X, Y) => X ** 3 + Y ** 3 - 9 * X * Y, x: x0, y: y0, ans });
    }
    let x0, y0;
    do { x0 = nz(rng, -3, 3); y0 = nz(rng, -3, 3); } while (x0 + 2 * y0 === 0);
    const c = x0 * x0 * y0 + x0 * y0 * y0;
    const num = 2 * x0 * y0 + y0 * y0, den = x0 * x0 + 2 * x0 * y0;
    const ans = frac(-num, den);
    const q = mk(T.imp(), tx(`x²y + xy² = ${c} eğrisinde (${x0}, ${y0}) noktasındaki dy/dx kaçtır?`, `On the curve x²y + xy² = ${c}, what is dy/dx at the point (${x0}, ${y0})?`), ans,
      [[frac(num, den), tx('y\' için çözerken eksi işaretini kaybettin.', 'You lost the minus sign when solving for y\'.')],
        [frac(-num, x0 * x0), tx('xy² teriminin türevindeki 2xy·y\' kısmını unuttun.', 'You dropped the 2xy·y\' part from the derivative of xy².')],
        [num === 0 ? String(-den) : frac(-den, num), tx('Kesri ters çevirdin (pay ve payda yer değiştirdi).', 'You inverted the fraction.')],
        [frac(-(2 * x0 * y0), den), tx('xy² teriminin türevindeki y² kısmını unuttun (çarpım kuralı).', 'You dropped the y² part from the derivative of xy² (product rule).')]],
      [tx('Çarpım kuralıyla türet: 2xy + x²y\' + y² + 2xy·y\' = 0', 'Differentiate with the product rule: 2xy + x²y\' + y² + 2xy·y\' = 0'), 'y\' = −(2xy + y²)/(x² + 2xy)', `y' = −(${num})/(${den}) = ${ans}`], rng);
    return chk(q, { t: 'imp', F: (X, Y) => X * X * Y + X * Y * Y - c, x: x0, y: y0, ans });
  }

  // second derivative of the circle
  function dvImpSecond(rng) {
    const t = rng.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13]]);
    const x0 = t[0] * (rng.nextInt(0, 2) === 0 ? 1 : -1), y0 = t[1] * (rng.nextInt(0, 2) === 0 ? 1 : -1), r = t[2];
    const ans = frac(-r * r, y0 * y0 * y0);
    const sgn = y0 > 0 ? 1 : -1;
    const f = (x) => sgn * Math.sqrt(r * r - x * x);
    const q = mk(T.imp(),
      tx(`x² + y² = ${r * r} çemberinde (${x0}, ${y0}) noktasında d²y/dx² kaçtır?`, `On the circle x² + y² = ${r * r}, what is d²y/dx² at the point (${x0}, ${y0})?`), ans,
      [[frac(r * r, y0 * y0 * y0), tx('İşaret hatası: y\'\' = −(x² + y²)/y³, eksi işareti korunmalı.', 'Sign error: y\'\' = −(x² + y²)/y³; the minus sign must stay.')],
        [frac(-r * r, y0 * y0), tx('Paydadaki y³ yerine y² yazdın (bölüm kuralında v² = y² idi, ama pay y ile sadeleşir).', 'You wrote y² in the denominator instead of y³ (one factor y cancels in the quotient rule).')],
        [frac(-x0, y0), tx('Bu birinci türevdir; ikinci türevi almadın.', 'This is the first derivative; you did not differentiate again.')],
        [frac(-1, y0), tx('y\'\' = −(y − x·y\')/y² ifadesinde x·y\' terimini unuttun.', 'In y\'\' = −(y − x·y\')/y² you dropped the x·y\' term.')]],
      ['y\' = −x/y', 'y\'\' = −(y − x·y\')/y² = −(y + x²/y)/y² = −(x² + y²)/y³ = −r²/y³', `y'' = −${r * r}/(${y0})³ = ${ans}`], rng,
      circlePlot(r, x0, y0));
    return chk(q, { t: 'val', f, x: x0, ord: 2, ans });
  }

  // tangent parallel to a given line
  function dvTangentParallel(rng) {
    let r1, r2;
    do { r1 = rng.nextInt(-3, 3); r2 = rng.nextInt(-3, 4); } while (r1 >= r2 || (r1 + r2) % 2 !== 0);
    const m = nz(rng, -5, 5), n = rng.nextInt(-4, 5);
    const bb = -3 * (r1 + r2) / 2, cc = m + 3 * r1 * r2;
    const f = (x) => x ** 3 + bb * x * x + cc * x;
    const q = mk(T.tan(),
      tx(`f(x) = ${polyStr(0, cc, bb, 1)} eğrisinin teğetinin y = ${lineStr(m, n).slice(4)} doğrusuna paralel olduğu x değerleri hangileridir?`, `At which x-values is the tangent to f(x) = ${polyStr(0, cc, bb, 1)} parallel to the line y = ${lineStr(m, n).slice(4)}?`),
      and2('x', r1, r2),
      [[and2('x', -r2, -r1), tx('f\'(x) = m denklemini çözerken köklerin işaretini ters aldın.', 'You flipped the signs of the roots when solving f\'(x) = m.')],
        [`x = ${r1}`, tx('İkinci kökü kaybettin; ikinci dereceden denklemin iki çözümü vardır.', 'You lost the second root; the quadratic has two solutions.')],
        [`x = ${(r1 + r2) / 2}`, tx('Bu, f\'\'(x) = 0 noktasıdır (f\' için tepe); f\'(x) = m denkleminin kökü değildir.', 'This is where f\'\'(x) = 0 (the vertex of f\'); it is not a root of f\'(x) = m.')],
        [and2('x', r1, r2 + 1), tx('İkinci kökte küçük bir hesap hatası yaptın.', 'You made a small slip in the second root.')]],
      [tx(`Paralel ⇔ aynı eğim: f'(x) = ${m}`, `Parallel ⇔ same slope: f'(x) = ${m}`), `${polyStr(cc, 2 * bb, 3)} = ${m}  →  3${r1 === 0 ? 'x' : `(x ${plus(-r1)})`}${r2 === 0 ? 'x' : `(x ${plus(-r2)})`} = 0`, and2('x', r1, r2)], rng);
    return chk(q, { t: 'zeros', g: (x) => 3 * x * x + 2 * bb * x + cc - m, zs: [r1, r2], ans: and2('x', r1, r2) });
  }

  // tangent line to a square root
  function dvTangentSqrt(rng) {
    const p = nz(rng, -4, 4), s = rng.nextInt(1, 5), k = rng.nextInt(-2, 4);
    const qq = s * s - p * k;
    const f = (x) => Math.sqrt(p * x + qq);
    const ans = std(p, -2 * s, p * k - 2 * s * s);
    const q = mk(T.tan(),
      tx(`y = √(${polyStr(qq, p)}) eğrisinin (${k}, ${s}) noktasındaki teğetinin denklemi hangisidir?`, `Which is the equation of the tangent to y = √(${polyStr(qq, p)}) at the point (${k}, ${s})?`),
      ans,
      [[std(p, -s, p * k - s * s), tx('√u\'nun türevindeki 2 çarpanını unuttun (eğim p/(2s) olmalı).', 'You forgot the 2 in the derivative of √u (the slope must be p/(2s)).')],
        [std(2 * s, -p, 2 * s * k - p * s), tx('Eğimi ters yazdın (2s/p).', 'You inverted the slope (2s/p).')],
        [std(p, 2 * s, p * k + 2 * s * s), tx('Eğimin işaretini ters aldın.', 'You flipped the sign of the slope.')],
        [std(p, -2 * s, p * k), tx('Doğrunun (k, s) noktasından geçmesini sağlamadın; sabit terim hatalı.', 'You did not force the line through (k, s); the constant is wrong.')]],
      [`y' = ${p}/(2√(${polyStr(qq, p)}))  →  m = ${p}/(2·${s}) = ${frac(p, 2 * s)}`, `y − ${s} = ${frac(p, 2 * s)}(x − ${par(k)})`, `${ans}`], rng,
      (() => { const lo = Math.min(...[k - 3, k + 3].map(f).filter(isFinite), 0), hi = Math.max(...[k - 3, k + 3].map(f).filter(isFinite), s) + 1; return new PlotSpec(k - 3, k + 3, lo - 1, hi + 1).addCurve(f).addPoint(k, s, 'P'); })());
    return chk(q, { t: 'std', f, k, kind: 'tan', ans });
  }

  // second derivative of a product
  function dvHigherProduct(rng) {
    const dp2 = (s) => `f''(x) = ${s}`;
    if (rng.nextInt(0, 2) === 0) {
      const a = rng.pick([-3, -2, 2, 3]), E = ex(a);
      const q = mk(T.high(), tx(`f(x) = x·${E} fonksiyonunun ikinci türevi hangisidir?`, `What is the second derivative of f(x) = x·${E}?`),
        dp2(`(${polyStr(2 * a, a * a)})·${E}`),
        [[dp2(`(${polyStr(1, a)})·${E}`), tx('Bu birinci türevdir; ikinci kez türev almadın.', 'This is the first derivative; you did not differentiate a second time.')],
          [dp2(`(${polyStr(a + 1, a)})·${E}`), tx('İkinci türevde e^(ax)\'in türevindeki a çarpanını unuttun.', 'In the second differentiation you forgot the factor a from e^(ax).')],
          [dp2(`(${polyStr(2 * a, a)})·${E}`), tx('Katsayıdaki a² yerine a yazdın (a çarpanı iki kez gelmeli).', 'You wrote a instead of a² (the factor a appears twice).')],
          [dp2(`(${polyStr(2, a * a)})·${E}`), tx('İlk terimde 2a yerine 2 yazdın.', 'You wrote 2 instead of 2a in the constant term.')]],
        [`f'(x) = ${sumS([E, `${ct(a, 'x')}·${E}`])} = (${polyStr(1, a)})${E}`, `f''(x) = ${ct(a, E)} + ${ct(a, `(${polyStr(1, a)})${E}`)}`, dp2(`(${polyStr(2 * a, a * a)})·${E}`)], rng);
      return chk(q, { t: 'expr', f: (x) => x * Math.exp(a * x), ord: 2, xs: [-0.7, 0.3, 0.8] });
    }
    const a = nz(rng, -3, 3), arg = ax(a);
    const ans = sumS([ct(2 * a, `cos(${arg})`), ct(-a * a, `x·sin(${arg})`)]);
    const q = mk(T.high(), tx(`f(x) = x·sin(${arg}) fonksiyonunun ikinci türevi hangisidir?`, `What is the second derivative of f(x) = x·sin(${arg})?`), dp2(ans),
      [[dp2(sumS([ct(2 * a, `cos(${arg})`), ct(a * a, `x·sin(${arg})`)])), tx('cos(ax)\'in türevindeki eksi işaretini unuttun.', 'You forgot the minus sign from the derivative of cos(ax).')],
        [dp2(sumS([ct(a, `cos(${arg})`), ct(-a * a, `x·sin(${arg})`)])), tx('İlk terimde 2a yerine a yazdın (iki türevden de a·cos gelir).', 'You wrote a instead of 2a in the first term (both differentiations contribute a·cos).')],
        [dp2(sumS([ct(2 * a, `cos(${arg})`), ct(-a, `x·sin(${arg})`)])), tx('İkinci terimde a² yerine a yazdın (zincir çarpanı iki kez gelir).', 'You wrote a instead of a² in the second term (the chain factor appears twice).')],
        [dp2(sumS([`sin(${arg})`, ct(a, `x·cos(${arg})`)])), tx('Bu birinci türevdir; ikinci türevi almadın.', 'This is the first derivative; you did not differentiate again.')]],
      [`f'(x) = ${sumS([`sin(${arg})`, `${ct(a, 'x')}·cos(${arg})`])}`, `f''(x) = ${sumS([ct(a, `cos(${arg})`), ct(a, `cos(${arg})`), ct(-a * a, `x·sin(${arg})`)])}`, dp2(ans)], rng);
    return chk(q, { t: 'expr', f: (x) => x * Math.sin(a * x), ord: 2, xs: [-0.7, 0.3, 0.8] });
  }

  // n-th derivative of sin/cos
  function dvNthDeriv(rng) {
    const k = rng.pick([2, 3]), n = k === 2 ? rng.nextInt(5, 12) : rng.nextInt(5, 8), useSin = rng.nextInt(0, 2) === 0;
    const mag = ipow(k, n), r = n % 4;
    const table = useSin ? [[1, 'sin'], [1, 'cos'], [-1, 'sin'], [-1, 'cos']] : [[1, 'cos'], [-1, 'sin'], [-1, 'cos'], [1, 'sin']];
    const [sg, fn] = table[r];
    const arg = ax(k), base = useSin ? 'sin' : 'cos';
    const form = (s, g, mg) => `f^(${n})(x) = ${ct(s * mg, `${g}(${arg})`)}`;
    const wrongs = [];
    for (const [s2, g2] of [[1, 'sin'], [1, 'cos'], [-1, 'sin'], [-1, 'cos']]) if (!(s2 === sg && g2 === fn)) wrongs.push([form(s2, g2, mag), tx('Türevler 4\'lük bir döngü izler; döngüdeki konumu (n mod 4) yanlış belirledin.', 'The derivatives repeat in a cycle of 4; you picked the wrong position in the cycle (n mod 4).')]);
    wrongs.push([form(sg, fn, k * n), tx('Zincir çarpanı k her türevde gelir: kⁿ olmalı, k·n değil.', 'The chain factor k appears at every step: it is kⁿ, not k·n.')]);
    const q = mk(T.high(), tx(`f(x) = ${base}(${arg}) için f^(${n})(x) nedir? (n-inci türev)`, `For f(x) = ${base}(${arg}), what is f^(${n})(x)? (the ${n}th derivative)`), form(sg, fn, mag), wrongs,
      [tx(`Her türev bir k = ${k} çarpanı getirir: ${k}^${n} = ${mag}.`, `Each derivative brings a factor k = ${k}: ${k}^${n} = ${mag}.`),
        tx(`Fonksiyon döngüsü 4'lüktür; ${n} mod 4 = ${r}.`, `The functions cycle with period 4; ${n} mod 4 = ${r}.`), form(sg, fn, mag)], rng);
    return chk(q, { t: 'eq', f: (x) => mag * (useSin ? Math.sin(k * x + n * Math.PI / 2) : Math.cos(k * x + n * Math.PI / 2)), xs: [0.3, 0.9, 1.7] });
  }

  // piecewise function: find parameters for differentiability
  function dvDiffPiece(rng) {
    const c = nz(rng, -3, 3), p = nz(rng, -3, 3);
    const qv = 2 * c + p, rv = -c * c;
    const ans = `q = ${qv}, r = ${rv}`;
    const q = mk(T.dif(),
      tx(`f(x) = ${polyStr(0, p, 1)}  (x ≤ ${c}),  f(x) = qx + r  (x > ${c}) fonksiyonu x = ${c} noktasında türevlenebilir ise q ve r kaçtır?`, `If f(x) = ${polyStr(0, p, 1)}  (x ≤ ${c}),  f(x) = qx + r  (x > ${c}) is differentiable at x = ${c}, what are q and r?`),
      ans,
      [[`q = ${qv}, r = ${c * c}`, tx('Süreklilikten r = f(c) − qc hesaplarken işareti kaybettin.', 'You lost the sign when computing r = f(c) − qc from continuity.')],
        [`q = ${2 * c}, r = ${rv}`, tx('Sol parçanın türevinde p\'yi (2c + p) unuttun.', 'You forgot the p in the left-hand derivative (2c + p).')],
        [`q = ${c + p}, r = 0`, tx('x² teriminin türevini c aldın (2c olmalı); r de buna göre yanlış çıktı.', 'You took the derivative of x² as c (it is 2c); r then comes out wrong.')],
        [`q = ${qv}, r = ${c * c + p * c}`, tx('r\'yi f(c) olarak aldın; süreklilik qc + r = f(c) olmalı.', 'You took r = f(c); continuity requires qc + r = f(c).')]],
      [tx('Türevlenebilirlik için hem süreklilik hem eşit tek taraflı türevler gerekir.', 'Differentiability needs continuity and equal one-sided derivatives.'),
        tx(`Türev eşitliği: q = 2·${par(c)} ${plus(p)} = ${qv}`, `Equal derivatives: q = 2·${par(c)} ${plus(p)} = ${qv}`),
        tx(`Süreklilik: ${qv}·${par(c)} + r = ${c * c + p * c}  →  r = ${rv}`, `Continuity: ${qv}·${par(c)} + r = ${c * c + p * c}  →  r = ${rv}`)], rng);
    return chk(q, { t: 'diffpiece', c, p, ans });
  }

  // type of non-smooth behaviour at a point
  const DT = () => ({
    corner: tx('Köşe: sol ve sağ eğimler farklı ve sonlu', 'Corner: the left and right slopes differ and are both finite'),
    cusp: tx('Sivri uç (cusp): eğimler −∞ ve +∞\'a gider', 'Cusp: the slopes tend to −∞ and +∞'),
    vert: tx('Düşey teğet: eğimler iki yanda da +∞\'a gider', 'Vertical tangent: the slopes tend to +∞ on both sides'),
    smooth: tx('Türevlenebilir: f\'(a) = 0 (yatay teğet)', 'Differentiable: f\'(a) = 0 (horizontal tangent)'),
  });
  function dvDiffType(rng) {
    const a = rng.nextInt(-3, 4), sx = a === 0 ? 'x' : `x ${plus(-a)}`, sp = a === 0 ? 'x' : `(x ${plus(-a)})`;
    const cases = [
      { t: 'corner', s: `|${sx}|`, f: (x) => Math.abs(x - a) },
      { t: 'cusp', s: `${sp}^(2/3)`, f: (x) => Math.cbrt((x - a) ** 2) },
      { t: 'cusp', s: `√|${sx}|`, f: (x) => Math.sqrt(Math.abs(x - a)) },
      { t: 'vert', s: `${sp}^(1/3)`, f: (x) => Math.cbrt(x - a) },
      { t: 'smooth', s: `${sp}^(4/3)`, f: (x) => Math.cbrt((x - a) ** 4) },
      { t: 'smooth', s: `${sp}² `.trim(), f: (x) => (x - a) ** 2 },
    ];
    const cs = rng.pick(cases), D = DT();
    const why = {
      corner: tx(`${sx} ifadesinin mutlak değeri x = ${a}'da keskin bir köşe yapar; eğimler −1 ve +1.`, `The absolute value of ${sx} makes a sharp corner at x = ${a}; slopes −1 and +1.`),
      cusp: tx('Sol tarafta eğim −∞, sağ tarafta +∞ olur; grafik sivri bir uç yapar.', 'On the left the slope tends to −∞, on the right to +∞; the graph has a cusp.'),
      vert: tx('Türev (1/3)(x − a)^(−2/3) iki yanda da +∞\'a gider; teğet düşeydir.', 'The derivative (1/3)(x − a)^(−2/3) tends to +∞ on both sides; the tangent is vertical.'),
      smooth: tx('Türev 0\'a gider; teğet yataydır ve türev vardır.', 'The derivative tends to 0; the tangent is horizontal and f\'(a) exists.'),
    };
    const nt = {
      corner: tx('Eğimlerin sonlu ve farklı olması köşe demektir; burada eğimler sonsuza gidiyor ya da sıfır.', 'Finite but different slopes mean a corner; here the slopes blow up or vanish instead.'),
      cusp: tx('Sivri uçta eğimler zıt işaretli sonsuza gider; burada davranış farklı.', 'A cusp needs infinite slopes of opposite signs; the behaviour here is different.'),
      vert: tx('Düşey teğette eğimler iki yanda da aynı işaretli sonsuza gider; burada davranış farklı.', 'A vertical tangent needs infinite slopes of the same sign on both sides; the behaviour here is different.'),
      smooth: tx('Türevin var olması için tek taraflı eğimlerin sonlu ve eşit olması gerekir; burada öyle değil.', 'A derivative requires finite and equal one-sided slopes; that is not the case here.'),
    };
    const order = ['corner', 'cusp', 'vert', 'smooth'];
    const [lo, hi] = rangeY(cs.f, a - 3, a + 3);
    const q = mk(T.dif(), tx(`f(x) = ${cs.s} fonksiyonunun grafiği x = ${a} noktasında nasıl davranır?`, `How does the graph of f(x) = ${cs.s} behave at x = ${a}?`), D[cs.t],
      order.filter((o) => o !== cs.t).map((o) => [D[o], nt[o]]),
      [why[cs.t]], rng, new PlotSpec(a - 3, a + 3, lo, hi).addCurve(cs.f).addPoint(a, cs.f(a), 'P'));
    return chk(q, { t: 'dtype', f: cs.f, a, type: cs.t });
  }

  // derivative graph: local max / min of f
  function dvGraphDerivExt(rng) {
    const r1 = rng.nextInt(-4, 1), r2 = r1 + rng.nextInt(2, 5), s = rng.nextInt(0, 2) === 0 ? 1 : -1, wantMax = rng.nextInt(0, 2) === 0;
    const g = (x) => s * (x - r1) * (x - r2);
    const maxAt = s > 0 ? r1 : r2, minAt = s > 0 ? r2 : r1;
    const target = wantMax ? maxAt : minAt, other = wantMax ? minAt : maxAt;
    const mid = (r1 + r2) / 2;
    const [lo, hi] = rangeY(g, r1 - 2, r2 + 2);
    const pl = new PlotSpec(r1 - 2.5, r2 + 2.5, lo, hi).addCurve(g).addPoint(r1, 0, '').addPoint(r2, 0, '');
    const word = wantMax ? tx('yerel maksimumu', 'local maximum') : tx('yerel minimumu', 'local minimum');
    const ans = `x = ${target}`;
    const q = mk(T.gr(),
      tx(`Grafik, bir f fonksiyonunun TÜREVİ olan f'(x) fonksiyonunun grafiğidir. f hangi x değerinde ${word}ne sahiptir?`, `The graph shows the DERIVATIVE f'(x) of a function f. At which value of x does f have its ${word}?`),
      ans,
      [[`x = ${other}`, tx(`Diğer kritik noktayı seçtin: orada f' işaret değiştirir ama ${wantMax ? 'minimum' : 'maksimum'} oluşur.`, `You picked the other critical point: f' also changes sign there, but it gives a ${wantMax ? 'minimum' : 'maximum'}.`)],
        [`x = ${frac(r1 + r2, 2)}`, tx('Bu, f\'nin grafiğinin tepe noktasıdır (f\'\' = 0); f\'nin kökü değildir.', 'This is the vertex of the graph of f\' (f\'\' = 0); it is not a root of f\'.')],
        [`x = ${-target}`, tx('Kökün işaretini ters okudun.', 'You read the sign of the root the wrong way.')],
        ['x = 0', tx('f\' = 0 olan noktalar x = 0 değil, grafiğin x-eksenini kestiği noktalardır.', 'f\' = 0 where the graph crosses the x-axis, not necessarily at x = 0.')],
        [`x = ${target + 1}`, tx('Kökü bir birim yanlış okudun.', 'You misread the root by one unit.')],
        [`x = ${target - 1}`, tx('Kökü bir birim yanlış okudun.', 'You misread the root by one unit.')],
        [`x = ${-other}`, tx('Diğer kökü seçip işaretini de ters okudun.', 'You picked the other root and also misread its sign.')]],
      [tx('Kritik noktalar f\' = 0 olan yerlerdir (grafik x-eksenini keser).', 'Critical points are where f\' = 0 (the graph crosses the x-axis).'),
        wantMax ? tx('Maksimum: f\' pozitiften negatife geçer.', 'Maximum: f\' changes from positive to negative.') : tx('Minimum: f\' negatiften pozitife geçer.', 'Minimum: f\' changes from negative to positive.'), ans], rng, pl);
    return chk(q, { t: 'ext', g, root: target, kind: wantMax ? 'max' : 'min' });
  }

  // horizontal tangents of x^2 e^{-kx} / x e^{-kx}
  function dvHorizExp(rng) {
    const k = rng.pick([1, 2, 4]), E = ex(-k);
    if (rng.nextInt(0, 3) !== 0) {
      const r = frac(2, k);
      const ans = `x = 0 ${tx('ve', 'and')} x = ${r}`;
      const q = mk(T.hor(), tx(`f(x) = x²·${E} eğrisinin teğeti hangi x değerlerinde yataydır?`, `At which x-values is the tangent to f(x) = x²·${E} horizontal?`), ans,
        [['x = 0', tx(`Ortak x çarpanından yalnızca x = 0'ı aldın; 2 − ${cf(k)}x = 0 kökünü kaybettin.`, `You took only x = 0 from the common factor; you lost the root of 2 − ${cf(k)}x = 0.`)],
          [`x = 0 ${tx('ve', 'and')} x = ${frac(-2, k)}`, tx(`2 − ${cf(k)}x = 0 denkleminde işareti ters çözdün.`, `You solved 2 − ${cf(k)}x = 0 with the wrong sign.`)],
          [`x = 0 ${tx('ve', 'and')} x = ${frac(k, 2)}`, tx(`2 − ${cf(k)}x = 0 denkleminden x = ${k}/2 yazdın (ters).`, `From 2 − ${cf(k)}x = 0 you wrote x = ${k}/2 (inverted).`)],
          [`x = ${r}`, tx('Ortak x çarpanının verdiği x = 0 kökünü unuttun.', 'You forgot the root x = 0 given by the common factor x.')],
          [`x = 0 ${tx('ve', 'and')} x = ${2 * k}`, tx(`2 − ${cf(k)}x = 0 denkleminde ${k}'ya bölmek yerine çarptın.`, `In 2 − ${cf(k)}x = 0 you multiplied by ${k} instead of dividing.`)]],
        [`f'(x) = 2x·${E} − ${cf(k)}x²·${E} = x(2 − ${cf(k)}x)·${E}`, tx(`${E} hiç 0 olmaz; x(2 − ${cf(k)}x) = 0`, `${E} is never 0; x(2 − ${cf(k)}x) = 0`), ans], rng);
      return chk(q, { t: 'zeros', g: (x) => x * (2 - k * x), zs: [0, 2 / k], ans, fdiff: (x) => x * x * Math.exp(-k * x) });
    }
    const r = frac(1, k);
    const ans = `x = ${r}`;
    const q = mk(T.hor(), tx(`f(x) = x·${E} eğrisinin teğeti hangi x değerinde yataydır?`, `At which x-value is the tangent to f(x) = x·${E} horizontal?`), ans,
      [[`x = ${frac(-1, k)}`, tx(`1 − ${cf(k)}x = 0 denkleminde işareti ters çözdün.`, `You solved 1 − ${cf(k)}x = 0 with the wrong sign.`)],
        [`x = ${k}`, tx(`1 − ${cf(k)}x = 0 denkleminden x = ${k} yazdın (ters).`, `From 1 − ${cf(k)}x = 0 you wrote x = ${k} (inverted).`)],
        ['x = 0', tx('x = 0 yalnızca f = 0 olduğu noktadır; orada f\'(0) = 1 ≠ 0.', 'x = 0 is only where f = 0; there f\'(0) = 1 ≠ 0.')],
        [`x = ${frac(1, k * k)}`, tx(`${k}'ya bölmek yerine ${k}²'ye böldün.`, `You divided by ${k}² instead of ${k}.`)],
        [`x = ${frac(2, k)}`, tx('x²·e^(−kx) sorusundaki ikinci kökle karıştırdın.', 'You mixed this up with the second root of the x²·e^(−kx) version.')],
        [`x = ${frac(1, 2 * k)}`, tx('Çarpan 1 − kx idi; fazladan bir 2 ile böldün.', 'The factor was 1 − kx; you divided by an extra 2.')]],
      [`f'(x) = ${E} − ${cf(k)}x·${E} = (1 − ${cf(k)}x)·${E}`, ans], rng);
    return chk(q, { t: 'zeros', g: (x) => 1 - k * x, zs: [1 / k], ans, fdiff: (x) => x * Math.exp(-k * x) });
  }

  // tangents from an external point to y = x^2
  function dvTangentFromPoint(rng) {
    const p = nz(rng, -3, 3), d = rng.nextInt(1, 5), qy = p * p - d * d;
    const ans = and2('x', p - d, p + d);
    const lo0 = -Math.max(Math.abs(p) + d + 2, 5), hi0 = -lo0;
    const pl = new PlotSpec(lo0, hi0, -3, Math.min(30, hi0 * hi0 / 2));
    pl.addCurve((x) => x * x);
    [p - d, p + d].forEach((t) => pl.addSegment(t - 1.5, t * t - 3 * t, t + 1.5, t * t + 3 * t, true));
    pl.addPoint(p, qy, 'P');
    const q = mk(T.tan(),
      tx(`P(${p}, ${qy}) noktasından y = x² parabolüne iki teğet çizilir. Teğet değme noktalarının x-koordinatları hangileridir?`, `Two tangent lines are drawn from P(${p}, ${qy}) to the parabola y = x². What are the x-coordinates of the points of tangency?`),
      ans,
      [[and2('x', -d, d), tx('Değme noktalarını p\'den bağımsız aldın; merkez x = p etrafındadır.', 'You ignored p; the points are centred around x = p.')],
        [and2('x', p - d * d, p + d * d), tx('Köklerde √(p² − q) = d yerine d² yazdın.', 'In the roots you wrote d² instead of √(p² − q) = d.')],
        [`x = ${p}`, tx('Bu, ikinci dereceden denklemin iki kökünün ortasıdır; kökler p ± d.', 'This is the midpoint of the two roots; the roots are p ± d.')],
        [and2('x', 2 * (p - d), 2 * (p + d)), tx('Değme noktalarının x-koordinatı yerine eğimleri (2t) yazdın.', 'You gave the slopes (2t) instead of the x-coordinates of the tangency points.')]],
      [tx('Teğet noktası t olsun: y = 2t·x − t²', 'Let the tangency point be t: y = 2t·x − t²'), tx(`P'den geçmesi: ${qy} = 2t·${par(p)} − t²  →  ${tvar(polyStr(qy, -2 * p, 1))} = 0`, `Through P: ${qy} = 2t·${par(p)} − t²  →  ${polyStr(qy, -2 * p, 1).replace(/x/g, 't')} = 0`), ans], rng, pl);
    return chk(q, { t: 'zeros', g: (t) => 2 * t * p - t * t - qy, zs: [p - d, p + d], ans });
  }

  // =====================================================================================================
  // Levels, lists, registration
  // =====================================================================================================

  const L1 = [dvPolyExpr, dvPolyAt, dvDefinition, dvTangentParab, dvAvgRate, dvInstRate, dvTrigBasic, dvExpLog, dvBasicPow, dvTanSlope, dvHorizEasy, dvGraphLine, dvDiffWhich];
  const L2 = [dvProduct, dvQuotient, dvChain, dvImplicit, dvSecond, dvProductExpr, dvQuotExpr, dvChainExpr, dvChainTrig, dvTrigSix, dvExpDeriv, dvLogDeriv,
    dvTangentLine, dvNormalLine, dvImpEllipse, dvHorizCubic, dvMeanRate, dvRestTimes, dvDiffAbs, dvGraphZero, dvGraphTangent, dvDefQuad];
  const L3 = [dvChainTrigPow, dvChainNested, dvProdChain, dvQuotChain, dvQuotTrig, dvImpTangent, dvImpSlope, dvImpSecond, dvTangentParallel, dvTangentSqrt,
    dvHigherProduct, dvNthDeriv, dvDiffPiece, dvDiffType, dvGraphDerivExt, dvHorizExp, dvTangentFromPoint];
  L1.forEach((g) => { g.level = 1; });
  L2.forEach((g) => { g.level = 2; });
  L3.forEach((g) => { g.level = 3; });

  // Regular 10-question quiz: the 13 ported VB generators plus two easy ones for horizontal tangents / differentiability.
  const GENERATORS = [
    dvPolyAt, dvPolyExpr, dvTangentParab, dvProduct, dvQuotient, dvChain, dvTrigBasic, dvExpLog, dvImplicit, dvAvgRate, dvInstRate, dvSecond, dvDefinition,
    dvHorizEasy, dvDiffWhich,
  ];
  const EXTRA = L1.concat(L2, L3).filter((g) => GENERATORS.indexOf(g) < 0);

  Topics.register('derivatives', {
    type: 'quiz',
    tabTitle: () => tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  // Printable exam sets: every generator above, each tagged with .level (1/2/3).
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.derivatives = GENERATORS.concat(EXTRA);
})();
