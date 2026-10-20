// Calculus II, differential equations A: slope fields + Euler's method, separable equations.
// slopeField: problem = { kd, x0, y0, h, n } (kd indexes SF); separable: problem = { kd, x0, y0, x1, k } (kd indexes SEP).
// Every closed form is compared with an RK4 integration of the ODE inside createProblem (a wrong formula throws instead of shipping).
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const N = (v) => {
    if (!Number.isFinite(v)) return '?';
    const t = (+v.toFixed(4)).toString();
    return t === '-0' ? '0' : t;
  };
  const P = (v) => (v < 0 ? `(${N(v)})` : N(v));
  const sub = (k) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  // x − x0 as text, and e^(± (x − x0))
  const dxs = (x0) => (x0 === 0 ? 'x' : x0 > 0 ? `x − ${N(x0)}` : `x + ${N(-x0)}`);
  const ePos = (x0) => `e^(${dxs(x0)})`;
  const eNeg = (x0) => (x0 === 0 ? 'e^(−x)' : `e^(−(${dxs(x0)}))`);
  // "2·e^(x) − x − 1" from [[coef, symbol], ...] (symbol '' = constant term)
  function poly(terms) {
    let s = '';
    for (const [c, sym] of terms) {
      if (Math.abs(c) < 1e-12) continue;
      const a = Math.abs(c);
      const body = sym === '' ? N(a) : (Math.abs(a - 1) < 1e-12 ? '' : N(a) + '·') + sym;
      s += s ? (c < 0 ? ' − ' : ' + ') + body : (c < 0 ? '−' : '') + body;
    }
    return s || '0';
  }
  function rk4(F, x0, y0, x1, steps) {
    const m = steps || 4000, h = (x1 - x0) / m;
    let x = x0, y = y0;
    for (let i = 0; i < m; i++) {
      const k1 = F(x, y), k2 = F(x + h / 2, y + h * k1 / 2), k3 = F(x + h / 2, y + h * k2 / 2), k4 = F(x + h, y + h * k3);
      y += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; x += h;
    }
    return y;
  }
  const close = (a, b, tol) => Math.abs(a - b) <= tol * (1 + Math.abs(b));
  // short direction-field segments (screen-length constant) on a grid
  function fieldSegs(canvas, F, win, nx, ny) {
    const xr = win[1] - win[0], yr = win[3] - win[2], c = 0.055;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const x = win[0] + xr * i / (nx - 1), y = win[2] + yr * j / (ny - 1);
        let m = NaN; try { m = F(x, y); } catch (e) { m = NaN; }
        if (!Number.isFinite(m)) continue;
        const half = c / Math.sqrt(1 / (xr * xr) + m * m / (yr * yr)) / 2;
        canvas.addSegment({ x1: x - half, y1: y - m * half, x2: x + half, y2: y + m * half, color: canvas.gray(), thickness: 1 });
      }
    }
  }
  function syncReg(reg) {
    if (!reg || !reg.input) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    const ratio = (v - reg.min) / (reg.max - reg.min);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }

  // =====================================================================================================
  //  1) SLOPE FIELDS AND EULER'S METHOD
  // =====================================================================================================
  // Each kind: eq (text of F), F, starts [x0,y0], L (largest n·h), ys (window), sol(x0,y0) -> { f, str } exact solution through the start, how = [tr, en]
  const SF = [
    { eq: 'x + y', F: (x, y) => x + y, starts: [[0, 1], [0, 0], [-1, 0], [0, -1], [1, 1]], L: 2.5, ys: [-6, 16],
      sol: (x0, y0) => { const c = y0 + x0 + 1; return { f: (x) => c * Math.exp(x - x0) - x - 1, str: poly([[c, ePos(x0)], [-1, 'x'], [-1, '']]), c }; },
      how: ['Doğrusal denklem y′ − y = x: integral çarpanı e⁻ˣ ⇒ (y·e⁻ˣ)′ = x·e⁻ˣ ⇒ y = −x − 1 + C·eˣ; C başlangıç koşulundan bulunur.', 'Linear equation y′ − y = x: integrating factor e⁻ˣ ⇒ (y·e⁻ˣ)′ = x·e⁻ˣ ⇒ y = −x − 1 + C·eˣ; C comes from the initial condition.'] },
    { eq: 'x − y', F: (x, y) => x - y, starts: [[0, 1], [0, 3], [1, -1], [0, -2], [0, 0]], L: 4, ys: [-4, 6],
      sol: (x0, y0) => { const c = y0 - x0 + 1; return { f: (x) => x - 1 + c * Math.exp(-(x - x0)), str: poly([[1, 'x'], [-1, ''], [c, eNeg(x0)]]), c }; },
      how: ['Doğrusal denklem y′ + y = x: integral çarpanı eˣ ⇒ (y·eˣ)′ = x·eˣ ⇒ y = x − 1 + C·e⁻ˣ.', 'Linear equation y′ + y = x: integrating factor eˣ ⇒ (y·eˣ)′ = x·eˣ ⇒ y = x − 1 + C·e⁻ˣ.'] },
    { eq: 'y − x²', F: (x, y) => y - x * x, starts: [[0, 2], [0, 1], [0, 3], [0, 0.5]], L: 3, ys: [-10, 20],
      sol: (x0, y0) => { const c = y0 - x0 * x0 - 2 * x0 - 2; return { f: (x) => x * x + 2 * x + 2 + c * Math.exp(x - x0), str: poly([[1, 'x²'], [2, 'x'], [2, ''], [c, ePos(x0)]]), c }; },
      how: ['Doğrusal denklem y′ − y = −x²: integral çarpanı e⁻ˣ ve iki kez kısmi integrasyon ⇒ y = x² + 2x + 2 + C·eˣ.', 'Linear equation y′ − y = −x²: integrating factor e⁻ˣ and integration by parts twice ⇒ y = x² + 2x + 2 + C·eˣ.'] },
    { eq: 'x² − y', F: (x, y) => x * x - y, starts: [[0, 1], [0, 0], [1, 0], [0, 3]], L: 4, ys: [-4, 10],
      sol: (x0, y0) => { const c = y0 - (x0 * x0 - 2 * x0 + 2); return { f: (x) => x * x - 2 * x + 2 + c * Math.exp(-(x - x0)), str: poly([[1, 'x²'], [-2, 'x'], [2, ''], [c, eNeg(x0)]]), c }; },
      how: ['Doğrusal denklem y′ + y = x²: integral çarpanı eˣ ve iki kez kısmi integrasyon ⇒ y = x² − 2x + 2 + C·e⁻ˣ.', 'Linear equation y′ + y = x²: integrating factor eˣ and integration by parts twice ⇒ y = x² − 2x + 2 + C·e⁻ˣ.'] },
    { eq: 'x·y', F: (x, y) => x * y, starts: [[0, 1], [0, 0.5], [0, -1], [0, 2]], L: 2.5, ys: [-8, 12],
      sol: (x0, y0) => { const c = y0 * Math.exp(-x0 * x0 / 2); return { f: (x) => y0 * Math.exp((x * x - x0 * x0) / 2), str: poly([[c, 'e^(x²/2)']]), c }; },
      how: ['Değişkenlerine ayrılabilir: dy/y = x dx ⇒ ln|y| = x²/2 + C ⇒ y = A·e^(x²/2).', 'Separable: dy/y = x dx ⇒ ln|y| = x²/2 + C ⇒ y = A·e^(x²/2).'] },
    { eq: 'y(1 − y)', F: (x, y) => y * (1 - y), starts: [[0, 0.5], [0, 0.25], [0, 0.75], [0, 1.5], [0, 2]], L: 5, ys: [-0.5, 2.5],
      sol: (x0, y0) => {
        const A = (1 - y0) / y0;
        const den = (x) => 1 + A * Math.exp(-(x - x0));
        return { f: (x) => (den(x) * den(x0) > 1e-9 ? 1 / den(x) : NaN), str: `1/(1 ${A < 0 ? '−' : '+'} ${N(Math.abs(A))}·${eNeg(x0)})`, c: A };
      },
      how: ['Lojistik denklem, değişkenlerine ayrılabilir: dy/(y(1 − y)) = dx, kısmi kesirler ⇒ ln|y/(1 − y)| = x + C ⇒ y = 1/(1 + A·e⁻ˣ).', 'Logistic equation, separable: dy/(y(1 − y)) = dx, partial fractions ⇒ ln|y/(1 − y)| = x + C ⇒ y = 1/(1 + A·e⁻ˣ).'] },
  ];
  const SF_H = [0.5, 0.25, 0.2, 0.1];
  const sfConst = (K) => (K.eq === 'y(1 − y)' || K.eq === 'x·y' ? 'A' : 'C');

  function sfNorm(p) {
    p.kd = Math.max(0, Math.min(SF.length - 1, Math.round(p.kd)));
    const K = SF[p.kd];
    p.h = Math.max(0.05, Math.min(1, Math.round(p.h * 100) / 100));
    p.n = Math.max(1, Math.min(20, Math.round(p.n)));
    p.n = Math.max(1, Math.min(p.n, Math.floor(K.L / p.h + 1e-9)));
    return p;
  }
  function euler(F, x0, y0, h, n) {
    const xs = [x0], ys = [y0], fs = [];
    for (let k = 0; k < n; k++) {
      const f = F(xs[k], ys[k]);
      fs.push(f); ys.push(ys[k] + h * f); xs.push(x0 + (k + 1) * h);
    }
    return { xs, ys, fs };
  }
  const eulerEnd = (K, p, m) => euler(K.F, p.x0, p.y0, p.h * p.n / m, m).ys[m];
  const wxy = (K, p) => [p.x0 - 1.5, p.x0 + K.L + 0.5, K.ys[0], K.ys[1]];

  let sfForced = null, sfKindSel = null, sfSh = null, sfSn = null;
  function sfCreate(rng) {
    const kd = sfForced && sfForced.kd !== undefined ? sfForced.kd : rng.nextInt(0, SF.length);
    const K = SF[kd];
    const st = rng.pick(K.starts);
    const p = { kd, x0: st[0], y0: st[1], h: rng.pick(SF_H), n: rng.pick([2, 3, 4, 5, 6]) };
    if (sfForced && sfForced.set) Object.assign(p, sfForced.set);
    sfNorm(p);
    const ex = K.sol(p.x0, p.y0).f, xe = p.x0 + p.n * p.h;
    for (const x of [p.x0 + 0.3, xe]) {
      const e = ex(x), r = rk4(K.F, p.x0, p.y0, x);
      if (!close(e, r, 1e-6)) throw new Error('slopeField: closed form ' + e + ' vs RK4 ' + r + ' (' + K.eq + ')');
    }
    if (sfKindSel) { try { sfKindSel.refreshFromModel(); } catch (e) { /* ignore */ } }
    return p;
  }

  function sfStatement(p) {
    sfNorm(p);
    const K = SF[p.kd], xe = p.x0 + p.n * p.h;
    return tx(`y′ = ${K.eq} diferansiyel denklemi ve y(${N(p.x0)}) = ${N(p.y0)} başlangıç koşulu verilsin. Önce denklemin eğim alanında çözüm eğrisinin nasıl akacağını okuyalım; sonra h = ${N(p.h)} adım uzunluğuyla n = ${p.n} adım Euler yöntemi uygulayıp y(${N(xe)}) için bir yaklaşık değer bulalım. Bu değeri tam çözümle karşılaştırıp hatayı yorumlayalım: h küçülürse hata nasıl değişir?`,
      `Let y′ = ${K.eq} with the initial condition y(${N(p.x0)}) = ${N(p.y0)}. First let's read how the solution curve flows through the slope field; then apply Euler's method with step h = ${N(p.h)} and n = ${p.n} steps to approximate y(${N(xe)}). We compare this value with the exact solution and interpret the error: what happens to it when h gets smaller?`);
  }

  function sfSteps(p) {
    sfNorm(p);
    const K = SF[p.kd], { x0, y0, h, n } = p;
    const xe = x0 + n * h;
    const E = euler(K.F, x0, y0, h, n);
    const S = K.sol(x0, y0), exact = S.f(xe), yn = E.ys[n];
    const s = [];
    s.push(tx(`── 1) Soruyu kuralım ──\ny′ = F(x, y) = ${K.eq}, y(${N(x0)}) = ${N(y0)}, h = ${N(h)}, n = ${n}. Hedef: y(${N(xe)}) = y(x${sub(n)}).`,
      `── 1) Set up the problem ──\ny′ = F(x, y) = ${K.eq}, y(${N(x0)}) = ${N(y0)}, h = ${N(h)}, n = ${n}. Goal: y(${N(xe)}) = y(x${sub(n)}).`));
    const m0 = K.F(x0, y0);
    const eqLine = K.eq === 'y(1 − y)' ? ['\nDenge çizgileri: F = 0 ⇒ y = 0 ve y = 1 (eğim her yerde yatay); 0 < y < 1 için eğim pozitif, y > 1 için negatiftir.', '\nEquilibrium lines: F = 0 ⇒ y = 0 and y = 1 (horizontal slope everywhere); the slope is positive for 0 < y < 1 and negative for y > 1.'] : ['', ''];
    s.push(tx(`── 2) Eğim alanını okuyalım ──\nHer (x, y) noktasında eğri, eğimi F(x, y) olan doğru parçasına teğet olur. Başlangıç noktasında F(${N(x0)}, ${N(y0)}) = ${N(m0)}: eğri burada ${m0 > 1e-9 ? 'yükselerek' : m0 < -1e-9 ? 'alçalarak' : 'yatay olarak'} geçer.${eqLine[0]}`,
      `── 2) Reading the slope field ──\nAt every point (x, y) the curve is tangent to the segment of slope F(x, y). At the starting point F(${N(x0)}, ${N(y0)}) = ${N(m0)}: the curve passes ${m0 > 1e-9 ? 'rising' : m0 < -1e-9 ? 'falling' : 'horizontally'} there.${eqLine[1]}`));
    s.push(tx(`── 3) Euler formülü ──\nTeğet doğrusu boyunca küçük bir adım: xₖ = x₀ + k·h,  yₖ₊₁ = yₖ + h·F(xₖ, yₖ).`,
      `── 3) Euler's formula ──\nA small step along the tangent line: xₖ = x₀ + k·h,  yₖ₊₁ = yₖ + h·F(xₖ, yₖ).`));
    const rows = [], row = (k) => `${k}) x${sub(k)} = ${N(E.xs[k])},  y${sub(k)} = ${N(E.ys[k])},  F = ${N(E.fs[k])}  ⇒  y${sub(k + 1)} = ${N(E.ys[k])} + ${N(h)}·${P(E.fs[k])} = ${N(E.ys[k + 1])}`;
    for (let k = 0; k < n; k++) { if (n > 8 && k === 6) { rows.push('…'); k = n - 2; continue; } rows.push(row(k)); }
    s.push(tx(`── 4) Adım adım tablo ──\n${rows.join('\n')}`, `── 4) Step-by-step table ──\n${rows.join('\n')}`));
    s.push(tx(`── 5) Euler sonucu ──\ny(${N(xe)}) ≈ y${sub(n)} = ${N(yn)}.`, `── 5) Euler result ──\ny(${N(xe)}) ≈ y${sub(n)} = ${N(yn)}.`));
    s.push(tx(`── 6) Tam çözüm ──\n${K.how[0]}\ny(${N(x0)}) = ${N(y0)} koşuluyla ${sfConst(K)} sabiti bulunur ve y = ${S.str}. Buradan y(${N(xe)}) = ${N(exact)}.`,
      `── 6) Exact solution ──\n${K.how[1]}\nWith y(${N(x0)}) = ${N(y0)} the constant ${sfConst(K)} is found and y = ${S.str}. Hence y(${N(xe)}) = ${N(exact)}.`));
    const err = yn - exact;
    s.push(tx(`── 7) Hata ──\nEuler − tam = ${N(yn)} − ${P(exact)} = ${N(err)}. Mutlak hata ${N(Math.abs(err))}${Math.abs(err) < 1e-9 ? '.' : err < 0 ? '; Euler değeri tam değerden KÜÇÜK (eksik tahmin).' : '; Euler değeri tam değerden BÜYÜK (fazla tahmin).'}`,
      `── 7) Error ──\nEuler − exact = ${N(yn)} − ${P(exact)} = ${N(err)}. Absolute error ${N(Math.abs(err))}${Math.abs(err) < 1e-9 ? '.' : err < 0 ? '; the Euler value is SMALLER than the exact value (under-estimate).' : '; the Euler value is LARGER than the exact value (over-estimate).'}`));
    const lt = [], le = [];
    let prev = null;
    for (let j = 0; j <= 3; j++) {
      const m = n * (1 << j), v = eulerEnd(K, p, m), e = Math.abs(v - exact);
      const r = prev !== null && e > 1e-12 ? ` (${N(prev / e)})` : '';
      lt.push(`h = ${N(h / (1 << j))} (${m} adım): y ≈ ${N(v)}, hata = ${N(e)}${r}`);
      le.push(`h = ${N(h / (1 << j))} (${m} steps): y ≈ ${N(v)}, error = ${N(e)}${r}`);
      prev = e;
    }
    s.push(tx(`── 8) h küçülünce ──\n${lt.join('\n')}\nParantez içi: önceki hata / bu hata. Euler yöntemi birinci mertebedendir: h yarıya inince hata yaklaşık yarıya iner (oran ≈ 2).`,
      `── 8) Shrinking h ──\n${le.join('\n')}\nIn brackets: previous error / this error. Euler's method is first order: halving h roughly halves the error (ratio ≈ 2).`));
    const chk = rk4(K.F, x0, y0, xe);
    s.push(tx(`── 9) Sayısal kontrol ──\nRK4 ile y(${N(xe)}) ≈ ${N(chk)}; tam çözüm ${N(exact)} ✓.`, `── 9) Numeric check ──\nRK4 gives y(${N(xe)}) ≈ ${N(chk)}; exact ${N(exact)} ✓.`));
    return s;
  }

  function sfDraw(canvas, p) {
    sfNorm(p);
    const K = SF[p.kd], w = wxy(K, p);
    canvas.setViewport(w[0], w[1], w[2], w[3]);
    fieldSegs(canvas, K.F, w, 19, 17);
    const S = K.sol(p.x0, p.y0);
    canvas.addFunction({ evaluator: safe(S.f), color: canvas.accent(), thickness: 2.5, label: tx('tam çözüm', 'exact solution') });
    const E = euler(K.F, p.x0, p.y0, p.h, p.n);
    for (let k = 0; k < p.n; k++) canvas.addSegment({ x1: E.xs[k], y1: E.ys[k], x2: E.xs[k + 1], y2: E.ys[k + 1], color: canvas.orange(), thickness: 2.5 });
    for (let k = 1; k <= p.n; k++) canvas.addMarker({ x: E.xs[k], y: E.ys[k], color: canvas.orange(), radius: 3.5 });
    canvas.addMarker({ x: p.x0, y: p.y0, color: canvas.green(), radius: 6, label: `(${N(p.x0)}, ${N(p.y0)})` });
    const xe = E.xs[p.n], ye = S.f(xe);
    if (Number.isFinite(ye)) canvas.addMarker({ x: xe, y: ye, color: canvas.gold(), shape: 'diamond', radius: 6, label: `y = ${N(ye)}` });
    canvas.addMarker({ x: xe, y: E.ys[p.n], color: canvas.red(), radius: 5, label: `y${sub(p.n)} = ${N(E.ys[p.n])}` });
  }

  function sfConcept() {
    return tx(`EĞİM ALANI (YÖN ALANI)
y′ = F(x, y) denklemi, çözümü bilmeden bile her (x, y) noktasında çözüm eğrisinin eğimini söyler. Her noktaya eğimi F(x, y) olan kısa bir doğru parçası çizersek eğim alanını elde ederiz; çözüm eğrileri bu parçalara her yerde teğet olacak biçimde "akar".
• EĞİM ALANI: ızgara noktası seç, m = F(x, y) hesapla, o noktada eğimi m olan küçük bir parça çiz; başlangıç noktasından parçaları izleyerek çözüm eğrisini kabaca çiz.
• DENGE ÇİZGİLERİ: F(x, y*) = 0 olan y = y* doğrularında parçalar yataydır; bu doğrular çözümdür (örneğin y′ = y(1 − y) için y = 0 ve y = 1).

EULER YÖNTEMİ
Çözüme başlangıç noktasında teğet olan doğruyla küçük bir adım atar, yeni noktada eğimi yeniden okuruz.
1. y(x₀) = y₀ başlangıç değeri ve adım uzunluğu h verilir.
2. xₖ = x₀ + k·h hesaplanır.
3. Her adımda eğim F(xₖ, yₖ) hesaplanır.
4. yₖ₊₁ = yₖ + h·F(xₖ, yₖ) ile yeni değer bulunur; n adım sonunda y(x₀ + n·h) ≈ yₙ elde edilir.
• EULER YÖNTEMİ: yₖ₊₁ = yₖ + h·F(xₖ, yₖ); tablo oluştur (xₖ, yₖ, F, yₖ₊₁) ve poligonal çizgiyi eğim alanı üzerinde çiz.
• ADIM UZUNLUĞU h: hata yaklaşık h ile orantılıdır (birinci mertebe); h yarıya inerse hata yaklaşık yarıya iner. Çok küçük h daha fazla adım ve yuvarlama birikimi demektir.

DİKKAT
• Hata her adımda birikir; çözüm eğrisi yukarı bükeyse Euler değeri sistematik olarak eksik, aşağı bükeyse fazla kalır.
• F'yi yeni noktada (xₖ, yₖ) hesapla, başlangıç noktasında değil; h çarpanını unutma.
• Kararsız denge çevresinde küçük hatalar bile eğriyi başka bir çözüme kaydırır.

ÖRNEK
y′ = x + y, y(0) = 1, h = 0.5. y₁ = 1 + 0.5·(0 + 1) = 1.5; y₂ = 1.5 + 0.5·(0.5 + 1.5) = 2.5. Tam çözüm y = 2eˣ − x − 1 ⇒ y(1) = 2e − 2 ≈ 3.4366; Euler 2.5 verdi (hata ≈ 0.94, eksik tahmin, çünkü çözüm yukarı bükey).`,
      `SLOPE FIELD (DIRECTION FIELD)
The equation y′ = F(x, y) tells us the slope of the solution curve at every point (x, y), even before we solve it. Drawing at each point a short segment of slope F(x, y) gives the slope field; solution curves "flow" tangent to these segments everywhere.
• SLOPE FIELD: pick a grid point, compute m = F(x, y), draw a small segment of slope m there; follow the segments from the starting point to sketch the solution curve.
• EQUILIBRIUM LINES: on the lines y = y* where F(x, y*) = 0 the segments are horizontal; these lines are solutions (for example y = 0 and y = 1 for y′ = y(1 − y)).

EULER'S METHOD
We step a short distance along the tangent line at the current point and read the slope again at the new point.
1. The initial value y(x₀) = y₀ and the step size h are given.
2. Compute xₖ = x₀ + k·h.
3. At each step compute the slope F(xₖ, yₖ).
4. yₖ₊₁ = yₖ + h·F(xₖ, yₖ) gives the new value; after n steps y(x₀ + n·h) ≈ yₙ.
• EULER'S METHOD: yₖ₊₁ = yₖ + h·F(xₖ, yₖ); make a table (xₖ, yₖ, F, yₖ₊₁) and draw the polygonal line over the slope field.
• STEP SIZE h: the error is roughly proportional to h (first order); halving h roughly halves the error. A very small h means more steps and accumulated round-off.

PITFALLS
• The error accumulates at every step; if the solution curve is concave up the Euler value is systematically too low, if it is concave down too high.
• Evaluate F at the new point (xₖ, yₖ), not at the starting point; do not forget the factor h.
• Near an unstable equilibrium even tiny errors push the curve onto a different solution.

WORKED EXAMPLE
y′ = x + y, y(0) = 1, h = 0.5. y₁ = 1 + 0.5·(0 + 1) = 1.5; y₂ = 1.5 + 0.5·(0.5 + 1.5) = 2.5. The exact solution y = 2eˣ − x − 1 gives y(1) = 2e − 2 ≈ 3.4366; Euler gave 2.5 (error ≈ 0.94, an under-estimate because the solution is concave up).`);
  }

  function sfControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
    lab(tx('Denklem y′ = F(x, y)', 'Equation y′ = F(x, y)'));
    sfKindSel = h.addSelect({
      options: SF.map((K, i) => ({ label: `y′ = ${K.eq}`, value: i })),
      get: () => getProblem().kd,
      set: (v) => {
        const p = getProblem(); p.kd = Number(v);
        const st = SF[p.kd].starts[0]; p.x0 = st[0]; p.y0 = st[1]; sfNorm(p);
        syncReg(sfSh); syncReg(sfSn);
      },
    });
    sfSh = h.addSlider({ caption: tx('Adım uzunluğu (h)', 'Step size (h)'), min: 0.05, max: 1, step: 0.05,
      get: () => getProblem().h, set: (v) => { const p = getProblem(); p.h = v; sfNorm(p); syncReg(sfSn); } });
    sfSn = h.addSlider({ caption: tx('Adım sayısı (n)', 'Number of steps (n)'), min: 1, max: 20, step: 1,
      get: () => getProblem().n, set: (v) => { const p = getProblem(); p.n = Math.round(v); sfNorm(p); } });
  }

  const sfMake = (set, kd) => (rng) => {
    sfForced = { kd, set }; try { return sfCreate(rng); } finally { sfForced = null; }
  };
  const sfLogistic = SF.findIndex((K) => K.eq === 'y(1 − y)');
  const eulerM = (p) => (p.n >= 2 ? 2 : 1);

  Topics.register('calc2', {
    id: 'slopeField',
    tabTitle: () => tx('Eğim Alanları ve Euler Yöntemi', "Slope Fields and Euler's Method"),
    concept: sfConcept,
    problemStatement: sfStatement,
    createProblem: sfCreate,
    solveSteps: sfSteps,
    draw: sfDraw,
    focus: (p) => { sfNorm(p); const w = wxy(SF[p.kd], p); return { x: (w[0] + w[1]) / 2, y: (w[2] + w[3]) / 2 }; },
    buildControls: sfControls,
    links: [
      { match: /^• (EĞİM ALANI|SLOPE FIELD):/, make: (rng) => sfMake({ n: 4, h: 0.5 })(rng) },
      { match: /^• (DENGE ÇİZGİLERİ|EQUILIBRIUM LINES):/, make: (rng) => sfMake({ n: 5, h: 0.5 }, sfLogistic)(rng) },
      { match: /^• (EULER YÖNTEMİ|EULER'S METHOD):/, make: (rng) => sfMake({ n: 3, h: 0.5 })(rng) },
      { match: /^• (ADIM UZUNLUĞU h|STEP SIZE h):/, make: (rng) => sfMake({ n: 10, h: 0.2 })(rng) },
    ],
    challenge: {
      title: () => tx('Euler değerini önceden tahmin et', 'Predict the Euler value'),
      prompt: (p) => {
        sfNorm(p); const K = SF[p.kd], m = eulerM(p);
        return tx(`y′ = ${K.eq}, y(${N(p.x0)}) = ${N(p.y0)} ve h = ${N(p.h)} için Euler yönteminin y${sub(m)} değeri kaçtır? Tabloyu elle doldurup yazalım.`,
          `For y′ = ${K.eq}, y(${N(p.x0)}) = ${N(p.y0)} and h = ${N(p.h)}, what is the Euler value y${sub(m)}? Let's fill the table by hand and type it in.`);
      },
      target: (p) => { sfNorm(p); const m = eulerM(p); return euler(SF[p.kd].F, p.x0, p.y0, p.h, m).ys[m]; },
      tol: () => 0.01,
      hint: (p, g) => {
        sfNorm(p); const K = SF[p.kd], m = eulerM(p), E = euler(K.F, p.x0, p.y0, p.h, m), t = E.ys[m];
        const first = tx(`Önce y₁ = y₀ + h·F(x₀, y₀) = ${N(p.y0)} + ${N(p.h)}·${P(E.fs[0])}.`, `First y₁ = y₀ + h·F(x₀, y₀) = ${N(p.y0)} + ${N(p.h)}·${P(E.fs[0])}.`);
        return (m === 2 ? first + ' ' : '') + tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.');
      },
    },
    _test: { SF, euler, rk4, norm: sfNorm, create: sfCreate },
  });

  // =====================================================================================================
  //  2) SEPARABLE EQUATIONS
  // =====================================================================================================
  // presets [x0, y0, x1, (k)]; win = [xl, xh, yl, yh]; y(p, x) exact solution (NaN outside its interval of existence)
  const SEP = [
    { key: 'ky', eq: (p) => `${N(p.k)}·y`, F: (x, y, p) => p.k * y, win: [-3, 4, -8, 12],
      presets: [[0, 1, 0.5, 2], [0, 4, 2, -1], [0, 1, 0.5, 3], [0, 5, 1, -2], [0, 2, 2, 0.5], [0, 2, 1, 1.5]],
      y: (p, x) => p.y0 * Math.exp(p.k * (x - p.x0)) },
    { key: 'xy', eq: () => 'x·y', F: (x, y) => x * y, win: [-4.5, 4.5, -8, 8],
      presets: [[0, 2, 1], [0, 1, 2], [0, -1, 1.5], [0, 3, 0.5], [0, 1, -1]],
      y: (p, x) => p.y0 * Math.exp((x * x - p.x0 * p.x0) / 2) },
    { key: 'xdy', eq: () => 'x/y', F: (x, y) => x / y, win: [-5, 5, -8, 8],
      presets: [[0, 3, 4], [0, 4, 3], [0, -3, 4], [0, 5, -4], [0, -4, 3]],
      y: (p, x) => { const r = x * x + p.y0 * p.y0 - p.x0 * p.x0; return r > 1e-12 ? Math.sign(p.y0) * Math.sqrt(r) : NaN; } },
    { key: 'y2', eq: () => 'y²', F: (x, y) => y * y, win: [-3, 3, -5, 6],
      presets: [[0, 1, 0.5], [0, 2, 0.25], [0, 0.5, 1], [0, 1, -1], [0, -1, 1], [0, 4, 0.2]],
      y: (p, x) => { const d = 1 - p.y0 * (x - p.x0); return d > 1e-9 ? p.y0 / d : NaN; } },
    { key: 'tan', eq: () => '(1 + y²)·x', F: (x, y) => (1 + y * y) * x, win: [-4.5, 4.5, -6, 6],
      presets: [[0, 0, 1], [0, 1, 0.5], [0, -1, 1], [0, 0, 1.25], [0, 0.5, 1]],
      y: (p, x) => { const a = (x * x - p.x0 * p.x0) / 2 + Math.atan(p.y0); return Math.abs(a) < Math.PI / 2 - 1e-6 ? Math.tan(a) : NaN; } },
    { key: 'yx', eq: () => 'y/x', F: (x, y) => y / x, win: [-1, 5, -8, 8],
      presets: [[1, 2, 3], [1, -1, 2.5], [1, 1.5, 4], [1, -2, 1.5]],
      y: (p, x) => (x > 1e-9 ? p.y0 / p.x0 * x : NaN) },
  ];
  const sepF = (p) => (x, y) => SEP[p.kd].F(x, y, p);
  const yAt = (p, x) => SEP[p.kd].y(p, x);

  function sepNorm(p) {
    p.kd = Math.max(0, Math.min(SEP.length - 1, Math.round(p.kd)));
    const key = SEP[p.kd].key;
    p.x1 = Math.round(p.x1 * 100) / 100;
    if (key === 'xdy' || key === 'y2') { if (Math.abs(p.y0) < 1e-9) p.y0 = 0.5; }
    if (key === 'tan') p.y0 = Math.max(-3, Math.min(3, p.y0));
    if (key === 'y2') {
      const lim = p.x0 + 0.9 / p.y0;
      if (p.y0 > 0 && p.x1 > lim) p.x1 = Math.floor(lim * 100) / 100;
      if (p.y0 < 0 && p.x1 < lim) p.x1 = Math.ceil(lim * 100) / 100;
    }
    if (key === 'tan') {
      const rad = p.x0 * p.x0 + 2 * (1.3 - Math.atan(p.y0));
      if (p.x1 * p.x1 > rad) p.x1 = (p.x1 < 0 ? -1 : 1) * Math.floor(Math.sqrt(rad) * 100) / 100;
    }
    if (key === 'yx' && p.x1 < 0.25) p.x1 = 0.25;
    return p;
  }

  let sepForced = null, sepKindSel = null, sepS0 = null, sepS1 = null;
  function sepCreate(rng) {
    const kd = sepForced && sepForced.kd !== undefined ? sepForced.kd : rng.nextInt(0, SEP.length);
    const pr = rng.pick(SEP[kd].presets);
    const p = { kd, x0: pr[0], y0: pr[1], x1: pr[2], k: pr[3] === undefined ? 1 : pr[3] };
    if (sepForced && sepForced.set) Object.assign(p, sepForced.set);
    sepNorm(p);
    for (const x of [p.x1, (p.x0 + p.x1) / 2 + 0.1]) {
      const e = yAt(p, x), r = rk4(sepF(p), p.x0, p.y0, x);
      if (!close(e, r, 1e-6)) throw new Error('separable: closed form ' + e + ' vs RK4 ' + r + ' (' + SEP[kd].key + ')');
    }
    if (sepKindSel) { try { sepKindSel.refreshFromModel(); } catch (e) { /* ignore */ } }
    return p;
  }

  function sepStatement(p) {
    sepNorm(p);
    const K = SEP[p.kd];
    return tx(`y′ = ${K.eq(p)} diferansiyel denklemini ve y(${N(p.x0)}) = ${N(p.y0)} başlangıç koşulunu ele alalım. Değişkenlerine ayırarak çözelim, y'yi mümkünse x cinsinden açık biçimde yazalım ve y(${N(p.x1)}) değerini bulalım. Çözümün hangi aralıkta var olduğunu da söyleyelim.`,
      `Consider y′ = ${K.eq(p)} with the initial condition y(${N(p.x0)}) = ${N(p.y0)}. Let's solve it by separating the variables, write y explicitly in terms of x when possible and find y(${N(p.x1)}). We also say on which interval the solution exists.`);
  }

  // text pieces of the solution: { sep, integ, gen, ivp, form, val, dom } ([tr, en] pairs except form / val)
  function sepPieces(p) {
    const K = SEP[p.kd], { x0, y0, x1, k } = p, f = N, X0 = N(x0), Y0 = N(y0);
    const both = (s) => [s, s];
    switch (K.key) {
      case 'ky': {
        const A = y0 * Math.exp(-k * x0);
        const ivp = `y(${X0}) = ${Y0} ⇒ A·e^(${f(k * x0)}) = ${Y0} ⇒ A = ${f(A)}.`;
        return {
          sep: [`y ≠ 0 için dy/y = k dx, k = ${f(k)}.`, `For y ≠ 0: dy/y = k dx, k = ${f(k)}.`],
          integ: both(`∫ dy/y = ∫ k dx ⇒ ln|y| = ${f(k)}x + C₁.`),
          gen: [`|y| = e^(C₁)·e^(${f(k)}x) ⇒ y = A·e^(${f(k)}x) (A = ±e^(C₁); A = 0 sabit çözüm y ≡ 0'ı verir).`, `|y| = e^(C₁)·e^(${f(k)}x) ⇒ y = A·e^(${f(k)}x) (A = ±e^(C₁); A = 0 gives the constant solution y ≡ 0).`],
          ivp: both(ivp),
          form: `y = ${poly([[A, 'e^(' + f(k) + 'x)']])}`,
          val: `${f(A)}·e^(${f(k * x1)})`,
          dom: ['Çözüm her x için vardır (ℝ üzerinde). k > 0 ise üstel büyüme, k < 0 ise üstel sönme; y ≡ 0 denge çözümüdür.', 'The solution exists for all x (on ℝ). For k > 0 it is exponential growth, for k < 0 exponential decay; y ≡ 0 is the equilibrium solution.'],
        };
      }
      case 'xy': {
        const A = y0 * Math.exp(-x0 * x0 / 2);
        const ivp = `y(${X0}) = ${Y0} ⇒ A·e^(${f(x0 * x0 / 2)}) = ${Y0} ⇒ A = ${f(A)}.`;
        return {
          sep: ['y ≠ 0 için dy/y = x dx.', 'For y ≠ 0: dy/y = x dx.'],
          integ: both('∫ dy/y = ∫ x dx ⇒ ln|y| = x²/2 + C₁.'),
          gen: ['|y| = e^(C₁)·e^(x²/2) ⇒ y = A·e^(x²/2) (A = ±e^(C₁); A = 0 ise y ≡ 0).', '|y| = e^(C₁)·e^(x²/2) ⇒ y = A·e^(x²/2) (A = ±e^(C₁); A = 0 gives y ≡ 0).'],
          ivp: both(ivp),
          form: `y = ${poly([[A, 'e^(x²/2)']])}`,
          val: `${f(A)}·e^(${f(x1 * x1 / 2)})`,
          dom: ['Çözüm her x için vardır; y(x) işareti y₀ ile aynı kalır (üstel hiçbir zaman 0 olmaz). y ≡ 0 denge çözümüdür.', 'The solution exists for all x; y(x) keeps the sign of y₀ (an exponential is never 0). y ≡ 0 is the equilibrium solution.'],
        };
      }
      case 'xdy': {
        const C = y0 * y0 - x0 * x0;
        const ivp = `y(${X0}) = ${Y0} ⇒ C = y₀² − x₀² = ${f(y0 * y0)} − ${f(x0 * x0)} = ${f(C)}.`;
        return {
          sep: ['y ≠ 0 için y dy = x dx.', 'For y ≠ 0: y dy = x dx.'],
          integ: both('∫ y dy = ∫ x dx ⇒ y²/2 = x²/2 + C₁ ⇒ y² = x² + C (C = 2C₁).'),
          gen: ['y = ±√(x² + C); işaret, y₀ işaretiyle aynı seçilir.', 'y = ±√(x² + C); the sign is chosen equal to the sign of y₀.'],
          ivp: both(ivp),
          form: `y = ${y0 < 0 ? '−' : ''}√(x² + ${f(C)})`,
          val: `${y0 < 0 ? '−' : ''}√(${f(x1 * x1)} + ${f(C)})`,
          dom: ['Denklem y = 0 noktasında tanımsızdır. C > 0 olduğundan x² + C > 0: çözüm hep y ≠ 0 kalır, her x için vardır ve y₀ işaretini korur.', 'The equation is undefined at y = 0. Since C > 0 we have x² + C > 0: the solution stays away from y = 0, exists for all x and keeps the sign of y₀.'],
        };
      }
      case 'y2': {
        const xs = x0 + 1 / y0, right = y0 > 0;
        return {
          sep: ['y ≠ 0 için dy/y² = dx.', 'For y ≠ 0: dy/y² = dx.'],
          integ: both('∫ y⁻² dy = ∫ dx ⇒ −1/y = x + C₁ ⇒ y = −1/(x + C₁).'),
          gen: ['Genel çözüm y = −1/(x + C₁); ayrıca bölerken kaybettiğimiz y ≡ 0 sabit çözümü vardır.', 'General solution y = −1/(x + C₁); also the constant solution y ≡ 0, which we lost when dividing.'],
          ivp: [`y(${X0}) = ${Y0} ⇒ −1/${P(y0)} = ${X0} + C₁ ⇒ C₁ = ${f(-1 / y0 - x0)}; yani y = y₀/(1 − y₀(x − x₀)) = ${f(y0)}/(1 − ${P(y0)}·(${dxs(x0)})).`, `y(${X0}) = ${Y0} ⇒ −1/${P(y0)} = ${X0} + C₁ ⇒ C₁ = ${f(-1 / y0 - x0)}; so y = y₀/(1 − y₀(x − x₀)) = ${f(y0)}/(1 − ${P(y0)}·(${dxs(x0)})).`],
          form: `y = ${f(y0)}/(1 − ${P(y0)}·(${dxs(x0)}))`,
          val: `${f(y0)}/(1 − ${P(y0)}·${P(x1 - x0)})`,
          dom: [`Payda x* = x₀ + 1/y₀ = ${f(xs)} noktasında sıfır olur: çözüm ${right ? 'x → x*⁻' : 'x → x*⁺'} iken sonsuza gider (sonlu x'te patlama). Çözüm yalnızca ${right ? `x < ${f(xs)}` : `x > ${f(xs)}`} aralığında vardır; sağ taraf düzgün olsa da çözüm tüm ℝ üzerinde yaşamaz.`,
            `The denominator vanishes at x* = x₀ + 1/y₀ = ${f(xs)}: the solution tends to infinity ${right ? 'as x → x*⁻' : 'as x → x*⁺'} (blow-up at a finite x). The solution exists only for ${right ? `x < ${f(xs)}` : `x > ${f(xs)}`}; although the right-hand side is smooth, the solution does not live on all of ℝ.`],
        };
      }
      case 'tan': {
        const C = Math.atan(y0) - x0 * x0 / 2, xs = Math.sqrt(Math.max(0, Math.PI - 2 * C));
        const ivp = `y(${X0}) = ${Y0} ⇒ C = arctan(${Y0}) − ${f(x0 * x0 / 2)} = ${f(C)}.`;
        return {
          sep: ['dy/(1 + y²) = x dx (1 + y² > 0 olduğundan bölmek güvenlidir).', 'dy/(1 + y²) = x dx (dividing is safe since 1 + y² > 0).'],
          integ: both('∫ dy/(1 + y²) = ∫ x dx ⇒ arctan y = x²/2 + C.'),
          gen: ['arctan y = x²/2 + C ⇒ y = tan(x²/2 + C), −π/2 < x²/2 + C < π/2 olduğu sürece.', 'arctan y = x²/2 + C ⇒ y = tan(x²/2 + C), as long as −π/2 < x²/2 + C < π/2.'],
          ivp: both(ivp),
          form: `y = tan(x²/2 ${C < 0 ? '−' : '+'} ${f(Math.abs(C))})`,
          val: `tan(${f(x1 * x1 / 2)} ${C < 0 ? '−' : '+'} ${f(Math.abs(C))})`,
          dom: [`tan yalnızca (−π/2, π/2) aralığında bir çözüm verir: x²/2 + C = π/2 olduğunda, yani |x| = √(π − 2C) = ${f(xs)} noktasında çözüm patlar. Denklemin sağ tarafı her yerde düzgün olsa da çözüm yalnızca |x| < ${f(xs)} için vardır.`,
            `tan gives a solution only inside (−π/2, π/2): at x²/2 + C = π/2, i.e. |x| = √(π − 2C) = ${f(xs)}, the solution blows up. Although the right-hand side is smooth everywhere, the solution exists only for |x| < ${f(xs)}.`],
        };
      }
      default: { // yx
        const A = y0 / x0;
        const ivp = `y(${X0}) = ${Y0} ⇒ A·${X0} = ${Y0} ⇒ A = ${f(A)}.`;
        return {
          sep: ['x > 0, y ≠ 0 için dy/y = dx/x.', 'For x > 0, y ≠ 0: dy/y = dx/x.'],
          integ: both('∫ dy/y = ∫ dx/x ⇒ ln|y| = ln x + C₁ ⇒ |y| = e^(C₁)·x.'),
          gen: ['y = A·x (A = ±e^(C₁); A = 0 ise y ≡ 0): orijinden geçen doğrular.', 'y = A·x (A = ±e^(C₁); A = 0 gives y ≡ 0): straight lines through the origin.'],
          ivp: both(ivp),
          form: `y = ${poly([[A, 'x']])}`,
          val: `${f(A)}·${f(x1)}`,
          dom: ["Denklem x = 0 doğrusunda tanımsızdır; başlangıç noktası x > 0 tarafında olduğundan çözüm yalnızca x > 0 için geçerlidir (x = 0'ı aşmaz).", 'The equation is undefined on the line x = 0; since the starting point has x > 0 the solution is valid only for x > 0 (it cannot cross x = 0).'],
        };
      }
    }
  }

  function sepSteps(p) {
    sepNorm(p);
    const K = SEP[p.kd], pc = sepPieces(p), yv = yAt(p, p.x1), chk = rk4(sepF(p), p.x0, p.y0, p.x1);
    const s = [];
    s.push(tx(`── 1) Soruyu kuralım ──\ny′ = dy/dx = g(x)·h(y) = ${K.eq(p)}, y(${N(p.x0)}) = ${N(p.y0)}. Hedef: y(${N(p.x1)}).`,
      `── 1) Set up the problem ──\ny′ = dy/dx = g(x)·h(y) = ${K.eq(p)}, y(${N(p.x0)}) = ${N(p.y0)}. Goal: y(${N(p.x1)}).`));
    s.push(tx(`── 2) Değişkenleri ayıralım ──\n${pc.sep[0]}`, `── 2) Separate the variables ──\n${pc.sep[1]}`));
    s.push(tx(`── 3) İki tarafı integralleyelim ──\n${pc.integ[0]}`, `── 3) Integrate both sides ──\n${pc.integ[1]}`));
    s.push(tx(`── 4) y'yi çözelim ──\n${pc.gen[0]}`, `── 4) Solve for y ──\n${pc.gen[1]}`));
    s.push(tx(`── 5) Başlangıç koşulu ──\n${pc.ivp[0]}\nÖzel çözüm: ${pc.form}.`, `── 5) Initial condition ──\n${pc.ivp[1]}\nParticular solution: ${pc.form}.`));
    s.push(tx(`── 6) İstenen değer ──\ny(${N(p.x1)}) = ${pc.val} = ${N(yv)}.`, `── 6) The requested value ──\ny(${N(p.x1)}) = ${pc.val} = ${N(yv)}.`));
    s.push(tx(`── 7) Tanım aralığı ──\n${pc.dom[0]}`, `── 7) Domain ──\n${pc.dom[1]}`));
    s.push(tx(`── 8) Sayısal kontrol ──\nRK4 ile y(${N(p.x1)}) ≈ ${N(chk)}; kapalı çözüm ${N(yv)} ✓.`, `── 8) Numeric check ──\nRK4 gives y(${N(p.x1)}) ≈ ${N(chk)}; closed form ${N(yv)} ✓.`));
    return s;
  }

  function sepDraw(canvas, p) {
    sepNorm(p);
    const K = SEP[p.kd], w = K.win, F = sepF(p);
    canvas.setViewport(w[0], w[1], w[2], w[3]);
    fieldSegs(canvas, F, w, 19, 17);
    canvas.addFunction({ evaluator: safe((x) => yAt(p, x)), color: canvas.accent(), thickness: 3, label: 'y(x)' });
    const yv = yAt(p, p.x1);
    canvas.addGuideLine({ axis: 'vertical', position: p.x1, color: canvas.gold(), label: `x = ${N(p.x1)}` });
    if (K.key === 'y2') { const xs = p.x0 + 1 / p.y0; if (xs > w[0] && xs < w[1]) canvas.addGuideLine({ axis: 'vertical', position: xs, color: canvas.red(), label: 'x*' }); }
    if (K.key === 'tan') {
      const xs = Math.sqrt(Math.max(0, Math.PI - 2 * (Math.atan(p.y0) - p.x0 * p.x0 / 2)));
      [xs, -xs].forEach((v) => { if (v > w[0] && v < w[1]) canvas.addGuideLine({ axis: 'vertical', position: v, color: canvas.red(), label: 'x*' }); });
    }
    if (K.key === 'yx') canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.red(), label: 'x = 0' });
    canvas.addMarker({ x: p.x0, y: p.y0, color: canvas.green(), radius: 6, label: `(${N(p.x0)}, ${N(p.y0)})` });
    if (Number.isFinite(yv)) canvas.addMarker({ x: p.x1, y: yv, color: canvas.gold(), shape: 'diamond', radius: 6, label: `y = ${N(yv)}` });
  }

  function sepConcept() {
    return tx(`AYRILABİLİR DENKLEM
y′ = g(x)·h(y) biçimindeki denklemde sağ taraf, yalnızca x'e bağlı bir çarpanla yalnızca y'ye bağlı bir çarpanın çarpımıdır. Böyle denklemlere değişkenlerine ayrılabilir denir; x'li terimleri bir tarafa, y'li terimleri öbür tarafa toplayıp ayrı ayrı integre ederiz.

YÖNTEM
1. h(y) ≠ 0 için denklemi dy/h(y) = g(x) dx biçiminde yaz.
2. İki tarafı integre et: ∫ dy/h(y) = ∫ g(x) dx + C (sabit yalnız bir tarafa yazılır).
3. Mümkünse y'yi x cinsinden çöz (açık çözüm); olmuyorsa kapalı çözüm bırakılır.
4. Başlangıç koşulu y(x₀) = y₀ ile C sabitini bul.
5. h(y*) = 0 olan sabit çözümleri y ≡ y* ayrıca kontrol et; bölme sırasında kaybolmuş olabilirler.

TİPİK DURUMLAR
• y′ = k·y: dy/y = k dx ⇒ y = y₀·e^(k(x − x₀)); k > 0 büyüme, k < 0 sönme.
• y′ = x·y: dy/y = x dx ⇒ y = A·e^(x²/2).
• y′ = x/y: y dy = x dx ⇒ y² = x² + C (hiperbol aileleri).
• y′ = y²: dy/y² = dx ⇒ y = −1/(x + C); çözüm sonlu x'te patlayabilir.
• y′ = (1 + y²)·x: arctan y = x²/2 + C ⇒ y = tan(x²/2 + C); tan sonlu bir aralıkta tanımlıdır.
• y′ = y/x: dy/y = dx/x ⇒ y = A·x (x > 0 dalı).

DİKKAT
• Bölme sırasında kaybolan y ≡ y* çözümlerini unutma (örneğin y′ = y² için y ≡ 0).
• Sabiti integrasyondan hemen sonra ekle; logaritmayı kaldırırken sabitin yeni biçimini (A = ±e^(C₁)) doğru yaz.
• Çözümün var olduğu aralığa bak: sağ taraf düzgün olsa bile çözüm sonlu x'te sonsuza gidebilir (y′ = y²).
• Her denklem ayrılabilir değildir: y′ = x + y çarpım biçiminde yazılamaz.

ÖRNEK
y′ = x·y, y(0) = 2. dy/y = x dx ⇒ ln|y| = x²/2 + C₁ ⇒ y = A·e^(x²/2). y(0) = 2 ⇒ A = 2, yani y = 2·e^(x²/2); y(1) = 2·e^(1/2) ≈ 3.2974.`,
      `SEPARABLE EQUATION
In y′ = g(x)·h(y) the right-hand side is a product of a factor that depends only on x and a factor that depends only on y. Such equations are called separable: we collect the x-terms on one side and the y-terms on the other and integrate each side separately.

METHOD
1. For h(y) ≠ 0 write the equation as dy/h(y) = g(x) dx.
2. Integrate both sides: ∫ dy/h(y) = ∫ g(x) dx + C (the constant is written on one side only).
3. Solve for y in terms of x if possible (explicit solution); otherwise leave the implicit solution.
4. Use the initial condition y(x₀) = y₀ to find C.
5. Check the constant solutions y ≡ y* with h(y*) = 0 separately; they may have been lost when dividing.

TYPICAL CASES
• y′ = k·y: dy/y = k dx ⇒ y = y₀·e^(k(x − x₀)); k > 0 growth, k < 0 decay.
• y′ = x·y: dy/y = x dx ⇒ y = A·e^(x²/2).
• y′ = x/y: y dy = x dx ⇒ y² = x² + C (families of hyperbolas).
• y′ = y²: dy/y² = dx ⇒ y = −1/(x + C); the solution can blow up at a finite x.
• y′ = (1 + y²)·x: arctan y = x²/2 + C ⇒ y = tan(x²/2 + C); tan lives on a finite interval.
• y′ = y/x: dy/y = dx/x ⇒ y = A·x (the x > 0 branch).

PITFALLS
• Do not forget the solutions y ≡ y* lost in the division (for y′ = y², y ≡ 0).
• Add the constant right after integrating; when removing the logarithm write the new form of the constant correctly (A = ±e^(C₁)).
• Look at the interval of existence: even with a smooth right-hand side the solution can go to infinity at a finite x (y′ = y²).
• Not every equation is separable: y′ = x + y cannot be written as a product.

WORKED EXAMPLE
y′ = x·y, y(0) = 2. dy/y = x dx ⇒ ln|y| = x²/2 + C₁ ⇒ y = A·e^(x²/2). y(0) = 2 ⇒ A = 2, so y = 2·e^(x²/2); y(1) = 2·e^(1/2) ≈ 3.2974.`);
  }

  function sepControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); };
    lab(tx('Denklem türü', 'Equation type'));
    sepKindSel = h.addSelect({
      options: SEP.map((K, i) => ({ label: `y′ = ${K.key === 'ky' ? 'k·y' : K.eq({})}`, value: i })),
      get: () => getProblem().kd,
      set: (v) => {
        const p = getProblem(); p.kd = Number(v);
        const pr = SEP[p.kd].presets[0]; p.x0 = pr[0]; p.y0 = pr[1]; p.x1 = pr[2]; p.k = pr[3] === undefined ? 1 : pr[3];
        sepNorm(p); syncReg(sepS0); syncReg(sepS1);
      },
    });
    sepS0 = h.addSlider({ caption: tx('Başlangıç değeri (y₀)', 'Initial value (y₀)'), min: -5, max: 5, step: 0.5,
      get: () => getProblem().y0, set: (v) => { const p = getProblem(); p.y0 = v; sepNorm(p); syncReg(sepS0); syncReg(sepS1); } });
    sepS1 = h.addSlider({ caption: tx('Hesaplanacak nokta (x₁)', 'Evaluation point (x₁)'), min: -4, max: 4, step: 0.25,
      get: () => getProblem().x1, set: (v) => { const p = getProblem(); p.x1 = v; sepNorm(p); syncReg(sepS1); } });
  }

  const sepMake = (kd) => (rng) => {
    sepForced = { kd }; try { return sepCreate(rng); } finally { sepForced = null; }
  };
  const sepIdx = (key) => SEP.findIndex((K) => K.key === key);

  Topics.register('calc2', {
    id: 'separable',
    tabTitle: () => tx('Değişkenlerine Ayrılabilir Denklemler', 'Separable Equations'),
    concept: sepConcept,
    problemStatement: sepStatement,
    createProblem: sepCreate,
    solveSteps: sepSteps,
    draw: sepDraw,
    focus: (p) => { const w = SEP[Math.max(0, Math.min(SEP.length - 1, Math.round(p.kd)))].win; return { x: (w[0] + w[1]) / 2, y: (w[2] + w[3]) / 2 }; },
    buildControls: sepControls,
    links: [
      { match: /^• y′ = k·y:/, make: sepMake(sepIdx('ky')) },
      { match: /^• y′ = x·y:/, make: sepMake(sepIdx('xy')) },
      { match: /^• y′ = x\/y:/, make: sepMake(sepIdx('xdy')) },
      { match: /^• y′ = y²:/, make: sepMake(sepIdx('y2')) },
      { match: /^• y′ = \(1 \+ y²\)·x:/, make: sepMake(sepIdx('tan')) },
      { match: /^• y′ = y\/x:/, make: sepMake(sepIdx('yx')) },
    ],
    challenge: {
      title: () => tx('y değerini önceden tahmin et', 'Predict the value of y'),
      prompt: (p) => {
        sepNorm(p);
        return tx(`y′ = ${SEP[p.kd].eq(p)}, y(${N(p.x0)}) = ${N(p.y0)} için y(${N(p.x1)}) kaçtır? Denklemi ayırıp çözerek 2 ondalık basamakla yazalım.`,
          `For y′ = ${SEP[p.kd].eq(p)}, y(${N(p.x0)}) = ${N(p.y0)}, what is y(${N(p.x1)})? Let's separate and solve, then type it to 2 decimals.`);
      },
      target: (p) => { sepNorm(p); return yAt(p, p.x1); },
      tol: (p) => { sepNorm(p); return Math.max(0.01, 0.005 * Math.abs(yAt(p, p.x1))); },
      hint: (p, g) => { sepNorm(p); const t = yAt(p, p.x1); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx('Önce C (ya da A) sabitini başlangıç koşulundan bulalım.', 'First find the constant C (or A) from the initial condition.'); },
    },
    _test: { SEP, rk4, norm: sepNorm, create: sepCreate, pieces: sepPieces, yAt, F: sepF },
  });

  // =====================================================================================================
  //  QUIZ MATERIAL
  // =====================================================================================================
  window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };
  const tSF = () => tx('Eğim Alanları ve Euler Yöntemi', "Slope Fields and Euler's Method");
  const tSP = () => tx('Değişkenlerine Ayrılabilir Denklemler', 'Separable Equations');
  const lv = (fn, level) => { fn.level = level; return fn; };
  // value/note pairs -> distinct wrongs (different from correct, filled with correct + step when short)
  function pack(correct, pairs, fill) {
    const seen = new Set([fmt2(correct)]), wrongs = [], notes = [];
    for (const [v, nt] of pairs) {
      if (!Number.isFinite(v) || seen.has(fmt2(v))) continue;
      seen.add(fmt2(v)); wrongs.push(v); notes.push(nt);
    }
    for (const d of fill) {
      const v = correct + d;
      if (wrongs.length >= 5) break;
      if (!seen.has(fmt2(v))) { seen.add(fmt2(v)); wrongs.push(v); notes.push(''); }
    }
    return { wrongs, notes };
  }
  const numQ = (topic, text, correct, sol, rng, level, pairs, fill) => {
    const pk = pack(correct, pairs, fill || [1, -1, 2, -2, 0.5, -0.5]);
    return Assessment.num(topic, text, correct, sol, rng, { level, wrongs: pk.wrongs, notes: pk.notes });
  };
  const LIN = [
    { s: 'x + y', F: (x, y) => x + y }, { s: 'x − y', F: (x, y) => x - y }, { s: '2x − y', F: (x, y) => 2 * x - y },
    { s: 'x + 2y', F: (x, y) => x + 2 * y }, { s: 'y − x', F: (x, y) => y - x },
  ];
  const NLN = [
    { s: 'x² − y', F: (x, y) => x * x - y }, { s: 'x·y', F: (x, y) => x * y }, { s: 'y − x²', F: (x, y) => y - x * x }, { s: 'x·y − 2', F: (x, y) => x * y - 2 },
  ];

  // MAIN: Euler, two steps
  const qEuler2 = lv((rng) => {
    const L = rng.pick(LIN), x0 = rng.pick([0, 1]), y0 = rng.pick([1, 2, -1, 3]), h = 0.5;
    const E = euler(L.F, x0, y0, h, 2), c = E.ys[2];
    const a0 = L.F(x0, y0), x1 = x0 + h;
    return numQ(tSF(),
      tx(`y′ = ${L.s}, y(${x0}) = ${y0} başlangıç değer probleminde h = 0.5 ile Euler yöntemi uygulanıyor. y(${N(x0 + 1)}) için yaklaşık değer y₂ kaçtır?`,
        `For the initial value problem y′ = ${L.s}, y(${x0}) = ${y0}, Euler's method with h = 0.5 is used. What is the approximation y₂ for y(${N(x0 + 1)})?`),
      c, [
        tx(`y₁ = y₀ + h·F(x₀, y₀) = ${y0} + 0.5·${P(a0)} = ${N(E.ys[1])}.`, `y₁ = y₀ + h·F(x₀, y₀) = ${y0} + 0.5·${P(a0)} = ${N(E.ys[1])}.`),
        tx(`y₂ = y₁ + h·F(x₁, y₁) = ${N(E.ys[1])} + 0.5·${P(E.fs[1])} = ${N(c)}.`, `y₂ = y₁ + h·F(x₁, y₁) = ${N(E.ys[1])} + 0.5·${P(E.fs[1])} = ${N(c)}.`),
      ], rng, 2, [
        [E.ys[1], tx('Yalnızca bir adım atılmış (y₁).', 'Only one step was taken (y₁).')],
        [y0 + a0 + L.F(x1, y0 + a0), tx('h çarpanı unutulmuş: yₖ₊₁ = yₖ + F.', 'The factor h was forgotten: yₖ₊₁ = yₖ + F.')],
        [E.ys[1] + h * L.F(x0, E.ys[1]), tx('İkinci adımda eğim yeni x₁ yerine eski x₀ ile hesaplanmış.', 'The second slope used the old x₀ instead of the new x₁.')],
        [E.ys[1] + h * L.F(x1, y0), tx('İkinci adımda eğim yeni y₁ yerine eski y₀ ile hesaplanmış.', 'The second slope used the old y₀ instead of the new y₁.')],
      ]);
  }, 2);

  // EXTRA 1: read a slope
  const qSlope = lv((rng) => {
    const L = rng.pick(NLN), x = rng.pick([1, 2, 3, -1]), y = rng.pick([2, -1, 1, 3]);
    const c = L.F(x, y);
    return numQ(tSF(),
      tx(`y′ = ${L.s} denkleminin eğim alanında (${x}, ${y}) noktasındaki doğru parçasının eğimi kaçtır?`,
        `In the slope field of y′ = ${L.s}, what is the slope of the segment at the point (${x}, ${y})?`),
      c, [tx(`Eğim = F(x, y) = F(${x}, ${y}) = ${N(c)}.`, `Slope = F(x, y) = F(${x}, ${y}) = ${N(c)}.`)], rng, 1, [
        [L.F(y, x), tx('x ve y yer değiştirmiş.', 'x and y were swapped.')],
        [-c, tx('Eğimin işareti ters alınmış.', 'The sign of the slope was reversed.')],
        [L.F(x, 0), tx('y yerine 0 konmuş.', 'y was replaced by 0.')],
        [L.F(0, y), tx('x yerine 0 konmuş.', 'x was replaced by 0.')],
      ], [1, -1, 2, -2, 3, -3]);
  }, 1);

  // EXTRA 2: one Euler step (non-linear F, small h)
  const qStep = lv((rng) => {
    const L = rng.pick(NLN), x0 = rng.pick([1, 2, 0]), y0 = rng.pick([1, 2, 3]), h = rng.pick([0.1, 0.2, 0.5]);
    const m = L.F(x0, y0), c = y0 + h * m;
    return numQ(tSF(),
      tx(`y′ = ${L.s}, y(${x0}) = ${y0} için h = ${h} adım uzunluğuyla Euler yönteminin ilk adımı y₁ kaçtır?`,
        `For y′ = ${L.s}, y(${x0}) = ${y0}, what is the first Euler step y₁ with step size h = ${h}?`),
      c, [tx(`F(x₀, y₀) = ${N(m)}; y₁ = y₀ + h·F = ${y0} + ${h}·${P(m)} = ${N(c)}.`, `F(x₀, y₀) = ${N(m)}; y₁ = y₀ + h·F = ${y0} + ${h}·${P(m)} = ${N(c)}.`)], rng, 1, [
        [h * m, tx('y₀ eklenmemiş: yalnızca h·F alınmış.', 'y₀ was not added: only h·F was taken.')],
        [y0 + m, tx('h çarpanı unutulmuş.', 'The factor h was forgotten.')],
        [y0 + h * L.F(y0, x0), tx('F(x, y) hesaplanırken x ile y yer değiştirmiş.', 'x and y were swapped inside F(x, y).')],
        [y0 - h * m, tx('İşaret hatası: yₖ − h·F alınmış.', 'Sign slip: yₖ − h·F was used.')],
      ], [0.1, -0.1, 0.5, -0.5, 1, -1]);
  }, 1);

  // EXTRA 3: y' = y, three steps (compare with e^x)
  const qGrow = lv((rng) => {
    const y0 = rng.pick([1, 2, 3]), c = y0 * 1.331;
    return numQ(tSF(),
      tx(`y′ = y, y(0) = ${y0} için h = 0.1 ile Euler yöntemi üç adım uygulanıyor. y₃ (yani y(0.3) için yaklaşık değer) kaçtır?`,
        `For y′ = y, y(0) = ${y0}, Euler's method with h = 0.1 is applied for three steps. What is y₃ (the approximation of y(0.3))?`),
      c, [tx(`Her adımda yₖ₊₁ = yₖ + 0.1·yₖ = 1.1·yₖ. Dolayısıyla y₃ = ${y0}·1.1³ = ${y0}·1.331 = ${N(c)}.`, `Each step gives yₖ₊₁ = yₖ + 0.1·yₖ = 1.1·yₖ. Hence y₃ = ${y0}·1.1³ = ${y0}·1.331 = ${N(c)}.`),
        tx(`(Tam çözüm y₀·e^(0.3) = ${N(y0 * Math.exp(0.3))}; Euler biraz eksik kalır.)`, `(The exact solution y₀·e^(0.3) = ${N(y0 * Math.exp(0.3))}; Euler falls a bit short.)`)], rng, 2, [
        [y0 * 1.3, tx('Üç adım için yalnızca doğrusal artış alınmış: y₀(1 + 3·0.1).', 'Only linear growth was used: y₀(1 + 3·0.1).')],
        [y0 * Math.exp(0.3), tx('Bu Euler değeri değil, tam çözümdür y₀·e^(0.3).', 'This is the exact solution y₀·e^(0.3), not the Euler value.')],
        [y0 * 1.21, tx('Yalnızca iki adım atılmış (y₂).', 'Only two steps were taken (y₂).')],
        [y0 * 1.1, tx('Yalnızca bir adım atılmış (y₁).', 'Only one step was taken (y₁).')],
      ], [0.5, -0.5, 1, -1]);
  }, 2);

  // EXTRA 4: Euler error for y' = y on [0, 1]
  const qErr = lv((rng) => {
    const n = rng.pick([2, 4, 10]), h = 1 / n, eu = Math.pow(1 + h, n), c = Math.E - eu, eu2 = Math.pow(1 + 2 * h, n / 2);
    return numQ(tSF(),
      tx(`y′ = y, y(0) = 1 problemi [0, 1] aralığında h = ${N(h)} (n = ${n} adım) ile Euler yöntemiyle çözülüyor. Tam değer y(1) = e ile Euler değeri yₙ arasındaki fark e − yₙ kaçtır?`,
        `The problem y′ = y, y(0) = 1 is solved on [0, 1] by Euler's method with h = ${N(h)} (n = ${n} steps). What is the difference e − yₙ between the exact value y(1) = e and the Euler value yₙ?`),
      c, [tx(`yₖ₊₁ = (1 + h)·yₖ ⇒ yₙ = (1 + ${N(h)})^${n} = ${N(eu)}.`, `yₖ₊₁ = (1 + h)·yₖ ⇒ yₙ = (1 + ${N(h)})^${n} = ${N(eu)}.`),
        tx(`Fark: e − yₙ = ${N(Math.E)} − ${N(eu)} = ${N(c)} (pozitif: Euler eksik tahmin eder).`, `Difference: e − yₙ = ${N(Math.E)} − ${N(eu)} = ${N(c)} (positive: Euler under-estimates).`)], rng, 3, [
        [eu, tx('Euler değerinin kendisi verilmiş, fark değil.', 'The Euler value itself was given, not the difference.')],
        [Math.E, tx('Tam değerin kendisi verilmiş, fark değil.', 'The exact value itself was given, not the difference.')],
        [Math.E - eu2, tx('Adım uzunluğu 2h alınarak (n/2 adım) hesaplanmış.', 'It was computed with the doubled step 2h (n/2 steps).')],
        [eu - Math.E, tx('Fark ters sırada alınmış (işaret hatası).', 'The difference was taken in the wrong order (sign slip).')],
      ], [0.1, -0.1, 0.2, 0.05]);
  }, 3);

  // ---- separable ----
  // MAIN: y(x1) for y' = xy / x/y / y^2 / k y
  const qSepMain = lv((rng) => {
    const key = rng.pick(['xy', 'xdy', 'y2', 'ky']);
    sepForced = { kd: sepIdx(key) };
    let p; try { p = sepCreate(rng); } finally { sepForced = null; }
    const c = yAt(p, p.x1), { x0, y0, x1, k } = p;
    let eq, wr, sol;
    if (key === 'xy') {
      eq = 'x·y';
      wr = [[y0 * Math.exp(x1 * x1), tx('∫x dx = x²/2 yerine x² alınmış (1/2 unutulmuş).', '∫x dx was taken as x² instead of x²/2 (the 1/2 was forgotten).')],
        [y0 * Math.exp(x1), tx('∫x dx yerine x alınmış.', '∫x dx was replaced by x.')],
        [y0 + x1 * x1 / 2, tx('Logaritma hiç kaldırılmamış: ln|y| yerine y alınmış.', 'The logarithm was never removed: y was used in place of ln|y|.')],
        [Math.exp(x1 * x1 / 2), tx('Başlangıç koşulu (A = y₀) kullanılmamış.', 'The initial condition (A = y₀) was not used.')]];
      sol = [tx(`dy/y = x dx ⇒ ln|y| = x²/2 + C₁ ⇒ y = A·e^(x²/2); y(0) = ${y0} ⇒ A = ${y0}.`, `dy/y = x dx ⇒ ln|y| = x²/2 + C₁ ⇒ y = A·e^(x²/2); y(0) = ${y0} ⇒ A = ${y0}.`),
        tx(`y(${N(x1)}) = ${y0}·e^(${N(x1 * x1 / 2)}) = ${N(c)}.`, `y(${N(x1)}) = ${y0}·e^(${N(x1 * x1 / 2)}) = ${N(c)}.`)];
    } else if (key === 'xdy') {
      eq = 'x/y';
      wr = [[x1 + y0, tx('y² = x² + C yerine doğrusal toplam alınmış.', 'A linear sum was used instead of y² = x² + C.')],
        [x1 * x1 + y0 * y0, tx('Karekök alınmamış: y² verilmiş.', 'The square root was not taken: y² was given.')],
        [Math.sqrt(Math.abs(x1 * x1 - y0 * y0)), tx('C işareti yanlış: y² = x² − y₀² alınmış.', 'The sign of C was wrong: y² = x² − y₀² was used.')],
        [-c, tx('Kök işareti y₀ işaretine göre seçilmemiş.', 'The sign of the root was not chosen to match y₀.')]];
      sol = [tx(`y dy = x dx ⇒ y²/2 = x²/2 + C₁ ⇒ y² = x² + C; y(0) = ${y0} ⇒ C = ${y0 * y0}.`, `y dy = x dx ⇒ y²/2 = x²/2 + C₁ ⇒ y² = x² + C; y(0) = ${y0} ⇒ C = ${y0 * y0}.`),
        tx(`y(${N(x1)}) = ${y0 < 0 ? '−' : ''}√(${N(x1 * x1)} + ${y0 * y0}) = ${N(c)}.`, `y(${N(x1)}) = ${y0 < 0 ? '−' : ''}√(${N(x1 * x1)} + ${y0 * y0}) = ${N(c)}.`)];
    } else if (key === 'y2') {
      eq = 'y²';
      wr = [[y0 / (1 + y0 * (x1 - x0)), tx('∫y⁻² dy = −1/y işareti yanlış alınmış.', 'The sign of ∫y⁻² dy = −1/y was wrong.')],
        [y0 + y0 * y0 * (x1 - x0), tx('Euler benzeri yaklaşım: y₀ + y₀²·Δx.', 'An Euler-like approximation: y₀ + y₀²·Δx.')],
        [1 / (1 - (x1 - x0)), tx('Başlangıç değeri y₀ hesaba katılmamış.', 'The initial value y₀ was ignored.')],
        [y0 * Math.exp(y0 * (x1 - x0)), tx('y′ = y² denklemi üstel (y′ = k·y) gibi çözülmüş.', 'y′ = y² was solved like the exponential y′ = k·y.')]];
      sol = [tx(`dy/y² = dx ⇒ −1/y = x + C₁ ⇒ y = y₀/(1 − y₀·x) (x₀ = 0).`, `dy/y² = dx ⇒ −1/y = x + C₁ ⇒ y = y₀/(1 − y₀·x) (x₀ = 0).`),
        tx(`y(${N(x1)}) = ${N(y0)}/(1 − ${P(y0)}·${P(x1)}) = ${N(c)}.`, `y(${N(x1)}) = ${N(y0)}/(1 − ${P(y0)}·${P(x1)}) = ${N(c)}.`)];
    } else {
      eq = `${N(k)}·y`;
      wr = [[Math.exp(k * x1), tx('Başlangıç değeri y₀ çarpanı unutulmuş.', 'The factor y₀ was forgotten.')],
        [y0 + k * x1, tx('Üstel yerine doğrusal büyüme alınmış.', 'Linear growth was used instead of exponential.')],
        [y0 * Math.exp(x1 / k), tx('Üste k·x yerine x/k alınmış.', 'x/k was used in the exponent instead of k·x.')],
        [y0 * Math.exp(k + x1), tx('Üste k + x yazılmış (çarpım yerine toplam).', 'k + x was written in the exponent (sum instead of product).')]];
      sol = [tx(`dy/y = ${N(k)} dx ⇒ y = A·e^(${N(k)}x); y(0) = ${y0} ⇒ A = ${y0}.`, `dy/y = ${N(k)} dx ⇒ y = A·e^(${N(k)}x); y(0) = ${y0} ⇒ A = ${y0}.`),
        tx(`y(${N(x1)}) = ${y0}·e^(${N(k * x1)}) = ${N(c)}.`, `y(${N(x1)}) = ${y0}·e^(${N(k * x1)}) = ${N(c)}.`)];
    }
    return numQ(tSP(),
      tx(`y′ = ${eq}, y(${N(x0)}) = ${N(y0)} başlangıç değer probleminin çözümü için y(${N(x1)}) kaçtır?`, `For the initial value problem y′ = ${eq}, y(${N(x0)}) = ${N(y0)}, what is y(${N(x1)})?`),
      c, sol, rng, 2, wr, [1, -1, 0.5, -0.5, 2]);
  }, 2);

  // EXTRA 1: y' = xy with y(0) = y0, evaluate at x = 2 (answer y0 e^2)
  const qSepXY = lv((rng) => {
    const y0 = rng.pick([1, 2, 3]), x1 = 2, c = y0 * Math.exp(2);
    return numQ(tSP(),
      tx(`y′ = x·y, y(0) = ${y0} için y(2) kaçtır?`, `For y′ = x·y, y(0) = ${y0}, what is y(2)?`),
      c, [tx(`dy/y = x dx ⇒ ln|y| = x²/2 + C₁ ⇒ y = A·e^(x²/2); y(0) = ${y0} ⇒ A = ${y0}.`, `dy/y = x dx ⇒ ln|y| = x²/2 + C₁ ⇒ y = A·e^(x²/2); y(0) = ${y0} ⇒ A = ${y0}.`),
        tx(`y(2) = ${y0}·e^(2) = ${N(c)}.`, `y(2) = ${y0}·e^(2) = ${N(c)}.`)], rng, 1, [
        [y0 * Math.exp(x1 * x1), tx('1/2 çarpanı unutulmuş: e^(x²) alınmış.', 'The factor 1/2 was forgotten: e^(x²) was used.')],
        [y0 * Math.exp(x1), tx('∫x dx yerine x alınmış.', '∫x dx was replaced by x.')],
        [Math.exp(2), tx('Başlangıç değeri y₀ çarpanı unutulmuş.', 'The factor y₀ was forgotten.')],
        [y0 + 2, tx('Logaritma kaldırılmamış.', 'The logarithm was not removed.')],
      ], [1, -1, 2, -2, 3]);
  }, 1);

  // EXTRA 2: y' = x/y with Pythagorean data
  const qSepXdy = lv((rng) => {
    const t = rng.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [8, 6, 10]]), y0 = t[0], x1 = t[1], c = t[2];
    return numQ(tSP(),
      tx(`y′ = x/y, y(0) = ${y0} (y > 0) için y(${x1}) kaçtır?`, `For y′ = x/y, y(0) = ${y0} (y > 0), what is y(${x1})?`),
      c, [tx(`y dy = x dx ⇒ y² = x² + C; y(0) = ${y0} ⇒ C = ${y0 * y0}.`, `y dy = x dx ⇒ y² = x² + C; y(0) = ${y0} ⇒ C = ${y0 * y0}.`),
        tx(`y(${x1}) = √(${x1 * x1} + ${y0 * y0}) = √${x1 * x1 + y0 * y0} = ${c}.`, `y(${x1}) = √(${x1 * x1} + ${y0 * y0}) = √${x1 * x1 + y0 * y0} = ${c}.`)], rng, 2, [
        [x1 + y0, tx('y² = x² + C yerine doğrusal toplam.', 'A linear sum instead of y² = x² + C.')],
        [x1 * x1 + y0 * y0, tx('Karekök unutulmuş.', 'The square root was forgotten.')],
        [Math.sqrt(Math.abs(x1 * x1 - y0 * y0)), tx('C işareti yanlış (x² − y₀²).', 'Wrong sign of C (x² − y₀²).')],
        [y0 + x1 * x1 / 2, tx('y dy integralinde y²/2 yerine y alınmış.', 'y was used instead of y²/2 after integrating y dy.')],
      ], [1, -1, 2, -2]);
  }, 2);

  // EXTRA 3: blow-up point of y' = y^2
  const qSepBlow = lv((rng) => {
    const x0 = rng.pick([0, 1, 2]), y0 = rng.pick([1, 2, 4, 0.5]), c = x0 + 1 / y0;
    return numQ(tSP(),
      tx(`y′ = y², y(${x0}) = ${y0} çözümü, x = ${x0} noktasının sağında, x'in hangi değerinde sonsuza gider? (Çözümün var olduğu aralığın sağ ucu.)`,
        `At which value of x, to the right of x = ${x0}, does the solution of y′ = y², y(${x0}) = ${y0} go to infinity? (The right end of its interval of existence.)`),
      c, [tx(`dy/y² = dx ⇒ −1/y = x + C₁ ⇒ y = y₀/(1 − y₀(x − x₀)).`, `dy/y² = dx ⇒ −1/y = x + C₁ ⇒ y = y₀/(1 − y₀(x − x₀)).`),
        tx(`Payda 0: 1 − ${y0}(x − ${x0}) = 0 ⇒ x* = ${x0} + 1/${y0} = ${N(c)}.`, `Denominator 0: 1 − ${y0}(x − ${x0}) = 0 ⇒ x* = ${x0} + 1/${y0} = ${N(c)}.`)], rng, 3, [
        [1 / y0, tx('x₀ eklenmemiş: yalnızca 1/y₀ verilmiş.', 'x₀ was not added: only 1/y₀ was given.')],
        [x0 - 1 / y0, tx('İşaret hatası: x₀ − 1/y₀.', 'Sign slip: x₀ − 1/y₀.')],
        [x0 + y0, tx('1/y₀ yerine y₀ alınmış.', 'y₀ was used instead of 1/y₀.')],
        [x0 + 2 / y0, tx('Uzaklık iki katı hesaplanmış.', 'The distance was doubled.')],
      ], [1, -1, 0.5, -0.5, 2]);
  }, 3);

  // EXTRA 4: y' = k y with a decay/growth value
  const qSepK = lv((rng) => {
    const k = rng.pick([-1, -2, 2, 3]), y0 = rng.pick([2, 4, 5]), x1 = rng.pick([0.5, 1]), c = y0 * Math.exp(k * x1);
    return numQ(tSP(),
      tx(`y′ = ${k}·y, y(0) = ${y0} için y(${x1}) kaçtır?`, `For y′ = ${k}·y, y(0) = ${y0}, what is y(${x1})?`),
      c, [tx(`dy/y = ${k} dx ⇒ y = A·e^(${k}x); y(0) = ${y0} ⇒ A = ${y0}.`, `dy/y = ${k} dx ⇒ y = A·e^(${k}x); y(0) = ${y0} ⇒ A = ${y0}.`),
        tx(`y(${x1}) = ${y0}·e^(${N(k * x1)}) = ${N(c)}.`, `y(${x1}) = ${y0}·e^(${N(k * x1)}) = ${N(c)}.`)], rng, 2, [
        [Math.exp(k * x1), tx('y₀ çarpanı unutulmuş.', 'The factor y₀ was forgotten.')],
        [y0 + k * x1, tx('Üstel yerine doğrusal değişim alınmış.', 'A linear change was used instead of exponential.')],
        [y0 * Math.exp(x1 / k), tx('Üste k·x yerine x/k yazılmış.', 'x/k was written in the exponent instead of k·x.')],
        [y0 * Math.exp(-k * x1), tx('Üssün işareti ters alınmış.', 'The sign of the exponent was reversed.')],
      ], [1, -1, 0.5, -0.5, 2]);
  }, 2);

  // EXTRA 5: y' = (1 + y^2) x, y(0) = 0 (tan form)
  const qSepTan = lv((rng) => {
    const x1 = rng.pick([1, 1.2, 0.8]), c = Math.tan(x1 * x1 / 2);
    return numQ(tSP(),
      tx(`y′ = (1 + y²)·x, y(0) = 0 için y(${x1}) kaçtır? (2 ondalık basamak)`, `For y′ = (1 + y²)·x, y(0) = 0, what is y(${x1})? (2 decimals)`),
      c, [tx(`dy/(1 + y²) = x dx ⇒ arctan y = x²/2 + C; y(0) = 0 ⇒ C = 0 ⇒ y = tan(x²/2).`, `dy/(1 + y²) = x dx ⇒ arctan y = x²/2 + C; y(0) = 0 ⇒ C = 0 ⇒ y = tan(x²/2).`),
        tx(`y(${x1}) = tan(${N(x1 * x1 / 2)}) = ${N(c)}.`, `y(${x1}) = tan(${N(x1 * x1 / 2)}) = ${N(c)}.`)], rng, 3, [
        [Math.tan(x1), tx('x²/2 yerine x alınmış.', 'x was used instead of x²/2.')],
        [Math.tan(x1 * x1), tx('1/2 çarpanı unutulmuş: tan(x²).', 'The factor 1/2 was forgotten: tan(x²).')],
        [x1 * x1 / 2, tx('arctan y yerine y alınmış (tan alınmamış).', 'y was used instead of arctan y (tan was not applied).')],
        [Math.sin(x1 * x1 / 2), tx('tan yerine sin alınmış.', 'sin was used instead of tan.')],
      ], [0.5, -0.5, 1, -1]);
  }, 3);

  const Q = window.Calc2Quiz;
  Q.main.push(qEuler2, qSepMain);
  Q.extra.push(qSlope, qStep, qGrow, qErr, qSepXY, qSepXdy, qSepBlow, qSepK, qSepTan);
})();
