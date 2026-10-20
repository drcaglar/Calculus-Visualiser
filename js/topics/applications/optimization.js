// Optimisation with derivatives (chapter 'applications') - the 5-step recipe on classic engineering problems.
// problem = { kind, ...params, t (0..100: position of the moving design point inside the allowed range), showD }
// Every scenario is built BACKWARDS from a clean optimum (integer / simple fractions), so Q'(x) = 0 has an exact answer.
//   fence      rectangle, fixed perimeter -> max area              river   3-sided pen along a river -> max area
//   minPerim   rectangle, fixed area -> min perimeter              openBox open box from a square sheet (cut corners) -> max volume
//   canMin     closed cylindrical can, fixed volume -> min surface openBoxSurf open square-base box, fixed volume -> min material
//   distParab  nearest point of y = x^2 to (0, b)                  distRoot nearest point of y = sqrt(x) to (a, 0)
//   xxy        x + y = S, maximise x^2 y                           pen     fencing cost with two different prices -> min cost
//   path       row + walk, minimum travel time (closed domain)     inscribed rectangle under y = k - x^2 -> max area
//   beam       strongest rectangular beam (w d^2) from a round log
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (n === 0) n = 0;
    return { n, d };
  }
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const F = (n, d) => frS(fr(n, d === undefined ? 1 : d));
  function nf(v) { if (!isFinite(v)) return '—'; let s = fmt2(v); if (s === '-0') s = '0'; return M(s); }
  const PI = Math.PI;
  const ph = (n) => (n === 1 ? 'π' : n + 'π'); // n·π

  // ---------- scenario specs (all text built in the current language) ----------
  // returns { unit, Q(x), Qp(x), xs, qs, kind, lo, hi, vlo, vhi, ylo, yhi, stmt, def, q, dom, dq, sol, sec, ends, ans, dims(x), ends: [{x,y,closed}] }
  function spec(p) {
    const o = { kind: 'max', closedEnds: [], openEnds: [], yloK: -0.1, yhiK: 1.25 };
    switch (p.kind) {
      case 'fence': {
        const s = p.s, P = 2 * s, h = s / 2;
        Object.assign(o, {
          unit: 'm²', Q: (x) => x * (s - x), Qp: (x) => s - 2 * x, xs: h, qs: s * s / 4, lo: 0, hi: s, vlo: -0.05 * s, vhi: 1.05 * s,
          openEnds: [{ x: 0, y: 0 }, { x: s, y: 0 }],
          stmt: Tx(`Çevresi ${P} m olan dikdörtgen biçimli bir bahçenin alanı en büyük olacak şekilde boyutlarını bulun. En büyük alan nedir?`,
            `A rectangular garden has a perimeter of ${P} m. Find its dimensions so that the area is as large as possible. What is the largest area?`),
          def: Tx(`Genişlik x (m), yükseklik y (m); amaç fonksiyonu: alan A = x·y (MAKSİMUM yapılacak).\nKısıt: çevre sabit, 2x + 2y = ${P} → x + y = ${s}.`,
            `Width x (m), height y (m); objective: area A = x·y (to be MAXIMISED).\nConstraint: fixed perimeter, 2x + 2y = ${P} → x + y = ${s}.`),
          q: `y = ${s} − x  →  A(x) = x(${s} − x) = ${s}x − x²`,
          dom: `0 < x < ${s}`,
          dq: `A'(x) = ${s} − 2x`,
          sol: Tx(`A'(x) = 0 → ${s} − 2x = 0 → x = ${h}\nSonra y = ${s} − ${h} = ${h}.`, `A'(x) = 0 → ${s} − 2x = 0 → x = ${h}\nThen y = ${s} − ${h} = ${h}.`),
          sec: Tx(`A''(x) = −2 < 0 → x = ${h} noktasında MAKSİMUM. (Aralıkta tek kritik nokta var.)`, `A''(x) = −2 < 0 → MAXIMUM at x = ${h}. (It is the only critical point in the interval.)`),
          ends: Tx('Uçlarda (x → 0 ya da x → ' + s + ') alan → 0 olduğundan maksimum uçlarda olamaz.', `At the ends (x → 0 or x → ${s}) the area → 0, so the maximum cannot be there.`),
          ans: Tx(`Boyutlar ${h} m × ${h} m (KARE); en büyük alan A = ${h}·${h} = ${s * s / 4} m².`, `Dimensions ${h} m × ${h} m (a SQUARE); largest area A = ${h}·${h} = ${s * s / 4} m².`),
          dims: (x) => Tx(`genişlik ${nf(x)}, yükseklik ${nf(s - x)}, alan ${nf(x * (s - x))} m²`, `width ${nf(x)}, height ${nf(s - x)}, area ${nf(x * (s - x))} m²`),
          qName: 'A', xName: 'x',
        });
        break;
      }
      case 'river': {
        const L = p.L, xs = L / 4, ys = L / 2, qs = L * L / 8;
        Object.assign(o, {
          unit: 'm²', Q: (x) => x * (L - 2 * x), Qp: (x) => L - 4 * x, xs, qs, lo: 0, hi: L / 2, vlo: -0.05 * L / 2, vhi: 1.05 * L / 2,
          openEnds: [{ x: 0, y: 0 }, { x: L / 2, y: 0 }],
          stmt: Tx(`Bir nehir kıyısında, ${L} m çitle üç kenarı çevrili dikdörtgen bir ağıl yapılacak (nehre bakan kenar çitsiz). Alanı en büyük yapan boyutları ve bu alanı bulun.`,
            `A rectangular pen is to be built on a river bank with ${L} m of fence on three sides (the side along the river needs no fence). Find the dimensions that maximise the area, and that area.`),
          def: Tx(`Nehre dik kenarlar x (m), nehre paralel kenar y (m); amaç: alan A = x·y (MAKSİMUM).\nKısıt: çit yalnızca üç kenara: 2x + y = ${L}.`,
            `Sides perpendicular to the river x (m), side parallel to the river y (m); objective: area A = x·y (MAXIMISE).\nConstraint: fence on three sides only: 2x + y = ${L}.`),
          q: `y = ${L} − 2x  →  A(x) = x(${L} − 2x) = ${L}x − 2x²`,
          dom: `0 < x < ${L / 2}`,
          dq: `A'(x) = ${L} − 4x`,
          sol: Tx(`A'(x) = 0 → ${L} − 4x = 0 → x = ${xs}\nSonra y = ${L} − 2·${xs} = ${ys}.`, `A'(x) = 0 → ${L} − 4x = 0 → x = ${xs}\nThen y = ${L} − 2·${xs} = ${ys}.`),
          sec: Tx(`A''(x) = −4 < 0 → x = ${xs} noktasında MAKSİMUM.`, `A''(x) = −4 < 0 → MAXIMUM at x = ${xs}.`),
          ends: Tx(`Uçlarda alan 0'dır (x → 0 ya da x → ${L / 2}); maksimum içeridedir.`, `At the ends the area is 0 (x → 0 or x → ${L / 2}); the maximum is interior.`),
          ans: Tx(`Nehre dik kenarlar ${xs} m, nehre paralel kenar ${ys} m (paralel kenar, dik kenarın 2 katı); en büyük alan ${xs}·${ys} = ${qs} m².`,
            `Perpendicular sides ${xs} m, side along the river ${ys} m (twice the perpendicular side); largest area ${xs}·${ys} = ${qs} m².`),
          dims: (x) => Tx(`x = ${nf(x)}, y = ${nf(L - 2 * x)}, alan ${nf(x * (L - 2 * x))} m²`, `x = ${nf(x)}, y = ${nf(L - 2 * x)}, area ${nf(x * (L - 2 * x))} m²`),
          qName: 'A', xName: 'x',
        });
        break;
      }
      case 'minPerim': {
        const k = p.k, A0 = k * k;
        Object.assign(o, {
          kind: 'min', unit: 'm', Q: (x) => 2 * x + 2 * A0 / x, Qp: (x) => 2 - 2 * A0 / (x * x), xs: k, qs: 4 * k, lo: 0, hi: Infinity, vlo: 0, vhi: 3 * k,
          yloK: 0, yhiK: 2.6,
          stmt: Tx(`Alanı ${A0} m² olan dikdörtgen biçimli bir bahçeyi çevirmek için en az çit gerektiren boyutları bulun. En kısa çit uzunluğu nedir?`,
            `A rectangular garden must have an area of ${A0} m². Find the dimensions that need the least fence. What is the shortest fence length?`),
          def: Tx(`Genişlik x (m), yükseklik y (m); amaç: çevre P = 2x + 2y (MİNİMUM).\nKısıt: alan sabit, x·y = ${A0}.`,
            `Width x (m), height y (m); objective: perimeter P = 2x + 2y (MINIMISE).\nConstraint: fixed area, x·y = ${A0}.`),
          q: `y = ${A0}/x  →  P(x) = 2x + 2·${A0}/x = 2x + ${2 * A0}/x`,
          dom: 'x > 0',
          dq: `P'(x) = 2 − ${2 * A0}/x²`,
          sol: Tx(`P'(x) = 0 → 2 = ${2 * A0}/x² → x² = ${A0} → x = ${k} (x > 0)\nSonra y = ${A0}/${k} = ${k}.`, `P'(x) = 0 → 2 = ${2 * A0}/x² → x² = ${A0} → x = ${k} (x > 0)\nThen y = ${A0}/${k} = ${k}.`),
          sec: Tx(`P''(x) = ${4 * A0}/x³ → P''(${k}) = ${4 * A0}/${k * k * k} = ${F(4, k)} > 0 → MİNİMUM.`, `P''(x) = ${4 * A0}/x³ → P''(${k}) = ${4 * A0}/${k * k * k} = ${F(4, k)} > 0 → MINIMUM.`),
          ends: Tx('x → 0⁺ ya da x → ∞ için P(x) → ∞ olduğundan en küçük değer içeridedir.', 'As x → 0⁺ or x → ∞, P(x) → ∞, so the smallest value is interior.'),
          ans: Tx(`Boyutlar ${k} m × ${k} m (KARE); en kısa çit P = 4·${k} = ${4 * k} m.`, `Dimensions ${k} m × ${k} m (a SQUARE); shortest fence P = 4·${k} = ${4 * k} m.`),
          dims: (x) => Tx(`genişlik ${nf(x)}, yükseklik ${nf(A0 / x)}, çevre ${nf(2 * x + 2 * A0 / x)} m`, `width ${nf(x)}, height ${nf(A0 / x)}, perimeter ${nf(2 * x + 2 * A0 / x)} m`),
          qName: 'P', xName: 'x',
        });
        break;
      }
      case 'openBox': {
        const L = p.L, xs = L / 6, w = L - 2 * xs, qs = 2 * L * L * L / 27;
        Object.assign(o, {
          unit: 'cm³', Q: (x) => x * (L - 2 * x) * (L - 2 * x), Qp: (x) => (L - 2 * x) * (L - 6 * x), xs, qs, lo: 0, hi: L / 2, vlo: -0.04 * L, vhi: L / 2 + 0.04 * L,
          openEnds: [{ x: 0, y: 0 }, { x: L / 2, y: 0 }],
          stmt: Tx(`${L} cm kenarlı kare bir levhanın dört köşesinden eşit x kenarlı kareler kesilip kenarlar yukarı katlanarak üstü açık bir kutu yapılıyor. Hacmi en büyük yapan x değerini ve bu hacmi bulun.`,
            `Equal squares of side x are cut from the four corners of a ${L} cm square sheet and the sides are folded up to make an open-top box. Find the x that maximises the volume, and that volume.`),
          def: Tx(`Kesilen karenin kenarı x (cm). Taban kenarı ${L} − 2x, yükseklik x. Amaç: hacim V = taban alanı · yükseklik (MAKSİMUM).\nKısıt: levha ${L} cm × ${L} cm (x yerel değişken, başka bir kısıt gerekmez).`,
            `Side of the cut square x (cm). Base side ${L} − 2x, height x. Objective: volume V = base area · height (MAXIMISE).\nConstraint: the sheet is ${L} cm × ${L} cm (already built into the base side).`),
          q: `V(x) = x(${L} − 2x)² = 4x³ − ${4 * L}x² + ${L * L}x`,
          dom: `0 < x < ${L / 2}`,
          dq: `V'(x) = 12x² − ${8 * L}x + ${L * L} = (${L} − 2x)(${L} − 6x)`,
          sol: Tx(`V'(x) = 0 → x = ${L / 2} ya da x = ${xs}.\nx = ${L / 2} aralığın ucudur (taban 0 olur, V = 0); aday: x = ${xs}.`, `V'(x) = 0 → x = ${L / 2} or x = ${xs}.\nx = ${L / 2} is an end of the interval (zero base, V = 0); candidate: x = ${xs}.`),
          sec: Tx(`V''(x) = 24x − ${8 * L} → V''(${xs}) = ${24 * xs} − ${8 * L} = ${24 * xs - 8 * L} < 0 → MAKSİMUM.`, `V''(x) = 24x − ${8 * L} → V''(${xs}) = ${24 * xs} − ${8 * L} = ${24 * xs - 8 * L} < 0 → MAXIMUM.`),
          ends: Tx('x → 0 ya da x → ' + L / 2 + ' için V → 0; maksimum içeridedir.', `As x → 0 or x → ${L / 2}, V → 0; the maximum is interior.`),
          ans: Tx(`x = ${xs} cm kesilmeli (kutu ${w} cm × ${w} cm × ${xs} cm); V_maks = ${xs}·${w}² = ${qs} cm³.`, `Cut x = ${xs} cm (box ${w} cm × ${w} cm × ${xs} cm); V_max = ${xs}·${w}² = ${qs} cm³.`),
          dims: (x) => Tx(`x = ${nf(x)}, taban ${nf(L - 2 * x)}×${nf(L - 2 * x)}, V = ${nf(x * (L - 2 * x) * (L - 2 * x))} cm³`, `x = ${nf(x)}, base ${nf(L - 2 * x)}×${nf(L - 2 * x)}, V = ${nf(x * (L - 2 * x) * (L - 2 * x))} cm³`),
          qName: 'V', xName: 'x',
        });
        break;
      }
      case 'canMin': {
        const k = p.k, c = 2 * k * k * k;
        Object.assign(o, {
          kind: 'min', unit: 'cm²', Q: (r) => 2 * PI * r * r + 4 * PI * k * k * k / r, Qp: (r) => 4 * PI * r - 4 * PI * k * k * k / (r * r), xs: k, qs: 6 * PI * k * k,
          lo: 0, hi: Infinity, vlo: 0.3 * k, vhi: 2.4 * k, yloK: 0.6, yhiK: 2.4,
          stmt: Tx(`Hacmi ${ph(c)} cm³ olan, kapalı silindirik bir kutunun (teneke) yüzey alanını (kullanılan metal) en küçük yapan yarıçapı ve yüksekliği bulun. En küçük yüzey alanı nedir?`,
            `A closed cylindrical can must hold ${ph(c)} cm³. Find the radius and height that minimise the surface area (metal used). What is the smallest surface area?`),
          def: Tx(`Yarıçap r (cm), yükseklik h (cm). Amaç: yüzey alanı S = 2πr² + 2πrh (MİNİMUM).\nKısıt: hacim sabit, πr²h = ${ph(c)} → h = ${c}/r².`,
            `Radius r (cm), height h (cm). Objective: surface area S = 2πr² + 2πrh (MINIMISE).\nConstraint: fixed volume, πr²h = ${ph(c)} → h = ${c}/r².`),
          q: `S(r) = 2πr² + 2πr·(${c}/r²) = 2πr² + ${2 * c}π/r`,
          dom: 'r > 0',
          dq: `S'(r) = 4πr − ${2 * c}π/r²`,
          sol: Tx(`S'(r) = 0 → 4πr = ${2 * c}π/r² → r³ = ${c / 2} = ${k}³ → r = ${k}\nh = ${c}/${k * k} = ${2 * k} = 2r.`, `S'(r) = 0 → 4πr = ${2 * c}π/r² → r³ = ${c / 2} = ${k}³ → r = ${k}\nh = ${c}/${k * k} = ${2 * k} = 2r.`),
          sec: Tx(`S''(r) = 4π + ${4 * c}π/r³ → S''(${k}) = 4π + ${4 * c}π/${k * k * k} = 12π > 0 → MİNİMUM.`, `S''(r) = 4π + ${4 * c}π/r³ → S''(${k}) = 4π + ${4 * c}π/${k * k * k} = 12π > 0 → MINIMUM.`),
          ends: Tx('r → 0⁺ ya da r → ∞ için S → ∞ olduğundan en küçük değer içeridedir.', 'As r → 0⁺ or r → ∞, S → ∞, so the smallest value is interior.'),
          ans: Tx(`r = ${k} cm, h = ${2 * k} cm (h = 2r: yüksekliği çapa eşit); S_min = 2π·${k * k} + ${2 * c}π/${k} = ${ph(6 * k * k)} ≈ ${nf(6 * PI * k * k)} cm².`,
            `r = ${k} cm, h = ${2 * k} cm (h = 2r: height equals the diameter); S_min = 2π·${k * k} + ${2 * c}π/${k} = ${ph(6 * k * k)} ≈ ${nf(6 * PI * k * k)} cm².`),
          dims: (r) => Tx(`r = ${nf(r)}, h = ${nf(c / (r * r))}, S = ${nf(2 * PI * r * r + 4 * PI * k * k * k / r)} cm²`, `r = ${nf(r)}, h = ${nf(c / (r * r))}, S = ${nf(2 * PI * r * r + 4 * PI * k * k * k / r)} cm²`),
          qName: 'S', xName: 'r',
        });
        break;
      }
      case 'openBoxSurf': {
        const m = p.m, V0 = 4 * m * m * m, xs = 2 * m;
        Object.assign(o, {
          kind: 'min', unit: 'cm²', Q: (x) => x * x + 4 * V0 / x, Qp: (x) => 2 * x - 4 * V0 / (x * x), xs, qs: 12 * m * m, lo: 0, hi: Infinity, vlo: 0.4 * xs, vhi: 2.4 * xs, yloK: 0.4, yhiK: 2.2,
          stmt: Tx(`Kare tabanlı, üstü açık bir kutunun hacmi ${V0} cm³ olacaktır. Kullanılan malzemeyi (yüzey alanını) en az yapan taban kenarını ve yüksekliği bulun.`,
            `A square-based open-top box must have a volume of ${V0} cm³. Find the base side and height that use the least material (surface area).`),
          def: Tx(`Taban kenarı x (cm), yükseklik h (cm). Amaç: yüzey alanı S = x² (taban) + 4xh (yan yüzler) (MİNİMUM).\nKısıt: hacim sabit, x²h = ${V0} → h = ${V0}/x².`,
            `Base side x (cm), height h (cm). Objective: surface area S = x² (base) + 4xh (sides) (MINIMISE).\nConstraint: fixed volume, x²h = ${V0} → h = ${V0}/x².`),
          q: `S(x) = x² + 4x·(${V0}/x²) = x² + ${4 * V0}/x`,
          dom: 'x > 0',
          dq: `S'(x) = 2x − ${4 * V0}/x²`,
          sol: Tx(`S'(x) = 0 → 2x³ = ${4 * V0} → x³ = ${2 * V0} = ${xs}³ → x = ${xs}\nh = ${V0}/${xs * xs} = ${m}.`, `S'(x) = 0 → 2x³ = ${4 * V0} → x³ = ${2 * V0} = ${xs}³ → x = ${xs}\nh = ${V0}/${xs * xs} = ${m}.`),
          sec: Tx(`S''(x) = 2 + ${8 * V0}/x³ → S''(${xs}) = 2 + ${8 * V0}/${xs * xs * xs} = 6 > 0 → MİNİMUM.`, `S''(x) = 2 + ${8 * V0}/x³ → S''(${xs}) = 2 + ${8 * V0}/${xs * xs * xs} = 6 > 0 → MINIMUM.`),
          ends: Tx('x → 0⁺ ya da x → ∞ için S → ∞; en küçük değer içeridedir.', 'As x → 0⁺ or x → ∞, S → ∞; the smallest value is interior.'),
          ans: Tx(`Taban kenarı ${xs} cm, yükseklik ${m} cm (h = x/2); S_min = ${xs * xs} + ${4 * V0}/${xs} = ${12 * m * m} cm².`, `Base side ${xs} cm, height ${m} cm (h = x/2); S_min = ${xs * xs} + ${4 * V0}/${xs} = ${12 * m * m} cm².`),
          dims: (x) => Tx(`taban ${nf(x)}, yükseklik ${nf(V0 / (x * x))}, S = ${nf(x * x + 4 * V0 / x)} cm²`, `base ${nf(x)}, height ${nf(V0 / (x * x))}, S = ${nf(x * x + 4 * V0 / x)} cm²`),
          qName: 'S', xName: 'x',
        });
        break;
      }
      case 'distParab': {
        const q = p.q, b = fr(2 * q * q + 1, 2), q2 = q * q, bq = frS(b);
        const c0 = fr(4 * q2 * q2 + 4 * q2 + 1, 4); // b^2
        const dmin = fr(4 * q2 + 1, 4);
        Object.assign(o, {
          kind: 'min', unit: '', Q: (x) => x * x + (x * x - (q2 + 0.5)) * (x * x - (q2 + 0.5)), Qp: (x) => 4 * x * x * x - 4 * q2 * x, xs: q, qs: q2 + 0.25, lo: -Infinity, hi: Infinity, vlo: -q - 1, vhi: q + 1,
          yloK: 0, yhiK: 1, yhiAbs: c0.n / c0.d * 1.1,
          stmt: Tx(`y = x² parabolü üzerinde, (0, ${bq}) noktasına en yakın noktaları bulun. En kısa uzaklık nedir?`,
            `On the parabola y = x², find the points nearest to (0, ${bq}). What is the shortest distance?`),
          def: Tx(`Parabol üzerinde bir nokta (x, x²). Amaç: (0, ${bq}) noktasına uzaklık d (MİNİMUM).\nKısıt: nokta parabolun üzerinde (y = x²). Karekök yerine d² = D'yi en küçük yapmak aynı noktayı verir ve türevi kolaylaştırır.`,
            `A point on the parabola is (x, x²). Objective: distance d to (0, ${bq}) (MINIMISE).\nConstraint: the point lies on the parabola (y = x²). Minimising d² = D gives the same point and is easier to differentiate.`),
          q: `D(x) = (x − 0)² + (x² − ${bq})² = x⁴ − ${2 * q2}x² + ${frS(c0)}`,
          dom: Tx('x ∈ ℝ (her gerçel x)', 'x ∈ ℝ (any real x)'),
          dq: `D'(x) = 4x³ − ${4 * q2}x = 4x(x² − ${q2})`,
          sol: Tx(`D'(x) = 0 → x = 0 ya da x = ±${q}.\nBu üç aday kontrol edilecek.`, `D'(x) = 0 → x = 0 or x = ±${q}.\nThese three candidates must be checked.`),
          sec: Tx(`D''(x) = 12x² − ${4 * q2}\nD''(0) = −${4 * q2} < 0 → x = 0 yerel MAKSİMUM (en uzak değil, sadece tepe).\nD''(±${q}) = ${8 * q2} > 0 → x = ±${q} MİNİMUM.`,
            `D''(x) = 12x² − ${4 * q2}\nD''(0) = −${4 * q2} < 0 → x = 0 is a local MAXIMUM (a hump, not the nearest point).\nD''(±${q}) = ${8 * q2} > 0 → x = ±${q} are MINIMA.`),
          ends: Tx('|x| → ∞ için D → ∞ olduğundan yerel minimumlar mutlak minimumdur.', 'As |x| → ∞, D → ∞, so the local minima are absolute minima.'),
          ans: Tx(`En yakın noktalar (±${q}, ${q2}); D_min = ${frS(dmin)} → d_min = √${4 * q2 + 1}/2 ≈ ${nf(Math.sqrt(4 * q2 + 1) / 2)}.`,
            `Nearest points (±${q}, ${q2}); D_min = ${frS(dmin)} → d_min = √${4 * q2 + 1}/2 ≈ ${nf(Math.sqrt(4 * q2 + 1) / 2)}.`),
          dims: (x) => Tx(`nokta (${nf(x)}, ${nf(x * x)}), d² = ${nf(x * x + (x * x - q2 - 0.5) * (x * x - q2 - 0.5))}`, `point (${nf(x)}, ${nf(x * x)}), d² = ${nf(x * x + (x * x - q2 - 0.5) * (x * x - q2 - 0.5))}`),
          qName: 'D', xName: 'x', twin: -q,
        });
        break;
      }
      case 'distRoot': {
        const x0 = p.x0, a = fr(2 * x0 + 1, 2), as = frS(a), d2 = fr(4 * x0 + 1, 4);
        const root = Math.sqrt(4 * x0 + 1) / 2, rsq = Math.round(Math.sqrt(4 * x0 + 1)), isSq = rsq * rsq === 4 * x0 + 1;
        const dS = isSq ? F(rsq, 2) : `√${4 * x0 + 1}/2`;
        Object.assign(o, {
          kind: 'min', unit: '', Q: (x) => (x - x0 - 0.5) * (x - x0 - 0.5) + x, Qp: (x) => 2 * x - 2 * x0, xs: x0, qs: x0 + 0.25, lo: 0, hi: Infinity, vlo: -0.3, vhi: 2 * x0 + 1.3,
          closedEnds: [{ x: 0, y: (x0 + 0.5) * (x0 + 0.5) }], yloK: 0, yhiK: 3.2,
          stmt: Tx(`y = √x eğrisi üzerinde (${as}, 0) noktasına en yakın noktayı bulun. En kısa uzaklık nedir?`, `On the curve y = √x, find the point nearest to (${as}, 0). What is the shortest distance?`),
          def: Tx(`Eğri üzerinde bir nokta (x, √x), x ≥ 0. Amaç: (${as}, 0) noktasına uzaklık d (MİNİMUM); d² = D'yi en küçük yapmak yeterlidir.\nKısıt: nokta eğrinin üzerinde, y² = x.`,
            `A point on the curve is (x, √x), x ≥ 0. Objective: distance d to (${as}, 0) (MINIMISE); minimising d² = D is enough.\nConstraint: the point lies on the curve, y² = x.`),
          q: `D(x) = (x − ${as})² + (√x)² = (x − ${as})² + x = x² − ${2 * x0}x + ${frS(fr((2 * x0 + 1) * (2 * x0 + 1), 4))}`,
          dom: 'x ≥ 0',
          dq: `D'(x) = 2(x − ${as}) + 1 = 2x − ${2 * x0}`,
          sol: Tx(`D'(x) = 0 → 2x = ${2 * x0} → x = ${x0}\nNokta: (${x0}, √${x0}).`, `D'(x) = 0 → 2x = ${2 * x0} → x = ${x0}\nPoint: (${x0}, √${x0}).`),
          sec: Tx(`D''(x) = 2 > 0 → x = ${x0} MİNİMUM.`, `D''(x) = 2 > 0 → x = ${x0} is a MINIMUM.`),
          ends: Tx(`Kapalı uç x = 0: D(0) = ${frS(fr((2 * x0 + 1) * (2 * x0 + 1), 4))} > D(${x0}) = ${frS(d2)}; ayrıca x → ∞ için D → ∞. En küçük değer x = ${x0}'dadır.`,
            `Closed end x = 0: D(0) = ${frS(fr((2 * x0 + 1) * (2 * x0 + 1), 4))} > D(${x0}) = ${frS(d2)}; also D → ∞ as x → ∞. The smallest value is at x = ${x0}.`),
          ans: Tx(`En yakın nokta (${x0}, √${x0}); D_min = (−1/2)² + ${x0} = ${frS(d2)} → d_min = ${dS}${isSq ? '' : ' ≈ ' + nf(root)}.`,
            `Nearest point (${x0}, √${x0}); D_min = (−1/2)² + ${x0} = ${frS(d2)} → d_min = ${dS}${isSq ? '' : ' ≈ ' + nf(root)}.`),
          dims: (x) => Tx(`nokta (${nf(x)}, ${nf(Math.sqrt(Math.max(0, x)))}), d² = ${nf((x - x0 - 0.5) * (x - x0 - 0.5) + x)}`, `point (${nf(x)}, ${nf(Math.sqrt(Math.max(0, x)))}), d² = ${nf((x - x0 - 0.5) * (x - x0 - 0.5) + x)}`),
          qName: 'D', xName: 'x',
        });
        break;
      }
      case 'xxy': {
        const Sm = p.S, xs = 2 * Sm / 3, qs = 4 * Sm * Sm * Sm / 27;
        Object.assign(o, {
          unit: '', Q: (x) => x * x * (Sm - x), Qp: (x) => 2 * Sm * x - 3 * x * x, xs, qs, lo: 0, hi: Sm, vlo: -0.06 * Sm, vhi: 1.06 * Sm,
          openEnds: [{ x: 0, y: 0 }, { x: Sm, y: 0 }],
          stmt: Tx(`Toplamları ${Sm} olan iki pozitif sayıdan, birincisinin karesi ile ikincisinin çarpımı en büyük olsun. Bu iki sayıyı ve en büyük çarpımı bulun.`,
            `Two positive numbers have sum ${Sm}. Make the product of the square of the first and the second as large as possible. Find the numbers and the largest product.`),
          def: Tx(`Sayılar x ve y (pozitif). Amaç: Q = x²·y (MAKSİMUM).\nKısıt: x + y = ${Sm}.`, `The numbers are x and y (positive). Objective: Q = x²·y (MAXIMISE).\nConstraint: x + y = ${Sm}.`),
          q: `y = ${Sm} − x  →  Q(x) = x²(${Sm} − x) = ${Sm}x² − x³`,
          dom: `0 < x < ${Sm}`,
          dq: `Q'(x) = ${2 * Sm}x − 3x² = x(${2 * Sm} − 3x)`,
          sol: Tx(`Q'(x) = 0 → x = 0 (aralık dışı) ya da x = ${2 * Sm}/3 = ${xs}\ny = ${Sm} − ${xs} = ${Sm / 3}.`, `Q'(x) = 0 → x = 0 (outside the interval) or x = ${2 * Sm}/3 = ${xs}\ny = ${Sm} − ${xs} = ${Sm / 3}.`),
          sec: Tx(`Q''(x) = ${2 * Sm} − 6x → Q''(${xs}) = ${2 * Sm} − ${6 * xs} = −${2 * Sm} < 0 → MAKSİMUM.`, `Q''(x) = ${2 * Sm} − 6x → Q''(${xs}) = ${2 * Sm} − ${6 * xs} = −${2 * Sm} < 0 → MAXIMUM.`),
          ends: Tx(`x → 0⁺ ve x → ${Sm}⁻ için Q → 0; maksimum içeridedir.`, `As x → 0⁺ and x → ${Sm}⁻, Q → 0; the maximum is interior.`),
          ans: Tx(`x = ${xs}, y = ${Sm / 3}; en büyük çarpım Q = ${xs}²·${Sm / 3} = ${qs}.`, `x = ${xs}, y = ${Sm / 3}; largest product Q = ${xs}²·${Sm / 3} = ${qs}.`),
          dims: (x) => Tx(`x = ${nf(x)}, y = ${nf(Sm - x)}, Q = ${nf(x * x * (Sm - x))}`, `x = ${nf(x)}, y = ${nf(Sm - x)}, Q = ${nf(x * x * (Sm - x))}`),
          qName: 'Q', xName: 'x',
        });
        break;
      }
      case 'pen': {
        const { c1, c2, x0, A } = p, y0 = fr(c1 * x0, c2);
        const Cs = 4 * c1 * x0;
        Object.assign(o, {
          kind: 'min', unit: 'TL', Q: (x) => 2 * c1 * x + 2 * c2 * A / x, Qp: (x) => 2 * c1 - 2 * c2 * A / (x * x), xs: x0, qs: Cs, lo: 0, hi: Infinity, vlo: 0.3 * x0, vhi: 2.6 * x0, yloK: 0.5, yhiK: 2.2,
          stmt: Tx(`Alanı ${A} m² olan dikdörtgen bir alan çitle çevrilecek. Uzunluğu x olan iki kenarın çiti ${c1} TL/m, diğer iki kenarın çiti ${c2} TL/m'dir. Toplam maliyeti en küçük yapan boyutları ve bu maliyeti bulun.`,
            `A rectangular area of ${A} m² is to be fenced. The two sides of length x cost ${c1} TL/m, the other two sides cost ${c2} TL/m. Find the dimensions that minimise the total cost, and that cost.`),
          def: Tx(`Kenarlar x (m) ve y (m). Amaç: maliyet C = ${c1}·2x + ${c2}·2y (MİNİMUM).\nKısıt: alan sabit, x·y = ${A}.`, `Sides x (m) and y (m). Objective: cost C = ${c1}·2x + ${c2}·2y (MINIMISE).\nConstraint: fixed area, x·y = ${A}.`),
          q: `y = ${A}/x  →  C(x) = ${2 * c1}x + ${2 * c2 * A}/x`,
          dom: 'x > 0',
          dq: `C'(x) = ${2 * c1} − ${2 * c2 * A}/x²`,
          sol: Tx(`C'(x) = 0 → x² = ${2 * c2 * A}/${2 * c1} = ${F(c2 * A, c1)} → x = ${x0} (x > 0)\ny = ${A}/${x0} = ${frS(y0)}.`, `C'(x) = 0 → x² = ${2 * c2 * A}/${2 * c1} = ${F(c2 * A, c1)} → x = ${x0} (x > 0)\ny = ${A}/${x0} = ${frS(y0)}.`),
          sec: Tx(`C''(x) = ${4 * c2 * A}/x³ > 0 (x > 0) → C''(${x0}) = ${F(4 * c2 * A, x0 * x0 * x0)} > 0 → MİNİMUM.`, `C''(x) = ${4 * c2 * A}/x³ > 0 (x > 0) → C''(${x0}) = ${F(4 * c2 * A, x0 * x0 * x0)} > 0 → MINIMUM.`),
          ends: Tx('x → 0⁺ ya da x → ∞ için C → ∞; en küçük maliyet içeridedir.', 'As x → 0⁺ or x → ∞, C → ∞; the lowest cost is interior.'),
          ans: Tx(`x = ${x0} m, y = ${frS(y0)} m; C_min = ${2 * c1}·${x0} + ${2 * c2 * A}/${x0} = ${Cs} TL.`, `x = ${x0} m, y = ${frS(y0)} m; C_min = ${2 * c1}·${x0} + ${2 * c2 * A}/${x0} = ${Cs} TL.`),
          dims: (x) => Tx(`x = ${nf(x)}, y = ${nf(A / x)}, maliyet ${nf(2 * c1 * x + 2 * c2 * A / x)} TL`, `x = ${nf(x)}, y = ${nf(A / x)}, cost ${nf(2 * c1 * x + 2 * c2 * A / x)} TL`),
          qName: 'C', xName: 'x',
        });
        break;
      }
      case 'path': {
        const { a, xs, v1, v2, ex } = p, d = xs + ex, r = Math.round(Math.sqrt(xs * xs + a * a));
        const T = fr(r * v2 + (d - xs) * v1, v1 * v2); // r/v1 + (d-xs)/v2
        const T0 = a / v1 + d / v2, Td = Math.sqrt(d * d + a * a) / v1;
        Object.assign(o, {
          kind: 'min', unit: 'h', Q: (x) => Math.sqrt(x * x + a * a) / v1 + (d - x) / v2, Qp: (x) => x / (v1 * Math.sqrt(x * x + a * a)) - 1 / v2, xs, qs: T.n / T.d, lo: 0, hi: d, vlo: -0.04 * d, vhi: 1.04 * d,
          closedEnds: [{ x: 0, y: T0 }, { x: d, y: Td }], yloK: 0.5, yhiK: 1.6,
          stmt: Tx(`Bir botçu kıyıdan ${a} km açıkta, kıyıdaki en yakın P noktasına dik uzaklıkta. Kıyı boyunca P'den ${d} km ötedeki Q noktasına gidecek: önce kıyıdaki bir noktaya kürek çekecek (${v1} km/sa), sonra Q'ya yürüyecek (${v2} km/sa). Toplam süreyi en küçük yapan çıkış noktasının P'ye uzaklığını (x) ve bu süreyi bulun.`,
            `A rower is ${a} km offshore, directly opposite the nearest shore point P. He must reach point Q, ${d} km along the shore from P: first row to some shore point (${v1} km/h), then walk to Q (${v2} km/h). Find the landing distance x from P that minimises the total time, and that time.`),
          def: Tx(`Çıkış noktası P'den x km uzakta (0 ≤ x ≤ ${d}). Kürek yolu √(x² + ${a * a}) km, yürüme yolu ${d} − x km. Amaç: süre T = kürek/${v1} + yürüme/${v2} (MİNİMUM).\nKısıt: kıyı doğrusal, Q sabit (${d} km).`,
            `The landing point is x km from P (0 ≤ x ≤ ${d}). Rowing path √(x² + ${a * a}) km, walking path ${d} − x km. Objective: time T = rowing/${v1} + walking/${v2} (MINIMISE).\nConstraint: straight shore, Q fixed (${d} km).`),
          q: `T(x) = √(x² + ${a * a}) / ${v1} + (${d} − x) / ${v2},   0 ≤ x ≤ ${d}`,
          dom: `0 ≤ x ≤ ${d}  (${Tx('kapalı aralık', 'closed interval')})`,
          dq: `T'(x) = x / (${v1}·√(x² + ${a * a})) − 1/${v2}`,
          sol: Tx(`T'(x) = 0 → ${v2}x = ${v1}·√(x² + ${a * a}) → her iki yanın karesi: ${v2 * v2}x² = ${v1 * v1}(x² + ${a * a})\n→ ${v2 * v2 - v1 * v1}x² = ${v1 * v1 * a * a} → x² = ${xs * xs} → x = ${xs} (x ≥ 0)\nKarekök: √(${xs * xs} + ${a * a}) = ${r}.`,
            `T'(x) = 0 → ${v2}x = ${v1}·√(x² + ${a * a}) → square both sides: ${v2 * v2}x² = ${v1 * v1}(x² + ${a * a})\n→ ${v2 * v2 - v1 * v1}x² = ${v1 * v1 * a * a} → x² = ${xs * xs} → x = ${xs} (x ≥ 0)\nSquare root: √(${xs * xs} + ${a * a}) = ${r}.`),
          sec: Tx(`T''(x) = ${a * a} / (${v1}·(x² + ${a * a})^(3/2)) > 0 her x için → T dışbükey (yukarı bükey) → x = ${xs} MİNİMUM.\n(T''(${xs}) = ${a * a}/(${v1}·${r * r * r}) = ${F(a * a, v1 * r * r * r)}.)`,
            `T''(x) = ${a * a} / (${v1}·(x² + ${a * a})^(3/2)) > 0 for all x → T is concave up → MINIMUM at x = ${xs}.\n(T''(${xs}) = ${a * a}/(${v1}·${r * r * r}) = ${F(a * a, v1 * r * r * r)}.)`),
          ends: Tx(`Kapalı aralık olduğundan uçlar karşılaştırılır:\nT(0) = ${a}/${v1} + ${d}/${v2} = ${nf(T0)} sa (doğrudan kürek+yürü)\nT(${d}) = √(${d * d + a * a})/${v1} ≈ ${nf(Td)} sa (Q'ya doğrudan kürek)\nT(${xs}) = ${r}/${v1} + ${ex}/${v2} = ${frS(T)} sa = ${nf(T.n / T.d)} sa → en küçük.`,
            `On a closed interval compare the ends:\nT(0) = ${a}/${v1} + ${d}/${v2} = ${nf(T0)} h (row straight in, then walk)\nT(${d}) = √(${d * d + a * a})/${v1} ≈ ${nf(Td)} h (row straight to Q)\nT(${xs}) = ${r}/${v1} + ${ex}/${v2} = ${frS(T)} h = ${nf(T.n / T.d)} h → the smallest.`),
          ans: Tx(`P'den ${xs} km ötedeki noktaya çıkılmalı; en kısa süre T = ${frS(T)} sa ≈ ${nf(T.n / T.d)} sa.`, `Land ${xs} km from P; the shortest time is T = ${frS(T)} h ≈ ${nf(T.n / T.d)} h.`),
          dims: (x) => Tx(`x = ${nf(x)} km, T = ${nf(Math.sqrt(x * x + a * a) / v1 + (d - x) / v2)} sa`, `x = ${nf(x)} km, T = ${nf(Math.sqrt(x * x + a * a) / v1 + (d - x) / v2)} h`),
          qName: 'T', xName: 'x',
        });
        break;
      }
      case 'inscribed': {
        const m = p.m, k = 3 * m * m, qs = 4 * m * m * m, hi = Math.sqrt(k);
        Object.assign(o, {
          unit: 'br²', Q: (x) => 2 * x * (k - x * x), Qp: (x) => 2 * k - 6 * x * x, xs: m, qs, lo: 0, hi, vlo: -0.3, vhi: hi + 0.3,
          openEnds: [{ x: 0, y: 0 }, { x: hi, y: 0 }],
          stmt: Tx(`y = ${k} − x² parabolü ile x ekseni arasına, tabanı x ekseni üzerinde ve üst köşeleri parabol üzerinde olan bir dikdörtgen yerleştiriliyor. Alanı en büyük yapan boyutları ve bu alanı bulun.`,
            `A rectangle with its base on the x-axis and its upper corners on the parabola y = ${k} − x² is placed under the parabola. Find the dimensions that maximise its area, and that area.`),
          def: Tx(`Sağ üst köşe (x, ${k} − x²), x > 0; genişlik 2x, yükseklik ${k} − x². Amaç: alan A = 2x·(${k} − x²) (MAKSİMUM).\nKısıt: köşeler parabol üzerinde (zaten yüksekliği belirledi).`,
            `Upper right corner (x, ${k} − x²), x > 0; width 2x, height ${k} − x². Objective: area A = 2x·(${k} − x²) (MAXIMISE).\nConstraint: the corners lie on the parabola (this already fixes the height).`),
          q: `A(x) = 2x(${k} − x²) = ${2 * k}x − 2x³`,
          dom: `0 < x < √${k}`,
          dq: `A'(x) = ${2 * k} − 6x²`,
          sol: Tx(`A'(x) = 0 → 6x² = ${2 * k} → x² = ${k / 3} → x = ${m} (x > 0)\nYükseklik ${k} − ${m * m} = ${k - m * m}.`, `A'(x) = 0 → 6x² = ${2 * k} → x² = ${k / 3} → x = ${m} (x > 0)\nHeight ${k} − ${m * m} = ${k - m * m}.`),
          sec: Tx(`A''(x) = −12x → A''(${m}) = −${12 * m} < 0 → MAKSİMUM.`, `A''(x) = −12x → A''(${m}) = −${12 * m} < 0 → MAXIMUM.`),
          ends: Tx(`x → 0 ya da x → √${k} için A → 0; maksimum içeridedir.`, `As x → 0 or x → √${k}, A → 0; the maximum is interior.`),
          ans: Tx(`x = ${m}: genişlik 2x = ${2 * m}, yükseklik ${k - m * m}; en büyük alan A = ${2 * m}·${k - m * m} = ${qs} birim².`, `x = ${m}: width 2x = ${2 * m}, height ${k - m * m}; largest area A = ${2 * m}·${k - m * m} = ${qs} square units.`),
          dims: (x) => Tx(`genişlik ${nf(2 * x)}, yükseklik ${nf(k - x * x)}, alan ${nf(2 * x * (k - x * x))}`, `width ${nf(2 * x)}, height ${nf(k - x * x)}, area ${nf(2 * x * (k - x * x))}`),
          qName: 'A', xName: 'x',
        });
        break;
      }
      default: { // beam
        const k = p.k, hi = k * Math.sqrt(3), qs = 2 * k * k * k, K2 = 3 * k * k;
        Object.assign(o, {
          unit: 'cm³', Q: (w) => w * (K2 - w * w), Qp: (w) => K2 - 3 * w * w, xs: k, qs, lo: 0, hi, vlo: -0.3, vhi: hi + 0.3,
          openEnds: [{ x: 0, y: 0 }, { x: hi, y: 0 }],
          stmt: Tx(`Çapı ${k}√3 cm olan dairesel bir kütükten dikdörtgen kesitli bir kiriş kesilecek. Kirişin dayanımı w·d² ile orantılıdır (w genişlik, d derinlik). Dayanımı en büyük yapan w ve d değerlerini bulun.`,
            `A rectangular beam is cut from a circular log of diameter ${k}√3 cm. The strength is proportional to w·d² (w width, d depth). Find the w and d that give the greatest strength.`),
          def: Tx(`Genişlik w, derinlik d (cm). Amaç: dayanım S = w·d² (MAKSİMUM).\nKısıt: dikdörtgenin köşegeni çaptır: w² + d² = (${k}√3)² = ${K2} → d² = ${K2} − w².`,
            `Width w, depth d (cm). Objective: strength S = w·d² (MAXIMISE).\nConstraint: the diagonal of the rectangle is the diameter: w² + d² = (${k}√3)² = ${K2} → d² = ${K2} − w².`),
          q: `S(w) = w(${K2} − w²) = ${K2}w − w³`,
          dom: `0 < w < ${k}√3`,
          dq: `S'(w) = ${K2} − 3w²`,
          sol: Tx(`S'(w) = 0 → 3w² = ${K2} → w² = ${k * k} → w = ${k} (w > 0)\nd² = ${K2} − ${k * k} = ${2 * k * k} → d = ${k}√2 ≈ ${nf(k * Math.SQRT2)}.`, `S'(w) = 0 → 3w² = ${K2} → w² = ${k * k} → w = ${k} (w > 0)\nd² = ${K2} − ${k * k} = ${2 * k * k} → d = ${k}√2 ≈ ${nf(k * Math.SQRT2)}.`),
          sec: Tx(`S''(w) = −6w → S''(${k}) = −${6 * k} < 0 → MAKSİMUM.`, `S''(w) = −6w → S''(${k}) = −${6 * k} < 0 → MAXIMUM.`),
          ends: Tx(`w → 0 ya da w → ${k}√3 (d → 0) için S → 0; maksimum içeridedir.`, `As w → 0 or w → ${k}√3 (d → 0), S → 0; the maximum is interior.`),
          ans: Tx(`w = ${k} cm, d = ${k}√2 ≈ ${nf(k * Math.SQRT2)} cm (d/w = √2); S_maks = ${k}·${2 * k * k} = ${qs} cm³ (orantı birimi).`, `w = ${k} cm, d = ${k}√2 ≈ ${nf(k * Math.SQRT2)} cm (d/w = √2); S_max = ${k}·${2 * k * k} = ${qs} cm³ (proportionality units).`),
          dims: (w) => Tx(`w = ${nf(w)}, d = ${nf(Math.sqrt(Math.max(0, K2 - w * w)))}, S = ${nf(w * (K2 - w * w))}`, `w = ${nf(w)}, d = ${nf(Math.sqrt(Math.max(0, K2 - w * w)))}, S = ${nf(w * (K2 - w * w))}`),
          qName: 'S', xName: 'w',
        });
      }
    }
    return o;
  }

  // ---------- generation ----------
  function createProblem(rng, kindArg) {
    const kinds = ['fence', 'river', 'minPerim', 'openBox', 'canMin', 'openBoxSurf', 'distParab', 'distRoot', 'xxy', 'pen', 'path', 'inscribed', 'beam'];
    const kind = kindArg || rng.pick(kinds);
    const p = { kind, t: 35, showD: false };
    switch (kind) {
      case 'fence': p.s = rng.pick([10, 12, 16, 20, 30]); break;
      case 'river': p.L = rng.pick([40, 60, 80, 100, 120]); break;
      case 'minPerim': p.k = rng.pick([3, 4, 5, 6, 8]); break;
      case 'openBox': p.L = rng.pick([12, 18, 24, 30]); break;
      case 'canMin': p.k = rng.pick([2, 3, 4, 5]); break;
      case 'openBoxSurf': p.m = rng.pick([1, 2, 3, 4]); break;
      case 'distParab': p.q = rng.pick([1, 2, 3]); break;
      case 'distRoot': p.x0 = rng.pick([2, 3, 4, 6]); break;
      case 'xxy': p.S = rng.pick([9, 12, 15, 18, 21]); break;
      case 'pen': {
        for (;;) {
          const pr = rng.pick([[20, 10], [10, 20], [30, 10], [15, 15], [10, 10], [40, 20]]);
          const x0 = rng.nextInt(2, 7);
          const A = pr[0] * x0 * x0;
          if (A % pr[1] === 0) { p.c1 = pr[0]; p.c2 = pr[1]; p.x0 = x0; p.A = A / pr[1]; break; }
        }
        break;
      }
      case 'path': {
        const base = rng.pick([{ a: 3, xs: 4, v1: 4, v2: 5 }, { a: 4, xs: 3, v1: 3, v2: 5 }]);
        const k = rng.pick([1, 1, 2]);
        p.a = base.a * k; p.xs = base.xs * k; p.v1 = base.v1; p.v2 = base.v2; p.ex = rng.pick([3, 4, 5]) * k;
        break;
      }
      case 'inscribed': p.m = rng.pick([1, 2, 3]); break;
      default: p.k = rng.pick([3, 4, 6]);
    }
    p.t = rng.pick([15, 30, 70, 85]);
    return p;
  }

  // ---------- text ----------
  function problemStatement(p) { return spec(p).stmt; }

  function concept() {
    return Tx(
      'TÜREV İLE OPTİMİZASYON\n' +
      '\n' +
      'OPTİMİZASYON NEDİR?\n' +
      'Bir niceliği (alan, hacim, maliyet, süre, mesafe) belirli koşullar altında en büyük ya da en küçük yapan değeri bulmak. Türev, eğimin sıfır olduğu zirve ve vadileri yakalar.\n' +
      '\n' +
      '5 ADIMLI TARİF\n' +
      '1. ÇİZ ve TANIMLA: Şekil çiz, değişkenleri adlandır, neyi optimize ettiğini ("amaç fonksiyonu") ve KISITLARI yaz.\n' +
      '2. TEK DEĞİŞKENE İNDİR: Kısıtı kullanarak amaç fonksiyonunu tek değişkenli yaz: Q = Q(x). Geçerli x aralığını (tanım kümesini) belirle.\n' +
      '3. TÜREV AL: Q\'(x) = 0 çöz (ve Q\' tanımsız olan noktaları not et): ADAYLAR.\n' +
      '4. DOĞRULA: İkinci türev testi (Q\'\' < 0 → max, Q\'\' > 0 → min) veya birinci türev işaret tablosu. Kapalı aralıkta UÇ NOKTALARI da karşılaştır.\n' +
      '5. CEVAPLA: Sorulan şeyi (yalnızca değişkeni değil!) birimiyle yaz, mantıklı mı kontrol et.\n' +
      '\n' +
      'KLASİK KISIT ÖRNEKLERİ\n' +
      'Çevre sabit → alan max: kare. Alan sabit → çevre min: kare. Hacim sabit → yüzey min: kapalı silindirde h = 2r, üstü açık kare tabanlı kutuda h = x/2. Yüzey sabit → hacim max. Köşeleri kesilen levhadan kutu: x = L/6. Nehir kıyısında üç kenar: nehre paralel kenar = 2 × dik kenar.\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '• Açık aralıkta (0 < x < b) uçlar hariçtir; yine de uçlarda amaç → 0 ya da → ∞ olup olmadığına bakın, böylece tek kritik nokta mutlak ekstremum olur.\n' +
      '• Kapalı aralıkta (ör. 0 ≤ x ≤ d) kritik nokta ile birlikte İKİ UÇ NOKTA karşılaştırılır.\n' +
      '• Mesafe optimizasyonunda d yerine d² kullanın: aynı nokta, kök yok, türev kolay.\n' +
      '• Birden fazla kritik nokta çıkabilir: hangisinin sorulan ekstremum olduğunu ikinci türevle ayırın.\n' +
      '\n' +
      'TUZAKLAR\n' +
      '• Kısıtı kullanmadan iki değişkenle türev almaya çalışmak.\n' +
      '• Tanım kümesini unutmak (ör. uzunluk > 0, x ≤ toplam).\n' +
      '• Uç noktalarda ekstremum olabileceğini unutmak.\n' +
      '• Mesafe yerine mesafe² optimize etmek serbesttir: aynı optimum, daha kolay türev.\n' +
      '• Cevabın birimini ve istenen büyüklüğü yazmamak (x yerine alan istenebilir).\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      '100 m çit ile dikdörtgen bir alan çevrelenecek. 2x + 2y = 100 → y = 50 − x. A(x) = x(50 − x) = 50x − x², 0 < x < 50. A\' = 50 − 2x = 0 → x = 25, A\'\' = −2 < 0 → maksimum. y = 25: 25 × 25 kare, A = 625 m².\n' +
      '\n' +
      'GRAFİK: Eğri amaç fonksiyonu Q(x)\'tir; altın elmas optimum noktadır. Kaydırıcı tasarım değişkenini aralıkta gezdirir ve boyutları gösterir; kesikli mor eğri Q\'(x) ise optimumda sıfırı kestiğini gösterir.',
      'OPTIMISATION WITH DERIVATIVES\n' +
      '\n' +
      'WHAT IS OPTIMISATION?\n' +
      'Finding the value that makes a quantity (area, volume, cost, time, distance) as large or as small as possible under given conditions. The derivative captures peaks and valleys, where the slope is zero.\n' +
      '\n' +
      'THE 5-STEP RECIPE\n' +
      '1. DRAW and DEFINE: Sketch, name the variables, state what you optimise (the "objective function") and write the CONSTRAINTS.\n' +
      '2. REDUCE TO ONE VARIABLE: Use the constraint to write the objective in one variable: Q = Q(x). Determine the valid range (domain) of x.\n' +
      '3. DIFFERENTIATE: Solve Q\'(x) = 0 (and note points where Q\' is undefined): the CANDIDATES.\n' +
      '4. VERIFY: Second derivative test (Q\'\' < 0 → max, Q\'\' > 0 → min) or a first derivative sign chart. On a closed interval also compare the ENDPOINTS.\n' +
      '5. ANSWER: State what was asked (not just the variable!) with its units and check that it makes sense.\n' +
      '\n' +
      'CLASSIC CONSTRAINTS\n' +
      'Fixed perimeter → max area: square. Fixed area → min perimeter: square. Fixed volume → min surface: closed cylinder h = 2r, open square-base box h = x/2. Fixed surface → max volume. Box from a sheet with cut corners: x = L/6. Pen on a river bank with three sides: side along the river = 2 × perpendicular side.\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '• On an open interval (0 < x < b) the ends are excluded; still check whether the objective → 0 or → ∞ there, so that the single critical point is the absolute extremum.\n' +
      '• On a closed interval (e.g. 0 ≤ x ≤ d) compare the critical point with BOTH endpoints.\n' +
      '• For distance problems use d² instead of d: same point, no root, easier derivative.\n' +
      '• Several critical points may appear: use the second derivative to tell which is the requested extremum.\n' +
      '\n' +
      'PITFALLS\n' +
      '• Differentiating with two variables without using the constraint.\n' +
      '• Forgetting the domain (e.g. length > 0, x ≤ total).\n' +
      '• Forgetting that the extremum may be at an endpoint.\n' +
      '• Optimising distance² instead of distance is allowed: same optimum, easier derivative.\n' +
      '• Not stating the unit and the quantity requested (the question may ask for the area, not x).\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      '100 m of fence encloses a rectangle. 2x + 2y = 100 → y = 50 − x. A(x) = x(50 − x) = 50x − x², 0 < x < 50. A\' = 50 − 2x = 0 → x = 25, A\'\' = −2 < 0 → maximum. y = 25: a 25 × 25 square, A = 625 m².\n' +
      '\n' +
      'GRAPH: the curve is the objective Q(x); the gold diamond is the optimum. The slider moves the design variable through the allowed range and shows the dimensions; the dashed purple curve Q\'(x) crosses zero exactly at the optimum.');
  }

  function solveSteps(p) {
    const o = spec(p), qn = o.qName, xn = o.xName;
    const st = [];
    st.push(Tx(`── 1) Çiz ve tanımla ──\n${o.def}`, `── 1) Draw and define ──\n${o.def}`));
    st.push(Tx(`── 2) Tek değişkene indir ──\n${o.q}\nGeçerli aralık: ${o.dom}`, `── 2) Reduce to one variable ──\n${o.q}\nValid range: ${o.dom}`));
    st.push(Tx(`── 3) Türev al ve adayları bul ──\n${o.dq}\n${o.sol}`, `── 3) Differentiate and find the candidates ──\n${o.dq}\n${o.sol}`));
    st.push(Tx(`── 4) Doğrula (${o.kind === 'max' ? 'maksimum' : 'minimum'} mu?) ──\n${o.sec}\n${o.ends}`, `── 4) Verify (is it a ${o.kind === 'max' ? 'maximum' : 'minimum'}?) ──\n${o.sec}\n${o.ends}`));
    st.push(Tx(`── 5) Cevapla ──\n${o.ans}\nKontrol: birim ve büyüklük mantıklı (${qn}(${xn}) grafiğinde optimum noktası altın elmasla gösterilmiştir).`,
      `── 5) Answer ──\n${o.ans}\nCheck: unit and size are sensible (the optimum is the gold diamond on the ${qn}(${xn}) graph).`));
    return st;
  }

  // ---------- drawing ----------
  function xAt(p, o) {
    const a = Math.max(isFinite(o.lo) ? o.lo : o.vlo, o.vlo), b = Math.min(isFinite(o.hi) ? o.hi : o.vhi, o.vhi);
    const eps = (b - a) * 0.01;
    return a + eps + (b - a - 2 * eps) * Math.max(0, Math.min(100, p.t)) / 100;
  }

  function draw(canvas, p) {
    try {
      const o = spec(p);
      const ylo = o.yloAbs !== undefined ? o.yloAbs : o.yloK * o.qs;
      let yhi = o.yhiAbs !== undefined ? o.yhiAbs : o.yhiK * o.qs;
      let lo = ylo, hi = yhi;
      if (p.showD) { const sp = hi - lo; lo = Math.min(lo, -0.3 * sp); hi = Math.max(hi, 0.3 * sp); }
      canvas.setViewport(o.vlo, o.vhi, lo, hi);
      const dl = isFinite(o.lo) ? o.lo : -Infinity, dh = isFinite(o.hi) ? o.hi : Infinity;
      canvas.addFunction({ evaluator: (x) => { if (x < dl - 1e-12 || x > dh + 1e-12) return NaN; const y = o.Q(x); return isFinite(y) && Math.abs(y) < 1e7 ? y : NaN; }, color: canvas.accent(), thickness: 3, label: `${o.qName}(${o.xName})` });
      if (p.showD) canvas.addFunction({ evaluator: (x) => { if (x < dl - 1e-12 || x > dh + 1e-12) return NaN; const y = o.Qp(x); return isFinite(y) && Math.abs(y) < 1e7 ? y : NaN; }, color: canvas.purple(), thickness: 2, dashed: true, label: `${o.qName}'(${o.xName})` });
      canvas.addGuideLine({ axis: 'horizontal', position: o.qs, color: canvas.green(), label: `${o.qName}* = ${nf(o.qs)}` });
      canvas.addGuideLine({ axis: 'vertical', position: o.xs, color: canvas.gray(), label: `${o.xName}* = ${nf(o.xs)}` });
      if (o.twin !== undefined) canvas.addMarker({ x: o.twin, y: o.qs, color: canvas.gold(), shape: 'diamond', radius: 8, label: '' });
      canvas.addMarker({ x: o.xs, y: o.qs, color: canvas.gold(), shape: 'diamond', radius: 9, label: (o.kind === 'max' ? Tx('maksimum', 'maximum') : Tx('minimum', 'minimum')) + ` (${nf(o.xs)}, ${nf(o.qs)})` });
      o.openEnds.forEach((e) => canvas.addMarker({ x: e.x, y: e.y, color: canvas.gray(), radius: 5, hollow: true, label: '' }));
      o.closedEnds.forEach((e) => { if (e.y <= hi) canvas.addMarker({ x: e.x, y: e.y, color: canvas.red(), radius: 5, label: Tx('uç', 'end') + ` (${nf(e.x)}, ${nf(e.y)})` }); });
      const x0 = xAt(p, o), y0 = o.Q(x0);
      if (isFinite(y0)) {
        canvas.addMarker({ x: x0, y: Math.min(y0, hi), color: canvas.orange(), radius: 6, label: o.dims(x0) });
        canvas.addSegment({ x1: x0, y1: Math.min(lo, 0), x2: x0, y2: Math.min(y0, hi), color: canvas.orange(), thickness: 1.2, dashed: true });
        if (p.showD && isFinite(o.Qp(x0))) canvas.addMarker({ x: x0, y: o.Qp(x0), color: canvas.purple(), radius: 5, label: '' });
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: Tx('Tasarım değişkeninin konumu (izin verilen aralığın %\'si)', 'Design variable position (% of the allowed range)'),
      min: 0, max: 100, step: 1,
      get: () => getProblem().t,
      set: (v) => { getProblem().t = Math.max(0, Math.min(100, Math.round(v))); },
    });
    h.addCheckbox({
      caption: Tx('Türev grafiğini göster (mor, kesikli)', 'Show the derivative graph (purple, dashed)'),
      get: () => getProblem().showD,
      set: (v) => { getProblem().showD = !!v; },
    });
  }

  Topics.register('applications', {
    id: 'optimization',
    tabTitle: () => Tx('Türev ile Optimizasyon', 'Optimisation with Derivatives'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*1\. (ÇİZ ve TANIMLA|DRAW and DEFINE):/, make: (rng) => createProblem(rng, 'pen') },
      { match: /^\s*2\. (TEK DEĞİŞKENE İNDİR|REDUCE TO ONE VARIABLE):/, make: (rng) => createProblem(rng, 'river') },
      { match: /^\s*3\. (TÜREV AL|DIFFERENTIATE):/, make: (rng) => createProblem(rng, 'xxy') },
      { match: /^\s*4\. (DOĞRULA|VERIFY):/, make: (rng) => createProblem(rng, 'canMin') },
      { match: /^\s*(Çevre sabit|Fixed perimeter)/, make: (rng) => createProblem(rng, 'fence') },
      { match: /^\s*• (Açık aralıkta|On an open interval)/, make: (rng) => createProblem(rng, 'minPerim') },
      { match: /^\s*• (Kapalı aralıkta|On a closed interval)/, make: (rng) => createProblem(rng, 'path') },
      { match: /^\s*• (Mesafe optimizasyonunda|For distance problems)/, make: (rng) => createProblem(rng, 'distParab') },
      { match: /^\s*• (Birden fazla kritik|Several critical points)/, make: (rng) => createProblem(rng, 'openBox') },
    ],
  });
})();
