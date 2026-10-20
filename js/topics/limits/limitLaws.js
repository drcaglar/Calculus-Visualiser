// Limit of a Function and Limit Laws (chapter 'limits').
// problem = { kind, a, ... params, dExp, side }
//   kinds: 'poly' | 'rat' | 'root'   direct substitution (limit laws)
//          'factor'                  0/0, factor & cancel           c(x-a)(x+k) / ((x-a)(x+j))  or / (x-a)
//          'conjA' | 'conjB'         0/0, conjugate                 (sqrt(x+b)-r)/(x-a)  |  (x-a)/(sqrt(x)-r)
//          'compound'                0/0, compound fraction         (1/(x+b) - 1/s)/(x-a)
//          'squeeze'                 L + c u^n trig(1/u),  u = x - a
//          'special'                 sub = 'sinLin' | 'sinSin' | 'cosLin' | 'cosSq'  (k, m)
// The slider moves x = a + side*d, d = 10^(-dExp), towards a (numerical table of f(x)).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  // ---------- small exact helpers ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (n === 0) n = 0;
    return { n, d };
  }
  const frVal = (x) => x.n / x.d;
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function frS(x) { return x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d; }
  function nf(v, dec) {
    if (!isFinite(v)) return Tx('tanımsız', 'not defined');
    let s = v.toFixed(dec === undefined ? 4 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  function poly(terms) {
    let s = '';
    terms.forEach((t) => {
      const c = t[0], l = t[1];
      if (c === 0) return;
      const ab = Math.abs(c);
      const body = l === '' ? String(ab) : (ab === 1 ? l : ab + l);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    });
    return s || '0';
  }
  const wrap = (s) => (/[ +−]/.test(s.slice(1)) ? '(' + s + ')' : s);
  const lin = (a) => poly([[1, 'x'], [-a, '']]); // x - a

  // ---------- model ----------
  function sqrtI(n) { return Math.round(Math.sqrt(n)); }

  function F(p, x) {
    let y = NaN;
    const a = p.a;
    try {
      switch (p.kind) {
        case 'poly': y = p.A * x * x + p.B * x + p.C; break;
        case 'rat': { const d = p.D * x + p.E; y = Math.abs(d) < 1e-12 ? NaN : (p.A * x * x + p.B * x + p.C) / d; break; }
        case 'root': { const r = p.al * x + p.be; y = r < 0 ? NaN : Math.sqrt(r) + p.ga * x; break; }
        case 'factor': {
          if (Math.abs(x - a) < 1e-12) { y = NaN; break; }
          const num = p.c * (x - a) * (x + p.k);
          const den = p.quadD ? (x - a) * (x + p.j) : (x - a);
          y = Math.abs(den) < 1e-12 ? NaN : num / den; break;
        }
        case 'conjA': y = Math.abs(x - a) < 1e-12 ? NaN : (x + p.b < 0 ? NaN : (Math.sqrt(x + p.b) - p.r) / (x - a)); break;
        case 'conjB': y = (x < 0 || Math.abs(x - a) < 1e-12) ? NaN : (x - a) / (Math.sqrt(x) - p.r); break;
        case 'compound': {
          if (Math.abs(x - a) < 1e-12 || Math.abs(x + p.b) < 1e-12) { y = NaN; break; }
          y = (1 / (x + p.b) - 1 / p.s) / (x - a); break;
        }
        case 'squeeze': {
          const u = x - a;
          if (Math.abs(u) < 1e-12) { y = NaN; break; }
          const t = p.trig === 'sin' ? Math.sin(1 / u) : Math.cos(1 / u);
          y = p.L + p.c * Math.pow(Math.abs(u), p.n) * (p.n === 2 || u > 0 ? 1 : -1) * t; break;
        }
        case 'special': {
          if (Math.abs(x) < 1e-12) { y = NaN; break; }
          const k = p.k, m = p.m;
          if (p.sub === 'sinLin') y = Math.sin(k * x) / (m * x);
          else if (p.sub === 'sinSin') { const d = Math.sin(m * x); y = Math.abs(d) < 1e-12 ? NaN : Math.sin(k * x) / d; }
          else if (p.sub === 'cosLin') y = (1 - Math.cos(k * x)) / (m * x);
          else y = (1 - Math.cos(k * x)) / (m * x * x);
          break;
        }
        default: y = NaN;
      }
    } catch (e) { y = NaN; }
    return (isFinite(y) && Math.abs(y) < 1e4) ? y : NaN;
  }

  function limFr(p) {
    const a = p.a;
    switch (p.kind) {
      case 'poly': return fr(p.A * a * a + p.B * a + p.C);
      case 'rat': return fr(p.A * a * a + p.B * a + p.C, p.D * a + p.E);
      case 'root': return fr(sqrtI(p.al * a + p.be) + p.ga * a);
      case 'factor': return p.quadD ? fr(p.c * (a + p.k), a + p.j) : fr(p.c * (a + p.k));
      case 'conjA': return fr(1, 2 * p.r);
      case 'conjB': return fr(2 * p.r);
      case 'compound': return fr(-1, p.s * p.s);
      case 'squeeze': return fr(p.L);
      default:
        if (p.sub === 'cosLin') return fr(0);
        if (p.sub === 'cosSq') return fr(p.k * p.k, 2 * p.m);
        return fr(p.k, p.m);
    }
  }
  const hasHole = (p) => !(p.kind === 'poly' || p.kind === 'rat' || p.kind === 'root');

  function trigFn(p) { return p.trig; }
  function uStr(p) { return p.a === 0 ? 'x' : '(' + lin(p.a) + ')'; }
  function fStr(p) {
    switch (p.kind) {
      case 'poly': return poly([[p.A, 'x²'], [p.B, 'x'], [p.C, '']]);
      case 'rat': return `(${poly([[p.A, 'x²'], [p.B, 'x'], [p.C, '']])}) / (${poly([[p.D, 'x'], [p.E, '']])})`;
      case 'root': return `√(${poly([[p.al, 'x'], [p.be, '']])}) ${p.ga < 0 ? '−' : '+'} ${Math.abs(p.ga) === 1 ? '' : Math.abs(p.ga)}x`;
      case 'factor': {
        const N = poly([[p.c, 'x²'], [p.c * (p.k - p.a), 'x'], [-p.c * p.a * p.k, '']]);
        const D = p.quadD ? poly([[1, 'x²'], [p.j - p.a, 'x'], [-p.a * p.j, '']]) : lin(p.a);
        return `(${N}) / (${D})`;
      }
      case 'conjA': return `(√(${poly([[1, 'x'], [p.b, '']])}) − ${p.r}) / (${lin(p.a)})`;
      case 'conjB': return `(${lin(p.a)}) / (√x − ${p.r})`;
      case 'compound': return `(1/${wrap(poly([[1, 'x'], [p.b, '']]))} − 1/${P(p.s)}) / (${lin(p.a)})`;
      case 'squeeze': {
        const cs = p.c === 1 ? '' : (p.c === -1 ? '−' : String(p.c).replace('-', '−'));
        const u = uStr(p);
        const core = `${cs}${u}${p.n === 2 ? '²' : ''}·${trigFn(p)}(1/${u})`;
        return p.L === 0 ? core : `${core} ${p.L < 0 ? '−' : '+'} ${Math.abs(p.L)}`;
      }
      default: {
        const kx = (p.k === 1 ? '' : p.k === -1 ? '−' : S(p.k)) + 'x';
        const mx = (p.m === 1 ? '' : p.m === -1 ? '−' : S(p.m)) + 'x';
        if (p.sub === 'sinLin') return `sin(${kx}) / (${mx})`;
        if (p.sub === 'sinSin') return `sin(${kx}) / sin(${mx})`;
        if (p.sub === 'cosLin') return `(1 − cos(${kx})) / (${mx})`;
        return `(1 − cos(${kx})) / (${p.m === 1 ? '' : p.m === -1 ? '−' : S(p.m)}x²)`;
      }
    }
  }

  function createProblem(rng) { return genR(rng, rng.nextInt(0, 16)); }
  function genR(rng, r) {
    const p = { dExp: 0.5, side: 1, a: rng.nextInt(-3, 4) };
    if (r === 0) {
      p.kind = 'poly'; p.A = rng.nonZeroInt(-3, 3); p.B = rng.nextInt(-5, 6); p.C = rng.nextInt(-5, 6);
    } else if (r === 1) {
      p.kind = 'rat'; p.A = rng.nonZeroInt(-3, 3); p.B = rng.nextInt(-5, 6); p.C = rng.nextInt(-5, 6);
      p.D = rng.nonZeroInt(-3, 3);
      do { p.E = rng.nextInt(-5, 6); } while (p.D * p.a + p.E === 0);
    } else if (r === 2) {
      p.kind = 'root'; p.al = rng.pick([-3, -2, -1, 1, 2, 3]); const rr = rng.nextInt(1, 5);
      p.be = rr * rr - p.al * p.a; p.ga = rng.nonZeroInt(-3, 3);
    } else if (r <= 5) { // factor & cancel
      p.kind = 'factor'; p.quadD = r === 5;
      p.c = rng.pick([1, 1, 1, 2, -1, 3]);
      p.k = rng.nextInt(0, 3) === 0 ? p.a : rng.nonZeroInt(-4, 4);
      if (p.quadD) { do { p.j = rng.nextInt(-4, 5); } while (p.a + p.j === 0 || p.j === p.k); }
    } else if (r === 6) {
      p.kind = 'conjA'; p.r = rng.nextInt(1, 5); p.a = rng.nextInt(-3, 7); p.b = p.r * p.r - p.a;
    } else if (r === 7) {
      p.kind = 'conjB'; p.r = rng.nextInt(1, 5); p.a = p.r * p.r;
    } else if (r === 8) {
      p.kind = 'compound';
      do { p.b = rng.nextInt(-4, 5); } while (p.a + p.b === 0);
      p.s = p.a + p.b;
    } else if (r <= 10) {
      p.kind = 'squeeze'; p.a = rng.pick([0, 0, 1, -1, 2]); p.trig = rng.pick(['sin', 'cos']);
      p.n = rng.pick([1, 2]); p.c = rng.pick([1, 2, -1, 3]); p.L = rng.pick([0, 0, 1, 2, -1, 3]);
    } else {
      p.kind = 'special'; p.a = 0; p.sub = ['sinLin', 'sinLin', 'sinSin', 'cosLin', 'cosSq'][r - 11];
      p.k = rng.nonZeroInt(-5, 5); p.m = rng.nonZeroInt(-5, 5);
      if (p.sub === 'sinSin') { while (Math.abs(p.k) === Math.abs(p.m)) p.m = rng.nonZeroInt(-5, 5); }
      if (p.sub === 'cosSq' || p.sub === 'cosLin') { p.k = rng.nextInt(1, 6); }
    }
    return p;
  }

  function problemStatement(p) {
    const lim = `lim(x→${S(p.a)}) ${fStr(p)}`;
    if (p.kind === 'squeeze') {
      return Tx(`${lim} limitini Sıkıştırma (Sandviç) Teoremi ile hesaplayalım; onu iki yandan sıkıştıran fonksiyonları da bulalım.`,
        `Let's evaluate ${lim} with the Squeeze (Sandwich) Theorem and find the two functions that bound it.`);
    }
    if (p.kind === 'special') {
      return Tx(`${lim} limitini hesaplayalım (lim sin u/u = 1 ve lim (1 − cos u)/u = 0 bilgisinden yararlanabiliriz).`,
        `Let's evaluate ${lim} (we can use lim sin u/u = 1 and lim (1 − cos u)/u = 0).`);
    }
    return Tx(`${lim} limitini hesaplayalım. Önce doğrudan yerine koymayı deneyebiliriz; işe yaramazsa uygun bir cebirsel yöntem seçebiliriz.`,
      `Let's evaluate ${lim}. We can first try direct substitution; if it does not work, we can pick a suitable algebraic technique.`);
  }

  function concept() {
    return Tx(
      "LİMİT KURALLARI VE HESAPLAMA: lim(x→a) f(x) = L, x değerleri a'ya (a'nın kendisi hariç) yaklaşırken f(x) değerlerinin L'ye yaklaştığı anlamına gelir. Limit f(a) değerine değil, a'nın çevresindeki davranışa bakar.\n" +
      "\n" +
      "LİMİT KURALLARI: lim f = L ve lim g = M (sonlu) ise\n" +
      "   Toplam/Fark:  lim (f ± g) = L ± M\n" +
      "   Sabitle çarpım: lim (c·f) = c·L\n" +
      "   Çarpım:  lim (f·g) = L·M\n" +
      "   Bölüm:  lim (f/g) = L/M   (yalnızca M ≠ 0)\n" +
      "   Kuvvet:  lim (f)ⁿ = Lⁿ\n" +
      "   Kök:  lim ⁿ√f = ⁿ√L   (çift n için L ≥ 0)\n" +
      "   Ayrıca lim c = c ve lim x = a.\n" +
      "\n" +
      "DOĞRUDAN YERİNE KOYMA: Polinomlarda her zaman lim p(x) = p(a). Rasyonel fonksiyonlarda payda a'da sıfır değilse lim p(x)/q(x) = p(a)/q(a). Kök fonksiyonlar tanım kümesinin iç noktalarında aynı şekilde çalışır.\n" +
      "\n" +
      "0/0 BELİRSİZLİĞİ: Yerine koyunca 0/0 çıkarsa sonuç henüz belli değildir; ifadeyi x ≠ a için eşdeğer ama daha sade bir biçime getirebiliriz. Üç temel teknik:\n" +
      "   (1) Çarpanlara ayır ve sadeleştir: pay ve paydada (x − a) çarpanı vardır; x ≠ a olduğundan sadeleşir, sonra yerine konur.\n" +
      "   (2) Eşlenikle çarp (kök ifadeler): (√u − r)(√u + r) = u − r². Pay ve paydayı eşlenikle çarpıp sadeleştirebiliriz.\n" +
      "   (3) Bileşik kesri sadeleştir: pay/paydadaki kesirler ortak paydaya getirilir, sonra büyük kesir sadeleştirilir.\n" +
      "Not: Payda → 0 ve pay → sıfırdan farklı ise 0/0 değildir; limit sonlu değildir (± ∞ ya da yoktur).\n" +
      "\n" +
      "SIKIŞTIRMA (SANDVİÇ) TEOREMİ: a'nın yakınında (a hariç) g(x) ≤ f(x) ≤ h(x) ve lim g = lim h = L ise lim f = L. Kullanım: sin(1/x) gibi limiti olmayan ama sınırlı çarpan, kendisi 0'a giden bir terimle çarpılıyorsa: −1 ≤ sin(1/x) ≤ 1 ⇒ −|x|² ≤ x² sin(1/x) ≤ |x|² ⇒ limit 0.\n" +
      "\n" +
      "ÖZEL LİMİTLER (verilmiş kabul edilir):\n" +
      "   lim(u→0) sin u / u = 1       lim(u→0) (1 − cos u) / u = 0\n" +
      "   Ölçekleme: sin(kx)/(mx) = (k/m)·sin(kx)/(kx) → k/m   (u = kx → 0).\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - Payda 0 iken bölüm kuralını kullanmak.\n" +
      "   - 0/0 gördüğünde 'limit yok' ya da '0' demek; sadeleştirmeden karar verilmez.\n" +
      "   - Sadeleştirdikten sonra boşluğu (deliği) gözden kaçırmak: grafikte (a, L) noktası içi boştur çünkü f(a) tanımsızdır, ama limit L'dir.\n" +
      "   - sin(kx)/x için sonucu 1 sanmak; doğrusu k olur.\n" +
      "   - Sıkıştırmada alt/üst sınır fonksiyonlarının limitlerine bakmayı atlamak.\n" +
      "\n" +
      "MİNİ ÖRNEK: lim(x→2) (x² − 4)/(x − 2): yerine koyma 0/0. (x−2)(x+2)/(x−2) = x + 2 (x ≠ 2). Limit 4. Grafik y = x + 2 doğrusudur ve (2, 4) noktası boştur.\n" +
      "\n" +
      "HAFIZA KURALI: 'Önce yerine koyalım; 0/0 çıkarsa çarpanlara ayıralım, eşlenikle çarpalım ya da kesri birleştirelim; sin varsa özel limite çevirelim.'",
      "LIMIT LAWS AND EVALUATION: lim(x→a) f(x) = L means f(x) gets arbitrarily close to L as x approaches a (without being a). The limit looks at behaviour near a, not at the value f(a).\n" +
      "\n" +
      "LIMIT LAWS: if lim f = L and lim g = M (finite) then\n" +
      "   Sum/Difference:  lim (f ± g) = L ± M\n" +
      "   Constant multiple: lim (c·f) = c·L\n" +
      "   Product:  lim (f·g) = L·M\n" +
      "   Quotient:  lim (f/g) = L/M   (only if M ≠ 0)\n" +
      "   Power:  lim (f)ⁿ = Lⁿ\n" +
      "   Root:  lim ⁿ√f = ⁿ√L   (L ≥ 0 for even n)\n" +
      "   Also lim c = c and lim x = a.\n" +
      "\n" +
      "DIRECT SUBSTITUTION: for polynomials lim p(x) = p(a) always. For rational functions, if the denominator is not zero at a, lim p(x)/q(x) = p(a)/q(a). Root functions work the same way at interior points of their domain.\n" +
      "\n" +
      "THE 0/0 INDETERMINATE FORM: if substitution gives 0/0 there is no answer yet; rewrite the expression, for x ≠ a, into an equivalent simpler form. Three standard techniques:\n" +
      "   (1) Factor and cancel: numerator and denominator contain the factor (x − a); since x ≠ a it cancels, then substitute.\n" +
      "   (2) Rationalize with the conjugate (radical expressions): (√u − r)(√u + r) = u − r². We can multiply top and bottom by the conjugate and cancel.\n" +
      "   (3) Simplify a compound fraction: put fractions in the numerator/denominator over a common denominator, then simplify the big fraction.\n" +
      "Note: if the denominator → 0 while the numerator → a non-zero number, it is not 0/0; the limit is not finite (±∞ or does not exist).\n" +
      "\n" +
      "SQUEEZE (SANDWICH) THEOREM: if g(x) ≤ f(x) ≤ h(x) near a (except possibly at a) and lim g = lim h = L, then lim f = L. Typical use: a bounded factor with no limit, like sin(1/x), multiplied by a term that tends to 0: −1 ≤ sin(1/x) ≤ 1 ⇒ −x² ≤ x² sin(1/x) ≤ x² ⇒ the limit is 0.\n" +
      "\n" +
      "SPECIAL LIMITS (taken as given):\n" +
      "   lim(u→0) sin u / u = 1       lim(u→0) (1 − cos u) / u = 0\n" +
      "   Scaling: sin(kx)/(mx) = (k/m)·sin(kx)/(kx) → k/m   (u = kx → 0).\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Using the quotient law when the denominator limit is 0.\n" +
      "   - Seeing 0/0 and answering 'no limit' or '0'; nothing can be decided before simplifying.\n" +
      "   - Forgetting the hole after cancelling: on the graph the point (a, L) is open because f(a) is undefined, yet the limit is L.\n" +
      "   - Taking sin(kx)/x → 1; it is k.\n" +
      "   - In the squeeze, forgetting to check that both bounding functions have the same limit.\n" +
      "\n" +
      "MINI EXAMPLE: lim(x→2) (x² − 4)/(x − 2): substitution gives 0/0. (x−2)(x+2)/(x−2) = x + 2 for x ≠ 2. The limit is 4. The graph is the line y = x + 2 with an open point at (2, 4).\n" +
      "\n" +
      "MEMORY AID: 'Substitute first; on 0/0 factor, conjugate or combine fractions; with sin, reduce to the special limit.'");
  }

  // ---------- steps ----------
  function solveSteps(p) {
    const a = p.a, A = S(a), Pa = P(a);
    const L = limFr(p), Ls = frS(L);
    const lim = `lim(x→${A})`;
    const steps = [];
    let n = 0;
    const add = (tt, te, bt, be) => {
      n++;
      steps.push(`── ${n}) ${Tx(tt, te)} ──\n${Tx(bt, be === undefined ? bt : be)}`);
    };
    const f = fStr(p);
    add('Soru', 'Problem', `${lim} ${f}`, `${lim} ${f}`);
    switch (p.kind) {
      case 'poly': {
        const v = p.A * a * a + p.B * a + p.C;
        add('Doğrudan yerine koyma', 'Direct substitution',
          'Polinom her yerde süreklidir; toplam, sabitle çarpım ve kuvvet kurallarıyla limit, fonksiyonun değerine eşit olur.',
          'A polynomial is continuous everywhere: by the sum, constant-multiple and power laws the limit equals the value.');
        add('Hesap', 'Computation',
          `${lim} (${f}) = ${P(p.A)}·(${A})² + ${P(p.B)}·${Pa} + ${P(p.C)} = ${S(p.A * a * a)} + ${S(p.B * a)} + ${S(p.C)} = ${S(v)}`);
        break;
      }
      case 'rat': {
        const N = p.A * a * a + p.B * a + p.C, D = p.D * a + p.E;
        add('Paydanın limiti', 'Limit of the denominator',
          `${lim} (${poly([[p.D, 'x'], [p.E, '']])}) = ${P(p.D)}·${Pa} + ${P(p.E)} = ${S(D)} ≠ 0  ⇒  Bölüm kuralı kullanılabilir (uygundur).`,
          `${lim} (${poly([[p.D, 'x'], [p.E, '']])}) = ${P(p.D)}·${Pa} + ${P(p.E)} = ${S(D)} ≠ 0  ⇒  the Quotient Law applies.`);
        add('Payın limiti', 'Limit of the numerator',
          `${lim} (${poly([[p.A, 'x²'], [p.B, 'x'], [p.C, '']])}) = ${P(p.A)}·(${A})² + ${P(p.B)}·${Pa} + ${P(p.C)} = ${S(N)}`);
        add('Bölüm kuralı', 'Quotient law', `Limit = ${S(N)} / ${P(D)} = ${Ls}`);
        break;
      }
      case 'root': {
        const rad = p.al * a + p.be, rt = sqrtI(rad);
        add('Kök kuralı', 'Root law',
          `Kök içinin limiti: ${lim} (${poly([[p.al, 'x'], [p.be, '']])}) = ${S(rad)} ≥ 0  ⇒  √${S(rad)} = ${rt}`,
          `Limit of the radicand: ${lim} (${poly([[p.al, 'x'], [p.be, '']])}) = ${S(rad)} ≥ 0  ⇒  √${S(rad)} = ${rt}`);
        add('Toplam ve sabitle çarpım', 'Sum and constant multiple',
          `${lim} (${P(p.ga)}x) = ${P(p.ga)}·${Pa} = ${S(p.ga * a)}.  Limit = ${rt} + ${P(p.ga * a)} = ${Ls}`,
          `${lim} (${P(p.ga)}x) = ${P(p.ga)}·${Pa} = ${S(p.ga * a)}.  Limit = ${rt} + ${P(p.ga * a)} = ${Ls}`);
        break;
      }
      case 'factor': {
        const N0 = 0;
        add('Yerine koyma', 'Substitution',
          `Pay: ${S(p.c * (a - a) * (a + p.k))} ve payda: 0 ⇒ 0/0 belirsizliği. Doğrudan bir sonuç çıkmıyor; önce sadeleştirelim.`,
          `Numerator: ${S(N0)} and denominator: 0 ⇒ 0/0 indeterminate form. No direct answer yet; let's simplify first.`);
        const Nf = `${p.c === 1 ? '' : P(p.c)}(${lin(a)})(${poly([[1, 'x'], [p.k, '']])})`;
        const Df = p.quadD ? `(${lin(a)})(${poly([[1, 'x'], [p.j, '']])})` : `(${lin(a)})`;
        add('Çarpanlara ayıralım', 'Factor',
          `x = ${A} hem payın hem paydanın kökü ⇒ (${lin(a)}) ortak çarpan.\nPay = ${Nf}   [çarpım: ${poly([[p.c, 'x²'], [p.c * (p.k - a), 'x'], [-p.c * a * p.k, '']])}]\nPayda = ${Df}`,
          `x = ${A} is a root of both numerator and denominator ⇒ (${lin(a)}) is a common factor.\nNumerator = ${Nf}   [expands to ${poly([[p.c, 'x²'], [p.c * (p.k - a), 'x'], [-p.c * a * p.k, '']])}]\nDenominator = ${Df}`);
        const kx = poly([[1, 'x'], [p.k, '']]);
        const g = p.quadD ? `${p.c === 1 ? '' : P(p.c)}(${kx}) / (${poly([[1, 'x'], [p.j, '']])})` : (p.c === 1 ? kx : `${P(p.c)}·(${kx})`);
        add(`Sadeleştir (x ≠ ${A})`, `Cancel (x ≠ ${A})`,
          `x ≠ ${A} için (${lin(a)}) sadeleşir:  f(x) = ${g}`,
          `For x ≠ ${A} the factor (${lin(a)}) cancels:  f(x) = ${g}`);
        add('Yerine koyalım', 'Substitute',
          p.quadD ? `${lim} f(x) = ${p.c === 1 ? '' : P(p.c)}(${A} + ${P(p.k)}) / (${A} + ${P(p.j)}) = ${S(p.c * (a + p.k))} / ${P(a + p.j)} = ${Ls}`
            : `${lim} f(x) = ${p.c === 1 ? '' : P(p.c) + '·'}(${A} + ${P(p.k)}) = ${Ls}`);
        add('Grafik', 'Graph', `f(x) doğru/eğri parçasıdır ama (${A}, ${Ls}) noktası boştur (f(${A}) tanımsız); limit yine ${Ls}.`,
          `The graph is the simplified curve with an open point at (${A}, ${Ls}) (f(${A}) is undefined); the limit is still ${Ls}.`);
        break;
      }
      case 'conjA': {
        const q = poly([[1, 'x'], [p.b, '']]);
        add('Yerine koyma', 'Substitution', `Pay: √(${S(a + p.b)}) − ${p.r} = ${p.r} − ${p.r} = 0, payda: 0 ⇒ 0/0. Eşlenikten yararlanalım.`,
          `Numerator: √(${S(a + p.b)}) − ${p.r} = ${p.r} − ${p.r} = 0, denominator: 0 ⇒ 0/0. Let's use the conjugate.`);
        add('Eşlenikle çarpalım', 'Multiply by the conjugate',
          `Pay ve paydayı (√(${q}) + ${p.r}) ile çarpalım:\n(√(${q}) − ${p.r})(√(${q}) + ${p.r}) = (${q}) − ${p.r * p.r} = ${lin(a)}`,
          `We can multiply top and bottom by (√(${q}) + ${p.r}):\n(√(${q}) − ${p.r})(√(${q}) + ${p.r}) = (${q}) − ${p.r * p.r} = ${lin(a)}`);
        add('Sadeleştirelim', 'Cancel', `f(x) = (${lin(a)}) / ((${lin(a)})(√(${q}) + ${p.r})) = 1 / (√(${q}) + ${p.r})   (x ≠ ${A})`);
        add('Yerine koyalım', 'Substitute', `${lim} f(x) = 1 / (√${S(a + p.b)} + ${p.r}) = 1 / (${p.r} + ${p.r}) = ${Ls}`);
        break;
      }
      case 'conjB': {
        add('Yerine koyma', 'Substitution', `Pay: ${A} − ${A} = 0, payda: √${A} − ${p.r} = 0 ⇒ 0/0. Eşlenikten yararlanalım.`,
          `Numerator: ${A} − ${A} = 0, denominator: √${A} − ${p.r} = 0 ⇒ 0/0. Let's use the conjugate.`);
        add('Eşlenikle çarpalım', 'Multiply by the conjugate',
          `Pay ve paydayı (√x + ${p.r}) ile çarpalım: payda (√x − ${p.r})(√x + ${p.r}) = x − ${p.r * p.r} = ${lin(a)}`,
          `We can multiply top and bottom by (√x + ${p.r}): denominator (√x − ${p.r})(√x + ${p.r}) = x − ${p.r * p.r} = ${lin(a)}`);
        add('Sadeleştirelim', 'Cancel', `f(x) = (${lin(a)})(√x + ${p.r}) / (${lin(a)}) = √x + ${p.r}   (x ≠ ${A})`);
        add('Yerine koyalım', 'Substitute', `${lim} f(x) = √${A} + ${p.r} = ${p.r} + ${p.r} = ${Ls}`);
        break;
      }
      case 'compound': {
        const q = poly([[1, 'x'], [p.b, '']]), s = p.s;
        add('Yerine koyma', 'Substitution', `Pay: 1/${P(s)} − 1/${P(s)} = 0, payda: 0 ⇒ 0/0. Bileşik kesri sadeleştirelim.`,
          `Numerator: 1/${P(s)} − 1/${P(s)} = 0, denominator: 0 ⇒ 0/0. Let's simplify the compound fraction.`);
        add('Ortak payda', 'Common denominator',
          `1/(${q}) − 1/${P(s)} = (${S(s)} − (${q})) / (${P(s)}(${q})) = (${poly([[-1, 'x'], [a, '']])}) / (${P(s)}(${q}))   [${S(s)} − ${P(p.b)} = ${S(a)}]`);
        add('Sadeleştirelim', 'Cancel',
          `f(x) = (${poly([[-1, 'x'], [a, '']])}) / (${P(s)}(${q})(${lin(a)})) = −1 / (${P(s)}(${q}))   [(${poly([[-1, 'x'], [a, '']])}) = −(${lin(a)}), x ≠ ${A}]`);
        add('Yerine koyalım', 'Substitute', `${lim} f(x) = −1 / (${P(s)}·${P(s)}) = ${Ls}`);
        break;
      }
      case 'squeeze': {
        const u = uStr(p), nn = p.n === 2 ? '²' : '', ab = Math.abs(p.c);
        const bnd = `${ab === 1 ? '' : ab}${p.n === 2 ? u + '²' : '|' + (a === 0 ? 'x' : lin(a)) + '|'}`;
        const T = trigFn(p);
        add('Doğrudan yerine koyma neden olmaz', 'Why substitution fails',
          `${T}(1/${u}) terimi x → ${A} iken sonsuz kez salınır (−1 ile 1 arası), limiti yoktur; çarpım kuralı doğrudan kullanılamaz. Ancak bu çarpan sınırlıdır, bundan yararlanabiliriz.`,
          `The term ${T}(1/${u}) oscillates infinitely often between −1 and 1 as x → ${A} and has no limit, so the product law cannot be used directly. But the factor is bounded, and that helps us.`);
        add('Sınırlayalım', 'Bound it', `−1 ≤ ${T}(1/${u}) ≤ 1   (x ≠ ${A})  ⇒  |${p.c === 1 ? '' : P(p.c) + '·'}${u}${nn}·${T}(1/${u})| ≤ ${bnd}`,
          `−1 ≤ ${T}(1/${u}) ≤ 1   (x ≠ ${A})  ⇒  |${p.c === 1 ? '' : P(p.c) + '·'}${u}${nn}·${T}(1/${u})| ≤ ${bnd}`);
        const lowS = p.L === 0 ? '−' + bnd : S(p.L) + ' − ' + bnd, upS = p.L === 0 ? bnd : S(p.L) + ' + ' + bnd;
        add('İki yan fonksiyon', 'The two bounding functions', `g(x) = ${lowS}  ≤  f(x)  ≤  h(x) = ${upS}`);
        add('Sınırların limiti', 'Limits of the bounds', `${lim} g(x) = ${S(p.L)}   ve   ${lim} h(x) = ${S(p.L)}   (|x − ${A}| → 0).`,
          `${lim} g(x) = ${S(p.L)}   and   ${lim} h(x) = ${S(p.L)}   (|x − ${A}| → 0).`);
        add('Sıkıştırma Teoremi', 'Squeeze Theorem', `İki sınır da ${S(p.L)}'ye gittiği için ${lim} f(x) = ${S(p.L)}.`, `Both bounds tend to ${S(p.L)}, so ${lim} f(x) = ${S(p.L)}.`);
        break;
      }
      default: {
        const k = p.k, m = p.m, kx = (k === 1 ? '' : k === -1 ? '−' : S(k)) + 'x';
        const mc = m === 1 ? '' : m === -1 ? '−' : S(m), mx = mc + 'x';
        const kk = P(k), mm = P(m);
        if (p.sub === 'sinLin') {
          add('Yerine koyma', 'Substitution', 'sin 0 / 0 = 0/0 belirsiz. Özel limite çevirelim: u = kx → 0 alalım.', 'sin 0 / 0 = 0/0 is indeterminate. Let us convert it to the special limit with u = kx → 0.');
          add('Ölçekleyelim', 'Scale', `sin(${kx})/(${mx}) = (${kk}/${mm})·sin(${kx})/(${kx})`);
          add('Özel limit', 'Special limit', `u = ${kx} → 0 iken sin u / u → 1.  Limit = (${kk}/${mm})·1 = ${Ls}`, `As u = ${kx} → 0, sin u / u → 1.  Limit = (${kk}/${mm})·1 = ${Ls}`);
        } else if (p.sub === 'sinSin') {
          add('Yerine koyma', 'Substitution', 'sin 0 / sin 0 = 0/0 belirsiz.', 'sin 0 / sin 0 = 0/0 is indeterminate.');
          add('Ölçekleyelim', 'Scale', `sin(${kx})/sin(${mx}) = [sin(${kx})/(${kx})] · [(${mx})/sin(${mx})] · (${kk}/${mm})`);
          add('Özel limit', 'Special limit', `Birinci çarpan → 1, ikinci çarpan → 1/1 = 1.  Limit = 1·1·(${kk}/${mm}) = ${Ls}`, `First factor → 1, second factor → 1/1 = 1.  Limit = 1·1·(${kk}/${mm}) = ${Ls}`);
        } else if (p.sub === 'cosLin') {
          add('Yerine koyma', 'Substitution', '(1 − cos 0)/0 = 0/0 belirsiz.', '(1 − cos 0)/0 = 0/0 is indeterminate.');
          add('Ölçekleyelim', 'Scale', `(1 − cos(${kx}))/(${mx}) = (${kk}/${mm})·(1 − cos(${kx}))/(${kx})`);
          add('Özel limit', 'Special limit', `u = ${kx} → 0 iken (1 − cos u)/u → 0.  Limit = (${kk}/${mm})·0 = 0`, `As u = ${kx} → 0, (1 − cos u)/u → 0.  Limit = (${kk}/${mm})·0 = 0`);
        } else {
          add('Yerine koyma', 'Substitution', '(1 − cos 0)/0 = 0/0 belirsiz.', '(1 − cos 0)/0 = 0/0 is indeterminate.');
          add('Eşlenikle çarp', 'Multiply by 1 + cos', `(1 − cos(${kx}))(1 + cos(${kx})) = 1 − cos²(${kx}) = sin²(${kx})`);
          add('Ayıralım', 'Split', `f(x) = sin²(${kx}) / (${mc}x²(1 + cos(${kx}))) = (1/${mm})·[sin(${kx})/x]²·1/(1 + cos(${kx}))`);
          add('Limitler', 'Limits', `sin(${kx})/x = ${kk}·sin(${kx})/(${kx}) → ${kk}·1 = ${kk};  1 + cos(${kx}) → 2.\nLimit = (1/${mm})·(${kk})²·(1/2) = ${Ls}`);
        }
      }
    }
    add('Sonuç', 'Result', `${lim} ${f} = ${Ls}`);
    // numerical check
    const d = Math.pow(10, -p.dExp), x1 = a + p.side * d;
    const tbl = (sgn) => [0.1, 0.01, 0.001].map((e) => `x = ${nf(a + sgn * e, 3)}: ${nf(F(p, a + sgn * e), 4)}`).join('   |   ');
    add('Sayısal doğrulama', 'Numerical check',
      `Kaydırıcıda: x = ${nf(x1, 4)}, f(x) = ${nf(F(p, x1), 4)}   (limit = ${nf(frVal(L), 4)})\nSoldan:  ${tbl(-1)}\nSağdan: ${tbl(1)}`,
      `Slider: x = ${nf(x1, 4)}, f(x) = ${nf(F(p, x1), 4)}   (limit = ${nf(frVal(L), 4)})\nFrom the left:  ${tbl(-1)}\nFrom the right: ${tbl(1)}`);
    return steps;
  }

  function draw(canvas, p) {
    try {
      const a = p.a, L = frVal(limFr(p));
      const w = p.kind === 'squeeze' ? 1.2 : 3;
      const xMin = a - w, xMax = a + w;
      let yMin, yMax;
      if (p.kind === 'squeeze') {
        const hb = Math.max(0.5, Math.abs(p.c) * Math.pow(w, p.n) * 1.15);
        yMin = L - hb; yMax = L + hb;
      } else {
        const ys = [];
        for (let i = 0; i <= 120; i++) { const y = F(p, xMin + 2 * w * i / 120); if (isFinite(y)) ys.push(y); }
        ys.sort((u, v) => u - v);
        let lo = L, hi = L;
        if (ys.length > 4) { lo = Math.min(lo, ys[Math.floor(ys.length * 0.08)]); hi = Math.max(hi, ys[Math.ceil(ys.length * 0.92) - 1]); }
        const span = Math.max(2.5, hi - lo), pad = span * 0.25;
        yMin = lo - pad; yMax = hi + pad;
      }
      { const hy = Math.max(L - yMin, yMax - L); yMin = L - hy; yMax = L + hy; }
      canvas.setViewport(xMin, xMax, yMin, yMax);
      if (p.kind === 'squeeze') {
        const ab = Math.abs(p.c);
        canvas.addFunction({ evaluator: (x) => p.L + ab * Math.pow(Math.abs(x - a), p.n), color: canvas.gray(), thickness: 1.5, dashed: true, label: '' });
        canvas.addFunction({ evaluator: (x) => p.L - ab * Math.pow(Math.abs(x - a), p.n), color: canvas.gray(), thickness: 1.5, dashed: true, label: '' });
      }
      canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 2.5, label: 'f(x)' });
      canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: `x = ${nf(a, 2)}` });
      canvas.addGuideLine({ axis: 'horizontal', position: L, color: canvas.green(), label: `L = ${frS(limFr(p))}` });
      canvas.addMarker({ x: a, y: L, color: canvas.gold(), radius: 6, hollow: hasHole(p), label: hasHole(p) ? '' : `(${nf(a, 2)}, ${nf(L, 2)})` });
      const x1 = a + p.side * Math.pow(10, -p.dExp), y1 = F(p, x1);
      if (isFinite(y1)) {
        canvas.addSegment({ x1, y1: yMin, x2: x1, y2: y1, color: canvas.orange(), thickness: 1.2, dashed: true });
        canvas.addSegment({ x1: xMin, y1, x2: x1, y2: y1, color: canvas.orange(), thickness: 1.2, dashed: true });
        canvas.addMarker({ x: x1, y: y1, color: canvas.orange(), radius: 5, label: `(${nf(x1, 3)}, ${nf(y1, 3)})` });
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, hp) {
    hp.addSlider({
      caption: Tx('x → a (|x − a| = 10^(−t), t büyüdükçe a\'ya yaklaşır)', 'x → a (|x − a| = 10^(−t); larger t is closer to a)'),
      min: 0, max: 3, step: 0.05,
      get: () => getProblem().dExp,
      set: (v) => { getProblem().dExp = Math.max(0, Math.min(3, v)); },
    });
    hp.addRadioGroup({
      name: 'limitLawsSide',
      options: [{ label: Tx('Sağdan (x > a)', 'From the right (x > a)'), value: 1 }, { label: Tx('Soldan (x < a)', 'From the left (x < a)'), value: -1 }],
      get: () => getProblem().side,
      set: (v) => { getProblem().side = Number(v) < 0 ? -1 : 1; },
    });
  }

  Topics.register('limits', {
    id: 'limitLaws',
    tabTitle: () => Tx('Limit Kuralları ve Hesaplama', 'Limit Laws & Evaluation'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.a, y: frVal(limFr(p)) }),
    buildControls,
    links: [
      { match: /^\s*(Toplam\/Fark|Sum\/Difference):/, make: (rng) => genR(rng, 0) },
      { match: /^\s*(Sabitle çarpım|Constant multiple):/, make: (rng) => genR(rng, 0) },
      { match: /^\s*(Çarpım|Product):/, make: (rng) => genR(rng, 0) },
      { match: /^\s*(Bölüm|Quotient):/, make: (rng) => genR(rng, 1) },
      { match: /^\s*(Kuvvet|Power):/, make: (rng) => genR(rng, 0) },
      { match: /^\s*(Kök|Root):/, make: (rng) => genR(rng, 2) },
      { match: /^(DOĞRUDAN YERİNE KOYMA|DIRECT SUBSTITUTION):/, make: (rng) => genR(rng, rng.pick([0, 1, 2])) },
      { match: /^\s*\(1\) (Çarpanlara ayır|Factor and cancel)/, make: (rng) => genR(rng, rng.pick([3, 4, 5])) },
      { match: /^\s*\(2\) (Eşlenikle çarp|Rationalize with)/, make: (rng) => genR(rng, rng.pick([6, 7])) },
      { match: /^\s*\(3\) (Bileşik kesri|Simplify a compound)/, make: (rng) => genR(rng, 8) },
      { match: /^(SIKIŞTIRMA|SQUEEZE) /, make: (rng) => genR(rng, rng.pick([9, 10])) },
      { match: /^\s*lim\(u→0\) sin u \/ u = 1/, make: (rng) => genR(rng, rng.pick([11, 13, 14, 15])) },
      { match: /^\s*(Ölçekleme|Scaling):/, make: (rng) => genR(rng, rng.pick([11, 12, 13])) },
    ],
  });
})();
