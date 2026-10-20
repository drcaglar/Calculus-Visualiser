// Ported from Modules/EngineeringApplications/EngThermoFluidControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/limits/realLifeLimits.js): sixteen engineering scenarios with a scenario selector, live sliders,
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
  const G = 9.81;
  const RGas = 8.314;
  const GAM = 1.4;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const SUPD = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  // scientific notation with unicode superscripts (1.96×10⁻⁵)
  function Sci(v, d) {
    if (!isFinite(v) || v === 0) return '0';
    const dd = d === undefined ? 2 : d;
    let e = Math.floor(Math.log10(Math.abs(v)));
    let ms = (v / Math.pow(10, e)).toFixed(dd);
    if (Math.abs(parseFloat(ms)) >= 10) { e += 1; ms = (v / Math.pow(10, e)).toFixed(dd); }
    return parseFloat(ms).toString() + '×10' + String(e).split('').map((ch) => SUPD[ch] || ch).join('');
  }
  const Gs = (v) => (v !== 0 && Math.abs(v) < 0.01 ? Sci(v, 2) : F(v, 4, 0));

  // Numerical models of the scenarios added in the second batch (index 8..15); shared by Steps, draw and drawSchematic.
  function Mod(scn, x) {
    switch (scn) {
    case 8: {
      const g = GAM, p1 = x[0], V1 = x[1], r = x[2], rho = x[3];
      const V2 = V1 / r, p2 = p1 * Math.pow(r, g), p3 = rho * p2, p4 = rho * p1;
      const K1 = p1 * Math.pow(V1, g), K2 = p3 * Math.pow(V2, g);
      const W12 = K1 * (Math.pow(V2, 1 - g) - Math.pow(V1, 1 - g)) / (1 - g);
      const W34 = K2 * (Math.pow(V1, 1 - g) - Math.pow(V2, 1 - g)) / (1 - g);
      const Wn = W12 + W34, eta = 1 - Math.pow(r, 1 - g), Qin = (p3 * V2 - p2 * V2) / (g - 1);
      return { g, p1, V1, r, rho, V2, p2, p3, p4, K1, K2, W12, W34, Wn, eta, Qin, Qout: Qin - Wn };
    }
    case 9: {
      const mu = x[0] / 1000, Gp = x[1], R = x[2] / 1000;
      const c = Gp / (4 * mu);
      return { mu, Gp, R, c, umax: c * R * R, tauw: Gp * R / 2, dudrW: -2 * c * R, Q: Math.PI * c * Math.pow(R, 4) / 2, vbar: c * R * R / 2 };
    }
    case 10: {
      const Ti = x[0], To = x[1], ri = x[2], t = x[3], k = x[4], ro = ri + t;
      const ln = Math.log(ro / ri), Q = 2 * Math.PI * k * (Ti - To) / ln;
      return { Ti, To, ri, t, k, ro, ln, Q, qi: Q / (2 * Math.PI * ri / 100), qo: Q / (2 * Math.PI * ro / 100), rg: Math.sqrt(ri * ro), rm: (ri + ro) / 2,
        Tr: (r) => Ti - (Ti - To) * Math.log(r / ri) / ln };
    }
    case 11: {
      const k0 = x[0], be = x[1] / 1000, Th = x[2], Tc = x[3], L = x[4];
      const q = (k0 / L) * ((Th - Tc) + be / 2 * (Th * Th - Tc * Tc));
      const Tx = (xx) => (-1 + Math.sqrt(Math.max(0, 1 + 2 * be * (Th + be * Th * Th / 2 - q * xx / k0)))) / be;
      return { k0, be, Th, Tc, L, q, q0: k0 * (Th - Tc) / L, kh: k0 * (1 + be * Th), kc: k0 * (1 + be * Tc), km: k0 * (1 + be * (Th + Tc) / 2), Tx, Tmid: Tx(L / 2) };
    }
    case 12: {
      const m = x[0], c = x[1], hA = x[2], Ti = x[3], tm = x[4], Tinf = 20;
      const tau = m * c / hA, ts = tm * 60, e = Math.exp(-ts / tau), T = Tinf + (Ti - Tinf) * e;
      return { m, c, hA, Ti, tm, Tinf, tau, ts, e, T, rateS: -(T - Tinf) / tau, P0: hA * (Ti - Tinf), P: hA * (T - Tinf), Q: m * c * (Ti - T) / 1000, Q2: hA * (Ti - Tinf) * tau * (1 - e) / 1000 };
    }
    case 13: {
      const Pm = x[0], T = x[1], m = x[2];
      const E = 2 * Pm * T / Math.PI;
      return { Pm, T, m, E, Pavg: 2 * Pm / Math.PI, EkJ: E * 3600, dT: E * 3600 / (m * 4.18) };
    }
    case 14: {
      const a = x[0], B = x[1] * 1e6, D = Math.pow(5 * B / a, 1 / 6);
      return { a, B, D6: 5 * B / a, D, pipe: a * D, pump: B / Math.pow(D, 5), C: a * D + B / Math.pow(D, 5) };
    }
    default: {
      const w = x[0], s1 = x[1], Lg = x[2], th = x[3], s2 = s1 + Lg, sn = Math.sin(th * Math.PI / 180), cs = Math.cos(th * Math.PI / 180);
      const rg = 9.81 * w * sn, F0 = rg * (s2 * s2 - s1 * s1) / 2, M = rg * (Math.pow(s2, 3) - Math.pow(s1, 3)) / 3;
      return { w, s1, s2, Lg, th, sn, cs, rg, F: F0, M, scp: M / F0, hc: (s1 + s2) / 2 * sn, A: w * Lg };
    }
    }
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
    return [ tx("1. Newton soğuma yasası: sıcaklık ve soğuma hızı", "1. Newton's law of cooling: temperature and cooling rate"), tx("2. Newton soğuma yasası: hedef sıcaklığa varma süresi", "2. Newton's law of cooling: time to reach a target"), tx("3. Duvardan tek boyutlu ısı iletimi (Fourier)", "3. 1-D heat conduction through a wall (Fourier)"), tx("4. Değişken özgül ısı: depolanan ısı Q = ∫ m c(T) dT", "4. Variable specific heat: stored heat Q = ∫ m c(T) dT"), tx("5. Tank boşalması (Torricelli): ilişkili değişim", "5. Tank draining (Torricelli): related rates"), tx("6. Borudaki debi: Q = ∫ v(r) 2πr dr", "6. Pipe flow rate: Q = ∫ v(r) 2πr dr"), tx("7. İdeal gaz: dP/dt ve izotermal genleşme işi", "7. Ideal gas: dP/dt and isothermal expansion work"), tx("8. Optimizasyon: en ucuz yalıtım kalınlığı", "8. Optimization: cheapest insulation thickness"),
      tx("9. Otto çevrimi: p–V alanı = net iş (adyabatik integral)", "9. Otto cycle: p–V area = net work (adiabatic integral)"),
      tx("10. Laminer boru akışı: u(r), duvar kayması, debi", "10. Laminar pipe flow: u(r), wall shear, flow rate"),
      tx("11. Silindirik boru duvarında iletim (ln r)", "11. Conduction through a cylindrical pipe wall (ln r)"),
      tx("12. Sıcaklığa bağlı iletkenlik: k(T) ile duvar", "12. Temperature-dependent conductivity: wall with k(T)"),
      tx("13. Toplu kapasite: motor bloğu soğuması ve atılan ısı", "13. Lumped capacitance: engine-block cooling and heat removed"),
      tx("14. Değişken güç: kolektör enerjisi E = ∫P dt", "14. Variable power: collector energy E = ∫P dt"),
      tx("15. Optimizasyon: en ekonomik boru çapı", "15. Optimization: most economical pipe diameter"),
      tx("16. Hidrostatik kuvvet: eğik kapak (integral)", "16. Hydrostatic force on an inclined gate (integral)") ];
  }


  function Specs(scn) {
    switch (scn) {
    case 0: {
    return [Spec(tx("Ortam sıcaklığı Tₐ (°C)", "Ambient temperature Tₐ (°C)"), 15, 30, 5), Spec(tx("Başlangıç sıcaklığı T₀ (°C)", "Initial temperature T₀ (°C)"), 60, 100, 20), Spec(tx("Soğuma sabiti k (1/dk)", "Cooling constant k (1/min)"), 0.05, 0.2, 0.05), Spec(tx("Süre t (dk)", "Time t (min)"), 5, 20, 5)];
    break; }
    case 1: {
    return [Spec(tx("Başlangıç sıcaklığı T₀ (°C)", "Initial temperature T₀ (°C)"), 60, 120, 20), Spec(tx("Hedef sıcaklık T* (°C)", "Target temperature T* (°C)"), 30, 50, 10), Spec(tx("Soğuma sabiti k (1/dk)", "Cooling constant k (1/min)"), 0.05, 0.2, 0.05)];
    break; }
    case 2: {
    return [Spec(tx("Sıcak yüz Tₕ (°C)", "Hot face Tₕ (°C)"), 100, 200, 50), Spec(tx("Soğuk yüz T_c (°C)", "Cold face T_c (°C)"), 20, 40, 10), Spec(tx("Duvar kalınlığı L (m)", "Wall thickness L (m)"), 0.1, 0.4, 0.1), Spec(tx("İletkenlik k (W/m·K)", "Conductivity k (W/m·K)"), 0.5, 2, 0.5)];
    break; }
    case 3: {
    return [Spec(tx("Kütle m (kg)", "Mass m (kg)"), 1, 5, 1), Spec(tx("a (kJ/kg·K)", "a (kJ/kg·K)"), 0.5, 2, 0.5), Spec(tx("b × 1000 (kJ/kg·K²)", "b × 1000 (kJ/kg·K²)"), 1, 5, 1), Spec(tx("Son sıcaklık T₂ (°C)", "Final temperature T₂ (°C)"), 100, 300, 100)];
    break; }
    case 4: {
    return [Spec(tx("Başlangıç yüksekliği h₀ (m)", "Initial height h₀ (m)"), 1, 9, 2), Spec(tx("Tank kesit alanı A (m²)", "Tank cross-section A (m²)"), 1, 4, 1), Spec(tx("Delik alanı a (cm²)", "Hole area a (cm²)"), 10, 40, 10)];
    break; }
    case 5: {
    return [Spec(tx("Eksen hızı v_max (m/s)", "Centre-line speed v_max (m/s)"), 1, 4, 1), Spec(tx("Boru yarıçapı R (m)", "Pipe radius R (m)"), 0.05, 0.2, 0.05)];
    break; }
    case 6: {
    return [Spec(tx("Gaz miktarı n (mol)", "Amount of gas n (mol)"), 1, 3, 1), Spec(tx("Sıcaklık T (K)", "Temperature T (K)"), 300, 600, 100), Spec(tx("Başlangıç hacmi V₁ (L)", "Initial volume V₁ (L)"), 10, 40, 10), Spec(tx("Genleşme oranı V₂/V₁", "Expansion ratio V₂/V₁"), 2, 4, 1)];
    break; }
    case 7: {
    return [Spec(tx("Yalıtım maliyeti a (TL/cm·m²)", "Insulation cost a (TL per cm·m²)"), 2, 8, 2), Spec(tx("Isı kaybı maliyeti b (TL·cm/m²)", "Heat-loss cost b (TL·cm/m²)"), 200, 800, 200)];
    break; }
    case 8: {
    return [Spec(tx("Başlangıç basıncı p₁ (kPa)", "Initial pressure p₁ (kPa)"), 100, 200, 100), Spec(tx("Silindir hacmi V₁ (L)", "Cylinder volume V₁ (L)"), 1, 4, 1), Spec(tx("Sıkıştırma oranı r = V₁/V₂", "Compression ratio r = V₁/V₂"), 6, 10, 2), Spec(tx("Basınç artış oranı ρ = p₃/p₂", "Pressure ratio ρ = p₃/p₂"), 2, 4, 1)];
    break; }
    case 9: {
    return [Spec(tx("Viskozite μ (mPa·s)", "Viscosity μ (mPa·s)"), 20, 80, 20), Spec(tx("Basınç gradyanı −dp/dx (Pa/m)", "Pressure gradient −dp/dx (Pa/m)"), 100, 400, 100), Spec(tx("Boru yarıçapı R (mm)", "Pipe radius R (mm)"), 5, 20, 5)];
    break; }
    case 10: {
    return [Spec(tx("İç yüzey sıcaklığı Tᵢ (°C)", "Inner-surface temperature Tᵢ (°C)"), 100, 200, 50), Spec(tx("Dış yüzey sıcaklığı T_o (°C)", "Outer-surface temperature T_o (°C)"), 20, 40, 20), Spec(tx("İç yarıçap rᵢ (cm)", "Inner radius rᵢ (cm)"), 2, 6, 2), Spec(tx("Duvar kalınlığı t (cm)", "Wall thickness t (cm)"), 2, 6, 2), Spec(tx("İletkenlik k (W/m·K)", "Conductivity k (W/m·K)"), 20, 60, 20)];
    break; }
    case 11: {
    return [Spec(tx("k₀ (W/m·K)", "k₀ (W/m·K)"), 0.5, 2, 0.5), Spec(tx("β × 1000 (1/K)", "β × 1000 (1/K)"), 1, 4, 1), Spec(tx("Sıcak yüz Tₕ (°C)", "Hot face Tₕ (°C)"), 100, 300, 100), Spec(tx("Soğuk yüz T_c (°C)", "Cold face T_c (°C)"), 20, 60, 20), Spec(tx("Duvar kalınlığı L (m)", "Wall thickness L (m)"), 0.1, 0.3, 0.1)];
    break; }
    case 12: {
    return [Spec(tx("Kütle m (kg)", "Mass m (kg)"), 10, 50, 10), Spec(tx("Özgül ısı c (J/kg·K)", "Specific heat c (J/kg·K)"), 400, 800, 200), Spec(tx("Taşınım iletkenliği hA (W/K)", "Convection conductance hA (W/K)"), 20, 100, 20), Spec(tx("Başlangıç sıcaklığı Tᵢ (°C)", "Initial temperature Tᵢ (°C)"), 80, 120, 20), Spec(tx("Süre t (dk)", "Time t (min)"), 5, 20, 5)];
    break; }
    case 13: {
    return [Spec(tx("Tepe güç P_max (kW)", "Peak power P_max (kW)"), 1, 4, 1), Spec(tx("Gün uzunluğu T (saat)", "Day length T (h)"), 6, 12, 2), Spec(tx("Depo suyu m (kg)", "Storage water m (kg)"), 500, 1500, 500)];
    break; }
    case 14: {
    return [Spec(tx("Boru maliyet katsayısı a (TL/yıl·cm)", "Pipe cost coefficient a (TL/yr·cm)"), 20, 60, 20), Spec(tx("Pompalama katsayısı b (10⁶ TL·cm⁵/yıl)", "Pumping coefficient b (10⁶ TL·cm⁵/yr)"), 20, 100, 20)];
    break; }
    default: {
    return [Spec(tx("Kapak genişliği w (m)", "Gate width w (m)"), 1, 3, 1), Spec(tx("Üst kenar uzaklığı s₁ (m)", "Top-edge distance s₁ (m)"), 0, 2, 1), Spec(tx("Kapak boyu L (m)", "Gate length L (m)"), 2, 4, 1), Spec(tx("Eğim açısı θ (°)", "Incline angle θ (°)"), 30, 90, 30)];
    break; }
    }
  }


  function Question(p) {
    let x = p.p;
    switch (p.scn) {
    case 0: {
    return tx(`${N2(x[1])} °C'deki sıcak bir metal parça, ${N2(x[0])} °C'lik odada Newton soğuma yasasına göre T(t) = Tₐ + (T₀ − Tₐ)e^(−kt) soğuyor (k = ${N2(x[2])} 1/dk). t = ${N2(x[3])} dk sonunda sıcaklık kaç °C'dir ve o anda parça ne hızla (°C/dk) soğumaktadır?`, `A hot metal part at ${N2(x[1])} °C cools in a room at ${N2(x[0])} °C following Newton's law T(t) = Tₐ + (T₀ − Tₐ)e^(−kt) with k = ${N2(x[2])} 1/min. What is the temperature after t = ${N2(x[3])} min, and how fast (°C/min) is the part cooling at that instant?`);
    break; }
    case 1: {
    return tx(`${N2(x[0])} °C'deki bir sıvı 20 °C'lik ortamda T(t) = 20 + (T₀ − 20)e^(−kt) yasasıyla soğuyor (k = ${N2(x[2])} 1/dk). Sıcaklık ne kadar sürede ${N2(x[1])} °C'ye düşer?`, `A liquid at ${N2(x[0])} °C cools in a 20 °C environment by T(t) = 20 + (T₀ − 20)e^(−kt) with k = ${N2(x[2])} 1/min. How long does it take to fall to ${N2(x[1])} °C?`);
    break; }
    case 2: {
    return tx(`Kalınlığı L = ${N2(x[2])} m ve ısıl iletkenliği k = ${N2(x[3])} W/m·K olan bir duvarın sıcak yüzü ${N2(x[0])} °C, soğuk yüzü ${N2(x[1])} °C'dir. Kararlı, tek boyutlu iletimde sıcaklık profili T(x)'i bulun ve ısı akısı q = −k·dT/dx değerini (W/m²) hesaplayın.`, `A wall of thickness L = ${N2(x[2])} m and thermal conductivity k = ${N2(x[3])} W/m·K has a hot face at ${N2(x[0])} °C and a cold face at ${N2(x[1])} °C. For steady one-dimensional conduction find the temperature profile T(x) and the heat flux q = −k·dT/dx (W/m²).`);
    break; }
    case 3: {
    return tx(`${N2(x[0])} kg'lık bir parçanın özgül ısısı sıcaklığa bağlıdır: c(T) = ${N2(x[1])} + ${N2(x[2] / 1000)}·T kJ/kg·K (T °C). Parçayı 20 °C'den ${N2(x[3])} °C'ye ısıtmak için gereken ısı Q kaç kJ'dür?`, `A ${N2(x[0])} kg part has a temperature-dependent specific heat c(T) = ${N2(x[1])} + ${N2(x[2] / 1000)}·T kJ/kg·K (T in °C). How much heat Q (kJ) is needed to heat it from 20 °C to ${N2(x[3])} °C?`);
    break; }
    case 4: {
    return tx(`Kesit alanı ${N2(x[1])} m² olan bir tankta ${N2(x[0])} m yüksekliğinde su vardır. Tabandaki ${N2(x[2])} cm²'lik delikten su Torricelli hızıyla v = √(2gh) akar (g = 9,81 m/s²). Bu anda su seviyesi ne hızla düşüyor ve tank yaklaşık ne kadar sürede boşalır?`, `A tank of cross-section ${N2(x[1])} m² holds water to a height of ${N2(x[0])} m. Water leaves through a ${N2(x[2])} cm² hole in the base at the Torricelli speed v = √(2gh) (g = 9.81 m/s²). How fast is the water level falling at this moment, and about how long does the tank take to empty?`);
    break; }
    case 5: {
    return tx(`Yarıçapı R = ${N2(x[1])} m olan bir borudaki akışın hız profili paraboliktir: v(r) = ${N2(x[0])}·(1 − r²/R²) m/s. Hacimsel debi Q = ∫ v(r)·2πr dr kaç L/s'dir?`, `Flow in a pipe of radius R = ${N2(x[1])} m has the parabolic velocity profile v(r) = ${N2(x[0])}·(1 − r²/R²) m/s. What is the volume flow rate Q = ∫ v(r)·2πr dr in L/s?`);
    break; }
    case 6: {
    return tx(`${N2(x[0])} mol ideal gaz ${N2(x[1])} K'de, ${N2(x[2])} L hacimden ${N2(x[3])} katına izotermal genleşiyor. (a) V = ${N2(x[2])} L iken hacim 5 L/s hızla artıyorsa basınç ne hızla (kPa/s) değişir? (b) Genleşme sırasında gazın yaptığı iş W = ∫P dV kaç J'dür? (R = 8,314 J/mol·K)`, `${N2(x[0])} mol of ideal gas at ${N2(x[1])} K expands isothermally from ${N2(x[2])} L to ${N2(x[3])} times that volume. (a) If at V = ${N2(x[2])} L the volume grows at 5 L/s, how fast does the pressure change (kPa/s)? (b) How much work W = ∫P dV (J) does the gas do during the expansion? (R = 8.314 J/mol·K)`);
    break; }
    case 8: {
    return tx(`Bir Otto (benzinli motor) çevriminde başlangıç hali p₁ = ${N2(x[0])} kPa, V₁ = ${N2(x[1])} L, sıkıştırma oranı r = V₁/V₂ = ${N2(x[2])}'dir. 1→2 sıkıştırma ve 3→4 genleşme adyabatiktir (pV^γ = sabit, γ = 1,4); 2→3 ve 4→1 sabit hacimlidir ve 2→3'te basınç p₃ = ${N2(x[3])}·p₂ olur. Her adyabatik işi W = ∫p dV ile hesaplayıp çevrimin net işini (J) ve ısıl verimi bulun.`, `In an Otto (petrol engine) cycle the initial state is p₁ = ${N2(x[0])} kPa, V₁ = ${N2(x[1])} L and the compression ratio is r = V₁/V₂ = ${N2(x[2])}. Compression 1→2 and expansion 3→4 are adiabatic (pV^γ = constant, γ = 1.4); 2→3 and 4→1 are at constant volume and in 2→3 the pressure becomes p₃ = ${N2(x[3])}·p₂. Evaluate each adiabatic work with W = ∫p dV and find the net work of the cycle (J) and the thermal efficiency.`);
    break; }
    case 9: {
    return tx(`Viskozitesi μ = ${N2(x[0])} mPa·s olan yağ, yarıçapı R = ${N2(x[2])} mm olan yatay bir borudan laminer akar; basınç gradyanı −dp/dx = ${N2(x[1])} Pa/m'dir. Hız profili u(r) = (−dp/dx)(R² − r²)/(4μ) olarak verilmiştir. Eksen hızını, duvar kayma gerilmesini τ_w = −μ·du/dr (r = R) ve debiyi Q = ∫u(r)·2πr dr (mL/s) bulun.`, `Oil of viscosity μ = ${N2(x[0])} mPa·s flows laminarly through a horizontal pipe of radius R = ${N2(x[2])} mm with pressure gradient −dp/dx = ${N2(x[1])} Pa/m. The velocity profile is given as u(r) = (−dp/dx)(R² − r²)/(4μ). Find the centre-line speed, the wall shear stress τ_w = −μ·du/dr at r = R and the flow rate Q = ∫u(r)·2πr dr (mL/s).`);
    break; }
    case 10: {
    return tx(`İç yarıçapı rᵢ = ${N2(x[2])} cm, kalınlığı ${N2(x[3])} cm (dış yarıçap r_o = ${N2(x[2] + x[3])} cm) ve ısıl iletkenliği k = ${N2(x[4])} W/m·K olan uzun bir borunun iç yüzeyi ${N2(x[0])} °C, dış yüzeyi ${N2(x[1])} °C'dir. Kararlı halde Fourier yasası Q′ = −k·(2πr)·dT/dr (Q′: boy başına ısı akışı, W/m) r'den bağımsızdır. Q′'yü ve T(r) profilini bulun.`, `A long pipe with inner radius rᵢ = ${N2(x[2])} cm, wall thickness ${N2(x[3])} cm (outer radius r_o = ${N2(x[2] + x[3])} cm) and thermal conductivity k = ${N2(x[4])} W/m·K has an inner surface at ${N2(x[0])} °C and an outer surface at ${N2(x[1])} °C. In steady state Fourier's law Q′ = −k·(2πr)·dT/dr (Q′: heat flow per unit length, W/m) is independent of r. Find Q′ and the temperature profile T(r).`);
    break; }
    case 11: {
    return tx(`Kalınlığı L = ${N2(x[4])} m olan bir duvarın iletkenliği sıcaklıkla artar: k(T) = k₀(1 + βT), k₀ = ${N2(x[0])} W/m·K, β = ${N2(x[1] / 1000)} 1/K (T °C). Sıcak yüz ${N2(x[2])} °C, soğuk yüz ${N2(x[3])} °C'dir. Kararlı halde q = −k(T)·dT/dx sabit olduğuna göre q'yu (W/m²) ve duvarın tam ortasındaki sıcaklığı bulun.`, `The conductivity of a wall of thickness L = ${N2(x[4])} m rises with temperature: k(T) = k₀(1 + βT), k₀ = ${N2(x[0])} W/m·K, β = ${N2(x[1] / 1000)} 1/K (T in °C). The hot face is at ${N2(x[2])} °C and the cold face at ${N2(x[3])} °C. Since q = −k(T)·dT/dx is constant in steady state, find q (W/m²) and the temperature at the middle of the wall.`);
    break; }
    case 12: {
    return tx(`${N2(x[0])} kg kütleli, özgül ısısı c = ${N2(x[1])} J/kg·K olan bir motor bloğu ${N2(x[3])} °C'den T∞ = 20 °C'lik havada soğuyor; taşınım iletkenliği hA = ${N2(x[2])} W/K. Toplu kapasite modeli m·c·dT/dt = −hA(T − T∞) geçerlidir. Zaman sabiti τ nedir; t = ${N2(x[4])} dk sonunda sıcaklık, soğuma hızı ve bu sürede atılan toplam ısı Q = ∫hA(T − T∞) dt kaç kJ'dür?`, `An engine block of mass ${N2(x[0])} kg and specific heat c = ${N2(x[1])} J/kg·K cools from ${N2(x[3])} °C in air at T∞ = 20 °C with convection conductance hA = ${N2(x[2])} W/K. The lumped-capacitance model m·c·dT/dt = −hA(T − T∞) holds. What is the time constant τ; after t = ${N2(x[4])} min what are the temperature, the cooling rate and the total heat removed Q = ∫hA(T − T∞) dt (kJ)?`);
    break; }
    case 13: {
    return tx(`Bir güneş kolektörünün ısıl gücü gün boyunca P(t) = P_max·sin(πt/T) kW'tır (t = 0 gün doğumu, T = ${N2(x[1])} saat gün uzunluğu, P_max = ${N2(x[0])} kW). (a) Gün içinde toplanan enerji E = ∫₀ᵀ P dt kaç kWh? (b) Güç ne zaman en büyüktür? (c) Bu enerji, ${N2(x[2])} kg suyu (c = 4,18 kJ/kg·K) kaç K ısıtır?`, `The thermal power of a solar collector over the day is P(t) = P_max·sin(πt/T) kW (t = 0 is sunrise, day length T = ${N2(x[1])} h, P_max = ${N2(x[0])} kW). (a) How much energy E = ∫₀ᵀ P dt (kWh) is collected in a day? (b) When is the power greatest? (c) By how many kelvin does this energy heat ${N2(x[2])} kg of water (c = 4.18 kJ/kg·K)?`);
    break; }
    case 14: {
    return tx(`Bir su hattında boru çapı D (cm) büyüdükçe boru maliyeti artar, pompalama enerjisi (sürtünme kaybı ∝ 1/D⁵) azalır. Yıllık toplam maliyet C(D) = ${N2(x[0])}·D + ${N2(x[1])}·10⁶/D⁵ TL/yıl'dır. Toplam maliyeti en küçük yapan çap D* ve o maliyet nedir?`, `In a water line, a larger pipe diameter D (cm) raises the pipe cost but lowers the pumping energy (friction loss ∝ 1/D⁵). The yearly total cost is C(D) = ${N2(x[0])}·D + ${N2(x[1])}·10⁶/D⁵ TL/yr. Which diameter D* minimises the total cost, and what is that cost?`);
    break; }
    default: {
    const o = Mod(15, x);
    return tx(`Genişliği w = ${N2(x[0])} m olan dikdörtgen bir kapak, yatayla θ = ${N2(x[3])}° yapan eğik bir yüzeyde durur. Su yüzeyinden kapak boyunca ölçülen uzaklık s ise kapak s₁ = ${N2(x[1])} m ile s₂ = ${N2(o.s2)} m arasındadır (boy L = ${N2(x[2])} m). Gösterge basıncı p(s) = ρ·g·s·sinθ (ρ = 1000 kg/m³, g = 9,81 m/s²). Toplam hidrostatik kuvvet F = ∫p·w ds ve etki noktası s_cp = ∫s·p·w ds / F nedir?`, `A rectangular gate of width w = ${N2(x[0])} m lies on a surface inclined at θ = ${N2(x[3])}° to the horizontal. With s measured along the gate from the water surface, the gate spans s₁ = ${N2(x[1])} m to s₂ = ${N2(o.s2)} m (length L = ${N2(x[2])} m). The gauge pressure is p(s) = ρ·g·s·sinθ (ρ = 1000 kg/m³, g = 9.81 m/s²). Find the total hydrostatic force F = ∫p·w ds and its point of action s_cp = ∫s·p·w ds / F.`);
    break; }
    case 7: {
    return tx(`Bir boruya x cm kalınlığında yalıtım yapılacaktır. Yıllık toplam maliyet (m² başına) C(x) = ${N2(x[0])}x + ${N2(x[1])}/(x + 2) TL'dir: ilk terim yalıtım malzemesi, ikinci terim ısı kaybıdır. Toplam maliyeti en küçük yapan kalınlık ve o maliyet nedir?`, `A pipe is to be insulated with a layer x cm thick. The yearly total cost per m² is C(x) = ${N2(x[0])}x + ${N2(x[1])}/(x + 2) TL: the first term is the insulation material, the second the heat loss. What thickness minimises the total cost, and what is that cost?`);
    break; }
    }
  }


  function MeaningExtra(scn) {
    switch (scn) {
    case 0: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "T(t) = T_ort + (T₀ − T_ort)·e^(−kt): T °C, k 1/s. Soğuma hızı dT/dt = −k(T − T_ort) sıcaklık farkıyla orantılıdır: cisim ne kadar sıcaksa o kadar hızlı soğur. Zaman sabiti τ = 1/k." + "\n" + "YÖNTEM" + "\n" + "1. T(t) yaz. 2. T′(t) = −k(T − T_ort). 3. İstenen t'de değerlendir." + "\n" + "TUZAK: Oda sıcaklığına (T_ort) asla tam ulaşılmaz; üstel azalma. k ve t'nin birimleri uyumlu olmalı.", "UNITS AND PHYSICAL MEANING" + "\n" + "T(t) = T_amb + (T₀ − T_amb)·e^(−kt): T in °C, k in 1/s. The cooling rate dT/dt = −k(T − T_amb) is proportional to the temperature difference: the hotter the body, the faster it cools. Time constant τ = 1/k." + "\n" + "METHOD" + "\n" + "1. Write T(t). 2. T′(t) = −k(T − T_amb). 3. Evaluate at the requested t." + "\n" + "PITFALL: the ambient temperature is never reached exactly (exponential decay). Units of k and t must match.");
    break; }
    case 1: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Hedef sıcaklığa varma süresi t = (1/k)·ln[(T₀ − T_ort)/(T_h − T_ort)] (s). Logaritma üsteli çözer." + "\n" + "YÖNTEM" + "\n" + "1. T_h = T_ort + (T₀ − T_ort)e^(−kt). 2. e^(−kt) = (T_h − T_ort)/(T₀ − T_ort). 3. Her iki tarafın ln'ini al: t = −(1/k)ln(...)." + "\n" + "TUZAK: T_h, T_ort'tan küçük olamaz (ln içi pozitif olmalı); mutlak sıcaklık değil FARKLAR kullanılır.", "UNITS AND PHYSICAL MEANING" + "\n" + "Time to reach a target temperature: t = (1/k)·ln[(T₀ − T_amb)/(T_t − T_amb)] (s). The logarithm undoes the exponential." + "\n" + "METHOD" + "\n" + "1. T_t = T_amb + (T₀ − T_amb)e^(−kt). 2. e^(−kt) = (T_t − T_amb)/(T₀ − T_amb). 3. Take ln of both sides: t = −(1/k)ln(...)." + "\n" + "PITFALL: T_t cannot be below T_amb (the ln argument must be positive); use temperature DIFFERENCES, not absolute values.");
    break; }
    case 2: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Fourier yasası q = −k·dT/dx: k (W/m·K), q ısı akısı (W/m²), T (K veya °C). Eksi işaret, ısının sıcaktan soğuğa aktığını gösterir. Duvardan toplam ısı kaybı Q = q·A (W). Sıcaklık profili doğrusalsa dT/dx sabittir." + "\n" + "YÖNTEM" + "\n" + "1. T(x) profilini yaz. 2. Türev dT/dx. 3. q = −k·dT/dx, Q = q·A." + "\n" + "TUZAK: Eksi işaretini ve birimleri (mm → m) unutmayın; çok katmanlı duvarda dirençler toplanır.", "UNITS AND PHYSICAL MEANING" + "\n" + "Fourier's law q = −k·dT/dx: k (W/m·K), heat flux q (W/m²), T (K or °C). The minus sign shows heat flows from hot to cold. Total heat loss through the wall Q = q·A (W). For a linear profile dT/dx is constant." + "\n" + "METHOD" + "\n" + "1. Write the profile T(x). 2. Differentiate dT/dx. 3. q = −k·dT/dx, Q = q·A." + "\n" + "PITFALL: do not forget the minus sign and units (mm → m); in multi-layer walls the resistances add.");
    break; }
    case 3: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "c(T): J/(kg·K), m: kg, Q: J. Q = m∫c(T) dT; c sıcaklıkla değiştiği için sabit c ile çarpmak yetmez. Eğri altındaki alan = depolanan ısı. Ortalama c = Q/(m·ΔT)." + "\n" + "YÖNTEM" + "\n" + "1. c(T) = c₀ + βT gibi yaz. 2. İntegre et: [c₀T + ½βT²]. 3. T₁'den T₂'ye değerlendir, m ile çarp." + "\n" + "TUZAK: °C ve K farkı aynıdır (ΔT), ama c(T) formülü hangi ölçekte tanımlıysa ona uyun.", "UNITS AND PHYSICAL MEANING" + "\n" + "c(T): J/(kg·K), m: kg, Q: J. Q = m∫c(T) dT; because c varies with temperature, multiplying by a constant c is not enough. Area under the curve = stored heat. Mean c = Q/(m·ΔT)." + "\n" + "METHOD" + "\n" + "1. Write c(T) = c₀ + βT or similar. 2. Integrate: [c₀T + ½βT²]. 3. Evaluate from T₁ to T₂ and multiply by m." + "\n" + "PITFALL: a °C and K difference is the same (ΔT), but follow whichever scale the formula c(T) is defined in.");
    break; }
    case 4: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Torricelli: v = √(2gh) m/s. Debi Q = a·√(2gh) m³/s; tank alanı A için A·dh/dt = −a√(2gh): seviye düşme hızı (m/s) basınçla azalır. Bu bir İLGİLİ DEĞİŞİM HIZLARI problemidir (hacim ve yükseklik)." + "\n" + "YÖNTEM" + "\n" + "1. V = A·h. 2. dV/dt = A·dh/dt = −a√(2gh). 3. dh/dt = −(a/A)√(2gh); değerleri yerine koy." + "\n" + "TUZAK: Alan birimlerini (cm² → m²) çevirin; sayıları türevden önce yerine koymayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "Torricelli: v = √(2gh) m/s. Flow Q = a·√(2gh) m³/s; for tank area A: A·dh/dt = −a√(2gh): the level drop rate (m/s) decreases with head. This is a RELATED RATES problem (volume and height)." + "\n" + "METHOD" + "\n" + "1. V = A·h. 2. dV/dt = A·dh/dt = −a√(2gh). 3. dh/dt = −(a/A)√(2gh); substitute the values." + "\n" + "PITFALL: convert area units (cm² → m²); do not substitute numbers before differentiating.");
    break; }
    case 5: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "v(r) hız profili m/s, r yarıçap m, Q m³/s. Halkasal şerit alanı dA = 2πr dr olduğundan debi Q = ∫₀^R v(r)·2πr dr. Laminer akışta v(r) = v_max(1 − r²/R²) parabolik; ortalama hız v_max/2 ve Q = πR²v_max/2." + "\n" + "YÖNTEM" + "\n" + "1. dA = 2πr dr. 2. Q = 2π∫₀^R v(r) r dr. 3. İntegrali hesapla; L/s'e çevir (1 m³/s = 1000 L/s)." + "\n" + "TUZAK: Q = v·A yalnızca v sabit ise doğrudur; r çarpanını (2πr) unutmayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "v(r) velocity profile m/s, r radius m, Q m³/s. The annular strip has area dA = 2πr dr, so the flow rate is Q = ∫₀^R v(r)·2πr dr. For laminar flow v(r) = v_max(1 − r²/R²) is parabolic; the mean velocity is v_max/2 and Q = πR²v_max/2." + "\n" + "METHOD" + "\n" + "1. dA = 2πr dr. 2. Q = 2π∫₀^R v(r) r dr. 3. Evaluate the integral; convert to L/s (1 m³/s = 1000 L/s)." + "\n" + "PITFALL: Q = v·A holds only for constant v; do not forget the factor 2πr.");
    break; }
    case 6: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "İdeal gaz: PV = nRT (P Pa, V m³, T K). V sabit ve T değişiyorsa dP/dt = (nR/V)·dT/dt (ilgili değişim). İzotermal genleşmede W = ∫P dV = nRT·ln(V₂/V₁) joule; P = nRT/V olduğu için integral logaritma verir." + "\n" + "YÖNTEM" + "\n" + "1. P = nRT/V. 2. Gerekirse zamana göre türet (zincir kuralı). 3. W = nRT∫ dV/V = nRT ln(V₂/V₁)." + "\n" + "TUZAK: T kelvin olmalı; °C ile hesap yanlış sonuç verir. İşaret: genleşmede gaz iş yapar (W > 0).", "UNITS AND PHYSICAL MEANING" + "\n" + "Ideal gas: PV = nRT (P in Pa, V in m³, T in K). With V constant and T changing, dP/dt = (nR/V)·dT/dt (related rates). In isothermal expansion W = ∫P dV = nRT·ln(V₂/V₁) joules; since P = nRT/V the integral gives a logarithm." + "\n" + "METHOD" + "\n" + "1. P = nRT/V. 2. Differentiate with respect to time if needed (chain rule). 3. W = nRT∫ dV/V = nRT ln(V₂/V₁)." + "\n" + "PITFALL: T must be in kelvin; using °C gives wrong results. Sign: in expansion the gas does work (W > 0).");
    break; }
    case 7: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Toplam maliyet C(x) = yalıtım maliyeti (kalınlıkla artar) + ısı kaybı maliyeti (kalınlıkla azalır, ≈ 1/x). Birim: ₺/yıl veya $/yıl. Optimumda iki etki dengelenir." + "\n" + "5 ADIM" + "\n" + "1. C(x) = a·x + b/x (ya da benzeri). 2. C′(x) = a − b/x² = 0 → x* = √(b/a). 3. C″ = 2b/x³ > 0 → minimum. 4. x* (m ya da cm) yaz. 5. Pratik kalınlıklara uygun mu kontrol et." + "\n" + "TUZAK: Kalınlığın üst sınırını ve sabit maliyetleri (türevde kaybolur) unutmayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "Total cost C(x) = insulation cost (rises with thickness) + heat-loss cost (falls with thickness, ≈ 1/x). Unit: currency/year. At the optimum the two effects balance." + "\n" + "5 STEPS" + "\n" + "1. C(x) = a·x + b/x (or similar). 2. C′(x) = a − b/x² = 0 → x* = √(b/a). 3. C″ = 2b/x³ > 0 → minimum. 4. State x* (m or cm). 5. Check it suits practical thicknesses." + "\n" + "PITFALL: do not forget the upper limit of thickness, and fixed costs (they vanish in the derivative).");
    break; }
    case 8: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "p kPa, V litre alınırsa W = ∫p dV doğrudan joule verir (kPa·L = J). Adyabatik hal değişiminde pV^γ = K sabittir, p = K·V^(−γ). Genleşmede (dV > 0) gaz iş yapar (W > 0), sıkıştırmada gaz üzerinde iş yapılır (W < 0). Sabit hacimli (izokorik) süreçlerde dV = 0 olduğundan iş sıfırdır. p–V çevriminin net işi, çevrimin çevrelediği ALANDIR. Isıl verim η = W_net/Q_giriş = 1 − r^(1−γ)." + "\n" + "YÖNTEM" + "\n" + "1. Dört hâlin (p, V) değerlerini yaz. 2. Her adyabat için K = pV^γ bul. 3. W = K·[V^(1−γ)/(1−γ)] ile her adyabatın işini hesapla. 4. İzokorik işler sıfır; net iş = W₁₂ + W₃₄. 5. η = 1 − r^(1−γ) ile kontrol et." + "\n" + "TUZAK: Üs 1−γ = −0,4 NEGATİFTİR; V₁ ve V₂'nin sırasını (alt/üst sınır) karıştırmayın. Verim yalnız r'ye bağlıdır, ρ'ya (ısı eklemeye) bağlı değildir.", "UNITS AND PHYSICAL MEANING" + "\n" + "With p in kPa and V in litres, W = ∫p dV comes out directly in joules (kPa·L = J). In an adiabatic change pV^γ = K is constant, p = K·V^(−γ). In expansion (dV > 0) the gas does work (W > 0), in compression work is done on the gas (W < 0). In constant-volume (isochoric) processes dV = 0, so the work is zero. The net work of a p–V cycle is the AREA enclosed by the cycle. Thermal efficiency η = W_net/Q_in = 1 − r^(1−γ)." + "\n" + "METHOD" + "\n" + "1. Write (p, V) of the four states. 2. Find K = pV^γ for each adiabat. 3. Evaluate W = K·[V^(1−γ)/(1−γ)] for each adiabat. 4. Isochoric works are zero; net work = W₁₂ + W₃₄. 5. Check with η = 1 − r^(1−γ)." + "\n" + "PITFALL: the exponent 1−γ = −0.4 is NEGATIVE; do not swap the order of V₁ and V₂ (lower/upper limit). The efficiency depends only on r, not on ρ (the heat added).");
    break; }
    case 9: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "μ dinamik viskozite (Pa·s; 1 mPa·s = 10⁻³ Pa·s), −dp/dx basınç gradyanı (Pa/m), u hız (m/s), τ kayma gerilmesi (Pa), Q debi (m³/s; 1 m³/s = 10⁶ mL/s). Newton akışkanında τ = −μ·du/dr; duvarda hız sıfır (yapışma koşulu), eksende en büyüktür. Kuvvet dengesi τ_w = (−dp/dx)·R/2 verir. Laminer profilde Q = π·(−dp/dx)·R⁴/(8μ) (Hagen–Poiseuille) ve ortalama hız u_max/2'dir." + "\n" + "YÖNTEM" + "\n" + "1. Birimleri SI'ya çevir (mPa·s → Pa·s, mm → m). 2. u(0) ile u_max. 3. du/dr türevini al, r = R'de değerlendir; τ_w = −μ·du/dr. 4. Q = 2π∫₀ᴿ u r dr. 5. Re < 2300 ile laminerliği kontrol et." + "\n" + "TUZAK: Q ∝ R⁴ — yarıçap iki katına çıkınca debi 16 katına çıkar; R'yi mm bırakırsanız sonuç 10¹² kat yanlış çıkar. Eksi işaret: du/dr < 0 ama τ_w büyüklüğü pozitiftir.", "UNITS AND PHYSICAL MEANING" + "\n" + "μ dynamic viscosity (Pa·s; 1 mPa·s = 10⁻³ Pa·s), −dp/dx pressure gradient (Pa/m), u velocity (m/s), τ shear stress (Pa), Q flow rate (m³/s; 1 m³/s = 10⁶ mL/s). For a Newtonian fluid τ = −μ·du/dr; the velocity is zero at the wall (no-slip) and largest on the axis. A force balance gives τ_w = (−dp/dx)·R/2. In the laminar profile Q = π·(−dp/dx)·R⁴/(8μ) (Hagen–Poiseuille) and the mean speed is u_max/2." + "\n" + "METHOD" + "\n" + "1. Convert to SI (mPa·s → Pa·s, mm → m). 2. u(0) gives u_max. 3. Differentiate du/dr, evaluate at r = R; τ_w = −μ·du/dr. 4. Q = 2π∫₀ᴿ u r dr. 5. Check laminarity with Re < 2300." + "\n" + "PITFALL: Q ∝ R⁴ — doubling the radius multiplies the flow by 16; leaving R in mm makes the result wrong by a factor of 10¹². Sign: du/dr < 0 but the magnitude of τ_w is positive.");
    break; }
    case 10: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "Q′ boy başına ısı akışı (W/m), k (W/m·K), r yarıçap (m), T (°C). Silindirde ısı geçen alan 2πr·L büyür, bu yüzden akı q = Q′/(2πr) dışa doğru AZALIR ama Q′ sabittir. Düz duvardaki doğrusal profilin yerine logaritmik profil elde edilir: T(r) = Tᵢ − (Tᵢ − T_o)·ln(r/rᵢ)/ln(r_o/rᵢ). Isıl direnç R′ = ln(r_o/rᵢ)/(2πk) (m·K/W)." + "\n" + "YÖNTEM" + "\n" + "1. Q′ = −k·2πr·dT/dr yaz. 2. Değişkenleri ayır: dT = −(Q′/2πk)·dr/r. 3. rᵢ'den r_o'ya integre et: ∫dr/r = ln. 4. Sınır koşullarıyla Q′'yü çöz. 5. T(r)'yi yaz ve geometrik ortalama yarıçapta (T = ortalama) kontrol et." + "\n" + "TUZAK: ln içinde r_o/rᵢ ORANI vardır (cm ya da m fark etmez, ama tutarlı olmalı); dT/dr için yarıçap metreye çevrilmelidir. Düz duvar formülü yalnızca ince cidarlarda yaklaşık doğrudur.", "UNITS AND PHYSICAL MEANING" + "\n" + "Q′ heat flow per unit length (W/m), k (W/m·K), r radius (m), T (°C). In a cylinder the area 2πr·L through which heat passes grows outward, so the flux q = Q′/(2πr) DECREASES outward while Q′ stays constant. Instead of the linear profile of a flat wall you get a logarithmic one: T(r) = Tᵢ − (Tᵢ − T_o)·ln(r/rᵢ)/ln(r_o/rᵢ). Thermal resistance R′ = ln(r_o/rᵢ)/(2πk) (m·K/W)." + "\n" + "METHOD" + "\n" + "1. Write Q′ = −k·2πr·dT/dr. 2. Separate variables: dT = −(Q′/2πk)·dr/r. 3. Integrate from rᵢ to r_o: ∫dr/r = ln. 4. Solve Q′ from the boundary conditions. 5. Write T(r) and check at the geometric-mean radius (T = average)." + "\n" + "PITFALL: the ln contains the RATIO r_o/rᵢ (cm or m does not matter, but be consistent); for dT/dr convert the radius to metres. The flat-wall formula is only an approximation for thin walls.");
    break; }
    case 11: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "k(T) = k₀(1 + βT): k₀ (W/m·K), β (1/K), T (°C). Isı akısı q (W/m²) kararlı halde her kesitte aynıdır, ama dT/dx değişir: iletkenliğin büyük olduğu sıcak tarafta eğim yatay, soğuk tarafta dik olur. Ortalama iletkenlik k_m = k₀[1 + β(Tₕ + T_c)/2] ile q = k_m·ΔT/L." + "\n" + "YÖNTEM" + "\n" + "1. q = −k(T)·dT/dx sabit; q dx = −k₀(1 + βT) dT. 2. Soldan sağa integre et: qL = k₀∫_{T_c}^{Tₕ}(1 + βT) dT. 3. İlkel: T + βT²/2. 4. q'yu çöz. 5. Ortada T'yi bulmak için aynı integrali 0'dan L/2'ye yaz ve ikinci derece denklemi çöz." + "\n" + "TUZAK: Sabit k₀ ile hesap q'yu olduğundan az bulur; kök seçiminde fiziksel kök (T_c ile Tₕ arasındaki) alınır.", "UNITS AND PHYSICAL MEANING" + "\n" + "k(T) = k₀(1 + βT): k₀ (W/m·K), β (1/K), T (°C). In steady state the heat flux q (W/m²) is the same at every section, but dT/dx varies: on the hot side where conductivity is high the slope is gentle, on the cold side it is steep. With the mean conductivity k_m = k₀[1 + β(Tₕ + T_c)/2] we get q = k_m·ΔT/L." + "\n" + "METHOD" + "\n" + "1. q = −k(T)·dT/dx is constant; q dx = −k₀(1 + βT) dT. 2. Integrate across the wall: qL = k₀∫_{T_c}^{Tₕ}(1 + βT) dT. 3. Antiderivative: T + βT²/2. 4. Solve for q. 5. For the mid-wall temperature write the same integral from 0 to L/2 and solve the quadratic." + "\n" + "PITFALL: using the constant k₀ underestimates q; choose the physical root (between T_c and Tₕ) of the quadratic.");
    break; }
    case 12: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "m (kg), c (J/kg·K), hA (W/K), τ = m·c/(hA) (s), T (°C). Toplu kapasite modelinde blok içinde sıcaklık farkı ihmal edilir (küçük Biot sayısı). Güç P = hA(T − T∞) (W); atılan ısı bu gücün zamana göre integralidir ve aynı zamanda iç enerji kaybıdır: Q = m·c·(Tᵢ − T). t = τ'da fark başlangıcın %36,8'ine düşer." + "\n" + "YÖNTEM" + "\n" + "1. τ = mc/hA (s). 2. T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ). 3. dT/dt = −(T − T∞)/τ. 4. Q = ∫₀ᵗ hA(T − T∞) dt = hA(Tᵢ − T∞)·τ·(1 − e^(−t/τ)). 5. Q = mc(Tᵢ − T) ile doğrula." + "\n" + "TUZAK: τ saniye, t dakika — birimleri eşleyin (1 dk = 60 s). Q joule çıkar; kJ için 1000'e bölün.", "UNITS AND PHYSICAL MEANING" + "\n" + "m (kg), c (J/kg·K), hA (W/K), τ = m·c/(hA) (s), T (°C). In the lumped-capacitance model the temperature differences inside the block are neglected (small Biot number). The power is P = hA(T − T∞) (W); the heat removed is the time integral of this power and equals the loss of internal energy: Q = m·c·(Tᵢ − T). At t = τ the difference has fallen to 36.8 % of its initial value." + "\n" + "METHOD" + "\n" + "1. τ = mc/hA (s). 2. T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ). 3. dT/dt = −(T − T∞)/τ. 4. Q = ∫₀ᵗ hA(T − T∞) dt = hA(Tᵢ − T∞)·τ·(1 − e^(−t/τ)). 5. Verify with Q = mc(Tᵢ − T)." + "\n" + "PITFALL: τ is in seconds but t in minutes — match the units (1 min = 60 s). Q comes out in joules; divide by 1000 for kJ.");
    break; }
    case 13: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "P güç (kW), t zaman (h), enerji E = ∫P dt (kWh; 1 kWh = 3600 kJ). Gücün zamana göre integrali enerjidir; eğri altındaki alan toplanan ısıdır. Yarım sinüs dalgasının alanı 2·P_max·T/π'dir, yani P_max·T dikdörtgeninin %63,7'si. Ortalama güç E/T = 2P_max/π. Suyun ısınması ΔT = E/(m·c) (E kJ, c = 4,18 kJ/kg·K)." + "\n" + "YÖNTEM" + "\n" + "1. E = P_max∫₀ᵀ sin(πt/T) dt. 2. İlkel: −(T/π)cos(πt/T). 3. Sınırlarda [−cos]₀ᵀ = 2. 4. E = 2P_maxT/π. 5. dP/dt = 0 ⇒ t = T/2 ve ΔT = 3600E/(m·4,18)." + "\n" + "TUZAK: Argüman radyan cinsindendir (πt/T); kWh ile kJ'ü karıştırmayın (×3600).", "UNITS AND PHYSICAL MEANING" + "\n" + "P power (kW), t time (h), energy E = ∫P dt (kWh; 1 kWh = 3600 kJ). The time integral of power is energy; the area under the curve is the collected heat. A half sine wave has area 2·P_max·T/π, i.e. 63.7 % of the P_max·T rectangle. The mean power is E/T = 2P_max/π. Water heats by ΔT = E/(m·c) (E in kJ, c = 4.18 kJ/kg·K)." + "\n" + "METHOD" + "\n" + "1. E = P_max∫₀ᵀ sin(πt/T) dt. 2. Antiderivative: −(T/π)cos(πt/T). 3. At the limits [−cos]₀ᵀ = 2. 4. E = 2P_maxT/π. 5. dP/dt = 0 ⇒ t = T/2 and ΔT = 3600E/(m·4.18)." + "\n" + "PITFALL: the argument is in radians (πt/T); do not mix kWh and kJ (×3600).");
    break; }
    case 14: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "D çap (cm), C(D) yıllık toplam maliyet (TL/yıl). Boru maliyeti a·D çapla artar; sürtünmeli akışta pompa gücü yaklaşık 1/D⁵ ile orantılıdır (B/D⁵), çap büyüdükçe çok hızlı düşer. Toplam maliyetin minimumunda iki marjinal etki dengelenir: a = 5B/D⁶." + "\n" + "YÖNTEM" + "\n" + "1. C(D) = aD + B·D⁻⁵. 2. C′(D) = a − 5B·D⁻⁶ = 0. 3. D⁶ = 5B/a ⇒ D* = (5B/a)^(1/6). 4. C″(D) = 30B·D⁻⁷ > 0 ⇒ minimum. 5. C(D*) = 6aD*/5 (pompa maliyeti = boru maliyetinin 1/5'i)." + "\n" + "TUZAK: Altıncı kök alınır (karekök değil); B = b·10⁶ çarpanını unutmayın. Gerçekte standart çaplar vardır: en yakın standart çapları karşılaştırın.", "UNITS AND PHYSICAL MEANING" + "\n" + "D diameter (cm), C(D) yearly total cost (TL/yr). The pipe cost a·D grows with diameter; in friction-dominated flow the pump power is roughly proportional to 1/D⁵ (B/D⁵), which falls very quickly as D grows. At the minimum of the total cost the two marginal effects balance: a = 5B/D⁶." + "\n" + "METHOD" + "\n" + "1. C(D) = aD + B·D⁻⁵. 2. C′(D) = a − 5B·D⁻⁶ = 0. 3. D⁶ = 5B/a ⇒ D* = (5B/a)^(1/6). 4. C″(D) = 30B·D⁻⁷ > 0 ⇒ minimum. 5. C(D*) = 6aD*/5 (pumping cost = 1/5 of the pipe cost)." + "\n" + "PITFALL: take the sixth root (not the square root) and do not forget B = b·10⁶. Real pipes come in standard sizes: compare the nearest standard diameters.");
    break; }
    case 15: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "p = ρ g h gösterge basıncı (kPa; ρg = 9,81 kN/m³), h = s·sinθ düşey derinlik, s kapak boyunca ölçülen uzaklık (m). Birim uzunluk başına yük q(s) = p·w (kN/m); toplam kuvvet bu yükün integralidir F = ∫q ds (kN), eğri altındaki alandır. Etki (basınç) merkezi, momentlerden s_cp = ∫s·q ds / F bulunur ve ağırlık merkezinden DAHA AŞAĞIDADIR (derinlik arttıkça basınç artar)." + "\n" + "YÖNTEM" + "\n" + "1. h = s·sinθ ⇒ q(s) = ρg·w·sinθ·s. 2. F = ρg·w·sinθ·[s²/2] s₁'den s₂'ye. 3. M = ρg·w·sinθ·[s³/3]. 4. s_cp = M/F = (2/3)(s₂³ − s₁³)/(s₂² − s₁²). 5. Kontrol: F = ρg·h_c·A (h_c: ağırlık merkezi derinliği)." + "\n" + "TUZAK: s eğik uzaklıktır, derinlik s·sinθ'dır; s yerine h kullanılırsa integralin sınırları ve dönüşümü değişir. Atmosfer basıncı iki yüzde de etki ettiği için gösterge basıncı kullanılır.", "UNITS AND PHYSICAL MEANING" + "\n" + "p = ρ g h is the gauge pressure (kPa; ρg = 9.81 kN/m³), h = s·sinθ the vertical depth and s the distance measured along the gate (m). The load per unit length is q(s) = p·w (kN/m); the total force is the integral of this load, F = ∫q ds (kN), the area under the curve. The centre of pressure follows from moments, s_cp = ∫s·q ds / F, and lies BELOW the centroid (pressure grows with depth)." + "\n" + "METHOD" + "\n" + "1. h = s·sinθ ⇒ q(s) = ρg·w·sinθ·s. 2. F = ρg·w·sinθ·[s²/2] from s₁ to s₂. 3. M = ρg·w·sinθ·[s³/3]. 4. s_cp = M/F = (2/3)(s₂³ − s₁³)/(s₂² − s₁²). 5. Check: F = ρg·h_c·A (h_c: depth of the centroid)." + "\n" + "PITFALL: s is the slant distance, the depth is s·sinθ; using h instead of s changes the limits and the conversion of the integral. Atmospheric pressure acts on both faces, so gauge pressure is used.");
    break; }
    default: {
    return "";
    break; }
    }
  }


  function MeaningBase(p) {
    switch (p.scn) {
    case 0: {
    return tx("Sıcaklık zamanın bir FONKSİYONUDUR: T(t). 'Belirli bir andaki sıcaklık' fonksiyonun DEĞERİ, 'ne hızla soğuyor' ise fonksiyonun TÜREVİDİR (dT/dt, teğetin eğimi). " + "Üstel fonksiyonun türevi kendisiyle orantılıdır; bu yüzden soğuma hızı, parça ile ortam arasındaki sıcaklık farkıyla orantılı çıkar. " + "Matematiksel istek: T(t)'yi hesapla, zincir kuralıyla dT/dt'yi bul ve aynı t'de değerlendir.", "Temperature is a FUNCTION of time: T(t). 'The temperature at a given moment' is the function VALUE, 'how fast it cools' is the DERIVATIVE (dT/dt, the slope of the tangent). " + "The derivative of an exponential is proportional to itself, so the cooling rate turns out proportional to the temperature difference between part and surroundings. " + "Mathematical task: evaluate T(t), find dT/dt with the chain rule and evaluate it at the same t.");
    break; }
    case 1: {
    return tx("Burada zaman değil, SICAKLIK verilir; zamanı isteriz. Yani T(t) = T* denklemini t için ÇÖZERİZ. Bilinmeyen üstelin içinde olduğundan bunu logaritma ile açarız: ln(e^u) = u. " + "Bu, üstel fonksiyonun TERS fonksiyonunu (doğal logaritma) kullanmaktır. " + "Matematiksel istek: 20 + (T₀ − 20)e^(−kt) = T* denkleminden e^(−kt)'yi yalnız bırak, iki tarafın ln'ini al ve t'yi çöz.", "Here the TEMPERATURE is given and we want the time, so we SOLVE T(t) = T* for t. Because the unknown sits in the exponent we free it with a logarithm: ln(e^u) = u. " + "This uses the INVERSE function of the exponential (the natural logarithm). " + "Mathematical task: isolate e^(−kt) in 20 + (T₀ − 20)e^(−kt) = T*, take ln of both sides and solve for t.");
    break; }
    case 2: {
    return tx("Kararlı iletimde sıcaklık yalnızca konuma bağlıdır: T(x). Isı akısı, sıcaklığın konuma göre DEĞİŞİM HIZINA (türev, eğim) orantılıdır: q = −k·dT/dx. Eksi işaret, ısının sıcaktan soğuğa aktığını söyler. " + "Kararlı halde akı her kesitte aynı olmak zorundadır, bu yüzden T(x) düz bir doğrudur ve eğimi sabittir. " + "Matematiksel istek: iki uç değerden doğrunun denklemini yaz, eğimini (dT/dx) bul ve k ile çarp.", "In steady conduction temperature depends on position only: T(x). The heat flux is proportional to the RATE OF CHANGE of temperature with position (the derivative, the slope): q = −k·dT/dx. The minus sign says heat flows from hot to cold. " + "In steady state the flux must be the same at every cross-section, so T(x) is a straight line with a constant slope. " + "Mathematical task: write the line through the two end values, find its slope (dT/dx) and multiply by k.");
    break; }
    case 3: {
    return tx("Özgül ısı sabit olsaydı Q = m·c·ΔT çarpma işlemi yeterdi. Ama c sıcaklıkla DEĞİŞİYOR; her küçük dT aralığında ısı m·c(T)·dT'dir ve bunların TOPLAMI gerekir. " + "Sonsuz küçük parçaların toplamı BELİRLİ İNTEGRALDİR: Q = ∫ m·c(T) dT, 20 °C'den T₂'ye. Grafikte c(T) eğrisinin altında kalan ALAN ısıyı (m ile çarpılmış) verir. " + "Matematiksel istek: c(T)'nin ilkelini bul ve belirli integrali uç değerlerle hesapla.", "If the specific heat were constant, the product Q = m·c·ΔT would do. But c CHANGES with temperature; in each small step dT the heat is m·c(T)·dT and we need the SUM of all of them. " + "The sum of infinitely small pieces is a DEFINITE INTEGRAL: Q = ∫ m·c(T) dT from 20 °C to T₂. On the graph the AREA under the c(T) curve gives the heat (times m). " + "Mathematical task: find an antiderivative of c(T) and evaluate the definite integral between the limits.");
    break; }
    case 4: {
    return tx("Su hacmi V = A·h'dir ve hem V hem h zamanla değişir; tank sabit kesitli olduğundan dV/dt = A·dh/dt olur. Çıkış debisi de yüksekliğe bağlıdır (√h). Bu bir İLİŞKİLİ DEĞİŞİM sorusudur: iki değişim hızı bir denklemle bağlanır. " + "Hacim korunumu: A·dh/dt = −a·√(2gh) ⇒ dh/dt h'ye bağlı bir DİFERANSİYEL denklemdir; ayrıştırılıp integre edilerek boşalma süresi bulunur. " + "Matematiksel istek: önce dh/dt'yi bu anda hesapla, sonra h(t)'yi bulup h = 0 olduğu anı çöz.", "The water volume is V = A·h and both V and h change with time; since the tank has constant cross-section, dV/dt = A·dh/dt. The outflow also depends on the height (√h). This is a RELATED-RATES question: two rates are tied by one equation. " + "Conservation of volume: A·dh/dt = −a·√(2gh), so dh/dt depends on h itself, a DIFFERENTIAL equation; separating variables and integrating gives the draining time. " + "Mathematical task: first evaluate dh/dt at this moment, then find h(t) and solve for the time when h = 0.");
    break; }
    case 5: {
    return tx("Borunun her yarıçapında hız farklıdır, bu yüzden 'hız × alan' tek bir çarpma değildir. Borunun kesitini r yarıçaplı, dr kalınlıklı ince HALKALARA böleriz: halkanın alanı ≈ 2πr·dr, içinden geçen debi v(r)·2πr·dr. " + "Tüm halkaların toplamı bir BELİRLİ İNTEGRALDİR: Q = ∫₀ᴿ v(r)·2πr dr. Grafikte integrali alınan fonksiyonun (v·2πr) eğrisi altındaki ALAN debidir. " + "Matematiksel istek: integrandı polinom olarak aç, terim terim integre et ve r = 0'dan R'ye hesapla.", "The speed differs at every radius, so 'speed × area' is not a single multiplication. We slice the cross-section into thin RINGS of radius r and thickness dr: the ring's area is ≈ 2πr·dr and the flow through it is v(r)·2πr·dr. " + "The sum over all rings is a DEFINITE INTEGRAL: Q = ∫₀ᴿ v(r)·2πr dr. On the graph the AREA under the integrand (v·2πr) is the flow rate. " + "Mathematical task: expand the integrand as a polynomial, integrate term by term and evaluate from r = 0 to R.");
    break; }
    case 6: {
    return tx("İzotermalde PV = nRT sabittir: P, V'nin FONKSİYONU olan P = nRT/V'dir ve zamanla V değiştikçe P de değişir. (a) kısmı İLİŞKİLİ DEĞİŞİM'dir: PV = sabit ifadesinin t'ye göre türevi (çarpım kuralı) dP/dt ile dV/dt'yi bağlar. " + "(b) kısmında iş, basıncın hacme göre integralidir: W = ∫P dV, yani P–V eğrisinin altındaki ALAN. 1/V'nin ilkeli ln V olduğundan sonuç bir logaritmadır. " + "Matematiksel istek: (a) PV = nRT'yi türet ve dP/dt'yi çöz; (b) ∫ nRT/V dV integralini V₁'den V₂'ye hesapla.", "In an isothermal process PV = nRT is constant: P = nRT/V is a FUNCTION of V, and as V changes with time P changes too. Part (a) is a RELATED-RATES task: differentiating PV = constant in t (product rule) ties dP/dt to dV/dt. " + "In part (b) work is the integral of pressure over volume, W = ∫P dV, i.e. the AREA under the P–V curve. Since the antiderivative of 1/V is ln V, the result is a logarithm. " + "Mathematical task: (a) differentiate PV = nRT and solve for dP/dt; (b) evaluate ∫ nRT/V dV from V₁ to V₂.");
    break; }
    case 7: {
    return tx("Kalınlık artınca yalıtım maliyeti YÜKSELİR ama ısı kaybı maliyeti DÜŞER; toplam maliyet bu iki eğrinin toplamıdır ve bir yerde en küçük olur. 'En ucuz kalınlık' bu toplam fonksiyonun MİNİMUMUDUR. " + "Türevlenebilir bir fonksiyonun minimumunda teğet yataydır: C'(x) = 0. Ardından ikinci türevle bunun gerçekten minimum olduğu doğrulanır. " + "Matematiksel istek: C'(x) = 0'ı çöz, C''(x) > 0 ile doğrula ve C'yi o noktada hesapla.", "As the thickness grows, the insulation cost RISES but the heat-loss cost FALLS; the total is the sum of the two curves and has a smallest value somewhere. 'The cheapest thickness' is the MINIMUM of this total function. " + "At the minimum of a differentiable function the tangent is horizontal: C'(x) = 0. The second derivative then confirms that it really is a minimum. " + "Mathematical task: solve C'(x) = 0, verify with C''(x) > 0 and evaluate C at that point.");
    break; }
    case 8: {
    return tx("Çevrim p–V düzleminde kapalı bir eğridir. Sabit hacimli kollarda dV = 0 olduğundan iş yalnızca iki adyabat boyunca birikir: W = ∫p dV her adyabatın eğrisi altındaki ALANDIR. Genleşme eğrisi sıkıştırma eğrisinin üstündedir, bu yüzden aradaki fark (çevrimin iç alanı) net iştir. " + "Adyabatta p = K·V^(−γ) bir kuvvet fonksiyonudur; V^(−γ)'nın ilkeli V^(1−γ)/(1−γ)'dır. " + "Matematiksel istek: her adyabat için K'yı bul, belirli integrali V₁ ve V₂ sınırlarıyla hesapla, iki işi topla.", "The cycle is a closed curve on the p–V plane. On the constant-volume legs dV = 0, so work accumulates only along the two adiabats: W = ∫p dV is the AREA under each adiabat. The expansion curve lies above the compression curve, so the difference (the enclosed area of the cycle) is the net work. " + "On an adiabat p = K·V^(−γ) is a power function; the antiderivative of V^(−γ) is V^(1−γ)/(1−γ). " + "Mathematical task: find K for each adiabat, evaluate the definite integral between V₁ and V₂ and add the two works.");
    break; }
    case 9: {
    return tx("Hız r'nin fonksiyonudur: u(r). 'Duvardaki kayma' hızın r'ye göre DEĞİŞİM HIZINA (türev, profilin eğimi) bağlıdır: τ = −μ·du/dr. 'Ne kadar akıyor' ise halka şeritlerin toplamıdır: Q = ∫u(r)·2πr dr (belirli integral). " + "Matematiksel istek: u(0)'ı hesapla, u'yu r'ye göre türetip r = R'de değerlendir, sonra u(r)·r polinomunu 0'dan R'ye integre et.", "The velocity is a function of r: u(r). 'The shear at the wall' depends on the RATE OF CHANGE of velocity with r (the derivative, the slope of the profile): τ = −μ·du/dr. 'How much flows' is the sum over ring strips: Q = ∫u(r)·2πr dr (a definite integral). " + "Mathematical task: evaluate u(0), differentiate u with respect to r and evaluate at r = R, then integrate the polynomial u(r)·r from 0 to R.");
    break; }
    case 10: {
    return tx("Isı akışı Q′ sabittir ama ısının geçtiği halka alanı 2πr ile BÜYÜR; bu yüzden dT/dr = −Q′/(2πk·r) konumla değişir. Bu, değişkenleri ayrılabilen bir DİFERANSİYEL denklemdir: dT = −C·dr/r. 1/r'nin ilkeli ln r olduğundan sıcaklık profili LOGARİTMİKTİR. " + "Matematiksel istek: dr/r'yi rᵢ'den r_o'ya integre et (ln r_o − ln rᵢ = ln(r_o/rᵢ)) ve iki sınır koşuluyla Q′'yü çöz.", "The heat flow Q′ is constant but the ring area through which it passes GROWS as 2πr, so dT/dr = −Q′/(2πk·r) changes with position. This is a DIFFERENTIAL equation with separable variables: dT = −C·dr/r. Because the antiderivative of 1/r is ln r, the temperature profile is LOGARITHMIC. " + "Mathematical task: integrate dr/r from rᵢ to r_o (ln r_o − ln rᵢ = ln(r_o/rᵢ)) and solve for Q′ using the two boundary conditions.");
    break; }
    case 11: {
    return tx("İletkenlik sıcaklığa, sıcaklık da konuma bağlıdır; ama akı q sabittir. q = −k(T)·dT/dx denklemini x ve T için AYIRIRIZ: q dx = −k₀(1 + βT) dT; sol tarafı x'e, sağ tarafı T'ye göre integre ederiz. Sağ tarafın ilkeli T + βT²/2'dir; sıcaklık farkı yerine iki sıcaklığın karelerinin farkı çıkar. " + "Matematiksel istek: değişkenleri ayır, belirli integrali Tₕ'den T_c'ye hesapla, q'yu çöz; ortadaki sıcaklık için üst sınırı bilinmeyen T yapıp ikinci derece denklemi çöz.", "Conductivity depends on temperature and temperature on position, yet the flux q is constant. We SEPARATE the equation q = −k(T)·dT/dx into x and T: q dx = −k₀(1 + βT) dT and integrate the left side in x and the right side in T. The antiderivative of the right side is T + βT²/2, so a difference of squares of the two temperatures appears. " + "Mathematical task: separate the variables, evaluate the definite integral from Tₕ to T_c and solve for q; for the mid-wall temperature make the upper limit the unknown T and solve the quadratic.");
    break; }
    case 12: {
    return tx("T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ) üstel bir fonksiyondur; 'şu anki sıcaklık' fonksiyonun değeri, 'ne hızla soğuyor' türevidir. 'Toplam atılan ısı' ise güç hA(T − T∞)'ın zamana göre belirli integralidir; üstelin integrali yine üsteldir: ∫e^(−t/τ)dt = −τe^(−t/τ). " + "Matematiksel istek: τ'yu bul, T ve dT/dt'yi hesapla, sonra gücü 0'dan t'ye integre et ve m·c·ΔT ile karşılaştır.", "T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ) is an exponential function; 'the temperature now' is the function value, 'how fast it cools' is the derivative. 'The total heat removed' is the definite time integral of the power hA(T − T∞); the integral of an exponential is again an exponential: ∫e^(−t/τ)dt = −τe^(−t/τ). " + "Mathematical task: find τ, evaluate T and dT/dt, then integrate the power from 0 to t and compare with m·c·ΔT.");
    break; }
    case 13: {
    return tx("Güç zamanla değişir, bu yüzden 'güç × süre' tek bir çarpma değildir. Küçük bir dt aralığında enerji P(t)·dt'dir; tümünün toplamı BELİRLİ İNTEGRALDİR: E = ∫₀ᵀ P(t) dt, grafikte eğri altındaki ALAN. En büyük gücün anı türevin sıfır olduğu noktadır: dP/dt = 0. " + "Matematiksel istek: sin(πt/T)'nin ilkelini (zincir kuralını tersine uygulayarak) bul, 0'dan T'ye hesapla; dP/dt = 0'ı çöz; enerjiyi sıcaklık artışına çevir.", "Power changes with time, so 'power × duration' is not a single multiplication. In a small interval dt the energy is P(t)·dt; the sum of all of them is a DEFINITE INTEGRAL: E = ∫₀ᵀ P(t) dt, the AREA under the curve on the graph. The moment of greatest power is where the derivative is zero: dP/dt = 0. " + "Mathematical task: find the antiderivative of sin(πt/T) (reversing the chain rule), evaluate from 0 to T; solve dP/dt = 0; convert the energy into a temperature rise.");
    break; }
    case 14: {
    return tx("Çap arttıkça boru maliyeti YÜKSELİR ama pompalama maliyeti 1/D⁵ ile hızla DÜŞER; toplamları bir noktada en küçüktür. 'En ekonomik çap' toplam maliyet fonksiyonunun MİNİMUMUDUR: teğet yataydır, C′(D) = 0. İkinci türev pozitifse nokta gerçekten minimumdur. " + "Matematiksel istek: negatif üslü terimi (D⁻⁵) türet, C′(D) = 0'dan D⁶'yı çöz, altıncı kök al ve C″ > 0 ile doğrula.", "As the diameter grows the pipe cost RISES but the pumping cost FALLS quickly as 1/D⁵; their sum is smallest somewhere. 'The most economical diameter' is the MINIMUM of the total cost function: the tangent is horizontal, C′(D) = 0. If the second derivative is positive the point really is a minimum. " + "Mathematical task: differentiate the negative-power term (D⁻⁵), solve C′(D) = 0 for D⁶, take the sixth root and verify with C″ > 0.");
    break; }
    default: {
    return tx("Basınç derinlikle, dolayısıyla kapak boyunca s ile DOĞRUSAL artar; yani kapağa binen yük düzgün değil, üçgen/yamuk biçimlidir. Kuvvet yükün toplamıdır: F = ∫p·w ds (belirli integral, yük diyagramının alanı). Etki noktası, yük diyagramının ağırlık merkezidir ve moment integralinden gelir: s_cp = ∫s·p·w ds / F. " + "Matematiksel istek: p(s) = ρg·s·sinθ'yı w ile çarpıp s₁'den s₂'ye integre et (F), s ile çarpıp tekrar integre et (M) ve s_cp = M/F'yi hesapla.", "The pressure grows LINEARLY with depth, hence with s along the gate; the load on the gate is therefore not uniform but triangular or trapezoidal. The force is the sum of the load: F = ∫p·w ds (a definite integral, the area of the load diagram). The point of action is the centroid of the load diagram and comes from the moment integral: s_cp = ∫s·p·w ds / F. " + "Mathematical task: multiply p(s) = ρg·s·sinθ by w and integrate from s₁ to s₂ (F), multiply by s and integrate again (M) and compute s_cp = M/F.");
    break; }
    }
  }


  function Steps(problem) {
    let x = problem.p;
    let s = [];
    switch (problem.scn) {
    case 0: {
    let ta = x[0], t0 = x[1], k = x[2], t = x[3];
    let d = t0 - ta, e = Math.exp(-k * t), tt = ta + d * e, rate = -k * d * e;
    s.push(tx(`1. Nicelikler: T(t) = parça sıcaklığı (°C), Tₐ = ${N2(ta)} °C ortam, T₀ = ${N2(t0)} °C başlangıç, k = ${N2(k)} 1/dk (soğuma sabiti), t = ${N2(t)} dk.`, `1. Quantities: T(t) = part temperature (°C), Tₐ = ${N2(ta)} °C ambient, T₀ = ${N2(t0)} °C initial, k = ${N2(k)} 1/min (cooling constant), t = ${N2(t)} min.`));
    s.push(tx(`2. Model: T(t) = Tₐ + (T₀ − Tₐ)e^(−kt) = ${N2(ta)} + ${N2(d)}·e^(−${N2(k)}t). Sıcaklık farkı ΔT₀ = T₀ − Tₐ = ${N2(t0)} − ${N2(ta)} = ${N2(d)} °C.`, `2. Model: T(t) = Tₐ + (T₀ − Tₐ)e^(−kt) = ${N2(ta)} + ${N2(d)}·e^(−${N2(k)}t). Initial difference ΔT₀ = T₀ − Tₐ = ${N2(t0)} − ${N2(ta)} = ${N2(d)} °C.`));
    s.push(tx(`3. Başlangıç kontrolü: T(0) = ${N2(ta)} + ${N2(d)}·e⁰ = ${N2(ta)} + ${N2(d)} = ${N2(t0)} °C ✓.`, `3. Initial check: T(0) = ${N2(ta)} + ${N2(d)}·e⁰ = ${N2(ta)} + ${N2(d)} = ${N2(t0)} °C ✓.`));
    s.push(tx(`4. Üstel terim: kt = ${N2(k)}·${N2(t)} = ${N2(k * t)} ⇒ e^(−${N2(k * t)}) = ${F3(e)}.`, `4. Exponential term: kt = ${N2(k)}·${N2(t)} = ${N2(k * t)} ⇒ e^(−${N2(k * t)}) = ${F3(e)}.`));
    s.push(tx(`5. Sıcaklık: T(${N2(t)}) = ${N2(ta)} + ${N2(d)}·${F3(e)} = ${N2(ta)} + ${N2(d * e)} = ${N2(tt)} °C.`, `5. Temperature: T(${N2(t)}) = ${N2(ta)} + ${N2(d)}·${F3(e)} = ${N2(ta)} + ${N2(d * e)} = ${N2(tt)} °C.`));
    s.push(tx(`6. Türev (zincir kuralı; sabit Tₐ'nın türevi 0): dT/dt = (T₀ − Tₐ)·(−k)·e^(−kt) = −k·(T − Tₐ).`, `6. Derivative (chain rule; the constant Tₐ has derivative 0): dT/dt = (T₀ − Tₐ)·(−k)·e^(−kt) = −k·(T − Tₐ).`));
    s.push(tx(`7. Değerlendir: dT/dt = −${N2(k)}·(${N2(tt)} − ${N2(ta)}) = −${N2(k)}·${N2(tt - ta)} = ${N2(rate)} °C/dk. Başlangıçta hız −${N2(k)}·${N2(d)} = ${N2(-k * d)} °C/dk idi.`, `7. Evaluate: dT/dt = −${N2(k)}·(${N2(tt)} − ${N2(ta)}) = −${N2(k)}·${N2(tt - ta)} = ${N2(rate)} °C/min. At the start the rate was −${N2(k)}·${N2(d)} = ${N2(-k * d)} °C/min.`));
    s.push(tx(`8. Birim kontrolü: k [1/dk] × ΔT [°C] = [°C/dk] ✓; kt boyutsuzdur ✓.`, `8. Unit check: k [1/min] × ΔT [°C] = [°C/min] ✓; kt is dimensionless ✓.`));
    s.push(tx(`9. Yorum: T, Tₐ = ${N2(ta)} °C'ye asimptotik yaklaşır ve hiç altına inmez; eğim (soğuma hızı) sıcaklık farkıyla birlikte küçülür. Yarı ömür ln 2/k = ${F3(Math.log(2) / k)} dk. Sarı nokta cevaptır, kesikli çizgi teğettir.`, `9. Interpretation: T approaches Tₐ = ${N2(ta)} °C asymptotically and never goes below it; the slope (cooling rate) shrinks with the temperature difference. Half-life ln 2/k = ${F3(Math.log(2) / k)} min. The gold point is the answer, the dashed line is the tangent.`));
    break; }
    case 1: {
    let t0 = x[0], tg = x[1], k = x[2];
    let ratio = (t0 - 20) / (tg - 20), lnr = Math.log(ratio), tm = lnr / k;
    s.push(tx(`1. Nicelikler: Tₐ = 20 °C, T₀ = ${N2(t0)} °C, hedef T* = ${N2(tg)} °C, k = ${N2(k)} 1/dk. Aranan: t (dk).`, `1. Quantities: Tₐ = 20 °C, T₀ = ${N2(t0)} °C, target T* = ${N2(tg)} °C, k = ${N2(k)} 1/min. Wanted: t (min).`));
    s.push(tx(`2. Denklem: 20 + ${N2(t0 - 20)}·e^(−${N2(k)}t) = ${N2(tg)}.`, `2. Equation: 20 + ${N2(t0 - 20)}·e^(−${N2(k)}t) = ${N2(tg)}.`));
    s.push(tx(`3. 20'yi karşıya at: ${N2(t0 - 20)}·e^(−${N2(k)}t) = ${N2(tg)} − 20 = ${N2(tg - 20)}.`, `3. Move 20 across: ${N2(t0 - 20)}·e^(−${N2(k)}t) = ${N2(tg)} − 20 = ${N2(tg - 20)}.`));
    s.push(tx(`4. Böl: e^(−${N2(k)}t) = ${N2(tg - 20)}/${N2(t0 - 20)} = ${F3((tg - 20) / (t0 - 20))}.`, `4. Divide: e^(−${N2(k)}t) = ${N2(tg - 20)}/${N2(t0 - 20)} = ${F3((tg - 20) / (t0 - 20))}.`));
    s.push(tx(`5. Doğal logaritma al: −${N2(k)}t = ln(${F3((tg - 20) / (t0 - 20))}) = −ln(${F3(ratio)}).`, `5. Take the natural log: −${N2(k)}t = ln(${F3((tg - 20) / (t0 - 20))}) = −ln(${F3(ratio)}).`));
    s.push(tx(`6. Çöz: t = ln(${F3(ratio)}) / ${N2(k)}.`, `6. Solve: t = ln(${F3(ratio)}) / ${N2(k)}.`));
    s.push(tx(`7. Sayı: ln(${F3(ratio)}) = ${F3(lnr)} ⇒ t = ${F3(lnr)}/${N2(k)} = ${N2(tm)} dk.`, `7. Number: ln(${F3(ratio)}) = ${F3(lnr)} ⇒ t = ${F3(lnr)}/${N2(k)} = ${N2(tm)} min.`));
    s.push(tx(`8. Doğrulama: T(${N2(tm)}) = 20 + ${N2(t0 - 20)}·e^(−${N2(k * tm)}) = 20 + ${N2(t0 - 20)}·${F3(Math.exp(-k * tm))} = ${N2(20 + (t0 - 20) * Math.exp(-k * tm))} °C ✓. Birim: ln boyutsuz, 1/k [dk] ✓.`, `8. Verify: T(${N2(tm)}) = 20 + ${N2(t0 - 20)}·e^(−${N2(k * tm)}) = 20 + ${N2(t0 - 20)}·${F3(Math.exp(-k * tm))} = ${N2(20 + (t0 - 20) * Math.exp(-k * tm))} °C ✓. Unit: ln is dimensionless, 1/k in min ✓.`));
    s.push(tx(`9. Yorum: oran (T₀ − Tₐ)/(T* − Tₐ) = ${F3(ratio)} > 1 olduğundan ln > 0 ve süre pozitiftir. T* ortama (${N2(20)} °C) ne kadar yakınsa süre o kadar uzar; T* = 20 °C için süre sonsuzdur (ln 0).`, `9. Interpretation: since the ratio (T₀ − Tₐ)/(T* − Tₐ) = ${F3(ratio)} > 1, ln > 0 and the time is positive. The closer T* is to ambient (${N2(20)} °C) the longer it takes; for T* = 20 °C the time is infinite (ln 0).`));
    break; }
    case 2: {
    let th = x[0], tc = x[1], l = x[2], k = x[3];
    let slope = (tc - th) / l, q = -k * slope;
    s.push(tx(`1. Nicelikler: x = duvar içindeki konum (m), 0 ≤ x ≤ L = ${N2(l)} m; T(0) = ${N2(th)} °C, T(L) = ${N2(tc)} °C; k = ${N2(k)} W/m·K.`, `1. Quantities: x = position in the wall (m), 0 ≤ x ≤ L = ${N2(l)} m; T(0) = ${N2(th)} °C, T(L) = ${N2(tc)} °C; k = ${N2(k)} W/m·K.`));
    s.push(tx(`2. Kararlı halde q her kesitte aynı ⇒ k·dT/dx = sabit ⇒ d²T/dx² = 0.`, `2. In steady state q is the same in every section ⇒ k·dT/dx = constant ⇒ d²T/dx² = 0.`));
    s.push(tx(`3. İki kez integre et: dT/dx = C₁ ⇒ T(x) = C₁x + C₂.`, `3. Integrate twice: dT/dx = C₁ ⇒ T(x) = C₁x + C₂.`));
    s.push(tx(`4. Sınır koşulları: T(0) = C₂ = ${N2(th)}; T(L) = C₁·${N2(l)} + ${N2(th)} = ${N2(tc)}.`, `4. Boundary conditions: T(0) = C₂ = ${N2(th)}; T(L) = C₁·${N2(l)} + ${N2(th)} = ${N2(tc)}.`));
    s.push(tx(`5. C₁ = (${N2(tc)} − ${N2(th)})/${N2(l)} = ${N2(tc - th)}/${N2(l)} = ${N2(slope)} °C/m ⇒ T(x) = ${N2(th)} − ${N2(-slope)}·x.`, `5. C₁ = (${N2(tc)} − ${N2(th)})/${N2(l)} = ${N2(tc - th)}/${N2(l)} = ${N2(slope)} °C/m ⇒ T(x) = ${N2(th)} − ${N2(-slope)}·x.`));
    s.push(tx(`6. Fourier yasası: q = −k·dT/dx = −${N2(k)}·(${N2(slope)}) = ${N2(q)} W/m².`, `6. Fourier's law: q = −k·dT/dx = −${N2(k)}·(${N2(slope)}) = ${N2(q)} W/m².`));
    s.push(tx(`7. Birim kontrolü: [W/m·K]·[°C/m] = [W/m²] ✓. Eşdeğer form: q = k(Tₕ − T_c)/L = ${N2(k)}·${N2(th - tc)}/${N2(l)} = ${N2(q)} W/m² ✓.`, `7. Unit check: [W/m·K]·[°C/m] = [W/m²] ✓. Equivalent form: q = k(Tₕ − T_c)/L = ${N2(k)}·${N2(th - tc)}/${N2(l)} = ${N2(q)} W/m² ✓.`));
    s.push(tx(`8. Ara nokta kontrolü: T(L/2) = ${N2(th)} − ${N2(-slope)}·${N2(l / 2)} = ${N2((th + tc) / 2)} °C = iki yüzün ortalaması ✓.`, `8. Midpoint check: T(L/2) = ${N2(th)} − ${N2(-slope)}·${N2(l / 2)} = ${N2((th + tc) / 2)} °C = average of the two faces ✓.`));
    s.push(tx(`9. Yorum: eğim negatiftir ⇒ ısı x arttıkça (sıcaktan soğuğa) akar; q > 0. Duvar kalınlaşırsa eğim ve akı azalır (q ∝ 1/L). Sarı nokta orta noktadır.`, `9. Interpretation: the slope is negative ⇒ heat flows in the +x direction (hot to cold); q > 0. A thicker wall lowers the slope and the flux (q ∝ 1/L). The gold point is the midpoint.`));
    break; }
    case 3: {
    let m = x[0], a = x[1], b = x[2] / 1000, t2 = x[3];
    let c1 = a + b * 20, c2 = a + b * t2;
    let area = a * (t2 - 20) + b / 2 * (t2 * t2 - 400), q = m * area;
    s.push(tx(`1. Nicelikler: m = ${N2(m)} kg, c(T) = ${N2(a)} + ${F3(b)}·T [kJ/kg·K], T₁ = 20 °C, T₂ = ${N2(t2)} °C. Aranan: Q [kJ].`, `1. Quantities: m = ${N2(m)} kg, c(T) = ${N2(a)} + ${F3(b)}·T [kJ/kg·K], T₁ = 20 °C, T₂ = ${N2(t2)} °C. Wanted: Q [kJ].`));
    s.push(tx(`2. Küçük dT aralığında ısı dQ = m·c(T)·dT; tümünü topla: Q = ∫ m·c(T) dT (20'den ${N2(t2)}'ye).`, `2. In a small step dT the heat is dQ = m·c(T)·dT; add them all: Q = ∫ m·c(T) dT (from 20 to ${N2(t2)}).`));
    s.push(tx(`3. m sabit, dışarı çıkar: Q = m ∫ (${N2(a)} + ${F3(b)}T) dT.`, `3. m is constant and comes out: Q = m ∫ (${N2(a)} + ${F3(b)}T) dT.`));
    s.push(tx(`4. İlkel (terim terim): ∫ (${N2(a)} + ${F3(b)}T) dT = ${N2(a)}T + ${F3(b / 2)}T².`, `4. Antiderivative (term by term): ∫ (${N2(a)} + ${F3(b)}T) dT = ${N2(a)}T + ${F3(b / 2)}T².`));
    s.push(tx(`5. Üst sınır T = ${N2(t2)}: ${N2(a)}·${N2(t2)} + ${F3(b / 2)}·${N2(t2 * t2)} = ${N2(a * t2)} + ${N2(b / 2 * t2 * t2)} = ${N2(a * t2 + b / 2 * t2 * t2)}.`, `5. Upper limit T = ${N2(t2)}: ${N2(a)}·${N2(t2)} + ${F3(b / 2)}·${N2(t2 * t2)} = ${N2(a * t2)} + ${N2(b / 2 * t2 * t2)} = ${N2(a * t2 + b / 2 * t2 * t2)}.`));
    s.push(tx(`6. Alt sınır T = 20: ${N2(a)}·20 + ${F3(b / 2)}·400 = ${N2(a * 20)} + ${N2(b / 2 * 400)} = ${N2(a * 20 + b / 2 * 400)}.`, `6. Lower limit T = 20: ${N2(a)}·20 + ${F3(b / 2)}·400 = ${N2(a * 20)} + ${N2(b / 2 * 400)} = ${N2(a * 20 + b / 2 * 400)}.`));
    s.push(tx(`7. Fark: ∫c dT = ${N2(a * t2 + b / 2 * t2 * t2)} − ${N2(a * 20 + b / 2 * 400)} = ${N2(area)} kJ/kg. Q = ${N2(m)}·${N2(area)} = ${N2(q)} kJ.`, `7. Difference: ∫c dT = ${N2(a * t2 + b / 2 * t2 * t2)} − ${N2(a * 20 + b / 2 * 400)} = ${N2(area)} kJ/kg. Q = ${N2(m)}·${N2(area)} = ${N2(q)} kJ.`));
    s.push(tx(`8. Birim kontrolü: kg·[kJ/kg·K]·K = kJ ✓. Kontrol: ortalama c = (c(20) + c(${N2(t2)}))/2 = (${N2(c1)} + ${N2(c2)})/2 = ${N2((c1 + c2) / 2)}; m·c̄·ΔT = ${N2(m)}·${N2((c1 + c2) / 2)}·${N2(t2 - 20)} = ${N2(q)} kJ ✓ (c doğrusal olduğundan tam eşit).`, `8. Unit check: kg·[kJ/kg·K]·K = kJ ✓. Cross-check: mean c = (c(20) + c(${N2(t2)}))/2 = (${N2(c1)} + ${N2(c2)})/2 = ${N2((c1 + c2) / 2)}; m·c̄·ΔT = ${N2(m)}·${N2((c1 + c2) / 2)}·${N2(t2 - 20)} = ${N2(q)} kJ ✓ (exact because c is linear).`));
    s.push(tx(`9. Yorum: c artan bir fonksiyon olduğundan c(20) = ${N2(c1)} ile hesap Q'yu olduğundan az gösterirdi (m·c(20)·ΔT = ${N2(m * c1 * (t2 - 20))} kJ). Grafikte gölgeli alan ısıyı (m = 1 için) gösterir.`, `9. Interpretation: because c increases with T, using c(20) = ${N2(c1)} alone would underestimate Q (m·c(20)·ΔT = ${N2(m * c1 * (t2 - 20))} kJ). On the graph the shaded area is the heat per kg (multiply by m).`));
    break; }
    case 4: {
    let h0 = x[0], aa = x[1], hole = x[2] / 10000;
    let v = Math.sqrt(2 * G * h0), dh = -(hole / aa) * v;
    let kk = (hole / aa) * Math.sqrt(G / 2), tt = Math.sqrt(h0) / kk;
    s.push(tx(`1. Nicelikler: h(t) = seviye (m), A = ${N2(aa)} m² tank kesiti, a = ${N2(x[2])} cm² = ${F3(hole)} m² delik, g = 9,81 m/s². Şu an h = ${N2(h0)} m.`, `1. Quantities: h(t) = level (m), A = ${N2(aa)} m² tank cross-section, a = ${N2(x[2])} cm² = ${F3(hole)} m² hole, g = 9.81 m/s². Right now h = ${N2(h0)} m.`));
    s.push(tx(`2. Hacim: V = A·h ⇒ dV/dt = A·dh/dt (A sabit).`, `2. Volume: V = A·h ⇒ dV/dt = A·dh/dt (A is constant).`));
    s.push(tx(`3. Çıkış: dV/dt = −a·v = −a·√(2gh) (eksi: hacim azalıyor).`, `3. Outflow: dV/dt = −a·v = −a·√(2gh) (minus: the volume decreases).`));
    s.push(tx(`4. Eşitle: A·dh/dt = −a·√(2gh) ⇒ dh/dt = −(a/A)·√(2gh).`, `4. Equate: A·dh/dt = −a·√(2gh) ⇒ dh/dt = −(a/A)·√(2gh).`));
    s.push(tx(`5. Şu an: v = √(2·9,81·${N2(h0)}) = √${N2(2 * G * h0)} = ${N2(v)} m/s ⇒ dh/dt = −(${F3(hole)}/${N2(aa)})·${N2(v)} = ${F3(dh)} m/s = ${N2(dh * 1000)} mm/s.`, `5. Now: v = √(2·9.81·${N2(h0)}) = √${N2(2 * G * h0)} = ${N2(v)} m/s ⇒ dh/dt = −(${F3(hole)}/${N2(aa)})·${N2(v)} = ${F3(dh)} m/s = ${N2(dh * 1000)} mm/s.`));
    s.push(tx(`6. Boşalma süresi için değişkenleri ayır: dh/√h = −(a/A)√(2g) dt ⇒ 2√h = 2√h₀ − (a/A)√(2g)·t.`, `6. For the draining time separate variables: dh/√h = −(a/A)√(2g) dt ⇒ 2√h = 2√h₀ − (a/A)√(2g)·t.`));
    s.push(tx(`7. h(t) = (√h₀ − κt)², κ = (a/A)√(g/2) = (${F3(hole)}/${N2(aa)})·${F3(Math.sqrt(G / 2))} = ${F3(kk)} √m/s. h = 0 ⇒ t = √h₀/κ = ${F3(Math.sqrt(h0))}/${F3(kk)} = ${N2(tt)} s ≈ ${N2(tt / 60)} dk.`, `7. h(t) = (√h₀ − κt)², κ = (a/A)√(g/2) = (${F3(hole)}/${N2(aa)})·${F3(Math.sqrt(G / 2))} = ${F3(kk)} √m/s. h = 0 ⇒ t = √h₀/κ = ${F3(Math.sqrt(h0))}/${F3(kk)} = ${N2(tt)} s ≈ ${N2(tt / 60)} min.`));
    s.push(tx(`8. Birim kontrolü: (m²/m²)·√(m/s²·m) = m/s ✓. Kontrol: h'(0) = −2κ√h₀ = ${F3(-2 * kk * Math.sqrt(h0))} m/s adım 5 ile aynı ✓.`, `8. Unit check: (m²/m²)·√(m/s²·m) = m/s ✓. Cross-check: h'(0) = −2κ√h₀ = ${F3(-2 * kk * Math.sqrt(h0))} m/s equals step 5 ✓.`));
    s.push(tx(`9. Yorum: seviye düştükçe çıkış hızı (√h) ve dolayısıyla düşme hızı azalır; grafikteki eğri parabol, teğet eğimi giderek yatıklaşır ve tank tamamen boşalmadan hemen önce akış çok yavaştır.`, `9. Interpretation: as the level falls, the outflow speed (√h) and hence the falling rate decreases; the curve is a parabola whose tangent flattens, and just before the tank is empty the flow is very slow.`));
    break; }
    case 5: {
    let vm = x[0], r = x[1];
    let q = Math.PI * r * r * vm / 2;
    s.push(tx(`1. Nicelikler: v_max = ${N2(vm)} m/s, R = ${N2(r)} m; r = eksenden uzaklık. Aranan: Q [m³/s → L/s].`, `1. Quantities: v_max = ${N2(vm)} m/s, R = ${N2(r)} m; r = distance from the axis. Wanted: Q [m³/s → L/s].`));
    s.push(tx(`2. r yarıçaplı, dr kalınlıklı halka: alan dA = 2πr·dr; debi dQ = v(r)·dA.`, `2. Ring of radius r and thickness dr: area dA = 2πr·dr; flow dQ = v(r)·dA.`));
    s.push(tx(`3. Kur: Q = ∫₀ᴿ ${N2(vm)}(1 − r²/R²)·2πr dr = 2π·${N2(vm)} ∫₀ᴿ (r − r³/R²) dr.`, `3. Set up: Q = ∫₀ᴿ ${N2(vm)}(1 − r²/R²)·2πr dr = 2π·${N2(vm)} ∫₀ᴿ (r − r³/R²) dr.`));
    s.push(tx(`4. İlkel: ∫ (r − r³/R²) dr = r²/2 − r⁴/(4R²).`, `4. Antiderivative: ∫ (r − r³/R²) dr = r²/2 − r⁴/(4R²).`));
    s.push(tx(`5. r = R: R²/2 − R⁴/(4R²) = R²/2 − R²/4 = R²/4; r = 0: 0. Fark = R²/4 = ${N2(r * r / 4)} m².`, `5. At r = R: R²/2 − R⁴/(4R²) = R²/2 − R²/4 = R²/4; at r = 0: 0. Difference = R²/4 = ${N2(r * r / 4)} m².`));
    s.push(tx(`6. Q = 2π·${N2(vm)}·R²/4 = π·${N2(vm)}·R²/2 = π·${N2(vm)}·${N2(r * r)}/2 ; R² = ${N2(r * r)} ⇒ Q = ${F3(q)} m³/s.`, `6. Q = 2π·${N2(vm)}·R²/4 = π·${N2(vm)}·R²/2 = π·${N2(vm)}·${N2(r * r)}/2; with R² = ${N2(r * r)} ⇒ Q = ${F3(q)} m³/s.`));
    s.push(tx(`7. Litreye çevir (1 m³ = 1000 L): Q = ${F3(q)}·1000 = ${N2(q * 1000)} L/s.`, `7. Convert (1 m³ = 1000 L): Q = ${F3(q)}·1000 = ${N2(q * 1000)} L/s.`));
    s.push(tx(`8. Birim kontrolü: [m/s]·[m²] = [m³/s] ✓. Ortalama hız = Q/(πR²) = ${N2(vm / 2)} m/s = v_max/2 ✓ (parabolik profilin ünlü sonucu).`, `8. Unit check: [m/s]·[m²] = [m³/s] ✓. Mean speed = Q/(πR²) = ${N2(vm / 2)} m/s = v_max/2 ✓ (the well-known result for a parabolic profile).`));
    s.push(tx(`9. Yorum: eksende hız en büyüktür ama halka alanı 0'dır; duvarda alan büyüktür ama hız 0'dır. Bu yüzden integrand (gölgeli eğri) ortada tepe yapar ve alanı debidir.`, `9. Interpretation: the speed is largest on the axis but the ring area is 0 there; at the wall the ring area is large but the speed is 0. So the integrand (the shaded curve) peaks in between and its area is the flow rate.`));
    break; }
    case 6: {
    let n = x[0], tk = x[1], v1 = x[2], f = x[3];
    let nrt = n * RGas * tk, p1 = nrt / v1, dp = -p1 / v1 * 5, w = nrt * Math.log(f);
    s.push(tx(`1. Nicelikler: n = ${N2(n)} mol, T = ${N2(tk)} K (sabit), V₁ = ${N2(v1)} L, V₂ = ${N2(f * v1)} L, R = 8,314. nRT = ${N2(n)}·8,314·${N2(tk)} = ${N2(nrt)} J.`, `1. Quantities: n = ${N2(n)} mol, T = ${N2(tk)} K (constant), V₁ = ${N2(v1)} L, V₂ = ${N2(f * v1)} L, R = 8.314. nRT = ${N2(n)}·8.314·${N2(tk)} = ${N2(nrt)} J.`));
    s.push(tx(`2. Basınç (kPa, V litre): P = nRT/V = ${N2(nrt)}/V. V₁'de P₁ = ${N2(nrt)}/${N2(v1)} = ${N2(p1)} kPa. (kPa·L = J)`, `2. Pressure (kPa, V in litres): P = nRT/V = ${N2(nrt)}/V. At V₁: P₁ = ${N2(nrt)}/${N2(v1)} = ${N2(p1)} kPa. (kPa·L = J)`));
    s.push(tx(`3. (a) PV = nRT'yi t'ye göre türet (çarpım kuralı, sağ taraf sabit): (dP/dt)·V + P·(dV/dt) = 0.`, `3. (a) Differentiate PV = nRT in t (product rule, constant right side): (dP/dt)·V + P·(dV/dt) = 0.`));
    s.push(tx(`4. dP/dt'yi çöz: dP/dt = −(P/V)·(dV/dt).`, `4. Solve for dP/dt: dP/dt = −(P/V)·(dV/dt).`));
    s.push(tx(`5. Değerleri koy: dP/dt = −(${N2(p1)}/${N2(v1)})·5 = −${N2(p1 / v1)}·5 = ${N2(dp)} kPa/s.`, `5. Insert the values: dP/dt = −(${N2(p1)}/${N2(v1)})·5 = −${N2(p1 / v1)}·5 = ${N2(dp)} kPa/s.`));
    s.push(tx(`6. (b) İş: W = ∫P dV = ∫ nRT/V dV = nRT·ln V; sınırlar V₁ = ${N2(v1)} ve V₂ = ${N2(f * v1)} L.`, `6. (b) Work: W = ∫P dV = ∫ nRT/V dV = nRT·ln V; limits V₁ = ${N2(v1)} and V₂ = ${N2(f * v1)} L.`));
    s.push(tx(`7. W = nRT·(ln V₂ − ln V₁) = nRT·ln(V₂/V₁) = ${N2(nrt)}·ln(${N2(f)}) = ${N2(nrt)}·${F3(Math.log(f))}.`, `7. W = nRT·(ln V₂ − ln V₁) = nRT·ln(V₂/V₁) = ${N2(nrt)}·ln(${N2(f)}) = ${N2(nrt)}·${F3(Math.log(f))}.`));
    s.push(tx(`8. Sonuç: W = ${N2(w)} J. Birim: kPa·L = J ✓; ln oranı boyutsuz ✓. Not: dV/dt yalnız (a)'da gerekir; (b)'deki iş genleşme hızından bağımsızdır ✓.`, `8. Result: W = ${N2(w)} J. Unit: kPa·L = J ✓; the ln of a ratio is dimensionless ✓. Note: the rate dV/dt matters only for (a); the work in (b) does not depend on speed ✓.`));
    s.push(tx(`9. Yorum: basınç V arttıkça DÜŞER (dP/dt < 0). İzotermalde iç enerji değişmez, dolayısıyla gazın işi kadar ısı Q = W = ${N2(w)} J ortamdan alınmalıdır. Grafikte gölgeli alan işi verir.`, `9. Interpretation: pressure FALLS as V grows (dP/dt < 0). In an isothermal process the internal energy does not change, so heat Q = W = ${N2(w)} J must be absorbed from the surroundings. On the graph the shaded area is the work.`));
    break; }
    case 7: {
    let a = x[0], b = x[1];
    let sv = Math.sqrt(b / a), xs = sv - 2, cmin = a * xs + b / sv;
    s.push(tx(`1. Nicelikler: x = yalıtım kalınlığı (cm), x ≥ 0; C(x) = toplam yıllık maliyet (TL/m²).`, `1. Quantities: x = insulation thickness (cm), x ≥ 0; C(x) = total yearly cost (TL/m²).`));
    s.push(tx(`2. Hedef: C(x) = ${N2(a)}x + ${N2(b)}/(x + 2) = ${N2(a)}x + ${N2(b)}(x + 2)⁻¹ en küçük olsun.`, `2. Objective: minimise C(x) = ${N2(a)}x + ${N2(b)}/(x + 2) = ${N2(a)}x + ${N2(b)}(x + 2)⁻¹.`));
    s.push(tx(`3. Türev (kuvvet ve zincir kuralı): C'(x) = ${N2(a)} − ${N2(b)}/(x + 2)².`, `3. Derivative (power and chain rule): C'(x) = ${N2(a)} − ${N2(b)}/(x + 2)².`));
    s.push(tx(`4. C'(x) = 0 ⇒ (x + 2)² = ${N2(b)}/${N2(a)} = ${N2(b / a)}.`, `4. C'(x) = 0 ⇒ (x + 2)² = ${N2(b)}/${N2(a)} = ${N2(b / a)}.`));
    s.push(tx(`5. Karekök (x + 2 > 0): x + 2 = √${N2(b / a)} = ${N2(sv)} ⇒ x* = ${N2(sv)} − 2 = ${N2(xs)} cm. (Negatif kök geçersiz.)`, `5. Square root (x + 2 > 0): x + 2 = √${N2(b / a)} = ${N2(sv)} ⇒ x* = ${N2(sv)} − 2 = ${N2(xs)} cm. (The negative root is not valid.)`));
    s.push(tx(`6. İkinci türev: C''(x) = 2·${N2(b)}/(x + 2)³ > 0 (x ≥ 0 için) ⇒ x* bir MİNİMUM; C(0) = ${N2(b / 2)} ise daha büyüktür.`, `6. Second derivative: C''(x) = 2·${N2(b)}/(x + 2)³ > 0 (for x ≥ 0) ⇒ x* is a MINIMUM; C(0) = ${N2(b / 2)} is larger.`));
    s.push(tx(`7. Değer: C(x*) = ${N2(a)}·${N2(xs)} + ${N2(b)}/${N2(sv)} = ${N2(a * xs)} + ${N2(b / sv)} = ${N2(cmin)} TL/m².`, `7. Value: C(x*) = ${N2(a)}·${N2(xs)} + ${N2(b)}/${N2(sv)} = ${N2(a * xs)} + ${N2(b / sv)} = ${N2(cmin)} TL/m².`));
    s.push(tx(`8. Birim kontrolü: a [TL/cm·m²]·x [cm] = [TL/m²]; b/(x + 2) [TL·cm/m²]/[cm] = [TL/m²] ✓.`, `8. Unit check: a [TL/cm·m²]·x [cm] = [TL/m²]; b/(x + 2) [TL·cm/m²]/[cm] = [TL/m²] ✓.`));
    s.push(tx(`9. Yorum: en uçta iki maliyet dengelenir (a = b/(x + 2)²: yalıtımın marjinal maliyeti = ısı kaybının marjinal kazancı). İnce yalıtım kayıp yüzünden, kalın yalıtım malzeme yüzünden pahalıdır. Sarı nokta minimumdur.`, `9. Interpretation: at the optimum the two costs balance (a = b/(x + 2)²: the marginal cost of insulation equals the marginal saving in heat loss). Thin insulation is expensive because of losses, thick insulation because of material. The gold point is the minimum.`));
    break; }
    case 8: {
    const o = Mod(8, x);
    const n04 = (v) => F3(Math.pow(v, -0.4));
    Ad(s, `1. Nicelikler: p₁ = ${N2(o.p1)} kPa, V₁ = ${N2(o.V1)} L, r = V₁/V₂ = ${N2(o.r)}, ρ = p₃/p₂ = ${N2(o.rho)}, γ = 1,4. Birim: kPa·L = J.`, `1. Quantities: p₁ = ${N2(o.p1)} kPa, V₁ = ${N2(o.V1)} L, r = V₁/V₂ = ${N2(o.r)}, ρ = p₃/p₂ = ${N2(o.rho)}, γ = 1.4. Unit: kPa·L = J.`);
    Ad(s, `2. Hâller: V₂ = V₃ = V₁/r = ${N2(o.V1)}/${N2(o.r)} = ${N2(o.V2)} L; V₄ = V₁. p₂ = p₁·r^γ = ${N2(o.p1)}·${N2(o.r)}^1,4 = ${N2(o.p2)} kPa; p₃ = ρ·p₂ = ${N2(o.p3)} kPa; p₄ = ρ·p₁ = ${N2(o.p4)} kPa.`, `2. States: V₂ = V₃ = V₁/r = ${N2(o.V1)}/${N2(o.r)} = ${N2(o.V2)} L; V₄ = V₁. p₂ = p₁·r^γ = ${N2(o.p1)}·${N2(o.r)}^1.4 = ${N2(o.p2)} kPa; p₃ = ρ·p₂ = ${N2(o.p3)} kPa; p₄ = ρ·p₁ = ${N2(o.p4)} kPa.`);
    Ad(s, `3. Adyabat: pV^γ = K ⇒ p = K·V^(−γ). K₁ = p₁V₁^γ = ${N2(o.p1)}·${N2(o.V1)}^1,4 = ${N2(o.K1)}; K₂ = p₃V₃^γ = ${N2(o.p3)}·${N2(o.V2)}^1,4 = ${N2(o.K2)} (kPa·L^1,4).`, `3. Adiabat: pV^γ = K ⇒ p = K·V^(−γ). K₁ = p₁V₁^γ = ${N2(o.p1)}·${N2(o.V1)}^1.4 = ${N2(o.K1)}; K₂ = p₃V₃^γ = ${N2(o.p3)}·${N2(o.V2)}^1.4 = ${N2(o.K2)} (kPa·L^1.4).`);
    Ad(s, `4. Sıkıştırma 1→2: W₁₂ = ∫ p dV = K₁∫ V^(−1,4) dV = K₁·[V^(−0,4)/(−0,4)] (V₁'den V₂'ye) = ${N2(o.K1)}·(${n04(o.V2)} − ${n04(o.V1)})/(−0,4) = ${N2(o.W12)} J (negatif: gaz üzerinde iş yapılır).`, `4. Compression 1→2: W₁₂ = ∫ p dV = K₁∫ V^(−1.4) dV = K₁·[V^(−0.4)/(−0.4)] (from V₁ to V₂) = ${N2(o.K1)}·(${n04(o.V2)} − ${n04(o.V1)})/(−0.4) = ${N2(o.W12)} J (negative: work is done on the gas).`);
    Ad(s, `5. Genleşme 3→4: W₃₄ = K₂·[V^(−0,4)/(−0,4)] (V₃ = ${N2(o.V2)}'den V₄ = ${N2(o.V1)}'e) = ${N2(o.K2)}·(${n04(o.V1)} − ${n04(o.V2)})/(−0,4) = ${N2(o.W34)} J (pozitif).`, `5. Expansion 3→4: W₃₄ = K₂·[V^(−0.4)/(−0.4)] (from V₃ = ${N2(o.V2)} to V₄ = ${N2(o.V1)}) = ${N2(o.K2)}·(${n04(o.V1)} − ${n04(o.V2)})/(−0.4) = ${N2(o.W34)} J (positive).`);
    Ad(s, `6. Sabit hacimli kollar 2→3 ve 4→1: dV = 0 ⇒ W₂₃ = W₄₁ = ∫p dV = 0.`, `6. Constant-volume legs 2→3 and 4→1: dV = 0 ⇒ W₂₃ = W₄₁ = ∫p dV = 0.`);
    Ad(s, `7. Net iş: W_net = W₁₂ + W₃₄ = ${N2(o.W12)} + ${N2(o.W34)} = ${N2(o.Wn)} J. Kapalı formül: (ρ − 1)p₁V₁(r^0,4 − 1)/0,4 = ${N2((o.rho - 1) * o.p1 * o.V1 * (Math.pow(o.r, 0.4) - 1) / 0.4)} J ✓.`, `7. Net work: W_net = W₁₂ + W₃₄ = ${N2(o.W12)} + ${N2(o.W34)} = ${N2(o.Wn)} J. Closed form: (ρ − 1)p₁V₁(r^0.4 − 1)/0.4 = ${N2((o.rho - 1) * o.p1 * o.V1 * (Math.pow(o.r, 0.4) - 1) / 0.4)} J ✓.`);
    Ad(s, `8. Verim: Q_giriş = (p₃V₃ − p₂V₂)/(γ − 1) = (${N2(o.p3 * o.V2)} − ${N2(o.p2 * o.V2)})/0,4 = ${N2(o.Qin)} J; η = W_net/Q_giriş = ${F3(o.Wn / o.Qin)}; 1 − r^(−0,4) = 1 − ${F3(Math.pow(o.r, -0.4))} = ${F3(o.eta)} ✓.`, `8. Efficiency: Q_in = (p₃V₃ − p₂V₂)/(γ − 1) = (${N2(o.p3 * o.V2)} − ${N2(o.p2 * o.V2)})/0.4 = ${N2(o.Qin)} J; η = W_net/Q_in = ${F3(o.Wn / o.Qin)}; 1 − r^(−0.4) = 1 − ${F3(Math.pow(o.r, -0.4))} = ${F3(o.eta)} ✓.`);
    Ad(s, `9. Yorum: atılan ısı Q_çıkış = Q_giriş − W_net = ${N2(o.Qout)} J. Verim yalnızca sıkıştırma oranına bağlıdır (η = ${N2(o.eta * 100)} %); r büyürse η artar. Grafikte yeşil alan genleşme işi, kırmızı alan sıkıştırma işidir; aradaki fark çevrim alanıdır.`, `9. Interpretation: the heat rejected is Q_out = Q_in − W_net = ${N2(o.Qout)} J. The efficiency depends only on the compression ratio (η = ${N2(o.eta * 100)} %); a larger r raises η. On the graph the green area is the expansion work and the red area the compression work; their difference is the cycle area.`);
    break; }
    case 9: {
    const o = Mod(9, x);
    Ad(s, `1. Nicelikler: μ = ${N2(x[0])} mPa·s = ${F3(o.mu)} Pa·s, R = ${N2(x[2])} mm = ${F3(o.R)} m, G = −dp/dx = ${N2(o.Gp)} Pa/m, r = eksenden uzaklık (m).`, `1. Quantities: μ = ${N2(x[0])} mPa·s = ${F3(o.mu)} Pa·s, R = ${N2(x[2])} mm = ${F3(o.R)} m, G = −dp/dx = ${N2(o.Gp)} Pa/m, r = distance from the axis (m).`);
    Ad(s, `2. Profil: u(r) = G(R² − r²)/(4μ) = c(R² − r²), c = G/(4μ) = ${N2(o.Gp)}/(4·${F3(o.mu)}) = ${N2(o.c)} 1/(m·s).`, `2. Profile: u(r) = G(R² − r²)/(4μ) = c(R² − r²), c = G/(4μ) = ${N2(o.Gp)}/(4·${F3(o.mu)}) = ${N2(o.c)} 1/(m·s).`);
    Ad(s, `3. Eksen hızı (r = 0): u_max = c·R² = ${N2(o.c)}·${Sci(o.R * o.R)} = ${G4(o.umax)} m/s.`, `3. Centre-line speed (r = 0): u_max = c·R² = ${N2(o.c)}·${Sci(o.R * o.R)} = ${G4(o.umax)} m/s.`);
    Ad(s, `4. Türev: du/dr = c·(−2r) = −G·r/(2μ); r = R'de du/dr = −2·${N2(o.c)}·${F3(o.R)} = ${N2(o.dudrW)} 1/s.`, `4. Derivative: du/dr = c·(−2r) = −G·r/(2μ); at r = R, du/dr = −2·${N2(o.c)}·${F3(o.R)} = ${N2(o.dudrW)} 1/s.`);
    Ad(s, `5. Duvar kayması: τ_w = −μ·du/dr = ${F3(o.mu)}·${N2(-o.dudrW)} = ${G4(o.tauw)} Pa. (Kontrol: G·R/2 = ${N2(o.Gp)}·${F3(o.R)}/2 = ${G4(o.Gp * o.R / 2)} Pa ✓)`, `5. Wall shear: τ_w = −μ·du/dr = ${F3(o.mu)}·${N2(-o.dudrW)} = ${G4(o.tauw)} Pa. (Check: G·R/2 = ${N2(o.Gp)}·${F3(o.R)}/2 = ${G4(o.Gp * o.R / 2)} Pa ✓)`);
    Ad(s, `6. Debi: Q = ∫₀ᴿ c(R² − r²)·2πr dr = 2πc ∫₀ᴿ (R²r − r³) dr = 2πc·[R²r²/2 − r⁴/4]₀ᴿ = 2πc·R⁴/4 = πcR⁴/2.`, `6. Flow rate: Q = ∫₀ᴿ c(R² − r²)·2πr dr = 2πc ∫₀ᴿ (R²r − r³) dr = 2πc·[R²r²/2 − r⁴/4]₀ᴿ = 2πc·R⁴/4 = πcR⁴/2.`);
    Ad(s, `7. Sayı: R⁴ = ${Sci(Math.pow(o.R, 4))} m⁴ ⇒ Q = π·${N2(o.c)}·${Sci(Math.pow(o.R, 4))}/2 = ${Sci(o.Q)} m³/s = ${N2(o.Q * 1e6)} mL/s.`, `7. Number: R⁴ = ${Sci(Math.pow(o.R, 4))} m⁴ ⇒ Q = π·${N2(o.c)}·${Sci(Math.pow(o.R, 4))}/2 = ${Sci(o.Q)} m³/s = ${N2(o.Q * 1e6)} mL/s.`);
    Ad(s, `8. Kontrol: ortalama hız Q/(πR²) = ${G4(o.vbar)} m/s = u_max/2 ✓. Kuvvet dengesi: G·πR² = τ_w·2πR ⇒ τ_w = GR/2 ✓. Birim: [Pa/m·m²/(Pa·s)]·m² = m³/s ✓.`, `8. Check: mean speed Q/(πR²) = ${G4(o.vbar)} m/s = u_max/2 ✓. Force balance: G·πR² = τ_w·2πR ⇒ τ_w = GR/2 ✓. Unit: [Pa/m·m²/(Pa·s)]·m² = m³/s ✓.`);
    Ad(s, `9. Yorum: Reynolds sayısı Re = ρ·ū·D/μ = 900·${G4(o.vbar)}·${F3(2 * o.R)}/${F3(o.mu)} = ${N2(900 * o.vbar * 2 * o.R / o.mu)} < 2300 (ρ ≈ 900 kg/m³ yağ), yani laminer varsayım geçerlidir. Profil duvarda en dik (kayma en büyük), eksende yataydır (du/dr = 0). Q ∝ R⁴: yarıçap 2 katına çıkarsa debi 16 katına çıkar.`, `9. Interpretation: Reynolds number Re = ρ·ū·D/μ = 900·${G4(o.vbar)}·${F3(2 * o.R)}/${F3(o.mu)} = ${N2(900 * o.vbar * 2 * o.R / o.mu)} < 2300 (ρ ≈ 900 kg/m³ oil), so the laminar assumption holds. The profile is steepest at the wall (largest shear) and flat on the axis (du/dr = 0). Q ∝ R⁴: doubling the radius multiplies the flow by 16.`);
    break; }
    case 10: {
    const o = Mod(10, x);
    Ad(s, `1. Nicelikler: rᵢ = ${N2(o.ri)} cm, r_o = rᵢ + t = ${N2(o.ri)} + ${N2(o.t)} = ${N2(o.ro)} cm, Tᵢ = ${N2(o.Ti)} °C, T_o = ${N2(o.To)} °C, k = ${N2(o.k)} W/m·K. Aranan: Q′ [W/m] ve T(r).`, `1. Quantities: rᵢ = ${N2(o.ri)} cm, r_o = rᵢ + t = ${N2(o.ri)} + ${N2(o.t)} = ${N2(o.ro)} cm, Tᵢ = ${N2(o.Ti)} °C, T_o = ${N2(o.To)} °C, k = ${N2(o.k)} W/m·K. Wanted: Q′ [W/m] and T(r).`);
    Ad(s, `2. Fourier (silindir): Q′ = −k·(2πr)·dT/dr = sabit ⇒ dT/dr = −Q′/(2πk·r).`, `2. Fourier (cylinder): Q′ = −k·(2πr)·dT/dr = constant ⇒ dT/dr = −Q′/(2πk·r).`);
    Ad(s, `3. Değişkenleri ayır ve integre et: ∫ dT = −(Q′/2πk) ∫ dr/r ⇒ T(r) = Tᵢ − (Q′/2πk)·ln(r/rᵢ).`, `3. Separate the variables and integrate: ∫ dT = −(Q′/2πk) ∫ dr/r ⇒ T(r) = Tᵢ − (Q′/2πk)·ln(r/rᵢ).`);
    Ad(s, `4. r = r_o'da T = T_o: ${N2(o.To)} = ${N2(o.Ti)} − (Q′/2πk)·ln(${N2(o.ro)}/${N2(o.ri)}) ⇒ Q′ = 2πk(Tᵢ − T_o)/ln(r_o/rᵢ).`, `4. At r = r_o, T = T_o: ${N2(o.To)} = ${N2(o.Ti)} − (Q′/2πk)·ln(${N2(o.ro)}/${N2(o.ri)}) ⇒ Q′ = 2πk(Tᵢ − T_o)/ln(r_o/rᵢ).`);
    Ad(s, `5. Sayı: ln(${N2(o.ro)}/${N2(o.ri)}) = ln(${F3(o.ro / o.ri)}) = ${F3(o.ln)}; Q′ = 2π·${N2(o.k)}·${N2(o.Ti - o.To)}/${F3(o.ln)} = ${N2(o.Q)} W/m.`, `5. Number: ln(${N2(o.ro)}/${N2(o.ri)}) = ln(${F3(o.ro / o.ri)}) = ${F3(o.ln)}; Q′ = 2π·${N2(o.k)}·${N2(o.Ti - o.To)}/${F3(o.ln)} = ${N2(o.Q)} W/m.`);
    Ad(s, `6. Profil: T(r) = ${N2(o.Ti)} − ${N2(o.Ti - o.To)}·ln(r/${N2(o.ri)})/${F3(o.ln)}. Ara yarıçap r = ${N2(o.rm)} cm'de T = ${N2(o.Tr(o.rm))} °C (doğrusal ortalama ${N2((o.Ti + o.To) / 2)} °C'den farklı).`, `6. Profile: T(r) = ${N2(o.Ti)} − ${N2(o.Ti - o.To)}·ln(r/${N2(o.ri)})/${F3(o.ln)}. At the middle radius r = ${N2(o.rm)} cm, T = ${N2(o.Tr(o.rm))} °C (different from the linear average ${N2((o.Ti + o.To) / 2)} °C).`);
    Ad(s, `7. Kontrol: geometrik ortalama yarıçap √(rᵢ r_o) = ${F3(o.rg)} cm'de ln(r/rᵢ) = ½ln(r_o/rᵢ) ⇒ T = ${N2(o.Tr(o.rg))} °C = (Tᵢ + T_o)/2 = ${N2((o.Ti + o.To) / 2)} °C ✓.`, `7. Check: at the geometric-mean radius √(rᵢ r_o) = ${F3(o.rg)} cm, ln(r/rᵢ) = ½ln(r_o/rᵢ) ⇒ T = ${N2(o.Tr(o.rg))} °C = (Tᵢ + T_o)/2 = ${N2((o.Ti + o.To) / 2)} °C ✓.`);
    Ad(s, `8. Isı akısı q = Q′/(2πr): iç yüzde ${N2(o.Q)}/(2π·${F3(o.ri / 100)}) = ${N2(o.qi)} W/m², dış yüzde ${N2(o.qo)} W/m² (q·r sabit). Birim: [W/m·K]·[K] = W/m ✓.`, `8. Heat flux q = Q′/(2πr): at the inner surface ${N2(o.Q)}/(2π·${F3(o.ri / 100)}) = ${N2(o.qi)} W/m², at the outer surface ${N2(o.qo)} W/m² (q·r is constant). Unit: [W/m·K]·[K] = W/m ✓.`);
    Ad(s, `9. Yorum: eğim dT/dr = −Q′/(2πk r) iç yüzeyde ${N2(-o.Q / (2 * Math.PI * o.k * o.ri / 100))} K/m, dış yüzeyde ${N2(-o.Q / (2 * Math.PI * o.k * o.ro / 100))} K/m: sıcaklık içte daha dik düşer (alan küçük, akı büyük). Kalınlık artınca ln(r_o/rᵢ) artar ve Q′ azalır.`, `9. Interpretation: the slope dT/dr = −Q′/(2πk r) is ${N2(-o.Q / (2 * Math.PI * o.k * o.ri / 100))} K/m at the inner surface and ${N2(-o.Q / (2 * Math.PI * o.k * o.ro / 100))} K/m at the outer: the temperature drops more steeply inside (small area, large flux). A thicker wall raises ln(r_o/rᵢ) and lowers Q′.`);
    break; }
    case 11: {
    const o = Mod(11, x);
    const dT = o.Th - o.Tc, sq = o.be / 2 * (o.Th * o.Th - o.Tc * o.Tc);
    const S = o.Th + o.be * o.Th * o.Th / 2 - o.q * (o.L / 2) / o.k0;
    Ad(s, `1. Nicelikler: k₀ = ${N2(o.k0)} W/m·K, β = ${F3(o.be)} 1/K, Tₕ = ${N2(o.Th)} °C (x = 0), T_c = ${N2(o.Tc)} °C (x = L), L = ${N2(o.L)} m.`, `1. Quantities: k₀ = ${N2(o.k0)} W/m·K, β = ${F3(o.be)} 1/K, Tₕ = ${N2(o.Th)} °C (x = 0), T_c = ${N2(o.Tc)} °C (x = L), L = ${N2(o.L)} m.`);
    Ad(s, `2. Kararlı hal: q = −k(T)·dT/dx = sabit ⇒ q dx = −k₀(1 + βT) dT (değişkenler ayrıldı).`, `2. Steady state: q = −k(T)·dT/dx = constant ⇒ q dx = −k₀(1 + βT) dT (variables separated).`);
    Ad(s, `3. Duvar boyunca integre et: q·L = −k₀∫_{Tₕ}^{T_c}(1 + βT) dT = k₀∫_{T_c}^{Tₕ}(1 + βT) dT = k₀[T + βT²/2]_{T_c}^{Tₕ}.`, `3. Integrate across the wall: q·L = −k₀∫_{Tₕ}^{T_c}(1 + βT) dT = k₀∫_{T_c}^{Tₕ}(1 + βT) dT = k₀[T + βT²/2]_{T_c}^{Tₕ}.`);
    Ad(s, `4. Terimler: Tₕ − T_c = ${N2(o.Th)} − ${N2(o.Tc)} = ${N2(dT)}; (β/2)(Tₕ² − T_c²) = ${F3(o.be / 2)}·(${N2(o.Th * o.Th)} − ${N2(o.Tc * o.Tc)}) = ${N2(sq)}.`, `4. Terms: Tₕ − T_c = ${N2(o.Th)} − ${N2(o.Tc)} = ${N2(dT)}; (β/2)(Tₕ² − T_c²) = ${F3(o.be / 2)}·(${N2(o.Th * o.Th)} − ${N2(o.Tc * o.Tc)}) = ${N2(sq)}.`);
    Ad(s, `5. q = (k₀/L)·[${N2(dT)} + ${N2(sq)}] = (${N2(o.k0)}/${N2(o.L)})·${N2(dT + sq)} = ${N2(o.q)} W/m².`, `5. q = (k₀/L)·[${N2(dT)} + ${N2(sq)}] = (${N2(o.k0)}/${N2(o.L)})·${N2(dT + sq)} = ${N2(o.q)} W/m².`);
    Ad(s, `6. Ortalama iletkenlik: k_m = k₀[1 + β(Tₕ + T_c)/2] = ${N2(o.km)} W/m·K ⇒ k_m·ΔT/L = ${N2(o.q)} W/m² ✓. Sabit k₀ ile q₀ = k₀ΔT/L = ${N2(o.q0)} W/m² (yaklaşık %${N2((o.q / o.q0 - 1) * 100)} az).`, `6. Mean conductivity: k_m = k₀[1 + β(Tₕ + T_c)/2] = ${N2(o.km)} W/m·K ⇒ k_m·ΔT/L = ${N2(o.q)} W/m² ✓. With constant k₀, q₀ = k₀ΔT/L = ${N2(o.q0)} W/m² (about ${N2((o.q / o.q0 - 1) * 100)} % too low).`);
    Ad(s, `7. Orta sıcaklık: integrali 0'dan L/2'ye yaz: k₀[(Tₕ − T) + β(Tₕ² − T²)/2] = q·L/2 ⇒ (β/2)T² + T − S = 0, S = Tₕ + βTₕ²/2 − qL/(2k₀) = ${N2(S)}.`, `7. Mid-wall temperature: write the integral from 0 to L/2: k₀[(Tₕ − T) + β(Tₕ² − T²)/2] = q·L/2 ⇒ (β/2)T² + T − S = 0, S = Tₕ + βTₕ²/2 − qL/(2k₀) = ${N2(S)}.`);
    Ad(s, `8. Kök: T = [−1 + √(1 + 2βS)]/β = [−1 + √${F3(1 + 2 * o.be * S)}]/${F3(o.be)} = ${N2(o.Tmid)} °C (fiziksel kök; diğeri negatif).`, `8. Root: T = [−1 + √(1 + 2βS)]/β = [−1 + √${F3(1 + 2 * o.be * S)}]/${F3(o.be)} = ${N2(o.Tmid)} °C (physical root; the other is negative).`);
    Ad(s, `9. Yorum: ortadaki sıcaklık doğrusal ortalamadan (${N2((o.Th + o.Tc) / 2)} °C) YÜKSEKTİR. Eğim −q/k(T): sıcak yüzde ${N2(-o.q / o.kh)} °C/m, soğuk yüzde ${N2(-o.q / o.kc)} °C/m (soğukta daha dik). Profil eğridir, kesikli çizgi sabit-k doğrusudur.`, `9. Interpretation: the mid-wall temperature is HIGHER than the linear average (${N2((o.Th + o.Tc) / 2)} °C). The slope is −q/k(T): ${N2(-o.q / o.kh)} °C/m at the hot face and ${N2(-o.q / o.kc)} °C/m at the cold face (steeper in the cold). The profile is curved; the dashed line is the constant-k straight line.`);
    break; }
    case 12: {
    const o = Mod(12, x);
    const rateM = o.rateS * 60;
    Ad(s, `1. Nicelikler: m = ${N2(o.m)} kg, c = ${N2(o.c)} J/kg·K, hA = ${N2(o.hA)} W/K, Tᵢ = ${N2(o.Ti)} °C, T∞ = 20 °C, t = ${N2(o.tm)} dk = ${N2(o.ts)} s.`, `1. Quantities: m = ${N2(o.m)} kg, c = ${N2(o.c)} J/kg·K, hA = ${N2(o.hA)} W/K, Tᵢ = ${N2(o.Ti)} °C, T∞ = 20 °C, t = ${N2(o.tm)} min = ${N2(o.ts)} s.`);
    Ad(s, `2. Enerji dengesi: m·c·dT/dt = −hA(T − T∞) ⇒ dT/dt = −(T − T∞)/τ, τ = mc/hA = ${N2(o.m)}·${N2(o.c)}/${N2(o.hA)} = ${N2(o.tau)} s = ${N2(o.tau / 60)} dk.`, `2. Energy balance: m·c·dT/dt = −hA(T − T∞) ⇒ dT/dt = −(T − T∞)/τ, τ = mc/hA = ${N2(o.m)}·${N2(o.c)}/${N2(o.hA)} = ${N2(o.tau)} s = ${N2(o.tau / 60)} min.`);
    Ad(s, `3. Çözüm (değişkenleri ayır, integre et): T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ) = 20 + ${N2(o.Ti - 20)}·e^(−t/${N2(o.tau)}).`, `3. Solution (separate variables, integrate): T(t) = T∞ + (Tᵢ − T∞)e^(−t/τ) = 20 + ${N2(o.Ti - 20)}·e^(−t/${N2(o.tau)}).`);
    Ad(s, `4. Üstel: t/τ = ${N2(o.ts)}/${N2(o.tau)} = ${F3(o.ts / o.tau)} ⇒ e^(−t/τ) = ${Gs(o.e)}.`, `4. Exponential: t/τ = ${N2(o.ts)}/${N2(o.tau)} = ${F3(o.ts / o.tau)} ⇒ e^(−t/τ) = ${Gs(o.e)}.`);
    Ad(s, `5. Sıcaklık: T = 20 + ${N2(o.Ti - 20)}·${Gs(o.e)} = 20 + ${N2((o.Ti - 20) * o.e)} = ${N2(o.T)} °C.`, `5. Temperature: T = 20 + ${N2(o.Ti - 20)}·${Gs(o.e)} = 20 + ${N2((o.Ti - 20) * o.e)} = ${N2(o.T)} °C.`);
    Ad(s, `6. Soğuma hızı: dT/dt = −(T − T∞)/τ = −${N2(o.T - 20)}/${N2(o.tau)} = ${Gs(o.rateS)} °C/s = ${N2(rateM)} °C/dk.`, `6. Cooling rate: dT/dt = −(T − T∞)/τ = −${N2(o.T - 20)}/${N2(o.tau)} = ${Gs(o.rateS)} °C/s = ${N2(rateM)} °C/min.`);
    Ad(s, `7. Atılan ısı: Q = ∫₀ᵗ hA(T − T∞) dt = hA(Tᵢ − T∞)∫₀ᵗ e^(−t/τ) dt = hA(Tᵢ − T∞)·τ·(1 − e^(−t/τ)) = ${N2(o.hA)}·${N2(o.Ti - 20)}·${N2(o.tau)}·(1 − ${Gs(o.e)}) = ${N2(o.Q2 * 1000)} J = ${N2(o.Q2)} kJ.`, `7. Heat removed: Q = ∫₀ᵗ hA(T − T∞) dt = hA(Tᵢ − T∞)∫₀ᵗ e^(−t/τ) dt = hA(Tᵢ − T∞)·τ·(1 − e^(−t/τ)) = ${N2(o.hA)}·${N2(o.Ti - 20)}·${N2(o.tau)}·(1 − ${Gs(o.e)}) = ${N2(o.Q2 * 1000)} J = ${N2(o.Q2)} kJ.`);
    Ad(s, `8. Kontrol: Q = m·c·(Tᵢ − T) = ${N2(o.m)}·${N2(o.c)}·${N2(o.Ti - o.T)}/1000 = ${N2(o.Q)} kJ ✓. Güç: başta hA·ΔT₀ = ${N2(o.P0)} W, şimdi ${N2(o.P)} W. Birim: W·s = J ✓.`, `8. Check: Q = m·c·(Tᵢ − T) = ${N2(o.m)}·${N2(o.c)}·${N2(o.Ti - o.T)}/1000 = ${N2(o.Q)} kJ ✓. Power: hA·ΔT₀ = ${N2(o.P0)} W at the start, ${N2(o.P)} W now. Unit: W·s = J ✓.`);
    Ad(s, `9. Yorum: t = τ'da T = 20 + ${N2(o.Ti - 20)}·0,368 = ${N2(20 + (o.Ti - 20) * Math.exp(-1))} °C (fark %63,2 azalmış). Isının çoğu ilk τ'larda atılır; 3τ'da fark %95 azalır. Sarı nokta cevap, kesikli çizgi teğettir.`, `9. Interpretation: at t = τ, T = 20 + ${N2(o.Ti - 20)}·0.368 = ${N2(20 + (o.Ti - 20) * Math.exp(-1))} °C (the difference has fallen by 63.2 %). Most heat leaves in the first few τ; after 3τ the difference has dropped by 95 %. The gold point is the answer, the dashed line is the tangent.`);
    break; }
    case 13: {
    const o = Mod(13, x);
    Ad(s, `1. Nicelikler: P_max = ${N2(o.Pm)} kW, T = ${N2(o.T)} h, m = ${N2(o.m)} kg, c = 4,18 kJ/kg·K. Enerji E [kWh] (1 kWh = 3600 kJ).`, `1. Quantities: P_max = ${N2(o.Pm)} kW, T = ${N2(o.T)} h, m = ${N2(o.m)} kg, c = 4.18 kJ/kg·K. Energy E [kWh] (1 kWh = 3600 kJ).`);
    Ad(s, `2. Küçük dt'de enerji dE = P(t) dt; tümünü topla: E = ∫₀ᵀ P_max·sin(πt/T) dt = P_max ∫₀ᵀ sin(πt/T) dt.`, `2. In a small dt the energy is dE = P(t) dt; add them all: E = ∫₀ᵀ P_max·sin(πt/T) dt = P_max ∫₀ᵀ sin(πt/T) dt.`);
    Ad(s, `3. İlkel (zincir kuralının tersi): ∫ sin(πt/T) dt = −(T/π)·cos(πt/T).`, `3. Antiderivative (reverse chain rule): ∫ sin(πt/T) dt = −(T/π)·cos(πt/T).`);
    Ad(s, `4. Sınırlar: [−cos(πt/T)]₀ᵀ = −cos π + cos 0 = 1 + 1 = 2 ⇒ E = P_max·(T/π)·2 = 2P_maxT/π.`, `4. Limits: [−cos(πt/T)]₀ᵀ = −cos π + cos 0 = 1 + 1 = 2 ⇒ E = P_max·(T/π)·2 = 2P_maxT/π.`);
    Ad(s, `5. Sayı: E = 2·${N2(o.Pm)}·${N2(o.T)}/π = ${N2(2 * o.Pm * o.T)}/π = ${N2(o.E)} kWh. Ortalama güç E/T = 2P_max/π = ${N2(o.Pavg)} kW (P_max'ın %63,7'si).`, `5. Number: E = 2·${N2(o.Pm)}·${N2(o.T)}/π = ${N2(2 * o.Pm * o.T)}/π = ${N2(o.E)} kWh. Mean power E/T = 2P_max/π = ${N2(o.Pavg)} kW (63.7 % of P_max).`);
    Ad(s, `6. En büyük güç: dP/dt = P_max(π/T)cos(πt/T) = 0 ⇒ πt/T = π/2 ⇒ t = T/2 = ${N2(o.T / 2)} h. İkinci türev −P_max(π/T)²sin(πt/T) < 0 ⇒ maksimum, P(T/2) = ${N2(o.Pm)} kW.`, `6. Greatest power: dP/dt = P_max(π/T)cos(πt/T) = 0 ⇒ πt/T = π/2 ⇒ t = T/2 = ${N2(o.T / 2)} h. Second derivative −P_max(π/T)²sin(πt/T) < 0 ⇒ maximum, P(T/2) = ${N2(o.Pm)} kW.`);
    Ad(s, `7. Birim dönüşümü: E = ${N2(o.E)} kWh·3600 = ${N2(o.EkJ)} kJ.`, `7. Unit conversion: E = ${N2(o.E)} kWh·3600 = ${N2(o.EkJ)} kJ.`);
    Ad(s, `8. Isınma: ΔT = E/(m·c) = ${N2(o.EkJ)}/(${N2(o.m)}·4,18) = ${N2(o.EkJ)}/${N2(o.m * 4.18)} = ${N2(o.dT)} K.`, `8. Heating: ΔT = E/(m·c) = ${N2(o.EkJ)}/(${N2(o.m)}·4.18) = ${N2(o.EkJ)}/${N2(o.m * 4.18)} = ${N2(o.dT)} K.`);
    Ad(s, `9. Yorum ve kontrol: yarım sinüsün alanı dikdörtgen P_max·T = ${N2(o.Pm * o.T)} kWh'nin 2/π = %63,7'sidir (${N2(o.E)} kWh) ✓. Gün ortasında güç en büyük olsa da enerji tüm gün boyunca birikir. Gölgeli alan E'dir.`, `9. Interpretation and check: the area of a half sine is 2/π = 63.7 % of the rectangle P_max·T = ${N2(o.Pm * o.T)} kWh (${N2(o.E)} kWh) ✓. Although the power peaks at midday, the energy accumulates over the whole day. The shaded area is E.`);
    break; }
    case 14: {
    const o = Mod(14, x);
    Ad(s, `1. Nicelikler: D = boru çapı (cm), D > 0; C(D) = yıllık toplam maliyet (TL/yıl); a = ${N2(o.a)} TL/yıl·cm, B = b·10⁶ = ${N2(o.B)} TL·cm⁵/yıl.`, `1. Quantities: D = pipe diameter (cm), D > 0; C(D) = yearly total cost (TL/yr); a = ${N2(o.a)} TL/yr·cm, B = b·10⁶ = ${N2(o.B)} TL·cm⁵/yr.`);
    Ad(s, `2. Hedef: C(D) = ${N2(o.a)}·D + ${N2(o.B)}·D⁻⁵ en küçük olsun.`, `2. Objective: minimise C(D) = ${N2(o.a)}·D + ${N2(o.B)}·D⁻⁵.`);
    Ad(s, `3. Türev (kuvvet kuralı): C′(D) = ${N2(o.a)} − 5·${N2(o.B)}·D⁻⁶ = ${N2(o.a)} − ${N2(5 * o.B)}/D⁶.`, `3. Derivative (power rule): C′(D) = ${N2(o.a)} − 5·${N2(o.B)}·D⁻⁶ = ${N2(o.a)} − ${N2(5 * o.B)}/D⁶.`);
    Ad(s, `4. C′(D) = 0 ⇒ D⁶ = 5B/a = ${N2(5 * o.B)}/${N2(o.a)} = ${N2(o.D6)}.`, `4. C′(D) = 0 ⇒ D⁶ = 5B/a = ${N2(5 * o.B)}/${N2(o.a)} = ${N2(o.D6)}.`);
    Ad(s, `5. Altıncı kök (D > 0): D* = (${N2(o.D6)})^(1/6) = ${N2(o.D)} cm.`, `5. Sixth root (D > 0): D* = (${N2(o.D6)})^(1/6) = ${N2(o.D)} cm.`);
    Ad(s, `6. İkinci türev: C″(D) = 30B·D⁻⁷ > 0 (D > 0) ⇒ D* bir MİNİMUM; C″(D*) = ${N2(30 * o.B / Math.pow(o.D, 7))} > 0.`, `6. Second derivative: C″(D) = 30B·D⁻⁷ > 0 (D > 0) ⇒ D* is a MINIMUM; C″(D*) = ${N2(30 * o.B / Math.pow(o.D, 7))} > 0.`);
    Ad(s, `7. Değer: boru ${N2(o.a)}·${N2(o.D)} = ${N2(o.pipe)}, pompa ${N2(o.B)}/${N2(o.D)}⁵ = ${N2(o.pump)}; C(D*) = ${N2(o.pipe)} + ${N2(o.pump)} = ${N2(o.C)} TL/yıl.`, `7. Value: pipe ${N2(o.a)}·${N2(o.D)} = ${N2(o.pipe)}, pump ${N2(o.B)}/${N2(o.D)}⁵ = ${N2(o.pump)}; C(D*) = ${N2(o.pipe)} + ${N2(o.pump)} = ${N2(o.C)} TL/yr.`);
    Ad(s, `8. Kontrol ve birim: C′ = 0'dan B/D*⁵ = a·D*/5 ⇒ C(D*) = (6/5)·a·D* = 1,2·${N2(o.pipe)} = ${N2(1.2 * o.pipe)} TL/yıl ✓. a·D [TL/yıl·cm × cm], B/D⁵ [TL·cm⁵/yıl ÷ cm⁵] ✓.`, `8. Check and units: from C′ = 0, B/D*⁵ = a·D*/5 ⇒ C(D*) = (6/5)·a·D* = 1.2·${N2(o.pipe)} = ${N2(1.2 * o.pipe)} TL/yr ✓. a·D [TL/yr·cm × cm], B/D⁵ [TL·cm⁵/yr ÷ cm⁵] ✓.`);
    Ad(s, `9. Yorum: optimumda boru maliyeti pompalama maliyetinin 5 katıdır (marjinal denge: a = 5B/D⁶). Küçük çap pompa maliyeti, büyük çap boru maliyeti yüzünden pahalıdır; minimum noktası düzdür, yani en yakın standart çap da yaklaşık aynı maliyeti verir. Sarı nokta minimumdur.`, `9. Interpretation: at the optimum the pipe cost is 5 times the pumping cost (marginal balance: a = 5B/D⁶). A small diameter is costly because of pumping, a large one because of the pipe; the minimum is flat, so the nearest standard diameter costs about the same. The gold point is the minimum.`);
    break; }
    default: {
    const o = Mod(15, x);
    Ad(s, `1. Nicelikler: w = ${N2(o.w)} m, θ = ${N2(o.th)}° (sinθ = ${F3(o.sn)}), s₁ = ${N2(o.s1)} m, s₂ = s₁ + L = ${N2(o.s2)} m, ρg = 9,81 kN/m³. Aranan: F [kN], s_cp [m].`, `1. Quantities: w = ${N2(o.w)} m, θ = ${N2(o.th)}° (sinθ = ${F3(o.sn)}), s₁ = ${N2(o.s1)} m, s₂ = s₁ + L = ${N2(o.s2)} m, ρg = 9.81 kN/m³. Wanted: F [kN], s_cp [m].`);
    Ad(s, `2. Derinlik h = s·sinθ ⇒ p(s) = ρg·s·sinθ. Birim uzunluk başına yük q(s) = p·w = ${F3(o.rg)}·s kN/m (ρg·w·sinθ = 9,81·${N2(o.w)}·${F3(o.sn)}).`, `2. Depth h = s·sinθ ⇒ p(s) = ρg·s·sinθ. Load per unit length q(s) = p·w = ${F3(o.rg)}·s kN/m (ρg·w·sinθ = 9.81·${N2(o.w)}·${F3(o.sn)}).`);
    Ad(s, `3. Kuvvet (yük diyagramının alanı): F = ∫_{s₁}^{s₂} q(s) ds = ${F3(o.rg)}∫ s ds = ${F3(o.rg)}·[s²/2]_{${N2(o.s1)}}^{${N2(o.s2)}}.`, `3. Force (area of the load diagram): F = ∫_{s₁}^{s₂} q(s) ds = ${F3(o.rg)}∫ s ds = ${F3(o.rg)}·[s²/2] from ${N2(o.s1)} to ${N2(o.s2)}.`);
    Ad(s, `4. [s²/2] = (${N2(o.s2 * o.s2)} − ${N2(o.s1 * o.s1)})/2 = ${N2((o.s2 * o.s2 - o.s1 * o.s1) / 2)} ⇒ F = ${F3(o.rg)}·${N2((o.s2 * o.s2 - o.s1 * o.s1) / 2)} = ${N2(o.F)} kN.`, `4. [s²/2] = (${N2(o.s2 * o.s2)} − ${N2(o.s1 * o.s1)})/2 = ${N2((o.s2 * o.s2 - o.s1 * o.s1) / 2)} ⇒ F = ${F3(o.rg)}·${N2((o.s2 * o.s2 - o.s1 * o.s1) / 2)} = ${N2(o.F)} kN.`);
    Ad(s, `5. Moment (O noktasına, yani su yüzeyine göre): M = ∫ s·q ds = ${F3(o.rg)}·[s³/3] = ${F3(o.rg)}·(${N2(Math.pow(o.s2, 3))} − ${N2(Math.pow(o.s1, 3))})/3 = ${N2(o.M)} kN·m.`, `5. Moment (about O, the water surface): M = ∫ s·q ds = ${F3(o.rg)}·[s³/3] = ${F3(o.rg)}·(${N2(Math.pow(o.s2, 3))} − ${N2(Math.pow(o.s1, 3))})/3 = ${N2(o.M)} kN·m.`);
    Ad(s, `6. Etki noktası: s_cp = M/F = ${N2(o.M)}/${N2(o.F)} = ${N2(o.scp)} m (= (2/3)(s₂³ − s₁³)/(s₂² − s₁²)); düşey derinlik h_cp = s_cp·sinθ = ${N2(o.scp * o.sn)} m.`, `6. Point of action: s_cp = M/F = ${N2(o.M)}/${N2(o.F)} = ${N2(o.scp)} m (= (2/3)(s₂³ − s₁³)/(s₂² − s₁²)); vertical depth h_cp = s_cp·sinθ = ${N2(o.scp * o.sn)} m.`);
    Ad(s, `7. Kontrol: ağırlık merkezi derinliği h_c = ((s₁ + s₂)/2)·sinθ = ${N2(o.hc)} m, A = w·L = ${N2(o.A)} m² ⇒ F = ρg·h_c·A = 9,81·${N2(o.hc)}·${N2(o.A)} = ${N2(9.81 * o.hc * o.A)} kN ✓.`, `7. Check: centroid depth h_c = ((s₁ + s₂)/2)·sinθ = ${N2(o.hc)} m, A = w·L = ${N2(o.A)} m² ⇒ F = ρg·h_c·A = 9.81·${N2(o.hc)}·${N2(o.A)} = ${N2(9.81 * o.hc * o.A)} kN ✓.`);
    Ad(s, `8. Birim kontrolü: [kN/m³]·[m]·[m]·[m] ... ρg·sinθ·w·s²: kN/m³ · m · m² = kN ✓; moment kN·m ✓.`, `8. Unit check: ρg·sinθ·w·s²: kN/m³ · m · m² = kN ✓; moment in kN·m ✓.`);
    Ad(s, `9. Yorum: ağırlık merkezi s = ${N2((o.s1 + o.s2) / 2)} m'dedir, etki noktası ${N2(o.scp)} m — ${N2(o.scp - (o.s1 + o.s2) / 2)} m daha AŞAĞIDA, çünkü basınç derinlikle artar. F ∝ sinθ: kapak yatıklaştıkça kuvvet azalır. Grafikte gölgeli alan F'dir.`, `9. Interpretation: the centroid is at s = ${N2((o.s1 + o.s2) / 2)} m, the point of action at ${N2(o.scp)} m — ${N2(o.scp - (o.s1 + o.s2) / 2)} m LOWER, because pressure grows with depth. F ∝ sinθ: the flatter the gate, the smaller the force. On the graph the shaded area is F.`);
    break; }
    }
    return s;
  }


  function draw(canvas, problem) {
    let x = problem.p;
    let accent = canvas.accent();
    switch (problem.scn) {
    case 0: {
    let ta = x[0], t0 = x[1], k = x[2], t = x[3];
    let d = t0 - ta, tt = ta + d * Math.exp(-k * t), rate = -k * (tt - ta);
    let tmax = Math.max(4 / k, t * 1.3);
    canvas.setViewport(-tmax * 0.05, tmax, ta - d * 0.15, t0 + d * 0.15);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : ta + d * Math.exp(-k * v))), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => tt + rate * (v - t)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'horizontal', position: ta, color: canvas.gray() });
    canvas.addMarker({ x: t, y: tt, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `T = ${N2(tt)}` });
    break; }
    case 1: {
    let t0 = x[0], tg = x[1], k = x[2];
    let tm = Math.log((t0 - 20) / (tg - 20)) / k, d = t0 - 20;
    let tmax = Math.max(4 / k, tm * 1.4);
    canvas.setViewport(-tmax * 0.05, tmax, 20 - d * 0.15, t0 + d * 0.15);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : 20 + d * Math.exp(-k * v))), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'horizontal', position: tg, color: canvas.gray() });
    canvas.addGuideLine({ axis: 'vertical', position: tm, color: canvas.gray() });
    canvas.addMarker({ x: tm, y: tg, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `t = ${N2(tm)}` });
    break; }
    case 2: {
    let th = x[0], tc = x[1], l = x[2];
    let tmid = (th + tc) / 2;
    canvas.setViewport(-l * 0.1, l * 1.1, tc - (th - tc) * 0.2, th + (th - tc) * 0.2);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 || v > l ? NaN : th + (tc - th) * v / l)), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: 0, y: th, color: canvas.red(), radius: 5.0, label: `${N2(th)} °C` });
    canvas.addMarker({ x: l, y: tc, color: canvas.blue(), radius: 5.0, label: `${N2(tc)} °C` });
    canvas.addMarker({ x: l / 2, y: tmid, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `T(L/2) = ${N2(tmid)}` });
    break; }
    case 3: {
    let a = x[1], b = x[2] / 1000, t2 = x[3];
    let c2 = a + b * t2;
    canvas.setViewport(-t2 * 0.08, t2 * 1.2, -c2 * 0.15, c2 * 1.4);
    canvas.addFilledArea({ evaluator: safe((v) => a + b * v), xMin: 20, xMax: t2, color: rgba(canvas.gold(), 0.353) });
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : a + b * v)), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: t2, y: c2, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `c(${N2(t2)}) = ${N2(c2)}` });
    break; }
    case 4: {
    let h0 = x[0], aa = x[1], hole = x[2] / 10000;
    let kk = (hole / aa) * Math.sqrt(G / 2), tt = Math.sqrt(h0) / kk;
    let sl = -2 * kk * Math.sqrt(h0);
    canvas.setViewport(-tt * 0.06, tt * 1.1, -h0 * 0.12, h0 * 1.3);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 || v > tt ? NaN : (Math.sqrt(h0) - kk * v) * (Math.sqrt(h0) - kk * v))), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => (v < 0 || v > tt ? NaN : h0 + sl * v)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: 0, y: h0, color: canvas.blue(), radius: 5.0, label: `h₀ = ${N2(h0)}` });
    canvas.addMarker({ x: tt, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `t = ${N2(tt)} s` });
    break; }
    case 5: {
    let vm = x[0], r = x[1];
    let gmax = 2 * Math.PI * vm * r * 0.385;
    canvas.setViewport(-r * 0.1, r * 1.1, -gmax * 0.15, gmax * 1.4);
    canvas.addFilledArea({ evaluator: safe((v) => 2 * Math.PI * v * vm * (1 - v * v / (r * r))), xMin: 0, xMax: r, color: rgba(canvas.gold(), 0.353) });
    canvas.addFunction({ evaluator: safe((v) => (v < 0 || v > r ? NaN : 2 * Math.PI * v * vm * (1 - v * v / (r * r)))), color: accent, thickness: 3.0 });
    let rp = r / Math.sqrt(3);
    canvas.addMarker({ x: rp, y: 2 * Math.PI * rp * vm * (1 - 1.0 / 3.0), color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `Q = ${N2(Math.PI * r * r * vm * 500)} L/s` });
    break; }
    case 6: {
    let n = x[0], tk = x[1], v1 = x[2], f = x[3];
    let nrt = n * RGas * tk, p1 = nrt / v1;
    canvas.setViewport(v1 * 0.4, v1 * (f + 0.6), 0, p1 * 1.6);
    canvas.addFilledArea({ evaluator: safe((v) => nrt / v), xMin: v1, xMax: f * v1, color: rgba(canvas.gold(), 0.353) });
    canvas.addFunction({ evaluator: safe((v) => (v <= 0 ? NaN : nrt / v)), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: f * v1, color: canvas.gray() });
    canvas.addMarker({ x: v1, y: p1, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `P₁ = ${N2(p1)} kPa` });
    break; }
    case 7: {
    let a = x[0], b = x[1];
    let sv = Math.sqrt(b / a), xs = sv - 2, cmin = a * xs + b / sv;
    let xm = 3 * sv;
    canvas.setViewport(-xm * 0.05, xm, -cmin * 0.15, cmin * 2.6);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : a * v + b / (v + 2))), color: accent, thickness: 3.0 });
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : a * v)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : b / (v + 2))), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'vertical', position: xs, color: canvas.gray() });
    canvas.addMarker({ x: xs, y: cmin, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `(${N2(xs)}, ${N2(cmin)})` });
    break; }
    case 8: {
    const o = Mod(8, x), g = o.g;
    const lo = (v) => (v < o.V2 || v > o.V1 ? NaN : o.K1 * Math.pow(v, -g));
    const hi = (v) => (v < o.V2 || v > o.V1 ? NaN : o.K2 * Math.pow(v, -g));
    canvas.setViewport(0, o.V1 * 1.12, 0, o.p3 * 1.2);
    canvas.addFilledArea({ evaluator: safe(hi), xMin: o.V2, xMax: o.V1, color: rgba(canvas.green(), 0.3) });
    canvas.addFilledArea({ evaluator: safe(lo), xMin: o.V2, xMax: o.V1, color: rgba(canvas.red(), 0.3) });
    Curve(canvas, lo, accent);
    Curve(canvas, hi, canvas.orange());
    canvas.addSegment({ x1: o.V2, y1: o.p2, x2: o.V2, y2: o.p3, color: canvas.gray(), thickness: 2.5 });
    canvas.addSegment({ x1: o.V1, y1: o.p1, x2: o.V1, y2: o.p4, color: canvas.gray(), thickness: 2.5 });
    canvas.addMarker({ x: o.V1, y: o.p1, color: canvas.blue(), radius: 5.0, label: '1' });
    canvas.addMarker({ x: o.V2, y: o.p2, color: canvas.blue(), radius: 5.0, label: '2' });
    canvas.addMarker({ x: o.V2, y: o.p3, color: canvas.blue(), radius: 5.0, label: '3' });
    canvas.addMarker({ x: o.V1, y: o.p4, color: canvas.blue(), radius: 5.0, label: '4' });
    canvas.addMarker({ x: (o.V1 + o.V2) / 2, y: (o.K1 + o.K2) / 2 * Math.pow((o.V1 + o.V2) / 2, -g), color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `W = ${N2(o.Wn)} J` });
    break; }
    case 9: {
    const o = Mod(9, x), Rm = o.R * 1000;
    const u = (r) => o.c * (o.R * o.R - r * r * 1e-6);
    const sl = o.dudrW / 1000;
    canvas.setViewport(-Rm * 0.1, Rm * 1.15, -o.umax * 0.15, o.umax * 1.4);
    canvas.addFilledArea({ evaluator: safe((v) => (v < 0 || v > Rm ? NaN : u(v))), xMin: 0, xMax: Rm, color: rgba(canvas.gold(), 0.353) });
    Curve(canvas, (v) => (v < 0 || v > Rm ? NaN : u(v)), accent);
    canvas.addFunction({ evaluator: safe((v) => (v < Rm * 0.5 || v > Rm * 1.05 ? NaN : sl * (v - Rm))), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: 0, y: o.umax, color: canvas.blue(), radius: 5.0, label: `u = ${Gs(o.umax)} m/s` });
    canvas.addMarker({ x: Rm, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `τ_w = ${Gs(o.tauw)} Pa` });
    break; }
    case 10: {
    const o = Mod(10, x), d = o.Ti - o.To;
    canvas.setViewport(o.ri - o.t * 0.15, o.ro + o.t * 0.15, o.To - d * 0.15, o.Ti + d * 0.15);
    Curve(canvas, (v) => (v < o.ri || v > o.ro ? NaN : o.Tr(v)), accent);
    canvas.addFunction({ evaluator: safe((v) => (v < o.ri || v > o.ro ? NaN : o.Ti - d * (v - o.ri) / o.t)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: o.ri, y: o.Ti, color: canvas.red(), radius: 5.0, label: `${N2(o.Ti)} °C` });
    canvas.addMarker({ x: o.ro, y: o.To, color: canvas.blue(), radius: 5.0, label: `${N2(o.To)} °C` });
    canvas.addMarker({ x: o.rg, y: o.Tr(o.rg), color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `T = ${N2(o.Tr(o.rg))}` });
    break; }
    case 11: {
    const o = Mod(11, x), d = o.Th - o.Tc;
    canvas.setViewport(-o.L * 0.08, o.L * 1.08, o.Tc - d * 0.15, o.Th + d * 0.15);
    Curve(canvas, (v) => (v < 0 || v > o.L ? NaN : o.Tx(v)), accent);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 || v > o.L ? NaN : o.Th - d * v / o.L)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addMarker({ x: 0, y: o.Th, color: canvas.red(), radius: 5.0, label: `${N2(o.Th)} °C` });
    canvas.addMarker({ x: o.L, y: o.Tc, color: canvas.blue(), radius: 5.0, label: `${N2(o.Tc)} °C` });
    canvas.addMarker({ x: o.L / 2, y: o.Tmid, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `T(L/2) = ${N2(o.Tmid)}` });
    break; }
    case 12: {
    const o = Mod(12, x), d = o.Ti - o.Tinf;
    const tmax = Math.max(4 * o.tau / 60, o.tm * 1.3);
    const rateM = o.rateS * 60;
    canvas.setViewport(-tmax * 0.05, tmax, o.Tinf - d * 0.1, o.Ti + d * 0.15);
    Curve(canvas, (v) => (v < 0 ? NaN : o.Tinf + d * Math.exp(-v * 60 / o.tau)), accent);
    canvas.addFunction({ evaluator: safe((v) => o.T + rateM * (v - o.tm)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'horizontal', position: o.Tinf, color: canvas.gray() });
    canvas.addMarker({ x: o.tm, y: o.T, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `T = ${N2(o.T)}` });
    break; }
    case 13: {
    const o = Mod(13, x);
    const P = (v) => (v < 0 || v > o.T ? NaN : o.Pm * Math.sin(Math.PI * v / o.T));
    canvas.setViewport(-o.T * 0.08, o.T * 1.08, -o.Pm * 0.15, o.Pm * 1.4);
    canvas.addFilledArea({ evaluator: safe(P), xMin: 0, xMax: o.T, color: rgba(canvas.gold(), 0.353) });
    Curve(canvas, P, accent);
    canvas.addMarker({ x: o.T / 2, y: o.Pm, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `P_max = ${N2(o.Pm)} kW` });
    canvas.addMarker({ x: o.T / 2, y: o.Pm * 0.45, color: canvas.blue(), radius: 4.0, label: `E = ${N2(o.E)} kWh` });
    break; }
    case 14: {
    const o = Mod(14, x);
    const xm = 2.2 * o.D, ym = o.C * 2.6;
    canvas.setViewport(-xm * 0.05, xm, -ym * 0.1, ym);
    Curve(canvas, (v) => (v <= 0 ? NaN : o.a * v + o.B / Math.pow(v, 5)), accent);
    canvas.addFunction({ evaluator: safe((v) => (v < 0 ? NaN : o.a * v)), color: canvas.gray(), thickness: 2.0, dashed: true });
    canvas.addFunction({ evaluator: safe((v) => (v <= 0 ? NaN : o.B / Math.pow(v, 5))), color: canvas.green(), thickness: 2.0, dashed: true });
    canvas.addGuideLine({ axis: 'vertical', position: o.D, color: canvas.gray() });
    canvas.addMarker({ x: o.D, y: o.C, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `(${N2(o.D)}, ${N2(o.C)})` });
    break; }
    default: {
    const o = Mod(15, x);
    const q = (v) => (v < o.s1 || v > o.s2 ? NaN : o.rg * v);
    canvas.setViewport(-o.s2 * 0.06, o.s2 * 1.1, -o.rg * o.s2 * 0.12, o.rg * o.s2 * 1.35);
    canvas.addFilledArea({ evaluator: safe(q), xMin: o.s1, xMax: o.s2, color: rgba(canvas.gold(), 0.353) });
    Curve(canvas, (v) => (v < 0 || v > o.s2 ? NaN : o.rg * v), accent);
    canvas.addGuideLine({ axis: 'vertical', position: (o.s1 + o.s2) / 2, color: canvas.gray() });
    canvas.addMarker({ x: o.scp, y: o.rg * o.scp, color: canvas.gold(), shape: 'diamond', radius: 7.0, label: `s_cp = ${N2(o.scp)} m` });
    canvas.addMarker({ x: o.s2, y: o.rg * o.s2, color: canvas.blue(), radius: 5.0, label: `F = ${N2(o.F)} kN` });
    break; }
    }
  }


  function Meaning(p) { return MeaningBase(p) + '\n\n' + MeaningExtra(p.scn); }

  function Overview() {
    return tx("MÜHENDİSLİK UYGULAMASI: ISI VE AKIŞKANLAR\nIsı geçişi ve akışkanlar mekaniğinde değişim hızları (türev) fiziksel yasaları verir; toplam ısı, debi ve iş ise integralle bulunur.\n\nTANIM VE FORMÜLLER\n• Newton soğuma yasası: dT/dt = −k(T − Tₐ); çözüm T(t) = Tₐ + (T₀ − Tₐ)e^(−kt). Hedefe varma süresi t = (1/k)·ln[(T₀ − Tₐ)/(T* − Tₐ)].\n• Fourier iletimi: q = −k·dT/dx; duvarda sıcaklık doğrusaldır, q = k(Tₕ − T_c)/L [W/m²].\n• Değişken özgül ısı: Q = ∫ m·c(T) dT = m·∫ (a + bT) dT [kJ].\n• Torricelli: v = √(2gh); tank boşalması A·dh/dt = −a·√(2gh) → h(t) = (√h₀ − κt)².\n• Boru debisi: Q = ∫₀ᴿ v(r)·2πr dr; parabolik profilde v = v_max(1 − r²/R²) ve Q = ½·π·R²·v_max.\n• İdeal gaz: PV = nRT (R = 8,314 J/mol·K); izotermal iş W = ∫ P dV = nRT ln(V₂/V₁).\n• Optimum yalıtım: toplam maliyet C(x) = a·x + b/(x + 2) → C′ = a − b/(x + 2)² = 0 → x* = √(b/a) − 2.\n• Adyabatik / Otto işi: pV^γ = K ⇒ W = ∫p dV = K[V^(1−γ)/(1−γ)]; çevrimin net işi p–V alanıdır, η = 1 − r^(1−γ).\n• Laminer boru akışı: u(r) = (−dp/dx)(R² − r²)/(4μ); τ_w = −μ·du/dr|_R = (−dp/dx)R/2; Q = ∫u·2πr dr = π(−dp/dx)R⁴/(8μ).\n• Silindirik duvarda iletim: Q′ = −k·2πr·dT/dr sabit ⇒ T(r) logaritmik, Q′ = 2πk(Tᵢ − T_o)/ln(r_o/rᵢ).\n• Sıcaklığa bağlı k(T) = k₀(1 + βT): q·L = k₀[T + βT²/2] sınırlar arası (değişkenleri ayır).\n• Toplu kapasite: m·c·dT/dt = −hA(T − T∞) ⇒ T = T∞ + (Tᵢ − T∞)e^(−t/τ), τ = mc/hA; atılan ısı Q = ∫hA(T − T∞) dt.\n• Değişken güçten enerji: E = ∫P(t) dt (eğri altındaki alan), en büyük güç dP/dt = 0.\n• Boru çapı optimizasyonu: C(D) = aD + B/D⁵ ⇒ D* = (5B/a)^(1/6).\n• Hidrostatik kuvvet: p = ρg·s·sinθ, F = ∫p·w ds, s_cp = ∫s·p·w ds / F.\n\nYÖNTEM\n1. Büyüklükleri ve birimleri yaz (°C ya da K, m, s, kPa, J).\n2. Sorunun \"hız mı\" (türev) yoksa \"toplam mı\" (integral) olduğuna karar ver.\n3. Modeli kur; üstel çözümlerde zincir kuralını, integrallerde sınırları dikkatle uygula.\n4. Ters türev / sıfır noktası ile çöz; sayıları yerine koy.\n5. Birim ve mantık kontrolü yap (soğuma negatif hız, debi pozitif ...).\n\nÖZEL DURUMLAR VE TUZAKLAR\n• Gaz yasalarında sıcaklık MUTLAKA kelvindir (T[K] = T[°C] + 273,15).\n• ln ile log₁₀'u karıştırmayın; üstel zamanlarda k'nın birimine (1/dk, 1/s) dikkat edin.\n• cm² → m² (×10⁻⁴) ve L → m³ (×10⁻³) dönüşümlerini unutmayın.\n• T → Tₐ yaklaşırken soğuma yavaşlar; ΔT = 0 hedefi sonlu sürede ulaşılamaz.\n\nMİNİ ÖRNEK\nT₀ = 90 °C, Tₐ = 20 °C, k = 0,1 1/dk, t = 10 dk: T = 20 + 70·e^(−1) ≈ 45,75 °C; dT/dt = −k(T − Tₐ) ≈ −2,58 °C/dk.\n\nHAFIZA KURALI\n\"Fark kadar hız\": soğuma hızı sıcaklık farkıyla orantılıdır (Newton). \"Toplam = alan\": ısı ve iş, eğri altındaki alandır.",
      "ENGINEERING APPLICATION: HEAT AND FLUIDS\nIn heat transfer and fluid mechanics, rates of change (derivatives) express the physical laws, while total heat, flow rate and work come from integrals.\n\nDEFINITIONS AND FORMULAS\n• Newton's law of cooling: dT/dt = −k(T − Tₐ); solution T(t) = Tₐ + (T₀ − Tₐ)e^(−kt). Time to reach a target: t = (1/k)·ln[(T₀ − Tₐ)/(T* − Tₐ)].\n• Fourier conduction: q = −k·dT/dx; in a wall the temperature is linear, q = k(Tₕ − T_c)/L [W/m²].\n• Variable specific heat: Q = ∫ m·c(T) dT = m·∫ (a + bT) dT [kJ].\n• Torricelli: v = √(2gh); tank draining A·dh/dt = −a·√(2gh) → h(t) = (√h₀ − κt)².\n• Pipe flow rate: Q = ∫₀ᴿ v(r)·2πr dr; for a parabolic profile v = v_max(1 − r²/R²) and Q = ½·π·R²·v_max.\n• Ideal gas: PV = nRT (R = 8.314 J/mol·K); isothermal work W = ∫ P dV = nRT ln(V₂/V₁).\n• Optimum insulation: total cost C(x) = a·x + b/(x + 2) → C′ = a − b/(x + 2)² = 0 → x* = √(b/a) − 2.\n• Adiabatic / Otto work: pV^γ = K ⇒ W = ∫p dV = K[V^(1−γ)/(1−γ)]; the net work of a cycle is the p–V area, η = 1 − r^(1−γ).\n• Laminar pipe flow: u(r) = (−dp/dx)(R² − r²)/(4μ); τ_w = −μ·du/dr|_R = (−dp/dx)R/2; Q = ∫u·2πr dr = π(−dp/dx)R⁴/(8μ).\n• Conduction in a cylindrical wall: Q′ = −k·2πr·dT/dr constant ⇒ T(r) is logarithmic, Q′ = 2πk(Tᵢ − T_o)/ln(r_o/rᵢ).\n• Temperature-dependent k(T) = k₀(1 + βT): q·L = k₀[T + βT²/2] between the limits (separate variables).\n• Lumped capacitance: m·c·dT/dt = −hA(T − T∞) ⇒ T = T∞ + (Tᵢ − T∞)e^(−t/τ), τ = mc/hA; heat removed Q = ∫hA(T − T∞) dt.\n• Energy from variable power: E = ∫P(t) dt (area under the curve), greatest power at dP/dt = 0.\n• Pipe-diameter optimisation: C(D) = aD + B/D⁵ ⇒ D* = (5B/a)^(1/6).\n• Hydrostatic force: p = ρg·s·sinθ, F = ∫p·w ds, s_cp = ∫s·p·w ds / F.\n\nMETHOD\n1. Write the quantities and units (°C or K, m, s, kPa, J).\n2. Decide whether the question asks for a \"rate\" (derivative) or a \"total\" (integral).\n3. Set up the model; apply the chain rule carefully for exponentials and the limits for integrals.\n4. Solve with the antiderivative / zero of the derivative; substitute the numbers.\n5. Unit and sanity check (cooling is a negative rate, flow rate positive ...).\n\nSPECIAL CASES AND PITFALLS\n• In gas laws the temperature MUST be in kelvin (T[K] = T[°C] + 273.15).\n• Do not mix ln and log₁₀; watch the unit of k (1/min, 1/s) in exponentials.\n• Remember cm² → m² (×10⁻⁴) and L → m³ (×10⁻³).\n• Cooling slows down as T → Tₐ; a target equal to Tₐ is never reached in finite time.\n\nMINI EXAMPLE\nT₀ = 90 °C, Tₐ = 20 °C, k = 0.1 1/min, t = 10 min: T = 20 + 70·e^(−1) ≈ 45.75 °C; dT/dt = −k(T − Tₐ) ≈ −2.58 °C/min.\n\nMEMORY AID\n\"Rate proportional to the difference\": cooling speed ∝ temperature difference (Newton). \"Total = area\": heat and work are areas under curves.");
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

  // ---------- schematic (engineering sketch beside the graph) ----------
  const lerp = (v, a, b, A, B) => A + (B - A) * clamp((v - a) / ((b - a) || 1), 0, 1);
  const lg10 = (v) => Math.log10(Math.max(v, 1e-9));
  function soft(col, a) { const r = rgba(col, a); return typeof r === 'string' ? r : 'rgba(128,140,170,' + a + ')'; }
  function gaugeV(sc, gx, gy, gw, gh, frac, col, name, val) {
    sc.gauge(gx, gy, gw, gh, frac, col);
    sc.text(gx + gw / 2, gy - 3.4, name, { size: 3, bold: true });
    sc.text(gx + gw / 2, gy - 7.4, val, { size: 2.7 });
  }

  // hot block cooling in air with three thermometer bars (scenarios 1 and 13)
  function schCoolBlock(sc, c) {
    sc.line(6, 34, 46, 34, { w: 0.8 });
    sc.rect(10, 34, 32, 24, { fill: soft(sc.c.heat, 0.3), w: 0.9 });
    sc.text(26, 50, c.label, { size: 3.4, bold: true });
    sc.text(26, 42, c.label2, { size: 3 });
    [17, 26, 35].forEach((ax) => sc.arrow(ax, 60, ax, 60 + c.len, { color: sc.c.heat, w: 0.8, head: 2.2 }));
    sc.text(26, 27, c.l1, { size: 3 });
    sc.text(26, 21, c.l2, { size: 2.7 });
    gaugeV(sc, 54, 26, 7, 46, clamp(c.T0 / 130, 0, 1), sc.c.steel, 'T₀', `${N2(c.T0)} °C`);
    gaugeV(sc, 68, 26, 7, 46, clamp(c.T / 130, 0, 1), sc.c.heat, 'T(t)', `${N2(c.T)} °C`);
    gaugeV(sc, 82, 26, 7, 46, clamp(c.Ta / 130, 0, 1), sc.c.cold, 'T∞', `${N2(c.Ta)} °C`);
  }

  // wall with heat-flow arrows and temperature profile (scenarios 3 and 12)
  function schWall(sc, P) {
    const wl = 50 - P.w / 2, wr = 50 + P.w / 2;
    sc.rect(wl, 24, P.w, 52, { fill: soft(sc.c.steel, 0.25), w: 0.9 });
    const dT = (P.Th - P.Tc) || 1, yAt = (T) => 32 + 38 * clamp((T - P.Tc) / dT, 0, 1);
    sc.line(wl, 70, wr, 32, { dash: [2, 1.5], color: sc.c.sub, w: 0.4 });
    const pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([wl + P.w * u, yAt(P.prof(u))]); }
    sc.poly(pts, { close: false, color: sc.c.heat, w: 0.9 });
    const len = lerp(lg10(P.q), 1.7, 4.0, 6, 17);
    [36, 50, 64].forEach((ay) => {
      sc.arrow(wl - 4 - len, ay, wl - 4, ay, { color: sc.c.heat, w: 0.8, head: 2.2 });
      sc.arrow(wr + 4, ay, wr + 4 + len, ay, { color: sc.c.cold, w: 0.8, head: 2.2 });
    });
    sc.circle(50, yAt(P.prof(0.5)), 1.4, { fill: sc.c.gold });
    sc.text(22, 82, `Tₕ = ${N2(P.Th)} °C`, { size: 3, color: sc.c.heat, bold: true });
    sc.text(78, 82, `T_c = ${N2(P.Tc)} °C`, { size: 3, color: sc.c.cold, bold: true });
    sc.text(50, 88, `q = ${N2(P.q)} W/m²`, { size: 3.2, bold: true });
    sc.text(50, 80, `T(L/2) = ${N2(P.prof(0.5))} °C`, { size: 2.8 });
    sc.dim(wl, 18, wr, 18, `L = ${N2(P.L)} m`);
    sc.text(50, 9, P.foot, { size: 2.9 });
  }

  // pipe with velocity-profile arrows (scenarios 6 and 10)
  function schPipeProfile(sc, o) {
    const cy = 46, x0 = 8, x1 = 92, t = 2.5, xs = 24;
    sc.rect(x0, cy + o.Rv, x1 - x0, t, { fill: soft(sc.c.steel, 0.4), w: 0.7 });
    sc.rect(x0, cy - o.Rv - t, x1 - x0, t, { fill: soft(sc.c.steel, 0.4), w: 0.7 });
    sc.line(x0, cy, x1, cy, { dash: [3, 2], color: sc.c.sub, w: 0.3 });
    const env = [];
    for (let i = 0; i <= 16; i++) { const rho = -1 + i / 8; env.push([xs + o.L0 * (1 - rho * rho), cy + rho * o.Rv]); }
    [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].forEach((rho) => {
      const ln = o.L0 * (1 - rho * rho);
      if (ln > 1) sc.arrow(xs, cy + rho * o.Rv, xs + ln, cy + rho * o.Rv, { color: sc.c.load, w: 0.6, head: 1.8 });
    });
    sc.poly(env, { close: false, color: sc.c.load, w: 0.8 });
    sc.line(xs, cy - o.Rv, xs, cy + o.Rv, { dash: [1.5, 1.5], color: sc.c.sub, w: 0.3 });
    sc.flow(52, cy, 70, cy, 2);
    sc.dim(76, cy, 76, cy + o.Rv, o.rLabel, { tx: 11, ty: 0, size: 2.8 });
    sc.text(50, 84, o.t1, { size: 3.1, bold: true });
    sc.text(50, 79, o.t2, { size: 2.8 });
    sc.text(50, 17, o.b1, { size: 3.1, bold: true });
    sc.text(50, 11, o.b2, { size: 2.8 });
  }

  function drawSchematicRaw(sc, problem) {
    const x = problem.p, k = sc.c, mn = tx('dk', 'min');
    switch (problem.scn) {
    case 0: {
      const ta = x[0], t0 = x[1], kk = x[2], t = x[3];
      const T = ta + (t0 - ta) * Math.exp(-kk * t), rate = -kk * (T - ta);
      sc.title(tx('Newton soğuma yasası', "Newton's law of cooling"));
      schCoolBlock(sc, { label: `T = ${N2(T)} °C`, label2: `t = ${N2(t)} ${mn}`, len: lerp(Math.sqrt(Math.abs(rate)), 0, 4.2, 3, 15), T0: t0, T, Ta: ta,
        l1: `dT/dt = ${N2(rate)} °C/${mn}`, l2: `k = ${N2(kk)} 1/${mn}` });
      break; }
    case 1: {
      const t0 = x[0], tg = x[1], kk = x[2], tm = Math.log((t0 - 20) / (tg - 20)) / kk;
      sc.title(tx('Hedef sıcaklığa varma süresi', 'Time to reach a target'));
      sc.rect(4, 30, 92, 46, { fill: soft(k.cold, 0.1), color: k.sub, w: 0.4, dash: [2, 1.5] });
      sc.text(50, 34, `Tₐ = 20 °C ${tx('(ortam)', '(ambient)')}`, { size: 3, color: k.cold, bold: true });
      sc.rect(8, 44, 28, 20, { fill: soft(k.heat, 0.3), w: 0.9 });
      sc.text(22, 54, `${N2(t0)} °C`, { size: 3.4, bold: true });
      sc.text(22, 68, 'T₀', { size: 3, bold: true });
      sc.rect(64, 44, 28, 20, { fill: soft(k.heat, 0.12), w: 0.9, dash: [2, 1.5] });
      sc.text(78, 54, `${N2(tg)} °C`, { size: 3.4, bold: true });
      sc.text(78, 68, 'T*', { size: 3, bold: true });
      sc.arrow(39, 54, 61, 54, { color: k.accent, w: 0.9, head: 2.4 });
      sc.text(50, 60, `t = ${N2(tm)} ${mn}`, { size: 3.2, bold: true });
      sc.text(50, 48, `k = ${N2(kk)} 1/${mn}`, { size: 2.8 });
      sc.text(50, 21, 'T(t) = 20 + (T₀ − 20)e^(−kt)', { size: 3 });
      sc.text(50, 14, 't = (1/k)·ln[(T₀ − 20)/(T* − 20)]', { size: 2.8 });
      break; }
    case 2: {
      const th = x[0], tc = x[1], l = x[2], kk = x[3], q = kk * (th - tc) / l;
      sc.title(tx('Düz duvarda iletim (Fourier)', 'Conduction through a wall (Fourier)'));
      schWall(sc, { Th: th, Tc: tc, L: l, q, w: lerp(l, 0.1, 0.4, 8, 24), prof: (u) => th + (tc - th) * u,
        foot: `k = ${N2(kk)} W/m·K,  q = −k·dT/dx` });
      break; }
    case 3: {
      const m = x[0], a = x[1], b = x[2] / 1000, t2 = x[3];
      const q = m * (a * (t2 - 20) + b / 2 * (t2 * t2 - 400));
      sc.title(tx('Değişken özgül ısı ile ısıtma', 'Heating with variable specific heat'));
      sc.line(6, 36, 40, 36, { w: 0.8 });
      sc.rect(8, 36, 30, 22, { fill: soft(k.heat, 0.3), w: 0.9 });
      sc.text(23, 50, `m = ${N2(m)} kg`, { size: 3.2, bold: true });
      sc.text(23, 43, `20 → ${N2(t2)} °C`, { size: 3 });
      const al = lerp(q, 0, 2400, 5, 11);
      [14, 23, 32].forEach((ax) => sc.arrow(ax, 34 - al, ax, 34, { color: k.heat, w: 0.8, head: 2.2 }));
      sc.text(23, 30 - al, `Q = ${N2(q)} kJ`, { size: 3.1, bold: true });
      const cmax = a + b * 320, px = (T) => 58 + 32 * T / 320, py = (c) => 26 + 34 * c / cmax;
      sc.line(58, 26, 92, 26, { w: 0.5 }); sc.line(58, 26, 58, 62, { w: 0.5 });
      const pts = [[px(20), 26]];
      for (let i = 0; i <= 12; i++) { const T = 20 + (t2 - 20) * i / 12; pts.push([px(T), py(a + b * T)]); }
      pts.push([px(t2), 26]);
      sc.poly(pts, { fill: soft(k.gold, 0.35), color: k.accent, w: 0.8 });
      sc.text(75, 67, 'c(T) = a + bT', { size: 2.9 });
      sc.text(px(20), 22, '20', { size: 2.7 });
      sc.text(px(t2), 22, `${N2(t2)}`, { size: 2.7 });
      sc.text(75, 16, 'T (°C)', { size: 2.7 });
      sc.text(54, 61, 'c', { size: 2.9 });
      break; }
    case 4: {
      const h0 = x[0], A = x[1], a = x[2], hole = a / 10000;
      const v = Math.sqrt(2 * G * h0), dh = -(hole / A) * v, kk = (hole / A) * Math.sqrt(G / 2), tt = Math.sqrt(h0) / kk;
      sc.title(tx('Tank boşalması (Torricelli)', 'Tank draining (Torricelli)'));
      const tw = lerp(A, 1, 4, 16, 34), tl = 48 - tw / 2, tr = tl + tw, frac = clamp(h0 / 10, 0, 1);
      sc.ground(7, 94, 16);
      sc.line(tl + 2, 28, tl + 2, 16, { w: 0.8 }); sc.line(tr - 2, 28, tr - 2, 16, { w: 0.8 });
      sc.tank(tl, 28, tw, 52, frac);
      const hh = lerp(a, 10, 40, 2, 5), yb = 29 + hh / 2;
      sc.rect(tr - 0.6, 29, 1.2, hh, { fill: k.bg, stroke: false });
      const rj = lerp(Math.sqrt(h0), 1, 3, 8, 24), jet = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; jet.push([tr + rj * u, yb - (yb - 17) * u * u]); }
      sc.poly(jet, { close: false, color: k.fluid, w: 1.3 });
      sc.arrow(jet[7][0], jet[7][1], jet[8][0], jet[8][1], { color: k.fluid, w: 0.8, head: 2.2 });
      sc.dim(tl - 4, 28, tl - 4, 28 + 52 * frac, `h = ${N2(h0)} m`, { tx: -10, ty: 0 });
      sc.text(50, 10, `v = √(2gh) = ${N2(v)} m/s,  dh/dt = ${N2(dh * 1000)} mm/s`, { size: 2.9, bold: true });
      sc.text(50, 5.6, `A = ${N2(A)} m²,  a = ${N2(a)} cm²,  ${tx('boşalma', 'empty in')} ${N2(tt)} s`, { size: 2.8 });
      break; }
    case 5: {
      const vm = x[0], r = x[1], Q = Math.PI * r * r * vm / 2;
      sc.title(tx('Borudaki hız profili ve debi', 'Pipe velocity profile and flow rate'));
      schPipeProfile(sc, { Rv: lerp(r, 0.05, 0.2, 8, 22), L0: lerp(vm, 1, 4, 8, 24), rLabel: `R = ${N2(r)} m`,
        t1: `v_max = ${N2(vm)} m/s`, t2: 'v(r) = v_max(1 − r²/R²)',
        b1: `Q = ${N2(Q * 1000)} L/s`, b2: `v̄ = Q/(πR²) = ${N2(vm / 2)} m/s` });
      break; }
    case 6: {
      const n = x[0], tk = x[1], v1 = x[2], f = x[3], nrt = n * RGas * tk, p1 = nrt / v1, w = nrt * Math.log(f);
      sc.title(tx('İzotermal genleşme p–V', 'Isothermal expansion p–V'));
      const pY = 52 / f;
      sc.pistonCylinder(10, 22, 26, 56, pY);
      sc.line(8, 22 + 52, 38, 22 + 52, { dash: [2, 1.5], color: k.sub, w: 0.5 });
      sc.text(41, 22 + pY + 1.3, `V₁ = ${N2(v1)} L`, { size: 2.9, align: 'left' });
      sc.text(41, 22 + 52 + 1.3, `V₂ = ${N2(f * v1)} L`, { size: 2.9, align: 'left' });
      sc.arrow(23, 10, 23, 21, { color: k.heat, w: 0.9, head: 2.4 });
      sc.text(23, 5.5, `Q = W,  T = ${N2(tk)} K`, { size: 2.8 });
      const fr = clamp((lg10(p1) - 1.7) / 1.5, 0, 1), ang = (210 - 240 * fr) * Math.PI / 180;
      sc.circle(73, 62, 10, { fill: k.fill, w: 0.8 });
      sc.line(73, 62, 73 + 8 * Math.cos(ang), 62 + 8 * Math.sin(ang), { color: k.heat, w: 1 });
      sc.circle(73, 62, 1.2, { fill: k.ink });
      sc.text(73, 55.5, 'kPa', { size: 2.4 });
      sc.text(73, 46, `P₁ = ${N2(p1)} kPa`, { size: 2.9, bold: true });
      sc.text(73, 40, `P₂ = ${N2(p1 / f)} kPa`, { size: 2.9 });
      sc.text(73, 33, `n = ${N2(n)} mol`, { size: 2.8 });
      sc.text(73, 27, `W = ${N2(w)} J`, { size: 3, bold: true });
      break; }
    case 7: {
      const a = x[0], b = x[1], sv = Math.sqrt(b / a), xs = sv - 2, cmin = a * xs + b / sv;
      sc.title(tx('Optimum yalıtım kalınlığı', 'Optimum insulation thickness'));
      const cx = 40, cy = 54, t = lerp(xs, 3, 18, 5, 13), ro = 11 + t;
      sc.circle(cx, cy, ro, { fill: k.fill, w: 0.9 });
      sc.circle(cx, cy, 11, { fill: soft(k.heat, 0.35), w: 0.9 });
      sc.text(cx, cy, tx('sıcak boru', 'hot pipe'), { size: 2.6 });
      const al = 2 + 14 * (2 / (xs + 2));
      [20, 80, 140, 200, 260, 320].forEach((d) => {
        const c1 = Math.cos(d * Math.PI / 180), s1 = Math.sin(d * Math.PI / 180);
        sc.arrow(cx + (ro + 1.2) * c1, cy + (ro + 1.2) * s1, cx + (ro + 1.2 + al) * c1, cy + (ro + 1.2 + al) * s1, { color: k.heat, w: 0.8, head: 2.2 });
      });
      sc.dim(cx + 11, cy, cx + ro, cy, 'x*', { ty: 2.8, size: 2.6 });
      sc.text(50, 14, `x* = √(b/a) − 2 = ${N2(xs)} cm`, { size: 3, bold: true });
      sc.text(50, 8.5, `C(x*) = ${N2(cmin)} TL/m²  (a = ${N2(a)}, b = ${N2(b)})`, { size: 2.8 });
      break; }
    case 8: {
      const o = Mod(8, x);
      sc.title(tx('Otto çevrimi: p–V alanı = net iş', 'Otto cycle: p–V area = net work'));
      sc.pistonCylinder(8, 24, 18, 44, 38);
      sc.line(7, 24 + 38 / o.r, 27, 24 + 38 / o.r, { dash: [2, 1.5], color: k.sub, w: 0.5 });
      sc.text(29, 24 + 38, 'V₁', { size: 3, align: 'left' });
      sc.text(29, 24 + 38 / o.r, 'V₂', { size: 3, align: 'left' });
      sc.text(17, 19, `r = ${N2(o.r)}`, { size: 3, bold: true });
      const X = (V) => 46 + 44 * V / o.V1, Y = (p) => 26 + 50 * p / o.p3, pts = [];
      for (let i = 0; i <= 14; i++) { const V = o.V1 + (o.V2 - o.V1) * i / 14; pts.push([X(V), Y(o.K1 * Math.pow(V, -o.g))]); }
      for (let i = 0; i <= 14; i++) { const V = o.V2 + (o.V1 - o.V2) * i / 14; pts.push([X(V), Y(o.K2 * Math.pow(V, -o.g))]); }
      sc.line(46, 26, 94, 26, { w: 0.5 }); sc.line(46, 26, 46, 80, { w: 0.5 });
      sc.poly(pts, { fill: soft(k.gold, 0.3), color: k.accent, w: 0.8 });
      sc.text(70, 21, 'V', { size: 2.9 }); sc.text(42, 80, 'p', { size: 2.9 });
      sc.text(X(o.V1) + 2.5, Y(o.p1) - 2.5, '1', { size: 2.8, bold: true });
      sc.text(X(o.V2) - 2.5, Y(o.p2) - 2.5, '2', { size: 2.8, bold: true });
      sc.text(X(o.V2) - 2.5, Y(o.p3) + 2.5, '3', { size: 2.8, bold: true });
      sc.text(X(o.V1) + 2.5, Y(o.p4) + 2.5, '4', { size: 2.8, bold: true });
      sc.text(50, 13, `W_net = ${N2(o.Wn)} J,  η = ${N2(o.eta * 100)} %`, { size: 3, bold: true });
      sc.text(50, 8, `p₁ = ${N2(o.p1)} kPa,  V₁ = ${N2(o.V1)} L,  ρ = ${N2(o.rho)}`, { size: 2.7 });
      break; }
    case 9: {
      const o = Mod(9, x), cy = 46, Rv = lerp(x[2], 5, 20, 8, 20);
      sc.title(tx('Laminer boru akışı (Poiseuille)', 'Laminar pipe flow (Poiseuille)'));
      schPipeProfile(sc, { Rv, L0: lerp(Math.sqrt(o.umax), 0.08, 1.42, 6, 22), rLabel: `R = ${N2(x[2])} mm`,
        t1: `u_max = ${Gs(o.umax)} m/s,  τ_w = ${Gs(o.tauw)} Pa`, t2: `−dp/dx = ${N2(o.Gp)} Pa/m,  μ = ${N2(x[0])} mPa·s`,
        b1: `Q = ${N2(o.Q * 1e6)} mL/s`, b2: `v̄ = ${Gs(o.vbar)} m/s = u_max/2` });
      const tl = lerp(o.tauw, 0.25, 4, 5, 13), ty = cy + Rv + 2.5 + 3;
      sc.arrow(52, ty, 52 + tl, ty, { color: k.bad, w: 0.8, head: 2 });
      sc.text(52 + tl + 2, ty, 'τ_w', { size: 2.8, align: 'left', color: k.bad });
      break; }
    case 10: {
      const o = Mod(10, x), s = 2.2, cx = 40, cy = 54;
      sc.title(tx('Silindirik duvarda iletim', 'Conduction in a cylindrical wall'));
      sc.circle(cx, cy, o.ro * s, { fill: k.fill, w: 0.9 });
      sc.circle(cx, cy, o.ri * s, { fill: soft(k.heat, 0.35), w: 0.9 });
      const al = lerp(lg10(o.Q), 1.5, 4.0, 3, 9);
      for (let i = 0; i < 8; i++) {
        const d = (22.5 + 45 * i) * Math.PI / 180, c1 = Math.cos(d), s1 = Math.sin(d), r0 = o.ro * s + 1;
        sc.arrow(cx + r0 * c1, cy + r0 * s1, cx + (r0 + al) * c1, cy + (r0 + al) * s1, { color: k.heat, w: 0.8, head: 2.2 });
      }
      sc.dim(cx, cy, cx + o.ri * s, cy, 'rᵢ', { ty: 2.8, size: 2.6 });
      sc.dim(cx + o.ri * s, cy, cx + o.ro * s, cy, 't', { ty: 2.8, size: 2.6 });
      sc.text(50, 12, `Tᵢ = ${N2(o.Ti)} °C → T_o = ${N2(o.To)} °C,  Q′ = ${N2(o.Q)} W/m`, { size: 2.9, bold: true });
      sc.text(50, 7, `rᵢ = ${N2(o.ri)} cm,  t = ${N2(o.t)} cm,  k = ${N2(o.k)} W/m·K`, { size: 2.8 });
      break; }
    case 11: {
      const o = Mod(11, x);
      sc.title(tx('Değişken iletkenlikli duvar', 'Wall with variable conductivity'));
      schWall(sc, { Th: o.Th, Tc: o.Tc, L: o.L, q: o.q, w: lerp(o.L, 0.1, 0.3, 12, 24), prof: (u) => o.Tx(o.L * u),
        foot: `k(T) = k₀(1 + βT),  k₀ = ${N2(o.k0)} W/m·K,  β = ${F3(o.be)} 1/K` });
      break; }
    case 12: {
      const o = Mod(12, x);
      sc.title(tx('Toplu kapasite: motor bloğu', 'Lumped capacitance: engine block'));
      schCoolBlock(sc, { label: `m = ${N2(o.m)} kg`, label2: `t = ${N2(o.tm)} ${mn}`, len: lerp(Math.sqrt(o.P), 0, 100, 3, 15), T0: o.Ti, T: o.T, Ta: o.Tinf,
        l1: `P = hA(T − T∞) = ${N2(o.P)} W`, l2: `τ = ${N2(o.tau)} s,  Q = ${N2(o.Q)} kJ` });
      break; }
    case 13: {
      const o = Mod(13, x);
      sc.title(tx('Güneş kolektörü enerjisi', 'Solar-collector energy'));
      sc.circle(12, 80, 5, { fill: soft(k.gold, 0.5), color: k.gold, w: 0.8 });
      const sy = 58 + 4 * o.Pm;
      [24, 32, 40].forEach((rx) => sc.arrow(rx + 4, sy, rx, 50, { color: k.gold, w: 0.8, head: 2.2 }));
      sc.poly([[10, 30], [36, 30], [42, 46], [16, 46]], { fill: soft(k.steel, 0.35), w: 0.9 });
      sc.line(26, 30, 26, 22, { color: k.heat, w: 1 });
      sc.tank(16, 8, 22, 14, 0.6);
      sc.text(27, 15, `ΔT = ${N2(o.dT)} K`, { size: 2.7, bold: true });
      const X = (t) => 54 + 38 * t / o.T, Y = (p) => 26 + 32 * p / o.Pm, pts = [[X(0), 26]];
      for (let i = 0; i <= 16; i++) { const t = o.T * i / 16; pts.push([X(t), Y(o.Pm * Math.sin(Math.PI * t / o.T))]); }
      pts.push([X(o.T), 26]);
      sc.line(54, 26, 94, 26, { w: 0.5 }); sc.line(54, 26, 54, 62, { w: 0.5 });
      sc.poly(pts, { fill: soft(k.gold, 0.35), color: k.accent, w: 0.8 });
      sc.text(74, 67, 'P(t) = P_max·sin(πt/T)', { size: 2.8 });
      sc.text(X(o.T / 2), Y(o.Pm) + 2.8, `${N2(o.Pm)} kW`, { size: 2.7 });
      sc.text(X(0), 22, '0', { size: 2.7 }); sc.text(X(o.T), 22, `${N2(o.T)} h`, { size: 2.7 });
      sc.text(74, 14, `E = ${N2(o.E)} kWh`, { size: 3.2, bold: true });
      break; }
    case 14: {
      const o = Mod(14, x), Dv = lerp(o.D, 9, 18, 7, 14), cy = 50;
      sc.title(tx('En ekonomik boru çapı', 'Most economical pipe diameter'));
      sc.circle(14, cy, 5.5, { fill: k.fill, w: 0.9 });
      sc.poly([[12, cy + 3], [12, cy - 3], [17, cy]], { fill: k.steel, w: 0.6 });
      sc.text(14, cy - 10, tx('pompa', 'pump'), { size: 2.7 });
      sc.pipe(19.5, cy, 52, cy, Dv, { fill: soft(k.fluid, 0.2) });
      sc.flow(22, cy, 36, cy, 2);
      sc.dim(44, cy - Dv / 2, 44, cy + Dv / 2, `D* = ${N2(o.D)} cm`, { tx: 0, ty: Dv / 2 + 4, size: 2.8 });
      const Cm = 1300, bar = (bx, v, col, nm) => {
        const hb = 40 * clamp(v / Cm, 0.02, 1);
        sc.rect(bx, 24, 8, hb, { fill: soft(col, 0.55), w: 0.7 });
        sc.text(bx + 4, 24 + hb + 3, N2(v), { size: 2.7 });
        sc.text(bx + 4, 20, nm, { size: 2.6 });
      };
      sc.line(58, 24, 94, 24, { w: 0.5 });
      bar(60, o.pipe, k.steel, tx('boru', 'pipe')); bar(72, o.pump, k.fluid, tx('pompa', 'pump')); bar(84, o.C, k.heat, tx('toplam', 'total'));
      sc.text(76, 75, tx('Maliyet (TL/yıl)', 'Cost (TL/yr)'), { size: 2.9 });
      sc.text(28, 22, 'D* = (5B/a)^(1/6)', { size: 2.9 });
      sc.text(28, 15, `a = ${N2(o.a)},  B = ${N2(o.B / 1e6)}·10⁶`, { size: 2.7 });
      break; }
    default: {
      const o = Mod(15, x), sn = o.sn, cs = Math.abs(o.cs) < 1e-9 ? 0 : o.cs, u8 = 8, ox = 26, oy = 76;
      sc.title(tx('Eğik kapağa hidrostatik kuvvet', 'Hydrostatic force on an inclined gate'));
      const P = (s) => [ox + s * u8 * cs, oy - s * u8 * sn];
      const pe = P(o.s2);
      sc.poly([[ox, oy], pe, [90, pe[1]], [90, oy]], { fill: k.fluidSoft, stroke: false });
      sc.line(ox, oy, 94, oy, { color: k.fluid, w: 0.7 });
      sc.text(92, oy + 3, '▽', { size: 3, color: k.fluid });
      sc.text(ox - 3, oy + 3.5, 'O', { size: 2.9, bold: true });
      sc.line(ox, oy, pe[0], pe[1], { w: 0.5 });
      const p1 = P(o.s1), p2 = pe;
      sc.line(p1[0], p1[1], p2[0], p2[1], { w: 2, color: k.steelDark });
      for (let i = 0; i <= 4; i++) {
        const s = o.s1 + o.Lg * i / 4, b = P(s), ln = 2 + 14 * (s * sn) / 6;
        sc.arrow(b[0] + sn * ln, b[1] + cs * ln, b[0], b[1], { color: k.load, w: 0.6, head: 1.8 });
      }
      const cp = P(o.scp);
      sc.circle(cp[0], cp[1], 1.5, { fill: k.gold });
      sc.dim(p1[0], p1[1], p2[0], p2[1], `L = ${N2(o.Lg)} m`, { offset: -5, tx: -sn * 6.5, ty: -cs * 6.5, size: 2.8 });
      sc.text(50, 14, `F = ${N2(o.F)} kN,  s_cp = ${N2(o.scp)} m`, { size: 3, bold: true });
      sc.text(50, 8.5, `θ = ${N2(o.th)}°,  w = ${N2(o.w)} m,  s₁ = ${N2(o.s1)} m`, { size: 2.8 });
      break; }
    }
  }
  function drawSchematic(sc, problem) {
    try { drawSchematicRaw(sc, problem); } catch (e) { /* a sketch must never break the page */ }
  }

  Topics.register('engineering', {
    id: 'engThermoFluid',
    tabTitle: () => tx("Isı ve Akışkanlar", "Heat & Fluids"),
    concept,
    problemStatement,
    createProblem,
    solveSteps: EngAssume.wrap("thermo", Steps),
    draw,
    drawSchematic,
    buildControls,
    links: [
      { match: /^• (Newton soğuma|Newton.s law)/, make: (rng) => makeScn(rng, 0) },
      { match: /^• (Fourier)/, make: (rng) => makeScn(rng, 2) },
      { match: /^• (Değişken özgül|Variable specific)/, make: (rng) => makeScn(rng, 3) },
      { match: /^• (Torricelli)/, make: (rng) => makeScn(rng, 4) },
      { match: /^• (Boru debisi|Pipe flow rate)/, make: (rng) => makeScn(rng, 5) },
      { match: /^• (İdeal gaz|Ideal gas)/, make: (rng) => makeScn(rng, 6) },
      { match: /^• (Optimum yalıtım|Optimum insulation)/, make: (rng) => makeScn(rng, 7) },
      { match: /^• (Adyabatik|Adiabatic)/, make: (rng) => makeScn(rng, 8) },
      { match: /^• (Laminer boru|Laminar pipe)/, make: (rng) => makeScn(rng, 9) },
      { match: /^• (Silindirik duvarda|Conduction in a cylindrical)/, make: (rng) => makeScn(rng, 10) },
      { match: /^• (Sıcaklığa bağlı|Temperature-dependent)/, make: (rng) => makeScn(rng, 11) },
      { match: /^• (Toplu kapasite|Lumped capacitance)/, make: (rng) => makeScn(rng, 12) },
      { match: /^• (Değişken güçten|Energy from variable)/, make: (rng) => makeScn(rng, 13) },
      { match: /^• (Boru çapı|Pipe-diameter)/, make: (rng) => makeScn(rng, 14) },
      { match: /^• (Hidrostatik|Hydrostatic)/, make: (rng) => makeScn(rng, 15) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
    _schematicRaw: drawSchematicRaw,
  });
})();
