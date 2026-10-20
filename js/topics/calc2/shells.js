// Calculus II - Cylindrical shells: a region revolved about a vertical line x = L (L = 0, -1 or b + 1).
(function () {
  const K = Calc2, tx = K.tx, { pEval, pMul, pAdd, pInt, pStr, wrap, simpson, frac, withPi, Iexp, bar, N2 } = K;
  const REGS = K.REG.filter((r) => r.a >= 0);
  const axisL = (p) => (p.mode === 0 ? 0 : p.mode === 1 ? -1 : p.reg.b + 1);
  const radius = (p) => (p.mode === 0 ? [0, 1] : p.mode === 1 ? [1, 1] : [p.reg.b + 1, -1]);
  const wd = (r) => pAdd(r.f, r.g, -1);
  const integrand = (p) => pMul(radius(p), wd(p.reg));
  const exact = (p) => { const P = pInt(integrand(p)); return 2 * Math.PI * (pEval(P, p.reg.b) - pEval(P, p.reg.a)); };
  const num = (p) => 2 * Math.PI * simpson((x) => Math.abs(x - axisL(p)) * (pEval(p.reg.f, x) - pEval(p.reg.g, x)), p.reg.a, p.reg.b);
  const regName = (r) => 'y = ' + pStr(r.f) + (r.g.length === 1 && r.g[0] === 0 ? '' : '  ,  y = ' + pStr(r.g)) + '   [' + N2(r.a) + ', ' + N2(r.b) + ']';

  function statement(p) {
    const r = p.reg, L = axisL(p), g0 = r.g.length === 1 && r.g[0] === 0;
    const ax = L === 0 ? tx('y-ekseni', 'the y-axis') : tx(`x = ${N2(L)} doğrusu`, `the line x = ${N2(L)}`);
    return tx(`${g0 ? `y = ${pStr(r.f)} eğrisi, x-ekseni` : `y = ${pStr(r.f)} ve y = ${pStr(r.g)} eğrileri`} ile x = ${N2(r.a)}, x = ${N2(r.b)} doğruları arasında kalan bölge ${ax} etrafında döndürülüyor. Silindirik kabuk yöntemiyle cismin hacmini bulalım.`,
      `The region bounded by ${g0 ? `the curve y = ${pStr(r.f)}, the x-axis` : `the curves y = ${pStr(r.f)} and y = ${pStr(r.g)}`} and the lines x = ${N2(r.a)}, x = ${N2(r.b)} is revolved about ${ax}. Let's find the volume with the cylindrical shell method.`);
  }
  function steps(p) {
    const r = p.reg, a = r.a, b = r.b, L = axisL(p), rad = radius(p), I = integrand(p), P = pInt(I), Pb = pEval(P, b), Pa = pEval(P, a), V = exact(p), F = Iexp(a, b);
    const radTxt = L === 0 ? 'x' : L < 0 ? `x + ${N2(-L)}` : `${N2(L)} − x`;
    const out = [];
    out.push(tx(`── 1) Kabuk fikri ──\nx noktasındaki ince dikey şeridi eksen etrafında döndürürsek ince bir silindir kabuk oluşur.\nKabuğun hacmi ≈ 2π·(yarıçap)·(yükseklik)·dx.\nV = 2π ${F} (yarıçap)(yükseklik) dx`,
      `── 1) The shell idea ──\nSpinning the thin vertical strip at x about the axis gives a thin cylindrical shell.\nShell volume ≈ 2π·(radius)·(height)·dx.\nV = 2π ${F} (radius)(height) dx`));
    out.push(tx(`── 2) Yarıçap ve yükseklik ──\nDönme ekseni ${L === 0 ? 'x = 0' : 'x = ' + N2(L)} olduğundan yarıçap = ${radTxt}.\nYükseklik = f(x) − g(x) = ${pStr(wd(r))}.`,
      `── 2) Radius and height ──\nThe axis is ${L === 0 ? 'x = 0' : 'x = ' + N2(L)}, so radius = ${radTxt}.\nHeight = f(x) − g(x) = ${pStr(wd(r))}.`));
    out.push(tx(`── 3) İntegrali kuralım ──\nV = 2π ${F} (${radTxt})(${pStr(wd(r))}) dx\nV = 2π ${F} (${pStr(I)}) dx`, `── 3) Setting up the integral ──\nV = 2π ${F} (${radTxt})(${pStr(wd(r))}) dx\nV = 2π ${F} (${pStr(I)}) dx`));
    out.push(tx(`── 4) Ters türev ──\nP(x) = ${pStr(P)}`, `── 4) Antiderivative ──\nP(x) = ${pStr(P)}`));
    out.push(tx(`── 5) Sınırları yerleştirelim ──\n[P(x)${bar(a, b)} = P(${N2(b)}) − P(${N2(a)}) = ${frac(Pb)} − (${frac(Pa)}) = ${frac(Pb - Pa)}`, `── 5) Evaluating at the limits ──\n[P(x)${bar(a, b)} = P(${N2(b)}) − P(${N2(a)}) = ${frac(Pb)} − (${frac(Pa)}) = ${frac(Pb - Pa)}`));
    out.push(tx(`── 6) Sonuç ──\nV = 2π·(${frac(Pb - Pa)}) = ${withPi(2 * (Pb - Pa))} ≈ ${N2(V)}  (birim³)`, `── 6) Result ──\nV = 2π·(${frac(Pb - Pa)}) = ${withPi(2 * (Pb - Pa))} ≈ ${N2(V)}  (units³)`));
    out.push(tx(`── 7) Sayısal kontrol ──\nSimpson kuralıyla ≈ ${N2(num(p))}; aynı ✓.`, `── 7) Numerical check ──\nSimpson's rule gives ≈ ${N2(num(p))}; the same ✓.`));
    return out;
  }
  function draw(c, p) {
    const r = p.reg, L = axisL(p), f = (x) => pEval(r.f, x), g = (x) => pEval(r.g, x), x0 = K.at(p);
    let ym = 1; for (let i = 0; i <= 40; i++) ym = Math.max(ym, f(r.a + (r.b - r.a) * i / 40));
    K.view(c, Math.max(Math.abs(L), Math.abs(r.b), Math.abs(r.a)) + 0.5, ym + 0.5);
    c.addFilledArea({ evaluator: f, baseEvaluator: g, xMin: r.a, xMax: r.b, color: K.col(c, 'accent', 0.3) });
    c.addFunction({ evaluator: f, color: c.accent(), thickness: 3, label: 'f(x)' });
    if (!(r.g.length === 1 && r.g[0] === 0)) c.addFunction({ evaluator: g, color: c.green(), thickness: 2.5, label: 'g(x)' });
    c.addGuideLine({ axis: 'vertical', position: L, color: c.purple(), label: tx('dönme ekseni', 'axis of revolution') });
    c.addSegment({ x1: x0, y1: g(x0), x2: x0, y2: f(x0), color: c.orange(), thickness: 5 });
    const ym2 = (f(x0) + g(x0)) / 2;
    c.addSegment({ x1: L, y1: ym2, x2: x0, y2: ym2, color: c.red(), thickness: 2.5, dashed: true });
    c.addMarker({ x: x0, y: f(x0), color: c.orange(), radius: 5, label: `h = ${N2(f(x0) - g(x0))}` });
    c.addMarker({ x: (L + x0) / 2, y: ym2, color: c.red(), radius: 4, label: `r = ${N2(Math.abs(x0 - L))}` });
  }
  K.register('calc2', {
    id: 'shells',
    title: ['Hacim: Silindirik Kabuk Yöntemi', 'Volumes: Cylindrical Shells'],
    modes: [['y-ekseni etrafında (x = 0)', 'About the y-axis (x = 0)'], ['x = −1 doğrusu etrafında', 'About the line x = −1'], ['Bölgenin sağındaki doğru etrafında (x = b + 1)', 'About the line to the right (x = b + 1)']],
    regions: REGS, regName,
    sliderCap: ['Kabuk konumu x (0 = sol uç, 1 = sağ uç)', 'Shell position x (0 = left end, 1 = right end)'],
    range: (p) => [p.reg.a, p.reg.b],
    view3d: { build: Calc2V3.shells, dist: 9 },
    links: [
      { match: /^• (Eksen x = 0 ise|Axis x = 0):/, mode: 0 },
      { match: /^• (Eksen x = L ise|Axis x = L):/, mode: [1, 2] },
    ],
    statement, steps, draw, exact, num,
    concept: [
      'SİLİNDİRİK KABUK YÖNTEMİ\nBölgeyi dönme eksenine PARALEL ince şeritlere böleriz. Bir şerit dönünce ince bir silindir kabuk (boru) olur. Kabuğu açarsak ince bir dikdörtgen levha elde ederiz:\n  hacim ≈ (çevre)·(yükseklik)·(kalınlık) = 2π·r·h·dx\nBütün kabukları toplarsak:\n  V = 2π ∫ₐᵇ (yarıçap)(yükseklik) dx\n\nYARIÇAP NEDİR?\n• Eksen x = 0 ise: yarıçap = x.\n• Eksen x = L ise: yarıçap = |x − L| (eksene olan uzaklık).\nYükseklik = f(x) − g(x) (üst − alt).\n\nDİSK / KABUK NE ZAMAN?\n• Şeritler dönme eksenine DİK ise disk/rondela (dx ya da dy kesiti).\n• Şeritler eksene PARALEL ise kabuk. Eksen y-ekseni ve fonksiyon y = f(x) ise kabuk genelde daha kolaydır, çünkü x\'ten y\'ye çevirmeye gerek kalmaz.\n\nYÖNTEM\n1. Bölgeyi çiz, dönme eksenini işaretle.\n2. Eksene paralel tipik bir şerit seç.\n3. Yarıçap r ve yükseklik h\'ı x cinsinden yaz.\n4. V = 2π ∫ r·h dx integralini kur, hesapla.\n\nTUZAKLAR\n• Eksen bölgenin içinden geçmemelidir.\n• Yarıçap, eksene olan uzaklıktır: eksen x = −1 ise r = x + 1, x = b + 1 ise r = b + 1 − x.\n• 2π çarpanı unutulmasın.\n\nMÜHENDİSLİKTE\nBoru, kovan, kasnak ve tüp gibi parçaların malzeme hacmi.\n\nGRAFİK\nMor çizgi dönme eksenidir. Turuncu şerit kabuğun yüksekliği h, kırmızı kesikli çizgi yarıçap r\'dir; kaydırıcıyla şeridi gezdirebiliriz.',
      'THE CYLINDRICAL SHELL METHOD\nWe cut the region into thin strips PARALLEL to the axis of revolution. A strip spun around the axis becomes a thin cylindrical shell (a tube). Unrolled it is a thin rectangle:\n  volume ≈ (circumference)·(height)·(thickness) = 2π·r·h·dx\nAdding all shells:\n  V = 2π ∫ₐᵇ (radius)(height) dx\n\nWHAT IS THE RADIUS?\n• Axis x = 0: radius = x.\n• Axis x = L: radius = |x − L| (the distance to the axis).\nHeight = f(x) − g(x) (top − bottom).\n\nDISKS OR SHELLS?\n• Strips PERPENDICULAR to the axis: disks/washers.\n• Strips PARALLEL to the axis: shells. About the y-axis with y = f(x), shells are usually easier because we do not need to solve for x in terms of y.\n\nMETHOD\n1. Sketch the region and mark the axis.\n2. Pick a typical strip parallel to the axis.\n3. Write the radius r and the height h in terms of x.\n4. Set up V = 2π ∫ r·h dx and evaluate.\n\nPITFALLS\n• The axis must not cut through the region.\n• The radius is the distance to the axis: axis x = −1 gives r = x + 1; axis x = b + 1 gives r = b + 1 − x.\n• Do not forget the factor 2π.\n\nIN ENGINEERING\nMaterial volume of pipes, sleeves, pulleys and tubes.\n\nGRAPH\nThe purple line is the axis. The orange strip is the shell height h, the red dashed line the radius r; the slider moves the strip.',
    ],
  });
})();
