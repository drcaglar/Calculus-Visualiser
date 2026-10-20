// Ported from Modules/Limits/RealLifeLimitsControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/trig/realLifeTrig.js): nine ported scenarios (limit at infinity, instantaneous rate, removable gap,
// jump, pole, steady state, continuity constant, squeeze, one-sided limits) plus five NEW ones
// (terminal velocity, drug concentration, valve/pipe pole, thermal expansion, fatigue endurance limit).
// problem = { scn, p: [5 numbers] } (mirrors RlProblem). Module-level state survives "New Example".
(function () {
  let currentScenario = 0;
  let showMeaning = false;
  let sliderRows = [];
  let offLangCustom = null;

  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v);
  const Spec = (caption, min, max, step) => ({ caption, min, max, step });
  // up to `dec` decimals, at least one decimal (VB 0.0# / 0.0## / 0.###)
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
  const G = 9.8;

  function Titles() {
    return [
      tx('1. Sonsuzdaki limit: otomobilin son hızı', '1. Limit at infinity: car top speed'),
      tx('2. Ortalama hızdan anlık hıza limit', '2. Instantaneous speed as a limit of averages'),
      tx('3. Giderilebilir kesinti: verimlilik modeli', '3. Removable gap: efficiency model'),
      tx('4. Sıçrama süreksizliği: kargo tarifesi', '4. Jump discontinuity: parcel tariff'),
      tx('5. Sonsuz limit: daralan aralıkta kuvvet', '5. Infinite limit: force at a vanishing gap'),
      tx('6. Kararlı hal: kondansatör gerilimi', '6. Steady state: capacitor voltage'),
      tx('7. Süreklilik: parçalı tanımda sabiti bulma', '7. Continuity: find the constant of a piecewise model'),
      tx('8. Sıkıştırma: sönümlü titreşim', '8. Squeeze: damped vibration'),
      tx('9. Tek taraflı limitler: termostat anahtarı', '9. One-sided limits: thermostat switch'),
      tx('10. Sonsuzdaki limit: serbest düşmede son hız', '10. Limit at infinity: terminal velocity in free fall'),
      tx('11. Sonsuzda sıfır: ilaç derişimi', '11. Limit zero at infinity: drug concentration'),
      tx('12. Çift taraflı sonsuz limit: vana ve boru akışı', '12. Two-sided infinite limit: valve and pipe flow'),
      tx('13. Limit olarak türev: ısıl genleşme', '13. Derivative as a limit: thermal expansion'),
      tx('14. Yatay asimptot: yorulma dayanım sınırı', '14. Horizontal asymptote: fatigue endurance limit'),
    ];
  }

  function Specs(scn) {
    switch (scn) {
      case 0: return [Spec(tx('Son hız V (km/sa)', 'Top speed V (km/h)'), 20, 60, 10), Spec(tx('Sabit c (s)', 'Constant c (s)'), 2, 6, 1), Spec(tx('Sorulan an t (s)', 'Time asked t (s)'), 10, 50, 10)];
      case 1: return [Spec(tx('a (s = a·t² + b·t)', 'a (s = a·t² + b·t)'), 1, 5, 1), Spec('b', 1, 9, 1), Spec(tx('Anlık hız anı t₀ (s)', 'Instant t₀ (s)'), 1, 5, 1)];
      case 2: return [Spec(tx('Ölçek m', 'Scale m'), 1, 4, 1), Spec(tx('Kesinti noktası c', 'Gap point c'), 2, 8, 1)];
      case 3: return [Spec(tx('Birim fiyat p (TL/kg)', 'Unit price p (TL/kg)'), 2, 6, 1), Spec(tx('Eşik T (kg)', 'Threshold T (kg)'), 5, 10, 1), Spec(tx('Ek ücret F (TL)', 'Extra fee F (TL)'), 10, 40, 10)];
      case 4: return [Spec(tx('Sabit k (F = k/d²)', 'Constant k (F = k/d²)'), 1, 9, 1), Spec(tx('Ölçülen aralık d (mm)', 'Measured gap d (mm)'), 0.5, 2, 0.5)];
      case 5: return [Spec(tx('Kaynak gerilimi V₀ (V)', 'Source voltage V₀ (V)'), 5, 12, 1), Spec(tx('Zaman sabiti τ (s)', 'Time constant τ (s)'), 1, 4, 1), Spec(tx("Sorulan an (τ'nun katı)", 'Time asked (multiple of τ)'), 1, 5, 1)];
      case 6: return [Spec(tx('Sol eğim a', 'Left slope a'), 1, 4, 1), Spec(tx('Geçiş noktası c', 'Switch point c'), 1, 4, 1), Spec(tx('Sağ parça sabiti d', 'Right-piece constant d'), 1, 5, 1)];
      case 7: return [Spec(tx('Genlik katsayısı k', 'Amplitude factor k'), 1, 5, 1)];
      case 8: return [Spec(tx('Anahtarlama gücü m (W)', 'Switching power m (W)'), 1, 5, 1), Spec(tx('Eşik sıcaklık c (°C)', 'Threshold temperature c (°C)'), 10, 30, 5)];
      case 9: return [Spec(tx('Son hız vₜ (m/s)', 'Terminal speed vₜ (m/s)'), 20, 60, 10), Spec(tx('Sorulan an t (s)', 'Time asked t (s)'), 2, 10, 2)];
      case 10: return [Spec(tx('Doz katsayısı D (mg/L/sa)', 'Dose factor D (mg/L per h)'), 10, 50, 10), Spec(tx('Zaman ölçeği τ (sa)', 'Time scale τ (h)'), 1, 4, 1), Spec(tx("Sorulan an (τ'nun katı)", 'Time asked (multiple of τ)'), 1, 6, 1)];
      case 11: return [Spec(tx('Sabit k (v = k/(x−c)²)', 'Constant k (v = k/(x−c)²)'), 1, 9, 1), Spec(tx('Oturma yeri c (mm)', 'Seat position c (mm)'), 2, 8, 1), Spec(tx('Ölçüm uzaklığı |x−c| (mm)', 'Measurement distance |x−c| (mm)'), 0.5, 2, 0.5)];
      case 12: return [Spec(tx('a (0.01 mm/°C)', 'a (0.01 mm/°C)'), 1, 5, 1), Spec(tx('b (0.0001 mm/°C²)', 'b (0.0001 mm/°C²)'), 1, 5, 1), Spec(tx('Sıcaklık T₀ (°C)', 'Temperature T₀ (°C)'), 20, 80, 20)];
      default: return [Spec(tx('Dayanım sınırı Sₑ (MPa)', 'Endurance limit Sₑ (MPa)'), 150, 350, 50), Spec(tx('Statik dayanım B (MPa)', 'Static strength B (MPa)'), 600, 1000, 200), Spec(tx('Döngü N (×10⁴)', 'Cycles N (×10⁴)'), 5, 50, 5)];
    }
  }

  // ---- helper numerics shared by steps/draw ----
  const lenFn = (x) => (T) => 200 + 0.01 * x[0] * T + 0.0001 * x[1] * T * T; // scenario 13 (index 12)

  function Question(p) {
    const x = p.p;
    switch (p.scn) {
      case 0:
        return tx(`Bir otomobilin hızı, gaza basıldıktan t saniye sonra v(t) = ${N2(x[0])}·t / (t + ${N2(x[1])}) km/sa ile modelleniyor. Uzun süre gaz verilirse hız hangi değere yaklaşır (t → ∞)? Ayrıca t = ${N2(x[2])} s anında hız nedir?`,
          `The speed of a car t seconds after the accelerator is pressed is modelled by v(t) = ${N2(x[0])}·t / (t + ${N2(x[1])}) km/h. If the car accelerates for a very long time, what value does the speed approach (t → ∞)? Also, what is the speed at t = ${N2(x[2])} s?`);
      case 1:
        return tx(`Bir robot kolunun ucunun konumu s(t) = ${N2(x[0])}t² + ${N2(x[1])}t metredir (t saniye). t = ${N2(x[2])} s anındaki ANLIK hızı, ortalama hızların limiti olarak bulalım: lim (h→0) [s(${N2(x[2])} + h) − s(${N2(x[2])})] / h.`,
          `The position of a robot arm tip is s(t) = ${N2(x[0])}t² + ${N2(x[1])}t metres (t in seconds). Let's find the INSTANTANEOUS speed at t = ${N2(x[2])} s as the limit of average speeds: lim (h→0) [s(${N2(x[2])} + h) − s(${N2(x[2])})] / h.`);
      case 2:
        return tx(`Bir motorun verimlilik modeli E(x) = ${N2(x[0])}·(x² − ${N2(x[1] * x[1])}) / (x − ${N2(x[1])}) şeklindedir (x: yük). x = ${N2(x[1])} noktasında formül 0/0 verir. Yük ${N2(x[1])}'e yaklaşırken E(x) hangi değere yaklaşır?`,
          `The efficiency model of a motor is E(x) = ${N2(x[0])}·(x² − ${N2(x[1] * x[1])}) / (x − ${N2(x[1])}) (x: load). At x = ${N2(x[1])} the formula gives 0/0. What value does E(x) approach as the load approaches ${N2(x[1])}?`);
      case 3:
        return tx(`Bir kargo firması ${N2(x[1])} kg'a kadar (dahil) kilo başına ${N2(x[0])} TL alıyor; ${N2(x[1])} kg'ı aşan paketlere ayrıca ${N2(x[2])} TL büyük paket ücreti ekleniyor. Ücret C(w) fonksiyonu için w → ${N2(x[1])} iken soldan ve sağdan limitleri bulalım. Limit var mı? C sürekli mi?`,
          `A parcel company charges ${N2(x[0])} TL per kg up to and including ${N2(x[1])} kg; parcels heavier than ${N2(x[1])} kg get an extra ${N2(x[2])} TL oversize fee. For the price function C(w) let's find the left and right limits as w → ${N2(x[1])}. Does the limit exist? Is C continuous?`);
      case 4:
        return tx(`İki mıknatıs arasındaki çekim kuvveti aralığa bağlı F(d) = ${N2(x[0])} / d² (N) ile modelleniyor (d: mm). Aralık d = ${N2(x[1])} mm iken F nedir? Aralık sıfıra yaklaşırken (d → 0⁺) F'ye ne olur?`,
          `The attraction force between two magnets depends on the gap as F(d) = ${N2(x[0])} / d² (N), d in mm. What is F at a gap of d = ${N2(x[1])} mm? What happens to F as the gap shrinks to zero (d → 0⁺)?`);
      case 5:
        return tx(`Boş bir kondansatör ${N2(x[0])} V'luk kaynağa bağlanıyor. Gerilimi V(t) = ${N2(x[0])}·(1 − e^(−t/${N2(x[1])})) volttur (t saniye). t → ∞ iken gerilim hangi değere yaklaşır? t = ${N2(x[2] * x[1])} s anında gerilim nedir?`,
          `An empty capacitor is connected to a ${N2(x[0])} V source. Its voltage is V(t) = ${N2(x[0])}·(1 − e^(−t/${N2(x[1])})) volts (t in seconds). What value does the voltage approach as t → ∞? What is the voltage at t = ${N2(x[2] * x[1])} s?`);
      case 6:
        return tx(`Bir sürücü yazılımı bir ayar eğrisini iki parça olarak tanımlıyor: x < ${N2(x[1])} için f(x) = ${N2(x[0])}x + b, x ≥ ${N2(x[1])} için f(x) = x² − ${N2(x[2])}. Eğrinin x = ${N2(x[1])} noktasında kopmaması (SÜREKLİ olması) için b sabiti kaç olmalıdır?`,
          `A driver software defines a tuning curve in two pieces: f(x) = ${N2(x[0])}x + b for x < ${N2(x[1])} and f(x) = x² − ${N2(x[2])} for x ≥ ${N2(x[1])}. What must the constant b be so that the curve has no break (is CONTINUOUS) at x = ${N2(x[1])}?`);
      case 7:
        return tx(`Bir makine gövdesinin sönümlü titreşimi y(x) = ${N2(x[0])}·x²·sin(1/x) ile modelleniyor (x: sönüm parametresi, x ≠ 0). sin(1/x) x → 0 iken sürekli salındığı hâlde, x → 0 iken y(x)'in limitini bulabilir miyiz?`,
          `The damped vibration of a machine housing is modelled by y(x) = ${N2(x[0])}·x²·sin(1/x) (x: damping parameter, x ≠ 0). Although sin(1/x) keeps oscillating as x → 0, can we find the limit of y(x) as x → 0?`);
      case 8:
        return tx(`Bir termostat sıcaklık T iken ısı akış gücünü P(T) = ${N2(x[0])}·|T − ${N2(x[1])}| / (T − ${N2(x[1])}) W olarak veriyor (T ≠ ${N2(x[1])}). T → ${N2(x[1])} iken soldan ve sağdan limitleri bulalım. İki taraflı limit var mı?`,
          `A thermostat outputs a heat-flow power P(T) = ${N2(x[0])}·|T − ${N2(x[1])}| / (T − ${N2(x[1])}) W at temperature T (T ≠ ${N2(x[1])}). Let's find the left and right limits as T → ${N2(x[1])}. Does the two-sided limit exist?`);
      case 9:
        return tx(`Serbest düşen bir cismin (kuadratik hava direnci) düşme hızı v(t) = ${N2(x[0])}·tanh(${G}·t / ${N2(x[0])}) m/s ile modelleniyor (t saniye). Çok uzun süre düşerse hız hangi değere yaklaşır (t → ∞)? t = ${N2(x[1])} s anında hız kaç m/s'dir?`,
          `The falling speed of an object with quadratic air drag is modelled by v(t) = ${N2(x[0])}·tanh(${G}·t / ${N2(x[0])}) m/s (t in seconds). What value does the speed approach after a very long fall (t → ∞)? What is the speed at t = ${N2(x[1])} s?`);
      case 10:
        return tx(`Bir ilacın kandaki derişimi, alındıktan t saat sonra C(t) = ${N2(x[0])}·t·e^(−t/${N2(x[1])}) mg/L ile modelleniyor. Uzun vadede derişim hangi değere yaklaşır (t → ∞)? t = ${N2(x[2] * x[1])} sa anında derişim nedir ve en yüksek derişim ne zaman oluşur?`,
          `The concentration of a drug in the blood t hours after intake is modelled by C(t) = ${N2(x[0])}·t·e^(−t/${N2(x[1])}) mg/L. What value does the concentration approach in the long run (t → ∞)? What is the concentration at t = ${N2(x[2] * x[1])} h and when does the peak occur?`);
      case 11:
        return tx(`Bir vana milinin konumu x (mm), oturma yeri x = ${N2(x[1])} mm'dedir. Dar aralıktan geçen akışın hızı v(x) = ${N2(x[0])} / (x − ${N2(x[1])})² m/s ile modelleniyor (x ≠ ${N2(x[1])}). x = ${N2(x[1] + x[2])} mm'de hız nedir? x → ${N2(x[1])} iken soldan ve sağdan v'ye ne olur? İki taraflı limit için ne söylenebilir?`,
          `A valve stem is at position x (mm); the seat is at x = ${N2(x[1])} mm. The speed of the flow through the narrow gap is modelled by v(x) = ${N2(x[0])} / (x − ${N2(x[1])})² m/s (x ≠ ${N2(x[1])}). What is the speed at x = ${N2(x[1] + x[2])} mm? What happens to v as x → ${N2(x[1])} from the left and from the right? What can be said about the two-sided limit?`);
      case 12:
        return tx(`Bir çubuğun boyu L(T) = 200 + ${F(0.01 * x[0], 2)}·T + ${F(0.0001 * x[1], 4)}·T² mm ile modelleniyor (T: °C). T₀ = ${N2(x[2])} °C'de boyun sıcaklığa göre ANLIK değişim hızını, ortalama değişim hızlarının limiti olarak bulalım: lim (h→0) [L(${N2(x[2])} + h) − L(${N2(x[2])})] / h. Sonra 10 °C'lik küçük bir artışta boy artışını bu hızla tahmin edelim.`,
          `The length of a rod is modelled by L(T) = 200 + ${F(0.01 * x[0], 2)}·T + ${F(0.0001 * x[1], 4)}·T² mm (T in °C). Let's find the INSTANTANEOUS rate of change of length with temperature at T₀ = ${N2(x[2])} °C as the limit of average rates: lim (h→0) [L(${N2(x[2])} + h) − L(${N2(x[2])})] / h. Then we can estimate the length increase for a small 10 °C rise using this rate.`);
      default:
        return tx(`Bir çelik parçanın yorulma dayanımı, N × 10⁴ döngüde S(N) = (${N2(x[0])}·N + ${N2(x[1])}) / (N + 1) MPa ile modelleniyor. Döngü sayısı sınırsız artarsa dayanım hangi değere yaklaşır (N → ∞)? N = ${N2(x[2])} (×10⁴) döngüde dayanım nedir?`,
          `The fatigue strength of a steel part after N × 10⁴ cycles is modelled by S(N) = (${N2(x[0])}·N + ${N2(x[1])}) / (N + 1) MPa. What value does the strength approach as the number of cycles grows without bound (N → ∞)? What is the strength at N = ${N2(x[2])} (×10⁴) cycles?`);
    }
  }

  // units + physical meaning of the limit (always shown)
  function Info(p) {
    switch (p.scn) {
      case 0: return tx('Birimler: t saniye, v km/sa. Limitin anlamı: aracın ulaşabileceği SON HIZ (yatay asimptot).', 'Units: t in seconds, v in km/h. Meaning of the limit: the car\'s TOP SPEED (horizontal asymptote).');
      case 1: return tx('Birimler: t saniye, s metre, hız m/s. Limitin anlamı: o andaki ANLIK hız (teğetin eğimi).', 'Units: t in seconds, s in metres, speed in m/s. Meaning of the limit: the INSTANTANEOUS speed at that moment (slope of the tangent).');
      case 2: return tx('Birimler: x yük (birimsiz ölçek), E verimlilik. Limitin anlamı: yük c\'ye yaklaşırken verimliliğin eğilimi; c\'de ölçüm yoksa bile modelin "doldurulabileceği" değer.', 'Units: x load (scaled), E efficiency. Meaning of the limit: the trend of efficiency as the load nears c; the value that would "fill" the gap even if there is no measurement at c.');
      case 3: return tx('Birimler: w kg, C TL. Limitin anlamı: eşiğin hemen altında ve hemen üstünde ödenen ücretler; fark = ücret sıçraması.', 'Units: w in kg, C in TL. Meaning of the limit: the prices just below and just above the threshold; their difference is the price jump.');
      case 4: return tx('Birimler: d mm, F newton. Limitin anlamı: aralık kapanırken kuvvetin sınırsız büyümesi (dikey asimptot).', 'Units: d in mm, F in newtons. Meaning of the limit: the force growing without bound as the gap closes (vertical asymptote).');
      case 5: return tx('Birimler: t saniye, V volt. Limitin anlamı: KARARLI HAL gerilimi (kaynak gerilimi), yatay asimptot.', 'Units: t in seconds, V in volts. Meaning of the limit: the STEADY-STATE voltage (the source voltage), a horizontal asymptote.');
      case 6: return tx('Birimler: x ayar girdisi, f çıktı (birimsiz). Limitin anlamı: iki parçanın x = c\'de aynı yüksekliğe gelmesi.', 'Units: x tuning input, f output (unitless). Meaning of the limit: the two pieces meeting at the same height at x = c.');
      case 7: return tx('Birimler: x sönüm parametresi, y genlik (birimsiz). Limitin anlamı: sönüm 0\'a giderken titreşim genliğinin tamamen sönmesi.', 'Units: x damping parameter, y amplitude (unitless). Meaning of the limit: the vibration amplitude dying out completely as x → 0.');
      case 8: return tx('Birimler: T °C, P watt. Limitin anlamı: eşiğin altından ve üstünden yaklaşırken ısı akışının yönü ve büyüklüğü; iki taraflı limit olmaması = anahtar gibi ani geçiş.', 'Units: T in °C, P in watts. Meaning of the limit: size and direction of heat flow when approaching the threshold from below and above; no two-sided limit = an abrupt switch-like change.');
      case 9: return tx('Birimler: t saniye, v m/s (g = 9,8 m/s²). Limitin anlamı: hava direncinin ağırlığı dengelediği SON HIZ (yatay asimptot).', 'Units: t in seconds, v in m/s (g = 9.8 m/s²). Meaning of the limit: the TERMINAL SPEED at which air drag balances the weight (horizontal asymptote).');
      case 10: return tx('Birimler: t saat, C mg/L. Limitin anlamı: ilacın vücuttan atılması; derişim 0\'a yaklaşır (yatay asimptot y = 0).', 'Units: t in hours, C in mg/L. Meaning of the limit: the drug being cleared from the body; the concentration approaches 0 (horizontal asymptote y = 0).');
      case 11: return tx('Birimler: x mm, v m/s. Limitin anlamı: vana kapanırken iki yandan da hızın sınırsız büyümesi (dikey asimptot x = c).', 'Units: x in mm, v in m/s. Meaning of the limit: the speed growing without bound from both sides as the valve closes (vertical asymptote x = c).');
      case 12: return tx('Birimler: T °C, L mm, hız mm/°C. Limitin anlamı: o sıcaklıktaki genleşme katsayısı = L\'nin türevi; küçük sıcaklık artışları için doğrusal tahmin verir.', 'Units: T in °C, L in mm, rate in mm/°C. Meaning of the limit: the expansion rate at that temperature = the derivative of L; it gives a linear estimate for small temperature rises.');
      default: return tx('Birimler: N ×10⁴ döngü, S MPa. Limitin anlamı: sonsuz ömür için DAYANIM SINIRI Sₑ (yatay asimptot); bu gerilimin altında parça pratikte yorulmaz.', 'Units: N in 10⁴ cycles, S in MPa. Meaning of the limit: the ENDURANCE LIMIT Sₑ for infinite life (horizontal asymptote); below this stress the part practically does not fatigue.');
    }
  }

  function Meaning(p) {
    switch (p.scn) {
      case 0:
        return tx("'Çok uzun süre sonra hız neye yaklaşır?' sorusu SONSUZDAKİ LİMİT sorusudur: lim (t→∞) v(t). Hız formülü bir kesirdir ve pay ile payda birlikte büyür; bu yüzden doğrudan ∞/∞ yazamayız. " +
          "Payı ve paydayı t'nin en büyük kuvvetine bölersek 1/t gibi terimler 0'a gider ve limit görünür. Limit, grafiğin YATAY ASİMPTOTUdur: eğri ona yaklaşır ama hiç ulaşmaz. " +
          "Matematiksel istek: (1) lim (t→∞) v(t)'yi bul, (2) v'yi verilen t'de hesapla.",
          "'What does the speed approach after a very long time?' is a LIMIT AT INFINITY question: lim (t→∞) v(t). The speed formula is a fraction whose numerator and denominator grow together, so we cannot just write ∞/∞. " +
          "If we divide the numerator and denominator by the highest power of t, terms like 1/t go to 0 and the limit becomes visible. The limit is the HORIZONTAL ASYMPTOTE of the graph: the curve approaches it but never reaches it. " +
          "Mathematical task: (1) find lim (t→∞) v(t), (2) evaluate v at the given t.");
      case 1:
        return tx("ANLIK hız, bir andaki hızdır; oysa hız = yol/zaman formülü bir ZAMAN ARALIĞI ister. Çözüm: t₀'dan t₀ + h'ye ORTALAMA hızı yazıp aralığı (h'yi) sıfıra yaklaştırmaktır. " +
          "h = 0 koyarsak 0/0 çıkar; bu yüzden önce cebirle h'yi sadeleştirir, SONRA h → 0 limitini alırız. Bu limit aynı zamanda s(t)'nin TÜREVİDİR: s'(t₀). " +
          "Matematiksel istek: lim (h→0) [s(t₀+h) − s(t₀)]/h limitini hesaplamak.",
          "INSTANTANEOUS speed is the speed at one moment, but the formula speed = distance/time needs a TIME INTERVAL. The solution is to write the AVERAGE speed from t₀ to t₀ + h and let the interval (h) shrink to zero. " +
          "Putting h = 0 directly gives 0/0, so we first simplify with algebra to cancel h, and ONLY THEN take h → 0. This limit is also the DERIVATIVE of s(t): s'(t₀). " +
          "Mathematical task: compute lim (h→0) [s(t₀+h) − s(t₀)]/h.");
      case 2:
        return tx("x = c noktasında pay ve payda birlikte 0 olur: 0/0 BELİRSİZDİR, yani değer yoktur ama limit olabilir. Limit, x c'ye YAKLAŞIRKEN fonksiyonun ne yaptığını sorar, c'de ne olduğunu değil. " +
          "x ≠ c için ortak çarpan (x − c) sadeleştirilebilir; geriye düzgün bir ifade kalır ve limit onun c'deki değeridir. Grafikte bu, tek bir noktası eksik bir çizgidir (içi boş nokta): GİDERİLEBİLİR süreksizlik. " +
          "Matematiksel istek: payı çarpanlara ayır, (x − c)'yi sadeleştir, x → c limitini al.",
          "At x = c the numerator and denominator are both 0: 0/0 is INDETERMINATE, so there is no value but there may be a limit. A limit asks what the function does as x APPROACHES c, not what happens at c. " +
          "For x ≠ c the common factor (x − c) can be cancelled; a smooth expression remains and the limit is its value at c. On the graph this is a line with a single missing point (hollow dot): a REMOVABLE discontinuity. " +
          "Mathematical task: factor the numerator, cancel (x − c), then take x → c.");
      case 3:
        return tx("Fiyat kuralı eşikte DEĞİŞİYOR (parçalı fonksiyon). w eşiğe SOLDAN (w → T⁻) yaklaşırken ilk kural, SAĞDAN (w → T⁺) yaklaşırken ikinci kural geçerlidir. " +
          "İki tek taraflı limit ayrı hesaplanır. Eşitlerse limit vardır; farklıysa limit YOKTUR ve grafikte bir SIÇRAMA görülür. Süreklilik için limit = fonksiyon değeri olmalıdır. " +
          "Matematiksel istek: lim (w→T⁻) C, lim (w→T⁺) C ve C(T)'yi karşılaştırmak.",
          "The price rule CHANGES at the threshold (a piecewise function). As w approaches the threshold from the LEFT (w → T⁻) the first rule applies, from the RIGHT (w → T⁺) the second. " +
          "The two one-sided limits are computed separately. If they are equal the limit exists; if different, the limit DOES NOT EXIST and the graph shows a JUMP. Continuity needs limit = function value. " +
          "Mathematical task: compare lim (w→T⁻) C, lim (w→T⁺) C and C(T).");
      case 4:
        return tx("Kuvvet aralığın karesiyle TERS orantılı: payda küçüldükçe kesir çok büyür. d → 0⁺ iken pay sabit (pozitif), payda 0⁺'ya gider; pozitif/çok küçük pozitif = çok büyük pozitif. " +
          "Limit bir SAYI değil +∞'dur: 'limit yoktur, sınırsız artar' anlamına gelir ve x = 0 doğrusu DİKEY ASİMPTOTTUR. Fiziksel model küçük aralıklarda bozulur ama matematik sınırsız büyümeyi gösterir. " +
          "Matematiksel istek: F(d)'yi verilen d'de hesapla ve lim (d→0⁺) F(d)'yi belirle.",
          "The force is INVERSELY proportional to the gap squared: as the denominator shrinks the fraction becomes huge. As d → 0⁺ the numerator is a positive constant while the denominator tends to 0⁺; positive / tiny positive = huge positive. " +
          "The limit is not a NUMBER but +∞: it means 'the limit does not exist as a number, it grows without bound', and the line x = 0 is a VERTICAL ASYMPTOTE. The physical model breaks at tiny gaps, but the mathematics shows unbounded growth. " +
          "Mathematical task: evaluate F at the given d and determine lim (d→0⁺) F(d).");
      case 5:
        return tx("Zaman büyüdükçe e^(−t/τ) terimi 0'a çöker; geriye kaynak gerilimi kalır. 'Uzun süre sonra' demek t → ∞ limitidir ve KARARLI HAL değerini verir. " +
          "Limit, e üzeri −∞'un 0 olduğu gerçeğine dayanır. Belirli bir anda gerilim ise t yerine sayı koyarak bulunur. " +
          "Matematiksel istek: lim (t→∞) V(t)'yi bul ve V'yi verilen t'de hesapla.",
          "As time grows the term e^(−t/τ) collapses to 0, leaving the source voltage. 'After a long time' means the limit t → ∞ and gives the STEADY-STATE value. " +
          "The limit rests on the fact that e to the power −∞ is 0. The voltage at a specific instant is found by substituting the number for t. " +
          "Mathematical task: find lim (t→∞) V(t) and evaluate V at the given t.");
      case 6:
        return tx("Bir fonksiyon x = c'de SÜREKLİDİR ancak üç koşul sağlanırsa: (1) f(c) tanımlı, (2) lim (x→c) f(x) var, (3) limit = f(c). Parçalı fonksiyonda limit ancak SOL ve SAĞ limitler EŞİTSE vardır. " +
          "Sağ parça c'de değeri belirler; sol parça bilinmeyen b içerir. Kopmama koşulu olan 'sol limit = sağ limit = f(c)' eşitliği b için bir denklem verir. " +
          "Matematiksel istek: sol limit = f(c) denklemini yazıp b'yi çözmek.",
          "A function is CONTINUOUS at x = c only if three conditions hold: (1) f(c) is defined, (2) lim (x→c) f(x) exists, (3) the limit equals f(c). For a piecewise function the limit exists only if the LEFT and RIGHT limits are EQUAL. " +
          "The right piece fixes the value at c; the left piece contains the unknown b. The no-break condition 'left limit = right limit = f(c)' gives an equation for b. " +
          "Mathematical task: write the equation left limit = f(c) and solve for b.");
      case 7:
        return tx("sin(1/x) x → 0 iken −1 ile 1 arasında sonsuz kez salınır, dolayısıyla tek başına limiti YOKTUR. Ama önündeki x² çarpanı 0'a gider ve salınımı bastırır. " +
          "SIKIŞTIRMA (Sandviç) teoremi: g(x) ≤ f(x) ≤ h(x) ve g ile h aynı L limitine gidiyorsa f de L'ye gider. Salınımlı çarpanı −1 ≤ sin ≤ 1 ile sınırlayıp iki yandan sıkıştırırız. " +
          "Matematiksel istek: alt ve üst sınır fonksiyonlarını yaz, limitlerini hesapla ve sonucu çıkar.",
          "As x → 0, sin(1/x) oscillates between −1 and 1 infinitely often, so on its own it has NO limit. But the factor x² in front tends to 0 and suppresses the oscillation. " +
          "The SQUEEZE (Sandwich) theorem: if g(x) ≤ f(x) ≤ h(x) and g and h tend to the same limit L, then f tends to L too. We bound the oscillating factor by −1 ≤ sin ≤ 1 and squeeze from both sides. " +
          "Mathematical task: write the lower and upper bounding functions, compute their limits and conclude.");
      case 8:
        return tx("|u|/u ifadesi u pozitifken +1, negatifken −1 olur (u = T − c). Yani fonksiyon eşikte iki farklı değere sahip: SOLDAN yaklaşırken bir değer, SAĞDAN yaklaşırken başka bir değer. " +
          "Bu iki TEK TARAFLI limit birbirinden farklıysa iki taraflı limit YOKTUR ve T = c noktasında bir sıçrama vardır. Fonksiyon c'de tanımlı bile değildir. " +
          "Matematiksel istek: mutlak değeri işaret durumlarına ayır, lim (T→c⁻) ve lim (T→c⁺) değerlerini bul, karşılaştır.",
          "The expression |u|/u equals +1 when u is positive and −1 when u is negative (u = T − c). So at the threshold the function takes two different values: one when approached from the LEFT, another from the RIGHT. " +
          "If these two ONE-SIDED limits differ, the two-sided limit DOES NOT EXIST and there is a jump at T = c. The function is not even defined at c. " +
          "Mathematical task: split the absolute value into sign cases, find lim (T→c⁻) and lim (T→c⁺), and compare.");
      case 9:
        return tx("Serbest düşen cismi iki kuvvet belirler: ağırlık (sabit) ve hava direnci (hızla artar). Hız arttıkça direnç ağırlığa yaklaşır ve ivme azalır; hız bir SON DEĞERE oturur. 'Çok uzun süre sonra' t → ∞ limitidir. " +
          "tanh(u) = (1 − e^(−2u)) / (1 + e^(−2u)) olduğundan u → ∞ iken e^(−2u) → 0 ve tanh → 1; yani v → vₜ. Eğri yatay asimptota yaklaşır ama ona hiç ulaşmaz. " +
          "Matematiksel istek: tanh'ı üstellerle yaz, e^(−2u) → 0 olduğunu kullanarak limiti bul ve v'yi verilen t'de hesapla.",
          "Two forces govern a falling object: its weight (constant) and air drag (growing with speed). As the speed rises the drag approaches the weight and the acceleration fades; the speed settles at a FINAL VALUE. 'After a very long time' is the limit t → ∞. " +
          "Since tanh(u) = (1 − e^(−2u)) / (1 + e^(−2u)), as u → ∞ we have e^(−2u) → 0 and tanh → 1, so v → vₜ. The curve approaches the horizontal asymptote but never reaches it. " +
          "Mathematical task: write tanh with exponentials, use e^(−2u) → 0 to find the limit, and evaluate v at the given t.");
      case 10:
        return tx("C(t) = D·t·e^(−t/τ) çarpımında t sınırsız büyür ama e^(−t/τ) 0'a çöker: ∞·0 türü bir BELİRSİZLİK. Kural: üstel sönüm, polinom büyümesini YENER. " +
          "t / e^(t/τ) biçimine getirirsek ∞/∞ olur ve L'Hôpital kuralı uygulanır: türevlerin oranı D / ((1/τ)·e^(t/τ)) → 0. Yani limit 0'dır (yatay asimptot y = 0) ve ilaç sonunda tamamen atılır. " +
          "Matematiksel istek: ∞·0'ı ∞/∞'a çevir, L'Hôpital uygula, limiti bul; sonra t = nτ'da C'yi hesapla ve türevin sıfır olduğu yerden tepe zamanını (t = τ) bul.",
          "In the product C(t) = D·t·e^(−t/τ) the factor t grows without bound while e^(−t/τ) collapses to 0: an ∞·0 type INDETERMINACY. Rule: exponential decay BEATS polynomial growth. " +
          "Rewrite it as t / e^(t/τ), which is ∞/∞, and apply L'Hôpital's rule: the ratio of derivatives is D / ((1/τ)·e^(t/τ)) → 0. So the limit is 0 (horizontal asymptote y = 0): the drug is eventually cleared completely. " +
          "Mathematical task: turn ∞·0 into ∞/∞, apply L'Hôpital, find the limit; then evaluate C at t = nτ and find the peak time (t = τ) where the derivative is zero.");
      case 11:
        return tx("Payda (x − c)² KARE olduğu için x, c'ye hangi yandan yaklaşırsa yaklaşsın 0⁺'ya gider (asla negatif olmaz). Pay k > 0 sabit olduğundan oran iki yandan da +∞'a gider. " +
          "Böyle durumda iki tek taraflı limit aynı SONSUZ davranışı gösterir; yazım olarak lim (x→c) v(x) = +∞ deriz (limit bir SAYI olarak yoktur, ama yön belirlidir). x = c doğrusu DİKEY ASİMPTOTTUR. " +
          "Karşılaştırma: 1/(x − c) için soldan −∞, sağdan +∞ olurdu ve iki taraflı limit bu anlamda da olmazdı. Matematiksel istek: v'yi verilen x'te hesapla, her iki tek taraflı limiti ve işaretlerini bul.",
          "Because the denominator (x − c)² is a SQUARE, it tends to 0⁺ whichever side x approaches c from (it is never negative). Since the numerator k > 0 is constant the ratio tends to +∞ from both sides. " +
          "In such a case the two one-sided limits show the same INFINITE behaviour, and we write lim (x→c) v(x) = +∞ (the limit does not exist as a NUMBER, but its direction is determined). The line x = c is a VERTICAL ASYMPTOTE. " +
          "Contrast: for 1/(x − c) the left limit would be −∞ and the right limit +∞, so even the infinite two-sided limit would fail. Mathematical task: evaluate v at the given x, then find both one-sided limits and their signs.");
      case 12:
        return tx("Bir değişkenin ANLIK değişim hızı, iki nokta arasındaki ORTALAMA değişim hızının aralık sıfıra giderken limitidir: [L(T₀+h) − L(T₀)]/h. h = 0 koyarsak 0/0 çıkar; önce cebirle h'yi sadeleştirir, sonra h → 0 alırız. " +
          "Bu limit L'nin T₀'daki TÜREVİDİR ve grafiğe T₀'da çizilen teğetin eğimidir. Teğetin eğimi, küçük ΔT için ΔL ≈ L'(T₀)·ΔT DOĞRUSAL YAKLAŞIMINI verir. " +
          "Matematiksel karşılığı: farkı açabilir, h'yi sadeleştirebilir, limiti bulabilir ve tahmini gerçek artışla karşılaştırabiliriz.",
          "The INSTANTANEOUS rate of change of a quantity is the limit of the AVERAGE rate between two points as the interval shrinks to zero: [L(T₀+h) − L(T₀)]/h. Putting h = 0 gives 0/0, so we first cancel h with algebra and then let h → 0. " +
          "This limit is the DERIVATIVE of L at T₀ and the slope of the tangent drawn on the graph at T₀. The tangent slope gives the LINEAR APPROXIMATION ΔL ≈ L'(T₀)·ΔT for small ΔT. " +
          "Mathematically: we can expand the difference, cancel h, find the limit and compare the estimate with the true increase.");
      default:
        return tx("S(N) = (Sₑ·N + B)/(N + 1) kesrinde pay ve payda birlikte büyür (∞/∞). Payı ve paydayı N'ye bölersek B/N ve 1/N terimleri 0'a gider; geriye Sₑ/1 kalır. " +
          "Bu limit eğrinin YATAY ASİMPTOTUDUR: dayanım döngü arttıkça Sₑ'ye YAKLAŞIR ama hiçbir sonlu N'de tam Sₑ olmaz. Mühendislik anlamı: Sₑ altındaki gerilimde parça 'sonsuz' ömürlüdür. " +
          "Matematiksel istek: lim (N→∞) S(N)'i bul, verilen N'de S'yi hesapla ve asimptota ne kadar yaklaşıldığını yorumla.",
          "In the fraction S(N) = (Sₑ·N + B)/(N + 1) the numerator and denominator grow together (∞/∞). Dividing both by N makes the B/N and 1/N terms go to 0, leaving Sₑ/1. " +
          "This limit is the curve's HORIZONTAL ASYMPTOTE: the strength APPROACHES Sₑ as cycles increase but equals Sₑ at no finite N. Engineering meaning: at stresses below Sₑ the part has 'infinite' life. " +
          "Mathematical task: find lim (N→∞) S(N), evaluate S at the given N and comment on how close it is to the asymptote.");
    }
  }

  function Steps(problem) {
    const x = problem.p;
    const s = [];
    const add = (a, b) => s.push(tx(a, b));
    switch (problem.scn) {
      case 0: {
        const v = x[0], c = x[1], t = x[2];
        const vt = v * t / (t + c);
        add('Değişkenler: t = zaman (s), v(t) = hız (km/sa).', 'Variables: t = time (s), v(t) = speed (km/h).');
        add(`Model: v(t) = ${N2(v)}t / (t + ${N2(c)}). İstenen: lim (t→∞) v(t).`, `Model: v(t) = ${N2(v)}t / (t + ${N2(c)}). Wanted: lim (t→∞) v(t).`);
        add("Doğrudan t = ∞ koymak ∞/∞ verir (belirsiz). Payı ve paydayı t'ye böl (en büyük kuvvet).", 'Putting t = ∞ directly gives ∞/∞ (indeterminate). Divide numerator and denominator by t (the highest power).');
        add(`v(t) = (${N2(v)}t/t) / ((t + ${N2(c)})/t) = ${N2(v)} / (1 + ${N2(c)}/t).`, `v(t) = (${N2(v)}t/t) / ((t + ${N2(c)})/t) = ${N2(v)} / (1 + ${N2(c)}/t).`);
        add(`t → ∞ iken ${N2(c)}/t → 0. Yani paydadaki 1 + ${N2(c)}/t → 1.`, `As t → ∞, ${N2(c)}/t → 0. So the denominator 1 + ${N2(c)}/t → 1.`);
        add(`Limit: lim v(t) = ${N2(v)} / 1 = ${N2(v)} km/sa. Yatay asimptot: v = ${N2(v)}.`, `Limit: lim v(t) = ${N2(v)} / 1 = ${N2(v)} km/h. Horizontal asymptote: v = ${N2(v)}.`);
        add(`t = ${N2(t)} s: v(${N2(t)}) = ${N2(v)}·${N2(t)} / (${N2(t)} + ${N2(c)}) = ${N2(v * t)} / ${N2(t + c)} = ${N2(vt)} km/sa (son hızın %${N2(100 * vt / v)}'i).`, `At t = ${N2(t)} s: v(${N2(t)}) = ${N2(v)}·${N2(t)} / (${N2(t)} + ${N2(c)}) = ${N2(v * t)} / ${N2(t + c)} = ${N2(vt)} km/h (${N2(100 * vt / v)}% of the top speed).`);
        add(`Yorum: t/(t + ${N2(c)}) her zaman 1'den küçüktür, yani v(t) < ${N2(v)}: otomobil son hıza sonsuza dek yaklaşır ama HİÇ ulaşmaz.`, `Interpretation: t/(t + ${N2(c)}) is always below 1, so v(t) < ${N2(v)}: the car approaches the top speed forever but NEVER reaches it.`);
        break;
      }
      case 1: {
        const a = x[0], b = x[1], t0 = x[2];
        const slope = 2 * a * t0 + b;
        add(`Model: s(t) = ${N2(a)}t² + ${N2(b)}t. Ortalama hız = [s(t₀+h) − s(t₀)]/h, t₀ = ${N2(t0)}.`, `Model: s(t) = ${N2(a)}t² + ${N2(b)}t. Average speed = [s(t₀+h) − s(t₀)]/h with t₀ = ${N2(t0)}.`);
        add(`s(${N2(t0)}) = ${N2(a)}·${N2(t0)}² + ${N2(b)}·${N2(t0)} = ${N2(a * t0 * t0 + b * t0)}.`, `s(${N2(t0)}) = ${N2(a)}·${N2(t0)}² + ${N2(b)}·${N2(t0)} = ${N2(a * t0 * t0 + b * t0)}.`);
        add(`s(${N2(t0)}+h) = ${N2(a)}(${N2(t0)}+h)² + ${N2(b)}(${N2(t0)}+h) = ${N2(a)}(${N2(t0 * t0)} + ${N2(2 * t0)}h + h²) + ${N2(b * t0)} + ${N2(b)}h.`, `s(${N2(t0)}+h) = ${N2(a)}(${N2(t0)}+h)² + ${N2(b)}(${N2(t0)}+h) = ${N2(a)}(${N2(t0 * t0)} + ${N2(2 * t0)}h + h²) + ${N2(b * t0)} + ${N2(b)}h.`);
        add(`Aç: = ${N2(a * t0 * t0)} + ${N2(2 * a * t0)}h + ${N2(a)}h² + ${N2(b * t0)} + ${N2(b)}h.`, `Expand: = ${N2(a * t0 * t0)} + ${N2(2 * a * t0)}h + ${N2(a)}h² + ${N2(b * t0)} + ${N2(b)}h.`);
        add(`Çıkar: s(${N2(t0)}+h) − s(${N2(t0)}) = ${N2(slope)}h + ${N2(a)}h².`, `Subtract: s(${N2(t0)}+h) − s(${N2(t0)}) = ${N2(slope)}h + ${N2(a)}h².`);
        add(`h'ye böl (h ≠ 0): (${N2(slope)}h + ${N2(a)}h²)/h = h·(${N2(slope)} + ${N2(a)}h)/h = ${N2(slope)} + ${N2(a)}h.`, `Divide by h (h ≠ 0): (${N2(slope)}h + ${N2(a)}h²)/h = h·(${N2(slope)} + ${N2(a)}h)/h = ${N2(slope)} + ${N2(a)}h.`);
        add(`Tablo: h = 1 → ${N2(slope + a)},  h = 0.1 → ${N2(slope + a * 0.1)},  h = 0.01 → ${N2(slope + a * 0.01)}: değerler ${N2(slope)}'e yaklaşıyor.`, `Table: h = 1 → ${N2(slope + a)},  h = 0.1 → ${N2(slope + a * 0.1)},  h = 0.01 → ${N2(slope + a * 0.01)}: values approach ${N2(slope)}.`);
        add(`Limit: h → 0 iken ${N2(slope)} + ${N2(a)}h → ${N2(slope)} m/s. Kontrol: s'(t) = ${N2(2 * a)}t + ${N2(b)} → s'(${N2(t0)}) = ${N2(slope)} ✓.`, `Limit: as h → 0, ${N2(slope)} + ${N2(a)}h → ${N2(slope)} m/s. Check: s'(t) = ${N2(2 * a)}t + ${N2(b)} → s'(${N2(t0)}) = ${N2(slope)} ✓.`);
        add('Yorum: kesen doğrunun eğimi (ortalama hız) h → 0 iken TEĞETİN eğimine (anlık hız) yaklaşır; grafikteki kesikli çizgi teğettir.', 'Interpretation: the secant slope (average speed) tends to the TANGENT slope (instantaneous speed) as h → 0; the dashed line on the graph is the tangent.');
        break;
      }
      case 2: {
        const m = x[0], c = x[1];
        const c2 = N2(c * c);
        add(`E(x) = ${N2(m)}(x² − ${c2})/(x − ${N2(c)}). x = ${N2(c)} koyunca pay ${N2(m)}(${c2} − ${c2}) = 0, payda 0: 0/0 belirsiz.`, `E(x) = ${N2(m)}(x² − ${c2})/(x − ${N2(c)}). Putting x = ${N2(c)}: numerator ${N2(m)}(${c2} − ${c2}) = 0, denominator 0: 0/0 indeterminate.`);
        add(`Belirsizlik bir ortak çarpanın işaretidir; payı çarpanlara ayır: x² − ${c2} = (x − ${N2(c)})(x + ${N2(c)}) (iki kare farkı).`, `The indeterminacy signals a common factor; factor the numerator: x² − ${c2} = (x − ${N2(c)})(x + ${N2(c)}) (difference of squares).`);
        add(`Yerine yaz: E(x) = ${N2(m)}(x − ${N2(c)})(x + ${N2(c)}) / (x − ${N2(c)}).`, `Substitute: E(x) = ${N2(m)}(x − ${N2(c)})(x + ${N2(c)}) / (x − ${N2(c)}).`);
        add(`x ≠ ${N2(c)} için (x − ${N2(c)}) sadeleşir: E(x) = ${N2(m)}(x + ${N2(c)}).`, `For x ≠ ${N2(c)} the factor (x − ${N2(c)}) cancels: E(x) = ${N2(m)}(x + ${N2(c)}).`);
        add(`Limit yalnızca x ≠ ${N2(c)} değerlerine bakar, bu yüzden sadeleştirme geçerlidir.`, `A limit only looks at values with x ≠ ${N2(c)}, so the cancellation is legitimate.`);
        add(`Limit: lim (x→${N2(c)}) E(x) = ${N2(m)}(${N2(c)} + ${N2(c)}) = ${N2(m)}·${N2(2 * c)} = ${N2(2 * m * c)}.`, `Limit: lim (x→${N2(c)}) E(x) = ${N2(m)}(${N2(c)} + ${N2(c)}) = ${N2(m)}·${N2(2 * c)} = ${N2(2 * m * c)}.`);
        add(`Sayısal kontrol: x = ${F(c - 0.1, 2, 1)} → ${F(m * (2 * c - 0.1), 3, 1)},  x = ${F(c + 0.1, 2, 1)} → ${F(m * (2 * c + 0.1), 3, 1)}: her iki yandan ${N2(2 * m * c)}'ye yaklaşır.`, `Numerical check: x = ${F(c - 0.1, 2, 1)} → ${F(m * (2 * c - 0.1), 3, 1)},  x = ${F(c + 0.1, 2, 1)} → ${F(m * (2 * c + 0.1), 3, 1)}: both sides approach ${N2(2 * m * c)}.`);
        add(`E(${N2(c)}) tanımsızdır → grafikte (${N2(c)}, ${N2(2 * m * c)}) noktası İÇİ BOŞ (giderilebilir süreksizlik). E(${N2(c)}) := ${N2(2 * m * c)} tanımlanırsa boşluk kapanır.`, `E(${N2(c)}) is not defined → the point (${N2(c)}, ${N2(2 * m * c)}) is a HOLLOW dot on the graph (removable discontinuity). Defining E(${N2(c)}) := ${N2(2 * m * c)} would fill the gap.`);
        break;
      }
      case 3: {
        const p = x[0], tt = x[1], f = x[2];
        add(`Model: C(w) = ${N2(p)}w  (w ≤ ${N2(tt)}),   C(w) = ${N2(p)}w + ${N2(f)}  (w > ${N2(tt)}).`, `Model: C(w) = ${N2(p)}w  (w ≤ ${N2(tt)}),   C(w) = ${N2(p)}w + ${N2(f)}  (w > ${N2(tt)}).`);
        add(`Soldan limit (w → ${N2(tt)}⁻, w < ${N2(tt)}): birinci kural kullanılır: C(w) = ${N2(p)}w.`, `Left limit (w → ${N2(tt)}⁻, w < ${N2(tt)}): the first rule is used: C(w) = ${N2(p)}w.`);
        add(`lim (w→${N2(tt)}⁻) C = ${N2(p)}·${N2(tt)} = ${N2(p * tt)} TL.`, `lim (w→${N2(tt)}⁻) C = ${N2(p)}·${N2(tt)} = ${N2(p * tt)} TL.`);
        add(`Sağdan limit (w → ${N2(tt)}⁺, w > ${N2(tt)}): ikinci kural: C(w) = ${N2(p)}w + ${N2(f)}.`, `Right limit (w → ${N2(tt)}⁺, w > ${N2(tt)}): the second rule: C(w) = ${N2(p)}w + ${N2(f)}.`);
        add(`lim (w→${N2(tt)}⁺) C = ${N2(p)}·${N2(tt)} + ${N2(f)} = ${N2(p * tt)} + ${N2(f)} = ${N2(p * tt + f)} TL.`, `lim (w→${N2(tt)}⁺) C = ${N2(p)}·${N2(tt)} + ${N2(f)} = ${N2(p * tt)} + ${N2(f)} = ${N2(p * tt + f)} TL.`);
        add(`Karşılaştır: ${N2(p * tt)} ≠ ${N2(p * tt + f)} → iki taraflı limit YOKTUR (sıçrama = ${N2(f)} TL).`, `Compare: ${N2(p * tt)} ≠ ${N2(p * tt + f)} → the two-sided limit DOES NOT EXIST (jump = ${N2(f)} TL).`);
        add(`Fonksiyon değeri: C(${N2(tt)}) = ${N2(p)}·${N2(tt)} = ${N2(p * tt)} (birinci kural, w ≤ ${N2(tt)}); soldan limite eşit, sağdan değil.`, `Function value: C(${N2(tt)}) = ${N2(p)}·${N2(tt)} = ${N2(p * tt)} (first rule, w ≤ ${N2(tt)}); equal to the left limit but not the right.`);
        add(`Sonuç: limit yok → C, w = ${N2(tt)}'de SÜREKLİ DEĞİLDİR (sıçrama süreksizliği). Yalnızca soldan süreklidir.`, `Conclusion: no limit → C is NOT CONTINUOUS at w = ${N2(tt)} (jump discontinuity). It is continuous from the left only.`);
        add(`Yorum: paket ${N2(tt)} kg'ı bir gram aşınca ücret aniden ${N2(f)} TL artar; çizgi dolu nokta (${N2(tt)}, ${N2(p * tt)}) ve boş nokta (${N2(tt)}, ${N2(p * tt + f)}) ile gösterilir.`, `Interpretation: one gram over ${N2(tt)} kg raises the price suddenly by ${N2(f)} TL; the graph shows a filled dot (${N2(tt)}, ${N2(p * tt)}) and a hollow dot (${N2(tt)}, ${N2(p * tt + f)}).`);
        break;
      }
      case 4: {
        const k = x[0], d0 = x[1];
        add('Model: F(d) = k/d², d > 0 (mm), k = ' + N2(k) + '.', 'Model: F(d) = k/d², d > 0 (mm), k = ' + N2(k) + '.');
        add(`d = ${N2(d0)} için: F = ${N2(k)} / (${N2(d0)})² = ${N2(k)} / ${N2(d0 * d0)}.`, `For d = ${N2(d0)}: F = ${N2(k)} / (${N2(d0)})² = ${N2(k)} / ${N2(d0 * d0)}.`);
        add(`F(${N2(d0)}) = ${N2(k / (d0 * d0))} N.`, `F(${N2(d0)}) = ${N2(k / (d0 * d0))} N.`);
        add('d → 0⁺ limitini tablo ile yakala: d = 1, 0.1, 0.01, 0.001.', 'Capture d → 0⁺ with a table: d = 1, 0.1, 0.01, 0.001.');
        add(`F(1) = ${N2(k)},  F(0.1) = ${N2(k * 100)},  F(0.01) = ${N2(k * 10000)},  F(0.001) = ${N2(k * 1000000)}.`, `F(1) = ${N2(k)},  F(0.1) = ${N2(k * 100)},  F(0.01) = ${N2(k * 10000)},  F(0.001) = ${N2(k * 1000000)}.`);
        add('Her adımda d 10 kat küçülür, F 100 kat büyür: F sınırsız artıyor.', 'Each step divides d by 10 and multiplies F by 100: F grows without bound.');
        add(`Cebirsel: d² → 0⁺ ve pay ${N2(k)} > 0 sabit → ${N2(k)}/(0⁺) = +∞.`, `Algebraically: d² → 0⁺ and the numerator ${N2(k)} > 0 is constant → ${N2(k)}/(0⁺) = +∞.`);
        add('Sonuç: lim (d→0⁺) F(d) = +∞. Limit bir sayı değildir; d = 0 doğrusu DİKEY ASİMPTOTTUR.', 'Result: lim (d→0⁺) F(d) = +∞. The limit is not a number; the line d = 0 is a VERTICAL ASYMPTOTE.');
        add("Yorum: gerçekte mıknatıslar temas edince model geçersizdir; ancak matematik 'aralık ne kadar küçülürse kuvvet o kadar aşırı büyür' der.", "Interpretation: in reality the model fails when the magnets touch; but the mathematics says 'the smaller the gap, the more extreme the force'.");
        break;
      }
      case 5: {
        const v0 = x[0], tau = x[1], n = x[2];
        const tt = n * tau;
        add(`Model: V(t) = ${N2(v0)}(1 − e^(−t/${N2(tau)})); t saniye, V volt.`, `Model: V(t) = ${N2(v0)}(1 − e^(−t/${N2(tau)})); t in seconds, V in volts.`);
        add('İstenen: lim (t→∞) V(t).', 'Wanted: lim (t→∞) V(t).');
        add(`t → ∞ iken üs −t/${N2(tau)} → −∞.`, `As t → ∞ the exponent −t/${N2(tau)} → −∞.`);
        add('e^(−∞) = 0 (üstel sönüm): e^(−t/τ) → 0.', 'e^(−∞) = 0 (exponential decay): e^(−t/τ) → 0.');
        add(`Parantez: 1 − e^(−t/${N2(tau)}) → 1 − 0 = 1.`, `The bracket: 1 − e^(−t/${N2(tau)}) → 1 − 0 = 1.`);
        add(`Limit: lim V(t) = ${N2(v0)}·1 = ${N2(v0)} V (kararlı hal).`, `Limit: lim V(t) = ${N2(v0)}·1 = ${N2(v0)} V (steady state).`);
        add(`t = ${N2(tt)} s: V = ${N2(v0)}(1 − e^(−${N2(tt)}/${N2(tau)})) = ${N2(v0)}(1 − e^(−${N2(n)})) = ${N2(v0)}(1 − ${F(Math.exp(-n), 4)}) ≈ ${F(v0 * (1 - Math.exp(-n)), 3)} V.`, `At t = ${N2(tt)} s: V = ${N2(v0)}(1 − e^(−${N2(tt)}/${N2(tau)})) = ${N2(v0)}(1 − e^(−${N2(n)})) = ${N2(v0)}(1 − ${F(Math.exp(-n), 4)}) ≈ ${F(v0 * (1 - Math.exp(-n)), 3)} V.`);
        add(`Yorum: ${N2(n)}τ sonra gerilim kararlı halin %${F(100 * (1 - Math.exp(-n)), 1)}'ine ulaşır; 5τ sonrası pratikte %99.3'tür.`, `Interpretation: after ${N2(n)}τ the voltage is at ${F(100 * (1 - Math.exp(-n)), 1)}% of steady state; after 5τ it is practically 99.3%.`);
        break;
      }
      case 6: {
        const a = x[0], c = x[1], d = x[2];
        const fc = c * c - d, b = fc - a * c;
        add(`Parçalar: f(x) = ${N2(a)}x + b (x < ${N2(c)}),   f(x) = x² − ${N2(d)} (x ≥ ${N2(c)}).`, `Pieces: f(x) = ${N2(a)}x + b (x < ${N2(c)}),   f(x) = x² − ${N2(d)} (x ≥ ${N2(c)}).`);
        add(`Süreklilik koşulları: f(${N2(c)}) tanımlı, limit var, limit = f(${N2(c)}).`, `Continuity conditions: f(${N2(c)}) defined, limit exists, limit = f(${N2(c)}).`);
        add(`f(${N2(c)}) = ${N2(c)}² − ${N2(d)} = ${N2(c * c)} − ${N2(d)} = ${N2(fc)} (sağ parça, x = ${N2(c)} dahil).`, `f(${N2(c)}) = ${N2(c)}² − ${N2(d)} = ${N2(c * c)} − ${N2(d)} = ${N2(fc)} (right piece, includes x = ${N2(c)}).`);
        add(`Sağ limit: lim (x→${N2(c)}⁺) (x² − ${N2(d)}) = ${N2(fc)}.`, `Right limit: lim (x→${N2(c)}⁺) (x² − ${N2(d)}) = ${N2(fc)}.`);
        add(`Sol limit: lim (x→${N2(c)}⁻) (${N2(a)}x + b) = ${N2(a)}·${N2(c)} + b = ${N2(a * c)} + b.`, `Left limit: lim (x→${N2(c)}⁻) (${N2(a)}x + b) = ${N2(a)}·${N2(c)} + b = ${N2(a * c)} + b.`);
        add(`Limitin var olması için sol = sağ: ${N2(a * c)} + b = ${N2(fc)}.`, `For the limit to exist, left = right: ${N2(a * c)} + b = ${N2(fc)}.`);
        add(`b'yi çöz: b = ${N2(fc)} − ${N2(a * c)} = ${N2(b)}.`, `Solve for b: b = ${N2(fc)} − ${N2(a * c)} = ${N2(b)}.`);
        add(`Kontrol: sol parça ${N2(a * c)} + (${N2(b)}) = ${N2(a * c + b)} = f(${N2(c)}) = ${N2(fc)} ✓. Eğri kopmadan birleşir.`, `Check: left piece ${N2(a * c)} + (${N2(b)}) = ${N2(a * c + b)} = f(${N2(c)}) = ${N2(fc)} ✓. The curve joins without a break.`);
        add(`Yorum: b başka bir değer olsaydı x = ${N2(c)}'de sıçrama olurdu; b = ${N2(b)} sıçrama miktarını tam sıfırlar.`, `Interpretation: any other b would leave a jump at x = ${N2(c)}; b = ${N2(b)} makes the jump exactly zero.`);
        break;
      }
      case 7: {
        const k = x[0];
        add(`y(x) = ${N2(k)}x²·sin(1/x), x ≠ 0. İstenen: lim (x→0) y(x).`, `y(x) = ${N2(k)}x²·sin(1/x), x ≠ 0. Wanted: lim (x→0) y(x).`);
        add('Doğrudan yerine koyma olmaz: sin(1/0) tanımsız, ve sin(1/x) x → 0 iken limitsiz salınır.', 'Direct substitution fails: sin(1/0) is not defined, and sin(1/x) oscillates without a limit as x → 0.');
        add('Her x ≠ 0 için sinüs sınırlı: −1 ≤ sin(1/x) ≤ 1.', 'For every x ≠ 0 sine is bounded: −1 ≤ sin(1/x) ≤ 1.');
        add(`${N2(k)}x² ≥ 0 ile çarp (eşitsizliğin yönü değişmez): −${N2(k)}x² ≤ ${N2(k)}x²·sin(1/x) ≤ ${N2(k)}x².`, `Multiply by ${N2(k)}x² ≥ 0 (the inequality direction is kept): −${N2(k)}x² ≤ ${N2(k)}x²·sin(1/x) ≤ ${N2(k)}x².`);
        add(`Alt sınır: lim (x→0) (−${N2(k)}x²) = −${N2(k)}·0 = 0.`, `Lower bound: lim (x→0) (−${N2(k)}x²) = −${N2(k)}·0 = 0.`);
        add(`Üst sınır: lim (x→0) (${N2(k)}x²) = ${N2(k)}·0 = 0.`, `Upper bound: lim (x→0) (${N2(k)}x²) = ${N2(k)}·0 = 0.`);
        add('Her iki sınır da 0\'a gittiği için SIKIŞTIRMA teoremi: lim (x→0) y(x) = 0.', 'Both bounds tend to 0, so by the SQUEEZE theorem: lim (x→0) y(x) = 0.');
        add(`Sayısal kontrol: x = 0.1 → |y| ≤ ${N2(k * 0.01)};  x = 0.01 → |y| ≤ ${F(k * 0.0001, 4)}: salınım genliği hızla küçülür.`, `Numerical check: x = 0.1 → |y| ≤ ${N2(k * 0.01)};  x = 0.01 → |y| ≤ ${F(k * 0.0001, 4)}: the oscillation amplitude shrinks quickly.`);
        add('Yorum: eğri iki parabol (kesikli) arasında sıkışır ve orijine çöker; y(0) tanımsız olduğundan (0, 0) noktası içi boş çizilir.', 'Interpretation: the curve is trapped between two parabolas (dashed) and collapses to the origin; since y(0) is not defined the point (0, 0) is drawn hollow.');
        break;
      }
      case 8: {
        const m = x[0], c = x[1];
        add(`u = T − ${N2(c)} olsun. P = ${N2(m)}·|u|/u, u ≠ 0.`, `Let u = T − ${N2(c)}. Then P = ${N2(m)}·|u|/u, u ≠ 0.`);
        add('Mutlak değer: u > 0 ise |u| = u; u < 0 ise |u| = −u.', 'Absolute value: if u > 0 then |u| = u; if u < 0 then |u| = −u.');
        add(`Sağdan (T → ${N2(c)}⁺, u > 0): P = ${N2(m)}·u/u = ${N2(m)}.`, `From the right (T → ${N2(c)}⁺, u > 0): P = ${N2(m)}·u/u = ${N2(m)}.`);
        add(`lim (T→${N2(c)}⁺) P = ${N2(m)} W.`, `lim (T→${N2(c)}⁺) P = ${N2(m)} W.`);
        add(`Soldan (T → ${N2(c)}⁻, u < 0): P = ${N2(m)}·(−u)/u = −${N2(m)}.`, `From the left (T → ${N2(c)}⁻, u < 0): P = ${N2(m)}·(−u)/u = −${N2(m)}.`);
        add(`lim (T→${N2(c)}⁻) P = −${N2(m)} W.`, `lim (T→${N2(c)}⁻) P = −${N2(m)} W.`);
        add(`Karşılaştır: −${N2(m)} ≠ ${N2(m)} → iki taraflı limit YOKTUR (sıçrama ${N2(2 * m)} W).`, `Compare: −${N2(m)} ≠ ${N2(m)} → the two-sided limit DOES NOT EXIST (jump of ${N2(2 * m)} W).`);
        add(`Sayısal kontrol: T = ${F(c - 0.01, 2, 1)}: P = −${N2(m)};  T = ${F(c + 0.01, 2, 1)}: P = +${N2(m)}.`, `Numerical check: T = ${F(c - 0.01, 2, 1)}: P = −${N2(m)};  T = ${F(c + 0.01, 2, 1)}: P = +${N2(m)}.`);
        add(`Yorum: eşiğin altında ısıtma (−), üstünde soğutma (+) yönü vardır; T = ${N2(c)}'de P tanımsızdır ve iki boş nokta çizilir.`, `Interpretation: below the threshold the flow points one way (−), above it the other (+); P is not defined at T = ${N2(c)} and two hollow dots are drawn.`);
        break;
      }
      case 9: {
        const vT = x[0], t = x[1];
        const u = G * t / vT;
        const vt = vT * Math.tanh(u);
        const e2 = Math.exp(-2 * u);
        add('Değişkenler: t = zaman (s), v(t) = düşme hızı (m/s), vₜ = ' + N2(vT) + ' m/s, g = 9.8 m/s².', 'Variables: t = time (s), v(t) = falling speed (m/s), vₜ = ' + N2(vT) + ' m/s, g = 9.8 m/s².');
        add(`Model: v(t) = ${N2(vT)}·tanh(u), u = ${G}t / ${N2(vT)}. İstenen: lim (t→∞) v(t).`, `Model: v(t) = ${N2(vT)}·tanh(u), u = ${G}t / ${N2(vT)}. Wanted: lim (t→∞) v(t).`);
        add('tanh(u) = (e^u − e^(−u)) / (e^u + e^(−u)). Pay ve paydayı e^u ile bölünce: tanh(u) = (1 − e^(−2u)) / (1 + e^(−2u)).', 'tanh(u) = (e^u − e^(−u)) / (e^u + e^(−u)). Dividing numerator and denominator by e^u: tanh(u) = (1 − e^(−2u)) / (1 + e^(−2u)).');
        add('t → ∞ iken u = g·t/vₜ → ∞ (g, vₜ > 0 sabit).', 'As t → ∞, u = g·t/vₜ → ∞ (g, vₜ > 0 are constants).');
        add('Böylece e^(−2u) → 0 (üstel sönüm).', 'Hence e^(−2u) → 0 (exponential decay).');
        add('tanh(u) → (1 − 0) / (1 + 0) = 1.', 'tanh(u) → (1 − 0) / (1 + 0) = 1.');
        add(`Limit: lim v(t) = ${N2(vT)}·1 = ${N2(vT)} m/s (≈ ${N2(vT * 3.6)} km/sa). Yatay asimptot: v = ${N2(vT)}.`, `Limit: lim v(t) = ${N2(vT)}·1 = ${N2(vT)} m/s (≈ ${N2(vT * 3.6)} km/h). Horizontal asymptote: v = ${N2(vT)}.`);
        add(`t = ${N2(t)} s: u = ${G}·${N2(t)} / ${N2(vT)} = ${F(u, 3)}; e^(−2u) = ${F(e2, 4)}; tanh(u) = ${F((1 - e2) / (1 + e2), 4)}.`, `At t = ${N2(t)} s: u = ${G}·${N2(t)} / ${N2(vT)} = ${F(u, 3)}; e^(−2u) = ${F(e2, 4)}; tanh(u) = ${F((1 - e2) / (1 + e2), 4)}.`);
        add(`v(${N2(t)}) = ${N2(vT)}·${F((1 - e2) / (1 + e2), 4)} ≈ ${F(vt, 2)} m/s (son hızın %${F(100 * vt / vT, 1)}'i).`, `v(${N2(t)}) = ${N2(vT)}·${F((1 - e2) / (1 + e2), 4)} ≈ ${F(vt, 2)} m/s (${F(100 * vt / vT, 1)}% of the terminal speed).`);
        add('Yorum: tanh hiçbir u için 1\'e eşit olmaz, yani v(t) < vₜ her zaman; hava direnci ağırlığa sonsuza dek yaklaşır ama cisim son hıza tam ulaşmaz.', 'Interpretation: tanh never equals 1 for any u, so v(t) < vₜ always; drag approaches the weight forever but the object never exactly reaches the terminal speed.');
        break;
      }
      case 10: {
        const D = x[0], tau = x[1], n = x[2];
        const tt = n * tau;
        const peak = D * tau / Math.E;
        add(`Model: C(t) = ${N2(D)}·t·e^(−t/${N2(tau)}); t saat, C mg/L. İstenen: lim (t→∞) C(t).`, `Model: C(t) = ${N2(D)}·t·e^(−t/${N2(tau)}); t in hours, C in mg/L. Wanted: lim (t→∞) C(t).`);
        add('t → ∞ iken t → ∞ ama e^(−t/τ) → 0: ∞·0 belirsizliği.', 'As t → ∞, t → ∞ but e^(−t/τ) → 0: the ∞·0 indeterminate form.');
        add(`Kesir biçimine getir: C(t) = ${N2(D)}·t / e^(t/${N2(tau)}). Şimdi ∞/∞ (L'Hôpital uygulanabilir).`, `Write it as a fraction: C(t) = ${N2(D)}·t / e^(t/${N2(tau)}). Now it is ∞/∞ (L'Hôpital applies).`);
        add(`Pay ve paydanın türevi: (${N2(D)}t)' = ${N2(D)};  (e^(t/${N2(tau)}))' = (1/${N2(tau)})·e^(t/${N2(tau)}).`, `Differentiate numerator and denominator: (${N2(D)}t)' = ${N2(D)};  (e^(t/${N2(tau)}))' = (1/${N2(tau)})·e^(t/${N2(tau)}).`);
        add(`Oran: ${N2(D)} / ((1/${N2(tau)})·e^(t/${N2(tau)})) = ${N2(D * tau)} / e^(t/${N2(tau)}).`, `Ratio: ${N2(D)} / ((1/${N2(tau)})·e^(t/${N2(tau)})) = ${N2(D * tau)} / e^(t/${N2(tau)}).`);
        add(`t → ∞ iken e^(t/${N2(tau)}) → ∞, oran → 0. Limit: lim C(t) = 0 mg/L (yatay asimptot y = 0).`, `As t → ∞, e^(t/${N2(tau)}) → ∞, so the ratio → 0. Limit: lim C(t) = 0 mg/L (horizontal asymptote y = 0).`);
        add(`t = ${N2(tt)} sa: C = ${N2(D)}·${N2(tt)}·e^(−${N2(n)}) = ${N2(D * tt)}·${F(Math.exp(-n), 4)} ≈ ${F(D * tt * Math.exp(-n), 3)} mg/L.`, `At t = ${N2(tt)} h: C = ${N2(D)}·${N2(tt)}·e^(−${N2(n)}) = ${N2(D * tt)}·${F(Math.exp(-n), 4)} ≈ ${F(D * tt * Math.exp(-n), 3)} mg/L.`);
        add(`Tepe: C'(t) = ${N2(D)}e^(−t/${N2(tau)})·(1 − t/${N2(tau)}) = 0 ⇒ t = ${N2(tau)} sa; C(${N2(tau)}) = ${N2(D)}·${N2(tau)}/e ≈ ${F(peak, 3)} mg/L.`, `Peak: C'(t) = ${N2(D)}e^(−t/${N2(tau)})·(1 − t/${N2(tau)}) = 0 ⇒ t = ${N2(tau)} h; C(${N2(tau)}) = ${N2(D)}·${N2(tau)}/e ≈ ${F(peak, 3)} mg/L.`);
        add('Yorum: derişim önce yükselir, tepeden sonra düşer ve 0\'a yaklaşır: üstel sönüm doğrusal büyümeyi yener, ilaç sonunda atılır.', 'Interpretation: the concentration first rises, then falls after the peak and approaches 0: exponential decay beats linear growth, so the drug is eventually cleared.');
        break;
      }
      case 11: {
        const k = x[0], c = x[1], d = x[2];
        add(`Model: v(x) = ${N2(k)} / (x − ${N2(c)})², x ≠ ${N2(c)}. Oturma yeri x = ${N2(c)}.`, `Model: v(x) = ${N2(k)} / (x − ${N2(c)})², x ≠ ${N2(c)}. Seat at x = ${N2(c)}.`);
        add(`x = ${N2(c + d)} mm: v = ${N2(k)} / (${N2(d)})² = ${N2(k)} / ${N2(d * d)} = ${N2(k / (d * d))} m/s.`, `At x = ${N2(c + d)} mm: v = ${N2(k)} / (${N2(d)})² = ${N2(k)} / ${N2(d * d)} = ${N2(k / (d * d))} m/s.`);
        add(`Sağdan (x → ${N2(c)}⁺): x − ${N2(c)} → 0⁺, kare (x − ${N2(c)})² → 0⁺.`, `From the right (x → ${N2(c)}⁺): x − ${N2(c)} → 0⁺, the square (x − ${N2(c)})² → 0⁺.`);
        add(`Pay ${N2(k)} > 0 sabit: ${N2(k)} / 0⁺ = +∞. Yani lim (x→${N2(c)}⁺) v = +∞.`, `The numerator ${N2(k)} > 0 is constant: ${N2(k)} / 0⁺ = +∞. So lim (x→${N2(c)}⁺) v = +∞.`);
        add(`Soldan (x → ${N2(c)}⁻): x − ${N2(c)} → 0⁻ (negatif), ama KARE yine pozitiftir: (x − ${N2(c)})² → 0⁺.`, `From the left (x → ${N2(c)}⁻): x − ${N2(c)} → 0⁻ (negative), but the SQUARE is again positive: (x − ${N2(c)})² → 0⁺.`);
        add(`Böylece lim (x→${N2(c)}⁻) v = ${N2(k)} / 0⁺ = +∞.`, `Hence lim (x→${N2(c)}⁻) v = ${N2(k)} / 0⁺ = +∞.`);
        add(`Tablo: |x − ${N2(c)}| = 1, 0.1, 0.01, 0.001 için v = ${N2(k)}, ${N2(k * 100)}, ${N2(k * 10000)}, ${N2(k * 1000000)} (her iki yandan aynı).`, `Table: for |x − ${N2(c)}| = 1, 0.1, 0.01, 0.001 the speed is ${N2(k)}, ${N2(k * 100)}, ${N2(k * 10000)}, ${N2(k * 1000000)} (the same from both sides).`);
        add(`Sonuç: iki tek taraflı limit de +∞ → lim (x→${N2(c)}) v(x) = +∞. Limit bir sayı değildir; x = ${N2(c)} DİKEY ASİMPTOTTUR.`, `Result: both one-sided limits are +∞ → lim (x→${N2(c)}) v(x) = +∞. The limit is not a number; x = ${N2(c)} is a VERTICAL ASYMPTOTE.`);
        add(`Karşılaştırma: ${N2(k)}/(x − ${N2(c)}) için soldan −∞, sağdan +∞ olurdu (işaret değişir). Burada kare işareti kilitler.`, `Contrast: for ${N2(k)}/(x − ${N2(c)}) the left limit would be −∞ and the right +∞ (the sign changes). Here the square locks the sign.`);
        add('Yorum: gerçekte sıvı sıkıştırılamaz ve model çok dar aralıkta bozulur; matematik "aralık kapanırken hız sınırsız büyür" der.', 'Interpretation: in reality the model fails for a very narrow gap; the mathematics says "the speed grows without bound as the gap closes".');
        break;
      }
      case 12: {
        const a = 0.01 * x[0], b = 0.0001 * x[1], T0 = x[2];
        const L = lenFn(x);
        const slope = a + 2 * b * T0;
        const dT = 10;
        const est = slope * dT, real = L(T0 + dT) - L(T0);
        add(`Model: L(T) = 200 + ${F(a, 2)}T + ${F(b, 4)}T². Ortalama oran: [L(T₀+h) − L(T₀)]/h, T₀ = ${N2(T0)}.`, `Model: L(T) = 200 + ${F(a, 2)}T + ${F(b, 4)}T². Average rate: [L(T₀+h) − L(T₀)]/h, T₀ = ${N2(T0)}.`);
        add(`L(${N2(T0)}) = 200 + ${F(a, 2)}·${N2(T0)} + ${F(b, 4)}·${N2(T0 * T0)} = ${F(L(T0), 4)} mm.`, `L(${N2(T0)}) = 200 + ${F(a, 2)}·${N2(T0)} + ${F(b, 4)}·${N2(T0 * T0)} = ${F(L(T0), 4)} mm.`);
        add(`L(${N2(T0)}+h) − L(${N2(T0)}) = ${F(a, 2)}h + ${F(b, 4)}[(${N2(T0)}+h)² − ${N2(T0 * T0)}] = ${F(a, 2)}h + ${F(b, 4)}(${N2(2 * T0)}h + h²).`, `L(${N2(T0)}+h) − L(${N2(T0)}) = ${F(a, 2)}h + ${F(b, 4)}[(${N2(T0)}+h)² − ${N2(T0 * T0)}] = ${F(a, 2)}h + ${F(b, 4)}(${N2(2 * T0)}h + h²).`);
        add(`Her terimde h ortak: = h·(${F(a + 2 * b * T0, 4)} + ${F(b, 4)}h).`, `Every term has h: = h·(${F(a + 2 * b * T0, 4)} + ${F(b, 4)}h).`);
        add(`h ≠ 0 için h'ye böl: ortalama oran = ${F(slope, 4)} + ${F(b, 4)}h.`, `For h ≠ 0 divide by h: average rate = ${F(slope, 4)} + ${F(b, 4)}h.`);
        add(`Tablo: h = 10 → ${F(slope + 10 * b, 4)},  h = 1 → ${F(slope + b, 4)},  h = 0.1 → ${F(slope + 0.1 * b, 5)}: değerler ${F(slope, 4)}'e yaklaşıyor.`, `Table: h = 10 → ${F(slope + 10 * b, 4)},  h = 1 → ${F(slope + b, 4)},  h = 0.1 → ${F(slope + 0.1 * b, 5)}: values approach ${F(slope, 4)}.`);
        add(`Limit: h → 0 iken ${F(slope, 4)} + ${F(b, 4)}h → ${F(slope, 4)} mm/°C. Kontrol: L'(T) = ${F(a, 2)} + ${F(2 * b, 4)}T → L'(${N2(T0)}) = ${F(slope, 4)} ✓.`, `Limit: as h → 0, ${F(slope, 4)} + ${F(b, 4)}h → ${F(slope, 4)} mm/°C. Check: L'(T) = ${F(a, 2)} + ${F(2 * b, 4)}T → L'(${N2(T0)}) = ${F(slope, 4)} ✓.`);
        add(`Doğrusal yaklaşım: ΔT = ${dT} °C için ΔL ≈ ${F(slope, 4)}·${dT} = ${F(est, 4)} mm; gerçek artış ${F(real, 4)} mm (hata ${F(Math.abs(real - est), 4)} mm = b·ΔT²).`, `Linear approximation: for ΔT = ${dT} °C, ΔL ≈ ${F(slope, 4)}·${dT} = ${F(est, 4)} mm; the true increase is ${F(real, 4)} mm (error ${F(Math.abs(real - est), 4)} mm = b·ΔT²).`);
        add('Yorum: teğetin eğimi (anlık genleşme hızı) küçük sıcaklık değişimleri için iyi bir tahmin verir; ΔT büyüdükçe teğet eğriden uzaklaşır.', 'Interpretation: the tangent slope (instantaneous expansion rate) is a good estimate for small temperature changes; the tangent drifts away from the curve as ΔT grows.');
        break;
      }
      default: {
        const Se = x[0], B = x[1], N = x[2];
        const SN = (Se * N + B) / (N + 1);
        add(`Model: S(N) = (${N2(Se)}N + ${N2(B)}) / (N + 1); N: ×10⁴ döngü, S: MPa. İstenen: lim (N→∞) S(N).`, `Model: S(N) = (${N2(Se)}N + ${N2(B)}) / (N + 1); N in 10⁴ cycles, S in MPa. Wanted: lim (N→∞) S(N).`);
        add('N = ∞ doğrudan ∞/∞ verir (belirsiz). Payı ve paydayı N\'ye böl (paydanın en büyük kuvveti).', 'Putting N = ∞ directly gives ∞/∞ (indeterminate). Divide numerator and denominator by N (the highest power of the denominator).');
        add(`S(N) = (${N2(Se)} + ${N2(B)}/N) / (1 + 1/N).`, `S(N) = (${N2(Se)} + ${N2(B)}/N) / (1 + 1/N).`);
        add(`N → ∞ iken ${N2(B)}/N → 0 ve 1/N → 0.`, `As N → ∞, ${N2(B)}/N → 0 and 1/N → 0.`);
        add(`Limit: lim S(N) = (${N2(Se)} + 0)/(1 + 0) = ${N2(Se)} MPa. Yatay asimptot: S = ${N2(Se)}.`, `Limit: lim S(N) = (${N2(Se)} + 0)/(1 + 0) = ${N2(Se)} MPa. Horizontal asymptote: S = ${N2(Se)}.`);
        add(`N = ${N2(N)}: S = (${N2(Se)}·${N2(N)} + ${N2(B)}) / (${N2(N)} + 1) = ${N2(Se * N + B)} / ${N2(N + 1)} = ${N2(SN)} MPa.`, `At N = ${N2(N)}: S = (${N2(Se)}·${N2(N)} + ${N2(B)}) / (${N2(N)} + 1) = ${N2(Se * N + B)} / ${N2(N + 1)} = ${N2(SN)} MPa.`);
        add(`Asimptota uzaklık: S − Sₑ = (B − Sₑ)/(N + 1) = ${N2(B - Se)}/${N2(N + 1)} = ${N2(SN - Se)} MPa > 0: eğri asimptotun üstünde kalır, yani S(N) hiçbir sonlu N'de Sₑ'ye eşit olmaz.`, `Distance to the asymptote: S − Sₑ = (B − Sₑ)/(N + 1) = ${N2(B - Se)}/${N2(N + 1)} = ${N2(SN - Se)} MPa > 0: the curve stays above the asymptote, so S(N) equals Sₑ at no finite N.`);
        add(`Başlangıç: S(0) = ${N2(B)} MPa (statik dayanım). Dayanım ${N2(B)} → ${N2(Se)} MPa'ya doğru azalır.`, `Start: S(0) = ${N2(B)} MPa (static strength). The strength decreases from ${N2(B)} toward ${N2(Se)} MPa.`);
        add(`Yorum: S, Sₑ'nin %5 yakınına (S − Sₑ ≤ ${N2(0.05 * Se)} MPa) N ≥ ${N2(Math.ceil((B - Se) / (0.05 * Se) - 1))} (×10⁴) döngüden sonra girer; Sₑ altındaki gerilimde parça pratikte sonsuz ömürlüdür.`, `Interpretation: S gets within 5% of Sₑ (S − Sₑ ≤ ${N2(0.05 * Se)} MPa) once N ≥ ${N2(Math.ceil((B - Se) / (0.05 * Se) - 1))} (×10⁴) cycles; at stresses below Sₑ the part practically has infinite life.`);
        break;
      }
    }
    return s;
  }

  function draw(canvas, problem) {
    const x = problem.p;
    const accent = canvas.accent();
    const gray = canvas.gray();
    const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
    switch (problem.scn) {
      case 0: {
        const v = x[0], c = x[1], t = x[2];
        canvas.setViewport(-3, 62, -v * 0.1, v * 1.2);
        canvas.addFunction({ evaluator: safe((u) => (u < 0 ? NaN : v * u / (u + c))), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: v, color: gray, label: `v = ${N2(v)}` });
        canvas.addMarker({ x: t, y: v * t / (t + c), color: canvas.gold(), radius: 7, label: `v(${N2(t)}) = ${N2(v * t / (t + c))}` });
        break;
      }
      case 1: {
        const a = x[0], b = x[1], t0 = x[2];
        const s0 = a * t0 * t0 + b * t0, slope = 2 * a * t0 + b, tmax = 2 * t0 + 2;
        canvas.setViewport(-0.5, tmax, -s0 * 0.3, a * tmax * tmax + b * tmax);
        canvas.addFunction({ evaluator: (u) => a * u * u + b * u, color: accent, thickness: 3 });
        canvas.addFunction({ evaluator: (u) => s0 + slope * (u - t0), color: gray, thickness: 2, dashed: true });
        canvas.addMarker({ x: t0, y: s0, color: canvas.gold(), radius: 7, label: `v = ${N2(slope)}` });
        break;
      }
      case 2: {
        const m = x[0], c = x[1];
        const xmax = 2 * c + 2;
        canvas.setViewport(-1, xmax, -m * 2, m * (xmax + c) + m);
        canvas.addFunction({ evaluator: safe((u) => (Math.abs(u - c) < 1e-9 ? NaN : m * (u * u - c * c) / (u - c))), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'vertical', position: c, color: gray });
        canvas.addMarker({ x: c, y: 2 * m * c, color: canvas.gold(), hollow: true, radius: 7, label: `(${N2(c)}, ${N2(2 * m * c)})` });
        break;
      }
      case 3: {
        const p = x[0], tt = x[1], f = x[2];
        canvas.setViewport(-0.5, 2 * tt, -f * 0.3, p * 2 * tt + f + f * 0.3);
        canvas.addFunction({ evaluator: (u) => (u <= tt ? p * u : NaN), color: canvas.green(), thickness: 3 });
        canvas.addFunction({ evaluator: (u) => (u > tt ? p * u + f : NaN), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'vertical', position: tt, color: gray });
        canvas.addMarker({ x: tt, y: p * tt, color: canvas.gold(), radius: 7, label: N2(p * tt) });
        canvas.addMarker({ x: tt, y: p * tt + f, color: canvas.gold(), hollow: true, radius: 7, label: N2(p * tt + f) });
        break;
      }
      case 4: {
        const k = x[0], d0 = x[1];
        canvas.setViewport(-0.3, 4, -k, k * 9);
        canvas.addFunction({ evaluator: (u) => (u <= 1e-7 ? NaN : k / (u * u)), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'vertical', position: 0, color: gray, label: 'd = 0' });
        canvas.addMarker({ x: d0, y: k / (d0 * d0), color: canvas.gold(), radius: 7, label: `F(${N2(d0)}) = ${N2(k / (d0 * d0))}` });
        break;
      }
      case 5: {
        const v0 = x[0], tau = x[1], n = x[2];
        canvas.setViewport(-0.5, 6.5 * tau, -v0 * 0.1, v0 * 1.2);
        canvas.addFunction({ evaluator: (u) => (u < 0 ? NaN : v0 * (1 - Math.exp(-u / tau))), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: v0, color: gray, label: `V = ${N2(v0)}` });
        canvas.addMarker({ x: n * tau, y: v0 * (1 - Math.exp(-n)), color: canvas.gold(), radius: 7, label: `${F(v0 * (1 - Math.exp(-n)), 3)} V` });
        break;
      }
      case 6: {
        const a = x[0], c = x[1], d = x[2];
        const b = c * c - d - a * c;
        const f = (u) => (u < c ? a * u + b : u * u - d);
        const lo = Math.min(f(-1), -d), hi = Math.max(f(-1), f(2 * c + 1));
        canvas.setViewport(-1, 2 * c + 1, lo - 2, hi + 2);
        canvas.addFunction({ evaluator: (u) => (u < c ? a * u + b : NaN), color: canvas.green(), thickness: 3 });
        canvas.addFunction({ evaluator: (u) => (u >= c ? u * u - d : NaN), color: accent, thickness: 3 });
        canvas.addMarker({ x: c, y: c * c - d, color: canvas.gold(), shape: 'diamond', radius: 7, label: `b = ${N2(b)}` });
        break;
      }
      case 7: {
        const k = x[0];
        canvas.setViewport(-0.5, 0.5, -0.3 * k, 0.3 * k);
        canvas.addFunction({ evaluator: (u) => k * u * u, color: gray, thickness: 2, dashed: true });
        canvas.addFunction({ evaluator: (u) => -k * u * u, color: gray, thickness: 2, dashed: true });
        canvas.addFunction({ evaluator: safe((u) => (Math.abs(u) < 1e-12 ? NaN : k * u * u * Math.sin(1 / u))), color: accent, thickness: 2 });
        canvas.addMarker({ x: 0, y: 0, color: canvas.gold(), hollow: true, radius: 7, label: 'L = 0' });
        break;
      }
      case 8: {
        const m = x[0], c = x[1];
        canvas.setViewport(c - 10, c + 10, -m * 2, m * 2);
        canvas.addFunction({ evaluator: safe((u) => (Math.abs(u - c) < 1e-9 ? NaN : m * Math.abs(u - c) / (u - c))), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'vertical', position: c, color: gray });
        canvas.addMarker({ x: c, y: -m, color: canvas.gold(), hollow: true, radius: 7, label: `−${N2(m)}` });
        canvas.addMarker({ x: c, y: m, color: canvas.gold(), hollow: true, radius: 7, label: `+${N2(m)}` });
        break;
      }
      case 9: {
        const vT = x[0], t = x[1];
        const f = (u) => (u < 0 ? NaN : vT * Math.tanh(G * u / vT));
        const tmax = Math.max(12, 5 * vT / G, t * 1.4);
        canvas.setViewport(-tmax * 0.04, tmax, -vT * 0.1, vT * 1.25);
        canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: vT, color: gray, label: `vₜ = ${N2(vT)}` });
        canvas.addMarker({ x: t, y: f(t), color: canvas.gold(), radius: 7, label: `v(${N2(t)}) = ${F(f(t), 2)}` });
        break;
      }
      case 10: {
        const D = x[0], tau = x[1], n = x[2];
        const f = (u) => (u < 0 ? NaN : D * u * Math.exp(-u / tau));
        const peak = D * tau / Math.E;
        canvas.setViewport(-0.4 * tau, 8 * tau, -peak * 0.12, peak * 1.4);
        canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: 0, color: gray, label: 'C → 0' });
        canvas.addMarker({ x: tau, y: peak, color: canvas.blue(), radius: 6, label: tx(`tepe ${F(peak, 2)}`, `peak ${F(peak, 2)}`) });
        canvas.addMarker({ x: n * tau, y: f(n * tau), color: canvas.gold(), radius: 7, label: `C(${N2(n * tau)}) = ${F(f(n * tau), 2)}` });
        break;
      }
      case 11: {
        const k = x[0], c = x[1], d = x[2];
        const f = (u) => (Math.abs(u - c) < 1e-7 ? NaN : k / ((u - c) * (u - c)));
        canvas.setViewport(c - 4, c + 4, -k, k * 9);
        canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'vertical', position: c, color: gray, label: `x = ${N2(c)}` });
        canvas.addMarker({ x: c + d, y: k / (d * d), color: canvas.gold(), radius: 7, label: `v = ${N2(k / (d * d))}` });
        break;
      }
      case 12: {
        const a = 0.01 * x[0], b = 0.0001 * x[1], T0 = x[2];
        const L = lenFn(x);
        const slope = a + 2 * b * T0, L0 = L(T0);
        const lo = L(0), hi = L(100);
        const pad = (hi - lo) * 0.2;
        canvas.setViewport(-5, 105, lo - pad, hi + pad);
        canvas.addFunction({ evaluator: L, color: accent, thickness: 3 });
        canvas.addFunction({ evaluator: (u) => L0 + slope * (u - T0), color: gray, thickness: 2, dashed: true });
        canvas.addMarker({ x: T0, y: L0, color: canvas.gold(), radius: 7, label: `L' = ${F(slope, 4)}` });
        canvas.addMarker({ x: T0 + 10, y: L(T0 + 10), color: canvas.blue(), radius: 5, label: `ΔT = 10` });
        break;
      }
      default: {
        const Se = x[0], B = x[1], N = x[2];
        const f = (u) => (u < 0 ? NaN : (Se * u + B) / (u + 1));
        canvas.setViewport(-3, 62, Se * 0.6, B * 1.1);
        canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: Se, color: gray, label: `Sₑ = ${N2(Se)}` });
        canvas.addMarker({ x: N, y: f(N), color: canvas.gold(), radius: 7, label: `S(${N2(N)}) = ${N2(f(N))}` });
        break;
      }
    }
  }

  // operating point highlighted by draw(): the first gold marker (else first marker, else window centre)
  function focus(problem) {
    try {
      let vp = null, gold = null, first = null;
      const rec = new Proxy({}, { get: (t, k) => {
        if (k === 'gold') return () => 'GOLD';
        if (k === 'setViewport') return (a, b, c, d) => { vp = [a, b, c, d]; };
        if (k === 'addMarker') return (m) => { if (!first) first = m; if (!gold && m && m.color === 'GOLD') gold = m; };
        return () => 'c';
      } });
      draw(rec, problem);
      const m = gold || first;
      if (m && Number.isFinite(m.x) && Number.isFinite(m.y)) return { x: m.x, y: m.y };
      return vp ? { x: (vp[0] + vp[1]) / 2, y: (vp[2] + vp[3]) / 2 } : null;
    } catch (e) { return null; }
  }

  function syncSliders(problem) {
    if (sliderRows.length === 0) return;
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

  function problemStatement(problem) {
    return Question(problem);
  }

  function concept(problem) {
    const head = tx('HAYATTAN ÖRNEK', 'REAL-LIFE EXAMPLE') + '\n' + Titles()[problem.scn] + '\n\n' +
      tx('BİRİM VE ANLAM', 'UNITS AND MEANING') + '\n' + Info(problem) + '\n\n';
    const how = tx(
      'NASIL ÇÖZÜLÜR?\n   (1) Önce soruyu bir limit sorusuna çevirebiliriz: hangi değişken neye yaklaşıyor (x → c, ya da → ∞)?\n   (2) Doğrudan yerine koymayı deneyebiliriz; 0/0, ∞/∞ veya ∞·0 çıkarsa cebirle (çarpanlara ayırma, sadeleştirme, bölme) ya da L\'Hôpital ile çözebiliriz.\n   (3) Gerekirse soldan ve sağdan limitleri ayrı hesaplarız; eşitlerse limit vardır.\n   (4) Sonucu birimiyle ve fiziksel yorumuyla yazarız.\n\n',
      'HOW TO SOLVE IT\n   (1) First we can turn the question into a limit question: which variable approaches what (x → c, or → ∞)?\n   (2) We can try direct substitution; if we get 0/0, ∞/∞ or ∞·0, we can fix it with algebra (factoring, cancelling, dividing) or L\'Hôpital.\n   (3) If needed we compute the left and right limits separately; if they agree the limit exists.\n   (4) Finally we state the result with its unit and its physical interpretation.\n\n');
    if (showMeaning) {
      return head + how + tx('BU SORUDA MATEMATİKSEL OLARAK NE İSTENİYOR?', 'WHAT IS THIS QUESTION ASKING, MATHEMATICALLY?') + '\n' + Meaning(problem);
    }
    return head + how + tx(
      "(Çözmeden önce sorunun matematiksel karşılığını görmek için 'Soru ne demek istiyor?' düğmesine basabiliriz.)",
      "(To see what the question means mathematically before solving, we can press the 'What does the question mean?' button.)");
  }

  function buildControls(rightCol, getProblem, helpers) {
    const selectReg = helpers.addSelect({
      options: Titles().map((label, value) => ({ label, value })),
      get: () => currentScenario,
      set: (v) => { currentScenario = Number(v); helpers.regenerate(); },
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
    for (let i = 0; i < 4; i++) {
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

  Topics.register('limits', {
    id: 'realLifeLimits',
    tabTitle: () => tx('Hayattan Örnekler', 'Real-Life Examples'),
    concept,
    problemStatement,
    createProblem,
    solveSteps: Steps,
    draw,
    focus,
    buildControls,
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
  });
})();
