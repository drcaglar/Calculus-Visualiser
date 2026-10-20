// Ported from Modules/Derivatives/RealLifeDerivativesControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/limits/realLifeLimits.js): ten ported scenarios (velocity/acceleration, average vs instantaneous rate, marginal
// cost, road slope, product rule, quotient rule, chain rule, implicit derivative, exponential growth, sine vibration) plus
// four NEW ones (sliding ladder = related rates, Newton cooling, inductor voltage = L di/dt, inflating balloon = chain rule).
// problem = { scn, p: [numbers] } (mirrors RlProblem). Module-level state survives "New Example".
(function () {
  let currentScenario = 0;
  let showMeaning = false;
  let sliderRows = [];
  let offLangCustom = null;
  let lastOp = null;

  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v).replace(/-/g, '−');
  const Spec = (caption, min, max, step) => ({ caption, min, max, step });
  // up to `dec` decimals (VB 0.# / 0.### / 0.####)
  function F(v, dec) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/[.]$/, '');
    if (s === '-0') s = '0';
    return s.replace(/-/g, '−');
  }
  // VB Money(): v.ToString("#,0.##") - thousands separator, up to 2 decimals
  function Money(v) {
    const neg = v < 0;
    v = Math.abs(v);
    const s = fmt2(v);
    const parts = s.split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + (parts[1] ? intPart + '.' + parts[1] : intPart);
  }
  const PI = Math.PI;

  function Titles() {
    return [
      tx('1. Hız ve ivme: asansör konumu', '1. Velocity and acceleration: lift position'),
      tx('2. Ortalama ve anlık değişim: fırın sıcaklığı', '2. Average vs instantaneous rate: oven temperature'),
      tx('3. Marjinal maliyet: parça üretimi', '3. Marginal cost: part production'),
      tx('4. Yol eğimi: kıvrımlı rampa', '4. Road slope: curved ramp'),
      tx('5. Çarpım kuralı: güç P = F·v', '5. Product rule: power P = F·v'),
      tx('6. Bölüm kuralı: birim başına ortalama maliyet', '6. Quotient rule: average cost per unit'),
      tx('7. Zincir kuralı: yayılan yağ lekesi', '7. Chain rule: spreading oil spill'),
      tx('8. Kapalı türev: gaz basıncı PV = k', '8. Implicit derivative: gas pressure PV = k'),
      tx('9. Üstel büyüme: bakteri nüfusu', '9. Exponential growth: bacteria population'),
      tx('10. Sinüs: titreşen parçanın hızı', '10. Sine: velocity of a vibrating part'),
      tx('11. Bağlı değişim hızları: kayan merdiven', '11. Related rates: sliding ladder'),
      tx('12. Newton soğuma yasası: sıcak parça', "12. Newton's law of cooling: hot part"),
      tx('13. Bobin gerilimi: v = L·di/dt', '13. Inductor voltage: v = L·di/dt'),
      tx('14. Zincir kuralı: şişen balon', '14. Chain rule: inflating balloon'),
    ];
  }

  function Specs(scn) {
    switch (scn) {
      case 0: return [Spec(tx('a (s = a·t³ + b·t², metre)', 'a (s = a·t³ + b·t², metres)'), 1, 3, 1), Spec('b', 1, 5, 1), Spec(tx('Zaman t (s)', 'Time t (s)'), 1, 4, 1)];
      case 1: return [Spec(tx('Başlangıç sıcaklığı T₀ (°C)', 'Initial temperature T₀ (°C)'), 20, 40, 5), Spec(tx('a (T = T₀ + a·t²)', 'a (T = T₀ + a·t²)'), 1, 4, 1), Spec(tx('Zaman t (dk)', 'Time t (min)'), 2, 6, 2)];
      case 2: return [Spec(tx('Sabit gider F (TL)', 'Fixed cost F (TL)'), 500, 2000, 500), Spec(tx('a (TL/adet)', 'a (TL/unit)'), 10, 50, 10), Spec(tx('b (TL/adet²)', 'b (TL/unit²)'), 1, 5, 1), Spec(tx('Üretim q (adet)', 'Production q (units)'), 10, 50, 10)];
      case 3: return [Spec(tx('a (h = a·x² + b·x, ×0.01)', 'a (h = a·x² + b·x, ×0.01)'), 1, 5, 1), Spec(tx('b (×0.01)', 'b (×0.01)'), 2, 10, 2), Spec(tx('Konum x (m)', 'Position x (m)'), 10, 50, 10)];
      case 4: return [Spec(tx('a (F = a + b·t, N)', 'a (F = a + b·t, N)'), 10, 50, 10), Spec(tx('b (N/s)', 'b (N/s)'), 2, 10, 2), Spec(tx('c (v = c·t, m/s²)', 'c (v = c·t, m/s²)'), 1, 3, 1), Spec(tx('Zaman t (s)', 'Time t (s)'), 1, 5, 1)];
      case 5: return [Spec(tx('Sabit gider F (TL)', 'Fixed cost F (TL)'), 100, 500, 100), Spec(tx('a (TL/adet²)', 'a (TL/unit²)'), 1, 5, 1), Spec(tx('Üretim q (adet)', 'Production q (units)'), 5, 20, 5)];
      case 6: return [Spec(tx('Yarıçap büyüme hızı k (m/dk)', 'Radius growth rate k (m/min)'), 1, 4, 1), Spec(tx('Zaman t (dk)', 'Time t (min)'), 1, 5, 1)];
      case 7: return [Spec(tx('Başlangıç basıncı P₀ (kPa)', 'Initial pressure P₀ (kPa)'), 100, 300, 50), Spec(tx('Başlangıç hacmi V₀ (L)', 'Initial volume V₀ (L)'), 2, 10, 2)];
      case 8: return [Spec(tx('Başlangıç nüfusu N₀', 'Initial population N₀'), 100, 500, 100), Spec(tx('Büyüme katsayısı k (1/sa)', 'Growth constant k (1/h)'), 0.1, 0.5, 0.1), Spec(tx('Zaman t (sa)', 'Time t (h)'), 1, 5, 1)];
      case 9: return [Spec(tx('Genlik A (mm)', 'Amplitude A (mm)'), 1, 5, 1), Spec(tx('Açısal frekans ω (rad/s)', 'Angular frequency ω (rad/s)'), 1, 4, 1), Spec(tx('Zaman t (s)', 'Time t (s)'), 0.5, 3, 0.5)];
      case 10: return [Spec(tx('Ölçek k (merdiven 5k m, taban 3k m)', 'Scale k (ladder 5k m, base 3k m)'), 1, 4, 1), Spec(tx('Tabanın kayma hızı dx/dt (m/s)', 'Base sliding speed dx/dt (m/s)'), 1, 4, 1)];
      case 11: return [Spec(tx('Başlangıç sıcaklığı T₀ (°C)', 'Initial temperature T₀ (°C)'), 60, 100, 10), Spec(tx('Ortam sıcaklığı Tₐ (°C)', 'Ambient temperature Tₐ (°C)'), 10, 30, 10), Spec(tx('Soğuma katsayısı k (1/dk)', 'Cooling constant k (1/min)'), 0.1, 0.5, 0.1), Spec(tx('Zaman t (dk)', 'Time t (min)'), 1, 6, 1)];
      case 12: return [Spec(tx('Akım genliği I (A)', 'Current amplitude I (A)'), 1, 5, 1), Spec(tx('Açısal frekans ω (rad/s)', 'Angular frequency ω (rad/s)'), 2, 8, 2), Spec(tx('Endüktans L (H)', 'Inductance L (H)'), 1, 4, 1), Spec(tx('Zaman t (s)', 'Time t (s)'), 0.1, 0.5, 0.1)];
      default: return [Spec(tx('Başlangıç yarıçapı r₀ (cm)', 'Initial radius r₀ (cm)'), 2, 6, 1), Spec(tx('Yarıçap artış hızı k (cm/s)', 'Radius growth rate k (cm/s)'), 1, 3, 1), Spec(tx('Zaman t (s)', 'Time t (s)'), 1, 4, 1)];
    }
  }

  // ============================ question ============================
  function Question(p) {
    const x = p.p;
    switch (p.scn) {
      case 0:
        return tx(`Bir yük asansörünün zemine göre yüksekliği s(t) = ${N2(x[0])}t³ + ${N2(x[1])}t² metredir (t saniye). t = ${N2(x[2])} s anında asansörün hızı ve ivmesi nedir?`,
          `The height of a freight lift above the floor is s(t) = ${N2(x[0])}t³ + ${N2(x[1])}t² metres (t in seconds). What are the velocity and acceleration of the lift at t = ${N2(x[2])} s?`);
      case 1:
        return tx(`Bir fırında parça sıcaklığı T(t) = ${N2(x[0])} + ${N2(x[1])}t² °C ile artıyor (t dakika). 0 ile ${N2(x[2])} dakika arasındaki ORTALAMA ısınma hızı nedir? ${N2(x[2])}. dakikadaki ANLIK ısınma hızı nedir?`,
          `In an oven the temperature of a part rises as T(t) = ${N2(x[0])} + ${N2(x[1])}t² °C (t in minutes). What is the AVERAGE heating rate between 0 and ${N2(x[2])} minutes? What is the INSTANTANEOUS heating rate at minute ${N2(x[2])}?`);
      case 2:
        return tx(`Bir atölyede q adet parça üretmenin maliyeti C(q) = ${Money(x[0])} + ${N2(x[1])}q + ${N2(x[2])}q² TL. Üretim q = ${N2(x[3])} adetteyken marjinal maliyet (bir parça daha üretmenin yaklaşık ek maliyeti) nedir?`,
          `In a workshop, producing q parts costs C(q) = ${Money(x[0])} + ${N2(x[1])}q + ${N2(x[2])}q² TL. At a production level of q = ${N2(x[3])} units, what is the marginal cost (the approximate extra cost of making one more part)?`);
      case 3: {
        const a = x[0] / 100, b = x[1] / 100;
        return tx(`Bir rampanın yüksekliği h(x) = ${N2(a)}x² + ${N2(b)}x metredir (x: yatay uzaklık, metre). x = ${N2(x[2])} m noktasındaki eğim nedir (yüzde olarak)?`,
          `The height of a ramp is h(x) = ${N2(a)}x² + ${N2(b)}x metres (x: horizontal distance in metres). What is the slope at x = ${N2(x[2])} m (as a percentage)?`);
      }
      case 4:
        return tx(`Bir arabayı iten kuvvet F(t) = ${N2(x[0])} + ${N2(x[1])}t newton, hız v(t) = ${N2(x[2])}t m/s (t saniye). Güç P = F·v watttır. t = ${N2(x[3])} s anında gücün değişim hızı dP/dt nedir?`,
          `The force pushing a cart is F(t) = ${N2(x[0])} + ${N2(x[1])}t newtons and its speed is v(t) = ${N2(x[2])}t m/s (t in seconds). Power is P = F·v watts. What is the rate of change of power dP/dt at t = ${N2(x[3])} s?`);
      case 5:
        return tx(`Bir parçanın q adetlik üretiminde toplam maliyet C(q) = ${Money(x[0])} + ${N2(x[1])}q² TL, birim başına ortalama maliyet A(q) = C(q)/q. q = ${N2(x[2])} adetteyken üretimi artırmak ortalama maliyeti nasıl değiştirir (dA/dq)?`,
          `The total cost of making q parts is C(q) = ${Money(x[0])} + ${N2(x[1])}q² TL and the average cost per unit is A(q) = C(q)/q. At q = ${N2(x[2])} units, how does increasing production change the average cost (dA/dq)?`);
      case 6:
        return tx(`Denize dökülen yağ dairesel bir leke oluşturuyor; yarıçapı r(t) = ${N2(x[0])}t metre (t dakika) büyüyor. Lekenin alanı A = πr² ise t = ${N2(x[1])} dakikada alan ne hızla artıyor (dA/dt)?`,
          `Oil spilled at sea forms a circular slick whose radius grows as r(t) = ${N2(x[0])}t metres (t in minutes). If the area is A = πr², how fast is the area increasing at t = ${N2(x[1])} minutes (dA/dt)?`);
      case 7:
        return tx(`Sabit sıcaklıkta bir pistonlu silindirdeki gaz için P·V = k. Hacim V = ${N2(x[1])} L iken basınç P = ${N2(x[0])} kPa. Hacim değişirken basıncın hacme göre değişim hızı dP/dV nedir?`,
          `For gas in a piston cylinder at constant temperature, P·V = k. When the volume is V = ${N2(x[1])} L the pressure is P = ${N2(x[0])} kPa. What is the rate of change of pressure with respect to volume, dP/dV, at that moment?`);
      case 8:
        return tx(`Bir bakteri kültürünün nüfusu N(t) = ${N2(x[0])}·e^(${N2(x[1])}t) ile büyüyor (t saat). t = ${N2(x[2])} saatte nüfus ne kadar hızla artıyor (dN/dt)?`,
          `A bacteria culture grows as N(t) = ${N2(x[0])}·e^(${N2(x[1])}t) (t in hours). How fast is the population increasing at t = ${N2(x[2])} hours (dN/dt)?`);
      case 9:
        return tx(`Titreşen bir makine parçasının konumu x(t) = ${N2(x[0])}·sin(${N2(x[1])}t) milimetredir (t saniye). t = ${N2(x[2])} s anında parçanın hızı nedir?`,
          `The position of a vibrating machine part is x(t) = ${N2(x[0])}·sin(${N2(x[1])}t) millimetres (t in seconds). What is the velocity of the part at t = ${N2(x[2])} s?`);
      case 10:
        return tx(`${N2(5 * x[0])} m uzunluğundaki bir merdiven duvara dayalıdır. Taban duvardan ${N2(x[1])} m/s hızla uzaklaşırken, tabanın duvara uzaklığı ${N2(3 * x[0])} m olduğu anda merdivenin duvardaki ucu ne hızla kayıyor (dy/dt)?`,
          `A ${N2(5 * x[0])} m ladder leans against a wall. The base slides away from the wall at ${N2(x[1])} m/s. At the instant the base is ${N2(3 * x[0])} m from the wall, how fast is the top of the ladder sliding down the wall (dy/dt)?`);
      case 11:
        return tx(`Sıcaklığı ${N2(x[0])} °C olan bir parça, ${N2(x[1])} °C'lik ortamda T(t) = ${N2(x[1])} + ${N2(x[0] - x[1])}·e^(−${N2(x[2])}t) °C ile soğuyor (t dakika). t = ${N2(x[3])} dakikada soğuma hızı dT/dt nedir? Bu hız T − Tₐ ile nasıl ilişkilidir?`,
          `A part at ${N2(x[0])} °C cools in a ${N2(x[1])} °C room as T(t) = ${N2(x[1])} + ${N2(x[0] - x[1])}·e^(−${N2(x[2])}t) °C (t in minutes). What is the cooling rate dT/dt at t = ${N2(x[3])} minutes? How is it related to T − Tₐ?`);
      case 12:
        return tx(`Bir bobinden geçen akım i(t) = ${N2(x[0])}·sin(${N2(x[1])}t) amperdir (t saniye). Bobinin endüktansı L = ${N2(x[2])} H ise, gerilimi v = L·di/dt volttur. t = ${N2(x[3])} s anında gerilim kaç volttur?`,
          `The current through a coil is i(t) = ${N2(x[0])}·sin(${N2(x[1])}t) amperes (t in seconds). With inductance L = ${N2(x[2])} H the voltage is v = L·di/dt volts. What is the voltage at t = ${N2(x[3])} s?`);
      default:
        return tx(`Bir balon küre biçiminde şişiyor; yarıçapı r(t) = ${N2(x[0])} + ${N2(x[1])}t cm (t saniye). Hacim V = (4/3)πr³ ise t = ${N2(x[2])} s anında hacim ne hızla artıyor (dV/dt)?`,
          `A balloon inflates as a sphere; its radius is r(t) = ${N2(x[0])} + ${N2(x[1])}t cm (t in seconds). If the volume is V = (4/3)πr³, how fast is the volume increasing at t = ${N2(x[2])} s (dV/dt)?`);
    }
  }

  // units + physical meaning of the derivative (always shown)
  function Info(p) {
    switch (p.scn) {
      case 0: return tx('Birimler: t saniye, s metre, hız m/s, ivme m/s². Türevin anlamı: hız = konumun değişim hızı, ivme = hızın değişim hızı.', 'Units: t in seconds, s in metres, velocity in m/s, acceleration in m/s². Meaning of the derivative: velocity = rate of change of position, acceleration = rate of change of velocity.');
      case 1: return tx('Birimler: t dakika, T °C, hız °C/dk. Türevin anlamı: ortalama hız KİRİŞİN eğimi, anlık hız TEĞETİN eğimi.', 'Units: t in minutes, T in °C, rate in °C/min. Meaning of the derivative: the average rate is the slope of the CHORD, the instantaneous rate is the slope of the TANGENT.');
      case 2: return tx('Birimler: q adet, C TL, marjinal maliyet TL/adet. Türevin anlamı: bir birim daha üretmenin yaklaşık ek maliyeti.', 'Units: q in units, C in TL, marginal cost in TL/unit. Meaning of the derivative: the approximate extra cost of producing one more unit.');
      case 3: return tx('Birimler: x ve h metre, eğim birimsiz (m/m). Türevin anlamı: o noktadaki teğetin eğimi = yükselme/yatay uzaklık; ×100 = yüzde eğim.', 'Units: x and h in metres, the slope is unitless (m/m). Meaning of the derivative: the slope of the tangent there = rise/run; ×100 = percent slope.');
      case 4: return tx('Birimler: F newton, v m/s, P watt (N·m/s), dP/dt W/s. Türevin anlamı: gücün zamanla artış hızı; çarpımın türevinde iki çarpan da katkı verir.', 'Units: F in newtons, v in m/s, P in watts (N·m/s), dP/dt in W/s. Meaning of the derivative: how fast power grows with time; in a product both factors contribute.');
      case 5: return tx('Birimler: q adet, C TL, A TL/adet, dA/dq TL/adet². Türevin anlamı: bir adet daha üretince ortalama maliyetin ne kadar değiştiği.', 'Units: q in units, C in TL, A in TL/unit, dA/dq in TL/unit². Meaning of the derivative: how much the average cost changes when one more unit is produced.');
      case 6: return tx('Birimler: r metre, A m², t dakika, dA/dt m²/dk. Türevin anlamı: alanın zamanla artış hızı; yarıçap üzerinden zincirleme etki.', 'Units: r in metres, A in m², t in minutes, dA/dt in m²/min. Meaning of the derivative: how fast the area grows with time, passed on through the radius.');
      case 7: return tx('Birimler: P kPa, V litre, dP/dV kPa/L. Türevin anlamı: hacim 1 L artınca basıncın yaklaşık değişimi (negatif: sıkıştıkça basınç artar).', 'Units: P in kPa, V in litres, dP/dV in kPa/L. Meaning of the derivative: the approximate change in pressure when the volume grows by 1 L (negative: pressure rises as the gas is compressed).');
      case 8: return tx('Birimler: t saat, N bakteri, dN/dt bakteri/sa. Türevin anlamı: anlık büyüme hızı; üstel büyümede N\' = k·N.', 'Units: t in hours, N in bacteria, dN/dt in bacteria/h. Meaning of the derivative: the instantaneous growth rate; for exponential growth N\' = k·N.');
      case 9: return tx('Birimler: t saniye, x milimetre, v mm/s, açı radyan. Türevin anlamı: konumun değişim hızı = hız; işareti yönü verir.', 'Units: t in seconds, x in millimetres, v in mm/s, angle in radians. Meaning of the derivative: the rate of change of position = velocity; its sign gives the direction.');
      case 10: return tx('Birimler: x, y, L metre, hızlar m/s. Türevin anlamı: bağlı değişim hızları; x ve y zamanla değişir ama x² + y² = L² her an geçerlidir.', 'Units: x, y, L in metres, rates in m/s. Meaning of the derivative: related rates; x and y change with time but x² + y² = L² holds at every instant.');
      case 11: return tx('Birimler: t dakika, T °C, dT/dt °C/dk. Türevin anlamı: soğuma hızı; negatif işaret soğumayı gösterir ve hız T − Tₐ ile orantılıdır.', 'Units: t in minutes, T in °C, dT/dt in °C/min. Meaning of the derivative: the cooling rate; the negative sign means cooling and the rate is proportional to T − Tₐ.');
      case 12: return tx('Birimler: i amper, L henri, di/dt A/s, v volt (H·A/s = V). Türevin anlamı: akımın değişim hızı gerilimi belirler.', 'Units: i in amperes, L in henries, di/dt in A/s, v in volts (H·A/s = V). Meaning of the derivative: the rate of change of current determines the voltage.');
      default: return tx('Birimler: r cm, V cm³, t saniye, dV/dt cm³/s. Türevin anlamı: hacmin zamanla artış hızı; yarıçap üzerinden zincir kuralı.', 'Units: r in cm, V in cm³, t in seconds, dV/dt in cm³/s. Meaning of the derivative: how fast the volume grows with time, via the radius (chain rule).');
    }
  }

  function Meaning(p) {
    switch (p.scn) {
      case 0:
        return tx("'Hız' konumun zamana göre değişim hızıdır, 'ivme' ise hızın zamana göre değişim hızıdır. Matematikte 'değişim hızı' her zaman TÜREV demektir. " +
          "Yani hız = s'(t), ivme = v'(t) = s''(t). Kuvvet kuralı (d/dt tⁿ = n·tⁿ⁻¹) her terimde ayrı ayrı uygulanır; sabit çarpan olduğu gibi kalır. " +
          "Matematiksel olarak s(t)'nin birinci ve ikinci türevini bulup t'nin verilen değerini yerine koyabiliriz.",
          "'Velocity' is the rate of change of position with time and 'acceleration' is the rate of change of velocity. In mathematics a 'rate of change' always means a DERIVATIVE. " +
          "So velocity = s'(t) and acceleration = v'(t) = s''(t). The power rule (d/dt tⁿ = n·tⁿ⁻¹) is applied term by term; constant factors stay. " +
          "Mathematically, we can find the first and second derivatives of s(t) and then substitute the given t.");
      case 1:
        return tx("İki farklı 'hız' soruluyor. ORTALAMA hız iki nokta arasındaki kirişin eğimidir: (T(t₂) − T(t₁)) / (t₂ − t₁). ANLIK hız ise tek bir noktadaki teğetin eğimidir, yani TÜREV T'(t). " +
          "'Hız' kelimesi 'bir birimlik zamandaki değişim' demektir; aralık küçüldükçe ortalama, anlık değere yaklaşır. " +
          "Matematiksel olarak (1) kiriş eğimini hesaplayabilir, (2) kuvvet kuralıyla T'(t)'yi bulup verilen t'de değerlendirebiliriz.",
          "Two different 'rates' are asked. The AVERAGE rate is the slope of the chord between two points: (T(t₂) − T(t₁)) / (t₂ − t₁). The INSTANTANEOUS rate is the slope of the tangent at one point, i.e. the DERIVATIVE T'(t). " +
          "The word 'rate' means 'change per one unit of time'; as the interval shrinks the average approaches the instantaneous value. " +
          "Mathematically, we can (1) compute the chord slope and (2) find T'(t) by the power rule and evaluate it at the given t.");
      case 2:
        return tx("'Marjinal maliyet' bir parça daha üretmenin ek maliyetidir; bu, maliyet fonksiyonunun üretim miktarına göre değişim hızı yani TÜREVİDİR: MC(q) = C'(q). " +
          "Sabit gider türevde kaybolur (sabitin türevi 0); q ve q² terimleri kuvvet kuralıyla türetilir. " +
          "Matematiksel olarak C'(q)'yu bulup q'nun verilen değerinde hesaplayabiliriz.",
          "'Marginal cost' is the extra cost of making one more part; this is the rate of change of the cost function with respect to quantity, i.e. its DERIVATIVE: MC(q) = C'(q). " +
          "The fixed cost vanishes in the derivative (derivative of a constant is 0); the q and q² terms use the power rule. " +
          "Mathematically, we can find C'(q) and evaluate it at the given q.");
      case 3:
        return tx("Bir eğrinin bir noktadaki 'eğimi' o noktadaki teğet doğrunun eğimidir, yani TÜREVDİR: eğim = h'(x) = dh/dx (yükseklik değişimi / yatay değişim). " +
          "Yüzde eğim, bu oranın 100 ile çarpılmış hâlidir. Türev kuvvet kuralıyla terim terim alınır. " +
          "Matematiksel olarak h'(x)'i bulup x'in verilen değerinde hesaplar, sonra 100 ile çarparız.",
          "The 'slope' of a curve at a point is the slope of the tangent line there, i.e. the DERIVATIVE: slope = h'(x) = dh/dx (rise over run). " +
          "Percent slope is this ratio times 100. The derivative is taken term by term with the power rule. " +
          "Mathematically, we find h'(x), evaluate at the given x, and multiply by 100.");
      case 4:
        return tx("Güç, iki değişken ZAMANLA değişen çarpanın çarpımıdır: P = F·v, ikisi de t'ye bağlıdır. 'Gücün değişim hızı' dP/dt, yani P'nin TÜREVİDİR. " +
          "Bir çarpımın türevi için ÇARPIM KURALI gerekir: (F·v)' = F'·v + F·v'. Önce çarpımı açıp da türetebiliriz, ama kural her durumda çalışır. " +
          "Matematiksel olarak F' ve v'yi bulup çarpım kuralına koyar, t'nin verilen değerinde hesaplarız.",
          "Power is the product of two quantities that both change with time: P = F·v, each depending on t. 'The rate of change of power' dP/dt is the DERIVATIVE of P. " +
          "The derivative of a product needs the PRODUCT RULE: (F·v)' = F'·v + F·v'. We could expand first, but the rule works in every case. " +
          "Mathematically, we find F' and v', put them in the product rule, and evaluate at the given t.");
      case 5:
        return tx("Ortalama maliyet A(q) = C(q)/q iki fonksiyonun BÖLÜMÜDÜR. 'Üretimi artırmak ortalamayı nasıl değiştirir?' sorusu dA/dq, yani A'nın TÜREVİNİ ister. " +
          "Bölümün türevi için BÖLÜM KURALI gerekir: (u/v)' = (u'·v − u·v') / v². İşaret önemlidir: türev negatifse ortalama maliyet düşüyor, pozitifse artıyor demektir. " +
          "Matematiksel olarak u = C(q), v = q alıp bölüm kuralıyla A'(q)'yu bulabilir, q'nun verilen değerinde hesaplayabiliriz.",
          "The average cost A(q) = C(q)/q is a QUOTIENT of two functions. 'How does more production change the average?' asks for dA/dq, the DERIVATIVE of A. " +
          "The derivative of a quotient needs the QUOTIENT RULE: (u/v)' = (u'·v − u·v') / v². The sign matters: a negative derivative means the average cost is falling, a positive one means it is rising. " +
          "Mathematically, we can take u = C(q), v = q, find A'(q) by the quotient rule and evaluate at the given q.");
      case 6:
        return tx("Alan A yarıçap r'ye, r ise zamana bağlıdır: A(r(t)). Bu bir BİLEŞKE fonksiyondur ve 'alan ne hızla artıyor' dA/dt, yani zamana göre TÜREV demektir. " +
          "ZİNCİR KURALI der ki: dA/dt = (dA/dr)·(dr/dt). Yani dıştaki fonksiyonu (πr²) türetip içteki fonksiyonun (r(t)) türeviyle çarparız. " +
          "Matematiksel olarak dA/dr ve dr/dt'yi bulup çarpar, t'nin verilen değerinde hesaplarız.",
          "The area A depends on the radius r, and r depends on time: A(r(t)). This is a COMPOSITE function and 'how fast is the area growing' means dA/dt, the derivative with respect to time. " +
          "The CHAIN RULE says: dA/dt = (dA/dr)·(dr/dt). We differentiate the outer function (πr²), then multiply by the derivative of the inner function r(t). " +
          "Mathematically, we find dA/dr and dr/dt, multiply, and evaluate at the given t.");
      case 7:
        return tx("P ve V arasındaki ilişki P·V = k biçiminde KAPALI verilmiş: P'yi V cinsinden açıkça yazmadan da türev alabiliriz. Burada P, V'nin fonksiyonu kabul edilir. " +
          "Her iki tarafı V'ye göre türetiriz: sol tarafta ÇARPIM KURALI ve ZİNCİR KURALI (P, V'ye bağlı) gerekir, sağ taraf sabit olduğundan 0 olur. Sonra dP/dV çözülür. " +
          "'Değişim hızı' yine türev demektir. Matematiksel olarak kapalı türevle dP/dV'yi bulup verilen P, V değerlerini yerine koyabiliriz.",
          "P and V are related IMPLICITLY by P·V = k: we can differentiate without first writing P explicitly in terms of V. Here P is treated as a function of V. " +
          "We differentiate both sides with respect to V: the left side needs the PRODUCT RULE and the CHAIN RULE (P depends on V), the right side is a constant so it gives 0. Then we solve for dP/dV. " +
          "'Rate of change' again means derivative. Mathematically, we can find dP/dV by implicit differentiation and substitute the given P and V.");
      case 8:
        return tx("'Nüfus ne hızla artıyor' sorusu dN/dt, yani N(t)'nin TÜREVİDİR. N(t) = N₀·e^(kt) üstel bir fonksiyondur ve içteki üs (kt) t'ye bağlı olduğundan ZİNCİR KURALI gerekir: d/dt e^(kt) = k·e^(kt). " +
          "Sonuç şunu söyler: büyüme hızı, mevcut nüfusla ORANTILIDIR: N' = k·N. " +
          "Matematiksel olarak N'(t)'yi bulup verilen t'de hesaplar, birimini (kişi/saat) yorumlarız.",
          "'How fast is the population increasing' is dN/dt, the DERIVATIVE of N(t). N(t) = N₀·e^(kt) is an exponential function and since the exponent (kt) depends on t we need the CHAIN RULE: d/dt e^(kt) = k·e^(kt). " +
          "The result says the growth rate is PROPORTIONAL to the current population: N' = k·N. " +
          "Mathematically, we find N'(t), evaluate at the given t, and interpret its unit (individuals/hour).");
      case 9:
        return tx("Hız, konumun zamana göre türevidir: v(t) = x'(t). Konum bir SİNÜS fonksiyonudur ve içeride ω·t vardır, bu yüzden ZİNCİR KURALI gerekir: d/dt sin(ωt) = ω·cos(ωt). " +
          "Açı RADYAN cinsindendir (hesap makinesinin radyan modunda olması gerekir). " +
          "Matematiksel olarak x'(t) = A·ω·cos(ωt)'yi bulup verilen t'de hesaplar, işaretini yorumlarız.",
          "Velocity is the derivative of position with time: v(t) = x'(t). The position is a SINE function with ω·t inside, so the CHAIN RULE is needed: d/dt sin(ωt) = ω·cos(ωt). " +
          "The angle is in RADIANS (a calculator must be in radian mode). " +
          "Mathematically, we find x'(t) = A·ω·cos(ωt), evaluate at the given t, and interpret the sign.");
      case 10:
        return tx("Merdivenin boyu sabit, ama x (taban uzaklığı) ve y (duvardaki yükseklik) ZAMANLA değişir ve Pisagor bağıntısı x² + y² = L² her an doğrudur. Bu, iki değişkenin KAPALI bir bağıntısıdır: ikisi de t'nin fonksiyonudur. " +
          "Bağıntıyı t'ye göre türetiriz (ZİNCİR KURALI): 2x·dx/dt + 2y·dy/dt = 0 (L sabit, türevi 0). Buradan dy/dt çözülür. Bu tür sorulara 'bağlı değişim hızları' denir. " +
          "Matematiksel olarak önce y'yi Pisagor ile bulup sonra türeterek dy/dt'yi hesaplar, işaretini yorumlarız.",
          "The ladder length is constant, but x (base distance) and y (height on the wall) CHANGE WITH TIME while the Pythagorean relation x² + y² = L² holds at every instant. This is an IMPLICIT relation of two variables, both functions of t. " +
          "We differentiate the relation with respect to t (CHAIN RULE): 2x·dx/dt + 2y·dy/dt = 0 (L is constant, derivative 0). Then solve for dy/dt. Such problems are called 'related rates'. " +
          "Mathematically, we first find y with Pythagoras, then differentiate, compute dy/dt, and interpret the sign.");
      case 11:
        return tx("Soğuma hızı sıcaklığın zamana göre türevidir: dT/dt. T(t) = Tₐ + (T₀ − Tₐ)·e^(−kt) içinde üs −kt, t'ye bağlıdır; bu yüzden ZİNCİR KURALI gerekir: d/dt e^(−kt) = −k·e^(−kt). Tₐ ve (T₀ − Tₐ) sabittir. " +
          "Sonuçta dT/dt = −k·(T − Tₐ) çıkar: Newton soğuma yasası, yani soğuma hızı sıcaklık farkıyla ORANTILIDIR. " +
          "Matematiksel olarak T'(t)'yi bulup verilen t'de hesaplar ve −k(T − Tₐ) ile karşılaştırırız.",
          "The cooling rate is the derivative of temperature with time: dT/dt. In T(t) = Tₐ + (T₀ − Tₐ)·e^(−kt) the exponent −kt depends on t, so the CHAIN RULE is needed: d/dt e^(−kt) = −k·e^(−kt). Tₐ and (T₀ − Tₐ) are constants. " +
          "The result is dT/dt = −k·(T − Tₐ): Newton's law of cooling, i.e. the cooling rate is PROPORTIONAL to the temperature difference. " +
          "Mathematically, we find T'(t), evaluate at the given t, and compare with −k(T − Tₐ).");
      case 12:
        return tx("Bobin gerilimi akımın DEĞİŞİM HIZINA bağlıdır: v = L·di/dt, yani akımın zamana göre TÜREVİNE. Akım bir SİNÜS fonksiyonudur ve içeride ω·t vardır, bu yüzden ZİNCİR KURALI gerekir: d/dt sin(ωt) = ω·cos(ωt). " +
          "Açı RADYAN cinsindendir. Akım en büyükken (sin = ±1) değişim hızı 0, dolayısıyla gerilim 0'dır. " +
          "Matematiksel olarak di/dt = I·ω·cos(ωt)'yi bulup L ile çarpar, verilen t'de hesaplarız.",
          "The coil voltage depends on the RATE OF CHANGE of the current: v = L·di/dt, i.e. the DERIVATIVE of the current with time. The current is a SINE function with ω·t inside, so the CHAIN RULE is needed: d/dt sin(ωt) = ω·cos(ωt). " +
          "The angle is in RADIANS. When the current is at its maximum (sin = ±1) its rate of change is 0, so the voltage is 0. " +
          "Mathematically, we find di/dt = I·ω·cos(ωt), multiply by L, and evaluate at the given t.");
      default:
        return tx("Hacim V yarıçap r'ye, yarıçap ise zamana bağlıdır: V(r(t)). Bu bir BİLEŞKE fonksiyondur ve 'hacim ne hızla artıyor' dV/dt demektir. " +
          "ZİNCİR KURALI: dV/dt = (dV/dr)·(dr/dt). Dıştaki V = (4/3)πr³ için dV/dr = 4πr² (yüzey alanı!), içteki r(t) = r₀ + kt için dr/dt = k. " +
          "Matematiksel olarak dV/dr ve dr/dt'yi bulup çarpar, verilen t'de r'yi hesaplayarak değerlendiririz.",
          "The volume V depends on the radius r, and the radius depends on time: V(r(t)). This is a COMPOSITE function and 'how fast is the volume growing' means dV/dt. " +
          "CHAIN RULE: dV/dt = (dV/dr)·(dr/dt). For the outer V = (4/3)πr³, dV/dr = 4πr² (the surface area!), for the inner r(t) = r₀ + kt, dr/dt = k. " +
          "Mathematically, we find dV/dr and dr/dt, multiply, and evaluate by computing r at the given t.");
    }
  }

  // ============================ solutions ============================
  function Steps(problem) {
    const x = problem.p;
    const s = [];
    const add = (a, b) => s.push(tx(a, b));
    switch (problem.scn) {
      case 0: {
        const a = x[0], b = x[1], t = x[2];
        const pos = a * t * t * t + b * t * t, v = 3 * a * t * t + 2 * b * t, ac = 6 * a * t + 2 * b;
        add('Değişkenler: t = zaman (s), s(t) = yükseklik (m), v = hız (m/s), a = ivme (m/s²).', 'Variables: t = time (s), s(t) = height (m), v = velocity (m/s), a = acceleration (m/s²).');
        add(`Model: s(t) = ${N2(a)}t³ + ${N2(b)}t².`, `Model: s(t) = ${N2(a)}t³ + ${N2(b)}t².`);
        add(`Hız = birinci türev. Kuvvet kuralı: d(tⁿ)/dt = n·tⁿ⁻¹. ${N2(a)}t³ → ${N2(a)}·3t² = ${N2(3 * a)}t²; ${N2(b)}t² → ${N2(b)}·2t = ${N2(2 * b)}t.`, `Velocity = first derivative. Power rule: d(tⁿ)/dt = n·tⁿ⁻¹. ${N2(a)}t³ → ${N2(a)}·3t² = ${N2(3 * a)}t²; ${N2(b)}t² → ${N2(b)}·2t = ${N2(2 * b)}t.`);
        add(`Hız fonksiyonu: v(t) = s'(t) = ${N2(3 * a)}t² + ${N2(2 * b)}t.`, `Velocity function: v(t) = s'(t) = ${N2(3 * a)}t² + ${N2(2 * b)}t.`);
        add(`İvme = v'(t): ${N2(3 * a)}t² → ${N2(6 * a)}t; ${N2(2 * b)}t → ${N2(2 * b)}. Yani a(t) = ${N2(6 * a)}t + ${N2(2 * b)}.`, `Acceleration = v'(t): ${N2(3 * a)}t² → ${N2(6 * a)}t; ${N2(2 * b)}t → ${N2(2 * b)}. So a(t) = ${N2(6 * a)}t + ${N2(2 * b)}.`);
        add(`t = ${N2(t)} yerine koyalım: v(${N2(t)}) = ${N2(3 * a)}·${N2(t * t)} + ${N2(2 * b)}·${N2(t)} = ${N2(v)} m/s.`, `Substituting t = ${N2(t)}: v(${N2(t)}) = ${N2(3 * a)}·${N2(t * t)} + ${N2(2 * b)}·${N2(t)} = ${N2(v)} m/s.`);
        add(`a(${N2(t)}) = ${N2(6 * a)}·${N2(t)} + ${N2(2 * b)} = ${N2(ac)} m/s². (Konum s(${N2(t)}) = ${N2(pos)} m.)`, `a(${N2(t)}) = ${N2(6 * a)}·${N2(t)} + ${N2(2 * b)} = ${N2(ac)} m/s². (Position s(${N2(t)}) = ${N2(pos)} m.)`);
        add('Birim kontrolü: m/s türev birimi (m)/(s) ✓; ivme (m/s)/s = m/s² ✓.', 'Unit check: m/s is (m)/(s) ✓; acceleration (m/s)/s = m/s² ✓.');
        add(`Yorum: hız ve ivme pozitif; asansör yukarı çıkıyor ve hızlanıyor. Grafikteki kesikli teğetin eğimi ${N2(v)} m/s'dir.`, `Interpretation: velocity and acceleration are positive; the lift is going up and speeding up. The dashed tangent on the graph has slope ${N2(v)} m/s.`);
        break;
      }
      case 1: {
        const t0 = x[0], a = x[1], t = x[2];
        const tt = t0 + a * t * t;
        add('Değişkenler: t = zaman (dk), T(t) = sıcaklık (°C). Hız birimi °C/dk.', 'Variables: t = time (min), T(t) = temperature (°C). Rate unit °C/min.');
        add(`Model: T(t) = ${N2(t0)} + ${N2(a)}t².`, `Model: T(t) = ${N2(t0)} + ${N2(a)}t².`);
        add(`T(0) = ${N2(t0)} °C ve T(${N2(t)}) = ${N2(t0)} + ${N2(a)}·${N2(t * t)} = ${N2(tt)} °C.`, `T(0) = ${N2(t0)} °C and T(${N2(t)}) = ${N2(t0)} + ${N2(a)}·${N2(t * t)} = ${N2(tt)} °C.`);
        add(`ORTALAMA hız = ΔT/Δt = (${N2(tt)} − ${N2(t0)}) / (${N2(t)} − 0) = ${N2(tt - t0)} / ${N2(t)} = ${N2(a * t)} °C/dk.`, `AVERAGE rate = ΔT/Δt = (${N2(tt)} − ${N2(t0)}) / (${N2(t)} − 0) = ${N2(tt - t0)} / ${N2(t)} = ${N2(a * t)} °C/min.`);
        add(`ANLIK hız için türevi alalım: sabit ${N2(t0)} → 0; ${N2(a)}t² → ${N2(a)}·2t = ${N2(2 * a)}t. Yani T'(t) = ${N2(2 * a)}t.`, `For the INSTANTANEOUS rate we differentiate: constant ${N2(t0)} → 0; ${N2(a)}t² → ${N2(a)}·2t = ${N2(2 * a)}t. So T'(t) = ${N2(2 * a)}t.`);
        add(`t = ${N2(t)} yerine koyalım: T'(${N2(t)}) = ${N2(2 * a)}·${N2(t)} = ${N2(2 * a * t)} °C/dk.`, `Substituting t = ${N2(t)}: T'(${N2(t)}) = ${N2(2 * a)}·${N2(t)} = ${N2(2 * a * t)} °C/min.`);
        add(`Karşılaştıralım: anlık hız (${N2(2 * a * t)}) ortalamanın (${N2(a * t)}) iki katıdır, çünkü ısınma sürekli hızlanır.`, `Let's compare: the instantaneous rate (${N2(2 * a * t)}) is twice the average (${N2(a * t)}) because heating keeps speeding up.`);
        add('Birim kontrolü: °C / dk ✓ (her iki hız da aynı birimde).', 'Unit check: °C / min ✓ (both rates in the same unit).');
        add(`Yorum: grafikte kiriş (0'dan ${N2(t)}'ye) ortalamayı, kesikli teğet anlık hızı gösterir; teğet daha diktir.`, `Interpretation: on the graph the chord (from 0 to ${N2(t)}) shows the average, the dashed tangent the instantaneous rate; the tangent is steeper.`);
        break;
      }
      case 2: {
        const f = x[0], a = x[1], b = x[2], q = x[3];
        const mc = a + 2 * b * q, c0 = f + a * q + b * q * q;
        add('Değişkenler: q = üretilen parça sayısı, C(q) = toplam maliyet (TL), MC = marjinal maliyet (TL/adet).', 'Variables: q = number of parts, C(q) = total cost (TL), MC = marginal cost (TL/unit).');
        add(`Model: C(q) = ${Money(f)} + ${N2(a)}q + ${N2(b)}q².`, `Model: C(q) = ${Money(f)} + ${N2(a)}q + ${N2(b)}q².`);
        add(`Marjinal maliyet = C'(q). Terim terim: sabit ${Money(f)} → 0.`, `Marginal cost = C'(q). Term by term: constant ${Money(f)} → 0.`);
        add(`${N2(a)}q → ${N2(a)} (q'nun türevi 1); ${N2(b)}q² → ${N2(b)}·2q = ${N2(2 * b)}q.`, `${N2(a)}q → ${N2(a)} (derivative of q is 1); ${N2(b)}q² → ${N2(b)}·2q = ${N2(2 * b)}q.`);
        add(`MC(q) = C'(q) = ${N2(a)} + ${N2(2 * b)}q.`, `MC(q) = C'(q) = ${N2(a)} + ${N2(2 * b)}q.`);
        add(`q = ${N2(q)} yerine koyalım: MC(${N2(q)}) = ${N2(a)} + ${N2(2 * b)}·${N2(q)} = ${N2(a)} + ${N2(2 * b * q)}.`, `Substituting q = ${N2(q)}: MC(${N2(q)}) = ${N2(a)} + ${N2(2 * b)}·${N2(q)} = ${N2(a)} + ${N2(2 * b * q)}.`);
        add(`MC(${N2(q)}) = ${N2(mc)} TL/adet.`, `MC(${N2(q)}) = ${N2(mc)} TL/unit.`);
        add(`Birim kontrolü: TL / adet ✓. Karşılaştırma: gerçek C(${N2(q + 1)}) − C(${N2(q)}) = ${N2(mc + b)} TL, türevden yalnızca ${N2(b)} TL farklıdır.`, `Unit check: TL / unit ✓. Comparison: the actual C(${N2(q + 1)}) − C(${N2(q)}) = ${N2(mc + b)} TL, only ${N2(b)} TL different from the derivative.`);
        add(`Yorum: C(${N2(q)}) = ${Money(c0)} TL iken bir parça daha üretmek yaklaşık ${N2(mc)} TL ek maliyet getirir; q arttıkça marjinal maliyet de artar.`, `Interpretation: at C(${N2(q)}) = ${Money(c0)} TL, one more part costs about ${N2(mc)} TL extra; marginal cost rises with q.`);
        break;
      }
      case 3: {
        const a = x[0] / 100, b = x[1] / 100, xx = x[2];
        const sl = 2 * a * xx + b;
        add('Değişkenler: x = yatay uzaklık (m), h(x) = yükseklik (m). Eğim birimsiz (m/m).', 'Variables: x = horizontal distance (m), h(x) = height (m). Slope is unitless (m/m).');
        add(`Model: h(x) = ${N2(a)}x² + ${N2(b)}x.`, `Model: h(x) = ${N2(a)}x² + ${N2(b)}x.`);
        add(`Eğim = h'(x). ${N2(a)}x² → ${N2(a)}·2x = ${N2(2 * a)}x.`, `Slope = h'(x). ${N2(a)}x² → ${N2(a)}·2x = ${N2(2 * a)}x.`);
        add(`${N2(b)}x → ${N2(b)} (x'in türevi 1).`, `${N2(b)}x → ${N2(b)} (derivative of x is 1).`);
        add(`h'(x) = ${N2(2 * a)}x + ${N2(b)}.`, `h'(x) = ${N2(2 * a)}x + ${N2(b)}.`);
        add(`x = ${N2(xx)} yerine koyalım: h'(${N2(xx)}) = ${N2(2 * a)}·${N2(xx)} + ${N2(b)} = ${N2(2 * a * xx)} + ${N2(b)} = ${N2(sl)}.`, `Substituting x = ${N2(xx)}: h'(${N2(xx)}) = ${N2(2 * a)}·${N2(xx)} + ${N2(b)} = ${N2(2 * a * xx)} + ${N2(b)} = ${N2(sl)}.`);
        add(`Yüzde eğim = ${N2(sl)}·100 = %${N2(sl * 100)}.`, `Percent slope = ${N2(sl)}·100 = ${N2(sl * 100)}%.`);
        add(`Açı: arctan(${N2(sl)}) ≈ ${F(Math.atan(sl) * 180 / PI, 1)}°. Birim kontrolü: m/m ✓.`, `Angle: arctan(${N2(sl)}) ≈ ${F(Math.atan(sl) * 180 / PI, 1)}°. Unit check: m/m ✓.`);
        add(`Yorum: bu noktada rampa her 100 m yatayda yaklaşık ${N2(sl * 100)} m yükselir; x arttıkça eğim de artar (rampa dikleşir).`, `Interpretation: at this point the ramp rises about ${N2(sl * 100)} m per 100 m of horizontal run; the slope increases with x (the ramp steepens).`);
        break;
      }
      case 4: {
        const a = x[0], b = x[1], c = x[2], t = x[3];
        const fv = a + b * t, vv = c * t, dp = b * vv + fv * c;
        add('Değişkenler: t = zaman (s), F = kuvvet (N), v = hız (m/s), P = güç (W = N·m/s).', 'Variables: t = time (s), F = force (N), v = speed (m/s), P = power (W = N·m/s).');
        add(`Model: P(t) = F(t)·v(t) = (${N2(a)} + ${N2(b)}t)·(${N2(c)}t).`, `Model: P(t) = F(t)·v(t) = (${N2(a)} + ${N2(b)}t)·(${N2(c)}t).`);
        add("Çarpım kuralı: P' = F'·v + F·v'.", "Product rule: P' = F'·v + F·v'.");
        add(`Parçaların türevleri: F'(t) = ${N2(b)} (sabit ${N2(a)} → 0, ${N2(b)}t → ${N2(b)}); v'(t) = ${N2(c)}.`, `Derivatives of the parts: F'(t) = ${N2(b)} (constant ${N2(a)} → 0, ${N2(b)}t → ${N2(b)}); v'(t) = ${N2(c)}.`);
        add(`Yerine koyalım: P' = ${N2(b)}·(${N2(c)}t) + (${N2(a)} + ${N2(b)}t)·${N2(c)}.`, `Substituting: P' = ${N2(b)}·(${N2(c)}t) + (${N2(a)} + ${N2(b)}t)·${N2(c)}.`);
        add(`t = ${N2(t)}: F(${N2(t)}) = ${N2(a)} + ${N2(b)}·${N2(t)} = ${N2(fv)} N, v(${N2(t)}) = ${N2(c)}·${N2(t)} = ${N2(vv)} m/s.`, `At t = ${N2(t)}: F(${N2(t)}) = ${N2(a)} + ${N2(b)}·${N2(t)} = ${N2(fv)} N, v(${N2(t)}) = ${N2(c)}·${N2(t)} = ${N2(vv)} m/s.`);
        add(`dP/dt = ${N2(b)}·${N2(vv)} + ${N2(fv)}·${N2(c)} = ${N2(b * vv)} + ${N2(fv * c)} = ${N2(dp)} W/s.`, `dP/dt = ${N2(b)}·${N2(vv)} + ${N2(fv)}·${N2(c)} = ${N2(b * vv)} + ${N2(fv * c)} = ${N2(dp)} W/s.`);
        add(`Kontrol: açarsak P = ${N2(c * a)}t + ${N2(b * c)}t², P' = ${N2(c * a)} + ${N2(2 * b * c)}t = ${N2(c * a + 2 * b * c * t)} ✓. Birim: W/s ✓.`, `Check by expanding: P = ${N2(c * a)}t + ${N2(b * c)}t², P' = ${N2(c * a)} + ${N2(2 * b * c)}t = ${N2(c * a + 2 * b * c * t)} ✓. Unit: W/s ✓.`);
        add(`Yorum: t = ${N2(t)} s'de güç ${N2(fv * vv)} W ve saniyede yaklaşık ${N2(dp)} W artıyor: hem kuvvet hem hız büyüdüğü için iki terim de katkı verir.`, `Interpretation: at t = ${N2(t)} s the power is ${N2(fv * vv)} W and increasing by about ${N2(dp)} W each second: both force and speed grow so both terms contribute.`);
        break;
      }
      case 5: {
        const f = x[0], a = x[1], q = x[2];
        const ad = a - f / (q * q);
        add('Değişkenler: q = adet, C = toplam maliyet (TL), A = C/q (TL/adet).', 'Variables: q = units, C = total cost (TL), A = C/q (TL/unit).');
        add(`Model: A(q) = (${Money(f)} + ${N2(a)}q²) / q. Payda q, yani q > 0.`, `Model: A(q) = (${Money(f)} + ${N2(a)}q²) / q. The denominator is q, so q > 0.`);
        add("Bölüm kuralı: (u/v)' = (u'·v − u·v') / v²; u = pay, v = payda.", "Quotient rule: (u/v)' = (u'·v − u·v') / v²; u = numerator, v = denominator.");
        add(`u = ${Money(f)} + ${N2(a)}q² → u' = ${N2(2 * a)}q;  v = q → v' = 1.`, `u = ${Money(f)} + ${N2(a)}q² → u' = ${N2(2 * a)}q;  v = q → v' = 1.`);
        add(`A'(q) = (${N2(2 * a)}q·q − (${Money(f)} + ${N2(a)}q²)·1) / q² = (${N2(a)}q² − ${Money(f)}) / q².`, `A'(q) = (${N2(2 * a)}q·q − (${Money(f)} + ${N2(a)}q²)·1) / q² = (${N2(a)}q² − ${Money(f)}) / q².`);
        add(`q = ${N2(q)}: pay = ${N2(a)}·${N2(q * q)} − ${Money(f)} = ${Money(a * q * q - f)}; payda = ${N2(q * q)}.`, `At q = ${N2(q)}: numerator = ${N2(a)}·${N2(q * q)} − ${Money(f)} = ${Money(a * q * q - f)}; denominator = ${N2(q * q)}.`);
        add(`A'(${N2(q)}) = ${Money(a * q * q - f)} / ${N2(q * q)} = ${N2(ad)} TL/adet².`, `A'(${N2(q)}) = ${Money(a * q * q - f)} / ${N2(q * q)} = ${N2(ad)} TL/unit².`);
        add(`Kontrol: A(q) = ${Money(f)}/q + ${N2(a)}q → A' = −${Money(f)}/q² + ${N2(a)} = ${N2(ad)} ✓. Birim: (TL/adet)/adet ✓.`, `Check: A(q) = ${Money(f)}/q + ${N2(a)}q → A' = −${Money(f)}/q² + ${N2(a)} = ${N2(ad)} ✓. Unit: (TL/unit)/unit ✓.`);
        add(`Yorum: A(${N2(q)}) = ${N2(f / q + a * q)} TL/adet; türev ${ad < 0 ? 'negatif → daha fazla üretmek ortalama maliyeti DÜŞÜRÜR (sabit gider daha çok adete yayılır)' : 'pozitif → daha fazla üretmek ortalama maliyeti ARTIRIR'}${ad === 0 ? ' (sıfır: en düşük ortalama maliyet)' : ''}. Optimum q = √(F/a) = ${N2(Math.sqrt(f / a))}.`,
          `Interpretation: A(${N2(q)}) = ${N2(f / q + a * q)} TL/unit; the derivative is ${ad < 0 ? 'negative → producing more LOWERS the average cost (the fixed cost is spread over more units)' : 'positive → producing more RAISES the average cost'}${ad === 0 ? ' (zero: the minimum average cost)' : ''}. The optimum is q = √(F/a) = ${N2(Math.sqrt(f / a))}.`);
        break;
      }
      case 6: {
        const k = x[0], t = x[1], r = k * t;
        add('Değişkenler: t = zaman (dk), r = yarıçap (m), A = alan (m²), dA/dt birimi m²/dk.', 'Variables: t = time (min), r = radius (m), A = area (m²), dA/dt has unit m²/min.');
        add(`Model: A = πr², r = ${N2(k)}t. Yani A(r(t)) bir bileşke.`, `Model: A = πr², r = ${N2(k)}t. So A(r(t)) is a composition.`);
        add('Zincir kuralı: dA/dt = (dA/dr)·(dr/dt).', 'Chain rule: dA/dt = (dA/dr)·(dr/dt).');
        add('Dış türev: dA/dr = π·2r = 2πr.', 'Outer derivative: dA/dr = π·2r = 2πr.');
        add(`İç türev: dr/dt = ${N2(k)} m/dk (sabit büyüme hızı).`, `Inner derivative: dr/dt = ${N2(k)} m/min (constant growth rate).`);
        add(`Birleştirelim: dA/dt = 2πr·${N2(k)}; r yerine ${N2(k)}t: dA/dt = ${N2(2 * k * k)}π·t.`, `We combine: dA/dt = 2πr·${N2(k)}; replace r by ${N2(k)}t: dA/dt = ${N2(2 * k * k)}π·t.`);
        add(`t = ${N2(t)}: r = ${N2(k)}·${N2(t)} = ${N2(r)} m ve dA/dt = 2π·${N2(r)}·${N2(k)} = ${N2(2 * k * k * t)}π ≈ ${N2(2 * PI * k * k * t)} m²/dk.`, `At t = ${N2(t)}: r = ${N2(k)}·${N2(t)} = ${N2(r)} m and dA/dt = 2π·${N2(r)}·${N2(k)} = ${N2(2 * k * k * t)}π ≈ ${N2(2 * PI * k * k * t)} m²/min.`);
        add(`Birim kontrolü: (m²/m)·(m/dk) = m²/dk ✓. Alan A(${N2(t)}) = π·${N2(r * r)} ≈ ${N2(PI * r * r)} m².`, `Unit check: (m²/m)·(m/min) = m²/min ✓. Area A(${N2(t)}) = π·${N2(r * r)} ≈ ${N2(PI * r * r)} m².`);
        add('Yorum: yarıçap sabit hızla büyüse de alan artış hızı büyür (t ile orantılı): leke büyüdükçe çevresi uzar ve aynı yarıçap artışı daha çok alan ekler.', 'Interpretation: even though the radius grows at a constant speed, the area growth rate increases (proportional to t): as the slick grows its edge gets longer and the same radius increase adds more area.');
        break;
      }
      case 7: {
        const p0 = x[0], v0 = x[1], kk = p0 * v0;
        add('Değişkenler: V = hacim (L), P = basınç (kPa), k = sabit (kPa·L). P, V\'nin fonksiyonudur.', 'Variables: V = volume (L), P = pressure (kPa), k = constant (kPa·L). P is a function of V.');
        add(`Model: P·V = k, k = ${N2(p0)}·${N2(v0)} = ${N2(kk)} kPa·L.`, `Model: P·V = k, k = ${N2(p0)}·${N2(v0)} = ${N2(kk)} kPa·L.`);
        add("Her iki tarafı V'ye göre türetelim: d/dV (P·V) = d/dV (k).", 'Let\'s differentiate both sides with respect to V: d/dV (P·V) = d/dV (k).');
        add("Sol taraf çarpım kuralı: (dP/dV)·V + P·1 (P, V'ye bağlı olduğu için dP/dV kalır — zincir kuralı). Sağ taraf: 0.", 'Left side by the product rule: (dP/dV)·V + P·1 (P depends on V so dP/dV appears — chain rule). Right side: 0.');
        add('Denklem: V·(dP/dV) + P = 0.', 'Equation: V·(dP/dV) + P = 0.');
        add("dP/dV'yi çöz: dP/dV = −P / V.", 'Solve for dP/dV: dP/dV = −P / V.');
        add(`Yerine koyalım: dP/dV = −${N2(p0)} / ${N2(v0)} = ${N2(-p0 / v0)} kPa/L.`, `Substituting: dP/dV = −${N2(p0)} / ${N2(v0)} = ${N2(-p0 / v0)} kPa/L.`);
        add(`Kontrol: açık biçim P = k/V → P' = −k/V² = −${N2(kk)}/${N2(v0 * v0)} = ${N2(-kk / (v0 * v0))} ✓. Birim: kPa/L ✓.`, `Check: explicit form P = k/V → P' = −k/V² = −${N2(kk)}/${N2(v0 * v0)} = ${N2(-kk / (v0 * v0))} ✓. Unit: kPa/L ✓.`);
        add(`Yorum: türev negatif; hacim 1 L artınca basınç yaklaşık ${N2(p0 / v0)} kPa düşer. Grafikte kesikli teğet aşağı eğimlidir.`, `Interpretation: the derivative is negative; when the volume grows by 1 L the pressure drops by about ${N2(p0 / v0)} kPa. The dashed tangent slopes downward.`);
        break;
      }
      case 8: {
        const n0 = x[0], k = x[1], t = x[2];
        const ev = Math.exp(k * t);
        add('Değişkenler: t = zaman (sa), N = bakteri sayısı, dN/dt birimi bakteri/sa.', 'Variables: t = time (h), N = number of bacteria, dN/dt has unit bacteria/h.');
        add(`Model: N(t) = ${N2(n0)}·e^(${N2(k)}t).`, `Model: N(t) = ${N2(n0)}·e^(${N2(k)}t).`);
        add(`Zincir kuralı: d/dt e^(u) = e^(u)·u'. Burada u = ${N2(k)}t, u' = ${N2(k)}.`, `Chain rule: d/dt e^(u) = e^(u)·u'. Here u = ${N2(k)}t, u' = ${N2(k)}.`);
        add(`Sabit çarpan ${N2(n0)} olduğu gibi kalır: N'(t) = ${N2(n0)}·${N2(k)}·e^(${N2(k)}t) = ${N2(n0 * k)}·e^(${N2(k)}t).`, `The constant factor ${N2(n0)} stays: N'(t) = ${N2(n0)}·${N2(k)}·e^(${N2(k)}t) = ${N2(n0 * k)}·e^(${N2(k)}t).`);
        add(`t = ${N2(t)}: üs = ${N2(k)}·${N2(t)} = ${N2(k * t)}, e^(${N2(k * t)}) ≈ ${F(ev, 4)}.`, `At t = ${N2(t)}: exponent = ${N2(k)}·${N2(t)} = ${N2(k * t)}, e^(${N2(k * t)}) ≈ ${F(ev, 4)}.`);
        add(`N'(${N2(t)}) ≈ ${N2(n0 * k)}·${F(ev, 4)} ≈ ${N2(n0 * k * ev)} bakteri/sa.`, `N'(${N2(t)}) ≈ ${N2(n0 * k)}·${F(ev, 4)} ≈ ${N2(n0 * k * ev)} bacteria/h.`);
        add(`Nüfus: N(${N2(t)}) ≈ ${N2(n0 * ev)}. Kontrol: N' = k·N = ${N2(k)}·${N2(n0 * ev)} ≈ ${N2(k * n0 * ev)} ✓.`, `Population: N(${N2(t)}) ≈ ${N2(n0 * ev)}. Check: N' = k·N = ${N2(k)}·${N2(n0 * ev)} ≈ ${N2(k * n0 * ev)} ✓.`);
        add('Birim kontrolü: k (1/sa) · N (bakteri) = bakteri/sa ✓.', 'Unit check: k (1/h) · N (bacteria) = bacteria/h ✓.');
        add(`Yorum: büyüme hızı nüfusun %${F(100 * k, 1)}'i kadardır ve nüfusla birlikte büyür; bu yüzden eğri gitgide dikleşir.`, `Interpretation: the growth rate is ${F(100 * k, 1)}% of the population per hour and grows with the population, so the curve keeps steepening.`);
        break;
      }
      case 9: {
        const a = x[0], w = x[1], t = x[2];
        const ang = w * t, v = a * w * Math.cos(ang);
        add('Değişkenler: t = zaman (s), x = konum (mm), v = hız (mm/s). Açı radyan.', 'Variables: t = time (s), x = position (mm), v = velocity (mm/s). Angle in radians.');
        add(`Model: x(t) = ${N2(a)}·sin(${N2(w)}t).`, `Model: x(t) = ${N2(a)}·sin(${N2(w)}t).`);
        add(`Zincir kuralı: d/dt sin(u) = cos(u)·u'. Burada u = ${N2(w)}t, u' = ${N2(w)}.`, `Chain rule: d/dt sin(u) = cos(u)·u'. Here u = ${N2(w)}t, u' = ${N2(w)}.`);
        add(`Sabit çarpan ${N2(a)} kalır: v(t) = ${N2(a)}·cos(${N2(w)}t)·${N2(w)} = ${N2(a * w)}·cos(${N2(w)}t).`, `The constant factor ${N2(a)} stays: v(t) = ${N2(a)}·cos(${N2(w)}t)·${N2(w)} = ${N2(a * w)}·cos(${N2(w)}t).`);
        add(`t = ${N2(t)} için açı: ${N2(w)}·${N2(t)} = ${N2(ang)} rad.`, `Angle at t = ${N2(t)}: ${N2(w)}·${N2(t)} = ${N2(ang)} rad.`);
        add(`cos(${N2(ang)}) ≈ ${F(Math.cos(ang), 4)} (radyan modu).`, `cos(${N2(ang)}) ≈ ${F(Math.cos(ang), 4)} (radian mode).`);
        add(`v(${N2(t)}) ≈ ${N2(a * w)}·(${F(Math.cos(ang), 4)}) ≈ ${F(v, 3)} mm/s.`, `v(${N2(t)}) ≈ ${N2(a * w)}·(${F(Math.cos(ang), 4)}) ≈ ${F(v, 3)} mm/s.`);
        add(`Birim kontrolü: mm·(1/s) = mm/s ✓. En büyük hız genliği: A·ω = ${N2(a * w)} mm/s (cos = ±1).`, `Unit check: mm·(1/s) = mm/s ✓. The largest speed is A·ω = ${N2(a * w)} mm/s (cos = ±1).`);
        add(`Yorum: v ${v >= 0 ? 'pozitif: parça +x yönünde hareket ediyor' : 'negatif: parça −x yönünde hareket ediyor'}. Konum en uçtayken (sin = ±1) hız sıfırdır.`, `Interpretation: v is ${v >= 0 ? 'positive: the part moves in the +x direction' : 'negative: the part moves in the −x direction'}. At the extreme positions (sin = ±1) the velocity is zero.`);
        break;
      }
      case 10: {
        const k = x[0], v = x[1];
        const L = 5 * k, xb = 3 * k, yh = 4 * k, dy = -(xb / yh) * v;
        add('Değişkenler: x = tabanın duvara uzaklığı (m), y = merdivenin duvardaki yüksekliği (m), L = merdiven boyu (m, sabit), t = zaman (s).', 'Variables: x = distance of the base from the wall (m), y = height of the top on the wall (m), L = ladder length (m, constant), t = time (s).');
        add(`Model: x² + y² = L² = ${N2(L * L)} (Pisagor). Verilen: dx/dt = ${N2(v)} m/s, x = ${N2(xb)} m.`, `Model: x² + y² = L² = ${N2(L * L)} (Pythagoras). Given: dx/dt = ${N2(v)} m/s, x = ${N2(xb)} m.`);
        add(`O ana ait y: y = √(L² − x²) = √(${N2(L * L)} − ${N2(xb * xb)}) = √${N2(yh * yh)} = ${N2(yh)} m.`, `The y at that instant: y = √(L² − x²) = √(${N2(L * L)} − ${N2(xb * xb)}) = √${N2(yh * yh)} = ${N2(yh)} m.`);
        add('Bağıntıyı t\'ye göre türetelim (x ve y, t\'nin fonksiyonları; L sabit): 2x·dx/dt + 2y·dy/dt = 0.', 'Let\'s differentiate the relation with respect to t (x and y are functions of t; L is constant): 2x·dx/dt + 2y·dy/dt = 0.');
        add("dy/dt'yi çöz: dy/dt = −(x/y)·(dx/dt).", 'Solve for dy/dt: dy/dt = −(x/y)·(dx/dt).');
        add(`Yerine koyalım: dy/dt = −(${N2(xb)}/${N2(yh)})·${N2(v)} = −${F(xb / yh, 4)}·${N2(v)}.`, `Substituting: dy/dt = −(${N2(xb)}/${N2(yh)})·${N2(v)} = −${F(xb / yh, 4)}·${N2(v)}.`);
        add(`dy/dt = ${N2(dy)} m/s.`, `dy/dt = ${N2(dy)} m/s.`);
        add('Birim kontrolü: (m/m)·(m/s) = m/s ✓.', 'Unit check: (m/m)·(m/s) = m/s ✓.');
        add(`Yorum: negatif işaret, merdivenin ucunun AŞAĞI kaydığını gösterir (${N2(Math.abs(dy))} m/s). Uç yere yaklaştıkça y küçülür ve |dy/dt| = (x/y)·dx/dt sınırsız büyür: merdiven yere çarpmadan hemen önce çok hızlı kayar.`,
          `Interpretation: the negative sign means the top slides DOWN (${N2(Math.abs(dy))} m/s). As the top nears the ground y shrinks and |dy/dt| = (x/y)·dx/dt grows without bound: the ladder slides very fast just before it hits the floor.`);
        break;
      }
      case 11: {
        const T0 = x[0], Ta = x[1], k = x[2], t = x[3];
        const d = T0 - Ta, ev = Math.exp(-k * t), Tt = Ta + d * ev, rate = -k * d * ev;
        add('Değişkenler: t = zaman (dk), T(t) = sıcaklık (°C), Tₐ = ortam sıcaklığı (°C), k = soğuma katsayısı (1/dk).', 'Variables: t = time (min), T(t) = temperature (°C), Tₐ = ambient temperature (°C), k = cooling constant (1/min).');
        add(`Model: T(t) = ${N2(Ta)} + ${N2(d)}·e^(−${N2(k)}t).`, `Model: T(t) = ${N2(Ta)} + ${N2(d)}·e^(−${N2(k)}t).`);
        add(`Zincir kuralı: d/dt e^(u) = e^(u)·u'. Burada u = −${N2(k)}t, u' = −${N2(k)}. Sabit ${N2(Ta)} türevde kaybolur.`, `Chain rule: d/dt e^(u) = e^(u)·u'. Here u = −${N2(k)}t, u' = −${N2(k)}. The constant ${N2(Ta)} vanishes in the derivative.`);
        add(`T'(t) = ${N2(d)}·(−${N2(k)})·e^(−${N2(k)}t) = −${N2(k * d)}·e^(−${N2(k)}t).`, `T'(t) = ${N2(d)}·(−${N2(k)})·e^(−${N2(k)}t) = −${N2(k * d)}·e^(−${N2(k)}t).`);
        add(`t = ${N2(t)}: üs = −${N2(k)}·${N2(t)} = −${N2(k * t)}, e^(−${N2(k * t)}) ≈ ${F(ev, 4)}.`, `At t = ${N2(t)}: exponent = −${N2(k)}·${N2(t)} = −${N2(k * t)}, e^(−${N2(k * t)}) ≈ ${F(ev, 4)}.`);
        add(`T'(${N2(t)}) ≈ −${N2(k * d)}·${F(ev, 4)} ≈ ${N2(rate)} °C/dk.`, `T'(${N2(t)}) ≈ −${N2(k * d)}·${F(ev, 4)} ≈ ${N2(rate)} °C/min.`);
        add(`Sıcaklık: T(${N2(t)}) ≈ ${N2(Ta)} + ${N2(d)}·${F(ev, 4)} ≈ ${N2(Tt)} °C. Newton yasası kontrolü: −k(T − Tₐ) = −${N2(k)}·${N2(Tt - Ta)} ≈ ${N2(-k * (Tt - Ta))} ✓.`, `Temperature: T(${N2(t)}) ≈ ${N2(Ta)} + ${N2(d)}·${F(ev, 4)} ≈ ${N2(Tt)} °C. Newton's law check: −k(T − Tₐ) = −${N2(k)}·${N2(Tt - Ta)} ≈ ${N2(-k * (Tt - Ta))} ✓.`);
        add('Birim kontrolü: (1/dk)·°C = °C/dk ✓.', 'Unit check: (1/min)·°C = °C/min ✓.');
        add(`Yorum: türev negatif, parça soğuyor. Hız T − Tₐ ile orantılı olduğundan zamanla azalır (t = 0'da ${N2(-k * d)} °C/dk, şimdi ${N2(rate)} °C/dk); T, Tₐ = ${N2(Ta)} °C'ye yaklaşır ama ulaşmaz.`,
          `Interpretation: the derivative is negative, so the part cools. Since the rate is proportional to T − Tₐ it fades with time (${N2(-k * d)} °C/min at t = 0, now ${N2(rate)} °C/min); T approaches Tₐ = ${N2(Ta)} °C but never reaches it.`);
        break;
      }
      case 12: {
        const I = x[0], w = x[1], L = x[2], t = x[3];
        const ang = w * t, di = I * w * Math.cos(ang), v = L * di;
        add('Değişkenler: t = zaman (s), i = akım (A), L = endüktans (H), v = gerilim (V).', 'Variables: t = time (s), i = current (A), L = inductance (H), v = voltage (V).');
        add(`Model: i(t) = ${N2(I)}·sin(${N2(w)}t) ve v = L·di/dt, L = ${N2(L)} H.`, `Model: i(t) = ${N2(I)}·sin(${N2(w)}t) and v = L·di/dt, L = ${N2(L)} H.`);
        add(`Zincir kuralı: d/dt sin(u) = cos(u)·u'. Burada u = ${N2(w)}t, u' = ${N2(w)}.`, `Chain rule: d/dt sin(u) = cos(u)·u'. Here u = ${N2(w)}t, u' = ${N2(w)}.`);
        add(`di/dt = ${N2(I)}·cos(${N2(w)}t)·${N2(w)} = ${N2(I * w)}·cos(${N2(w)}t) A/s.`, `di/dt = ${N2(I)}·cos(${N2(w)}t)·${N2(w)} = ${N2(I * w)}·cos(${N2(w)}t) A/s.`);
        add(`Gerilim fonksiyonu: v(t) = L·di/dt = ${N2(L)}·${N2(I * w)}·cos(${N2(w)}t) = ${N2(L * I * w)}·cos(${N2(w)}t) V.`, `Voltage function: v(t) = L·di/dt = ${N2(L)}·${N2(I * w)}·cos(${N2(w)}t) = ${N2(L * I * w)}·cos(${N2(w)}t) V.`);
        add(`t = ${N2(t)} için açı: ${N2(w)}·${N2(t)} = ${N2(ang)} rad; cos(${N2(ang)}) ≈ ${F(Math.cos(ang), 4)} (radyan modu).`, `Angle at t = ${N2(t)}: ${N2(w)}·${N2(t)} = ${N2(ang)} rad; cos(${N2(ang)}) ≈ ${F(Math.cos(ang), 4)} (radian mode).`);
        add(`di/dt ≈ ${N2(I * w)}·(${F(Math.cos(ang), 4)}) ≈ ${F(di, 3)} A/s; v ≈ ${N2(L)}·${F(di, 3)} ≈ ${F(v, 3)} V.`, `di/dt ≈ ${N2(I * w)}·(${F(Math.cos(ang), 4)}) ≈ ${F(di, 3)} A/s; v ≈ ${N2(L)}·${F(di, 3)} ≈ ${F(v, 3)} V.`);
        add(`Birim kontrolü: H·(A/s) = (V·s/A)·(A/s) = V ✓. En büyük gerilim: L·I·ω = ${N2(L * I * w)} V.`, `Unit check: H·(A/s) = (V·s/A)·(A/s) = V ✓. The largest voltage is L·I·ω = ${N2(L * I * w)} V.`);
        add(`Yorum: akım sinüs, gerilim kosinüs gibi değişir (90° faz farkı). Akım tepe noktasındayken (eğim 0) gerilim sıfırdır; şimdi v ${v >= 0 ? 'pozitif (akım artıyor)' : 'negatif (akım azalıyor)'}.`,
          `Interpretation: the current varies like a sine, the voltage like a cosine (90° phase difference). When the current is at its peak (slope 0) the voltage is zero; now v is ${v >= 0 ? 'positive (current rising)' : 'negative (current falling)'}.`);
        break;
      }
      default: {
        const r0 = x[0], k = x[1], t = x[2];
        const r = r0 + k * t, dV = 4 * PI * r * r * k;
        add('Değişkenler: t = zaman (s), r = yarıçap (cm), V = hacim (cm³), dV/dt birimi cm³/s.', 'Variables: t = time (s), r = radius (cm), V = volume (cm³), dV/dt has unit cm³/s.');
        add(`Model: V = (4/3)πr³, r = ${N2(r0)} + ${N2(k)}t. Yani V(r(t)) bir bileşke.`, `Model: V = (4/3)πr³, r = ${N2(r0)} + ${N2(k)}t. So V(r(t)) is a composition.`);
        add('Zincir kuralı: dV/dt = (dV/dr)·(dr/dt).', 'Chain rule: dV/dt = (dV/dr)·(dr/dt).');
        add('Dış türev: dV/dr = (4/3)π·3r² = 4πr² (kürenin yüzey alanı).', 'Outer derivative: dV/dr = (4/3)π·3r² = 4πr² (the surface area of the sphere).');
        add(`İç türev: dr/dt = ${N2(k)} cm/s (sabit).`, `Inner derivative: dr/dt = ${N2(k)} cm/s (constant).`);
        add(`t = ${N2(t)}: r = ${N2(r0)} + ${N2(k)}·${N2(t)} = ${N2(r)} cm.`, `At t = ${N2(t)}: r = ${N2(r0)} + ${N2(k)}·${N2(t)} = ${N2(r)} cm.`);
        add(`dV/dt = 4π·${N2(r)}²·${N2(k)} = ${N2(4 * r * r * k)}π ≈ ${N2(dV)} cm³/s.`, `dV/dt = 4π·${N2(r)}²·${N2(k)} = ${N2(4 * r * r * k)}π ≈ ${N2(dV)} cm³/s.`);
        add(`Birim kontrolü: (cm³/cm)·(cm/s) = cm³/s ✓. Hacim V(${N2(t)}) = (4/3)π·${N2(r * r * r)} ≈ ${N2(4 / 3 * PI * r * r * r)} cm³.`, `Unit check: (cm³/cm)·(cm/s) = cm³/s ✓. Volume V(${N2(t)}) = (4/3)π·${N2(r * r * r)} ≈ ${N2(4 / 3 * PI * r * r * r)} cm³.`);
        add('Yorum: yarıçap sabit hızla büyüse de hacim artış hızı r² ile büyür: balon büyüdükçe aynı yarıçap artışı çok daha fazla hacim ekler.', 'Interpretation: even though the radius grows at a constant speed, the volume growth rate grows with r²: as the balloon gets bigger the same radius increase adds much more volume.');
      }
    }
    return s;
  }

  // ============================ drawing ============================
  // viewport requested by draw(); re-centred on the operating point (same span) when the marker is added
  let pendingView = null;
  function setV(canvas, xa, xb, ya, yb) { pendingView = [xa, xb, ya, yb]; canvas.setViewport(xa, xb, ya, yb); }
  function AddCurveAndTangent(canvas, f, x0, slope, label) {
    const y0 = f(x0);
    if (pendingView && Number.isFinite(y0)) {
      const hx = (pendingView[1] - pendingView[0]) / 2, hy = (pendingView[3] - pendingView[2]) / 2;
      canvas.setViewport(x0 - hx, x0 + hx, y0 - hy, y0 + hy);
    }
    lastOp = { x: x0, y: y0 };
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
    canvas.addFunction({ evaluator: (u) => { const w = y0 + slope * (u - x0); return Math.abs(w) < 1e7 ? w : NaN; }, color: canvas.orange(), thickness: 2, dashed: true });
    canvas.addMarker({ x: x0, y: y0, color: canvas.gold(), radius: 7, label });
  }
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };

  function draw(canvas, problem) {
    const x = problem.p;
    switch (problem.scn) {
      case 0: {
        const a = x[0], b = x[1], t = x[2];
        const f = (v) => a * v * v * v + b * v * v;
        const top = f(5);
        setV(canvas, -0.5, 5.5, -top * 0.1, top * 1.1);
        AddCurveAndTangent(canvas, f, t, 3 * a * t * t + 2 * b * t, `v(${N2(t)}) = ${N2(3 * a * t * t + 2 * b * t)}`);
        break;
      }
      case 1: {
        const t0 = x[0], a = x[1], t = x[2];
        const f = (v) => t0 + a * v * v;
        const top = f(8);
        setV(canvas, -0.5, 8.5, t0 * 0.6, top * 1.05);
        AddCurveAndTangent(canvas, f, t, 2 * a * t, `T'(${N2(t)}) = ${N2(2 * a * t)}`);
        canvas.addFunction({ evaluator: (v) => t0 + a * t * v, color: canvas.green(), thickness: 2 });
        break;
      }
      case 2: {
        const f0 = x[0], a = x[1], b = x[2], q = x[3];
        const f = (v) => f0 + a * v + b * v * v;
        const top = f(60);
        setV(canvas, -3, 62, 0, top * 1.05);
        AddCurveAndTangent(canvas, f, q, a + 2 * b * q, `MC(${N2(q)}) = ${N2(a + 2 * b * q)}`);
        break;
      }
      case 3: {
        const a = x[0] / 100, b = x[1] / 100, xx = x[2];
        const f = (v) => a * v * v + b * v;
        const top = f(60);
        setV(canvas, -3, 62, -top * 0.05, top * 1.05);
        AddCurveAndTangent(canvas, f, xx, 2 * a * xx + b, `${N2((2 * a * xx + b) * 100)} %`);
        break;
      }
      case 4: {
        const a = x[0], b = x[1], c = x[2], t = x[3];
        const f = (v) => (a + b * v) * c * v;
        const dp = c * a + 2 * b * c * t;
        const top = f(6);
        setV(canvas, -0.3, 6.3, -top * 0.05, top * 1.05);
        AddCurveAndTangent(canvas, f, t, dp, `P' = ${N2(dp)}`);
        break;
      }
      case 5: {
        const f0 = x[0], a = x[1], q = x[2];
        const f = (v) => (v <= 0 ? NaN : f0 / v + a * v);
        const ad = a - f0 / (q * q);
        setV(canvas, -1, 26, 0, f(2) * 0.8 + a * 26);
        AddCurveAndTangent(canvas, f, q, ad, `A'(${N2(q)}) = ${N2(ad)}`);
        break;
      }
      case 6: {
        const k = x[0], t = x[1];
        const f = (v) => PI * k * k * v * v;
        const dA = 2 * PI * k * k * t;
        setV(canvas, -0.5, 6.5, -f(6) * 0.05, f(6) * 1.05);
        AddCurveAndTangent(canvas, f, t, dA, `dA/dt = ${N2(dA)}`);
        break;
      }
      case 7: {
        const p0 = x[0], v0 = x[1], kk = p0 * v0;
        const f = (v) => (v <= 0 ? NaN : kk / v);
        setV(canvas, -0.5, v0 * 3, 0, p0 * 2.2);
        AddCurveAndTangent(canvas, f, v0, -p0 / v0, `dP/dV = ${N2(-p0 / v0)}`);
        break;
      }
      case 8: {
        const n0 = x[0], k = x[1], t = x[2];
        const f = (v) => n0 * Math.exp(k * v);
        const slope = n0 * k * Math.exp(k * t);
        setV(canvas, -0.5, 6.5, -f(6) * 0.05, f(6) * 1.05);
        AddCurveAndTangent(canvas, f, t, slope, `N' = ${N2(slope)}`);
        break;
      }
      case 9: {
        const a = x[0], w = x[1], t = x[2];
        const f = (v) => a * Math.sin(w * v);
        const v1 = a * w * Math.cos(w * t);
        setV(canvas, -0.3, 6.6, -a * 1.5, a * 1.5);
        AddCurveAndTangent(canvas, f, t, v1, `v = ${N2(v1)}`);
        break;
      }
      case 10: { // y(tau) with x(tau) = 3k + v*tau, tau = time measured from the instant
        const k = x[0], v = x[1];
        const L = 5 * k, xb = 3 * k, yh = 4 * k, dy = -(xb / yh) * v;
        const f = safe((tau) => { const xx = xb + v * tau; return Math.abs(xx) > L ? NaN : Math.sqrt(L * L - xx * xx); });
        const t1 = (L - xb) / v, t0 = -xb / v;
        setV(canvas, t0 - 0.05 * (t1 - t0), t1 + 0.05 * (t1 - t0), -L * 0.08, L * 1.12);
        AddCurveAndTangent(canvas, f, 0, dy, `dy/dt = ${N2(dy)} m/s`);
        canvas.addGuideLine({ axis: 'horizontal', position: L, color: canvas.gray(), label: `L = ${N2(L)}` });
        break;
      }
      case 11: {
        const T0 = x[0], Ta = x[1], k = x[2], t = x[3];
        const f = (v) => Ta + (T0 - Ta) * Math.exp(-k * v);
        const rate = -k * (T0 - Ta) * Math.exp(-k * t);
        setV(canvas, -0.5, 12.5, Ta - 8, T0 + 6);
        AddCurveAndTangent(canvas, f, t, rate, `T' = ${N2(rate)}`);
        canvas.addGuideLine({ axis: 'horizontal', position: Ta, color: canvas.gray(), label: `Tₐ = ${N2(Ta)}` });
        break;
      }
      case 12: {
        const I = x[0], w = x[1], L = x[2], t = x[3];
        const f = (v) => I * Math.sin(w * v);
        const di = I * w * Math.cos(w * t);
        const tmax = Math.max(1.6, 2 * PI / w * 1.6);
        setV(canvas, -0.05 * tmax, tmax, -I * 1.4, I * 1.4);
        AddCurveAndTangent(canvas, f, t, di, `v = L·di/dt = ${N2(L * di)} V`);
        break;
      }
      default: {
        const r0 = x[0], k = x[1], t = x[2];
        const f = (v) => (4 / 3) * PI * Math.pow(r0 + k * v, 3);
        const dV = 4 * PI * Math.pow(r0 + k * t, 2) * k;
        setV(canvas, -0.3, 6.3, -f(6) * 0.05, f(6) * 1.05);
        AddCurveAndTangent(canvas, f, t, dV, `dV/dt = ${N2(dV)}`);
      }
    }
  }

  function focus(problem) {
    lastOp = null;
    const stub = new Proxy({}, { get: () => () => '#000' });
    try { draw(stub, problem); } catch (e) { /* ignore */ }
    return lastOp && Number.isFinite(lastOp.x) && Number.isFinite(lastOp.y) ? lastOp : null;
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

  function createProblem(rng) { return genScn(rng, currentScenario); }
  function genScn(rng, scn) {
    currentScenario = scn;
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
      "NASIL ÇÖZÜLÜR?\n   (1) 'Değişim hızı', 'ne kadar hızlı', 'eğim', 'marjinal' gibi sözcükleri TÜREV olarak okuyabiliriz: hangi büyüklük, neye göre değişiyor?\n   (2) Modeli yazıp doğru kuralı seçeriz: kuvvet kuralı, çarpım, bölüm, zincir (bileşke ve üstel/trigonometrik terimler) ya da kapalı türev (iki değişken bir bağıntıyla bağlıysa).\n   (3) Türevi önce genel t (veya x, q) için buluruz, SONRA verilen değeri yerine koyarız.\n   (4) Birim şöyle bulunur: (büyüklüğün birimi)/(değişkenin birimi). Sonucu birimiyle ve işaretiyle yorumlayabiliriz (artıyor mu, azalıyor mu?).\n\n",
      "HOW TO SOLVE IT\n   (1) We can read words such as 'rate of change', 'how fast', 'slope', 'marginal' as a DERIVATIVE: which quantity changes with respect to what?\n   (2) We write the model and choose the rule: power rule, product, quotient, chain (composites and exponential/trig terms) or implicit differentiation (when two variables are tied by a relation).\n   (3) We differentiate for the general t (or x, q) FIRST, THEN substitute the given value.\n   (4) The unit comes from (unit of the quantity)/(unit of the variable). We can state the result with its unit and sign (rising or falling?).\n\n");
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

  Topics.register('derivatives', {
    id: 'realLifeDerivatives',
    tabTitle: () => tx('Hayattan Örnekler', 'Real-Life Examples'),
    concept,
    problemStatement,
    createProblem,
    solveSteps: Steps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^   \(1\) /, make: (rng) => genScn(rng, rng.pick([1, 0, 2, 3, 8, 11])) },
      { match: /^   \(2\) /, make: (rng) => genScn(rng, rng.pick([4, 5, 6, 7, 10, 13])) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
    _numeric: (p) => numeric(p),
  });

  // independent numeric answers (value of the derivative asked) for the test harness
  function numeric(problem) {
    const x = problem.p;
    switch (problem.scn) {
      case 0: { const a = x[0], b = x[1], t = x[2]; return { f: (v) => a * v * v * v + b * v * v, x0: t, ans: 3 * a * t * t + 2 * b * t }; }
      case 1: { const t0 = x[0], a = x[1], t = x[2]; return { f: (v) => t0 + a * v * v, x0: t, ans: 2 * a * t }; }
      case 2: { const f0 = x[0], a = x[1], b = x[2], q = x[3]; return { f: (v) => f0 + a * v + b * v * v, x0: q, ans: a + 2 * b * q }; }
      case 3: { const a = x[0] / 100, b = x[1] / 100, xx = x[2]; return { f: (v) => a * v * v + b * v, x0: xx, ans: 2 * a * xx + b }; }
      case 4: { const a = x[0], b = x[1], c = x[2], t = x[3]; return { f: (v) => (a + b * v) * c * v, x0: t, ans: c * a + 2 * b * c * t }; }
      case 5: { const f0 = x[0], a = x[1], q = x[2]; return { f: (v) => f0 / v + a * v, x0: q, ans: a - f0 / (q * q) }; }
      case 6: { const k = x[0], t = x[1]; return { f: (v) => PI * k * k * v * v, x0: t, ans: 2 * PI * k * k * t }; }
      case 7: { const p0 = x[0], v0 = x[1]; return { f: (v) => p0 * v0 / v, x0: v0, ans: -p0 / v0 }; }
      case 8: { const n0 = x[0], k = x[1], t = x[2]; return { f: (v) => n0 * Math.exp(k * v), x0: t, ans: n0 * k * Math.exp(k * t) }; }
      case 9: { const a = x[0], w = x[1], t = x[2]; return { f: (v) => a * Math.sin(w * v), x0: t, ans: a * w * Math.cos(w * t) }; }
      case 10: { const k = x[0], v = x[1]; const L = 5 * k, xb = 3 * k; return { f: (tau) => Math.sqrt(L * L - Math.pow(xb + v * tau, 2)), x0: 0, ans: -(xb / (4 * k)) * v }; }
      case 11: { const T0 = x[0], Ta = x[1], k = x[2], t = x[3]; return { f: (v) => Ta + (T0 - Ta) * Math.exp(-k * v), x0: t, ans: -k * (T0 - Ta) * Math.exp(-k * t) }; }
      case 12: { const I = x[0], w = x[1], L = x[2], t = x[3]; return { f: (v) => L * I * Math.sin(w * v), x0: t, ans: L * I * w * Math.cos(w * t) }; }
      default: { const r0 = x[0], k = x[1], t = x[2]; return { f: (v) => (4 / 3) * PI * Math.pow(r0 + k * v, 3), x0: t, ans: 4 * PI * Math.pow(r0 + k * t, 2) * k }; }
    }
  }
})();
