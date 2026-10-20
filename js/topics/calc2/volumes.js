// Calculus II - Volumes by slicing: disks / washers about the x-axis, and solids with known (square / semicircle) cross-sections.
(function () {
  const K = Calc2, tx = K.tx, { pEval, pMul, pAdd, pInt, pStr, wrap, simpson, frac, withPi, Iexp, bar, N2 } = K;
  const w = (r) => pAdd(r.f, r.g, -1);
  const f2g2 = (r) => pAdd(pMul(r.f, r.f), pMul(r.g, r.g), -1);
  const polyEval = (c) => (x) => pEval(c, x);
  const isDisk = (r) => r.g.length === 1 && r.g[0] === 0;
  const kind = (p) => [isDisk(p.reg) ? 'disk' : 'washer', 'square', 'semi'][p.mode];
  const integrand = (p) => (p.mode === 0 ? f2g2(p.reg) : pMul(w(p.reg), w(p.reg)));
  const factor = (p) => (p.mode === 0 ? Math.PI : p.mode === 1 ? 1 : Math.PI / 8);
  const exact = (p) => { const P = pInt(integrand(p)); return factor(p) * (pEval(P, p.reg.b) - pEval(P, p.reg.a)); };
  const num = (p) => factor(p) * simpson((x) => (p.mode === 0 ? Math.pow(pEval(p.reg.f, x), 2) - Math.pow(pEval(p.reg.g, x), 2) : Math.pow(pEval(p.reg.f, x) - pEval(p.reg.g, x), 2)), p.reg.a, p.reg.b);
  const coef = (p) => (p.mode === 0 ? 'π' : p.mode === 1 ? '' : 'π/8');

  function statement(p) {
    const r = p.reg, f = pStr(r.f), g = pStr(r.g);
    const base = isDisk(r) ? `y = ${f}, y = 0, x = ${N2(r.a)} ve x = ${N2(r.b)}` : `y = ${f} ve y = ${g} eğrileri ile x = ${N2(r.a)}, x = ${N2(r.b)} doğruları`;
    const baseEn = isDisk(r) ? `y = ${f}, y = 0, x = ${N2(r.a)} and x = ${N2(r.b)}` : `the curves y = ${f} and y = ${g} with the lines x = ${N2(r.a)}, x = ${N2(r.b)}`;
    if (p.mode === 0) return tx(`${base} arasında kalan bölge x-ekseni etrafında döndürülüyor. Oluşan cismin hacmini bulalım.`, `The region bounded by ${baseEn} is revolved about the x-axis. Let's find the volume of the solid.`);
    const sh = p.mode === 1 ? ['kare', 'squares'] : ['yarım daire', 'semicircles'];
    return tx(`Tabanı ${base} arasında kalan bölge olan bir cismin, x-eksenine dik kesitleri ${sh[0]}dir (taban, bölgenin üst ve alt eğri arasındaki kısmıdır). Cismin hacmini bulalım.`,
      `A solid has as its base the region bounded by ${baseEn}; its cross-sections perpendicular to the x-axis are ${sh[1]} (the side/diameter lies across the region). Let's find the volume.`);
  }

  function steps(p) {
    const r = p.reg, a = r.a, b = r.b, F = Iexp(a, b), I = integrand(p), P = pInt(I), Pb = pEval(P, b), Pa = pEval(P, a), V = exact(p);
    const res = p.mode === 1 ? frac(V) : p.mode === 0 ? withPi(Pb - Pa) : '(π/8)·(' + frac(Pb - Pa) + ')';
    const out = [];
    const D = isDisk(r);
    if (p.mode === 0) {
      out.push(tx(`── 1) ${D ? 'Disk' : 'Rondela (halka)'} yöntemi ──\nx noktasındaki kesit ${D ? 'bir disktir: A(x) = π·R²' : 'bir halkadır: A(x) = π·(R² − r²)'}.\nHacim = ${F} A(x) dx.`,
        `── 1) The ${D ? 'disk' : 'washer'} method ──\nThe slice at x is ${D ? 'a disk: A(x) = π·R²' : 'a ring: A(x) = π·(R² − r²)'}.\nVolume = ${F} A(x) dx.`));
      out.push(tx(`── 2) Yarıçaplar ──\nDış yarıçap R = f(x) = ${pStr(r.f)}${D ? '' : `\nİç yarıçap r = g(x) = ${pStr(r.g)}`}`,
        `── 2) Radii ──\nOuter radius R = f(x) = ${pStr(r.f)}${D ? '' : `\nInner radius r = g(x) = ${pStr(r.g)}`}`));
      out.push(tx(`── 3) İntegrali kuralım ──\nV = π ${F} [ (${pStr(r.f)})² ${D ? '' : `− (${pStr(r.g)})² `}] dx\nV = π ${F} (${pStr(I)}) dx`,
        `── 3) Setting up the integral ──\nV = π ${F} [ (${pStr(r.f)})² ${D ? '' : `− (${pStr(r.g)})² `}] dx\nV = π ${F} (${pStr(I)}) dx`));
    } else {
      out.push(tx(`── 1) Kesit alanı ──\nKesit kenarı (çapı) s(x) = f(x) − g(x) = ${pStr(w(r))}.\n${p.mode === 1 ? 'Kare: A(x) = s²' : 'Yarım daire: çap s ise yarıçap s/2 olur, A(x) = ½·π·(s/2)² = (π/8)·s²'}.\nHacim = ${F} A(x) dx.`,
        `── 1) Cross-section area ──\nThe side (diameter) is s(x) = f(x) − g(x) = ${pStr(w(r))}.\n${p.mode === 1 ? 'Square: A(x) = s²' : 'Semicircle: diameter s means radius s/2, so A(x) = ½·π·(s/2)² = (π/8)·s²'}.\nVolume = ${F} A(x) dx.`));
      out.push(tx(`── 2) İntegrali kuralım ──\nV = ${coef(p)} ${F} (${pStr(w(r))})² dx = ${coef(p)} ${F} (${pStr(I)}) dx`, `── 2) Setting up the integral ──\nV = ${coef(p)} ${F} (${pStr(w(r))})² dx = ${coef(p)} ${F} (${pStr(I)}) dx`));
    }
    const n = out.length;
    out.push(tx(`── ${n + 1}) Ters türev ──\nP(x) = ${pStr(P)}`, `── ${n + 1}) Antiderivative ──\nP(x) = ${pStr(P)}`));
    out.push(tx(`── ${n + 2}) Sınırları yerleştirelim ──\n[P(x)${bar(a, b)} = P(${N2(b)}) − P(${N2(a)}) = ${frac(Pb)} − (${frac(Pa)}) = ${frac(Pb - Pa)}`,
      `── ${n + 2}) Evaluating at the limits ──\n[P(x)${bar(a, b)} = P(${N2(b)}) − P(${N2(a)}) = ${frac(Pb)} − (${frac(Pa)}) = ${frac(Pb - Pa)}`));
    out.push(tx(`── ${n + 3}) Sonuç ──\nV = ${res} ≈ ${N2(V)}  (birim³)`, `── ${n + 3}) Result ──\nV = ${res} ≈ ${N2(V)}  (units³)`));
    out.push(tx(`── ${n + 4}) Sayısal kontrol ──\nSimpson kuralıyla ≈ ${N2(num(p))}; kapalı çözümle aynı ✓.`, `── ${n + 4}) Numerical check ──\nSimpson's rule gives ≈ ${N2(num(p))}, the same as the closed form ✓.`));
    return out;
  }

  function draw(c, p) {
    const r = p.reg, f = polyEval(r.f), g = polyEval(r.g), x0 = K.at(p);
    let ym = 1; for (let i = 0; i <= 40; i++) ym = Math.max(ym, Math.abs(f(r.a + (r.b - r.a) * i / 40)));
    K.view(c, Math.max(Math.abs(r.a), Math.abs(r.b)) + 0.5, ym + 0.5);
    c.addFilledArea({ evaluator: f, baseEvaluator: g, xMin: r.a, xMax: r.b, color: K.col(c, 'accent', 0.3) });
    c.addFunction({ evaluator: f, color: c.accent(), thickness: 3, label: 'f(x)' });
    if (!isDisk(r)) c.addFunction({ evaluator: g, color: c.green(), thickness: 2.5, label: 'g(x)' });
    if (p.mode === 0) {
      c.addFunction({ evaluator: (x) => -f(x), color: c.purple(), thickness: 2, dashed: true, label: '−f(x)' });
      if (!isDisk(r)) c.addFunction({ evaluator: (x) => -g(x), color: c.purple(), thickness: 2, dashed: true });
      c.addSegment({ x1: x0, y1: -f(x0), x2: x0, y2: f(x0), color: c.orange(), thickness: 4 });
      if (!isDisk(r)) c.addSegment({ x1: x0, y1: -g(x0), x2: x0, y2: g(x0), color: c.red(), thickness: 4 });
      c.addMarker({ x: x0, y: f(x0), color: c.orange(), radius: 5, label: `R = ${N2(f(x0))}` });
    } else {
      c.addSegment({ x1: x0, y1: g(x0), x2: x0, y2: f(x0), color: c.orange(), thickness: 5 });
      c.addMarker({ x: x0, y: f(x0), color: c.orange(), radius: 5, label: `s = ${N2(f(x0) - g(x0))}` });
    }
    c.addGuideLine({ axis: 'vertical', position: r.a, color: c.gray(), label: `x = ${N2(r.a)}` });
    c.addGuideLine({ axis: 'vertical', position: r.b, color: c.gray(), label: `x = ${N2(r.b)}` });
  }

  K.register('calc2', {
    id: 'volumes',
    title: ['Hacim: Kesit, Disk ve Rondela', 'Volumes: Slicing, Disks and Washers'],
    modes: [['x-ekseni etrafında dönme (disk / rondela)', 'Revolution about the x-axis (disk / washer)'], ['Kesitleri kare olan cisim', 'Square cross-sections'], ['Kesitleri yarım daire olan cisim', 'Semicircular cross-sections']],
    sliderCap: ['Kesit konumu x (0 = sol uç, 1 = sağ uç)', 'Slice position x (0 = left end, 1 = right end)'],
    range: (p) => [p.reg.a, p.reg.b],
    links: [
      { match: /^• Disk:/, mode: 0, region: (r) => r.g.length === 1 && r.g[0] === 0 },
      { match: /^• (Rondela \(halka\)|Washer):/, mode: 0, region: (r) => !(r.g.length === 1 && r.g[0] === 0) },
      { match: /^(BİLİNEN KESİTLİ CİSİMLER|KNOWN CROSS-SECTIONS)$/, mode: 1 },
    ],
    view3d: { build: Calc2V3.volumes, dist: 9 },
    statement, steps, draw, exact, num,
    concept: [
      'HACİM: İNCE DİLİMLERİ TOPLAMAK\nBir cismi x-eksenine dik ince dilimlere kesersek her dilimin hacmi yaklaşık A(x)·dx olur. Dilimleri toplayıp dx → 0 yaptığımızda:\n  V = ∫ₐᵇ A(x) dx\nA(x), x noktasındaki kesit alanıdır. Asıl iş, A(x) ifadesini doğru yazmaktır.\n\nDÖNEL CİSİMLER (x-ekseni etrafında)\n• Disk: bölge eksene değiyorsa kesit bir dairedir: A = π·R² = π·[f(x)]², V = π ∫ₐᵇ [f(x)]² dx.\n• Rondela (halka): bölge ile eksen arasında boşluk varsa kesit halkadır: A = π(R² − r²), V = π ∫ₐᵇ ([f(x)]² − [g(x)]²) dx. R dış, r iç yarıçaptır.\n\nBİLİNEN KESİTLİ CİSİMLER\nTaban bölgesinin genişliği s(x) = f(x) − g(x) ise:\n  kare: A = s²  •  yarım daire: A = (π/8)s²  •  eşkenar üçgen: A = (√3/4)s²\n\nYÖNTEM\n1. Bölgeyi çizeriz ve tipik bir dilim seçeriz.\n2. Dilimin kesit alanını (ya da R ve r) x cinsinden yazarız.\n3. İntegrali kurar, sınırları bölgenin uçlarına koyarız.\n4. Ters türevi alıp sınırlarda değerlendiririz.\n\nTUZAKLAR\n• Rondelada (R − r)² ile R² − r² aynı şey değildir: önce kareleri alırız, sonra çıkarırız.\n• Dönme ekseni değişirse R ve r değişir.\n• Hacim birimi uzunluk³ olur.\n\nMÜHENDİSLİKTE\nMil, fıçı, şişe, nozul gibi dönel parçaların hacmi ve kütlesi (ρ·V) bu yöntemle bulunur.\n\nGRAFİK\nMavi bölge dönen alandır; kesikli mor eğriler dönüşün simetrik profilidir. Turuncu çizgi (kaydırıcıyla gezen) tipik bir diski, kırmızı çizgi rondeladaki deliği gösterir.',
      'VOLUME: ADDING UP THIN SLICES\nIf we cut a solid into thin slices perpendicular to the x-axis, each slice has volume about A(x)·dx. Adding them up and letting dx → 0:\n  V = ∫ₐᵇ A(x) dx\nA(x) is the cross-section area at x. The real work is writing A(x) correctly.\n\nSOLIDS OF REVOLUTION (about the x-axis)\n• Disk: if the region touches the axis the slice is a disk: A = π·R² = π·[f(x)]², V = π ∫ₐᵇ [f(x)]² dx.\n• Washer: if there is a gap between region and axis the slice is a ring: A = π(R² − r²), V = π ∫ₐᵇ ([f(x)]² − [g(x)]²) dx. R is the outer, r the inner radius.\n\nKNOWN CROSS-SECTIONS\nIf the width of the base region is s(x) = f(x) − g(x):\n  square: A = s²  •  semicircle: A = (π/8)s²  •  equilateral triangle: A = (√3/4)s²\n\nMETHOD\n1. We sketch the region and pick a typical slice.\n2. We write the slice area (or R and r) in terms of x.\n3. We set up the integral with the region ends as limits.\n4. We find the antiderivative and evaluate.\n\nPITFALLS\n• For washers (R − r)² is not R² − r²: we square first, then subtract.\n• If the axis of revolution changes, R and r change.\n• The unit of volume is length³.\n\nIN ENGINEERING\nThe volume and mass (ρ·V) of revolved parts such as shafts, barrels, bottles and nozzles come from this method.\n\nGRAPH\nThe blue region is the area being revolved; the dashed purple curves give the symmetric profile. The orange line (moved by the slider) shows a typical disk, the red line the hole of a washer.',
    ],
  });
})();
