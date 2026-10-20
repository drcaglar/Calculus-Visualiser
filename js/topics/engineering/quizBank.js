// Engineering Applications quiz bank. Ports Modules/EngineeringApplications/QuizBankEngineering.vb (13 generators)
// and adds many new calculus-in-engineering generators (Statics, Dynamics, Thermo-fluid, Materials) used by the
// printable exam sets (window.ExamPools.engineering). Every generator carries a numeric `.level` (1 easy, 2 medium,
// 3 hard). Questions also carry a non-enumerable `_v` spec ({indep, text?}) used only by the offline test harness:
// `indep` is an independent numeric recomputation (Simpson integration / central differences) of the answer.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const Q = makeQuestion;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const frac = (p, d) => {
    const g = gcd(p, d); p /= g; d /= g;
    if (d < 0) { p = -p; d = -d; }
    if (p === 0) return '0';
    return d === 1 ? String(p) : `${p}/${d}`;
  };
  const piDen = (p, d) => { const g = gcd(p, d); const a = p / g, b = d / g; return b === 1 ? `${a}/π` : `${a}/(${b}π)`; };
  // clean number: up to 6 decimals, no exponent, no "-0"
  const n = (v) => { let r = Math.round(v * 1e6) / 1e6; if (r === 0) r = 0; return String(r); };
  const nz = (rng, lo, hi) => { let v; do { v = rng.nextInt(lo, hi + 1); } while (v === 0); return v; };
  const plus = (v) => (v >= 0 ? `+ ${n(v)}` : `- ${n(Math.abs(v))}`);
  const sup = (d) => ('⁰¹²³⁴⁵⁶⁷⁸⁹'[d] !== undefined && d >= 0 && d <= 9 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[d] : `^${d}`);
  // polynomial in variable v from LOW-order coefficients: poly('t', c0, c1, c2) = c2 t^2 + c1 t + c0
  const poly = (v, ...c) => {
    let s = '';
    for (let d = c.length - 1; d >= 0; d--) {
      const k = c[d];
      if (k === 0) continue;
      const mag = Math.abs(k);
      let body;
      if (d === 0) body = n(mag);
      else { const x = d === 1 ? v : v + sup(d); body = mag === 1 ? x : n(mag) + x; }
      if (s === '') s += (k < 0 ? '-' : '') + body; else s += (k < 0 ? ' - ' : ' + ') + body;
    }
    return s === '' ? '0' : s;
  };
  const simpson = (f, a, b, m) => {
    m = m || 2000;
    const h = (b - a) / m; let s = f(a) + f(b);
    for (let i = 1; i < m; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  };
  const dif = (f, x, h) => { h = h || 1e-4; return (f(x + h) - f(x - h)) / (2 * h); };
  const FILL = () => tx('Hesap ya da işaret kayması olabilir; adımları yeniden kontrol et.', 'This may be an arithmetic or sign slip; re-check the steps.');

  function chk(q, spec) { Object.defineProperty(q, '_v', { value: spec, enumerable: false }); return q; }

  // string-answer builder: pairs = [[wrongString, note], ...] (parallel notes), optional filler pairs
  function MS(topic, text, correct, pairs, sol, rng, spec, filler, plot) {
    const all = pairs.filter((p) => !/NaN|Infinity|undefined/.test(p[0])).concat(filler || []);
    const q = Q(topic, text, correct, all.map((p) => p[0]), sol, rng, all.map((p) => p[1]), plot);
    return spec ? chk(q, spec) : q;
  }
  // numeric builder: wr = [[value, note], ...]; ans formatted with unit
  function MQ(topic, text, ans, unit, wr, sol, rng, spec, plot) {
    const u = unit ? ' ' + unit : '';
    const S = (v) => n(v) + u;
    const filler = [ans + 1, ans - 1, ans * 2, ans + 2, ans / 2, ans + 5].map((v) => [S(v), FILL()]);
    return MS(topic, text, S(ans), wr.map(([v, nt]) => [S(v), nt]), sol, rng, spec, filler, plot);
  }

  const T = {
    load: () => tx('Statik: yayılı yük ve ağırlık merkezi', 'Statics: distributed loads and centroids'),
    inertia: () => tx('Statik: atalet momenti (∫y²dA)', 'Statics: area moment of inertia (∫y²dA)'),
    beam: () => tx('Statik: kesme–moment ilişkisi', 'Statics: shear–moment relations'),
    kin: () => tx('Dinamik: kinematik (türev/integral)', 'Dynamics: kinematics (derivative/integral)'),
    work: () => tx('Dinamik: iş, güç ve enerji', 'Dynamics: work, power and energy'),
    heat: () => tx('Termo-akışkan: soğuma ve ısı', 'Thermo-fluid: cooling and heat'),
    gas: () => tx('Termo-akışkan: gaz işi ve debi', 'Thermo-fluid: gas work and flow'),
    rel: () => tx('Termo-akışkan: ilişkili hızlar', 'Thermo-fluid: related rates'),
    ss: () => tx('Malzeme: gerilme–şekil değiştirme', 'Materials: stress–strain'),
    defl: () => tx('Malzeme: kiriş sehimi', 'Materials: beam deflection'),
    fat: () => tx('Malzeme: yorulma ve takım ömrü', 'Materials: fatigue and tool life'),
    opt: () => tx('Mühendislikte optimizasyon', 'Optimization in engineering'),
  };

  // =====================================================================================================
  // Ported from QuizBankEngineering.vb
  // =====================================================================================================

  function enBeamMoment(rng) {
    const w = 2 * rng.nextInt(1, 4), L = 2 * rng.nextInt(2, 6), a = rng.nextInt(1, L);
    const r = w * L / 2;
    const ans = r * a - w * a * a / 2;
    return MQ(T.beam(),
      tx(`${L} m açıklıklı basit mesnetli kirişe w = ${w} kN/m düzgün yayılı yük etkiyor. Kesme kuvveti V(x) = ${r} - ${w}x (kN). M' = V ve M(0) = 0 olduğuna göre x = ${a} m'deki eğilme momenti kaç kN·m'dir?`,
        `A simply supported ${L} m beam carries a uniform load w = ${w} kN/m. The shear force is V(x) = ${r} - ${w}x (kN). Given M' = V and M(0) = 0, what is the bending moment at x = ${a} m in kN·m?`),
      ans, 'kN·m',
      [[r - w * a, tx('V(x) değerini hesapladın; moment, V\'nin integralidir.', 'You evaluated V(x) itself; the moment is the integral of V.')],
        [r * a, tx('İntegralde -wx teriminin katkısını (-wx²/2) unuttun.', 'You dropped the contribution of the -wx term (-wx²/2).')],
        [r * a + w * a * a / 2, tx('-wx²/2 terimini eksi yerine artı ile ekledin.', 'You added the -wx²/2 term instead of subtracting it.')],
        [w * a * a / 2, tx('Sadece yayılı yük teriminin integralini aldın.', 'You kept only the load term\'s integral.')]],
      [`M(x) = ∫V dx = ${r}x - ${w}x²/2 (kN·m)`, 'M(0) = 0 → C = 0', `M(${a}) = ${r}·${a} - ${w}·${a * a}/2 = ${n(ans)} kN·m`], rng,
      { indep: simpson((x) => r - w * x, 0, a) });
  }

  function enMaxMoment(rng) {
    const w = 2 * rng.nextInt(1, 4), k = rng.nextInt(2, 7);
    const A = w * k;
    const ans = w * k * k / 2;
    return MQ(T.beam(),
      tx(`Bir kirişte kesme kuvveti V(x) = ${A} - ${w}x (kN) ve M(0) = 0'dır. Maksimum eğilme momenti kaç kN·m'dir?`,
        `In a beam the shear force is V(x) = ${A} - ${w}x (kN) and M(0) = 0. What is the maximum bending moment in kN·m?`),
      ans, 'kN·m',
      [[A, tx('V(0) değerini moment sandın.', 'You took V(0) as the moment.')],
        [w * k * k, tx('M\'de 1/2 çarpanını unuttun (wx² yazdın).', 'You forgot the 1/2 in M (wrote wx²).')],
        [k, tx('V = 0 noktasını (x) buldun ama M\'yi hesaplamadın.', 'You found the location V = 0 but not M there.')],
        [A * k, tx('Yalnızca V(0)·x hesapladın; -wx²/2 terimi eksik.', 'You computed only V(0)·x, missing the -wx²/2 term.')]],
      [tx(`M maksimumda V = 0: ${A} - ${w}x = 0 → x = ${k} m`, `M is maximal where V = 0: ${A} - ${w}x = 0 → x = ${k} m`),
        `M(x) = ${A}x - ${w}x²/2 (kN·m)`, `M(${k}) = ${A * k} - ${w * k * k / 2} = ${n(ans)} kN·m`], rng,
      { indep: simpson((x) => A - w * x, 0, k) });
  }

  function enCentroid(rng) {
    const k = rng.nextInt(1, 4), a = rng.nextInt(2, 10);
    const ks = k === 1 ? '' : String(k);
    const plot = { xMin: -0.5, xMax: a + 1, yMin: -0.5, yMax: k * a * a + 1, curves: [{ f: (x) => k * x * x, dashed: false }], points: [], segments: [{ x1: a, y1: 0, x2: a, y2: k * a * a, dashed: true }] };
    return MS(T.load(),
      tx(`y = ${ks}x² eğrisi, x ekseni ve x = ${a} m doğrusu arasındaki bölgenin ağırlık merkezinin x koordinatı kaç metredir?`,
        `What is the x-coordinate of the centroid (in m) of the region between y = ${ks}x², the x-axis and x = ${a} m?`),
      frac(3 * a, 4) + ' m',
      [[frac(a, 2), tx('Bölgeyi dikdörtgen sanıp orta noktayı aldın.', 'You treated the region as a rectangle and took the midpoint.')],
        [frac(2 * a, 3), tx('3/4 yerine 2/3 kullandın (üçgen merkezi gibi).', 'You used 2/3 instead of 3/4 (triangle-like centroid).')],
        [frac(3 * a, 8), tx('İntegral sonuçlarında paydayı yanlış aldın (3/8).', 'You slipped in the integral results (3/8).')],
        [frac(a, 3), tx('a/3 kullandın: ∫x² sonucunu merkez sandın.', 'You used a/3: the ∫x² result taken as the centroid.')],
        [frac(3 * a, 5), tx('x⁴/4 ile x³/3 oranını yanlış sadeleştirdin.', 'You simplified the ratio of x⁴/4 to x³/3 wrongly.')]].map(([s, nt]) => [s + ' m', nt]),
      ['x̄ = ∫x·y dx / ∫y dx = (∫x³ dx)/(∫x² dx)', `= (x⁴/4)/(x³/3) = 3x/4 (x = ${a} m)`, `x̄ = ${frac(3 * a, 4)} m`], rng,
      { indep: simpson((x) => x * k * x * x, 0, a) / simpson((x) => k * x * x, 0, a), text: (s) => { const p = s.replace(' m', '').split('/'); return p.length > 1 ? p[0] / p[1] : +p[0]; } }, null, plot);
  }

  function enAccel(rng) {
    const A = nz(rng, -3, 3), B = rng.nextInt(-5, 6), C = rng.nextInt(-6, 7), Tt = rng.nextInt(1, 5);
    const ans = 6 * A * Tt + 2 * B;
    const vT = 3 * A * Tt * Tt + 2 * B * Tt + C;
    const s = (t) => A * t * t * t + B * t * t + C * t;
    return MQ(T.kin(),
      tx(`Bir parçanın konumu s(t) = ${poly('t', 0, C, B, A)} (m) ile veriliyor. t = ${Tt} s'de ivme kaç m/s²'dir?`,
        `A part's position is s(t) = ${poly('t', 0, C, B, A)} (m). What is its acceleration at t = ${Tt} s in m/s²?`),
      ans, 'm/s²',
      [[vT, tx('Hızı hesapladın (bir türev); ivme ikinci türevdir.', 'You computed velocity (one derivative); acceleration is the second.')],
        [6 * A * Tt, tx('İkinci türevde sabit 2B terimini unuttun.', 'You dropped the constant term 2B in the second derivative.')],
        [6 * A + 2 * B, tx('6At teriminde t yerine 1 koydun.', 'You substituted t = 1 in the 6At term.')],
        [3 * A * Tt * Tt + 2 * B * Tt, tx('Hız ifadesinden C\'yi atıp ikinci kez türev almadın.', 'You only dropped C from v and did not differentiate again.')]],
      [`v(t) = s'(t) = ${poly('t', C, 2 * B, 3 * A)} (m/s)`, `a(t) = v'(t) = ${poly('t', 2 * B, 6 * A)} (m/s²)`, `a(${Tt}) = ${ans} m/s²`], rng,
      { indep: dif((t) => dif(s, t, 1e-3), Tt, 1e-3) });
  }

  function enStopDist(rng) {
    const v0 = 4 * rng.nextInt(2, 6), Tt = rng.nextInt(2, 7);
    const ans = v0 * Tt / 2;
    const plot = { xMin: -0.5, xMax: Tt + 1, yMin: -1, yMax: v0 + 3, curves: [], points: [], segments: [{ x1: 0, y1: v0, x2: Tt, y2: 0, dashed: false }] };
    return MQ(T.kin(),
      tx(`Bir araç v₀ = ${v0} m/s hızla giderken frene basılıyor; hız, ${Tt} s'de doğrusal olarak sıfıra iniyor (grafik). Durma mesafesi kaç metredir?`,
        `A vehicle travelling at v₀ = ${v0} m/s brakes; its speed falls linearly to zero in ${Tt} s (graph). What is the stopping distance in metres?`),
      ans, 'm',
      [[v0 * Tt, tx('Dikdörtgen alanı aldın (hız sabit kalsaydı).', 'You took the rectangle area (as if speed were constant).')],
        [v0 * Tt / 4, tx('Alanı ½ yerine ¼ ile çarptın.', 'You used ¼ instead of ½ of the rectangle.')],
        [v0 + Tt, tx('Hız ve süreyi topladın; alan çarpımdır.', 'You added speed and time; area is a product.')],
        [v0 / Tt, tx('Yavaşlamayı (v₀/T) hesapladın, mesafeyi değil.', 'You found the deceleration (v₀/T), not the distance.')]],
      [tx('s = ∫v dt = v–t grafiğinin altındaki alan', 's = ∫v dt = the area under the v–t graph'), tx(`Üçgen: ½·${Tt}·${v0}`, `Triangle: ½·${Tt}·${v0}`), `s = ${n(ans)} m`], rng,
      { indep: simpson((t) => v0 * (1 - t / Tt), 0, Tt) }, null, plot);
  }

  function enSpringWork(rng) {
    const k = 100 * rng.nextInt(1, 6), x1 = rng.nextInt(0, 3), x2 = x1 + rng.nextInt(1, 4);
    const ans = k * (x2 * x2 - x1 * x1) / 2;
    return MQ(T.work(),
      tx(`Rijitliği k = ${k} N/m olan bir yay F = kx kuvveti ile x = ${x1} m'den x = ${x2} m'ye uzatılıyor. Yapılan iş kaç J'dür?`,
        `A spring of stiffness k = ${k} N/m, with force F = kx, is stretched from x = ${x1} m to x = ${x2} m. What work is done, in J?`),
      ans, 'J',
      [[k * (x2 - x1) * (x2 - x1) / 2, tx('(x₂ - x₁)² aldın; karelerin farkı gerekir.', 'You used (x₂ - x₁)²; the difference of squares is needed.')],
        [k * (x2 * x2 - x1 * x1), tx('½ çarpanını unuttun.', 'You forgot the factor ½.')],
        [k * (x2 - x1), tx('Kuvveti sabit sanıp k·Δx aldın.', 'You treated force as constant: k·Δx.')],
        [k * x2 * x2 / 2, tx('Alt sınırı (x₁) çıkarmayı unuttun.', 'You forgot to subtract the lower limit x₁.')]],
      ['W = ∫kx dx = ½k(x₂² - x₁²)', `= ½·${k}·(${x2 * x2} - ${x1 * x1})`, `W = ${n(ans)} J`], rng,
      { indep: simpson((x) => k * x, x1, x2) });
  }

  function enMaxSpeed(rng) {
    const A = rng.nextInt(2, 11), w = rng.nextInt(2, 9);
    const ans = A * w;
    return MQ(T.kin(),
      tx(`Titreşen bir kütlenin konumu x(t) = ${A} cos(${w}t) mm'dir (t saniye). Maksimum hızı kaç mm/s'dir?`,
        `A vibrating mass has position x(t) = ${A} cos(${w}t) mm (t in seconds). What is its maximum speed in mm/s?`),
      ans, 'mm/s',
      [[A * w * w, tx('Maksimum ivmeyi (Aω²) buldun.', 'You found the maximum acceleration (Aω²).')],
        [A + w, tx('Genlik ile frekansı topladın.', 'You added amplitude and frequency.')],
        [A * w * w * w, tx('Bir türev fazla alıp ω³ çıkardın.', 'You differentiated one time too many (ω³).')]],
      [`v = x' = -${ans} sin(${w}t) mm/s`, '|sin| ≤ 1', `v_max = Aω = ${ans} mm/s`], rng,
      { indep: (() => { let m = 0; const x = (t) => A * Math.cos(w * t); for (let i = 0; i <= 4000; i++) m = Math.max(m, Math.abs(dif(x, i * Math.PI / (w * 2000), 1e-5))); return m; })() });
  }

  function enCooling(rng) {
    const Ta = 5 * rng.nextInt(3, 7), D = 40 * rng.nextInt(1, 5), h = rng.nextInt(2, 9);
    const T0 = Ta + D;
    const ans = Ta + D / 4;
    return MQ(T.heat(),
      tx(`T' = -k(T - ${Ta}) yasasına uyan bir parça ${T0} °C'den soğuyor; ortam farkı her ${h} dakikada yarıya iniyor. ${2 * h} dakika sonra sıcaklık kaç °C'dir?`,
        `A part obeying T' = -k(T - ${Ta}) cools from ${T0} °C; the excess over ambient halves every ${h} minutes. What is the temperature after ${2 * h} minutes, in °C?`),
      ans, '°C',
      [[Ta + D / 2, tx('Yalnızca bir kez yarılamayı uyguladın.', 'You applied only one halving.')],
        [D / 4, tx('Ortam sıcaklığını eklemeyi unuttun.', 'You forgot to add the ambient temperature.')],
        [T0 / 4, tx('T₀\'ı dörde böldün; yalnızca fark azalır.', 'You divided T₀ by 4; only the excess decays.')],
        [Ta + D / 8, tx('Üç kez yarılama uyguladın.', 'You applied three halvings.')]],
      ['T(t) = T_a + (T₀ - T_a)e^(-kt)', tx(`Fark ${2 * h} dk'da 2 kez yarılanır: ${D} → ${D / 4} °C`, `The excess halves twice in ${2 * h} min: ${D} → ${D / 4} °C`), `T = ${Ta} + ${D / 4} = ${ans} °C`], rng,
      { indep: Ta + D * Math.exp(-Math.log(2) / h * 2 * h) });
  }

  function enGasWork(rng) {
    const p = 50 * rng.nextInt(1, 5), V1 = rng.nextInt(1, 5), r = rng.nextInt(0, 2) === 0 ? 2 : 4;
    const C = p * V1;
    return MS(T.gas(),
      tx(`İdeal gaz sabit sıcaklıkta ${V1} m³'ten ${r * V1} m³'e genleşiyor; başlangıç basıncı ${p} kPa. W = ∫p dV ve pV = sabit olduğuna göre gazın yaptığı iş (kJ) nedir?`,
        `An ideal gas expands isothermally from ${V1} m³ to ${r * V1} m³ at an initial pressure of ${p} kPa. With W = ∫p dV and pV = const, what work (kJ) does the gas do?`),
      `${C} ln ${r} kJ`,
      [[`${C * (r - 1)} kJ`, tx('Basıncı sabit sanıp p·ΔV benzeri hesapladın.', 'You treated pressure as constant (p·ΔV-like).')],
        [`-${C} ln ${r} kJ`, tx('İşaret hatası: genleşmede gaz iş yapar, ln oranı pozitiftir.', 'Sign slip: the gas does positive work in expansion.')],
        [`${C} ln ${r * V1} kJ`, tx('ln\'in içine V₂/V₁ oranı yerine V₂ koydun.', 'You used V₂ instead of V₂/V₁ inside the ln.')],
        [`${C * r} kJ`, tx('ln almayı unutup oranla çarptın.', 'You skipped the ln and multiplied by the ratio.')],
        [`${p} ln ${r} kJ`, tx('pV çarpımı yerine yalnızca p\'yi kullandın.', 'You used p alone instead of the product pV.')]],
      [`p = ${C}/V (kPa)`, `W = ${C}∫dV/V = ${C} ln(V₂/V₁) (kPa·m³ = kJ)`, `W = ${C} ln ${r} kJ`], rng,
      { indep: simpson((V) => C / V, V1, r * V1), text: (s) => parseFloat(s) * Math.log(r) });
  }

  function enTankFill(rng) {
    const h = rng.nextInt(1, 5), q0 = 2 * rng.nextInt(1, 5);
    return MS(T.rel(),
      tx(`Tepe noktası aşağıda, yarıçapı derinliğe eşit (r = h) koni biçimli bir tanka ${q0} m³/dk debiyle su doluyor. h = ${h} m'de su seviyesi kaç m/dk hızla yükselir?`,
        `A cone-shaped tank (apex down, radius equal to depth, r = h) fills at ${q0} m³/min. How fast does the level rise at h = ${h} m, in m/min?`),
      piDen(q0, h * h) + ' m/dk'.replace('m/dk', tx('m/dk', 'm/min')),
      [[piDen(q0, h), tx('V\' = πh olarak türettin (h² yerine h).', 'You differentiated to V\' = πh (h instead of h²).')],
        [piDen(3 * q0, h * h), tx('Debiyi 3 ile çarptın.', 'You multiplied the flow by 3.')],
        [piDen(q0, 3 * h * h), tx('V = πh³/3 türevindeki 3\'ü paydada bıraktın.', 'You left the 3 in the denominator after differentiating.')],
        [piDen(q0, h * h * h), tx('Üssü h³ bıraktın; türevde üs azalır.', 'You left h³; the power drops when differentiating.')],
        [piDen(q0, 2 * h * h), tx('Türevde uydurma bir 2 çarpanı ekledin.', 'You inserted a spurious factor 2.')]].map(([s, nt]) => [s + ' ' + tx('m/dk', 'm/min'), nt]),
      ['V = πr²h/3 = πh³/3', 'dV/dt = πh²·dh/dt', `dh/dt = ${q0}/(π·${h * h}) = ${piDen(q0, h * h)} ${tx('m/dk', 'm/min')}`], rng,
      { indep: q0 / (Math.PI * h * h), text: (s) => { const m = /^(\d+)\/(?:\((\d+)π\)|π)/.exec(s); return m[1] / ((m[2] ? +m[2] : 1) * Math.PI); } });
  }

  function enOptDiameter(rng) {
    const a = rng.nextInt(2, 6), k = rng.nextInt(2, 7);
    const b = a * k * k;
    return MQ(T.opt(),
      tx(`Bir borunun yalıtım kalınlığı x (cm) için toplam maliyet C(x) = ${a}x + ${b}/x (birim/m). Maliyeti minimum yapan kalınlık kaç cm'dir?`,
        `For insulation thickness x (cm) on a pipe, the total cost is C(x) = ${a}x + ${b}/x (per m). Which thickness minimises the cost, in cm?`),
      k, 'cm',
      [[k * k, tx('Karekök almayı unuttun (x² değerini yazdın).', 'You forgot the square root (gave x²).')],
        [2 * k, tx('Karekök yerine 2 ile çarptın.', 'You doubled instead of taking the root.')],
        [b, tx('Katsayıyı (b) doğrudan cevap aldın.', 'You took the coefficient b as the answer.')],
        [a * k, tx('a·x çarpımını cevap sandın.', 'You took a·x as the answer.')]],
      [`C'(x) = ${a} - ${b}/x² = 0`, `x² = ${b}/${a} = ${k * k}`, `x = ${k} cm (x > 0)`], rng,
      { indep: (() => { let best = 1e9, bx = 0; for (let x = 0.01; x < 3 * k; x += 0.01) { const c = a * x + b / x; if (c < best) { best = c; bx = x; } } return bx; })() });
  }

  function enLpbfPower(rng) {
    const m = rng.nextInt(1, 4), P = 50 * rng.nextInt(3, 7);
    const a = m / 1000, b = 2 * a * P;
    const aT = a.toFixed(3), bT = b.toFixed(3), a2 = (2 * a).toFixed(3);
    return MQ(T.opt(),
      tx(`Toz yatağı lazer ergitmede yoğunluk kazancı d(P) = -${aT}P² + ${bT}P olarak modelleniyor (P: W). d'yi en büyük yapan P kaç W'tır?`,
        `In laser powder-bed fusion a density gain is modelled as d(P) = -${aT}P² + ${bT}P (P in W). Which P maximises d, in W?`),
      P, 'W',
      [[2 * P, tx('b/a hesapladın (2 çarpanı unutuldu).', 'You computed b/a (missing the factor 2).')],
        [P / 2, tx('2a yerine 4a kullandın.', 'You used 4a instead of 2a.')],
        [P + 50, tx('Tepe noktası hesabında hata: P + 50.', 'Arithmetic slip near the vertex: P + 50.')],
        [P - 50, tx('Tepe noktası hesabında hata: P - 50.', 'Arithmetic slip near the vertex: P - 50.')]],
      [`d'(P) = -${a2}P + ${bT} = 0`, 'P = b/(2a)', `P = ${P} W`], rng,
      { indep: (() => { let best = -1e9, bp = 0; for (let p = 0; p < 4 * P; p += 0.5) { const d = -a * p * p + b * p; if (d > best) { best = d; bp = p; } } return bp; })() });
  }

  function enFatigue(rng) {
    const m = rng.nextInt(3, 6);
    const ans = Math.pow(2, m);
    return MQ(T.fat(),
      tx(`Bir parçanın yorulma ömrü N = C·S^(-${m}) ile modelleniyor (S: gerilme genliği). Gerilme genliği yarıya düşerse ömür kaç katına çıkar?`,
        `A part's fatigue life is modelled by N = C·S^(-${m}) (S: stress amplitude). If the stress amplitude is halved, by what factor does the life increase?`),
      ans, '×',
      [[2, tx('Ömrün gerilmeyle doğrusal değiştiğini sandın.', 'You assumed life scales linearly with stress.')],
        [2 * m, tx('Üssü çarpan olarak kullandın (2m).', 'You used the exponent as a multiplier (2m).')],
        [Math.pow(2, m - 1), tx('Üssü bir eksik aldın.', 'You used one power too few.')],
        [m * m, tx('m² hesapladın; doğrusu 2^m.', 'You computed m²; the right form is 2^m.')]],
      ['N₂/N₁ = (S₂/S₁)^(-m)', `(1/2)^(-${m}) = 2^${m}`, `N₂/N₁ = ${ans}`], rng,
      { indep: Math.pow(0.5, -m) });
  }

  // =====================================================================================================
  // New generators - Level 1
  // =====================================================================================================

  function nPosFromVel(rng) {
    const a = rng.pick([3, 6, 9]), c = nz(rng, -4, 6), s0 = rng.nextInt(0, 11), Tt = rng.nextInt(1, 5);
    const ans = a * Tt * Tt * Tt / 3 + c * Tt + s0;
    return MQ(T.kin(),
      tx(`Bir kızağın hızı v(t) = ${poly('t', c, 0, a)} (m/s) ve başlangıç konumu s(0) = ${s0} m'dir. t = ${Tt} s'de konumu kaç metredir?`,
        `A slider has velocity v(t) = ${poly('t', c, 0, a)} (m/s) and initial position s(0) = ${s0} m. What is its position at t = ${Tt} s, in metres?`),
      ans, 'm',
      [[a * Tt * Tt * Tt / 3 + c * Tt, tx('Başlangıç konumu s(0) integral sabitidir; eklemeyi unuttun.', 'The initial position s(0) is the integration constant; you forgot to add it.')],
        [a * Tt * Tt + c, tx('v(T) değerini konum sandın.', 'You took v(T) as the position.')],
        [a * Tt * Tt * Tt + c * Tt + s0, tx('∫t² dt = t³/3 yerine t³ aldın.', 'You integrated t² to t³ instead of t³/3.')],
        [a * Tt * Tt * Tt / 3 + c + s0, tx('Sabit hız terimini integre ederken t çarpanını unuttun.', 'You forgot the factor t when integrating the constant term.')]],
      [`s(t) = ∫v dt = ${n(a / 3)}t³ ${plus(c)}t + s(0)`, `s(${Tt}) = ${n(a * Tt * Tt * Tt / 3)} ${plus(c * Tt)} + ${s0}`, `s(${Tt}) = ${n(ans)} m`], rng,
      { indep: simpson((t) => a * t * t + c, 0, Tt) + s0 });
  }

  function nKE(rng) {
    const b = rng.nextInt(1, 5), m = rng.pick([2, 4, 6, 10]), Tt = rng.nextInt(1, 4);
    const ans = 2 * m * b * b * Tt * Tt;
    const s = (t) => b * t * t;
    return MQ(T.work(),
      tx(`Kütlesi m = ${m} kg olan bir cismin konumu s(t) = ${b}t² (m). t = ${Tt} s'deki kinetik enerjisi kaç J'dür?`,
        `A body of mass m = ${m} kg has position s(t) = ${b}t² (m). What is its kinetic energy at t = ${Tt} s, in J?`),
      ans, 'J',
      [[m * b * b * Tt * Tt * Tt * Tt / 2, tx('Konumu hız yerine kullandın (½ms²).', 'You used position in place of velocity (½ms²).')],
        [m * b * Tt, tx('Hızın karesini almayı unuttun (½mv yazdın).', 'You forgot to square the velocity (wrote ½mv).')],
        [4 * m * b * b * Tt * Tt, tx('½ çarpanını unuttun (mv²).', 'You forgot the ½ (mv²).')],
        [2 * m * b * b, tx('Hızı v = 2b aldın; t çarpanını unuttun.', 'You used v = 2b and forgot the factor t.')]],
      [`v = s' = ${2 * b}t (m/s)`, `v(${Tt}) = ${2 * b * Tt} m/s`, `KE = ½mv² = ½·${m}·${2 * b * Tt}² = ${n(ans)} J`], rng,
      { indep: 0.5 * m * Math.pow(dif(s, Tt), 2) });
  }

  function nRampResultant(rng) {
    const k = rng.pick([2, 4, 6]), L = rng.nextInt(2, 7);
    const ans = k * L * L / 2;
    return MQ(T.load(),
      tx(`Bir kirişin 0 ≤ x ≤ ${L} m bölgesinde yayılı yük w(x) = ${k}x (kN/m) biçiminde artıyor. Bileşke kuvvet kaç kN'dur?`,
        `Over 0 ≤ x ≤ ${L} m a beam carries a distributed load increasing as w(x) = ${k}x (kN/m). What is the resultant force in kN?`),
      ans, 'kN',
      [[k * L, tx('Yük en büyük değerde (w(L)) sabit sanıp uzunlukla çarpmadın; w(L) aldın.', 'You took the peak intensity w(L) as the force.')],
        [k * L * L, tx('Üçgenin ½ çarpanını unuttun.', 'You forgot the ½ of the triangle.')],
        [k * L * L * L / 3, tx('∫w dx yerine ∫x·w dx (moment) aldın.', 'You computed ∫x·w dx (a moment) instead of ∫w dx.')],
        [k * L * L / 3, tx('∫x dx = x²/2 yerine x²/3 kullandın.', 'You used x²/3 instead of x²/2.')]],
      [`R = ∫₀^${L} w dx = ∫₀^${L} ${k}x dx`, `= ${k}·x²/2 |₀^${L} (kN)`, `R = ${n(ans)} kN`], rng,
      { indep: simpson((x) => k * x, 0, L) });
  }

  function nYoungModulus(rng) {
    const E = rng.pick([70, 110, 200, 210]), e1 = rng.nextInt(1, 3), e2 = e1 + rng.nextInt(1, 4);
    const s1 = E * e1, s2 = E * e2;
    return MQ(T.ss(),
      tx(`Doğrusal elastik bölgede ε = ${n(e1 / 1000)} iken σ = ${s1} MPa, ε = ${n(e2 / 1000)} iken σ = ${s2} MPa ölçülüyor. Elastisite modülü (σ–ε eğrisinin eğimi) kaç GPa'dır?`,
        `In the linear elastic range σ = ${s1} MPa at ε = ${n(e1 / 1000)} and σ = ${s2} MPa at ε = ${n(e2 / 1000)}. What is Young's modulus (the slope of the σ–ε curve) in GPa?`),
      E, 'GPa',
      [[E * 1000, tx('MPa → GPa dönüşümünü yapmadın (1 GPa = 1000 MPa).', 'You skipped the MPa → GPa conversion (1 GPa = 1000 MPa).')],
        [E / 1000, tx('Dönüşümü ters yönde uyguladın.', 'You applied the conversion in the wrong direction.')],
        [E * (e2 - e1) * (e2 - e1), tx('Eğim yerine Δσ·Δε çarptın.', 'You multiplied Δσ·Δε instead of dividing.')],
        [E * e2 / 10, tx('Eğim yerine yalnızca bir noktadaki σ değerini kullandın.', 'You used a single σ reading rather than the slope.')]],
      ['E = dσ/dε = Δσ/Δε', `= (${s2} - ${s1}) MPa / (${n(e2 / 1000)} - ${n(e1 / 1000)})`, `= ${n(E * 1000)} MPa = ${E} GPa`], rng,
      { indep: ((s2 - s1) / ((e2 - e1) / 1000)) / 1000 });
  }

  function nHeatPower(rng) {
    const a = rng.nextInt(2, 6), b = rng.pick([2, 4, 6]), Tt = rng.nextInt(2, 7);
    const ans = a * Tt + b * Tt * Tt / 2;
    return MQ(T.heat(),
      tx(`Bir ısıtıcının gücü P(t) = ${a} + ${b}t (kW) ile değişiyor (t: saniye). İlk ${Tt} s'de verilen ısı enerjisi Q = ∫P dt kaç kJ'dür?`,
        `A heater's power varies as P(t) = ${a} + ${b}t (kW), t in seconds. How much heat Q = ∫P dt (kJ) is delivered in the first ${Tt} s?`),
      ans, 'kJ',
      [[(a + b * Tt) * Tt, tx('Son güç değerini süreyle çarptın (güç sabit değil).', 'You multiplied the final power by the time (power is not constant).')],
        [a * Tt + b * Tt * Tt, tx('∫t dt = t²/2 yerine t² aldın.', 'You integrated t to t² instead of t²/2.')],
        [a + b * Tt, tx('P(T) değerini enerji sandın.', 'You took P(T) as the energy.')],
        [a * Tt, tx('Yalnızca sabit güç terimini integre ettin.', 'You integrated only the constant part of the power.')]],
      [`Q = ∫₀^${Tt} (${a} + ${b}t) dt (kW·s = kJ)`, `= ${a}t + ${b}t²/2 |₀^${Tt}`, `Q = ${n(ans)} kJ`], rng,
      { indep: simpson((t) => a + b * t, 0, Tt) });
  }

  function nFlowVolume(rng) {
    const k = rng.pick([3, 6, 9]), Tt = rng.nextInt(2, 6);
    const ans = k * Tt * Tt * Tt / 3;
    return MQ(T.gas(),
      tx(`Bir vana açılırken debi Q(t) = ${k}t² (L/dk) olarak artıyor (t: dakika). İlk ${Tt} dakikada geçen toplam hacim kaç litredir?`,
        `As a valve opens, the flow rate rises as Q(t) = ${k}t² (L/min), t in minutes. What total volume passes in the first ${Tt} minutes, in litres?`),
      ans, 'L',
      [[k * Tt * Tt, tx('Son andaki debiyi hacim sandın.', 'You took the final flow rate as the volume.')],
        [k * Tt * Tt * Tt, tx('∫t² dt = t³/3 yerine t³ aldın.', 'You integrated t² to t³ instead of t³/3.')],
        [k * Tt * Tt * Tt / 2, tx('t² integralinde 3 yerine 2 böldün.', 'You divided by 2 instead of 3 when integrating t².')],
        [2 * k * Tt, tx('Debiyi türevledin; hacim için integral gerekir.', 'You differentiated the flow rate; the volume needs an integral.')]],
      [`V = ∫₀^${Tt} ${k}t² dt`, `= ${k}t³/3 |₀^${Tt} (L)`, `V = ${n(ans)} L`], rng,
      { indep: simpson((t) => k * t * t, 0, Tt) });
  }

  function nIxRect(rng) {
    const b = rng.pick([3, 6, 9]), h = rng.pick([2, 4, 6]);
    const ans = b * h * h * h / 12;
    return MQ(T.inertia(),
      tx(`Genişliği b = ${b} cm ve yüksekliği h = ${h} cm olan dikdörtgen kesitin ağırlık merkezinden geçen yatay eksene göre atalet momenti I = ∫y² dA kaç cm⁴'tür? (dA = b dy, −h/2 ≤ y ≤ h/2)`,
        `A rectangle has width b = ${b} cm and height h = ${h} cm. What is its second moment of area about the horizontal centroidal axis, I = ∫y² dA, in cm⁴? (dA = b dy, −h/2 ≤ y ≤ h/2)`),
      ans, 'cm⁴',
      [[b * h * h * h / 3, tx('Eksen tabanda (alt kenarda) olsaydı çıkan değeri aldın.', 'You gave the value about the base edge instead of the centroid.')],
        [b * b * b * h / 12, tx('b ile h\'nin rollerini değiştirdin.', 'You swapped the roles of b and h.')],
        [b * h * h * h / 36, tx('Üçgen kesitin formülünü kullandın.', 'You used the triangle formula.')],
        [b * h * h / 8, tx('y² integrali yerine y integralini (statik moment) aldın.', 'You used a first-moment-type result instead of ∫y² dy.')]],
      [`I = ∫y² dA = ∫ y²·b dy, y = −h/2 … h/2`, `= b·[y³/3] = b·(2·(h/2)³/3) = bh³/12`, `I = ${b}·${h}³/12 = ${n(ans)} cm⁴`], rng,
      { indep: simpson((y) => y * y * b, -h / 2, h / 2) });
  }

  function nProjHeight(rng) {
    const v0 = rng.pick([10, 20, 30, 40, 50]);
    const ans = v0 * v0 / 20;
    const y = (t) => v0 * t - 5 * t * t;
    return MQ(T.kin(),
      tx(`Düşey atılan bir cismin yüksekliği y(t) = ${v0}t − 5t² (m) (g = 10 m/s² alındı). Ulaştığı maksimum yükseklik kaç metredir?`,
        `A body thrown vertically has height y(t) = ${v0}t − 5t² (m) (g taken as 10 m/s²). What maximum height does it reach, in metres?`),
      ans, 'm',
      [[v0 * v0 / 10, tx('y\'= 0 noktasını bulup 5t² terimini unuttun.', 'You dropped the −5t² term when evaluating y at the peak.')],
        [v0 / 10, tx('Tepe noktasının zamanını yükseklik sandın.', 'You gave the time of the peak instead of its height.')],
        [v0 * v0 / 40, tx('y(t)\'de katsayıyı ½·g yerine ¼·g yorumladın.', 'You used ¼·g in place of ½·g.')],
        [v0, tx('Başlangıç hızını yükseklik sandın.', 'You took the launch speed as the height.')]],
      [`y'(t) = ${v0} − 10t = 0 → t = ${n(v0 / 10)} s`, `y(${n(v0 / 10)}) = ${v0}·${n(v0 / 10)} − 5·${n(v0 / 10)}²`, `y_max = ${n(ans)} m`], rng,
      { indep: (() => { let m = -1; for (let i = 0; i <= 20000; i++) m = Math.max(m, y(i * 0.001)); return m; })() });
  }

  function nCoolRate(rng) {
    const k = rng.pick([0.05, 0.1, 0.2]), D = rng.pick([20, 40, 60, 80]), Ta = rng.pick([20, 25, 30]);
    const T0 = Ta + D;
    const ans = -k * D;
    return MQ(T.heat(),
      tx(`Bir parça Newton soğuma yasası T' = −k(T − ${Ta}) ile soğuyor (k = ${k} 1/dk). T = ${T0} °C olduğu anda soğuma hızı T' kaç °C/dk'dır?`,
        `A part cools by Newton's law T' = −k(T − ${Ta}) with k = ${k} 1/min. At the moment T = ${T0} °C, what is the rate T' in °C/min?`),
      ans, '°C/min',
      [[k * D, tx('Soğuma sırasında sıcaklık azalır; işareti pozitif yazdın.', 'The temperature is falling; you gave a positive rate.')],
        [-k * T0, tx('Ortam sıcaklığını çıkarmadın (T yerine T − Tₐ gerekir).', 'You did not subtract the ambient temperature (T − Tₐ is needed).')],
        [-D, tx('k çarpanını unuttun.', 'You forgot to multiply by k.')],
        [-k * Ta, tx('Fark yerine ortam sıcaklığını kullandın.', 'You used the ambient temperature instead of the excess.')]],
      [`T' = −k(T − T_a) = −${k}·(${T0} − ${Ta})`, `= −${k}·${D}`, `T' = ${n(ans)} °C/min`], rng,
      { indep: -k * D });
  }

  // =====================================================================================================
  // New generators - Level 2
  // =====================================================================================================

  function nRampLine(rng) {
    const k = rng.pick([2, 4, 6]), L = rng.pick([3, 6, 9, 12]);
    const ans = 2 * L / 3;
    return MQ(T.load(),
      tx(`Bir kirişte 0 ≤ x ≤ ${L} m arasında yayılı yük w(x) = ${k}x (kN/m) etkiyor. Bileşke kuvvetin etki çizgisi, x = 0'dan kaç metre uzaktadır? (x̄ = ∫x·w dx / ∫w dx)`,
        `A beam carries w(x) = ${k}x (kN/m) over 0 ≤ x ≤ ${L} m. How far from x = 0 does the line of action of the resultant lie, in metres? (x̄ = ∫x·w dx / ∫w dx)`),
      ans, 'm',
      [[L / 2, tx('Yükü düzgün sandın ve orta noktayı aldın.', 'You treated the load as uniform and took the midpoint.')],
        [L / 3, tx('Üçgenin merkezini dik köşeden değil, tepe köşeden ölçtün (L/3).', 'You measured the triangle centroid from the wrong end (L/3).')],
        [3 * L / 4, tx('Parabol altındaki alan merkezi (3/4) ile karıştırdın.', 'You mixed it up with the 3/4 of a parabolic region.')],
        [L, tx('Bileşkeyi yükün en büyük olduğu uca koydun.', 'You placed the resultant at the end where the load peaks.')]],
      [`∫w dx = ${k}L²/2 = ${n(k * L * L / 2)} kN`, `∫x·w dx = ${k}L³/3 = ${n(k * L * L * L / 3)} kN·m`, `x̄ = ${n(k * L * L * L / 3)} / ${n(k * L * L / 2)} = 2L/3 = ${n(ans)} m`], rng,
      { indep: simpson((x) => x * k * x, 0, L) / simpson((x) => k * x, 0, L) });
  }

  function nIxTriangle(rng) {
    const b = rng.pick([3, 6, 9, 12]), h = rng.pick([2, 4, 6]);
    const ans = b * h * h * h / 12;
    return MQ(T.inertia(),
      tx(`Tabanı b = ${b} cm, yüksekliği h = ${h} cm olan üçgenin tabana göre atalet momenti I = ∫y² dA kaç cm⁴'tür? (y tabandan ölçülür, genişlik b(1 − y/h))`,
        `A triangle has base b = ${b} cm and height h = ${h} cm. What is its second moment of area about the base, I = ∫y² dA, in cm⁴? (y measured from the base, width b(1 − y/h))`),
      ans, 'cm⁴',
      [[b * h * h * h / 3, tx('Genişliği sabit (b) alıp dikdörtgen gibi integre ettin.', 'You took the width constant (b), as for a rectangle.')],
        [b * h * h * h / 36, tx('Ağırlık merkezinden geçen eksen için olan değeri verdin.', 'You gave the value about the centroidal axis.')],
        [b * h * h * h / 4, tx('∫y³ integralinde 3 yerine 4 kullandın.', 'You used only the y³/4 term and missed the −y³/3 part.')],
        [b * b * b * h / 12, tx('b ve h\'nin yerini değiştirdin.', 'You swapped b and h.')]],
      ['dA = b(1 − y/h) dy', `I = ∫₀^h y²·b(1 − y/h) dy = b(h³/3 − h³/4)`, `I = bh³/12 = ${b}·${h}³/12 = ${n(ans)} cm⁴`], rng,
      { indep: simpson((y) => y * y * b * (1 - y / h), 0, h) });
  }

  function nProjRange(rng) {
    const vy = rng.pick([10, 20, 30]), vx = rng.pick([5, 10, 15, 20, 25]);
    const ans = vx * vy / 5;
    return MQ(T.kin(),
      tx(`Bir cisim x(t) = ${vx}t, y(t) = ${vy}t − 5t² (m) yörüngesinde hareket ediyor (g = 10 m/s²). Zemine (y = 0) düştüğünde yatay mesafe (menzil) kaç metredir?`,
        `A body moves with x(t) = ${vx}t, y(t) = ${vy}t − 5t² (m) (g = 10 m/s²). What horizontal distance (range) does it cover before returning to the ground (y = 0), in metres?`),
      ans, 'm',
      [[vx * vy / 10, tx('Yalnızca çıkış süresini (tepe noktasına kadar) kullandın.', 'You used only the rise time (to the peak).')],
        [vx * vy, tx('Uçuş süresini 2·vy yazdın; g = 10\'a bölmeyi unuttun.', 'You forgot to divide the flight time by g = 10.')],
        [vy * vy / 10, tx('Menzil yerine maksimum yüksekliği hesapladın.', 'You computed the max height instead of the range.')],
        [vx + vy, tx('Hız bileşenlerini topladın.', 'You added the velocity components.')]],
      [`y = 0: ${vy}t − 5t² = 0 → t = ${n(vy / 5)} s`, `x(${n(vy / 5)}) = ${vx}·${n(vy / 5)}`, `R = ${n(ans)} m`], rng,
      { indep: (() => { let lo = vy / 10, hi = 100; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (vy * mid - 5 * mid * mid > 0) lo = mid; else hi = mid; } return vx * lo; })() });
  }

  function nWorkVariable(rng) {
    const a = rng.pick([10, 20, 30, 40]), b = rng.nextInt(1, 5), L = rng.pick([3, 6]);
    const ans = a * L + b * L * L * L / 3;
    return MQ(T.work(),
      tx(`Bir cisme etkiyen kuvvet konuma bağlı: F(x) = ${a} + ${b}x² (N). Cisim x = 0'dan x = ${L} m'ye taşınırken yapılan iş kaç J'dür?`,
        `The force on a body depends on position: F(x) = ${a} + ${b}x² (N). How much work is done moving it from x = 0 to x = ${L} m, in J?`),
      ans, 'J',
      [[(a + b * L * L) * L, tx('Son kuvveti sabit sanıp F(L)·L aldın.', 'You treated the final force as constant: F(L)·L.')],
        [a * L + b * L * L * L, tx('∫x² dx = x³/3 yerine x³ aldın.', 'You integrated x² to x³ instead of x³/3.')],
        [a * L + b * L * L / 2, tx('x² terimini x gibi integre ettin (x²/2).', 'You integrated x² as if it were x (x²/2).')],
        [a + b * L * L, tx('F(L) değerini iş sandın.', 'You took F(L) as the work.')]],
      [`W = ∫₀^${L} (${a} + ${b}x²) dx`, `= ${a}x + ${b}x³/3 |₀^${L}`, `W = ${a * L} + ${n(b * L * L * L / 3)} = ${n(ans)} J`], rng,
      { indep: simpson((x) => a + b * x * x, 0, L) });
  }

  function nGasLinear(rng) {
    const a = rng.pick([300, 400, 500, 600]), b = rng.pick([20, 40, 60]), V1 = rng.pick([1, 2]), V2 = V1 + rng.nextInt(1, 4);
    const ans = a * (V2 - V1) - b * (V2 * V2 - V1 * V1) / 2;
    return MQ(T.gas(),
      tx(`Bir gazın basıncı hacimle p(V) = ${a} − ${b}V (kPa) biçiminde değişiyor (V: m³). Gaz ${V1} m³'ten ${V2} m³'e genleşirken yaptığı iş W = ∫p dV kaç kJ'dür?`,
        `A gas pressure varies with volume as p(V) = ${a} − ${b}V (kPa), V in m³. How much work W = ∫p dV (kJ) does the gas do expanding from ${V1} m³ to ${V2} m³?`),
      ans, 'kJ',
      [[(a - b * V1) * (V2 - V1), tx('Başlangıç basıncını sabit sanıp p(V₁)·ΔV aldın.', 'You treated the initial pressure as constant: p(V₁)·ΔV.')],
        [a * (V2 - V1) - b * (V2 * V2 - V1 * V1), tx('∫V dV = V²/2 yerine V² kullandın.', 'You integrated V to V² instead of V²/2.')],
        [a * (V2 - V1) + b * (V2 * V2 - V1 * V1) / 2, tx('−bV teriminin işaretini ters aldın.', 'You flipped the sign of the −bV term.')],
        [a * (V2 - V1) - b * (V2 - V1) * (V2 - V1) / 2, tx('(V₂ − V₁)² aldın; karelerin farkı gerekir.', 'You used (V₂ − V₁)²; a difference of squares is needed.')]],
      [`W = ∫ (${a} − ${b}V) dV = ${a}V − ${b}V²/2 (kPa·m³ = kJ)`, `= ${a}(${V2} − ${V1}) − ${b}(${V2 * V2} − ${V1 * V1})/2`, `W = ${n(ans)} kJ`], rng,
      { indep: simpson((V) => a - b * V, V1, V2) });
  }

  function nTankMax(rng) {
    const B = rng.nextInt(2, 6), k = rng.nextInt(2, 7), c = rng.pick([100, 200, 300, 400]);
    const ans = c + B * k * k;
    const V = (t) => c + 2 * B * k * t - B * t * t;
    return MQ(T.rel(),
      tx(`Bir tanktaki su hacmi V(t) = ${poly('t', c, 2 * B * k, -B)} (litre, t: dakika) ile veriliyor. dV/dt = 0 olduğunda hacim en büyük olur; bu maksimum hacim kaç litredir?`,
        `The water volume in a tank is V(t) = ${poly('t', c, 2 * B * k, -B)} (litres, t in minutes). The volume is largest where dV/dt = 0; what is that maximum volume in litres?`),
      ans, 'L',
      [[c + 2 * B * k * k, tx('−Bt² terimini atladın.', 'You dropped the −Bt² term.')],
        [c + B * k, tx('t = k yerine t = 1 ile karıştırıp B·k hesapladın.', 'You evaluated B·k instead of B·k².')],
        [k, tx('Kritik zamanı (t) hacim sandın.', 'You gave the critical time instead of the volume.')],
        [2 * B * k, tx('dV/dt\'nin ilk teriminden başka bir şey yazmadın; V(t*) hesaplanmalı.', 'You gave the coefficient of t, not V(t*).')]],
      [`dV/dt = ${poly('t', 2 * B * k, -2 * B)} = 0 → t = ${k} min`, `V(${k}) = ${c} + ${2 * B * k * k} − ${B * k * k}`, `V_max = ${n(ans)} L`], rng,
      { indep: (() => { let m = -1e9; for (let i = 0; i <= 20000; i++) m = Math.max(m, V(i * 0.001)); return m; })() });
  }

  function nStrainEnergy(rng) {
    const sy = rng.pick([200, 300, 400, 500]), ey = rng.nextInt(2, 5);
    const ans = 0.5 * sy * ey / 1000;
    return MQ(T.ss(),
      tx(`Bir malzemenin σ–ε eğrisi akma noktasına (σ = ${sy} MPa, ε = ${n(ey / 1000)}) kadar doğrusaldır. Birim hacimdeki şekil değiştirme enerjisi u = ∫σ dε (eğri altındaki alan) kaç MJ/m³'tür? (1 MPa = 1 MJ/m³)`,
        `A material's σ–ε curve is linear up to yield (σ = ${sy} MPa, ε = ${n(ey / 1000)}). What is the strain energy per unit volume u = ∫σ dε (area under the curve), in MJ/m³? (1 MPa = 1 MJ/m³)`),
      ans, 'MJ/m³',
      [[sy * ey / 1000, tx('Üçgen yerine dikdörtgen alanı aldın (½ unutuldu).', 'You took the rectangle area (forgot the ½).')],
        [0.5 * sy * ey, tx('ε değerini 10⁻³ ile çarpmayı unuttun.', 'You forgot that ε = e × 10⁻³.')],
        [sy * ey / 3000, tx('Eğri altındaki alanı 1/3 ile çarptın.', 'You used 1/3 of the rectangle instead of 1/2.')],
        [sy / ey, tx('Eğim (modül) hesapladın, alanı değil.', 'You computed the slope (modulus), not the area.')]],
      [tx(`u = ∫σ dε = ½·σ_y·ε_y (üçgen alan)`, `u = ∫σ dε = ½·σ_y·ε_y (triangle area)`), `= ½·${sy} MPa·${n(ey / 1000)}`, `u = ${n(ans)} MJ/m³`], rng,
      { indep: simpson((e) => (sy / (ey / 1000)) * e, 0, ey / 1000) });
  }

  function nDeflSlope(rng) {
    const L = rng.nextInt(2, 5), a = rng.nextInt(1, L), k = rng.nextInt(1, 5);
    const ans = k * (6 * L * a - 3 * a * a);
    const y = (x) => k * (3 * L * x * x - x * x * x);
    return MQ(T.defl(),
      tx(`Bir konsol kirişin sehim eğrisi y(x) = ${k}(${3 * L}x² − x³) mm (x metre cinsinden). x = ${a} m'de eğim dy/dx kaç mm/m'dir?`,
        `The deflection curve of a cantilever is y(x) = ${k}(${3 * L}x² − x³) mm (x in metres). What is the slope dy/dx at x = ${a} m, in mm/m?`),
      ans, 'mm/m',
      [[y(a), tx('Sehimi (y) eğim sandın; bir türev almadın.', 'You gave the deflection y instead of its derivative.')],
        [k * (6 * L - 3 * a), tx('Türevde x çarpanını yitirdin (6Lx yerine 6L).', 'You lost a factor x in the derivative (6L instead of 6Lx).')],
        [k * (6 * L * a - a * a), tx('x³ teriminin türevini 3x² yerine x² aldın.', 'You differentiated x³ to x² instead of 3x².')],
        [k * (6 * L - 6 * a), tx('Eğim yerine ikinci türevi (eğrilik) hesapladın.', 'You computed the second derivative (curvature) instead of the slope.')]],
      [`y'(x) = ${k}(${6 * L}x − 3x²) mm/m`, `y'(${a}) = ${k}(${6 * L * a} − ${3 * a * a})`, `y'(${a}) = ${n(ans)} mm/m`], rng,
      { indep: dif(y, a) });
  }

  function nTaylorLin(rng) {
    const m = rng.pick([2, 4, 5]), dv = rng.nextInt(1, 4);
    const nn = 1 / m;
    const ans = -m * dv;
    return MQ(T.fat(),
      tx(`Taylor takım ömrü denklemi V·T^${n(nn)} = C (V: kesme hızı, T: takım ömrü). Doğrusallaştırma ile kesme hızı %${dv} artarsa takım ömrü yaklaşık yüzde kaç değişir?`,
        `Taylor's tool-life equation is V·T^${n(nn)} = C (V: cutting speed, T: tool life). Using linearization, by roughly what percent does the tool life change if the cutting speed rises by ${dv}%?`),
      ans, '%',
      [[m * dv, tx('Hız arttığında ömür azalır; işareti pozitif yazdın.', 'Tool life falls when speed rises; you gave a positive change.')],
        [-dv * nn, tx('1/n yerine n ile çarptın.', 'You multiplied by n instead of 1/n.')],
        [-dv, tx('Üssü hesaba katmadın (ömür hızla bire bir değişir sandın).', 'You ignored the exponent (assumed life changes 1:1 with speed).')],
        [-m * m * dv, tx('1/n değerini iki kez uyguladın.', 'You applied 1/n twice.')]],
      [`T = (C/V)^(1/n) → dT/T = −(1/n)·dV/V`, `1/n = ${m}`, `ΔT/T ≈ −${m}·${dv}% = ${ans}%`], rng,
      { indep: (() => { const f = (v) => Math.pow(1 / v, m); return dif(f, 1, 1e-5) / f(1) * dv; })() });
  }

  function nFatigueSlope(rng) {
    const m = rng.pick([2, 3, 4]), N0 = rng.nextInt(1, 6) * 100000, S0 = rng.pick([100, 200, 250, 400, 500]);
    const ans = -m * N0 / S0;
    const C = N0 * Math.pow(S0, m);
    return MQ(T.fat(),
      tx(`Yorulma ömrü N(S) = C/S^${m} ile modelleniyor. S = ${S0} MPa'da N = ${N0} çevrimdir. Bu noktada dN/dS kaç çevrim/MPa'dır?`,
        `Fatigue life is modelled by N(S) = C/S^${m}. At S = ${S0} MPa the life is N = ${N0} cycles. What is dN/dS at this point, in cycles/MPa?`),
      ans, tx('çevrim/MPa', 'cycles/MPa'),
      [[m * N0 / S0, tx('Gerilme arttıkça ömür azalır; işareti pozitif yazdın.', 'Life falls as stress rises; you gave a positive slope.')],
        [-N0 / S0, tx('Üs çarpanını (m) unuttun.', 'You forgot the exponent factor m.')],
        [-(m - 1) * N0 / S0, tx('Üssü 1 eksik aldın (x^(−m) türevi −m x^(−m−1)).', 'You reduced the power by one too many (d/dS S^−m = −m S^(−m−1)).')],
        [-m * N0, tx('S\'ye bölmeyi unuttun.', 'You forgot to divide by S.')]],
      [`N = C·S^(−${m}) → dN/dS = −${m}·C·S^(−${m + 1}) = −${m}·N/S`, `= −${m}·${N0}/${S0}`, `dN/dS = ${n(ans)} ${tx('çevrim/MPa', 'cycles/MPa')}`], rng,
      { indep: dif((S) => C / Math.pow(S, m), S0, 1e-3) });
  }

  function nRelatedCircle(rng) {
    const r = rng.nextInt(2, 9), rp = rng.nextInt(1, 4);
    const unit = tx('m²/dk', 'm²/min');
    return MS(T.rel(),
      tx(`Durgun suya dökülen yağ dairesel bir leke oluşturuyor; yarıçap ${rp} m/dk hızla büyüyor. r = ${r} m olduğu anda lekenin alanı ne kadar hızla büyür?`,
        `Oil spilling on still water forms a circular slick whose radius grows at ${rp} m/min. How fast is the area growing at the moment r = ${r} m?`),
      `${2 * r * rp}π ${unit}`,
      [[`${r * rp}π ${unit}`, tx('A = πr² türevinde 2 çarpanını unuttun.', 'You forgot the factor 2 when differentiating A = πr².')],
        [`${2 * rp}π ${unit}`, tx('r çarpanını (zincir kuralı) unuttun.', 'You forgot the factor r from the chain rule.')],
        [`${r * r * rp}π ${unit}`, tx('Türev yerine A = πr²\'yi kullandın.', 'You used πr² instead of its derivative.')],
        [`${2 * r}π ${unit}`, tx('dr/dt çarpanını (zincir kuralı) unuttun.', 'You forgot the chain-rule factor dr/dt.')],
        [`${2 * r * rp} ${unit}`, tx('π çarpanını unuttun.', 'You dropped the π.')]],
      ['A = πr²', 'dA/dt = 2πr·dr/dt', `dA/dt = 2π·${r}·${rp} = ${2 * r * rp}π ${unit}`], rng,
      { indep: dif((t) => Math.PI * Math.pow(r + rp * t, 2), 0, 1e-4), text: (s) => parseFloat(s) * Math.PI },
      [1, 2, 3].map((d) => [`${2 * r * rp + d}π ${unit}`, FILL()]));
  }

  function nDistFromAccel(rng) {
    const a0 = rng.pick([4, 6, 8, 10]), b = rng.pick([6, 12, 18]), v0 = rng.pick([0, 5, 10]), Tt = rng.nextInt(2, 5);
    const ans = v0 * Tt + a0 * Tt * Tt / 2 - b * Tt * Tt * Tt / 6;
    return MQ(T.kin(),
      tx(`Bir aracın ivmesi a(t) = ${poly('t', a0, -b)} (m/s²), v(0) = ${v0} m/s ve s(0) = 0'dır. İlk ${Tt} s'de aldığı yol kaç metredir?`,
        `A vehicle has acceleration a(t) = ${poly('t', a0, -b)} (m/s²), v(0) = ${v0} m/s and s(0) = 0. How far does it travel in the first ${Tt} s, in metres?`),
      ans, 'm',
      [[v0 * Tt + a0 * Tt * Tt / 2, tx('−bt terimini atladın.', 'You dropped the −bt term.')],
        [v0 * Tt + a0 * Tt * Tt / 2 + b * Tt * Tt * Tt / 6, tx('−bt teriminin işaretini ters aldın.', 'You flipped the sign of the −bt term.')],
        [v0 + a0 * Tt - b * Tt * Tt / 2, tx('Konum yerine hızı v(T) hesapladın (yalnızca bir integral).', 'You found v(T) (one integral) instead of the distance (two).')],
        [a0 * Tt * Tt / 2 - b * Tt * Tt * Tt / 6, tx('Başlangıç hızı v₀·t terimini unuttun.', 'You forgot the v₀·t term from the initial speed.')]],
      [`v(t) = ∫a dt = ${v0} + ${a0}t − ${b / 2}t² (m/s)`, `s(t) = ∫v dt = ${v0}t + ${a0 / 2}t² − ${n(b / 6)}t³`, `s(${Tt}) = ${n(ans)} m`], rng,
      { indep: simpson((u) => v0 + simpson((t) => a0 - b * t, 0, u, 200), 0, Tt, 400) });
  }

  // =====================================================================================================
  // New generators - Level 3 (multi-step)
  // =====================================================================================================

  function nTriRB(rng) {
    const w0 = rng.pick([6, 9, 12, 18]), L = rng.pick([3, 4, 5, 6]);
    const ans = w0 * L / 3;
    return MQ(T.load(),
      tx(`${L} m açıklıklı basit mesnetli AB kirişine (A: x = 0, B: x = ${L} m) w(x) = ${w0}x/${L} (kN/m) üçgen yük etkiyor. B mesnet tepkisi kaç kN'dur? (A noktasına göre moment alın: R_B·L = ∫x·w dx)`,
        `A simply supported ${L} m beam AB (A at x = 0, B at x = ${L} m) carries the triangular load w(x) = ${w0}x/${L} (kN/m). What is the reaction at B in kN? (Take moments about A: R_B·L = ∫x·w dx)`),
      ans, 'kN',
      [[w0 * L / 2, tx('Toplam yükü (bileşke) mesnet tepkisi sandın.', 'You gave the total load as the support reaction.')],
        [w0 * L / 6, tx('A mesnedinin tepkisini (R_A) hesapladın.', 'You computed the reaction at A instead of B.')],
        [2 * w0 * L / 3, tx('Yükün merkezinin 2L/3 olduğunu bilip tepkiyi 2L/3 ile çarptın.', 'You multiplied the load by 2/3 instead of dividing the moment by L.')],
        [w0 * L * L / 3, tx('Moment ∫x·w dx değerini L\'ye bölmeden verdin.', 'You gave the moment ∫x·w dx without dividing by L.')]],
      [`∫x·w dx = ∫₀^${L} ${w0}x²/${L} dx = ${w0}L²/3 = ${n(w0 * L * L / 3)} kN·m`, `R_B·${L} = ${n(w0 * L * L / 3)}`, `R_B = ${n(ans)} kN`], rng,
      { indep: simpson((x) => x * w0 * x / L, 0, L) / L });
  }

  function nRampBeamM(rng) {
    const k = rng.pick([6, 12, 18]), L = rng.pick([4, 6, 8]), a = rng.nextInt(1, L);
    const RA = k * L * L / 6;
    const ans = RA * a - k * a * a * a / 6;
    const w = (x) => k * x;
    const RAnum = simpson((x) => (L - x) * w(x), 0, L) / L;
    return MQ(T.beam(),
      tx(`${L} m açıklıklı basit mesnetli kirişte (A: x = 0) yük şiddeti w(x) = ${k}x (kN/m). R_A = ${n(RA)} kN'dur. V(x) = R_A − ∫w dx ve M(x) = ∫V dx (M(0) = 0) ilişkileriyle x = ${a} m'deki eğilme momenti kaç kN·m'dir?`,
        `A simply supported ${L} m beam (A at x = 0) carries w(x) = ${k}x (kN/m), with R_A = ${n(RA)} kN. Using V(x) = R_A − ∫w dx and M(x) = ∫V dx (M(0) = 0), what is the bending moment at x = ${a} m in kN·m?`),
      ans, 'kN·m',
      [[RA * a, tx('Yayılı yükün momente etkisini (−kx³/6) unuttun.', 'You dropped the load\'s contribution (−kx³/6) to the moment.')],
        [RA * a - k * a * a * a / 2, tx('V\'de −kx²/2\'yi integre ederken 1/3 yerine 1/1 kullandın (−kx³/2).', 'You integrated −kx²/2 to −kx³/2 instead of −kx³/6.')],
        [k * L * L * a / 2 - k * a * a * a / 6, tx('Mesnet tepkisi yerine toplam yükü (kL²/2) kullandın.', 'You used the total load (kL²/2) instead of R_A.')],
        [RA * a + k * a * a * a / 6, tx('Yük teriminin işaretini ters aldın.', 'You added the load term instead of subtracting it.')],
        [RA - k * a * a / 2, tx('Moment yerine kesme kuvveti V(a) hesapladın.', 'You computed the shear V(a) instead of the moment.')]],
      [`V(x) = R_A − ∫₀^x ${k}s ds = ${n(RA)} − ${n(k / 2)}x² (kN)`, `M(x) = ∫V dx = ${n(RA)}x − ${n(k / 6)}x³ (kN·m)`, `M(${a}) = ${n(RA)}·${a} − ${n(k / 6)}·${a * a * a} = ${n(ans)} kN·m`], rng,
      { indep: simpson((x) => RAnum - simpson((s) => w(s), 0, x, 200), 0, a, 400) });
  }

  function nCentroidY(rng) {
    const k = rng.nextInt(1, 4), a = rng.nextInt(2, 6);
    const ks = k === 1 ? '' : String(k);
    return MS(T.load(),
      tx(`y = ${ks}x² eğrisi, x ekseni ve x = ${a} m doğrusu arasındaki bölgenin ağırlık merkezinin y koordinatı kaç metredir? (ȳ = ½∫y² dx / ∫y dx)`,
        `What is the y-coordinate of the centroid (in m) of the region between y = ${ks}x², the x-axis and x = ${a} m? (ȳ = ½∫y² dx / ∫y dx)`),
      frac(3 * k * a * a, 10) + ' m',
      [[frac(k * a * a, 3), tx('ȳ yerine ∫y dx / a ortalamasını verdin.', 'You gave the mean height ∫y dx / a instead of ȳ.')],
        [frac(3 * k * a * a, 4), tx('x̄ için olan 3/4 oranını y\'ye uyguladın.', 'You applied the x̄ ratio 3/4 to y.')],
        [frac(k * a * a, 2), tx('ȳ\'yi eğrinin yüksekliğinin yarısı sandın.', 'You took ȳ as half the height of the curve.')],
        [frac(2 * k * a * a, 5), tx('∫y² dx = k²a⁵/5 sonucunu ½ ile çarpmadan böldün.', 'You used the integral of y² without the factor ½ correctly.')]].map(([s, nt]) => [s + ' m', nt]),
      [`∫y dx = ∫₀^${a} ${ks}x² dx = ${k}·${a}³/3`, `½∫y² dx = ½·${k * k}·${a}⁵/5 = ${k * k}·${a}⁵/10`, `ȳ = ${frac(3 * k * a * a, 10)} m`], rng,
      { indep: 0.5 * simpson((x) => Math.pow(k * x * x, 2), 0, a) / simpson((x) => k * x * x, 0, a), text: (s) => { const p = s.replace(' m', '').split('/'); return p.length > 1 ? p[0] / p[1] : +p[0]; } });
  }

  function nIxParabola(rng) {
    const j = rng.nextInt(1, 4), a = rng.nextInt(2, 4);
    const k = 5 * j;
    const ans = k * Math.pow(a, 5) / 5;
    return MQ(T.inertia(),
      tx(`y = ${k}x² eğrisi (y cm), x ekseni ve x = ${a} cm arasındaki bölgenin y eksenine göre atalet momenti I_y = ∫x² dA kaç cm⁴'tür? (dA = y dx, x ∈ [0, ${a}])`,
        `For the region between y = ${k}x² (y in cm), the x-axis and x = ${a} cm, what is the second moment of area about the y-axis, I_y = ∫x² dA, in cm⁴? (dA = y dx, x ∈ [0, ${a}])`),
      ans, 'cm⁴',
      [[k * Math.pow(a, 4) / 4, tx('x² yerine x ile çarptın (statik moment).', 'You weighted by x instead of x² (a first moment).')],
        [k * Math.pow(a, 5) / 3, tx('∫x⁴ dx = x⁵/5 yerine x⁵/3 aldın.', 'You integrated x⁴ to x⁵/3 instead of x⁵/5.')],
        [k * Math.pow(a, 5) / 10, tx('Fazladan ½ çarpanı ekledin.', 'You inserted a spurious factor ½.')],
        [k * Math.pow(a, 3) / 3, tx('x² ağırlığını unutup yalnızca alanı integre ettin.', 'You forgot the x² weight and integrated just the area.')]],
      ['I_y = ∫x² dA = ∫₀^a x²·y dx', `= ∫₀^${a} ${k}x⁴ dx = ${k}·x⁵/5`, `I_y = ${k}·${Math.pow(a, 5)}/5 = ${n(ans)} cm⁴`], rng,
      { indep: simpson((x) => x * x * k * x * x, 0, a) });
  }

  function nProjUnits(rng) {
    const v0 = rng.pick([90, 180]), cosv = rng.pick([0.8, 0.6]), sinv = cosv === 0.8 ? 0.6 : 0.8;
    const askH = rng.nextInt(0, 2) === 0;
    const u = v0 / 3.6, vx = u * cosv, vy = u * sinv;
    const H = vy * vy / 20, R = 2 * vx * vy / 10;
    const ans = askH ? H : R;
    const wr = askH
      ? [[ans * 12.96, tx('km/h → m/s dönüşümünü yapmadın (÷3,6).', 'You skipped the km/h → m/s conversion (÷3.6).')],
        [vx * vx / 20, tx('Düşey yerine yatay bileşeni (cos) kullandın.', 'You used the horizontal component (cos) instead of the vertical one.')],
        [vy * vy / 10, tx('v_y²/(2g) yerine v_y²/g aldın.', 'You used v_y²/g instead of v_y²/(2g).')],
        [ans * 3.6, tx('Dönüşüm faktörünü yalnızca bir kez uyguladın (kare alınmalı).', 'You applied the conversion factor once (it must be squared).')]]
      : [[ans * 12.96, tx('km/h → m/s dönüşümünü yapmadın (÷3,6).', 'You skipped the km/h → m/s conversion (÷3.6).')],
        [ans / 2, tx('Uçuş süresi yerine yalnızca çıkış süresini kullandın.', 'You used only the rise time instead of the full flight time.')],
        [vy * vy / 10, tx('Menzil yerine maksimum yüksekliğin 2 katını verdin.', 'You gave twice the max height instead of the range.')],
        [ans * 3.6, tx('Dönüşüm faktörünü yalnızca bir kez uyguladın (kare alınmalı).', 'You applied the conversion factor once (it must be squared).')]];
    return MQ(T.kin(),
      tx(`Bir cisim ${v0} km/h hızla, cos θ = ${cosv} ve sin θ = ${sinv} olacak şekilde fırlatılıyor (g = 10 m/s², hava direnci yok). ${askH ? 'Maksimum yüksekliği' : 'Yatay menzili'} kaç metredir?`,
        `A body is launched at ${v0} km/h with cos θ = ${cosv} and sin θ = ${sinv} (g = 10 m/s², no drag). What is its ${askH ? 'maximum height' : 'horizontal range'} in metres?`),
      ans, 'm', wr,
      [`v₀ = ${v0}/3.6 = ${n(u)} m/s → v_x = ${n(vx)}, v_y = ${n(vy)} m/s`, `y = v_y t − 5t² ; y' = 0 → t = v_y/10 = ${n(vy / 10)} s ; flight time = ${n(vy / 5)} s`,
        askH ? `y_max = v_y²/20 = ${n(ans)} m` : `R = v_x·${n(vy / 5)} = ${n(ans)} m`], rng,
      { indep: (() => { if (askH) { let m = 0; for (let i = 0; i <= 20000; i++) m = Math.max(m, vy * i * 0.001 - 5 * i * i * 1e-6); return m; } let lo = vy / 10, hi = 100; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (vy * mid - 5 * mid * mid > 0) lo = mid; else hi = mid; } return vx * lo; })() });
  }

  function nBrakeUnits(rng) {
    const vk = rng.pick([36, 72, 108, 144]), a = rng.pick([5, 10]);
    const v0 = vk / 3.6;
    const ans = v0 * v0 / (2 * a);
    return MQ(T.kin(),
      tx(`Bir araç ${vk} km/h hızla giderken sabit a = ${a} m/s² ile yavaşlıyor. v(t) = v₀ − at ve s = ∫v dt ile durma mesafesi kaç metredir?`,
        `A vehicle travelling at ${vk} km/h decelerates uniformly at a = ${a} m/s². Using v(t) = v₀ − at and s = ∫v dt, what is the stopping distance in metres?`),
      ans, 'm',
      [[vk * vk / (2 * a), tx('km/h → m/s dönüşümünü yapmadın.', 'You skipped the km/h → m/s conversion.')],
        [v0 * v0 / a, tx('Alanı ½ çarpanı olmadan (dikdörtgen) aldın.', 'You took a rectangle area, without the ½.')],
        [v0 / a, tx('Durma süresini mesafe sandın.', 'You gave the stopping time instead of the distance.')],
        [v0 * v0 / (4 * a), tx('s = v²/(2a) yerine v²/(4a) kullandın.', 'You used v²/(4a) instead of v²/(2a).')]],
      [`v₀ = ${vk}/3.6 = ${n(v0)} m/s`, `v = 0 → t_s = v₀/a = ${n(v0 / a)} s`, `s = ∫₀^${n(v0 / a)} (${n(v0)} − ${a}t) dt = v₀²/(2a) = ${n(ans)} m`], rng,
      { indep: simpson((t) => v0 - a * t, 0, v0 / a) });
  }

  function nSpringHard(rng) {
    const k = rng.pick([100, 200, 300, 400]), beta = rng.pick([4, 8, 12]), x1 = rng.nextInt(1, 4);
    const ans = k * x1 * x1 / 2 + beta * Math.pow(x1, 4) / 4;
    return MQ(T.work(),
      tx(`Sertleşen bir yayın kuvveti F(x) = ${k}x + ${beta}x³ (N, x metre). Yay x = 0'dan x = ${x1} m'ye gerilirse yapılan iş kaç J'dür?`,
        `A hardening spring has force F(x) = ${k}x + ${beta}x³ (N, x in m). How much work is done stretching it from x = 0 to x = ${x1} m, in J?`),
      ans, 'J',
      [[k * x1 * x1 / 2, tx('Kübik terimi (βx³) hesaba katmadın.', 'You ignored the cubic term (βx³).')],
        [k * x1 * x1 + beta * Math.pow(x1, 4), tx('F(x₁)·x₁ aldın (kuvvet sabit sanıldı).', 'You took F(x₁)·x₁ (force treated as constant).')],
        [k * x1 * x1 / 2 + beta * Math.pow(x1, 4), tx('∫x³ dx = x⁴/4 yerine x⁴ aldın.', 'You integrated x³ to x⁴ instead of x⁴/4.')],
        [k * x1 * x1 / 2 + beta * Math.pow(x1, 3) / 3, tx('x³ terimini x² gibi integre ettin (x³/3).', 'You integrated x³ as if it were x² (x³/3).')]],
      [`W = ∫₀^${x1} (${k}x + ${beta}x³) dx`, `= ${k}x²/2 + ${beta}x⁴/4 |₀^${x1}`, `W = ${n(k * x1 * x1 / 2)} + ${n(beta * Math.pow(x1, 4) / 4)} = ${n(ans)} J`], rng,
      { indep: simpson((x) => k * x + beta * x * x * x, 0, x1) });
  }

  function nAdiabatic(rng) {
    const P1 = rng.pick([120, 240, 300]), V1 = rng.pick([1, 2]), s = rng.pick([2, 3]);
    const r = s * s;
    const ans = 2 * P1 * V1 * (1 - 1 / s);
    return MQ(T.gas(),
      tx(`Bir gaz p·V^1,5 = sabit yasasına göre ${V1} m³'ten ${r * V1} m³'e genleşiyor; başlangıç basıncı ${P1} kPa. W = ∫p dV ile gazın yaptığı iş kaç kJ'dür?`,
        `A gas expands following p·V^1.5 = const from ${V1} m³ to ${r * V1} m³, starting at ${P1} kPa. Using W = ∫p dV, what work does the gas do, in kJ?`),
      ans, 'kJ',
      [[P1 * V1 * (r - 1), tx('Basıncı sabit (başlangıç değeri) sanıp p₁·ΔV aldın.', 'You treated pressure as constant at its initial value: p₁ΔV.')],
        [2 * P1 * V1, tx('V₂ terimini (−2C·V₂^(−1/2)) hesaba katmadın.', 'You dropped the upper-limit term (−2C·V₂^(−1/2)).')],
        [P1 * V1 * (1 - 1 / s), tx('∫V^(−1,5) dV = −2V^(−0,5) sonucundaki 2 çarpanını unuttun.', 'You forgot the factor 2 from ∫V^(−1.5) dV = −2V^(−0.5).')],
        [2 * P1 * V1 * (s - 1), tx('V^(−0,5) terimini ters (V₂/V₁ yerine tersi) kullandın.', 'You inverted the V^(−0.5) ratio.')]],
      [`p = C·V^(−1,5), C = p₁V₁^1,5`, `W = C∫V^(−1,5) dV = 2C(V₁^(−0,5) − V₂^(−0,5)) = 2p₁V₁(1 − 1/${s})`, `W = 2·${P1}·${V1}·(1 − 1/${s}) = ${n(ans)} kJ`], rng,
      { indep: simpson((V) => P1 * Math.pow(V1 / V, 1.5), V1, r * V1, 4000) });
  }

  function nHeatMin(rng) {
    const a = rng.nextInt(2, 5), Tt = rng.pick([2, 3, 5]);
    const ans = 30 * a * Tt * Tt;
    return MQ(T.heat(),
      tx(`Bir fırın ısıtıcısının gücü P(t) = ${a}t (kW) olarak artıyor (t: dakika). İlk ${Tt} dakikada verilen ısı enerjisi Q = ∫P dt kaç kJ'dür? (1 kW·dk = 60 kJ)`,
        `A furnace heater's power ramps as P(t) = ${a}t (kW), t in minutes. How much heat Q = ∫P dt is delivered in the first ${Tt} minutes, in kJ? (1 kW·min = 60 kJ)`),
      ans, 'kJ',
      [[a * Tt * Tt / 2, tx('kW·dk → kJ dönüşümünü (×60) yapmadın.', 'You skipped the kW·min → kJ conversion (×60).')],
        [60 * a * Tt * Tt, tx('∫t dt = t²/2 yerine t² aldın.', 'You integrated t to t² instead of t²/2.')],
        [60 * a * Tt, tx('Gücü integre etmek yerine P(T)·60 aldın.', 'You took P(T)·60 instead of integrating.')],
        [3600 * a * Tt * Tt / 2, tx('Dakikayı saate çevirir gibi 3600 kullandın; 1 dk = 60 s.', 'You used 3600 instead of 60 (1 min = 60 s).')]],
      [`Q = ∫₀^${Tt} ${a}t dt = ${a}·${Tt}²/2 = ${n(a * Tt * Tt / 2)} kW·min`, `1 kW·min = 60 kJ`, `Q = ${n(a * Tt * Tt / 2)}·60 = ${n(ans)} kJ`], rng,
      { indep: simpson((t) => a * t, 0, Tt) * 60 });
  }

  function lnCoef(sign, p, d) {
    const c = frac(p, d);
    return `${sign}${c === '1' ? '' : c + ' '}ln 2`;
  }
  function nCoolLn(rng) {
    const D = rng.pick([40, 80, 120, 160]), h = rng.pick([2, 4, 5, 8, 10]);
    const unit = ' °C/' + tx('dk', 'min');
    const k = Math.log(2) / h;
    return MS(T.heat(),
      tx(`Bir parçanın ortamdan sıcaklık farkı e^(−kt) ile azalır: başlangıçta ${D} °C ve her ${h} dakikada yarıya iniyor. t = ${h} dk anında sıcaklık değişim hızı T' kaç °C/dk'dır? (k = ln 2 / ${h})`,
        `The temperature excess of a part over its surroundings decays as e^(−kt): it starts at ${D} °C and halves every ${h} minutes. What is the rate T' at t = ${h} min, in °C/min? (k = ln 2 / ${h})`),
      lnCoef('-', D, 2 * h) + unit,
      [[lnCoef('', D, 2 * h), tx('Soğurken sıcaklık düşer; işareti pozitif yazdın.', 'The part is cooling; you gave a positive rate.')],
        [lnCoef('-', D, h), tx('t = 0\'daki hızı verdin; t = h anında fark yarıya inmiştir (½ çarpanı).', 'You gave the rate at t = 0; at t = h the excess has halved (factor ½).')],
        [lnCoef('-', D, 4 * h), tx('e^(−kt) yerine e^(−2kt) kullandın (iki yarılanma).', 'You used two half-lives (e^(−2kt)) instead of one.')],
        [frac(D, 2 * h) + unit.replace('', ''), tx('k = ln 2/h içindeki ln 2 çarpanını unuttun.', 'You dropped the ln 2 factor in k = ln 2/h.')],
        [lnCoef('-', D, 2) + unit, tx('k\'yi (1/h) hesaba katmadın.', 'You forgot to divide by h (the factor in k).')]].map(([s, nt]) => [s.endsWith('dk') || s.endsWith('min') ? s : s + unit, nt]),
      [`ΔT(t) = ${D}e^(−kt) → T' = −k·${D}e^(−kt)`, `e^(−k·${h}) = 1/2 → T'(${h}) = −(ln 2/${h})·${D}/2`, `T' = ${lnCoef('-', D, 2 * h)}${unit} ≈ ${n(-k * D / 2)}${unit}`], rng,
      { indep: dif((t) => D * Math.exp(-k * t), h, 1e-4), text: (s) => { const m = /^(-?)(?:(\d+)(?:\/(\d+))? )?ln 2/.exec(s); return (m[1] ? -1 : 1) * (m[2] ? (m[3] ? m[2] / m[3] : +m[2]) : 1) * Math.log(2); } });
  }

  function nBalloon(rng) {
    const r = rng.pick([5, 10, 20]), q = rng.nextInt(1, 5);
    const unit = tx('cm/dk', 'cm/min');
    return MS(T.rel(),
      tx(`Küresel bir balon ${q} litre/dk hızla şişiriliyor (1 L = 1000 cm³). Yarıçap r = ${r} cm olduğunda yarıçap ne kadar hızla büyür? (V = 4πr³/3)`,
        `A spherical balloon is inflated at ${q} litres/min (1 L = 1000 cm³). How fast does the radius grow when r = ${r} cm? (V = 4πr³/3)`),
      `${piDen(250 * q, r * r)} ${unit}`,
      [[piDen(1000 * q, r * r), tx('dV/dt = 4πr²·dr/dt içindeki 4 çarpanını unuttun.', 'You forgot the factor 4 in dV/dt = 4πr²·dr/dt.')],
        [piDen(250 * q, r), tx('r² yerine r kullandın (türevde üs 2 olmalı).', 'You used r instead of r² (the derivative has r²).')],
        [piDen(q, 4 * r * r), tx('Litre → cm³ dönüşümünü (×1000) yapmadın.', 'You skipped the litre → cm³ conversion (×1000).')],
        [piDen(750 * q, r * r), tx('V = 4πr³/3 türevinde 3\'ü sadeleştirmeyi yanlış yaptın (4/3 → 1).', 'You mishandled the 4/3 when differentiating (treated it as 1).')],
        [piDen(250 * q, r * r * r), tx('Türevde üssü düşürmedin (r³).', 'You left r³ without lowering the power.')]].map(([s, nt]) => [s + ' ' + unit, nt]),
      [`dV/dt = ${q}·1000 = ${1000 * q} cm³/min`, 'V = 4πr³/3 → dV/dt = 4πr²·dr/dt', `dr/dt = ${1000 * q}/(4π·${r * r}) = ${piDen(250 * q, r * r)} ${unit}`], rng,
      { indep: 1000 * q / (4 * Math.PI * r * r), text: (s) => { const m = /^(\d+)\/(?:\((\d+)π\)|π)/.exec(s); return m[1] / ((m[2] ? +m[2] : 1) * Math.PI); } });
  }

  function nToughness(rng) {
    const sy = rng.pick([200, 300, 400]), ey = rng.nextInt(1, 3), eu = rng.pick([10, 20, 30]);
    const ans = sy * (eu - ey / 2);
    return MQ(T.ss(),
      tx(`İdeal elastik–plastik bir malzemede σ, ε = ${n(ey / 1000)}'e kadar doğrusal artıp σ_y = ${sy} MPa'da sabit kalıyor; kopma ε = ${n(eu / 1000)}'de olur. Birim hacimdeki toplam enerji u = ∫σ dε (eğri altındaki alan) kaç kJ/m³'tür? (1 MPa = 1000 kJ/m³)`,
        `An elastic–perfectly-plastic material has σ rising linearly up to ε = ${n(ey / 1000)}, then stays at σ_y = ${sy} MPa until fracture at ε = ${n(eu / 1000)}. What total energy per unit volume u = ∫σ dε (area under the curve) does it absorb, in kJ/m³? (1 MPa = 1000 kJ/m³)`),
      ans, 'kJ/m³',
      [[sy * eu, tx('Tüm bölgeyi dikdörtgen sayıp elastik üçgeni ayırmadın.', 'You took the whole region as a rectangle, ignoring the elastic triangle.')],
        [sy * eu / 2, tx('Tüm eğriyi üçgen kabul ettin.', 'You treated the whole curve as one triangle.')],
        [sy * ey / 2, tx('Yalnızca elastik üçgeni hesapladın.', 'You counted only the elastic triangle.')],
        [sy * (eu - ey), tx('Yalnızca plastik dikdörtgeni hesapladın.', 'You counted only the plastic rectangle.')],
        [sy * (eu - ey / 2) / 1000, tx('MPa → kJ/m³ dönüşümünü (×1000) yapmadın.', 'You skipped the MPa → kJ/m³ conversion (×1000).')]],
      [tx(`Elastik: ½·${sy}·${n(ey / 1000)} = ${n(sy * ey / 2000)} MJ/m³`, `Elastic: ½·${sy}·${n(ey / 1000)} = ${n(sy * ey / 2000)} MJ/m³`), tx(`Plastik: ${sy}·(${n(eu / 1000)} − ${n(ey / 1000)}) = ${n(sy * (eu - ey) / 1000)} MJ/m³`, `Plastic: ${sy}·(${n(eu / 1000)} − ${n(ey / 1000)}) = ${n(sy * (eu - ey) / 1000)} MJ/m³`), `u = ${n(sy * (eu - ey / 2) / 1000)} MJ/m³ = ${n(ans)} kJ/m³`], rng,
      { indep: (simpson((e) => (sy / (ey / 1000)) * e, 0, ey / 1000) + simpson(() => sy, ey / 1000, eu / 1000)) * 1000 });
  }

  function nTipDefl(rng) {
    const e = rng.pick([2, 4, 5]), L = rng.nextInt(2, 5), u = rng.nextInt(1, 3);
    const EI = e * 1000, P = 3 * e * u;
    const ans = L * L * L * u;
    return MQ(T.defl(),
      tx(`Boyu L = ${L} m olan konsol kirişin ucuna P = ${P} kN yük etkiyor; EI = ${EI} kN·m². Eğrilik y'' = P(L − x)/EI, y(0) = 0, y'(0) = 0 olduğuna göre uç sehimi y(L) kaç mm'dir?`,
        `A cantilever of length L = ${L} m carries a tip load P = ${P} kN; EI = ${EI} kN·m². With curvature y'' = P(L − x)/EI, y(0) = 0 and y'(0) = 0, what is the tip deflection y(L) in mm?`),
      ans, 'mm',
      [[ans * 3 / 2, tx('Eğrilik integralinde 1/6 yerine 1/4 kullandın (PL³/(2EI)).', 'You ended with PL³/(2EI) instead of PL³/(3EI).')],
        [ans * 3 / 8, tx('Düzgün yayılı yük formülü (wL⁴/8EI) katsayısını kullandın.', 'You used the uniform-load coefficient 1/8 instead of 1/3.')],
        [ans / 1000, tx('m → mm dönüşümünü (×1000) yapmadın.', 'You skipped the m → mm conversion (×1000).')],
        [ans / 2, tx('İkinci integrasyonda ½ çarpanı fazladan eklendi (PL³/6EI).', 'You gave PL³/(6EI), an extra factor ½ at the second integration.')]],
      [`y'(x) = (P/EI)(Lx − x²/2)`, `y(x) = (P/EI)(Lx²/2 − x³/6) → y(L) = PL³/(3EI)`, `y(L) = ${P}·${L * L * L}/(3·${EI}) m = ${n(ans / 1000)} m = ${n(ans)} mm`], rng,
      { indep: simpson((s) => (L - s) * P * (L - s) / EI, 0, L) * 1000 });
  }

  function nCylOpt(rng) {
    const r0 = rng.nextInt(1, 5);
    const V = 2 * r0 * r0 * r0;
    return MQ(T.opt(),
      tx(`Hacmi V = ${V}π m³ olan kapalı silindirik bir tankın yüzey alanı A = 2πr² + 2V/r en az olacak şekilde yarıçap kaç metre olmalıdır? (dA/dr = 0)`,
        `A closed cylindrical tank must hold V = ${V}π m³. For what radius is the surface area A = 2πr² + 2V/r least? (dA/dr = 0)`),
      r0, 'm',
      [[r0 * r0 * r0, tx('Küp kökü almayı unuttun (r³ değerini verdin).', 'You forgot the cube root (gave r³).')],
        [Math.cbrt(2) * r0, tx('r³ = V/(2π) yerine r³ = V/π kullandın.', 'You used r³ = V/π instead of V/(2π).')],
        [2 * r0, tx('Çap ya da yükseklik (h = 2r) değerini yarıçap sandın.', 'You gave the diameter/height (h = 2r) instead of the radius.')],
        [r0 / 2, tx('Türevde 2 çarpanını hatalı kullandın.', 'You mishandled the factor 2 in the derivative.')]],
      [`A' = 4πr − 2V/r² = 0`, `r³ = V/(2π) = ${V}π/(2π) = ${r0 * r0 * r0}`, `r = ${r0} m (h = 2r = ${2 * r0} m)`], rng,
      { indep: (() => { let best = 1e18, br = 0; for (let r = 0.01; r < 3 * r0; r += 0.001) { const A = 2 * Math.PI * r * r + 2 * V * Math.PI / r; if (A < best) { best = A; br = r; } } return br; })() });
  }

  function nCostPower(rng) {
    const a = rng.pick([2, 4, 6]), k = rng.nextInt(2, 5);
    const b = a * k * k * k / 2;
    const ans = 3 * a * k / 2;
    const C = (x) => a * x + b / (x * x);
    return MQ(T.opt(),
      tx(`Bir ısı değiştiricide birim uzunluk maliyeti C(x) = ${a}x + ${n(b)}/x² (birim/m), x: kalınlık (cm). En düşük maliyet kaç birim/m'dir?`,
        `For a heat exchanger the cost per metre is C(x) = ${a}x + ${n(b)}/x² (units/m), x: thickness (cm). What is the minimum cost, in units/m?`),
      ans, tx('birim/m', 'units/m'),
      [[k, tx('Optimum kalınlığı (x) maliyet sandın; C(x*) hesaplanmalı.', 'You gave the optimal thickness x*, not the cost C(x*).')],
        [a * k, tx('b/x² terimini (a·k/2) toplamayı unuttun.', 'You omitted the b/x² part of the cost (ak/2).')],
        [2 * a * k, tx('İkinci terimi birinciye eşit (a·k) alıp topladın.', 'You took the second term equal to the first (ak).')],
        [a * k + b / k, tx('b/x² yerine b/x kullandın.', 'You used b/x instead of b/x².')]],
      [`C'(x) = ${a} − ${n(2 * b)}/x³ = 0 → x³ = ${n(2 * b / a)} → x = ${k}`, `C(${k}) = ${a * k} + ${n(b)}/${k * k} = ${a * k} + ${n(b / (k * k))}`, `C_min = ${n(ans)} ${tx('birim/m', 'units/m')}`], rng,
      { indep: (() => { let m = 1e18; for (let x = 0.01; x < 4 * k; x += 0.001) m = Math.min(m, C(x)); return m; })() });
  }

  function nTaylorDeriv(rng) {
    const V = rng.pick([50, 100, 200]), Tl = rng.pick([20, 40, 60]), nn = rng.pick([0.25, 0.5]);
    const ans = -Tl / (nn * V);
    const Cc = V * Math.pow(Tl, nn);
    const unit = tx('dk/(m/dk)', 'min/(m/min)');
    return MQ(T.fat(),
      tx(`Taylor denklemi V·T^${nn} = C. V = ${V} m/dk'da takım ömrü T = ${Tl} dk ise, bu noktada dT/dV kaç dk/(m/dk)'dır? (kapalı türev alın)`,
        `Taylor's equation is V·T^${nn} = C. If at V = ${V} m/min the tool life is T = ${Tl} min, what is dT/dV at that point, in min/(m/min)? (differentiate implicitly)`),
      ans, unit,
      [[-ans, tx('Hız arttıkça ömür azalır; işareti pozitif yazdın.', 'Life drops as speed rises; you gave a positive slope.')],
        [-nn * Tl / V, tx('n çarpanını paydaya değil paya koydun.', 'You put n in the numerator instead of the denominator.')],
        [-Tl / V, tx('n üssünün türeve etkisini (1/n) unuttun.', 'You ignored the effect of the exponent n (the 1/n factor).')],
        [-Tl / (nn * V * V), tx('V yerine V²\'ye böldün.', 'You divided by V² instead of V.')]],
      [`d/dV: T^${nn} + V·${nn}·T^${n(nn - 1)}·T' = 0`, `T' = −T^${nn}/(${nn}·V·T^${n(nn - 1)}) = −T/(${nn}V)`, `T' = −${Tl}/(${nn}·${V}) = ${n(ans)} ${unit}`], rng,
      { indep: dif((v) => Math.pow(Cc / v, 1 / nn), V, 1e-3) });
  }

  function nSNDeriv(rng) {
    const b = rng.pick([0.1, 0.2, 0.25]), S0 = rng.pick([200, 300, 400, 500]), N0 = rng.pick([1000, 2000, 5000, 10000]);
    const ans = -b * S0 / N0;
    const A = S0 * Math.pow(N0, b);
    const unit = tx('MPa/çevrim', 'MPa/cycle');
    return MQ(T.fat(),
      tx(`S–N eğrisi S(N) = A·N^(−${b}) güç yasasıyla modelleniyor. N = ${N0} çevrimde S = ${S0} MPa ise, bu noktada dS/dN kaç MPa/çevrim'dir?`,
        `The S–N curve follows the power law S(N) = A·N^(−${b}). If S = ${S0} MPa at N = ${N0} cycles, what is dS/dN there, in MPa/cycle?`),
      ans, unit,
      [[b * S0 / N0, tx('Gerilme genliği çevrimle azalır; işareti pozitif yazdın.', 'The stress amplitude falls with cycles; you gave a positive slope.')],
        [-b * S0, tx('N\'ye bölmeyi unuttun (türevde N^(−b−1) kalır).', 'You forgot to divide by N (the derivative has N^(−b−1)).')],
        [-S0 / N0, tx('Üs çarpanı b\'yi unuttun.', 'You forgot the exponent factor b.')],
        [-(1 - b) * S0 / N0, tx('Üssü (−b) yerine (b − 1) saydın.', 'You used (1 − b) in place of b as the coefficient.')]],
      [`dS/dN = −b·A·N^(−b−1) = −b·S/N`, `= −${b}·${S0}/${N0}`, `dS/dN = ${n(ans)} ${unit}`], rng,
      { indep: dif((N) => A * Math.pow(N, -b), N0, N0 * 1e-4) });
  }

  function nVibAccel(rng) {
    const A = rng.pick([5, 10, 20, 50]), w = rng.pick([10, 20, 30, 40]);
    const ans = A * w * w / 1000;
    const x = (t) => A * Math.cos(w * t);
    return MQ(T.kin(),
      tx(`Bir makine parçası x(t) = ${A} cos(${w}t) mm ile titreşiyor (ω = ${w} rad/s). Maksimum ivme büyüklüğü kaç m/s²'dir?`,
        `A machine part vibrates as x(t) = ${A} cos(${w}t) mm (ω = ${w} rad/s). What is the maximum acceleration magnitude in m/s²?`),
      ans, 'm/s²',
      [[A * w * w, tx('mm → m dönüşümünü (÷1000) yapmadın; sonuç mm/s²\'dir.', 'You skipped the mm → m conversion (÷1000); that is mm/s².')],
        [A * w / 1000, tx('Maksimum hızı verdin; ivme için ikinci türev gerekir.', 'You gave the maximum speed; acceleration needs the second derivative.')],
        [A * w * w * w / 1000, tx('Bir türev fazla aldın (ω³).', 'You differentiated once too often (ω³).')],
        [A * w * w * 1000, tx('Dönüşümü ters yönde uyguladın (×1000).', 'You applied the conversion in the wrong direction (×1000).')]],
      [`v = x' = −${A * w} sin(${w}t) mm/s`, `a = v' = −${A * w * w} cos(${w}t) mm/s²`, `|a|_max = Aω² = ${A * w * w} mm/s² = ${n(ans)} m/s²`], rng,
      { indep: (() => { let m = 0; const h = 1e-4 / w; for (let i = 0; i <= 4000; i++) { const t = i * Math.PI / (w * 2000); const a2 = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h); m = Math.max(m, Math.abs(a2)); } return m / 1000; })() });
  }

  function nPowerKW(rng) {
    const A = rng.pick([1, 2]), m = rng.pick([10, 20, 50]), t0 = rng.nextInt(1, 4);
    const ans = 18 * m * A * A * t0 * t0 * t0 / 1000;
    const s = (t) => A * t * t * t;
    return MQ(T.work(),
      tx(`Kütlesi ${m} kg olan bir cismin konumu s(t) = ${A === 1 ? '' : A}t³ (m). t = ${t0} s'de cisme etkiyen net kuvvetin gücü P = F·v kaç kW'tır? (F = ma)`,
        `A ${m} kg body has position s(t) = ${A === 1 ? '' : A}t³ (m). What is the power P = F·v of the net force at t = ${t0} s, in kW? (F = ma)`),
      ans, 'kW',
      [[ans * 1000, tx('W → kW dönüşümünü (÷1000) yapmadın.', 'You skipped the W → kW conversion (÷1000).')],
        [0.5 * m * Math.pow(3 * A * t0 * t0, 2) / 1000, tx('Güç yerine kinetik enerjiyi (kJ) hesapladın.', 'You computed kinetic energy (kJ) instead of power.')],
        [m * 6 * A * t0 / 1000, tx('Yalnızca kuvveti (kN) hesapladın; güç F·v\'dir.', 'You computed only the force (kN); power is F·v.')],
        [9 * m * A * A * t0 * t0 * t0 / 1000, tx('İvmede 6At yerine 3At kullandın (ikinci türevde 2 çarpanı kayıp).', 'You used 3At for the acceleration (lost the factor 2 in the second derivative).')]],
      [`v = s' = ${3 * A}t² (m/s), a = v' = ${6 * A}t (m/s²)`, `F = ma = ${m}·${6 * A * t0} = ${m * 6 * A * t0} N ; v = ${3 * A * t0 * t0} m/s`, `P = F·v = ${m * 6 * A * t0 * 3 * A * t0 * t0} W = ${n(ans)} kW`], rng,
      { indep: m * dif((t) => dif(s, t, 1e-3), t0, 1e-3) * dif(s, t0) / 1000 });
  }

  // =====================================================================================================
  // Levels, lists, registration
  // =====================================================================================================

  const L1 = [enAccel, enStopDist, enSpringWork, enMaxSpeed, enFatigue, nPosFromVel, nKE, nRampResultant, nYoungModulus, nHeatPower, nFlowVolume, nIxRect, nProjHeight, nCoolRate];
  const L2 = [enBeamMoment, enMaxMoment, enCentroid, enCooling, enOptDiameter, enLpbfPower, nRampLine, nIxTriangle, nProjRange, nWorkVariable, nGasLinear, nTankMax, nStrainEnergy, nDeflSlope, nTaylorLin, nFatigueSlope, nRelatedCircle, nDistFromAccel];
  const L3 = [enGasWork, enTankFill, nTriRB, nRampBeamM, nCentroidY, nIxParabola, nProjUnits, nBrakeUnits, nSpringHard, nAdiabatic, nHeatMin, nCoolLn, nBalloon, nToughness, nTipDefl, nCylOpt, nCostPower, nTaylorDeriv, nSNDeriv, nVibAccel, nPowerKW];
  L1.forEach((g) => { g.level = 1; });
  L2.forEach((g) => { g.level = 2; });
  L3.forEach((g) => { g.level = 3; });

  // Regular 10-question quiz: the 13 generators ported from QuizBankEngineering.vb.
  const GENERATORS = [enBeamMoment, enMaxMoment, enCentroid, enAccel, enStopDist, enSpringWork, enMaxSpeed, enCooling, enGasWork, enTankFill, enOptDiameter, enLpbfPower, enFatigue];
  const EXTRA = L1.concat(L2, L3).filter((g) => GENERATORS.indexOf(g) < 0);

  Topics.register('engineering', {
    type: 'quiz',
    tabTitle: () => tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  // Printable exam sets: every generator above, each tagged with .level (1/2/3).
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.engineering = GENERATORS.concat(EXTRA);
})();
