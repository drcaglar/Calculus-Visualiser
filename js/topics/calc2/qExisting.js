// Calculus II quiz material for the five first tabs: volumes, shells, arcSurface, work, centroid.
// 1 generator per tab in Calc2Quiz.main, 4 per tab in Calc2Quiz.extra (exam-only). Every question carries a
// non-enumerable `_v` spec (closed value + an independent integral / region) used only by the offline test.
(function () {
  window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };
  const tx = (a, b) => I18N.tx(a, b);
  const PI = Math.PI;
  const TV = () => tx('Hacim: Kesit, Disk ve Rondela', 'Volumes: Slicing, Disks and Washers');
  const TS = () => tx('Hacim: Silindirik Kabuk Yöntemi', 'Volumes: Cylindrical Shells');
  const TA = () => tx('Yay Uzunluğu ve Dönel Yüzey Alanı', 'Arc Length and Surface Area');
  const TW = () => tx('İş: Yay, Halat ve Pompalama', 'Work: Springs, Ropes and Pumping');
  const TC = () => tx('Moment ve Ağırlık Merkezi', 'Moments and Centre of Mass');

  const minus = (s) => s.replace(/-/g, '−');
  const rat = (v) => {
    for (let d = 1; d <= 1000; d++) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-9) return [Math.round(n), d]; }
    throw new Error('not rational: ' + v);
  };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const fr = (v) => {
    if (Math.abs(v) < 1e-12) return '0';
    let [n, d] = rat(v); const g = gcd(n, d); n /= g; d /= g;
    return minus(d === 1 ? String(n) : `${n}/${d}`);
  };
  const piS = (c) => {
    if (Math.abs(c) < 1e-12) return '0';
    let [n, d] = rat(c); const g = gcd(n, d); n /= g; d /= g;
    const m = Math.abs(n);
    return (n < 0 ? '−' : '') + (m === 1 ? 'π' : m + 'π') + (d === 1 ? '' : '/' + d);
  };
  const pair = (x, y) => `(${fr(x)}, ${fr(y)})`;
  const cs = (a) => (a === 1 ? '' : String(a));
  const br = (s) => (/^-?[0-9a-z]+$/.test(String(s)) ? String(s) : `{${s}}`);
  const I = (a, b) => `∫_${br(a)}^${br(b)}`;
  const r2 = (v) => Math.round(v * 100) / 100;

  // wr: [[wrong option, TR note, EN note], ...]; duplicates of the correct option or of each other are dropped (give 4+)
  function mk(rng, topic, text, corr, wr, sol, v) {
    const seen = new Set([corr]), keep = [];
    wr.forEach((w) => { if (!seen.has(w[0])) { seen.add(w[0]); keep.push(w); } });
    const q = makeQuestion(topic, text, corr, keep.map((w) => w[0]), sol, rng, keep.map((w) => tx(w[1], w[2])));
    Object.defineProperty(q, '_v', { value: v || {}, enumerable: false });
    return q;
  }
  const lvl = (fn, l) => { fn.level = l; return fn; };

  // ===== volumes =====
  const volMain = lvl((rng) => {
    const a = rng.nextInt(1, 5), b = rng.nextInt(2, 6), c = a * b * b / 2, arg = a === 1 ? 'x' : `${a}x`;
    return mk(rng, TV(),
      tx(`y = √(${arg}) eğrisi, x-ekseni ve x = ${b} doğrusu arasında kalan bölge x-ekseni etrafında döndürülüyor. Oluşan cismin hacmi kaçtır?`,
        `The region between the curve y = √(${arg}), the x-axis and the line x = ${b} is revolved about the x-axis. What is the volume of the solid?`),
      piS(c),
      [[piS(a * b * b), '½ çarpanı unutulmuş: ∫x dx = x²/2.', 'Forgot the 1/2: ∫x dx = x²/2.'],
        [fr(c), 'π çarpanı unutulmuş: disk alanı π·R²dir.', 'Forgot the factor π: a disk has area π·R².'],
        [piS(a * b), '∫x dx = x²/2 yerine x yazılmış.', 'Wrote x instead of ∫x dx = x²/2.'],
        [piS(c / 2), 'Bir kez fazla ikiye bölünmüş.', 'Divided by 2 once too often.']],
      [tx(`Disk yöntemi: V = π ${I(0, b)} [√(${arg})]² dx = π ${I(0, b)} ${arg} dx.`, `Disk method: V = π ${I(0, b)} [√(${arg})]² dx = π ${I(0, b)} ${arg} dx.`),
        `V = π·[${a === 1 ? '' : a + '·'}x²/2]₀^${b} = π·${fr(c)} = ${piS(c)}.`],
      { val: c * PI, fn: (x) => PI * Math.pow(Math.sqrt(a * x), 2), a: 0, b });
  }, 2);

  const volWasher = lvl((rng) => {
    const a = rng.nextInt(1, 4), a5 = Math.pow(a, 5), c = 2 * a5 / 15;
    return mk(rng, TV(),
      tx(`y = ${cs(a)}x ve y = x² eğrileri arasında kalan bölge (0 ≤ x ≤ ${a}) x-ekseni etrafında döndürülüyor. Hacim kaçtır?`,
        `The region between the curves y = ${cs(a)}x and y = x² (0 ≤ x ≤ ${a}) is revolved about the x-axis. What is the volume?`),
      piS(c),
      [[piS(a5 / 30), '(R − r)² alınmış; doğrusu R² − r²: önce kareler alınır, sonra çıkarılır.', 'Used (R − r)²; it must be R² − r²: square first, then subtract.'],
        [piS(a5 / 3), 'İç yarıçap (delik) unutulmuş: bu disk yöntemidir.', 'Forgot the inner radius (the hole): that is the disk method.'],
        [piS(8 * a5 / 15), 'R² ile r² çıkarılmak yerine toplanmış.', 'R² and r² were added instead of subtracted.'],
        [piS(a5 / 15), 'Sonuç iki kat küçük: ters türev hatası.', 'Result half the size: antiderivative slip.']],
      [tx(`Dış yarıçap R = ${cs(a)}x, iç yarıçap r = x² (x ∈ [0, ${a}]). V = π ${I(0, a)} [(${cs(a)}x)² − (x²)²] dx.`, `Outer radius R = ${cs(a)}x, inner radius r = x² (x ∈ [0, ${a}]). V = π ${I(0, a)} [(${cs(a)}x)² − (x²)²] dx.`),
        `V = π [${a * a}x³/3 − x⁵/5]₀^${a} = π (${a5}/3 − ${a5}/5) = ${piS(c)}.`],
      { val: c * PI, fn: (x) => PI * (Math.pow(a * x, 2) - Math.pow(x * x, 2)), a: 0, b: a });
  }, 2);

  const volKnown = lvl((rng) => {
    const k = rng.nextInt(1, 4), b = rng.pick([4, 9]), semi = rng.nextInt(0, 2) === 1;
    const sq = k * k * b * b / 2, sm = k * k * b * b / 16, kk = cs(k) + '√x', k2 = k * k === 1 ? '' : String(k * k);
    return mk(rng, TV(),
      tx(`Tabanı 0 ≤ y ≤ ${kk}, 0 ≤ x ≤ ${b} bölgesi olan bir cismin x-eksenine dik kesitleri ${semi ? 'çapı tabanda olan yarım daireler' : 'bir kenarı tabanda olan kareler'}dir. Hacim kaçtır?`,
        `A solid has the base 0 ≤ y ≤ ${kk}, 0 ≤ x ≤ ${b}; its cross-sections perpendicular to the x-axis are ${semi ? 'semicircles with the diameter in the base' : 'squares with a side in the base'}. What is the volume?`),
      semi ? piS(sm) : fr(sq),
      semi
        ? [[piS(k * k * b * b / 8), 'Tam daire (π/4)·s² alınmış; yarım daire için π/8·s².', 'Used a full disc (π/4)·s²; a semicircle gives π/8·s².'],
          [piS(k * k * b * b / 4), 'Yarıçap = s alınmış; yarıçap s/2 olmalıydı.', 'Took radius = s; the radius is s/2.'],
          [fr(sq), 'Kare formülü (s²) kullanılmış.', 'Used the square formula (s²).'],
          [piS(sm / 2), 'Bir kez fazla ikiye bölünmüş.', 'Divided by 2 once too often.']]
        : [[fr(k * k * b * b), '½ çarpanı unutulmuş: ∫x dx = x²/2.', 'Forgot the 1/2: ∫x dx = x²/2.'],
          [fr(2 * k * Math.pow(b, 1.5) / 3), 'Kesit alanı yerine kenar uzunluğu integre edilmiş: A = s², s değil.', 'Integrated the side instead of the area: A = s², not s.'],
          [fr(sq / 2), 'Bir kez fazla ikiye bölünmüş.', 'Divided by 2 once too often.'],
          [piS(sm), 'Kare yerine yarım daire formülü kullanılmış.', 'Used the semicircle formula instead of the square.']],
      [tx(`Taban uzunluğu s(x) = ${kk}. ${semi ? `Yarım daire: A = (π/8)·s² = (π/8)·${k2}x` : `Kare: A = s² = ${k2}x`}.`,
        `Base length s(x) = ${kk}. ${semi ? `Semicircle: A = (π/8)·s² = (π/8)·${k2}x` : `Square: A = s² = ${k2}x`}.`),
        `V = ${semi ? '(π/8)·' : ''}${k2 ? k2 + '·' : ''}[x²/2]₀^${b} = ${semi ? piS(sm) : fr(sq)}.`],
      { val: semi ? sm * PI : sq, fn: (x) => (semi ? PI / 8 : 1) * k * k * x, a: 0, b });
  }, 1);

  const volPick = lvl((rng) => {
    const S = [['x + 3', 'x', 0, 2], ['√x + 2', '√x', 0, 4], ['4 − x²', '1', 0, 1], ['2x', 'x', 1, 3], ['x² + 1', 'x', 0, 1]];
    const [f, g, a, b] = rng.pick(S);
    const corr = `π ${I(a, b)} [(${f})² − (${g})²] dx`;
    return mk(rng, TV(),
      tx(`y = ${f} ve y = ${g} eğrileri ile x = ${a}, x = ${b} doğruları arasında kalan bölge x-ekseni etrafında döndürülüyor (bölge eksene değmiyor). Hacmi veren integral hangisidir? (Hesaplamayınız.)`,
        `The region between y = ${f} and y = ${g} and the lines x = ${a}, x = ${b} is revolved about the x-axis (the region does not touch the axis). Which integral gives the volume? (Do not evaluate.)`),
      corr,
      [[`π ${I(a, b)} (${f} − ${g})² dx`, 'Önce çıkarıp sonra kare alınmış: (R − r)² ≠ R² − r².', 'Subtracted first, then squared: (R − r)² ≠ R² − r².'],
        [`π ${I(a, b)} (${f}) dx`, 'Yarıçap integre edilmiş; disk/rondela alanı π(R² − r²)dir.', 'Integrated the radius; a washer has area π(R² − r²).'],
        [`2π ${I(a, b)} x·(${f} − ${g}) dx`, 'Kabuk formülü kullanılmış; x-ekseni etrafında dilimler eksene diktir: rondela.', 'Used the shell formula; about the x-axis the slices are perpendicular to it: washers.'],
        [`π ${I(a, b)} (${f})² dx`, 'İç yarıçap (delik) unutulmuş.', 'Forgot the inner radius (the hole).']],
      [tx(`Dilim eksene diktir ve ortası boştur: rondela. A(x) = π(R² − r²), R = ${f}, r = ${g}.`, `The slice is perpendicular to the axis and hollow: a washer. A(x) = π(R² − r²) with R = ${f}, r = ${g}.`),
        corr],
      { concept: true });
  }, 1);

  const volAxis = lvl((rng) => {
    const b = rng.nextInt(1, 4), c = rng.nextInt(1, 4), b3 = Math.pow(b, 3), b5 = Math.pow(b, 5), co = (3 * b5 + 10 * c * b3) / 15;
    return mk(rng, TV(),
      tx(`y = x², x-ekseni ve x = ${b} ile sınırlı bölge y = −${c} doğrusu etrafında döndürülüyor. Hacim kaçtır?`,
        `The region bounded by y = x², the x-axis and x = ${b} is revolved about the line y = −${c}. What is the volume?`),
      piS(co),
      [[piS(b5 / 5 + 2 * c * b3 / 3 + c * c * b), 'İç yarıçap (c) unutulmuş: bölge ile eksen arasında c kadar boşluk vardır.', 'Forgot the inner radius c: there is a gap of c between region and axis.'],
        [piS(b5 / 5), 'Eksen x-ekseni sanılmış (R = x²).', 'Treated the axis as the x-axis (R = x²).'],
        [piS(b5 / 5 - 2 * c * b3 / 3), 'Dış yarıçap x² − c alınmış; eksen eğrinin altında, R = x² + c.', 'Took R = x² − c; the axis lies below the curve, so R = x² + c.'],
        [piS(co * 2), 'İki kat: π yerine 2π kullanılmış (disk için 2π yok).', 'Doubled: used 2π instead of π (disks have no 2π).']],
      [tx(`Eksen y = −${c}: dış yarıçap R = x² + ${c}, iç yarıçap r = ${c}.`, `Axis y = −${c}: outer radius R = x² + ${c}, inner radius r = ${c}.`),
        `V = π ${I(0, b)} [(x² + ${c})² − ${c * c}] dx = π ${I(0, b)} (x⁴ + ${2 * c}x²) dx = π [x⁵/5 + ${2 * c}x³/3]₀^${b} = ${piS(co)}.`],
      { val: co * PI, fn: (x) => PI * (Math.pow(x * x + c, 2) - c * c), a: 0, b });
  }, 3);

  // ===== shells =====
  const shMain = lvl((rng) => {
    const a = rng.nextInt(2, 5), c = Math.pow(a, 4) / 6;
    return mk(rng, TS(),
      tx(`y = ${cs(a)}x − x² eğrisi ile x-ekseni arasında kalan bölge (0 ≤ x ≤ ${a}) y-ekseni etrafında döndürülüyor. Silindirik kabuk yöntemiyle hacim kaçtır?`,
        `The region between y = ${cs(a)}x − x² and the x-axis (0 ≤ x ≤ ${a}) is revolved about the y-axis. What is the volume by cylindrical shells?`),
      piS(c),
      [[piS(c / 2), '2π yerine π kullanılmış: kabuk hacmi 2π·r·h·dx.', 'Used π instead of 2π: a shell has volume 2π·r·h·dx.'],
        [piS(Math.pow(a, 3) / 3), 'Yarıçap (x) çarpanı unutulmuş: integrand x·(yükseklik) olmalıydı.', 'Forgot the radius factor x: the integrand must be x·(height).'],
        [piS(Math.pow(a, 4) / 2), 'Yükseklik olarak yalnız x² alınmış (üst eğri ' + cs(a) + 'x − x² idi).', 'Took only x² as the height (the curve is ' + cs(a) + 'x − x²).'],
        [piS(c * 2), 'İki kat: 4π kullanılmış.', 'Doubled: used 4π.']],
      [tx(`Yarıçap = x, yükseklik = ${cs(a)}x − x². V = 2π ${I(0, a)} x(${cs(a)}x − x²) dx.`, `Radius = x, height = ${cs(a)}x − x². V = 2π ${I(0, a)} x(${cs(a)}x − x²) dx.`),
        `V = 2π [${cs(a)}x³/3 − x⁴/4]₀^${a} = 2π·${fr(Math.pow(a, 4) / 12)} = ${piS(c)}.`],
      { val: c * PI, fn: (x) => 2 * PI * x * (a * x - x * x), a: 0, b: a });
  }, 2);

  const shSetup = lvl((rng) => {
    const a = rng.nextInt(2, 6), h = `${a}x − x²`, corr = `2π ${I(0, a)} x(${h}) dx`;
    return mk(rng, TS(),
      tx(`y = ${a}x ve y = x² eğrileri arasında kalan bölge (0 ≤ x ≤ ${a}) y-ekseni etrafında döndürülüyor. Silindirik kabuk yöntemiyle hacmi veren integral hangisidir? (Hesaplamayınız.)`,
        `The region between y = ${a}x and y = x² (0 ≤ x ≤ ${a}) is revolved about the y-axis. Which integral gives the volume by shells? (Do not evaluate.)`),
      corr,
      [[`2π ${I(0, a)} (${h}) dx`, 'Yarıçap çarpanı x unutulmuş.', 'Forgot the radius factor x.'],
        [`π ${I(0, a)} (${h})² dx`, 'Disk/rondela formülü ile karıştırılmış.', 'Mixed up with the disk/washer formula.'],
        [`2π ${I(0, a)} x(${a}x + x²) dx`, 'Yükseklik üst − alt olmalı; toplanmış.', 'Height must be top − bottom, not the sum.'],
        [`2π ${I(0, a)} x(x² − ${a}x) dx`, `Yükseklik ters işaretli: üstteki eğri y = ${a}x.`, `Height has the wrong sign: the upper curve is y = ${a}x.`]],
      [tx(`Dikey şeridin yüksekliği ${h} (üst − alt), eksene uzaklığı x.`, `The vertical strip has height ${h} (top − bottom) and distance x from the axis.`), corr],
      { concept: true });
  }, 2);

  const shAxisLeft = lvl((rng) => {
    const b = rng.nextInt(2, 5), c = rng.nextInt(1, 4), b3 = Math.pow(b, 3), co = (2 * b3 + 3 * c * b * b) / 3;
    return mk(rng, TS(),
      tx(`y = x doğrusu, x-ekseni ve x = ${b} doğrusu ile sınırlı üçgen bölge x = −${c} doğrusu etrafında döndürülüyor. Hacim kaçtır?`,
        `The triangle bounded by y = x, the x-axis and x = ${b} is revolved about the line x = −${c}. What is the volume?`),
      piS(co),
      [[piS(2 * b3 / 3), `Yarıçap x alınmış; eksen x = −${c} olduğundan yarıçap x + ${c}.`, `Took radius x; the axis is x = −${c}, so the radius is x + ${c}.`],
        [piS((3 * c * b * b - 2 * b3) / 3), `Yarıçap ${c} − x alınmış; eksen bölgenin solunda, yarıçap x + ${c}.`, `Took radius ${c} − x; the axis is left of the region, so the radius is x + ${c}.`],
        [piS(co / 2), '2π yerine π kullanılmış.', 'Used π instead of 2π.'],
        [piS(co * 2), 'İki kat: 4π kullanılmış.', 'Doubled: used 4π.']],
      [tx(`Yarıçap = x + ${c}, yükseklik = x. V = 2π ${I(0, b)} (x + ${c})·x dx.`, `Radius = x + ${c}, height = x. V = 2π ${I(0, b)} (x + ${c})·x dx.`),
        `V = 2π [x³/3 + ${c}x²/2]₀^${b} = 2π·(${fr(b3 / 3 + c * b * b / 2)}) = ${piS(co)}.`],
      { val: co * PI, fn: (x) => 2 * PI * (x + c) * x, a: 0, b });
  }, 2);

  const shAxisRight = lvl((rng) => {
    const b = rng.nextInt(1, 4), L = b + 1, b3 = Math.pow(b, 3), b4 = Math.pow(b, 4), co = (b4 + 4 * b3) / 6;
    return mk(rng, TS(),
      tx(`y = x², x-ekseni ve x = ${b} ile sınırlı bölge x = ${L} doğrusu etrafında döndürülüyor. Hacim kaçtır?`,
        `The region bounded by y = x², the x-axis and x = ${b} is revolved about the line x = ${L}. What is the volume?`),
      piS(co),
      [[piS(2 * L * b3 / 3 + b4 / 2), `Yarıçap x + ${L} alınmış; eksen sağda, yarıçap ${L} − x.`, `Took radius x + ${L}; the axis is on the right, so the radius is ${L} − x.`],
        [piS(b4 / 2), 'Yarıçap x alınmış (y-ekseni etrafında dönme).', 'Took radius x (revolution about the y-axis).'],
        [piS(co / 2), '2π yerine π kullanılmış.', 'Used π instead of 2π.'],
        [piS(co * 2), 'İki kat: 4π kullanılmış.', 'Doubled: used 4π.']],
      [tx(`Eksen bölgenin sağında: yarıçap = ${L} − x, yükseklik = x². V = 2π ${I(0, b)} (${L} − x)x² dx.`, `The axis is right of the region: radius = ${L} − x, height = x². V = 2π ${I(0, b)} (${L} − x)x² dx.`),
        `V = 2π [${L}x³/3 − x⁴/4]₀^${b} = 2π·(${fr(L * b3 / 3 - b4 / 4)}) = ${piS(co)}.`],
      { val: co * PI, fn: (x) => 2 * PI * (L - x) * x * x, a: 0, b });
  }, 3);

  const shChoose = lvl((rng) => {
    const AX = [['y-ekseni', 'the y-axis', true], ['x = 3 doğrusu', 'the line x = 3', true], ['x = −2 doğrusu', 'the line x = −2', true],
      ['x-ekseni', 'the x-axis', false], ['y = −1 doğrusu', 'the line y = −1', false], ['y = 5 doğrusu', 'the line y = 5', false]];
    const [tr, en, vert] = rng.pick(AX);
    const O = [['Silindirik kabuk, dx cinsinden integral', 'Cylindrical shells, integral in dx'], ['Disk/rondela, dx cinsinden integral', 'Disks/washers, integral in dx'],
      ['Silindirik kabuk, dy cinsinden integral', 'Cylindrical shells, integral in dy'], ['Disk/rondela, dy cinsinden integral', 'Disks/washers, integral in dy']];
    const c = vert ? 0 : 1, o = O.map((p) => tx(p[0], p[1]));
    const nt = ['Şeritler dikey (dx) ise integral dy cinsinden kurulmaz.', 'With vertical strips (dx) the integral is not in dy.'];
    return mk(rng, TS(),
      tx(`y = f(x) eğrisinin altında kalan bölge dikey şeritlerle (dx) dilimlenmiştir ve ${tr} etrafında döndürülecektir. İntegrali yalnızca x cinsinden kurmak için hangi yöntem doğrudan uygulanır?`,
        `The region under y = f(x) is cut into vertical strips (dx) and revolved about ${en}. Which method applies directly if the integral is to be in x only?`),
      o[c],
      [[o[1 - c], vert ? 'Dikey şerit dönme eksenine paraleldir; döndüğünde kabuk olur, disk değil.' : 'Dikey şerit eksene diktir; döndüğünde disk/rondela olur, kabuk değil.',
        vert ? 'A vertical strip is parallel to the axis; it sweeps a shell, not a disk.' : 'A vertical strip is perpendicular to the axis; it sweeps a disk/washer, not a shell.'],
        [o[2], nt[0], nt[1]], [o[3], nt[0], nt[1]]],
      [tx('Kural: şerit dönme eksenine paralelse kabuk, dik ise disk/rondela.', 'Rule: a strip parallel to the axis gives shells, a strip perpendicular to it gives disks/washers.'),
        tx(`Dikey şerit ${vert ? 'dikey eksene paralel' : 'yatay eksene dik'} ⇒ ${o[c]}.`, `A vertical strip is ${vert ? 'parallel to a vertical axis' : 'perpendicular to a horizontal axis'} ⇒ ${o[c]}.`)],
      { concept: true });
  }, 1);

  // ===== arc length and surface =====
  const arMain = lvl((rng) => {
    const b = rng.pick([3, 8, 15, 24]), q = Math.pow(1 + b, 1.5), L = 2 / 3 * (q - 1);
    return mk(rng, TA(),
      tx(`y = (2/3)·x^(3/2) eğrisinin x = 0 ile x = ${b} arasındaki yay uzunluğu kaçtır?`, `What is the arc length of y = (2/3)·x^(3/2) from x = 0 to x = ${b}?`),
      fr(L),
      [[fr(q - 1), '(2/3) çarpanı unutulmuş: ∫√(1+x) dx = (2/3)(1+x)^(3/2).', 'Forgot the factor 2/3: ∫√(1+x) dx = (2/3)(1+x)^(3/2).'],
        [fr(2 / 3 * q), 'Alt sınır (x = 0) değeri çıkarılmamış.', 'Did not subtract the value at the lower limit x = 0.'],
        [fr(b), 'Yay uzunluğu yerine x aralığının uzunluğu alınmış.', 'Took the length of the x-interval instead of the arc length.'],
        [fr(L + 1), 'Son adımda 1 hata.', 'A slip of 1 in the last step.']],
      [tx('f′(x) = √x ⇒ 1 + f′² = 1 + x ⇒ √(1 + f′²) = √(1 + x).', 'f′(x) = √x ⇒ 1 + f′² = 1 + x ⇒ √(1 + f′²) = √(1 + x).'),
        `L = ${I(0, b)} √(1 + x) dx = (2/3)[(1 + x)^(3/2)]₀^${b} = (2/3)(${fr(q)} − 1) = ${fr(L)}.`],
      { val: L, fn: (x) => Math.sqrt(1 + x), a: 0, b });
  }, 2);

  const TRI = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13]];
  const arLine = lvl((rng) => {
    const [n, d, h] = rng.pick(TRI), k = rng.nextInt(1, 4), b = d * k, m = n / d;
    return mk(rng, TA(),
      tx(`y = ${n}x/${d} doğrusunun x = 0 ile x = ${b} arasındaki parçasının uzunluğu kaçtır?`, `What is the length of the segment of the line y = ${n}x/${d} from x = 0 to x = ${b}?`),
      fr(h * k),
      [[fr((n + d) * k), 'Dik kenarlar toplanmış; uzunluk hipotenüstür.', 'Added the legs; the length is the hypotenuse.'],
        [fr(b), 'Yalnız x farkı alınmış.', 'Took only the x-difference.'],
        [fr(n * k), 'Yalnız y farkı alınmış.', 'Took only the y-difference.'],
        [fr(h * k + 1), 'Son adımda 1 hata.', 'A slip of 1 in the last step.']],
      [tx(`f′ = ${n}/${d} sabit ⇒ √(1 + f′²) = √(1 + ${n * n}/${d * d}) = ${h}/${d}.`, `f′ = ${n}/${d} is constant ⇒ √(1 + f′²) = √(1 + ${n * n}/${d * d}) = ${h}/${d}.`),
        tx(`L = (${h}/${d})·${b} = ${h * k}. Kontrol: Pisagor, √(${b}² + ${n * k}²) = ${h * k}.`, `L = (${h}/${d})·${b} = ${h * k}. Check: Pythagoras, √(${b}² + ${n * k}²) = ${h * k}.`)],
      { val: h * k, fn: () => Math.sqrt(1 + m * m), a: 0, b });
  }, 1);

  const arSurface = lvl((rng) => {
    const [n, d, h] = rng.pick(TRI), j = rng.nextInt(1, 3), b = d * j, m = n / d, co = n * h * j * j;
    return mk(rng, TA(),
      tx(`y = ${n}x/${d} doğrusunun x = 0 ile x = ${b} arasındaki parçası x-ekseni etrafında döndürülüyor. Oluşan yüzeyin alanı kaçtır?`,
        `The segment of the line y = ${n}x/${d} from x = 0 to x = ${b} is revolved about the x-axis. What is the area of the resulting surface?`),
      piS(co),
      [[piS(n * d * j * j), '√(1 + f′²) çarpanı (eğim uzunluğu) unutulmuş.', 'Forgot the slant factor √(1 + f′²).'],
        [piS(co / 2), '2π yerine π kullanılmış.', 'Used π instead of 2π.'],
        [piS(2 * co), 'İki kat: fazladan 2 çarpılmış.', 'Doubled: an extra factor 2.'],
        [piS(n * h * j), 'Sonuçta b² yerine b kullanılmış (∫x dx = x²/2).', 'Used b instead of b² in the result (∫x dx = x²/2).']],
      [tx(`S = 2π ${I(0, b)} f(x)√(1 + f′²) dx, f = ${n}x/${d}, √(1 + f′²) = ${h}/${d}.`, `S = 2π ${I(0, b)} f(x)√(1 + f′²) dx, f = ${n}x/${d}, √(1 + f′²) = ${h}/${d}.`),
        `S = 2π·(${n}/${d})·(${h}/${d})·[x²/2]₀^${b} = π·${n * h}/${d * d}·${b * b} = ${piS(co)}.`],
      { val: co * PI, fn: (x) => 2 * PI * m * x * Math.sqrt(1 + m * m), a: 0, b });
  }, 2);

  const arHard = lvl((rng) => {
    const b = rng.nextInt(2, 4), b3 = Math.pow(b, 3), L = b3 / 6 - 1 / (2 * b) + 1 / 3;
    return mk(rng, TA(),
      tx(`y = x³/6 + 1/(2x) eğrisinin x = 1 ile x = ${b} arasındaki yay uzunluğu kaçtır?`, `What is the arc length of y = x³/6 + 1/(2x) from x = 1 to x = ${b}?`),
      fr(L),
      [[fr(b3 / 6 - 1 / (2 * b)), 'Alt sınır x = 1 değeri çıkarılmamış.', 'Did not subtract the value at the lower limit x = 1.'],
        [fr(b3 / 6 + 1 / (2 * b) - 2 / 3), 'Yay uzunluğu yerine f(b) − f(1) alınmış (ya da 1/(2x²) ters işaretle integre edilmiş).', 'Took f(b) − f(1) instead of the arc length (or integrated 1/(2x²) with the wrong sign).'],
        [fr((b3 - 1) / 6), '1/(2x²) terimi unutulmuş.', 'Dropped the 1/(2x²) term.'],
        [fr(2 * L), 'İki kat.', 'Doubled.']],
      [tx('f′ = x²/2 − 1/(2x²) ⇒ 1 + f′² = (x²/2 + 1/(2x²))² (tam kare) ⇒ √(1 + f′²) = x²/2 + 1/(2x²).', 'f′ = x²/2 − 1/(2x²) ⇒ 1 + f′² = (x²/2 + 1/(2x²))² (a perfect square) ⇒ √(1 + f′²) = x²/2 + 1/(2x²).'),
        `L = [x³/6 − 1/(2x)]₁^${b} = (${fr(b3 / 6)} − ${fr(1 / (2 * b))}) − (1/6 − 1/2) = ${fr(L)}.`],
      { val: L, fn: (x) => Math.sqrt(1 + Math.pow(x * x / 2 - 1 / (2 * x * x), 2)), a: 1, b });
  }, 3);

  const arFormula = lvl((rng) => {
    const yAxis = rng.nextInt(0, 2) === 1;
    const ax = yAxis ? tx('y-ekseni', 'the y-axis') : tx('x-ekseni', 'the x-axis');
    const corr = yAxis ? '2π ∫ₐᵇ x √(1 + [f′(x)]²) dx' : '2π ∫ₐᵇ f(x) √(1 + [f′(x)]²) dx';
    return mk(rng, TA(),
      tx(`y = f(x) (a ≤ x ≤ b${yAxis ? ', a ≥ 0' : ''}) eğrisi ${ax} etrafında döndürülüyor. Oluşan yüzeyin alanını veren formül hangisidir?`,
        `The curve y = f(x) (a ≤ x ≤ b${yAxis ? ', a ≥ 0' : ''}) is revolved about ${ax}. Which formula gives the area of the surface?`),
      corr,
      [[yAxis ? '2π ∫ₐᵇ f(x) √(1 + [f′(x)]²) dx' : '2π ∫ₐᵇ x √(1 + [f′(x)]²) dx', 'Yarıçap yanlış: eksene olan uzaklık kullanılmalı (x-ekseninde f(x), y-ekseninde x).', 'Wrong radius: use the distance to the axis (f(x) for the x-axis, x for the y-axis).'],
        ['∫ₐᵇ √(1 + [f′(x)]²) dx', 'Bu yay uzunluğu formülüdür.', 'That is the arc-length formula.'],
        [yAxis ? '2π ∫ₐᵇ x f(x) dx' : 'π ∫ₐᵇ [f(x)]² dx', yAxis ? 'Bu kabuk (hacim) formülüdür.' : 'Bu disk (hacim) formülüdür.', yAxis ? 'That is the shell (volume) formula.' : 'That is the disk (volume) formula.'],
        ['2π ∫ₐᵇ f(x) dx', 'ds = √(1 + f′²) dx eğim çarpanı unutulmuş.', 'Forgot the slant factor ds = √(1 + f′²) dx.']],
      [tx('Yüzey alanı = 2π·(yarıçap)·ds, ds = √(1 + f′²) dx.', 'Surface area = 2π·(radius)·ds with ds = √(1 + f′²) dx.'),
        tx(`${ax} etrafında yarıçap = ${yAxis ? 'x' : 'f(x)'} ⇒ ${corr}.`, `Radius about ${ax} = ${yAxis ? 'x' : 'f(x)'} ⇒ ${corr}.`)],
      { concept: true });
  }, 1);

  // ===== work =====
  const G = 9.81;
  const numQ = (topic, text, W, sol, rng, o, v) => {
    const q = Assessment.num(topic, text, W, sol, rng, o);
    Object.defineProperty(q, '_v', { value: v, enumerable: false });
    return q;
  };
  const wkMain = lvl((rng) => {
    const k = rng.pick([100, 200, 300, 400, 500, 600]), a = rng.pick([0.1, 0.2]), b = Math.round((a + 0.1 * rng.nextInt(1, 4)) * 10) / 10, W = k * (b * b - a * a) / 2;
    return numQ(TW(),
      tx(`Sertliği k = ${k} N/m olan bir yay, doğal boyundan ${a} m uzatılmış durumdan ${b} m uzatılmış duruma getiriliyor. Yapılan iş kaç J'dür?`,
        `A spring of stiffness k = ${k} N/m is stretched from ${a} m beyond its natural length to ${b} m beyond it. How much work (in J) is done?`),
      W,
      [`W = ${I(a, b)} kx dx = (k/2)(b² − a²).`, `W = ${k / 2}·(${b}² − ${a}²) = ${r2(W)} J.`],
      rng,
      { unit: 'J', level: 2, wrongs: [k * b * b / 2, k * (b - a) * (b - a) / 2, k * (b * b - a * a), k * (b - a)] },
      { val: W, fn: (x) => k * x, a, b });
  }, 2);

  const wkUnits = lvl((rng) => {
    const V = [
      ['Bir F(x) kuvveti (N) x yolu (m) boyunca etkiyor. ∫F dx integralinin birimi nedir?', 'A force F(x) (in N) acts along a path x (in m). What is the unit of ∫F dx?'],
      ['Yay sabiti k N/m biriminde, uzama x metredir. ∫kx dx integralinin birimi nedir?', 'The spring constant k is in N/m and the stretch x in metres. What is the unit of ∫kx dx?'],
      ['Pompalamada dW = ρ·g·A·(H − y)·dy ifadesinde ρ kg/m³, g m/s², A m², H ve y m cinsindendir. ∫dW integralinin birimi nedir?', 'In pumping, dW = ρ·g·A·(H − y)·dy with ρ in kg/m³, g in m/s², A in m² and H, y in m. What is the unit of ∫dW?'],
    ][rng.nextInt(0, 3)];
    return mk(rng, TW(), tx(V[0], V[1]), 'N·m = J',
      [['N/m', 'Bu yay sabitinin birimidir; iş kuvvet × yoldur.', 'That is the unit of a spring constant; work is force × distance.'],
        ['N·s', 'Bu itmenin (impuls) birimidir; iş kuvvet × yoldur.', 'That is the unit of impulse; work is force × distance.'],
        ['J/s = W', 'Bu güç birimidir; iş zamana bölünmemiştir.', 'That is power; work is not divided by time.']],
      [tx('İş = kuvvet × yol: N·m = kg·m²/s² = J.', 'Work = force × distance: N·m = kg·m²/s² = J.')], { concept: true });
  }, 1);

  const wkRope = lvl((rng) => {
    const m = rng.nextInt(2, 6), L = rng.pick([4, 6, 8, 10]), W = m * G * L * L / 2;
    return numQ(TW(),
      tx(`Boyu ${L} m, birim uzunluk kütlesi ${m} kg/m olan homojen bir halat tamamen sarkmaktadır. Halatın tamamını tepeye çekmek için yapılan iş kaç J'dür? (g = 9.81 m/s²)`,
        `A uniform rope of length ${L} m and mass ${m} kg/m hangs fully down. How much work (in J) is needed to pull all of it to the top? (g = 9.81 m/s²)`),
      W,
      [tx(`y kadar çekildiğinde sarkan uzunluk ${L} − y: F(y) = ${m}·g·(${L} − y).`, `After pulling y the hanging length is ${L} − y: F(y) = ${m}·g·(${L} − y).`),
        `W = ${I(0, L)} ${m}g(${L} − y) dy = ${m}g·${L}²/2 = ${r2(W)} J.`],
      rng,
      { unit: 'J', level: 2, wrongs: [m * G * L * L, m * G * L, m * G * L * L / 4, m * L * L / 2] },
      { val: W, fn: (y) => m * G * (L - y), a: 0, b: L });
  }, 2);

  const wkBox = lvl((rng) => {
    const l = rng.nextInt(2, 5), w = rng.nextInt(2, 4), H = rng.nextInt(1, 4), W = G * l * w * H * H / 2;
    return numQ(TW(),
      tx(`Tabanı ${l} m × ${w} m, derinliği ${H} m olan dikdörtgen prizma biçimli bir tank ağzına kadar sudur (ρ = 1000 kg/m³). Suyu üst kenardan dışarı pompalamak için yapılan iş kaç kJ'dür? (g = 9.81 m/s²)`,
        `A box tank ${l} m × ${w} m with depth ${H} m is full of water (ρ = 1000 kg/m³). How much work (in kJ) is needed to pump the water over the top edge? (g = 9.81 m/s²)`),
      W,
      [tx(`y yüksekliğindeki tabaka: ağırlık = ρg·${l * w}·dy, kaldırma yolu ${H} − y.`, `Slab at height y: weight = ρg·${l * w}·dy, lifted ${H} − y.`),
        `W = ρg·${l * w} ${I(0, H)} (${H} − y) dy = ρg·${l * w}·${H}²/2 = ${r2(W)} kJ.`],
      rng,
      { unit: 'kJ', level: 3, wrongs: [G * l * w * H * H, l * w * H * H / 2, G * l * w * H * H / 3, G * l * w * H * H / 4] },
      { val: W, fn: (y) => G * l * w * (H - y), a: 0, b: H });
  }, 3);

  const wkSetup = lvl((rng) => {
    const A = rng.nextInt(2, 6) * rng.nextInt(1, 3), H = rng.nextInt(2, 5), h = rng.nextInt(0, 3);
    const corr = `ρ·g·${A}·(${H + h} − y) dy`;
    const spout = h === 0 ? tx('tankın üst kenarından', 'over the top edge') : tx(`tankın üst kenarının ${h} m üstündeki bir çıkış ağzından`, `out of a spout ${h} m above the top edge`);
    return mk(rng, TW(),
      tx(`Taban alanı ${A} m², derinliği ${H} m olan prizma biçimli bir tank ağzına kadar sudur. Su ${spout} dışarı pompalanacaktır. Tabandan y yüksekliğindeki, kalınlığı dy olan tabakayı kaldırmak için yapılan dW işi hangisidir? (Hesaplamayınız.)`,
        `A prism-shaped tank of base area ${A} m² and depth ${H} m is full of water, which is pumped ${spout}. Which expression is the work dW needed to lift the slab of thickness dy at height y above the bottom? (Do not evaluate.)`),
      corr,
      [[`ρ·g·${A}·y dy`, 'Kaldırma yolu y değil, çıkışa kadar olan mesafedir.', 'The lifting distance is not y but the distance up to the outlet.'],
        [`ρ·g·${A}·${H} dy`, 'Her tabaka aynı yoldan kaldırılmaz; yol y ile değişir.', 'Slabs are not all lifted the same distance; it depends on y.'],
        [h === 0 ? `ρ·g·${A}·(${H} + y) dy` : `ρ·g·${A}·(${H} − y) dy`, h === 0 ? 'Yol H − y olmalı; y arttıkça kısalır.' : 'Çıkış ağzının yüksekliği (h) unutulmuş.', h === 0 ? 'The distance is H − y; it shrinks as y grows.' : 'Forgot the extra height h of the spout.'],
        [`ρ·${A}·(${H + h} − y) dy`, 'g unutulmuş: iş = ağırlık × yol, ağırlık = ρ·g·hacim.', 'Forgot g: work = weight × distance and weight = ρ·g·volume.']],
      [tx(`Tabakanın ağırlığı ρ·g·${A}·dy, yolu ${H + h} − y (çıkışa kadar).`, `Slab weight ρ·g·${A}·dy, lifting distance ${H + h} − y (up to the outlet).`), `dW = ${corr}.`],
      { concept: true });
  }, 2);

  // ===== centroid =====
  const ctMain = lvl((rng) => {
    const k = rng.nextInt(1, 4), b = rng.pick([2, 4]), xb = 3 * b / 4, yb = 3 * k * b * b / 10;
    return mk(rng, TC(),
      tx(`y = ${cs(k)}x² eğrisi, x-ekseni ve x = ${b} doğrusu ile sınırlı düzgün plakanın ağırlık merkezi (x̄, ȳ) nedir?`,
        `What is the centre of mass (x̄, ȳ) of the uniform plate bounded by y = ${cs(k)}x², the x-axis and x = ${b}?`),
      pair(xb, yb),
      [[pair(b / 2, yb), 'Simetri varsayılmış (x̄ = b/2); plaka simetrik değil, sağa doğru ağırdır.', 'Assumed symmetry (x̄ = b/2); the plate is not symmetric, it is heavier on the right.'],
        [pair(xb, 2 * yb), 'M_x için ½ çarpanı unutulmuş.', 'Forgot the factor ½ in M_x.'],
        [pair(yb, xb), 'x̄ ile ȳ yer değiştirmiş.', 'x̄ and ȳ swapped.'],
        [pair(2 * b / 3, yb), 'M_y integralinde x·f(x) yerine x alınmış.', 'In M_y used x instead of x·f(x).']],
      [`A = ∫₀^${b} ${cs(k)}x² dx = ${fr(k * b * b * b / 3)},  M_y = ∫ x·${cs(k)}x² dx = ${fr(k * Math.pow(b, 4) / 4)},  M_x = ½∫ (${cs(k)}x²)² dx = ${fr(k * k * Math.pow(b, 5) / 10)}.`,
        `x̄ = M_y/A = ${fr(xb)},  ȳ = M_x/A = ${fr(yb)}.`],
      { val: [xb, yb], f: (x) => k * x * x, g: () => 0, a: 0, b });
  }, 2);

  const ctSym = lvl((rng) => {
    const a = rng.nextInt(1, 5), yb = 2 * a * a / 5;
    return mk(rng, TC(),
      tx(`y = ${a * a} − x² eğrisi ile x-ekseni arasında kalan düzgün plakanın ağırlık merkezi (x̄, ȳ) nedir? (İpucu: simetri.)`,
        `What is the centre of mass (x̄, ȳ) of the uniform plate between y = ${a * a} − x² and the x-axis? (Hint: symmetry.)`),
      pair(0, yb),
      [[pair(0, 4 * yb), 'M_x için ½ çarpanı unutulmuş.', 'Forgot the factor ½ in M_x.'],
        [pair(a / 2, yb), 'Simetri kullanılmamış; plaka y-eksenine göre simetrik, x̄ = 0.', 'Symmetry not used; the plate is symmetric about the y-axis, so x̄ = 0.'],
        [pair(0, a * a / 2), 'ȳ = yükseklik/2 alınmış; parabolün kütlesi tabana yakındır.', 'Took ȳ = height/2; a parabola has its mass nearer the base.'],
        [pair(0, a * a / 3), 'Üçgen ağırlık merkezi oranı (h/3) kullanılmış.', 'Used the triangle ratio h/3.']],
      [tx('Plaka y-eksenine göre simetrik ⇒ x̄ = 0 (integral almaya gerek yok).', 'The plate is symmetric about the y-axis ⇒ x̄ = 0 (no integral needed).'),
        `A = ∫_{−${a}}^{${a}} (${a * a} − x²) dx = ${fr(4 * a * a * a / 3)},  M_x = ½∫ (${a * a} − x²)² dx = ${fr(8 * Math.pow(a, 5) / 15)},  ȳ = ${fr(yb)}.`],
      { val: [0, yb], f: (x) => a * a - x * x, g: () => 0, a: -a, b: a });
  }, 2);

  const ctConcept = lvl((rng) => {
    const k = rng.pick([1, 4, 9]), c = rng.nextInt(1, 6), r = Math.sqrt(k);
    return mk(rng, TC(),
      tx(`y = ${k} − (x − ${c})² eğrisi ile x-ekseni arasında kalan düzgün plakanın ağırlık merkezinin x-koordinatı x̄ kaçtır? (İntegral almadan, simetri ile bulunuz.)`,
        `What is the x-coordinate x̄ of the centre of mass of the uniform plate between y = ${k} − (x − ${c})² and the x-axis? (Use symmetry, no integral.)`),
      fr(c),
      [['0', `Parabolün tepesi x = ${c} noktasındadır; y-ekseni simetri ekseni değildir.`, `The vertex is at x = ${c}; the y-axis is not the axis of symmetry.`],
        [fr(c / 2), `Plaka x = 0 ile x = ${c} arasında sanılmış.`, `Treated the plate as lying between x = 0 and x = ${c}.`],
        [fr(c + r), 'Sağ uç noktası alınmış; ağırlık merkezi simetri ekseni üzerindedir.', 'Took the right end point; the centroid lies on the axis of symmetry.']],
      [tx(`Eğri x = ${c} doğrusuna göre simetrik (x − ${c} yalnız karesiyle girer).`, `The curve is symmetric about x = ${c} (x − ${c} enters only squared).`),
        tx(`Bölge [${fr(c - r)}, ${fr(c + r)}] aralığındadır; ağırlık merkezi simetri ekseni üzerinde ⇒ x̄ = ${c}.`, `The region spans [${fr(c - r)}, ${fr(c + r)}] and its centroid lies on the axis of symmetry ⇒ x̄ = ${c}.`)],
      { val: [c], f: (x) => k - (x - c) * (x - c), g: () => 0, a: c - r, b: c + r });
  }, 1);

  const ctTwo = lvl((rng) => {
    const a = rng.nextInt(2, 6), xb = a / 2, yb = 2 * a * a / 5;
    return mk(rng, TC(),
      tx(`y = ${a}x ve y = x² eğrileri arasında kalan düzgün plakanın (0 ≤ x ≤ ${a}) ağırlık merkezi (x̄, ȳ) nedir?`,
        `What is the centre of mass (x̄, ȳ) of the uniform plate between y = ${a}x and y = x² (0 ≤ x ≤ ${a})?`),
      pair(xb, yb),
      [[pair(xb, 2 * yb), 'M_x için ½ çarpanı unutulmuş.', 'Forgot the factor ½ in M_x.'],
        [pair(2 * a / 3, yb), `Yalnız üst eğri (y = ${a}x) ile moment ve alan hesaplanmış.`, `Computed moment and area from the upper curve y = ${a}x only.`],
        [pair(yb, xb), 'x̄ ile ȳ yer değiştirmiş.', 'x̄ and ȳ swapped.'],
        [pair(xb, yb / 2), '½ çarpanı iki kez uygulanmış.', 'Applied the factor ½ twice.']],
      [`A = ∫₀^${a} (${a}x − x²) dx = ${fr(Math.pow(a, 3) / 6)},  M_y = ∫ x(${a}x − x²) dx = ${fr(Math.pow(a, 4) / 12)},  M_x = ½∫ (${a * a}x² − x⁴) dx = ${fr(Math.pow(a, 5) / 15)}.`,
        `x̄ = ${fr(xb)},  ȳ = ${fr(yb)}.`],
      { val: [xb, yb], f: (x) => a * x, g: (x) => x * x, a: 0, b: a });
  }, 3);

  const ctPappus = lvl((rng) => {
    const b = rng.nextInt(2, 6), h = rng.nextInt(1, 4), c = rng.nextInt(1, 4), co = b * h * (2 * c + h);
    return mk(rng, TC(),
      tx(`Köşeleri (0, ${c}), (${b}, ${c}), (${b}, ${c + h}), (0, ${c + h}) olan dikdörtgen plaka x-ekseni etrafında döndürülüyor. Pappus teoremiyle oluşan cismin hacmi kaçtır?`,
        `The rectangular plate with corners (0, ${c}), (${b}, ${c}), (${b}, ${c + h}), (0, ${c + h}) is revolved about the x-axis. What is the volume of the solid by Pappus' theorem?`),
      piS(co),
      [[piS(2 * b * h * c), 'Ağırlık merkezi yerine alt kenarın yüksekliği kullanılmış.', 'Used the height of the bottom edge instead of the centroid.'],
        [piS(2 * b * h * (c + h)), 'Ağırlık merkezi yerine üst kenar kullanılmış.', 'Used the top edge instead of the centroid.'],
        [piS(co / 2), '2π yerine π kullanılmış.', 'Used π instead of 2π.'],
        [piS(b * h * h), 'Eksene olan uzaklık (c) unutulmuş; ȳ = h/2 alınmış.', 'Forgot the distance c to the axis; took ȳ = h/2 only.'],
        [piS(2 * co), 'İki kat: 4π kullanılmış.', 'Doubled: used 4π.'],
        [piS(co + b * h), 'Son adımda toplama hatası.', 'An addition slip in the last step.']],
      [tx(`Ağırlık merkezi ȳ = ${c} + ${h}/2 = ${fr(c + h / 2)}, alan A = ${b}·${h} = ${b * h}.`, `Centroid ȳ = ${c} + ${h}/2 = ${fr(c + h / 2)}, area A = ${b}·${h} = ${b * h}.`),
        `V = 2π·ȳ·A = 2π·${fr(c + h / 2)}·${b * h} = ${piS(co)}.`],
      { val: co * PI, fn: () => PI * (Math.pow(c + h, 2) - c * c), a: 0, b });
  }, 3);

  const Q = window.Calc2Quiz;
  Q.main.push(volMain, shMain, arMain, wkMain, ctMain);
  Q.extra.push(volWasher, volKnown, volPick, volAxis, shSetup, shAxisLeft, shAxisRight, shChoose,
    arLine, arSurface, arHard, arFormula, wkUnits, wkRope, wkBox, wkSetup, ctSym, ctConcept, ctTwo, ctPappus);
})();
