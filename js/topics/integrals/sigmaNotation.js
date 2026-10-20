// Sigma notation and finite sums (Thomas 5.2): Σ notation, index shift, Σk, Σk², Σk³, and the limit of right-endpoint
// Riemann sums of x, x², x³ (or a x² + c x) on [0, b].
// problem = { type: 0 explicit sum | 1 sum with formulas | 2 index shift | 3 limit, pure power | 4 limit, a x² + c x |
//             5 limit of Σ(...)/nᵖ ... }
(function () {
  const tx = (a, b) => I18N.tx(a, b);
  const M = (s) => String(s).replace(/-/g, '−');
  const N2 = (v) => M(fmt2(v));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const fr = (n, d) => { if (d === undefined) d = 1; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  const fadd = (x, y) => fr(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  const fstr = (x) => (x[1] === 1 ? M(x[0]) : `${x[0] < 0 ? '−' : ''}${Math.abs(x[0])}/${x[1]}`);
  const P = (v) => (v < 0 ? `(${N2(v)})` : N2(v));
  const safeFn = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || '⁻').join('');
  function rgba(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    return `rgba(${parseInt(m[1].substr(0, 2), 16)},${parseInt(m[1].substr(2, 2), 16)},${parseInt(m[1].substr(4, 2), 16)},${a})`;
  }
  let forced = null;

  // sums 1..n
  const S0 = (n) => n, S1 = (n) => n * (n + 1) / 2, S2 = (n) => n * (n + 1) * (2 * n + 1) / 6, S3 = (n) => Math.pow(n * (n + 1) / 2, 2);
  const SF = [S0, S1, S2, S3];
  const listTxt = (arr, fmt) => (arr.length <= 7 ? arr.map(fmt).join(', ') : arr.slice(0, 4).map(fmt).join(', ') + ', …, ' + fmt(arr[arr.length - 1]));

  // polynomial text in variable v, c = [c0, c1, c2, c3]
  function polyStr(c, v) {
    const parts = [];
    for (let d = c.length - 1; d >= 0; d--) if (c[d] !== 0) parts.push({ num: c[d], d });
    if (!parts.length) return '0';
    let s = '';
    parts.forEach((q, i) => {
      const a = Math.abs(q.num);
      const body = q.d === 0 ? String(a) : (a === 1 ? '' : String(a)) + v + (q.d > 1 ? sup(q.d) : '');
      s += i === 0 ? (q.num < 0 ? '−' : '') + body : (q.num < 0 ? ' − ' : ' + ') + body;
    });
    return s;
  }
  const pEval = (c, x) => c.reduce((s, q, d) => s + q * Math.pow(x, d), 0);

  // summand families for explicit sums: { str, fn }
  function mkSummand(rng, kind) {
    if (kind === 'lin') { const a = rng.nonZeroInt(-3, 5), b = rng.nextInt(-5, 6); return { c: [b, a, 0, 0], str: polyStr([b, a, 0, 0], 'k'), poly: true }; }
    if (kind === 'quad') { const a = rng.nonZeroInt(1, 3), b = rng.nextInt(-3, 4), c = rng.nextInt(-4, 5); return { c: [c, b, a, 0], str: polyStr([c, b, a, 0], 'k'), poly: true }; }
    if (kind === 'cube') { const a = rng.pick([1, 2]), b = rng.nextInt(-2, 3); return { c: [0, 0, b, a], str: polyStr([0, 0, b, a], 'k'), poly: true }; }
    const r = rng.pick([2, 3]);
    return { r, str: `${r}ᵏ`, geo: true, fn: (k) => Math.pow(r, k) };
  }
  const sFn = (u) => (u.poly ? (k) => pEval(u.c, k) : u.fn);

  function createProblem(rng) {
    const type = forced !== null ? forced : rng.pick([0, 0, 1, 1, 2, 3, 3, 4, 5]);
    const p = { type };
    if (type === 0) {
      p.kind = rng.pick(['lin', 'quad', 'cube', 'geo']);
      p.u = mkSummand(rng, p.kind);
      p.m = rng.pick([1, 1, 2, 3]);
      p.n = p.m + (p.kind === 'geo' ? rng.nextInt(3, 5) : rng.nextInt(3, 6));
      p.ts = p.n - p.m + 1;
    } else if (type === 1) {
      p.c = [rng.nextInt(-4, 5), rng.nextInt(-4, 5), rng.nonZeroInt(-3, 3), rng.pick([0, 0, 1, 2])];
      p.m = rng.pick([1, 1, 3]);
      p.n = rng.pick([6, 8, 10, 12]);
      p.u = { c: p.c, poly: true, str: polyStr(p.c, 'k') };
      p.ts = p.n - p.m + 1;
    } else if (type === 2) {
      const L = rng.pick([0, 1, 1, 2]);
      p.m = L + rng.pick([1, 2, 3]);
      p.s = p.m - L;
      p.L = L;
      p.n = p.m + rng.nextInt(3, 6);
      const a = rng.nonZeroInt(-2, 3), b = rng.nextInt(-4, 5), c = rng.nextInt(-4, 5);
      p.c = [c, b, a, 0];
      p.u = { c: p.c, poly: true, str: polyStr(p.c, 'k') };
      p.ts = p.n - p.m + 1;
    } else if (type === 3) {
      p.k = rng.pick([1, 2, 3]); p.b = rng.nextInt(1, 5);
      p.g = [0, p.k === 1 ? 1 : 0, p.k === 2 ? 1 : 0, p.k === 3 ? 1 : 0];
    } else if (type === 4) {
      p.a = rng.nextInt(1, 4); p.cc = rng.nextInt(1, 5); p.b = rng.nextInt(1, 4);
      p.g = [0, p.cc, p.a, 0];
    } else {
      p.deg = rng.pick([2, 3]);
      p.a = rng.nextInt(1, 5); p.bb = rng.nonZeroInt(-3, 5); p.b = 1;
      p.g = [0, 0, p.deg === 2 ? p.a : 0, p.deg === 3 ? p.a : 0];
    }
    p.vn = p.type >= 3 ? 5 : 0;
    p.vb = p.b;
    p.vt = p.ts || 0;
    return p;
  }

  const sumOf = (fn, m, n) => { let s = 0; for (let k = m; k <= n; k++) s += fn(k); return s; };

  // ---------- statement ----------
  function problemStatement(p) {
    if (p.type === 0) return tx(`Σ (k = ${p.m}…${p.n}) ( ${p.u.str} ) toplamının değerini bulalım. Terimleri yazarak hesaplayıp mümkünse bir formülle de kontrol edebilir miyiz?`,
      `Let's find the value of Σ (k = ${p.m}…${p.n}) ( ${p.u.str} ). Can we compute it by writing out the terms and, where possible, check it with a formula?`);
    if (p.type === 1) return tx(`Terimleri tek tek yazmadan, toplam formüllerini kullanarak Σ (k = ${p.m}…${p.n}) ( ${p.u.str} ) toplamını hesaplayalım.`,
      `Without writing out every term, let's use the sum formulas to compute Σ (k = ${p.m}…${p.n}) ( ${p.u.str} ).`);
    if (p.type === 2) return tx(`Σ (k = ${p.m}…${p.n}) ( ${p.u.str} ) toplamını j = k − ${p.s} indeksiyle, j = ${p.L}'dan başlayacak biçimde yeniden yazalım. Her iki yazımın da aynı değeri verdiğini kontrol edelim.`,
      `Let's rewrite Σ (k = ${p.m}…${p.n}) ( ${p.u.str} ) using the index j = k − ${p.s}, so that the sum starts at j = ${p.L}. Let's also check that both forms give the same value.`);
    if (p.type === 3) return tx(`f(x) = ${p.k === 1 ? 'x' : 'x' + sup(p.k)} fonksiyonunun [0, ${p.b}] aralığındaki grafiğinin altında kalan alanı, n tane SAĞ uç nokta dikdörtgeninin toplamının n → ∞ limiti olarak tam olarak bulalım.`,
      `Let's find the area under the graph of f(x) = ${p.k === 1 ? 'x' : 'x' + sup(p.k)} on [0, ${p.b}] exactly, as the limit (n → ∞) of the sum of n RIGHT-endpoint rectangles.`);
    if (p.type === 4) return tx(`f(x) = ${polyStr(p.g, 'x')} fonksiyonunun [0, ${p.b}] aralığındaki grafiğinin altında kalan alanı, n tane SAĞ uç nokta dikdörtgeninin toplamının n → ∞ limiti olarak tam olarak bulalım.`,
      `Let's find the area under the graph of f(x) = ${polyStr(p.g, 'x')} on [0, ${p.b}] exactly, as the limit (n → ∞) of the sum of n RIGHT-endpoint rectangles.`);
    const num = p.deg === 2 ? `${p.a === 1 ? '' : p.a}k² ${p.bb < 0 ? '−' : '+'} ${Math.abs(p.bb) === 1 ? '' : Math.abs(p.bb)}k` : `${p.a === 1 ? '' : p.a}k³ ${p.bb < 0 ? '−' : '+'} ${Math.abs(p.bb) === 1 ? '' : Math.abs(p.bb)}k²`;
    return tx(`lim (n→∞) Σ (k = 1…n) ( ${num} ) / n${sup(p.deg + 1)} limitini toplam formülleriyle bulalım. Bu limit hangi alanı verir?`,
      `Let's find lim (n→∞) Σ (k = 1…n) ( ${num} ) / n${sup(p.deg + 1)} using the sum formulas. Which area does this limit represent?`);
  }

  // ---------- solution ----------
  function area(g, b) { let s = [0, 1]; for (let d = 1; d < g.length; d++) if (g[d]) s = fadd(s, fr(g[d] * Math.pow(b, d + 1), d + 1)); return s; }
  const rightSum = (g, b, n) => { let s = 0; for (let i = 1; i <= n; i++) s += pEval(g, i * b / n); return s * b / n; };

  function solveSteps(p) {
    const s = [];
    if (p.type === 0) return explicitSteps(p, s);
    if (p.type === 1) return formulaSteps(p, s);
    if (p.type === 2) return shiftSteps(p, s);
    return limitSteps(p, s);
  }

  function explicitSteps(p, s) {
    const fn = sFn(p.u);
    const ks = []; for (let k = p.m; k <= p.n; k++) ks.push(k);
    const vals = ks.map(fn);
    const tot = vals.reduce((x, y) => x + y, 0);
    s.push(tx(`── 1) Σ gösterimini okuyalım ──\nΣ (k = ${p.m}…${p.n}) ( ${p.u.str} ), "k = ${p.m}'dan ${p.n}'e kadar her tam sayı için ${p.u.str} değerini hesaplayıp hepsini topla" demektir. Terim sayısı ${p.n} − ${p.m} + 1 = ${ks.length}.`,
      `── 1) Reading the Σ notation ──\nΣ (k = ${p.m}…${p.n}) ( ${p.u.str} ) means "for every integer k from ${p.m} to ${p.n} compute ${p.u.str} and add them all up". The number of terms is ${p.n} − ${p.m} + 1 = ${ks.length}.`));
    const lines = ks.map((k, i) => `k = ${k}:  ${N2(vals[i])}`).join('\n');
    s.push(tx(`── 2) Terimleri hesaplayalım ──\n${lines}`, `── 2) Computing the terms ──\n${lines}`));
    s.push(tx(`── 3) Toplayalım ──\n${vals.map((v) => (v < 0 ? `(${N2(v)})` : N2(v))).join(' + ')} = ${N2(tot)}.`, `── 3) Adding them ──\n${vals.map((v) => (v < 0 ? `(${N2(v)})` : N2(v))).join(' + ')} = ${N2(tot)}.`));
    if (p.u.poly) {
      const c = p.u.c;
      const cnt = ks.length;
      const parts = [];
      let chk = 0;
      for (let d = 3; d >= 0; d--) if (c[d]) {
        const sd = d === 0 ? cnt : SF[d](p.n) - SF[d](p.m - 1);
        chk += c[d] * sd;
        parts.push(`${P(c[d])}·${d === 0 ? cnt : (d === 1 ? 'Σk' : d === 2 ? 'Σk²' : 'Σk³')}${d === 0 ? '' : ` = ${P(c[d])}·(${N2(SF[d](p.n))} − ${N2(SF[d](p.m - 1))}) = ${N2(c[d] * sd)}`}`);
      }
      s.push(tx(`── 4) Formülle kontrol ──\nDoğrusallık: Σ(a·f + b) = aΣf + bΣ1. Formüller: Σk = n(n+1)/2, Σk² = n(n+1)(2n+1)/6, Σk³ = (n(n+1)/2)², Σc = c·(terim sayısı). k = ${p.m}…${p.n} toplamı = (1…${p.n}) − (1…${p.m - 1}).\n${parts.join('\n')}\nToplam = ${N2(chk)} ✓ (doğrudan toplamla aynı).`,
        `── 4) Check with the formulas ──\nLinearity: Σ(a·f + b) = aΣf + bΣ1. Formulas: Σk = n(n+1)/2, Σk² = n(n+1)(2n+1)/6, Σk³ = (n(n+1)/2)², Σc = c·(number of terms). The sum over k = ${p.m}…${p.n} equals (1…${p.n}) − (1…${p.m - 1}).\n${parts.join('\n')}\nTotal = ${N2(chk)} ✓ (same as the direct sum).`));
    } else {
      const r = p.u.r;
      s.push(tx(`── 4) Kontrol ──\nBu bir geometrik toplam (her terim bir öncekinin ${r} katı). Formül: Σ (k = m…n) rᵏ = (rⁿ⁺¹ − rᵐ)/(r − 1) = (${Math.pow(r, p.n + 1)} − ${Math.pow(r, p.m)})/${r - 1} = ${N2(tot)} ✓.`,
        `── 4) Check ──\nThis is a geometric sum (each term is ${r} times the previous one). Formula: Σ (k = m…n) rᵏ = (rⁿ⁺¹ − rᵐ)/(r − 1) = (${Math.pow(r, p.n + 1)} − ${Math.pow(r, p.m)})/${r - 1} = ${N2(tot)} ✓.`));
    }
    s.push(tx(`── 5) Yorum ──\nΣ yalnızca "tekrarlı toplama"nın kısa yazımıdır. Grafikte her k için bir çubuk var; çubuk yükseklikleri terimleri, hepsinin işaretli toplamı da Σ değerini verir: ${N2(tot)}.`,
      `── 5) Interpretation ──\nΣ is just shorthand for repeated addition. In the graph every k has a bar; bar heights are the terms and their signed total is the value of the sum: ${N2(tot)}.`));
    return s;
  }

  function formulaSteps(p, s) {
    const c = p.c, n = p.n, m = p.m;
    const fn = (k) => pEval(c, k);
    const tot = sumOf(fn, m, n);
    s.push(tx(`── 1) Doğrusallıkla ayıralım ──\nΣ (c₃k³ + c₂k² + c₁k + c₀) = c₃Σk³ + c₂Σk² + c₁Σk + c₀Σ1. Burada: ${polyStr(c, 'k')}.\nHazır formüller (k = 1…n): Σ1 = n, Σk = n(n+1)/2, Σk² = n(n+1)(2n+1)/6, Σk³ = (n(n+1)/2)².`,
      `── 1) Splitting by linearity ──\nΣ (c₃k³ + c₂k² + c₁k + c₀) = c₃Σk³ + c₂Σk² + c₁Σk + c₀Σ1. Here: ${polyStr(c, 'k')}.\nReady-made formulas (k = 1…n): Σ1 = n, Σk = n(n+1)/2, Σk² = n(n+1)(2n+1)/6, Σk³ = (n(n+1)/2)².`));
    const cnt = n - m + 1;
    const rows = [];
    for (let d = 0; d <= 3; d++) {
      const nm = ['Σ1', 'Σk', 'Σk²', 'Σk³'][d];
      const a = SF[d](n), b = SF[d](m - 1);
      rows.push(m === 1 ? `${nm} (1…${n}) = ${N2(a)}` : `${nm} (${m}…${n}) = ${N2(a)} − ${N2(b)} = ${N2(a - b)}`);
    }
    s.push(tx(`── 2) Formülleri uygulayalım ──\nn = ${n}${m > 1 ? `; alt sınır ${m} olduğundan Σ (${m}…${n}) = Σ (1…${n}) − Σ (1…${m - 1}) alıyoruz` : ''}:\n${rows.join('\n')}`,
      `── 2) Using the formulas ──\nn = ${n}${m > 1 ? `; since the lower limit is ${m}, we take Σ (${m}…${n}) = Σ (1…${n}) − Σ (1…${m - 1})` : ''}:\n${rows.join('\n')}`));
    const comb = [];
    let chk = 0;
    for (let d = 3; d >= 0; d--) if (c[d]) {
      const sd = SF[d](n) - SF[d](m - 1);
      chk += c[d] * sd;
      comb.push(`${P(c[d])}·${N2(sd)} = ${N2(c[d] * sd)}`);
    }
    s.push(tx(`── 3) Katsayılarla çarpıp toplayalım ──\n${comb.join('\n')}\nToplam = ${N2(chk)}.`, `── 3) Multiplying by the coefficients and adding ──\n${comb.join('\n')}\nTotal = ${N2(chk)}.`));
    const ks = []; for (let k = m; k <= n; k++) ks.push(k);
    s.push(tx(`── 4) Kontrol: ${cnt} terimi tek tek toplayalım ──\nTerimler: ${listTxt(ks.map(fn), N2)}. Hepsinin toplamı ${N2(tot)} ✓ (formülle aynı).`,
      `── 4) Check: adding the ${cnt} terms one by one ──\nTerms: ${listTxt(ks.map(fn), N2)}. Their total is ${N2(tot)} ✓ (same as with the formulas).`));
    return s;
  }

  function shiftSteps(p, s) {
    const c = p.c, sh = p.s, a = c[2], b = c[1], c0 = c[0];
    const g = [a * sh * sh + b * sh + c0, 2 * a * sh + b, a, 0];
    const fn = (k) => pEval(c, k), gn = (j) => pEval(g, j);
    const tot = sumOf(fn, p.m, p.n);
    s.push(tx(`── 1) Yeni indeks ──\nj = k − ${sh} diyelim; yani k = j + ${sh}. Sınırlar: k = ${p.m} → j = ${p.m} − ${sh} = ${p.L}; k = ${p.n} → j = ${p.n} − ${sh} = ${p.n - sh}.`,
      `── 1) The new index ──\nLet j = k − ${sh}, i.e. k = j + ${sh}. Limits: k = ${p.m} → j = ${p.m} − ${sh} = ${p.L}; k = ${p.n} → j = ${p.n} − ${sh} = ${p.n - sh}.`));
    s.push(tx(`── 2) Terimi yeniden yazalım ──\nk yerine (j + ${sh}) koyalım:\n${a === 1 ? '' : P(a)}(j + ${sh})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(j + ${sh}) ${c0 < 0 ? '−' : '+'} ${Math.abs(c0)}\n= ${polyStr(g, 'j')}.`,
      `── 2) Rewriting the term ──\nLet's put (j + ${sh}) in place of k:\n${a === 1 ? '' : P(a)}(j + ${sh})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(j + ${sh}) ${c0 < 0 ? '−' : '+'} ${Math.abs(c0)}\n= ${polyStr(g, 'j')}.`));
    s.push(tx(`── 3) Sonuç ──\nΣ (k = ${p.m}…${p.n}) ( ${polyStr(c, 'k')} ) = Σ (j = ${p.L}…${p.n - sh}) ( ${polyStr(g, 'j')} ).`,
      `── 3) Result ──\nΣ (k = ${p.m}…${p.n}) ( ${polyStr(c, 'k')} ) = Σ (j = ${p.L}…${p.n - sh}) ( ${polyStr(g, 'j')} ).`));
    const ks = [], js = []; for (let k = p.m; k <= p.n; k++) ks.push(k); for (let j = p.L; j <= p.n - sh; j++) js.push(j);
    s.push(tx(`── 4) Kontrol ──\nİki toplamda da ${ks.length} terim var. İlk terim: f(${p.m}) = ${N2(fn(p.m))} ve g(${p.L}) = ${N2(gn(p.L))}; son terim: f(${p.n}) = ${N2(fn(p.n))} ve g(${p.n - sh}) = ${N2(gn(p.n - sh))}.\nİkisinin toplamı: ${N2(sumOf(fn, p.m, p.n))} ve ${N2(sumOf(gn, p.L, p.n - sh))} ✓.`,
      `── 4) Check ──\nBoth sums have ${ks.length} terms. First term: f(${p.m}) = ${N2(fn(p.m))} and g(${p.L}) = ${N2(gn(p.L))}; last term: f(${p.n}) = ${N2(fn(p.n))} and g(${p.n - sh}) = ${N2(gn(p.n - sh))}.\nThe two totals: ${N2(sumOf(fn, p.m, p.n))} and ${N2(sumOf(gn, p.L, p.n - sh))} ✓.`));
    s.push(tx(`── 5) Yorum ──\nİndeks kaydırmak terimleri değiştirmez, yalnızca onlara verilen etiketi değiştirir (grafikte içi boş noktalar kaymış etiketlerdir, yükseklikleri aynıdır). Ortak değer: ${N2(tot)}.`,
      `── 5) Interpretation ──\nShifting the index does not change the terms, only the labels given to them (the hollow points in the graph are the shifted labels; the heights are the same). Common value: ${N2(tot)}.`));
    return s;
  }

  function limitSteps(p, s) {
    const b = p.b, bi = b === 1 ? 'i' : b + 'i';
    if (p.type === 5) return ratioSteps(p, s);
    const K = p.type === 3 ? p.k : 2;
    const g = p.g;
    const fx = polyStr(g, 'x');
    const A = area(g, b);
    s.push(tx(`── 1) Kurulum ──\nf(x) = ${fx}, [0, ${b}]. n eşit parça için Δx = (${b} − 0)/n = ${b}/n; sağ uç noktalar xᵢ = i·Δx = ${bi}/n (i = 1…n).`,
      `── 1) Setup ──\nf(x) = ${fx}, [0, ${b}]. For n equal pieces Δx = (${b} − 0)/n = ${b}/n; the right endpoints are xᵢ = i·Δx = ${bi}/n (i = 1…n).`));
    s.push(tx(`── 2) Sigma biçimindeki toplam ──\nRₙ = Σ (i = 1…n) f(xᵢ)·Δx = Σ (i = 1…n) f(${bi}/n)·(${b}/n).`, `── 2) The sum in sigma form ──\nRₙ = Σ (i = 1…n) f(xᵢ)·Δx = Σ (i = 1…n) f(${bi}/n)·(${b}/n).`));
    const termTr = [], termEn = [], simp = [];
    // each power separately
    const pw = (d) => {
      const coef = d === 1 ? [b * b, 2] : d === 2 ? [b * b * b, 6] : [b * b * b * b, 4];
      const form = d === 1 ? '(1 + 1/n)' : d === 2 ? '(1 + 1/n)(2 + 1/n)' : '(1 + 1/n)²';
      const sumF = d === 1 ? 'n(n+1)/2' : d === 2 ? 'n(n+1)(2n+1)/6' : '(n(n+1)/2)²';
      return { coef: fr(coef[0], coef[1]), form, sumF, lim: d === 2 ? 2 : 1, d, bpow: Math.pow(b, d + 1) };
    };
    const ds = []; for (let d = 1; d <= 3; d++) if (g[d]) ds.push(d);
    ds.forEach((d) => {
      const q = pw(d);
      termTr.push(`${g[d] === 1 ? '' : g[d] + '·'}xᵢ${d === 1 ? '' : sup(d)}·Δx toplamı: Σ (${bi}/n)${d === 1 ? '' : sup(d)}·(${b}/n) = (${q.bpow}/n${sup(d + 1)})·Σ i${d === 1 ? '' : sup(d)} = (${q.bpow}/n${sup(d + 1)})·${q.sumF}`);
      simp.push(`${g[d] === 1 ? '' : g[d] + '·'}[ ${fstr(q.coef)}·${q.form} ]`);
    });
    s.push(tx(`── 3) Sabitleri dışarı alalım ──\nΣ'nın içindeki ${b}/n sabit olduğundan dışarı çıkar; geriye i'nin kuvvetlerinin toplamı kalır:\n${termTr.join('\n')}`,
      `── 3) Pulling the constants out ──\nSince ${b}/n does not depend on i, it comes out of the Σ; what remains is a sum of powers of i:\n${termTr.join('\n').replace(/toplamı:/g, 'sum:')}`));
    s.push(tx(`── 4) Formülleri kullanıp sadeleştirelim ──\nΣ i = n(n+1)/2, Σ i² = n(n+1)(2n+1)/6, Σ i³ = (n(n+1)/2)². n'leri sadeleştirince\nRₙ = ${simp.join(' + ')}.`,
      `── 4) Using the formulas and simplifying ──\nΣ i = n(n+1)/2, Σ i² = n(n+1)(2n+1)/6, Σ i³ = (n(n+1)/2)². After cancelling the n's\nRₙ = ${simp.join(' + ')}.`));
    const limParts = ds.map((d) => { const q = pw(d); return { v: [g[d] * q.coef[0] * q.lim, q.coef[1]], str: `${g[d] === 1 ? '' : g[d] + '·'}${fstr(q.coef)}·${q.lim}` }; });
    s.push(tx(`── 5) n → ∞ limiti ──\nn → ∞ iken 1/n → 0, yani (1 + 1/n) → 1 ve (2 + 1/n) → 2:\nlim Rₙ = ${limParts.map((q) => q.str).join(' + ')} = ${fstr(A)}.`,
      `── 5) The limit n → ∞ ──\nAs n → ∞, 1/n → 0, so (1 + 1/n) → 1 and (2 + 1/n) → 2:\nlim Rₙ = ${limParts.map((q) => q.str).join(' + ')} = ${fstr(A)}.`));
    const kk = p.type === 3 ? K : 0;
    const gen = p.type === 3 ? `∫₀^${b} x${K === 1 ? '' : sup(K)} dx = x${sup(K + 1)}/${K + 1} |₀^${b} = ${b}${sup(K + 1)}/${K + 1} = ${fstr(A)}` : `∫₀^${b} (${fx}) dx = [${p.cc}x²/2 + ${p.a}x³/3]₀^${b} = ${fstr(A)}`;
    void kk;
    const r10 = rightSum(g, b, 10), r100 = rightSum(g, b, 100);
    s.push(tx(`── 6) Kontrol ──\nBelirli integral aynı değeri verir: ${gen}.\nSayısal: R₁₀ = ${N2(r10)}, R₁₀₀ = ${N2(r100)}; n büyüdükçe ${N2(fval(A))} değerine yaklaşıyor ✓.`,
      `── 6) Check ──\nThe definite integral gives the same value: ${gen}.\nNumerically: R₁₀ = ${N2(r10)}, R₁₀₀ = ${N2(r100)}; as n grows they approach ${N2(fval(A))} ✓.`));
    s.push(tx(`── 7) Yorum ──\nSağ uç nokta toplamı artan fonksiyonda gerçek alandan büyüktür (üst toplam), fark 1/n gibi azalır. Limitte tam alan elde edilir: A = ${fstr(A)} birim².`,
      `── 7) Interpretation ──\nFor an increasing function the right-endpoint sum overestimates the true area (an upper sum), the gap shrinking like 1/n. In the limit we get the exact area: A = ${fstr(A)} square units.`));
    return s;
  }
  const fval = (x) => x[0] / x[1];

  function ratioSteps(p, s) {
    const d = p.deg, a = p.a, bb = p.bb;
    const num = d === 2 ? `${a === 1 ? '' : a}k² ${bb < 0 ? '−' : '+'} ${Math.abs(bb) === 1 ? '' : Math.abs(bb)}k` : `${a === 1 ? '' : a}k³ ${bb < 0 ? '−' : '+'} ${Math.abs(bb) === 1 ? '' : Math.abs(bb)}k²`;
    const A = d === 2 ? ['Σk²', 'Σk'] : ['Σk³', 'Σk²'];
    s.push(tx(`── 1) Toplamı ayıralım ──\nn sabit sayılır (k'ya bağlı değildir), doğrusallıkla:\nΣ ( ${num} )/n${sup(d + 1)} = ( ${a}·${A[0]} ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}·${A[1]} )/n${sup(d + 1)}.`,
      `── 1) Splitting the sum ──\nn is treated as a constant (it does not depend on k), so by linearity:\nΣ ( ${num} )/n${sup(d + 1)} = ( ${a}·${A[0]} ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}·${A[1]} )/n${sup(d + 1)}.`));
    if (d === 2) {
      s.push(tx(`── 2) Formülleri yazalım ──\nΣk² = n(n+1)(2n+1)/6, Σk = n(n+1)/2.\nΣk²/n³ = (1 + 1/n)(2 + 1/n)/6,   Σk/n³ = (1 + 1/n)/(2n).`,
        `── 2) Writing the formulas ──\nΣk² = n(n+1)(2n+1)/6, Σk = n(n+1)/2.\nΣk²/n³ = (1 + 1/n)(2 + 1/n)/6,   Σk/n³ = (1 + 1/n)/(2n).`));
      s.push(tx(`── 3) Limit ──\nn → ∞: Σk²/n³ → (1·2)/6 = 1/3 ve Σk/n³ → 0.\nlim = ${a}·(1/3) ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}·0 = ${fstr(fr(a, 3))}.`,
        `── 3) Limit ──\nn → ∞: Σk²/n³ → (1·2)/6 = 1/3 and Σk/n³ → 0.\nlim = ${a}·(1/3) ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}·0 = ${fstr(fr(a, 3))}.`));
    } else {
      s.push(tx(`── 2) Formülleri yazalım ──\nΣk³ = (n(n+1)/2)², Σk² = n(n+1)(2n+1)/6.\nΣk³/n⁴ = (1 + 1/n)²/4,   Σk²/n⁴ = (1 + 1/n)(2 + 1/n)/(6n).`,
        `── 2) Writing the formulas ──\nΣk³ = (n(n+1)/2)², Σk² = n(n+1)(2n+1)/6.\nΣk³/n⁴ = (1 + 1/n)²/4,   Σk²/n⁴ = (1 + 1/n)(2 + 1/n)/(6n).`));
      s.push(tx(`── 3) Limit ──\nn → ∞: Σk³/n⁴ → 1/4 ve Σk²/n⁴ → 0.\nlim = ${a}·(1/4) ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}·0 = ${fstr(fr(a, 4))}.`,
        `── 3) Limit ──\nn → ∞: Σk³/n⁴ → 1/4 and Σk²/n⁴ → 0.\nlim = ${a}·(1/4) ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}·0 = ${fstr(fr(a, 4))}.`));
    }
    const ans = fr(a, d + 1);
    const g = [0, 0, d === 2 ? a : 0, d === 3 ? a : 0];
    const v = (n) => { let t = 0; for (let k = 1; k <= n; k++) t += (d === 2 ? a * k * k + bb * k : a * k * k * k + bb * k * k); return t / Math.pow(n, d + 1); };
    s.push(tx(`── 4) Alan yorumu ──\nk/n = xₖ ve 1/n = Δx dersek terim ${a}·(k/n)${sup(d)}·(1/n) + küçük bir parça olur: bu, f(x) = ${a}x${sup(d)} için [0, 1] üzerindeki sağ uç nokta toplamıdır. Bu yüzden limit ∫₀¹ ${a}x${sup(d)} dx = ${fstr(ans)} alanıdır.\nSayısal kontrol: n = 10 için ${N2(v(10))}, n = 1000 için ${N2(v(1000))} → ${N2(fval(ans))} ✓.`,
      `── 4) Area interpretation ──\nWith k/n = xₖ and 1/n = Δx the term becomes ${a}·(k/n)${sup(d)}·(1/n) plus a small piece: this is the right-endpoint sum for f(x) = ${a}x${sup(d)} on [0, 1]. So the limit is the area ∫₀¹ ${a}x${sup(d)} dx = ${fstr(ans)}.\nNumeric check: n = 10 gives ${N2(v(10))}, n = 1000 gives ${N2(v(1000))} → ${N2(fval(ans))} ✓.`));
    void g;
    return s;
  }

  // ---------- graph ----------
  function draw(canvas, p) {
    if (p.type >= 3) return drawLimit(canvas, p);
    const fn = sFn(p.u);
    const nShow = Math.max(1, Math.min(p.ts, Math.round(p.vt || p.ts)));
    let hi = 5;
    for (let k = p.m; k <= p.n; k++) hi = Math.max(hi, Math.abs(fn(k)));
    const X = p.n + 1;
    canvas.setViewport(-1, X, -hi * 1.2, hi * 1.2);
    let run = 0;
    for (let i = 0; i < nShow; i++) {
      const k = p.m + i, v = fn(k);
      run += v;
      canvas.addSegment({ x1: k, y1: 0, x2: k, y2: v, color: canvas.accent(), thickness: 3 });
      canvas.addMarker({ x: k, y: v, color: canvas.accent(), radius: 5 });
      if (p.type === 2) canvas.addMarker({ x: k - p.s, y: v, color: canvas.orange(), radius: 5, hollow: true });
    }
    if (p.type === 2) canvas.addMarker({ x: p.L, y: 0, color: canvas.orange(), shape: 'diamond', radius: 6, label: tx(`j = ${p.L}…${p.n - p.s} (turuncu, aynı yükseklikler)`, `j = ${p.L}…${p.n - p.s} (orange, same heights)`) });
    canvas.addMarker({ x: p.m + (nShow - 1) / 2, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: tx(`${nShow} terimin toplamı = ${N2(run)}`, `sum of ${nShow} terms = ${N2(run)}`) });
    canvas.addGuideLine({ axis: 'vertical', position: p.m, color: canvas.gold(), label: `k = ${p.m}` });
    canvas.addGuideLine({ axis: 'vertical', position: p.n, color: canvas.gold(), label: `k = ${p.n}` });
  }
  function drawLimit(canvas, p) {
    const g = p.g, b = p.vb, n = Math.max(1, Math.round(p.vn));
    const f = safeFn((x) => pEval(g, x));
    let hi = 1;
    for (let i = 0; i <= 40; i++) hi = Math.max(hi, Math.abs(pEval(g, 4 * i / 40)));
    canvas.setViewport(-1, 5, -hi * 1.1, hi * 1.1);
    const w = b / n;
    canvas.addFilledArea({ evaluator: f, xMin: 0, xMax: b, color: rgba(canvas.accent(), 0.1), samples: 200 });
    for (let i = 1; i <= n; i++) {
      const l = (i - 1) * w, r = i * w, hgt = pEval(g, r);
      canvas.addFilledArea({ evaluator: () => hgt, xMin: l, xMax: r, color: rgba(canvas.orange(), 0.35), samples: 2 });
      canvas.addSegment({ x1: l, y1: 0, x2: l, y2: hgt, color: canvas.orange(), thickness: 1 });
      canvas.addSegment({ x1: l, y1: hgt, x2: r, y2: hgt, color: canvas.orange(), thickness: 1.5 });
      canvas.addSegment({ x1: r, y1: 0, x2: r, y2: hgt, color: canvas.orange(), thickness: 1 });
    }
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    const R = rightSum(g, b, n), A = fval(area(g, b));
    canvas.addGuideLine({ axis: 'vertical', position: b, color: canvas.gold(), label: `b = ${N2(b)}` });
    canvas.addMarker({ x: b / 2, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: tx(`Rₙ = ${N2(R)}   A = ${N2(A)}   (n = ${n})`, `Rₙ = ${N2(R)}   A = ${N2(A)}   (n = ${n})`) });
  }

  // ---------- concept ----------
  function concept() {
    return tx(
      `TANIM
Σ (sigma) gösterimi uzun toplamları kısa yazar:
  Σ (k = m…n) aₖ = aₘ + aₘ₊₁ + … + aₙ.
k "indeks"tir, m alt sınır, n üst sınırdır; terim sayısı n − m + 1'dir.

ÖZELLİKLER
• Σ c·aₖ = c·Σ aₖ   • Σ (aₖ ± bₖ) = Σ aₖ ± Σ bₖ   • Σ (k = 1…n) c = c·n
• İndeks kaydırma: j = k − s ⇒ Σ (k = m…n) f(k) = Σ (j = m−s…n−s) f(j + s). Terimler aynı kalır, yalnızca etiketler değişir.

HAZIR TOPLAM FORMÜLLERİ (k = 1…n)
  Σ k = n(n+1)/2
  Σ k² = n(n+1)(2n+1)/6
  Σ k³ = ( n(n+1)/2 )²
Alt sınır 1 değilse: Σ (k = m…n) = Σ (1…n) − Σ (1…m−1).

SONLU TOPLAMLARIN LİMİTİ (ALAN)
f(x) = xᵖ, [0, b] aralığını n eşit parçaya bölelim: Δx = b/n, sağ uç noktalar xᵢ = ib/n.
  Rₙ = Σ f(xᵢ)Δx = (b^(p+1)/n^(p+1)) Σ iᵖ.
Formülle sadeleştirip n → ∞ yapalım:
  p = 1: (b²/2)(1 + 1/n) → b²/2
  p = 2: (b³/6)(1 + 1/n)(2 + 1/n) → b³/3
  p = 3: (b⁴/4)(1 + 1/n)² → b⁴/4
Genel: alan = b^(p+1)/(p+1).

YÖNTEM
1. Δx = b/n ve xᵢ'yi yazalım. 2. Rₙ = Σ f(xᵢ)Δx kuralını sigma biçiminde kuralım. 3. Sabitleri Σ dışına alalım. 4. Formülü uygulayıp 1/n'li biçime getirelim. 5. n → ∞ alalım (1/n → 0).

TUZAKLAR
• Terim sayısı n − m + 1'dir (n değil). • Σ (k = 1…n) k ≠ n². • Σ k² ≠ (Σ k)². • İndeksi kaydırınca sınırlar ve terim BİRLİKTE değişmeli.

MİNİ ÖRNEK
Σ (k = 1…10) (2k + 1) = 2·55 + 10 = 120. R_n (x² için, [0,3]) = (27/6)(1+1/n)(2+1/n) → 9 = 3³/3 ✓.

NEREDE KULLANILIR?
Kuvvet ve yük dağılımlarının toplanması, ayrık veriden (ölçümlerden) alan ve iş hesabı, sayısal integralin temeli.`,
      `DEFINITION
Sigma (Σ) notation writes long sums briefly:
  Σ (k = m…n) aₖ = aₘ + aₘ₊₁ + … + aₙ.
k is the "index", m the lower limit, n the upper limit; there are n − m + 1 terms.

PROPERTIES
• Σ c·aₖ = c·Σ aₖ   • Σ (aₖ ± bₖ) = Σ aₖ ± Σ bₖ   • Σ (k = 1…n) c = c·n
• Index shift: j = k − s ⇒ Σ (k = m…n) f(k) = Σ (j = m−s…n−s) f(j + s). The terms stay the same, only the labels change.

READY-MADE SUM FORMULAS (k = 1…n)
  Σ k = n(n+1)/2
  Σ k² = n(n+1)(2n+1)/6
  Σ k³ = ( n(n+1)/2 )²
If the lower limit is not 1: Σ (k = m…n) = Σ (1…n) − Σ (1…m−1).

LIMITS OF FINITE SUMS (AREA)
For f(x) = xᵖ, let's split [0, b] into n equal pieces: Δx = b/n, right endpoints xᵢ = ib/n.
  Rₙ = Σ f(xᵢ)Δx = (b^(p+1)/n^(p+1)) Σ iᵖ.
Simplifying with the formula and letting n → ∞:
  p = 1: (b²/2)(1 + 1/n) → b²/2
  p = 2: (b³/6)(1 + 1/n)(2 + 1/n) → b³/3
  p = 3: (b⁴/4)(1 + 1/n)² → b⁴/4
In general: area = b^(p+1)/(p+1).

METHOD
1. Let's write Δx = b/n and xᵢ. 2. Set up Rₙ = Σ f(xᵢ)Δx in sigma form. 3. Pull the constants outside the Σ. 4. Apply the formula and get the 1/n form. 5. Let n → ∞ (1/n → 0).

PITFALLS
• The number of terms is n − m + 1 (not n). • Σ (k = 1…n) k ≠ n². • Σ k² ≠ (Σ k)². • When shifting the index the limits and the term must change TOGETHER.

MINI EXAMPLE
Σ (k = 1…10) (2k + 1) = 2·55 + 10 = 120. R_n (for x², [0,3]) = (27/6)(1+1/n)(2+1/n) → 9 = 3³/3 ✓.

WHERE IS IT USED?
Adding force and load distributions, area and work from discrete measurements, and the basis of numerical integration.`);
  }

  // ---------- controls ----------
  function buildControls(rightCol, getProblem, h) {
    h.addSlider({ caption: tx('Dikdörtgen sayısı n (limit sorularında)', 'Number of rectangles n (limit problems)'), min: 1, max: 60, step: 1, get: () => (getProblem().vn || 5), set: (v) => { getProblem().vn = Math.round(v); } });
    h.addSlider({ caption: tx('Aralığın sağ ucu b (limit sorularında)', 'Right end b of the interval (limit problems)'), min: 1, max: 4, step: 0.5, get: () => (getProblem().vb || 1), set: (v) => { getProblem().vb = v; } });
    h.addSlider({ caption: tx('Gösterilen terim sayısı (toplam sorularında)', 'Number of terms shown (sum problems)'), min: 1, max: 12, step: 1, get: () => (getProblem().vt || getProblem().ts || 1), set: (v) => { getProblem().vt = Math.round(v); } });
  }

  const makeType = (t) => (rng) => {
    const old = forced; forced = t;
    try { return createProblem(rng); } finally { forced = old; }
  };
  // limit problem for f(x) = x^k (pure power)
  const makePower = (k) => (rng) => {
    const p = makeType(3)(rng);
    p.k = k;
    p.g = [0, k === 1 ? 1 : 0, k === 2 ? 1 : 0, k === 3 ? 1 : 0];
    return p;
  };
  // sum with formulas whose lower limit is not 1
  const makeLower = (rng) => {
    const p = makeType(1)(rng);
    p.m = 3;
    p.ts = p.n - p.m + 1;
    p.vt = p.ts;
    return p;
  };

  Topics.register('integrals', {
    id: 'sigmaNotation',
    tabTitle: () => tx('Sigma Gösterimi ve Sonlu Toplamlar', 'Sigma Notation and Finite Sums'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^(TANIM|DEFINITION)$/, make: makeType(0) },
      { match: /^• (İndeks kaydırma|Index shift):/, make: makeType(2) },
      { match: /^(HAZIR TOPLAM FORMÜLLERİ|READY-MADE SUM FORMULAS) /, make: makeType(1) },
      { match: /^(Alt sınır 1 değilse|If the lower limit is not 1):/, make: makeLower },
      { match: /^(SONLU TOPLAMLARIN LİMİTİ \(ALAN\)|LIMITS OF FINITE SUMS \(AREA\))$/, make: makeType(3) },
      { match: /^\s*p = 1:/, make: makePower(1) },
      { match: /^\s*p = 2:/, make: makePower(2) },
      { match: /^\s*p = 3:/, make: makePower(3) },
    ],
    _scenarioCount: () => 6,
    _setScenario: (i) => { forced = i % 6; },
    _lib: { area, rightSum, sumOf, pEval, sFn },
  });
})();
