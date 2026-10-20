// Ported from Modules/EngineeringApplications/EngMaterialsControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/limits/realLifeLimits.js): engineering scenarios (see below) with a scenario selector, live sliders,
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
  const G = (v) => F(v, 3, 0);
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  // scientific notation m×10^e (superscript exponent), `d` decimals in the mantissa
  function Sci(v, d) {
    if (!Number.isFinite(v)) return '0';
    if (v === 0) return '0';
    const dd = d === undefined ? 2 : d;
    let e = Math.floor(Math.log10(Math.abs(v)));
    let m = v / Math.pow(10, e);
    if (Math.abs(Number(m.toFixed(dd))) >= 10) { m /= 10; e += 1; }
    return F(m, dd, 0) + '×10' + String(e).split('').map((ch) => SUP[ch] || ch).join('');
  }
  const cl = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo);
  // polyline points of an ellipse arc (degrees, counter-clockwise from +x)
  function ell(cx, cy, rx, ry, a0, a1, n) {
    const pts = [], m = n || 24;
    for (let i = 0; i <= m; i++) { const a = (a0 + (a1 - a0) * i / m) * Math.PI / 180; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return pts;
  }
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
    return [ tx("1. Lazer toz yatağı: eriyik havuzu derinliği (tepe noktası)", "1. Laser powder bed: melt-pool depth (vertex)"), tx("2. Hacimsel enerji yoğunluğu ve tarama hızı (rasyonel)", "2. Volumetric energy density and scan speed (rational)"), tx("3. Tel ark birikimi: V = k·v^(3/2) ve duyarlılık", "3. Wire-arc deposition: V = k·v^(3/2) and sensitivity"), tx("4. Isıl genleşme: doğrusal yaklaşıklık hatası", "4. Thermal expansion: linear approximation error"), tx("5. Katılaşma: soğuma hızı dT/dt", "5. Solidification: cooling rate dT/dt"), tx("6. Yorulma S–N eğrisi: ömür artışı", "6. Fatigue S–N curve: life gain"), tx("7. Katman kalınlığı: toplam maliyeti minimize et", "7. Layer thickness: minimise total cost"), tx("8. Talaşlı imalat: Taylor takım ömrü", "8. Machining: Taylor tool life"),
      tx("9. Gerilme–şekil değiştirme eğrisi: modül ve tokluk (integral)", "9. Stress–strain curve: modulus and toughness (integral)"),
      tx("10. Birinci mertebe sistem: basamak yanıtı ve zaman sabiti", "10. First-order system: step response and time constant"),
      tx("11. İkinci mertebe sistem: tepe zamanı ve aşım (y′ = 0)", "11. Second-order system: peak time and overshoot (y′ = 0)"),
      tx("12. Frezeleme maliyeti: kesme hızına göre optimizasyon", "12. Milling cost: optimisation over cutting speed"),
      tx("13. Rulman ömrü L₁₀ = (C/P)³: yüke duyarlılık", "13. Bearing life L₁₀ = (C/P)³: load sensitivity"),
      tx("14. Cıvata/yay bağlantısı: depolanan enerji ∫F dx", "14. Bolt/spring joint: stored energy ∫F dx"),
      tx("15. Mil torku çevrimi: ortalama tork, güç ve volan enerjisi", "15. Shaft torque cycle: mean torque, power and flywheel energy"),
      tx("16. Yorulma çatlak büyümesi (Paris yasası): ömür integrali", "16. Fatigue crack growth (Paris law): life integral") ];
  }


  function Specs(scn) {
    switch (scn) {
    case 0: {
    return [Spec(tx("a (×10⁻³ µm/W²)", "a (×10⁻³ µm/W²)"), 1, 4, 1), Spec(tx("En iyi güç P₀ (W) - b buna göre kurulur", "Best power P₀ (W) - b is built from it"), 100, 300, 50)];
    break; }
    case 1: {
    return [Spec(tx("Lazer gücü P (W)", "Laser power P (W)"), 150, 400, 50), Spec(tx("Tarama aralığı h (µm)", "Hatch spacing h (µm)"), 80, 120, 20), Spec(tx("Katman kalınlığı t (µm)", "Layer thickness t (µm)"), 30, 50, 10), Spec(tx("Alt sınır E_min (J/mm³)", "Threshold E_min (J/mm³)"), 50, 80, 10)];
    break; }
    case 2: {
    return [Spec(tx("s (bilinen hız v₀ = s² mm/s)", "s (known speed v₀ = s² mm/s)"), 2, 5, 1), Spec(tx("Gerçek orantı sabiti k (bulunacak)", "True constant k (to be found)"), 1, 5, 1), Spec(tx("s₁ (tahmin hızı v₁ = s₁² mm/s)", "s₁ (prediction speed v₁ = s₁² mm/s)"), 2, 6, 1)];
    break; }
    case 3: {
    return [Spec(tx("Başlangıç boyu L₀ (mm)", "Initial length L₀ (mm)"), 100, 500, 100), Spec(tx("α (×10⁻⁶ 1/K)", "α (×10⁻⁶ 1/K)"), 12, 24, 4), Spec(tx("Sıcaklık artışı ΔT (K)", "Temperature rise ΔT (K)"), 200, 1000, 200)];
    break; }
    case 4: {
    return [Spec(tx("Erime sıcaklığı T_m (°C)", "Melting temperature T_m (°C)"), 1200, 1600, 200), Spec(tx("Soğuma katsayısı k (1/s)", "Cooling constant k (1/s)"), 0.1, 0.5, 0.1), Spec(tx("Zaman t (s)", "Time t (s)"), 1, 5, 1)];
    break; }
    case 5: {
    return [Spec(tx("a (MPa)", "a (MPa)"), 800, 1200, 200), Spec(tx("Basquin üssü b", "Basquin exponent b"), 0.08, 0.16, 0.02), Spec(tx("Gerilim genliği azalması (%)", "Stress-amplitude reduction (%)"), 5, 20, 5), Spec(tx("Başlangıç ömrü N₀ = 10^m (m)", "Initial life N₀ = 10^m (m)"), 4, 6, 1)];
    break; }
    case 6: {
    return [Spec(tx("En iyi kalınlık t* (µm) - a buna göre kurulur", "Best thickness t* (µm) - a is built from it"), 20, 80, 10), Spec(tx("b (TL/µm)", "b (TL/µm)"), 1, 5, 1)];
    break; }
    case 8: {
    return [Spec(tx("Tepe gerilmesi σ_u (MPa)", "Peak stress σ_u (MPa)"), 200, 500, 100), Spec(tx("Tepe şekil değiştirmesi ε_u (%)", "Peak strain ε_u (%)"), 10, 20, 10), Spec(tx("İncelenen şekil değiştirme ε₁ (%)", "Strain of interest ε₁ (%)"), 2, 8, 2)];
    break; }
    case 9: {
    return [Spec(tx("Son değer Y (°C)", "Final value Y (°C)"), 40, 100, 20), Spec(tx("Zaman sabiti τ (s)", "Time constant τ (s)"), 1, 5, 1), Spec(tx("Zaman t₁ (s)", "Time t₁ (s)"), 1, 6, 1)];
    break; }
    case 10: {
    return [Spec(tx("Sönüm oranı ζ", "Damping ratio ζ"), 0.6, 0.8, 0.2), Spec(tx("Doğal frekans ω_n (rad/s)", "Natural frequency ω_n (rad/s)"), 5, 15, 5), Spec(tx("Basamak büyüklüğü A (mm)", "Step size A (mm)"), 1, 3, 1)];
    break; }
    case 11: {
    return [Spec(tx("En iyi hız V* (m/dk) - A buna göre kurulur", "Best speed V* (m/min) - A is built from it"), 50, 150, 50), Spec(tx("b (×10⁻⁴ TL·dk²/m²)", "b (×10⁻⁴ TL·min²/m²)"), 1, 4, 1)];
    break; }
    case 12: {
    return [Spec(tx("Dinamik yük sayısı C (kN)", "Dynamic load rating C (kN)"), 20, 40, 10), Spec(tx("Eşdeğer yük P (kN)", "Equivalent load P (kN)"), 4, 10, 2), Spec(tx("Yük artışı (%)", "Load increase (%)"), 5, 15, 5)];
    break; }
    case 13: {
    return [Spec(tx("Doğrusal rijitlik k (N/mm)", "Linear stiffness k (N/mm)"), 100, 300, 100), Spec(tx("Sertleşme katsayısı c (N/mm³)", "Hardening coefficient c (N/mm³)"), 10, 30, 10), Spec(tx("Sıkıştırma δ (mm)", "Compression δ (mm)"), 2, 5, 1)];
    break; }
    case 14: {
    return [Spec(tx("Tepe torku T_p (N·m)", "Peak torque T_p (N·m)"), 100, 300, 100), Spec(tx("Mil devri n (dev/dk)", "Shaft speed n (rpm)"), 300, 1200, 300)];
    break; }
    case 15: {
    return [Spec(tx("Gerilme aralığı Δσ (MPa)", "Stress range Δσ (MPa)"), 80, 120, 20), Spec(tx("Başlangıç çatlağı a₀ (mm)", "Initial crack a₀ (mm)"), 1, 3, 1), Spec(tx("Kritik çatlak a_c (mm)", "Critical crack a_c (mm)"), 15, 30, 5)];
    break; }
    default: {
    return [Spec(tx("Kesme hızı V₀ (m/dk)", "Cutting speed V₀ (m/min)"), 100, 200, 50), Spec(tx("Ölçülen takım ömrü T₀ (dk)", "Measured tool life T₀ (min)"), 30, 90, 30), Spec(tx("Taylor üssü n", "Taylor exponent n"), 0.2, 0.35, 0.05), Spec(tx("Hız artışı (%)", "Speed increase (%)"), 5, 15, 5)];
    break; }
    }
  }


  function Question(p) {
    let x = p.p;
    switch (p.scn) {
    case 0: {
    let a = x[0] / 1000.0, b = 2 * a * x[1];
    return tx(`Lazer toz yatağı füzyonunda eriyik havuzu derinliği lazer gücüne P (W) bağlı olarak d(P) = −${G(a)}P² + ${G(b)}P (µm) ile modelleniyor. Türev yardımıyla en büyük derinliği veren gücü ve bu maksimum derinliği bulun.`, `In laser powder-bed fusion the melt-pool depth depends on the laser power P (W) as d(P) = −${G(a)}P² + ${G(b)}P (µm). Use the derivative to find the power that gives the greatest depth and that maximum depth.`);
    break; }
    case 1: {
    return tx(`Hacimsel enerji yoğunluğu E = P/(v·h·t) (J/mm³). P = ${N2(x[0])} W, h = ${N2(x[1])} µm, t = ${N2(x[2])} µm sabit iken E, tarama hızı v (mm/s) cinsinden bir fonksiyondur. Tam füzyon için E ≥ ${N2(x[3])} J/mm³ gerekiyor. En büyük izin verilen tarama hızını ve orada dE/dv değerini bulun.`, `The volumetric energy density is E = P/(v·h·t) (J/mm³). With P = ${N2(x[0])} W, h = ${N2(x[1])} µm and t = ${N2(x[2])} µm fixed, E is a function of the scan speed v (mm/s). Full fusion needs E ≥ ${N2(x[3])} J/mm³. Find the largest allowed scan speed and the value of dE/dv there.`);
    break; }
    case 2: {
    let v0 = x[0] * x[0], v1 = x[2] * x[2];
    let vol0 = x[1] * x[0] * x[0] * x[0];
    return tx(`Tel ark eklemeli imalatta birikim hacmi V = k·v^(3/2) (mm³, v: tel besleme hızı mm/s) ile orantılıdır. v = ${N2(v0)} mm/s iken V = ${N2(vol0)} mm³ ölçüldü. k'yı bulun, v = ${N2(v1)} mm/s için V'yi tahmin edin ve orada hacmin hıza duyarlılığını (dV/dv) hesaplayın.`, `In wire-arc additive manufacturing the deposited volume is V = k·v^(3/2) (mm³, v = wire feed speed in mm/s). At v = ${N2(v0)} mm/s, V = ${N2(vol0)} mm³ was measured. Find k, predict V at v = ${N2(v1)} mm/s and compute the sensitivity dV/dv there.`);
    break; }
    case 3: {
    return tx(`${N2(x[0])} mm uzunluğundaki bir parça ΔT = ${N2(x[2])} K ısınıyor (α = ${N2(x[1])}×10⁻⁶ 1/K). Doğrusal yaklaşıklık ΔL ≈ α·L₀·ΔT ile gerçek doğrusal olmayan model L = L₀·e^(αΔT) karşılaştırılıyor. İkisi arasındaki hatayı bulun.`, `A part of length ${N2(x[0])} mm is heated by ΔT = ${N2(x[2])} K (α = ${N2(x[1])}×10⁻⁶ 1/K). The linear approximation ΔL ≈ α·L₀·ΔT is compared with the exact nonlinear model L = L₀·e^(αΔT). Find the error between the two.`);
    break; }
    case 4: {
    return tx(`Katılaşan bir eriyik havuzunun sıcaklık geçmişi T(t) = ${N2(x[0])}·e^(−${N2(x[1])}t) °C (t saniye). t = ${N2(x[2])} s anındaki anlık soğuma hızı dT/dt nedir?`, `The temperature history of a solidifying melt pool is T(t) = ${N2(x[0])}·e^(−${N2(x[1])}t) °C (t in seconds). What is the instantaneous cooling rate dT/dt at t = ${N2(x[2])} s?`);
    break; }
    case 5: {
    return tx(`Bir malzemenin yorulma eğrisi S = ${N2(x[0])}·N^(−${N2(x[1])}) MPa (N: kırılmaya kadar çevrim). Gerilim genliği %${N2(x[2])} azaltılırsa yorulma ömrü kaç kat artar? Türevle doğrusal tahmini kesin değerle karşılaştırın. (Başlangıç ömrü N₀ = 10^${N2(x[3])}.)`, `The fatigue curve of a material is S = ${N2(x[0])}·N^(−${N2(x[1])}) MPa (N: cycles to failure). If the stress amplitude is reduced by ${N2(x[2])}%, by what factor does the fatigue life grow? Compare the derivative-based linear estimate with the exact value. (Initial life N₀ = 10^${N2(x[3])}.)`);
    break; }
    case 6: {
    let b = x[1], a = x[1] * x[0] * x[0];
    return tx(`Bir parçanın toplam üretim maliyeti katman kalınlığı t (µm) ile C(t) = ${N2(a)}/t + ${N2(b)}·t (TL) biçiminde değişiyor (ilk terim makine süresi, ikinci terim merdiven etkisi/işleme payı). C'yi minimum yapan t'yi ve minimum maliyeti bulun.`, `The total production cost of a part varies with the layer thickness t (µm) as C(t) = ${N2(a)}/t + ${N2(b)}·t (TL) (first term machine time, second term stair-step/finishing allowance). Find the t that minimises C and the minimum cost.`);
    break; }
    case 8: {
    let su = x[0], eu = x[1] / 100, E = 2 * su / eu, c = su / (eu * eu);
    return tx(`Bir malzemenin idealleştirilmiş gerilme–şekil değiştirme eğrisi σ(ε) = ${G(E)}·ε − ${G(c)}·ε² (MPa; ε boyutsuz) ile verilmiştir (tepe: σ_u = ${N2(su)} MPa, ε_u = ${N2(x[1])} %). (a) Başlangıç eğimini (elastik modül E) ve ε₁ = ${N2(x[2])} % noktasındaki teğet modülünü, (b) ε₁'e kadar ve tepe noktasına kadar birim hacimde depolanan enerjiyi (eğri altındaki alan, MJ/m³) bulun.`, `The idealised stress–strain curve of a material is σ(ε) = ${G(E)}·ε − ${G(c)}·ε² (MPa; ε dimensionless), with peak σ_u = ${N2(su)} MPa at ε_u = ${N2(x[1])} %. (a) Find the initial slope (elastic modulus E) and the tangent modulus at ε₁ = ${N2(x[2])} %; (b) find the energy stored per unit volume (area under the curve, MJ/m³) up to ε₁ and up to the peak.`);
    break; }
    case 9: {
    return tx(`Bir sıcaklık sensörü basamak girişe birinci mertebeden yanıt verir: y(t) = ${N2(x[0])}·(1 − e^(−t/${N2(x[1])})) °C (t saniye; zaman sabiti τ = ${N2(x[1])} s). (a) t = 0'daki değişim hızını, (b) t = ${N2(x[2])} s'deki değeri ve hızı, (c) t → ∞ limitini, (d) %95'e ulaşma süresini, (e) son değerle yanıt arasındaki alanı ∫₀^∞ (Y − y) dt bulun.`, `A temperature sensor responds to a step input as a first-order system: y(t) = ${N2(x[0])}·(1 − e^(−t/${N2(x[1])})) °C (t in seconds; time constant τ = ${N2(x[1])} s). Find (a) the rate of change at t = 0, (b) the value and rate at t = ${N2(x[2])} s, (c) the limit as t → ∞, (d) the time to reach 95 %, (e) the area between the final value and the response, ∫₀^∞ (Y − y) dt.`);
    break; }
    case 10: {
    return tx(`Bir kütle–yay–sönümleyici sisteminin ${N2(x[2])} mm'lik basamak girişe yanıtı (ζ = ${N2(x[0])}, ω_n = ${N2(x[1])} rad/s): y(t) = ${N2(x[2])}·[1 − e^(−ζω_n t)(cos ω_d t + (ζω_n/ω_d) sin ω_d t)] mm, ω_d = ω_n√(1 − ζ²). y′(t)'yi alıp sıfıra eşitleyerek tepe zamanı t_p'yi, tepe değerini ve yüzde aşımı bulun.`, `A mass–spring–damper system responds to a ${N2(x[2])} mm step input (ζ = ${N2(x[0])}, ω_n = ${N2(x[1])} rad/s) as y(t) = ${N2(x[2])}·[1 − e^(−ζω_n t)(cos ω_d t + (ζω_n/ω_d) sin ω_d t)] mm, ω_d = ω_n√(1 − ζ²). Differentiate y(t) and set y′ = 0 to find the peak time t_p, the peak value and the percent overshoot.`);
    break; }
    case 11: {
    let vs = x[0], b = x[1], a = 2 * b * vs * vs * vs / 10000;
    return tx(`Frezelemede parça başına maliyet kesme hızı V (m/dk) ile C(V) = ${G(a)}/V + ${N2(b)}×10⁻⁴·V² (TL) biçiminde değişiyor (ilk terim işleme süresi maliyeti, ikinci terim n = 1/3 için takım aşınma/değiştirme maliyeti). C'yi minimum yapan V'yi ve en düşük parça maliyetini bulun.`, `In milling the cost per part varies with the cutting speed V (m/min) as C(V) = ${G(a)}/V + ${N2(b)}×10⁻⁴·V² (TL) (first term machining-time cost, second term tool wear/replacement cost for n = 1/3). Find the V that minimises C and the lowest cost per part.`);
    break; }
    case 12: {
    return tx(`Bir rulmanın nominal ömrü L₁₀ = (C/P)³ (milyon devir) ile verilir; C = ${N2(x[0])} kN dinamik yük sayısı, P = ${N2(x[1])} kN eşdeğer yük. (a) L₁₀'u ve dL/dP'yi bulun; (b) yük %${N2(x[2])} artarsa ömürdeki değişimi türevle (doğrusal yaklaşım) tahmin edip kesin değerle karşılaştırın.`, `The rated life of a bearing is L₁₀ = (C/P)³ (million revolutions), with dynamic load rating C = ${N2(x[0])} kN and equivalent load P = ${N2(x[1])} kN. (a) Find L₁₀ and dL/dP; (b) if the load rises by ${N2(x[2])} %, estimate the change in life with the derivative (linear approximation) and compare with the exact value.`);
    break; }
    case 13: {
    return tx(`Bir cıvata–conta bağlantısı (ilerleyen sertleşmeli yay) için kuvvet–yer değiştirme bağıntısı F(x) = ${N2(x[0])}x + ${N2(x[1])}x³ (N; x mm). δ = ${N2(x[2])} mm sıkıştırmada (a) kuvveti, (b) teğet rijitliği dF/dx'i, (c) depolanan enerjiyi W = ∫₀^δ F dx bulun.`, `For a bolt–gasket joint (a progressive hardening spring) the force–displacement relation is F(x) = ${N2(x[0])}x + ${N2(x[1])}x³ (N; x in mm). At a compression δ = ${N2(x[2])} mm find (a) the force, (b) the tangent stiffness dF/dx, (c) the stored energy W = ∫₀^δ F dx.`);
    break; }
    case 14: {
    return tx(`Tek silindirli bir motorun milinde güç strokundaki tork T(θ) = ${N2(x[0])}·sin θ N·m (0 ≤ θ ≤ π), yarım turun geri kalanında 0 kabul edilir (çevrim = 2π). Mil ${N2(x[1])} dev/dk ile dönüyor. (a) Çevrim başına işi W = ∫T dθ, (b) ortalama torku, (c) gücü, (d) ortalamanın üzerindeki enerji fazlası ΔE'yi bulun; volan için I = ΔE/(C_s·ω²), C_s = 0,05.`, `In the shaft of a single-cylinder engine the torque during the power stroke is T(θ) = ${N2(x[0])}·sin θ N·m (0 ≤ θ ≤ π) and 0 for the rest of the cycle (cycle = 2π). The shaft turns at ${N2(x[1])} rpm. Find (a) the work per cycle W = ∫T dθ, (b) the mean torque, (c) the power, (d) the energy surplus ΔE above the mean; size the flywheel with I = ΔE/(C_s·ω²), C_s = 0.05.`);
    break; }
    case 15: {
    return tx(`Paris yasası: da/dN = C·(ΔK)^m, m = 4, C = 1×10⁻¹¹ (m/çevrim, ΔK: MPa√m), ΔK = Δσ√(πa). Δσ = ${N2(x[0])} MPa, başlangıç çatlağı a₀ = ${N2(x[1])} mm, kritik çatlak a_c = ${N2(x[2])} mm. Çatlağı a₀'dan a_c'ye büyütmek için gereken çevrim sayısını N_f = ∫ da/(C·ΔK^m) integraliyle bulun.`, `Paris law: da/dN = C·(ΔK)^m, m = 4, C = 1×10⁻¹¹ (m/cycle, ΔK in MPa√m), ΔK = Δσ√(πa). With Δσ = ${N2(x[0])} MPa, initial crack a₀ = ${N2(x[1])} mm and critical crack a_c = ${N2(x[2])} mm, find the number of cycles to grow the crack from a₀ to a_c with the integral N_f = ∫ da/(C·ΔK^m).`);
    break; }
    default: {
    return tx(`Taylor takım ömrü denklemi V·T^n = C (V: kesme hızı m/dk, T: takım ömrü dk). V₀ = ${N2(x[0])} m/dk iken T₀ = ${N2(x[1])} dk ölçüldü, n = ${N2(x[2])}. Kesme hızı %${N2(x[3])} artırılırsa takım ömrü yaklaşık kaç dakika ve yüzde değişir? Türev (diferansiyel) tahminini kesin değerle karşılaştırın.`, `Taylor's tool-life equation is V·T^n = C (V: cutting speed m/min, T: tool life min). At V₀ = ${N2(x[0])} m/min the tool life was T₀ = ${N2(x[1])} min, with n = ${N2(x[2])}. If the cutting speed is raised by ${N2(x[3])}%, by roughly how many minutes and what percent does the tool life change? Compare the derivative (differential) estimate with the exact value.`);
    break; }
    }
  }


  function MeaningExtra(scn) {
    switch (scn) {
    case 0: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Derinlik d (µm veya mm), lazer gücü P (W). d(P) bir parabol (tepe noktası) ise maksimum derinlik ya da optimum güç, türevin sıfır olduğu noktadadır." + "\n" + "5 ADIM" + "\n" + "1. d(P) fonksiyonunu yaz. 2. d′(P) = 0. 3. d″ < 0 → maksimum. 4. Parabol için P* = −b/(2a). 5. Cevabı W ve µm ile yaz." + "\n" + "TUZAK: Fiziksel P aralığının dışına çıkan tepe noktası geçerli değildir (anahtar deliği ve sıçrama).", "UNITS AND PHYSICAL MEANING" + "\n" + "Depth d (µm or mm), laser power P (W). If d(P) is a parabola (vertex), the maximum depth or optimum power occurs where the derivative is zero." + "\n" + "5 STEPS" + "\n" + "1. Write d(P). 2. d′(P) = 0. 3. d″ < 0 → maximum. 4. For a parabola P* = −b/(2a). 5. State the answer in W and µm." + "\n" + "PITFALL: a vertex outside the physical P range is not valid (keyhole formation and spatter).");
    break; }
    case 1: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "E_v = P/(v·h·t) J/mm³: P lazer gücü (W), v tarama hızı (mm/s), h tarama aralığı (mm), t katman kalınlığı (mm). v paydada olduğundan hız arttıkça enerji yoğunluğu azalır (rasyonel fonksiyon, hiperbol)." + "\n" + "YÖNTEM" + "\n" + "1. E_v(v) = C/v. 2. Türev: dE_v/dv = −C/v² < 0 (hızla azalır). 3. Hedef E_v'den v = C/E_v çöz." + "\n" + "TUZAK: Birimleri (mm, mm/s) tutarlı tutun; v → 0 iken E_v → ∞ (aşırı ısınma).", "UNITS AND PHYSICAL MEANING" + "\n" + "E_v = P/(v·h·t) J/mm³: P laser power (W), v scan speed (mm/s), h hatch spacing (mm), t layer thickness (mm). Since v is in the denominator, energy density falls as speed rises (rational function, hyperbola)." + "\n" + "METHOD" + "\n" + "1. E_v(v) = C/v. 2. Derivative: dE_v/dv = −C/v² < 0 (decreasing). 3. For a target E_v solve v = C/E_v." + "\n" + "PITFALL: keep units (mm, mm/s) consistent; as v → 0, E_v → ∞ (overheating).");
    break; }
    case 2: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "V = k·v^(3/2): v tel besleme/ilerleme hızı, V birikme hacmi. Duyarlılık dV/dv = (3/2)·k·v^(1/2): hızdaki birim değişimin hacme etkisi. Bağıl duyarlılık (dV/V)/(dv/v) = 3/2: hız %1 artarsa hacim yaklaşık %1,5 artar." + "\n" + "YÖNTEM" + "\n" + "1. Kuvvet kuralı: d/dv v^(3/2) = (3/2)v^(1/2). 2. Çalışma noktasında değerlendir. 3. ΔV ≈ (dV/dv)·Δv (diferansiyel)." + "\n" + "TUZAK: Δv büyükse diferansiyel yaklaşımı kötüleşir.", "UNITS AND PHYSICAL MEANING" + "\n" + "V = k·v^(3/2): v is wire-feed/travel speed, V the deposited volume. Sensitivity dV/dv = (3/2)·k·v^(1/2): effect of a unit change of speed on volume. Relative sensitivity (dV/V)/(dv/v) = 3/2: a 1 % rise in speed raises volume by about 1.5 %." + "\n" + "METHOD" + "\n" + "1. Power rule: d/dv v^(3/2) = (3/2)v^(1/2). 2. Evaluate at the operating point. 3. ΔV ≈ (dV/dv)·Δv (differential)." + "\n" + "PITFALL: the differential approximation worsens for large Δv.");
    break; }
    case 3: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "α: 1/°C (çelik ≈ 12·10⁻⁶), L₀ mm, ΔT °C. Yaklaşık ΔL ≈ α·L₀·ΔT teğet doğrusudur; gerçek model L₀·e^(αΔT) üsteldir ve yukarı bükeydir, bu yüzden doğrusal formül hafifçe EKSİK tahmin eder." + "\n" + "YÖNTEM" + "\n" + "1. a = 0 (ΔT = 0) noktasında linearize et. 2. L ≈ L₀(1 + αΔT). 3. Hata ≈ ½(αΔT)²L₀." + "\n" + "TUZAK: Sıcaklık farkı büyükse hata artar; tolerans mikrometre düzeyindeyse ikinci mertebe terime bakın.", "UNITS AND PHYSICAL MEANING" + "\n" + "α: 1/°C (steel ≈ 12·10⁻⁶), L₀ mm, ΔT °C. The estimate ΔL ≈ α·L₀·ΔT is the tangent line; the exact model L₀·e^(αΔT) is exponential and concave up, so the linear formula slightly UNDERestimates." + "\n" + "METHOD" + "\n" + "1. Linearise at a = 0 (ΔT = 0). 2. L ≈ L₀(1 + αΔT). 3. Error ≈ ½(αΔT)²L₀." + "\n" + "PITFALL: the error grows with large temperature differences; for micrometre tolerances look at the second-order term.");
    break; }
    case 4: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Soğuma hızı dT/dt: °C/s (negatif = soğuma). Katılaşma sırasında mikroyapı inceliği soğuma hızına bağlıdır: hızlı soğuma → ince taneler → yüksek mukavemet. V·T^n = sabit gibi bir bağıntıda ilişkili değişim: her iki tarafı zamana göre türet." + "\n" + "YÖNTEM" + "\n" + "1. Bağıntıyı yaz. 2. d/dt al (zincir kuralı). 3. Anlık değerleri SONRA yerine koy. 4. İşaret ve birim yorumla." + "\n" + "TUZAK: Sayıları türevden önce yerine koymayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "Cooling rate dT/dt: °C/s (negative = cooling). During solidification microstructure fineness depends on the cooling rate: fast cooling → fine grains → higher strength. For a relation like V·Tⁿ = const, this is a related-rates problem: differentiate both sides with respect to time." + "\n" + "METHOD" + "\n" + "1. Write the relation. 2. Take d/dt (chain rule). 3. Substitute the instantaneous values AFTER. 4. Interpret sign and unit." + "\n" + "PITFALL: do not substitute numbers before differentiating.");
    break; }
    case 5: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "S–N eğrisi: gerilme genliği S (MPa) ile ömür N (çevrim). Genellikle logaritmik/kuvvet yasası: S = a·N^(−b). Gerilmeyi biraz düşürmek ömrü katlayarak artırabilir; duyarlılık dN/dS ile ölçülür." + "\n" + "YÖNTEM" + "\n" + "1. N(S) = (a/S)^(1/b) biçimine getir. 2. dN/dS türevini al. 3. ΔN ≈ (dN/dS)·ΔS (doğrusal yaklaşım)." + "\n" + "TUZAK: N çok büyük sayıdır (10⁶…10⁷), logaritmik eksende düşünün; türev negatiftir (S artarsa ömür azalır).", "UNITS AND PHYSICAL MEANING" + "\n" + "S–N curve: stress amplitude S (MPa) versus life N (cycles). Usually a power law: S = a·N^(−b). A slightly lower stress can multiply life; sensitivity is measured by dN/dS." + "\n" + "METHOD" + "\n" + "1. Write N(S) = (a/S)^(1/b). 2. Take dN/dS. 3. ΔN ≈ (dN/dS)·ΔS (linear approximation)." + "\n" + "PITFALL: N is huge (10⁶…10⁷), think on a log axis; the derivative is negative (higher S, shorter life).");
    break; }
    case 6: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Toplam maliyet C(t) = (katman sayısı maliyeti) + (kalınlık/kalite maliyeti): ince katman → çok katman → uzun süre; kalın katman → kötü yüzey/düzeltme maliyeti. Birim: para (₺ veya $)." + "\n" + "5 ADIM" + "\n" + "1. C(t) = a/t + b·t gibi iki terimi yaz. 2. C′(t) = −a/t² + b = 0 → t* = √(a/b). 3. C″ = 2a/t³ > 0 → minimum. 4. Sonuç t* mm olarak. 5. Üretilebilir aralıkta mı kontrol et." + "\n" + "TUZAK: Makinenin alt/üst kalınlık sınırlarını unutmayın (uç nokta).", "UNITS AND PHYSICAL MEANING" + "\n" + "Total cost C(t) = (cost of the number of layers) + (cost of thickness/quality): thin layers → many layers → long time; thick layers → poor surface/rework cost. Unit: currency." + "\n" + "5 STEPS" + "\n" + "1. Write two terms such as C(t) = a/t + b·t. 2. C′(t) = −a/t² + b = 0 → t* = √(a/b). 3. C″ = 2a/t³ > 0 → minimum. 4. Result t* in mm. 5. Check it lies in the manufacturable range." + "\n" + "PITFALL: do not forget the machine's minimum/maximum thickness (endpoints).");
    break; }
    case 7: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Taylor denklemi V·Tⁿ = C: V kesme hızı (m/dk), T takım ömrü (dk), n ≈ 0,1–0,5 malzemeye bağlıdır. Hız biraz artınca ömür çarpıcı düşer. İlişkili değişim: dT/dV = −T/(n·V)." + "\n" + "YÖNTEM" + "\n" + "1. V·Tⁿ = C'yi V'ye göre türet (örtük türev). 2. T′ = dT/dV çöz. 3. Değerleri yerine koy." + "\n" + "TUZAK: Kesme hızını %10 artırmak ömrü kabaca %10/n kadar düşürür (örn. n = 0,25 → ~%40). Birim: dk/(m/dk).", "UNITS AND PHYSICAL MEANING" + "\n" + "Taylor's equation V·Tⁿ = C: V cutting speed (m/min), T tool life (min), n ≈ 0.1–0.5 depends on the material. A small speed rise cuts life dramatically. Related change: dT/dV = −T/(n·V)." + "\n" + "METHOD" + "\n" + "1. Differentiate V·Tⁿ = C with respect to V (implicit). 2. Solve T′ = dT/dV. 3. Substitute the values." + "\n" + "PITFALL: raising cutting speed by 10 % lowers life by roughly 10 %/n (e.g. n = 0.25 → about 40 %). Unit: min/(m/min).");
    break; }
    case 8: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "σ (MPa = N/mm²), ε boyutsuz (mm/mm ya da %). Eğrinin eğimi dσ/dε bir MODÜLDÜR (MPa): başlangıçta elastik modül E, sonra teğet modül. Eğri altındaki alan ∫σ dε birim hacimde depolanan enerjidir: MPa = MJ/m³ (tokluk / dayanıklılık modülü)." + "\n" + "YÖNTEM" + "\n" + "1. Eğimi türevle bul: E = σ′(0). 2. σ′ = 0 → tepe (UTS). 3. Enerji = ∫σ dε (kuvvet kuralı ile terim terim). 4. Birimleri MPa·(boyutsuz) = MJ/m³ olarak yaz." + "\n" + "TUZAK: ε yüzde verilmişse integralden önce 100'e bölün; gerçek çeliklerde elastik bölge çok dik, plastik bölge uzundur.", "UNITS AND PHYSICAL MEANING" + "\n" + "σ (MPa = N/mm²), ε dimensionless (mm/mm or %). The slope dσ/dε is a MODULUS (MPa): the elastic modulus E at the start, then the tangent modulus. The area under the curve ∫σ dε is the energy stored per unit volume: MPa = MJ/m³ (toughness / modulus of resilience)." + "\n" + "METHOD" + "\n" + "1. Get the slope from the derivative: E = σ′(0). 2. σ′ = 0 → peak (UTS). 3. Energy = ∫σ dε (power rule term by term). 4. Units MPa·(dimensionless) = MJ/m³." + "\n" + "PITFALL: if ε is given in percent divide by 100 before integrating; real steels have a very steep elastic part and a long plastic part.");
    break; }
    case 9: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Birinci mertebe sistem: τ·y′ + y = Y (basamak girişi). τ zaman sabitidir (s): yanıt τ'da son değerin %63,2'sine, ≈3τ'da %95'ine, ≈4τ'da %98'ine ulaşır. y′(0) = Y/τ başlangıç hızıdır (°C/s) ve t = 0'daki teğet son değere t = τ'da ulaşır." + "\n" + "YÖNTEM" + "\n" + "1. y′ zincir kuralı ile. 2. t = 0'da değerlendir. 3. t → ∞ limiti (e^(−t/τ) → 0). 4. %95 için e^(−t/τ) = 0,05 çöz (logaritma). 5. Hata alanı için genelleştirilmiş (has) integral." + "\n" + "TUZAK: τ'yu sistemin 'bitiş süresi' sanmayın; yanıt asla tam Y'ye ulaşmaz, yalnızca limitte.", "UNITS AND PHYSICAL MEANING" + "\n" + "First-order system: τ·y′ + y = Y (step input). τ is the time constant (s): the response reaches 63.2 % of the final value at τ, 95 % at ≈3τ and 98 % at ≈4τ. y′(0) = Y/τ is the initial rate (°C/s) and the tangent at t = 0 reaches the final value at t = τ." + "\n" + "METHOD" + "\n" + "1. y′ by the chain rule. 2. Evaluate at t = 0. 3. Limit t → ∞ (e^(−t/τ) → 0). 4. For 95 % solve e^(−t/τ) = 0.05 (logarithm). 5. For the error area use an improper integral." + "\n" + "PITFALL: τ is not the 'finishing time'; the response never reaches Y exactly, only in the limit.");
    break; }
    case 10: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "ζ sönüm oranı (boyutsuz), ω_n doğal frekans (rad/s), ω_d sönümlü frekans (rad/s). Yanıtın ilk tepesi y′(t) = 0 noktasındadır; tepe zamanı t_p (s) ve aşım M_p = e^(−πζ/√(1−ζ²)) (boyutsuz, ×100 = %). Aşım yalnızca ζ'ya bağlıdır; ω_n büyüdükçe tepe daha erken gelir." + "\n" + "YÖNTEM" + "\n" + "1. y′'yi çarpım kuralıyla al ve sadeleştir. 2. e^(−σt) > 0 olduğundan sin ω_d t = 0 çöz. 3. İlk pozitif kök ω_d t = π. 4. İşaret değişimiyle maksimum olduğunu doğrula. 5. y(t_p)'ye yerine koy." + "\n" + "TUZAK: ω_n ile ω_d'yi karıştırmayın; ilk kök π'dir, 2π ikinci (en küçük) çukurdur.", "UNITS AND PHYSICAL MEANING" + "\n" + "ζ is the damping ratio (dimensionless), ω_n the natural frequency (rad/s), ω_d the damped frequency (rad/s). The first peak of the response lies at y′(t) = 0; peak time t_p (s) and overshoot M_p = e^(−πζ/√(1−ζ²)) (dimensionless, ×100 = %). Overshoot depends on ζ only; a larger ω_n brings the peak earlier." + "\n" + "METHOD" + "\n" + "1. Differentiate y with the product rule and simplify. 2. Since e^(−σt) > 0 solve sin ω_d t = 0. 3. The first positive root is ω_d t = π. 4. Confirm the maximum from the sign change. 5. Substitute into y(t_p)." + "\n" + "PITFALL: do not mix up ω_n and ω_d; the first root is π, and 2π is the next (smallest) trough.");
    break; }
    case 11: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Parça başına maliyet iki zıt etkinin toplamıdır: hızlı kesme → kısa işleme süresi (A/V azalır) ama kısa takım ömrü (Taylor: T ∝ V^(−1/n)) → takım maliyeti artar (B·V²). Birim: TL/parça; V m/dk." + "\n" + "YÖNTEM" + "\n" + "1. C(V) = A·V⁻¹ + B·V². 2. C′ = −A/V² + 2BV = 0 → V³ = A/(2B). 3. C″ = 2A/V³ + 2B > 0 → minimum. 4. C(V*) hesapla. 5. Makine hız sınırını kontrol et." + "\n" + "TUZAK: Minimum maliyet hızı, maksimum üretim hızından düşüktür; ikisini karıştırmayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "Cost per part is the sum of two opposing effects: faster cutting → shorter machining time (A/V falls) but shorter tool life (Taylor: T ∝ V^(−1/n)) → higher tool cost (B·V²). Unit: TL/part; V in m/min." + "\n" + "METHOD" + "\n" + "1. C(V) = A·V⁻¹ + B·V². 2. C′ = −A/V² + 2BV = 0 → V³ = A/(2B). 3. C″ = 2A/V³ + 2B > 0 → minimum. 4. Evaluate C(V*). 5. Check the machine speed limit." + "\n" + "PITFALL: the minimum-cost speed is lower than the maximum-production-rate speed; do not confuse the two.");
    break; }
    case 12: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "L₁₀ milyon devir (güvenilirlik %90), C ve P kN. Bilyalı rulmanda üs 3 (makaralıda 10/3). dL/dP birimi milyon devir / kN ve NEGATİFTİR. Bağıl duyarlılık (dL/L)/(dP/P) = −3: yük %1 artarsa ömür ≈ %3 azalır." + "\n" + "YÖNTEM" + "\n" + "1. L = C³·P⁻³. 2. L′ = −3C³P⁻⁴ = −3L/P. 3. ΔL ≈ L′·ΔP. 4. Kesin: L·(1+r)⁻³ ile karşılaştır." + "\n" + "TUZAK: Doğrusal tahmin ömür kaybını FAZLA gösterir (L(P) konvekstir); büyük yük artışlarında kesin formülü kullanın.", "UNITS AND PHYSICAL MEANING" + "\n" + "L₁₀ in million revolutions (90 % reliability), C and P in kN. The exponent is 3 for ball bearings (10/3 for roller bearings). dL/dP has unit million revolutions per kN and is NEGATIVE. The relative sensitivity (dL/L)/(dP/P) = −3: a 1 % load rise cuts life by about 3 %." + "\n" + "METHOD" + "\n" + "1. L = C³·P⁻³. 2. L′ = −3C³P⁻⁴ = −3L/P. 3. ΔL ≈ L′·ΔP. 4. Compare with the exact L·(1+r)⁻³." + "\n" + "PITFALL: the linear estimate OVERstates the life loss (L(P) is convex); for large load rises use the exact formula.");
    break; }
    case 13: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "F (N), x (mm). dF/dx teğet rijitliktir (N/mm): bu bağlantıda yer değiştirmeyle büyür (sertleşen yay, conta sıkışması). Eğri altındaki alan ∫F dx iştir: N·mm = mJ (1000 N·mm = 1 J)." + "\n" + "YÖNTEM" + "\n" + "1. F(δ) yerine koy. 2. dF/dx = k + 3cx². 3. W = ∫₀^δ (kx + cx³) dx = kδ²/2 + cδ⁴/4. 4. Birimi mJ → J çevir." + "\n" + "TUZAK: Doğrusal yay formülü kδ²/2 sertleşen bağlantıda enerjiyi EKSİK verir; W < F(δ)·δ/2 (F konveks) olduğuna dikkat edin.", "UNITS AND PHYSICAL MEANING" + "\n" + "F (N), x (mm). dF/dx is the tangent stiffness (N/mm): in this joint it grows with displacement (hardening spring, gasket compression). The area under the curve ∫F dx is work: N·mm = mJ (1000 N·mm = 1 J)." + "\n" + "METHOD" + "\n" + "1. Substitute F(δ). 2. dF/dx = k + 3cx². 3. W = ∫₀^δ (kx + cx³) dx = kδ²/2 + cδ⁴/4. 4. Convert mJ → J." + "\n" + "PITFALL: the linear-spring formula kδ²/2 UNDERestimates the energy of a hardening joint; note that W < F(δ)·δ/2 because F is convex.");
    break; }
    case 14: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "T (N·m), θ (rad), ∫T dθ iş (N·m = J). Ortalama tork = çevrim işi / 2π. Güç P = T_ort·ω (W), ω = 2πn/60 (rad/s). Anlık tork ortalamanın üstüne çıkınca mil hızlanır; bu fazla enerji ΔE volanda depolanır: I = ΔE/(C_s·ω²) (kg·m²)." + "\n" + "YÖNTEM" + "\n" + "1. W = ∫₀^π T_p sin θ dθ = 2T_p. 2. T_ort = W/(2π). 3. T = T_ort kesişimlerini sin θ = 1/π ile bul. 4. ΔE = ∫(T − T_ort) dθ bu aralıkta. 5. Volan eylemsizliği." + "\n" + "TUZAK: Ortalama alırken 2π'ye bölün (π'ye değil): boş yarım tur da çevrimin parçasıdır.", "UNITS AND PHYSICAL MEANING" + "\n" + "T (N·m), θ (rad), ∫T dθ is work (N·m = J). Mean torque = cycle work / 2π. Power P = T_mean·ω (W), ω = 2πn/60 (rad/s). When the instantaneous torque exceeds the mean the shaft speeds up; this surplus energy ΔE is stored in the flywheel: I = ΔE/(C_s·ω²) (kg·m²)." + "\n" + "METHOD" + "\n" + "1. W = ∫₀^π T_p sin θ dθ = 2T_p. 2. T_mean = W/(2π). 3. Find where T = T_mean from sin θ = 1/π. 4. ΔE = ∫(T − T_mean) dθ over that interval. 5. Flywheel inertia." + "\n" + "PITFALL: divide by 2π (not π) when averaging: the idle half revolution belongs to the cycle too.");
    break; }
    case 15: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "da/dN çatlak büyüme hızı (m/çevrim), ΔK gerilme şiddeti aralığı (MPa√m), a çatlak boyu (m). Paris yasası kararlı büyüme bölgesinde log–log doğrudur. Çevrim sayısı değişkenlerine ayrılarak integralle bulunur: N_f = ∫ da / (C·ΔK^m)." + "\n" + "YÖNTEM" + "\n" + "1. ΔK^4 = Δσ⁴π²a² yerine koy: da/dN = K′a². 2. Değişkenlere ayır: dN = da/(K′a²). 3. ∫a⁻² da = −1/a. 4. Sınırlar a₀ → a_c (m!). 5. Sonuç = (1/K′)(1/a₀ − 1/a_c)." + "\n" + "TUZAK: mm ↔ m dönüşümünü unutmayın; ömrün çoğu çatlak KÜÇÜKKEN harcanır ve Δσ'ya üs 4 ile çok duyarlıdır.", "UNITS AND PHYSICAL MEANING" + "\n" + "da/dN is the crack growth rate (m/cycle), ΔK the stress-intensity range (MPa√m), a the crack length (m). The Paris law is a straight line on log–log axes in the stable growth region. The number of cycles follows by separating variables and integrating: N_f = ∫ da / (C·ΔK^m)." + "\n" + "METHOD" + "\n" + "1. Substitute ΔK^4 = Δσ⁴π²a²: da/dN = K′a². 2. Separate variables: dN = da/(K′a²). 3. ∫a⁻² da = −1/a. 4. Limits a₀ → a_c (in m!). 5. Result = (1/K′)(1/a₀ − 1/a_c)." + "\n" + "PITFALL: do not forget the mm ↔ m conversion; most of the life is spent while the crack is SMALL, and life is very sensitive to Δσ (exponent 4).");
    break; }
    default: {
    return "";
    break; }
    }
  }


  function MeaningBase(p) {
    switch (p.scn) {
    case 0: {
    return tx("Derinlik güce göre aşağı açılan bir paraboldür. 'En büyük derinlik' bir OPTİMİZASYON sorusudur: türevi sıfır yapan noktayı ararız. " + "d'(P) = 0 kritik noktayı verir; ikinci türev negatifse bu nokta maksimumdur. Sonra P değeri d(P)'de yerine konarak maksimum derinlik bulunur. " + "Matematiksel istek: d'(P) = 0 denklemini çöz, ikinci türev testi yap, d(P₀)'ı hesapla.", "Depth is a downward-opening parabola in the power. 'The greatest depth' is an OPTIMISATION question: we look for the point where the derivative is zero. " + "d'(P) = 0 gives the critical point; if the second derivative is negative it is a maximum. The value of P is then substituted back into d(P) to get the maximum depth. " + "Mathematical task: solve d'(P) = 0, do the second-derivative test, evaluate d(P₀).");
    break; }
    case 1: {
    return tx("E, v'nin paydada olduğu bir RASYONEL fonksiyondur: v büyüdükçe enerji yoğunluğu düşer. 'E ≥ E_min olacak en büyük hız' bir EŞİTSİZLİK/denklem sorusudur: E(v) = E_min denklemini v için çözeriz. " + "dE/dv türevi (kuvvet kuralıyla, E = c·v⁻¹) hızı biraz artırınca enerji yoğunluğunun ne kadar düştüğünü verir. " + "Matematiksel istek: P/(v·h·t) = E_min denklemini çöz, sonra E'nin türevini o v'de hesapla.", "E is a RATIONAL function with v in the denominator: the faster the scan, the lower the energy density. 'The largest speed with E ≥ E_min' is an equation/inequality question: solve E(v) = E_min for v. " + "The derivative dE/dv (power rule, E = c·v⁻¹) tells how fast the energy density drops when the speed is increased slightly. " + "Mathematical task: solve P/(v·h·t) = E_min, then evaluate the derivative of E at that v.");
    break; }
    case 2: {
    return tx("V = k·v^(3/2) bir KUVVET fonksiyonudur. Bir veri noktası k'yı verir (cebirsel denklem). Duyarlılık sorusu ise TÜREVdir: dV/dv, hız 1 mm/s artınca hacmin yaklaşık ne kadar artacağını söyler. " + "Kuvvet kuralı: d/dv(v^(3/2)) = (3/2)·v^(1/2). " + "Matematiksel istek: (1) k'yı çöz, (2) V(v₁)'i hesapla, (3) V'(v₁)'i bul.", "V = k·v^(3/2) is a POWER function. One data point gives k (an algebraic equation). The sensitivity question is a DERIVATIVE: dV/dv says by roughly how much V grows when v grows by 1 mm/s. " + "Power rule: d/dv(v^(3/2)) = (3/2)·v^(1/2). " + "Mathematical task: (1) solve for k, (2) evaluate V(v₁), (3) find V'(v₁).");
    break; }
    case 3: {
    return tx("Doğrusal yaklaşıklık ΔL ≈ αL₀ΔT aslında L(T) eğrisinin ΔT = 0'daki TEĞET DOĞRUSUDUR (birinci mertebeden Taylor). Gerçek model e^(αΔT) içerir ve teğetten hafifçe sapar. " + "Hata = kesin − doğrusal ≈ L₀(αΔT)²/2: ikinci türevin oluşturduğu kalan terim. " + "Matematiksel istek: teğet doğrusu (diferansiyel) ile gerçek fonksiyon değerini karşılaştır, hatayı hesapla.", "The linear approximation ΔL ≈ αL₀ΔT is in fact the TANGENT LINE of L(T) at ΔT = 0 (first-order Taylor). The exact model contains e^(αΔT) and departs slightly from the tangent. " + "Error = exact − linear ≈ L₀(αΔT)²/2: the leftover term produced by the second derivative. " + "Mathematical task: compare the tangent line (differential) with the true function value and compute the error.");
    break; }
    case 4: {
    return tx("'Anlık soğuma hızı' sıcaklığın zamana göre ANLIK değişim hızı, yani TÜREVdir: dT/dt. T(t) üstel bir fonksiyon olduğundan ZİNCİR KURALI gerekir: d/dt e^(−kt) = −k·e^(−kt). " + "Sonuç −k·T(t) çıkar: soğuma hızı sıcaklıkla orantılıdır (Newton soğuma yasası). " + "Matematiksel istek: T'(t)'yi bul ve verilen t'de değerini hesapla.", "'Instantaneous cooling rate' means the INSTANTANEOUS rate of change of temperature with time: the DERIVATIVE dT/dt. T(t) is exponential, so the CHAIN RULE is needed: d/dt e^(−kt) = −k·e^(−kt). " + "The result is −k·T(t): the cooling rate is proportional to the temperature (Newton's law of cooling). " + "Mathematical task: find T'(t) and evaluate it at the given t.");
    break; }
    case 5: {
    return tx("S = a·N^(−b) bir KUVVET yasasıdır. Log-log ölçekte doğrusaldır: log S = log a − b·log N, eğim = −b. Türev dS/dN = −b·S/N, yani bağıl değişimler arasında dN/N ≈ −(1/b)·dS/S bağı vardır. " + "Bu, küçük gerilim azalışının ömürde ne kadar bağıl artış yaptığını verir; büyük azalışlarda kesin değer için üs alma gerekir. " + "Matematiksel istek: N'yi S'nin fonksiyonu olarak çöz (N = (S/a)^(−1/b)), oran ve türev tahminini karşılaştır.", "S = a·N^(−b) is a POWER LAW. On log–log axes it is a straight line: log S = log a − b·log N, slope = −b. The derivative dS/dN = −b·S/N gives the relation between relative changes dN/N ≈ −(1/b)·dS/S. " + "This says how much relative life gain a small stress decrease produces; for larger decreases the exact value needs the power. " + "Mathematical task: solve N as a function of S (N = (S/a)^(−1/b)), compare the ratio with the derivative estimate.");
    break; }
    case 6: {
    return tx("İnce katman = çok katman = uzun makine süresi (a/t terimi büyür); kalın katman = pürüzlü yüzey ve işleme payı (b·t terimi büyür). İki etki zıttır, bu yüzden bir en iyi kalınlık vardır. " + "Bu bir OPTİMİZASYON sorusudur: C'(t) = 0 denklemini çöz, C''(t) > 0 ile minimum olduğunu doğrula, C(t*)'ı hesapla. " + "Matematiksel istek: C(t) = a/t + b·t fonksiyonunun (t > 0) mutlak minimumu.", "Thin layers = many layers = long machine time (the a/t term grows); thick layers = rough surface and finishing allowance (the b·t term grows). The two effects oppose each other, so a best thickness exists. " + "This is an OPTIMISATION question: solve C'(t) = 0, confirm a minimum with C''(t) > 0, evaluate C(t*). " + "Mathematical task: the absolute minimum of C(t) = a/t + b·t for t > 0.");
    break; }
    case 8: {
    return tx("'Başlangıç eğimi' ve 'teğet modülü' TÜREV sorularıdır: σ′(ε). 'Depolanan enerji' ise eğri altındaki ALAN, yani BELİRLİ İNTEGRALdir: ∫₀^ε σ dε (kuvvet kuralının tersi). Tepe noktası σ′(ε) = 0 koşuludur. " + "Matematiksel istek: (1) σ′(0) ve σ′(ε₁), (2) σ′ = 0 ile tepe, (3) antitürev U(ε) = Eε²/2 − cε³/3 ile U(ε₁) ve U(ε_u).", "'Initial slope' and 'tangent modulus' are DERIVATIVE questions: σ′(ε). 'Stored energy' is the AREA under the curve, i.e. a DEFINITE INTEGRAL: ∫₀^ε σ dε (the reverse of the power rule). The peak is the condition σ′(ε) = 0. " + "Mathematical task: (1) σ′(0) and σ′(ε₁), (2) the peak from σ′ = 0, (3) the antiderivative U(ε) = Eε²/2 − cε³/3 gives U(ε₁) and U(ε_u).");
    break; }
    case 9: {
    return tx("y(t) = Y(1 − e^(−t/τ)) üstel bir fonksiyondur. 'Değişim hızı' TÜREV (zincir kuralı), 'son değer' LİMİT (t → ∞), '%95'e ulaşma süresi' üstel bir DENKLEM (logaritma), 'son değerle yanıt arasındaki alan' ise GENELLEŞTİRİLMİŞ İNTEGRALdir. " + "Matematiksel istek: y′, y′(0), lim y, e^(−t/τ) = 0,05 denkleminin çözümü ve ∫₀^∞ Y·e^(−t/τ) dt.", "y(t) = Y(1 − e^(−t/τ)) is an exponential function. 'Rate of change' is a DERIVATIVE (chain rule), 'final value' a LIMIT (t → ∞), 'time to reach 95 %' an exponential EQUATION (logarithm) and 'area between the final value and the response' an IMPROPER INTEGRAL. " + "Mathematical task: y′, y′(0), lim y, the solution of e^(−t/τ) = 0.05 and ∫₀^∞ Y·e^(−t/τ) dt.");
    break; }
    case 10: {
    return tx("'Tepe' bir OPTİMİZASYON/kritik nokta sorusudur: y′(t) = 0. Burada y′ çarpım kuralı gerektirir ve sadeleşince e^(−σt)·sin ω_d t biçimine gelir; üstel çarpan asla sıfır olmadığından sıfırlar sinüsten gelir. " + "Matematiksel istek: y′'yi bul, sin ω_d t = 0'dan t_p = π/ω_d'yi çöz, y′'nin işaret değişimini kontrol et, y(t_p)'yi hesapla.", "'The peak' is an OPTIMISATION / critical-point question: y′(t) = 0. Here y′ needs the product rule and simplifies to e^(−σt)·sin ω_d t; since the exponential factor is never zero, the zeros come from the sine. " + "Mathematical task: find y′, solve sin ω_d t = 0 for t_p = π/ω_d, check the sign change of y′, evaluate y(t_p).");
    break; }
    case 11: {
    return tx("A/V (hiperbol, azalan) ile B·V² (parabol, artan) zıt iki terimdir; toplamları U biçimli bir eğridir. 'En düşük maliyet' bir OPTİMİZASYON sorusudur: C′(V) = 0, C″ > 0 ile doğrula, C(V*)'ı hesapla. " + "Matematiksel istek: C(V) = A/V + B·V² fonksiyonunun V > 0 için mutlak minimumu.", "A/V (hyperbola, decreasing) and B·V² (parabola, increasing) are two opposing terms; their sum is a U-shaped curve. 'The lowest cost' is an OPTIMISATION question: C′(V) = 0, confirm with C″ > 0, evaluate C(V*). " + "Mathematical task: the absolute minimum of C(V) = A/V + B·V² for V > 0.");
    break; }
    case 12: {
    return tx("L = C³·P⁻³ bir KUVVET fonksiyonudur (negatif üs). 'Yüke duyarlılık' TÜREVdir: dL/dP. 'Yük %r artarsa' sorusu diferansiyel (doğrusal yaklaşım) ΔL ≈ L′·ΔP ile cevaplanır ve kesin değerle (1 + r)⁻³ karşılaştırılır. " + "Matematiksel istek: L′(P)'yi hesapla, ΔL'yi hem doğrusal hem kesin bul, hatayı yorumla.", "L = C³·P⁻³ is a POWER function (negative exponent). 'Load sensitivity' is the DERIVATIVE dL/dP. The question 'if the load rises by r %' is answered with the differential (linear approximation) ΔL ≈ L′·ΔP and compared with the exact (1 + r)⁻³. " + "Mathematical task: compute L′(P), find ΔL both linearly and exactly, interpret the error.");
    break; }
    case 13: {
    return tx("F(x) = kx + cx³ bir polinomdur. 'Teğet rijitlik' TÜREVdir: dF/dx. 'Depolanan enerji' ise kuvvetin yer değiştirmeye göre BELİRLİ İNTEGRALidir (eğri altındaki alan). " + "Matematiksel istek: F(δ), F′(δ) ve W = ∫₀^δ (kx + cx³) dx = kδ²/2 + cδ⁴/4.", "F(x) = kx + cx³ is a polynomial. 'Tangent stiffness' is the DERIVATIVE dF/dx. 'Stored energy' is the DEFINITE INTEGRAL of the force over the displacement (area under the curve). " + "Mathematical task: F(δ), F′(δ) and W = ∫₀^δ (kx + cx³) dx = kδ²/2 + cδ⁴/4.");
    break; }
    case 14: {
    return tx("T(θ) parçalı bir fonksiyondur (yarım sinüs, sonra 0). 'Çevrim işi' ∫T dθ BELİRLİ İNTEGRALdir; 'ortalama tork' fonksiyonun ORTALAMA DEĞERİdir: (1/2π)∫₀^2π T dθ. 'Enerji fazlası' T = T_ort olduğu iki nokta arasındaki ∫(T − T_ort) dθ'dır. " + "Matematiksel istek: ∫ sin θ dθ = −cos θ ile W, T_ort, kesişim açısı arcsin(1/π), ΔE.", "T(θ) is a piecewise function (half sine, then 0). 'Work per cycle' is the DEFINITE INTEGRAL ∫T dθ; 'mean torque' is the AVERAGE VALUE of the function: (1/2π)∫₀^2π T dθ. 'Energy surplus' is ∫(T − T_mean) dθ between the two points where T = T_mean. " + "Mathematical task: ∫ sin θ dθ = −cos θ gives W, T_mean, the crossing angle arcsin(1/π) and ΔE.");
    break; }
    case 15: {
    return tx("da/dN = K′a² bir diferansiyel denklemdir; 'çevrim sayısı' da/dN'nin TERSİNİN integralidir. Değişkenlere ayrılır: dN = da/(K′a²) ve a₀'dan a_c'ye BELİRLİ İNTEGRAL alınır (∫a⁻² da = −1/a). " + "Matematiksel istek: N_f = (1/K′)∫_{a₀}^{a_c} a⁻² da = (1/K′)(1/a₀ − 1/a_c).", "da/dN = K′a² is a differential equation; the 'number of cycles' is the integral of the RECIPROCAL of da/dN. Separate the variables: dN = da/(K′a²) and take the DEFINITE INTEGRAL from a₀ to a_c (∫a⁻² da = −1/a). " + "Mathematical task: N_f = (1/K′)∫_{a₀}^{a_c} a⁻² da = (1/K′)(1/a₀ − 1/a_c).");
    break; }
    default: {
    return tx("V·T^n = C, V ve T'yi kapalı biçimde bağlayan bir denklemdir. T'yi V'nin fonksiyonu olarak düşünüp iki tarafı V'ye göre türetiriz (KAPALI TÜREV): T^n + V·n·T^(n−1)·T' = 0. " + "Buradan T' = −T/(n·V) çıkar. Küçük değişim için diferansiyel ΔT ≈ T'·ΔV kullanılır; bağıl olarak %ΔT ≈ −(1/n)·%ΔV. " + "Matematiksel istek: kapalı türev ile dT/dV'yi bul, diferansiyelle ΔT'yi tahmin et, kesin değerle karşılaştır.", "V·T^n = C links V and T implicitly. Treating T as a function of V and differentiating both sides with respect to V (IMPLICIT DIFFERENTIATION) gives T^n + V·n·T^(n−1)·T' = 0. " + "So T' = −T/(n·V). For a small change use the differential ΔT ≈ T'·ΔV; in relative terms %ΔT ≈ −(1/n)·%ΔV. " + "Mathematical task: find dT/dV by implicit differentiation, estimate ΔT with the differential, compare with the exact value.");
    break; }
    }
  }


  function Steps(problem) {
    let x = problem.p;
    let s = [];
    switch (problem.scn) {
    case 0: {
    let a = x[0] / 1000.0, p0 = x[1], b = 2 * a * p0, dm = a * p0 * p0;
    s.push(tx(`1. Nicelikler: P = lazer gücü (W), d = eriyik havuzu derinliği (µm). Model: d(P) = −${G(a)}P² + ${G(b)}P, P ≥ 0.`, `1. Quantities: P = laser power (W), d = melt-pool depth (µm). Model: d(P) = −${G(a)}P² + ${G(b)}P, P ≥ 0.`));
    s.push(tx("2. Amaç: d'yi maksimum yapan P. Maksimumda teğet yataydır, yani d'(P) = 0.", "2. Goal: the P that maximises d. At a maximum the tangent is horizontal, i.e. d'(P) = 0."));
    s.push(tx(`3. Terim terim türev (kuvvet kuralı): d'(P) = −2·${G(a)}·P + ${G(b)} = −${G(2 * a)}P + ${G(b)}.`, `3. Differentiate term by term (power rule): d'(P) = −2·${G(a)}·P + ${G(b)} = −${G(2 * a)}P + ${G(b)}.`));
    s.push(tx(`4. d'(P) = 0: −${G(2 * a)}P + ${G(b)} = 0  →  ${G(2 * a)}P = ${G(b)}.`, `4. Set d'(P) = 0: −${G(2 * a)}P + ${G(b)} = 0  →  ${G(2 * a)}P = ${G(b)}.`));
    s.push(tx(`5. P'yi çöz: P₀ = ${G(b)} / ${G(2 * a)} = ${N2(p0)} W.`, `5. Solve for P: P₀ = ${G(b)} / ${G(2 * a)} = ${N2(p0)} W.`));
    s.push(tx(`6. İkinci türev testi: d''(P) = −${G(2 * a)} < 0 her P için → eğri aşağı bükey, P₀ bir MAKSİMUM.`, `6. Second-derivative test: d''(P) = −${G(2 * a)} < 0 for every P → concave down, P₀ is a MAXIMUM.`));
    s.push(tx(`7. Yerine koy: d(${N2(p0)}) = −${G(a)}·(${N2(p0)})² + ${G(b)}·${N2(p0)} = −${G(a * p0 * p0)} + ${G(b * p0)}.`, `7. Substitute: d(${N2(p0)}) = −${G(a)}·(${N2(p0)})² + ${G(b)}·${N2(p0)} = −${G(a * p0 * p0)} + ${G(b * p0)}.`));
    s.push(tx(`8. Sonuç: d_max = ${G(dm)} µm. Birim kontrolü: (µm/W²)·W² = µm ✓. Kareye tamamlama: d = −${G(a)}(P − ${N2(p0)})² + ${G(dm)} ✓.`, `8. Result: d_max = ${G(dm)} µm. Unit check: (µm/W²)·W² = µm ✓. Completing the square: d = −${G(a)}(P − ${N2(p0)})² + ${G(dm)} ✓.`));
    s.push(tx(`9. Yorum: P₀'ın altında birleşme eksikliği, üstünde buharlaşma/anahtar deliği kusurları görülür. Tepe noktasında d' = 0 olduğundan küçük güç dalgalanmaları derinliği neredeyse değiştirmez.`, `9. Interpretation: below P₀ lack-of-fusion is likely, above it evaporation/keyhole defects. Since d' = 0 at the vertex, small power fluctuations barely change the depth.`));
    break; }
    case 1: {
    let pw = x[0], h = x[1] / 1000.0, t = x[2] / 1000.0, em = x[3];
    let ht = h * t, vmax = pw / (em * ht);
    s.push(tx(`1. Birimler: h = ${N2(x[1])} µm = ${G4(h)} mm, t = ${N2(x[2])} µm = ${G4(t)} mm, P = ${N2(pw)} W = ${N2(pw)} J/s. Böylece E = P/(v·h·t) J/mm³ olur.`, `1. Units: h = ${N2(x[1])} µm = ${G4(h)} mm, t = ${N2(x[2])} µm = ${G4(t)} mm, P = ${N2(pw)} W = ${N2(pw)} J/s. Hence E = P/(v·h·t) is in J/mm³.`));
    s.push(tx(`2. Sabitleri birleştir: h·t = ${G4(h)}·${G4(t)} = ${G(ht * 1000000)}×10⁻⁶ mm² = ${G4(ht)} mm².`, `2. Combine the constants: h·t = ${G4(h)}·${G4(t)} = ${G(ht * 1000000)}×10⁻⁶ mm² = ${G4(ht)} mm².`));
    s.push(tx(`3. Model: E(v) = ${N2(pw)}/(${G4(ht)}·v) = ${G(pw / ht)}/v (rasyonel, v > 0).`, `3. Model: E(v) = ${N2(pw)}/(${G4(ht)}·v) = ${G(pw / ht)}/v (rational, v > 0).`));
    s.push(tx(`4. E(v) = E_min: ${G(pw / ht)}/v = ${N2(em)}.`, `4. E(v) = E_min: ${G(pw / ht)}/v = ${N2(em)}.`));
    s.push(tx(`5. İçler dışlar: v = ${G(pw / ht)} / ${N2(em)} = ${G(vmax)} mm/s.`, `5. Cross-multiply: v = ${G(pw / ht)} / ${N2(em)} = ${G(vmax)} mm/s.`));
    s.push(tx(`6. E azalan olduğundan E ≥ ${N2(em)} ⇔ v ≤ ${G(vmax)} mm/s. Bu hızın üstünde füzyon eksikliği riski var.`, `6. Since E is decreasing, E ≥ ${N2(em)} ⇔ v ≤ ${G(vmax)} mm/s. Above this speed there is a risk of lack of fusion.`));
    s.push(tx(`7. Türev: E = ${G(pw / ht)}·v⁻¹ → dE/dv = −${G(pw / ht)}·v⁻² = −${G(pw / ht)}/v².`, `7. Derivative: E = ${G(pw / ht)}·v⁻¹ → dE/dv = −${G(pw / ht)}·v⁻² = −${G(pw / ht)}/v².`));
    s.push(tx(`8. v = ${G(vmax)}'de: dE/dv = −${G(pw / ht)}/(${G(vmax)})² = −${G(em / vmax)} (J/mm³)/(mm/s). (Kontrol: −E/v = −${N2(em)}/${G(vmax)} ✓.)`, `8. At v = ${G(vmax)}: dE/dv = −${G(pw / ht)}/(${G(vmax)})² = −${G(em / vmax)} (J/mm³)/(mm/s). (Check: −E/v = −${N2(em)}/${G(vmax)} ✓.)`));
    s.push(tx(`9. Yorum: hızı 10 mm/s artırırsak E yaklaşık ${G(10 * em / vmax)} J/mm³ düşer; yani eşikte hız ayarı çok hassastır.`, `9. Interpretation: raising the speed by 10 mm/s lowers E by about ${G(10 * em / vmax)} J/mm³, so the speed setting is delicate near the threshold.`));
    break; }
    case 2: {
    let sv = x[0], k = x[1], s1 = x[2];
    let v0 = sv * sv, v1 = s1 * s1, vol0 = k * sv * sv * sv, vol1 = k * s1 * s1 * s1;
    s.push(tx(`1. Model V = k·v^(3/2). Veri: v = ${N2(v0)} mm/s, V = ${N2(vol0)} mm³. Birim: k'nın birimi mm³/(mm/s)^(3/2).`, `1. Model V = k·v^(3/2). Data: v = ${N2(v0)} mm/s, V = ${N2(vol0)} mm³. Unit: k has units mm³/(mm/s)^(3/2).`));
    s.push(tx(`2. Yerine koy: ${N2(vol0)} = k·(${N2(v0)})^(3/2).`, `2. Substitute: ${N2(vol0)} = k·(${N2(v0)})^(3/2).`));
    s.push(tx(`3. v^(3/2) = (√v)³: (${N2(v0)})^(3/2) = (√${N2(v0)})³ = ${N2(sv)}³ = ${N2(sv * sv * sv)}.`, `3. v^(3/2) = (√v)³: (${N2(v0)})^(3/2) = (√${N2(v0)})³ = ${N2(sv)}³ = ${N2(sv * sv * sv)}.`));
    s.push(tx(`4. k = ${N2(vol0)} / ${N2(sv * sv * sv)} = ${N2(k)}.`, `4. k = ${N2(vol0)} / ${N2(sv * sv * sv)} = ${N2(k)}.`));
    s.push(tx(`5. Tahmin: V(${N2(v1)}) = ${N2(k)}·(${N2(v1)})^(3/2) = ${N2(k)}·${N2(s1)}³ = ${N2(k)}·${N2(s1 * s1 * s1)} = ${N2(vol1)} mm³.`, `5. Prediction: V(${N2(v1)}) = ${N2(k)}·(${N2(v1)})^(3/2) = ${N2(k)}·${N2(s1)}³ = ${N2(k)}·${N2(s1 * s1 * s1)} = ${N2(vol1)} mm³.`));
    s.push(tx(`6. Duyarlılık için türev (kuvvet kuralı): V'(v) = k·(3/2)·v^(1/2) = ${G(1.5 * k)}·√v.`, `6. For the sensitivity take the derivative (power rule): V'(v) = k·(3/2)·v^(1/2) = ${G(1.5 * k)}·√v.`));
    s.push(tx(`7. v = ${N2(v1)}'de: V' = ${G(1.5 * k)}·√${N2(v1)} = ${G(1.5 * k)}·${N2(s1)} = ${G(1.5 * k * s1)} mm³ per (mm/s).`, `7. At v = ${N2(v1)}: V' = ${G(1.5 * k)}·√${N2(v1)} = ${G(1.5 * k)}·${N2(s1)} = ${G(1.5 * k * s1)} mm³ per (mm/s).`));
    s.push(tx(`8. Kontrol: V/v = ${G(vol1 / v1)} < V' = ${G(1.5 * k * s1)} (ortalama eğim < anlık eğim; fonksiyon konveks). Oran V'/(V/v) = 3/2 ✓.`, `8. Check: V/v = ${G(vol1 / v1)} < V' = ${G(1.5 * k * s1)} (average slope < instantaneous slope; the function is convex). Ratio V'/(V/v) = 3/2 ✓.`));
    s.push(tx(`9. Yorum: hızı %1 artırmak hacmi yaklaşık %1.5 artırır; bağıl değişim = üs × bağıl hız değişimi.`, `9. Interpretation: raising the speed by 1% raises the volume by about 1.5%; relative change = exponent × relative speed change.`));
    break; }
    case 3: {
    let l0 = x[0], al = x[1] * 0.000001, dt = x[2];
    let u = al * dt, lin = l0 * u, ex = l0 * (Math.exp(u) - 1), er = ex - lin;
    s.push(tx(`1. Verilenler: L₀ = ${N2(l0)} mm, α = ${N2(x[1])}×10⁻⁶ 1/K, ΔT = ${N2(dt)} K.`, `1. Given: L₀ = ${N2(l0)} mm, α = ${N2(x[1])}×10⁻⁶ 1/K, ΔT = ${N2(dt)} K.`));
    s.push(tx(`2. Boyutsuz büyüklük: u = α·ΔT = ${N2(x[1])}×10⁻⁶·${N2(dt)} = ${G4(u)}.`, `2. Dimensionless quantity: u = α·ΔT = ${N2(x[1])}×10⁻⁶·${N2(dt)} = ${G4(u)}.`));
    s.push(tx("3. Gerçek model: L(ΔT) = L₀·e^(αΔT). Türev: dL/dΔT = α·L₀·e^(αΔT) (zincir kuralı).", "3. Exact model: L(ΔT) = L₀·e^(αΔT). Derivative: dL/dΔT = α·L₀·e^(αΔT) (chain rule)."));
    s.push(tx("4. ΔT = 0'da eğim = α·L₀ → teğet doğrusu: L ≈ L₀ + α·L₀·ΔT, yani ΔL ≈ α·L₀·ΔT.", "4. At ΔT = 0 the slope is α·L₀ → tangent line: L ≈ L₀ + α·L₀·ΔT, i.e. ΔL ≈ α·L₀·ΔT."));
    s.push(tx(`5. Doğrusal tahmin: ΔL ≈ ${N2(l0)}·${G4(u)} = ${G4(lin)} mm.`, `5. Linear estimate: ΔL ≈ ${N2(l0)}·${G4(u)} = ${G4(lin)} mm.`));
    s.push(tx(`6. Kesin: ΔL = L₀(e^u − 1) = ${N2(l0)}·(e^${G4(u)} − 1) = ${N2(l0)}·${G(Math.exp(u) - 1)} = ${G4(ex)} mm.`, `6. Exact: ΔL = L₀(e^u − 1) = ${N2(l0)}·(e^${G4(u)} − 1) = ${N2(l0)}·${G(Math.exp(u) - 1)} = ${G4(ex)} mm.`));
    s.push(tx(`7. Hata = kesin − doğrusal = ${G4(ex)} − ${G4(lin)} = ${G4(er)} mm (bağıl: %${G(100 * er / ex)}).`, `7. Error = exact − linear = ${G4(ex)} − ${G4(lin)} = ${G4(er)} mm (relative: ${G(100 * er / ex)}%).`));
    s.push(tx(`8. Taylor kontrolü: hata ≈ L₀u²/2 = ${N2(l0)}·(${G4(u)})²/2 = ${G4(l0 * u * u / 2)} mm ✓ (ikinci türev terimi). Birim: mm ✓.`, `8. Taylor check: error ≈ L₀u²/2 = ${N2(l0)}·(${G4(u)})²/2 = ${G4(l0 * u * u / 2)} mm ✓ (second-derivative term). Unit: mm ✓.`));
    s.push(tx("9. Yorum: doğrusal formül hafifçe eksik tahmin eder; hata ΔT'nin karesiyle büyür, ama hassas toleranslarda (mikrometre) yine de önemli olabilir.", "9. Interpretation: the linear formula slightly underestimates; the error grows with the square of ΔT, yet it can still matter at precision tolerances (micrometres)."));
    break; }
    case 4: {
    let tm = x[0], k = x[1], t = x[2];
    let tv = tm * Math.exp(-k * t), rate = -k * tv;
    s.push(tx(`1. Model: T(t) = ${N2(tm)}·e^(−${N2(k)}t) °C, t saniye. İstenen: dT/dt (°C/s).`, `1. Model: T(t) = ${N2(tm)}·e^(−${N2(k)}t) °C, t in seconds. Wanted: dT/dt (°C/s).`));
    s.push(tx(`2. Zincir kuralı: d/dt e^(u) = e^(u)·u' ve u = −${N2(k)}t → u' = −${N2(k)}.`, `2. Chain rule: d/dt e^(u) = e^(u)·u' with u = −${N2(k)}t → u' = −${N2(k)}.`));
    s.push(tx(`3. dT/dt = ${N2(tm)}·e^(−${N2(k)}t)·(−${N2(k)}) = −${G(k * tm)}·e^(−${N2(k)}t).`, `3. dT/dt = ${N2(tm)}·e^(−${N2(k)}t)·(−${N2(k)}) = −${G(k * tm)}·e^(−${N2(k)}t).`));
    s.push(tx(`4. t = ${N2(t)} s için üs: −${N2(k)}·${N2(t)} = ${N2(-k * t)}.`, `4. Exponent at t = ${N2(t)} s: −${N2(k)}·${N2(t)} = ${N2(-k * t)}.`));
    s.push(tx(`5. e^(${N2(-k * t)}) ≈ ${G4(Math.exp(-k * t))}.`, `5. e^(${N2(-k * t)}) ≈ ${G4(Math.exp(-k * t))}.`));
    s.push(tx(`6. Sıcaklık: T(${N2(t)}) ≈ ${N2(tm)}·${G4(Math.exp(-k * t))} ≈ ${N2(tv)} °C.`, `6. Temperature: T(${N2(t)}) ≈ ${N2(tm)}·${G4(Math.exp(-k * t))} ≈ ${N2(tv)} °C.`));
    s.push(tx(`7. Hız: dT/dt ≈ −${G(k * tm)}·${G4(Math.exp(-k * t))} ≈ ${N2(rate)} °C/s.`, `7. Rate: dT/dt ≈ −${G(k * tm)}·${G4(Math.exp(-k * t))} ≈ ${N2(rate)} °C/s.`));
    s.push(tx(`8. Kontrol: dT/dt = −k·T = −${N2(k)}·${N2(tv)} = ${N2(rate)} ✓. Birim: (1/s)·°C = °C/s ✓; negatif işaret = soğuma.`, `8. Check: dT/dt = −k·T = −${N2(k)}·${N2(tv)} = ${N2(rate)} ✓. Unit: (1/s)·°C = °C/s ✓; the negative sign = cooling.`));
    s.push(tx(`9. Yorum: soğuma en hızlı başlangıçta (t = 0'da ${N2(-k * tm)} °C/s) ve zamanla yavaşlar; yüksek soğuma hızı ince tanecikli mikroyapı ve yüksek artık gerilim demektir.`, `9. Interpretation: cooling is fastest at the start (${N2(-k * tm)} °C/s at t = 0) and slows down; a high cooling rate means a finer grain microstructure and higher residual stress.`));
    break; }
    case 5: {
    let a = x[0], b = x[1], r = x[2] / 100.0, m = x[3];
    let n0 = Math.pow(10, m), s0 = a * Math.pow(n0, -b);
    let f = Math.pow(1 - r, -1 / b), lin = r / b;
    s.push(tx(`1. Model: S = ${N2(a)}·N^(−${N2(b)}) (MPa). N₀ = 10^${N2(m)} çevrimde S₀ = ${N2(a)}·10^(−${N2(b)}·${N2(m)}) = ${N2(s0)} MPa.`, `1. Model: S = ${N2(a)}·N^(−${N2(b)}) (MPa). At N₀ = 10^${N2(m)} cycles S₀ = ${N2(a)}·10^(−${N2(b)}·${N2(m)}) = ${N2(s0)} MPa.`));
    s.push(tx(`2. Log ölçek: log S = log ${N2(a)} − ${N2(b)}·log N → doğrunun eğimi −${N2(b)}.`, `2. Log scale: log S = log ${N2(a)} − ${N2(b)}·log N → the line has slope −${N2(b)}.`));
    s.push(tx(`3. Türev: dS/dN = −${N2(b)}·${N2(a)}·N^(−${N2(b)}−1) = −b·S/N. Buradan dN/N = −(1/b)·dS/S.`, `3. Derivative: dS/dN = −${N2(b)}·${N2(a)}·N^(−${N2(b)}−1) = −b·S/N. Hence dN/N = −(1/b)·dS/S.`));
    s.push(tx(`4. Doğrusal (diferansiyel) tahmin: dS/S = −${N2(r * 100)}% → dN/N ≈ ${N2(r * 100)}/${N2(b)} = %${G(lin * 100)}.`, `4. Linear (differential) estimate: dS/S = −${N2(r * 100)}% → dN/N ≈ ${N2(r * 100)}/${N2(b)} = ${G(lin * 100)}%.`));
    s.push(tx(`5. Kesin: S₁ = ${N2(1 - r)}·S₀ → N₁ = (S₁/a)^(−1/b) = N₀·(${N2(1 - r)})^(−1/${N2(b)}).`, `5. Exact: S₁ = ${N2(1 - r)}·S₀ → N₁ = (S₁/a)^(−1/b) = N₀·(${N2(1 - r)})^(−1/${N2(b)}).`));
    s.push(tx(`6. Üs: −1/${N2(b)} = ${G(-1 / b)}; (${N2(1 - r)})^(${G(-1 / b)}) = ${G(f)}.`, `6. Exponent: −1/${N2(b)} = ${G(-1 / b)}; (${N2(1 - r)})^(${G(-1 / b)}) = ${G(f)}.`));
    s.push(tx(`7. Ömür ${N2(f)} kat artar: N₁ ≈ ${N2(f)}·10^${N2(m)} ≈ ${G(f * n0)} çevrim (kesin artış %${G((f - 1) * 100)}).`, `7. Life grows by a factor ${N2(f)}: N₁ ≈ ${N2(f)}·10^${N2(m)} ≈ ${G(f * n0)} cycles (exact gain ${G((f - 1) * 100)}%).`));
    s.push(tx(`8. Karşılaştırma: doğrusal %${G(lin * 100)} ve kesin %${G((f - 1) * 100)}. Doğrusal tahmin küçük azalışlarda iyi, büyük azalışlarda eksik kalır (fonksiyon konveks). log₁₀ ölçekte kayma: ${N2(Math.log10(f))} dekad.`, `8. Comparison: linear ${G(lin * 100)}% versus exact ${G((f - 1) * 100)}%. The linear estimate is good for small reductions and falls short for large ones (convex function). Shift on the log₁₀ scale: ${N2(Math.log10(f))} decades.`));
    s.push(tx("9. Yorum: küçük b (yatık eğri) demek ki gerilimdeki küçük bir iyileştirme (ör. yüzey parlatma, kalıntı gerilim azaltma) ömürde ÇOK büyük artış sağlar; mühendislik güvenlik payı bu yüzden önemlidir.", "9. Interpretation: a small b (flat curve) means a small improvement in stress (e.g. surface polishing, residual-stress relief) gives a VERY large gain in life; that is why engineering safety margins matter."));
    break; }
    case 6: {
    let ts = x[0], b = x[1], a = x[1] * x[0] * x[0];
    s.push(tx(`1. Nicelikler: t = katman kalınlığı (µm), C = maliyet (TL). C(t) = ${N2(a)}/t + ${N2(b)}·t, t > 0.`, `1. Quantities: t = layer thickness (µm), C = cost (TL). C(t) = ${N2(a)}/t + ${N2(b)}·t, t > 0.`));
    s.push(tx(`2. Türeve hazırlık: C(t) = ${N2(a)}·t⁻¹ + ${N2(b)}·t.`, `2. Prepare for differentiation: C(t) = ${N2(a)}·t⁻¹ + ${N2(b)}·t.`));
    s.push(tx(`3. Türev: C'(t) = −${N2(a)}·t⁻² + ${N2(b)} = −${N2(a)}/t² + ${N2(b)}.`, `3. Derivative: C'(t) = −${N2(a)}·t⁻² + ${N2(b)} = −${N2(a)}/t² + ${N2(b)}.`));
    s.push(tx(`4. C'(t) = 0: ${N2(a)}/t² = ${N2(b)}.`, `4. C'(t) = 0: ${N2(a)}/t² = ${N2(b)}.`));
    s.push(tx(`5. t² = ${N2(a)}/${N2(b)} = ${N2(ts * ts)}.`, `5. t² = ${N2(a)}/${N2(b)} = ${N2(ts * ts)}.`));
    s.push(tx(`6. t > 0 olduğundan t* = √${N2(ts * ts)} = ${N2(ts)} µm.`, `6. Since t > 0, t* = √${N2(ts * ts)} = ${N2(ts)} µm.`));
    s.push(tx(`7. İkinci türev: C''(t) = 2·${N2(a)}/t³ > 0 (t > 0) → t*'da MİNİMUM. (t → 0 ve t → ∞ için C → ∞, dolayısıyla mutlak minimum.)`, `7. Second derivative: C''(t) = 2·${N2(a)}/t³ > 0 (t > 0) → MINIMUM at t*. (C → ∞ as t → 0 and t → ∞, so it is the absolute minimum.)`));
    s.push(tx(`8. C_min = C(${N2(ts)}) = ${N2(a)}/${N2(ts)} + ${N2(b)}·${N2(ts)} = ${N2(a / ts)} + ${N2(b * ts)} = ${N2(2 * b * ts)} TL. Birim kontrolü: TL ✓.`, `8. C_min = C(${N2(ts)}) = ${N2(a)}/${N2(ts)} + ${N2(b)}·${N2(ts)} = ${N2(a / ts)} + ${N2(b * ts)} = ${N2(2 * b * ts)} TL. Unit check: TL ✓.`));
    s.push(tx(`9. Yorum: optimumda iki maliyet terimi eşittir (${N2(a / ts)} = ${N2(b * ts)} TL). t = ${N2(2 * ts)} µm'de C = ${N2(a / (2 * ts) + b * 2 * ts)} TL, t = ${N2(ts / 2)} µm'de C = ${N2(a / (ts / 2) + b * ts / 2)} TL: her iki yönde de maliyet artar.`, `9. Interpretation: at the optimum the two cost terms are equal (${N2(a / ts)} = ${N2(b * ts)} TL). At t = ${N2(2 * ts)} µm C = ${N2(a / (2 * ts) + b * 2 * ts)} TL and at t = ${N2(ts / 2)} µm C = ${N2(a / (ts / 2) + b * ts / 2)} TL: cost rises in both directions.`));
    break; }
    case 8: {
    let su = x[0], eu = x[1] / 100, e1 = x[2] / 100;
    let E = 2 * su / eu, c = su / (eu * eu);
    let sg1 = E * e1 - c * e1 * e1, tg1 = E - 2 * c * e1;
    let U1 = E * e1 * e1 / 2 - c * e1 * e1 * e1 / 3, Uu = 2 * su * eu / 3;
    s.push(tx(`1. Model: σ(ε) = E·ε − c·ε² (MPa). ε_u = ${N2(x[1])} % = ${G(eu)}, σ_u = ${N2(su)} MPa için E = 2σ_u/ε_u = 2·${N2(su)}/${G(eu)} = ${G(E)} MPa ve c = σ_u/ε_u² = ${N2(su)}/${G(eu * eu)} = ${G(c)} MPa.`, `1. Model: σ(ε) = E·ε − c·ε² (MPa). With ε_u = ${N2(x[1])} % = ${G(eu)} and σ_u = ${N2(su)} MPa: E = 2σ_u/ε_u = 2·${N2(su)}/${G(eu)} = ${G(E)} MPa and c = σ_u/ε_u² = ${N2(su)}/${G(eu * eu)} = ${G(c)} MPa.`));
    s.push(tx(`2. Eğim = türev (kuvvet kuralı): σ′(ε) = E − 2c·ε = ${G(E)} − ${G(2 * c)}·ε (MPa).`, `2. Slope = derivative (power rule): σ′(ε) = E − 2c·ε = ${G(E)} − ${G(2 * c)}·ε (MPa).`));
    s.push(tx(`3. Başlangıç modülü: σ′(0) = ${G(E)} MPa = ${G(E / 1000)} GPa. Tepe: σ′(ε) = 0 → ε = E/(2c) = ${G(E / (2 * c))} = ${N2(x[1])} % (= ε_u ✓); σ″ = −${G(2 * c)} < 0 → maksimum, σ(ε_u) = ${N2(su)} MPa ✓.`, `3. Initial modulus: σ′(0) = ${G(E)} MPa = ${G(E / 1000)} GPa. Peak: σ′(ε) = 0 → ε = E/(2c) = ${G(E / (2 * c))} = ${N2(x[1])} % (= ε_u ✓); σ″ = −${G(2 * c)} < 0 → maximum, σ(ε_u) = ${N2(su)} MPa ✓.`));
    s.push(tx(`4. Teğet modülü ε₁ = ${N2(x[2])} % = ${G(e1)}'de: σ′(ε₁) = ${G(E)} − ${G(2 * c)}·${G(e1)} = ${G(tg1)} MPa (başlangıç modülünün %${G(100 * tg1 / E)}'i).`, `4. Tangent modulus at ε₁ = ${N2(x[2])} % = ${G(e1)}: σ′(ε₁) = ${G(E)} − ${G(2 * c)}·${G(e1)} = ${G(tg1)} MPa (${G(100 * tg1 / E)} % of the initial modulus).`));
    s.push(tx(`5. Gerilme: σ(ε₁) = ${G(E)}·${G(e1)} − ${G(c)}·(${G(e1)})² = ${G(E * e1)} − ${G(c * e1 * e1)} = ${G(sg1)} MPa.`, `5. Stress: σ(ε₁) = ${G(E)}·${G(e1)} − ${G(c)}·(${G(e1)})² = ${G(E * e1)} − ${G(c * e1 * e1)} = ${G(sg1)} MPa.`));
    s.push(tx(`6. Eğri altındaki alan = birim hacim enerjisi. Antitürev: U(ε) = ∫₀^ε σ dε = E·ε²/2 − c·ε³/3 = ${G(E / 2)}·ε² − ${G(c / 3)}·ε³ (MPa = MJ/m³).`, `6. Area under the curve = energy per unit volume. Antiderivative: U(ε) = ∫₀^ε σ dε = E·ε²/2 − c·ε³/3 = ${G(E / 2)}·ε² − ${G(c / 3)}·ε³ (MPa = MJ/m³).`));
    s.push(tx(`7. U(ε₁) = ${G(E / 2)}·(${G(e1)})² − ${G(c / 3)}·(${G(e1)})³ = ${G4(E * e1 * e1 / 2)} − ${G4(c * e1 * e1 * e1 / 3)} = ${G4(U1)} MJ/m³ (= ${G(U1 * 1000)} kJ/m³).`, `7. U(ε₁) = ${G(E / 2)}·(${G(e1)})² − ${G(c / 3)}·(${G(e1)})³ = ${G4(E * e1 * e1 / 2)} − ${G4(c * e1 * e1 * e1 / 3)} = ${G4(U1)} MJ/m³ (= ${G(U1 * 1000)} kJ/m³).`));
    s.push(tx(`8. Tepe noktasına kadar: U(ε_u) = ∫₀^ε_u σ dε = (2/3)·σ_u·ε_u = (2/3)·${N2(su)}·${G(eu)} = ${G4(Uu)} MJ/m³ (σ_u·ε_u dikdörtgeninin 2/3'ü). Birim: MPa·1 = MJ/m³ ✓.`, `8. Up to the peak: U(ε_u) = ∫₀^ε_u σ dε = (2/3)·σ_u·ε_u = (2/3)·${N2(su)}·${G(eu)} = ${G4(Uu)} MJ/m³ (2/3 of the σ_u·ε_u rectangle). Unit: MPa·1 = MJ/m³ ✓.`));
    s.push(tx(`9. Yorum: teğet modülü gerildikçe düşer (${G(E)} → ${G(tg1)} MPa), yani malzeme yumuşar; tepeye kadar tokluk ${G4(Uu)} MJ/m³ olup ε₁'e kadar olanın ${G(Uu / U1)} katıdır. Daha yüksek tokluk = kırılmadan daha çok enerji emer.`, `9. Interpretation: the tangent modulus falls as the strain grows (${G(E)} → ${G(tg1)} MPa), i.e. the material softens; the toughness up to the peak is ${G4(Uu)} MJ/m³, ${G(Uu / U1)} times that up to ε₁. Higher toughness = more energy absorbed before fracture.`));
    break; }
    case 9: {
    let Y = x[0], tau = x[1], t1 = x[2];
    let ex = Math.exp(-t1 / tau), y1 = Y * (1 - ex), r1 = Y / tau * ex, ln20 = Math.log(20), t95 = tau * ln20;
    s.push(tx(`1. Model: y(t) = Y(1 − e^(−t/τ)), Y = ${N2(Y)} °C, τ = ${N2(tau)} s (birinci mertebe, basamak girişi).`, `1. Model: y(t) = Y(1 − e^(−t/τ)), Y = ${N2(Y)} °C, τ = ${N2(tau)} s (first order, step input).`));
    s.push(tx(`2. Zincir kuralı: d/dt e^(−t/τ) = e^(−t/τ)·(−1/τ). Böylece y′(t) = Y·(1/τ)·e^(−t/τ) = ${G(Y / tau)}·e^(−t/${N2(tau)}) °C/s.`, `2. Chain rule: d/dt e^(−t/τ) = e^(−t/τ)·(−1/τ). Hence y′(t) = Y·(1/τ)·e^(−t/τ) = ${G(Y / tau)}·e^(−t/${N2(tau)}) °C/s.`));
    s.push(tx(`3. t = 0: y′(0) = Y/τ = ${N2(Y)}/${N2(tau)} = ${G(Y / tau)} °C/s (en büyük hız). t = 0'daki teğet y = Y değerine t = τ = ${N2(tau)} s'de ulaşır.`, `3. At t = 0: y′(0) = Y/τ = ${N2(Y)}/${N2(tau)} = ${G(Y / tau)} °C/s (the largest rate). The tangent at t = 0 reaches y = Y at t = τ = ${N2(tau)} s.`));
    s.push(tx(`4. t₁ = ${N2(t1)} s: e^(−${N2(t1)}/${N2(tau)}) = e^(${G(-t1 / tau)}) = ${G4(ex)}; y(t₁) = ${N2(Y)}·(1 − ${G4(ex)}) = ${G(y1)} °C; y′(t₁) = ${G(Y / tau)}·${G4(ex)} = ${G(r1)} °C/s.`, `4. t₁ = ${N2(t1)} s: e^(−${N2(t1)}/${N2(tau)}) = e^(${G(-t1 / tau)}) = ${G4(ex)}; y(t₁) = ${N2(Y)}·(1 − ${G4(ex)}) = ${G(y1)} °C; y′(t₁) = ${G(Y / tau)}·${G4(ex)} = ${G(r1)} °C/s.`));
    s.push(tx(`5. Kontrol: y′ = (Y − y)/τ = (${N2(Y)} − ${G(y1)})/${N2(tau)} = ${G(r1)} °C/s ✓ (hız, son değere olan uzaklıkla orantılı).`, `5. Check: y′ = (Y − y)/τ = (${N2(Y)} − ${G(y1)})/${N2(tau)} = ${G(r1)} °C/s ✓ (the rate is proportional to the distance from the final value).`));
    s.push(tx(`6. Limit: t → ∞ için e^(−t/τ) → 0, dolayısıyla lim y(t) = ${N2(Y)}·(1 − 0) = ${N2(Y)} °C (kalıcı durum).`, `6. Limit: as t → ∞, e^(−t/τ) → 0, hence lim y(t) = ${N2(Y)}·(1 − 0) = ${N2(Y)} °C (steady state).`));
    s.push(tx(`7. %95 süresi: 1 − e^(−t/τ) = 0,95 → e^(−t/τ) = 0,05 → t = −τ·ln 0,05 = τ·ln 20 = ${N2(tau)}·${G4(ln20)} = ${G(t95)} s (≈ 3τ).`, `7. 95 % time: 1 − e^(−t/τ) = 0.95 → e^(−t/τ) = 0.05 → t = −τ·ln 0.05 = τ·ln 20 = ${N2(tau)}·${G4(ln20)} = ${G(t95)} s (≈ 3τ).`));
    s.push(tx(`8. Hata alanı (genelleştirilmiş integral): ∫₀^∞ (Y − y) dt = ∫₀^∞ Y·e^(−t/τ) dt = lim_(b→∞) [−Y·τ·e^(−t/τ)]₀^b = Y·τ = ${N2(Y)}·${N2(tau)} = ${G(Y * tau)} °C·s.`, `8. Error area (improper integral): ∫₀^∞ (Y − y) dt = ∫₀^∞ Y·e^(−t/τ) dt = lim_(b→∞) [−Y·τ·e^(−t/τ)]₀^b = Y·τ = ${N2(Y)}·${N2(tau)} = ${G(Y * tau)} °C·s.`));
    s.push(tx(`9. Yorum: y(τ) = 0,632·Y = ${G(0.6321205588 * Y)} °C. Alan Y·τ, yüksekliği Y genişliği τ olan dikdörtgene eşittir; τ küçüldükçe sensör daha hızlı, ama gürültüye de daha duyarlı olur.`, `9. Interpretation: y(τ) = 0.632·Y = ${G(0.6321205588 * Y)} °C. The area Y·τ equals a rectangle of height Y and width τ; a smaller τ means a faster sensor, but also more noise sensitivity.`));
    break; }
    case 10: {
    let z = x[0], wn = x[1], A = x[2];
    let q = Math.sqrt(1 - z * z), sg = z * wn, wd = wn * q, tp = Math.PI / wd;
    let ex = -Math.PI * z / q, mp = Math.exp(ex), yp = A * (1 + mp), ts = 4 / sg;
    s.push(tx(`1. σ = ζ·ω_n = ${N2(z)}·${N2(wn)} = ${G(sg)} 1/s; ω_d = ω_n·√(1 − ζ²) = ${N2(wn)}·√(1 − ${G(z * z)}) = ${N2(wn)}·${G(q)} = ${G(wd)} rad/s. Model: y = ${N2(A)}[1 − e^(−σt)(cos ω_d t + (σ/ω_d) sin ω_d t)].`, `1. σ = ζ·ω_n = ${N2(z)}·${N2(wn)} = ${G(sg)} 1/s; ω_d = ω_n·√(1 − ζ²) = ${N2(wn)}·√(1 − ${G(z * z)}) = ${N2(wn)}·${G(q)} = ${G(wd)} rad/s. Model: y = ${N2(A)}[1 − e^(−σt)(cos ω_d t + (σ/ω_d) sin ω_d t)].`));
    s.push(tx(`2. Çarpım kuralı: y′ = A·e^(−σt)·[σ(cos ω_d t + (σ/ω_d) sin ω_d t) − (−ω_d sin ω_d t + σ cos ω_d t)] = A·e^(−σt)·(σ²/ω_d + ω_d)·sin ω_d t (cos terimleri sadeleşir).`, `2. Product rule: y′ = A·e^(−σt)·[σ(cos ω_d t + (σ/ω_d) sin ω_d t) − (−ω_d sin ω_d t + σ cos ω_d t)] = A·e^(−σt)·(σ²/ω_d + ω_d)·sin ω_d t (the cos terms cancel).`));
    s.push(tx(`3. σ² + ω_d² = ω_n² olduğundan σ²/ω_d + ω_d = ω_n²/ω_d: y′(t) = ${N2(A)}·(${N2(wn)}²/${G(wd)})·e^(−${G(sg)}t)·sin(${G(wd)}t) = ${G(A * wn * wn / wd)}·e^(−${G(sg)}t)·sin(${G(wd)}t).`, `3. Since σ² + ω_d² = ω_n², σ²/ω_d + ω_d = ω_n²/ω_d: y′(t) = ${N2(A)}·(${N2(wn)}²/${G(wd)})·e^(−${G(sg)}t)·sin(${G(wd)}t) = ${G(A * wn * wn / wd)}·e^(−${G(sg)}t)·sin(${G(wd)}t).`));
    s.push(tx(`4. y′ = 0: e^(−σt) > 0 olduğundan sin ω_d t = 0 → ω_d t = π, 2π, … İlk pozitif kök: t_p = π/ω_d = π/${G(wd)} = ${G4(tp)} s.`, `4. y′ = 0: since e^(−σt) > 0, sin ω_d t = 0 → ω_d t = π, 2π, … First positive root: t_p = π/ω_d = π/${G(wd)} = ${G4(tp)} s.`));
    s.push(tx(`5. İşaret testi: 0 < t < t_p için sin > 0 → y′ > 0 (artıyor); t_p < t < 2t_p için y′ < 0 (azalıyor) → t_p'de MAKSİMUM (ilk tepe).`, `5. Sign test: for 0 < t < t_p sin > 0 → y′ > 0 (rising); for t_p < t < 2t_p, y′ < 0 (falling) → MAXIMUM at t_p (the first peak).`));
    s.push(tx(`6. Tepe değeri: cos π = −1, sin π = 0 → y(t_p) = ${N2(A)}[1 + e^(−σπ/ω_d)] = ${N2(A)}[1 + e^(−πζ/√(1−ζ²))].`, `6. Peak value: cos π = −1, sin π = 0 → y(t_p) = ${N2(A)}[1 + e^(−σπ/ω_d)] = ${N2(A)}[1 + e^(−πζ/√(1−ζ²))].`));
    s.push(tx(`7. Sayılar: üs = −π·${N2(z)}/${G(q)} = ${G4(ex)}; M_p = e^(${G4(ex)}) = ${G4(mp)} = %${G(100 * mp)}; y_p = ${N2(A)}·(1 + ${G4(mp)}) = ${G4(yp)} mm.`, `7. Numbers: exponent = −π·${N2(z)}/${G(q)} = ${G4(ex)}; M_p = e^(${G4(ex)}) = ${G4(mp)} = ${G(100 * mp)} %; y_p = ${N2(A)}·(1 + ${G4(mp)}) = ${G4(yp)} mm.`));
    s.push(tx(`8. Doğrulama: y(t_p) doğrudan formülden ${G4(A * (1 - Math.exp(-sg * tp) * (Math.cos(wd * tp) + sg / wd * Math.sin(wd * tp))))} mm ✓. Yerleşme (%2, ders formülü): t_s ≈ 4/σ = 4/${G(sg)} = ${G(ts)} s. Birimler: y mm, t s, ω rad/s ✓.`, `8. Verification: y(t_p) from the formula directly is ${G4(A * (1 - Math.exp(-sg * tp) * (Math.cos(wd * tp) + sg / wd * Math.sin(wd * tp))))} mm ✓. Settling (2 %, course formula): t_s ≈ 4/σ = 4/${G(sg)} = ${G(ts)} s. Units: y mm, t s, ω rad/s ✓.`));
    s.push(tx(`9. Yorum: aşım yalnızca ζ'ya bağlıdır (ζ = ${N2(z)} → %${G(100 * mp)}); ω_n'yi artırmak tepeyi öne çeker (t_p = ${G4(tp)} s) ama aşımı değiştirmez. Daha çok sönüm = daha az aşım, daha yavaş yanıt.`, `9. Interpretation: overshoot depends on ζ only (ζ = ${N2(z)} → ${G(100 * mp)} %); raising ω_n moves the peak earlier (t_p = ${G4(tp)} s) but leaves the overshoot unchanged. More damping = less overshoot, slower response.`));
    break; }
    case 11: {
    let vs = x[0], b = x[1], B = b / 10000, a = 2 * b * vs * vs * vs / 10000;
    let cm = a / vs + B * vs * vs, ch = a / (0.5 * vs) + B * 0.25 * vs * vs, cd = a / (1.5 * vs) + B * 2.25 * vs * vs;
    s.push(tx(`1. Model: C(V) = A/V + B·V², A = ${G(a)} TL·m/dk, B = ${N2(b)}×10⁻⁴ = ${G4(B)} TL·dk²/m², V > 0 (m/dk).`, `1. Model: C(V) = A/V + B·V², A = ${G(a)} TL·m/min, B = ${N2(b)}×10⁻⁴ = ${G4(B)} TL·min²/m², V > 0 (m/min).`));
    s.push(tx(`2. Türeve hazırlık: C(V) = ${G(a)}·V⁻¹ + ${G4(B)}·V².`, `2. Prepare for differentiation: C(V) = ${G(a)}·V⁻¹ + ${G4(B)}·V².`));
    s.push(tx(`3. Türev (kuvvet kuralı): C′(V) = −${G(a)}·V⁻² + 2·${G4(B)}·V = −${G(a)}/V² + ${G4(2 * B)}·V.`, `3. Derivative (power rule): C′(V) = −${G(a)}·V⁻² + 2·${G4(B)}·V = −${G(a)}/V² + ${G4(2 * B)}·V.`));
    s.push(tx(`4. C′(V) = 0: ${G4(2 * B)}·V = ${G(a)}/V² → V³ = ${G(a)}/${G4(2 * B)} = ${G(vs * vs * vs)}.`, `4. C′(V) = 0: ${G4(2 * B)}·V = ${G(a)}/V² → V³ = ${G(a)}/${G4(2 * B)} = ${G(vs * vs * vs)}.`));
    s.push(tx(`5. Küpkök: V* = ∛${G(vs * vs * vs)} = ${N2(vs)} m/dk.`, `5. Cube root: V* = ∛${G(vs * vs * vs)} = ${N2(vs)} m/min.`));
    s.push(tx(`6. İkinci türev: C″(V) = 2·${G(a)}/V³ + ${G4(2 * B)} > 0 (V > 0) → V*'da MİNİMUM; C″(V*) = ${G4(6 * B)}. V → 0 ve V → ∞ için C → ∞, yani mutlak minimum.`, `6. Second derivative: C″(V) = 2·${G(a)}/V³ + ${G4(2 * B)} > 0 (V > 0) → MINIMUM at V*; C″(V*) = ${G4(6 * B)}. C → ∞ as V → 0 and V → ∞, so it is the absolute minimum.`));
    s.push(tx(`7. C_min = C(${N2(vs)}) = ${G(a)}/${N2(vs)} + ${G4(B)}·(${N2(vs)})² = ${G(a / vs)} + ${G(B * vs * vs)} = ${G(cm)} TL/parça.`, `7. C_min = C(${N2(vs)}) = ${G(a)}/${N2(vs)} + ${G4(B)}·(${N2(vs)})² = ${G(a / vs)} + ${G(B * vs * vs)} = ${G(cm)} TL/part.`));
    s.push(tx(`8. Karşılaştırma: C(${G(0.5 * vs)}) = ${G(ch)} TL, C(${G(1.5 * vs)}) = ${G(cd)} TL; ikisi de ${G(cm)} TL'den büyük ✓. Birim: (TL·m/dk)/(m/dk) = TL ✓.`, `8. Comparison: C(${G(0.5 * vs)}) = ${G(ch)} TL, C(${G(1.5 * vs)}) = ${G(cd)} TL; both exceed ${G(cm)} TL ✓. Unit: (TL·m/min)/(m/min) = TL ✓.`));
    s.push(tx(`9. Yorum: optimumda işleme terimi takım terimin iki katıdır (${G(a / vs)} = 2·${G(B * vs * vs)} TL); n = 1/3 için T ∝ V⁻³ olduğundan hızı artırmak takım maliyetini hızla büyütür.`, `9. Interpretation: at the optimum the machining term is twice the tool term (${G(a / vs)} = 2·${G(B * vs * vs)} TL); with n = 1/3, T ∝ V⁻³ so raising the speed inflates the tool cost quickly.`));
    break; }
    case 12: {
    let cc = x[0], pp = x[1], r = x[2] / 100;
    let q = cc / pp, L = q * q * q, Lp = -3 * L / pp, dP = r * pp, lin = Lp * dP, L1 = L * Math.pow(1 + r, -3), ex = L1 - L, er = lin - ex;
    s.push(tx(`1. L₁₀ = (C/P)³ = (${N2(cc)}/${N2(pp)})³ = ${G(q)}³ = ${G(L)} milyon devir.`, `1. L₁₀ = (C/P)³ = (${N2(cc)}/${N2(pp)})³ = ${G(q)}³ = ${G(L)} million revolutions.`));
    s.push(tx(`2. P'ye göre fonksiyon: L(P) = C³·P⁻³ = ${N2(cc * cc * cc)}·P⁻³ (C sabit).`, `2. As a function of P: L(P) = C³·P⁻³ = ${N2(cc * cc * cc)}·P⁻³ (C constant).`));
    s.push(tx(`3. Türev (kuvvet kuralı): L′(P) = −3·${N2(cc * cc * cc)}·P⁻⁴ = −3·C³/P⁴.`, `3. Derivative (power rule): L′(P) = −3·${N2(cc * cc * cc)}·P⁻⁴ = −3·C³/P⁴.`));
    s.push(tx(`4. P = ${N2(pp)} kN'da: L′ = −3·${N2(cc * cc * cc)}/${N2(pp * pp * pp * pp)} = ${G(Lp)} milyon devir/kN (= −3L/P = −3·${G(L)}/${N2(pp)} ✓).`, `4. At P = ${N2(pp)} kN: L′ = −3·${N2(cc * cc * cc)}/${N2(pp * pp * pp * pp)} = ${G(Lp)} million rev/kN (= −3L/P = −3·${G(L)}/${N2(pp)} ✓).`));
    s.push(tx(`5. Yük artışı ΔP = ${N2(x[2])} % · ${N2(pp)} = ${G(dP)} kN. Doğrusal tahmin: ΔL ≈ L′·ΔP = ${G(Lp)}·${G(dP)} = ${G(lin)} milyon devir (%${G(-300 * r)} ≈ −3·${N2(x[2])} %).`, `5. Load increase ΔP = ${N2(x[2])} % · ${N2(pp)} = ${G(dP)} kN. Linear estimate: ΔL ≈ L′·ΔP = ${G(Lp)}·${G(dP)} = ${G(lin)} million rev (${G(-300 * r)} % ≈ −3·${N2(x[2])} %).`));
    s.push(tx(`6. Kesin: L₁ = (C/(P(1 + r)))³ = L·(1 + ${G(r)})⁻³ = ${G(L)}·${G4(Math.pow(1 + r, -3))} = ${G(L1)} milyon devir; ΔL = ${G(ex)} (%${G(100 * ex / L)}).`, `6. Exact: L₁ = (C/(P(1 + r)))³ = L·(1 + ${G(r)})⁻³ = ${G(L)}·${G4(Math.pow(1 + r, -3))} = ${G(L1)} million rev; ΔL = ${G(ex)} (${G(100 * ex / L)} %).`));
    s.push(tx(`7. Fark: doğrusal − kesin = ${G(lin)} − (${G(ex)}) = ${G(er)} milyon devir; doğrusal tahmin ömür kaybını FAZLA gösterir (konveks).`, `7. Difference: linear − exact = ${G(lin)} − (${G(ex)}) = ${G(er)} million rev; the linear estimate OVERstates the life loss (convex).`));
    s.push(tx(`8. İkinci mertebe kontrol: L″ = 12C³P⁻⁵ = 12L/P²; hata ≈ ½L″ΔP² = 6·L·r² = 6·${G(L)}·${G4(r * r)} = ${G(6 * L * r * r)} ✓ (kesin farka yakın). Birim: (milyon devir/kN)·kN ✓.`, `8. Second-order check: L″ = 12C³P⁻⁵ = 12L/P²; error ≈ ½L″ΔP² = 6·L·r² = 6·${G(L)}·${G4(r * r)} = ${G(6 * L * r * r)} ✓ (close to the actual difference). Unit: (million rev/kN)·kN ✓.`));
    s.push(tx(`9. Yorum: yük sadece %${N2(x[2])} artınca ömür yaklaşık %${G(-100 * ex / L)} kısalır; bu yüzden aşırı yük ve yanlış montaj rulman ömrünü çarpıcı biçimde düşürür.`, `9. Interpretation: a load rise of only ${N2(x[2])} % shortens life by about ${G(-100 * ex / L)} %; this is why overload and misalignment cut bearing life dramatically.`));
    break; }
    case 13: {
    let k = x[0], cc = x[1], d = x[2];
    let Fd = k * d + cc * d * d * d, kt = k + 3 * cc * d * d, w1 = k * d * d / 2, w2 = cc * d * d * d * d / 4, W = w1 + w2;
    s.push(tx(`1. Model: F(x) = ${N2(k)}x + ${N2(cc)}x³ (N; x mm). δ = ${N2(d)} mm. Birimler: k N/mm, c N/mm³.`, `1. Model: F(x) = ${N2(k)}x + ${N2(cc)}x³ (N; x in mm). δ = ${N2(d)} mm. Units: k N/mm, c N/mm³.`));
    s.push(tx(`2. Kuvvet: F(${N2(d)}) = ${N2(k)}·${N2(d)} + ${N2(cc)}·${N2(d * d * d)} = ${G(k * d)} + ${G(cc * d * d * d)} = ${G(Fd)} N.`, `2. Force: F(${N2(d)}) = ${N2(k)}·${N2(d)} + ${N2(cc)}·${N2(d * d * d)} = ${G(k * d)} + ${G(cc * d * d * d)} = ${G(Fd)} N.`));
    s.push(tx(`3. Teğet rijitlik (türev): dF/dx = ${N2(k)} + 3·${N2(cc)}·x² = ${N2(k)} + ${N2(3 * cc)}x².`, `3. Tangent stiffness (derivative): dF/dx = ${N2(k)} + 3·${N2(cc)}·x² = ${N2(k)} + ${N2(3 * cc)}x².`));
    s.push(tx(`4. x = 0'da dF/dx = ${N2(k)} N/mm; x = δ = ${N2(d)} mm'de dF/dx = ${N2(k)} + ${N2(3 * cc)}·${N2(d * d)} = ${G(kt)} N/mm (${G(kt / k)} kat).`, `4. At x = 0 dF/dx = ${N2(k)} N/mm; at x = δ = ${N2(d)} mm dF/dx = ${N2(k)} + ${N2(3 * cc)}·${N2(d * d)} = ${G(kt)} N/mm (${G(kt / k)} times).`));
    s.push(tx(`5. Enerji = eğri altındaki alan: W = ∫₀^δ (${N2(k)}x + ${N2(cc)}x³) dx.`, `5. Energy = area under the curve: W = ∫₀^δ (${N2(k)}x + ${N2(cc)}x³) dx.`));
    s.push(tx(`6. Antitürev (kuvvet kuralının tersi): ∫(kx + cx³) dx = kx²/2 + cx⁴/4 = ${G(k / 2)}x² + ${G(cc / 4)}x⁴.`, `6. Antiderivative (reverse power rule): ∫(kx + cx³) dx = kx²/2 + cx⁴/4 = ${G(k / 2)}x² + ${G(cc / 4)}x⁴.`));
    s.push(tx(`7. Sınırlar 0 → ${N2(d)}: W = ${G(k / 2)}·${N2(d * d)} + ${G(cc / 4)}·${N2(d * d * d * d)} = ${G(w1)} + ${G(w2)} = ${G(W)} N·mm = ${G(W / 1000)} J.`, `7. Limits 0 → ${N2(d)}: W = ${G(k / 2)}·${N2(d * d)} + ${G(cc / 4)}·${N2(d * d * d * d)} = ${G(w1)} + ${G(w2)} = ${G(W)} N·mm = ${G(W / 1000)} J.`));
    s.push(tx(`8. Kontrol: ortalama kuvvet W/δ = ${G(W / d)} N, F(δ)/2 = ${G(Fd / 2)} N'den küçük ✓ (F konveks). Doğrusal yay enerjisi kδ²/2 = ${G(w1)} N·mm; sertleşme %${G(100 * w2 / w1)} ekstra enerji ekler.`, `8. Check: mean force W/δ = ${G(W / d)} N is below F(δ)/2 = ${G(Fd / 2)} N ✓ (F is convex). Linear-spring energy kδ²/2 = ${G(w1)} N·mm; hardening adds ${G(100 * w2 / w1)} % extra energy.`));
    s.push(tx(`9. Yorum: sıkıştırma arttıkça bağlantı sertleşir (${N2(k)} → ${G(kt)} N/mm); ön yükleme enerjisi ${G(W / 1000)} J olup gevşemeye karşı depolanan enerjidir. Birim: N·mm = mJ ✓.`, `9. Interpretation: the joint stiffens with compression (${N2(k)} → ${G(kt)} N/mm); the preload energy of ${G(W / 1000)} J is the energy stored against loosening. Unit: N·mm = mJ ✓.`));
    break; }
    case 14: {
    let tp = x[0], n = x[1];
    let w = n * Math.PI / 30, Wc = 2 * tp, tm = tp / Math.PI, pw = tp * n / 30;
    let th1 = Math.asin(1 / Math.PI), c1 = Math.cos(th1), dE = tp * (2 * c1 - (Math.PI - 2 * th1) / Math.PI), I = dE / (0.05 * w * w);
    s.push(tx(`1. Model: T(θ) = ${N2(tp)}·sin θ N·m (0 ≤ θ ≤ π), 0 (π ≤ θ ≤ 2π). ω = 2πn/60 = ${N2(n)}π/30 = ${G(w)} rad/s.`, `1. Model: T(θ) = ${N2(tp)}·sin θ N·m (0 ≤ θ ≤ π), 0 (π ≤ θ ≤ 2π). ω = 2πn/60 = ${N2(n)}π/30 = ${G(w)} rad/s.`));
    s.push(tx(`2. Çevrim işi: W = ∫₀^π ${N2(tp)} sin θ dθ = ${N2(tp)}·[−cos θ]₀^π = ${N2(tp)}·(1 + 1) = ${N2(Wc)} J.`, `2. Work per cycle: W = ∫₀^π ${N2(tp)} sin θ dθ = ${N2(tp)}·[−cos θ]₀^π = ${N2(tp)}·(1 + 1) = ${N2(Wc)} J.`));
    s.push(tx(`3. Ortalama tork (ortalama değer, 2π'ye böl): T_ort = W/(2π) = ${N2(Wc)}/(2π) = ${N2(tp)}/π = ${G(tm)} N·m.`, `3. Mean torque (average value, divide by 2π): T_mean = W/(2π) = ${N2(Wc)}/(2π) = ${N2(tp)}/π = ${G(tm)} N·m.`));
    s.push(tx(`4. Güç: P = T_ort·ω = (${N2(tp)}/π)·(${N2(n)}π/30) = ${N2(tp)}·${N2(n)}/30 = ${G(pw)} W = ${G(pw / 1000)} kW.`, `4. Power: P = T_mean·ω = (${N2(tp)}/π)·(${N2(n)}π/30) = ${N2(tp)}·${N2(n)}/30 = ${G(pw)} W = ${G(pw / 1000)} kW.`));
    s.push(tx(`5. T = T_ort kesişimleri: ${N2(tp)} sin θ = ${N2(tp)}/π → sin θ = 1/π → θ₁ = arcsin(1/π) = ${G4(th1)} rad (${G(th1 * 180 / Math.PI)}°), θ₂ = π − θ₁ = ${G4(Math.PI - th1)} rad.`, `5. Crossings T = T_mean: ${N2(tp)} sin θ = ${N2(tp)}/π → sin θ = 1/π → θ₁ = arcsin(1/π) = ${G4(th1)} rad (${G(th1 * 180 / Math.PI)}°), θ₂ = π − θ₁ = ${G4(Math.PI - th1)} rad.`));
    s.push(tx(`6. Enerji fazlası: ΔE = ∫_θ₁^θ₂ (T_p sin θ − T_p/π) dθ = T_p[−cos θ]_θ₁^θ₂ − (T_p/π)(θ₂ − θ₁) = T_p·2cos θ₁ − (T_p/π)(π − 2θ₁).`, `6. Energy surplus: ΔE = ∫_θ₁^θ₂ (T_p sin θ − T_p/π) dθ = T_p[−cos θ]_θ₁^θ₂ − (T_p/π)(θ₂ − θ₁) = T_p·2cos θ₁ − (T_p/π)(π − 2θ₁).`));
    s.push(tx(`7. cos θ₁ = √(1 − 1/π²) = ${G4(c1)}; ΔE = ${N2(tp)}·(2·${G4(c1)} − ${G4((Math.PI - 2 * th1) / Math.PI)}) = ${N2(tp)}·${G4(2 * c1 - (Math.PI - 2 * th1) / Math.PI)} = ${G(dE)} J.`, `7. cos θ₁ = √(1 − 1/π²) = ${G4(c1)}; ΔE = ${N2(tp)}·(2·${G4(c1)} − ${G4((Math.PI - 2 * th1) / Math.PI)}) = ${N2(tp)}·${G4(2 * c1 - (Math.PI - 2 * th1) / Math.PI)} = ${G(dE)} J.`));
    s.push(tx(`8. Volan (ders formülü): I = ΔE/(C_s·ω²) = ${G(dE)}/(0,05·${G(w)}²) = ${G(dE)}/${G(0.05 * w * w)} = ${G(I)} kg·m². Birim: J/(rad/s)² = kg·m² ✓.`, `8. Flywheel (course formula): I = ΔE/(C_s·ω²) = ${G(dE)}/(0.05·${G(w)}²) = ${G(dE)}/${G(0.05 * w * w)} = ${G(I)} kg·m². Unit: J/(rad/s)² = kg·m² ✓.`));
    s.push(tx(`9. Yorum: tepe tork ${N2(tp)} N·m iken ortalama yalnızca ${G(tm)} N·m'dir (oran π). Devir ${N2(n)} dev/dk'dan yükselirse ω² ile orantılı olarak daha küçük volan yeter.`, `9. Interpretation: the peak torque is ${N2(tp)} N·m but the mean only ${G(tm)} N·m (ratio π). A higher speed than ${N2(n)} rpm needs a smaller flywheel in proportion to ω².`));
    break; }
    case 15: {
    let ds = x[0], a0 = x[1] / 1000, ac = x[2] / 1000;
    let kp = 1e-11 * Math.pow(ds, 4) * Math.PI * Math.PI, Nf = (1 / kp) * (1 / a0 - 1 / ac);
    let r0 = kp * a0 * a0, rc = kp * ac * ac, f2 = (1 / (2 * a0)) / (1 / a0 - 1 / ac), N9 = Nf * Math.pow(0.9, -4);
    s.push(tx(`1. ΔK = Δσ√(πa) → (ΔK)⁴ = Δσ⁴π²a². Böylece da/dN = C·Δσ⁴π²·a² = K′·a², K′ = 10⁻¹¹·${N2(ds)}⁴·π² = ${Sci(kp)} 1/(m·çevrim).`, `1. ΔK = Δσ√(πa) → (ΔK)⁴ = Δσ⁴π²a². Hence da/dN = C·Δσ⁴π²·a² = K′·a², K′ = 10⁻¹¹·${N2(ds)}⁴·π² = ${Sci(kp)} 1/(m·cycle).`));
    s.push(tx(`2. Büyüme hızları: a₀ = ${N2(x[1])} mm = ${Sci(a0)} m'de da/dN = K′a₀² = ${Sci(r0)} m/çevrim; a_c = ${N2(x[2])} mm'de ${Sci(rc)} m/çevrim (${G(rc / r0)} kat hızlanır).`, `2. Growth rates: at a₀ = ${N2(x[1])} mm = ${Sci(a0)} m, da/dN = K′a₀² = ${Sci(r0)} m/cycle; at a_c = ${N2(x[2])} mm it is ${Sci(rc)} m/cycle (${G(rc / r0)} times faster).`));
    s.push(tx("3. Değişkenlere ayır: dN = da/(K′a²) → N_f = ∫_{a₀}^{a_c} da/(K′a²) = (1/K′)·∫_{a₀}^{a_c} a⁻² da.", "3. Separate variables: dN = da/(K′a²) → N_f = ∫_{a₀}^{a_c} da/(K′a²) = (1/K′)·∫_{a₀}^{a_c} a⁻² da."));
    s.push(tx("4. Antitürev: ∫a⁻² da = −a⁻¹ = −1/a. Sınırlar: N_f = (1/K′)·[−1/a]_{a₀}^{a_c} = (1/K′)·(1/a₀ − 1/a_c).", "4. Antiderivative: ∫a⁻² da = −a⁻¹ = −1/a. Limits: N_f = (1/K′)·[−1/a]_{a₀}^{a_c} = (1/K′)·(1/a₀ − 1/a_c)."));
    s.push(tx(`5. Birim: mm → m. 1/a₀ = 1/${Sci(a0)} = ${G(1 / a0)} m⁻¹, 1/a_c = 1/${Sci(ac)} = ${G(1 / ac)} m⁻¹; fark = ${G(1 / a0 - 1 / ac)} m⁻¹.`, `5. Units: mm → m. 1/a₀ = 1/${Sci(a0)} = ${G(1 / a0)} m⁻¹, 1/a_c = 1/${Sci(ac)} = ${G(1 / ac)} m⁻¹; difference = ${G(1 / a0 - 1 / ac)} m⁻¹.`));
    s.push(tx(`6. N_f = ${G(1 / a0 - 1 / ac)}/${Sci(kp)} = ${F(Nf, 0)} ≈ ${Sci(Nf)} çevrim.`, `6. N_f = ${G(1 / a0 - 1 / ac)}/${Sci(kp)} = ${F(Nf, 0)} ≈ ${Sci(Nf)} cycles.`));
    s.push(tx(`7. Kontrol: a(N) = 1/(1/a₀ − K′N) → N = N_f'de payda 1/a_c olur, a = ${N2(x[2])} mm ✓ (çözüm N_f'ye yaklaşırken sonsuza gider).`, `7. Check: a(N) = 1/(1/a₀ − K′N) → at N = N_f the denominator equals 1/a_c, so a = ${N2(x[2])} mm ✓ (the solution blows up as N approaches N_f).`));
    s.push(tx(`8. Ömrün dağılımı: a₀'dan 2a₀'a büyüme (1/(2a₀))/(1/a₀ − 1/a_c) = %${G(100 * f2)} ömür harcar; ömrün çoğu çatlak küçükken geçer.`, `8. Life distribution: growing from a₀ to 2a₀ uses (1/(2a₀))/(1/a₀ − 1/a_c) = ${G(100 * f2)} % of the life; most of the life is spent while the crack is small.`));
    s.push(tx(`9. Yorum: N ∝ Δσ⁻⁴ olduğundan Δσ %10 azalırsa ömür 0,9⁻⁴ = ${G4(Math.pow(0.9, -4))} kat artar: N ≈ ${Sci(N9)} çevrim. Birim kontrolü: (1/K′)·m⁻¹ = çevrim ✓.`, `9. Interpretation: since N ∝ Δσ⁻⁴, a 10 % lower Δσ lengthens life by 0.9⁻⁴ = ${G4(Math.pow(0.9, -4))}: N ≈ ${Sci(N9)} cycles. Unit check: (1/K′)·m⁻¹ = cycles ✓.`));
    break; }
    default: {
    let v0 = x[0], t0 = x[1], n = x[2], pc = x[3] / 100.0;
    let c = v0 * Math.pow(t0, n);
    let slope = -t0 / (n * v0), dv = v0 * pc;
    let dtLin = slope * dv, t1 = t0 * Math.pow(1 + pc, -1 / n);
    s.push(tx(`1. Nicelikler: V₀ = ${N2(v0)} m/dk, T₀ = ${N2(t0)} dk, n = ${N2(n)}. Taylor sabiti C = V₀·T₀^n = ${N2(v0)}·${N2(t0)}^${N2(n)} ≈ ${N2(c)}.`, `1. Quantities: V₀ = ${N2(v0)} m/min, T₀ = ${N2(t0)} min, n = ${N2(n)}. Taylor constant C = V₀·T₀^n = ${N2(v0)}·${N2(t0)}^${N2(n)} ≈ ${N2(c)}.`));
    s.push(tx(`2. V·T^n = C denklemini V'ye göre türet (T = T(V)): 1·T^n + V·n·T^(n−1)·T' = 0.`, `2. Differentiate V·T^n = C with respect to V (T = T(V)): 1·T^n + V·n·T^(n−1)·T' = 0.`));
    s.push(tx("3. T'yi yalnız bırak: V·n·T^(n−1)·T' = −T^n  →  T' = −T^n / (n·V·T^(n−1)).", "3. Isolate T': V·n·T^(n−1)·T' = −T^n  →  T' = −T^n / (n·V·T^(n−1))."));
    s.push(tx("4. Sadeleştir (T^n / T^(n−1) = T): T' = dT/dV = −T / (n·V).", "4. Simplify (T^n / T^(n−1) = T): T' = dT/dV = −T / (n·V)."));
    s.push(tx(`5. V₀'da: dT/dV = −${N2(t0)}/(${N2(n)}·${N2(v0)}) = ${G4(slope)} dk per (m/dk).`, `5. At V₀: dT/dV = −${N2(t0)}/(${N2(n)}·${N2(v0)}) = ${G4(slope)} min per (m/min).`));
    s.push(tx(`6. Hız artışı ΔV = ${N2(x[3])}% · ${N2(v0)} = ${N2(dv)} m/dk. Diferansiyel: ΔT ≈ T'·ΔV = ${G4(slope)}·${N2(dv)} = ${G(dtLin)} dk (%${G(100 * dtLin / t0)}).`, `6. Speed increase ΔV = ${N2(x[3])}% · ${N2(v0)} = ${N2(dv)} m/min. Differential: ΔT ≈ T'·ΔV = ${G4(slope)}·${N2(dv)} = ${G(dtLin)} min (${G(100 * dtLin / t0)}%).`));
    s.push(tx(`7. Kesin: T₁ = T₀·(V₀/V₁)^(1/n) = ${N2(t0)}·(${G(1 + pc)})^(−${G(1 / n)}) = ${G(t1)} dk; ΔT = ${G(t1 - t0)} dk (%${G(100 * (t1 - t0) / t0)}).`, `7. Exact: T₁ = T₀·(V₀/V₁)^(1/n) = ${N2(t0)}·(${G(1 + pc)})^(−${G(1 / n)}) = ${G(t1)} min; ΔT = ${G(t1 - t0)} min (${G(100 * (t1 - t0) / t0)}%).`));
    s.push(tx(`8. Bağıl kural kontrolü: %ΔT ≈ −(1/n)·%ΔV = −${G(1 / n)}·${N2(x[3])} = −${G(x[3] / n)}%. Birim: (dk/(m/dk))·(m/dk) = dk ✓. Diferansiyel düşüşü olduğundan fazla tahmin eder çünkü T(V) konvekstir.`, `8. Relative-rule check: %ΔT ≈ −(1/n)·%ΔV = −${G(1 / n)}·${N2(x[3])} = −${G(x[3] / n)}%. Unit: (min/(m/min))·(m/min) = min ✓. The differential overestimates the drop because T(V) is convex.`));
    s.push(tx(`9. Yorum: 1/n = ${G(1 / n)} olduğundan takım ömrü hıza çok duyarlıdır; hızı yalnızca %${N2(x[3])} artırmak ömrü yaklaşık %${G(-100 * (t1 - t0) / t0)} kısaltır. Verimlilik ile takım maliyeti arasında denge gerekir.`, `9. Interpretation: since 1/n = ${G(1 / n)}, tool life is very sensitive to speed; raising the speed only ${N2(x[3])}% shortens the life by about ${G(-100 * (t1 - t0) / t0)}%. Productivity must be balanced against tool cost.`));
    break; }
    }
    return s;
  }


  function draw(canvas, problem) {
    let x = problem.p;
    let accent = canvas.accent();
    switch (problem.scn) {
    case 0: {
    let a = x[0] / 1000.0, p0 = x[1], b = 2 * a * p0, dm = a * p0 * p0;
    canvas.setViewport(-p0 * 0.15, p0 * 2.15, -dm * 0.2, dm * 1.3);
    canvas.addFunction({ evaluator: safe((v) => -a * v * v + b * v), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: p0, color: canvas.gray() });
    canvas.addGuideLine({ axis: 'horizontal', position: dm, color: canvas.gray() });
    canvas.addMarker({ x: p0, y: dm, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `(${N2(p0)} W, ${G(dm)} µm)` });
    break; }
    case 1: {
    let pw = x[0], ht = x[1] / 1000.0 * x[2] / 1000.0, em = x[3];
    let vmax = pw / (em * ht);
    let e = (v) => (v <= 0 ? NaN : pw / (ht * v));
    canvas.setViewport(-vmax * 0.1, vmax * 2.2, -em * 0.2, em * 3.0);
    canvas.addFilledArea({ evaluator: safe(e), xMin: vmax, xMax: vmax * 2.2, color: rgba(canvas.red(), 0.275) });
    canvas.addFunction({ evaluator: safe(e), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'horizontal', position: em, color: canvas.gray(), label: `E_min = ${N2(em)}` });
    canvas.addMarker({ x: vmax, y: em, color: canvas.gold(), radius: 7.0, label: `v = ${G(vmax)} mm/s` });
    break; }
    case 2: {
    let sv = x[0], k = x[1], s1 = x[2];
    let v0 = sv * sv, v1 = s1 * s1;
    let vmax = Math.max(v0, v1) * 1.25, ymax = k * Math.pow(vmax, 1.5);
    let y1 = k * s1 * s1 * s1, sl = 1.5 * k * s1;
    canvas.setViewport(-vmax * 0.06, vmax, -ymax * 0.06, ymax);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : k * Math.pow(v, 1.5))), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => y1 + sl * (v - v1)), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: v0, y: k * Math.pow(v0, 1.5), color: canvas.blue(), radius: 6.0, label: tx("veri", "data") });
    canvas.addMarker({ x: v1, y: y1, color: canvas.gold(), radius: 7.0, label: `V = ${N2(y1)}, V' = ${G(sl)}` });
    break; }
    case 3: {
    let l0 = x[0], al = x[1] * 0.000001, dt = x[2];
    let er = (v) => l0 * (Math.exp(al * v) - 1 - al * v);
    let top = er(dt * 1.2);
    canvas.setViewport(-dt * 0.1, dt * 1.2, -top * 0.15, top * 1.2);
    canvas.addFunction({ evaluator: safe(er), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: dt, color: canvas.gray() });
    canvas.addMarker({ x: dt, y: er(dt), color: canvas.gold(), radius: 7.0, label: `${tx("hata", "error")} = ${G4(er(dt))} mm` });
    break; }
    case 4: {
    let tm = x[0], k = x[1], t = x[2];
    let tv = tm * Math.exp(-k * t), rate = -k * tv;
    let xmax = Math.max(t * 1.7, 4 / k);
    canvas.setViewport(-xmax * 0.06, xmax, -tm * 0.1, tm * 1.15);
    canvas.addFunction({ evaluator: safe((v) => tm * Math.exp(-k * v)), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => tv + rate * (v - t)), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: t, y: tv, color: canvas.gold(), radius: 7.0, label: `T = ${N2(tv)}, dT/dt = ${N2(rate)}` });
    break; }
    case 5: {
    let a = x[0], b = x[1], r = x[2] / 100.0, m = x[3];
    let la = Math.log10(a);
    let f = Math.pow(1 - r, -1 / b), m1 = m + Math.log10(f);
    let yS0 = la - b * m, yS1 = la - b * m1;
    canvas.setViewport(3, 8.5, la - b * 8.5 - 0.15, la - b * 3 + 0.15);
    canvas.addFunction({ evaluator: safe((v) => la - b * v), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: m, y: yS0, color: canvas.blue(), radius: 6.0, label: `log N₀ = ${N2(m)}` });
    canvas.addMarker({ x: m1, y: yS1, color: canvas.gold(), radius: 7.0, label: `log N₁ = ${N2(m1)} (×${N2(f)})` });
    break; }
    case 6: {
    let ts = x[0], b = x[1], a = x[1] * x[0] * x[0];
    let c = (v) => (v <= 0 ? NaN : a / v + b * v);
    let cm = 2 * b * ts;
    canvas.setViewport(0, ts * 2.6, 0, cm * 2.3);
    canvas.addFunction({ evaluator: safe(c), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: ts, color: canvas.gray() });
    canvas.addMarker({ x: ts, y: cm, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `(${N2(ts)} µm, ${N2(cm)} TL)` });
    break; }
    case 8: {
    let su = x[0], xu = x[1], x1 = x[2], eu = xu / 100, E = 2 * su / eu, c = su / (eu * eu);
    let sg = (v) => E * (v / 100) - c * (v / 100) * (v / 100);
    let sg1 = sg(x1), tg1 = E - 2 * c * (x1 / 100);
    canvas.setViewport(-xu * 0.12, xu * 1.7, -su * 0.15, su * 1.3);
    canvas.addFilledArea({ evaluator: safe(sg), xMin: 0, xMax: x1 });
    canvas.addFunction({ evaluator: safe(sg), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => E * v / 100), color: canvas.gray(), thickness: 1.5, dashed: true });
    canvas.addFunction({ evaluator: safe((v) => sg1 + tg1 / 100 * (v - x1)), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'vertical', position: x1, color: canvas.gray() });
    canvas.addMarker({ x: xu, y: su, color: canvas.blue(), shape: 'diamond', radius: 6.0, label: `σ_u = ${N2(su)} MPa` });
    canvas.addMarker({ x: x1, y: sg1, color: canvas.gold(), radius: 7.0, label: `σ(ε₁) = ${G(sg1)} MPa, E_t = ${G(tg1)}` });
    break; }
    case 9: {
    let Y = x[0], tau = x[1], t1 = x[2], y1 = Y * (1 - Math.exp(-t1 / tau)), t95 = tau * Math.log(20);
    let xm = Math.max(5 * tau, 1.2 * t1);
    canvas.setViewport(-xm * 0.06, xm, -Y * 0.1, Y * 1.25);
    canvas.addFunction({ evaluator: safe((v) => Y * (1 - Math.exp(-v / tau))), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => (Y / tau) * v), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'horizontal', position: Y, color: canvas.gray(), label: `Y = ${N2(Y)}` });
    canvas.addMarker({ x: t95, y: 0.95 * Y, color: canvas.blue(), radius: 6.0, label: `t₉₅ = ${G(t95)} s` });
    canvas.addMarker({ x: t1, y: y1, color: canvas.gold(), radius: 7.0, label: `y(${N2(t1)}) = ${G(y1)}` });
    break; }
    case 10: {
    let z = x[0], wn = x[1], A = x[2];
    let q = Math.sqrt(1 - z * z), sg = z * wn, wd = wn * q, tp = Math.PI / wd, mp = Math.exp(-Math.PI * z / q), ts = 4 / sg;
    let yf = (v) => (v < 0 ? NaN : A * (1 - Math.exp(-sg * v) * (Math.cos(wd * v) + sg / wd * Math.sin(wd * v))));
    let xm = Math.max(3.2 * tp, 1.3 * ts);
    canvas.setViewport(-xm * 0.06, xm, -A * 0.15, A * (1 + mp) * 1.25);
    canvas.addFunction({ evaluator: safe(yf), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'horizontal', position: A, color: canvas.gray(), label: `A = ${N2(A)}` });
    canvas.addGuideLine({ axis: 'vertical', position: tp, color: canvas.gray() });
    canvas.addMarker({ x: tp, y: A * (1 + mp), color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `t_p = ${G4(tp)} s, M_p = ${G(100 * mp)} %` });
    break; }
    case 11: {
    let vs = x[0], b = x[1], B = b / 10000, a = 2 * b * vs * vs * vs / 10000;
    let cf = (v) => (v <= 0 ? NaN : a / v + B * v * v);
    let cm = 3 * B * vs * vs;
    canvas.setViewport(0, vs * 2.0, 0, cm * 2.3);
    canvas.addFunction({ evaluator: safe(cf), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => (v <= 0 ? NaN : a / v)), color: canvas.blue(), thickness: 1.5, dashed: true });
    canvas.addFunction({ evaluator: safe((v) => B * v * v), color: canvas.red(), thickness: 1.5, dashed: true });
    canvas.addGuideLine({ axis: 'vertical', position: vs, color: canvas.gray() });
    canvas.addMarker({ x: vs, y: cm, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `(${N2(vs)} m/${tx("dk", "min")}, ${G(cm)} TL)` });
    break; }
    case 12: {
    let cc = x[0], pp = x[1], r = x[2] / 100;
    let L = Math.pow(cc / pp, 3), Lp = -3 * L / pp, L1 = L * Math.pow(1 + r, -3);
    let lf = (v) => (v <= 0 ? NaN : Math.pow(cc / v, 3));
    canvas.setViewport(pp * 0.4, pp * 1.7, -L * 0.3, lf(pp * 0.6) * 1.05);
    canvas.addFunction({ evaluator: safe(lf), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => L + Lp * (v - pp)), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: pp, y: L, color: canvas.blue(), radius: 6.0, label: `L₁₀ = ${G(L)}` });
    canvas.addMarker({ x: pp * (1 + r), y: L1, color: canvas.gold(), radius: 7.0, label: `L₁ = ${G(L1)}` });
    break; }
    case 13: {
    let k = x[0], cc = x[1], d = x[2];
    let ff = (v) => k * v + cc * v * v * v, Fd = ff(d), kt = k + 3 * cc * d * d;
    canvas.setViewport(-d * 0.1, d * 1.5, -ff(d * 1.5) * 0.08, ff(d * 1.5) * 1.05);
    canvas.addFilledArea({ evaluator: safe(ff), xMin: 0, xMax: d });
    canvas.addFunction({ evaluator: safe(ff), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => k * v), color: canvas.gray(), thickness: 1.5, dashed: true });
    canvas.addFunction({ evaluator: safe((v) => Fd + kt * (v - d)), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'vertical', position: d, color: canvas.gray() });
    canvas.addMarker({ x: d, y: Fd, color: canvas.gold(), radius: 7.0, label: `F = ${G(Fd)} N, dF/dx = ${G(kt)}` });
    break; }
    case 14: {
    let tp = x[0], tm = tp / Math.PI, th1 = Math.asin(1 / Math.PI);
    let tf = (v) => (v < 0 || v > 2 * Math.PI ? NaN : (v <= Math.PI ? tp * Math.sin(v) : 0));
    canvas.setViewport(-0.5, 2 * Math.PI + 0.5, -tp * 0.18, tp * 1.25);
    canvas.addFilledArea({ evaluator: safe(tf), xMin: 0, xMax: Math.PI });
    canvas.addFunction({ evaluator: safe(tf), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'horizontal', position: tm, color: canvas.gray(), label: `T_ort = ${G(tm)}` });
    canvas.addMarker({ x: th1, y: tm, color: canvas.blue(), radius: 5.0, label: 'θ₁' });
    canvas.addMarker({ x: Math.PI - th1, y: tm, color: canvas.blue(), radius: 5.0, label: 'θ₂' });
    canvas.addMarker({ x: Math.PI / 2, y: tp, color: canvas.gold(), radius: 7.0, label: `T_p = ${N2(tp)} N·m` });
    break; }
    case 15: {
    let ds = x[0], a0 = x[1] / 1000, ac = x[2] / 1000;
    let kp = 1e-11 * Math.pow(ds, 4) * Math.PI * Math.PI, Nf = (1 / kp) * (1 / a0 - 1 / ac);
    let af = (v) => { const dn = 1 / a0 - kp * v * 1000; return dn <= 1 / (ac * 1.6) ? NaN : 1000 / dn; };
    canvas.setViewport(-Nf / 1000 * 0.08, Nf / 1000 * 1.2, -ac * 1000 * 0.1, ac * 1000 * 1.4);
    canvas.addFunction({ evaluator: safe(af), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'horizontal', position: ac * 1000, color: canvas.gray(), label: `a_c = ${N2(x[2])} mm` });
    canvas.addMarker({ x: 0, y: a0 * 1000, color: canvas.blue(), radius: 6.0, label: `a₀ = ${N2(x[1])} mm` });
    canvas.addMarker({ x: Nf / 1000, y: ac * 1000, color: canvas.gold(), radius: 7.0, label: `N_f = ${G(Nf / 1000)}×10³` });
    break; }
    default: {
    let v0 = x[0], t0 = x[1], n = x[2], pc = x[3] / 100.0;
    let slope = -t0 / (n * v0), v1 = v0 * (1 + pc), t1 = t0 * Math.pow(1 + pc, -1 / n);
    let tf = (v) => (v <= 0 ? NaN : t0 * Math.pow(v0 / v, 1 / n));
    canvas.setViewport(v0 * 0.8, v0 * 1.4, 0, tf(v0 * 0.8) * 1.1);
    canvas.addFunction({ evaluator: safe(tf), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => t0 + slope * (v - v0)), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: v0, y: t0, color: canvas.blue(), radius: 6.0, label: `T₀ = ${N2(t0)}` });
    canvas.addMarker({ x: v1, y: t1, color: canvas.gold(), radius: 7.0, label: `T₁ = ${N2(t1)}` });
    break; }
    }
  }


  // ================= schematic (engineering sketch beside the graph) =================
  const T = (a, b) => I18N.tx(a, b);
  const mp = (v, lo, hi, a, b) => { const t = hi > lo ? (v - lo) / (hi - lo) : 0; return a + (b - a) * Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0)); };
  const tint = (col, a) => { const r = rgba(col, a); return typeof r === 'string' ? r : 'rgba(128,140,170,' + a + ')'; };
  const DS = (sc) => ({ color: sc.c.sub, dash: [1.5, 1.2], w: 0.35 });
  const ptAt = (cx, cy, r, ang) => [cx + r * Math.cos(ang * Math.PI / 180), cy + r * Math.sin(ang * Math.PI / 180)];
  // rotation arc with an arrow head (cw: head at the start angle a0, else at a1)
  function rotArrow(sc, cx, cy, r, a0, a1, cw, col) {
    sc.arc(cx, cy, r, a0, a1, { color: col, w: 0.8 });
    const tip = ptAt(cx, cy, r, cw ? a0 : a1), tail = ptAt(cx, cy, r, cw ? a0 + 6 : a1 - 6);
    sc.arrow(tail[0], tail[1], tip[0], tip[1], { color: col, w: 0.8, head: 2.2 });
  }
  // small axes box with curve helper (box = x,y,w,h in schematic units; xr/yr = data ranges)
  function MiniPlot(sc, bx, by, bw, bh, xr, yr) {
    const X = (v) => bx + bw * (v - xr[0]) / (xr[1] - xr[0]);
    const Y = (v) => by + bh * Math.max(-0.02, Math.min(1.08, (v - yr[0]) / (yr[1] - yr[0])));
    sc.line(bx, by, bx + bw, by, { w: 0.5 });
    sc.line(bx, by, bx, by + bh, { w: 0.5 });
    const curve = (fn, o) => {
      o = o || {};
      const n = o.n || 60, a = o.x0 === undefined ? xr[0] : o.x0, b = o.x1 === undefined ? xr[1] : o.x1;
      let run = [];
      const flush = () => { if (run.length > 1) sc.poly(run, { close: false, color: o.color, w: o.w || 0.9, dash: o.dash }); run = []; };
      for (let i = 0; i <= n; i++) {
        const v = a + (b - a) * i / n; let y;
        try { y = fn(v); } catch (e) { y = NaN; }
        if (Number.isFinite(y)) run.push([X(v), Y(y)]); else flush();
      }
      flush();
    };
    return { X, Y, curve };
  }
  const SCH = [];

  SCH[0] = (sc, x) => {
    const c = sc.c, a = x[0] / 1000, p0 = x[1], b = 2 * a * p0, dm = a * p0 * p0;
    sc.title(T('Lazer toz yatağı: eriyik havuzu', 'Laser powder bed: melt pool'));
    sc.rect(8, 14, 84, 34);
    const ry = mp(dm, 10, 400, 5, 26), rx = mp(p0, 100, 300, 9, 20);
    sc.poly(ell(50, 48, rx, ry, 180, 360, 28), { fill: tint(c.heat, 0.45), color: c.heat });
    sc.mass(42, 70, 16, 9, '');
    sc.arrow(50, 70, 50, 49.5, { color: c.heat });
    sc.text(40, 74.5, 'P₀ = ' + G(p0) + ' W', { align: 'right', size: 3.2 });
    sc.dim(50 + rx + 4, 48, 50 + rx + 4, 48 - ry, '');
    sc.text(50 + rx + 6.5, 48 - ry / 2, 'd = ' + G(dm) + ' µm', { align: 'left', size: 3 });
    sc.text(50, 8, 'd(P) = −' + G(a) + 'P² + ' + G(b) + 'P', { size: 3.2 });
  };

  SCH[1] = (sc, x) => {
    const c = sc.c, pw = x[0], h = x[1] / 1000, t = x[2] / 1000, em = x[3], vmax = pw / (em * h * t);
    sc.title(T('Lazer toz yatağı: enerji yoğunluğu', 'Laser powder bed: energy density'));
    const hw = mp(x[1], 80, 120, 13, 19), t0 = mp(x[2], 30, 50, 3.5, 6.5);
    sc.rect(8, 16, 84, 16);
    sc.rect(8, 32, 84, t0, { fill: tint(c.steel, 0.3) });
    [-1, 0, 1].forEach((i) => sc.poly(ell(50 + i * hw, 32 + t0, hw * 0.5, t0 * 1.1, 0, 180, 16), { fill: tint(c.heat, 0.5), color: c.heat }));
    sc.mass(42, 70, 16, 9, '');
    sc.arrow(50, 70, 50, 47, { color: c.heat });
    sc.text(40, 74.5, 'P = ' + G(pw) + ' W', { align: 'right', size: 3.2 });
    sc.arrow(62, 74.5, 84, 74.5, { color: c.good });
    sc.text(73, 81, 'v ≤ ' + G(vmax) + ' mm/s', { size: 3 });
    sc.dim(90, 32, 90, 32 + t0, '');
    sc.callout(90, 32 + t0 / 2, 90, 49, 't = ' + G(x[2]) + ' µm', { align: 'right' });
    sc.line(50 - hw, 12, 50 - hw, 16, DS(sc)); sc.line(50, 12, 50, 16, DS(sc));
    sc.dim(50 - hw, 12, 50, 12, 'h = ' + G(x[1]) + ' µm', { ty: -3.4 });
    sc.text(24, 58, 'E ≥ ' + N2(em) + ' J/mm³', { size: 3.1 });
  };

  SCH[2] = (sc, x) => {
    const c = sc.c, k = x[1], v1 = x[2] * x[2], V = k * Math.pow(v1, 1.5), sl = 1.5 * k * x[2];
    sc.title(T('Tel ark eklemeli imalat', 'Wire-arc additive manufacturing'));
    sc.rect(8, 14, 84, 12);
    const hb = mp(V, 0, 1100, 2.5, 15);
    sc.poly(ell(50, 26, 17, hb, 0, 180, 24), { fill: tint(c.heat, 0.4), color: c.heat });
    sc.poly([[43, 80], [57, 80], [57, 66], [53, 56], [47, 56], [43, 66]]);
    sc.line(50, 56, 50, 26 + hb + 0.6, { color: c.steel, w: 1 });
    sc.circle(50, 26 + hb + 1, 1.8, { fill: tint(c.heat, 0.8), color: c.heat, w: 0.4 });
    sc.arrow(36, 76, 36, 60, { color: c.good });
    sc.text(33, 68, 'v₁ = ' + G(v1) + ' mm/s', { align: 'right', size: 3.1 });
    sc.text(62, 70, 'k = ' + G(k), { align: 'left', size: 3.1 });
    sc.text(62, 62, 'V = ' + G(V) + ' mm³', { align: 'left', size: 3.1 });
    sc.text(62, 54, 'V′ = ' + G(sl), { align: 'left', size: 3.1 });
    sc.text(50, 8, T('V′ birimi: mm³ / (mm/s);  V = k·v^(3/2)', 'V′ unit: mm³ / (mm/s);  V = k·v^(3/2)'), { size: 3 });
  };

  SCH[3] = (sc, x) => {
    const c = sc.c, l0 = x[0], al = x[1] * 1e-6, dt = x[2], eps = al * dt;
    const lx = mp(l0, 100, 500, 36, 54), ext = lx * eps * 8;
    const dl = al * l0 * dt, ex = l0 * (Math.exp(eps) - 1), er = ex - dl;
    sc.title(T('Isıl genleşme', 'Thermal expansion'));
    sc.fixedSupport(10, 50, 'L', 50);
    sc.rect(10, 58, lx, 8, { fill: tint(c.cold, 0.25) });
    sc.text(10 + lx / 2, 71, 'L₀ = ' + G(l0) + ' mm', { size: 3.2 });
    sc.rect(10, 34, lx + ext, 8, { fill: tint(c.heat, 0.4) });
    sc.line(10 + lx, 30, 10 + lx, 68, DS(sc));
    sc.text(10 + lx / 2, 38, 'ΔT = ' + G(dt) + ' K', { size: 3 });
    sc.dim(10 + lx, 30, 10 + lx + ext, 30, 'ΔL (×8)', { ty: -3.4 });
    sc.text(50, 21, 'ΔL ≈ α·L₀·ΔT = ' + G4(dl) + ' mm', { size: 3.1 });
    sc.text(50, 14, 'ΔL (e^(αΔT)) = ' + G4(ex) + ' mm', { size: 3.1 });
    sc.text(50, 7.5, T('hata = ', 'error = ') + G4(er) + ' mm', { size: 3.1 });
  };

  SCH[4] = (sc, x) => {
    const c = sc.c, tm = x[0], k = x[1], t = x[2], tv = tm * Math.exp(-k * t), rate = -k * tv, fr = cl(tv / tm, 0, 1);
    sc.title(T('Katılaşma: soğuma hızı', 'Solidification: cooling rate'));
    sc.rect(6, 22, 54, 34);
    const rx = 5 + 17 * fr, ry = 3 + 13 * fr;
    sc.poly(ell(33, 56, rx, ry, 180, 360, 28), { fill: tint(c.heat, 0.2 + 0.5 * fr), color: c.heat });
    [-0.7, 0, 0.7].forEach((f) => { const yy = 56 - ry * Math.sqrt(1 - f * f) - 1; sc.arrow(33 + f * rx, yy, 33 + f * rx, yy - 7, { color: c.cold, w: 0.6, head: 2 }); });
    sc.gauge(70, 22, 8, 48, fr, c.heat, 'T = ' + G(tv) + ' °C');
    sc.text(74, 76, 'T_m = ' + G(tm) + ' °C', { size: 3 });
    sc.arrow(88, 62, 88, 40, { color: c.cold });
    sc.text(92, 51, 'dT/dt', { rot: 90, size: 3 });
    sc.text(33, 10, 't = ' + G(t) + ' s:  dT/dt = ' + G(rate) + ' °C/s', { size: 3.2 });
  };

  SCH[5] = (sc, x) => {
    const c = sc.c, a = x[0], b = x[1], r = x[2] / 100, m = x[3];
    const f = Math.pow(1 - r, -1 / b), m1 = m + Math.log10(f), la = Math.log10(a);
    const S0 = a * Math.pow(10, -b * m), S1 = S0 * (1 - r);
    sc.title(T('Yorulma: S–N eğrisi', 'Fatigue: S–N curve'));
    sc.rect(6, 62, 12, 14); sc.rect(82, 62, 12, 14);
    sc.poly([[18, 64], [30, 66], [70, 66], [82, 64], [82, 74], [70, 72], [30, 72], [18, 74]]);
    const sn = [];
    for (let i = 0; i <= 40; i++) sn.push([34 + 32 * i / 40, 83 + 3 * Math.sin(i / 40 * 4 * Math.PI)]);
    sc.poly(sn, { close: false, color: c.load, w: 0.8 });
    sc.text(72, 83, 'σ_a', { align: 'left', size: 3.2 });
    sc.text(50, 56, 'S₀ = ' + G(S0) + ' MPa  →  S₁ = ' + G(S1) + ' MPa (−' + G(x[2]) + ' %)', { size: 3.1 });
    sc.text(50, 48.5, 'N₁ = N₀ × ' + G(f) + '  (10^' + G(m) + ' → 10^' + G(m1) + ')', { size: 3.1 });
    const bx = 16, by = 14, bw = 70, bh = 28, lo = la - b * 8.5, hi = la - b * 3;
    const X = (mm) => bx + bw * (mm - 3) / 5.5, Y = (ls) => by + bh * (ls - lo) / (hi - lo);
    sc.line(bx, by, bx + bw, by, { w: 0.5 }); sc.line(bx, by, bx, by + bh, { w: 0.5 });
    sc.line(X(3), Y(hi), X(8.5), Y(lo), { color: c.accent, w: 1 });
    [[m, c.steel], [m1, c.gold]].forEach((q) => {
      const px = X(q[0]), py = Y(la - b * q[0]);
      sc.line(px, py, px, by, DS(sc));
      sc.circle(px, py, 1.5, { fill: q[1], w: 0.4 });
    });
    sc.text(51, 8.5, 'log N', { size: 3 });
    sc.text(10.5, 28, 'log S', { rot: 90, size: 3 });
  };

  SCH[6] = (sc, x) => {
    const c = sc.c, ts = x[0], b = x[1], cm = 2 * b * ts, hs = mp(ts, 20, 80, 2.6, 8), R = 24, cx = 30;
    sc.title(T('Eklemeli imalat: katman kalınlığı', 'Additive manufacturing: layer thickness'));
    sc.rect(4, 16, 52, 6);
    for (let y = 22; y < 22 + R; y += hs) {
      const yc = y - 22 + hs / 2;
      if (yc >= R) break;
      const w = Math.sqrt(R * R - yc * yc);
      sc.rect(cx - w, y, 2 * w, hs, { fill: tint(c.steel, 0.35), w: 0.4 });
    }
    sc.arc(cx, 22, R, 0, 180, { dash: [1.5, 1.2], color: c.accent, w: 0.5 });
    sc.text(cx, 10, 't* = ' + G(ts) + ' µm', { size: 3.2 });
    sc.gauge(60, 28, 7, 38, 0.5, c.load, 'a/t');
    sc.gauge(72, 28, 7, 38, 0.5, c.heat, 'b·t');
    sc.gauge(84, 28, 7, 38, 1, c.accent, 'C');
    sc.text(63.5, 70, G(b * ts), { size: 3 }); sc.text(75.5, 70, G(b * ts), { size: 3 }); sc.text(87.5, 70, G(cm), { size: 3 });
    sc.text(75, 77, 'TL', { size: 3 });
  };

  SCH[7] = (sc, x) => {
    const c = sc.c, v0 = x[0], t0 = x[1], n = x[2], pc = x[3] / 100, t1 = t0 * Math.pow(1 + pc, -1 / n);
    sc.title(T('Talaşlı imalat: Taylor takım ömrü', 'Machining: Taylor tool life'));
    sc.circle(30, 58, 19, { fill: c.fill, w: 0.8 });
    sc.circle(30, 58, 2.5);
    rotArrow(sc, 30, 58, 12, 20, 160, true, c.good);
    sc.poly([[30, 77], [33, 86], [47, 86], [47, 82], [38, 77]], { fill: c.steel });
    sc.arrow(53, 66, 53, 50, { color: c.good });
    sc.text(57, 60, 'V₀ = ' + G(v0) + T(' m/dk', ' m/min'), { align: 'left', size: 3 });
    sc.text(57, 54, 'V₁ = ' + G(v0 * (1 + pc)) + T(' m/dk', ' m/min'), { align: 'left', size: 3 });
    sc.rect(8, 22, 76, 3.5, { fill: tint(c.good, 0.6) });
    sc.rect(8, 10, 76 * t1 / t0, 3.5, { fill: tint(c.bad, 0.6) });
    sc.text(8, 29, 'T₀ = ' + G(t0) + T(' dk', ' min'), { align: 'left', size: 3.1 });
    sc.text(8, 17.5, 'T₁ = ' + G(t1) + T(' dk', ' min') + ' (' + G(100 * (t1 / t0 - 1)) + ' %)', { align: 'left', size: 3.1 });
  };

  SCH[8] = (sc, x) => {
    const c = sc.c, su = x[0], xu = x[1], x1 = x[2], eu = xu / 100, e1 = x1 / 100, E = 2 * su / eu, cc = su / (eu * eu);
    const sg1 = E * e1 - cc * e1 * e1, tg1 = E - 2 * cc * e1, U1 = E * e1 * e1 / 2 - cc * e1 * e1 * e1 / 3, Uu = 2 * su * eu / 3;
    const ext = 44 * e1 * 2.4, hh = 8 * (1 - e1 * 1.2);
    sc.title(T('Çekme deneyi: gerilme–şekil değiştirme', 'Tensile test: stress–strain'));
    sc.fixedSupport(8, 64, 'L', 22);
    sc.rect(8, 56, 14, 16);
    sc.poly([[22, 60], [66, 60], [66, 68], [22, 68]], DS(sc));
    sc.rect(22, 64 - hh / 2, 44 + ext, hh, { fill: tint(c.steel, 0.4) });
    sc.rect(66 + ext, 56, 14, 16);
    sc.arrow(80.5 + ext, 64, 94.5, 64, { color: c.load });
    sc.dim(22, 52, 66, 52, 'L₀');
    sc.text(50, 44, 'ε₁ = ' + G(x1) + ' %,  σ(ε₁) = ' + G(sg1) + ' MPa', { size: 3.1 });
    sc.text(50, 37, 'E = ' + G(E) + ' MPa,  E_t(ε₁) = ' + G(tg1) + ' MPa', { size: 3.1 });
    sc.text(50, 30, 'U(ε₁) = ' + G4(U1) + ' MJ/m³', { size: 3.1 });
    sc.text(50, 23, 'U(ε_u) = ' + G4(Uu) + ' MJ/m³  (σ_u = ' + G(su) + ' MPa)', { size: 3.1 });
  };

  SCH[9] = (sc, x) => {
    const c = sc.c, Y = x[0], tau = x[1], t1 = x[2], y1 = Y * (1 - Math.exp(-t1 / tau)), t95 = tau * Math.log(20);
    sc.title(T('Birinci mertebe sistem (sensör)', 'First-order system (sensor)'));
    sc.poly([[6, 62], [14, 62], [14, 74], [26, 74]], { close: false, color: c.load, w: 0.9 });
    sc.text(16, 80, 'Y = ' + G(Y) + ' °C', { size: 3 });
    sc.arrow(28, 68, 34, 68, { color: c.ink, w: 0.6, head: 2 });
    sc.rect(34, 58, 30, 20, { w: 0.8 });
    sc.text(49, 70, '1/(τs+1)', { size: 3.6, bold: true });
    sc.text(49, 63, 'τ = ' + G(tau) + ' s', { size: 3.1 });
    sc.arrow(64, 68, 70, 68, { color: c.ink, w: 0.6, head: 2 });
    const pts = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([70 + 24 * u, 62 + 12 * (1 - Math.exp(-3 * u))]); }
    sc.poly(pts, { close: false, color: c.accent, w: 0.9 });
    const xm = Math.max(5 * tau, 1.2 * t1), P = MiniPlot(sc, 14, 24, 72, 26, [0, xm], [0, Y * 1.15]);
    P.curve((t) => Y * (1 - Math.exp(-t / tau)), { color: c.accent, w: 1 });
    sc.line(14, P.Y(Y), 86, P.Y(Y), DS(sc));
    P.curve((t) => (Y / tau) * t, { color: c.good, dash: [1.5, 1.2], w: 0.6, x1: tau * 1.1 });
    sc.line(P.X(t95), 24, P.X(t95), P.Y(0.95 * Y), DS(sc));
    sc.circle(P.X(t1), P.Y(y1), 1.4, { fill: c.gold, w: 0.4 });
    sc.text(P.X(tau), 20, 'τ', { size: 3 }); sc.text(P.X(t95), 20, 't₉₅', { size: 3 });
    sc.text(10, P.Y(Y), 'Y', { size: 3 });
    sc.text(50, 13, 'y′(0) = ' + G(Y / tau) + ' °C/s,  t₉₅ = ' + G(t95) + ' s', { size: 3.1 });
    sc.text(50, 7, 'y(' + G(t1) + ' s) = ' + G(y1) + ' °C,  y(∞) = ' + G(Y) + ' °C', { size: 3.1 });
  };

  SCH[10] = (sc, x) => {
    const c = sc.c, z = x[0], wn = x[1], A = x[2];
    const q = Math.sqrt(1 - z * z), sg = z * wn, wd = wn * q, tp = Math.PI / wd, mpk = Math.exp(-Math.PI * z / q), ts = 4 / sg;
    const yf = (v) => A * (1 - Math.exp(-sg * v) * (Math.cos(wd * v) + sg / wd * Math.sin(wd * v)));
    sc.title(T('Kütle–yay–sönümleyici (2. mertebe)', 'Mass–spring–damper (2nd order)'));
    sc.fixedSupport(10, 64, 'L', 28);
    sc.spring(10, 71, 30, 71, 5, 2);
    sc.damper(10, 57, 30, 57);
    sc.mass(30, 52, 16, 24, 'm');
    sc.arrow(46, 64, 58, 64, { color: c.load });
    sc.text(52, 69, 'F', { size: 3 });
    sc.text(62, 75, 'ζ = ' + G(z), { align: 'left', size: 3.1 });
    sc.text(62, 69, 'ω_n = ' + G(wn) + ' rad/s', { align: 'left', size: 3.1 });
    sc.text(62, 63, 'ω_d = ' + G(wd) + ' rad/s', { align: 'left', size: 3.1 });
    sc.text(62, 57, 'A = ' + G(A) + ' mm', { align: 'left', size: 3.1 });
    const xm = Math.max(3.2 * tp, 1.3 * ts), P = MiniPlot(sc, 14, 22, 72, 22, [0, xm], [0, A * (1 + mpk) * 1.2]);
    P.curve(yf, { color: c.accent, w: 1, n: 90 });
    sc.line(14, P.Y(A), 86, P.Y(A), DS(sc));
    sc.line(P.X(tp), 22, P.X(tp), P.Y(A * (1 + mpk)), DS(sc));
    sc.circle(P.X(tp), P.Y(A * (1 + mpk)), 1.5, { fill: c.gold, w: 0.4 });
    sc.text(P.X(tp), 18, 't_p', { size: 3 });
    sc.text(50, 9, 't_p = ' + G4(tp) + ' s,  M_p = ' + G(100 * mpk) + ' %,  y_p = ' + G(A * (1 + mpk)) + ' mm', { size: 3.1 });
  };

  SCH[11] = (sc, x) => {
    const c = sc.c, vs = x[0], b = x[1], B = b / 10000, a = 2 * b * vs * vs * vs / 10000, cm = 3 * B * vs * vs;
    sc.title(T('Frezeleme: maliyet – kesme hızı', 'Milling: cost vs cutting speed'));
    sc.rect(6, 34, 56, 14);
    sc.gear(32, 61, 13, 10, 0);
    rotArrow(sc, 32, 61, 17, 30, 150, true, c.good);
    sc.arrow(10, 29, 30, 29, { color: c.load });
    sc.text(34, 29, T('ilerleme', 'feed'), { align: 'left', size: 3 });
    sc.text(32, 21, 'V* = ' + G(vs) + T(' m/dk', ' m/min'), { size: 3.2 });
    sc.text(32, 14, 'C_min = ' + G(cm) + ' TL', { size: 3.2 });
    sc.gauge(67, 28, 6, 38, 2 / 3, c.fluid, 'A/V');
    sc.gauge(77, 28, 6, 38, 1 / 3, c.load, 'BV²');
    sc.gauge(87, 28, 6, 38, 1, c.accent, 'C');
    sc.text(70, 70, G(a / vs), { size: 3 }); sc.text(80, 70, G(B * vs * vs), { size: 3 }); sc.text(90, 70, G(cm), { size: 3 });
    sc.text(80, 77, 'TL', { size: 3 });
  };

  SCH[12] = (sc, x) => {
    const c = sc.c, cc = x[0], pp = x[1], r = x[2] / 100, L = Math.pow(cc / pp, 3), Lp = -3 * L / pp, L1 = L * Math.pow(1 + r, -3), lin = Lp * pp * r;
    sc.title(T('Rulman ömrü L₁₀ = (C/P)³', 'Bearing life L₁₀ = (C/P)³'));
    sc.circle(30, 56, 22, { fill: c.fill, w: 0.8 });
    sc.circle(30, 56, 17.5, { fill: c.bg, w: 0.5 });
    sc.circle(30, 56, 14, { fill: c.fill, w: 0.5 });
    for (let i = 0; i < 8; i++) { const p = ptAt(30, 56, 15.75, i * 45); sc.circle(p[0], p[1], 1.75, { fill: c.steel, w: 0.4 }); }
    sc.circle(30, 56, 8, { fill: c.steel, w: 0.6 });
    sc.arrow(30, 89, 30, 78, { color: c.load, w: 1.2 });
    sc.text(34, 86, 'P = ' + G(pp) + ' kN', { align: 'left', size: 3.1 });
    sc.text(34, 81, '(+' + G(x[2]) + ' %)', { align: 'left', size: 3 });
    sc.text(30, 27, 'C = ' + G(cc) + ' kN', { size: 3.1 });
    sc.gauge(62, 36, 9, 38, 1, c.fluid, 'L₁₀');
    sc.gauge(80, 36, 9, 38, cl(L1 / L, 0, 1), c.heat, 'L₁');
    sc.text(50, 20, 'L₁₀ = ' + G(L) + '  →  L₁ = ' + G(L1) + T(' milyon dev', ' M rev'), { size: 3.1 });
    sc.text(50, 13, 'dL/dP = ' + G(Lp) + ',  ' + T('doğrusal ΔL = ', 'linear ΔL = ') + G(lin), { size: 3.1 });
  };

  SCH[13] = (sc, x) => {
    const c = sc.c, k = x[0], cc = x[1], d = x[2];
    const ff = (v) => k * v + cc * v * v * v, Fd = ff(d), kt = k + 3 * cc * d * d, W = k * d * d / 2 + cc * d * d * d * d / 4;
    sc.title(T('Cıvata/conta bağlantısı: ∫F dx', 'Bolt/gasket joint: ∫F dx'));
    const s = mp(d, 2, 5, 5, 13), ytop = 50 - s;
    sc.ground(10, 38, 16);
    sc.spring(24, 16, 24, ytop, 6, 3);
    sc.mass(10, ytop, 28, 5, '');
    sc.line(10, 55, 38, 55, DS(sc));
    sc.dim(41, 55 - s, 41, 55, '');
    sc.text(43, 55 - s / 2, 'δ = ' + G(d) + ' mm', { align: 'left', size: 3 });
    sc.arrow(24, ytop + 16, 24, ytop + 5.5, { color: c.load });
    sc.text(24, ytop + 20, 'F = ' + G(Fd) + ' N', { size: 3.1 });
    const P = MiniPlot(sc, 66, 28, 28, 32, [0, 1.4 * d], [0, ff(1.4 * d)]);
    const area = [[P.X(0), 28]];
    for (let i = 0; i <= 24; i++) { const v = d * i / 24; area.push([P.X(v), P.Y(ff(v))]); }
    area.push([P.X(d), 28]);
    sc.poly(area, { fill: tint(c.accent, 0.3), stroke: false });
    P.curve(ff, { color: c.accent, w: 1 });
    P.curve((v) => Fd + kt * (v - d), { color: c.good, dash: [1.5, 1.2], w: 0.6, x0: d * 0.6 });
    sc.line(P.X(d), 28, P.X(d), P.Y(Fd), DS(sc));
    sc.circle(P.X(d), P.Y(Fd), 1.4, { fill: c.gold, w: 0.4 });
    sc.text(P.X(d * 0.5), 32, 'W', { size: 3 });
    sc.text(50, 8, 'F = ' + G(Fd) + ' N · dF/dx = ' + G(kt) + ' N/mm · W = ' + G(W / 1000) + ' J', { size: 3.1 });
  };

  SCH[14] = (sc, x) => {
    const c = sc.c, tp = x[0], n = x[1], w = n * Math.PI / 30, Wc = 2 * tp, tm = tp / Math.PI, pw = tp * n / 30;
    const th1 = Math.asin(1 / Math.PI), c1 = Math.cos(th1), dE = tp * (2 * c1 - (Math.PI - 2 * th1) / Math.PI), I = dE / (0.05 * w * w);
    sc.title(T('Mil torku çevrimi ve volan', 'Shaft torque cycle and flywheel'));
    sc.circle(22, 72, 13, { fill: c.fill, w: 0.8 });
    sc.circle(22, 72, 3, { fill: c.steel, w: 0.5 });
    for (let i = 0; i < 4; i++) { const p = ptAt(22, 72, 13, 45 + i * 90), q = ptAt(22, 72, 13, 225 + i * 90); sc.line(p[0], p[1], q[0], q[1], { w: 0.4, color: c.sub }); }
    rotArrow(sc, 22, 72, 16, 30, 150, true, c.good);
    sc.text(44, 82, 'n = ' + G(n) + T(' dev/dk', ' rpm'), { align: 'left', size: 3.1 });
    sc.text(44, 75, 'T_p = ' + G(tp) + ' N·m', { align: 'left', size: 3.1 });
    sc.text(44, 68, 'ΔE = ' + G(dE) + ' J', { align: 'left', size: 3.1 });
    sc.text(44, 61, 'I = ' + G(I) + ' kg·m²', { align: 'left', size: 3.1 });
    const P = MiniPlot(sc, 14, 24, 72, 26, [0, 2 * Math.PI], [0, tp * 1.15]);
    const tf = (v) => (v <= Math.PI ? tp * Math.sin(v) : 0);
    const sur = [[P.X(th1), P.Y(tm)]];
    for (let i = 0; i <= 24; i++) { const v = th1 + (Math.PI - 2 * th1) * i / 24; sur.push([P.X(v), P.Y(tf(v))]); }
    sur.push([P.X(Math.PI - th1), P.Y(tm)]);
    sc.poly(sur, { fill: tint(c.good, 0.45), stroke: false });
    P.curve(tf, { color: c.accent, w: 1, n: 90 });
    sc.line(14, P.Y(tm), 86, P.Y(tm), DS(sc));
    sc.text(86, P.Y(tm) + 3, 'T_ort', { align: 'right', size: 2.8 });
    sc.text(P.X(Math.PI / 2), P.Y(tm + (tp - tm) * 0.5), 'ΔE', { size: 3 });
    sc.text(14, 20, '0', { size: 3 }); sc.text(P.X(Math.PI), 20, 'π', { size: 3 }); sc.text(86, 20, '2π', { size: 3 });
    sc.text(50, 11, 'W = ' + G(Wc) + ' J · T_ort = ' + G(tm) + ' N·m · P = ' + G(pw / 1000) + ' kW', { size: 3.1 });
  };

  SCH[15] = (sc, x) => {
    const c = sc.c, ds = x[0], a0 = x[1] / 1000, ac = x[2] / 1000;
    const kp = 1e-11 * Math.pow(ds, 4) * Math.PI * Math.PI, Nf = (1 / kp) * (1 / a0 - 1 / ac), f2 = (1 / (2 * a0)) / (1 / a0 - 1 / ac);
    sc.title(T('Yorulma çatlak büyümesi (Paris)', 'Fatigue crack growth (Paris)'));
    sc.rect(12, 38, 50, 34);
    const sk = 0.6, h0 = Math.max(x[1] * sk, 0.9);
    sc.line(37 - x[2] * sk, 55, 37 + x[2] * sk, 55, { color: c.heat, dash: [1.5, 1.2], w: 0.5 });
    sc.poly(ell(37, 55, h0, 0.9, 0, 360, 16), { fill: c.ink });
    [20, 32, 44, 56].forEach((px) => { sc.arrow(px, 84, px, 73, { color: c.load }); sc.arrow(px, 29, px, 37, { color: c.load }); });
    sc.text(37, 89, 'Δσ = ' + G(ds) + ' MPa', { size: 3.1 });
    sc.text(65, 66, 'a₀ = ' + G(x[1]) + ' mm', { align: 'left', size: 3.1 });
    sc.text(65, 58, 'a_c = ' + G(x[2]) + ' mm', { align: 'left', size: 3.1 });
    sc.text(65, 50, 'm = 4', { align: 'left', size: 3.1 });
    sc.text(65, 42, 'K′ = ' + Sci(kp), { align: 'left', size: 3 });
    sc.text(50, 22, 'N_f = ' + Sci(Nf) + T(' çevrim', ' cycles'), { size: 3.2 });
    sc.rect(12, 13, 76, 4, { fill: 'rgba(0,0,0,0)', w: 0.5 });
    sc.rect(12, 13, 76 * f2, 4, { fill: tint(c.heat, 0.6), stroke: false });
    sc.text(50, 8, T('a₀ → 2a₀: ömrün %', 'a₀ → 2a₀: % of life = ') + G(100 * f2), { size: 3 });
  };

  function drawSchematic(sc, problem) {
    try { const f = SCH[problem.scn]; if (f) f(sc, problem.p); } catch (e) { /* never throw */ }
  }

  function Meaning(p) { return MeaningBase(p) + '\n\n' + MeaningExtra(p.scn); }

  function Overview() {
    return tx("MÜHENDİSLİK UYGULAMASI: MALZEME, İMALAT, MAKİNE ELEMANLARI VE KONTROL\nEklemeli imalat, malzeme bilimi, talaşlı imalat, makine elemanları ve kontrol sistemlerinde süreç parametreleri (güç, hız, katman, sıcaklık) çoğu zaman bir fonksiyondur: optimum için türev, duyarlılık için türev, tahmin için teğet kullanılır.\n\nTANIM VE FORMÜLLER\n• Optimum (tepe/çukur): f′ = 0, f″ ile tür belirlenir; parabolde tepe P₀ = −b/(2a).\n• Rasyonel ilişki: enerji yoğunluğu E = P/(v·h·t) [J/mm³]; v büyüdükçe E azalır.\n• Kuvvet yasası: V = k·v^(3/2); duyarlılık V′ = (3/2)·k·√v; bağıl değişim = üs × bağıl hız değişimi.\n• Doğrusal yaklaşım: f(x) ≈ f(x₀) + f′(x₀)(x − x₀); hata ≈ ½f″(x₀)(Δx)².\n• Üstel soğuma: T(t) = T_m·e^(−kt) → dT/dt = −k·T (zincir kuralı).\n• Basquin (S–N) yasası: S = a·N^(−b); dS/S = −b·dN/N.\n• Maliyet optimizasyonu: C(t) = a/t + b·t → C′ = 0 → t* = √(a/b).\n• Taylor takım ömrü: V·Tⁿ = C; kapalı türev: dT/dV = −T/(n·V).\n• Gerilme–şekil değiştirme: modül E = σ′(0) (eğim), tokluk U = ∫σ dε (eğri altındaki alan, MPa = MJ/m³).\n• Birinci mertebe sistem: y = Y(1 − e^(−t/τ)); y′(0) = Y/τ, t₉₅ = τ·ln 20, hata alanı ∫₀^∞(Y − y)dt = Y·τ.\n• İkinci mertebe sistem: y′ = 0 → sin ω_d t = 0 → t_p = π/ω_d, aşım M_p = e^(−πζ/√(1−ζ²)).\n• İşleme maliyeti: C(V) = A/V + B·V² → C′ = 0 → V³ = A/(2B).\n• Rulman ömrü: L₁₀ = (C/P)³ → dL/dP = −3L/P; ΔL/L ≈ −3·ΔP/P.\n• Yay/cıvata enerjisi: W = ∫F dx; F = kx + cx³ → W = kδ²/2 + cδ⁴/4; rijitlik dF/dx.\n• Tork çevrimi: T_ort = (1/2π)∫T dθ, P = T_ort·ω, ΔE = ∫(T − T_ort)dθ, I = ΔE/(C_s·ω²).\n• Paris yasası: da/dN = C(ΔK)^m, ΔK = Δσ√(πa) → N_f = ∫da/(C ΔK^m) = (1/K′)(1/a₀ − 1/a_c) (m = 4).\n\nYÖNTEM\n1. Modeli ve değişkenlerin birimlerini yaz.\n2. Optimum soruluyorsa türevi al, sıfıra eşitle, ikinci türevle doğrula.\n3. Duyarlılık / tahmin soruluyorsa türevi hesapla ve Δy ≈ f′·Δx kullan.\n4. Gerekirse kesin değerle karşılaştır, hatayı yorumla.\n5. Birimleri ve fiziksel anlamı (üretim kusuru, ömür, maliyet) kontrol et.\n\nÖZEL DURUMLAR VE TUZAKLAR\n• µm ↔ mm dönüşümü (1 mm = 1000 µm) hacim ve enerji yoğunluğu hesabında kritiktir.\n• Doğrusal yaklaşım yalnızca küçük değişimlerde iyidir; konveks fonksiyonlarda teğet eğriyi eksik/fazla tahmin eder.\n• Log–log ölçekte üstel/kuvvet yasaları doğru olur: eğim = üs.\n• Optimumun uç noktalarda (t → 0, t → ∞) olmadığını limit ya da ikinci türevle doğrulayın.\n\nMİNİ ÖRNEK\nd(P) = −0,002P² + 0,8P: d′ = −0,004P + 0,8 = 0 → P = 200 W; d_maks = −80 + 160 = 80 µm; d″ = −0,004 < 0 → maksimum ✓.\n\nHAFIZA KURALI\n\"Tepede teğet yataydır\": optimum = türevin sıfırı. \"Küçük adımda teğet = eğri\": duyarlılık = türev.",
      "ENGINEERING APPLICATION: MATERIALS, MANUFACTURING, MACHINE ELEMENTS AND CONTROL\nIn additive manufacturing, materials science, machining, machine elements and control systems, process parameters (power, speed, layer, temperature) are usually functions: use the derivative for the optimum, the derivative for sensitivity, the tangent for prediction.\n\nDEFINITIONS AND FORMULAS\n• Optimum (peak/valley): f′ = 0, the type from f″; for a parabola the vertex is P₀ = −b/(2a).\n• Rational relation: energy density E = P/(v·h·t) [J/mm³]; E falls as v grows.\n• Power law: V = k·v^(3/2); sensitivity V′ = (3/2)·k·√v; relative change = exponent × relative speed change.\n• Linear approximation: f(x) ≈ f(x₀) + f′(x₀)(x − x₀); error ≈ ½f″(x₀)(Δx)².\n• Exponential cooling: T(t) = T_m·e^(−kt) → dT/dt = −k·T (chain rule).\n• Basquin (S–N) law: S = a·N^(−b); dS/S = −b·dN/N.\n• Cost optimisation: C(t) = a/t + b·t → C′ = 0 → t* = √(a/b).\n• Taylor tool life: V·Tⁿ = C; implicit derivative: dT/dV = −T/(n·V).\n• Stress–strain: modulus E = σ′(0) (slope), toughness U = ∫σ dε (area under the curve, MPa = MJ/m³).\n• First-order system: y = Y(1 − e^(−t/τ)); y′(0) = Y/τ, t₉₅ = τ·ln 20, error area ∫₀^∞(Y − y)dt = Y·τ.\n• Second-order system: y′ = 0 → sin ω_d t = 0 → t_p = π/ω_d, overshoot M_p = e^(−πζ/√(1−ζ²)).\n• Machining cost: C(V) = A/V + B·V² → C′ = 0 → V³ = A/(2B).\n• Bearing life: L₁₀ = (C/P)³ → dL/dP = −3L/P; ΔL/L ≈ −3·ΔP/P.\n• Spring/bolt energy: W = ∫F dx; F = kx + cx³ → W = kδ²/2 + cδ⁴/4; stiffness dF/dx.\n• Torque cycle: T_mean = (1/2π)∫T dθ, P = T_mean·ω, ΔE = ∫(T − T_mean)dθ, I = ΔE/(C_s·ω²).\n• Paris law: da/dN = C(ΔK)^m, ΔK = Δσ√(πa) → N_f = ∫da/(C ΔK^m) = (1/K′)(1/a₀ − 1/a_c) (m = 4).\n\nMETHOD\n1. Write the model and the units of the variables.\n2. If an optimum is asked, differentiate, set to zero, confirm with the second derivative.\n3. If sensitivity / prediction is asked, compute the derivative and use Δy ≈ f′·Δx.\n4. If needed compare with the exact value and interpret the error.\n5. Check units and physical meaning (defect, life, cost).\n\nSPECIAL CASES AND PITFALLS\n• The µm ↔ mm conversion (1 mm = 1000 µm) is critical in volume and energy-density calculations.\n• Linear approximation is good only for small changes; for convex functions the tangent under/over-estimates the curve.\n• Exponential/power laws are straight lines on log–log scales: slope = exponent.\n• Verify that the optimum is not at the ends (t → 0, t → ∞) using a limit or the second derivative.\n\nMINI EXAMPLE\nd(P) = −0.002P² + 0.8P: d′ = −0.004P + 0.8 = 0 → P = 200 W; d_max = −80 + 160 = 80 µm; d″ = −0.004 < 0 → maximum ✓.\n\nMEMORY AID\n\"At the peak the tangent is flat\": optimum = zero of the derivative. \"For small steps the tangent equals the curve\": sensitivity = derivative.");
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
    id: 'engMaterials',
    tabTitle: () => tx("Malzeme ve İmalat", "Materials & Manufacturing"),
    concept,
    problemStatement,
    createProblem,
    solveSteps: EngAssume.wrap("materials", Steps),
    draw,
    drawSchematic,
    buildControls,
    links: [
      { match: /^• (Optimum \(tepe|Optimum \(peak)/, make: (rng) => makeScn(rng, 0) },
      { match: /^• (Rasyonel ilişki|Rational relation)/, make: (rng) => makeScn(rng, 1) },
      { match: /^• (Kuvvet yasası|Power law)/, make: (rng) => makeScn(rng, 2) },
      { match: /^• (Doğrusal yaklaşım|Linear approximation)/, make: (rng) => makeScn(rng, 3) },
      { match: /^• (Üstel soğuma|Exponential cooling)/, make: (rng) => makeScn(rng, 4) },
      { match: /^• (Basquin)/, make: (rng) => makeScn(rng, 5) },
      { match: /^• (Maliyet optimizasyonu|Cost optimisation)/, make: (rng) => makeScn(rng, 6) },
      { match: /^• (Taylor takım|Taylor tool)/, make: (rng) => makeScn(rng, 7) },
      { match: /^• (Gerilme.şekil|Stress.strain)/, make: (rng) => makeScn(rng, 8) },
      { match: /^• (Birinci mertebe|First-order)/, make: (rng) => makeScn(rng, 9) },
      { match: /^• (İkinci mertebe|Second-order)/, make: (rng) => makeScn(rng, 10) },
      { match: /^• (İşleme maliyeti|Machining cost)/, make: (rng) => makeScn(rng, 11) },
      { match: /^• (Rulman ömrü|Bearing life)/, make: (rng) => makeScn(rng, 12) },
      { match: /^• (Yay.cıvata|Spring.bolt)/, make: (rng) => makeScn(rng, 13) },
      { match: /^• (Tork çevrimi|Torque cycle)/, make: (rng) => makeScn(rng, 14) },
      { match: /^• (Paris yasası|Paris law)/, make: (rng) => makeScn(rng, 15) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
  });
})();
