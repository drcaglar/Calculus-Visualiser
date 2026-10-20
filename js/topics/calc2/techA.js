// Calculus II - techniques of integration, part A: integration by parts ('parts') and trigonometric integrals ('trigInt').
// Both tabs show definite integrals whose exact value is built from a term list [[coef, symbol, numeric value], ...];
// createProblem / solveSteps compare that exact value with a Simpson integration, so a wrong closed form cannot ship.
// Quiz generators are pushed into window.Calc2Quiz (registered later by quizBank.js).
(function () {
  const K = Calc2, tx = K.tx, N2 = K.N2, safe = K.safe, simpson = K.simpson;
  const PI = Math.PI, SQ2 = Math.SQRT2;
  const n4 = (v) => K.neg(String(+v.toFixed(4)));
  const I = (a, b) => `∫_${a}^{${b}}`;
  const piS = (A) => { // A in units of π -> "3π/4"
    const f = K.frac(A), pr = f.split('/'), n = pr[0], d = pr[1];
    const num = n === '1' ? 'π' : n === '−1' ? '−π' : n + 'π';
    return d ? num + '/' + d : num;
  };
  // ---- exact value as a term list; the first printed term is positive when possible ----
  function tStr(ts) {
    ts = ts.filter((t) => Math.abs(t[0]) > 1e-12);
    const fi = ts.findIndex((t) => t[0] > 0);
    if (ts.length && ts[0][0] < 0 && fi > 0) ts = [ts[fi]].concat(ts.slice(0, fi), ts.slice(fi + 1));
    let out = '';
    ts.forEach(([c, sym]) => {
      const m = Math.abs(c), f = K.frac(m);
      const body = sym === '' ? f : (Math.abs(m - 1) < 1e-12 ? sym : (/\//.test(f) ? `(${f})` : f) + (/^[πe√]/.test(sym) ? '' : '·') + sym);
      out += out ? (c < 0 ? ' − ' : ' + ') + body : (c < 0 ? '−' : '') + body;
    });
    return out || '0';
  }
  const tVal = (ts) => ts.reduce((s, t) => s + t[0] * t[2], 0);
  const tScale = (ts, c) => ts.map((t) => [t[0] * c, t[1], t[2]]);
  const T3 = (q, pi, s2) => [[q, '', 1], [pi, 'π', PI], [s2, '√2', SQ2]];
  const sameVal = (a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b));

  // shared drawing: curve + shaded area up to b + running integral A(x) + marker
  function drawArea(canvas, f, A, a, b, xlo, xhi, bLabel, valTxt) {
    let lo = 0, hi = 0;
    for (let i = 0; i <= 240; i++) {
      const x = xlo + (xhi - xlo) * i / 240;
      [f(x), A(x)].forEach((v) => { if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    }
    const pad = 0.12 * (hi - lo || 1);
    canvas.setViewport(xlo, xhi, lo - pad, hi + pad);
    canvas.addFilledArea({ evaluator: f, xMin: a, xMax: b, color: K.col(canvas, 'accent', 0.3), samples: 240 });
    canvas.addFunction({ evaluator: A, color: canvas.orange(), thickness: 2, dashed: true, label: 'A(x)' });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3, label: 'f(x)' });
    canvas.addGuideLine({ axis: 'vertical', position: b, color: canvas.gold(), label: `b = ${bLabel}` });
    canvas.addMarker({ x: b, y: A(b), color: canvas.gold(), shape: 'diamond', radius: 7, label: valTxt });
  }
  const syncReg = (reg) => {
    if (!reg) return;
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round((v - reg.min) / (reg.max - reg.min) * 1000))));
  };
  const lab = (host, t) => { const d = document.createElement('div'); d.className = 'we-slider-caption'; d.textContent = t; host.appendChild(d); };

  // =====================================================================================================
  //  1) INTEGRATION BY PARTS
  // =====================================================================================================
  const ex = (b) => (b === 1 ? 'e' : 'e' + K.sup(b));
  const bsym = (m) => ['π/2', 'π', '3π/2', '2π'][m - 1];
  const eTrig = (m) => (m === 2 ? 'e^π' : `e^(${bsym(m)})`);
  const sc = (m) => [Math.round(Math.sin(m * PI / 2)), Math.round(Math.cos(m * PI / 2))];
  // problem kinds: f integrand, G antiderivative (no constant), terms(m) = exact value of ∫ₐᵇ f (c = 1)
  const PK = [
    { fs: 'x·eˣ', f: (x) => x * Math.exp(x), G: (x) => (x - 1) * Math.exp(x), Gs: '(x − 1)eˣ', u: 'int', mMax: 3,
      rounds: [{ u: 'x', dv: 'eˣ dx', du: 'dx', v: 'eˣ', res: '∫ x·eˣ dx = x·eˣ − ∫ eˣ dx = x·eˣ − eˣ' }],
      liate: ['Cebirsel × üstel: LIATE sırasında cebirsel (A) üstelden (E) önce gelir ⇒ u = x (türev alınca sadeleşir).', 'Algebraic × exponential: in LIATE the algebraic (A) comes before the exponential (E) ⇒ u = x (it simplifies when differentiated).'],
      terms: (m) => [[m - 1, ex(m), Math.exp(m)], [1, '', 1]] },
    { fs: 'x·sin x', f: (x) => x * Math.sin(x), G: (x) => Math.sin(x) - x * Math.cos(x), Gs: 'sin x − x·cos x', u: 'pi', mMax: 4,
      rounds: [{ u: 'x', dv: 'sin x dx', du: 'dx', v: '−cos x', res: '∫ x·sin x dx = −x·cos x + ∫ cos x dx = −x·cos x + sin x' }],
      liate: ['Cebirsel × trigonometrik: A, T’den önce gelir ⇒ u = x.', 'Algebraic × trigonometric: A comes before T ⇒ u = x.'],
      terms: (m) => { const [s, c] = sc(m); return [[s, '', 1], [-c * m / 2, 'π', PI]]; } },
    { fs: 'x·cos x', f: (x) => x * Math.cos(x), G: (x) => x * Math.sin(x) + Math.cos(x), Gs: 'x·sin x + cos x', u: 'pi', mMax: 4,
      rounds: [{ u: 'x', dv: 'cos x dx', du: 'dx', v: 'sin x', res: '∫ x·cos x dx = x·sin x − ∫ sin x dx = x·sin x + cos x' }],
      liate: ['Cebirsel × trigonometrik: A, T’den önce gelir ⇒ u = x.', 'Algebraic × trigonometric: A comes before T ⇒ u = x.'],
      terms: (m) => { const [s, c] = sc(m); return [[s * m / 2, 'π', PI], [c - 1, '', 1]]; } },
    { fs: 'x·ln x', f: (x) => x * Math.log(x), G: (x) => x * x / 2 * Math.log(x) - x * x / 4, Gs: '(x²/2)·ln x − x²/4', u: 'ln', mMax: 4,
      rounds: [{ u: 'ln x', dv: 'x dx', du: 'dx/x', v: 'x²/2', res: '∫ x·ln x dx = (x²/2)·ln x − ∫ (x²/2)(1/x) dx = (x²/2)·ln x − x²/4' }],
      liate: ['Logaritmik (L) en başta gelir ⇒ u = ln x (integrali zor, türevi 1/x basit); dv = x dx.', 'Logarithmic (L) comes first ⇒ u = ln x (hard to integrate, derivative 1/x is simple); dv = x dx.'],
      terms: (m) => { const b = m + 1; return [[b * b / 2, 'ln ' + b, Math.log(b)], [(1 - b * b) / 4, '', 1]]; } },
    { fs: 'ln x', f: (x) => Math.log(x), G: (x) => x * Math.log(x) - x, Gs: 'x·ln x − x', u: 'ln', mMax: 4,
      rounds: [{ u: 'ln x', dv: 'dx', du: 'dx/x', v: 'x', res: '∫ ln x dx = x·ln x − ∫ x·(1/x) dx = x·ln x − x' }],
      liate: ['ln x tek başına: dv = dx alınır, u = ln x (L).', 'ln x on its own: take dv = dx and u = ln x (L).'],
      terms: (m) => { const b = m + 1; return [[b, 'ln ' + b, Math.log(b)], [1 - b, '', 1]]; } },
    { fs: 'x²·eˣ', f: (x) => x * x * Math.exp(x), G: (x) => (x * x - 2 * x + 2) * Math.exp(x), Gs: '(x² − 2x + 2)eˣ', u: 'int', mMax: 3,
      rounds: [{ u: 'x²', dv: 'eˣ dx', du: '2x dx', v: 'eˣ', res: '∫ x²·eˣ dx = x²·eˣ − 2∫ x·eˣ dx' },
        { u: 'x', dv: 'eˣ dx', du: 'dx', v: 'eˣ', res: '∫ x·eˣ dx = x·eˣ − eˣ' }],
      after: '∫ x²·eˣ dx = x²·eˣ − 2(x·eˣ − eˣ) = (x² − 2x + 2)eˣ',
      liate: ['u = x² (her kısmi integralde derece bir düşer); polinomun derecesi kadar kez uygulanır (burada 2 kez).', 'u = x² (each round lowers the degree by one); apply the method as many times as the degree (here 2 times).'],
      terms: (m) => [[m * m - 2 * m + 2, ex(m), Math.exp(m)], [-2, '', 1]] },
    { fs: 'x²·sin x', f: (x) => x * x * Math.sin(x), G: (x) => -x * x * Math.cos(x) + 2 * x * Math.sin(x) + 2 * Math.cos(x), Gs: '−x²·cos x + 2x·sin x + 2cos x', u: 'pi', mMax: 4,
      rounds: [{ u: 'x²', dv: 'sin x dx', du: '2x dx', v: '−cos x', res: '∫ x²·sin x dx = −x²·cos x + 2∫ x·cos x dx' },
        { u: 'x', dv: 'cos x dx', du: 'dx', v: 'sin x', res: '∫ x·cos x dx = x·sin x + cos x' }],
      after: '∫ x²·sin x dx = −x²·cos x + 2(x·sin x + cos x) = −x²·cos x + 2x·sin x + 2cos x',
      liate: ['u = x² (derece düşsün); polinom ikinci dereceden olduğu için iki tur gerekir.', 'u = x² (to lower the degree); the polynomial has degree 2, so two rounds are needed.'],
      terms: (m) => { const [s, c] = sc(m); return [[-c * m * m / 4, 'π²', PI * PI], [s * m, 'π', PI], [2 * c - 2, '', 1]]; } },
    { fs: 'eˣ·sin x', f: (x) => Math.exp(x) * Math.sin(x), G: (x) => Math.exp(x) * (Math.sin(x) - Math.cos(x)) / 2, Gs: 'eˣ(sin x − cos x)/2', u: 'pi', mMax: 3, cyc: true,
      rounds: [{ u: 'sin x', dv: 'eˣ dx', du: 'cos x dx', v: 'eˣ', res: 'J = ∫ eˣ·sin x dx = eˣ·sin x − ∫ eˣ·cos x dx' },
        { u: 'cos x', dv: 'eˣ dx', du: '−sin x dx', v: 'eˣ', res: '∫ eˣ·cos x dx = eˣ·cos x + ∫ eˣ·sin x dx = eˣ·cos x + J' }],
      after: 'J = eˣ·sin x − (eˣ·cos x + J)  ⇒  2J = eˣ(sin x − cos x)  ⇒  J = eˣ(sin x − cos x)/2',
      liate: ['eˣ de sin x de LIATE’te ayırt edilemez; hangisini u seçersen seç iki tur sonra başlangıç integrali J geri gelir (döngü).', 'Neither eˣ nor sin x wins in LIATE; whichever you call u, after two rounds the starting integral J comes back (a cycle).'],
      terms: (m) => { const [s, c] = sc(m); return [[(s - c) / 2, eTrig(m), Math.exp(m * PI / 2)], [0.5, '', 1]]; } },
    { fs: 'arctan x', f: (x) => Math.atan(x), G: (x) => x * Math.atan(x) - 0.5 * Math.log(1 + x * x), Gs: 'x·arctan x − ½ ln(1 + x²)', u: 'int', mMax: 4,
      rounds: [{ u: 'arctan x', dv: 'dx', du: 'dx/(1 + x²)', v: 'x', res: '∫ arctan x dx = x·arctan x − ∫ x/(1 + x²) dx = x·arctan x − ½ ln(1 + x²)' }],
      liate: ['Ters trigonometrik (I) tek başına: dv = dx, u = arctan x.', 'Inverse trigonometric (I) on its own: dv = dx, u = arctan x.'],
      terms: (m) => (m === 1 ? [[0.25, 'π', PI], [-0.5, 'ln 2', Math.log(2)]] : [[m, 'arctan ' + m, Math.atan(m)], [-0.5, 'ln ' + (1 + m * m), Math.log(1 + m * m)]]) },
  ];
  // [a, b] for step m: 'int' b = m, 'ln' [1, m + 1], 'pi' b = m·π/2
  const lim = (k, m) => (PK[k].u === 'pi' ? { a: 0, b: m * PI / 2 } : PK[k].u === 'ln' ? { a: 1, b: m + 1 } : { a: 0, b: m });
  const bTxt = (k, m) => (PK[k].u === 'pi' ? bsym(m) : PK[k].u === 'ln' ? String(m + 1) : String(m));
  const pClamp = (p) => { p.k = Math.max(0, Math.min(PK.length - 1, Math.round(p.k))); p.c = Math.max(1, Math.min(3, Math.round(p.c))); p.m = Math.max(1, Math.min(PK[p.k].mMax, Math.round(p.m))); return p; };
  const pTerms = (p) => tScale(PK[p.k].terms(p.m), p.c);
  const pExact = (p) => tVal(pTerms(p));
  const pNum = (p) => { const L = lim(p.k, p.m), k = PK[p.k]; return simpson((x) => p.c * k.f(x), L.a, L.b, 2000); };
  const pInteg = (p) => (p.c === 1 ? '' : p.c + '·') + PK[p.k].fs;
  function pVerify(p) {
    const e = pExact(p), n = pNum(p), L = lim(p.k, p.m), g = p.c * (PK[p.k].G(L.b) - PK[p.k].G(L.a));
    if (!sameVal(e, n) || !sameVal(g, n)) throw new Error('parts: exact ' + e + ' / G ' + g + ' != numeric ' + n);
  }
  PK.forEach((k) => { for (const x of [0.7, 1.3, 2.1, 2.9]) { const h = 1e-5, d = (k.G(x + h) - k.G(x - h)) / (2 * h); if (!sameVal(d, k.f(x))) throw new Error('parts: G′ != f for ' + k.fs); } });
  function pBuild(rng, kinds) {
    const k = kinds ? rng.pick(kinds) : rng.nextInt(0, PK.length);
    const p = { k, c: rng.nextInt(1, 4), m: rng.nextInt(1, PK[k].mMax + 1) };
    pVerify(p);
    return p;
  }
  function pStatement(p) {
    pClamp(p);
    const L = lim(p.k, p.m);
    const S = `${I(L.a, bTxt(p.k, p.m))} ${pInteg(p)} dx`;
    return tx(`${S} belirli integralini kısmi integral yöntemiyle hesaplayalım. Hangi çarpanı u, hangisini dv seçtiğimizi gerekçelendirelim ve sonucu tam (kapalı) biçimde yazalım.`,
      `Let's evaluate the definite integral ${S} by integration by parts. We justify which factor is u and which is dv, and write the result in exact form.`);
  }
  function pSteps(p) {
    pClamp(p); pVerify(p);
    const k = PK[p.k], L = lim(p.k, p.m), c = p.c, bt = bTxt(p.k, p.m), s = [];
    const cf = c === 1 ? '' : c + '·';
    const S = `${I(L.a, bt)} ${pInteg(p)} dx`;
    s.push(tx(`── 1) Yöntemi seçelim ──\n${S}\nİki farklı türden fonksiyonun çarpımı ⇒ kısmi integral: ∫ u dv = u·v − ∫ v du; belirli integralde ∫ₐᵇ u dv = [u·v]ₐᵇ − ∫ₐᵇ v du.\n${k.liate[0]}`,
      `── 1) Choosing the method ──\n${S}\nA product of two different kinds of function ⇒ integration by parts: ∫ u dv = u·v − ∫ v du; for a definite integral ∫ₐᵇ u dv = [u·v]ₐᵇ − ∫ₐᵇ v du.\n${k.liate[1]}`));
    k.rounds.forEach((r, i) => {
      const tab = `u = ${r.u}        dv = ${r.dv}\ndu = ${r.du}        v = ${r.v}`;
      s.push(tx(`── ${i + 2}) ${k.rounds.length > 1 ? `${i + 1}. tur: ` : ''}u, dv, du, v tablosu ──\n${tab}\n${r.res}`,
        `── ${i + 2}) ${k.rounds.length > 1 ? `Round ${i + 1}: ` : ''}table of u, dv, du, v ──\n${tab}\n${r.res}`));
    });
    let n = k.rounds.length + 2;
    if (k.after) { s.push(tx(`── ${n}) ${k.cyc ? 'Döngüyü çöz' : 'Turları birleştir'} ──\n${k.after}`, `── ${n}) ${k.cyc ? 'Solve the cycle' : 'Combine the rounds'} ──\n${k.after}`)); n++; }
    const Gb = /[+−]/.test(k.Gs) ? '[' + k.Gs + ']' : k.Gs;
    s.push(tx(`── ${n}) Ters türev ──\nF(x) = ${cf}${Gb}   (sabit C belirli integralde sadeleşir)`,
      `── ${n}) Antiderivative ──\nF(x) = ${cf}${Gb}   (the constant C cancels in a definite integral)`)); n++;
    const Fb = c * k.G(L.b), Fa = c * k.G(L.a);
    s.push(tx(`── ${n}) Sınırları yerine koy ──\nF(${bt}) = ${n4(Fb)},   F(${L.a}) = ${n4(Fa)}\n${S} = F(${bt}) − F(${L.a}) = ${n4(Fb)} − (${n4(Fa)}) = ${n4(Fb - Fa)}`,
      `── ${n}) Substitute the limits ──\nF(${bt}) = ${n4(Fb)},   F(${L.a}) = ${n4(Fa)}\n${S} = F(${bt}) − F(${L.a}) = ${n4(Fb)} − (${n4(Fa)}) = ${n4(Fb - Fa)}`)); n++;
    s.push(tx(`── ${n}) Tam değer ──\n${S} = ${tStr(pTerms(p))} ≈ ${n4(pExact(p))}`, `── ${n}) Exact value ──\n${S} = ${tStr(pTerms(p))} ≈ ${n4(pExact(p))}`)); n++;
    s.push(tx(`── ${n}) Sayısal kontrol ──\nSimpson kuralıyla (n = 2000) ≈ ${n4(pNum(p))}; tam değerle aynı ✓. Grafikte integral, eğrinin altında kalan işaretli alandır; kesikli eğri A(x) = ∫ₐˣ f dt birikimli alandır.`,
      `── ${n}) Numerical check ──\nSimpson's rule (n = 2000) gives ≈ ${n4(pNum(p))}; equal to the exact value ✓. On the graph the integral is the signed area under the curve; the dashed curve is the running area A(x) = ∫ₐˣ f dt.`));
    return s;
  }
  function pDraw(canvas, p) {
    pClamp(p);
    const k = PK[p.k], L = lim(p.k, p.m), c = p.c, top = lim(p.k, k.mMax).b;
    const f = safe((x) => c * k.f(x)), A = safe((x) => c * (k.G(x) - k.G(L.a)));
    drawArea(canvas, f, A, L.a, L.b, L.a === 1 ? 0.3 : -0.5, top + 0.5, bTxt(p.k, p.m), `I = ${N2(pExact(p))}`);
  }
  function pConcept() {
    return tx(`KISMİ İNTEGRAL
ÇARPIM KURALININ TERSİ
(u·v)′ = u′v + u v′ türev kuralını integre edersek:
∫ u dv = u·v − ∫ v du       (belirli: ∫ₐᵇ u dv = [u·v]ₐᵇ − ∫ₐᵇ v du)
Amaç: sağdaki ∫ v du, soldaki ∫ u dv'den DAHA KOLAY olsun.

SEÇİM KURALI (LIATE)
Sıra: L (logaritmik), I (ters trigonometrik), A (cebirsel: polinom), T (trigonometrik), E (üstel). Listede önce gelen u olur, kalan dv olur. dv'nin integrali alınabilmeli; u türev alınınca sadeleşmeli.
• Cebirsel × üstel (x·eˣ, x²·eˣ): u = polinom.
• Cebirsel × trigonometrik (x·sin x, x·cos x, x²·sin x): u = polinom.
• Logaritma (ln x, x·ln x): u = ln x (ln x tek başınaysa dv = dx).
• Ters trigonometrik (arctan x): u = arctan x, dv = dx.

YÖNTEM ADIMLARI
1. u ve dv seç; du = u′ dx ve v = ∫ dv hesapla (u / dv / du / v tablosu).
2. ∫ u dv = u·v − ∫ v du formülüne yaz.
3. Kalan ∫ v du integralini al; belirli integralde [u·v]ₐᵇ'yi de sınırlarda değerlendir.
• Tekrarlı kullanım (x²·eˣ, x²·sin x): kalan integral hâlâ çarpımsa yöntemi yeniden uygula; her turda polinomun derecesi bir düşer.
• Döngü (eˣ·sin x): iki turdan sonra başlangıç integrali J geri gelir; J'yi cebirsel bir denklem gibi çöz: 2J = ….
• Belirli integral: alt sınırı da unutma, [u·v]ₐᵇ = u(b)v(b) − u(a)v(a).

NE ZAMAN İŞE YARAR / HATALAR
Yarar: iki farklı türün çarpımı, ya da ln x, arctan x gibi türevi cebirsel olan fonksiyonlar. Hatalar: u ile dv'yi ters seçip integrali zorlaştırmak; v du'daki işareti (özellikle v = −cos x) kaçırmak; belirli integralde alt sınır terimini unutmak; ∫ u dv'yi ∫u·∫dv gibi ayrı ayrı almak (yanlış!).

ÇÖZÜMLÜ MİNİ ÖRNEK
∫_0^1 x·eˣ dx: u = x, dv = eˣ dx ⇒ du = dx, v = eˣ.
= [x·eˣ]₀¹ − ∫_0^1 eˣ dx = e − (e − 1) = 1.`,
      `INTEGRATION BY PARTS
THE PRODUCT RULE IN REVERSE
Integrating the product rule (u·v)′ = u′v + u v′ gives
∫ u dv = u·v − ∫ v du       (definite: ∫ₐᵇ u dv = [u·v]ₐᵇ − ∫ₐᵇ v du)
Goal: the new integral ∫ v du must be EASIER than the original ∫ u dv.

THE LIATE RULE
Order: L (logarithmic), I (inverse trigonometric), A (algebraic: polynomial), T (trigonometric), E (exponential). The one that comes first in the list is u, the rest is dv. You must be able to integrate dv; u should simplify when differentiated.
• Algebraic × exponential (x·eˣ, x²·eˣ): u = the polynomial.
• Algebraic × trigonometric (x·sin x, x·cos x, x²·sin x): u = the polynomial.
• Logarithm (ln x, x·ln x): u = ln x (for ln x alone take dv = dx).
• Inverse trigonometric (arctan x): u = arctan x, dv = dx.

METHOD STEPS
1. Choose u and dv; compute du = u′ dx and v = ∫ dv (table of u / dv / du / v).
2. Insert into ∫ u dv = u·v − ∫ v du.
3. Integrate the remaining ∫ v du; for a definite integral also evaluate [u·v]ₐᵇ at the limits.
• Repeated use (x²·eˣ, x²·sin x): if the remaining integral is still a product, apply the method again; each round lowers the polynomial degree by one.
• Cyclic case (eˣ·sin x): after two rounds the original integral J returns; solve for J like an algebraic equation: 2J = ….
• Definite integral: do not forget the lower limit, [u·v]ₐᵇ = u(b)v(b) − u(a)v(a).

WHEN IT WORKS / MISTAKES
It works for a product of two different kinds of function, or for ln x, arctan x whose derivative is algebraic. Mistakes: choosing u and dv the wrong way round and making the integral harder; losing the sign in v du (especially v = −cos x); forgetting the lower-limit term; integrating ∫ u dv as ∫u·∫dv separately (wrong!).

WORKED MINI EXAMPLE
∫_0^1 x·eˣ dx: u = x, dv = eˣ dx ⇒ du = dx, v = eˣ.
= [x·eˣ]₀¹ − ∫_0^1 eˣ dx = e − (e − 1) = 1.`);
  }
  const pGrp = (ks) => (rng) => pBuild(rng, ks);
  const pHint = (g, t) => (g > t
    ? tx('Tahminimiz biraz büyük: [u·v]ₐᵇ − ∫ v du işaretlerini ve alt sınır terimini kontrol et.', 'Our guess is a bit too large: re-check the signs in [u·v]ₐᵇ − ∫ v du and the lower-limit term.')
    : tx('Tahminimiz biraz küçük: [u·v]ₐᵇ − ∫ v du işaretlerini ve alt sınır terimini kontrol et.', 'Our guess is a bit too small: re-check the signs in [u·v]ₐᵇ − ∫ v du and the lower-limit term.'));
  let pSlM = null;
  Topics.register('calc2', {
    id: 'parts',
    tabTitle: () => tx('Kısmi İntegral', 'Integration by Parts'),
    concept: pConcept,
    problemStatement: pStatement,
    createProblem: (rng) => pBuild(rng, null),
    solveSteps: pSteps,
    draw: pDraw,
    buildControls(right, getP, h) {
      lab(right, tx('İntegrand', 'Integrand'));
      h.addSelect({ options: PK.map((k, i) => ({ label: `f(x) = ${k.fs}`, value: i })), get: () => getP().k,
        set: (v) => { const p = getP(); p.k = Number(v); pClamp(p); syncReg(pSlM); } });
      h.addSlider({ caption: tx('Katsayı c  (f = c·…)', 'Coefficient c  (f = c·…)'), min: 1, max: 3, step: 1, get: () => getP().c, set: (v) => { getP().c = Math.round(v); } });
      pSlM = h.addSlider({ caption: tx('Üst sınır b  (adım m: b = m, m+1 ya da m·π/2)', 'Upper limit b  (step m: b = m, m+1 or m·π/2)'), min: 1, max: 4, step: 1,
        get: () => getP().m, set: (v) => { const p = getP(); p.m = Math.round(v); pClamp(p); } });
    },
    links: [
      { match: /^• (Cebirsel × üstel|Algebraic × exponential)/, make: pGrp([0, 5]) },
      { match: /^• (Cebirsel × trigonometrik|Algebraic × trigonometric)/, make: pGrp([1, 2, 6]) },
      { match: /^• (Logaritma|Logarithm) \(/, make: pGrp([3, 4]) },
      { match: /^• (Ters trigonometrik|Inverse trigonometric)/, make: pGrp([8]) },
      { match: /^• (Tekrarlı kullanım|Repeated use)/, make: pGrp([5, 6]) },
      { match: /^• (Döngü|Cyclic case)/, make: pGrp([7]) },
      { match: /^• (Belirli integral|Definite integral):/, make: pGrp(null) },
    ],
    challenge: {
      title: () => tx('Tahmin et, sonra kontrol et', 'Predict, then check'),
      prompt: (p) => { pClamp(p); const L = lim(p.k, p.m); return tx(`${I(L.a, bTxt(p.k, p.m))} ${pInteg(p)} dx integralinin değeri kaçtır? Kısmi integrali kendin uygula, sonucu 2 ondalık basamakla yaz.`,
        `What is the value of ${I(L.a, bTxt(p.k, p.m))} ${pInteg(p)} dx? Apply integration by parts yourself and give the result to 2 decimals.`); },
      target: (p) => { pClamp(p); return pExact(p); },
      tol: (p) => { pClamp(p); return Math.max(0.02, 0.005 * Math.abs(pExact(p))); },
      hint: (p, g) => pHint(g, pExact(pClamp(p))),
    },
    _test: { PK, lim, pExact, pNum, pTerms, tStr, tVal },
  });

  // =====================================================================================================
  //  2) TRIGONOMETRIC INTEGRALS
  // =====================================================================================================
  // antiderivative items: c·x, or c·fn(k·x)^pw with fn in sin / cos / tan / sec; U = step of b in units of π (b = t·U·π)
  const It = (c, f, k, pw) => ({ c, f, k: k || 1, pw: pw || 1 });
  const bs = (it, x) => (it.f === 'sin' ? Math.sin(it.k * x) : it.f === 'cos' ? Math.cos(it.k * x) : it.f === 'tan' ? Math.tan(it.k * x) : 1 / Math.cos(it.k * x));
  const gVal = (items, x) => items.reduce((s, it) => s + (it.f === 'x' ? it.c * x : it.c * Math.pow(bs(it, x), it.pw)), 0);
  const pairMul = (a, b) => [a[0] * b[0] + 2 * a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  // exact value of a base function at angle j·π as [q, s] meaning q + s·√2 (null when not a "nice" angle)
  function baseExact(f, j) {
    const h = Math.round(2 * j);
    if (f === 'sin' || f === 'cos') {
      if (Math.abs(2 * j - h) > 1e-9) return null;
      const n = ((h % 4) + 4) % 4;
      return [(f === 'sin' ? [0, 1, 0, -1] : [1, 0, -1, 0])[n], 0];
    }
    if (Math.abs(j) < 1e-12) return f === 'tan' ? [0, 0] : [1, 0];
    if (Math.abs(j - 0.25) > 1e-9) return null;
    return f === 'tan' ? [1, 0] : [0, 1];
  }
  function itemsExact(items, A) { // ∫₀^{Aπ}: term list or null
    let q = 0, pi = 0, s2 = 0;
    for (const it of items) {
      if (it.f === 'x') { pi += it.c * A; continue; }
      const eb = baseExact(it.f, it.k * A), e0 = baseExact(it.f, 0);
      if (!eb || !e0) return null;
      let pb = [1, 0], p0 = [1, 0];
      for (let i = 0; i < it.pw; i++) { pb = pairMul(pb, eb); p0 = pairMul(p0, e0); }
      q += it.c * (pb[0] - p0[0]); s2 += it.c * (pb[1] - p0[1]);
    }
    return T3(q, pi, s2);
  }
  // cls: 0 odd power, 1 both even, 2 tan/sec, 3 product
  const TK = [
    { s: 'sin³x', f: (x) => Math.pow(Math.sin(x), 3), G: [It(-1, 'cos'), It(1 / 3, 'cos', 1, 3)], Gs: '−cos x + cos³x/3', cls: 0, U: 1 / 2,
      chain: 'sin³x = sin²x·sin x = (1 − cos²x)·sin x\nu = cos x,  du = −sin x dx\n∫ (1 − cos²x) sin x dx = −∫ (1 − u²) du = −u + u³/3' },
    { s: 'sin²x·cos³x', f: (x) => Math.pow(Math.sin(x), 2) * Math.pow(Math.cos(x), 3), G: [It(1 / 3, 'sin', 1, 3), It(-1 / 5, 'sin', 1, 5)], Gs: 'sin³x/3 − sin⁵x/5', cls: 0, U: 1 / 2,
      chain: 'sin²x·cos³x = sin²x·cos²x·cos x = sin²x(1 − sin²x)·cos x\nu = sin x,  du = cos x dx\n∫ u²(1 − u²) du = u³/3 − u⁵/5' },
    { s: 'sin³x·cos²x', f: (x) => Math.pow(Math.sin(x), 3) * Math.pow(Math.cos(x), 2), G: [It(-1 / 3, 'cos', 1, 3), It(1 / 5, 'cos', 1, 5)], Gs: '−cos³x/3 + cos⁵x/5', cls: 0, U: 1 / 2,
      chain: 'sin³x·cos²x = sin²x·cos²x·sin x = (1 − cos²x)cos²x·sin x\nu = cos x,  du = −sin x dx\n−∫ (1 − u²)u² du = −u³/3 + u⁵/5' },
    { s: 'cos³x', f: (x) => Math.pow(Math.cos(x), 3), G: [It(1, 'sin'), It(-1 / 3, 'sin', 1, 3)], Gs: 'sin x − sin³x/3', cls: 0, U: 1 / 2,
      chain: 'cos³x = cos²x·cos x = (1 − sin²x)·cos x\nu = sin x,  du = cos x dx\n∫ (1 − u²) du = u − u³/3' },
    { s: 'sin²x', f: (x) => Math.pow(Math.sin(x), 2), G: [It(0.5, 'x'), It(-0.25, 'sin', 2)], Gs: 'x/2 − sin 2x/4', cls: 1, U: 1 / 4,
      chain: 'sin²x = (1 − cos 2x)/2\n∫ (1 − cos 2x)/2 dx = x/2 − sin 2x/4' },
    { s: 'cos²x', f: (x) => Math.pow(Math.cos(x), 2), G: [It(0.5, 'x'), It(0.25, 'sin', 2)], Gs: 'x/2 + sin 2x/4', cls: 1, U: 1 / 4,
      chain: 'cos²x = (1 + cos 2x)/2\n∫ (1 + cos 2x)/2 dx = x/2 + sin 2x/4' },
    { s: 'sin⁴x', f: (x) => Math.pow(Math.sin(x), 4), G: [It(3 / 8, 'x'), It(-0.25, 'sin', 2), It(1 / 32, 'sin', 4)], Gs: '3x/8 − sin 2x/4 + sin 4x/32', cls: 1, U: 1 / 4,
      chain: 'sin⁴x = ((1 − cos 2x)/2)² = (1 − 2cos 2x + cos²2x)/4\ncos²2x = (1 + cos 4x)/2  ⇒  sin⁴x = 3/8 − cos 2x/2 + cos 4x/8\n∫ sin⁴x dx = 3x/8 − sin 2x/4 + sin 4x/32' },
    { s: 'sin²x·cos²x', f: (x) => Math.pow(Math.sin(x) * Math.cos(x), 2), G: [It(1 / 8, 'x'), It(-1 / 32, 'sin', 4)], Gs: 'x/8 − sin 4x/32', cls: 1, U: 1 / 4,
      chain: 'sin x·cos x = (sin 2x)/2  ⇒  sin²x·cos²x = sin²2x/4 = (1 − cos 4x)/8\n∫ (1 − cos 4x)/8 dx = x/8 − sin 4x/32' },
    { s: 'tan²x·sec²x', f: (x) => Math.pow(Math.tan(x), 2) / Math.pow(Math.cos(x), 2), G: [It(1 / 3, 'tan', 1, 3)], Gs: 'tan³x/3', cls: 2, U: 1 / 16,
      chain: 'u = tan x,  du = sec²x dx\n∫ tan²x·sec²x dx = ∫ u² du = u³/3 = tan³x/3' },
    { s: 'tan³x·sec x', f: (x) => Math.pow(Math.tan(x), 3) / Math.cos(x), G: [It(1 / 3, 'sec', 1, 3), It(-1, 'sec')], Gs: 'sec³x/3 − sec x', cls: 2, U: 1 / 16,
      chain: 'tan³x·sec x = tan²x·(sec x tan x) = (sec²x − 1)·sec x tan x\nu = sec x,  du = sec x tan x dx\n∫ (u² − 1) du = u³/3 − u = sec³x/3 − sec x' },
    { s: 'sec⁴x', f: (x) => 1 / Math.pow(Math.cos(x), 4), G: [It(1, 'tan'), It(1 / 3, 'tan', 1, 3)], Gs: 'tan x + tan³x/3', cls: 2, U: 1 / 16,
      chain: 'sec⁴x = sec²x·sec²x = (1 + tan²x)·sec²x\nu = tan x,  du = sec²x dx\n∫ (1 + u²) du = u + u³/3 = tan x + tan³x/3' },
    { s: 'tan²x', f: (x) => Math.pow(Math.tan(x), 2), G: [It(1, 'tan'), It(-1, 'x')], Gs: 'tan x − x', cls: 2, U: 1 / 16,
      chain: 'tan²x = sec²x − 1\n∫ (sec²x − 1) dx = tan x − x' },
    { s: 'sin 3x·cos 2x', f: (x) => Math.sin(3 * x) * Math.cos(2 * x), G: [It(-1 / 10, 'cos', 5), It(-1 / 2, 'cos', 1)], Gs: '−cos 5x/10 − cos x/2', cls: 3, U: 1 / 2,
      chain: 'sin A·cos B = ½[sin(A + B) + sin(A − B)]\nsin 3x·cos 2x = ½[sin 5x + sin x]\n∫ ½[sin 5x + sin x] dx = −cos 5x/10 − cos x/2' },
    { s: 'sin x·sin 3x', f: (x) => Math.sin(x) * Math.sin(3 * x), G: [It(1 / 4, 'sin', 2), It(-1 / 8, 'sin', 4)], Gs: 'sin 2x/4 − sin 4x/8', cls: 3, U: 1 / 2,
      chain: 'sin A·sin B = ½[cos(A − B) − cos(A + B)]\nsin x·sin 3x = ½[cos 2x − cos 4x]\n∫ ½[cos 2x − cos 4x] dx = sin 2x/4 − sin 4x/8' },
    { s: 'cos 2x·cos 3x', f: (x) => Math.cos(2 * x) * Math.cos(3 * x), G: [It(1 / 2, 'sin', 1), It(1 / 10, 'sin', 5)], Gs: 'sin x/2 + sin 5x/10', cls: 3, U: 1 / 2,
      chain: 'cos A·cos B = ½[cos(A − B) + cos(A + B)]\ncos 2x·cos 3x = ½[cos x + cos 5x]\n∫ ½[cos x + cos 5x] dx = sin x/2 + sin 5x/10' },
  ];
  const CLS = [
    ['Tek kuvvet: tek kuvvetli çarpandan BİR tanesini ayır, kalanı sin² = 1 − cos² (ya da cos² = 1 − sin²) ile diğer fonksiyona çevir, u-yerine koyma yap.', 'Odd power: save ONE factor of the odd-power function, convert the rest with sin² = 1 − cos² (or cos² = 1 − sin²) and substitute u.'],
    ['Her iki kuvvet çift: yarım açı özdeşlikleri sin²x = (1 − cos 2x)/2, cos²x = (1 + cos 2x)/2 ile kuvveti düşür.', 'Both powers even: lower the power with the half-angle identities sin²x = (1 − cos 2x)/2, cos²x = (1 + cos 2x)/2.'],
    ['tanᵐx·secⁿx: sec’in kuvveti çiftse sec²x dx = du ile u = tan x; tan’ın kuvveti tekse sec x tan x dx = du ile u = sec x; tan² = sec² − 1.', 'tanᵐx·secⁿx: if the power of sec is even use u = tan x (du = sec²x dx); if the power of tan is odd use u = sec x (du = sec x tan x dx); tan² = sec² − 1.'],
    ['Çarpım: çarpımı toplama çevir (sin A cos B = ½[sin(A+B) + sin(A−B)] vb.), sonra terim terim integre et.', 'Product: turn the product into a sum (sin A cos B = ½[sin(A+B) + sin(A−B)] etc.), then integrate term by term.'],
  ];
  const tCl = (p) => { p.k = Math.max(0, Math.min(TK.length - 1, Math.round(p.k))); p.t = Math.max(1, Math.min(4, Math.round(p.t))); return p; };
  const tB = (p) => p.t * TK[p.k].U * PI;
  const tBt = (p) => piS(p.t * TK[p.k].U);
  const tG = (p, x) => gVal(TK[p.k].G, x);
  const tNum = (p) => simpson(TK[p.k].f, 0, tB(p), 4000);
  const tVal0 = (p) => tG(p, tB(p)) - tG(p, 0);
  const tTerms = (p) => itemsExact(TK[p.k].G, p.t * TK[p.k].U);
  function tVerify(p) {
    const v = tVal0(p), n = tNum(p), e = tTerms(p);
    if (!sameVal(v, n)) throw new Error('trigInt: G(b) - G(0) ' + v + ' != numeric ' + n);
    if (e && !sameVal(tVal(e), v)) throw new Error('trigInt: exact terms ' + tVal(e) + ' != ' + v);
    return e;
  }
  TK.forEach((k) => { for (const x of [0.21, 0.5, 0.7]) { const h = 1e-5, d = (gVal(k.G, x + h) - gVal(k.G, x - h)) / (2 * h); if (!sameVal(d, k.f(x))) throw new Error('trigInt: G′ != f for ' + k.s); } });
  function tBuild(rng, kinds) {
    const k = kinds ? rng.pick(kinds) : rng.nextInt(0, TK.length);
    const p = { k, t: TK[k].cls === 2 ? (rng.nextInt(0, 3) === 0 ? rng.nextInt(1, 4) : 4) : rng.nextInt(1, 5) };
    tVerify(p);
    return p;
  }
  function tStatement(p) {
    tCl(p);
    const S = `${I(0, tBt(p))} ${TK[p.k].s} dx`;
    return tx(`${S} belirli integralini hesaplayalım. Önce uygun yöntemi (tek kuvvet / yarım açı / tan-sec / çarpımı toplama çevirme) seçelim, ardından sonucu mümkünse tam değer olarak yazalım.`,
      `Let's evaluate the definite integral ${S}. First choose the suitable method (odd power / half-angle / tan-sec / product to sum), then write the result as an exact value where possible.`);
  }
  function tSteps(p) {
    tCl(p);
    const e = tVerify(p), k = TK[p.k], bt = tBt(p), S = `${I(0, bt)} ${k.s} dx`, s = [];
    s.push(tx(`── 1) Hangi durum? ──\n${S}\n${CLS[k.cls][0]}`, `── 1) Which case? ──\n${S}\n${CLS[k.cls][1]}`));
    s.push(tx(`── 2) Dönüştür ve integre et ──\n${k.chain}`, `── 2) Rewrite and integrate ──\n${k.chain}`));
    s.push(tx(`── 3) Ters türev ──\nF(x) = ${k.Gs}   (sabit C belirli integralde sadeleşir)`, `── 3) Antiderivative ──\nF(x) = ${k.Gs}   (the constant C cancels in a definite integral)`));
    const Fb = tG(p, tB(p)), F0 = tG(p, 0);
    s.push(tx(`── 4) Sınırları yerine koy ──\nF(${bt}) = ${n4(Fb)},   F(0) = ${n4(F0)}\n${S} = F(${bt}) − F(0) = ${n4(Fb)} − (${n4(F0)}) = ${n4(Fb - F0)}`,
      `── 4) Substitute the limits ──\nF(${bt}) = ${n4(Fb)},   F(0) = ${n4(F0)}\n${S} = F(${bt}) − F(0) = ${n4(Fb)} − (${n4(F0)}) = ${n4(Fb - F0)}`));
    s.push(e ? tx(`── 5) Tam değer ──\n${S} = ${tStr(e)} ≈ ${n4(tVal0(p))}`, `── 5) Exact value ──\n${S} = ${tStr(e)} ≈ ${n4(tVal0(p))}`)
      : tx(`── 5) Değer ──\nÜst sınır (${bt}) özel bir açı olmadığından tam değer yerine sayısal değer: ${S} ≈ ${n4(tVal0(p))}. (Sınır π/4 olunca sonuç tam değer olur.)`,
        `── 5) Value ──\nThe upper limit (${bt}) is not a special angle, so we give the numerical value: ${S} ≈ ${n4(tVal0(p))}. (At the limit π/4 the result is exact.)`));
    s.push(tx(`── 6) Sayısal kontrol ──\nSimpson kuralıyla (n = 4000) ≈ ${n4(tNum(p))}; aynı ✓. Grafikte integral eğrinin altındaki işaretli alandır; kesikli eğri A(x) = ∫₀ˣ f dt birikimli alandır.`,
      `── 6) Numerical check ──\nSimpson's rule (n = 4000) gives ≈ ${n4(tNum(p))}; the same ✓. On the graph the integral is the signed area under the curve; the dashed curve is the running area A(x) = ∫₀ˣ f dt.`));
    return s;
  }
  function tDraw(canvas, p) {
    tCl(p);
    const k = TK[p.k], f = safe(k.f), A = safe((x) => tG(p, x) - tG(p, 0)), top = 4 * k.U * PI;
    drawArea(canvas, f, A, 0, tB(p), -0.15 * top, top * 1.08, tBt(p), `I = ${N2(tVal0(p))}`);
  }
  function tConcept() {
    return tx(`TRİGONOMETRİK İNTEGRALLER
FİKİR
sinᵐx·cosⁿx, tanᵐx·secⁿx ve sin(ax)·cos(bx) türünden integraller, uygun bir trigonometrik özdeşlikle u-yerine koymaya ya da doğrudan integrale çevrilir. Temel özdeşlikler: sin²x + cos²x = 1, 1 + tan²x = sec²x, yarım açı sin²x = (1 − cos 2x)/2, cos²x = (1 + cos 2x)/2.

sinᵐx·cosⁿx
• Tek kuvvet: m ya da n tekse, tek kuvvetli çarpandan birini ayır (ör. sin³x = sin²x·sin x), kalan çift kuvveti sin² = 1 − cos² ile diğer fonksiyona çevir; u = cos x (du = −sin x dx) ya da u = sin x (du = cos x dx).
• Her iki kuvvet çift: yarım açı özdeşlikleriyle kuvveti düşür (ör. sin²x cos²x = (1 − cos 4x)/8); gerekirse tekrarla.

tanᵐx·secⁿx
• tan-sec: n çiftse u = tan x (sec²x dx = du); m tekse u = sec x (sec x tan x dx = du); tan²x = sec²x − 1.

ÇARPIMLAR
• Çarpımı topla: sin(ax)·cos(bx) = ½[sin((a+b)x) + sin((a−b)x)], sin(ax)·sin(bx) = ½[cos((a−b)x) − cos((a+b)x)], cos(ax)·cos(bx) = ½[cos((a−b)x) + cos((a+b)x)].

YÖNTEM VE HATALAR
1. Kuvvetlerin tek/çift olduğuna bak ve yukarıdaki durumu seç. 2. Dönüştür, u-yerine koy ya da toplama çevir. 3. İntegre et, sınırları yerleştir (u-yerine koymada sınırları da u'ya çevirebilirsin). Hatalar: yarım açı formülündeki ½'yi unutmak; du'daki eksi işaretini kaçırmak; ∫cos 2x dx = sin 2x/2 yerine sin 2x yazmak (iç fonksiyonun türevi); tan veya sec'in tanımsız olduğu π/2 gibi noktalardan geçmek.

ÇÖZÜMLÜ MİNİ ÖRNEK
∫_0^{π/2} sin³x dx = ∫_0^{π/2} (1 − cos²x) sin x dx; u = cos x, du = −sin x dx; x: 0 → π/2 iken u: 1 → 0.
= ∫_1^0 −(1 − u²) du = ∫_0^1 (1 − u²) du = 1 − 1/3 = 2/3.`,
      `TRIGONOMETRIC INTEGRALS
THE IDEA
Integrals of the type sinᵐx·cosⁿx, tanᵐx·secⁿx and sin(ax)·cos(bx) are turned, with a suitable trigonometric identity, into a substitution or a direct integral. Key identities: sin²x + cos²x = 1, 1 + tan²x = sec²x, half-angle sin²x = (1 − cos 2x)/2, cos²x = (1 + cos 2x)/2.

sinᵐx·cosⁿx
• Odd power: if m or n is odd, save one factor of the odd-power function (e.g. sin³x = sin²x·sin x), convert the remaining even power with sin² = 1 − cos² into the other function; u = cos x (du = −sin x dx) or u = sin x (du = cos x dx).
• Both powers even: lower the power with the half-angle identities (e.g. sin²x cos²x = (1 − cos 4x)/8); repeat if needed.

tanᵐx·secⁿx
• tan-sec: if n is even use u = tan x (sec²x dx = du); if m is odd use u = sec x (sec x tan x dx = du); tan²x = sec²x − 1.

PRODUCTS
• Product to sum: sin(ax)·cos(bx) = ½[sin((a+b)x) + sin((a−b)x)], sin(ax)·sin(bx) = ½[cos((a−b)x) − cos((a+b)x)], cos(ax)·cos(bx) = ½[cos((a−b)x) + cos((a+b)x)].

METHOD AND MISTAKES
1. Look at whether the powers are odd or even and pick the case above. 2. Rewrite, substitute or convert to a sum. 3. Integrate and insert the limits (in a substitution you may convert the limits to u). Mistakes: forgetting the ½ in the half-angle formula; losing the minus sign in du; writing ∫cos 2x dx = sin 2x instead of sin 2x/2 (derivative of the inner function); passing through points such as π/2 where tan or sec does not exist.

WORKED MINI EXAMPLE
∫_0^{π/2} sin³x dx = ∫_0^{π/2} (1 − cos²x) sin x dx; u = cos x, du = −sin x dx; x: 0 → π/2 gives u: 1 → 0.
= ∫_1^0 −(1 − u²) du = ∫_0^1 (1 − u²) du = 1 − 1/3 = 2/3.`);
  }
  const tGrp = (ks) => (rng) => tBuild(rng, ks);
  Topics.register('calc2', {
    id: 'trigInt',
    tabTitle: () => tx('Trigonometrik İntegraller', 'Trigonometric Integrals'),
    concept: tConcept,
    problemStatement: tStatement,
    createProblem: (rng) => tBuild(rng, null),
    solveSteps: tSteps,
    draw: tDraw,
    buildControls(right, getP, h) {
      lab(right, tx('İntegrand', 'Integrand'));
      h.addSelect({ options: TK.map((k, i) => ({ label: `f(x) = ${k.s}`, value: i })), get: () => getP().k, set: (v) => { const p = getP(); p.k = Number(v); tCl(p); } });
      h.addSlider({ caption: tx('Üst sınır b  (adım t: b = t·π/4, t·π/2 ya da t·π/16)', 'Upper limit b  (step t: b = t·π/4, t·π/2 or t·π/16)'), min: 1, max: 4, step: 1,
        get: () => getP().t, set: (v) => { const p = getP(); p.t = Math.round(v); tCl(p); } });
    },
    links: [
      { match: /^• (Tek kuvvet|Odd power):/, make: tGrp([0, 1, 2, 3]) },
      { match: /^• (Her iki kuvvet çift|Both powers even):/, make: tGrp([4, 5, 6, 7]) },
      { match: /^• tan-sec:/, make: tGrp([8, 9, 10, 11]) },
      { match: /^• (Çarpımı topla|Product to sum):/, make: tGrp([12, 13, 14]) },
    ],
    challenge: {
      title: () => tx('Tahmin et, sonra kontrol et', 'Predict, then check'),
      prompt: (p) => { tCl(p); return tx(`${I(0, tBt(p))} ${TK[p.k].s} dx integralinin değeri kaçtır? Uygun özdeşlikle kendin hesapla, sonucu 2 ondalık basamakla yaz.`, `What is the value of ${I(0, tBt(p))} ${TK[p.k].s} dx? Work it out with the suitable identity and give the result to 2 decimals.`); },
      target: (p) => { tCl(p); return tVal0(p); },
      tol: (p) => { tCl(p); return Math.max(0.02, 0.005 * Math.abs(tVal0(p))); },
      hint: (p, g) => { const v = tVal0(tCl(p)); return tx(g > v ? 'Tahminimiz biraz büyük: ½ çarpanını, du işaretini ve sınırları kontrol et.' : 'Tahminimiz biraz küçük: ½ çarpanını, du işaretini ve sınırları kontrol et.',
        g > v ? 'Our guess is a bit too large: re-check the ½ factor, the sign of du and the limits.' : 'Our guess is a bit too small: re-check the ½ factor, the sign of du and the limits.'); },
    },
    _test: { TK, tTerms, tNum, tVal0, tStr, tVal },
  });

  // =====================================================================================================
  //  QUIZ MATERIAL
  // =====================================================================================================
  window.Calc2Quiz = window.Calc2Quiz || { main: [], extra: [] };
  const Q = window.Calc2Quiz;
  const lvl = (n, f) => { f.level = n; return f; };
  const cc = (c) => (c === 1 ? '' : String(c));
  const topicP = () => tx('Kısmi İntegral', 'Integration by Parts');
  const topicT = () => tx('Trigonometrik İntegraller', 'Trigonometric Integrals');
  const Aq = (text, ans, wrongs, notes, sol, rng) => Assessment.num(topicP(), text, ans, sol, rng, { wrongs, notes });

  const qpXex = (rng) => {
    const b = rng.nextInt(1, 4), c = rng.nextInt(1, 4), e = Math.exp(b), v = (b - 1) * e + 1;
    return Aq(`${I(0, b)} ${cc(c)}x·eˣ dx = ?`, c * v, [c * ((b + 1) * e - 1), c * (b - 1) * e, c * b * e, c * ((b - 1) * e - 1)],
      [tx('v du terimindeki işareti yanlış almışsın: ∫ eˣ dx çıkarılmalıydı.', 'Sign slip in the v du term: ∫ eˣ dx must be subtracted.'),
        tx('Alt sınır terimini unutmuşsun (F(0) = −1, çıkarınca +1 gelir).', 'You forgot the lower-limit term (F(0) = −1, subtracting gives +1).'),
        tx('Yalnızca u·v terimini hesaplayıp − ∫ v du kısmını atmışsın.', 'You kept only u·v and dropped the − ∫ v du part.'),
        tx('Alt sınırda F(0) = −1 değerini ters işaretle çıkarmışsın.', 'You used the wrong sign for the lower-limit value F(0) = −1.')],
      ['u = x, dv = eˣ dx ⇒ du = dx, v = eˣ', 'F(x) = (x − 1)eˣ', `${cc(c) ? c + '·' : ''}[F(${b}) − F(0)] = ${cc(c) ? c + '·' : ''}[(${b} − 1)e^${b} + 1] = ${N2(c * v)}`], rng);
  };
  const qpXlnx = (rng) => {
    const b = rng.nextInt(2, 5), l = Math.log(b), v = b * b / 2 * l - (b * b - 1) / 4;
    return Aq(`${I(1, b)} x·ln x dx = ?`, v, [b * b / 2 * l - b * b / 4, b * b / 2 * l, b * b / 2 * l - (b * b - 1) / 2, b * b / 2 * l + (b * b - 1) / 4],
      [tx('Alt sınırdaki F(1) = −1/4 terimini unutmuşsun.', 'You forgot the lower-limit term F(1) = −1/4.'),
        tx('Yalnızca u·v terimini almışsın; − ∫ v du kısmı eksik.', 'You kept only u·v; the − ∫ v du part is missing.'),
        tx('∫ x/2 dx = x²/4 yerine x²/2 yazmışsın (½ çarpanı kayboldu).', 'You wrote ∫ x/2 dx = x²/2 instead of x²/4 (the ½ was lost).'),
        tx('Alt sınır terimini çıkarmak yerine eklemişsin.', 'You added the lower-limit term instead of subtracting it.')],
      ['u = ln x, dv = x dx ⇒ du = dx/x, v = x²/2', 'F(x) = (x²/2)ln x − x²/4', `F(${b}) − F(1) = ${N2(b * b / 2 * l - b * b / 4)} − (−0.25) = ${N2(v)}`], rng);
  };
  const qpXcos = (rng) => {
    const c = rng.nextInt(1, 4);
    return Aq(`${I(0, 'π')} ${cc(c)}x·cos x dx = ?`, -2 * c, [0, 2 * c, -c, -4 * c],
      [tx('Yalnızca [x·sin x] terimini almışsın (π·0 − 0 = 0); − ∫ sin x dx eksik.', 'You kept only [x·sin x] (π·0 − 0 = 0); the − ∫ sin x dx part is missing.'),
        tx('v du terimindeki işareti ters almışsın (F = x·sin x − cos x).', 'Sign slip in v du (you used F = x·sin x − cos x).'),
        tx('Alt sınırdaki cos 0 = 1 terimini unutmuşsun.', 'You forgot the lower-limit term cos 0 = 1.'),
        tx('Sonucu iki katına çıkarmışsın.', 'You doubled the result.')],
      ['u = x, dv = cos x dx ⇒ du = dx, v = sin x', 'F(x) = x·sin x + cos x', `${cc(c) ? c + '·' : ''}[F(π) − F(0)] = ${cc(c) ? c + '·' : ''}[(0 − 1) − (0 + 1)] = ${-2 * c}`], rng);
  };
  Q.main.push(lvl(2, (rng) => rng.pick([qpXex, qpXlnx, qpXcos])(rng)));

  const LIATE = [
    { int: 'x·eˣ', u: 'x', dv: 'eˣ dx', sw: 'u = eˣ,  dv = x dx' },
    { int: 'x·ln x', u: 'ln x', dv: 'x dx', sw: 'u = x,  dv = ln x dx' },
    { int: 'x·cos x', u: 'x', dv: 'cos x dx', sw: 'u = cos x,  dv = x dx' },
    { int: 'x²·sin x', u: 'x²', dv: 'sin x dx', sw: 'u = sin x,  dv = x² dx' },
    { int: 'arctan x', u: 'arctan x', dv: 'dx', sw: 'u = 1,  dv = arctan x dx' },
    { int: 'ln x', u: 'ln x', dv: 'dx', sw: 'u = 1,  dv = ln x dx' },
  ];
  const qpLiate = lvl(1, (rng) => {
    const i = rng.nextInt(0, LIATE.length), e = LIATE[i];
    const others = LIATE.filter((_, j) => j !== i);
    const o1 = rng.pick(others), o2 = rng.pick(others.filter((x) => x !== o1));
    const f = (x) => `u = ${x.u},  dv = ${x.dv}`;
    return makeQuestion(topicP(), tx(`∫ ${e.int} dx integralinde LIATE kuralına göre kısmi integral için en uygun seçim hangisidir?`, `For ∫ ${e.int} dx, which choice is best for integration by parts according to LIATE?`),
      f(e), [e.sw, f(o1), f(o2)],
      [tx(`LIATE: ${e.u} listede önce gelir, u o olmalı; dv = ${e.dv}.`, `LIATE: ${e.u} comes first in the list, so it must be u; dv = ${e.dv}.`)], rng,
      [tx('u ile dv ters seçilmiş: integral kolaylaşmak yerine zorlaşır.', 'u and dv are swapped: the integral gets harder instead of easier.'),
        tx('Bu seçim başka bir integrale uygun; buradaki çarpanlarla uyuşmuyor.', 'This choice belongs to another integral; it does not match the factors here.'),
        tx('Bu seçim başka bir integrale uygun; buradaki çarpanlarla uyuşmuyor.', 'This choice belongs to another integral; it does not match the factors here.')]);
  });
  const INDEF = [
    { int: 'x·eˣ', a: 'x·eˣ − eˣ + C', w: ['x·eˣ + eˣ + C', '(x²/2)·eˣ + C', 'x·eˣ + C'] },
    { int: 'x·sin x', a: '−x·cos x + sin x + C', w: ['−x·cos x − sin x + C', '−(x²/2)·cos x + C', 'x·cos x + sin x + C'] },
    { int: 'x·cos x', a: 'x·sin x + cos x + C', w: ['x·sin x − cos x + C', '(x²/2)·sin x + C', 'x·sin x + C'] },
  ];
  const qpIndef = lvl(1, (rng) => {
    const d = rng.pick(INDEF);
    return makeQuestion(topicP(), `∫ ${d.int} dx = ?`, d.a, d.w,
      [tx('u = x, dv ve v du tablosunu kur: ∫ u dv = u·v − ∫ v du.', 'Set up u = x and the table of dv, v, du: ∫ u dv = u·v − ∫ v du.'), `∫ ${d.int} dx = ${d.a}`], rng,
      [tx('v du integralinin işaretini yanlış almışsın.', 'Sign slip in the ∫ v du term.'), tx('Çarpanları ayrı ayrı integre etmişsin (∫u·∫dv): kısmi integral böyle çalışmaz.', 'You integrated the factors separately (∫u·∫dv): that is not how parts works.'),
        tx('Yalnızca u·v terimini yazmışsın; − ∫ v du eksik.', 'You wrote only u·v; the − ∫ v du part is missing.')]);
  });
  const qpAtan = lvl(2, (rng) => {
    const b = rng.nextInt(1, 4), at = Math.atan(b), l = Math.log(1 + b * b), v = b * at - l / 2;
    return Aq(`${I(0, b)} arctan x dx = ?`, v, [b * at, b * at + l / 2, b * at - l, b * at - at],
      [tx('Yalnızca u·v terimini almışsın; − ∫ x/(1 + x²) dx eksik.', 'You kept only u·v; the − ∫ x/(1 + x²) dx part is missing.'),
        tx('∫ v du teriminin işaretini yanlış almışsın.', 'Sign slip in the ∫ v du term.'),
        tx('∫ x/(1 + x²) dx = ½ ln(1 + x²) yerine ln(1 + x²) yazmışsın.', 'You wrote ∫ x/(1 + x²) dx = ln(1 + x²) instead of ½ ln(1 + x²).'),
        tx('∫ x/(1 + x²) dx’i arctan x sanmışsın.', 'You took ∫ x/(1 + x²) dx to be arctan x.')],
      ['u = arctan x, dv = dx ⇒ du = dx/(1 + x²), v = x', 'F(x) = x·arctan x − ½ ln(1 + x²)', `F(${b}) − F(0) = ${N2(v)}`], rng);
  });
  const qpX2ex = lvl(3, (rng) => {
    const b = rng.nextInt(1, 3), e = Math.exp(b), v = (b * b - 2 * b + 2) * e - 2;
    return Aq(`${I(0, b)} x²·eˣ dx = ?`, v, [(b * b + 2 * b + 2) * e - 2, (b * b - 2 * b + 2) * e, (b * b - b + 1) * e - 1, (b * b - 2 * b) * e - 2],
      [tx('İkinci turda işareti yanlış almışsın (−2 yerine +2).', 'Sign slip in round two (+2 instead of −2).'),
        tx('Alt sınır terimi F(0) = 2’yi çıkarmayı unutmuşsun.', 'You forgot to subtract the lower-limit value F(0) = 2.'),
        tx('du = 2x dx’teki 2 çarpanını atmışsın.', 'You dropped the factor 2 of du = 2x dx.'),
        tx('İkinci turun sabit terimini (+2eˣ) yazmamışsın.', 'You left out the constant term (+2eˣ) of the second round.')],
      [tx('1. tur: u = x², dv = eˣ dx ⇒ ∫ x²eˣ dx = x²eˣ − 2∫ x·eˣ dx', 'Round 1: u = x², dv = eˣ dx ⇒ ∫ x²eˣ dx = x²eˣ − 2∫ x·eˣ dx'),
        tx('2. tur: ∫ x·eˣ dx = x·eˣ − eˣ ⇒ F(x) = (x² − 2x + 2)eˣ', 'Round 2: ∫ x·eˣ dx = x·eˣ − eˣ ⇒ F(x) = (x² − 2x + 2)eˣ'), `F(${b}) − F(0) = ${N2(v)}`], rng);
  });
  const qpCyc = lvl(3, (rng) => {
    const m = rng.nextInt(1, 4), [s, c] = sc(m), e = Math.exp(m * PI / 2), v = (e * (s - c) + 1) / 2;
    return Aq(`${I(0, bsym(m))} eˣ·sin x dx = ?`, v, [e * (s - c) / 2, e * (s - c) + 1, (e * (s + c) + 1) / 2, (e * (s - c) - 1) / 2],
      [tx('Alt sınır terimi +½’yi unutmuşsun.', 'You forgot the lower-limit term +½.'),
        tx('Döngüden gelen 2J = … denkleminde ikiye bölmeyi unutmuşsun.', 'You forgot to divide by 2 in the cycle equation 2J = ….'),
        tx('F(x)’i eˣ(sin x + cos x)/2 yazmışsın (işaret hatası).', 'You wrote F(x) = eˣ(sin x + cos x)/2 (sign slip).'),
        tx('Alt sınır teriminin işaretini ters almışsın (−½ yerine +½).', 'Sign slip at the lower limit (−½ instead of +½).')],
      ['J = ∫ eˣ sin x dx = eˣ sin x − ∫ eˣ cos x dx = eˣ sin x − eˣ cos x − J', '2J = eˣ(sin x − cos x) ⇒ F(x) = eˣ(sin x − cos x)/2', `F(b) − F(0) = ${N2(v)}`], rng);
  });
  const qpLn = lvl(2, (rng) => {
    const b = rng.nextInt(2, 6), l = Math.log(b), v = b * l - b + 1;
    return Aq(`${I(1, b)} ln x dx = ?`, v, [b * l - b, b * l - b - 1, (b - 1) * l, b * l + b - 1],
      [tx('Alt sınır terimi +1’i (F(1) = −1) unutmuşsun.', 'You forgot the lower-limit term +1 (F(1) = −1).'),
        tx('Alt sınır değerini ters işaretle çıkarmışsın.', 'Wrong sign for the lower-limit value.'),
        tx('∫ ln x dx’i çarpanları ayrı ayrı integre ederek (b − 1)·ln b bulmuşsun.', 'You integrated the factors separately and got (b − 1)·ln b.'),
        tx('− ∫ dx teriminin işaretini ters almışsın.', 'Sign slip in the − ∫ dx term.')],
      ['u = ln x, dv = dx ⇒ du = dx/x, v = x', 'F(x) = x·ln x − x', `F(${b}) − F(1) = ${N2(v)}`], rng);
  });
  Q.extra.push(qpLiate, qpIndef, qpAtan, qpX2ex, qpCyc, qpLn);

  // ---- trigonometric integrals ----
  const pf = (n, d) => piS(n / d);
  const mkT = (text, ans, wr, notes, sol, rng) => makeQuestion(topicT(), text, ans, wr, sol, rng, notes);
  const ODD = [
    { tk: 0, s: 'sin³x', a: '2/3', w: ['1/3', '−2/3', '4/3', '1'],
      n: ['Yalnızca u³/3’ü almışsın; (1 − u²) içindeki 1 terimi kayıp.', 'du = −sin x dx işaretini ve sınırların çevrilmesini yanlış yapmışsın.', 'Sonucu iki katına çıkarmışsın.', 'Kuvveti düşürmeden sin²x’in integraliyle karıştırmışsın.'],
      e: ['You kept only u³/3; the 1 inside (1 − u²) is lost.', 'Sign/limit slip from du = −sin x dx.', 'You doubled the result.', 'You mixed it up with the integral of sin²x.'] },
    { tk: 3, s: 'cos³x', a: '2/3', w: ['1/3', '−2/3', '4/3', '1'],
      n: ['Yalnızca u³/3’ü almışsın; (1 − u²) içindeki 1 terimi kayıp.', 'İşaret hatası yapmışsın.', 'Sonucu iki katına çıkarmışsın.', 'cos³x ile cos²x’i karıştırmışsın.'],
      e: ['You kept only u³/3; the 1 inside (1 − u²) is lost.', 'Sign slip.', 'You doubled the result.', 'You mixed up cos³x and cos²x.'] },
    { tk: 1, s: 'sin²x·cos³x', a: '2/15', w: ['1/3', '1/5', '−2/15', '4/15'],
      n: ['cos²x = 1 − sin²x çarpanını kullanmayıp yalnızca ∫ u² du = 1/3 almışsın.', 'Yalnızca −u⁵/5 terimini almışsın.', 'İşaret hatası yapmışsın.', 'Sonucu iki katına çıkarmışsın.'],
      e: ['You skipped the factor cos²x = 1 − sin²x and took only ∫ u² du = 1/3.', 'You kept only the −u⁵/5 term.', 'Sign slip.', 'You doubled the result.'] },
    { tk: 2, s: 'sin³x·cos²x', a: '2/15', w: ['1/3', '1/5', '−2/15', '4/15'],
      n: ['sin² = 1 − cos² çarpanını unutup yalnızca ∫ u² du = 1/3 almışsın.', 'Yalnızca u⁵/5 terimini almışsın.', 'du = −sin x dx işaretinden dolayı işaret hatası.', 'Sonucu iki katına çıkarmışsın.'],
      e: ['You forgot sin² = 1 − cos² and took only ∫ u² du = 1/3.', 'You kept only the u⁵/5 term.', 'Sign slip from du = −sin x dx.', 'You doubled the result.'] },
  ];
  Q.main.push(lvl(2, (rng) => {
    const d = rng.pick(ODD);
    return mkT(`${I(0, 'π/2')} ${d.s} dx = ?`, d.a, d.w, d.n.map((t, j) => tx(t, d.e[j])),
      [tx('Tek kuvvetli çarpandan birini ayır, kalanı 1 − (…)² ile çevir, u-yerine koy.', 'Save one factor of the odd power, convert the rest with 1 − (…)², and substitute u.'), TK[d.tk].chain, `${I(0, 'π/2')} ${d.s} dx = ${d.a}`], rng);
  }));

  const qtEven = lvl(1, (rng) => {
    const S = rng.nextInt(0, 2) === 0
      ? { s: 'sin²x', hi: 'π', a: pf(1, 2), w: [pf(1, 1), pf(1, 4), '1', pf(1, 8)], ch: 'sin²x = (1 − cos 2x)/2  ⇒  [x/2 − sin 2x/4]₀^π = π/2' }
      : { s: 'cos²x', hi: 'π/2', a: pf(1, 4), w: [pf(1, 2), pf(1, 8), '1/2', pf(3, 4)], ch: 'cos²x = (1 + cos 2x)/2  ⇒  [x/2 + sin 2x/4]₀^{π/2} = π/4' };
    return mkT(`${I(0, S.hi)} ${S.s} dx = ?`, S.a, S.w,
      [tx('Yarım açı formülündeki ½ çarpanını unutmuşsun.', 'You forgot the ½ in the half-angle formula.'),
        tx('Yarım açı özdeşliği yerine kuvvet kuralı gibi bir şey uygulamışsın.', 'You applied a power-rule style step instead of the half-angle identity.'),
        tx('∫cos 2x dx = sin 2x/2’deki iç fonksiyon düzeltmesini ya da sınır değerini yanlış hesaplamışsın.', 'Slip in the inner-function factor of ∫cos 2x dx or in the limits.'),
        tx('Sınırlarda bir aritmetik hata yapmışsın.', 'Arithmetic slip at the limits.')],
      [tx('Çift kuvvet ⇒ yarım açı özdeşliği.', 'Even power ⇒ half-angle identity.'), S.ch], rng);
  });
  const TS = [
    { s: 'tan²x', a: `1 − ${pf(1, 4)}`, w: [`${pf(1, 4)} − 1`, `1 + ${pf(1, 4)}`, '1', `1 − ${pf(1, 2)}`],
      n: ['İşareti ters almışsın.', 'tan²x = sec²x − 1 yerine sec²x + 1 kullanmışsın.', '−x terimini unutup yalnızca tan x’i almışsın.', 'Üst sınırda π/4 yerine π/2 koymuşsun.'],
      e: ['Sign slip.', 'You used sec²x + 1 instead of sec²x − 1.', 'You dropped the −x term and kept only tan x.', 'You used π/2 instead of π/4 as the upper limit.'], ch: 'tan²x = sec²x − 1  ⇒  [tan x − x]₀^{π/4} = 1 − π/4' },
    { s: 'sec⁴x', a: '4/3', w: ['2/3', '1', '8/3', '4'],
      n: ['u³/3’teki 1/3 çarpanını yanlış almışsın.', 'Yalnızca tan x’i almışsın.', 'Sonucu iki katına çıkarmışsın.', 'u³/3 yerine u³ almışsın (1/3 çarpanı kayıp).'],
      e: ['Slip with the 1/3 of u³/3.', 'You kept only tan x.', 'You doubled the result.', 'You took u³ instead of u³/3.'], ch: 'sec⁴x = (1 + tan²x)sec²x, u = tan x  ⇒  [tan x + tan³x/3]₀^{π/4} = 1 + 1/3 = 4/3' },
    { s: 'tan²x·sec²x', a: '1/3', w: ['1', '2/3', '1/9', '1/2'],
      n: ['u³/3 yerine u³ almışsın (1/3 çarpanı kayıp).', 'Sonucu iki katına çıkarmışsın.', 'Payda hatası: 1/9 bulmuşsun.', 'u²/2 almışsın (kuvvet kuralı hatası).'],
      e: ['You took u³ instead of u³/3.', 'You doubled the result.', 'Denominator slip: 1/9.', 'You took u²/2 (power-rule slip).'], ch: 'u = tan x, du = sec²x dx; x: 0 → π/4 ⇒ u: 0 → 1  ⇒  ∫_0^1 u² du = 1/3' },
  ];
  const qtTan = lvl(2, (rng) => {
    const d = rng.pick(TS);
    return mkT(`${I(0, 'π/4')} ${d.s} dx = ?`, d.a, d.w, d.n.map((t, j) => tx(t, d.e[j])), [tx('tan-sec durumu: uygun özdeşlik ve u-yerine koyma.', 'tan-sec case: suitable identity and substitution.'), d.ch], rng);
  });
  const PR = [
    { s: 'sin 3x·cos 2x', hi: 'π/2', a: '3/5', w: ['6/5', '1/10', '1/2', '−3/5'], ch: 'sin 3x cos 2x = ½[sin 5x + sin x]  ⇒  ½(1/5 + 1) = 3/5' },
    { s: 'sin 3x·cos 2x', hi: 'π', a: '6/5', w: ['12/5', '3/5', '1/5', '0'], ch: 'sin 3x cos 2x = ½[sin 5x + sin x]  ⇒  ½(2/5 + 2) = 6/5' },
    { s: 'sin 2x·cos x', hi: 'π', a: '4/3', w: ['8/3', '1/3', '1', '2/3'], ch: 'sin 2x cos x = ½[sin 3x + sin x]  ⇒  ½(2/3 + 2) = 4/3' },
  ];
  const qtProd = lvl(2, (rng) => {
    const d = rng.pick(PR);
    return mkT(`${I(0, d.hi)} ${d.s} dx = ?`, d.a, d.w,
      [tx('Çarpımı toplama çevirirken ½ çarpanını unutmuşsun.', 'You forgot the ½ when converting the product to a sum.'), tx('İki terimden yalnızca birini integre etmişsin.', 'You integrated only one of the two terms.'),
        tx('Bir terimin integralini ya da ½ çarpanını yanlış birleştirmişsin.', 'You combined a term or the ½ factor wrongly.'), tx('Kosinüs değerlerinin işaretini (cos kπ) yanlış almışsın.', 'Sign slip in the cosine values (cos kπ).')],
      [tx('Çarpımı toplama çevir.', 'Product to sum.'), d.ch], rng);
  });
  const qtHard = lvl(3, (rng) => {
    const S = rng.nextInt(0, 2) === 0
      ? { s: 'sin⁴x', a: pf(3, 16), w: [pf(3, 8), pf(1, 4), pf(3, 32), pf(1, 16)], ch: 'sin⁴x = 3/8 − cos 2x/2 + cos 4x/8  ⇒  [3x/8 − sin 2x/4 + sin 4x/32]₀^{π/2} = 3π/16',
        n: ['Aralığı [0, π] almışsın (iki kat).', 'sin⁴x yerine sin²x’i integre etmişsin.', 'Sabit terimi 3/8 yerine 3/16 almışsın.', 'Yalnızca bir çarpanı (1/16) almışsın.'], e: ['You used [0, π] (double).', 'You integrated sin²x instead of sin⁴x.', 'You used 3/16 instead of 3/8 for the constant term.', 'You kept only a 1/16 factor.'] }
      : { s: 'sin²x·cos²x', a: pf(1, 16), w: [pf(1, 8), pf(1, 32), pf(1, 4), pf(3, 16)], ch: 'sin²x cos²x = (1 − cos 4x)/8  ⇒  [x/8 − sin 4x/32]₀^{π/2} = π/16',
        n: ['sin²x cos²x = sin²2x/4 adımında 4’ü unutmuşsun.', 'Çarpanı 1/32 almışsın.', 'sin²x cos²x yerine sin²x’i integre etmişsin.', 'Parçaların toplamında hata yapmışsın.'], e: ['You forgot the 4 in sin²2x/4.', 'You used a factor 1/32.', 'You integrated sin²x instead of sin²x cos²x.', 'Slip when adding the pieces.'] };
    return mkT(`${I(0, 'π/2')} ${S.s} dx = ?`, S.a, S.w, S.n.map((t, j) => tx(t, S.e[j])), [tx('Her iki kuvvet çift ⇒ yarım açı özdeşliği (gerekirse iki kez).', 'Both powers even ⇒ half-angle identity (twice if needed).'), S.ch], rng);
  });
  const qtOddPi = lvl(2, (rng) => {
    const S = rng.nextInt(0, 2) === 0
      ? { s: 'sin³x', a: '4/3', w: ['2/3', '0', '−4/3', '8/3'], ch: '[−cos x + cos³x/3]₀^π = (1 − 1/3) − (−1 + 1/3) = 4/3' }
      : { s: 'cos³x', a: '0', w: ['2/3', '4/3', '−2/3', '1/3'], ch: '[sin x − sin³x/3]₀^π = 0 − 0 = 0' };
    return mkT(`${I(0, 'π')} ${S.s} dx = ?`, S.a, S.w,
      [tx('[0, π/2] için hesaplamışsın; [0, π] aralığında ikinci yarı da eklenmeli (ya da simetri kullanılmalı).', 'You computed as for [0, π/2]; on [0, π] the other half must be added (or use symmetry).'),
        tx('sin³x ile cos³x’in [0, π] üzerindeki davranışını karıştırmışsın.', 'You mixed up the behaviour of sin³x and cos³x on [0, π].'),
        tx('F(π) − F(0) işaretini ters almışsın.', 'You reversed the sign of F(π) − F(0).'), tx('Sonucu iki katına çıkarmışsın.', 'You doubled the result.')],
      [tx('Tek kuvvet ⇒ u-yerine koyma; ters türevi 0 ve π’de değerlendir.', 'Odd power ⇒ substitution; evaluate the antiderivative at 0 and π.'), S.ch], rng);
  });
  Q.extra.push(qtEven, qtTan, qtProd, qtHard, qtOddPi);
})();
