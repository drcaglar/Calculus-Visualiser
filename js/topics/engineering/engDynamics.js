// Ported from Modules/EngineeringApplications/EngDynamicsControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/limits/realLifeLimits.js): sixteen engineering scenarios (8 + 8 mechanical-engineering extensions, with schematic sketches) with a scenario selector, live sliders,
// units + physical-meaning block, the 'what does the question mean?' toggle and a detailed nine-step solution.
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

  function Titles1() {
    return [ tx("1. Parçacığın kinematiği: s → v → a", "1. Particle kinematics: s → v → a"), tx("2. İvmeden hız ve konum (integral)", "2. From acceleration to velocity and position"), tx("3. Eğik atış: maksimum yükseklik ve menzil", "3. Projectile: maximum height and range"), tx("4. Fren mesafesi (v–t eğrisi altındaki alan)", "4. Braking distance (area under the v–t curve)"), tx("5. Yayda iş: W = ∫F dx", "5. Work done on a spring: W = ∫F dx"), tx("6. Yay-kütle serbest titreşimi", "6. Spring–mass free vibration"), tx("7. Dönen mil: açısal hız ve ivme, dev/dk", "7. Rotating shaft: angular velocity, acceleration, rpm"), tx("8. Güç ve enerji: E = ∫P dt", "8. Power and energy: E = ∫P dt") ];
  }


  function Specs1(scn) {
    switch (scn) {
    case 0: {
    return [Spec("a (m/s³)", 1, 3, 1), Spec("b (m/s²)", 1, 4, 1), Spec("c (m/s)", 2, 10, 2), Spec(tx("Zaman T (s)", "Time T (s)"), 1, 4, 1)];
    break; }
    case 1: {
    return [Spec(tx("Sabit ivme q (m/s²)", "Constant part q (m/s²)"), 2, 6, 2), Spec(tx("Artış p (m/s³)", "Growth p (m/s³)"), 3, 9, 3), Spec(tx("Başlangıç hızı v₀ (m/s)", "Initial velocity v₀ (m/s)"), 0, 10, 5), Spec(tx("Zaman T (s)", "Time T (s)"), 2, 6, 2)];
    break; }
    case 2: {
    return [Spec(tx("Yatay hız vₓ (m/s)", "Horizontal speed vₓ (m/s)"), 10, 30, 5), Spec(tx("Düşey hız v_y (m/s)", "Vertical speed v_y (m/s)"), 10, 30, 10)];
    break; }
    case 3: {
    return [Spec(tx("İlk hız v₀ (km/sa)", "Initial speed v₀ (km/h)"), 36, 108, 36), Spec(tx("Yavaşlama a (m/s²)", "Deceleration a (m/s²)"), 2, 8, 2)];
    break; }
    case 4: {
    return [Spec(tx("Yay sabiti k (N/m)", "Spring constant k (N/m)"), 200, 600, 200), Spec(tx("Başlangıç uzama x₁ (m)", "Start extension x₁ (m)"), 0, 0.2, 0.1), Spec(tx("Son uzama x₂ (m)", "End extension x₂ (m)"), 0.3, 0.5, 0.1)];
    break; }
    case 5: {
    return [Spec(tx("Kütle m (kg)", "Mass m (kg)"), 1, 4, 1), Spec(tx("Doğal frekans ω (rad/s)", "Natural frequency ω (rad/s)"), 2, 6, 2), Spec(tx("Genlik A (m)", "Amplitude A (m)"), 0.05, 0.15, 0.05)];
    break; }
    case 6: {
    return [Spec("a (rad/s²)", 1, 5, 1), Spec("b (rad/s)", 0, 10, 5), Spec(tx("Zaman T (s)", "Time T (s)"), 2, 6, 2)];
    break; }
    default: {
    return [Spec(tx("Başlangıç gücü P₀ (kW)", "Initial power P₀ (kW)"), 2, 10, 2), Spec(tx("Artış hızı k (kW/s)", "Growth rate k (kW/s)"), 1, 4, 1), Spec(tx("Süre T (s)", "Duration T (s)"), 4, 10, 2)];
    break; }
    }
  }


  function Question1(p) {
    let x = p.p;
    switch (p.scn) {
    case 0: {
    return tx(`Doğrusal bir yolda hareket eden bir parçacığın konumu s(t) = ${N2(x[0])}t³ + ${N2(x[1])}t² + ${N2(x[2])}t metredir (t saniye). t = ${N2(x[3])} s anındaki konumu, hızı v = ds/dt ve ivmeyi a = dv/dt bulun.`, `A particle moving along a straight line has position s(t) = ${N2(x[0])}t³ + ${N2(x[1])}t² + ${N2(x[2])}t metres (t in seconds). At t = ${N2(x[3])} s find the position, the velocity v = ds/dt and the acceleration a = dv/dt.`);
    break; }
    case 1: {
    return tx(`Bir arabanın ivmesi a(t) = ${N2(x[1])}t + ${N2(x[0])} m/s² (t saniye). t = 0'da konum s = 0 ve hız v = ${N2(x[2])} m/s. a(t)'yi integre ederek v(t) ve s(t) fonksiyonlarını bulun; t = ${N2(x[3])} s anındaki hız ve konumu hesaplayın.`, `A car has acceleration a(t) = ${N2(x[1])}t + ${N2(x[0])} m/s² (t in seconds). At t = 0 the position is s = 0 and the velocity is v = ${N2(x[2])} m/s. Integrate a(t) to find v(t) and s(t), then compute velocity and position at t = ${N2(x[3])} s.`);
    break; }
    case 2: {
    return tx(`Bir cisim yerden yatay ${N2(x[0])} m/s ve düşey ${N2(x[1])} m/s başlangıç hızıyla fırlatılıyor (g = 10 m/s², hava direnci yok). y(t) = ${N2(x[1])}t − 5t². Ulaştığı maksimum yüksekliği ve yatay menzili bulun.`, `A body is launched from the ground with horizontal speed ${N2(x[0])} m/s and vertical speed ${N2(x[1])} m/s (g = 10 m/s², no air drag). y(t) = ${N2(x[1])}t − 5t². Find the maximum height reached and the horizontal range.`);
    break; }
    case 3: {
    return tx(`Bir araç ${N2(x[0])} km/sa hızla giderken sabit ${N2(x[1])} m/s² yavaşlamayla frenleniyor. Durana kadar geçen süreyi ve fren mesafesini, hız-zaman eğrisinin altındaki alanı integre ederek bulun.`, `A vehicle travelling at ${N2(x[0])} km/h brakes with a constant deceleration of ${N2(x[1])} m/s². Find the time to stop and the braking distance by integrating the area under the velocity–time curve.`);
    break; }
    case 4: {
    return tx(`Bir yay F(x) = ${N2(x[0])}·x N kuvvetiyle direniyor (x metre cinsinden uzama). Yayı x₁ = ${N2(x[1])} m'den x₂ = ${N2(x[2])} m'ye çekmek için yapılan işi W = ∫F dx ile bulun.`, `A spring resists with a force F(x) = ${N2(x[0])}·x N (x is the extension in metres). Find the work done in stretching it from x₁ = ${N2(x[1])} m to x₂ = ${N2(x[2])} m using W = ∫F dx.`);
    break; }
    case 5: {
    return tx(`${N2(x[0])} kg'lık bir kütle bir yaya bağlı; doğal frekans ω = ${N2(x[1])} rad/s ve genlik A = ${N2(x[2])} m. Konum x(t) = A·cos(ωt). Hızı ve ivmeyi türevle bulun; maksimum hızı, maksimum ivmeyi ve yay sabitini k = m·ω² hesaplayın.`, `A mass of ${N2(x[0])} kg is attached to a spring; the natural frequency is ω = ${N2(x[1])} rad/s and the amplitude A = ${N2(x[2])} m. Position x(t) = A·cos(ωt). Find velocity and acceleration by differentiation; compute the maximum speed, the maximum acceleration and the spring constant k = m·ω².`);
    break; }
    case 6: {
    return tx(`Bir milin açısal konumu θ(t) = ${N2(x[0])}t² + ${N2(x[1])}t radyandır (t saniye). t = ${N2(x[2])} s anında açısal hızı ω = dθ/dt, açısal ivmeyi α = dω/dt ve dev/dk (rpm) cinsinden dönüş hızını bulun.`, `The angular position of a shaft is θ(t) = ${N2(x[0])}t² + ${N2(x[1])}t radians (t in seconds). At t = ${N2(x[2])} s find the angular velocity ω = dθ/dt, the angular acceleration α = dω/dt and the rotational speed in rpm.`);
    break; }
    default: {
    return tx(`Bir motorun gücü P(t) = ${N2(x[0])} + ${N2(x[1])}t kW (t saniye) olarak değişiyor. İlk ${N2(x[2])} saniyede sağlanan enerjiyi E = ∫P dt ile bulun ve ortalama gücü hesaplayın.`, `The power of a motor varies as P(t) = ${N2(x[0])} + ${N2(x[1])}t kW (t in seconds). Find the energy delivered in the first ${N2(x[2])} seconds using E = ∫P dt and compute the average power.`);
    break; }
    }
  }


  function MeaningExtra1(scn) {
    switch (scn) {
    case 0: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "s: m, v = s′: m/s, a = s″: m/s². Türev her adımda birimi \"/s\" ile böler. Hızın işareti hareket yönünü, ivmenin işareti hızın artıp azaldığını gösterir (v ve a ters işaretliyse parçacık yavaşlar)." + "\n" + "YÖNTEM" + "\n" + "1. v(t) = s′(t). 2. a(t) = v′(t). 3. İstenen t = T için değerlendir." + "\n" + "TUZAK: Birim kontrolü (a m/s³ terimi, t² ile m/s²'ye iner). Hız sıfır olan an dönüş noktasıdır.", "UNITS AND PHYSICAL MEANING" + "\n" + "s: m, v = s′: m/s, a = s″: m/s². Each derivative divides the unit by s. The sign of v gives the direction of motion, the sign of a tells whether speed rises or falls (if v and a have opposite signs the particle slows down)." + "\n" + "METHOD" + "\n" + "1. v(t) = s′(t). 2. a(t) = v′(t). 3. Evaluate at the requested t = T." + "\n" + "PITFALL: check units (an a m/s³ coefficient times t becomes m/s²). The instant v = 0 is a turning point.");
    break; }
    case 1: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "a: m/s², v: m/s, s: m. İntegral birimi \"×s\" ile çarpar. İntegral sabitleri fiziksel olarak başlangıç hızı v₀ ve başlangıç konumu s₀'dır." + "\n" + "YÖNTEM" + "\n" + "1. v(t) = ∫a dt + v₀. 2. s(t) = ∫v dt + s₀. 3. t = T'de değerlendir." + "\n" + "TUZAK: v₀'ı unutmak yanlış sonuç verir; hız negatif olabilir (net yer değiştirme ≠ alınan yol).", "UNITS AND PHYSICAL MEANING" + "\n" + "a: m/s², v: m/s, s: m. Integrating multiplies the unit by s. The integration constants are physically the initial velocity v₀ and initial position s₀." + "\n" + "METHOD" + "\n" + "1. v(t) = ∫a dt + v₀. 2. s(t) = ∫v dt + s₀. 3. Evaluate at t = T." + "\n" + "PITFALL: forgetting v₀ gives wrong results; velocity can be negative (net displacement ≠ distance travelled).");
    break; }
    case 2: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "vₓ, v_y: m/s; g = 9,81 m/s². Yatay hareket ivmesizdir (x = vₓt); düşeyde y = v_y t − ½gt². En yüksek noktada v_düşey = 0'dır." + "\n" + "YÖNTEM" + "\n" + "1. t_tepe: y′ = v_y − gt = 0 → t = v_y/g. 2. H = y(t_tepe) = v_y²/(2g). 3. Uçuş süresi 2v_y/g, menzil R = vₓ·2v_y/g." + "\n" + "TUZAK: Hızı km/sa verilmişse m/s'ye çevirin (÷3,6); hava direnci ihmal edilmiştir.", "UNITS AND PHYSICAL MEANING" + "\n" + "vₓ, v_y: m/s; g = 9.81 m/s². Horizontal motion has no acceleration (x = vₓt); vertically y = v_y t − ½gt². At the top the vertical velocity is 0." + "\n" + "METHOD" + "\n" + "1. t_top: y′ = v_y − gt = 0 → t = v_y/g. 2. H = y(t_top) = v_y²/(2g). 3. Flight time 2v_y/g, range R = vₓ·2v_y/g." + "\n" + "PITFALL: convert km/h to m/s (÷3.6); air resistance is neglected.");
    break; }
    case 3: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "v₀ km/sa → m/s (÷3,6). v(t) = v₀ − at doğrusudur; v–t eğrisi altındaki ALAN yol (m) verir: üçgen alan = ½·v₀·t_dur." + "\n" + "YÖNTEM" + "\n" + "1. v₀'ı m/s yap. 2. Durma süresi: v = 0 → t = v₀/a. 3. s = ∫₀^t_dur v dt = v₀²/(2a)." + "\n" + "TUZAK: Mesafe v₀²/(2a) olduğundan hız iki katına çıkınca fren mesafesi DÖRT katına çıkar. İntegrali t_dur'dan öteye almayın (araç geri gitmez).", "UNITS AND PHYSICAL MEANING" + "\n" + "v₀ km/h → m/s (÷3.6). v(t) = v₀ − at is a line; the AREA under the v–t curve gives distance (m): triangle area = ½·v₀·t_stop." + "\n" + "METHOD" + "\n" + "1. Convert v₀ to m/s. 2. Stopping time: v = 0 → t = v₀/a. 3. s = ∫₀^t_stop v dt = v₀²/(2a)." + "\n" + "PITFALL: since distance = v₀²/(2a), doubling the speed makes the braking distance FOUR times longer. Do not integrate beyond t_stop (the car does not reverse).");
    break; }
    case 4: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "F = kx (N), k yay sabiti (N/m), x (m), iş W (J = N·m). İş, F–x eğrisi altındaki alandır; yayda depolanan potansiyel enerjiyi verir: W = ½kx²." + "\n" + "YÖNTEM" + "\n" + "1. F(x) = kx. 2. W = ∫₀ˣ F dx. 3. Sonucu joule olarak yaz." + "\n" + "TUZAK: x metre olmalı (cm değil); kuvvet sabit değilse W = F·x YANLIŞTIR, integral gerekir.", "UNITS AND PHYSICAL MEANING" + "\n" + "F = kx (N), spring constant k (N/m), x (m), work W (J = N·m). Work is the area under the F–x curve and equals the stored potential energy: W = ½kx²." + "\n" + "METHOD" + "\n" + "1. F(x) = kx. 2. W = ∫₀ˣ F dx. 3. State the result in joules." + "\n" + "PITFALL: x must be in metres (not cm); if the force is not constant, W = F·x is WRONG, an integral is needed.");
    break; }
    case 5: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "m kg, k N/m, ω = √(k/m) rad/s, frekans f = ω/2π (Hz), periyot T = 2π/ω (s). x(t) = A·cos(ωt + φ)." + "\n" + "YÖNTEM" + "\n" + "1. m·x″ + kx = 0 denklemini kur. 2. x″ = −ω²x olduğunu doğrula. 3. v = x′ = −Aω sin(ωt + φ), a = x″ = −ω²x. 4. Maksimum hız Aω, maksimum ivme Aω²." + "\n" + "TUZAK: ω (rad/s) ile f (Hz) karıştırılır; ivme her zaman konumun ters işaretlisidir (geri çağırıcı kuvvet).", "UNITS AND PHYSICAL MEANING" + "\n" + "m in kg, k in N/m, ω = √(k/m) rad/s, frequency f = ω/2π (Hz), period T = 2π/ω (s). x(t) = A·cos(ωt + φ)." + "\n" + "METHOD" + "\n" + "1. Set up m·x″ + kx = 0. 2. Verify x″ = −ω²x. 3. v = x′ = −Aω sin(ωt + φ), a = x″ = −ω²x. 4. Maximum speed Aω, maximum acceleration Aω²." + "\n" + "PITFALL: mixing ω (rad/s) with f (Hz); the acceleration always has the opposite sign of the displacement (restoring force).");
    break; }
    case 6: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "θ: rad, ω = θ′: rad/s, α = ω′: rad/s². Devir: n (dev/dk) = ω·60/(2π); yani ω = 2πn/60. Teğetsel hız v = ωr (m/s)." + "\n" + "YÖNTEM" + "\n" + "1. ω = dθ/dt. 2. α = dω/dt. 3. dev/dk'ya çevir: n = 60ω/(2π)." + "\n" + "TUZAK: Türev ve integral her zaman RADYAN ile çalışır; derece ya da devirle çalışmayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "θ: rad, ω = θ′: rad/s, α = ω′: rad/s². Speed n (rpm) = ω·60/(2π); i.e. ω = 2πn/60. Tangential speed v = ωr (m/s)." + "\n" + "METHOD" + "\n" + "1. ω = dθ/dt. 2. α = dω/dt. 3. Convert to rpm: n = 60ω/(2π)." + "\n" + "PITFALL: derivatives and integrals only work in RADIANS; do not use degrees or revolutions.");
    break; }
    case 7: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "P: W (J/s), E = ∫P dt: J. 1 kWh = 3,6 MJ. Güç, enerjinin değişim hızıdır (P = dE/dt); bu yüzden toplam enerji, P–t eğrisinin altındaki alandır." + "\n" + "YÖNTEM" + "\n" + "1. P(t)'yi yaz. 2. E = ∫ₜ₁^ₜ₂ P dt. 3. J'yi kWh'ye çevir (÷3,6·10⁶)." + "\n" + "TUZAK: Zaman birimi saniye olmalı; ortalama güç = E/Δt.", "UNITS AND PHYSICAL MEANING" + "\n" + "P: W (J/s), E = ∫P dt: J. 1 kWh = 3.6 MJ. Power is the rate of change of energy (P = dE/dt), so total energy is the area under the P–t curve." + "\n" + "METHOD" + "\n" + "1. Write P(t). 2. E = ∫ₜ₁^ₜ₂ P dt. 3. Convert J to kWh (÷3.6·10⁶)." + "\n" + "PITFALL: time must be in seconds; average power = E/Δt.");
    break; }
    default: {
    return "";
    break; }
    }
  }


  function MeaningBase1(p) {
    switch (p.scn) {
    case 0: {
    return tx("Kinematikte konum, hız ve ivme birbirine türevle bağlıdır: v = ds/dt ve a = dv/dt = d²s/dt². Hız, konumun değişim oranıdır; ivme de hızın değişim oranıdır. " + "Bu yüzden konum fonksiyonunu bir kez türetince hızı, iki kez türetince ivmeyi elde ederiz. " + "Matematiksel istek: s′(t) ve s″(t) ifadelerini bul, sonra t = T'de değerlendir.", "In kinematics position, velocity and acceleration are linked by derivatives: v = ds/dt and a = dv/dt = d²s/dt². Velocity is the rate of change of position; acceleration is the rate of change of velocity. " + "So one derivative of the position gives the velocity, two derivatives give the acceleration. " + "Mathematical task: find s′(t) and s″(t), then evaluate at t = T.");
    break; }
    case 1: {
    return tx("Bu, kinematiğin tersidir: a = dv/dt olduğundan hız, ivmenin İNTEGRALİDİR; v = ds/dt olduğundan konum da hızın integralidir. Her integralde bir sabit çıkar ve bu sabitler başlangıç koşullarından (v(0), s(0)) belirlenir. " + "Matematiksel istek: v = ∫a dt + C₁, s = ∫v dt + C₂; C₁ ve C₂'yi başlangıç koşullarından bul.", "This is the reverse of kinematics: since a = dv/dt, velocity is the INTEGRAL of acceleration; since v = ds/dt, position is the integral of velocity. Each integral brings a constant, fixed by the initial conditions (v(0), s(0)). " + "Mathematical task: v = ∫a dt + C₁, s = ∫v dt + C₂; find C₁ and C₂ from the initial conditions.");
    break; }
    case 2: {
    return tx("Cismin en yüksek noktasında düşey hız sıfırdır: vy = dy/dt = 0. Yani y(t)'nin TÜREVİNİ sıfıra eşitleyip tepe zamanını buluruz ve bu zamanı y(t)'de yerine koyarız. Yatay hareket sabit hızlıdır, menzil = yatay hız × uçuş süresi ve uçuş süresi y(t) = 0 denkleminin çözümüdür. " + "Matematiksel istek: y′(t) = 0 ⇒ t_tepe, H = y(t_tepe); y(t) = 0 ⇒ t_uçuş, R = vₓ·t_uçuş.", "At the highest point the vertical velocity is zero: vy = dy/dt = 0. So we set the DERIVATIVE of y(t) to zero to find the time of the peak and substitute it into y(t). The horizontal motion has constant speed, so range = horizontal speed × flight time, and flight time solves y(t) = 0. " + "Mathematical task: y′(t) = 0 ⇒ t_peak, H = y(t_peak); y(t) = 0 ⇒ t_flight, R = vₓ·t_flight.");
    break; }
    case 3: {
    return tx("Hız-zaman grafiğinin altındaki alan yer değiştirmedir, çünkü s = ∫v dt. Frende hız v(t) = v₀ − a·t doğrusudur ve araç v = 0 olduğunda durur. " + "Durma anına kadar bu doğrunun altındaki alanı (bir İNTEGRAL) hesaplarız. " + "Matematiksel istek: v(t) = 0 ⇒ t_dur, d = ∫₀^t_dur (v₀ − a t) dt.", "The area under a velocity–time graph is the displacement, because s = ∫v dt. While braking the velocity is the straight line v(t) = v₀ − a·t and the vehicle stops when v = 0. " + "We compute the area under this line up to the stopping time (an INTEGRAL). " + "Mathematical task: v(t) = 0 ⇒ t_stop, d = ∫₀^t_stop (v₀ − a t) dt.");
    break; }
    case 4: {
    return tx("İş, kuvvetin yol boyunca toplamıdır. Kuvvet sabitse W = F·Δx yeterlidir; ama yay kuvveti uzamayla değiştiği için her küçük dx'te iş dW = F(x)·dx'tir. Bütün bu küçük işlerin toplamı bir İNTEGRALDİR ve kuvvet-yer değiştirme eğrisinin altındaki alana eşittir. " + "Matematiksel istek: W = ∫ₓ₁^ₓ₂ k·x dx.", "Work is force accumulated along the path. If the force were constant, W = F·Δx would do; but a spring force changes with extension, so in each tiny dx the work is dW = F(x)·dx. Adding all these small works is an INTEGRAL and equals the area under the force–displacement curve. " + "Mathematical task: W = ∫ₓ₁^ₓ₂ k·x dx.");
    break; }
    case 5: {
    return tx("Titreşen kütlenin konumu zamanla kosinüs gibi değişir. Hız, konumun zamana göre TÜREVİDİR (v = dx/dt), ivme de hızın türevidir (a = dv/dt). Kosinüsün türevi −sinüs, sinüsün türevi kosinüs olduğundan her türevde ω çarpanı gelir. Maksimum değerler sinüs ve kosinüsün ±1 olduğu anlarda oluşur. " + "Matematiksel istek: x′(t) ve x″(t)'yi bul; genlikleri oku: v_max = Aω, a_max = Aω².", "The position of a vibrating mass varies with time like a cosine. Velocity is the DERIVATIVE of position (v = dx/dt) and acceleration is the derivative of velocity (a = dv/dt). Since the derivative of cosine is −sine and of sine is cosine, every derivative brings a factor ω. Maxima occur when sine and cosine equal ±1. " + "Mathematical task: find x′(t) and x″(t); read off the amplitudes: v_max = Aω, a_max = Aω².");
    break; }
    case 6: {
    return tx("Dönme hareketi doğrusal harekete paraleldir: açısal hız ω = dθ/dt (açının TÜREVİ) ve açısal ivme α = dω/dt = d²θ/dt² olur. Radyan/saniyeyi dev/dk'ya çevirmek için 1 devir = 2π rad ve 1 dk = 60 s bilgisi kullanılır. " + "Matematiksel istek: θ′(t) ve θ″(t)'yi bul, t = T'de değerlendir, sonra N = ω·60/(2π).", "Rotation parallels linear motion: angular velocity ω = dθ/dt (the DERIVATIVE of the angle) and angular acceleration α = dω/dt = d²θ/dt². To convert rad/s to rpm we use 1 revolution = 2π rad and 1 min = 60 s. " + "Mathematical task: find θ′(t) and θ″(t), evaluate at t = T, then N = ω·60/(2π).");
    break; }
    default: {
    return tx("Güç, enerjinin zamana göre türevidir: P = dE/dt. Bu yüzden belli bir sürede aktarılan enerji, güç-zaman eğrisinin altındaki alan yani P'nin zamana göre İNTEGRALİDİR. Güç değiştiği için P × t çarpımı yetmez. " + "Ortalama güç, toplam enerjinin süreye bölünmesidir. " + "Matematiksel istek: E = ∫₀ᵀ P(t) dt ve P_ort = E / T.", "Power is the time derivative of energy: P = dE/dt. So the energy transferred in a given time is the area under the power–time curve, i.e. the INTEGRAL of P with respect to time. Because the power changes, the product P × t is not enough. " + "Average power is the total energy divided by the duration. " + "Mathematical task: E = ∫₀ᵀ P(t) dt and P_avg = E / T.");
    break; }
    }
  }


  function Steps1(problem) {
    let x = problem.p;
    let s = [];
    switch (problem.scn) {
    case 0: {
    let a = x[0], b = x[1], c = x[2], T = x[3];
    let sv = a * T ** 3 + b * T ** 2 + c * T;
    let vv = 3 * a * T ** 2 + 2 * b * T + c;
    let av = 6 * a * T + 2 * b;
    Ad(s, `1. Değişkenler: t = zaman (s), s = konum (m), v = hız (m/s), a = ivme (m/s²). Verilen: s(t) = ${N2(a)}t³ + ${N2(b)}t² + ${N2(c)}t, T = ${N2(T)} s.`, `1. Variables: t = time (s), s = position (m), v = velocity (m/s), a = acceleration (m/s²). Given: s(t) = ${N2(a)}t³ + ${N2(b)}t² + ${N2(c)}t, T = ${N2(T)} s.`);
    Ad(s, `2. Kurulum: v = ds/dt ve a = dv/dt. Kuvvet kuralı: d(tⁿ)/dt = n·tⁿ⁻¹, sabitle çarpım türevin dışına çıkar.`, `2. Set-up: v = ds/dt and a = dv/dt. Power rule: d(tⁿ)/dt = n·tⁿ⁻¹, constants factor out of the derivative.`);
    Ad(s, `3. Hız: v(t) = d/dt [${N2(a)}t³ + ${N2(b)}t² + ${N2(c)}t] = 3·${N2(a)}t² + 2·${N2(b)}t + ${N2(c)} = ${N2(3 * a)}t² + ${N2(2 * b)}t + ${N2(c)}.`, `3. Velocity: v(t) = d/dt [${N2(a)}t³ + ${N2(b)}t² + ${N2(c)}t] = 3·${N2(a)}t² + 2·${N2(b)}t + ${N2(c)} = ${N2(3 * a)}t² + ${N2(2 * b)}t + ${N2(c)}.`);
    Ad(s, `4. İvme: a(t) = d/dt [${N2(3 * a)}t² + ${N2(2 * b)}t + ${N2(c)}] = 2·${N2(3 * a)}t + ${N2(2 * b)} = ${N2(6 * a)}t + ${N2(2 * b)}.`, `4. Acceleration: a(t) = d/dt [${N2(3 * a)}t² + ${N2(2 * b)}t + ${N2(c)}] = 2·${N2(3 * a)}t + ${N2(2 * b)} = ${N2(6 * a)}t + ${N2(2 * b)}.`);
    Ad(s, `5. Konum: s(${N2(T)}) = ${N2(a)}·${N2(T ** 3)} + ${N2(b)}·${N2(T ** 2)} + ${N2(c)}·${N2(T)} = ${N2(a * T ** 3)} + ${N2(b * T ** 2)} + ${N2(c * T)} = ${N2(sv)} m.`, `5. Position: s(${N2(T)}) = ${N2(a)}·${N2(T ** 3)} + ${N2(b)}·${N2(T ** 2)} + ${N2(c)}·${N2(T)} = ${N2(a * T ** 3)} + ${N2(b * T ** 2)} + ${N2(c * T)} = ${N2(sv)} m.`);
    Ad(s, `6. Hız: v(${N2(T)}) = ${N2(3 * a)}·${N2(T ** 2)} + ${N2(2 * b)}·${N2(T)} + ${N2(c)} = ${N2(3 * a * T ** 2)} + ${N2(2 * b * T)} + ${N2(c)} = ${N2(vv)} m/s.`, `6. Velocity: v(${N2(T)}) = ${N2(3 * a)}·${N2(T ** 2)} + ${N2(2 * b)}·${N2(T)} + ${N2(c)} = ${N2(3 * a * T ** 2)} + ${N2(2 * b * T)} + ${N2(c)} = ${N2(vv)} m/s.`);
    Ad(s, `7. İvme: a(${N2(T)}) = ${N2(6 * a)}·${N2(T)} + ${N2(2 * b)} = ${N2(6 * a * T)} + ${N2(2 * b)} = ${N2(av)} m/s².`, `7. Acceleration: a(${N2(T)}) = ${N2(6 * a)}·${N2(T)} + ${N2(2 * b)} = ${N2(6 * a * T)} + ${N2(2 * b)} = ${N2(av)} m/s².`);
    Ad(s, `8. Birim kontrolü: (m/s³)·s² = m/s ✓ ve (m/s³)·s = m/s² ✓. Mantık kontrolü: tüm katsayılar pozitif olduğundan konum, hız ve ivme sürekli artar; a > 0 olduğu için hız artar ✓.`, `8. Unit check: (m/s³)·s² = m/s ✓ and (m/s³)·s = m/s² ✓. Sanity check: all coefficients are positive, so position, velocity and acceleration keep growing; a > 0 means the speed is increasing ✓.`);
    Ad(s, `9. Yorum: t = ${N2(T)} s'de parçacık başlangıçtan ${N2(sv)} m uzakta, ${N2(vv)} m/s hızla gidiyor ve hâlâ ${N2(av)} m/s² ile hızlanıyor. Grafik s(t) eğrisini, v(t) ve a(t) ile birlikte gösterir; altın işaret v(T)'dir.`, `9. Interpretation: at t = ${N2(T)} s the particle is ${N2(sv)} m from the start, moving at ${N2(vv)} m/s and still speeding up at ${N2(av)} m/s². The graph shows s(t) with v(t) and a(t); the gold marker is v(T).`);
    break; }
    case 1: {
    let q = x[0], pp = x[1], v0 = x[2], T = x[3];
    let vT = pp * T ** 2 / 2 + q * T + v0;
    let sT = pp * T ** 3 / 6 + q * T ** 2 / 2 + v0 * T;
    Ad(s, `1. Değişkenler: t (s), a(t) = ${N2(pp)}t + ${N2(q)} (m/s²), v(0) = ${N2(v0)} m/s, s(0) = 0, T = ${N2(T)} s.`, `1. Variables: t (s), a(t) = ${N2(pp)}t + ${N2(q)} (m/s²), v(0) = ${N2(v0)} m/s, s(0) = 0, T = ${N2(T)} s.`);
    Ad(s, `2. Kurulum: a = dv/dt ⇒ v = ∫a dt ; v = ds/dt ⇒ s = ∫v dt.`, `2. Set-up: a = dv/dt ⇒ v = ∫a dt ; v = ds/dt ⇒ s = ∫v dt.`);
    Ad(s, `3. Hız integrali: v(t) = ∫(${N2(pp)}t + ${N2(q)}) dt = ${N2(pp)}·t²/2 + ${N2(q)}t + C₁ = ${N2(pp / 2)}t² + ${N2(q)}t + C₁.`, `3. Velocity integral: v(t) = ∫(${N2(pp)}t + ${N2(q)}) dt = ${N2(pp)}·t²/2 + ${N2(q)}t + C₁ = ${N2(pp / 2)}t² + ${N2(q)}t + C₁.`);
    Ad(s, `4. Başlangıç koşulu: v(0) = C₁ = ${N2(v0)} ⇒ v(t) = ${N2(pp / 2)}t² + ${N2(q)}t + ${N2(v0)}.`, `4. Initial condition: v(0) = C₁ = ${N2(v0)} ⇒ v(t) = ${N2(pp / 2)}t² + ${N2(q)}t + ${N2(v0)}.`);
    Ad(s, `5. Konum integrali: s(t) = ∫(${N2(pp / 2)}t² + ${N2(q)}t + ${N2(v0)}) dt = ${N2(pp / 2)}·t³/3 + ${N2(q)}·t²/2 + ${N2(v0)}t + C₂ = ${N2(pp / 6)}t³ + ${N2(q / 2)}t² + ${N2(v0)}t + C₂.`, `5. Position integral: s(t) = ∫(${N2(pp / 2)}t² + ${N2(q)}t + ${N2(v0)}) dt = ${N2(pp / 2)}·t³/3 + ${N2(q)}·t²/2 + ${N2(v0)}t + C₂ = ${N2(pp / 6)}t³ + ${N2(q / 2)}t² + ${N2(v0)}t + C₂.`);
    Ad(s, `6. s(0) = 0 ⇒ C₂ = 0, yani s(t) = ${N2(pp / 6)}t³ + ${N2(q / 2)}t² + ${N2(v0)}t.`, `6. s(0) = 0 ⇒ C₂ = 0, so s(t) = ${N2(pp / 6)}t³ + ${N2(q / 2)}t² + ${N2(v0)}t.`);
    Ad(s, `7. t = ${N2(T)} s: v = ${N2(pp / 2)}·${N2(T ** 2)} + ${N2(q)}·${N2(T)} + ${N2(v0)} = ${N2(pp * T ** 2 / 2)} + ${N2(q * T)} + ${N2(v0)} = ${N2(vT)} m/s ; s = ${N2(pp / 6)}·${N2(T ** 3)} + ${N2(q / 2)}·${N2(T ** 2)} + ${N2(v0)}·${N2(T)} = ${N2(pp * T ** 3 / 6)} + ${N2(q * T ** 2 / 2)} + ${N2(v0 * T)} = ${N2(sT)} m.`, `7. At t = ${N2(T)} s: v = ${N2(pp / 2)}·${N2(T ** 2)} + ${N2(q)}·${N2(T)} + ${N2(v0)} = ${N2(pp * T ** 2 / 2)} + ${N2(q * T)} + ${N2(v0)} = ${N2(vT)} m/s ; s = ${N2(pp / 6)}·${N2(T ** 3)} + ${N2(q / 2)}·${N2(T ** 2)} + ${N2(v0)}·${N2(T)} = ${N2(pp * T ** 3 / 6)} + ${N2(q * T ** 2 / 2)} + ${N2(v0 * T)} = ${N2(sT)} m.`);
    Ad(s, `8. Geri türev kontrolü: s′(t) = ${N2(pp / 2)}t² + ${N2(q)}t + ${N2(v0)} = v(t) ✓ ve v′(t) = ${N2(pp)}t + ${N2(q)} = a(t) ✓. Birim: (m/s³)·s³ = m ✓. Mantık: hız pozitif ve artıyor, dolayısıyla konum da artmalıdır ✓.`, `8. Back-differentiation check: s′(t) = ${N2(pp / 2)}t² + ${N2(q)}t + ${N2(v0)} = v(t) ✓ and v′(t) = ${N2(pp)}t + ${N2(q)} = a(t) ✓. Units: (m/s³)·s³ = m ✓. Sanity: velocity is positive and growing, so position must grow ✓.`);
    Ad(s, `9. Yorum: ${N2(T)} s sonunda araç ${N2(sT)} m yol almış ve ${N2(vT)} m/s (${N2(vT * 3.6)} km/sa) hıza ulaşmıştır. Grafikte gölgeli alan v(t) altındaki alandır ve ∫v dt = yol olduğundan konumun artışını gösterir.`, `9. Interpretation: after ${N2(T)} s the car has covered ${N2(sT)} m and reached ${N2(vT)} m/s (${N2(vT * 3.6)} km/h). On the graph the shaded area under v(t) is ∫v dt = distance travelled.`);
    break; }
    case 2: {
    let vx = x[0], vy = x[1];
    let tp = vy / 10, h = vy * vy / 20, tf = vy / 5, r = vx * vy / 5;
    Ad(s, `1. Değişkenler: vₓ = ${N2(vx)} m/s (sabit), y(t) = ${N2(vy)}t − 5t² (m), g = 10 m/s², H = maksimum yükseklik (m), R = menzil (m).`, `1. Variables: vₓ = ${N2(vx)} m/s (constant), y(t) = ${N2(vy)}t − 5t² (m), g = 10 m/s², H = maximum height (m), R = range (m).`);
    Ad(s, `2. Düşey hız: v_y = dy/dt = ${N2(vy)} − 10t (m/s).`, `2. Vertical velocity: v_y = dy/dt = ${N2(vy)} − 10t (m/s).`);
    Ad(s, `3. Tepe noktasında v_y = 0: ${N2(vy)} − 10t = 0 ⇒ t_tepe = ${N2(vy)}/10 = ${N2(tp)} s.`, `3. At the peak v_y = 0: ${N2(vy)} − 10t = 0 ⇒ t_peak = ${N2(vy)}/10 = ${N2(tp)} s.`);
    Ad(s, `4. İkinci türev: d²y/dt² = −10 < 0 ⇒ bu nokta gerçekten maksimumdur ✓.`, `4. Second derivative: d²y/dt² = −10 < 0 ⇒ the point is a true maximum ✓.`);
    Ad(s, `5. Maksimum yükseklik: H = y(${N2(tp)}) = ${N2(vy)}·${N2(tp)} − 5·(${N2(tp)})² = ${N2(vy * tp)} − ${N2(5 * tp * tp)} = ${N2(h)} m (kısa yol: v_y²/(2g) = ${N2(vy * vy)}/20).`, `5. Maximum height: H = y(${N2(tp)}) = ${N2(vy)}·${N2(tp)} − 5·(${N2(tp)})² = ${N2(vy * tp)} − ${N2(5 * tp * tp)} = ${N2(h)} m (shortcut: v_y²/(2g) = ${N2(vy * vy)}/20).`);
    Ad(s, `6. Uçuş süresi: y(t) = t·(${N2(vy)} − 5t) = 0 ⇒ t = 0 (fırlatma) ya da t = ${N2(vy)}/5 = ${N2(tf)} s (yere düşüş; tepe süresinin iki katı ✓).`, `6. Flight time: y(t) = t·(${N2(vy)} − 5t) = 0 ⇒ t = 0 (launch) or t = ${N2(vy)}/5 = ${N2(tf)} s (landing; twice the peak time ✓).`);
    Ad(s, `7. Menzil: R = vₓ·t_uçuş = ${N2(vx)}·${N2(tf)} = ${N2(r)} m.`, `7. Range: R = vₓ·t_flight = ${N2(vx)}·${N2(tf)} = ${N2(r)} m.`);
    Ad(s, `8. Birim kontrolü: m/s·s = m ✓ ve (m/s)²/(m/s²) = m ✓. Tepenin yatay konumu vₓ·t_tepe = ${N2(vx * tp)} m = R/2 ✓ (yörünge simetriktir).`, `8. Unit check: m/s·s = m ✓ and (m/s)²/(m/s²) = m ✓. Horizontal position of the peak vₓ·t_peak = ${N2(vx * tp)} m = R/2 ✓ (the path is symmetric).`);
    Ad(s, `9. Yorum: cisim ${N2(tp)} s'de ${N2(h)} m'ye çıkar, toplam ${N2(tf)} s havada kalır ve ${N2(r)} m uzağa düşer. Grafik y(x) yörüngesini gösterir; altın işaret tepe noktasıdır ve menzilin tam ortasındadır.`, `9. Interpretation: the body rises to ${N2(h)} m in ${N2(tp)} s, stays airborne ${N2(tf)} s and lands ${N2(r)} m away. The graph shows the path y(x); the gold marker is the peak, exactly halfway along the range.`);
    break; }
    case 3: {
    let kmh = x[0], a = x[1];
    let v0 = kmh / 3.6, ts = v0 / a, d = v0 * v0 / (2 * a);
    Ad(s, `1. Değişkenler: v₀ = ${N2(kmh)} km/sa = ${N2(kmh)}/3.6 = ${N2(v0)} m/s, a = ${N2(a)} m/s² (yavaşlama), t_dur (s), d = fren mesafesi (m).`, `1. Variables: v₀ = ${N2(kmh)} km/h = ${N2(kmh)}/3.6 = ${N2(v0)} m/s, a = ${N2(a)} m/s² (deceleration), t_stop (s), d = braking distance (m).`);
    Ad(s, `2. Hız fonksiyonu: sabit yavaşlamada dv/dt = −${N2(a)} ⇒ v(t) = ${N2(v0)} − ${N2(a)}t.`, `2. Velocity function: with constant deceleration dv/dt = −${N2(a)} ⇒ v(t) = ${N2(v0)} − ${N2(a)}t.`);
    Ad(s, `3. Durma zamanı: v(t) = 0 ⇒ ${N2(v0)} − ${N2(a)}t = 0 ⇒ t_dur = ${N2(v0)}/${N2(a)} = ${N2(ts)} s.`, `3. Stopping time: v(t) = 0 ⇒ ${N2(v0)} − ${N2(a)}t = 0 ⇒ t_stop = ${N2(v0)}/${N2(a)} = ${N2(ts)} s.`);
    Ad(s, `4. Yol = v–t eğrisi altındaki alan: d = ∫₀^${N2(ts)} (${N2(v0)} − ${N2(a)}t) dt.`, `4. Distance = area under the v–t curve: d = ∫₀^${N2(ts)} (${N2(v0)} − ${N2(a)}t) dt.`);
    Ad(s, `5. Ters türev: ∫(${N2(v0)} − ${N2(a)}t) dt = ${N2(v0)}t − ${N2(a / 2)}t².`, `5. Antiderivative: ∫(${N2(v0)} − ${N2(a)}t) dt = ${N2(v0)}t − ${N2(a / 2)}t².`);
    Ad(s, `6. Sınırlar: d = [${N2(v0)}·${N2(ts)} − ${N2(a / 2)}·(${N2(ts)})²] − [0] = ${N2(v0 * ts)} − ${N2(a / 2 * ts * ts)}.`, `6. Limits: d = [${N2(v0)}·${N2(ts)} − ${N2(a / 2)}·(${N2(ts)})²] − [0] = ${N2(v0 * ts)} − ${N2(a / 2 * ts * ts)}.`);
    Ad(s, `7. Sonuç: d = ${N2(d)} m.`, `7. Result: d = ${N2(d)} m.`);
    Ad(s, `8. Kontrol: üçgen alanı ½·taban·yükseklik = ½·${N2(ts)}·${N2(v0)} = ${N2(d)} m ✓ ; formül d = v₀²/(2a) = ${N2(v0 * v0)}/${N2(2 * a)} = ${N2(d)} ✓. Birim: (m/s)²/(m/s²) = m ✓. Yol = ortalama hız × süre: ${N2(v0 / 2)}·${N2(ts)} ✓.`, `8. Check: triangle area ½·base·height = ½·${N2(ts)}·${N2(v0)} = ${N2(d)} m ✓ ; formula d = v₀²/(2a) = ${N2(v0 * v0)}/${N2(2 * a)} = ${N2(d)} ✓. Units: (m/s)²/(m/s²) = m ✓. Distance is average speed × time: ${N2(v0 / 2)}·${N2(ts)} ✓.`);
    Ad(s, `9. Yorum: araç ${N2(ts)} s'de durur ve ${N2(d)} m yol alır. d ∝ v₀²: hızı iki katına çıkarmak fren mesafesini 4 katına çıkarır; bu yüzden hız sınırları önemlidir. Grafikte gölgeli üçgen fren mesafesidir.`, `9. Interpretation: the vehicle stops in ${N2(ts)} s covering ${N2(d)} m. d ∝ v₀²: doubling the speed quadruples the braking distance, which is why speed limits matter. The shaded triangle on the graph is the braking distance.`);
    break; }
    case 4: {
    let k = x[0], x1 = x[1], x2 = x[2];
    let w = k / 2 * (x2 * x2 - x1 * x1);
    Ad(s, `1. Değişkenler: x = yayın uzaması (m), F(x) = ${N2(k)}x (N), x₁ = ${N2(x1)} m, x₂ = ${N2(x2)} m, W = iş (J = N·m).`, `1. Variables: x = spring extension (m), F(x) = ${N2(k)}x (N), x₁ = ${N2(x1)} m, x₂ = ${N2(x2)} m, W = work (J = N·m).`);
    Ad(s, `2. Küçük iş: dW = F(x)·dx = ${N2(k)}x dx. Toplam iş bunların toplamıdır.`, `2. Small work: dW = F(x)·dx = ${N2(k)}x dx. The total work is the sum of these.`);
    Ad(s, `3. İntegral: W = ∫ (${N2(x1)} ile ${N2(x2)} arası) ${N2(k)}x dx.`, `3. Integral: W = ∫ (from ${N2(x1)} to ${N2(x2)}) ${N2(k)}x dx.`);
    Ad(s, `4. Ters türev: ∫${N2(k)}x dx = ${N2(k)}·x²/2 = ${N2(k / 2)}x².`, `4. Antiderivative: ∫${N2(k)}x dx = ${N2(k)}·x²/2 = ${N2(k / 2)}x².`);
    Ad(s, `5. Üst sınır: ${N2(k / 2)}·(${N2(x2)})² = ${N2(k / 2)}·${N2(x2 * x2)} = ${N2(k / 2 * x2 * x2)} J.`, `5. Upper limit: ${N2(k / 2)}·(${N2(x2)})² = ${N2(k / 2)}·${N2(x2 * x2)} = ${N2(k / 2 * x2 * x2)} J.`);
    Ad(s, `6. Alt sınır: ${N2(k / 2)}·(${N2(x1)})² = ${N2(k / 2)}·${N2(x1 * x1)} = ${N2(k / 2 * x1 * x1)} J.`, `6. Lower limit: ${N2(k / 2)}·(${N2(x1)})² = ${N2(k / 2)}·${N2(x1 * x1)} = ${N2(k / 2 * x1 * x1)} J.`);
    Ad(s, `7. Fark: W = ${N2(k / 2 * x2 * x2)} − ${N2(k / 2 * x1 * x1)} = ${N2(w)} J.`, `7. Difference: W = ${N2(k / 2 * x2 * x2)} − ${N2(k / 2 * x1 * x1)} = ${N2(w)} J.`);
    Ad(s, `8. Kontrol (yamuk alanı): ½·(F₁ + F₂)·Δx = ½·(${N2(k * x1)} + ${N2(k * x2)})·${N2(x2 - x1)} = ${N2(w)} J ✓. Birim: N/m·m² = N·m = J ✓.`, `8. Check (trapezium area): ½·(F₁ + F₂)·Δx = ½·(${N2(k * x1)} + ${N2(k * x2)})·${N2(x2 - x1)} = ${N2(w)} J ✓. Units: N/m·m² = N·m = J ✓.`);
    Ad(s, `9. Yorum: yayda depolanan enerji ½kx² olduğundan yapılan iş, iki durumdaki enerji farkına eşittir. Kuvvet ${N2(k * x1)} N'dan ${N2(k * x2)} N'a arttığı için W, ortalama kuvvet × yol'dur. Grafikte gölgeli yamuk ${N2(w)} J'dür.`, `9. Interpretation: since the stored spring energy is ½kx², the work equals the energy difference between the two states. Because the force rises from ${N2(k * x1)} N to ${N2(k * x2)} N, W is the average force × distance. The shaded trapezium on the graph is ${N2(w)} J.`);
    break; }
    case 5: {
    let m = x[0], w = x[1], a = x[2];
    let vmax = a * w, amax = a * w * w, k = m * w * w;
    let per = 2 * Math.PI / w;
    Ad(s, `1. Değişkenler: x(t) = A·cos(ωt) (m), m = ${N2(m)} kg, ω = ${N2(w)} rad/s, A = ${N2(a)} m, k = yay sabiti (N/m).`, `1. Variables: x(t) = A·cos(ωt) (m), m = ${N2(m)} kg, ω = ${N2(w)} rad/s, A = ${N2(a)} m, k = spring constant (N/m).`);
    Ad(s, `2. Kurulum: v = dx/dt, a = dv/dt. Zincir kuralı: d/dt cos(ωt) = −ω·sin(ωt), d/dt sin(ωt) = ω·cos(ωt).`, `2. Set-up: v = dx/dt, a = dv/dt. Chain rule: d/dt cos(ωt) = −ω·sin(ωt), d/dt sin(ωt) = ω·cos(ωt).`);
    Ad(s, `3. Hız: v(t) = d/dt [${N2(a)}·cos(${N2(w)}t)] = −${N2(a)}·${N2(w)}·sin(${N2(w)}t) = −${N2(vmax)}·sin(${N2(w)}t) m/s.`, `3. Velocity: v(t) = d/dt [${N2(a)}·cos(${N2(w)}t)] = −${N2(a)}·${N2(w)}·sin(${N2(w)}t) = −${N2(vmax)}·sin(${N2(w)}t) m/s.`);
    Ad(s, `4. İvme: a(t) = d/dt [−${N2(vmax)}·sin(${N2(w)}t)] = −${N2(vmax)}·${N2(w)}·cos(${N2(w)}t) = −${N2(amax)}·cos(${N2(w)}t) m/s².`, `4. Acceleration: a(t) = d/dt [−${N2(vmax)}·sin(${N2(w)}t)] = −${N2(vmax)}·${N2(w)}·cos(${N2(w)}t) = −${N2(amax)}·cos(${N2(w)}t) m/s².`);
    Ad(s, `5. Maksimum hız: |sin| = 1 iken v_max = A·ω = ${N2(a)}·${N2(w)} = ${N2(vmax)} m/s ; bu, kütle denge konumundan (x = 0) geçerken olur.`, `5. Maximum speed: when |sin| = 1, v_max = A·ω = ${N2(a)}·${N2(w)} = ${N2(vmax)} m/s ; this happens as the mass passes the equilibrium position (x = 0).`);
    Ad(s, `6. Maksimum ivme: |cos| = 1 iken a_max = A·ω² = ${N2(a)}·${N2(w * w)} = ${N2(amax)} m/s² ; bu, uç noktalarda (x = ±A) olur. Ayrıca a = −ω²·x ilişkisi vardır.`, `6. Maximum acceleration: when |cos| = 1, a_max = A·ω² = ${N2(a)}·${N2(w * w)} = ${N2(amax)} m/s² ; this happens at the extremes (x = ±A). Note also a = −ω²·x.`);
    Ad(s, `7. Yay sabiti ve periyot: k = m·ω² = ${N2(m)}·${N2(w * w)} = ${N2(k)} N/m ; periyot T = 2π/ω = ${N2(per)} s ; en büyük yay kuvveti k·A = ${N2(k * a)} N = m·a_max = ${N2(m * amax)} N ✓ (Newton yasası).`, `7. Spring constant and period: k = m·ω² = ${N2(m)}·${N2(w * w)} = ${N2(k)} N/m ; period T = 2π/ω = ${N2(per)} s ; the largest spring force k·A = ${N2(k * a)} N = m·a_max = ${N2(m * amax)} N ✓ (Newton's law).`);
    Ad(s, `8. Birim kontrolü: m·(rad/s) = m/s ✓, m·(rad/s)² = m/s² ✓ (rad boyutsuzdur). Enerji: ½·m·v_max² = ${N2(0.5 * m * vmax * vmax)} J = ½·k·A² = ${N2(0.5 * k * a * a)} J ✓ (enerji korunur).`, `8. Unit check: m·(rad/s) = m/s ✓, m·(rad/s)² = m/s² ✓ (rad is dimensionless). Energy: ½·m·v_max² = ${N2(0.5 * m * vmax * vmax)} J = ½·k·A² = ${N2(0.5 * k * a * a)} J ✓ (energy is conserved).`);
    Ad(s, `9. Yorum: konum ve ivme zıt işaretlidir (yay hep geri çeker); hız ve konum ise 90° faz farklıdır (T/4). Titreşim ${N2(per)} s'de bir tekrarlar. Grafikte x(t) ve v(t) gösterilir; altın işaret ilk maksimum hız anıdır.`, `9. Interpretation: position and acceleration have opposite signs (the spring always pulls back); velocity and position are 90° out of phase (T/4). The motion repeats every ${N2(per)} s. The graph shows x(t) and v(t); the gold marker is the first maximum-speed instant.`);
    break; }
    case 6: {
    let a = x[0], b = x[1], T = x[2];
    let th = a * T * T + b * T, w = 2 * a * T + b, al = 2 * a;
    let rpm = w * 60 / (2 * Math.PI), rev = th / (2 * Math.PI);
    Ad(s, `1. Değişkenler: θ(t) = ${N2(a)}t² + ${N2(b)}t (rad), ω = açısal hız (rad/s), α = açısal ivme (rad/s²), N = dev/dk, T = ${N2(T)} s.`, `1. Variables: θ(t) = ${N2(a)}t² + ${N2(b)}t (rad), ω = angular velocity (rad/s), α = angular acceleration (rad/s²), N = rpm, T = ${N2(T)} s.`);
    Ad(s, `2. Kurulum: ω = dθ/dt ve α = dω/dt.`, `2. Set-up: ω = dθ/dt and α = dω/dt.`);
    Ad(s, `3. Açısal hız: ω(t) = d/dt [${N2(a)}t² + ${N2(b)}t] = 2·${N2(a)}t + ${N2(b)} = ${N2(2 * a)}t + ${N2(b)}.`, `3. Angular velocity: ω(t) = d/dt [${N2(a)}t² + ${N2(b)}t] = 2·${N2(a)}t + ${N2(b)} = ${N2(2 * a)}t + ${N2(b)}.`);
    Ad(s, `4. Açısal ivme: α(t) = d/dt [${N2(2 * a)}t + ${N2(b)}] = ${N2(2 * a)} rad/s² (sabit).`, `4. Angular acceleration: α(t) = d/dt [${N2(2 * a)}t + ${N2(b)}] = ${N2(2 * a)} rad/s² (constant).`);
    Ad(s, `5. t = ${N2(T)} s: ω = ${N2(2 * a)}·${N2(T)} + ${N2(b)} = ${N2(2 * a * T)} + ${N2(b)} = ${N2(w)} rad/s.`, `5. At t = ${N2(T)} s: ω = ${N2(2 * a)}·${N2(T)} + ${N2(b)} = ${N2(2 * a * T)} + ${N2(b)} = ${N2(w)} rad/s.`);
    Ad(s, `6. Dev/dk dönüşümü: 1 dev = 2π rad, 1 dk = 60 s ⇒ N = ω·60/(2π) = ${N2(w)}·60/${N2(2 * Math.PI)} = ${N2(rpm)} dev/dk.`, `6. Rpm conversion: 1 rev = 2π rad, 1 min = 60 s ⇒ N = ω·60/(2π) = ${N2(w)}·60/${N2(2 * Math.PI)} = ${N2(rpm)} rpm.`);
    Ad(s, `7. Toplam dönme: θ(${N2(T)}) = ${N2(a)}·${N2(T * T)} + ${N2(b)}·${N2(T)} = ${N2(th)} rad = ${N2(th)}/(2π) = ${N2(rev)} devir.`, `7. Total rotation: θ(${N2(T)}) = ${N2(a)}·${N2(T * T)} + ${N2(b)}·${N2(T)} = ${N2(th)} rad = ${N2(th)}/(2π) = ${N2(rev)} revolutions.`);
    Ad(s, `8. Birim kontrolü: rad/s²·s = rad/s ✓ ; (rad/s)·(60 s/dk)/(2π rad/dev) = dev/dk ✓. Kontrol: ω, α'nın integralidir: ∫₀^${N2(T)} ${N2(2 * a)} dt + ${N2(b)} = ${N2(2 * a * T)} + ${N2(b)} = ${N2(w)} ✓.`, `8. Unit check: rad/s²·s = rad/s ✓ ; (rad/s)·(60 s/min)/(2π rad/rev) = rev/min ✓. Check: ω is the integral of α: ∫₀^${N2(T)} ${N2(2 * a)} dt + ${N2(b)} = ${N2(2 * a * T)} + ${N2(b)} = ${N2(w)} ✓.`);
    Ad(s, `9. Yorum: mil sabit ${N2(al)} rad/s² ile hızlanıyor; ${N2(T)} s sonunda ${N2(rpm)} dev/dk'ya ulaşıyor ve ${N2(rev)} devir atmış oluyor. Grafik θ(t) ve ω(t)'yi gösterir; altın işaret ω(T)'dir.`, `9. Interpretation: the shaft speeds up steadily at ${N2(al)} rad/s²; after ${N2(T)} s it turns at ${N2(rpm)} rpm and has made ${N2(rev)} revolutions. The graph shows θ(t) and ω(t); the gold marker is ω(T).`);
    break; }
    default: {
    let p0 = x[0], k = x[1], T = x[2];
    let pT = p0 + k * T, e = p0 * T + k * T * T / 2, pa = e / T;
    Ad(s, `1. Değişkenler: t (s), P(t) = ${N2(p0)} + ${N2(k)}t (kW), E = enerji (kJ, çünkü kW·s = kJ), T = ${N2(T)} s.`, `1. Variables: t (s), P(t) = ${N2(p0)} + ${N2(k)}t (kW), E = energy (kJ, since kW·s = kJ), T = ${N2(T)} s.`);
    Ad(s, `2. P = dE/dt ⇒ dE = P dt ⇒ E = ∫₀^${N2(T)} P(t) dt.`, `2. P = dE/dt ⇒ dE = P dt ⇒ E = ∫₀^${N2(T)} P(t) dt.`);
    Ad(s, `3. İntegral: E = ∫₀^${N2(T)} (${N2(p0)} + ${N2(k)}t) dt.`, `3. Integral: E = ∫₀^${N2(T)} (${N2(p0)} + ${N2(k)}t) dt.`);
    Ad(s, `4. Ters türev: ∫(${N2(p0)} + ${N2(k)}t) dt = ${N2(p0)}t + ${N2(k)}·t²/2 = ${N2(p0)}t + ${N2(k / 2)}t².`, `4. Antiderivative: ∫(${N2(p0)} + ${N2(k)}t) dt = ${N2(p0)}t + ${N2(k)}·t²/2 = ${N2(p0)}t + ${N2(k / 2)}t².`);
    Ad(s, `5. Üst sınır t = ${N2(T)}: ${N2(p0)}·${N2(T)} + ${N2(k / 2)}·${N2(T * T)} = ${N2(p0 * T)} + ${N2(k * T * T / 2)}.`, `5. Upper limit t = ${N2(T)}: ${N2(p0)}·${N2(T)} + ${N2(k / 2)}·${N2(T * T)} = ${N2(p0 * T)} + ${N2(k * T * T / 2)}.`);
    Ad(s, `6. Alt sınır t = 0: ${N2(p0)}·0 + ${N2(k / 2)}·0 = 0. Fark: E = ${N2(e)} kJ.`, `6. Lower limit t = 0: ${N2(p0)}·0 + ${N2(k / 2)}·0 = 0. Difference: E = ${N2(e)} kJ.`);
    Ad(s, `7. Ortalama güç: P_ort = E/T = ${N2(e)}/${N2(T)} = ${N2(pa)} kW. Son güç: P(${N2(T)}) = ${N2(p0)} + ${N2(k)}·${N2(T)} = ${N2(pT)} kW.`, `7. Average power: P_avg = E/T = ${N2(e)}/${N2(T)} = ${N2(pa)} kW. Final power: P(${N2(T)}) = ${N2(p0)} + ${N2(k)}·${N2(T)} = ${N2(pT)} kW.`);
    Ad(s, `8. Kontrol (yamuk): ½·(P₀ + P_son)·T = ½·(${N2(p0)} + ${N2(pT)})·${N2(T)} = ${N2(e)} kJ ✓ ; ortalama güç, ilk ve son gücün ortasıdır: (${N2(p0)} + ${N2(pT)})/2 = ${N2(pa)} ✓. Birim: kW·s = kJ ✓.`, `8. Check (trapezium): ½·(P₀ + P_end)·T = ½·(${N2(p0)} + ${N2(pT)})·${N2(T)} = ${N2(e)} kJ ✓ ; the average power is the mean of the first and last values: (${N2(p0)} + ${N2(pT)})/2 = ${N2(pa)} ✓. Units: kW·s = kJ ✓.`);
    Ad(s, `9. Yorum: motor ${N2(T)} s'de ${N2(e)} kJ (${N2(e / 3600)} kWh) enerji aktarır. Güç arttığı için son güç ortalamanın üstündedir. Grafikte gölgeli yamuk toplam enerjiyi gösterir.`, `9. Interpretation: the motor delivers ${N2(e)} kJ (${N2(e / 3600)} kWh) in ${N2(T)} s. Because the power grows, the final power is above the average. The shaded trapezium on the graph is the total energy.`);
    break; }
    }
    return s;
  }


  function draw1(canvas, problem) {
    let x = problem.p;
    let accent = canvas.accent();
    switch (problem.scn) {
    case 0: {
    let a = x[0], b = x[1], c = x[2], T = x[3];
    let tmax = 1.5 * T;
    let fs = (u) => (u < 0 || u > tmax ? NaN : a * u ** 3 + b * u ** 2 + c * u);
    let fv = (u) => (u < 0 || u > tmax ? NaN : 3 * a * u ** 2 + 2 * b * u + c);
    let fa = (u) => (u < 0 || u > tmax ? NaN : 6 * a * u + 2 * b);
    let top = a * tmax ** 3 + b * tmax ** 2 + c * tmax;
    canvas.setViewport(-tmax * 0.1, tmax * 1.1, -top * 0.1, top * 1.15);
    Curve(canvas, fs, accent);
    Curve(canvas, fv, canvas.orange());
    Curve(canvas, fa, canvas.red());
    canvas.addGuideLine({ axis: 'vertical', position: T, color: canvas.gray(), label: `t = ${N2(T)}` });
    Mark(canvas, T, fv(T), `v = ${N2(fv(T))} m/s`);
    break; }
    case 1: {
    let q = x[0], pp = x[1], v0 = x[2], T = x[3];
    let tmax = 1.3 * T;
    let fa = (u) => (u < 0 || u > tmax ? NaN : pp * u + q);
    let fv = (u) => (u < 0 || u > tmax ? NaN : pp * u * u / 2 + q * u + v0);
    let fs = (u) => (u < 0 || u > tmax ? NaN : pp * u ** 3 / 6 + q * u * u / 2 + v0 * u);
    let top = fs(tmax);
    canvas.setViewport(-tmax * 0.1, tmax * 1.1, -top * 0.1, top * 1.15);
    Shade(canvas, fv, 0, T, canvas.blue());
    Curve(canvas, fs, accent);
    Curve(canvas, fv, canvas.orange());
    Curve(canvas, fa, canvas.red());
    Mark(canvas, T, fs(T), `s(${N2(T)}) = ${N2(fs(T))} m`);
    break; }
    case 2: {
    let vx = x[0], vy = x[1];
    let r = vx * vy / 5, h = vy * vy / 20;
    let f = (u) => (u < 0 || u > r ? NaN : vy / vx * u - 5 * u * u / (vx * vx));
    canvas.setViewport(-r * 0.1, r * 1.1, -h * 0.25, h * 1.5);
    Shade(canvas, f, 0, r, canvas.blue());
    Curve(canvas, f, accent);
    canvas.addGuideLine({ axis: 'vertical', position: r, color: canvas.gray(), label: `R = ${N2(r)} m` });
    Mark(canvas, r / 2, h, `H = ${N2(h)} m`);
    break; }
    case 3: {
    let v0 = x[0] / 3.6, a = x[1];
    let ts = v0 / a;
    let f = (u) => (u < 0 || u > ts ? NaN : v0 - a * u);
    canvas.setViewport(-ts * 0.1, ts * 1.2, -v0 * 0.15, v0 * 1.25);
    Shade(canvas, f, 0, ts, canvas.blue());
    Curve(canvas, f, accent);
    Mark(canvas, ts, 0, `d = ${N2(v0 * v0 / (2 * a))} m`);
    break; }
    case 4: {
    let k = x[0], x1 = x[1], x2 = x[2];
    let f = (u) => (u < 0 || u > x2 * 1.2 ? NaN : k * u);
    let top = k * x2 * 1.2;
    canvas.setViewport(-x2 * 0.1, x2 * 1.3, -top * 0.1, top * 1.15);
    Shade(canvas, f, x1, x2, canvas.blue());
    Curve(canvas, f, accent);
    Mark(canvas, x2, k * x2, `W = ${N2(k / 2 * (x2 * x2 - x1 * x1))} J`);
    break; }
    case 5: {
    let w = x[1], a = x[2];
    let tmax = 4 * Math.PI / w;
    let fx = (u) => (u < 0 || u > tmax ? NaN : a * Math.cos(w * u));
    let fv = (u) => (u < 0 || u > tmax ? NaN : -a * w * Math.sin(w * u));
    let top = a * w;
    canvas.setViewport(-tmax * 0.08, tmax * 1.08, -top * 1.3, top * 1.4);
    Curve(canvas, fx, accent);
    Curve(canvas, fv, canvas.orange());
    Mark(canvas, Math.PI / (2 * w), -top, `v_max = ${N2(a * w)} m/s`);
    break; }
    case 6: {
    let a = x[0], b = x[1], T = x[2];
    let tmax = 1.3 * T;
    let fth = (u) => (u < 0 || u > tmax ? NaN : a * u * u + b * u);
    let fw = (u) => (u < 0 || u > tmax ? NaN : 2 * a * u + b);
    let top = fth(tmax);
    canvas.setViewport(-tmax * 0.1, tmax * 1.1, -top * 0.1, top * 1.15);
    Curve(canvas, fth, accent);
    Curve(canvas, fw, canvas.orange());
    canvas.addGuideLine({ axis: 'vertical', position: T, color: canvas.gray(), label: `t = ${N2(T)}` });
    Mark(canvas, T, fw(T), `ω = ${N2(fw(T))} rad/s`);
    break; }
    default: {
    let p0 = x[0], k = x[1], T = x[2];
    let tmax = 1.2 * T;
    let f = (u) => (u < 0 || u > tmax ? NaN : p0 + k * u);
    let top = p0 + k * tmax;
    canvas.setViewport(-tmax * 0.1, tmax * 1.1, -top * 0.1, top * 1.2);
    Shade(canvas, f, 0, T, canvas.blue());
    Curve(canvas, f, accent);
    Mark(canvas, T, p0 + k * T, `E = ${N2(p0 * T + k * T * T / 2)} kJ`);
    break; }
    }
  }



  // =====================================================================================================
  // Scenarios 9-16 (indices 8-15): mechanical-engineering course topics. The course formulas are GIVEN,
  // the calculus (differentiate / integrate / optimise / evaluate) is what the student does.
  // =====================================================================================================
  const PI = Math.PI;
  const D2R = PI / 180;
  const cl = (v, lo, hi) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
  const rpmToW = (n) => 2 * PI * n / 60;

  function Titles2() {
    return [
      tx("9. Sönümlü serbest titreşim: x = A e^(−σt) cos(ω_d t)", "9. Damped free vibration: x = A e^(−σt) cos(ω_d t)"),
      tx("10. Zorlanmış titreşim: rezonans tepe noktası", "10. Forced vibration: resonance peak"),
      tx("11. Biyel–krank: piston hızı ve ivmesi", "11. Slider-crank: piston velocity and acceleration"),
      tx("12. Volan: iş ∫T dθ ve hız dalgalanması", "12. Flywheel: work ∫T dθ and speed fluctuation"),
      tx("13. İtme–momentum: J = ∫F dt", "13. Impulse–momentum: J = ∫F dt"),
      tx("14. Roket: v(t) ve yanma sonu yüksekliği", "14. Rocket: v(t) and burnout height"),
      tx("15. Kam–izleyici: sikloidal hareket", "15. Cam–follower: cycloidal motion"),
      tx("16. Eğik düzlemde yuvarlanan silindir", "16. Cylinder rolling down an incline"),
    ];
  }

  function Specs2(scn) {
    switch (scn) {
    case 8: return [Spec(tx("Genlik A (mm)", "Amplitude A (mm)"), 10, 30, 10), Spec(tx("Sönüm üssü σ = ζωₙ (1/s)", "Decay rate σ = ζωₙ (1/s)"), 1, 3, 1), Spec(tx("Sönümlü frekans ω_d (rad/s)", "Damped frequency ω_d (rad/s)"), 4, 8, 2)];
    case 9: return [Spec(tx("Kuvvet genliği F₀ (N)", "Force amplitude F₀ (N)"), 100, 300, 100), Spec(tx("Yay sabiti k (kN/m)", "Spring constant k (kN/m)"), 10, 30, 10), Spec(tx("Sönüm oranı ζ", "Damping ratio ζ"), 0.1, 0.3, 0.1)];
    case 10: return [Spec(tx("Krank yarıçapı r (mm)", "Crank radius r (mm)"), 40, 80, 20), Spec(tx("Oran n = l/r", "Ratio n = l/r"), 3, 5, 1), Spec(tx("Devir n (dev/dk)", "Speed N (rpm)"), 600, 1800, 600), Spec(tx("Krank açısı θ (derece)", "Crank angle θ (degrees)"), 30, 90, 30)];
    case 11: return [Spec(tx("Tork genliği A (N·m)", "Torque amplitude A (N·m)"), 100, 300, 100), Spec(tx("Ortalama devir N (dev/dk)", "Mean speed N (rpm)"), 600, 1800, 600), Spec(tx("Dalgalanma katsayısı Cs (%)", "Fluctuation coefficient Cs (%)"), 2, 6, 2)];
    case 12: return [Spec(tx("Tepe kuvvet F₀ (N)", "Peak force F₀ (N)"), 1000, 3000, 1000), Spec(tx("Darbe süresi T (ms)", "Impact duration T (ms)"), 20, 60, 20), Spec(tx("Kütle m (kg)", "Mass m (kg)"), 10, 30, 10), Spec(tx("Başlangıç hızı v₀ (m/s)", "Initial speed v₀ (m/s)"), 0, 10, 5)];
    case 13: return [Spec(tx("Egzoz hızı u (m/s)", "Exhaust speed u (m/s)"), 2000, 3000, 500), Spec(tx("Yakıt debisi μ (kg/s)", "Burn rate μ (kg/s)"), 40, 60, 10), Spec(tx("Yanma süresi T_b (s)", "Burn time T_b (s)"), 10, 20, 5), Spec(tx("Başlangıç kütlesi m₀ (kg)", "Initial mass m₀ (kg)"), 2000, 3000, 500)];
    case 14: return [Spec(tx("Yükselme h (mm)", "Rise h (mm)"), 10, 30, 10), Spec(tx("Yükselme açısı β (derece)", "Rise angle β (degrees)"), 60, 120, 30), Spec(tx("Kam devri N (dev/dk)", "Cam speed N (rpm)"), 300, 900, 300), Spec(tx("Konum θ/β (%)", "Position θ/β (%)"), 20, 80, 20)];
    default: return [Spec(tx("Eğim açısı β (derece)", "Slope angle β (degrees)"), 30, 60, 15), Spec(tx("Yol uzunluğu L (m)", "Travel length L (m)"), 2, 6, 2), Spec(tx("Kütle m (kg)", "Mass m (kg)"), 10, 30, 10)];
    }
  }

  function Question2(p) {
    const x = p.p;
    switch (p.scn) {
    case 8:
      return tx(`Sönümlü bir sistemin serbest titreşimi x(t) = ${N2(x[0])}·e^(−${N2(x[1])}t)·cos(${N2(x[2])}t) mm (t saniye; σ = ${N2(x[1])} 1/s, ω_d = ${N2(x[2])} rad/s) şeklindedir. Hızı v = dx/dt türeterek bulun; v = 0 koşuluyla ilk uç noktanın zamanını t₁ ve x(t₁) değerini hesaplayın; logaritmik azalmayı δ = σ·T_d ve sönüm oranını ζ bulun.`,
        `The free vibration of a damped system is x(t) = ${N2(x[0])}·e^(−${N2(x[1])}t)·cos(${N2(x[2])}t) mm (t in seconds; σ = ${N2(x[1])} 1/s, ω_d = ${N2(x[2])} rad/s). Find the velocity v = dx/dt by differentiation; from v = 0 find the time t₁ of the first extremum and x(t₁); then find the logarithmic decrement δ = σ·T_d and the damping ratio ζ.`);
    case 9:
      return tx(`Bir sisteme F₀ = ${N2(x[0])} N genlikli harmonik kuvvet etki ediyor (k = ${N2(x[1])} kN/m, ζ = ${N2(x[2])}). Genlik X = δ_st·M(r), M(r) = 1/√((1−r²)² + (2ζr)²), r = ω/ωₙ ve δ_st = F₀/k. dM/dr = 0 koşuluyla rezonans tepe oranını r_p, tepe büyütme çarpanı M_max'ı ve en büyük genliği X_max'ı bulun.`,
        `A system is driven by a harmonic force of amplitude F₀ = ${N2(x[0])} N (k = ${N2(x[1])} kN/m, ζ = ${N2(x[2])}). The amplitude is X = δ_st·M(r) with M(r) = 1/√((1−r²)² + (2ζr)²), r = ω/ωₙ and δ_st = F₀/k. Using dM/dr = 0 find the resonance-peak ratio r_p, the peak magnification M_max and the largest amplitude X_max.`);
    case 10:
      return tx(`Bir biyel–krank mekanizmasında krank yarıçapı r = ${N2(x[0])} mm, biyel boyu l = ${N2(x[1])}·r ve krank sabit ${N2(x[2])} dev/dk ile dönüyor. Piston konumu x(θ) ≈ r·cosθ + l − (r²/(2l))·sin²θ (θ = ωt). θ = ${N2(x[3])}° için x, v = dx/dt ve a = dv/dt değerlerini bulun; a = 0 koşuluyla maksimum hızın açısını ve v_max ile a_max'ı hesaplayın.`,
        `In a slider-crank mechanism the crank radius is r = ${N2(x[0])} mm, the connecting rod is l = ${N2(x[1])}·r and the crank turns at a constant ${N2(x[2])} rpm. Piston position x(θ) ≈ r·cosθ + l − (r²/(2l))·sin²θ (θ = ωt). For θ = ${N2(x[3])}° find x, v = dx/dt and a = dv/dt; from a = 0 find the angle of maximum velocity and compute v_max and a_max.`);
    case 11:
      return tx(`Bir motorun net torku T(θ) = ${N2(x[0])}·sin 2θ N·m'dir (θ krank açısı). Volan ortalama ${N2(x[1])} dev/dk ile dönüyor ve hız dalgalanma katsayısı Cs = ${N2(x[2])}% olmalı. E(θ) = ∫T dθ enerjisini bulun, dE/dθ = 0 ile uç noktaları belirleyin, enerji dalgalanması ΔE'yi ve gerekli atalet momenti I = ΔE/(Cs·ω²) değerini hesaplayın.`,
        `The net torque of an engine is T(θ) = ${N2(x[0])}·sin 2θ N·m (θ is the crank angle). The flywheel turns at a mean ${N2(x[1])} rpm and the speed fluctuation coefficient must be Cs = ${N2(x[2])}%. Find the energy E(θ) = ∫T dθ, locate its extremes with dE/dθ = 0, then compute the energy fluctuation ΔE and the required moment of inertia I = ΔE/(Cs·ω²).`);
    case 12:
      return tx(`${N2(x[2])} kg'lık bir cisme ${N2(x[1])} ms süren bir darbe uygulanıyor: F(t) = ${N2(x[0])}·sin(πt/T) N (0 ≤ t ≤ T). Cismin ilk hızı ${N2(x[3])} m/s. İtme J = ∫F dt'yi, son hızı v₁ = v₀ + J/m'yi, ortalama kuvveti ve kuvvetin en büyük olduğu anı bulun.`,
        `A ${N2(x[2])} kg body receives an impact lasting ${N2(x[1])} ms: F(t) = ${N2(x[0])}·sin(πt/T) N (0 ≤ t ≤ T). Its initial speed is ${N2(x[3])} m/s. Find the impulse J = ∫F dt, the final speed v₁ = v₀ + J/m, the average force and the instant at which the force is largest.`);
    case 13:
      return tx(`Bir roket başlangıçta m₀ = ${N2(x[3])} kg kütleli, yakıtı μ = ${N2(x[1])} kg/s debiyle yakıyor ve egzoz hızı u = ${N2(x[0])} m/s. Düşey yükselişte v(t) = u·ln(m₀/(m₀ − μt)) − g·t (g = 10 m/s²). a = dv/dt türevini bulun; T_b = ${N2(x[2])} s yanma süresi sonunda v ve ∫v dt ile yükselme yüksekliğini hesaplayın; sonra atalet ile çıkılan ek yüksekliği ekleyin.`,
        `A rocket starts with mass m₀ = ${N2(x[3])} kg, burns propellant at μ = ${N2(x[1])} kg/s with exhaust speed u = ${N2(x[0])} m/s. In vertical flight v(t) = u·ln(m₀/(m₀ − μt)) − g·t (g = 10 m/s²). Find the derivative a = dv/dt; at burnout time T_b = ${N2(x[2])} s compute v and the height gained from ∫v dt; then add the extra height gained by coasting.`);
    case 14:
      return tx(`Bir kam–izleyici mekanizmasında izleyici sikloidal yasa ile h = ${N2(x[0])} mm yükselir: s(θ) = h·(θ/β − sin(2πθ/β)/(2π)); β = ${N2(x[1])}°, kam sabit ${N2(x[2])} dev/dk. θ = %${N2(x[3])}·β konumunda s, v = ω·ds/dθ ve a = dv/dt değerlerini bulun; v_max ve a_max'ı türevle sıfırlayarak belirleyin.`,
        `In a cam–follower mechanism the follower rises h = ${N2(x[0])} mm by the cycloidal law s(θ) = h·(θ/β − sin(2πθ/β)/(2π)); β = ${N2(x[1])}°, the cam turns at a constant ${N2(x[2])} rpm. At θ = ${N2(x[3])}% of β find s, v = ω·ds/dθ and a = dv/dt; locate v_max and a_max by setting the appropriate derivative to zero.`);
    default:
      return tx(`${N2(x[2])} kg'lık dolu bir silindir ${N2(x[0])}° eğimli düzlemde kaymadan yuvarlanarak ${N2(x[1])} m yol alıyor (g = 10 m/s²). Enerji korunumu ¾·v² = g·s·sinβ ifadesini zamana göre türeterek ivmeyi bulun; sonra v(t) ve s(t) fonksiyonlarını, alt noktadaki hızı, gereken sürtünme kuvvetini ve en küçük sürtünme katsayısını hesaplayın.`,
        `A solid ${N2(x[2])} kg cylinder rolls without slipping down a ${N2(x[0])}° incline for ${N2(x[1])} m (g = 10 m/s²). Differentiate the energy balance ¾·v² = g·s·sinβ with respect to time to find the acceleration; then find v(t) and s(t), the speed at the bottom, the required friction force and the smallest friction coefficient.`);
    }
  }

  function MeaningExtra2(scn) {
    switch (scn) {
    case 8:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nA: mm, σ: 1/s, ω_d: rad/s, v: mm/s. Çarpım ve zincir kuralı gerekir: d/dt e^(−σt) = −σe^(−σt). σ = ζωₙ, ω_d = ωₙ√(1−ζ²); logaritmik azalma δ = ln(xₙ/xₙ₊₁) = σT_d (T_d = 2π/ω_d) boyutsuzdur.\nYÖNTEM\n1. v = x′ (çarpım kuralı). 2. v = 0 ⇒ tan(ω_d t) = −σ/ω_d. 3. İlk pozitif kök t₁, x(t₁) değeri. 4. δ ve ζ = σ/ωₙ.\nTUZAK: Uç noktalar zarf eğrisi ±A e^(−σt) üzerinde DEĞİLDİR; zarf sadece üst sınırdır. ω_d ile ωₙ'yi karıştırmayın.",
        "UNITS AND PHYSICAL MEANING\nA: mm, σ: 1/s, ω_d: rad/s, v: mm/s. You need the product and chain rules: d/dt e^(−σt) = −σe^(−σt). σ = ζωₙ, ω_d = ωₙ√(1−ζ²); the logarithmic decrement δ = ln(xₙ/xₙ₊₁) = σT_d (T_d = 2π/ω_d) is dimensionless.\nMETHOD\n1. v = x′ (product rule). 2. v = 0 ⇒ tan(ω_d t) = −σ/ω_d. 3. First positive root t₁, value x(t₁). 4. δ and ζ = σ/ωₙ.\nPITFALL: the extremes do NOT lie on the envelope ±A e^(−σt); the envelope is only an upper bound. Do not mix ω_d with ωₙ.");
    case 9:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nF₀: N, k: kN/m ⇒ δ_st = F₀/k mm cinsindendir (N/(kN/m) = mm). r = ω/ωₙ ve M boyutsuzdur. M(r) dinamik genliğin statik sapmaya oranıdır. Sönüm azaldıkça tepe yükselir ve r = 1'e yaklaşır.\nYÖNTEM\n1. M = D^(−1/2), D = (1−r²)² + 4ζ²r². 2. M′ = 0 ⇔ D′ = 0. 3. D′ = 4r(r² − 1 + 2ζ²) ⇒ r_p = √(1−2ζ²). 4. M_max = 1/(2ζ√(1−ζ²)).\nTUZAK: Tepe tam r = 1'de DEĞİL, r_p < 1'dedir (ζ ≥ 0,707 ise tepe yoktur). M′ = 0 için payı değil D′'yi sıfırlamak yeterlidir.",
        "UNITS AND PHYSICAL MEANING\nF₀: N, k: kN/m ⇒ δ_st = F₀/k comes out in mm (N/(kN/m) = mm). r = ω/ωₙ and M are dimensionless. M(r) is the ratio of dynamic amplitude to static deflection. With less damping the peak grows and moves towards r = 1.\nMETHOD\n1. M = D^(−1/2), D = (1−r²)² + 4ζ²r². 2. M′ = 0 ⇔ D′ = 0. 3. D′ = 4r(r² − 1 + 2ζ²) ⇒ r_p = √(1−2ζ²). 4. M_max = 1/(2ζ√(1−ζ²)).\nPITFALL: the peak is NOT exactly at r = 1 but at r_p < 1 (no peak if ζ ≥ 0.707). To get M′ = 0 it is enough to set D′ = 0.");
    case 10:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nr, l, x: mm (hesapta m), ω = 2πN/60: rad/s, v: m/s, a: m/s². ω sabit olduğundan d/dt = ω·d/dθ. Biyel oranı n = l/r büyüdükçe hareket basit harmonik harekete yaklaşır (ikinci harmonik küçülür). ",
        "UNITS AND PHYSICAL MEANING\nr, l, x: mm (m in calculations), ω = 2πN/60: rad/s, v: m/s, a: m/s². Because ω is constant, d/dt = ω·d/dθ. As the rod ratio n = l/r grows the motion approaches simple harmonic motion (the second harmonic shrinks). ")
        + tx("\nYÖNTEM\n1. sin²θ = (1−cos2θ)/2 yaz. 2. v = ω·dx/dθ. 3. a = ω·dv/dθ. 4. a = 0 ⇒ 2cos²θ + n·cosθ − 1 = 0. 5. v_max, a_max (θ = 0).\nTUZAK: θ'yı radyan alın; maksimum hız 90° civarında olur ama tam 90°'de DEĞİL (≈ 74–77°).",
        "\nMETHOD\n1. Write sin²θ = (1−cos2θ)/2. 2. v = ω·dx/dθ. 3. a = ω·dv/dθ. 4. a = 0 ⇒ 2cos²θ + n·cosθ − 1 = 0. 5. v_max, a_max (at θ = 0).\nPITFALL: use θ in radians; the maximum velocity occurs near 90° but NOT exactly at 90° (≈ 74–77°).");
    case 11:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nT: N·m, θ: rad ⇒ T·dθ: N·m = J. E(θ) = ∫T dθ volanda depolanan enerji değişimidir; ΔE = E_max − E_min. ω = 2πN/60 (rad/s), Cs = (ω_max − ω_min)/ω_ort boyutsuzdur, I: kg·m².\nYÖNTEM\n1. E(θ) = ∫₀^θ T dφ. 2. dE/dθ = T = 0 ⇒ uç noktalar. 3. ΔE = E_max − E_min. 4. ½I(ω_max² − ω_min²) = I·ω²·Cs = ΔE ⇒ I.\nTUZAK: Hız YÜZDE ile değil Cs = 0,04 gibi ondalık oranla hesaplanır; devri rad/s'ye çevirmeyi unutmayın. Döngü ortalama torku sıfır olmalıdır.",
        "UNITS AND PHYSICAL MEANING\nT: N·m, θ: rad ⇒ T·dθ: N·m = J. E(θ) = ∫T dθ is the change of energy stored in the flywheel; ΔE = E_max − E_min. ω = 2πN/60 (rad/s), Cs = (ω_max − ω_min)/ω_mean is dimensionless, I: kg·m².\nMETHOD\n1. E(θ) = ∫₀^θ T dφ. 2. dE/dθ = T = 0 ⇒ extremes. 3. ΔE = E_max − E_min. 4. ½I(ω_max² − ω_min²) = I·ω²·Cs = ΔE ⇒ I.\nPITFALL: use Cs as a decimal such as 0.04, not as a percentage; convert rpm to rad/s. The mean torque over a cycle must be zero.");
    case 12:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nF: N, t: s (ms ÷ 1000), J = ∫F dt: N·s = kg·m/s (momentum birimi). İtme, F–t eğrisinin altındaki alandır ve momentum değişimine eşittir: J = m(v₁ − v₀). Ortalama kuvvet F_ort = J/T.\nYÖNTEM\n1. J = ∫₀^T F dt (sinüsün ters türevi). 2. Δv = J/m. 3. F′ = 0 ⇒ tepe anı. 4. F_ort = J/T.\nTUZAK: ms'yi saniyeye çevirin; kısa darbede ortalama kuvvet tepe kuvvetten küçüktür (2/π ≈ 0,64).",
        "UNITS AND PHYSICAL MEANING\nF: N, t: s (ms ÷ 1000), J = ∫F dt: N·s = kg·m/s (unit of momentum). The impulse is the area under the F–t curve and equals the change of momentum: J = m(v₁ − v₀). Average force F_avg = J/T.\nMETHOD\n1. J = ∫₀^T F dt (antiderivative of a sine). 2. Δv = J/m. 3. F′ = 0 ⇒ instant of the peak. 4. F_avg = J/T.\nPITFALL: convert ms to seconds; for a short impact the average force is smaller than the peak (2/π ≈ 0.64).");
    case 13:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nu: m/s, μ: kg/s, m: kg, g = 10 m/s². ln(m₀/m) boyutsuzdur; u·ln(m₀/m) kütle oranından gelen hız kazancıdır (Tsiolkovski), −g·t yerçekimi kaybıdır. a = uμ/(m₀ − μt) − g, kütle azaldıkça artar.\nYÖNTEM\n1. a = dv/dt (d/dt[−ln(m₀−μt)] = μ/(m₀−μt)). 2. v(T_b). 3. ∫ ln(m₀/m) dm ile h_b. 4. h₂ = v²/(2g).\nTUZAK: Kalkış için uμ > m₀g olmalı; ln'de kütleler aynı birimde olmalı; toplam yükseklik = yanma yüksekliği + atalet yüksekliği.",
        "UNITS AND PHYSICAL MEANING\nu: m/s, μ: kg/s, m: kg, g = 10 m/s². ln(m₀/m) is dimensionless; u·ln(m₀/m) is the speed gain from the mass ratio (Tsiolkovsky), −g·t is the gravity loss. a = uμ/(m₀ − μt) − g grows as the mass falls.\nMETHOD\n1. a = dv/dt (d/dt[−ln(m₀−μt)] = μ/(m₀−μt)). 2. v(T_b). 3. ∫ ln(m₀/m) dm gives h_b. 4. h₂ = v²/(2g).\nPITFALL: lift-off needs uμ > m₀g; masses inside the ln must have the same unit; total height = burn height + coasting height.");
    case 14:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nh: mm (hesapta m), β: derece → radyan, ω = 2πN/60: rad/s. θ = ωt olduğundan d/dt = ω·d/dθ. Sikloidal yasa başlangıç ve bitişte hız VE ivmeyi sıfır yapar (şoksuz hareket). s, v, a: mm, m/s, m/s².\nYÖNTEM\n1. ξ = θ/β, ds/dθ = (h/β)(1 − cos2πξ). 2. v = ω·ds/dθ. 3. a = ω²·d²s/dθ² = ω²(2πh/β²) sin2πξ. 4. a = 0 ⇒ ξ = 1/2 (v_max). 5. da/dξ = 0 ⇒ ξ = 1/4 (a_max).\nTUZAK: β'yı radyana çevirmeyi unutmayın; ω² ivmede karesi ile girer.",
        "UNITS AND PHYSICAL MEANING\nh: mm (m in calculations), β: degrees → radians, ω = 2πN/60: rad/s. Because θ = ωt, d/dt = ω·d/dθ. The cycloidal law makes both velocity AND acceleration zero at start and end (shock-free motion). s, v, a: mm, m/s, m/s².\nMETHOD\n1. ξ = θ/β, ds/dθ = (h/β)(1 − cos2πξ). 2. v = ω·ds/dθ. 3. a = ω²·d²s/dθ² = ω²(2πh/β²) sin2πξ. 4. a = 0 ⇒ ξ = 1/2 (v_max). 5. da/dξ = 0 ⇒ ξ = 1/4 (a_max).\nPITFALL: convert β to radians; ω enters the acceleration squared.");
    default:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nβ: derece, L, s: m, v: m/s, a: m/s², f: N. Dolu silindir için I = ½mr²; kaymadan yuvarlanmada ω = v/r. Kinetik enerji: ½mv² (öteleme) + ¼mv² (dönme) = ¾mv². Sürtünme enerji harcamaz, yalnızca dönmeyi sağlar.\nYÖNTEM\n1. mg·s·sinβ = ¾mv². 2. Zamana göre türet: ¾·2v·a = g·v·sinβ. 3. a = (2/3)g·sinβ. 4. v = a·t, s = ½a·t². 5. f = ½m·a ≤ μmg·cosβ.\nTUZAK: Kayan blok a = g·sinβ verir; yuvarlanan silindir 2/3 katı ivmelenir. v = 0 anında v'ye bölmeye dikkat.",
        "UNITS AND PHYSICAL MEANING\nβ: degrees, L, s: m, v: m/s, a: m/s², f: N. For a solid cylinder I = ½mr²; for rolling without slipping ω = v/r. Kinetic energy: ½mv² (translation) + ¼mv² (rotation) = ¾mv². Friction dissipates no energy; it only provides the spin.\nMETHOD\n1. mg·s·sinβ = ¾mv². 2. Differentiate in time: ¾·2v·a = g·v·sinβ. 3. a = (2/3)g·sinβ. 4. v = a·t, s = ½a·t². 5. f = ½m·a ≤ μmg·cosβ.\nPITFALL: a sliding block gives a = g·sinβ; the rolling cylinder accelerates at only 2/3 of that. Be careful when dividing by v at the instant v = 0.");
    }
  }

  function MeaningBase2(p) {
    switch (p.scn) {
    case 8:
      return tx("Konum, üstel sönme ile salınımın ÇARPIMIDIR; bu yüzden hız için ÇARPIM ve zincir kuralı gerekir. Uç noktalar (en büyük sapmalar) hızın sıfır olduğu anlardır: x′(t) = 0. Logaritmik azalma ardışık tepelerin oranının logaritmasıdır ve ZİNCİR kuralı sonrası yalnızca σ·T_d'ye indirgenir. Matematiksel istek: x′(t) = 0 denklemini çöz, t₁'i x(t)'de yerine koy, δ = ln e^(σT_d) = σT_d.",
        "The position is a PRODUCT of an exponential decay and an oscillation, so the velocity needs the PRODUCT and chain rules. Extremes (largest deflections) occur when the velocity is zero: x′(t) = 0. The logarithmic decrement is the logarithm of the ratio of successive peaks and reduces to σ·T_d after simplifying. Mathematical task: solve x′(t) = 0, substitute t₁ into x(t), δ = ln e^(σT_d) = σT_d.");
    case 9:
      return tx("Büyütme çarpanı M(r)'nin EN BÜYÜK değeri soruluyor, yani OPTİMİZASYON: M′(r) = 0. M = D^(−1/2) olduğundan türev M′ = −½D^(−3/2)·D′; D > 0 olduğu için M′ = 0 yalnızca D′ = 0 iken olur. Sonra türev işaret değiştirmesi (D′ < 0 → > 0) tepenin maksimum olduğunu gösterir. Matematiksel istek: D′(r) = 0 ⇒ r_p, M_max = M(r_p).",
        "The LARGEST value of the magnification factor M(r) is asked, i.e. OPTIMISATION: M′(r) = 0. Since M = D^(−1/2), the derivative is M′ = −½D^(−3/2)·D′; because D > 0, M′ = 0 only when D′ = 0. The sign change of the derivative (D′ < 0 → > 0) then shows the peak is a maximum. Mathematical task: D′(r) = 0 ⇒ r_p, M_max = M(r_p).");
    case 10:
      return tx("Piston konumu krank açısının fonksiyonudur ve açı zamanla θ = ωt ile değişir; bu yüzden hız ve ivme için ZİNCİR kuralı gerekir: dx/dt = (dx/dθ)·ω. Maksimum hız, ivmenin sıfır olduğu andır (v′ = a = 0), yani bir OPTİMİZASYON. Matematiksel istek: x′, x″ türevlerini al, θ₀'da hesapla; cosθ + cos2θ/n = 0 denklemini çöz.",
        "The piston position is a function of the crank angle and the angle changes with time as θ = ωt, so the CHAIN rule is needed: dx/dt = (dx/dθ)·ω. The maximum velocity occurs when the acceleration is zero (v′ = a = 0), i.e. an OPTIMISATION. Mathematical task: take x′ and x″, evaluate at θ₀; solve cosθ + cos2θ/n = 0.");
    case 11:
      return tx("Torkun dönme açısı boyunca yaptığı iş bir İNTEGRALDİR: W = ∫T dθ. Birikmiş enerji E(θ) bu integralin üst sınırıdır; E′(θ) = T olduğundan uç noktalar T = 0'da oluşur (OPTİMİZASYON). Enerji dalgalanması E_max − E_min'dir ve volanın atalet momentini belirler. Matematiksel istek: E(θ) = ∫₀^θ T dφ; T = 0 ⇒ θ*, ΔE = E(θ*) − E(0), I = ΔE/(Cs·ω²).",
        "The work done by the torque over a rotation angle is an INTEGRAL: W = ∫T dθ. The accumulated energy E(θ) is the upper-limit function of this integral; since E′(θ) = T, the extremes occur where T = 0 (OPTIMISATION). The energy fluctuation is E_max − E_min and sets the flywheel's moment of inertia. Mathematical task: E(θ) = ∫₀^θ T dφ; T = 0 ⇒ θ*, ΔE = E(θ*) − E(0), I = ΔE/(Cs·ω²).");
    case 12:
      return tx("Kuvvet zamanla değişirken itme, F–t eğrisinin altındaki ALANDIR: J = ∫F dt. Newton'un ikinci yasası F = dp/dt'nin integrali momentum değişimini verir: ∫F dt = m(v₁ − v₀). Tepe kuvvet F′(t) = 0 koşulundan bulunur. Matematiksel istek: ∫₀^T F₀ sin(πt/T) dt, F′ = 0, J/T.",
        "When the force varies with time the impulse is the AREA under the F–t curve: J = ∫F dt. Integrating Newton's second law F = dp/dt gives the change of momentum: ∫F dt = m(v₁ − v₀). The peak force follows from F′(t) = 0. Mathematical task: ∫₀^T F₀ sin(πt/T) dt, F′ = 0, J/T.");
    case 13:
      return tx("Hız logaritmik bir fonksiyondur; ivme onun TÜREVİDİR (zincir kuralı: [ln(m₀ − μt)]′ = −μ/(m₀ − μt)). Yükselme yüksekliği hızın zamana göre İNTEGRALİDİR (ln'nin ters türevi kısmi integral/değişken değişimi ister). Yanma bitince yalnızca yerçekimi etkir, ek yükseklik v²/(2g). Matematiksel istek: v′(t), ∫₀^{T_b} v dt, v_b²/(2g).",
        "The velocity is a logarithmic function; the acceleration is its DERIVATIVE (chain rule: [ln(m₀ − μt)]′ = −μ/(m₀ − μt)). The height gained is the INTEGRAL of velocity with respect to time (the antiderivative of ln needs integration by parts / substitution). After burnout only gravity acts, adding v²/(2g). Mathematical task: v′(t), ∫₀^{T_b} v dt, v_b²/(2g).");
    case 14:
      return tx("Konum fonksiyonu s(θ) verilmiş; hız ve ivme ZİNCİR kuralı ile ardışık TÜREVLERDİR (d/dt = ω·d/dθ). Maksimum hız ivmenin sıfır olduğu, maksimum ivme de ivmenin türevinin sıfır olduğu yerde bulunur (OPTİMİZASYON). Toplam yükselmenin h olduğu da s′'nin integrali ile doğrulanır. Matematiksel istek: s′(θ), s″(θ), s″ = 0 ve s‴ = 0.",
        "The position function s(θ) is given; velocity and acceleration are successive DERIVATIVES with the CHAIN rule (d/dt = ω·d/dθ). The maximum velocity is where the acceleration is zero, and the maximum acceleration is where the derivative of acceleration is zero (OPTIMISATION). The total rise h can also be verified by integrating s′. Mathematical task: s′(θ), s″(θ), s″ = 0 and s‴ = 0.");
    default:
      return tx("Enerji denklemi ¾v² = g·s·sinβ hem v hem s zamana bağlıdır; her iki yanı t'ye göre türetmek (ZİNCİR kuralı: d(v²)/dt = 2v·a, ds/dt = v) ivmeyi verir. Sonra a sabit olduğundan hız ve konum İNTEGRAL ile bulunur: v = ∫a dt, s = ∫v dt. Matematiksel istek: (¾v²)′ = (g·s·sinβ)′ ⇒ a, sonra s(t_L) = L denkleminden t_L.",
        "The energy equation ¾v² = g·s·sinβ has both v and s depending on time; differentiating both sides with respect to t (CHAIN rule: d(v²)/dt = 2v·a, ds/dt = v) gives the acceleration. Since a is then constant, velocity and position follow by INTEGRATION: v = ∫a dt, s = ∫v dt. Mathematical task: (¾v²)′ = (g·s·sinβ)′ ⇒ a, then t_L from s(t_L) = L.");
    }
  }


  // ---- derived quantities (shared by steps, graph and schematic) ----
  function C8(x) {
    const A = x[0], sg = x[1], wd = x[2];
    const wn = Math.sqrt(sg * sg + wd * wd), z = sg / wn, Td = 2 * PI / wd, phi = Math.atan(sg / wd);
    const t1 = (PI - phi) / wd, x1 = -A * Math.exp(-sg * t1) * wd / wn;
    return { A, sg, wd, wn, z, Td, phi, t1, x1, delta: sg * Td, ts: Math.log(20) / sg };
  }
  function C9(x) {
    const F0 = x[0], k = x[1], z = x[2];
    const dst = F0 / k, rp = Math.sqrt(Math.max(0, 1 - 2 * z * z)), Mmax = 1 / (2 * z * Math.sqrt(1 - z * z));
    const M = (r) => 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
    return { F0, k, z, dst, rp, Mmax, Xmax: dst * Mmax, M1: 1 / (2 * z), X1: dst / (2 * z), r1: Math.sqrt(Math.max(0, 2 - 4 * z * z)), M };
  }
  function C10(x) {
    const r = x[0], n = x[1], N = x[2], th = x[3];
    const rm = r / 1000, l = n * r, w = rpmToW(N), t = th * D2R;
    const xs = r * Math.cos(t) + l - r / (4 * n) * (1 - Math.cos(2 * t));
    const v = -rm * w * (Math.sin(t) + Math.sin(2 * t) / (2 * n));
    const a = -rm * w * w * (Math.cos(t) + Math.cos(2 * t) / n);
    const cs = (-n + Math.sqrt(n * n + 8)) / 4, ths = Math.acos(cs);
    const vmax = rm * w * Math.sin(ths) * (1 + cs / n), amax = rm * w * w * (1 + 1 / n);
    return { r, n, N, th, rm, l, w, t, xs, v, a, cs, ths, thsDeg: ths / D2R, vmax, amax };
  }
  function C11(x) {
    const A = x[0], N = x[1], Cs = x[2] / 100;
    const w = rpmToW(N), I = A / (Cs * w * w), wmax = w * (1 + Cs / 2), wmin = w * (1 - Cs / 2);
    return { A, N, Cs, w, I, wmax, wmin, nmax: wmax * 60 / (2 * PI), nmin: wmin * 60 / (2 * PI), dE: A, mDisc: 8 * I };
  }
  function C12(x) {
    const F0 = x[0], Tm = x[1], m = x[2], v0 = x[3], T = Tm / 1000;
    const J = 2 * F0 * T / PI, dv = J / m, v1 = v0 + dv;
    return { F0, Tm, m, v0, T, J, dv, v1, Favg: 2 * F0 / PI, vmid: v0 + F0 * T / (PI * m), dKE: 0.5 * m * (v1 * v1 - v0 * v0) };
  }
  function C13(x) {
    const u = x[0], mu = x[1], Tb = x[2], m0 = x[3], g = 10;
    const mb = m0 - mu * Tb, vb = u * Math.log(m0 / mb) - g * Tb;
    const hb = (u / mu) * (mb * Math.log(mb / m0) + mu * Tb) - 5 * Tb * Tb;
    const h2 = vb * vb / (2 * g);
    return { u, mu, Tb, m0, mb, vb, a0: u * mu / m0 - g, ab: u * mu / mb - g, hb, h2, H: hb + h2, lnr: Math.log(m0 / mb) };
  }
  function C14(x) {
    const h = x[0], bd = x[1], N = x[2], f = x[3];
    const hm = h / 1000, b = bd * D2R, w = rpmToW(N), xi = f / 100;
    return {
      h, bd, N, f, hm, b, w, xi,
      s0: h * (xi - Math.sin(2 * PI * xi) / (2 * PI)),
      v0: hm * w / b * (1 - Math.cos(2 * PI * xi)),
      a0: 2 * PI * hm * w * w / (b * b) * Math.sin(2 * PI * xi),
      vmax: 2 * hm * w / b, amax: 2 * PI * hm * w * w / (b * b),
    };
  }
  function C15(x) {
    const bd = x[0], L = x[1], m = x[2], g = 10, b = bd * D2R;
    const a = (2 / 3) * g * Math.sin(b), tL = Math.sqrt(2 * L / a);
    return { bd, L, m, b, a, tL, vL: a * tL, f: m * a / 2, mu: Math.tan(b) / 3, aSlide: g * Math.sin(b), Etot: m * g * L * Math.sin(b), Nn: m * g * Math.cos(b) };
  }

  function Steps2(problem) {
    const x = problem.p;
    const s = [];
    switch (problem.scn) {
    case 8: {
      const c = C8(x), A = c.A, sg = c.sg, wd = c.wd;
      Ad(s, `1. Değişkenler: x(t) = ${N2(A)}·e^(−${N2(sg)}t)·cos(${N2(wd)}t) (mm), σ = ζωₙ = ${N2(sg)} 1/s, ω_d = ${N2(wd)} rad/s, ωₙ = √(σ² + ω_d²) = √(${N2(sg * sg)} + ${N2(wd * wd)}) = ${N2(c.wn)} rad/s, T_d = 2π/ω_d = ${N2(c.Td)} s.`, `1. Variables: x(t) = ${N2(A)}·e^(−${N2(sg)}t)·cos(${N2(wd)}t) (mm), σ = ζωₙ = ${N2(sg)} 1/s, ω_d = ${N2(wd)} rad/s, ωₙ = √(σ² + ω_d²) = √(${N2(sg * sg)} + ${N2(wd * wd)}) = ${N2(c.wn)} rad/s, T_d = 2π/ω_d = ${N2(c.Td)} s.`);
      Ad(s, `2. Kurulum: v = dx/dt. Çarpım kuralı (fg)′ = f′g + fg′; d/dt e^(−σt) = −σe^(−σt) ve d/dt cos(ω_d t) = −ω_d sin(ω_d t).`, `2. Set-up: v = dx/dt. Product rule (fg)′ = f′g + fg′; d/dt e^(−σt) = −σe^(−σt) and d/dt cos(ω_d t) = −ω_d sin(ω_d t).`);
      Ad(s, `3. Hız: v(t) = ${N2(A)}e^(−${N2(sg)}t)·[−${N2(sg)}cos(${N2(wd)}t) − ${N2(wd)}sin(${N2(wd)}t)] = −${N2(A * c.wn)}·e^(−${N2(sg)}t)·sin(${N2(wd)}t + φ) mm/s, tan φ = σ/ω_d. Başlangıçta v(0) = −A·σ = −${N2(A)}·${N2(sg)} = −${N2(A * sg)} mm/s.`, `3. Velocity: v(t) = ${N2(A)}e^(−${N2(sg)}t)·[−${N2(sg)}cos(${N2(wd)}t) − ${N2(wd)}sin(${N2(wd)}t)] = −${N2(A * c.wn)}·e^(−${N2(sg)}t)·sin(${N2(wd)}t + φ) mm/s, tan φ = σ/ω_d. At the start v(0) = −A·σ = −${N2(A)}·${N2(sg)} = −${N2(A * sg)} mm/s.`);
      Ad(s, `4. Uç nokta: v = 0 ⇒ sin(ω_d t + φ) = 0 ⇒ ω_d t₁ + φ = π. φ = arctan(σ/ω_d) = arctan(${N2(sg)}/${N2(wd)}) = ${N2(c.phi)} rad ⇒ t₁ = (π − φ)/ω_d = (${N2(PI)} − ${N2(c.phi)})/${N2(wd)} = ${N2(c.t1)} s.`, `4. Extremum: v = 0 ⇒ sin(ω_d t + φ) = 0 ⇒ ω_d t₁ + φ = π. φ = arctan(σ/ω_d) = arctan(${N2(sg)}/${N2(wd)}) = ${N2(c.phi)} rad ⇒ t₁ = (π − φ)/ω_d = (${N2(PI)} − ${N2(c.phi)})/${N2(wd)} = ${N2(c.t1)} s.`);
      Ad(s, `5. Bu nokta minimumdur: v(0) < 0 ve v, t₁'de eksiden artıya geçer. cos(ω_d t₁) = cos(π − φ) = −cos φ = −ω_d/ωₙ = −${N2(wd / c.wn)}.`, `5. It is a minimum: v(0) < 0 and v changes from negative to positive at t₁. cos(ω_d t₁) = cos(π − φ) = −cos φ = −ω_d/ωₙ = −${N2(wd / c.wn)}.`);
      Ad(s, `6. Uç sapma: x(t₁) = ${N2(A)}·e^(−${N2(sg)}·${N2(c.t1)})·(−${N2(wd / c.wn)}) = ${N2(A)}·${N2(Math.exp(-sg * c.t1))}·(−${N2(wd / c.wn)}) = ${N2(c.x1)} mm.`, `6. Peak deflection: x(t₁) = ${N2(A)}·e^(−${N2(sg)}·${N2(c.t1)})·(−${N2(wd / c.wn)}) = ${N2(A)}·${N2(Math.exp(-sg * c.t1))}·(−${N2(wd / c.wn)}) = ${N2(c.x1)} mm.`);
      Ad(s, `7. Logaritmik azalma: δ = ln[x(t)/x(t + T_d)] = ln e^(σT_d) = σ·T_d = ${N2(sg)}·${N2(c.Td)} = ${N2(c.delta)}. Sönüm oranı: ζ = σ/ωₙ = ${N2(sg)}/${N2(c.wn)} = ${N2(c.z)} ; kontrol ζ = δ/√(4π² + δ²) = ${N2(c.delta / Math.sqrt(4 * PI * PI + c.delta * c.delta))} ✓.`, `7. Logarithmic decrement: δ = ln[x(t)/x(t + T_d)] = ln e^(σT_d) = σ·T_d = ${N2(sg)}·${N2(c.Td)} = ${N2(c.delta)}. Damping ratio: ζ = σ/ωₙ = ${N2(sg)}/${N2(c.wn)} = ${N2(c.z)} ; check ζ = δ/√(4π² + δ²) = ${N2(c.delta / Math.sqrt(4 * PI * PI + c.delta * c.delta))} ✓.`);
      Ad(s, `8. Zarf ve yerleşme: A·e^(−σt) = 0,05·A ⇒ −σt = ln 0,05 ⇒ t = ln 20/σ = ${N2(Math.log(20))}/${N2(sg)} = ${N2(c.ts)} s. Birim kontrolü: σ·t boyutsuzdur ✓; v birimi mm·(1/s) = mm/s ✓.`, `8. Envelope and settling: A·e^(−σt) = 0.05·A ⇒ −σt = ln 0.05 ⇒ t = ln 20/σ = ${N2(Math.log(20))}/${N2(sg)} = ${N2(c.ts)} s. Unit check: σ·t is dimensionless ✓; v has unit mm·(1/s) = mm/s ✓.`);
      Ad(s, `9. Yorum: kütle önce ${N2(c.t1)} s'de ${N2(c.x1)} mm'ye (genliğin %${N2(Math.abs(c.x1) / A * 100)}'i) gider; her tam salınımda genlik e^(−δ) = ${N2(Math.exp(-c.delta))} katına düşer. Grafikte x(t) ve kesikli zarf ±A e^(−σt) görülür; altın işaret ilk uç noktadır.`, `9. Interpretation: the mass first swings to ${N2(c.x1)} mm at ${N2(c.t1)} s (${N2(Math.abs(c.x1) / A * 100)}% of the amplitude); each full cycle multiplies the amplitude by e^(−δ) = ${N2(Math.exp(-c.delta))}. The graph shows x(t) and the dashed envelope ±A e^(−σt); the gold marker is the first extremum.`);
      break; }
    case 9: {
      const c = C9(x), z = c.z;
      Ad(s, `1. Değişkenler: F₀ = ${N2(c.F0)} N, k = ${N2(c.k)} kN/m, ζ = ${N2(z)}, r = ω/ωₙ, δ_st = F₀/k = ${N2(c.F0)}/${N2(c.k)} = ${N2(c.dst)} mm, M(r) = D^(−1/2), D(r) = (1 − r²)² + 4ζ²r² = (1 − r²)² + ${N2(4 * z * z)}r².`, `1. Variables: F₀ = ${N2(c.F0)} N, k = ${N2(c.k)} kN/m, ζ = ${N2(z)}, r = ω/ωₙ, δ_st = F₀/k = ${N2(c.F0)}/${N2(c.k)} = ${N2(c.dst)} mm, M(r) = D^(−1/2), D(r) = (1 − r²)² + 4ζ²r² = (1 − r²)² + ${N2(4 * z * z)}r².`);
      Ad(s, `2. Kurulum: M′(r) = −½·D^(−3/2)·D′(r) (zincir kuralı). D > 0 olduğundan M′ = 0 ⇔ D′ = 0; M'nin maksimumu D'nin minimumudur.`, `2. Set-up: M′(r) = −½·D^(−3/2)·D′(r) (chain rule). Since D > 0, M′ = 0 ⇔ D′ = 0; the maximum of M is the minimum of D.`);
      Ad(s, `3. Türev: D′(r) = 2(1 − r²)(−2r) + 8ζ²r = −4r + 4r³ + 8ζ²r = 4r·(r² − 1 + 2ζ²) = 4r·(r² − ${N2(1 - 2 * z * z)}).`, `3. Derivative: D′(r) = 2(1 − r²)(−2r) + 8ζ²r = −4r + 4r³ + 8ζ²r = 4r·(r² − 1 + 2ζ²) = 4r·(r² − ${N2(1 - 2 * z * z)}).`);
      Ad(s, `4. D′ = 0: r = 0 (M = 1, başlangıç) ya da r² = 1 − 2ζ² = 1 − 2·${N2(z * z)} = ${N2(1 - 2 * z * z)} ⇒ r_p = √${N2(1 - 2 * z * z)} = ${N2(c.rp)}.`, `4. D′ = 0: r = 0 (M = 1, the start) or r² = 1 − 2ζ² = 1 − 2·${N2(z * z)} = ${N2(1 - 2 * z * z)} ⇒ r_p = √${N2(1 - 2 * z * z)} = ${N2(c.rp)}.`);
      Ad(s, `5. Maksimum testi: r < r_p için D′ < 0, r > r_p için D′ > 0 ⇒ D burada minimum, dolayısıyla M maksimumdur ✓. Tepe r = 1'in solundadır (${N2(c.rp)} < 1).`, `5. Maximum test: D′ < 0 for r < r_p and D′ > 0 for r > r_p ⇒ D is a minimum there, so M is a maximum ✓. The peak lies left of r = 1 (${N2(c.rp)} < 1).`);
      Ad(s, `6. Tepe değeri: D(r_p) = (2ζ²)² + 4ζ²(1 − 2ζ²) = 4ζ²(1 − ζ²) = ${N2(4 * z * z * (1 - z * z))} ⇒ M_max = 1/√D = 1/(2ζ√(1 − ζ²)) = ${N2(c.Mmax)}.`, `6. Peak value: D(r_p) = (2ζ²)² + 4ζ²(1 − 2ζ²) = 4ζ²(1 − ζ²) = ${N2(4 * z * z * (1 - z * z))} ⇒ M_max = 1/√D = 1/(2ζ√(1 − ζ²)) = ${N2(c.Mmax)}.`);
      Ad(s, `7. En büyük genlik: X_max = δ_st·M_max = ${N2(c.dst)}·${N2(c.Mmax)} = ${N2(c.Xmax)} mm. Karşılaştırma: r = 1'de M = 1/(2ζ) = ${N2(c.M1)} ⇒ X = ${N2(c.X1)} mm (tepeden biraz küçük).`, `7. Largest amplitude: X_max = δ_st·M_max = ${N2(c.dst)}·${N2(c.Mmax)} = ${N2(c.Xmax)} mm. Comparison: at r = 1, M = 1/(2ζ) = ${N2(c.M1)} ⇒ X = ${N2(c.X1)} mm (slightly below the peak).`);
      Ad(s, `8. Yalıtım sınırı: M = 1 ⇒ D = 1 ⇒ r²(r² − 2 + 4ζ²) = 0 ⇒ r₁ = √(2 − 4ζ²) = ${N2(c.r1)}; r > r₁ için genlik statik sapmadan küçüktür. Birim: N/(kN/m) = mm ✓, M boyutsuz ✓.`, `8. Isolation limit: M = 1 ⇒ D = 1 ⇒ r²(r² − 2 + 4ζ²) = 0 ⇒ r₁ = √(2 − 4ζ²) = ${N2(c.r1)}; for r > r₁ the amplitude is below the static deflection. Units: N/(kN/m) = mm ✓, M is dimensionless ✓.`);
      Ad(s, `9. Yorum: rezonans yakınında genlik statik sapmanın ${N2(c.Mmax)} katına çıkar (r_p = ${N2(c.rp)}). Sönüm oranı küçüldükçe tepe yükselir ve r = 1'e yaklaşır. Grafikte M(r) eğrisi, kesikli M = 1 çizgisi ve altın tepe noktası görülür.`, `9. Interpretation: near resonance the amplitude reaches ${N2(c.Mmax)} times the static deflection (r_p = ${N2(c.rp)}). With smaller damping the peak grows and moves toward r = 1. The graph shows M(r), the dashed M = 1 line and the gold peak marker.`);
      break; }
    case 10: {
      const c = C10(x), r = c.r, n = c.n, w = c.w, rm = c.rm, t = c.t, th = c.th;
      Ad(s, `1. Değişkenler: r = ${N2(r)} mm = ${N2(rm)} m, l = n·r = ${N2(n)}·${N2(r)} = ${N2(c.l)} mm, N = ${N2(c.N)} dev/dk ⇒ ω = 2πN/60 = ${N2(w)} rad/s (sabit), θ = ωt, θ₀ = ${N2(th)}°.`, `1. Variables: r = ${N2(r)} mm = ${N2(rm)} m, l = n·r = ${N2(n)}·${N2(r)} = ${N2(c.l)} mm, N = ${N2(c.N)} rpm ⇒ ω = 2πN/60 = ${N2(w)} rad/s (constant), θ = ωt, θ₀ = ${N2(th)}°.`);
      Ad(s, `2. Konum: sin²θ = (1 − cos2θ)/2 yazılırsa x(θ) = r·cosθ + l − (r/(4n))·(1 − cos2θ). Zincir kuralı: v = dx/dt = (dx/dθ)·ω.`, `2. Position: with sin²θ = (1 − cos2θ)/2, x(θ) = r·cosθ + l − (r/(4n))·(1 − cos2θ). Chain rule: v = dx/dt = (dx/dθ)·ω.`);
      Ad(s, `3. Hız: dx/dθ = −r·sinθ − (r/(4n))·2sin2θ ⇒ v = −rω·[sinθ + sin2θ/(2n)] = −${N2(rm * w)}·[sinθ + sin2θ/${N2(2 * n)}] m/s.`, `3. Velocity: dx/dθ = −r·sinθ − (r/(4n))·2sin2θ ⇒ v = −rω·[sinθ + sin2θ/(2n)] = −${N2(rm * w)}·[sinθ + sin2θ/${N2(2 * n)}] m/s.`);
      Ad(s, `4. İvme: a = dv/dt = ω·dv/dθ ⇒ a = −rω²·[cosθ + cos2θ/n] = −${N2(rm * w * w)}·[cosθ + cos2θ/${N2(n)}] m/s².`, `4. Acceleration: a = dv/dt = ω·dv/dθ ⇒ a = −rω²·[cosθ + cos2θ/n] = −${N2(rm * w * w)}·[cosθ + cos2θ/${N2(n)}] m/s².`);
      Ad(s, `5. θ = ${N2(th)}° için: x = ${N2(r)}·${N2(Math.cos(t))} + ${N2(c.l)} − ${N2(r / (4 * n))}·(1 − ${N2(Math.cos(2 * t))}) = ${N2(c.xs)} mm ; v = −${N2(rm * w)}·[${N2(Math.sin(t))} + ${N2(Math.sin(2 * t) / (2 * n))}] = ${N2(c.v)} m/s ; a = −${N2(rm * w * w)}·[${N2(Math.cos(t))} + ${N2(Math.cos(2 * t) / n)}] = ${N2(c.a)} m/s².`, `5. For θ = ${N2(th)}°: x = ${N2(r)}·${N2(Math.cos(t))} + ${N2(c.l)} − ${N2(r / (4 * n))}·(1 − ${N2(Math.cos(2 * t))}) = ${N2(c.xs)} mm ; v = −${N2(rm * w)}·[${N2(Math.sin(t))} + ${N2(Math.sin(2 * t) / (2 * n))}] = ${N2(c.v)} m/s ; a = −${N2(rm * w * w)}·[${N2(Math.cos(t))} + ${N2(Math.cos(2 * t) / n)}] = ${N2(c.a)} m/s².`);
      Ad(s, `6. Maksimum hız: a = 0 ⇒ cosθ + cos2θ/n = 0 ⇒ 2cos²θ + n·cosθ − 1 = 0 ⇒ cosθ = (−n + √(n² + 8))/4 = (−${N2(n)} + √${N2(n * n + 8)})/4 = ${N2(c.cs)} ⇒ θ* = ${N2(c.thsDeg)}°.`, `6. Maximum velocity: a = 0 ⇒ cosθ + cos2θ/n = 0 ⇒ 2cos²θ + n·cosθ − 1 = 0 ⇒ cosθ = (−n + √(n² + 8))/4 = (−${N2(n)} + √${N2(n * n + 8)})/4 = ${N2(c.cs)} ⇒ θ* = ${N2(c.thsDeg)}°.`);
      Ad(s, `7. v_max = rω·sinθ*·(1 + cosθ*/n) = ${N2(rm * w)}·${N2(Math.sin(c.ths))}·(1 + ${N2(c.cs / n)}) = ${N2(c.vmax)} m/s (pistonun krana doğru gittiği yön).`, `7. v_max = rω·sinθ*·(1 + cosθ*/n) = ${N2(rm * w)}·${N2(Math.sin(c.ths))}·(1 + ${N2(c.cs / n)}) = ${N2(c.vmax)} m/s (piston moving toward the crank).`);
      Ad(s, `8. En büyük ivme θ = 0'da: a = −rω²(1 + 1/n) = −${N2(rm * w * w)}·${N2(1 + 1 / n)} ⇒ |a|_max = ${N2(c.amax)} m/s² (≈ ${N2(c.amax / 9.81)} g). Birim: m·(rad/s)² = m/s² ✓. θ = π'de |a| = rω²(1 − 1/n) = ${N2(rm * w * w * (1 - 1 / n))} m/s² daha küçüktür.`, `8. The largest acceleration is at θ = 0: a = −rω²(1 + 1/n) = −${N2(rm * w * w)}·${N2(1 + 1 / n)} ⇒ |a|_max = ${N2(c.amax)} m/s² (≈ ${N2(c.amax / 9.81)} g). Units: m·(rad/s)² = m/s² ✓. At θ = π, |a| = rω²(1 − 1/n) = ${N2(rm * w * w * (1 - 1 / n))} m/s² is smaller.`);
      Ad(s, `9. Yorum: piston ölü noktalarda (θ = 0, π) durur ve ivmesi en büyüktür; hız en büyük değerine θ* ≈ ${N2(c.thsDeg)}°'de ulaşır. Grafik boyutsuz x−l, v/(rω) ve a/(rω²) eğrilerini gösterir; altın işaret v_max, kesikli çizgi θ₀'dır.`, `9. Interpretation: the piston stops at the dead centres (θ = 0, π) where the acceleration is greatest; the speed peaks at θ* ≈ ${N2(c.thsDeg)}°. The graph shows the dimensionless x−l, v/(rω) and a/(rω²) curves; the gold marker is v_max and the dashed line is θ₀.`);
      break; }
    case 11: {
      const c = C11(x), A = c.A;
      Ad(s, `1. Değişkenler: T(θ) = ${N2(A)}·sin2θ (N·m), N = ${N2(c.N)} dev/dk ⇒ ω = 2πN/60 = ${N2(c.w)} rad/s, Cs = ${N2(c.Cs * 100)}% = ${N2(c.Cs)}, E = enerji (J), I = atalet momenti (kg·m²).`, `1. Variables: T(θ) = ${N2(A)}·sin2θ (N·m), N = ${N2(c.N)} rpm ⇒ ω = 2πN/60 = ${N2(c.w)} rad/s, Cs = ${N2(c.Cs * 100)}% = ${N2(c.Cs)}, E = energy (J), I = moment of inertia (kg·m²).`);
      Ad(s, `2. Kurulum: iş W = ∫T dθ = ΔKE. Birikmiş enerji E(θ) = ∫₀^θ T dφ ve E′(θ) = T(θ).`, `2. Set-up: work W = ∫T dθ = ΔKE. Accumulated energy E(θ) = ∫₀^θ T dφ and E′(θ) = T(θ).`);
      Ad(s, `3. İntegral: E(θ) = ∫₀^θ ${N2(A)}·sin2φ dφ = ${N2(A)}·[−cos2φ/2]₀^θ = ${N2(A / 2)}·(1 − cos2θ) J.`, `3. Integral: E(θ) = ∫₀^θ ${N2(A)}·sin2φ dφ = ${N2(A)}·[−cos2φ/2]₀^θ = ${N2(A / 2)}·(1 − cos2θ) J.`);
      Ad(s, `4. Uç noktalar: E′ = T = ${N2(A)}·sin2θ = 0 ⇒ 2θ = 0, π, 2π ⇒ θ = 0, π/2, π. E(0) = 0, E(π/2) = ${N2(A / 2)}·(1 − (−1)) = ${N2(A)} J, E(π) = 0.`, `4. Extremes: E′ = T = ${N2(A)}·sin2θ = 0 ⇒ 2θ = 0, π, 2π ⇒ θ = 0, π/2, π. E(0) = 0, E(π/2) = ${N2(A / 2)}·(1 − (−1)) = ${N2(A)} J, E(π) = 0.`);
      Ad(s, `5. İkinci türev testi: E″ = T′ = ${N2(2 * A)}·cos2θ ; θ = π/2'de ${N2(-2 * A)} < 0 ⇒ maksimum ✓. Enerji dalgalanması ΔE = E_max − E_min = ${N2(A)} − 0 = ${N2(c.dE)} J (= ∫₀^{π/2} T dθ).`, `5. Second-derivative test: E″ = T′ = ${N2(2 * A)}·cos2θ ; at θ = π/2 it is ${N2(-2 * A)} < 0 ⇒ maximum ✓. Energy fluctuation ΔE = E_max − E_min = ${N2(A)} − 0 = ${N2(c.dE)} J (= ∫₀^{π/2} T dθ).`);
      Ad(s, `6. Atalet momenti: ΔE = ½I(ω_max² − ω_min²) = I·ω²·Cs ⇒ I = ΔE/(Cs·ω²) = ${N2(c.dE)}/(${N2(c.Cs)}·${N2(c.w * c.w)}) = ${N2(c.I)} kg·m².`, `6. Moment of inertia: ΔE = ½I(ω_max² − ω_min²) = I·ω²·Cs ⇒ I = ΔE/(Cs·ω²) = ${N2(c.dE)}/(${N2(c.Cs)}·${N2(c.w * c.w)}) = ${N2(c.I)} kg·m².`);
      Ad(s, `7. Hız aralığı: ω_max,min = ω·(1 ± Cs/2) = ${N2(c.w)}·(1 ± ${N2(c.Cs / 2)}) ⇒ ${N2(c.wmax)} ve ${N2(c.wmin)} rad/s ⇒ ${N2(c.nmax)} ve ${N2(c.nmin)} dev/dk.`, `7. Speed range: ω_max,min = ω·(1 ± Cs/2) = ${N2(c.w)}·(1 ± ${N2(c.Cs / 2)}) ⇒ ${N2(c.wmax)} and ${N2(c.wmin)} rad/s ⇒ ${N2(c.nmax)} and ${N2(c.nmin)} rpm.`);
      Ad(s, `8. Kontrol: döngü ortalama torku (1/π)∫₀^π ${N2(A)}·sin2θ dθ = 0 olduğundan devir sürüklenmez ✓. Birim: N·m·rad = J ✓ ; J/(rad/s)² = kg·m² ✓.`, `8. Check: the cycle-mean torque (1/π)∫₀^π ${N2(A)}·sin2θ dθ = 0, so the speed does not drift ✓. Units: N·m·rad = J ✓ ; J/(rad/s)² = kg·m² ✓.`);
      Ad(s, `9. Yorum: yarıçapı 0,5 m olan dolu çelik disk için I = ½mR² ⇒ m = 2I/R² = ${N2(c.mDisc)} kg gerekir. Grafikte T(θ) ve E(θ) görülür; gölgeli alan ΔE'dir, altın işaret E_max'tır.`, `9. Interpretation: for a solid disc of radius 0.5 m, I = ½mR² ⇒ m = 2I/R² = ${N2(c.mDisc)} kg is needed. The graph shows T(θ) and E(θ); the shaded area is ΔE and the gold marker is E_max.`);
      break; }
    case 12: {
      const c = C12(x), F0 = c.F0, T = c.T;
      Ad(s, `1. Değişkenler: F(t) = ${N2(F0)}·sin(πt/T) N, T = ${N2(c.Tm)} ms = ${N2(T)} s, m = ${N2(c.m)} kg, v₀ = ${N2(c.v0)} m/s.`, `1. Variables: F(t) = ${N2(F0)}·sin(πt/T) N, T = ${N2(c.Tm)} ms = ${N2(T)} s, m = ${N2(c.m)} kg, v₀ = ${N2(c.v0)} m/s.`);
      Ad(s, `2. Kurulum: F = dp/dt ⇒ ∫F dt = m(v₁ − v₀) = J (itme).`, `2. Set-up: F = dp/dt ⇒ ∫F dt = m(v₁ − v₀) = J (impulse).`);
      Ad(s, `3. Ters türev: ∫${N2(F0)}·sin(πt/T) dt = −${N2(F0)}·(T/π)·cos(πt/T) (kontrol: d/dt cos(πt/T) = −(π/T)·sin(πt/T) ✓).`, `3. Antiderivative: ∫${N2(F0)}·sin(πt/T) dt = −${N2(F0)}·(T/π)·cos(πt/T) (check: d/dt cos(πt/T) = −(π/T)·sin(πt/T) ✓).`);
      Ad(s, `4. Sınırlar: J = −${N2(F0)}·(${N2(T)}/π)·[cos π − cos 0] = −${N2(F0 * T / PI)}·(−1 − 1) = 2F₀T/π = ${N2(c.J)} N·s.`, `4. Limits: J = −${N2(F0)}·(${N2(T)}/π)·[cos π − cos 0] = −${N2(F0 * T / PI)}·(−1 − 1) = 2F₀T/π = ${N2(c.J)} N·s.`);
      Ad(s, `5. Hız değişimi: Δv = J/m = ${N2(c.J)}/${N2(c.m)} = ${N2(c.dv)} m/s ⇒ v₁ = v₀ + Δv = ${N2(c.v0)} + ${N2(c.dv)} = ${N2(c.v1)} m/s.`, `5. Change of speed: Δv = J/m = ${N2(c.J)}/${N2(c.m)} = ${N2(c.dv)} m/s ⇒ v₁ = v₀ + Δv = ${N2(c.v0)} + ${N2(c.dv)} = ${N2(c.v1)} m/s.`);
      Ad(s, `6. Tepe kuvvet: F′(t) = ${N2(F0)}·(π/T)·cos(πt/T) = 0 ⇒ πt/T = π/2 ⇒ t = T/2 = ${N2(c.Tm / 2)} ms ; F″ < 0 ⇒ maksimum, F_max = F₀ = ${N2(F0)} N.`, `6. Peak force: F′(t) = ${N2(F0)}·(π/T)·cos(πt/T) = 0 ⇒ πt/T = π/2 ⇒ t = T/2 = ${N2(c.Tm / 2)} ms ; F″ < 0 ⇒ maximum, F_max = F₀ = ${N2(F0)} N.`);
      Ad(s, `7. Ortalama kuvvet: F_ort = J/T = 2F₀/π = ${N2(c.J)}/${N2(T)} = ${N2(c.Favg)} N (tepenin %${N2(200 / PI)}'ü).`, `7. Average force: F_avg = J/T = 2F₀/π = ${N2(c.J)}/${N2(T)} = ${N2(c.Favg)} N (${N2(200 / PI)}% of the peak).`);
      Ad(s, `8. Kontrol: v(t) = v₀ + (F₀T/(πm))·(1 − cos(πt/T)) ; t = T/2'de v = ${N2(c.vmid)} m/s, yani hız değişiminin yarısı ✓. Kinetik enerji artışı ½m(v₁² − v₀²) = ${N2(c.dKE)} J. Birim: N·s = kg·m/s ✓.`, `8. Check: v(t) = v₀ + (F₀T/(πm))·(1 − cos(πt/T)) ; at t = T/2, v = ${N2(c.vmid)} m/s, half of the speed change ✓. Kinetic-energy gain ½m(v₁² − v₀²) = ${N2(c.dKE)} J. Units: N·s = kg·m/s ✓.`);
      Ad(s, `9. Yorum: ${N2(c.Tm)} ms süren darbe cisme ${N2(c.J)} N·s itme verir ve hızı ${N2(c.v0)}'dan ${N2(c.v1)} m/s'ye çıkarır. Sabit ${N2(c.Favg)} N'luk bir kuvvet aynı etkiyi yapardı. Grafikte gölgeli alan J'dir, kesikli çizgi ortalama kuvvettir.`, `9. Interpretation: the ${N2(c.Tm)} ms impact delivers ${N2(c.J)} N·s of impulse and raises the speed from ${N2(c.v0)} to ${N2(c.v1)} m/s. A constant ${N2(c.Favg)} N force would have the same effect. On the graph the shaded area is J and the dashed line is the average force.`);
      break; }
    case 13: {
      const c = C13(x), u = c.u, mu = c.mu, Tb = c.Tb, m0 = c.m0, mb = c.mb;
      Ad(s, `1. Değişkenler: u = ${N2(u)} m/s, μ = ${N2(mu)} kg/s, m₀ = ${N2(m0)} kg, T_b = ${N2(Tb)} s, g = 10 m/s², anlık kütle m(t) = m₀ − μt ; yanma sonu kütlesi m_b = ${N2(m0)} − ${N2(mu)}·${N2(Tb)} = ${N2(mb)} kg.`, `1. Variables: u = ${N2(u)} m/s, μ = ${N2(mu)} kg/s, m₀ = ${N2(m0)} kg, T_b = ${N2(Tb)} s, g = 10 m/s², instantaneous mass m(t) = m₀ − μt ; burnout mass m_b = ${N2(m0)} − ${N2(mu)}·${N2(Tb)} = ${N2(mb)} kg.`);
      Ad(s, `2. Verilen: v(t) = u·ln(m₀/(m₀ − μt)) − g·t = ${N2(u)}·[ln ${N2(m0)} − ln(${N2(m0)} − ${N2(mu)}t)] − 10t.`, `2. Given: v(t) = u·ln(m₀/(m₀ − μt)) − g·t = ${N2(u)}·[ln ${N2(m0)} − ln(${N2(m0)} − ${N2(mu)}t)] − 10t.`);
      Ad(s, `3. İvme (zincir kuralı): a = dv/dt = u·μ/(m₀ − μt) − g = ${N2(u * mu)}/(${N2(m0)} − ${N2(mu)}t) − 10. t = 0: a = ${N2(c.a0)} m/s² > 0 (kalkış ✓) ; t = T_b: a = ${N2(u * mu)}/${N2(mb)} − 10 = ${N2(c.ab)} m/s².`, `3. Acceleration (chain rule): a = dv/dt = u·μ/(m₀ − μt) − g = ${N2(u * mu)}/(${N2(m0)} − ${N2(mu)}t) − 10. At t = 0: a = ${N2(c.a0)} m/s² > 0 (lift-off ✓) ; at t = T_b: a = ${N2(u * mu)}/${N2(mb)} − 10 = ${N2(c.ab)} m/s².`);
      Ad(s, `4. Yanma sonu hızı: v_b = ${N2(u)}·ln(${N2(m0)}/${N2(mb)}) − 10·${N2(Tb)} = ${N2(u)}·${N2(c.lnr)} − ${N2(10 * Tb)} = ${N2(c.vb)} m/s.`, `4. Burnout speed: v_b = ${N2(u)}·ln(${N2(m0)}/${N2(mb)}) − 10·${N2(Tb)} = ${N2(u)}·${N2(c.lnr)} − ${N2(10 * Tb)} = ${N2(c.vb)} m/s.`);
      Ad(s, `5. Yükseklik integrali: h_b = ∫₀^{T_b} v dt. m = m₀ − μt, dt = −dm/μ yerine koy: ∫ ln(m₀/m) dt = (1/μ)∫_{m_b}^{m₀} ln(m₀/m) dm ; ters türev: ∫ ln(m₀/m) dm = m·ln(m₀/m) + m (türev kontrolü: ln(m₀/m) − 1 + 1 ✓).`, `5. Height integral: h_b = ∫₀^{T_b} v dt. Substitute m = m₀ − μt, dt = −dm/μ: ∫ ln(m₀/m) dt = (1/μ)∫_{m_b}^{m₀} ln(m₀/m) dm ; antiderivative: ∫ ln(m₀/m) dm = m·ln(m₀/m) + m (check: ln(m₀/m) − 1 + 1 ✓).`);
      Ad(s, `6. Sınırlar: (1/μ)·{[m₀·0 + m₀] − [m_b·ln(m₀/m_b) + m_b]} = (1/μ)·[μT_b + m_b·ln(m_b/m₀)] = (1/${N2(mu)})·[${N2(mu * Tb)} + ${N2(mb)}·${N2(Math.log(mb / m0))}] = ${N2((mu * Tb + mb * Math.log(mb / m0)) / mu)} s.`, `6. Limits: (1/μ)·{[m₀·0 + m₀] − [m_b·ln(m₀/m_b) + m_b]} = (1/μ)·[μT_b + m_b·ln(m_b/m₀)] = (1/${N2(mu)})·[${N2(mu * Tb)} + ${N2(mb)}·${N2(Math.log(mb / m0))}] = ${N2((mu * Tb + mb * Math.log(mb / m0)) / mu)} s.`);
      Ad(s, `7. Yanma yüksekliği: h_b = u·${N2((mu * Tb + mb * Math.log(mb / m0)) / mu)} − ½g·T_b² = ${N2(u * (mu * Tb + mb * Math.log(mb / m0)) / mu)} − 5·${N2(Tb * Tb)} = ${N2(c.hb)} m.`, `7. Burn height: h_b = u·${N2((mu * Tb + mb * Math.log(mb / m0)) / mu)} − ½g·T_b² = ${N2(u * (mu * Tb + mb * Math.log(mb / m0)) / mu)} − 5·${N2(Tb * Tb)} = ${N2(c.hb)} m.`);
      Ad(s, `8. Atalet yüksekliği: v = 0'a kadar sadece yerçekimi: h₂ = v_b²/(2g) = ${N2(c.vb * c.vb)}/20 = ${N2(c.h2)} m ⇒ toplam H = ${N2(c.hb)} + ${N2(c.h2)} = ${N2(c.H)} m. Birim: (kg/s)·s = kg, ln boyutsuz, m/s·s = m ✓.`, `8. Coasting height: until v = 0 only gravity acts: h₂ = v_b²/(2g) = ${N2(c.vb * c.vb)}/20 = ${N2(c.h2)} m ⇒ total H = ${N2(c.hb)} + ${N2(c.h2)} = ${N2(c.H)} m. Units: (kg/s)·s = kg, ln is dimensionless, m/s·s = m ✓.`);
      Ad(s, `9. Yorum: roket ${N2(Tb)} s'de ${N2(c.vb)} m/s hıza ve ${N2(c.hb)} m'ye ulaşır, sonra ${N2(c.h2)} m daha yükselir. Kütle azaldıkça ivme ${N2(c.a0)}'dan ${N2(c.ab)} m/s²'ye artar. Grafikte v(t) çizilir; gölgeli alan h_b, altın işaret v_b'dir.`, `9. Interpretation: in ${N2(Tb)} s the rocket reaches ${N2(c.vb)} m/s and ${N2(c.hb)} m, then coasts ${N2(c.h2)} m higher. As mass falls the acceleration rises from ${N2(c.a0)} to ${N2(c.ab)} m/s². The graph shows v(t); the shaded area is h_b and the gold marker is v_b.`);
      break; }
    case 14: {
      const c = C14(x), h = c.h, b = c.b, w = c.w, xi = c.xi;
      Ad(s, `1. Değişkenler: h = ${N2(h)} mm = ${N2(c.hm)} m, β = ${N2(c.bd)}° = ${N2(b)} rad, N = ${N2(c.N)} dev/dk ⇒ ω = 2πN/60 = ${N2(w)} rad/s, ξ = θ/β = ${N2(xi)}.`, `1. Variables: h = ${N2(h)} mm = ${N2(c.hm)} m, β = ${N2(c.bd)}° = ${N2(b)} rad, N = ${N2(c.N)} rpm ⇒ ω = 2πN/60 = ${N2(w)} rad/s, ξ = θ/β = ${N2(xi)}.`);
      Ad(s, `2. Verilen: s(θ) = h·(θ/β − sin(2πθ/β)/(2π)). Zincir kuralı: ds/dt = ω·ds/dθ ; d/dθ sin(2πθ/β) = (2π/β)·cos(2πθ/β).`, `2. Given: s(θ) = h·(θ/β − sin(2πθ/β)/(2π)). Chain rule: ds/dt = ω·ds/dθ ; d/dθ sin(2πθ/β) = (2π/β)·cos(2πθ/β).`);
      Ad(s, `3. Hız: ds/dθ = h·(1/β − cos(2πθ/β)/β) = (h/β)·(1 − cos2πξ) ⇒ v = ω·(h/β)·(1 − cos2πξ) = ${N2(w * c.hm / b)}·(1 − cos2πξ) m/s.`, `3. Velocity: ds/dθ = h·(1/β − cos(2πθ/β)/β) = (h/β)·(1 − cos2πξ) ⇒ v = ω·(h/β)·(1 − cos2πξ) = ${N2(w * c.hm / b)}·(1 − cos2πξ) m/s.`);
      Ad(s, `4. İvme: a = dv/dt = ω·dv/dθ = ω²·(h/β)·(2π/β)·sin2πξ = ${N2(2 * PI * c.hm * w * w / (b * b))}·sin2πξ m/s².`, `4. Acceleration: a = dv/dt = ω·dv/dθ = ω²·(h/β)·(2π/β)·sin2πξ = ${N2(2 * PI * c.hm * w * w / (b * b))}·sin2πξ m/s².`);
      Ad(s, `5. ξ = ${N2(xi)} için: s = ${N2(h)}·(${N2(xi)} − ${N2(Math.sin(2 * PI * xi))}/${N2(2 * PI)}) = ${N2(c.s0)} mm ; v = ${N2(w * c.hm / b)}·(1 − ${N2(Math.cos(2 * PI * xi))}) = ${N2(c.v0)} m/s ; a = ${N2(c.amax)}·${N2(Math.sin(2 * PI * xi))} = ${N2(c.a0)} m/s².`, `5. For ξ = ${N2(xi)}: s = ${N2(h)}·(${N2(xi)} − ${N2(Math.sin(2 * PI * xi))}/${N2(2 * PI)}) = ${N2(c.s0)} mm ; v = ${N2(w * c.hm / b)}·(1 − ${N2(Math.cos(2 * PI * xi))}) = ${N2(c.v0)} m/s ; a = ${N2(c.amax)}·${N2(Math.sin(2 * PI * xi))} = ${N2(c.a0)} m/s².`);
      Ad(s, `6. Maksimum hız: v′ = a = 0 ⇒ sin2πξ = 0 ⇒ ξ = 1/2 (θ = β/2 = ${N2(c.bd / 2)}°) ⇒ v_max = 2hω/β = 2·${N2(c.hm)}·${N2(w)}/${N2(b)} = ${N2(c.vmax)} m/s.`, `6. Maximum velocity: v′ = a = 0 ⇒ sin2πξ = 0 ⇒ ξ = 1/2 (θ = β/2 = ${N2(c.bd / 2)}°) ⇒ v_max = 2hω/β = 2·${N2(c.hm)}·${N2(w)}/${N2(b)} = ${N2(c.vmax)} m/s.`);
      Ad(s, `7. Maksimum ivme: da/dξ ∝ cos2πξ = 0 ⇒ ξ = 1/4 (θ = ${N2(c.bd / 4)}°) ⇒ a_max = 2πhω²/β² = 2π·${N2(c.hm)}·${N2(w * w)}/${N2(b * b)} = ${N2(c.amax)} m/s² (≈ ${N2(c.amax / 9.81)} g).`, `7. Maximum acceleration: da/dξ ∝ cos2πξ = 0 ⇒ ξ = 1/4 (θ = ${N2(c.bd / 4)}°) ⇒ a_max = 2πhω²/β² = 2π·${N2(c.hm)}·${N2(w * w)}/${N2(b * b)} = ${N2(c.amax)} m/s² (≈ ${N2(c.amax / 9.81)} g).`);
      Ad(s, `8. Kontrol: ∫₀^β (ds/dθ) dθ = (h/β)·[θ − (β/2π)·sin(2πθ/β)]₀^β = h ✓ (toplam yükselme). s(β/2) = h/2 = ${N2(h / 2)} mm ✓. Birim: m·(rad/s)/rad = m/s ✓ ; m·(rad/s)²/rad² = m/s² ✓.`, `8. Check: ∫₀^β (ds/dθ) dθ = (h/β)·[θ − (β/2π)·sin(2πθ/β)]₀^β = h ✓ (total rise). s(β/2) = h/2 = ${N2(h / 2)} mm ✓. Units: m·(rad/s)/rad = m/s ✓ ; m·(rad/s)²/rad² = m/s² ✓.`);
      Ad(s, `9. Yorum: izleyici %${N2(c.f)}·β konumunda ${N2(c.s0)} mm yükselmiştir; hız ${N2(c.v0)} m/s, ivme ${N2(c.a0)} m/s²'dir. Hız ve ivme uçlarda sıfırdır (şoksuz). Grafik boyutsuz s/h, v/v_max, a/a_max eğrilerini gösterir; altın işaret s/h noktasıdır.`, `9. Interpretation: at ${N2(c.f)}% of β the follower has risen ${N2(c.s0)} mm; velocity ${N2(c.v0)} m/s, acceleration ${N2(c.a0)} m/s². Velocity and acceleration are zero at both ends (shock-free). The graph shows the dimensionless s/h, v/v_max, a/a_max curves; the gold marker is the s/h point.`);
      break; }
    default: {
      const c = C15(x), sb = Math.sin(c.b);
      Ad(s, `1. Değişkenler: β = ${N2(c.bd)}° (sinβ = ${N2(sb)}), L = ${N2(c.L)} m, m = ${N2(c.m)} kg, g = 10 m/s², dolu silindir I = ½mr², kaymadan yuvarlanma ω = v/r.`, `1. Variables: β = ${N2(c.bd)}° (sinβ = ${N2(sb)}), L = ${N2(c.L)} m, m = ${N2(c.m)} kg, g = 10 m/s², solid cylinder I = ½mr², rolling without slipping ω = v/r.`);
      Ad(s, `2. Enerji: m·g·s·sinβ = ½mv² + ½·(½mr²)·(v/r)² = ¾mv² ⇒ ¾·v² = g·s·sinβ = ${N2(10 * sb)}·s.`, `2. Energy: m·g·s·sinβ = ½mv² + ½·(½mr²)·(v/r)² = ¾mv² ⇒ ¾·v² = g·s·sinβ = ${N2(10 * sb)}·s.`);
      Ad(s, `3. Zamana göre türet (zincir kuralı: d(v²)/dt = 2v·a, ds/dt = v): ¾·2v·a = g·sinβ·v ⇒ a = (2/3)·g·sinβ = (2/3)·10·${N2(sb)} = ${N2(c.a)} m/s² (sabit).`, `3. Differentiate in time (chain rule: d(v²)/dt = 2v·a, ds/dt = v): ¾·2v·a = g·sinβ·v ⇒ a = (2/3)·g·sinβ = (2/3)·10·${N2(sb)} = ${N2(c.a)} m/s² (constant).`);
      Ad(s, `4. Hız: v(t) = ∫a dt = ${N2(c.a)}·t + 0 (v(0) = 0). Konum: s(t) = ∫v dt = ½·${N2(c.a)}·t² = ${N2(c.a / 2)}·t².`, `4. Velocity: v(t) = ∫a dt = ${N2(c.a)}·t + 0 (v(0) = 0). Position: s(t) = ∫v dt = ½·${N2(c.a)}·t² = ${N2(c.a / 2)}·t².`);
      Ad(s, `5. Alt noktaya varış: s(t_L) = L ⇒ ${N2(c.a / 2)}·t_L² = ${N2(c.L)} ⇒ t_L = √${N2(2 * c.L / c.a)} = ${N2(c.tL)} s.`, `5. Arrival at the bottom: s(t_L) = L ⇒ ${N2(c.a / 2)}·t_L² = ${N2(c.L)} ⇒ t_L = √${N2(2 * c.L / c.a)} = ${N2(c.tL)} s.`);
      Ad(s, `6. Alttaki hız: v_L = a·t_L = ${N2(c.a)}·${N2(c.tL)} = ${N2(c.vL)} m/s ; kontrol v² = (4/3)·g·L·sinβ = ${N2(4 / 3 * 10 * c.L * sb)} ⇒ v = ${N2(Math.sqrt(4 / 3 * 10 * c.L * sb))} m/s ✓.`, `6. Speed at the bottom: v_L = a·t_L = ${N2(c.a)}·${N2(c.tL)} = ${N2(c.vL)} m/s ; check v² = (4/3)·g·L·sinβ = ${N2(4 / 3 * 10 * c.L * sb)} ⇒ v = ${N2(Math.sqrt(4 / 3 * 10 * c.L * sb))} m/s ✓.`);
      Ad(s, `7. Sürtünme: f·r = I·α = ½mr²·(a/r) ⇒ f = ½m·a = ½·${N2(c.m)}·${N2(c.a)} = ${N2(c.f)} N. Kaymama koşulu f ≤ μN, N = m·g·cosβ = ${N2(c.Nn)} N ⇒ μ ≥ ${N2(c.f)}/${N2(c.Nn)} = ${N2(c.mu)} (= tanβ/3).`, `7. Friction: f·r = I·α = ½mr²·(a/r) ⇒ f = ½m·a = ½·${N2(c.m)}·${N2(c.a)} = ${N2(c.f)} N. No-slip condition f ≤ μN with N = m·g·cosβ = ${N2(c.Nn)} N ⇒ μ ≥ ${N2(c.f)}/${N2(c.Nn)} = ${N2(c.mu)} (= tanβ/3).`);
      Ad(s, `8. Enerji kontrolü: m·g·L·sinβ = ${N2(c.Etot)} J ; ötelemeye ½mv² = ${N2(0.5 * c.m * c.vL * c.vL)} J (2/3), dönmeye ¼mv² = ${N2(0.25 * c.m * c.vL * c.vL)} J (1/3) ✓. Birim: m/s²·s = m/s ✓.`, `8. Energy check: m·g·L·sinβ = ${N2(c.Etot)} J ; translation ½mv² = ${N2(0.5 * c.m * c.vL * c.vL)} J (2/3), rotation ¼mv² = ${N2(0.25 * c.m * c.vL * c.vL)} J (1/3) ✓. Units: m/s²·s = m/s ✓.`);
      Ad(s, `9. Yorum: yuvarlanan silindir ${N2(c.a)} m/s² ile hızlanır; sürtünmesiz kayan bir blok ise ${N2(c.aSlide)} m/s² ile (1,5 kat) hızlanırdı. ${N2(c.L)} m'yi ${N2(c.tL)} s'de alır ve altta ${N2(c.vL)} m/s olur. Grafikte v(t) ve s(t) görülür; gölgeli alan L'dir.`, `9. Interpretation: the rolling cylinder accelerates at ${N2(c.a)} m/s², while a frictionless sliding block would accelerate at ${N2(c.aSlide)} m/s² (1.5 times more). It covers ${N2(c.L)} m in ${N2(c.tL)} s and reaches ${N2(c.vL)} m/s at the bottom. The graph shows v(t) and s(t); the shaded area is L.`);
      break; }
    }
    return s;
  }

  function dashedFn(canvas, f, col) { canvas.addFunction({ evaluator: safe(f), color: col, thickness: 1.5, dashed: true }); }

  function Draw2(canvas, problem) {
    const x = problem.p;
    const accent = canvas.accent();
    switch (problem.scn) {
    case 8: {
      const c = C8(x), A = c.A, sg = c.sg, wd = c.wd, tmax = 4 * c.Td;
      const fx = (u) => (u < 0 || u > tmax ? NaN : A * Math.exp(-sg * u) * Math.cos(wd * u));
      canvas.setViewport(-tmax * 0.05, tmax * 1.05, -A * 1.15, A * 1.2);
      dashedFn(canvas, (u) => (u < 0 || u > tmax ? NaN : A * Math.exp(-sg * u)), canvas.gray());
      dashedFn(canvas, (u) => (u < 0 || u > tmax ? NaN : -A * Math.exp(-sg * u)), canvas.gray());
      Curve(canvas, fx, accent);
      canvas.addGuideLine({ axis: 'vertical', position: c.t1, color: canvas.gray(), label: `t₁ = ${N2(c.t1)}` });
      Mark(canvas, c.t1, c.x1, `x₁ = ${N2(c.x1)} mm`);
      break; }
    case 9: {
      const c = C9(x), rmax = 2.5;
      const f = (u) => (u < 0 || u > rmax ? NaN : c.M(u));
      canvas.setViewport(-0.1, rmax + 0.1, -c.Mmax * 0.08, c.Mmax * 1.2);
      dashedFn(canvas, (u) => (u < 0 || u > rmax ? NaN : 1), canvas.gray());
      Curve(canvas, f, accent);
      canvas.addGuideLine({ axis: 'vertical', position: 1, color: canvas.gray(), label: 'r = 1' });
      Mark(canvas, c.rp, c.Mmax, `M_max = ${N2(c.Mmax)} (r = ${N2(c.rp)})`);
      break; }
    case 10: {
      const c = C10(x), n = c.n;
      const dEnd = 360;
      const fd = (u) => (u < 0 || u > dEnd ? NaN : Math.cos(u * D2R) - (1 - Math.cos(2 * u * D2R)) / (4 * n));
      const fv = (u) => (u < 0 || u > dEnd ? NaN : -(Math.sin(u * D2R) + Math.sin(2 * u * D2R) / (2 * n)));
      const fa = (u) => (u < 0 || u > dEnd ? NaN : -(Math.cos(u * D2R) + Math.cos(2 * u * D2R) / n));
      canvas.setViewport(-25, 385, -1.6, 1.7);
      Curve(canvas, fd, accent);
      Curve(canvas, fv, canvas.orange());
      Curve(canvas, fa, canvas.red());
      canvas.addGuideLine({ axis: 'vertical', position: c.th, color: canvas.gray(), label: `θ = ${N2(c.th)}°` });
      Mark(canvas, c.th, fv(c.th), `v = ${N2(c.v)} m/s`);
      Mark(canvas, c.thsDeg, fv(c.thsDeg), `v_max @ ${N2(c.thsDeg)}°`);
      break; }
    case 11: {
      const c = C11(x), A = c.A;
      const fT = (u) => (u < 0 || u > 180 ? NaN : A * Math.sin(2 * u * D2R));
      const fE = (u) => (u < 0 || u > 180 ? NaN : A / 2 * (1 - Math.cos(2 * u * D2R)));
      canvas.setViewport(-12, 192, -A * 1.2, A * 1.35);
      Shade(canvas, fT, 0, 90, canvas.blue());
      Curve(canvas, fT, accent);
      Curve(canvas, fE, canvas.orange());
      canvas.addGuideLine({ axis: 'vertical', position: 90, color: canvas.gray(), label: 'θ = 90°' });
      Mark(canvas, 90, A, `ΔE = ${N2(A)} J`);
      break; }
    case 12: {
      const c = C12(x), Tm = c.Tm, F0 = c.F0;
      const f = (u) => (u < 0 || u > Tm ? NaN : F0 * Math.sin(PI * u / Tm));
      canvas.setViewport(-Tm * 0.1, Tm * 1.15, -F0 * 0.12, F0 * 1.25);
      Shade(canvas, f, 0, Tm, canvas.blue());
      dashedFn(canvas, (u) => (u < 0 || u > Tm ? NaN : c.Favg), canvas.gray());
      Curve(canvas, f, accent);
      Mark(canvas, Tm / 2, F0, `F₀ = ${N2(F0)} N, J = ${N2(c.J)} N·s`);
      break; }
    case 13: {
      const c = C13(x), u0 = c.u, mu = c.mu, m0 = c.m0, Tb = c.Tb;
      const f = (u) => (u < 0 || u > Tb ? NaN : u0 * Math.log(m0 / (m0 - mu * u)) - 10 * u);
      canvas.setViewport(-Tb * 0.1, Tb * 1.15, -Math.abs(c.vb) * 0.1, Math.abs(c.vb) * 1.25 + 1);
      Shade(canvas, f, 0, Tb, canvas.blue());
      Curve(canvas, f, accent);
      Mark(canvas, Tb, c.vb, `v_b = ${N2(c.vb)} m/s`);
      break; }
    case 14: {
      const c = C14(x), bd = c.bd;
      const fs = (u) => (u < 0 || u > bd ? NaN : u / bd - Math.sin(2 * PI * u / bd) / (2 * PI));
      const fv = (u) => (u < 0 || u > bd ? NaN : (1 - Math.cos(2 * PI * u / bd)) / 2);
      const fa = (u) => (u < 0 || u > bd ? NaN : Math.sin(2 * PI * u / bd));
      canvas.setViewport(-bd * 0.08, bd * 1.08, -1.3, 1.4);
      Curve(canvas, fs, accent);
      Curve(canvas, fv, canvas.orange());
      Curve(canvas, fa, canvas.red());
      const th = c.xi * bd;
      canvas.addGuideLine({ axis: 'vertical', position: th, color: canvas.gray(), label: `θ = ${N2(th)}°` });
      Mark(canvas, th, fs(th), `s = ${N2(c.s0)} mm`);
      break; }
    default: {
      const c = C15(x), tL = c.tL, a = c.a;
      const fv = (u) => (u < 0 || u > tL ? NaN : a * u);
      const fs = (u) => (u < 0 || u > tL ? NaN : a * u * u / 2);
      const top = Math.max(c.vL, c.L);
      canvas.setViewport(-tL * 0.1, tL * 1.15, -top * 0.1, top * 1.2);
      Shade(canvas, fv, 0, tL, canvas.blue());
      Curve(canvas, fs, canvas.orange());
      Curve(canvas, fv, accent);
      Mark(canvas, tL, c.vL, `v = ${N2(c.vL)} m/s`);
      break; }
    }
  }


  // =====================================================================================================
  // Schematics (engineering sketches). Virtual 100 x 100, origin bottom-left. Called with a fresh Schematic.
  // =====================================================================================================
  const NONE = 'rgba(0,0,0,0)';
  function TT(sc, x, y, str, o) { return sc.text(cl(x, 3, 97), cl(y, 3, 97), str, o); }
  function textLines(sc, arr, y0, dy, o) { arr.forEach((s, i) => TT(sc, 50, y0 - i * dy, s, o)); }
  function carShape(sc, cx, gy, o) {
    o = o || {};
    const f = o.dash ? NONE : undefined;
    sc.rect(cx - 10, gy + 4, 20, 6, Object.assign({ fill: f }, o));
    sc.poly([[cx - 5, gy + 10], [cx - 3, gy + 14], [cx + 4, gy + 14], [cx + 7, gy + 10]], Object.assign({ fill: f || sc.c.fill }, o));
    sc.circle(cx - 5.5, gy + 2.8, 2.8, Object.assign({ fill: o.dash ? NONE : sc.c.steelDark }, o));
    sc.circle(cx + 5.5, gy + 2.8, 2.8, Object.assign({ fill: o.dash ? NONE : sc.c.steelDark }, o));
  }
  // wall - spring (- damper) - mass on a floor. o.disp shifts the mass from its rest position.
  function smd(sc, o) {
    const wallX = 12, fy = o.fy, mh = 22, mw = 18, restX = o.restX == null ? 50 : o.restX;
    const mx = restX + cl(o.disp, -20, 22);
    sc.ground(wallX, 92, fy);
    sc.fixedSupport(wallX, fy + 15, 'L', 32);
    sc.rect(restX, fy, mw, mh, { dash: [1.5, 1.5], fill: NONE, color: sc.c.sub, w: 0.4 });
    sc.rect(mx, fy, mw, mh, { w: 0.8 });
    sc.text(mx + mw / 2, fy + mh / 2, 'm', { size: 3.8, bold: true });
    const ys = o.damper ? fy + mh - 5 : fy + mh / 2;
    sc.spring(wallX, ys, mx, ys, 7, 2.2);
    sc.text((wallX + mx) / 2, ys + 4.8, 'k', { size: 3.2, color: sc.c.steelDark, bold: true });
    if (o.damper) {
      const yd = fy + 6;
      sc.damper(wallX, yd, mx, yd);
      sc.text((wallX + mx) / 2, yd + 5.2, 'c', { size: 3.2, color: sc.c.steelDark, bold: true });
    }
    return { mx, restX, mw, mh, top: fy + mh };
  }

  function sch0(sc, x) {
    const a = x[0], b = x[1], c = x[2], T = x[3];
    const S = (u) => a * u ** 3 + b * u * u + c * u, V = (u) => 3 * a * u * u + 2 * b * u + c, Ac = (u) => 6 * a * u + 2 * b;
    const Te = 1.25 * T;
    const px = 18 + 62 * cl(S(T) / S(Te), 0.02, 1);
    sc.title(tx('Parçacık: konum, hız, ivme', 'Particle: position, velocity, acceleration'));
    sc.line(10, 40, 92, 40, { w: 0.9 });
    sc.line(18, 40, 18, 28, { color: sc.c.sub, w: 0.3 });
    sc.line(px, 40, px, 28, { color: sc.c.sub, w: 0.3 });
    if (px - 18 > 14) sc.dim(18, 30, px, 30, `s = ${N2(S(T))} m`, { ty: -4 });
    else TT(sc, px, 24, `s = ${N2(S(T))} m`, { size: 3.1 });
    sc.circle(px, 43.6, 3.6, { fill: sc.c.accent, w: 0.6 });
    const Lv = cl(8 + 20 * V(T) / V(Te), 8, Math.min(28, 94 - px));
    sc.arrow(px, 55, px + Lv, 55, { color: sc.c.fluid });
    TT(sc, cl(px + Lv / 2, 26, 74), 60.5, `v = ${N2(V(T))} m/s`, { color: sc.c.fluid, size: 3.2 });
    const La = cl(8 + 18 * Ac(T) / Ac(Te), 8, Math.min(26, 94 - px));
    sc.arrow(px, 69, px + La, 69, { color: sc.c.heat });
    TT(sc, cl(px + La / 2, 26, 74), 74.5, `a = ${N2(Ac(T))} m/s²`, { color: sc.c.heat, size: 3.2 });
    textLines(sc, [`s(t) = ${N2(a)}t³ + ${N2(b)}t² + ${N2(c)}t`, `t = ${N2(T)} s`], 17, 6, { size: 3.1 });
  }

  function sch1(sc, x) {
    const q = x[0], pp = x[1], v0 = x[2], T = x[3];
    const S = (u) => pp * u ** 3 / 6 + q * u * u / 2 + v0 * u, V = (u) => pp * u * u / 2 + q * u + v0, Ac = (u) => pp * u + q;
    const px = 26 + 54 * cl(S(T) / S(1.3 * T), 0.02, 1);
    sc.title(tx('Araç: a(t) → v(t) → s(t)', 'Car: a(t) → v(t) → s(t)'));
    sc.ground(8, 92, 32);
    carShape(sc, px, 32);
    sc.line(26, 32, 26, 20, { color: sc.c.sub, w: 0.3 });
    sc.line(px, 32, px, 20, { color: sc.c.sub, w: 0.3 });
    if (px - 26 > 14) sc.dim(26, 22, px, 22, `s = ${N2(S(T))} m`, { ty: -4 });
    else TT(sc, px, 18, `s = ${N2(S(T))} m`, { size: 3.1 });
    const Lv = cl(8 + 20 * V(T) / V(1.3 * T), 8, Math.min(28, 94 - px));
    sc.arrow(px, 52, px + Lv, 52, { color: sc.c.fluid });
    TT(sc, cl(px + Lv / 2, 26, 74), 57.5, `v = ${N2(V(T))} m/s`, { color: sc.c.fluid, size: 3.2 });
    const La = cl(8 + 18 * Ac(T) / Ac(1.3 * T), 8, Math.min(26, 94 - px));
    sc.arrow(px, 67, px + La, 67, { color: sc.c.heat });
    TT(sc, cl(px + La / 2, 26, 74), 72.5, `a = ${N2(Ac(T))} m/s²`, { color: sc.c.heat, size: 3.2 });
    textLines(sc, [`a(t) = ${N2(pp)}t + ${N2(q)} m/s²`, `v₀ = ${N2(v0)} m/s, t = ${N2(T)} s`], 12, 6, { size: 3.1 });
  }

  function sch2(sc, x) {
    const vx = x[0], vy = x[1];
    const R = vx * vy / 5, H = vy * vy / 20, k = Math.min(68 / R, 46 / H);
    const gy = 20, x0 = 14;
    sc.title(tx('Eğik atış: H ve R', 'Projectile: H and R'));
    sc.ground(8, 92, gy);
    const pts = [];
    for (let i = 0; i <= 40; i++) { const X = R * i / 40; pts.push([x0 + X * k, gy + (vy / vx * X - 5 * X * X / (vx * vx)) * k]); }
    sc.poly(pts, { close: false, color: sc.c.accent, w: 0.9 });
    const pk = [x0 + R / 2 * k, gy + H * k];
    sc.circle(pk[0], pk[1], 1.3, { fill: sc.c.gold, w: 0.3 });
    sc.line(pk[0], gy, pk[0], pk[1], { dash: [1.5, 1.5], color: sc.c.sub, w: 0.35 });
    TT(sc, pk[0], pk[1] + 5, `H = ${N2(H)} m`, { size: 3.1, color: sc.c.good });
    sc.line(x0, gy, x0, 12, { color: sc.c.sub, w: 0.3 });
    sc.line(x0 + R * k, gy, x0 + R * k, 12, { color: sc.c.sub, w: 0.3 });
    sc.dim(x0, 13.5, x0 + R * k, 13.5, `R = ${N2(R)} m`, { ty: -4 });
    const Lx = 6 + 14 * vx / 30, Ly = 6 + 14 * vy / 30;
    sc.arrow(62, 66, 62 + Lx, 66, { color: sc.c.fluid });
    TT(sc, 62 + Lx / 2 + 2, 61, `vₓ = ${N2(vx)} m/s`, { color: sc.c.fluid, size: 3.1 });
    sc.arrow(62, 66, 62, 66 + Ly, { color: sc.c.fluid });
    sc.text(65, 66 + Ly, `v_y = ${N2(vy)} m/s`, { color: sc.c.fluid, size: 3.1, align: 'left' });
    TT(sc, 50, 6, `y(t) = ${N2(vy)}t − 5t²`, { size: 3.1 });
  }

  function sch3(sc, x) {
    const kmh = x[0], a = x[1], v0 = kmh / 3.6, d = v0 * v0 / (2 * a), ts = v0 / a;
    const dd = 16 + 44 * Math.sqrt(cl(d / 225, 0, 1)), gx = 20 + dd, gy = 34;
    sc.title(tx('Fren: v₀ → 0, mesafe d', 'Braking: v₀ → 0, distance d'));
    sc.ground(6, 94, gy);
    carShape(sc, 20, gy);
    carShape(sc, gx, gy, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.5 });
    const Lv = 8 + 18 * v0 / 30;
    sc.arrow(20, 70, 20 + Lv, 70, { color: sc.c.fluid });
    TT(sc, cl(20 + Lv / 2, 30, 66), 75.5, `v₀ = ${N2(kmh)} km/h = ${N2(v0)} m/s`, { color: sc.c.fluid, size: 3.1 });
    sc.arrow(gx + 8, 54, gx - 6, 54, { color: sc.c.heat });
    TT(sc, cl(gx, 28, 72), 59.5, `a = −${N2(a)} m/s²`, { color: sc.c.heat, size: 3.1 });
    TT(sc, gx, 49, 'v = 0', { size: 3.1, color: sc.c.sub });
    sc.line(20, gy, 20, 22, { color: sc.c.sub, w: 0.3 });
    sc.line(gx, gy, gx, 22, { color: sc.c.sub, w: 0.3 });
    sc.dim(20, 24, gx, 24, `d = ${N2(d)} m`, { ty: -4 });
    textLines(sc, [`t = ${N2(ts)} s`, `v(t) = v₀ − a·t`], 13, 6, { size: 3.1 });
  }

  function sch4(sc, x) {
    const k = x[0], x1 = x[1], x2 = x[2], w = k / 2 * (x2 * x2 - x1 * x1);
    const X0 = 28, wall = 10, fy = 34, bl = X0 + 80 * x2, X1 = X0 + 80 * x1;
    sc.title(tx('Yayı çekmek: W = ∫F dx', 'Stretching a spring: W = ∫F dx'));
    sc.ground(wall, 92, fy);
    sc.fixedSupport(wall, fy + 8, 'L', 22);
    sc.spring(wall, fy + 9, bl, fy + 9, 7, 3);
    sc.rect(bl, fy, 14, 18, { w: 0.8 });
    TT(sc, bl + 7, fy + 9, 'm', { size: 3.6, bold: true });
    sc.text((wall + bl) / 2, fy + 17, `k = ${N2(k)} N/m`, { size: 3.1, color: sc.c.steelDark });
    const Lf = cl(8 + 20 * k * x2 / 300, 8, 94 - (bl + 14));
    sc.arrow(bl + 14, fy + 9, bl + 14 + Lf, fy + 9, { color: sc.c.load });
    TT(sc, cl(bl + 14 + Lf / 2, 30, 78), fy + 22, `F₂ = ${N2(k * x2)} N`, { color: sc.c.load, size: 3.1 });
    sc.line(X0, fy, X0, 64, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    TT(sc, X0, 67, 'x = 0', { size: 3, color: sc.c.sub });
    if (x1 > 0) sc.line(X1, fy, X1, 58, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    sc.dim(X1, 57, bl, 57, `Δx = ${N2(x2 - x1)} m`, { ty: 3 });
    sc.line(X0, fy, X0, 22, { color: sc.c.sub, w: 0.3 });
    sc.line(bl, fy, bl, 22, { color: sc.c.sub, w: 0.3 });
    sc.dim(X0, 24, bl, 24, `x₂ = ${N2(x2)} m`, { ty: -4 });
    textLines(sc, [`x₁ = ${N2(x1)} m → x₂ = ${N2(x2)} m`, `W = ½k(x₂² − x₁²) = ${N2(w)} J`], 13, 6, { size: 3.1, color: sc.c.good });
  }

  function sch5(sc, x) {
    const m = x[0], w = x[1], A = x[2], k = m * w * w;
    sc.title(tx('Yay–kütle: x = A cos ωt', 'Spring–mass: x = A cos ωt'));
    const g = smd(sc, { fy: 40, disp: 6 + 10 * (A - 0.05) / 0.1, damper: false });
    sc.line(g.restX, g.top, g.restX, 70, { color: sc.c.sub, w: 0.3 });
    sc.line(g.mx, g.top, g.mx, 70, { color: sc.c.sub, w: 0.3 });
    sc.dim(g.restX, 68, g.mx, 68, `A = ${N2(A)} m`, { ty: 3.4 });
    textLines(sc, [`m = ${N2(m)} kg, k = mω² = ${N2(k)} N/m`, `ω = ${N2(w)} rad/s, T = ${N2(2 * PI / w)} s`, `v_max = ${N2(A * w)} m/s, a_max = ${N2(A * w * w)} m/s²`], 26, 6, { size: 3.1 });
  }

  function sch6(sc, x) {
    const a = x[0], b = x[1], T = x[2];
    const th = a * T * T + b * T, w = 2 * a * T + b, al = 2 * a, rpm = w * 60 / (2 * PI), rev = th / (2 * PI);
    const cx = 50, cy = 58, R = 19;
    const thm = ((th % (2 * PI)) + 2 * PI) % (2 * PI), tdeg = thm / D2R;
    sc.title(tx('Dönen mil: θ, ω, α', 'Rotating shaft: θ, ω, α'));
    sc.circle(cx, cy, R, { fill: sc.c.fill, w: 0.9 });
    sc.circle(cx, cy, 3, { fill: sc.c.steel, w: 0.5 });
    sc.line(cx, cy, cx + R + 7, cy, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.35 });
    sc.line(cx, cy, cx + R * Math.cos(thm), cy + R * Math.sin(thm), { color: sc.c.accent, w: 1.1 });
    if (tdeg > 4) sc.arc(cx, cy, 12, 0, tdeg, { color: sc.c.good, w: 0.7 });
    if (tdeg > 25) TT(sc, cx + 16.5 * Math.cos(thm / 2), cy + 16.5 * Math.sin(thm / 2), 'θ', { size: 3.4, color: sc.c.good, bold: true });
    const px = cx + (R + 3) * Math.cos(thm), py = cy + (R + 3) * Math.sin(thm);
    sc.arrow(px, py, px - 10 * Math.sin(thm), py + 10 * Math.cos(thm), { color: sc.c.fluid });
    TT(sc, cx + (R + 12) * Math.cos(thm + 0.45), cy + (R + 12) * Math.sin(thm + 0.45), 'ω', { size: 3.6, color: sc.c.fluid, bold: true });
    textLines(sc, [`θ(T) = ${N2(th)} rad = ${N2(rev)} ${tx('devir', 'rev')}`, `ω = ${N2(w)} rad/s = ${N2(rpm)} rpm`, `α = ${N2(al)} rad/s²  (T = ${N2(T)} s)`], 20, 6, { size: 3.1 });
  }

  function sch7(sc, x) {
    const p0 = x[0], k = x[1], T = x[2], pT = p0 + k * T, e = p0 * T + k * T * T / 2, pa = e / T;
    const hs = 40 / 50, bx = 18, by = 32, wd = 56 * T / 10;
    sc.title(tx('Motor gücü: E = ∫P dt', 'Motor power: E = ∫P dt'));
    sc.rect(12, 76, 14, 10, { w: 0.8 });
    TT(sc, 19, 81, 'M', { size: 3.8, bold: true });
    sc.line(26, 81, 34, 81, { w: 1.1 });
    sc.arrow(bx, by, bx, 74, { color: sc.c.sub, w: 0.4, head: 2 });
    sc.arrow(bx, by, 92, by, { color: sc.c.sub, w: 0.4, head: 2 });
    TT(sc, bx + 5, 72, 'P (kW)', { size: 2.9, color: sc.c.sub });
    TT(sc, 90, by - 4, 't (s)', { size: 2.9, color: sc.c.sub });
    sc.poly([[bx, by], [bx + wd, by], [bx + wd, by + hs * pT], [bx, by + hs * p0]], { fill: sc.c.fluidSoft, color: sc.c.fluid, w: 0.7 });
    sc.line(bx, by + hs * pa, bx + wd, by + hs * pa, { dash: [2, 1.5], color: sc.c.good, w: 0.5 });
    sc.text(bx + 1, by + hs * p0 + 4, `P₀ = ${N2(p0)} kW`, { size: 3, align: 'left' });
    sc.text(bx + wd + 2, by + hs * pT, `${N2(pT)} kW`, { size: 3, align: 'left' });
    sc.line(bx, by, bx, 22, { color: sc.c.sub, w: 0.3 });
    sc.line(bx + wd, by, bx + wd, 22, { color: sc.c.sub, w: 0.3 });
    sc.dim(bx, 24, bx + wd, 24, `T = ${N2(T)} s`, { ty: -4 });
    TT(sc, 62, 89, `E = ∫P dt = ${N2(e)} kJ`, { size: 3.3, color: sc.c.good, bold: true });
    textLines(sc, [`P(t) = ${N2(p0)} + ${N2(k)}t kW`, `P_ort = E/T = ${N2(pa)} kW`], 13, 6, { size: 3.1 });
  }

  function inset(sc, x0, y0, w, h, fn, n, col, o) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; const v = fn(t); pts.push([x0 + w * t, y0 + cl(v, -2, 2) * h]); }
    sc.poly(pts, Object.assign({ close: false, color: col, w: 0.7 }, o));
  }

  function sch8(sc, x) {
    const c = C8(x), tmax = 4 * c.Td;
    sc.title(tx('Sönümlü serbest titreşim', 'Damped free vibration'));
    sc.line(14, 77, 86, 77, { color: sc.c.sub, w: 0.3 });
    inset(sc, 14, 77, 72, 9, (t) => Math.exp(-c.sg * t * tmax) * Math.cos(c.wd * t * tmax), 90, sc.c.accent);
    inset(sc, 14, 77, 72, 9, (t) => Math.exp(-c.sg * t * tmax), 40, sc.c.sub, { dash: [1.5, 1.5], w: 0.35 });
    inset(sc, 14, 77, 72, 9, (t) => -Math.exp(-c.sg * t * tmax), 40, sc.c.sub, { dash: [1.5, 1.5], w: 0.35 });
    sc.circle(14 + 72 * c.t1 / tmax, 77 + 9 * c.x1 / c.A, 1.5, { fill: sc.c.gold, w: 0.3 });
    TT(sc, 18, 88.5, 'x(t)', { size: 2.9, color: sc.c.sub });
    smd(sc, { fy: 36, disp: 16 * c.x1 / c.A, damper: true });
    textLines(sc, [`A = ${N2(c.A)} mm, σ = ${N2(c.sg)} s⁻¹, ω_d = ${N2(c.wd)} rad/s`, `t₁ = ${N2(c.t1)} s, x₁ = ${N2(c.x1)} mm`, `δ = ${N2(c.delta)}, ζ = ${N2(c.z)}`], 25, 6, { size: 3.1 });
  }

  function sch9(sc, x) {
    const c = C9(x), rmax = 2.5;
    sc.title(tx('Zorlanmış titreşim: M(r)', 'Forced vibration: M(r)'));
    sc.line(14, 66, 86, 66, { color: sc.c.sub, w: 0.3 });
    inset(sc, 14, 66, 72, 19 / c.Mmax, (t) => c.M(t * rmax), 80, sc.c.accent);
    sc.circle(14 + 72 * c.rp / rmax, 66 + 19 * c.M(c.rp) / c.Mmax, 1.5, { fill: sc.c.gold, w: 0.3 });
    sc.line(14 + 72 / rmax, 66, 14 + 72 / rmax, 85, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    TT(sc, 14 + 72 / rmax, 63, 'r = 1', { size: 2.9, color: sc.c.sub });
    const g = smd(sc, { fy: 32, restX: 40, disp: cl(c.Xmax / 150 * 14, 3, 14), damper: true });
    sc.arrow(g.mx + g.mw, 32 + 11, g.mx + g.mw + 14, 32 + 11, { color: sc.c.load });
    TT(sc, g.mx + g.mw + 7, 32 + 17, 'F₀ sin ωt', { size: 3, color: sc.c.load });
    textLines(sc, [`F₀ = ${N2(c.F0)} N, k = ${N2(c.k)} kN/m, ζ = ${N2(c.z)}`, `δ_st = ${N2(c.dst)} mm, r_p = ${N2(c.rp)}`, `M_max = ${N2(c.Mmax)}, X_max = ${N2(c.Xmax)} mm`], 23, 6, { size: 3.1 });
  }

  function sch10(sc, x) {
    const c = C10(x), n = c.n;
    const rd = 11, ld = n * rd, cx = 16, cy = 50, t = c.t;
    const px = cx + rd * Math.cos(t) + Math.sqrt(Math.max(0, ld * ld - rd * rd * Math.sin(t) ** 2));
    const pin = [cx + rd * Math.cos(t), cy + rd * Math.sin(t)];
    sc.title(tx('Biyel–krank mekanizması', 'Slider-crank mechanism'));
    sc.line(30, 42, 96, 42, { w: 0.9 });
    sc.line(30, 58, 96, 58, { w: 0.9 });
    sc.circle(cx, cy, rd, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.35, fill: NONE });
    sc.pinSupport(cx, cy - 1);
    sc.rect(px - 5, 43, 10, 14, { w: 0.8 });
    sc.line(cx, cy, pin[0], pin[1], { w: 1.5, color: sc.c.accent });
    sc.line(pin[0], pin[1], px, cy, { w: 1.1, color: sc.c.steelDark });
    sc.circle(pin[0], pin[1], 1.3, { fill: sc.c.gold });
    sc.circle(px, cy, 1.1, { fill: sc.c.gold });
    sc.circle(cx, cy, 1.4, { fill: sc.c.steel });
    sc.arc(cx, cy, 6.5, 0, Math.max(1, c.th), { color: sc.c.good, w: 0.6 });
    sc.line(cx, cy, cx + 15, cy, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    TT(sc, cx + 9.5 * Math.cos(t / 2) + 2, cy + 9.5 * Math.sin(t / 2), 'θ', { size: 3, color: sc.c.good, bold: true });
    const dir = c.v < 0 ? -1 : 1;
    const Lv = cl(4 + 14 * Math.abs(c.v) / (c.rm * c.w * 1.25), 4, 18);
    sc.arrow(px, 66, cl(px + dir * Lv, 6, 94), 66, { color: sc.c.fluid });
    TT(sc, cl(px, 27, 73), 71.5, `v = ${N2(c.v)} m/s`, { color: sc.c.fluid, size: 3.1 });
    const dira = c.a < 0 ? -1 : 1;
    const La = cl(4 + 14 * Math.abs(c.a) / (c.rm * c.w * c.w * (1 + 1 / n)), 4, 18);
    sc.arrow(px, 79, cl(px + dira * La, 6, 94), 79, { color: sc.c.heat });
    TT(sc, cl(px, 27, 73), 84.5, `a = ${N2(c.a)} m/s²`, { color: sc.c.heat, size: 3.1 });
    textLines(sc, [`r = ${N2(c.r)} mm, l = ${N2(n)}r = ${N2(c.l)} mm`, `N = ${N2(c.N)} rpm, ω = ${N2(c.w)} rad/s`, `θ = ${N2(c.th)}°: x = ${N2(c.xs)} mm`], 27, 6, { size: 3.1 });
  }

  function sch11(sc, x) {
    const c = C11(x), cx = 50, cy = 60;
    const R = 12 + 13 * Math.sqrt(cl(c.I / 4, 0, 1));
    sc.title(tx('Volan: ΔE = ∫T dθ', 'Flywheel: ΔE = ∫T dθ'));
    sc.circle(cx, cy, R, { fill: sc.c.fill, w: 1 });
    sc.circle(cx, cy, R * 0.78, { w: 0.4, color: sc.c.sub });
    for (let i = 0; i < 6; i++) sc.line(cx, cy, cx + R * 0.78 * Math.cos(i * PI / 3 + 0.3), cy + R * 0.78 * Math.sin(i * PI / 3 + 0.3), { w: 0.6, color: sc.c.steelDark });
    sc.circle(cx, cy, 3.2, { fill: sc.c.steel, w: 0.5 });
    sc.arc(cx, cy, R + 4, 20, 100, { color: sc.c.fluid, w: 0.8 });
    const a1 = 100 * D2R, a2 = 113 * D2R;
    sc.arrow(cx + (R + 4) * Math.cos(a1), cy + (R + 4) * Math.sin(a1), cx + (R + 4) * Math.cos(a2), cy + (R + 4) * Math.sin(a2), { color: sc.c.fluid, head: 2.4 });
    TT(sc, 78, 87, `ω = ${N2(c.N)} rpm`, { color: sc.c.fluid, size: 3.2 });
    TT(sc, cx, cy - R - 4, `R ∝ I`, { size: 2.8, color: sc.c.sub });
    textLines(sc, [`T(θ) = ${N2(c.A)} sin 2θ N·m`, `ΔE = ${N2(c.dE)} J, Cs = ${N2(c.Cs * 100)}%`, `I = ${N2(c.I)} kg·m²`, `${N2(c.nmin)} … ${N2(c.nmax)} rpm`], 24, 5.6, { size: 3.1 });
  }

  function sch12(sc, x) {
    const c = C12(x), gy = 34;
    sc.title(tx('İtme–momentum: J = ∫F dt', 'Impulse–momentum: J = ∫F dt'));
    const pts = [[20, 66]];
    for (let i = 0; i <= 30; i++) pts.push([20 + 60 * i / 30, 66 + 16 * Math.sin(PI * i / 30)]);
    pts.push([80, 66]);
    sc.poly(pts, { fill: sc.c.fluidSoft, color: sc.c.fluid, w: 0.7 });
    TT(sc, 50, 89, `F(t) = ${N2(c.F0)} sin(πt/T) N`, { size: 3, color: sc.c.fluid });
    TT(sc, 20, 62, '0', { size: 2.8, color: sc.c.sub });
    TT(sc, 80, 62, `T = ${N2(c.Tm)} ms`, { size: 2.8, color: sc.c.sub });
    sc.ground(6, 94, gy);
    sc.rect(28, gy, 16, 14, { w: 0.8 });
    TT(sc, 36, gy + 7, 'm', { size: 3.6, bold: true });
    sc.rect(62, gy, 16, 14, { w: 0.8 });
    TT(sc, 70, gy + 7, 'm', { size: 3.6, bold: true });
    sc.arrow(8, gy + 7, 28, gy + 7, { color: sc.c.load, w: 0.6 + 0.4 * c.F0 / 1000 });
    TT(sc, 18, gy + 14, 'F(t)', { size: 3, color: sc.c.load });
    if (c.v0 > 0) {
      const L0 = 4 + 8 * c.v0 / 22;
      sc.arrow(44, gy + 7, 44 + L0, gy + 7, { color: sc.c.fluid });
    }
    TT(sc, 51, gy + 19, `v₀ = ${N2(c.v0)} m/s`, { color: sc.c.fluid, size: 3 });
    const L1 = 4 + 12 * c.v1 / 22;
    sc.arrow(78, gy + 7, cl(78 + L1, 80, 94), gy + 7, { color: sc.c.fluid });
    TT(sc, 78, gy + 19, `v₁ = ${N2(c.v1)} m/s`, { color: sc.c.fluid, size: 3 });
    sc.arrow(40, gy + 27, 66, gy + 27, { color: sc.c.sub, w: 0.4 });
    TT(sc, 53, gy + 31, `m = ${N2(c.m)} kg`, { size: 2.9, color: sc.c.sub });
    TT(sc, 36, 25, 't = 0', { size: 2.9, color: sc.c.sub });
    TT(sc, 70, 25, 't = T', { size: 2.9, color: sc.c.sub });
    textLines(sc, [`J = 2F₀T/π = ${N2(c.J)} N·s`, `Δv = J/m = ${N2(c.dv)} m/s, F_ort = ${N2(c.Favg)} N`], 15, 6, { size: 3.1, color: sc.c.good });
  }

  function sch13(sc, x) {
    const c = C13(x);
    sc.title(tx('Roket: v(t), h(t)', 'Rocket: v(t), h(t)'));
    sc.rect(35, 38, 10, 32, { w: 0.9 });
    sc.tank(36, 39, 8, 30, cl(c.mu * c.Tb / c.m0, 0, 1));
    sc.poly([[35, 70], [40, 82], [45, 70]], { fill: sc.c.fill, w: 0.9 });
    sc.poly([[35, 38], [29, 30], [35, 46]], { fill: sc.c.fill, w: 0.8 });
    sc.poly([[45, 38], [51, 30], [45, 46]], { fill: sc.c.fill, w: 0.8 });
    const Lf = 8 + 8 * (c.u - 2000) / 1000;
    sc.poly([[37, 38], [40, 38 - Lf], [43, 38]], { fill: sc.c.heat, color: sc.c.heat, w: 0.4 });
    sc.arrow(40, 38 - Lf - 2, 40, 38 - Lf - 11, { color: sc.c.fluid });
    TT(sc, 46, 38 - Lf - 8, 'u', { size: 3.4, color: sc.c.fluid, bold: true });
    const Lv = 10 + 30 * cl(c.vb / 2500, 0, 1);
    sc.arrow(18, 40, 18, 40 + Lv, { color: sc.c.fluid });
    TT(sc, 18, 40 + Lv + 4, 'v_b', { size: 3.4, color: sc.c.fluid, bold: true });
    const rows = [`m₀ = ${N2(c.m0)} kg`, `m_b = ${N2(c.mb)} kg`, `μ = ${N2(c.mu)} kg/s`, `u = ${N2(c.u)} m/s`, `T_b = ${N2(c.Tb)} s`, `v_b = ${N2(c.vb)} m/s`, `h_b = ${N2(c.hb)} m`, `H = ${N2(c.H)} m`];
    rows.forEach((s, i) => sc.text(58, 80 - i * 6.5, s, { size: 3.1, align: 'left', color: i >= 5 ? sc.c.good : undefined, bold: i >= 5 }));
  }

  function sch14(sc, x) {
    const c = C14(x), cx = 40, cy = 44, R0 = 13, hd = 0.35 * c.h, beta = c.bd;
    const f = (xi) => xi - Math.sin(2 * PI * xi) / (2 * PI);
    const rho = (alpha) => {
      const u = (((90 - alpha) % 360) + 360) % 360;
      if (u < beta) return R0 + hd * f(u / beta);
      if (u < 2 * beta) return R0 + hd * (1 - f((u - beta) / beta));
      return R0;
    };
    const rot = c.xi * beta;
    sc.title(tx('Kam–izleyici: sikloidal yükselme', 'Cam–follower: cycloidal rise'));
    const pts = [];
    for (let i = 0; i < 180; i++) { const al = i * 2; const ra = rho(al); pts.push([cx + ra * Math.cos((al + rot) * D2R), cy + ra * Math.sin((al + rot) * D2R)]); }
    sc.poly(pts, { fill: sc.c.fill, w: 0.9 });
    sc.circle(cx, cy, 2.4, { fill: sc.c.steel, w: 0.5 });
    const sd = hd * f(c.xi), yc = cy + R0 + sd + 2.5;
    sc.circle(cx, yc, 2.5, { fill: sc.c.steelDark, w: 0.5 });
    sc.line(cx, yc + 2.5, cx, 84, { w: 1.3, color: sc.c.steel });
    sc.rect(cx - 2.2, 76, 4.4, 12, { fill: NONE, w: 0.7 });
    sc.arc(cx, cy, 28, 195, 245, { color: sc.c.fluid, w: 0.8 });
    sc.arrow(cx + 28 * Math.cos(238 * D2R), cy + 28 * Math.sin(238 * D2R), cx + 28 * Math.cos(252 * D2R), cy + 28 * Math.sin(252 * D2R), { color: sc.c.fluid, head: 2.4 });
    TT(sc, cx - 28, cy - 22, 'ω', { size: 3.4, color: sc.c.fluid, bold: true });
    if (sd > 2.5) sc.dim(70, cy + R0, 70, cy + R0 + sd, '', { size: 0.1 });
    sc.line(cx + 4, cy + R0, 72, cy + R0, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    sc.line(cx + 4, cy + R0 + sd, 72, cy + R0 + sd, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    sc.text(74, cy + R0 + sd / 2, `s = ${N2(c.s0)} mm`, { size: 2.9, align: 'left', color: sc.c.good });
    textLines(sc, [`h = ${N2(c.h)} mm, β = ${N2(c.bd)}°, N = ${N2(c.N)} rpm`, `θ = ${N2(c.f)}% β: v = ${N2(c.v0)} m/s, a = ${N2(c.a0)} m/s²`], 11, 5.6, { size: 3 });
  }

  function sch15(sc, x) {
    const c = C15(x), b = c.b, sb = Math.sin(b), cb = Math.cos(b);
    const D = 66, B = [88, 22], T = [B[0] - D * cb, B[1] + D * sb], r = 6;
    sc.title(tx('Eğik düzlemde yuvarlanma', 'Rolling down an incline'));
    sc.poly([[T[0], B[1]], B, T], { fill: sc.c.fill, w: 0.9 });
    sc.ground(T[0] - 6, 94, B[1]);
    const fr = 0.25, P = [T[0] + fr * (B[0] - T[0]) + r * sb, T[1] + fr * (B[1] - T[1]) + r * cb];
    sc.circle(P[0], P[1], r, { fill: sc.c.fill, w: 0.9 });
    const spin = fr * D / r;
    sc.line(P[0], P[1], P[0] + r * Math.cos(-spin), P[1] + r * Math.sin(-spin), { w: 0.8, color: sc.c.steelDark });
    sc.circle(P[0], P[1], 0.9, { fill: sc.c.steelDark });
    sc.arrow(P[0], P[1], P[0] + 12 * cb, P[1] - 12 * sb, { color: sc.c.heat });
    TT(sc, P[0] + 12 * cb + 3 * sb, P[1] - 12 * sb + 3 * cb, 'a', { size: 3.4, color: sc.c.heat, bold: true });
    const C0 = [P[0] - r * sb, P[1] - r * cb];
    sc.arrow(C0[0], C0[1], C0[0] - 9 * cb, C0[1] + 9 * sb, { color: sc.c.load });
    TT(sc, C0[0] - 9 * cb - 3 * sb - 1, C0[1] + 9 * sb - 3 * cb + 3, 'f', { size: 3.4, color: sc.c.load, bold: true });
    sc.arc(B[0], B[1], 12, 180 - c.bd, 180, { color: sc.c.good, w: 0.6 });
    TT(sc, B[0] - 17 * Math.cos((c.bd / 2) * D2R), B[1] + 17 * Math.sin((c.bd / 2) * D2R) - 1, 'β', { size: 3.2, color: sc.c.good, bold: true });
    const q0 = 0.05, q1 = 0.78;
    sc.dim(T[0] + q0 * (B[0] - T[0]), T[1] + q0 * (B[1] - T[1]), T[0] + q1 * (B[0] - T[0]), T[1] + q1 * (B[1] - T[1]), `L = ${N2(c.L)} m`, { offset: -4 });
    textLines(sc, [`β = ${N2(c.bd)}°, L = ${N2(c.L)} m, m = ${N2(c.m)} kg`, `a = ${N2(c.a)} m/s², v = ${N2(c.vL)} m/s, t = ${N2(c.tL)} s`, `f = ${N2(c.f)} N, μ ≥ ${N2(c.mu)}`], 13.5, 4.8, { size: 2.9 });
  }

  function schematicRaw(sc, problem) {
    const x = problem.p;
    switch (problem.scn) {
    case 0: return sch0(sc, x);
    case 1: return sch1(sc, x);
    case 2: return sch2(sc, x);
    case 3: return sch3(sc, x);
    case 4: return sch4(sc, x);
    case 5: return sch5(sc, x);
    case 6: return sch6(sc, x);
    case 7: return sch7(sc, x);
    case 8: return sch8(sc, x);
    case 9: return sch9(sc, x);
    case 10: return sch10(sc, x);
    case 11: return sch11(sc, x);
    case 12: return sch12(sc, x);
    case 13: return sch13(sc, x);
    case 14: return sch14(sc, x);
    default: return sch15(sc, x);
    }
  }
  function drawSchematic(sc, problem) {
    try { if (!sc || !problem || !Array.isArray(problem.p) || !(problem.scn >= 0 && problem.scn < 16) || problem.p.length < Specs(problem.scn).length || problem.p.some((v) => typeof v !== 'number' || !isFinite(v))) return; schematicRaw(sc, problem); } catch (e) { /* a schematic must never break the page */ }
  }


  function Titles() { return Titles1().concat(Titles2()); }
  function Specs(scn) { return scn >= 8 ? Specs2(scn) : Specs1(scn); }
  function Question(p) { return p.scn >= 8 ? Question2(p) : Question1(p); }
  function MeaningExtra(scn) { return scn >= 8 ? MeaningExtra2(scn) : MeaningExtra1(scn); }
  function MeaningBase(p) { return p.scn >= 8 ? MeaningBase2(p) : MeaningBase1(p); }
  function Steps(problem) { return problem.scn >= 8 ? Steps2(problem) : Steps1(problem); }
  function draw(canvas, problem) { return problem.scn >= 8 ? Draw2(canvas, problem) : draw1(canvas, problem); }

  function Meaning(p) { return MeaningBase(p) + '\n\n' + MeaningExtra(p.scn); }

  function Overview() {
    return tx("MÜHENDİSLİK UYGULAMASI: DİNAMİK\nHareketin büyüklükleri türev ve integralle birbirine bağlıdır: konum s → (türev) → hız v → (türev) → ivme a. Geri yönde integral: a → (∫) → v → (∫) → s.\n\nTANIM VE FORMÜLLER\n• Doğrusal hareket: v = ds/dt, a = dv/dt = d²s/dt²; v(t) = v₀ + ∫₀ᵗ a dτ, s(t) = s₀ + ∫₀ᵗ v dτ.\n• v–t eğrisinin altındaki alan = yer değiştirme; a–t eğrisinin altındaki alan = hız değişimi.\n• Eğik atış (g ≈ 10 m/s²): uçuş süresi t = 2v_y/g, menzil R = vₓ·t, yükseklik H = v_y²/(2g).\n• Fren mesafesi: v(t) = v₀ − a·t, durma anı t_s = v₀/a, mesafe d = v₀²/(2a) (km/h → m/s için ÷ 3,6).\n• Yay işi: W = ∫ F dx = ∫ k·x dx = ½k(x₂² − x₁²) [J].\n• Serbest titreşim: x = A cos ωt, v = −Aω sin ωt, a = −ω²x.\n• Dönme: ω = dθ/dt, α = dω/dt; devir/dk = ω·60/(2π).\n• Güç ve enerji: P = dE/dt, E = ∫ P dt (P–t eğrisinin altındaki alan).\n• Sönümlü serbest titreşim: x = A·e^(−σt)·cos ω_d t, σ = ζωₙ, ω_d = ωₙ√(1−ζ²); uç noktalar x′ = 0 (çarpım kuralı); logaritmik azalma δ = σ·2π/ω_d.\n• Zorlanmış titreşim: X = (F₀/k)·M(r), M = 1/√((1−r²)² + (2ζr)²); tepe dM/dr = 0 ⇒ r_p = √(1−2ζ²), M_max = 1/(2ζ√(1−ζ²)).\n• Biyel–krank: x(θ) ≈ r cosθ + l − (r²/2l) sin²θ; v = ω·dx/dθ, a = ω·dv/dθ; maksimum hız a = 0 koşulundan.\n• Volan: E(θ) = ∫T dθ, ΔE = E_max − E_min, I = ΔE/(Cs·ω²).\n• İtme–momentum: J = ∫F dt = m(v₁ − v₀); F_ort = J/T.\n• Roket (değişken kütle): v = u·ln(m₀/m) − g t, a = dv/dt, yükseklik h = ∫v dt.\n• Kam–izleyici: s(θ) sikloidal, v = ω·ds/dθ, a = ω²·d²s/dθ²; uç değerler türevin sıfırından.\n• Yuvarlanan silindir: ¾v² = g s sinβ türetilirse a = (2/3)g sinβ; sürtünme f = ½ m a.\n\nYÖNTEM\n1. Hangi büyüklüğün verildiğini ve hangisinin istendiğini belirle (s, v, a, F, P ...).\n2. Türev mi (anlık değer, eğim) integral mi (toplam, alan) gerektiğine karar ver.\n3. Fonksiyonu yaz; integralde başlangıç koşullarını (v₀, s₀) mutlaka ekle.\n4. Ters türevi al, sınırları uygula; türevde kuvvet/zincir kuralını kullan.\n5. Birimleri kontrol et (m, m/s, m/s², J, W) ve sonucu fiziksel olarak yorumla.\n\nÖZEL DURUMLAR VE TUZAKLAR\n• km/h ile m/s'yi karıştırmayın (1 m/s = 3,6 km/h); rpm ile rad/s'yi karıştırmayın.\n• İntegral sabiti = başlangıç koşulu; unutulursa sonuç yanlış olur.\n• Sabit ivmede formüller kısadır, ivme zamanla değişince integral gerekir.\n• Gücü kW verip enerjiyi kJ olarak okuyun (kW·s = kJ).\n\nMİNİ ÖRNEK\na = 6t m/s², v(0) = 2 m/s, s(0) = 0: v = 3t² + 2, s = t³ + 2t. t = 2 s'de v = 14 m/s, s = 12 m ✓.\n\nHAFIZA KURALI\n\"Türev iner, integral çıkar\": s → v → a türevle iner; a → v → s integralle çıkar.",
      "ENGINEERING APPLICATION: DYNAMICS\nThe quantities of motion are tied together by derivatives and integrals: position s → (derivative) → velocity v → (derivative) → acceleration a. In the reverse direction use integrals: a → (∫) → v → (∫) → s.\n\nDEFINITIONS AND FORMULAS\n• Rectilinear motion: v = ds/dt, a = dv/dt = d²s/dt²; v(t) = v₀ + ∫₀ᵗ a dτ, s(t) = s₀ + ∫₀ᵗ v dτ.\n• Area under the v–t curve = displacement; area under the a–t curve = change of velocity.\n• Projectile (g ≈ 10 m/s²): flight time t = 2v_y/g, range R = vₓ·t, height H = v_y²/(2g).\n• Braking distance: v(t) = v₀ − a·t, stopping time t_s = v₀/a, distance d = v₀²/(2a) (km/h → m/s: ÷ 3.6).\n• Spring work: W = ∫ F dx = ∫ k·x dx = ½k(x₂² − x₁²) [J].\n• Free vibration: x = A cos ωt, v = −Aω sin ωt, a = −ω²x.\n• Rotation: ω = dθ/dt, α = dω/dt; rev/min = ω·60/(2π).\n• Power and energy: P = dE/dt, E = ∫ P dt (area under the P–t curve).\n• Damped free vibration: x = A·e^(−σt)·cos ω_d t, σ = ζωₙ, ω_d = ωₙ√(1−ζ²); extremes at x′ = 0 (product rule); logarithmic decrement δ = σ·2π/ω_d.\n• Forced vibration: X = (F₀/k)·M(r), M = 1/√((1−r²)² + (2ζr)²); peak from dM/dr = 0 ⇒ r_p = √(1−2ζ²), M_max = 1/(2ζ√(1−ζ²)).\n• Slider-crank: x(θ) ≈ r cosθ + l − (r²/2l) sin²θ; v = ω·dx/dθ, a = ω·dv/dθ; maximum velocity from a = 0.\n• Flywheel: E(θ) = ∫T dθ, ΔE = E_max − E_min, I = ΔE/(Cs·ω²).\n• Impulse–momentum: J = ∫F dt = m(v₁ − v₀); F_avg = J/T.\n• Rocket (variable mass): v = u·ln(m₀/m) − g t, a = dv/dt, height h = ∫v dt.\n• Cam–follower: cycloidal s(θ), v = ω·ds/dθ, a = ω²·d²s/dθ²; extremes from zeros of the derivative.\n• Rolling cylinder: differentiating ¾v² = g s sinβ gives a = (2/3)g sinβ; friction f = ½ m a.\n\nMETHOD\n1. Identify what is given and what is asked (s, v, a, F, P ...).\n2. Decide whether a derivative (instantaneous value, slope) or an integral (total, area) is needed.\n3. Write the function; for integrals always include the initial conditions (v₀, s₀).\n4. Take the antiderivative and apply the limits; for derivatives use the power/chain rule.\n5. Check units (m, m/s, m/s², J, W) and interpret the result physically.\n\nSPECIAL CASES AND PITFALLS\n• Do not mix km/h and m/s (1 m/s = 3.6 km/h); do not mix rpm and rad/s.\n• The integration constant = the initial condition; forgetting it gives a wrong result.\n• With constant acceleration the formulas are short; when a changes with time an integral is needed.\n• With power in kW read the energy in kJ (kW·s = kJ).\n\nMINI EXAMPLE\na = 6t m/s², v(0) = 2 m/s, s(0) = 0: v = 3t² + 2, s = t³ + 2t. At t = 2 s: v = 14 m/s, s = 12 m ✓.\n\nMEMORY AID\n\"Derivatives go down, integrals go up\": s → v → a goes down with derivatives; a → v → s goes up with integrals.");
  }

  function problemStatement(problem) { return Question(problem); }

  function concept(problem) {
    const head = Overview() + '\n\n' + tx('SENARYO', 'SCENARIO') + '\n' + Titles()[problem.scn] + '\n\n' + MeaningExtra(problem.scn) + '\n\n';
    if (showMeaning) {
      return head + tx('BU SORUDA MATEMATİKSEL OLARAK NE İSTENİYOR?', 'WHAT IS THIS QUESTION ASKING, MATHEMATICALLY?') + '\n' + MeaningBase(problem);
    }
    return head + tx(
      "(Çözmeden önce sorunun matematiksel karşılığını görmek için 'Soru ne demek istiyor?' düğmesine basın.)",
      "(To see what the question means mathematically before solving, press the 'What does the question mean?' button.)");
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

  function makeScn(rng, scn) {
    currentScenario = scn;
    if (selectReg) selectReg.refreshFromModel();
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

  Topics.register('engineering', {
    id: 'engDynamics',
    tabTitle: () => tx("Dinamik ve Titreşim", "Dynamics & Vibration"),
    concept,
    problemStatement,
    createProblem,
    solveSteps: EngAssume.wrap("dynamics", Steps),
    draw,
    drawSchematic,
    buildControls,
    links: [
      { match: /^• (Doğrusal hareket|Rectilinear motion)/, make: (rng) => makeScn(rng, 0) },
      { match: /^• (Eğik atış|Projectile)/, make: (rng) => makeScn(rng, 2) },
      { match: /^• (Fren mesafesi|Braking distance)/, make: (rng) => makeScn(rng, 3) },
      { match: /^• (Yay işi|Spring work)/, make: (rng) => makeScn(rng, 4) },
      { match: /^• (Serbest titreşim|Free vibration)/, make: (rng) => makeScn(rng, 5) },
      { match: /^• (Dönme|Rotation)/, make: (rng) => makeScn(rng, 6) },
      { match: /^• (Güç ve enerji|Power and energy)/, make: (rng) => makeScn(rng, 7) },
      { match: /^• (Sönümlü serbest|Damped free)/, make: (rng) => makeScn(rng, 8) },
      { match: /^• (Zorlanmış titreşim|Forced vibration)/, make: (rng) => makeScn(rng, 9) },
      { match: /^• (Biyel.krank|Slider-crank)/, make: (rng) => makeScn(rng, 10) },
      { match: /^• (Volan|Flywheel)/, make: (rng) => makeScn(rng, 11) },
      { match: /^• (İtme.momentum|Impulse.momentum)/, make: (rng) => makeScn(rng, 12) },
      { match: /^• (Roket|Rocket)/, make: (rng) => makeScn(rng, 13) },
      { match: /^• (Kam.izleyici|Cam.follower)/, make: (rng) => makeScn(rng, 14) },
      { match: /^• (Yuvarlanan silindir|Rolling cylinder)/, make: (rng) => makeScn(rng, 15) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
  });
})();
