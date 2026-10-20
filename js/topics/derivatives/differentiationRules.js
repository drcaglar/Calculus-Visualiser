// Differentiation Rules (chapter 'derivatives'). Port of Modules/Derivatives/DifferentiationRulesControl.vb, enriched.
// problem = { rule:'const'|'power'|'multiple'|'sum'|'product'|'quotient', atoms:[atom,...], a, x, showD, showTan }
//   atom = { type:'pow'|'sin'|'cos'|'exp'|'ln'|'sqrt'|'dsqrt'|'poly', c, n, co }   (c * base(x); poly uses co = [c0,c1,...])
//   const/sum : f = sum of atoms      power/multiple : f = atoms[0]      product : u*v      quotient : u/v
// The VB module overlays the NUMERIC derivative (solid purple) with the derivative predicted by the RULE (dashed gold);
// here both are drawn on the same axes together with f, the tangent at the slider point x and the point (x, f'(x)).
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  // ---------- exact helpers ----------
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
  const frAdd = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
  const frSub = (x, y) => fr(x.n * y.d - y.n * x.d, x.d * y.d);
  const frMul = (x, y) => fr(x.n * y.n, x.d * y.d);
  const frNeg = (x) => fr(-x.n, x.d);
  const frDiv = (x, y) => (y.n === 0 ? null : fr(x.n * y.d, x.d * y.n));
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (n) => (n < 0 ? '(' + S(n) + ')' : S(n));
  function frS(x) { return x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d; }
  const frP = (x) => (x.n < 0 || x.d !== 1 ? '(' + frS(x) + ')' : frS(x));
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dec === undefined ? 2 : dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return M(s);
  }
  function lineS(m, c) {
    let body = '';
    if (m.n !== 0) {
      if (m.d === 1 && m.n === 1) body = 'x';
      else if (m.d === 1 && m.n === -1) body = '−x';
      else if (m.d === 1) body = S(m.n) + 'x';
      else body = '(' + frS(m) + ')x';
    }
    if (body === '') return 'y = ' + frS(c);
    if (c.n === 0) return 'y = ' + body;
    return 'y = ' + body + (c.n < 0 ? ' − ' : ' + ') + frS(fr(Math.abs(c.n), c.d));
  }

  // ---------- polynomials ----------
  const SUPS = ['', '', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const supN = (n) => (n === 1 ? '' : (n >= 2 && n <= 9 ? SUPS[n] : '^' + n));
  const evalP = (co, x) => co.reduceRight((acc, c) => acc * x + c, 0);
  const derivP = (co) => (co.length <= 1 ? [0] : co.slice(1).map((c, i) => c * (i + 1)));
  function mulP(a, b) { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; }
  function subP(a, b) { const n = Math.max(a.length, b.length); const r = []; for (let i = 0; i < n; i++) r.push((a[i] || 0) - (b[i] || 0)); return r; }
  function addP(a, b) { const n = Math.max(a.length, b.length); const r = []; for (let i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0)); return r; }
  function polyStr(co) {
    let s = '';
    for (let i = co.length - 1; i >= 0; i--) {
      const c = co[i];
      if (c === 0) continue;
      const ab = Math.abs(c);
      const lab = i === 0 ? '' : 'x' + supN(i);
      const body = lab === '' ? String(ab) : (ab === 1 ? lab : ab + lab);
      if (s === '') s = (c < 0 ? '−' : '') + body; else s += (c < 0 ? ' − ' : ' + ') + body;
    }
    return s || '0';
  }

  // ---------- atoms ----------
  const A = {
    pow: (c, n) => ({ type: 'pow', c, n }),
    sin: (c) => ({ type: 'sin', c }),
    cos: (c) => ({ type: 'cos', c }),
    exp: (c) => ({ type: 'exp', c }),
    ln: (c) => ({ type: 'ln', c }),
    sqrt: (c) => ({ type: 'sqrt', c }),
    poly: (co) => ({ type: 'poly', co }),
  };
  const isConstAtom = (t) => (t.type === 'poly' && t.co.length === 1) || (t.type === 'pow' && t.n === 0);
  const coefS = (c) => (c === 1 ? '' : c === -1 ? '−' : S(c));
  function termStr(t) {
    switch (t.type) {
      case 'pow':
        if (t.n === 0) return S(t.c);
        if (t.n > 0) return coefS(t.c) + 'x' + supN(t.n);
        return S(t.c) + '/x' + supN(-t.n);
      case 'sin': return coefS(t.c) + 'sin x';
      case 'cos': return coefS(t.c) + 'cos x';
      case 'exp': return coefS(t.c) + 'e^x';
      case 'ln': return coefS(t.c) + 'ln x';
      case 'sqrt': return coefS(t.c) + '√x';
      case 'dsqrt': { const g = gcd(t.c, 2), nu = t.c / g, de = 2 / g; return S(nu) + '/' + (de === 1 ? '' : '2') + '√x'; }
      default: return polyStr(t.co);
    }
  }
  const needsWrap = (s) => /[+−/]/.test(s);
  const wrapAt = (t) => { const s = termStr(t); return needsWrap(s) ? '(' + s + ')' : s; };
  function dAtom(t) {
    switch (t.type) {
      case 'pow': return t.n === 0 ? A.pow(0, 0) : A.pow(t.c * t.n, t.n - 1);
      case 'sin': return A.cos(t.c);
      case 'cos': return A.sin(-t.c);
      case 'exp': return A.exp(t.c);
      case 'ln': return A.pow(t.c, -1);
      case 'sqrt': return { type: 'dsqrt', c: t.c };
      case 'dsqrt': return { type: 'dsqrt', c: 0 };
      default: return A.poly(derivP(t.co));
    }
  }
  const isZeroAtom = (t) => (t.type === 'poly' ? t.co.every((c) => c === 0) : t.c === 0);
  function aval(t, x) {
    let y;
    switch (t.type) {
      case 'pow': y = t.n === 0 ? t.c : (x === 0 && t.n < 0 ? NaN : t.c * Math.pow(x, t.n)); break;
      case 'sin': y = t.c * Math.sin(x); break;
      case 'cos': y = t.c * Math.cos(x); break;
      case 'exp': y = t.c * Math.exp(x); break;
      case 'ln': y = x > 0 ? t.c * Math.log(x) : NaN; break;
      case 'sqrt': y = x >= 0 ? t.c * Math.sqrt(x) : NaN; break;
      case 'dsqrt': y = x > 0 ? t.c / (2 * Math.sqrt(x)) : NaN; break;
      default: y = evalP(t.co, x);
    }
    return isFinite(y) ? y : NaN;
  }
  function aex(t, a) { // exact value at the integer a, or null
    switch (t.type) {
      case 'pow':
        if (t.n === 0) return fr(t.c);
        if (t.n > 0) return fr(t.c * Math.pow(a, t.n));
        if (a === 0) return null;
        return fr(t.c, Math.pow(a, -t.n));
      case 'sin': return a === 0 ? fr(0) : null;
      case 'cos': return a === 0 ? fr(t.c) : null;
      case 'exp': return a === 0 ? fr(t.c) : null;
      case 'ln': return a === 1 ? fr(0) : null;
      case 'sqrt': { if (a < 0) return null; const r = Math.round(Math.sqrt(a)); return r * r === a ? fr(t.c * r) : null; }
      case 'dsqrt': { if (a <= 0) return null; const r = Math.round(Math.sqrt(a)); return r * r === a ? fr(t.c, 2 * r) : null; }
      default: return fr(evalP(t.co, a));
    }
  }
  const polyOf = (t) => {
    if (t.type === 'poly') return t.co;
    if (t.type === 'pow' && t.n >= 0) { const r = new Array(t.n + 1).fill(0); r[t.n] = t.c; return r; }
    return null;
  };
  function reason(t) { // which elementary derivative is used
    switch (t.type) {
      case 'pow': return t.n === 0 ? Tx('sabit kuralı: (c)′ = 0', 'constant rule: (c)′ = 0') : Tx('kuvvet kuralı: (xⁿ)′ = n·xⁿ⁻¹' + (t.c !== 1 ? ' ve sabit çarpan' : ''), 'power rule: (xⁿ)′ = n·xⁿ⁻¹' + (t.c !== 1 ? ' and the constant multiple' : ''));
      case 'sin': return '(sin x)′ = cos x';
      case 'cos': return '(cos x)′ = −sin x';
      case 'exp': return '(e^x)′ = e^x';
      case 'ln': return '(ln x)′ = 1/x';
      case 'sqrt': return '(√x)′ = 1/(2√x)';
      default: return t.co.length === 1 ? Tx('sabit kuralı: (c)′ = 0', 'constant rule: (c)′ = 0') : Tx('terim terim kuvvet kuralı', 'power rule term by term');
    }
  }

  // ---------- composite model ----------
  const RULES = ['const', 'power', 'multiple', 'sum', 'product', 'quotient'];
  function ruleName(r) {
    return { const: Tx('Sabit Kuralı', 'Constant Rule'), power: Tx('Kuvvet Kuralı', 'Power Rule'), multiple: Tx('Sabitle Çarpım Kuralı', 'Constant Multiple Rule'),
      sum: Tx('Toplam / Fark Kuralı', 'Sum / Difference Rule'), product: Tx('Çarpım Kuralı', 'Product Rule'), quotient: Tx('Bölüm Kuralı', 'Quotient Rule') }[r];
  }
  function ruleFormula(r) {
    return { const: '(c)′ = 0', power: '(xⁿ)′ = n·xⁿ⁻¹', multiple: '(c·f)′ = c·f′', sum: '(f ± g)′ = f′ ± g′',
      product: '(u·v)′ = u′·v + u·v′', quotient: '(u/v)′ = (u′·v − u·v′) / v²' }[r];
  }
  function sumStr(atoms) {
    let s = '';
    atoms.forEach((t) => {
      const ts = termStr(t);
      if (s === '') s = ts; else s += ts[0] === '−' ? ' − ' + ts.slice(1) : ' + ' + ts;
    });
    return s || '0';
  }
  function fStr(p) {
    switch (p.rule) {
      case 'product': return wrapAt(p.atoms[0]) + '·' + wrapAt(p.atoms[1]);
      case 'quotient': { const u = termStr(p.atoms[0]), v = termStr(p.atoms[1]); return (needsWrap(u) ? '(' + u + ')' : u) + ' / ' + (needsWrap(v) || / /.test(v) ? '(' + v + ')' : v); }
      case 'sum': case 'const': return sumStr(p.atoms);
      default: return termStr(p.atoms[0]);
    }
  }
  function F(p, x) {
    const t = p.atoms;
    let y;
    switch (p.rule) {
      case 'product': y = aval(t[0], x) * aval(t[1], x); break;
      case 'quotient': { const v = aval(t[1], x); y = Math.abs(v) < 1e-12 ? NaN : aval(t[0], x) / v; break; }
      case 'sum': case 'const': y = t.reduce((s, q) => s + aval(q, x), 0); break;
      default: y = aval(t[0], x);
    }
    return (isFinite(y) && Math.abs(y) < 1e4) ? y : NaN;
  }
  function D(p, x) { // derivative predicted by the rule
    const t = p.atoms;
    let y;
    switch (p.rule) {
      case 'product': y = aval(dAtom(t[0]), x) * aval(t[1], x) + aval(t[0], x) * aval(dAtom(t[1]), x); break;
      case 'quotient': {
        const v = aval(t[1], x);
        y = Math.abs(v) < 1e-12 ? NaN : (aval(dAtom(t[0]), x) * v - aval(t[0], x) * aval(dAtom(t[1]), x)) / (v * v); break;
      }
      case 'sum': case 'const': y = t.reduce((s, q) => s + aval(dAtom(q), x), 0); break;
      default: y = aval(dAtom(t[0]), x);
    }
    return (isFinite(y) && Math.abs(y) < 1e4) ? y : NaN;
  }
  function Dnum(p, x) { // numeric derivative (central difference)
    const h = 1e-5 * Math.max(1, Math.abs(x));
    const y = (F(p, x + h) - F(p, x - h)) / (2 * h);
    return isFinite(y) ? y : NaN;
  }
  function Fex(p, a) {
    const t = p.atoms;
    switch (p.rule) {
      case 'product': { const u = aex(t[0], a), v = aex(t[1], a); return u && v ? frMul(u, v) : null; }
      case 'quotient': { const u = aex(t[0], a), v = aex(t[1], a); return u && v ? frDiv(u, v) : null; }
      case 'sum': case 'const': { let s = fr(0); for (const q of t) { const e = aex(q, a); if (!e) return null; s = frAdd(s, e); } return s; }
      default: return aex(t[0], a);
    }
  }
  function Dex(p, a) {
    const t = p.atoms;
    switch (p.rule) {
      case 'product': {
        const u = aex(t[0], a), v = aex(t[1], a), du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
        return u && v && du && dv ? frAdd(frMul(du, v), frMul(u, dv)) : null;
      }
      case 'quotient': {
        const u = aex(t[0], a), v = aex(t[1], a), du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
        if (!(u && v && du && dv) || v.n === 0) return null;
        return frDiv(frSub(frMul(du, v), frMul(u, dv)), frMul(v, v));
      }
      case 'sum': case 'const': { let s = fr(0); for (const q of t) { const e = aex(dAtom(q), a); if (!e) return null; s = frAdd(s, e); } return s; }
      default: return aex(dAtom(t[0]), a);
    }
  }
  function derivStr(p) { // final f'(x)
    const t = p.atoms;
    switch (p.rule) {
      case 'product': {
        const pu = polyOf(t[0]), pv = polyOf(t[1]);
        if (pu && pv) return polyStr(addP(mulP(derivP(pu), pv), mulP(pu, derivP(pv))));
        return unsimplified(p);
      }
      case 'quotient': {
        const pu = polyOf(t[0]), pv = polyOf(t[1]);
        if (pu && pv) return `(${polyStr(subP(mulP(derivP(pu), pv), mulP(pu, derivP(pv))))}) / (${polyStr(pv)})²`;
        return unsimplified(p);
      }
      case 'sum': case 'const': return sumStr(t.map(dAtom).filter((q) => !isZeroAtom(q)));
      default: { const d = dAtom(t[0]); return isZeroAtom(d) ? '0' : termStr(d); }
    }
  }
  function unsimplified(p) { // rule formula with the pieces written in
    const u = p.atoms[0], v = p.atoms[1], du = dAtom(u), dv = dAtom(v);
    const w = (q) => wrapAt(q);
    if (p.rule === 'product') return `${w(du)}·${w(v)} + ${w(u)}·${w(dv)}`;
    return `(${w(du)}·${w(v)} − ${w(u)}·${w(dv)}) / (${termStr(v)})²`;
  }

  // ---------- generation ----------
  const CANDS = [0, 1, -1, 2, -2, 3, -3, 4, 9];
  function pickA(rng, p) {
    const ok = CANDS.filter((a) => {
      const fa = Fex(p, a), m = Dex(p, a);
      return fa && m && Math.abs(frVal(fa)) <= 200 && Math.abs(frVal(m)) <= 200 && Math.abs(fa.d) <= 50 && Math.abs(m.d) <= 50;
    });
    const small = ok.filter((a) => Math.abs(a) <= 3);
    return ok.length ? rng.pick(small.length && rng.nextInt(0, 6) > 0 ? small : ok) : null;
  }
  function pickCoef(rng) { return rng.pick([-3, -2, -1, 1, 2, 3, 4]); }
  function genSum(rng) {
    const poolPow = [1, 2, 3, 4, 5, -1, -2];
    const kinds = ['pow', 'pow', 'sin', 'cos', 'exp', 'ln', 'sqrt', 'const'];
    const cnt = rng.nextInt(2, 4);
    const atoms = [];
    const used = {};
    let guard = 0;
    while (atoms.length < cnt && guard++ < 40) {
      const k = rng.pick(kinds);
      let t;
      if (k === 'pow') { const n = rng.pick(poolPow); const key = 'pow' + n; if (used[key]) continue; used[key] = 1; t = A.pow(pickCoef(rng), n); }
      else if (k === 'const') { if (used.c) continue; used.c = 1; t = A.poly([rng.nonZeroInt(-7, 7)]); }
      else { if (used[k]) continue; used[k] = 1; t = A[k](pickCoef(rng)); }
      atoms.push(t);
    }
    // avoid a leading constant, shuffle lightly
    atoms.sort((x, y) => (isConstAtom(x) ? 1 : 0) - (isConstAtom(y) ? 1 : 0));
    return atoms;
  }
  function genRule(rng, rule) {
    for (let tries = 0; tries < 60; tries++) {
      let atoms;
      switch (rule) {
        case 'const': { const t = A.pow(pickCoef(rng), rng.nextInt(2, 5)); const k = A.poly([rng.nonZeroInt(-9, 9)]); atoms = rng.nextInt(0, 2) ? [t, k] : [k, t]; break; }
        case 'power': atoms = [rng.nextInt(0, 6) === 0 ? A.sqrt(1) : A.pow(1, rng.pick([2, 3, 4, 5, -1, -2, -3]))]; break;
        case 'multiple': {
          const c = rng.pick([-4, -3, -2, 2, 3, 4, 5]);
          const g = rng.pick(['pow', 'pow', 'sin', 'cos', 'exp', 'ln', 'sqrt', 'inv']);
          atoms = [g === 'pow' ? A.pow(c, rng.nextInt(2, 5)) : g === 'inv' ? A.pow(c, -1) : A[g](c)];
          break;
        }
        case 'sum': atoms = genSum(rng); break;
        case 'product': {
          const r = rng.nextInt(0, 6);
          if (r === 0) atoms = [A.poly([rng.nonZeroInt(-4, 4), rng.pick([1, 2, 3])]), A.poly([rng.nonZeroInt(-4, 4), rng.pick([1, 2])])];
          else if (r === 1) atoms = [A.poly([rng.nonZeroInt(-3, 3), 0, 1]), A.poly([rng.nonZeroInt(-3, 3), 1])];
          else if (r === 2) atoms = [A.pow(1, rng.nextInt(1, 4)), A[rng.pick(['sin', 'cos', 'exp'])](1)];
          else if (r === 3) atoms = [A.pow(1, rng.nextInt(1, 4)), A.ln(1)];
          else if (r === 4) atoms = [A.exp(1), A[rng.pick(['sin', 'cos'])](1)];
          else atoms = [A.sqrt(1), A.poly([rng.nonZeroInt(-3, 3), 1])];
          break;
        }
        default: { // quotient
          const r = rng.nextInt(0, 8);
          const lin = () => A.poly([rng.nonZeroInt(-4, 4), rng.pick([1, 1, 2])]);
          if (r === 0 || r === 1) atoms = [lin(), A.poly([rng.nonZeroInt(-4, 4), rng.pick([1, 2])])];
          else if (r === 2) atoms = [A.pow(1, 2), A.poly([rng.nonZeroInt(-3, 3), 1])];
          else if (r === 3) atoms = [A.poly([rng.nonZeroInt(1, 4), 0, 1]), A.pow(1, 1)];
          else if (r === 4) atoms = [A.poly([1]), A.poly([rng.nextInt(1, 5), 0, 1])];
          else if (r === 5) atoms = [A[rng.pick(['sin', 'cos', 'exp'])](1), A.poly([rng.nextInt(1, 5), 1])];
          else if (r === 6) atoms = [A.pow(1, rng.nextInt(1, 3)), A.exp(1)];
          else atoms = [A.ln(1), A.pow(1, rng.pick([1, 2]))];
        }
      }
      const p = { rule, atoms, a: 0, x: 0, showD: true, showTan: true };
      const a = pickA(rng, p);
      if (a === null) continue;
      p.a = a; p.x = Math.max(-4, Math.min(4, a));
      return p;
    }
    return { rule: 'sum', atoms: [A.pow(1, 2), A.pow(3, 1)], a: 1, x: 1, showD: true, showTan: true };
  }

  const RNG = new Rng();
  function createProblem(rng) {
    return genRule(rng, rng.pick(['const', 'power', 'multiple', 'sum', 'sum', 'product', 'product', 'quotient', 'quotient']));
  }

  // ---------- statement (formulas inside $...$ are typeset by the framework) ----------
  function problemStatement(p) {
    const A_ = tn(p.a);
    const extra = p.rule === 'product' || p.rule === 'quotient'
      ? Tx(' Önce $u$ ve $v$ çarpanlarını açıkça yazabiliriz.', ' We can first state the parts $u$ and $v$ explicitly.') : '';
    return Tx(`$f(x)=${fTex(p)}$ fonksiyonunun türevini uygun kuralı seçerek bulalım (hangi kuralı kullandığımızı da söyleyelim).${extra} Sonra $f'(${A_})$ değerini ve $x=${A_}$ noktasındaki teğet doğrusunun denklemini yazalım.`,
      `Let's find the derivative of $f(x)=${fTex(p)}$ by choosing the appropriate rule (and naming it).${extra} Then we can evaluate $f'(${A_})$ and write the equation of the tangent line at $x=${A_}$.`);
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
      [
        'TÜREV ALMA KURALLARI',
        "Türev alma kuralları, limit tanımına dönmeden türevi hızlıca hesaplamamızı sağlar. Grafik üzerinde, kuralın verdiği $f'(x)$ eğrisi (kesikli altın) ile sayısal türev eğrisinin (düz mor) her $x$'te örtüştüğünü görerek kuralı doğrulayabiliriz.",
        '',
        'KURAL TABLOSU',
        "   • Sabit:  $(c)'=0$",
        "   • Kuvvet:  $(x^{n})'=n\\,x^{n-1}$   ($n$ tam, negatif ya da kesirli olabilir)",
        "   • Sabit çarpan:  $(c\\cdot f)'=c\\cdot f'$",
        "   • Toplam/fark:  $(f\\pm g)'=f'\\pm g'$",
        "   • Çarpım:  $(u\\cdot v)'=u'\\cdot v+u\\cdot v'$",
        "   • Bölüm:  $\\left(\\dfrac{u}{v}\\right)'=\\dfrac{u'\\cdot v-u\\cdot v'}{v^{2}}$",
        "   • Zincir:  $\\big(f(g(x))\\big)'=f'(g(x))\\cdot g'(x)$",
        "   • Üstel:  $(e^{x})'=e^{x}$,  $(a^{x})'=a^{x}\\ln a$",
        "   • Logaritma:  $(\\ln x)'=\\dfrac{1}{x}$",
        "   • Trigonometri:  $(\\sin x)'=\\cos x$,  $(\\cos x)'=-\\sin x$",
        '',
        'KURAL SEÇİCİ (YÖNTEM)',
        '   1. Önce fonksiyonun yapısına bakalım: EN DIŞTAKİ işlem toplam/fark mı, çarpım mı, bölüm mü, bileşke mi?',
        '   2. Kuralı seçeriz: toplam/fark → terim terim; $u\\cdot v$ → çarpım kuralı; $\\frac{u}{v}$ → bölüm kuralı; $c\\cdot g$ → $c$ dışarıda kalır; $x^{n}$ → kuvvet kuralı; sabit → 0.',
        '   3. İç parçaların ($u$, $v$ ya da her terimin) türevini alırız; gerekirse aynı süreci tekrarlarız.',
        '   4. Kuralın formülüne yerleştirip sadeleştiririz (çarpım ve bölümde parantezleri açarken işaretlere özen göstermek yardımcı olur).',
        "   5. $f'(a)$ değerini bulalım; teğet doğrusu: $y-f(a)=f'(a)(x-a)$.",
        "   6. Grafikte $f'$ (kuralın eğrisi) ile sayısal türevi ve teğet eğimini kıyaslayarak doğrulayabiliriz.",
        '',
        'DİKKAT EDİLECEKLER',
        "   • $(u\\cdot v)'\\neq u'\\cdot v'$. Çarpım kuralı iki terimlidir.",
        '   • Bölüm kuralında sıra önemlidir: pay türevi·payda MİNÜS pay·payda türevi (ters yazılırsa işaret değişir).',
        '   • Kuvvet kuralı $x^{n}$ içindir; $2^{x}$ için değil (üstel kuralı).',
        "   • Sabit terim türevde kaybolur: $(x^{2}+5)'=2x$; ama sabit ÇARPAN kalır: $(5x^{2})'=10x$.",
        "   • $n$ kesirli veya negatif olabilir: $\\left(\\dfrac{1}{x}\\right)'=-x^{-2}$, $(\\sqrt{x})'=\\dfrac{1}{2\\sqrt{x}}$.",
        "   • Bölümde $f'\\neq \\dfrac{u'}{v'}$.",
        '',
        'BELLEK İPUCU',
        'Bölüm: "AŞAĞI·d(YUKARI) − YUKARI·d(AŞAĞI), hepsi AŞAĞI²".  Çarpım: "ilk·türevi(ikinci) + ikinci·türevi(ilk)".',
        '',
        'MİNİ ÖRNEK',
        "$f(x)=x^{2}e^{x}$ için $f'(x)=2x\\,e^{x}+x^{2}e^{x}=e^{x}\\,x(x+2)$.",
        "$g(x)=\\dfrac{x}{x+1}$ için $g'(x)=\\dfrac{1\\cdot(x+1)-x\\cdot 1}{(x+1)^{2}}=\\dfrac{1}{(x+1)^{2}}$.",
        '',
        'KAYDIRICI',
        "Kaydırıcı ile teğetin değdiği noktayı gezdirebiliriz; turuncu teğetin eğimi, mor/altın $f'$ eğrisinin o $x$'teki yüksekliğine eşittir.",
      ].join('\n'),
      [
        'DIFFERENTIATION RULES',
        "Differentiation rules let us compute derivatives quickly without going back to the limit definition. On the graph we can verify a rule by checking that the curve $f'(x)$ given by the rule (dashed gold) coincides with the numerical derivative (solid purple) at every $x$.",
        '',
        'RULES TABLE',
        "   • Constant:  $(c)'=0$",
        "   • Power:  $(x^{n})'=n\\,x^{n-1}$   ($n$ may be an integer, negative or fractional)",
        "   • Constant multiple:  $(c\\cdot f)'=c\\cdot f'$",
        "   • Sum/difference:  $(f\\pm g)'=f'\\pm g'$",
        "   • Product:  $(u\\cdot v)'=u'\\cdot v+u\\cdot v'$",
        "   • Quotient:  $\\left(\\dfrac{u}{v}\\right)'=\\dfrac{u'\\cdot v-u\\cdot v'}{v^{2}}$",
        "   • Chain:  $\\big(f(g(x))\\big)'=f'(g(x))\\cdot g'(x)$",
        "   • Exponential:  $(e^{x})'=e^{x}$,  $(a^{x})'=a^{x}\\ln a$",
        "   • Logarithm:  $(\\ln x)'=\\dfrac{1}{x}$",
        "   • Trigonometry:  $(\\sin x)'=\\cos x$,  $(\\cos x)'=-\\sin x$",
        '',
        'RULE CHOOSER (METHOD)',
        '   1. First we look at the structure: is the OUTERMOST operation a sum/difference, product, quotient or composition?',
        '   2. We pick the rule: sum/difference → term by term; $u\\cdot v$ → product rule; $\\frac{u}{v}$ → quotient rule; $c\\cdot g$ → $c$ stays outside; $x^{n}$ → power rule; constant → 0.',
        '   3. We differentiate the inner parts ($u$, $v$ or each term) and repeat the process if needed.',
        "   4. We substitute into the rule's formula and simplify (it helps to watch the signs in products and quotients).",
        "   5. We evaluate $f'(a)$; tangent: $y-f(a)=f'(a)(x-a)$.",
        "   6. We can verify on the graph: the rule's $f'$ curve, the numerical derivative and the tangent slope should agree.",
        '',
        'PITFALLS',
        "   • $(u\\cdot v)'\\neq u'\\cdot v'$. The product rule has two terms.",
        '   • Order matters in the quotient rule: derivative of top·bottom MINUS top·derivative of bottom (swapping them flips the sign).',
        '   • The power rule is for $x^{n}$, not for $2^{x}$ (use the exponential rule).',
        "   • A constant TERM vanishes: $(x^{2}+5)'=2x$; a constant FACTOR stays: $(5x^{2})'=10x$.",
        "   • $n$ may be fractional or negative: $\\left(\\dfrac{1}{x}\\right)'=-x^{-2}$, $(\\sqrt{x})'=\\dfrac{1}{2\\sqrt{x}}$.",
        "   • For a quotient, $f'\\neq \\dfrac{u'}{v'}$.",
        '',
        'MEMORY AID',
        'Quotient: "LO·d(HI) − HI·d(LO), over LO squared".  Product: "first·d(second) + second·d(first)".',
        '',
        'MINI EXAMPLE',
        "For $f(x)=x^{2}e^{x}$: $f'(x)=2x\\,e^{x}+x^{2}e^{x}=e^{x}\\,x(x+2)$.",
        "For $g(x)=\\dfrac{x}{x+1}$: $g'(x)=\\dfrac{1\\cdot(x+1)-x\\cdot 1}{(x+1)^{2}}=\\dfrac{1}{(x+1)^{2}}$.",
        '',
        'SLIDER',
        "The slider moves the point of tangency, and the slope of the orange tangent equals the height of the purple/gold $f'$ curve at that $x$.",
      ].join('\n'));
  }

  function xA(a) { return a === 0 ? 'x' : (a > 0 ? '(x − ' + a + ')' : '(x + ' + (-a) + ')'); }
  function ptSlope(fa, m, a) {
    const left = fa.n === 0 ? 'y' : (fa.n < 0 ? 'y + ' + frS(fr(-fa.n, fa.d)) : 'y − ' + frS(fa));
    if (m.n === 0) return left + ' = 0';
    const coef = m.d === 1 ? (Math.abs(m.n) === 1 ? (m.n < 0 ? '−' : '') : S(m.n)) : '(' + frS(m) + ')';
    return left + ' = ' + coef + xA(a);
  }

  // ---------- steps ----------
  function stepRule(p) {
    const f = fStr(p), r = p.rule;
    const nm = ruleName(r), fm = ruleFormula(r);
    const why = {
      const: Tx('f, kuvvet kuralıyla türetilen bir terim ile bir SABİT terimin toplamıdır; toplam kuralı + sabit kuralı kullanılabilir.', 'f is a power term plus a CONSTANT term; we can use the sum rule + the constant rule.'),
      power: Tx('f bir kuvvet fonksiyonudur xⁿ.', 'f is a power function xⁿ.'),
      multiple: Tx('f = c·g biçimindedir: sabit bir çarpan ile bir fonksiyonun çarpımı.', 'f has the form c·g: a constant factor times a function.'),
      sum: Tx('EN DIŞTAKİ işlem toplama/çıkarma: f terimlerin toplamıdır.', 'The OUTERMOST operation is addition/subtraction: f is a sum of terms.'),
      product: Tx('EN DIŞTAKİ işlem çarpma: iki fonksiyonun çarpımı u·v.', 'The OUTERMOST operation is multiplication: a product u·v of two functions.'),
      quotient: Tx('EN DIŞTAKİ işlem bölme: iki fonksiyonun oranı u/v.', 'The OUTERMOST operation is division: a quotient u/v of two functions.'),
    }[r];
    return Tx(`── 1) Kural seçimi ──\nf(x) = ${f}\n${why}\n⇒ ${nm}:  ${fm}`, `── 1) Choosing the rule ──\nf(x) = ${f}\n${why}\n⇒ ${nm}:  ${fm}`);
  }
  const xp = (k) => (k === 0 ? '1' : k === 1 ? 'x' : k > 0 ? 'x' + supN(k) : 'x^(' + S(k) + ')');
  function stepParts(p) {
    const t = p.atoms;
    const lines = [];
    if (p.rule === 'product' || p.rule === 'quotient') {
      const nm = ['u', 'v'];
      t.forEach((q, i) => lines.push(`${nm[i]}(x) = ${termStr(q)}   ⇒   ${nm[i]}′(x) = ${isZeroAtom(dAtom(q)) ? '0' : termStr(dAtom(q))}   [${reason(q)}]`));
    } else if (p.rule === 'sum' || p.rule === 'const') {
      t.forEach((q) => lines.push(`(${termStr(q)})′ = ${isZeroAtom(dAtom(q)) ? '0' : termStr(dAtom(q))}   [${reason(q)}]`));
    } else {
      const q = t[0];
      if (p.rule === 'multiple') {
        const base = A[q.type] ? Object.assign({}, q, { c: 1 }) : q;
        lines.push(`f = ${S(q.c)}·g  with  g(x) = ${termStr(base)}   ⇒   g′(x) = ${termStr(dAtom(base))}   [${reason(base)}]`);
      } else lines.push(`f(x) = ${termStr(q)}   ⇒   n = ${q.type === 'sqrt' ? '1/2' : S(q.n)}:  ${q.type === 'sqrt' ? '(√x)′ = 1/(2√x)' : `(${xp(q.n)})′ = ${S(q.n)}·${xp(q.n - 1)}`}`);
    }
    return Tx(`── 2) Parçaların türevleri ──\n${lines.join('\n')}`, `── 2) Derivatives of the parts ──\n${lines.join('\n')}`);
  }
  function stepAssemble(p) {
    const t = p.atoms;
    let body;
    if (p.rule === 'product') body = `f′ = u′·v + u·v′ = ${unsimplified(p)}`;
    else if (p.rule === 'quotient') body = `f′ = (u′·v − u·v′) / v² = ${unsimplified(p)}`;
    else if (p.rule === 'sum' || p.rule === 'const') body = `f′ = ${t.map((q) => '(' + termStr(q) + ')′').join(' + ')} = ${derivStr(p)}`;
    else body = `f′(x) = ${derivStr(p)}`;
    const simp = derivStr(p);
    let extra = '';
    if ((p.rule === 'product' || p.rule === 'quotient') && polyOf(t[0]) && polyOf(t[1])) {
      extra = Tx(`\nParantezleri açıp sadeleştirince:  f′(x) = ${simp}`, `\nExpanding and simplifying:  f′(x) = ${simp}`);
    }
    if (p.rule === 'const') extra = Tx('\nSabit terimin türevi 0 olduğundan türevde görünmez.', '\nThe constant term has derivative 0, so it disappears from f′.');
    return Tx(`── 3) Kuralı uygulayalım ──\n${body}${extra}`, `── 3) Applying the rule ──\n${body}${extra}`);
  }
  function stepEval(p) {
    const a = p.a, aS = S(a), t = p.atoms;
    const fa = Fex(p, a), m = Dex(p, a);
    let detail = '';
    if (p.rule === 'product' || p.rule === 'quotient') {
      const u = aex(t[0], a), v = aex(t[1], a), du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
      const vals = `u(${aS}) = ${frS(u)},  v(${aS}) = ${frS(v)},  u′(${aS}) = ${frS(du)},  v′(${aS}) = ${frS(dv)}`;
      const calc = p.rule === 'product'
        ? `f′(${aS}) = u′v + uv′ = ${frP(du)}·${frP(v)} + ${frP(u)}·${frP(dv)} = ${frS(m)}`
        : `f′(${aS}) = (u′v − uv′)/v² = (${frP(du)}·${frP(v)} − ${frP(u)}·${frP(dv)}) / ${frP(v)}² = ${frS(m)}`;
      detail = vals + '\n' + calc;
    } else {
      detail = `f′(x) = ${derivStr(p)}  ⇒  f′(${aS}) = ${frS(m)}`;
    }
    return Tx(`── 4) Değer: f(${aS}) ve f′(${aS}) ──\nf(${aS}) = ${frS(fa)}\n${detail}`, `── 4) Values: f(${aS}) and f′(${aS}) ──\nf(${aS}) = ${frS(fa)}\n${detail}`);
  }
  function stepTangent(p) {
    const a = p.a, fa = Fex(p, a), m = Dex(p, a);
    const c = frAdd(fa, frNeg(frMul(m, fr(a))));
    return Tx(`── 5) Teğet doğrusu ──\n${ptSlope(fa, m, a)}  ⇒  ${lineS(m, c)}`, `── 5) Tangent line ──\n${ptSlope(fa, m, a)}  ⇒  ${lineS(m, c)}`);
  }
  function stepCheck(p) {
    const a = p.a, aS = S(a);
    const num = Dnum(p, a), rule = D(p, a);
    const x = p.x, dx = D(p, x), dnx = Dnum(p, x);
    return Tx(`── 6) Grafikle doğrulama ──\nx = ${aS}: kuralın f′ değeri = ${nf(rule, 5)},  sayısal türev = ${nf(num, 5)}  → örtüşüyor.\nKaydırıcı x = ${nf(x, 2)}: kural ${nf(dx, 4)}, sayısal ${nf(dnx, 4)}; teğetin eğimi de aynı (düz mor ile kesikli altın eğri üst üste).`,
      `── 6) Graphical check ──\nAt x = ${aS}: the rule's f′ = ${nf(rule, 5)}, numerical derivative = ${nf(num, 5)}  → they agree.\nSlider x = ${nf(x, 2)}: rule ${nf(dx, 4)}, numerical ${nf(dnx, 4)}; the tangent slope is the same (solid purple and dashed gold curves coincide).`);
  }
  function stepPitfall(p) {
    const a = p.a, aS = S(a), t = p.atoms;
    const m = Dex(p, a);
    let tr = '', en = '';
    if (p.rule === 'product') {
      const du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
      const w = frMul(du, dv);
      const same = w.n === m.n && w.d === m.d;
      tr = `Sık yapılan hata: (u·v)′ = u′·v′ almaktır. Burada u′(${aS})·v′(${aS}) = ${frS(w)}${same ? ' (bu örnekte tesadüfen aynı, ama genel olarak yanlış)' : ' ≠ ' + frS(m) + ' = f′(' + aS + ')'}.`;
      en = `Classic error: taking (u·v)′ = u′·v′. Here u′(${aS})·v′(${aS}) = ${frS(w)}${same ? ' (equal here by coincidence, but wrong in general)' : ' ≠ ' + frS(m) + ' = f′(' + aS + ')'}.`;
    } else if (p.rule === 'quotient') {
      const u = aex(t[0], a), v = aex(t[1], a), du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
      const sw = frDiv(frSub(frMul(u, dv), frMul(du, v)), frMul(v, v));
      tr = `Sık yapılan hata: payı ters sırada yazmaktır (u·v′ − u′·v): bu ${frS(sw)} verir, yani işaret ters çıkar (doğrusu ${frS(m)}). Ayrıca f′ ≠ u′/v′.`;
      en = `Classic error: reversing the numerator (u·v′ − u′·v): that gives ${frS(sw)}, i.e. the wrong sign (correct: ${frS(m)}). Also f′ ≠ u′/v′.`;
    } else if (p.rule === 'multiple') {
      const base = Object.assign({}, t[0], { c: 1 });
      const dg = aex(dAtom(base), a);
      tr = `Sabit çarpan türevde KALIR: f′ = c·g′. Çarpan unutulursa g′(${aS}) = ${frS(dg)} bulunur; doğrusu ${S(t[0].c)}·${frP(dg)} = ${frS(m)}.`;
      en = `The constant factor STAYS: f′ = c·g′. If it is forgotten we get g′(${aS}) = ${frS(dg)}; the correct value is ${S(t[0].c)}·${frP(dg)} = ${frS(m)}.`;
    } else if (p.rule === 'power') {
      tr = 'Kuvvet kuralı: üs çarpan olarak öne iner ve yeni üs eskisinden bir eksiktir (n·xⁿ⁻¹); üssü azaltmayı ve n çarpanını akılda tutmak yardımcı olur. Negatif/kesirli üslerde de aynı kural geçerlidir.';
      en = 'Power rule: the exponent drops down as a multiplier and the new exponent is one less (n·xⁿ⁻¹); it helps to remember both steps. The same rule works for negative and fractional exponents.';
    } else if (p.rule === 'const') {
      tr = 'Sabit TERİM türevde kaybolur (türevi 0), ancak sabit ÇARPAN kalır. x² + 5 → 2x, ama 5x² → 10x.';
      en = 'A constant TERM disappears (its derivative is 0), but a constant FACTOR stays. x² + 5 → 2x, but 5x² → 10x.';
    } else {
      tr = 'Toplam/fark terim terim türetilir; terimler arasında hiçbir etkileşim yoktur (çarpımdaki gibi çapraz terim yok). İşaretler korunur.';
      en = 'A sum/difference is differentiated term by term; there is no interaction between the terms (no cross terms as in a product). The signs are kept.';
    }
    return Tx(`── 7) Dikkat edilecek nokta ──\n${tr}`, `── 7) Pitfall ──\n${en}`);
  }
  function solveSteps(p) {
    return [stepRule(p), stepParts(p), stepAssemble(p), stepEval(p), stepTangent(p), stepCheck(p), stepPitfall(p)];
  }

  // ---------- TeX: traditional typeset maths (rendered by KaTeX; the framework does this because the topic sets `math: true`) ----------
  const tn = (n) => String(n);
  function frTex(x) { return x.d === 1 ? tn(x.n) : (x.n < 0 ? '-' : '') + '\\frac{' + Math.abs(x.n) + '}{' + x.d + '}'; }
  const frPT = (x) => (x.n < 0 || x.d !== 1 ? '\\left(' + frTex(x) + '\\right)' : frTex(x));
  const nfT = (v, dec) => nf(v, dec).replace(/−/g, '-');
  const coefT = (c) => (c === 1 ? '' : c === -1 ? '-' : tn(c));
  const supT = (n) => (n === 1 ? '' : '^{' + n + '}');
  const powT = (k) => (k === 0 ? '1' : k === 1 ? 'x' : 'x^{' + k + '}');
  function polyTex(co) {
    let s = '';
    for (let i = co.length - 1; i >= 0; i--) {
      const c = co[i];
      if (c === 0) continue;
      const ab = Math.abs(c);
      const lab = i === 0 ? '' : 'x' + supT(i);
      const body = lab === '' ? String(ab) : (ab === 1 ? lab : ab + lab);
      if (s === '') s = (c < 0 ? '-' : '') + body; else s += (c < 0 ? ' - ' : ' + ') + body;
    }
    return s || '0';
  }
  function termTex(t) {
    switch (t.type) {
      case 'pow':
        if (t.n === 0) return tn(t.c);
        if (t.n > 0) return coefT(t.c) + 'x' + supT(t.n);
        return (t.c < 0 ? '-' : '') + '\\frac{' + Math.abs(t.c) + '}{x' + supT(-t.n) + '}';
      case 'sin': return coefT(t.c) + '\\sin x';
      case 'cos': return coefT(t.c) + '\\cos x';
      case 'exp': return coefT(t.c) + 'e^{x}';
      case 'ln': return coefT(t.c) + '\\ln x';
      case 'sqrt': return coefT(t.c) + '\\sqrt{x}';
      case 'dsqrt': { const g = gcd(t.c, 2), nu = t.c / g, de = 2 / g; return (nu < 0 ? '-' : '') + '\\frac{' + Math.abs(nu) + '}{' + (de === 1 ? '' : '2') + '\\sqrt{x}}'; }
      default: return polyTex(t.co);
    }
  }
  const isMulti = (t) => { if (t.type !== 'poly') return false; const nz = t.co.filter((c) => c !== 0); return nz.length > 1; };
  const wrapTex = (t) => { const s = termTex(t); return (isMulti(t) || /^-/.test(s)) ? '\\left(' + s + '\\right)' : s; };
  const simpleX = (t) => (t.type === 'pow' && t.c === 1 && t.n === 1) || (t.type === 'poly' && t.co.length === 2 && t.co[0] === 0 && t.co[1] === 1);
  const sqTex = (t) => (simpleX(t) ? 'x^{2}' : '\\left(' + termTex(t) + '\\right)^{2}');
  function sumTex(atoms) {
    let s = '';
    atoms.forEach((t) => { const ts = termTex(t); s = s === '' ? ts : s + (ts[0] === '-' ? ' - ' + ts.slice(1) : ' + ' + ts); });
    return s || '0';
  }
  function fTex(p) {
    const t = p.atoms;
    switch (p.rule) {
      case 'product': return wrapTex(t[0]) + '\\cdot ' + wrapTex(t[1]);
      case 'quotient': return '\\frac{' + termTex(t[0]) + '}{' + termTex(t[1]) + '}';
      case 'sum': case 'const': return sumTex(t);
      default: return termTex(t[0]);
    }
  }
  function unsimTex(p) {
    const u = p.atoms[0], v = p.atoms[1], du = dAtom(u), dv = dAtom(v);
    if (p.rule === 'product') return wrapTex(du) + '\\cdot ' + wrapTex(v) + ' + ' + wrapTex(u) + '\\cdot ' + wrapTex(dv);
    return '\\frac{' + wrapTex(du) + '\\cdot ' + wrapTex(v) + ' - ' + wrapTex(u) + '\\cdot ' + wrapTex(dv) + '}{' + sqTex(v) + '}';
  }
  function derivTex(p) {
    const t = p.atoms;
    switch (p.rule) {
      case 'product': {
        const pu = polyOf(t[0]), pv = polyOf(t[1]);
        return pu && pv ? polyTex(addP(mulP(derivP(pu), pv), mulP(pu, derivP(pv)))) : unsimTex(p);
      }
      case 'quotient': {
        const pu = polyOf(t[0]), pv = polyOf(t[1]);
        return pu && pv ? '\\frac{' + polyTex(subP(mulP(derivP(pu), pv), mulP(pu, derivP(pv)))) + '}{' + sqTex(A.poly(pv)) + '}' : unsimTex(p);
      }
      case 'sum': case 'const': return sumTex(t.map(dAtom).filter((q) => !isZeroAtom(q)));
      default: { const d = dAtom(t[0]); return isZeroAtom(d) ? '0' : termTex(d); }
    }
  }
  const ruleTex = (r) => ({ const: "(c)'=0", power: "(x^{n})'=n\\,x^{n-1}", multiple: "(c\\cdot f)'=c\\cdot f'", sum: "(f\\pm g)'=f'\\pm g'",
    product: "(u\\cdot v)'=u'\\cdot v+u\\cdot v'", quotient: "\\left(\\frac{u}{v}\\right)'=\\frac{u'\\cdot v-u\\cdot v'}{v^{2}}" }[r]);
  function reasonTex(t) {
    switch (t.type) {
      case 'pow': return t.n === 0 ? Tx("sabit kuralı: $(c)'=0$", "constant rule: $(c)'=0$")
        : Tx("kuvvet kuralı: $(x^{n})'=n\\,x^{n-1}$" + (t.c !== 1 ? ' ve sabit çarpan' : ''), "power rule: $(x^{n})'=n\\,x^{n-1}$" + (t.c !== 1 ? ' and the constant factor' : ''));
      case 'sin': return "$(\\sin x)'=\\cos x$";
      case 'cos': return "$(\\cos x)'=-\\sin x$";
      case 'exp': return "$(e^{x})'=e^{x}$";
      case 'ln': return "$(\\ln x)'=\\frac{1}{x}$";
      case 'sqrt': return "$(\\sqrt{x})'=\\frac{1}{2\\sqrt{x}}$";
      default: return t.co.length === 1 ? Tx("sabit kuralı: $(c)'=0$", "constant rule: $(c)'=0$") : Tx('terim terim kuvvet kuralı', 'power rule term by term');
    }
  }
  const xAT = (a) => (a === 0 ? 'x' : a > 0 ? '(x - ' + a + ')' : '(x + ' + (-a) + ')');
  function lineTex(m, c) {
    let body = '';
    if (m.n !== 0) {
      if (m.d === 1) body = m.n === 1 ? 'x' : m.n === -1 ? '-x' : m.n + 'x';
      else body = (m.n < 0 ? '-' : '') + '\\frac{' + Math.abs(m.n) + '}{' + m.d + '}x';
    }
    if (body === '') return 'y=' + frTex(c);
    if (c.n === 0) return 'y=' + body;
    return 'y=' + body + (c.n < 0 ? ' - ' : ' + ') + frTex(fr(Math.abs(c.n), c.d));
  }
  function ptSlopeTex(fa, m, a) {
    const left = fa.n === 0 ? 'y' : (fa.n < 0 ? 'y + ' + frTex(fr(-fa.n, fa.d)) : 'y - ' + frTex(fa));
    if (m.n === 0) return left + '=0';
    const coef = m.d === 1 ? (Math.abs(m.n) === 1 ? (m.n < 0 ? '-' : '') : tn(m.n)) : frPT(m);
    return left + '=' + coef + xAT(a);
  }

  // ---------- math steps: [{ title, lines: [{ tex, note }] }] ----------
  function mathSteps(p) {
    const t = p.atoms, a = p.a, aS = tn(a), r = p.rule;
    const fa = Fex(p, a), m = Dex(p, a);
    const L = (tex, note) => ({ tex: tex || '', note: note || '' });
    const out = [];
    const why = {
      const: Tx('$f$, kuvvet kuralıyla türetilen bir terim ile bir SABİT terimin toplamıdır; toplam kuralı ve sabit kuralını kullanabiliriz.', '$f$ is a power term plus a CONSTANT term; we can use the sum rule and the constant rule.'),
      power: Tx('$f$ bir kuvvet fonksiyonudur: $x^{n}$ biçimindedir.', '$f$ is a power function of the form $x^{n}$.'),
      multiple: Tx('$f=c\\cdot g$ biçimindedir: bir sabit çarpan ile bir fonksiyonun çarpımı.', '$f=c\\cdot g$: a constant factor times a function.'),
      sum: Tx('EN DIŞTAKİ işlem toplama/çıkarma olduğu için $f$ terimlerin toplamıdır.', 'The OUTERMOST operation is addition/subtraction, so $f$ is a sum of terms.'),
      product: Tx('EN DIŞTAKİ işlem çarpma: iki fonksiyonun çarpımı $u\\cdot v$.', 'The OUTERMOST operation is multiplication: a product $u\\cdot v$ of two functions.'),
      quotient: Tx('EN DIŞTAKİ işlem bölme: iki fonksiyonun oranı $\\frac{u}{v}$.', 'The OUTERMOST operation is division: a quotient $\\frac{u}{v}$ of two functions.'),
    }[r];
    out.push({ title: Tx('1) Kural seçimi', '1) Choosing the rule'), lines: [L('f(x)=' + fTex(p), why), L(ruleTex(r), ruleName(r))] });
    const parts = [];
    if (r === 'product' || r === 'quotient') {
      ['u', 'v'].forEach((nm, i) => parts.push(L(nm + '(x)=' + termTex(t[i]) + '\\qquad\\Longrightarrow\\qquad ' + nm + "'(x)=" + (isZeroAtom(dAtom(t[i])) ? '0' : termTex(dAtom(t[i]))), reasonTex(t[i]))));
    } else if (r === 'sum' || r === 'const') {
      t.forEach((q) => parts.push(L('\\left(' + termTex(q) + "\\right)'=" + (isZeroAtom(dAtom(q)) ? '0' : termTex(dAtom(q))), reasonTex(q))));
    } else if (r === 'multiple') {
      const q = t[0], base = Object.assign({}, q, { c: 1 });
      parts.push(L('f(x)=' + tn(q.c) + "\\cdot g(x),\\quad g(x)=" + termTex(base) + "\\ \\Longrightarrow\\ g'(x)=" + termTex(dAtom(base)), reasonTex(base)));
    } else {
      const q = t[0];
      parts.push(q.type === 'sqrt'
        ? L("(\\sqrt{x})'=\\frac{1}{2\\sqrt{x}}", Tx('$n=\\frac{1}{2}$ için kuvvet kuralı', 'power rule with $n=\\frac{1}{2}$'))
        : L('f(x)=' + termTex(q) + "\\ \\Longrightarrow\\ \\left(" + powT(q.n) + "\\right)'=" + tn(q.n) + '\\cdot ' + powT(q.n - 1), Tx('$n=' + q.n + '$ için kuvvet kuralı: üs öne iner, yeni üs bir eksik olur', 'power rule with $n=' + q.n + '$: the exponent comes down, the new exponent is one less')));
    }
    out.push({ title: Tx('2) Parçaların türevleri', '2) Derivatives of the parts'), lines: parts });
    const asm = [];
    const subNote = Tx('$u$, $v$ ve türevlerini yerine yazalım', 'Substituting $u$, $v$ and their derivatives');
    if (r === 'product') {
      asm.push(L("f'(x)=u'\\cdot v+u\\cdot v'", Tx('Çarpım kuralı', 'Product rule')));
      asm.push(L("f'(x)=" + unsimTex(p), subNote));
      if (polyOf(t[0]) && polyOf(t[1])) asm.push(L("f'(x)=" + derivTex(p), Tx('Parantezleri açıp sadeleştirelim', 'Expanding and simplifying')));
    } else if (r === 'quotient') {
      asm.push(L("f'(x)=\\frac{u'\\cdot v-u\\cdot v'}{v^{2}}", Tx('Bölüm kuralı', 'Quotient rule')));
      asm.push(L("f'(x)=" + unsimTex(p), subNote));
      if (polyOf(t[0]) && polyOf(t[1])) asm.push(L("f'(x)=" + derivTex(p), Tx('Payı açıp sadeleştirelim', 'Expanding the numerator and simplifying')));
    } else if (r === 'sum' || r === 'const') {
      asm.push(L("f'(x)=" + t.map((q) => '\\left(' + termTex(q) + "\\right)'").join(' + '), Tx('Her terimin türevini ayrı ayrı alalım', 'Differentiating each term separately')));
      asm.push(L("f'(x)=" + derivTex(p), r === 'const' ? Tx('Sabit terimin türevi 0 olduğundan görünmez', 'The constant term has derivative 0, so it disappears') : Tx('Parçaların türevlerini toplayalım', 'Adding up the derivatives of the parts')));
    } else asm.push(L("f'(x)=" + derivTex(p), Tx('Kuralı uygulayalım', 'Applying the rule')));
    out.push({ title: Tx('3) Kuralı uygulayalım', '3) Applying the rule'), lines: asm });
    const val = [L('f(' + aS + ')=' + frTex(fa), Tx('$x=' + aS + '$ değerini $f$ içine yazalım', 'Substituting $x=' + aS + '$ into $f$'))];
    if (r === 'product' || r === 'quotient') {
      const u = aex(t[0], a), v = aex(t[1], a), du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
      val.push(L('u(' + aS + ')=' + frTex(u) + ',\\quad v(' + aS + ')=' + frTex(v) + ",\\quad u'(" + aS + ')=' + frTex(du) + ",\\quad v'(" + aS + ')=' + frTex(dv), Tx('Parçaların değerleri', 'Values of the parts')));
      val.push(L(r === 'product'
        ? "f'(" + aS + ")=u'v+uv'=" + frPT(du) + '\\cdot ' + frPT(v) + ' + ' + frPT(u) + '\\cdot ' + frPT(dv) + '=' + frTex(m)
        : "f'(" + aS + ")=\\frac{u'v-uv'}{v^{2}}=\\frac{" + frPT(du) + '\\cdot ' + frPT(v) + ' - ' + frPT(u) + '\\cdot ' + frPT(dv) + '}{' + frPT(v) + '^{2}}=' + frTex(m), Tx('Sayıları yerine koyalım', 'Putting in the numbers')));
    } else val.push(L("f'(x)=" + derivTex(p) + "\\ \\Longrightarrow\\ f'(" + aS + ')=' + frTex(m), Tx('Türevde $x=' + aS + '$ alalım', 'Evaluating the derivative at $x=' + aS + '$')));
    out.push({ title: Tx('4) Değerler: f(' + aS + ') ve f′(' + aS + ')', '4) Values: f(' + aS + ") and f'(" + aS + ')'), lines: val });
    const c = frAdd(fa, frNeg(frMul(m, fr(a))));
    out.push({ title: Tx('5) Teğet doğrusu', '5) Tangent line'), lines: [
      L("y-f(a)=f'(a)\\,(x-a)", Tx('Nokta–eğim biçimi', 'Point–slope form')),
      L(ptSlopeTex(fa, m, a), Tx("$a=" + aS + "$, $f(a)$ ve $f'(a)$ değerlerini yazalım", "Putting in $a=" + aS + "$, $f(a)$ and $f'(a)$")),
      L(lineTex(m, c), Tx('Sadeleştirince teğet doğrusunun denklemi', 'Simplified: the equation of the tangent line')),
    ] });
    const num = Dnum(p, a), rule = D(p, a), x = p.x, dx = D(p, x), dnx = Dnum(p, x);
    out.push({ title: Tx('6) Grafikle doğrulama', '6) Graphical check'), lines: [
      L("f'(" + aS + ")_{\\text{" + Tx('kural', 'rule') + "}}=" + nfT(rule, 5) + "\\qquad f'(" + aS + ")_{\\text{" + Tx('sayısal', 'numerical') + "}}\\approx " + nfT(num, 5), Tx('İki değer örtüşüyor.', 'The two values agree.')),
      L('x=' + nfT(x, 2) + ':\\quad ' + nfT(dx, 4) + '\\ \\text{(' + Tx('kural', 'rule') + ')}\\ \\approx\\ ' + nfT(dnx, 4) + '\\ \\text{(' + Tx('sayısal', 'numerical') + ')}', Tx('Kaydırıcı noktasında da teğetin eğimi aynıdır: düz mor ve kesikli altın eğri üst üste biner.', 'At the slider point too the tangent slope is the same: the solid purple and dashed gold curves coincide.')),
    ] });
    const pit = [];
    if (r === 'product') {
      const du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a), w = frMul(du, dv), same = w.n === m.n && w.d === m.d;
      pit.push(L("u'(" + aS + ")\\cdot v'(" + aS + ')=' + frTex(w) + (same ? '=' : '\\neq ') + frTex(m) + "=f'(" + aS + ')', Tx("Sık yapılan hata: $(u\\cdot v)'=u'\\cdot v'$ almak." + (same ? ' Bu örnekte tesadüfen aynı çıktı, ama genel olarak yanlıştır.' : ''), "Classic error: taking $(u\\cdot v)'=u'\\cdot v'$." + (same ? ' Equal here by coincidence, but wrong in general.' : ''))));
    } else if (r === 'quotient') {
      const u = aex(t[0], a), v = aex(t[1], a), du = aex(dAtom(t[0]), a), dv = aex(dAtom(t[1]), a);
      const sw = frDiv(frSub(frMul(u, dv), frMul(du, v)), frMul(v, v));
      pit.push(L("\\frac{u\\cdot v'-u'\\cdot v}{v^{2}}=" + frTex(sw) + '\\ \\neq\\ ' + frTex(m), Tx("Sık yapılan hata: payı ters sırada yazmak işareti değiştirir. Ayrıca $f'\\neq \\frac{u'}{v'}$ olduğunu hatırlayalım.", "Classic error: writing the numerator in reverse order flips the sign. Also remember $f'\\neq \\frac{u'}{v'}$.")));
    } else if (r === 'multiple') {
      const base = Object.assign({}, t[0], { c: 1 }), dg = aex(dAtom(base), a);
      pit.push(L("g'(" + aS + ')=' + frTex(dg) + '\\ \\neq\\ ' + tn(t[0].c) + '\\cdot ' + frPT(dg) + '=' + frTex(m), Tx("Sabit çarpan türevde kalır: $f'=c\\cdot g'$. Çarpanı unutmayalım.", "The constant factor stays: $f'=c\\cdot g'$. We should not forget it.")));
    } else if (r === 'power') {
      pit.push(L("(x^{n})'=n\\,x^{n-1}", Tx('Üs çarpan olarak öne iner, yeni üs bir eksik olur. Negatif ve kesirli üslerde de aynı kural geçerlidir.', 'The exponent comes down as a factor and the new exponent is one less. The same rule works for negative and fractional exponents.')));
    } else if (r === 'const') {
      pit.push(L("(x^{2}+5)'=2x\\qquad (5x^{2})'=10x", Tx('Sabit TERİM türevde kaybolur, sabit ÇARPAN kalır.', 'A constant TERM disappears, a constant FACTOR stays.')));
    } else {
      pit.push(L("(f\\pm g)'=f'\\pm g'", Tx('Toplam/fark terim terim türetilir; terimler arasında çapraz terim yoktur ve işaretler korunur.', 'A sum/difference is differentiated term by term; there are no cross terms and the signs are kept.')));
    }
    out.push({ title: Tx('7) Dikkat edilecek nokta', '7) Pitfall'), lines: pit });
    return out;
  }

  // ---------- drawing ----------
  function focus(p) {
    const y = F(p, p.a);
    return (isFinite(p.a) && isFinite(y)) ? { x: p.a, y } : null;
  }
  let selHandle = null;
  function draw(canvas, p) {
    try {
      try { if (selHandle && selHandle.refreshFromModel) selHandle.refreshFromModel(); } catch (e) { /* ignore */ }
      const fc = focus(p) || { x: 0, y: 0 };
      const X0 = fc.x - 4, X1 = fc.x + 4;
      const ys = [];
      for (let i = 0; i <= 240; i++) {
        const x = X0 + (X1 - X0) * i / 240;
        const y = F(p, x); if (isFinite(y)) ys.push(y);
        const d = D(p, x); if (isFinite(d)) ys.push(d);
      }
      ys.sort((u, v) => u - v);
      let lo = -4, hi = 4;
      if (ys.length > 10) { lo = ys[Math.floor(ys.length * 0.03)]; hi = ys[Math.min(ys.length - 1, Math.floor(ys.length * 0.97))]; }
      lo = Math.min(lo, 0); hi = Math.max(hi, 0);
      if (hi - lo < 4) { const c = (hi + lo) / 2; lo = c - 2; hi = c + 2; }
      if (hi - lo > 80) { lo = Math.max(lo, -40); hi = Math.min(hi, 40); }
      const pad = (hi - lo) * 0.1;
      const hh = Math.max(hi - fc.y, fc.y - lo) + pad;
      canvas.setViewport(X0, X1, fc.y - hh, fc.y + hh);
      canvas.addFunction({ evaluator: (x) => F(p, x), color: canvas.accent(), thickness: 3, label: 'f(x)' });
      if (p.showD) {
        canvas.addFunction({ evaluator: (x) => Dnum(p, x), color: canvas.purple(), thickness: 3.5, label: Tx('sayısal f′', 'numerical f′') });
        canvas.addFunction({ evaluator: (x) => D(p, x), color: canvas.gold(), thickness: 2, dashed: true, label: Tx('kuralın f′', "rule's f′") });
      }
      const x = p.x, fx = F(p, x), dx = D(p, x);
      if (p.showTan && isFinite(fx) && isFinite(dx)) {
        canvas.addSegment({ x1: X0, y1: fx + dx * (X0 - x), x2: X1, y2: fx + dx * (X1 - x), color: canvas.orange(), thickness: 2, dashed: false });
        canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray() });
        canvas.addMarker({ x, y: fx, color: canvas.orange(), radius: 6, label: `f = ${nf(fx, 2)}` });
        if (p.showD) canvas.addMarker({ x, y: dx, color: canvas.purple(), radius: 6, label: `f′ = ${nf(dx, 2)}` });
      }
      const fa = F(p, p.a);
      if (isFinite(fa)) canvas.addMarker({ x: p.a, y: fa, color: canvas.gold(), shape: 'diamond', radius: 7, label: `a = ${nf(p.a, 2)}` });
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    selHandle = h.addSelect({
      options: RULES.map((r) => ({ label: ruleName(r), value: r })),
      get: () => getProblem().rule,
      set: (v) => { Object.assign(getProblem(), genRule(RNG, v)); },
    });
    h.addSlider({
      caption: Tx('Teğet noktası (x)', 'Point of tangency (x)'), min: -4, max: 4, step: 0.05,
      get: () => getProblem().x,
      set: (v) => { getProblem().x = Math.max(-4, Math.min(4, v)); },
    });
    h.addCheckbox({
      caption: Tx('f′ eğrilerini göster (sayısal ve kural)', "Show the f′ curves (numerical and rule)"),
      get: () => getProblem().showD,
      set: (v) => { getProblem().showD = !!v; },
    });
    h.addCheckbox({
      caption: Tx('Teğeti göster', 'Show the tangent'),
      get: () => getProblem().showTan,
      set: (v) => { getProblem().showTan = !!v; },
    });
  }

  Topics.register('derivatives', {
    id: 'differentiationRules',
    tabTitle: () => Tx('Türev Alma Kuralları', 'Differentiation Rules'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    math: true,
    links: [
      { match: /^\s*• (Sabit|Constant):/, make: (rng) => genRule(rng, 'const') },
      { match: /^\s*• (Kuvvet|Power):/, make: (rng) => genRule(rng, 'power') },
      { match: /^\s*• (Sabit çarpan|Constant multiple):/, make: (rng) => genRule(rng, 'multiple') },
      { match: /^\s*• (Toplam\/fark|Sum\/difference):/, make: (rng) => genRule(rng, 'sum') },
      { match: /^\s*• (Çarpım|Product):/, make: (rng) => genRule(rng, 'product') },
      { match: /^\s*• (Bölüm|Quotient):/, make: (rng) => genRule(rng, 'quotient') },
      { match: /^\s*• (Zincir|Chain):/, tab: 'chainRule' },
      { match: /^\s*• (Üstel|Exponential):/, tab: 'expLogDerivatives' },
      { match: /^\s*• (Logaritma|Logarithm):/, tab: 'expLogDerivatives' },
      { match: /^\s*• (Trigonometri|Trigonometry):/, tab: 'trigDerivatives' },
    ],
    solveMath: mathSteps,
    draw,
    focus,
    buildControls,
  });
})();
