// Ported from Modules/Integrals/FundamentalTheoremControl.vb: the Fundamental Theorem of Calculus. The accumulation function
// A(x) = ∫ₐˣ f(t) dt is drawn next to f (the VB tab used two stacked canvases, here one canvas shows both), a slider moves x,
// and the slope of A at x is compared with the height of f. Modes: Part 1 (A' = f), Part 2 (∫ₐᵇ f = F(b) − F(a)), mode 3 both limits variable,
// and the chain-rule form d/dx ∫ₐ^{kx} f = k·f(kx). The VB help text is the "konu anlatımı".
// problem = { fi, a, x, mode: 0 part 1 | 1 part 2 | 2 chain rule, k }.
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

  const FUNS = [
    { eq: '0.25x² + 0.5', f: (x) => 0.25 * x * x + 0.5, F: (x) => x * x * x / 12 + 0.5 * x, Fs: 'x³/12 + 0.5x', fp: '0.5x' },
    { eq: '1.8·sin x + 0.3', f: (x) => 1.8 * Math.sin(x) + 0.3, F: (x) => -1.8 * Math.cos(x) + 0.3 * x, Fs: '−1.8·cos x + 0.3x', fp: '1.8·cos x' },
    { eq: '0.3x', f: (x) => 0.3 * x, F: (x) => 0.15 * x * x, Fs: '0.15x²', fp: '0.3' },
    { eq: '0.15x³ − 0.5x', f: (x) => 0.15 * x * x * x - 0.5 * x, F: (x) => 0.0375 * x * x * x * x - 0.25 * x * x, Fs: '0.0375x⁴ − 0.25x²', fp: '0.45x² − 0.5' },
    { eq: '2·cos x', f: (x) => 2 * Math.cos(x), F: (x) => 2 * Math.sin(x), Fs: '2·sin x', fp: '−2·sin x' },
    { eq: 'e^(x/3)', f: (x) => Math.exp(x / 3), F: (x) => 3 * Math.exp(x / 3), Fs: '3·e^(x/3)', fp: 'e^(x/3)/3' },
  ];
  const MODES = () => [tx('Kısım 1: A\'(x) = f(x)', 'Part 1: A\'(x) = f(x)'), tx('Kısım 2: ∫ₐᵇ f = F(b) − F(a)', 'Part 2: ∫ₐᵇ f = F(b) − F(a)'), tx('Zincirli biçim: d/dx ∫ₐ^{kx} f', 'Chain-rule form: d/dx ∫ₐ^{kx} f'), tx('İki değişken sınır: d/dx ∫_{−x}^{kx} f', 'Two variable limits: d/dx ∫_{−x}^{kx} f')];

  function Help() { return tx("KALKÜLÜSÜN TEMEL TEOREMİ" + "\n" + "Türev ile integralin birbirinin TERSİ olduğunu söyler. İki kısımdan oluşur." + "\n" + "\n" + "KISIM 1 (integralin türevi)" + "\n" + "f, [a,b]'de sürekli ve F(x) = ∫ₐˣ f(t) dt ise F türevlenebilirdir ve" + "\n" + "  F'(x) = f(x)" + "\n" + "Yani \"biriken alanın değişim hızı = o noktadaki yükseklik\". Zincirli biçim:" + "\n" + "  d/dx ∫ₐ^{g(x)} f(t) dt = f(g(x))·g'(x)" + "\n" + "\n" + "KISIM 2 (değerlendirme teoremi)" + "\n" + "f, [a,b]'de sürekli ve F, f'nin herhangi bir ters türeviyse (F' = f)" + "\n" + "  ∫ₐᵇ f(x) dx = F(b) − F(a) = [F(x)]ₐᵇ" + "\n" + "\n" + "YÖNTEM (belirli integral hesaplama)" + "\n" + "1. f için bir ters türev F'yi buluruz (yalnızca biri yeter, +C yazmaya gerek yoktur)." + "\n" + "2. Üst sınırı yerine koyarız: F(b)." + "\n" + "3. Alt sınırı yerine koyarız: F(a)." + "\n" + "4. F(b) − F(a) farkını hesaplarız." + "\n" + "Değişken değiştirmede sınırlar da dönüştürülür." + "\n" + "\n" + "NEDEN ÇALIŞIR?" + "\n" + "İntegral toplam birikimdir; F' = f ise F birikimin kendisini izler ve iki uç arasındaki fark toplam değişimdir (net değişim teoremi: ∫ F' = F(b) − F(a))." + "\n" + "\n" + "TUZAKLAR" + "\n" + "• f, [a,b]'de SÜREKLİ olmalı: ∫₋₁¹ 1/x² dx'e uygulasaydık −2 çıkardı, oysa integral ıraksaktır (x = 0'da sonsuzluk)." + "\n" + "• Üst − alt sırası korunmalıdır." + "\n" + "• Zincirli türevde g'(x) çarpanı atlanabilir: d/dx ∫₀^{x²} sin t dt = 2x·sin(x²), sin(x²) DEĞİLDİR." + "\n" + "• İşaretli alan: negatif sonuç mümkündür." + "\n" + "\n" + "MİNİ ÖRNEKLER" + "\n" + "• ∫₁³ 2x dx = [x²]₁³ = 9 − 1 = 8." + "\n" + "• F(x) = ∫₀ˣ cos(t²) dt ise F'(x) = cos(x²)." + "\n" + "• ∫₀^π sin x dx = [−cos x]₀^π = 1 + 1 = 2.", "THE FUNDAMENTAL THEOREM OF CALCULUS" + "\n" + "It states that differentiation and integration are INVERSE operations, in two parts." + "\n" + "\n" + "PART 1 (derivative of an integral)" + "\n" + "If f is continuous on [a,b] and F(x) = ∫ₐˣ f(t) dt, then F is differentiable and" + "\n" + "  F'(x) = f(x)" + "\n" + "That is, \"the rate of change of accumulated area = the height at that point\". Chain-rule form:" + "\n" + "  d/dx ∫ₐ^{g(x)} f(t) dt = f(g(x))·g'(x)" + "\n" + "\n" + "PART 2 (evaluation theorem)" + "\n" + "If f is continuous on [a,b] and F is any antiderivative of f (F' = f), then" + "\n" + "  ∫ₐᵇ f(x) dx = F(b) − F(a) = [F(x)]ₐᵇ" + "\n" + "\n" + "METHOD (computing a definite integral)" + "\n" + "1. We find an antiderivative F of f (just one; no +C needed)." + "\n" + "2. We substitute the upper limit: F(b)." + "\n" + "3. We substitute the lower limit: F(a)." + "\n" + "4. We compute F(b) − F(a)." + "\n" + "With a substitution, the limits are converted too." + "\n" + "\n" + "WHY IT WORKS" + "\n" + "The integral is the total accumulation; if F' = f then F tracks the accumulation itself, and the difference between the endpoints is the total change (net change theorem: ∫ F' = F(b) − F(a))." + "\n" + "\n" + "PITFALLS" + "\n" + "• f must be CONTINUOUS on [a,b]: applying it to ∫₋₁¹ 1/x² dx gives −2, but the integral diverges (infinity at x = 0)." + "\n" + "• It helps to keep the order upper − lower." + "\n" + "• It is easy to forget the g'(x) factor in the chain form: d/dx ∫₀^{x²} sin t dt = 2x·sin(x²), NOT sin(x²)." + "\n" + "• Signed area: a negative result is possible." + "\n" + "\n" + "MINI EXAMPLES" + "\n" + "• ∫₁³ 2x dx = [x²]₁³ = 9 − 1 = 8." + "\n" + "• If F(x) = ∫₀ˣ cos(t²) dt then F'(x) = cos(x²)." + "\n" + "• ∫₀^π sin x dx = [−cos x]₀^π = 1 + 1 = 2."); }

  function norm(p) {
    if (p.mode < 2) p.k = 1;
    else if (p.k !== 2 && p.k !== 3) p.k = 2;
    p.a = Math.max(DMIN, Math.min(DMAX, p.a));
    const lim = DMAX / p.k;
    p.x = Math.max(-lim, Math.min(lim, p.x));
    return p;
  }
  const acc = (u, a) => (x) => u.F(x) - u.F(a);

  function problemStatement(p) {
    norm(p);
    const u = FUNS[p.fi];
    if (p.mode === 0) {
      return tx(`f(t) = ${u.eq} olsun ve A(x) = ∫ₐˣ f(t) dt birikmiş alan fonksiyonu a = ${N2(p.a)} için tanımlansın. Temel Teorem'in 1. Kısmıyla x = ${N2(p.x)} noktasında A′(${N2(p.x)}) türevini bulalım; sonra A(${N2(p.x)}) değerini hesaplayıp A′'nün f(${N2(p.x)}) ile aynı olduğunu sayısal olarak doğrulayalım.`,
        `Let f(t) = ${u.eq} and let A(x) = ∫ₐˣ f(t) dt be the accumulated-area function for a = ${N2(p.a)}. Using Part 1 of the Fundamental Theorem, let's find the derivative A′(${N2(p.x)}) at x = ${N2(p.x)}; then we compute A(${N2(p.x)}) and check numerically that A′ agrees with f(${N2(p.x)}).`);
    }
    if (p.mode === 1) {
      return tx(`Temel Teorem'in 2. Kısmını kullanarak f(t) = ${u.eq} için ∫ f(t) dt belirli integralini t = ${N2(p.a)} ile t = ${N2(p.x)} arasında hesaplayalım (önce bir ters türev F bulabiliriz).`,
        `Using Part 2 of the Fundamental Theorem, let's evaluate the definite integral ∫ f(t) dt for f(t) = ${u.eq} from t = ${N2(p.a)} to t = ${N2(p.x)} (first we can find an antiderivative F).`);
    }
    if (p.mode === 3) {
      return tx(`f(t) = ${u.eq} ve G(x) = ∫_{−x}^{${p.k}x} f(t) dt olsun (iki sınır da x'e bağlı). Temel Teorem'i zincir kuralıyla birlikte iki sınır için kullanarak x = ${N2(p.x)} noktasında G′(${N2(p.x)}) türevini bulalım ve G(${N2(p.x)}) değerini hesaplayalım.`,
        `Let f(t) = ${u.eq} and G(x) = ∫_{−x}^{${p.k}x} f(t) dt (both limits depend on x). Using the Fundamental Theorem with the chain rule for both limits, let's find the derivative G′(${N2(p.x)}) at x = ${N2(p.x)} and compute G(${N2(p.x)}).`);
    }
    return tx(`f(t) = ${u.eq} ve G(x) = ∫ₐ^{${p.k}x} f(t) dt (a = ${N2(p.a)}) olsun. Zincir kuralıyla birlikte Temel Teorem'i kullanarak x = ${N2(p.x)} noktasında G′(${N2(p.x)}) türevini bulalım ve G(${N2(p.x)}) değerini hesaplayalım.`,
      `Let f(t) = ${u.eq} and G(x) = ∫ₐ^{${p.k}x} f(t) dt (a = ${N2(p.a)}). Using the Fundamental Theorem together with the chain rule, let's find the derivative G′(${N2(p.x)}) at x = ${N2(p.x)} and compute G(${N2(p.x)}).`);
  }

  function solveSteps(p) {
    norm(p);
    const u = FUNS[p.fi];
    const k = p.k, x0 = p.x, u0 = k * x0;
    const A = acc(u, p.a);
    const f0 = u.f(x0), fu = u.f(u0);
    const s = [];
    if (p.mode === 0) {
      const h = 0.001, cd = (A(x0 + h) - A(x0 - h)) / (2 * h);
      s.push(tx(`── 1) Soruyu kuralım ──\nf(t) = ${u.eq}, A(x) = ∫ₐˣ f(t) dt, a = ${N2(p.a)}, x₀ = ${N2(x0)}. A(x) "a'dan x'e kadar biriken (işaretli) alan"dır; x değiştikçe taralı bölge büyür/küçülür.`,
        `── 1) Set up ──\nf(t) = ${u.eq}, A(x) = ∫ₐˣ f(t) dt, a = ${N2(p.a)}, x₀ = ${N2(x0)}. A(x) is "the signed area accumulated from a to x"; as x moves the shaded region grows/shrinks.`));
      s.push(tx(`── 2) Temel Teorem, Kısım 1 ──\nf sürekli olduğundan A türevlenebilirdir ve A′(x) = f(x). Yani biriken alanın değişim hızı, o noktadaki eğri YÜKSEKLİĞİDİR.`,
        `── 2) Fundamental Theorem, Part 1 ──\nBecause f is continuous, A is differentiable and A′(x) = f(x). The rate at which area accumulates equals the HEIGHT of the curve at that point.`));
      s.push(tx(`── 3) Türevi bulalım ──\nA′(${N2(x0)}) = f(${N2(x0)}) = ${N2(f0)}.`, `── 3) Finding the derivative ──\nA′(${N2(x0)}) = f(${N2(x0)}) = ${N2(f0)}.`));
      s.push(tx(`── 4) Birikmiş alanı hesaplayalım (Kısım 2) ──\nF(x) = ${u.Fs} bir ters türevdir (F′ = f). A(${N2(x0)}) = F(${N2(x0)}) − F(${N2(p.a)}) = ${N2(u.F(x0))} − (${N2(u.F(p.a))}) = ${N2(A(x0))}.`,
        `── 4) Computing the accumulated area (Part 2) ──\nF(x) = ${u.Fs} is an antiderivative (F′ = f). A(${N2(x0)}) = F(${N2(x0)}) − F(${N2(p.a)}) = ${N2(u.F(x0))} − (${N2(u.F(p.a))}) = ${N2(A(x0))}.`));
      s.push(tx(`── 5) Sayısal doğrulama ──\nMerkezi fark (h = 0,001): [A(${N2(x0 + h)}) − A(${N2(x0 - h)})]/(2h) = ${N2(cd)}  ≈  f(${N2(x0)}) = ${N2(f0)} ✓. A'nın eğimi, f'nin yüksekliğine eşittir.`,
        `── 5) Numerical check ──\nCentral difference (h = 0.001): [A(${N2(x0 + h)}) − A(${N2(x0 - h)})]/(2h) = ${N2(cd)}  ≈  f(${N2(x0)}) = ${N2(f0)} ✓. The slope of A equals the height of f.`));
      s.push(tx(`── 6) İşaret ve davranış ──\nf(${N2(x0)}) ${f0 > 1e-9 ? '> 0 ⇒ A bu noktada ARTAN' : f0 < -1e-9 ? '< 0 ⇒ A bu noktada AZALAN' : '= 0 ⇒ A\'nın yatay teğeti var (olası tepe/çukur)'}. f yukarıdayken A artar, f eksenin altındayken A azalır; f = 0 olan yerlerde A'nın teğeti yataydır.`,
        `── 6) Sign and behaviour ──\nf(${N2(x0)}) ${f0 > 1e-9 ? '> 0 ⇒ A is INCREASING here' : f0 < -1e-9 ? '< 0 ⇒ A is DECREASING here' : '= 0 ⇒ A has a horizontal tangent here (possible peak/valley)'}. While f is above the axis A rises, while f is below the axis A falls; where f = 0 the tangent of A is horizontal.`));
      s.push(tx(`── 7) A'nın bükeyliği ──\nA″ = f′ olduğundan A'nın bükeyliği f'nin eğimine bağlıdır: f′(x) = ${u.fp}, x₀'da f′(${N2(x0)}) = ${N2((u.f(x0 + h) - u.f(x0 - h)) / (2 * h))} (${(u.f(x0 + h) - u.f(x0 - h)) > 1e-9 ? 'A yukarı bükey' : (u.f(x0 + h) - u.f(x0 - h)) < -1e-9 ? 'A aşağı bükey' : 'büküm/sabit eğim'}).`,
        `── 7) Concavity of A ──\nSince A″ = f′, the concavity of A depends on the slope of f: f′(x) = ${u.fp}, at x₀ f′(${N2(x0)}) = ${N2((u.f(x0 + h) - u.f(x0 - h)) / (2 * h))} (${(u.f(x0 + h) - u.f(x0 - h)) > 1e-9 ? 'A is concave up' : (u.f(x0 + h) - u.f(x0 - h)) < -1e-9 ? 'A is concave down' : 'inflection/constant slope'}).`));
      s.push(tx(`── 8) Yorum (birimler) ──\nf hız (m/s) ise A yer değiştirmedir (m) ve A′ = f ivmelenme değil, ANLIK HIZDIR. Burada A(${N2(x0)}) = ${N2(A(x0))}, A′(${N2(x0)}) = ${N2(f0)}.`,
        `── 8) Interpretation (units) ──\nIf f is a velocity (m/s), A is a displacement (m) and A′ = f is the INSTANTANEOUS VELOCITY. Here A(${N2(x0)}) = ${N2(A(x0))}, A′(${N2(x0)}) = ${N2(f0)}.`));
      s.push(tx(`── 9) Sonuç ──\nA′(${N2(x0)}) = ${N2(f0)}; A(${N2(x0)}) = ${N2(A(x0))}. Grafikte mor eğri A(x), ana eğri f(x) ve kesikli yeşil doğru A'nın x₀'daki teğetidir (eğimi f(x₀)).`,
        `── 9) Result ──\nA′(${N2(x0)}) = ${N2(f0)}; A(${N2(x0)}) = ${N2(A(x0))}. In the graph the purple curve is A(x), the other curve is f(x), and the dashed green line is the tangent of A at x₀ (slope f(x₀)).`));
    } else if (p.mode === 1) {
      const val = A(x0);
      s.push(tx(`── 1) Soruyu kuralım ──\n∫ f(t) dt, f(t) = ${u.eq}, alt sınır a = ${N2(p.a)}, üst sınır b = ${N2(x0)}. İstenen: işaretli alan.`,
        `── 1) Set up ──\n∫ f(t) dt, f(t) = ${u.eq}, lower limit a = ${N2(p.a)}, upper limit b = ${N2(x0)}. Wanted: the signed area.`));
      s.push(tx(`── 2) Temel Teorem, Kısım 2 ──\nF′ = f olan herhangi bir F için ∫ₐᵇ f dt = F(b) − F(a) = [F(t)]ₐᵇ. Toplamı hiç yapmadan alan hesaplanır.`,
        `── 2) Fundamental Theorem, Part 2 ──\nFor any F with F′ = f, ∫ₐᵇ f dt = F(b) − F(a) = [F(t)]ₐᵇ. The area is found without doing any summation.`));
      s.push(tx(`── 3) Ters türevi bulalım ──\nF(t) = ${u.Fs}. Kontrol: F′(t) = ${u.eq} = f(t) ✓ (+C gerekmez, fark alınırken sadeleşir).`,
        `── 3) Finding an antiderivative ──\nF(t) = ${u.Fs}. Check: F′(t) = ${u.eq} = f(t) ✓ (+C is not needed, it cancels in the difference).`));
      s.push(tx(`── 4) Üst sınırı yerine koyalım ──\nF(${N2(x0)}) = ${N2(u.F(x0))}.`, `── 4) Plugging in the upper limit ──\nF(${N2(x0)}) = ${N2(u.F(x0))}.`));
      s.push(tx(`── 5) Alt sınırı yerine koyalım ──\nF(${N2(p.a)}) = ${N2(u.F(p.a))}.`, `── 5) Plugging in the lower limit ──\nF(${N2(p.a)}) = ${N2(u.F(p.a))}.`));
      s.push(tx(`── 6) Farkı alalım ──\n∫ = F(b) − F(a) = ${N2(u.F(x0))} − (${N2(u.F(p.a))}) = ${N2(val)}.`, `── 6) Taking the difference ──\n∫ = F(b) − F(a) = ${N2(u.F(x0))} − (${N2(u.F(p.a))}) = ${N2(val)}.`));
      s.push(tx(`── 7) Kontrol: Kısım 1 ile ──\nA(x) = ∫ₐˣ f diyelim: A′(${N2(x0)}) = f(${N2(x0)}) = ${N2(f0)}; grafikte A'nın x₀'daki teğetinin eğimi budur ve A(${N2(x0)}) = ${N2(val)} mor eğrinin x₀'daki yüksekliğidir.`,
        `── 7) Check with Part 1 ──\nLet A(x) = ∫ₐˣ f: A′(${N2(x0)}) = f(${N2(x0)}) = ${N2(f0)}; this is the slope of A's tangent at x₀ in the graph, and A(${N2(x0)}) = ${N2(val)} is the height of the purple curve at x₀.`));
      const rev = x0 < p.a;
      s.push(tx(`── 8) Geometrik anlam ──
${rev ? `Üst sınır (${N2(x0)}) alt sınırdan (${N2(p.a)}) küçük: sınırlar ters sırada olduğundan ∫ₐᵇ f = −∫ᵇₐ f ve işaret değişir. [${N2(x0)}, ${N2(p.a)}] üzerindeki işaretli alan ${N2(-val)}, istenen integral ${N2(val)}.` : `Sonuç ${val >= 0 ? 'pozitif' : 'negatif'}: eksenin ${val >= 0 ? 'üstündeki alan altındakinden büyük' : 'altındaki alan üstündekinden büyük'} (işaretli alan).`} Alt ve üst sınır yer değiştirirse işaret değişir: ∫ₓ₀ᵃ f = ${N2(-val)}.`,
        `── 8) Geometric meaning ──
${rev ? `The upper limit (${N2(x0)}) is smaller than the lower limit (${N2(p.a)}): the limits are reversed, so ∫ₐᵇ f = −∫ᵇₐ f and the sign flips. The signed area over [${N2(x0)}, ${N2(p.a)}] is ${N2(-val)}, the requested integral is ${N2(val)}.` : `The result is ${val >= 0 ? 'positive' : 'negative'}: the area ${val >= 0 ? 'above the axis exceeds the area below it' : 'below the axis exceeds the area above it'} (signed area).`} Swapping the limits flips the sign: ∫ₓ₀ᵃ f = ${N2(-val)}.`));
      s.push(tx(`── 9) Sonuç ──\n∫ₐᵇ f(t) dt = ${N2(val)}. (f bir hız ise bu, [${N2(p.a)}, ${N2(x0)}] aralığındaki net yer değiştirmedir.)`,
        `── 9) Result ──\n∫ₐᵇ f(t) dt = ${N2(val)}. (If f is a velocity this is the net displacement over [${N2(p.a)}, ${N2(x0)}].)`));
    } else if (p.mode === 3) {
      const G = (x) => u.F(k * x) - u.F(-x);
      const fl = u.f(-x0), gp = fu * k + fl;
      const h = 0.001, cd = (G(x0 + h) - G(x0 - h)) / (2 * h);
      s.push(tx(`── 1) Soruyu kuralım ──\nf(t) = ${u.eq}, G(x) = ∫_{h(x)}^{g(x)} f(t) dt; alt sınır h(x) = −x (h′ = −1), üst sınır g(x) = ${k}x (g′ = ${k}). İki sınır da x'in bir FONKSİYONUDUR; x₀ = ${N2(x0)}.`,
        `── 1) Set up ──\nf(t) = ${u.eq}, G(x) = ∫_{h(x)}^{g(x)} f(t) dt; lower limit h(x) = −x (h′ = −1), upper limit g(x) = ${k}x (g′ = ${k}). Both limits are FUNCTIONS of x; x₀ = ${N2(x0)}.`));
      s.push(tx(`── 2) İki sınır için zincirli biçim ──\nİntegrali bir c noktasında bölelim: G(x) = ∫_{h}^{c} f + ∫_{c}^{g} f = −∫_{c}^{h} f + ∫_{c}^{g} f. Her parçaya Kısım 1 ve zincir kuralı uygulanır:\nG′(x) = f(g(x))·g′(x) − f(h(x))·h′(x) = f(${k}x)·${k} − f(−x)·(−1) = ${k}·f(${k}x) + f(−x).`,
        `── 2) The chain-rule form for two limits ──\nLet's split the integral at a point c: G(x) = ∫_{h}^{c} f + ∫_{c}^{g} f = −∫_{c}^{h} f + ∫_{c}^{g} f. Part 1 and the chain rule apply to each piece:\nG′(x) = f(g(x))·g′(x) − f(h(x))·h′(x) = f(${k}x)·${k} − f(−x)·(−1) = ${k}·f(${k}x) + f(−x).`));
      s.push(tx(`── 3) Sınırları hesaplayalım ──\ng(${N2(x0)}) = ${k}·${N2(x0)} = ${N2(u0)},   h(${N2(x0)}) = −${N2(x0)} = ${N2(-x0)}.`,
        `── 3) Evaluate the limits ──\ng(${N2(x0)}) = ${k}·${N2(x0)} = ${N2(u0)},   h(${N2(x0)}) = −${N2(x0)} = ${N2(-x0)}.`));
      s.push(tx(`── 4) f'yi iki uçta hesaplayalım ──\nf(${N2(u0)}) = ${N2(fu)},   f(${N2(-x0)}) = ${N2(fl)}.`, `── 4) Evaluate f at both ends ──\nf(${N2(u0)}) = ${N2(fu)},   f(${N2(-x0)}) = ${N2(fl)}.`));
      s.push(tx(`── 5) Türev ──\nG′(${N2(x0)}) = ${N2(fu)}·${k} − ${N2(fl)}·(−1) = ${N2(fu * k)} + ${N2(fl)} = ${N2(gp)}.`, `── 5) The derivative ──\nG′(${N2(x0)}) = ${N2(fu)}·${k} − ${N2(fl)}·(−1) = ${N2(fu * k)} + ${N2(fl)} = ${N2(gp)}.`));
      s.push(tx(`── 6) G'nin değeri (Kısım 2) ──\nF(t) = ${u.Fs}; G(${N2(x0)}) = F(${N2(u0)}) − F(${N2(-x0)}) = ${N2(u.F(u0))} − (${N2(u.F(-x0))}) = ${N2(G(x0))}.`,
        `── 6) The value of G (Part 2) ──\nF(t) = ${u.Fs}; G(${N2(x0)}) = F(${N2(u0)}) − F(${N2(-x0)}) = ${N2(u.F(u0))} − (${N2(u.F(-x0))}) = ${N2(G(x0))}.`));
      s.push(tx(`── 7) Sayısal doğrulama ──\nMerkezi fark: [G(${N2(x0 + h)}) − G(${N2(x0 - h)})]/(2h) = ${N2(cd)} ≈ ${N2(gp)} ✓.`,
        `── 7) Numerical check ──\nCentral difference: [G(${N2(x0 + h)}) − G(${N2(x0 - h)})]/(2h) = ${N2(cd)} ≈ ${N2(gp)} ✓.`));
      s.push(tx(`── 8) Yaygın hata ──\nAlt sınırın katkısı unutulursa ya da işareti yanlış yazılırsa (yalnızca ${k}·f(${k}x) = ${N2(fu * k)} alınırsa) sonuç YANLIŞ olur. Alt sınır azalırken (h′ = −1) integrale EKLENEN alan büyür, o yüzden terim "− f(h)·h′" = +f(−x) olur.`,
        `── 8) Common mistake ──\nIf the contribution of the lower limit is forgotten or its sign is wrong (taking only ${k}·f(${k}x) = ${N2(fu * k)}) the result is WRONG. As the lower limit moves down (h′ = −1) area is ADDED to the integral, so the term "− f(h)·h′" becomes +f(−x).`));
      s.push(tx(`── 9) Sonuç ──\nG′(${N2(x0)}) = ${N2(gp)}, G(${N2(x0)}) = ${N2(G(x0))}. Grafikte mor eğri G(x) = ∫_{−x}^{${k}x} f ve kesikli doğru onun x₀'daki teğetidir (eğimi ${N2(gp)}). Alt sınır a bu modda kullanılmaz.`,
        `── 9) Result ──\nG′(${N2(x0)}) = ${N2(gp)}, G(${N2(x0)}) = ${N2(G(x0))}. In the graph the purple curve is G(x) = ∫_{−x}^{${k}x} f and the dashed line is its tangent at x₀ (slope ${N2(gp)}). The lower limit a is not used in this mode.`));
    } else {
      const G = (x) => A(k * x);
      const gp = fu * k;
      s.push(tx(`── 1) Soruyu kuralım ──\nf(t) = ${u.eq}, G(x) = ∫ₐ^{${k}x} f(t) dt, a = ${N2(p.a)}, x₀ = ${N2(x0)}. Üst sınır x'in bir FONKSİYONUDUR: u(x) = ${k}x (u′ = ${k}).`,
        `── 1) Set up ──\nf(t) = ${u.eq}, G(x) = ∫ₐ^{${k}x} f(t) dt, a = ${N2(p.a)}, x₀ = ${N2(x0)}. The upper limit is a FUNCTION of x: u(x) = ${k}x (u′ = ${k}).`));
      s.push(tx(`── 2) Zincirli biçim ──\nA(u) = ∫ₐᵘ f dt için A′(u) = f(u). G(x) = A(u(x)) bileşke fonksiyonudur: G′(x) = A′(u(x))·u′(x) = f(u(x))·u′(x) = f(${k}x)·${k}.`,
        `── 2) The chain-rule form ──\nFor A(u) = ∫ₐᵘ f dt we have A′(u) = f(u). G(x) = A(u(x)) is a composite: G′(x) = A′(u(x))·u′(x) = f(u(x))·u′(x) = f(${k}x)·${k}.`));
      s.push(tx(`── 3) Üst sınırı hesaplayalım ──\nu(${N2(x0)}) = ${k}·${N2(x0)} = ${N2(u0)}.`, `── 3) Evaluate the upper limit ──\nu(${N2(x0)}) = ${k}·${N2(x0)} = ${N2(u0)}.`));
      s.push(tx(`── 4) f'yi u₀'da hesaplayalım ──\nf(${N2(u0)}) = ${N2(fu)}.`, `── 4) Evaluate f at u₀ ──\nf(${N2(u0)}) = ${N2(fu)}.`));
      s.push(tx(`── 5) Türev ──\nG′(${N2(x0)}) = f(${N2(u0)})·${k} = ${N2(fu)}·${k} = ${N2(gp)}.`, `── 5) The derivative ──\nG′(${N2(x0)}) = f(${N2(u0)})·${k} = ${N2(fu)}·${k} = ${N2(gp)}.`));
      s.push(tx(`── 6) G'nin değeri (Kısım 2) ──\nF(t) = ${u.Fs}; G(${N2(x0)}) = F(${N2(u0)}) − F(${N2(p.a)}) = ${N2(u.F(u0))} − (${N2(u.F(p.a))}) = ${N2(G(x0))}.`,
        `── 6) The value of G (Part 2) ──\nF(t) = ${u.Fs}; G(${N2(x0)}) = F(${N2(u0)}) − F(${N2(p.a)}) = ${N2(u.F(u0))} − (${N2(u.F(p.a))}) = ${N2(G(x0))}.`));
      const h = 0.001, cd = (G(x0 + h) - G(x0 - h)) / (2 * h);
      s.push(tx(`── 7) Sayısal doğrulama ──\nMerkezi fark: [G(${N2(x0 + h)}) − G(${N2(x0 - h)})]/(2h) = ${N2(cd)} ≈ ${N2(gp)} ✓.`,
        `── 7) Numerical check ──\nCentral difference: [G(${N2(x0 + h)}) − G(${N2(x0 - h)})]/(2h) = ${N2(cd)} ≈ ${N2(gp)} ✓.`));
      s.push(tx(`── 8) Yaygın hata ──\nZincir çarpanı ${k} unutulup G′ = f(${N2(u0)}) = ${N2(fu)} yazılırsa sonuç YANLIŞ olur; doğru sonuç ${N2(gp)} (çarpan u′ = ${k}). Üst sınır hızlı hareket ettiği için birikim ${k} kat hızlı değişir.`,
        `── 8) Common mistake ──\nIf we forget the chain factor ${k} and write G′ = f(${N2(u0)}) = ${N2(fu)} would be WRONG; the correct result is ${N2(gp)} (factor u′ = ${k}). Because the upper limit moves ${k} times as fast, the accumulation changes ${k} times as fast.`));
      s.push(tx(`── 9) Sonuç ──\nG′(${N2(x0)}) = ${N2(gp)}, G(${N2(x0)}) = ${N2(G(x0))}. Grafikte mor eğri G(x) = A(${k}x) ve kesikli doğru onun x₀'daki teğetidir (eğimi ${N2(gp)}).`,
        `── 9) Result ──\nG′(${N2(x0)}) = ${N2(gp)}, G(${N2(x0)}) = ${N2(G(x0))}. In the graph the purple curve is G(x) = A(${k}x) and the dashed line is its tangent at x₀ (slope ${N2(gp)}).`));
    }
    return s;
  }

  function draw(canvas, p) {
    norm(p);
    const u = FUNS[p.fi];
    const k = p.k, x0 = p.x, u0 = k * x0;
    const f = safe(u.f);
    const base = acc(u, p.a);
    const accF = safe((x) => (p.mode === 3 ? u.F(k * x) - u.F(-x) : base(k * x)));
    let lo = 0, hi = 0;
    for (let i = 0; i <= 200; i++) {
      const x = DMIN + (DMAX - DMIN) * i / 200;
      [f(x), accF(x)].forEach((v) => { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    }
    const pad = Math.max(0.5, (hi - lo) * 0.12);
    canvas.setViewport(DMIN, DMAX, lo - pad, hi + pad);
    const lo0 = p.mode === 3 ? -x0 : p.a;
    canvas.addFilledArea({ evaluator: f, xMin: Math.min(lo0, u0), xMax: Math.max(lo0, u0), color: rgba(canvas.accent(), 0.3), samples: 160 });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(t)' });
    canvas.addFunction({ evaluator: accF, color: canvas.purple(), thickness: 2.5, label: k === 1 ? `A(x) = ∫ₐˣ f` : p.mode === 3 ? `G(x) = ∫_{−x}^{${k}x} f` : `G(x) = ∫ₐ^${k}x f` });
    const slope = p.mode === 3 ? k * u.f(u0) + u.f(-x0) : p.mode === 2 ? k * u.f(u0) : u.f(x0);
    const yy = accF(x0);
    if (isFinite(yy) && isFinite(slope)) {
      canvas.addFunction({ evaluator: safe((x) => yy + slope * (x - x0)), color: canvas.green(), thickness: 2, dashed: true, label: tx('A / G teğeti', 'tangent of A / G') });
    }
    canvas.addGuideLine({ axis: 'vertical', position: x0, color: canvas.gray(), label: `x = ${N2(x0)}` });
    if (k !== 1) canvas.addGuideLine({ axis: 'vertical', position: u0, color: canvas.orange(), label: `${k}x = ${N2(u0)}` });
    if (p.mode === 3) canvas.addGuideLine({ axis: 'vertical', position: -x0, color: canvas.gold(), label: `−x = ${N2(-x0)}` });
    else canvas.addGuideLine({ axis: 'vertical', position: p.a, color: canvas.gold(), label: `a = ${N2(p.a)}` });
    canvas.addMarker({ x: u0, y: u.f(u0), color: canvas.orange(), radius: 6, label: `f = ${N2(u.f(u0))}` });
    if (isFinite(yy)) canvas.addMarker({ x: x0, y: yy, color: canvas.purple(), shape: 'diamond', radius: 7, label: `${k === 1 ? 'A' : 'G'} = ${N2(yy)}` });
  }

  function concept(p) {
    const u = FUNS[p.fi];
    return Help() + '\n\n' +
      tx('HAFIZA KURALI\n"İntegral birikim, türev eğim: birikimin eğimi = yükseklik." A′ = f (Kısım 1); ∫ₐᵇ F′ = F(b) − F(a) (Kısım 2).\n\nÖZEL DURUMLAR\n• Alt sınır a değişirse A(x) yalnızca dikey kayar; A′ = f değişmez.\n• Üst sınır g(x) ise zincir çarpanı g′(x) de katılır: d/dx ∫ₐ^{g(x)} f = f(g(x))·g′(x).\n• Her iki sınır değişkense: d/dx ∫_{h(x)}^{g(x)} f = f(g)·g′ − f(h)·h′.\n• f süreksiz ise (örn. 1/x², x = 0) teorem uygulanamaz.\n\nMİNİ ÖRNEK\nA(x) = ∫₁ˣ 2t dt = x² − 1 ⇒ A′(x) = 2x = f(x). G(x) = ∫₁^{2x} 2t dt ⇒ G′(x) = f(2x)·2 = 8x.',
        'MEMORY AID\n"The integral accumulates, the derivative slopes: the slope of the accumulation = the height." A′ = f (Part 1); ∫ₐᵇ F′ = F(b) − F(a) (Part 2).\n\nSPECIAL CASES\n• Changing the lower limit a only shifts A(x) vertically; A′ = f is unchanged.\n• With an upper limit g(x) the chain factor g′(x) is needed: d/dx ∫ₐ^{g(x)} f = f(g(x))·g′(x).\n• With both limits variable: d/dx ∫_{h(x)}^{g(x)} f = f(g)·g′ − f(h)·h′.\n• If f is discontinuous (e.g. 1/x² at x = 0) the theorem cannot be applied.\n\nMINI EXAMPLE\nA(x) = ∫₁ˣ 2t dt = x² − 1 ⇒ A′(x) = 2x = f(x). G(x) = ∫₁^{2x} 2t dt ⇒ G′(x) = f(2x)·2 = 8x.') +
      '\n\n' + tx('ŞU ANKİ FONKSİYON', 'CURRENT FUNCTION') + '\n' + `f(t) = ${u.eq}`;
  }

  // ---- controls ----
  let fnSel = null, modeRg = null, sa = null, sx = null;
  function syncReg(reg) {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    const ratio = (v - reg.min) / (reg.max - reg.min);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }
  function createProblem(rng) {
    const mode = forced ? forced.mode : rng.nextInt(0, 3);
    const k = mode >= 2 ? rng.pick([2, 3]) : 1;
    const fi = forced ? forced.fi : rng.nextInt(0, FUNS.length);
    const lim = Math.floor(DMAX / k);
    const x = rng.nextInt(-lim, lim + 1);
    const p = { fi, a: rng.nextInt(-4, 2), x, mode, k };
    norm(p);
    if (fnSel) fnSel.refreshFromModel();
    if (modeRg) modeRg.refreshFromModel();
    return p;
  }

  function buildControls(rightCol, getProblem, h) {
    const lab = (t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; rightCol.appendChild(d); return d; };
    lab(tx('Fonksiyon', 'Function'));
    fnSel = h.addSelect({
      options: FUNS.map((u, i) => ({ label: `f(t) = ${u.eq}`, value: i })),
      get: () => getProblem().fi, set: (v) => { getProblem().fi = Number(v); },
    });
    lab(tx('Soru türü', 'Question type'));
    modeRg = h.addRadioGroup({
      name: 'ftcMode',
      options: MODES().map((label, value) => ({ label, value })),
      get: () => getProblem().mode, set: (v) => { const p = getProblem(); p.mode = Number(v); if (p.mode >= 2 && p.k === 1) p.k = 2; norm(p); syncReg(sx); } });
    sa = h.addSlider({ caption: tx('Alt sınır (a) - birikimin sabit başlangıcı', 'Lower limit (a) - fixed start of accumulation'), min: DMIN, max: DMAX, step: 0.5,
      get: () => getProblem().a, set: (v) => { const p = getProblem(); p.a = v; norm(p); } });
    sx = h.addSlider({ caption: tx('Üst sınır (x) - tarama için sürükleyebiliriz', 'Upper limit (x) - we can drag to sweep'), min: DMIN, max: DMAX, step: 0.5,
      get: () => getProblem().x, set: (v) => { const p = getProblem(); p.x = v; norm(p); syncReg(sx); } });
  }

  const makeMode = (m) => (rng) => {
    forced = { fi: rng.nextInt(0, FUNS.length), mode: m };
    try { return createProblem(rng); } finally { forced = null; }
  };

  Topics.register('integrals', {
    id: 'fundamentalTheorem',
    tabTitle: () => tx('Kalkülüsün Temel Teoremi', 'Fundamental Theorem of Calculus'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { norm(p); const u = FUNS[p.fi]; const m = (p.a + p.k * p.x) / 2; const y = u.f(m) / 2; return { x: m, y: Number.isFinite(y) ? y : 0 }; },
    buildControls,
    links: [
      { match: /^(KISIM 1|PART 1) /, make: makeMode(0) },
      { match: /^(KISIM 2|PART 2) /, make: makeMode(1) },
      { match: /^• (Üst sınır g\(x\) ise|With an upper limit g\(x\))/, make: makeMode(2) },
      { match: /^• (Her iki sınır değişkense|With both limits variable)/, make: makeMode(3) },
    ],
    _scenarioCount: () => FUNS.length * 4,
    _setScenario: (i) => { forced = { fi: i % FUNS.length, mode: Math.floor(i / FUNS.length) }; },
  });
})();
