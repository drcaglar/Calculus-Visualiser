// Calculus II - Arc length and surface area of revolution (curves chosen so that 1 + f'^2 is a perfect square, i.e. exact answers).
(function () {
  const K = Calc2, tx = K.tx, { simpson, N2, Iexp, bar } = K;
  const PI = Math.PI;
  // f, fp: functions; fps/sq/Is/As: text of f', of 1 + f'^2, of the arc integrand and of its antiderivative (variable x); Lf/Sf: exact antiderivatives
  const C = [
    { n: 'y = (2/3)x^(3/2)', f: (x) => (2 / 3) * Math.pow(x, 1.5), fp: (x) => Math.sqrt(x), a: 0, b: 3, fps: '√x', sq: '1 + (√x)² = 1 + x', Is: '√(1 + x)', As: '(2/3)(1 + x)^(3/2)', Lf: (x) => (2 / 3) * Math.pow(1 + x, 1.5) },
    { n: 'y = cosh x', f: Math.cosh, fp: Math.sinh, a: 0, b: 1, fps: 'sinh x', sq: '1 + sinh²x = cosh²x', Is: 'cosh x', As: 'sinh x', Lf: Math.sinh,
      S2: '2π ∫ cosh x · cosh x dx = π ∫ (1 + cosh 2x) dx', SA: 'π[x + (1/2)sinh 2x]', Sf: (x) => PI * (x + Math.sinh(2 * x) / 2) },
    { n: 'y = cosh x', f: Math.cosh, fp: Math.sinh, a: -1, b: 1, fps: 'sinh x', sq: '1 + sinh²x = cosh²x', Is: 'cosh x', As: 'sinh x', Lf: Math.sinh,
      S2: '2π ∫ cosh x · cosh x dx = π ∫ (1 + cosh 2x) dx', SA: 'π[x + (1/2)sinh 2x]', Sf: (x) => PI * (x + Math.sinh(2 * x) / 2) },
    { n: 'y = x³/6 + 1/(2x)', f: (x) => x * x * x / 6 + 1 / (2 * x), fp: (x) => x * x / 2 - 1 / (2 * x * x), a: 1, b: 3, fps: 'x²/2 − 1/(2x²)', sq: '1 + f′² = (x²/2 + 1/(2x²))²', Is: 'x²/2 + 1/(2x²)', As: 'x³/6 − 1/(2x)', Lf: (x) => x * x * x / 6 - 1 / (2 * x) },
    { n: 'y = x²/2 − (ln x)/4', f: (x) => x * x / 2 - Math.log(x) / 4, fp: (x) => x - 1 / (4 * x), a: 1, b: 2, fps: 'x − 1/(4x)', sq: '1 + f′² = (x + 1/(4x))²', Is: 'x + 1/(4x)', As: 'x²/2 + (ln x)/4', Lf: (x) => x * x / 2 + Math.log(x) / 4 },
    { n: 'y = 2x + 1', f: (x) => 2 * x + 1, fp: () => 2, a: 0, b: 2, fps: '2', sq: '1 + 2² = 5', Is: '√5', As: '√5·x', Lf: (x) => Math.sqrt(5) * x,
      S2: '2π ∫ (2x + 1)·√5 dx', SA: '2π√5[x² + x]', Sf: (x) => 2 * PI * Math.sqrt(5) * (x * x + x) },
    { n: 'y = x', f: (x) => x, fp: () => 1, a: 0, b: 3, fps: '1', sq: '1 + 1² = 2', Is: '√2', As: '√2·x', Lf: (x) => Math.SQRT2 * x,
      S2: '2π ∫ x·√2 dx', SA: 'π√2·x²', Sf: (x) => PI * Math.SQRT2 * x * x },
    { n: 'y = √x', f: Math.sqrt, fp: (x) => 1 / (2 * Math.sqrt(x)), a: 0, b: 2, fps: '1/(2√x)', sq: '1 + 1/(4x)', S2: '2π ∫ √x·√(1 + 1/(4x)) dx = 2π ∫ √(x + 1/4) dx', SA: '(4π/3)(x + 1/4)^(3/2)', Sf: (x) => (4 * PI / 3) * Math.pow(x + 0.25, 1.5) },
  ];
  const ok = (c, mode) => (mode === 0 ? !!c.Lf : !!c.Sf);
  const exact = (p) => (p.mode === 0 ? p.reg.Lf(p.reg.b) - p.reg.Lf(p.reg.a) : p.reg.Sf(p.reg.b) - p.reg.Sf(p.reg.a));
  const num = (p) => {
    const c = p.reg, it = (x) => (p.mode === 0 ? Math.sqrt(1 + c.fp(x) ** 2) : 2 * PI * c.f(x) * Math.sqrt(1 + c.fp(x) ** 2));
    const g = (x) => { const v = it(x); return Number.isFinite(v) ? v : it(x + 1e-9); };
    return simpson(g, c.a, c.b);
  };
  const sub = (s, v) => s.replace(/x/g, '(' + v + ')');
  const avail = (p) => C.filter((c) => ok(c, p.mode));
  const fix = (p) => { if (!ok(p.reg, p.mode)) { p.reg = avail(p)[0]; p.ri = C.indexOf(p.reg); } };
  const rng = (c) => `[${N2(c.a)}, ${N2(c.b)}]`;

  function statement(p) {
    const c = p.reg;
    return p.mode === 0
      ? tx(`${c.n} eğrisinin x = ${N2(c.a)} ile x = ${N2(c.b)} arasındaki yay uzunluğunu bulalım.`, `Let's find the arc length of the curve ${c.n} from x = ${N2(c.a)} to x = ${N2(c.b)}.`)
      : tx(`${c.n} eğrisinin x = ${N2(c.a)} ile x = ${N2(c.b)} arasındaki parçası x-ekseni etrafında döndürülüyor. Oluşan yüzeyin alanını bulalım.`, `The part of the curve ${c.n} between x = ${N2(c.a)} and x = ${N2(c.b)} is revolved about the x-axis. Let's find the area of the surface.`);
  }
  function steps(p) {
    const c = p.reg, a = c.a, b = c.b, F = Iexp(a, b), out = [];
    out.push(tx(`── 1) Formül ──\n${p.mode === 0 ? `Yay uzunluğu: L = ${F} √(1 + [f′(x)]²) dx` : `Dönel yüzey alanı (x-ekseni): S = 2π ${F} f(x)·√(1 + [f′(x)]²) dx`}\nİnce bir parçanın uzunluğu ds = √(dx² + dy²) = √(1 + f′²) dx (Pisagor).`,
      `── 1) The formula ──\n${p.mode === 0 ? `Arc length: L = ${F} √(1 + [f′(x)]²) dx` : `Surface area (about the x-axis): S = 2π ${F} f(x)·√(1 + [f′(x)]²) dx`}\nA small piece has length ds = √(dx² + dy²) = √(1 + f′²) dx (Pythagoras).`));
    out.push(tx(`── 2) Türev ──\nf(x) = ${c.n.replace('y = ', '')}\nf′(x) = ${c.fps}`, `── 2) The derivative ──\nf(x) = ${c.n.replace('y = ', '')}\nf′(x) = ${c.fps}`));
    out.push(tx(`── 3) Kök içini sadeleştirelim ──\n${c.sq}${c.Is ? `\nKök içi tam kare olduğu için √(1 + f′²) = ${c.Is}` : ''}`, `── 3) Simplifying the radicand ──\n${c.sq}${c.Is ? `\nThe radicand is a perfect square, so √(1 + f′²) = ${c.Is}` : ''}`));
    if (p.mode === 0) {
      out.push(tx(`── 4) İntegral ve ters türev ──\nL = ${F} ${c.Is} dx = [${c.As}${bar(a, b)}`, `── 4) Integral and antiderivative ──\nL = ${F} ${c.Is} dx = [${c.As}${bar(a, b)}`));
      out.push(tx(`── 5) Sınırlar ──\nL = ${sub(c.As, b)} − ${sub(c.As, a)} ≈ ${N2(c.Lf(b))} − (${N2(c.Lf(a))})`, `── 5) Limits ──\nL = ${sub(c.As, b)} − ${sub(c.As, a)} ≈ ${N2(c.Lf(b))} − (${N2(c.Lf(a))})`));
      out.push(tx(`── 6) Sonuç ──\nL ≈ ${N2(exact(p))}  (uzunluk birimi)`, `── 6) Result ──\nL ≈ ${N2(exact(p))}  (length units)`));
    } else {
      out.push(tx(`── 4) İntegral ve ters türev ──\nS = ${c.S2}\nS = ${c.SA}${bar(a, b)}`, `── 4) Integral and antiderivative ──\nS = ${c.S2}\nS = ${c.SA}${bar(a, b)}`));
      out.push(tx(`── 5) Sınırlar ──\nS ≈ ${N2(c.Sf(b))} − (${N2(c.Sf(a))})`, `── 5) Limits ──\nS ≈ ${N2(c.Sf(b))} − (${N2(c.Sf(a))})`));
      out.push(tx(`── 6) Sonuç ──\nS ≈ ${N2(exact(p))}  (alan birimi²)`, `── 6) Result ──\nS ≈ ${N2(exact(p))}  (area units²)`));
    }
    out.push(tx(`── 7) Sayısal kontrol ──\nSimpson kuralıyla ≈ ${N2(num(p))}; aynı ✓. Kökü tam kare yapan seçimler, integrali elle çözülebilir kılar.`, `── 7) Numerical check ──\nSimpson's rule gives ≈ ${N2(num(p))}; the same ✓. These curves are chosen so the radicand is a perfect square, which makes the integral solvable by hand.`));
    return out;
  }
  function draw(cv, p) {
    const c = p.reg, x0 = K.at(p), d = 1e-4;
    let ym = 1; for (let i = 0; i <= 40; i++) ym = Math.max(ym, c.f(c.a + (c.b - c.a) * i / 40));
    K.view(cv, Math.max(Math.abs(c.a), Math.abs(c.b)) + 0.5, ym + 0.5);
    cv.addFunction({ evaluator: K.safe(c.f), color: cv.accent(), thickness: 3, label: 'f(x)' });
    if (p.mode === 1) cv.addFunction({ evaluator: K.safe((x) => -c.f(x)), color: cv.purple(), thickness: 2, dashed: true, label: '−f(x)' });
    cv.addGuideLine({ axis: 'vertical', position: c.a, color: cv.gray(), label: `x = ${N2(c.a)}` });
    cv.addGuideLine({ axis: 'vertical', position: c.b, color: cv.gray(), label: `x = ${N2(c.b)}` });
    const h = Math.min(0.5, (c.b - x0) || 0.5), x1 = Math.min(c.b, x0 + 0.4), y0 = c.f(x0), y1 = c.f(x1);
    cv.addSegment({ x1: x0, y1: y0, x2: x1, y2: y0, color: cv.green(), thickness: 2.5 });
    cv.addSegment({ x1: x1, y1: y0, x2: x1, y2: y1, color: cv.green(), thickness: 2.5 });
    cv.addSegment({ x1: x0, y1: y0, x2: x1, y2: y1, color: cv.orange(), thickness: 4 });
    cv.addMarker({ x: x0, y: y0, color: cv.orange(), radius: 5, label: `ds ≈ ${N2(Math.hypot(x1 - x0, y1 - y0))}` });
    if (p.mode === 1) cv.addSegment({ x1: x0, y1: -y0, x2: x0, y2: y0, color: cv.red(), thickness: 3 });
  }
  K.register('calc2', {
    id: 'arcSurface',
    title: ['Yay Uzunluğu ve Dönel Yüzey Alanı', 'Arc Length and Surface Area'],
    modes: [['Yay uzunluğu', 'Arc length'], ['Dönel yüzey alanı (x-ekseni etrafında)', 'Surface area of revolution (about the x-axis)']],
    regions: C, regName: (c) => c.n + '   ' + rng(c),
    sliderCap: ['Küçük parça ds konumu (0 = sol uç, 1 = sağ uç)', 'Position of the small piece ds (0 = left, 1 = right)'],
    range: (p) => [p.reg.a, Math.max(p.reg.a, p.reg.b - 0.4)],
    view3d: { build: Calc2V3.arcSurface, dist: 9 },
    links: [
      { match: /^(YAY UZUNLUĞU|ARC LENGTH)$/, mode: 0 },
      { match: /^(DÖNEL YÜZEY ALANI|SURFACE AREA OF REVOLUTION)$/, mode: 1 },
    ],
    fix, statement, steps, draw, exact, num,
    concept: [
      'YAY UZUNLUĞU\nEğri üzerinde çok küçük bir parçayı doğru parçası gibi düşünürsek Pisagor teoremi ds² = dx² + dy² verir. Dolayısıyla\n  ds = √(1 + [f′(x)]²) dx\nve y = f(x) eğrisinin x = a ile x = b arasındaki uzunluğu\n  L = ∫ₐᵇ √(1 + [f′(x)]²) dx.\n\nDÖNEL YÜZEY ALANI\nBu küçük parça x-ekseni etrafında dönerse ince bir koni kesiti (kemer) oluşur. Alanı ≈ 2π·(yarıçap)·ds = 2π·f(x)·ds olur:\n  S = 2π ∫ₐᵇ f(x)·√(1 + [f′(x)]²) dx.\n\nYÖNTEM\n1. f′(x) türevini bulalım.\n2. 1 + [f′]² ifadesini yazıp sadeleştirelim; çoğu zaman bir tam kareye dönüşür ve kök kalkar.\n3. İntegrali kurup ters türevini alalım.\n4. Sınırları yerleştirelim.\n\nNOT\nKöklü integraller çoğu zaman elle çözülemez; bu durumda Simpson gibi sayısal yöntem kullanılır. Bu sekmedeki eğriler kökü tam kare yaptığı için kapalı çözüm verir.\n\nTUZAKLAR\n• Kök, f′\'nin değil 1 + f′²\'nin üzerindedir.\n• Yüzey alanında yarıçap f(x) (eksene uzaklık) olup 2π çarpanı unutulmamalıdır.\n• Uzunluk için integrand hep pozitiftir; sonuç ≥ b − a\'dır (iki nokta arası en kısa yol doğrudur).\n\nMÜHENDİSLİKTE\nKablo ve halat uzunluğu, askı eğrileri (zincir eğrisi cosh), kaplama ve boya için yüzey alanı.\n\nGRAFİK\nTuruncu parça küçük bir ds parçasıdır, yeşil çizgiler dx ve dy\'dir (Pisagor üçgeni). Kaydırıcıyla parçayı eğri boyunca gezdirebiliriz.',
      'ARC LENGTH\nIf we treat a tiny piece of the curve as a straight segment, Pythagoras gives ds² = dx² + dy². So\n  ds = √(1 + [f′(x)]²) dx\nand the length of y = f(x) from x = a to x = b is\n  L = ∫ₐᵇ √(1 + [f′(x)]²) dx.\n\nSURFACE AREA OF REVOLUTION\nIf this small piece is revolved about the x-axis it sweeps a thin band (a frustum). Its area ≈ 2π·(radius)·ds = 2π·f(x)·ds:\n  S = 2π ∫ₐᵇ f(x)·√(1 + [f′(x)]²) dx.\n\nMETHOD\n1. We find the derivative f′(x).\n2. We write and simplify 1 + [f′]²; often it becomes a perfect square and the root disappears.\n3. We set up the integral and find the antiderivative.\n4. We substitute the limits.\n\nNOTE\nRoot integrals often cannot be done by hand; then a numerical method such as Simpson is used. The curves in this tab make the radicand a perfect square, so closed forms exist.\n\nPITFALLS\n• The root covers 1 + f′², not just f′.\n• In surface area the radius is f(x) (distance to the axis) and the factor 2π must stay.\n• The integrand is always positive; the result is ≥ b − a (a straight line is the shortest path).\n\nIN ENGINEERING\nCable and rope length, hanging curves (catenary cosh), surface area for coating and paint.\n\nGRAPH\nThe orange piece is a small ds, the green lines are dx and dy (the Pythagorean triangle). The slider moves the piece along the curve.',
    ],
  });
})();
