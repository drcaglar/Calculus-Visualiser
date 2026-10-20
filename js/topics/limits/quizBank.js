// Limits & Continuity quiz bank. Ports Modules/Preliminaries/QuizBankPart1.vb (module QuizBankLimits, 11 generators)
// and adds many exam-only generators (window.ExamPools.limits) for the printable 40-question set.
// Every generator carries a numeric `.level` (1 easy, 2 medium, 3 hard). Some questions also carry a non-enumerable
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
  const xs = (h) => (h === 0 ? 'x' : h > 0 ? `x - ${h}` : `x + ${-h}`);        // "x - h"
  const sideSup = (s) => (s > 0 ? '⁺' : s < 0 ? '⁻' : '');
  const lineStr = (m, b) => {
    const mp = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
    return b === 0 ? `y = ${mp}` : `y = ${mp} ${plus(b)}`;
  };
  const DNE = () => tx('Limit yoktur', 'The limit does not exist');
  const PINF = '∞';
  const NINF = '−∞';
  const infStr = (s) => (s > 0 ? PINF : NINF);

  // Mirrors IntWrongNotes: the six generic correct+-1..3 notes.
  const FILL_NOTES = () => [
    tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'),
    tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'),
  ];

  // mk(topic, text, correct, [[wrongValue, note], ...], solution, rng, plot): integer answers get correct+-1..3 filler.
  // "x - -3" -> "x + 3", "x + -3" -> "x - 3" (sign glitches from substituting negative numbers into templates)
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

  // Minimal PlotSpec builder -> {xMin,xMax,yMin,yMax,curves,points,segments}
  class PlotSpec {
    constructor(xMin, xMax, yMin, yMax) {
      this.xMin = xMin; this.xMax = xMax; this.yMin = yMin; this.yMax = yMax;
      this.curves = []; this.points = []; this.segments = [];
    }
    addCurve(f, dashed) { this.curves.push({ f: (x) => { const v = f(x); return typeof v === 'number' && isFinite(v) ? v : NaN; }, dashed: !!dashed }); return this; }
    addSegment(x1, y1, x2, y2, dashed) { this.segments.push({ x1, y1, x2, y2, dashed: !!dashed }); return this; }
    addPoint(x, y, label, hollow) { this.points.push({ x, y, label: label || '', hollow: !!hollow }); return this; }
  }

  const T = {
    rate: () => tx('Değişim hızı ve eğim', 'Rates of change and slope'),
    sub: () => tx('Doğrudan yerine koyma ve limit kuralları', 'Direct substitution and limit laws'),
    fac: () => tx('0/0 belirsizliği: çarpanlara ayırma', '0/0 form: factoring'),
    con: () => tx('Eşlenik (kök) yöntemi', 'Conjugate (radical) method'),
    spe: () => tx('Özel limitler', 'Special limits'),
    squ: () => tx('Sıkıştırma teoremi', 'Squeeze theorem'),
    sid: () => tx('Grafikten ve tek taraflı limit', 'Limits from graphs and one-sided limits'),
    eps: () => tx('ε–δ tanımı', 'ε–δ definition'),
    cnt: () => tx('Süreklilik ve süreksizlik türleri', 'Continuity and types of discontinuity'),
    par: () => tx('Süreklilik: parametre bulma', 'Continuity: finding parameters'),
    ivt: () => tx('Ara değer teoremi', 'Intermediate Value Theorem'),
    vas: () => tx('Sonsuz limit ve düşey asimptot', 'Infinite limits and vertical asymptotes'),
    hor: () => tx('Sonsuzda limit ve yatay asimptot', 'Limits at infinity and horizontal asymptotes'),
    obl: () => tx('Eğik asimptot', 'Oblique asymptotes'),
  };

  const rangeY = (f, x0, x1, extra) => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 40; i++) { const v = f(x0 + (x1 - x0) * i / 40); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    (extra || []).forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    if (!isFinite(lo)) { lo = -5; hi = 5; }
    return [lo - 1.5, hi + 1.5];
  };

  // =====================================================================================================
  // Rates of change, secant and tangent slope
  // =====================================================================================================

  function rcAvg(rng) {
    const p = nz(rng, -3, 3), q = rng.nextInt(-4, 5), r = rng.nextInt(-3, 4);
    const x1 = rng.nextInt(-3, 2), x2 = x1 + rng.nextInt(1, 4);
    const f = (x) => evalPoly(x, r, q, p);
    const ans = p * (x1 + x2) + q;
    const [lo, hi] = rangeY(f, x1 - 2, x2 + 2, [f(x1), f(x2)]);
    const plot = new PlotSpec(x1 - 2, x2 + 2, lo, hi).addCurve(f).addSegment(x1, f(x1), x2, f(x2)).addPoint(x1, f(x1)).addPoint(x2, f(x2));
    const q1 = mk(T.rate(),
      tx(`f(x) = ${polyStr(r, q, p)} fonksiyonunun x = ${x1} ile x = ${x2} arasındaki ortalama değişim hızı (kesenin eğimi) kaçtır?`,
        `What is the average rate of change (slope of the secant) of f(x) = ${polyStr(r, q, p)} between x = ${x1} and x = ${x2}?`),
      String(ans),
      [[String(f(x2) - f(x1)), tx('Yalnızca f(x₂) − f(x₁) farkını almışsın; x₂ − x₁ ile bölmeyi unutmuşsun.', 'You stopped at f(x₂) − f(x₁); you forgot to divide by x₂ − x₁.')],
        [String(2 * p * x1 + q), tx(`Bu, x = ${x1} noktasındaki ani değişim hızı (teğet eğimi); soru iki nokta arasındaki ortalamayı istiyor.`, `This is the instantaneous rate at x = ${x1} (tangent slope); the question asks for the average over the interval.`)],
        [String(2 * p * x2 + q), tx(`Bu, x = ${x2} noktasındaki teğet eğimi; ortalama hız değildir.`, `This is the tangent slope at x = ${x2}, not the average rate.`)],
        [String(-ans), tx('Farkları ters sırada almışsın (pay ve payda farklı yönde); işaret değişti.', 'You subtracted in opposite orders in numerator and denominator; the sign flipped.')]],
      [tx(`f(${x1}) = ${f(x1)}, f(${x2}) = ${f(x2)}`, `f(${x1}) = ${f(x1)}, f(${x2}) = ${f(x2)}`),
        tx('Ortalama değişim hızı = [f(x₂) − f(x₁)] / (x₂ − x₁)', 'Average rate of change = [f(x₂) − f(x₁)] / (x₂ − x₁)'),
        `= (${f(x2)} ${plus(-f(x1))}) / ${x2 - x1} = ${ans}`], rng, plot);
    return chk(q1, { t: 'avg', f, x1, x2 });
  }

  function rcSecantLimit(rng) {
    const p = nz(rng, -3, 3), q = rng.nextInt(-4, 5), a = rng.nextInt(-3, 4);
    const f = (x) => p * x * x + q * x;
    const ans = 2 * p * a + q;
    const q1 = mk(T.rate(),
      tx(`f(x) = ${polyStr(0, q, p)} için lim(h→0) [f(${a} + h) − f(${a})] / h limiti (x = ${a} noktasındaki teğetin eğimi) kaçtır?`,
        `For f(x) = ${polyStr(0, q, p)}, what is lim(h→0) [f(${a} + h) − f(${a})] / h (the slope of the tangent at x = ${a})?`),
      String(ans),
      [[String(p * (2 * a + 1) + q), tx('h = 1 için kesen eğimini bulmuşsun; limit için h → 0 alınmalı.', 'You computed the secant slope for h = 1; the limit needs h → 0.')],
        [String(2 * p * a), tx('x²\'li terimin katkısını almışsın ama q·x teriminden gelen q\'yu atlamışsın.', 'You kept the contribution of the x² term but dropped the q from the q·x term.')],
        [String(f(a)), tx('f(a) değerini yazmışsın; limit, farkın h\'ye bölümüdür, fonksiyon değeri değil.', 'You gave f(a); the limit is of the difference quotient, not the function value.')],
        [String(-ans), tx('Fark bölümünü ters çevirmişsin (f(a) − f(a+h)); işaret değişti.', 'You reversed the difference (f(a) − f(a+h)); the sign flipped.')]],
      [tx(`f(${a} + h) − f(${a}) = ${polyStr(0, 2 * p * a + q, p).replace(/x/g, 'h')}`, `f(${a} + h) − f(${a}) = ${polyStr(0, 2 * p * a + q, p).replace(/x/g, 'h')}`),
        tx('h ile böl: ' + polyStr(2 * p * a + q, p).replace(/x/g, 'h'), 'Divide by h: ' + polyStr(2 * p * a + q, p).replace(/x/g, 'h')),
        tx(`h → 0 iken limit = ${ans}`, `As h → 0 the limit is ${ans}`)], rng);
    return chk(q1, { t: 'lim', f: (h) => (f(a + h) - f(a)) / h, a: 0, side: 0 });
  }

  function rcTangentRoot(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const s = rng.nextInt(2, 6), a = s * s;
      const q1 = mk(T.rate(),
        tx(`y = √x eğrisinin (${a}, ${s}) noktasındaki teğetinin eğimi, kesen eğimlerinin limiti olarak kaçtır? lim(h→0) (√(${a} + h) − ${s}) / h`,
          `What is the slope of the tangent to y = √x at (${a}, ${s}), as the limit of secant slopes? lim(h→0) (√(${a} + h) − ${s}) / h`),
        frac(1, 2 * s),
        [[frac(1, s), tx('Eşlenik paydasında √ + s toplamını s almışsın; √(a) = s olduğundan toplam 2s\'dir.', 'You used s for the conjugate sum √ + s; since √a = s the sum is 2s.')],
          [frac(1, 2 * s * s), tx('Paydada 2s yerine 2s² yazmışsın.', 'You wrote 2s² in the denominator instead of 2s.')],
          [frac(s, 2), tx('Sonucu ters çevirmişsin: 1/(2s) yerine s/2.', 'You inverted the result: s/2 instead of 1/(2s).')],
          ['0', tx('Pay 0\'a gidiyor diye 0 yazmışsın; payda da 0\'a gider (0/0), eşlenikle çözülür.', 'You wrote 0 because the numerator vanishes; the denominator does too (0/0), so use the conjugate.')],
          [frac(1, 4 * s), tx('Paydada 4s kullanmışsın; √ + s toplamı 2s eder.', 'You used 4s in the denominator; √ + s adds up to 2s.')]],
        [tx(`0/0 belirsizliği: pay ve paydayı eşlenik (√(${a} + h) + ${s}) ile çarp.`, `0/0 form: multiply numerator and denominator by the conjugate (√(${a} + h) + ${s}).`),
          tx(`Pay: (${a} + h) − ${a} = h; h sadeleşir: 1 / (√(${a} + h) + ${s})`, `Numerator: (${a} + h) − ${a} = h; h cancels: 1 / (√(${a} + h) + ${s})`),
          tx(`h → 0: 1 / (${s} + ${s}) = ${frac(1, 2 * s)}`, `h → 0: 1 / (${s} + ${s}) = ${frac(1, 2 * s)}`)], rng);
      return chk(q1, { t: 'lim', f: (h) => (Math.sqrt(a + h) - s) / h, a: 0, side: 0 });
    }
    const a = nz(rng, -4, 4);
    const q1 = mk(T.rate(),
      tx(`y = 1/x eğrisinin x = ${a} noktasındaki teğetinin eğimi kaçtır? lim(h→0) (1/(${a} + h) − 1/${par(a)}) / h`,
        `What is the slope of the tangent to y = 1/x at x = ${a}? lim(h→0) (1/(${a} + h) − 1/${par(a)}) / h`),
      frac(-1, a * a),
      [[frac(1, a * a), tx('İşareti kaybetmişsin; ortak paydada pay −h olur.', 'You lost the sign; over a common denominator the numerator is −h.')],
        [frac(-1, a), tx('a\'nın karesini almayı unutmuşsun; payda a(a+h) → a² olur.', 'You forgot the square of a; the denominator a(a+h) tends to a².')],
        [frac(1, a), tx('Hem kareyi hem işareti atlamışsın.', 'You dropped both the square and the sign.')],
        [String(-a * a), tx('Sonucu ters çevirmişsin: −1/a² yerine −a².', 'You inverted the result: −a² instead of −1/a².')],
        ['0', tx('Pay 0\'a gidiyor diye 0 yazmışsın; payda da 0\'a gider.', 'You wrote 0 because the numerator vanishes; the denominator does too.')]],
      [tx(`Ortak payda: 1/(${a}+h) − 1/${par(a)} = (${a} − (${a}+h)) / (${par(a)}(${a}+h)) = −h / (${par(a)}(${a}+h))`, `Common denominator: 1/(${a}+h) − 1/${par(a)} = (${a} − (${a}+h)) / (${par(a)}(${a}+h)) = −h / (${par(a)}(${a}+h))`),
        tx('h sadeleşir: −1 / (a(a+h))', 'h cancels: −1 / (a(a+h))'),
        tx(`h → 0: −1/${a * a} = ${frac(-1, a * a)}`, `h → 0: −1/${a * a} = ${frac(-1, a * a)}`)], rng);
    return chk(q1, { t: 'lim', f: (h) => (1 / (a + h) - 1 / a) / h, a: 0, side: 0 });
  }

  // =====================================================================================================
  // Direct substitution & limit laws
  // =====================================================================================================

  function lmSub(rng) {
    const p = nz(rng, -3, 3), q = rng.nextInt(-4, 5), r = rng.nextInt(-5, 6), a = rng.nextInt(-3, 4);
    const ans = evalPoly(a, r, q, p);
    const q1 = mk(T.sub(), tx(`lim(x→${a}) (${polyStr(r, q, p)}) limiti kaçtır?`, `What is lim(x→${a}) (${polyStr(r, q, p)})?`), String(ans),
      [[String(p * a + q), tx('Yerine koymayı eksik yapmışsın; yalnızca bazı terimleri hesaplamışsın.', 'Your substitution was incomplete; you evaluated only some of the terms.')],
        [String(-ans), tx('Sonucun işaretini ters çevirmişsin; her çarpımın işaretini adım adım kontrol et.', 'You flipped the sign of the result; recheck each signed product.')],
        [String(r), tx('Yalnızca sabit terimi almışsın; x\'li terimleri de yerine koymalısın.', 'You took only the constant term; the x-terms must be substituted as well.')]],
      [tx('Polinom sürekli olduğundan x yerine yaklaştığı değeri yaz.', 'A polynomial is continuous, so substitute the value x approaches.'), `= ${ans}`], rng);
    return chk(q1, { t: 'lim', f: (x) => evalPoly(x, r, q, p), a, side: 0 });
  }

  function lmLaws(rng) {
    const p = nz(rng, -4, 4), q = nz(rng, -4, 4), a = nz(rng, -3, 3), b = nz(rng, -3, 3);
    const ans = a * p - b * q + p * q;
    return mk(T.sub(),
      tx(`lim f(x) = ${p} ve lim g(x) = ${q} ise lim [${cf(a)}f(x) ${-b < 0 ? '-' : '+'} ${cf(Math.abs(b))}g(x) + f(x)g(x)] kaçtır?`,
        `If lim f(x) = ${p} and lim g(x) = ${q}, what is lim [${cf(a)}f(x) ${-b < 0 ? '-' : '+'} ${cf(Math.abs(b))}g(x) + f(x)g(x)]?`),
      String(ans),
      [[String(a * p - b * q), tx('Çarpım teriminin limitini (p·q) eklemeyi unutmuşsun.', 'You forgot to add the limit of the product term f(x)g(x).')],
        [String(a * p + b * q + p * q), tx('g teriminin işaretini yanlış almışsın; ifadede g\'nin katsayısı -b\'dir.', 'You used the wrong sign for the g term; its coefficient in the expression is -b.')],
        [String(p * q), tx('Yalnızca çarpım terimini almışsın; diğer terimleri de eklemelisin.', 'You took only the product term; the other terms must be included.')]],
      [tx('Toplam, fark, sabitle çarpım ve çarpım kuralları uygulanır.', 'Apply the sum, difference, constant-multiple and product laws.'), `= ${a}·${par(p)} - (${b})·(${q}) + ${par(p)}·${par(q)} = ${ans}`], rng);
  }

  function lmLawsQuot(rng) {
    let p, q;
    do { p = nz(rng, -4, 4); q = nz(rng, -4, 4); } while (p === q);
    const a = nz(rng, -3, 3);
    const num = p * p + a * q, den = p - q;
    const ans = frac(num, den);
    const alt = p + q !== 0 ? frac(num, p + q) : frac(p * p - a * q, den);
    return mk(T.sub(),
      tx(`lim f(x) = ${p} ve lim g(x) = ${q} ise lim [ (f(x))² ${a > 0 ? '+' : '-'} ${Math.abs(a)}·g(x) ] / [ f(x) − g(x) ] kaçtır?`,
        `If lim f(x) = ${p} and lim g(x) = ${q}, what is lim [ (f(x))² ${a > 0 ? '+' : '-'} ${Math.abs(a)}·g(x) ] / [ f(x) − g(x) ]?`),
      ans,
      [[frac(p + a * q, den), tx('(f(x))² limitini p² yerine p almışsın; kuvvet kuralı: lim f² = (lim f)².', 'You used p instead of p² for lim f²; power law: lim f² = (lim f)².')],
        [frac(-num, den), tx('Paydadaki farkı ters sırada almışsın; f − g, p − q olmalı.', 'You reversed the denominator difference; f − g gives p − q.')],
        [alt, tx('Paydada f ile g\'yi toplamışsın; ifade f(x) − g(x) olduğundan p − q alınır.', 'You added f and g in the denominator; the expression has f(x) − g(x), so use p − q.')],
        [frac(p * p - a * q, den), tx('g terimin işaretini ters almışsın; ifadede +a·g(x) vardır.', 'You flipped the sign of the g term; the expression has +a·g(x).')],
        [frac(num, 2 * den), tx('Paydada f − g yerine 2(f − g) gibi bir çarpan eklemişsin.', 'You introduced an extra factor 2 in the denominator.')],
        [String(num), tx('Paydayı hiç bölmeden yazmışsın; bölüm kuralı payda limiti sıfırdan farklıysa uygulanır.', 'You gave the numerator only; the quotient law divides by the denominator\'s limit (which is nonzero here).')]],
      [tx('Bölüm kuralı: payın limiti / paydanın limiti (payda limiti ≠ 0).', 'Quotient law: limit of numerator / limit of denominator (denominator limit ≠ 0).'),
        tx(`Pay: ${p}² ${plus(a)}·${par(q)} = ${num};  Payda: ${p} − ${par(q)} = ${den}`, `Numerator: ${p}² ${plus(a)}·${par(q)} = ${num};  Denominator: ${p} − ${par(q)} = ${den}`),
        `= ${ans}`], rng);
  }

  // =====================================================================================================
  // 0/0 forms: factoring
  // =====================================================================================================

  function lmRemovable(rng) {
    const a = nz(rng, -5, 5);
    const q = mk(T.fac(), tx(`lim(x→${a}) (${polyStr(-a * a, 0, 1)}) / (${xs(a)}) limiti kaçtır?`, `What is lim(x→${a}) (${polyStr(-a * a, 0, 1)}) / (${xs(a)})?`), String(2 * a),
      [['0', tx('Doğrudan yazıp 0/0\'ı 0 sanmışsın; belirsizdir, önce sadeleştirmelisin.', 'You substituted and treated 0/0 as 0; it is indeterminate, so factor first.')],
        [String(a), tx('Sadeleşen x + a\'da yalnızca a\'yı almışsın; x de a\'ya yaklaşır.', 'After cancelling you kept only a from x + a; x also tends to a.')],
        [String(a * a), tx('a² değerini yazmışsın; sadeleşince kalan çarpan x + a\'dır, x² - a² değil.', 'You gave a²; after cancelling the remaining factor is x + a, not x² - a².')]],
      [tx('Doğrudan yazarsan 0/0 belirsizliği çıkar; çarpanlara ayır.', 'Direct substitution gives the indeterminate form 0/0; factor.'), `x² - ${a * a} = (x - ${a})(x + ${a})`,
        tx(`Sadeleşince x + ${a} → ${a} + ${a} = ${2 * a}`, `After cancelling, x + ${a} → ${a} + ${a} = ${2 * a}`)], rng,
      new PlotSpec(a - 5, a + 5, 2 * a - 6, 2 * a + 6).addCurve((x) => (x === a ? NaN : x + a)).addPoint(a, 2 * a, '', true));
    return chk(q, { t: 'lim', f: (x) => (x * x - a * a) / (x - a), a, side: 0 });
  }

  function lmFactor(rng) {
    const r = nz(rng, -4, 4), s = nz(rng, -4, 4);
    const q = mk(T.fac(), tx(`lim(x→${r}) (${polyStr(-r * s, s - r, 1)}) / (x ${plus(-r)}) limiti kaçtır?`, `What is lim(x→${r}) (${polyStr(-r * s, s - r, 1)}) / (x ${plus(-r)})?`), String(r + s),
      [['0', tx('Doğrudan yazıp 0/0\'ı 0 sanmışsın; belirsizlik çarpanlara ayırarak giderilir.', 'You substituted and took 0/0 as 0; factor to remove the indeterminacy.')],
        [String(s), tx('Kalan çarpanda yalnızca s\'yi almışsın; x yerine r yazmayı unutmuşsun.', 'You kept only s from (x + s); x also tends to r.')],
        [String(r), tx('Kalan çarpanda yalnızca r\'yi almışsın; s\'yi eklemeyi unutmuşsun.', 'You kept only r from (x + s); the s must be added too.')]],
      [tx(`Pay: x² ${plus(s - r)}x ${plus(-r * s)} = (x ${plus(-r)})(x ${plus(s)})`, `Numerator: x² ${plus(s - r)}x ${plus(-r * s)} = (x ${plus(-r)})(x ${plus(s)})`), tx('(x - r) sadeleşir.', '(x - r) cancels.'), `Limit = ${r} ${plus(s)} = ${r + s}`], rng);
    return chk(q, { t: 'lim', f: (x) => evalPoly(x, -r * s, s - r, 1) / (x - r), a: r, side: 0 });
  }

  function lmFactorLead(rng) {
    const r = nz(rng, -4, 4), m = nz(rng, -3, 3), n = rng.nextInt(-4, 5);
    const c = [-n * r, n - m * r, m];
    const ans = m * r + n;
    const q = mk(T.fac(), tx(`lim(x→${r}) (${polyStr(...c)}) / (${xs(r)}) limiti kaçtır?`, `What is lim(x→${r}) (${polyStr(...c)}) / (${xs(r)})?`), String(ans),
      [['0', tx('Doğrudan yazınca 0/0 çıkar; bunu 0 sanmışsın. Önce çarpanlara ayırmalısın.', 'Substitution gives 0/0 which you read as 0; factor first.')],
        [String(n), tx('Kalan çarpan mx + n\'de yalnızca n\'yi almışsın; x yerine r yazıp m·r\'yi de eklemelisin.', 'You kept only n from the leftover factor mx + n; substitute x = r to add m·r too.')],
        [String(m * r), tx('Kalan çarpanda sabit n\'yi atlamışsın.', 'You dropped the constant n of the leftover factor.')],
        [String(m * r - n), tx('Kalan çarpanda sabit terimin işaretini ters almışsın.', 'You flipped the sign of the constant term in the leftover factor.')]],
      [tx(`Pay ${r}'de 0 olur; (x ${plus(-r)}) çarpanını ayır: ${polyStr(...c)} = (${xs(r)})(${polyStr(n, m)})`, `The numerator vanishes at ${r}; factor out (${xs(r)}): ${polyStr(...c)} = (${xs(r)})(${polyStr(n, m)})`),
        tx(`Sadeleştir: ${polyStr(n, m)} → ${m}·${par(r)} ${plus(n)} = ${ans}`, `Cancel: ${polyStr(n, m)} → ${m}·${par(r)} ${plus(n)} = ${ans}`)], rng);
    return chk(q, { t: 'lim', f: (x) => evalPoly(x, ...c) / (x - r), a: r, side: 0 });
  }

  function lmFactorCubic(rng) {
    const a = nz(rng, -3, 3);
    const q = mk(T.fac(), tx(`lim(x→${a}) (${polyStr(-a * a * a, 0, 0, 1)}) / (${polyStr(-a * a, 0, 1)}) limiti kaçtır?`, `What is lim(x→${a}) (${polyStr(-a * a * a, 0, 0, 1)}) / (${polyStr(-a * a, 0, 1)})?`), frac(3 * a, 2),
      [['0', tx('0/0\'ı 0 sanmışsın; her iki polinom da x = a\'da sıfırdır, ortak çarpan (x − a) sadeleşmeli.', 'You read 0/0 as 0; both polynomials vanish at x = a, so cancel the common factor (x − a).')],
        [String(3 * a * a), tx('Yalnızca payın kalan çarpanını (x² + ax + a²) hesaplamışsın; paydanın kalanı (x + a)\'ya bölmelisin.', 'You evaluated only the numerator\'s leftover (x² + ax + a²); divide by the denominator\'s leftover (x + a).')],
        [frac(2 * a, 3), tx('Kesri ters yazmışsın: 3a/2 yerine 2a/3.', 'You inverted the fraction: 2a/3 instead of 3a/2.')],
        [frac(a, 2), tx('Payın kalanını x² + ax + a² yerine yalnızca a² almışsın.', 'You took only a² for the numerator\'s leftover instead of x² + ax + a².')],
        [String(a), tx('Küp farkı çarpanlarını karıştırmışsın.', 'You mixed up the factors of the difference of cubes.')]],
      [tx(`x³ − ${a ** 3} = (x − ${a})(x² + ${a}x + ${a * a}),  x² − ${a * a} = (x − ${a})(x + ${a})`, `x³ − ${a ** 3} = (x − ${a})(x² + ${a}x + ${a * a}),  x² − ${a * a} = (x − ${a})(x + ${a})`),
        tx('(x − a) sadeleşir: (x² + ax + a²) / (x + a)', '(x − a) cancels: (x² + ax + a²) / (x + a)'),
        `x → ${a}: ${3 * a * a}/${2 * a} = ${frac(3 * a, 2)}`], rng);
    return chk(q, { t: 'lim', f: (x) => (x * x * x - a ** 3) / (x * x - a * a), a, side: 0 });
  }

  function lmFracDiff(rng) {
    let a, u;
    do { a = nz(rng, -3, 3); u = nz(rng, -3, 3); } while (a + u === 0);
    const c = a + u;
    const q = mk(T.fac(), tx(`lim(x→${a}) [1/(x ${plus(u)}) − 1/${par(c)}] / (${xs(a)}) limiti kaçtır?`, `What is lim(x→${a}) [1/(x ${plus(u)}) − 1/${par(c)}] / (${xs(a)})?`), frac(-1, c * c),
      [[frac(1, c * c), tx('Ortak paydada payı yanlış çıkarmışsın: (c − (x+u)) = −(x − a), işaret negatiftir.', 'You mis-signed the numerator: (c − (x+u)) = −(x − a), which is negative.')],
        [frac(-1, c), tx('Paydadaki çarpımı (x+u)·c → c² yerine yalnızca c almışsın.', 'You took c instead of c² for the denominator product (x+u)·c.')],
        ['0', tx('Pay 0\'a gidiyor diye 0 yazmışsın; ortak payda ile (x − a)\'yı sadeleştirmelisin.', 'You wrote 0 since the numerator vanishes; combine fractions and cancel (x − a).')],
        [String(-c * c), tx('Sonucu ters çevirmişsin: −1/c² yerine −c².', 'You inverted the result: −c² instead of −1/c².')],
        [frac(1, c), tx('Hem işaret hem kare hatası.', 'Both the sign and the square were mishandled.')]],
      [tx(`Pay: 1/(x ${plus(u)}) − 1/${par(c)} = (${c} − (x ${plus(u)})) / (${par(c)}(x ${plus(u)})) = −(${xs(a)}) / (${par(c)}(x ${plus(u)}))`, `Numerator: 1/(x ${plus(u)}) − 1/${par(c)} = (${c} − (x ${plus(u)})) / (${par(c)}(x ${plus(u)})) = −(${xs(a)}) / (${par(c)}(x ${plus(u)}))`),
        tx('(x − a) sadeleşir: −1 / (c(x + u))', '(x − a) cancels: −1 / (c(x + u))'),
        tx(`x → ${a}: −1/(${c}·${c}) = ${frac(-1, c * c)}`, `x → ${a}: −1/(${c}·${c}) = ${frac(-1, c * c)}`)], rng);
    return chk(q, { t: 'lim', f: (x) => (1 / (x + u) - 1 / c) / (x - a), a, side: 0 });
  }

  // =====================================================================================================
  // Conjugate method
  // =====================================================================================================

  function lmSqrt(rng) {
    let a, b, c;
    do { b = rng.nextInt(2, 6); a = rng.nextInt(1, 9); c = b * b - a; } while (c === 0);
    const q = mk(T.con(), tx(`lim(x→${c}) (√(x ${plus(a)}) - ${b}) / (x ${plus(-c)}) limiti kaçtır?`, `What is lim(x→${c}) (√(x ${plus(a)}) - ${b}) / (x ${plus(-c)})?`), frac(1, 2 * b),
      [[frac(1, b), tx('Eşlenik paydasında kök ve b terimlerinin toplamını yanlış almışsın; kök değeri b olduğundan toplam 2b\'dir.', 'You mis-evaluated the conjugate denominator; the root equals b there, so the sum is 2b.')],
        [frac(1, b * b), tx('Paydada b² kullanmışsın; eşlenik paydası √(...) + b\'dir.', 'You used b² in the denominator; the conjugate gives √(...) + b.')],
        [frac(b, 2), tx('b/2 yazmışsın; sonuç 1/(kök + b) biçimindedir.', 'You wrote b/2; the result has the form 1/(root + b).')],
        ['0', tx('Pay 0\'a gittiği için 0 sanmışsın; payda da 0\'dır, 0/0 belirsizdir.', 'You took 0 since the numerator vanishes; the denominator vanishes too (0/0).')],
        [frac(1, 4 * b), tx('Paydada 4b kullanmışsın; kök ile b\'nin toplamı 2b eder.', 'You used 4b in the denominator; root plus b gives 2b.')]],
      [tx(`Pay ve paydayı eşleniği (√(x ${plus(a)}) + ${b}) ile çarp.`, `Multiply numerator and denominator by the conjugate (√(x ${plus(a)}) + ${b}).`), tx('Pay x - c olur ve payda ile sadeleşir.', 'The numerator becomes x - c and cancels with the denominator.'),
        tx(`Kalan: 1/(√(${c}${plus(a)}) + ${b}) = 1/${2 * b}`, `Remaining: 1/(√(${c}${plus(a)}) + ${b}) = 1/${2 * b}`)], rng);
    return chk(q, { t: 'lim', f: (x) => (Math.sqrt(x + a) - b) / (x - c), a: c, side: 0 });
  }

  function lmSqrtTwo(rng) {
    const s = rng.nextInt(2, 5), a = nz(rng, -3, 3);
    const m = s * s - a, n = s * s - 2 * a;
    const q = mk(T.con(), tx(`lim(x→${a}) (√(x ${plus(m)}) − √(2x ${plus(n)})) / (${xs(a)}) limiti kaçtır?`, `What is lim(x→${a}) (√(x ${plus(m)}) − √(2x ${plus(n)})) / (${xs(a)})?`), frac(-1, 2 * s),
      [[frac(1, 2 * s), tx('Eşlenikle payı (x+m) − (2x+n) = −(x − a) bulurken eksi işaretini kaybetmişsin.', 'When forming (x+m) − (2x+n) = −(x − a) with the conjugate you lost the minus sign.')],
        [frac(-1, s), tx('Eşlenik paydasında iki kökün toplamını s almışsın; her kök s olduğundan toplam 2s\'dir.', 'You used s for the sum of the two roots in the conjugate; each root is s, so the sum is 2s.')],
        ['0', tx('İki kök de s\'ye gidiyor diye farkı 0 sanmışsın; payda da 0\'a gider (0/0), eşlenik gerekir.', 'You assumed the roots both → s so the difference is 0; the denominator also → 0 (0/0), so the conjugate is needed.')],
        [frac(-3, 2 * s), tx('Pay (x+m) + (2x+n) gibi toplamışsın; fark alınmalı.', 'You added (x+m) and (2x+n) instead of subtracting.')],
        [frac(1, s), tx('Hem işaret hem eşlenik toplamı hatası.', 'A sign error combined with a wrong conjugate sum.')]],
      [tx(`Eşlenikle çarp: (√(x ${plus(m)}) + √(2x ${plus(n)}))`, `Multiply by the conjugate: (√(x ${plus(m)}) + √(2x ${plus(n)}))`),
        tx(`Pay: (x ${plus(m)}) − (2x ${plus(n)}) = −x ${plus(m - n)} = −(${xs(a)}) ve (x − a) sadeleşir`, `Numerator: (x ${plus(m)}) − (2x ${plus(n)}) = −x ${plus(m - n)} = −(${xs(a)}), and (x − a) cancels`),
        tx(`x → ${a}: −1 / (${s} + ${s}) = ${frac(-1, 2 * s)}`, `x → ${a}: −1 / (${s} + ${s}) = ${frac(-1, 2 * s)}`)], rng);
    return chk(q, { t: 'lim', f: (x) => (Math.sqrt(x + m) - Math.sqrt(2 * x + n)) / (x - a), a, side: 0 });
  }

  function lmSqrtQuad(rng) {
    const s = rng.nextInt(2, 5), a = nz(rng, -3, 3);
    const m = s * s - a;
    const q = mk(T.con(), tx(`lim(x→${a}) (√(x ${plus(m)}) − ${s}) / (${polyStr(-a * a, 0, 1)}) limiti kaçtır?`, `What is lim(x→${a}) (√(x ${plus(m)}) − ${s}) / (${polyStr(-a * a, 0, 1)})?`), frac(1, 4 * s * a),
      [[frac(1, 2 * s), tx('Eşleniği doğru kullanmışsın ama paydadaki kalan (x + a) çarpanını (2a) hesaba katmamışsın.', 'You used the conjugate correctly but ignored the leftover denominator factor (x + a) → 2a.')],
        [frac(1, 2 * a), tx('Kök kısmından gelen 1/(2s) çarpanını unutmuşsun.', 'You forgot the factor 1/(2s) coming from the root part.')],
        [frac(1, 2 * s * a), tx('Payda çarpımında yalnızca bir 2 almışsın; (√ + s) → 2s ve (x + a) → 2a iki ayrı 2 getirir.', 'You took only one 2 in the denominator; (√ + s) → 2s and (x + a) → 2a bring two factors of 2.')],
        ['0', tx('Pay 0\'a gidiyor diye 0 yazmışsın; payda da 0\'a gider.', 'You wrote 0 because the numerator vanishes; the denominator does too.')],
        [frac(-1, 4 * s * a), tx('İşaret hatası: x² − a² = (x − a)(x + a) açılımında x + a, +2a\'ya gider.', 'Sign error: in x² − a² = (x − a)(x + a), x + a tends to +2a.')]],
      [tx(`Pay ve paydayı (√(x ${plus(m)}) + ${s}) ile çarp: pay (x ${plus(m)}) − ${s * s} = ${xs(a)}`, `Multiply by (√(x ${plus(m)}) + ${s}): the numerator becomes (x ${plus(m)}) − ${s * s} = ${xs(a)}`),
        tx(`x² − ${a * a} = (x − ${a})(x + ${a}); (x − a) sadeleşir: 1 / [(√(x ${plus(m)}) + ${s})(x + ${a})]`, `x² − ${a * a} = (x − ${a})(x + ${a}); (x − a) cancels: 1 / [(√(x ${plus(m)}) + ${s})(x + ${a})]`),
        tx(`x → ${a}: 1 / (${2 * s} · ${2 * a}) = ${frac(1, 4 * s * a)}`, `x → ${a}: 1 / (${2 * s} · ${2 * a}) = ${frac(1, 4 * s * a)}`)], rng);
    return chk(q, { t: 'lim', f: (x) => (Math.sqrt(x + m) - s) / (x * x - a * a), a, side: 0 });
  }

  // =====================================================================================================
  // Special limits
  // =====================================================================================================

  function lmSinOver(rng) {
    const a = rng.nextInt(2, 8);
    let b;
    do { b = rng.nextInt(2, 8); } while (b === a);
    const q = mk(T.spe(), tx(`lim(x→0) sin(${a}x) / (${b}x) limiti kaçtır?`, `What is lim(x→0) sin(${a}x) / (${b}x)?`), frac(a, b),
      [[frac(b, a), tx('Oranı ters yazmışsın; limit a/b\'dir, b/a değil.', 'You inverted the ratio; the limit has a over b, not b over a.')],
        ['1', tx('sin x/x = 1 özel limitini a ve b katsayılarını hesaba katmadan uygulamışsın.', 'You applied sin x/x = 1 while ignoring the coefficients a and b.')],
        ['0', tx('Pay 0\'a gittiği için limiti 0 sanmışsın; payda da 0\'a gider.', 'You thought the limit is 0 because the numerator is; the denominator vanishes too.')],
        [String(a * b), tx('a ile b\'yi çarpmışsın; katsayılar bölünür.', 'You multiplied a and b; the coefficients form a ratio.')],
        [frac(a, b + 1), tx('Paydaya 1 eklemişsin; katsayı olduğu gibi alınmalı.', 'You added 1 to the denominator\'s coefficient; use it as given.')]],
      [tx('lim(x→0) sin(kx)/(kx) = 1 özel limitini kullan.', 'Use the special limit lim(x→0) sin(kx)/(kx) = 1.'), `sin(${a}x)/(${b}x) = (${a}/${b})·[sin(${a}x)/(${a}x)] → ${a}/${b}·1 = ${frac(a, b)}`], rng);
    return chk(q, { t: 'lim', f: (x) => Math.sin(a * x) / (b * x), a: 0, side: 0, h: 1e-4 });
  }

  function lmSinRatio(rng) {
    const a = rng.nextInt(2, 8);
    let b;
    do { b = rng.nextInt(2, 8); } while (b === a);
    const kind = rng.nextInt(0, 3);
    const exprs = [
      [`sin(${a}x) / sin(${b}x)`, (x) => Math.sin(a * x) / Math.sin(b * x), tx('Pay ve paydayı x\'e böl: [sin(ax)/x] / [sin(bx)/x] → a/b.', 'Divide numerator and denominator by x: [sin(ax)/x] / [sin(bx)/x] → a/b.')],
      [`tan(${a}x) / (${b}x)`, (x) => Math.tan(a * x) / (b * x), tx('tan(ax) = sin(ax)/cos(ax); cos 0 = 1 olduğundan tan(ax)/x → a.', 'tan(ax) = sin(ax)/cos(ax); with cos 0 = 1, tan(ax)/x → a.')],
      [`sin(${a}x) / tan(${b}x)`, (x) => Math.sin(a * x) / Math.tan(b * x), tx('tan(bx) = sin(bx)/cos(bx); cos(bx) → 1 olduğundan oran sin(ax)/sin(bx) → a/b.', 'tan(bx) = sin(bx)/cos(bx); as cos(bx) → 1 the ratio tends to sin(ax)/sin(bx) → a/b.')],
    ][kind];
    const q = mk(T.spe(), tx(`lim(x→0) ${exprs[0]} limiti kaçtır?`, `What is lim(x→0) ${exprs[0]}?`), frac(a, b),
      [[frac(b, a), tx('Oranı ters almışsın; pay katsayısı üstte olmalı.', 'You inverted the ratio; the numerator\'s coefficient goes on top.')],
        ['1', tx('Katsayılar hesaba katılmadan sin x / x = 1 uygulanmış; a ve b oranı kalır.', 'sin x / x = 1 was applied without the coefficients; the ratio a : b remains.')],
        ['0', tx('Pay ve payda birlikte 0\'a gider (0/0); limit 0 değildir.', 'Numerator and denominator both tend to 0 (0/0); the limit is not 0.')],
        [String(a * b), tx('Katsayıları çarpmışsın; bunlar bölünür.', 'You multiplied the coefficients; they form a ratio.')],
        [frac(a, b + 1), tx('Payda katsayısına 1 eklemişsin.', 'You added 1 to the denominator\'s coefficient.')]],
      [exprs[2], `= ${a}/${b} = ${frac(a, b)}`], rng);
    return chk(q, { t: 'lim', f: exprs[1], a: 0, side: 0, h: 1e-4 });
  }

  function lmOneMinusCos(rng) {
    const a = rng.nextInt(1, 6), b = rng.nextInt(1, 4);
    const q = mk(T.spe(), tx(`lim(x→0) (1 − cos(${cf(a)}x)) / (${b === 1 ? '' : b}x²) limiti kaçtır?`, `What is lim(x→0) (1 − cos(${cf(a)}x)) / (${b === 1 ? '' : b}x²)?`), frac(a * a, 2 * b),
      [[frac(a * a, b), tx('Özel limit (1 − cos u)/u² = 1/2\'deki 1/2 çarpanını unutmuşsun.', 'You forgot the factor 1/2 in the special limit (1 − cos u)/u² = 1/2.')],
        [frac(a, 2 * b), tx('Katsayı a\'nın karesini almamışsın; u = ax ise u² = a²x² olur.', 'You did not square a; with u = ax we get u² = a²x².')],
        [frac(1, 2 * b), tx('a katsayısını tamamen yok saymışsın.', 'You ignored the coefficient a completely.')],
        ['0', tx('Pay 0\'a gittiği için 0 sanmışsın; payda da 0\'a gider, özel limit kullanılır.', 'You took 0 since the numerator vanishes; the denominator does too, so use the special limit.')],
        [frac(2 * b, a * a), tx('Kesri ters çevirmişsin.', 'You inverted the fraction.')]],
      [tx('Özel limit: lim(u→0) (1 − cos u)/u² = 1/2.', 'Special limit: lim(u→0) (1 − cos u)/u² = 1/2.'),
        `(1 − cos(${cf(a)}x))/(${b}x²) = (${a * a}/${b})·(1 − cos(${cf(a)}x))/(${cf(a)}x)²`, `→ ${a * a}/${b} · 1/2 = ${frac(a * a, 2 * b)}`], rng);
    return chk(q, { t: 'lim', f: (x) => (1 - Math.cos(a * x)) / (b * x * x), a: 0, side: 0, h: 1e-3 });
  }

  function lmTrigCos(rng) {
    const a = rng.nextInt(1, 6), b = rng.nextInt(1, 6);
    const q = mk(T.spe(), tx(`lim(x→0) (1 − cos(${cf(a)}x)) / (x·sin(${cf(b)}x)) limiti kaçtır?`, `What is lim(x→0) (1 − cos(${cf(a)}x)) / (x·sin(${cf(b)}x))?`), frac(a * a, 2 * b),
      [[frac(a * a, b), tx('(1 − cos u)/u² → 1/2 özel limitindeki 1/2\'yi unutmuşsun.', 'You forgot the 1/2 from (1 − cos u)/u² → 1/2.')],
        [frac(a, 2 * b), tx('Payda x·sin(bx) ≈ b x² iken pay (a²/2)x² olur; a\'nın karesini almamışsın.', 'With x·sin(bx) ≈ b x² and the numerator ≈ (a²/2)x², you must square a.')],
        [frac(2 * b, a * a), tx('Kesri ters çevirmişsin.', 'You inverted the fraction.')],
        [frac(a * a * b, 2), tx('b ile bölmek yerine çarpmışsın; sin(bx) ≈ bx paydadadır.', 'You multiplied by b instead of dividing; sin(bx) ≈ bx sits in the denominator.')],
        ['0', tx('Pay x² mertebesinde, payda da x² mertebesinde olduğundan limit 0 değildir.', 'Numerator and denominator are both of order x², so the limit is not 0.')]],
      [tx(`x → 0: 1 − cos(${cf(a)}x) ≈ (${a * a}/2)x² ve x·sin(${cf(b)}x) ≈ ${b}x²`, `As x → 0: 1 − cos(${cf(a)}x) ≈ (${a * a}/2)x² and x·sin(${cf(b)}x) ≈ ${b}x²`),
        tx('Resmi yolu: [(1 − cos ax)/(ax)²]·a² / ([sin(bx)/(bx)]·b) → (1/2)a² / b', 'Formal way: [(1 − cos ax)/(ax)²]·a² / ([sin(bx)/(bx)]·b) → (1/2)a² / b'),
        `= ${frac(a * a, 2 * b)}`], rng);
    return chk(q, { t: 'lim', f: (x) => (1 - Math.cos(a * x)) / (x * Math.sin(b * x)), a: 0, side: 0, h: 1e-3 });
  }

  // =====================================================================================================
  // Squeeze theorem
  // =====================================================================================================

  function lmSqueezeBasic(rng) {
    const c = rng.nextInt(-3, 4), L = nz(rng, -5, 5), k = rng.nextInt(1, 4);
    const sq = c === 0 ? 'x²' : `(${xs(c)})²`;
    const g = (x) => L - k * (x - c) * (x - c), h = (x) => L + k * (x - c) * (x - c);
    const q = mk(T.squ(),
      tx(`x, ${c} sayısına yakınken ${L} − ${cf(k)}${sq} ≤ f(x) ≤ ${L} + ${cf(k)}${sq} olsun. lim(x→${c}) f(x) kaçtır?`, `Suppose ${L} − ${cf(k)}${sq} ≤ f(x) ≤ ${L} + ${cf(k)}${sq} for x near ${c}. What is lim(x→${c}) f(x)?`),
      String(L),
      [['0', tx('Sınır fonksiyonların x = c\'deki değerlerini hesaplamamışsın; ikisi de L\'ye gider.', 'You did not evaluate the bounds at x = c; both tend to L.')],
        [String(c), tx('Limit yaklaşılan x değeri değil, sınır fonksiyonların ortak limitidir.', 'The limit is the common limit of the bounds, not the x-value being approached.')],
        [String(L + k), tx('Sınırlardan birini tek başına seçmişsin; ek terim x = c\'de 0 olur.', 'You picked one of the bounds with its extra term; that term is 0 at x = c.')]],
      [tx(`Alt sınır → ${L} − ${k}·0 = ${L}, üst sınır → ${L} + ${k}·0 = ${L}.`, `Lower bound → ${L} − ${k}·0 = ${L}, upper bound → ${L} + ${k}·0 = ${L}.`),
        tx('Sıkıştırma teoremi: iki sınır aynı L\'ye gidiyorsa f(x) de L\'ye gider.', 'Squeeze theorem: both bounds tend to L, so f(x) → L.')], rng);
    return chk(q, { t: 'squeeze', g, h, c });
  }

  function lmSqueezeSin(rng) {
    const kind = rng.nextInt(0, 3), k = nz(rng, -4, 4), m = nz(rng, -5, 5);
    if (kind === 0) {
      const q = mk(T.squ(), tx(`lim(x→0) x²·cos(${k}/x) limiti kaçtır?`, `What is lim(x→0) x²·cos(${k}/x)?`), '0',
        [[DNE(), tx('cos(k/x) salınır ama x² çarpanı onu bastırır; salınım limiti bozmaz.', 'cos(k/x) oscillates, but the factor x² damps it; the oscillation does not destroy the limit.')],
          ['1', tx('cos 0 = 1 yazmışsın; k/x → ∞ olduğundan cos(k/x) bir değere yaklaşmaz.', 'You used cos 0 = 1; k/x → ∞, so cos(k/x) does not settle at a value.')],
          [String(k), tx('Kuvvet kuralı yerine katsayıyı sonuç yapmışsın; sıkıştırma ile limit 0\'dır.', 'You returned the coefficient; by squeezing the limit is 0.')],
          [PINF, tx('x² küçülür, çarpım büyümez.', 'x² shrinks, so the product does not blow up.')]],
        [tx('−1 ≤ cos(k/x) ≤ 1 olduğundan −x² ≤ x²cos(k/x) ≤ x².', 'Since −1 ≤ cos(k/x) ≤ 1, we have −x² ≤ x²cos(k/x) ≤ x².'),
          tx('Her iki sınır 0\'a gider ⇒ limit 0 (sıkıştırma teoremi).', 'Both bounds tend to 0 ⇒ the limit is 0 (squeeze theorem).')], rng);
      return chk(q, { t: 'squeeze', g: (x) => -x * x, h: (x) => x * x, c: 0, ans: 0 });
    }
    if (kind === 1) {
      const q = mk(T.squ(), tx(`lim(x→0) [${m} + x·sin(${k}/x)] limiti kaçtır?`, `What is lim(x→0) [${m} + x·sin(${k}/x)]?`), String(m),
        [[DNE(), tx('sin(k/x) salınır ama x çarpanı genliği 0\'a indirir; limit vardır.', 'sin(k/x) oscillates but the factor x brings the amplitude to 0; the limit exists.')],
          ['0', tx('Sabit terimi atlamışsın; yalnızca x·sin(k/x) → 0 olur.', 'You dropped the constant; only x·sin(k/x) tends to 0.')],
          [String(m + k), tx('k\'yı sonuca eklemişsin; x·sin(k/x) terimi 0\'a gider, k katkı yapmaz.', 'You added k; the term x·sin(k/x) tends to 0 and k does not contribute.')],
          [String(-m), tx('İşaret hatası.', 'A sign error.')]],
        [tx('−|x| ≤ x·sin(k/x) ≤ |x| olduğundan x·sin(k/x) → 0 (sıkıştırma).', 'Since −|x| ≤ x·sin(k/x) ≤ |x|, x·sin(k/x) → 0 (squeeze).'), tx(`Limit = ${m} + 0 = ${m}`, `Limit = ${m} + 0 = ${m}`)], rng);
      return chk(q, { t: 'lim', f: (x) => m + x * Math.sin(k / x), a: 0, side: 0, h: 1e-6 });
    }
    const q = mk(T.squ(), tx(`lim(x→∞) (${cf(m)}x + sin x) / x limiti kaçtır?`, `What is lim(x→∞) (${cf(m)}x + sin x) / x?`), String(m),
      [['0', tx('sin x / x → 0 olur ama m·x/x = m terimi kalır.', 'sin x / x → 0 but the term m·x/x = m remains.')],
        [DNE(), tx('sin x salınır ama x\'e bölününce 0\'a gider; limit vardır.', 'sin x oscillates but divided by x it tends to 0; the limit exists.')],
        [PINF, tx('Pay ve payda aynı hızda büyür; oran sonsuz değil, sonlu bir sayıdır.', 'Numerator and denominator grow at the same rate; the ratio is a finite number.')],
        [String(m + 1), tx('sin x / x terimini 1 sanmışsın; (sin x)/x → 0\'dır (x → 0 özel limiti ile karıştırma).', 'You took sin x / x as 1; as x → ∞ it tends to 0 (do not confuse with the x → 0 special limit).')]],
      [tx('Böl: m + (sin x)/x.', 'Split: m + (sin x)/x.'), tx('−1/x ≤ (sin x)/x ≤ 1/x ve her iki sınır 0\'a gider ⇒ (sin x)/x → 0.', '−1/x ≤ (sin x)/x ≤ 1/x and both bounds tend to 0 ⇒ (sin x)/x → 0.'), `${tx('Limit', 'Limit')} = ${m}`], rng);
    return chk(q, { t: 'lim', f: (x) => (m * x + Math.sin(x)) / x, a: Infinity, side: 0 });
  }

  function lmSqueezeInf(rng) {
    let m, n;
    do { m = nz(rng, -4, 4); n = nz(rng, -4, 4); } while (m === n);
    const q = mk(T.squ(), tx(`lim(x→∞) (${cf(m)}x + sin x) / (${cf(n)}x + cos x) limiti kaçtır?`, `What is lim(x→∞) (${cf(m)}x + sin x) / (${cf(n)}x + cos x)?`), frac(m, n),
      [[frac(n, m), tx('Katsayı oranını ters almışsın.', 'You inverted the coefficient ratio.')],
        ['0', tx('sin ve cos sınırlıdır ama x terimleri baskındır; oran 0 olmaz.', 'sin and cos are bounded, but the x terms dominate; the ratio is not 0.')],
        [DNE(), tx('sin x ve cos x salınır ama x terimleri yanında önemsizdir; limit vardır.', 'sin x and cos x oscillate but are negligible next to the x terms; the limit exists.')],
        ['1', tx('sin x ve cos x\'i x ile eşit saymışsın; katsayıların oranı alınmalı.', 'You treated sin x and cos x like x; take the ratio of the coefficients.')],
        [PINF, tx('Pay ve payda aynı mertebede (x) büyüyor; oran sonlu.', 'Numerator and denominator grow at the same order (x); the ratio is finite.')]],
      [tx('Pay ve paydayı x\'e böl: (m + (sin x)/x) / (n + (cos x)/x).', 'Divide numerator and denominator by x: (m + (sin x)/x) / (n + (cos x)/x).'),
        tx('|sin x|/x ≤ 1/x ve |cos x|/x ≤ 1/x → 0 (sıkıştırma).', '|sin x|/x ≤ 1/x and |cos x|/x ≤ 1/x → 0 (squeeze).'), `${tx('Limit', 'Limit')} = ${m}/${n} = ${frac(m, n)}`], rng);
    return chk(q, { t: 'lim', f: (x) => (m * x + Math.sin(x)) / (n * x + Math.cos(x)), a: Infinity, side: 0 });
  }

  function lmNotExist(rng) {
    const a = rng.nextInt(1, 6);
    return mk(T.squ(), tx('Aşağıdaki limitlerden hangisi MEVCUT DEĞİLDİR?', 'Which of the following limits DOES NOT EXIST?'), `lim(x→0) sin(${a}/x)`,
      [[`lim(x→0) x·sin(${a}/x)`, tx('Sıkıştırma teoremiyle limiti 0\'dır; x çarpanı salınımı bastırır.', 'By the squeeze theorem this limit is 0; the factor x damps the oscillation.')],
        ['lim(x→0) sin(x)/x', tx('Bu, sin x / x özel limitidir ve 1\'dir.', 'This is the special limit sin x / x and equals 1.')],
        ['lim(x→∞) 1/x', tx('x sonsuza giderken 1/x, 0\'a gider; limit vardır.', 'As x tends to infinity, 1/x tends to 0; the limit exists.')]],
      [tx(`sin(${a}/x) x → 0'da −1 ile 1 arasında sonsuz kez salınır: limit yok.`, `sin(${a}/x) oscillates infinitely often between −1 and 1 as x → 0: no limit.`), tx(`x·sin(${a}/x) sıkıştırma teoremi ile 0'a gider.`, `x·sin(${a}/x) tends to 0 by the squeeze theorem.`)], rng);
  }

  // =====================================================================================================
  // Graphs, one-sided limits, piecewise functions
  // =====================================================================================================

  function lmGraph(rng) {
    const a = rng.nextInt(-2, 3), m = rng.pick([-1, 1, 2]), L = rng.nextInt(-2, 3);
    const v = L + rng.pick([-3, -2, -1, 1, 2, 3]);
    const f = (x) => (Math.abs(x - a) < 1e-9 ? NaN : m * (x - a) + L);
    const plot = new PlotSpec(a - 4, a + 4, L - 6, L + 6).addCurve(f).addPoint(a, L, '', true).addPoint(a, v, '', false);
    const q = mk(T.sid(),
      tx(`Grafikte x = ${a} noktasında eğri boş (○) bir noktadan geçerken f(${a}) değeri ayrı dolu (●) bir noktadır. lim(x→${a}) f(x) kaç olur?`, `On the graph, at x = ${a} the curve passes through an open point (○) while f(${a}) is a separate filled point (●). What is lim(x→${a}) f(x)?`),
      String(L),
      [[String(v), tx('Dolu noktanın değerini yani f(a)\'yı okumuşsun; limit, eğrinin yaklaştığı yükseklik olan boş noktadır.', 'You read the filled point, f(a); the limit is the height the curve approaches, the open point.')],
        [DNE(), tx('Sol ve sağ taraftan eğri aynı yüksekliğe yaklaşıyor; limit vardır.', 'From both sides the curve approaches the same height, so the limit exists.')],
        [String(L + 1), tx('Okuma hatası: boş noktanın yüksekliğini bir birim yanlış almışsın.', 'Reading error: you were one unit off the open point\'s height.')]],
      [tx('Limit, x → a iken eğrinin yaklaştığı y değeridir; f(a)\'nın değeri önemsizdir.', 'The limit is the y-value the curve approaches as x → a; the value f(a) does not matter.'),
        tx(`Soldan ve sağdan eğri y = ${L} değerine yaklaşır ⇒ limit ${L}.`, `From the left and right the curve approaches y = ${L} ⇒ the limit is ${L}.`)], rng, plot);
    return chk(q, { t: 'lim', f: (x) => m * (x - a) + L, a, side: 0 });
  }

  function lmGraphJump(rng) {
    const a = rng.nextInt(-2, 3), pL = rng.nextInt(-2, 3), pR = pL + rng.pick([-3, -2, -1, 1, 2, 3]);
    const m1 = rng.pick([-1, 0, 1]), m2 = rng.pick([-1, 0, 1]);
    const w = Math.max(pL, pR) + 1;
    const fa = [pL, pR, w][rng.nextInt(0, 3)];
    const f = (x) => (x < a ? pL + m1 * (x - a) : x > a ? pR + m2 * (x - a) : fa);
    const plot = new PlotSpec(a - 4, a + 4, Math.min(pL, pR) - 5, Math.max(pL, pR, w) + 4)
      .addCurve((x) => (x < a - 1e-9 ? pL + m1 * (x - a) : NaN)).addCurve((x) => (x > a + 1e-9 ? pR + m2 * (x - a) : NaN));
    if (fa !== pL) plot.addPoint(a, pL, '', true);
    if (fa !== pR) plot.addPoint(a, pR, '', true);
    plot.addPoint(a, fa, '', false);
    const ans = pL - pR + fa;
    const q = mk(T.sid(),
      tx(`Grafiğe göre lim(x→${a}⁻) f(x) − lim(x→${a}⁺) f(x) + f(${a}) ifadesinin değeri kaçtır? (○ boş, ● dolu nokta)`, `From the graph, what is lim(x→${a}⁻) f(x) − lim(x→${a}⁺) f(x) + f(${a})? (○ open point, ● filled point)`),
      String(ans),
      [[String(pL + pR + fa), tx('Sağ limitin işaretini değiştirmemişsin; ifade sağ limiti çıkarır.', 'You did not subtract the right-hand limit; the expression subtracts it.')],
        [String(pL - pR), tx('f(a) terimini eklemeyi unutmuşsun (dolu noktanın yüksekliği).', 'You forgot to add f(a) (the height of the filled point).')],
        [String(pR - pL + fa), tx('Sol ve sağ limitleri yer değiştirmişsin.', 'You swapped the left and right limits.')],
        [String(pL - pR - fa), tx('f(a) terimini çıkarmışsın; ifade +f(a) içeriyor.', 'You subtracted f(a); the expression has +f(a).')]],
      [tx(`Soldan limit = ${pL}, sağdan limit = ${pR}, f(${a}) = ${fa} (dolu nokta).`, `Left limit = ${pL}, right limit = ${pR}, f(${a}) = ${fa} (filled point).`), `${pL} − ${par(pR)} + ${par(fa)} = ${ans}`], rng, plot);
    return chk(q, { t: 'custom', f, a, combine: (l, r, fv) => l - r + fv });
  }

  function lmAbsRatio(rng) {
    const m = nz(rng, -3, 3), a = nz(rng, -4, 4), side = rng.pick([1, -1, 0]);
    const ex = `${m === 1 ? '' : m === -1 ? '-' : m}|${xs(a)}| / (${xs(a)})`;
    const f = (x) => (m * Math.abs(x - a)) / (x - a);
    let correct, pairs, step;
    if (side === 0) {
      correct = DNE();
      pairs = [[String(m), tx('Yalnızca sağdan limiti almışsın; iki yan limit farklı olduğundan limit yoktur.', 'You took only the right-hand limit; the one-sided limits differ, so the limit does not exist.')],
        [String(-m), tx('Yalnızca soldan limiti almışsın; sağdan limit farklıdır.', 'You took only the left-hand limit; the right-hand limit differs.')],
        ['0', tx('İki yan limiti ortalamışsın; limit için iki yan limitin eşit olması gerekir.', 'You averaged the one-sided limits; they must be equal for the limit to exist.')],
        [String(Math.abs(m)), tx('Mutlak değer yüzünden hep pozitif sanmışsın; x < a için (x − a) negatiftir.', 'You assumed a positive value because of the absolute value; for x < a the factor (x − a) is negative.')]];
      step = tx(`Sağdan: ${m}, soldan: ${-m}. Eşit olmadığından limit yoktur.`, `From the right: ${m}, from the left: ${-m}. They differ, so the limit does not exist.`);
    } else {
      const val = side > 0 ? m : -m;
      correct = String(val);
      pairs = [[String(-val), tx('Yaklaşma yönüne göre |x − a| işaretini ters almışsın.', 'You got the sign of |x − a| backwards for this direction of approach.')],
        ['0', tx('Pay ve payda birlikte 0\'a gider; oran 0 değil, sabit ±m\'dir.', 'Numerator and denominator both tend to 0; the ratio is the constant ±m, not 0.')],
        [DNE(), tx('Tek taraflı limit sorulduğunda bu yöndeki değer sabittir; limit vardır.', 'For a one-sided limit the value in that direction is constant, so it exists.')],
        [String(Math.abs(m) + 1), tx('Katsayı hatası.', 'A coefficient error.')]];
      step = side > 0 ? tx(`x > ${a} ⇒ |x − ${a}| = x − ${a} ⇒ ifade = ${m}.`, `x > ${a} ⇒ |x − ${a}| = x − ${a} ⇒ the expression equals ${m}.`) : tx(`x < ${a} ⇒ |x − ${a}| = −(x − ${a}) ⇒ ifade = ${-m}.`, `x < ${a} ⇒ |x − ${a}| = −(x − ${a}) ⇒ the expression equals ${-m}.`);
    }
    const q = mk(T.sid(), tx(`lim(x→${a}${sideSup(side)}) ${ex} limiti nedir?`, `What is lim(x→${a}${sideSup(side)}) ${ex}?`), correct, pairs,
      [tx('Mutlak değeri parçalı yaz: x > a için |x − a| = x − a, x < a için −(x − a).', 'Write the absolute value piecewise: |x − a| = x − a for x > a, −(x − a) for x < a.'), step], rng);
    return chk(q, side === 0 ? { t: 'dne', f, a } : { t: 'lim', f, a, side });
  }

  function lmOneSided(rng) {
    const a = nz(rng, -5, 5);
    const num = rng.nextInt(0, 2) === 0 ? 1 : -1, side = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const sgn = infStr(num * side);
    const q = mk(T.sid(), tx(`lim(x→${a}${side > 0 ? '⁺' : '⁻'}) ${num < 0 ? '-' : ''}1/(x ${plus(-a)}) limiti nedir?`, `What is lim(x→${a}${side > 0 ? '⁺' : '⁻'}) ${num < 0 ? '-' : ''}1/(x ${plus(-a)})?`), sgn,
      [[infStr(-num * side), tx('Sonsuzun işaretini ters almışsın; paydanın ve baştaki işaretin birlikte etkisine bak.', 'You got the sign of the infinity backwards; check the denominator\'s sign and the leading sign together.')],
        ['0', tx('Payda 0\'a giderken kesir büyür, 0\'a gitmez.', 'As the denominator tends to 0, the fraction blows up; it does not go to 0.')],
        ['1', tx('Paydayı 1 gibi düşünmüşsün; payda 0\'a yaklaşıyor.', 'You treated the denominator as if it were 1; it is approaching 0.')]],
      [tx(`x ${side > 0 ? 'sağdan' : 'soldan'} ${a}'ya yaklaşırken (x ${plus(-a)}) ${side > 0 ? 'küçük pozitif' : 'küçük negatif'} olur.`, `As x approaches ${a} from the ${side > 0 ? 'right' : 'left'}, (x ${plus(-a)}) is ${side > 0 ? 'small positive' : 'small negative'}.`),
        tx(`1 bölü küçük ${side > 0 ? 'pozitif' : 'negatif'} sayı çok büyük ${side > 0 ? 'pozitif' : 'negatif'}; baştaki işaret ${num < 0 ? '(-)' : '(+)'}: sonuç ${sgn}.`, `1 divided by a small ${side > 0 ? 'positive' : 'negative'} number is a very large ${side > 0 ? 'positive' : 'negative'} number; the leading sign is ${num < 0 ? '(-)' : '(+)'}: result ${sgn}.`)], rng,
      new PlotSpec(a - 5, a + 5, -8, 8).addCurve((x) => (Math.abs(x - a) < 0.05 ? NaN : num / (x - a))).addSegment(a, -8, a, 8, true));
    return chk(q, { t: 'lim', f: (x) => num / (x - a), a, side });
  }

  function lmPiece(rng) {
    const a = rng.nextInt(-2, 4), p = rng.nextInt(-3, 4), q = nz(rng, -3, 3), r = rng.nextInt(-4, 5);
    const right = rng.nextInt(0, 2) === 0;
    const lv = a + p, rv = q * a + r;
    const ans = right ? rv : lv;
    const fL = (x) => (x < a ? x + p : NaN), fR = (x) => (x >= a ? q * x + r : NaN);
    const ys = [a - 4 + p, a + 4 * q + r, lv, rv];
    const qq = mk(T.sid(), tx(`f(x) = { x ${plus(p)}, x < ${a} ;  ${polyStr(r, q)}, x ≥ ${a} }  için lim(x→${a}${right ? '⁺' : '⁻'}) f(x) kaçtır?`, `For f(x) = { x ${plus(p)}, x < ${a} ;  ${polyStr(r, q)}, x ≥ ${a} }, what is lim(x→${a}${right ? '⁺' : '⁻'}) f(x)?`), String(ans),
      [[String(right ? lv : rv), tx('Yanlış parçayı kullanmışsın; yaklaşma yönü hangi formülün geçerli olduğunu belirler.', 'You used the wrong piece; the side of approach decides which formula applies.')],
        [String(lv + rv), tx('İki parçanın değerlerini toplamışsın; tek taraflı limit yalnızca ilgili parçayı kullanır.', 'You added both pieces\' values; a one-sided limit uses only the relevant piece.')]],
      [right ? tx(`Sağdan yaklaşırken x > ${a}: ikinci parça kullanılır.`, `Approaching from the right, x > ${a}: use the second piece.`) : tx(`Soldan yaklaşırken x < ${a}: birinci parça kullanılır.`, `Approaching from the left, x < ${a}: use the first piece.`), tx(`Değer = ${ans}`, `Value = ${ans}`)], rng,
      new PlotSpec(a - 4, a + 4, Math.min(...ys) - 2, Math.max(...ys) + 2).addCurve(fL).addCurve(fR).addPoint(a, lv, '', true).addPoint(a, rv, '', false));
    return chk(qq, { t: 'lim', f: (x) => (x < a ? x + p : q * x + r), a, side: right ? 1 : -1 });
  }

  function lmExistsPiece(rng) {
    const a = nz(rng, -3, 3), p = nz(rng, -3, 3), q = rng.nextInt(-4, 5), m = nz(rng, -3, 3);
    const lv = p * a + q, exists = rng.nextInt(0, 2) === 0;
    const d = exists ? 0 : rng.pick([-3, -2, -1, 1, 2, 3]);
    const n = lv - m * a + d, rv = m * a + n;
    const f = (x) => (x < a ? p * x + q : m * x + n);
    const ys = [f(a - 4), f(a + 4), lv, rv];
    const plot = new PlotSpec(a - 4, a + 4, Math.min(...ys) - 2, Math.max(...ys) + 2).addCurve((x) => (x < a ? p * x + q : NaN)).addCurve((x) => (x >= a ? m * x + n : NaN)).addPoint(a, lv, '', true).addPoint(a, rv, '', false);
    const text = tx(`f(x) = { ${polyStr(q, p)}, x < ${a} ;  ${polyStr(n, m)}, x ≥ ${a} }  için lim(x→${a}) f(x) nedir?`, `For f(x) = { ${polyStr(q, p)}, x < ${a} ;  ${polyStr(n, m)}, x ≥ ${a} }, what is lim(x→${a}) f(x)?`);
    const sol = [tx(`Soldan: ${polyStr(q, p)} → ${lv};  sağdan: ${polyStr(n, m)} → ${rv}.`, `From the left: ${polyStr(q, p)} → ${lv};  from the right: ${polyStr(n, m)} → ${rv}.`),
      exists ? tx(`İki yan limit eşit (${lv}) ⇒ limit vardır ve ${lv}'dir.`, `The one-sided limits agree (${lv}) ⇒ the limit exists and equals ${lv}.`) : tx(`${lv} ≠ ${rv} ⇒ iki yan limit farklı, limit yoktur.`, `${lv} ≠ ${rv} ⇒ the one-sided limits differ, so the limit does not exist.`)];
    let q1;
    if (exists) {
      q1 = mk(T.sid(), text, String(lv),
        [[DNE(), tx('Parçalı fonksiyon olması limitin olmadığı anlamına gelmez; iki yan limit eşit çıkıyor.', 'Being piecewise does not mean the limit fails; here the one-sided limits agree.')],
          [String(lv + 1), tx('Yerine koyma hatası.', 'A substitution slip.')],
          [String(lv + rv), tx('İki yan limiti toplamışsın; eşit olduklarında ortak değer alınır.', 'You added the one-sided limits; when equal, take the common value.')]], sol, rng, plot);
      return chk(q1, { t: 'lim', f, a, side: 0 });
    }
    q1 = mk(T.sid(), text, DNE(),
      [[String(lv), tx('Yalnızca soldan limiti vermişsin; sağdan limit farklı olduğu için iki yönlü limit yoktur.', 'You gave only the left-hand limit; the right-hand limit differs, so the two-sided limit does not exist.')],
        [String(rv), tx('Yalnızca sağdan limiti (ya da f(a)\'yı) vermişsin; soldan limit farklıdır.', 'You gave only the right-hand limit (or f(a)); the left-hand limit differs.')],
        [String(lv + rv), tx('İki yan limiti toplamışsın; eşit olmadıkları için limit yoktur.', 'You added the one-sided limits; since they differ the limit does not exist.')],
        [String(lv - rv), tx('İki yan limitin farkını almışsın; limit bir fark değildir.', 'You took the difference of the one-sided limits; a limit is not a difference.')],
        [frac(lv + rv, 2), tx('İki yan limitin ortalamasını almışsın; limit ortalama değildir, iki yan limit eşit olmalıdır.', 'You averaged the one-sided limits; a limit is not an average, the one-sided limits must be equal.')],
        ['0', tx('Parçaların farkını 0 sanmışsın; iki yan limit farklı olduğundan limit yoktur.', 'You assumed the pieces cancel to 0; the one-sided limits differ, so the limit does not exist.')]], sol, rng, plot);
    return chk(q1, { t: 'dne', f, a });
  }

  // =====================================================================================================
  // epsilon-delta
  // =====================================================================================================

  function edDefinition(rng) {
    const a = rng.nextInt(-3, 4), L = rng.nextInt(-4, 5);
    const head = (e, d) => tx(`Her ${e} > 0 için bir ${d} > 0 vardır:`, `For every ${e} > 0 there is a ${d} > 0 such that:`);
    const correct = `${head('ε', 'δ')} 0 < |x − ${a}| < δ ⇒ |f(x) − ${par(L)}| < ε`;
    const q = mk(T.eps(), tx(`lim(x→${a}) f(x) = ${L} ifadesinin ε–δ tanımı hangisidir?`, `Which is the ε–δ definition of lim(x→${a}) f(x) = ${L}?`), correct,
      [[`${head('δ', 'ε')} 0 < |x − ${a}| < δ ⇒ |f(x) − ${par(L)}| < ε`, tx('ε ve δ\'nın rollerini ters almışsın: önce ε (çıktı toleransı) verilir, sonra δ bulunur.', 'You swapped the roles of ε and δ: ε (output tolerance) is given first, then δ is found.')],
        [`${head('ε', 'δ')} 0 < |f(x) − ${par(L)}| < ε ⇒ |x − ${a}| < δ`, tx('Koşul ile sonucu yer değiştirmişsin: x\'e (δ) bağlı koşul sonuçta f(x) için ε sınırını vermeli.', 'You swapped hypothesis and conclusion: the condition on x (δ) must lead to the ε-bound on f(x).')],
        [`${head('ε', 'δ')} |x − ${a}| < δ ⇒ |f(x) − ${par(L)}| < ε`, tx('0 < koşulunu atmışsın; limit için x = a\'ya bakılmaz (aksi halde f(a) = L, yani süreklilik olurdu).', 'You dropped the 0 < condition; the limit ignores x = a (otherwise it would say f(a) = L, i.e. continuity).')]],
      [tx('Tanım: her ε > 0 için öyle δ > 0 vardır ki x, a\'ya δ kadar yakın (ama a ≠ x) ise f(x), L\'ye ε kadar yakındır.', 'Definition: for every ε > 0 there is a δ > 0 such that if x is within δ of a (but x ≠ a), then f(x) is within ε of L.'),
        correct], rng);
    return q;
  }

  function edLinear(rng) {
    const m = nz(rng, -5, 5) || 2, am = Math.abs(m), a = nz(rng, -3, 3), b = rng.nextInt(-4, 5), e = rng.nextInt(1, 5);
    const am2 = am < 2 ? 2 : am;
    const mm = m < 0 ? -am2 : am2;
    const L = mm * a + b;
    const f = (x) => mm * x + b;
    const q = mk(T.eps(),
      tx(`lim(x→${a}) (${polyStr(b, mm)}) = ${L}. ε = ${e} için |f(x) − ${L}| < ε koşulunu sağlayan EN BÜYÜK δ kaçtır?`, `lim(x→${a}) (${polyStr(b, mm)}) = ${L}. For ε = ${e}, what is the LARGEST δ that guarantees |f(x) − ${L}| < ε?`),
      frac(e, Math.abs(mm)),
      [[String(e * Math.abs(mm)), tx('ε\'u |m| ile çarpmışsın; |f(x) − L| = |m||x − a| olduğundan δ = ε/|m| olur.', 'You multiplied ε by |m|; since |f(x) − L| = |m||x − a|, δ = ε/|m|.')],
        [frac(Math.abs(mm), e), tx('Oranı ters yazmışsın: δ = ε/|m|, |m|/ε değil.', 'You inverted the ratio: δ = ε/|m|, not |m|/ε.')],
        [String(e), tx('δ = ε almışsın; bu yalnızca eğim 1 olduğunda doğrudur.', 'You took δ = ε, which only works when the slope is 1.')],
        [frac(e, Math.abs(mm) + 1), tx('Paydaya 1 eklemişsin; eğim olduğu gibi alınır.', 'You added 1 to the slope; use it as it is.')],
        [frac(e, Math.abs(mm) * Math.abs(mm)), tx('Eğimin karesini almışsın.', 'You squared the slope.')]],
      [`|f(x) − ${L}| = |${mm}x ${plus(b)} − ${par(L)}| = ${Math.abs(mm)}|x − ${a}|`, tx(`${Math.abs(mm)}|x − ${a}| < ${e} ⇔ |x − ${a}| < ${e}/${Math.abs(mm)}`, `${Math.abs(mm)}|x − ${a}| < ${e} ⇔ |x − ${a}| < ${e}/${Math.abs(mm)}`), `δ = ${frac(e, Math.abs(mm))}`], rng);
    return chk(q, { t: 'delta', f, a, L, eps: e, delta: e / Math.abs(mm), tight: true });
  }

  function edLinearInv(rng) {
    const m = rng.nextInt(2, 6), k = nz(rng, -2, 2), a = m * k, b = rng.nextInt(-4, 5), e = rng.nextInt(1, 4);
    const L = k + b;
    const f = (x) => x / m + b;
    const q = mk(T.eps(),
      tx(`lim(x→${a}) (x/${m} ${plus(b)}) = ${L}. ε = ${e} için |f(x) − ${L}| < ε koşulunu sağlayan EN BÜYÜK δ kaçtır?`, `lim(x→${a}) (x/${m} ${plus(b)}) = ${L}. For ε = ${e}, what is the LARGEST δ that guarantees |f(x) − ${L}| < ε?`),
      String(e * m),
      [[frac(e, m), tx('δ = ε/m demişsin; ama |f(x) − L| = |x − a|/m olduğundan δ = m·ε olur.', 'You used δ = ε/m, but |f(x) − L| = |x − a|/m, so δ = m·ε.')],
        [String(e), tx('δ = ε almışsın; eğim 1/m olduğundan δ = m·ε.', 'You took δ = ε; the slope is 1/m, so δ = m·ε.')],
        [String(e + m), tx('ε ile m\'yi toplamışsın; çarpılmalı.', 'You added ε and m; they should be multiplied.')],
        [frac(m, e), tx('Oranı ters almışsın.', 'You inverted the ratio.')]],
      [`|f(x) − ${L}| = |x/${m} − ${k}| = |x − ${a}|/${m}`, tx(`|x − ${a}|/${m} < ${e} ⇔ |x − ${a}| < ${e * m}`, `|x − ${a}|/${m} < ${e} ⇔ |x − ${a}| < ${e * m}`), `δ = ${e * m}`], rng);
    return chk(q, { t: 'delta', f, a, L, eps: e, delta: e * m, tight: true });
  }

  function edQuad(rng) {
    const a = nz(rng, -4, 4), m = rng.nextInt(1, 4), e = rng.nextInt(1, 3);
    const K = m * (2 * Math.abs(a) + 1);
    const f = (x) => m * x * x;
    const q = mk(T.eps(),
      tx(`lim(x→${a}) ${m === 1 ? '' : m}x² = ${m * a * a} için ε = ${e} verilmiş. Standart yöntemle (önce δ ≤ 1 alınıp |x + ${a}| ≤ 2|${a}| + 1 sınırı kullanılarak) bulunan δ değeri kaçtır?`, `For lim(x→${a}) ${m === 1 ? '' : m}x² = ${m * a * a} with ε = ${e}, what δ does the standard method give (first take δ ≤ 1 and use the bound |x + ${a}| ≤ 2|${a}| + 1)?`),
      frac(e, K),
      [[frac(e, m * 2 * Math.abs(a)), tx('|x + a| ≤ 2|a| + 1 sınırında +1\'i unutmuşsun (δ ≤ 1 olduğundan x, a\'dan 1 kadar sapabilir).', 'You dropped the +1 in |x + a| ≤ 2|a| + 1 (with δ ≤ 1, x can deviate from a by up to 1).')],
        [frac(e, 2 * Math.abs(a) + 1), tx('m katsayısını hesaba katmamışsın; |f(x) − L| = m|x − a||x + a|.', 'You ignored the coefficient m; |f(x) − L| = m|x − a||x + a|.')],
        [frac(e, m * (Math.abs(a) + 1)), tx('|x + a| için 2|a| + 1 yerine |a| + 1 kullanmışsın; x + a ≈ 2a olur.', 'You used |a| + 1 instead of 2|a| + 1 for |x + a|; x + a is about 2a.')],
        [frac(e, m * a * a), tx('Sınır olarak a² kullanmışsın; çarpan |x + a|, a² değil.', 'You used a² as the bound; the factor is |x + a|, not a².')],
        [frac(e, 2 * K), tx('Sınırı iki kat büyük almışsın; |x + a| ≤ 2|a| + 1 yeterlidir.', 'You doubled the bound; |x + a| ≤ 2|a| + 1 is enough.')],
        [frac(e, K + 1), tx('Sınıra fazladan 1 eklemişsin.', 'You added an extra 1 to the bound.')]],
      [`|${m}x² − ${m * a * a}| = ${m}|x − ${a}|·|x + ${a}|`, tx(`δ ≤ 1 ise |x − ${a}| < 1 ⇒ |x + ${a}| ≤ 2|${a}| + 1 = ${2 * Math.abs(a) + 1}`, `If δ ≤ 1 then |x − ${a}| < 1 ⇒ |x + ${a}| ≤ 2|${a}| + 1 = ${2 * Math.abs(a) + 1}`),
        tx(`${K}|x − ${a}| < ${e} için δ = ${frac(e, K)} (ve ≤ 1) yeterlidir.`, `${K}|x − ${a}| < ${e} is guaranteed by δ = ${frac(e, K)} (which is ≤ 1).`)], rng);
    return chk(q, { t: 'delta', f, a, L: m * a * a, eps: e, delta: e / K, tight: false });
  }

  // =====================================================================================================
  // Continuity and types of discontinuity
  // =====================================================================================================

  function ctThreePart(rng) {
    const a = rng.nextInt(-3, 4), v = rng.nextInt(-3, 5), sc = rng.nextInt(0, 4);
    let fa, lft, rgt, kind;
    if (sc === 0) { fa = String(v); lft = String(v); rgt = String(v); kind = 'A'; }
    else if (sc === 1) { fa = String(v + rng.pick([-2, -1, 1, 2])); lft = String(v); rgt = String(v); kind = 'C'; }
    else if (sc === 2) { fa = tx('tanımsız', 'undefined'); lft = String(v); rgt = String(v); kind = 'D'; }
    else { fa = String(v); lft = String(v); rgt = String(v + rng.pick([-2, -1, 1, 2])); kind = 'B'; }
    const O = {
      A: tx('f, x = a\'da süreklidir', 'f is continuous at x = a'),
      B: tx('Süreksiz: limit yok (soldan ≠ sağdan)', 'Discontinuous: the limit does not exist (left ≠ right)'),
      C: tx('Süreksiz: limit var ama f(a)\'ya eşit değil', 'Discontinuous: the limit exists but differs from f(a)'),
      D: tx('Süreksiz: f(a) tanımsız', 'Discontinuous: f(a) is undefined'),
    };
    const NOTE = {
      A: tx('f(a), limit ve limit = f(a) koşullarının üçü de sağlanmıyor; süreklilik demek için hepsi gerekir.', 'The three conditions (f(a) defined, limit exists, limit = f(a)) do not all hold here; continuity needs all of them.'),
      B: tx('Bu tabloda iki yan limit eşit değil mi diye bakmalısın; durumun gerçekte başka bir koşulu bozuyor.', 'Check whether the one-sided limits are equal; in this table a different condition is the one that fails.'),
      C: tx('Limitin f(a)\'ya eşit olup olmadığını kontrol et; bu tabloda sorun başka bir koşulda.', 'Check whether the limit equals f(a); in this table the failure lies in a different condition.'),
      D: tx('f(a)\'nın tanımlı olup olmadığına bak; bu tabloda sorun başka bir koşulda.', 'Check whether f(a) is defined; in this table the failure lies in a different condition.'),
    };
    const order = ['A', 'B', 'C', 'D'];
    const wrongs = order.filter((k) => k !== kind).map((k) => [O[k], NOTE[k]]);
    return mk(T.cnt(),
      tx(`Bir f fonksiyonu için: f(${a}) = ${fa}, lim(x→${a}⁻) f(x) = ${lft}, lim(x→${a}⁺) f(x) = ${rgt}. Süreklilik için üç koşulu (f(a) tanımlı, limit var, limit = f(a)) sınadığında ne söylenebilir?`,
        `For a function f: f(${a}) = ${fa}, lim(x→${a}⁻) f(x) = ${lft}, lim(x→${a}⁺) f(x) = ${rgt}. Testing the three conditions (f(a) defined, limit exists, limit = f(a)), what can be said?`),
      O[kind], wrongs,
      [tx('Süreklilik için: (1) f(a) tanımlı, (2) lim f(x) var (iki yan limit eşit), (3) lim f(x) = f(a).', 'Continuity needs: (1) f(a) defined, (2) lim f(x) exists (equal one-sided limits), (3) lim f(x) = f(a).'),
        sc === 0 ? tx('Üçü de sağlanıyor.', 'All three hold.') : sc === 1 ? tx('Limit var ama f(a)\'ya eşit değil.', 'The limit exists but is not equal to f(a).') : sc === 2 ? tx('f(a) tanımsız.', 'f(a) is undefined.') : tx('Soldan ve sağdan limitler farklı.', 'The left and right limits differ.')], rng);
  }

  function ctType(rng) {
    const sc = rng.nextInt(0, 4);
    const KIND = {
      rem: tx('Kaldırılabilir', 'Removable'), jump: tx('Sıçrama', 'Jump'), inf: tx('Sonsuz', 'Infinite'), osc: tx('Salınımlı', 'Oscillating'),
    };
    const NOTE = {
      rem: tx('Kaldırılabilir süreksizlikte limit sonlu ve vardır (delik); burada durum bu değil.', 'A removable discontinuity has a finite limit (a hole); that is not the case here.'),
      jump: tx('Sıçrama süreksizliğinde iki yan limit sonlu ama farklıdır; burada durum bu değil.', 'A jump discontinuity has finite but different one-sided limits; that is not the case here.'),
      inf: tx('Sonsuz süreksizlikte fonksiyon düşey asimptota doğru ±∞\'a gider; burada durum bu değil.', 'An infinite discontinuity means the function blows up towards a vertical asymptote; that is not the case here.'),
      osc: tx('Salınımlı süreksizlikte fonksiyon sonsuz kez salınır; burada durum bu değil.', 'An oscillating discontinuity means infinite oscillation; that is not the case here.'),
    };
    let key, text, f, a, plot = null, sol, spec;
    if (sc === 0) {
      a = nz(rng, -4, 4); key = 'rem';
      text = tx(`f(x) = (${polyStr(-a * a, 0, 1)}) / (${xs(a)}) fonksiyonunun x = ${a} noktasındaki süreksizliği hangi türdendir?`, `What type of discontinuity does f(x) = (${polyStr(-a * a, 0, 1)}) / (${xs(a)}) have at x = ${a}?`);
      f = (x) => (x * x - a * a) / (x - a);
      plot = new PlotSpec(a - 5, a + 5, 2 * a - 6, 2 * a + 6).addCurve((x) => (Math.abs(x - a) < 1e-9 ? NaN : x + a)).addPoint(a, 2 * a, '', true);
      sol = [tx(`Sadeleştir: (x − ${a})(x + ${a})/(x − ${a}) = x + ${a} (x ≠ ${a})`, `Simplify: (x − ${a})(x + ${a})/(x − ${a}) = x + ${a} (x ≠ ${a})`), tx(`Limit ${2 * a} sonlu ama f(${a}) tanımsız ⇒ delik: kaldırılabilir.`, `The limit ${2 * a} is finite but f(${a}) is undefined ⇒ a hole: removable.`)];
      spec = { t: 'kind', f, a, kind: 'rem' };
    } else if (sc === 1) {
      a = rng.nextInt(-3, 4); key = 'jump';
      const p = rng.nextInt(-3, 4), j = rng.pick([-3, -2, -1, 1, 2, 3]);
      text = tx(`f(x) = { x ${plus(p)}, x < ${a} ;  x ${plus(p + j)}, x ≥ ${a} } fonksiyonunun x = ${a} noktasındaki süreksizliği hangi türdendir?`, `What type of discontinuity does f(x) = { x ${plus(p)}, x < ${a} ;  x ${plus(p + j)}, x ≥ ${a} } have at x = ${a}?`);
      f = (x) => (x < a ? x + p : x + p + j);
      plot = new PlotSpec(a - 4, a + 4, a + p - 6, a + p + j + 6).addCurve((x) => (x < a ? x + p : NaN)).addCurve((x) => (x >= a ? x + p + j : NaN)).addPoint(a, a + p, '', true).addPoint(a, a + p + j, '', false);
      sol = [tx(`Soldan limit = ${a + p}, sağdan limit = ${a + p + j}.`, `Left limit = ${a + p}, right limit = ${a + p + j}.`), tx('İki yan limit sonlu ama farklı ⇒ sıçrama süreksizliği.', 'Finite but different one-sided limits ⇒ jump discontinuity.')];
      spec = { t: 'kind', f, a, kind: 'jump' };
    } else if (sc === 2) {
      a = nz(rng, -4, 4); key = 'inf';
      const c = nz(rng, -3, 3), pw = rng.nextInt(1, 3);
      const numer = `${c}`;
      text = tx(`f(x) = ${numer} / (${xs(a)})${pw === 2 ? '²' : ''} fonksiyonunun x = ${a} noktasındaki süreksizliği hangi türdendir?`, `What type of discontinuity does f(x) = ${numer} / (${xs(a)})${pw === 2 ? '²' : ''} have at x = ${a}?`);
      f = (x) => c / Math.pow(x - a, pw);
      plot = new PlotSpec(a - 5, a + 5, -8, 8).addCurve((x) => (Math.abs(x - a) < 0.04 ? NaN : f(x))).addSegment(a, -8, a, 8, true);
      sol = [tx(`x → ${a} iken payda 0'a gider, pay ${c} ≠ 0.`, `As x → ${a} the denominator tends to 0 while the numerator is ${c} ≠ 0.`), tx('Fonksiyon ±∞\'a gider ⇒ sonsuz süreksizlik (düşey asimptot).', 'The function tends to ±∞ ⇒ infinite discontinuity (vertical asymptote).')];
      spec = { t: 'kind', f, a, kind: 'inf' };
    } else {
      a = 0; key = 'osc';
      const k = nz(rng, -3, 3), fn = rng.pick(['sin', 'cos']);
      text = tx(`f(x) = ${fn}(${k}/x) (x ≠ 0), f(0) = 0 fonksiyonunun x = 0 noktasındaki süreksizliği hangi türdendir?`, `What type of discontinuity does f(x) = ${fn}(${k}/x) (x ≠ 0), f(0) = 0 have at x = 0?`);
      sol = [tx(`x → 0 iken ${k}/x → ±∞ ve ${fn}(${k}/x), −1 ile 1 arasında sonsuz kez salınır.`, `As x → 0, ${k}/x → ±∞ and ${fn}(${k}/x) oscillates infinitely often between −1 and 1.`), tx('Ne sonlu bir limit ne de ±∞ var ⇒ salınımlı süreksizlik.', 'There is neither a finite limit nor ±∞ ⇒ oscillating discontinuity.')];
      spec = null;
    }
    const order = ['rem', 'jump', 'inf', 'osc'];
    const q = mk(T.cnt(), text, KIND[key], order.filter((k) => k !== key).map((k) => [KIND[k], NOTE[k]]), sol, rng, plot);
    return spec ? chk(q, spec) : q;
  }

  function ctWhereDiscont(rng) {
    const kind = rng.nextInt(0, 3);
    const R = (a, b) => `(−∞, ${a}) ∪ (${a}, ${b}) ∪ (${b}, ∞)`;
    if (kind === 0) {
      let a, b;
      do { a = rng.nextInt(-4, 4); b = a + rng.nextInt(1, 5); } while (a === b);
      return mk(T.cnt(), tx(`f(x) = 1 / [(${xs(a)})(${xs(b)})] fonksiyonu hangi kümede süreklidir?`, `On which set is f(x) = 1 / [(${xs(a)})(${xs(b)})] continuous?`), R(a, b),
        [[`(−∞, ${a}) ∪ (${a}, ∞)`, tx('x = b\'deki ikinci sıfırı da dışlamayı unutmuşsun.', 'You forgot to exclude the second zero, x = b.')],
          [`(−∞, ${b}) ∪ (${b}, ∞)`, tx('x = a\'daki sıfırı dışlamayı unutmuşsun.', 'You forgot to exclude the zero x = a.')],
          [`(${a}, ${b})`, tx('Sıfırlar arasındaki aralığı almışsın; rasyonel fonksiyon her tanım noktasında sürekli, dışarıdaki aralıklar da dahil.', 'You took only the interval between the zeros; a rational function is continuous everywhere it is defined, including outside.')],
          ['ℝ', tx('Payda sıfır olan noktalar tanımsızdır; fonksiyon orada sürekli olamaz.', 'The function is undefined where the denominator is 0, so it cannot be continuous there.')]],
        [tx(`Rasyonel fonksiyon, paydanın sıfır olduğu noktalar dışında süreklidir.`, 'A rational function is continuous except where the denominator is 0.'), tx(`Payda sıfır: x = ${a} ve x = ${b}.`, `Denominator zero: x = ${a} and x = ${b}.`), R(a, b)], rng);
    }
    if (kind === 1) {
      const k = rng.nextInt(1, 6), c = nz(rng, -3, 3);
      return mk(T.cnt(), tx(`f(x) = (${cf(c)}x) / (x² + ${k}) fonksiyonu hangi kümede süreklidir?`, `On which set is f(x) = (${cf(c)}x) / (x² + ${k}) continuous?`), 'ℝ',
        [['(−∞, 0) ∪ (0, ∞)', tx('Payın 0 olduğu nokta süreksizlik değildir; yalnızca payda sıfır olunca sorun çıkar.', 'A zero of the numerator is not a discontinuity; trouble only comes from a zero of the denominator.')],
          [`(−∞, −√${k}) ∪ (−√${k}, ∞)`, tx('x² + k = 0 denkleminin reel kökü yoktur; payda hiçbir x için 0 olmaz.', 'x² + k = 0 has no real root; the denominator never vanishes.')],
          ['[0, ∞)', tx('Fonksiyonun tanımı tüm reel sayılar için geçerlidir; bir kök ifadesi yok.', 'The function is defined for all real numbers; there is no radical.')],
          [`(−√${k}, √${k})`, tx('Payda x² + k hiçbir yerde sıfır olmaz; süreklilik bütün ℝ\'de geçerli.', 'The denominator x² + k never vanishes; continuity holds on all of ℝ.')]],
        [tx(`x² + ${k} ≥ ${k} > 0, payda hiçbir x için 0 olmaz.`, `x² + ${k} ≥ ${k} > 0, so the denominator is never 0.`), tx('Rasyonel fonksiyon her yerde tanımlı ⇒ ℝ\'de süreklidir.', 'The rational function is defined everywhere ⇒ continuous on ℝ.')], rng);
    }
    const a = nz(rng, -4, 4), c = nz(rng, -4, 4);
    return mk(T.cnt(), tx(`f(x) = (x ${plus(c)}) / (x² − ${a * a}) fonksiyonu hangi kümede süreklidir?`, `On which set is f(x) = (x ${plus(c)}) / (x² − ${a * a}) continuous?`),
      Math.abs(a) === 0 ? 'ℝ' : (() => { const lo = Math.min(-a, a), hi = Math.max(-a, a); return R(lo, hi); })(),
      [(() => { const lo = Math.min(-a, a); return [`(−∞, ${lo}) ∪ (${lo}, ∞)`, tx('Yalnızca bir kökü dışlamışsın; x² − a² = 0 için x = ±a iki kökü vardır.', 'You excluded only one root; x² − a² = 0 has two roots, x = ±a.')]; })(),
        [`(−∞, ${-c}) ∪ (${-c}, ∞)`, tx('Payın sıfırını dışlamışsın; asıl dışlanacaklar paydanın sıfırlarıdır.', 'You excluded the zero of the numerator; what must be excluded are the zeros of the denominator.')],
        ['ℝ', tx('Payda x = ±a\'da 0 olur; orada fonksiyon tanımsızdır.', 'The denominator is 0 at x = ±a, where the function is undefined.')],
        [`(${-Math.abs(a)}, ${Math.abs(a)})`, tx('Köklerin arasını almışsın; fonksiyon dışarıdaki aralıklarda da süreklidir.', 'You took only the interval between the roots; the function is continuous on the outer intervals too.')]],
      [tx(`Payda x² − ${a * a} = (x − ${a})(x + ${a}) sıfır olur: x = ±${Math.abs(a)}.`, `The denominator x² − ${a * a} = (x − ${a})(x + ${a}) vanishes at x = ±${Math.abs(a)}.`), tx('Rasyonel fonksiyon bu iki nokta dışında süreklidir.', 'The rational function is continuous except at these two points.')], rng);
  }

  function ctDomainSqrt(rng) {
    const a = rng.nextInt(-3, 3);
    if (rng.nextInt(0, 2) === 0) {
      const b = a + rng.nextInt(1, 5);
      return mk(T.cnt(), tx(`f(x) = √(x ${plus(-a)}) / (x ${plus(-b)}) fonksiyonu hangi kümede süreklidir?`, `On which set is f(x) = √(x ${plus(-a)}) / (x ${plus(-b)}) continuous?`), `[${a}, ${b}) ∪ (${b}, ∞)`,
        [[`(${a}, ${b}) ∪ (${b}, ∞)`, tx('Kökün tanım kümesi x ≥ a olduğundan x = a dahildir (köklü ifade orada tanımlı ve sağdan süreklidir).', 'The radical is defined for x ≥ a, so x = a is included (continuous from the right there).')],
          [`[${a}, ∞)`, tx('Paydanın sıfır olduğu x = b noktasını dışlamayı unutmuşsun.', 'You forgot to exclude x = b where the denominator vanishes.')],
          [`(−∞, ${b}) ∪ (${b}, ∞)`, tx('Kökün tanım koşulunu (x ≥ a) hesaba katmamışsın.', 'You ignored the radicand condition (x ≥ a).')],
          [`[${a}, ${b})`, tx('x = b\'den sonrası da tanımlıdır; yalnızca x = b dışlanır.', 'The function is also defined beyond x = b; only x = b itself is excluded.')]],
        [tx(`Kök: x ${plus(-a)} ≥ 0 ⇒ x ≥ ${a}.  Payda: x ≠ ${b}.`, `Radical: x ${plus(-a)} ≥ 0 ⇒ x ≥ ${a}.  Denominator: x ≠ ${b}.`), tx(`Süreklilik kümesi: [${a}, ${b}) ∪ (${b}, ∞).`, `Continuity set: [${a}, ${b}) ∪ (${b}, ∞).`)], rng);
    }
    const b = a - rng.nextInt(1, 5);
    return mk(T.cnt(), tx(`f(x) = √(${a} − x) / (x ${plus(-b)}) fonksiyonu hangi kümede süreklidir?`, `On which set is f(x) = √(${a} − x) / (x ${plus(-b)}) continuous?`), `(−∞, ${b}) ∪ (${b}, ${a}]`,
      [[`(−∞, ${b}) ∪ (${b}, ${a})`, tx('x = a\'da kök 0\'dır, tanımlıdır ve soldan süreklidir; uç nokta dahildir.', 'At x = a the root is 0, defined, and continuous from the left; the endpoint is included.')],
        [`(−∞, ${a}]`, tx('Paydanın sıfır olduğu x = b noktasını dışlamayı unutmuşsun.', 'You forgot to exclude x = b where the denominator vanishes.')],
        [`[${a}, ∞)`, tx('Kökün içi a − x ≥ 0, yani x ≤ a olmalı; yönü ters almışsın.', 'The radicand needs a − x ≥ 0, i.e. x ≤ a; you reversed the direction.')],
        [`(${b}, ${a}]`, tx('x < b tarafı da tanımlıdır; yalnızca x = b dışlanır.', 'The side x < b is defined too; only x = b is excluded.')]],
      [tx(`Kök: ${a} − x ≥ 0 ⇒ x ≤ ${a}.  Payda: x ≠ ${b} (ve ${b} < ${a}).`, `Radical: ${a} − x ≥ 0 ⇒ x ≤ ${a}.  Denominator: x ≠ ${b} (and ${b} < ${a}).`), tx(`Süreklilik kümesi: (−∞, ${b}) ∪ (${b}, ${a}].`, `Continuity set: (−∞, ${b}) ∪ (${b}, ${a}].`)], rng);
  }

  function ctTwoPoints(rng) {
    let a, b, c;
    do { a = rng.nextInt(-4, 5); b = rng.nextInt(-4, 5); c = rng.nextInt(-4, 5); } while (a === b || a === c || b === c);
    const nump = [a * b, -(a + b), 1], denp = [a * c, -(a + c), 1];
    const f = (x) => ((x - a) * (x - b)) / ((x - a) * (x - c));
    const O = (u, v) => tx(`x = ${a}: ${u}, x = ${c}: ${v}`, `x = ${a}: ${u}, x = ${c}: ${v}`);
    const rem = tx('kaldırılabilir', 'removable'), inf = tx('sonsuz', 'infinite'), jmp = tx('sıçrama', 'jump');
    const q = mk(T.cnt(), tx(`f(x) = (${polyStr(...nump)}) / (${polyStr(...denp)}) fonksiyonunun x = ${a} ve x = ${c} noktalarındaki süreksizlik türleri sırasıyla nedir?`, `What are the types of discontinuity of f(x) = (${polyStr(...nump)}) / (${polyStr(...denp)}) at x = ${a} and x = ${c}, respectively?`), O(rem, inf),
      [[O(inf, rem), tx('Türleri ters yazmışsın: sadeleşen çarpan kaldırılabilir, sadeleşmeyen sonsuz süreksizlik verir.', 'You swapped the types: the cancelling factor gives a removable one, the non-cancelling one an infinite one.')],
        [O(rem, rem), tx('x = c\'de payda çarpanı (x − c) sadeleşmiyor; orada fonksiyon sonsuza gider.', 'At x = c the denominator factor (x − c) does not cancel; the function blows up there.')],
        [O(inf, inf), tx('(x − a) hem payda hem payda olduğundan sadeleşir; x = a\'da yalnızca bir delik vardır.', '(x − a) appears in both numerator and denominator and cancels; x = a is merely a hole.')],
        [O(jmp, inf), tx('Rasyonel fonksiyonlarda sıçrama süreksizliği olmaz; delik ya da düşey asimptot olur.', 'Rational functions have no jump discontinuities; only holes or vertical asymptotes.')]],
      [tx(`Çarpanlara ayır: f(x) = (x − ${a})(x − ${b}) / [(x − ${a})(x − ${c})]`, `Factor: f(x) = (x − ${a})(x − ${b}) / [(x − ${a})(x − ${c})]`),
        tx(`x = ${a}: (x − ${a}) sadeleşir ⇒ limit sonlu, nokta tanımsız ⇒ kaldırılabilir.`, `x = ${a}: (x − ${a}) cancels ⇒ finite limit, undefined point ⇒ removable.`),
        tx(`x = ${c}: payda 0'a gider, pay ${c - b} ≠ 0 ⇒ sonsuz süreksizlik.`, `x = ${c}: the denominator tends to 0 while the numerator tends to ${c - b} ≠ 0 ⇒ infinite discontinuity.`)], rng);
    return chk(q, { t: 'kind2', f, a, c });
  }

  // =====================================================================================================
  // Finding parameters for continuity
  // =====================================================================================================

  function lmContinuity(rng) {
    const a = nz(rng, -5, 5);
    const q = mk(T.par(), tx(`f(x) = (x² - ${a * a})/(x ${plus(-a)}) (x ≠ ${a}),  f(${a}) = k. f'nin x = ${a}'da sürekli olması için k kaç olmalıdır?`, `f(x) = (x² - ${a * a})/(x ${plus(-a)}) (x ≠ ${a}),  f(${a}) = k. What must k be for f to be continuous at x = ${a}?`), String(2 * a),
      [['0', tx('0 almışsın; pay 0 olsa da sadeleşme sonrası limit 0 değildir.', 'You took 0 from the numerator; after cancelling, the limit is not 0.')],
        [String(a * a), tx('a² almışsın; sadeleşmeden sonra x + a\'nın limiti gerekir.', 'You used a²; after cancelling you need the limit of x + a.')],
        [String(a), tx('Tek bir a almışsın; x + a\'da iki terim de katkı yapar.', 'You took a single a; in x + a both terms contribute.')]],
      [tx('Süreklilik: lim f(x) = f(a) olmalı.', 'Continuity: we need lim f(x) = f(a).'), `lim(x→${a}) (x + ${a}) = ${2 * a}`, `k = ${2 * a}`], rng,
      new PlotSpec(a - 5, a + 5, 2 * a - 6, 2 * a + 6).addCurve((x) => (x === a ? NaN : x + a)).addPoint(a, 2 * a, '', true));
    return chk(q, { t: 'lim', f: (x) => (x * x - a * a) / (x - a), a, side: 0 });
  }

  function pcSimple(rng) {
    const a = nz(rng, -3, 3), m = nz(rng, -3, 3), n = rng.nextInt(-4, 5), p = nz(rng, -2, 2);
    const k = m * a + n - p * a * a;
    const left = (x) => m * x + n;
    const q = mk(T.par(), tx(`f(x) = { ${polyStr(n, m)}, x < ${a} ;  ${cf(p)}x² + k, x ≥ ${a} } fonksiyonunun x = ${a} noktasında sürekli olması için k kaç olmalıdır?`, `For which value of k is f(x) = { ${polyStr(n, m)}, x < ${a} ;  ${cf(p)}x² + k, x ≥ ${a} } continuous at x = ${a}?`), String(k),
      [[String(m * a + n), tx('Sol limiti k\'ya eşitlemişsin; oysa sağ parça p·a² + k\'dır, p·a²\'yi çıkarmalısın.', 'You set the left limit equal to k; the right piece is p·a² + k, so p·a² must be subtracted.')],
        [String(m * a + n + p * a * a), tx('p·a² terimini toplamışsın; sol limitten çıkarılmalı.', 'You added p·a²; it must be subtracted from the left limit.')],
        [String(-k), tx('Denklemin iki yanını ters kurmuşsun; k = (sol limit) − p·a².', 'You set up the equation backwards; k = (left limit) − p·a².')],
        [String(p * a * a - (m * a + n)), tx('Farkı ters sırada almışsın.', 'You subtracted in the wrong order.')]],
      [tx(`Soldan limit: ${m}·${par(a)} ${plus(n)} = ${left(a)}`, `Left limit: ${m}·${par(a)} ${plus(n)} = ${left(a)}`), tx(`Sağdan (ve f(${a})): ${p}·${a * a} + k`, `Right side (and f(${a})): ${p}·${a * a} + k`), tx(`Eşitle: ${p * a * a} + k = ${left(a)} ⇒ k = ${k}`, `Equate: ${p * a * a} + k = ${left(a)} ⇒ k = ${k}`)], rng);
    return chk(q, { t: 'cont', build: (nums) => (x) => (x < a ? m * x + n : p * x * x + nums[0]), pts: [a] });
  }

  function pcTrig(rng) {
    const a = rng.nextInt(2, 8);
    let b;
    do { b = rng.nextInt(2, 8); } while (b === a);
    const tn = rng.nextInt(0, 2) === 1;
    const fn = tn ? 'tan' : 'sin';
    const q = mk(T.par(), tx(`f(x) = ${fn}(${a}x) / (${b}x) (x ≠ 0),  f(0) = k. f'nin x = 0'da sürekli olması için k kaç olmalıdır?`, `f(x) = ${fn}(${a}x) / (${b}x) (x ≠ 0),  f(0) = k. What must k be for f to be continuous at x = 0?`), frac(a, b),
      [[frac(b, a), tx('Oranı ters yazmışsın; limit a/b\'dir.', 'You inverted the ratio; the limit is a/b.')],
        ['1', tx('Katsayıları hesaba katmadan sin x / x = 1 uygulamışsın.', 'You applied sin x / x = 1 without the coefficients.')],
        ['0', tx('Bu bir 0/0 belirsizliğidir; limit 0 değildir.', 'This is a 0/0 form; the limit is not 0.')],
        [String(a * b), tx('Katsayıları çarpmışsın; oranlanmalı.', 'You multiplied the coefficients; they form a ratio.')],
        [frac(a, b + 1), tx('Paydaya 1 eklemişsin.', 'You added 1 to the denominator.')]],
      [tx('Süreklilik için k = lim(x→0) f(x) olmalı.', 'For continuity k must equal lim(x→0) f(x).'), `lim ${fn}(${a}x)/(${b}x) = ${a}/${b}`, `k = ${frac(a, b)}`], rng);
    return chk(q, { t: 'cont0', build: () => (x) => (tn ? Math.tan(a * x) : Math.sin(a * x)) / (b * x), at: 0, h: 1e-4 });
  }

  function pcTwoParam(rng) {
    const c1 = rng.nextInt(-3, 0), c2 = c1 + rng.nextInt(2, 4);
    const a = nz(rng, -3, 3), b = nz(rng, -4, 4);
    const l1 = nz(rng, -2, 2), r1 = nz(rng, -2, 2);
    const l0 = a * c1 + b - l1 * c1, r0 = a * c2 + b - r1 * c2;
    const f = (x) => (x < c1 ? l1 * x + l0 : x <= c2 ? a * x + b : r1 * x + r0);
    const ans = `a = ${a}, b = ${b}`;
    const q = mk(T.par(), tx(`f(x) = { ${polyStr(l0, l1)}, x < ${c1} ;  ax + b, ${c1} ≤ x ≤ ${c2} ;  ${polyStr(r0, r1)}, x > ${c2} } fonksiyonu her yerde sürekli olacak biçimde a ve b kaç olmalıdır?`, `For which a and b is f(x) = { ${polyStr(l0, l1)}, x < ${c1} ;  ax + b, ${c1} ≤ x ≤ ${c2} ;  ${polyStr(r0, r1)}, x > ${c2} } continuous everywhere?`), ans,
      [[`a = ${b}, b = ${a}`, tx('a ile b\'yi yer değiştirmişsin; birinci denklemin x\'li terimi a\'nın katsayısıdır.', 'You swapped a and b; the coefficient of x in the equations belongs to a.')],
        [`a = ${-a}, b = ${b}`, tx('Denklemleri çıkarırken a\'nın işaretini ters bulmuşsun.', 'You got the sign of a wrong when subtracting the equations.')],
        [`a = ${a}, b = ${-b}`, tx('a\'yı doğru bulmuşsun ama b\'yi yerine koyarken işaret hatası yapmışsın.', 'You found a correctly but made a sign error when solving for b.')],
        [`a = ${a + 1}, b = ${b}`, tx('İki süreklilik denkleminden yalnızca birini düzgün kullanmışsın; her iki geçiş noktasında da eşitlik gerekir.', 'You used only one continuity equation correctly; equality is needed at both junctions.')]],
      [tx(`x = ${c1} noktasında: ${c1}a + b = ${l1 * c1 + l0}`, `At x = ${c1}: ${c1}a + b = ${l1 * c1 + l0}`), tx(`x = ${c2} noktasında: ${c2}a + b = ${r1 * c2 + r0}`, `At x = ${c2}: ${c2}a + b = ${r1 * c2 + r0}`),
        tx(`Çıkar: ${c2 - c1}a = ${r1 * c2 + r0 - (l1 * c1 + l0)} ⇒ a = ${a};  b = ${b}`, `Subtract: ${c2 - c1}a = ${r1 * c2 + r0 - (l1 * c1 + l0)} ⇒ a = ${a};  b = ${b}`)], rng);
    return chk(q, { t: 'cont', build: (nums) => (x) => (x < c1 ? l1 * x + l0 : x <= c2 ? nums[0] * x + nums[1] : r1 * x + r0), pts: [c1, c2], nparams: 2 });
  }

  function pcSqrtQuad(rng) {
    let s, a;
    do { s = rng.nextInt(2, 6); a = nz(rng, -4, 4); } while (s === Math.abs(a));
    const m = s * s - a * a;
    const q = mk(T.par(), tx(`f(x) = (√(${polyStr(m, 0, 1)}) − ${s}) / (${xs(a)}) (x ≠ ${a}),  f(${a}) = k. f'nin x = ${a}'da sürekli olması için k kaç olmalıdır?`, `f(x) = (√(${polyStr(m, 0, 1)}) − ${s}) / (${xs(a)}) (x ≠ ${a}),  f(${a}) = k. What must k be for f to be continuous at x = ${a}?`), frac(a, s),
      [[frac(1, 2 * s), tx('Eşlenikten sonra kalan (x + a) çarpanını 2a\'ya götürmeyi unutmuşsun: payda √(…)+s ve x + a ayrı ayrı yaklaşır.', 'After the conjugate you forgot the leftover (x + a) → 2a factor in the numerator.')],
        [frac(2 * a, s), tx('Eşlenik paydasında √ + s = 2s yerine s almışsın.', 'You used s instead of 2s for √ + s in the conjugate denominator.')],
        [frac(s, a), tx('Sonucu ters yazmışsın.', 'You inverted the result.')],
        [frac(a, 2 * s), tx('Payda √ + s = 2s alınmış ama pay (x + a) = 2a yerine a alınmış.', 'You used 2s in the denominator but a instead of 2a for (x + a).')],
        ['0', tx('Pay 0\'a gidiyor diye 0 yazmışsın; payda da 0\'a gider.', 'You wrote 0 because the numerator vanishes; the denominator does too.')]],
      [tx(`Eşlenikle çarp: pay (x² ${plus(m)}) − ${s * s} = x² − ${a * a} = (x − ${a})(x + ${a})`, `Multiply by the conjugate: the numerator becomes (x² ${plus(m)}) − ${s * s} = x² − ${a * a} = (x − ${a})(x + ${a})`),
        tx(`Sadeleşince (x + ${a}) / (√(x² ${plus(m)}) + ${s}) → ${2 * a} / ${2 * s}`, `After cancelling, (x + ${a}) / (√(x² ${plus(m)}) + ${s}) → ${2 * a} / ${2 * s}`), `k = ${frac(a, s)}`], rng);
    return chk(q, { t: 'cont0', build: () => (x) => (Math.sqrt(x * x + m) - s) / (x - a), at: a, h: 1e-6 });
  }

  // =====================================================================================================
  // Intermediate Value Theorem
  // =====================================================================================================

  function ivtInterval(rng) {
    let alpha, kappa, k;
    const f = (x) => x * x * x + alpha * x - kappa;
    for (;;) {
      alpha = rng.nextInt(1, 4); kappa = rng.nextInt(-20, 21);
      k = null;
      let bad = false;
      for (let x = -5; x <= 5; x++) { if (f(x) === 0) bad = true; if (f(x) * f(x + 1) < 0) k = x; }
      if (!bad && k !== null) break;
    }
    const iv = (x) => `[${x}, ${x + 1}]`;
    const cand = [k + 1, k - 1, k + 2, k - 2, k + 3];
    const q = mk(T.ivt(), tx(`f(x) = ${polyStr(-kappa, alpha, 0, 1)} sürekli bir fonksiyondur. Ara Değer Teoremi, f(x) = 0 denkleminin hangi aralıkta kökü olduğunu garanti eder?`, `f(x) = ${polyStr(-kappa, alpha, 0, 1)} is continuous. On which interval does the Intermediate Value Theorem guarantee a root of f(x) = 0?`), iv(k),
      cand.map((c) => [iv(c), tx(`f(${c}) = ${f(c)} ve f(${c + 1}) = ${f(c + 1)} aynı işaretli; bu aralıkta işaret değişimi görülmez, IVT kök garantisi vermez.`, `f(${c}) = ${f(c)} and f(${c + 1}) = ${f(c + 1)} have the same sign; no sign change on this interval, so IVT guarantees nothing.`)]),
      [tx('Aralık uçlarında f\'nin işaretine bak; zıt işaret → kök garantisi.', 'Check the sign of f at the interval ends; opposite signs → a root is guaranteed.'),
        tx(`f(${k}) = ${f(k)}, f(${k + 1}) = ${f(k + 1)} zıt işaretli`, `f(${k}) = ${f(k)}, f(${k + 1}) = ${f(k + 1)} have opposite signs`), tx(`f sürekli ⇒ ${iv(k)} aralığında kök vardır.`, `f continuous ⇒ there is a root in ${iv(k)}.`)], rng);
    return chk(q, { t: 'ivt', f });
  }

  function ivtValue(rng) {
    const u = rng.nextInt(-5, 1), v = u + rng.nextInt(4, 10), t = rng.nextInt(u + 1, v);
    const a = rng.nextInt(-3, 2), b = a + rng.nextInt(2, 5);
    const flip = rng.nextInt(0, 2) === 0;
    const fa = flip ? v : u, fb = flip ? u : v;
    const q = mk(T.ivt(), tx(`f, [${a}, ${b}] aralığında sürekli, f(${a}) = ${fa} ve f(${b}) = ${fb}. Aşağıdaki değerlerden hangisi için f(c) = N olacak biçimde bir c ∈ [${a}, ${b}] bulunması IVT ile GARANTİDİR?`, `f is continuous on [${a}, ${b}], f(${a}) = ${fa} and f(${b}) = ${fb}. For which N does the IVT GUARANTEE some c ∈ [${a}, ${b}] with f(c) = N?`), `N = ${t}`,
      [[`N = ${u - 1}`, tx('Bu değer f(a) ve f(b) arasında değil; IVT yalnızca ara değerleri garanti eder.', 'This value is not between f(a) and f(b); the IVT only guarantees intermediate values.')],
        [`N = ${v + 1}`, tx('Bu değer f(a) ve f(b)\'nin dışında; fonksiyon oraya ulaşabilir de ulaşmayabilir de.', 'This value lies outside f(a) and f(b); the function may or may not reach it.')],
        [`N = ${u - 3}`, tx('İki uç değerin altında; IVT bu değer için bir şey söylemez.', 'Below both end values; the IVT says nothing about it.')],
        [`N = ${v + 3}`, tx('İki uç değerin üstünde; IVT bu değer için bir şey söylemez.', 'Above both end values; the IVT says nothing about it.')]],
      [tx(`IVT: f sürekli ise f(${a}) ile f(${b}) arasındaki her N değeri alınır.`, `IVT: for continuous f every N between f(${a}) and f(${b}) is attained.`), tx(`${u} < ${t} < ${v} olduğundan N = ${t} garantidir.`, `Since ${u} < ${t} < ${v}, N = ${t} is guaranteed.`)], rng);
    return chk(q, { t: 'between', lo: u, hi: v });
  }

  function ivtEquation(rng) {
    let c, k;
    const h = (x) => Math.exp(x) + x - c;
    for (;;) {
      c = rng.nextInt(2, 30); k = null;
      for (let x = -3; x <= 4; x++) if (h(x) * h(x + 1) < 0) k = x;
      if (k !== null) break;
    }
    const iv = (x) => `[${x}, ${x + 1}]`;
    const cand = [k + 1, k - 1, k + 2, k - 2].filter((x) => h(x) * h(x + 1) > 0);
    const f2 = (x) => (Math.round(x * 100) / 100).toString();
    const q = mk(T.ivt(), tx(`eˣ + x = ${c} denkleminin bir çözümünün bulunduğu garanti edilen aralık hangisidir? (h(x) = eˣ + x − ${c} sürekli)`, `On which interval is a solution of eˣ + x = ${c} guaranteed? (h(x) = eˣ + x − ${c} is continuous)`), iv(k),
      cand.map((x) => [iv(x), tx(`h(${x}) ≈ ${f2(h(x))} ve h(${x + 1}) ≈ ${f2(h(x + 1))} aynı işaretli; IVT bu aralıkta kök garanti etmez.`, `h(${x}) ≈ ${f2(h(x))} and h(${x + 1}) ≈ ${f2(h(x + 1))} have the same sign; the IVT does not guarantee a root here.`)]),
      [tx(`h(x) = eˣ + x − ${c} ve h sürekli. Uçlarda işaret ara.`, `h(x) = eˣ + x − ${c}, continuous. Look for a sign change at the ends.`),
        tx(`h(${k}) ≈ ${f2(h(k))} ve h(${k + 1}) ≈ ${f2(h(k + 1))} zıt işaretli`, `h(${k}) ≈ ${f2(h(k))} and h(${k + 1}) ≈ ${f2(h(k + 1))} have opposite signs`), tx(`IVT ⇒ ${iv(k)} aralığında çözüm vardır.`, `IVT ⇒ a solution exists in ${iv(k)}.`)], rng);
    return chk(q, { t: 'ivt', f: h });
  }

  function ivtJustify(rng) {
    let p, q0, r0, a, b, fa, fb;
    const f = (x) => x * x * x + p * x * x + q0 * x + r0;
    for (;;) {
      p = rng.nextInt(-3, 4); q0 = rng.nextInt(-5, 6); r0 = rng.nextInt(-6, 7); a = rng.nextInt(-2, 2); b = a + rng.nextInt(1, 3);
      fa = f(a); fb = f(b);
      if (fa !== 0 && fb !== 0) break;
    }
    const opp = fa * fb < 0;
    const A = tx(`Evet; f sürekli, f(${a}) = ${fa} ve f(${b}) = ${fb} zıt işaretli`, `Yes; f is continuous and f(${a}) = ${fa}, f(${b}) = ${fb} have opposite signs`);
    const B = tx(`Hayır; f(${a}) = ${fa} ve f(${b}) = ${fb} aynı işaretli olduğundan kök yoktur`, `No; f(${a}) = ${fa} and f(${b}) = ${fb} have the same sign, so there is no root`);
    const C = tx(`Evet; f(${a}) ≠ f(${b}) olduğundan`, `Yes; because f(${a}) ≠ f(${b})`);
    const D = tx(`IVT sonuç vermez; f(${a}) = ${fa} ve f(${b}) = ${fb} aynı işaretli, kök olabilir de olmayabilir de`, `The IVT is inconclusive; f(${a}) = ${fa} and f(${b}) = ${fb} have the same sign, a root may or may not exist`);
    const text = tx(`f(x) = ${polyStr(r0, q0, p, 1)} için [${a}, ${b}] aralığında f(x) = 0 denkleminin kökü bulunduğu Ara Değer Teoremi ile söylenebilir mi?`, `Using the Intermediate Value Theorem, can we say f(x) = ${polyStr(r0, q0, p, 1)} has a root in [${a}, ${b}]?`);
    const nB = tx('Aynı işaretli uç değerler kökün olmadığını kanıtlamaz; IVT ters yönde bir sonuç vermez.', 'Same-sign end values do not prove there is no root; the IVT gives no converse.');
    const nC = tx('Uç değerlerin farklı olması yetmez; 0 değerinin f(a) ile f(b) arasında kalması (zıt işaret) gerekir.', 'Different end values are not enough; 0 must lie between f(a) and f(b) (opposite signs).');
    const nA = tx('Uç değerler aynı işaretli; "zıt işaretli" ifadesi yanlış.', 'The end values have the same sign; "opposite signs" is false.');
    const nD = tx('Uç değerler zıt işaretli olduğundan IVT kökü garanti eder; "sonuç vermez" yanlış.', 'The end values have opposite signs, so the IVT does guarantee a root; "inconclusive" is wrong.');
    const sol = [tx(`f sürekli (polinom). f(${a}) = ${fa}, f(${b}) = ${fb}.`, `f is continuous (polynomial). f(${a}) = ${fa}, f(${b}) = ${fb}.`),
      opp ? tx('0, f(a) ile f(b) arasındadır ⇒ IVT kökün varlığını garanti eder.', '0 lies between f(a) and f(b) ⇒ the IVT guarantees a root.') : tx('0, f(a) ile f(b) arasında değil ⇒ IVT sonuç vermez.', '0 is not between f(a) and f(b) ⇒ the IVT is inconclusive.')];
    const q = opp ? mk(T.ivt(), text, A, [[B, nB], [C, nC], [D, nD]], sol, rng) : mk(T.ivt(), text, D, [[A, nA], [B, nB], [C, nC]], sol, rng);
    return chk(q, { t: 'ivtj', f, a, b });
  }

  // =====================================================================================================
  // Infinite limits, vertical asymptotes
  // =====================================================================================================

  function vaEven(rng) {
    const a = nz(rng, -5, 5), c = nz(rng, -3, 3), v = rng.nextInt(0, 3);
    let expr, f, correct, pairs, sol, spec;
    if (v === 0) {
      expr = `${c}/(${xs(a)})²`; f = (x) => c / ((x - a) * (x - a)); correct = infStr(c);
      pairs = [[infStr(-c), tx('Kare paydayı hep pozitif yapar; işaret yalnızca payın işaretine bağlıdır.', 'The squared denominator is always positive; the sign depends only on the numerator.')], [DNE(), tx('Çift kuvvette iki yan limit aynıdır; tek taraflı farklılaşma (limit yok) yalnızca tek kuvvette olur.', 'With an even power both sides agree; a sign disagreement (no limit) only occurs with an odd power.')], ['0', tx('Payda 0\'a gidince kesir büyür, 0 olmaz.', 'When the denominator tends to 0 the fraction blows up; it is not 0.')]];
      sol = [tx(`(x − ${a})² → 0⁺ iki taraftan da.`, `(x − ${a})² → 0⁺ from both sides.`), tx(`${c} / (küçük pozitif) → ${correct}`, `${c} / (small positive) → ${correct}`)];
      spec = { t: 'lim', f, a, side: 0 };
    } else if (v === 1) {
      expr = `${c}/(${xs(a)})`; f = (x) => c / (x - a); correct = DNE();
      pairs = [[PINF, tx('Yalnızca sağdan (c > 0 için) limiti vermişsin; soldan işaret farklıdır.', 'You gave only one side; the other side has the opposite sign.')], [NINF, tx('Yalnızca bir yönün limitini vermişsin; diğer yön ters işaretli sonsuzdur.', 'You gave only one direction; the other goes to the opposite infinity.')], ['0', tx('Payda 0\'a giderken kesir büyür, 0\'a gitmez.', 'As the denominator tends to 0, the fraction blows up; it does not tend to 0.')]];
      sol = [tx(`Sağdan ve soldan (x − ${a}) zıt işaretli küçük sayılardır.`, `From the right and left, (x − ${a}) is a small number of opposite signs.`), tx('Bir tarafta +∞, diğer tarafta −∞ ⇒ iki yönlü limit yok.', '+∞ on one side and −∞ on the other ⇒ the two-sided limit does not exist.')];
      spec = { t: 'dne', f, a };
    } else {
      expr = `${c}/|${xs(a)}|`; f = (x) => c / Math.abs(x - a); correct = infStr(c);
      pairs = [[infStr(-c), tx('|x − a| her zaman pozitiftir; işaret payın işaretine bağlıdır.', '|x − a| is always positive; the sign comes from the numerator.')], [DNE(), tx('Mutlak değer iki yanı da pozitif yapar; iki yan limit aynı sonsuzdur.', 'The absolute value makes both sides positive; both one-sided limits are the same infinity.')], ['0', tx('Payda 0\'a giderken kesir büyür.', 'As the denominator tends to 0, the fraction blows up.')]];
      sol = [tx(`|x − ${a}| → 0⁺ iki taraftan da.`, `|x − ${a}| → 0⁺ from both sides.`), tx(`${c} / (küçük pozitif) → ${correct}`, `${c} / (small positive) → ${correct}`)];
      spec = { t: 'lim', f, a, side: 0 };
    }
    return chk(mk(T.vas(), tx(`lim(x→${a}) ${expr} limiti nedir?`, `What is lim(x→${a}) ${expr}?`), correct, pairs, sol, rng,
      new PlotSpec(a - 5, a + 5, -8, 8).addCurve((x) => (Math.abs(x - a) < 0.04 ? NaN : f(x))).addSegment(a, -8, a, 8, true)), spec);
  }

  function vaSelect(rng) {
    let r, t;
    do { r = nz(rng, -4, 4); t = nz(rng, -4, 4); } while (r === t || t === -r);
    const f = (x) => (x * x - r * r) / ((x - r) * (x - t));
    const q = mk(T.vas(), tx(`f(x) = (${polyStr(-r * r, 0, 1)}) / (${polyStr(r * t, -(r + t), 1)}) fonksiyonunun düşey asimptotu hangisidir?`, `Which is the vertical asymptote of f(x) = (${polyStr(-r * r, 0, 1)}) / (${polyStr(r * t, -(r + t), 1)})?`), `x = ${t}`,
      [[`x = ${r} ve x = ${t}`, tx('x = r\'de pay da sıfır; (x − r) sadeleşir ve orada yalnızca delik vardır.', 'At x = r the numerator vanishes too; (x − r) cancels and there is just a hole.')],
        [`x = ${r}`, tx('Sadeleşen çarpanın sıfırını asimptot saymışsın; sadeleşmeyen (x − t) asimptot verir.', 'You counted the cancelling factor\'s zero; the non-cancelling (x − t) gives the asymptote.')],
        [`x = ${-r}`, tx('Payın ikinci sıfırı asimptot değildir; asimptot paydadan gelir.', 'The numerator\'s other zero is not an asymptote; asymptotes come from the denominator.')],
        [tx('Düşey asimptot yoktur', 'There is no vertical asymptote'), tx('Payda sıfırlarından biri sadeleşmiyor; x = t\'de fonksiyon sonsuza gider.', 'One denominator zero does not cancel; at x = t the function blows up.')]],
      [tx(`Çarpanlara ayır: (x − ${r})(x + ${r}) / [(x − ${r})(x − ${t})]`, `Factor: (x − ${r})(x + ${r}) / [(x − ${r})(x − ${t})]`), tx(`(x − ${r}) sadeleşir ⇒ x = ${r}'de delik.`, `(x − ${r}) cancels ⇒ a hole at x = ${r}.`),
        tx(`x → ${t}: pay ${t + r} ≠ 0, payda 0 ⇒ düşey asimptot x = ${t}.`, `x → ${t}: numerator ${t + r} ≠ 0, denominator 0 ⇒ vertical asymptote x = ${t}.`)], rng);
    return chk(q, { t: 'va', f, asym: [t], holes: [r] });
  }

  function vaSignDiff(rng) {
    let a, b, m;
    do { a = nz(rng, -4, 4); b = nz(rng, -4, 4); m = nz(rng, -4, 4); } while (a === b || a + m === 0);
    const sd = rng.pick([1, -1, 1, -1, 0]);
    const f = (x) => (x + m) / ((x - a) * (x - b));
    const sg = Math.sign((a + m) * (a - b));
    const sgn = infStr(sg * (sd || 1));
    const text = tx(`lim(x→${a}${sideSup(sd)}) (x ${plus(m)}) / [(${xs(a)})(${xs(b)})] limiti nedir?`, `What is lim(x→${a}${sideSup(sd)}) (x ${plus(m)}) / [(${xs(a)})(${xs(b)})]?`);
    const sol = [tx(`x = ${a}'da pay ${a + m} (${a + m > 0 ? '+' : '−'}), (x − ${b}) çarpanı ${a - b} (${a - b > 0 ? '+' : '−'}); işareti sabit.`, `At x = ${a} the numerator is ${a + m} (${a + m > 0 ? '+' : '−'}) and the factor (x − ${b}) is ${a - b} (${a - b > 0 ? '+' : '−'}); the sign is fixed.`),
      tx(`Kalan: (x − ${a}) → 0${sd > 0 ? '⁺' : sd < 0 ? '⁻' : '; iki yönde farklı işaret'}.`, `Remaining: (x − ${a}) → 0${sd > 0 ? '⁺' : sd < 0 ? '⁻' : '; opposite signs on the two sides'}.`),
      sd === 0 ? tx('Sağdan ve soldan zıt sonsuz ⇒ limit yok.', 'Opposite infinities from the two sides ⇒ the limit does not exist.') : tx(`Sonuç: ${sgn}`, `Result: ${sgn}`)];
    if (sd === 0) {
      return chk(mk(T.vas(), text, DNE(), [[PINF, tx('Yalnızca bir yönü hesaplamışsın; diğer yönde işaret ters.', 'You evaluated one direction only; the other has the opposite sign.')], [NINF, tx('Yalnızca bir yönü hesaplamışsın; diğer yönde işaret ters.', 'You evaluated one direction only; the other has the opposite sign.')], ['0', tx('Payda 0\'a gidiyor, kesir büyür.', 'The denominator tends to 0, the fraction blows up.')]], sol, rng), { t: 'dne', f, a });
    }
    return chk(mk(T.vas(), text, sgn, [[infStr(-sg * sd), tx('İşaret hatası: pay, diğer çarpan ve (x − a)\'nın yönü birlikte düşünülmeli.', 'Sign error: consider the numerator, the other factor and the direction of (x − a) together.')], [DNE(), tx('Tek taraflı limit sorulduğu için işaret sabittir; limit vardır (sonsuz).', 'A one-sided limit has a fixed sign, so it exists (as an infinity).')], ['0', tx('Payda 0\'a gidiyor, kesir büyür.', 'The denominator tends to 0, the fraction blows up.')],
      [String(a + m), tx('Payı hesaplayıp bölmeyi unutmuşsun.', 'You evaluated the numerator and forgot the division.')]], sol, rng), { t: 'lim', f, a, side: sd });
  }

  function vaCombined(rng) {
    const a = nz(rng, -4, 4), p = nz(rng, -3, 3), q = nz(rng, -3, 3);
    const f = (x) => p / ((x - a) * (x - a)) + q / (x - a);
    const sgn = infStr(p);
    const q1 = mk(T.vas(), tx(`lim(x→${a}) [${p}/(${xs(a)})² ${plus(q)}/(${xs(a)})] limiti nedir?`, `What is lim(x→${a}) [${p}/(${xs(a)})² ${plus(q)}/(${xs(a)})]?`), sgn,
      [[infStr(-p), tx('Baskın terimi yanlış belirlemişsin: 1/(x−a)² terimi 1/(x−a)\'dan hızlı büyür ve işareti p belirler.', 'You picked the wrong dominant term: 1/(x−a)² grows faster than 1/(x−a), and its sign p decides.')],
        [DNE(), tx('1/(x−a) terimi tek başına iki yönde farklıdır ama toplamda 1/(x−a)² baskındır.', 'The 1/(x−a) term alone disagrees across sides, but in the sum the 1/(x−a)² term dominates.')],
        ['0', tx('∞ − ∞ benzeri bir belirsizlik değil: baskın terim ifadeyi sonsuza götürür.', 'This is not a cancelling ∞ − ∞: the dominant term drives the expression to infinity.')],
        [infStr(-q), tx('İkinci terimin işaretine bakmışsın; baskın olan birinci terimdir.', 'You looked at the sign of the second term; the first term dominates.')]],
      [tx(`Ortak payda: [${p} ${plus(q)}(x ${plus(-a)})] / (${xs(a)})²`, `Common denominator: [${p} ${plus(q)}(x ${plus(-a)})] / (${xs(a)})²`),
        tx(`x → ${a}: pay → ${p}, payda → 0⁺ (kare) ⇒ ${sgn}.`, `x → ${a}: numerator → ${p}, denominator → 0⁺ (square) ⇒ ${sgn}.`)], rng);
    return chk(q1, { t: 'lim', f, a, side: 0 });
  }

  // =====================================================================================================
  // Limits at infinity, horizontal asymptotes
  // =====================================================================================================

  function lmInfinity(rng) {
    const a = nz(rng, -5, 5), c = nz(rng, -5, 5), b = rng.nextInt(-4, 5), d = rng.nextInt(-4, 5);
    const k = rng.nextInt(0, 3);
    if (k === 0) {
      return chk(mk(T.hor(), tx(`lim(x→∞) (${polyStr(b, a)}) / (${polyStr(d, 0, c)}) limiti kaçtır?`, `What is lim(x→∞) (${polyStr(b, a)}) / (${polyStr(d, 0, c)})?`), '0',
        [[PINF, tx('Payın derecesi paydadan küçükken limit sonsuz olmaz.', 'When the numerator\'s degree is lower than the denominator\'s, the limit is not infinite.')],
          [frac(a, c), tx('Baş katsayıların oranını almışsın; bu yalnızca dereceler eşitken geçerlidir.', 'You used the ratio of leading coefficients, valid only when the degrees are equal.')],
          [NINF, tx('Payın derecesi paydadan küçükken limit sonsuz olmaz.', 'When the numerator\'s degree is lower than the denominator\'s, the limit is not infinite.')],
          [DNE(), tx('Bu tür rasyonel ifadelerin limiti vardır; payı ve paydanın derecelerini karşılaştır.', 'This kind of rational limit does exist; compare the degrees of numerator and denominator.')]],
        [tx('Paydanın derecesi (2) payınkinden (1) büyük.', 'The degree of the denominator (2) is greater than that of the numerator (1).'), tx('Yüksek dereceli payda ağır basar: limit 0.', 'The higher-degree denominator dominates: the limit is 0.')], rng), { t: 'lim', f: (x) => (a * x + b) / (c * x * x + d), a: Infinity, side: 0 });
    }
    if (k === 1) {
      return chk(mk(T.hor(), tx(`lim(x→∞) (${polyStr(b, 0, a)}) / (${polyStr(d, 0, c)}) limiti kaçtır?`, `What is lim(x→∞) (${polyStr(b, 0, a)}) / (${polyStr(d, 0, c)})?`), frac(a, c),
        [[frac(c, a), tx('Katsayı oranını ters almışsın; pay katsayısı üstte olmalı.', 'You inverted the coefficient ratio; the numerator\'s coefficient goes on top.')],
          ['0', tx('Dereceler eşit olduğu için limit 0 değildir.', 'The degrees are equal, so the limit is not 0.')],
          [PINF, tx('Dereceler eşit olduğu için limit sonsuz değildir.', 'The degrees are equal, so the limit is not infinite.')],
          [NINF, tx('Dereceler eşit olduğu için limit sonsuz değildir.', 'The degrees are equal, so the limit is not infinite.')],
          [frac(a, c + 1), tx('Payda katsayısına 1 eklemişsin; baş katsayıların oranı olduğu gibi alınır.', 'You added 1 to the denominator\'s coefficient; take the plain ratio of leading coefficients.')]],
        [tx('Pay ve payda aynı derecede: en yüksek terimlerin katsayı oranı.', 'Numerator and denominator have the same degree: ratio of the leading coefficients.'), `${tx('Limit', 'Limit')} = ${a}/${c} = ${frac(a, c)}`], rng), { t: 'lim', f: (x) => (a * x * x + b) / (c * x * x + d), a: Infinity, side: 0 });
    }
    const sgn = infStr(a * c);
    return chk(mk(T.hor(), tx(`lim(x→∞) (${polyStr(b, 0, 0, a)}) / (${polyStr(d, 0, c)}) limiti kaçtır?`, `What is lim(x→∞) (${polyStr(b, 0, 0, a)}) / (${polyStr(d, 0, c)})?`), sgn,
      [[infStr(-a * c), tx('İşareti yanlış belirlemişsin; sonuç baş katsayıların çarpımının işaretine bağlıdır.', 'You judged the sign wrongly; it depends on the sign of the product of leading coefficients.')],
        ['0', tx('Payın derecesi büyükken limit 0 olmaz; ifade büyür.', 'The numerator has higher degree, so the limit is not 0; the expression grows.')],
        [frac(a, c), tx('Katsayı oranını almışsın; bu yalnızca dereceler eşitken geçerlidir.', 'You used a coefficient ratio, which applies only when the degrees are equal.')],
        [DNE(), tx('Limit sonsuzdur (limit "yok" denilen durum değil); işareti belirle.', 'The limit is an infinity; just decide its sign.')]],
      [tx('Payın derecesi (3) paydanınkinden (2) büyük: limit sonsuz.', 'The degree of the numerator (3) is greater than that of the denominator (2): the limit is infinite.'), tx(`İşaret katsayıların işaretine bağlı: ${sgn}`, `The sign depends on the signs of the coefficients: ${sgn}`)], rng), { t: 'lim', f: (x) => (a * x * x * x + b) / (c * x * x + d), a: Infinity, side: 0 });
  }

  function haRational(rng) {
    const a = nz(rng, -5, 5), d = nz(rng, -5, 5), b = rng.nextInt(-4, 5), c = rng.nextInt(-4, 5), e = rng.nextInt(-4, 5), g = rng.nextInt(-4, 5);
    const q = mk(T.hor(), tx(`lim(x→∞) (${polyStr(c, b, a)}) / (${polyStr(g, e, d)}) limiti kaçtır?`, `What is lim(x→∞) (${polyStr(c, b, a)}) / (${polyStr(g, e, d)})?`), frac(a, d),
      [[frac(d, a), tx('Oranı ters almışsın; pay katsayısı üstte.', 'You inverted the ratio; the numerator\'s coefficient goes on top.')],
        ['0', tx('Dereceler eşit (2 ve 2); limit 0 olmaz.', 'The degrees are equal (2 and 2); the limit is not 0.')],
        [PINF, tx('Dereceler eşit olduğundan limit sonlu bir sayıdır.', 'The degrees are equal, so the limit is a finite number.')],
        [DNE(), tx('Bu rasyonel ifadenin sonsuzda sonlu bir limiti vardır.', 'This rational expression has a finite limit at infinity.')],
        [frac(b, e) !== frac(a, d) && e !== 0 ? frac(b, e) : frac(a + 1, d), tx('Birinci dereceden terimlerin oranını almışsın; en yüksek dereceli terimler belirleyicidir.', 'You used the ratio of the first-degree terms; the highest-degree terms decide.')]],
      [tx('Pay ve payda x²\'ye bölünür; düşük dereceli terimler 0\'a gider.', 'Divide numerator and denominator by x²; lower-order terms vanish.'), `${tx('Limit', 'Limit')} = ${a}/${d} = ${frac(a, d)}`], rng);
    return chk(q, { t: 'lim', f: (x) => evalPoly(x, c, b, a) / evalPoly(x, g, e, d), a: Infinity, side: 0 });
  }

  function haBasic(rng) {
    const v = rng.nextInt(0, 5), m = nz(rng, -5, 5), n = nz(rng, -4, 4);
    if (v === 0) {
      const k = rng.nextInt(1, 4);
      return chk(mk(T.hor(), tx(`lim(x→∞) (${m} ${plus(n)}/x${k === 1 ? '' : sup(k)}) limiti kaçtır?`, `What is lim(x→∞) (${m} ${plus(n)}/x${k === 1 ? '' : sup(k)})?`), String(m),
        [[String(m + n), tx('n/xᵏ terimi x → ∞ iken 0\'a gider; n eklenmez.', 'The term n/xᵏ tends to 0 as x → ∞; n is not added.')], ['0', tx('Sabit terim m kalır; yalnızca n/xᵏ terimi yok olur.', 'The constant m remains; only the n/xᵏ term vanishes.')], [PINF, tx('Büyük x için 1/xᵏ küçülür, ifade büyümez.', 'For large x the term 1/xᵏ shrinks; the expression does not grow.')]],
        [tx(`x → ∞ iken ${n}/x${k === 1 ? '' : sup(k)} → 0.`, `As x → ∞, ${n}/x${k === 1 ? '' : sup(k)} → 0.`), `${tx('Limit', 'Limit')} = ${m}`], rng), { t: 'lim', f: (x) => m + n / Math.pow(x, k), a: Infinity, side: 0 });
    }
    if (v === 1) {
      return chk(mk(T.hor(), tx(`lim(x→∞) (${m} ${plus(n)}e^(−x)) limiti kaçtır?`, `What is lim(x→∞) (${m} ${plus(n)}e^(−x))?`), String(m),
        [[String(m + n), tx('e^(−x) → 0 olduğundan ikinci terim yok olur.', 'e^(−x) → 0, so the second term vanishes.')], [PINF, tx('e^(−x) büyümez, küçülür; ifade sonlu bir değere yaklaşır.', 'e^(−x) shrinks rather than grows; the expression approaches a finite value.')], ['0', tx('Sabit terim m kalır.', 'The constant m remains.')]],
        [tx('x → ∞ iken e^(−x) → 0.', 'As x → ∞, e^(−x) → 0.'), `${tx('Limit', 'Limit')} = ${m}`], rng), { t: 'lim', f: (x) => m + n * Math.exp(-x), a: Infinity, side: 0 });
    }
    if (v === 2) {
      return chk(mk(T.hor(), tx(`lim(x→−∞) (${m} ${plus(n)}eˣ) limiti kaçtır?`, `What is lim(x→−∞) (${m} ${plus(n)}eˣ)?`), String(m),
        [[String(m + n), tx('x → −∞ iken eˣ → 0; ikinci terim yok olur.', 'As x → −∞, eˣ → 0; the second term vanishes.')], [n > 0 ? NINF : PINF, tx('eˣ, x → −∞ iken büyümez, 0\'a gider (x → +∞ ile karıştırma).', 'eˣ tends to 0 as x → −∞ (do not confuse with x → +∞).')], ['0', tx('Sabit terim m kalır.', 'The constant m remains.')]],
        [tx('x → −∞ iken eˣ → 0.', 'As x → −∞, eˣ → 0.'), `${tx('Limit', 'Limit')} = ${m}`], rng), { t: 'lim', f: (x) => m + n * Math.exp(x), a: -Infinity, side: 0 });
    }
    const pos = v === 3;
    return chk(mk(T.hor(), tx(`lim(x→${pos ? '' : '−'}∞) arctan x limiti kaçtır?`, `What is lim(x→${pos ? '' : '−'}∞) arctan x?`), pos ? 'π/2' : '−π/2',
      [[pos ? '−π/2' : 'π/2', tx('Yön (işaret) karışmış: arctan, x → +∞ için π/2, x → −∞ için −π/2\'ye gider.', 'The direction (sign) is mixed up: arctan tends to π/2 as x → +∞ and −π/2 as x → −∞.')], ['π', tx('arctan\'ın değer kümesi (−π/2, π/2); π\'ye ulaşmaz.', 'The range of arctan is (−π/2, π/2); it never reaches π.')], ['0', tx('arctan 0 = 0 ama sonsuzda 0\'a gitmez; yatay asimptotlara yaklaşır.', 'arctan 0 = 0 but it does not tend to 0 at infinity; it approaches its horizontal asymptotes.')], [PINF, tx('arctan sınırlıdır; sonsuza gitmez.', 'arctan is bounded; it does not go to infinity.')]],
      [tx('y = arctan x grafiğinin yatay asimptotları y = π/2 ve y = −π/2.', 'The graph of y = arctan x has horizontal asymptotes y = π/2 and y = −π/2.'), `${tx('Limit', 'Limit')} = ${pos ? 'π/2' : '−π/2'}`], rng), { t: 'lim', f: Math.atan, a: pos ? Infinity : -Infinity, side: 0 });
  }

  function haEquation(rng) {
    const a = nz(rng, -5, 5), c = nz(rng, -5, 5), b = rng.nextInt(-4, 5), d = nz(rng, -4, 4);
    const k = rng.nextInt(0, 3);
    const yEq = (n, dd) => `y = ${frac(n, dd)}`;
    const none = tx('Yatay asimptot yoktur', 'There is no horizontal asymptote');
    if (k === 0) {
      const q = mk(T.hor(), tx(`f(x) = (${polyStr(b, a)}) / (${polyStr(d, c)}) fonksiyonunun yatay asimptotunun denklemi nedir?`, `What is the equation of the horizontal asymptote of f(x) = (${polyStr(b, a)}) / (${polyStr(d, c)})?`), yEq(a, c),
        [[yEq(c, a), tx('Oranı ters almışsın; pay katsayısı üstte.', 'You inverted the ratio; the numerator\'s coefficient goes on top.')], [`x = ${frac(-d, c)}`, tx('Bu, paydanın sıfırından gelen düşey asimptottur, yatay değil.', 'That is the vertical asymptote from the denominator\'s zero, not the horizontal one.')], ['y = 0', tx('Dereceler eşit (1 ve 1); yatay asimptot 0 değil, katsayı oranıdır.', 'The degrees are equal (1 and 1); the horizontal asymptote is the coefficient ratio, not 0.')], [none, tx('Dereceler eşitken yatay asimptot vardır.', 'When the degrees are equal there is a horizontal asymptote.')]],
        [tx('lim(x→±∞) f(x) = a/c (dereceler eşit).', 'lim(x→±∞) f(x) = a/c (equal degrees).'), yEq(a, c)], rng);
      return chk(q, { t: 'lim', f: (x) => (a * x + b) / (c * x + d), a: Infinity, side: 0 });
    }
    if (k === 1) {
      const q = mk(T.hor(), tx(`f(x) = (${polyStr(b, a)}) / (${polyStr(d, 0, c)}) fonksiyonunun yatay asimptotunun denklemi nedir?`, `What is the equation of the horizontal asymptote of f(x) = (${polyStr(b, a)}) / (${polyStr(d, 0, c)})?`), 'y = 0',
        [[yEq(a, c), tx('Baş katsayı oranı yalnızca derece eşitken kullanılır; burada payda daha yüksek dereceli.', 'The leading-coefficient ratio is only for equal degrees; here the denominator has higher degree.')], [none, tx('Payın derecesi paydadan küçük olduğunda y = 0 yatay asimptottur.', 'When the numerator\'s degree is lower, y = 0 is a horizontal asymptote.')], ['x = 0', tx('Bu bir düşey doğrudur; yatay asimptot y = sabit biçimindedir.', 'That is a vertical line; a horizontal asymptote has the form y = constant.')], [yEq(c, a), tx('Katsayı oranı kullanılamaz; derece karşılaştırması gerekir.', 'The coefficient ratio does not apply; compare degrees.')]],
        [tx('Payın derecesi (1) < paydanın derecesi (2).', 'Degree of numerator (1) < degree of denominator (2).'), tx('Bu durumda y = 0 yatay asimptottur.', 'In that case y = 0 is the horizontal asymptote.')], rng);
      return chk(q, { t: 'lim', f: (x) => (a * x + b) / (c * x * x + d), a: Infinity, side: 0 });
    }
    const q = mk(T.hor(), tx(`f(x) = (${polyStr(b, 0, a)}) / (${polyStr(d, c)}) fonksiyonunun yatay asimptotu var mıdır? Varsa denklemi nedir?`, `Does f(x) = (${polyStr(b, 0, a)}) / (${polyStr(d, c)}) have a horizontal asymptote? If so, what is it?`), none,
      [[yEq(a, c), tx('Baş katsayıların oranı yalnızca derece eşitken yatay asimptot verir; burada pay daha yüksek derecelidir.', 'The ratio of leading coefficients gives a horizontal asymptote only for equal degrees; here the numerator has higher degree.')], ['y = 0', tx('y = 0, payın derecesi daha düşükken olur; burada tersi geçerli.', 'y = 0 occurs when the numerator\'s degree is lower; here it is the other way round.')], [`x = ${frac(-d, c)}`, tx('Bu düşey asimptottur.', 'That is the vertical asymptote.')]],
      [tx('Payın derecesi (2) > paydanın derecesi (1).', 'Degree of numerator (2) > degree of denominator (1).'), tx('Limit ±∞ olur ⇒ yatay asimptot yoktur.', 'The limit is ±∞ ⇒ no horizontal asymptote.')], rng);
    return chk(q, { t: 'lim', f: (x) => (a * x * x + b) / (c * x + d), a: Infinity, side: 0, big: true });
  }

  function haInfSign(rng) {
    const a = nz(rng, -4, 4), c = nz(rng, -4, 4), d = rng.nextInt(-4, 5), e = rng.nextInt(-4, 5);
    const neg = rng.nextInt(0, 2) === 0;
    const sg = Math.sign(a * c) * (neg ? -1 : 1);
    const f = (x) => (a * x * x * x + e) / (c * x * x + d);
    const q = mk(T.hor(), tx(`lim(x→${neg ? '−' : ''}∞) (${polyStr(e, 0, 0, a)}) / (${polyStr(d, 0, c)}) limiti nedir?`, `What is lim(x→${neg ? '−' : ''}∞) (${polyStr(e, 0, 0, a)}) / (${polyStr(d, 0, c)})?`), infStr(sg),
      [[infStr(-sg), tx('İşaret hatası: x → −∞ iken tek dereceli x³ işareti değiştirir, x² değiştirmez.', 'Sign error: as x → −∞ the odd power x³ changes sign while x² does not.')],
        ['0', tx('Pay (3) daha yüksek dereceli; limit 0 değildir.', 'The numerator (degree 3) has higher degree; the limit is not 0.')],
        [frac(a, c), tx('Katsayı oranı yalnızca eşit derecede geçerlidir.', 'The coefficient ratio applies only to equal degrees.')],
        [DNE(), tx('Yön verilmiş (tek yönlü: sonsuza gidiş); ifade ±∞ değerine gider, yalnızca işaretini belirle.', 'The direction of travel is given; the expression tends to ±∞, so just decide its sign.')]],
      [tx(`Baskın terimler: ${a}x³ / (${c}x²) = (${frac(a, c)})·x.`, `Dominant terms: ${a}x³ / (${c}x²) = (${frac(a, c)})·x.`), tx(`x → ${neg ? '−' : ''}∞ iken (${frac(a, c)})·x ${neg ? '(x negatif)' : ''} → ${infStr(sg)}.`, `As x → ${neg ? '−' : ''}∞, (${frac(a, c)})·x ${neg ? '(x negative)' : ''} → ${infStr(sg)}.`)], rng);
    return chk(q, { t: 'lim', f, a: neg ? -Infinity : Infinity, side: 0 });
  }

  function haRadicalNeg(rng) {
    const s = rng.nextInt(1, 5), p = nz(rng, -5, 5), r = rng.nextInt(1, 10), neg = rng.nextInt(0, 2) === 0;
    const val = neg ? -p : p;
    const f = (x) => (p * x) / Math.sqrt(s * s * x * x + r);
    const q = mk(T.hor(), tx(`lim(x→${neg ? '−' : ''}∞) ${cf(p)}x / √(${polyStr(r, 0, s * s)}) limiti kaçtır?`, `What is lim(x→${neg ? '−' : ''}∞) ${cf(p)}x / √(${polyStr(r, 0, s * s)})?`), frac(val, s),
      [[frac(-val, s), neg ? tx('x → −∞ iken √(x²) = |x| = −x olur; bu yüzden işaret değişir.', 'As x → −∞, √(x²) = |x| = −x, which flips the sign.') : tx('x → +∞ iken √(x²) = x; işaret değişmez.', 'As x → +∞, √(x²) = x; the sign does not flip.')],
        [frac(val, s * s), tx('Kökün altından s² yerine s² değerini kök dışına çıkarırken karekökü almamışsın: √(s²x²) = s|x|.', 'You did not take the square root of s²: √(s²x²) = s|x|.')],
        ['0', tx('Pay ve payda aynı mertebede (x); limit 0 değildir.', 'Numerator and denominator are of the same order (x); the limit is not 0.')],
        [neg ? NINF : PINF, tx('Kök paydada x mertebesinde büyür; oran sonlu kalır.', 'The root in the denominator grows like x; the ratio stays finite.')],
        [String(val), tx('Paydadaki s katsayısını (√(s²x²) = s|x|) hesaba katmamışsın.', 'You ignored the coefficient s in the denominator (√(s²x²) = s|x|).')]],
      [tx(`x ${neg ? '< 0' : '> 0'} için √(${s * s}x² ${plus(r)}) ≈ ${s}|x| = ${neg ? `${s}(−x)` : `${s}x`}`, `For x ${neg ? '< 0' : '> 0'}, √(${s * s}x² ${plus(r)}) ≈ ${s}|x| = ${neg ? `${s}(−x)` : `${s}x`}`),
        `${tx('Oran', 'Ratio')} = ${p}x / (${neg ? '−' : ''}${s}x) = ${frac(val, s)}`], rng);
    return chk(q, { t: 'lim', f, a: neg ? -Infinity : Infinity, side: 0 });
  }

  function haSqrtDiff(rng) {
    const a = rng.nextInt(1, 4), b = nz(rng, -6, 6);
    const q = mk(T.hor(), tx(`lim(x→∞) (√(${polyStr(0, b, a * a)}) − ${cf(a)}x) limiti kaçtır?`, `What is lim(x→∞) (√(${polyStr(0, b, a * a)}) − ${cf(a)}x)?`), frac(b, 2 * a),
      [['0', tx('∞ − ∞ belirsizdir ve 0 olması gerekmez; eşlenikle çarpıp sadeleştirmelisin.', '∞ − ∞ is indeterminate and need not be 0; multiply by the conjugate.')],
        [PINF, tx('Büyük iki terim birbirini götürür; fark sonlu kalır.', 'The two large terms nearly cancel; the difference stays finite.')],
        [frac(b, a), tx('Eşlenik paydasında √ + ax ≈ 2ax yerine ax almışsın.', 'In the conjugate you used ax instead of √ + ax ≈ 2ax.')],
        [frac(b, 2 * a * a), tx('Paydada 2a yerine 2a² kullanmışsın.', 'You used 2a² instead of 2a in the denominator.')],
        [frac(-b, 2 * a), tx('Payın işaretini ters almışsın: (a²x² + bx) − a²x² = +bx.', 'You flipped the sign of the numerator: (a²x² + bx) − a²x² = +bx.')]],
      [tx(`Eşlenikle çarp: pay (${polyStr(0, b, a * a)}) − ${a * a}x² = ${b}x`, `Multiply by the conjugate: the numerator is (${polyStr(0, b, a * a)}) − ${a * a}x² = ${b}x`),
        tx(`${b}x / (√(…) + ${cf(a)}x) ve payı paydayı x'e böl: ${b} / (√(${a * a} + ${b}/x) + ${a})`, `${b}x / (√(…) + ${cf(a)}x); divide by x: ${b} / (√(${a * a} + ${b}/x) + ${a})`),
        `x → ∞: ${b} / (${a} + ${a}) = ${frac(b, 2 * a)}`], rng);
    return chk(q, { t: 'lim', f: (x) => Math.sqrt(a * a * x * x + b * x) - a * x, a: Infinity, side: 0 });
  }


  function haRadicalSum(rng) {
    const m = rng.nextInt(1, 4), p = nz(rng, -4, 4), q0 = nz(rng, -4, 4), r = nz(rng, -4, 4), s = rng.nextInt(-5, 6), neg = rng.nextInt(0, 2) === 0;
    const root = neg ? -m : m;
    const val = root + q0;
    const f = (x) => (Math.sqrt(m * m * x * x + p * x) + q0 * x) / (r * x + s);
    const q = mk(T.hor(), tx(`lim(x→${neg ? '−' : ''}∞) (√(${polyStr(0, p, m * m)}) ${q0 > 0 ? '+' : '-'} ${cf(Math.abs(q0))}x) / (${polyStr(s, r)}) limiti kaçtır?`, `What is lim(x→${neg ? '−' : ''}∞) (√(${polyStr(0, p, m * m)}) ${q0 > 0 ? '+' : '-'} ${cf(Math.abs(q0))}x) / (${polyStr(s, r)})?`), frac(val, r),
      [[frac((neg ? m : -m) + q0, r), neg ? tx('x → −∞ iken √(m²x²) = m|x| = −m·x olur; x ile bölünce kökün katkısı −m\'dir.', 'As x → −∞, √(m²x²) = m|x| = −m·x, so after dividing by x the root contributes −m.') : tx('x → +∞ iken √(m²x²) = m·x; kökün katkısı +m\'dir.', 'As x → +∞, √(m²x²) = m·x, so the root contributes +m.')],
        [frac(q0, r), tx('Kök terimini unutmuşsun; kök de x mertebesinde olduğundan katkı verir.', 'You dropped the root term; it is of order x and contributes.')],
        [frac(m, r), tx('qx terimini unutmuşsun; sonuca q eklenmelidir.', 'You dropped the qx term; q must be added.')],
        [PINF, tx('Pay ve payda aynı mertebede (x); oran sonludur.', 'Numerator and denominator are of the same order (x); the ratio is finite.')],
        [String(val), tx('Paydadaki r katsayısına bölmeyi unutmuşsun.', 'You forgot to divide by the denominator\'s coefficient r.')]],
      [tx(`Pay ve paydayı x'e böl. x ${neg ? '< 0' : '> 0'} için √(${m * m}x² ${plus(p)}x) / x → ${root}.`, `Divide numerator and denominator by x. For x ${neg ? '< 0' : '> 0'}, √(${m * m}x² ${plus(p)}x) / x → ${root}.`),
        `(${root} ${plus(q0)}) / ${r} = ${frac(val, r)}`], rng);
    return chk(q, { t: 'lim', f, a: neg ? -Infinity : Infinity, side: 0 });
  }

  // =====================================================================================================
  // Oblique asymptotes
  // =====================================================================================================

  function oaType(rng) {
    const sc = rng.pick([[1, 2], [2, 2], [2, 1], [3, 1], [3, 2], [1, 1]]);
    const nd = sc[0], dd = sc[1];
    const coefs = (deg) => { const c = []; for (let i = 0; i < deg; i++) c.push(rng.nextInt(-4, 5)); c.push(nz(rng, -3, 3)); return c; };
    const N = coefs(nd), D = coefs(dd);
    const kind = nd - dd <= 0 ? 'H' : nd - dd === 1 ? 'O' : 'N';
    const OPT = {
      H: tx('Yatay asimptot vardır, eğik asimptot yoktur', 'There is a horizontal asymptote and no oblique asymptote'),
      O: tx('Eğik asimptot vardır, yatay asimptot yoktur', 'There is an oblique asymptote and no horizontal asymptote'),
      B: tx('Hem yatay hem eğik asimptot vardır', 'There are both a horizontal and an oblique asymptote'),
      N: tx('Ne yatay ne de eğik asimptot vardır', 'There is neither a horizontal nor an oblique asymptote'),
    };
    const NN = {
      H: tx('Pay derecesi payda derecesinden büyük olduğundan limit sonlu değildir; yatay asimptot olmaz.', 'The numerator\'s degree exceeds the denominator\'s, so the limit is not finite; there is no horizontal asymptote.'),
      O: kind === 'N'
        ? tx('Derece farkı 2 veya daha fazla: grafik bir doğruya değil bir eğriye yaklaşır; eğik asimptot olmaz.', 'The degree difference is 2 or more: the graph follows a curve, not a line, so there is no oblique asymptote.')
        : tx('Eğik asimptot için pay derecesi, payda derecesinden tam 1 fazla olmalıdır; burada pay daha yüksek derecede değil.', 'An oblique asymptote needs the numerator\'s degree to be exactly 1 more than the denominator\'s; that is not the case here.'),
      B: tx('Bir rasyonel fonksiyonun sonsuzda tek bir davranışı vardır; hem yatay hem eğik asimptot aynı anda olamaz.', 'A rational function has a single end behaviour; it cannot have both a horizontal and an oblique asymptote.'),
      N: tx('Derece farkına bak: bu durumda bir asimptot vardır (yatay ya da eğik).', 'Check the degree difference: in this case an asymptote (horizontal or oblique) does exist.'),
    };
    const order = ['H', 'O', 'B', 'N'];
    return mk(T.obl(), tx(`f(x) = (${polyStr(...N)}) / (${polyStr(...D)}) fonksiyonunun sonsuzdaki davranışı için ne söylenebilir?`, `What can be said about the end behaviour of f(x) = (${polyStr(...N)}) / (${polyStr(...D)})?`), OPT[kind],
      order.filter((k) => k !== kind).map((k) => [OPT[k], NN[k]]),
      [tx(`Pay derecesi ${nd}, payda derecesi ${dd}.`, `Numerator degree ${nd}, denominator degree ${dd}.`),
        kind === 'H' ? tx('Pay derecesi ≤ payda derecesi ⇒ yatay asimptot.', 'Numerator degree ≤ denominator degree ⇒ horizontal asymptote.') : kind === 'O' ? tx('Pay derecesi = payda derecesi + 1 ⇒ eğik asimptot.', 'Numerator degree = denominator degree + 1 ⇒ oblique asymptote.') : tx('Pay derecesi ≥ payda derecesi + 2 ⇒ ne yatay ne eğik asimptot.', 'Numerator degree ≥ denominator degree + 2 ⇒ neither horizontal nor oblique asymptote.')], rng);
  }

  function oaDivision(rng) {
    const d = nz(rng, -3, 3), m = nz(rng, -3, 3), n = rng.nextInt(-4, 5), r = nz(rng, -5, 5);
    const c = [r - n * d, n - m * d, m];
    const f = (x) => evalPoly(x, c[0], c[1], c[2]) / (x - d);
    const q = mk(T.obl(), tx(`f(x) = (${polyStr(...c)}) / (${xs(d)}) fonksiyonunun eğik asimptotunun denklemi nedir?`, `What is the equation of the oblique asymptote of f(x) = (${polyStr(...c)}) / (${xs(d)})?`), lineStr(m, n),
      [[lineStr(m, n - m * d), tx('Bölmeyi tamamlamadan x\'in katsayısını sabit olarak almışsın; polinom bölmesi (sentetik bölme) gerekir.', 'You used the numerator\'s x-coefficient as the constant without dividing; do the polynomial (synthetic) division.')],
        [lineStr(m, -n), tx('Bölümün sabit teriminin işaretini ters almışsın.', 'You flipped the sign of the quotient\'s constant term.')],
        [lineStr(m, n + m * d), tx('Sentetik bölmede d\'nin işaretini ters kullanmışsın (x − d için kök +d).', 'In synthetic division you used the wrong sign of d (for x − d the root is +d).')],
        [lineStr(m, n + r), tx('Kalanı (r) bölüme eklemişsin; r/(x − d) terimi sonsuzda 0\'a gider, asimptotun parçası değildir.', 'You added the remainder r to the quotient; the term r/(x − d) vanishes at infinity and is not part of the asymptote.')],
        [lineStr(m, n + 1), tx('Sabit terimde küçük bir hata.', 'A small slip in the constant term.')],
        [lineStr(m, n - 1), tx('Sabit terimde küçük bir hata.', 'A small slip in the constant term.')],
        [lineStr(-m, n), tx('Eğimin (bölümün x katsayısının) işaretini ters almışsın.', 'You flipped the sign of the slope (the x-coefficient of the quotient).')]],
      [tx(`(${polyStr(...c)}) ÷ (${xs(d)}) bölmesi:`, `Divide (${polyStr(...c)}) by (${xs(d)}):`),
        `${polyStr(...c)} = (${xs(d)})(${polyStr(n, m)}) ${plus(r)}`,
        tx(`f(x) = ${polyStr(n, m)} + ${r}/(${xs(d)}); kalan terim 0'a gider ⇒ ${lineStr(m, n)}`, `f(x) = ${polyStr(n, m)} + ${r}/(${xs(d)}); the remainder term tends to 0 ⇒ ${lineStr(m, n)}`)], rng);
    return chk(q, { t: 'obl', f, m, n, dir: 1 });
  }

  function oaSqrt(rng) {
    const a = rng.nextInt(1, 4), t = nz(rng, -3, 3), w = rng.nextInt(1, 8), neg = rng.nextInt(0, 2) === 0;
    const c = t * t + w;
    const f = (x) => Math.sqrt(a * a * x * x + 2 * a * t * x + c);
    const M = neg ? -a : a, B = neg ? -t : t;
    const wrong = neg
      ? [[lineStr(a, t), tx('Bu, x → +∞ yönündeki asimptottur; x → −∞ için √(x²) = −x olduğundan eğim −a olur.', 'That is the asymptote for x → +∞; for x → −∞, √(x²) = −x so the slope is −a.')],
        [lineStr(-a, t), tx('Eğimi doğru çevirmişsin ama sabit terimin işaretini de çevirmelisin: y = −(ax + t).', 'You flipped the slope but the constant must flip too: y = −(ax + t).')],
        [lineStr(-a, -2 * t), tx('Sabit terimi 2t almışsın; tamamlanan kareden t çıkar.', 'You used 2t as the constant; completing the square gives t.')],
        [lineStr(-a, 0), tx('Sabit terimi atlamışsın; kare tamamlandığında ±t kalır.', 'You dropped the constant; completing the square leaves ±t.')]]
      : [[lineStr(-a, -t), tx('Bu, x → −∞ yönündeki asimptottur; x → +∞ için eğim +a\'dır.', 'That is the asymptote for x → −∞; for x → +∞ the slope is +a.')],
        [lineStr(a, -t), tx('Sabit terimin işaretini ters almışsın.', 'You flipped the sign of the constant term.')],
        [lineStr(a, 2 * t), tx('Sabit terimi 2t almışsın; tamamlanan kareden t çıkar.', 'You used 2t as the constant; completing the square gives t.')],
        [lineStr(a, 0), tx('Sabit terimi atlamışsın; kare tamamlandığında t kalır.', 'You dropped the constant; completing the square leaves t.')]];
    const q = mk(T.obl(), tx(`f(x) = √(${polyStr(c, 2 * a * t, a * a)}) fonksiyonunun x → ${neg ? '−' : ''}∞ için eğik asimptotunun denklemi nedir?`, `What is the equation of the oblique asymptote of f(x) = √(${polyStr(c, 2 * a * t, a * a)}) as x → ${neg ? '−' : ''}∞?`), lineStr(M, B), wrong,
      [tx(`Kare tamamla: ${polyStr(c, 2 * a * t, a * a)} = (${polyStr(t, a)})² ${plus(w)}`, `Complete the square: ${polyStr(c, 2 * a * t, a * a)} = (${polyStr(t, a)})² ${plus(w)}`),
        tx(`Büyük |x| için f(x) ≈ |${polyStr(t, a)}|; x ${neg ? '< 0' : '> 0'} iken bu ${neg ? '−' : ''}(${polyStr(t, a)})`, `For large |x|, f(x) ≈ |${polyStr(t, a)}|; for x ${neg ? '< 0' : '> 0'} this is ${neg ? '−' : ''}(${polyStr(t, a)})`),
        lineStr(M, B)], rng);
    return chk(q, { t: 'obl', f, m: M, n: B, dir: neg ? -1 : 1 });
  }

  // =====================================================================================================
  // Levels, lists, registration
  // =====================================================================================================

  const L1 = [rcAvg, lmSub, lmLaws, lmRemovable, lmFactor, lmSinOver, lmSqueezeBasic, lmGraph, lmAbsRatio, edDefinition, edLinear, ctThreePart, ivtInterval, vaEven, haRational, haBasic, oaType];
  const L2 = [rcSecantLimit, lmLawsQuot, lmFactorLead, lmSqrt, lmSinRatio, lmOneMinusCos, lmNotExist, lmSqueezeSin, lmGraphJump, lmOneSided, lmPiece, lmExistsPiece, edLinearInv, lmContinuity, ctType, ctWhereDiscont, pcSimple, pcTrig, ivtValue, ivtEquation, vaSelect, lmInfinity, haEquation, haInfSign];
  const L3 = [rcTangentRoot, lmFactorCubic, lmFracDiff, lmSqrtTwo, lmSqrtQuad, lmTrigCos, lmSqueezeInf, edQuad, ctDomainSqrt, ctTwoPoints, pcTwoParam, pcSqrtQuad, ivtJustify, vaSignDiff, vaCombined, haRadicalNeg, haSqrtDiff, haRadicalSum, oaDivision, oaSqrt];
  L1.forEach((g) => { g.level = 1; });
  L2.forEach((g) => { g.level = 2; });
  L3.forEach((g) => { g.level = 3; });

  // Regular 10-question quiz: the 11 ported VB generators plus a few easy/medium ones for the new topics.
  const GENERATORS = [
    lmSub, lmRemovable, lmFactor, lmInfinity, lmOneSided, lmPiece, lmContinuity, lmSinOver, lmSqrt, lmNotExist, lmLaws,
    rcAvg, lmGraph, edLinear, ivtInterval,
  ];
  const EXTRA = L1.concat(L2, L3).filter((g) => GENERATORS.indexOf(g) < 0);

  Topics.register('limits', {
    type: 'quiz',
    tabTitle: () => tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  // Printable exam sets: every generator above, each tagged with .level (1/2/3).
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.limits = GENERATORS.concat(EXTRA);
})();
