// Ported from Modules/Integrals/AreaAccumulationControl.vb: area as ACCUMULATION. The integral of f from a to x is the running
// total of signed area; area below the axis subtracts. The tab asks for the signed integral, the total (geometric) area or the
// net change, with the accumulation function A(x) = ∫ₐˣ f drawn next to f. The VB help text is the "konu anlatımı".
// problem = { fi: function index, a, b, mode: 0 signed | 1 total | 2 net change }.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v);
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  function rgba(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return { base: hex, alpha: a };
    return `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})`;
  }
  let forced = null;
  const DMIN = -5, DMAX = 5;
  const PI = Math.PI;

  // f, an exact antiderivative F, the roots of f inside [-5, 5], and the working text of the antiderivative
  const FUNS = [
    { f: (x) => 0.25 * x * x + 0.5, F: (x) => x * x * x / 12 + 0.5 * x, roots: [], eq: '0.25x² + 0.5',
      note: () => tx('her zaman pozitif', 'always positive'),
      anti: () => tx('∫(0.25x² + 0.5) dx = 0.25·x³/3 + 0.5x = x³/12 + 0.5x', '∫(0.25x² + 0.5) dx = 0.25·x³/3 + 0.5x = x³/12 + 0.5x'), Fs: 'x³/12 + 0.5x' },
    { f: (x) => 0.3 * (x * x - 4), F: (x) => 0.1 * x * x * x - 1.2 * x, roots: [-2, 2], eq: '0.3(x² − 4)',
      note: () => tx('x = ±2\'de sıfırı keser', 'crosses zero at x = ±2'),
      anti: () => '∫0.3(x² − 4) dx = 0.3·(x³/3 − 4x) = 0.1x³ − 1.2x', Fs: '0.1x³ − 1.2x' },
    { f: (x) => 1.8 * Math.sin(x), F: (x) => -1.8 * Math.cos(x), roots: [-PI, 0, PI], eq: '1.8·sin x',
      note: () => tx('sıfırı tekrar tekrar keser (x = kπ)', 'crosses zero repeatedly (x = kπ)'),
      anti: () => '∫1.8·sin x dx = −1.8·cos x', Fs: '−1.8·cos x' },
    { f: (x) => 0.15 * x * x * x, F: (x) => 0.0375 * x * x * x * x, roots: [0], eq: '0.15x³',
      note: () => tx('tek fonksiyon, x = 0\'da işaret değiştirir', 'odd function, changes sign at x = 0'),
      anti: () => '∫0.15x³ dx = 0.15·x⁴/4 = 0.0375x⁴', Fs: '0.0375x⁴' },
    { f: (x) => 0.5 * x - 1, F: (x) => 0.25 * x * x - x, roots: [2], eq: '0.5x − 1',
      note: () => tx('doğrusal, x = 2\'de sıfırı keser', 'linear, crosses zero at x = 2'),
      anti: () => '∫(0.5x − 1) dx = 0.25x² − x', Fs: '0.25x² − x' },
    { f: (x) => (x * x + 2 * x - 3) / 4, F: (x) => (x * x * x / 3 + x * x - 3 * x) / 4, roots: [-3, 1], eq: '(x² + 2x − 3)/4',
      note: () => tx('x = −3 ve x = 1\'de sıfırı keser', 'crosses zero at x = −3 and x = 1'),
      anti: () => '∫(x² + 2x − 3)/4 dx = (x³/3 + x² − 3x)/4', Fs: '(x³/3 + x² − 3x)/4' },
    { f: (x) => 0.1 * x * x * x - 0.9 * x, F: (x) => 0.025 * x * x * x * x - 0.45 * x * x, roots: [-3, 0, 3], eq: '0.1x³ − 0.9x',
      note: () => tx('x = −3, 0, 3\'te sıfırı keser', 'crosses zero at x = −3, 0, 3'),
      anti: () => '∫(0.1x³ − 0.9x) dx = 0.025x⁴ − 0.45x²', Fs: '0.025x⁴ − 0.45x²' },
    { f: (x) => 2 * Math.cos(x), F: (x) => 2 * Math.sin(x), roots: [-3 * PI / 2, -PI / 2, PI / 2, 3 * PI / 2], eq: '2·cos x',
      note: () => tx('x = ±π/2, ±3π/2\'de sıfırı keser', 'crosses zero at x = ±π/2, ±3π/2'),
      anti: () => '∫2·cos x dx = 2·sin x', Fs: '2·sin x' },
  ];

  function Help() { return tx("FİKİR" + "\n" + "İntegral, eğri altındaki alanı çok sayıda ince şeridin toplamı olarak ölçer ve değişim hızından toplam değişimi elde eder. Hız → yer değiştirme, akış hızı → toplam hacim, güç → enerji." + "\n" + "\n" + "TANIM" + "\n" + "f, [a,b]'de sürekliyse, birikmiş alan fonksiyonu" + "\n" + "  A(x) = ∫ₐˣ f(t) dt" + "\n" + "ve belirli integral ∫ₐᵇ f(x) dx, f ile x-ekseni arasındaki İŞARETLİ alandır." + "\n" + "\n" + "İŞARETLİ ALAN" + "\n" + "• f > 0 olan bölge: pozitif katkı. f < 0 olan bölge: NEGATİF katkı." + "\n" + "• ∫ f dx = (üstteki alan) − (alttaki alan). TOPLAM (geometrik) ALAN için ∫|f| dx kullanılır." + "\n" + "\n" + "ÖZELLİKLER" + "\n" + "• ∫ₐᵃ f = 0;  ∫ₐᵇ f = −∫ᵇₐ f" + "\n" + "• ∫ₐᵇ f = ∫ₐᶜ f + ∫ᶜᵇ f  (aralığı bölme)" + "\n" + "• ∫(kf + g) = k∫f + ∫g (doğrusallık)" + "\n" + "• f ≥ g ise ∫f ≥ ∫g." + "\n" + "• İki eğri arası alan: ∫ₐᵇ [üst(x) − alt(x)] dx." + "\n" + "\n" + "YÖNTEM (toplam alanı bulma)" + "\n" + "1. f = 0 köklerini buluruz (işaret değiştiren yerler)." + "\n" + "2. Aralığı bu köklerde parçalara ayırırız." + "\n" + "3. Her parçada ∫f değerini hesaplar, mutlak değerini alırız (ya da ∫|f|)." + "\n" + "4. Hepsini toplarız." + "\n" + "\n" + "BİRİKİM YORUMU" + "\n" + "A'(x) = f(x): birikmiş miktarın değişim hızı integrandın kendisidir. f hız (m/s) ise A yer değiştirme (m); f akış (L/dk) ise A hacim (L)." + "\n" + "\n" + "TUZAKLAR" + "\n" + "• İşaretli alan ≠ geometrik alan: x-ekseninin altındaki parçalar toplamı götürür (sin x'in [0, 2π]'deki integrali 0'dır)." + "\n" + "• Sınırların sırası ters yazılırsa işaret değişir." + "\n" + "• Sonsuzluğa giden fonksiyonlarda integral yakınsamayabilir." + "\n" + "• Birimler: sonuç (f birimi × x birimi) olur." + "\n" + "\n" + "MİNİ ÖRNEK" + "\n" + "∫₀² x² dx = [x³/3]₀² = 8/3 ≈ 2,67. Hız v(t) = 3t m/s ise ilk 4 s'deki yer değiştirme ∫₀⁴ 3t dt = [1,5t²]₀⁴ = 24 m.", "IDEA" + "\n" + "The integral measures the area under a curve as a sum of many thin strips and turns a rate of change into a total change. Velocity → displacement, flow rate → total volume, power → energy." + "\n" + "\n" + "DEFINITION" + "\n" + "For f continuous on [a,b], the accumulated area function is" + "\n" + "  A(x) = ∫ₐˣ f(t) dt" + "\n" + "and the definite integral ∫ₐᵇ f(x) dx is the SIGNED area between f and the x-axis." + "\n" + "\n" + "SIGNED AREA" + "\n" + "• Where f > 0: positive contribution. Where f < 0: NEGATIVE contribution." + "\n" + "• ∫ f dx = (area above) − (area below). For the TOTAL (geometric) AREA we use ∫|f| dx." + "\n" + "\n" + "PROPERTIES" + "\n" + "• ∫ₐᵃ f = 0;  ∫ₐᵇ f = −∫ᵇₐ f" + "\n" + "• ∫ₐᵇ f = ∫ₐᶜ f + ∫ᶜᵇ f  (splitting the interval)" + "\n" + "• ∫(kf + g) = k∫f + ∫g (linearity)" + "\n" + "• If f ≥ g then ∫f ≥ ∫g." + "\n" + "• Area between two curves: ∫ₐᵇ [upper(x) − lower(x)] dx." + "\n" + "\n" + "METHOD (total area)" + "\n" + "1. We find the roots of f = 0 (where the sign changes)." + "\n" + "2. We split the interval at these roots." + "\n" + "3. We compute ∫f on each piece and take its absolute value (or ∫|f|)." + "\n" + "4. We add everything up." + "\n" + "\n" + "ACCUMULATION MEANING" + "\n" + "A'(x) = f(x): the rate of change of the accumulated amount is the integrand itself. If f is velocity (m/s), A is displacement (m); if f is flow (L/min), A is volume (L)." + "\n" + "\n" + "PITFALLS" + "\n" + "• Signed area ≠ geometric area: parts below the x-axis subtract (the integral of sin x over [0, 2π] is 0)." + "\n" + "• Writing the limits in reverse flips the sign." + "\n" + "• Functions that blow up may have no convergent integral." + "\n" + "• Units: the result carries (f unit × x unit)." + "\n" + "\n" + "MINI EXAMPLE" + "\n" + "∫₀² x² dx = [x³/3]₀² = 8/3 ≈ 2.67. If velocity is v(t) = 3t m/s, the displacement in the first 4 s is ∫₀⁴ 3t dt = [1.5t²]₀⁴ = 24 m."); }

  function simpson(f, a, b, n) {
    n = n || 400;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }

  function norm(p) {
    p.a = Math.max(DMIN, Math.min(DMAX - 0.5, p.a));
    p.b = Math.max(p.a + 0.5, Math.min(DMAX, p.b));
    if (p.b - p.a < 0.5 - 1e-9) p.a = p.b - 0.5;
    return p;
  }

  // pieces between consecutive sign changes: [{x1, x2, v (signed), ab (|v|)}]
  function pieces(p) {
    const u = FUNS[p.fi];
    const cuts = [p.a];
    u.roots.forEach((r) => { if (r > p.a + 1e-9 && r < p.b - 1e-9) cuts.push(r); });
    cuts.push(p.b);
    const out = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const v = u.F(cuts[i + 1]) - u.F(cuts[i]);
      out.push({ x1: cuts[i], x2: cuts[i + 1], v, ab: Math.abs(v) });
    }
    return out;
  }
  function totals(p) {
    const ps = pieces(p);
    let pos = 0, neg = 0;
    ps.forEach((q) => { if (q.v >= 0) pos += q.v; else neg += -q.v; });
    return { ps, pos, neg, signed: pos - neg, total: pos + neg };
  }

  function modeName(m) {
    return [tx('İŞARETLİ alan', 'SIGNED area'), tx('TOPLAM (geometrik) alan', 'TOTAL (geometric) area'), tx('NET DEĞİŞİM', 'NET CHANGE')][m];
  }

  function problemStatement(p) {
    norm(p);
    const u = FUNS[p.fi];
    if (p.mode === 0) {
      return tx(`f(x) = ${u.eq} fonksiyonu için x = ${N2(p.a)} ile x = ${N2(p.b)} arasındaki İŞARETLİ alanı, yani ∫ f(x) dx belirli integralini bulalım (eksenin altındaki alan negatif sayılır). Birikmiş alan fonksiyonu A(x) = ∫ₐˣ f(t) dt için A(${N2(p.b)}) değeri kaç olur?`,
        `For f(x) = ${u.eq} let's find the SIGNED area between x = ${N2(p.a)} and x = ${N2(p.b)}, i.e. the definite integral ∫ f(x) dx (area below the axis counts as negative). What is the accumulated-area value A(${N2(p.b)}) of A(x) = ∫ₐˣ f(t) dt?`);
    }
    if (p.mode === 1) {
      return tx(`f(x) = ${u.eq} eğrisi ile x-ekseni arasında, x = ${N2(p.a)} ile x = ${N2(p.b)} arasında kalan TOPLAM (geometrik) alanı bulalım. Önce f'nin işaret değiştirdiği noktaları belirleyelim; sonra bu alanı işaretli integralle karşılaştıralım.`,
        `Let's find the TOTAL (geometric) area between the curve f(x) = ${u.eq} and the x-axis from x = ${N2(p.a)} to x = ${N2(p.b)}. First we find where f changes sign, then we compare the result with the signed integral.`);
    }
    return tx(`Bir deponun net doluş hızı r(t) = ${u.eq} (litre/saniye; t saniye, t = 0 başlangıç anından önceki zamanlar negatiftir). t = ${N2(p.a)} s ile t = ${N2(p.b)} s arasında depodaki suyun NET DEĞİŞİMİ kaç litredir? Bu aralıkta depoya giren ve çıkan suyu ayrı ayrı da bulabiliriz.`,
      `The net filling rate of a tank is r(t) = ${u.eq} (litres/second; t in seconds, times before the reference instant t = 0 are negative). What is the NET CHANGE of the water in the tank between t = ${N2(p.a)} s and t = ${N2(p.b)} s in litres? We can also find the water that enters and the water that leaves separately.`);
  }

  function solveSteps(p) {
    norm(p);
    const u = FUNS[p.fi];
    const T = totals(p);
    const s = [];
    const Fb = u.F(p.b), Fa = u.F(p.a);
    const sim = simpson(u.f, p.a, p.b, 600);
    const unitL = p.mode === 2;
    const U = unitL ? ' L' : '';
    s.push(tx(`── 1) Soruyu kuralım ──\nf(x) = ${u.eq} (${u.note()}). Aralık [${N2(p.a)}, ${N2(p.b)}]. İstenen: ${modeName(p.mode)}. Belirli integral ∫ₐᵇ f dx, eğri ile x-ekseni arasındaki İŞARETLİ alandır; f > 0 ise katkı pozitif, f < 0 ise negatiftir.`,
      `── 1) Set up the problem ──\nf(x) = ${u.eq} (${u.note()}). Interval [${N2(p.a)}, ${N2(p.b)}]. Asked: ${modeName(p.mode)}. The definite integral ∫ₐᵇ f dx is the SIGNED area between the curve and the x-axis: f > 0 contributes positively, f < 0 negatively.`));
    s.push(tx(`── 2) Ters türev (Temel Teorem, Kısım 2) ──\n${u.anti()}. Yani F(x) = ${u.Fs} (F' = f; fark alınacağı için +C yazmaya gerek kalmaz).`,
      `── 2) Antiderivative (Fundamental Theorem, Part 2) ──\n${u.anti()}. So F(x) = ${u.Fs} (F' = f; +C is not needed because we subtract).`));
    s.push(tx(`── 3) Sınırlarda değerlendirelim ──\nF(${N2(p.b)}) = ${N2(Fb)}   ve   F(${N2(p.a)}) = ${N2(Fa)}.`,
      `── 3) Evaluating at the limits ──\nF(${N2(p.b)}) = ${N2(Fb)}   and   F(${N2(p.a)}) = ${N2(Fa)}.`));
    s.push(tx(`── 4) İşaretli integral ──\n∫ₐᵇ f dx = F(b) − F(a) = ${N2(Fb)} − (${N2(Fa)}) = ${N2(Fb - Fa)}${U}.`,
      `── 4) The signed integral ──\n∫ₐᵇ f dx = F(b) − F(a) = ${N2(Fb)} − (${N2(Fa)}) = ${N2(Fb - Fa)}${U}.`));
    const inside = T.ps.length - 1;
    const pieceTr = T.ps.map((q, i) => `   ${i + 1}. parça [${N2(q.x1)}, ${N2(q.x2)}]: F(${N2(q.x2)}) − F(${N2(q.x1)}) = ${N2(q.v)} → ${q.v >= 0 ? 'eksenin ÜSTÜNDE (+)' : 'eksenin ALTINDA (−)'}`).join('\n');
    const pieceEn = T.ps.map((q, i) => `   piece ${i + 1} [${N2(q.x1)}, ${N2(q.x2)}]: F(${N2(q.x2)}) − F(${N2(q.x1)}) = ${N2(q.v)} → ${q.v >= 0 ? 'ABOVE the axis (+)' : 'BELOW the axis (−)'}`).join('\n');
    s.push(tx(`── 5) İşaret analizi ──\n(a, b) içinde f'nin işaret değiştirdiği nokta sayısı: ${inside}${inside ? ' (' + u.roots.filter((r) => r > p.a + 1e-9 && r < p.b - 1e-9).map(N2).join(', ') + ')' : ''}. Aralık bu noktalarda parçalanır:\n${pieceTr}`,
      `── 5) Sign analysis ──\nNumber of sign changes of f inside (a, b): ${inside}${inside ? ' (' + u.roots.filter((r) => r > p.a + 1e-9 && r < p.b - 1e-9).map(N2).join(', ') + ')' : ''}. The interval is split there:\n${pieceEn}`));
    s.push(tx(`── 6) Toplam (geometrik) alan ──\nHer parçanın MUTLAK değerini toplarız: ${T.ps.map((q) => N2(q.ab)).join(' + ')} = ${N2(T.total)}${U}${inside ? '' : ' (işaret değişimi yok → toplam alan = |işaretli integral|)'}.`,
      `── 6) Total (geometric) area ──\nWe add the ABSOLUTE value of each piece: ${T.ps.map((q) => N2(q.ab)).join(' + ')} = ${N2(T.total)}${U}${inside ? '' : ' (no sign change → total area = |signed integral|)'}.`));
    s.push(tx(`── 7) İşaretli ile toplam alanın ilişkisi ──\nÜstteki alan = ${N2(T.pos)}, alttaki alan = ${N2(T.neg)}. İşaretli = üst − alt = ${N2(T.pos)} − ${N2(T.neg)} = ${N2(T.signed)}; Toplam = üst + alt = ${N2(T.pos)} + ${N2(T.neg)} = ${N2(T.total)}. Fark: ${N2(T.total - Math.abs(T.signed))}${T.neg > 1e-9 && T.pos > 1e-9 ? ' (iptal olan kısım)' : ''}.`,
      `── 7) Signed versus total area ──\nArea above = ${N2(T.pos)}, area below = ${N2(T.neg)}. Signed = above − below = ${N2(T.pos)} − ${N2(T.neg)} = ${N2(T.signed)}; Total = above + below = ${N2(T.pos)} + ${N2(T.neg)} = ${N2(T.total)}. Difference: ${N2(T.total - Math.abs(T.signed))}${T.neg > 1e-9 && T.pos > 1e-9 ? ' (the part that cancels)' : ''}.`));
    if (unitL) {
      s.push(tx(`── 8) Net değişim yorumu ──\nr(t) litre/saniye cinsinden bir DEĞİŞİM HIZI olduğundan ∫ r dt bir miktardır: litre·(saniye) / saniye = litre. Depoya giren su = ${N2(T.pos)} L, çıkan su = ${N2(T.neg)} L, NET DEĞİŞİM = ${N2(T.signed)} L (${T.signed > 1e-9 ? 'depo dolmuştur' : T.signed < -1e-9 ? 'depo boşalmıştır' : 'değişim sıfır'}). A(t) = ∫ r dτ depodaki birikim değişimidir ve A'(${N2(p.b)}) = r(${N2(p.b)}) = ${N2(u.f(p.b))} L/s.`,
        `── 8) Reading it as net change ──\nSince r(t) is a RATE in litres/second, ∫ r dt is an amount: (litres/second)·seconds = litres. Water in = ${N2(T.pos)} L, water out = ${N2(T.neg)} L, NET CHANGE = ${N2(T.signed)} L (${T.signed > 1e-9 ? 'the tank has filled' : T.signed < -1e-9 ? 'the tank has emptied' : 'no change'}). A(t) = ∫ r dτ is the accumulated change and A'(${N2(p.b)}) = r(${N2(p.b)}) = ${N2(u.f(p.b))} L/s.`));
    } else {
      s.push(tx(`── 8) Birikim fonksiyonu olarak okuma ──\nA(x) = ∫ₐˣ f(t) dt dersek A(${N2(p.b)}) = ${N2(Fb - Fa)} olur ve A'(x) = f(x): x = ${N2(p.b)} noktasında A'nın eğimi f(${N2(p.b)}) = ${N2(u.f(p.b))}'dir. Grafikte mor eğri A(x)'tir; f > 0 olan yerde artar, f < 0 olan yerde azalır (taralı yeşil: +, kırmızı: −).`,
        `── 8) Reading it as an accumulation function ──\nWith A(x) = ∫ₐˣ f(t) dt we get A(${N2(p.b)}) = ${N2(Fb - Fa)} and A'(x) = f(x): at x = ${N2(p.b)} the slope of A is f(${N2(p.b)}) = ${N2(u.f(p.b))}. The purple curve in the graph is A(x); it rises where f > 0 and falls where f < 0 (shaded green: +, red: −).`));
    }
    s.push(tx(`── 9) Sayısal kontrol ──\nSimpson kuralı (600 dilim) ile ∫ₐᵇ f dx ≈ ${N2(sim)}; ters türevle bulunan ${N2(Fb - Fa)} ile uyuşuyor ✓. Cevap: ${p.mode === 0 ? 'işaretli alan' : p.mode === 1 ? 'toplam alan' : 'net değişim'} = ${N2(p.mode === 1 ? T.total : T.signed)}${U}.`,
      `── 9) Numerical check ──\nSimpson's rule (600 slices) gives ∫ₐᵇ f dx ≈ ${N2(sim)}, in agreement with the antiderivative value ${N2(Fb - Fa)} ✓. Answer: ${p.mode === 0 ? 'signed area' : p.mode === 1 ? 'total area' : 'net change'} = ${N2(p.mode === 1 ? T.total : T.signed)}${U}.`));
    return s;
  }

  function draw(canvas, p) {
    norm(p);
    const u = FUNS[p.fi];
    const f = safe(u.f);
    const acc = safe((x) => u.F(x) - u.F(p.a));
    let lo = 0, hi = 0;
    for (let i = 0; i <= 200; i++) {
      const x = DMIN + (DMAX - DMIN) * i / 200;
      const a = f(x), b = acc(x);
      if (isFinite(a)) { lo = Math.min(lo, a); hi = Math.max(hi, a); }
      if (isFinite(b)) { lo = Math.min(lo, b); hi = Math.max(hi, b); }
    }
    const pad = Math.max(0.5, (hi - lo) * 0.12);
    canvas.setViewport(DMIN, DMAX, lo - pad, hi + pad);
    const T = totals(p);
    T.ps.forEach((q) => {
      canvas.addFilledArea({ evaluator: f, xMin: q.x1, xMax: q.x2, color: rgba(q.v >= 0 ? canvas.green() : canvas.red(), 0.38), samples: 160 });
    });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    canvas.addFunction({ evaluator: acc, color: canvas.purple(), thickness: 2.5, label: `A(x) = ∫ f, ${tx('a\'dan', 'from a')}` });
    canvas.addGuideLine({ axis: 'vertical', position: p.a, color: canvas.gold(), label: `a = ${N2(p.a)}` });
    canvas.addGuideLine({ axis: 'vertical', position: p.b, color: canvas.orange(), label: `b = ${N2(p.b)}` });
    canvas.addMarker({ x: p.a, y: 0, color: canvas.gold(), radius: 6 });
    canvas.addMarker({ x: p.b, y: f(p.b), color: canvas.orange(), radius: 6, label: `f(b) = ${N2(u.f(p.b))}` });
    canvas.addMarker({ x: p.b, y: acc(p.b), color: canvas.purple(), shape: 'diamond', radius: 7, label: `A(b) = ${N2(T.signed)}` });
    u.roots.forEach((r) => { if (r > p.a + 1e-9 && r < p.b - 1e-9) canvas.addMarker({ x: r, y: 0, color: canvas.gray(), hollow: true, radius: 5 }); });
  }

  function concept(p) {
    const u = FUNS[p.fi];
    return tx('ALAN BİRİKİMİ: İŞARETLİ ALAN, TOPLAM ALAN, NET DEĞİŞİM', 'AREA ACCUMULATION: SIGNED AREA, TOTAL AREA, NET CHANGE') + '\n' + Help() + '\n\n' +
      tx('NET DEĞİŞİM TEOREMİ\nBir büyüklüğün değişim hızı f ise, [a,b] aralığındaki NET DEĞİŞİM ∫ₐᵇ f dx olur. Hız → konum değişimi (m), debi → hacim (L), güç → enerji (J). Giren ve çıkan miktarlar ayrı ayrı ∫f⁺ ve ∫f⁻ ile bulunabilir; net = giren − çıkan, toplam hareket = giren + çıkan.\n\nHAFIZA KURALI\n"Eksenin üstü artı, altı eksi." İşaretli alan net birikimi, toplam alan toplam hareketi verir.',
        'NET CHANGE THEOREM\nIf f is the rate of change of a quantity, the NET CHANGE over [a,b] is ∫ₐᵇ f dx. Velocity → change of position (m), flow → volume (L), power → energy (J). What goes in and what goes out are found separately with ∫f⁺ and ∫f⁻; net = in − out, total movement = in + out.\n\nMEMORY AID\n"Above the axis is plus, below is minus." Signed area gives the net accumulation, total area gives the total movement.') +
      '\n\n' + tx('ŞU ANKİ FONKSİYON', 'CURRENT FUNCTION') + '\n' + `f(x) = ${u.eq}  (${u.note()})`;
  }

  // ---- controls ----
  let fnSel = null, modeRg = null, sa = null, sb = null;
  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    const ratio = (v - reg.min) / (reg.max - reg.min);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }
  function createProblem(rng) {
    const fi = forced ? forced.fi : rng.nextInt(0, FUNS.length);
    const wantSign = rng.nextDouble() < 0.7 && FUNS[fi].roots.length > 0;
    let a, b;
    for (let tries = 0; tries < 30; tries++) {
      a = rng.nextInt(-4, 2);
      b = Math.min(5, a + rng.nextInt(2, 7));
      if (!wantSign || FUNS[fi].roots.some((r) => r > a + 0.1 && r < b - 0.1)) break;
    }
    const p = { fi, a, b, mode: forced ? forced.mode : rng.nextInt(0, 3) };
    if (fnSel) fnSel.refreshFromModel();
    if (modeRg) modeRg.refreshFromModel();
    return p;
  }

  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); return d; };
    lab(tx('Fonksiyon', 'Function'));
    fnSel = h.addSelect({
      options: FUNS.map((u, i) => ({ label: `f(x) = ${u.eq}`, value: i })),
      get: () => getProblem().fi, set: (v) => { getProblem().fi = Number(v); },
    });
    lab(tx('İstenen büyüklük', 'Quantity asked'));
    modeRg = h.addRadioGroup({
      name: 'areaMode',
      options: [{ label: tx('İşaretli alan (∫f)', 'Signed area (∫f)'), value: 0 }, { label: tx('Toplam alan (∫|f|)', 'Total area (∫|f|)'), value: 1 }, { label: tx('Net değişim (birimli)', 'Net change (with units)'), value: 2 }],
      get: () => getProblem().mode, set: (v) => { getProblem().mode = Number(v); },
    });
    sa = h.addSlider({ caption: tx('Alt sınır a', 'Lower limit a'), min: DMIN, max: DMAX - 0.5, step: 0.5,
      get: () => getProblem().a, set: (v) => { const p = getProblem(); p.a = v; norm(p); syncReg(sb); } });
    sb = h.addSlider({ caption: tx('Üst sınır b (x) - alanı taramak için sürükleyebiliriz', 'Upper limit b (x) - we can drag it to sweep the area'), min: DMIN + 0.5, max: DMAX, step: 0.5,
      get: () => getProblem().b, set: (v) => { const p = getProblem(); p.b = v; if (p.b < p.a + 0.5) p.a = p.b - 0.5; norm(p); syncReg(sa); } });
  }

  const makeMode = (m) => (rng) => {
    forced = { fi: rng.nextInt(0, FUNS.length), mode: m };
    try { return createProblem(rng); } finally { forced = null; }
  };

  Topics.register('integrals', {
    id: 'areaAccumulation',
    tabTitle: () => tx('Alan Birikimi', 'Area as Accumulation'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { norm(p); const u = FUNS[p.fi]; const m = (p.a + p.b) / 2; const y = u.f(m) / 2; return { x: m, y: Number.isFinite(y) ? y : 0 }; },
    buildControls,
    links: [
      { match: /^(İŞARETLİ ALAN|SIGNED AREA)$/, make: makeMode(0) },
      { match: /^(YÖNTEM \(toplam alanı bulma\)|METHOD \(total area\))$/, make: makeMode(1) },
      { match: /^(NET DEĞİŞİM TEOREMİ|NET CHANGE THEOREM)$/, make: makeMode(2) },
    ],
    _scenarioCount: () => FUNS.length * 3,
    _setScenario: (i) => { forced = { fi: i % FUNS.length, mode: Math.floor(i / FUNS.length) }; },
  });
})();
