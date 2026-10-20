// Ported from Modules/Integrals/RealLifeIntegralsControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/limits/realLifeLimits.js): the ten VB scenarios (distance, tank volume, spring work, average value, area between
// curves, charge, rod mass, net change, Riemann sum, exponential dose) plus two NEW ones (energy from a power curve, total
// cost from marginal cost); scenario selector, live sliders, units block, the 'what does the question mean?' toggle.
// problem = { scn, p: [numbers] } (mirrors RlProblem). Module-level state survives "New Example".
(function () {
  let currentScenario = 0;
  let showMeaning = false;
  let randomScenario = false;
  let sliderRows = [];
  let offLangCustom = null;
  let selectReg = null;

  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v);
  const Spec = (caption, min, max, step) => ({ caption, min, max, step });
  // up to `dec` decimals, at least `minDec` decimals (VB 0.0# / 0.### style)
  function F(v, dec, minDec) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(dec);
    if (s.indexOf('.') >= 0) {
      s = s.replace(/0+$/, '');
      const md = minDec === undefined ? 0 : minDec;
      const have = s.length - s.indexOf('.') - 1;
      if (have < md) s += '0'.repeat(md - have);
      s = s.replace(/\.$/, '');
    }
    if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
    return s;
  }
  const F3 = (v) => F(v, 3, 0);
  const G4 = (v) => F(v, 4, 0);

  // evaluators never throw and never return +-Infinity (NaN breaks the line)
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  function rgba(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return { base: hex, alpha: a };
    return `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})`;
  }
  function Ad(s, tr, en) { s.push(tx(tr, en)); }
  function Shade(canvas, f, x0, x1, col) { canvas.addFilledArea({ evaluator: safe(f), xMin: x0, xMax: x1, color: rgba(col, 90 / 255) }); }
  function Curve(canvas, f, col) { canvas.addFunction({ evaluator: safe(f), color: col, thickness: 3 }); }
  function Mark(canvas, px, py, lbl) { canvas.addMarker({ x: px, y: py, color: canvas.gold(), radius: 7, label: lbl }); }

  function Titles() {
    return [ tx("1. Hız fonksiyonundan alınan yol", "1. Distance from a velocity function"), tx("2. Depodaki toplam su (giriş debisi)", "2. Total water in a tank (inflow rate)"), tx("3. Yayı germe işi (F = kx)", "3. Work stretching a spring (F = kx)"), tx("4. Ortalama sıcaklık (ortalama değer)", "4. Average temperature (mean value)"), tx("5. Gelir ve gider eğrileri arasındaki alan", "5. Area between revenue and cost curves"), tx("6. Akımdan geçen toplam yük", "6. Total charge from a current"), tx("7. Değişken yoğunluklu çubuğun kütlesi", "7. Mass of a rod with variable density"), tx("8. İşaret değiştiren hız: net değişim", "8. Rate that changes sign: net change"), tx("9. Ölçüm verisi: Riemann toplamı", "9. Measured data: Riemann sum"), tx("10. Üstel sönüm: toplam doz", "10. Exponential decay: total dose"), tx('11. Güç eğrisinden enerji (E = ∫P dt)', '11. Energy from a power curve (E = ∫P dt)'), tx('12. Marjinal maliyetten toplam maliyet', '12. Total cost from marginal cost') ];
  }


  function Specs(scn) {
    switch (scn) {
    case 0: {
    return [Spec(tx("a (v = a·t² + b, m/s)", "a (v = a·t² + b, m/s)"), 3, 9, 3), Spec(tx("b (m/s)", "b (m/s)"), 2, 10, 2), Spec(tx("Süre T (s)", "Duration T (s)"), 2, 6, 1)];
    break; }
    case 1: {
    return [Spec(tx("a (r = a + b·t, L/dk)", "a (r = a + b·t, L/min)"), 10, 50, 10), Spec(tx("b (L/dk²)", "b (L/min²)"), 2, 8, 2), Spec(tx("Süre T (dk)", "Duration T (min)"), 2, 10, 1)];
    break; }
    case 2: {
    return [Spec(tx("Yay sabiti k (N/m)", "Spring constant k (N/m)"), 200, 1000, 200), Spec(tx("Uzama d (m)", "Extension d (m)"), 1, 5, 1)];
    break; }
    case 3: {
    return [Spec(tx("a (T = a + b·x², °C)", "a (T = a + b·x², °C)"), 20, 60, 10), Spec(tx("b (°C/m²)", "b (°C/m²)"), 3, 9, 3), Spec(tx("Uzunluk L (m)", "Length L (m)"), 2, 6, 1)];
    break; }
    case 4: {
    return [Spec(tx("Ölçek k (bin TL)", "Scale k (thousand TL)"), 1, 4, 1), Spec(tx("Başabaş noktası m (bin adet)", "Break-even point m (thousand units)"), 3, 9, 3)];
    break; }
    case 5: {
    return [Spec(tx("a (I = a·t·(T − t), mA)", "a (I = a·t·(T − t), mA)"), 1, 4, 1), Spec(tx("Süre T (s)", "Duration T (s)"), 3, 9, 3)];
    break; }
    case 6: {
    return [Spec(tx("a (ρ = a + b·x², kg/m)", "a (ρ = a + b·x², kg/m)"), 2, 10, 2), Spec(tx("b (kg/m³)", "b (kg/m³)"), 3, 9, 3), Spec(tx("Uzunluk L (m)", "Length L (m)"), 2, 6, 1)];
    break; }
    case 7: {
    return [Spec(tx("a (r = a·(t − 3), ton/saat)", "a (r = a·(t − 3), tonnes/h)"), 2, 8, 2), Spec(tx("Süre T (saat)", "Duration T (h)"), 2, 10, 2)];
    break; }
    case 8: {
    return [Spec(tx("a (q = a·t², L/s)", "a (q = a·t², L/s)"), 1, 5, 1), Spec(tx("Yöntem (1 sol, 2 sağ, 3 orta)", "Method (1 left, 2 right, 3 midpoint)"), 1, 3, 1)];
    break; }
    case 9: {
    return [Spec(tx("a (başlangıç hızı, mg/saat)", "a (initial rate, mg/h)"), 10, 50, 10), Spec(tx("Sönüm katsayısı k (1/saat)", "Decay constant k (1/h)"), 0.1, 0.5, 0.1), Spec(tx("Süre T (saat)", "Duration T (h)"), 2, 10, 1)];
    break; }
    case 10: {
    return [Spec(tx("Taban güç a (kW)", "Base power a (kW)"), 10, 50, 10), Spec(tx("b (P = a + b·t², kW/s²)", "b (P = a + b·t², kW/s²)"), 1, 4, 1), Spec(tx("Süre T (s)", "Duration T (s)"), 2, 6, 1)];
    break; }
    case 11: {
    return [Spec(tx("a (MC = a + b·q, TL/adet)", "a (MC = a + b·q, TL/unit)"), 20, 60, 10), Spec(tx("b (TL/adet²)", "b (TL/unit²)"), 1, 5, 1), Spec(tx("Başlangıç adedi q₁", "Start quantity q₁"), 10, 30, 10), Spec(tx("Bitiş adedi q₂", "End quantity q₂"), 40, 80, 20)];
    break; }
    }
  }


  function Question(p) {
    let x = p.p;
    switch (p.scn) {
    case 0: {
    return tx(`Bir aracın hızı v(t) = ${N2(x[0])}t² + ${N2(x[1])} m/s ile modelleniyor (t saniye). İlk ${N2(x[2])} saniyede araç toplam kaç metre yol alır?`, `The speed of a vehicle is modelled by v(t) = ${N2(x[0])}t² + ${N2(x[1])} m/s (t in seconds). How many metres does it travel in the first ${N2(x[2])} seconds?`);
    break; }
    case 1: {
    return tx(`Bir depoya su giriş debisi r(t) = ${N2(x[0])} + ${N2(x[1])}t litre/dakikadır (t dakika). ${N2(x[2])} dakika sonunda depoya toplam kaç litre su girmiştir?`, `Water flows into a tank at the rate r(t) = ${N2(x[0])} + ${N2(x[1])}t litres/minute (t in minutes). How many litres have entered the tank after ${N2(x[2])} minutes?`);
    break; }
    case 2: {
    return tx(`Bir yayın kuvveti F(x) = ${N2(x[0])}x newton (x: uzama, metre). Yayı doğal boyundan ${N2(x[1])} m germek için yapılan iş kaç joule'dür?`, `A spring exerts the force F(x) = ${N2(x[0])}x newtons (x: extension in metres). How much work in joules is needed to stretch it ${N2(x[1])} m from its natural length?`);
    break; }
    case 3: {
    return tx(`Bir fırın çubuğunun sıcaklığı konuma göre T(x) = ${N2(x[0])} + ${N2(x[1])}x² °C ile değişiyor (x: 0'dan ${N2(x[2])} m'ye kadar). Çubuğun ortalama sıcaklığı kaç °C'dir?`, `The temperature along a furnace bar varies with position as T(x) = ${N2(x[0])} + ${N2(x[1])}x² °C (x from 0 to ${N2(x[2])} m). What is the average temperature of the bar in °C?`);
    break; }
    case 4: {
    return tx(`Bir üretimde gelir R(x) = ${N2(x[0])}·${N2(x[1])}x ve gider C(x) = ${N2(x[0])}x² (bin TL, x: bin adet). Gelir giderin üstünde kaldığı 0 ile ${N2(x[1])} bin adet arasında toplam kâr birikimi (iki eğri arasındaki alan) kaçtır?`, `In a production run the revenue is R(x) = ${N2(x[0])}·${N2(x[1])}x and the cost is C(x) = ${N2(x[0])}x² (thousand TL, x: thousand units). Between 0 and ${N2(x[1])} thousand units, where revenue exceeds cost, what is the accumulated profit (the area between the two curves)?`);
    break; }
    case 5: {
    return tx(`Bir devreden geçen akım I(t) = ${N2(x[0])}·t·(${N2(x[1])} − t) mA (t saniye, 0 ≤ t ≤ ${N2(x[1])}). Bu sürede geçen toplam yük kaç mC'dir (mA·s = mC)?`, `The current in a circuit is I(t) = ${N2(x[0])}·t·(${N2(x[1])} − t) mA (t in seconds, 0 ≤ t ≤ ${N2(x[1])}). How much charge in mC flows in this time (mA·s = mC)?`);
    break; }
    case 6: {
    return tx(`${N2(x[2])} m uzunluğundaki ince bir çubuğun doğrusal yoğunluğu ρ(x) = ${N2(x[0])} + ${N2(x[1])}x² kg/m'dir (x: uçtan uzaklık). Çubuğun toplam kütlesi kaç kg'dır?`, `A thin rod ${N2(x[2])} m long has linear density ρ(x) = ${N2(x[0])} + ${N2(x[1])}x² kg/m (x: distance from one end). What is the total mass of the rod in kg?`);
    break; }
    case 7: {
    return tx(`Bir depodaki stokun değişim hızı r(t) = ${N2(x[0])}(t − 3) ton/saattir (ilk 3 saat stok azalır, sonra artar). ${N2(x[1])} saat sonunda stoktaki NET değişim kaç tondur?`, `The rate of change of a warehouse stock is r(t) = ${N2(x[0])}(t − 3) tonnes/hour (the stock falls for the first 3 hours and rises afterwards). What is the NET change in stock after ${N2(x[1])} hours?`);
    break; }
    case 8: {
    let meth = MethodName(Math.round(x[1]), true);
    let methE = MethodName(Math.round(x[1]), false);
    return tx(`Bir sensör bir borudan geçen debiyi q(t) = ${N2(x[0])}t² L/s modeline uyan değerlerle 1 saniyelik aralıklarla ölçüyor (t = 0, 1, 2, 3, 4 s). Dört aralığı (${meth}) ile toplayarak 0-4 s arasında geçen toplam hacmi tahmin edebilir miyiz?`, `A sensor measures the flow through a pipe every second with values that follow q(t) = ${N2(x[0])}t² L/s (t = 0, 1, 2, 3, 4 s). Let's estimate the total volume between 0 and 4 s with the ${methE} using four intervals.`);
    break; }
    case 9: {
    return tx(`Bir ilaç vücuda başlangıçta ${N2(x[0])} mg/saat hızla veriliyor ve hız R(t) = ${N2(x[0])}·e^(−${N2(x[1])}t) olarak azalıyor (t saat). İlk ${N2(x[2])} saatte verilen toplam ilaç kaç mg'dır?`, `A drug is delivered at an initial rate of ${N2(x[0])} mg/hour and the rate decays as R(t) = ${N2(x[0])}·e^(−${N2(x[1])}t) (t in hours). How many mg are delivered in the first ${N2(x[2])} hours?`);
    break; }
    case 10: {
    return tx(`Bir motorun gücü P(t) = ${N2(x[0])} + ${N2(x[1])}t² kW ile değişiyor (t saniye). İlk ${N2(x[2])} saniyede motorun harcadığı enerji kaç kJ'dür (kW·s = kJ)? Aynı sürede ortalama güç kaç kW'dır?`,
      `The power of a motor varies as P(t) = ${N2(x[0])} + ${N2(x[1])}t² kW (t in seconds). How much energy in kJ does it use in the first ${N2(x[2])} seconds (kW·s = kJ)? What is the average power over this time in kW?`);
    break; }
    case 11: {
    return tx(`Bir ürünün marjinal maliyeti MC(q) = ${N2(x[0])} + ${N2(x[1])}q TL/adet'tir (q: üretilen adet). Üretimi ${N2(x[2])} adetten ${N2(x[3])} adede çıkarmak toplam maliyeti kaç TL artırır?`,
      `The marginal cost of a product is MC(q) = ${N2(x[0])} + ${N2(x[1])}q TL/unit (q: units produced). By how many TL does the total cost increase when production is raised from ${N2(x[2])} to ${N2(x[3])} units?`);
    break; }
    }
  }


  function MethodName(m, turkish) {
    switch (m) {
    case 1: {
    return (turkish ? "sol uç toplamı" : "left-endpoint sum");
    break; }
    case 2: {
    return (turkish ? "sağ uç toplamı" : "right-endpoint sum");
    break; }
    default: {
    return (turkish ? "orta nokta toplamı" : "midpoint sum");
    break; }
    }
  }


  function Meaning(p) {
    switch (p.scn) {
    case 0: {
    return tx("Hız, konumun değişim hızıdır; 'toplam alınan yol' ise küçük küçük yolların TOPLANMASIDIR: her küçük dt anında yol ≈ v(t)·dt. Sonsuz sayıda böyle küçük parçayı toplamak İNTEGRALDİR. " + "Integralin sınırları zaman aralığıdır: alt sınır 0 (başlangıç), üst sınır T. Geometrik olarak yol, v(t) eğrisi ile t ekseni arasındaki ALANDIR. " + "Matematiksel istek: ∫₀ᵀ v(t) dt değerini bul.", "Speed is the rate of change of position; 'total distance' means ADDING UP many tiny distances: in each tiny time dt the distance is about v(t)·dt. Adding infinitely many such pieces is an INTEGRAL. " + "The limits of integration are the time interval: lower limit 0 (start), upper limit T. Geometrically the distance is the AREA between the curve v(t) and the t-axis. " + "Mathematical task: find ∫₀ᵀ v(t) dt.");
    break; }
    case 1: {
    return tx("Debi, birim zamandaki su miktarıdır (L/dk). Debi sabit olsaydı toplam = debi × süre olurdu; ama debi değiştiği için her küçük dt için r(t)·dt litre girer ve bunları toplamak gerekir: bu bir İNTEGRALDİR. " + "Sınırlar 0 ve T dakikadır. Alan = litre (L/dk × dk = L). " + "Matematiksel istek: ∫₀ᵀ r(t) dt değerini hesapla.", "The flow rate is the amount of water per unit time (L/min). If it were constant, total = rate × time; but because it changes, in each tiny dt the amount r(t)·dt enters and these must be summed: an INTEGRAL. " + "The limits are 0 and T minutes. The area is in litres (L/min × min = L). " + "Mathematical task: evaluate ∫₀ᵀ r(t) dt.");
    break; }
    case 2: {
    return tx("İş = kuvvet × yol, ama kuvvet yay uzadıkça DEĞİŞİYOR. Küçük bir dx kadar uzamada kuvvet yaklaşık sabittir ve iş ≈ F(x)·dx olur; bütün bu küçük işlerin toplamı İNTEGRALDİR. " + "Sınırlar uzamanın başlangıcı 0 ve sonu d'dir. İş, F(x) eğrisi altındaki alandır (N·m = J). " + "Matematiksel istek: ∫₀ᵈ F(x) dx.", "Work = force × distance, but the force CHANGES as the spring stretches. Over a tiny extension dx the force is nearly constant and the work is about F(x)·dx; the sum of all these small works is an INTEGRAL. " + "The limits are the start of the extension 0 and its end d. The work is the area under the F(x) curve (N·m = J). " + "Mathematical task: ∫₀ᵈ F(x) dx.");
    break; }
    case 3: {
    return tx("Sıcaklık noktadan noktaya değiştiği için 'ortalama' basit iki sayının ortalaması değildir. Ortalama değer = (eğri altındaki toplam alan) / (uzunluk): önce sürekli olarak 'topla' (integral), sonra uzunluğa böl. " + "Sınırlar çubuğun uçları 0 ve L'dir. " + "Matematiksel istek: ortalama = (1/L)·∫₀ᴸ T(x) dx.", "Because the temperature changes from point to point, the 'average' is not just the mean of two numbers. Mean value = (total area under the curve) / (length): first 'add up' continuously (an integral), then divide by the length. " + "The limits are the ends of the bar, 0 and L. " + "Mathematical task: average = (1/L)·∫₀ᴸ T(x) dx.");
    break; }
    case 4: {
    return tx("Her x'te kâr = gelir − gider = R(x) − C(x). Toplam kâr birikimi, bu FARKIN alanıdır, yani iki eğri arasında kalan bölgenin alanı. Gelir gider üstünde olduğu için fark pozitiftir. " + "Sınırlar, iki eğrinin kesiştiği noktalardır: x = 0 ve x = m (R = C). " + "Matematiksel istek: ∫₀ᵐ (R(x) − C(x)) dx.", "At each x, profit = revenue − cost = R(x) − C(x). The accumulated profit is the area of this DIFFERENCE, i.e. the region between the two curves. Revenue is above cost, so the difference is positive. " + "The limits are where the two curves meet: x = 0 and x = m (R = C). " + "Mathematical task: ∫₀ᵐ (R(x) − C(x)) dx.");
    break; }
    case 5: {
    return tx("Akım, yükün akış hızıdır (I = dQ/dt). Yük akım sabit değilse 'akım × süre' ile bulunamaz; her dt sürede dQ = I(t)·dt yük geçer ve toplam yük bunların toplamıdır: İNTEGRAL. " + "Sınırlar akımın başladığı ve bittiği anlardır: 0 ve T. Alan = yük (mA·s = mC). " + "Matematiksel istek: Q = ∫₀ᵀ I(t) dt.", "Current is the rate of flow of charge (I = dQ/dt). If the current is not constant, 'current × time' does not work; in each dt the charge dQ = I(t)·dt passes and the total charge is the sum of these: an INTEGRAL. " + "The limits are when the current starts and stops: 0 and T. The area is charge (mA·s = mC). " + "Mathematical task: Q = ∫₀ᵀ I(t) dt.");
    break; }
    case 6: {
    return tx("Yoğunluk sabit olsaydı kütle = yoğunluk × uzunluk olurdu. Yoğunluk konumla değiştiği için çubuğu dx uzunluğunda küçük dilimlere böleriz; her dilimin kütlesi dm ≈ ρ(x)·dx'tir ve dilimleri toplamak İNTEGRALDİR. " + "Sınırlar çubuğun iki ucu: 0 ve L. " + "Matematiksel istek: m = ∫₀ᴸ ρ(x) dx.", "If the density were constant, mass = density × length. Because density varies with position, we cut the rod into tiny slices of length dx; each slice has mass dm ≈ ρ(x)·dx and adding the slices is an INTEGRAL. " + "The limits are the two ends of the rod: 0 and L. " + "Mathematical task: m = ∫₀ᴸ ρ(x) dx.");
    break; }
    case 7: {
    return tx("'Net değişim' = değişim hızının integralidir. Hız ilk saatlerde NEGATİF (stok azalıyor), sonra pozitif (stok artıyor). Eksenin altındaki alan negatif, üstündeki alan pozitif sayılır: bu İŞARETLİ ALAN'dır ve integral bunları otomatik olarak toplar. " + "Sınırlar 0 ve T saattir. Sıfır geçişi t = 3'tedir. " + "Matematiksel istek: ∫₀ᵀ r(t) dt (işaretli alan) ve sonucun işaretini yorumla.", "'Net change' is the integral of the rate of change. The rate is NEGATIVE in the early hours (the stock falls) and positive later (the stock rises). Area below the axis counts negative and above it positive: this is SIGNED AREA, and the integral adds them automatically. " + "The limits are 0 and T hours. The sign change is at t = 3. " + "Mathematical task: ∫₀ᵀ r(t) dt (signed area), and interpret the sign of the result.");
    break; }
    case 8: {
    return tx("Sadece belirli anlarda ölçüm yapıldığı için integrali tam hesaplamak yerine, alanı DİKDÖRTGENLERLE yaklaşık toplarız (Riemann toplamı): her dikdörtgenin genişliği Δt, yüksekliği o aralıktan seçilen bir ölçümdür (sol uç, sağ uç ya da orta nokta). " + "Toplam hacim ≈ Δt·(q₁ + q₂ + q₃ + q₄). Sınırlar 0 ve 4 s'dir, dört aralık kullanılır (Δt = 1). " + "Matematiksel istek: ∫₀⁴ q(t) dt ≈ Σ q(tᵢ*)·Δt ve gerçek integralle karşılaştır.", "Because measurements exist only at certain instants, instead of computing the integral exactly we approximate the area with RECTANGLES (a Riemann sum): each rectangle has width Δt and a height taken from one measurement in that interval (left end, right end or midpoint). " + "Total volume ≈ Δt·(q₁ + q₂ + q₃ + q₄). The limits are 0 and 4 s, using four intervals (Δt = 1). " + "Mathematical task: ∫₀⁴ q(t) dt ≈ Σ q(tᵢ*)·Δt, then compare with the exact integral.");
    break; }
    case 9: {
    return tx("İlaç hızı zamanla azalıyor (üstel sönüm), bu yüzden toplam doz 'hız × süre' değildir. Her küçük dt'de R(t)·dt mg verilir; toplam doz bunların toplamı yani İNTEGRALDİR. " + "Sınırlar 0 ve T saattir. e^(−kt)'nin ters türevi −(1/k)e^(−kt) olduğuna dikkat et. " + "Matematiksel istek: ∫₀ᵀ a·e^(−kt) dt.", "The drug rate falls with time (exponential decay), so the total dose is not 'rate × time'. In each tiny dt the amount R(t)·dt mg is given; the total dose is their sum, i.e. an INTEGRAL. " + "The limits are 0 and T hours. Remember that the antiderivative of e^(−kt) is −(1/k)e^(−kt). " + "Mathematical task: ∫₀ᵀ a·e^(−kt) dt.");
    break; }
    case 10: {
    return tx("Güç, enerjinin harcanma HIZIDIR (P = dE/dt). Güç zamanla değiştiği için 'güç × süre' yanlış olur; her küçük dt'de dE = P(t)·dt enerji harcanır ve bunların toplamı İNTEGRALDİR. " + "Sınırlar 0 ve T saniyedir. Ortalama güç = toplam enerji / süre, yani P'nin ortalama değeridir. " + "Matematiksel istek: E = ∫₀ᵀ (a + b·t²) dt ve P_ort = E/T.",
      "Power is the RATE at which energy is used (P = dE/dt). Because the power changes with time, 'power × time' would be wrong; in every small dt an energy dE = P(t)·dt is used and adding them is an INTEGRAL. " + "The limits are 0 and T seconds. Average power = total energy / time, i.e. the average value of P. " + "Mathematical task: E = ∫₀ᵀ (a + b·t²) dt and P_avg = E/T.");
    break; }
    case 11: {
    return tx("Marjinal maliyet, BİR ADET daha üretmenin ek maliyetidir ve adet sayısıyla değişir. q₁'den q₂'ye geçerken her küçük dq için ek maliyet MC(q)·dq'dur; toplam maliyet artışı bunların toplamı yani İNTEGRALDİR (türevin tersi: C′(q) = MC(q)). " + "Sabit maliyet (kurulum) bu farkta sadeleşir. " + "Matematiksel istek: ΔC = ∫ q₁^q₂ MC(q) dq = C(q₂) − C(q₁).",
      "Marginal cost is the extra cost of ONE MORE unit and it changes with the quantity. Going from q₁ to q₂ each small dq adds MC(q)·dq; the total cost increase is the sum of these, an INTEGRAL (the reverse of the derivative: C′(q) = MC(q)). " + "The fixed cost (set-up) cancels in the difference. " + "Mathematical task: ΔC = ∫ q₁^q₂ MC(q) dq = C(q₂) − C(q₁).");
    break; }
    }
  }


  function Steps(problem) {
    let x = problem.p;
    let s = [];
    switch (problem.scn) {
    case 0: {
    let a = x[0], b = x[1], T = x[2];
    let t3 = T * T * T;
    let dist = a * t3 / 3 + b * T;
    s.push(tx(`1. Değişkenler: t = zaman (s), v(t) = ${N2(a)}t² + ${N2(b)} hız (m/s), s = alınan yol (m).`, `1. Variables: t = time (s), v(t) = ${N2(a)}t² + ${N2(b)} speed (m/s), s = distance travelled (m).`));
    s.push(tx(`2. Yol = hızın integrali: s = ∫₀^${N2(T)} (${N2(a)}t² + ${N2(b)}) dt.`, `2. Distance = integral of speed: s = ∫₀^${N2(T)} (${N2(a)}t² + ${N2(b)}) dt.`));
    s.push(tx(`3. Terim terim ters türev: ∫${N2(a)}t² dt = ${N2(a)}·t³/3 = ${N2(a / 3)}t³ ; ∫${N2(b)} dt = ${N2(b)}t.`, `3. Antiderivative term by term: ∫${N2(a)}t² dt = ${N2(a)}·t³/3 = ${N2(a / 3)}t³ ; ∫${N2(b)} dt = ${N2(b)}t.`));
    s.push(tx(`4. Böylece F(t) = ${N2(a / 3)}t³ + ${N2(b)}t (sabit C, sınırlı integralde sadeleşir).`, `4. So F(t) = ${N2(a / 3)}t³ + ${N2(b)}t (the constant C cancels in a definite integral).`));
    s.push(tx(`5. Analizin Temel Teoremi: s = F(${N2(T)}) − F(0).`, `5. Fundamental Theorem of Calculus: s = F(${N2(T)}) − F(0).`));
    s.push(tx(`6. F(${N2(T)}) = ${N2(a / 3)}·(${N2(T)})³ + ${N2(b)}·(${N2(T)}) = ${N2(a / 3)}·${N2(t3)} + ${N2(b * T)} = ${N2(a * t3 / 3)} + ${N2(b * T)} = ${N2(dist)}.`, `6. F(${N2(T)}) = ${N2(a / 3)}·(${N2(T)})³ + ${N2(b)}·(${N2(T)}) = ${N2(a / 3)}·${N2(t3)} + ${N2(b * T)} = ${N2(a * t3 / 3)} + ${N2(b * T)} = ${N2(dist)}.`));
    s.push(tx("7. F(0) = 0 + 0 = 0, dolayısıyla s = " + N2(dist) + " − 0.", "7. F(0) = 0 + 0 = 0, so s = " + N2(dist) + " − 0."));
    s.push(tx(`8. Birim ve işaret: (m/s)·s = m ve v > 0 olduğu için sonuç pozitif: s = ${N2(dist)} m.`, `8. Units and sign: (m/s)·s = m and since v > 0 the result is positive: s = ${N2(dist)} m.`));
    s.push(tx(`9. Yorum: ortalama hız = ${N2(dist)}/${N2(T)} = ${N2(dist / T)} m/s; grafikte gölgeli alan bu yolu gösterir.`, `9. Interpretation: average speed = ${N2(dist)}/${N2(T)} = ${N2(dist / T)} m/s; the shaded area on the graph is this distance.`));
    break; }
    case 1: {
    let a = x[0], b = x[1], T = x[2];
    let tot = a * T + b * T * T / 2;
    s.push(tx(`1. Değişkenler: t = zaman (dk), r(t) = ${N2(a)} + ${N2(b)}t debi (L/dk), V = toplam su (L).`, `1. Variables: t = time (min), r(t) = ${N2(a)} + ${N2(b)}t flow rate (L/min), V = total water (L).`));
    s.push(tx(`2. Toplam su = debinin integrali: V = ∫₀^${N2(T)} (${N2(a)} + ${N2(b)}t) dt.`, `2. Total water = integral of the rate: V = ∫₀^${N2(T)} (${N2(a)} + ${N2(b)}t) dt.`));
    s.push(tx(`3. Terim terim: ∫${N2(a)} dt = ${N2(a)}t ; ∫${N2(b)}t dt = ${N2(b)}·t²/2 = ${N2(b / 2)}t².`, `3. Term by term: ∫${N2(a)} dt = ${N2(a)}t ; ∫${N2(b)}t dt = ${N2(b)}·t²/2 = ${N2(b / 2)}t².`));
    s.push(tx(`4. F(t) = ${N2(a)}t + ${N2(b / 2)}t².`, `4. F(t) = ${N2(a)}t + ${N2(b / 2)}t².`));
    s.push(tx(`5. V = F(${N2(T)}) − F(0).`, `5. V = F(${N2(T)}) − F(0).`));
    s.push(tx(`6. F(${N2(T)}) = ${N2(a)}·${N2(T)} + ${N2(b / 2)}·(${N2(T)})² = ${N2(a * T)} + ${N2(b / 2)}·${N2(T * T)} = ${N2(a * T)} + ${N2(b * T * T / 2)} = ${N2(tot)}.`, `6. F(${N2(T)}) = ${N2(a)}·${N2(T)} + ${N2(b / 2)}·(${N2(T)})² = ${N2(a * T)} + ${N2(b / 2)}·${N2(T * T)} = ${N2(a * T)} + ${N2(b * T * T / 2)} = ${N2(tot)}.`));
    s.push(tx("7. F(0) = 0, bu yüzden V = " + N2(tot) + " − 0.", "7. F(0) = 0, so V = " + N2(tot) + " − 0."));
    s.push(tx(`8. Birim: (L/dk)·dk = L; r > 0 olduğu için sonuç pozitif: V = ${N2(tot)} L.`, `8. Units: (L/min)·min = L; r > 0 so the result is positive: V = ${N2(tot)} L.`));
    s.push(tx(`9. Yorum: sabit debi ${N2(a)} L/dk olsaydı yalnızca ${N2(a * T)} L girerdi; artan debi fazladan ${N2(b * T * T / 2)} L ekledi.`, `9. Interpretation: at the constant rate ${N2(a)} L/min only ${N2(a * T)} L would enter; the growing rate added an extra ${N2(b * T * T / 2)} L.`));
    break; }
    case 2: {
    let k = x[0], d = x[1];
    let w = k * d * d / 2;
    s.push(tx(`1. Değişkenler: x = uzama (m), F(x) = ${N2(k)}x kuvvet (N), W = iş (J).`, `1. Variables: x = extension (m), F(x) = ${N2(k)}x force (N), W = work (J).`));
    s.push(tx(`2. Değişken kuvvetle iş: W = ∫₀^${N2(d)} F(x) dx = ∫₀^${N2(d)} ${N2(k)}x dx.`, `2. Work by a variable force: W = ∫₀^${N2(d)} F(x) dx = ∫₀^${N2(d)} ${N2(k)}x dx.`));
    s.push(tx(`3. Ters türev: ∫${N2(k)}x dx = ${N2(k)}·x²/2 = ${N2(k / 2)}x².`, `3. Antiderivative: ∫${N2(k)}x dx = ${N2(k)}·x²/2 = ${N2(k / 2)}x².`));
    s.push(tx(`4. F̃(x) = ${N2(k / 2)}x² alınır; temel teorem: W = F̃(${N2(d)}) − F̃(0).`, `4. Take G(x) = ${N2(k / 2)}x²; by the fundamental theorem: W = G(${N2(d)}) − G(0).`));
    s.push(tx(`5. Üst sınır: G(${N2(d)}) = ${N2(k / 2)}·(${N2(d)})² = ${N2(k / 2)}·${N2(d * d)} = ${N2(w)}.`, `5. Upper limit: G(${N2(d)}) = ${N2(k / 2)}·(${N2(d)})² = ${N2(k / 2)}·${N2(d * d)} = ${N2(w)}.`));
    s.push(tx("6. Alt sınır: G(0) = " + N2(k / 2) + "·0 = 0.", "6. Lower limit: G(0) = " + N2(k / 2) + "·0 = 0."));
    s.push(tx(`7. W = ${N2(w)} − 0 = ${N2(w)} J.`, `7. W = ${N2(w)} − 0 = ${N2(w)} J.`));
    s.push(tx(`8. Birim: N·m = J; iş pozitif çünkü kuvvet ve yer değiştirme aynı yönde.`, `8. Units: N·m = J; the work is positive because force and displacement point the same way.`));
    s.push(tx(`9. Kontrol (üçgen alan): son kuvvet F(${N2(d)}) = ${N2(k * d)} N; alan = ½·taban·yükseklik = ½·${N2(d)}·${N2(k * d)} = ${N2(w)} J ✓.`, `9. Check (triangle area): final force F(${N2(d)}) = ${N2(k * d)} N; area = ½·base·height = ½·${N2(d)}·${N2(k * d)} = ${N2(w)} J ✓.`));
    break; }
    case 3: {
    let a = x[0], b = x[1], L = x[2];
    let l3 = L * L * L;
    let area = a * L + b * l3 / 3;
    s.push(tx(`1. Değişkenler: x = konum (m), T(x) = ${N2(a)} + ${N2(b)}x² (°C), L = ${N2(L)} m.`, `1. Variables: x = position (m), T(x) = ${N2(a)} + ${N2(b)}x² (°C), L = ${N2(L)} m.`));
    s.push(tx(`2. Ortalama değer formülü: T̄ = (1/L)·∫₀ᴸ T(x) dx = (1/${N2(L)})·∫₀^${N2(L)} (${N2(a)} + ${N2(b)}x²) dx.`, `2. Mean-value formula: T̄ = (1/L)·∫₀ᴸ T(x) dx = (1/${N2(L)})·∫₀^${N2(L)} (${N2(a)} + ${N2(b)}x²) dx.`));
    s.push(tx(`3. Terim terim: ∫${N2(a)} dx = ${N2(a)}x ; ∫${N2(b)}x² dx = ${N2(b)}·x³/3 = ${N2(b / 3)}x³.`, `3. Term by term: ∫${N2(a)} dx = ${N2(a)}x ; ∫${N2(b)}x² dx = ${N2(b)}·x³/3 = ${N2(b / 3)}x³.`));
    s.push(tx(`4. F(x) = ${N2(a)}x + ${N2(b / 3)}x³.`, `4. F(x) = ${N2(a)}x + ${N2(b / 3)}x³.`));
    s.push(tx(`5. F(${N2(L)}) = ${N2(a)}·${N2(L)} + ${N2(b / 3)}·(${N2(L)})³ = ${N2(a * L)} + ${N2(b / 3)}·${N2(l3)} = ${N2(a * L)} + ${N2(b * l3 / 3)} = ${N2(area)}.`, `5. F(${N2(L)}) = ${N2(a)}·${N2(L)} + ${N2(b / 3)}·(${N2(L)})³ = ${N2(a * L)} + ${N2(b / 3)}·${N2(l3)} = ${N2(a * L)} + ${N2(b * l3 / 3)} = ${N2(area)}.`));
    s.push(tx(`6. F(0) = 0, dolayısıyla ∫₀^${N2(L)} T dx = ${N2(area)} °C·m (eğri altındaki alan).`, `6. F(0) = 0, so ∫₀^${N2(L)} T dx = ${N2(area)} °C·m (the area under the curve).`));
    s.push(tx(`7. Uzunluğa böl: T̄ = ${N2(area)} / ${N2(L)} = ${N2(area / L)} °C.`, `7. Divide by the length: T̄ = ${N2(area)} / ${N2(L)} = ${N2(area / L)} °C.`));
    s.push(tx(`8. Birim: °C·m / m = °C. Kontrol: ortalama, en küçük (${N2(a)}) ile en büyük (${N2(a + b * L * L)}) sıcaklık arasında olmalı ✓.`, `8. Units: °C·m / m = °C. Check: the mean must lie between the smallest (${N2(a)}) and the largest (${N2(a + b * L * L)}) temperature ✓.`));
    s.push(tx(`9. Yorum: grafikte T̄ = ${N2(area / L)} yüksekliğindeki dikdörtgenin alanı, eğri altındaki alana eşittir.`, `9. Interpretation: on the graph, the rectangle of height T̄ = ${N2(area / L)} has the same area as the region under the curve.`));
    break; }
    case 4: {
    let k = x[0], m = x[1];
    let m2 = m * m, m3 = m * m * m;
    let res = k * m3 / 6;
    s.push(tx(`1. Değişkenler: x = bin adet, R(x) = ${N2(k * m)}x, C(x) = ${N2(k)}x² (bin TL).`, `1. Variables: x = thousand units, R(x) = ${N2(k * m)}x, C(x) = ${N2(k)}x² (thousand TL).`));
    s.push(tx(`2. Kesişim: R = C → ${N2(k * m)}x = ${N2(k)}x² → x = 0 ya da x = ${N2(m)}; bunlar integralin sınırlarıdır.`, `2. Intersections: R = C → ${N2(k * m)}x = ${N2(k)}x² → x = 0 or x = ${N2(m)}; these are the limits of integration.`));
    s.push(tx(`3. Alan = ∫₀^${N2(m)} (R − C) dx = ∫₀^${N2(m)} (${N2(k * m)}x − ${N2(k)}x²) dx.`, `3. Area = ∫₀^${N2(m)} (R − C) dx = ∫₀^${N2(m)} (${N2(k * m)}x − ${N2(k)}x²) dx.`));
    s.push(tx(`4. Terim terim: ∫${N2(k * m)}x dx = ${N2(k * m / 2)}x² ; ∫${N2(k)}x² dx = ${N2(k / 3)}x³.`, `4. Term by term: ∫${N2(k * m)}x dx = ${N2(k * m / 2)}x² ; ∫${N2(k)}x² dx = ${N2(k / 3)}x³.`));
    s.push(tx(`5. F(x) = ${N2(k * m / 2)}x² − ${N2(k / 3)}x³.`, `5. F(x) = ${N2(k * m / 2)}x² − ${N2(k / 3)}x³.`));
    s.push(tx(`6. F(${N2(m)}) = ${N2(k * m / 2)}·${N2(m2)} − ${N2(k / 3)}·${N2(m3)} = ${N2(k * m3 / 2)} − ${N2(k * m3 / 3)} = ${N2(res)}.`, `6. F(${N2(m)}) = ${N2(k * m / 2)}·${N2(m2)} − ${N2(k / 3)}·${N2(m3)} = ${N2(k * m3 / 2)} − ${N2(k * m3 / 3)} = ${N2(res)}.`));
    s.push(tx("7. F(0) = 0; sonuç = " + N2(res) + " − 0 = " + N2(res) + ".", "7. F(0) = 0; result = " + N2(res) + " − 0 = " + N2(res) + "."));
    s.push(tx(`8. Birim: bin TL × bin adet; toplam kâr birikimi = ${N2(res)} (bin TL·bin adet). Fark pozitif olduğu için işaret doğru ✓.`, `8. Units: thousand TL × thousand units; accumulated profit = ${N2(res)} (thousand TL·thousand units). The difference is positive so the sign is right ✓.`));
    s.push(tx(`9. Yorum: en yüksek kâr farkı x = ${N2(m / 2)}'de ${N2(k * m2 / 4)}; grafikte gölgeli bölge kâr eğrisinin altındaki alandır.`, `9. Interpretation: the biggest gap is at x = ${N2(m / 2)} with value ${N2(k * m2 / 4)}; the shaded region is the area under the profit curve.`));
    break; }
    case 5: {
    let a = x[0], T = x[1];
    let t2 = T * T, t3 = T * T * T;
    let q = a * t3 / 6;
    s.push(tx(`1. Değişkenler: t = zaman (s), I(t) = ${N2(a)}t(${N2(T)} − t) akım (mA), Q = yük (mC).`, `1. Variables: t = time (s), I(t) = ${N2(a)}t(${N2(T)} − t) current (mA), Q = charge (mC).`));
    s.push(tx(`2. Önce parantezi aç: I(t) = ${N2(a * T)}t − ${N2(a)}t².`, `2. Expand first: I(t) = ${N2(a * T)}t − ${N2(a)}t².`));
    s.push(tx(`3. Yük: Q = ∫₀^${N2(T)} (${N2(a * T)}t − ${N2(a)}t²) dt.`, `3. Charge: Q = ∫₀^${N2(T)} (${N2(a * T)}t − ${N2(a)}t²) dt.`));
    s.push(tx(`4. Terim terim: ∫${N2(a * T)}t dt = ${N2(a * T / 2)}t² ; ∫${N2(a)}t² dt = ${N2(a / 3)}t³.`, `4. Term by term: ∫${N2(a * T)}t dt = ${N2(a * T / 2)}t² ; ∫${N2(a)}t² dt = ${N2(a / 3)}t³.`));
    s.push(tx(`5. F(t) = ${N2(a * T / 2)}t² − ${N2(a / 3)}t³.`, `5. F(t) = ${N2(a * T / 2)}t² − ${N2(a / 3)}t³.`));
    s.push(tx(`6. F(${N2(T)}) = ${N2(a * T / 2)}·${N2(t2)} − ${N2(a / 3)}·${N2(t3)} = ${N2(a * t3 / 2)} − ${N2(a * t3 / 3)} = ${N2(q)}.`, `6. F(${N2(T)}) = ${N2(a * T / 2)}·${N2(t2)} − ${N2(a / 3)}·${N2(t3)} = ${N2(a * t3 / 2)} − ${N2(a * t3 / 3)} = ${N2(q)}.`));
    s.push(tx("7. F(0) = 0, dolayısıyla Q = " + N2(q) + " − 0.", "7. F(0) = 0, so Q = " + N2(q) + " − 0."));
    s.push(tx(`8. Birim: mA·s = mC. Akım 0 ≤ t ≤ ${N2(T)} için ≥ 0 olduğundan Q = ${N2(q)} mC pozitiftir.`, `8. Units: mA·s = mC. The current is ≥ 0 for 0 ≤ t ≤ ${N2(T)}, so Q = ${N2(q)} mC is positive.`));
    s.push(tx(`9. Yorum: en büyük akım t = ${N2(T / 2)} s'de ${N2(a * T * T / 4)} mA; ortalama akım = ${N2(q)}/${N2(T)} = ${N2(q / T)} mA.`, `9. Interpretation: the peak current is ${N2(a * T * T / 4)} mA at t = ${N2(T / 2)} s; the average current = ${N2(q)}/${N2(T)} = ${N2(q / T)} mA.`));
    break; }
    case 6: {
    let a = x[0], b = x[1], L = x[2];
    let l3 = L * L * L;
    let mass = a * L + b * l3 / 3;
    s.push(tx(`1. Değişkenler: x = uçtan uzaklık (m), ρ(x) = ${N2(a)} + ${N2(b)}x² (kg/m), m = kütle (kg).`, `1. Variables: x = distance from the end (m), ρ(x) = ${N2(a)} + ${N2(b)}x² (kg/m), m = mass (kg).`));
    s.push(tx(`2. Dilim kütlesi dm = ρ(x)dx; toplam kütle m = ∫₀^${N2(L)} (${N2(a)} + ${N2(b)}x²) dx.`, `2. Slice mass dm = ρ(x)dx; total mass m = ∫₀^${N2(L)} (${N2(a)} + ${N2(b)}x²) dx.`));
    s.push(tx(`3. Terim terim: ∫${N2(a)} dx = ${N2(a)}x ; ∫${N2(b)}x² dx = ${N2(b)}·x³/3 = ${N2(b / 3)}x³.`, `3. Term by term: ∫${N2(a)} dx = ${N2(a)}x ; ∫${N2(b)}x² dx = ${N2(b)}·x³/3 = ${N2(b / 3)}x³.`));
    s.push(tx(`4. F(x) = ${N2(a)}x + ${N2(b / 3)}x³.`, `4. F(x) = ${N2(a)}x + ${N2(b / 3)}x³.`));
    s.push(tx(`5. Temel teorem: m = F(${N2(L)}) − F(0).`, `5. Fundamental theorem: m = F(${N2(L)}) − F(0).`));
    s.push(tx(`6. F(${N2(L)}) = ${N2(a)}·${N2(L)} + ${N2(b / 3)}·${N2(l3)} = ${N2(a * L)} + ${N2(b * l3 / 3)} = ${N2(mass)}.`, `6. F(${N2(L)}) = ${N2(a)}·${N2(L)} + ${N2(b / 3)}·${N2(l3)} = ${N2(a * L)} + ${N2(b * l3 / 3)} = ${N2(mass)}.`));
    s.push(tx("7. F(0) = 0, dolayısıyla m = " + N2(mass) + " kg.", "7. F(0) = 0, so m = " + N2(mass) + " kg."));
    s.push(tx(`8. Birim: (kg/m)·m = kg; yoğunluk pozitif olduğundan kütle pozitif ✓.`, `8. Units: (kg/m)·m = kg; the density is positive so the mass is positive ✓.`));
    s.push(tx(`9. Yorum: ortalama yoğunluk = ${N2(mass)}/${N2(L)} = ${N2(mass / L)} kg/m (uçtaki ρ(${N2(L)}) = ${N2(a + b * L * L)} kg/m'den küçük).`, `9. Interpretation: average density = ${N2(mass)}/${N2(L)} = ${N2(mass / L)} kg/m (less than the end value ρ(${N2(L)}) = ${N2(a + b * L * L)} kg/m).`));
    break; }
    case 7: {
    let a = x[0], T = x[1];
    let net = a * T * (T - 6) / 2;
    s.push(tx(`1. Değişkenler: t = zaman (saat), r(t) = ${N2(a)}(t − 3) = ${N2(a)}t − ${N2(3 * a)} (ton/saat), N = net stok değişimi (ton).`, `1. Variables: t = time (h), r(t) = ${N2(a)}(t − 3) = ${N2(a)}t − ${N2(3 * a)} (tonnes/h), N = net stock change (tonnes).`));
    s.push(tx(`2. Net değişim: N = ∫₀^${N2(T)} (${N2(a)}t − ${N2(3 * a)}) dt.`, `2. Net change: N = ∫₀^${N2(T)} (${N2(a)}t − ${N2(3 * a)}) dt.`));
    s.push(tx(`3. Terim terim: ∫${N2(a)}t dt = ${N2(a / 2)}t² ; ∫${N2(3 * a)} dt = ${N2(3 * a)}t.`, `3. Term by term: ∫${N2(a)}t dt = ${N2(a / 2)}t² ; ∫${N2(3 * a)} dt = ${N2(3 * a)}t.`));
    s.push(tx(`4. F(t) = ${N2(a / 2)}t² − ${N2(3 * a)}t.`, `4. F(t) = ${N2(a / 2)}t² − ${N2(3 * a)}t.`));
    s.push(tx(`5. F(${N2(T)}) = ${N2(a / 2)}·${N2(T * T)} − ${N2(3 * a)}·${N2(T)} = ${N2(a * T * T / 2)} − ${N2(3 * a * T)} = ${N2(net)}.`, `5. F(${N2(T)}) = ${N2(a / 2)}·${N2(T * T)} − ${N2(3 * a)}·${N2(T)} = ${N2(a * T * T / 2)} − ${N2(3 * a * T)} = ${N2(net)}.`));
    s.push(tx("6. F(0) = 0, dolayısıyla N = " + N2(net) + " ton.", "6. F(0) = 0, so N = " + N2(net) + " tonnes."));
    if (T > 3) {
    s.push(tx(`7. İşaret analizi: t = 0..3'te alan = F(3) − F(0) = ${N2(-4.5 * a)} (azalma); t = 3..${N2(T)}'te alan = F(${N2(T)}) − F(3) = ${N2(net + 4.5 * a)} (artış); toplam = ${N2(net)} ✓.`, `7. Sign analysis: for t = 0..3 the area = F(3) − F(0) = ${N2(-4.5 * a)} (decrease); for t = 3..${N2(T)} the area = F(${N2(T)}) − F(3) = ${N2(net + 4.5 * a)} (increase); total = ${N2(net)} ✓.`));
    } else {
    s.push(tx(`7. İşaret analizi: [0, ${N2(T)}] tamamen t < 3 bölgesinde, r(t) < 0; stok yalnızca azalır, alan negatif.`, `7. Sign analysis: [0, ${N2(T)}] lies entirely in t < 3 where r(t) < 0; the stock only falls, the area is negative.`));
    }
    s.push(tx(`8. Birim: (ton/saat)·saat = ton. Sonuç ${(net < 0 ? "NEGATİF: stok azalmıştır" : (net > 0 ? "POZİTİF: stok artmıştır" : "SIFIR: stok başa dönmüştür"))}.`, `8. Units: (tonnes/h)·h = tonnes. The result is ${(net < 0 ? "NEGATIVE: the stock has decreased" : (net > 0 ? "POSITIVE: the stock has increased" : "ZERO: the stock is back where it started"))}.`));
    s.push(tx(`9. Yorum: net değişim ${N2(net)} ton; alan (eksen altı negatif, üstü pozitif) işaretli olarak toplanır.`, `9. Interpretation: the net change is ${N2(net)} tonnes; the area (negative below the axis, positive above) is added with its sign.`));
    break; }
    case 8: {
    let a = x[0], mth = Math.round(x[1]);
    let tp = (mth === 1 ? [0, 1, 2, 3] : (mth === 2 ? [1, 2, 3, 4] : [0.5, 1.5, 2.5, 3.5]));
    let tot = 0;
    let terms = [];
    for (const tv of tp) {
    tot += a * tv * tv;
    terms.push(`${N2(a * tv * tv)}`);
    }
    let exact = a * 64.0 / 3.0;
    s.push(tx(`1. Değişkenler: t = zaman (s), q(t) = ${N2(a)}t² debi (L/s), V = hacim (L). Aralık genişliği Δt = (4 − 0)/4 = 1 s.`, `1. Variables: t = time (s), q(t) = ${N2(a)}t² flow (L/s), V = volume (L). Interval width Δt = (4 − 0)/4 = 1 s.`));
    s.push(tx(`2. Yöntem: ${MethodName(mth, true)}. Seçilen zamanlar: t = ${N2(tp[0])}, ${N2(tp[1])}, ${N2(tp[2])}, ${N2(tp[3])}.`, `2. Method: ${MethodName(mth, false)}. Chosen times: t = ${N2(tp[0])}, ${N2(tp[1])}, ${N2(tp[2])}, ${N2(tp[3])}.`));
    s.push(tx(`3. Yükseklikler q(t) = ${N2(a)}t²: q(${N2(tp[0])}) = ${terms[0]}, q(${N2(tp[1])}) = ${terms[1]}, q(${N2(tp[2])}) = ${terms[2]}, q(${N2(tp[3])}) = ${terms[3]}.`, `3. Heights q(t) = ${N2(a)}t²: q(${N2(tp[0])}) = ${terms[0]}, q(${N2(tp[1])}) = ${terms[1]}, q(${N2(tp[2])}) = ${terms[2]}, q(${N2(tp[3])}) = ${terms[3]}.`));
    s.push(tx(`4. Riemann toplamı: V ≈ Δt·(q₁ + q₂ + q₃ + q₄) = 1·(${terms[0]} + ${terms[1]} + ${terms[2]} + ${terms[3]}).`, `4. Riemann sum: V ≈ Δt·(q₁ + q₂ + q₃ + q₄) = 1·(${terms[0]} + ${terms[1]} + ${terms[2]} + ${terms[3]}).`));
    s.push(tx(`5. Topla: V ≈ ${N2(tot)} L.`, `5. Add: V ≈ ${N2(tot)} L.`));
    s.push(tx(`6. Gerçek değer için ters türev: ∫${N2(a)}t² dt = ${N2(a / 3)}t³ → F(4) − F(0) = ${N2(a / 3)}·64 − 0 = ${N2(exact)} L.`, `6. For the exact value use the antiderivative: ∫${N2(a)}t² dt = ${N2(a / 3)}t³ → F(4) − F(0) = ${N2(a / 3)}·64 − 0 = ${N2(exact)} L.`));
    s.push(tx(`7. Hata: tahmin − gerçek = ${N2(tot)} − ${N2(exact)} = ${N2(tot - exact)} L (%${N2(100 * Math.abs(tot - exact) / exact)}).`, `7. Error: estimate − exact = ${N2(tot)} − ${N2(exact)} = ${N2(tot - exact)} L (${N2(100 * Math.abs(tot - exact) / exact)}%).`));
    s.push(tx(`8. Yorum: q artan bir fonksiyon; sol toplam ALT, sağ toplam ÜST tahmindir, orta nokta genellikle en yakındır. Birim: (L/s)·s = L.`, `8. Interpretation: q is increasing, so the left sum UNDER-estimates, the right sum OVER-estimates, and the midpoint is usually closest. Units: (L/s)·s = L.`));
    break; }
    case 9: {
    let a = x[0], k = x[1], T = x[2];
    let ex = Math.exp(-k * T);
    let tot = a * (1 - ex) / k;
    s.push(tx(`1. Değişkenler: t = zaman (saat), R(t) = ${N2(a)}e^(−${N2(k)}t) hız (mg/saat), D = toplam doz (mg).`, `1. Variables: t = time (h), R(t) = ${N2(a)}e^(−${N2(k)}t) rate (mg/h), D = total dose (mg).`));
    s.push(tx(`2. Toplam doz: D = ∫₀^${N2(T)} ${N2(a)}e^(−${N2(k)}t) dt.`, `2. Total dose: D = ∫₀^${N2(T)} ${N2(a)}e^(−${N2(k)}t) dt.`));
    s.push(tx(`3. Ters türev: ∫e^(−kt) dt = −(1/k)e^(−kt); burada 1/k = 1/${N2(k)} = ${N2(1 / k)}.`, `3. Antiderivative: ∫e^(−kt) dt = −(1/k)e^(−kt); here 1/k = 1/${N2(k)} = ${N2(1 / k)}.`));
    s.push(tx(`4. F(t) = −${N2(a / k)}·e^(−${N2(k)}t) (${N2(a)}·${N2(1 / k)} = ${N2(a / k)}).`, `4. F(t) = −${N2(a / k)}·e^(−${N2(k)}t) (${N2(a)}·${N2(1 / k)} = ${N2(a / k)}).`));
    s.push(tx(`5. Temel teorem: D = F(${N2(T)}) − F(0).`, `5. Fundamental theorem: D = F(${N2(T)}) − F(0).`));
    s.push(tx(`6. F(${N2(T)}) = −${N2(a / k)}·e^(${N2(-k * T)}) ≈ −${N2(a / k)}·${F(ex, 4, 0)} = ${N2(-a / k * ex)}; F(0) = −${N2(a / k)}·e⁰ = −${N2(a / k)}.`, `6. F(${N2(T)}) = −${N2(a / k)}·e^(${N2(-k * T)}) ≈ −${N2(a / k)}·${F(ex, 4, 0)} = ${N2(-a / k * ex)}; F(0) = −${N2(a / k)}·e⁰ = −${N2(a / k)}.`));
    s.push(tx(`7. D = ${N2(-a / k * ex)} − (${N2(-a / k)}) = ${N2(a / k)}·(1 − ${F(ex, 4, 0)}) ≈ ${N2(tot)} mg.`, `7. D = ${N2(-a / k * ex)} − (${N2(-a / k)}) = ${N2(a / k)}·(1 − ${F(ex, 4, 0)}) ≈ ${N2(tot)} mg.`));
    s.push(tx(`8. Birim: (mg/saat)·saat = mg; hız pozitif olduğundan doz pozitif ✓. Sınır: T → ∞ için D → a/k = ${N2(a / k)} mg; toplam bu değeri asla aşmaz.`, `8. Units: (mg/h)·h = mg; the rate is positive so the dose is positive ✓. Limit: as T → ∞, D → a/k = ${N2(a / k)} mg; the total never exceeds this value.`));
    s.push(tx(`9. Yorum: ${N2(T)} saatte, üst sınırın %${N2(100 * (1 - ex))}'i verilmiştir.`, `9. Interpretation: after ${N2(T)} hours, ${N2(100 * (1 - ex))}% of the upper limit has been delivered.`));
    break; }
    case 10: {
    let a = x[0], b = x[1], T = x[2];
    let E = a * T + b * T * T * T / 3, avg = E / T;
    s.push(tx(`1. Değişkenler: t = zaman (s), P(t) = ${N2(a)} + ${N2(b)}t² güç (kW), E = enerji (kJ), süre T = ${N2(T)} s.`, `1. Variables: t = time (s), P(t) = ${N2(a)} + ${N2(b)}t² power (kW), E = energy (kJ), duration T = ${N2(T)} s.`));
    s.push(tx(`2. Güç enerjinin harcanma hızıdır: P = dE/dt. Küçük parça: dE = P(t)·dt. Toplam enerji E = ∫₀^${N2(T)} (${N2(a)} + ${N2(b)}t²) dt.`, `2. Power is the rate of energy use: P = dE/dt. Small piece: dE = P(t)·dt. Total energy E = ∫₀^${N2(T)} (${N2(a)} + ${N2(b)}t²) dt.`));
    s.push(tx(`3. Ters türev (kuvvet kuralı): ∫(${N2(a)} + ${N2(b)}t²) dt = ${N2(a)}t + ${N2(b)}t³/3.`, `3. Antiderivative (power rule): ∫(${N2(a)} + ${N2(b)}t²) dt = ${N2(a)}t + ${N2(b)}t³/3.`));
    s.push(tx(`4. Sınırlar: F(${N2(T)}) = ${N2(a)}·${N2(T)} + ${N2(b)}·${N2(T * T * T)}/3 = ${N2(a * T)} + ${N2(b * T * T * T / 3)} = ${N2(E)};  F(0) = 0.`, `4. Limits: F(${N2(T)}) = ${N2(a)}·${N2(T)} + ${N2(b)}·${N2(T * T * T)}/3 = ${N2(a * T)} + ${N2(b * T * T * T / 3)} = ${N2(E)};  F(0) = 0.`));
    s.push(tx(`5. Enerji: E = F(${N2(T)}) − F(0) = ${N2(E)} kJ.`, `5. Energy: E = F(${N2(T)}) − F(0) = ${N2(E)} kJ.`));
    s.push(tx(`6. Birim kontrolü: kW·s = (kJ/s)·s = kJ ✓. Taban güç tek başına ${N2(a * T)} kJ verirdi; t² terimi ek ${N2(b * T * T * T / 3)} kJ ekliyor.`, `6. Unit check: kW·s = (kJ/s)·s = kJ ✓. The base power alone would give ${N2(a * T)} kJ; the t² term adds ${N2(b * T * T * T / 3)} kJ.`));
    s.push(tx(`7. Ortalama güç: P_ort = E / T = ${N2(E)} / ${N2(T)} = ${N2(avg)} kW (P(0) = ${N2(a)} ile P(${N2(T)}) = ${N2(a + b * T * T)} arasında).`, `7. Average power: P_avg = E / T = ${N2(E)} / ${N2(T)} = ${N2(avg)} kW (between P(0) = ${N2(a)} and P(${N2(T)}) = ${N2(a + b * T * T)}).`));
    s.push(tx(`8. Mantık kontrolü: P artan olduğundan ortalama, uç değerlerin ortalaması ${N2((a + a + b * T * T) / 2)} kW'tan küçüktür (eğri yukarı bükey) ✓.`, `8. Sanity check: since P is increasing and concave up, the average is below the mean of the end values ${N2((a + a + b * T * T) / 2)} kW ✓.`));
    s.push(tx(`9. Yorum: ilk ${N2(T)} saniyede motor ${N2(E)} kJ (= ${N2(E / 3600)} kWh) harcar; güç arttıkça enerji doğrusal olmayan biçimde birikir.`, `9. Interpretation: in the first ${N2(T)} seconds the motor uses ${N2(E)} kJ (= ${N2(E / 3600)} kWh); as the power grows the energy accumulates non-linearly.`));
    break; }
    case 11: {
    let a = x[0], b = x[1], q1 = x[2], q2 = x[3];
    let dC = a * (q2 - q1) + b / 2 * (q2 * q2 - q1 * q1);
    s.push(tx(`1. Değişkenler: q = üretilen adet, MC(q) = ${N2(a)} + ${N2(b)}q TL/adet (marjinal maliyet), q₁ = ${N2(q1)}, q₂ = ${N2(q2)}, ΔC = maliyet artışı (TL).`, `1. Variables: q = units produced, MC(q) = ${N2(a)} + ${N2(b)}q TL/unit (marginal cost), q₁ = ${N2(q1)}, q₂ = ${N2(q2)}, ΔC = cost increase (TL).`));
    s.push(tx(`2. Marjinal maliyet toplam maliyetin türevidir: C′(q) = MC(q). Bu yüzden ΔC = C(q₂) − C(q₁) = ∫ MC dq.`, `2. Marginal cost is the derivative of total cost: C′(q) = MC(q). Hence ΔC = C(q₂) − C(q₁) = ∫ MC dq.`));
    s.push(tx(`3. İntegral: ΔC = ∫ ${N2(q1)}^${N2(q2)} (${N2(a)} + ${N2(b)}q) dq.`, `3. Integral: ΔC = ∫ ${N2(q1)}^${N2(q2)} (${N2(a)} + ${N2(b)}q) dq.`));
    s.push(tx(`4. Ters türev: ∫(${N2(a)} + ${N2(b)}q) dq = ${N2(a)}q + ${N2(b / 2)}q².`, `4. Antiderivative: ∫(${N2(a)} + ${N2(b)}q) dq = ${N2(a)}q + ${N2(b / 2)}q².`));
    s.push(tx(`5. Üst sınır: ${N2(a)}·${N2(q2)} + ${N2(b / 2)}·${N2(q2 * q2)} = ${N2(a * q2)} + ${N2(b / 2 * q2 * q2)} = ${N2(a * q2 + b / 2 * q2 * q2)}.`, `5. Upper limit: ${N2(a)}·${N2(q2)} + ${N2(b / 2)}·${N2(q2 * q2)} = ${N2(a * q2)} + ${N2(b / 2 * q2 * q2)} = ${N2(a * q2 + b / 2 * q2 * q2)}.`));
    s.push(tx(`6. Alt sınır: ${N2(a)}·${N2(q1)} + ${N2(b / 2)}·${N2(q1 * q1)} = ${N2(a * q1)} + ${N2(b / 2 * q1 * q1)} = ${N2(a * q1 + b / 2 * q1 * q1)}.`, `6. Lower limit: ${N2(a)}·${N2(q1)} + ${N2(b / 2)}·${N2(q1 * q1)} = ${N2(a * q1)} + ${N2(b / 2 * q1 * q1)} = ${N2(a * q1 + b / 2 * q1 * q1)}.`));
    s.push(tx(`7. Fark: ΔC = ${N2(a * q2 + b / 2 * q2 * q2)} − ${N2(a * q1 + b / 2 * q1 * q1)} = ${N2(dC)} TL.`, `7. Difference: ΔC = ${N2(a * q2 + b / 2 * q2 * q2)} − ${N2(a * q1 + b / 2 * q1 * q1)} = ${N2(dC)} TL.`));
    s.push(tx(`8. Kontrol (yamuk alanı): MC(${N2(q1)}) = ${N2(a + b * q1)}, MC(${N2(q2)}) = ${N2(a + b * q2)}; MC doğrusal olduğundan alan = ortalama yükseklik × genişlik = ${N2((2 * a + b * (q1 + q2)) / 2)}·${N2(q2 - q1)} = ${N2(dC)} ✓.`, `8. Check (trapezoid area): MC(${N2(q1)}) = ${N2(a + b * q1)}, MC(${N2(q2)}) = ${N2(a + b * q2)}; since MC is linear the area = average height × width = ${N2((2 * a + b * (q1 + q2)) / 2)}·${N2(q2 - q1)} = ${N2(dC)} ✓.`));
    s.push(tx(`9. Yorum: ${N2(q2 - q1)} adetlik ek üretim toplam maliyeti ${N2(dC)} TL artırır; ortalama ek maliyet adet başına ${N2(dC / (q2 - q1))} TL'dir (sabit maliyet bu farkta sadeleşir).`, `9. Interpretation: producing ${N2(q2 - q1)} more units raises the total cost by ${N2(dC)} TL; the average extra cost is ${N2(dC / (q2 - q1))} TL per unit (the fixed cost cancels in this difference).`));
    break; }
    }
    return s;
  }


  function draw(canvas, problem) {
    let x = problem.p;
    let accent = canvas.accent();
    switch (problem.scn) {
    case 0: {
    let a = x[0], b = x[1], T = x[2];
    let f = (u) => a * u * u + b;
    let top = f(T);
    canvas.setViewport(-T * 0.12, T * 1.25, -top * 0.12, top * 1.25);
    Shade(canvas, f, 0, T, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: T, y: top, color: canvas.gold(), radius: 7.0, label: `v(${N2(T)}) = ${N2(top)}` });
    break; }
    case 1: {
    let a = x[0], b = x[1], T = x[2];
    let f = (u) => a + b * u;
    let top = f(T);
    canvas.setViewport(-T * 0.12, T * 1.25, -top * 0.12, top * 1.25);
    Shade(canvas, f, 0, T, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: T, y: top, color: canvas.gold(), radius: 7.0, label: `r(${N2(T)}) = ${N2(top)}` });
    break; }
    case 2: {
    let k = x[0], d = x[1];
    let f = (v) => k * v;
    let top = k * d;
    canvas.setViewport(-d * 0.12, d * 1.25, -top * 0.12, top * 1.25);
    Shade(canvas, f, 0, d, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: d, y: top, color: canvas.gold(), radius: 7.0, label: `F(${N2(d)}) = ${N2(top)}` });
    break; }
    case 3: {
    let a = x[0], b = x[1], L = x[2];
    let f = (v) => a + b * v * v;
    let top = f(L);
    let avg = a + b * L * L / 3;
    canvas.setViewport(-L * 0.12, L * 1.25, -top * 0.12, top * 1.25);
    Shade(canvas, f, 0, L, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'horizontal', position: avg, color: canvas.gray(), label: `T̄ = ${N2(avg)}` });
    canvas.addMarker({ x: L, y: top, color: canvas.gold(), radius: 7.0, label: `T(${N2(L)}) = ${N2(top)}` });
    break; }
    case 4: {
    let k = x[0], m = x[1];
    let r = (v) => k * m * v;
    let c = (v) => k * v * v;
    let g = (v) => k * (m * v - v * v);
    let top = k * m * m;
    canvas.setViewport(-m * 0.12, m * 1.25, -top * 0.12, top * 1.2);
    Shade(canvas, g, 0, m, canvas.green());
    canvas.addFunction({ evaluator: safe(r), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe(c), color: canvas.red(), thickness: 3.0 });
    canvas.addFunction({ evaluator: safe(g), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: m, y: k * m * m, color: canvas.gold(), radius: 7.0, label: tx("başabaş", "break-even") });
    break; }
    case 5: {
    let a = x[0], T = x[1];
    let f = (u) => a * u * (T - u);
    let top = a * T * T / 4;
    canvas.setViewport(-T * 0.12, T * 1.15, -top * 0.2, top * 1.3);
    Shade(canvas, f, 0, T, canvas.blue());
    canvas.addFunction({ evaluator: safe((u) => (u < 0 || u > T ? NaN : f(u))), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: T / 2, y: top, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `(${N2(T / 2)}, ${N2(top)})` });
    break; }
    case 6: {
    let a = x[0], b = x[1], L = x[2];
    let f = (v) => a + b * v * v;
    let top = f(L);
    canvas.setViewport(-L * 0.12, L * 1.25, -top * 0.12, top * 1.25);
    Shade(canvas, f, 0, L, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: L, y: top, color: canvas.gold(), radius: 7.0, label: `ρ(${N2(L)}) = ${N2(top)}` });
    break; }
    case 7: {
    let a = x[0], T = x[1];
    let f = (u) => a * (u - 3);
    let lo = Math.min(-3 * a, 0), hi = Math.max(a * (T - 3), 0);
    let pad = Math.max(hi - lo, 1) * 0.2;
    canvas.setViewport(-T * 0.1, T * 1.15, lo - pad, hi + pad);
    Shade(canvas, f, 0, T, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: 3, y: 0, color: canvas.gold(), radius: 7.0, label: "t = 3" });
    break; }
    case 8: {
    let a = x[0], mth = Math.round(x[1]);
    let f = (u) => a * u * u;
    canvas.setViewport(-0.5, 4.8, -a * 1.6, a * 18);
    for (let i = 0; i <= 3; i++) {
    let tv = (mth === 1 ? i : (mth === 2 ? i + 1 : i + 0.5));
    let h = a * tv * tv;
    Shade(canvas, (u) => h, i, i + 1, canvas.green());
    canvas.addMarker({ x: tv, y: h, color: canvas.gold(), radius: 5.0 });
    }
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    break; }
    case 9: {
    let a = x[0], k = x[1], T = x[2];
    let f = (u) => a * Math.exp(-k * u);
    canvas.setViewport(-T * 0.1, T * 1.3, -a * 0.12, a * 1.2);
    Shade(canvas, f, 0, T, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: T, y: f(T), color: canvas.gold(), radius: 7.0, label: `R(${N2(T)}) = ${N2(f(T))}` });
    break; }
    case 10: {
    let a = x[0], b = x[1], T = x[2];
    let P = (u) => (u < 0 || u > T * 1.25 ? NaN : a + b * u * u);
    let top = a + b * T * T * 1.25 * 1.25;
    canvas.setViewport(-T * 0.1, T * 1.35, -top * 0.1, top * 1.2);
    Shade(canvas, P, 0, T, canvas.blue());
    canvas.addFunction({ evaluator: safe(P), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: T, color: canvas.gray(), label: `T = ${N2(T)}` });
    canvas.addMarker({ x: T, y: a + b * T * T, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `E = ${N2(a * T + b * T * T * T / 3)} kJ` });
    break; }
    case 11: {
    let a = x[0], b = x[1], q1 = x[2], q2 = x[3];
    let MC = (u) => (u < 0 || u > q2 * 1.2 ? NaN : a + b * u);
    let top = a + b * q2 * 1.2;
    canvas.setViewport(-q2 * 0.1, q2 * 1.3, -top * 0.1, top * 1.2);
    Shade(canvas, MC, q1, q2, canvas.blue());
    canvas.addFunction({ evaluator: safe(MC), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: q1, color: canvas.gray(), label: `q₁ = ${N2(q1)}` });
    canvas.addGuideLine({ axis: 'vertical', position: q2, color: canvas.gray(), label: `q₂ = ${N2(q2)}` });
    canvas.addMarker({ x: q2, y: a + b * q2, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `ΔC = ${N2(a * (q2 - q1) + b / 2 * (q2 * q2 - q1 * q1))} TL` });
    break; }
    }
  }



  function focus(problem) {
    const x = problem.p;
    let r;
    switch (problem.scn) {
    case 0: r = [x[2] / 2, (x[0] * (x[2] / 2) ** 2 + x[1]) / 2]; break;
    case 1: r = [x[2] / 2, (x[0] + x[1] * x[2] / 2) / 2]; break;
    case 2: r = [x[1] / 2, x[0] * x[1] / 4]; break;
    case 3: r = [x[2] / 2, (x[0] + x[1] * (x[2] / 2) ** 2) / 2]; break;
    case 4: { const h = x[1] / 2; r = [h, x[0] * (x[1] * h - h * h) / 2]; break; }
    case 5: r = [x[1] / 2, x[0] * x[1] * x[1] / 8]; break;
    case 6: r = [x[2] / 2, (x[0] + x[1] * (x[2] / 2) ** 2) / 2]; break;
    case 7: { const a = x[0], T = x[1]; r = [T / 2, (Math.min(-3 * a, 0) + Math.max(a * (T - 3), 0)) / 2]; break; }
    case 8: r = [2, 8 * x[0]]; break;
    case 9: r = [x[2] / 2, x[0] * Math.exp(-x[1] * x[2] / 2) / 2]; break;
    case 10: r = [x[2] / 2, (x[0] + x[1] * (x[2] / 2) ** 2) / 2]; break;
    case 11: { const m = (x[2] + x[3]) / 2; r = [m, (x[0] + x[1] * m) / 2]; break; }
    default: return null;
    }
    return (Number.isFinite(r[0]) && Number.isFinite(r[1])) ? { x: r[0], y: r[1] } : null;
  }

  function Info(scn) {
    switch (scn) {
    case 0: return tx("Birimler: v m/s, t s, yol m. Fiziksel anlam: hız–zaman eğrisinin altındaki alan alınan yoldur; hız hep pozitif olduğundan yol = yer değiştirme.", "Units: v in m/s, t in s, distance in m. Physical meaning: the area under the velocity–time curve is the distance travelled; since v > 0 throughout, distance = displacement.");
    case 1: return tx("Birimler: r L/dk, t dk, hacim L. Fiziksel anlam: debi–zaman eğrisinin altındaki alan, depoya giren toplam suyu verir.", "Units: r in L/min, t in min, volume in L. Physical meaning: the area under the flow-rate curve is the total water entering the tank.");
    case 2: return tx("Birimler: F N, x m, iş J (N·m). Fiziksel anlam: kuvvet–uzama eğrisinin altındaki alan yaya depolanan enerjidir (üçgen alan ½·k·d²).", "Units: F in N, x in m, work in J (N·m). Physical meaning: the area under the force–extension curve is the energy stored in the spring (a triangle, ½·k·d²).");
    case 3: return tx("Birimler: T °C, x m. Fiziksel anlam: ortalama sıcaklık = (toplam alan)/(uzunluk); çubuk boyunca sürekli ölçülen sıcaklıkların gerçek ortalamasıdır.", "Units: T in °C, x in m. Physical meaning: average temperature = (total area)/(length); the true mean of the temperature measured continuously along the bar.");
    case 4: return tx("Birimler: R ve C bin TL, x bin adet, alan bin TL × bin adet = milyon TL cinsinden birikmiş kâr. Fiziksel anlam: iki eğri arasındaki alan, gelirin giderden fazla olduğu bölgedeki toplam kâr birikimidir.", "Units: R and C in thousand TL, x in thousand units; the area is accumulated profit in (thousand TL)·(thousand units). Physical meaning: the area between the two curves is the total profit gathered where revenue exceeds cost.");
    case 5: return tx("Birimler: I mA, t s, yük mC (mA·s). Fiziksel anlam: akım–zaman eğrisinin altındaki alan devreden geçen toplam elektrik yüküdür.", "Units: I in mA, t in s, charge in mC (mA·s). Physical meaning: the area under the current–time curve is the total electric charge passing through the circuit.");
    case 6: return tx("Birimler: ρ kg/m, x m, kütle kg. Fiziksel anlam: yoğunluk eğrisinin altındaki alan, çubuğun parçalarının kütlelerinin toplamıdır.", "Units: ρ in kg/m, x in m, mass in kg. Physical meaning: the area under the density curve is the sum of the masses of the rod's slices.");
    case 7: return tx("Birimler: r ton/saat, t saat, stok değişimi ton. Fiziksel anlam: eksenin üstü stok artışı, altı stok azalışıdır; net değişim ikisinin farkıdır.", "Units: r in tonnes/h, t in h, stock change in tonnes. Physical meaning: above the axis the stock rises, below it the stock falls; the net change is their difference.");
    case 8: return tx("Birimler: q L/s, t s, hacim L. Fiziksel anlam: ölçümlerden yapılan dikdörtgen toplamı, gerçek hacmi yaklaşık verir; sol toplam artan bir debide eksik, sağ toplam fazla tahmin eder.", "Units: q in L/s, t in s, volume in L. Physical meaning: a rectangle sum built from measurements approximates the true volume; for an increasing flow the left sum under- and the right sum over-estimates.");
    case 9: return tx("Birimler: R mg/saat, t saat, doz mg. Fiziksel anlam: sönen ilaç hızının altındaki alan toplam verilen dozdur; T → ∞ iken doz a/k değerine yaklaşır.", "Units: R in mg/h, t in h, dose in mg. Physical meaning: the area under the decaying delivery rate is the total dose given; as T → ∞ the dose tends to a/k.");
    case 10: return tx("Birimler: P kW, t s, enerji kJ (kW·s). Fiziksel anlam: güç–zaman eğrisinin altındaki alan harcanan enerjidir; ortalama güç = enerji/süre.", "Units: P in kW, t in s, energy in kJ (kW·s). Physical meaning: the area under the power–time curve is the energy used; average power = energy/time.");
    case 11: return tx("Birimler: MC TL/adet, q adet, maliyet TL. Fiziksel anlam: marjinal maliyet, bir adet daha üretmenin ek maliyetidir; q₁'den q₂'ye toplam maliyet artışı onun altındaki alandır.", "Units: MC in TL/unit, q in units, cost in TL. Physical meaning: marginal cost is the extra cost of one more unit; the total cost increase from q₁ to q₂ is the area under it.");
    default: return '';
    }
  }


  function Overview() {
    return tx("HAYATTAN İNTEGRAL ÖRNEKLERİ\nBir şeyin DEĞİŞİM HIZI biliniyorsa, o şeyin TOPLAM miktarı integralle bulunur. Hız → yol, debi → hacim, kuvvet → iş, güç → enerji, akım → yük, yoğunluk → kütle, marjinal maliyet → toplam maliyet.\n\nTANIM VE FORMÜLLER\n• Belirli integral: ∫ₐᵇ f(x) dx = lim Σ f(xᵢ*)·Δx = F(b) − F(a) (F′ = f).\n• Net değişim: bir niceliğin hızı r(t) ise a'dan b'ye NET DEĞİŞİM = ∫ₐᵇ r dt.\n• Yol / yer değiştirme: s = ∫ v dt. Hacim: V = ∫ debi dt. İş: W = ∫ F dx. Enerji: E = ∫ P dt. Yük: Q = ∫ I dt. Kütle: m = ∫ ρ dx.\n• Ortalama değer: f_ort = (1/(b − a))·∫ₐᵇ f dx.\n• İki eğri arası alan: ∫ₐᵇ [üst(x) − alt(x)] dx.\n• Riemann toplamı: Sₙ = Δx·Σ f(xᵢ*), Δx = (b − a)/n; n → ∞ iken integrale yakınsar.\n• Üstel sönüm: ∫₀ᵀ a·e^(−kt) dt = (a/k)(1 − e^(−kT)).\n\nYÖNTEM\n1. Hız (değişim hızı) fonksiyonunu ve birimini yaz: örn. r(t) litre/dakika.\n2. \"Küçük parça\" düşün: dQ = r(t)·dt; toplam = bütün parçaların toplamı.\n3. Sınırları belirle (süre, uzunluk, uzama).\n4. Ters türevi al, F(b) − F(a) hesapla.\n5. Birimi kontrol et: (hız birimi) × (değişken birimi) = toplam birimi.\n6. Sonucu yorumla; işaret değiştiren hızda net değişim ile toplam hareketi ayırt et.\n\nÖZEL DURUMLAR VE TUZAKLAR\n• Hız sabitse integral basit çarpıma iner (toplam = hız × süre).\n• Hız işaret değiştiriyorsa NET değişim ≠ toplam hareket; toplam için ∫|r| dt.\n• Ortalama değer \"iki uç değerin ortalaması\" değildir (önce integral, sonra uzunluğa böl).\n• Gelir − gider alanında hangi eğrinin üstte olduğuna dikkat edin.\n• Ölçüm verisiyle çalışırken tam integral yoktur: Riemann toplamı yaklaşıktır, yönteme göre fazla/eksik olabilir.\n\nMİNİ ÖRNEK\nv(t) = 6t m/s: ilk 4 s'de yol = ∫₀⁴ 6t dt = [3t²]₀⁴ = 48 m; ortalama hız = 48/4 = 12 m/s.\n\nHAFIZA KURALI\n\"Hızı topla, miktarı bul\": her küçük dt'de hız·dt kadar miktar birikir; integral bu toplamdır.",
      "REAL-LIFE INTEGRAL EXAMPLES\nIf the RATE OF CHANGE of something is known, its TOTAL amount is found with an integral. Velocity → distance, flow rate → volume, force → work, power → energy, current → charge, density → mass, marginal cost → total cost.\n\nDEFINITIONS AND FORMULAS\n• Definite integral: ∫ₐᵇ f(x) dx = lim Σ f(xᵢ*)·Δx = F(b) − F(a) (F′ = f).\n• Net change: if a quantity has rate r(t), the NET CHANGE from a to b is ∫ₐᵇ r dt.\n• Distance / displacement: s = ∫ v dt. Volume: V = ∫ flow dt. Work: W = ∫ F dx. Energy: E = ∫ P dt. Charge: Q = ∫ I dt. Mass: m = ∫ ρ dx.\n• Average value: f_avg = (1/(b − a))·∫ₐᵇ f dx.\n• Area between two curves: ∫ₐᵇ [upper(x) − lower(x)] dx.\n• Riemann sum: Sₙ = Δx·Σ f(xᵢ*), Δx = (b − a)/n; it converges to the integral as n → ∞.\n• Exponential decay: ∫₀ᵀ a·e^(−kt) dt = (a/k)(1 − e^(−kT)).\n\nMETHOD\n1. Write the rate function and its unit, e.g. r(t) in litres/minute.\n2. Think of a \"small piece\": dQ = r(t)·dt; the total is the sum of all pieces.\n3. Fix the limits (duration, length, extension).\n4. Take the antiderivative and compute F(b) − F(a).\n5. Check the unit: (rate unit) × (variable unit) = total unit.\n6. Interpret the result; when the rate changes sign distinguish net change from total movement.\n\nSPECIAL CASES AND PITFALLS\n• If the rate is constant the integral reduces to a simple product (total = rate × time).\n• If the rate changes sign NET change ≠ total movement; for the total use ∫|r| dt.\n• The average value is not \"the mean of the two end values\" (integrate first, then divide by the length).\n• In a revenue − cost area watch which curve is on top.\n• With measured data there is no exact integral: the Riemann sum is approximate and may over- or under-estimate depending on the method.\n\nMINI EXAMPLE\nv(t) = 6t m/s: distance in the first 4 s = ∫₀⁴ 6t dt = [3t²]₀⁴ = 48 m; average speed = 48/4 = 12 m/s.\n\nMEMORY AID\n\"Add up the rate to get the amount\": in every small dt an amount rate·dt accumulates; the integral is that sum.");
  }

  function problemStatement(problem) { return Question(problem); }

  function concept(problem) {
    const head = Overview() + '\n\n' + tx('SENARYO', 'SCENARIO') + '\n' + Titles()[problem.scn] + '\n\n' + Info(problem.scn) + '\n\n';
    if (showMeaning) {
      return head + tx('BU SORUDA MATEMATİKSEL OLARAK NE İSTENİYOR?', 'WHAT IS THIS QUESTION ASKING, MATHEMATICALLY?') + '\n' + Meaning(problem);
    }
    return head + tx(
      "(Çözmeden önce sorunun matematiksel karşılığını görmek için 'Soru ne demek istiyor?' düğmesine basabiliriz.)",
      "(To see what the question means mathematically before solving, we can press the 'What does the question mean?' button.)");
  }

  function syncSliders(problem) {
    const specs = Specs(problem.scn);
    for (let i = 0; i < sliderRows.length; i++) {
      const row = sliderRows[i];
      if (i >= specs.length) { row.block.style.display = 'none'; continue; }
      const sp = specs[i];
      row.block.style.display = '';
      row.captionEl.textContent = sp.caption;
      const v = problem.p[i];
      row.valueEl.textContent = fmt2(v);
      const ratio = (v - sp.min) / (sp.max - sp.min);
      row.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
    }
  }

  function createProblem(rng) {
    if (randomScenario) {
      currentScenario = rng.nextInt(0, Titles().length);
      if (selectReg) selectReg.refreshFromModel();
    }
    const scn = currentScenario;
    const specs = Specs(scn);
    const p = [0, 0, 0, 0, 0];
    for (let i = 0; i < specs.length; i++) {
      const sp = specs[i];
      const count = Math.round((sp.max - sp.min) / sp.step);
      p[i] = Math.round((sp.min + sp.step * rng.nextInt(0, count + 1)) * 10000) / 10000;
    }
    const prob = { scn, p };
    syncSliders(prob);
    return prob;
  }

  function buildControls(rightCol, getProblem, helpers) {
    selectReg = helpers.addSelect({
      options: Titles().map((label, value) => ({ label, value })),
      get: () => currentScenario,
      set: (v) => { currentScenario = Number(v); helpers.regenerate(); },
    });

    helpers.addCheckbox({
      caption: tx('Yeni örnekte senaryoyu da rastgele seç', 'Also pick a random scenario on a new example'),
      get: () => randomScenario,
      set: (v) => { randomScenario = !!v; },
    });

    const meaningBtn = document.createElement('button');
    meaningBtn.className = 'flat-btn';
    function updateMeaningLabel() {
      meaningBtn.textContent = showMeaning
        ? tx('Soru ne demek istiyor? (Gizle)', 'What does the question mean? (Hide)')
        : tx('Soru ne demek istiyor? (Göster)', 'What does the question mean? (Show)');
    }
    updateMeaningLabel();
    meaningBtn.addEventListener('click', () => {
      showMeaning = !showMeaning;
      updateMeaningLabel();
      helpers.refresh();
    });
    rightCol.appendChild(meaningBtn);

    sliderRows = [];
    for (let i = 0; i < 5; i++) {
      const idx = i;
      const block = document.createElement('div');
      block.className = 'we-slider-block';
      const captionEl = document.createElement('div');
      captionEl.className = 'we-slider-caption';
      const valueEl = document.createElement('div');
      valueEl.className = 'we-slider-value';
      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'we-slider';
      input.min = '0'; input.max = '1000'; input.step = '1';
      block.appendChild(captionEl);
      block.appendChild(valueEl);
      block.appendChild(input);
      rightCol.appendChild(block);

      input.addEventListener('input', () => {
        const specs = Specs(getProblem().scn);
        if (idx >= specs.length) return;
        const sp = specs[idx];
        const ratio = Number(input.value) / 1000;
        let v = sp.min + ratio * (sp.max - sp.min);
        v = Math.round(v / sp.step) * sp.step;
        v = Math.max(sp.min, Math.min(sp.max, v));
        getProblem().p[idx] = Math.round(v * 10000) / 10000;
        valueEl.textContent = fmt2(getProblem().p[idx]);
        helpers.refresh();
      });
      sliderRows.push({ block, captionEl, valueEl, input });
    }
    syncSliders(getProblem());

    if (offLangCustom) offLangCustom();
    offLangCustom = I18N.onChange(() => {
      const titles = Titles();
      for (let i = 0; i < selectReg.select.options.length && i < titles.length; i++) {
        selectReg.select.options[i].textContent = titles[i];
      }
      updateMeaningLabel();
      syncSliders(getProblem());
    });
  }

  // links: an example of one scenario (or a random one of a list); selector is refreshed like a manual choice
  const makeScn = (list) => (rng) => {
    const old = randomScenario;
    randomScenario = false;
    currentScenario = list.length === 1 ? list[0] : rng.pick(list);
    if (selectReg) selectReg.refreshFromModel();
    try { return createProblem(rng); } finally { randomScenario = old; }
  };

  Topics.register('integrals', {
    id: 'realLifeIntegrals',
    tabTitle: () => tx('Hayattan Örnekler', 'Real-Life Examples'),
    concept,
    problemStatement,
    createProblem,
    solveSteps: Steps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^• (Net değişim|Net change):/, make: makeScn([7]) },
      { match: /^• (Yol \/ yer değiştirme|Distance \/ displacement):/, make: makeScn([0, 1, 2, 5, 6, 10]) },
      { match: /^• (Ortalama değer|Average value):/, make: makeScn([3]) },
      { match: /^• (İki eğri arası alan|Area between two curves):/, make: makeScn([4]) },
      { match: /^• (Riemann toplamı|Riemann sum):/, make: makeScn([8]) },
      { match: /^• (Üstel sönüm|Exponential decay):/, make: makeScn([9]) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
  });
})();
