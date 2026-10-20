// Calculus II - Moments and centre of mass (centroid) of a plane region between two curves, plus Pappus' theorem.
(function () {
  const K = Calc2, tx = K.tx, { pEval, pMul, pAdd, pInt, pStr, simpson, frac, withPi, Iexp, bar, N2 } = K;
  const wd = (r) => pAdd(r.f, r.g, -1);
  const mom = (r) => {
    const A = pInt(wd(r)), My = pInt(pMul([0, 1], wd(r))), Mx = pInt(pAdd(pMul(r.f, r.f), pMul(r.g, r.g), -1));
    const d = (P) => pEval(P, r.b) - pEval(P, r.a);
    const a = d(A), my = d(My), mx = d(Mx) / 2;
    return { A: a, My: my, Mx: mx, xb: my / a, yb: mx / a };
  };
  const exact = (p) => { const m = mom(p.reg); return m.A + 17 * m.xb + 101 * m.yb + (p.mode === 1 ? 1000 * 2 * Math.PI * m.yb * m.A : 0); };
  const num = (p) => {
    const r = p.reg, f = (x) => pEval(r.f, x), g = (x) => pEval(r.g, x);
    const A = simpson((x) => f(x) - g(x), r.a, r.b), xb = simpson((x) => x * (f(x) - g(x)), r.a, r.b) / A, yb = simpson((x) => (f(x) * f(x) - g(x) * g(x)) / 2, r.a, r.b) / A;
    const V = Math.PI * simpson((x) => f(x) * f(x) - g(x) * g(x), r.a, r.b);
    return A + 17 * xb + 101 * yb + (p.mode === 1 ? 1000 * V : 0);
  };
  const g0 = (r) => r.g.length === 1 && r.g[0] === 0;

  function statement(p) {
    const r = p.reg, base = g0(r) ? `y = ${pStr(r.f)}, y = 0` : `y = ${pStr(r.f)} ve y = ${pStr(r.g)}`, baseEn = g0(r) ? `y = ${pStr(r.f)}, y = 0` : `y = ${pStr(r.f)} and y = ${pStr(r.g)}`;
    const reg = tx(`${base} eğrileri ile x = ${N2(r.a)}, x = ${N2(r.b)} doğruları arasındaki düzgün (homojen) plakanın`, `the uniform plate bounded by ${baseEn} and the lines x = ${N2(r.a)}, x = ${N2(r.b)}`);
    return p.mode === 0 ? tx(`${reg} ağırlık merkezini (x̄, ȳ) bulalım.`, `Let's find the centre of mass (x̄, ȳ) of ${reg}.`)
      : tx(`${reg} ağırlık merkezini bulalım ve Pappus teoremiyle bu plakanın x-ekseni etrafında döndürülmesiyle oluşan cismin hacmini hesaplayalım.`, `Let's find the centre of mass of ${reg} and use Pappus' theorem to get the volume when this plate is revolved about the x-axis.`);
  }
  function steps(p) {
    const r = p.reg, a = r.a, b = r.b, F = Iexp(a, b), m = mom(r), w = wd(r), out = [];
    const PA = pInt(w), PM = pInt(pMul([0, 1], w)), PX = pInt(pAdd(pMul(r.f, r.f), pMul(r.g, r.g), -1));
    out.push(tx(`── 1) Formüller ──\nA = ${F} [f(x) − g(x)] dx\nM_y = ${F} x·[f(x) − g(x)] dx   (y-eksenine göre moment)\nM_x = ½ ${F} ([f(x)]² − [g(x)]²) dx   (x-eksenine göre moment)\nx̄ = M_y/A ,  ȳ = M_x/A`,
      `── 1) The formulas ──\nA = ${F} [f(x) − g(x)] dx\nM_y = ${F} x·[f(x) − g(x)] dx   (moment about the y-axis)\nM_x = ½ ${F} ([f(x)]² − [g(x)]²) dx   (moment about the x-axis)\nx̄ = M_y/A ,  ȳ = M_x/A`));
    out.push(tx(`── 2) Alan ──\nA = ${F} (${pStr(w)}) dx = [${pStr(PA)}${bar(a, b)} = ${frac(m.A)}`, `── 2) Area ──\nA = ${F} (${pStr(w)}) dx = [${pStr(PA)}${bar(a, b)} = ${frac(m.A)}`));
    out.push(tx(`── 3) y-eksenine göre moment ──\nM_y = ${F} x(${pStr(w)}) dx = [${pStr(PM)}${bar(a, b)} = ${frac(m.My)}`, `── 3) Moment about the y-axis ──\nM_y = ${F} x(${pStr(w)}) dx = [${pStr(PM)}${bar(a, b)} = ${frac(m.My)}`));
    out.push(tx(`── 4) x-eksenine göre moment ──\nM_x = ½ ${F} (${pStr(pAdd(pMul(r.f, r.f), pMul(r.g, r.g), -1))}) dx = ½[${pStr(PX)}${bar(a, b)} = ${frac(m.Mx)}`, `── 4) Moment about the x-axis ──\nM_x = ½ ${F} (${pStr(pAdd(pMul(r.f, r.f), pMul(r.g, r.g), -1))}) dx = ½[${pStr(PX)}${bar(a, b)} = ${frac(m.Mx)}`));
    out.push(tx(`── 5) Sonuç ──\nx̄ = M_y/A = ${frac(m.My)} / ${frac(m.A)} = ${frac(m.xb)} ≈ ${N2(m.xb)}\nȳ = M_x/A = ${frac(m.Mx)} / ${frac(m.A)} = ${frac(m.yb)} ≈ ${N2(m.yb)}\nAğırlık merkezi: (${N2(m.xb)}, ${N2(m.yb)})`,
      `── 5) Result ──\nx̄ = M_y/A = ${frac(m.My)} / ${frac(m.A)} = ${frac(m.xb)} ≈ ${N2(m.xb)}\nȳ = M_x/A = ${frac(m.Mx)} / ${frac(m.A)} = ${frac(m.yb)} ≈ ${N2(m.yb)}\nCentre of mass: (${N2(m.xb)}, ${N2(m.yb)})`));
    if (p.mode === 1) {
      const V = 2 * Math.PI * m.yb * m.A;
      out.push(tx(`── 6) Pappus teoremi ──\nBir düzlem bölgesi kendi düzlemindeki bir eksen etrafında (bölgeyi kesmeden) döndürülürse hacim = (ağırlık merkezinin çizdiği çemberin uzunluğu) × (alan):\nV = 2π·ȳ·A = 2π·${frac(m.yb)}·${frac(m.A)} = ${withPi(2 * m.yb * m.A)} ≈ ${N2(V)}`,
        `── 6) Pappus' theorem ──\nIf a plane region is revolved about an axis in its plane (not cutting it), volume = (circumference traced by the centroid) × (area):\nV = 2π·ȳ·A = 2π·${frac(m.yb)}·${frac(m.A)} = ${withPi(2 * m.yb * m.A)} ≈ ${N2(V)}`));
      out.push(tx(`── 7) Kontrol ──\nRondela yöntemiyle: V = π ${F} ([f]² − [g]²) dx = π·2·M_x = ${N2(Math.PI * simpson((x) => pEval(r.f, x) ** 2 - pEval(r.g, x) ** 2, a, b))} ✓`,
        `── 7) Check ──\nWith the washer method: V = π ${F} ([f]² − [g]²) dx = π·2·M_x = ${N2(Math.PI * simpson((x) => pEval(r.f, x) ** 2 - pEval(r.g, x) ** 2, a, b))} ✓`));
    } else {
      out.push(tx(`── 6) Mantıklı mı? ──\nAğırlık merkezi bölgenin içinde (${N2(a)} ≤ x̄ ≤ ${N2(b)}) kalır; plakayı bu noktadan bir iğneyle tutarsak dengede kalır ✓. Simetrik bir bölgede x̄ simetri ekseni üzerindedir.`,
        `── 6) Sanity check ──\nThe centre of mass lies inside the region (${N2(a)} ≤ x̄ ≤ ${N2(b)}); a plate held by a pin at this point balances ✓. For a symmetric region x̄ lies on the axis of symmetry.`));
    }
    return out;
  }
  function draw(c, p) {
    const r = p.reg, f = (x) => pEval(r.f, x), g = (x) => pEval(r.g, x), m = mom(r), x0 = K.at(p);
    let ym = 1; for (let i = 0; i <= 40; i++) ym = Math.max(ym, f(r.a + (r.b - r.a) * i / 40));
    K.view(c, Math.max(Math.abs(r.a), Math.abs(r.b)) + 0.5, ym + 0.5);
    c.addFilledArea({ evaluator: f, baseEvaluator: g, xMin: r.a, xMax: r.b, color: K.col(c, 'accent', 0.3) });
    c.addFunction({ evaluator: f, color: c.accent(), thickness: 3, label: 'f(x)' });
    if (!g0(r)) c.addFunction({ evaluator: g, color: c.green(), thickness: 2.5, label: 'g(x)' });
    c.addSegment({ x1: x0, y1: g(x0), x2: x0, y2: f(x0), color: c.orange(), thickness: 4 });
    c.addMarker({ x: x0, y: (f(x0) + g(x0)) / 2, color: c.orange(), radius: 4, label: tx('şeridin merkezi', 'strip centre') });
    c.addGuideLine({ axis: 'vertical', position: m.xb, color: c.red(), label: `x̄ = ${N2(m.xb)}` });
    c.addGuideLine({ axis: 'horizontal', position: m.yb, color: c.red(), label: `ȳ = ${N2(m.yb)}` });
    c.addMarker({ x: m.xb, y: m.yb, color: c.gold(), shape: 'diamond', radius: 8, label: `(${N2(m.xb)}, ${N2(m.yb)})` });
  }
  K.register('calc2', {
    id: 'centroid',
    title: ['Moment ve Ağırlık Merkezi', 'Moments and Centre of Mass'],
    modes: [['Ağırlık merkezi (x̄, ȳ)', 'Centre of mass (x̄, ȳ)'], ['Ağırlık merkezi + Pappus teoremi', 'Centre of mass + Pappus\' theorem']],
    sliderCap: ['Şerit konumu x (0 = sol uç, 1 = sağ uç)', 'Strip position x (0 = left end, 1 = right end)'],
    range: (p) => [p.reg.a, p.reg.b],
    view3d: { build: Calc2V3.centroid, dist: 9 },
    links: [
      { match: /^(FORMÜLLER \(f üstte, g altta\)|FORMULAS \(f on top, g below\))$/, mode: 0 },
      { match: /^(PAPPUS TEOREMİ|PAPPUS' THEOREM)$/, mode: 1 },
    ],
    statement, steps, draw, exact, num,
    concept: [
      'MOMENT VE AĞIRLIK MERKEZİ\nDüzgün (homojen) bir plakanın ağırlık merkezi, plakayı bir iğne ucunda dengede tutan noktadır. Bölgeyi ince dikey şeritlere böleriz; her şeridin alanı dA = [f(x) − g(x)] dx ve merkezi (x, [f(x) + g(x)]/2) noktasındadır.\n\nFORMÜLLER (f üstte, g altta)\n  A = ∫ₐᵇ [f − g] dx\n  M_y = ∫ₐᵇ x·[f − g] dx      (y-eksenine göre moment)\n  M_x = ½ ∫ₐᵇ ([f]² − [g]²) dx   (x-eksenine göre moment)\n  x̄ = M_y / A ,  ȳ = M_x / A\nM_x\'teki ½ çarpanı, şeridin merkezinin yüksekliği (f + g)/2 olduğundan gelir: (f + g)/2·(f − g) = ½(f² − g²).\n\nPAPPUS TEOREMİ\nDüzlem bölgeyi, onu kesmeyen bir eksen etrafında döndürürsek\n  V = 2π·(eksene uzaklık)·A\nÖrneğin x-ekseni etrafında V = 2π·ȳ·A. Bu, hem hacim hem merkez için hızlı bir kontroldür.\n\nYÖNTEM\n1. Bölgeyi çizelim, f ve g\'yi belirleyelim.\n2. A, M_y ve M_x integrallerini hesaplayalım.\n3. x̄ ve ȳ\'yi oranlayalım.\n4. Merkezin bölgenin içinde ve simetri eksenleri üzerinde olup olmadığına bakalım.\n\nTUZAKLAR\n• M_y x ile, M_x ise y ile ilgilidir: x̄ = M_y/A, ȳ = M_x/A (karıştırmaya dikkat).\n• M_x\'teki ½ unutulmasın.\n• Ağırlık merkezi bölgenin dışına da düşebilir (içbükey şekillerde), ama bu sekmedeki bölgelerde içeridedir.\n\nMÜHENDİSLİKTE\nKiriş kesitinin ağırlık merkezi, atalet momenti hesaplarının başlangıcı, baraj kapağındaki basınç merkezi ve denge noktaları.\n\nGRAFİK\nMavi bölge plaka, kırmızı çizgiler x̄ ve ȳ, altın elmas ağırlık merkezidir. Turuncu şerit kaydırıcıyla gezer ve her şeridin merkezi turuncu noktadır.',
      'MOMENTS AND CENTRE OF MASS\nThe centre of mass of a uniform plate is the point where a pin balances it. We cut the region into thin vertical strips; each strip has area dA = [f(x) − g(x)] dx and its centre at (x, [f(x) + g(x)]/2).\n\nFORMULAS (f on top, g below)\n  A = ∫ₐᵇ [f − g] dx\n  M_y = ∫ₐᵇ x·[f − g] dx      (moment about the y-axis)\n  M_x = ½ ∫ₐᵇ ([f]² − [g]²) dx   (moment about the x-axis)\n  x̄ = M_y / A ,  ȳ = M_x / A\nThe ½ in M_x appears because the strip centre height is (f + g)/2: (f + g)/2·(f − g) = ½(f² − g²).\n\nPAPPUS\' THEOREM\nRevolving a plane region about an axis that does not cut it gives\n  V = 2π·(distance to the axis)·A\nFor example about the x-axis V = 2π·ȳ·A. This is a quick check on both volume and centroid.\n\nMETHOD\n1. We sketch the region and identify f and g.\n2. We compute the integrals A, M_y and M_x.\n3. We form the ratios x̄ and ȳ.\n4. We check that the centre lies inside the region and on any symmetry axis.\n\nPITFALLS\n• M_y goes with x and M_x with y: x̄ = M_y/A, ȳ = M_x/A (easy to mix up).\n• Do not forget the ½ in M_x.\n• The centroid can fall outside a non-convex region, but here it is inside.\n\nIN ENGINEERING\nCentroid of a beam section, the start of moment-of-inertia calculations, pressure centre on a dam gate and balance points.\n\nGRAPH\nThe blue region is the plate, the red lines are x̄ and ȳ, the gold diamond is the centre of mass. The orange strip moves with the slider; its centre is the orange dot.',
    ],
  });
})();
