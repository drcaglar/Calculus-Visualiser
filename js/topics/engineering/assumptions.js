// "Varsayımlar ve birimler" / "Assumptions and units": one line per engineering scenario, appended to the end of its solution.
// Index = scenario number (problem.scn) of the tab. EngAssume.wrap(key, Steps) returns a solveSteps function that adds the line.
// The audit (harness2.js, mode "units") checks that every scenario of every tab ends with such a line.
(function () {
  const A = {
    statics: [
      ['Yük şiddeti doğrusal artıyor (üçgen yayılı yük); yük düşey, mesnetler tam rijit; birimler: w kN/m, uzunluk m, bileşke kN, moment kN·m.', 'Load intensity grows linearly (triangular distributed load); load is vertical, supports perfectly rigid; units: w kN/m, length m, resultant kN, moment kN·m.'],
      ['Basit mesnetli, ağırlığı ihmal edilen kiriş; düzgün yayılı yük; küçük şekil değişimi; birimler: V kN, M kN·m, w kN/m, x m.', 'Simply supported beam, self-weight neglected; uniform load; small deformations; units: V kN, M kN·m, w kN/m, x m.'],
      ['Basit mesnetli kiriş, kendi ağırlığı ihmal; yayılı yük + tek tekil yük (süperpozisyon geçerli); birimler: R kN, M kN·m, x m.', 'Simply supported beam, self-weight neglected; distributed load + one point load (superposition valid); units: R kN, M kN·m, x m.'],
      ['Homojen ince levha (yoğunluk sabit, kalınlık sabit); ağırlık merkezi alan merkezidir; birimler: alan m², moment m³, x̄ ve ȳ m.', 'Homogeneous thin plate (constant density and thickness); centroid equals the area centre; units: area m², first moment m³, x̄ and ȳ m.'],
      ['Dikdörtgen kesit, homojen malzeme, eğilme eksenleri asal eksenler; birimler: b, h mm; I mm⁴.', 'Rectangular section, homogeneous material, bending about a principal axis; units: b, h mm; I mm⁴.'],
      ['Ankastre konsol, Euler–Bernoulli kirişi (kesme şekil değişimi yok), küçük sehim, EI sabit; birimler: P kN, L m, EI kN·m², sehim m.', 'Cantilever, Euler–Bernoulli beam (no shear deformation), small deflection, constant EI; units: P kN, L m, EI kN·m², deflection m.'],
      ['Tek eksenli çekme, doğrusal-elastik bölge sonrası kabaca idealleştirilmiş; ‰ = binde bir birim şekil değiştirme; birimler: σ MPa, E GPa, W (alan) MPa·‰.', 'Uniaxial tension, idealised beyond the linear-elastic range; ‰ = strain in parts per thousand; units: σ MPa, E GPa, area MPa·‰.'],
      ['Dikdörtgen kesit, M sabit, yalnızca eğilme gerilmesi (σ = M/S); kesit alanı sınırlı; birimler: b, h mm, S mm³, σ MPa, M N·mm.', 'Rectangular section, constant M, bending stress only (σ = M/S); fixed constraint; units: b, h mm, S mm³, σ MPa, M N·mm.'],
      ['Ankastre konsol, serbest uçtan ölçülen üçgen yayılı yük; ağırlık ihmal; birimler: w kN/m, x m, V kN, M kN·m.', 'Cantilever with triangular load measured from the free end; self-weight neglected; units: w kN/m, x m, V kN, M kN·m.'],
      ['Basit mesnetli kiriş, düzgün yayılı yük, EI sabit, küçük sehim; çift integrasyonda sınır koşulları δ(0) = δ(L) = 0; birimler: m, kN, EI kN·m².', 'Simply supported beam, uniform load, constant EI, small deflection; double integration with δ(0) = δ(L) = 0; units: m, kN, EI kN·m².'],
      ['Dairesel kesitli mil, doğrusal-elastik, sabit G, saf burulma, kesit düzlemleri düz kalır; birimler: T kN·m, d mm, φ rad.', 'Circular shaft, linear-elastic, constant G, pure torsion, plane sections stay plane; units: T kN·m, d mm, φ rad.'],
      ['İki eğri arasındaki alan, eğriler kesişim noktalarında sınırlı; üst eğri − alt eğri; birimler: cm ve cm².', 'Area between two curves bounded by their intersection points; upper minus lower; units: cm and cm².'],
      ['Durgun, sıkıştırılamaz akışkan (sabit ρ); basınç yalnızca derinliğe bağlı (p = ρg·y); atmosfer basıncı ihmal (etkin basınç); birimler: kPa, m, kN.', 'Static, incompressible fluid (constant ρ); pressure depends on depth only (p = ρg·y); atmospheric pressure ignored (gauge pressure); units: kPa, m, kN.'],
      ['Kablo tam esnek, ağırlığı ihmal; yük yatay izdüşüm başına düzgün (parabol kablo); birimler: w kN/m, L m, çekme kN.', 'Cable perfectly flexible, self-weight neglected; load uniform per horizontal projection (parabolic cable); units: w kN/m, L m, tension kN.'],
      ['Doğrusal değişen kesit alanı, tek eksenli yük, kesit küçük açıyla değişir (bir boyutlu model); birimler: A mm², P N, uzama mm.', 'Linearly varying cross-section, uniaxial load, small taper angle (one-dimensional model); units: A mm², P N, elongation mm.'],
      ['Dairesel kütükten dikdörtgen kesit; yalnızca eğilme dayanımı enbüyüklenir; kısıt b² + h² = D²; birimler: mm, mm³.', 'Rectangular section cut from a circular log; only bending strength is maximised; constraint b² + h² = D²; units: mm, mm³.'],
    ],
    dynamics: [
      ['Doğrusal (tek boyutlu) hareket; s(t) türevlenebilir; birimler: s m, v m/s, a m/s², t s.', 'Linear (one-dimensional) motion; s(t) differentiable; units: s m, v m/s, a m/s², t s.'],
      ['Doğrusal hareket, a(t) verilmiş; başlangıç koşulları v(0) ve s(0) bilinir; birimler: m, m/s, m/s², s.', 'Linear motion with given a(t); initial conditions v(0) and s(0) known; units: m, m/s, m/s², s.'],
      ['Eğik/yatay atış; hava direnci yok, g sabit, düz zemin; yatay hız sabit; birimler: m, m/s, s.', 'Projectile; no air drag, constant g, level ground; horizontal speed constant; units: m, m/s, s.'],
      ['Sabit yavaşlama; düz yol; km/sa → m/s için ÷3,6; birimler: m/s, m/s², m, s.', 'Constant deceleration on a straight road; km/h → m/s by ÷3.6; units: m/s, m/s², m, s.'],
      ['Doğrusal (Hooke) yay: F = kx, küçük uzama, kütlesiz yay; iş W = ∫F dx; birimler: x m, F N, W J.', 'Linear (Hooke) spring: F = kx, small stretch, massless spring; work W = ∫F dx; units: x m, F N, W J.'],
      ['Basit harmonik hareket; sönüm yok; yay kütlesiz; birimler: x m, ω rad/s, k N/m, m kg.', 'Simple harmonic motion; no damping; massless spring; units: x m, ω rad/s, k N/m, m kg.'],
      ['Sabit eksen etrafında dönüş; θ türevlenebilir; birimler: θ rad, ω rad/s, α rad/s², N dev/dk (1 dev = 2π rad).', 'Rotation about a fixed axis; θ differentiable; units: θ rad, ω rad/s, α rad/s², N rev/min (1 rev = 2π rad).'],
      ['Güç zamanla değişir, kayıplar ihmal; E = ∫P dt; birimler: P kW, t s, E kJ (kW·s = kJ).', 'Power varies with time, losses ignored; E = ∫P dt; units: P kW, t s, E kJ (kW·s = kJ).'],
      ['Doğrusal, tek serbestlik dereceli sönümlü titreşim (viskoz sönüm); alt sönümlü (ζ < 1); birimler: x mm, σ ve ωₙ 1/s ya da rad/s.', 'Linear single-degree-of-freedom damped vibration (viscous damping); underdamped (ζ < 1); units: x mm, σ and ωₙ 1/s or rad/s.'],
      ['Harmonik zorlama, kararlı hal; sönüm viskoz; birimler: F₀ N, k kN/m (N/mm), δ mm, r boyutsuz.', 'Harmonic forcing, steady state; viscous damping; units: F₀ N, k kN/m (N/mm), δ mm, r dimensionless.'],
      ['Kol-biyel mekanizması, sabit dönüş hızı, rijit uzuvlar; birimler: r mm→m, ω rad/s, ivme m/s².', 'Slider-crank mechanism, constant crank speed, rigid links; units: r mm→m, ω rad/s, acceleration m/s².'],
      ['Moment zamanla periyodik; volan rijit; kayıp ihmal; Cs boyutsuz (%); birimler: T N·m, E J, I kg·m².', 'Periodic torque; rigid flywheel; losses ignored; Cs dimensionless (%); units: T N·m, E J, I kg·m².'],
      ['Darbe: impuls = ∫F dt = Δ(mv); tek eksen; F(t) yarım sinüs; birimler: F N, t s, impuls N·s, v m/s.', 'Impact: impulse = ∫F dt = Δ(mv); single axis; half-sine F(t); units: F N, t s, impulse N·s, v m/s.'],
      ['Roket, düşey çıkış, g sabit, sabit yakıt debisi ve egzoz hızı, hava direnci yok; birimler: u m/s, µ kg/s, m kg, v m/s.', 'Rocket, vertical launch, constant g, constant mass-flow and exhaust speed, no drag; units: u m/s, µ kg/s, m kg, v m/s.'],
      ['Kam–izleyici, rijit, sürtünmesiz; kaldırma fonksiyonu sürekli türevlenebilir; birimler: h mm→m, ω rad/s, hız m/s, ivme m/s².', 'Cam–follower, rigid, frictionless; smooth lift function; units: h mm→m, ω rad/s, speed m/s, acceleration m/s².'],
      ['Eğik düzlemde kaymadan yuvarlanma; rijit silindir, sabit g; enerji korunur; birimler: m, kg, m/s, J.', 'Rolling without slipping down an incline; rigid cylinder, constant g; energy conserved; units: m, kg, m/s, J.'],
    ],
    materials: [
      ['Deneysel bir ikinci derece model, yalnızca verilen P aralığında geçerli; birimler: P W, d µm.', 'An empirical quadratic model, valid only in the given P range; units: P W, d µm.'],
      ['Sabit lazer gücü ve tarama hızı; enerji yoğunluğu E = P/(v·h·t); µm → mm; birimler: J/mm³, W = J/s.', 'Constant laser power and scan speed; energy density E = P/(v·h·t); µm → mm; units: J/mm³, W = J/s.'],
      ['Üstel (güç) yasası modeli V = k·v^(3/2), deneysel; birimler: v mm/s, V mm³.', 'Empirical power-law model V = k·v^(3/2); units: v mm/s, V mm³.'],
      ['Homojen, izotropik malzeme; α sabit (sıcaklıktan bağımsız); birimler: L mm, α 1/K, ΔT K, ΔL mm.', 'Homogeneous, isotropic material; α constant (temperature independent); units: L mm, α 1/K, ΔT K, ΔL mm.'],
      ['Newton soğuması, sabit ortam sıcaklığı, tek parça (toplu kapasite); birimler: T °C, t s, dT/dt °C/s.', 'Newton cooling, constant ambient temperature, lumped capacity; units: T °C, t s, dT/dt °C/s.'],
      ['Basquin yorulma modeli S = A·N^(−b), yüksek çevrim aralığı (N ≥ 10³), ortalama gerilme etkisi ihmal; birimler: S MPa, N çevrim.', 'Basquin fatigue model S = A·N^(−b), high-cycle range (N ≥ 10³), mean-stress effect ignored; units: S MPa, N cycles.'],
      ['Maliyet modeli C(t) = a/t + b·t, t > 0; kalınlık sürekli değişken kabul edilir; birimler: t µm, C TL.', 'Cost model C(t) = a/t + b·t, t > 0; thickness treated as continuous; units: t µm, C TL.'],
      ['Taylor takım ömrü V·Tⁿ = C; sabit kesme koşulları (ilerleme, derinlik); birimler: V m/dk, T dk.', 'Taylor tool life V·Tⁿ = C; constant cutting conditions (feed, depth); units: V m/min, T min.'],
      ['σ(ε) = E·ε − c·ε² tek eksenli çekme; tepe değerinde kopma varsayılır; birimler: σ MPa, ε boyutsuz, E MPa.', 'σ(ε) = E·ε − c·ε² in uniaxial tension; failure assumed at the peak; units: σ MPa, ε dimensionless, E MPa.'],
      ['Birinci mertebe sistem, basamak girişi, sıfır başlangıç koşulu; birimler: y °C, t s, τ s.', 'First-order system, step input, zero initial condition; units: y °C, t s, τ s.'],
      ['Alt sönümlü ikinci mertebe sistem (ζ < 1), birim basamak girişi; birimler: σ 1/s, ω rad/s, t s.', 'Underdamped second-order system (ζ < 1), step input; units: σ 1/s, ω rad/s, t s.'],
      ['Maliyet = kesme maliyeti + takım maliyeti; V sürekli değişken; birimler: V m/dk, C TL, A TL·m/dk, B TL·dk²/m².', 'Cost = machining + tooling; V continuous; units: V m/min, C TL, A TL·m/min, B TL·min²/m².'],
      ['Rulman ömrü L₁₀ = (C/P)³ (bilye rulman), sabit yük ve hız; birimler: C, P kN, L₁₀ milyon devir.', 'Bearing life L₁₀ = (C/P)³ (ball bearing), constant load and speed; units: C, P kN, L₁₀ million revolutions.'],
      ['Doğrusal olmayan yay F(x) = k·x + c·x³; statik yükleme, küçük sönüm; birimler: x mm, F N, k N/mm, c N/mm³, iş N·mm.', 'Non-linear spring F(x) = k·x + c·x³; static loading; units: x mm, F N, k N/mm, c N/mm³, work N·mm.'],
      ['Periyodik moment, volan rijit, kayıp ihmal; birimler: T N·m, n dev/dk, ω rad/s, E J.', 'Periodic torque, rigid flywheel, losses ignored; units: T N·m, n rev/min, ω rad/s, E J.'],
      ['Paris yasası da/dN = C·(ΔK)ᵐ; sabit gerilme aralığı; çatlak uzunluğu a m; birimler: ΔK MPa√m, a m, N çevrim.', 'Paris law da/dN = C·(ΔK)ᵐ; constant stress range; crack length a m; units: ΔK MPa√m, a m, N cycles.'],
    ],
    thermo: [
      ['Newton soğuması, toplu kapasite (Bi küçük), sabit ortam sıcaklığı; birimler: T °C, t dk, k 1/dk.', 'Newton cooling, lumped capacity (small Bi), constant ambient temperature; units: T °C, t min, k 1/min.'],
      ['Newton soğuması, k sabit; hedef sıcaklık ortamdan yüksek; birimler: T °C, t dk, k 1/dk.', 'Newton cooling, constant k; target above ambient; units: T °C, t min, k 1/min.'],
      ['Kararlı hal, tek boyutlu iletim, sabit k, yan yüzeylerde ısı kaybı yok; birimler: x m, T °C, k W/m·K, q W/m².', 'Steady state, one-dimensional conduction, constant k, no side losses; units: x m, T °C, k W/m·K, q W/m².'],
      ['Isınma sırasında faz değişimi yok; c sıcaklığa doğrusal bağlı; kütle sabit; birimler: m kg, c kJ/kg·K, Q kJ.', 'No phase change while heating; c linear in temperature; constant mass; units: m kg, c kJ/kg·K, Q kJ.'],
      ['Torricelli: v = √(2gh) (viskozite ve sürtünme ihmal), delik küçük; birimler: h m, A m², debi m³/s, t s.', 'Torricelli: v = √(2gh) (viscosity and friction ignored), small orifice; units: h m, A m², flow m³/s, t s.'],
      ['Laminer, tam gelişmiş, eksenel simetrik akış; hız profili paraboliktir; birimler: v m/s, r m, Q m³/s ve L/s.', 'Laminar, fully developed, axisymmetric flow; parabolic velocity profile; units: v m/s, r m, Q m³/s and L/s.'],
      ['İdeal gaz, tersinir izotermal süreç; T sabit; birimler: n mol, R J/mol·K, T K, V L (oran kullanıldığı için L olabilir), W J.', 'Ideal gas, reversible isothermal process; T constant; units: n mol, R J/mol·K, T K, V L (ratio only), W J.'],
      ['Maliyet = yalıtım + ısı kaybı, x sürekli değişken; birimler: x cm, C TL/m².', 'Cost = insulation + heat loss, x continuous; units: x cm, C TL/m².'],
      ['Hava-standart Otto/Diesel çevrimi, ideal gaz, sabit γ, tersinir süreçler; birimler: p kPa, V L, W J (kPa·L = J).', 'Air-standard Otto/Diesel cycle, ideal gas, constant γ, reversible processes; units: p kPa, V L, W J (kPa·L = J).'],
      ['Laminer, tam gelişmiş boru akışı (Poiseuille), Newton tipi akışkan; birimler: μ Pa·s, R m, G Pa/m, hız m/s.', 'Laminar, fully developed pipe flow (Poiseuille), Newtonian fluid; units: µ Pa·s, R m, G Pa/m, speed m/s.'],
      ['Kararlı hal, radyal iletim, silindirik duvar, sabit k, uzun boru (uç etkisi yok); birimler: r cm→m, k W/m·K, Q′ W/m.', 'Steady-state radial conduction, cylindrical wall, constant k, long pipe (no end effects); units: r cm→m, k W/m·K, Q′ W/m.'],
      ['Kararlı hal, tek boyutlu iletim, k sıcaklığa doğrusal bağlı; birimler: x m, T °C ya da K, k W/m·K, q W/m².', 'Steady state, one-dimensional conduction, k linear in temperature; units: x m, T °C or K, k W/m·K, q W/m².'],
      ['Toplu kapasite (Bi < 0,1), sabit h ve ortam sıcaklığı; birimler: m kg, c J/kg·K, hA W/K, T °C, t s.', 'Lumped capacity (Bi < 0.1), constant h and ambient temperature; units: m kg, c J/kg·K, hA W/K, T °C, t s.'],
      ['Isıtma gücü zamanla değişir, kayıplar ihmal; E = ∫P dt; 1 kWh = 3600 kJ; birimler: P kW, t h, E kWh.', 'Heating power varies with time, losses ignored; E = ∫P dt; 1 kWh = 3600 kJ; units: P kW, t h, E kWh.'],
      ['Maliyet = boru + pompalama, D sürekli değişken; birimler: D cm, C TL/yıl.', 'Cost = pipe + pumping, D continuous; units: D cm, C TL/year.'],
      ['Eğik dikdörtgen kapak, durgun akışkan, etkin basınç; birimler: s m, F kN, s_cp m (basınç merkezi).', 'Inclined rectangular gate, static fluid, gauge pressure; units: s m, F kN, s_cp m (centre of pressure).'],
    ],
  };
  window.EngAssume = {
    data: A,
    wrap(key, Steps) {
      return function (problem) {
        const s = Steps(problem);
        const row = A[key] && A[key][problem.scn];
        if (row && Array.isArray(s)) s.push(I18N.tx('★ Varsayımlar ve birimler: ' + row[0], '★ Assumptions and units: ' + row[1]));
        return s;
      };
    },
  };
})();
