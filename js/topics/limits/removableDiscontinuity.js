// Limits & Continuity - "Removable Discontinuity" (ported from Modules/Limits/RemovableDiscontinuityControl.vb, enriched).
// problem = { kind, a, off, reveal, ... }
//   'diffSq' : (x^2 - a^2)/(x - a)                    -> L = 2a          (the VB example is a = 1)
//   'quad'   : (x - a)(x + m)/(x - a) expanded        -> L = a + m
//   'ratio'  : (x - a)(x + m)/((x - a)(x + n))        -> L = (a + m)/(a + n)   (p.e = a+m, p.d = a+n)
//   'conj'   : (sqrt(x + k) - r)/(x - a), k = r^2 - a -> L = 1/(2r)         (conjugate method)
//   'pieces' : g(x) for x != a but f(a) = g(a) + dv   -> L = g(a) != f(a)
//   'sinc'   : sin(k(x - a))/(x - a)                  -> L = k
(function () {
  const T = (tr, en) => I18N.tx(tr, en);
  const OFF_MIN = 0.01, OFF_MAX = 4;

  function nf(v, d) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0' || s === '') s = '0';
    return s;
  }
  function par(v) { return v < 0 ? '(' + fmt2(v) + ')' : fmt2(v); }
  function polyStr(c) {
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
  function fac(a, m) { return xm(a) + ' · ' + (m === 0 ? 'x' : '(' + xp(m) + ')'); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function fracStr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? String(n) : n + '/' + d;
  }
  function sqrtStr(k) { return k === 0 ? '√x' : (k > 0 ? '√(x + ' + k + ')' : '√(x - ' + (-k) + ')'); }
  function sinArg(k, a) { return a === 0 ? k + 'x' : k + '(x ' + (a > 0 ? '- ' + a : '+ ' + (-a)) + ')'; }

  function model(p) {
    const a = p.a, m = { a };
    switch (p.kind) {
      case 'diffSq': {
        m.mm = a; m.num = [1, 0, -a * a]; m.den = [1, -a];
        m.f = (x) => (Math.abs(x - a) < 1e-9 ? NaN : polyEval(m.num, x) / (x - a));
        m.str = `(${polyStr(m.num)}) / ${xm(a)}`;
        m.g = xp(a); m.L = 2 * a; m.Ls = fmt2(m.L); m.fa = null;
        break;
      }
      case 'quad': {
        m.mm = p.L - a; m.num = [1, m.mm - a, -a * m.mm]; m.den = [1, -a];
        m.f = (x) => (Math.abs(x - a) < 1e-9 ? NaN : polyEval(m.num, x) / (x - a));
        m.str = `(${polyStr(m.num)}) / ${xm(a)}`;
        m.g = xp(m.mm); m.L = p.L; m.Ls = fmt2(m.L); m.fa = null;
        break;
      }
      case 'ratio': {
        const mm = p.e - a, nn = p.d - a;
        m.mm = mm; m.nn = nn;
        m.num = [1, mm - a, -a * mm]; m.den = [1, nn - a, -a * nn];
        m.f = (x) => {
          if (Math.abs(x - a) < 1e-9) return NaN;
          const dn = polyEval(m.den, x);
          if (Math.abs(dn) < 1e-6) return NaN;
          const y = polyEval(m.num, x) / dn;
          return Math.abs(y) > 40 ? NaN : y;
        };
        m.str = `(${polyStr(m.num)}) / (${polyStr(m.den)})`;
        m.g = `(${xp(mm)}) / (${xp(nn)})`;
        m.L = p.e / p.d; m.Ls = fracStr(p.e, p.d); m.fa = null;
        break;
      }
      case 'conj': {
        const r = p.r, k = r * r - a;
        m.k = k;
        m.f = (x) => (Math.abs(x - a) < 1e-9 || x + k < 0 ? NaN : (Math.sqrt(x + k) - r) / (x - a));
        m.str = `(${sqrtStr(k)} - ${r}) / ${xm(a)}`;
        m.g = `1 / (${sqrtStr(k)} + ${r})`;
        m.L = 1 / (2 * r); m.Ls = fracStr(1, 2 * r); m.fa = null;
        break;
      }
      case 'pieces': {
        const c = p.c;
        const L = polyEval(c, a);
        m.fa = L + p.dv; m.L = L; m.Ls = fmt2(L); m.gstr = polyStr(c);
        m.f = (x) => (Math.abs(x - a) < 1e-9 ? m.fa : polyEval(c, x));
        m.str = `${polyStr(c)}  (x ≠ ${a}),   f(${a}) = ${fmt2(m.fa)}`;
        m.g = polyStr(c);
        break;
      }
      default: { // sinc
        const k = p.k;
        m.f = (x) => (Math.abs(x - a) < 1e-9 ? NaN : Math.sin(k * (x - a)) / (x - a));
        m.str = `sin(${sinArg(k, a)}) / ${xm(a)}`;
        m.g = fmt2(k);
        m.L = k; m.Ls = fmt2(k); m.fa = null;
      }
    }
    return m;
  }

  function createProblem(rng) { return gen(rng, rng.pick(['diffSq', 'quad', 'ratio', 'conj', 'pieces', 'sinc', 'diffSq', 'quad', 'ratio'])); }
  function gen(rng, kind) {
    const p = { kind, off: 3, reveal: false, a: rng.nextInt(-3, 4) };
    if (kind === 'diffSq') {
      p.a = rng.nonZeroInt(-4, 4);
    } else if (kind === 'quad') {
      do { p.L = rng.nextInt(-4, 5); } while (p.L === 0 || p.L === 2 * p.a);
    } else if (kind === 'ratio') {
      p.d = rng.pick([-3, -2, -1, 1, 2, 3]);
      do { p.e = rng.nextInt(-4, 5); } while (p.e === 0 || p.e === p.d);
    } else if (kind === 'conj') {
      p.r = rng.nextInt(1, 4);
    } else if (kind === 'pieces') {
      p.c = rng.pick([[1, 0, 0], [1, rng.nextInt(-2, 3), rng.nextInt(-3, 3)], [rng.nonZeroInt(-2, 2), rng.nextInt(-3, 4)]]);
      p.dv = rng.pick([-3, -2, 2, 3]);
    } else {
      p.k = rng.nextInt(2, 5);
    }
    return p;
  }

  function problemStatement(p) {
    const m = model(p);
    const fa = p.kind === 'pieces' ? '' : ` (x ≠ ${p.a})`;
    return T(
      `f(x) = ${m.str}${p.kind === 'pieces' ? '' : fa}\nf'nin x = ${p.a} noktasındaki süreksizliğini birlikte inceleyelim: lim(x→${p.a}) f(x) var mı, değeri nedir? Süreksizliğin türünü söyleyip f(${p.a}) hangi değerle tanımlanırsa fonksiyonun sürekli olacağını bulalım.`,
      `f(x) = ${m.str}${p.kind === 'pieces' ? '' : fa}\nLet's look at the discontinuity of f at x = ${p.a}: does lim(x→${p.a}) f(x) exist, and what is it? We can name the type of discontinuity and find the value f(${p.a}) should be given to make the function continuous.`);
  }

  const CONCEPT_TR = [
    'TANIM',
    'lim(x→a) f(x) = L SONLU olarak VAR, ama f(a) tanımsız ya da L\'den farklı ise f, x = a\'da KALDIRILABİLİR süreksizliğe sahiptir. Grafikte yalnızca tek bir nokta "eksiktir" (delik) ya da yanlış yerdedir.',
    '   Süreklilik şartı: (1) f(a) tanımlı, (2) lim f(x) var, (3) lim f(x) = f(a). Kaldırılabilir süreksizlikte şart (2) sağlanır, (1) veya (3) bozulur.',
    '   Onarım: g(x) = f(x) (x ≠ a), g(a) = L. Bu g fonksiyonu a\'da süreklidir (deliği kapattık).',
    '',
    'NEDEN "KALDIRILABİLİR"?',
    '   Tek bir değeri (f(a) = L) düzelterek süreksizlik tamamen ortadan kalkar. Sıçrama ve sonsuz süreksizlikte böyle bir tek değer yoktur.',
    '',
    'TİPİK KAYNAKLAR',
    '   - Ortak çarpan: (x − a)·p(x) / ((x − a)·q(x)). Sadeleşince p(x)/q(x) kalır; q(a) ≠ 0 ise L = p(a)/q(a).',
    '   - Köklü ifade: (√(x + k) − r)/(x − a): eşlenikle çarpınca (x − a) sadeleşir.',
    '   - Temel limit: sin(u)/u → 1 (u → 0); sin(kx)/x → k.',
    '   - Parçalı tanım: f(a) başka bir değer olarak "elle" verilmiştir.',
    '',
    'YÖNTEM',
    '   (1) x = a yazılır. 0/0 çıkıyorsa delik adayıdır (sonuç henüz belli değil).',
    '   (2) Pay ve payda çarpanlarına ayrılır: iki kare farkı a² − b² = (a − b)(a + b), x² + px + q çarpanları, ortak çarpan; ya da eşlenikle çarpılır.',
    '   (3) Ortak (x − a) çarpanı sadeleşir ⇒ g(x), x ≠ a için f(x) ile aynıdır.',
    '   (4) g(a) değeri hesaplanır: bu L\'dir (payda sıfır kalmıyorsa).',
    '   (5) Grafikte (a, L) noktası BOŞ daire ile gösterilir; f(a) tanımlıysa ayrıca (a, f(a)) noktası dolu nokta ile işaretlenir.',
    '   (6) Onarım: f(a) = L olarak yeniden tanımlanır.',
    '',
    'SIK HATALAR',
    '   - Sadeleştirmenin fonksiyonu değiştirmediğini sanmak: f ile sadeleşmiş ifade x = a\'da FARKLIDIR (biri tanımsız, biri L).',
    '   - Payda sadeleşmeden sonra hâlâ 0 oluyorsa (q(a) = 0) bu delik değil dikey asimptottur.',
    '   - Her 0/0\'ı delik sanmak; (x − a)² / (x − a)³ gibi durumlarda sonuç asimptot olabilir.',
    '   - "f(a) tanımsız, o hâlde limit yok" demek.',
    '',
    'MİNİ ÖRNEK',
    '   f(x) = (x² − 9)/(x − 3) = (x − 3)(x + 3)/(x − 3) = x + 3 (x ≠ 3). L = 6, f(3) tanımsız. Delik (3, 6); f(3) = 6 tanımlanırsa fonksiyon süreklidir.',
    '',
    'AKILDA TUTMA: "Sadeleşen çarpan deliği, kalan çarpan deliğin yüksekliğini verir."',
  ].join('\n');

  const CONCEPT_EN = [
    'DEFINITION',
    'If lim(x→a) f(x) = L EXISTS (finite) but f(a) is not defined or differs from L, f has a REMOVABLE discontinuity at x = a. In the graph exactly one point is "missing" (a hole) or sits in the wrong place.',
    '   Continuity conditions: (1) f(a) defined, (2) lim f(x) exists, (3) lim f(x) = f(a). For a removable discontinuity (2) holds while (1) or (3) fails.',
    '   Repair: g(x) = f(x) (x ≠ a), g(a) = L. This g is continuous at a (we filled the hole).',
    '',
    'WHY "REMOVABLE"?',
    '   Fixing one single value (f(a) = L) removes the discontinuity completely. For jump and infinite discontinuities no single value can do that.',
    '',
    'TYPICAL SOURCES',
    '   - Common factor: (x − a)·p(x) / ((x − a)·q(x)). After cancelling p(x)/q(x) remains; if q(a) ≠ 0 then L = p(a)/q(a).',
    '   - Radical expression: (√(x + k) − r)/(x − a): multiply by the conjugate and (x − a) cancels.',
    '   - Standard limit: sin(u)/u → 1 (u → 0); sin(kx)/x → k.',
    '   - Piecewise definition: f(a) was given "by hand" as another value.',
    '',
    'METHOD',
    '   (1) We substitute x = a. If we get 0/0, a hole is a candidate (the outcome is not yet decided).',
    '   (2) We factor numerator and denominator: difference of squares a² − b² = (a − b)(a + b), factors of x² + px + q, common factors; or we multiply by the conjugate.',
    '   (3) We cancel the common (x − a) factor ⇒ g(x) equals f(x) for x ≠ a.',
    '   (4) We compute g(a): this is L (provided the denominator no longer vanishes).',
    '   (5) On the graph we mark an OPEN circle at (a, L); if f(a) is defined we also mark a filled dot at (a, f(a)).',
    '   (6) Repair: we redefine f(a) = L.',
    '',
    'COMMON PITFALLS',
    '   - Thinking cancelling does not change the function: f and the simplified expression DIFFER at x = a (one is not defined, the other equals L).',
    '   - If the denominator is still 0 after cancelling (q(a) = 0) it is a vertical asymptote, not a hole.',
    '   - Treating every 0/0 as a hole; in cases like (x − a)² / (x − a)³ the outcome may be an asymptote.',
    '   - Saying "f(a) is not defined, so there is no limit".',
    '',
    'MINI EXAMPLE',
    '   f(x) = (x² − 9)/(x − 3) = (x − 3)(x + 3)/(x − 3) = x + 3 (x ≠ 3). L = 6, f(3) is not defined. Hole at (3, 6); defining f(3) = 6 makes the function continuous.',
    '',
    'MEMORY AID: "The cancelled factor makes the hole; what remains gives the height of the hole."',
  ].join('\n');

  function concept() { return T(CONCEPT_TR, CONCEPT_EN); }

  function solveSteps(p) {
    const m = model(p), a = p.a, S = [];
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    const L = m.Ls;

    // 1) function
    if (p.kind === 'pieces') {
      S.push(T(`── 1) Fonksiyon ──\nf(x) = ${m.g}  (x ≠ ${a}),   f(${a}) = ${fmt2(m.fa)}\nf(${a}) ayrı bir değer olarak verilmiştir; fonksiyon ${a} dışında ${m.g} ile aynıdır.`,
        `── 1) The function ──\nf(x) = ${m.g}  (x ≠ ${a}),   f(${a}) = ${fmt2(m.fa)}\nf(${a}) is given as a separate value; away from ${a} the function equals ${m.g}.`));
    } else {
      S.push(T(`── 1) Fonksiyon ve tanım kümesi ──\nf(x) = ${m.str}\nPayda x = ${a} (ya da ${xm(a)} = 0) için sıfırdır; bu yüzden f(${a}) tanımsızdır ve ${a}, tanım kümesinde yoktur.`,
        `── 1) The function and its domain ──\nf(x) = ${m.str}\nThe denominator is zero at x = ${a} (the factor ${xm(a)} = 0), so f(${a}) is not defined and ${a} is not in the domain.`));
    }

    // 2) substitution
    if (p.kind === 'pieces') {
      S.push(T(`── 2) f(${a}) ve limit ──\nf(${a}) = ${fmt2(m.fa)} (verilen). Limit için yalnızca x ≠ ${a} değerleri önemlidir, o yüzden ${m.g} ifadesini kullanırız.`,
        `── 2) f(${a}) and the limit ──\nf(${a}) = ${fmt2(m.fa)} (given). For the limit only the values x ≠ ${a} matter, so we use the expression ${m.g}.`));
    } else if (p.kind === 'sinc') {
      S.push(T(`── 2) Doğrudan yerine koyma ──\nx = ${a}: sin(0)/0 = 0/0 ⇒ belirsiz. Bu yüzden sadeleştirebilir ya da temel limiti kullanabiliriz.`,
        `── 2) Direct substitution ──\nx = ${a}: sin(0)/0 = 0/0 ⇒ indeterminate. So we can simplify or use a standard limit.`));
    } else if (p.kind === 'ratio') {
      S.push(T(`── 2) Doğrudan yerine koyma ──\nx = ${a}: pay = ${fmt2(polyEval(m.num, a))}, payda = ${fmt2(polyEval(m.den, a))} ⇒ 0/0 (belirsiz). Delik adayı; çarpanlara ayıralım.`,
        `── 2) Direct substitution ──\nx = ${a}: numerator = ${fmt2(polyEval(m.num, a))}, denominator = ${fmt2(polyEval(m.den, a))} ⇒ 0/0 (indeterminate). A hole is a candidate; let us factor.`));
    } else if (p.kind === 'conj') {
      S.push(T(`── 2) Doğrudan yerine koyma ──\nx = ${a}: √(${a} + ${par(m.k)}) = √${a + m.k} = ${p.r}, pay = ${p.r} − ${p.r} = 0 ve payda = 0 ⇒ 0/0 (belirsiz).`,
        `── 2) Direct substitution ──\nx = ${a}: √(${a} + ${par(m.k)}) = √${a + m.k} = ${p.r}, numerator = ${p.r} − ${p.r} = 0 and denominator = 0 ⇒ 0/0 (indeterminate).`));
    } else {
      S.push(T(`── 2) Doğrudan yerine koyma ──\nx = ${a}: pay = ${fmt2(polyEval(m.num, a))}, payda = ${par(a)} − ${par(a)} = 0 ⇒ 0/0 (belirsiz). Delik adayı; çarpanlara ayıralım.`,
        `── 2) Direct substitution ──\nx = ${a}: numerator = ${fmt2(polyEval(m.num, a))}, denominator = ${par(a)} − ${par(a)} = 0 ⇒ 0/0 (indeterminate). A hole is a candidate; let us factor.`));
    }

    // 3) factor / manipulate; 4) cancel
    if (p.kind === 'diffSq' || p.kind === 'quad') {
      const why = p.kind === 'diffSq'
        ? T(`İki kare farkı: x² − ${a * a} = ${fac(a, a)}.`, `Difference of squares: x² − ${a * a} = ${fac(a, a)}.`)
        : T(`${polyStr(m.num)} ifadesinin kökleri ${a} ve ${-m.mm} olduğundan çarpanlarına ayrılır (toplamı ${-(m.mm - a)}, çarpımı ${-a * m.mm}).`,
          `The roots of ${polyStr(m.num)} are ${a} and ${-m.mm}, so it factors (sum of roots ${-(m.mm - a)}, product ${-a * m.mm}).`);
      S.push(T(`── 3) Çarpanlara ayıralım ──\n${why}\nPay = ${fac(a, m.mm)}`, `── 3) Factor ──\n${why}\nNumerator = ${fac(a, m.mm)}`));
      S.push(T(`── 4) Sadeleştirelim ──\nf(x) = ${fac(a, m.mm)} / ${xm(a)} = ${m.g}   (x ≠ ${a})\nBu sadeleşmiş ifade g(x) = ${m.g}; f ile yalnızca x = ${a} noktasında farklıdır.`,
        `── 4) Cancel ──\nf(x) = ${fac(a, m.mm)} / ${xm(a)} = ${m.g}   (x ≠ ${a})\nThe simplified expression is g(x) = ${m.g}; it differs from f only at x = ${a}.`));
    } else if (p.kind === 'ratio') {
      S.push(T(`── 3) Pay ve paydayı çarpanlara ayıralım ──\nPay: ${polyStr(m.num)} = ${fac(a, m.mm)}\nPayda: ${polyStr(m.den)} = ${fac(a, m.nn)}`,
        `── 3) Factor numerator and denominator ──\nNumerator: ${polyStr(m.num)} = ${fac(a, m.mm)}\nDenominator: ${polyStr(m.den)} = ${fac(a, m.nn)}`));
      S.push(T(`── 4) Sadeleştirelim ──\nf(x) = ${xm(a)}(${xp(m.mm)}) / [${xm(a)}(${xp(m.nn)})] = ${m.g}   (x ≠ ${a})\nKalan paydanın ${a} noktasındaki değeri ${fmt2(p.d)} ≠ 0: asimptot yok, yalnızca delik var.`,
        `── 4) Cancel ──\nf(x) = ${xm(a)}(${xp(m.mm)}) / [${xm(a)}(${xp(m.nn)})] = ${m.g}   (x ≠ ${a})\nThe remaining denominator at ${a} equals ${fmt2(p.d)} ≠ 0: no asymptote, only a hole.`));
    } else if (p.kind === 'conj') {
      S.push(T(`── 3) Eşlenikle çarpalım ──\nPay ve paydayı (${sqrtStr(m.k)} + ${p.r}) ile çarpalım:\n(${sqrtStr(m.k)} − ${p.r})(${sqrtStr(m.k)} + ${p.r}) = (${xp(m.k)}) − ${p.r * p.r} = ${xm(a)}`,
        `── 3) Multiply by the conjugate ──\nMultiply numerator and denominator by (${sqrtStr(m.k)} + ${p.r}):\n(${sqrtStr(m.k)} − ${p.r})(${sqrtStr(m.k)} + ${p.r}) = (${xp(m.k)}) − ${p.r * p.r} = ${xm(a)}`));
      S.push(T(`── 4) Sadeleştirelim ──\nf(x) = ${xm(a)} / [${xm(a)}(${sqrtStr(m.k)} + ${p.r})] = ${m.g}   (x ≠ ${a})`,
        `── 4) Cancel ──\nf(x) = ${xm(a)} / [${xm(a)}(${sqrtStr(m.k)} + ${p.r})] = ${m.g}   (x ≠ ${a})`));
    } else if (p.kind === 'sinc') {
      S.push(T(`── 3) Temel limiti hazırlayalım ──\nu = ${sinArg(p.k, a)} diyelim; x → ${a} iken u → 0. Payda ${xm(a)} = u/${p.k}, yani\nsin(u)/${xm(a)} = ${p.k} · sin(u)/u.`,
        `── 3) Set up the standard limit ──\nLet u = ${sinArg(p.k, a)}; as x → ${a}, u → 0. The denominator ${xm(a)} = u/${p.k}, so\nsin(u)/${xm(a)} = ${p.k} · sin(u)/u.`));
      S.push(T(`── 4) Temel limit ──\nlim(u→0) sin(u)/u = 1 olduğundan f(x) = ${p.k}·sin(u)/u ifadesi ${p.k}·1 değerine yaklaşır.`,
        `── 4) Standard limit ──\nSince lim(u→0) sin(u)/u = 1, the expression f(x) = ${p.k}·sin(u)/u approaches ${p.k}·1.`));
    } else { // pieces
      S.push(T(`── 3) Limit için polinomu kullanalım ──\nx ≠ ${a} için f(x) = g(x) = ${m.g}. Polinom sürekli olduğundan lim(x→${a}) g(x) = g(${a}).`,
        `── 3) Use the polynomial for the limit ──\nFor x ≠ ${a}, f(x) = g(x) = ${m.g}. A polynomial is continuous, so lim(x→${a}) g(x) = g(${a}).`));
      S.push(T(`── 4) g(${a}) değerini hesaplayalım ──\ng(${a}) = ${L}`, `── 4) Compute g(${a}) ──\ng(${a}) = ${L}`));
    }

    // 5) limit
    if (p.kind === 'ratio') {
      S.push(T(`── 5) Limiti bulalım ──\nlim(x→${a}) f(x) = lim(x→${a}) ${m.g} = ${fmt2(a + m.mm)}/${fmt2(a + m.nn)} = ${L}`,
        `── 5) Find the limit ──\nlim(x→${a}) f(x) = lim(x→${a}) ${m.g} = ${fmt2(a + m.mm)}/${fmt2(a + m.nn)} = ${L}`));
    } else if (p.kind === 'conj') {
      S.push(T(`── 5) Limiti bulalım ──\nlim(x→${a}) f(x) = 1 / (√${a + m.k} + ${p.r}) = 1/(${p.r} + ${p.r}) = ${L}`,
        `── 5) Find the limit ──\nlim(x→${a}) f(x) = 1 / (√${a + m.k} + ${p.r}) = 1/(${p.r} + ${p.r}) = ${L}`));
    } else if (p.kind === 'sinc') {
      S.push(T(`── 5) Limiti bulalım ──\nlim(x→${a}) f(x) = ${p.k} · 1 = ${L}`, `── 5) Find the limit ──\nlim(x→${a}) f(x) = ${p.k} · 1 = ${L}`));
    } else if (p.kind === 'pieces') {
      S.push(T(`── 5) Limit ve f(${a}) ──\nlim(x→${a}) f(x) = ${L}, fakat f(${a}) = ${fmt2(m.fa)} ≠ ${L}.`, `── 5) Limit and f(${a}) ──\nlim(x→${a}) f(x) = ${L}, but f(${a}) = ${fmt2(m.fa)} ≠ ${L}.`));
    } else {
      S.push(T(`── 5) Limiti bulalım ──\nlim(x→${a}) f(x) = lim(x→${a}) (${m.g}) = ${par(a)} ${p.kind === 'quad' ? (m.mm >= 0 ? '+ ' + m.mm : '− ' + (-m.mm)) : '+ ' + par(a)} = ${L}`,
        `── 5) Find the limit ──\nlim(x→${a}) f(x) = lim(x→${a}) (${m.g}) = ${par(a)} ${p.kind === 'quad' ? (m.mm >= 0 ? '+ ' + m.mm : '− ' + (-m.mm)) : '+ ' + par(a)} = ${L}`));
    }

    // 6) classification
    const fadesc = p.kind === 'pieces'
      ? T(`f(${a}) = ${fmt2(m.fa)} ≠ L olduğundan şart (3) bozulur`, `f(${a}) = ${fmt2(m.fa)} ≠ L, so condition (3) fails`)
      : T(`f(${a}) tanımsız olduğundan şart (1) bozulur`, `f(${a}) is not defined, so condition (1) fails`);
    S.push(T(`── 6) Süreksizlik türü ──\nLimit sonlu ve VAR (L = ${L}); ${fadesc}. Bu bir KALDIRILABİLİR süreksizliktir.\nGrafik: (${a}, ${L}) noktasında boş daire (delik).`,
      `── 6) Type of discontinuity ──\nThe limit is finite and EXISTS (L = ${L}); ${fadesc}. This is a REMOVABLE discontinuity.\nGraph: an open circle (hole) at (${a}, ${L}).`));

    // 7) repair
    S.push(T(`── 7) Onarım ──\nf(${a}) = ${L} olarak (yeniden) tanımlarsak g(x) = f(x) (x ≠ ${a}), g(${a}) = ${L} fonksiyonu ${a} noktasında süreklidir: lim g = g(${a}). "Deliği doldur" kutusunu işaretleyerek bunu görebiliriz.`,
      `── 7) The repair ──\nIf we (re)define f(${a}) = ${L}, then g(x) = f(x) (x ≠ ${a}), g(${a}) = ${L} is continuous at ${a}: lim g = g(${a}). Ticking "Fill the hole" lets us see it.`));

    // 8) numeric check
    const xl = a - off, xr = a + off;
    S.push(T(`── 8) Sayısal kontrol (kaydırıcı) ──\n   x = ${nf(xl, 3)}   →   f(x) = ${nf(m.f(xl), 4)}\n   x = ${nf(xr, 3)}   →   f(x) = ${nf(m.f(xr), 4)}\nUzaklık küçüldükçe iki değer de ${nf(m.L, 4)} sayısına (yani L'ye) yaklaşır; x = ${a} değerine asla ulaşılmaz.`,
      `── 8) Numerical check (slider) ──\n   x = ${nf(xl, 3)}   →   f(x) = ${nf(m.f(xl), 4)}\n   x = ${nf(xr, 3)}   →   f(x) = ${nf(m.f(xr), 4)}\nAs the distance shrinks both values approach ${nf(m.L, 4)} (that is, L); x = ${a} itself is never reached.`));
    return S;
  }

  function autoView(canvas, f, a, halfX, ref) {
    let lo = ref, hi = ref;
    for (let i = 0; i <= 80; i++) {
      const y = f(a - halfX + 2 * halfX * i / 80);
      if (isFinite(y) && Math.abs(y - ref) <= 9) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    let h = hi - lo;
    if (h < 5) { const c = (lo + hi) / 2; lo = c - 2.5; hi = c + 2.5; h = 5; }
    const pad = h * 0.12;
    canvas.setViewport(a - halfX, a + halfX, lo - pad, hi + pad);
  }

  function draw(canvas, p) {
    const m = model(p), a = p.a;
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    autoView(canvas, m.f, a, 4.5, m.fa !== null ? m.L : m.L);
    canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: 'x = ' + a });
    canvas.addFunction({ evaluator: m.f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    if (p.kind === 'pieces' && !p.reveal) {
      canvas.addMarker({ x: a, y: m.fa, color: canvas.orange(), radius: 6, label: 'f(' + a + ') = ' + fmt2(m.fa) });
    }
    // the hole at (a, L): hollow until the student "fills" it
    canvas.addMarker({ x: a, y: m.L, color: p.reveal ? canvas.green() : canvas.gray(), radius: 7, hollow: !p.reveal, label: '(' + a + ', ' + m.Ls + ')' });
    const xl = a - off, xr = a + off;
    const yl = m.f(xl), yr = m.f(xr);
    if (isFinite(yl)) canvas.addMarker({ x: xl, y: yl, color: canvas.blue(), radius: 6 });
    if (isFinite(yr)) canvas.addMarker({ x: xr, y: yr, color: canvas.purple(), radius: 6 });
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: T('Delik konumu a', 'Position of the hole a'), min: -4, max: 4, step: 1,
      get: () => getProblem().a, set: (v) => { getProblem().a = Math.round(v); },
    });
    h.addCheckbox({
      caption: T('Deliği dolduralım: f(a) = L olarak yeniden tanımlanır', 'Fill the hole: f(a) = L is redefined'),
      get: () => getProblem().reveal, set: (v) => { getProblem().reveal = !!v; },
    });
    h.addSlider({
      caption: T('Noktaları a\'ya yaklaştıralım (uzaklık; sola çekince küçülür)', 'Moving the points towards a (distance; dragging left shrinks it)'),
      min: OFF_MIN, max: OFF_MAX, step: 0.01,
      get: () => getProblem().off, set: (v) => { getProblem().off = Math.max(OFF_MIN, Math.min(OFF_MAX, v)); },
    });
  }

  Topics.register('limits', {
    id: 'removableDiscontinuity',
    tabTitle: () => T('Kaldırılabilir Süreksizlik', 'Removable Discontinuity'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { const m = model(p); return { x: p.a, y: m.L }; },
    buildControls,
    links: [
      { match: /^\s*- (Ortak çarpan|Common factor):/, make: (rng) => gen(rng, rng.pick(['quad', 'ratio'])) },
      { match: /^\s*- (Köklü ifade|Radical expression):/, make: (rng) => gen(rng, 'conj') },
      { match: /^\s*- (Temel limit|Standard limit):/, make: (rng) => gen(rng, 'sinc') },
      { match: /^\s*- (Parçalı tanım|Piecewise definition):/, make: (rng) => gen(rng, 'pieces') },
      { match: /^\s*\(2\) (Pay ve payda çarpanlarına|We factor numerator)/, make: (rng) => gen(rng, 'diffSq') },
    ],
  });
})();
