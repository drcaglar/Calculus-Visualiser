// Ported from Modules/Trigonometry/TangentAsymptoteControl.vb (no animation).
// problem = { offset } : distance of the marked point from the asymptote x = pi/2 (0.001 .. 1.4);
// the slider moves the point towards pi/2 and the viewport stretches vertically (as in ApplyOffset).
(function () {
  const TARGET_X = Math.PI / 2;
  const OFFSET_MAX = 1.4, OFFSET_MIN = 0.001;
  const POPUP_THRESHOLD = 30;

  const FNS = ['tan', 'cot', 'sec', 'csc'];
  // x0 = asymptote the point approaches: tan, sec -> pi/2; cot, csc -> 0.
  const x0Of = (fn) => (fn === 'tan' || fn === 'sec' ? TARGET_X : 0);
  const x0Text = (fn) => (fn === 'tan' || fn === 'sec' ? 'π/2' : '0');

  function evalFn(fn, x) {
    const s = Math.sin(x), c = Math.cos(x);
    if (fn === 'tan') return Math.abs(c) < 1e-9 ? NaN : s / c;
    if (fn === 'cot') return Math.abs(s) < 1e-9 ? NaN : c / s;
    if (fn === 'sec') return Math.abs(c) < 1e-9 ? NaN : 1 / c;
    return Math.abs(s) < 1e-9 ? NaN : 1 / s;
  }
  function evalTan(x) { return evalFn('tan', x); }

  function clampOffset(o) { return Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, o)); }

  // kind 0: approach an asymptote of tan / cot / sec / csc (fn, side -1 = from the left, +1 = from the right);
  // kind 1: transformed form y = A tan(Bx + C) + D with C = cq*pi/6 (asymptotes and period).
  function newProblem() { return { kind: 0, fn: 'tan', side: -1, offset: 1.4, A: 1, B: 1, cq: 0, D: 0 }; }
  function createProblem() { return newProblem(); }
  function genApproach(rng) {
    return Object.assign(newProblem(), { fn: rng.pick(FNS), side: rng.pick([-1, 1]), offset: rng.pick([1.4, 1.2, 1, 0.8, 0.5]) });
  }
  function genTransformed(rng) {
    return Object.assign(newProblem(), {
      kind: 1, A: rng.pick([1, 2, 3, -1, -2]), B: rng.pick([1, 2, 3, 4]),
      cq: rng.pick([-4, -3, -2, -1, 0, 1, 2, 3, 4]), D: rng.pick([-2, -1, 0, 1, 2]),
    });
  }

  function pointOf(p) {
    const x = x0Of(p.fn) + p.side * clampOffset(p.offset);
    return { x, y: evalFn(p.fn, x) };
  }

  // transformed form helpers
  const piTx = (n, d) => TrigKit.piStr(n, d);
  function equationT(p) {
    const a = p.A === 1 ? '' : (p.A === -1 ? '-' : fmt2(p.A) + '·');
    const b = p.B === 1 ? '' : String(p.B);
    const c = p.cq === 0 ? '' : ` ${p.cq > 0 ? '+' : '−'} ${piTx(Math.abs(p.cq), 6)}`;
    const d = p.D === 0 ? '' : ` ${p.D > 0 ? '+' : '−'} ${fmt2(Math.abs(p.D))}`;
    return `y = ${a}tan(${b}x${c})${d}`;
  }
  // asymptotes x = pi(3 - cq + 6k)/(6B) inside [-2pi, 2pi]
  function asymK(p) {
    const ks = [];
    for (let k = -30; k <= 30; k++) {
      const n = 3 - p.cq + 6 * k;
      if (Math.abs(n) <= 12 * p.B) ks.push(n);
    }
    return ks;
  }
  const evalT = (p) => (x) => {
    const arg = p.B * x + p.cq * Math.PI / 6;
    const c = Math.cos(arg);
    return Math.abs(c) < 1e-9 ? NaN : p.A * Math.sin(arg) / c + p.D;
  };

  function sideTx(p) { return p.side < 0 ? '⁻' : '⁺'; }

  function problemStatement(p) {
    if (p.kind === 1) {
      return I18N.tx(
        `${equationT(p)} fonksiyonunun periyodunu, düşey asimptotlarını ve dallarının yönünü birlikte bulalım.`,
        `For ${equationT(p)}, let's find the period, the vertical asymptotes and the direction of its branches.`);
    }
    const pt = pointOf(p), x0 = x0Text(p.fn);
    return I18N.tx(
      `x = ${x0} asimptotuna x = ${fmt2(pt.x)} noktasından yaklaşırken ${p.fn}(x) nasıl davranır? x → ${x0}${sideTx(p)} iken ${p.fn}(x) değerine birlikte bakalım.`,
      `How does ${p.fn}(x) behave as x approaches the asymptote x = ${x0} from x = ${fmt2(pt.x)}? Let's look at ${p.fn}(x) as x → ${x0}${sideTx(p)}.`);
  }

  function concept() {
    return I18N.tx(
      "TANJANT: tan x = sin x / cos x. Payda cos x = 0 olduğunda fonksiyon tanımsızdır.\n" +
      "   Tanım kümesi: x ≠ π/2 + kπ (k tam sayı)\n" +
      "   Dikey asimptotlar: x = π/2 + kπ  (… −3π/2, −π/2, π/2, 3π/2 …)\n" +
      "   Değer kümesi: (−∞, ∞)\n" +
      "   Periyot: π (tan(x + π) = tan x)\n" +
      "   Sıfırlar: x = kπ.  Tek fonksiyon: tan(−x) = −tan x.\n" +
      "   Her dal (iki asimptot arasında) artandır.\n" +
      "\n" +
      "DAVRANIŞ: Asimptota soldan yaklaşırken x → π/2⁻ için tan x → +∞ (sin → 1 > 0, cos → 0⁺); sağdan x → π/2⁺ için tan x → −∞ (cos → 0⁻). Yakında tan(π/2 − ε) = cot ε ≈ 1/ε: ε ne kadar küçülürse değer o kadar büyür. Grafik asimptotu asla kesmez; asimptot grafiğin parçası değildir.\n" +
      "\n" +
      "DİĞER ÜÇ FONKSİYON:\n" +
      "   cot x = cos x / sin x: asimptotlar x = kπ; sıfırlar π/2 + kπ; periyot π; azalandır.\n" +
      "   sec x = 1/cos x: asimptotlar x = π/2 + kπ; |sec x| ≥ 1; periyot 2π.\n" +
      "   csc x = 1/sin x: asimptotlar x = kπ; |csc x| ≥ 1; periyot 2π.\n" +
      "Genel kural: bir oranın dikey asimptotu, paydanın sıfır olduğu ve payın sıfır olmadığı yerlerdedir.\n" +
      "\n" +
      "DÖNÜŞMÜŞ FORM: y = A·tan(Bx + C) + D için periyot π/|B|, asimptotlar Bx + C = π/2 + kπ çözümünden gelir.\n" +
      "\n" +
      "YÖNTEM (asimptot bulma):\n" +
      "   (1) Önce fonksiyonu sin/cos oranı olarak yazabiliriz (tan, cot, sec, csc).\n" +
      "   (2) Paydayı 0'a eşitleyip çözeriz (cos x = 0 ⇒ x = π/2 + kπ).\n" +
      "   (3) Bu noktalarda payın 0 olmadığına bakarız (aksi halde grafikte delik olabilir).\n" +
      "   (4) Asimptotlar kesikli dikey çizgilerle işaretlenir; aralarına tek bir dal çizilebilir.\n" +
      "   (5) Her dalın yönü (tan için artan) ve uçlarının ±∞'a gittiği yön işaretten bulunur.\n" +
      "   (6) Periyot kullanılarak dal diğer yerlere kopyalanır.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - tan(π/2) = ∞ yazılması; değer tanımsızdır, ∞ yalnızca limitin yönünü anlatır.\n" +
      "   - Periyodun 2π sanılması; tan için π'dir (sec ve csc için 2π).\n" +
      "   - cot'un asimptotlarının π/2 + kπ alınması; onlar kπ'dedir.\n" +
      "   - Asimptotun iki yanında aynı işaretin varsayılması; tan'da işaret değişir (+∞ ve −∞).\n" +
      "   - y = tan(2x)'te periyodun π sanılması; doğrusu π/2'dir.\n" +
      "\n" +
      "MİNİ ÖRNEK: y = tan(2x). Periyot π/2. 2x = π/2 + kπ ⇒ x = π/4 + kπ/2: asimptotlar … −π/4, π/4, 3π/4 … Sıfırlar: 2x = kπ ⇒ x = kπ/2. Sayısal gözlem: tan(π/2 − 0,1) = cot(0,1) ≈ 9,97; ε = 0,01 için ≈ 100: değer yaklaşık 1/ε hızıyla sonsuza gider.",
      "TANGENT: tan x = sin x / cos x. The function is undefined wherever the denominator cos x = 0.\n" +
      "   Domain: x ≠ π/2 + kπ (k an integer)\n" +
      "   Vertical asymptotes: x = π/2 + kπ  (… −3π/2, −π/2, π/2, 3π/2 …)\n" +
      "   Range: (−∞, ∞)\n" +
      "   Period: π (tan(x + π) = tan x)\n" +
      "   Zeros: x = kπ.  Odd function: tan(−x) = −tan x.\n" +
      "   Every branch (between two asymptotes) is increasing.\n" +
      "\n" +
      "BEHAVIOUR: approaching the asymptote from the left, x → π/2⁻, tan x → +∞ (sin → 1 > 0, cos → 0⁺); from the right, x → π/2⁺, tan x → −∞ (cos → 0⁻). Nearby tan(π/2 − ε) = cot ε ≈ 1/ε: the smaller ε gets, the larger the value. The graph never crosses an asymptote; the asymptote is not part of the graph.\n" +
      "\n" +
      "THE OTHER THREE FUNCTIONS:\n" +
      "   cot x = cos x / sin x: asymptotes x = kπ; zeros π/2 + kπ; period π; decreasing.\n" +
      "   sec x = 1/cos x: asymptotes x = π/2 + kπ; |sec x| ≥ 1; period 2π.\n" +
      "   csc x = 1/sin x: asymptotes x = kπ; |csc x| ≥ 1; period 2π.\n" +
      "General rule: a ratio has a vertical asymptote where the denominator is zero and the numerator is not.\n" +
      "\n" +
      "TRANSFORMED FORM: for y = A·tan(Bx + C) + D the period is π/|B| and the asymptotes come from solving Bx + C = π/2 + kπ.\n" +
      "\n" +
      "METHOD (finding asymptotes):\n" +
      "   (1) First we can write the function as a ratio of sin and cos (tan, cot, sec, csc).\n" +
      "   (2) We set the denominator equal to 0 and solve (cos x = 0 ⇒ x = π/2 + kπ).\n" +
      "   (3) We check that the numerator is not 0 there (otherwise it may be a hole).\n" +
      "   (4) The asymptotes are marked with dashed vertical lines, and one branch can be sketched between them.\n" +
      "   (5) The sign tells us the direction of each branch (increasing for tan) and where its ends go (±∞).\n" +
      "   (6) Using the period, we copy the branch to the others.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Writing tan(π/2) = ∞; the value is undefined, ∞ only describes the direction of the limit.\n" +
      "   - Thinking the period is 2π; for tan it is π (for sec and csc it is 2π).\n" +
      "   - Putting cot's asymptotes at π/2 + kπ; they are at kπ.\n" +
      "   - Assuming the same sign on both sides of an asymptote; for tan it changes (+∞ and −∞).\n" +
      "   - Taking the period of y = tan(2x) to be π; it is π/2.\n" +
      "\n" +
      "MINI EXAMPLE: y = tan(2x). Period π/2. 2x = π/2 + kπ ⇒ x = π/4 + kπ/2: asymptotes … −π/4, π/4, 3π/4 … Zeros: 2x = kπ ⇒ x = kπ/2. Numerical check: tan(π/2 − 0.1) = cot(0.1) ≈ 9.97; for ε = 0.01 it is about 100: the value grows roughly like 1/ε.");
  }

  function limitSign(p) { return (p.fn === 'tan' || p.fn === 'sec') ? -p.side : p.side; } // +1 -> +inf, -1 -> -inf

  function stepsApproach(p) {
    const pt = pointOf(p), fn = p.fn, x0 = x0Text(fn), sd = sideTx(p);
    const usesCos = fn === 'tan' || fn === 'sec';
    const den = usesCos ? 'cos' : 'sin';
    const ratio = { tan: 'sin(x) / cos(x)', cot: 'cos(x) / sin(x)', sec: '1 / cos(x)', csc: '1 / sin(x)' }[fn];
    const zeros = usesCos ? 'x = π/2 + kπ' : 'x = kπ';
    const dz = limitSign(p) > 0 ? '⁺' : '⁻';
    const inf = limitSign(p) > 0 ? '+∞' : '−∞';
    const numTx = { tan: 'sin(x) → 1', cot: 'cos(x) → 1', sec: '1', csc: '1' }[fn];
    const steps = [];
    steps.push(I18N.tx(`f(x) = ${fn}(x) = ${ratio}`, `f(x) = ${fn}(x) = ${ratio}`));
    steps.push(I18N.tx(`${den}(x) = 0 olduğunda payda sıfırdır: ${zeros}. Bunlara düşey asimptot diyoruz (grafiğin yaklaşıp hiç dokunmadığı dikey doğrular).`,
      `When ${den}(x) = 0 the denominator is zero: ${zeros}. These are the vertical asymptotes (vertical lines the graph approaches but never touches).`));
    steps.push(I18N.tx(`İncelediğimiz nokta: x = ${fmt2(pt.x)}   ${fn}(x) = ${fmt2(pt.y)}   (x → ${x0}${sd})`,
      `The point we look at: x = ${fmt2(pt.x)}   ${fn}(x) = ${fmt2(pt.y)}   (x → ${x0}${sd})`));
    steps.push(I18N.tx(`Asimptota olan uzaklık: |x - ${x0}| = ${fmt2(clampOffset(p.offset))}`,
      `Distance to the asymptote: |x - ${x0}| = ${fmt2(clampOffset(p.offset))}`));
    steps.push(I18N.tx(`x → ${x0}${sd} iken pay: ${numTx}; payda: ${den}(x) → 0${dz}. Bu yüzden ${fn}(x) → ${inf}. (Öbür taraftan yaklaşırsak işaret değişir.)`,
      `As x → ${x0}${sd} the numerator: ${numTx}; the denominator: ${den}(x) → 0${dz}. Hence ${fn}(x) → ${inf}. (From the other side the sign flips.)`));
    if (Math.abs(pt.y) > POPUP_THRESHOLD) {
      steps.push(I18N.tx(`Sonsuza gidiyor: x → ${x0} iken ${den}(x) → 0 olur ve ${fn}(x) sınırsızca büyür. Yani ${fn} fonksiyonunun burada düşey bir asimptotu vardır.`,
        `Heading to Infinity: as x → ${x0}, ${den}(x) → 0 and ${fn}(x) grows without bound. The ${fn} function has a vertical asymptote here.`));
    } else {
      steps.push(I18N.tx(`Noktayı ${x0}'a biraz daha yaklaştırırsak |${fn}(x)| sınırsızca büyür (|${fn}(x)| > 30 olunca bir uyarı görünür).`,
        `If we move the point even closer to ${x0}, |${fn}(x)| grows without bound (a notice appears once |${fn}(x)| > 30).`));
    }
    return steps;
  }

  function stepsTransformed(p) {
    const ks = asymK(p), steps = [];
    const C = p.cq === 0 ? '0' : piTx(p.cq, 6);
    const xs = ks.map((n) => piTx(n, 6 * p.B));
    const shown = xs.length > 6 ? xs.slice(0, 6).join(',  ') + ' …' : xs.join(',  ');
    const centre = p.cq === 0 ? '0' : piTx(-p.cq, 6 * p.B);
    steps.push('── 1) ' + I18N.tx('Parametreler', 'Parameters') + ' ──');
    steps.push(I18N.tx(`${equationT(p)}  biçimi y = A·tan(Bx + C) + D ile karşılaştırılır: A = ${fmt2(p.A)}, B = ${p.B}, C = ${C}, D = ${fmt2(p.D)}.`,
      `Compare ${equationT(p)} with y = A·tan(Bx + C) + D: A = ${fmt2(p.A)}, B = ${p.B}, C = ${C}, D = ${fmt2(p.D)}.`));
    steps.push('── 2) ' + I18N.tx('Periyot', 'Period') + ' ──');
    steps.push(I18N.tx(`Periyot = π/|B| = ${piTx(1, p.B)}. (A yalnızca düşey germedir, tan'ın genliği yoktur.)`,
      `Period = π/|B| = ${piTx(1, p.B)}. (A is only a vertical stretch; tan has no amplitude.)`));
    steps.push('── 3) ' + I18N.tx('Düşey asimptotlar', 'Vertical asymptotes') + ' ──');
    steps.push(I18N.tx(`Bx + C = π/2 + kπ çözülür: x = (π/2 − C)/B + kπ/B. Burada ilk asimptotlardan biri x = ${xs[Math.floor(xs.length / 2)] || '—'} ve komşuları ${piTx(1, p.B)} aralıklıdır.`,
      `Solve Bx + C = π/2 + kπ: x = (π/2 − C)/B + kπ/B. One asymptote is x = ${xs[Math.floor(xs.length / 2)] || '—'} and the others are spaced ${piTx(1, p.B)} apart.`));
    steps.push(I18N.tx(`Grafikteki asimptotlar (−2π ≤ x ≤ 2π): x = ${shown}.`, `Asymptotes on the graph (−2π ≤ x ≤ 2π): x = ${shown}.`));
    steps.push('── 4) ' + I18N.tx('Orta nokta ve yön', 'Centre point and direction') + ' ──');
    steps.push(I18N.tx(`Bx + C = 0 ⇒ x = −C/B = ${centre}: grafik burada y = D = ${fmt2(p.D)} değerinden geçer.`,
      `Bx + C = 0 ⇒ x = −C/B = ${centre}: the graph passes through y = D = ${fmt2(p.D)} here.`));
    steps.push(p.A > 0
      ? I18N.tx('A > 0 olduğundan her dal artandır (soldaki asimptotta −∞, sağdakinde +∞).', 'Since A > 0 every branch is increasing (−∞ at the left asymptote, +∞ at the right one).')
      : I18N.tx('A < 0 olduğundan dallar x eksenine göre yansır: her dal azalandır (soldaki asimptotta +∞, sağdakinde −∞).', 'Since A < 0 the branches are reflected: every branch is decreasing (+∞ at the left asymptote, −∞ at the right one).'));
    steps.push(I18N.tx('Değer kümesi: (−∞, ∞).', 'Range: (−∞, ∞).'));
    return steps;
  }

  function solveSteps(p) { return p.kind === 1 ? stepsTransformed(p) : stepsApproach(p); }

  function draw(canvas, p) {
    if (p.kind === 1) {
      canvas.setViewport(-2 * Math.PI, 2 * Math.PI, -8, 8);
      canvas.addFunction({ evaluator: evalT(p), color: canvas.accent(), thickness: 2.5, label: equationT(p) });
      canvas.addGuideLine({ axis: 'horizontal', position: p.D, color: canvas.gray() });
      asymK(p).forEach((n) => canvas.addGuideLine({ axis: 'vertical', position: n * Math.PI / (6 * p.B), color: canvas.gray() }));
      const cx = -p.cq * Math.PI / (6 * p.B);
      canvas.addMarker({ x: cx, y: p.D, color: canvas.orange(), radius: 6, label: `(${fmt2(cx)}, ${fmt2(p.D)})` });
      return;
    }
    const pt = pointOf(p);
    const half = Math.min(200, Math.max(6, (Number.isFinite(pt.y) ? Math.abs(pt.y) : 6) * 1.3));
    canvas.setViewport(-2 * Math.PI, 2 * Math.PI, -half, half);
    canvas.addFunction({ evaluator: (x) => evalFn(p.fn, x), color: canvas.accent(), thickness: 2.5, label: `${p.fn}(x)` });
    const base = x0Of(p.fn);
    for (let k = -2; k <= 2; k++) {
      canvas.addGuideLine({ axis: 'vertical', position: base + k * Math.PI, color: canvas.gray() });
    }
    if (Number.isFinite(pt.y)) {
      canvas.addMarker({ x: pt.x, y: pt.y, color: canvas.orange(), radius: 6, label: `(${fmt2(pt.x)}, ${fmt2(pt.y)})` });
    }
  }

  function buildControls(rightCol, getProblem, h) {
    const kinds = () => [
      { label: I18N.tx('tan x: asimptota yaklaşma', 'tan x: approaching the asymptote'), value: 'tan' },
      { label: I18N.tx('cot x: asimptota yaklaşma', 'cot x: approaching the asymptote'), value: 'cot' },
      { label: I18N.tx('sec x: asimptota yaklaşma', 'sec x: approaching the asymptote'), value: 'sec' },
      { label: I18N.tx('csc x: asimptota yaklaşma', 'csc x: approaching the asymptote'), value: 'csc' },
      { label: 'y = A·tan(Bx + C) + D', value: 'tr' },
    ];
    h.addSelect({
      options: kinds(),
      get: () => (getProblem().kind === 1 ? 'tr' : getProblem().fn),
      set: (v) => {
        const p = getProblem();
        if (v === 'tr') p.kind = 1; else { p.kind = 0; p.fn = v; }
      },
    });
    h.addSlider({
      caption: I18N.tx('Noktayı asimptota doğru hareket ettirelim (yaklaşma örnekleri)', 'Move the point towards the asymptote (approach examples)'),
      min: 0, max: OFFSET_MAX - OFFSET_MIN, step: 0.001,
      get: () => OFFSET_MAX - clampOffset(getProblem().offset),
      set: (v) => { getProblem().offset = clampOffset(OFFSET_MAX - v); },
    });
    h.addSlider({
      caption: I18N.tx('Taraf: −1 soldan, +1 sağdan (yaklaşma)', 'Side: −1 from the left, +1 from the right (approach)'),
      min: -1, max: 1, step: 2,
      get: () => getProblem().side,
      set: (v) => { getProblem().side = v < 0 ? -1 : 1; },
    });
    const mk = (caption, min, max, key, fix) => h.addSlider({
      caption, min, max, step: 1,
      get: () => getProblem()[key],
      set: (v) => { const r = Math.round(Math.max(min, Math.min(max, v))); getProblem()[key] = fix ? fix(r) : r; },
    });
    mk(I18N.tx('A (dönüşmüş form)', 'A (transformed form)'), -3, 3, 'A', (r) => (r === 0 ? 1 : r));
    mk(I18N.tx('B (dönüşmüş form)', 'B (transformed form)'), 1, 4, 'B');
    mk(I18N.tx('C = k·π/6, k (dönüşmüş form)', 'C = k·π/6, k (transformed form)'), -6, 6, 'cq');
    mk(I18N.tx('D (dönüşmüş form)', 'D (transformed form)'), -3, 3, 'D');
  }

  Topics.register('trig', {
    id: 'tangentAsymptote',
    tabTitle: () => I18N.tx('Tanjant ve Asimptotlar', 'Tangent & Asymptotes'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    links: [
      { match: /^(TANJANT|TANGENT):/, make: () => newProblem() },
      { match: /^(DAVRANIŞ|BEHAVIOUR):/, make: (rng) => Object.assign(genApproach(rng), { fn: 'tan' }) },
      { match: /^\s+cot x = /, make: (rng) => Object.assign(genApproach(rng), { fn: 'cot' }) },
      { match: /^\s+sec x = /, make: (rng) => Object.assign(genApproach(rng), { fn: 'sec' }) },
      { match: /^\s+csc x = /, make: (rng) => Object.assign(genApproach(rng), { fn: 'csc' }) },
      { match: /^(DÖNÜŞMÜŞ FORM|TRANSFORMED FORM):/, make: (rng) => genTransformed(rng) },
    ],
    focus: (p) => {
      if (p.kind === 1) return { x: -p.cq * Math.PI / (6 * p.B), y: p.D };
      const pt = pointOf(p); return Number.isFinite(pt.y) ? { x: pt.x, y: pt.y } : { x: x0Of(p.fn), y: 0 };
    },
    buildControls,
  });
})();
