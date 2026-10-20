// Ported from Modules/Integrals/RiemannSumsControl.vb: approximate ∫ₐᵇ f dx with n rectangles (left / right / midpoint) or
// trapezoids, draw the bars, compare with the exact value and explain over/under-estimation and the convergence rate.
// The VB help text is the "konu anlatımı". The VB timer ("play") is replaced by the n slider (no timers in the HTML framework).
// problem = { fi, a, b, n, method: 0 left | 1 right | 2 midpoint | 3 trapezoid }.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v);
  // up to 3 decimals (step widths, sample points) so that the arithmetic shown in the steps is not hidden by rounding
  const N3 = (v) => { let t = v.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); return t === '-0' ? '0' : t; };
  const P = (v) => (v < 0 ? `(${N2(v)})` : N2(v));
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  function rgba(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return { base: hex, alpha: a };
    return `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})`;
  }
  let forced = null;
  const DMIN = -5, DMAX = 5, NMAX = 80;

  // f, f', f'', exact antiderivative F (so the "true value" is exact), and the working text
  const FUNS = [
    { eq: '0.25x² + 0.5', f: (x) => 0.25 * x * x + 0.5, d1: (x) => 0.5 * x, d2: () => 0.5, F: (x) => x * x * x / 12 + 0.5 * x, Fs: 'x³/12 + 0.5x' },
    { eq: '3 − 0.2x²', f: (x) => 3 - 0.2 * x * x, d1: (x) => -0.4 * x, d2: () => -0.4, F: (x) => 3 * x - x * x * x / 15, Fs: '3x − x³/15' },
    { eq: '1.8·sin x + 2', f: (x) => 1.8 * Math.sin(x) + 2, d1: (x) => 1.8 * Math.cos(x), d2: (x) => -1.8 * Math.sin(x), F: (x) => -1.8 * Math.cos(x) + 2 * x, Fs: '−1.8·cos x + 2x' },
    { eq: '0.3x + 3', f: (x) => 0.3 * x + 3, d1: () => 0.3, d2: () => 0, F: (x) => 0.15 * x * x + 3 * x, Fs: '0.15x² + 3x', linear: true },
    { eq: '0.03x³ − 0.3x + 3', f: (x) => 0.03 * x * x * x - 0.3 * x + 3, d1: (x) => 0.09 * x * x - 0.3, d2: (x) => 0.18 * x, F: (x) => 0.0075 * x * x * x * x - 0.15 * x * x + 3 * x, Fs: '0.0075x⁴ − 0.15x² + 3x' },
    { eq: 'e^(x/3)', f: (x) => Math.exp(x / 3), d1: (x) => Math.exp(x / 3) / 3, d2: (x) => Math.exp(x / 3) / 9, F: (x) => 3 * Math.exp(x / 3), Fs: '3·e^(x/3)' },
  ];
  const METHODS = () => [tx('Sol uç nokta', 'Left endpoint'), tx('Sağ uç nokta', 'Right endpoint'), tx('Orta nokta', 'Midpoint'), tx('Yamuk (trapez)', 'Trapezoidal')];
  const METHODS_LONG = (m) => [tx('SOL uç nokta toplamı', 'LEFT-endpoint sum'), tx('SAĞ uç nokta toplamı', 'RIGHT-endpoint sum'), tx('ORTA nokta toplamı', 'MIDPOINT sum'), tx('YAMUK (trapez) toplamı', 'TRAPEZOID sum')][m];

  function Help() { return tx("FİKİR" + "\n" + "Eğri altındaki alanı, alanı bilinen dikdörtgenlerle yaklaşık hesaplarız; dikdörtgen sayısı arttıkça yaklaşım gerçek alana yakınsar." + "\n" + "\n" + "KURULUM" + "\n" + "[a,b] aralığını n eşit parçaya bölelim: Δx = (b − a)/n, uç noktalar xᵢ = a + iΔx (i = 0…n)." + "\n" + "\n" + "TOPLAM TÜRLERİ" + "\n" + "• SOL toplam:  Lₙ = Δx·Σ f(xᵢ₋₁)   (i = 1…n)" + "\n" + "• SAĞ toplam:  Rₙ = Δx·Σ f(xᵢ)" + "\n" + "• ORTA NOKTA:  Mₙ = Δx·Σ f((xᵢ₋₁ + xᵢ)/2)" + "\n" + "• TRAPEZ:      Tₙ = (Lₙ + Rₙ)/2" + "\n" + "\n" + "SINIR (TANIM)" + "\n" + "  ∫ₐᵇ f(x) dx = lim(n→∞) Σ f(xᵢ*)·Δx" + "\n" + "f sürekli ise (hatta parçalı sürekli) limit vardır ve seçilen örnek noktasına bağlı değildir." + "\n" + "\n" + "YÖNTEM" + "\n" + "1. Δx = (b − a)/n değerini hesaplarız." + "\n" + "2. Örnek noktalarını seçeriz (sol uç, sağ uç ya da orta nokta)." + "\n" + "3. Her noktada f değerini hesaplarız." + "\n" + "4. Değerleri toplar ve Δx ile çarparız." + "\n" + "5. n'i artırarak yakınsamayı gözlemleriz." + "\n" + "\n" + "SOL / SAĞ NE ZAMAN FAZLA YA DA EKSİK?" + "\n" + "• f ARTAN: Sol toplam EKSİK (alt toplam), Sağ toplam FAZLA (üst toplam)." + "\n" + "• f AZALAN: Sol FAZLA, Sağ EKSİK." + "\n" + "• f yukarı bükey ise orta nokta toplamı eksik, trapez fazla tahmin eder (aşağı bükeyde tersi)." + "\n" + "\n" + "HATA" + "\n" + "Sol/sağ hata ≈ 1/n ile (doğrusal) azalır; orta nokta ve trapez hatası ≈ 1/n² ile azalır, bu yüzden daha verimlidir." + "\n" + "\n" + "TUZAKLAR" + "\n" + "• Toplamda n terim vardır (n+1 değil); Δx ile çarpmayı atlamamak gerekir." + "\n" + "• f'nin negatif olduğu parçalar İŞARETLİ alan verir." + "\n" + "• Δx = (b − a)/n ile n birbirine karıştırılmamalıdır." + "\n" + "\n" + "MİNİ ÖRNEK" + "\n" + "f = x², [0,2], n = 4, Δx = 0,5. Sol: 0,5·(0 + 0,25 + 1 + 2,25) = 1,75. Sağ: 0,5·(0,25 + 1 + 2,25 + 4) = 3,75. Gerçek 8/3 ≈ 2,67 arada. f artan olduğundan sol < gerçek < sağ. ✓", "IDEA" + "\n" + "We can estimate the area under a curve with rectangles of known area; as the number of rectangles grows, the estimate converges to the true area." + "\n" + "\n" + "SETUP" + "\n" + "Let's split [a,b] into n equal pieces: Δx = (b − a)/n, endpoints xᵢ = a + iΔx (i = 0…n)." + "\n" + "\n" + "TYPES OF SUMS" + "\n" + "• LEFT sum:  Lₙ = Δx·Σ f(xᵢ₋₁)   (i = 1…n)" + "\n" + "• RIGHT sum:  Rₙ = Δx·Σ f(xᵢ)" + "\n" + "• MIDPOINT:  Mₙ = Δx·Σ f((xᵢ₋₁ + xᵢ)/2)" + "\n" + "• TRAPEZOID:  Tₙ = (Lₙ + Rₙ)/2" + "\n" + "\n" + "THE LIMIT (DEFINITION)" + "\n" + "  ∫ₐᵇ f(x) dx = lim(n→∞) Σ f(xᵢ*)·Δx" + "\n" + "If f is continuous (even piecewise continuous) the limit exists and does not depend on the sample point chosen." + "\n" + "\n" + "METHOD" + "\n" + "1. We compute Δx = (b − a)/n." + "\n" + "2. We choose the sample points (left end, right end or midpoint)." + "\n" + "3. We evaluate f at each." + "\n" + "4. We add the values and multiply by Δx." + "\n" + "5. We increase n and watch the convergence." + "\n" + "\n" + "WHEN IS LEFT / RIGHT TOO BIG OR TOO SMALL?" + "\n" + "• f INCREASING: Left sum UNDERestimates (lower sum), Right sum OVERestimates (upper sum)." + "\n" + "• f DECREASING: Left OVER, Right UNDER." + "\n" + "• If f is concave up the midpoint sum underestimates and the trapezoid overestimates (reversed for concave down)." + "\n" + "\n" + "ERROR" + "\n" + "Left/right error shrinks like 1/n (linear); midpoint and trapezoid error shrink like 1/n², so they are more efficient." + "\n" + "\n" + "PITFALLS" + "\n" + "• The sum has n terms, not n+1; it helps to remember to multiply by Δx." + "\n" + "• Parts where f is negative contribute SIGNED area." + "\n" + "• It helps to keep Δx = (b − a)/n and n apart." + "\n" + "\n" + "MINI EXAMPLE" + "\n" + "f = x², [0,2], n = 4, Δx = 0.5. Left: 0.5·(0 + 0.25 + 1 + 2.25) = 1.75. Right: 0.5·(0.25 + 1 + 2.25 + 4) = 3.75. True 8/3 ≈ 2.67 lies between. Since f is increasing, left < true < right. ✓"); }

  function riemann(f, a, b, n, m) {
    const w = (b - a) / n;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const l = a + i * w, r = l + w;
      s += m === 0 ? f(l) : m === 1 ? f(r) : m === 2 ? f((l + r) / 2) : (f(l) + f(r)) / 2;
    }
    return s * w;
  }
  function norm(p) {
    p.n = Math.max(1, Math.min(NMAX, Math.round(p.n)));
    p.a = Math.max(DMIN, Math.min(DMAX - 0.5, p.a));
    p.b = Math.max(p.a + 0.5, Math.min(DMAX, p.b));
    if (p.b - p.a < 0.5 - 1e-9) p.a = p.b - 0.5;
    return p;
  }
  // sign analysis of f' and f'' over [a, b]: +1 (>= 0 everywhere), -1 (<= 0 everywhere), 0 (mixed); both true for zero
  function signInfo(g, a, b) {
    let ge = true, le = true;
    for (let i = 0; i <= 400; i++) {
      const v = g(a + (b - a) * i / 400);
      if (v < -1e-9) ge = false;
      if (v > 1e-9) le = false;
    }
    return { ge, le };
  }
  // returns { kind: 'over'|'under'|'exact'|'unknown', why: [tr, en] }
  function rule(u, p) {
    const inc = signInfo(u.d1, p.a, p.b), cx = signInfo(u.d2, p.a, p.b);
    if (p.method === 0 || p.method === 1) {
      if (inc.ge && inc.le) return { kind: 'exact', tr: "f sabit olduğundan sol/sağ toplam tam değeri verir.", en: 'f is constant, so the left/right sum is exact.' };
      if (inc.ge) return p.method === 0
        ? { kind: 'under', tr: "f bu aralıkta ARTAN: sol toplam her şeridin en alçak noktasını alır → EKSİK tahmin (alt toplam).", en: 'f is INCREASING on this interval: the left sum takes the lowest point of every strip → UNDER-estimate (lower sum).' }
        : { kind: 'over', tr: "f bu aralıkta ARTAN: sağ toplam her şeridin en yüksek noktasını alır → FAZLA tahmin (üst toplam).", en: 'f is INCREASING on this interval: the right sum takes the highest point of every strip → OVER-estimate (upper sum).' };
      if (inc.le) return p.method === 0
        ? { kind: 'over', tr: "f bu aralıkta AZALAN: sol toplam her şeridin en yüksek noktasını alır → FAZLA tahmin.", en: 'f is DECREASING on this interval: the left sum takes the highest point of every strip → OVER-estimate.' }
        : { kind: 'under', tr: "f bu aralıkta AZALAN: sağ toplam her şeridin en alçak noktasını alır → EKSİK tahmin.", en: 'f is DECREASING on this interval: the right sum takes the lowest point of every strip → UNDER-estimate.' };
      return { kind: 'unknown', tr: "f bu aralıkta ne hep artan ne hep azalan; basit kural işaret vermez, hatanın işareti pozitif ve negatif şerit hatalarının bileşkesidir.", en: 'f is neither increasing nor decreasing throughout; the simple rule gives no sign — the error is the net of positive and negative strip errors.' };
    }
    if (cx.ge && cx.le) return { kind: 'exact', tr: "f doğrusal olduğundan (f″ = 0) orta nokta ve yamuk toplamı tam değeri verir.", en: 'f is linear (f″ = 0), so the midpoint and trapezoid sums are exact.' };
    if (cx.ge) return p.method === 2
      ? { kind: 'under', tr: "f YUKARI bükey (f″ ≥ 0): orta nokta teğeti eğrinin altında kalır → EKSİK tahmin.", en: 'f is CONCAVE UP (f″ ≥ 0): the midpoint tangent lies below the curve → UNDER-estimate.' }
      : { kind: 'over', tr: "f YUKARI bükey (f″ ≥ 0): kiriş eğrinin üstünde kalır → yamuk FAZLA tahmin eder.", en: 'f is CONCAVE UP (f″ ≥ 0): the chord lies above the curve → the trapezoid OVER-estimates.' };
    if (cx.le) return p.method === 2
      ? { kind: 'over', tr: "f AŞAĞI bükey (f″ ≤ 0): orta nokta teğeti eğrinin üstünde kalır → FAZLA tahmin.", en: 'f is CONCAVE DOWN (f″ ≤ 0): the midpoint tangent lies above the curve → OVER-estimate.' }
      : { kind: 'under', tr: "f AŞAĞI bükey (f″ ≤ 0): kiriş eğrinin altında kalır → yamuk EKSİK tahmin eder.", en: 'f is CONCAVE DOWN (f″ ≤ 0): the chord lies below the curve → the trapezoid UNDER-estimates.' };
    return { kind: 'unknown', tr: "f bu aralıkta bükeylik değiştiriyor (f″ işaret değiştiriyor); basit kural işaret vermez.", en: 'f changes concavity on this interval (f″ changes sign); the simple rule gives no sign.' };
  }

  function nodes(p) {
    const w = (p.b - p.a) / p.n, xs = [];
    for (let i = 0; i < p.n; i++) {
      const l = p.a + i * w, r = l + w;
      xs.push(p.method === 0 ? l : p.method === 1 ? r : p.method === 2 ? (l + r) / 2 : [l, r]);
    }
    return xs;
  }
  function listTxt(arr, fmt) {
    if (arr.length <= 6) return arr.map(fmt).join(', ');
    return arr.slice(0, 4).map(fmt).join(', ') + ', …, ' + fmt(arr[arr.length - 1]);
  }

  function problemStatement(p) {
    norm(p);
    const u = FUNS[p.fi];
    return tx(`f(x) = ${u.eq} fonksiyonunun [${N2(p.a)}, ${N2(p.b)}] aralığındaki ∫ f(x) dx belirli integralini n = ${p.n} parçalı ${METHODS_LONG(p.method)} ile yaklaşık olarak hesaplayabilir miyiz? Sonra yaklaşımı gerçek (tam) değerle karşılaştıralım: hata kaç olur, yaklaşım FAZLA mı EKSİK mi, ve n iki katına çıkınca hata nasıl değişir?`,
      `Let's approximate the definite integral ∫ f(x) dx of f(x) = ${u.eq} over [${N2(p.a)}, ${N2(p.b)}] with the ${METHODS_LONG(p.method)} using n = ${p.n} pieces. Then we compare with the exact value: what is the error, is the approximation an OVER- or UNDER-estimate, and how does the error change when n is doubled?`);
  }

  function solveSteps(p) {
    norm(p);
    const u = FUNS[p.fi];
    const w = (p.b - p.a) / p.n;
    const S = riemann(u.f, p.a, p.b, p.n, p.method);
    const I = u.F(p.b) - u.F(p.a);
    const err = S - I;
    const rl = rule(u, p);
    const S2 = riemann(u.f, p.a, p.b, 2 * p.n, p.method), err2 = S2 - I;
    const xs = nodes(p);
    const s = [];
    s.push(tx(`── 1) Soruyu kuralım ──\nf(x) = ${u.eq}, [a, b] = [${N2(p.a)}, ${N2(p.b)}], n = ${p.n}, yöntem: ${METHODS_LONG(p.method)}. Parça genişliği Δx = (b − a)/n = (${N2(p.b)} − ${P(p.a)})/${p.n} = ${N3(w)}. Uç noktalar xᵢ = a + iΔx.`,
      `── 1) Set up the problem ──\nf(x) = ${u.eq}, [a, b] = [${N2(p.a)}, ${N2(p.b)}], n = ${p.n}, method: ${METHODS_LONG(p.method)}. Strip width Δx = (b − a)/n = (${N2(p.b)} − ${P(p.a)})/${p.n} = ${N3(w)}. Endpoints xᵢ = a + iΔx.`));
    const ruleTr = ['Lₙ = Δx·Σ f(xᵢ₋₁): her şeridin SOL ucunda yükseklik', 'Rₙ = Δx·Σ f(xᵢ): her şeridin SAĞ ucunda yükseklik', 'Mₙ = Δx·Σ f((xᵢ₋₁ + xᵢ)/2): orta noktada yükseklik', 'Tₙ = Δx·Σ [f(xᵢ₋₁) + f(xᵢ)]/2 = (Lₙ + Rₙ)/2: iki uç yüksekliğinin ortalaması'][p.method];
    const ruleEn = ['Lₙ = Δx·Σ f(xᵢ₋₁): height at the LEFT end of every strip', 'Rₙ = Δx·Σ f(xᵢ): height at the RIGHT end of every strip', 'Mₙ = Δx·Σ f((xᵢ₋₁ + xᵢ)/2): height at the midpoint', 'Tₙ = Δx·Σ [f(xᵢ₋₁) + f(xᵢ)]/2 = (Lₙ + Rₙ)/2: average of the two end heights'][p.method];
    const pts = p.method === 3 ? xs.map((q) => q[0]).concat([xs[xs.length - 1][1]]) : xs;
    s.push(tx(`── 2) Örnek noktaları ──\nFormül: ${ruleTr}.\nKullandığımız x değerleri (${pts.length} adet): ${listTxt(pts, N3)}.`,
      `── 2) Sample points ──\nFormula: ${ruleEn}.\nx values used (${pts.length} of them): ${listTxt(pts, N3)}.`));
    const vals = pts.map(u.f);
    s.push(tx(`── 3) Yükseklikleri hesaplayalım ──\nf(x) değerleri: ${listTxt(vals, N2)}.`, `── 3) Computing the heights ──\nValues of f(x): ${listTxt(vals, N2)}.`));
    let sumTr, sumEn;
    if (p.method === 3) {
      const Ls = riemann(u.f, p.a, p.b, p.n, 0), Rs = riemann(u.f, p.a, p.b, p.n, 1);
      sumTr = `Sol toplam Lₙ = ${N2(Ls)}, sağ toplam Rₙ = ${N2(Rs)}; Tₙ = (Lₙ + Rₙ)/2 = (${N2(Ls)} + ${N2(Rs)})/2 = ${N2(S)}.`;
      sumEn = `Left sum Lₙ = ${N2(Ls)}, right sum Rₙ = ${N2(Rs)}; Tₙ = (Lₙ + Rₙ)/2 = (${N2(Ls)} + ${N2(Rs)})/2 = ${N2(S)}.`;
    } else {
      const tot = vals.reduce((x, y) => x + y, 0);
      sumTr = `Σ f = ${N2(tot)}  ⇒  Sₙ = Δx·Σ f = ${N3(w)}·${N2(tot)} = ${N2(S)}.`;
      sumEn = `Σ f = ${N2(tot)}  ⇒  Sₙ = Δx·Σ f = ${N3(w)}·${N2(tot)} = ${N2(S)}.`;
    }
    s.push(tx(`── 4) Toplam ──\n${sumTr}`, `── 4) The sum ──\n${sumEn}`));
    s.push(tx(`── 5) Gerçek değer (Temel Teorem) ──\nF(x) = ${u.Fs}. ∫ₐᵇ f dx = F(b) − F(a) = ${N2(u.F(p.b))} − (${N2(u.F(p.a))}) = ${N2(I)}.`,
      `── 5) Exact value (Fundamental Theorem) ──\nF(x) = ${u.Fs}. ∫ₐᵇ f dx = F(b) − F(a) = ${N2(u.F(p.b))} − (${N2(u.F(p.a))}) = ${N2(I)}.`));
    const rel = Math.abs(I) > 1e-12 ? 100 * Math.abs(err) / Math.abs(I) : 0;
    s.push(tx(`── 6) Hata ──\nSₙ − I = ${N2(S)} − ${N2(I)} = ${N2(err)}. Mutlak hata = ${N2(Math.abs(err))}, bağıl hata = %${N2(rel)}.`,
      `── 6) Error ──\nSₙ − I = ${N2(S)} − ${N2(I)} = ${N2(err)}. Absolute error = ${N2(Math.abs(err))}, relative error = ${N2(rel)}%.`));
    const concl = Math.abs(err) < 5e-3 ? { tr: 'Yaklaşım tam değere (2 ondalık basamağa kadar) eşit.', en: 'The approximation equals the exact value (to 2 decimals).' }
      : (rl.kind === 'unknown' ? { tr: `Hesaplanan işaret: ${err > 0 ? 'FAZLA' : 'EKSİK'} tahmin.`, en: `Computed sign: ${err > 0 ? 'OVER' : 'UNDER'}-estimate.` }
        : { tr: `Sonuç: ${err > 0 ? 'FAZLA' : 'EKSİK'} tahmin (Sₙ − I ${err > 0 ? '> 0' : '< 0'}) ✓.`, en: `Result: ${err > 0 ? 'OVER' : 'UNDER'}-estimate (Sₙ − I ${err > 0 ? '> 0' : '< 0'}) ✓.` });
    s.push(tx(`── 7) FAZLA mı, EKSİK mi? ──\n${rl.tr}\n${concl.tr}`, `── 7) Over- or under-estimate? ──\n${rl.en}\n${concl.en}`));
    const ratio = Math.abs(err2) > 1e-9 && Math.abs(err) > 1e-9 ? Math.abs(err) / Math.abs(err2) : null;
    const expected = p.method <= 1 ? 2 : 4;
    s.push(tx(`── 8) n iki katına çıkarsa ──\nn = ${2 * p.n} için Sₙ = ${N2(S2)}, hata = ${N2(err2)}. ${ratio === null ? 'Hata (neredeyse) sıfır.' : `Hata oranı ≈ ${N2(ratio)} (kuram: ${p.method <= 1 ? 'sol/sağ hata ≈ 1/n → oran ≈ 2' : 'orta nokta/trapez hata ≈ 1/n² → oran ≈ 4'}).`}`,
      `── 8) Doubling n ──\nFor n = ${2 * p.n}: Sₙ = ${N2(S2)}, error = ${N2(err2)}. ${ratio === null ? 'The error is (almost) zero.' : `Error ratio ≈ ${N2(ratio)} (theory: ${p.method <= 1 ? 'left/right error ≈ 1/n → ratio ≈ 2' : 'midpoint/trapezoid error ≈ 1/n² → ratio ≈ 4'}).`}`));
    s.push(tx(`── 9) Yorum ──\nn büyüdükçe şeritler incelir ve Sₙ → ∫ₐᵇ f dx (Riemann toplamının limiti = belirli integral). Burada ${p.n} parça ile mutlak hata ${N2(Math.abs(err))}, bağıl hata kabaca %${N2(Math.abs(err) / Math.max(Math.abs(I), 1e-9) * 100)}. Orta nokta ve trapez, aynı n için sol/sağ toplamlardan genellikle çok daha doğrudur.`,
      `── 9) Interpretation ──\nAs n grows the strips get thinner and Sₙ → ∫ₐᵇ f dx (the limit of Riemann sums is the definite integral). Here, with ${p.n} pieces, the absolute error is ${N2(Math.abs(err))}, roughly ${N2(Math.abs(err) / Math.max(Math.abs(I), 1e-9) * 100)}%. For the same n the midpoint and trapezoid sums are usually far more accurate than the left/right sums.`));
    return s;
  }

  function draw(canvas, p) {
    norm(p);
    const u = FUNS[p.fi];
    const f = safe(u.f);
    let hi = 0;
    for (let i = 0; i <= 200; i++) { const v = f(DMIN + (DMAX - DMIN) * i / 200); if (isFinite(v)) hi = Math.max(hi, v); }
    canvas.setViewport(DMIN, DMAX, -1, Math.max(8, hi + 1.5));
    canvas.addFilledArea({ evaluator: f, xMin: p.a, xMax: p.b, color: rgba(canvas.accent(), 0.12), samples: 200 });
    const w = (p.b - p.a) / p.n;
    const barCol = canvas.orange();
    for (let i = 0; i < p.n; i++) {
      const l = p.a + i * w, r = l + w;
      let bar;
      if (p.method === 3) {
        const hl = u.f(l), hr = u.f(r);
        bar = (x) => hl + (hr - hl) * ((x - l) / w);
      } else {
        const hgt = p.method === 0 ? u.f(l) : p.method === 1 ? u.f(r) : u.f((l + r) / 2);
        bar = () => hgt;
      }
      canvas.addFilledArea({ evaluator: safe(bar), xMin: l, xMax: r, color: rgba(barCol, 0.4), samples: 4 });
      canvas.addSegment({ x1: l, y1: 0, x2: l, y2: bar(l), color: barCol, thickness: 1 });
      canvas.addSegment({ x1: r, y1: 0, x2: r, y2: bar(r), color: barCol, thickness: 1 });
      canvas.addSegment({ x1: l, y1: bar(l), x2: r, y2: bar(r), color: barCol, thickness: 1.5 });
    }
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    const S = riemann(u.f, p.a, p.b, p.n, p.method), I = u.F(p.b) - u.F(p.a);
    canvas.addGuideLine({ axis: 'vertical', position: p.a, color: canvas.gold(), label: `a = ${N2(p.a)}` });
    canvas.addGuideLine({ axis: 'vertical', position: p.b, color: canvas.gold(), label: `b = ${N2(p.b)}` });
    canvas.addMarker({ x: (p.a + p.b) / 2, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: `Sₙ = ${N2(S)}   I = ${N2(I)}` });
  }

  function concept(p) {
    const u = FUNS[p.fi];
    return tx('RİEMANN TOPLAMLARI', 'RIEMANN SUMS') + '\n' + Help() + '\n\n' +
      tx('HAFIZA KURALI\n"Artanda sol az, sağ çok." Artan fonksiyonda: Sol ≤ Gerçek ≤ Sağ. Orta nokta ve trapez, hatayı ters yönde yapar ve gerçek değer ikisinin arasındadır (yukarı bükey: Orta ≤ Gerçek ≤ Trapez).\n\nÖZEL DURUMLAR\n• Doğrusal f için orta nokta ve trapez TAM sonucu verir.\n• Sabit f için her yöntem tamdır.\n• f işaret değiştirirse toplam İŞARETLİ alanı yaklaşıklar.\n• Hata sınırları: sol/sağ için |E| ≤ (b − a)²·max|f′|/(2n); orta nokta için |E| ≤ (b − a)³·max|f″|/(24n²), trapez için |E| ≤ (b − a)³·max|f″|/(12n²).',
        'MEMORY AID\n"On an increasing function the left is low, the right is high." For increasing f: Left ≤ Exact ≤ Right. Midpoint and trapezoid err in opposite directions and the exact value lies between them (concave up: Midpoint ≤ Exact ≤ Trapezoid).\n\nSPECIAL CASES\n• For linear f the midpoint and trapezoid sums are EXACT.\n• For constant f every method is exact.\n• If f changes sign the sum approximates the SIGNED area.\n• Error order: left/right |E| ≤ (b − a)²·max|f′|/(2n); midpoint |E| ≤ (b − a)³·max|f″|/(24n²), trapezoid |E| ≤ (b − a)³·max|f″|/(12n²).') +
      '\n\n' + tx('ŞU ANKİ FONKSİYON', 'CURRENT FUNCTION') + '\n' + `f(x) = ${u.eq}`;
  }

  // ---- controls ----
  let fnSel = null, methRg = null, sa = null, sb = null, sn = null;
  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    const ratio = (v - reg.min) / (reg.max - reg.min);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }
  function createProblem(rng) {
    const fi = forced ? forced.fi : rng.nextInt(0, FUNS.length);
    const n = forced ? forced.n : rng.pick([2, 3, 4, 5, 6, 8, 10]);
    const wChoices = [0.5, 1, 1.5, 2].filter((w) => w * n <= 9 && w * n >= 1.5);
    const w = wChoices.length ? rng.pick(wChoices) : 0.5;
    const span = Math.max(1, Math.min(9, w * n));
    const a = rng.nextInt(-5, Math.floor(5 - span) + 1);
    const b = a + span;
    const p = { fi, a, b, n, method: forced ? forced.method : rng.nextInt(0, 4) };
    if (fnSel) fnSel.refreshFromModel();
    if (methRg) methRg.refreshFromModel();
    return p;
  }

  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); return d; };
    lab(tx('Fonksiyon', 'Function'));
    fnSel = h.addSelect({
      options: FUNS.map((u, i) => ({ label: `f(x) = ${u.eq}`, value: i })),
      get: () => getProblem().fi, set: (v) => { getProblem().fi = Number(v); },
    });
    lab(tx('Yaklaşım yöntemi', 'Approximation method'));
    methRg = h.addRadioGroup({
      name: 'rsMethod',
      options: METHODS().map((label, value) => ({ label, value })),
      get: () => getProblem().method, set: (v) => { getProblem().method = Number(v); },
    });
    sa = h.addSlider({ caption: tx('Aralık başlangıcı (a)', 'Interval start (a)'), min: DMIN, max: DMAX - 0.5, step: 0.5,
      get: () => getProblem().a, set: (v) => { const p = getProblem(); p.a = v; norm(p); syncReg(sb); } });
    sb = h.addSlider({ caption: tx('Aralık sonu (b)', 'Interval end (b)'), min: DMIN + 0.5, max: DMAX, step: 0.5,
      get: () => getProblem().b, set: (v) => { const p = getProblem(); p.b = v; if (p.b < p.a + 0.5) p.a = p.b - 0.5; norm(p); syncReg(sa); } });
    sn = h.addSlider({ caption: tx('Dikdörtgen sayısı (n)', 'Number of rectangles (n)'), min: 1, max: NMAX, step: 1,
      get: () => getProblem().n, set: (v) => { getProblem().n = Math.round(v); } });
  }

  const makeSum = (method, nPool) => (rng) => {
    forced = { fi: rng.nextInt(0, FUNS.length), method, n: rng.pick(nPool || [2, 3, 4, 5, 6, 8, 10]) };
    try { return createProblem(rng); } finally { forced = null; }
  };

  Topics.register('integrals', {
    id: 'riemannSums',
    tabTitle: () => tx('Riemann Toplamları', 'Riemann Sums'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { norm(p); const u = FUNS[p.fi]; const m = (p.a + p.b) / 2; const y = u.f(m) / 2; return { x: m, y: Number.isFinite(y) ? y : 0 }; },
    buildControls,
    _test: { FUNS, riemann, norm }, // numeric self-checks (tests/)
    challenge: {
      prompt: (p) => { norm(p); const u = FUNS[p.fi]; return tx(`f(x) = ${u.eq} fonksiyonu için [${N2(p.a)}, ${N2(p.b)}] aralığında n = ${p.n} parça ile ${METHODS_LONG(p.method)} yaklaşık değeri kaçtır? Hesap makinesiyle ya da elle hesaplayıp 2 ondalık basamakla yazalım.`, `For f(x) = ${u.eq} on [${N2(p.a)}, ${N2(p.b)}] with n = ${p.n} pieces, what is the ${METHODS_LONG(p.method)}? Let's compute it by hand or with a calculator and type it to 2 decimals.`); },
      target: (p) => { norm(p); return riemann(FUNS[p.fi].f, p.a, p.b, p.n, p.method); },
      tol: (p) => { norm(p); return Math.max(0.02, 0.005 * Math.abs(riemann(FUNS[p.fi].f, p.a, p.b, p.n, p.method))); },
      hint: (p, g) => { norm(p); const t = riemann(FUNS[p.fi].f, p.a, p.b, p.n, p.method); return tx(g > t ? 'Tahminimiz biraz büyük.' : 'Tahminimiz biraz küçük.', g > t ? 'Our guess is a bit too large.' : 'Our guess is a bit too small.') + ' ' + tx(`Parça genişliği Δx = ${N2((p.b - p.a) / p.n)}.`, `The piece width is Δx = ${N2((p.b - p.a) / p.n)}.`); },
    },
    links: [
      { match: /^• (SOL toplam|LEFT sum):/, make: makeSum(0) },
      { match: /^• (SAĞ toplam|RIGHT sum):/, make: makeSum(1) },
      { match: /^• (ORTA NOKTA|MIDPOINT):/, make: makeSum(2) },
      { match: /^• (TRAPEZ|TRAPEZOID):/, make: makeSum(3) },
      { match: /^(SINIR \(TANIM\)|THE LIMIT \(DEFINITION\))$/, make: (rng) => makeSum(rng.nextInt(0, 4), [20, 30, 40])(rng) },
    ],
    _scenarioCount: () => FUNS.length * 4,
    _setScenario: (i) => { forced = { fi: i % FUNS.length, method: Math.floor(i / FUNS.length), n: 1 + (i * 7) % 40 }; },
  });
})();
