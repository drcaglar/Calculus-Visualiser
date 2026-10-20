// Integrals quiz bank. Ports Modules/Preliminaries/QuizBankPart2.vb (module QuizBankIntegrals, 11 generators)
// and adds many exam-only generators (window.ExamPools.integrals) for the printable question sets.
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
  const cf = (n) => (n === 1 ? '' : n === -1 ? '-' : String(n));
  const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => (n >= 0 && n <= 9 ? SUPD[n] : `^${n}`);
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
  const polyT = (...c) => polyStr(...c).replace(/x/g, 't');
  const mono = (c, d) => polyStr(...Array(d).fill(0), c);
  const ex = (n) => (n === 1 ? 'e' : 'e' + sup(n));
  const cx = (c, inner) => (c === 1 ? inner : `${c}(${inner})`);
  const piS = (n, d) => { const g = gcd(n, d); n /= g; d /= g; const a = n === 1 ? 'π' : n + 'π'; return d === 1 ? a : `${a}/${d}`; };
  const br = (s) => (/^-?[0-9a-z]+$/.test(String(s)) ? String(s) : `{${s}}`);
  const I = (a, b) => `∫_${br(a)}^${br(b)}`;
  const term = (c, body, sp) => { const m = Math.abs(c); const k = (m === 1 && body) ? '' : String(m); return body ? ((k && sp) ? k + ' ' : k) + body : String(m); };
  const sumT = (arr) => {
    let s = '';
    arr.forEach(([c, b, sp]) => {
      if (c === 0) return;
      const t = term(c, b, sp);
      if (s === '') s = (c < 0 ? '-' : '') + t; else s += (c < 0 ? ' - ' : ' + ') + t;
    });
    return s || '0';
  };

  const FILL_NOTES = () => [
    tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'),
    tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'),
    tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'),
    tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'),
  ];
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
    } else if (/^-?\d+\/\d+$/.test(correct)) {
      const [n, d] = correct.split('/').map(Number);
      [[1, 1], [-1, 1], [2, 1], [-2, 1], [d, 1], [-d, 1]].forEach(([k]) => {
        wrongs.push(frac(n + k, d));
        notes.push(tx('Payda doğru ama pay bir hesap hatası yüzünden kaymış; adımları yeniden kontrol et.', 'The denominator is right but the numerator is off by an arithmetic slip; re-check the steps.'));
      });
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
  function mkPlot(x0, x1, fs, vl) {
    let lo = 0, hi = 0;
    fs.forEach((f) => { for (let i = 0; i <= 200; i++) { const y = f(x0 + (x1 - x0) * i / 200); if (typeof y === 'number' && isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } } });
    const pad = Math.max(1, (hi - lo) * 0.12);
    const p = new PlotSpec(x0, x1, lo - pad, hi + pad);
    fs.forEach((f) => p.addCurve(f));
    (vl || []).forEach((x) => p.addSegment(x, p.yMin, x, p.yMax, true));
    return p;
  }

  const T = {
    anti: () => tx('Belirsiz integral (ters türev)', 'Indefinite integrals (antiderivatives)'),
    def: () => tx('Belirli integral: KTT ile hesaplama', 'Definite integrals via the FTC'),
    area: () => tx('Eğri altındaki alan ve geometri', 'Area under a curve and geometry'),
    areaG: () => tx('Grafikten işaretli ve toplam alan', 'Signed and total area from a graph'),
    riem: () => tx('Riemann toplamı', 'Riemann sums'),
    over: () => tx('Fazla ve eksik tahminler', 'Over- and underestimates'),
    prop: () => tx('Belirli integralin özellikleri', 'Properties of definite integrals'),
    ftc1: () => tx('Kalkülüsün temel teoremi (Kısım 1)', 'Fundamental Theorem of Calculus (Part 1)'),
    net: () => tx('Net değişim ve toplam yol', 'Net change and total distance'),
    avg: () => tx('Ortalama değer', 'Average value'),
    btw: () => tx('İki eğri arası alan', 'Area between two curves'),
    sub: () => tx('Değişken değiştirme', 'Substitution'),
    sym: () => tx('Simetri ve integral', 'Symmetry and integrals'),
    trig: () => tx('Trigonometrik integral', 'Trigonometric integrals'),
    lnexp: () => tx('Logaritmik ve üstel integral', 'Logarithmic and exponential integrals'),
  };

  // Piecewise-linear shape: above the axis (triangle, area A1) then below it (triangle, area A2)
  function triShape(rng) {
    const q = 2 * rng.nextInt(1, 4), w = 2 * rng.nextInt(1, 4), s = q + w;
    const h1 = rng.nextInt(1, 5), h2 = rng.nextInt(1, 5);
    const nodes = [[0, 0], [q / 2, h1], [q, 0], [q + w / 2, -h2], [s, 0]];
    const f = (x) => {
      if (x <= 0 || x >= s) return 0;
      for (let i = 0; i < 4; i++) {
        const [x0, y0] = nodes[i], [x1, y1] = nodes[i + 1];
        if (x >= x0 && x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
      return 0;
    };
    const plot = new PlotSpec(-1, s + 1, -h2 - 1.5, h1 + 1.5).addCurve(f);
    nodes.forEach(([x, y]) => plot.addPoint(x, y, `(${x}, ${y})`));
    return { q, w, s, h1, h2, A1: q * h1 / 2, A2: w * h2 / 2, f, plot, nodes };
  }

  // =====================================================================================================
  // Level 1
  // =====================================================================================================

  function inAnti(rng) {
    const p = nz(rng, -3, 3), q = nz(rng, -3, 3), r = nz(rng, -4, 4);
    const ans = `${polyStr(0, r, q, p)} + C`;
    const q1 = mk(T.anti(),
      tx(`∫ (${polyStr(r, 2 * q, 3 * p)}) dx integralinin sonucu hangisidir?`, `Which is the result of ∫ (${polyStr(r, 2 * q, 3 * p)}) dx?`), ans,
      [[polyStr(0, r, q, p), tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')],
        [`${polyStr(0, r, 2 * q, 3 * p)} + C`, tx('Üsleri artırdın ama yeni üsse bölmeyi unuttun.', 'You raised the exponents but forgot to divide by the new exponent.')],
        [`${polyStr(2 * q, 6 * p)} + C`, tx('İntegral almak yerine türev aldın.', 'You differentiated instead of integrating.')],
        [`${polyStr(0, r, q, p)} - C`, tx('Sabit + C yerine - C yazılmış; standart gösterim + C\'dir.', 'The constant is written - C; the standard form uses + C.')]],
      [tx('∫xⁿ dx = xⁿ⁺¹/(n+1) + C  (üssü 1 artır, yeni üsse böl)', '∫xⁿ dx = xⁿ⁺¹/(n+1) + C  (raise the exponent by 1, divide by the new exponent)'),
        `∫${3 * p}x² dx = ${p}x³,  ∫${2 * q}x dx = ${q}x²,  ∫${r} dx = ${r}x`,
        tx('Sonuna + C eklemeyi unutma.', 'Do not forget to add + C.')], rng);
    return chk(q1, { t: 'anti', f: (x) => 3 * p * x * x + 2 * q * x + r });
  }

  function geoArea(rng) {
    const kind = rng.nextInt(0, 3);
    if (kind === 0) {
      const m = rng.nextInt(1, 5), h = rng.nextInt(2, 7), s = 2 * m;
      const f = (x) => (x <= 0 || x >= s ? 0 : h * (1 - Math.abs(x - m) / m));
      const plot = new PlotSpec(-1, s + 1, -1, h + 1.5).addCurve(f).addPoint(0, 0, '(0, 0)').addPoint(m, h, `(${m}, ${h})`).addPoint(s, 0, `(${s}, 0)`);
      const ans = m * h;
      const q1 = mk(T.area(),
        tx(`Grafiği (0, 0), (${m}, ${h}) ve (${s}, 0) noktalarını birleştiren üçgen biçimindeki f fonksiyonu için ∫_0^${s} f(x) dx kaçtır? (Geometriden yararlan.)`,
          `For the triangle-shaped graph of f through (0, 0), (${m}, ${h}) and (${s}, 0), what is ∫_0^${s} f(x) dx? (Use geometry.)`),
        String(ans),
        [[String(ans * 2), tx('Taban × yükseklik hesaplamışsın; üçgen alanı bunun yarısıdır.', 'You computed base × height; a triangle has half of that.')],
          [String(m * h / 2 === Math.floor(m * h / 2) ? m * h / 2 : m * h + 1), tx('Tabanı yarım (tepe noktasının x\'i) alıp ayrıca 1/2 ile çarpmışsın.', 'You used half the base (the apex x-value) and also multiplied by 1/2.')],
          [String(m + h), tx('Alan yerine taban ve yüksekliği toplamışsın.', 'You added base and height instead of using the area formula.')]],
        [tx(`Taban = ${s}, yükseklik = ${h}`, `Base = ${s}, height = ${h}`),
          tx(`Alan = ½ · ${s} · ${h} = ${ans}`, `Area = ½ · ${s} · ${h} = ${ans}`)], rng, plot);
      return chk(q1, { t: 'int', f, a: 0, b: s });
    }
    if (kind === 1) {
      const w = rng.nextInt(1, 4), t = rng.nextInt(1, 4), h2 = rng.nextInt(1, 4), h = 2 * h2;
      const f = (x) => (x < 0 || x > w + t ? 0 : x <= w ? h : h * (1 - (x - w) / t));
      const plot = new PlotSpec(-1, w + t + 1, -1, h + 1.5).addCurve(f).addPoint(0, h, `(0, ${h})`).addPoint(w, h, `(${w}, ${h})`).addPoint(w + t, 0, `(${w + t}, 0)`);
      const ans = h * w + h * t / 2;
      const q1 = mk(T.area(),
        tx(`f grafiği y = ${h} yüksekliğinde x = 0'dan x = ${w}'a kadar yatay gider, sonra (${w + t}, 0) noktasına doğrusal iner. ∫_0^${w + t} f(x) dx kaçtır?`,
          `The graph of f is horizontal at height y = ${h} from x = 0 to x = ${w}, then falls linearly to (${w + t}, 0). What is ∫_0^${w + t} f(x) dx?`),
        String(ans),
        [[String(h * (w + t)), tx('Tüm bölgeyi dikdörtgen sanmışsın; eğimli kısım bir üçgendir.', 'You treated the whole region as a rectangle; the sloped part is a triangle.')],
          [String(h * w), tx('Yalnızca dikdörtgen kısmı saymışsın; üçgeni unutmuşsun.', 'You counted only the rectangle and forgot the triangle.')],
          [String(h * w + h * t), tx('Üçgenin alanında ½ çarpanını unutmuşsun.', 'You forgot the factor ½ in the triangle\'s area.')]],
        [tx(`Dikdörtgen: ${w} · ${h} = ${h * w}`, `Rectangle: ${w} · ${h} = ${h * w}`),
          tx(`Üçgen: ½ · ${t} · ${h} = ${h * t / 2}`, `Triangle: ½ · ${t} · ${h} = ${h * t / 2}`),
          tx(`Toplam = ${ans}`, `Total = ${ans}`)], rng, plot);
      return chk(q1, { t: 'int', f, a: 0, b: w + t });
    }
    const r = rng.nextInt(1, 5);
    const f = (x) => (Math.abs(x) > r ? NaN : Math.sqrt(Math.max(0, r * r - x * x)));
    const plot = new PlotSpec(-r - 1, r + 1, -1, r + 1.5).addCurve(f);
    const ans = piS(r * r, 2);
    const q1 = mk(T.area(),
      tx(`f(x) = √(${r * r} − x²) için ∫_{-${r}}^{${r}} f(x) dx kaçtır? (Grafik bir yarım çemberdir.)`,
        `For f(x) = √(${r * r} − x²), what is ∫_{-${r}}^{${r}} f(x) dx? (The graph is a semicircle.)`),
      ans,
      [[piS(r * r, 1), tx('Tam çemberin alanını (πr²) vermişsin; grafik yalnızca üst yarıdır.', 'You gave the full circle (πr²); the graph is only the upper half.')],
        [piS(r * r, 4), tx('Yarım çember yerine çeyrek çember alanı hesaplamışsın.', 'You computed a quarter circle instead of a semicircle.')],
        [piS(2 * r * r, 1), tx('Alanı iki katına çıkarmışsın.', 'You doubled the area.')],
        [piS(r * r, 3), tx('Paydada 2 yerine 3 kullanmışsın.', 'You used 3 instead of 2 in the denominator.')],
        [piS(r, 2), tx('r² yerine r kullanmışsın.', 'You used r instead of r².')]],
      [tx(`Yarıçap r = ${r}`, `Radius r = ${r}`),
        tx(`Yarım çember alanı = ½ π r² = ½ π · ${r * r} = ${ans}`, `Semicircle area = ½ π r² = ½ π · ${r * r} = ${ans}`)], rng, plot);
    return chk(q1, { t: 'int', f: (x) => Math.sqrt(Math.max(0, r * r - x * x)), a: -r, b: r });
  }

  function antiPower(rng) {
    const n = rng.nextInt(1, 5), m = nz(rng, -3, 3), c = m * (n + 1);
    const q1 = mk(T.anti(),
      tx(`∫ ${mono(c, n)} dx integralinin sonucu hangisidir?`, `Which is the result of ∫ ${mono(c, n)} dx?`),
      `${mono(m, n + 1)} + C`,
      [[`${mono(c, n + 1)} + C`, tx('Üssü artırdın ama yeni üsse bölmeyi unuttun.', 'You raised the exponent but did not divide by the new exponent.')],
        [`${mono(c * n, n - 1)} + C`, tx('İntegral yerine türev aldın.', 'You differentiated instead of integrating.')],
        [mono(m, n + 1), tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')],
        [`${mono(m, n)} + C`, tx('Üssü artırmayı unuttun; yalnızca katsayıyı böldün.', 'You forgot to raise the exponent and only divided the coefficient.')]],
      [tx('∫ a xⁿ dx = a xⁿ⁺¹/(n+1) + C', '∫ a xⁿ dx = a xⁿ⁺¹/(n+1) + C'),
        `${c} / ${n + 1} = ${m}`,
        `${mono(m, n + 1)} + C`], rng);
    return chk(q1, { t: 'anti', f: (x) => c * Math.pow(x, n) });
  }

  function antiBasic(rng) {
    const k = rng.nextInt(2, 6), kind = rng.nextInt(0, 5);
    const rule = (a, b) => tx(a, b);
    if (kind === 0) {
      const q1 = mk(T.anti(), tx(`∫ ${k}eˣ dx = ?`, `∫ ${k}eˣ dx = ?`), `${k}eˣ + C`,
        [[`eˣ + C`, tx('Sabit çarpan k\'yı düşürmüşsün.', 'You dropped the constant multiple k.')],
          [`${k}eˣ⁺¹/(x+1) + C`, tx('Kuvvet kuralını eˣ\'e uygulamışsın; eˣ\'in ters türevi yine eˣ\'tir.', 'You applied the power rule to eˣ; the antiderivative of eˣ is eˣ itself.')],
          [`${k}x eˣ⁻¹ + C`, tx('Kuvvet kuralını yanlış uygulayıp x\'i üs değil taban yapmışsın.', 'You misapplied the power rule, treating x as the base.')],
          [`${k}eˣ`, tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')]],
        [rule('(eˣ)\' = eˣ olduğundan ∫ eˣ dx = eˣ + C', 'Since (eˣ)\' = eˣ, ∫ eˣ dx = eˣ + C'), rule(`Sabit çarpan dışarı çıkar: ${k}eˣ + C`, `The constant factor comes out: ${k}eˣ + C`)], rng);
      return chk(q1, { t: 'anti', f: (x) => k * Math.exp(x) });
    }
    if (kind === 1) {
      const q1 = mk(T.anti(), tx(`∫ ${k} sin x dx = ?`, `∫ ${k} sin x dx = ?`), `-${k} cos x + C`,
        [[`${k} cos x + C`, tx('İşareti unutmuşsun: sin x\'in ters türevi −cos x\'tir.', 'You lost the sign: the antiderivative of sin x is −cos x.')],
          [`${k} sin x + C`, tx('sin x\'in ters türevini yine sin x sanmışsın.', 'You took sin x as its own antiderivative.')],
          [`-${k} cos x`, tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')],
          [`-${k} sin x + C`, tx('Hem fonksiyonu hem işareti karıştırmışsın.', 'You mixed up both the function and the sign.')]],
        [rule('(−cos x)\' = sin x', '(−cos x)\' = sin x'), rule(`∫ ${k} sin x dx = −${k} cos x + C`, `∫ ${k} sin x dx = −${k} cos x + C`)], rng);
      return chk(q1, { t: 'anti', f: (x) => k * Math.sin(x) });
    }
    if (kind === 2) {
      const q1 = mk(T.anti(), tx(`∫ ${k} cos x dx = ?`, `∫ ${k} cos x dx = ?`), `${k} sin x + C`,
        [[`-${k} sin x + C`, tx('cos x\'in ters türevine yanlışlıkla eksi işareti koymuşsun (bu türevin işareti).', 'You added a minus sign that belongs to the derivative of cos x, not its antiderivative.')],
          [`${k} cos x + C`, tx('cos x\'in ters türevini yine cos x sanmışsın.', 'You took cos x as its own antiderivative.')],
          [`-${k} cos x + C`, tx('sin x ile cos x\'in ters türevlerini karıştırmışsın.', 'You mixed up the antiderivatives of sin x and cos x.')],
          [`${k} sin x`, tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')]],
        [rule('(sin x)\' = cos x', '(sin x)\' = cos x'), rule(`∫ ${k} cos x dx = ${k} sin x + C`, `∫ ${k} cos x dx = ${k} sin x + C`)], rng);
      return chk(q1, { t: 'anti', f: (x) => k * Math.cos(x) });
    }
    if (kind === 3) {
      const q1 = mk(T.anti(), tx(`∫ ${k}/x dx (x > 0) = ?`, `∫ ${k}/x dx (x > 0) = ?`), `${k} ln|x| + C`,
        [[`-${k}/x² + C`, tx('1/x\'in türevini almışsın; integral almalıydın.', 'You differentiated 1/x instead of integrating.')],
          [`${k}/x + C`, tx('İntegrandı olduğu gibi yazıp ln almayı unutmuşsun.', 'You copied the integrand and forgot the logarithm.')],
          [`ln|x|/${k} + C`, tx('Sabit çarpan k çarpılmalı, bölünmemeli.', 'The constant k multiplies the result; it does not divide it.')],
          [`${k} ln|x|`, tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')]],
        [rule('(ln|x|)\' = 1/x', '(ln|x|)\' = 1/x'), rule(`∫ ${k}/x dx = ${k} ln|x| + C`, `∫ ${k}/x dx = ${k} ln|x| + C`)], rng);
      return chk(q1, { t: 'anti', f: (x) => k / x });
    }
    const q1 = mk(T.anti(), tx(`∫ ${k} dx = ?`, `∫ ${k} dx = ?`), `${k}x + C`,
      [[`${k} + C`, tx('Sabitin integralini sabit bırakmışsın; ∫ k dx = kx + C.', 'You left the constant unchanged; ∫ k dx = kx + C.')],
        [`x + C`, tx('Sabit çarpan k\'yı düşürmüşsün.', 'You dropped the constant k.')],
        [`${k}x²/2 + C`, tx('Sabiti x⁰ gibi değil x¹ gibi integre etmişsin.', 'You integrated as if the integrand were k·x rather than k.')],
        [`${k}x`, tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')]],
      [rule(`${k} = ${k}·x⁰`, `${k} = ${k}·x⁰`), rule(`∫ ${k} dx = ${k}x + C`, `∫ ${k} dx = ${k}x + C`)], rng);
    return chk(q1, { t: 'anti', f: () => k });
  }

  function inDefPoly(rng) {
    const p = nz(rng, -3, 3), q = nz(rng, -4, 4), b = rng.nextInt(1, 5);
    const ans = p * b * b + q * b;
    const fx = (x) => 2 * p * x + q;
    const plot = mkPlot(-1, b + 1, [fx], [0, b]);
    const q1 = mk(T.def(), tx(`[0, ${b}] aralığında ∫ (${polyStr(q, 2 * p)}) dx integrali kaçtır?`, `What is ∫ (${polyStr(q, 2 * p)}) dx on [0, ${b}]?`), String(ans),
      [[String(2 * p * b + q), tx('Ters türev yerine integrandı b\'de hesapladın.', 'You evaluated the integrand at b instead of the antiderivative.')],
        [String(p * b + q), tx('F(b) hesabında b çarpanını unuttun.', 'You dropped a factor of b when computing F(b).')],
        [String(-ans), tx('F(b) − F(0) yerine ters sırayla çıkardın (işaret hatası).', 'You subtracted in the wrong order, F(0) − F(b): a sign error.')]],
      [tx(`Ters türev: F(x) = ${polyStr(0, q, p)}`, `Antiderivative: F(x) = ${polyStr(0, q, p)}`), `F(${b}) - F(0) = ${ans} - 0 = ${ans}`], rng, plot);
    return chk(q1, { t: 'int', f: fx, a: 0, b });
  }

  function inDefSquare(rng) {
    const b = rng.nextInt(2, 6);
    const fx = (x) => x * x;
    const plot = mkPlot(-1, b + 1, [fx], [0, b]);
    const q1 = mk(T.area(), tx(`y = x² eğrisi altında, x = 0 ile x = ${b} arasında kalan alan kaçtır?`, `What is the area under y = x² between x = 0 and x = ${b}?`), frac(b * b * b, 3),
      [[frac(b * b, 2), tx('x²\'yi x²/2 olarak integre ettin; yeni üs 3\'tür.', 'You integrated x² as x²/2; the new exponent is 3, not 2.')],
        [String(b * b * b), tx('3\'e bölmeyi unuttun.', 'You forgot to divide by the new exponent.')],
        [frac(b * b * b, 2), tx('Yeni üs yerine 2\'ye böldün.', 'You divided by 2 instead of the new exponent.')],
        [frac(b * b, 3), tx('Üssü artırmadın, yalnızca 3\'e böldün.', 'You did not raise the exponent, only divided by 3.')]],
      [tx('Alan = ∫ x² dx = x³/3', 'Area = ∫ x² dx = x³/3'), `= ${b}³/3 - 0 = ${frac(b * b * b, 3)}`], rng, plot);
    return chk(q1, { t: 'int', f: fx, a: 0, b });
  }

  function inRiemann(rng) {
    const n = rng.nextInt(4, 9), left = rng.nextInt(0, 2) === 0;
    const ans = left ? n * (n - 1) / 2 : n * (n + 1) / 2;
    const plot = new PlotSpec(-1, n + 1, -1, n + 1).addCurve((x) => x);
    for (let i = 0; i <= n; i++) plot.addPoint(i, 0, '', true);
    const q1 = mk(T.riem(),
      tx(`f(x) = x fonksiyonu için [0, ${n}] aralığını ${n} eşit parçaya bölerek ${left ? 'SOL' : 'SAĞ'} uç Riemann toplamı kaçtır?`,
        `For f(x) = x, dividing [0, ${n}] into ${n} equal parts, what is the ${left ? 'LEFT' : 'RIGHT'} endpoint Riemann sum?`),
      String(ans),
      [[String(left ? n * (n + 1) / 2 : n * (n - 1) / 2), left ? tx('Sağ uç toplamını hesapladın; sol uçlarda 0, 1, ... kullanılır.', 'You computed the right-endpoint sum; left endpoints use 0, 1, ...') : tx('Sol uç toplamını hesapladın; sağ uçlarda 1, 2, ... kullanılır.', 'You computed the left-endpoint sum; right endpoints use 1, 2, ...')],
        [String(n * n / 2 === Math.floor(n * n / 2) ? n * n / 2 : n * n), tx('Riemann toplamı yerine tam alanı (n²/2) verdin.', 'You gave the exact area (n²/2) instead of the endpoint sum.')]],
      [tx('Δx = 1', 'Δx = 1'), left ? tx(`Sol uçlar: 0, 1, ..., ${n - 1}`, `Left endpoints: 0, 1, ..., ${n - 1}`) : tx(`Sağ uçlar: 1, 2, ..., ${n}`, `Right endpoints: 1, 2, ..., ${n}`),
        tx(`Toplam = ${ans}`, `Sum = ${ans}`)], rng, plot);
    return chk(q1, { t: 'riemann', f: (x) => x, a: 0, b: n, n, kind: left ? 'left' : 'right' });
  }

  function propConst(rng) {
    const m = rng.nextInt(2, 9), k = rng.pick([2, 3, 4, -2, -3]), c = rng.nextInt(1, 5);
    const a = rng.nextInt(0, 3), b = a + rng.nextInt(2, 5), L = b - a;
    const ans = k * m + c * L;
    const q1 = mk(T.prop(),
      tx(`${I(a, b)} f(x) dx = ${m} ise ${I(a, b)} (${k}f(x) + ${c}) dx kaçtır?`, `If ${I(a, b)} f(x) dx = ${m}, what is ${I(a, b)} (${k}f(x) + ${c}) dx?`), String(ans),
      [[String(k * m + c), tx(`Sabit ${c} integrali ${c}·(b − a) olmalıydı; yalnızca ${c} eklemişsin.`, `The constant ${c} integrates to ${c}·(b − a); you only added ${c}.`)],
        [String((k + c) * m), tx('Sabit terimi f(x) ile aynı çarpana katıp integrale çarpmışsın.', 'You merged the constant with the multiple of f and multiplied it by the integral.')],
        [String(k * m), tx('Sabit terimin integralini (c·(b − a)) unutmuşsun.', 'You forgot the integral of the constant term, c·(b − a).')]],
      [tx('Doğrusallık: ∫ (k f + c) dx = k ∫ f dx + c (b − a)', 'Linearity: ∫ (k f + c) dx = k ∫ f dx + c (b − a)'),
        `= ${k}·${m} + ${c}·${L}`, `= ${ans}`], rng);
    return chk(q1, { t: 'int', f: () => k * m / L + c, a, b });
  }

  function propReverse(rng) {
    const m = rng.nextInt(2, 9), k = rng.pick([2, 3, 4]);
    const a = rng.nextInt(0, 3), b = a + rng.nextInt(2, 5);
    const q1 = mk(T.prop(),
      tx(`${I(a, b)} f(x) dx = ${m} ise ${I(b, a)} ${k}f(x) dx kaçtır?`, `If ${I(a, b)} f(x) dx = ${m}, what is ${I(b, a)} ${k}f(x) dx?`), String(-k * m),
      [[String(k * m), tx('Sınırların yer değiştirmesinin işareti değiştirdiğini unuttun.', 'You forgot that swapping the limits flips the sign.')],
        [String(-m), tx('Sabit çarpan ' + k + '\'yı unuttun.', 'You forgot the constant multiple ' + k + '.')],
        [String(m), tx('Hem sabit çarpanı hem de işaret değişimini unuttun.', 'You forgot both the constant multiple and the sign change.')]],
      [tx(`Sınırları çevirmek işareti değiştirir: ${I(b, a)} f dx = −${I(a, b)} f dx`, `Swapping limits flips the sign: ${I(b, a)} f dx = −${I(a, b)} f dx`),
        `${I(b, a)} ${k}f dx = −${k}·${m} = ${-k * m}`], rng);
    return chk(q1, { t: 'int', f: () => k * m / (b - a), a: b, b: a });
  }

  function inLn(rng) {
    const b = rng.nextInt(2, 10);
    const q1 = mk(T.lnexp(), tx(`[1, ${b}] aralığında ∫ (1/x) dx integrali kaçtır?`, `What is ∫ (1/x) dx on [1, ${b}]?`), `ln ${b}`,
      [[`ln ${b} - 1`, tx('ln 1 = 0 iken 1 çıkardın.', 'You subtracted 1 although ln 1 = 0.')],
        [String(b - 1), tx('İntegral yerine aralığın uzunluğunu (b − 1) verdin.', 'You gave the interval length (b − 1) instead of the integral.')],
        [`1/${b}`, tx('İntegrandı üst sınırda hesapladın.', 'You evaluated the integrand at the upper limit.')],
        [String(b), tx('Ters türev yerine üst sınırı verdin.', 'You gave the upper limit itself instead of using an antiderivative.')]],
      ['∫ (1/x) dx = ln|x|', `ln ${b} - ln 1 = ln ${b}`], rng);
    return chk(q1, { t: 'int', f: (x) => 1 / x, a: 1, b });
  }

  function inFtc(rng) {
    const c = nz(rng, -5, 5), k = rng.nextInt(1, 5);
    const ans = k * k + c;
    const q1 = mk(T.ftc1(),
      tx(`F(x) = ∫_1^x (t² ${plus(c)}) dt ise F'(${k}) kaçtır?`, `If F(x) = ∫_1^x (t² ${plus(c)}) dt, what is F'(${k})?`), String(ans),
      [[String(2 * k), tx('Önce t² + c integrandını türevledin; KTT\'de integrandı doğrudan x\'te hesaplarsın.', 'You differentiated the integrand first; by FTC you just evaluate the integrand at x.')],
        [String(c), tx('Yalnızca c terimini aldın; t² terimini unuttun.', 'You kept only the constant c and dropped the t² term.')],
        [String(Math.trunc(k * k * k / 3) + c * k), tx('F(x) için bir ters türev değeri hesapladın; F\'(x) için sadece integrandı kullanmalıydın.', 'You evaluated an antiderivative-type expression instead of the integrand.')]],
      [tx('KTT: d/dx ∫ₐˣ f(t) dt = f(x)', 'FTC: d/dx ∫ₐˣ f(t) dt = f(x)'), `F'(x) = x² ${plus(c)}`, `F'(${k}) = ${ans}`], rng);
    return chk(q1, { t: 'ftc1', f: (t) => t * t + c, lo: () => 1, hi: (x) => x, x0: k });
  }

  // =====================================================================================================
  // Level 2
  // =====================================================================================================

  function inAverage(rng) {
    const b = rng.nextInt(2, 7);
    const fx = (x) => x * x;
    const plot = mkPlot(-1, b + 1, [fx], [0, b]);
    const q1 = mk(T.avg(), tx(`f(x) = x² fonksiyonunun [0, ${b}] aralığındaki ortalama değeri kaçtır?`, `What is the average value of f(x) = x² on [0, ${b}]?`), frac(b * b, 3),
      [[frac(b * b, 2), tx('x²\'yi x²/2 olarak integre ettin.', 'You integrated x² as x²/2.')],
        [frac(b * b * b, 3), tx('(b − a)\'ya bölmeyi unuttun.', 'You forgot to divide by the interval length b − a.')],
        [String(b * b), tx('İntegralde 3\'e bölmeyi unuttun.', 'You forgot to divide by 3 when integrating x².')],
        [frac(b, 3), tx('Aralık uzunluğuna iki kez böldün.', 'You divided by the interval length twice.')]],
      [tx('Ortalama = (1/(b − a))·∫ f(x) dx', 'Average = (1/(b − a))·∫ f(x) dx'), `= (1/${b})·(${b}³/3) = ${frac(b * b, 3)}`], rng, plot);
    return chk(q1, { t: 'avg', f: fx, a: 0, b });
  }

  function inOdd(rng) {
    const a = rng.nextInt(1, 5), c = nz(rng, -4, 4);
    const fx = (x) => x * x * x + c;
    const plot = mkPlot(-(a + 1), a + 1, [fx], [-a, a]);
    const q1 = mk(T.sym(), tx(`[-${a}, ${a}] aralığında ∫ (x³ ${plus(c)}) dx integrali kaçtır?`, `What is ∫ (x³ ${plus(c)}) dx on [-${a}, ${a}]?`), String(2 * a * c),
      [['0', tx('Tek fonksiyon kuralını tüm integrale uyguladın; sabit terimi unuttun.', 'You applied the odd-function shortcut to the whole integrand and forgot the constant term.')],
        [String(a * c), tx('Aralık uzunluğu 2a yerine a kullandın.', 'You used length a instead of the full length 2a.')],
        [String(a * a * c), tx('Sabit terimi integre ederken a ile iki kez çarptın.', 'You multiplied by a twice when integrating the constant term.')]],
      [tx('x³ tek fonksiyon: simetrik aralıkta integrali 0.', 'x³ is an odd function: its integral over a symmetric interval is 0.'),
        tx(`Kalan: ∫ ${c} dx = ${c}·(2·${a}) = ${2 * a * c}`, `Remaining: ∫ ${c} dx = ${c}·(2·${a}) = ${2 * a * c}`)], rng, plot);
    return chk(q1, { t: 'int', f: fx, a: -a, b: a });
  }

  function inTrig(rng) {
    const a = nz(rng, -4, 4);
    const which = rng.nextInt(0, 3);
    const mkT = (lbl, hi, ans, wr, sol, f, hiNum) => {
      const plot = mkPlot(-0.5, hiNum + 0.5, [f], [0, hiNum]);
      return chk(mk(T.trig(), tx(`[0, ${lbl}] aralığında ∫ ${cf(a)}${hi} dx integrali kaçtır?`, `What is ∫ ${cf(a)}${hi} dx on [0, ${lbl}]?`), ans, wr, sol, rng, plot), { t: 'int', f, a: 0, b: hiNum });
    };
    if (which === 0) {
      return mkT('π', 'sin x', String(2 * a),
        [[String(a), tx('Sadece bir uç değeri kullandın; F(π) − F(0) farkı gerekir.', 'You used only one endpoint value instead of the difference F(π) − F(0).')],
          ['0', tx('sin x\'in ters türevini sin x sandın (sin π − sin 0 = 0).', 'You used sin x as the antiderivative of sin x (sin π − sin 0 = 0).')],
          [String(-2 * a), tx('F(π) − F(0) farkında işaret hatası.', 'A sign error in F(π) − F(0).')]],
        ['∫ sin x dx = -cos x', `${a}[-cos π + cos 0] = ${a}(1 + 1) = ${2 * a}`], (x) => a * Math.sin(x), Math.PI);
    }
    if (which === 1) {
      return mkT('π/2', 'cos x', String(a),
        [[String(2 * a), tx('Fazladan 2 çarpanı ekledin ([0, π] integraliyle karıştırdın).', 'You added an extra factor 2 (mixed up with the [0, π] case).')],
          ['0', tx('Yalnızca x = 0\'ı yerine koydun.', 'You substituted only x = 0.')],
          [String(-a), tx('cos x\'in ters türevini −sin x sandın.', 'You took −sin x as the antiderivative of cos x.')]],
        ['∫ cos x dx = sin x', `${a}[sin(π/2) - sin 0] = ${a}`], (x) => a * Math.cos(x), Math.PI / 2);
    }
    return mkT('π', 'cos x', '0',
      [[String(a), tx('Yalnızca [0, π/2] parçasının alanını saydın.', 'You counted only the part on [0, π/2].')],
        [String(2 * a), tx('Alanları toplarken eksi işaretli parçayı da pozitif saydın.', 'You added both areas as positive, ignoring that the part below the axis is negative.')],
        [String(-a), tx('Yalnızca [π/2, π] parçasını saydın.', 'You counted only the part on [π/2, π].')]],
      ['∫ cos x dx = sin x', `${a}[sin π - sin 0] = 0`], (x) => a * Math.cos(x), Math.PI);
  }

  function inSub(rng) {
    const n = rng.nextInt(2, 5), a = nz(rng, -4, 4);
    const inner = `(x² ${plus(a)})`;
    const q1 = mk(T.sub(), tx(`∫ 2x·${inner}${sup(n)} dx integralinin sonucu hangisidir?`, `Which is the result of ∫ 2x·${inner}${sup(n)} dx?`), `${inner}${sup(n + 1)}/${n + 1} + C`,
      [[`${inner}${sup(n)}/${n} + C`, tx('Üssü artırmadın ve eski üsse böldün; ∫uⁿ du = uⁿ⁺¹/(n+1).', 'You did not raise the exponent and divided by the old exponent instead of n + 1.')],
        [`${inner}${sup(n + 1)} + C`, tx('(n+1)\'e bölmeyi unuttun.', 'You forgot to divide by the new exponent.')],
        [`2${inner}${sup(n + 1)}/${n + 1} + C`, tx('du = 2x dx çarpanı 2\'yi ikinci kez ekledin.', 'You included the factor 2 from du = 2x dx a second time.')],
        [`${inner}${sup(n + 1)}/${2 * (n + 1)} + C`, tx('Paydaya fazladan 2 çarpanı koydun.', 'You put an extra factor 2 in the denominator.')]],
      [`u = x² ${plus(a)}, du = 2x dx`, `∫ uⁿ du = u${sup(n + 1)}/${n + 1} + C`, tx(`Geri yaz: ${inner}${sup(n + 1)}/${n + 1} + C`, `Substitute back: ${inner}${sup(n + 1)}/${n + 1} + C`)], rng);
    return chk(q1, { t: 'anti', f: (x) => 2 * x * Math.pow(x * x + a, n) });
  }

  function propAdd(rng) {
    const p = rng.nextInt(2, 9), b = rng.nextInt(1, 4), c = b + rng.nextInt(2, 5), q = p + nz(rng, -5, 6);
    const ans = q - p;
    const q1 = mk(T.prop(),
      tx(`${I(0, b)} f(x) dx = ${p} ve ${I(0, c)} f(x) dx = ${q} ise ${I(b, c)} f(x) dx kaçtır?`, `If ${I(0, b)} f(x) dx = ${p} and ${I(0, c)} f(x) dx = ${q}, what is ${I(b, c)} f(x) dx?`), String(ans),
      [[String(p + q), tx('İki integrali toplamışsın; aradığın parça büyük integralden küçüğün çıkarılmasıyla bulunur.', 'You added the two integrals; the missing piece is the larger integral minus the smaller one.')],
        [String(p - q), tx('Çıkarmayı ters sırada yapmışsın (işaret hatası).', 'You subtracted in the wrong order (sign error).')],
        [String(q), tx('[0, ' + c + '] integralini aradığın değer sanmışsın.', 'You took the integral over [0, ' + c + '] as the answer.')],
        [String(p), tx('[0, ' + b + '] integralini aradığın değer sanmışsın.', 'You took the integral over [0, ' + b + '] as the answer.')]],
      [tx('Toplamsallık: ∫₀ᶜ = ∫₀ᵇ + ∫ᵇᶜ', 'Additivity: ∫₀ᶜ = ∫₀ᵇ + ∫ᵇᶜ'), `${I(b, c)} f dx = ${q} - ${p} = ${ans}`], rng);
    return chk(q1, { t: 'int', f: (x) => (x < b ? p / b : (q - p) / (c - b)), a: b, b: c });
  }

  function ftcPoly(rng) {
    const m = nz(rng, -2, 2), s = nz(rng, -3, 3), w = nz(rng, -4, 4);
    const a = rng.nextInt(-2, 1), b = a + rng.nextInt(2, 4);
    const F = (x) => m * x * x * x + s * x * x + w * x;
    const f = (x) => 3 * m * x * x + 2 * s * x + w;
    const ans = F(b) - F(a);
    const q1 = mk(T.def(),
      tx(`${I(a, b)} (${polyStr(w, 2 * s, 3 * m)}) dx integrali kaçtır?`, `What is ${I(a, b)} (${polyStr(w, 2 * s, 3 * m)}) dx?`), String(ans),
      [[String(F(b)), tx('Yalnızca F(b)\'yi hesapladın; F(a) çıkarılmalıydı.', 'You computed only F(b); F(a) must be subtracted.')],
        [String(F(a) - F(b)), tx('F(a) − F(b) yazdın; sıra F(b) − F(a) olmalı (işaret hatası).', 'You wrote F(a) − F(b); the order is F(b) − F(a) (sign error).')],
        [String(f(b) - f(a)), tx('Ters türev yerine integrandı hesaplamışsın.', 'You evaluated the integrand instead of the antiderivative.')],
        [String(F(b) + F(a)), tx('Alt sınırı çıkarmak yerine eklemişsin.', 'You added the lower-limit value instead of subtracting it.')]],
      [tx(`F(x) = ${polyStr(0, w, s, m)}`, `F(x) = ${polyStr(0, w, s, m)}`), `F(${b}) = ${F(b)},  F(${a}) = ${F(a)}`, `F(${b}) - F(${a}) = ${ans}`], rng);
    return chk(q1, { t: 'int', f, a, b });
  }

  function ftcExp(rng) {
    if (rng.nextInt(0, 2) === 0) {
      const k = rng.nextInt(2, 5), c = rng.nextInt(1, 4);
      const q1 = mk(T.lnexp(), tx(`${I(0, k)} ${cf(c)}eˣ dx integrali kaçtır?`, `What is ${I(0, k)} ${cf(c)}eˣ dx?`), cx(c, `${ex(k)} - 1`),
        [[`${cf(c)}${ex(k)}`, tx('F(0) = e⁰ = 1 değerini çıkarmayı unutmuşsun.', 'You forgot to subtract F(0) = e⁰ = 1.')],
          [cx(c, `${ex(k)} + 1`), tx('F(0) = 1 değerini çıkarmak yerine eklemişsin.', 'You added F(0) = 1 instead of subtracting it.')],
          [cx(c, `${ex(k)} - e`), tx('Alt sınır 0 iken F(1) = e değerini çıkarmışsın.', 'You subtracted F(1) = e although the lower limit is 0.')],
          [`${c * k}${ex(k - 1)}`, tx('Kuvvet kuralını eˣ\'e uygulamışsın; eˣ\'in ters türevi eˣ\'tir.', 'You applied the power rule to eˣ; its antiderivative is eˣ.')]],
        [tx(`Ters türev: F(x) = ${cf(c)}eˣ`, `Antiderivative: F(x) = ${cf(c)}eˣ`), `F(${k}) - F(0) = ${cf(c)}${ex(k)} - ${cf(c)}`, cx(c, `${ex(k)} - 1`)], rng);
      return chk(q1, { t: 'int', f: (x) => c * Math.exp(x), a: 0, b: k });
    }
    const b = rng.nextInt(2, 7), c = rng.nextInt(1, 4);
    const ans = c * (b - 1);
    const q1 = mk(T.lnexp(), tx(`${I(0, `ln ${b}`)} ${cf(c)}eˣ dx integrali kaçtır?`, `What is ${I(0, `ln ${b}`)} ${cf(c)}eˣ dx?`), String(ans),
      [[String(c * b), tx('F(0) = 1 değerini çıkarmayı unutmuşsun.', 'You forgot to subtract F(0) = 1.')],
        [String(c * (b + 1)), tx('F(0) = 1 değerini çıkarmak yerine eklemişsin.', 'You added F(0) = 1 instead of subtracting it.')],
        [String(b - 1), tx('Sabit çarpan ' + c + '\'yı unutmuşsun.', 'You dropped the constant multiple ' + c + '.')]],
      [tx(`F(x) = ${cf(c)}eˣ`, `F(x) = ${cf(c)}eˣ`), `e^(ln ${b}) = ${b}`, `${c}·${b} - ${c}·1 = ${ans}`], rng);
    return chk(q1, { t: 'int', f: (x) => c * Math.exp(x), a: 0, b: Math.log(b) });
  }

  function ftcTrig(rng) {
    const a = nz(rng, -4, 4), b = nz(rng, -4, 4);
    if (rng.nextInt(0, 2) === 0) {
      const ans = a + b;
      const q1 = mk(T.trig(), tx(`${I(0, 'π/2')} (${sumT([[a, 'sin x', 1], [b, 'cos x', 1]])}) dx integrali kaçtır?`, `What is ${I(0, 'π/2')} (${sumT([[a, 'sin x', 1], [b, 'cos x', 1]])}) dx?`), String(ans),
        [[String(-a + b), tx('sin x\'in ters türevindeki eksi işaretini yanlış uygulamışsın.', 'You mishandled the minus sign in the antiderivative of sin x.')],
          [String(a - b), tx('cos x terimini ters işaretle almışsın.', 'You took the cos x term with the wrong sign.')],
          [String(-a - b), tx('Alt ve üst sınır değerlerini ters çıkarmışsın.', 'You subtracted the limit values in reverse.')]],
        [tx('F(x) = ' + sumT([[-a, 'cos x', 1], [b, 'sin x', 1]]), 'F(x) = ' + sumT([[-a, 'cos x', 1], [b, 'sin x', 1]])),
          `F(π/2) = ${b},  F(0) = ${-a}`, `${b} - (${-a}) = ${ans}`], rng);
      return chk(q1, { t: 'int', f: (x) => a * Math.sin(x) + b * Math.cos(x), a: 0, b: Math.PI / 2 });
    }
    const pb = (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'π', op = b > 0 ? '+' : '-';
    const ans = `${2 * a} ${op} ${pb}`;
    const q1 = mk(T.trig(), tx(`${I(0, 'π')} (${sumT([[a, 'sin x', 1], [b, '']])}) dx integrali kaçtır?`, `What is ${I(0, 'π')} (${sumT([[a, 'sin x', 1], [b, '']])}) dx?`), ans,
      [[`${2 * a}`, tx('Sabit terimin integralini (b·π) unutmuşsun.', 'You forgot the integral of the constant term (b·π).')],
        [`${2 * a} ${op} ${Math.abs(b)}`, tx('Sabit terimin integralinde π çarpanını (aralık uzunluğunu) unutmuşsun.', 'You forgot the factor π (the interval length) for the constant term.')],
        [`${-2 * a} ${op} ${pb}`, tx('sin x\'in ters türevinde işaret hatası yapmışsın.', 'You made a sign error in the antiderivative of sin x.')],
        [`${a} ${op} ${pb}`, tx('sin x teriminden gelen 2 çarpanını atlamışsın.', 'You dropped the factor 2 coming from the sin x term.')]],
      [tx('F(x) = ' + sumT([[-a, 'cos x', 1], [b, 'x']]), 'F(x) = ' + sumT([[-a, 'cos x', 1], [b, 'x']])), `F(π) - F(0) = (${a} + ${b}π) - (${-a})`, `= ${ans}`], rng);
    return chk(q1, { t: 'int', f: (x) => a * Math.sin(x) + b, a: 0, b: Math.PI });
  }

  function ftc1Value(rng) {
    const u = 3 * nz(rng, -2, 2), s = 2 * nz(rng, -3, 3), w = nz(rng, -4, 4), a = rng.nextInt(0, 3), k = rng.nextInt(1, 4);
    const f = (t) => u * t * t + s * t + w, G = (x) => u / 3 * x * x * x + s / 2 * x * x + w * x;
    const fstr = polyT(w, s, u);
    if (rng.nextInt(0, 2) === 0) {
      const ans = f(k);
      const q1 = mk(T.ftc1(), tx(`F(x) = ∫_${a}^x (${fstr}) dt ise F'(${k}) kaçtır?`, `If F(x) = ∫_${a}^x (${fstr}) dt, what is F'(${k})?`), String(ans),
        [[String(G(k) - G(a)), tx('F\'(k) yerine F(k) değerini (integrali) hesaplamışsın.', 'You computed the value F(k) (the integral) instead of F\'(k).')],
          [String(2 * u * k + s), tx('İntegrandı türevlemişsin; KTT\'de integrand doğrudan hesaplanır.', 'You differentiated the integrand; by the FTC it is simply evaluated.')],
          [String(f(k) - f(a)), tx('f(k) − f(a) hesaplamışsın; alt sınır türevde görünmez.', 'You computed f(k) − f(a); the lower limit does not appear in the derivative.')]],
        [tx('KTT Kısım 1: F\'(x) = f(x)', 'FTC Part 1: F\'(x) = f(x)'), `F'(x) = ${polyStr(w, s, u)}`, `F'(${k}) = ${ans}`], rng);
      return chk(q1, { t: 'ftc1', f, lo: () => a, hi: (x) => x, x0: k });
    }
    const ans = 2 * u * k + s;
    const q1 = mk(T.ftc1(), tx(`F(x) = ∫_${a}^x (${fstr}) dt ise F''(${k}) kaçtır?`, `If F(x) = ∫_${a}^x (${fstr}) dt, what is F''(${k})?`), String(ans),
      [[String(f(k)), tx('Bu F\'(k) değeri; ikinci türev için bir kez daha türev almalısın.', 'This is F\'(k); the second derivative needs one more differentiation.')],
        [String(2 * u), tx('Yalnızca t² teriminin türevini almışsın; s·t terimi de katkı verir.', 'You differentiated only the t² term; the s·t term contributes too.')],
        [String(2 * u * a + s), tx('Alt sınırı a yerine k yerine koymuşsun.', 'You substituted the lower limit a instead of k.')]],
      [tx('F\'(x) = f(x) = ' + polyStr(w, s, u), 'F\'(x) = f(x) = ' + polyStr(w, s, u)), `F''(x) = f'(x) = ${polyStr(s, 2 * u)}`, `F''(${k}) = ${ans}`], rng);
    return chk(q1, { t: 'ftc1', f: (t) => 2 * u * t + s, lo: () => a, hi: (x) => x, x0: k, plus: f(a) });
  }

  function tableText(xs, ys) {
    return tx(`x = ${xs.join(', ')} için f(x) = ${ys.join(', ')}`, `For x = ${xs.join(', ')}, f(x) = ${ys.join(', ')}`);
  }
  function mkTable(rng, n, w) {
    const xs = [], ys = [];
    for (let i = 0; i <= n; i++) { xs.push(i * w); ys.push(rng.nextInt(1, 10)); }
    if (ys[0] === ys[n]) ys[n] = ys[n] % 9 + 1;
    return { xs, ys };
  }
  const sumRange = (ys, i0, i1) => { let s = 0; for (let i = i0; i <= i1; i++) s += ys[i]; return s; };

  function riemannLR(rng) {
    const n = 4, w = rng.nextInt(1, 4), left = rng.nextInt(0, 2) === 0;
    const { xs, ys } = mkTable(rng, n, w);
    const L = w * sumRange(ys, 0, n - 1), R = w * sumRange(ys, 1, n), tr = (L + R) / 2;
    const ans = left ? L : R;
    const q1 = mk(T.riem(), tx(`${tableText(xs, ys)} değerleri verilmiştir. [0, ${n * w}] aralığında ${n} eşit parçalı ${left ? 'SOL' : 'SAĞ'} uç Riemann toplamı kaçtır?`,
      `${tableText(xs, ys)} are given. What is the ${left ? 'LEFT' : 'RIGHT'} endpoint Riemann sum with ${n} equal subintervals on [0, ${n * w}]?`), String(ans),
      [[String(left ? R : L), left ? tx('Sağ uç değerlerini kullanmışsın; sol toplam ilk dört değeri kullanır.', 'You used the right endpoints; the left sum uses the first four values.') : tx('Sol uç değerlerini kullanmışsın; sağ toplam son dört değeri kullanır.', 'You used the left endpoints; the right sum uses the last four values.')],
        [String(w * sumRange(ys, 0, n)), tx('Beş değerin hepsini toplamışsın; yalnızca dört alt aralık var.', 'You added all five values; there are only four subintervals.')],
        [String(left ? sumRange(ys, 0, n - 1) : sumRange(ys, 1, n)), tx('Δx = ' + w + ' ile çarpmayı unutmuşsun.', 'You forgot to multiply by Δx = ' + w + '.')],
        [frac(2 * tr, 2), tx('Sol ve sağ toplamların ortalamasını (yamuk kuralı) vermişsin.', 'You gave the average of the left and right sums (trapezoid rule).')]],
      [`Δx = ${w}`, left ? tx(`Sol: ${w}·(${ys.slice(0, n).join(' + ')})`, `Left: ${w}·(${ys.slice(0, n).join(' + ')})`) : tx(`Sağ: ${w}·(${ys.slice(1).join(' + ')})`, `Right: ${w}·(${ys.slice(1).join(' + ')})`), `= ${ans}`], rng);
    return chk(q1, { t: 'tab', xs, ys, kind: left ? 'left' : 'right' });
  }

  function riemannMid(rng) {
    const n = rng.nextInt(3, 5), p = nz(rng, -3, 3), q = rng.nextInt(-4, 5), c = rng.nextInt(0, 3);
    const f = (x) => p * x + q, w = 2;
    let mid = 0, L = 0, R = 0, sm = 0;
    for (let i = 0; i < n; i++) { mid += w * f(c + w * i + 1); L += w * f(c + w * i); R += w * f(c + w * (i + 1)); sm += f(c + w * i + 1); }
    const q1 = mk(T.riem(), tx(`f(x) = ${polyStr(q, p)} için [${c}, ${c + 2 * n}] aralığını ${n} eşit parçaya bölerek ORTA nokta Riemann toplamı kaçtır?`,
      `For f(x) = ${polyStr(q, p)}, what is the MIDPOINT Riemann sum on [${c}, ${c + 2 * n}] using ${n} equal subintervals?`), String(mid),
      [[String(L), tx('Sol uç değerlerini kullanmışsın; orta nokta için her parçanın ortası (x = ' + (c + 1) + ', ' + (c + 3) + ', ...) kullanılır.', 'You used left endpoints; the midpoint rule uses the middle of each piece (x = ' + (c + 1) + ', ' + (c + 3) + ', ...).')],
        [String(R), tx('Sağ uç değerlerini kullanmışsın.', 'You used right endpoints.')],
        [String(sm), tx('Δx = 2 ile çarpmayı unutmuşsun.', 'You forgot to multiply by Δx = 2.')]],
      [tx(`Δx = 2; orta noktalar: ${Array.from({ length: n }, (_, i) => c + 2 * i + 1).join(', ')}`, `Δx = 2; midpoints: ${Array.from({ length: n }, (_, i) => c + 2 * i + 1).join(', ')}`),
        tx(`Toplam = 2·(${Array.from({ length: n }, (_, i) => f(c + 2 * i + 1)).join(' + ')}) = ${mid}`, `Sum = 2·(${Array.from({ length: n }, (_, i) => f(c + 2 * i + 1)).join(' + ')}) = ${mid}`)], rng);
    return chk(q1, { t: 'riemann', f, a: c, b: c + 2 * n, n, kind: 'mid' });
  }

  function riemannTrap(rng) {
    const n = 4, w = 2;
    const { xs, ys } = mkTable(rng, n, w);
    const L = w * sumRange(ys, 0, n - 1), R = w * sumRange(ys, 1, n);
    const ans = ys[0] + ys[n] + 2 * sumRange(ys, 1, n - 1);
    const q1 = mk(T.riem(), tx(`${tableText(xs, ys)} değerleri verilmiştir. [0, ${n * w}] aralığında yamuk (trapezoid) kuralıyla ${n} parça için integralin yaklaşık değeri kaçtır?`,
      `${tableText(xs, ys)} are given. Using the trapezoid rule with ${n} subintervals on [0, ${n * w}], what is the approximation of the integral?`), String(ans),
      [[String(L), tx('Sol uç toplamını vermişsin; yamukta uç değerleri yarım ağırlıkla alınır.', 'You gave the left sum; the trapezoid rule weights the end values by one half.')],
        [String(R), tx('Sağ uç toplamını vermişsin.', 'You gave the right sum.')],
        [String(ys[0] + ys[n] + sumRange(ys, 1, n - 1)), tx('Ortadaki değerleri iki kez saymayı unutmuşsun.', 'You forgot to double-count the interior values.')],
        [String(w * (ys[0] + ys[n] + 2 * sumRange(ys, 1, n - 1))), tx('Δx/2 yerine Δx ile çarpmışsın.', 'You multiplied by Δx instead of Δx/2.')]],
      [tx('T = (Δx/2)·[y₀ + 2y₁ + 2y₂ + 2y₃ + y₄], Δx = 2', 'T = (Δx/2)·[y₀ + 2y₁ + 2y₂ + 2y₃ + y₄], Δx = 2'),
        `= 1·[${ys[0]} + 2·${ys[1]} + 2·${ys[2]} + 2·${ys[3]} + ${ys[4]}]`, `= ${ans}`], rng);
    return chk(q1, { t: 'tab', xs, ys, kind: 'trap' });
  }

  const OU = [
    { f: (x) => x * x, s: 'x²', a: 1, b: 5, n: 4, inc: true, cc: 1 },
    { f: (x) => Math.sqrt(x), s: '√x', a: 1, b: 9, n: 4, inc: true, cc: -1 },
    { f: (x) => 1 / x, s: '1/x', a: 1, b: 5, n: 4, inc: false, cc: 1 },
    { f: (x) => 9 - x * x, s: '9 − x²', a: 0, b: 3, n: 3, inc: false, cc: -1 },
    { f: (x) => x * x * x, s: 'x³', a: 1, b: 5, n: 4, inc: true, cc: 1 },
    { f: (x) => Math.exp(-x), s: 'e⁻ˣ', a: 0, b: 4, n: 4, inc: false, cc: 1 },
  ];
  function overUnder(rng) {
    const d = rng.pick(OU), kind = rng.pick(['left', 'right', 'trap', 'mid']);
    const over = kind === 'left' ? !d.inc : kind === 'right' ? d.inc : kind === 'trap' ? d.cc > 0 : d.cc < 0;
    const names = { left: tx('SOL uç', 'LEFT endpoint'), right: tx('SAĞ uç', 'RIGHT endpoint'), trap: tx('yamuk (trapezoid)', 'trapezoid'), mid: tx('ORTA nokta', 'MIDPOINT') };
    const O = () => tx('Fazla tahmin (gerçek değerden büyük)', 'Overestimate (larger than the true value)');
    const U = () => tx('Eksik tahmin (gerçek değerden küçük)', 'Underestimate (smaller than the true value)');
    const E = () => tx('Tam olarak eşit', 'Exactly equal');
    const N = () => tx('Bu bilgiyle belirlenemez', 'Cannot be determined from this information');
    const w = (d.b - d.a) / d.n;
    const plot = mkPlot(d.a - 0.5, d.b + 0.5, [d.f]);
    for (let i = 0; i <= d.n; i++) plot.addPoint(d.a + i * w, 0, '', true);
    const reason = kind === 'left' ? (d.inc ? tx('f artan: sol uç değerleri her parçada en küçüktür', 'f is increasing: the left value is the smallest on each piece') : tx('f azalan: sol uç değerleri her parçada en büyüktür', 'f is decreasing: the left value is the largest on each piece'))
      : kind === 'right' ? (d.inc ? tx('f artan: sağ uç değerleri her parçada en büyüktür', 'f is increasing: the right value is the largest on each piece') : tx('f azalan: sağ uç değerleri her parçada en küçüktür', 'f is decreasing: the right value is the smallest on each piece'))
        : kind === 'trap' ? (d.cc > 0 ? tx('f konveks (iç bükey): kirişler eğrinin üstündedir', 'f is concave up: chords lie above the curve') : tx('f konkav (dış bükey): kirişler eğrinin altındadır', 'f is concave down: chords lie below the curve'))
          : (d.cc > 0 ? tx('f konveks: teğet doğrusu eğrinin altında kalır, orta nokta eksik tahmin verir', 'f is concave up: tangent lines lie below the curve, so the midpoint rule underestimates') : tx('f konkav: teğet doğrusu eğrinin üstünde kalır, orta nokta fazla tahmin verir', 'f is concave down: tangent lines lie above the curve, so the midpoint rule overestimates'));
    const q1 = mk(T.over(), tx(`f(x) = ${d.s} fonksiyonu için [${d.a}, ${d.b}] aralığında ${d.n} eşit parçalı ${names[kind]} Riemann toplamı, ∫ f(x) dx için ne tür bir tahmindir?`,
      `For f(x) = ${d.s} on [${d.a}, ${d.b}], the ${names[kind]} Riemann sum with ${d.n} equal subintervals is what kind of estimate of ∫ f(x) dx?`),
      over ? O() : U(),
      [[over ? U() : O(), tx('Tahminin yönünü ters çıkarmışsın; artan/azalan ya da konveks/konkav kuralını yanlış eşleştirmişsin.', 'You reversed the direction; the increasing/decreasing or concave up/down rule was matched the wrong way round.')],
        [E(), tx('Yalnızca doğrusal (veya sabit) fonksiyonlarda yamuk/orta nokta tam olur; burada f doğrusal değil.', 'Trapezoid/midpoint are exact only for linear (or constant) functions; f is not linear here.')],
        [N(), tx('Monotonluk ve eğrilik işareti bilindiği için yön belirlenebilir.', 'The monotonicity and concavity are known, so the direction can be determined.')]],
      [reason, over ? tx('Sonuç: FAZLA tahmin', 'Result: OVERestimate') : tx('Sonuç: EKSİK tahmin', 'Result: UNDERestimate')], rng, plot);
    return chk(q1, { t: 'over', f: d.f, a: d.a, b: d.b, n: d.n, kind, expect: over ? 'over' : 'under' });
  }

  function signedAreaGraph(rng) {
    const S = triShape(rng), ans = S.A1 - S.A2;
    const q1 = mk(T.areaG(), tx(`Grafikte f eğrisi ile x-ekseni üçgenler oluşturuyor. ∫_0^${S.s} f(x) dx (işaretli alan) kaçtır?`, `In the graph, f and the x-axis form triangles. What is ∫_0^${S.s} f(x) dx (the signed area)?`), String(ans),
      [[String(S.A1 + S.A2), tx('Eksenin altındaki alanı da pozitif saymışsın; belirli integralde altı negatiftir.', 'You counted the region below the axis as positive; in a definite integral it is negative.')],
        [String(S.A2 - S.A1), tx('İşaretleri ters vermişsin: eksenin üstü pozitif, altı negatiftir.', 'You reversed the signs: above the axis is positive, below is negative.')],
        [String(S.A1), tx('Eksenin altındaki üçgeni hiç saymamışsın.', 'You ignored the triangle below the axis.')],
        [String(-S.A2), tx('Eksenin üstündeki üçgeni hiç saymamışsın.', 'You ignored the triangle above the axis.')]],
      [tx(`Üstteki üçgen: ½ · ${S.q} · ${S.h1} = ${S.A1} (pozitif)`, `Upper triangle: ½ · ${S.q} · ${S.h1} = ${S.A1} (positive)`),
        tx(`Alttaki üçgen: ½ · ${S.w} · ${S.h2} = ${S.A2} (negatif)`, `Lower triangle: ½ · ${S.w} · ${S.h2} = ${S.A2} (negative)`), `${S.A1} - ${S.A2} = ${ans}`], rng, S.plot);
    return chk(q1, { t: 'int', f: S.f, a: 0, b: S.s });
  }

  function totalAreaGraph(rng) {
    const S = triShape(rng), ans = S.A1 + S.A2;
    const q1 = mk(T.areaG(), tx(`Grafikte f eğrisi ile x-ekseni üçgenler oluşturuyor. x = 0 ile x = ${S.s} arasında eğri ile x-ekseni arasında kalan TOPLAM (geometrik) alan kaçtır?`, `In the graph, f and the x-axis form triangles. What is the TOTAL (geometric) area between the curve and the x-axis from x = 0 to x = ${S.s}?`), String(ans),
      [[String(S.A1 - S.A2), tx('İşaretli alanı (integrali) vermişsin; toplam alan için eksenin altındaki parça da pozitif sayılır.', 'You gave the signed area (the integral); for total area the part below the axis also counts as positive.')],
        [String(S.A2 - S.A1), tx('İşaretli alanı ters sırayla vermişsin.', 'You gave the signed area in reverse order.')],
        [String(S.A1), tx('Eksenin altındaki üçgeni saymamışsın.', 'You left out the triangle below the axis.')],
        [String(S.A2), tx('Eksenin üstündeki üçgeni saymamışsın.', 'You left out the triangle above the axis.')]],
      [tx(`Üstteki üçgen: ½ · ${S.q} · ${S.h1} = ${S.A1}`, `Upper triangle: ½ · ${S.q} · ${S.h1} = ${S.A1}`),
        tx(`Alttaki üçgen: ½ · ${S.w} · ${S.h2} = ${S.A2}`, `Lower triangle: ½ · ${S.w} · ${S.h2} = ${S.A2}`), tx(`Toplam alan = ${S.A1} + ${S.A2} = ${ans}`, `Total area = ${S.A1} + ${S.A2} = ${ans}`)], rng, S.plot);
    return chk(q1, { t: 'tot', f: S.f, a: 0, b: S.s });
  }

  function netChange(rng) {
    const p = nz(rng, -3, 3), q = rng.nextInt(-5, 6), a = rng.nextInt(0, 2), b = a + rng.nextInt(2, 5);
    const v = (t) => 2 * p * t + q;
    const ans = p * (b * b - a * a) + q * (b - a);
    const vel = rng.nextInt(0, 2) === 0;
    const text = vel
      ? tx(`Bir parçacığın doğru boyunca hızı v(t) = ${polyT(q, 2 * p)} m/s'dir. t = ${a} ile t = ${b} s arasındaki net yer değiştirme kaç metredir?`, `A particle moves along a line with velocity v(t) = ${polyT(q, 2 * p)} m/s. What is its net displacement (in metres) from t = ${a} to t = ${b} s?`)
      : tx(`Bir depoya su akış hızı r(t) = ${polyT(q, 2 * p)} litre/dk'dır. t = ${a} ile t = ${b} dk arasında depodaki net su değişimi kaç litredir?`, `Water flows into a tank at rate r(t) = ${polyT(q, 2 * p)} litres/min. What is the net change in the amount of water between t = ${a} and t = ${b} min?`);
    const plot = mkPlot(Math.min(a, 0) - 0.5, b + 1, [v], [a, b]);
    const q1 = mk(T.net(), text, String(ans),
      [[String(v(b) - v(a)), tx('Hız (hız fonksiyonu) farkını almışsın; net değişim hızın integralidir.', 'You took the difference of the rate values; net change is the integral of the rate.')],
        [String(p * b * b + q * b), tx('Yalnızca F(b)\'yi hesaplamışsın; F(a) çıkarılmalıydı.', 'You computed only F(b); F(a) must be subtracted.')],
        [String(v(b)), tx('Sürenin sonundaki anlık hızı vermişsin.', 'You gave the instantaneous rate at the end time.')],
        [String(-ans), tx('F(b) − F(a) yerine ters sırayla çıkarmışsın.', 'You subtracted in the wrong order.')]],
      [tx('Net değişim = ∫ hız dt', 'Net change = ∫ rate dt'), `F(t) = ${polyT(0, q, p)}`, `F(${b}) - F(${a}) = ${ans}`], rng, plot);
    return chk(q1, { t: 'int', f: v, a, b });
  }

  function areaCap(rng) {
    const k = rng.nextInt(1, 5), f = (x) => k * k - x * x;
    const plot = mkPlot(-k - 1, k + 1, [f], [-k, k]);
    const q1 = mk(T.area(), tx(`y = ${k * k} − x² parabolü ile x-ekseni arasında kalan bölgenin alanı kaçtır?`, `What is the area of the region between the parabola y = ${k * k} − x² and the x-axis?`), frac(4 * k * k * k, 3),
      [[frac(2 * k * k * k, 3), tx('Yalnızca x = 0 ile x = ' + k + ' arasındaki yarım bölgeyi hesaplamışsın.', 'You computed only the half from x = 0 to x = ' + k + '.')],
        [String(2 * k * k * k), tx('x³/3 terimindeki 3\'e bölmeyi unutmuşsun.', 'You forgot to divide the x³ term by 3.')],
        [frac(8 * k * k * k, 3), tx('Sınırları -k ve k alıp yarım alanı iki kez saymışsın.', 'You double-counted the symmetric half.')],
        [frac(k * k * k, 3), tx('Sabit terimin integralini (2k·k²) atlayıp yalnızca x³/3\'ü hesaplamışsın.', 'You skipped the constant term\'s integral and kept only the x³/3 part.')]],
      [tx(`Kesişimler: ${k * k} − x² = 0 → x = ±${k}`, `Intersections: ${k * k} − x² = 0 → x = ±${k}`), `∫ (${k * k} - x²) dx = ${k * k}x - x³/3`,
        `[${k * k}·${k} - ${k}³/3] - [${k * k}·(-${k}) - (-${k})³/3] = ${frac(4 * k * k * k, 3)}`], rng, plot);
    return chk(q1, { t: 'area2', f, g: () => 0, a: -k, b: k });
  }

  function ftcLn(rng) {
    const c = rng.nextInt(2, 6);
    if (rng.nextInt(0, 2) === 0) {
      const b = rng.nextInt(2, 7);
      const q1 = mk(T.lnexp(), tx(`${I(1, b)} (${c}/x) dx integrali kaçtır?`, `What is ${I(1, b)} (${c}/x) dx?`), `${c} ln ${b}`,
        [[`ln ${b}`, tx('Sabit çarpan ' + c + '\'yı unutmuşsun.', 'You dropped the constant multiple ' + c + '.')],
          [String(c * (b - 1)), tx('1/x\'i x gibi integre etmişsin; ters türev ln|x|\'tir.', 'You integrated 1/x as if it were 1; the antiderivative is ln|x|.')],
          [`${c} ln ${b} - ${c}`, tx('ln 1 = 0 iken ' + c + ' çıkarmışsın.', 'You subtracted ' + c + ' although ln 1 = 0.')],
          [`ln ${c * b}`, tx('Çarpanı logaritmanın içine ' + c + '·' + b + ' diye koymuşsun; doğrusu ln(' + b + '^' + c + ').', 'You put the factor inside as ln(' + c + '·' + b + '); the correct form is ln(' + b + '^' + c + ').')]],
        [`F(x) = ${c} ln|x|`, `F(${b}) - F(1) = ${c} ln ${b} - ${c} ln 1`, `= ${c} ln ${b}`], rng);
      return chk(q1, { t: 'int', f: (x) => c / x, a: 1, b });
    }
    const m = rng.nextInt(2, 5), ans = c * m;
    const q1 = mk(T.lnexp(), tx(`${I(1, ex(m))} (${c}/x) dx integrali kaçtır?`, `What is ${I(1, ex(m))} (${c}/x) dx?`), String(ans),
      [[String(c), tx('ln(e^m) = m olduğunu unutmuşsun (m yerine 1 almışsın).', 'You forgot that ln(e^m) = m (you used 1 for m).')],
        [`${c}(${ex(m)} - 1)`, tx('1/x\'i x gibi integre etmişsin.', 'You integrated 1/x as if it were 1.')],
        [String(m), tx('Sabit çarpan ' + c + '\'yı unutmuşsun.', 'You dropped the constant multiple ' + c + '.')]],
      [`F(x) = ${c} ln|x|`, `${c} ln(${ex(m)}) - ${c} ln 1 = ${c}·${m} - 0`, `= ${ans}`], rng);
    return chk(q1, { t: 'int', f: (x) => c / x, a: 1, b: Math.exp(m) });
  }

  function antiMixed(rng) {
    const a = rng.nextInt(1, 5), b = nz(rng, -4, 4), c = nz(rng, -5, 5);
    const q1 = mk(T.anti(), tx(`∫ (${sumT([[a, 'eˣ'], [b, 'sin x', 1], [c, '']])}) dx = ?`, `∫ (${sumT([[a, 'eˣ'], [b, 'sin x', 1], [c, '']])}) dx = ?`), `${sumT([[a, 'eˣ'], [-b, 'cos x', 1], [c, 'x']])} + C`,
      [[`${sumT([[a, 'eˣ'], [b, 'cos x', 1], [c, 'x']])} + C`, tx('sin x\'in ters türevi −cos x\'tir; eksi işaretini unutmuşsun.', 'The antiderivative of sin x is −cos x; you lost the minus sign.')],
        [`${sumT([[a, 'eˣ'], [b, 'sin x', 1], [c, 'x']])} + C`, tx('sin x terimini olduğu gibi bırakmışsın; integre etmelisin.', 'You left the sin x term unchanged; it must be integrated.')],
        [sumT([[a, 'eˣ'], [-b, 'cos x', 1], [c, 'x']]), tx('Sonuna + C eklemeyi unuttun.', 'You forgot the + C.')],
        [`${sumT([[a, 'eˣ'], [-b, 'cos x', 1], [c, '']])} + C`, tx('Sabit terimin integrali c·x olmalıydı; x çarpanını unutmuşsun.', 'The constant term integrates to c·x; you forgot the factor x.')]],
      [tx('Terim terim integre et', 'Integrate term by term'), 'eˣ → eˣ,   sin x → −cos x,   sabit → sabit·x'.replace('sabit', 'c').replace('sabit', 'c'),
        `${sumT([[a, 'eˣ'], [-b, 'cos x', 1], [c, 'x']])} + C`], rng);
    return chk(q1, { t: 'anti', f: (x) => a * Math.exp(x) + b * Math.sin(x) + c });
  }

  function antiIVP(rng) {
    const p = nz(rng, -3, 3), q = rng.nextInt(-4, 5), a = rng.nextInt(0, 3), b = a + rng.nextInt(1, 4), r = rng.nextInt(-5, 6);
    const ans = r + p * (b * b - a * a) + q * (b - a);
    const Fb = p * b * b + q * b;
    const q1 = mk(T.anti(), tx(`F'(x) = ${polyStr(q, 2 * p)} ve F(${a}) = ${r} ise F(${b}) kaçtır?`, `If F'(x) = ${polyStr(q, 2 * p)} and F(${a}) = ${r}, what is F(${b})?`), String(ans),
      [[String(Fb), tx('Başlangıç koşulunu kullanıp C\'yi bulmamışsın (C = 0 almışsın).', 'You did not use the initial condition to find C (you took C = 0).')],
        [String(Fb + r), tx('F(a) = ' + r + ' değerini C yerine koymuşsun; C = F(a) − (p a² + q a) olmalıydı.', 'You used F(a) = ' + r + ' directly as C; C must be F(a) minus the antiderivative at a.')],
        [String(ans - 2 * r), tx('Başlangıç değerini çıkarmışsın; eklenmeliydi.', 'You subtracted the initial value; it must be added.')]],
      [`F(x) = ${polyStr(0, q, p)} + C`, `F(${a}) = ${p * a * a + q * a} + C = ${r}  →  C = ${r - p * a * a - q * a}`, `F(${b}) = ${Fb} + (${r - p * a * a - q * a}) = ${ans}`], rng);
    return chk(q1, { t: 'int', f: (x) => 2 * p * x + q, a, b, plus: r });
  }

  // =====================================================================================================
  // Level 3
  // =====================================================================================================

  function inBetween(rng) {
    const a = rng.nextInt(2, 7);
    const f1 = (x) => a * x, f2 = (x) => x * x;
    const plot = mkPlot(-1, a + 1, [f1, f2]);
    const q1 = mk(T.btw(), tx(`y = ${a}x doğrusu ile y = x² eğrisi arasında kalan bölgenin alanı kaçtır?`, `What is the area of the region between the line y = ${a}x and the curve y = x²?`), frac(a * a * a, 6),
      [[frac(a * a * a, 3), tx('Yalnızca parabolün altındaki alanı hesapladın.', 'You computed only the area under the parabola.')],
        [frac(a * a, 2), tx('Doğruyu ax yerine x olarak integre ettin (eğim a eksik).', 'You integrated the line as x instead of ax (the slope a is missing).')],
        [frac(a * a * a, 2), tx('Yalnızca doğrunun altındaki alanı buldun; parabolü çıkarmadın.', 'You found only the area under the line and did not subtract the parabola.')],
        [frac(a * a * a, 4), tx('Fark alırken hesap hatası yaptın.', 'An arithmetic slip when taking the difference.')]],
      [tx(`Kesişim: x² = ${a}x  →  x = 0 ve x = ${a}`, `Intersection: x² = ${a}x  →  x = 0 and x = ${a}`), `Alan = ∫₀^${a} (${a}x - x²) dx = ${a}·${a}²/2 - ${a}³/3`.replace('Alan', tx('Alan', 'Area')), `= ${frac(a * a * a, 6)}`], rng, plot);
    return chk(q1, { t: 'area2', f: f1, g: f2, a: 0, b: a });
  }

  function ftc1Chain(rng) {
    const c = nz(rng, -4, 4);
    const G = rng.pick([
      { s: 'x²', g: (x) => x * x, d: (x) => 2 * x, xs: [1, 2] },
      { s: '2x + 1', g: (x) => 2 * x + 1, d: () => 2, xs: [1, 2] },
      { s: '3x − 1', g: (x) => 3 * x - 1, d: () => 3, xs: [1, 2] },
      { s: 'x³', g: (x) => x * x * x, d: (x) => 3 * x * x, xs: [1] },
    ]);
    const x0 = rng.pick(G.xs), f = (t) => t * t + c, ans = f(G.g(x0)) * G.d(x0);
    const q1 = mk(T.ftc1(), tx(`F(x) = ∫_0^{${G.s}} (${polyT(c, 0, 1)}) dt ise F'(${x0}) kaçtır?`, `If F(x) = ∫_0^{${G.s}} (${polyT(c, 0, 1)}) dt, what is F'(${x0})?`), String(ans),
      [[String(f(G.g(x0))), tx('Zincir kuralındaki iç fonksiyonun türevini (g\'(x)) çarpmayı unutmuşsun.', 'You forgot to multiply by the derivative of the inner function g\'(x) from the chain rule.')],
        [String(f(x0) * G.d(x0)), tx('Üst sınır g(x) yerine x yerine koymuşsun; integrand g(x)\'te hesaplanmalı.', 'You plugged in x instead of the upper limit g(x); the integrand must be evaluated at g(x).')],
        [String(2 * G.g(x0) * G.d(x0)), tx('KTT yerine integrandı türevlemişsin.', 'You differentiated the integrand instead of using the FTC.')],
        [String(f(G.g(x0)) * G.g(x0)), tx('g\'(x) yerine g(x) ile çarpmışsın.', 'You multiplied by g(x) instead of g\'(x).')]],
      [tx('KTT + zincir kuralı: d/dx ∫₀^{g(x)} f(t) dt = f(g(x))·g\'(x)', 'FTC + chain rule: d/dx ∫₀^{g(x)} f(t) dt = f(g(x))·g\'(x)'),
        `g(${x0}) = ${G.g(x0)},  g'(${x0}) = ${G.d(x0)},  f(${G.g(x0)}) = ${f(G.g(x0))}`, `F'(${x0}) = ${f(G.g(x0))}·${G.d(x0)} = ${ans}`], rng);
    return chk(q1, { t: 'ftc1', f, lo: () => 0, hi: G.g, x0 });
  }

  function ftc1Both(rng) {
    const c = nz(rng, -4, 4), f = (t) => t + c;
    if (rng.nextInt(0, 2) === 0) {
      const x0 = rng.nextInt(1, 3), ans = -f(x0 * x0) * 2 * x0, up = rng.nextInt(3, 7);
      const q1 = mk(T.ftc1(), tx(`F(x) = ∫_{x²}^{${up}} (t ${plus(c)}) dt ise F'(${x0}) kaçtır?`, `If F(x) = ∫_{x²}^{${up}} (t ${plus(c)}) dt, what is F'(${x0})?`), String(ans),
        [[String(f(x0 * x0) * 2 * x0), tx('Değişken alt sınır olduğu için işaret eksi olmalı: alt sınır ters çevrilince −.', 'The variable limit is the lower one, so a minus sign appears (swap the limits).')],
          [String(-f(x0 * x0)), tx('İç fonksiyonun türevi 2x çarpanını unutmuşsun.', 'You forgot the chain-rule factor 2x.')],
          [String(-f(x0) * 2 * x0), tx('İntegrandı x² yerine x\'te hesaplamışsın.', 'You evaluated the integrand at x instead of at x².')],
          [String(f(up) - f(x0 * x0)), tx('Üst sınırın sabit olduğunu dikkate almamışsın; sabit sınır türevde görünmez.', 'The upper limit is constant and contributes nothing to the derivative.')]],
        [tx('d/dx ∫_{g(x)}^{b} f(t) dt = −f(g(x))·g\'(x)', 'd/dx ∫_{g(x)}^{b} f(t) dt = −f(g(x))·g\'(x)'), `g = x²,  g' = 2x`, `F'(${x0}) = -f(${x0 * x0})·${2 * x0} = ${ans}`], rng);
      return chk(q1, { t: 'ftc1', f, lo: (x) => x * x, hi: () => up, x0 });
    }
    const x0 = rng.nextInt(2, 4), ans = f(x0 * x0) * 2 * x0 - f(x0);
    const q1 = mk(T.ftc1(), tx(`F(x) = ∫_x^{x²} (t ${plus(c)}) dt ise F'(${x0}) kaçtır?`, `If F(x) = ∫_x^{x²} (t ${plus(c)}) dt, what is F'(${x0})?`), String(ans),
      [[String(f(x0 * x0) * 2 * x0), tx('Alt sınırın katkısı −f(x)\'i unutmuşsun.', 'You forgot the lower limit\'s contribution −f(x).')],
        [String(f(x0 * x0) * 2 * x0 + f(x0)), tx('Alt sınırın katkısını eksi yerine artı almışsın.', 'You added the lower limit\'s contribution instead of subtracting it.')],
        [String(f(x0 * x0) - f(x0)), tx('Üst sınırın türevi 2x çarpanını unutmuşsun.', 'You forgot the chain-rule factor 2x for the upper limit.')],
        [String(-f(x0) + 2 * x0), tx('Üst sınır terimini yanlış hesaplamışsın.', 'You miscomputed the upper-limit term.')]],
      [tx('F\'(x) = f(üst)·üst\' − f(alt)·alt\'', 'F\'(x) = f(upper)·upper\' − f(lower)·lower\''), `F'(x) = f(x²)·2x - f(x)·1`, `F'(${x0}) = f(${x0 * x0})·${2 * x0} - f(${x0}) = ${ans}`], rng);
    return chk(q1, { t: 'ftc1', f, lo: (x) => x, hi: (x) => x * x, x0 });
  }

  function totalDistance(rng) {
    const [a, b] = rng.pick([[1, 3], [2, 4], [1, 5], [3, 5], [2, 6]]);
    const T2 = b + rng.nextInt(1, 3);
    const v = (t) => 3 * (t - a) * (t - b);
    const F = (t) => t * t * t - 1.5 * (a + b) * t * t + 3 * a * b * t;
    const A = F(a) - F(0), B = F(b) - F(a), C = F(T2) - F(b);
    const ans = Math.abs(A) + Math.abs(B) + Math.abs(C), disp = A + B + C;
    const plot = mkPlot(-0.5, T2 + 0.5, [v]);
    const q1 = mk(T.net(), tx(`Bir parçacığın hızı v(t) = ${polyT(3 * a * b, -3 * (a + b), 3)} m/s'dir. t = 0 ile t = ${T2} s arasında aldığı TOPLAM yol kaç metredir?`,
      `A particle has velocity v(t) = ${polyT(3 * a * b, -3 * (a + b), 3)} m/s. What is the TOTAL distance it travels from t = 0 to t = ${T2} s?`), String(ans),
      [[String(disp), tx('Net yer değiştirmeyi (işaretli integral) vermişsin; toplam yol için hızın işaret değiştirdiği yerlerde parçalara bölünüp mutlak değerler toplanmalı.', 'You gave the net displacement (signed integral); for total distance split at the sign changes and add absolute values.')],
        [String(Math.abs(disp)), tx('Net yer değiştirmenin mutlak değerini vermişsin; parçaların mutlak değerleri ayrı ayrı toplanmalı.', 'You gave the absolute value of the net displacement; take absolute values piece by piece.')],
        [String(Math.abs(A) + Math.abs(B)), tx('Son parçayı (t = ' + b + ' sonrası) unutmuşsun.', 'You left out the last piece (after t = ' + b + ').')],
        [String(Math.abs(A) + Math.abs(C) - Math.abs(B)), tx('Hızın negatif olduğu parçayı çıkarmışsın; yolda mutlak değer eklenmeli.', 'You subtracted the part where v < 0; for distance its absolute value is added.')]],
      [tx(`v(t) = 3(t − ${a})(t − ${b}) → işaret değişimi t = ${a} ve t = ${b}`, `v(t) = 3(t − ${a})(t − ${b}) → sign changes at t = ${a} and t = ${b}`),
        `F(t) = t³ - ${1.5 * (a + b)}t² + ${3 * a * b}t`.replace(/- 0t/, ''),
        tx(`Parçalar: ${A}, ${B}, ${C}`, `Pieces: ${A}, ${B}, ${C}`), tx(`Toplam yol = |${A}| + |${B}| + |${C}| = ${ans}`, `Total distance = |${A}| + |${B}| + |${C}| = ${ans}`)], rng, plot);
    return chk(q1, { t: 'tdist', f: v, a: 0, b: T2 });
  }

  function posIVP(rng) {
    const p = nz(rng, -2, 2), q = nz(rng, -3, 3), v0 = rng.nextInt(-3, 5), s0 = rng.nextInt(-4, 5), T0 = rng.nextInt(1, 4);
    const acc = (t) => 6 * p * t + 2 * q;
    const s = (t) => p * t * t * t + q * t * t + v0 * t + s0;
    const ans = s(T0);
    const q1 = mk(T.net(), tx(`Bir parçacığın ivmesi a(t) = ${polyT(2 * q, 6 * p)} m/s², v(0) = ${v0} m/s ve konumu s(0) = ${s0} m'dir. s(${T0}) kaç metredir?`,
      `A particle has acceleration a(t) = ${polyT(2 * q, 6 * p)} m/s², v(0) = ${v0} m/s and position s(0) = ${s0} m. What is s(${T0}) in metres?`), String(ans),
      [[String(3 * p * T0 * T0 + 2 * q * T0 + v0), tx('v(' + T0 + ') değerini vermişsin; konum için bir kez daha integre etmelisin.', 'You gave v(' + T0 + '); position needs one more integration.')],
        [String(ans - s0), tx('s(0) başlangıç konumunu eklemeyi unutmuşsun.', 'You forgot to add the initial position s(0).')],
        [String(p * T0 ** 3 + q * T0 * T0 + s0), tx('v(0) başlangıç hızından gelen v₀·t terimini unutmuşsun.', 'You forgot the v₀·t term from the initial velocity.')],
        [String(p * T0 ** 3 + q * T0 * T0 + v0 + s0), tx('v₀ terimini t ile çarpmayı unutmuşsun.', 'You forgot to multiply the v₀ term by t.')]],
      [`v(t) = ∫ a dt = ${polyT(v0, 2 * q, 3 * p)}`, `s(t) = ∫ v dt = ${polyT(s0, v0, q, p)}`, `s(${T0}) = ${ans}`], rng);
    return chk(q1, { t: 'dbl', acc, v0, s0, T: T0 });
  }

  function uSubDef1(rng) {
    const n = rng.nextInt(2, 4), c = rng.nextInt(1, 4), b = rng.nextInt(1, 3);
    const Ub = b * b + c, Ua = c, num = Math.pow(Ub, n + 1) - Math.pow(Ua, n + 1);
    const q1 = mk(T.sub(), tx(`${I(0, b)} 2x(x² + ${c})${sup(n)} dx integrali kaçtır?`, `What is ${I(0, b)} 2x(x² + ${c})${sup(n)} dx?`), frac(num, n + 1),
      [[frac(Math.pow(Ub, n + 1), n + 1), tx('Alt sınırı (u = ' + c + ') yerine koymayı unutmuşsun.', 'You forgot to subtract the lower-limit value (u = ' + c + ').')],
        [String(num), tx((n + 1) + '\'e bölmeyi unutmuşsun.', 'You forgot to divide by ' + (n + 1) + '.')],
        [frac(Math.pow(b + c, n + 1) - Math.pow(c, n + 1), n + 1), tx('u = x² + ' + c + ' dönüşümünde üst sınırı b = ' + b + ' yerine b² + ' + c + ' almalıydın.', 'With u = x² + ' + c + ', the upper limit is b² + ' + c + ', not b + ' + c + '.')],
        [frac(num, n), tx('Yeni üs n + 1 = ' + (n + 1) + ' yerine eski üs n = ' + n + '\'e bölmüşsün.', 'You divided by the old exponent n = ' + n + ' instead of n + 1 = ' + (n + 1) + '.')]],
      [tx(`u = x² + ${c}, du = 2x dx`, `u = x² + ${c}, du = 2x dx`), tx(`Sınırlar: x = 0 → u = ${Ua};  x = ${b} → u = ${Ub}`, `Limits: x = 0 → u = ${Ua};  x = ${b} → u = ${Ub}`),
        `∫ u${sup(n)} du = u${sup(n + 1)}/${n + 1}`, `(${Ub}${sup(n + 1)} - ${Ua}${sup(n + 1)})/${n + 1} = ${frac(num, n + 1)}`], rng);
    return chk(q1, { t: 'int', f: (x) => 2 * x * Math.pow(x * x + c, n), a: 0, b });
  }

  function uSubDef2(rng) {
    const n = rng.nextInt(2, 5), v = rng.nextInt(0, 3);
    const wr = () => [[frac(-1, n + 1), tx('du = −sin x dx işaretini hesaba katmayıp sınırları çevirmemişsin; işaret hatası.', 'You ignored the sign of the substitution and did not handle the limits consistently; sign error.')],
      [frac(1, n), tx('Yeni üs n + 1 yerine n\'e bölmüşsün.', 'You divided by n instead of n + 1.')],
      ['0', tx('Alt ve üst sınır değerlerini aynı sanmışsın (sin 0 = cos π/2 = 0 diye).', 'You thought the endpoint values cancel because sin 0 = cos π/2 = 0.')],
      [frac(1, n + 2), tx('Üssü iki kez artırmışsın.', 'You raised the exponent twice.')]];
    if (v === 0) {
      const q1 = mk(T.sub(), tx(`${I(0, 'π/2')} sin x cos${sup(n)} x dx integrali kaçtır?`, `What is ${I(0, 'π/2')} sin x cos${sup(n)} x dx?`), frac(1, n + 1), wr(),
        [tx('u = cos x, du = −sin x dx', 'u = cos x, du = −sin x dx'), tx('Sınırlar: x = 0 → u = 1;  x = π/2 → u = 0', 'Limits: x = 0 → u = 1;  x = π/2 → u = 0'), `-∫₁⁰ ... = ∫₀¹ u${sup(n)} du = 1/${n + 1}`.replace('-∫₁⁰ ... ', '−∫₁⁰ uⁿ du '), `= ${frac(1, n + 1)}`], rng);
      return chk(q1, { t: 'int', f: (x) => Math.sin(x) * Math.pow(Math.cos(x), n), a: 0, b: Math.PI / 2 });
    }
    if (v === 1) {
      const q1 = mk(T.sub(), tx(`${I(0, 'π/2')} cos x sin${sup(n)} x dx integrali kaçtır?`, `What is ${I(0, 'π/2')} cos x sin${sup(n)} x dx?`), frac(1, n + 1), wr(),
        [tx('u = sin x, du = cos x dx', 'u = sin x, du = cos x dx'), tx('Sınırlar: x = 0 → u = 0;  x = π/2 → u = 1', 'Limits: x = 0 → u = 0;  x = π/2 → u = 1'), `∫₀¹ u${sup(n)} du = 1/${n + 1}`], rng);
      return chk(q1, { t: 'int', f: (x) => Math.cos(x) * Math.pow(Math.sin(x), n), a: 0, b: Math.PI / 2 });
    }
    const q1 = mk(T.sub(), tx(`${I(1, 'e')} (ln x)${sup(n)} / x dx integrali kaçtır?`, `What is ${I(1, 'e')} (ln x)${sup(n)} / x dx?`), frac(1, n + 1), wr(),
      [tx('u = ln x, du = dx/x', 'u = ln x, du = dx/x'), tx('Sınırlar: x = 1 → u = 0;  x = e → u = 1', 'Limits: x = 1 → u = 0;  x = e → u = 1'), `∫₀¹ u${sup(n)} du = 1/${n + 1}`], rng);
    return chk(q1, { t: 'int', f: (x) => Math.pow(Math.log(x), n) / x, a: 1, b: Math.E });
  }

  function uSubExp(rng) {
    const v = rng.nextInt(0, 3), b = rng.nextInt(1, 3);
    if (v === 2) {
      const q1 = mk(T.sub(), tx(`${I(0, 1)} x e^(x²) dx integrali kaçtır?`, `What is ${I(0, 1)} x e^(x²) dx?`), '(e - 1)/2',
        [['e - 1', tx('du = 2x dx olduğundan x dx = du/2; 1/2 çarpanını unutmuşsun.', 'Since du = 2x dx, x dx = du/2; you forgot the factor 1/2.')],
          ['e/2', tx('Alt sınırdan gelen −F(0) = −1/2 terimini unutmuşsun.', 'You forgot the −F(0) = −1/2 from the lower limit.')],
          ['(e + 1)/2', tx('Alt sınır değerini çıkarmak yerine eklemişsin.', 'You added the lower-limit value instead of subtracting it.')],
          ['2(e - 1)', tx('1/2 yerine 2 ile çarpmışsın.', 'You multiplied by 2 instead of 1/2.')]],
        [tx('u = x², du = 2x dx → x dx = du/2', 'u = x², du = 2x dx → x dx = du/2'), tx('Sınırlar: 0 → 0,  1 → 1', 'Limits: 0 → 0,  1 → 1'), '½∫₀¹ eᵘ du = ½(e - 1)'], rng);
      return chk(q1, { t: 'int', f: (x) => x * Math.exp(x * x), a: 0, b: 1 });
    }
    const k = v === 0 ? 2 : 3, m = v === 0 ? b * b : b * b * b;
    const integrand = v === 0 ? '2x' : '3x²', inner = v === 0 ? 'x²' : 'x³';
    const q1 = mk(T.sub(), tx(`${I(0, b)} ${integrand} e^(${inner}) dx integrali kaçtır?`, `What is ${I(0, b)} ${integrand} e^(${inner}) dx?`), `${ex(m)} - 1`,
      [[ex(m), tx('Alt sınırdan gelen −F(0) = −1 terimini unutmuşsun.', 'You forgot the −F(0) = −1 from the lower limit.')],
        [`${ex(m)} + 1`, tx('Alt sınır değerini çıkarmak yerine eklemişsin.', 'You added the lower-limit value instead of subtracting it.')],
        [`${k}(${ex(m)} - 1)`, tx('du = ' + integrand + ' dx çarpanını ikinci kez eklemişsin.', 'You included the factor from du = ' + integrand + ' dx a second time.')],
        [`(${ex(m)} - 1)/${k}`, tx('Zaten du = ' + integrand + ' dx olduğundan ' + k + '\'ya bölmek gerekmez.', 'The factor ' + integrand + ' is exactly du, so there is nothing to divide by ' + k + '.')]],
      [`u = ${inner}, du = ${integrand} dx`, tx(`Sınırlar: 0 → 0,  ${b} → ${m}`, `Limits: 0 → 0,  ${b} → ${m}`), `∫₀^${m} eᵘ du = ${ex(m)} - 1`], rng);
    return chk(q1, { t: 'int', f: (x) => (v === 0 ? 2 * x : 3 * x * x) * Math.exp(v === 0 ? x * x : x * x * x), a: 0, b });
  }

  function uSubLn(rng) {
    const v = rng.nextInt(0, 2), b = rng.nextInt(1, v === 0 ? 4 : 3);
    const U = v === 0 ? b * b + 1 : b * b * b + 1;
    const num = v === 0 ? '2x' : '3x²', den = v === 0 ? 'x² + 1' : 'x³ + 1', k = v === 0 ? 2 : 3;
    const q1 = mk(T.sub(), tx(`${I(0, b)} ${num}/(${den}) dx integrali kaçtır?`, `What is ${I(0, b)} ${num}/(${den}) dx?`), `ln ${U}`,
      [[`ln ${U - 1}`, tx('Sınırı u = b^' + (v === 0 ? 2 : 3) + ' + 1 yerine b^' + (v === 0 ? 2 : 3) + ' almışsın.', 'You used u = b^' + (v === 0 ? 2 : 3) + ' instead of b^' + (v === 0 ? 2 : 3) + ' + 1 for the upper limit.')],
        [`${k} ln ${U}`, tx('Payı ikinci kez çarpan olarak eklemişsin; ' + num + ' dx zaten du\'dur.', 'You included the numerator factor again; ' + num + ' dx is exactly du.')],
        [`ln ${U}/${k}`, tx('Payı du = ' + num + ' dx için bölmüşsün; bölme gerekmez.', 'You divided by ' + k + ' although the numerator is exactly du.')],
        [String(U - 1), tx('Logaritma almayı unutmuşsun; ∫ du/u = ln|u|.', 'You forgot the logarithm; ∫ du/u = ln|u|.')]],
      [`u = ${den}, du = ${num} dx`, tx(`Sınırlar: 0 → 1,  ${b} → ${U}`, `Limits: 0 → 1,  ${b} → ${U}`), `∫₁^${U} du/u = ln ${U} - ln 1 = ln ${U}`], rng);
    return chk(q1, { t: 'int', f: (x) => (v === 0 ? 2 * x / (x * x + 1) : 3 * x * x / (x * x * x + 1)), a: 0, b });
  }

  function areaIntersect(rng) {
    const p = rng.nextInt(-2, 2), q = p + rng.nextInt(1, 5), d = q - p;
    const f = (x) => x * x, g = (x) => (p + q) * x - p * q;
    const plot = mkPlot(p - 1, q + 1, [f, g]);
    const q1 = mk(T.btw(), tx(`y = x² eğrisi ile y = ${polyStr(-p * q, p + q)} doğrusu arasında kalan bölgenin alanı kaçtır?`, `What is the area of the region between y = x² and the line y = ${polyStr(-p * q, p + q)}?`), frac(d * d * d, 6),
      [[frac(d * d * d, 3), tx('Yarım değeri kullanmışsın: ∫ (üst − alt) hesabında 1/2 faktörü gerekir.', 'The factor ½ is missing in the (upper − lower) integral.')],
        [frac(d * d, 2), tx('Kübik terimi unutup ikinci dereceden bir ifade yazmışsın.', 'You wrote a quadratic expression instead of the cubic result.')],
        [frac(q * q * q - p * p * p, 3), tx('Yalnızca parabolün altındaki alanı hesaplamışsın.', 'You computed only the area under the parabola.')],
        [frac(d * d * d, 2), tx('3 yerine 2 ile bölmüşsün (x³ terimi için 3).', 'You divided by 2 instead of 3 for the cubic term.')],
        [frac(d * d * d, 12), tx('Fazladan 1/2 çarpanı eklemişsin.', 'You added an extra factor of ½.')]],
      [tx(`Kesişim: x² = ${polyStr(-p * q, p + q)} → x = ${p} ve x = ${q}`, `Intersections: x² = ${polyStr(-p * q, p + q)} → x = ${p} and x = ${q}`),
        tx(`Doğru parabolün üstünde: Alan = ∫_${p}^${q} (${polyStr(-p * q, p + q, -1)}) dx`, `The line is above the parabola: Area = ∫_${p}^${q} (${polyStr(-p * q, p + q, -1)}) dx`),
        tx(`Alan = (${q} − ${p})³/6 = ${frac(d * d * d, 6)}`, `Area = (${q} − ${p})³/6 = ${frac(d * d * d, 6)}`)], rng, plot);
    return chk(q1, { t: 'area2', f: g, g: f, a: p, b: q });
  }

  function areaCross(rng) {
    const m = rng.nextInt(1, 4), f = (x) => x * x * x, g = (x) => m * m * x;
    const plot = mkPlot(-m - 1, m + 1, [f, g]);
    const m4 = m * m * m * m;
    const q1 = mk(T.btw(), tx(`y = x³ ve y = ${cf(m * m)}x eğrilerinin çevrelediği bölgenin TOPLAM alanı kaçtır? (Eğriler x = −${m}, 0, ${m} noktalarında kesişir.)`, `What is the TOTAL area enclosed by y = x³ and y = ${cf(m * m)}x? (They intersect at x = −${m}, 0, ${m}.)`), frac(m4, 2),
      [['0', tx('∫_{-' + m + '}^{' + m + '} (üst − alt) dx işaretli hesapladığında tek fonksiyon olduğu için 0 çıkar; iki parçanın alanı ayrı ayrı pozitif alınmalı.', 'The signed integral over [−' + m + ', ' + m + '] vanishes (odd function); each lobe must be counted as positive.')],
        [frac(m4, 4), tx('Yalnızca iki parçadan birini hesaplamışsın.', 'You computed only one of the two lobes.')],
        [String(m4), tx('Bir parçanın alanını iki katına çıkarıp bir kez daha iki ile çarpmışsın.', 'You doubled an already doubled area.')],
        [frac(m4, 3), tx('Payda hesabında 2 yerine 3 kullanmışsın.', 'You used 3 instead of 2 in the denominator.')]],
      [tx(`x³ = ${cf(m * m)}x → x = −${m}, 0, ${m}`, `x³ = ${cf(m * m)}x → x = −${m}, 0, ${m}`),
        tx(`Simetri: Alan = 2∫₀^${m} (${cf(m * m)}x − x³) dx`, `Symmetry: Area = 2∫₀^${m} (${cf(m * m)}x − x³) dx`),
        `= 2[${m * m}·${m}²/2 - ${m}⁴/4] = ${frac(m4, 2)}`], rng, plot);
    return chk(q1, { t: 'area2', f, g, a: -m, b: m });
  }

  function avgHard(rng) {
    const v = rng.nextInt(0, 3);
    if (v === 0) {
      const a = rng.nextInt(0, 3), b = a + rng.nextInt(2, 4), ans = a * a + a * b + b * b;
      const q1 = mk(T.avg(), tx(`f(x) = 3x² fonksiyonunun [${a}, ${b}] aralığındaki ortalama değeri kaçtır?`, `What is the average value of f(x) = 3x² on [${a}, ${b}]?`), String(ans),
        [[String(b * b * b - a * a * a), tx('(b − a) aralık uzunluğuna bölmeyi unutmuşsun (integrali vermişsin).', 'You forgot to divide by the interval length b − a (you gave the integral).')],
          [frac(3 * (a + b) * (a + b), 4), tx('Ortalama değer yerine orta noktadaki fonksiyon değerini vermişsin.', 'You gave the function value at the midpoint instead of the average value.')],
          [String(a * a + b * b), tx('Ters türev farkını (b³ − a³) yanlış bölmüşsün: (b³ − a³)/(b − a) = a² + ab + b².', 'You mis-simplified (b³ − a³)/(b − a); it equals a² + ab + b².')]],
        [`∫ 3x² dx = x³`, `Ort. = (${b}³ - ${a}³)/(${b} - ${a}) = ${b * b * b - a * a * a}/${b - a}`.replace('Ort.', tx('Ort.', 'Avg.')), `= ${ans}`], rng);
      return chk(q1, { t: 'avg', f: (x) => 3 * x * x, a, b });
    }
    if (v === 1) {
      const q1 = mk(T.avg(), tx('f(x) = sin x fonksiyonunun [0, π] aralığındaki ortalama değeri kaçtır?', 'What is the average value of f(x) = sin x on [0, π]?'), '2/π',
        [['2', tx('(b − a) = π\'ye bölmeyi unutmuşsun (integrali vermişsin).', 'You forgot to divide by b − a = π (you gave the integral).')],
          ['1/π', tx('∫ sin x dx = 1 sanmışsın; doğrusu 2.', 'You took ∫ sin x dx = 1; it is 2.')],
          ['π/2', tx('Ortalamayı ters yazmışsın: 2/π yerine π/2.', 'You inverted the result: π/2 instead of 2/π.')],
          ['1', tx('Maksimum değeri vermişsin; ortalama değer değil.', 'You gave the maximum value, not the average.')]],
        ['∫₀^π sin x dx = [-cos x]₀^π = 2', tx('Ortalama = 2/(π − 0) = 2/π', 'Average = 2/(π − 0) = 2/π')], rng);
      return chk(q1, { t: 'avg', f: Math.sin, a: 0, b: Math.PI });
    }
    const c = rng.nextInt(2, 6);
    const q1 = mk(T.avg(), tx(`f(x) = ${c}/x fonksiyonunun [1, e] aralığındaki ortalama değeri kaçtır?`, `What is the average value of f(x) = ${c}/x on [1, e]?`), `${c}/(e - 1)`,
      [[String(c), tx('∫₁^e (c/x) dx = c ln e = c; (e − 1)\'e bölmeyi unutmuşsun.', '∫₁^e (c/x) dx = c ln e = c; you forgot to divide by (e − 1).')],
        [`${c}/e`, tx('Aralık uzunluğunu e − 1 yerine e almışsın.', 'You used the length e instead of e − 1.')],
        [`${c}(e - 1)`, tx('Bölmek yerine (e − 1) ile çarpmışsın.', 'You multiplied by (e − 1) instead of dividing.')],
        [`${c}/(e + 1)`, tx('Aralık uzunluğunu e − 1 yerine e + 1 almışsın.', 'You used e + 1 instead of e − 1 for the interval length.')]],
      [`∫₁^e (${c}/x) dx = ${c} ln e - ${c} ln 1 = ${c}`, tx(`Ortalama = ${c}/(e − 1)`, `Average = ${c}/(e − 1)`)], rng);
    return chk(q1, { t: 'avg', f: (x) => c / x, a: 1, b: Math.E });
  }

  function avgMVT(rng) {
    const k = rng.nextInt(1, 4), b = 3 * k;
    const ans = k === 1 ? '√3' : `${k}√3`;
    const q1 = mk(T.avg(), tx(`f(x) = x² için [0, ${b}] aralığında f(c) = ortalama değer koşulunu sağlayan c ∈ (0, ${b}) kaçtır? (İntegraller için ortalama değer teoremi)`,
      `For f(x) = x² on [0, ${b}], find c ∈ (0, ${b}) with f(c) equal to the average value (Mean Value Theorem for integrals).`), ans,
      [[String(k), tx('c yerine c² = ' + (b * b / 3) + ' denklemini çözmeyi unutmuşsun; ortalamayı doğrudan c sanmışsın (b/3).', 'You took b/3 as c; you must solve c² = average value.')],
        [frac(b, 2), tx('Aralığın ortasını (b/2) c sanmışsın.', 'You took the midpoint b/2 as c.')],
        [String(b * b / 3), tx('Ortalama değeri (f(c)) vermişsin; c = √(ortalama) olmalı.', 'You gave the average value f(c); c is its square root.')],
        [`${b}√3`, tx('√3\'ü b ile çarpmışsın; c = b/√3 olmalıydı.', 'You multiplied √3 by b; c = b/√3.')]],
      [tx(`Ortalama = (1/${b})·${b}³/3 = ${b * b / 3}`, `Average = (1/${b})·${b}³/3 = ${b * b / 3}`), `c² = ${b * b / 3}`, `c = ${ans}`], rng);
    return chk(q1, { t: 'mvt', f: (x) => x * x, a: 0, b });
  }

  function propSym(rng) {
    const a = rng.nextInt(2, 5), m = rng.nextInt(2, 8), k = rng.nextInt(2, 4), c = nz(rng, -3, 3);
    const ans = 2 * k * m + 2 * a * c;
    const q1 = mk(T.sym(), tx(`f çift bir fonksiyon ve ${I(0, a)} f(x) dx = ${m} ise ${I(-a, a)} (${k}f(x) + x³ ${plus(c)}) dx kaçtır?`, `f is even and ${I(0, a)} f(x) dx = ${m}. What is ${I(-a, a)} (${k}f(x) + x³ ${plus(c)}) dx?`), String(ans),
      [[String(k * m + 2 * a * c), tx('f çift olduğundan ∫_{-a}^{a} f = 2∫₀ᵃ f; bu 2 çarpanını unutmuşsun.', 'Since f is even, ∫_{-a}^{a} f = 2∫₀ᵃ f; you forgot this factor 2.')],
        [String(2 * k * m), tx('Sabit terimin integralini c·(2a) unutmuşsun.', 'You forgot the constant term\'s integral c·(2a).')],
        [String(2 * k * m + a * c), tx('Sabit terim için aralık uzunluğu 2a yerine a almışsın.', 'You used length a instead of 2a for the constant term.')],
        ['0', tx('Tek fonksiyon kuralını tüm integrale uygulamışsın; yalnızca x³ terimi sıfırlanır.', 'You applied the odd-function rule to the whole integrand; only the x³ term vanishes.')]],
      [tx('f çift: ∫_{-a}^{a} f = 2∫₀ᵃ f = ' + 2 * m, 'f even: ∫_{-a}^{a} f = 2∫₀ᵃ f = ' + 2 * m), tx('x³ tek: integrali 0', 'x³ odd: its integral is 0'),
        `${k}·${2 * m} + 0 + ${c}·${2 * a} = ${ans}`], rng);
    return chk(q1, { t: 'int', f: (x) => k * (m / a) + x * x * x + c, a: -a, b: a });
  }

  function propMixed(rng) {
    const a = rng.nextInt(0, 3), b = a + rng.nextInt(2, 4), L = b - a;
    const m = rng.nextInt(2, 8), n = nz(rng, -5, 5), k = rng.nextInt(2, 5), l = rng.nextInt(1, 4), c = rng.nextInt(1, 5);
    const inner = k * m - l * n + c * L, ans = -inner;
    const q1 = mk(T.prop(), tx(`${I(a, b)} f(x) dx = ${m} ve ${I(a, b)} g(x) dx = ${n} ise ${I(b, a)} (${k}f(x) − ${l}g(x) + ${c}) dx kaçtır?`, `If ${I(a, b)} f(x) dx = ${m} and ${I(a, b)} g(x) dx = ${n}, what is ${I(b, a)} (${k}f(x) − ${l}g(x) + ${c}) dx?`), String(ans),
      [[String(inner), tx('Sınırlar ters (b → a) olduğundan sonucun işaretini değiştirmeyi unutmuşsun.', 'The limits are reversed (b → a), so the result changes sign; you forgot that.')],
        [String(-(k * m - l * n)), tx('Sabit terimin integralini c·(b − a) unutmuşsun.', 'You forgot the constant term\'s integral c·(b − a).')],
        [String(-(k * m + l * n + c * L)), tx('g teriminin eksi işaretini unutmuşsun.', 'You dropped the minus sign on the g term.')],
        [String(-(k * m - l * n + c)), tx('Sabit terim için aralık uzunluğu (b − a) ile çarpmayı unutmuşsun.', 'You forgot to multiply the constant by the interval length (b − a).')]],
      [tx('Sınırları çevir: ∫_b^a = −∫_a^b', 'Swap the limits: ∫_b^a = −∫_a^b'), `∫_${a}^${b} = ${k}·${m} - ${l}·(${n}) + ${c}·${L} = ${inner}`, `-${par0(inner)} = ${ans}`], rng);
    return chk(q1, { t: 'int', f: () => (k * m / L) - (l * n / L) + c, a: b, b: a });
  }
  const par0 = (v) => (v < 0 ? `(${v})` : String(v));

  function riemannQuad(rng) {
    const cfg = rng.pick([{ a: 0, b: 4, n: 4 }, { a: 0, b: 6, n: 3 }, { a: 0, b: 6, n: 6 }, { a: 1, b: 5, n: 4 }]);
    const w = (cfg.b - cfg.a) / cfg.n;
    let L = 0, R = 0, M4 = 0;
    for (let i = 0; i < cfg.n; i++) {
      const x0 = cfg.a + i * w, x1 = x0 + w;
      L += w * x0 * x0; R += w * x1 * x1;
      M4 += w * (2 * x0 + w) * (2 * x0 + w);
    }
    const T4 = 2 * (L + R);
    const kind = rng.pick(['left', 'right', 'mid', 'trap']);
    const vals = { left: frac(4 * L, 4), right: frac(4 * R, 4), mid: frac(M4, 4), trap: frac(T4, 4) };
    const nm = { left: tx('SOL uç', 'LEFT endpoint'), right: tx('SAĞ uç', 'RIGHT endpoint'), mid: tx('ORTA nokta', 'MIDPOINT'), trap: tx('yamuk (trapezoid)', 'trapezoid') };
    const exact = frac(cfg.b ** 3 - cfg.a ** 3, 3);
    const wrongs = ['left', 'right', 'mid', 'trap'].filter((x) => x !== kind).map((x) => [vals[x], tx(`Bu, ${nm[x]} yöntemiyle bulunan değerdir; soru ${nm[kind]} yöntemini istiyor.`, `This is the ${nm[x]} value; the question asks for the ${nm[kind]} method.`)]);
    wrongs.push([exact, tx('Riemann toplamı yerine integralin kesin değerini (b³ − a³)/3 vermişsin.', 'You gave the exact integral (b³ − a³)/3 instead of the Riemann approximation.')]);
    const q1 = mk(T.riem(), tx(`f(x) = x² için [${cfg.a}, ${cfg.b}] aralığını ${cfg.n} eşit parçaya bölerek ${nm[kind]} yaklaşımı kaçtır?`, `For f(x) = x² on [${cfg.a}, ${cfg.b}] with ${cfg.n} equal subintervals, what is the ${nm[kind]} approximation?`), vals[kind], wrongs,
      [`Δx = ${w}`, tx(`Sol = ${frac(4 * L, 4)},  Sağ = ${frac(4 * R, 4)},  Orta = ${frac(M4, 4)},  Yamuk = ${frac(T4, 4)}`, `Left = ${frac(4 * L, 4)},  Right = ${frac(4 * R, 4)},  Mid = ${frac(M4, 4)},  Trap = ${frac(T4, 4)}`), tx(`İstenen: ${vals[kind]}`, `Required: ${vals[kind]}`)], rng);
    return chk(q1, { t: 'riemann', f: (x) => x * x, a: cfg.a, b: cfg.b, n: cfg.n, kind });
  }

  function accumMax(rng) {
    const S = triShape(rng);
    const q1 = mk(T.ftc1(), tx(`Grafikte f eğrisi gösterilmiştir ve F(x) = ∫_0^x f(t) dt olsun. [0, ${S.s}] aralığında F, hangi x değerinde en büyük değerini alır?`, `The graph of f is shown and F(x) = ∫_0^x f(t) dt. At which x in [0, ${S.s}] does F attain its largest value?`), String(S.q),
      [[String(S.q / 2), tx('f\'nin en büyük olduğu noktayı seçmişsin; F\'nin maksimumu f\'nin işaret değiştirdiği yerdedir.', 'You picked where f is largest; F is maximal where f changes sign from + to −.')],
        [String(S.q + S.w / 2), tx('f\'nin en küçük olduğu noktayı seçmişsin; orada F en hızlı azalır.', 'You picked where f is smallest; there F is decreasing fastest.')],
        [String(S.s), tx('Aralığın sonunu seçmişsin; F orada eksenin altındaki alanı da içerir ve daha küçüktür.', 'You picked the right end; F there also includes the negative area and is smaller.')],
        ['0', tx('F(0) = 0; f ilk başta pozitif olduğundan F önce artar.', 'F(0) = 0; f is positive at first, so F increases afterwards.')]],
      [tx('F\'(x) = f(x)', 'F\'(x) = f(x)'), tx(`f, x = ${S.q} noktasında pozitiften negatife geçer → F orada artıştan azalışa geçer`, `f changes from positive to negative at x = ${S.q} → F switches from increasing to decreasing there`),
        tx(`En büyük değer x = ${S.q}`, `Maximum at x = ${S.q}`)], rng, S.plot);
    return chk(q1, { t: 'argmaxF', f: S.f, a: 0, b: S.s, x: S.q });
  }

  function ftcExpAdv(rng) {
    const k = rng.nextInt(2, 5), b = rng.nextInt(1, 3), m = k * b;
    const q1 = mk(T.lnexp(), tx(`${I(0, b)} e^(${k}x) dx integrali kaçtır?`, `What is ${I(0, b)} e^(${k}x) dx?`), `(${ex(m)} - 1)/${k}`,
      [[`${ex(m)} - 1`, tx('Zincir kuralının tersi için 1/' + k + ' çarpanını unutmuşsun.', 'You forgot the factor 1/' + k + ' from reversing the chain rule.')],
        [`${k}(${ex(m)} - 1)`, tx('1/' + k + ' yerine ' + k + ' ile çarpmışsın.', 'You multiplied by ' + k + ' instead of 1/' + k + '.')],
        [`${ex(m)}/${k}`, tx('Alt sınırdan gelen −F(0) = −1/' + k + ' terimini unutmuşsun.', 'You forgot the −F(0) = −1/' + k + ' from the lower limit.')],
        [`(${ex(m)} + 1)/${k}`, tx('Alt sınır değerini çıkarmak yerine eklemişsin.', 'You added the lower-limit value instead of subtracting it.')]],
      [`F(x) = e^(${k}x)/${k}`, `F(${b}) - F(0) = ${ex(m)}/${k} - 1/${k}`, `= (${ex(m)} - 1)/${k}`], rng);
    return chk(q1, { t: 'int', f: (x) => Math.exp(k * x), a: 0, b });
  }

  // ----------------------------------------------------------------------------------------------------
  const lv = (n, fs) => fs.forEach((f) => { f.level = n; });
  lv(1, [inAnti, geoArea, antiPower, antiBasic, inDefSquare, inRiemann, propConst, propReverse, inLn, inFtc, inDefPoly]);
  lv(2, [inAverage, inOdd, inTrig, inSub, propAdd, ftcPoly, ftcExp, ftcTrig, ftc1Value, riemannLR, riemannMid, riemannTrap, overUnder,
    signedAreaGraph, totalAreaGraph, netChange, areaCap, ftcLn, antiMixed, antiIVP]);
  lv(3, [inBetween, ftc1Chain, ftc1Both, totalDistance, posIVP, uSubDef1, uSubDef2, uSubExp, uSubLn, areaIntersect, areaCross, avgHard, avgMVT,
    propSym, propMixed, riemannQuad, accumMax, ftcExpAdv]);

  // One generator per topic (the normal 10-question quiz)
  const GENERATORS = [inAnti, inDefPoly, inDefSquare, signedAreaGraph, inRiemann, overUnder, propAdd, inFtc, netChange, inAverage, inBetween, inSub, inOdd, inTrig, inLn];

  Topics.register('integrals', {
    type: 'quiz',
    tabTitle: () => I18N.tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  const EXTRA = [
    geoArea, antiPower, antiBasic, propConst, propReverse,
    ftcPoly, ftcExp, ftcTrig, ftc1Value, riemannLR, riemannMid, riemannTrap, totalAreaGraph, areaCap, ftcLn, antiMixed, antiIVP,
    ftc1Chain, ftc1Both, totalDistance, posIVP, uSubDef1, uSubDef2, uSubExp, uSubLn, areaIntersect, areaCross, avgHard, avgMVT,
    propSym, propMixed, riemannQuad, accumMax, ftcExpAdv,
  ];
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.integrals = GENERATORS.concat(EXTRA);
})();
