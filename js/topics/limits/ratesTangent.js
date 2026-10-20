// Rates of Change and Tangent Lines to Curves (chapter 'limits').
// problem = { kind: 'quad'|'cube'|'recip'|'sqrt'|'vel', a, cp, cq, dt, hExp, side, hMax, showNormal }
//   quad: f(x) = cp x^2 + cq x      cube: f(x) = x^3       recip: f(x) = 1/x       sqrt: f(x) = sqrt(x)
//   vel : s(t) = cp t^2 + cq t  (free fall cp=5,cq=0 or projectile cp=-5,cq=v0; metres / seconds)
// The slider moves h = side * hMax * 10^(-hExp) towards 0; the secant through (a,f(a)),(a+h,f(a+h)) is drawn.
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
  const frAdd = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
  const frMul = (x, y) => fr(x.n * y.n, x.d * y.d);
  const frNeg = (x) => fr(-x.n, x.d);
  const frInv = (x) => fr(x.d, x.n);
  const frVal = (x) => x.n / x.d;
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function frS(x) { return x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d; }
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
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
  // line  y = m x + c  (m, c fractions)
  function lineS(m, c) {
    let s = 'y = ';
    let body = '';
    if (m.n !== 0) {
      if (m.d === 1 && m.n === 1) body = 'x';
      else if (m.d === 1 && m.n === -1) body = '−x';
      else if (m.d === 1) body = S(m.n) + 'x';
      else body = '(' + frS(m) + ')x';
    }
    if (body === '') return s + frS(c);
    if (c.n === 0) return s + body;
    return s + body + (c.n < 0 ? ' − ' : ' + ') + frS(fr(Math.abs(c.n), c.d));
  }

  // ---------- model ----------
  function F(p, x) {
    let y;
    switch (p.kind) {
      case 'cube': y = x * x * x; break;
      case 'recip': y = x === 0 ? NaN : 1 / x; break;
      case 'sqrt': y = x < 0 ? NaN : Math.sqrt(x); break;
      default: y = p.cp * x * x + p.cq * x;
    }
    return (isFinite(y) && Math.abs(y) < 1e5) ? y : NaN;
  }
  const isVel = (p) => p.kind === 'vel';
  const vname = (p) => (isVel(p) ? 't' : 'x');
  const fname = (p) => (isVel(p) ? 's' : 'f');
  function fStr(p) {
    switch (p.kind) {
      case 'cube': return 'x³';
      case 'recip': return '1/x';
      case 'sqrt': return '√x';
      case 'vel': return poly([[p.cq, 't'], [p.cp, 't²']]);
      default: return poly([[p.cp, 'x²'], [p.cq, 'x']]);
    }
  }
  function sqrtA(p) { return Math.round(Math.sqrt(p.a)); }
  function slopeFr(p) {
    const a = p.a;
    switch (p.kind) {
      case 'cube': return fr(3 * a * a);
      case 'recip': return fr(-1, a * a);
      case 'sqrt': return fr(1, 2 * sqrtA(p));
      default: return fr(2 * p.cp * a + p.cq);
    }
  }
  function valFr(p) {
    const a = p.a;
    switch (p.kind) {
      case 'cube': return fr(a * a * a);
      case 'recip': return fr(1, a);
      case 'sqrt': return fr(sqrtA(p));
      default: return fr(p.cp * a * a + p.cq * a);
    }
  }
  function hOf(p) {
    const h = p.side * p.hMax * Math.pow(10, -p.hExp);
    return Math.abs(h) < 1e-9 ? p.side * 1e-9 : h;
  }
  function secant(p, h) { return (F(p, p.a + h) - F(p, p.a)) / h; }

  function createProblem(rng) { return genR(rng, rng.nextInt(0, 12)); }
  function genR(rng, r) {
    const p = { hExp: 0.3, side: 1, hMax: 2, showNormal: true, dt: 1, cp: 1, cq: 0 };
    if (r <= 1) { // x^2
      p.kind = 'quad'; p.a = rng.nextInt(-3, 4);
    } else if (r === 2 || r === 3) { // general quadratic
      p.kind = 'quad'; p.cp = rng.nonZeroInt(-3, 3); p.cq = rng.nonZeroInt(-4, 4); p.a = rng.nextInt(-3, 4);
    } else if (r === 4) { // quadratic, horizontal tangent at the vertex
      p.kind = 'quad'; p.cp = rng.nonZeroInt(-3, 3); p.a = rng.nonZeroInt(-3, 3); p.cq = -2 * p.cp * p.a;
    } else if (r === 5 || r === 6) {
      p.kind = 'cube'; p.a = rng.nextInt(-2, 3);
    } else if (r === 7 || r === 8) {
      p.kind = 'recip'; p.a = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]); p.hMax = Math.min(2, Math.abs(p.a) / 2);
    } else if (r === 9) {
      p.kind = 'sqrt'; p.a = rng.pick([1, 4, 9, 16]); p.hMax = Math.min(2, p.a / 2);
    } else if (r === 10) { // free fall
      p.kind = 'vel'; p.cp = 5; p.cq = 0; p.a = rng.nextInt(1, 5); p.dt = rng.pick([1, 2]); p.hMax = Math.min(2, p.a / 2);
    } else { // projectile
      p.kind = 'vel'; p.cp = -5; p.cq = rng.pick([20, 30, 40]); p.a = rng.nextInt(1, p.cq / 10 + 1); p.dt = rng.pick([1, 2]); p.hMax = Math.min(2, p.a / 2);
    }
    return p;
  }

  // average over [a, a+dt] for the quadratic family (exact)
  function avgQuad(p) { return 2 * p.cp * p.a + p.cq + p.cp * p.dt; }

  function problemStatement(p) {
    const A = S(p.a);
    if (isVel(p)) {
      const what = p.cp > 0
        ? Tx('Bir cisim durgun halden serbest bırakılıyor', 'An object is dropped from rest')
        : Tx('Bir cisim yukarı fırlatılıyor', 'An object is thrown upward');
      const what2 = p.cp > 0 ? 'An object is dropped from rest' : 'An object is thrown upward';
      return Tx(
        `${what}; konumu s(t) = ${fStr(p)} (s metre, t saniye). [${A}, ${p.a + p.dt}] s aralığındaki ortalama hızı ve t = ${A} s anındaki anlık hızı (birimiyle) bulalım.`,
        `${what2}; its position is s(t) = ${fStr(p)} (s in metres, t in seconds). Let's find the average velocity on [${A}, ${p.a + p.dt}] s and the instantaneous velocity at t = ${A} s (with units).`);
    }
    return Tx(
      `f(x) = ${fStr(p)} için [${A}, ${A}+h] aralığındaki ortalama değişim hızını (kesen eğimini) h cinsinden yazalım; limitle x = ${A} noktasındaki teğet eğimini bulalım, sonra teğet ve normal doğrunun denklemlerini yazalım.`,
      `For f(x) = ${fStr(p)}, let's write the average rate of change (secant slope) on [${A}, ${A}+h] in terms of h; then use a limit to find the tangent slope at x = ${A} and write the equations of the tangent and normal lines.`);
  }

  function concept() {
    return Tx(
      "DEĞİŞİM HIZI VE TEĞET DOĞRU: Bir fonksiyonun bir noktada 'ne kadar hızlı değiştiğini' ölçmek limitin ilk büyük uygulamasıdır.\n" +
      "\n" +
      "ORTALAMA DEĞİŞİM HIZI: y = f(x) için [a, a+h] aralığında\n" +
      "   Δy/Δx = (f(a+h) − f(a)) / h\n" +
      "Bu, grafikteki P(a, f(a)) ve Q(a+h, f(a+h)) noktalarından geçen KESEN doğrunun eğimidir. Konum s(t) ise ortalama hız = Δs/Δt (birim: m/s).\n" +
      "\n" +
      "ANLIK DEĞİŞİM HIZI (TEĞET EĞİMİ): Q noktasını P'ye yaklaştırırsak (h → 0) kesenler bir sınır doğruya, TEĞETE yaklaşır:\n" +
      "   m = lim(h→0) (f(a+h) − f(a)) / h\n" +
      "Limit varsa m teğetin eğimi ve x = a'daki anlık değişim hızıdır. Konum için m = anlık hız (hız göstergesindeki değer). h hem pozitif (sağdan) hem negatif (soldan) yaklaşabilir; iki taraf aynı değere gitmelidir.\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) f(a) ve f(a+h) değerleri yazılır.\n" +
      "   (2) Fark oranı (f(a+h) − f(a))/h kurulur; h sadeleşebilsin diye pay açılır/çarpanlara ayrılır.\n" +
      "       - Polinomlarda (a+h)² = a² + 2ah + h² açılımı kullanılır, a'lı terimler sadeleşir, pay h'ın katı olur.\n" +
      "       - 1/x için ortak paydaya getirilir: 1/(a+h) − 1/a = −h / (a(a+h)).\n" +
      "       - √x için eşlenik ile çarpılır: (√(a+h) − √a)·(√(a+h) + √a) = h.\n" +
      "   (3) h sadeleştirilir (h ≠ 0 olduğu için rahatça yapılabilir).\n" +
      "   (4) h → 0 alınarak m bulunur (artık doğrudan yerine koyabiliriz).\n" +
      "   (5) Teğet: y − f(a) = m(x − a) olarak yazılır.\n" +
      "   (6) Normal (teğete dik) doğrunun eğimi −1/m olur, yani y − f(a) = −(1/m)(x − a).\n" +
      "\n" +
      "ÖZEL DURUMLAR:\n" +
      "   - m = 0: teğet yatay, y = f(a); normal doğru dikey, x = a (eğimi tanımsız).\n" +
      "   - Teğet dikey (limit ±∞) ise eğim yoktur; bu bölümde ele alınmayan bir durumdur.\n" +
      "   - Kesen eğimi h = 0'da tanımsızdır (0/0); işte bu yüzden limite ihtiyaç vardır.\n" +
      "\n" +
      "SIK HATALAR:\n" +
      "   - h sadeleşmeden h = 0 yazmak (0/0 çıkar).\n" +
      "   - (a+h)² = a² + h² yazmak; doğrusu a² + 2ah + h² olmalıdır.\n" +
      "   - Normal eğimini 1/m ya da −m almak; doğrusu −1/m olur.\n" +
      "   - Ortalama hız ile anlık hızı karıştırmak: biri aralık, diğeri an içindir.\n" +
      "   - Birimi unutmak: hız m/s ile ölçülür.\n" +
      "\n" +
      "MİNİ ÖRNEK: f(x) = x², a = 3. Fark oranı: ((3+h)² − 9)/h = (6h + h²)/h = 6 + h. h → 0 ⇒ m = 6. Teğet: y − 9 = 6(x − 3) ⇒ y = 6x − 9. Normal: y − 9 = −(1/6)(x − 3). h = 1 için kesen eğimi 7, h = 0,1 için 6,1: 6'ya yaklaşıyor.\n" +
      "\n" +
      "BAĞLANTI: m = lim(h→0)(f(a+h) − f(a))/h ifadesi f'(a) türevinin tanımıdır. Türev bölümü bunu kurallarla hızlandırır; burada amacımız kavramı limitle görmektir.",
      "RATES OF CHANGE AND TANGENT LINES: measuring 'how fast a function changes' at one point is the first big application of limits.\n" +
      "\n" +
      "AVERAGE RATE OF CHANGE: for y = f(x) on [a, a+h]\n" +
      "   Δy/Δx = (f(a+h) − f(a)) / h\n" +
      "This is the slope of the SECANT line through P(a, f(a)) and Q(a+h, f(a+h)). For a position s(t) it is the average velocity Δs/Δt (units: m/s).\n" +
      "\n" +
      "INSTANTANEOUS RATE (TANGENT SLOPE): if we slide Q towards P (h → 0), the secants approach a limiting line, the TANGENT:\n" +
      "   m = lim(h→0) (f(a+h) − f(a)) / h\n" +
      "If the limit exists, m is the slope of the tangent and the instantaneous rate of change at x = a. For position, m is the instantaneous velocity (the speedometer reading). h may approach from the right (h > 0) or the left (h < 0); both must give the same value.\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) We write f(a) and f(a+h).\n" +
      "   (2) We form the difference quotient (f(a+h) − f(a))/h and expand/factor the numerator so h can cancel.\n" +
      "       - Polynomials: (a+h)² = a² + 2ah + h²; the a-terms cancel and the numerator is a multiple of h.\n" +
      "       - 1/x: common denominator: 1/(a+h) − 1/a = −h / (a(a+h)).\n" +
      "       - √x: multiply by the conjugate: (√(a+h) − √a)(√(a+h) + √a) = h.\n" +
      "   (3) We cancel h (fine, because h ≠ 0 inside the limit).\n" +
      "   (4) Letting h → 0 gives m (now plain substitution works).\n" +
      "   (5) The tangent is y − f(a) = m(x − a).\n" +
      "   (6) The normal (perpendicular) line has slope −1/m, i.e. y − f(a) = −(1/m)(x − a).\n" +
      "\n" +
      "SPECIAL CASES:\n" +
      "   - m = 0: the tangent is horizontal, y = f(a); the normal is vertical, x = a (slope undefined).\n" +
      "   - A vertical tangent (limit ±∞) has no slope; we do not treat it in this section.\n" +
      "   - The secant slope is undefined at h = 0 (0/0); that is exactly why a limit is needed.\n" +
      "\n" +
      "COMMON PITFALLS:\n" +
      "   - Substituting h = 0 before cancelling h (gives 0/0).\n" +
      "   - Writing (a+h)² = a² + h²; the correct expansion is a² + 2ah + h².\n" +
      "   - Using 1/m or −m for the normal slope; it is −1/m.\n" +
      "   - Mixing up average velocity (over an interval) and instantaneous velocity (at a moment).\n" +
      "   - Forgetting units: velocity is in m/s.\n" +
      "\n" +
      "MINI EXAMPLE: f(x) = x², a = 3. Difference quotient: ((3+h)² − 9)/h = (6h + h²)/h = 6 + h. As h → 0, m = 6. Tangent: y − 9 = 6(x − 3) ⇒ y = 6x − 9. Normal: y − 9 = −(1/6)(x − 3). For h = 1 the secant slope is 7, for h = 0.1 it is 6.1: approaching 6.\n" +
      "\n" +
      "LINK: m = lim(h→0)(f(a+h) − f(a))/h is the definition of the derivative f'(a). The Derivatives chapter speeds this up with rules; here our goal is to see the concept through limits.");
  }

  // algebra lines of the difference quotient
  function algebra(p) {
    const a = p.a, A = P(a), v = vname(p), F_ = fname(p);
    const L = [];
    switch (p.kind) {
      case 'cube': {
        L.push(`${F_}(${S(a)}+h) − ${F_}(${S(a)}) = (${a < 0 ? '(' + S(a) + ')' : S(a)}+h)³ − ${A}³`);
        L.push(`= ${poly([[3 * a * a, 'h'], [3 * a, 'h²'], [1, 'h³']])}    [(a+h)³ = a³ + 3a²h + 3ah² + h³]`);
        L.push(`${Tx('Fark oranı', 'Difference quotient')} = ${poly([[3 * a * a, ''], [3 * a, 'h'], [1, 'h²']])}`);
        break;
      }
      case 'recip': {
        L.push(`1/(${S(a)}+h) − 1/${A} = (${A} − (${S(a)}+h)) / (${A}(${S(a)}+h)) = −h / (${A}(${S(a)}+h))`);
        L.push(`${Tx('Fark oranı', 'Difference quotient')} = −h/(${A}(${S(a)}+h)) ÷ h = −1 / (${A}(${S(a)}+h))    (h ≠ 0, h ≠ ${S(-a)})`);
        break;
      }
      case 'sqrt': {
        const r = sqrtA(p);
        L.push(`(√(${a}+h) − √${a}) / h  ·  (√(${a}+h) + √${a}) / (√(${a}+h) + √${a})`);
        L.push(`= ((${a}+h) − ${a}) / (h (√(${a}+h) + ${r})) = h / (h (√(${a}+h) + ${r}))`);
        L.push(`${Tx('Fark oranı', 'Difference quotient')} = 1 / (√(${a}+h) + ${r})`);
        break;
      }
      default: { // quad family
        const cp = p.cp, cq = p.cq;
        const first = `${F_}(${S(a)}+h) − ${F_}(${S(a)}) = ${P(cp)}[(${S(a)}+h)² − ${A}²]` + (cq !== 0 ? ` + ${P(cq)}[(${S(a)}+h) − ${A}]` : '');
        L.push(first);
        L.push(`= ${P(cp)}(${poly([[2 * a, 'h'], [1, 'h²']])})` + (cq !== 0 ? ` + ${P(cq)}h` : '') + `    [(a+h)² − a² = 2ah + h²]`);
        L.push(`= ${poly([[2 * cp * a + cq, 'h'], [cp, 'h²']])}`);
        L.push(`${Tx('Fark oranı', 'Difference quotient')} = ${poly([[2 * cp * a + cq, ''], [cp, 'h']])}`);
      }
    }
    return L;
  }
  function dqClosed(p) { // closed-form expression text
    const a = p.a;
    switch (p.kind) {
      case 'cube': return poly([[3 * a * a, ''], [3 * a, 'h'], [1, 'h²']]);
      case 'recip': return `−1/(${P(a)}(${S(a)}+h))`;
      case 'sqrt': return `1/(√(${a}+h) + ${sqrtA(p)})`;
      default: return poly([[2 * p.cp * a + p.cq, ''], [p.cp, 'h']]);
    }
  }
  function dqNum(p, h) { // from the simplified closed form (independent of F)
    const a = p.a;
    switch (p.kind) {
      case 'cube': return 3 * a * a + 3 * a * h + h * h;
      case 'recip': return -1 / (a * (a + h));
      case 'sqrt': return 1 / (Math.sqrt(a + h) + Math.sqrt(a));
      default: return 2 * p.cp * a + p.cq + p.cp * h;
    }
  }

  function solveSteps(p) {
    const a = p.a, A = S(a), v = vname(p), F_ = fname(p), u = isVel(p);
    const steps = [];
    const fa = valFr(p), m = slopeFr(p);
    const h = hOf(p);
    // 1
    steps.push(Tx(`── 1) Verilenler ──\n${F_}(${v}) = ${fStr(p)},  ${v} = ${A}\n${F_}(${A}) = ${frS(fa)}${u ? ' m' : ''}   ⇒ P(${A}, ${frS(fa)})`,
      `── 1) Given ──\n${F_}(${v}) = ${fStr(p)},  ${v} = ${A}\n${F_}(${A}) = ${frS(fa)}${u ? ' m' : ''}   ⇒ P(${A}, ${frS(fa)})`));
    // 2
    if (u) {
      const avg = avgQuad(p);
      steps.push(Tx(
        `── 2) Ortalama hız [${A}, ${a + p.dt}] ──\ns(${A}) = ${frS(fa)} m,  s(${a + p.dt}) = ${S(p.cp * (a + p.dt) * (a + p.dt) + p.cq * (a + p.dt))} m\nΔs/Δt = (${S(p.cp * (a + p.dt) * (a + p.dt) + p.cq * (a + p.dt))} − ${P(fa.n)}) / ${p.dt} = ${S(avg)} m/s`,
        `── 2) Average velocity on [${A}, ${a + p.dt}] ──\ns(${A}) = ${frS(fa)} m,  s(${a + p.dt}) = ${S(p.cp * (a + p.dt) * (a + p.dt) + p.cq * (a + p.dt))} m\nΔs/Δt = (${S(p.cp * (a + p.dt) * (a + p.dt) + p.cq * (a + p.dt))} − ${P(fa.n)}) / ${p.dt} = ${S(avg)} m/s`));
    }
    steps.push(Tx(`── ${u ? 3 : 2}) Fark oranı (ortalama değişim hızı) ──\nh cinsinden:\n${algebra(p).join('\n')}`,
      `── ${u ? 3 : 2}) Difference quotient (average rate of change) ──\nIn terms of h:\n${algebra(p).join('\n')}`));
    // slider state
    const sq = secant(p, h);
    const Q = a + h;
    steps.push(Tx(
      `── ${u ? 4 : 3}) Kaydırıcı: h = ${nf(h, 4)} ──\nQ(${nf(Q, 4)}, ${nf(F(p, Q), 4)}), kesen eğimi = ${nf(sq, 4)}${u ? ' m/s' : ''}\n(kapalı formdan: ${nf(dqNum(p, h), 4)})`,
      `── ${u ? 4 : 3}) Slider: h = ${nf(h, 4)} ──\nQ(${nf(Q, 4)}, ${nf(F(p, Q), 4)}), secant slope = ${nf(sq, 4)}${u ? ' m/s' : ''}\n(from the closed form: ${nf(dqNum(p, h), 4)})`));
    // table
    const hs = [0.5, 0.1, 0.01, 0.001];
    const rowR = hs.map((x) => `h = ${nf(x, 3)}: ${nf(secant(p, x), 4)}`).join('   |   ');
    const rowL = hs.map((x) => `h = ${nf(-x, 3)}: ${nf(secant(p, -x), 4)}`).join('   |   ');
    steps.push(Tx(
      `── ${u ? 5 : 4}) Sayısal tablo (kesen eğimleri) ──\nSağdan (h → 0⁺):  ${rowR}\nSoldan (h → 0⁻):  ${rowL}\nİki taraf da ${nf(frVal(m), 4)} değerine yaklaşıyor.`,
      `── ${u ? 5 : 4}) Numerical table (secant slopes) ──\nFrom the right (h → 0⁺):  ${rowR}\nFrom the left (h → 0⁻):  ${rowL}\nBoth sides approach ${nf(frVal(m), 4)}.`));
    // limit
    let lim;
    switch (p.kind) {
      case 'cube': lim = `lim(h→0) ${dqClosed(p)} = ${frS(m)}`; break;
      case 'recip': lim = `lim(h→0) ${dqClosed(p)} = −1/(${P(a)}·${P(a)}) = ${frS(m)}`; break;
      case 'sqrt': lim = `lim(h→0) ${dqClosed(p)} = 1/(${sqrtA(p)} + ${sqrtA(p)}) = ${frS(m)}`; break;
      default: lim = `lim(h→0) (${dqClosed(p)}) = ${frS(m)}`;
    }
    const n6 = u ? 6 : 5;
    steps.push(Tx(`── ${n6}) Limit: ${u ? 'anlık hız' : 'teğet eğimi'} ──\nm = ${lim}${u ? ' m/s' : ''}\n(h sadeleştikten sonra h → 0 için doğrudan yerine koyabiliriz.)`,
      `── ${n6}) Limit: ${u ? 'instantaneous velocity' : 'tangent slope'} ──\nm = ${lim}${u ? ' m/s' : ''}\n(After cancelling h, h → 0 is plain substitution.)`));
    // tangent
    const c = frAdd(fa, frNeg(frMul(m, fr(a))));
    steps.push(Tx(`── ${n6 + 1}) Teğet doğru ──\ny − ${frS(fa)} = ${frS(m)}(x − ${P(a)})  ⇒  ${lineS(m, c)}`,
      `── ${n6 + 1}) Tangent line ──\ny − ${frS(fa)} = ${frS(m)}(x − ${P(a)})  ⇒  ${lineS(m, c)}`));
    if (u) {
      if (m.n === 0) {
        steps.push(Tx(`── ${n6 + 2}) Yorum ──\nt = ${A} s anında hız 0 m/s: cisim bir an durur (yükseklik en büyük). Teğet yataydır.`,
          `── ${n6 + 2}) Interpretation ──\nAt t = ${A} s the velocity is 0 m/s: the object momentarily stops (maximum height). The tangent is horizontal.`));
      } else {
        steps.push(Tx(`── ${n6 + 2}) Yorum ──\nOrtalama hız ${S(avgQuad(p))} m/s (bir aralık için), anlık hız ${frS(m)} m/s (bir an için). ${m.n > 0 ? 'Cisim yukarı/ileri' : 'Cisim aşağı'} hareket ediyor.\nAnlık değişim hızı türevdir; ayrıntısı Türev bölümünde görülür.`,
          `── ${n6 + 2}) Interpretation ──\nAverage velocity ${S(avgQuad(p))} m/s (over an interval), instantaneous velocity ${frS(m)} m/s (at one moment). The object moves ${m.n > 0 ? 'upward/forward' : 'downward'}.\nThe instantaneous rate is the derivative; the Derivatives chapter covers it.`));
      }
    } else if (m.n === 0) {
      steps.push(Tx(`── ${n6 + 2}) Normal doğru ──\nm = 0 ⇒ teğet yatay (y = ${frS(fa)}). Teğete dik doğru dikeydir: x = ${A} (eğimi tanımsız).`,
        `── ${n6 + 2}) Normal line ──\nm = 0 ⇒ the tangent is horizontal (y = ${frS(fa)}). The perpendicular line is vertical: x = ${A} (slope undefined).`));
    } else {
      const mn = frNeg(frInv(m));
      const cn = frAdd(fa, frNeg(frMul(mn, fr(a))));
      steps.push(Tx(`── ${n6 + 2}) Normal doğru ──\nEğim = −1/m = ${frS(mn)}\ny − ${frS(fa)} = ${frS(mn)}(x − ${P(a)})  ⇒  ${lineS(mn, cn)}`,
        `── ${n6 + 2}) Normal line ──\nSlope = −1/m = ${frS(mn)}\ny − ${frS(fa)} = ${frS(mn)}(x − ${P(a)})  ⇒  ${lineS(mn, cn)}`));
    }
    return steps;
  }

  function draw(canvas, p) {
    try {
      const a = p.a, m = frVal(slopeFr(p)), fa = frVal(valFr(p));
      let cw = 600, ch = 400;
      try { if (canvas.canvas && canvas.canvas.clientWidth > 50) { cw = canvas.canvas.clientWidth; ch = canvas.canvas.clientHeight; } } catch (e) { /* stub */ }
      const ar = Math.max(0.4, Math.min(1, ch / cw));
      const w = 3;
      const xMin = a - w, xMax = a + w;
      const yh = Math.abs(m) <= 3 ? w * ar : Math.min(Math.abs(m) * w * 0.8, 50);
      const yMin = fa - yh, yMax = fa + yh;
      canvas.setViewport(xMin, xMax, yMin, yMax);
      const h = hOf(p);
      const ev = (x) => F(p, x);
      canvas.addFunction({ evaluator: ev, color: canvas.accent(), thickness: 2.5, label: `${fname(p)}(${vname(p)}) = ${fStr(p)}` });
      // tangent
      canvas.addSegment({ x1: xMin, y1: fa + m * (xMin - a), x2: xMax, y2: fa + m * (xMax - a), color: canvas.green(), thickness: 2, dashed: true });
      // normal
      if (!isVel(p) && p.showNormal) {
        if (m === 0) canvas.addSegment({ x1: a, y1: yMin, x2: a, y2: yMax, color: canvas.blue(), thickness: 1.5, dashed: true });
        else {
          const mn = -1 / m;
          canvas.addSegment({ x1: xMin, y1: fa + mn * (xMin - a), x2: xMax, y2: fa + mn * (xMax - a), color: canvas.blue(), thickness: 1.5, dashed: true });
        }
      }
      // secant + Q
      const yq = F(p, a + h);
      if (isFinite(yq)) {
        const sl = (yq - fa) / h;
        canvas.addSegment({ x1: xMin, y1: fa + sl * (xMin - a), x2: xMax, y2: fa + sl * (xMax - a), color: canvas.orange(), thickness: 2 });
        canvas.addMarker({ x: a + h, y: yq, color: canvas.orange(), radius: 5, label: 'Q' });
      }
      canvas.addMarker({ x: a, y: fa, color: canvas.gold(), radius: 6, label: `P(${nf(a, 2)}, ${nf(fa, 2)})` });
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, hp) {
    hp.addSlider({
      caption: Tx('h → 0 (kesen Q noktası P\'ye yaklaşır)', 'h → 0 (secant point Q slides towards P)'),
      min: 0, max: 3, step: 0.05,
      get: () => getProblem().hExp,
      set: (v) => { getProblem().hExp = Math.max(0, Math.min(3, v)); },
    });
    hp.addRadioGroup({
      name: 'ratesTangentSide',
      options: [{ label: Tx('Sağdan (h > 0)', 'From the right (h > 0)'), value: 1 }, { label: Tx('Soldan (h < 0)', 'From the left (h < 0)'), value: -1 }],
      get: () => getProblem().side,
      set: (v) => { getProblem().side = Number(v) < 0 ? -1 : 1; },
    });
    hp.addCheckbox({
      caption: Tx('Normal doğruyu göster', 'Show the normal line'),
      get: () => getProblem().showNormal,
      set: (v) => { getProblem().showNormal = !!v; },
    });
  }

  Topics.register('limits', {
    id: 'ratesTangent',
    tabTitle: () => Tx('Değişim Hızı ve Teğet Doğru', 'Rates of Change & Tangent Lines'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => ({ x: p.a, y: frVal(valFr(p)) }),
    buildControls,
    links: [
      { match: /^(Bu, grafikteki|This is the slope of the SECANT)/, make: (rng) => genR(rng, rng.pick([10, 11])) },
      { match: /^\s*- (Polinomlarda|Polynomials)/, make: (rng) => genR(rng, rng.pick([0, 2, 3, 5, 6])) },
      { match: /^\s*- 1\/x/, make: (rng) => genR(rng, rng.pick([7, 8])) },
      { match: /^\s*- √x/, make: (rng) => genR(rng, 9) },
      { match: /^\s*- m = 0:/, make: (rng) => genR(rng, 4) },
    ],
  });
})();
