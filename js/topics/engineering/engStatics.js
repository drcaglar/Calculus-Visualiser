// Ported from Modules/EngineeringApplications/EngStaticsControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/limits/realLifeLimits.js): sixteen engineering scenarios (8 original + 8 added, each with a live schematic) with a scenario selector, live sliders,
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

  function Titles() {
    return [ tx("1. Üçgen yayılı yük: bileşke ve etki çizgisi", "1. Triangular load: resultant and line of action"), tx("2. Kesme kuvveti ve eğilme momenti (düzgün yük)", "2. Shear force and bending moment (uniform load)"), tx("3. Maksimum eğilme momenti (V = 0)", "3. Maximum bending moment (V = 0)"), tx("4. y = kx² altındaki alanın ağırlık merkezi", "4. Centroid of the area under y = kx²"), tx("5. Dikdörtgenin atalet momenti I = ∫y² dA", "5. Second moment of area of a rectangle I = ∫y² dA"), tx("6. Ankastre kirişte sehim (M/EI integrali)", "6. Cantilever deflection (integrating M/EI)"), tx("7. Gerilme-birim şekil değiştirme: E ve enerji", "7. Stress-strain: modulus E and energy density"), tx("8. Optimum kesit: en küçük eğilme gerilmesi", "8. Optimum section: minimum bending stress") ].concat(ExtTitles());
  }


  function Specs(scn) {
    if (scn >= 8) return ExtSpecs(scn);
    switch (scn) {
    case 0: {
    return [Spec(tx("a (w = a·x, kN/m²)", "a (w = a·x, kN/m²)"), 2, 6, 2), Spec(tx("Açıklık L (m)", "Span L (m)"), 3, 9, 3)];
    break; }
    case 1: {
    return [Spec(tx("Yayılı yük w (kN/m)", "Uniform load w (kN/m)"), 2, 10, 2), Spec(tx("Açıklık L (m)", "Span L (m)"), 2, 8, 2)];
    break; }
    case 2: {
    return [Spec(tx("Yayılı yük w (kN/m)", "Uniform load w (kN/m)"), 2, 4, 2), Spec(tx("x = 8 m'deki tekil yük P (kN)", "Point load P at x = 8 m (kN)"), 10, 20, 10)];
    break; }
    case 3: {
    return [Spec(tx("k (y = k·x²)", "k (y = k·x²)"), 1, 4, 1), Spec(tx("Genişlik b", "Width b"), 3, 6, 3)];
    break; }
    case 4: {
    return [Spec(tx("Genişlik b (mm)", "Width b (mm)"), 40, 120, 40), Spec(tx("Yükseklik h (mm)", "Height h (mm)"), 60, 180, 60)];
    break; }
    case 5: {
    return [Spec(tx("Uç yükü P (kN)", "End load P (kN)"), 6, 18, 6), Spec(tx("Boy L (m)", "Length L (m)"), 2, 6, 2), Spec(tx("Eğilme rijitliği EI (kN·m²)", "Flexural rigidity EI (kN·m²)"), 4000, 12000, 4000)];
    break; }
    case 6: {
    return [Spec(tx("Elastisite modülü E (GPa)", "Young's modulus E (GPa)"), 50, 200, 50), Spec(tx("Akma birim şekil değiştirmesi (‰)", "Yield strain (‰)"), 1, 4, 1)];
    break; }
    default: {
    return [Spec(tx("Kısıt: b + 2h = c (mm)", "Constraint: b + 2h = c (mm)"), 90, 270, 90), Spec(tx("Eğilme momenti M (kN·m)", "Bending moment M (kN·m)"), 2, 8, 2)];
    break; }
    }
  }


  function Question(p) {
    if (p.scn >= 8) return ExtQuestion(p);
    let x = p.p;
    switch (p.scn) {
    case 0: {
    return tx(`Bir kirişin üzerindeki yayılı yük, soldaki mesnetten x kadar uzaklıkta w(x) = ${N2(x[0])}·x kN/m şeklinde (sıfırdan doğrusal artan) değişiyor ve kiriş ${N2(x[1])} m uzunluğunda. Yükün toplamı (bileşke) kaç kN'dur ve soldaki mesnetten kaç metrede etki eder?`, `The distributed load on a beam varies with the distance x from the left support as w(x) = ${N2(x[0])}·x kN/m (rising linearly from zero) over a length of ${N2(x[1])} m. What is the total load (resultant) in kN and at what distance from the left support does it act?`);
    break; }
    case 1: {
    return tx(`${N2(x[1])} m açıklıklı basit mesnetli bir kirişe her yerde w = ${N2(x[0])} kN/m düzgün yayılı yük etki ediyor. Yükü iki kez integre ederek V(x) kesme kuvvetini ve M(x) eğilme momentini bulun; orta noktadaki momenti hesaplayın.`, `A simply supported beam of span ${N2(x[1])} m carries a uniform load w = ${N2(x[0])} kN/m everywhere. Integrate the load twice to find the shear force V(x) and bending moment M(x), then compute the moment at midspan.`);
    break; }
    case 2: {
    return tx(`10 m açıklıklı basit mesnetli bir kirişe her yerde w = ${N2(x[0])} kN/m düzgün yük ve sol mesnetten 8 m'de P = ${N2(x[1])} kN tekil yük etki ediyor. 0 ≤ x ≤ 8 m bölgesinde maksimum eğilme momenti nerede oluşur ve değeri kaç kN·m'dir?`, `A simply supported beam of span 10 m carries a uniform load w = ${N2(x[0])} kN/m everywhere and a point load P = ${N2(x[1])} kN at 8 m from the left support. Where does the maximum bending moment occur in the region 0 ≤ x ≤ 8 m and what is its value in kN·m?`);
    break; }
    case 3: {
    return tx(`Bir levhanın kesiti, y = ${N2(x[0])}·x² eğrisi, x ekseni ve x = ${N2(x[1])} doğrusu ile sınırlıdır. Kesit alanını ve ağırlık merkezinin (x̄, ȳ) koordinatlarını integral ile bulun.`, `The cross-section of a plate is bounded by the curve y = ${N2(x[0])}·x², the x-axis and the line x = ${N2(x[1])}. Find the area and the centroid coordinates (x̄, ȳ) by integration.`);
    break; }
    case 4: {
    return tx(`Genişliği b = ${N2(x[0])} mm ve yüksekliği h = ${N2(x[1])} mm olan dikdörtgen kesitin ağırlık merkezinden geçen yatay eksene göre atalet momenti I = ∫y² dA değerini bulun (mm⁴).`, `Find the second moment of area I = ∫y² dA of a rectangular section of width b = ${N2(x[0])} mm and height h = ${N2(x[1])} mm about the horizontal axis through its centroid (mm⁴).`);
    break; }
    case 5: {
    return tx(`${N2(x[1])} m boyunda ankastre bir kirişin serbest ucuna P = ${N2(x[0])} kN yük asılıyor; eğilme rijitliği EI = ${N2(x[2])} kN·m². M/EI ifadesini iki kez integre ederek uç sehimini ve uç dönmesini bulun.`, `A cantilever beam ${N2(x[1])} m long carries a load P = ${N2(x[0])} kN at its free end; its flexural rigidity is EI = ${N2(x[2])} kN·m². Integrate M/EI twice to find the tip deflection and tip slope.`);
    break; }
    case 6: {
    return tx(`Çekme deneyinde bir çelik numune, akma birim şekil değiştirmesi ${N2(x[1])}‰'e kadar doğrusal-elastik davranıyor ve E = ${N2(x[0])} GPa. Elastik bölgedeki eğimden akma gerilmesini, eğri altındaki alandan birim hacim şekil değiştirme enerjisini bulun.`, `In a tensile test a steel specimen behaves linearly elastically up to a yield strain of ${N2(x[1])}‰ with E = ${N2(x[0])} GPa. Find the yield stress from the slope and the strain energy per unit volume from the area under the curve.`);
    break; }
    default: {
    return tx(`Dikdörtgen bir ahşap kirişin enine kesitinde genişlik b ve yükseklik h, b + 2h = ${N2(x[0])} mm koşulunu sağlamak zorunda. Kirişe M = ${N2(x[1])} kN·m eğilme momenti etki ediyor. Eğilme gerilmesi σ = M/S (S = b·h²/6) en küçük olsun diye h kaç mm seçilmelidir?`, `The cross-section of a rectangular timber beam must satisfy b + 2h = ${N2(x[0])} mm (width b, height h). The beam carries a bending moment M = ${N2(x[1])} kN·m. What height h in mm minimises the bending stress σ = M/S (S = b·h²/6)?`);
    break; }
    }
  }


  function MeaningExtra(scn) {
    if (scn >= 8) return ExtMeaningExtra(scn);
    switch (scn) {
    case 0: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "w(x) yük şiddeti kN/m; W = ∫w dx kuvvettir (kN); x̄ metre. Bileşke, yayılı yükün yerine geçen tek kuvvettir ve w(x) eğrisinin altındaki alanın ağırlık merkezinden geçer. Üçgen yük için W = ½·(tepe şiddeti)·L ve x̄ tepe tarafından L/3 uzaktadır." + "\n" + "YÖNTEM" + "\n" + "1. W = ∫₀ᴸ w dx. 2. M₀ = ∫₀ᴸ x·w dx. 3. x̄ = M₀/W." + "\n" + "TUZAK: x̄'ı mesnetten mi tepeden mi ölçtüğünüze dikkat edin; birim kN/m'yi kN ile karıştırmayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "w(x) is a load intensity in kN/m; W = ∫w dx is a force (kN); x̄ is in metres. The resultant is the single force that replaces the distributed load and acts through the centroid of the area under w(x). For a triangular load W = ½·(peak intensity)·L and x̄ is L/3 from the peak side." + "\n" + "METHOD" + "\n" + "1. W = ∫₀ᴸ w dx. 2. M₀ = ∫₀ᴸ x·w dx. 3. x̄ = M₀/W." + "\n" + "PITFALL: check whether x̄ is measured from the support or from the peak; do not confuse kN/m with kN.");
    break; }
    case 1: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "w: kN/m, V: kN, M: kN·m. V(x) kesitin bir yanındaki toplam düşey kuvvettir; M(x) o kesitteki eğilme etkisidir (kirişin altı çekmeye, üstü basınca çalışır)." + "\n" + "YÖNTEM" + "\n" + "1. Mesnet tepkilerini dengeden bul (ΣF = 0, ΣM = 0). 2. V(x) = R_A − ∫₀ˣ w dx. 3. M(x) = ∫₀ˣ V dx; mesnet noktalarında M = 0 olmalı (kontrol)." + "\n" + "TUZAK: İşaret kabulünü sabit tutun; integral sabitlerini unutmayın (sınır koşulu).", "UNITS AND PHYSICAL MEANING" + "\n" + "w: kN/m, V: kN, M: kN·m. V(x) is the net vertical force on one side of the section; M(x) is the bending action at that section (the bottom fibre works in tension, the top in compression)." + "\n" + "METHOD" + "\n" + "1. Find the support reactions from equilibrium (ΣF = 0, ΣM = 0). 2. V(x) = R_A − ∫₀ˣ w dx. 3. M(x) = ∫₀ˣ V dx; M must be 0 at simple supports (check)." + "\n" + "PITFALL: keep one sign convention; do not forget the integration constants (boundary conditions).");
    break; }
    case 2: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "M_maks kN·m cinsindendir ve kesit tasarımında (σ = M·c/I) belirleyicidir. M′ = V olduğundan V işaret değiştirirken M tepe yapar." + "\n" + "YÖNTEM" + "\n" + "1. Tepkileri bul. 2. Her bölgede V(x) yaz. 3. V(x) = 0 → x₀. 4. M(x₀) hesapla; V′ = −w < 0 olduğundan nokta maksimumdur (ikinci türev testi)." + "\n" + "TUZAK: Tekil yük V'de sıçrama yapar; her bölgeyi ayrı inceleyin. x₀ bölge dışında kalırsa maksimum tekil yük noktasındadır.", "UNITS AND PHYSICAL MEANING" + "\n" + "M_max is in kN·m and governs section design (σ = M·c/I). Since M′ = V, the moment peaks where V changes sign." + "\n" + "METHOD" + "\n" + "1. Find the reactions. 2. Write V(x) in each region. 3. Solve V(x) = 0 → x₀. 4. Evaluate M(x₀); since V′ = −w < 0 the point is a maximum (second-derivative test)." + "\n" + "PITFALL: a point load makes V jump; treat each region separately. If x₀ falls outside the region the maximum is at the point load.");
    break; }
    case 3: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "A birim alan (örn. m²), x̄ ve ȳ uzunluk (m). Ağırlık merkezi, levhanın bir iğne ucunda dengede durduğu noktadır. Homojen levhada kütle merkeziyle çakışır." + "\n" + "YÖNTEM" + "\n" + "1. A = ∫ y dx. 2. x̄ = (1/A)∫ x·y dx. 3. ȳ = (1/A)∫ ½y² dx." + "\n" + "TUZAK: Şeridin ağırlık merkezi y/2'dedir (y değil); simetri varsa o eksendeki koordinat doğrudan yazılır.", "UNITS AND PHYSICAL MEANING" + "\n" + "A has area units (e.g. m²); x̄ and ȳ are lengths (m). The centroid is the point where a plate would balance on a pin. For a homogeneous plate it coincides with the centre of mass." + "\n" + "METHOD" + "\n" + "1. A = ∫ y dx. 2. x̄ = (1/A)∫ x·y dx. 3. ȳ = (1/A)∫ ½y² dx." + "\n" + "PITFALL: a strip's centroid is at y/2 (not y); if there is symmetry, the coordinate on that axis can be written directly.");
    break; }
    case 4: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "I birimi uzunluk⁴ (mm⁴, m⁴). Dikdörtgen için I = b·h³/12 bulunur. h'ın KÜBÜ ile artar: yüksekliği iki katına çıkarmak rijitliği 8 kat artırır; bu yüzden kirişler \"dik\" konur." + "\n" + "YÖNTEM" + "\n" + "1. dA = b·dy. 2. I = ∫ y² dA = b∫₋ₕ/₂^(h/2) y² dy = b·h³/12." + "\n" + "TUZAK: Eksen ağırlık merkezinden geçmiyorsa paralel eksen teoremi gerekir (I = I_c + A·d²). mm⁴ ile m⁴ dönüşümü: 1 m⁴ = 10¹² mm⁴.", "UNITS AND PHYSICAL MEANING" + "\n" + "I has units length⁴ (mm⁴, m⁴). For a rectangle I = b·h³/12. It grows with the CUBE of h: doubling the depth makes the section 8 times stiffer, which is why beams are placed \"on edge\"." + "\n" + "METHOD" + "\n" + "1. dA = b·dy. 2. I = ∫ y² dA = b∫₋ₕ/₂^(h/2) y² dy = b·h³/12." + "\n" + "PITFALL: if the axis does not pass through the centroid use the parallel-axis theorem (I = I_c + A·d²). Conversion: 1 m⁴ = 10¹² mm⁴.");
    break; }
    case 5: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "v sehim (m veya mm), v′ eğim (rad), E·I eğilme rijitliği (kN·m²). Ankastre kirişte uçtaki sehim en büyüktür; P·L³/(3EI) biçimindedir, yani L'nin KÜBÜ ile artar." + "\n" + "YÖNTEM" + "\n" + "1. M(x) yaz (ankastrede M = −P(L − x)). 2. EI·v″ = M. 3. İntegre et; v(0) = 0 ve v′(0) = 0 ile C₁ = C₂ = 0 bul. 4. x = L'de değerlendir." + "\n" + "TUZAK: Birimleri tutarlı kullanın (kN ve m ya da N ve mm). Eğri işareti, yük yönüne bağlıdır.", "UNITS AND PHYSICAL MEANING" + "\n" + "v is the deflection (m or mm), v′ the slope (rad), E·I the flexural rigidity (kN·m²). In a cantilever the tip deflection is largest and has the form P·L³/(3EI), i.e. it grows with the CUBE of L." + "\n" + "METHOD" + "\n" + "1. Write M(x) (for the cantilever M = −P(L − x)). 2. EI·v″ = M. 3. Integrate; with v(0) = 0 and v′(0) = 0 find C₁ = C₂ = 0. 4. Evaluate at x = L." + "\n" + "PITFALL: keep units consistent (kN and m, or N and mm). The sign of the curve depends on the load direction.");
    break; }
    case 6: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "σ = F/A birimi MPa (N/mm²); ε boyutsuzdur (‰ = 10⁻³). E = σ/ε GPa cinsindendir (çelik ≈ 200 GPa). Birim hacim enerjisi u = ∫σ dε birimi MPa = MJ/m³'tür; elastik bölgede u = ½σ_y·ε_y = σ_y²/(2E)." + "\n" + "YÖNTEM" + "\n" + "1. Doğrusal bölgede E = σ/ε (eğim). 2. σ_y = E·ε_y. 3. u = ½σ_y·ε_y (üçgen alan)." + "\n" + "TUZAK: ‰ → 10⁻³ dönüşümünü ve GPa → MPa (×1000) dönüşümünü unutmayın.", "UNITS AND PHYSICAL MEANING" + "\n" + "σ = F/A has units MPa (N/mm²); ε is dimensionless (‰ = 10⁻³). E = σ/ε is in GPa (steel ≈ 200 GPa). The energy per unit volume u = ∫σ dε has units MPa = MJ/m³; in the elastic range u = ½σ_y·ε_y = σ_y²/(2E)." + "\n" + "METHOD" + "\n" + "1. In the linear range E = σ/ε (slope). 2. σ_y = E·ε_y. 3. u = ½σ_y·ε_y (triangle area)." + "\n" + "PITFALL: do not forget ‰ → 10⁻³ and GPa → MPa (×1000).");
    break; }
    case 7: {
    return tx("BİRİMLER VE FİZİKSEL ANLAM" + "\n" + "S = b·h²/6 kesit modülüdür (mm³); σ = M/S eğilme gerilmesidir (MPa, M N·mm cinsinden). Kısıt b + 2h = c malzeme/kütük boyutunu temsil eder." + "\n" + "5 ADIM" + "\n" + "1. Değişkenleri tanımla. 2. Kısıtla tek değişken: b = c − 2h → S(h) = (c − 2h)h²/6. 3. S′ = 0 → h = c/3. 4. S″ < 0 → maksimum S, minimum σ. 5. Cevabı birimle yaz (h = mm)." + "\n" + "TUZAK: Tanım kümesi 0 < h < c/2; M'yi N·mm'ye çevirmeden σ'yı MPa sanmayın (1 kN·m = 10⁶ N·mm).", "UNITS AND PHYSICAL MEANING" + "\n" + "S = b·h²/6 is the section modulus (mm³); σ = M/S is the bending stress (MPa, with M in N·mm). The constraint b + 2h = c represents the log/stock size." + "\n" + "5 STEPS" + "\n" + "1. Define the variables. 2. With the constraint use one variable: b = c − 2h → S(h) = (c − 2h)h²/6. 3. S′ = 0 → h = c/3. 4. S″ < 0 → maximum S, minimum σ. 5. State the answer with units (h in mm)." + "\n" + "PITFALL: the domain is 0 < h < c/2; do not read σ as MPa without converting M to N·mm (1 kN·m = 10⁶ N·mm).");
    break; }
    default: {
    return "";
    break; }
    }
  }


  function MeaningBase(p) {
    if (p.scn >= 8) return ExtMeaningBase(p);
    switch (p.scn) {
    case 0: {
    return tx("Yük yayılı olduğu için 'yük × kol' gibi tek çarpım yeterli değildir: her küçük dx parçasında yük yaklaşık dW = w(x)·dx'tir. Bileşke, bütün bu parçaların toplamı yani w(x)'in İNTEGRALİDİR (eğri altındaki alan). " + "Etki çizgisi, mesnede göre moment eşitliğinden gelir: bileşke × x̄ = ∫ x·w(x) dx. Yani x̄ bir AĞIRLIKLI ORTALAMA'dır. " + "Matematiksel istek: W = ∫₀ᴸ w dx ve x̄ = (∫₀ᴸ x·w dx) / W.", "Because the load is distributed, a single product 'load × arm' is not enough: on each tiny piece dx the load is about dW = w(x)·dx. The resultant is the sum of all these pieces, i.e. the INTEGRAL of w(x) (the area under the curve). " + "The line of action follows from moment equality about the support: resultant × x̄ = ∫ x·w(x) dx, so x̄ is a WEIGHTED AVERAGE. " + "Mathematical task: W = ∫₀ᴸ w dx and x̄ = (∫₀ᴸ x·w dx) / W.");
    break; }
    case 1: {
    return tx("Statikte yük, kesme kuvveti ve moment birbirine türevle bağlıdır: dV/dx = −w ve dM/dx = V. Bu yüzden yükten V'ye ve V'den M'ye gitmek için iki kez İNTEGRAL alınır; her integralin sabiti bir sınır koşulundan (mesnet) belirlenir. " + "Tersi de doğrudur: M(x)'in TÜREVİ kesme kuvvetini verir. " + "Matematiksel istek: V = −∫w dx + C₁, M = ∫V dx + C₂, sabitleri mesnet koşullarından bul.", "In statics, load, shear and moment are linked by derivatives: dV/dx = −w and dM/dx = V. So going from load to V and from V to M means taking two INTEGRALS; each constant comes from a boundary condition (a support). " + "The reverse also holds: the DERIVATIVE of M(x) gives the shear force. " + "Mathematical task: V = −∫w dx + C₁, M = ∫V dx + C₂, with the constants fixed by the support conditions.");
    break; }
    case 2: {
    return tx("Eğilme momenti M(x), fonksiyon olarak bir tepe noktasına (maksimuma) sahiptir. Bir fonksiyonun ekstremumunda türev sıfırdır ve dM/dx = V olduğundan, momentin en büyük olduğu yer KESME KUVVETİNİN SIFIR OLDUĞU yerdir. " + "Önce mesnet tepkisi statik dengeden bulunur, sonra V(x) = 0 denklemi çözülür ve x değeri M(x)'te yerine konur. " + "Matematiksel istek: V(x) = M′(x) = 0 denklemini çöz, M(x₀)'ı hesapla.", "The bending moment M(x) has a peak (maximum). At an extremum of a function the derivative is zero, and because dM/dx = V, the moment is largest where the SHEAR FORCE IS ZERO. " + "First the support reaction is found from static equilibrium, then V(x) = 0 is solved and the x found is substituted into M(x). " + "Mathematical task: solve V(x) = M′(x) = 0 and evaluate M(x₀).");
    break; }
    case 3: {
    return tx("Ağırlık merkezi, alanın 'denge noktası'dır: alanın parçalarının x ve y konumlarının ALAN AĞIRLIKLI ORTALAMASI. Eğri altında ince şeritler alırız; bir şeridin alanı dA = y·dx'tir ve ağırlık merkezi kendi yüksekliğinin yarısındadır. " + "Şeritleri toplamak İNTEGRALDİR: x̄ = (∫x dA)/A, ȳ = (∫(y/2) dA)/A. " + "Matematiksel istek: A = ∫₀ᵇ kx² dx, sonra bu iki moment integralini hesapla.", "The centroid is the 'balance point' of an area: the AREA-WEIGHTED AVERAGE of the x and y positions of its pieces. We cut thin strips under the curve; a strip has area dA = y·dx and its own centroid at half its height. " + "Adding the strips is an INTEGRAL: x̄ = (∫x dA)/A, ȳ = (∫(y/2) dA)/A. " + "Mathematical task: A = ∫₀ᵇ kx² dx, then evaluate these two moment integrals.");
    break; }
    case 4: {
    return tx("Atalet momenti, alanın eksenden uzaklığın KARESİYLE ağırlıklandırılmış toplamıdır: I = ∫y² dA. Eksenden uzak malzeme çok daha etkilidir. Dikdörtgeni eksene paralel ince şeritlere böleriz; şerit alanı dA = b·dy. " + "Şeritler y = −h/2'den y = +h/2'ye kadar toplanır; bu bir İNTEGRALDİR ve sınırlar kesitin alt ve üst kenarlarıdır. " + "Matematiksel istek: I = ∫₋ₕ/₂^(h/2) y²·b dy.", "The second moment of area is the sum of area weighted by the SQUARE of its distance from the axis: I = ∫y² dA. Material far from the axis matters much more. We cut the rectangle into thin strips parallel to the axis; a strip has area dA = b·dy. " + "The strips are added from y = −h/2 to y = +h/2; this is an INTEGRAL and the limits are the bottom and top edges of the section. " + "Mathematical task: I = ∫₋ₕ/₂^(h/2) y²·b dy.");
    break; }
    case 5: {
    return tx("Kirişin eğrilik ilişkisi EI·v″ = M(x)'tir: sehim v(x)'in İKİNCİ TÜREVİ momentle orantılıdır. Momenti bildiğimizde v′ (eğim) ve v (sehim) için iki kez İNTEGRAL alırız ve integral sabitlerini ankastre uçtaki koşullardan buluruz (v(0) = 0, v′(0) = 0). " + "Matematiksel istek: v″ = M/EI, v′ = ∫v″ dx + C₁, v = ∫v′ dx + C₂.", "The beam curvature relation is EI·v″ = M(x): the SECOND DERIVATIVE of the deflection v(x) is proportional to the moment. Once the moment is known, we take two INTEGRALS to get v′ (slope) and v (deflection), and find the constants from the fixed-end conditions (v(0) = 0, v′(0) = 0). " + "Mathematical task: v″ = M/EI, v′ = ∫v″ dx + C₁, v = ∫v′ dx + C₂.");
    break; }
    case 6: {
    return tx("Gerilme-birim şekil değiştirme eğrisinde iki farklı analiz aracı vardır. Elastik bölgede eğrinin EĞİMİ (TÜREV) elastisite modülünü verir: E = dσ/dε. Eğrinin altındaki ALAN (İNTEGRAL) birim hacimde depolanan enerjiyi verir: u = ∫σ dε. " + "Sınırlar ε = 0 ve akma birim şekil değiştirmesidir. " + "Matematiksel istek: E = dσ/dε ve u = ∫₀^εy σ(ε) dε.", "The stress-strain curve offers two different calculus tools. In the elastic region the SLOPE (DERIVATIVE) gives the modulus: E = dσ/dε. The AREA (INTEGRAL) under the curve gives the energy stored per unit volume: u = ∫σ dε. " + "The limits are ε = 0 and the yield strain. " + "Mathematical task: E = dσ/dε and u = ∫₀^εy σ(ε) dε.");
    break; }
    default: {
    return tx("Bir büyüklüğü en küçük (ya da en büyük) yapan değeri arıyoruz: bu bir OPTİMİZASYON problemidir. Önce kısıtı kullanarak S'yi tek değişkenli (h) yazarız; sonra S′(h) = 0 denklemini çözeriz. Gerilme σ = M/S olduğundan, S ne kadar büyükse gerilme o kadar küçüktür: S'yi maksimize etmek σ'yı minimize eder. " + "İkinci türev testi, bulunan noktanın gerçekten maksimum olduğunu doğrular. " + "Matematiksel istek: S(h) = (c − 2h)h²/6 için dS/dh = 0 ve S″ < 0.", "We look for the value that makes a quantity smallest (or largest): an OPTIMISATION problem. First, using the constraint, we write S in one variable (h); then we solve S′(h) = 0. Because σ = M/S, a larger S means a smaller stress: maximising S minimises σ. " + "The second-derivative test confirms that the point found is really a maximum. " + "Mathematical task: for S(h) = (c − 2h)h²/6 solve dS/dh = 0 and check S″ < 0.");
    break; }
    }
  }


  function Steps(problem) {
    if (problem.scn >= 8) return ExtSteps(problem);
    let x = problem.p;
    let s = [];
    switch (problem.scn) {
    case 0: {
    let a = x[0], L = x[1];
    let W = a * L * L / 2, mo = a * L * L * L / 3, xb = 2 * L / 3;
    Ad(s, `1. Değişkenler: x = sol mesnetten uzaklık (m), w(x) = ${N2(a)}x yük şiddeti (kN/m), L = ${N2(L)} m, W = bileşke (kN), x̄ = etki çizgisi (m).`, `1. Variables: x = distance from the left support (m), w(x) = ${N2(a)}x load intensity (kN/m), L = ${N2(L)} m, W = resultant (kN), x̄ = line of action (m).`);
    Ad(s, `2. Küçük parça: dW = w(x)·dx = ${N2(a)}x dx. Bileşke tüm parçaların toplamıdır: W = ∫₀^${N2(L)} ${N2(a)}x dx.`, `2. Small piece: dW = w(x)·dx = ${N2(a)}x dx. The resultant is the sum of all pieces: W = ∫₀^${N2(L)} ${N2(a)}x dx.`);
    Ad(s, `3. Ters türev: ∫${N2(a)}x dx = ${N2(a)}·x²/2 = ${N2(a / 2)}x².`, `3. Antiderivative: ∫${N2(a)}x dx = ${N2(a)}·x²/2 = ${N2(a / 2)}x².`);
    Ad(s, `4. Sınırlar: W = ${N2(a / 2)}·(${N2(L)})² − ${N2(a / 2)}·0² = ${N2(a / 2)}·${N2(L * L)} = ${N2(W)} kN.`, `4. Limits: W = ${N2(a / 2)}·(${N2(L)})² − ${N2(a / 2)}·0² = ${N2(a / 2)}·${N2(L * L)} = ${N2(W)} kN.`);
    Ad(s, `5. Moment koşulu (0 noktasına göre): W·x̄ = ∫₀^${N2(L)} x·w dx = ∫₀^${N2(L)} ${N2(a)}x² dx.`, `5. Moment condition (about the point 0): W·x̄ = ∫₀^${N2(L)} x·w dx = ∫₀^${N2(L)} ${N2(a)}x² dx.`);
    Ad(s, `6. ∫${N2(a)}x² dx = ${N2(a)}·x³/3 ; sınırlar: ${N2(a / 3)}·(${N2(L)})³ = ${N2(a / 3)}·${N2(L * L * L)} = ${N2(mo)} kN·m.`, `6. ∫${N2(a)}x² dx = ${N2(a)}·x³/3 ; limits: ${N2(a / 3)}·(${N2(L)})³ = ${N2(a / 3)}·${N2(L * L * L)} = ${N2(mo)} kN·m.`);
    Ad(s, `7. x̄ = ${N2(mo)} / ${N2(W)} = ${N2(xb)} m (genel sonuç: x̄ = 2L/3 = 2·${N2(L)}/3).`, `7. x̄ = ${N2(mo)} / ${N2(W)} = ${N2(xb)} m (general result: x̄ = 2L/3 = 2·${N2(L)}/3).`);
    Ad(s, `8. Birim kontrolü: (kN/m²)·m² = kN ; kN·m / kN = m. Ölçek kontrolü: üçgen alanı ½·taban·yükseklik = ½·${N2(L)}·${N2(a * L)} = ${N2(W)} kN ✓ ; üçgenin ağırlık merkezi tabandan 1/3 uzaklıkta, yani mesnetten 2L/3'tedir ✓.`, `8. Unit check: (kN/m²)·m² = kN ; kN·m / kN = m. Sanity check: triangle area ½·base·height = ½·${N2(L)}·${N2(a * L)} = ${N2(W)} kN ✓ ; a triangle's centroid is 1/3 of the base from the tall side, i.e. 2L/3 from the support ✓.`);
    Ad(s, `9. Yorum: tüm yük, sıfır yüklü uçtan ${N2(xb)} m'de tek bir ${N2(W)} kN kuvvetmiş gibi davranır; yük büyük tarafa doğru yığıldığından merkez ortadan (${N2(L / 2)} m) uzaktadır.`, `9. Interpretation: the whole load acts like a single ${N2(W)} kN force at ${N2(xb)} m from the zero-load end; because the load is concentrated on the large side, the centre lies beyond midspan (${N2(L / 2)} m).`);
    break; }
    case 1: {
    let w = x[0], L = x[1];
    let r = w * L / 2, mm = w * L * L / 8;
    Ad(s, `1. Değişkenler: x = sol mesnetten uzaklık (m), w = ${N2(w)} kN/m, L = ${N2(L)} m, V = kesme kuvveti (kN), M = eğilme momenti (kN·m).`, `1. Variables: x = distance from the left support (m), w = ${N2(w)} kN/m, L = ${N2(L)} m, V = shear force (kN), M = bending moment (kN·m).`);
    Ad(s, `2. Tepkiler: toplam yük = ${N2(w)}·${N2(L)} = ${N2(w * L)} kN, simetriden R_A = R_B = ${N2(r)} kN.`, `2. Reactions: total load = ${N2(w)}·${N2(L)} = ${N2(w * L)} kN, by symmetry R_A = R_B = ${N2(r)} kN.`);
    Ad(s, `3. Yükten kesmeye: dV/dx = −w = −${N2(w)} ⇒ V(x) = −${N2(w)}x + C₁.`, `3. Load to shear: dV/dx = −w = −${N2(w)} ⇒ V(x) = −${N2(w)}x + C₁.`);
    Ad(s, `4. Sınır koşulu: V(0) = R_A = ${N2(r)} ⇒ C₁ = ${N2(r)}, yani V(x) = ${N2(r)} − ${N2(w)}x.`, `4. Boundary condition: V(0) = R_A = ${N2(r)} ⇒ C₁ = ${N2(r)}, so V(x) = ${N2(r)} − ${N2(w)}x.`);
    Ad(s, `5. Kesmeden momente: dM/dx = V ⇒ M(x) = ∫(${N2(r)} − ${N2(w)}x) dx = ${N2(r)}x − ${N2(w / 2)}x² + C₂.`, `5. Shear to moment: dM/dx = V ⇒ M(x) = ∫(${N2(r)} − ${N2(w)}x) dx = ${N2(r)}x − ${N2(w / 2)}x² + C₂.`);
    Ad(s, `6. Sınır koşulu: M(0) = 0 (basit mesnet) ⇒ C₂ = 0, yani M(x) = ${N2(r)}x − ${N2(w / 2)}x². Kontrol: M(L) = ${N2(r)}·${N2(L)} − ${N2(w / 2)}·${N2(L * L)} = ${N2(r * L)} − ${N2(w * L * L / 2)} = 0 ✓.`, `6. Boundary condition: M(0) = 0 (simple support) ⇒ C₂ = 0, so M(x) = ${N2(r)}x − ${N2(w / 2)}x². Check: M(L) = ${N2(r)}·${N2(L)} − ${N2(w / 2)}·${N2(L * L)} = ${N2(r * L)} − ${N2(w * L * L / 2)} = 0 ✓.`);
    Ad(s, `7. Orta nokta x = L/2 = ${N2(L / 2)} m: V = ${N2(r)} − ${N2(w)}·${N2(L / 2)} = 0 ; M = ${N2(r)}·${N2(L / 2)} − ${N2(w / 2)}·${N2(L * L / 4)} = ${N2(r * L / 2)} − ${N2(w * L * L / 8)} = ${N2(mm)} kN·m.`, `7. Midspan x = L/2 = ${N2(L / 2)} m: V = ${N2(r)} − ${N2(w)}·${N2(L / 2)} = 0 ; M = ${N2(r)}·${N2(L / 2)} − ${N2(w / 2)}·${N2(L * L / 4)} = ${N2(r * L / 2)} − ${N2(w * L * L / 8)} = ${N2(mm)} kN·m.`);
    Ad(s, `8. Birim: kN/m·m = kN (V); kN·m (M). Türev kontrolü: M′(x) = ${N2(r)} − ${N2(w)}x = V(x) ✓ ; formül M_max = wL²/8 = ${N2(w)}·${N2(L * L)}/8 = ${N2(mm)} ✓.`, `8. Units: kN/m·m = kN (V); kN·m (M). Derivative check: M′(x) = ${N2(r)} − ${N2(w)}x = V(x) ✓ ; formula M_max = wL²/8 = ${N2(w)}·${N2(L * L)}/8 = ${N2(mm)} ✓.`);
    Ad(s, `9. Yorum: kesme kuvveti mesnette en büyük (${N2(r)} kN) ve ortada sıfırdır; moment mesnetlerde sıfır, ortada en büyüktür (${N2(mm)} kN·m). Kiriş en çok ortada eğilir. Grafik M(x) parabolünü gösterir.`, `9. Interpretation: shear is largest at the supports (${N2(r)} kN) and zero at midspan; the moment is zero at the supports and largest at midspan (${N2(mm)} kN·m). The beam bends most in the middle. The graph shows the parabola M(x).`);
    break; }
    case 2: {
    let w = x[0], pp = x[1];
    let rb = 5 * w + 0.8 * pp, ra = 5 * w + 0.2 * pp;
    let x0 = ra / w, m0 = ra * ra / (2 * w);
    Ad(s, `1. Değişkenler: x = sol mesnetten uzaklık (m), açıklık 10 m, w = ${N2(w)} kN/m, P = ${N2(pp)} kN (x = 8 m'de), R_A ve R_B mesnet tepkileri (kN).`, `1. Variables: x = distance from the left support (m), span 10 m, w = ${N2(w)} kN/m, P = ${N2(pp)} kN (at x = 8 m), R_A and R_B support reactions (kN).`);
    Ad(s, `2. A'ya göre moment dengesi: R_B·10 = w·10·5 + P·8 = ${N2(w * 50)} + ${N2(pp * 8)} ⇒ R_B = ${N2(rb)} kN.`, `2. Moment balance about A: R_B·10 = w·10·5 + P·8 = ${N2(w * 50)} + ${N2(pp * 8)} ⇒ R_B = ${N2(rb)} kN.`);
    Ad(s, `3. Düşey denge: R_A = w·10 + P − R_B = ${N2(w * 10)} + ${N2(pp)} − ${N2(rb)} = ${N2(ra)} kN.`, `3. Vertical equilibrium: R_A = w·10 + P − R_B = ${N2(w * 10)} + ${N2(pp)} − ${N2(rb)} = ${N2(ra)} kN.`);
    Ad(s, `4. 0 ≤ x < 8 bölgesinde kesme: V(x) = R_A − w·x = ${N2(ra)} − ${N2(w)}x (tekil yük henüz geçilmedi).`, `4. Shear in 0 ≤ x < 8: V(x) = R_A − w·x = ${N2(ra)} − ${N2(w)}x (the point load has not been passed yet).`);
    Ad(s, `5. Moment: M(x) = ∫V dx = ${N2(ra)}x − ${N2(w / 2)}x² (M(0) = 0).`, `5. Moment: M(x) = ∫V dx = ${N2(ra)}x − ${N2(w / 2)}x² (M(0) = 0).`);
    Ad(s, `6. Ekstremum koşulu: M′(x) = V(x) = 0 ⇒ ${N2(ra)} − ${N2(w)}x = 0 ⇒ x₀ = ${N2(ra)}/${N2(w)} = ${N2(x0)} m (0 < x₀ < 8 olduğundan bölge içindedir).`, `6. Extremum condition: M′(x) = V(x) = 0 ⇒ ${N2(ra)} − ${N2(w)}x = 0 ⇒ x₀ = ${N2(ra)}/${N2(w)} = ${N2(x0)} m (inside the region since 0 < x₀ < 8).`);
    Ad(s, `7. Maksimum olduğunu doğrula: M″(x) = V′(x) = −w = −${N2(w)} < 0 ⇒ tepe (maksimum) ✓.`, `7. Confirm it is a maximum: M″(x) = V′(x) = −w = −${N2(w)} < 0 ⇒ a peak (maximum) ✓.`);
    Ad(s, `8. Değer: M(x₀) = ${N2(ra)}·${N2(x0)} − ${N2(w / 2)}·(${N2(x0)})² = ${N2(ra * x0)} − ${N2(w / 2 * x0 * x0)} = ${N2(m0)} kN·m (kısa yol: R_A²/(2w) = ${N2(ra * ra)}/${N2(2 * w)}).`, `8. Value: M(x₀) = ${N2(ra)}·${N2(x0)} − ${N2(w / 2)}·(${N2(x0)})² = ${N2(ra * x0)} − ${N2(w / 2 * x0 * x0)} = ${N2(m0)} kN·m (shortcut: R_A²/(2w) = ${N2(ra * ra)}/${N2(2 * w)}).`);
    Ad(s, `9. Birim ve yorum: kN·m. Tekil yük sağa yakın olduğundan sol tepki (${N2(ra)} kN) düzgün yük tepkisinden (${N2(5 * w)} kN) büyüktür ve maksimum moment ortadan (${N2(5)} m) sağa, ${N2(x0)} m'ye kayar.`, `9. Units and interpretation: kN·m. Because the point load is near the right end, the left reaction (${N2(ra)} kN) exceeds the uniform-load share (${N2(5 * w)} kN), and the maximum moment shifts from midspan (${N2(5)} m) to ${N2(x0)} m.`);
    break; }
    case 3: {
    let k = x[0], b = x[1];
    let ar = k * b ** 3 / 3, q1 = k * b ** 4 / 4, q2 = k * k * b ** 5 / 10;
    let xb = 3 * b / 4, yb = 3 * k * b * b / 10;
    Ad(s, `1. Değişkenler: y = ${N2(k)}x², x ∈ [0, ${N2(b)}], dA = y·dx = ${N2(k)}x² dx (ince düşey şerit).`, `1. Variables: y = ${N2(k)}x², x ∈ [0, ${N2(b)}], dA = y·dx = ${N2(k)}x² dx (thin vertical strip).`);
    Ad(s, `2. Alan: A = ∫₀^${N2(b)} ${N2(k)}x² dx = ${N2(k)}·[x³/3]₀^${N2(b)}.`, `2. Area: A = ∫₀^${N2(b)} ${N2(k)}x² dx = ${N2(k)}·[x³/3]₀^${N2(b)}.`);
    Ad(s, `3. A = ${N2(k)}·(${N2(b)})³/3 = ${N2(k)}·${N2(b ** 3)}/3 = ${N2(ar)}.`, `3. A = ${N2(k)}·(${N2(b)})³/3 = ${N2(k)}·${N2(b ** 3)}/3 = ${N2(ar)}.`);
    Ad(s, `4. x'e göre birinci moment: Q_y = ∫x dA = ∫₀^${N2(b)} x·${N2(k)}x² dx = ${N2(k)}·[x⁴/4]₀^${N2(b)} = ${N2(k)}·${N2(b ** 4)}/4 = ${N2(q1)}.`, `4. First moment about the y-axis: Q_y = ∫x dA = ∫₀^${N2(b)} x·${N2(k)}x² dx = ${N2(k)}·[x⁴/4]₀^${N2(b)} = ${N2(k)}·${N2(b ** 4)}/4 = ${N2(q1)}.`);
    Ad(s, `5. x̄ = Q_y / A = ${N2(q1)} / ${N2(ar)} = ${N2(xb)} (genel: x̄ = 3b/4).`, `5. x̄ = Q_y / A = ${N2(q1)} / ${N2(ar)} = ${N2(xb)} (general: x̄ = 3b/4).`);
    Ad(s, `6. Şeridin merkezi y/2 yüksekliğindedir: Q_x = ∫(y/2) dA = ∫₀^${N2(b)} (${N2(k)}x²/2)·${N2(k)}x² dx = ${N2(k * k / 2)}·[x⁵/5]₀^${N2(b)} = ${N2(k * k / 10)}·${N2(b ** 5)} = ${N2(q2)}.`, `6. The strip's centroid is at height y/2: Q_x = ∫(y/2) dA = ∫₀^${N2(b)} (${N2(k)}x²/2)·${N2(k)}x² dx = ${N2(k * k / 2)}·[x⁵/5]₀^${N2(b)} = ${N2(k * k / 10)}·${N2(b ** 5)} = ${N2(q2)}.`);
    Ad(s, `7. ȳ = Q_x / A = ${N2(q2)} / ${N2(ar)} = ${N2(yb)} (genel: ȳ = 3kb²/10).`, `7. ȳ = Q_x / A = ${N2(q2)} / ${N2(ar)} = ${N2(yb)} (general: ȳ = 3kb²/10).`);
    Ad(s, `8. Kontrol: x̄ = ${N2(xb)} < b = ${N2(b)} ve eğri altında: y(${N2(xb)}) = ${N2(k * xb * xb)} > ȳ = ${N2(yb)} olduğundan merkez bölgenin içindedir ✓. Alan (k-birimli): parabol altı = ⅓·b·y(b) = ⅓·${N2(b)}·${N2(k * b * b)} = ${N2(ar)} ✓.`, `8. Check: x̄ = ${N2(xb)} < b = ${N2(b)}; and y(${N2(xb)}) = ${N2(k * xb * xb)} > ȳ = ${N2(yb)}, so the centroid lies inside the region ✓. Area check: under a parabola = ⅓·b·y(b) = ⅓·${N2(b)}·${N2(k * b * b)} = ${N2(ar)} ✓.`);
    Ad(s, `9. Yorum: alan sağa doğru yığıldığından ağırlık merkezi x = ${N2(xb)}'dedir (orta nokta ${N2(b / 2)}'nin sağında); levha bu noktadan tek parmakla dengelenir. Altın işaret grafikte (x̄, ȳ) noktasıdır.`, `9. Interpretation: because the area is piled up to the right, the centroid is at x = ${N2(xb)} (right of the midpoint ${N2(b / 2)}); the plate would balance on a fingertip at this point. The gold marker is (x̄, ȳ).`);
    break; }
    case 4: {
    let b = x[0], h = x[1];
    let ii = b * h ** 3 / 12;
    Ad(s, `1. Değişkenler: y = ağırlık merkezinden dikey uzaklık (mm), b = ${N2(b)} mm, h = ${N2(h)} mm, I = atalet momenti (mm⁴).`, `1. Variables: y = vertical distance from the centroid (mm), b = ${N2(b)} mm, h = ${N2(h)} mm, I = second moment of area (mm⁴).`);
    Ad(s, `2. Yatay ince şerit: kalınlık dy, genişlik b ⇒ dA = b·dy = ${N2(b)} dy.`, `2. Thin horizontal strip: thickness dy, width b ⇒ dA = b·dy = ${N2(b)} dy.`);
    Ad(s, `3. Tanım: I = ∫y² dA = ∫ y²·${N2(b)} dy, sınırlar y = −h/2 = ${N2(-h / 2)} ve y = +h/2 = ${N2(h / 2)}.`, `3. Definition: I = ∫y² dA = ∫ y²·${N2(b)} dy, limits y = −h/2 = ${N2(-h / 2)} and y = +h/2 = ${N2(h / 2)}.`);
    Ad(s, `4. Ters türev: ∫y² dy = y³/3, dolayısıyla I = ${N2(b)}·[y³/3] (−${N2(h / 2)}'den ${N2(h / 2)}'ye).`, `4. Antiderivative: ∫y² dy = y³/3, so I = ${N2(b)}·[y³/3] (from −${N2(h / 2)} to ${N2(h / 2)}).`);
    Ad(s, `5. Sınırlar: (${N2(h / 2)})³/3 − (−${N2(h / 2)})³/3 = ${N2((h / 2) ** 3 / 3)} + ${N2((h / 2) ** 3 / 3)} = ${N2(2 * (h / 2) ** 3 / 3)}.`, `5. Limits: (${N2(h / 2)})³/3 − (−${N2(h / 2)})³/3 = ${N2((h / 2) ** 3 / 3)} + ${N2((h / 2) ** 3 / 3)} = ${N2(2 * (h / 2) ** 3 / 3)}.`);
    Ad(s, `6. Sadeleştir: 2·(h/2)³/3 = 2·h³/(8·3) = h³/12 = ${N2(h ** 3 / 12)}.`, `6. Simplify: 2·(h/2)³/3 = 2·h³/(8·3) = h³/12 = ${N2(h ** 3 / 12)}.`);
    Ad(s, `7. I = b·h³/12 = ${N2(b)}·${N2(h ** 3)}/12 = ${N2(ii)} mm⁴.`, `7. I = b·h³/12 = ${N2(b)}·${N2(h ** 3)}/12 = ${N2(ii)} mm⁴.`);
    Ad(s, `8. Birim: mm·mm²·mm = mm⁴ ✓ (uzunluk⁴). Simetri: integrand y²·b çifttir, alt-üst kısım eşit katkı verir ✓.`, `8. Units: length⁴ = mm⁴ ✓ (y² → mm², dA → mm²). Symmetry: the integrand b·y² is even, so the upper and lower halves contribute equally ✓.`);
    Ad(s, `9. Yorum: I ∝ h³: yüksekliği iki katına çıkarmak I'yı 8 katına çıkarır; b'yi iki katına çıkarmak yalnızca 2 kat. Bu yüzden kirişler 'ayakta' kullanılır. Grafikte gölgeli alan ∫y²b dy = ${N2(ii)} mm⁴'tür.`, `9. Interpretation: I ∝ h³: doubling the height multiplies I by 8, doubling b only by 2. That is why beams are used 'on edge'. The shaded area on the graph is ∫y²b dy = ${N2(ii)} mm⁴.`);
    break; }
    case 5: {
    let pp = x[0], L = x[1], ei = x[2];
    let tip = 1000 * pp * L ** 3 / (3 * ei), th = pp * L * L / (2 * ei);
    Ad(s, `1. Değişkenler: x = ankastreden uzaklık (m), v(x) = aşağı sehim, P = ${N2(pp)} kN, L = ${N2(L)} m, EI = ${N2(ei)} kN·m².`, `1. Variables: x = distance from the fixed end (m), v(x) = downward deflection, P = ${N2(pp)} kN, L = ${N2(L)} m, EI = ${N2(ei)} kN·m².`);
    Ad(s, `2. Moment büyüklüğü: M(x) = P·(L − x) = ${N2(pp)}·(${N2(L)} − x) (uç yükün kolu L − x).`, `2. Moment magnitude: M(x) = P·(L − x) = ${N2(pp)}·(${N2(L)} − x) (the arm of the end load is L − x).`);
    Ad(s, `3. Eğrilik denklemi: EI·v″ = P(L − x) ⇒ v″ = P(L − x)/EI.`, `3. Curvature equation: EI·v″ = P(L − x) ⇒ v″ = P(L − x)/EI.`);
    Ad(s, `4. Birinci integral: v′ = (P/EI)·(Lx − x²/2) + C₁. Ankastre: v′(0) = 0 ⇒ C₁ = 0.`, `4. First integral: v′ = (P/EI)·(Lx − x²/2) + C₁. Fixed end: v′(0) = 0 ⇒ C₁ = 0.`);
    Ad(s, `5. İkinci integral: v = (P/EI)·(Lx²/2 − x³/6) + C₂. Ankastre: v(0) = 0 ⇒ C₂ = 0.`, `5. Second integral: v = (P/EI)·(Lx²/2 − x³/6) + C₂. Fixed end: v(0) = 0 ⇒ C₂ = 0.`);
    Ad(s, `6. Uç dönmesi: v′(L) = (P/EI)·(L² − L²/2) = P·L²/(2EI) = ${N2(pp)}·${N2(L * L)}/(2·${N2(ei)}) = ${N2(th)} rad.`, `6. Tip slope: v′(L) = (P/EI)·(L² − L²/2) = P·L²/(2EI) = ${N2(pp)}·${N2(L * L)}/(2·${N2(ei)}) = ${N2(th)} rad.`);
    Ad(s, `7. Uç sehimi: v(L) = (P/EI)·(L³/2 − L³/6) = P·L³/(3EI) = ${N2(pp)}·${N2(L ** 3)}/(3·${N2(ei)}) = ${N2(pp * L ** 3 / (3 * ei))} m.`, `7. Tip deflection: v(L) = (P/EI)·(L³/2 − L³/6) = P·L³/(3EI) = ${N2(pp)}·${N2(L ** 3)}/(3·${N2(ei)}) = ${N2(pp * L ** 3 / (3 * ei))} m.`);
    Ad(s, `8. Birim: kN·m³/(kN·m²) = m. Milimetre: ${N2(pp * L ** 3 / (3 * ei))}·1000 = ${N2(tip)} mm. Türev kontrolü: v″(x) = P(L − x)/EI ve v′ türevi ile uyumlu ✓.`, `8. Units: kN·m³/(kN·m²) = m. In millimetres: ${N2(pp * L ** 3 / (3 * ei))}·1000 = ${N2(tip)} mm. Derivative check: differentiating v′ gives back v″ = P(L − x)/EI ✓.`);
    Ad(s, `9. Yorum: sehim uca doğru artar ve L³ ile büyür (boyu iki katına çıkarmak sehimi 8 katına çıkarır). Uç sehimi ${N2(tip)} mm, açıklığın ${N2(tip / (L * 1000))} katıdır.`, `9. Interpretation: deflection grows towards the tip and scales with L³ (doubling the length multiplies it by 8). The tip deflection is ${N2(tip)} mm, i.e. ${N2(tip / (L * 1000))} of the length.`);
    break; }
    case 6: {
    let e = x[0], ey = x[1];
    let sy = e * ey, u = 0.5 * sy * ey;
    Ad(s, `1. Değişkenler: ε = birim şekil değiştirme (‰), σ = gerilme (MPa), E = ${N2(e)} GPa, ε_y = ${N2(ey)}‰. Not: GPa·‰ = MPa ve MPa·‰ = kJ/m³.`, `1. Variables: ε = strain (‰), σ = stress (MPa), E = ${N2(e)} GPa, ε_y = ${N2(ey)}‰. Note: GPa·‰ = MPa and MPa·‰ = kJ/m³.`);
    Ad(s, `2. Elastik bölgede σ(ε) = E·ε = ${N2(e)}ε doğrusudur.`, `2. In the elastic region σ(ε) = E·ε = ${N2(e)}ε is a straight line.`);
    Ad(s, `3. Eğim (türev): dσ/dε = ${N2(e)} MPa/‰ = ${N2(e)} GPa ⇒ bu, verilen E'ye eşittir (E = eğrinin eğimi).`, `3. Slope (derivative): dσ/dε = ${N2(e)} MPa/‰ = ${N2(e)} GPa ⇒ this equals the given E (E = slope of the curve).`);
    Ad(s, `4. Akma gerilmesi: σ_y = E·ε_y = ${N2(e)}·${N2(ey)} = ${N2(sy)} MPa.`, `4. Yield stress: σ_y = E·ε_y = ${N2(e)}·${N2(ey)} = ${N2(sy)} MPa.`);
    Ad(s, `5. Enerji yoğunluğu: u = ∫₀^${N2(ey)} σ dε = ∫₀^${N2(ey)} ${N2(e)}ε dε.`, `5. Energy density: u = ∫₀^${N2(ey)} σ dε = ∫₀^${N2(ey)} ${N2(e)}ε dε.`);
    Ad(s, `6. Ters türev: ∫${N2(e)}ε dε = ${N2(e / 2)}ε².`, `6. Antiderivative: ∫${N2(e)}ε dε = ${N2(e / 2)}ε².`);
    Ad(s, `7. Sınırlar: u = ${N2(e / 2)}·(${N2(ey)})² − 0 = ${N2(e / 2)}·${N2(ey * ey)} = ${N2(u)} MPa·‰ = ${N2(u)} kJ/m³.`, `7. Limits: u = ${N2(e / 2)}·(${N2(ey)})² − 0 = ${N2(e / 2)}·${N2(ey * ey)} = ${N2(u)} MPa·‰ = ${N2(u)} kJ/m³.`);
    Ad(s, `8. Kontrol (üçgen): ½·ε_y·σ_y = ½·${N2(ey)}·${N2(sy)} = ${N2(u)} ✓. Birim: MPa = MN/m² ve ‰ boyutsuz ⇒ MPa·‰ = kJ/m³ ✓.`, `8. Check (triangle): ½·ε_y·σ_y = ½·${N2(ey)}·${N2(sy)} = ${N2(u)} ✓. Units: MPa = MN/m² and ‰ is dimensionless ⇒ MPa·‰ = kJ/m³ ✓.`);
    Ad(s, `9. Yorum: bu ${N2(u)} kJ/m³, malzemenin kalıcı şekil değiştirmeden geri verebildiği enerjidir (rezilyans modülü). Aynı σ_y'de daha büyük ε_y (düşük E) daha çok enerji depolar.`, `9. Interpretation: these ${N2(u)} kJ/m³ are the energy the material can give back without permanent deformation (modulus of resilience). At the same σ_y a larger ε_y (lower E) stores more energy.`);
    break; }
    default: {
    let c = x[0], m = x[1];
    let h = c / 3, sm = c ** 3 / 162, sg = m * 1000000.0 / sm;
    Ad(s, `1. Değişkenler: b, h = kesit boyutları (mm), c = ${N2(c)} mm, M = ${N2(m)} kN·m = ${N2(m * 1000000.0)} N·mm, S = b·h²/6 (mm³), σ = M/S (MPa).`, `1. Variables: b, h = section dimensions (mm), c = ${N2(c)} mm, M = ${N2(m)} kN·m = ${N2(m * 1000000.0)} N·mm, S = b·h²/6 (mm³), σ = M/S (MPa).`);
    Ad(s, `2. Kısıttan b = ${N2(c)} − 2h ; böylece S tek değişkenli olur.`, `2. From the constraint b = ${N2(c)} − 2h ; so S becomes a function of one variable.`);
    Ad(s, `3. S(h) = (${N2(c)} − 2h)·h²/6 = (${N2(c)}h² − 2h³)/6, 0 < h < ${N2(c / 2)}.`, `3. S(h) = (${N2(c)} − 2h)·h²/6 = (${N2(c)}h² − 2h³)/6, 0 < h < ${N2(c / 2)}.`);
    Ad(s, `4. σ = M/S en küçük ⇔ S en büyük. Türev: S′(h) = (${N2(2 * c)}h − 6h²)/6 = h·(${N2(c)} − 3h)/3.`, `4. σ = M/S is smallest ⇔ S is largest. Derivative: S′(h) = (${N2(2 * c)}h − 6h²)/6 = h·(${N2(c)} − 3h)/3.`);
    Ad(s, `5. S′(h) = 0 ⇒ h = 0 (anlamsız) ya da ${N2(c)} − 3h = 0 ⇒ h = ${N2(c)}/3 = ${N2(h)} mm.`, `5. S′(h) = 0 ⇒ h = 0 (meaningless) or ${N2(c)} − 3h = 0 ⇒ h = ${N2(c)}/3 = ${N2(h)} mm.`);
    Ad(s, `6. İkinci türev: S″(h) = (${N2(2 * c)} − 12h)/6 ; h = ${N2(h)} için = (${N2(2 * c)} − ${N2(12 * h)})/6 = ${N2((2 * c - 12 * h) / 6)} < 0 ⇒ maksimum ✓.`, `6. Second derivative: S″(h) = (${N2(2 * c)} − 12h)/6 ; at h = ${N2(h)} it is (${N2(2 * c)} − ${N2(12 * h)})/6 = ${N2((2 * c - 12 * h) / 6)} < 0 ⇒ maximum ✓.`);
    Ad(s, `7. Genişlik: b = ${N2(c)} − 2·${N2(h)} = ${N2(c - 2 * h)} mm (b = h, yani kare kesit).`, `7. Width: b = ${N2(c)} − 2·${N2(h)} = ${N2(c - 2 * h)} mm (b = h, i.e. a square section).`);
    Ad(s, `8. S = ${N2(c - 2 * h)}·(${N2(h)})²/6 = ${N2(sm)} mm³ ; σ = ${N2(m * 1000000.0)}/${N2(sm)} = ${N2(sg)} MPa. Uçlarda (h → 0 ve h → ${N2(c / 2)}) S → 0 ve σ → ∞ olduğundan bu değer gerçekten en küçüktür.`, `8. S = ${N2(c - 2 * h)}·(${N2(h)})²/6 = ${N2(sm)} mm³ ; σ = ${N2(m * 1000000.0)}/${N2(sm)} = ${N2(sg)} MPa. At the ends (h → 0 and h → ${N2(c / 2)}) S → 0 and σ → ∞, so this really is the smallest value.`);
    Ad(s, `9. Yorum: bu kısıtta en iyi kesit h = ${N2(h)} mm'lik kare kesittir; birim: N·mm/mm³ = N/mm² = MPa ✓. Grafikte σ(h) eğrisinin çukuru bu noktadadır.`, `9. Interpretation: under this constraint the best section is the square with h = ${N2(h)} mm; units: N·mm/mm³ = N/mm² = MPa ✓. The gold marker is the bottom of the σ(h) curve.`);
    break; }
    }
    return s;
  }


  function draw(canvas, problem) {
    if (problem.scn >= 8) { ExtDraw(canvas, problem); return; }
    let x = problem.p;
    let accent = canvas.accent();
    switch (problem.scn) {
    case 0: {
    let a = x[0], L = x[1];
    let f = (u) => (u < 0 || u > L ? NaN : a * u);
    let top = a * L;
    let xb = 2 * L / 3;
    canvas.setViewport(-L * 0.12, L * 1.2, -top * 0.15, top * 1.3);
    Shade(canvas, f, 0, L, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: xb, color: canvas.gray(), label: `x̄ = ${N2(xb)}` });
    canvas.addMarker({ x: xb, y: a * xb, color: canvas.gold(), radius: 7.0, label: `W = ${N2(a * L * L / 2)}` });
    break; }
    case 1: {
    let w = x[0], L = x[1];
    let r = w * L / 2;
    let f = (u) => (u < 0 || u > L ? NaN : r * u - w * u * u / 2);
    let top = w * L * L / 8;
    canvas.setViewport(-L * 0.12, L * 1.15, -top * 0.2, top * 1.35);
    Shade(canvas, f, 0, L, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: L / 2, y: top, color: canvas.gold(), radius: 7.0, label: `M(${N2(L / 2)}) = ${N2(top)}` });
    break; }
    case 2: {
    let w = x[0], pp = x[1];
    let ra = 5 * w + 0.2 * pp;
    let x0 = ra / w;
    let f = (u) => (u < 0 || u > 8 ? NaN : ra * u - w * u * u / 2);
    let top = ra * ra / (2 * w);
    canvas.setViewport(-1, 9.5, -top * 0.2, top * 1.35);
    Shade(canvas, f, 0, 8, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: x0, color: canvas.gray(), label: `V = 0, x₀ = ${N2(x0)}` });
    canvas.addMarker({ x: x0, y: top, color: canvas.gold(), radius: 7.0, label: `M = ${N2(top)}` });
    break; }
    case 3: {
    let k = x[0], b = x[1];
    let f = (u) => (u < 0 || u > b ? NaN : k * u * u);
    let top = k * b * b;
    canvas.setViewport(-b * 0.12, b * 1.2, -top * 0.12, top * 1.25);
    Shade(canvas, f, 0, b, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: 3 * b / 4, y: 3 * k * b * b / 10, color: canvas.gold(), radius: 7.0, label: `(${N2(3 * b / 4)}, ${N2(3 * k * b * b / 10)})` });
    break; }
    case 4: {
    let b = x[0], h = x[1];
    let f = (u) => (Math.abs(u) > h / 2 ? NaN : b * u * u);
    let top = b * h * h / 4;
    canvas.setViewport(-h * 0.7, h * 0.7, -top * 0.12, top * 1.3);
    Shade(canvas, f, -h / 2, h / 2, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: h / 2, y: top, color: canvas.gold(), radius: 7.0, label: `b·(h/2)² = ${N2(top)}` });
    break; }
    case 5: {
    let pp = x[0], L = x[1], ei = x[2];
    let f = (u) => (u < 0 || u > L ? NaN : 1000 * pp * (L * u * u / 2 - u * u * u / 6) / ei);
    let top = 1000 * pp * L ** 3 / (3 * ei);
    canvas.setViewport(-L * 0.12, L * 1.2, -top * 0.15, top * 1.3);
    Shade(canvas, f, 0, L, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: L, y: top, color: canvas.gold(), radius: 7.0, label: `v(${N2(L)}) = ${N2(top)} mm` });
    break; }
    case 6: {
    let e = x[0], ey = x[1];
    let f = (u) => (u < 0 || u > 2 * ey ? NaN : e * Math.min(u, ey));
    let top = e * ey;
    canvas.setViewport(-ey * 0.2, ey * 2.3, -top * 0.15, top * 1.35);
    Shade(canvas, (u) => e * u, 0, ey, canvas.blue());
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addMarker({ x: ey, y: top, color: canvas.gold(), radius: 7.0, label: `σy = ${N2(top)} MPa` });
    break; }
    default: {
    let c = x[0], m = x[1];
    let f = (u) => (u <= 0 || u >= c / 2 ? NaN : 6000000.0 * m / ((c - 2 * u) * u * u));
    let hm = c / 3;
    let smin = m * 1000000.0 / (c ** 3 / 162);
    canvas.setViewport(-c * 0.05, c * 0.55, -smin * 0.3, smin * 4);
    canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
    canvas.addGuideLine({ axis: 'vertical', position: hm, color: canvas.gray(), label: `h = ${N2(hm)}` });
    canvas.addMarker({ x: hm, y: smin, color: canvas.gold(), radius: 7.0, label: `σmin = ${N2(smin)} MPa` });
    break; }
    }
  }


  // =====================================================================================================
  // Scenarios 9-16 (index 8..15): worked examples with ready-made course formulas, calculus done by the student.
  // =====================================================================================================
  const GW = 9.81; // water unit weight, kN/m^3 (rho = 1000 kg/m^3, g = 9.81 m/s^2)
  const SQ3 = Math.sqrt(3);

  // parameters clamped to the slider ranges so nothing downstream can divide by zero / produce NaN
  function clampP(scn, p) {
    const sp = Specs(scn);
    return sp.map((s, i) => {
      let v = Number(p && p[i]);
      if (!isFinite(v)) v = s.min;
      return Math.min(s.max, Math.max(s.min, v));
    });
  }

  function ExtTitles() {
    return [
      tx("9. Ankastre kiriş, üçgen yayılı yük: V(x), M(x)", "9. Cantilever, triangular load: V(x), M(x)"),
      tx("10. Basit mesnetli kiriş sehimi (çift integral)", "10. Simply supported beam deflection (double integration)"),
      tx("11. Değişken burulma momentli mil: dönme açısı", "11. Shaft with varying torque: angle of twist"),
      tx("12. Parabolik spandrelin ağırlık merkezi (iki eğri arası)", "12. Centroid of a parabolic spandrel (between two curves)"),
      tx("13. Düşey baraj kapağında hidrostatik kuvvet", "13. Hydrostatic force on a vertical dam gate"),
      tx("14. Parabolik kablo: gerilme ve yay uzunluğu", "14. Parabolic cable: tension and arc length"),
      tx("15. Kademeli kesitli çubuk: uzama = ∫P/(EA) dx", "15. Tapered bar: elongation = ∫P/(EA) dx"),
      tx("16. Yuvarlak kütükten en dayanıklı kiriş", "16. Strongest beam cut from a round log"),
    ];
  }

  function ExtSpecs(scn) {
    switch (scn) {
    case 8: return [Spec(tx("Duvardaki yük şiddeti w₀ (kN/m)", "Load intensity at wall w₀ (kN/m)"), 6, 18, 6), Spec(tx("Boy L (m)", "Length L (m)"), 2, 6, 2)];
    case 9: return [Spec(tx("Yayılı yük w (kN/m)", "Uniform load w (kN/m)"), 2, 8, 2), Spec(tx("Açıklık L (m)", "Span L (m)"), 4, 8, 2), Spec(tx("Eğilme rijitliği EI (kN·m²)", "Flexural rigidity EI (kN·m²)"), 5000, 15000, 5000)];
    case 10: return [Spec(tx("Uç burulma momenti T₀ (kN·m)", "Torque at the fixed end T₀ (kN·m)"), 2, 8, 2), Spec(tx("Mil boyu L (m)", "Shaft length L (m)"), 1, 3, 1), Spec(tx("Çap d (mm)", "Diameter d (mm)"), 40, 80, 20)];
    case 11: return [Spec(tx("Yükseklik h (cm)", "Height h (cm)"), 3, 9, 3), Spec(tx("Taban b (cm)", "Base b (cm)"), 2, 6, 2)];
    case 12: return [Spec(tx("Kapak genişliği w (m)", "Gate width w (m)"), 2, 6, 2), Spec(tx("Üst kenar derinliği h₁ (m)", "Depth of top edge h₁ (m)"), 1, 3, 1), Spec(tx("Alt kenar derinliği h₂ (m)", "Depth of bottom edge h₂ (m)"), 4, 8, 2)];
    case 13: return [Spec(tx("Yük w (kN/m, yatay izdüşüm)", "Load w (kN/m of horizontal span)"), 2, 6, 2), Spec(tx("Açıklık L (m)", "Span L (m)"), 20, 40, 10), Spec(tx("Sarkma h (m)", "Sag h (m)"), 4, 6, 1)];
    case 14: return [Spec(tx("Eksenel kuvvet P (kN)", "Axial force P (kN)"), 20, 60, 20), Spec(tx("Çubuk boyu L (m)", "Bar length L (m)"), 1, 3, 1), Spec(tx("Alan oranı r = A₁/A₀", "Area ratio r = A₁/A₀"), 2, 4, 1)];
    default: return [Spec(tx("Kütük çapı D (mm)", "Log diameter D (mm)"), 200, 400, 100), Spec(tx("Eğilme momenti M (kN·m)", "Bending moment M (kN·m)"), 10, 30, 10)];
    }
  }

  function ExtQuestion(p) {
    const x = clampP(p.scn, p.p);
    switch (p.scn) {
    case 8:
      return tx(`Boyu L = ${N2(x[1])} m olan ankastre bir konsol kirişe, serbest uçta sıfır olan ve ankastre duvarda w₀ = ${N2(x[0])} kN/m değerine ulaşan doğrusal yayılı yük etki ediyor: w(x) = w₀·x/L (x serbest uçtan ölçülür). Yükü integre ederek V(x) ve M(x) ifadelerini bulun; maksimum eğilme momenti nerede oluşur ve değeri kaç kN·m'dir?`,
        `A cantilever of length L = ${N2(x[1])} m carries a linearly varying load that is zero at the free end and reaches w₀ = ${N2(x[0])} kN/m at the fixed wall: w(x) = w₀·x/L (x measured from the free end). Integrate the load to get V(x) and M(x); where does the maximum bending moment occur and what is its value in kN·m?`);
    case 9:
      return tx(`${N2(x[1])} m açıklıklı basit mesnetli bir kirişe her yerde w = ${N2(x[0])} kN/m düzgün yük etki ediyor; EI = ${N2(x[2])} kN·m². Ders formülü EI·δ″ = −M(x) ile (δ aşağı sehim) çift integral alarak δ(x) eğrisini bulun, δ′ = 0 koşuluyla maksimum sehimin yerini ve değerini (mm) hesaplayın.`,
        `A simply supported beam of span ${N2(x[1])} m carries a uniform load w = ${N2(x[0])} kN/m everywhere; EI = ${N2(x[2])} kN·m². Using the course relation EI·δ″ = −M(x) (δ = downward deflection), integrate twice to get δ(x), then use δ′ = 0 to find the location and size (in mm) of the maximum deflection.`);
    case 10:
      return tx(`Bir ucu ankastre, ${N2(x[1])} m uzunluğunda d = ${N2(x[2])} mm çaplı dolu çelik milde (G = 80 GPa) iç burulma momenti ankastrede T₀ = ${N2(x[0])} kN·m'dir ve serbest uca doğru doğrusal olarak sıfıra iner: T(x) = T₀(1 − x/L). Ders formülü φ = ∫T(x)/(G·J) dx ile toplam dönme açısını (rad ve derece) ve ankastredeki en büyük kayma gerilmesini bulun.`,
        `A solid steel shaft (G = 80 GPa) of diameter d = ${N2(x[2])} mm and length ${N2(x[1])} m is fixed at one end. The internal torque is T₀ = ${N2(x[0])} kN·m at the wall and falls linearly to zero towards the free end: T(x) = T₀(1 − x/L). With the course formula φ = ∫T(x)/(G·J) dx find the total angle of twist (rad and degrees) and the maximum shear stress at the wall.`);
    case 11:
      return tx(`Bir spandrel (levha parçası), y₁ = (h/b)·x doğrusu ile y₂ = (h/b²)·x² parabolü arasında kalan bölgedir (h = ${N2(x[0])} cm, b = ${N2(x[1])} cm; 0 ≤ x ≤ b). Alanı ve ağırlık merkezinin (x̄, ȳ) koordinatlarını iki eğri arası integralle bulun.`,
        `A spandrel (plate piece) is the region between the line y₁ = (h/b)·x and the parabola y₂ = (h/b²)·x² (h = ${N2(x[0])} cm, b = ${N2(x[1])} cm; 0 ≤ x ≤ b). Find its area and the centroid coordinates (x̄, ȳ) by integrating between the two curves.`);
    case 12:
      return tx(`Su dolu bir barajın düşey duvarında, genişliği w = ${N2(x[0])} m olan dikdörtgen kapak su yüzeyinin h₁ = ${N2(x[1])} m ile h₂ = ${N2(x[2])} m altı arasındadır. Hidrostatik basınç p = ρ·g·y (ρg = 9,81 kN/m³) ile kapağa gelen toplam kuvveti F = ∫ p·w dy ve etki çizgisinin (basınç merkezinin) su yüzeyinden derinliğini bulun.`,
        `On the vertical wall of a dam, a rectangular gate of width w = ${N2(x[0])} m spans from h₁ = ${N2(x[1])} m to h₂ = ${N2(x[2])} m below the water surface. With hydrostatic pressure p = ρ·g·y (ρg = 9.81 kN/m³) find the total force on the gate, F = ∫ p·w dy, and the depth of its line of action (centre of pressure) below the surface.`);
    case 13:
      return tx(`Açıklığı L = ${N2(x[1])} m, sarkması h = ${N2(x[2])} m olan bir kablo, yatay izdüşümü boyunca düzgün w = ${N2(x[0])} kN/m yük taşıyor (en alt noktada başlangıç). Ders formülleri: H = wL²/(8h), T(x) = √(H² + (w·x)²), şekil y = w·x²/(2H). Minimum ve maksimum çekme kuvvetini bulun; yay uzunluğunu s = ∫√(1 + y′²) dx integraliyle hesaplayın.`,
        `A cable of span L = ${N2(x[1])} m and sag h = ${N2(x[2])} m carries a uniform load w = ${N2(x[0])} kN/m along its horizontal projection (origin at the lowest point). Course formulas: H = wL²/(8h), T(x) = √(H² + (w·x)²), shape y = w·x²/(2H). Find the minimum and maximum tension, and compute the arc length from s = ∫√(1 + y′²) dx.`);
    case 14:
      return tx(`Kalınlığı sabit, genişliği doğrusal artan yamuk bir çubuğun (E = 200 GPa) alanı A(x) = A₀(1 + (r − 1)x/L) ile değişir (A₀ = 200 mm², r = ${N2(x[2])}, L = ${N2(x[1])} m). Uçlarına P = ${N2(x[0])} kN çekme kuvveti uygulanıyor. Ders formülü δ = ∫P/(E·A(x)) dx ile toplam uzamayı (mm) bulun.`,
        `A bar of constant thickness whose width grows linearly (E = 200 GPa) has area A(x) = A₀(1 + (r − 1)x/L) (A₀ = 200 mm², r = ${N2(x[2])}, L = ${N2(x[1])} m). A tensile force P = ${N2(x[0])} kN is applied at the ends. With the course formula δ = ∫P/(E·A(x)) dx find the total elongation (mm).`);
    default:
      return tx(`D = ${N2(x[0])} mm çaplı yuvarlak bir kütükten b × h dikdörtgen kesitli bir kiriş kesilecek (b² + h² = D²). Eğilme modülü S = b·h²/6 en büyük olacak şekilde b ve h'ı bulun; ardından M = ${N2(x[1])} kN·m için σ = M/S gerilmesini hesaplayın.`,
        `A rectangular beam b × h is to be cut from a round log of diameter D = ${N2(x[0])} mm (b² + h² = D²). Find b and h that maximise the section modulus S = b·h²/6, then compute the bending stress σ = M/S for M = ${N2(x[1])} kN·m.`);
    }
  }

  function ExtMeaningExtra(scn) {
    switch (scn) {
    case 8:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nw: kN/m, V: kN, M: kN·m. Konsolda serbest uçta kesit kuvveti yoktur (V = M = 0); duvara doğru yük birikir, bu yüzden V ve |M| duvarda en büyüktür. Moment negatiftir (üst lif çeker)." + "\nYÖNTEM\n1. Serbest uçtan x ölç. 2. V(x) = −∫₀ˣ w ds. 3. M(x) = ∫₀ˣ V ds. 4. |M|′ = |V| ≥ 0 olduğundan maksimum duvardadır." + "\nTUZAK: x'in nereden ölçüldüğünü karıştırmayın (serbest uçtan mı, duvardan mı); w ∝ x ise M ∝ x³.",
        "UNITS AND PHYSICAL MEANING\nw: kN/m, V: kN, M: kN·m. A cantilever has no section forces at the free end (V = M = 0); load accumulates towards the wall, so V and |M| are largest at the wall. The moment is negative (top fibre in tension)." + "\nMETHOD\n1. Measure x from the free end. 2. V(x) = −∫₀ˣ w ds. 3. M(x) = ∫₀ˣ V ds. 4. Since |M|′ = |V| ≥ 0, the maximum is at the wall." + "\nPITFALL: do not mix up where x is measured from (free end or wall); with w ∝ x the moment goes as x³.");
    case 9:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nδ sehim (m; mm'ye ×1000), δ′ eğim (rad), EI kN·m². Maksimum sehim simetriden ortadadır ve 5wL⁴/(384EI) ile ölçeklenir: L⁴!" + "\nYÖNTEM\n1. M(x) = (wL/2)x − wx²/2 (ders formülü). 2. EI·δ″ = −M. 3. İki integral, C₁ ve C₂'yi δ(0) = δ(L) = 0 ile bul. 4. δ′(x) = 0 denklemini çöz (kübik; çarpanlara ayır). 5. δ″ < 0 ve değeri hesapla." + "\nTUZAK: Kübik denklemin diğer kökleri [0, L] dışındadır; işaret kabulünü (aşağı +) ve kN·m² ile m tutarlılığını koruyun.",
        "UNITS AND PHYSICAL MEANING\nδ is deflection (m; ×1000 for mm), δ′ the slope (rad), EI in kN·m². By symmetry the maximum deflection is at midspan and scales like 5wL⁴/(384EI): L⁴!" + "\nMETHOD\n1. M(x) = (wL/2)x − wx²/2 (course formula). 2. EI·δ″ = −M. 3. Integrate twice, fix C₁ and C₂ with δ(0) = δ(L) = 0. 4. Solve δ′(x) = 0 (a cubic; factorise). 5. Check δ″ < 0 and evaluate." + "\nPITFALL: the other roots of the cubic lie outside [0, L]; keep the sign convention (downward +) and consistent kN·m² with m.");
    case 10:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nT: N·mm (kN·m × 10⁶), G: MPa (GPa × 1000), J = πd⁴/32: mm⁴. φ boyutsuzdur (rad); derece için ×180/π. Dönme açısı, burulma momenti eğrisinin altındaki alanla (∫T dx) orantılıdır." + "\nYÖNTEM\n1. T(x)'i yaz. 2. φ = (1/GJ)∫₀ᴸ T(x) dx. 3. Ters türev, sınırlar. 4. Birimleri N ve mm'ye çevir. 5. τ_maks = T·(d/2)/J." + "\nTUZAK: kN·m → N·mm (×10⁶) ve m → mm (×10³) dönüşümleri; derece/radyan karışıklığı.",
        "UNITS AND PHYSICAL MEANING\nT: N·mm (kN·m × 10⁶), G: MPa (GPa × 1000), J = πd⁴/32: mm⁴. φ is dimensionless (rad); multiply by 180/π for degrees. The twist equals the area under the torque diagram (∫T dx) scaled by 1/(GJ)." + "\nMETHOD\n1. Write T(x). 2. φ = (1/GJ)∫₀ᴸ T(x) dx. 3. Antiderivative, limits. 4. Convert units to N and mm. 5. τ_max = T·(d/2)/J." + "\nPITFALL: kN·m → N·mm (×10⁶) and m → mm (×10³) conversions; confusing degrees and radians.");
    case 11:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nA: cm², x̄ ve ȳ: cm. İki eğri arası alanın şerit yüksekliği Δy = y₁ − y₂'dir; şeridin ağırlık merkezi iki eğrinin ortasındadır, bu yüzden ȳ için ½(y₁² − y₂²) kullanılır." + "\nYÖNTEM\n1. Kesişimler: x = 0 ve x = b. 2. A = ∫(y₁ − y₂) dx. 3. x̄ = (1/A)∫x(y₁ − y₂) dx. 4. ȳ = (1/A)∫½(y₁² − y₂²) dx." + "\nTUZAK: Hangi eğrinin üstte olduğunu kontrol edin; y₂ yerine y₂² yazmak ya da ½ çarpanını unutmak sık hatadır.",
        "UNITS AND PHYSICAL MEANING\nA: cm², x̄ and ȳ: cm. The strip height between two curves is Δy = y₁ − y₂; the strip's own centroid is midway between the curves, which is why ½(y₁² − y₂²) appears in ȳ." + "\nMETHOD\n1. Intersections: x = 0 and x = b. 2. A = ∫(y₁ − y₂) dx. 3. x̄ = (1/A)∫x(y₁ − y₂) dx. 4. ȳ = (1/A)∫½(y₁² − y₂²) dx." + "\nPITFALL: check which curve is on top; writing y₂ instead of y₂² or dropping the factor ½ are common mistakes.");
    case 12:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\np = ρgy: kPa (kN/m²), dF = p·w·dy: kN, F: kN. Basınç derinlikle doğrusal artar, bu yüzden bileşke kapağın ortasında değil, daha derinde etki eder (basınç merkezi)." + "\nYÖNTEM\n1. dF = ρg·y·w dy. 2. F = ∫_{h₁}^{h₂} ρg·w·y dy. 3. Yüzeye göre moment: M₀ = ∫ y dF. 4. y_cp = M₀/F." + "\nTUZAK: y'yi yüzeyden aşağı ölçün (tabandan değil); atmosfer basıncı iki yüzde de etki ettiğinden hesaba girmez; ρg = 9,81 kN/m³.",
        "UNITS AND PHYSICAL MEANING\np = ρgy: kPa (kN/m²), dF = p·w·dy: kN, F: kN. Pressure grows linearly with depth, so the resultant acts below the middle of the gate (centre of pressure)." + "\nMETHOD\n1. dF = ρg·y·w dy. 2. F = ∫_{h₁}^{h₂} ρg·w·y dy. 3. Moment about the surface: M₀ = ∫ y dF. 4. y_cp = M₀/F." + "\nPITFALL: measure y downward from the surface (not from the bottom); atmospheric pressure acts on both faces and cancels; ρg = 9.81 kN/m³.");
    case 13:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nw: kN/m, H ve T: kN, s: m. H kablonun her kesitindeki yatay bileşendir (sabit). T(x) = √(H² + (wx)²) eğimle büyür: en küçük değer en alt noktada (T = H), en büyük değer mesnetlerdedir." + "\nYÖNTEM\n1. y′ = wx/H. 2. T′(x) = w²x/T = 0 → x = 0 (minimum). 3. Uçlarda x = L/2 → T_maks. 4. s = 2∫₀^{L/2} √(1 + a²x²) dx, a = 8h/L²; ters türev: (x/2)√(1 + a²x²) + asinh(ax)/(2a)." + "\nTUZAK: s'yi L ile karıştırmayın (s > L); asinh = ln(u + √(u² + 1)); derece değil radyan/oran kullanın.",
        "UNITS AND PHYSICAL MEANING\nw: kN/m, H and T: kN, s: m. H is the (constant) horizontal component at every section. T(x) = √(H² + (wx)²) grows with the slope: the minimum is at the lowest point (T = H), the maximum at the supports." + "\nMETHOD\n1. y′ = wx/H. 2. T′(x) = w²x/T = 0 → x = 0 (minimum). 3. At the ends x = L/2 → T_max. 4. s = 2∫₀^{L/2} √(1 + a²x²) dx, a = 8h/L²; antiderivative: (x/2)√(1 + a²x²) + asinh(ax)/(2a)." + "\nPITFALL: do not confuse s with L (s > L); asinh = ln(u + √(u² + 1)); use ratios, not degrees.");
    case 14:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nP: N (kN × 1000), E: MPa (GPa × 1000), A: mm², x ve L: mm. P/(E·A(x)) boyutsuz birim uzamadır; küçük bir dx parçası ε(x)·dx kadar uzar, toplam uzama bunların toplamı yani İNTEGRALDİR." + "\nYÖNTEM\n1. ε(x) = P/(E·A(x)). 2. δ = ∫₀ᴸ ε(x) dx. 3. ∫dx/(1 + kx) = ln(1 + kx)/k. 4. Sınırlar: 1 + kL = r." + "\nTUZAK: δ = PL/(E·A_ortalama) yaklaşımı doğru değildir (ln ile r − 1 arasındaki fark); birimleri N ve mm'de tutun.",
        "UNITS AND PHYSICAL MEANING\nP: N (kN × 1000), E: MPa (GPa × 1000), A: mm², x and L: mm. P/(E·A(x)) is the dimensionless strain; a small piece dx stretches by ε(x)·dx, and the total elongation is their sum, i.e. an INTEGRAL." + "\nMETHOD\n1. ε(x) = P/(E·A(x)). 2. δ = ∫₀ᴸ ε(x) dx. 3. ∫dx/(1 + kx) = ln(1 + kx)/k. 4. Limits: 1 + kL = r." + "\nPITFALL: δ = PL/(E·A_average) is not exact (the ln differs from the average); keep units in N and mm.");
    default:
      return tx("BİRİMLER VE FİZİKSEL ANLAM\nS = b·h²/6: mm³ (eğilme modülü); σ = M/S: MPa (M N·mm'de). Kütük kısıtı b² + h² = D² kesitin köşelerinin daire üzerinde olması demektir." + "\nYÖNTEM\n1. h² = D² − b². 2. S(b) = b(D² − b²)/6. 3. S′(b) = (D² − 3b²)/6 = 0 → b = D/√3. 4. S″ = −b < 0 ⇒ maksimum. 5. h = D√(2/3), h/b = √2 ≈ 1,41." + "\nTUZAK: h yerine b'yi değişken seçmek hesabı kolaylaştırır; uç değerlerde (b → 0, b → D) S → 0 olduğundan tek kritik nokta maksimumdur; M'yi N·mm'ye çevirin.",
        "UNITS AND PHYSICAL MEANING\nS = b·h²/6: mm³ (section modulus); σ = M/S: MPa (M in N·mm). The log constraint b² + h² = D² means the corners of the section lie on the circle." + "\nMETHOD\n1. h² = D² − b². 2. S(b) = b(D² − b²)/6. 3. S′(b) = (D² − 3b²)/6 = 0 → b = D/√3. 4. S″ = −b < 0 ⇒ maximum. 5. h = D√(2/3), h/b = √2 ≈ 1.41." + "\nPITFALL: choosing b as the variable (not h) keeps the algebra simple; at the ends (b → 0, b → D) S → 0, so the single critical point is the maximum; convert M to N·mm.");
    }
  }

  function ExtMeaningBase(p) {
    switch (p.scn) {
    case 8:
      return tx("Yük, kesme ve moment arasındaki zincir burada da geçerlidir: dV/dx = −w, dM/dx = V. Yük x ile doğrusal arttığı için V ∝ x² ve M ∝ x³ olur; her adım bir İNTEGRALDİR ve serbest uçtaki sınır koşulu (V = M = 0) sabitleri sıfırlar. Maksimumu bulmak için türev işaretine bakılır: M′ = V sıfırdan farklı ise M monotondur ve maksimum aralığın ucundadır. Matematiksel istek: V = −∫₀ˣ w ds, M = ∫₀ˣ V ds, ardından |M|'nin [0, L]'deki maksimumu.",
        "The load-shear-moment chain still holds: dV/dx = −w, dM/dx = V. Because the load grows linearly with x, V ∝ x² and M ∝ x³; each step is an INTEGRAL and the free-end condition (V = M = 0) kills the constants. To locate the maximum we look at the sign of the derivative: if M′ = V is non-zero, M is monotonic and the maximum sits at the end of the interval. Mathematical task: V = −∫₀ˣ w ds, M = ∫₀ˣ V ds, then the maximum of |M| on [0, L].");
    case 9:
      return tx("Sehim, momentin İKİ KEZ integre edilmesiyle bulunur: EI·δ″ = −M(x) ⇒ δ′ ⇒ δ. İki integral sabiti iki sınır koşulundan gelir (δ(0) = 0, δ(L) = 0). Maksimum sehimin yeri, eğimin sıfır olduğu yerdir: δ′(x) = 0 (kübik bir denklem). İkinci türev (eğrilik) işareti bunun maksimum olduğunu doğrular. Matematiksel istek: δ′ = ∫δ″ dx + C₁, δ = ∫δ′ dx + C₂, δ′ = 0 çöz, δ(x₀) hesapla.",
        "Deflection comes from integrating the moment TWICE: EI·δ″ = −M(x) ⇒ δ′ ⇒ δ. The two constants come from two boundary conditions (δ(0) = 0, δ(L) = 0). The location of the maximum deflection is where the slope vanishes: δ′(x) = 0 (a cubic equation). The sign of the second derivative (curvature) confirms it is a maximum. Mathematical task: δ′ = ∫δ″ dx + C₁, δ = ∫δ′ dx + C₂, solve δ′ = 0, evaluate δ(x₀).");
    case 10:
      return tx("Mil çok küçük dx dilimlerine bölünür; her dilim dφ = T(x)·dx/(G·J) kadar döner. Burulma momenti x ile değiştiği için bu dönmeleri toplamak bir İNTEGRALDİR: φ = ∫₀ᴸ T(x)/(G·J) dx. T(x) doğrusal olduğundan integral, burulma momenti diyagramının altındaki (üçgen) alandır. Matematiksel istek: φ = (1/GJ)∫₀ᴸ T₀(1 − x/L) dx.",
        "The shaft is cut into tiny slices dx; each slice twists by dφ = T(x)·dx/(G·J). Because the torque changes with x, adding these twists is an INTEGRAL: φ = ∫₀ᴸ T(x)/(G·J) dx. With T(x) linear the integral is the area of the (triangular) torque diagram. Mathematical task: φ = (1/GJ)∫₀ᴸ T₀(1 − x/L) dx.");
    case 11:
      return tx("İki eğri arasındaki alan, üstteki eğriden alttakini çıkarıp integre ederek bulunur: dA = (y₁ − y₂) dx. Ağırlık merkezi bu şeritlerin ALAN AĞIRLIKLI ORTALAMASIDIR: x̄ = ∫x dA/A, ȳ = ∫(ortalama yükseklik) dA/A; şeridin merkezi iki eğrinin ortasında (y₁ + y₂)/2 yüksekliğindedir ve bu, ½(y₁² − y₂²) integraline götürür. Matematiksel istek: A = ∫₀ᵇ (y₁ − y₂) dx ve iki moment integrali.",
        "The area between two curves comes from integrating (upper − lower): dA = (y₁ − y₂) dx. The centroid is the AREA-WEIGHTED AVERAGE of the strips: x̄ = ∫x dA/A, ȳ = ∫(mid-height) dA/A; a strip's own centroid is midway at (y₁ + y₂)/2, which leads to the integral of ½(y₁² − y₂²). Mathematical task: A = ∫₀ᵇ (y₁ − y₂) dx and two moment integrals.");
    case 12:
      return tx("Basınç derinlikle değiştiği için tek bir 'basınç × alan' çarpımı yetmez: ince bir yatay şeridin üzerindeki kuvvet dF = ρg·y·w dy'dir ve toplam kuvvet bunların İNTEGRALİDİR (basınç eğrisinin altındaki alan). Etki çizgisi, yüzeye göre moment eşitliğinden gelir: F·y_cp = ∫ y dF; yani y_cp bir AĞIRLIKLI ORTALAMA'dır. Matematiksel istek: F = ∫_{h₁}^{h₂} ρg·w·y dy ve y_cp = (∫ y·ρg·w·y dy)/F.",
        "Because pressure varies with depth, a single 'pressure × area' product is not enough: the force on a thin horizontal strip is dF = ρg·y·w dy and the total force is the INTEGRAL of these (the area under the pressure curve). The line of action follows from moment equality about the surface: F·y_cp = ∫ y dF, so y_cp is a WEIGHTED AVERAGE. Mathematical task: F = ∫_{h₁}^{h₂} ρg·w·y dy and y_cp = (∫ y·ρg·w·y dy)/F.");
    case 13:
      return tx("İki ayrı araç var: (1) EKSTREMUM, T(x) = √(H² + (wx)²) fonksiyonunun türevi T′ = w²x/T olduğundan x = 0'da sıfırdır (minimum) ve T, |x| ile arttığı için maksimum uçlardadır; (2) YAY UZUNLUĞU, eğriyi ds = √(1 + y′²) dx parçalarına bölüp İNTEGRAL almaktır. Parabolik kablo için y′ = a·x doğrusaldır ve integral asinh içerir. Matematiksel istek: T′ = 0 çöz; s = 2∫₀^{L/2} √(1 + a²x²) dx.",
        "Two separate tools: (1) EXTREMUM: for T(x) = √(H² + (wx)²) the derivative is T′ = w²x/T, zero at x = 0 (minimum), and since T grows with |x| the maximum is at the ends; (2) ARC LENGTH: cut the curve into pieces ds = √(1 + y′²) dx and take the INTEGRAL. For a parabolic cable y′ = a·x is linear and the integral involves asinh. Mathematical task: solve T′ = 0; s = 2∫₀^{L/2} √(1 + a²x²) dx.");
    case 14:
      return tx("Kesit alanı x ile değiştiği için çubuğun her parçası farklı gerilir. Küçük bir dx parçasının uzaması dδ = P·dx/(E·A(x))'tir; toplam uzama bu parçaların toplamı, yani İNTEGRALDİR. A(x) doğrusal olduğundan integrand 1/(1 + kx) biçimindedir ve ters türevi logaritmadır. Matematiksel istek: δ = (P/(E·A₀))∫₀ᴸ dx/(1 + kx), k = (r − 1)/L.",
        "Because the cross-section changes with x, each piece of the bar stretches differently. A small piece dx extends by dδ = P·dx/(E·A(x)); the total elongation is the sum of these, an INTEGRAL. With A(x) linear the integrand has the form 1/(1 + kx) and its antiderivative is a logarithm. Mathematical task: δ = (P/(E·A₀))∫₀ᴸ dx/(1 + kx), k = (r − 1)/L.");
    default:
      return tx("Bir büyüklüğü en büyük yapan değeri arıyoruz: OPTİMİZASYON. Kısıt b² + h² = D² ile S = b·h²/6 tek değişkene (b) indirgenir: S(b) = b(D² − b²)/6. S′(b) = 0 denklemi kritik noktayı verir; S″ < 0 bunun maksimum olduğunu kanıtlar. σ = M/S olduğundan S'yi maksimize etmek gerilmeyi minimize eder. Matematiksel istek: S′(b) = (D² − 3b²)/6 = 0 ve S″(b) = −b < 0.",
        "We look for the value that makes a quantity largest: OPTIMISATION. With the constraint b² + h² = D², S = b·h²/6 reduces to one variable (b): S(b) = b(D² − b²)/6. Solving S′(b) = 0 gives the critical point; S″ < 0 proves it is a maximum. Since σ = M/S, maximising S minimises the stress. Mathematical task: S′(b) = (D² − 3b²)/6 = 0 and S″(b) = −b < 0.");
    }
  }

  function ExtSteps(problem) {
    const x = clampP(problem.scn, problem.p);
    const s = [];
    switch (problem.scn) {
    case 8: {
      const w0 = x[0], L = x[1];
      const slope = w0 / L, c1 = w0 / (2 * L), Vm = w0 * L / 2, Mm = w0 * L * L / 6, fr6 = `${N2(w0)}/${N2(6 * L)}`;
      Ad(s, `1. Değişkenler: x = SERBEST uçtan uzaklık (m), w(x) = (w₀/L)·x yük şiddeti (kN/m), w₀ = ${N2(w0)} kN/m (duvarda), L = ${N2(L)} m, V = kesme kuvveti (kN), M = eğilme momenti (kN·m).`, `1. Variables: x = distance from the FREE end (m), w(x) = (w₀/L)·x load intensity (kN/m), w₀ = ${N2(w0)} kN/m (at the wall), L = ${N2(L)} m, V = shear force (kN), M = bending moment (kN·m).`);
      Ad(s, `2. Yük fonksiyonu: w(x) = (${N2(w0)}/${N2(L)})·x = ${N2(slope)}x kN/m (uçta 0, duvarda ${N2(w0)}).`, `2. Load function: w(x) = (${N2(w0)}/${N2(L)})·x = ${N2(slope)}x kN/m (0 at the tip, ${N2(w0)} at the wall).`);
      Ad(s, `3. Kesme (dV/dx = −w): V(x) = −∫₀ˣ ${N2(slope)}s ds = −${N2(slope)}·x²/2 = −${N2(c1)}x² kN (V(0) = 0, serbest uç).`, `3. Shear (dV/dx = −w): V(x) = −∫₀ˣ ${N2(slope)}s ds = −${N2(slope)}·x²/2 = −${N2(c1)}x² kN (V(0) = 0, free end).`);
      Ad(s, `4. Moment (dM/dx = V): M(x) = ∫₀ˣ (−${N2(c1)}s²) ds = −${N2(c1)}·x³/3 = −(${fr6})x³ kN·m (M(0) = 0).`, `4. Moment (dM/dx = V): M(x) = ∫₀ˣ (−${N2(c1)}s²) ds = −${N2(c1)}·x³/3 = −(${fr6})x³ kN·m (M(0) = 0).`);
      Ad(s, `5. Ekstremum: |M|′ = |V| = ${N2(c1)}x² yalnızca x = 0'da sıfırdır (orada M = 0, minimum); 0 < x ≤ ${N2(L)} aralığında |V| > 0 olduğundan |M| sürekli artar ⇒ maksimum duvarda, x = L = ${N2(L)} m.`, `5. Extremum: |M|′ = |V| = ${N2(c1)}x² vanishes only at x = 0 (where M = 0, the minimum); for 0 < x ≤ ${N2(L)} we have |V| > 0, so |M| keeps increasing ⇒ the maximum is at the wall, x = L = ${N2(L)} m.`);
      Ad(s, `6. Değerler: |V|maks = ${N2(c1)}·${N2(L)}² = ${N2(c1)}·${N2(L * L)} = ${N2(Vm)} kN ; |M|maks = (${fr6})·${N2(L)}³ = (${fr6})·${N2(L ** 3)} = ${N2(Mm)} kN·m.`, `6. Values: |V|max = ${N2(c1)}·${N2(L)}² = ${N2(c1)}·${N2(L * L)} = ${N2(Vm)} kN ; |M|max = (${fr6})·${N2(L)}³ = (${fr6})·${N2(L ** 3)} = ${N2(Mm)} kN·m.`);
      Ad(s, `7. Bileşke kontrolü: W = ½·w₀·L = ½·${N2(w0)}·${N2(L)} = ${N2(Vm)} kN, duvara kolu L/3 = ${N2(L / 3)} m ⇒ M = W·L/3 = ${N2(Mm)} kN·m ✓.`, `7. Resultant check: W = ½·w₀·L = ½·${N2(w0)}·${N2(L)} = ${N2(Vm)} kN, arm to the wall L/3 = ${N2(L / 3)} m ⇒ M = W·L/3 = ${N2(Mm)} kN·m ✓.`);
      Ad(s, `8. Birim: (kN/m)·m = kN ; kN·m. Türev kontrolü: d/dx[−(${fr6})x³] = −${N2(c1)}x² = V(x) ✓ ve dV/dx = −${N2(slope)}x = −w ✓.`, `8. Units: (kN/m)·m = kN ; kN·m. Derivative check: d/dx[−(${fr6})x³] = −${N2(c1)}x² = V(x) ✓ and dV/dx = −${N2(slope)}x = −w ✓.`);
      Ad(s, `9. Yorum: yük duvara doğru yığıldığı için kesme ${N2(Vm)} kN ve moment ${N2(Mm)} kN·m ile duvarda en büyüktür; M ∝ x³ olduğundan eğri uçta düz, duvarda dik gider. Grafik |M|(x) (mavi) ve |V|(x) (turuncu) eğrilerini gösterir.`, `9. Interpretation: because the load piles up towards the wall, shear (${N2(Vm)} kN) and moment (${N2(Mm)} kN·m) peak at the wall; with M ∝ x³ the curve is flat at the tip and steep at the wall. The graph shows |M|(x) (blue) and |V|(x) (orange).`);
      break; }
    case 9: {
      const w = x[0], L = x[1], ei = x[2];
      const R = w * L / 2, c1 = w * L ** 3 / 24, dm = 5 * w * L ** 4 / (384 * ei), dmm = dm * 1000, th = w * L ** 3 / (24 * ei);
      const xr1 = L * (1 + SQ3) / 2, xr2 = L * (1 - SQ3) / 2, mmid = w * L * L / 8;
      Ad(s, `1. Değişkenler: x = sol mesnetten uzaklık (m), δ(x) = AŞAĞI sehim (m), w = ${N2(w)} kN/m, L = ${N2(L)} m, EI = ${N2(ei)} kN·m².`, `1. Variables: x = distance from the left support (m), δ(x) = DOWNWARD deflection (m), w = ${N2(w)} kN/m, L = ${N2(L)} m, EI = ${N2(ei)} kN·m².`);
      Ad(s, `2. Ders formülü: R_A = wL/2 = ${N2(R)} kN ve M(x) = R_A·x − w·x²/2 = ${N2(R)}x − ${N2(w / 2)}x² (kN·m).`, `2. Course formula: R_A = wL/2 = ${N2(R)} kN and M(x) = R_A·x − w·x²/2 = ${N2(R)}x − ${N2(w / 2)}x² (kN·m).`);
      Ad(s, `3. Eğrilik denklemi (aşağı sehim pozitif): EI·δ″ = −M(x) = −${N2(R)}x + ${N2(w / 2)}x².`, `3. Curvature equation (downward positive): EI·δ″ = −M(x) = −${N2(R)}x + ${N2(w / 2)}x².`);
      Ad(s, `4. Birinci integral: EI·δ′ = −${N2(R / 2)}x² + (${N2(w)}/6)x³ + C₁ (∫${N2(R)}x dx = ${N2(R / 2)}x², ∫${N2(w / 2)}x² dx = (${N2(w)}/6)x³).`, `4. First integral: EI·δ′ = −${N2(R / 2)}x² + (${N2(w)}/6)x³ + C₁ (∫${N2(R)}x dx = ${N2(R / 2)}x², ∫${N2(w / 2)}x² dx = (${N2(w)}/6)x³).`);
      Ad(s, `5. İkinci integral: EI·δ = −(${N2(R)}/6)x³ + (${N2(w)}/24)x⁴ + C₁x + C₂. δ(0) = 0 ⇒ C₂ = 0 ; δ(L) = 0 ⇒ C₁ = (${N2(R)}/6)·${N2(L * L)} − (${N2(w)}/24)·${N2(L ** 3)} = wL³/24 = ${N2(c1)} kN·m².`, `5. Second integral: EI·δ = −(${N2(R)}/6)x³ + (${N2(w)}/24)x⁴ + C₁x + C₂. δ(0) = 0 ⇒ C₂ = 0 ; δ(L) = 0 ⇒ C₁ = (${N2(R)}/6)·${N2(L * L)} − (${N2(w)}/24)·${N2(L ** 3)} = wL³/24 = ${N2(c1)} kN·m².`);
      Ad(s, `6. Maksimum yeri: δ′ = 0 ⇒ (w/6)x³ − (wL/4)x² + wL³/24 = 0 ⇒ 4x³ − 6Lx² + L³ = 0 ⇒ 4x³ − ${N2(6 * L)}x² + ${N2(L ** 3)} = 0. Çarpanlara ayır: (2x − L)(2x² − 2Lx − L²) = 0 ⇒ x₀ = L/2 = ${N2(L / 2)} m ; diğer kökler L(1 ± √3)/2 = ${N2(xr1)} m ve ${N2(xr2)} m, [0, ${N2(L)}] dışında.`, `6. Location of the maximum: δ′ = 0 ⇒ (w/6)x³ − (wL/4)x² + wL³/24 = 0 ⇒ 4x³ − 6Lx² + L³ = 0 ⇒ 4x³ − ${N2(6 * L)}x² + ${N2(L ** 3)} = 0. Factorise: (2x − L)(2x² − 2Lx − L²) = 0 ⇒ x₀ = L/2 = ${N2(L / 2)} m ; the other roots L(1 ± √3)/2 = ${N2(xr1)} m and ${N2(xr2)} m lie outside [0, ${N2(L)}].`);
      Ad(s, `7. Değer: δ(L/2) = 5wL⁴/(384EI) = 5·${N2(w)}·${N2(L ** 4)}/(384·${N2(ei)}) = ${G4(dm)} m = ${N2(dmm)} mm.`, `7. Value: δ(L/2) = 5wL⁴/(384EI) = 5·${N2(w)}·${N2(L ** 4)}/(384·${N2(ei)}) = ${G4(dm)} m = ${N2(dmm)} mm.`);
      Ad(s, `8. Kontrol: δ″(L/2) = −M(L/2)/EI = −${N2(mmid)}/${N2(ei)} < 0 ⇒ maksimum ✓. Mesnet eğimi δ′(0) = C₁/EI = ${N2(c1)}/${N2(ei)} = ${G4(th)} rad. Birim: kN·m⁴/(kN·m²) = m ✓.`, `8. Check: δ″(L/2) = −M(L/2)/EI = −${N2(mmid)}/${N2(ei)} < 0 ⇒ maximum ✓. Support slope δ′(0) = C₁/EI = ${N2(c1)}/${N2(ei)} = ${G4(th)} rad. Units: kN·m⁴/(kN·m²) = m ✓.`);
      Ad(s, `9. Yorum: en büyük sehim ortada, ${N2(dmm)} mm'dir ve L⁴ ile büyür (açıklığı iki katına çıkarmak 16 kat). L/δ = ${N2(L * 1000 / dmm)} (yönetmelikler çoğunlukla L/300-L/500 ister). Grafik δ(x)'i mm cinsinden gösterir.`, `9. Interpretation: the largest deflection is at midspan, ${N2(dmm)} mm, and grows like L⁴ (doubling the span gives 16 times). L/δ = ${N2(L * 1000 / dmm)} (codes often ask for L/300-L/500). The graph shows δ(x) in mm.`);
      break; }
    case 10: {
      const T0 = x[0], L = x[1], d = x[2];
      const J = Math.PI * d ** 4 / 32, G = 80000, GJ = G * J;
      const Iint = T0 * L / 2, In = Iint * 1e9, phi = In / GJ, deg = phi * 180 / Math.PI;
      const tau = T0 * 1e6 * (d / 2) / J;
      Ad(s, `1. Değişkenler: x = ankastreden uzaklık (m), T(x) = iç burulma momenti (kN·m), T₀ = ${N2(T0)} kN·m, L = ${N2(L)} m, d = ${N2(d)} mm, G = 80 GPa = 80000 MPa, J = polar atalet momenti (mm⁴).`, `1. Variables: x = distance from the fixed end (m), T(x) = internal torque (kN·m), T₀ = ${N2(T0)} kN·m, L = ${N2(L)} m, d = ${N2(d)} mm, G = 80 GPa = 80000 MPa, J = polar second moment (mm⁴).`);
      Ad(s, `2. Ders formülü: J = π·d⁴/32 = π·${N2(d ** 4)}/32 = ${N2(J)} mm⁴.`, `2. Course formula: J = π·d⁴/32 = π·${N2(d ** 4)}/32 = ${N2(J)} mm⁴.`);
      Ad(s, `3. Dilim: dφ = T(x)·dx/(G·J). Toplam: φ = (1/GJ)·∫₀^${N2(L)} T₀(1 − x/L) dx.`, `3. Slice: dφ = T(x)·dx/(G·J). Total: φ = (1/GJ)·∫₀^${N2(L)} T₀(1 − x/L) dx.`);
      Ad(s, `4. Ters türev: ∫(1 − x/L) dx = x − x²/(2L). Sınırlar: [L − L/2] − [0] = L/2 = ${N2(L / 2)} m.`, `4. Antiderivative: ∫(1 − x/L) dx = x − x²/(2L). Limits: [L − L/2] − [0] = L/2 = ${N2(L / 2)} m.`);
      Ad(s, `5. ∫T dx = T₀·L/2 = ${N2(T0)}·${N2(L / 2)} = ${N2(Iint)} kN·m² = ${N2(In)} N·mm² (1 kN·m² = 10⁹ N·mm²).`, `5. ∫T dx = T₀·L/2 = ${N2(T0)}·${N2(L / 2)} = ${N2(Iint)} kN·m² = ${N2(In)} N·mm² (1 kN·m² = 10⁹ N·mm²).`);
      Ad(s, `6. Rijitlik: G·J = 80000·${N2(J)} = ${N2(GJ)} N·mm².`, `6. Rigidity: G·J = 80000·${N2(J)} = ${N2(GJ)} N·mm².`);
      Ad(s, `7. φ = ${N2(In)}/${N2(GJ)} = ${G4(phi)} rad = ${G4(phi)}·180/π = ${N2(deg)}°.`, `7. φ = ${N2(In)}/${N2(GJ)} = ${G4(phi)} rad = ${G4(phi)}·180/π = ${N2(deg)}°.`);
      Ad(s, `8. En büyük kayma gerilmesi (x = 0): τ = T₀·(d/2)/J = ${N2(T0 * 1e6)}·${N2(d / 2)}/${N2(J)} = ${N2(tau)} MPa. Kontrol: ortalama moment T₀/2 sabit olsaydı φ = (T₀/2)·L/(GJ) aynı olurdu ✓. Birim: N·mm²/(N·mm²) = boyutsuz ✓.`, `8. Maximum shear stress (x = 0): τ = T₀·(d/2)/J = ${N2(T0 * 1e6)}·${N2(d / 2)}/${N2(J)} = ${N2(tau)} MPa. Check: a constant average torque T₀/2 would give the same φ = (T₀/2)·L/(GJ) ✓. Units: N·mm²/(N·mm²) = dimensionless ✓.`);
      Ad(s, `9. Yorum: mil toplam ${N2(deg)}° burulur; dönme ankastreden uca doğru artar ama eğri uca yaklaştıkça düzleşir (burulma momenti azalıyor). d⁴ nedeniyle çapı iki katına çıkarmak dönmeyi 16 kat azaltır. Grafik φ(x)'i derece olarak gösterir.`, `9. Interpretation: the shaft twists ${N2(deg)}° in total; the twist grows from the wall to the tip but flattens near the tip (the torque is dying out). Because of d⁴, doubling the diameter reduces the twist 16-fold. The graph shows φ(x) in degrees.`);
      break; }
    case 11: {
      const h = x[0], b = x[1];
      const A = h * b / 6, xb = b / 2, yb = 2 * h / 5, Qy = h * b * b / 12, Qx = h * h * b / 15;
      Ad(s, `1. Değişkenler: y₁ = (${N2(h)}/${N2(b)})x = ${N2(h / b)}x (doğru), y₂ = (${N2(h)}/${N2(b * b)})x² = ${N2(h / (b * b))}x² (parabol), 0 ≤ x ≤ ${N2(b)} cm. Kesişim: y₁ = y₂ ⇒ x = 0 ve x = ${N2(b)}; aradaki bölgede y₁ ≥ y₂.`, `1. Variables: y₁ = (${N2(h)}/${N2(b)})x = ${N2(h / b)}x (line), y₂ = (${N2(h)}/${N2(b * b)})x² = ${N2(h / (b * b))}x² (parabola), 0 ≤ x ≤ ${N2(b)} cm. Intersection: y₁ = y₂ ⇒ x = 0 and x = ${N2(b)}; in between y₁ ≥ y₂.`);
      Ad(s, `2. Şerit: dA = (y₁ − y₂) dx = (${N2(h / b)}x − ${N2(h / (b * b))}x²) dx.`, `2. Strip: dA = (y₁ − y₂) dx = (${N2(h / b)}x − ${N2(h / (b * b))}x²) dx.`);
      Ad(s, `3. Alan: A = ∫₀^${N2(b)} (${N2(h / b)}x − ${N2(h / (b * b))}x²) dx = [${N2(h / (2 * b))}x² − ${N2(h / (3 * b * b))}x³]₀^${N2(b)} = h·b/2 − h·b/3 = h·b/6 = ${N2(A)} cm².`, `3. Area: A = ∫₀^${N2(b)} (${N2(h / b)}x − ${N2(h / (b * b))}x²) dx = [${N2(h / (2 * b))}x² − ${N2(h / (3 * b * b))}x³]₀^${N2(b)} = h·b/2 − h·b/3 = h·b/6 = ${N2(A)} cm².`);
      Ad(s, `4. x'e göre birinci moment: Q_y = ∫x(y₁ − y₂) dx = [${N2(h / (3 * b))}x³ − ${N2(h / (4 * b * b))}x⁴]₀^${N2(b)} = h·b²/3 − h·b²/4 = h·b²/12 = ${N2(Qy)} cm³.`, `4. First moment about the y-axis: Q_y = ∫x(y₁ − y₂) dx = [${N2(h / (3 * b))}x³ − ${N2(h / (4 * b * b))}x⁴]₀^${N2(b)} = h·b²/3 − h·b²/4 = h·b²/12 = ${N2(Qy)} cm³.`);
      Ad(s, `5. x̄ = Q_y/A = ${N2(Qy)}/${N2(A)} = ${N2(xb)} cm (= b/2, simetri sezgisiyle uyumlu).`, `5. x̄ = Q_y/A = ${N2(Qy)}/${N2(A)} = ${N2(xb)} cm (= b/2, consistent with the symmetry intuition).`);
      Ad(s, `6. Şeridin merkezi eğrilerin ortasındadır: Q_x = ∫½(y₁² − y₂²) dx = ½∫(${N2(h * h / (b * b))}x² − ${N2(h * h / b ** 4)}x⁴) dx = ½[h²b/3 − h²b/5] = h²·b/15 = ${N2(Qx)} cm³.`, `6. A strip's centroid is midway between the curves: Q_x = ∫½(y₁² − y₂²) dx = ½∫(${N2(h * h / (b * b))}x² − ${N2(h * h / b ** 4)}x⁴) dx = ½[h²b/3 − h²b/5] = h²·b/15 = ${N2(Qx)} cm³.`);
      Ad(s, `7. ȳ = Q_x/A = ${N2(Qx)}/${N2(A)} = ${N2(yb)} cm (genel: ȳ = 2h/5).`, `7. ȳ = Q_x/A = ${N2(Qx)}/${N2(A)} = ${N2(yb)} cm (general: ȳ = 2h/5).`);
      Ad(s, `8. Kontrol: x̄ = ${N2(xb)} noktasında y₂ = ${N2(h / 4)} < ȳ = ${N2(yb)} < y₁ = ${N2(h / 2)} olduğundan merkez bölgenin içindedir ✓. Birim: cm·cm = cm² ; cm²·cm = cm³ ; cm³/cm² = cm ✓.`, `8. Check: at x̄ = ${N2(xb)} we have y₂ = ${N2(h / 4)} < ȳ = ${N2(yb)} < y₁ = ${N2(h / 2)}, so the centroid lies inside the region ✓. Units: cm·cm = cm² ; cm²·cm = cm³ ; cm³/cm² = cm ✓.`);
      Ad(s, `9. Yorum: spandrel ${N2(A)} cm² alanlıdır ve (${N2(xb)}; ${N2(yb)}) cm noktasından tek parmakla dengelenir. Alan, doğru altındaki üçgenin (h·b/2) tam üçte biridir. Altın işaret grafikte (x̄, ȳ)'dir.`, `9. Interpretation: the spandrel has area ${N2(A)} cm² and balances on a fingertip at (${N2(xb)}; ${N2(yb)}) cm. Its area is exactly one third of the triangle under the line (h·b/2). The gold marker is (x̄, ȳ).`);
      break; }
    case 12: {
      const w = x[0], h1 = x[1], h2 = x[2];
      const F = GW * w * (h2 * h2 - h1 * h1) / 2, M0 = GW * w * (h2 ** 3 - h1 ** 3) / 3, ycp = M0 / F;
      Ad(s, `1. Değişkenler: y = su yüzeyinden aşağı derinlik (m), p(y) = ρg·y = 9,81y kPa, w = ${N2(w)} m, kapak y = ${N2(h1)} m ile y = ${N2(h2)} m arasında.`, `1. Variables: y = depth below the water surface (m), p(y) = ρg·y = 9.81y kPa, w = ${N2(w)} m, gate between y = ${N2(h1)} m and y = ${N2(h2)} m.`);
      Ad(s, `2. Şerit kuvveti: dF = p·w·dy = 9,81·${N2(w)}·y dy = ${N2(GW * w)}y dy (kN).`, `2. Strip force: dF = p·w·dy = 9.81·${N2(w)}·y dy = ${N2(GW * w)}y dy (kN).`);
      Ad(s, `3. Toplam kuvvet: F = ∫_{${N2(h1)}}^{${N2(h2)}} ${N2(GW * w)}y dy = ${N2(GW * w / 2)}·[y²]_{${N2(h1)}}^{${N2(h2)}}.`, `3. Total force: F = ∫_{${N2(h1)}}^{${N2(h2)}} ${N2(GW * w)}y dy = ${N2(GW * w / 2)}·[y²]_{${N2(h1)}}^{${N2(h2)}}.`);
      Ad(s, `4. Sınırlar: F = ${N2(GW * w / 2)}·(${N2(h2 * h2)} − ${N2(h1 * h1)}) = ${N2(GW * w / 2)}·${N2(h2 * h2 - h1 * h1)} = ${N2(F)} kN.`, `4. Limits: F = ${N2(GW * w / 2)}·(${N2(h2 * h2)} − ${N2(h1 * h1)}) = ${N2(GW * w / 2)}·${N2(h2 * h2 - h1 * h1)} = ${N2(F)} kN.`);
      Ad(s, `5. Yüzeye göre moment: M₀ = ∫ y dF = ∫ ${N2(GW * w)}y² dy = ${N2(GW * w / 3)}·[y³]_{${N2(h1)}}^{${N2(h2)}} = ${N2(GW * w / 3)}·(${N2(h2 ** 3)} − ${N2(h1 ** 3)}) = ${N2(M0)} kN·m.`, `5. Moment about the surface: M₀ = ∫ y dF = ∫ ${N2(GW * w)}y² dy = ${N2(GW * w / 3)}·[y³]_{${N2(h1)}}^{${N2(h2)}} = ${N2(GW * w / 3)}·(${N2(h2 ** 3)} − ${N2(h1 ** 3)}) = ${N2(M0)} kN·m.`);
      Ad(s, `6. Etki çizgisi: y_cp = M₀/F = ${N2(M0)}/${N2(F)} = ${N2(ycp)} m (genel: y_cp = (2/3)(h₂³ − h₁³)/(h₂² − h₁²)).`, `6. Line of action: y_cp = M₀/F = ${N2(M0)}/${N2(F)} = ${N2(ycp)} m (general: y_cp = (2/3)(h₂³ − h₁³)/(h₂² − h₁²)).`);
      Ad(s, `7. Kontrol: kapak ortası (h₁ + h₂)/2 = ${N2((h1 + h2) / 2)} m < y_cp = ${N2(ycp)} m < h₂ = ${N2(h2)} m ✓ (basınç alta doğru arttığı için merkez ortadan aşağıdadır). Alttan yükseklik: ${N2(h2 - ycp)} m.`, `7. Check: gate midpoint (h₁ + h₂)/2 = ${N2((h1 + h2) / 2)} m < y_cp = ${N2(ycp)} m < h₂ = ${N2(h2)} m ✓ (pressure grows downwards, so the centre lies below the middle). Height above the bottom edge: ${N2(h2 - ycp)} m.`);
      Ad(s, `8. Birim: kPa·m·m = kN ; kN·m/kN = m ✓. Ortalama basınç yöntemi: p_ort = 9,81·${N2((h1 + h2) / 2)} = ${N2(GW * (h1 + h2) / 2)} kPa, alan ${N2(w * (h2 - h1))} m² ⇒ ${N2(GW * (h1 + h2) / 2 * w * (h2 - h1))} kN ✓.`, `8. Units: kPa·m·m = kN ; kN·m/kN = m ✓. Mean-pressure check: p_mean = 9.81·${N2((h1 + h2) / 2)} = ${N2(GW * (h1 + h2) / 2)} kPa, area ${N2(w * (h2 - h1))} m² ⇒ ${N2(GW * (h1 + h2) / 2 * w * (h2 - h1))} kN ✓.`);
      Ad(s, `9. Yorum: su kapağa toplam ${N2(F)} kN kuvvet uygular ve bu kuvvet yüzeyden ${N2(ycp)} m derinde etki eder. Grafik, derinliğe göre şerit yükünü q(y) = ${N2(GW * w)}y (kN/m) gösterir; gölgeli alan F'dir.`, `9. Interpretation: the water pushes on the gate with ${N2(F)} kN acting ${N2(ycp)} m below the surface. The graph shows the strip load q(y) = ${N2(GW * w)}y (kN/m) against depth; the shaded area is F.`);
      break; }
    case 13: {
      const w = x[0], L = x[1], h = x[2];
      const H = w * L * L / (8 * h), Tmax = Math.sqrt(H * H + (w * L / 2) ** 2);
      const a = 8 * h / L ** 2, u = 4 * h / L, sq = Math.sqrt(1 + u * u), as = Math.asinh(u);
      const sLen = (L / 2) * sq + (L * L / (8 * h)) * as, sApprox = L * (1 + 8 / 3 * (h / L) ** 2);
      Ad(s, `1. Değişkenler: x = en alt noktadan yatay uzaklık (m), y(x) = kablo yüksekliği (m), w = ${N2(w)} kN/m, L = ${N2(L)} m, h = ${N2(h)} m, x ∈ [−${N2(L / 2)}, ${N2(L / 2)}].`, `1. Variables: x = horizontal distance from the lowest point (m), y(x) = cable height (m), w = ${N2(w)} kN/m, L = ${N2(L)} m, h = ${N2(h)} m, x ∈ [−${N2(L / 2)}, ${N2(L / 2)}].`);
      Ad(s, `2. Ders formülleri: H = wL²/(8h) = ${N2(w)}·${N2(L * L)}/(8·${N2(h)}) = ${N2(H)} kN ; y = w·x²/(2H) = ${N2(w / (2 * H))}x² (x = L/2'de y = h ✓).`, `2. Course formulas: H = wL²/(8h) = ${N2(w)}·${N2(L * L)}/(8·${N2(h)}) = ${N2(H)} kN ; y = w·x²/(2H) = ${N2(w / (2 * H))}x² (y = h at x = L/2 ✓).`);
      Ad(s, `3. Eğim: y′ = w·x/H = ${N2(a)}x (a = 8h/L² = ${N2(a)}). Çekme kuvveti: T(x) = √(H² + (wx)²) = √(${N2(H * H)} + ${N2(w * w)}x²).`, `3. Slope: y′ = w·x/H = ${N2(a)}x (a = 8h/L² = ${N2(a)}). Tension: T(x) = √(H² + (wx)²) = √(${N2(H * H)} + ${N2(w * w)}x²).`);
      Ad(s, `4. Ekstremum: T′(x) = w²x/T(x) = 0 ⇒ x = 0 ; x > 0 için T′ > 0 (T artıyor) ⇒ x = 0 minimumdur: T_min = H = ${N2(H)} kN.`, `4. Extremum: T′(x) = w²x/T(x) = 0 ⇒ x = 0 ; for x > 0, T′ > 0 (T increases) ⇒ x = 0 is the minimum: T_min = H = ${N2(H)} kN.`);
      Ad(s, `5. Maksimum uçlarda (x = ±L/2 = ±${N2(L / 2)}): T_maks = √(${N2(H * H)} + (${N2(w)}·${N2(L / 2)})²) = √(${N2(H * H)} + ${N2((w * L / 2) ** 2)}) = ${N2(Tmax)} kN.`, `5. The maximum is at the ends (x = ±L/2 = ±${N2(L / 2)}): T_max = √(${N2(H * H)} + (${N2(w)}·${N2(L / 2)})²) = √(${N2(H * H)} + ${N2((w * L / 2) ** 2)}) = ${N2(Tmax)} kN.`);
      Ad(s, `6. Yay uzunluğu: s = 2∫₀^${N2(L / 2)} √(1 + (${N2(a)}x)²) dx. Ters türev: ∫√(1 + a²x²) dx = (x/2)√(1 + a²x²) + asinh(ax)/(2a).`, `6. Arc length: s = 2∫₀^${N2(L / 2)} √(1 + (${N2(a)}x)²) dx. Antiderivative: ∫√(1 + a²x²) dx = (x/2)√(1 + a²x²) + asinh(ax)/(2a).`);
      Ad(s, `7. x = L/2'de a·x = 4h/L = ${N2(u)} ; s = (L/2)√(1 + ${N2(u * u)}) + (L²/(8h))·asinh(${N2(u)}) = ${N2(L / 2)}·${N2(sq)} + ${N2(L * L / (8 * h))}·${N2(as)} = ${N2(sLen)} m.`, `7. At x = L/2, a·x = 4h/L = ${N2(u)} ; s = (L/2)√(1 + ${N2(u * u)}) + (L²/(8h))·asinh(${N2(u)}) = ${N2(L / 2)}·${N2(sq)} + ${N2(L * L / (8 * h))}·${N2(as)} = ${N2(sLen)} m.`);
      Ad(s, `8. Kontrol: küçük sarkma yaklaşımı s ≈ L(1 + 8h²/(3L²)) = ${N2(sApprox)} m ≈ ${N2(sLen)} m ✓ ; s > L = ${N2(L)} m ✓. Birim: kN/m·m = kN ; m ✓.`, `8. Check: the small-sag approximation s ≈ L(1 + 8h²/(3L²)) = ${N2(sApprox)} m ≈ ${N2(sLen)} m ✓ ; s > L = ${N2(L)} m ✓. Units: kN/m·m = kN ; m ✓.`);
      Ad(s, `9. Yorum: kablo ${N2(sLen)} m uzunluğundadır (açıklıktan ${N2(sLen - L)} m fazla). Çekme kuvveti ortada ${N2(H)} kN, mesnetlerde ${N2(Tmax)} kN'dur (${N2(Tmax / H)} kat). Grafik T(x)'i gösterir; altın işaretler en küçük ve en büyük değerlerdir.`, `9. Interpretation: the cable is ${N2(sLen)} m long (${N2(sLen - L)} m more than the span). Tension is ${N2(H)} kN at midspan and ${N2(Tmax)} kN at the supports (${N2(Tmax / H)} times). The graph shows T(x); the gold markers are the minimum and maximum.`);
      break; }
    case 14: {
      const P = x[0], L = x[1], r = x[2];
      const A0 = 200, E = 200000, Pn = P * 1000, Lm = L * 1000, k = (r - 1) / Lm;
      const e0 = Pn / (E * A0), lnr = Math.log(r), I = Lm * lnr / (r - 1), dl = e0 * I;
      const dA0 = e0 * Lm, dA1 = e0 * Lm / r, sg0 = Pn / A0, sg1 = Pn / (A0 * r);
      Ad(s, `1. Değişkenler: x = sol uçtan uzaklık (mm), A(x) = A₀(1 + kx) (mm²), A₀ = 200 mm², k = (r − 1)/L = ${N2(r - 1)}/${N2(Lm)} = ${G4(k)} 1/mm, E = 200 GPa = 200000 MPa, P = ${N2(P)} kN = ${N2(Pn)} N, L = ${N2(L)} m = ${N2(Lm)} mm.`, `1. Variables: x = distance from the left end (mm), A(x) = A₀(1 + kx) (mm²), A₀ = 200 mm², k = (r − 1)/L = ${N2(r - 1)}/${N2(Lm)} = ${G4(k)} 1/mm, E = 200 GPa = 200000 MPa, P = ${N2(P)} kN = ${N2(Pn)} N, L = ${N2(L)} m = ${N2(Lm)} mm.`);
      Ad(s, `2. Ders formülü: birim uzama ε(x) = P/(E·A(x)) ; küçük parça dδ = ε(x) dx. Toplam: δ = ∫₀^${N2(Lm)} P/(E·A₀(1 + kx)) dx.`, `2. Course formula: strain ε(x) = P/(E·A(x)) ; small piece dδ = ε(x) dx. Total: δ = ∫₀^${N2(Lm)} P/(E·A₀(1 + kx)) dx.`);
      Ad(s, `3. Sabiti dışarı al: δ = (P/(E·A₀))·∫₀^${N2(Lm)} dx/(1 + kx), P/(E·A₀) = ${N2(Pn)}/(${N2(E)}·${N2(A0)}) = ${G4(e0)}.`, `3. Take out the constant: δ = (P/(E·A₀))·∫₀^${N2(Lm)} dx/(1 + kx), P/(E·A₀) = ${N2(Pn)}/(${N2(E)}·${N2(A0)}) = ${G4(e0)}.`);
      Ad(s, `4. Ters türev: ∫dx/(1 + kx) = ln(1 + kx)/k.`, `4. Antiderivative: ∫dx/(1 + kx) = ln(1 + kx)/k.`);
      Ad(s, `5. Sınırlar: [ln(1 + k·${N2(Lm)}) − ln 1]/k = ln(${N2(r)})/k = ${N2(lnr)}/${G4(k)} = ${N2(I)} mm (1 + kL = r olduğundan).`, `5. Limits: [ln(1 + k·${N2(Lm)}) − ln 1]/k = ln(${N2(r)})/k = ${N2(lnr)}/${G4(k)} = ${N2(I)} mm (since 1 + kL = r).`);
      Ad(s, `6. δ = ${G4(e0)}·${N2(I)} = ${N2(dl)} mm (genel: δ = P·L·ln r/(E·A₀·(r − 1))).`, `6. δ = ${G4(e0)}·${N2(I)} = ${N2(dl)} mm (general: δ = P·L·ln r/(E·A₀·(r − 1))).`);
      Ad(s, `7. Kontrol: sabit A₀ kesitli çubuk ${N2(dA0)} mm, sabit A₁ = ${N2(A0 * r)} mm² kesitli çubuk ${N2(dA1)} mm uzar; gerçek değer ${N2(dl)} mm bu ikisinin arasındadır ✓.`, `7. Check: a bar of constant A₀ stretches ${N2(dA0)} mm, a bar of constant A₁ = ${N2(A0 * r)} mm² stretches ${N2(dA1)} mm; the true ${N2(dl)} mm lies between them ✓.`);
      Ad(s, `8. Birim: N/(MPa·mm²) = boyutsuz ; boyutsuz·mm = mm ✓. Gerilmeler: σ(0) = P/A₀ = ${N2(sg0)} MPa, σ(L) = P/A₁ = ${N2(sg1)} MPa.`, `8. Units: N/(MPa·mm²) = dimensionless ; dimensionless·mm = mm ✓. Stresses: σ(0) = P/A₀ = ${N2(sg0)} MPa, σ(L) = P/A₁ = ${N2(sg1)} MPa.`);
      Ad(s, `9. Yorum: çubuk toplam ${N2(dl)} mm uzar; uzamanın çoğu ince (gerilmesi yüksek) uçta olur. Grafik birim uzama ε(x)'i (‰) gösterir; x metre olduğundan gölgeli alan (‰·m = mm) doğrudan δ = ${N2(dl)} mm'dir.`, `9. Interpretation: the bar stretches ${N2(dl)} mm in total, most of it near the thin (highly stressed) end. The graph shows the strain ε(x) in ‰; with x in metres the shaded area (‰·m = mm) is directly δ = ${N2(dl)} mm.`);
      break; }
    default: {
      const D = x[0], M = x[1];
      const b = D / SQ3, h = D * Math.sqrt(2 / 3), S = D ** 3 / (9 * SQ3), sg = M * 1e6 / S;
      const bs = D / Math.SQRT2, Ssq = bs ** 3 / 6, gain = (S / Ssq - 1) * 100;
      Ad(s, `1. Değişkenler: b, h = kesit boyutları (mm), D = ${N2(D)} mm, kısıt b² + h² = D² = ${N2(D * D)} mm², S = b·h²/6 (mm³), M = ${N2(M)} kN·m = ${N2(M * 1e6)} N·mm, σ = M/S (MPa).`, `1. Variables: b, h = section dimensions (mm), D = ${N2(D)} mm, constraint b² + h² = D² = ${N2(D * D)} mm², S = b·h²/6 (mm³), M = ${N2(M)} kN·m = ${N2(M * 1e6)} N·mm, σ = M/S (MPa).`);
      Ad(s, `2. Kısıttan h² = D² − b² ; S tek değişkene iner: S(b) = b(${N2(D * D)} − b²)/6 = (${N2(D * D)}b − b³)/6, 0 < b < ${N2(D)}.`, `2. From the constraint h² = D² − b² ; S reduces to one variable: S(b) = b(${N2(D * D)} − b²)/6 = (${N2(D * D)}b − b³)/6, 0 < b < ${N2(D)}.`);
      Ad(s, `3. Türev: S′(b) = (${N2(D * D)} − 3b²)/6.`, `3. Derivative: S′(b) = (${N2(D * D)} − 3b²)/6.`);
      Ad(s, `4. S′(b) = 0 ⇒ 3b² = ${N2(D * D)} ⇒ b² = ${N2(D * D / 3)} ⇒ b = D/√3 = ${N2(b)} mm (b > 0).`, `4. S′(b) = 0 ⇒ 3b² = ${N2(D * D)} ⇒ b² = ${N2(D * D / 3)} ⇒ b = D/√3 = ${N2(b)} mm (b > 0).`);
      Ad(s, `5. İkinci türev: S″(b) = −6b/6 = −b ; b = ${N2(b)} için S″ = ${N2(-b)} < 0 ⇒ maksimum ✓. Uçlarda (b → 0, b → ${N2(D)}) S → 0 olduğundan bu yerel değil, genel maksimumdur.`, `5. Second derivative: S″(b) = −6b/6 = −b ; at b = ${N2(b)}, S″ = ${N2(-b)} < 0 ⇒ maximum ✓. At the ends (b → 0, b → ${N2(D)}) S → 0, so this is the global maximum.`);
      Ad(s, `6. Yükseklik: h = √(D² − b²) = √(${N2(D * D)} − ${N2(D * D / 3)}) = √${N2(2 * D * D / 3)} = ${N2(h)} mm ; h/b = √2 = ${N2(h / b)}.`, `6. Height: h = √(D² − b²) = √(${N2(D * D)} − ${N2(D * D / 3)}) = √${N2(2 * D * D / 3)} = ${N2(h)} mm ; h/b = √2 = ${N2(h / b)}.`);
      Ad(s, `7. En büyük kesit modülü: S = b·h²/6 = ${N2(b)}·${N2(h * h)}/6 = ${N2(S)} mm³ (genel: D³/(9√3)).`, `7. Largest section modulus: S = b·h²/6 = ${N2(b)}·${N2(h * h)}/6 = ${N2(S)} mm³ (general: D³/(9√3)).`);
      Ad(s, `8. Gerilme: σ = M/S = ${N2(M * 1e6)}/${N2(S)} = ${N2(sg)} MPa. Kıyas: kare kesit (b = h = D/√2 = ${N2(bs)} mm) S = ${N2(Ssq)} mm³ verir; optimum kesit %${N2(gain)} daha yüksek S sağlar ✓.`, `8. Stress: σ = M/S = ${N2(M * 1e6)}/${N2(S)} = ${N2(sg)} MPa. Comparison: a square section (b = h = D/√2 = ${N2(bs)} mm) gives S = ${N2(Ssq)} mm³; the optimum section has ${N2(gain)}% more S ✓.`);
      Ad(s, `9. Yorum: kütükten en dayanıklı kiriş b = ${N2(b)} mm × h = ${N2(h)} mm'dir (h/b = √2) ve σ = ${N2(sg)} MPa verir. Grafik S(b)'yi (cm³) gösterir; altın işaret tepe noktasıdır.`, `9. Interpretation: the strongest beam from the log is b = ${N2(b)} mm × h = ${N2(h)} mm (h/b = √2) giving σ = ${N2(sg)} MPa. The graph shows S(b) in cm³; the gold marker is the peak.`);
      break; }
    }
    return s;
  }

  function ExtDraw(canvas, problem) {
    const x = clampP(problem.scn, problem.p);
    const accent = canvas.accent();
    switch (problem.scn) {
    case 8: {
      const w0 = x[0], L = x[1];
      const fm = (u) => (u < 0 || u > L ? NaN : w0 * u ** 3 / (6 * L));
      const fv = (u) => (u < 0 || u > L ? NaN : w0 * u * u / (2 * L));
      const Mm = w0 * L * L / 6, Vm = w0 * L / 2, top = Math.max(Mm, Vm);
      canvas.setViewport(-L * 0.12, L * 1.2, -top * 0.15, top * 1.3);
      Shade(canvas, fm, 0, L, canvas.blue());
      canvas.addFunction({ evaluator: safe(fm), color: accent, thickness: 3.0, label: '|M|' });
      canvas.addFunction({ evaluator: safe(fv), color: canvas.orange(), thickness: 2.0, label: '|V|' });
      canvas.addMarker({ x: L, y: Mm, color: canvas.gold(), radius: 7.0, label: `|M|max = ${N2(Mm)}` });
      break; }
    case 9: {
      const w = x[0], L = x[1], ei = x[2];
      const f = (u) => (u < 0 || u > L ? NaN : 1000 * w * (L ** 3 * u - 2 * L * u ** 3 + u ** 4) / (24 * ei));
      const top = 1000 * 5 * w * L ** 4 / (384 * ei);
      canvas.setViewport(-L * 0.12, L * 1.15, -top * 0.2, top * 1.35);
      Shade(canvas, f, 0, L, canvas.blue());
      canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
      canvas.addGuideLine({ axis: 'vertical', position: L / 2, color: canvas.gray(), label: `δ′ = 0, x₀ = ${N2(L / 2)}` });
      canvas.addMarker({ x: L / 2, y: top, color: canvas.gold(), radius: 7.0, label: `δmax = ${N2(top)} mm` });
      break; }
    case 10: {
      const T0 = x[0], L = x[1], d = x[2];
      const J = Math.PI * d ** 4 / 32;
      const f = (u) => (u < 0 || u > L ? NaN : (T0 * 1e6 * 1000 * (u - u * u / (2 * L)) / (80000 * J)) * 180 / Math.PI);
      const top = f(L);
      canvas.setViewport(-L * 0.12, L * 1.2, -top * 0.15, top * 1.3);
      Shade(canvas, f, 0, L, canvas.blue());
      canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
      canvas.addMarker({ x: L, y: top, color: canvas.gold(), radius: 7.0, label: `φ(${N2(L)}) = ${N2(top)}°` });
      break; }
    case 11: {
      const h = x[0], b = x[1];
      const f1 = (u) => (u < 0 || u > b ? NaN : h * u / b);
      const f2 = (u) => (u < 0 || u > b ? NaN : h * u * u / (b * b));
      canvas.setViewport(-b * 0.12, b * 1.2, -h * 0.15, h * 1.25);
      const n = 60, col = rgba(canvas.blue(), 0.35);
      for (let i = 0; i < n; i++) {
        const u = b * (i + 0.5) / n;
        canvas.addSegment({ x1: u, y1: f2(u), x2: u, y2: f1(u), color: col, thickness: 6 });
      }
      canvas.addFunction({ evaluator: safe(f1), color: accent, thickness: 3.0, label: 'y₁' });
      canvas.addFunction({ evaluator: safe(f2), color: canvas.orange(), thickness: 3.0, label: 'y₂' });
      canvas.addGuideLine({ axis: 'vertical', position: b / 2, color: canvas.gray(), label: `x̄ = ${N2(b / 2)}` });
      canvas.addMarker({ x: b / 2, y: 2 * h / 5, color: canvas.gold(), radius: 7.0, label: `(${N2(b / 2)}; ${N2(2 * h / 5)})` });
      break; }
    case 12: {
      const w = x[0], h1 = x[1], h2 = x[2];
      const q = (u) => (u < h1 || u > h2 ? NaN : GW * w * u);
      const F = GW * w * (h2 * h2 - h1 * h1) / 2, ycp = (GW * w * (h2 ** 3 - h1 ** 3) / 3) / F;
      const top = GW * w * h2;
      canvas.setViewport(-h2 * 0.1, h2 * 1.2, -top * 0.15, top * 1.3);
      Shade(canvas, q, h1, h2, canvas.blue());
      canvas.addFunction({ evaluator: safe(q), color: accent, thickness: 3.0 });
      canvas.addGuideLine({ axis: 'vertical', position: ycp, color: canvas.gray(), label: `y_cp = ${N2(ycp)}` });
      canvas.addMarker({ x: ycp, y: GW * w * ycp, color: canvas.gold(), radius: 7.0, label: `F = ${N2(F)} kN` });
      break; }
    case 13: {
      const w = x[0], L = x[1], h = x[2];
      const H = w * L * L / (8 * h), Tmax = Math.sqrt(H * H + (w * L / 2) ** 2);
      const f = (u) => (Math.abs(u) > L / 2 ? NaN : Math.sqrt(H * H + (w * u) ** 2));
      canvas.setViewport(-L * 0.6, L * 0.6, 0, Tmax * 1.35);
      Shade(canvas, f, -L / 2, L / 2, canvas.blue());
      canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
      canvas.addMarker({ x: 0, y: H, color: canvas.gold(), radius: 7.0, label: `Tmin = ${N2(H)}` });
      canvas.addMarker({ x: L / 2, y: Tmax, color: canvas.gold(), radius: 7.0, label: `Tmax = ${N2(Tmax)}` });
      break; }
    case 14: {
      const P = x[0], L = x[1], r = x[2];
      const f = (u) => (u < 0 || u > L ? NaN : 1000 * (P * 1000) / (200000 * 200 * (1 + (r - 1) * u / L)));
      const top = f(0), dl = (P * 1000) / (200000 * 200) * (L * 1000) * Math.log(r) / (r - 1);
      canvas.setViewport(-L * 0.12, L * 1.2, -top * 0.15, top * 1.35);
      Shade(canvas, f, 0, L, canvas.blue());
      canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
      canvas.addMarker({ x: 0, y: top, color: canvas.gold(), radius: 7.0, label: `ε(0) = ${N2(top)}‰` });
      canvas.addMarker({ x: L, y: f(L), color: canvas.orange(), radius: 6.0, label: `δ = ${N2(dl)} mm` });
      break; }
    default: {
      const D = x[0], M = x[1];
      const f = (u) => (u <= 0 || u >= D ? NaN : u * (D * D - u * u) / 6 / 1000);
      const bs = D / SQ3, Smax = D ** 3 / (9 * SQ3) / 1000;
      canvas.setViewport(-D * 0.05, D * 1.1, -Smax * 0.15, Smax * 1.4);
      canvas.addFunction({ evaluator: safe(f), color: accent, thickness: 3.0 });
      canvas.addGuideLine({ axis: 'vertical', position: bs, color: canvas.gray(), label: `b = ${N2(bs)}` });
      canvas.addMarker({ x: bs, y: Smax, color: canvas.gold(), radius: 7.0, label: `Smax = ${N2(Smax)} cm³` });
      break; }
    }
  }

  // =====================================================================================================
  // Schematic drawings (virtual 100 x 100 space, origin bottom-left). Live: follow the current parameters.
  // =====================================================================================================
  const cl = (v, a, b) => Math.min(b, Math.max(a, v));

  // curved moment symbol (arc + arrow head at the end); ccw = counter-clockwise
  function momentSym(sc, cx, cy, r, ccw, col) {
    const a0 = -60, a1 = 210, color = col || sc.c.load;
    sc.arc(cx, cy, r, a0, a1, { color, w: 0.9 });
    const rad = (a) => a * Math.PI / 180;
    if (ccw) {
      const tx0 = cx + r * Math.cos(rad(a1)), ty0 = cy + r * Math.sin(rad(a1));
      const dx = -Math.sin(rad(a1)), dy = Math.cos(rad(a1));
      sc.arrow(tx0 - dx * 1.6, ty0 - dy * 1.6, tx0, ty0, { color, w: 0.9, head: 2.4 });
    } else {
      const tx0 = cx + r * Math.cos(rad(a0)), ty0 = cy + r * Math.sin(rad(a0));
      const dx = Math.sin(rad(a0)), dy = -Math.cos(rad(a0));
      sc.arrow(tx0 - dx * 1.6, ty0 - dy * 1.6, tx0, ty0, { color, w: 0.9, head: 2.4 });
    }
  }

  function drawSchematic(sc, problem) {
    try {
      if (!problem || !sc) return;
      const scn = Math.max(0, Math.min(15, Math.floor(Number(problem.scn)) || 0));
      const x = clampP(scn, problem.p);
      const T = (px, py, str, o) => sc.text(px, py, str, Object.assign({ size: 3.2 }, o));
      const c = sc.c;
      const dash = [1.2, 1.2];
      // simply supported beam body with pin (left) and roller (right) at beam centre-line y
      const ssBeam = (y, x1, x2) => { sc.beam(x1, x2, y, 4); sc.pinSupport(x1, y - 2); sc.rollerSupport(x2, y - 2); };

      switch (scn) {
      case 0: {
        const a = x[0], L = x[1], W = a * L * L / 2, xb = 2 * L / 3;
        sc.title(tx('Üçgen yayılı yük', 'Triangular distributed load'));
        const y = 42, x1 = 14, x2 = 86;
        ssBeam(y, x1, x2);
        const hpk = 10 + 22 * (a * L) / 54;
        sc.distLoad(x1, x2, y + 2, (u) => hpk * (u - x1) / (x2 - x1), { color: c.load });
        const px = x1 + (x2 - x1) * xb / L;
        sc.arrow(px, 86, px, y + 2.8, { color: c.good, w: 1.1, head: 3 });
        T(px, 90.5, `W = ${N2(W)} kN`, { color: c.good, bold: true });
        T(80, y + 2 + hpk + 4.5, `w = ${N2(a * L)} kN/m`, { color: c.load });
        T(24, y + 9, 'w = 0', { color: c.sub });
        sc.line(px, y - 4, px, 12, { color: c.good, w: 0.35, dash });
        sc.dim(x1, 24, x2, 24, `L = ${N2(L)} m`, { ty: 2.8 });
        sc.dim(x1, 13, px, 13, `x̄ = ${N2(xb)} m`, { ty: -3.4 });
        break; }
      case 1: {
        const w = x[0], L = x[1], r = w * L / 2, mm = w * L * L / 8;
        sc.title(tx('Düzgün yüklü basit kiriş', 'Simply supported beam, uniform load'));
        const y = 46, x1 = 14, x2 = 86;
        ssBeam(y, x1, x2);
        const hh = 6 + 2 * w;
        sc.distLoad(x1, x2, y + 2, hh);
        T(50, y + 2 + hh + 4.5, `w = ${N2(w)} kN/m`, { color: c.load, bold: true });
        T(16, 28, `R = ${N2(r)} kN`, { color: c.good });
        T(84, 28, `R = ${N2(r)} kN`, { color: c.good });
        T(50, 28, `M(L/2) = ${N2(mm)} kN·m`, { color: c.accent });
        sc.dim(x1, 18, x2, 18, `L = ${N2(L)} m`, { ty: 2.8 });
        break; }
      case 2: {
        const w = x[0], pp = x[1], ra = 5 * w + 0.2 * pp, x0 = ra / w, m0 = ra * ra / (2 * w);
        sc.title(tx('Düzgün yük + tekil yük', 'Uniform load + point load'));
        const y = 44, x1 = 14, x2 = 86, sx = (x2 - x1) / 10;
        ssBeam(y, x1, x2);
        const hh = 6 + 4 * w;
        sc.distLoad(x1, x2, y + 2, hh);
        T(34, y + 2 + hh + 4.5, `w = ${N2(w)} kN/m`, { color: c.load, bold: true });
        const px = x1 + 8 * sx;
        sc.arrow(px, 82, px, y + 2.8, { color: c.good, w: 1.1, head: 3 });
        T(px - 6, 87, `P = ${N2(pp)} kN`, { color: c.good, bold: true });
        const gx = x1 + cl(x0, 0, 10) * sx;
        sc.line(gx, y - 2.5, gx, 31, { color: c.gold, w: 0.5, dash });
        sc.circle(gx, y + 2, 1.7, { fill: c.gold });
        T(16, 26, `R_A = ${N2(ra)} kN`, { color: c.good, size: 3 });
        T(84, 26, `R_B = ${N2(5 * w + 0.8 * pp)} kN`, { color: c.good, size: 3 });
        T(50, 26, `x₀ = ${N2(x0)} m, M = ${N2(m0)} kN·m`, { color: c.accent });
        sc.dim(x1, 16, x2, 16, tx('Açıklık 10 m', 'Span 10 m'), { ty: 2.8 });
        break; }
      case 3: {
        const k = x[0], b = x[1];
        sc.title(tx('y = k·x² altındaki alan', 'Area under y = k·x²'));
        const x0 = 22, y0 = 26, wd = 34 + 5 * b, H = 46, n = 24;
        const pts = [];
        for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x0 + u * wd, y0 + H * u * u]); }
        pts.push([x0 + wd, y0]);
        sc.poly(pts, { fill: c.fluidSoft, color: c.accent, w: 0.8 });
        sc.arrow(x0 - 4, y0, x0 + wd + 7, y0, { color: c.ink, w: 0.5, head: 2 });
        sc.arrow(x0, y0 - 3, x0, y0 + H + 5, { color: c.ink, w: 0.5, head: 2 });
        T(x0 + wd + 7, y0 - 3.5, 'x', { color: c.sub });
        T(x0 - 3.5, y0 + H + 5, 'y', { color: c.sub });
        const gx = x0 + 0.75 * wd, gy = y0 + 0.3 * H;
        sc.line(gx, y0, gx, gy, { color: c.sub, w: 0.3, dash });
        sc.line(x0, gy, gx, gy, { color: c.sub, w: 0.3, dash });
        sc.circle(gx, gy, 1.8, { fill: c.gold });
        T(x0 + 6, 86, `A = ${N2(k * b ** 3 / 3)}`, { align: 'left' });
        T(x0 + 6, 81, `x̄ = ${N2(3 * b / 4)}`, { align: 'left', color: c.accent });
        T(x0 + 6, 76, `ȳ = ${N2(3 * k * b * b / 10)}`, { align: 'left', color: c.accent });
        T(x0 + wd - 2, y0 + H + 4.5, `y(b) = ${N2(k * b * b)}`, { color: c.load });
        sc.dim(x0, y0 - 8, x0 + wd, y0 - 8, `b = ${N2(b)}`, { ty: -3.6 });
        break; }
      case 4: {
        const b = x[0], h = x[1];
        sc.title(tx('Dikdörtgen kesit, I = ∫y² dA', 'Rectangular section, I = ∫y² dA'));
        const bp = b * 0.3, hp = h * 0.3, cx = 50, cy = 56;
        const xl = cx - bp / 2, xr = cx + bp / 2, yb = cy - hp / 2, yt = cy + hp / 2;
        sc.rect(xl, yb, bp, hp, { w: 0.9 });
        sc.line(xl - 9, cy, xr + 9, cy, { color: c.accent, w: 0.5, dash: [2.4, 1, 0.6, 1] });
        T(xr + 9, cy + 3, 'x', { color: c.accent });
        const sy = cy + hp / 4;
        sc.rect(xl, sy, bp, 1.8, { fill: c.load, w: 0.3 });
        sc.line(27, sy + 0.9, xl, sy + 0.9, { color: c.sub, w: 0.25 });
        T(17, sy + 0.9, 'dA = b·dy', { size: 3 });
        sc.arrow(xr + 3, cy, xr + 3, sy + 0.9, { color: c.sub, w: 0.4, head: 1.8 });
        T(xr + 6, (cy + sy) / 2, 'y', { color: c.sub, align: 'left' });
        sc.dim(xl, yb - 6, xr, yb - 6, `b = ${N2(b)} mm`, { ty: -3.6 });
        sc.dim(xr + 7, yb, xr + 7, yt, `h = ${N2(h)} mm`, { tx: 10, ty: 0 });
        T(50, 9, `I = b·h³/12 = ${N2(b * h ** 3 / 12)} mm⁴`, { color: c.accent, bold: true });
        break; }
      case 5: {
        const pp = x[0], L = x[1], ei = x[2];
        const tip = 1000 * pp * L ** 3 / (3 * ei);
        sc.title(tx('Ucundan yüklü konsol kiriş', 'Cantilever with end load'));
        const x1 = 16, len = 24 + 8 * L, x2 = x1 + len, y0 = 62;
        const dy = Math.min(26, len * (tip / (L * 1000)) * 18);
        sc.fixedSupport(x1, y0, 'L', 26);
        sc.line(x1, y0, x2, y0, { color: c.sub, w: 0.4, dash });
        const pts = [];
        for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([x1 + len * u, y0 - dy * (3 * u * u - u ** 3) / 2]); }
        sc.poly(pts, { close: false, color: c.steelDark, w: 1.6 });
        const ty = y0 - dy;
        sc.arrow(x2, ty + 20, x2, ty + 1.5, { color: c.load, w: 1.1, head: 3 });
        T(x2 - 4, ty + 25, `P = ${N2(pp)} kN`, { color: c.load, bold: true });
        sc.circle(x2, ty, 1.5, { fill: c.gold });
        sc.dim(x1, 26, x2, 26, `L = ${N2(L)} m`, { ty: 2.8 });
        T(50, 15, `v(L) = P·L³/(3EI) = ${N2(tip)} mm`, { color: c.accent });
        T(50, 8.5, `EI = ${N2(ei)} kN·m² ${tx('(sehim abartılı)', '(deflection exaggerated)')}`, { color: c.sub, size: 3 });
        break; }
      case 6: {
        const e = x[0], ey = x[1], sy = e * ey, u = 0.5 * sy * ey;
        sc.title(tx('Gerilme - birim şekil değiştirme', 'Stress - strain curve'));
        const ox = 18, oy = 22, xs = ox + 12 * ey, ys = oy + 62 * sy / 800;
        sc.poly([[ox, oy], [xs, oy], [xs, ys]], { fill: c.fluidSoft, stroke: false });
        sc.arrow(ox - 3, oy, 93, oy, { color: c.ink, w: 0.5, head: 2 });
        sc.arrow(ox, oy - 3, ox, 90, { color: c.ink, w: 0.5, head: 2 });
        sc.line(ox, oy, xs, ys, { color: c.accent, w: 1.2 });
        sc.line(xs, ys, Math.min(xs + 20, 88), ys, { color: c.accent, w: 1.2 });
        sc.line(xs, oy, xs, ys, { color: c.sub, w: 0.3, dash });
        sc.circle(xs, ys, 1.6, { fill: c.gold });
        T(91, oy - 4, 'ε', { color: c.sub });
        T(ox - 4, 90, 'σ', { color: c.sub });
        T(xs, oy - 4.5, `ε_y = ${N2(ey)} ‰`, { color: c.ink });
        T(xs + 3, ys + 4, `σ_y = ${N2(sy)} MPa`, { align: 'left', color: c.accent });
        T(ox + 4, 84, `E = ${N2(e)} GPa`, { align: 'left', bold: true });
        T(ox + 4, 78.5, `u = ${N2(u)} kJ/m³`, { align: 'left', color: c.fluid });
        break; }
      case 7: {
        const cc = x[0], m = x[1], h = cc / 3, sm = cc ** 3 / 162, sg = m * 1e6 / sm;
        sc.title(tx('Optimum kesit: b + 2h = c', 'Optimum section: b + 2h = c'));
        const sd = 70 / 3;
        sc.rect(50 - sd / 2, 58, sd, sd, { w: 1 });
        sc.line(50 - sd / 2 - 6, 58 + sd / 2, 50 + sd / 2 + 6, 58 + sd / 2, { color: c.accent, w: 0.5, dash: [2.4, 1, 0.6, 1] });
        T(50, 58 + sd / 2, 'b = h', { bold: true });
        momentSym(sc, 24, 58 + sd / 2, 6, true);
        momentSym(sc, 76, 58 + sd / 2, 6, false);
        T(50, 87, `M = ${N2(m)} kN·m`, { color: c.load, bold: true });
        const by = 36;
        sc.rect(15, by, sd, 7, { w: 0.7 }); sc.rect(15 + sd, by, sd, 7, { w: 0.7 }); sc.rect(15 + 2 * sd, by, sd, 7, { w: 0.7 });
        T(15 + sd / 2, by + 3.5, 'b', { bold: true }); T(15 + 1.5 * sd, by + 3.5, 'h', { bold: true }); T(15 + 2.5 * sd, by + 3.5, 'h', { bold: true });
        sc.dim(15, by - 4, 85, by - 4, `c = ${N2(cc)} mm`, { ty: -3.6 });
        T(50, 17, `h = c/3 = ${N2(h)} mm, b = ${N2(cc - 2 * h)} mm`, { color: c.accent });
        T(50, 11, `S = ${N2(sm)} mm³, σ = ${N2(sg)} MPa`, { color: c.sub });
        break; }
      case 8: {
        const w0 = x[0], L = x[1], Vm = w0 * L / 2, Mm = w0 * L * L / 6;
        sc.title(tx('Konsol, üçgen yük', 'Cantilever, triangular load'));
        const x1 = 16, len = 24 + 8 * L, x2 = x1 + len, y = 50;
        sc.fixedSupport(x1, y, 'L', 24);
        sc.beam(x1, x2, y, 4);
        const hpk = 8 + 20 * w0 / 18;
        sc.distLoad(x1, x2, y + 2, (u) => hpk * (1 - (u - x1) / len), { color: c.load });
        T(x1 + 2, y + 2 + hpk + 4.5, `w₀ = ${N2(w0)} kN/m`, { align: 'left', color: c.load, bold: true });
        T(x2 - 2, y + 7, 'w = 0', { color: c.sub, size: 3 });
        sc.arrow(x2, 43, x2 - 14, 43, { color: c.sub, w: 0.4, head: 1.8 });
        T(x2 - 7, 39.5, 'x', { color: c.sub });
        sc.dim(x1, 31, x2, 31, `L = ${N2(L)} m`, { ty: 2.8 });
        T(50, 19, `|V|max = w₀L/2 = ${N2(Vm)} kN`, { color: c.good });
        T(50, 12, `|M|max = w₀L²/6 = ${N2(Mm)} kN·m`, { color: c.accent, bold: true });
        break; }
      case 9: {
        const w = x[0], L = x[1], ei = x[2];
        const dm = 1000 * 5 * w * L ** 4 / (384 * ei);
        sc.title(tx('Basit kiriş sehimi', 'Simply supported beam deflection'));
        const x1 = 14, x2 = 86, y = 58, len = x2 - x1;
        const dy = Math.min(15, len * (dm / (L * 1000)) * 20);
        sc.pinSupport(x1, y); sc.rollerSupport(x2, y);
        sc.line(x1, y, x2, y, { color: c.sub, w: 0.4, dash });
        const pts = [];
        for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([x1 + len * u, y - dy * (u - 2 * u ** 3 + u ** 4) * 3.2]); }
        sc.poly(pts, { close: false, color: c.steelDark, w: 1.6 });
        const hh = 5 + 1.5 * w;
        sc.distLoad(x1, x2, y + 3, hh);
        T(50, y + 3 + hh + 4.5, `w = ${N2(w)} kN/m`, { color: c.load, bold: true });
        sc.circle(50, y - dy, 1.8, { fill: c.gold });
        sc.dim(x1, 30, x2, 30, `L = ${N2(L)} m`, { ty: 2.8 });
        T(50, 21, `δ_max = 5wL⁴/(384EI) = ${N2(dm)} mm`, { color: c.accent, bold: true });
        T(50, 14.5, `x₀ = L/2 = ${N2(L / 2)} m, EI = ${N2(ei)} kN·m²`, { color: c.sub, size: 3 });
        T(50, 8.5, tx('(sehim abartılı)', '(deflection exaggerated)'), { color: c.sub, size: 2.8 });
        break; }
      case 10: {
        const T0 = x[0], L = x[1], d = x[2];
        const J = Math.PI * d ** 4 / 32, phi = T0 * L / 2 * 1e9 / (80000 * J), deg = phi * 180 / Math.PI;
        sc.title(tx('Değişken burulma momentli mil', 'Shaft with varying torque'));
        const x0 = 20, len = 20 + 12 * L, x2 = x0 + len, y = 56, r = 4 + d / 8;
        sc.fixedSupport(x0, y, 'L', 2 * r + 12);
        sc.beam(x0, x2, y, 2 * r);
        const vis = Math.min(2.1, deg * 0.15 + 0.05);
        const pts = [];
        for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push([x0 + len * s, y + r * Math.cos(vis * (2 * s - s * s))]); }
        sc.poly(pts, { close: false, color: c.accent, w: 1.2 });
        momentSym(sc, x2 + 8, y, 6, true);
        T(x2 + 7, y + r + 9, `T₀ = ${N2(T0)} kN·m`, { color: c.load, bold: true, size: 3 });
        sc.dim(x0, 28, x2, 28, `L = ${N2(L)} m`, { ty: 2.8 });
        T(50, 19, `φ = ∫T dx/(GJ) = ${N2(deg)}°`, { color: c.accent, bold: true });
        T(50, 12.5, `d = ${N2(d)} mm, G = 80 GPa, T(x) = T₀(1 − x/L)`, { color: c.sub, size: 3 });
        break; }
      case 11: {
        const h = x[0], b = x[1];
        sc.title(tx('Parabolik spandrel', 'Parabolic spandrel'));
        const x0 = 22, y0 = 26, wd = 38 + 4 * b, H = 24 + 3.5 * h, n = 24;
        const pts = [[x0, y0]];
        for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x0 + u * wd, y0 + H * u]); }
        for (let i = n; i >= 0; i--) { const u = i / n; pts.push([x0 + u * wd, y0 + H * u * u]); }
        sc.poly(pts, { fill: c.fluidSoft, stroke: false });
        sc.line(x0, y0, x0 + wd, y0 + H, { color: c.accent, w: 1.1 });
        const par = [];
        for (let i = 0; i <= n; i++) { const u = i / n; par.push([x0 + u * wd, y0 + H * u * u]); }
        sc.poly(par, { close: false, color: c.heat, w: 1.1 });
        sc.arrow(x0 - 4, y0, x0 + wd + 6, y0, { color: c.ink, w: 0.5, head: 2 });
        sc.arrow(x0, y0 - 3, x0, y0 + H + 5, { color: c.ink, w: 0.5, head: 2 });
        const gx = x0 + wd / 2, gy = y0 + 0.4 * H;
        sc.line(gx, y0, gx, gy, { color: c.sub, w: 0.3, dash });
        sc.circle(gx, gy, 1.8, { fill: c.gold });
        T(gx, y0 - 3.2, `x̄ = ${N2(b / 2)}`, { color: c.sub, size: 2.8 });
        T(x0, y0 + H + 9, `A = hb/6 = ${N2(h * b / 6)} cm²`, { align: 'left', color: c.accent });
        T(x0, y0 + H + 4, `x̄ = ${N2(b / 2)}, ȳ = ${N2(2 * h / 5)} cm`, { align: 'left', color: c.accent });
        T(x0 + wd, y0 + H + 4, `h = ${N2(h)}`, { color: c.sub, size: 2.8 });
        sc.dim(x0, y0 - 9, x0 + wd, y0 - 9, `b = ${N2(b)} cm`, { ty: -3.6 });
        T(50, 8, tx('y₁ = (h/b)x doğru, y₂ = (h/b²)x² parabol', 'y₁ = (h/b)x line, y₂ = (h/b²)x² parabola'), { color: c.sub, size: 2.8 });
        break; }
      case 12: {
        const w = x[0], h1 = x[1], h2 = x[2];
        const F = GW * w * (h2 * h2 - h1 * h1) / 2, ycp = (GW * w * (h2 ** 3 - h1 ** 3) / 3) / F;
        sc.title(tx('Düşey kapakta hidrostatik kuvvet', 'Hydrostatic force on a vertical gate'));
        const sY = 7.5, base = 20, top = base + sY * h2, wx = 52;
        sc.rect(20, base, wx - 20, sY * h2, { fill: c.fluidSoft, stroke: false });
        sc.line(20, top, wx, top, { color: c.fluid, w: 0.7 });
        sc.line(20, base, 20, top + 3, { w: 0.8 });
        sc.rect(wx, base, 3, sY * h2 + 6, { w: 0.8 });
        sc.ground(18, 58, base);
        const gTop = base + sY * (h2 - h1);
        sc.rect(wx, base, 3, gTop - base, { fill: c.accent, w: 0.8 });
        for (let i = 0; i <= 4; i++) {
          const dpt = h1 + (h2 - h1) * i / 4, yy = base + sY * (h2 - dpt), ln = 3.9 * dpt;
          sc.arrow(wx - ln, yy, wx, yy, { color: c.fluid, w: 0.5, head: 1.8 });
        }
        sc.poly([[wx, gTop], [wx - 3.9 * h1, gTop], [wx - 3.9 * h2, base]], { close: false, color: c.fluid, w: 0.5 });
        const fy = base + sY * (h2 - ycp);
        sc.arrow(57, fy, 75, fy, { color: c.good, w: 1.2, head: 3 });
        T(68, fy - 4.2, `F = ${N2(F)} kN`, { color: c.good, bold: true });
        T(60, gTop + 3.5, `h₁ = ${N2(h1)} m`, { align: 'left', color: c.sub, size: 2.9 });
        sc.dim(14, top, 14, base, '');
        T(10.5, (top + base) / 2, `h₂ = ${N2(h2)} m`, { rot: 90, color: c.sub, size: 3 });
        T(50, 11, `y_cp = ${N2(ycp)} m ${tx('(yüzeyden)', '(below surface)')}`, { color: c.accent });
        T(50, 5.5, `w = ${N2(w)} m, p = ρg·y`, { color: c.sub, size: 2.9 });
        break; }
      case 13: {
        const w = x[0], L = x[1], h = x[2];
        const H = w * L * L / (8 * h), Tmax = Math.sqrt(H * H + (w * L / 2) ** 2);
        const u = 4 * h / L, sLen = (L / 2) * Math.sqrt(1 + u * u) + (L * L / (8 * h)) * Math.asinh(u);
        sc.title(tx('Parabolik kablo', 'Parabolic cable'));
        const x1 = 14, x2 = 86, yt = 72, sag = Math.min(30, 90 * h / L), yg = 40;
        sc.line(x1, yt, x1, yg, { w: 1.6 }); sc.line(x2, yt, x2, yg, { w: 1.6 });
        sc.ground(x1 - 6, x1 + 6, yg); sc.ground(x2 - 6, x2 + 6, yg);
        const yc = (xx) => { const s = (xx - x1) / (x2 - x1); return yt - sag * (1 - (2 * s - 1) ** 2); };
        const pts = [];
        for (let i = 0; i <= 28; i++) { const xx = x1 + (x2 - x1) * i / 28; pts.push([xx, yc(xx)]); }
        sc.poly(pts, { close: false, color: c.steelDark, w: 1.4 });
        for (let i = 0; i < 10; i++) { const xx = x1 + 8 * i + 4; if (xx > x1 && xx < x2) sc.arrow(xx, yc(xx) + 11, xx, yc(xx) + 0.9, { color: c.load, w: 0.5, head: 1.8 }); }
        T(50, yt + 10, `w = ${N2(w)} kN/m`, { color: c.load, bold: true });
        sc.line(x1, yt, x2, yt, { color: c.sub, w: 0.3, dash });
        sc.dim(50, yt, 50, yt - sag, '');
        sc.circle(50, yt - sag, 1.7, { fill: c.gold });
        sc.dim(x1, 31, x2, 31, `L = ${N2(L)} m, h = ${N2(h)} m`, { ty: 2.8 });
        T(50, 21, `H = T_min = ${N2(H)} kN, T_max = ${N2(Tmax)} kN`, { color: c.accent, bold: true, size: 3 });
        T(50, 14.5, `s = ∫√(1 + y′²) dx = ${N2(sLen)} m`, { color: c.sub, size: 3 });
        break; }
      case 14: {
        const P = x[0], L = x[1], r = x[2];
        const e0 = P * 1000 / (200000 * 200), dl = e0 * L * 1000 * Math.log(r) / (r - 1);
        sc.title(tx('Kademeli kesitli çubuk', 'Tapered bar'));
        const x1 = 22, len = 22 + 8 * L, x2 = x1 + len, y = 62, hl = 8, hr = 8 * r;
        sc.fixedSupport(x1, y, 'L', 42);
        sc.poly([[x1, y - hl / 2], [x2, y - hr / 2], [x2, y + hr / 2], [x1, y + hl / 2]], { fill: c.fill, w: 0.9 });
        const dx = Math.min(7, len * (dl / (L * 1000)) * 80);
        sc.poly([[x1, y - hl / 2], [x2 + dx, y - hr / 2], [x2 + dx, y + hr / 2], [x1, y + hl / 2]], { color: c.heat, w: 0.5, dash: [1.6, 1.2] });
        sc.arrow(x2 + dx, y, x2 + dx + 10, y, { color: c.load, w: 1.2, head: 3 });
        T(x2 + dx + 9, y + 5, `P = ${N2(P)} kN`, { color: c.load, bold: true, size: 3 });
        T(x1 + 5, 41, `A₀ = 200 mm²`, { color: c.sub, size: 3 });
        T(x2 - 2, 38, `A₁ = ${N2(200 * r)} mm²`, { color: c.sub, size: 3 });
        sc.dim(x1, 28, x2, 28, `L = ${N2(L)} m`, { ty: 2.8 });
        T(50, 17, `δ = ∫P/(E·A(x)) dx = ${N2(dl)} mm`, { color: c.accent, bold: true });
        T(50, 10.5, `E = 200 GPa, A₁/A₀ = ${N2(r)} ${tx('(uzama abartılı)', '(stretch exaggerated)')}`, { color: c.sub, size: 2.9 });
        break; }
      default: {
        const D = x[0], m = x[1];
        const b = D / SQ3, h = D * Math.sqrt(2 / 3), S = D ** 3 / (9 * SQ3), sg = m * 1e6 / S;
        sc.title(tx('Kütükten en dayanıklı kiriş', 'Strongest beam from a log'));
        const cx = 50, cy = 62, R = 24, bp = 2 * R / SQ3, hp = 2 * R * Math.sqrt(2 / 3);
        sc.circle(cx, cy, R, { fill: c.fill, w: 0.9 });
        sc.rect(cx - bp / 2, cy - hp / 2, bp, hp, { fill: c.fluidSoft, w: 1 });
        sc.line(cx - R, cy, cx + R, cy, { color: c.sub, w: 0.3, dash });
        T(cx, cy - hp / 2 + 3.5, 'b', { bold: true });
        T(cx - bp / 2 + 3.5, cy, 'h', { bold: true });
        momentSym(sc, 11, cy, 5, true);
        momentSym(sc, 89, cy, 5, false);
        T(50, 89.5, `M = ${N2(m)} kN·m`, { color: c.load, bold: true });
        sc.dim(cx - R, 31, cx + R, 31, `D = ${N2(D)} mm`, { ty: 2.8 });
        T(50, 21, `b = D/√3 = ${N2(b)} mm, h = ${N2(h)} mm`, { color: c.accent, size: 3 });
        T(50, 14.5, `S_max = ${N2(S)} mm³`, { color: c.accent, size: 3, bold: true });
        T(50, 8.5, `σ = M/S = ${N2(sg)} MPa`, { color: c.sub, size: 3 });
        break; }
      }
    } catch (e) { /* a sketch must never break the page */ }
  }

  function Meaning(p) { return MeaningBase(p) + '\n\n' + MeaningExtra(p.scn); }

  function Overview() {
    return tx("MÜHENDİSLİK UYGULAMASI: STATİK VE MUKAVEMET\nKiriş, levha ve numune hesaplarında integral \"toplama\" (yük, alan, moment, enerji), türev ise \"değişim hızı ve ekstremum\" (V = M′, eğim, optimum) aracıdır.\n\nTANIM VE FORMÜLLER\n• Yayılı yük w(x) [kN/m]: bileşke W = ∫w dx [kN]; etki çizgisi x̄ = ∫x·w dx / W [m] (ağırlıklı ortalama).\n• Yük – kesme – moment zinciri: dV/dx = −w, dM/dx = V. Yani V = R_A − ∫₀ˣ w dx ve M = ∫₀ˣ V dx.\n• Maksimum moment: M′ = V = 0 olduğu yerde; V′ = −w < 0 ise tepe (maksimum).\n• Ağırlık merkezi: A = ∫y dx, x̄ = ∫x·y dx / A, ȳ = ∫(y²/2) dx / A.\n• Atalet momenti: I = ∫y² dA (dikdörtgen için b·h³/12) [mm⁴]; eğilme gerilmesi σ = M·c/I = M/S.\n• Sehim: EI·v″ = M(x); iki kez integral + sınır koşulları (ankastre: v(0) = 0, v′(0) = 0).\n• Gerilme–şekil değiştirme: E = dσ/dε (eğim), birim hacim enerjisi u = ∫σ dε (alan).\n• Optimum kesit: kısıtla tek değişkene in, S′(h) = 0, S″ < 0 ile doğrula.\n• Çift integral sehim: EI·δ″ = −M(x), C₁ ve C₂ sınır koşullarından; maksimum sehim δ′ = 0.\n• Burulma: φ = ∫T(x)/(G·J) dx, J = πd⁴/32; τ = T·r/J.\n• İki eğri arası: A = ∫(y₁ − y₂) dx, ȳ = ∫½(y₁² − y₂²) dx / A.\n• Hidrostatik kuvvet: F = ∫ρg·y·w dy, y_cp = ∫y dF / F.\n• Kablo: H = wL²/(8h), T = √(H² + (wx)²), s = ∫√(1 + y′²) dx (asinh).\n• Değişken kesitli çubuk: δ = ∫P/(E·A(x)) dx (doğrusal A için logaritma).\n• Kütükten kesit: b² + h² = D², S = b·h²/6 → S′ = 0 → b = D/√3.\n\nYÖNTEM\n1. Büyüklükleri ve birimlerini yaz (kN, m, mm, MPa).\n2. Yükü ya da geometriyi fonksiyon olarak yaz (w(x), y(x), σ(ε)).\n3. İlgili integrali / türevi kur; sınırlar mesnetler, uçlar ya da kesit kenarlarıdır.\n4. Ters türevi al, sınırları uygula; sabitleri sınır koşullarından bul (M(0) = 0, v(0) = 0 ...).\n5. Birim ve mantık kontrolü: örn. basit mesnette M(L) = 0, üçgen alan = ½·taban·yükseklik.\n\nÖZEL DURUMLAR VE TUZAKLAR\n• Tekil yük V grafiğinde sıçrama yapar: her bölgeyi ayrı inceleyin.\n• mm⁴ ↔ m⁴ dönüşümü 10¹²; GPa ↔ MPa ×1000; ‰ = 10⁻³; kN·m → N·mm için ×10⁶.\n• Şeridin ağırlık merkezi y/2'dedir (y değil). Eksen ağırlık merkezinden geçmiyorsa paralel eksen teoremi gerekir.\n• İşaret kabulünü sabit tutun; integral sabitlerini unutmayın.\n\nMİNİ ÖRNEK\nBasit mesnetli kiriş, w = 4 kN/m, L = 6 m: R_A = R_B = wL/2 = 12 kN; V = 12 − 4x; M = 12x − 2x². V = 0 → x = 3 m; M_maks = 36 − 18 = 18 kN·m = wL²/8 ✓.\n\nHAFIZA KURALI\nYük → (∫) → Kesme → (∫) → Moment → (∫∫ /EI) → Sehim. Geri dönüş türevle: M′ = V, V′ = −w.",
      "ENGINEERING APPLICATION: STATICS AND STRENGTH OF MATERIALS\nIn beam, plate and specimen calculations the integral is the \"adding up\" tool (load, area, moment, energy), while the derivative is the tool for \"rate of change and extrema\" (V = M′, slope, optimum).\n\nDEFINITIONS AND FORMULAS\n• Distributed load w(x) [kN/m]: resultant W = ∫w dx [kN]; line of action x̄ = ∫x·w dx / W [m] (a weighted average).\n• Load – shear – moment chain: dV/dx = −w, dM/dx = V. So V = R_A − ∫₀ˣ w dx and M = ∫₀ˣ V dx.\n• Maximum moment: where M′ = V = 0; if V′ = −w < 0 it is a peak (maximum).\n• Centroid: A = ∫y dx, x̄ = ∫x·y dx / A, ȳ = ∫(y²/2) dx / A.\n• Second moment of area: I = ∫y² dA (rectangle: b·h³/12) [mm⁴]; bending stress σ = M·c/I = M/S.\n• Deflection: EI·v″ = M(x); two integrations + boundary conditions (cantilever: v(0) = 0, v′(0) = 0).\n• Stress–strain: E = dσ/dε (slope), strain-energy density u = ∫σ dε (area).\n• Optimum section: reduce to one variable with the constraint, S′(h) = 0, confirm with S″ < 0.\n• Double-integration deflection: EI·δ″ = −M(x), C₁ and C₂ from boundary conditions; maximum deflection at δ′ = 0.\n• Torsion: φ = ∫T(x)/(G·J) dx, J = πd⁴/32; τ = T·r/J.\n• Between two curves: A = ∫(y₁ − y₂) dx, ȳ = ∫½(y₁² − y₂²) dx / A.\n• Hydrostatic force: F = ∫ρg·y·w dy, y_cp = ∫y dF / F.\n• Cable: H = wL²/(8h), T = √(H² + (wx)²), s = ∫√(1 + y′²) dx (asinh).\n• Tapered bar: δ = ∫P/(E·A(x)) dx (a logarithm for linear A).\n• Section from a log: b² + h² = D², S = b·h²/6 → S′ = 0 → b = D/√3.\n\nMETHOD\n1. Write the quantities and their units (kN, m, mm, MPa).\n2. Write the load or geometry as a function (w(x), y(x), σ(ε)).\n3. Set up the relevant integral / derivative; the limits are supports, ends or section edges.\n4. Take the antiderivative, apply the limits; find the constants from boundary conditions (M(0) = 0, v(0) = 0 ...).\n5. Unit and sanity check: e.g. M(L) = 0 at a simple support, triangle area = ½·base·height.\n\nSPECIAL CASES AND PITFALLS\n• A point load makes the V diagram jump: treat each region separately.\n• mm⁴ ↔ m⁴ is 10¹²; GPa ↔ MPa ×1000; ‰ = 10⁻³; kN·m → N·mm is ×10⁶.\n• A strip's centroid is at y/2 (not y). If the axis misses the centroid use the parallel-axis theorem.\n• Keep one sign convention; do not forget integration constants.\n\nMINI EXAMPLE\nSimply supported beam, w = 4 kN/m, L = 6 m: R_A = R_B = wL/2 = 12 kN; V = 12 − 4x; M = 12x − 2x². V = 0 → x = 3 m; M_max = 36 − 18 = 18 kN·m = wL²/8 ✓.\n\nMEMORY AID\nLoad → (∫) → Shear → (∫) → Moment → (∫∫ /EI) → Deflection. Going back uses derivatives: M′ = V, V′ = −w.");
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
    id: 'engStatics',
    tabTitle: () => tx("Statik ve Mukavemet", "Statics & Strength of Materials"),
    concept,
    problemStatement,
    createProblem,
    solveSteps: EngAssume.wrap("statics", Steps),
    draw,
    drawSchematic,
    buildControls,
    links: [
      { match: /^• (Yayılı yük|Distributed load)/, make: (rng) => makeScn(rng, 0) },
      { match: /^• (Yük .{1,3} kesme|Load .{1,3} shear)/, make: (rng) => makeScn(rng, 1) },
      { match: /^• (Maksimum moment|Maximum moment)/, make: (rng) => makeScn(rng, 2) },
      { match: /^• (Ağırlık merkezi|Centroid)/, make: (rng) => makeScn(rng, 3) },
      { match: /^• (Atalet momenti|Second moment)/, make: (rng) => makeScn(rng, 4) },
      { match: /^• (Sehim|Deflection)/, make: (rng) => makeScn(rng, 5) },
      { match: /^• (Gerilme.şekil|Stress.strain)/, make: (rng) => makeScn(rng, 6) },
      { match: /^• (Optimum kesit|Optimum section)/, make: (rng) => makeScn(rng, 7) },
      { match: /^• (Çift integral|Double-integration)/, make: (rng) => makeScn(rng, 9) },
      { match: /^• (Burulma|Torsion)/, make: (rng) => makeScn(rng, 10) },
      { match: /^• (İki eğri|Between two curves)/, make: (rng) => makeScn(rng, 11) },
      { match: /^• (Hidrostatik|Hydrostatic)/, make: (rng) => makeScn(rng, 12) },
      { match: /^• (Kablo|Cable)/, make: (rng) => makeScn(rng, 13) },
      { match: /^• (Değişken kesitli|Tapered bar)/, make: (rng) => makeScn(rng, 14) },
      { match: /^• (Kütükten kesit|Section from a log)/, make: (rng) => makeScn(rng, 15) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
  });
})();
