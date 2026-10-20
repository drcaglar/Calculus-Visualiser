// Mean Value Theorem (+ Rolle's theorem special case), chapter 'applications'.
// problem = { kind, A, B, x0, showT, ...params }
//   'quad'   f = al x^2 + be x + ga              c = (A+B)/2
//   'cubic'  f = u^3 + e u + d, u = x - h        u^2 = (A'^2 + A'B' + B'^2)/3   (Rolle when m = 0)
//   'sqrt'   f = ka sqrt(x), A = s^2, B = t^2    c = ((s+t)/2)^2
//   'recip'  f = ka / x                           c^2 = A B (same sign as the interval); FAILS if 0 in [A, B]
//   'abs'    f = |x - h|                          corner at h: theorem does not apply when h is inside (A, B)
// Endpoints are integers; every stated value is exact (fractions / simplified radicals).
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
  const frAdd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
  const frSub = (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
  const frMul = (a, b) => fr(a.n * b.n, a.d * b.d);
  const frDiv = (a, b) => fr(a.n * b.d, a.d * b.n);
  const frNum = (a) => a.n / a.d;
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const frP = (x) => (x.n < 0 || x.d !== 1 ? '(' + frS(x) + ')' : frS(x));
  function nf(v) { if (!isFinite(v)) return '—'; let s = fmt2(v); if (s === '-0') s = '0'; return M(s); }
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
  // sqrt of a non-negative rational: {fr|null, num, str}
  function isqrt(n) { const r = Math.round(Math.sqrt(n)); return r * r === n ? r : -1; }
  function sqrtFr(x) {
    const p = x.n, q = x.d;
    const sp = isqrt(p), sq = isqrt(q);
    if (sp >= 0 && sq >= 0) { const v = fr(sp, sq); return { fr: v, num: frNum(v), str: frS(v) }; }
    const k = p * q;
    let out = 1, inn = k;
    for (let i = Math.floor(Math.sqrt(k)); i >= 2; i--) { if (k % (i * i) === 0) { out = i; inn = k / (i * i); break; } }
    const g = gcd(out, q); let o = out / g, dd = q / g;
    const num = Math.sqrt(p / q);
    const body = (o > 1 ? o : '') + '√' + inn;
    return { fr: null, num, str: dd > 1 ? body + '/' + dd : body };
  }

  // ---------- model ----------
  function coefs(p) {
    if (p.kind === 'quad') return [p.ga, p.be, p.al];
    if (p.kind === 'cubic') return [-p.h * p.h * p.h - p.e * p.h + p.d, 3 * p.h * p.h + p.e, -3 * p.h, 1];
    return null;
  }
  const dcoefs = (cf) => cf.slice(1).map((c, i) => c * (i + 1));
  function hornerNum(cf, x) { let y = 0; for (let i = cf.length - 1; i >= 0; i--) y = y * x + cf[i]; return y; }
  function hornerFr(cf, x) { let y = fr(0); for (let i = cf.length - 1; i >= 0; i--) y = frAdd(frMul(y, x), fr(cf[i])); return y; }

  function fNum(p, x) {
    let y;
    const cf = coefs(p);
    if (cf) y = hornerNum(cf, x);
    else if (p.kind === 'sqrt') y = x < 0 ? NaN : p.ka * Math.sqrt(x);
    else if (p.kind === 'recip') y = Math.abs(x) < 0.02 ? NaN : p.ka / x;
    else y = Math.abs(x - p.h);
    return isFinite(y) && Math.abs(y) < 300 ? y : NaN;
  }
  function fpNum(p, x) {
    let y;
    const cf = coefs(p);
    if (cf) y = hornerNum(dcoefs(cf), x);
    else if (p.kind === 'sqrt') y = x <= 0 ? NaN : p.ka / (2 * Math.sqrt(x));
    else if (p.kind === 'recip') y = Math.abs(x) < 1e-9 ? NaN : -p.ka / (x * x);
    else y = Math.abs(x - p.h) < 1e-9 ? NaN : (x > p.h ? 1 : -1);
    return isFinite(y) ? y : NaN;
  }
  // exact value of f at integer x (null if f undefined there)
  function fVal(p, x) {
    const cf = coefs(p);
    if (cf) return hornerFr(cf, fr(x));
    if (p.kind === 'sqrt') { const r = isqrt(x); return r >= 0 ? fr(p.ka * r) : null; }
    if (p.kind === 'recip') return x === 0 ? null : fr(p.ka, x);
    return fr(Math.abs(x - p.h));
  }
  function xs(p) { // 'x' with a shift for display
    return p.h === 0 ? 'x' : (p.h > 0 ? `(x − ${p.h})` : `(x + ${-p.h})`);
  }
  function fStr(p) {
    switch (p.kind) {
      case 'quad': return poly([[p.al, 'x²'], [p.be, 'x'], [p.ga, '']]);
      case 'cubic': { const c = coefs(p); return poly([[c[3], 'x³'], [c[2], 'x²'], [c[1], 'x'], [c[0], '']]); }
      case 'sqrt': return (p.ka === 1 ? '' : p.ka) + '√x';
      case 'recip': return p.ka === 1 ? '1/x' : p.ka + '/x';
      default: return '|' + (p.h === 0 ? 'x' : (p.h > 0 ? `x − ${p.h}` : `x + ${-p.h}`)) + '|';
    }
  }
  function fpStr(p) {
    switch (p.kind) {
      case 'quad': return poly([[2 * p.al, 'x'], [p.be, '']]);
      case 'cubic': { const c = coefs(p); return poly([[3, 'x²'], [2 * c[2], 'x'], [c[1], '']]); }
      case 'sqrt': return p.ka === 1 ? '1 / (2√x)' : `${p.ka} / (2√x)`;
      case 'recip': return p.ka === 1 ? '−1/x²' : `−${p.ka}/x²`;
      default: return Tx('x > ' + S(p.h) + ' için 1, x < ' + S(p.h) + ' için −1', '1 for x > ' + S(p.h) + ', −1 for x < ' + S(p.h));
    }
  }
  const iv = (a, b) => `[${S(a)}, ${S(b)}]`;
  const ivo = (a, b) => `(${S(a)}, ${S(b)})`;

  // ---------- analysis ----------
  // returns { ok, why: 'jump'|'corner'|null, fA, fB, m (Fr|null), cs: [{num, str}] (interior solutions), all: bool (every c works) }
  function analyze(p) {
    const A = p.A, B = p.B, r = { A, B, ok: true, why: null, cs: [], all: false };
    r.fA = fVal(p, A); r.fB = fVal(p, B);
    if (p.kind === 'recip' && A <= 0 && B >= 0) { r.ok = false; r.why = 'jump'; return r; }
    r.m = frDiv(frSub(r.fB, r.fA), fr(B - A));
    if (p.kind === 'quad') {
      const c = fr(A + B, 2); r.cs = [{ num: frNum(c), str: frS(c), fr: c }];
    } else if (p.kind === 'cubic') {
      const e = fr(p.e), w = frDiv(frSub(r.m, e), fr(3));
      const sq = sqrtFr(w);
      const mk = (sg) => {
        const num = p.h + sg * sq.num;
        let str;
        if (sq.fr) { const c = frAdd(fr(p.h), sg < 0 ? fr(-sq.fr.n, sq.fr.d) : sq.fr); str = frS(c); return { num: frNum(c), str, fr: c }; }
        str = (p.h === 0 ? (sg < 0 ? '−' : '') : S(p.h) + (sg < 0 ? ' − ' : ' + ')) + sq.str + ' ≈ ' + nf(num);
        return { num, str, fr: null };
      };
      r.w = w; r.sq = sq;
      r.cs = sq.num === 0 ? [mk(1)] : [mk(-1), mk(1)];
    } else if (p.kind === 'sqrt') {
      const s = Math.round(Math.sqrt(A)), t = Math.round(Math.sqrt(B));
      const c = fr((s + t) * (s + t), 4); r.s = s; r.t = t;
      r.cs = [{ num: frNum(c), str: frS(c), fr: c }];
    } else if (p.kind === 'recip') {
      const sq = sqrtFr(fr(A * B)); r.sq = sq;
      const sg = A > 0 ? 1 : -1;
      if (sq.fr) { const c = sg > 0 ? sq.fr : fr(-sq.fr.n, sq.fr.d); r.cs = [{ num: frNum(c), str: frS(c), fr: c }]; }
      else r.cs = [{ num: sg * sq.num, str: (sg < 0 ? '−' : '') + sq.str + ' ≈ ' + nf(sg * sq.num), fr: null }];
    } else { // abs
      if (p.h > A && p.h < B) {
        r.ok = false; r.why = 'corner';
        r.cs = []; // |m| < 1, f' = +-1: no solution
      } else {
        r.all = true; // linear on [A, B]: slope m = +-1 everywhere
      }
    }
    if (r.ok && !r.all) r.cs = r.cs.filter((c) => c.num > A + 1e-12 && c.num < B - 1e-12);
    return r;
  }

  // ---------- generation ----------
  function createProblem(rng, forced) {
    const scen = forced === 'linear' ? 8 : (forced !== undefined ? forced : rng.nextInt(0, 9));
    const p = { x0: 0, showT: true };
    const sgn = () => rng.pick([1, -1]);
    if (scen <= 1) {
      p.kind = 'quad'; p.al = rng.pick([1, -1, 2, -2, 3]); p.be = rng.nextInt(-4, 5); p.ga = rng.nextInt(-3, 4);
      p.A = rng.nextInt(-3, 2); p.B = p.A + rng.nextInt(2, 6); p.scen = 'quad';
    } else if (scen === 2 || scen === 3) {
      p.kind = 'cubic'; p.h = rng.nextInt(-2, 3); p.e = rng.pick([-3, -1, 0, 1, 2, 3]); p.d = rng.nextInt(-2, 3);
      const k = rng.nextInt(1, 3);
      if (rng.nextInt(0, 2) === 0) { p.A = p.h - k; p.B = p.h + 2 * k; } else { p.A = p.h - 2 * k; p.B = p.h + k; }
      p.scen = 'cubic';
    } else if (scen === 4) { // Rolle
      p.kind = 'cubic'; const k = rng.nextInt(1, 3); p.h = rng.nextInt(-2, 3); p.e = -3 * k * k; p.d = rng.nextInt(-3, 4);
      if (rng.nextInt(0, 2) === 0) { p.A = p.h - k; p.B = p.h + 2 * k; } else { p.A = p.h - 2 * k; p.B = p.h + k; }
      p.scen = 'rolle';
    } else if (scen === 5) {
      p.kind = 'sqrt'; p.ka = rng.pick([1, 1, 2, 3]); const s = rng.nextInt(0, 4), t = s + rng.nextInt(1, 4);
      p.A = s * s; p.B = t * t; p.scen = 'sqrt';
    } else if (scen === 6) {
      p.kind = 'recip'; p.ka = rng.pick([1, 2, 3]);
      const pr = rng.pick([[1, 4], [1, 9], [2, 8], [4, 9], [1, 16], [3, 12], [1, 2], [2, 5]]);
      if (rng.nextInt(0, 3) === 0) { p.A = -pr[1]; p.B = -pr[0]; } else { p.A = pr[0]; p.B = pr[1]; }
      p.scen = 'recip';
    } else if (scen === 7) {
      p.kind = 'recip'; p.ka = rng.pick([1, 2]); p.A = -rng.nextInt(1, 4); p.B = rng.nextInt(1, 4); p.scen = 'recipFail';
    } else {
      p.kind = 'abs'; p.h = rng.nextInt(-1, 2);
      const s = rng.nextInt(1, 4); let t = rng.nextInt(1, 4);
      if (rng.nextInt(0, 3) === 0) t = s; // Rolle's hypotheses fail too
      p.A = p.h - s; p.B = p.h + t; p.scen = 'abs';
      if (forced === 'linear') { // |x - h| is linear on an interval that does not contain h: every c works
        if (rng.nextInt(0, 2) === 0) { p.A = p.h + s; p.B = p.h + s + t + 1; } else { p.B = p.h - s; p.A = p.h - s - t - 1; }
      }
    }
    p.x0 = p.A + (p.B - p.A) / 2;
    p.x0 = Math.round(p.x0 * 10) / 10;
    return p;
  }

  // ---------- text ----------
  function isRolle(p, a) { return a.ok && a.fA && a.fB && a.fA.n === a.fB.n && a.fA.d === a.fB.d; }

  function problemStatement(p) {
    const a = analyze(p), f = `f(x) = ${fStr(p)}`;
    if (isRolle(p, a)) {
      return Tx(`${f} fonksiyonu için ${iv(p.A, p.B)} aralığında f(${S(p.A)}) = f(${S(p.B)}) olduğuna dikkat edin. Rolle Teoremi'nin koşullarını kontrol edin ve f'(c) = 0 olan tüm c ∈ ${ivo(p.A, p.B)} değerlerini bulun.`,
        `For ${f} on ${iv(p.A, p.B)} note that f(${S(p.A)}) = f(${S(p.B)}). Check the hypotheses of Rolle's Theorem and find all c ∈ ${ivo(p.A, p.B)} with f'(c) = 0.`);
    }
    return Tx(`${f} fonksiyonu ve ${iv(p.A, p.B)} aralığı için Ortalama Değer Teoremi'nin koşullarını kontrol edin. Koşullar sağlanıyorsa f'(c) = (f(b) − f(a)) / (b − a) eşitliğini sağlayan tüm c ∈ ${ivo(p.A, p.B)} değerlerini bulun; sağlanmıyorsa nedenini açıklayın.`,
      `For ${f} on ${iv(p.A, p.B)} check the hypotheses of the Mean Value Theorem. If they hold, find all c ∈ ${ivo(p.A, p.B)} with f'(c) = (f(b) − f(a)) / (b − a); if not, explain why.`);
  }

  function concept() {
    return Tx(
      'ORTALAMA DEĞER TEOREMİ (OVT) VE ROLLE TEOREMİ\n' +
      '\n' +
      'ROLLE TEOREMİ (özel durum)\n' +
      'f, [a,b]\'de SÜREKLİ, (a,b)\'de TÜREVLENEBİLİR ve f(a) = f(b) ise (a,b)\'de en az bir c vardır: f\'(c) = 0 (yatay teğet).\n' +
      '\n' +
      'ORTALAMA DEĞER TEOREMİ (OVT)\n' +
      'f, [a,b]\'de sürekli ve (a,b)\'de türevlenebilir ise en az bir c ∈ (a,b) vardır:\n' +
      '   f\'(c) = (f(b) − f(a)) / (b − a)\n' +
      'Yani bir noktada ANLIK değişim hızı, aralığın ORTALAMA değişim hızına eşittir; teğet, kesen doğruya paraleldir. Rolle, OVT\'nin f(a) = f(b) (ortalama eğim 0) özel halidir.\n' +
      '\n' +
      'KOŞULLAR (ikisi de şart)\n' +
      '• [a,b]\'de süreklilik (uç noktalar dahil).\n' +
      '• (a,b)\'de türevlenebilirlik (köşe ve sivri uç yok, dikey teğet yok). Uç noktalarda türevlenebilirlik gerekmez (ör. √x için a = 0 olabilir).\n' +
      '\n' +
      'YÖNTEM (c\'yi bulmak)\n' +
      '1. Koşulları kontrol et (süreklilik, türevlenebilirlik).\n' +
      '2. Ortalama eğimi hesapla: m = (f(b) − f(a)) / (b − a).\n' +
      '3. f\'(x) = m denklemini çöz.\n' +
      '4. Çözümlerden (a,b) AÇIK aralığında olanları seç; uç noktalar c olamaz.\n' +
      '5. Doğrula: f\'(c) = m ve teğet, kesene paralel.\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '• Parabolde (ikinci derece) c her zaman aralığın ORTA NOKTASIDIR: c = (a+b)/2.\n' +
      '• Üçüncü derecede iki çözüm çıkabilir; yalnızca (a,b) içindekiler geçerlidir.\n' +
      '• c tek olmak zorunda değil; en az bir tane vardır.\n' +
      '• f lineer ise her c çalışır.\n' +
      '\n' +
      'SONUÇLAR\n' +
      '• f\' = 0 her yerde ise f sabittir.\n' +
      '• f\' = g\' ise f − g sabittir (integralde "+C" nedeni).\n' +
      '• f\' > 0 ise f artandır; f\' < 0 ise azalandır.\n' +
      '\n' +
      'TUZAKLAR\n' +
      '• Koşullar bozulursa teorem çöker: f = |x|, [−1,1] aralığında ortalama eğim 0 ama f\' hiçbir yerde 0 değil (x = 0\'da türev yok). f = 1/x, [−1,2] aralığında 0\'da süreksizlik var; f\' < 0 iken m > 0.\n' +
      '• c\'yi her zaman orta noktada aramayın (yalnızca parabolde orta noktadır).\n' +
      '• Bulunan c\'nin (a,b) içinde olup olmadığını kontrol etmeyi unutmayın.\n' +
      '\n' +
      'FİZİKSEL YORUM\n' +
      '2 saatte 180 km giden araç: ortalama hız 90 km/sa. OVT\'ye göre bir anda hız göstergesi tam 90 km/sa okur.\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      'f(x) = x², [1, 3]. Ortalama eğim = (9 − 1)/2 = 4. f\'(c) = 2c = 4 → c = 2 ∈ (1,3). ✓\n' +
      '\n' +
      'GRAFİK: Turuncu doğru kesen (a,f(a))–(b,f(b)); altın elmaslar c noktalarıdır ve oradaki kesikli teğet, kesene paraleldir. Mavi hareketli teğet için x₀ kaydırıcısını kullanın: teğetin eğimi m ile eşit olduğu yerde altın noktaya ulaşırsınız.',
      'MEAN VALUE THEOREM (MVT) AND ROLLE\'S THEOREM\n' +
      '\n' +
      'ROLLE\'S THEOREM (special case)\n' +
      'If f is CONTINUOUS on [a,b], DIFFERENTIABLE on (a,b) and f(a) = f(b), then there is at least one c in (a,b) with f\'(c) = 0 (horizontal tangent).\n' +
      '\n' +
      'MEAN VALUE THEOREM (MVT)\n' +
      'If f is continuous on [a,b] and differentiable on (a,b), there is at least one c ∈ (a,b) with\n' +
      '   f\'(c) = (f(b) − f(a)) / (b − a)\n' +
      'That is, at some point the INSTANTANEOUS rate of change equals the AVERAGE rate over the interval; the tangent is parallel to the secant. Rolle is the MVT with f(a) = f(b) (average slope 0).\n' +
      '\n' +
      'CONDITIONS (both required)\n' +
      '• Continuity on [a,b] (endpoints included).\n' +
      '• Differentiability on (a,b) (no corners, cusps or vertical tangents). Differentiability at the endpoints is not needed (e.g. a = 0 is fine for √x).\n' +
      '\n' +
      'METHOD (finding c)\n' +
      '1. Check the conditions (continuity, differentiability).\n' +
      '2. Compute the average slope: m = (f(b) − f(a)) / (b − a).\n' +
      '3. Solve f\'(x) = m.\n' +
      '4. Keep the solutions that lie in the OPEN interval (a,b); the endpoints cannot be c.\n' +
      '5. Verify: f\'(c) = m and the tangent is parallel to the secant.\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '• For a parabola, c is always the MIDPOINT: c = (a+b)/2.\n' +
      '• A cubic can give two solutions; only those inside (a,b) count.\n' +
      '• c need not be unique; at least one exists.\n' +
      '• If f is linear, every c works.\n' +
      '\n' +
      'CONSEQUENCES\n' +
      '• If f\' = 0 everywhere, f is constant.\n' +
      '• If f\' = g\', then f − g is constant (the reason for "+C" in integration).\n' +
      '• f\' > 0 means f is increasing; f\' < 0 means decreasing.\n' +
      '\n' +
      'PITFALLS\n' +
      '• If the conditions fail the theorem fails: for f = |x| on [−1,1] the average slope is 0, yet f\' is never 0 (no derivative at x = 0). For f = 1/x on [−1,2] there is a discontinuity at 0; f\' < 0 everywhere while m > 0.\n' +
      '• Do not always look for c at the midpoint (it is the midpoint only for parabolas).\n' +
      '• Always check that the c you found lies inside (a,b).\n' +
      '\n' +
      'PHYSICAL MEANING\n' +
      'A car covers 180 km in 2 hours: average speed 90 km/h. By the MVT, at some instant the speedometer reads exactly 90 km/h.\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      'f(x) = x², [1, 3]. Average slope = (9 − 1)/2 = 4. f\'(c) = 2c = 4 → c = 2 ∈ (1,3). ✓\n' +
      '\n' +
      'GRAPH: the orange line is the secant through (a,f(a)) and (b,f(b)); gold diamonds are the points c and the dashed tangent there is parallel to the secant. Use the x₀ slider for the blue moving tangent: you reach a gold point exactly where the tangent slope equals m.');
  }

  function solveSteps(p) {
    const a = analyze(p), st = [];
    const A = S(p.A), B = S(p.B), f = fStr(p), fp = fpStr(p);
    const rolle = isRolle(p, a);
    const thName = rolle ? Tx('Rolle Teoremi', "Rolle's Theorem") : Tx('Ortalama Değer Teoremi', 'Mean Value Theorem');

    // 1) conditions
    {
      let tr = `── 1) ${thName}'nin koşullarını kontrol et ──\nf(x) = ${f},  [a, b] = ${iv(p.A, p.B)}\n`;
      let en = `── 1) Check the hypotheses of the ${thName} ──\nf(x) = ${f},  [a, b] = ${iv(p.A, p.B)}\n`;
      if (p.kind === 'quad' || p.kind === 'cubic') {
        tr += 'f bir polinomdur: her yerde sürekli ve türevlenebilir → [a,b]\'de sürekli, (a,b)\'de türevlenebilir. ✓';
        en += 'f is a polynomial: continuous and differentiable everywhere → continuous on [a,b], differentiable on (a,b). ✓';
      } else if (p.kind === 'sqrt') {
        tr += `√x, [0, ∞) üzerinde süreklidir → [a,b]\'de sürekli. f\'(x) = ${fp} yalnızca x > 0 için tanımlıdır, yani (a,b) ⊂ (0,∞) üzerinde türevlenebilir (x = 0 uç nokta olsa bile sorun değil). ✓`;
        en += `√x is continuous on [0, ∞) → continuous on [a,b]. f'(x) = ${fp} exists for x > 0, so f is differentiable on (a,b) ⊂ (0,∞) (an endpoint at x = 0 is no problem). ✓`;
      } else if (p.kind === 'recip') {
        if (a.ok) {
          tr += `1/x, x ≠ 0 için sürekli ve türevlenebilirdir; ${iv(p.A, p.B)} aralığı 0'ı içermez. ✓`;
          en += `1/x is continuous and differentiable for x ≠ 0; the interval ${iv(p.A, p.B)} does not contain 0. ✓`;
        } else {
          tr += `f, x = 0'da TANIMSIZ ve ${iv(p.A, p.B)} aralığı 0'ı içeriyor → f, [a,b]'de SÜREKLİ DEĞİL (x = 0'da sonsuz süreksizlik). ✗\nSüreklilik koşulu bozulduğundan teorem uygulanamaz.`;
          en += `f is UNDEFINED at x = 0 and the interval ${iv(p.A, p.B)} contains 0 → f is NOT continuous on [a,b] (infinite discontinuity at x = 0). ✗\nThe continuity hypothesis fails, so the theorem does not apply.`;
        }
      } else {
        if (a.why === 'corner') {
          tr += `${fStr(p)} her yerde süreklidir ✓, fakat x = ${S(p.h)} ∈ (a,b) noktasında KÖŞE vardır: soldan türev −1, sağdan türev +1 → f, (a,b)'de TÜREVLENEBİLİR DEĞİL. ✗\nTürevlenebilirlik koşulu bozulduğundan teorem uygulanamaz.`;
          en += `${fStr(p)} is continuous everywhere ✓, but there is a CORNER at x = ${S(p.h)} ∈ (a,b): left derivative −1, right derivative +1 → f is NOT DIFFERENTIABLE on (a,b). ✗\nThe differentiability hypothesis fails, so the theorem does not apply.`;
        } else {
          tr += `${fStr(p)} süreklidir; köşe noktası x = ${S(p.h)}, (a,b) açık aralığında DEĞİL → (a,b)'de f doğrusaldır, türevlenebilir. ✓`;
          en += `${fStr(p)} is continuous; its corner x = ${S(p.h)} is NOT inside the open interval (a,b) → f is linear and differentiable on (a,b). ✓`;
        }
      }
      st.push(Tx(tr, en));
    }

    // 2) average slope
    if (a.m) {
      const fa = frS(a.fA), fb = frS(a.fB);
      const num = frSub(a.fB, a.fA);
      let tr = `── 2) Ortalama değişim hızı (kesen eğimi) ──\nf(${A}) = ${fa},  f(${B}) = ${fb}\nm = (f(b) − f(a)) / (b − a) = (${frP(a.fB)} − ${frP(a.fA)}) / (${S(p.B - p.A)}) = ${frS(num)} / ${p.B - p.A} = ${frS(a.m)}`;
      let en = `── 2) Average rate of change (secant slope) ──\nf(${A}) = ${fa},  f(${B}) = ${fb}\nm = (f(b) − f(a)) / (b − a) = (${frP(a.fB)} − ${frP(a.fA)}) / (${S(p.B - p.A)}) = ${frS(num)} / ${p.B - p.A} = ${frS(a.m)}`;
      if (rolle) {
        tr += `\nf(a) = f(b) olduğundan m = 0: bu, Rolle Teoremi'nin durumudur (aranan: f'(c) = 0).`;
        en += `\nBecause f(a) = f(b), m = 0: this is the case of Rolle's Theorem (we look for f'(c) = 0).`;
      }
      st.push(Tx(tr, en));
    } else {
      st.push(Tx(`── 2) Ortalama değişim hızı ──\nf(${A}) ve f(${B}) değerlerinden biri tanımsız olabilir ya da f aralıkta süreksizdir; m = (f(b) − f(a)) / (b − a) anlamlı bir kesen eğimi vermez.`,
        `── 2) Average rate of change ──\nf is undefined at an endpoint or discontinuous on the interval; m = (f(b) − f(a)) / (b − a) does not give a meaningful secant slope.`));
    }

    // 3) solve f'(x) = m
    {
      let tr, en;
      const mS = a.m ? frS(a.m) : '';
      if (a.why === 'jump') {
        tr = `── 3) f'(x) = m denklemi ──\nf'(x) = ${fp} her x ≠ 0 için NEGATİFTİR (f hiçbir yerde artmaz).\nOysa ${p.A < 0 && p.B > 0 ? `f(${B}) − f(${A}) = ${p.ka}/${p.B} + ${p.ka}/${-p.A} > 0, yani kesenin "eğimi" pozitif görünür` : 'f uç noktalardan birinde tanımsızdır'}; teğet hiçbir yerde kesene paralel olamaz.\nZaten koşul sağlanmadığı için teoremin bir c garanti etmesi beklenmez.`;
        en = `── 3) The equation f'(x) = m ──\nf'(x) = ${fp} is NEGATIVE for every x ≠ 0 (f never increases).\nYet ${p.A < 0 && p.B > 0 ? `f(${B}) − f(${A}) = ${p.ka}/${p.B} + ${p.ka}/${-p.A} > 0, so the "secant slope" looks positive` : 'f is undefined at one of the endpoints'}; no tangent can be parallel to the secant.\nSince the hypotheses fail, the theorem does not promise any c.`;
      } else if (a.why === 'corner') {
        tr = `── 3) f'(x) = m denklemi ──\nf'(x) = ±1 (x ≠ ${S(p.h)}); m = ${mS}, |m| < 1.\nf'(x) = ${mS} denkleminin ${ivo(p.A, p.B)} içinde ÇÖZÜMÜ YOK: türev yalnızca +1 ya da −1 değerini alır.`;
        en = `── 3) The equation f'(x) = m ──\nf'(x) = ±1 (x ≠ ${S(p.h)}); m = ${mS}, |m| < 1.\nf'(x) = ${mS} has NO SOLUTION in ${ivo(p.A, p.B)}: the derivative only takes the values +1 and −1.`;
      } else if (a.all) {
        tr = `── 3) f'(x) = m denklemini çöz ──\nf(x) = ${fStr(p)} bu aralıkta doğrusaldır: f'(x) = ${mS} = m (sabit). Denklem her x için sağlanır.`;
        en = `── 3) Solve f'(x) = m ──\nf(x) = ${fStr(p)} is linear on this interval: f'(x) = ${mS} = m (constant). The equation holds for every x.`;
      } else {
        const target = `f'(x) = ${rolle ? '0' : mS}`;
        tr = `── 3) ${target} denklemini çöz ──\nf'(x) = ${fp}\n`;
        en = `── 3) Solve ${target} ──\nf'(x) = ${fp}\n`;
        if (p.kind === 'quad') {
          tr += `${fp} = ${mS} → ${poly([[2 * p.al, 'x']])} = ${frS(frSub(a.m, fr(p.be)))} → x = ${a.cs[0].str}`;
          en += `${fp} = ${mS} → ${poly([[2 * p.al, 'x']])} = ${frS(frSub(a.m, fr(p.be)))} → x = ${a.cs[0].str}`;
        } else if (p.kind === 'cubic') {
          const cf = coefs(p);
          // 3 (x-h)^2 + e = f' ; f' = 3u^2 + e
          tr += `Merkez u = x ${p.h === 0 ? '' : p.h > 0 ? '− ' + p.h : '+ ' + (-p.h)} yazarsak f'(x) = 3u² ${p.e < 0 ? '− ' + (-p.e) : p.e > 0 ? '+ ' + p.e : ''}.\n3u² ${p.e < 0 ? '− ' + (-p.e) : p.e > 0 ? '+ ' + p.e : ''} = ${mS} → u² = ${frS(a.w)} → u = ${a.sq.fr && a.sq.num === 0 ? '0' : '±' + a.sq.str}\nx = ${p.h === 0 ? '' : S(p.h) + ' '}${a.sq.num === 0 ? '' : '± ' + a.sq.str}`;
          en += `With u = x ${p.h === 0 ? '' : p.h > 0 ? '− ' + p.h : '+ ' + (-p.h)} we get f'(x) = 3u² ${p.e < 0 ? '− ' + (-p.e) : p.e > 0 ? '+ ' + p.e : ''}.\n3u² ${p.e < 0 ? '− ' + (-p.e) : p.e > 0 ? '+ ' + p.e : ''} = ${mS} → u² = ${frS(a.w)} → u = ${a.sq.fr && a.sq.num === 0 ? '0' : '±' + a.sq.str}\nx = ${p.h === 0 ? '' : S(p.h) + ' '}${a.sq.num === 0 ? '' : '± ' + a.sq.str}`;
          void cf;
        } else if (p.kind === 'sqrt') {
          tr += `${fp} = ${mS} → √x = ${p.ka} / (2·${frP(a.m)}) = ${frS(fr(a.s + a.t, 2))} → x = (${frS(fr(a.s + a.t, 2))})² = ${a.cs[0].str}`;
          en += `${fp} = ${mS} → √x = ${p.ka} / (2·${frP(a.m)}) = ${frS(fr(a.s + a.t, 2))} → x = (${frS(fr(a.s + a.t, 2))})² = ${a.cs[0].str}`;
        } else {
          tr += `${fp} = ${mS} → x² = ${p.A * p.B} → x = ±${a.sq.str}`;
          en += `${fp} = ${mS} → x² = ${p.A * p.B} → x = ±${a.sq.str}`;
        }
      }
      st.push(Tx(tr, en));
    }

    // 4) pick solutions in (a,b)
    {
      let tr = `── 4) Çözümleri (a,b) = ${ivo(p.A, p.B)} içinde seç ──\n`, en = `── 4) Keep the solutions inside (a,b) = ${ivo(p.A, p.B)} ──\n`;
      if (!a.ok) {
        tr += 'Koşullar sağlanmadığı için teorem uygulanamaz; c bulunamaz (ve bulunmasını beklemeyiz).';
        en += 'The hypotheses fail, so the theorem does not apply; no c is found (and none is guaranteed).';
      } else if (a.all) {
        tr += `f doğrusal olduğundan (a,b) içindeki HER c değeri f'(c) = m koşulunu sağlar (ör. c = ${nf((p.A + p.B) / 2)}).`;
        en += `f is linear, so EVERY c in (a,b) satisfies f'(c) = m (e.g. c = ${nf((p.A + p.B) / 2)}).`;
      } else {
        // candidates before filtering (recompute for cubic/recip)
        let cand = [];
        if (p.kind === 'cubic') {
          const sq = a.sq; const mk = (sg) => (sq.fr ? frS(frAdd(fr(p.h), sg < 0 ? fr(-sq.fr.n, sq.fr.d) : sq.fr)) : (p.h === 0 ? (sg < 0 ? '−' : '') : S(p.h) + (sg < 0 ? ' − ' : ' + ')) + sq.str);
          const vals = sq.num === 0 ? [{ s: mk(1), n: p.h }] : [{ s: mk(-1), n: p.h - sq.num }, { s: mk(1), n: p.h + sq.num }];
          cand = vals;
        } else if (p.kind === 'recip') {
          const sq = a.sq; const sg = p.A > 0 ? 1 : -1;
          cand = [{ s: (sq.fr ? frS(sq.fr) : sq.str), n: sq.num }, { s: '−' + (sq.fr ? frS(sq.fr) : sq.str), n: -sq.num }];
          void sg;
        } else cand = [{ s: a.cs[0].str, n: a.cs[0].num }];
        cand.forEach((c) => {
          const inside = c.n > p.A + 1e-12 && c.n < p.B - 1e-12;
          const ineq = `${A} < ${nf(c.n)} < ${B}`;
          const approx = /√/.test(c.s) ? ' ≈ ' + nf(c.n) : '';
          tr += `x = ${c.s}${approx}:  ${inside ? 'aralığın İÇİNDE (' + ineq + ') ✓' : 'aralığın DIŞINDA ✗ (c olamaz)'}\n`;
          en += `x = ${c.s}${approx}:  ${inside ? 'INSIDE the interval (' + ineq + ') ✓' : 'OUTSIDE the interval ✗ (cannot be c)'}\n`;
        });
        tr += `→ c = ${a.cs.map((c) => c.str).join('  ve  c = ')}`;
        en += `→ c = ${a.cs.map((c) => c.str).join('  and  c = ')}`;
      }
      st.push(Tx(tr.trim(), en.trim()));
    }

    // 5) check / conclusion
    {
      let tr, en;
      if (!a.ok) {
        const eqEnds = a.why === 'corner' && a.fA && a.fB && a.fA.n === a.fB.n && a.fA.d === a.fB.d;
        tr = `── 5) Sonuç ──\n${a.why === 'jump' ? 'f, x = 0\'da süreksiz olduğundan' : 'f, x = ' + S(p.h) + '\'da türevlenebilir olmadığından'} ${thName} bu aralıkta UYGULANAMAZ ve eşitliği sağlayan bir c yoktur. Teorem "koşullar ⇒ sonuç" biçimindedir; koşullar bozulunca sonuç da bozulabilir.${eqEnds ? " Burada f(a) = f(b) olmasına rağmen f'(c) = 0 olan bir c yoktur: Rolle'nin türevlenebilirlik koşulu şarttır." : ''}`;
        en = `── 5) Conclusion ──\nSince ${a.why === 'jump' ? 'f is discontinuous at x = 0' : 'f is not differentiable at x = ' + S(p.h)}, the ${thName} does NOT apply on this interval and no c satisfies the equation. The theorem reads "hypotheses ⇒ conclusion"; when the hypotheses fail, the conclusion may fail too.${eqEnds ? " Here f(a) = f(b), yet no c has f'(c) = 0: the differentiability hypothesis of Rolle's theorem is essential." : ''}`;
      } else if (a.all) {
        tr = `── 5) Sonuç ──\nKoşullar sağlanıyor ve (a,b) içindeki her c için f'(c) = m = ${frS(a.m)} (teğet = kesen doğrunun kendisi).`;
        en = `── 5) Conclusion ──\nThe hypotheses hold and every c in (a,b) has f'(c) = m = ${frS(a.m)} (the tangent is the secant line itself).`;
      } else {
        const mm = frS(a.m);
        const cc = a.cs.map((c) => c.str).join(', ');
        const ver = a.cs.map((c) => {
          const d = fpNum(p, c.num);
          return `f'(${c.fr ? c.str : nf(c.num)}) ${isFinite(d) ? '= ' + (Math.abs(d - frNum(a.m)) < 1e-9 ? mm : nf(d)) : ''}`;
        }).join(';  ');
        tr = `── 5) Doğrulama ve sonuç ──\nc = ${cc}\nKontrol: ${ver}  ✓ (m = ${mm}).\nBu noktada teğet, kesene paraleldir${rolle ? ' (yatay: f\'(c) = 0)' : ''}. Yani anlık değişim hızı = ortalama değişim hızı = ${mm}.`;
        en = `── 5) Verification and conclusion ──\nc = ${cc}\nCheck: ${ver}  ✓ (m = ${mm}).\nAt this point the tangent is parallel to the secant${rolle ? ' (horizontal: f\'(c) = 0)' : ''}. So the instantaneous rate = the average rate = ${mm}.`;
      }
      st.push(Tx(tr, en));
    }
    return st;
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    try {
      const a = analyze(p);
      const wxl = (p.kind === 'recip' ? Math.min(p.A, 0) : p.A) - 1.5, wxh = (p.kind === 'recip' ? Math.max(p.B, 0) : p.B) + 1.5;
      const ys = [];
      for (let i = 0; i <= 200; i++) { const y = fNum(p, wxl + (wxh - wxl) * i / 200); if (isFinite(y)) ys.push(y); }
      [a.fA, a.fB].forEach((v) => { if (v) ys.push(frNum(v)); });
      ys.sort((u, v) => u - v);
      let lo = -3, hi = 3;
      if (ys.length > 4) { lo = ys[Math.floor(ys.length * 0.03)]; hi = ys[Math.ceil(ys.length * 0.97) - 1]; }
      if (p.kind === 'recip' && !a.ok) { lo = Math.max(lo, -8); hi = Math.min(hi, 8); }
      const endsLo = a.fA && a.fB ? Math.min(frNum(a.fA), frNum(a.fB)) : lo, endsHi = a.fA && a.fB ? Math.max(frNum(a.fA), frNum(a.fB)) : hi;
      lo = Math.min(lo, endsLo, 0); hi = Math.max(hi, endsHi, 0);
      const pad = Math.max(1, (hi - lo) * 0.18);
      canvas.setViewport(wxl, wxh, lo - pad, hi + pad);

      canvas.addFunction({ evaluator: (x) => fNum(p, x), color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addGuideLine({ axis: 'vertical', position: p.A, color: canvas.gray(), label: 'a = ' + nf(p.A) });
      canvas.addGuideLine({ axis: 'vertical', position: p.B, color: canvas.gray(), label: 'b = ' + nf(p.B) });
      if (p.kind === 'recip' && !a.ok) canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.red(), label: Tx('x = 0 (süreksiz)', 'x = 0 (discontinuity)') });

      if (a.m && a.fA && a.fB) {
        const fa = frNum(a.fA), m = frNum(a.m);
        canvas.addFunction({ evaluator: (x) => fa + m * (x - p.A), color: canvas.orange(), thickness: 2.5, label: Tx('kesen', 'secant') });
        canvas.addMarker({ x: p.A, y: fa, color: canvas.orange(), radius: 7, label: `(${nf(p.A)}, ${nf(fa)})` });
        canvas.addMarker({ x: p.B, y: frNum(a.fB), color: canvas.orange(), radius: 7, label: `(${nf(p.B)}, ${nf(frNum(a.fB))})` });
        if (p.showT && a.ok && !a.all) {
          const hw = (wxh - wxl) * 0.12;
          a.cs.forEach((c) => {
            const cy = fNum(p, c.num);
            if (!isFinite(cy)) return;
            canvas.addSegment({ x1: c.num - hw, y1: cy - m * hw, x2: c.num + hw, y2: cy + m * hw, color: canvas.gold(), thickness: 2, dashed: true });
            canvas.addMarker({ x: c.num, y: cy, color: canvas.gold(), shape: 'diamond', radius: 8, label: `c = ${nf(c.num)}` });
          });
        }
      }
      if (p.kind === 'abs' && a.why === 'corner') canvas.addMarker({ x: p.h, y: 0, color: canvas.red(), radius: 6, hollow: true, label: Tx('köşe: türev yok', 'corner: no derivative') });
      // moving tangent
      const x0 = Math.max(p.A, Math.min(p.B, p.x0)), y0 = fNum(p, x0), s0 = fpNum(p, x0);
      if (isFinite(y0) && isFinite(s0)) {
        const hw = (wxh - wxl) * 0.12;
        canvas.addSegment({ x1: x0 - hw, y1: y0 - s0 * hw, x2: x0 + hw, y2: y0 + s0 * hw, color: canvas.blue(), thickness: 2 });
        canvas.addMarker({ x: x0, y: y0, color: canvas.blue(), radius: 5, label: `f'(${nf(x0)}) = ${nf(s0)}${a.m ? ',  m = ' + nf(frNum(a.m)) : ''}` });
      }
    } catch (e) { /* never throw */ }
  }

  function snapSquare(v) { const r = Math.max(0, Math.round(Math.sqrt(Math.max(0, v)))); return r * r; }

  function buildControls(rightCol, getProblem, h) {
    const clampX0 = (p) => { p.x0 = Math.max(p.A, Math.min(p.B, p.x0)); };
    h.addSlider({
      caption: Tx('Sol uç nokta a', 'Left endpoint a'),
      min: -6, max: 16, step: 1,
      get: () => getProblem().A,
      set: (v) => {
        const p = getProblem(); let A = Math.round(v);
        if (p.kind === 'sqrt') { A = snapSquare(A); if (A >= p.B) A = Math.max(0, Math.pow(Math.round(Math.sqrt(p.B)) - 1, 2)); }
        else if (A >= p.B) A = p.B - 1;
        p.A = A; clampX0(p);
      },
    });
    h.addSlider({
      caption: Tx('Sağ uç nokta b', 'Right endpoint b'),
      min: -6, max: 16, step: 1,
      get: () => getProblem().B,
      set: (v) => {
        const p = getProblem(); let B = Math.round(v);
        if (p.kind === 'sqrt') { B = snapSquare(B); if (B <= p.A) B = Math.pow(Math.round(Math.sqrt(p.A)) + 1, 2); }
        else if (B <= p.A) B = p.A + 1;
        p.B = B; clampX0(p);
      },
    });
    h.addSlider({
      caption: Tx('Hareketli teğetin konumu x₀ (mavi)', 'Moving tangent position x₀ (blue)'),
      min: -6, max: 16, step: 0.1,
      get: () => { const p = getProblem(); return Math.max(p.A, Math.min(p.B, p.x0)); },
      set: (v) => { const p = getProblem(); p.x0 = Math.max(p.A, Math.min(p.B, v)); },
    });
    h.addCheckbox({
      caption: Tx('c noktalarını ve paralel teğetleri göster', 'Show the points c and the parallel tangents'),
      get: () => getProblem().showT,
      set: (v) => { getProblem().showT = !!v; },
    });
  }

  Topics.register('applications', {
    id: 'meanValueTheorem',
    tabTitle: () => Tx('Ortalama Değer Teoremi ve Rolle', "Mean Value Theorem & Rolle's Theorem"),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*(ROLLE TEOREMİ \(özel durum\)|ROLLE'S THEOREM \(special case\))$/, make: (rng) => createProblem(rng, 4) },
      { match: /^\s*(ORTALAMA DEĞER TEOREMİ \(OVT\)|MEAN VALUE THEOREM \(MVT\))$/, make: (rng) => createProblem(rng, 0) },
      { match: /^\s*• \[a,b\]'de süreklilik|^\s*• Continuity on \[a,b\]/, make: (rng) => createProblem(rng, 7) },
      { match: /^\s*• \(a,b\)'de türevlenebilirlik|^\s*• Differentiability on \(a,b\)/, make: (rng) => createProblem(rng, 8) },
      { match: /^\s*• (Parabolde|For a parabola)/, make: (rng) => createProblem(rng, 0) },
      { match: /^\s*• (Üçüncü derecede|A cubic can)/, make: (rng) => createProblem(rng, 2) },
      { match: /^\s*• (c tek olmak|c need not)/, make: (rng) => createProblem(rng, 3) },
      { match: /^\s*• (f lineer ise|If f is linear)/, make: (rng) => createProblem(rng, 'linear') },
      { match: /^\s*• (Koşullar bozulursa|If the conditions fail)/, make: (rng) => createProblem(rng, 7) },
      { match: /^\s*• (c'yi her zaman orta|Do not always look)/, make: (rng) => createProblem(rng, 5) },
    ],
  });
})();
