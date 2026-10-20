// L'Hopital's Rule (chapter 'applications'). Port of Modules/Applications/LHopitalControl.vb, extended.
// problem = { kind, ...params, s, showDeriv }
//   kinds (direct 0/0 or inf/inf): sin, exp1, exp2, nroot, lnax, ln1, cosm, xsin3, polyexp, lnpoly, ratinf
//   kinds (rewrite first):         xlnx (0*inf), xsin (0*inf, x->inf), infinf1 / infinf2 (inf-inf),
//                                  pow1 (1^inf), pow0 (0^0 and inf^0)
//   kinds (pitfalls):              misuse (not indeterminate), nolimit (f'/g' has no limit), cycle (rule loops)
// The slider s moves the probe point towards the limit point (or to +infinity); the readout shows the
// original expression and the first f'/g' ratio side by side. Stated answers are exact.
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
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function frS(x) { return x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d; }
  function nf(v, dec) {
    if (!isFinite(v)) return Tx('tanımsız', 'not defined');
    let s = v.toFixed(dec === undefined ? 5 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  const SUP = { 1: '', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
  const sup = (n) => (SUP[n] !== undefined ? SUP[n] : '^' + n);
  const cx = (a, v) => (a === 1 ? v : a + v);           // coefficient * variable
  const co = (a) => (a === 1 ? '' : String(a));           // coefficient, omitted when 1
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const ex = (a) => (a === 1 ? 'eˣ' : 'e^(' + a + 'x)');
  const plusC = (k) => (k === 0 ? '' : (k < 0 ? ' − ' + Math.abs(k) : ' + ' + k));
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
  const prime = (k) => ['', '′', '″', '‴'][k] !== undefined ? ['', '′', '″', '‴'][k] : '⁽' + k + '⁾';
  const ord = (k) => (k === 1 ? '1st' : k === 2 ? '2nd' : k === 3 ? '3rd' : k + 'th');
  function Hdr(n, text) { return '── ' + n + ') ' + text + ' ──'; }
  const safe = (v) => (isFinite(v) && Math.abs(v) < 1e7 ? v : NaN);

  // ---------- state shared with the controls ----------
  let forcedKind = 'random';
  let readoutEl = null;

  const KINDS = [
    'sin', 'exp1', 'exp2', 'nroot', 'lnax', 'ln1', 'cosm', 'xsin3', 'polyexp', 'lnpoly', 'ratinf',
    'xlnx', 'xsin', 'infinf1', 'infinf2', 'pow1', 'pow0', 'misuse', 'nolimit', 'cycle',
  ];
  function kindLabel(k) {
    switch (k) {
      case 'sin': return Tx('0/0: sin(ax) / tan(ax) oranı', '0/0: sin(ax) / tan(ax) ratio');
      case 'exp1': return Tx('0/0: (eᵃˣ − 1)/(bx)', '0/0: (eᵃˣ − 1)/(bx)');
      case 'exp2': return Tx('0/0: (eᵃˣ − eᵇˣ)/x', '0/0: (eᵃˣ − eᵇˣ)/x');
      case 'nroot': return Tx('0/0: (xⁿ − cⁿ)/(x − c)', '0/0: (xⁿ − cⁿ)/(x − c)');
      case 'lnax': return Tx('0/0: ln(1 + ax)/(bx)', '0/0: ln(1 + ax)/(bx)');
      case 'ln1': return Tx('0/0: ln x /(xⁿ − 1), x → 1', '0/0: ln x /(xⁿ − 1), x → 1');
      case 'cosm': return Tx('0/0 iki kez: (1 − cos ax)/(bx²)', '0/0 twice: (1 − cos ax)/(bx²)');
      case 'xsin3': return Tx('0/0 üç kez: (ax − sin ax)/x³', '0/0 three times: (ax − sin ax)/x³');
      case 'polyexp': return Tx('∞/∞: xⁿ/eᵃˣ, x → ∞', '∞/∞: xⁿ/eᵃˣ, x → ∞');
      case 'lnpoly': return Tx('∞/∞: ln x / xⁿ, x → ∞', '∞/∞: ln x / xⁿ, x → ∞');
      case 'ratinf': return Tx('∞/∞: iki polinomun oranı, x → ∞', '∞/∞: ratio of two polynomials, x → ∞');
      case 'xlnx': return Tx('0·∞: xⁿ ln x, x → 0⁺', '0·∞: xⁿ ln x, x → 0⁺');
      case 'xsin': return Tx('∞·0: x·sin(a/x) veya x(eᵃ/ˣ − 1)', '∞·0: x·sin(a/x) or x(eᵃ/ˣ − 1)');
      case 'infinf1': return Tx('∞ − ∞: rasyonel fark', '∞ − ∞: rational difference');
      case 'infinf2': return Tx('∞ − ∞: 1/x − 1/sin x ve 1/x − 1/(eˣ − 1)', '∞ − ∞: 1/x − 1/sin x and 1/x − 1/(eˣ − 1)');
      case 'pow1': return Tx('1^∞: (1 + ax)^(b/x) ve (1 + a/x)^(bx)', '1^∞: (1 + ax)^(b/x) and (1 + a/x)^(bx)');
      case 'pow0': return Tx('0⁰ ve ∞⁰: x^(kx), x^(k/x)', '0⁰ and ∞⁰: x^(kx), x^(k/x)');
      case 'misuse': return Tx('Tuzak: belirsiz OLMAYAN limit', 'Pitfall: a limit that is NOT indeterminate');
      case 'nolimit': return Tx('Tuzak: f\'/g\' limiti yok', 'Pitfall: f\'/g\' has no limit');
      case 'cycle': return Tx('Tuzak: kural döngüye giriyor', 'Pitfall: the rule goes in circles');
      default: return Tx('Rastgele', 'Random');
    }
  }

  function createProblem(rng, kindArg) {
    const kind = kindArg || (forcedKind === 'random' ? rng.pick(KINDS) : forcedKind);
    const p = { kind, s: 1.2, showDeriv: true };
    const I = (a, b) => rng.nextInt(a, b + 1);
    switch (kind) {
      case 'sin': p.fn = rng.pick(['sin', 'tan']); p.a = I(2, 5); do { p.b = I(1, 6); } while (p.b === p.a); break;
      case 'exp1': p.a = I(1, 4); p.b = I(1, 5); break;
      case 'exp2': p.a = I(1, 4); do { p.b = I(1, 3); } while (p.b === p.a); break;
      case 'nroot': p.n = I(2, 4); p.c = rng.nonZeroInt(-3, 3); break;
      case 'lnax': p.a = I(1, 4); p.b = I(1, 5); break;
      case 'ln1': p.n = I(2, 4); break;
      case 'cosm': p.a = I(1, 4); p.b = I(1, 5); break;
      case 'xsin3': p.a = I(1, 3); break;
      case 'polyexp': p.n = I(2, 3); p.a = I(1, 3); break;
      case 'lnpoly': p.n = I(1, 3); break;
      case 'ratinf': p.a = I(1, 4); p.b = I(1, 4); p.p = I(-4, 4); p.q = I(-4, 4); p.r = I(0, 3); p.t = I(1, 5); break;
      case 'xlnx': p.n = I(1, 3); break;
      case 'xsin': p.v = rng.pick(['sin', 'exp']); p.a = I(2, 6); break;
      case 'infinf1': p.c = I(1, 4); break;
      case 'infinf2': p.v = rng.pick(['sin', 'exp']); break;
      case 'pow1': p.v = rng.pick(['zero', 'inf']); p.a = I(1, 3); p.b = I(1, 2); break;
      case 'pow0': p.v = rng.pick(['zero', 'inf']); p.k = I(1, 3); break;
      case 'misuse': p.b = I(2, 6); do { p.a = I(1, 6); } while (p.a === p.b); break;
      case 'nolimit': p.a = I(1, 3); break;
      default: p.a = I(1, 4); break; // cycle
    }
    return p;
  }

  // ---------- axis helper ----------
  function autoY(fn, x0, x1, extra) {
    const vals = [];
    for (let i = 0; i <= 300; i++) {
      const v = fn(x0 + (x1 - x0) * i / 300);
      if (isFinite(v) && Math.abs(v) < 1e6) vals.push(v);
    }
    vals.sort((u, v) => u - v);
    let lo = 0, hi = 1;
    if (vals.length) {
      lo = vals[Math.floor(vals.length * 0.04)];
      hi = vals[Math.min(vals.length - 1, Math.ceil(vals.length * 0.96) - 1)];
    }
    (extra || []).forEach((e) => { if (isFinite(e)) { lo = Math.min(lo, e); hi = Math.max(hi, e); } });
    let span = hi - lo;
    if (!(span > 1e-6)) span = 1;
    const pad = Math.max(span * 0.2, 0.3);
    return [lo - pad, hi + pad];
  }

  // ---------- specification of one problem ----------
  // Returns { expr, a (number or Infinity), side: 'both'|'right', dmax, view:[x0,x1], f, f2, num?, den?, ans, ansS,
  //           levels:[{f,g,fv,gv,form,simp,val}], pre?(H,T), post?(H,T), custom?(H,T), note?, task }
  function spec(p) {
    const sp = { side: 'both', dmax: 2, task: 'direct' };
    const nan = (x, a) => (Math.abs(x - a) < 1e-9);
    switch (p.kind) {
      case 'sin': {
        const a = p.a, b = p.b, ax = cx(a, 'x'), bx = cx(b, 'x'), t = p.fn === 'tan';
        sp.expr = p.fn + '(' + ax + ') / (' + bx + ')'; sp.a = 0; sp.view = [-3, 3];
        sp.num = (x) => (t ? Math.tan(a * x) : Math.sin(a * x)); sp.den = (x) => b * x;
        sp.f = (x) => (nan(x, 0) ? NaN : sp.num(x) / sp.den(x));
        sp.f2 = (x) => (nan(x, 0) ? NaN : (t ? a / (b * Math.pow(Math.cos(a * x), 2)) : a * Math.cos(a * x) / b));
        sp.ans = a / b; sp.ansS = frS(fr(a, b));
        if (t) sp.view = [-1.2 / a, 1.2 / a], sp.dmax = 1 / a;
        sp.levels = [
          { f: p.fn + '(' + ax + ')', g: bx, fv: p.fn + ' 0 = 0', gv: '0', form: '0/0' },
          t ? { f: a + '/cos²(' + ax + ')', g: String(b), fv: a + '/cos² 0 = ' + a, gv: String(b), form: '' }
            : { f: co(a) + 'cos(' + ax + ')', g: String(b), fv: a + '·cos 0 = ' + a, gv: String(b), form: '' },
        ];
        sp.note = [t ? 'tan(u)/u → 1 standart limitini de kullanabilirdik: tan(ax)/(bx) = (a/b)·tan(ax)/(ax) → a/b.' : 'Standart limit sin(u)/u → 1 ile de aynı sonuç: sin(ax)/(bx) = (a/b)·sin(ax)/(ax) → a/b.',
          t ? 'The standard limit tan(u)/u → 1 gives the same: tan(ax)/(bx) = (a/b)·tan(ax)/(ax) → a/b.' : 'The standard limit sin(u)/u → 1 gives the same: sin(ax)/(bx) = (a/b)·sin(ax)/(ax) → a/b.'];
        break;
      }
      case 'exp1': {
        const a = p.a, b = p.b;
        sp.expr = '(' + ex(a) + ' − 1) / (' + cx(b, 'x') + ')'; sp.a = 0; sp.view = [-3, 3]; sp.dmax = 2;
        if (a >= 3) { sp.view = [-2, 1.5]; sp.dmax = 1.2; }
        sp.num = (x) => Math.exp(a * x) - 1; sp.den = (x) => b * x;
        sp.f = (x) => (nan(x, 0) ? NaN : safe(sp.num(x) / sp.den(x)));
        sp.f2 = (x) => (nan(x, 0) ? NaN : safe(a * Math.exp(a * x) / b));
        sp.ans = a / b; sp.ansS = frS(fr(a, b));
        sp.levels = [
          { f: ex(a) + ' − 1', g: cx(b, 'x'), fv: 'e⁰ − 1 = 0', gv: '0', form: '0/0' },
          { f: co(a) + ex(a), g: String(b), fv: a === 1 ? 'e⁰ = 1' : a + '·e⁰ = ' + a, gv: String(b), form: '' },
        ];
        break;
      }
      case 'exp2': {
        const a = p.a, b = p.b;
        sp.expr = '(' + ex(a) + ' − ' + ex(b) + ') / x'; sp.a = 0; sp.view = [-2, 1.5]; sp.dmax = 1.2;
        sp.num = (x) => Math.exp(a * x) - Math.exp(b * x); sp.den = (x) => x;
        sp.f = (x) => (nan(x, 0) ? NaN : safe(sp.num(x) / x));
        sp.f2 = (x) => (nan(x, 0) ? NaN : safe(a * Math.exp(a * x) - b * Math.exp(b * x)));
        sp.ans = a - b; sp.ansS = S(a - b);
        sp.levels = [
          { f: ex(a) + ' − ' + ex(b), g: 'x', fv: 'e⁰ − e⁰ = 0', gv: '0', form: '0/0' },
          { f: co(a) + ex(a) + ' − ' + co(b) + ex(b), g: '1', fv: a + ' − ' + b + ' = ' + (a - b), gv: '1', form: '' },
        ];
        break;
      }
      case 'nroot': {
        const n = p.n, c = p.c, cn = Math.pow(c, n);
        sp.expr = '(x' + sup(n) + plusC(-cn) + ') / (x' + plusC(-c) + ')'; sp.a = c; sp.view = [c - 3, c + 3]; sp.dmax = 2;
        sp.num = (x) => Math.pow(x, n) - cn; sp.den = (x) => x - c;
        sp.f = (x) => (nan(x, c) ? NaN : sp.num(x) / sp.den(x));
        sp.f2 = (x) => n * Math.pow(x, n - 1);
        sp.ans = n * Math.pow(c, n - 1); sp.ansS = S(sp.ans);
        sp.levels = [
          { f: 'x' + sup(n) + plusC(-cn), g: 'x' + plusC(-c), fv: P(c) + sup(n) + ' − ' + P(c) + sup(n) + ' = 0', gv: '0', form: '0/0' },
          { f: n + 'x' + sup(n - 1), g: '1', fv: n + '·' + P(c) + sup(n - 1) + ' = ' + S(sp.ans), gv: '1', form: '' },
        ];
        sp.note = ['Cebirle de çözülür: xⁿ − cⁿ = (x − c)(xⁿ⁻¹ + c·xⁿ⁻² + … + cⁿ⁻¹); (x − c) sadeleşir ve x = c yerine konunca n terimin her biri cⁿ⁻¹ olur: n·cⁿ⁻¹. Bu, türev tanımının (xⁿ)′ = n·xⁿ⁻¹ sonucudur.',
          'It can also be done by algebra: xⁿ − cⁿ = (x − c)(xⁿ⁻¹ + c·xⁿ⁻² + … + cⁿ⁻¹); (x − c) cancels and at x = c each of the n terms equals cⁿ⁻¹, giving n·cⁿ⁻¹. This is just the derivative (xⁿ)′ = n·xⁿ⁻¹.'];
        break;
      }
      case 'lnax': {
        const a = p.a, b = p.b, ax = cx(a, 'x');
        sp.expr = 'ln(1 + ' + ax + ') / (' + cx(b, 'x') + ')'; sp.a = 0; sp.view = [-0.8 / a, 3 / a]; sp.dmax = 0.8 / a;
        sp.num = (x) => (1 + a * x > 0 ? Math.log(1 + a * x) : NaN); sp.den = (x) => b * x;
        sp.f = (x) => (nan(x, 0) ? NaN : sp.num(x) / sp.den(x));
        sp.f2 = (x) => (1 + a * x > 0 ? a / (b * (1 + a * x)) : NaN);
        sp.ans = a / b; sp.ansS = frS(fr(a, b));
        sp.levels = [
          { f: 'ln(1 + ' + ax + ')', g: cx(b, 'x'), fv: 'ln 1 = 0', gv: '0', form: '0/0' },
          { f: a + '/(1 + ' + ax + ')', g: String(b), fv: a + '/(1 + 0) = ' + a, gv: String(b), form: '' },
        ];
        break;
      }
      case 'ln1': {
        const n = p.n;
        sp.expr = 'ln x / (x' + sup(n) + ' − 1)'; sp.a = 1; sp.view = [0.05, 3]; sp.dmax = 0.9;
        sp.num = (x) => (x > 0 ? Math.log(x) : NaN); sp.den = (x) => Math.pow(x, n) - 1;
        sp.f = (x) => (x <= 0 || nan(x, 1) ? NaN : sp.num(x) / sp.den(x));
        sp.f2 = (x) => (x <= 0 ? NaN : 1 / (n * Math.pow(x, n)));
        sp.ans = 1 / n; sp.ansS = '1/' + n;
        sp.levels = [
          { f: 'ln x', g: 'x' + sup(n) + ' − 1', fv: 'ln 1 = 0', gv: '1 − 1 = 0', form: '0/0' },
          { f: '1/x', g: n + 'x' + sup(n - 1), fv: '1/1 = 1', gv: n + '·1 = ' + n, form: '' },
        ];
        break;
      }
      case 'cosm': {
        const a = p.a, b = p.b, ax = cx(a, 'x');
        sp.expr = '(1 − cos(' + ax + ')) / (' + co(b) + 'x²)'; sp.a = 0; sp.view = [-3, 3]; sp.dmax = 2;
        if (a >= 3) { sp.view = [-2, 2]; sp.dmax = 1; }
        sp.num = (x) => 1 - Math.cos(a * x); sp.den = (x) => b * x * x;
        sp.f = (x) => (nan(x, 0) ? NaN : sp.num(x) / sp.den(x));
        sp.f2 = (x) => (nan(x, 0) ? NaN : a * Math.sin(a * x) / (2 * b * x));
        sp.ans = a * a / (2 * b); const q = fr(a * a, 2 * b); sp.ansS = frS(q);
        sp.levels = [
          { f: '1 − cos(' + ax + ')', g: co(b) + 'x²', fv: '1 − cos 0 = 0', gv: '0', form: '0/0' },
          { f: co(a) + 'sin(' + ax + ')', g: cx(2 * b, 'x'), fv: 'sin 0 = 0', gv: '0', form: '0/0' },
          { f: co(a * a) + 'cos(' + ax + ')', g: String(2 * b), fv: a * a + '·cos 0 = ' + a * a, gv: String(2 * b), form: '', val: a * a + '/' + 2 * b + ((q.n === a * a && q.d === 2 * b) ? '' : ' = ' + frS(q)) },
        ];
        break;
      }
      case 'xsin3': {
        const a = p.a, ax = cx(a, 'x');
        sp.expr = '(' + ax + ' − sin(' + ax + ')) / x³'; sp.a = 0; sp.view = [-3, 3]; sp.dmax = 2;
        sp.num = (x) => a * x - Math.sin(a * x); sp.den = (x) => x * x * x;
        sp.f = (x) => (nan(x, 0) ? NaN : safe(sp.num(x) / sp.den(x)));
        sp.f2 = (x) => (nan(x, 0) ? NaN : a * (1 - Math.cos(a * x)) / (3 * x * x));
        const q = fr(a * a * a, 6); sp.ans = a * a * a / 6; sp.ansS = frS(q);
        sp.levels = [
          { f: ax + ' − sin(' + ax + ')', g: 'x³', fv: '0 − 0 = 0', gv: '0', form: '0/0' },
          { f: a + ' − ' + co(a) + 'cos(' + ax + ')', g: '3x²', fv: a + ' − ' + a + ' = 0', gv: '0', form: '0/0' },
          { f: co(a * a) + 'sin(' + ax + ')', g: '6x', fv: 'sin 0 = 0', gv: '0', form: '0/0' },
          { f: co(a * a * a) + 'cos(' + ax + ')', g: '6', fv: a * a * a + '·cos 0 = ' + a * a * a, gv: '6', form: '', val: a * a * a + '/6' + ((q.n === a * a * a && q.d === 6) ? '' : ' = ' + frS(q)) },
        ];
        break;
      }
      case 'polyexp': {
        const n = p.n, a = p.a;
        sp.expr = 'x' + sup(n) + ' / ' + ex(a); sp.a = Infinity; sp.view = [0, 14 / a];
        sp.num = (x) => Math.pow(x, n); sp.den = (x) => Math.exp(a * x);
        sp.f = (x) => safe(sp.num(x) / sp.den(x)); sp.f2 = (x) => safe(n * Math.pow(x, n - 1) / (a * Math.exp(a * x)));
        sp.ans = 0; sp.ansS = '0';
        sp.levels = [];
        for (let k = 0; k <= n; k++) {
          const m = n - k, cf = fact(n) / fact(m), ak = Math.pow(a, k);
          const fs = m === 0 ? String(cf) : co(cf) + 'x' + sup(m);
          const gs = co(ak) + ex(a);
          if (k < n) sp.levels.push({ f: fs, g: gs, fv: '∞', gv: '∞', form: '∞/∞' });
          else sp.levels.push({ f: fs, g: gs, fv: fs, gv: '∞', form: '', val: '0' });
        }
        sp.note = ['Üstel fonksiyon her kuvvetten hızlı büyür: x → ∞ iken eᵃˣ, xⁿ\'i her zaman geçer; xⁿ/eᵃˣ → 0.',
          'The exponential outgrows every power: as x → ∞, eᵃˣ beats xⁿ every time, so xⁿ/eᵃˣ → 0.'];
        break;
      }
      case 'lnpoly': {
        const n = p.n;
        sp.expr = 'ln x / x' + sup(n); sp.a = Infinity; sp.view = [0.1, 20];
        sp.num = (x) => (x > 0 ? Math.log(x) : NaN); sp.den = (x) => Math.pow(x, n);
        sp.f = (x) => (x > 0 ? sp.num(x) / sp.den(x) : NaN); sp.f2 = (x) => (x > 0 ? 1 / (n * Math.pow(x, n)) : NaN);
        sp.ans = 0; sp.ansS = '0';
        sp.levels = [
          { f: 'ln x', g: 'x' + sup(n), fv: '∞', gv: '∞', form: '∞/∞' },
          { f: '1/x', g: n === 1 ? '1' : n + 'x' + sup(n - 1), fv: '0', gv: n === 1 ? '1' : '∞', form: '', val: '0' },
        ];
        sp.levels[1].simp = n === 1 ? '1/x' : '1/(' + n + 'x' + sup(n) + ')';
        sp.note = ['Logaritma her pozitif kuvvetten yavaş büyür: ln x ≪ xⁿ (x → ∞).', 'The logarithm grows slower than every positive power: ln x ≪ xⁿ (x → ∞).'];
        break;
      }
      case 'ratinf': {
        const a = p.a, b = p.b, pp = p.p, q = p.q, r = p.r, t = p.t;
        const N = poly([[a, 'x²'], [pp, 'x'], [q, '']]), D = poly([[b, 'x²'], [r, 'x'], [t, '']]);
        sp.expr = '(' + N + ') / (' + D + ')'; sp.a = Infinity; sp.view = [0, 30];
        sp.num = (x) => a * x * x + pp * x + q; sp.den = (x) => b * x * x + r * x + t;
        sp.f = (x) => sp.num(x) / sp.den(x); sp.f2 = (x) => (2 * a * x + pp) / (2 * b * x + r);
        const fa = fr(a, b); sp.ans = a / b; sp.ansS = frS(fa);
        sp.levels = [
          { f: N, g: D, fv: '∞', gv: '∞', form: '∞/∞' },
          { f: poly([[2 * a, 'x'], [pp, '']]), g: poly([[2 * b, 'x'], [r, '']]), fv: '∞', gv: '∞', form: '∞/∞' },
          { f: String(2 * a), g: String(2 * b), fv: String(2 * a), gv: String(2 * b), form: '', val: 2 * a + '/' + 2 * b + (fa.d === 2 * b ? '' : ' = ' + frS(fa)) },
        ];
        sp.note = ['Kısayol: payı ve paydayı x²\'ye bölersek yalnızca baş katsayılar kalır: a/b. L\'Hôpital aynı sonucu iki türevle verir.',
          'Shortcut: divide numerator and denominator by x² and only the leading coefficients survive: a/b. L\'Hôpital reaches the same result with two derivatives.'];
        break;
      }
      case 'xlnx': {
        const n = p.n;
        sp.task = 'rewrite'; sp.expr = 'x' + sup(n) + '·ln x'; sp.a = 0; sp.side = 'right'; sp.view = [0, 2]; sp.dmax = 1.5;
        sp.f = (x) => (x > 0 ? Math.pow(x, n) * Math.log(x) : NaN);
        sp.f2 = (x) => (x > 0 ? -Math.pow(x, n) / n : NaN);
        sp.ans = 0; sp.ansS = '0';
        sp.pre = (H, T) => {
          H('0·∞ biçimini bölüme çevir', 'Turn the 0·∞ form into a quotient');
          T('x → 0⁺ iken x' + sup(n) + ' → 0 ve ln x → −∞: çarpım 0·(−∞) biçimindedir; bu BELİRSİZDİR ve L\'Hôpital doğrudan uygulanamaz.',
            'As x → 0⁺, x' + sup(n) + ' → 0 and ln x → −∞: the product has the form 0·(−∞), which is INDETERMINATE, and L\'Hôpital cannot be applied directly.');
          T('Çarpanlardan birini paydaya al: x' + sup(n) + '·ln x = ln x / (1/x' + sup(n) + '). Artık pay → −∞, payda → +∞: ∞/∞ biçimi.',
            'Move one factor into the denominator: x' + sup(n) + '·ln x = ln x / (1/x' + sup(n) + '). Now numerator → −∞, denominator → +∞: an ∞/∞ form.');
        };
        sp.levels = [
          { f: 'ln x', g: '1/x' + sup(n), fv: '−∞', gv: '+∞', form: '∞/∞' },
          { f: '1/x', g: '−' + n + '/x' + sup(n + 1), fv: '+∞', gv: '−∞', form: '', simp: '−x' + sup(n) + (n === 1 ? '' : '/' + n), val: '0', fvText: true },
        ];
        sp.levels[1].simp = '−x' + sup(n) + (n === 1 ? '' : '/' + n);
        sp.note = ['Seçim önemli: ters yönde (x ↦ x' + sup(n) + '/(1/ln x)) yazsaydık türevler daha karmaşık olurdu. Genel kural: ln\'yi paya, kuvveti paydaya (1/xⁿ biçiminde) koy.',
          'The choice matters: writing it the other way (x' + sup(n) + ' / (1/ln x)) would make the derivatives messier. Rule of thumb: put ln in the numerator and the power in the denominator (as 1/xⁿ).'];
        break;
      }
      case 'xsin': {
        const a = p.a, isS = p.v === 'sin';
        sp.task = 'rewrite'; sp.expr = isS ? 'x·sin(' + a + '/x)' : 'x·(e^(' + a + '/x) − 1)'; sp.a = Infinity; sp.view = [1, 40];
        sp.f = (x) => (x > 0 ? (isS ? x * Math.sin(a / x) : x * (Math.exp(a / x) - 1)) : NaN);
        sp.f2 = (x) => (x > 0 ? (isS ? a * Math.cos(a / x) : a * Math.exp(a / x)) : NaN);
        sp.ans = a; sp.ansS = String(a);
        const g0 = isS ? 'sin(' + a + '/x)' : 'e^(' + a + '/x) − 1';
        sp.pre = (H, T) => {
          H('∞·0 biçimini bölüme çevir', 'Turn the ∞·0 form into a quotient');
          T('x → ∞ iken x → ∞ ve ' + g0 + ' → 0: çarpım ∞·0 biçimindedir (belirsiz).', 'As x → ∞, x → ∞ and ' + g0 + ' → 0: the product has the form ∞·0 (indeterminate).');
          T('x = 1/(1/x) yazarak x\'i paydaya al: ' + sp.expr + ' = (' + g0 + ') / (1/x). Şimdi pay → 0, payda → 0: 0/0 biçimi.',
            'Write x = 1/(1/x) and move it down: ' + sp.expr + ' = (' + g0 + ') / (1/x). Now numerator → 0, denominator → 0: a 0/0 form.');
        };
        sp.levels = [
          { f: g0, g: '1/x', fv: isS ? 'sin 0 = 0' : 'e⁰ − 1 = 0', gv: '0', form: '0/0' },
          isS ? { f: 'cos(' + a + '/x)·(−' + a + '/x²)', g: '−1/x²', fv: a + '·cos 0 = ' + a, gv: '', form: '', simp: a + '·cos(' + a + '/x)', val: String(a), fvText: true }
            : { f: 'e^(' + a + '/x)·(−' + a + '/x²)', g: '−1/x²', fv: a + '·e⁰ = ' + a, gv: '', form: '', simp: a + '·e^(' + a + '/x)', val: String(a), fvText: true },
        ];
        break;
      }
      case 'infinf1': {
        const c = p.c;
        sp.task = 'rewrite'; sp.expr = '1/(x' + plusC(-c) + ') − ' + 2 * c + '/(x²' + plusC(-c * c) + ')'; sp.a = c; sp.view = [c - 3, c + 3]; sp.dmax = 1.5;
        sp.f = (x) => (nan(x, c) || nan(x, -c) ? NaN : safe(1 / (x - c) - 2 * c / (x * x - c * c)));
        sp.f2 = (x) => (nan(x, 0) ? NaN : 1 / (2 * x));
        sp.ans = 1 / (2 * c); sp.ansS = frS(fr(1, 2 * c));
        sp.pre = (H, T) => {
          H('∞ − ∞ biçimini tek kesire çevir', 'Combine the ∞ − ∞ form into one fraction');
          T('x → ' + c + ' iken her iki terim de sınırsız büyür (1/(x' + plusC(-c) + ') ve ' + 2 * c + '/(x²' + plusC(-c * c) + ')): fark ∞ − ∞ biçimindedir (belirsiz).',
            'As x → ' + c + ' both terms blow up (1/(x' + plusC(-c) + ') and ' + 2 * c + '/(x²' + plusC(-c * c) + ')): the difference has the form ∞ − ∞ (indeterminate).');
          T('Ortak payda x² ' + plusC(-c * c).trim() + ' = (x − ' + c + ')(x + ' + c + '): ' + '(x + ' + c + ') − ' + 2 * c + ' = x' + plusC(-c) + ' olduğundan ifade (x' + plusC(-c) + ')/(x²' + plusC(-c * c) + ') olur. Pay → 0, payda → 0: 0/0.',
            'Common denominator x² ' + plusC(-c * c).trim() + ' = (x − ' + c + ')(x + ' + c + '): since (x + ' + c + ') − ' + 2 * c + ' = x' + plusC(-c) + ', the expression becomes (x' + plusC(-c) + ')/(x²' + plusC(-c * c) + '). Numerator → 0, denominator → 0: 0/0.');
        };
        sp.levels = [
          { f: 'x' + plusC(-c), g: 'x²' + plusC(-c * c), fv: '0', gv: '0', form: '0/0' },
          { f: '1', g: '2x', fv: '1', gv: '2·' + c + ' = ' + 2 * c, form: '', val: '1/' + 2 * c },
        ];
        sp.note = ['Cebirle de çıkar: (x − c)/((x − c)(x + c)) = 1/(x + c) → 1/(2c).', 'Algebra gives it too: (x − c)/((x − c)(x + c)) = 1/(x + c) → 1/(2c).'];
        break;
      }
      case 'infinf2': {
        const isS = p.v === 'sin';
        sp.task = 'rewrite'; sp.expr = isS ? '1/x − 1/sin x' : '1/x − 1/(eˣ − 1)'; sp.a = 0; sp.view = [-3, 3]; sp.dmax = 2;
        sp.f = (x) => (nan(x, 0) ? NaN : safe(isS ? 1 / x - 1 / Math.sin(x) : 1 / x - 1 / (Math.exp(x) - 1)));
        sp.f2 = (x) => (nan(x, 0) ? NaN : safe(isS ? (Math.cos(x) - 1) / (Math.sin(x) + x * Math.cos(x)) : (Math.exp(x) - 1) / (Math.exp(x) - 1 + x * Math.exp(x))));
        sp.ans = isS ? 0 : 0.5; sp.ansS = isS ? '0' : '1/2';
        sp.pre = (H, T) => {
          H('∞ − ∞ biçimini tek kesire çevir', 'Combine the ∞ − ∞ form into one fraction');
          T('x → 0 iken 1/x ve ' + (isS ? '1/sin x' : '1/(eˣ − 1)') + ' sınırsız büyür: fark ∞ − ∞ (belirsiz).',
            'As x → 0, 1/x and ' + (isS ? '1/sin x' : '1/(eˣ − 1)') + ' blow up: the difference is ∞ − ∞ (indeterminate).');
          T('Ortak payda: ' + (isS ? '1/x − 1/sin x = (sin x − x)/(x sin x)' : '1/x − 1/(eˣ − 1) = (eˣ − 1 − x)/(x(eˣ − 1))') + '. Pay → 0, payda → 0: 0/0.',
            'Common denominator: ' + (isS ? '1/x − 1/sin x = (sin x − x)/(x sin x)' : '1/x − 1/(eˣ − 1) = (eˣ − 1 − x)/(x(eˣ − 1))') + '. Numerator → 0, denominator → 0: 0/0.');
        };
        sp.levels = isS ? [
          { f: 'sin x − x', g: 'x sin x', fv: '0', gv: '0', form: '0/0' },
          { f: 'cos x − 1', g: 'sin x + x cos x', fv: '0', gv: '0', form: '0/0' },
          { f: '−sin x', g: '2cos x − x sin x', fv: '0', gv: '2', form: '', val: '0/2 = 0' },
        ] : [
          { f: 'eˣ − 1 − x', g: 'x(eˣ − 1)', fv: '0', gv: '0', form: '0/0' },
          { f: 'eˣ − 1', g: 'eˣ − 1 + xeˣ', fv: '0', gv: '0', form: '0/0' },
          { f: 'eˣ', g: '2eˣ + xeˣ', fv: 'e⁰ = 1', gv: '2 + 0 = 2', form: '', val: '1/2' },
        ];
        sp.note = ['Payda çarpım olduğunda türev için ÇARPIM kuralını kullanmayı unutma: (x sin x)′ = sin x + x cos x.', 'When the denominator is a product, remember the PRODUCT rule: (x sin x)′ = sin x + x cos x.'];
        break;
      }
      case 'pow1': {
        const a = p.a, b = p.b, ab = a * b, isZ = p.v === 'zero';
        sp.task = 'rewrite';
        if (isZ) {
          sp.expr = '(1 + ' + cx(a, 'x') + ')^(' + b + '/x)'; sp.a = 0; sp.view = [-0.5 / a, 4 / a]; sp.dmax = 0.5 / a;
          sp.f = (x) => (nan(x, 0) || 1 + a * x <= 0 ? NaN : safe(Math.pow(1 + a * x, b / x)));
          sp.f2 = (x) => (nan(x, 0) || 1 + a * x <= 0 ? NaN : Math.exp(ab / (1 + a * x)));
        } else {
          sp.expr = '(1 + ' + a + '/x)^(' + cx(b, 'x') + ')'; sp.a = Infinity; sp.view = [0.5, 40];
          sp.f = (x) => (x > 0 ? safe(Math.pow(1 + a / x, b * x)) : NaN);
          sp.f2 = (x) => (x > 0 ? Math.exp(ab / (1 + a / x)) : NaN);
        }
        sp.ans = Math.exp(ab); sp.ansS = 'e^' + ab;
        sp.pre = (H, T) => {
          H('1^∞ biçimini logaritmayla çöz', 'Handle the 1^∞ form with a logarithm');
          T(isZ ? 'x → 0 iken taban 1 + ' + cx(a, 'x') + ' → 1 ve üs ' + b + '/x → ∞: ifade 1^∞ biçimindedir (belirsiz).' : 'x → ∞ iken taban 1 + ' + a + '/x → 1 ve üs ' + cx(b, 'x') + ' → ∞: ifade 1^∞ biçimindedir (belirsiz).',
            isZ ? 'As x → 0 the base 1 + ' + cx(a, 'x') + ' → 1 and the exponent ' + b + '/x → ∞: the expression has the form 1^∞ (indeterminate).' : 'As x → ∞ the base 1 + ' + a + '/x → 1 and the exponent ' + cx(b, 'x') + ' → ∞: the expression has the form 1^∞ (indeterminate).');
          T('y = ' + sp.expr + ' diyelim ve ln alalım: ln y = ' + (isZ ? b + '·ln(1 + ' + cx(a, 'x') + ') / x' : b + 'x·ln(1 + ' + a + '/x) = ' + co(b) + 'ln(1 + ' + a + '/x) / (1/x)') + '. Bu bir 0/0 biçimidir.',
            'Let y = ' + sp.expr + ' and take the logarithm: ln y = ' + (isZ ? b + '·ln(1 + ' + cx(a, 'x') + ') / x' : b + 'x·ln(1 + ' + a + '/x) = ' + co(b) + 'ln(1 + ' + a + '/x) / (1/x)') + '. This is a 0/0 form.');
        };
        sp.levels = isZ ? [
          { f: co(b) + 'ln(1 + ' + cx(a, 'x') + ')', g: 'x', fv: 'ln 1 = 0', gv: '0', form: '0/0' },
          { f: ab + '/(1 + ' + cx(a, 'x') + ')', g: '1', fv: ab + '/(1 + 0) = ' + ab, gv: '1', form: '', val: String(ab) },
        ] : [
          { f: co(b) + 'ln(1 + ' + a + '/x)', g: '1/x', fv: 'ln 1 = 0', gv: '0', form: '0/0' },
          { f: (b > 1 ? b + '·' : '') + '(−' + a + '/x²)/(1 + ' + a + '/x)', g: '−1/x²', fv: ab + '/(1 + 0) = ' + ab, gv: '', form: '', simp: ab + '/(1 + ' + a + '/x)', val: String(ab), fvText: true },
        ];
        sp.post = (H, T) => {
          H('Üsse çevir (ln y → ' + ab + ' ⇒ y → e^' + ab + ')', 'Exponentiate (ln y → ' + ab + ' ⇒ y → e^' + ab + ')');
          T('ln y → ' + ab + ' olduğundan y = e^(ln y) → e^' + ab + ' ≈ ' + nf(Math.exp(ab), 4) + '.', 'Since ln y → ' + ab + ', y = e^(ln y) → e^' + ab + ' ≈ ' + nf(Math.exp(ab), 4) + '.');
        };
        break;
      }
      case 'pow0': {
        const k = p.k, isZ = p.v === 'zero';
        sp.task = 'rewrite';
        if (isZ) {
          sp.expr = 'x^(' + cx(k, 'x') + ')'; sp.a = 0; sp.side = 'right'; sp.view = [0, 2]; sp.dmax = 1.5;
          sp.f = (x) => (x > 0 ? Math.pow(x, k * x) : NaN);
          sp.f2 = (x) => (x > 0 ? Math.exp(-k * x) : NaN);
        } else {
          sp.expr = 'x^(' + k + '/x)'; sp.a = Infinity; sp.view = [0.2, 30];
          sp.f = (x) => (x > 0 ? safe(Math.pow(x, k / x)) : NaN);
          sp.f2 = (x) => (x > 0 ? safe(Math.exp(k / x)) : NaN);
        }
        sp.ans = 1; sp.ansS = '1';
        sp.pre = (H, T) => {
          H(isZ ? '0⁰ biçimini logaritmayla çöz' : '∞⁰ biçimini logaritmayla çöz', isZ ? 'Handle the 0⁰ form with a logarithm' : 'Handle the ∞⁰ form with a logarithm');
          T(isZ ? 'x → 0⁺ iken taban x → 0 ve üs ' + cx(k, 'x') + ' → 0: ifade 0⁰ biçimindedir (belirsiz).' : 'x → ∞ iken taban x → ∞ ve üs ' + k + '/x → 0: ifade ∞⁰ biçimindedir (belirsiz).',
            isZ ? 'As x → 0⁺ the base x → 0 and the exponent ' + cx(k, 'x') + ' → 0: the expression has the form 0⁰ (indeterminate).' : 'As x → ∞ the base x → ∞ and the exponent ' + k + '/x → 0: the expression has the form ∞⁰ (indeterminate).');
          T('y = ' + sp.expr + ' diyelim ve ln alalım: ln y = ' + (isZ ? cx(k, 'x') + '·ln x = ' + co(k) + 'ln x / (1/x)' : co(k) + 'ln x / x') + '. Bu bir ' + (isZ ? '(−∞)/∞' : '∞/∞') + ' biçimidir.',
            'Let y = ' + sp.expr + ' and take the logarithm: ln y = ' + (isZ ? cx(k, 'x') + '·ln x = ' + co(k) + 'ln x / (1/x)' : co(k) + 'ln x / x') + '. This is a ' + (isZ ? '(−∞)/∞' : '∞/∞') + ' form.');
        };
        sp.levels = isZ ? [
          { f: co(k) + 'ln x', g: '1/x', fv: '−∞', gv: '+∞', form: '∞/∞' },
          { f: k + '/x', g: '−1/x²', fv: '+∞', gv: '−∞', form: '', simp: '−' + cx(k, 'x'), val: '0', fvText: true },
        ] : [
          { f: co(k) + 'ln x', g: 'x', fv: '∞', gv: '∞', form: '∞/∞' },
          { f: k + '/x', g: '1', fv: '0', gv: '1', form: '', val: '0' },
        ];
        sp.post = (H, T) => {
          H('Üsse çevir (ln y → 0 ⇒ y → e⁰ = 1)', 'Exponentiate (ln y → 0 ⇒ y → e⁰ = 1)');
          T('ln y → 0 olduğundan y = e^(ln y) → e⁰ = 1.', 'Since ln y → 0, y = e^(ln y) → e⁰ = 1.');
        };
        break;
      }
      case 'misuse': {
        const a = p.a, b = p.b, q = fr(a, b);
        sp.task = 'pitfall'; sp.expr = '(x + ' + a + ') / (x + ' + b + ')'; sp.a = 0; sp.view = [-1.5, 1.5]; sp.dmax = 1.2;
        sp.num = (x) => x + a; sp.den = (x) => x + b;
        sp.f = (x) => sp.num(x) / sp.den(x); sp.f2 = () => 1;
        sp.ans = a / b; sp.ansS = frS(q);
        sp.custom = (H, T) => {
          H('Önce yerine koy (HER ZAMAN ilk adım)', 'Substitute first (ALWAYS the first step)');
          T('x → 0: pay → ' + a + ', payda → ' + b + '. Biçim ' + a + '/' + b + ' sayısal bir orandır; 0/0 ya da ∞/∞ DEĞİLDİR, yani belirsiz değildir.',
            'x → 0: numerator → ' + a + ', denominator → ' + b + '. The form ' + a + '/' + b + ' is an ordinary number, NOT 0/0 or ∞/∞, so it is not indeterminate.');
          T('Fonksiyon x = 0\'da sürekli olduğu için limit doğrudan yerine koyarak bulunur: ' + a + '/' + b + (q.d === b && q.n === a ? '' : ' = ' + frS(q)) + '.',
            'The function is continuous at x = 0, so the limit is found by plain substitution: ' + a + '/' + b + (q.d === b && q.n === a ? '' : ' = ' + frS(q)) + '.');
          H('Yanlış yol: yine de L\'Hôpital uygulamak', 'The wrong path: applying L\'Hôpital anyway');
          T('Pay ve paydayı türetirsek (x + ' + a + ')′ = 1 ve (x + ' + b + ')′ = 1 olur; oran 1 çıkar.', 'Differentiating numerator and denominator gives (x + ' + a + ')′ = 1 and (x + ' + b + ')′ = 1, so the ratio is 1.');
          T('1 ≠ ' + frS(q) + ': bu YANLIŞ bir sonuçtur. Kuralın birinci koşulu (biçim 0/0 veya ∞/∞) sağlanmadığı için kural burada geçerli değildir.',
            '1 ≠ ' + frS(q) + ': this is a WRONG result. The first condition of the rule (form 0/0 or ∞/∞) fails, so the rule does not apply here.');
          H('Sonuç', 'Result');
          T('lim (x→0) (x + ' + a + ')/(x + ' + b + ') = ' + frS(q) + '. Grafikte eğri (0, ' + frS(q) + ') noktasından geçer; turuncu kesikli çizgi (yanlış tahmin 1) bu değerden farklıdır.',
            'lim (x→0) (x + ' + a + ')/(x + ' + b + ') = ' + frS(q) + '. On the graph the curve passes through (0, ' + frS(q) + '); the orange dashed line (the wrong prediction 1) differs from this value.');
        };
        break;
      }
      case 'nolimit': {
        const a = p.a;
        sp.task = 'pitfall'; sp.expr = '(x + ' + co(a) + 'sin x) / x'; sp.a = Infinity; sp.view = [0.5, 40];
        sp.num = (x) => x + a * Math.sin(x); sp.den = (x) => x;
        sp.f = (x) => (x > 0 ? 1 + a * Math.sin(x) / x : NaN); sp.f2 = (x) => 1 + a * Math.cos(x);
        sp.ans = 1; sp.ansS = '1';
        sp.custom = (H, T) => {
          H('Biçimi belirle', 'Identify the form');
          T('x → ∞: pay x + ' + co(a) + 'sin x → ∞ (çünkü |' + co(a) + 'sin x| ≤ ' + a + ' sınırlıdır), payda x → ∞. Biçim ∞/∞.',
            'x → ∞: the numerator x + ' + co(a) + 'sin x → ∞ (because |' + co(a) + 'sin x| ≤ ' + a + ' is bounded) and the denominator x → ∞. Form ∞/∞.');
          H('L\'Hôpital\'i dene', 'Try L\'Hôpital');
          T('Ayrı ayrı türet: pay′ = 1 + ' + co(a) + 'cos x, payda′ = 1. Yeni limit: lim (1 + ' + co(a) + 'cos x)/1.',
            'Differentiate separately: numerator′ = 1 + ' + co(a) + 'cos x, denominator′ = 1. New limit: lim (1 + ' + co(a) + 'cos x)/1.');
          T('cos x, x → ∞ iken −1 ile 1 arasında salınır; 1 + ' + co(a) + 'cos x, [' + S(1 - a) + ', ' + (1 + a) + '] aralığında dolaşır ve hiçbir değere yaklaşmaz: f′/g′ limiti YOKTUR.',
            'As x → ∞, cos x keeps oscillating between −1 and 1; 1 + ' + co(a) + 'cos x wanders over [' + S(1 - a) + ', ' + (1 + a) + '] and approaches no value: the limit of f′/g′ DOES NOT EXIST.');
          T('Kuralın 3. koşulu bozuldu. Bu, orijinal limitin olmadığı anlamına GELMEZ; kural sadece bu durumda hiçbir şey söylemez.',
            'Condition 3 of the rule fails. This does NOT mean the original limit does not exist; the rule simply says nothing in this case.');
          H('Başka yöntemle çöz', 'Solve it another way');
          T('Böl: (x + ' + co(a) + 'sin x)/x = 1 + ' + co(a) + 'sin x / x. Sınırlılık: |' + co(a) + 'sin x / x| ≤ ' + a + '/x → 0 (x → ∞).',
            'Split: (x + ' + co(a) + 'sin x)/x = 1 + ' + co(a) + 'sin x / x. Boundedness: |' + co(a) + 'sin x / x| ≤ ' + a + '/x → 0 as x → ∞.');
          H('Sonuç', 'Result');
          T('lim (x→∞) (x + ' + co(a) + 'sin x)/x = 1 + 0 = 1. Grafikte mavi eğri 1\'e oturur, turuncu kesikli f′/g′ eğrisi ise salınmaya devam eder.',
            'lim (x→∞) (x + ' + co(a) + 'sin x)/x = 1 + 0 = 1. On the graph the main curve settles on 1 while the orange dashed f′/g′ curve keeps oscillating.');
        };
        break;
      }
      default: { // cycle
        const a = p.a, a2 = a * a;
        sp.task = 'pitfall'; sp.expr = 'x / √(x² + ' + a2 + ')'; sp.a = Infinity; sp.view = [0.3, 30];
        sp.num = (x) => x; sp.den = (x) => Math.sqrt(x * x + a2);
        sp.f = (x) => (x > 0 ? x / Math.sqrt(x * x + a2) : NaN); sp.f2 = (x) => (x > 0 ? Math.sqrt(x * x + a2) / x : NaN);
        sp.ans = 1; sp.ansS = '1';
        sp.custom = (H, T) => {
          H('Biçimi belirle', 'Identify the form');
          T('x → ∞: pay x → ∞ ve payda √(x² + ' + a2 + ') → ∞. Biçim ∞/∞; L\'Hôpital denenebilir.', 'x → ∞: numerator x → ∞ and denominator √(x² + ' + a2 + ') → ∞. Form ∞/∞; L\'Hôpital may be tried.');
          H('1. kez L\'Hôpital', 'First application of L\'Hôpital');
          T('x′ = 1 ve (√(x² + ' + a2 + '))′ = x/√(x² + ' + a2 + '). Yeni oran: 1 / (x/√(x² + ' + a2 + ')) = √(x² + ' + a2 + ') / x, yine ∞/∞.',
            'x′ = 1 and (√(x² + ' + a2 + '))′ = x/√(x² + ' + a2 + '). New ratio: 1 / (x/√(x² + ' + a2 + ')) = √(x² + ' + a2 + ') / x, again ∞/∞.');
          H('2. kez L\'Hôpital', 'Second application of L\'Hôpital');
          T('(√(x² + ' + a2 + '))′ = x/√(x² + ' + a2 + ') ve x′ = 1: oran x/√(x² + ' + a2 + ') olur, yani BAŞLANGIÇ ifadesine geri döndük. Kural döngüye girdi; bilgi üretmiyor.',
            '(√(x² + ' + a2 + '))′ = x/√(x² + ' + a2 + ') and x′ = 1: the ratio is x/√(x² + ' + a2 + '), i.e. we are back at the ORIGINAL expression. The rule cycles and produces no information.');
          H('Başka yöntemle çöz', 'Solve it another way');
          T('x > 0 için payı ve paydayı x\'e böl: √(x² + ' + a2 + ')/x = √(1 + ' + a2 + '/x²). Böylece x/√(x² + ' + a2 + ') = 1 / √(1 + ' + a2 + '/x²).',
            'For x > 0 divide numerator and denominator by x: √(x² + ' + a2 + ')/x = √(1 + ' + a2 + '/x²). Hence x/√(x² + ' + a2 + ') = 1 / √(1 + ' + a2 + '/x²).');
          T('x → ∞ iken ' + a2 + '/x² → 0: limit = 1/√(1 + 0) = 1.', 'As x → ∞, ' + a2 + '/x² → 0: the limit is 1/√(1 + 0) = 1.');
          H('Sonuç', 'Result');
          T('lim (x→∞) x/√(x² + ' + a2 + ') = 1. Grafikte ana eğri 1\'e alttan yaklaşır; turuncu kesikli eğri (1. türev oranı) 1\'e üstten yaklaşır ve ikisi aynı limite gider.',
            'lim (x→∞) x/√(x² + ' + a2 + ') = 1. On the graph the main curve approaches 1 from below; the orange dashed curve (first derivative ratio) approaches 1 from above, and both tend to the same limit.');
        };
        break;
      }
    }
    sp.inf = sp.a === Infinity;
    return sp;
  }

  const atTxt = (sp) => (sp.inf ? 'x → ∞' : 'x → ' + S(sp.a) + (sp.side === 'right' ? '⁺' : ''));

  // probe points for the slider value s (0..4): finite -> distance, infinity -> x
  function probes(sp, s) {
    if (sp.inf) return [3 * Math.pow(10, 0.75 * s)];
    const d = sp.dmax * Math.pow(10, -0.75 * s);
    return sp.side === 'right' ? [sp.a + d] : [sp.a - d, sp.a + d];
  }

  // ---------- statement ----------
  function problemStatement(p) {
    const sp = spec(p);
    const lim = 'lim (' + atTxt(sp) + ')  ' + sp.expr;
    let extra;
    if (sp.task === 'pitfall') {
      if (p.kind === 'misuse') extra = Tx('Bir öğrenci pay ve paydayı türetip sonucu 1 buluyor. Bu işlem doğru mudur? Limitin doğru değerini bulun.', 'A student differentiates numerator and denominator and gets 1. Is that legitimate? Find the correct value of the limit.');
      else if (p.kind === 'nolimit') extra = Tx('L\'Hôpital kuralı uygulanabilir mi? Limitin değerini bulun ve kuralın burada neden yetersiz kaldığını açıklayın.', 'Can L\'Hôpital\'s rule be used here? Find the value of the limit and explain why the rule falls short.');
      else extra = Tx('L\'Hôpital kuralını denemeyi ve neden işe yaramadığını gösterin; sonra limiti başka bir yöntemle bulun.', 'Try L\'Hôpital\'s rule and show why it does not help; then find the limit by another method.');
    } else if (sp.task === 'rewrite') {
      extra = Tx('Önce belirsizlik biçimini adlandırın, cebirle 0/0 ya da ∞/∞ biçimine getirin, sonra L\'Hôpital kuralıyla limiti bulun.', 'First name the indeterminate form, convert it by algebra into 0/0 or ∞/∞, and then find the limit with L\'Hôpital\'s rule.');
    } else {
      extra = Tx('Önce yerine koyarak belirsizlik biçimini belirleyin, sonra L\'Hôpital kuralını (gerekirse tekrar tekrar) uygulayarak limiti bulun.', 'First identify the indeterminate form by substitution, then find the limit by applying L\'Hôpital\'s rule (repeatedly if needed).');
    }
    return Tx('Limiti hesaplayın:', 'Evaluate the limit:') + '\n' + lim + '\n' + extra;
  }

  // ---------- steps ----------
  function chainSteps(sp, H, T) {
    const Ls = sp.levels, at = atTxt(sp), L0 = Ls[0];
    const near = sp.inf ? Tx('büyük x için', 'for large x') : Tx('x = ' + S(sp.a) + ' yakınında', 'near x = ' + S(sp.a));
    H('Yerine koyarak biçimi belirle', 'Substitute to identify the form');
    T(at + ' iken pay f(x) = ' + L0.f + ' → ' + L0.fv + ', payda g(x) = ' + L0.g + ' → ' + L0.gv + '. Biçim ' + L0.form + ': BELİRSİZ, dolayısıyla L\'Hôpital adayı.',
      'As ' + at + ', numerator f(x) = ' + L0.f + ' → ' + L0.fv + ' and denominator g(x) = ' + L0.g + ' → ' + L0.gv + '. Form ' + L0.form + ': INDETERMINATE, so L\'Hôpital is a candidate.');
    H('Kural koşullarını denetle', 'Check the conditions of the rule');
    T('(1) Biçim ' + L0.form + ' ✓   (2) f ve g ' + near + ' türevlenebilir ✓   (3) g′(x) = ' + Ls[1].g + ' bu bölgede sıfır değil ✓. Kural kullanılabilir.',
      '(1) Form ' + L0.form + ' ✓   (2) f and g are differentiable ' + near + ' ✓   (3) g′(x) = ' + Ls[1].g + ' is non-zero in that region ✓. The rule may be used.');
    for (let k = 0; k < Ls.length - 1; k++) {
      const nx = Ls[k + 1], pr = prime(k + 1);
      H((k + 1) + '. kez L\'Hôpital', 'L\'Hôpital, application ' + (k + 1));
      T('Pay ve paydayı AYRI AYRI türet (bölüm kuralı DEĞİL): f' + pr + '(x) = ' + nx.f + ',  g' + pr + '(x) = ' + nx.g + '.',
        'Differentiate numerator and denominator SEPARATELY (NOT the quotient rule): f' + pr + '(x) = ' + nx.f + ',  g' + pr + '(x) = ' + nx.g + '.');
      const lead = 'lim (' + nx.f + ') / (' + nx.g + ')' + (nx.simp ? ' = lim ' + nx.simp : '');
      if (nx.form) {
        T('Yeni limit: ' + lead + '. ' + at + ' iken pay → ' + nx.fv + ', payda → ' + nx.gv + ' ⇒ ' + nx.form + '. Hâlâ belirsiz: kuralı TEKRAR uygula.',
          'New limit: ' + lead + '. As ' + at + ', numerator → ' + nx.fv + ' and denominator → ' + nx.gv + ' ⇒ ' + nx.form + '. Still indeterminate: apply the rule AGAIN.');
      } else if (nx.fvText) {
        T('Yeni limit: ' + lead + '. Sadeleşince değer ' + nx.val + ' olur (artık belirsizlik yok).', 'New limit: ' + lead + '. After simplifying, the value is ' + nx.val + ' (no more indeterminacy).');
      } else {
        T('Yeni limit: ' + lead + '. ' + at + ' iken pay → ' + nx.fv + ', payda → ' + nx.gv + ' ⇒ artık belirsiz değil; değer ' + (nx.val || (nx.fv + '/' + nx.gv)) + '.',
          'New limit: ' + lead + '. As ' + at + ', numerator → ' + nx.fv + ' and denominator → ' + nx.gv + ' ⇒ no longer indeterminate; the value is ' + (nx.val || (nx.fv + '/' + nx.gv)) + '.');
      }
    }
  }

  function numericCheck(sp, H, T) {
    H('Sayısal kontrol (yuvarlanmış)', 'Numerical check (rounded)');
    const parts = [];
    if (sp.inf) {
      [10, 100, 1000].forEach((x) => parts.push('x = ' + x + ': ' + nf(sp.f(x), 5)));
    } else if (sp.side === 'right') {
      [0.1, 0.01, 0.001].forEach((d) => parts.push('x = ' + nf(sp.a + d, 3) + ': ' + nf(sp.f(sp.a + d), 5)));
    } else {
      [0.1, 0.01, 0.001].forEach((d) => { parts.push('x = ' + nf(sp.a - d, 3) + ': ' + nf(sp.f(sp.a - d), 5)); parts.push('x = ' + nf(sp.a + d, 3) + ': ' + nf(sp.f(sp.a + d), 5)); });
    }
    T('İfadenin değerleri: ' + parts.join(';  ') + '. Değerler ' + nf(sp.ans, 5) + ' civarına yerleşiyor ✓.',
      'Values of the expression: ' + parts.join(';  ') + '. The values settle near ' + nf(sp.ans, 5) + ' ✓.');
  }

  function solveSteps(p) {
    const sp = spec(p), st = [];
    let n = 0;
    const H = (tr, en) => st.push(Hdr(++n, Tx(tr, en)));
    const T = (tr, en) => st.push(Tx(tr, en));
    if (sp.custom) {
      sp.custom(H, T);
      numericCheck(sp, H, T);
      return st;
    }
    if (sp.pre) sp.pre(H, T);
    chainSteps(sp, H, T);
    const lastL = sp.levels[sp.levels.length - 1];
    const val = lastL.val || sp.ansS;
    H('Sonuç', 'Result');
    if (sp.post) {
      T('Yardımcı limit: lim ' + (sp.pre ? 'ln y' : 'f/g') + ' = ' + val + '.', 'Auxiliary limit: lim ' + (sp.pre ? 'ln y' : 'f/g') + ' = ' + val + '.');
      sp.post(H, T);
      T('lim (' + atTxt(sp) + ') ' + sp.expr + ' = ' + sp.ansS + (p.kind === 'pow1' ? ' ≈ ' + nf(sp.ans, 4) : '') + '.', 'lim (' + atTxt(sp) + ') ' + sp.expr + ' = ' + sp.ansS + (p.kind === 'pow1' ? ' ≈ ' + nf(sp.ans, 4) : '') + '.');
    } else {
      T('lim (' + atTxt(sp) + ') ' + sp.expr + ' = ' + sp.ansS + '.', 'lim (' + atTxt(sp) + ') ' + sp.expr + ' = ' + sp.ansS + '.');
    }
    numericCheck(sp, H, T);
    if (sp.note) {
      H('Not', 'Remark');
      st.push(Tx(sp.note[0], sp.note[1]));
    }
    return st;
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      'SORUN\n' +
      'lim f(x)/g(x) limitinde pay ve payda aynı anda 0\'a ya da ∞\'a giderse sonuç BELİRSİZDİR: limit vardır ya da yoktur, ama doğrudan yerine koyarak bulunamaz (ör. sin x / x, x → 0). Pay ve payda "birbirinden bağımsız" sıfıra gider; oranın ne olacağı hangisinin DAHA HIZLI sıfıra gittiğine bağlıdır.\n' +
      '\n' +
      'L\'HÔPITAL KURALI\n' +
      'f ve g, a\'nın yakınında (a hariç) türevlenebilir, g\'(x) ≠ 0 ve lim f/g şu biçimlerden biri olsun: 0/0 veya ±∞/±∞. O zaman\n' +
      '   lim f(x)/g(x) = lim f\'(x)/g\'(x)\n' +
      '(sağ taraftaki limit var ya da ±∞ ise). a yerine a⁺, a⁻, ±∞ de olabilir. Geometrik fikir: a civarında f ve g birer doğruya benzer; oranları eğimlerin oranına, yani f\'(a)/g\'(a)\'ya eşittir.\n' +
      '\n' +
      'UYGULAMA KOŞULLARI (hepsi şart)\n' +
      '   1. Biçim gerçekten 0/0 veya ∞/∞ olmalı. Önce limiti yerine koyarak kontrol et!\n' +
      '   2. Pay ve payda AYRI AYRI türetilir (bölüm kuralı DEĞİL): (f/g)\' ≠ f\'/g\'.\n' +
      '   3. f\'/g\' limiti var olmalı (ya da ±∞); yoksa kural hiçbir şey söylemez.\n' +
      '\n' +
      'YÖNTEM\n' +
      '   1. Limiti yerine koy. 0/0 veya ∞/∞ çıktı mı?\n' +
      '   2. Evet ise f\' ve g\'yi ayrı ayrı bul, lim f\'/g\' hesapla.\n' +
      '   3. Hâlâ belirsizse kuralı TEKRAR uygula (birkaç kez gerekebilir).\n' +
      '   4. Diğer belirsizlikleri ÖNCE cebirle 0/0 ya da ∞/∞ biçimine getir:\n' +
      '      • 0·∞:  f·g = f/(1/g)   (ln içeren çarpanı paya koy)\n' +
      '      • ∞ − ∞:  ortak payda / eşlenik ile tek kesir yap\n' +
      '      • 1^∞, 0⁰, ∞⁰:  y = f^g al; ln y = g·ln f limitini bul (0·∞ → bölüm), sonunda y = e^(ln y)\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '   • x → ∞ limitlerinde de çalışır: lim x²/eˣ = 0 (üstel, her kuvvetten hızlı büyür).\n' +
      '   • Kuvvet < üstel ve ln < kuvvet büyüme sıralaması: ln x ≪ xⁿ ≪ eˣ (x → ∞).\n' +
      '   • Rasyonel ∞/∞: sonuç baş katsayıların oranıdır (n. derece eşitse).\n' +
      '\n' +
      'TUZAKLAR\n' +
      '   • Belirsiz OLMAYAN limitte uygulamak yanlış sonuç verir. Örnek: lim(x→0) (x+1)/(x+2) = 1/2, ama türevle 1 çıkar!\n' +
      '   • Bölüm kuralı kullanmak (f/g)\' almak yanlıştır: pay ve payda ayrı türetilir.\n' +
      '   • Türev döngüye girebilir (ör. x/√(x²+1), x → ∞); bu durumda başka yöntem (x\'e bölme) dene.\n' +
      '   • lim f\'/g\' yoksa orijinal limit hakkında sonuç ÇIKARMA; örneğin lim(x→∞) (x + sin x)/x = 1 ama (1 + cos x)/1\'in limiti yoktur.\n' +
      '\n' +
      'MİNİ ÖRNEKLER\n' +
      '   • lim(x→0) sin x / x: 0/0 → cos x / 1 → 1.\n' +
      '   • lim(x→∞) x² / eˣ: ∞/∞ → 2x/eˣ → ∞/∞ → 2/eˣ → 0.\n' +
      '   • lim(x→0⁺) x ln x: 0·(−∞) → ln x /(1/x) = ∞/∞ → (1/x)/(−1/x²) = −x → 0.\n' +
      '\n' +
      'HAFIZA İPUCU: "Önce yerine koy, belirsizse türet — pay ve payda ayrı ayrı!"\n' +
      '\n' +
      'KAYDIRICI: Yaklaşma kaydırıcısı ölçüm noktasını limite (ya da +∞\'a) doğru sürer; pay ve paydanın tek tek sıfıra gittiğini, oranın ise tek bir sayıya oturduğunu (altın yatay çizgi) ve f\'/g\' oranının (turuncu kesikli) aynı sayıya gittiğini izleyin.',
      'THE PROBLEM\n' +
      'In lim f(x)/g(x), if numerator and denominator both tend to 0 or both to ∞, the result is INDETERMINATE: the limit may or may not exist, but it cannot be found by direct substitution (e.g. sin x / x as x → 0). Numerator and denominator go to zero "independently"; the ratio depends on which one goes to zero FASTER.\n' +
      '\n' +
      'L\'HOPITAL\'S RULE\n' +
      'Let f and g be differentiable near a (except possibly at a), g\'(x) ≠ 0, and lim f/g be of the form 0/0 or ±∞/±∞. Then\n' +
      '   lim f(x)/g(x) = lim f\'(x)/g\'(x)\n' +
      '(provided the right-hand limit exists or is ±∞). Here a may also be a⁺, a⁻ or ±∞. Geometric idea: near a, f and g look like straight lines, so their ratio equals the ratio of slopes, f\'(a)/g\'(a).\n' +
      '\n' +
      'CONDITIONS (all required)\n' +
      '   1. The form must really be 0/0 or ∞/∞. Always check by substitution first!\n' +
      '   2. Numerator and denominator are differentiated SEPARATELY (NOT the quotient rule): (f/g)\' ≠ f\'/g\'.\n' +
      '   3. lim f\'/g\' must exist (or be ±∞); otherwise the rule says nothing.\n' +
      '\n' +
      'METHOD\n' +
      '   1. Substitute. Do you get 0/0 or ∞/∞?\n' +
      '   2. If yes, find f\' and g\' separately and compute lim f\'/g\'.\n' +
      '   3. If it is still indeterminate, apply the rule AGAIN (it may take several times).\n' +
      '   4. Convert other indeterminate forms to 0/0 or ∞/∞ FIRST with algebra:\n' +
      '      • 0·∞:  f·g = f/(1/g)   (put the ln factor in the numerator)\n' +
      '      • ∞ − ∞:  common denominator / conjugate to get one fraction\n' +
      '      • 1^∞, 0⁰, ∞⁰:  set y = f^g; find the limit of ln y = g·ln f (0·∞ → quotient), finally y = e^(ln y)\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '   • It works for x → ∞ as well: lim x²/eˣ = 0 (the exponential outgrows every power).\n' +
      '   • Growth ranking: ln x ≪ xⁿ ≪ eˣ (x → ∞).\n' +
      '   • Rational ∞/∞: the result is the ratio of leading coefficients (when the degrees are equal).\n' +
      '\n' +
      'PITFALLS\n' +
      '   • Using it on a non-indeterminate limit gives wrong answers. Example: lim(x→0) (x+1)/(x+2) = 1/2, but differentiating gives 1!\n' +
      '   • Using the quotient rule (f/g)\' is wrong: numerator and denominator are differentiated separately.\n' +
      '   • Derivatives can cycle (e.g. x/√(x²+1), x → ∞); then try another method (divide by x).\n' +
      '   • If lim f\'/g\' does not exist, conclude NOTHING about the original limit; e.g. lim(x→∞) (x + sin x)/x = 1, yet (1 + cos x)/1 has no limit.\n' +
      '\n' +
      'MINI EXAMPLES\n' +
      '   • lim(x→0) sin x / x: 0/0 → cos x / 1 → 1.\n' +
      '   • lim(x→∞) x² / eˣ: ∞/∞ → 2x/eˣ → ∞/∞ → 2/eˣ → 0.\n' +
      '   • lim(x→0⁺) x ln x: 0·(−∞) → ln x /(1/x) = ∞/∞ → (1/x)/(−1/x²) = −x → 0.\n' +
      '\n' +
      'MEMORY AID: "Substitute first; if indeterminate, differentiate — top and bottom separately!"\n' +
      '\n' +
      'SLIDER: The approach slider moves the probe point towards the limit point (or towards +∞); watch numerator and denominator head to zero one by one while the ratio settles on a single number (gold horizontal line) and the f\'/g\' ratio (orange dashed) tends to the same number.');
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    const sp = spec(p);
    let x0 = sp.view[0], x1 = sp.view[1];
    const f = (x) => { try { const v = sp.f(x); return isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
    const f2 = (x) => { try { const v = sp.f2(x); return isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
    const yr = autoY(f, x0, x1, [sp.ans]);
    canvas.setViewport(x0, x1, yr[0], yr[1]);
    if (!sp.inf) canvas.addGuideLine({ axis: 'vertical', position: sp.a, color: canvas.gray() });
    if (isFinite(sp.ans)) canvas.addGuideLine({ axis: 'horizontal', position: sp.ans, color: canvas.gold() });
    canvas.addFunction({ evaluator: f, color: canvas.accent(), thickness: 3 });
    if (p.showDeriv) canvas.addFunction({ evaluator: f2, color: canvas.orange(), thickness: 2, dashed: true });
    if (!sp.inf && isFinite(sp.ans)) canvas.addMarker({ x: sp.a, y: sp.ans, color: canvas.gold(), shape: 'circle', radius: 7, hollow: true });
    const pts = probes(sp, p.s);
    const cols = [canvas.red(), canvas.blue()];
    const lines = [];
    pts.forEach((x, i) => {
      const y = f(x);
      if (isFinite(y)) canvas.addMarker({ x, y, color: pts.length === 1 ? canvas.red() : cols[i], radius: 6 });
      let line = 'x = ' + nf(x, 5) + ':  ';
      if (sp.num && sp.den) line += Tx('pay = ', 'num = ') + nf(safe(sp.num(x)), 6) + ',  ' + Tx('payda = ', 'den = ') + nf(safe(sp.den(x)), 6) + ',  ';
      line += Tx('ifade = ', 'expression = ') + nf(y, 6) + ',  f′/g′ = ' + nf(f2(x), 6);
      lines.push(line);
    });
    if (readoutEl) {
      readoutEl.textContent = lines.join('\n') + '\n' + Tx('Limit = ', 'Limit = ') + sp.ansS + (isFinite(sp.ans) && sp.ansS.indexOf('/') >= 0 ? ' ≈ ' + nf(sp.ans, 5) : '');
    }
  }

  function buildControls(rightCol, getProblem, helpers) {
    helpers.addSelect({
      options: [{ label: Tx('Örnek türü: Rastgele', 'Example type: Random'), value: 'random' }].concat(KINDS.map((k) => ({ label: kindLabel(k), value: k }))),
      get: () => forcedKind,
      set: (v) => { forcedKind = String(v); helpers.regenerate(); },
    });
    helpers.addSlider({
      caption: Tx('Yaklaşma (sağa: limite / ∞\'a daha yakın)', 'Approach (right: closer to the limit point / ∞)'),
      min: 0, max: 4, step: 0.05,
      get: () => getProblem().s,
      set: (v) => { getProblem().s = Math.max(0, Math.min(4, v)); },
    });
    helpers.addCheckbox({
      caption: Tx('f′/g′ oranını (turuncu kesikli) göster', 'Show the f′/g′ ratio (orange dashed)'),
      get: () => getProblem().showDeriv,
      set: (v) => { getProblem().showDeriv = !!v; },
    });
    readoutEl = document.createElement('div');
    readoutEl.className = 'we-readout';
    readoutEl.style.cssText = 'white-space:pre-wrap;font-family:Consolas,monospace;font-size:12px;margin-top:8px;line-height:1.5';
    rightCol.appendChild(readoutEl);
  }

  Topics.register('applications', {
    id: 'lHopital',
    tabTitle: () => Tx('L\'Hôpital Kuralı', 'L\'Hopital\'s Rule'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*3\. (Hâlâ belirsizse|If it is still indeterminate)/, make: (rng) => createProblem(rng, 'polyexp') },
      { match: /^\s*• 0·∞:/, make: (rng) => createProblem(rng, 'xlnx') },
      { match: /^\s*• ∞ − ∞:/, make: (rng) => createProblem(rng, 'infinf1') },
      { match: /^\s*• 1\^∞, 0⁰, ∞⁰:/, make: (rng) => createProblem(rng, 'pow1') },
      { match: /^\s*• (x → ∞ limitlerinde|It works for x → ∞)/, make: (rng) => createProblem(rng, 'exp2') },
      { match: /^\s*• (Kuvvet < üstel|Growth ranking)/, make: (rng) => createProblem(rng, 'lnpoly') },
      { match: /^\s*• (Rasyonel ∞\/∞|Rational ∞\/∞)/, make: (rng) => createProblem(rng, 'ratinf') },
      { match: /^\s*• (Belirsiz OLMAYAN|Using it on a non-indeterminate)/, make: (rng) => createProblem(rng, 'misuse') },
      { match: /^\s*• (Türev döngüye|Derivatives can cycle)/, make: (rng) => createProblem(rng, 'cycle') },
      { match: /^\s*• (lim f'\/g' yoksa|If lim f'\/g' does not exist)/, make: (rng) => createProblem(rng, 'nolimit') },
      { match: /^\s*• lim\(x→0\) sin x \/ x:/, make: (rng) => createProblem(rng, 'sin') },
      { match: /^\s*• lim\(x→∞\) x² \/ eˣ:/, make: (rng) => createProblem(rng, 'polyexp') },
      { match: /^\s*• lim\(x→0⁺\) x ln x:/, make: (rng) => createProblem(rng, 'xlnx') },
    ],
    _kinds: KINDS,
    _spec: spec,
    _setKind: (k) => { forcedKind = k; },
  });
})();
