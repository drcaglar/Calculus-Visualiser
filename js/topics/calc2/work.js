// Calculus II - Work: spring (Hooke), hanging rope/chain, pumping liquid out of a box tank and out of a conical tank.
// Every scenario is a force-per-distance integrand h(y) (polynomial) on [a, b]; the work is the area under h.
(function () {
  const K = Calc2, tx = K.tx, { pEval, pInt, pStr, simpson, N2, Iexp, bar, frac } = K;
  const G = 9.81, RHO = 1000, PI = Math.PI;
  // type 0 spring {k,a,b}; 1 rope {L,m}; 2 box tank {l,w,H}; 3 cone tank {R,H}
  const S = [
    { type: 0, k: 200, a: 0, b: 0.2 }, { type: 0, k: 300, a: 0.1, b: 0.3 }, { type: 0, k: 500, a: 0.05, b: 0.25 },
    { type: 1, L: 6, m: 3 }, { type: 1, L: 12, m: 1.5 }, { type: 1, L: 8, m: 4 },
    { type: 2, l: 4, w: 3, H: 2 }, { type: 2, l: 5, w: 2, H: 3 }, { type: 2, l: 6, w: 4, H: 1.5 },
    { type: 3, R: 2, H: 3 }, { type: 3, R: 1.5, H: 4 }, { type: 3, R: 3, H: 5 },
  ];
  const spec = (s) => {
    if (s.type === 0) return { h: [0, s.k], a: s.a, b: s.b, v: 'x', lo: s.a, hi: s.b };
    if (s.type === 1) return { h: [s.m * G * s.L, -s.m * G], a: 0, b: s.L, v: 'y' };
    if (s.type === 2) { const c = RHO * G * s.l * s.w; return { h: [c * s.H, -c], a: 0, b: s.H, v: 'y' }; }
    const c = RHO * G * PI * s.R * s.R / (s.H * s.H); return { h: [0, 0, c * s.H, -c], a: 0, b: s.H, v: 'y', c };
  };
  const exact = (p) => { const q = spec(p.reg), P = pInt(q.h); return pEval(P, q.b) - pEval(P, q.a); };
  const num = (p) => { const q = spec(p.reg); return simpson((x) => pEval(q.h, x), q.a, q.b); };
  const name = (s) => [`${tx('Yay', 'Spring')}: k = ${s.k} N/m, ${s.a} m → ${s.b} m`, `${tx('Halat', 'Rope')}: L = ${s.L} m, ${s.m} kg/m`, `${tx('Dikdörtgen tank', 'Box tank')}: ${s.l}×${s.w}×${s.H} m`, `${tx('Konik tank', 'Cone tank')}: R = ${s.R} m, H = ${s.H} m`][s.type];
  const fix = (p) => { p.mode = p.reg.type; };
  const J = (v) => (Math.abs(v) >= 10000 ? N2(Math.round(v)) : N2(v)) + ' J';

  function statement(p) {
    const s = p.reg;
    if (s.type === 0) return tx(`Doğal boyundaki bir yayın sertliği k = ${s.k} N/m'dir. Yayı doğal boyundan ${s.a} m uzatılmış durumdan ${s.b} m uzatılmış duruma getirmek için yapılan işi bulalım.`, `A spring with stiffness k = ${s.k} N/m is stretched from ${s.a} m beyond its natural length to ${s.b} m beyond it. Let's find the work done.`);
    if (s.type === 1) return tx(`Boyu ${s.L} m ve birim uzunluk kütlesi ${s.m} kg/m olan homojen bir halat tamamen sarkmaktadır. Halatı tepeye kadar çekmek için yapılan işi bulalım (g = 9.81 m/s²).`, `A uniform rope of length ${s.L} m and mass ${s.m} kg/m hangs fully down. Let's find the work needed to pull all of it up to the top (g = 9.81 m/s²).`);
    if (s.type === 2) return tx(`Tabanı ${s.l} m × ${s.w} m ve derinliği ${s.H} m olan dikdörtgen prizma biçimli bir tank ağzına kadar sudur (ρ = 1000 kg/m³). Suyu tankın üst kenarından dışarı pompalamak için yapılan işi bulalım (g = 9.81 m/s²).`, `A box-shaped tank ${s.l} m × ${s.w} m with depth ${s.H} m is full of water (ρ = 1000 kg/m³). Let's find the work to pump all the water out over the top edge (g = 9.81 m/s²).`);
    return tx(`Üstü açık, ucu aşağıda ters koni biçimli bir tankın üst yarıçapı R = ${s.R} m, yüksekliği H = ${s.H} m'dir ve ağzına kadar su doludur (ρ = 1000 kg/m³). Suyu üst kenardan dışarı pompalamak için yapılan işi bulalım (g = 9.81 m/s²).`, `An open inverted-cone tank (apex down) has top radius R = ${s.R} m and height H = ${s.H} m and is full of water (ρ = 1000 kg/m³). Let's find the work to pump the water out over the top (g = 9.81 m/s²).`);
  }
  function steps(p) {
    const s = p.reg, q = spec(s), F = Iexp(q.a, q.b), P = pInt(q.h), Pb = pEval(P, q.b), Pa = pEval(P, q.a), v = q.v, out = [];
    if (s.type === 0) {
      out.push(tx(`── 1) Kuvvet ──\nHooke yasası: F(x) = k·x = ${s.k}x  (N).\nx, doğal boydan olan uzamadır.`, `── 1) The force ──\nHooke's law: F(x) = k·x = ${s.k}x  (N).\nx is the stretch from the natural length.`));
    } else if (s.type === 1) {
      out.push(tx(`── 1) Kuvvet ──\nY mesafesi çekildiğinde geriye sarkan halat uzunluğu L − y olur.\nÇekme kuvveti F(y) = (kütle/uzunluk)·g·(L − y) = ${N2(s.m * G)}·(${s.L} − y)  (N).`, `── 1) The force ──\nAfter pulling up a distance y the hanging length is L − y.\nThe pulling force is F(y) = (mass/length)·g·(L − y) = ${N2(s.m * G)}·(${s.L} − y)  (N).`));
    } else if (s.type === 2) {
      out.push(tx(`── 1) Tipik bir su tabakası ──\nTabandan y yükseklikte kalınlığı dy olan bir tabaka alalım.\nHacim = ${s.l}·${s.w}·dy, ağırlık = ρ·g·hacim = ${N2(RHO * G * s.l * s.w)} dy  (N).\nBu tabaka ${s.H} − y kadar yukarı kaldırılır.`, `── 1) A typical slab of water ──\nTake a slab of thickness dy at height y above the bottom.\nVolume = ${s.l}·${s.w}·dy, weight = ρ·g·volume = ${N2(RHO * G * s.l * s.w)} dy  (N).\nThis slab is lifted ${s.H} − y.`));
    } else {
      out.push(tx(`── 1) Tipik bir su tabakası ──\nUçtan y yükseklikte yarıçap r = R·y/H = ${N2(s.R / s.H)}·y olur.\nTabaka hacmi = π·r²·dy, ağırlığı = ρ·g·π·r² dy = c·y² dy,  c = ρ·g·π·R²/H² = ${N2(q.c)}.\nBu tabaka H − y = ${s.H} − y kadar yukarı kaldırılır.`,
        `── 1) A typical slab of water ──\nAt height y above the apex the radius is r = R·y/H = ${N2(s.R / s.H)}·y.\nSlab volume = π·r²·dy, weight = ρ·g·π·r² dy = c·y² dy,  c = ρ·g·π·R²/H² = ${N2(q.c)}.\nThis slab is lifted H − y = ${s.H} − y.`));
    }
    out.push(tx(`── 2) İş integrali ──\nW = ${F} ${s.type === 0 ? 'F(x)' : 'dW'} d${v}${s.type >= 2 ? '   (dW = ağırlık × kaldırma mesafesi)' : ''}\nİntegrand: ${s.type === 3 ? 'c·y²·(H − y)' : s.type === 2 ? `${N2(RHO * G * s.l * s.w)}·(${s.H} − y)` : s.type === 1 ? `${N2(s.m * G)}·(${s.L} − y)` : `${s.k}x`} = ${pStr(q.h, v)}`,
      `── 2) The work integral ──\nW = ${F} ${s.type === 0 ? 'F(x)' : 'dW'} d${v}${s.type >= 2 ? '   (dW = weight × lifting distance)' : ''}\nIntegrand: ${s.type === 3 ? 'c·y²·(H − y)' : s.type === 2 ? `${N2(RHO * G * s.l * s.w)}·(${s.H} − y)` : s.type === 1 ? `${N2(s.m * G)}·(${s.L} − y)` : `${s.k}x`} = ${pStr(q.h, v)}`));
    out.push(tx(`── 3) Ters türev ──\nP(${v}) = ${pStr(P, v)}`, `── 3) Antiderivative ──\nP(${v}) = ${pStr(P, v)}`));
    out.push(tx(`── 4) Sınırlar ──\nW = P(${N2(q.b)}) − P(${N2(q.a)}) = ${N2(Pb)} − (${N2(Pa)})`, `── 4) Limits ──\nW = P(${N2(q.b)}) − P(${N2(q.a)}) = ${N2(Pb)} − (${N2(Pa)})`));
    out.push(tx(`── 5) Sonuç ──\nW ≈ ${J(Pb - Pa)}  (1 J = 1 N·m)`, `── 5) Result ──\nW ≈ ${J(Pb - Pa)}  (1 J = 1 N·m)`));
    out.push(tx(`── 6) Sayısal kontrol ──\nSimpson kuralıyla ≈ ${J(num(p))}; aynı ✓. Grafikte iş, eğrinin altında kalan alandır.${s.type === 1 ? ' Kısa yol: ağırlık merkezi L/2 kadar yükselir, W = m·g·L·(L/2).' : ''}`,
      `── 6) Numerical check ──\nSimpson's rule gives ≈ ${J(num(p))}; the same ✓. On the graph the work is the area under the curve.${s.type === 1 ? ' Shortcut: the centre of mass rises L/2, so W = m·g·L·(L/2).' : ''}`));
    return out;
  }
  function draw(c, p) {
    const s = p.reg, q = spec(s), y0 = K.at(p), h = (x) => pEval(q.h, x);
    let hm = 1; for (let i = 0; i <= 40; i++) hm = Math.max(hm, Math.abs(h(q.a + (q.b - q.a) * i / 40)));
    K.view(c, q.b * 1.05, hm * 1.05);
    c.addFilledArea({ evaluator: h, xMin: q.a, xMax: q.b, color: K.col(c, 'accent', 0.3) });
    c.addFunction({ evaluator: h, color: c.accent(), thickness: 3, label: s.type === 0 ? 'F(x)' : 'h(y) = dW/dy' });
    c.addFilledArea({ evaluator: h, xMin: q.a, xMax: y0, color: K.col(c, 'orange', 0.35) });
    c.addGuideLine({ axis: 'vertical', position: y0, color: c.orange(), label: `${q.v} = ${N2(y0)}` });
    c.addMarker({ x: y0, y: h(y0), color: c.orange(), radius: 5, label: `${N2(h(y0))}` });
    c.addMarker({ x: q.b, y: h(q.b), color: c.gray(), radius: 4 });
  }
  K.register('calc2', {
    id: 'work',
    title: ['İş: Yay, Halat ve Pompalama', 'Work: Springs, Ropes and Pumping'],
    regions: S, regName: name,
    sliderCap: ['Kaldırılan / uzayan miktar (0 = başlangıç, 1 = bitiş)', 'Distance moved / stretched so far (0 = start, 1 = end)'],
    range: (p) => { const q = spec(p.reg); return [q.a, q.b]; },
    view3d: { build: Calc2V3.work, dist: 9 },
    links: [
      { match: /^(YAY \(HOOKE YASASI\)|SPRING \(HOOKE'S LAW\))$/, region: (r) => r.type === 0 },
      { match: /^(HALAT \/ ZİNCİR|ROPE \/ CHAIN)$/, region: (r) => r.type === 1 },
      { match: /^(POMPALAMA \(SIVI\)|PUMPING \(LIQUIDS\))$/, region: (r) => r.type >= 2 },
    ],
    fix, statement, steps, draw, exact, num,
    concept: [
      'İŞ\nSabit bir F kuvveti cismi d kadar yer değiştirirse iş W = F·d olur (birim: joule, 1 J = 1 N·m). Kuvvet konuma göre DEĞİŞİYORSA ince parçalara bölüp toplarız:\n  W = ∫ₐᵇ F(x) dx\nGrafikte kuvvet–yol eğrisinin altında kalan alan işi verir.\n\nYAY (HOOKE YASASI)\nF(x) = k·x, x doğal boydan olan uzamadır. İş: W = ∫ₐᵇ kx dx = ½k(b² − a²).\n\nHALAT / ZİNCİR\nÇekilen kısım azaldıkça yük azalır: F(y) = (kütle/uzunluk)·g·(L − y). Tamamını çekmek için W = ½·ρ·g·L².\n\nPOMPALAMA (SIVI)\nBu sefer kuvvet sabit, mesafe değişir. Sıvıyı ince yatay tabakalara böleriz:\n  dW = (tabakanın ağırlığı) × (kaldırma mesafesi)\nAğırlık = ρ·g·(tabaka hacmi). Her tabaka farklı yükseklikten çıktığı için farklı mesafe kaldırılır. Su için ρ = 1000 kg/m³, g = 9.81 m/s².\n\nYÖNTEM\n1. Eksen seç ve tipik bir parçayı (tabaka ya da kuvvet) çiz.\n2. Parçanın dW\'sini yaz (kuvvet × mesafe).\n3. Sınırları belirle ve integrali al.\n4. Birimleri kontrol et (N·m = J).\n\nTUZAKLAR\n• Kaldırma mesafesi "H − y" gibi yukarı çıkış mesafesidir, tabakanın yüksekliği değil.\n• Konik tankta yarıçap yüksekliğe bağlı olduğundan tabaka hacmi y²\'ye orantılıdır.\n• Santimetreyi metreye çevirmeyi unutmayalım.\n\nMÜHENDİSLİKTE\nPompa gücü ve enerji hesabı, vinç ve asansör işi, yay enerjisi (süspansiyon, kilit).\n\nGRAFİK\nMavi eğri integrand h (kuvvet ya da dW/dy); altındaki alan işi gösterir. Turuncu bölge kaydırıcıya kadar yapılan iştir.',
      'WORK\nIf a constant force F moves an object a distance d the work is W = F·d (unit joule, 1 J = 1 N·m). If the force VARIES with position we cut the path into small pieces and add:\n  W = ∫ₐᵇ F(x) dx\nOn a force–distance graph the area under the curve is the work.\n\nSPRING (HOOKE\'S LAW)\nF(x) = k·x, where x is the stretch from the natural length. Work: W = ∫ₐᵇ kx dx = ½k(b² − a²).\n\nROPE / CHAIN\nAs more is pulled up the load decreases: F(y) = (mass/length)·g·(L − y). Pulling all of it up takes W = ½·ρ·g·L².\n\nPUMPING (LIQUIDS)\nHere the force is fixed and the distance varies. We cut the liquid into thin horizontal slabs:\n  dW = (weight of the slab) × (distance lifted)\nWeight = ρ·g·(slab volume). Each slab starts at a different height so it is lifted a different distance. For water ρ = 1000 kg/m³, g = 9.81 m/s².\n\nMETHOD\n1. Pick an axis and sketch a typical piece (slab or force).\n2. Write dW for that piece (force × distance).\n3. Set the limits and integrate.\n4. Check the units (N·m = J).\n\nPITFALLS\n• The lifting distance is the way up, like "H − y", not the height of the slab.\n• In a cone the radius depends on height, so the slab volume is proportional to y².\n• Convert centimetres to metres.\n\nIN ENGINEERING\nPump power and energy, crane and lift work, spring energy (suspensions, latches).\n\nGRAPH\nThe blue curve is the integrand h (force or dW/dy); the area under it is the work. The orange part is the work done up to the slider position.',
    ],
  });
})();
