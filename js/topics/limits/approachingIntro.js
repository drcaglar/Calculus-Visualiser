// Limits & Continuity - "What Is a Limit?" (ported from Modules/Limits/ApproachingIntroControl.vb, enriched).
// problem = { kind, a, off, dir, reveal, ... }
//   kind 'poly'      : f(x) = polynomial, defined at a (limit = f(a))
//   kind 'hole'      : f(x) = (x-a)(x+m)/(x-a)  (hole at a, limit = a+m)
//   kind 'displaced' : f(x) = x+m for x != a, but f(a) is given a different value (limit independent of f(a))
//   kind 'jump'      : f(x) = x+b1 (x<a), x+b2 (x>=a)  -> left and right values differ, limit DOES NOT EXIST
// The slider moves the two sample points x = a -/+ off towards a (the VB "offset").
(function () {
  const T = (tr, en) => I18N.tx(tr, en);
  const OFF_MIN = 0.01, OFF_MAX = 3;

  // ---------- small helpers ----------
  function nf(v, d) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0' || s === '') s = '0';
    return s;
  }
  function par(v) { return v < 0 ? '(' + fmt2(v) + ')' : fmt2(v); }
  function polyStr(c) { // coefficients, highest degree first
    const n = c.length - 1;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const k = c[i];
      if (k === 0) continue;
      const d = n - i, ab = Math.abs(k);
      const body = d === 0 ? fmt2(ab) : ((ab === 1 ? '' : fmt2(ab)) + 'x' + (d === 1 ? '' : d === 2 ? '²' : '³'));
      if (s === '') s = (k < 0 ? '-' : '') + body; else s += (k < 0 ? ' - ' : ' + ') + body;
    }
    return s || '0';
  }
  function polyEval(c, x) { let r = 0; for (let i = 0; i < c.length; i++) r = r * x + c[i]; return r; }
  function xm(a) { return a === 0 ? 'x' : (a > 0 ? '(x - ' + a + ')' : '(x + ' + (-a) + ')'); }
  function xp(m) { return m === 0 ? 'x' : (m > 0 ? 'x + ' + m : 'x - ' + (-m)); }
  function dirName(d) { return d === 'left' ? T('soldan', 'from the left') : d === 'right' ? T('sağdan', 'from the right') : T('her iki taraftan', 'from both sides'); }

  // ---------- model ----------
  function model(p) {
    const a = p.a, m = {};
    m.a = a;
    switch (p.kind) {
      case 'hole': {
        const num = [1, p.m - a, -a * p.m];
        m.num = num;
        m.f = (x) => (Math.abs(x - a) < 1e-9 ? NaN : polyEval(num, x) / (x - a));
        m.str = `(${polyStr(num)}) / ${xm(a)}`;
        m.Ll = m.Lr = m.L = a + p.m; m.fa = null;
        break;
      }
      case 'displaced': {
        const L = a + p.m, fa = L + p.dv;
        m.f = (x) => (Math.abs(x - a) < 1e-9 ? fa : x + p.m);
        m.str = `${xp(p.m)}  (x ≠ ${a}),   f(${a}) = ${fmt2(fa)}`;
        m.Ll = m.Lr = m.L = L; m.fa = fa;
        break;
      }
      case 'jump': {
        m.f = (x) => (x < a ? x + p.b1 : x + p.b2);
        m.str = `${xp(p.b1)}  (x < ${a}),   ${xp(p.b2)}  (x ≥ ${a})`;
        m.Ll = a + p.b1; m.Lr = a + p.b2; m.L = null; m.fa = a + p.b2;
        break;
      }
      default: { // poly
        const c = p.c;
        m.f = (x) => polyEval(c, x);
        m.str = polyStr(c);
        m.Ll = m.Lr = m.L = polyEval(c, a); m.fa = m.L;
      }
    }
    return m;
  }

  function createProblem(rng) {
    const kinds = ['poly', 'hole', 'displaced', 'jump', 'hole', 'poly'];
    return build(rng, rng.pick(kinds));
  }
  function build(rng, kind) {
    const p = { kind, a: rng.nextInt(-3, 4), off: 2, dir: 'both', reveal: false };
    if (kind === 'poly') {
      const t = rng.nextInt(0, 3);
      if (t === 0) p.c = [1, 0, 0];
      else if (t === 1) p.c = [rng.nonZeroInt(-3, 3), rng.nextInt(-4, 5)];
      else p.c = [1, rng.nextInt(-3, 4), rng.nextInt(-3, 4)];
    } else if (kind === 'hole') {
      p.m = rng.nextInt(-3, 4);
    } else if (kind === 'displaced') {
      p.m = rng.nextInt(-2, 4);
      p.dv = rng.pick([-3, -2, 2, 3]);
    } else {
      p.b1 = rng.nextInt(-2, 3);
      p.b2 = p.b1 + rng.pick([-3, -2, -1, 1, 2, 3]);
    }
    return p;
  }

  function problemStatement(p) {
    const m = model(p);
    return T(
      `f(x) = ${m.str}\nx, ${p.a} sayısına soldan ve sağdan yaklaşırken f(x) hangi değere yaklaşıyor? Her iki taraf için küçük bir değer tablosu yapabiliriz. Limit varsa lim(x→${p.a}) f(x) değerini bulalım, yoksa nedenini açıklayalım ve sonucu f(${p.a}) ile karşılaştıralım.`,
      `f(x) = ${m.str}\nAs x approaches ${p.a} from the left and from the right, what does f(x) approach? Let's make a small table of values for each side. If the limit exists, we find lim(x→${p.a}) f(x); otherwise we explain why, and compare the result with f(${p.a}).`);
  }

  const CONCEPT_TR = [
    'TANIM (SEZGİSEL)',
    'x sayısı a\'ya yaklaşırken (x → a, ama x ≠ a) f(x) değerleri bir L sayısına istenildiği kadar yaklaşıyorsa "x, a\'ya giderken f(x)\'in limiti L\'dir" deriz ve',
    '   lim(x→a) f(x) = L',
    'yazarız. Limit, "f(a) kaç?" sorusunun değil, "a\'nın çevresinde f ne yapıyor?" sorusunun cevabıdır. x, a\'ya yaklaşır ama a\'ya ulaşmaz.',
    '',
    'LİMİT, f(a)\'DAN BAĞIMSIZDIR',
    '   - f(a) tanımsız olabilir (grafikte delik) ve limit yine de var olabilir.',
    '   - f(a) tanımlı olabilir ama limitten farklı olabilir.',
    '   - Üç ayrı kavram: f(a) (fonksiyonun değeri), lim f(x) (yaklaşılan değer), süreklilik (ikisinin eşit olması).',
    '',
    'TEK TARAFLI YAKLAŞIM',
    '   Soldan: x → a⁻ (x < a, x artarak a\'ya gelir).   Sağdan: x → a⁺ (x > a, x azalarak a\'ya gelir).',
    '   lim(x→a) f(x) = L  ⇔  lim(x→a⁻) f(x) = L ve lim(x→a⁺) f(x) = L.',
    '   İki taraf farklı sayılara gidiyorsa limit YOKTUR.',
    '',
    'YÖNTEM',
    '   (1) Önce doğrudan yerine koyabiliriz: f(a) hesaplanabiliyor ve f polinom/sürekli ise limit f(a)\'dır.',
    '   (2) 0/0 çıkarsa çarpanlara ayrılıp sadeleştirilir (ya da eşlenikle çarpılır).',
    '   (3) Bir değer tablosu yapılır: x = a ∓ 0,1; a ∓ 0,01; a ∓ 0,001 için f(x) değerlerine hem soldan hem sağdan bakılır.',
    '   (4) Soldaki ve sağdaki değerler aynı sayıya yaklaşıyorsa limit odur; yaklaşmıyorsa limit yoktur.',
    '   (5) Grafikte: a\'ya soldan ve sağdan yaklaşırken eğrinin hangi yüksekliğe gittiği gözlemlenir; delik veya dolu nokta fark etmez.',
    '',
    'SIK HATALAR',
    '   - "Limit = f(a)" sanmak (delik ve sıçrama durumlarında yanlış).',
    '   - Yalnızca bir taraftan bakmak (örneğin sadece sağdan).',
    '   - 0/0\'ı "0" ya da "1" ya da "tanımsız, dolayısıyla limit yok" diye yorumlamak; 0/0 belirsizdir; önce sadeleştirmek gerekir.',
    '   - Sayısal tabloyu kanıt saymak; tablo ipucudur, cebirle doğrulanır.',
    '',
    'MİNİ ÖRNEK',
    '   f(x) = (x² − 4)/(x − 2), x → 2. Yerine koyunca 0/0 çıkar. Pay = (x−2)(x+2) ⇒ f(x) = x + 2 (x ≠ 2). x = 1,9 → 3,9; 1,99 → 3,99; 2,01 → 4,01; 2,1 → 4,1. Limit = 4, ama f(2) tanımsızdır.',
    '',
    'AKILDA TUTMA: "Limit, hedefe bakmadan komşulara bakmaktır."',
  ].join('\n');

  const CONCEPT_EN = [
    'DEFINITION (INFORMAL)',
    'If, as x approaches a (x → a but x ≠ a), the values f(x) get arbitrarily close to a number L, we say "the limit of f(x) as x approaches a is L" and write',
    '   lim(x→a) f(x) = L',
    'A limit answers "what does f do around a?", not "what is f(a)?". x gets close to a but never reaches a.',
    '',
    'THE LIMIT IS INDEPENDENT OF f(a)',
    '   - f(a) may be not defined (a hole in the graph) and the limit can still exist.',
    '   - f(a) may be defined but different from the limit.',
    '   - Three separate ideas: f(a) (the value of the function), lim f(x) (the value approached), continuity (the two being equal).',
    '',
    'ONE-SIDED APPROACH',
    '   From the left: x → a⁻ (x < a, x increases up to a).   From the right: x → a⁺ (x > a, x decreases down to a).',
    '   lim(x→a) f(x) = L  ⇔  lim(x→a⁻) f(x) = L and lim(x→a⁺) f(x) = L.',
    '   If the two sides head to different numbers, the limit DOES NOT EXIST.',
    '',
    'METHOD',
    '   (1) We can first substitute directly: if f(a) can be computed and f is a polynomial/continuous, the limit is f(a).',
    '   (2) If we get 0/0, we can factor and cancel (or multiply by the conjugate).',
    '   (3) We can build a table of values: f(x) at x = a ∓ 0.1, a ∓ 0.01, a ∓ 0.001 (from both the left and the right).',
    '   (4) If the left and right values approach the same number, that is the limit; if not, the limit does not exist.',
    '   (5) On a graph: we can watch which height the curve heads to as we approach a from the left and from the right; a hole or a filled dot does not matter.',
    '',
    'COMMON PITFALLS',
    '   - Believing "limit = f(a)" (false for holes and jumps).',
    '   - Looking from only one side (for example only from the right).',
    '   - Reading 0/0 as "0", "1" or "not defined, so no limit"; 0/0 is indeterminate, so it helps to simplify first.',
    '   - Treating a numerical table as proof; a table is a hint, it is worth confirming it algebraically.',
    '',
    'MINI EXAMPLE',
    '   f(x) = (x² − 4)/(x − 2), x → 2. Substitution gives 0/0. Numerator = (x−2)(x+2) ⇒ f(x) = x + 2 (x ≠ 2). x = 1.9 → 3.9; 1.99 → 3.99; 2.01 → 4.01; 2.1 → 4.1. The limit is 4, but f(2) is not defined.',
    '',
    'MEMORY AID: "A limit means looking at the neighbours, not at the target itself."',
  ].join('\n');

  function concept() { return T(CONCEPT_TR, CONCEPT_EN); }

  function tableLines(m, a, side) {
    return [1, 0.1, 0.01, 0.001].map((d) => {
      const x = a + side * d;
      return `   x = ${nf(x, 3)}   →   f(x) = ${nf(m.f(x), 4)}`;
    }).join('\n');
  }

  function solveSteps(p) {
    const m = model(p), a = p.a, S = [];
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    S.push(T(
      `── 1) Soru ──\nf(x) = ${m.str}\nx → ${a} iken f(x) hangi değere yaklaşıyor? (x, ${a} değerine istenildiği kadar yaklaşır ama ${a} olmaz.)`,
      `── 1) The question ──\nf(x) = ${m.str}\nWhat does f(x) approach as x → ${a}? (x gets as close to ${a} as we like but never equals ${a}.)`));

    // 2) f(a)
    let s2;
    if (p.kind === 'poly') {
      s2 = T(`── 2) f(${a}) nedir? ──\nf(${a}) = ${fmt2(m.fa)}. Fonksiyon (polinom) ${a} noktasında tanımlı ve süreklidir; yine de limiti tabloyla kontrol edelim.`,
        `── 2) What is f(${a})? ──\nf(${a}) = ${fmt2(m.fa)}. The function (a polynomial) is defined and continuous at ${a}; we still confirm the limit with a table.`);
    } else if (p.kind === 'hole') {
      s2 = T(`── 2) f(${a}) nedir? ──\nx = ${a} koyunca pay = ${fmt2(polyEval(m.num, a))}, payda = ${par(a)} − ${par(a)} = 0 ⇒ 0/0 (belirsiz). f(${a}) TANIMSIZDIR (grafikte delik). Bu, limitin olmadığı anlamına gelmez.`,
        `── 2) What is f(${a})? ──\nSubstituting x = ${a}: numerator = ${fmt2(polyEval(m.num, a))}, denominator = ${par(a)} − ${par(a)} = 0 ⇒ 0/0 (indeterminate). f(${a}) is NOT DEFINED (a hole in the graph). That does not mean the limit fails to exist.`);
    } else if (p.kind === 'displaced') {
      s2 = T(`── 2) f(${a}) nedir? ──\nTanım gereği f(${a}) = ${fmt2(m.fa)} (noktanın kendisi için özel olarak verilmiş). Bu değer, çevredeki değerlerden ayrı bir "yalnız" noktadır.`,
        `── 2) What is f(${a})? ──\nBy definition f(${a}) = ${fmt2(m.fa)} (given specially for the point itself). It is an isolated point, separate from the nearby values.`);
    } else {
      s2 = T(`── 2) f(${a}) nedir? ──\nx = ${a} için ikinci parça kullanılır (x ≥ ${a}): f(${a}) = ${fmt2(m.fa)}. Ama limit için yalnızca ${a} civarındaki x ≠ ${a} değerleri önemlidir.`,
        `── 2) What is f(${a})? ──\nAt x = ${a} the second piece applies (x ≥ ${a}): f(${a}) = ${fmt2(m.fa)}. For the limit, however, only the values with x ≠ ${a} near ${a} matter.`);
    }
    S.push(s2);

    S.push(T(`── 3) Soldan yaklaşım (x → ${a}⁻) ──\n${tableLines(m, a, -1)}\nx arttıkça ${a} değerine yaklaşır; f(x) değerleri ${nf(m.Ll, 4)} sayısına gidiyor.`,
      `── 3) Approaching from the left (x → ${a}⁻) ──\n${tableLines(m, a, -1)}\nAs x increases towards ${a}, the values f(x) head to ${nf(m.Ll, 4)}.`));
    S.push(T(`── 4) Sağdan yaklaşım (x → ${a}⁺) ──\n${tableLines(m, a, 1)}\nx azaldıkça ${a} değerine yaklaşır; f(x) değerleri ${nf(m.Lr, 4)} sayısına gidiyor.`,
      `── 4) Approaching from the right (x → ${a}⁺) ──\n${tableLines(m, a, 1)}\nAs x decreases towards ${a}, the values f(x) head to ${nf(m.Lr, 4)}.`));

    if (m.L !== null) {
      S.push(T(`── 5) Karar ──\nSoldan ${fmt2(m.Ll)}, sağdan ${fmt2(m.Lr)}: iki taraf AYNI sayıya gidiyor.\nlim(x→${a}) f(x) = ${fmt2(m.L)}`,
        `── 5) Conclusion ──\nFrom the left ${fmt2(m.Ll)}, from the right ${fmt2(m.Lr)}: both sides head to the SAME number.\nlim(x→${a}) f(x) = ${fmt2(m.L)}`));
    } else {
      S.push(T(`── 5) Karar ──\nSoldan ${fmt2(m.Ll)}, sağdan ${fmt2(m.Lr)}: iki taraf FARKLI sayılara gidiyor.\nlim(x→${a}) f(x) YOKTUR (soldan limit ≠ sağdan limit).`,
        `── 5) Conclusion ──\nFrom the left ${fmt2(m.Ll)}, from the right ${fmt2(m.Lr)}: the two sides head to DIFFERENT numbers.\nlim(x→${a}) f(x) DOES NOT EXIST (left limit ≠ right limit).`));
    }

    // 6) comparison with f(a) and algebra check
    let s6;
    if (p.kind === 'poly') {
      s6 = T(`── 6) f(${a}) ile karşılaştırma ──\nlim = ${fmt2(m.L)} ve f(${a}) = ${fmt2(m.fa)}: eşit. Polinomlarda doğrudan yerine koymak limiti verir (f süreklidir).`,
        `── 6) Compare with f(${a}) ──\nlim = ${fmt2(m.L)} and f(${a}) = ${fmt2(m.fa)}: equal. For polynomials, direct substitution gives the limit (f is continuous).`);
    } else if (p.kind === 'hole') {
      s6 = T(`── 6) Cebirle doğrulama ──\nPay = ${xm(a)}${p.m === 0 ? 'x' : '(' + xp(p.m) + ')'}: ortak ${xm(a)} çarpanı sadeleşir ⇒ f(x) = ${xp(p.m)}  (x ≠ ${a}).\nx → ${a}: ${xp(p.m)} → ${fmt2(m.L)}.\nlim = ${fmt2(m.L)} ama f(${a}) tanımsız: limit, fonksiyonun orada tanımlı olmasına bağlı değildir.`,
        `── 6) Algebraic check ──\nNumerator = ${xm(a)}${p.m === 0 ? 'x' : '(' + xp(p.m) + ')'}: the common factor ${xm(a)} cancels ⇒ f(x) = ${xp(p.m)}  (x ≠ ${a}).\nx → ${a}: ${xp(p.m)} → ${fmt2(m.L)}.\nlim = ${fmt2(m.L)} yet f(${a}) is not defined: the limit does not depend on f being defined there.`);
    } else if (p.kind === 'displaced') {
      s6 = T(`── 6) f(${a}) ile karşılaştırma ──\nlim = ${fmt2(m.L)} ama f(${a}) = ${fmt2(m.fa)} ≠ ${fmt2(m.L)}.\nLimit, f(${a})'dan bağımsızdır: tek noktadaki değer yaklaşılan değeri değiştirmez. (Bu nokta süreksizdir; f(${a}) = ${fmt2(m.L)} yapılırsa süreklilik sağlanır.)`,
        `── 6) Compare with f(${a}) ──\nlim = ${fmt2(m.L)} but f(${a}) = ${fmt2(m.fa)} ≠ ${fmt2(m.L)}.\nThe limit is independent of f(${a}): the value at a single point does not change the value approached. (The point is a discontinuity; setting f(${a}) = ${fmt2(m.L)} would make f continuous.)`);
    } else {
      s6 = T(`── 6) f(${a}) ile karşılaştırma ──\nf(${a}) = ${fmt2(m.fa)} tanımlı olsa bile limit yoktur: sol parça ${fmt2(m.Ll)}, sağ parça ${fmt2(m.Lr)} değerine gider. Sıçrama büyüklüğü |${fmt2(m.Lr)} − ${par(m.Ll)}| = ${fmt2(Math.abs(m.Lr - m.Ll))}.`,
        `── 6) Compare with f(${a}) ──\nEven though f(${a}) = ${fmt2(m.fa)} is defined, the limit does not exist: the left piece heads to ${fmt2(m.Ll)} and the right piece to ${fmt2(m.Lr)}. The jump size is |${fmt2(m.Lr)} − ${par(m.Ll)}| = ${fmt2(Math.abs(m.Lr - m.Ll))}.`);
    }
    S.push(s6);

    // 7) slider point
    const xl = a - off, xr = a + off;
    let lines = '';
    if (p.dir !== 'right') lines += T(`   Sol nokta: x = ${nf(xl, 3)}, f(x) = ${nf(m.f(xl), 4)}, a'ya uzaklık = ${nf(off, 3)}\n`, `   Left point: x = ${nf(xl, 3)}, f(x) = ${nf(m.f(xl), 4)}, distance from a = ${nf(off, 3)}\n`);
    if (p.dir !== 'left') lines += T(`   Sağ nokta: x = ${nf(xr, 3)}, f(x) = ${nf(m.f(xr), 4)}, a'ya uzaklık = ${nf(off, 3)}\n`, `   Right point: x = ${nf(xr, 3)}, f(x) = ${nf(m.f(xr), 4)}, distance from a = ${nf(off, 3)}\n`);
    S.push(T(`── 7) Kaydırıcıdaki nokta (${dirName(p.dir)}) ──\n${lines}Kaydırıcıyı sola çekip uzaklığı küçülttüğümüzde nokta a'ya sınırsızca yaklaşır, yine de a'ya ulaşmaz (uzaklık ≥ 0,01).`,
      `── 7) The slider point (${dirName(p.dir)}) ──\n${lines}If we drag the slider left to shrink the distance, the point gets arbitrarily close to a, yet never reaches a (distance ≥ 0.01).`));
    return S;
  }

  function autoView(canvas, f, a, halfX, refs) {
    let lo = Infinity, hi = -Infinity;
    const ref = refs.length ? refs[0] : 0;
    for (let i = 0; i <= 80; i++) {
      const y = f(a - halfX + 2 * halfX * i / 80);
      if (isFinite(y) && Math.abs(y - ref) <= 9) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    refs.forEach((r) => { if (isFinite(r)) { lo = Math.min(lo, r); hi = Math.max(hi, r); } });
    if (!isFinite(lo)) { lo = -5; hi = 5; }
    let h = hi - lo;
    if (h < 5) { const c = (lo + hi) / 2; lo = c - 2.5; hi = c + 2.5; h = 5; }
    const pad = h * 0.12;
    canvas.setViewport(a - halfX, a + halfX, lo - pad, hi + pad);
  }

  function draw(canvas, p) {
    const m = model(p), a = p.a;
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    const refs = [];
    if (m.L !== null) refs.push(m.L); else { refs.push(m.Ll); refs.push(m.Lr); }
    if (m.fa !== null) refs.push(m.fa);
    autoView(canvas, m.f, a, 3.5, refs);

    canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: 'x = ' + a });
    if (p.kind === 'jump') {
      canvas.addFunction({ evaluator: (x) => (x < a ? m.f(x) : NaN), color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addFunction({ evaluator: (x) => (x >= a ? m.f(x) : NaN), color: canvas.accent(), thickness: 3 });
    } else {
      canvas.addFunction({ evaluator: m.f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    }
    if (p.reveal) {
      if (m.L !== null) canvas.addGuideLine({ axis: 'horizontal', position: m.L, color: canvas.green(), label: 'L = ' + fmt2(m.L) });
      else {
        canvas.addGuideLine({ axis: 'horizontal', position: m.Ll, color: canvas.blue(), label: 'L⁻ = ' + fmt2(m.Ll) });
        canvas.addGuideLine({ axis: 'horizontal', position: m.Lr, color: canvas.red(), label: 'L⁺ = ' + fmt2(m.Lr) });
      }
    }
    // the special points at x = a
    if (p.kind === 'poly') {
      canvas.addMarker({ x: a, y: m.fa, color: canvas.gold(), radius: 6 });
    } else if (p.kind === 'hole') {
      canvas.addMarker({ x: a, y: m.L, color: canvas.gray(), radius: 7, hollow: true });
    } else if (p.kind === 'displaced') {
      canvas.addMarker({ x: a, y: m.L, color: canvas.gray(), radius: 7, hollow: true });
      canvas.addMarker({ x: a, y: m.fa, color: canvas.orange(), radius: 6, label: 'f(' + a + ') = ' + fmt2(m.fa) });
    } else {
      canvas.addMarker({ x: a, y: m.Ll, color: canvas.blue(), radius: 7, hollow: true });
      canvas.addMarker({ x: a, y: m.fa, color: canvas.purple(), radius: 6 });
    }
    // the two moving sample points
    if (p.dir !== 'right') {
      const x = a - off, y = m.f(x);
      if (isFinite(y)) canvas.addMarker({ x, y, color: canvas.blue(), radius: 6, label: '(' + nf(x, 2) + ', ' + nf(y, 2) + ')' });
    }
    if (p.dir !== 'left') {
      const x = a + off, y = m.f(x);
      if (isFinite(y)) canvas.addMarker({ x, y, color: canvas.purple(), radius: 6, label: '(' + nf(x, 2) + ', ' + nf(y, 2) + ')' });
    }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: T('Hedef değer a', 'Target value a'), min: -4, max: 4, step: 1,
      get: () => getProblem().a, set: (v) => { getProblem().a = Math.round(v); },
    });
    h.addSlider({
      caption: T('x ile a arasındaki uzaklık (sola çekince a\'ya yaklaşır)', 'Distance between x and a (dragging left approaches a)'),
      min: OFF_MIN, max: OFF_MAX, step: 0.01,
      get: () => getProblem().off, set: (v) => { getProblem().off = Math.max(OFF_MIN, Math.min(OFF_MAX, v)); },
    });
    h.addRadioGroup({
      name: 'approachDir',
      options: [
        { label: T('Yalnızca soldan (x < a)', 'Left only (x < a)'), value: 'left' },
        { label: T('Yalnızca sağdan (x > a)', 'Right only (x > a)'), value: 'right' },
        { label: T('Her iki taraftan', 'Both sides'), value: 'both' },
      ],
      get: () => getProblem().dir, set: (v) => { getProblem().dir = v; },
    });
    h.addCheckbox({
      caption: T('Limit değerini (L) çizgiyle göster', 'Show the limit value (L) as a line'),
      get: () => getProblem().reveal, set: (v) => { getProblem().reveal = !!v; },
    });
  }

  Topics.register('limits', {
    id: 'approachingIntro',
    tabTitle: () => T('Limit Nedir?', 'What Is a Limit?'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { const m = model(p); return { x: p.a, y: m.L !== null ? m.L : m.fa }; },
    buildControls,
    _test: { model }, // numeric self-checks (tests/)
    challenge: {
      prompt: (p) => { const m = model(p); return p.kind === 'jump'
        ? T(`f(x) = ${m.str}\nx → ${p.a} SOLDAN giderken f(x) hangi değere yaklaşır? (Sağdan ve soldan limitler farklıdır, soldaki değeri yazalım.)`, `f(x) = ${m.str}\nAs x → ${p.a} from the LEFT, what value does f(x) approach? (The two one-sided limits differ; let's give the left one.)`)
        : T(`f(x) = ${m.str}\nx → ${p.a} giderken f(x) hangi değere yaklaşır? (Limit değerini yazalım; f(${p.a}) ile aynı olmak zorunda değil.)`, `f(x) = ${m.str}\nAs x → ${p.a}, what value does f(x) approach? (Let's give the limit; it need not equal f(${p.a}).)`); },
      target: (p) => model(p).Ll,
      tol: () => 0.011,
      hint: (p) => T('Değer tablosu: a ∓ 0,1 ve a ∓ 0,01 noktalarına bakalım.', 'Value table: look at a ∓ 0.1 and a ∓ 0.01.'),
    },
    links: [
      { match: /^(LİMİT, f\(a\)'DAN BAĞIMSIZDIR|THE LIMIT IS INDEPENDENT OF f\(a\))$/, make: (rng) => build(rng, 'displaced') },
      { match: /^\s*- (f\(a\) tanımsız olabilir|f\(a\) may be not defined)/, make: (rng) => build(rng, 'hole') },
      { match: /^(TEK TARAFLI YAKLAŞIM|ONE-SIDED APPROACH)$/, make: (rng) => build(rng, 'jump') },
      { match: /^\s*\(1\) (Önce doğrudan|We can first substitute)/, make: (rng) => build(rng, 'poly') },
      { match: /^\s*\(2\) (0\/0 çıkarsa|If we get 0\/0)/, make: (rng) => build(rng, 'hole') },
    ],
  });
})();
