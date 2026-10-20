// Ported from Modules/Trigonometry/PeriodicFunctionsControl.vb - "Periyodik Fonksiyonlar / Periodic Functions":
// (a) period/amplitude/phase shift of A·f(Bx + C) + D, (b) period of a sum (LCM), (c) is it periodic?,
// (d) periodic extension (reduce x modulo the period, floor for negative x).
(function () {
  const KIND_COUNT = 4;
  const tx = (tr, en) => I18N.tx(tr, en);
  let forcedKind = -1;      // -1 = random (mirrors _forcedKindPlus1 = 0)
  let kindSel = null;       // { select } from helpers.addSelect

  // ================= helpers =================
  function gcdL(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = a % b; a = b; b = t; }
    return Math.max(1, a);
  }
  function lcmL(a, b) { return (Math.abs(a) / gcdL(a, b)) * Math.abs(b); }
  function Pm(n, d) { return TrigKit.piStr(n, d).replace(/-/g, '−'); }
  function Hdr(i, tr, en) { return '── ' + i + ') ' + tx(tr, en) + ' ──\n'; }
  function D4(v) {
    if (!isFinite(v)) return tx('tanımsız', 'undefined');
    const s = v.toFixed(4);
    return /^-0\.0+$/.test(s) ? s.slice(1) : s;
  }
  function D2s(v) {
    if (!isFinite(v)) return tx('tanımsız', 'undefined');
    const s = v.toFixed(2);
    return /^-0\.0+$/.test(s) ? s.slice(1) : s;
  }
  function Mn(n) { return String(n).replace(/-/g, '−'); }
  function Dv(n, d) { return Math.abs(d) < 1e-9 ? NaN : n / d; }
  function FnName(i) { return ['sin', 'cos', 'tan'][Math.max(0, Math.min(2, i))]; }
  function FnVal(i, u) {
    switch (i) {
      case 0: return Math.sin(u);
      case 1: return Math.cos(u);
      default: return Dv(Math.sin(u), Math.cos(u));
    }
  }
  // Period of fn(a·x) as [num, den] meaning (num/den)·π.
  function FnPeriod(fn, a) {
    let num = fn === 2 ? 1 : 2;
    let den = Math.max(1, a);
    const g = gcdL(num, den);
    return [num / g, den / g];
  }
  function TermTxt(fn, a) { return a === 1 ? FnName(fn) + ' x' : FnName(fn) + '(' + a + 'x)'; }
  function Pk(v) { return fmt2(v).replace(/-/g, '−'); }
  function Fmod(x, p) {
    let r = x - Math.floor(x / p) * p;
    if (r < 0) r = 0;
    if (r >= p) r = 0;
    return r;
  }
  const idiv = (a, b) => Math.trunc(a / b);
  const BLUE = '#1e90ff', ORANGE_D = '#ff8c00', LIME = '#32cd32', TOMATO = '#ff6347', ORCHID = '#ba55d3',
    SEAGREEN = '#2e8b57', INDIAN = '#cd5c5c', ORANGERED = '#ff4500', REDC = '#ff0000';

  function concept() {
    return tx(
      'Her x için f(x + p) = f(x) eşitliğini sağlayan bir p > 0 sayısı varsa f PERİYODİKTİR. Bu özelliği sağlayan EN KÜÇÜK pozitif p\'ye f\'nin PERİYODU denir; grafik her p uzunluğundaki aralıkta kendini tekrar eder.\n\n' +
      'BİLİNEN PERİYOTLAR\n' +
      '  sin x, cos x, sec x, csc x : 2π\n' +
      '  tan x, cot x : π\n\n' +
      'A·sin(Bx + C) + D  ve  A·cos(Bx + C) + D\n' +
      '  Periyot T = 2π/|B|     Genlik = |A|\n' +
      '  Faz kayması: Bx + C = 0 ⇒ x = −C/B (başlangıç noktası)\n' +
      '  Düşey kayma D: orta çizgi y = D, en büyük D + |A|, en küçük D − |A|\n' +
      'A·tan(Bx + C) + D için T = π/|B| (genlik yoktur; A yalnızca düşey germedir).\n\n' +
      'TOPLAMLARIN PERİYODU\n' +
      'f = g + h ve g\'nin periyodu T₁, h\'nin periyodu T₂ ise, f için her iki terimin de tam sayı kez tekrarlandığı en küçük p, T₁ ve T₂\'nin OKEK\'idir (ortak katların en küçüğü). Örneğin sin 2x (π) + cos 3x (2π/3) için OKEK = 2π. T₁/T₂ oranı irrasyonelse toplam periyodik değildir.\n\n' +
      'PERİYODİK Mİ?\n' +
      '  |sin x| ve sin²x periyodiktir (π). sin x + x periyodik DEĞİLDİR (x terimi büyür). Sabit fonksiyon her p için tekrar eder ama en küçük pozitif p yoktur.\n\n' +
      'PERİYODİK UZANTI\n' +
      'Bir fonksiyon yalnızca bir periyot aralığında [0, p) tanımlanıp p ile tekrarlanabilir. Değer bulmak için x = n·p + r (0 ≤ r < p) yazabiliriz; böylece f(x) = f(r) olur. Negatif x için de n = ⌊x/p⌋ alınır.\n\n' +
      'NEDEN ÖNEMLİ?\n' +
      'Gözlemlenen birçok olay periyodiktir: gel-git, mevsimler, alternatif akım, sarkaç, ses ve ışık dalgaları, kalp atışı. Bu yüzden periyodik modeller çok önemlidir; üstelik her periyodik model sinüs ve kosinüslerin bir kombinasyonu olarak yazılabilir (Fourier fikri).',
      'A function f is PERIODIC if there is a number p > 0 with f(x + p) = f(x) for EVERY x. The smallest such positive p is the PERIOD of f; the graph repeats itself on every interval of length p.\n\n' +
      'KNOWN PERIODS\n' +
      '  sin x, cos x, sec x, csc x : 2π\n' +
      '  tan x, cot x : π\n\n' +
      'A·sin(Bx + C) + D  and  A·cos(Bx + C) + D\n' +
      '  Period T = 2π/|B|     Amplitude = |A|\n' +
      '  Phase shift: Bx + C = 0 ⇒ x = −C/B (the starting point of a cycle)\n' +
      '  Vertical shift D: midline y = D, maximum D + |A|, minimum D − |A|\n' +
      'For A·tan(Bx + C) + D the period is T = π/|B| (there is no amplitude; A is just a vertical stretch).\n\n' +
      'PERIOD OF A SUM\n' +
      'If f = g + h, g has period T₁ and h has period T₂, the smallest p for which both terms repeat a whole number of times is the LCM of T₁ and T₂ (least common multiple). For example sin 2x (π) + cos 3x (2π/3) has LCM 2π. If T₁/T₂ is irrational the sum is not periodic.\n\n' +
      'IS IT PERIODIC?\n' +
      '  |sin x| and sin²x are periodic (π). sin x + x is NOT periodic (the x term keeps growing). A constant repeats for every p but has no smallest positive p.\n\n' +
      'PERIODIC EXTENSION\n' +
      'A function can be defined on one period [0, p) only and then repeated with period p. To find a value we can write x = n·p + r (0 ≤ r < p): f(x) = f(r). For negative x we take n = ⌊x/p⌋ as well.\n\n' +
      'WHY IT MATTERS\n' +
      'Many observed behaviours are periodic: tides, seasons, alternating current, pendulums, sound and light waves, heartbeats. That is why periodic modelling is so important; moreover every periodic model can be written as a combination of sines and cosines (the Fourier idea).');
  }

  function createProblem(rng) {
    return genProblem(rng, forcedKind >= 0 ? forcedKind : rng.nextInt(0, KIND_COUNT));
  }

  function genProblem(rng, kind) {
    const p = {};
    p.kind = kind;
    p.fn = rng.nextInt(0, 3);
    p.fn2 = rng.nextInt(0, 2);
    p.a = rng.nextInt(1, 4) * (rng.nextInt(0, 4) === 0 ? -1 : 1);
    p.b2 = rng.nextInt(1, 9);
    p.cq = rng.nextInt(-6, 7);
    p.d = rng.nextInt(-2, 3);
    p.ia = rng.nextInt(1, 7);
    do { p.ib = rng.nextInt(1, 7); } while (p.ib === p.ia);
    p.k = rng.nextInt(1, 5);
    p.caseNo = rng.nextInt(0, 6);
    p.period = rng.nextInt(2, 6);
    p.testX = Math.round((rng.nextDouble() * 12.0 - 6.0) * 10) / 10;
    if (p.kind === 3) p.testX = Math.round((rng.nextDouble() * 18.0 - 9.0) * 2.0) / 2.0;
    if (p.testX === 0) p.testX = 0; // normalise -0
    if (kindSel && kindSel.select) kindSel.select.value = String(p.kind);
    return p;
  }

  // ================= (a) A·f(Bx + C) + D =================
  const BVal = (p) => p.b2 / 2.0;
  const CVal = (p) => p.cq * Math.PI / 6.0;
  const PerA = (p) => (p.fn === 2 ? Math.PI : 2 * Math.PI) / BVal(p);
  const PerAText = (p) => (p.fn === 2 ? Pm(2, p.b2) : Pm(4, p.b2));
  const StartA = (p) => -CVal(p) / BVal(p);
  function EvalA(p, x) {
    const u = BVal(p) * x + CVal(p);
    return p.a * FnVal(p.fn, u) + p.d;
  }
  function FuncAText(p, xVar) {
    xVar = xVar || 'x';
    const a = p.a === 1 ? '' : (p.a === -1 ? '−' : Mn(p.a) + '·');
    const bTxt = p.b2 === 2 ? '' : (p.b2 % 2 === 0 ? String(p.b2 / 2) : '(' + p.b2 + '/2)');
    const cTxt = p.cq === 0 ? '' : (p.cq > 0 ? ' + ' : ' − ') + Pm(Math.abs(p.cq), 6);
    const dTxt = p.d === 0 ? '' : (p.d > 0 ? ' + ' : ' − ') + Math.abs(p.d);
    return `${a}${FnName(p.fn)}(${bTxt}${xVar}${cTxt})${dTxt}`;
  }

  function StepsA(p) {
    const L = [];
    const bT = p.b2 % 2 === 0 ? String(p.b2 / 2) : '(' + p.b2 + '/2)';
    const isTan = p.fn === 2;
    const fnS = FnName(p.fn);
    const T = PerA(p);
    const Tt = PerAText(p);
    const xs = StartA(p);
    const xsT = Pm(-p.cq, 3 * p.b2);
    const cT = Pm(p.cq, 6);
    const fx = FuncAText(p);
    const x0 = p.testX;
    const shiftTxt = p.cq < 0 ? 'x − ' + xsT : (p.cq > 0 ? 'x + ' + Pm(p.cq, 3 * p.b2) : 'x');
    const aPre = p.a === 1 ? '' : (p.a === -1 ? '−' : Mn(p.a) + '·');
    const dPost = p.d === 0 ? '' : (p.d > 0 ? ' + ' : ' − ') + Math.abs(p.d);
    const factored = `${aPre}${fnS}(${p.b2 === 2 ? '' : bT}(${shiftTxt}))${dPost}`;

    L.push(Hdr(1, 'Katsayıları belirleyelim', 'Identify the coefficients') +
      tx(`f(x) = ${fx} ifadesini genel biçim f(x) = A·${fnS}(Bx + C) + D ile karşılaştıralım:\nA = ${Mn(p.a)},  B = ${bT},  C = ${cT},  D = ${Mn(p.d)}.`,
        `Let's compare f(x) = ${fx} with the general form f(x) = A·${fnS}(Bx + C) + D:\nA = ${Mn(p.a)},  B = ${bT},  C = ${cT},  D = ${Mn(p.d)}.`));
    if (isTan) {
      L.push(Hdr(2, 'Periyot', 'Period') +
        tx(`tan'ın temel periyodu π; argüman Bx + C olduğundan T = π/|B| = π/${bT} = ${Tt} ≈ ${D4(T)}.\nA, C ve D periyodu değiştirmez: A düşey gerer, C yatay kaydırır, D yukarı-aşağı kaydırır.`,
          `The basic period of tan is π; with the argument Bx + C the period is T = π/|B| = π/${bT} = ${Tt} ≈ ${D4(T)}.\nA, C and D do not change the period: A stretches vertically, C slides horizontally, D slides up or down.`));
      L.push(Hdr(3, 'Genlik', 'Amplitude') +
        tx('tan fonksiyonu sınırsızdır (değer kümesi tüm reel sayılar), dolayısıyla genlik tanımlı değildir; |A| = ' + Math.abs(p.a) + ' yalnızca eğrinin ne kadar dik olduğunu belirler.',
          'tan is unbounded (its range is all real numbers), so there is no amplitude; |A| = ' + Math.abs(p.a) + ' only controls how steep the curve is.'));
    } else {
      L.push(Hdr(2, 'Periyot', 'Period') +
        tx(`${fnS} x'in periyodu 2π. B çarpanı grafiği sıkıştırır: Bx + C açısının 2π artması için x'in 2π/|B| artması gerekir.\nT = 2π/|B| = 2π/${bT} = ${Tt} ≈ ${D4(T)}.\nA, C ve D periyodu değiştirmez.`,
          `The period of ${fnS} x is 2π. With the factor B, the angle Bx + C grows by 2π when x grows by 2π/|B|.\nT = 2π/|B| = 2π/${bT} = ${Tt} ≈ ${D4(T)}.\nA, C and D do not change the period.`));
      L.push(Hdr(3, 'Genlik', 'Amplitude') +
        tx(`Genlik = |A| = |${Mn(p.a)}| = ${Math.abs(p.a)}.` + (p.a < 0 ? ' A negatif olduğu için grafik x ekseni (orta çizgi) etrafında yansır; genlik yine pozitiftir.' : ''),
          `Amplitude = |A| = |${Mn(p.a)}| = ${Math.abs(p.a)}.` + (p.a < 0 ? ' Because A is negative the graph is reflected about the midline; the amplitude is still positive.' : '')));
    }
    const shTr = xs > 1e-7 ? `${Pk(Math.abs(xs))} birim SAĞA` : (xs < -1e-7 ? `${Pk(Math.abs(xs))} birim SOLA` : 'yatay olarak kaymamıştır');
    const shEn = xs > 1e-7 ? `shifted ${Pk(Math.abs(xs))} units to the RIGHT` : (xs < -1e-7 ? `shifted ${Pk(Math.abs(xs))} units to the LEFT` : 'not shifted horizontally');
    L.push(Hdr(4, 'Faz kayması (yatay kayma)', 'Phase shift (horizontal shift)') +
      tx(`Bx + C = 0 denklemini çözelim: x = −C/B = −(${cT})/${bT} = ${xsT} ≈ ${D4(xs)}.\nEşdeğer (çarpanlı) yazım: f(x) = ${factored}. Grafik, ${fnS} x'e göre ${shTr}.`,
        `We solve Bx + C = 0: x = −C/B = −(${cT})/${bT} = ${xsT} ≈ ${D4(xs)}.\nEquivalent (factored) form: f(x) = ${factored}. Compared with ${fnS} x the graph is ${shEn}.`));
    if (isTan) {
      L.push(Hdr(5, 'Düşey kayma ve asimptotlar', 'Vertical shift and asymptotes') +
        tx(`Orta çizgi (eğrinin simetri merkezinin yüksekliği): y = D = ${Mn(p.d)}. Başlangıç noktası (${xsT}, ${Mn(p.d)}).\nDikey asimptotlar Bx + C = π/2 + kπ'de: x = ${xsT} ± T/2 = ${Pm(-2 * p.cq + 6, 6 * p.b2)} ve ${Pm(-2 * p.cq - 6, 6 * p.b2)} (sonra T kadar tekrar eder).`,
          `Midline (height of the centre of symmetry): y = D = ${Mn(p.d)}. Starting point (${xsT}, ${Mn(p.d)}).\nVertical asymptotes where Bx + C = π/2 + kπ: x = ${xsT} ± T/2 = ${Pm(-2 * p.cq + 6, 6 * p.b2)} and ${Pm(-2 * p.cq - 6, 6 * p.b2)} (then every T).`));
      L.push(Hdr(6, 'Bir periyottaki anahtar noktalar', 'Key points of one period') +
        `x = ${Pm(-2 * p.cq - 6, 6 * p.b2)}:  ` + tx('asimptot', 'asymptote') + '\n' +
        `x = ${Pm(-2 * p.cq - 3, 6 * p.b2)}:  y = D − A = ${Mn(p.d - p.a)}\n` +
        `x = ${xsT}:  y = D = ${Mn(p.d)}\n` +
        `x = ${Pm(-2 * p.cq + 3, 6 * p.b2)}:  y = D + A = ${Mn(p.d + p.a)}\n` +
        `x = ${Pm(-2 * p.cq + 6, 6 * p.b2)}:  ` + tx('asimptot', 'asymptote'));
    } else {
      const mx = p.d + Math.abs(p.a), mi = p.d - Math.abs(p.a);
      L.push(Hdr(5, 'Düşey kayma, orta çizgi, en büyük ve en küçük değer', 'Vertical shift, midline, maximum and minimum') +
        tx(`Orta çizgi: y = D = ${Mn(p.d)}. En büyük değer = D + |A| = ${Mn(p.d)} + ${Math.abs(p.a)} = ${Mn(mx)}; en küçük değer = D − |A| = ${Mn(mi)}. Değer kümesi [${Mn(mi)}, ${Mn(mx)}].`,
          `Midline: y = D = ${Mn(p.d)}. Maximum = D + |A| = ${Mn(p.d)} + ${Math.abs(p.a)} = ${Mn(mx)}; minimum = D − |A| = ${Mn(mi)}. Range [${Mn(mi)}, ${Mn(mx)}].`));
      const ys = p.fn === 0 ? [p.d, p.d + p.a, p.d, p.d - p.a, p.d] : [p.d + p.a, p.d, p.d - p.a, p.d, p.d + p.a];
      let kp = '';
      for (let k = 0; k <= 4; k++) kp += `x = ${Pm(3 * k - p.cq, 3 * p.b2)}:  y = ${Mn(ys[k])}` + (k < 4 ? '\n' : '');
      L.push(Hdr(6, 'Bir periyottaki beş anahtar nokta', 'Five key points of one period') +
        tx(`Başlangıç x = ${xsT}'den T/4 = ${Pm(1, p.b2)} adımlarla (T = ${Tt}):`, `Starting at x = ${xsT} in steps of T/4 = ${Pm(1, p.b2)} (T = ${Tt}):`) + '\n' + kp);
    }
    const fx0 = EvalA(p, x0);
    const fx1 = EvalA(p, x0 + T);
    const xr = xs + Fmod(x0 - xs, T);
    L.push(Hdr(7, 'Periyodu bir sayıyla sınayalım', 'Test the period with a number') +
      tx(`B(x + T) + C = Bx + C + B·T = Bx + C + ${isTan ? 'π' : '2π'}, ve ${fnS} bu kadar kaymayla aynı değeri verir.\nx = ${Pk(x0)} için f(x) = ${D4(fx0)} ve f(x + T) = f(${Pk(x0 + T)}) = ${D4(fx1)}. Değerler eşit ✓\nGrafikte aynı nokta ilk döngüye taşınmıştır: x = ${Pk(xr)} ve x + T'de yükseklik aynıdır.`,
        `B(x + T) + C = Bx + C + B·T = Bx + C + ${isTan ? 'π' : '2π'}, and ${fnS} returns the same value after such a shift.\nFor x = ${Pk(x0)}: f(x) = ${D4(fx0)} and f(x + T) = f(${Pk(x0 + T)}) = ${D4(fx1)}. The values are equal ✓\nOn the graph the same point has been moved into the first cycle: x = ${Pk(xr)} and x + T have the same height.`));
    L.push(Hdr(8, 'Grafiği okuyalım', 'Reading the graph') +
      tx('Mavi eğri f\'dir. Çift uçlu ok bir periyodu (T) gösterir; kesikli yatay çizgi orta çizgi y = D\'dir; yeşil/kırmızı noktalar en büyük/en küçük değerlerdir; sarı elmas, kaydırılmış başlangıç noktası x = −C/B\'dir.',
        'The blue curve is f. The double arrow spans one period (T); the dashed horizontal line is the midline y = D; green/red points are maxima/minima; the gold diamond is the shifted start x = −C/B.'));
    return L;
  }

  function AddArrow(canvas, x1, x2, y, hx, hy, col) {
    const seg = (a, b, c, d) => canvas.addSegment({ x1: a, y1: b, x2: c, y2: d, color: col, thickness: 2.5 });
    seg(x1, y, x2, y);
    seg(x1, y, x1 + hx, y + hy);
    seg(x1, y, x1 + hx, y - hy);
    seg(x2, y, x2 - hx, y + hy);
    seg(x2, y, x2 - hx, y - hy);
  }

  function DrawA(canvas, p) {
    const T = PerA(p);
    const xs = StartA(p);
    const isTan = p.fn === 2;
    const xmin = xs - 0.6 * T, xmax = xs + 2.4 * T;
    let ymin, ymax;
    if (isTan) { ymin = Math.min(p.d - 5.0, -1.0); ymax = Math.max(p.d + 5.0, 1.0); }
    else { ymin = Math.min(p.d - Math.abs(p.a) - 1.2, -1.0); ymax = Math.max(p.d + Math.abs(p.a) + 1.2, 1.0); }
    canvas.setViewport(xmin, xmax, ymin, ymax);
    canvas.addFunction({ evaluator: (x) => EvalA(p, x), color: BLUE, thickness: 3.5, label: FuncAText(p) });
    canvas.addGuideLine({ axis: 'horizontal', position: p.d, color: canvas.gray(), label: 'y = ' + p.d });

    const span = ymax - ymin;
    const startY = p.fn === 1 ? p.d + p.a : p.d;
    canvas.addMarker({ x: xs, y: startY, color: canvas.gold(), shape: 'diamond', radius: 7, label: tx('başlangıç x = −C/B = ', 'start x = −C/B = ') + Pm(-p.cq, 3 * p.b2) });
    if (!isTan) {
      let firstMax = true, firstMin = true;
      for (let j = -2; j <= 14; j++) {
        const xe = xs + j * T / 4.0;
        if (xe < xmin || xe > xmax) continue;
        const isExt = p.fn === 0 ? (((j % 2) + 2) % 2 !== 0) : (((j % 2) + 2) % 2 === 0);
        if (!isExt) continue;
        const ye = EvalA(p, xe);
        const isMax = ye > p.d;
        let lab = '';
        if (isMax && firstMax) { lab = 'max = ' + Pk(ye); firstMax = false; }
        if (!isMax && firstMin) { lab = 'min = ' + Pk(ye); firstMin = false; }
        canvas.addMarker({ x: xe, y: ye, color: isMax ? LIME : TOMATO, radius: 5, label: lab });
      }
    } else {
      for (let j = -2; j <= 5; j++) {
        const xa = xs + T / 2.0 + j * T;
        if (xa >= xmin && xa <= xmax) canvas.addGuideLine({ axis: 'vertical', position: xa, color: INDIAN });
      }
    }
    const ya = ymax - 0.12 * span;
    AddArrow(canvas, xs, xs + T, ya, 0.04 * T, 0.025 * span, ORANGE_D);
    canvas.addSegment({ x1: xs, y1: ya, x2: xs, y2: startY, color: ORANGE_D, dashed: true, thickness: 1.5 });
    canvas.addSegment({ x1: xs + T, y1: ya, x2: xs + T, y2: startY, color: ORANGE_D, dashed: true, thickness: 1.5 });
    canvas.addMarker({ x: xs + T / 2.0, y: ya + 0.045 * span, color: ORANGE_D, radius: 1.5, label: 'T = ' + PerAText(p) + ' ≈ ' + Pk(T) });
    const xr = xs + Fmod(p.testX - xs, T);
    const yr = EvalA(p, xr);
    if (isFinite(yr) && Math.abs(yr) < 1000) {
      canvas.addMarker({ x: xr, y: yr, color: ORCHID, shape: 'square', radius: 6, label: 'f = ' + D2s(yr) });
      canvas.addMarker({ x: xr + T, y: yr, color: ORCHID, shape: 'square', radius: 6, label: 'f(x + T) = ' + D2s(yr) });
      canvas.addSegment({ x1: xr, y1: yr, x2: xr + T, y2: yr, color: ORCHID, dashed: true, thickness: 1.5 });
    }
  }

  // ================= (b) period of a sum =================
  function EvalB(p, x) { return FnVal(p.fn, p.ia * x) + FnVal(p.fn2, p.ib * x); }

  function LcmPeriod(p) {
    const [n1, d1] = FnPeriod(p.fn, p.ia);
    const [n2, d2] = FnPeriod(p.fn2, p.ib);
    let ln = lcmL(n1, n2);
    let ld = gcdL(d1, d2);
    const g = gcdL(ln, ld);
    ln = idiv(ln, g); ld = idiv(ld, g);
    return { n1, d1, n2, d2, ln, ld };
  }

  function Multiples(n, d, count) {
    let s = '';
    const shown = Math.min(count, 8);
    for (let i = 1; i <= shown; i++) s += Pm(n * i, d) + (i < shown ? ', ' : '');
    if (count > shown) s += ', …, ' + Pm(n * count, d);
    return s;
  }

  // returns null or { xf, y1, y2 }
  function FindGap(f, q, x0) {
    for (let i = 0; i <= 600; i++) {
      const x = x0 + i * 0.05;
      const a = f(x), b = f(x + q);
      if (!isNaN(a) && !isNaN(b) && Math.abs(a) < 1000 && Math.abs(b) < 1000 && Math.abs(a - b) > 0.05) return { xf: x, y1: a, y2: b };
    }
    return null;
  }
  function FindDefined(f, shift, x0) {
    for (let i = 0; i <= 200; i++) {
      const x = x0 + i * 0.05;
      const a = f(x), b = f(x + shift);
      if (!isNaN(a) && !isNaN(b) && Math.abs(a) < 1000 && Math.abs(b) < 1000) return x;
    }
    return x0;
  }

  function StepsB(p) {
    const L = [];
    const { n1, d1, n2, d2, ln, ld } = LcmPeriod(p);
    const T1 = n1 / d1 * Math.PI, T2 = n2 / d2 * Math.PI;
    const Pd = ln / ld * Math.PI;
    const m = idiv(ln * d1, ld * n1);
    const n = idiv(ln * d2, ld * n2);
    const t1s = Pm(n1, d1), t2s = Pm(n2, d2), ps = Pm(ln, ld);
    const term1 = TermTxt(p.fn, p.ia), term2 = TermTxt(p.fn2, p.ib);
    const base1 = p.fn === 2 ? 'π' : '2π', base2 = p.fn2 === 2 ? 'π' : '2π';
    const f = (x) => EvalB(p, x);
    const x0 = FindDefined(f, Pd, p.testX);
    const y0 = f(x0), yP = f(x0 + Pd);

    L.push(Hdr(1, 'İki terimin ayrı periyotları', 'The period of each term') +
      tx(`f(x) = ${term1} + ${term2}.\n${term1}: periyot = ${base1}/${p.ia} = ${t1s} ≈ ${D4(T1)}\n${term2}: periyot = ${base2}/${p.ib} = ${t2s} ≈ ${D4(T2)}  (${p.fn2 === 2 ? 'tan' : FnName(p.fn2)} için temel periyot ${base2}, argümandaki ${p.ib} çarpanı periyodu ${p.ib}'ye böler).`,
        `f(x) = ${term1} + ${term2}.\n${term1}: period = ${base1}/${p.ia} = ${t1s} ≈ ${D4(T1)}\n${term2}: period = ${base2}/${p.ib} = ${t2s} ≈ ${D4(T2)}  (the basic period of ${FnName(p.fn2)} is ${base2}; the factor ${p.ib} divides it by ${p.ib}).`));
    L.push(Hdr(2, 'Toplamın periyodu için koşul', 'Condition for the period of the sum') +
      tx(`f(x + p) = f(x) olması için HER İKİ terimin de p kadar kaydırılınca değişmemesi gerekir. Yani p, ${t1s}'nin tam katı VE ${t2s}'nin tam katı olmalı: p = m·(${t1s}) = k·(${t2s}) (m, k pozitif tam sayılar). En küçük böyle p, iki periyodun OKEK'idir.`,
        `For f(x + p) = f(x) BOTH terms must be unchanged after the shift by p. So p must be a whole multiple of ${t1s} AND a whole multiple of ${t2s}: p = m·(${t1s}) = k·(${t2s}) with m, k positive integers. The smallest such p is the LCM of the two periods.`));
    L.push(Hdr(3, "OKEK'i bulalım", 'Find the LCM') +
      tx(`${t1s}'nin katları: ${Multiples(n1, d1, m)}\n${t2s}'nin katları: ${Multiples(n2, d2, n)}\nİlk ortak kat: ${ps}  (${m}·(${t1s}) = ${n}·(${t2s}) = ${ps}).\nHesap: π'nin katsayıları ${n1}/${d1} ve ${n2}/${d2} için OKEK = OKEK(${n1}, ${n2}) / OEBOB(${d1}, ${d2}) = ${lcmL(n1, n2)}/${gcdL(d1, d2)} ⇒ p = ${ps} ≈ ${D4(Pd)}.`,
        `Multiples of ${t1s}: ${Multiples(n1, d1, m)}\nMultiples of ${t2s}: ${Multiples(n2, d2, n)}\nFirst common multiple: ${ps}  (${m}·(${t1s}) = ${n}·(${t2s}) = ${ps}).\nCalculation: for the coefficients of π, ${n1}/${d1} and ${n2}/${d2}: LCM = LCM(${n1}, ${n2}) / GCD(${d1}, ${d2}) = ${lcmL(n1, n2)}/${gcdL(d1, d2)} ⇒ p = ${ps} ≈ ${D4(Pd)}.`));
    L.push(Hdr(4, 'Sayısal sınama: f(x + p) = f(x)', 'Numerical test: f(x + p) = f(x)') +
      tx(`x = ${Pk(x0)} alalım: f(x) = ${D4(y0)}; f(x + ${ps}) = f(${Pk(x0 + Pd)}) = ${D4(yP)}. Eşit ✓ (${m} ve ${n} tam tekrar).`,
        `Let's take x = ${Pk(x0)}: f(x) = ${D4(y0)}; f(x + ${ps}) = f(${Pk(x0 + Pd)}) = ${D4(yP)}. Equal ✓ (${m} and ${n} whole repeats).`));
    const cands = [], candT = [];
    cands.push(Pd / 2.0); candT.push(Pm(ln, ld * 2));
    if (T1 < Pd - 1e-6 && Math.abs(T1 - Pd / 2.0) > 1e-6) { cands.push(T1); candT.push(t1s); }
    if (T2 < Pd - 1e-6 && Math.abs(T2 - Pd / 2.0) > 1e-6 && Math.abs(T2 - T1) > 1e-6) { cands.push(T2); candT.push(t2s); }
    let cl = '';
    for (let i = 0; i < cands.length; i++) {
      const g = FindGap(f, cands[i], p.testX);
      if (g) {
        cl += tx(`p' = ${candT[i]}: x = ${Pk(g.xf)} için f(x) = ${D4(g.y1)} ama f(x + p') = ${D4(g.y2)}. Eşit değil ✗`,
          `p' = ${candT[i]}: at x = ${Pk(g.xf)} we get f(x) = ${D4(g.y1)} but f(x + p') = ${D4(g.y2)}. Not equal ✗`) + '\n';
      } else {
        cl += tx(`p' = ${candT[i]}: örneklenen noktalarda fark bulunamadı.`, `p' = ${candT[i]}: no difference found at the sampled points.`) + '\n';
      }
    }
    L.push(Hdr(5, 'Daha küçük aday başarısız olur', 'A smaller candidate fails') +
      tx(`Bir sayının periyot olmadığını göstermek için tek bir karşı örnek yeter. ${ps}'den küçük adayları deneyelim:`,
        `One counter-example is enough to show a number is not a period. let's try candidates smaller than ${ps}:`) + '\n' + cl.trim() + '\n' +
      tx(`Bu yüzden en küçük pozitif periyot p = ${ps}.`, `So the smallest positive period is p = ${ps}.`));
    L.push(Hdr(6, 'Grafik', 'The graph') +
      tx('Kalın mavi eğri toplamdır; ince yeşil ve mor eğriler iki terimdir. Turuncu çift ok bir periyodu (p) gösterir: toplam her p uzunluğunda kendini tekrar eder. Mor kareler x ve x + p\'deki eşit yükseklikleri, kırmızı içi boş noktalar ise küçük adayın (p/2) tutmadığını gösterir.',
        'The thick blue curve is the sum; the thin green and purple curves are the two terms. The orange double arrow spans one period (p): the sum repeats on every interval of length p. Purple squares show equal heights at x and x + p; red hollow points show that the smaller candidate (p/2) fails.'));
    return L;
  }

  function DrawB(canvas, p) {
    const { ln, ld } = LcmPeriod(p);
    const P0 = ln / ld * Math.PI;
    const xmin = -0.3 * P0, xmax = 2.3 * P0;
    const ymax = (p.fn === 2 || p.fn2 === 2) ? 5.0 : 2.6;
    canvas.setViewport(xmin, xmax, -ymax, ymax);
    canvas.addFunction({ evaluator: (x) => FnVal(p.fn, p.ia * x), color: SEAGREEN, thickness: 1.5 });
    canvas.addFunction({ evaluator: (x) => FnVal(p.fn2, p.ib * x), color: canvas.purple(), thickness: 1.5 });
    canvas.addFunction({ evaluator: (x) => EvalB(p, x), color: BLUE, thickness: 3.5 });
    const f = (x) => EvalB(p, x);
    const ya = ymax * 0.88;
    AddArrow(canvas, 0, P0, ya, 0.03 * P0, 0.05 * ymax, ORANGE_D);
    canvas.addMarker({ x: P0 / 2.0, y: ya + 0.09 * ymax, color: ORANGE_D, radius: 1.5, label: 'p = ' + Pm(ln, ld) + ' ≈ ' + Pk(P0) });
    [0.0, P0, 2 * P0].forEach((xv) => canvas.addGuideLine({ axis: 'vertical', position: xv, color: ORANGE_D }));
    const x0 = FindDefined(f, P0, p.testX);
    let xd = Fmod(x0, P0);
    xd = FindDefined(f, P0, xd);
    const y0 = f(xd);
    if (!isNaN(y0) && Math.abs(y0) < ymax) {
      canvas.addMarker({ x: xd, y: y0, color: ORCHID, shape: 'square', radius: 6, label: 'f = ' + D2s(y0) });
      canvas.addMarker({ x: xd + P0, y: f(xd + P0), color: ORCHID, shape: 'square', radius: 6, label: 'f(x + p) = ' + D2s(f(xd + P0)) });
      canvas.addSegment({ x1: xd, y1: y0, x2: xd + P0, y2: f(xd + P0), color: ORCHID, dashed: true, thickness: 1.5 });
    }
    const g = FindGap(f, P0 / 2.0, xd + 0.15 * P0);
    if (g && g.xf + P0 / 2.0 < xmax) {
      canvas.addMarker({ x: g.xf, y: g.y1, color: REDC, hollow: true, radius: 6 });
      canvas.addMarker({ x: g.xf + P0 / 2.0, y: g.y2, color: REDC, hollow: true, radius: 6, label: 'f(x + p/2) ≠ f(x)' });
    }
  }

  // ================= (c) is it periodic? =================
  const caseC = (p) => ((p.caseNo % 6) + 6) % 6;
  const kC = (p) => Math.max(1, p.k);
  function EvalC(p, x) {
    const k = kC(p);
    switch (caseC(p)) {
      case 0: return Math.abs(Math.sin(k * x));
      case 1: return Math.pow(Math.sin(k * x), 2);
      case 2: return Math.sin(x) + k * x;
      case 3: return k;
      case 4: return Math.sin(k * x) * Math.cos(k * x);
      default: return Math.sin(k * x) + Math.cos(k * x);
    }
  }
  function NameC(p) {
    const k = kC(p);
    const kx = k === 1 ? 'x' : k + 'x';
    switch (caseC(p)) {
      case 0: return `|sin ${kx}|`;
      case 1: return `sin²(${kx})`;
      case 2: return 'sin x + ' + (k === 1 ? '' : k + '') + 'x';
      case 3: return String(k);
      case 4: return `sin(${kx})·cos(${kx})`;
      default: return `sin(${kx}) + cos(${kx})`;
    }
  }
  // { per, n, d }; per = NaN when not periodic / no fundamental period
  function PeriodC(p) {
    const c = caseC(p), k = kC(p);
    let n = 0, d = 1;
    if (c === 0 || c === 1 || c === 4) { n = 1; d = k; }
    else if (c === 5) { n = 2; d = k; }
    else return { per: NaN, n: 0, d: 1 };
    const g = gcdL(n, d);
    n = idiv(n, g); d = idiv(d, g);
    return { per: n / d * Math.PI, n, d };
  }
  function TestXc(p) {
    const { per } = PeriodC(p);
    let hi = 2 * Math.PI - 0.1;
    if (!isNaN(per)) hi = 2 * Math.PI - per - 0.1;
    return Math.round(Math.max(-2 * Math.PI + 0.1, Math.min(hi, p.testX)) * 10) / 10;
  }

  function StepsC(p) {
    const L = [];
    const c = caseC(p), k = kC(p);
    const nm = NameC(p);
    const { per, n, d } = PeriodC(p);
    const ps = isNaN(per) ? '' : Pm(n, d);
    const f = (x) => EvalC(p, x);
    const x0 = TestXc(p);
    const kx = k === 1 ? 'x' : k + 'x';
    const kp = k === 1 ? 'p' : k + 'p';
    const twoK = k === 1 ? '2' : '2/' + k;
    const kTwoPi = k === 1 ? '2π' : k + '·2π';

    L.push(Hdr(1, 'Soru ve tanım', 'Question and definition') +
      tx(`f(x) = ${nm} periyodik mi? f, her x için f(x + p) = f(x) olacak biçimde bir p > 0 varsa periyodiktir; en küçük böyle p periyottur. Hem 'bu p çalışıyor' hem de 'bundan küçüğü çalışmıyor' demeyi hedefleyeceğiz.`,
        `Is f(x) = ${nm} periodic? f is periodic if some p > 0 satisfies f(x + p) = f(x) for every x; the smallest such p is the period. We aim to show both 'this p works' and 'nothing smaller works'.`));
    switch (c) {
      case 0:
        L.push(Hdr(2, 'Cebirsel inceleme', 'Algebraic analysis') +
          tx(`sin(θ + π) = −sin θ olduğundan |sin(${k}(x + π/${k}))| = |sin(${kx} + π)| = |−sin ${kx}| = |sin ${kx}|. Yani p = π/${k} bir periyottur. (sin ${kx} kendi başına 2π/${k} periyotludur; mutlak değer negatif yarıları aynalayarak periyodu yarıya indirir.)`,
            `Since sin(θ + π) = −sin θ: |sin(${k}(x + π/${k}))| = |sin(${kx} + π)| = |−sin ${kx}| = |sin ${kx}|. So p = π/${k} is a period. (sin ${kx} alone has period 2π/${k}; the absolute value reflects the negative halves and halves the period.)`));
        break;
      case 1:
        L.push(Hdr(2, 'Cebirsel inceleme', 'Algebraic analysis') +
          tx(`sin²(${k}(x + π/${k})) = (sin(${kx} + π))² = (−sin ${kx})² = sin²(${kx}). Yani p = π/${k} bir periyottur. Ayrıca sin²θ = (1 − cos 2θ)/2 olduğundan periyot 2π/(2${k}) = π/${k} çıkar.`,
            `sin²(${k}(x + π/${k})) = (sin(${kx} + π))² = (−sin ${kx})² = sin²(${kx}). So p = π/${k} is a period. Also, since sin²θ = (1 − cos 2θ)/2, the period is 2π/(2·${k}) = π/${k}.`));
        break;
      case 2:
        L.push(Hdr(2, 'Periyodik olmadığını görelim', 'Showing it is not periodic') +
          tx(`Bir p > 0 periyot olsaydı f(x + p) − f(x) = ${kp} + sin(x + p) − sin x = 0 olmalıydı.\n• p > ${twoK} ise: |sin(x + p) − sin x| ≤ 2 olduğundan f(x + p) − f(x) ≥ ${kp} − 2 > 0 (asla 0 değil).\n• 0 < p ≤ ${twoK} ise: x = 0 için f(p) − f(0) = ${kp} + sin p > 0, çünkü 0 < p < π'de sin p > 0.\nHiçbir p > 0 çalışmaz: f periyodik DEĞİLDİR (x terimi büyür, sin x yalnızca sınırlı bir salınım ekler).`,
            `If some p > 0 were a period we would need f(x + p) − f(x) = ${kp} + sin(x + p) − sin x = 0.\n• If p > ${twoK}: since |sin(x + p) − sin x| ≤ 2, f(x + p) − f(x) ≥ ${kp} − 2 > 0 (never 0).\n• If 0 < p ≤ ${twoK}: at x = 0, f(p) − f(0) = ${kp} + sin p > 0 because sin p > 0 for 0 < p < π.\nNo p > 0 works: f is NOT periodic (the x term keeps growing; sin x only adds a bounded wiggle).`));
        break;
      case 3:
        L.push(Hdr(2, 'Sabit fonksiyon', 'A constant function') +
          tx(`f(x + p) = ${k} = f(x) her x ve HER p > 0 için doğru. Yani her pozitif sayı bir periyottur. Ama en küçük pozitif p yoktur (p istenildiği kadar küçültülebilir), bu yüzden sabit fonksiyonun temel periyodu yoktur.`,
            `f(x + p) = ${k} = f(x) for every x and EVERY p > 0. So every positive number is a period. But there is no smallest positive p (you can make p as small as you like), so a constant function has no fundamental period.`));
        break;
      case 4:
        L.push(Hdr(2, 'Cebirsel inceleme', 'Algebraic analysis') +
          tx(`Çift açı formülünden sin(${kx})cos(${kx}) = ½ sin(${2 * k}x). sin(${2 * k}x)'in periyodu 2π/${2 * k} = π/${k}; ½ ile çarpmak periyodu değiştirmez.`,
            `By the double-angle formula, sin(${kx})cos(${kx}) = ½ sin(${2 * k}x). sin(${2 * k}x) has period 2π/${2 * k} = π/${k}; multiplying by ½ does not change the period.`));
        break;
      default:
        L.push(Hdr(2, 'Cebirsel inceleme', 'Algebraic analysis') +
          tx(`sin(${kx}) + cos(${kx}) = √2·sin(${kx} + π/4) (toplam/fark formülü). Genliği √2 olan bu sinüsün periyodu 2π/${k}.`,
            `sin(${kx}) + cos(${kx}) = √2·sin(${kx} + π/4) (sum/difference formula). This sine with amplitude √2 has period 2π/${k}.`));
    }

    if (isNaN(per) && c === 2) {
      const cand = 2 * Math.PI;
      L.push(Hdr(3, 'Sayısal karşı örnek', 'Numerical counter-example') +
        tx(`sin x'in periyodu olan p = 2π ≈ ${D4(cand)} deneyelim. x = ${Pk(x0)}: f(x) = ${D4(f(x0))}, f(x + 2π) = ${D4(f(x0 + cand))}. Fark = ${D4(f(x0 + cand) - f(x0))} = ${kTwoPi} ≠ 0 ✗. Hiçbir x için eşit değildir; çünkü fark her zaman ${kTwoPi} ≈ ${D4(k * cand)}'dir.`,
          `Try p = 2π ≈ ${D4(cand)}, the period of sin x. At x = ${Pk(x0)}: f(x) = ${D4(f(x0))}, f(x + 2π) = ${D4(f(x0 + cand))}. Difference = ${D4(f(x0 + cand) - f(x0))} = ${kTwoPi} ≠ 0 ✗. It fails at every x, because the difference is always ${kTwoPi} ≈ ${D4(k * cand)}.`));
      L.push(Hdr(4, 'Sonuç', 'Conclusion') +
        tx(`f(x) = ${nm} periyodik değildir; grafikte kesikli eğri (x + 2π'ye kaydırılmış f) asıl eğriyle çakışmaz, her yerde aynı miktar yukarıdadır.`,
          `f(x) = ${nm} is not periodic; on the graph the dashed curve (f shifted to x + 2π) does not coincide with the original, it sits the same distance above it everywhere.`));
    } else if (c === 3) {
      L.push(Hdr(3, 'Sayısal sınama', 'Numerical test') +
        tx(`p = 0,5 için f(x + 0,5) = ${k} = f(x); p = 100 için de ${k}. Her aday çalışır.`, `For p = 0.5: f(x + 0.5) = ${k} = f(x); for p = 100 also ${k}. Every candidate works.`));
      L.push(Hdr(4, 'Sonuç', 'Conclusion') +
        tx("Sabit fonksiyon periyodiktir ama en küçük pozitif p olmadığından 'periyodu' yoktur (temel periyot tanımsız).",
          "A constant function is periodic but, with no smallest positive p, it has no 'period' (the fundamental period is undefined)."));
    } else {
      const y0 = f(x0), y1 = f(x0 + per);
      L.push(Hdr(3, 'Sayısal sınama', 'Numerical test') +
        tx(`p = ${ps} ≈ ${D4(per)}: x = ${Pk(x0)} için f(x) = ${D4(y0)}, f(x + p) = ${D4(y1)}. Eşit ✓`,
          `p = ${ps} ≈ ${D4(per)}: at x = ${Pk(x0)}: f(x) = ${D4(y0)}, f(x + p) = ${D4(y1)}. Equal ✓`));
      const q = per / 2.0;
      const qs = Pm(n, d * 2);
      const g = FindGap(f, q, x0);
      const failTxt = g
        ? tx(`x = ${Pk(g.xf)} için f(x) = ${D4(g.y1)} ama f(x + ${qs}) = ${D4(g.y2)}. Eşit değil ✗`, `At x = ${Pk(g.xf)}: f(x) = ${D4(g.y1)} but f(x + ${qs}) = ${D4(g.y2)}. Not equal ✗`)
        : tx('Fark bulunamadı.', 'No difference found.');
      L.push(Hdr(4, 'Daha küçük aday: p/2', 'A smaller candidate: p/2') +
        tx(`p' = ${qs} ≈ ${D4(q)} deneyelim: ${failTxt}`, `Try p' = ${qs} ≈ ${D4(q)}: ${failTxt}`) + '\n' +
        tx("Tek bir karşı örnek p' = p/2'nin periyot olmadığını kanıtlar.", "A single counter-example proves p' = p/2 is not a period."));
      L.push(Hdr(5, 'Sonuç', 'Conclusion') +
        tx(`f(x) = ${nm} periyodiktir ve periyodu T = ${ps} ≈ ${D4(per)}. Grafikte kesikli eğri (x + T'ye kaydırılmış f) asıl eğriyle çakışır.`,
          `f(x) = ${nm} is periodic with period T = ${ps} ≈ ${D4(per)}. On the graph the dashed curve (f shifted to x + T) coincides with the original.`));
    }
    return L;
  }

  function ViewC(p) {
    const c = caseC(p), k = kC(p);
    let ymin, ymax;
    switch (c) {
      case 0: case 1: ymin = -0.6; ymax = 1.6; break;
      case 2: ymax = 2 * Math.PI * k + 2; ymin = -ymax; break;
      case 3: ymin = k - 3; ymax = k + 3; break;
      case 4: ymin = -0.8; ymax = 0.8; break;
      default: ymin = -1.9; ymax = 1.9;
    }
    const x0 = TestXc(p);
    return { xmin: -2 * Math.PI, xmax: 2 * Math.PI, ymin, ymax };
  }

  function DrawC(canvas, p) {
    const c = caseC(p), k = kC(p);
    const { per, n, d } = PeriodC(p);
    const shift = isNaN(per) ? 2 * Math.PI : per;
    const vw = ViewC(p);
    const ymin = vw.ymin, ymax = vw.ymax;
    canvas.setViewport(vw.xmin, vw.xmax, ymin, ymax);
    canvas.addFunction({ evaluator: (x) => EvalC(p, x), color: BLUE, thickness: 4 });
    if (c !== 3) canvas.addFunction({ evaluator: (x) => EvalC(p, x + shift), color: ORANGERED, thickness: 2.5, dashed: true });
    const lx = vw.xmin + 0.25;
    const span = ymax - ymin;
    canvas.addMarker({ x: lx, y: ymax - 0.07 * span, color: BLUE, radius: 4, label: 'f(x) = ' + NameC(p) });
    if (c !== 3) {
      const sh = isNaN(per) ? '2π' : Pm(n, d);
      canvas.addMarker({ x: lx, y: ymax - 0.14 * span, color: ORANGERED, shape: 'diamond', radius: 4,
        label: 'f(x + ' + sh + ')' + (isNaN(per) ? tx(' (aynı değil)', ' (not the same)') : tx(' (aynı eğri)', ' (same curve)')) });
    }
    const x0 = TestXc(p);
    canvas.addMarker({ x: x0, y: EvalC(p, x0), color: canvas.gold(), radius: 7, label: 'f(x) = ' + D2s(EvalC(p, x0)) });
    if (c !== 3) {
      const xe = x0 + (c === 2 ? 0.0 : shift);
      if (c === 2) {
        canvas.addMarker({ x: x0, y: EvalC(p, x0 + shift), color: ORANGERED, shape: 'diamond', radius: 6, label: 'f(x + 2π) = ' + D2s(EvalC(p, x0 + shift)) });
        canvas.addSegment({ x1: x0, y1: EvalC(p, x0), x2: x0, y2: EvalC(p, x0 + shift), color: canvas.gray(), dashed: true, thickness: 1.5 });
      } else {
        canvas.addMarker({ x: xe, y: EvalC(p, xe), color: ORANGERED, shape: 'diamond', radius: 6, label: 'f(x + T) = ' + D2s(EvalC(p, xe)) });
        canvas.addSegment({ x1: x0, y1: EvalC(p, x0), x2: xe, y2: EvalC(p, xe), color: canvas.gray(), dashed: true, thickness: 1.5 });
      }
    }
  }

  // ================= (d) periodic extension =================
  const Shape = (p) => ((p.caseNo % 4) + 4) % 4;
  function RuleD(shp, per, r) {
    switch (shp) {
      case 0: return r;
      case 1: return r < per / 2.0 ? r : per - r;
      case 2: return r < per / 2.0 ? 1.0 : -1.0;
      default: return r * r;
    }
  }
  function RuleText(shp, per) {
    const h = per % 2 === 0 ? String(per / 2) : (per / 2.0).toFixed(1);
    switch (shp) {
      case 0: return `f(x) = x,  0 ≤ x < ${per}`;
      case 1: return `f(x) = x  (0 ≤ x < ${h}),   f(x) = ${per} − x  (${h} ≤ x < ${per})`;
      case 2: return `f(x) = 1  (0 ≤ x < ${h}),   f(x) = −1  (${h} ≤ x < ${per})`;
      default: return `f(x) = x²,  0 ≤ x < ${per}`;
    }
  }
  function ShapeName(shp) {
    switch (shp) {
      case 0: return tx('testere dişi', 'sawtooth');
      case 1: return tx('üçgen dalga', 'triangle wave');
      case 2: return tx('kare dalga', 'square wave');
      default: return tx('x² parçalarının tekrarı', 'repeated pieces of x²');
    }
  }
  function EvalD(p, x) {
    const per = Math.max(2, p.period);
    return RuleD(Shape(p), per, Fmod(x, per));
  }

  function StepsD(p) {
    const L = [];
    const per = Math.max(2, p.period);
    const shp = Shape(p);
    const x0 = p.testX;
    let nn = Math.floor(x0 / per);
    if (nn === 0) nn = 0;
    let r = x0 - nn * per;
    if (Math.abs(r) < 1e-7) r = 0;
    const fr = RuleD(shp, per, r);
    const half = per / 2.0;
    const xt = Pk(x0);
    const nS = Mn(nn);
    let branch;
    switch (shp) {
      case 0: branch = `f(${Pk(r)}) = ${Pk(r)}`; break;
      case 1: branch = r < half ? `${Pk(r)} < ${Pk(half)}, f(${Pk(r)}) = ${Pk(r)}` : `${Pk(r)} ≥ ${Pk(half)}, f(${Pk(r)}) = ${per} − ${Pk(r)} = ${Pk(fr)}`; break;
      case 2: branch = r < half ? `${Pk(r)} < ${Pk(half)}, f(${Pk(r)}) = 1` : `${Pk(r)} ≥ ${Pk(half)}, f(${Pk(r)}) = −1`; break;
      default: branch = `f(${Pk(r)}) = (${Pk(r)})² = ${Pk(fr)}`;
    }
    L.push(Hdr(1, 'Kural ve periyot', 'The rule and the period') +
      tx(`Tek bir periyot [0, ${per}) üzerinde tanımlıdır: ${RuleText(shp, per)}; sonra p = ${per} ile tekrarlanıyor: f(x + ${per}) = f(x) (${ShapeName(shp)}). f(${xt}) değerini bulalım.`,
        `On one period [0, ${per}) the rule is: ${RuleText(shp, per)}; it is then repeated with period p = ${per}: f(x + ${per}) = f(x) (${ShapeName(shp)}). Let's find f(${xt}).`));
    L.push(Hdr(2, "x'i periyoda indirgeyelim: x = n·p + r", 'Reduce x modulo the period: x = n·p + r') +
      tx(`n = ⌊x/p⌋ = ⌊${xt}/${per}⌋ = ⌊${Pk(x0 / per)}⌋ = ${nS}, r = x − n·p = ${xt} − (${nS})·${per} = ${Pk(r)}.\nKontrol: 0 ≤ r < ${per} ✓ ve ${nS}·${per} + ${Pk(r)} = ${Pk(nn * per + r)} = x ✓.` +
        (x0 < 0 ? '\nNegatif x\'te ⌊ ⌋ aşağı yuvarlar (−1,75 → −2); böylece r her zaman negatif olmayan çıkar. (Sıfıra doğru kesme kullanılırsa r negatif çıkar; bu burada yanlış olur.)' : ''),
        `n = ⌊x/p⌋ = ⌊${xt}/${per}⌋ = ⌊${Pk(x0 / per)}⌋ = ${nS}, r = x − n·p = ${xt} − (${nS})·${per} = ${Pk(r)}.\nCheck: 0 ≤ r < ${per} ✓ and ${nS}·${per} + ${Pk(r)} = ${Pk(nn * per + r)} = x ✓.` +
        (x0 < 0 ? '\nFor negative x the floor rounds DOWN (−1.75 → −2), so r always comes out non-negative. Truncating toward zero would give a negative r, which is wrong here.' : '')));
    const an = Math.abs(Math.trunc(nn));
    L.push(Hdr(3, 'Periyodiklikle temel aralığa taşıyalım', 'Use periodicity to move to the base period') +
      tx(`f(x + p) = f(x) eşitliğini |n| = ${an} kez uygulayarak x'i ${an} periyot ${nn >= 0 ? 'sola' : 'sağa'} kaydırırız: f(x) = f(x − n·p) = f(${xt} − (${nS})·${per}) = f(${Pk(r)}).`,
        `Applying f(x + p) = f(x) |n| = ${an} times moves x by ${an} periods to the ${nn >= 0 ? 'left' : 'right'}: f(x) = f(x − n·p) = f(${xt} − (${nS})·${per}) = f(${Pk(r)}).`));
    L.push(Hdr(4, 'Kuralı uygulayalım', 'Apply the rule') +
      tx(`r = ${Pk(r)} ∈ [0, ${per}) olduğundan temel kural geçerli: ${branch}.`, `Since r = ${Pk(r)} ∈ [0, ${per}) the base rule applies: ${branch}.`) + '\n' +
      tx(`Sonuç: f(${xt}) = ${Pk(fr)}.`, `Result: f(${xt}) = ${Pk(fr)}.`));
    const fm = EvalD(p, x0 - per), fp = EvalD(p, x0 + per);
    L.push(Hdr(5, 'Kontrol edelim', 'Check') +
      tx(`f(${Pk(x0 - per)}) = ${Pk(fm)},  f(${xt}) = ${Pk(EvalD(p, x0))},  f(${Pk(x0 + per)}) = ${Pk(fp)}: p kadar kaydırınca değer değişmez ✓. Grafikte sarı nokta (x, f(x)) ile mor nokta (r, f(r)) aynı yüksekliktedir; gölgeli bant temel periyottur.`,
        `f(${Pk(x0 - per)}) = ${Pk(fm)},  f(${xt}) = ${Pk(EvalD(p, x0))},  f(${Pk(x0 + per)}) = ${Pk(fp)}: shifting by p leaves the value unchanged ✓. On the graph the gold point (x, f(x)) and the purple point (r, f(r)) have the same height; the shaded band is the base period.`));
    L.push(Hdr(6, 'Süreksizlikler', 'Discontinuities') +
      (shp === 1
        ? tx('Üçgen dalga süreklidir: yarıda ve periyot sonunda parçalar birleşir.', 'The triangle wave is continuous: the pieces join at the half period and at the end of each period.')
        : tx('Parça uçlarında sıçrama olabilir: x = kp noktasında değer, sağdaki parçanın başlangıç değeridir (dolu nokta); soldan limit ise içi boş noktadır.', 'There may be jumps at the piece boundaries: at x = k·p the value is the start value of the piece on the right (filled dot); the limit from the left is the hollow dot.')));
    return L;
  }

  function ViewD(p) {
    const per = Math.max(2, p.period);
    const shp = Shape(p);
    const x0 = p.testX;
    const r = x0 - Math.floor(x0 / per) * per;
    const cx = (r + x0) / 2;
    const hw = Math.max(2.5 * per, Math.abs(x0 - r) / 2 + 1.2 * per);
    let ymin, ymax;
    switch (shp) {
      case 0: ymin = -0.25 * per; ymax = 1.3 * per; break;
      case 1: ymin = -0.2 * per; ymax = 0.8 * per; break;
      case 2: ymin = -1.8; ymax = 1.8; break;
      default: ymin = -0.25 * per * per; ymax = 1.3 * per * per;
    }
    return { xmin: Math.min(-1.5 * per, x0 - 0.7 * per), xmax: Math.max(3.5 * per, x0 + 0.7 * per), ymin, ymax, cx, cy: (ymin + ymax) / 2 };
  }

  function DrawD(canvas, p) {
    const per = Math.max(2, p.period);
    const shp = Shape(p);
    const x0 = p.testX;
    const vw = ViewD(p);
    const xmin = vw.xmin, xmax = vw.xmax, ymin = vw.ymin, ymax = vw.ymax;
    canvas.setViewport(xmin, xmax, ymin, ymax);
    const gap = (xmax - xmin) / 450.0;
    const jumps = shp !== 1;
    const step0 = shp === 2 ? per / 2.0 : per;
    canvas.addRegion({ xMin: 0, xMax: per, color: 'rgba(255,165,0,0.16)' });
    canvas.addFunction({
      evaluator: (x) => {
        if (jumps) {
          const q = x / step0;
          if (Math.abs(q - Math.round(q)) * step0 < gap) return NaN;
        }
        return EvalD(p, x);
      },
      color: BLUE, thickness: 3.5,
    });
    if (jumps) {
      const j0 = Math.floor(xmin / step0), j1 = Math.ceil(xmax / step0);
      for (let j = j0; j <= j1; j++) {
        const xb = j * step0;
        const vRight = EvalD(p, xb + 1e-7);
        const vLeft = EvalD(p, xb - 1e-7);
        if (Math.abs(vRight - vLeft) > 1e-6) {
          canvas.addMarker({ x: xb, y: vRight, color: BLUE, radius: 4 });
          canvas.addMarker({ x: xb, y: vLeft, color: BLUE, hollow: true, radius: 4 });
        }
      }
    }
    const nn = Math.floor(x0 / per);
    const r = x0 - nn * per;
    const fr = EvalD(p, x0);
    canvas.addSegment({ x1: r, y1: fr, x2: x0, y2: fr, color: ORCHID, dashed: true, thickness: 1.5 });
    canvas.addMarker({ x: r, y: fr, color: ORCHID, shape: 'square', radius: 6, label: `f(r) = ${Pk(fr)}, r = ${Pk(r)}` });
    canvas.addMarker({ x: x0, y: fr, color: canvas.gold(), radius: 7, label: `f(${Pk(x0)}) = ${Pk(fr)}` });
    const span = ymax - ymin;
    AddArrow(canvas, 0, per, ymax - 0.1 * span, 0.04 * per, 0.025 * span, ORANGE_D);
    canvas.addMarker({ x: per / 2.0, y: ymax - 0.055 * span, color: ORANGE_D, radius: 1.5, label: 'p = ' + per });
  }

  // ================= problem statement / dispatch =================
  function problemStatement(p) {
    switch (p.kind) {
      case 0: {
        const fx = FuncAText(p);
        if (p.fn === 2) {
          return tx(`f(x) = ${fx} fonksiyonunun periyodunu, faz kaymasını ve düşey kaymasını (orta çizgisini) bulalım; dikey asimptotlarını da söyleyelim.`,
            `For f(x) = ${fx}, let's find the period, the phase shift and the vertical shift (midline), and say where the vertical asymptotes are.`);
        }
        return tx(`f(x) = ${fx} fonksiyonunun periyodunu, genliğini, faz kaymasını ve düşey kaymasını bulalım.`,
          `For f(x) = ${fx}, let's find the period, the amplitude, the phase shift and the vertical shift.`);
      }
      case 1: {
        const t = TermTxt(p.fn, p.ia) + ' + ' + TermTxt(p.fn2, p.ib);
        return tx(`f(x) = ${t} fonksiyonunun periyodunu (OKEK ile) bulalım.`, `Let's find the period of f(x) = ${t} (using the LCM of the two periods).`);
      }
      case 2: {
        const nm = NameC(p);
        return tx(`f(x) = ${nm} fonksiyonu periyodik midir? Periyodik ise periyodunu bulalım.`, `Is f(x) = ${nm} periodic? If so, let's find its period.`);
      }
      default: {
        const per = Math.max(2, p.period);
        const rule = RuleText(Shape(p), per);
        const xt = Pk(p.testX);
        return tx(`Periyodu ${per} olan ve [0, ${per}) aralığında ${rule} olan fonksiyon için f(${xt}) değerini bulalım.`,
          `A function has period ${per} and on [0, ${per}) it is given by ${rule}. Let's find f(${xt}).`);
      }
    }
  }

  function solveSteps(p) {
    switch (p.kind) {
      case 0: return StepsA(p);
      case 1: return StepsB(p);
      case 2: return StepsC(p);
      default: return StepsD(p);
    }
  }

  function draw(canvas, p) {
    switch (p.kind) {
      case 0: DrawA(canvas, p); break;
      case 1: DrawB(canvas, p); break;
      case 2: DrawC(canvas, p); break;
      default: DrawD(canvas, p);
    }
  }

  function focus(p) {
    switch (p.kind) {
      case 0: return { x: StartA(p), y: p.d };
      case 1: {
        const P0 = LcmPeriod(p).ln / LcmPeriod(p).ld * Math.PI;
        const f = (x) => EvalB(p, x);
        let xd = Fmod(FindDefined(f, P0, p.testX), P0);
        xd = FindDefined(f, P0, xd);
        return { x: Math.min(xd + P0 / 2, 0.8 * P0), y: 0 };
      }
      case 2: { const v = ViewC(p); return { x: (v.xmin + v.xmax) / 2, y: (v.ymin + v.ymax) / 2 }; }
      default: { const v = ViewD(p); return { x: v.cx, y: v.cy }; }
    }
  }

  // ================= controls =================
  const RoundInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
  let offLang = null;

  function buildControls(rightCol, getProblem, h) {
    const kindLabels = () => [
      tx('a) A·sin(Bx + C) + D periyodu', 'a) Period of A·sin(Bx + C) + D'),
      tx('b) Toplamın periyodu (OKEK)', 'b) Period of a sum (LCM)'),
      tx('c) Periyodik mi?', 'c) Is it periodic?'),
      tx('d) Periyodik uzantı', 'd) Periodic extension'),
    ];
    kindSel = h.addSelect({
      options: kindLabels().map((label, value) => ({ label, value })),
      get: () => getProblem().kind,
      set: (v) => { forcedKind = Number(v); h.regenerate(); forcedKind = -1; },
    });
    if (offLang) offLang();
    offLang = I18N.onChange(() => {
      const ls = kindLabels();
      for (let i = 0; i < kindSel.select.options.length && i < ls.length; i++) kindSel.select.options[i].textContent = ls[i];
    });

    h.addSlider({ caption: tx('Deneme noktası x', 'Test point x'), min: -10, max: 10,
      get: () => getProblem().testX,
      set: (v) => { const p = getProblem(); p.testX = p.kind === 3 ? Math.round(v * 2.0) / 2.0 : Math.round(v * 10) / 10; if (p.testX === 0) p.testX = 0; } });
    h.addSlider({ caption: tx('A: genlik (a)', 'A: amplitude (a)'), min: -3, max: 3,
      get: () => getProblem().a, set: (v) => { const r = RoundInt(v, -3, 3); getProblem().a = r === 0 ? 1 : r; } });
    h.addSlider({ caption: tx('B (a): 0,5 … 4', 'B (a): 0.5 … 4'), min: 0.5, max: 4,
      get: () => getProblem().b2 / 2.0, set: (v) => { getProblem().b2 = RoundInt(v * 2.0, 1, 8); } });
    h.addSlider({ caption: tx("C (a): π/6'nın katı (−6 … 6)", 'C (a): multiples of π/6 (−6 … 6)'), min: -6, max: 6,
      get: () => getProblem().cq, set: (v) => { getProblem().cq = RoundInt(v, -6, 6); } });
    h.addSlider({ caption: tx('D: düşey kayma (a)', 'D: vertical shift (a)'), min: -2, max: 2,
      get: () => getProblem().d, set: (v) => { getProblem().d = RoundInt(v, -2, 2); } });
    h.addSlider({ caption: tx('Fonksiyon (a, b: 1 sin, 2 cos, 3 tan)', 'Function (a, b: 1 sin, 2 cos, 3 tan)'), min: 1, max: 3,
      get: () => getProblem().fn + 1, set: (v) => { getProblem().fn = RoundInt(v, 1, 3) - 1; } });
    h.addSlider({ caption: tx('1. terimin açı çarpanı (b)', 'Angle factor of term 1 (b)'), min: 1, max: 6,
      get: () => getProblem().ia, set: (v) => { getProblem().ia = RoundInt(v, 1, 6); } });
    h.addSlider({ caption: tx('2. terimin açı çarpanı (b)', 'Angle factor of term 2 (b)'), min: 1, max: 6,
      get: () => getProblem().ib, set: (v) => { getProblem().ib = RoundInt(v, 1, 6); } });
    h.addSlider({ caption: tx('k (c): 1 … 4', 'k (c): 1 … 4'), min: 1, max: 4,
      get: () => getProblem().k, set: (v) => { getProblem().k = RoundInt(v, 1, 4); } });
    h.addSlider({ caption: tx('Durum no (c: 1–6, d: şekil 1–4)', 'Case no. (c: 1–6, d: shape 1–4)'), min: 1, max: 6,
      get: () => getProblem().caseNo + 1, set: (v) => { getProblem().caseNo = RoundInt(v, 1, 6) - 1; } });
    h.addSlider({ caption: tx('Periyot p (d): 2 … 5', 'Period p (d): 2 … 5'), min: 2, max: 5,
      get: () => getProblem().period, set: (v) => { getProblem().period = RoundInt(v, 2, 5); } });
  }

  Topics.register('trig', {
    id: 'periodicFunctions',
    tabTitle: () => tx('Periyodik Fonksiyonlar', 'Periodic Functions'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    links: [
      { match: /^\s+sin x, cos x, sec x, csc x : 2π/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: rng.nextInt(0, 2) }) },
      { match: /^\s+tan x, cot x : π/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: 2 }) },
      { match: /^\s+(Faz kayması|Phase shift):/, make: (rng) => Object.assign(genProblem(rng, 0), { cq: rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]) }) },
      { match: /^\s+(Düşey kayma|Vertical shift) D:/, make: (rng) => Object.assign(genProblem(rng, 0), { fn: rng.nextInt(0, 2), d: rng.pick([-2, -1, 1, 2]) }) },
      { match: /^(TOPLAMLARIN PERİYODU|PERIOD OF A SUM)$/, make: (rng) => genProblem(rng, 1) },
      { match: /^(PERİYODİK Mİ\?|IS IT PERIODIC\?)$/, make: (rng) => genProblem(rng, 2) },
      { match: /^(PERİYODİK UZANTI|PERIODIC EXTENSION)$/, make: (rng) => genProblem(rng, 3) },
    ],
    draw,
    focus,
    buildControls,
  });
})();
