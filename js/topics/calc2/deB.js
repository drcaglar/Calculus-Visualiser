// Calculus II, differential equations (part B): first-order linear equations (integrating factor), applications (growth/decay, cooling,
// mixing, RC circuit, logistic) and autonomous equations (phase line). Every closed form is checked against an RK4 integration.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const neg = (s) => String(s).replace(/-/g, '−');
  const N2 = (v) => neg(fmt2(v));
  const N3 = (v) => { const t = Number(v).toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); return neg(t === '-0' ? '0' : t); };
  const cf = (a) => (a === 1 ? '' : String(a));
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const round2 = (v) => Math.round(v * 100) / 100;
  function rk4(f, t0, y0, t1, n) {
    const h = (t1 - t0) / n;
    let t = t0, y = y0;
    for (let i = 0; i < n; i++) {
      const k1 = f(t, y), k2 = f(t + h / 2, y + h / 2 * k1), k3 = f(t + h / 2, y + h / 2 * k2), k4 = f(t + h, y + h * k3);
      y += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      t += h;
    }
    return y;
  }
  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round((v - reg.min) / (reg.max - reg.min) * 1000))));
  }
  const caption = (rightCol, t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); return d; };
  const fail = (msg) => { throw new Error(msg); };
  const rel = (a, b) => Math.abs(a - b) / (1 + Math.abs(b));
  window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };
  const lv = (fn, level) => { fn.level = level; return fn; };

  // =====================================================================================================================
  // 1) FIRST-ORDER LINEAR EQUATIONS   y' + P(x) y = Q(x)
  // p = { kind 0..5, a, s, m, y0, xe }
  // kinds: 0 P=a, Q=a·s | 1 P=a, Q=x | 2 P=a, Q=eˣ | 3 P=a, Q=sin x | 4 P=1/x, Q=3m·x | 5 P=2/x, Q=4m·x   (kinds 4, 5: x > 0, y(1) = y0)
  // =====================================================================================================================
  let forced1 = null;

  function norm1(p) {
    p.kind = clamp(Math.round(p.kind), 0, 5);
    const k = p.kind;
    p.a = clamp(Math.round(p.a), 1, k === 1 || k === 3 ? 2 : 3);
    p.s = clamp(Math.round(p.s), 1, 5);
    p.m = clamp(Math.round(p.m), 1, k === 5 ? 2 : 3);
    const x0 = k >= 4 ? 1 : 0;
    p.xe = clamp(p.xe, x0 + 0.5, x0 + 4);
    p.y0 = clamp(p.y0, -4, 6);
    return p;
  }
  function mdl1(p) {
    norm1(p);
    const k = p.kind, a = p.a, s = p.s, mm = p.m, x0 = k >= 4 ? 1 : 0;
    const mu = k === 4 ? 'x' : k === 5 ? 'x²' : `e^(${cf(a)}x)`;
    const m = { k, x0, mu, pos: k < 4 };
    if (k === 0) Object.assign(m, { Pf: () => a, Qf: () => a * s, yp: () => s, hom: (x) => Math.exp(-a * x), ypTxt: String(s), homTxt: `e^(−${cf(a)}x)`, eq: `y′ + ${cf(a)}y = ${a * s}`, Ptxt: String(a), Qtxt: String(a * s), muQ: `${a * s}·${mu}`, integ: `${s}·${mu}` });
    if (k === 1) {
      const yt = a === 1 ? 'x − 1' : `x/${a} − 1/${a * a}`;
      Object.assign(m, { Pf: () => a, Qf: (x) => x, yp: (x) => x / a - 1 / (a * a), hom: (x) => Math.exp(-a * x), ypTxt: yt, homTxt: `e^(−${cf(a)}x)`, eq: `y′ + ${cf(a)}y = x`, Ptxt: String(a), Qtxt: 'x', muQ: `x·${mu}`, integ: `(${yt})·${mu}` });
    }
    if (k === 2) Object.assign(m, { Pf: () => a, Qf: (x) => Math.exp(x), yp: (x) => Math.exp(x) / (a + 1), hom: (x) => Math.exp(-a * x), ypTxt: `e^x/${a + 1}`, homTxt: `e^(−${cf(a)}x)`, eq: `y′ + ${cf(a)}y = e^x`, Ptxt: String(a), Qtxt: 'e^x', muQ: `e^(${a + 1}x)`, integ: `e^(${a + 1}x)/${a + 1}` });
    if (k === 3) {
      const yt = `(${cf(a)}sin x − cos x)/${a * a + 1}`;
      Object.assign(m, { Pf: () => a, Qf: (x) => Math.sin(x), yp: (x) => (a * Math.sin(x) - Math.cos(x)) / (a * a + 1), hom: (x) => Math.exp(-a * x), ypTxt: yt, homTxt: `e^(−${cf(a)}x)`, eq: `y′ + ${cf(a)}y = sin x`, Ptxt: String(a), Qtxt: 'sin x', muQ: `${mu}·sin x`, integ: `${mu}·${yt}` });
    }
    if (k === 4) Object.assign(m, { Pf: (x) => 1 / x, Qf: (x) => 3 * mm * x, yp: (x) => mm * x * x, hom: (x) => 1 / x, ypTxt: `${cf(mm)}x²`, homTxt: '1/x', eq: `y′ + y/x = ${3 * mm}x`, Ptxt: '1/x', Qtxt: `${3 * mm}x`, muQ: `${3 * mm}x²`, integ: `${cf(mm)}x³` });
    if (k === 5) Object.assign(m, { Pf: (x) => 2 / x, Qf: (x) => 4 * mm * x, yp: (x) => mm * x * x, hom: (x) => 1 / (x * x), ypTxt: `${cf(mm)}x²`, homTxt: '1/x²', eq: `y′ + 2y/x = ${4 * mm}x`, Ptxt: '2/x', Qtxt: `${4 * mm}x`, muQ: `${4 * mm}x³`, integ: `${cf(mm)}x⁴` });
    m.C = (p.y0 - m.yp(x0)) / m.hom(x0);
    m.y = (x) => m.yp(x) + m.C * m.hom(x);
    m.ode = (x, y) => m.Qf(x) - m.Pf(x) * y;
    m.steady = k === 0 || k === 1 || k === 3;
    return m;
  }
  const check1 = (p) => {
    const m = mdl1(p);
    for (const d of [0.5, p.xe - m.x0, 2.5]) {
      const x = m.x0 + d, num = rk4(m.ode, m.x0, p.y0, x, 4000);
      if (!(rel(num, m.y(x)) < 1e-7)) fail(`linear1 closed form ≠ RK4 (kind ${p.kind}) at x=${x}: ${m.y(x)} vs ${num}`);
    }
    return p;
  };
  const kindTitle1 = () => [
    tx('P sabit, Q sabit', 'P constant, Q constant'), tx('P sabit, Q = x (polinom)', 'P constant, Q = x (polynomial)'), tx('P sabit, Q = eˣ', 'P constant, Q = eˣ'),
    tx('P sabit, Q = sin x', 'P constant, Q = sin x'), tx('P = 1/x', 'P = 1/x'), tx('P = 2/x', 'P = 2/x')];
  let sel1 = null, sxe1 = null;
  function createProblem1(rng) {
    const kind = forced1 ? forced1.kind : rng.nextInt(0, 6);
    const p = { kind, a: 1, s: 1, m: 1, y0: 0, xe: 1 };
    if (kind <= 3) { p.a = kind === 1 || kind === 3 ? rng.pick([1, 2]) : rng.pick([1, 2, 3]); p.s = rng.nextInt(1, 6); p.xe = rng.pick([1, 2, 3]); }
    else { p.m = kind === 5 ? rng.pick([1, 2]) : rng.pick([1, 2, 3]); p.xe = rng.pick([2, 3, 4]); }
    p.y0 = rng.nextInt(-3, 7);
    if (kind === 0 && p.y0 === p.s) p.y0 += 1;
    if (kind >= 4 && p.y0 === p.m) p.y0 += 1;
    if (sel1) sel1.refreshFromModel();
    return check1(norm1(p));
  }
  function statement1(p) {
    const m = mdl1(p);
    if (m.k >= 4) return tx(`x > 0 için ${m.eq} denkleminin y(1) = ${N2(p.y0)} başlangıç koşulunu sağlayan çözümünü bulalım ve y(${N2(p.xe)}) değerini hesaplayalım.`, `For x > 0, let's solve ${m.eq} with the initial condition y(1) = ${N2(p.y0)} and compute y(${N2(p.xe)}).`);
    return tx(`${m.eq}, y(0) = ${N2(p.y0)} başlangıç değer problemini çözelim ve y(${N2(p.xe)}) değerini hesaplayalım.`, `Let's solve the initial value problem ${m.eq}, y(0) = ${N2(p.y0)}, and compute y(${N2(p.xe)}).`);
  }
  function steps1(p) {
    const m = mdl1(p), k = m.k, a = p.a, x0 = m.x0, xe = p.xe, C = m.C;
    const out = [];
    const sgn = (v) => (v < 0 ? '−' : '+');
    const homT = (c) => (k <= 3 ? `${N2(c)}·${m.homTxt}` : `${N2(c)}/${k === 4 ? 'x' : 'x²'}`);
    const sol = (Math.abs(C) < 1e-9 ? m.ypTxt : `${m.ypTxt} ${sgn(C)} ${homT(Math.abs(C))}`);
    out.push(tx(`── 1) Standart biçim ──\n${m.eq}${k >= 4 ? '  (x > 0)' : ''} zaten y′ + P(x)y = Q(x) biçimindedir: P(x) = ${m.Ptxt}, Q(x) = ${m.Qtxt}.`,
      `── 1) Standard form ──\n${m.eq}${k >= 4 ? '  (x > 0)' : ''} is already y′ + P(x)y = Q(x): P(x) = ${m.Ptxt}, Q(x) = ${m.Qtxt}.`));
    const muDer = k === 4 ? 'e^(∫(1/x)dx) = e^(ln x) = x  (x > 0 olduğundan |x| = x)' : k === 5 ? 'e^(∫(2/x)dx) = e^(2·ln x) = x²' : `e^(∫${a} dx) = e^(${cf(a)}x)`;
    const muDerEn = k === 4 ? 'e^(∫(1/x)dx) = e^(ln x) = x  (|x| = x because x > 0)' : muDer;
    out.push(tx(`── 2) İntegrasyon çarpanı ──\nμ(x) = e^(∫P dx) = ${muDer}.`, `── 2) Integrating factor ──\nμ(x) = e^(∫P dx) = ${muDerEn}.`));
    out.push(tx(`── 3) (μy)′ = μQ ──\nDenklemi μ ile çarparız; sol taraf (μy)′ olur (çünkü μ′ = Pμ):\n(${m.mu}·y)′ = ${m.muQ}.`,
      `── 3) (μy)′ = μQ ──\nMultiplying by μ turns the left side into (μy)′ (because μ′ = Pμ):\n(${m.mu}·y)′ = ${m.muQ}.`));
    const how = [
      ['Katsayı sabit olduğundan doğrudan: ∫c·e^(ax)dx = (c/a)·e^(ax).', 'The coefficient is constant, so directly: ∫c·e^(ax)dx = (c/a)·e^(ax).'],
      [`Kısmi integrasyon (u = x, dv = ${m.mu}dx ⇒ v = ${m.mu}/${a}): ∫x·${m.mu}dx = x·${m.mu}/${a} − (1/${a})∫${m.mu}dx.`, `Integration by parts (u = x, dv = ${m.mu}dx ⇒ v = ${m.mu}/${a}): ∫x·${m.mu}dx = x·${m.mu}/${a} − (1/${a})∫${m.mu}dx.`],
      [`Üsler toplanır: e^(${cf(a)}x)·e^x = e^(${a + 1}x); ∫e^(${a + 1}x)dx = e^(${a + 1}x)/${a + 1}.`, `The exponents add: e^(${cf(a)}x)·e^x = e^(${a + 1}x); ∫e^(${a + 1}x)dx = e^(${a + 1}x)/${a + 1}.`],
      [`İki kez kısmi integrasyon, I = ∫${m.mu}·sin x dx integralini yeniden verir; I için çözünce I = ${m.mu}(${cf(a)}sin x − cos x)/${a * a + 1}.`, `Integrating by parts twice gives I = ∫${m.mu}·sin x dx back on the right; solving for I gives I = ${m.mu}(${cf(a)}sin x − cos x)/${a * a + 1}.`],
      [`x·(${3 * p.m}x) = ${3 * p.m}x² ⇒ ∫${3 * p.m}x²dx = ${cf(p.m)}x³.`, `x·(${3 * p.m}x) = ${3 * p.m}x² ⇒ ∫${3 * p.m}x²dx = ${cf(p.m)}x³.`],
      [`x²·(${4 * p.m}x) = ${4 * p.m}x³ ⇒ ∫${4 * p.m}x³dx = ${cf(p.m)}x⁴.`, `x²·(${4 * p.m}x) = ${4 * p.m}x³ ⇒ ∫${4 * p.m}x³dx = ${cf(p.m)}x⁴.`]][k];
    out.push(tx(`── 4) İntegral ──\n${how[0]}\nμy = ${m.integ} + C.`, `── 4) The integral ──\n${how[1]}\nμy = ${m.integ} + C.`));
    out.push(tx(`── 5) Genel çözüm ──\ny = (1/μ)(${m.integ} + C) = ${m.ypTxt} + C·${m.homTxt}.`, `── 5) General solution ──\ny = (1/μ)(${m.integ} + C) = ${m.ypTxt} + C·${m.homTxt}.`));
    const yp0 = m.yp(x0), h0 = m.hom(x0);
    out.push(tx(`── 6) Başlangıç koşulu ──\ny(${x0}) = ${N2(p.y0)}: ${N2(p.y0)} = ${N2(yp0)} + C·${N2(h0)}  ⇒  C = ${N2(C)}.`, `── 6) Initial condition ──\ny(${x0}) = ${N2(p.y0)}: ${N2(p.y0)} = ${N2(yp0)} + C·${N2(h0)}  ⇒  C = ${N2(C)}.`));
    const yx = m.y(xe);
    out.push(tx(`── 7) Çözüm ──\ny(x) = ${sol}.\ny(${N2(xe)}) = ${N2(m.yp(xe))} ${sgn(C)} ${N2(Math.abs(C * m.hom(xe)))} = ${N2(yx)}.`, `── 7) The solution ──\ny(x) = ${sol}.\ny(${N2(xe)}) = ${N2(m.yp(xe))} ${sgn(C)} ${N2(Math.abs(C * m.hom(xe)))} = ${N2(yx)}.`));
    let nn = 8;
    if (m.pos) {
      const stTr = k === 2 ? `yₚ = e^x/${a + 1} sınırsız büyür; geçici kısım yine de söner ve uzun dönem davranışını yₚ belirler (sabit bir kararlı değer yoktur).` : `Kalıcı (kararlı hâl) kısım yₚ = ${m.ypTxt}${k === 0 ? ` = ${p.s}` : ''}.`;
      const stEn = k === 2 ? `yₚ = e^x/${a + 1} grows without bound; the transient still dies out and yₚ alone describes the long-term behaviour (there is no constant steady value).` : `The steady part is yₚ = ${m.ypTxt}${k === 0 ? ` = ${p.s}` : ''}.`;
      out.push(tx(`── 8) Geçici ve kalıcı kısım ──\nP = ${a} > 0 olduğundan C·e^(−${cf(a)}x) terimi x → ∞ için 0'a gider (GEÇİCİ kısım). ${stTr}`,
        `── 8) Transient and steady part ──\nBecause P = ${a} > 0, the term C·e^(−${cf(a)}x) tends to 0 as x → ∞ (TRANSIENT part). ${stEn}`));
      nn = 9;
    }
    const num = rk4(m.ode, x0, p.y0, xe, 2000);
    out.push(tx(`── ${nn}) Sayısal kontrol ──\nRK4 (2000 adım) ile y(${N2(xe)}) ≈ ${N2(num)}; kapalı çözümle ${N2(yx)} ✓.`, `── ${nn}) Numerical check ──\nRK4 (2000 steps) gives y(${N2(xe)}) ≈ ${N2(num)}; the closed form gives ${N2(yx)} ✓.`));
    return out;
  }
  function draw1(canvas, p) {
    const m = mdl1(p), x0 = m.x0, xe = p.xe;
    const xlo = m.k >= 4 ? 0.25 : -0.5, xhi = xe + 1.5;
    const y = safe((x) => (x >= x0 ? m.y(x) : NaN)), yp = safe(m.yp);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const x = x0 + (xhi - x0) * i / 200;
      const v = m.y(x);
      if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (m.steady) { const w = m.yp(x); if (Number.isFinite(w)) { lo = Math.min(lo, w); hi = Math.max(hi, w); } }
    }
    lo = Math.min(lo, p.y0, 0); hi = Math.max(hi, p.y0, 0);
    const pad = Math.max(0.5, (hi - lo) * 0.12);
    canvas.setViewport(xlo, xhi, lo - pad, hi + pad);
    if (m.steady) canvas.addFunction({ evaluator: safe((x) => (x >= x0 ? yp(x) : NaN)), color: canvas.gold(), thickness: 2, dashed: true, label: tx('kalıcı hâl', 'steady state') });
    canvas.addFunction({ evaluator: y, color: canvas.accent(), thickness: 3, label: 'y(x)' });
    canvas.addMarker({ x: x0, y: p.y0, color: canvas.orange(), shape: 'circle', radius: 6, label: `y(${x0}) = ${N2(p.y0)}` });
    canvas.addMarker({ x: xe, y: m.y(xe), color: canvas.gold(), shape: 'diamond', radius: 7, label: `y(${N2(xe)}) = ${N2(m.y(xe))}` });
  }
  function concept1() {
    return tx(`TANIM
y′ + P(x)y = Q(x) biçimindeki denkleme birinci mertebeden LİNEER denklem denir (y ve y′ yalnızca birinci kuvvetten görünür, çarpımları yoktur). Q = 0 ise denklem homojen, değilse homojen olmayandır.

İNTEGRASYON ÇARPANI YÖNTEMİ
1. Denklemi y′ + P(x)y = Q(x) standart biçimine getiririz (y′ nün katsayısı 1 olmalıdır; gerekirse bölünür).
2. μ(x) = e^(∫P dx) integrasyon çarpanını buluruz (integral sabitini 0 alırız).
3. İki yanı μ ile çarparız: sol taraf bir türev olur, (μy)′ = μy′ + μ′y = μQ, çünkü μ′ = Pμ.
4. İki yanı integre ederiz: μy = ∫μQ dx + C (gerekirse kısmi integrasyon).
5. Genel çözüm: y = (1/μ)(∫μQ dx + C).
6. Başlangıç koşulundan C sabitini buluruz ve y(x) i yazarız.

DURUMLAR
• P sabit, Q sabit: y′ + ay = c için μ = e^(ax); integral doğrudan alınır, çözüm y = c/a + Ce^(−ax).
• P sabit, Q = x (polinom): μQ = x·e^(ax) için kısmi integrasyon gerekir; çözüm y = x/a − 1/a² + Ce^(−ax).
• P sabit, Q = eˣ: μQ = e^((a+1)x); çözüm y = eˣ/(a+1) + Ce^(−ax).
• P sabit, Q = sin x: ∫e^(ax)·sin x dx için iki kez kısmi integrasyon; çözüm y = (a·sin x − cos x)/(a²+1) + Ce^(−ax).
• P = 1/x: (x > 0) μ = x ve (xy)′ = xQ.
• P = 2/x: (x > 0) μ = x² ve (x²y)′ = x²Q.

GEÇİCİ VE KALICI KISIM
• P = a > 0 sabit ise çözüm y = yₚ(x) + Ce^(−ax) biçimindedir: Ce^(−ax) terimi x → ∞ için 0'a gider (GEÇİCİ kısım), yₚ ise geriye kalan KALICI (kararlı hâl) davranıştır.

TUZAKLAR
• P'yi okumadan önce denklemi standart biçime getirmek gerekir (xy′ + y = … ise önce x'e bölünür).
• μ = e^(∫P dx) hesabında mutlak değer unutulmamalı: x > 0 iken e^(ln x) = x.
• C, 1/μ ile birlikte çarpılır: y = (∫μQ dx + C)/μ; C'yi μ'ye bölmeyi unutmak yaygın bir hatadır.
• Başlangıç koşulu genel çözümde, C belirlenirken kullanılır (integralin içinde değil).

MİNİ ÖRNEK
y′ + 2y = 6, y(0) = 1: μ = e^(2x), (e^(2x)y)′ = 6e^(2x) ⇒ e^(2x)y = 3e^(2x) + C ⇒ y = 3 + Ce^(−2x). y(0) = 1 ⇒ C = −2 ⇒ y = 3 − 2e^(−2x); kalıcı değer 3. ✓`,
    `DEFINITION
An equation of the form y′ + P(x)y = Q(x) is a FIRST-ORDER LINEAR equation (y and y′ appear only to the first power and are not multiplied together). If Q = 0 it is homogeneous, otherwise non-homogeneous.

THE INTEGRATING-FACTOR METHOD
1. We put the equation in the standard form y′ + P(x)y = Q(x) (the coefficient of y′ must be 1; divide if necessary).
2. We find the integrating factor μ(x) = e^(∫P dx) (take the integration constant to be 0).
3. We multiply both sides by μ: the left side becomes a derivative, (μy)′ = μy′ + μ′y = μQ, because μ′ = Pμ.
4. We integrate both sides: μy = ∫μQ dx + C (by parts when needed).
5. General solution: y = (1/μ)(∫μQ dx + C).
6. We find C from the initial condition and write y(x).

CASES
• P constant, Q constant: for y′ + ay = c we get μ = e^(ax); the integral is direct and y = c/a + Ce^(−ax).
• P constant, Q = x (polynomial): μQ = x·e^(ax) needs integration by parts; y = x/a − 1/a² + Ce^(−ax).
• P constant, Q = eˣ: μQ = e^((a+1)x); y = eˣ/(a+1) + Ce^(−ax).
• P constant, Q = sin x: ∫e^(ax)·sin x dx needs two integrations by parts; y = (a·sin x − cos x)/(a²+1) + Ce^(−ax).
• P = 1/x: (x > 0) μ = x and (xy)′ = xQ.
• P = 2/x: (x > 0) μ = x² and (x²y)′ = x²Q.

TRANSIENT AND STEADY PART
• For a constant P = a > 0 the solution has the form y = yₚ(x) + Ce^(−ax): the term Ce^(−ax) tends to 0 as x → ∞ (the TRANSIENT part) and yₚ is the long-term STEADY behaviour.

PITFALLS
• Put the equation in standard form before reading P (for xy′ + y = … divide by x first).
• In μ = e^(∫P dx) remember the absolute value: for x > 0, e^(ln x) = x.
• C is divided by μ together with the integral: y = (∫μQ dx + C)/μ; forgetting to divide C by μ is a common mistake.
• The initial condition is used in the general solution to fix C (not inside the integral).

MINI EXAMPLE
y′ + 2y = 6, y(0) = 1: μ = e^(2x), (e^(2x)y)′ = 6e^(2x) ⇒ e^(2x)y = 3e^(2x) + C ⇒ y = 3 + Ce^(−2x). y(0) = 1 ⇒ C = −2 ⇒ y = 3 − 2e^(−2x); steady value 3. ✓`);
  }
  function controls1(rightCol, getProblem, h) {
    caption(rightCol, tx('Denklem türü', 'Equation type'));
    sel1 = h.addSelect({ options: kindTitle1().map((label, value) => ({ label, value })), get: () => getProblem().kind, set: (v) => { const p = getProblem(); p.kind = Number(v); norm1(p); syncReg(sxe1); } });
    h.addSlider({ caption: tx('Başlangıç değeri y₀', 'Initial value y₀'), min: -4, max: 6, step: 0.5, get: () => getProblem().y0, set: (v) => { getProblem().y0 = v; } });
    sxe1 = h.addSlider({ caption: tx('Hesaplanacak nokta: başlangıçtan uzaklık', 'Evaluation point: distance from the start'), min: 0.5, max: 4, step: 0.5,
      get: () => { const p = getProblem(); return p.xe - (p.kind >= 4 ? 1 : 0); }, set: (v) => { const p = getProblem(); p.xe = (p.kind >= 4 ? 1 : 0) + v; } });
  }
  const make1 = (kind) => (rng) => { forced1 = { kind }; try { return createProblem1(rng); } finally { forced1 = null; } };
  Topics.register('calc2', {
    id: 'linear1',
    tabTitle: () => tx('Birinci Mertebe Lineer Denklemler', 'First-Order Linear Equations'),
    concept: concept1,
    problemStatement: statement1,
    createProblem: createProblem1,
    solveSteps: steps1,
    draw: draw1,
    buildControls: controls1,
    links: [
      { match: /^• (P sabit, Q sabit|P constant, Q constant):/, make: make1(0) },
      { match: /^• (P sabit, Q = x|P constant, Q = x)/, make: make1(1) },
      { match: /^• (P sabit, Q = eˣ|P constant, Q = eˣ):/, make: make1(2) },
      { match: /^• (P sabit, Q = sin x|P constant, Q = sin x):/, make: make1(3) },
      { match: /^• P = 1\/x:/, make: make1(4) },
      { match: /^• P = 2\/x:/, make: make1(5) },
      { match: /^• (P = a > 0 sabit ise|For a constant P = a > 0)/, make: make1(0) },
    ],
    challenge: {
      prompt: (p) => { const m = mdl1(p); return tx(`${m.eq}${m.k >= 4 ? ' (x > 0)' : ''}, y(${m.x0}) = ${N2(p.y0)}. y(${N2(p.xe)}) kaçtır? İntegrasyon çarpanıyla çözüp 2 ondalık basamakla yazalım.`, `${m.eq}${m.k >= 4 ? ' (x > 0)' : ''}, y(${m.x0}) = ${N2(p.y0)}. What is y(${N2(p.xe)})? Let's solve with the integrating factor and type it to 2 decimals.`); },
      target: (p) => mdl1(p).y(p.xe),
      tol: (p) => Math.max(0.02, 0.005 * Math.abs(mdl1(p).y(p.xe))),
      hint: (p, g) => { const m = mdl1(p); return tx(g > m.y(p.xe) ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > m.y(p.xe) ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx(`Genel çözüm y = ${m.ypTxt} + C·${m.homTxt}; C'yi başlangıç koşulundan bulalım.`, `The general solution is y = ${m.ypTxt} + C·${m.homTxt}; let's get C from the initial condition.`); },
    },
    _test: { mdl: mdl1, check: check1, rk4 },
    _scenarioCount: () => 6,
    _setScenario: (i) => { forced1 = { kind: i }; },
  });

  // =====================================================================================================================
  // 2) APPLICATIONS  (modes 0 exponential growth/decay, 1 Newton cooling, 2 mixing tank, 3 RC circuit, 4 logistic)
  // p = { mode, ask 'val'|'time', uT, uV (multiples of the characteristic time), V (target value), + parameters }
  // =====================================================================================================================
  let forced2 = null;
  const MODES2 = () => [tx('Üstel büyüme / bozunma', 'Exponential growth / decay'), tx('Newton soğuma yasası', "Newton's law of cooling"), tx('Karışım tankı (tuz)', 'Mixing tank (salt)'), tx('RC devresi', 'RC circuit'), tx('Lojistik büyüme', 'Logistic growth')];

  function model2(p) {
    const m = { mode: p.mode };
    const md = p.mode;
    if (md === 0) {
      const dec = p.r < 1, T = p.T, y0 = p.y0, kk = Math.log(p.r) / T, lam = Math.abs(kk);
      Object.assign(m, { dec, y0, tau: T, Q: (t) => y0 * Math.exp(kk * t), ode: (t, y) => kk * y, lim: null, tInv: (V) => Math.log(V / y0) / kk,
        unit: dec ? 'g' : tx('bakteri', 'bacteria'), tunit: dec ? tx('gün', 'days') : tx('saat', 'hours'), qname: dec ? tx('madde miktarı y', 'amount y') : tx('bakteri sayısı y', 'number of bacteria y') });
      const rn = p.r === 2 ? tx('iki', 'two') : tx('üç', 'three');
      m.story = dec ? tx(`Radyoaktif bir maddenin yarı ömrü ${T} gündür. Başlangıçta ${y0} g madde vardır; bozunma hızı eldeki miktarla orantılıdır.`, `A radioactive substance has a half-life of ${T} days. Initially there are ${y0} g of it; the decay rate is proportional to the amount present.`)
        : tx(`Bir bakteri kültüründe sayı her ${T} saatte ${rn} katına çıkıyor. Başlangıçta ${y0} bakteri var; büyüme hızı mevcut sayıyla orantılıdır.`, `In a bacteria culture the number ${p.r === 2 ? 'doubles' : 'triples'} every ${T} hours. Initially there are ${y0} bacteria; the growth rate is proportional to the current number.`);
      m.model = dec ? tx(`y(t), t gün sonraki madde miktarı (g) olsun. Hız miktarla orantılı: y′ = −λy (λ > 0), y(0) = ${y0}.`, `Let y(t) be the amount (g) after t days. The rate is proportional to the amount: y′ = −λy (λ > 0), y(0) = ${y0}.`)
        : tx(`y(t), t saat sonraki bakteri sayısı olsun. Hız sayıyla orantılı: y′ = ky (k > 0), y(0) = ${y0}.`, `Let y(t) be the number of bacteria after t hours. The rate is proportional to the number: y′ = ky (k > 0), y(0) = ${y0}.`);
      m.solve = dec ? tx(`Ayrılabilir ya da lineer (y′ + λy = 0, μ = e^(λt)): y = y₀e^(−λt). Yarı ömür: y(${T}) = y₀/2 ⇒ e^(−λ·${T}) = 1/2 ⇒ λ = ln 2/${T} = ${N3(lam)} /gün.`, `Separable (or linear with y′ + λy = 0, μ = e^(λt)): y = y₀e^(−λt). Half-life: y(${T}) = y₀/2 ⇒ e^(−λ·${T}) = 1/2 ⇒ λ = ln 2/${T} = ${N3(lam)} per day.`)
        : tx(`Ayrılabilir: dy/y = k dt ⇒ y = y₀e^(kt). Veri: y(${T}) = ${p.r}·y₀ ⇒ e^(k·${T}) = ${p.r} ⇒ k = ln ${p.r}/${T} = ${N3(lam)} /saat.`, `Separable: dy/y = k dt ⇒ y = y₀e^(kt). Data: y(${T}) = ${p.r}·y₀ ⇒ e^(k·${T}) = ${p.r} ⇒ k = ln ${p.r}/${T} = ${N3(lam)} per hour.`);
      m.law = `y(t) = ${y0}·e^(${dec ? '−' : ''}${N3(lam)}t)`;
      m.key = { t: T, y: y0 * p.r, label: dec ? `T½ = ${T}` : `×${p.r}` };
      m.keyTxt = dec ? tx(`Yarı ömür T½ = ${T} gün: bu anda miktar ${N2(y0 / 2)} g.`, `Half-life T½ = ${T} days: the amount is ${N2(y0 / 2)} g at that moment.`) : tx(`T = ${T} saat sonra sayı ${N2(y0 * p.r)} olur (×${p.r}).`, `After T = ${T} hours the number is ${N2(y0 * p.r)} (×${p.r}).`);
      m.assume = dec ? tx('Bozunma hızı yalnızca eldeki miktara bağlıdır (sıcaklık, basınç gibi etkenlerden bağımsız); y gram, t gün cinsinden.', 'The decay rate depends only on the amount present (independent of temperature, pressure ...); y in grams, t in days.')
        : tx('Besin ve yer sınırsız, kişi başına oran sabit; sayı sürekli bir değişken olarak ele alınır; y bakteri sayısı, t saat cinsinden.', 'Unlimited food and room, constant per-capita rate; the count is treated as a continuous variable; y in bacteria, t in hours.');
    } else if (md === 1) {
      const Tm = p.Tm, D = p.D, T0 = Tm + D, t1 = p.t1, rd = p.rho === 0.5 ? 2 : 3, kk = Math.log(rd) / t1;
      Object.assign(m, { y0: T0, tau: t1, Q: (t) => Tm + D * Math.exp(-kk * t), ode: (t, y) => -kk * (y - Tm), lim: Tm, limName: `Tₘ = ${Tm} °C`, tInv: (V) => Math.log(D / (V - Tm)) / kk, unit: '°C', tunit: tx('dakika', 'minutes'), qname: tx('sıcaklık T', 'temperature T') });
      m.story = tx(`Sıcaklığı ${T0} °C olan bir cisim, sıcaklığı sabit ${Tm} °C olan bir ortama bırakılıyor. ${t1} dakikada cisim ile ortam arasındaki sıcaklık farkı ${rd === 2 ? 'yarıya' : 'üçte bire'} iniyor (Newton'un soğuma yasası).`,
        `An object at ${T0} °C is placed in surroundings kept at a constant ${Tm} °C. In ${t1} minutes the temperature difference between object and surroundings falls to ${rd === 2 ? 'half' : 'one third'} (Newton's law of cooling).`);
      m.model = tx(`T(t), t dakika sonraki sıcaklık (°C) olsun. Newton: T′ = −k(T − Tₘ), Tₘ = ${Tm}, T(0) = ${T0}.`, `Let T(t) be the temperature (°C) after t minutes. Newton: T′ = −k(T − Tₘ), Tₘ = ${Tm}, T(0) = ${T0}.`);
      m.solve = tx(`u = T − Tₘ ⇒ u′ = −ku (lineer, μ = e^(kt)) ⇒ u = u₀e^(−kt), yani T = ${Tm} + (${N2(D)})·e^(−kt). Veri: u(${t1}) = u₀/${rd} ⇒ e^(−k·${t1}) = 1/${rd} ⇒ k = ln ${rd}/${t1} = ${N3(kk)} /dk.`,
        `u = T − Tₘ ⇒ u′ = −ku (linear, μ = e^(kt)) ⇒ u = u₀e^(−kt), i.e. T = ${Tm} + (${N2(D)})·e^(−kt). Data: u(${t1}) = u₀/${rd} ⇒ e^(−k·${t1}) = 1/${rd} ⇒ k = ln ${rd}/${t1} = ${N3(kk)} per min.`);
      m.law = `T(t) = ${Tm} + (${N2(D)})·e^(−${N3(kk)}t)`;
      m.key = { t: 1 / kk, y: Tm + D / Math.E, label: 'τ = 1/k' };
      m.keyTxt = tx(`Zaman sabiti τ = 1/k = ${N2(1 / kk)} dk: bu anda fark ilk farkın 1/e katıdır (T = ${N2(Tm + D / Math.E)} °C).`, `Time constant τ = 1/k = ${N2(1 / kk)} min: the difference is 1/e of the initial one (T = ${N2(Tm + D / Math.E)} °C).`);
      m.assume = tx('Ortam sıcaklığı sabit, cismin her yerinde tek bir sıcaklık var, ısı alışverişi yalnızca sıcaklık farkıyla orantılı; T °C, t dakika cinsinden.', 'Constant ambient temperature, the object has one uniform temperature, heat exchange proportional to the temperature difference only; T in °C, t in minutes.');
    } else if (md === 2) {
      const vol = p.vol, r = p.rate, cin = p.cin, S0 = p.S0, tau = vol / r, eq = vol * cin;
      Object.assign(m, { y0: S0, tau, Q: (t) => eq + (S0 - eq) * Math.exp(-t / tau), ode: (t, y) => r * cin - r / vol * y, lim: eq, limName: `S∞ = ${N2(eq)} g`, tInv: (V) => -tau * Math.log((V - eq) / (S0 - eq)), unit: 'g', tunit: tx('dakika', 'minutes'), qname: tx('tuz miktarı S', 'amount of salt S') });
      m.story = tx(`${vol} L'lik sabit hacimli bir tankta başlangıçta ${S0} g tuz çözünmüştür. Tanka dakikada ${r} L hızla, litresinde ${cin} g tuz içeren tuzlu su giriyor; iyice karıştırılan çözelti aynı hızla (dakikada ${r} L) boşalıyor.`,
        `A tank of constant volume ${vol} L initially contains ${S0} g of dissolved salt. Brine with ${cin} g of salt per litre flows in at ${r} L/min; the well-stirred mixture flows out at the same rate (${r} L/min).`);
      m.model = tx(`S(t), t dakika sonraki tuz miktarı (g) olsun. S′ = giren − çıkan = ${r}·${cin} − (${r}/${vol})·S = ${N2(r * cin)} − S/${N2(tau)}, S(0) = ${S0}.`, `Let S(t) be the amount of salt (g) after t minutes. S′ = in − out = ${r}·${cin} − (${r}/${vol})·S = ${N2(r * cin)} − S/${N2(tau)}, S(0) = ${S0}.`);
      m.solve = tx(`Lineer: S′ + S/${N2(tau)} = ${N2(r * cin)}, μ = e^(t/${N2(tau)}); (μS)′ = ${N2(r * cin)}·μ ⇒ μS = ${N2(eq)}·μ + C ⇒ S = ${N2(eq)} + Ce^(−t/${N2(tau)}). S(0) = ${S0} ⇒ C = ${S0} − ${N2(eq)} = ${N2(S0 - eq)}. Zaman sabiti τ = V/r = ${N2(tau)} dk, denge S∞ = V·c = ${N2(eq)} g.`,
        `Linear: S′ + S/${N2(tau)} = ${N2(r * cin)}, μ = e^(t/${N2(tau)}); (μS)′ = ${N2(r * cin)}·μ ⇒ μS = ${N2(eq)}·μ + C ⇒ S = ${N2(eq)} + Ce^(−t/${N2(tau)}). S(0) = ${S0} ⇒ C = ${S0} − ${N2(eq)} = ${N2(S0 - eq)}. Time constant τ = V/r = ${N2(tau)} min, equilibrium S∞ = V·c = ${N2(eq)} g.`);
      m.law = `S(t) = ${N2(eq)} + (${N2(S0 - eq)})·e^(−t/${N2(tau)})`;
      m.key = { t: tau, y: eq + (S0 - eq) / Math.E, label: 'τ = V/r' };
      m.keyTxt = tx(`t = τ = ${N2(tau)} dk'da denge farkının 1/e'si kalır: S = ${N2(eq + (S0 - eq) / Math.E)} g.`, `At t = τ = ${N2(tau)} min a fraction 1/e of the gap to equilibrium is left: S = ${N2(eq + (S0 - eq) / Math.E)} g.`);
      m.assume = tx('Tuz anında ve düzgün biçimde karışır (ideal karışma); hacim sabit (giriş debisi = çıkış debisi); giriş derişimi sabit; S gram, t dakika, V litre cinsinden.', 'Ideal (instant, uniform) mixing; constant volume (inflow = outflow); constant inflow concentration; S in grams, t in minutes, V in litres.');
    } else if (md === 3) {
      const R = p.R, C = p.C, E = p.E, tau = R * C, qi = C * E;
      Object.assign(m, { y0: 0, tau, Q: (t) => qi * (1 - Math.exp(-t / tau)), ode: (t, y) => E / R - y / tau, lim: qi, limName: `q∞ = ${N2(qi)} µC`, tInv: (V) => -tau * Math.log(1 - V / qi), unit: 'µC', tunit: 'ms', qname: tx('yük q', 'charge q') });
      m.story = tx(`Başlangıçta boş olan ${C} µF'lık bir kondansatör, ${R} kΩ'luk bir direnç üzerinden ${E} V'luk bir kaynağa bağlanıyor (t = 0).`, `At t = 0 an initially empty ${C} µF capacitor is connected through a ${R} kΩ resistor to a ${E} V source.`);
      m.model = tx(`Kirchhoff gerilim yasası: E = R·i + q/C, i = q′ ⇒ q′ + q/(RC) = E/R, q(0) = 0. RC = ${R} kΩ·${C} µF = ${N2(tau)} ms.`, `Kirchhoff's voltage law: E = R·i + q/C, i = q′ ⇒ q′ + q/(RC) = E/R, q(0) = 0. RC = ${R} kΩ·${C} µF = ${N2(tau)} ms.`);
      m.solve = tx(`Lineer: μ = e^(t/RC), (μq)′ = (E/R)μ ⇒ μq = CE·μ + K ⇒ q = CE + Ke^(−t/RC). q(0) = 0 ⇒ K = −CE ⇒ q = CE(1 − e^(−t/RC)) = ${N2(qi)}(1 − e^(−t/${N2(tau)})). Son yük CE = ${C}·${E} = ${N2(qi)} µC.`,
        `Linear: μ = e^(t/RC), (μq)′ = (E/R)μ ⇒ μq = CE·μ + K ⇒ q = CE + Ke^(−t/RC). q(0) = 0 ⇒ K = −CE ⇒ q = CE(1 − e^(−t/RC)) = ${N2(qi)}(1 − e^(−t/${N2(tau)})). Final charge CE = ${C}·${E} = ${N2(qi)} µC.`);
      m.law = `q(t) = ${N2(qi)}·(1 − e^(−t/${N2(tau)}))`;
      m.key = { t: tau, y: qi * (1 - 1 / Math.E), label: 'τ = RC' };
      m.keyTxt = tx(`Zaman sabiti τ = RC = ${N2(tau)} ms'de yük son değerin %63,2'sine ulaşır (q = ${N2(qi * (1 - 1 / Math.E))} µC).`, `At the time constant τ = RC = ${N2(tau)} ms the charge reaches 63.2 % of its final value (q = ${N2(qi * (1 - 1 / Math.E))} µC).`);
      m.assume = tx('İdeal direnç, kondansatör ve kaynak; kaynak gerilimi sabit; kaçak akım ve iç direnç yok; R kΩ, C µF, E V, t ms, q µC cinsinden (kΩ·µF = ms, µF·V = µC).', 'Ideal resistor, capacitor and source; constant source voltage; no leakage or internal resistance; R in kΩ, C in µF, E in V, t in ms, q in µC (kΩ·µF = ms, µF·V = µC).');
    } else {
      const K = p.K, A = p.A, r = p.r, P0 = K / (A + 1), tau = 1 / r, tstar = Math.log(A) / r;
      Object.assign(m, { y0: P0, tau, Q: (t) => K / (1 + A * Math.exp(-r * t)), ode: (t, y) => r * y * (1 - y / K), lim: K, limName: `K = ${K}`, tInv: (V) => Math.log(A * V / (K - V)) / r, unit: tx('balık', 'fish'), tunit: tx('yıl', 'years'), qname: tx('balık sayısı P', 'number of fish P') });
      m.story = tx(`Bir gölde balık sayısı lojistik modele uyuyor: büyüme oranı r = ${r} /yıl, taşıma kapasitesi K = ${K} balık; başlangıçta ${N2(P0)} balık var.`, `The number of fish in a lake follows a logistic model: growth rate r = ${r} per year, carrying capacity K = ${K} fish; initially there are ${N2(P0)} fish.`);
      m.model = tx(`P(t), t yıl sonraki balık sayısı olsun. P′ = rP(1 − P/K) = ${r}·P(1 − P/${K}), P(0) = ${N2(P0)}.`, `Let P(t) be the number of fish after t years. P′ = rP(1 − P/K) = ${r}·P(1 − P/${K}), P(0) = ${N2(P0)}.`);
      m.solve = tx(`u = 1/P dönüşümü: u′ = −P′/P² = −ru + r/K (lineer!). μ = e^(rt) ⇒ u = 1/K + Ce^(−rt). Geri dönersek P = K/(1 + Ae^(−rt)), A = (K − P₀)/P₀ = (${K} − ${N2(P0)})/${N2(P0)} = ${A}. Yani P(t) = ${K}/(1 + ${A}e^(−${r}t)).`,
        `Substitute u = 1/P: u′ = −P′/P² = −ru + r/K (linear!). μ = e^(rt) ⇒ u = 1/K + Ce^(−rt). Back: P = K/(1 + Ae^(−rt)), A = (K − P₀)/P₀ = (${K} − ${N2(P0)})/${N2(P0)} = ${A}. So P(t) = ${K}/(1 + ${A}e^(−${r}t)).`);
      m.law = `P(t) = ${K}/(1 + ${A}e^(−${r}t))`;
      m.key = { t: tstar, y: K / 2, label: 'K/2' };
      m.keyTxt = tx(`P = K/2 = ${N2(K / 2)} olduğunda büyüme en hızlıdır (dönüm noktası): t* = ln A/r = ${N2(tstar)} yıl.`, `Growth is fastest at P = K/2 = ${N2(K / 2)} (inflection point): t* = ln A/r = ${N2(tstar)} years.`);
      m.assume = tx('Kapasite K sabit, nüfus sürekli bir değişken, yaş yapısı ve göç yok; hasat yok; P balık, t yıl cinsinden.', 'Constant carrying capacity K, population treated as continuous, no age structure or migration, no harvesting; P in fish, t in years.');
    }
    return m;
  }
  const tAns2 = (p, m) => (p.ask === 'time' ? m.tInv(p.V) : p.uT * m.tau);
  const val2 = (p, m) => (p.ask === 'time' ? p.V : m.Q(p.uT * m.tau));
  function check2(p) {
    const m = model2(p), tau = m.tau;
    for (const f of [0.3, 1, 2.7, 5]) { const t = f * tau, num = rk4(m.ode, 0, m.y0, t, 4000); if (!(rel(num, m.Q(t)) < 1e-7)) fail(`deApps mode ${p.mode}: closed form ≠ RK4 at t=${t}: ${m.Q(t)} vs ${num}`); }
    const t = tAns2(p, m);
    if (!Number.isFinite(t) || t <= 0) fail(`deApps mode ${p.mode}: time answer not finite: ${t}`);
    const num = rk4(m.ode, 0, m.y0, t, 4000), v = val2(p, m);
    if (!(rel(num, v) < 1e-6)) fail(`deApps mode ${p.mode}: answer ≠ RK4: ${v} vs ${num}`);
    return p;
  }
  // fill the parameters of a mode; with rng random, without rng the first option (used when the student switches the mode)
  function fill2(p, mode, ask, rng) {
    const pk = (arr) => (rng ? rng.pick(arr) : arr[0]);
    p.mode = mode; p.ask = ask;
    if (mode === 0) { const g = rng ? rng.nextInt(0, 2) : 0; if (g === 0) Object.assign(p, { r: 0.5, T: pk([2, 3, 5, 6, 8, 10]), y0: pk([80, 160, 240, 400, 800]) }); else Object.assign(p, { r: pk([2, 3]), T: pk([2, 3, 4, 6]), y0: pk([100, 200, 500, 1000]) }); }
    if (mode === 1) { const sc = pk([[20, 72], [25, 72], [30, 36], [40, -36]]); Object.assign(p, { Tm: sc[0], D: sc[1], rho: pk([0.5, 1 / 3]), t1: pk([5, 10, 15]) }); }
    if (mode === 2) { const vr = pk([[100, 10], [100, 5], [200, 10], [200, 5], [500, 20], [500, 10]]); Object.assign(p, { vol: vr[0], rate: vr[1], cin: pk([0.1, 0.2, 0.25, 0.5]), S0: pk([0, 20, 50, 100]) }); if (p.S0 === p.vol * p.cin) p.S0 += 10; }
    if (mode === 3) Object.assign(p, { R: pk([2, 5, 10]), C: pk([10, 20, 50]), E: pk([5, 10, 12]) });
    if (mode === 4) Object.assign(p, { K: pk([500, 1000, 2000]), A: pk([3, 4, 9]), r: pk([0.25, 0.5, 1]) });
    const m = model2(p), tau = m.tau;
    const third = mode === 1 && p.rho !== 0.5;
    p.uT = mode === 4 ? pk([1, 2, 3, 4]) : pk([1, 2, 3]);
    if ((mode === 0 && p.r === 3) || third) p.uT = Math.min(p.uT, mode === 0 ? 3 : 2);
    // target value: modes 0 and 1 hit a neat value after n characteristic times, modes 2-4 a neat fraction f of the way to the limit
    if (mode <= 1) p.V = m.Q(Math.min(p.uT, third ? 2 : 3) * tau);
    else { const f = pk([0.5, 0.75, 0.9]); p.V = mode === 4 ? f * p.K : m.y0 + f * (m.lim - m.y0); }
    p.V = round2(p.V);
    p.uV = m.tInv(p.V) / tau;
    return p;
  }
  let modeRg2 = null, askRg2 = null, sT2 = null, sV2 = null;
  function createProblem2(rng) {
    const mode = forced2 && forced2.mode != null ? forced2.mode : rng.nextInt(0, 5);
    const ask = forced2 && forced2.ask ? forced2.ask : (rng.nextInt(0, 2) === 0 ? 'val' : 'time');
    const p = fill2({}, mode, ask, rng);
    if (modeRg2) modeRg2.refreshFromModel();
    if (askRg2) askRg2.refreshFromModel();
    return check2(p);
  }
  function statement2(p) {
    const m = model2(p), t = p.uT * m.tau;
    if (p.ask === 'val') return tx(`${m.story} Modeli yazıp çözelim: t = ${N2(t)} ${m.tunit} sonra ${m.qname} kaç ${m.unit} olur?`, `${m.story} Let's write and solve the model: what is the ${m.qname} (${m.unit}) after t = ${N2(t)} ${m.tunit}?`);
    return tx(`${m.story} Modeli yazıp çözelim: ${m.qname} kaç ${m.tunit} sonra ${N2(p.V)} ${m.unit} değerine ulaşır?`, `${m.story} Let's write and solve the model: after how many ${m.tunit} does the ${m.qname} reach ${N2(p.V)} ${m.unit}?`);
  }
  function steps2(p) {
    const m = model2(p), tA = tAns2(p, m), vA = val2(p, m), out = [];
    out.push(tx(`── 1) Modeli yazalım ──\n${m.model}`, `── 1) Writing the model ──\n${m.model}`));
    out.push(tx(`── 2) Çözelim ──\n${m.solve}`, `── 2) Solving ──\n${m.solve}`));
    out.push(tx(`── 3) Çözüm fonksiyonu ──\n${m.law}.\n${m.keyTxt}`, `── 3) The solution function ──\n${m.law}.\n${m.keyTxt}`));
    if (p.ask === 'val') out.push(tx(`── 4) Yanıt ──\nt = ${N2(tA)} ${m.tunit}: değer = ${N2(vA)} ${m.unit}.`, `── 4) Answer ──\nt = ${N2(tA)} ${m.tunit}: value = ${N2(vA)} ${m.unit}.`));
    else out.push(tx(`── 4) Yanıt ──\n${m.qname} = ${N2(p.V)} ${m.unit} denklemini t için çözeriz (üstel ifade = sayı ⇒ doğal logaritma): t = ${N2(tA)} ${m.tunit}.`, `── 4) Answer ──\nWe solve ${m.qname} = ${N2(p.V)} ${m.unit} for t (exponential = number ⇒ natural logarithm): t = ${N2(tA)} ${m.tunit}.`));
    const num = rk4(m.ode, 0, m.y0, tA, 2000);
    out.push(tx(`── 5) Sayısal kontrol ──\nRK4 (2000 adım): t = ${N2(tA)} ${m.tunit} için ${N2(num)} ${m.unit}; çözümle ${N2(vA)} ${m.unit} ✓.`, `── 5) Numerical check ──\nRK4 (2000 steps): ${N2(num)} ${m.unit} at t = ${N2(tA)} ${m.tunit}; closed form ${N2(vA)} ${m.unit} ✓.`));
    out.push(tx(`── 6) Varsayımlar ve birimler ──\n${m.assume}`, `── 6) Assumptions and units ──\n${m.assume}`));
    return out;
  }
  function draw2(canvas, p) {
    const m = model2(p), tau = m.tau, tmax = 5 * tau, tA = tAns2(p, m), vA = val2(p, m);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 100; i++) { const v = m.Q(tmax * i / 100); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (m.lim != null) { lo = Math.min(lo, m.lim); hi = Math.max(hi, m.lim); }
    if (p.mode !== 1) lo = Math.min(lo, 0);
    const pad = (hi - lo) * 0.1 || 1;
    canvas.setViewport(-0.07 * tmax, tmax * 1.04, lo - pad, hi + pad);
    const q = safe((t) => (t >= 0 ? m.Q(t) : NaN));
    canvas.addFunction({ evaluator: q, color: canvas.accent(), thickness: 3, label: ['y(t)', 'T(t)', 'S(t)', 'q(t)', 'P(t)'][m.mode] });
    if (m.lim != null) { canvas.addSegment({ x1: 0, y1: m.lim, x2: tmax, y2: m.lim, color: canvas.gold(), thickness: 2, dashed: true }); canvas.addMarker({ x: tmax * 0.86, y: m.lim, color: canvas.gold(), shape: 'circle', radius: 3, label: m.limName }); }
    canvas.addMarker({ x: m.key.t, y: m.key.y, color: canvas.green(), shape: 'diamond', radius: 7, label: m.key.label });
    canvas.addMarker({ x: 0, y: m.y0, color: canvas.orange(), shape: 'circle', radius: 5, hollow: true });
    canvas.addSegment({ x1: tA, y1: lo - pad, x2: tA, y2: vA, color: canvas.orange(), thickness: 1.5, dashed: true });
    canvas.addSegment({ x1: 0, y1: vA, x2: tA, y2: vA, color: canvas.orange(), thickness: 1.5, dashed: true });
    canvas.addMarker({ x: tA, y: vA, color: canvas.red(), shape: 'circle', radius: 7, label: `(${N2(tA)}; ${N2(vA)})` });
  }
  function concept2() {
    return tx(`FİKİR
Gerçek bir olayı diferansiyel denklemle modelleriz ("değişim hızı = giren − çıkan" ya da "hız = k·miktar"), denklemi çözer, sabitleri verilerden buluruz ve sonucu BİRİMİYLE yorumlarız.

YÖNTEM
1. Bilinmeyeni ve birimini tanımlarız (miktar, zaman ve birimleri).
2. Hikâyeyi denkleme çeviririz: dy/dt = (giren hız) − (çıkan hız) ya da dy/dt = k·y.
3. Denklemi çözeriz (ayrılabilir ya da birinci mertebe lineer).
4. Başlangıç değerinden ve bir ölçümden (yarı ömür, bir sıcaklık, zaman sabiti) sabitleri buluruz.
5. Soruyu yanıtlarız, birimi yazarız, sonucun anlamlı olup olmadığına bakarız (miktar negatif olamaz).
6. Varsayımları açıkça yazarız.

MODELLER
• ÜSTEL BÜYÜME / BOZUNMA: y′ = ky ⇒ y = y₀e^(kt). Bozunmada y′ = −λy ve yarı ömür T½ = ln 2/λ; büyümede katlanma süresi ln 2/k.
• NEWTON SOĞUMA YASASI: T′ = −k(T − Tₘ) ⇒ T = Tₘ + (T₀ − Tₘ)e^(−kt); T → Tₘ, zaman sabiti τ = 1/k.
• KARIŞIM (TUZ) TANKI: S′ = (giren) − (S/V)·r ⇒ S = S∞ + (S₀ − S∞)e^(−t/τ), τ = V/r, S∞ = V·c.
• RC DEVRESİ: q′ + q/(RC) = E/R, q(0) = 0 ⇒ q = CE(1 − e^(−t/RC)); τ = RC'de yük son değerin %63,2'sidir.
• LOJİSTİK BÜYÜME: P′ = rP(1 − P/K) ⇒ P = K/(1 + Ae^(−rt)), A = (K − P₀)/P₀; K taşıma kapasitesidir, P = K/2'de büyüme en hızlıdır.

TUZAKLAR
• Bozunmada işaret: y′ = −λy (λ > 0); üstel terimin işaretini unutmak.
• Newton yasasında T'nin kendisi değil T − Tₘ üstel biçimde değişir.
• Birimleri karıştırmak (dakika/saat, g/L); RC için kΩ·µF = ms.
• Hacim sabit değilse karışım denklemi değişir; burada giriş = çıkış varsayılmıştır.

MİNİ ÖRNEK
Yarı ömrü 5 gün olan maddeden 80 g var: λ = ln 2/5 ve y = 80·2^(−t/5). 15 gün sonra y = 80/2³ = 10 g. ✓`,
    `IDEA
We model a real situation with a differential equation ("rate of change = in − out" or "rate = k·amount"), solve it, find the constants from data and interpret the result WITH ITS UNITS.

METHOD
1. Define the unknown and its unit (quantity, time and their units).
2. Translate the story into an equation: dy/dt = (rate in) − (rate out) or dy/dt = k·y.
3. Solve the equation (separable or first-order linear).
4. Find the constants from the initial value and one measurement (half-life, a temperature, a time constant).
5. Answer the question, write the unit, and check that the result makes sense (an amount cannot be negative).
6. State the assumptions explicitly.

MODELS
• EXPONENTIAL GROWTH / DECAY: y′ = ky ⇒ y = y₀e^(kt). For decay y′ = −λy and the half-life is T½ = ln 2/λ; for growth the doubling time is ln 2/k.
• NEWTON'S LAW OF COOLING: T′ = −k(T − Tₘ) ⇒ T = Tₘ + (T₀ − Tₘ)e^(−kt); T → Tₘ, time constant τ = 1/k.
• MIXING (SALT) TANK: S′ = (in) − (S/V)·r ⇒ S = S∞ + (S₀ − S∞)e^(−t/τ), τ = V/r, S∞ = V·c.
• RC CIRCUIT: q′ + q/(RC) = E/R, q(0) = 0 ⇒ q = CE(1 − e^(−t/RC)); at τ = RC the charge is 63.2 % of its final value.
• LOGISTIC GROWTH: P′ = rP(1 − P/K) ⇒ P = K/(1 + Ae^(−rt)), A = (K − P₀)/P₀; K is the carrying capacity and growth is fastest at P = K/2.

PITFALLS
• Sign in decay: y′ = −λy (λ > 0); forgetting the sign of the exponent.
• In Newton's law it is T − Tₘ, not T itself, that is exponential.
• Mixing units (minutes/hours, g/L); for RC, kΩ·µF = ms.
• If the volume is not constant the mixing equation changes; here inflow = outflow is assumed.

MINI EXAMPLE
80 g of a substance with half-life 5 days: λ = ln 2/5 and y = 80·2^(−t/5). After 15 days y = 80/2³ = 10 g. ✓`);
  }
  function controls2(rightCol, getProblem, h) {
    caption(rightCol, tx('Model', 'Model'));
    modeRg2 = h.addRadioGroup({ name: 'deAppMode', options: MODES2().map((label, value) => ({ label, value })), get: () => getProblem().mode,
      set: (v) => { const p = getProblem(); fill2(p, Number(v), p.ask); syncReg(sT2); syncReg(sV2); } });
    caption(rightCol, tx('Soru türü', 'Question type'));
    askRg2 = h.addRadioGroup({ name: 'deAppAsk', options: [{ label: tx('t anındaki değeri bul', 'find the value at time t'), value: 'val' }, { label: tx('değere ulaşma süresini bul', 'find the time to reach a value'), value: 'time' }],
      get: () => getProblem().ask, set: (v) => { getProblem().ask = v; } });
    sT2 = h.addSlider({ caption: tx('Gözlem süresi t (karakteristik sürenin katı)', 'Observation time t (multiple of the characteristic time)'), min: 0.5, max: 4, step: 0.5,
      get: () => getProblem().uT, set: (v) => { getProblem().uT = v; } });
    sV2 = h.addSlider({ caption: tx('Hedef değer (bu süre katındaki değer)', 'Target value (the value at this multiple of the time)'), min: 0.25, max: 5, step: 0.25,
      get: () => getProblem().uV, set: (v) => { const p = getProblem(); p.uV = v; const m = model2(p); p.V = round2(m.Q(v * m.tau)); } });
  }
  const make2 = (mode) => (rng) => { forced2 = { mode }; try { return createProblem2(rng); } finally { forced2 = null; } };
  Topics.register('calc2', {
    id: 'deApps',
    tabTitle: () => tx('Diferansiyel Denklem Uygulamaları', 'Differential Equation Applications'),
    concept: concept2,
    problemStatement: statement2,
    createProblem: createProblem2,
    solveSteps: steps2,
    draw: draw2,
    buildControls: controls2,
    links: [
      { match: /^• (ÜSTEL BÜYÜME|EXPONENTIAL GROWTH)/, make: make2(0) },
      { match: /^• (NEWTON SOĞUMA|NEWTON'S LAW)/, make: make2(1) },
      { match: /^• (KARIŞIM|MIXING)/, make: make2(2) },
      { match: /^• (RC DEVRESİ|RC CIRCUIT)/, make: make2(3) },
      { match: /^• (LOJİSTİK|LOGISTIC)/, make: make2(4) },
    ],
    challenge: {
      prompt: (p) => { const m = model2(p), t = p.uT * m.tau; return p.ask === 'val' ? tx(`${m.story} t = ${N2(t)} ${m.tunit} sonra ${m.qname} kaç ${m.unit} olur? Modeli çözüp 2 ondalık basamakla yazalım.`, `${m.story} What is the ${m.qname} (${m.unit}) after t = ${N2(t)} ${m.tunit}? Let's solve the model and type it to 2 decimals.`)
        : tx(`${m.story} ${m.qname} kaç ${m.tunit} sonra ${N2(p.V)} ${m.unit} olur? Modeli çözüp 2 ondalık basamakla yazalım.`, `${m.story} After how many ${m.tunit} does the ${m.qname} reach ${N2(p.V)} ${m.unit}? Let's solve the model and type it to 2 decimals.`); },
      target: (p) => (p.ask === 'val' ? val2(p, model2(p)) : tAns2(p, model2(p))),
      tol: (p) => { const m = model2(p), v = p.ask === 'val' ? val2(p, m) : tAns2(p, m); return Math.max(0.02, 0.01 * Math.abs(v)); },
      hint: (p, g) => { const m = model2(p); const t = p.ask === 'val' ? val2(p, m) : tAns2(p, m); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx(`Çözüm: ${m.law}.`, `Solution: ${m.law}.`); },
    },
    _test: { model: model2, tAns: tAns2, val: val2, check: check2, rk4 },
    _scenarioCount: () => 10,
    _setScenario: (i) => { forced2 = { mode: i % 5, ask: i < 5 ? 'val' : 'time' }; },
  });

  // =====================================================================================================================
  // 3) AUTONOMOUS EQUATIONS AND THE PHASE LINE   y' = f(y)
  // p = { kind 0..3, par (a | c | a | h), y0, ask 'count'|'stable' }
  // kinds: 0 y(a − y) | 1 y(y − 1)(c − y) | 2 y² − a | 3 y(1 − y) − h (logistic with harvesting)
  // =====================================================================================================================
  let forced3 = null;
  const W3 = [[-3, 4], [-2, 4], [-3, 3], [-1, 2]];
  const PR3 = [[-3, 3], [-1, 3], [-2, 4], [0, 0.5]];
  function norm3(p) {
    p.kind = clamp(Math.round(p.kind), 0, 3);
    const [lo, hi] = PR3[p.kind];
    p.par = p.kind === 3 ? Math.round(clamp(p.par, lo, hi) * 100) / 100 : Math.round(clamp(p.par, lo, hi) * 2) / 2;
    p.y0 = clamp(Math.round(p.y0 * 4) / 4, W3[p.kind][0] + 0.25, W3[p.kind][1] - 0.25);
    return p;
  }
  function fn3(p) {
    const q = p.par, k = p.kind;
    if (k === 0) return { f: (y) => y * (q - y), d: (y) => q - 2 * y, roots: q === 0 ? [0] : [0, q].sort((u, v) => u - v) };
    if (k === 1) {
      const rs = []; [0, 1, q].forEach((r) => { if (!rs.some((u) => Math.abs(u - r) < 1e-9)) rs.push(r); });
      return { f: (y) => y * (y - 1) * (q - y), d: (y) => (2 * y - 1) * (q - y) - y * (y - 1), roots: rs.sort((u, v) => u - v) };
    }
    if (k === 2) return { f: (y) => y * y - q, d: (y) => 2 * y, roots: q > 0 ? [-Math.sqrt(q), Math.sqrt(q)] : q === 0 ? [0] : [] };
    const disc = Math.round((1 - 4 * q) * 1e9) / 1e9;
    return { f: (y) => y * (1 - y) - q, d: (y) => 1 - 2 * y, roots: disc > 0 ? [(1 - Math.sqrt(disc)) / 2, (1 + Math.sqrt(disc)) / 2] : disc === 0 ? [0.5] : [] };
  }
  // equilibria with the stability read from the sign of f on both sides (the derivative is only a cross-check) and the intervals between them
  function analyse3(p) {
    norm3(p);
    const F = fn3(p), rs = F.roots, [lo, hi] = W3[p.kind];
    const edges = [rs.length ? Math.min(lo, rs[0] - 1) : lo, ...rs, rs.length ? Math.max(hi, rs[rs.length - 1] + 1) : hi];
    const ints = [];
    for (let i = 0; i + 1 < edges.length; i++) { const mid = (edges[i] + edges[i + 1]) / 2; ints.push({ a: i === 0 ? -Infinity : edges[i], b: i + 2 === edges.length ? Infinity : edges[i + 1], sg: Math.sign(F.f(mid)), mid }); }
    const eq = rs.map((y, i) => {
      const l = ints[i].sg, r = ints[i + 1].sg;
      return { y, type: l > 0 && r < 0 ? 'stable' : l < 0 && r > 0 ? 'unstable' : 'semi', d: F.d(y) };
    });
    return { F, eq, ints };
  }
  function limit3(p, A) {
    const y0 = p.y0, sg = Math.sign(A.F.f(y0));
    if (A.eq.some((e) => Math.abs(e.y - y0) < 1e-9)) return { v: y0, kind: 'stay' };
    if (sg > 0) { const e = A.eq.find((q) => q.y > y0); return e ? { v: e.y, kind: 'eq' } : { v: Infinity, kind: 'up' }; }
    const cand = A.eq.filter((q) => q.y < y0), e = cand[cand.length - 1];
    return e ? { v: e.y, kind: 'eq' } : { v: -Infinity, kind: 'down' };
  }
  function traj3(F, y0, T, h, cap) {
    const ys = [y0]; let y = y0;
    for (let t = 0; t < T - 1e-9; t += h) {
      const k1 = F.f(y), k2 = F.f(y + h / 2 * k1), k3 = F.f(y + h / 2 * k2), k4 = F.f(y + h * k3);
      y += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      if (!Number.isFinite(y) || Math.abs(y) > cap) break;
      ys.push(y);
    }
    return { h, ys, full: ys.length > Math.floor(T / h) - 1 };
  }
  const trajEval = (tr) => (t) => { if (!(t >= 0)) return NaN; const x = t / tr.h, i = Math.floor(x); if (i >= tr.ys.length - 1) return i === tr.ys.length - 1 && x - i < 1e-9 ? tr.ys[i] : NaN; return tr.ys[i] + (tr.ys[i + 1] - tr.ys[i]) * (x - i); };
  function check3(p) {
    const A = analyse3(p);
    A.eq.forEach((e) => {
      const h = 1e-6, nd = (A.F.f(e.y + h) - A.F.f(e.y - h)) / (2 * h);
      if (Math.abs(nd - e.d) > 1e-5 * (1 + Math.abs(e.d))) fail(`autonomous: f' wrong at ${e.y}: ${e.d} vs ${nd}`);
      if (Math.abs(A.F.f(e.y)) > 1e-9) fail(`autonomous: ${e.y} is not an equilibrium`);
      if (Math.abs(e.d) > 1e-9 && ((e.d < 0) !== (e.type === 'stable') || (e.d > 0) !== (e.type === 'unstable'))) fail(`autonomous: sign test and f' test disagree at ${e.y}`);
      if (Math.abs(e.d) <= 1e-9 && e.type !== 'semi') fail('autonomous: f′ = 0 but not semi-stable');
    });
    const L = limit3(p, A), tr = traj3(A.F, p.y0, 250, 0.01, 1e3), end = tr.ys[tr.ys.length - 1];
    if (L.kind === 'up' || L.kind === 'down') { if (!(tr.full === false || Math.abs(end) > 50)) fail('autonomous: solution should diverge'); }
    else if (Math.abs(end - L.v) > 0.03) fail(`autonomous: RK4 limit ${end} vs ${L.v}`);
    return p;
  }
  let sel3 = null, sl3 = [];
  function updVis3(kind) { sl3.forEach((r, i) => { try { r.input.parentElement.style.display = i === kind ? '' : 'none'; } catch (e) { /* no DOM */ } }); }
  function createProblem3(rng) {
    const kind = forced3 ? forced3.kind : rng.nextInt(0, 4);
    const pars = [rng.pick([-2, -1, 1, 2, 3]), rng.pick([-1, 0.5, 2, 3]), rng.pick([0, 1, 4, -1]), rng.pick([0.09, 0.16, 0.21, 0.24, 0.25, 0.3])];
    const y0 = rng.pick([-2, -1, -0.5, 0.5, 1.5, 2.5, 3]), ask = rng.pick(['count', 'stable']);
    const p = norm3({ kind, par: forced3 && forced3.par != null ? forced3.par : pars[kind], y0: forced3 && forced3.y0 != null ? forced3.y0 : y0, ask: forced3 && forced3.ask ? forced3.ask : ask });
    // random initial values are never equilibria
    if (analyse3(p).eq.some((e) => Math.abs(e.y - p.y0) < 1e-9)) p.y0 = norm3({ kind, par: p.par, y0: p.y0 + 0.5 }).y0;
    if (sel3) sel3.refreshFromModel();
    updVis3(p.kind);
    return check3(p);
  }
  function eqTxt3(p) {
    const q = p.par;
    if (p.kind === 0) return q === 0 ? 'y′ = −y²' : `y′ = y(${N2(q)} − y)`;
    if (p.kind === 1) return `y′ = y(y − 1)(${N2(q)} − y)`;
    if (p.kind === 2) return q === 0 ? 'y′ = y²' : q > 0 ? `y′ = y² − ${N2(q)}` : `y′ = y² + ${N2(-q)}`;
    return q === 0 ? 'y′ = y(1 − y)' : `y′ = y(1 − y) − ${N2(q)}`;
  }
  const typeName = (t) => (t === 'stable' ? tx('KARARLI', 'STABLE') : t === 'unstable' ? tx('KARARSIZ', 'UNSTABLE') : tx('YARI KARARLI', 'SEMI-STABLE'));
  function statement3(p) {
    return tx(`${eqTxt3(p)}, y(0) = ${N2(p.y0)} otonom denklemini düşünelim. Denge çözümlerini bulalım, kararlılıklarını belirleyelim, faz çizgisini çizelim ve t → ∞ iken y(t)'nin davranışını söyleyelim.`,
      `Consider the autonomous equation ${eqTxt3(p)}, y(0) = ${N2(p.y0)}. Let's find the equilibrium solutions, decide their stability, draw the phase line and describe the behaviour of y(t) as t → ∞.`);
  }
  function steps3(p) {
    const A = analyse3(p), out = [], q = p.par, roots = A.F.roots;
    const disc = 1 - 4 * q;
    const facTr = p.kind === 0 ? (q === 0 ? 'f(y) = −y² = 0 ⇒ y = 0 (çift kök)' : `f(y) = y(${N2(q)} − y) = 0 ⇒ y = 0 ya da y = ${N2(q)}`)
      : p.kind === 1 ? `f(y) = y(y − 1)(${N2(q)} − y) = 0 ⇒ y ∈ {${roots.map(N2).join(', ')}}`
        : p.kind === 2 ? (q > 0 ? `y² − ${N2(q)} = 0 ⇒ y = ±√${N2(q)} = ${N2(-Math.sqrt(q))} ya da ${N2(Math.sqrt(q))}` : q === 0 ? 'y² = 0 ⇒ y = 0 (çift kök)' : `y² = ${N2(q)} < 0 ⇒ gerçek kök yok`)
          : (q === 0 ? 'y(1 − y) = 0 ⇒ y = 0 ya da y = 1' : `y² − y + ${N2(q)} = 0 ⇒ y = (1 ± √(1 − 4·${N2(q)}))/2; 1 − 4h = ${N2(disc)}${disc > 1e-9 ? ` ⇒ y = ${roots.map(N3).join(' ya da ')}` : Math.abs(disc) <= 1e-9 ? ' = 0 ⇒ tek (çift) kök y = 0,5' : ' < 0 ⇒ gerçek kök yok'}`);
    const facEn = facTr.replace(/ ya da /g, ' or ').replace('çift kök', 'double root').replace('gerçek kök yok', 'no real root').replace('tek (çift) kök y = 0,5', 'one (double) root y = 0.5');
    out.push(tx(`── 1) Denge çözümleri (f(y) = 0) ──\n${facTr}.\nDenge sayısı: ${A.eq.length}.`, `── 1) Equilibrium solutions (f(y) = 0) ──\n${facEn}.\nNumber of equilibria: ${A.eq.length}.`));
    const rows = A.ints.map((it) => {
      const rg = (it.a === -Infinity ? '(−∞' : `(${N2(it.a)}`) + ', ' + (it.b === Infinity ? '∞)' : `${N2(it.b)})`), fv = A.F.f(it.mid);
      return { tr: `${rg}: f(${N2(it.mid)}) = ${N2(fv)} ${it.sg > 0 ? '> 0 ⇒ y ARTAR (↑)' : '< 0 ⇒ y AZALIR (↓)'}`, en: `${rg}: f(${N2(it.mid)}) = ${N2(fv)} ${it.sg > 0 ? '> 0 ⇒ y INCREASES (↑)' : '< 0 ⇒ y DECREASES (↓)'}` };
    });
    out.push(tx(`── 2) f nin işareti ──\n${rows.map((r) => r.tr).join('\n')}`, `── 2) Sign of f ──\n${rows.map((r) => r.en).join('\n')}`));
    if (A.eq.length) {
      const cl = A.eq.map((e) => ({
        tr: `y = ${N2(e.y)}: ${typeName(e.type)}; f′(${N2(e.y)}) = ${N2(e.d)}${Math.abs(e.d) < 1e-9 ? ' = 0 (test sonuç vermez, işaret tablosuna bakılır: iki yanda aynı yön)' : e.d < 0 ? ' < 0 ✓' : ' > 0 ✓'}`,
        en: `y = ${N2(e.y)}: ${typeName(e.type)}; f′(${N2(e.y)}) = ${N2(e.d)}${Math.abs(e.d) < 1e-9 ? ' = 0 (the test is inconclusive; the sign table shows the same direction on both sides)' : e.d < 0 ? ' < 0 ✓' : ' > 0 ✓'}`,
      }));
      out.push(tx(`── 3) Kararlılık ──\nOklar dengeye doğruysa KARARLI, uzaklaşıyorsa KARARSIZ, bir yandan yaklaşıp öbür yandan uzaklaşıyorsa YARI KARARLI.\n${cl.map((r) => r.tr).join('\n')}`, `── 3) Stability ──\nArrows pointing toward the equilibrium: STABLE; away from it: UNSTABLE; toward it on one side and away on the other: SEMI-STABLE.\n${cl.map((r) => r.en).join('\n')}`));
    } else out.push(tx('── 3) Kararlılık ──\nDenge noktası yok: y her zaman aynı yönde hareket eder, hiçbir çözüm sabit değildir.', '── 3) Stability ──\nThere is no equilibrium: y always moves in the same direction and no solution is constant.'));
    out.push(tx('── 4) Faz çizgisi ──\nSağdaki dikey y çizgisinde denge noktaları işaretlenir (yeşil dolu = kararlı, kırmızı boş = kararsız, turuncu = yarı kararlı); aralıklardaki oklar f nin işaretini gösterir. Soldaki grafikte kesikli yatay çizgiler denge çözümleridir; her eğri bir başlangıç değerinden çıkan çözümdür.', '── 4) The phase line ──\nOn the vertical y-line at the right the equilibria are marked (green filled = stable, red hollow = unstable, orange = semi-stable); the arrows in the intervals show the sign of f. In the graph the dashed horizontal lines are the equilibrium solutions; every curve is the solution from one initial value.'));
    const L = limit3(p, A), up = A.F.f(p.y0) > 0;
    let lt, le;
    if (L.kind === 'stay') { lt = `y(0) = ${N2(p.y0)} bir denge noktasıdır: y(t) ≡ ${N2(p.y0)}.`; le = `y(0) = ${N2(p.y0)} is an equilibrium: y(t) ≡ ${N2(p.y0)}.`; }
    else if (L.kind === 'eq') { lt = `y(0) = ${N2(p.y0)} noktasında f ${up ? '> 0 (y artar)' : '< 0 (y azalır)'}; ok ${N2(L.v)} değerine doğru gider: t → ∞ iken y → ${N2(L.v)}.`; le = `At y(0) = ${N2(p.y0)} f ${up ? '> 0 (y increases)' : '< 0 (y decreases)'}; the arrow leads to ${N2(L.v)}: y → ${N2(L.v)} as t → ∞.`; }
    else { lt = `y(0) = ${N2(p.y0)} noktasında f ${up ? '> 0' : '< 0'} ve bu yönde başka denge yok: |y| büyür, y → ${up ? '+∞' : '−∞'} (sonlu bir t anında bile olabilir).`; le = `At y(0) = ${N2(p.y0)} f ${up ? '> 0' : '< 0'} and there is no other equilibrium in that direction: |y| grows, y → ${up ? '+∞' : '−∞'} (possibly in finite time).`; }
    out.push(tx(`── 5) Başlangıç değeri ──\n${lt}`, `── 5) The initial value ──\n${le}`));
    const tr = traj3(A.F, p.y0, 250, 0.01, 1e3), end = tr.ys[tr.ys.length - 1], div = L.kind === 'up' || L.kind === 'down';
    out.push(tx(`── 6) Sayısal kontrol ──\nRK4 (h = 0,01, t ≤ 250): ${div ? 'çözüm sınırsız büyür' : `y(250) ≈ ${N2(end)}`}; faz çizgisinin sonucuyla uyumlu ✓.`, `── 6) Numerical check ──\nRK4 (h = 0.01, t ≤ 250): ${div ? 'the solution grows without bound' : `y(250) ≈ ${N2(end)}`}; consistent with the phase line ✓.`));
    const list = (t) => A.eq.filter((e) => e.type === t).map((e) => N2(e.y)).join(', ');
    out.push(tx(`── 7) Sonuç ──\nDenge sayısı ${A.eq.length}; kararlı: ${list('stable') || 'yok'}; kararsız: ${list('unstable') || 'yok'}; yarı kararlı: ${list('semi') || 'yok'}.`,
      `── 7) Conclusion ──\nNumber of equilibria ${A.eq.length}; stable: ${list('stable') || 'none'}; unstable: ${list('unstable') || 'none'}; semi-stable: ${list('semi') || 'none'}.`));
    return out;
  }
  const TCOL = (c, t) => (t === 'stable' ? c.green() : t === 'unstable' ? c.red() : c.orange());
  function draw3(canvas, p) {
    const A = analyse3(p), [ylo, yhi] = W3[p.kind], T = 6;
    canvas.setViewport(-0.4, T, ylo, yhi);
    const n = 13;
    for (let i = 0; i < n; i++) {
      const y0 = ylo + 0.15 + (yhi - ylo - 0.3) * i / (n - 1);
      if (Math.abs(y0 - p.y0) < 0.12) continue;
      canvas.addFunction({ evaluator: trajEval(traj3(A.F, y0, T, 0.01, 40)), color: canvas.gray(), thickness: 1 });
    }
    A.eq.forEach((e) => {
      canvas.addSegment({ x1: 0, y1: e.y, x2: T, y2: e.y, color: TCOL(canvas, e.type), thickness: 2, dashed: true });
      canvas.addMarker({ x: 0, y: e.y, color: TCOL(canvas, e.type), shape: 'circle', radius: 4, label: `y = ${N2(e.y)}` });
    });
    canvas.addFunction({ evaluator: trajEval(traj3(A.F, p.y0, T, 0.01, 40)), color: canvas.accent(), thickness: 3, label: 'y(t)' });
    canvas.addMarker({ x: 0, y: p.y0, color: canvas.accent(), shape: 'diamond', radius: 6, label: `y₀ = ${N2(p.y0)}` });
  }
  function schem3(sc, p) {
    const A = analyse3(p), [ylo, yhi] = W3[p.kind];
    const Y = (y) => 12 + (y - ylo) / (yhi - ylo) * 76;
    sc.title(tx('Faz çizgisi', 'Phase line'));
    sc.line(50, 10, 50, 90, { w: 0.5, color: sc.c.sub });
    sc.text(50, 92.5, 'y', { size: 3.4, color: sc.c.sub });
    A.ints.forEach((it) => {
      const a = it.a === -Infinity ? ylo : Math.max(ylo, it.a), b = it.b === Infinity ? yhi : Math.min(yhi, it.b);
      if (b - a < 0.2) return;
      const mid = Y((a + b) / 2), len = Math.min(13, 0.7 * (Y(b) - Y(a)));
      if (it.sg > 0) sc.arrow(50, mid - len / 2, 50, mid + len / 2, { color: sc.c.load, w: 1.1, head: 3.2 }); else sc.arrow(50, mid + len / 2, 50, mid - len / 2, { color: sc.c.load, w: 1.1, head: 3.2 });
    });
    A.eq.forEach((e) => {
      const col = e.type === 'stable' ? sc.c.good : e.type === 'unstable' ? sc.c.bad : sc.c.load;
      sc.circle(50, Y(e.y), 2.8, { fill: e.type === 'unstable' ? sc.c.bg : col, color: col, w: 0.9 });
      sc.text(44, Y(e.y), `y = ${N2(e.y)}`, { align: 'right', size: 3.3 });
      sc.text(57, Y(e.y), e.type === 'stable' ? tx('kararlı', 'stable') : e.type === 'unstable' ? tx('kararsız', 'unstable') : tx('yarı kararlı', 'semi-stable'), { align: 'left', size: 3, color: col });
    });
    if (!A.eq.length) sc.text(50, 50, tx('denge yok', 'no equilibrium'), { size: 3.4, color: sc.c.sub, base: 'bottom' });
    sc.circle(63, Y(p.y0), 1.5, { fill: sc.c.accent, color: sc.c.accent });
    sc.text(70, Y(p.y0), 'y₀', { align: 'left', size: 3.2, color: sc.c.accent });
    sc.text(50, 4.5, tx('↑ f > 0 artar   ↓ f < 0 azalır', '↑ f > 0 rises   ↓ f < 0 falls'), { size: 3, color: sc.c.sub });
  }
  function concept3() {
    return tx(`TANIM
Bağımsız değişken t'yi açıkça içermeyen y′ = f(y) denklemine OTONOM denklem denir. Eğim yalnızca y'nin değerine bağlıdır; bu yüzden çözmeden de çözümlerin uzun dönem davranışı faz çizgisinden okunabilir.

YÖNTEM (FAZ ÇİZGİSİ)
1. f(y) = 0 denklemini çözeriz: kökler DENGE çözümleridir (y = sabit).
2. Denge noktalarının ayırdığı aralıklarda f nin işaretine bakarız: f > 0 ⇒ y artar (↑), f < 0 ⇒ y azalır (↓).
3. Her denge noktasını okların yönüne göre sınıflandırırız.
4. Bir başlangıç değerinden oku izleriz: en yakın denge noktasına yaklaşır ya da ±∞'a gider.
5. İstersek f′(y*) işaretiyle kontrol ederiz.

DENGE TÜRLERİ
• KARARLI denge: iki yandaki oklar dengeye doğrudur; f′(y*) < 0 ve yakın çözümler dengeye yaklaşır.
• KARARSIZ denge: oklar dengeden uzaklaşır; f′(y*) > 0 ve yakın çözümler dengeden kaçar.
• YARI KARARLI denge: f işaret değiştirmez (çift kök); bir yandan yaklaşılır, öbür yandan uzaklaşılır; f′(y*) = 0.

ÖRNEK DENKLEMLER
• y(a − y): lojistik tür; a > 0 için y = 0 kararsız, y = a kararlıdır; a = 0 olunca iki denge birleşip yarı kararlı olur.
• y(y − 1)(c − y): üç denge (0, 1, c); işaret tablosu ardışık kararlı ve kararsız denge verir.
• y² − a: a > 0 için iki denge (−√a kararlı, √a kararsız), a = 0 için yarı kararlı tek denge, a < 0 için denge yoktur.
• y(1 − y) − h: hasatlı lojistik; h < 1/4 için iki denge, h = 1/4 için yarı kararlı bir denge, h > 1/4 için denge yoktur (nüfus çöker).

TUZAKLAR
• Denge noktaları f nin KÖKLERİdir, f′ nün değil.
• f′(y*) = 0 ise türev testi sonuç vermez; işaret tablosuna bakılır.
• Çözüm eğrileri hiçbir zaman bir denge çizgisini kesmez; yalnızca yaklaşabilir.
• Otonom denklemde çözümler monoton olur (artar ya da azalır); salınım olmaz.

MİNİ ÖRNEK
y′ = y(2 − y): denge y = 0 ve y = 2. f(1) = 1 > 0 ⇒ (0, 2) aralığında y artar; f(3) = −3 < 0 ⇒ y > 2 için y azalır. Sonuç: y = 0 kararsız, y = 2 kararlı; 0 < y₀ < 2 için y → 2. ✓`,
    `DEFINITION
An equation y′ = f(y) that does not contain the independent variable t explicitly is called AUTONOMOUS. The slope depends only on the value of y, so the long-term behaviour of solutions can be read from the phase line without solving.

METHOD (PHASE LINE)
1. We solve f(y) = 0: the roots are the EQUILIBRIUM solutions (y = constant).
2. In the intervals cut out by the equilibria we look at the sign of f: f > 0 ⇒ y increases (↑), f < 0 ⇒ y decreases (↓).
3. We classify each equilibrium by the direction of the arrows around it.
4. From an initial value we follow the arrow: it approaches the nearest equilibrium or runs off to ±∞.
5. We may check with the sign of f′(y*).

TYPES OF EQUILIBRIUM
• STABLE equilibrium: the arrows on both sides point toward it; f′(y*) < 0 and nearby solutions approach it.
• UNSTABLE equilibrium: the arrows point away; f′(y*) > 0 and nearby solutions leave it.
• SEMI-STABLE equilibrium: f does not change sign (double root); solutions approach from one side and leave on the other; f′(y*) = 0.

EXAMPLE EQUATIONS
• y(a − y): logistic type; for a > 0, y = 0 is unstable and y = a is stable; at a = 0 the two equilibria merge into a semi-stable one.
• y(y − 1)(c − y): three equilibria (0, 1, c); the sign table gives alternating stable and unstable equilibria.
• y² − a: for a > 0 two equilibria (−√a stable, √a unstable), for a = 0 one semi-stable equilibrium, for a < 0 none.
• y(1 − y) − h: logistic with harvesting; two equilibria for h < 1/4, one semi-stable equilibrium at h = 1/4, none for h > 1/4 (the population collapses).

PITFALLS
• Equilibria are the ROOTS of f, not of f′.
• If f′(y*) = 0 the derivative test is inconclusive; use the sign table.
• Solution curves never cross an equilibrium line; they can only approach it.
• In an autonomous equation solutions are monotone (increasing or decreasing); there are no oscillations.

MINI EXAMPLE
y′ = y(2 − y): equilibria y = 0 and y = 2. f(1) = 1 > 0 ⇒ y increases on (0, 2); f(3) = −3 < 0 ⇒ y decreases for y > 2. So y = 0 is unstable, y = 2 is stable; for 0 < y₀ < 2, y → 2. ✓`);
  }
  function controls3(rightCol, getProblem, h) {
    caption(rightCol, tx('Denklem', 'Equation'));
    sel3 = h.addSelect({ options: [{ label: 'y′ = y(a − y)', value: 0 }, { label: 'y′ = y(y − 1)(c − y)', value: 1 }, { label: 'y′ = y² − a', value: 2 }, { label: tx('y′ = y(1 − y) − h (hasat)', 'y′ = y(1 − y) − h (harvesting)'), value: 3 }],
      get: () => getProblem().kind, set: (v) => { const p = getProblem(); p.kind = Number(v); norm3(p); sl3.forEach(syncReg); updVis3(p.kind); } });
    const cap = [tx('Parametre a', 'Parameter a'), tx('Parametre c', 'Parameter c'), tx('Parametre a', 'Parameter a'), tx('Hasat h', 'Harvest h')];
    sl3 = [0, 1, 2, 3].map((k) => h.addSlider({ caption: cap[k], min: PR3[k][0], max: PR3[k][1], step: k === 3 ? 0.01 : 0.5,
      get: () => { const p = getProblem(); return p.kind === k ? p.par : (PR3[k][0] + PR3[k][1]) / 2; }, set: (v) => { const p = getProblem(); if (p.kind === k) p.par = v; } }));
    h.addSlider({ caption: tx('Başlangıç değeri y₀', 'Initial value y₀'), min: -2.5, max: 3.5, step: 0.25, get: () => getProblem().y0, set: (v) => { getProblem().y0 = v; } });
    updVis3(getProblem().kind);
  }
  const make3 = (kind, par, y0) => (rng) => { forced3 = { kind, par, y0 }; try { return createProblem3(rng); } finally { forced3 = null; } };
  const askEff3 = (p) => { const A = analyse3(p); return p.ask === 'stable' && A.eq.filter((e) => e.type === 'stable').length === 1 ? 'stable' : 'count'; };
  Topics.register('calc2', {
    id: 'autonomous',
    tabTitle: () => tx('Otonom Denklemler ve Faz Çizgisi', 'Autonomous Equations and the Phase Line'),
    concept: concept3,
    problemStatement: statement3,
    createProblem: createProblem3,
    solveSteps: steps3,
    draw: draw3,
    drawSchematic: schem3,
    buildControls: controls3,
    links: [
      { match: /^• (y\(a − y\):)/, make: make3(0, 2, 0.5) },
      { match: /^• (y\(y − 1\)\(c − y\):)/, make: make3(1, 2, 0.5) },
      { match: /^• (y² − a:)/, make: make3(2, 1, 0.5) },
      { match: /^• (y\(1 − y\) − h:)/, make: make3(3, 0.16, 0.5) },
      { match: /^• (KARARLI denge:|STABLE equilibrium:)/, make: make3(0, 2, 1.5) },
      { match: /^• (KARARSIZ denge:|UNSTABLE equilibrium:)/, make: make3(1, 2, 0.5) },
      { match: /^• (YARI KARARLI denge:|SEMI-STABLE equilibrium:)/, make: make3(3, 0.25, 1) },
    ],
    challenge: {
      prompt: (p) => (askEff3(p) === 'stable' ? tx(`${eqTxt3(p)} denkleminin tek KARARLI denge çözümü y = ? Faz çizgisini çizip değeri 2 ondalık basamakla yazalım.`, `The equation ${eqTxt3(p)} has exactly one STABLE equilibrium y = ? Let's draw the phase line and type the value to 2 decimals.`)
        : tx(`${eqTxt3(p)} denkleminin kaç denge çözümü vardır? f(y) = 0 köklerini sayıp tamsayı olarak yazalım.`, `How many equilibrium solutions does ${eqTxt3(p)} have? Let's count the roots of f(y) = 0 and type the integer.`)),
      target: (p) => { const A = analyse3(p); return askEff3(p) === 'stable' ? A.eq.find((e) => e.type === 'stable').y : A.eq.length; },
      tol: (p) => (askEff3(p) === 'stable' ? 0.02 : 0.01),
      hint: (p) => (askEff3(p) === 'stable' ? tx('Kararlı denge: iki yandaki oklar ona doğru gider, f′ < 0.', 'A stable equilibrium: the arrows on both sides point toward it, f′ < 0.') : tx('f(y) = 0 denklemini çarpanlarına ayıralım ve farklı gerçek kökleri sayalım (çift kök bir denge sayılır).', 'Factor f(y) = 0 and count the distinct real roots (a double root counts as one equilibrium).')),
    },
    _test: { analyse: analyse3, limit: limit3, check: check3, traj: traj3 },
    _scenarioCount: () => 4,
    _setScenario: (i) => { forced3 = { kind: i }; },
  });

  // =====================================================================================================================
  // QUIZ GENERATORS (Calc2Quiz.main = one per topic, Calc2Quiz.extra = exam-only pool)
  // =====================================================================================================================
  const T1 = () => tx('Birinci Mertebe Lineer Denklemler', 'First-Order Linear Equations');
  const T2 = () => tx('Diferansiyel Denklem Uygulamaları', 'Differential Equation Applications');
  const T3 = () => tx('Otonom Denklemler ve Faz Çizgisi', 'Autonomous Equations and the Phase Line');

  // ---- linear1
  const genL1Main = lv((rng) => {
    const kind = rng.pick([4, 5]), p = { kind, a: 1, s: 1, m: rng.pick([1, 2]), y0: rng.nextInt(2, 8), xe: 2 };
    if (p.y0 === p.m) p.y0 += 1;
    const m = mdl1(p), y = m.y(2), yp2 = m.yp(2), C = m.C, h2 = m.hom(2);
    return Assessment.num(T1(), tx(`${m.eq}, x > 0, y(1) = ${p.y0}. y(2) = ?`, `${m.eq}, x > 0, y(1) = ${p.y0}. y(2) = ?`), y, [
      `μ = ${m.mu}, (μy)′ = ${m.muQ} ⇒ μy = ${m.integ} + C ⇒ y = ${m.ypTxt} + C·${m.homTxt}.`,
      `y(1) = ${p.y0} ⇒ C = ${p.y0} − ${m.yp(1)} = ${C}.`,
      `y(2) = ${N2(yp2)} + ${C}·${N2(h2)} = ${N2(y)}.`], rng,
    { level: 2, wrongs: [yp2, yp2 + C, yp2 - C * h2, y * 2, yp2 + p.y0 * h2], notes: [
      tx('Sabiti unuttuk: yalnız yₚ(2) alındı.', 'The constant was forgotten: only yₚ(2) was used.'), tx('C, 1/μ ile çarpılmadı (C·hom yerine C eklendi).', 'C was not multiplied by 1/μ (C was added instead of C·hom).'),
      tx('C teriminin işareti ters alındı.', 'The sign of the C term was reversed.'), tx('Sonuç iki katına çıkarıldı (μ yanlış alındı).', 'The result was doubled (wrong μ).'), tx('C yerine y(1) alındı.', 'y(1) was used instead of C.')] });
  }, 2);
  const genL1Mu = lv((rng) => {
    const k = rng.pick([2, 3, 4]), x = rng.pick([2, 3]);
    return Assessment.num(T1(), tx(`y′ + (${k}/x)y = x² denklemi için x > 0'da integrasyon çarpanı μ(x) = e^(∫P dx) olsun. μ(${x}) = ?`, `For y′ + (${k}/x)y = x² with x > 0 let μ(x) = e^(∫P dx) be the integrating factor. μ(${x}) = ?`), Math.pow(x, k), [
      `P = ${k}/x ⇒ ∫P dx = ${k} ln x ⇒ μ = e^(${k} ln x) = x^${k}.`, `μ(${x}) = ${x}^${k} = ${Math.pow(x, k)}.`], rng,
    { level: 1, wrongs: [k * x, x + k, Math.pow(k, x), Math.pow(x, k + 1), Math.pow(x, k - 1), Math.pow(x, k) + x, Math.pow(x, k) - 1, 2 * Math.pow(x, k)], notes: [tx('Üs yerine çarpım alındı.', 'A product was used instead of a power.'), tx('Toplam alındı.', 'A sum was used.'), tx('Taban ve üs yer değiştirdi.', 'Base and exponent were swapped.'), tx('∫(k/x)dx = k ln x yerine fazladan bir üs alındı.', 'An extra power was taken in ∫(k/x)dx.')] });
  }, 1);
  const genL1C = lv((rng) => {
    const a = rng.pick([2, 3, 4]), s = rng.nextInt(1, 5);
    let y0 = rng.nextInt(-3, 8);
    if (y0 === s) y0 += 1;
    return Assessment.num(T1(), tx(`y′ + ${a}y = ${a * s}, y(0) = ${N2(y0)}. Genel çözüm y = ${s} + Ce^(−${a}x) ise C = ?`, `y′ + ${a}y = ${a * s}, y(0) = ${N2(y0)}. If the general solution is y = ${s} + Ce^(−${a}x), then C = ?`), y0 - s, [
      `y(0) = ${s} + C·e⁰ = ${s} + C = ${y0}.`, `C = ${y0} − ${s} = ${y0 - s}.`], rng,
    { level: 1, wrongs: [y0 + s, s - y0, y0, s, y0 - a * s], notes: [tx('Toplam alındı.', 'The values were added.'), tx('Fark ters çevrildi.', 'The difference was reversed.'), tx('Kalıcı kısım çıkarılmadı (C = y₀).', 'The steady part was not subtracted (C = y₀).')] });
  }, 1);
  const genL1Y = lv((rng) => {
    const a = rng.pick([1, 2]), y0 = rng.pick([-2, 0, 1, 2, 3, 4]), p = { kind: 1, a, s: 1, m: 1, y0, xe: 1 }, m = mdl1(p), y = m.y(1);
    return Assessment.num(T1(), tx(`y′ + ${cf(a)}y = x, y(0) = ${N2(y0)}. y(1) = ? (2 ondalık basamak)`, `y′ + ${cf(a)}y = x, y(0) = ${N2(y0)}. y(1) = ? (2 decimals)`), y, [
      `μ = e^(${cf(a)}x); ∫x·e^(${cf(a)}x)dx = (x/${a} − 1/${a * a})e^(${cf(a)}x) (${tx('kısmi integrasyon', 'by parts')}).`,
      `y = x/${a} − 1/${a * a} + Ce^(−${cf(a)}x); y(0) = ${N2(y0)} ⇒ C = ${N2(m.C)}.`, `y(1) = ${N2(m.yp(1))} + ${N2(m.C)}·e^(−${a}) = ${N2(y)}.`], rng,
    { level: 3, wrongs: [1 / a + y0 * Math.exp(-a), m.yp(1) + y0 * Math.exp(-a), m.yp(1), m.yp(1) + m.C * Math.exp(a), y0 * Math.exp(-a)], notes: [tx('Kısmi integrasyonda −1/a² terimi unutuldu.', 'The −1/a² term of the integration by parts was forgotten.'), tx('C = y₀ alındı (yₚ(0) çıkarılmadı).', 'C = y₀ was used (yₚ(0) not subtracted).'), tx('Geçici kısım atıldı.', 'The transient part was dropped.'), tx('Üstel terimin işareti ters.', 'The sign of the exponent is wrong.')] });
  }, 3);
  const genL1Amp = lv((rng) => {
    const a = rng.pick([1, 2, 3]), A = 1 / Math.sqrt(a * a + 1);
    return Assessment.num(T1(), tx(`y′ + ${cf(a)}y = sin x denkleminin kalıcı (kararlı hâl) çözümü y = (${cf(a)}sin x − cos x)/${a * a + 1} biçimindedir. Bu salınımın genliği kaçtır? (2 ondalık basamak)`, `The steady-state solution of y′ + ${cf(a)}y = sin x is y = (${cf(a)}sin x − cos x)/${a * a + 1}. What is the amplitude of this oscillation? (2 decimals)`), A, [
      `${cf(a)}sin x − cos x = √(${a * a} + 1)·sin(x − φ).`, `${tx('Genlik', 'Amplitude')} = √${a * a + 1}/${a * a + 1} = 1/√${a * a + 1} = ${N2(A)}.`], rng,
    { level: 3, wrongs: [1 / (a * a + 1), 1 / a, Math.sqrt(a * a + 1), a / (a * a + 1), 1], notes: [tx('Karekök unutuldu.', 'The square root was forgotten.'), tx('Yalnız P = a dikkate alındı.', 'Only P = a was considered.'), tx('Pay ve payda karıştı.', 'Numerator and denominator were mixed up.')] });
  }, 3);
  Calc2Quiz.main.push(genL1Main);
  Calc2Quiz.extra.push(genL1Mu, genL1C, genL1Y, genL1Amp);

  // ---- deApps
  const genApp = (mode, ask) => (rng) => {
    const p = fill2({}, mode, ask, rng), m = model2(p), t = p.uT * m.tau, ans = ask === 'val' ? m.Q(t) : m.tInv(p.V), n = p.uT;
    check2(p);
    let wr;
    if (ask === 'val') {
      wr = mode === 0 ? [p.y0 * (p.r < 1 ? Math.max(0, 1 - n * (1 - p.r)) : 1 + n * (p.r - 1)), p.y0 * Math.pow(p.r, n + 1), p.y0 * Math.pow(p.r, -n), p.y0 * n * p.r, p.y0 * Math.pow(p.r, n) / 2, p.y0 * Math.exp(-n), p.y0 / (2 * n), p.y0 / 2]
        : mode === 1 ? [p.D * Math.pow(p.rho, n), p.Tm + p.D * (1 - Math.pow(p.rho, n)), (p.Tm + p.D) * Math.pow(p.rho, n), p.Tm + p.D * Math.pow(p.rho, n + 1), p.Tm + p.D * Math.pow(p.rho, n) * 2]
          : mode === 2 ? [m.y0 * Math.exp(-n), m.lim + (m.y0 - m.lim) * (1 - Math.exp(-n)), m.lim * (1 - Math.exp(-n)), m.lim, m.y0 + (m.lim - m.y0) * Math.exp(-n)]
            : mode === 3 ? [m.lim * Math.exp(-n), m.lim * (1 - Math.exp(-2 * n)), m.lim * n / (n + 1), m.lim, m.lim * (1 - Math.exp(-n / 2))]
              : [m.y0 * Math.exp(p.r * t), p.K * (1 - Math.exp(-n)), p.K / (1 + p.A * Math.exp(n)), p.K - m.y0 * Math.exp(-n), p.K / (1 + Math.exp(-n))];
    } else wr = [ans + m.tau, ans - m.tau, ans * 2, ans / 2, ans + m.tau / 2, ans * 3 / 2];
    wr = wr.filter((v) => Number.isFinite(v) && (mode === 1 || v >= 0));
    const txt = ask === 'val' ? tx(`${m.story} t = ${N2(t)} ${m.tunit} sonra ${m.qname} kaç ${m.unit} olur?`, `${m.story} What is the ${m.qname} (${m.unit}) after t = ${N2(t)} ${m.tunit}?`)
      : tx(`${m.story} ${m.qname} kaç ${m.tunit} sonra ${N2(p.V)} ${m.unit} olur?`, `${m.story} After how many ${m.tunit} is the ${m.qname} equal to ${N2(p.V)} ${m.unit}?`);
    return Assessment.num(T2(), txt, ans, [m.model, m.solve, m.law + '.', tx(`Yanıt: ${N2(ans)} ${ask === 'val' ? m.unit : m.tunit}.`, `Answer: ${N2(ans)} ${ask === 'val' ? m.unit : m.tunit}.`)], rng,
      { level: ask === 'val' ? 2 : 3, unit: ask === 'val' ? m.unit : m.tunit, wrongs: wr });
  };
  const genAppMain = lv((rng) => genApp(rng.nextInt(0, 5), 'val')(rng), 2);
  const genAppTime = lv((rng) => genApp(rng.nextInt(0, 5), 'time')(rng), 3);
  const genAppEq = lv((rng) => {
    const vr = rng.pick([[100, 10], [100, 5], [200, 10], [500, 20]]), cin = rng.pick([0.1, 0.2, 0.25, 0.5]), eq = vr[0] * cin;
    return Assessment.num(T2(), tx(`${vr[0]} L'lik sabit hacimli bir tanka dakikada ${vr[1]} L, litresinde ${cin} g tuz içeren tuzlu su giriyor; iyi karışan çözelti aynı hızla boşalıyor. Uzun süre sonra tanktaki tuz miktarı kaç g'a yaklaşır?`, `${vr[1]} L/min of brine with ${cin} g of salt per litre enters a well-stirred ${vr[0]} L tank of constant volume; the mixture leaves at the same rate. Toward how many g does the amount of salt in the tank tend after a long time?`), eq, [
      tx('Denge: S′ = 0 ⇒ giren = çıkan.', 'Equilibrium: S′ = 0 ⇒ in = out.'), `${vr[1]}·${cin} = (${vr[1]}/${vr[0]})·S ⇒ S∞ = ${vr[0]}·${cin} = ${N2(eq)} g.`], rng,
    { level: 1, unit: 'g', wrongs: [vr[1] * cin, vr[0] / cin, eq * 2, vr[0] * cin / vr[1], vr[0] + cin] });
  }, 1);
  const genAppLam = lv((rng) => {
    const T = rng.pick([2, 3, 4, 5]), lam = Math.log(2) / T;
    return Assessment.num(T2(), tx(`Bir maddenin yarı ömrü ${T} gündür ve y′ = −λy modeline uyar. λ kaç 1/gündür? (2 ondalık basamak)`, `A substance has a half-life of ${T} days and follows y′ = −λy. What is λ in 1/day? (2 decimals)`), lam, [
      `y = y₀e^(−λt); y(${T}) = y₀/2 ⇒ e^(−λ·${T}) = 1/2.`, `λ = ln 2/${T} = ${N2(lam)} ${tx('1/gün', '1/day')}.`], rng,
    { level: 2, unit: tx('1/gün', '1/day'), wrongs: [T / Math.log(2), 1 / T, 2 / T, Math.log(2) * T, 0.5 / T] });
  }, 2);
  const genAppRC = lv((rng) => {
    const R = rng.pick([2, 5, 10]), C = rng.pick([10, 20, 50]), E = rng.pick([5, 10, 12]), qi = C * E, q = qi * (1 - 1 / Math.E);
    return Assessment.num(T2(), tx(`Başlangıçta boş ${C} µF'lık bir kondansatör, ${R} kΩ'luk bir direnç üzerinden ${E} V'luk kaynağa bağlanıyor. t = RC anında yük kaç µC'dur? (q = CE(1 − e^(−t/RC)))`, `An empty ${C} µF capacitor is connected through a ${R} kΩ resistor to a ${E} V source. What is the charge in µC at t = RC? (q = CE(1 − e^(−t/RC)))`), q, [
      `CE = ${C}·${E} = ${qi} µC.`, `t = RC ⇒ e^(−1) ⇒ q = ${qi}(1 − 1/e) = ${N2(q)} µC.`], rng,
    { level: 2, unit: 'µC', wrongs: [qi / Math.E, qi, qi * (1 - Math.exp(-2)), qi / 2, qi * (1 - 1 / Math.E) * 2] });
  }, 2);
  const genAppCool = lv((rng) => {
    const k = rng.pick([0.05, 0.1, 0.2, 0.25]), t = Math.log(2) / k;
    return Assessment.num(T2(), tx(`Newton'un soğuma yasasında T′ = −${k}(T − Tₘ) (t dakika). Cisim ile ortam arasındaki sıcaklık farkının YARIYA inmesi kaç dakika sürer? (2 ondalık basamak)`, `In Newton's law of cooling T′ = −${k}(T − Tₘ) (t in minutes). How many minutes does it take for the temperature difference between object and surroundings to fall to HALF? (2 decimals)`), t, [
      tx('T − Tₘ = (T₀ − Tₘ)e^(−kt); fark yarıya iner: e^(−kt) = 1/2.', 'T − Tₘ = (T₀ − Tₘ)e^(−kt); the difference halves: e^(−kt) = 1/2.'), `t = ln 2/k = ln 2/${k} = ${N2(t)} ${tx('dk', 'min')}.`], rng,
    { level: 2, unit: tx('dk', 'min'), wrongs: [1 / k, 1 / (2 * k), 2 / k, Math.log(2) * k, Math.log(2) / (2 * k)] });
  }, 2);
  const genAppLog = lv((rng) => {
    const r = rng.pick([1, 2, 3, 4]), K = rng.pick([2, 4, 8, 10]), v = r * K / 4;
    return Assessment.num(T2(), tx(`Lojistik modelde P′ = ${r}·P(1 − P/${K}). Büyüme hızı P′ nün alabileceği en büyük değer kaçtır? (ipucu: P = K/2'de en büyüktür)`, `In the logistic model P′ = ${r}·P(1 − P/${K}). What is the largest value the growth rate P′ can take? (hint: it is largest at P = K/2)`), v, [
      tx('P′ = rP(1 − P/K), P nin bir parabolüdür; tepe noktası P = K/2.', 'P′ = rP(1 − P/K) is a parabola in P; its vertex is at P = K/2.'), `P′(K/2) = ${r}·(${K}/2)·(1/2) = rK/4 = ${N2(v)}.`], rng,
    { level: 3, wrongs: [r * K / 2, r * K, K / 2, r / 4, r * K / 8, K / 4] });
  }, 3);
  Calc2Quiz.main.push(genAppMain);
  Calc2Quiz.extra.push(genAppTime, genAppEq, genAppLam, genAppRC, genAppCool, genAppLog);

  // ---- autonomous
  const genAuMain = lv((rng) => {
    const pp = rng.pick([-2, -1, 0, 1]), q = pp + rng.pick([1, 2, 3]);
    const fa = pp < 0 ? `(y + ${-pp})` : pp === 0 ? 'y' : `(y − ${pp})`, fb = `(${N2(q)} − y)`;
    return Assessment.num(T3(), tx(`y′ = ${fa}${fb} denkleminin KARARLI denge çözümü y = ?`, `The STABLE equilibrium solution of y′ = ${fa}${fb} is y = ?`), q, [
      tx(`Denge: f(y) = ${fa}${fb} = 0 ⇒ y = ${N2(pp)} ve y = ${N2(q)}.`, `Equilibria: f(y) = ${fa}${fb} = 0 ⇒ y = ${N2(pp)} and y = ${N2(q)}.`),
      `y < ${N2(pp)}: f < 0 ↓;  (${N2(pp)}, ${N2(q)}): f > 0 ↑;  y > ${N2(q)}: f < 0 ↓.`, tx(`Oklar y = ${N2(q)} değerine doğru: kararlı; y = ${N2(pp)} kararsız.`, `The arrows point toward y = ${N2(q)}: stable; y = ${N2(pp)} is unstable.`)], rng,
    { level: 2, wrongs: [pp, -q, pp + q, q - pp, q + 1, -pp, q - 1, 2 * q, pp - 1], notes: [tx('Kararsız dengeyi seçtik.', 'The unstable equilibrium was chosen.'), tx('İşaret hatası.', 'Sign error.')] });
  }, 2);
  const genAuCount = lv((rng) => {
    const c = rng.pick([-4, -1, 0, 1, 4, 9]), n = c > 0 ? 2 : c === 0 ? 1 : 0;
    return Assessment.num(T3(), tx(`y′ = y² ${c < 0 ? '+' : '−'} ${Math.abs(c)} denkleminin kaç denge çözümü vardır?`, `How many equilibrium solutions does y′ = y² ${c < 0 ? '+' : '−'} ${Math.abs(c)} have?`), n, [
      `y² = ${c}.`, c > 0 ? `y = ±${N2(Math.sqrt(c))}: ${tx('2 denge.', '2 equilibria.')}` : c === 0 ? tx('y = 0 (çift kök): 1 denge.', 'y = 0 (double root): 1 equilibrium.') : tx('Gerçek kök yok: 0 denge.', 'No real root: 0 equilibria.')], rng,
    { level: 1, wrongs: [0, 1, 2, 3, 4] });
  }, 1);
  const genAuCrit = lv((rng) => {
    const r = rng.pick([1, 2, 3, 4]), K = rng.pick([2, 4, 8, 10]), v = r * K / 4;
    return Assessment.num(T3(), tx(`y′ = ${r}y(1 − y/${K}) − H denklemi hasatlı lojistik modeldir. H hangi kritik değeri aşarsa denge çözümü kalmaz?`, `y′ = ${r}y(1 − y/${K}) − H is a logistic model with harvesting. Above which critical value of H do no equilibria remain?`), v, [
      tx(`Denge: ${r}y − ${N2(r / K)}y² − H = 0; diskriminant = ${r * r} − 4·${N2(r / K)}·H.`, `Equilibria: ${r}y − ${N2(r / K)}y² − H = 0; discriminant = ${r * r} − 4·${N2(r / K)}·H.`), tx(`Diskriminant = 0 ⇒ H = ${r * r}/(4·${N2(r / K)}) = rK/4 = ${N2(v)}.`, `Discriminant = 0 ⇒ H = ${r * r}/(4·${N2(r / K)}) = rK/4 = ${N2(v)}.`)], rng,
    { level: 3, wrongs: [r * K / 2, r * K, K / 2, r / 4, r * K / 8, K / 4] });
  }, 3);
  const genAuLim = lv((rng) => {
    const pp = rng.pick([1, 2]), q = pp + rng.pick([1, 2]), y0 = rng.pick([-1, pp / 2, (pp + q) / 2, q + 1]), lim = y0 < pp ? 0 : q;
    return Assessment.num(T3(), tx(`y′ = y(y − ${pp})(${q} − y), y(0) = ${N2(y0)}. lim(t→∞) y(t) = ?`, `y′ = y(y − ${pp})(${q} − y), y(0) = ${N2(y0)}. lim(t→∞) y(t) = ?`), lim, [
      tx(`Denge: 0, ${pp}, ${q}. İşaret: y < 0: f > 0 ↑; (0, ${pp}): f < 0 ↓; (${pp}, ${q}): f > 0 ↑; y > ${q}: f < 0 ↓.`, `Equilibria: 0, ${pp}, ${q}. Signs: y < 0: f > 0 ↑; (0, ${pp}): f < 0 ↓; (${pp}, ${q}): f > 0 ↑; y > ${q}: f < 0 ↓.`),
      tx(`Kararlı: 0 ve ${q}; kararsız: ${pp}.`, `Stable: 0 and ${q}; unstable: ${pp}.`), `y(0) = ${N2(y0)} ${y0 < pp ? `< ${pp}` : `> ${pp}`} ⇒ y → ${N2(lim)}.`], rng,
    { level: 2, wrongs: [pp, q, 0, pp + q, -1, q + 1] });
  }, 2);
  const genAuDeriv = lv((rng) => {
    const a = rng.pick([1, 2, 3, 4]);
    return Assessment.num(T3(), tx(`y′ = y(${a} − y) denkleminin y = ${a} dengesinde f′(y) kaçtır? (işareti kararlılığı belirler)`, `For y′ = y(${a} − y), what is f′(y) at the equilibrium y = ${a}? (its sign decides stability)`), -a, [
      `f(y) = ${a}y − y² ⇒ f′(y) = ${a} − 2y.`, tx(`f′(${a}) = ${a} − ${2 * a} = ${-a} < 0 ⇒ y = ${a} kararlı.`, `f′(${a}) = ${a} − ${2 * a} = ${-a} < 0 ⇒ y = ${a} is stable.`)], rng,
    { level: 2, wrongs: [a, -2 * a, 2 * a, 0, a / 2, -a / 2] });
  }, 2);
  Calc2Quiz.main.push(genAuMain);
  Calc2Quiz.extra.push(genAuCount, genAuCrit, genAuLim, genAuDeriv);
})();
