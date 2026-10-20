// Hyperbolic Functions (chapter 'functions'). Thomas 7.3, Stewart 3.11.
// problem.kind: 'eval' | 'identity' | 'deriv' | 'integ' | 'solve' | 'invEval' | 'catenary'
// Sliders: t (argument: point on cosh, sinh, tangent slope and the unit hyperbola x = cosh t, y = sinh t) and a (catenary parameter).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dec === undefined ? 4 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    n = n / g; d = d / g;
    if (n === 0) { n = 0; d = 1; }
    return { n, d };
  }
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  const frV = (x) => x.n / x.d;
  const fadd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
  const fsub = (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
  const fmul = (a, b) => fr(a.n * b.n, a.d * b.d);
  const fdiv = (a, b) => fr(a.n * b.d, a.d * b.n);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const nice = (v, list) => list.find((q) => q >= v) || list[list.length - 1];
  // exact values at x = ln n
  const shN = (n) => fr(n * n - 1, 2 * n);
  const chN = (n) => fr(n * n + 1, 2 * n);
  const ks = (k) => (k === 1 ? '' : (k === -1 ? '−' : S(k)));
  const cosh = Math.cosh, sinh = Math.sinh, tanh = Math.tanh;
  const sech = (x) => 1 / Math.cosh(x);

  // ---- derivative table ----
  // f, d: functions of (x, k); sf: text of f; sd: text of f'; rule: [tr, en] explanation; sub(x0,k): text of the substitution
  const DER = [
    { f: (x, k) => sinh(k * x), d: (x, k) => k * cosh(k * x), sf: (k) => `sinh(${ks(k)}x)`, sd: (k) => `${S(k)}·cosh(${ks(k)}x)`, u: (k) => `${ks(k)}x`, up: (k) => S(k), out: 'sinh', outd: 'cosh u',
      sub: (x, k) => `${P(k)}·cosh(${nf(k * x, 3)}) = ${P(k)}·${nf(cosh(k * x), 4)}` },
    { f: (x, k) => cosh(k * x), d: (x, k) => k * sinh(k * x), sf: (k) => `cosh(${ks(k)}x)`, sd: (k) => `${S(k)}·sinh(${ks(k)}x)`, u: (k) => `${ks(k)}x`, up: (k) => S(k), out: 'cosh', outd: 'sinh u',
      sub: (x, k) => `${P(k)}·sinh(${nf(k * x, 3)}) = ${P(k)}·${nf(sinh(k * x), 4)}` },
    { f: (x, k) => tanh(k * x), d: (x, k) => k * sech(k * x) ** 2, sf: (k) => `tanh(${ks(k)}x)`, sd: (k) => `${S(k)}·sech²(${ks(k)}x)`, u: (k) => `${ks(k)}x`, up: (k) => S(k), out: 'tanh', outd: 'sech² u',
      sub: (x, k) => `${P(k)}·sech²(${nf(k * x, 3)}) = ${P(k)}/cosh²(${nf(k * x, 3)}) = ${P(k)}/${nf(cosh(k * x) ** 2, 4)}` },
    { f: (x) => cosh(x) ** 2, d: (x) => 2 * cosh(x) * sinh(x), sf: () => 'cosh²x', sd: () => '2·cosh x·sinh x  (= sinh 2x)', u: () => 'cosh x', up: () => 'sinh x', out: 'u²', outd: '2u',
      sub: (x) => `2·cosh(${S(x)})·sinh(${S(x)}) = 2·${nf(cosh(x), 4)}·${nf(sinh(x), 4)}` },
    { f: (x) => sinh(x * x), d: (x) => 2 * x * cosh(x * x), sf: () => 'sinh(x²)', sd: () => '2x·cosh(x²)', u: () => 'x²', up: () => '2x', out: 'sinh', outd: 'cosh u',
      sub: (x) => `2·${P(x)}·cosh(${S(x * x)}) = ${S(2 * x)}·${nf(cosh(x * x), 4)}` },
    { f: (x) => tanh(x * x), d: (x) => 2 * x * sech(x * x) ** 2, sf: () => 'tanh(x²)', sd: () => '2x·sech²(x²)', u: () => 'x²', up: () => '2x', out: 'tanh', outd: 'sech² u',
      sub: (x) => `2·${P(x)}·sech²(${S(x * x)}) = ${S(2 * x)}/cosh²(${S(x * x)}) = ${S(2 * x)}/${nf(cosh(x * x) ** 2, 4)}` },
    { f: (x) => Math.log(cosh(x)), d: (x) => tanh(x), sf: () => 'ln(cosh x)', sd: () => 'sinh x / cosh x = tanh x', u: () => 'cosh x', up: () => 'sinh x', out: 'ln', outd: '1/u',
      sub: (x) => `tanh(${S(x)}) = ${nf(sinh(x), 4)}/${nf(cosh(x), 4)}` },
    { f: (x) => x * sinh(x), d: (x) => sinh(x) + x * cosh(x), sf: () => 'x·sinh x', sd: () => 'sinh x + x·cosh x', u: () => '', up: () => '', out: 'prod', outd: '',
      sub: (x) => `sinh(${S(x)}) + ${P(x)}·cosh(${S(x)}) = ${nf(sinh(x), 4)} + ${P(x)}·${nf(cosh(x), 4)}` },
    { f: (x) => sech(x), d: (x) => -sech(x) * tanh(x), sf: () => 'sech x', sd: () => '−sech x·tanh x', u: () => 'cosh x', up: () => 'sinh x', out: 'sech', outd: '',
      sub: (x) => `−sech(${S(x)})·tanh(${S(x)}) = −${nf(sech(x), 4)}·${nf(tanh(x), 4)}` },
  ];
  const INT = [
    { f: (x, k) => cosh(k * x), F: (c, k) => sinh(k * c) / k, sf: (k) => `cosh(${ks(k)}x)`, sF: (k) => (k === 1 ? 'sinh x' : `sinh(${k}x)/${k}`), ev: (c, k) => `[sinh(${k}x)${k === 1 ? '' : '/' + k}]₀^${c} = sinh(${k * c})${k === 1 ? '' : '/' + k} − sinh 0` },
    { f: (x, k) => sinh(k * x), F: (c, k) => (cosh(k * c) - 1) / k, sf: (k) => `sinh(${ks(k)}x)`, sF: (k) => (k === 1 ? 'cosh x' : `cosh(${k}x)/${k}`), ev: (c, k) => `[cosh(${k}x)${k === 1 ? '' : '/' + k}]₀^${c} = (cosh(${k * c}) − cosh 0)${k === 1 ? '' : '/' + k}` },
    { f: (x, k) => sech(k * x) ** 2, F: (c, k) => tanh(k * c) / k, sf: (k) => `sech²(${ks(k)}x)`, sF: (k) => (k === 1 ? 'tanh x' : `tanh(${k}x)/${k}`), ev: (c, k) => `[tanh(${k}x)${k === 1 ? '' : '/' + k}]₀^${c} = tanh(${k * c})${k === 1 ? '' : '/' + k} − tanh 0` },
    { f: (x) => tanh(x), F: (c) => Math.log(cosh(c)), sf: () => 'tanh x', sF: () => 'ln(cosh x)', ev: (c) => `[ln(cosh x)]₀^${c} = ln(cosh ${c}) − ln(cosh 0)` },
  ];

  // ---------- problem generation ----------
  function createProblem(rng) {
    const kinds = ['eval', 'eval', 'identity', 'identity', 'deriv', 'deriv', 'deriv', 'integ', 'solve', 'solve', 'invEval', 'catenary', 'catenary'];
    const kind = rng.pick(kinds);
    const p = { kind, pts: [], view: { X: 6, Y: 6 } };
    p.t = 1; p.a = 1.5;
    if (kind === 'eval') {
      p.n = rng.pick([2, 3, 4, 5, 6, 7, 9]); p.sg = rng.pick([1, 1, -1]); p.ask = rng.nextInt(0, 3) === 0 ? 'rec' : 'main';
      p.x = p.sg * Math.log(p.n); p.t = clamp(p.x, -2.5, 2.5);
      p.pts = [{ x: p.x, y: sinh(p.x), l: true }, { x: p.x, y: cosh(p.x), l: true }, { x: p.x, y: tanh(p.x), l: true }];
    } else if (kind === 'identity') {
      p.id = rng.nextInt(0, 5); p.an = rng.pick([2, 3, 4, 5]); p.bn = rng.pick([2, 3, 4]);
      p.x = Math.log(p.an); p.y = Math.log(p.bn); p.t = clamp(p.x, -2.5, 2.5);
      p.pts = [{ x: p.x, y: sinh(p.x), l: true }, { x: p.x, y: cosh(p.x), l: true }];
    } else if (kind === 'deriv') {
      p.ci = rng.nextInt(0, DER.length); p.k = rng.pick([2, 3, -1, 2, 4, -2]); p.x0 = rng.pick([0, 1, 1, 2, -1]);
      if (p.ci === 8 && p.x0 === 0) p.x0 = 1;
      if (p.ci === 7 && p.x0 === 0) p.x0 = 1;
      p.t = clamp(p.x0, -2.5, 2.5);
      const v = DER[p.ci].f(p.x0, p.k);
      p.vz = nice(Math.abs(v) * 1.2 + 1, [6, 8, 10, 15, 20, 30]);
      p.view = { X: 4, Y: 6 };
      const e = DER[p.ci];
      let mx = 0; for (let x = -4; x <= 4; x += 0.1) { const y = e.f(x, p.k); if (isFinite(y)) mx = Math.max(mx, Math.min(Math.abs(y), 40)); }
      p.view = { X: 4, Y: nice(Math.max(4, Math.abs(e.f(p.x0, p.k)) * 1.3, Math.abs(e.d(p.x0, p.k)) * 1.2), [5, 6, 8, 10, 15, 20, 30]) };
    } else if (kind === 'integ') {
      p.ci = rng.nextInt(0, INT.length); p.k = p.ci === 3 ? 1 : rng.pick([1, 2, 3]); p.c = rng.pick([1, 2]);
      if (p.ci === 0 && p.k === 3 && p.c === 2) p.c = 1;
      p.t = 1;
      const y = INT[p.ci].f(p.c, p.k);
      p.view = { X: 4, Y: nice(Math.max(4, Math.abs(y) * 1.3), [5, 6, 8, 10, 15, 20, 30, 60]) };
      p.val = INT[p.ci].F(p.c, p.k) - INT[p.ci].F(0, p.k);
    } else if (kind === 'solve') {
      p.st = rng.nextInt(0, 3); p.ex = rng.nextInt(0, 2) === 0; p.sg = rng.pick([1, -1]);
      if (p.ex) {
        p.n = rng.pick([2, 3, 4, 5]);
        if (p.st === 0) p.c = fr(p.sg * (p.n * p.n - 1), 2 * p.n);
        else if (p.st === 1) p.c = chN(p.n);
        else p.c = fr(p.sg * (p.n * p.n - 1), p.n * p.n + 1);
      } else {
        if (p.st === 0) p.c = fr(p.sg * rng.nextInt(1, 6));
        else if (p.st === 1) p.c = fr(rng.nextInt(2, 7));
        else p.c = rng.pick([fr(1, 2), fr(1, 3), fr(2, 3), fr(3, 4), fr(-1, 2), fr(-2, 3)]);
      }
      const c = frV(p.c);
      if (p.st === 0) p.xs = Math.asinh(c);
      else if (p.st === 1) p.xs = Math.acosh(c);
      else p.xs = Math.atanh(c);
      p.t = clamp(p.xs, -2.5, 2.5);
      p.pts = [{ x: p.xs, y: c, l: true }];
      if (p.st === 1) p.pts.push({ x: -p.xs, y: c, l: true });
    } else if (kind === 'invEval') {
      p.it = rng.nextInt(0, 3); p.ex = rng.nextInt(0, 2) === 0;
      if (p.ex) {
        p.n = rng.pick([2, 3, 4, 5]);
        p.c = p.it === 0 ? shN(p.n) : (p.it === 1 ? chN(p.n) : fr(p.n * p.n - 1, p.n * p.n + 1));
      } else {
        p.c = p.it === 0 ? fr(rng.nextInt(1, 6)) : (p.it === 1 ? fr(rng.nextInt(2, 7)) : rng.pick([fr(1, 2), fr(1, 3), fr(2, 3), fr(3, 4)]));
      }
      const c = frV(p.c);
      p.val = p.it === 0 ? Math.asinh(c) : (p.it === 1 ? Math.acosh(c) : Math.atanh(c));
      p.t = clamp(p.val, -2.5, 2.5);
      p.pts = [{ x: p.val, y: c, l: true }];
    } else { // catenary
      p.ca = rng.pick([2, 3, 4, 5]); p.w = rng.pick([2, 3, 4, 5, 6]);
      if (p.w > 2 * p.ca) p.w = 2 * p.ca;
      p.a = clamp(p.ca * 0.5, 0.5, 3); p.t = 1;
      const yw = p.ca * cosh(p.w / p.ca);
      p.view = { X: nice(p.w + 2, [4, 5, 6, 8, 10, 12]), Y: nice(yw * 1.25, [5, 6, 8, 10, 12, 15, 20, 30]) };
      p.pts = [{ x: 0, y: p.ca, l: true }, { x: p.w, y: yw, l: true }, { x: -p.w, y: yw, l: false }];
    }
    p.ex = p.kind === 'solve' || p.kind === 'invEval' ? p.ex : undefined;
    p.ctl = { t: clamp(Math.round(p.t * 10) / 10, -2.5, 2.5), a: clamp(Math.round(p.a * 2) / 2, 0.5, 3) };
    return p;
  }

  // ---------- problem statement ----------
  function problemStatement(p) {
    switch (p.kind) {
      case 'eval': {
        const xs = `${p.sg < 0 ? '−' : ''}ln ${p.n}`;
        return p.ask === 'main'
          ? Tx(`x = ${xs} için sinh x, cosh x ve tanh x değerlerini tam değer olarak bulalım. cosh²x − sinh²x = 1 eşitliği sağlanıyor mu?`,
            `For x = ${xs}, let's find the exact values of sinh x, cosh x and tanh x. Is cosh²x − sinh²x = 1 satisfied?`)
          : Tx(`x = ${xs} için coth x, sech x ve csch x değerlerini tam değer olarak bulalım.`, `For x = ${xs}, let's find the exact values of coth x, sech x and csch x.`);
      }
      case 'identity': {
        const a = p.an, b = p.bn;
        const t = [
          [`cosh²x − sinh²x = 1 özdeşliğini x = ln ${a} için sayısal olarak doğrulayalım, sonra cebirsel olarak da gösterelim.`, `Let's verify the identity cosh²x − sinh²x = 1 numerically at x = ln ${a}, and then show it algebraically.`],
          [`sinh 2x = 2·sinh x·cosh x özdeşliğini x = ln ${a} için sayısal olarak doğrulayalım ve cebirsel olarak gösterelim.`, `Let's verify the identity sinh 2x = 2·sinh x·cosh x numerically at x = ln ${a} and show it algebraically.`],
          [`cosh 2x = cosh²x + sinh²x özdeşliğini x = ln ${a} için doğrulayalım ve cebirsel olarak gösterelim.`, `Let's verify the identity cosh 2x = cosh²x + sinh²x at x = ln ${a} and show it algebraically.`],
          [`sinh(x + y) = sinh x·cosh y + cosh x·sinh y özdeşliğini x = ln ${a}, y = ln ${b} için doğrulayalım ve cebirsel olarak gösterelim.`, `Let's verify sinh(x + y) = sinh x·cosh y + cosh x·sinh y at x = ln ${a}, y = ln ${b} and show it algebraically.`],
          [`1 − tanh²x = sech²x özdeşliğini x = ln ${a} için doğrulayalım ve cebirsel olarak gösterelim.`, `Let's verify the identity 1 − tanh²x = sech²x at x = ln ${a} and show it algebraically.`],
        ][p.id];
        return Tx(t[0], t[1]);
      }
      case 'deriv': {
        const e = DER[p.ci], f = e.sf(p.k);
        return Tx(`f(x) = ${f} fonksiyonunun türevini bulalım ve f′(${S(p.x0)}) değerini hesaplayalım.`, `Let's find the derivative of f(x) = ${f} and compute f′(${S(p.x0)}).`);
      }
      case 'integ': {
        const e = INT[p.ci], f = e.sf(p.k);
        return Tx(`${f} fonksiyonunun x = 0'dan x = ${p.c}'ye integralini hesaplayalım (grafikte eğri altındaki alan).`, `Let's evaluate the integral of ${f} from x = 0 to x = ${p.c} (the area under the curve).`);
      }
      case 'solve': {
        const nm = ['sinh x', 'cosh x', 'tanh x'][p.st], c = frS(p.c);
        return Tx(`${nm} = ${c} denklemini, hiperbolik fonksiyonların e^x cinsinden tanımını kullanarak çözelim. x kaç olur?`, `Let's solve ${nm} = ${c} using the definition of the hyperbolic functions in terms of e^x. What is x?`);
      }
      case 'invEval': {
        const nm = ['arsinh', 'arcosh', 'artanh'][p.it], c = frS(p.c);
        return Tx(`${nm}(${c}) değerini logaritmik biçimini kullanarak hesaplayalım.`, `Let's evaluate ${nm}(${c}) using its logarithmic form.`);
      }
      default:
        return Tx(`İki direk arasında asılı bir kablo y = ${p.ca}·cosh(x/${p.ca}) (metre) zinciri eğrisini oluşturuyor; direkler x = ±${p.w} m noktalarında. En alt noktanın yüksekliği, direklerdeki yükseklik, sarkma miktarı ve direkteki eğim kaç olur? Kablo boyu da kaç metredir?`,
          `A cable hung between two poles forms the catenary y = ${p.ca}·cosh(x/${p.ca}) (metres), with the poles at x = ±${p.w} m. What are the height of the lowest point, the height at the poles, the sag and the slope at a pole? How long is the cable?`);
    }
  }

  // ---------- worked solution ----------
  function solveSteps(p) {
    const steps = []; let n = 0;
    const add = (tt, te, bt, be) => { n++; steps.push(`── ${n}) ${Tx(tt, te)} ──\n${Tx(bt, be === undefined ? bt : be)}`); };
    if (p.kind === 'eval') {
      const nn = p.n, sg = p.sg, eX = sg > 0 ? fr(nn) : fr(1, nn), eM = sg > 0 ? fr(1, nn) : fr(nn);
      const sh = fr(sg * (nn * nn - 1), 2 * nn), ch = chN(nn), th = fdiv(sh, ch);
      add('Tanımlar', 'Definitions', `sinh x = (eˣ − e⁻ˣ)/2,  cosh x = (eˣ + e⁻ˣ)/2,  tanh x = sinh x / cosh x\ncoth x = 1/tanh x,  sech x = 1/cosh x,  csch x = 1/sinh x`, `sinh x = (eˣ − e⁻ˣ)/2,  cosh x = (eˣ + e⁻ˣ)/2,  tanh x = sinh x / cosh x\ncoth x = 1/tanh x,  sech x = 1/cosh x,  csch x = 1/sinh x`);
      add('eˣ ve e⁻ˣ değerleri', 'Values of eˣ and e⁻ˣ', `x = ${sg < 0 ? '−' : ''}ln ${nn} olduğundan e^x = ${sg < 0 ? 'e^(−ln ' + nn + ') = 1/' + nn : nn} = ${frS(eX)}  ve  e^(−x) = ${frS(eM)}.`, `Since x = ${sg < 0 ? '−' : ''}ln ${nn}: e^x = ${sg < 0 ? 'e^(−ln ' + nn + ') = 1/' + nn : nn} = ${frS(eX)}  and  e^(−x) = ${frS(eM)}.`);
      add('sinh, cosh, tanh', 'sinh, cosh, tanh', `sinh x = (${frS(eX)} − ${frS(eM)})/2 = ${frS(sh)}\ncosh x = (${frS(eX)} + ${frS(eM)})/2 = ${frS(ch)}\ntanh x = sinh x / cosh x = ${frS(sh)} / ${frS(ch)} = ${frS(th)}`, `sinh x = (${frS(eX)} − ${frS(eM)})/2 = ${frS(sh)}\ncosh x = (${frS(eX)} + ${frS(eM)})/2 = ${frS(ch)}\ntanh x = sinh x / cosh x = ${frS(sh)} / ${frS(ch)} = ${frS(th)}`);
      if (p.ask === 'main') {
        const d = fsub(fmul(ch, ch), fmul(sh, sh));
        add('Özdeşlik kontrolü', 'Identity check', `cosh²x − sinh²x = (${frS(ch)})² − (${frS(sh)})² = ${frS(fmul(ch, ch))} − ${frS(fmul(sh, sh))} = ${frS(d)} ✓\nSayısal: sinh(${nf(p.x, 4)}) = ${nf(sinh(p.x), 4)},  cosh = ${nf(cosh(p.x), 4)},  tanh = ${nf(tanh(p.x), 4)} (hesap makinesiyle aynı).`,
          `cosh²x − sinh²x = (${frS(ch)})² − (${frS(sh)})² = ${frS(fmul(ch, ch))} − ${frS(fmul(sh, sh))} = ${frS(d)} ✓\nNumerically: sinh(${nf(p.x, 4)}) = ${nf(sinh(p.x), 4)},  cosh = ${nf(cosh(p.x), 4)},  tanh = ${nf(tanh(p.x), 4)} (same as a calculator).`);
      } else {
        add('Ters değerler', 'Reciprocals', `coth x = 1/tanh x = ${frS(fdiv(fr(1), th))}\nsech x = 1/cosh x = ${frS(fdiv(fr(1), ch))}\ncsch x = 1/sinh x = ${frS(fdiv(fr(1), sh))}`, `coth x = 1/tanh x = ${frS(fdiv(fr(1), th))}\nsech x = 1/cosh x = ${frS(fdiv(fr(1), ch))}\ncsch x = 1/sinh x = ${frS(fdiv(fr(1), sh))}`);
        add('Sağlama', 'Check', `Sayısal: coth(${nf(p.x, 4)}) = ${nf(1 / tanh(p.x), 4)},  sech = ${nf(sech(p.x), 4)},  csch = ${nf(1 / sinh(p.x), 4)} ✓ (hesap makinesiyle aynı). Ayrıca 1 − tanh²x = sech²x: 1 − (${frS(th)})² = ${frS(fsub(fr(1), fmul(th, th)))} = (${frS(fdiv(fr(1), ch))})² ✓`,
          `Numerically: coth(${nf(p.x, 4)}) = ${nf(1 / tanh(p.x), 4)},  sech = ${nf(sech(p.x), 4)},  csch = ${nf(1 / sinh(p.x), 4)} ✓ (same as a calculator). Also 1 − tanh²x = sech²x: 1 − (${frS(th)})² = ${frS(fsub(fr(1), fmul(th, th)))} = (${frS(fdiv(fr(1), ch))})² ✓`);
      }
    } else if (p.kind === 'identity') {
      identitySteps(p, add);
    } else if (p.kind === 'deriv') {
      const e = DER[p.ci], k = p.k, x0 = p.x0, dv = e.d(x0, k);
      add('Fonksiyonu tanıyalım', 'Reading the function', `f(x) = ${e.sf(k)}\nHatırlatma: (sinh u)′ = cosh u·u′,  (cosh u)′ = sinh u·u′,  (tanh u)′ = sech²u·u′,  (sech u)′ = −sech u·tanh u·u′.\nTrigonometrideki gibi, ama cosh′ = +sinh (eksi işareti yok).`,
        `f(x) = ${e.sf(k)}\nReminder: (sinh u)′ = cosh u·u′,  (cosh u)′ = sinh u·u′,  (tanh u)′ = sech²u·u′,  (sech u)′ = −sech u·tanh u·u′.\nUnlike trigonometry, cosh′ = +sinh (no minus sign).`);
      let rule;
      if (e.out === 'prod') rule = Tx('Çarpım kuralı: (x·sinh x)′ = 1·sinh x + x·cosh x.', 'Product rule: (x·sinh x)′ = 1·sinh x + x·cosh x.');
      else if (e.out === 'ln') rule = Tx('Zincir: (ln u)′ = u′/u,  u = cosh x,  u′ = sinh x ⇒ sinh x / cosh x = tanh x.', 'Chain rule: (ln u)′ = u′/u with u = cosh x, u′ = sinh x ⇒ sinh x / cosh x = tanh x.');
      else if (e.out === 'u²') rule = Tx('Zincir: u = cosh x için (u²)′ = 2u·u′ = 2·cosh x·sinh x.', 'Chain rule: with u = cosh x, (u²)′ = 2u·u′ = 2·cosh x·sinh x.');
      else if (e.out === 'sech') rule = Tx('sech x = 1/cosh x ⇒ türev = −sinh x / cosh²x = −sech x·tanh x.', 'sech x = 1/cosh x ⇒ derivative = −sinh x / cosh²x = −sech x·tanh x.');
      else rule = Tx(`İç fonksiyon u = ${e.u(k)}, u′ = ${e.up(k)}. Dış fonksiyonun türevi ${e.outd}.`, `Inner function u = ${e.u(k)}, u′ = ${e.up(k)}. The outer derivative is ${e.outd}.`);
      add('Zincir / çarpım kuralı', 'Chain / product rule', rule);
      add('Türev', 'The derivative', `f′(x) = ${e.sd(k)}`, `f′(x) = ${e.sd(k)}`);
      add(`x = ${S(x0)} noktasında`, `At x = ${S(x0)}`, `f′(${S(x0)}) = ${e.sub(x0, k)} ≈ ${nf(dv, 4)}`, `f′(${S(x0)}) = ${e.sub(x0, k)} ≈ ${nf(dv, 4)}`);
      const h = 1e-5, fd = (e.f(x0 + h, k) - e.f(x0 - h, k)) / (2 * h);
      add('Sağlama', 'Check', `Sayısal türev: (f(${S(x0)} + h) − f(${S(x0)} − h)) / 2h ≈ ${nf(fd, 4)} ✓ (h = 10⁻⁵). Grafikte f′ eğrisi, f'nin teğet eğimlerini gösterir.`, `Numerical derivative: (f(${S(x0)} + h) − f(${S(x0)} − h)) / 2h ≈ ${nf(fd, 4)} ✓ (h = 10⁻⁵). On the graph, the f′ curve shows the tangent slopes of f.`);
    } else if (p.kind === 'integ') {
      const e = INT[p.ci], k = p.k, c = p.c;
      add('Ters türevi bulalım', 'Finding an antiderivative', `∫ ${e.sf(k)} dx = ${e.sF(k)} + C\n(Kontrol: ${e.sF(k)} ifadesinin türevi ${e.sf(k)} olur; ∫ sinh = cosh, ∫ cosh = sinh, ∫ sech² = tanh, ∫ tanh = ln cosh.)`,
        `∫ ${e.sf(k)} dx = ${e.sF(k)} + C\n(Check: the derivative of ${e.sF(k)} is ${e.sf(k)}; ∫ sinh = cosh, ∫ cosh = sinh, ∫ sech² = tanh, ∫ tanh = ln cosh.)`);
      add('Sınırları yerleştirelim', 'Applying the limits', `${e.ev(c, k)}`, `${e.ev(c, k)}`);
      add('Hesaplayalım', 'Computing', `Değer ≈ ${nf(p.val, 4)}`, `Value ≈ ${nf(p.val, 4)}`);
      let sm = 0; const N = 2000, hh = c / N; for (let i = 0; i < N; i++) sm += e.f((i + 0.5) * hh, k) * hh;
      add('Sağlama', 'Check', `Sayısal toplam (orta nokta) ≈ ${nf(sm, 4)} ✓. Grafikte gölgeli alan x = 0'dan x = ${c}'ye kadar eğrinin altındadır.`, `Numerical sum (midpoint) ≈ ${nf(sm, 4)} ✓. On the graph the shaded area lies under the curve from x = 0 to x = ${c}.`);
    } else if (p.kind === 'solve') {
      solveEqSteps(p, add);
    } else if (p.kind === 'invEval') {
      const c = frV(p.c), cs = frS(p.c), nm = ['arsinh', 'arcosh', 'artanh'][p.it];
      if (p.it === 0) {
        const r = c * c + 1, rr = fr(p.c.n * p.c.n + p.c.d * p.c.d, p.c.d * p.c.d);
        add('Formül', 'Formula', `arsinh x = ln(x + √(x² + 1))`, `arsinh x = ln(x + √(x² + 1))`);
        add('Yerine koyalım', 'Substituting', `x² + 1 = (${cs})² + 1 = ${frS(rr)}  ⇒  √ = ${nf(Math.sqrt(r), 4)}${p.ex ? ' = ' + frS(fr(Math.round(Math.sqrt(r) * p.c.d), p.c.d)) : ''}\narsinh(${cs}) = ln(${cs} + ${nf(Math.sqrt(r), 4)}) = ln(${nf(c + Math.sqrt(r), 4)})`, `x² + 1 = (${cs})² + 1 = ${frS(rr)}  ⇒  √ = ${nf(Math.sqrt(r), 4)}${p.ex ? ' = ' + frS(fr(Math.round(Math.sqrt(r) * p.c.d), p.c.d)) : ''}\narsinh(${cs}) = ln(${cs} + ${nf(Math.sqrt(r), 4)}) = ln(${nf(c + Math.sqrt(r), 4)})`);
      } else if (p.it === 1) {
        const r = c * c - 1;
        add('Formül', 'Formula', `arcosh x = ln(x + √(x² − 1)),  x ≥ 1`, `arcosh x = ln(x + √(x² − 1)),  x ≥ 1`);
        add('Yerine koyalım', 'Substituting', `x ≥ 1 koşulu sağlanıyor (${cs} ≥ 1).\nx² − 1 = ${nf(r, 4)}  ⇒  √ = ${nf(Math.sqrt(r), 4)}\narcosh(${cs}) = ln(${nf(c + Math.sqrt(r), 4)})`, `The condition x ≥ 1 holds (${cs} ≥ 1).\nx² − 1 = ${nf(r, 4)}  ⇒  √ = ${nf(Math.sqrt(r), 4)}\narcosh(${cs}) = ln(${nf(c + Math.sqrt(r), 4)})`);
      } else {
        const q = fdiv(fadd(fr(1), p.c), fsub(fr(1), p.c));
        add('Formül', 'Formula', `artanh x = ½·ln((1 + x)/(1 − x)),  |x| < 1`, `artanh x = ½·ln((1 + x)/(1 − x)),  |x| < 1`);
        add('Yerine koyalım', 'Substituting', `|${cs}| < 1 koşulu sağlanıyor.\n(1 + x)/(1 − x) = ${frS(q)}\nartanh(${cs}) = ½·ln(${frS(q)})`, `The condition |${cs}| < 1 holds.\n(1 + x)/(1 − x) = ${frS(q)}\nartanh(${cs}) = ½·ln(${frS(q)})`);
      }
      add('Sonuç', 'Result', p.ex ? `${nm}(${cs}) = ln ${p.n} ≈ ${nf(p.val, 4)}  (tam değer: ln ${p.n}).` : `${nm}(${cs}) ≈ ${nf(p.val, 4)}.`, p.ex ? `${nm}(${cs}) = ln ${p.n} ≈ ${nf(p.val, 4)}  (exact value: ln ${p.n}).` : `${nm}(${cs}) ≈ ${nf(p.val, 4)}.`);
      const back = p.it === 0 ? sinh(p.val) : (p.it === 1 ? cosh(p.val) : tanh(p.val));
      add('Sağlama', 'Check', `${['sinh', 'cosh', 'tanh'][p.it]}(${nf(p.val, 4)}) = ${nf(back, 4)} ≈ ${nf(c, 4)} ✓ (ters fonksiyonun tanımı).`, `${['sinh', 'cosh', 'tanh'][p.it]}(${nf(p.val, 4)}) = ${nf(back, 4)} ≈ ${nf(c, 4)} ✓ (definition of the inverse).`);
    } else { // catenary
      const a = p.ca, w = p.w, r = w / a, yw = a * cosh(r), sl = sinh(r);
      add('Zincir eğrisi', 'The catenary', `y = a·cosh(x/a),  a = ${a} m.\nAsılı bir kablo veya zincir, kendi ağırlığı altında bu eğriyi alır (parabol değildir).`, `y = a·cosh(x/a),  a = ${a} m.\nA cable or chain hanging under its own weight takes this shape (it is not a parabola).`);
      add('En alt nokta', 'Lowest point', `y(0) = ${a}·cosh 0 = ${a} m  (cosh x ≥ 1 olduğundan en küçük değer x = 0'da).`, `y(0) = ${a}·cosh 0 = ${a} m  (cosh x ≥ 1, so the minimum is at x = 0).`);
      add('Direklerde yükseklik ve sarkma', 'Height at the poles and the sag', `y(${w}) = ${a}·cosh(${w}/${a}) = ${a}·cosh(${nf(r, 4)}) = ${a}·${nf(cosh(r), 4)} = ${nf(yw, 3)} m\nSarkma = y(${w}) − y(0) = ${nf(yw, 3)} − ${a} = ${nf(yw - a, 3)} m`, `y(${w}) = ${a}·cosh(${w}/${a}) = ${a}·cosh(${nf(r, 4)}) = ${a}·${nf(cosh(r), 4)} = ${nf(yw, 3)} m\nSag = y(${w}) − y(0) = ${nf(yw, 3)} − ${a} = ${nf(yw - a, 3)} m`);
      add('Eğim', 'Slope', `y′ = a·sinh(x/a)·(1/a) = sinh(x/a)\ny′(${w}) = sinh(${nf(r, 4)}) = ${nf(sl, 4)}  ⇒  eğim açısı = arctan(${nf(sl, 4)}) ≈ ${nf(Math.atan(sl) * 180 / Math.PI, 2)}°`, `y′ = a·sinh(x/a)·(1/a) = sinh(x/a)\ny′(${w}) = sinh(${nf(r, 4)}) = ${nf(sl, 4)}  ⇒  slope angle = arctan(${nf(sl, 4)}) ≈ ${nf(Math.atan(sl) * 180 / Math.PI, 2)}°`);
      add('Kablo boyu', 'Cable length', `L = ∫₋ʷʷ √(1 + y′²) dx = ∫₋ʷʷ √(1 + sinh²(x/a)) dx = ∫₋ʷʷ cosh(x/a) dx\n= 2a·sinh(w/a) = 2·${a}·${nf(sl, 4)} = ${nf(2 * a * sl, 3)} m\n(1 + sinh² = cosh² özdeşliği kullanıldı.)`, `L = ∫₋ʷʷ √(1 + y′²) dx = ∫₋ʷʷ √(1 + sinh²(x/a)) dx = ∫₋ʷʷ cosh(x/a) dx\n= 2a·sinh(w/a) = 2·${a}·${nf(sl, 4)} = ${nf(2 * a * sl, 3)} m\n(We used 1 + sinh² = cosh².)`);
      add('Sağlama', 'Check', `Kablo boyu ${nf(2 * a * sl, 3)} m, direkler arası 2w = ${2 * w} m'den uzun olmalı ✓ (${2 * a * sl > 2 * w ? 'uzun' : 'kısa'}).`, `The cable length ${nf(2 * a * sl, 3)} m must exceed the span 2w = ${2 * w} m ✓ (${2 * a * sl > 2 * w ? 'longer' : 'shorter'}).`);
    }
    return steps;
  }

  function identitySteps(p, add) {
    const a = p.an, b = p.bn, sa = shN(a), ca = chN(a), sb = shN(b), cb = chN(b);
    const L = frS;
    const two = fr(2);
    if (p.id === 0) {
      const l = fsub(fmul(ca, ca), fmul(sa, sa));
      add('Sayısal doğrulama', 'Numerical check', `x = ln ${a}:  sinh x = ${L(sa)},  cosh x = ${L(ca)}\nSol: cosh²x − sinh²x = ${L(fmul(ca, ca))} − ${L(fmul(sa, sa))} = ${L(l)}\nSağ: 1  ✓`, `x = ln ${a}:  sinh x = ${L(sa)},  cosh x = ${L(ca)}\nLeft: cosh²x − sinh²x = ${L(fmul(ca, ca))} − ${L(fmul(sa, sa))} = ${L(l)}\nRight: 1  ✓`);
      add('Cebirsel gösterim', 'Algebraic proof', `cosh²x − sinh²x = ((eˣ + e⁻ˣ)/2)² − ((eˣ − e⁻ˣ)/2)²\n= (e²ˣ + 2 + e⁻²ˣ)/4 − (e²ˣ − 2 + e⁻²ˣ)/4 = 4/4 = 1.\n(Dairenin x² + y² = 1 karşılığı: (cosh t, sinh t) noktaları x² − y² = 1 hiperbolü üzerindedir.)`, `cosh²x − sinh²x = ((eˣ + e⁻ˣ)/2)² − ((eˣ − e⁻ˣ)/2)²\n= (e²ˣ + 2 + e⁻²ˣ)/4 − (e²ˣ − 2 + e⁻²ˣ)/4 = 4/4 = 1.\n(Analogue of x² + y² = 1: the points (cosh t, sinh t) lie on the hyperbola x² − y² = 1.)`);
    } else if (p.id === 1) {
      const lhs = shN(a * a), rhs = fmul(two, fmul(sa, ca));
      add('Sayısal doğrulama', 'Numerical check', `x = ln ${a}:  sinh x = ${L(sa)},  cosh x = ${L(ca)};  2x = ln ${a * a}\nSol: sinh 2x = sinh(ln ${a * a}) = (${a * a} − 1/${a * a})/2 = ${L(lhs)}\nSağ: 2·sinh x·cosh x = 2·${L(sa)}·${L(ca)} = ${L(rhs)}  ✓`, `x = ln ${a}:  sinh x = ${L(sa)},  cosh x = ${L(ca)};  2x = ln ${a * a}\nLeft: sinh 2x = sinh(ln ${a * a}) = (${a * a} − 1/${a * a})/2 = ${L(lhs)}\nRight: 2·sinh x·cosh x = 2·${L(sa)}·${L(ca)} = ${L(rhs)}  ✓`);
      add('Cebirsel gösterim', 'Algebraic proof', `2·sinh x·cosh x = 2·(eˣ − e⁻ˣ)/2·(eˣ + e⁻ˣ)/2 = (e²ˣ − e⁻²ˣ)/2 = sinh 2x.`, `2·sinh x·cosh x = 2·(eˣ − e⁻ˣ)/2·(eˣ + e⁻ˣ)/2 = (e²ˣ − e⁻²ˣ)/2 = sinh 2x.`);
    } else if (p.id === 2) {
      const lhs = chN(a * a), rhs = fadd(fmul(ca, ca), fmul(sa, sa));
      add('Sayısal doğrulama', 'Numerical check', `x = ln ${a}:  sinh x = ${L(sa)},  cosh x = ${L(ca)};  2x = ln ${a * a}\nSol: cosh 2x = (${a * a} + 1/${a * a})/2 = ${L(lhs)}\nSağ: cosh²x + sinh²x = ${L(fmul(ca, ca))} + ${L(fmul(sa, sa))} = ${L(rhs)}  ✓`, `x = ln ${a}:  sinh x = ${L(sa)},  cosh x = ${L(ca)};  2x = ln ${a * a}\nLeft: cosh 2x = (${a * a} + 1/${a * a})/2 = ${L(lhs)}\nRight: cosh²x + sinh²x = ${L(fmul(ca, ca))} + ${L(fmul(sa, sa))} = ${L(rhs)}  ✓`);
      add('Cebirsel gösterim', 'Algebraic proof', `cosh²x + sinh²x = (e²ˣ + 2 + e⁻²ˣ)/4 + (e²ˣ − 2 + e⁻²ˣ)/4 = (2e²ˣ + 2e⁻²ˣ)/4 = (e²ˣ + e⁻²ˣ)/2 = cosh 2x.\n(cosh²x − sinh²x = 1 ile birlikte cosh 2x = 2cosh²x − 1 = 1 + 2sinh²x elde edilir.)`, `cosh²x + sinh²x = (e²ˣ + 2 + e⁻²ˣ)/4 + (e²ˣ − 2 + e⁻²ˣ)/4 = (2e²ˣ + 2e⁻²ˣ)/4 = (e²ˣ + e⁻²ˣ)/2 = cosh 2x.\n(Together with cosh²x − sinh²x = 1 this gives cosh 2x = 2cosh²x − 1 = 1 + 2sinh²x.)`);
    } else if (p.id === 3) {
      const lhs = shN(a * b), rhs = fadd(fmul(sa, cb), fmul(ca, sb));
      add('Sayısal doğrulama', 'Numerical check', `x = ln ${a}, y = ln ${b};  x + y = ln ${a * b}\nsinh x = ${L(sa)}, cosh x = ${L(ca)}, sinh y = ${L(sb)}, cosh y = ${L(cb)}\nSol: sinh(x + y) = (${a * b} − 1/${a * b})/2 = ${L(lhs)}\nSağ: ${L(sa)}·${L(cb)} + ${L(ca)}·${L(sb)} = ${L(fmul(sa, cb))} + ${L(fmul(ca, sb))} = ${L(rhs)}  ✓`,
        `x = ln ${a}, y = ln ${b};  x + y = ln ${a * b}\nsinh x = ${L(sa)}, cosh x = ${L(ca)}, sinh y = ${L(sb)}, cosh y = ${L(cb)}\nLeft: sinh(x + y) = (${a * b} − 1/${a * b})/2 = ${L(lhs)}\nRight: ${L(sa)}·${L(cb)} + ${L(ca)}·${L(sb)} = ${L(fmul(sa, cb))} + ${L(fmul(ca, sb))} = ${L(rhs)}  ✓`);
      add('Cebirsel gösterim', 'Algebraic proof', `sinh x·cosh y + cosh x·sinh y = [(eˣ − e⁻ˣ)(eʸ + e⁻ʸ) + (eˣ + e⁻ˣ)(eʸ − e⁻ʸ)]/4\n= [2eˣ⁺ʸ − 2e⁻ˣ⁻ʸ]/4 = (eˣ⁺ʸ − e⁻⁽ˣ⁺ʸ⁾)/2 = sinh(x + y).`, `sinh x·cosh y + cosh x·sinh y = [(eˣ − e⁻ˣ)(eʸ + e⁻ʸ) + (eˣ + e⁻ˣ)(eʸ − e⁻ʸ)]/4\n= [2eˣ⁺ʸ − 2e⁻ˣ⁻ʸ]/4 = (eˣ⁺ʸ − e⁻⁽ˣ⁺ʸ⁾)/2 = sinh(x + y).`);
    } else {
      const th = fdiv(sa, ca), l = fsub(fr(1), fmul(th, th)), r = fmul(fdiv(fr(1), ca), fdiv(fr(1), ca));
      add('Sayısal doğrulama', 'Numerical check', `x = ln ${a}:  tanh x = ${L(sa)}/${L(ca)} = ${L(th)}\nSol: 1 − tanh²x = 1 − ${L(fmul(th, th))} = ${L(l)}\nSağ: sech²x = (1/${L(ca)})² = ${L(r)}  ✓`, `x = ln ${a}:  tanh x = ${L(sa)}/${L(ca)} = ${L(th)}\nLeft: 1 − tanh²x = 1 − ${L(fmul(th, th))} = ${L(l)}\nRight: sech²x = (1/${L(ca)})² = ${L(r)}  ✓`);
      add('Cebirsel gösterim', 'Algebraic proof', `cosh²x − sinh²x = 1 eşitliğini cosh²x'e bölelim:\n1 − tanh²x = 1/cosh²x = sech²x.`, `Divide cosh²x − sinh²x = 1 by cosh²x:\n1 − tanh²x = 1/cosh²x = sech²x.`);
    }
    const xv = p.x;
    const chk = [
      cosh(xv) ** 2 - sinh(xv) ** 2, sinh(2 * xv) - 2 * sinh(xv) * cosh(xv), cosh(2 * xv) - (cosh(xv) ** 2 + sinh(xv) ** 2),
      sinh(xv + p.y) - (sinh(xv) * cosh(p.y) + cosh(xv) * sinh(p.y)), 1 - tanh(xv) ** 2 - sech(xv) ** 2][p.id];
    add('Sonuç', 'Conclusion', `İki taraf hem sayısal olarak hem de cebirsel olarak eşit çıktı; hesap makinesiyle fark ≈ ${nf(Math.abs(chk), 10)} (≈ 0).`, `Both sides agree numerically and algebraically; calculator difference ≈ ${nf(Math.abs(chk), 10)} (≈ 0).`);
  }

  function solveEqSteps(p, add) {
    const c = frV(p.c), cs = frS(p.c), nm = ['sinh x', 'cosh x', 'tanh x'][p.st];
    if (p.st === 0) {
      const r = Math.sqrt(c * c + 1);
      add('e^x cinsinden yazalım', 'Writing it with eˣ', `(eˣ − e⁻ˣ)/2 = ${cs}.  u = eˣ (u > 0) diyelim: (u − 1/u)/2 = ${cs}\nu ile çarpıp düzenlersek: u² − ${frS(fr(2 * p.c.n, p.c.d))}u − 1 = 0`, `(eˣ − e⁻ˣ)/2 = ${cs}.  Let u = eˣ (u > 0): (u − 1/u)/2 = ${cs}\nMultiplying by u: u² − ${frS(fr(2 * p.c.n, p.c.d))}u − 1 = 0`);
      add('İkinci derece denklem', 'The quadratic', `u = [${frS(fr(2 * p.c.n, p.c.d))} ± √((${frS(fr(2 * p.c.n, p.c.d))})² + 4)]/2 = ${cs} ± √(${nf(c * c + 1, 4)}) = ${nf(c, 4)} ± ${nf(r, 4)}\nu > 0 olmalı: u = ${nf(c + r, 4)}  (diğer kök ${nf(c - r, 4)} < 0, atılır).`,
        `u = [${frS(fr(2 * p.c.n, p.c.d))} ± √((${frS(fr(2 * p.c.n, p.c.d))})² + 4)]/2 = ${cs} ± √(${nf(c * c + 1, 4)}) = ${nf(c, 4)} ± ${nf(r, 4)}\nWe need u > 0: u = ${nf(c + r, 4)}  (the other root ${nf(c - r, 4)} < 0 is rejected).`);
      add('x değeri', 'Value of x', `x = ln u = ln(${cs} + √(${cs}² + 1)) = ${p.ex ? 'ln ' + (p.sg < 0 ? '(1/' + p.n + ') = −ln ' + p.n : p.n) + ' ≈ ' : ''}${nf(p.xs, 4)}\n(Bu aynı zamanda arsinh(${cs}) değeridir.)`, `x = ln u = ln(${cs} + √(${cs}² + 1)) = ${p.ex ? 'ln ' + (p.sg < 0 ? '(1/' + p.n + ') = −ln ' + p.n : p.n) + ' ≈ ' : ''}${nf(p.xs, 4)}\n(This is also arsinh(${cs}).)`);
    } else if (p.st === 1) {
      const r = Math.sqrt(c * c - 1);
      add('e^x cinsinden yazalım', 'Writing it with eˣ', `(eˣ + e⁻ˣ)/2 = ${cs}.  u = eˣ (u > 0): (u + 1/u)/2 = ${cs}  ⇒  u² − ${frS(fr(2 * p.c.n, p.c.d))}u + 1 = 0.\nÖnce erişilebilirlik: cosh x ≥ 1 olduğundan ${cs} ≥ 1 gerekir ✓.`, `(eˣ + e⁻ˣ)/2 = ${cs}.  u = eˣ (u > 0): (u + 1/u)/2 = ${cs}  ⇒  u² − ${frS(fr(2 * p.c.n, p.c.d))}u + 1 = 0.\nFirst, reachability: cosh x ≥ 1, so ${cs} ≥ 1 is needed ✓.`);
      add('İkinci derece denklem', 'The quadratic', `u = ${nf(c, 4)} ± √(${nf(c * c - 1, 4)}) = ${nf(c, 4)} ± ${nf(r, 4)}  ⇒  u = ${nf(c + r, 4)}  veya  u = ${nf(c - r, 4)}\nİkisi de pozitif ve çarpımları 1 (birbirinin tersi).`, `u = ${nf(c, 4)} ± √(${nf(c * c - 1, 4)}) = ${nf(c, 4)} ± ${nf(r, 4)}  ⇒  u = ${nf(c + r, 4)}  or  u = ${nf(c - r, 4)}\nBoth are positive and their product is 1 (reciprocals).`);
      add('x değerleri', 'Values of x', `x = ln u ⇒ x = ±ln(${cs} + √(${cs}² − 1)) = ±${nf(p.xs, 4)}${p.ex ? '  (= ±ln ' + p.n + ')' : ''}\ncosh çift fonksiyon olduğu için iki çözüm vardır.`, `x = ln u ⇒ x = ±ln(${cs} + √(${cs}² − 1)) = ±${nf(p.xs, 4)}${p.ex ? '  (= ±ln ' + p.n + ')' : ''}\ncosh is an even function, so there are two solutions.`);
    } else {
      const q = (1 + c) / (1 - c);
      add('Tanım kümesi', 'Reachable values', `tanh x her zaman (−1, 1) aralığında olduğundan ${cs} değerine ulaşılabilir ✓.`, `tanh x always lies in (−1, 1), so the value ${cs} is reachable ✓.`);
      add('e^x cinsinden yazalım', 'Writing it with eˣ', `(eˣ − e⁻ˣ)/(eˣ + e⁻ˣ) = ${cs}  ⇒  pay ve paydayı eˣ ile çarpalım: (e²ˣ − 1)/(e²ˣ + 1) = ${cs}\ne²ˣ − 1 = ${cs}(e²ˣ + 1)  ⇒  e²ˣ(1 − ${cs}) = 1 + ${cs}  ⇒  e²ˣ = ${frS(fdiv(fadd(fr(1), p.c), fsub(fr(1), p.c)))}`,
        `(eˣ − e⁻ˣ)/(eˣ + e⁻ˣ) = ${cs}  ⇒  multiply top and bottom by eˣ: (e²ˣ − 1)/(e²ˣ + 1) = ${cs}\ne²ˣ − 1 = ${cs}(e²ˣ + 1)  ⇒  e²ˣ(1 − ${cs}) = 1 + ${cs}  ⇒  e²ˣ = ${frS(fdiv(fadd(fr(1), p.c), fsub(fr(1), p.c)))}`);
      add('x değeri', 'Value of x', `2x = ln(${nf(q, 4)})  ⇒  x = ½·ln(${frS(fdiv(fadd(fr(1), p.c), fsub(fr(1), p.c)))}) ≈ ${nf(p.xs, 4)}${p.ex ? '  (= ' + (p.sg < 0 ? '−' : '') + 'ln ' + p.n + ')' : ''}`, `2x = ln(${nf(q, 4)})  ⇒  x = ½·ln(${frS(fdiv(fadd(fr(1), p.c), fsub(fr(1), p.c)))}) ≈ ${nf(p.xs, 4)}${p.ex ? '  (= ' + (p.sg < 0 ? '−' : '') + 'ln ' + p.n + ')' : ''}`);
    }
    const back = p.st === 0 ? sinh(p.xs) : (p.st === 1 ? cosh(p.xs) : tanh(p.xs));
    add('Sağlama', 'Check', `${nm.split(' ')[0]}(${nf(p.xs, 4)}) = ${nf(back, 4)} ≈ ${nf(c, 4)} ✓`, `${nm.split(' ')[0]}(${nf(p.xs, 4)}) = ${nf(back, 4)} ≈ ${nf(c, 4)} ✓`);
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    try {
      const X = p.view.X, Y = p.view.Y;
      canvas.setViewport(-X, X, -Y, Y);
      const ev = (g) => (x) => { const y = g(x); return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN; };
      const kind = p.kind, ct = p.ctl;
      const trio = kind === 'eval' || kind === 'identity' || kind === 'solve' || kind === 'invEval';
      canvas.addFunction({ evaluator: ev(cosh), color: canvas.accent(), thickness: trio ? 2.6 : 1.6, dashed: !trio, label: 'cosh x' });
      if (trio) {
        canvas.addFunction({ evaluator: ev(sinh), color: canvas.blue(), thickness: 2.6, label: 'sinh x' });
        canvas.addFunction({ evaluator: ev(tanh), color: canvas.orange(), thickness: 2.6, label: 'tanh x' });
        canvas.addGuideLine({ axis: 'horizontal', position: 1, color: canvas.green(), label: 'y = 1' });
        canvas.addGuideLine({ axis: 'horizontal', position: -1, color: canvas.green(), label: 'y = −1' });
      }
      if (kind === 'solve') canvas.addGuideLine({ axis: 'horizontal', position: frV(p.c), color: canvas.red(), label: `y = ${nf(frV(p.c), 3)}` });
      if (kind === 'deriv') {
        const e = DER[p.ci];
        canvas.addFunction({ evaluator: ev((x) => e.f(x, p.k)), color: canvas.blue(), thickness: 2.8, label: 'f(x)' });
        canvas.addFunction({ evaluator: ev((x) => e.d(x, p.k)), color: canvas.orange(), thickness: 2.4, label: "f′(x)" });
        const y0 = e.f(p.x0, p.k), m = e.d(p.x0, p.k);
        if (isFinite(y0) && isFinite(m)) {
          canvas.addSegment({ x1: p.x0 - 1.2, y1: y0 - 1.2 * m, x2: p.x0 + 1.2, y2: y0 + 1.2 * m, color: canvas.red(), thickness: 2 });
          if (Math.abs(y0) <= Y) canvas.addMarker({ x: p.x0, y: y0, color: canvas.gold(), radius: 6, label: `(${nf(p.x0, 1)}, ${nf(y0, 2)})` });
          if (Math.abs(m) <= Y) canvas.addMarker({ x: p.x0, y: m, color: canvas.gold(), radius: 5, shape: 'diamond', label: `f′ = ${nf(m, 2)}` });
        }
      }
      if (kind === 'integ') {
        const e = INT[p.ci];
        canvas.addFilledArea({ evaluator: (x) => e.f(x, p.k), xMin: 0, xMax: p.c, color: canvas._withAlpha(canvas.green(), 0.35) });
        canvas.addFunction({ evaluator: ev((x) => e.f(x, p.k)), color: canvas.blue(), thickness: 2.8, label: 'f(x)' });
      }
      if (kind === 'catenary') {
        const a = p.ca, yw = a * cosh(p.w / a);
        canvas.addFunction({ evaluator: ev((x) => a * cosh(x / a)), color: canvas.blue(), thickness: 2.8, label: `y = ${a}·cosh(x/${a})` });
        canvas.addSegment({ x1: -p.w, y1: yw, x2: p.w, y2: yw, color: canvas.gray(), dashed: true });
        canvas.addSegment({ x1: 0, y1: 0, x2: 0, y2: a, color: canvas.gray(), dashed: true });
      }
      // explorer
      const t = ct.t, aa = ct.a;
      canvas.addFunction({ evaluator: ev((x) => aa * cosh(x / aa)), color: canvas.green(), thickness: 1.6, dashed: true, label: `a = ${nf(aa, 1)}: a·cosh(x/a)` });
      canvas.addParametric({ xOfT: (s) => cosh(s), yOfT: (s) => sinh(s), tMin: -2.4, tMax: 2.4, samples: 200, color: canvas.purple(), thickness: 1.8 });
      (p.pts || []).forEach((q) => {
        if (!isFinite(q.x) || !isFinite(q.y) || Math.abs(q.y) > Y || Math.abs(q.x) > X) return;
        canvas.addMarker({ x: q.x, y: q.y, color: canvas.gold(), radius: 6, label: q.l ? `(${nf(q.x, 2)}, ${nf(q.y, 2)})` : '' });
      });
      const ch = cosh(t), sh = sinh(t);
      if (Math.abs(ch) <= Y) {
        canvas.addSegment({ x1: t - 0.9, y1: ch - 0.9 * sh, x2: t + 0.9, y2: ch + 0.9 * sh, color: canvas.red(), thickness: 1.8 });
        canvas.addMarker({ x: t, y: ch, color: canvas.accent(), radius: 5, label: `cosh t = ${nf(ch, 2)}, m = ${nf(sh, 2)}` });
      }
      if (Math.abs(sh) <= Y) canvas.addMarker({ x: t, y: sh, color: canvas.blue(), radius: 5, shape: 'diamond', label: `sinh t = ${nf(sh, 2)}` });
      if (Math.abs(ch) <= X && Math.abs(sh) <= Y) {
        canvas.addMarker({ x: ch, y: sh, color: canvas.purple(), radius: 5, shape: 'square', label: `(cosh t, sinh t)` });
        canvas.addSegment({ x1: 0, y1: 0, x2: ch, y2: sh, color: canvas.purple(), dashed: true, thickness: 1.2 });
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({ caption: Tx('t (argüman; teğet ve hiperbol noktası)', 't (argument; tangent and hyperbola point)'), min: -2.5, max: 2.5, step: 0.1, get: () => getProblem().ctl.t, set: (v) => { getProblem().ctl.t = v; } });
    h.addSlider({ caption: Tx('a (zincir eğrisi parametresi)', 'a (catenary parameter)'), min: 0.5, max: 3, step: 0.5, get: () => getProblem().ctl.a, set: (v) => { getProblem().ctl.a = v; } });
  }

  function concept() {
    return Tx(
      'HİPERBOLİK FONKSİYONLAR\n\n' +
      'TANIM (eˣ cinsinden):\n' +
      '   sinh x = (eˣ − e⁻ˣ)/2        cosh x = (eˣ + e⁻ˣ)/2\n' +
      '   tanh x = sinh x / cosh x      coth x = 1/tanh x,  sech x = 1/cosh x,  csch x = 1/sinh x\n' +
      '   "Hiperbolik" adı: (cosh t, sinh t) noktaları x² − y² = 1 hiperbolü üzerindedir (trigonometride (cos t, sin t) çember üzerindeydi).\n\n' +
      'GRAFİK ÖZELLİKLERİ:\n' +
      '   sinh: tanım ℝ, görüntü ℝ, TEK fonksiyon (orijine göre simetrik), artan.\n' +
      '   cosh: tanım ℝ, görüntü [1, ∞), ÇİFT fonksiyon (y-eksenine göre simetrik), en küçük değer cosh 0 = 1.\n' +
      '   tanh: görüntü (−1, 1), tek, yatay asimptotlar y = ±1.\n\n' +
      'ÖZDEŞLİKLER:\n' +
      '   cosh²x − sinh²x = 1,    1 − tanh²x = sech²x\n' +
      '   sinh 2x = 2·sinh x·cosh x,    cosh 2x = cosh²x + sinh²x\n' +
      '   sinh(x ± y) = sinh x cosh y ± cosh x sinh y\n\n' +
      'TÜREVLER VE İNTEGRALLER:\n' +
      '   (sinh x)′ = cosh x,  (cosh x)′ = sinh x (eksi yok!),  (tanh x)′ = sech²x,  (sech x)′ = −sech x·tanh x\n' +
      '   ∫ sinh x dx = cosh x + C,  ∫ cosh x dx = sinh x + C,  ∫ sech²x dx = tanh x + C\n\n' +
      'TERS HİPERBOLİKLER (logaritmik biçim):\n' +
      '   arsinh x = ln(x + √(x² + 1)),  arcosh x = ln(x + √(x² − 1)) (x ≥ 1),  artanh x = ½ ln((1 + x)/(1 − x)) (|x| < 1)\n\n' +
      'YÖNTEM:\n' +
      '   1) Tanıma dönelim: her şeyi eˣ ile yazalım.\n' +
      '   2) Denklemlerde u = eˣ (u > 0) diyelim ve ikinci derece denklem çözelim.\n' +
      '   3) Türevde zincir kuralını uygulayalım.\n\n' +
      'DİKKAT: (cosh x)′ = +sinh x (trigonometrideki cos′ = −sin ile karıştırılmasın); cosh²x − sinh²x = 1 (artı değil eksi); cosh x = c denkleminin iki kökü ±x vardır.\n\n' +
      'MİNİ ÖRNEK: x = ln 2 ⇒ eˣ = 2, e⁻ˣ = 1/2 ⇒ sinh x = (2 − 1/2)/2 = 3/4,  cosh x = 5/4,  tanh x = 3/5.\n' +
      'MÜHENDİSLİKTE: asılı kablo ve zincirin şekli (zincir eğrisi) y = a·cosh(x/a), kemer ve köprü tasarımı, ısı transferinde kanat (fin) çözümleri, dalga ve akışkan problemleri.',
      'HYPERBOLIC FUNCTIONS\n\n' +
      'DEFINITION (in terms of eˣ):\n' +
      '   sinh x = (eˣ − e⁻ˣ)/2        cosh x = (eˣ + e⁻ˣ)/2\n' +
      '   tanh x = sinh x / cosh x      coth x = 1/tanh x,  sech x = 1/cosh x,  csch x = 1/sinh x\n' +
      '   Why "hyperbolic": the points (cosh t, sinh t) lie on the hyperbola x² − y² = 1 (in trigonometry (cos t, sin t) lies on the circle).\n\n' +
      'GRAPH PROPERTIES:\n' +
      '   sinh: domain ℝ, range ℝ, ODD (symmetric about the origin), increasing.\n' +
      '   cosh: domain ℝ, range [1, ∞), EVEN (symmetric about the y-axis), minimum cosh 0 = 1.\n' +
      '   tanh: range (−1, 1), odd, horizontal asymptotes y = ±1.\n\n' +
      'IDENTITIES:\n' +
      '   cosh²x − sinh²x = 1,    1 − tanh²x = sech²x\n' +
      '   sinh 2x = 2·sinh x·cosh x,    cosh 2x = cosh²x + sinh²x\n' +
      '   sinh(x ± y) = sinh x cosh y ± cosh x sinh y\n\n' +
      'DERIVATIVES AND INTEGRALS:\n' +
      '   (sinh x)′ = cosh x,  (cosh x)′ = sinh x (no minus!),  (tanh x)′ = sech²x,  (sech x)′ = −sech x·tanh x\n' +
      '   ∫ sinh x dx = cosh x + C,  ∫ cosh x dx = sinh x + C,  ∫ sech²x dx = tanh x + C\n\n' +
      'INVERSE HYPERBOLICS (log form):\n' +
      '   arsinh x = ln(x + √(x² + 1)),  arcosh x = ln(x + √(x² − 1)) (x ≥ 1),  artanh x = ½ ln((1 + x)/(1 − x)) (|x| < 1)\n\n' +
      'METHOD:\n' +
      '   1) Go back to the definition: write everything with eˣ.\n' +
      '   2) For equations, let u = eˣ (u > 0) and solve the quadratic.\n' +
      '   3) For derivatives, apply the chain rule.\n\n' +
      'PITFALLS: (cosh x)′ = +sinh x (do not copy cos′ = −sin); cosh²x − sinh²x = 1 (minus, not plus); cosh x = c has two roots ±x.\n\n' +
      'MINI EXAMPLE: x = ln 2 ⇒ eˣ = 2, e⁻ˣ = 1/2 ⇒ sinh x = (2 − 1/2)/2 = 3/4,  cosh x = 5/4,  tanh x = 3/5.\n' +
      'IN ENGINEERING: the shape of a hanging cable or chain (catenary) y = a·cosh(x/a), arch and bridge design, fin solutions in heat transfer, wave and fluid problems.');
  }

  Topics.register('functions', {
    id: 'hyperbolic',
    tabTitle: () => Tx('Hiperbolik Fonksiyonlar', 'Hyperbolic Functions'),
    concept,
    problemStatement,
    createProblem,
    links: [
      { match: /^(TANIM \(eˣ|DEFINITION \(in terms)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'eval') },
      { match: /^(ÖZDEŞLİKLER|IDENTITIES):/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'identity') },
      { match: /^\s*\(sinh x\)′ = cosh x/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'deriv') },
      { match: /^\s*∫ sinh x dx/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'integ') },
      { match: /^(TERS HİPERBOLİKLER|INVERSE HYPERBOLICS)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'invEval') },
      { match: /^\s*2\) (Denklemlerde|For equations)/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'solve') },
      { match: /^(MÜHENDİSLİKTE|IN ENGINEERING):/, make: (rng) => FnKit.until(createProblem, rng, (p) => p.kind === 'catenary') },
    ],
    solveSteps,
    draw,
    buildControls,
  });
})();
