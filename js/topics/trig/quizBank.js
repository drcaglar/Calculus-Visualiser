// Ported from Modules/Preliminaries/QuizBankPart1.vb (module QuizBankTrig, 12 generators) and
// Modules/Trigonometry/QuizBankTrigExtra.vb (18 generators) - the VB TrigonometryModule concatenates both lists.
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const { frac, piStr, exactTrig, gcd } = TrigKit;
  const Q = makeQuestion;
  const mod = (n, m) => ((n % m) + m) % m;
  const plus = (n) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`);
  const par = (v) => (v < 0 ? `(${v})` : String(v));
  const nonZero = (rng, lo, hi) => { let v; do { v = rng.nextInt(lo, hi + 1); } while (v === 0); return v; };
  const fmt1 = (v) => { const r = Math.round(v * 10) / 10; return String(r === 0 ? 0 : r); };
  const roman = (q) => ['I', 'II', 'III', 'IV'][q - 1];
  const isTR = () => I18N.get();
  const decT = (s) => (isTR() ? s : s.replace(/,/g, '.'));
  const ask = (a, b) => ({ a, b });

  // Mirrors IntWrongNotes: specific notes followed by the six generic correct+-1..3 notes.
  function intWrongNotes(...specific) {
    return specific.concat([
      tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'),
      tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'),
      tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'),
      tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'),
      tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'),
      tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'),
    ]);
  }

  // Minimal PlotSpec builder -> {xMin,xMax,yMin,yMax,curves,points,segments}
  class PlotSpec {
    constructor(xMin, xMax, yMin, yMax) {
      this.xMin = xMin; this.xMax = xMax; this.yMin = yMin; this.yMax = yMax;
      this.curves = []; this.points = []; this.segments = [];
    }
    addCurve(f, dashed) { this.curves.push({ f: (x) => { const v = f(x); return typeof v === 'number' && isFinite(v) ? v : NaN; }, dashed: !!dashed }); return this; }
    addSegment(x1, y1, x2, y2, dashed) { this.segments.push({ x1, y1, x2, y2, dashed: !!dashed }); return this; }
    addPoint(x, y, label, hollow) { this.points.push({ x, y, label: label || '', hollow: !!hollow }); return this; }
    // circle -> two semicircle curves
    addCircle(cx, cy, r) {
      const half = (s) => (x) => { const d = r * r - (x - cx) * (x - cx); return d < 0 ? NaN : cy + s * Math.sqrt(d); };
      return this.addCurve(half(1)).addCurve(half(-1));
    }
    // arc of a circle centred at the origin from angle 0 to th (0 < th <= pi) -> upper-semicircle piece
    addArc0(r, th) {
      const lo = r * Math.cos(th);
      return this.addCurve((x) => (x >= lo - 1e-9 && x <= r + 1e-9 ? Math.sqrt(Math.max(0, r * r - x * x)) : NaN));
    }
  }

  // ---------------------------------------------------------------- QuizBankTrig (12)

  const POOL = ['0', '1/2', '√2/2', '√3/2', '1', '-1/2', '-√2/2', '-√3/2', '-1', '√3/3', '√3', '-√3', '-√3/3'];

  function poolNote(v) {
    const mix = tx('Bu, ilgili başka bir açının sin/cos değeridir; sin ile cos ya da bölge işareti karışmış olabilir.', 'This is a sin/cos value of a related angle; sin and cos, or the quadrant sign, may be mixed up.');
    const tn = tx('Bu bir tanjant değeridir; fonksiyon ya da ilgili açı karıştırılmış olabilir.', 'This is a tangent-type value, likely from mixing up the function or a related angle.');
    const ax = tx('Bu, 90° veya 180° gibi eksen açılarındaki değerdir; bu açı eksen üzerinde değil.', 'This is the value at axis angles like 90° or 180°; this angle is not on an axis.');
    switch (v) {
      case '0': return tx('Bu değer 0° veya 90° gibi sınır açılarına aittir; verilen açı için değil.', 'This is a value for boundary angles like 0° or 90°, not for this angle.');
      case '1': case '-1': return ax;
      case '√3/3': case '√3': case '-√3': case '-√3/3': return tn;
      default: return mix;
    }
  }

  function trExact(rng) {
    const angles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
    const deg = rng.pick(angles);
    let fn = rng.pick(['sin', 'cos', 'tan']);
    if (fn === 'tan' && deg % 180 === 90) fn = 'sin';
    const correct = exactTrig(fn, deg);
    const wrongs = shuffleArr(POOL.slice(), rng);
    return Q(tx('Özel açıların trigonometrik değerleri', 'Trigonometric values of special angles'), tx(`${fn} ${deg}° değeri kaçtır?`, `What is the value of ${fn} ${deg}°?`), correct, wrongs,
      [tx('Açıyı bir bölgeye ve 0°, 30°, 45°, 60°, 90° referans açısına indirge.', 'Reduce the angle to its quadrant and a reference angle of 0°, 30°, 45°, 60° or 90°.'), tx(`${fn} ${deg}° = ${correct} (bölgenin işaretine dikkat et).`, `${fn} ${deg}° = ${correct} (mind the sign of the quadrant).`)],
      rng, wrongs.map(poolNote));
  }

  function trDegRad(rng) {
    const deg = rng.pick([30, 45, 60, 90, 120, 135, 150, 210, 240, 270, 300]);
    const correct = piStr(deg, 180);
    return Q(tx('Derece ↔ radyan', 'Degrees ↔ radians'), tx(`${deg}° kaç radyandır?`, `How many radians is ${deg}°?`), correct,
      [piStr(deg, 360), piStr(deg, 90), piStr(deg + 30, 180), piStr(deg - 30, 180)],
      [tx('Radyan = derece × π / 180', 'Radians = degrees × π / 180'), `${deg}·π/180 = ${correct}`], rng,
      [tx('π/180 yerine π/360 kullanmışsın; radyan = derece × π/180.', 'You used π/360 instead of π/180; radians = degrees × π/180.'), tx("π/90 kullanmışsın; dönüşüm çarpanı π/180'dir.", 'You used π/90; the conversion factor is π/180.'), tx('Açıya 30° eklemişsin; dönüşüm toplama değil çarpmadır.', 'You added 30° before converting; the conversion is a multiplication.'), tx('Açıdan 30° çıkarmışsın; dönüşüm toplama değil çarpmadır.', 'You subtracted 30° before converting; the conversion is a multiplication.')]);
  }

  function trRadDeg(rng) {
    const f = rng.pick([[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [3, 2], [5, 4], [4, 3]]);
    const deg = Math.trunc(f[0] * 180 / f[1]);
    return Q(tx('Derece ↔ radyan', 'Degrees ↔ radians'), tx(`${piStr(f[0], f[1])} radyan kaç derecedir?`, `How many degrees is ${piStr(f[0], f[1])} radians?`), `${deg}°`,
      intWrongs(deg, deg * 2, Math.trunc(deg / 2), deg + 30).map((s) => s + '°'),
      [tx('Derece = radyan × 180 / π', 'Degrees = radians × 180 / π'), `(${f[0]}/${f[1]})·180° = ${deg}°`], rng,
      intWrongNotes(tx("Sonucu iki katına çıkarmışsın; π radyan 180°'dir, 360° değil.", 'You doubled the result; π radians is 180°, not 360°.'), tx("Sonucu yarıya bölmüşsün; π radyan 180°'dir, 90° değil.", 'You halved the result; π radians is 180°, not 90°.'), tx('Sonuca 30° eklemişsin; dönüşüm çarpımdır, toplama değil.', 'You added 30° to the result; the conversion is a multiplication.')));
  }

  function trPeriod(rng) {
    const b = rng.pick([2, 3, 4, 6]);
    const fn = rng.nextInt(0, 2) === 0 ? 'sin' : 'cos';
    const q = Q(tx('Periyot', 'Period'), tx(`y = ${fn}(${b}x) fonksiyonunun periyodu nedir?`, `What is the period of y = ${fn}(${b}x)?`), piStr(2, b),
      [piStr(2 * b, 1), piStr(b, 1), piStr(1, b), piStr(1, 2 * b), '2π'],
      [tx(`${fn}(bx) için periyot T = 2π / |b|`, `For ${fn}(bx) the period is T = 2π / |b|`), `T = 2π/${b} = ${piStr(2, b)}`], rng,
      [tx('Periyodu b ile çarpmışsın; b arttıkça periyot kısalır, uzamaz.', 'You multiplied the period by b; a larger b shortens the period.'), tx("Periyodu b·π almışsın; T = 2π'nin b'ye bölünmesidir.", 'You took the period as b·π; it is 2π divided by b.'), tx("2π yerine π kullanmışsın; sin ve cos için temel periyot 2π'dir.", 'You used π/b instead of 2π/b; the basic period of sin and cos is 2π.'), tx("π/(2b) bulmuşsun; 2π/b yerine fazladan bir ikiye bölme yapmışsın.", 'You got π/(2b); the period is 2π/b, without an extra division by 2.'), tx("b'yi hiç hesaba katmamışsın; sin(bx)'te periyot 2π/b'dir, düz 2π değil.", 'You ignored b; for sin(bx) the period is 2π/b, not the plain 2π.')]);
    q.plot = new PlotSpec(-Math.PI, Math.PI, -1.5, 1.5).addCurve((x) => (fn === 'sin' ? Math.sin(b * x) : Math.cos(b * x)));
    return q;
  }

  function trTriple(rng) {
    const t = rng.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]);
    const askCos = rng.nextInt(0, 2) === 0;
    const correct = askCos ? frac(t[1], t[2]) : frac(t[0], t[1]);
    return Q(tx('Temel özdeşlik', 'Fundamental identity'), tx(`sin θ = ${t[0]}/${t[2]} ve θ birinci bölgede ise ${askCos ? 'cos' : 'tan'} θ kaçtır?`, `If sin θ = ${t[0]}/${t[2]} and θ is in the first quadrant, what is ${askCos ? 'cos' : 'tan'} θ?`), correct,
      [frac(t[0], t[1]), frac(t[1], t[2]), frac(t[1], t[0]), frac(t[2], t[1]), frac(t[0], t[2]), frac(t[2], t[0])],
      [`sin²θ + cos²θ = 1  →  cos²θ = 1 - (${t[0]}/${t[2]})²  →  cos θ = ${frac(t[1], t[2])}`, `tan θ = sin θ / cos θ = ${frac(t[0], t[1])}`], rng,
      [tx("Karşı/komşu oranı tan θ'dır; başka bir oran sorulmuş.", 'This is opposite/adjacent, i.e. tan θ, which is a different ratio than the one asked.'), tx("Komşu/hipotenüs oranı cos θ'dır; başka bir oran sorulmuş.", 'This is adjacent/hypotenuse, i.e. cos θ, which is not the ratio asked.'), tx("Komşu/karşı oranı cot θ'dır, tan θ'nın tersidir.", 'This is adjacent/opposite, the reciprocal of tan θ.'), tx("Hipotenüs/komşu oranı sec θ'dır; oranı ters yazmışsın.", 'This is hypotenuse/adjacent, i.e. sec θ; you inverted the ratio.'), tx('Bu verilen sin θ değerinin kendisidir; başka bir oran hesaplaman gerek.', 'This is the given sin θ itself; you must find a different ratio.'), tx("Hipotenüs/karşı oranı csc θ'dır; sin θ'nın tersidir.", 'This is hypotenuse/opposite, the reciprocal of sin θ.')]);
  }

  function trShift(rng) {
    const f = rng.pick([[1, 6], [1, 4], [1, 3], [1, 2]]);
    const c = piStr(f[0], f[1]);
    const right = rng.nextInt(0, 2) === 0;
    const fn = rng.nextInt(0, 2) === 0 ? 'sin' : 'cos';
    const q = Q(tx('Faz kayması', 'Phase shift'), tx(`y = ${fn}(x ${right ? '-' : '+'} ${c}) grafiği y = ${fn} x grafiğinin nasıl kaydırılmışıdır?`, `The graph of y = ${fn}(x ${right ? '-' : '+'} ${c}) is the graph of y = ${fn} x shifted how?`),
      tx(`${c} birim ${right ? 'sağa' : 'sola'}`, `${c} units ${right ? 'right' : 'left'}`),
      [tx(`${c} birim ${right ? 'sola' : 'sağa'}`, `${c} units ${right ? 'left' : 'right'}`), tx(`${c} birim yukarı`, `${c} units up`), tx(`${c} birim aşağı`, `${c} units down`)],
      [tx("y = f(x - c) grafiği f'nin c kadar SAĞA kaymışıdır (işaret ters okunur).", 'The graph of y = f(x - c) is f shifted c units to the RIGHT (the sign reads reversed).'), tx('x + c ise sola kayar.', 'x + c shifts it to the left.')], rng,
      [tx('Kayma yönünü ters okumuşsun: x - c sağa, x + c sola kaydırır.', 'You read the shift direction backwards: x - c shifts right, x + c shifts left.'), tx('Argümandaki kayma yataydır, dikey değil; dışarıya eklenen sabit yukarı kaydırır.', 'A shift inside the argument is horizontal; only a constant added outside moves it up.'), tx('Argümandaki kayma yataydır, dikey değil; dışarıdan çıkarılan sabit aşağı kaydırır.', 'A shift inside the argument is horizontal; only a constant subtracted outside moves it down.')]);
    q.plot = new PlotSpec(-2 * Math.PI, 2 * Math.PI, -1.5, 1.5).addCurve((x) => (fn === 'sin' ? Math.sin(x) : Math.cos(x)));
    return q;
  }

  function trUndefined(rng) {
    const correct = rng.nextInt(0, 2) === 0 ? 90 : 270;
    return Q(tx('Tanjant', 'Tangent'), tx('tan θ aşağıdaki açılardan hangisinde TANIMSIZDIR?', 'At which of the following angles is tan θ UNDEFINED?'), `${correct}°`,
      ['0°', '180°', '45°', '360°', '135°'],
      [tx('tan θ = sin θ / cos θ; cos θ = 0 iken tanımsızdır.', 'tan θ = sin θ / cos θ; it is undefined when cos θ = 0.'), tx('cos θ = 0 olan açılar: 90°, 270°, ...', 'Angles with cos θ = 0: 90°, 270°, ...')], rng,
      [tx("0°'de cos = 1 olduğundan tan 0° = 0 tanımlıdır.", 'At 0°, cos = 1, so tan 0° = 0 is defined.'), tx("180°'de cos = -1 olduğundan tan 180° = 0 tanımlıdır.", 'At 180°, cos = -1, so tan 180° = 0 is defined.'), tx("45°'de sin = cos olduğundan tan 45° = 1 tanımlıdır.", 'At 45°, sin = cos, so tan 45° = 1 is defined.'), tx("360°'de cos = 1 olduğundan tan 360° = 0 tanımlıdır.", 'At 360°, cos = 1, so tan 360° = 0 is defined.'), tx("135°'de cos sıfır değildir; tan 135° = -1 tanımlıdır.", 'At 135°, cos is nonzero; tan 135° = -1 is defined.')]);
  }

  function trIdentity(rng) {
    const T = tx('Trigonometrik özdeşlikler', 'Trigonometric identities');
    switch (rng.nextInt(0, 4)) {
      case 0:
        return Q(T, tx('1 - sin²x ifadesi neye eşittir?', 'What is 1 - sin²x equal to?'), 'cos²x', ['sin²x', 'cos x', '1 + cos²x'],
          [tx('sin²x + cos²x = 1 özdeşliğinden 1 - sin²x = cos²x.', 'From sin²x + cos²x = 1 we get 1 - sin²x = cos²x.')], rng,
          [tx('Pisagor özdeşliğinde sin² ile cos² birbirini tamamlar; sin² çıkarılınca sin² kalmaz.', 'In the Pythagorean identity sin² and cos² complement each other; removing sin² does not leave sin².'), tx('Kareyi kaçırmışsın; özdeşlik sin²x ve cos²x ile ilgilidir.', 'You dropped the square; the identity is about sin²x and cos²x.'), tx('Fazladan bir 1 eklemişsin; 1 - sin²x doğrudan özdeşlikten okunur.', 'You added an extra 1; 1 - sin²x is read directly from the identity.')]);
      case 1:
        return Q(T, tx('1 + tan²x ifadesi neye eşittir?', 'What is 1 + tan²x equal to?'), 'sec²x', ['sin²x', 'csc²x', '2tan x'],
          [tx("sin²x + cos²x = 1'in her iki yanını cos²x'e böl: tan²x + 1 = sec²x.", 'Divide both sides of sin²x + cos²x = 1 by cos²x: tan²x + 1 = sec²x.')], rng,
          [tx("sin²x ile karıştırmışsın; sin²x + cos²x = 1'i cos²x'e bölerek bulunur.", 'You confused it with sin²x; divide sin²x + cos²x = 1 by cos²x to see it.'), tx('1 + cot²x = csc²x özdeşliği ayrıdır; tan ile cot karışmış.', '1 + cot²x = csc²x is the cotangent version; tan and cot are mixed up.'), tx("(1 + tan x)² açılımındaki 2tan x terimini kullanmışsın; burada tan yalnızca karelidir.", 'You used the cross term 2tan x as if squaring (1 + tan x); here tan is only squared.')]);
      case 2:
        return Q(T, tx('sin 2x ifadesi neye eşittir?', 'What is sin 2x equal to?'), '2 sin x cos x', ['2 sin x', 'sin²x - cos²x', 'sin x + cos x'],
          [tx('Çift açı formülü: sin 2x = 2 sin x cos x.', 'Double-angle formula: sin 2x = 2 sin x cos x.')], rng,
          [tx('cos x çarpanını düşürmüşsün; sin 2x hem sin x hem cos x içerir.', 'You dropped the cos x factor; sin 2x involves both sin x and cos x.'), tx("Bu, cos 2x'e benzeyen bir farktır; fonksiyon ve işaret karışmış.", 'This resembles a cos 2x-type difference; the function and sign are mixed up.'), tx('sin 2x = sin x + cos x sanmışsın; sinüs toplam üzerinden dağılmaz.', 'You assumed sin 2x = sin x + cos x; sine does not distribute over sums.')]);
      default:
        return Q(T, tx('cos 2x ifadesi neye eşittir?', 'What is cos 2x equal to?'), 'cos²x - sin²x', ['2 cos x', '2 sin x cos x', 'cos²x + sin²x'],
          [tx('Çift açı formülü: cos 2x = cos²x - sin²x.', 'Double-angle formula: cos 2x = cos²x - sin²x.')], rng,
          [tx("2cos x yazmışsın; cos 2x kareler farkıdır, cos x'in iki katı değil.", 'You wrote 2cos x; cos 2x is a difference of squares, not twice cos x.'), tx('Bu sin 2x formülüdür; sin ile cos\'un çift açı formülleri karışmış.', 'This is the sin 2x formula; the double-angle formulas are mixed up.'), tx("cos²x + sin²x = 1'dir; cos 2x'te işaret eksi olmalı, artı değil.", 'cos²x + sin²x is just 1; the double-angle formula has a minus sign.')]);
    }
  }

  function trSolve(rng) {
    const rows = [['1/2', 1, 6, 5, 6], ['√2/2', 1, 4, 3, 4], ['√3/2', 1, 3, 2, 3]];
    const i = rng.nextInt(0, 3);
    const r = rows[i];
    const pair = (a, b, c, d) => tx(`x = ${piStr(a, b)} ve x = ${piStr(c, d)}`, `x = ${piStr(a, b)} and x = ${piStr(c, d)}`);
    const correct = pair(r[1], r[2], r[3], r[4]);
    const wrongs = [];
    for (let j = 0; j < 3; j++) if (j !== i) wrongs.push(pair(rows[j][1], rows[j][2], rows[j][3], rows[j][4]));
    wrongs.push(pair(r[1], r[2], r[1] + r[2], r[2]));
    wrongs.push(pair(r[3], r[4], r[3] + r[4], r[4]));
    const q = Q(tx('Trigonometrik denklem', 'Trigonometric equation'), tx(`[0, 2π) aralığında sin x = ${r[0]} denkleminin çözümleri hangisidir?`, `Which are the solutions of sin x = ${r[0]} on [0, 2π)?`), correct, wrongs,
      [tx('sin x pozitif: I. ve II. bölgede çözüm vardır.', 'sin x is positive: solutions lie in quadrants I and II.'), tx(`Referans açı ${piStr(r[1], r[2])}; II. bölgede π - referans = ${piStr(r[3], r[4])}.`, `Reference angle ${piStr(r[1], r[2])}; in quadrant II, π - reference = ${piStr(r[3], r[4])}.`)], rng,
      [tx('Bunlar başka bir sin değerinin çözümleridir; verilen değerle karıştırılmış.', 'These are solutions of a different sine value; they do not match the given one.'), tx('Bunlar başka bir sin değerinin çözümleridir; verilen değerle karıştırılmış.', 'These are solutions of a different sine value; they do not match the given one.'), tx('İkinci çözümü π + referans açısı almışsın (III. bölge); sin pozitifse II. bölge gerekir: π - referans.', 'You used π + reference (quadrant III); for positive sine use π minus the reference angle.'), tx('İkinci açıyı π + o açı diye almışsın; III. bölgede sin negatiftir, π - açı gerekir.', 'You used π + angle for the second solution; sine is negative in quadrant III.')]);
    const sv = [0.5, Math.SQRT2 / 2, Math.sqrt(3) / 2][i];
    q.plot = new PlotSpec(-0.5, 6.8, -1.4, 1.4).addCurve((x) => Math.sin(x)).addSegment(0, sv, 2 * Math.PI, sv, true);
    return q;
  }

  function trUnitCircle(rng) {
    const deg = rng.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
    const c = exactTrig('cos', deg), s = exactTrig('sin', deg);
    const neg = (v) => (v.startsWith('-') ? v.substring(1) : '-' + v);
    const q = Q(tx('Birim çember', 'Unit circle'), tx(`θ = ${deg}° için birim çember üzerindeki (cos θ, sin θ) noktası hangisidir?`, `For θ = ${deg}°, which is the point (cos θ, sin θ) on the unit circle?`), `(${c}, ${s})`,
      [`(${s}, ${c})`, `(${neg(c)}, ${s})`, `(${c}, ${neg(s)})`, `(${neg(c)}, ${neg(s)})`],
      [tx("Birim çemberde açının bitim noktası (cos θ, sin θ)'dır.", 'On the unit circle the terminal point of the angle is (cos θ, sin θ).'), `cos ${deg}° = ${c}, sin ${deg}° = ${s}`], rng,
      [tx('Koordinatların sırasını değiştirmişsin: nokta (cos θ, sin θ), (sin θ, cos θ) değil.', 'You swapped the coordinates: the point is (cos θ, sin θ), not (sin θ, cos θ).'), tx('x koordinatının işaretini yanlış almışsın; cos\'un bölgedeki işaretine bak.', 'You gave the x-coordinate the wrong sign; check the sign of cos in the quadrant.'), tx("y koordinatının işaretini yanlış almışsın; sin'in bölgedeki işaretine bak.", 'You gave the y-coordinate the wrong sign; check the sign of sin in the quadrant.'), tx('İki koordinatın işaretini de ters almışsın; bu karşıt bölgenin noktasıdır.', 'You flipped both signs; this is the point in the opposite quadrant.')]);
    const th = deg * Math.PI / 180;
    q.plot = new PlotSpec(-1.5, 1.5, -1.5, 1.5).addCircle(0, 0, 1).addSegment(0, 0, Math.cos(th), Math.sin(th)).addPoint(Math.cos(th), Math.sin(th));
    return q;
  }

  function trArc(rng) {
    const r = rng.nextInt(2, 10);
    const f = rng.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3]]);
    const correct = piStr(r * f[0], f[1]);
    const q = Q(tx('Yay uzunluğu', 'Arc length'), tx(`Yarıçapı ${r} olan bir çemberde, ${piStr(f[0], f[1])} radyanlık merkez açının gördüğü yay uzunluğu kaçtır?`, `In a circle of radius ${r}, what is the arc length subtended by a central angle of ${piStr(f[0], f[1])} radians?`), correct,
      [piStr(f[0], f[1] * r), piStr(r * f[0], f[1] * 2), piStr(r * f[0] * 2, f[1]), piStr(r * f[0] + 1, f[1])],
      [tx('Yay uzunluğu s = r·θ (θ radyan)', 'Arc length s = r·θ (θ in radians)'), `s = ${r}·${piStr(f[0], f[1])} = ${correct}`], rng,
      [tx('Yarıçapa bölmüşsün; yay uzunluğu s = r·θ çarpımıdır.', 'You divided by r; the arc length is the product s = r·θ.'), tx('Sonucu ikiye bölmüşsün; s = r·θ\'da fazladan 1/2 yok (o daire dilimi alanı formülüdür).', 'You halved the result; s = r·θ has no extra 1/2 (that belongs to the sector area).'), tx('Sonucu iki katına çıkarmışsın; s = r·θ, çevre formülüyle karışmış.', 'You doubled the result; s = r·θ, not a circumference-type formula.'), tx('Çarpıma 1 eklemişsin; yarıçap ve açı doğrudan çarpılır.', 'You added 1 to the product r·θ; radius and angle are simply multiplied.')]);
    const th = Math.PI * f[0] / f[1];
    q.plot = new PlotSpec(-r - 1.5, r + 1.5, -r - 1.5, r + 1.5).addSegment(0, 0, r, 0).addSegment(0, 0, r * Math.cos(th), r * Math.sin(th)).addArc0(r, th);
    return q;
  }

  function trRange(rng) {
    const a = rng.nextInt(2, 6), d = nonZero(rng, -4, 4);
    return Q(tx('Genlik ve değer kümesi', 'Amplitude and range'), tx(`y = ${a} sin x ${plus(d)} fonksiyonunun en büyük değeri kaçtır?`, `What is the maximum value of y = ${a} sin x ${plus(d)}?`), String(a + d), intWrongs(a + d, a, d - a, a * d),
      ['-1 ≤ sin x ≤ 1', tx(`En büyük değer: ${a}·1 ${plus(d)} = ${a + d}`, `Maximum value: ${a}·1 ${plus(d)} = ${a + d}`)], rng,
      intWrongNotes(tx('Yalnızca genliği yazmışsın; dikey kayma d eklenmeli.', 'You gave only the amplitude; the vertical shift d must be added.'), tx('Bu, sin x = -1 (en küçük) durumuna benzer bir değerdir; en büyük değer sin x = 1\'de olur.', 'This looks like the sin x = -1 (minimum) case; the maximum occurs at sin x = 1.'), tx("a ile d'yi çarpmışsın; dikey kayma çarpılmaz, eklenir.", 'You multiplied a by d; the vertical shift is added, not multiplied.')));
  }

  // ---------------------------------------------------------------- QuizBankTrigExtra (18)

  const SCT = ['-1', '-√3/2', '-√2/2', '-1/2', '0', '1/2', '√2/2', '√3/2', '1'];
  const SCV = [-1, -Math.sqrt(3) / 2, -Math.sqrt(2) / 2, -0.5, 0, 0.5, Math.sqrt(2) / 2, Math.sqrt(3) / 2, 1];
  const TNT = ['-√3', '-1', '-√3/3', '0', '√3/3', '1', '√3'];
  const TNV = [-Math.sqrt(3), -1, -Math.sqrt(3) / 3, 0, Math.sqrt(3) / 3, 1, Math.sqrt(3)];
  const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];

  function negate(v) { if (v === '0') return v; return v.startsWith('-') ? v.substring(1) : '-' + v; }
  function recip(v) {
    const neg = v.startsWith('-');
    const a = neg ? v.substring(1) : v;
    const map = { '1': '1', '1/2': '2', '√2/2': '√2', '√3/2': '2√3/3', '√3/3': '√3', '√3': '√3/3' };
    const r = map[a] !== undefined ? map[a] : '?';
    return neg ? '-' + r : r;
  }
  function oth() { return tx('Bu, ilgili başka bir açının değeridir.', 'This is the value of a related angle.'); }

  function xRadConv(rng) {
    const topic = tx('Radyan ölçüsü', 'Radian measure');
    if (rng.nextInt(0, 2) === 0) {
      const deg = rng.pick([-45, -60, -90, -120, -135, -150, -210, -225, -300, 390, 405, 420, 480, 540, 600, 660, 720]);
      const c = piStr(deg, 180);
      const coter = deg < 0 ? deg + 360 : deg - 360;
      const wrongs = [piStr(-deg, 180), piStr(deg, 360), piStr(deg, 90), piStr(coter, 180), piStr(deg * 2, 180), piStr(deg + 30, 180)];
      const notes = [
        tx("Açının işaretini ters almışsın; negatif açı negatif radyan verir, büyük açı ise 2π'den büyük kalır.", 'You flipped the sign; a negative angle gives a negative radian measure, and a large angle stays larger than 2π.'),
        tx("π/360 çarpanı kullanmışsın; dönüşüm çarpanı π/180'dir.", 'You used the factor π/360; the conversion factor is π/180.'),
        tx("π/90 çarpanı kullanmışsın; dönüşüm çarpanı π/180'dir.", 'You used the factor π/90; the conversion factor is π/180.'),
        tx('Açıyı tam turla (360°) sadeleştirmişsin; bu eşdeğer bir açıdır ama sorulan açının radyan ölçüsü değildir.', 'You reduced the angle by a full turn (360°); that is a coterminal angle, not the radian measure of the given angle.'),
        tx("Sonucu iki katına çıkarmışsın; π radyan 180°'dir, 360° değil.", 'You doubled the result; π radians is 180°, not 360°.'),
        tx('Açıya 30° eklemişsin gibi bir hesap hatası var; sadece deg × π/180 yapılmalı.', 'There is an arithmetic slip, as if 30° were added; just compute deg × π/180.')];
      return Q(topic, tx(`${deg}° kaç radyandır?`, `How many radians is ${deg}°?`), c, wrongs,
        [tx("Radyan = derece × π / 180. Negatif ve 360°'yi aşan açılar da aynı formülle dönüştürülür.", 'Radians = degrees × π / 180. Negative angles and angles beyond 360° convert with the same formula.'), `${deg}·π/180 = ${c}`], rng, notes);
    }
    const f = rng.pick([[-5, 6], [-3, 4], [-1, 3], [-1, 2], [7, 6], [7, 3], [11, 6], [13, 6], [5, 2], [9, 4], [-7, 4], [10, 3]]);
    const deg = Math.trunc(f[0] * 180 / f[1]);
    const wrongs = [`${deg * 2}°`, `${fmt1(deg / 2)}°`, `${-deg}°`, `${deg + 180}°`, `${deg < 0 ? deg + 360 : deg - 360}°`, `${deg + 90}°`];
    const notes = [
      tx("Sonucu iki katına çıkarmışsın; π radyan 180°'dir, 360° değil.", 'You doubled the result; π radians is 180°, not 360°.'),
      tx("Sonucu yarıya bölmüşsün; π radyan 180°'dir, 90° değil.", 'You halved the result; π radians is 180°, not 90°.'),
      tx('İşareti ters almışsın; negatif radyan negatif derece verir.', 'You flipped the sign; a negative radian measure gives negative degrees.'),
      tx("Sonuca 180° eklemişsin; π'yi 180° ile çarpmak yerine toplamışsın gibi.", 'You added 180°; π should be replaced by 180°, not added.'),
      tx('Eşdeğer (aynı yöndeki) bir açıya indirgemişsin; sorulan açının kendisi değil.', 'You reduced to a coterminal angle instead of converting the given angle.'),
      tx("Sonuca 90° eklemişsin; bir hesap hatası.", 'You added 90°; an arithmetic slip.')];
    return Q(topic, tx(`${piStr(f[0], f[1])} radyan kaç derecedir?`, `How many degrees is ${piStr(f[0], f[1])} radians?`), `${deg}°`, wrongs,
      [tx('Derece = radyan × 180° / π', 'Degrees = radians × 180° / π'), `(${f[0]}/${f[1]})·180° = ${deg}°`], rng, notes);
  }

  function xCoterminal(rng) {
    const d = rng.pick([2, 3, 4, 6]);
    let n, r;
    do { n = rng.nextInt(-3 * d, 5 * d + 1); r = mod(n, 2 * d); } while ((n >= 0 && n < 2 * d) || r === 0);
    const c = piStr(r, d);
    const wrongs = [piStr(Math.abs(n) % (2 * d), d), piStr(mod(n, d), d), piStr(2 * d - r, d), piStr(mod(r + d, 2 * d), d), piStr(mod(r + 1, 2 * d), d), piStr(mod(r - 1, 2 * d), d)];
    const notes = [
      tx('Negatif işaretini yok saymışsın; −θ ile θ aynı yönde değildir.', 'You dropped the minus sign; −θ and θ do not point the same way.'),
      tx("π'nin katlarını çıkarmışsın; eş uçlu açılar 2π'nin (tam turun) katlarıyla bulunur.", 'You subtracted multiples of π; coterminal angles differ by multiples of 2π (a full turn).'),
      tx("Sonucu 2π'ye tamamlamışsın (aynalamışsın); bu başka bir açıdır.", 'You took the complement to 2π (a mirror image); that is a different angle.'),
      tx('Yarım tur (π) kaymış bir açı bulmuşsun; tam tur 2π\'dir.', 'That angle is off by a half turn (π); a full turn is 2π.'),
      tx('Bölme/kalan işleminde küçük bir hata: sonuç bir adım fazla.', 'A small slip in the division/remainder: the result is one step too large.'),
      tx('Bölme/kalan işleminde küçük bir hata: sonuç bir adım eksik.', 'A small slip in the division/remainder: the result is one step too small.')];
    return Q(tx('Eş uçlu açılar', 'Coterminal angles'), tx(`${piStr(n, d)} ile eş uçlu olan ve [0, 2π) aralığında bulunan açı hangisidir?`, `Which angle in [0, 2π) is coterminal with ${piStr(n, d)}?`), c, wrongs,
      [tx('Eş uçlu açılar 2π\'nin tam katları kadar farklıdır: θ + 2πk.', 'Coterminal angles differ by whole multiples of 2π: θ + 2πk.'),
        tx(`${piStr(n, d)} = (${n}/${d})π ve 2π = (${2 * d}/${d})π. Payı ${2 * d} ile böl (mod ${2 * d}): ${n} ≡ ${r}.`, `${piStr(n, d)} = (${n}/${d})π and 2π = (${2 * d}/${d})π. Reduce the numerator mod ${2 * d}: ${n} ≡ ${r}.`),
        tx(`Sonuç: ${c}.`, `Result: ${c}.`)], rng, notes);
  }

  function xArcSector(rng) {
    const r = rng.nextInt(2, 10);
    const deg = rng.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300]);
    const topic = tx('Yay uzunluğu ve daire dilimi', 'Arc length and sector');
    if (rng.nextInt(0, 2) === 0) {
      const c = piStr(r * deg, 180) + ' cm';
      const wrongs = [`${r * deg} cm`, piStr(r * deg, 360) + ' cm', piStr(r * r * deg, 360) + ' cm', piStr(deg, 180) + ' cm', piStr(2 * r * deg, 180) + ' cm', piStr(r * r * deg, 180) + ' cm'];
      const notes = [
        tx('Dereceyi radyana çevirmeden r × θ yapmışsın; s = rθ formülünde θ radyan olmalı.', 'You multiplied r × θ without converting to radians; in s = rθ the angle must be in radians.'),
        tx('π/360 ile çevirmişsin; π/180 olmalı.', 'You converted with π/360; it should be π/180.'),
        tx('Bu daire diliminin alanı formülüdür (½r²θ); yay uzunluğu s = rθ\'dır.', 'That is the sector-area formula (½r²θ); the arc length is s = rθ.'),
        tx('Yarıçapla çarpmayı unutmuşsun; bu sadece radyan cinsinden açıdır.', 'You forgot to multiply by the radius; that is just the angle in radians.'),
        tx('Sonucu iki katına çıkarmışsın; çevirme çarpanını yanlış almış olabilirsin.', 'You doubled the result; the conversion factor may be wrong.'),
        tx('r² kullanmışsın; yay uzunluğunda yarıçap birinci kuvvetten girer.', 'You used r²; the radius appears to the first power in the arc length.')];
      return Q(topic, tx(`Yarıçapı ${r} cm olan bir çemberde ${deg}° merkez açının gördüğü yayın uzunluğu kaç cm'dir?`, `In a circle of radius ${r} cm, what is the length of the arc subtended by a central angle of ${deg}°?`), c, wrongs,
        [tx('Önce radyana çevir: θ = deg·π/180.', 'First convert to radians: θ = deg·π/180.'), `θ = ${piStr(deg, 180)}`, `s = rθ = ${r}·${piStr(deg, 180)} = ${c}`], rng, notes);
    }
    const c = piStr(r * r * deg, 360) + ' cm²';
    const wrongs = [piStr(r * r * deg, 180) + ' cm²', piStr(r * deg, 180) + ' cm²', piStr(r * r * deg, 720) + ' cm²', piStr(r * deg, 360) + ' cm²', `${fmt2(r * r * deg / 2)} cm²`];
    const notes = [
      tx('½ çarpanını unutmuşsun; daire dilimi alanı A = ½r²θ\'dır.', 'You forgot the factor ½; the sector area is A = ½r²θ.'),
      tx('Bu yay uzunluğudur (rθ); alan için ½r²θ kullan.', 'That is the arc length (rθ); use ½r²θ for the area.'),
      tx('½ çarpanını iki kez uygulamışsın.', 'You applied the factor ½ twice.'),
      tx('r² yerine r kullanmışsın; alan yarıçapın karesiyle orantılıdır.', 'You used r instead of r²; area is proportional to the square of the radius.'),
      tx('Dereceyi radyana çevirmeden ½r²θ hesaplamışsın.', 'You computed ½r²θ without converting degrees to radians.')];
    return Q(topic, tx(`Yarıçapı ${r} cm olan bir dairede ${deg}° merkez açılı daire diliminin alanı kaç cm²'dir?`, `What is the area of a sector of angle ${deg}° in a circle of radius ${r} cm?`), c, wrongs,
      [tx("θ'yı radyana çevir: θ = deg·π/180.", 'Convert θ to radians: θ = deg·π/180.'), `θ = ${piStr(deg, 180)}`, `A = ½r²θ = ½·${r * r}·${piStr(deg, 180)} = ${c}`], rng, notes);
  }

  function xSecCscCot(rng) {
    const deg = rng.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
    const kind = rng.nextInt(0, 3);
    const nm = ['sec', 'csc', 'cot'][kind];
    const baseFn = ['cos', 'sin', 'tan'][kind];
    const baseVal = exactTrig(baseFn, deg);
    const c = recip(baseVal);
    const other = kind === 0 ? recip(exactTrig('sin', deg)) : (kind === 1 ? recip(exactTrig('cos', deg)) : exactTrig('cos', deg));
    const otherNm = kind === 0 ? 'csc' : (kind === 1 ? 'sec' : 'cos');
    const wrongs = [baseVal, negate(c), other, '2', '√2', '2√3/3', '√3', '1/2'];
    const notes = [
      tx(`Tersini almayı unutmuşsun: ${nm} θ = 1/${baseFn} θ olduğundan ${baseFn} ${deg}° değeri değil, onun çarpmaya göre tersi gerekir.`, `You forgot to take the reciprocal: ${nm} θ = 1/${baseFn} θ, so you need the reciprocal of ${baseFn} ${deg}°, not ${baseFn} ${deg}° itself.`),
      tx('Bölge işaretini yanlış almışsın; işaret, tersi alınan fonksiyonun işaretiyle aynıdır.', 'You got the quadrant sign wrong; the sign is the same as that of the function being inverted.'),
      tx(`Bu, ${otherNm} ${deg}° değeridir; fonksiyonları karıştırmışsın.`, `That is the value of ${otherNm} ${deg}°; you mixed up the functions.`),
      tx('Bu başka bir özel açının sec/csc değeridir.', 'This is the sec/csc value of another special angle.'),
      tx('Bu başka bir özel açının sec/csc değeridir.', 'This is the sec/csc value of another special angle.'),
      tx('Bu başka bir özel açının sec/csc değeridir.', 'This is the sec/csc value of another special angle.'),
      tx('Bu başka bir özel açının değeridir; ters oranı yanlış bulmuş olabilirsin.', 'This is the value for another special angle; the reciprocal may have been computed wrongly.'),
      tx('Bu bir sin/cos değeridir, tersi alınmamış.', 'This is a sin/cos value that was not inverted.')];
    const defn = ['sec θ = 1/cos θ', 'csc θ = 1/sin θ', 'cot θ = 1/tan θ = cos θ / sin θ'][kind];
    return Q(tx('Altı trigonometrik fonksiyon', 'The six trig functions'), tx(`${nm} ${deg}° değeri kaçtır?`, `What is ${nm} ${deg}°?`), c, wrongs,
      [defn, tx(`${baseFn} ${deg}° = ${baseVal} (bölge işaretine dikkat et).`, `${baseFn} ${deg}° = ${baseVal} (mind the quadrant sign).`), `${nm} ${deg}° = 1/(${baseVal}) = ${c}`], rng, notes);
  }

  function xQuadSigns(rng) {
    const fns = ['sin θ', 'cos θ', 'tan θ', 'csc θ', 'sec θ', 'cot θ'];
    const topic = tx('Bölgelere göre işaretler', 'Signs by quadrant');
    if (rng.nextInt(0, 2) === 0) {
      const negs = shuffleArr(['sin θ', 'cos θ', 'csc θ', 'sec θ'], rng);
      const correct = negs[0];
      const wrongs = ['tan θ', 'cot θ', 'sin θ · cos θ'];
      const notes = [
        tx('tan θ = y/x: III. bölgede hem x hem y negatiftir, oran POZİTİFtir.', 'tan θ = y/x: in quadrant III both x and y are negative, so the ratio is POSITIVE.'),
        tx('cot θ = x/y: III. bölgede iki negatifin oranı POZİTİFtir.', 'cot θ = x/y: in quadrant III the ratio of two negatives is POSITIVE.'),
        tx('İki negatif sayının çarpımı pozitiftir: sin θ · cos θ > 0.', 'The product of two negative numbers is positive: sin θ · cos θ > 0.')];
      return Q(topic, tx('θ üçüncü bölgede (III. bölge) ise aşağıdakilerden hangisi NEGATİFTİR?', 'If θ is in quadrant III, which of the following is NEGATIVE?'), correct, wrongs,
        [tx('III. bölgede x < 0 ve y < 0 (r > 0).', 'In quadrant III, x < 0 and y < 0 (r > 0).'),
          tx('sin θ = y/r ve csc θ = r/y negatif; cos θ = x/r ve sec θ = r/x negatif.', 'sin θ = y/r and csc θ = r/y are negative; cos θ = x/r and sec θ = r/x are negative.'),
          tx('tan θ = y/x ve cot θ = x/y pozitiftir (iki negatifin oranı).', 'tan θ = y/x and cot θ = x/y are positive (ratio of two negatives).')], rng, notes);
    }
    const q = rng.nextInt(2, 5);
    const sx = q === 4 ? 1 : -1, sy = q === 2 ? 1 : -1;
    const sgn = (i) => (i === 0 || i === 3 ? sy : (i === 1 || i === 4 ? sx : sx * sy));
    const pos = [], neg = [];
    for (let i = 0; i < 6; i++) (sgn(i) > 0 ? pos : neg).push(i);
    shuffleArr(pos, rng); shuffleArr(neg, rng);
    const correct = fns[pos[0]];
    const wrongs = [], notes = [];
    for (let k = 0; k < 3; k++) {
      const i = neg[k];
      wrongs.push(fns[i]);
      const why = (i === 0 || i === 3) ? `y ${sy < 0 ? '< 0' : '> 0'}` : ((i === 1 || i === 4) ? `x ${sx < 0 ? '< 0' : '> 0'}` : tx('x ve y zıt işaretli', 'x and y have opposite signs'));
      notes.push(tx(`${fns[i]} bu bölgede NEGATİFtir: işareti ${why} ile belirlenir.`, `${fns[i]} is NEGATIVE in this quadrant: its sign is determined by ${why}.`));
    }
    return Q(topic, tx(`θ, ${roman(q)}. bölgede ise aşağıdakilerden hangisi POZİTİFTİR?`, `If θ is in quadrant ${roman(q)}, which of the following is POSITIVE?`), correct, wrongs,
      [tx(`${roman(q)}. bölgede x ${sx < 0 ? '< 0' : '> 0'}, y ${sy < 0 ? '< 0' : '> 0'}.`, `In quadrant ${roman(q)}, x ${sx < 0 ? '< 0' : '> 0'} and y ${sy < 0 ? '< 0' : '> 0'}.`),
        tx("sin θ ve csc θ y'nin, cos θ ve sec θ x'in, tan θ ve cot θ y/x'in işaretini taşır.", 'sin θ and csc θ carry the sign of y, cos θ and sec θ the sign of x, tan θ and cot θ the sign of y/x.'),
        tx(`Pozitif olan: ${correct}.`, `The positive one: ${correct}.`)], rng, notes);
  }

  function xGivenQuad(rng) {
    const t = rng.pick(TRIP.slice(0, 4));
    const swap = rng.nextInt(0, 2) === 0;
    const A = swap ? t[1] : t[0], B = swap ? t[0] : t[1], C = t[2];
    const sy = rng.nextInt(0, 2) === 0 ? 1 : -1;
    let sx = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const y = sy * A;
    let x = sx * B;
    let q = (sx > 0 && sy > 0) ? 1 : ((sx < 0 && sy > 0) ? 2 : (sx < 0 ? 3 : 4));
    if (q === 1) { sx = -1; x = -B; q = 2; }
    const askCot = rng.nextInt(0, 2) === 0;
    const nm = askCot ? 'cot' : 'sec';
    const cor = askCot ? frac(x, y) : frac(C, x);
    let wrongs, notes;
    if (askCot) {
      wrongs = [frac(-x, y), frac(y, x), frac(x, C), frac(C, y), frac(B, A)];
      notes = [
        tx("cos θ'nın işaretini (x < 0) yanlış almışsın; cot θ = x/y.", 'You got the sign of x wrong; cot θ = x/y.'),
        tx("Bu tan θ = y/x'tir; cot θ onun tersidir.", 'That is tan θ = y/x; cot θ is its reciprocal.'),
        tx("Bu cos θ = x/r'dir; cot θ = x/y.", 'That is cos θ = x/r; cot θ = x/y.'),
        tx("Bu csc θ = r/y'dir.", 'That is csc θ = r/y.'),
        tx('Bölgeye göre işareti belirlemeyi unutmuşsun; kenar oranı pozitif kalmış.', 'You forgot to apply the quadrant sign; the side ratio was left positive.')];
    } else {
      wrongs = [frac(C, -x), frac(x, C), frac(C, y), frac(y, x), frac(C, B)];
      notes = [
        tx("cos θ'nın işaretini yanlış almışsın; sec θ = r/x ve x'in işareti bölgeye bağlıdır.", 'You got the sign of cos θ wrong; sec θ = r/x and the sign of x depends on the quadrant.'),
        tx("Bu cos θ = x/r'dir; sec θ onun tersidir.", 'That is cos θ = x/r; sec θ is its reciprocal.'),
        tx("Bu csc θ = r/y'dir; sec θ = r/x.", 'That is csc θ = r/y; sec θ = r/x.'),
        tx("Bu tan θ = y/x'tir.", 'That is tan θ = y/x.'),
        tx(`Bölge işaretini unutmuşsun; sec θ bu bölgede ${x < 0 ? 'negatif (x < 0)' : 'pozitif (x > 0)'}.`, `You forgot the quadrant sign; sec θ is ${x < 0 ? 'negative (x < 0)' : 'positive (x > 0)'} here.`)];
    }
    return Q(tx('Verilen oran ve bölgeden değer bulma', 'Finding values from a ratio and a quadrant'),
      tx(`sin θ = ${frac(y, C)} ve θ, ${roman(q)}. bölgededir. ${nm} θ kaçtır?`, `sin θ = ${frac(y, C)} and θ is in quadrant ${roman(q)}. What is ${nm} θ?`), cor, wrongs,
      [tx(`sin θ = y/r: y = ${y}, r = ${C}. Pisagor: |x| = √(${C}² − ${A}²) = ${B}.`, `sin θ = y/r: y = ${y}, r = ${C}. Pythagoras: |x| = √(${C}² − ${A}²) = ${B}.`),
        tx(`${roman(q)}. bölgede x ${x < 0 ? '< 0' : '> 0'} ⇒ x = ${x}.`, `In quadrant ${roman(q)}, x ${x < 0 ? '< 0' : '> 0'} ⇒ x = ${x}.`),
        askCot ? `cot θ = x/y = ${x}/${par(y)} = ${cor}` : `sec θ = r/x = ${C}/${par(x)} = ${cor}`], rng, notes);
  }

  function xDomRange6(rng) {
    const fn = rng.nextInt(0, 4);
    const nm = ['tan', 'cot', 'sec', 'csc'][fn];
    const aspect = rng.nextInt(0, 3);
    const topic = tx('Tanjant, kotanjant, sekant, kosekant', 'tan, cot, sec, csc');
    if (aspect === 0) {
      const cosType = fn === 0 || fn === 2;
      const c = cosType ? 'x ≠ π/2 + kπ' : 'x ≠ kπ';
      const wrongs = [cosType ? 'x ≠ kπ' : 'x ≠ π/2 + kπ', 'x ≠ 2kπ', 'x ≠ kπ/2', 'x ∈ ℝ'];
      const notes = [
        cosType ? tx('x ≠ kπ, sin x = 0 noktalarıdır; tan ve sec cos x = 0 noktalarında tanımsızdır.', 'x ≠ kπ are the zeros of sin x; tan and sec are undefined where cos x = 0.')
          : tx('x ≠ π/2 + kπ, cos x = 0 noktalarıdır; cot ve csc sin x = 0 noktalarında tanımsızdır.', 'x ≠ π/2 + kπ are the zeros of cos x; cot and csc are undefined where sin x = 0.'),
        tx('Yalnızca çift katları çıkarmışsın; sin x = 0 her π\'de olur.', 'You only excluded even multiples; sin x = 0 at every multiple of π.'),
        tx('Hem sin x = 0 hem cos x = 0 noktalarını çıkarmışsın; çok fazla nokta dışlandı.', 'You excluded the zeros of both sin x and cos x; too many points were removed.'),
        tx('Paydada sin x veya cos x var ve sıfır olur; tanım kümesi tüm ℝ değildir.', 'The denominator (sin x or cos x) vanishes somewhere, so the domain is not all of ℝ.')];
      const den = cosType ? 'cos x' : 'sin x';
      const sol = [`${nm} x = ${['sin x / cos x', 'cos x / sin x', '1 / cos x', '1 / sin x'][fn]}`,
        tx(`Payda ${den} = 0 olduğunda tanımsızdır.`, `It is undefined where the denominator ${den} = 0.`),
        tx(`${den} = 0 ⇒ ${c}.`, `${den} = 0 ⇒ ${c}.`)];
      return Q(topic, tx(`y = ${nm} x fonksiyonunun tanım kümesi hangisidir? (k ∈ ℤ)`, `What is the domain of y = ${nm} x? (k ∈ ℤ)`), c, wrongs, sol, rng, notes);
    }
    if (aspect === 1) {
      const all = fn <= 1;
      const c = all ? '(−∞, ∞)' : '(−∞, −1] ∪ [1, ∞)';
      const wrongs = [all ? '(−∞, −1] ∪ [1, ∞)' : '(−∞, ∞)', '[−1, 1]', '(−1, 1)', '[1, ∞)'];
      const notes = [
        all ? tx('Bu sec ve csc\'nin görüntü kümesidir; tan ve cot her değeri alır.', 'That is the range of sec and csc; tan and cot take every real value.')
          : tx("Bu tan ve cot'un görüntü kümesidir; sec ve csc'nin |değeri| ≥ 1'dir (sin, cos |değeri| ≤ 1 olduğundan).", 'That is the range of tan and cot; |sec| and |csc| are ≥ 1 because |sin|, |cos| ≤ 1.'),
        tx("Bu sin ve cos'un görüntü kümesidir.", 'That is the range of sin and cos.'),
        tx('Açık aralık (−1, 1) bu fonksiyonların hiçbirinin görüntü kümesi değildir.', 'The open interval (−1, 1) is not the range of any of these functions.'),
        tx('Negatif değerleri de unutma: sec ve csc ≤ −1 değerlerini de alır.', 'Do not forget the negative values: sec and csc also take values ≤ −1.')];
      const bn = fn === 2 ? 'cos' : 'sin';
      const sol = all
        ? [tx(`${nm} x sinüs/kosinüs oranıdır; payda sıfıra yaklaştıkça sınırsız büyür ve her iki işaretten sonsuza gider.`, `${nm} x is a ratio of sin and cos; as the denominator tends to 0 it grows without bound in both signs.`), tx('Her reel değer alınır: görüntü kümesi (−∞, ∞).', 'Every real value is attained: the range is (−∞, ∞).')]
        : [tx(`${nm} x = 1/${bn} x ve |${bn} x| ≤ 1.`, `${nm} x = 1/${bn} x and |${bn} x| ≤ 1.`), tx('Bir sayının tersi, mutlak değeri ≤ 1 ise mutlak değeri ≥ 1 olur.', 'The reciprocal of a number with absolute value ≤ 1 has absolute value ≥ 1.'), tx('Görüntü kümesi: (−∞, −1] ∪ [1, ∞).', 'Range: (−∞, −1] ∪ [1, ∞).')];
      return Q(topic, tx(`y = ${nm} x fonksiyonunun görüntü kümesi hangisidir?`, `What is the range of y = ${nm} x?`), c, wrongs, sol, rng, notes);
    }
    const isPi = fn <= 1;
    const c = isPi ? 'π' : '2π';
    const wrongs = [isPi ? '2π' : 'π', 'π/2', '4π', '3π/2'];
    const notes = [
      isPi ? tx("2π, sin ve cos'un (ve sec, csc'nin) periyodudur; tan ve cot daha kısa sürede, π'de tekrarlanır.", '2π is the period of sin and cos (and sec, csc); tan and cot already repeat after π.')
        : tx("π, tan ve cot'un periyodudur; sec ve csc bir tam tur (2π) gerektirir (işaret π'de ters döner).", 'π is the period of tan and cot; sec and csc need a full turn (2π), their sign flips after π.'),
      tx("π/2'de fonksiyonun değerleri henüz tekrarlanmaz.", 'The function values do not repeat after π/2.'),
      tx('4π bir periyodun katıdır ama en küçük pozitif periyot değildir.', '4π is a multiple of a period but not the smallest positive one.'),
      tx('3π/2 bu fonksiyonlar için bir periyot değildir.', '3π/2 is not a period of these functions.')];
    const bn = fn === 2 ? 'cos' : 'sin';
    const sol = isPi
      ? [tx('tan(x + π) = tan x ve cot(x + π) = cot x.', 'tan(x + π) = tan x and cot(x + π) = cot x.'), tx("π'den küçük pozitif bir periyot yok: en küçük periyot π.", 'No positive period smaller than π exists: the smallest period is π.')]
      : [tx(`${nm} x = 1/${bn} x ve ${bn} x'in periyodu 2π.`, `${nm} x = 1/${bn} x and ${bn} x has period 2π.`), tx("x'e π eklenince işaret ters döner, bu yüzden en küçük periyot 2π.", 'Adding π flips the sign, so the smallest period is 2π.')];
    return Q(topic, tx(`y = ${nm} x fonksiyonunun (en küçük pozitif) periyodu nedir?`, `What is the (smallest positive) period of y = ${nm} x?`), c, wrongs, sol, rng, notes);
  }

  function xSumAngle(rng) {
    const e = rng.nextInt(0, 8);
    let text, dec, c, wrongs, notes;
    const sw = tx('Toplam/fark formülünde işareti ters almışsın.', 'You used the wrong sign in the sum/difference formula.');
    const lin = tx('sin(A + B) = sin A + sin B gibi doğrusal açmışsın; açılım böyle çalışmaz.', 'You expanded linearly, e.g. sin(A + B) = sin A + sin B; the formulas do not work that way.');
    const neg = tx('Bölge işaretini yanlış almışsın.', 'You got the quadrant sign wrong.');
    const o = oth();
    switch (e) {
      case 0:
        text = 'sin 75°'; c = '(√6 + √2)/4';
        dec = 'sin(45° + 30°) = sin 45° cos 30° + cos 45° sin 30° = (√2/2)(√3/2) + (√2/2)(1/2)';
        wrongs = ['(√6 − √2)/4', '(√2 + 1)/2', '−(√6 + √2)/4', '√6/4', '(√3 + 1)/2']; notes = [sw, lin, neg, o, o]; break;
      case 1:
        text = 'cos 75°'; c = '(√6 − √2)/4';
        dec = 'cos(45° + 30°) = cos 45° cos 30° − sin 45° sin 30° = (√2/2)(√3/2) − (√2/2)(1/2)';
        wrongs = ['(√6 + √2)/4', '(√2 + √3)/2', '(√2 − √6)/4', '√6/4', '(√3 − 1)/2']; notes = [sw, lin, neg, o, o]; break;
      case 2:
        text = 'sin 15°'; c = '(√6 − √2)/4';
        dec = 'sin(45° − 30°) = sin 45° cos 30° − cos 45° sin 30° = (√2/2)(√3/2) − (√2/2)(1/2)';
        wrongs = ['(√6 + √2)/4', '(√2 − 1)/2', '(√2 − √6)/4', '√6/4', '(√3 − 1)/2']; notes = [sw, lin, neg, o, o]; break;
      case 3:
        text = 'cos 15°'; c = '(√6 + √2)/4';
        dec = 'cos(45° − 30°) = cos 45° cos 30° + sin 45° sin 30° = (√2/2)(√3/2) + (√2/2)(1/2)';
        wrongs = ['(√6 − √2)/4', '(√2 − √3)/2', '−(√6 + √2)/4', '√6/4', '(√3 + 1)/2']; notes = [sw, lin, neg, o, o]; break;
      case 4:
        text = 'tan 75°'; c = '2 + √3';
        dec = 'tan(45° + 30°) = (tan 45° + tan 30°)/(1 − tan 45° tan 30°) = (1 + √3/3)/(1 − √3/3) = (3 + √3)/(3 − √3) = 2 + √3';
        wrongs = ['2 − √3', '1 + √3/3', '√3 − 2', '(√6 + √2)/4', '√3'];
        notes = [sw, tx('tan(A + B) = tan A + tan B diye açmışsın; paydadaki 1 − tan A tan B\'yi unutmuşsun.', 'You expanded tan(A + B) = tan A + tan B; the denominator 1 − tan A tan B is missing.'), neg, o, o]; break;
      case 5:
        text = 'tan 15°'; c = '2 − √3';
        dec = 'tan(45° − 30°) = (tan 45° − tan 30°)/(1 + tan 45° tan 30°) = (1 − √3/3)/(1 + √3/3) = (3 − √3)/(3 + √3) = 2 − √3';
        wrongs = ['2 + √3', '1 − √3/3', '√3 − 2', '(√6 − √2)/4', '√3/3'];
        notes = [sw, tx('tan(A − B) = tan A − tan B diye açmışsın; paydadaki 1 + tan A tan B\'yi unutmuşsun.', 'You expanded tan(A − B) = tan A − tan B; the denominator 1 + tan A tan B is missing.'), neg, o, o]; break;
      case 6:
        text = 'cos 105°'; c = '(√2 − √6)/4';
        dec = 'cos(60° + 45°) = cos 60° cos 45° − sin 60° sin 45° = (1/2)(√2/2) − (√3/2)(√2/2)';
        wrongs = ['(√6 − √2)/4', '(√6 + √2)/4', '−(√6 + √2)/4', '(1 + √3)/2', '√2/4']; notes = [neg, sw, o, lin, o]; break;
      default:
        text = 'sin 105°'; c = '(√6 + √2)/4';
        dec = 'sin(60° + 45°) = sin 60° cos 45° + cos 60° sin 45° = (√3/2)(√2/2) + (1/2)(√2/2)';
        wrongs = ['(√6 − √2)/4', '(√3 + 1)/2', '(√2 − √6)/4', '√6/4', '−(√6 + √2)/4']; notes = [sw, lin, neg, o, neg];
    }
    return Q(tx('Toplam ve fark formülleri', 'Sum and difference formulas'), tx(`${text} değeri kaçtır?`, `What is the value of ${text}?`), c, wrongs,
      [tx('Açıyı bilinen özel açıların toplamı/farkı olarak yaz ve formülü uygula:', 'Write the angle as a sum/difference of special angles and apply the formula:'), dec, `${text} = ${c}`], rng, notes);
  }

  function xDoubleAngle(rng) {
    const t = rng.pick(TRIP.slice(0, 4));
    const swap = rng.nextInt(0, 2) === 0;
    const A = swap ? t[1] : t[0], B = swap ? t[0] : t[1], C = t[2];
    const q2 = rng.nextInt(0, 2) === 0;
    const sb = q2 ? -B : B;
    const askSin = rng.nextInt(0, 2) === 0;
    const quad = q2 ? 'II' : 'I';
    let cor, wrongs, notes, last;
    if (askSin) {
      const num = 2 * A * sb, den = C * C;
      cor = frac(num, den);
      wrongs = [frac(-num, den), frac(2 * A, C), frac(A * sb, den), frac(2 * A * A, den), frac(2 * sb, C)];
      notes = [
        tx("cos θ'nın işaretini (bölgeye göre) yanlış almışsın.", 'You used the wrong sign for cos θ (it depends on the quadrant).'),
        tx("Bu 2 sin θ'dır; sin 2θ = 2 sin θ cos θ, cos θ'yı da katmalısın.", 'That is 2 sin θ; sin 2θ = 2 sin θ cos θ needs cos θ as well.'),
        tx('2 çarpanını unutmuşsun: sin 2θ = 2 sin θ cos θ.', 'You forgot the factor 2: sin 2θ = 2 sin θ cos θ.'),
        tx("Bu 2 sin²θ'dır; sin 2θ = 2 sin θ cos θ.", 'That is 2 sin²θ; sin 2θ = 2 sin θ cos θ.'),
        tx("Bu 2 cos θ'dır; sin 2θ = 2 sin θ cos θ.", 'That is 2 cos θ; sin 2θ = 2 sin θ cos θ.')];
      last = `sin 2θ = 2 sin θ cos θ = 2·(${frac(A, C)})·(${frac(sb, C)}) = ${cor}`;
    } else {
      const num = C * C - 2 * A * A, den = C * C;
      cor = frac(num, den);
      wrongs = [frac(-num, den), frac(2 * A * A, den), frac(C * C - A * A, den), frac(2 * A, C), frac(A * A - B * B, den), frac(2 * A * sb, den)];
      notes = [
        tx('İşareti ters almışsın: cos 2θ = 1 − 2 sin²θ.', 'You flipped the sign: cos 2θ = 1 − 2 sin²θ.'),
        tx("Bu 2 sin²θ'dır; 1'den çıkarmayı unutmuşsun.", 'That is 2 sin²θ; you forgot to subtract it from 1.'),
        tx("Bu cos²θ'dır; cos 2θ = 1 − 2 sin²θ ya da cos²θ − sin²θ.", 'That is cos²θ; cos 2θ = 1 − 2 sin²θ or cos²θ − sin²θ.'),
        tx("Bu 2 sin θ'dır; kareleri alman gerekiyordu.", 'That is 2 sin θ; you needed squares.'),
        tx('sin² − cos² almışsın; cos 2θ = cos²θ − sin²θ.', 'You computed sin² − cos²; cos 2θ = cos²θ − sin²θ.'),
        tx("Bu sin 2θ'dır; cos 2θ başka bir formüle sahip.", 'That is sin 2θ; cos 2θ has a different formula.')];
      last = `cos 2θ = 1 − 2 sin²θ = 1 − 2(${frac(A, C)})² = ${cor}`;
    }
    const w = askSin ? 'sin 2θ' : 'cos 2θ';
    return Q(tx('Çift açı formülleri', 'Double-angle formulas'),
      tx(`sin θ = ${frac(A, C)} ve θ, ${quad}. bölgededir. ${w} kaçtır?`, `sin θ = ${frac(A, C)} and θ is in quadrant ${quad}. What is ${w}?`), cor, wrongs,
      [tx(`cos θ'yı bul: cos²θ = 1 − sin²θ ⇒ |cos θ| = ${B}/${C}; ${quad}. bölgede cos θ ${q2 ? '< 0' : '> 0'} ⇒ cos θ = ${frac(sb, C)}.`, `Find cos θ: cos²θ = 1 − sin²θ ⇒ |cos θ| = ${B}/${C}; in quadrant ${quad}, cos θ ${q2 ? '< 0' : '> 0'} ⇒ cos θ = ${frac(sb, C)}.`), last], rng, notes);
  }

  function xHalfAngle(rng) {
    const e = rng.nextInt(0, 5);
    let text, c, how, wrongs, notes;
    const nm1 = tx('Formülü doğru kullanmışsın ama kareköküyle birlikte payda 2\'ye bölmeyi yanlış yapmışsın.', 'A slip with the square root and the division by 2.');
    const nSq = tx('Karekökü almayı unutmuşsun; yarım açı formülü bir karekök içerir.', 'You forgot the square root; the half-angle formula contains a square root.');
    const nSw = tx('cos ile sin formüllerini karıştırmışsın (1 + cos θ ile 1 − cos θ).', 'You mixed up the cos and sin formulas (1 + cos θ versus 1 − cos θ).');
    const looks = tx('Bu bir özel açının değeri gibi görünüyor, ama 22,5° için doğru değil.', 'This looks like a special-angle value, but it is not correct for 22.5°.');
    switch (e) {
      case 0:
        text = 'cos 22,5°'; c = '√(2 + √2)/2';
        how = tx('cos(θ/2) = √((1 + cos θ)/2) alıp θ = 45° yaz: √((1 + √2/2)/2) = √((2 + √2)/4) = √(2 + √2)/2. (22,5° I. bölgede, cos > 0.)', 'Use cos(θ/2) = √((1 + cos θ)/2) with θ = 45°: √((1 + √2/2)/2) = √((2 + √2)/4) = √(2 + √2)/2. (22.5° is in quadrant I, cos > 0.)');
        wrongs = ['√(2 − √2)/2', '(2 + √2)/4', '√(2 + √2)/4', '√2/4', '−√(2 + √2)/2']; notes = [nSw, nSq, nm1, looks, tx('Kosinüs I. bölgede pozitiftir.', 'Cosine is positive in quadrant I.')]; break;
      case 1:
        text = 'sin 22,5°'; c = '√(2 − √2)/2';
        how = tx('sin(θ/2) = √((1 − cos θ)/2) alıp θ = 45° yaz: √((1 − √2/2)/2) = √((2 − √2)/4) = √(2 − √2)/2.', 'Use sin(θ/2) = √((1 − cos θ)/2) with θ = 45°: √((1 − √2/2)/2) = √((2 − √2)/4) = √(2 − √2)/2.');
        wrongs = ['√(2 + √2)/2', '(2 − √2)/4', '√(2 − √2)/4', '√2/4', '−√(2 − √2)/2']; notes = [nSw, nSq, nm1, looks, tx('Sinüs I. bölgede pozitiftir.', 'Sine is positive in quadrant I.')]; break;
      case 2:
        text = 'tan 22,5°'; c = '√2 − 1';
        how = tx('tan(θ/2) = (1 − cos θ)/sin θ ile θ = 45°: (1 − √2/2)/(√2/2) = (2 − √2)/√2 = √2 − 1.', 'Use tan(θ/2) = (1 − cos θ)/sin θ with θ = 45°: (1 − √2/2)/(√2/2) = (2 − √2)/√2 = √2 − 1.');
        wrongs = ['√2 + 1', '2 − √2', '√2/2', '1 − √2/2', '√2 − 2'];
        notes = [tx("Bu tan 67,5°'dir; 22,5° küçük açıdır, tanjantı 1'den küçüktür.", 'That is tan 67.5°; 22.5° is small, so its tangent is below 1.'), tx("Paydadaki sin 45° ile bölmeyi unutmuşsun.", 'You did not divide by sin 45°.'), oth(), tx("Pay doğru ama sin θ'ya bölmeyi unutmuşsun.", 'The numerator is right but you did not divide by sin θ.'), tx('Bölme sırasında işlem hatası.', 'An arithmetic slip in the division.')]; break;
      case 3:
        text = 'cos 67,5°'; c = '√(2 − √2)/2';
        how = tx('67,5° = 135°/2: cos(θ/2) = √((1 + cos 135°)/2) = √((1 − √2/2)/2) = √(2 − √2)/2 (67,5° I. bölgede, cos > 0).', '67.5° = 135°/2: cos(θ/2) = √((1 + cos 135°)/2) = √((1 − √2/2)/2) = √(2 − √2)/2 (67.5° is in quadrant I, cos > 0).');
        wrongs = ['√(2 + √2)/2', '−√(2 − √2)/2', '(2 − √2)/4', '√(2 − √2)/4', '√2/4'];
        notes = [tx('cos 135° = −√2/2\'nin işaretini kaybetmişsin (|cos 135°| kullanmışsın).', 'You lost the sign of cos 135° = −√2/2 (used |cos 135°|).'), tx('Kosinüs I. bölgede pozitiftir; negatif işaret yanlış.', 'Cosine is positive in quadrant I; the negative sign is wrong.'), nSq, nm1, oth()]; break;
      default:
        text = 'sin 67,5°'; c = '√(2 + √2)/2';
        how = tx('67,5° = 135°/2: sin(θ/2) = √((1 − cos 135°)/2) = √((1 + √2/2)/2) = √(2 + √2)/2.', '67.5° = 135°/2: sin(θ/2) = √((1 − cos 135°)/2) = √((1 + √2/2)/2) = √(2 + √2)/2.');
        wrongs = ['√(2 − √2)/2', '−√(2 + √2)/2', '(2 + √2)/4', '√(2 + √2)/4', '√2/4'];
        notes = [tx('cos 135° = −√2/2\'nin işaretini kaçırmışsın.', 'You missed the sign of cos 135° = −√2/2.'), tx('Sinüs I. bölgede pozitiftir.', 'Sine is positive in quadrant I.'), nSq, nm1, oth()];
    }
    return Q(tx('Yarım açı formülleri', 'Half-angle formulas'), tx(`${text} değeri kaçtır?`, `What is the value of ${text.replace(',', '.')}?`), c, wrongs,
      [tx('Yarım açı formülleri: sin²(θ/2) = (1 − cos θ)/2, cos²(θ/2) = (1 + cos θ)/2.', 'Half-angle formulas: sin²(θ/2) = (1 − cos θ)/2, cos²(θ/2) = (1 + cos θ)/2.'), how, `${text.replace(',', isTR() ? ',' : '.')} = ${c}`], rng, notes);
  }

  const SIMPLIFY = [
    ['1 − cos²x', 'sin²x', () => tx('sin²x + cos²x = 1 ⇒ 1 − cos²x = sin²x.', 'sin²x + cos²x = 1 ⇒ 1 − cos²x = sin²x.'), ['cos²x', '−sin²x', 'sin x', '1 + sin²x'],
      () => [tx('1 − sin²x = cos²x olurdu; burada çıkarılan cos²x\'tir, kalan sin²x.', '1 − sin²x would be cos²x; here cos²x is subtracted, leaving sin²x.'), tx('İşareti ters almışsın; sin²x negatif olamaz.', 'You flipped the sign; sin²x cannot be negative.'), tx('Kareyi kaybetmişsin.', 'You lost the square.'), tx('Pisagor özdeşliğinde 1 ile toplama yok; çıkarma var.', 'In the Pythagorean identity there is no sum with 1; it is a subtraction.')]],
    ['tan x · cos x', 'sin x', () => tx('tan x = sin x / cos x ⇒ tan x · cos x = sin x.', 'tan x = sin x / cos x ⇒ tan x · cos x = sin x.'), ['1', 'cos x', 'sec x', 'cos²x / sin x'],
      () => [tx("tan x'in tersi cot x'tir, cos x değil; sadeleşme 1 vermez.", 'The reciprocal of tan x is cot x, not cos x; it does not cancel to 1.'), tx('tan x = sin x / cos x olduğundan cos x sadeleşir ve sin x kalır.', 'tan x = sin x / cos x, so cos x cancels and leaves sin x.'), tx("sec x = 1/cos x'tir; ilgisiz bir dönüşüm.", 'sec x = 1/cos x; an unrelated conversion.'), tx("tan x'i ters yazmışsın (cos x / sin x).", 'You wrote tan x upside down (cos x / sin x).')]],
    ['sin x / tan x', 'cos x', () => tx('sin x / (sin x / cos x) = cos x.', 'sin x / (sin x / cos x) = cos x.'), ['sec x', '1', 'sin²x / cos x', 'tan x'],
      () => [tx("tan x'e bölmek ile 1/cos x elde etmek farklıdır.", 'Dividing by tan x is not the same as getting 1/cos x.'), tx("sin x'i tan x ile sadeleştirmişsin; tan x = sin x/cos x.", 'You cancelled sin x with tan x; tan x = sin x/cos x.'), tx("tan x ile bölmek yerine çarpmışsın.", 'You multiplied by tan x instead of dividing.'), tx("tan x'in kendisini yazmışsın.", 'You wrote tan x itself.')]],
    ['cos(x − π)', '−cos x', () => tx('Kosinüs π kadar kaydırılınca (yarım periyot) işaret değiştirir: cos(x − π) = −cos x.', 'Shifting cosine by π (half a period) flips the sign: cos(x − π) = −cos x.'), ['cos x', 'sin x', '−sin x', '1 − cos x'],
      () => [tx('Tam periyot (2π) kayması olsaydı değişmezdi; π kayması işareti ters çevirir.', 'A full-period (2π) shift would leave it unchanged; a shift by π flips the sign.'), tx('π/2 kaymasıyla karıştırmışsın; π kayması sin vermez.', 'You confused it with a shift by π/2; a shift by π does not give sin.'), tx('Hem fonksiyonu hem işareti yanlış almışsın.', 'Both the function and the sign are wrong.'), tx('Bir açılım formülü uydurmuşsun; cos(x − π) = cos x cos π + sin x sin π = −cos x.', 'You invented an expansion; cos(x − π) = cos x cos π + sin x sin π = −cos x.')]],
    ['sin(π − x)', 'sin x', () => tx('sin(π − x) = sin π cos x − cos π sin x = sin x.', 'sin(π − x) = sin π cos x − cos π sin x = sin x.'), ['−sin x', 'cos x', '−cos x', 'sin x − 1'],
      () => [tx('π − x ve x, y eksenine göre simetrik açılardır; sinüsleri aynıdır.', 'π − x and x are mirror angles about the y-axis; their sines are equal.'), tx('π/2 kaymasıyla karıştırmışsın.', 'You confused it with a shift by π/2.'), tx('Hem fonksiyon hem işaret yanlış.', 'Both function and sign are wrong.'), tx('Böyle bir sadeleşme yok.', 'There is no such simplification.')]],
    ['sin(x + π/2)', 'cos x', () => tx('sin(x + π/2) = sin x cos(π/2) + cos x sin(π/2) = cos x.', 'sin(x + π/2) = sin x cos(π/2) + cos x sin(π/2) = cos x.'), ['sin x', '−cos x', '−sin x', 'cos x + 1'],
      () => [tx('Kayma sinüsü kosinüse çevirir, aynı kalmaz.', 'The shift turns the sine into a cosine; it does not stay the same.'), tx('sin(x − π/2) = −cos x olurdu; burada kayma +π/2.', 'sin(x − π/2) = −cos x; here the shift is +π/2.'), tx('Fonksiyon ve işaret yanlış.', 'Function and sign are wrong.'), tx('Böyle bir sadeleşme yok.', 'There is no such simplification.')]],
    ['sec²x − tan²x', '1', () => tx('1 + tan²x = sec²x ⇒ sec²x − tan²x = 1.', '1 + tan²x = sec²x ⇒ sec²x − tan²x = 1.'), ['−1', '0', 'sin²x', 'cos²x'],
      () => [tx('İşareti ters almışsın.', 'You flipped the sign.'), tx('Sadece sec x = tan x diye düşünmüşsün; kareler farkı 0 değil.', 'You assumed sec x = tan x; the difference of squares is not 0.'), tx('Bu özdeşlikle ilgisiz bir sadeleşme.', 'An unrelated simplification.'), tx('Bu özdeşlikle ilgisiz bir sadeleşme.', 'An unrelated simplification.')]],
    ['(1 − cos 2x)/2', 'sin²x', () => tx('cos 2x = 1 − 2 sin²x ⇒ (1 − cos 2x)/2 = sin²x.', 'cos 2x = 1 − 2 sin²x ⇒ (1 − cos 2x)/2 = sin²x.'), ['cos²x', 'sin x', 'sin 2x / 2', '1 − cos x'],
      () => [tx('cos²x = (1 + cos 2x)/2\'dir; burada eksi var.', 'cos²x = (1 + cos 2x)/2; here there is a minus sign.'), tx('Kare kaybolmuş: sin²x ≠ sin x.', 'The square is lost: sin²x ≠ sin x.'), tx("sin 2x farklı bir şeydir; cos 2x'in yerine geçmez.", 'sin 2x is a different thing; it does not replace cos 2x.'), tx("2x'i x ile karıştırmışsın.", 'You mixed up 2x and x.')]],
    ['cos(−x) + sin(−x)', 'cos x − sin x', () => tx('cos çifttir: cos(−x) = cos x; sin tektir: sin(−x) = −sin x.', 'Cosine is even: cos(−x) = cos x; sine is odd: sin(−x) = −sin x.'), ['cos x + sin x', '−cos x − sin x', '−cos x + sin x', '0'],
      () => [tx('sin(−x) = −sin x olduğunu unutmuşsun.', 'You forgot that sin(−x) = −sin x.'), tx('Her iki fonksiyonun işaretini de değiştirmişsin; cos çifttir.', 'You flipped the sign of both; cosine is even.'), tx("cos(−x)'in işaretini değiştirmişsin; cos çifttir, sin tektir.", 'You changed the sign of cos(−x); cosine is even and sine is odd.'), tx('Terimler birbirini götürmez.', 'The terms do not cancel.')]],
    ['tan(x + π)', 'tan x', () => tx("tan'ın periyodu π'dir: tan(x + π) = tan x.", 'tan has period π: tan(x + π) = tan x.'), ['−tan x', 'cot x', '−cot x', 'tan x + 1'],
      () => [tx("Bu sin ve cos'un π kayması davranışıdır; tan'ın periyodu π'dir.", 'That is how sin and cos behave under a shift by π; tan has period π.'), tx('cot x, π/2 kaymasında ortaya çıkar (işaretle).', 'cot x appears under a shift by π/2 (with a sign).'), tx('Fonksiyon ve işaret yanlış.', 'Function and sign are wrong.'), tx('Böyle bir sadeleşme yok.', 'There is no such simplification.')]],
  ];

  function xVerify(rng, topic) {
    const good = [
      ['sin²x + cos²x = 1', tx('Birim çemberden: x² + y² = 1.', 'From the unit circle: x² + y² = 1.')],
      ['1 + tan²x = sec²x', tx("Pisagor özdeşliğini cos²x'e bölerek bulunur.", 'Divide the Pythagorean identity by cos²x.')],
      ['1 + cot²x = csc²x', tx("Pisagor özdeşliğini sin²x'e bölerek bulunur.", 'Divide the Pythagorean identity by sin²x.')],
      ['sin 2x = 2 sin x cos x', tx('Çift açı formülüdür.', 'It is the double-angle formula.')],
      ['cos 2x = 1 − 2 sin²x', tx('cos 2x = cos²x − sin²x ve cos²x = 1 − sin²x.', 'cos 2x = cos²x − sin²x and cos²x = 1 − sin²x.')],
      ['cos 2x = 2 cos²x − 1', tx('cos 2x = cos²x − sin²x ve sin²x = 1 − cos²x.', 'cos 2x = cos²x − sin²x and sin²x = 1 − cos²x.')],
      ['sin(x + y) = sin x cos y + cos x sin y', tx('Toplam formülüdür.', 'It is the sum formula.')],
      ['cos(x − y) = cos x cos y + sin x sin y', tx('Fark formülüdür.', 'It is the difference formula.')],
      ['tan(−x) = −tan x', tx('tan tek fonksiyondur.', 'tan is an odd function.')],
      ['sin(π − x) = sin x', tx('π − x ve x açılarının sinüsü aynıdır.', 'The angles π − x and x have the same sine.')],
      ['cos(π − x) = −cos x', tx('π − x ve x açılarının kosinüsü zıt işaretlidir.', 'The angles π − x and x have opposite cosines.')],
      ['sin(x + π/2) = cos x', tx('π/2 kayması sinüsü kosinüse çevirir.', 'A shift by π/2 turns sine into cosine.')],
    ];
    const bad = [
      ['sin(x + y) = sin x + sin y', tx('x = y = 30°: sin 60° = √3/2 ≈ 0,87 ama sin 30° + sin 30° = 1.', 'x = y = 30°: sin 60° = √3/2 ≈ 0.87 but sin 30° + sin 30° = 1.')],
      ['cos 2x = 2 cos x', tx('x = 60°: cos 120° = −1/2 ama 2 cos 60° = 1.', 'x = 60°: cos 120° = −1/2 but 2 cos 60° = 1.')],
      ['sin 2x = 2 sin x', tx('x = 30°: sin 60° = √3/2 ama 2 sin 30° = 1.', 'x = 30°: sin 60° = √3/2 but 2 sin 30° = 1.')],
      ['sin²x − cos²x = 1', tx('x = 0: 0 − 1 = −1 ≠ 1.', 'x = 0: 0 − 1 = −1 ≠ 1.')],
      ['1 − tan²x = sec²x', tx('x = 45°: 1 − 1 = 0 ama sec²45° = 2.', 'x = 45°: 1 − 1 = 0 but sec²45° = 2.')],
      ['cos(x − y) = cos x − cos y', tx('x = y = 60°: cos 0° = 1 ama cos 60° − cos 60° = 0.', 'x = y = 60°: cos 0° = 1 but cos 60° − cos 60° = 0.')],
      ['tan(x + y) = tan x + tan y', tx('x = y = 30°: tan 60° = √3 ≈ 1,73 ama 2 tan 30° ≈ 1,15.', 'x = y = 30°: tan 60° = √3 ≈ 1.73 but 2 tan 30° ≈ 1.15.')],
      ['cos(−x) = −cos x', tx('x = 0: cos 0 = 1 ama −cos 0 = −1.', 'x = 0: cos 0 = 1 but −cos 0 = −1.')],
      ['sin(π + x) = sin x', tx('x = π/2: sin(3π/2) = −1 ama sin(π/2) = 1.', 'x = π/2: sin(3π/2) = −1 but sin(π/2) = 1.')],
      ['1 + cot²x = sec²x', tx('x = 30°: 1 + 3 = 4 ama sec²30° = 4/3.', 'x = 30°: 1 + 3 = 4 but sec²30° = 4/3.')],
      ['cos 2x = cos²x + sin²x', tx('x = 90°: cos 180° = −1 ama cos²90° + sin²90° = 1.', 'x = 90°: cos 180° = −1 but cos²90° + sin²90° = 1.')],
    ];
    shuffleArr(good, rng);
    const b = rng.pick(bad);
    const wrongs = [], notes = [];
    for (let k = 0; k < 4; k++) {
      wrongs.push(good[k][0]);
      notes.push(tx(`Bu bir özdeşliktir (her x için doğru): ${good[k][1]}`, `This IS an identity (true for every x): ${good[k][1]}`));
    }
    return Q(topic, tx('Aşağıdakilerden hangisi bir özdeşlik DEĞİLDİR (her x, y için doğru değildir)?', 'Which of the following is NOT an identity (it fails for some x, y)?'), b[0], wrongs,
      [tx('Bir eşitliğin özdeşlik olmadığını göstermek için tek bir karşı örnek yeter.', 'A single counterexample shows that an equation is not an identity.'), tx(`Karşı örnek: ${b[1]}`, `Counterexample: ${b[1]}`), tx(`Yani ${b[0]} bir özdeşlik değildir.`, `So ${b[0]} is not an identity.`)], rng, notes);
  }

  function xSimplify(rng) {
    const topic = tx('Özdeşlikler: sadeleştirme ve doğrulama', 'Identities: simplifying and verifying');
    if (rng.nextInt(0, 3) === 0) return xVerify(rng, topic);
    const row = SIMPLIFY[rng.nextInt(0, 10)];
    const expr = row[0], c = row[1], why = row[2]();
    return Q(topic, tx(`${expr} ifadesi neye eşittir?`, `What does ${expr} simplify to?`), c, row[3], [why, tx(`Sonuç: ${expr} = ${c}.`, `Result: ${expr} = ${c}.`)], rng, row[4]());
  }

  function xPeriodSum(rng) {
    let a, b;
    do { a = rng.pick([1, 2, 3, 4, 6]); b = rng.pick([1, 2, 3, 4, 6]); } while (a === b);
    const g = gcd(a, b);
    const c = piStr(2, g);
    const wrongs = [piStr(2, a * b), piStr(2, a + b), piStr(2, Math.trunc(a * b / g)), piStr(2, Math.max(a, b)), piStr(2, Math.min(a, b)), 'π', '4π'];
    const notes = [
      tx('Periyotları (2π/a ve 2π/b) çarpmışsın ya da frekansları çarpmışsın; ortak periyot ortak katla bulunur.', 'You multiplied the frequencies; the common period comes from a common multiple of the periods.'),
      tx('Frekansları toplamışsın; toplam fonksiyonun periyodu frekansların toplamıyla bulunmaz.', 'You added the frequencies; the period of a sum is not given by the sum of the frequencies.'),
      tx("Frekansların EKOK'unu almışsın; periyotların EKOK'u, frekansların EBOB'u ile bulunur.", 'You took the lcm of the frequencies; the lcm of the periods corresponds to the GCD of the frequencies.'),
      tx('Bu sadece kısa olan bileşenin periyodudur; uzun bileşen henüz tekrar etmedi.', 'This is only the period of the shorter component; the longer one has not repeated yet.'),
      tx('Bu sadece uzun olan bileşenin periyodudur; kısa bileşenle ortak katı olmayabilir.', 'This is only the period of the longer component; it may not be a multiple of the other period.'),
      tx('π bu fonksiyon için bir periyot olmayabilir; kontrol et.', 'π may not be a period of this function; check it.'),
      tx('Bu bir periyot olabilir ama en küçük pozitif periyot değildir.', 'That may be a period but not the smallest positive one.')];
    const ax = a === 1 ? 'x' : `${a}x`, bx = b === 1 ? 'x' : `${b}x`;
    const pa = a === 1 ? '2π' : `2π/${a}` + (piStr(2, a) === `2π/${a}` ? '' : ' = ' + piStr(2, a));
    const pb = b === 1 ? '2π' : `2π/${b}` + (piStr(2, b) === `2π/${b}` ? '' : ' = ' + piStr(2, b));
    const q = Q(tx('Toplam fonksiyonun periyodu', 'Period of a sum'), tx(`f(x) = sin(${ax}) + cos(${bx}) fonksiyonunun (en küçük pozitif) periyodu nedir?`, `What is the (smallest positive) period of f(x) = sin(${ax}) + cos(${bx})?`), c, wrongs,
      [tx(`sin(${ax}) periyodu ${pa}; cos(${bx}) periyodu ${pb}.`, `sin(${ax}) has period ${pa}; cos(${bx}) has period ${pb}.`),
        tx('Toplamın periyodu, iki periyodun en küçük ortak katıdır (EKOK).', 'The period of the sum is the least common multiple of the two periods.'),
        tx(`EKOK(${piStr(2, a)}, ${piStr(2, b)}) = 2π/EBOB(${a}, ${b}) = 2π/${g} = ${c}.`, `lcm(${piStr(2, a)}, ${piStr(2, b)}) = 2π/gcd(${a}, ${b}) = 2π/${g} = ${c}.`)], rng, notes);
    q.plot = new PlotSpec(-2 * Math.PI, 2 * Math.PI, -2.5, 2.5).addCurve((x) => Math.sin(a * x) + Math.cos(b * x));
    return q;
  }

  function xPeriodAbs(rng) {
    const kind = rng.nextInt(0, 4);
    const k = rng.pick([1, 1, 2, 3]);
    const kx = k === 1 ? 'x' : `${k}x`;
    const expr = [`|sin ${kx}|`, k === 1 ? 'sin²x' : `sin²(${kx})`, `|cos ${kx}|`, k === 1 ? 'cos²x' : `cos²(${kx})`][kind];
    const half = k === 1 ? 'π' : `π/${k}`;
    const full = k === 1 ? '2π' : (piStr(2, k) === `2π/${k}` ? `2π/${k}` : `2π/${k} = ${piStr(2, k)}`);
    const c = piStr(1, k);
    const wrongs = [piStr(2, k), piStr(1, 2 * k), piStr(4, k), piStr(2, 1), 'π'];
    const notes = [
      tx("2π/b, sin ya da cos'un kendi periyodudur; mutlak değer ya da kare negatif yarıyı ters çevirip periyodu yarıya indirir.", '2π/b is the period of sin or cos itself; the absolute value or the square flips the negative half, halving the period.'),
      tx('Periyodu iki kez yarıya bölmüşsün; π/b yeterlidir.', 'You halved the period twice; π/b is enough.'),
      tx('Periyodu iki katına çıkarmışsın; mutlak değer/kare periyodu uzatmaz.', 'You doubled the period; absolute value or squaring never lengthens it.'),
      tx('b katsayısını dikkate almamışsın.', 'You ignored the coefficient b.'),
      tx('π, b = 1 için doğrudur; b\'yi hesaba katmamışsın.', 'π is right only for b = 1; the coefficient b must be accounted for.')];
    const q = Q(tx('Periyot: mutlak değer ve kare', 'Period: absolute value and squares'), tx(`y = ${expr} fonksiyonunun (en küçük pozitif) periyodu nedir?`, `What is the (smallest positive) period of y = ${expr}?`), c, wrongs,
      [kind % 2 === 0 ? tx('Mutlak değer, grafiğin eksenin altındaki yarım dalgasını yukarı yansıtır; şekil her yarım dalgada tekrar eder.', 'The absolute value reflects the negative half-waves upward; the shape repeats every half wave.')
        : tx(`${kind === 1 ? 'sin' : 'cos'}²θ = (1 ${kind === 1 ? '−' : '+'} cos 2θ)/2: iç fonksiyonun frekansı iki katına çıkar, periyot yarıya iner.`, `${kind === 1 ? 'sin' : 'cos'}²θ = (1 ${kind === 1 ? '−' : '+'} cos 2θ)/2: the frequency doubles, so the period halves.`),
        tx(`${kind < 2 ? 'sin' : 'cos'} ${kx} fonksiyonunun periyodu ${full}; yarıya inince ${half}.`, `${kind < 2 ? 'sin' : 'cos'} ${kx} has period ${full}; halved it is ${half}.`),
        tx(`Periyot = ${c}.`, `Period = ${c}.`)], rng, notes);
    const f = (x) => {
      switch (kind) {
        case 0: return Math.abs(Math.sin(k * x));
        case 1: return Math.sin(k * x) * Math.sin(k * x);
        case 2: return Math.abs(Math.cos(k * x));
        default: return Math.cos(k * x) * Math.cos(k * x);
      }
    };
    q.plot = new PlotSpec(-2 * Math.PI, 2 * Math.PI, -0.4, 1.5).addCurve(f);
    return q;
  }

  function xPeriodPiece(rng) {
    const T = rng.nextInt(3, 7);
    const kk = rng.pick([13, 17, 19, 22, 23, 29, 31, -3, -5, -7, -8, -11]);
    const ff = (r) => r * r - 2 * r;
    const rr = mod(kk, T);
    const c = ff(rr);
    const cand = [ff(kk), kk < 0 ? ff(mod(-kk, T)) : ff(T - rr), kk < 0 ? ff(kk % T) : ff(Math.trunc(kk / T)), ff(mod(rr + 1, T)), ff(mod(rr - 1, T)), c + 1, c - 1, c + 2];
    const notes = [
      tx(`f(k)'yı doğrudan formülle hesaplamışsın; formül sadece [0, ${T}) aralığında geçerlidir, önce periyoda indirgemelisin.`, `You plugged k straight into the formula; it is valid only on [0, ${T}), so reduce modulo the period first.`),
      kk < 0 ? tx(`Negatif sayının işaretini atıp kalanı almışsın; kalan yine [0, ${T}) aralığında olmalı.`, `You dropped the sign and took the remainder; the remainder must still lie in [0, ${T}).`)
        : tx('Kalan r yerine T − r kullanmışsın (aynalamışsın).', 'You used T − r instead of the remainder r.'),
      kk < 0 ? tx(`Negatif bölünende kalanı negatif bırakmışsın; kalan [0, ${T}) aralığına getirilmeli (${T} ekle).`, `You left a negative remainder; shift it into [0, ${T}) by adding ${T}.`)
        : tx('Kalan yerine bölümü kullanmışsın.', 'You used the quotient instead of the remainder.'),
      tx('Kalanı bir fazla almışsın; bölme işlemini kontrol et.', 'Your remainder is one too large; re-check the division.'),
      tx('Kalanı bir eksik almışsın; bölme işlemini kontrol et.', 'Your remainder is one too small; re-check the division.'),
      tx('Son adımda 1 fazla: küçük bir hesap hatası.', 'One too large in the last step: a small arithmetic slip.'),
      tx('Son adımda 1 eksik: küçük bir hesap hatası.', 'One too small in the last step: a small arithmetic slip.'),
      tx('Son adımda 2 fazla: küçük bir hesap hatası.', 'Two too large in the last step: a small arithmetic slip.')];
    const q = Q(tx('Periyodik fonksiyon değerleri', 'Values of periodic functions'),
      tx(`f, periyodu ${T} olan periyodik bir fonksiyondur ve 0 ≤ x < ${T} için f(x) = x² − 2x'tir. f(${kk}) kaçtır?`, `f is periodic with period ${T} and f(x) = x² − 2x for 0 ≤ x < ${T}. What is f(${kk})?`),
      String(c), cand.map(String),
      [tx(`Periyot ${T}: f(x) = f(x − ${T}n). ${kk} sayısını [0, ${T}) aralığına indirge.`, `Period ${T}: f(x) = f(x − ${T}n). Reduce ${kk} into [0, ${T}).`),
        tx(`${kk} = ${T}·(${Math.trunc((kk - rr) / T)}) + ${rr} ⇒ f(${kk}) = f(${rr}).`, `${kk} = ${T}·(${Math.trunc((kk - rr) / T)}) + ${rr} ⇒ f(${kk}) = f(${rr}).`),
        `f(${rr}) = ${rr}² − 2·${rr} = ${c}`], rng, notes);
    const top = Math.max(1, T * T - 2 * T);
    q.plot = new PlotSpec(-2 * T, 2 * T, -2, top + 1).addCurve((x) => { const r = x - T * Math.floor(x / T); return r * r - 2 * r; });
    return q;
  }

  function xArcExact(rng) {
    const fn = rng.nextInt(0, 3);
    const nm = ['arcsin', 'arccos', 'arctan'][fn];
    const f = ['sin', 'cos', 'tan'][fn];
    const idx = rng.nextInt(0, fn === 2 ? TNT.length : SCT.length);
    const vt = fn === 2 ? TNT[idx] : SCT[idx];
    const vv = fn === 2 ? TNV[idx] : SCV[idx];
    const rad = fn === 0 ? Math.asin(vv) : (fn === 1 ? Math.acos(vv) : Math.atan(vv));
    const d = Math.round(rad * 180 / Math.PI);
    const rng3 = ['[−π/2, π/2]', '[0, π]', '(−π/2, π/2)'][fn];
    const c = piStr(d, 180);
    const wrongs = [piStr(-d, 180), piStr(180 - d, 180), piStr(90 - d, 180), piStr(mod(d, 360), 180), piStr(d + 180, 180), 'π/6', 'π/3', 'π/4'];
    const another = tx('Bu başka bir özel açıdır; değeri doğru eşleştirmemişsin.', 'This is another special angle; the value was not matched correctly.');
    const notes = [
      tx('İşareti ters almışsın: açının işareti verilen değerin işaretinden belirlenir (arccos\'ta açı hiçbir zaman negatif olamaz, daima [0, π] içindedir).', 'You flipped the sign: the sign of the angle follows from the sign of the given value (arccos can never be negative, it always lies in [0, π]).'),
      tx('Bu, doğru açının π\'ye göre simetriğidir (π − θ); sinüs için aynı değeri verir ama sorulan değer için doğru açı değildir.', 'That is the mirror angle π − θ; it has the same sine, but it is not the angle with the requested value.'),
      tx('Bu tümleyen açıdır (90° − θ); sin ile cos\'u karıştırmış olabilirsin.', 'That is the complementary angle (90° − θ); sin and cos may have been mixed up.'),
      tx('Açıyı [0, 2π) aralığında yazmışsın; ters fonksiyonun çıktısı ana aralıktadır.', 'You wrote the angle in [0, 2π); the output of the inverse function lies in the principal range.'),
      tx('Bu, doğru açıdan yarım tur (π) ötedeki açıdır; sinüs ve kosinüsün işaretini değiştirir ve ana aralıkta değildir.', 'That is the angle a half-turn (π) away; it flips the sign of sine and cosine and is not in the principal range.'),
      another, another, another];
    return Q(tx('Ters trigonometrik fonksiyonların değerleri', 'Values of inverse trig functions'), tx(`${nm}(${vt}) değeri kaçtır?`, `What is the value of ${nm}(${vt})?`), c, wrongs,
      [tx(`${nm}(${vt}) = θ ⇔ ${f} θ = ${vt} ve θ ∈ ${rng3}.`, `${nm}(${vt}) = θ ⇔ ${f} θ = ${vt} and θ ∈ ${rng3}.`),
        tx(`Ana aralıkta ${f} değeri ${vt} olan açı: ${d}°.`, `The angle in the principal range with ${f} equal to ${vt} is ${d}°.`),
        `${nm}(${vt}) = ${c}`], rng, notes);
  }

  function trapRes(fn, deg) {
    if (fn === 0) {
      let r = mod(deg + 180, 360) - 180;
      if (r > 90) r = 180 - r; else if (r < -90) r = -180 - r;
      return r;
    }
    if (fn === 1) return Math.abs(mod(deg + 180, 360) - 180);
    return mod(deg + 90, 180) - 90;
  }

  function xArcTrap(rng) {
    const fn = rng.nextInt(0, 3);
    const nm = ['arcsin', 'arccos', 'arctan'][fn];
    const f = ['sin', 'cos', 'tan'][fn];
    const pool = fn === 0 ? [120, 135, 150, 210, 225, 240, 300, 315, 330, -120, -135, -150]
      : (fn === 1 ? [-30, -45, -60, -120, -135, 210, 225, 240, 300, 315, 330] : [120, 135, 150, 210, 225, 240, 300, 315, 330, -120, -135, -150]);
    const deg = rng.pick(pool);
    const res = trapRes(fn, deg);
    const rangeT = ['[−π/2, π/2]', '[0, π]', '(−π/2, π/2)'][fn];
    const c = piStr(res, 180);
    const wrongs = [piStr(deg, 180), piStr(-res, 180), piStr(180 - res, 180), piStr(90 - res, 180), piStr(res + 180, 180), piStr(mod(deg, 360), 180)];
    const notes = [
      tx(`${nm}(${f} x) = x her x için doğru DEĞİLDİR; yalnızca x ana aralık ${rangeT} içindeyse. ${piStr(deg, 180)} bu aralığın dışında.`, `${nm}(${f} x) = x is NOT true for every x; only when x lies in the principal range ${rangeT}. ${piStr(deg, 180)} is outside it.`),
      tx('İşareti ters almışsın; iç değerin işaretinden ana aralıktaki açının yönünü belirle.', 'You flipped the sign; use the sign of the inner value to decide which side of the principal range the angle lies.'),
      tx("Bu, doğru açının π'ye göre simetriğidir (π − θ); ana aralıkta olmayabilir ve sorulan değeri vermez.", 'That is the mirror angle π − θ; it need not be in the principal range and does not give the requested value.'),
      tx('Bu bir tümleyen açıdır (90° − θ); sin ile cos karışmış olabilir.', 'That is a complementary angle (90° − θ); sin and cos may be mixed up.'),
      tx('Bu, doğru açıdan yarım tur (π) ötedeki açıdır; ana aralıkta değildir ve sinüs/kosinüsün işaretini ters çevirir.', 'That is the angle a half-turn (π) away; it is not in the principal range and flips the sign of sine/cosine.'),
      tx('Açıyı [0, 2π) aralığında yazmışsın; ters fonksiyon ana aralıkta çıktı verir.', 'You wrote the angle in [0, 2π); the inverse function returns an angle from the principal range.')];
    let reduce;
    if (fn === 0) reduce = tx(`${piStr(deg, 180)} (${deg}°) [−π/2, π/2] içinde değil. Aynı sinüse sahip, aralıktaki açı: ${res}° (referans açı ve sinüsün işareti ile).`, `${piStr(deg, 180)} (${deg}°) is not in [−π/2, π/2]. The angle in the range with the same sine is ${res}° (use the reference angle and the sign of the sine).`);
    else if (fn === 1) reduce = tx(`${piStr(deg, 180)} (${deg}°) [0, π] içinde değil. Kosinüs çifttir: cos(−θ) = cos θ ve 2π'lik kaymalar değeri değiştirmez; [0, π] içindeki eşi ${res}°.`, `${piStr(deg, 180)} (${deg}°) is not in [0, π]. Cosine is even and 2π-periodic, so the angle in [0, π] with the same cosine is ${res}°.`);
    else reduce = tx(`${piStr(deg, 180)} (${deg}°) (−π/2, π/2) içinde değil. tan'ın periyodu π olduğundan π'nin katlarını ekleyip çıkar: ${res}°.`, `${piStr(deg, 180)} (${deg}°) is not in (−π/2, π/2). Since tan has period π, add or subtract multiples of π: ${res}°.`);
    return Q(tx('Ters fonksiyon tuzağı: arcsin(sin x)', 'The inverse-function trap: arcsin(sin x)'), tx(`${nm}(${f} ${piStr(deg, 180)}) değeri kaçtır?`, `What is ${nm}(${f} ${piStr(deg, 180)})?`), c, wrongs,
      [tx(`${nm} fonksiyonunun çıktısı daima ${rangeT} aralığındadır; bu yüzden sonuç otomatik olarak ${piStr(deg, 180)} DEĞİLDİR.`, `The output of ${nm} always lies in ${rangeT}, so the answer is NOT automatically ${piStr(deg, 180)}.`),
        reduce, `${nm}(${f} ${piStr(deg, 180)}) = ${c}`], rng, notes);
  }

  function xArcComp(rng) {
    const t = rng.pick(TRIP);
    const swap = rng.nextInt(0, 2) === 0;
    const A = swap ? t[1] : t[0], B = swap ? t[0] : t[1], C = t[2];
    const comp = rng.nextInt(0, 6);
    const s = rng.nextInt(0, 3) === 0 ? -1 : 1;
    const innerFn = Math.floor(comp / 2);
    const arcNm = ['arcsin', 'arccos', 'arctan'][innerFn];
    const outNm = ['cos', 'tan', 'sin', 'tan', 'sin', 'cos'][comp];
    const argT = [frac(s * A, C), frac(s * B, C), frac(s * A, B)][innerFn];
    const nums = [B, s * A, A, s * A, s * A, B];
    const dens = [C, B, C, B, C, C];
    const cor = frac(nums[comp], dens[comp]);
    const ratios = [
      [frac(A, C), tx('karşı/hipotenüs (sin)', 'opposite/hypotenuse (sin)')], [frac(B, C), tx('komşu/hipotenüs (cos)', 'adjacent/hypotenuse (cos)')],
      [frac(A, B), tx('karşı/komşu (tan)', 'opposite/adjacent (tan)')], [frac(B, A), tx('komşu/karşı (cot)', 'adjacent/opposite (cot)')],
      [frac(C, B), tx('hipotenüs/komşu (sec)', 'hypotenuse/adjacent (sec)')], [frac(C, A), tx('hipotenüs/karşı (csc)', 'hypotenuse/opposite (csc)')]];
    const wrongs = [], notes = [];
    if (s < 0) {
      wrongs.push(negate(cor));
      notes.push(tx("İşareti ters almışsın; negatif argümanda θ'nın hangi bölgede olduğuna dikkat et.", 'You got the sign wrong; for a negative argument check which quadrant θ is in.'));
    } else {
      wrongs.push(negate(cor));
      notes.push(tx('Gereksiz bir eksi işareti koymuşsun; θ ana aralıkta ve bu oran pozitiftir.', 'You added an unnecessary minus sign; θ is in the principal range and this ratio is positive.'));
    }
    for (const r of ratios) {
      wrongs.push(r[0]);
      notes.push(tx(`${r[0]}, üçgenin ${r[1]} oranıdır; sorulan ${outNm} θ değil.`, `${r[0]} is the ${r[1]} ratio of the triangle; the question asks for ${outNm} θ.`));
    }
    const steps = [];
    const innerName = ['sin', 'cos', 'tan'][innerFn];
    steps.push(tx(`θ = ${arcNm}(${argT}) olsun: ${innerName} θ = ${argT}.`, `Let θ = ${arcNm}(${argT}): ${innerName} θ = ${argT}.`));
    if (innerFn === 0) steps.push(tx(`Dik üçgen: karşı = ${A}, hipotenüs = ${C}; komşu = √(${C}² − ${A}²) = ${B}.`, `Right triangle: opposite = ${A}, hypotenuse = ${C}; adjacent = √(${C}² − ${A}²) = ${B}.`));
    else if (innerFn === 1) steps.push(tx(`Dik üçgen: komşu = ${B}, hipotenüs = ${C}; karşı = √(${C}² − ${B}²) = ${A}.`, `Right triangle: adjacent = ${B}, hypotenuse = ${C}; opposite = √(${C}² − ${B}²) = ${A}.`));
    else steps.push(tx(`Dik üçgen: karşı = ${A}, komşu = ${B}; hipotenüs = √(${A}² + ${B}²) = ${C}.`, `Right triangle: opposite = ${A}, adjacent = ${B}; hypotenuse = √(${A}² + ${B}²) = ${C}.`));
    if (s < 0) {
      steps.push(tx(innerFn === 1 ? 'Argüman negatif ⇒ θ ∈ (π/2, π]: sin θ > 0, cos θ < 0, tan θ < 0.' : 'Argüman negatif ⇒ θ ∈ [−π/2, 0): sin θ < 0, cos θ > 0, tan θ < 0.',
        innerFn === 1 ? 'Negative argument ⇒ θ ∈ (π/2, π]: sin θ > 0, cos θ < 0, tan θ < 0.' : 'Negative argument ⇒ θ ∈ [−π/2, 0): sin θ < 0, cos θ > 0, tan θ < 0.'));
    } else {
      steps.push(tx('Argüman pozitif ⇒ θ birinci bölgededir: tüm oranlar pozitif.', 'Positive argument ⇒ θ is in quadrant I: all ratios are positive.'));
    }
    steps.push(`${outNm}(${arcNm}(${argT})) = ${cor}`);
    return Q(tx('Ters fonksiyonların bileşimi', 'Compositions with inverse trig functions'), tx(`${outNm}(${arcNm}(${argT})) değeri kaçtır?`, `What is the value of ${outNm}(${arcNm}(${argT}))?`), cor, wrongs, steps, rng, notes);
  }

  function xArcDomRange(rng) {
    const topic = tx('Ters fonksiyonlar: tanım ve görüntü kümesi', 'Inverse trig: domain and range');
    const v = rng.nextInt(0, 3);
    if (v === 0) {
      const okList = [['arcsin(1/3)', '1/3'], ['arcsin(−0,9)', '−0,9'], ['arccos(0)', '0'], ['arccos(−1)', '−1'], ['arcsin(√2/2)', '√2/2 ≈ 0,71'], ['arccos(π/4)', 'π/4 ≈ 0,79'], ['arctan(100)', '100'], ['arctan(−7)', '−7']];
      const badList = [['arcsin(1,5)', '1,5'], ['arcsin(−2)', '−2'], ['arccos(3)', '3'], ['arccos(−1,2)', '−1,2'], ['arcsin(√2)', '√2 ≈ 1,41'], ['arcsin(π/3)', 'π/3 ≈ 1,05'], ['arccos(2/√3)', '2/√3 ≈ 1,15']];
      shuffleArr(okList, rng);
      const bd = rng.pick(badList);
      const wrongs = [], notes = [];
      for (let k = 0; k < 4; k++) {
        const o = okList[k];
        wrongs.push(decT(o[0]));
        notes.push(o[0].startsWith('arctan')
          ? tx(`${decT(o[0])} tanımlıdır: arctan'ın tanım kümesi tüm reel sayılardır.`, `${decT(o[0])} is defined: the domain of arctan is all real numbers.`)
          : tx(`${decT(o[0])} tanımlıdır: argüman (${decT(o[1])}) [−1, 1] aralığındadır.`, `${decT(o[0])} is defined: the argument (${decT(o[1])}) lies in [−1, 1].`));
      }
      return Q(topic, tx('Aşağıdakilerden hangisi TANIMSIZDIR?', 'Which of the following is UNDEFINED?'), decT(bd[0]), wrongs,
        [tx("arcsin ve arccos'un tanım kümesi [−1, 1]'dir (sin ve cos'un görüntü kümesi); arctan her reel sayı için tanımlıdır.", 'arcsin and arccos have domain [−1, 1] (the range of sin and cos); arctan is defined for every real number.'),
          tx(`${decT(bd[0])}: argüman ${decT(bd[1])}; bu değer [−1, 1] aralığının dışındadır.`, `${decT(bd[0])}: the argument is ${decT(bd[1])}, which lies outside [−1, 1].`),
          tx('Hiçbir açının sinüsü ya da kosinüsü 1\'den büyük olamaz; bu yüzden tanımsızdır.', 'No angle has a sine or cosine larger than 1, so it is undefined.')], rng, notes);
    }
    if (v === 1) {
      const w = rng.nextInt(0, 5);
      let text, c, wrongs, notes, sol;
      switch (w) {
        case 0:
          text = tx('y = arcsin x fonksiyonunun görüntü kümesi (çıktıların kümesi) hangisidir?', 'What is the range (set of outputs) of y = arcsin x?');
          c = '[−π/2, π/2]'; wrongs = ['[0, π]', '(−π/2, π/2)', '[−1, 1]', '[−π, π]'];
          notes = [tx("Bu arccos'un görüntü kümesidir.", 'That is the range of arccos.'), tx('Açık aralık arctan içindir; arcsin uç değerlere ulaşır (arcsin(±1) = ±π/2).', 'The open interval belongs to arctan; arcsin reaches the endpoints (arcsin(±1) = ±π/2).'), tx("Bu arcsin'in TANIM kümesidir; çıktılar açılardır.", 'That is the DOMAIN of arcsin; the outputs are angles.'), tx('Sinüs [−π, π] üzerinde bire-bir değildir.', 'Sine is not one-to-one on [−π, π].')];
          sol = [tx("arcsin, sin'in [−π/2, π/2] kısıtlaması olan parçasının tersidir.", 'arcsin inverts the restriction of sin to [−π/2, π/2].'), tx('Ters fonksiyonun görüntü kümesi, kısıtlanmış fonksiyonun tanım kümesidir: [−π/2, π/2].', 'The range of the inverse is the domain of the restricted function: [−π/2, π/2].')]; break;
        case 1:
          text = tx('y = arccos x fonksiyonunun görüntü kümesi hangisidir?', 'What is the range of y = arccos x?');
          c = '[0, π]'; wrongs = ['[−π/2, π/2]', '(0, π)', '[0, 2π]', '[−1, 1]'];
          notes = [tx("Bu arcsin'in görüntü kümesidir; kosinüs [0, π] üzerinde bire-birdir.", 'That is the range of arcsin; cosine is one-to-one on [0, π].'), tx('arccos(1) = 0 ve arccos(−1) = π olduğundan uç değerler alınır; aralık kapalıdır.', 'arccos(1) = 0 and arccos(−1) = π, so the endpoints are attained; the interval is closed.'), tx('Kosinüs [0, 2π] üzerinde bire-bir değildir.', 'Cosine is not one-to-one on [0, 2π].'), tx("Bu arccos'un tanım kümesidir; çıktılar açılardır.", 'That is the domain of arccos; the outputs are angles.')];
          sol = [tx('cos, [0, π] aralığında bire-birdir ve [−1, 1] değerlerinin hepsini alır.', 'cos is one-to-one on [0, π] and takes every value in [−1, 1].'), tx('Dolayısıyla arccos : [−1, 1] → [0, π].', 'Hence arccos : [−1, 1] → [0, π].')]; break;
        case 2:
          text = tx('y = arctan x fonksiyonunun görüntü kümesi hangisidir?', 'What is the range of y = arctan x?');
          c = '(−π/2, π/2)'; wrongs = ['[−π/2, π/2]', '(0, π)', 'ℝ', '[0, π]'];
          notes = [tx('Uç değerler dahil değildir: tan, ±π/2\'de tanımsızdır, arctan ise y = ±π/2 yatay asimptotlarına yaklaşır ama ulaşmaz.', 'The endpoints are not included: tan is undefined at ±π/2; arctan only approaches the asymptotes y = ±π/2.'), tx("Bu aralık tan'ın kısıtlandığı aralık değildir; tan (−π/2, π/2) üzerinde kısıtlanır.", 'That is not the restriction interval of tan; tan is restricted to (−π/2, π/2).'), tx("Bu arctan'ın TANIM kümesidir.", 'That is the DOMAIN of arctan.'), tx("Bu arccos'un görüntü kümesidir.", 'That is the range of arccos.')];
          sol = [tx('tan, (−π/2, π/2) üzerinde bire-bir ve örtendir (görüntüsü ℝ).', 'tan is one-to-one and onto ℝ on (−π/2, π/2).'), tx('Ters fonksiyonun çıktıları (−π/2, π/2) içinde kalır.', 'The outputs of the inverse stay inside (−π/2, π/2).')]; break;
        case 3:
          text = tx('y = arctan x fonksiyonunun tanım kümesi hangisidir?', 'What is the domain of y = arctan x?');
          c = 'ℝ'; wrongs = ['[−1, 1]', '(−π/2, π/2)', '[0, π]', 'x ≠ π/2 + kπ'];
          notes = [tx("Bu arcsin ve arccos'un tanım kümesidir; tan her değeri aldığı için arctan'ın tanım kümesi tüm ℝ'dir.", 'That is the domain of arcsin and arccos; tan takes every value, so arctan is defined on all of ℝ.'), tx("Bu arctan'ın görüntü kümesidir.", 'That is the range of arctan.'), tx("Bu arccos'un görüntü kümesidir.", 'That is the range of arccos.'), tx("Bu tan'ın tanımsız olduğu noktalardır; arctan'ın tanım kümesiyle ilgisi yok.", 'Those are the points where tan is undefined; unrelated to the domain of arctan.')];
          sol = [tx('Ters fonksiyonun tanım kümesi, kısıtlanmış fonksiyonun görüntü kümesidir.', 'The domain of the inverse is the range of the restricted function.'), tx('tan (−π/2, π/2) üzerinde her reel değeri alır ⇒ arctan: ℝ → (−π/2, π/2).', 'tan takes every real value on (−π/2, π/2) ⇒ arctan: ℝ → (−π/2, π/2).')]; break;
        default:
          text = tx('y = arccos x fonksiyonunun tanım kümesi hangisidir?', 'What is the domain of y = arccos x?');
          c = '[−1, 1]'; wrongs = ['[0, π]', 'ℝ', '(−1, 1)', '[−π/2, π/2]'];
          notes = [tx("Bu arccos'un görüntü kümesidir.", 'That is the range of arccos.'), tx('Kosinüs sadece [−1, 1] değerlerini alır; ℝ değil.', 'Cosine only takes values in [−1, 1], not all of ℝ.'), tx('Uç değerler dahildir: arccos(1) = 0 ve arccos(−1) = π tanımlıdır.', 'The endpoints are included: arccos(1) = 0 and arccos(−1) = π are defined.'), tx("Bu arcsin'in görüntü kümesidir.", 'That is the range of arcsin.')];
          sol = [tx('Ters fonksiyonun tanım kümesi, kısıtlanmış kosinüsün görüntü kümesidir.', 'The domain of the inverse is the range of the restricted cosine.'), tx('cos [0, π] üzerinde [−1, 1] değerlerini alır ⇒ tanım kümesi [−1, 1].', 'cos takes values [−1, 1] on [0, π] ⇒ domain [−1, 1].')];
      }
      return Q(topic, text, c, wrongs, sol, rng, notes);
    }
    const c = 'π/6';
    const wrongs = ['csc(1/2) = 1/sin(1/2) ≈ 2,09', '2', '5π/6', '−π/6', 'π/3'].map(decT);
    const notes = [
      tx('sin⁻¹ "ters fonksiyon" demektir, 1/sin (kosekant) değildir.', 'sin⁻¹ means the "inverse function", not 1/sin (cosecant).'),
      tx('Bu 1/(1/2) = 2\'dir; sin⁻¹ bir üs değil, ters fonksiyon işaretidir.', 'That is 1/(1/2) = 2; sin⁻¹ is not an exponent but the inverse-function symbol.'),
      tx("5π/6 da sin = 1/2 verir ama arcsin'in aralığı [−π/2, π/2]'dir.", '5π/6 also has sine 1/2 but the range of arcsin is [−π/2, π/2].'),
      tx('İşareti ters almışsın; sin(π/6) = +1/2.', 'You flipped the sign; sin(π/6) = +1/2.'),
      tx("sin(π/3) = √3/2'dir, 1/2 değil.", 'sin(π/3) = √3/2, not 1/2.')];
    return Q(topic, 'sin⁻¹(1/2) = ?', decT(c), wrongs,
      [tx('Buradaki −1 üs değil, ters fonksiyon işaretidir: sin⁻¹ x = arcsin x ≠ 1/sin x.', 'The −1 here is not an exponent but the inverse-function symbol: sin⁻¹ x = arcsin x ≠ 1/sin x.'),
        tx("Ana aralık [−π/2, π/2] içinde sinüsü 1/2 olan açı π/6'dır.", 'The angle in [−π/2, π/2] whose sine is 1/2 is π/6.'), 'sin⁻¹(1/2) = π/6'], rng, notes);
  }

  // ---------------------------------------------------------------- Exam-pool generators (new)

  const MINUS = '−';
  const solveDegs = (f, val, mult) => {
    const out = [];
    for (let d = 0; d < 360; d += 15) { const t = f((mult || 1) * d * Math.PI / 180); if (isFinite(t) && Math.abs(t - val) < 1e-9) out.push(d); }
    return out;
  };
  const setStr = (list) => 'x = ' + list.map((d) => piStr(d, 180)).join(', ');
  const sortNum = (a) => a.slice().sort((p, q) => p - q);
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const sgnTxt = (v) => (v < 0 ? '-' : '');

  // --- Level 2
  function xSolveBasic(rng) {
    const fn = rng.pick(['sin', 'cos', 'tan']);
    const f = Math[fn];
    const tbl = fn === 'tan' ? [['√3/3', Math.sqrt(3) / 3], ['1', 1], ['√3', Math.sqrt(3)]] : [['1/2', 0.5], ['√2/2', Math.SQRT1_2], ['√3/2', Math.sqrt(3) / 2]];
    const row = rng.pick(tbl);
    const sgn = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const val = sgn * row[1], vstr = sgnTxt(sgn) + row[0];
    const sol = solveDegs(f, val);
    const ref = [30, 45, 60].find((d) => Math.abs(f(d * Math.PI / 180) - row[1]) < 1e-9);
    const other = fn === 'tan' ? solveDegs(Math.tan, 1 / val) : solveDegs(fn === 'sin' ? Math.cos : Math.sin, val);
    const w4 = fn === 'tan' ? [sol[0], (sol[0] + 90) % 360] : [sol[0], (sol[1] + 180) % 360];
    const wrongs = [setStr(solveDegs(f, -val)), setStr(other), setStr([sol[0]]), setStr(sortNum(w4))];
    const oc = fn === 'sin' ? 'cos' : 'sin';
    const notes = [
      tx('Değerin işaretini ters almışsın; bu, karşıt işaretli değerin çözümleridir.', 'You flipped the sign of the value; these solve the equation with the opposite sign.'),
      fn === 'tan' ? tx('Verilen değerin tersini almışsın (cot x gibi çalışmışsın).', 'You used the reciprocal of the value (treated it as cot x).') : tx(`sin ile cos'u karıştırmışsın; bunlar ${oc} x = ${vstr} denkleminin çözümleridir.`, `You mixed up sin and cos; these solve ${oc} x = ${vstr}.`),
      tx('Yalnızca tek çözüm bulmuşsun; [0, 2π) aralığında iki çözüm vardır.', 'You found only one solution; there are two on [0, 2π).'),
      tx('İkinci çözümü yanlış bölgede almışsın; ASTC işaret tablosuyla ikinci bölgeyi bul.', 'The second solution is in the wrong quadrant; use the ASTC sign table to locate it.')];
    return Q(tx('Trigonometrik denklem', 'Trigonometric equation'), tx(`[0, 2π) aralığında ${fn} x = ${vstr} denkleminin çözüm kümesi hangisidir?`, `Which is the solution set of ${fn} x = ${vstr} on [0, 2π)?`), setStr(sol), wrongs,
      [tx(`Referans açı: ${fn} α = ${row[0]} ⇒ α = ${piStr(ref, 180)}.`, `Reference angle: ${fn} α = ${row[0]} ⇒ α = ${piStr(ref, 180)}.`),
        tx(`${fn} x ${val > 0 ? 'pozitif' : 'negatif'}: ASTC tablosuna göre çözümler iki bölgededir.`, `${fn} x is ${val > 0 ? 'positive' : 'negative'}: by the ASTC table the solutions lie in two quadrants.`),
        tx(`Çözüm kümesi: ${setStr(sol)}.`, `Solution set: ${setStr(sol)}.`)], rng, notes);
  }

  function xArcFindAngle(rng) {
    const r = rng.nextInt(2, 10);
    const deg = rng.pick([30, 45, 60, 90, 120, 135, 150, 210, 240, 300]);
    const s = piStr(r * deg, 180);
    const wrongs = [`${deg * r * r}°`, `${deg * 2}°`, `${decT(fmt1(deg / 2))}°`, `${piStr(deg, 180)} rad`];
    const notes = [
      tx("θ = s/r yerine s·r yapmışsın; s = rθ olduğundan açı s/r'dir.", 'You computed s·r instead of s/r; since s = rθ, the angle is s/r.'),
      tx('İkiyle çarpmışsın (alan formülündeki ½ ile karışmış); θ = s/r.', 'You doubled the answer (mixed up with the ½ of the sector-area formula); θ = s/r.'),
      tx('s/(2r) bulmuşsun; formülde fazladan 2 yok: θ = s/r.', 'You got s/(2r); there is no extra 2: θ = s/r.'),
      tx('θ = s/r radyan cinsindendir; soru dereceyi soruyor, 180/π ile çevirmelisin.', 'θ = s/r is in radians; the question asks for degrees, so convert with 180/π.')];
    return Q(tx('Yay uzunluğu ve daire dilimi', 'Arc length and sector'), tx(`Yarıçapı ${r} cm olan bir çemberde uzunluğu ${s} cm olan yayı gören merkez açı kaç derecedir?`, `In a circle of radius ${r} cm, an arc of length ${s} cm is subtended by a central angle of how many degrees?`), `${deg}°`, wrongs,
      [tx('s = rθ ⇒ θ = s / r (radyan).', 's = rθ ⇒ θ = s / r (radians).'), `θ = (${s})/${r} = ${piStr(deg, 180)} rad`, tx(`Dereceye çevir: ${piStr(deg, 180)}·180°/π = ${deg}°.`, `Convert: ${piStr(deg, 180)}·180°/π = ${deg}°.`)], rng, notes);
  }

  function xRadExact(rng) {
    const f = rng.pick([[7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6], [-1, 6], [-1, 3], [-3, 4], [-2, 3], [-5, 6], [13, 6], [7, 3], [9, 4], [-7, 6], [-5, 4], [10, 3], [-11, 6]]);
    const deg = f[0] * 180 / f[1];
    const fn = rng.pick(['sin', 'cos', 'tan']);
    const c = exactTrig(fn, deg);
    const swapFn = fn === 'sin' ? 'cos' : 'sin';
    const absC = c.startsWith('-') ? c.substring(1) : c;
    const wrongs = [negate(c), exactTrig(swapFn, deg), absC === c ? negate(c) : absC, ...shuffleArr(POOL.slice(), rng)];
    const notes = [
      tx('İşareti ters almışsın; açının bulunduğu bölgede fonksiyonun işaretine bak.', "You got the sign wrong; check the sign of the function in the angle's quadrant."),
      tx('Fonksiyonu karıştırmışsın (sin yerine cos ya da tersi).', 'You used the wrong function (sin instead of cos or vice versa).'),
      tx('Bölge işaretini hiç uygulamamışsın; yalnızca referans açının değerini yazmışsın.', 'You skipped the quadrant sign and only wrote the reference-angle value.')];
    const red = ((deg % 360) + 360) % 360;
    return Q(tx('Radyan cinsinden özel açılar', 'Exact values at radian angles'), tx(`${fn}(${piStr(f[0], f[1])}) değeri kaçtır?`, `What is ${fn}(${piStr(f[0], f[1])})?`), c, wrongs,
      [tx(`${piStr(f[0], f[1])} = ${deg}°; açıyı [0°, 360°) aralığına getir: ${red}°.`, `${piStr(f[0], f[1])} = ${deg}°; reduce to [0°, 360°): ${red}°.`),
        tx('Referans açıyı ve bölgenin işaretini kullan.', 'Use the reference angle and the sign of the quadrant.'), `${fn}(${piStr(f[0], f[1])}) = ${c}`], rng, notes);
  }

  function xPhaseShift(rng) {
    const B = rng.pick([2, 3, 4]);
    const f = rng.pick([[1, 2], [1, 3], [1, 4], [2, 3], [1, 6], [3, 4]]);
    const s = rng.nextInt(0, 2) === 0 ? 1 : -1; // +: shifts left
    const fn = rng.nextInt(0, 2) === 0 ? 'sin' : 'cos';
    const C = piStr(f[0], f[1]), sh = piStr(f[0], f[1] * B);
    const mk = (v, left) => tx(`${v} birim ${left ? 'sola' : 'sağa'}`, `${v} units ${left ? 'left' : 'right'}`);
    const left = s > 0;
    const sign = s > 0 ? '+' : '-';
    const q = Q(tx('Faz kayması', 'Phase shift'), tx(`y = ${fn}(${B}x ${sign} ${C}) grafiği y = ${fn}(${B}x) grafiğinden nasıl kaydırılmıştır?`, `How is the graph of y = ${fn}(${B}x ${sign} ${C}) shifted relative to y = ${fn}(${B}x)?`),
      mk(sh, left), [mk(sh, !left), mk(C, left), mk(piStr(f[0] * B, f[1]), left), mk(C, !left)],
      [tx(`Argümanı çarpanlara ayır: ${B}x ${sign} ${C} = ${B}(x ${sign} ${C}/${B}).`, `Factor the argument: ${B}x ${sign} ${C} = ${B}(x ${sign} ${C}/${B}).`),
        tx(`Kayma = ${C}/${B} = ${sh}; x + c sola, x - c sağa kaydırır.`, `Shift = ${C}/${B} = ${sh}; x + c shifts left, x - c shifts right.`)], rng,
      [tx('Yönü ters okumuşsun: x + c sola, x - c sağa kaydırır.', 'You read the direction backwards: x + c shifts left, x - c shifts right.'),
        tx(`Sabiti ${B}'ye bölmeyi unutmuşsun; kayma C/B'dir.`, `You forgot to divide the constant by ${B}; the shift is C/B.`),
        tx(`Sabiti ${B} ile çarpmışsın; faz kayması C/B'dir, C·B değil.`, `You multiplied the constant by ${B}; the shift is C/B, not C·B.`),
        tx('Hem bölmeyi unutmuşsun hem yönü ters almışsın.', 'You forgot to divide by B and also reversed the direction.')]);
    q.plot = new PlotSpec(-2 * Math.PI, 2 * Math.PI, -1.5, 1.5).addCurve((x) => Math[fn](B * x));
    return q;
  }

  function xGraphEq(rng) {
    const a = rng.pick([2, 3, 4]), b = rng.pick([2, 3, 4]), d = rng.pick([-2, -1, 1, 2]);
    const eq = (A, Bv, D) => `y = ${A} sin(${Bv}x) ${plus(D)}`;
    const mx = a + d, mn = -a + d, per = piStr(2, b);
    const q = Q(tx('Grafikten denklem okuma', 'Reading an equation from a graph'),
      tx(`Grafiği verilen y = A sin(Bx) + D (A, B > 0) fonksiyonunun en büyük değeri ${mx}, en küçük değeri ${mn} ve periyodu ${per}'dir. Denklem hangisidir?`, `The graph of y = A sin(Bx) + D (A, B > 0) has maximum ${mx}, minimum ${mn} and period ${per}. Which is its equation?`),
      eq(a, b, d), [eq(mx, b, d), eq(a, b, -d), eq(a, 2 * b, d), `y = ${a} sin(${per}·x) ${plus(d)}`],
      [tx(`A = (max − min)/2 = (${mx} − (${mn}))/2 = ${a}; D = (max + min)/2 = ${d}.`, `A = (max − min)/2 = (${mx} − (${mn}))/2 = ${a}; D = (max + min)/2 = ${d}.`),
        tx(`Periyot 2π/B = ${per} ⇒ B = ${b}.`, `Period 2π/B = ${per} ⇒ B = ${b}.`), eq(a, b, d)], rng,
      [tx("Genlik olarak en büyük değeri almışsın; genlik (max − min)/2'dir, orta çizgi D ayrıdır.", 'You used the maximum as the amplitude; the amplitude is (max − min)/2 and the midline D is separate.'),
        tx("D'nin işaretini ters almışsın; orta çizgi (max + min)/2'dir.", 'You flipped the sign of D; the midline is (max + min)/2.'),
        tx("B'yi iki katı almışsın; periyot 2π/B'dir, π/B değil.", 'You doubled B; the period is 2π/B, not π/B.'),
        tx('B yerine periyodun kendisini yazmışsın; B = 2π/periyot.', 'You wrote the period itself in place of B; B = 2π/period.')]);
    q.plot = new PlotSpec(0, 4 * Math.PI / b, mn - 1, mx + 1).addCurve((x) => a * Math.sin(b * x) + d);
    return q;
  }

  function xAsymptote(rng) {
    const kind = rng.nextInt(0, 3);
    const topic = tx('Tanjant ve kotanjant asimptotları', 'Tangent and cotangent asymptotes');
    if (kind === 2) {
      const f = rng.pick([[1, 4], [1, 6], [1, 3], [-1, 4], [-1, 6]]);
      const sg = f[0] > 0 ? '+' : '-';
      const c12 = 12 * f[0] / f[1];
      const x0 = mod(6 - c12, 12);
      const wrongs = [piStr(mod(6 + c12, 12), 12), piStr(6, 12), piStr(mod(c12, 12), 12), piStr(mod(-c12, 12), 12), piStr(1, 12)];
      const notes = [
        tx("Kaymanın yönünü ters almışsın; x + c ifadesinde asimptot π/2 - c'dedir.", 'You applied the shift in the wrong direction; for x + c the asymptote is at π/2 - c.'),
        tx("Bu y = tan x'in asimptotudur; kaymayı hesaba katmamışsın.", 'That is the asymptote of y = tan x; you ignored the shift.'),
        tx("Kaymanın kendisini yazmışsın; asimptot için argüman π/2'ye eşit olmalı.", 'You wrote the shift itself; the argument must equal π/2 for an asymptote.'),
        tx('İşareti ters alıp kaymayı doğrudan yazmışsın.', 'You flipped the sign and wrote the shift directly.'),
        tx("Bu rastgele bir değerdir; argümanı π/2'ye eşitle.", 'This is arbitrary; set the argument equal to π/2.')];
      const cs = piStr(Math.abs(f[0]), f[1]);
      return Q(topic, tx(`y = tan(x ${sg} ${cs}) fonksiyonunun grafiğinin en küçük POZİTİF düşey asimptotu x = ? `, `What is the smallest POSITIVE vertical asymptote x of y = tan(x ${sg} ${cs})?`), piStr(x0, 12), wrongs,
        [tx('tan u, u = π/2 + kπ noktalarında tanımsızdır.', 'tan u is undefined at u = π/2 + kπ.'),
          tx(`x ${sg} ${cs} = π/2 + kπ ⇒ x = π/2 ${f[0] > 0 ? '-' : '+'} ${cs} + kπ.`, `x ${sg} ${cs} = π/2 + kπ ⇒ x = π/2 ${f[0] > 0 ? '-' : '+'} ${cs} + kπ.`),
          tx(`k seç, en küçük pozitif değer: ${piStr(x0, 12)}.`, `Choose k for the smallest positive value: ${piStr(x0, 12)}.`)], rng, notes);
    }
    const b = rng.pick([2, 3, 4]);
    const kk = (n, d) => `k·${piStr(n, d)}`;
    if (kind === 0) {
      const c = `x = ${piStr(1, 2 * b)} + ${kk(1, b)}`;
      return Q(topic, tx(`y = tan(${b}x) fonksiyonunun düşey asimptotları hangisidir? (k ∈ ℤ)`, `Which are the vertical asymptotes of y = tan(${b}x)? (k ∈ ℤ)`), c,
        [`x = ${kk(1, b)}`, `x = ${piStr(1, 2)} + kπ`, `x = ${piStr(1, b)} + ${kk(1, 2 * b)}`, `x = ${kk(1, 2 * b)}`],
        [tx(`tan u, u = π/2 + kπ'de tanımsızdır; burada u = ${b}x.`, `tan u is undefined at u = π/2 + kπ; here u = ${b}x.`), tx(`${b}x = π/2 + kπ ⇒ x = ${piStr(1, 2 * b)} + ${kk(1, b)}.`, `${b}x = π/2 + kπ ⇒ x = ${piStr(1, 2 * b)} + ${kk(1, b)}.`)], rng,
        [tx("Bunlar tan(bx)'in SIFIRLARIDIR (sin bx = 0); asimptotlar cos bx = 0'da olur.", 'These are the ZEROS of tan(bx) (sin bx = 0); asymptotes occur where cos bx = 0.'),
          tx("b'yi hesaba katmamışsın; bx = π/2 + kπ denkleminde x'e geçerken b'ye bölünür.", 'You ignored b; when solving bx = π/2 + kπ you must divide by b.'),
          tx("Başlangıç noktası ile adımı karıştırmışsın; ilk asimptot π/(2b), adım π/b'dir.", 'You swapped the offset and the step; the first asymptote is π/(2b) and the spacing is π/b.'),
          tx("Adımı yarıya indirmişsin; tan(bx) için asimptotlar arası uzaklık π/b'dir.", 'You halved the spacing; asymptotes of tan(bx) are π/b apart.')]);
    }
    const c = `x = ${kk(1, b)}`;
    return Q(topic, tx(`y = cot(${b}x) fonksiyonunun düşey asimptotları hangisidir? (k ∈ ℤ)`, `Which are the vertical asymptotes of y = cot(${b}x)? (k ∈ ℤ)`), c,
      [`x = ${piStr(1, 2 * b)} + ${kk(1, b)}`, `x = ${kk(2, b)}`, `x = ${kk(1, 2 * b)}`, `x = ${kk(1, 1)}`],
      [tx('cot u = cos u / sin u, sin u = 0 iken tanımsızdır: u = kπ.', 'cot u = cos u / sin u is undefined when sin u = 0: u = kπ.'), tx(`${b}x = kπ ⇒ x = ${kk(1, b)}.`, `${b}x = kπ ⇒ x = ${kk(1, b)}.`)], rng,
      [tx("Bunlar tan(bx)'in asimptotlarıdır; cot için sin bx = 0 gerekir.", 'These are the asymptotes of tan(bx); cot needs sin bx = 0.'),
        tx("Adımı iki katı almışsın; periyot π/b'dir (2π/b değil).", 'You doubled the spacing; the period is π/b, not 2π/b.'),
        tx("Adımı yarıya indirmişsin; asimptotlar π/b aralıklıdır.", 'You halved the spacing; asymptotes are π/b apart.'),
        tx("b'yi hesaba katmamışsın.", 'You ignored b.')]);
  }

  // --- Level 3
  function xSumTan(rng) {
    const rows = [
      [15, 'tan(45° − 30°)', '2 − √3', 'tan 15° = (tan 45° − tan 30°)/(1 + tan 45° tan 30°) = (1 − √3/3)/(1 + √3/3) = (3 − √3)/(3 + √3) = 2 − √3'],
      [75, 'tan(45° + 30°)', '2 + √3', 'tan 75° = (tan 45° + tan 30°)/(1 − tan 45° tan 30°) = (1 + √3/3)/(1 − √3/3) = (3 + √3)/(3 − √3) = 2 + √3'],
      [105, 'tan(60° + 45°)', MINUS + '2 − √3', 'tan 105° = (tan 60° + tan 45°)/(1 − tan 60° tan 45°) = (√3 + 1)/(1 − √3) = (√3 + 1)²/(1 − 3) = −(2 + √3)'],
      [165, 'tan(120° + 45°)', '√3 − 2', 'tan 165° = (tan 120° + tan 45°)/(1 − tan 120° tan 45°) = (1 − √3)/(1 + √3) = (1 − √3)²/(1 − 3) = √3 − 2'],
    ];
    const r = rows[rng.nextInt(0, 4)];
    const all = ['2 − √3', '2 + √3', MINUS + '2 − √3', '√3 − 2'];
    const wrongs = all.filter((v) => v !== r[2]).concat(['(1 − √3)/2', '√3/3 − 1', '1 + √3/3']);
    const rel = tx('Bu, ilgili başka bir açının tanjantıdır; açı ayrıştırmasını ve bölgenin işaretini kontrol et.', 'This is the tangent of a related angle; re-check the angle split and the quadrant sign.');
    const notes = [rel, rel, rel,
      tx('Paydadaki 1 ∓ tan A tan B terimini hesaba katmamışsın.', 'You ignored the denominator 1 ∓ tan A tan B.'),
      tx('Pay ve paydayı sadeleştirirken işlem hatası yapmışsın.', 'There is an algebra slip while simplifying numerator and denominator.'),
      tx('Toplam formülü yerine tan A + tan B gibi doğrusal açmışsın.', 'You expanded linearly, as if tan(A ± B) = tan A ± tan B.')];
    return Q(tx('Toplam/fark formülleri', 'Sum and difference formulas'), tx(`tan ${r[0]}° değeri kaçtır? (ipucu: ${r[1]})`, `What is tan ${r[0]}°? (hint: ${r[1]})`), r[2], wrongs,
      ['tan(A ± B) = (tan A ± tan B)/(1 ∓ tan A tan B)', r[3], tx(`Sonuç: ${r[2]}.`, `Result: ${r[2]}.`)], rng, notes);
  }

  function xSumGiven(rng) {
    const pickT = () => { const t = rng.pick(TRIP.slice(0, 4)); return rng.nextInt(0, 2) === 0 ? [t[0], t[1], t[2]] : [t[1], t[0], t[2]]; };
    const sgS = (q) => (q <= 2 ? 1 : -1), sgC = (q) => (q === 1 || q === 4 ? 1 : -1);
    let t1, t2, qa, qb, kind, num, den, sA, cA, sB, cB, vals;
    do {
      t1 = pickT(); t2 = pickT(); qa = rng.nextInt(1, 5); qb = rng.nextInt(1, 5); kind = rng.nextInt(0, 4);
      sA = sgS(qa) * t1[0]; cA = sgC(qa) * t1[1]; sB = sgS(qb) * t2[0]; cB = sgC(qb) * t2[1];
      den = t1[2] * t2[2];
      vals = [sA * cB + cA * sB, cA * cB - sA * sB, sA * cB - cA * sB, cA * cB + sA * sB];
      num = vals[kind];
    } while (num === 0);
    const names = ['sin(A + B)', 'cos(A + B)', 'sin(A − B)', 'cos(A − B)'];
    const forms = ['sin A cos B + cos A sin B', 'cos A cos B − sin A sin B', 'sin A cos B − cos A sin B', 'cos A cos B + sin A sin B'];
    const c = frac(num, den);
    const posVal = [t1[0] * t2[1] + t1[1] * t2[0], t1[1] * t2[1] - t1[0] * t2[0], t1[0] * t2[1] - t1[1] * t2[0], t1[1] * t2[1] + t1[0] * t2[0]][kind];
    const wrongs = [frac(vals[(kind + 2) % 4], den), frac(-num, den), frac(posVal, den), frac(vals[kind ^ 1 ], den), frac(num + 2, den), frac(num - 2, den)];
    const notes = [
      tx('Toplam ile fark formülünü karıştırmışsın (işaret hatası).', 'You mixed up the sum and difference formulas (a sign error).'),
      tx('Sonucun işaretini ters almışsın; bölge işaretlerini (ASTC) kontrol et.', 'You flipped the sign of the result; check the quadrant signs (ASTC).'),
      tx('Tüm değerleri pozitif almışsın; bölgelere göre cos A ve sin B işaretlerini belirlemelisin.', 'You took every value positive; the quadrants determine the signs of cos A and sin B.'),
      tx('Sin ve cos formüllerini karıştırmışsın (yanlış formül).', 'You used the wrong formula (sin and cos formulas mixed up).'),
      tx('Sayısal bir hesap hatası: pay 2 fazla.', 'An arithmetic slip: numerator 2 too large.'),
      tx('Sayısal bir hesap hatası: pay 2 eksik.', 'An arithmetic slip: numerator 2 too small.')];
    const fA = frac(sA, t1[2]), fB = frac(cB, t2[2]);
    return Q(tx('Toplam/fark formülleri', 'Sum and difference formulas'),
      tx(`sin A = ${fA}, A ${roman(qa)}. bölgede ve cos B = ${fB}, B ${roman(qb)}. bölgede ise ${names[kind]} kaçtır?`, `If sin A = ${fA} with A in quadrant ${roman(qa)}, and cos B = ${fB} with B in quadrant ${roman(qb)}, what is ${names[kind]}?`), c, wrongs,
      [tx(`Bölge işaretleriyle: cos A = ${frac(cA, t1[2])}, sin B = ${frac(sB, t2[2])}.`, `Using the quadrant signs: cos A = ${frac(cA, t1[2])}, sin B = ${frac(sB, t2[2])}.`), `${names[kind]} = ${forms[kind]}`,
        tx(`Yerine yaz ve hesapla: ${names[kind]} = ${c}.`, `Substitute and compute: ${names[kind]} = ${c}.`)], rng, notes);
  }

  function xQuadEq(rng) {
    const fn = rng.nextInt(0, 2) === 0 ? 'sin' : 'cos';
    const m = rng.nextInt(0, 2) === 0 ? 1 : -1, n = rng.pick([1, -1, 0]);
    const f = Math[fn], v = fn + ' x';
    const c1 = -(2 * n + m), c0 = m * n;
    const term = (cv, s) => (cv === 0 ? '' : ` ${cv < 0 ? '−' : '+'} ${Math.abs(cv) === 1 && s ? '' : Math.abs(cv)}${s}`);
    const eq = `2${fn}²x${term(c1, v)}${term(c0, '')} = 0`;
    const r1 = m / 2, r2 = n;
    const sol = sortNum(solveDegs(f, r1).concat(solveDegs(f, r2)));
    const flipped = sortNum(solveDegs(f, -r1).concat(solveDegs(f, -r2)));
    const wrongs = [setStr(sortNum(solveDegs(f, r1))), setStr(sortNum(solveDegs(f, r2))), setStr(flipped), setStr(sol.slice(0, sol.length - 1)), setStr(sortNum(sol.concat([(sol[0] + 180) % 360])))];
    const rootTxt = (r) => (r === 0 ? '0' : (r === 1 ? '1' : (r === -1 ? '-1' : (r > 0 ? '1/2' : '-1/2'))));
    const notes = [
      tx(`Yalnızca ${v} = ${rootTxt(r1)} kökünü almışsın; ikinci çarpandan gelen çözümleri de ekle.`, `You used only the root ${v} = ${rootTxt(r1)}; the second factor also gives solutions.`),
      tx(`Yalnızca ${v} = ${rootTxt(r2)} kökünü almışsın; birinci çarpandan gelen çözümleri de ekle.`, `You used only the root ${v} = ${rootTxt(r2)}; the first factor also gives solutions.`),
      tx('Köklerin işaretlerini ters almışsın (çarpanlara ayırırken işaret hatası).', 'You flipped the signs of the roots (a sign slip while factoring).'),
      tx('Bir çözümü atlamışsın; her kök için her iki bölgedeki çözümleri bul.', 'You missed a solution; find the solutions in both quadrants for each root.'),
      tx('Köklerden birine ait olmayan fazladan bir açı eklemişsin.', 'You added an extra angle that belongs to neither root.')];
    return Q(tx('Trigonometrik denklem', 'Trigonometric equation'), tx(`[0, 2π) aralığında ${eq} denkleminin çözüm kümesi hangisidir?`, `Which is the solution set of ${eq} on [0, 2π)?`), setStr(sol), wrongs,
      [tx(`t = ${v} diyelim: ${eq.replace(/2(sin|cos)²x/, '2t²').replace(/ (sin|cos) x/, ' t')}.`, `Let t = ${v}: ${eq.replace(/2(sin|cos)²x/, '2t²').replace(/ (sin|cos) x/, ' t')}.`),
        tx(`Çarpanlara ayır: (2t ${m === 1 ? '−' : '+'} 1)(t${n > 0 ? ' − 1' : (n < 0 ? ' + 1' : '')}) = 0 ⇒ ${v} = ${rootTxt(r1)} ya da ${v} = ${rootTxt(r2)}.`, `Factor: (2t ${m === 1 ? '−' : '+'} 1)(t${n > 0 ? ' − 1' : (n < 0 ? ' + 1' : '')}) = 0 ⇒ ${v} = ${rootTxt(r1)} or ${v} = ${rootTxt(r2)}.`),
        tx(`Her kök için [0, 2π) aralığındaki açıları bul: ${setStr(sol)}.`, `Find the angles in [0, 2π) for each root: ${setStr(sol)}.`)], rng, notes);
  }

  function xDoubleArc(rng) {
    const t = rng.pick(TRIP.slice(0, 4));
    const swap = rng.nextInt(0, 2) === 0;
    const a = swap ? t[1] : t[0], b = swap ? t[0] : t[1], c = t[2];
    const sg = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const useCos = rng.nextInt(0, 2) === 0;
    const askSin = rng.nextInt(0, 2) === 0;
    let s, co, arg, inv;
    if (useCos) { co = sg * b; s = a; arg = frac(sg * b, c); inv = 'arccos'; } else { s = sg * a; co = b; arg = frac(sg * a, c); inv = 'arcsin'; }
    const nm = askSin ? 'sin' : 'cos';
    const num = askSin ? 2 * s * co : co * co - s * s;
    const cor = frac(num, c * c);
    const other = askSin ? frac(co * co - s * s, c * c) : frac(2 * s * co, c * c);
    const wrongs = askSin
      ? [other, frac(-num, c * c), frac(2 * s, c), frac(s * co, c * c), frac(2 * Math.abs(s * co), c * c)]
      : [other, frac(-num, c * c), frac(2 * co, c), frac(co * co + s * s, c * c), frac(co * co, c * c)];
    const notes = [
      tx('sin 2θ ile cos 2θ formüllerini karıştırmışsın.', 'You mixed up the sin 2θ and cos 2θ formulas.'),
      tx("İşareti ters almışsın; θ'nın bölgesine göre sin θ ve cos θ işaretlerini kontrol et.", 'You flipped the sign; check the signs of sin θ and cos θ for the quadrant of θ.'),
      tx('Çift açı formülü yerine değeri 2 ile çarpmışsın; sin 2θ ≠ 2 sin θ, cos 2θ ≠ 2 cos θ.', 'You doubled the value instead of using the double-angle formula; sin 2θ ≠ 2 sin θ, cos 2θ ≠ 2 cos θ.'),
      tx('Formülde bir terimi ya da 2 çarpanını eksik yazmışsın.', 'You dropped the factor 2 or a term from the formula.'),
      tx('Çift açı formülünde terimlerin işareti hatalı.', 'The signs of the terms in the double-angle formula are wrong.')];
    return Q(tx('Ters trigonometrik fonksiyonlar ve çift açı', 'Inverse trig and double angle'), tx(`${nm}(2·${inv}(${arg})) değeri kaçtır?`, `What is ${nm}(2·${inv}(${arg}))?`), cor, wrongs,
      [tx(`θ = ${inv}(${arg}) olsun: ${useCos ? 'cos' : 'sin'} θ = ${arg}, θ ${useCos ? '[0, π]' : '[−π/2, π/2]'} aralığında.`, `Let θ = ${inv}(${arg}): ${useCos ? 'cos' : 'sin'} θ = ${arg}, with θ in ${useCos ? '[0, π]' : '[−π/2, π/2]'}.`),
        tx(`Pisagor: ${useCos ? 'sin' : 'cos'} θ = ${frac(useCos ? s : co, c)} (bu aralıkta ${useCos ? 'sin' : 'cos'} θ ≥ 0).`, `Pythagoras: ${useCos ? 'sin' : 'cos'} θ = ${frac(useCos ? s : co, c)} (non-negative on this interval).`),
        askSin ? `sin 2θ = 2 sin θ cos θ = 2·(${frac(s, c)})·(${frac(co, c)}) = ${cor}` : `cos 2θ = cos²θ − sin²θ = (${frac(co, c)})² − (${frac(s, c)})² = ${cor}`], rng, notes);
  }

  function radStr(n, h2) {
    const k = Math.round(Math.sqrt(h2));
    if (k * k === h2) return frac(n, k);
    const g = gcd(Math.abs(n), h2), co = Math.abs(n) / g, den = h2 / g;
    return (n < 0 ? '-' : '') + (co === 1 ? '' : co) + '√' + h2 + (den === 1 ? '' : '/' + den);
  }

  function xArcTanComp(rng) {
    let a, b;
    do { a = rng.nextInt(1, 6); b = rng.nextInt(1, 6); } while (gcd(a, b) !== 1);
    const sg = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const askSin = rng.nextInt(0, 2) === 0;
    const h2 = a * a + b * b;
    const arg = frac(sg * a, b);
    const n = askSin ? sg * a : b;
    const c = radStr(n, h2);
    const nOther = askSin ? b : sg * a;
    const wrongs = [radStr(nOther, h2), radStr(-n, h2), arg, frac(n, h2), frac(n, a + b), radStr(Math.abs(n), h2)];
    const notes = [
      tx('sin ile cos değerlerini karıştırmışsın (karşı ve komşu kenarı ters almışsın).', 'You swapped sin and cos (opposite and adjacent sides reversed).'),
      tx('İşareti ters almışsın; arctan (−π/2, π/2) aralığındadır: cos hep pozitiftir, sin argümanın işaretini taşır.', 'You flipped the sign; arctan lies in (−π/2, π/2), so cos is always positive and sin has the sign of the argument.'),
      tx("Bu tan θ'nın kendisidir; sorulan oran sin ya da cos.", 'This is tan θ itself; the ratio asked is sin or cos.'),
      tx('Hipotenüsü kareli bırakmışsın (karekök almayı unutmuşsun).', 'You left the hypotenuse squared (forgot the square root).'),
      tx("Hipotenüs yerine a + b kullanmışsın; hipotenüs √(a² + b²)'dir.", 'You used a + b as the hypotenuse; it is √(a² + b²).'),
      tx('İşaret hatası: negatif argüman negatif sinüs verir.', 'Sign slip: a negative argument gives a negative sine.')];
    const hyp = Math.sqrt(h2) % 1 === 0 ? String(Math.sqrt(h2)) : '√' + h2;
    return Q(tx('Ters trigonometrik fonksiyonlar', 'Inverse trigonometric functions'), tx(`${askSin ? 'sin' : 'cos'}(arctan(${arg})) değeri kaçtır?`, `What is ${askSin ? 'sin' : 'cos'}(arctan(${arg}))?`), c, wrongs,
      [tx(`θ = arctan(${arg}) ⇒ tan θ = ${arg}, θ ∈ (−π/2, π/2). Karşı kenar ${sg * a}, komşu kenar ${b}.`, `θ = arctan(${arg}) ⇒ tan θ = ${arg}, θ ∈ (−π/2, π/2). Opposite ${sg * a}, adjacent ${b}.`),
        tx(`Hipotenüs = √(${a}² + ${b}²) = ${hyp}.`, `Hypotenuse = √(${a}² + ${b}²) = ${hyp}.`),
        tx(`${askSin ? 'sin' : 'cos'} θ = ${askSin ? 'karşı' : 'komşu'}/hipotenüs = ${c}.`, `${askSin ? 'sin' : 'cos'} θ = ${askSin ? 'opposite' : 'adjacent'}/hypotenuse = ${c}.`)], rng, notes);
  }

  function xAmpPhase(rng) {
    const A = rng.pick([-4, -3, -2, 2, 3, 4, 5]);
    const B = rng.pick([2, 3, 4]);
    const f = rng.pick([[1, 2], [1, 3], [1, 4], [1, 6], [2, 3], [3, 4]]);
    const s = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const D = nonZero(rng, -3, 3);
    const fn = rng.nextInt(0, 2) === 0 ? 'sin' : 'cos';
    const left = s > 0;
    const mk = (amp, per, sh, lft, mid) => tx(`Genlik ${amp}, periyot ${per}, faz kayması ${sh} ${lft ? 'sola' : 'sağa'}, orta çizgi y = ${mid}`, `Amplitude ${amp}, period ${per}, phase shift ${sh} ${lft ? 'left' : 'right'}, midline y = ${mid}`);
    const aa = Math.abs(A), per = piStr(2, B), sh = piStr(f[0], f[1] * B), shC = piStr(f[0], f[1]);
    const c = mk(aa, per, sh, left, D);
    const wrongs = [mk(aa, per, sh, !left, D), mk(aa, per, shC, left, D), mk(aa, piStr(2 * B, 1), sh, left, D), mk(A < 0 ? A : A + D, per, sh, left, D), mk(aa, per, sh, left, -D)];
    const notes = [
      tx('Kayma yönünü ters okumuşsun: Bx + C pozitifse grafik sola kayar.', 'You reversed the shift direction: a positive Bx + C shifts the graph left.'),
      tx("C'yi B'ye bölmeyi unutmuşsun; faz kayması C/B büyüklüğündedir.", 'You forgot to divide C by B; the phase shift has size C/B.'),
      tx("Periyodu 2πB almışsın; periyot 2π/B'dir.", 'You took the period as 2πB; it is 2π/B.'),
      tx("Genlik her zaman |A| (pozitif)'dir; D genliğe karışmaz.", 'Amplitude is always |A| (positive), and D does not belong in it.'),
      tx("Orta çizginin işaretini ters almışsın; orta çizgi y = D'dir.", 'You flipped the sign of the midline; it is y = D.')];
    const sign = s > 0 ? '+' : '-';
    return Q(tx('Genlik, periyot, faz ve dikey kayma', 'Amplitude, period, phase and vertical shift'),
      tx(`y = ${A} ${fn}(${B}x ${sign} ${piStr(f[0], f[1])}) ${plus(D)} fonksiyonu için aşağıdakilerden hangisi doğrudur?`, `Which statement is correct for y = ${A} ${fn}(${B}x ${sign} ${piStr(f[0], f[1])}) ${plus(D)}?`), c, wrongs,
      [tx('y = A sin(Bx + C) + D: genlik |A|, periyot 2π/|B|, faz kayması −C/B, orta çizgi y = D.', 'y = A sin(Bx + C) + D: amplitude |A|, period 2π/|B|, phase shift −C/B, midline y = D.'),
        tx(`Genlik = |${A}| = ${aa}; periyot = 2π/${B} = ${per}.`, `Amplitude = |${A}| = ${aa}; period = 2π/${B} = ${per}.`),
        tx(`Faz kayması: ${B}x ${sign} ${piStr(f[0], f[1])} = ${B}(x ${sign} ${shC}/${B}) ⇒ ${sh} ${left ? 'sola' : 'sağa'}; orta çizgi y = ${D}.`, `Phase shift: ${B}x ${sign} ${piStr(f[0], f[1])} = ${B}(x ${sign} ${shC}/${B}) ⇒ ${sh} ${left ? 'left' : 'right'}; midline y = ${D}.`)], rng, notes);
  }

  function xPeriodFrac(rng) {
    const mkTerm = () => {
      const fn = rng.pick(['sin', 'cos', 'tan']);
      const base = fn === 'tan' ? 1 : 2;
      if (rng.nextInt(0, 2) === 0) { const a = rng.pick([2, 3, 4, 5]); const g = gcd(base, a); return { fn, arg: `${a}x`, n: base / g, d: a / g }; }
      const p = rng.pick([2, 3, 4, 6]); return { fn, arg: `x/${p}`, n: base * p, d: 1 };
    };
    let t1, t2;
    do { t1 = mkTerm(); t2 = mkTerm(); } while (t1.n * t2.d === t2.n * t1.d || (t1.fn === 'tan' && t2.fn === 'tan'));
    const n = lcm(t1.n, t2.n), d = gcd(t1.d, t2.d);
    const c = piStr(n, d);
    const r1 = t1.n / t1.d, r2 = t2.n / t2.d;
    const wrongs = [piStr(t1.n * t2.n, t1.d * t2.d), piStr(t1.n * t2.d + t2.n * t1.d, t1.d * t2.d), r1 > r2 ? piStr(t1.n, t1.d) : piStr(t2.n, t2.d), piStr(lcm(t1.n, t2.n), lcm(t1.d, t2.d)), r1 > r2 ? piStr(t2.n, t2.d) : piStr(t1.n, t1.d), piStr(2 * n, d)];
    const notes = [
      tx('Periyotları çarpmışsın; ortak periyot en küçük ortak KATtır (EKOK).', 'You multiplied the periods; the common period is their least common multiple.'),
      tx('Periyotları toplamışsın; toplamın periyodu periyotların toplamı değildir.', 'You added the periods; the period of a sum is not the sum of the periods.'),
      tx('Yalnızca uzun olan terimin periyodunu almışsın; kısa terim bunun tam katında tekrar etmeyebilir.', 'You took only the longer period; the other term need not repeat there.'),
      tx('Paydaları da EKOK ile birleştirmişsin; kesirli periyotlarda pay için EKOK, payda için EBOB alınır.', 'You took the lcm of denominators too; for fractional periods use lcm of numerators and gcd of denominators.'),
      tx('Yalnızca kısa olan terimin periyodunu almışsın; uzun terim henüz tekrar etmedi.', 'You took only the shorter period; the longer term has not repeated yet.'),
      tx('Bu bir periyottur ama en küçük pozitif periyot değildir.', 'This is a period, but not the smallest positive one.')];
    return Q(tx('Toplam fonksiyonun periyodu', 'Period of a sum'), tx(`f(x) = ${t1.fn}(${t1.arg}) + ${t2.fn}(${t2.arg}) fonksiyonunun (en küçük pozitif) periyodu nedir?`, `What is the smallest positive period of f(x) = ${t1.fn}(${t1.arg}) + ${t2.fn}(${t2.arg})?`), c, wrongs,
      [tx(`${t1.fn}(${t1.arg}) periyodu ${piStr(t1.n, t1.d)}; ${t2.fn}(${t2.arg}) periyodu ${piStr(t2.n, t2.d)}.`, `${t1.fn}(${t1.arg}) has period ${piStr(t1.n, t1.d)}; ${t2.fn}(${t2.arg}) has period ${piStr(t2.n, t2.d)}.`),
        tx('Kesirli periyotlarda ortak periyot = EKOK(paylar)/EBOB(paydalar) (π biriminde).', 'For fractional periods the common period = lcm(numerators)/gcd(denominators) (in units of π).'),
        tx(`Periyot = ${c}.`, `Period = ${c}.`)], rng, notes);
  }

  function xSolveDouble(rng) {
    const fn = rng.nextInt(0, 2) === 0 ? 'sin' : 'cos';
    const f = Math[fn];
    const row = rng.pick([['1/2', 0.5], ['√3/2', Math.sqrt(3) / 2]]);
    const sgn = rng.nextInt(0, 2) === 0 ? 1 : -1;
    const val = sgn * row[1], vstr = sgnTxt(sgn) + row[0];
    const sol = solveDegs(f, val, 2);
    const base = solveDegs(f, val, 1);
    const wrongs = [setStr(sol.slice(0, 2)), setStr(base), setStr(sol.slice(0, 3)), setStr(solveDegs(f, -val, 2))];
    const notes = [
      tx('Yalnızca ilk turdaki çözümleri almışsın; 2x, [0, 4π) aralığında dolaştığından ikinci turun çözümleri de gerekir.', 'You used only the first turn; 2x runs over [0, 4π), so the second turn also contributes solutions.'),
      tx("2x yerine x için çözmüşsün (2'ye bölmeyi unutmuşsun).", 'You solved as if the argument were x (forgot to divide by 2).'),
      tx('Bir çözümü atlamışsın; 4 çözüm bulunmalıdır.', 'You missed one solution; there must be four.'),
      tx('Değerin işaretini ters almışsın.', 'You flipped the sign of the value.')];
    return Q(tx('Trigonometrik denklem', 'Trigonometric equation'), tx(`[0, 2π) aralığında ${fn} 2x = ${vstr} denkleminin çözüm kümesi hangisidir?`, `Which is the solution set of ${fn} 2x = ${vstr} on [0, 2π)?`), setStr(sol), wrongs,
      [tx(`u = 2x diyelim; x ∈ [0, 2π) ⇒ u ∈ [0, 4π). ${fn} u = ${vstr} için u = ${base.map((d) => piStr(d, 180)).join(', ')} ve bir tur sonrası ${base.map((d) => piStr(d + 360, 180)).join(', ')}.`, `Let u = 2x; x ∈ [0, 2π) ⇒ u ∈ [0, 4π). ${fn} u = ${vstr} gives u = ${base.map((d) => piStr(d, 180)).join(', ')} and one turn later ${base.map((d) => piStr(d + 360, 180)).join(', ')}.`),
        tx("Hepsini 2'ye böl: x = u/2.", 'Divide all by 2: x = u/2.'), tx(`Çözüm kümesi: ${setStr(sol)}.`, `Solution set: ${setStr(sol)}.`)], rng, notes);
  }

  // ---------------------------------------------------------------- difficulty levels (never shown to students)
  trExact.level = 1; trDegRad.level = 1; trRadDeg.level = 1; trUndefined.level = 1; trUnitCircle.level = 1; trArc.level = 1;
  trPeriod.level = 1; trShift.level = 1; trIdentity.level = 1;
  xRadConv.level = 1; xQuadSigns.level = 1; xSecCscCot.level = 1; xArcExact.level = 1; xArcDomRange.level = 1;
  trTriple.level = 2; trSolve.level = 2; trRange.level = 2;
  xCoterminal.level = 2; xArcSector.level = 2; xGivenQuad.level = 2; xDomRange6.level = 2; xSimplify.level = 2; xPeriodAbs.level = 2;
  xPeriodSum.level = 3; xPeriodPiece.level = 3; xSumAngle.level = 3; xDoubleAngle.level = 3; xHalfAngle.level = 3; xArcTrap.level = 3; xArcComp.level = 3;
  xSolveBasic.level = 2; xArcFindAngle.level = 2; xRadExact.level = 2; xPhaseShift.level = 2; xGraphEq.level = 2; xAsymptote.level = 2;
  xSumTan.level = 3; xSumGiven.level = 3; xQuadEq.level = 3; xDoubleArc.level = 3; xArcTanComp.level = 3; xAmpPhase.level = 3; xPeriodFrac.level = 3; xSolveDouble.level = 3;

  const EXAM_NEW = [
    xSolveBasic, xArcFindAngle, xRadExact, xPhaseShift, xGraphEq, xAsymptote,
    xSumTan, xSumGiven, xQuadEq, xDoubleArc, xArcTanComp, xAmpPhase, xPeriodFrac, xSolveDouble,
  ];

  const GENERATORS = [
    trExact, trDegRad, trRadDeg, trPeriod, trTriple, trShift, trUndefined, trIdentity, trSolve, trUnitCircle, trArc, trRange,
    xRadConv, xCoterminal, xArcSector, xSecCscCot, xQuadSigns, xGivenQuad, xDomRange6,
    xSumAngle, xDoubleAngle, xHalfAngle, xSimplify, xPeriodSum, xPeriodAbs, xPeriodPiece, xArcExact, xArcTrap, xArcComp, xArcDomRange,
  ];

  Topics.register('trig', {
    type: 'quiz',
    tabTitle: () => tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  // Printable exam sets: every generator above plus the extra exam-only ones, each tagged with .level (1/2/3).
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.trig = GENERATORS.concat(EXAM_NEW);
})();
