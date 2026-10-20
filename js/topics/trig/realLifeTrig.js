// Ported from Modules/Trigonometry/RealLifeTrigControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/functions/realLifeExamples.js): ten trigonometry word problems, scenario selector,
// scenario-dependent slider rows, "what does the question mean?" toggle.
(function () {
  // problem = { scn, p: [5 numbers] } (mirrors RlProblem). Module-level state survives "New Example".
  let currentScenario = 0;
  let showMeaning = false;
  let sliderRows = [];
  let offLangCustom = null;

  const N2 = (v) => fmt2(v);
  const Spec = (caption, min, max, step) => ({ caption, min, max, step });
  const PiStr = (n, d) => TrigKit.piStr(n, d);
  const ExactTrig = (fn, d) => TrigKit.exactTrig(fn, d);
  const tx = (a, b) => I18N.tx(a, b);

  function Titles() {
    return [
      tx('1. Krank mili: pim konumu', '1. Crank shaft: pin position'),
      tx('2. Dönme dolap: yükseklik', '2. Big wheel: height above ground'),
      tx('3. Gelgit: genlik, periyot, faz', '3. Tide: amplitude, period, phase'),
      tx('4. Alternatif gerilim: tepe zamanı', '4. AC voltage: peak timing'),
      tx('5. Yay titreşimi: faz kayması', '5. Spring vibration: phase shift'),
      tx('6. Eğik düzlem: kuvvet bileşenleri', '6. Incline: force components'),
      tx('7. Güneş ve gölge uzunluğu', '7. Sun and shadow length'),
      tx('8. Kasnakta kayış yay uzunluğu', '8. Belt arc length on a pulley'),
      tx('9. Devir/dakika ve açısal hız', '9. rpm and angular speed'),
      tx('10. Ses dalgası: dalga boyu', '10. Sound wave: wavelength'),
    ];
  }

  function Specs(scn) {
    switch (scn) {
      case 0: return [Spec(tx('Krank yarıçapı r (mm)', 'Crank radius r (mm)'), 20, 60, 10), Spec(tx('Krank açısı θ (derece)', 'Crank angle θ (degrees)'), 30, 330, 30)];
      case 1: return [Spec(tx('Dolap yarıçapı R (m)', 'Wheel radius R (m)'), 10, 30, 5), Spec(tx('Göbek yüksekliği H (m)', 'Hub height H (m)'), 35, 55, 5), Spec(tx('Tur süresi T (s)', 'Period of one turn T (s)'), 60, 120, 30), Spec(tx('k (t = T·k/12, binişten sonra)', 'k (t = T·k/12 after boarding)'), 1, 11, 1)];
      case 2: return [Spec(tx('Genlik A (m)', 'Amplitude A (m)'), 1, 3, 0.5), Spec(tx('Ortalama su seviyesi D (m)', 'Mean water level D (m)'), 3, 6, 0.5), Spec(tx('Yüksek gelgit saati t₀', 'High-tide clock time t₀'), 0, 3, 1), Spec(tx('Yüksek gelgitten sonra geçen süre Δ (saat)', 'Hours after high tide Δ'), 1, 6, 1)];
      case 3: return [Spec(tx('Tepe gerilim Vp (V)', 'Peak voltage Vp (V)'), 100, 400, 100), Spec(tx('Frekans f (Hz)', 'Frequency f (Hz)'), 25, 100, 25)];
      case 4: return [Spec(tx('Genlik A (cm)', 'Amplitude A (cm)'), 2, 8, 2), Spec(tx('m (ω = m·π rad/s)', 'm (ω = m·π rad/s)'), 1, 4, 1), Spec(tx('j (faz φ = -j·π/6)', 'j (phase φ = -j·π/6)'), 1, 3, 1)];
      case 5: return [Spec(tx('Ağırlık W (N)', 'Weight W (N)'), 100, 500, 100), Spec(tx('Eğim açısı θ (derece)', 'Incline angle θ (degrees)'), 30, 60, 15)];
      case 6: return [Spec(tx('Direk yüksekliği h (m)', 'Pole height h (m)'), 3, 12, 1), Spec(tx('Güneş yükseklik açısı α (derece)', 'Sun elevation angle α (degrees)'), 30, 60, 15)];
      case 7: return [Spec(tx('Kasnak yarıçapı r (cm)', 'Pulley radius r (cm)'), 5, 20, 5), Spec(tx('Sarım açısı θ (derece)', 'Wrap angle θ (degrees)'), 60, 300, 30)];
      case 8: return [Spec(tx('Devir hızı (dev/dk)', 'Speed (rpm)'), 300, 1500, 300), Spec(tx('Yarıçap r (cm)', 'Radius r (cm)'), 5, 20, 5)];
      default: return [Spec(tx('Frekans f (Hz)', 'Frequency f (Hz)'), 170, 850, 170), Spec(tx('Genlik A (Pa)', 'Amplitude A (Pa)'), 0.2, 1.0, 0.2)];
    }
  }

  function Question(p) {
    const x = p.p;
    switch (p.scn) {
      case 0:
        return tx(`Bir krank milinin kolu ${N2(x[0])} mm yarıçaplı bir daire üzerinde döner. Kol yatayla θ = ${N2(x[1])}° yaptığında krank pimi milin merkezine göre nerededir? Yatay (x = r·cos θ) ve düşey (y = r·sin θ) konumunu birlikte bulalım.`,
          `The arm of a crank shaft rotates on a circle of radius ${N2(x[0])} mm. When the arm makes an angle θ = ${N2(x[1])}° with the horizontal, where is the crank pin relative to the shaft centre? Let's find its horizontal (x = r·cos θ) and vertical (y = r·sin θ) positions.`);
      case 1:
        return tx(`Yarıçapı ${N2(x[0])} m olan bir dönme dolabın göbeği yerden ${N2(x[1])} m yüksekte ve bir tur ${N2(x[2])} s sürüyor. Bir kabin en alt noktadan hareket ediyor: yükseklik h(t) = ${N2(x[1])} - ${N2(x[0])}·cos(2πt/${N2(x[2])}). t = ${N2(x[2] * x[3] / 12)} s anında kabin yerden kaç metre yüksektedir?`,
          `A big wheel of radius ${N2(x[0])} m has its hub ${N2(x[1])} m above the ground and one turn takes ${N2(x[2])} s. A cabin starts at the lowest point: height h(t) = ${N2(x[1])} - ${N2(x[0])}·cos(2πt/${N2(x[2])}). How high above the ground is the cabin at t = ${N2(x[2] * x[3] / 12)} s?`);
      case 2:
        return tx(`Bir limanda su seviyesi h(t) = ${N2(x[1])} + ${N2(x[0])}·cos(2π(t - ${N2(x[2])})/12) metre ile modelleniyor (t: saat). Genlik, periyot ve yüksek gelgit saati kaçtır? t = ${N2(x[2] + x[3])} saatinde su seviyesi kaç metredir?`,
          `The water level in a harbour is modelled by h(t) = ${N2(x[1])} + ${N2(x[0])}·cos(2π(t - ${N2(x[2])})/12) metres (t in hours). What are the amplitude, the period and the time of high tide? What is the water level at t = ${N2(x[2] + x[3])} h?`);
      case 3:
        return tx(`Şebeke gerilimi v(t) = ${N2(x[0])}·sin(2π·${N2(x[1])}·t) volttur (t saniye). Gerilim ilk kez tepe değerinin yarısına (${N2(x[0] / 2)} V) hangi anda ulaşır ve ilk tepe değerine (Vp) hangi anda ulaşır? (milisaniye)`,
          `A mains voltage is v(t) = ${N2(x[0])}·sin(2π·${N2(x[1])}·t) volts (t in seconds). At what first moment does the voltage reach half its peak (${N2(x[0] / 2)} V), and at what first moment does it reach the peak Vp? (milliseconds)`);
      case 4:
        return tx(`Bir yayın ucundaki kütlenin konumu x(t) = ${N2(x[0])}·cos(${N2(x[1])}π·t - ${N2(x[2])}π/6) cm (t saniye). Periyot kaçtır? t = 0'daki konum nedir? Kütle merkezden ilk kez ne zaman geçer (x = 0)?`,
          `The position of a mass on a spring is x(t) = ${N2(x[0])}·cos(${N2(x[1])}π·t - ${N2(x[2])}π/6) cm (t in seconds). What is the period? What is the position at t = 0? When does the mass first pass through the centre (x = 0)?`);
      case 5:
        return tx(`Ağırlığı ${N2(x[0])} N olan bir kasa, yatayla ${N2(x[1])}° yapan sürtünmesiz bir rampada duruyor. Ağırlığın rampaya paralel (W·sin θ) ve rampaya dik (W·cos θ) bileşenlerini bulalım.`,
          `A crate of weight ${N2(x[0])} N rests on a frictionless ramp inclined ${N2(x[1])}° to the horizontal. Let's find the components of the weight parallel (W·sin θ) and perpendicular (W·cos θ) to the ramp.`);
      case 6:
        return tx(`${N2(x[0])} m yüksekliğindeki bir direğin gölgesi, Güneş ufuktan ${N2(x[1])}° yukarıdayken kaç metre uzunluktadır? (tan α = h / gölge)`,
          `How long is the shadow of a ${N2(x[0])} m pole when the Sun is ${N2(x[1])}° above the horizon? (tan α = h / shadow)`);
      case 7:
        return tx(`Yarıçapı ${N2(x[0])} cm olan bir kasnağı kayış ${N2(x[1])}°'lik bir açıyla sarıyor. Kayışın kasnakla temas eden yay uzunluğu (s = r·θ, θ radyan) kaç cm'dir?`,
          `A belt wraps a pulley of radius ${N2(x[0])} cm through an angle of ${N2(x[1])}°. What is the arc length of belt in contact with the pulley (s = r·θ, θ in radians), in cm?`);
      case 8:
        return tx(`Yarıçapı ${N2(x[1])} cm olan bir mil ${N2(x[0])} dev/dk ile dönüyor. Açısal hızı rad/s cinsinden, bir tur süresini ve yüzeydeki çizgisel hızı (m/s) bulalım.`,
          `A shaft of radius ${N2(x[1])} cm turns at ${N2(x[0])} rpm. Let's find its angular speed in rad/s, the time of one turn and the surface speed (m/s).`);
      default:
        return tx(`Bir ses dalgasının frekansı ${N2(x[0])} Hz, havada ses hızı 340 m/s ve basınç genliği ${N2(x[1])} Pa'dır. Dalga boyunu ve periyodu bulalım; dalga y = ${N2(x[1])}·sin(2πx/λ) ise x = λ/12 noktasında basınç ne olur?`,
          `A sound wave has frequency ${N2(x[0])} Hz, the speed of sound in air is 340 m/s and the pressure amplitude is ${N2(x[1])} Pa. Let's find the wavelength and period; if the wave is y = ${N2(x[1])}·sin(2πx/λ), what is the pressure at x = λ/12?`);
    }
  }

  function Meaning(p) {
    switch (p.scn) {
      case 0:
        return tx("Pim, yarıçapı r olan bir çember üzerinde hareket eder; bu bir BİRİM ÇEMBER problemidir (yalnızca ölçek r). Açı θ verilince noktanın koordinatları (r·cos θ, r·sin θ) olur: kosinüs yatay, sinüs düşey konumdur. " +
          "Matematiksel olarak yapacağımız: θ için cos ve sin'in TAM değerlerini birim çemberden okuyup r ile çarpmak.",
          "The pin moves on a circle of radius r, so this is a UNIT-CIRCLE problem (only scaled by r). Given the angle θ, the point has coordinates (r·cos θ, r·sin θ): cosine is the horizontal and sine the vertical position. " +
          "Mathematical task: we read the EXACT cos and sin of θ from the unit circle and multiply by r.");
      case 1:
        return tx("Yükseklik h(t) = H - R·cos(2πt/T) bir KOSİNÜS dalgasıdır: ortalama çizgi H (dikey kayma), genlik R, periyot T. Zaman t verildiğinde önce dönme AÇISINI (2πt/T) bulup birim çemberden cos değerini okuruz. " +
          "Matematiksel olarak yapacağımız: açıyı π'nin katı olarak yazmak, cos'un tam değerini bulmak ve formülde yerine koymak.",
          "The height h(t) = H - R·cos(2πt/T) is a COSINE wave: midline H (vertical shift), amplitude R, period T. Given the time t we first find the rotation ANGLE (2πt/T) and read the cosine from the unit circle. " +
          "Mathematical task: we write the angle as a multiple of π, find the exact cosine, and substitute in the formula.");
      case 2:
        return tx("h(t) = D + A·cos(2π(t - t₀)/T) genel bir SİNÜZOİDDİR: A genlik, T = 12 saat periyot, t₀ faz kayması (yüksek gelgit zamanı), D dikey kayma (ortalama seviye). " +
          "Önce formülden bu dört büyüklüğü OKURUZ, sonra verilen zamanda değeri hesaplarız. Matematiksel olarak yapacağımız: genlik, periyot, faz ve kaymayı belirlemek, sonra t - t₀ açısı için cos'u hesaplamak.",
          "h(t) = D + A·cos(2π(t - t₀)/T) is a general SINUSOID: A is the amplitude, T = 12 hours the period, t₀ the phase shift (time of high tide) and D the vertical shift (mean level). " +
          "We first READ these four quantities from the formula, then evaluate at the given time. Mathematical task: we identify amplitude, period, phase and shift, then compute the cosine of the angle for t - t₀.");
      case 3:
        return tx("v(t) = Vp·sin(2πft) bir SİNÜS dalgasıdır: genlik Vp, periyot 1/f. 'Yarı değere ulaştığı an' sin θ = 1/2 denklemidir; birim çemberde sinüsün ilk kez 1/2 olduğu açı π/6'dır. 'Tepe' ise sin θ = 1, yani θ = π/2. " +
          "Matematiksel olarak yapacağımız: içteki açıyı bu açılara eşitleyip t'yi çözmek.",
          "v(t) = Vp·sin(2πft) is a SINE wave: amplitude Vp, period 1/f. 'Reaching half the value' is the equation sin θ = 1/2; on the unit circle the first angle with sine 1/2 is π/6. 'The peak' is sin θ = 1, i.e. θ = π/2. " +
          "Mathematical task: we set the inner angle equal to those angles and solve for t.");
      case 4:
        return tx("x(t) = A·cos(ωt + φ) faz kaymalı bir KOSİNÜS dalgasıdır: genlik A, açısal frekans ω (periyot T = 2π/ω), faz φ. t = 0'daki konum yalnızca A·cos φ'dir. Merkezden geçiş cos(açı) = 0 demektir; ilk pozitif çözüm açı = π/2. " +
          "Matematiksel olarak yapacağımız: periyodu formülden bulmak, cos φ'yi hesaplamak ve ωt + φ = π/2 denklemini t için çözmek.",
          "x(t) = A·cos(ωt + φ) is a COSINE wave with a phase shift: amplitude A, angular frequency ω (period T = 2π/ω), phase φ. The position at t = 0 is just A·cos φ. Passing through the centre means cos(angle) = 0; the first positive solution is angle = π/2. " +
          "Mathematical task: we get the period from the formula, evaluate cos φ, and solve ωt + φ = π/2 for t.");
      case 5:
        return tx("Ağırlık düşey yönde çekilir, ama rampaya paralel ve dik iki bileşene AYRILIR. Dik üçgende θ açısının KARŞISI W·sin θ (rampa boyunca), KOMŞUSU W·cos θ (rampaya dik) olur. " +
          "Matematiksel olarak yapacağımız: 30°, 45° veya 60° için sin ve cos'un tam değerlerini bulup W ile çarpmak; sonra bileşenlerin yeniden W'yi verdiğini kontrol etmek.",
          "The weight pulls straight down but is SPLIT into components parallel and perpendicular to the ramp. In the right triangle the side OPPOSITE θ gives W·sin θ (along the ramp) and the ADJACENT side gives W·cos θ (into the ramp). " +
          "Mathematical task: we find the exact sin and cos of 30°, 45° or 60°, multiply by W, and check that the components combine back to W.");
      case 6:
        return tx("Direk, gölge ve güneş ışını bir DİK ÜÇGEN oluşturur: direk karşı kenar, gölge komşu kenardır. Tanjant tam olarak 'karşı / komşu' oranıdır: tan α = h / gölge. " +
          "Matematiksel olarak yapacağımız: gölge = h / tan α yazıp tan 30°, 45°, 60° tam değerlerini kullanmak. Güneş alçaldıkça (α → 0) tan küçülür ve gölge çok uzar.",
          "The pole, the shadow and the sun ray form a RIGHT TRIANGLE: the pole is the opposite side and the shadow the adjacent side. Tangent is exactly 'opposite / adjacent': tan α = h / shadow. " +
          "Mathematical task: we use shadow = h / tan α with the exact values of tan 30°, 45°, 60°. As the Sun gets lower (α → 0) tan gets small and the shadow becomes very long.");
      case 7:
        return tx("Yay uzunluğu formülü s = r·θ YALNIZCA θ RADYAN iken geçerlidir. Bu yüzden önce dereceyi radyana çeviririz: θ(rad) = θ(derece)·π/180. " +
          "Matematiksel olarak yapacağımız: (1) derece → radyan (π'nin katı), (2) s = r·θ ile yay uzunluğunu bulmak, (3) sonucu tam çevrenin bir oranı olarak yorumlamak.",
          "The arc-length formula s = r·θ is valid ONLY when θ is in RADIANS. So we first convert degrees to radians: θ(rad) = θ(deg)·π/180. " +
          "Mathematical task: (1) degrees → radians (a multiple of π), (2) we find the arc length with s = r·θ, (3) we interpret the result as a fraction of the full circumference.");
      case 8:
        return tx("1 devir = 2π radyan ve 1 dakika = 60 saniyedir. Bu bir BİRİM DÖNÜŞTÜRME problemidir: ω = (dev/dk)·2π/60. Bir tur süresi periyottur (T = 2π/ω) ve çizgisel hız v = ω·r'dir (yay uzunluğunun zamana oranı). " +
          "Matematiksel olarak yapacağımız: dev/dk → rad/s çevirmek, periyodu bulmak ve v = ωr hesaplamak.",
          "1 revolution = 2π radians and 1 minute = 60 seconds. This is a UNIT-CONVERSION problem: ω = (rpm)·2π/60. The time of one turn is the period (T = 2π/ω) and the surface speed is v = ω·r (arc length per unit time). " +
          "Mathematical task: rpm → rad/s, we find the period and compute v = ωr.");
      default:
        return tx("Bir dalga için hız = frekans × dalga boyu (c = f·λ) ve periyot T = 1/f'tir. y = A·sin(2πx/λ) uzayda periyodu λ olan bir sinüs dalgasıdır (x/λ oranı bir tam tur = 2π). " +
          "Matematiksel olarak yapacağımız: λ = c/f'yi bulmak, x = λ/12 için açıyı 2π·(1/12) = π/6 olarak hesaplamak ve sin(π/6) = 1/2 değerini kullanmak.",
          "For a wave, speed = frequency × wavelength (c = f·λ) and the period is T = 1/f. y = A·sin(2πx/λ) is a sine wave whose spatial period is λ (a ratio x/λ of one full turn = 2π). " +
          "Mathematical task: we find λ = c/f, for x = λ/12 compute the angle 2π·(1/12) = π/6 and use sin(π/6) = 1/2.");
    }
  }

  function solveSteps(problem) {
    const x = problem.p;
    const s = [];
    const add = (a, b) => s.push(tx(a, b));
    switch (problem.scn) {
      case 0: {
        const r = x[0], d = Math.round(x[1]), th = x[1] * Math.PI / 180;
        const cx = r * Math.cos(th), cy = r * Math.sin(th);
        add('1. Değişkenler: r = krank yarıçapı (mm), θ = kolun yatayla açısı, (x, y) = pimin merkeze göre konumu.', '1. Variables: r = crank radius (mm), θ = angle of the arm from the horizontal, (x, y) = pin position relative to the centre.');
        add('2. Pim r yarıçaplı çember üzerindedir: birim çemberdeki (cos θ, sin θ) noktası r ile ölçeklenir → (r·cos θ, r·sin θ).', '2. The pin lies on a circle of radius r: the unit-circle point (cos θ, sin θ) scaled by r → (r·cos θ, r·sin θ).');
        add(`3. Açıyı radyana çevirelim: θ = ${d}° = ${d}·π/180 = ${PiStr(d, 180)}.`, `3. Let's convert the angle to radians: θ = ${d}° = ${d}·π/180 = ${PiStr(d, 180)}.`);
        add(`4. Birim çemberden tam değerler: cos ${d}° = ${ExactTrig('cos', d)},  sin ${d}° = ${ExactTrig('sin', d)}.`, `4. Exact values from the unit circle: cos ${d}° = ${ExactTrig('cos', d)},  sin ${d}° = ${ExactTrig('sin', d)}.`);
        add(`5. Yatay konum: x = r·cos θ = ${N2(r)}·(${N2(Math.cos(th))}) = ${N2(cx)} mm.`, `5. Horizontal position: x = r·cos θ = ${N2(r)}·(${N2(Math.cos(th))}) = ${N2(cx)} mm.`);
        add(`6. Düşey konum: y = r·sin θ = ${N2(r)}·(${N2(Math.sin(th))}) = ${N2(cy)} mm.`, `6. Vertical position: y = r·sin θ = ${N2(r)}·(${N2(Math.sin(th))}) = ${N2(cy)} mm.`);
        add(`7. Kontrol: x² + y² = ${N2(cx * cx)} + ${N2(cy * cy)} = ${N2(cx * cx + cy * cy)} = r² = ${N2(r * r)} ✓ (pim çemberin üzerinde).`, `7. Check: x² + y² = ${N2(cx * cx)} + ${N2(cy * cy)} = ${N2(cx * cx + cy * cy)} = r² = ${N2(r * r)} ✓ (the pin is on the circle).`);
        add(`8. Grafik: x(θ) = r·cos θ genliği ${N2(r)}, periyodu 360° olan bir kosinüs dalgasıdır; sarı nokta seçilen θ'daki x'i gösterir.`, `8. Graph: x(θ) = r·cos θ is a cosine wave of amplitude ${N2(r)} and period 360°; the yellow point shows x at the chosen θ.`);
        add(`9. Yorum: pim yatayda toplam ${N2(2 * r)} mm (= 2r) gidip gelir; bu, pistonun strokuna karşılık gelen hareketin ana fikridir.`, `9. Interpretation: the pin swings a total of ${N2(2 * r)} mm (= 2r) horizontally; this is the basic idea behind a piston stroke.`);
        break;
      }
      case 1: {
        const rr = x[0], hh = x[1], tt = x[2], k = Math.round(x[3]);
        const t = tt * k / 12, ck = Math.cos(k * Math.PI / 6), hgt = hh - rr * ck;
        add('1. Değişkenler: R = yarıçap, H = göbek yüksekliği, T = tur süresi, h(t) = kabinin yerden yüksekliği.', '1. Variables: R = radius, H = hub height, T = period of one turn, h(t) = cabin height above the ground.');
        add(`2. Formülden okuyabiliriz: genlik R = ${N2(rr)} m, ortalama çizgi (dikey kayma) H = ${N2(hh)} m, periyot T = ${N2(tt)} s. Kosinüsün önündeki eksi işaret kabinin EN ALTTAN başladığını gösterir.`, `2. We can read from the formula: amplitude R = ${N2(rr)} m, midline (vertical shift) H = ${N2(hh)} m, period T = ${N2(tt)} s. The minus sign before the cosine means the cabin starts at the BOTTOM.`);
        add(`3. En yüksek nokta H + R = ${N2(hh + rr)} m, en alçak H - R = ${N2(hh - rr)} m.`, `3. Highest point H + R = ${N2(hh + rr)} m, lowest H - R = ${N2(hh - rr)} m.`);
        add(`4. Dönme açısı: 2πt/T = 2π·${N2(t)}/${N2(tt)} = 2π·${k}/12 = ${PiStr(k, 6)}.`, `4. Rotation angle: 2πt/T = 2π·${N2(t)}/${N2(tt)} = 2π·${k}/12 = ${PiStr(k, 6)}.`);
        add(`5. Birim çemberden: cos(${PiStr(k, 6)}) = cos ${30 * k}° = ${ExactTrig('cos', 30 * k)} ≈ ${N2(ck)}.`, `5. From the unit circle: cos(${PiStr(k, 6)}) = cos ${30 * k}° = ${ExactTrig('cos', 30 * k)} ≈ ${N2(ck)}.`);
        add(`6. Formülde yerine koyalım: h = ${N2(hh)} - ${N2(rr)}·(${N2(ck)}) = ${N2(hh)} - (${N2(rr * ck)}).`, `6. Let's substitute: h = ${N2(hh)} - ${N2(rr)}·(${N2(ck)}) = ${N2(hh)} - (${N2(rr * ck)}).`);
        add(`7. Sonuç: h(${N2(t)}) = ${N2(hgt)} m.`, `7. Result: h(${N2(t)}) = ${N2(hgt)} m.`);
        add(`8. Kontrol: sonuç her zaman [${N2(hh - rr)}, ${N2(hh + rr)}] aralığında olmalı ✓ ve öyle çıktı. t = T/2 = ${N2(tt / 2)} s anında kabin en üsttedir.`, `8. Check: the result should lie in [${N2(hh - rr)}, ${N2(hh + rr)}] ✓ and it does. At t = T/2 = ${N2(tt / 2)} s the cabin is at the top.`);
        add(`9. Yorum: ${N2(t)} s, turun ${k}/12'sidir; kabin ${30 * k}° dönmüştür.`, `9. Interpretation: ${N2(t)} s is ${k}/12 of a turn; the cabin has rotated ${30 * k}°.`);
        break;
      }
      case 2: {
        const a = x[0], dd = x[1], t0 = x[2], dl = Math.round(x[3]);
        const tq = t0 + dl, cd = Math.cos(dl * Math.PI / 6), hq = dd + a * cd;
        add('1. Değişkenler: t = saat, h(t) = su seviyesi (m). Genel biçim h = D + A·cos(B(t - t₀)).', '1. Variables: t = hours, h(t) = water level (m). General form h = D + A·cos(B(t - t₀)).');
        add(`2. Genlik: A = ${N2(a)} m. Ortalama seviye (dikey kayma): D = ${N2(dd)} m.`, `2. Amplitude: A = ${N2(a)} m. Mean level (vertical shift): D = ${N2(dd)} m.`);
        add('3. Periyot: B = 2π/12 = π/6 → T = 2π/B = 12 saat.', '3. Period: B = 2π/12 = π/6 → T = 2π/B = 12 hours.');
        add(`4. Faz: t = t₀ = ${N2(t0)} iken cos(0) = 1 → yüksek gelgit saat ${N2(t0)}'da, seviye ${N2(dd + a)} m; alçak gelgit ${N2(t0 + 6)}'da, seviye ${N2(dd - a)} m.`, `4. Phase: at t = t₀ = ${N2(t0)} cos(0) = 1 → high tide at ${N2(t0)} h with level ${N2(dd + a)} m; low tide at ${N2(t0 + 6)} h with level ${N2(dd - a)} m.`);
        add(`5. t = ${N2(tq)} için açı: (π/6)·(${N2(tq)} - ${N2(t0)}) = (π/6)·${dl} = ${PiStr(dl, 6)}.`, `5. Angle for t = ${N2(tq)}: (π/6)·(${N2(tq)} - ${N2(t0)}) = (π/6)·${dl} = ${PiStr(dl, 6)}.`);
        add(`6. Birim çemberden: cos(${PiStr(dl, 6)}) = ${ExactTrig('cos', 30 * dl)} ≈ ${N2(cd)}.`, `6. From the unit circle: cos(${PiStr(dl, 6)}) = ${ExactTrig('cos', 30 * dl)} ≈ ${N2(cd)}.`);
        add(`7. h(${N2(tq)}) = ${N2(dd)} + ${N2(a)}·(${N2(cd)}) = ${N2(hq)} m.`, `7. h(${N2(tq)}) = ${N2(dd)} + ${N2(a)}·(${N2(cd)}) = ${N2(hq)} m.`);
        add(`8. Kontrol: ${N2(dd - a)} ≤ ${N2(hq)} ≤ ${N2(dd + a)} ✓. Grafikte sarı nokta seçilen an, mavi noktalar gelgitlerdir.`, `8. Check: ${N2(dd - a)} ≤ ${N2(hq)} ≤ ${N2(dd + a)} ✓. On the graph the yellow point is the chosen time, the blue points are the tides.`);
        add(`9. Yorum: gelgit her 12 saatte tekrarlar; toplam gelgit farkı 2A = ${N2(2 * a)} m'dir.`, `9. Interpretation: the tide repeats every 12 hours; the total tidal range is 2A = ${N2(2 * a)} m.`);
        break;
      }
      case 3: {
        const vp = x[0], f = x[1];
        const th = 1000.0 / (12 * f), tp = 1000.0 / (4 * f);
        add('1. Değişkenler: Vp = tepe gerilim, f = frekans, t = zaman. v(t) = Vp·sin(2πf·t).', '1. Variables: Vp = peak voltage, f = frequency, t = time. v(t) = Vp·sin(2πf·t).');
        add(`2. Genlik Vp = ${N2(vp)} V; açısal frekans ω = 2πf = ${N2(2 * f)}π rad/s.`, `2. Amplitude Vp = ${N2(vp)} V; angular frequency ω = 2πf = ${N2(2 * f)}π rad/s.`);
        add(`3. Periyot T = 1/f = ${N2(1000.0 / f)} ms.`, `3. Period T = 1/f = ${N2(1000.0 / f)} ms.`);
        add(`4. Yarı değer: ${N2(vp)}·sin(2πft) = ${N2(vp / 2)} → sin(2πft) = 1/2.`, `4. Half value: ${N2(vp)}·sin(2πft) = ${N2(vp / 2)} → sin(2πft) = 1/2.`);
        add('5. Birim çemberde sin θ = 1/2 olan ilk pozitif açı θ = π/6 (30°).', '5. On the unit circle the first positive angle with sin θ = 1/2 is θ = π/6 (30°).');
        add(`6. 2π·${N2(f)}·t = π/6 → t = 1/(12·${N2(f)}) = ${N2(th)} ms.`, `6. 2π·${N2(f)}·t = π/6 → t = 1/(12·${N2(f)}) = ${N2(th)} ms.`);
        add(`7. Tepe: sin θ = 1 → θ = π/2 → 2π·${N2(f)}·t = π/2 → t = 1/(4·${N2(f)}) = ${N2(tp)} ms (çeyrek periyot).`, `7. Peak: sin θ = 1 → θ = π/2 → 2π·${N2(f)}·t = π/2 → t = 1/(4·${N2(f)}) = ${N2(tp)} ms (a quarter period).`);
        add(`8. Kontrol: t = T/12 için açı π/6 ve v = ${N2(vp)}·(1/2) = ${N2(vp / 2)} V ✓. Grafikte iki işaretli nokta.`, `8. Check: at t = T/12 the angle is π/6 and v = ${N2(vp)}·(1/2) = ${N2(vp / 2)} V ✓. Two marked points on the graph.`);
        add(`9. Yorum: gerilim tepeye ${N2(tp)} ms'de ulaşır; yarı değerde eğim daha diktir, gerilim hızla değişir.`, `9. Interpretation: the voltage reaches its peak after ${N2(tp)} ms; near the half value the curve is steeper, so the voltage changes rapidly.`);
        break;
      }
      case 4: {
        const a = x[0], m = x[1], j = Math.round(x[2]);
        const cj = Math.cos(j * Math.PI / 6), x0 = a * cj, tz = (3 + j) / (6 * m);
        add('1. Değişkenler: x(t) = kütlenin merkezden uzaklığı (cm), t = zaman (s). Genel biçim x = A·cos(ωt + φ).', '1. Variables: x(t) = displacement from the centre (cm), t = time (s). General form x = A·cos(ωt + φ).');
        add(`2. Genlik A = ${N2(a)} cm, açısal frekans ω = ${N2(m)}π rad/s, faz φ = -${j}π/6 = ${PiStr(-j, 6)}.`, `2. Amplitude A = ${N2(a)} cm, angular frequency ω = ${N2(m)}π rad/s, phase φ = -${j}π/6 = ${PiStr(-j, 6)}.`);
        add(`3. Periyot T = 2π/ω = 2π/(${N2(m)}π) = ${N2(2 / m)} s; frekans f = ${N2(m / 2)} Hz.`, `3. Period T = 2π/ω = 2π/(${N2(m)}π) = ${N2(2 / m)} s; frequency f = ${N2(m / 2)} Hz.`);
        add(`4. t = 0: x(0) = ${N2(a)}·cos(${PiStr(-j, 6)}) ve cos çift fonksiyon: cos(${PiStr(-j, 6)}) = cos(${PiStr(j, 6)}) = ${ExactTrig('cos', 30 * j)}.`, `4. At t = 0: x(0) = ${N2(a)}·cos(${PiStr(-j, 6)}) and cosine is even: cos(${PiStr(-j, 6)}) = cos(${PiStr(j, 6)}) = ${ExactTrig('cos', 30 * j)}.`);
        add(`5. x(0) = ${N2(a)}·${N2(cj)} = ${N2(x0)} cm.`, `5. x(0) = ${N2(a)}·${N2(cj)} = ${N2(x0)} cm.`);
        add(`6. Merkezden geçiş: cos(θ) = 0 → ilk pozitif çözüm θ = π/2. ${N2(m)}π·t - ${j}π/6 = π/2.`, `6. Passing the centre: cos(θ) = 0 → first positive solution θ = π/2. ${N2(m)}π·t - ${j}π/6 = π/2.`);
        add(`7. ${N2(m)}π·t = π/2 + ${j}π/6 = ${3 + j}π/6 → t = ${3 + j}/(6·${N2(m)}) = ${N2(tz)} s.`, `7. ${N2(m)}π·t = π/2 + ${j}π/6 = ${3 + j}π/6 → t = ${3 + j}/(6·${N2(m)}) = ${N2(tz)} s.`);
        add(`8. Kontrol: t = ${N2(tz)} için açı ${N2(m)}π·${N2(tz)} - ${j}π/6 = π/2 ve cos(π/2) = 0 ✓ (grafikte sıfır kesişimi).`, `8. Check: for t = ${N2(tz)} the angle is ${N2(m)}π·${N2(tz)} - ${j}π/6 = π/2 and cos(π/2) = 0 ✓ (the zero crossing on the graph).`);
        add(`9. Yorum: negatif faz eğriyi SAĞA kaydırır: kütle t = 0'da zirvede değil, x = ${N2(x0)} cm'dedir ve zirveye t = ${N2(j / (6 * m))} s'de ulaşır.`, `9. Interpretation: the negative phase shifts the curve to the RIGHT: at t = 0 the mass is not at the top but at x = ${N2(x0)} cm, and it reaches the top at t = ${N2(j / (6 * m))} s.`);
        break;
      }
      case 5: {
        const w = x[0], d = Math.round(x[1]), th = x[1] * Math.PI / 180;
        const sn = Math.sin(th), cs = Math.cos(th);
        add('1. Değişkenler: W = ağırlık (N), θ = rampanın yatayla açısı, F∥ = rampa boyunca, F⊥ = rampaya dik bileşen.', '1. Variables: W = weight (N), θ = ramp angle to the horizontal, F∥ = component along the ramp, F⊥ = component perpendicular to it.');
        add('2. Ağırlık düşeydir; rampaya göre eğik bir eksen takımında iki bileşene ayırabiliriz. Ağırlık vektörü ile rampaya dik doğru arasındaki açı da θ\'dır.', '2. Weight is vertical; in axes tilted with the ramp we can split it into two components. The angle between the weight vector and the ramp normal is also θ.');
        add('3. Dik üçgen: F∥ = W·sin θ (θ\'nın karşısı), F⊥ = W·cos θ (θ\'nın komşusu).', '3. Right triangle: F∥ = W·sin θ (opposite θ), F⊥ = W·cos θ (adjacent to θ).');
        add(`4. θ = ${d}° = ${PiStr(d, 180)}. Tam değerler: sin ${d}° = ${ExactTrig('sin', d)}, cos ${d}° = ${ExactTrig('cos', d)}.`, `4. θ = ${d}° = ${PiStr(d, 180)}. Exact values: sin ${d}° = ${ExactTrig('sin', d)}, cos ${d}° = ${ExactTrig('cos', d)}.`);
        add(`5. F∥ = ${N2(w)}·${N2(sn)} = ${N2(w * sn)} N.`, `5. F∥ = ${N2(w)}·${N2(sn)} = ${N2(w * sn)} N.`);
        add(`6. F⊥ = ${N2(w)}·${N2(cs)} = ${N2(w * cs)} N.`, `6. F⊥ = ${N2(w)}·${N2(cs)} = ${N2(w * cs)} N.`);
        add(`7. Kontrol (Pisagor): F∥² + F⊥² = ${N2(w * w * sn * sn)} + ${N2(w * w * cs * cs)} = ${N2(w * w)} = W² ✓ (sin² + cos² = 1).`, `7. Check (Pythagoras): F∥² + F⊥² = ${N2(w * w * sn * sn)} + ${N2(w * w * cs * cs)} = ${N2(w * w)} = W² ✓ (sin² + cos² = 1).`);
        add('8. Grafik: vurgu renkli eğri F∥(θ) = W sin θ, yeşil eğri F⊥(θ) = W cos θ; sarı noktalar seçilen açıdaki değerlerdir.', '8. Graph: the accent curve is F∥(θ) = W sin θ, the green curve F⊥(θ) = W cos θ; the yellow points are the values at the chosen angle.');
        add(`9. Yorum: rampa dikleştikçe kaydıran bileşen büyür (θ = 90°'de W), bastıran bileşen küçülür. Sürtünmesiz kasa ${N2(w * sn)} N'luk kuvvetle aşağı kayar.`, `9. Interpretation: the steeper the ramp, the larger the sliding component (W at 90°) and the smaller the pressing one. The frictionless crate is driven down with ${N2(w * sn)} N.`);
        break;
      }
      case 6: {
        const h = x[0], d = Math.round(x[1]), th = x[1] * Math.PI / 180;
        const tn = Math.tan(th);
        add('1. Değişkenler: h = direk boyu, α = güneş yükseklik açısı, L = gölge uzunluğu.', '1. Variables: h = pole height, α = sun elevation angle, L = shadow length.');
        add('2. Dik üçgen: karşı kenar = direk (h), komşu kenar = gölge (L), açı α gölgenin ucundadır.', '2. Right triangle: opposite side = pole (h), adjacent side = shadow (L), angle α is at the tip of the shadow.');
        add('3. tan α = karşı / komşu = h / L.', '3. tan α = opposite / adjacent = h / L.');
        add('4. L\'yi yalnız bırakalım: L = h / tan α.', '4. Solving for L: L = h / tan α.');
        add(`5. α = ${d}° = ${PiStr(d, 180)}; tam değer: tan ${d}° = ${ExactTrig('tan', d)} ≈ ${N2(tn)}.`, `5. α = ${d}° = ${PiStr(d, 180)}; exact value: tan ${d}° = ${ExactTrig('tan', d)} ≈ ${N2(tn)}.`);
        add(`6. L = ${N2(h)} / ${N2(tn)} = ${N2(h / tn)} m.`, `6. L = ${N2(h)} / ${N2(tn)} = ${N2(h / tn)} m.`);
        add(`7. Kontrol: h = L·tan α = ${N2(h / tn)}·${N2(tn)} = ${N2(h)} ✓. 45°'de gölge direğe eşit olurdu.`, `7. Check: h = L·tan α = ${N2(h / tn)}·${N2(tn)} = ${N2(h)} ✓. At 45° the shadow would equal the pole.`);
        add('8. Grafik: L(α) = h / tan α; α → 0\'da eğri sonsuza gider (tan 0 = 0, tanımsız), α = 90°\'de gölge sıfırdır. Sarı nokta seçilen açıdır.', '8. Graph: L(α) = h / tan α; as α → 0 the curve blows up (tan 0 = 0, undefined), and at α = 90° the shadow is zero. The yellow point is the chosen angle.');
        add(`9. Yorum: Güneş ${d}° yükseklikte iken ${N2(h)} m'lik direk ${N2(h / tn)} m gölge yapar; akşama doğru α küçülür, gölge uzar.`, `9. Interpretation: with the Sun ${d}° high a ${N2(h)} m pole casts ${N2(h / tn)} m of shadow; towards evening α decreases and the shadow lengthens.`);
        break;
      }
      case 7: {
        const r = x[0], d = Math.round(x[1]), th = x[1] * Math.PI / 180;
        add('1. Değişkenler: r = kasnak yarıçapı (cm), θ = sarım açısı, s = temas eden yay uzunluğu.', '1. Variables: r = pulley radius (cm), θ = wrap angle, s = arc length in contact.');
        add('2. Yay uzunluğu formülü s = r·θ, θ RADYAN iken geçerlidir; dereceyle kullanırsak yanlış sonuç çıkar.', '2. The arc-length formula s = r·θ holds only for θ in RADIANS; using degrees would give a wrong result.');
        add(`3. Dönüşüm: θ = ${d}·π/180 = ${PiStr(d, 180)} rad ≈ ${N2(th)} rad.`, `3. Conversion: θ = ${d}·π/180 = ${PiStr(d, 180)} rad ≈ ${N2(th)} rad.`);
        add(`4. Yerine koyalım: s = ${N2(r)}·(${PiStr(d, 180)}).`, `4. Let's substitute: s = ${N2(r)}·(${PiStr(d, 180)}).`);
        add(`5. Tam değer: s = ${N2(r * d / 180.0)}π cm.`, `5. Exact value: s = ${N2(r * d / 180.0)}π cm.`);
        add(`6. Sayısal: s ≈ ${N2(r * d / 180.0)}·3.1416 ≈ ${N2(r * th)} cm.`, `6. Numerically: s ≈ ${N2(r * d / 180.0)}·3.1416 ≈ ${N2(r * th)} cm.`);
        add(`7. Kontrol: tam çevre 2πr = ${N2(2 * r)}π ≈ ${N2(2 * Math.PI * r)} cm; oran ${d}/360 = ${N2(d / 360.0)} → ${N2(d / 360.0 * 2 * Math.PI * r)} cm ✓.`, `7. Check: full circumference 2πr = ${N2(2 * r)}π ≈ ${N2(2 * Math.PI * r)} cm; fraction ${d}/360 = ${N2(d / 360.0)} → ${N2(d / 360.0 * 2 * Math.PI * r)} cm ✓.`);
        add('8. Grafik: s(θ) = r·θ dereceye göre DOĞRUSAL bir grafiktir; sarı nokta seçilen sarım açısıdır.', '8. Graph: s(θ) = r·θ is a LINEAR graph in degrees; the yellow point is the chosen wrap angle.');
        add(`9. Yorum: kayış kasnağın yaklaşık %${N2(d / 3.6)}'ini sarar; sarım açısı büyüdükçe kayış-kasnak sürtünme yüzeyi ve güç aktarımı artar.`, `9. Interpretation: the belt covers about ${N2(d / 3.6)}% of the pulley; a larger wrap angle means more contact and better power transmission.`);
        break;
      }
      case 8: {
        const rp = x[0], rc = x[1];
        const w = rp * Math.PI / 30, v = w * rc / 100;
        add('1. Değişkenler: n = devir hızı (dev/dk), ω = açısal hız (rad/s), r = yarıçap, T = periyot, v = çizgisel hız.', '1. Variables: n = speed (rpm), ω = angular speed (rad/s), r = radius, T = period, v = surface speed.');
        add('2. Dönüşüm: 1 devir = 2π rad ve 1 dk = 60 s → ω = n·2π/60 = n·π/30.', '2. Conversion: 1 revolution = 2π rad and 1 min = 60 s → ω = n·2π/60 = n·π/30.');
        add(`3. ω = ${N2(rp)}·π/30 = ${N2(rp / 30)}π rad/s.`, `3. ω = ${N2(rp)}·π/30 = ${N2(rp / 30)}π rad/s.`);
        add(`4. Sayısal: ω ≈ ${N2(rp / 30)}·3.1416 ≈ ${N2(w)} rad/s.`, `4. Numerically: ω ≈ ${N2(rp / 30)}·3.1416 ≈ ${N2(w)} rad/s.`);
        add(`5. Periyot: T = 2π/ω = 60/n = 60/${N2(rp)} = ${N2(60 / rp)} s = ${N2(60000 / rp)} ms.`, `5. Period: T = 2π/ω = 60/n = 60/${N2(rp)} = ${N2(60 / rp)} s = ${N2(60000 / rp)} ms.`);
        add(`6. Yarıçapı metreye çevirelim: r = ${N2(rc)} cm = ${N2(rc / 100)} m.`, `6. Let's convert the radius to metres: r = ${N2(rc)} cm = ${N2(rc / 100)} m.`);
        add(`7. Çizgisel hız: v = ω·r = ${N2(w)}·${N2(rc / 100)} ≈ ${N2(v)} m/s.`, `7. Surface speed: v = ω·r = ${N2(w)}·${N2(rc / 100)} ≈ ${N2(v)} m/s.`);
        add(`8. Kontrol: bir turda yol 2πr = ${N2(2 * Math.PI * rc / 100)} m; bunu T = ${N2(60 / rp)} s'ye bölersek ≈ ${N2(2 * Math.PI * rc / 100 / (60 / rp))} m/s ✓.`, `8. Check: in one turn the path is 2πr = ${N2(2 * Math.PI * rc / 100)} m; dividing by T = ${N2(60 / rp)} s gives ≈ ${N2(2 * Math.PI * rc / 100 / (60 / rp))} m/s ✓.`);
        add(`9. Grafik: yüzeydeki bir noktanın yüksekliği y = r·sin(ωt) bir sinüs dalgasıdır; bir tam dalga = ${N2(60000 / rp)} ms.`, `9. Graph: the height of a surface point y = r·sin(ωt) is a sine wave; one full wave = ${N2(60000 / rp)} ms.`);
        break;
      }
      default: {
        const f = x[0], a = x[1], lam = 340 / f;
        add('1. Değişkenler: f = frekans, c = 340 m/s ses hızı, λ = dalga boyu, T = periyot, y = basınç.', '1. Variables: f = frequency, c = 340 m/s speed of sound, λ = wavelength, T = period, y = pressure.');
        add(`2. Dalga bağıntısı c = f·λ → λ = c/f = 340/${N2(f)} = ${N2(lam)} m.`, `2. Wave relation c = f·λ → λ = c/f = 340/${N2(f)} = ${N2(lam)} m.`);
        add(`3. Periyot: T = 1/f = 1/${N2(f)} = ${N2(1000 / f)} ms.`, `3. Period: T = 1/f = 1/${N2(f)} = ${N2(1000 / f)} ms.`);
        add(`4. Genlik A = ${N2(a)} Pa; uzaydaki periyot λ = ${N2(lam)} m (x arttıkça sinüs tekrarlanır).`, `4. Amplitude A = ${N2(a)} Pa; the spatial period is λ = ${N2(lam)} m (the sine repeats as x increases).`);
        add(`5. x = λ/12 için açı: 2π·x/λ = 2π·(1/12) = ${PiStr(1, 6)}.`, `5. For x = λ/12 the angle is 2π·x/λ = 2π·(1/12) = ${PiStr(1, 6)}.`);
        add('6. Birim çemberden: sin(π/6) = 1/2.', '6. From the unit circle: sin(π/6) = 1/2.');
        add(`7. y = ${N2(a)}·(1/2) = ${N2(a / 2)} Pa, konum x = ${N2(lam / 12)} m'de.`, `7. y = ${N2(a)}·(1/2) = ${N2(a / 2)} Pa at position x = ${N2(lam / 12)} m.`);
        add(`8. Kontrol: x = λ = ${N2(lam)} m'de açı 2π ve sin 2π = 0: dalga bir tam tur yapmıştır ✓ (grafikte sıfır noktası).`, `8. Check: at x = λ = ${N2(lam)} m the angle is 2π and sin 2π = 0: the wave has completed one full cycle ✓ (zero point on the graph).`);
        add(`9. Yorum: frekans arttıkça dalga boyu kısalır (c sabit); ${N2(f)} Hz'de bir dalga ${N2(lam)} m yer kaplar.`, `9. Interpretation: as frequency rises the wavelength shortens (c is constant); at ${N2(f)} Hz one wave occupies ${N2(lam)} m.`);
      }
    }
    return s;
  }

  // the point the scenario asks about (same point the gold/green marker highlights)
  function focusPoint(problem) {
    const x = problem.p;
    const R = Math.PI / 180;
    switch (problem.scn) {
      case 0: return { x: x[1], y: x[0] * Math.cos(x[1] * R) };
      case 1: { const t = x[2] * x[3] / 12; return { x: t, y: x[1] - x[0] * Math.cos(2 * Math.PI * t / x[2]) }; }
      case 2: { const tq = x[2] + x[3]; return { x: tq, y: x[1] + x[0] * Math.cos(2 * Math.PI * (tq - x[2]) / 12) }; }
      case 3: return { x: 1000.0 / (12 * x[1]), y: x[0] / 2 };
      case 4: return { x: (3 + Math.round(x[2])) / (6 * x[1]), y: 0 };
      case 5: return { x: x[1], y: x[0] * Math.sin(x[1] * R) };
      case 6: return { x: x[1], y: x[0] / Math.tan(x[1] * R) };
      case 7: return { x: x[1], y: x[0] * x[1] * R };
      case 8: return { x: 60000 / x[0], y: 0 };
      default: return { x: (340 / x[0]) / 12, y: x[1] / 2 };
    }
  }

  // same window size as before, but centred on the point of interest
  function vp(canvas, problem, x0, x1, y0, y1) {
    canvas.setViewport(x0, x1, y0, y1); // fixed axes
  }

  function draw(canvas, problem) {
    const x = problem.p;
    const accent = canvas.accent();
    const R = Math.PI / 180;
    switch (problem.scn) {
      case 0: {
        const r = x[0], d = x[1];
        vp(canvas, problem, -20, 380, -r * 1.4, r * 1.4);
        canvas.addFunction({ evaluator: (v) => r * Math.cos(v * R), color: accent, thickness: 3 });
        canvas.addFunction({ evaluator: (v) => r * Math.sin(v * R), color: canvas.green(), thickness: 2, dashed: true });
        canvas.addMarker({ x: d, y: r * Math.cos(d * R), color: canvas.gold(), radius: 7, label: `x = ${N2(r * Math.cos(d * R))}` });
        canvas.addMarker({ x: d, y: r * Math.sin(d * R), color: canvas.blue(), radius: 6, label: `y = ${N2(r * Math.sin(d * R))}` });
        break;
      }
      case 1: {
        const rr = x[0], hh = x[1], tt = x[2], t = x[2] * x[3] / 12;
        const f = (v) => hh - rr * Math.cos(2 * Math.PI * v / tt);
        vp(canvas, problem, -tt * 0.05, tt * 1.05, 0, hh + rr + 6);
        canvas.addFunction({ evaluator: f, color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: hh, color: canvas.gray(), label: 'H' });
        canvas.addMarker({ x: t, y: f(t), color: canvas.gold(), radius: 7, label: `h(${N2(t)}) = ${N2(f(t))}` });
        break;
      }
      case 2: {
        const a = x[0], dd = x[1], t0 = x[2], tq = x[2] + x[3];
        const f = (v) => dd + a * Math.cos(2 * Math.PI * (v - t0) / 12);
        vp(canvas, problem, -1, 28, dd - a * 1.5, dd + a * 1.5);
        canvas.addFunction({ evaluator: f, color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: dd, color: canvas.gray(), label: 'D' });
        canvas.addMarker({ x: t0, y: dd + a, color: canvas.blue(), radius: 6, label: tx('yüksek gelgit', 'high tide') });
        canvas.addMarker({ x: t0 + 6, y: dd - a, color: canvas.blue(), radius: 6, label: tx('alçak gelgit', 'low tide') });
        canvas.addMarker({ x: tq, y: f(tq), color: canvas.gold(), radius: 7, label: `h(${N2(tq)}) = ${N2(f(tq))}` });
        break;
      }
      case 3: {
        const vp = x[0], f = x[1], tp = 1000.0 / (4 * f), th = 1000.0 / (12 * f), per = 1000.0 / f;
        vp(canvas, problem, -per * 0.1, per * 2.05, -vp * 1.4, vp * 1.4);
        canvas.addFunction({ evaluator: (v) => vp * Math.sin(2 * Math.PI * f * v / 1000.0), color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: vp / 2, color: canvas.gray() });
        canvas.addMarker({ x: th, y: vp / 2, color: canvas.gold(), radius: 7, label: `t = ${N2(th)} ms` });
        canvas.addMarker({ x: tp, y: vp, color: canvas.green(), radius: 7, label: `t = ${N2(tp)} ms` });
        break;
      }
      case 4: {
        const a = x[0], m = x[1], j = x[2], per = 2 / m;
        const f = (v) => a * Math.cos(m * Math.PI * v - j * Math.PI / 6);
        vp(canvas, problem, -per * 0.1, per * 2.05, -a * 1.4, a * 1.4);
        canvas.addFunction({ evaluator: f, color: accent, thickness: 3 });
        canvas.addMarker({ x: 0, y: f(0), color: canvas.blue(), radius: 6, label: `x(0) = ${N2(f(0))}` });
        canvas.addMarker({ x: (3 + j) / (6 * m), y: 0, color: canvas.gold(), radius: 7, label: `t = ${N2((3 + j) / (6 * m))} s` });
        break;
      }
      case 5: {
        const w = x[0], d = x[1];
        vp(canvas, problem, -5, 95, -w * 0.1, w * 1.15);
        canvas.addFunction({ evaluator: (v) => w * Math.sin(v * R), color: accent, thickness: 3 });
        canvas.addFunction({ evaluator: (v) => w * Math.cos(v * R), color: canvas.green(), thickness: 3 });
        canvas.addMarker({ x: d, y: w * Math.sin(d * R), color: canvas.gold(), radius: 7, label: `F∥ = ${N2(w * Math.sin(d * R))}` });
        canvas.addMarker({ x: d, y: w * Math.cos(d * R), color: canvas.gold(), radius: 7, label: `F⊥ = ${N2(w * Math.cos(d * R))}` });
        break;
      }
      case 6: {
        const h = x[0], d = x[1];
        const f = (v) => (v <= 1 || v >= 89 ? NaN : h / Math.tan(v * R));
        vp(canvas, problem, 0, 90, -h * 0.3, h * 3.6);
        canvas.addFunction({ evaluator: f, color: accent, thickness: 3 });
        canvas.addMarker({ x: d, y: f(d), color: canvas.gold(), radius: 7, label: `L = ${N2(f(d))} m` });
        break;
      }
      case 7: {
        const r = x[0], d = x[1];
        vp(canvas, problem, -10, 370, -2 * Math.PI * r * 0.1, 2 * Math.PI * r * 1.1);
        canvas.addFunction({ evaluator: (v) => r * v * R, color: accent, thickness: 3 });
        canvas.addMarker({ x: d, y: r * d * R, color: canvas.gold(), radius: 7, label: `s = ${N2(r * d * R)} cm` });
        break;
      }
      case 8: {
        const rp = x[0], rc = x[1], per = 60000 / x[0];
        vp(canvas, problem, -per * 0.1, per * 2.1, -rc * 1.4, rc * 1.4);
        canvas.addFunction({ evaluator: (v) => rc * Math.sin(rp * Math.PI / 30 * v / 1000.0), color: accent, thickness: 3 });
        canvas.addMarker({ x: per, y: 0, color: canvas.gold(), radius: 7, label: `T = ${N2(per)} ms` });
        canvas.addMarker({ x: per / 4, y: rc, color: canvas.blue(), radius: 6, label: 'r' });
        break;
      }
      default: {
        const a = x[1], lam = 340 / x[0];
        vp(canvas, problem, -lam * 0.1, lam * 2.1, -a * 1.5, a * 1.5);
        canvas.addFunction({ evaluator: (v) => a * Math.sin(2 * Math.PI * v / lam), color: accent, thickness: 3 });
        canvas.addMarker({ x: lam / 12, y: a / 2, color: canvas.gold(), radius: 7, label: `y = ${N2(a / 2)}` });
        canvas.addMarker({ x: lam, y: 0, color: canvas.green(), radius: 6, label: `λ = ${N2(lam)} m` });
      }
    }
    syncSliders(problem);
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
    return { scn, p };
  }

  function concept(problem) {
    const head = tx('SORU', 'QUESTION') + '\n' + Question(problem) + '\n\n';
    if (showMeaning) {
      return head + tx('BU SORUDA MATEMATİKSEL OLARAK NE İSTENİYOR?', 'WHAT IS THIS QUESTION ASKING, MATHEMATICALLY?') + '\n' + Meaning(problem);
    }
    return head + tx(
      "(Çözmeden önce sorunun matematiksel karşılığına bakmak istersek 'Soru ne demek istiyor?' düğmesini kullanabiliriz.)",
      "(To see what the question means mathematically before solving, we can use the 'What does the question mean?' button.)");
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
        helpers.refresh();
      });
      sliderRows.push({ block, captionEl, valueEl, input });
    }

    if (offLangCustom) offLangCustom();
    offLangCustom = I18N.onChange(() => {
      const titles = Titles();
      for (let i = 0; i < selectReg.select.options.length && i < titles.length; i++) {
        selectReg.select.options[i].textContent = titles[i];
      }
      updateMeaningLabel();
    });
  }

  Topics.register('trig', {
    id: 'realLifeTrig',
    tabTitle: () => tx('Hayattan Örnekler', 'Real-Life Examples'),
    concept,
    createProblem,
    solveSteps,
    draw,
    focus: (problem) => focusPoint(problem),
    buildControls,
  });
})();
