// Concavity, Inflection Points & the Second Derivative Test (chapter 'applications').
// problem = { kind, ...params, x0 (moving point), showD2 }
//   'cubic'    f = a u^3 + e u + d, u = x - p     f'' = 6a u (inflection at p); e = -3a k^2 -> critical points p -+ k
//   'quartTwo' f = a x^4 - 2a(r1+r2)x^3 + 6a r1 r2 x^2 + c x + d     f'' = 12a(x-r1)(x-r2)  (two inflection points)
//   'quartW'   f = a x^4 - 2a r^2 x^2 + d        f'' = 4a(3x^2 - r^2): inflection at -+ r sqrt3/3, critical -r, 0, r
//   'quart0'   f = a x^4 + b x^2 + d, b = 0 (f''(0)=0 but NO inflection) or b = a j (no f''=0 at all)
//   'rat'      f = ka / x                        f'' changes sign at 0, but f is undefined there: NOT an inflection
//   'sin'      f = A sin x on (0, 2pi)           inflection at pi, critical points pi/2, 3pi/2
//   'cbrt'     f = ka cbrt(x - p) + d            f'' undefined at p, but concavity changes: inflection (vertical tangent)
//   'exp'      f = ka e^x + d                    concave everywhere, no inflection
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
  const frMul = (a, b) => fr(a.n * b.n, a.d * b.d);
  const frNum = (a) => a.n / a.d;
  const M = (s) => String(s).replace(/-/g, '−');
  const S = (n) => M(String(n === 0 ? 0 : n));
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
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
  const lead = (c) => (c === 1 ? '' : c === -1 ? '−' : S(c));
  const sgnStr = (s) => (s > 0 ? '+' : s < 0 ? '−' : '0');
  const xmin = (c) => (c === 0 ? 'x' : (c > 0 ? `(x − ${c})` : `(x + ${-c})`));
  function facStr(ld, roots) {
    let s = ld === 1 ? '' : ld === -1 ? '−' : S(ld);
    roots.forEach((r) => { s += r === 0 ? 'x' : (r > 0 ? `(x − ${r})` : `(x + ${-r})`); });
    return s;
  }
  const PI = Math.PI;
  const piStr = (k, d) => { // k*pi/d
    const g = gcd(k, d); k = k / g; d = d / g;
    if (k === 0) return '0';
    const nm = k === 1 ? 'π' : k + 'π';
    return d === 1 ? nm : nm + '/' + d;
  };

  // ---------- model ----------
  function coefs(p) {
    switch (p.kind) {
      case 'cubic': return [-p.a * p.p * p.p * p.p - p.e * p.p + p.d, 3 * p.a * p.p * p.p + p.e, -3 * p.a * p.p, p.a];
      case 'quartTwo': return [p.d, p.c1, 6 * p.a * p.r1 * p.r2, -2 * p.a * (p.r1 + p.r2), p.a];
      case 'quartW': return [p.d, 0, -2 * p.a * p.r * p.r, 0, p.a];
      case 'quart0': return [p.d, 0, p.b, 0, p.a];
      default: return null;
    }
  }
  const dcoefs = (cf) => cf.slice(1).map((c, i) => c * (i + 1));
  function hornerNum(cf, x) { let y = 0; for (let i = cf.length - 1; i >= 0; i--) y = y * x + cf[i]; return y; }
  function hornerFr(cf, x) { let y = fr(0); for (let i = cf.length - 1; i >= 0; i--) y = frAdd(frMul(y, x), fr(cf[i])); return y; }

  function fNum(p, x) {
    let y;
    const cf = coefs(p);
    if (cf) y = hornerNum(cf, x);
    else if (p.kind === 'rat') y = Math.abs(x) < 0.03 ? NaN : p.ka / x;
    else if (p.kind === 'sin') y = p.A * Math.sin(x);
    else if (p.kind === 'cbrt') y = p.ka * Math.cbrt(x - p.p) + p.d;
    else y = p.ka * Math.exp(x) + p.d;
    return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN;
  }
  function fpNum(p, x) {
    let y;
    const cf = coefs(p);
    if (cf) y = hornerNum(dcoefs(cf), x);
    else if (p.kind === 'rat') y = Math.abs(x) < 0.03 ? NaN : -p.ka / (x * x);
    else if (p.kind === 'sin') y = p.A * Math.cos(x);
    else if (p.kind === 'cbrt') y = Math.abs(x - p.p) < 1e-3 ? NaN : p.ka / (3 * Math.pow(Math.abs(Math.cbrt(x - p.p)), 2));
    else y = p.ka * Math.exp(x);
    return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN;
  }
  function f2Num(p, x) {
    let y;
    const cf = coefs(p);
    if (cf) y = hornerNum(dcoefs(dcoefs(cf)), x);
    else if (p.kind === 'rat') y = Math.abs(x) < 0.03 ? NaN : 2 * p.ka / (x * x * x);
    else if (p.kind === 'sin') y = -p.A * Math.sin(x);
    else if (p.kind === 'cbrt') { const u = x - p.p; y = Math.abs(u) < 1e-3 ? NaN : -2 * p.ka / (9 * Math.cbrt(u) * Math.cbrt(u) * Math.cbrt(u) * Math.cbrt(u) * Math.cbrt(u)); }
    else y = p.ka * Math.exp(x);
    return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN;
  }
  const fAtInt = (p, x) => hornerFr(coefs(p), fr(x)); // polynomial kinds only

  function fStr(p) {
    const cf = coefs(p);
    if (cf) {
      const terms = [];
      for (let i = cf.length - 1; i >= 0; i--) terms.push([cf[i], i === 0 ? '' : i === 1 ? 'x' : 'x' + ['', '', '²', '³', '⁴'][i]]);
      return poly(terms);
    }
    switch (p.kind) {
      case 'rat': return p.ka === 1 ? '1/x' : p.ka === -1 ? '−1/x' : S(p.ka) + '/x';
      case 'sin': return (p.A === 1 ? '' : p.A) + 'sin x';
      case 'cbrt': return lead(p.ka).replace(/^1$/, '') + '∛' + xmin(p.p) + (p.d === 0 ? '' : (p.d < 0 ? ' − ' : ' + ') + Math.abs(p.d));
      default: return lead(p.ka) + 'eˣ' + (p.d === 0 ? '' : (p.d < 0 ? ' − ' : ' + ') + Math.abs(p.d));
    }
  }
  function derStr(p, order) {
    const cf = coefs(p);
    if (cf) {
      let d = cf; for (let k = 0; k < order; k++) d = dcoefs(d);
      const terms = [];
      for (let i = d.length - 1; i >= 0; i--) terms.push([d[i], i === 0 ? '' : i === 1 ? 'x' : 'x' + ['', '', '²', '³'][i]]);
      return poly(terms);
    }
    const k = p.ka;
    switch (p.kind) {
      case 'rat': return order === 1 ? (k === 1 ? '−1/x²' : S(-k) + '/x²') : S(2 * k) + '/x³';
      case 'sin': return order === 1 ? (p.A === 1 ? '' : p.A) + 'cos x' : '−' + (p.A === 1 ? '' : p.A) + 'sin x';
      case 'cbrt': return order === 1 ? `${S(k)} / (3·∛(${xmin(p.p)}²))` : `${S(-2 * k)} / (9·∛(${xmin(p.p)}⁵))`;
      default: return lead(k) + 'eˣ';
    }
  }
  function d2Fac(p) {
    switch (p.kind) {
      case 'cubic': return facStr(6 * p.a, [p.p]);
      case 'quartTwo': return facStr(12 * p.a, [p.r1, p.r2]);
      case 'quartW': return `${S(4 * p.a)}(3x² − ${p.r * p.r})`;
      default: return '';
    }
  }
  function d1Fac(p) {
    switch (p.kind) {
      case 'cubic': return p.k > 0 ? `${S(3 * p.a)}(${xmin(p.p)}² − ${p.k * p.k})` : (p.e === 0 ? `${S(3 * p.a)}${xmin(p.p)}²` : '');
      case 'quartW': return `${S(4 * p.a)}x(x² − ${p.r * p.r})`;
      case 'quart0': return p.b === 0 ? `${S(4 * p.a)}x³` : `${S(2)}x(${S(2 * p.a)}x² + ${S(p.b)})`.replace('+ −', '− ');
      default: return '';
    }
  }

  // ---------- analysis ----------
  // rows of the f'' sign chart: { l, r (strings), t (test label), s (sign), v (f'' value string), x (numeric test) }
  function f2Exact(p, t) { // exact f''(t) for integer/fraction test t -> {s, str}
    const cf = coefs(p);
    if (cf) { const v = hornerFr(dcoefs(dcoefs(cf)), t); return { s: Math.sign(v.n), str: frS(v) }; }
    if (p.kind === 'rat') { const v = frMul(fr(2 * p.ka), fr(t.d * t.d * t.d, t.n * t.n * t.n)); return { s: Math.sign(v.n), str: frS(v) }; }
    // cbrt: f'' = -2k / (9 u^(5/3)), t = u (integer +-1 only)
    const u = frNum(t) - p.p;
    const v = fr(-2 * p.ka * (u > 0 ? 1 : -1), 9);
    return { s: Math.sign(v.n), str: frS(v) };
  }
  function rowsOf(p) {
    const rows = [];
    const add = (l, r, tLabel, x, s, v) => rows.push({ l, r, t: tLabel, x, s, v });
    const mk = (l, r, t) => { const e = f2Exact(p, t); add(l, r, frS(t), frNum(t), e.s, e.str); };
    switch (p.kind) {
      case 'cubic': mk('−∞', S(p.p), fr(p.p - 1)); mk(S(p.p), '∞', fr(p.p + 1)); break;
      case 'quartTwo': {
        mk('−∞', S(p.r1), fr(p.r1 - 1));
        mk(S(p.r1), S(p.r2), p.r2 - p.r1 >= 2 ? fr(p.r1 + 1) : fr(p.r1 + p.r2, 2));
        mk(S(p.r2), '∞', fr(p.r2 + 1));
        break;
      }
      case 'quartW': {
        const b = (p.r === 1 ? '' : p.r) + '√3/3';
        mk('−∞', '−' + b, fr(-p.r)); mk('−' + b, b, fr(0)); mk(b, '∞', fr(p.r));
        break;
      }
      case 'quart0': {
        if (p.b === 0) { mk('−∞', '0', fr(-1)); mk('0', '∞', fr(1)); } else mk('−∞', '∞', fr(0));
        break;
      }
      case 'rat': mk('−∞', '0', fr(-1)); mk('0', '∞', fr(1)); break;
      case 'cbrt': mk('−∞', S(p.p), fr(p.p - 1)); mk(S(p.p), '∞', fr(p.p + 1)); break;
      case 'sin':
        add('0', 'π', 'π/2', PI / 2, -p.A, S(-p.A) + ' · sin(π/2) = ' + S(-p.A));
        add('π', '2π', '3π/2', 3 * PI / 2, p.A, S(-p.A) + ' · sin(3π/2) = ' + S(p.A));
        break;
      default: add('−∞', '∞', '0', 0, Math.sign(p.ka), S(p.ka) + '·e⁰ = ' + S(p.ka));
    }
    return rows;
  }
  // split points between rows: {x (num), str, type}
  function candidates(p) {
    switch (p.kind) {
      case 'cubic': return [{ x: p.p, str: S(p.p), type: 'zero' }];
      case 'quartTwo': return [{ x: p.r1, str: S(p.r1), type: 'zero' }, { x: p.r2, str: S(p.r2), type: 'zero' }];
      case 'quartW': { const b = (p.r === 1 ? '' : p.r) + '√3/3'; return [{ x: -p.r * Math.sqrt(3) / 3, str: '−' + b, type: 'zero' }, { x: p.r * Math.sqrt(3) / 3, str: b, type: 'zero' }]; }
      case 'quart0': return p.b === 0 ? [{ x: 0, str: '0', type: 'zero' }] : [];
      case 'rat': return [{ x: 0, str: '0', type: 'hole' }];
      case 'cbrt': return [{ x: p.p, str: S(p.p), type: 'undef' }];
      case 'sin': return [{ x: PI, str: 'π', type: 'zero' }];
      default: return [];
    }
  }
  // y-value of f at a candidate (exact string)
  function candY(p, c) {
    switch (p.kind) {
      case 'cubic': case 'quartTwo': { const v = fAtInt(p, c.x); return { num: frNum(v), str: frS(v) }; }
      case 'quartW': { const v = frAdd(fr(p.d), fr(-5 * p.a * Math.pow(p.r, 4), 9)); return { num: frNum(v), str: frS(v) }; }
      case 'quart0': return { num: p.d, str: S(p.d) };
      case 'cbrt': return { num: p.d, str: S(p.d) };
      case 'sin': return { num: 0, str: '0' };
      default: return { num: NaN, str: '—' };
    }
  }
  function inflections(p) {
    const rows = rowsOf(p), cand = candidates(p), res = [];
    cand.forEach((c, i) => {
      const before = rows[i].s, after = rows[i + 1].s;
      const change = before !== 0 && after !== 0 && before !== after;
      res.push({ c, before, after, change: change && c.type !== 'hole', raw: change, y: c.type === 'hole' ? null : candY(p, c) });
    });
    return res;
  }
  // critical points + second derivative test: { mode, items: [{x, str, y:{num,str}, f2str, f2s, verdict}] }
  function crits(p) {
    const item = (x, f2s, f2str, y) => ({ x, str: S(x), y: { num: frNum(y), str: frS(y) }, f2s, f2str, verdict: f2s > 0 ? 'min' : f2s < 0 ? 'max' : 'inconclusive' });
    const f2at = (x) => hornerFr(dcoefs(dcoefs(coefs(p))), fr(x));
    switch (p.kind) {
      case 'cubic': {
        if (p.e === 0) { const x = p.p; return { mode: 'list', items: [item(x, 0, '0', fAtInt(p, x))] }; }
        if (p.k > 0) return { mode: 'list', items: [p.p - p.k, p.p + p.k].map((x) => { const v = f2at(x); return item(x, Math.sign(v.n), frS(v), fAtInt(p, x)); }) };
        return { mode: 'none', items: [] };
      }
      case 'quartW': return { mode: 'list', items: [-p.r, 0, p.r].map((x) => { const v = f2at(x); return item(x, Math.sign(v.n), frS(v), fAtInt(p, x)); }) };
      case 'quart0': { const v = f2at(0); return { mode: 'list', items: [item(0, Math.sign(v.n), frS(v), fAtInt(p, 0))] }; }
      case 'sin': return {
        mode: 'list', items: [
          { x: PI / 2, str: 'π/2', y: { num: p.A, str: S(p.A) }, f2s: -p.A, f2str: S(-p.A), verdict: p.A > 0 ? 'max' : 'min' },
          { x: 3 * PI / 2, str: '3π/2', y: { num: -p.A, str: S(-p.A) }, f2s: p.A, f2str: S(p.A), verdict: p.A > 0 ? 'min' : 'max' },
        ],
      };
      case 'rat': case 'exp': return { mode: 'none', items: [] };
      case 'cbrt': return { mode: 'undef', items: [{ x: p.p, str: S(p.p), y: { num: p.d, str: S(p.d) } }] };
      default: return { mode: 'skip', items: [] };
    }
  }

  // ---------- generation ----------
  function createProblem(rng, forcedKind, expSign) {
    const kinds = ['cubic', 'cubic', 'cubic', 'quartTwo', 'quartW', 'quart0', 'rat', 'sin', 'cbrt', 'exp'];
    const kind = forcedKind || rng.pick(kinds);
    const p = { kind, showD2: false };
    const sg = () => rng.pick([1, -1]);
    if (kind === 'cubic') {
      p.a = rng.pick([1, 1, -1, -1, 2, -2]); p.p = rng.nextInt(-2, 3); p.d = rng.nextInt(-3, 4);
      const t = rng.nextInt(0, 5);
      if (t <= 1) { p.k = rng.nextInt(1, 3); p.e = -3 * p.a * p.k * p.k; } // two critical points
      else if (t === 2) { p.k = 0; p.e = 0; } // flat: f'(p) = f''(p) = 0
      else { p.k = 0; p.e = p.a * rng.nextInt(1, 3); } // monotonic
      p.xl = p.p - 4; p.xh = p.p + 4;
    } else if (kind === 'quartTwo') {
      p.a = rng.pick([1, -1, 1, -1, 2]); p.r1 = rng.nextInt(-3, 2); p.r2 = p.r1 + rng.nextInt(1, 4); p.c1 = rng.nextInt(-2, 3); p.d = rng.nextInt(-3, 4);
      p.xl = p.r1 - 2.5; p.xh = p.r2 + 2.5;
    } else if (kind === 'quartW') {
      p.a = sg(); p.r = rng.nextInt(1, 4); p.d = rng.nextInt(-3, 4); p.xl = -p.r - 2; p.xh = p.r + 2;
    } else if (kind === 'quart0') {
      p.a = rng.pick([1, -1, 2, -2]); p.b = rng.nextInt(0, 3) === 0 ? p.a * rng.nextInt(1, 3) : 0; p.d = rng.nextInt(-3, 4);
      p.xl = -3; p.xh = 3;
    } else if (kind === 'rat') {
      p.ka = rng.pick([1, -1, 2, -2]); p.xl = -6; p.xh = 6;
    } else if (kind === 'sin') {
      p.A = rng.pick([1, 2, 3, -1, -2]); p.xl = -0.8; p.xh = 7.1;
    } else if (kind === 'cbrt') {
      p.ka = sg(); p.p = rng.nextInt(-2, 3); p.d = rng.nextInt(-2, 3); p.xl = p.p - 5; p.xh = p.p + 5;
    } else {
      p.ka = rng.pick([1, -1, 2, -2]); p.d = rng.nextInt(-2, 3); p.xl = -4; p.xh = 2.5;
      if (expSign) p.ka = expSign * Math.abs(p.ka);
    }
    p.x0 = Math.round((p.xl + 0.15 * (p.xh - p.xl)) * 10) / 10;
    return p;
  }

  // ---------- text ----------
  function problemStatement(p) {
    const f = `f(x) = ${fStr(p)}`;
    const dom = p.kind === 'sin' ? Tx(', 0 < x < 2π', ', 0 < x < 2π') : p.kind === 'rat' ? ' (x ≠ 0)' : '';
    const cr = crits(p);
    const partD = cr.mode === 'list' ? Tx('\n(c) f\'(x) = 0 olan noktaları bulup İkinci Türev Testi ile sınıflandırın (sonuçsuz ise başka bir test seçin).', '\n(c) Find the points with f\'(x) = 0 and classify them with the Second Derivative Test (if inconclusive, use another test).') : '';
    return Tx(
      `${f}${dom} fonksiyonu veriliyor.\n(a) f''(x)'i bulun ve fonksiyonun yukarı / aşağı bükey olduğu aralıkları belirleyin.\n(b) Büküm noktalarını (varsa) bulun; f''(x) = 0 olması tek başına yeterli mi, işaret tablosuyla gösterin.${partD}`,
      `Let ${f}${dom}.\n(a) Find f''(x) and determine the intervals where f is concave up / concave down.\n(b) Find the inflection points (if any); show with a sign chart whether f''(x) = 0 alone is enough.${partD}`);
  }

  function concept() {
    return Tx(
      'KONKAVLIK VE BÜKÜM NOKTALARI\n' +
      '\n' +
      'TANIM\n' +
      'Birinci türev f\' eğimi (artma / azalma), ikinci türev f\'\' ise eğrinin NASIL büküldüğünü anlatır. f\'\' aslında f\'nün değişim hızıdır: f\'\' > 0 ise eğim artıyordur, f\'\' < 0 ise eğim azalıyordur.\n' +
      '\n' +
      'TEMEL KURALLAR\n' +
      '• f\'\'(x) > 0 → YUKARI BÜKEY (kase gibi ∪): teğetler eğrinin ALTINDA kalır, eğim soldan sağa artar.\n' +
      '• f\'\'(x) < 0 → AŞAĞI BÜKEY (kubbe gibi ∩): teğetler eğrinin ÜSTÜNDE kalır, eğim azalır.\n' +
      '• BÜKÜM NOKTASI: bükeyliğin değiştiği, yani f\'\'nün İŞARET DEĞİŞTİRDİĞİ ve f\'nin tanımlı olduğu (teğetin var olduğu) nokta.\n' +
      '\n' +
      'YÖNTEM (adım adım)\n' +
      '1. f\'(x) ve f\'\'(x) türevlerini hesapla.\n' +
      '2. f\'\'(x) = 0 olan noktaları ve f\'\'nün tanımsız olduğu noktaları bul (ADAY noktalar).\n' +
      '3. Adaylarla sayı doğrusunu aralıklara böl.\n' +
      '4. Her aralıktan bir deneme değeri seç, f\'\'nün işaretini bul (işaret tablosu).\n' +
      '5. İşaret değişen adaylar büküm noktasıdır; y değerini f(x₀) ile bul.\n' +
      '\n' +
      'İKİNCİ TÜREV TESTİ (bağlantı)\n' +
      'f\'(c) = 0 iken: f\'\'(c) > 0 → yerel MİNİMUM; f\'\'(c) < 0 → yerel MAKSİMUM; f\'\'(c) = 0 → test SONUÇSUZ (birinci türev testine dön: f = x⁴ için min, f = x³ için ekstremum yok).\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '• f\'\'(x₀) = 0 ama işaret değişmez (f = x⁴, x₀ = 0): büküm noktası DEĞİL.\n' +
      '• f\'\' tanımsız ama f sürekli ve işaret değişiyor (f = ∛x, x₀ = 0, dikey teğet): büküm noktasıdır.\n' +
      '• f = 1/x gibi: x = 0\'ın iki yanında bükeylik değişir ama f(0) tanımsız → büküm noktası DEĞİL.\n' +
      '• f = eˣ gibi f\'\' hiç sıfır olmaz: her yerde yukarı bükey, büküm yok.\n' +
      '• Kübik (3. derece) polinomun her zaman TAM BİR büküm noktası vardır (f\'\' doğrusal).\n' +
      '\n' +
      'TUZAKLAR\n' +
      '• f\'\'(c) = 0 olması TEK BAŞINA büküm noktası demek DEĞİLDİR. Örnek: f = x⁴ için f\'\'(0) = 0 ama f\'\' = 12x² her iki yanda da pozitif, büküm yok.\n' +
      '• Büküm noktasında f sürekli olmalı; f\'\' tanımsızsa (ör. x^(1/3), x = 0) işaret değişiyorsa yine büküm olabilir.\n' +
      '• Dikey asimptotun iki yanında bükeylik değişebilir ama orası büküm noktası değildir (f tanımsız).\n' +
      '• Artan / azalan ile yukarı / aşağı bükey karıştırılmasın: biri f\', diğeri f\'\' ile ilgilidir.\n' +
      '\n' +
      'HAFIZA KURALI\n' +
      'f\'\' > 0 → "su tutar" (∪, gülen yüz); f\'\' < 0 → "su döker" (∩).\n' +
      '\n' +
      'MİNİ ÖRNEK\n' +
      'f(x) = x³ − 3x² + 2. f\' = 3x² − 6x, f\'\' = 6x − 6 = 0 → x = 1. x < 1 için f\'\' < 0 (aşağı bükey), x > 1 için f\'\' > 0 (yukarı bükey) → işaret değişiyor, (1, f(1)) = (1, 0) büküm noktasıdır.\n' +
      '\n' +
      'GRAFİK: Mavi bölge yukarı bükey (f\'\' > 0), turuncu bölge aşağı bükey (f\'\' < 0). Altın elmas büküm noktası, içi boş altın daire "f\'\' = 0 ama büküm değil" ya da "f tanımsız" adayıdır. Yeşil / kırmızı daireler İkinci Türev Testi ile bulunan yerel maks / min. Kaydırıcıyla hareketli noktanın teğetinin eğriye göre altta mı üstte mi kaldığını izleyin.',
      'CONCAVITY AND INFLECTION POINTS\n' +
      '\n' +
      'DEFINITION\n' +
      'The first derivative f\' describes the slope (rising / falling); the second derivative f\'\' describes HOW the curve bends. Indeed f\'\' is the rate of change of f\': f\'\' > 0 means the slope is increasing, f\'\' < 0 means it is decreasing.\n' +
      '\n' +
      'KEY RULES\n' +
      '• f\'\'(x) > 0 → CONCAVE UP (bowl-shaped ∪): tangent lines lie BELOW the curve, the slope increases from left to right.\n' +
      '• f\'\'(x) < 0 → CONCAVE DOWN (dome-shaped ∩): tangent lines lie ABOVE the curve, the slope decreases.\n' +
      '• INFLECTION POINT: a point where concavity changes, i.e. f\'\' CHANGES SIGN, and where f is defined with a tangent line.\n' +
      '\n' +
      'METHOD (step by step)\n' +
      '1. Compute f\'(x) and f\'\'(x).\n' +
      '2. Find the points where f\'\'(x) = 0 and where f\'\' is undefined (CANDIDATES).\n' +
      '3. Use the candidates to split the number line into intervals.\n' +
      '4. Pick a test value in each interval and find the sign of f\'\' (sign chart).\n' +
      '5. Candidates where the sign changes are inflection points; get the y-value from f(x₀).\n' +
      '\n' +
      'SECOND DERIVATIVE TEST (connection)\n' +
      'When f\'(c) = 0: f\'\'(c) > 0 → local MINIMUM; f\'\'(c) < 0 → local MAXIMUM; f\'\'(c) = 0 → INCONCLUSIVE (fall back to the first derivative test: f = x⁴ has a minimum, f = x³ has no extremum).\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '• f\'\'(x₀) = 0 but no sign change (f = x⁴, x₀ = 0): NOT an inflection point.\n' +
      '• f\'\' undefined but f continuous with a sign change (f = ∛x, x₀ = 0, vertical tangent): it IS an inflection point.\n' +
      '• f = 1/x: concavity changes across x = 0, but f(0) is undefined → NOT an inflection point.\n' +
      '• f = eˣ: f\'\' is never zero; concave up everywhere, no inflection.\n' +
      '• A cubic polynomial always has exactly ONE inflection point (f\'\' is linear).\n' +
      '\n' +
      'PITFALLS\n' +
      '• f\'\'(c) = 0 ALONE does NOT make an inflection point. Example: f = x⁴ has f\'\'(0) = 0, but f\'\' = 12x² is positive on both sides, so there is no inflection.\n' +
      '• f must be continuous at the point; if f\'\' is undefined (e.g. x^(1/3) at x = 0) but changes sign, it can still be an inflection.\n' +
      '• Concavity may change across a vertical asymptote, but that is not an inflection point (f is undefined there).\n' +
      '• Do not mix up increasing / decreasing with concave up / down: one is about f\', the other about f\'\'.\n' +
      '\n' +
      'MEMORY AID\n' +
      'f\'\' > 0 → "holds water" (∪, smiley); f\'\' < 0 → "spills water" (∩).\n' +
      '\n' +
      'MINI EXAMPLE\n' +
      'f(x) = x³ − 3x² + 2. f\' = 3x² − 6x, f\'\' = 6x − 6 = 0 → x = 1. For x < 1, f\'\' < 0 (concave down); for x > 1, f\'\' > 0 (concave up) → the sign changes, so (1, f(1)) = (1, 0) is an inflection point.\n' +
      '\n' +
      'GRAPH: blue shading is concave up (f\'\' > 0), orange is concave down (f\'\' < 0). The gold diamond is an inflection point; a hollow gold circle is a candidate that is "f\'\' = 0 but no inflection" or "f undefined". Green / red circles are local max / min found with the Second Derivative Test. Drag the slider to see whether the moving tangent stays below or above the curve.');
  }

  function solveSteps(p) {
    const st = [];
    const f = fStr(p), f1 = derStr(p, 1), f2 = derStr(p, 2), rows = rowsOf(p), inf = inflections(p), cr = crits(p);
    const fac2 = d2Fac(p);

    // 1) derivatives
    {
      let tr = `── 1) Birinci ve ikinci türevi bul ──\nf(x) = ${f}\nf'(x) = ${f1}\nf''(x) = ${f2}`;
      let en = `── 1) Find the first and second derivatives ──\nf(x) = ${f}\nf'(x) = ${f1}\nf''(x) = ${f2}`;
      if (fac2) { tr += `\nÇarpanlarına ayrılmış: f''(x) = ${fac2}`; en += `\nFactored: f''(x) = ${fac2}`; }
      if (p.kind === 'cbrt') { tr += `\n(∛u = u^(1/3); f' = (k/3)·u^(−2/3), f'' = −(2k/9)·u^(−5/3).)`; en += `\n(∛u = u^(1/3); f' = (k/3)·u^(−2/3), f'' = −(2k/9)·u^(−5/3).)`; }
      st.push(Tx(tr, en));
    }

    // 2) candidates
    {
      let tr = '── 2) Aday noktaları bul: f\'\' = 0 veya f\'\' tanımsız ──\n', en = '── 2) Find the candidates: f\'\' = 0 or f\'\' undefined ──\n';
      if (p.kind === 'cubic') {
        tr += `f''(x) = ${fac2} = 0 → x = ${S(p.p)}.\nf'' doğrusal olduğundan başka aday yok.`;
        en += `f''(x) = ${fac2} = 0 → x = ${S(p.p)}.\nf'' is linear, so there are no other candidates.`;
      } else if (p.kind === 'quartTwo') {
        tr += `f''(x) = ${fac2} = 0 → x = ${S(p.r1)} veya x = ${S(p.r2)}.`;
        en += `f''(x) = ${fac2} = 0 → x = ${S(p.r1)} or x = ${S(p.r2)}.`;
      } else if (p.kind === 'quartW') {
        const b = (p.r === 1 ? '' : p.r) + '√3/3';
        tr += `f''(x) = ${fac2} = 0 → 3x² = ${p.r * p.r} → x² = ${frS(fr(p.r * p.r, 3))} → x = ±${b} ≈ ±${nf(p.r * Math.sqrt(3) / 3)}.`;
        en += `f''(x) = ${fac2} = 0 → 3x² = ${p.r * p.r} → x² = ${frS(fr(p.r * p.r, 3))} → x = ±${b} ≈ ±${nf(p.r * Math.sqrt(3) / 3)}.`;
      } else if (p.kind === 'quart0') {
        if (p.b === 0) {
          tr += `f''(x) = ${f2} = 0 → x = 0 (ÇİFT katlı kök: x² çarpanı).`;
          en += `f''(x) = ${f2} = 0 → x = 0 (a DOUBLE root: factor x²).`;
        } else {
          tr += `f''(x) = ${f2} = 0 denkleminin reel kökü yok (x² ≥ 0 olduğundan ${S(12 * p.a)}x² ile ${S(2 * p.b)} aynı işaretlidir).\nf'' her yerde tanımlı → aday yok.`;
          en += `f''(x) = ${f2} = 0 has no real root (since x² ≥ 0, ${S(12 * p.a)}x² and ${S(2 * p.b)} have the same sign).\nf'' is defined everywhere → no candidates.`;
        }
      } else if (p.kind === 'rat') {
        tr += `f''(x) = ${f2} hiçbir x için 0 olamaz (pay sabit).\nf'' x = 0'da tanımsız, ama f(0) de tanımsız: x = 0 bir aday gibi görünür fakat tanım kümesinde değildir.`;
        en += `f''(x) = ${f2} can never be 0 (constant numerator).\nf'' is undefined at x = 0, but f(0) is also undefined: x = 0 looks like a candidate but is not in the domain.`;
      } else if (p.kind === 'sin') {
        tr += `f''(x) = ${f2} = 0 → sin x = 0 → x = kπ. (0, 2π) içinde yalnızca x = π.`;
        en += `f''(x) = ${f2} = 0 → sin x = 0 → x = kπ. Inside (0, 2π) only x = π.`;
      } else if (p.kind === 'cbrt') {
        tr += `f''(x) = ${f2} hiçbir x için 0 olamaz.\nf'' x = ${S(p.p)}'de TANIMSIZ, fakat f(${S(p.p)}) = ${S(p.d)} tanımlı ve f süreklidir → aday: x = ${S(p.p)}.`;
        en += `f''(x) = ${f2} can never be 0.\nf'' is UNDEFINED at x = ${S(p.p)}, but f(${S(p.p)}) = ${S(p.d)} is defined and f is continuous → candidate: x = ${S(p.p)}.`;
      } else {
        tr += `f''(x) = ${f2} = 0 denkleminin çözümü yok (eˣ > 0 her zaman).\nf'' her yerde tanımlı → aday yok.`;
        en += `f''(x) = ${f2} = 0 has no solution (eˣ > 0 always).\nf'' is defined everywhere → no candidates.`;
      }
      st.push(Tx(tr, en));
    }

    // 3) sign chart
    {
      let tr = '── 3) f\'\' işaret tablosu ──\n', en = '── 3) Sign chart of f\'\' ──\n';
      rows.forEach((r) => {
        const conc = r.s > 0;
        tr += `(${r.l}, ${r.r}):  f''(${r.t}) = ${r.v} → f'' ${sgnStr(r.s)} → ${conc ? 'YUKARI BÜKEY ∪' : 'AŞAĞI BÜKEY ∩'}\n`;
        en += `(${r.l}, ${r.r}):  f''(${r.t}) = ${r.v} → f'' ${sgnStr(r.s)} → ${conc ? 'CONCAVE UP ∪' : 'CONCAVE DOWN ∩'}\n`;
      });
      st.push(Tx(tr.trim(), en.trim()));
    }

    // 4) inflection points
    {
      let tr = '── 4) Büküm noktaları ──\n', en = '── 4) Inflection points ──\n';
      if (inf.length === 0) {
        tr += 'f\'\' hiçbir yerde işaret değiştirmiyor (tek işaretli) → BÜKÜM NOKTASI YOK. Fonksiyon tüm tanım kümesinde ' + (rows[0].s > 0 ? 'yukarı' : 'aşağı') + ' bükeydir.';
        en += 'f\'\' never changes sign (one sign only) → NO INFLECTION POINT. The function is concave ' + (rows[0].s > 0 ? 'up' : 'down') + ' on its whole domain.';
      }
      inf.forEach((q) => {
        const x = q.c.str;
        if (q.c.type === 'hole') {
          tr += `x = 0: f'' işaret değiştiriyor (${sgnStr(q.before)} → ${sgnStr(q.after)}) fakat f(0) TANIMSIZ (dikey asimptot) → BÜKÜM NOKTASI DEĞİL.\n`;
          en += `x = 0: f'' changes sign (${sgnStr(q.before)} → ${sgnStr(q.after)}) but f(0) is UNDEFINED (vertical asymptote) → NOT an inflection point.\n`;
        } else if (q.change) {
          tr += `x = ${x}: f'' işareti ${sgnStr(q.before)} → ${sgnStr(q.after)} değişiyor → BÜKÜM NOKTASI${q.c.type === 'undef' ? " (f'' tanımsız ama f sürekli; dikey teğet)" : ''}. y = f(${x}) = ${q.y.str}  →  (${x}, ${q.y.str}).\n`;
          en += `x = ${x}: f'' changes sign ${sgnStr(q.before)} → ${sgnStr(q.after)} → INFLECTION POINT${q.c.type === 'undef' ? " (f'' undefined but f continuous; vertical tangent)" : ''}. y = f(${x}) = ${q.y.str}  →  (${x}, ${q.y.str}).\n`;
        } else {
          tr += `x = ${x}: f''(${x}) = 0 ama işaret DEĞİŞMİYOR (${sgnStr(q.before)} → ${sgnStr(q.after)}) → BÜKÜM NOKTASI DEĞİL (bükeylik aynı kalır).\n`;
          en += `x = ${x}: f''(${x}) = 0 but the sign does NOT change (${sgnStr(q.before)} → ${sgnStr(q.after)}) → NOT an inflection point (same concavity on both sides).\n`;
        }
      });
      st.push(Tx(tr.trim(), en.trim()));
    }

    // 5) second derivative test
    {
      let tr = '── 5) İkinci Türev Testi ──\n', en = '── 5) Second Derivative Test ──\n';
      if (cr.mode === 'skip') {
        tr += `Bu soruda kritik noktalar istenmiyor (f' = ${f1} kübik bir polinomdur). İsterseniz f'(c) = 0 noktalarında f''(c) işaretine bakarak yerel max / min ayrımı yapabilirsiniz.`;
        en += `Critical points are not asked here (f' = ${f1} is a cubic polynomial). If you want them, check the sign of f''(c) at each f'(c) = 0 to tell local max from local min.`;
      } else if (cr.mode === 'none') {
        tr += `f'(x) = ${f1} hiçbir yerde 0 değildir${p.kind === 'cubic' ? ` (f' ${p.a > 0 ? '> 0' : '< 0'}, f ${p.a > 0 ? 'artan' : 'azalan'})` : ''} → kritik nokta yok, test uygulanacak nokta yok; yerel ekstremum da yok.`;
        en += `f'(x) = ${f1} is never 0${p.kind === 'cubic' ? ` (f' ${p.a > 0 ? '> 0' : '< 0'}, so f is ${p.a > 0 ? 'increasing' : 'decreasing'})` : ''} → no critical points, nothing to test; no local extrema either.`;
      } else if (cr.mode === 'undef') {
        tr += `f'(x) x = ${S(p.p)}'de tanımsız (f' = 0 olan nokta yok): kritik nokta var ama İkinci Türev Testi f'(c) = 0 ister → burada UYGULANAMAZ. Birinci türev işaretine bakın: f' ${p.ka > 0 ? '> 0' : '< 0'} her iki yanda (f hep ${p.ka > 0 ? 'artan' : 'azalan'}) → ekstremum yok, yalnızca dikey teğetli büküm.`;
        en += `f'(x) is undefined at x = ${S(p.p)} (no point has f' = 0): it is a critical point, but the Second Derivative Test needs f'(c) = 0 → NOT applicable here. Check the sign of f': f' ${p.ka > 0 ? '> 0' : '< 0'} on both sides (f always ${p.ka > 0 ? 'increasing' : 'decreasing'}) → no extremum, only an inflection with a vertical tangent.`;
      } else {
        const d1 = d1Fac(p);
        tr += `f'(x) = ${d1 ? d1 + ' = ' : ''}0 → kritik noktalar: ${cr.items.map((q) => 'x = ' + q.str).join(', ')}.\n`;
        en += `f'(x) = ${d1 ? d1 + ' = ' : ''}0 → critical points: ${cr.items.map((q) => 'x = ' + q.str).join(', ')}.\n`;
        cr.items.forEach((q) => {
          if (q.verdict === 'inconclusive') {
            tr += `x = ${q.str}: f''(${q.str}) = 0 → TEST SONUÇSUZ. Birinci türev testine dön: ${p.kind === 'cubic' ? "f' = " + d1 + " işaret değiştirmiyor → ekstremum YOK (düz teğetli büküm)" : "f' işareti " + (p.a > 0 ? "− → +" : "+ → −") + " → yerel " + (p.a > 0 ? 'MİNİMUM' : 'MAKSİMUM') + ", f = " + q.y.str}.\n`;
            en += `x = ${q.str}: f''(${q.str}) = 0 → TEST INCONCLUSIVE. Go back to the first derivative test: ${p.kind === 'cubic' ? "f' = " + d1 + " does not change sign → NO extremum (an inflection with a horizontal tangent)" : "f' changes " + (p.a > 0 ? "− → +" : "+ → −") + " → local " + (p.a > 0 ? 'MINIMUM' : 'MAXIMUM') + ", f = " + q.y.str}.\n`;
          } else {
            const isMax = q.verdict === 'max';
            tr += `x = ${q.str}: f''(${q.str}) = ${q.f2str} ${q.f2s < 0 ? '< 0' : '> 0'} → yerel ${isMax ? 'MAKSİMUM' : 'MİNİMUM'}, f(${q.str}) = ${q.y.str}.\n`;
            en += `x = ${q.str}: f''(${q.str}) = ${q.f2str} ${q.f2s < 0 ? '< 0' : '> 0'} → local ${isMax ? 'MAXIMUM' : 'MINIMUM'}, f(${q.str}) = ${q.y.str}.\n`;
          }
        });
      }
      st.push(Tx(tr.trim(), en.trim()));
    }

    // 6) summary
    {
      const cu = [], cd = [];
      rows.forEach((r) => { (r.s > 0 ? cu : cd).push(`(${r.l}, ${r.r})`); });
      const il = inf.filter((q) => q.change);
      const tIl = il.length ? il.map((q) => `(${q.c.str}, ${q.y.str})`).join(', ') : 'yok';
      const eIl = il.length ? il.map((q) => `(${q.c.str}, ${q.y.str})`).join(', ') : 'none';
      st.push(Tx(
        `── 6) Sonuç ──\nYukarı bükey (f'' > 0): ${cu.join(' ∪ ') || '—'}\nAşağı bükey (f'' < 0): ${cd.join(' ∪ ') || '—'}\nBüküm noktaları: ${tIl}.\nHatırlatma: Büküm = f'' İŞARET DEĞİŞTİRİR; f'' = 0 yetmez.`,
        `── 6) Result ──\nConcave up (f'' > 0): ${cu.join(' ∪ ') || '—'}\nConcave down (f'' < 0): ${cd.join(' ∪ ') || '—'}\nInflection points: ${eIl}.\nReminder: inflection = f'' CHANGES SIGN; f'' = 0 is not enough.`));
    }
    return st;
  }

  // ---------- drawing ----------
  function yRange(p) {
    if (p.kind === 'rat') return [-6, 6];
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const y = fNum(p, p.xl + (p.xh - p.xl) * i / 200);
      if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = -5; hi = 5; }
    const pad = Math.max(1, (hi - lo) * 0.15);
    return [lo - pad, hi + pad];
  }

  function draw(canvas, p) {
    try {
      const [yl, yh] = yRange(p);
      let ylo = yl, yhi = yh;
      if (p.showD2) { const sp = yhi - ylo; ylo = Math.min(ylo, -0.1 * sp); yhi = Math.max(yhi, 0.1 * sp); }
      canvas.setViewport(p.xl, p.xh, ylo, yhi);
      const rows = rowsOf(p), cand = candidates(p);
      // concavity regions
      const lo0 = p.kind === 'sin' ? 0 : p.xl, hi0 = p.kind === 'sin' ? 2 * PI : p.xh;
      const bounds = [lo0].concat(cand.map((c) => c.x).filter((x) => x > lo0 && x < hi0), [hi0]);
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1];
        if (b - a < 1e-9) continue;
        let s = f2Num(p, (a + b) / 2);
        if (!isFinite(s)) continue;
        canvas.addRegion({ xMin: a, xMax: b, color: canvas._withAlpha(s > 0 ? canvas.blue() : canvas.orange(), 0.16) });
      }
      if (p.kind === 'sin') { canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.gray(), label: '0' }); canvas.addGuideLine({ axis: 'vertical', position: 2 * PI, color: canvas.gray(), label: '2π' }); }
      canvas.addFunction({ evaluator: (x) => fNum(p, x), color: canvas.accent(), thickness: 3, label: 'f(x)' });
      if (p.showD2) canvas.addFunction({ evaluator: (x) => f2Num(p, x), color: canvas.purple(), thickness: 2, dashed: true, label: "f''(x)" });
      // inflection candidates
      inflections(p).forEach((q) => {
        const c = q.c;
        if (c.type === 'hole') { canvas.addGuideLine({ axis: 'vertical', position: 0, color: canvas.red(), label: Tx('x = 0 (f tanımsız)', 'x = 0 (f not defined)') }); return; }
        canvas.addMarker({ x: c.x, y: q.y.num, color: canvas.gold(), shape: q.change ? 'diamond' : 'circle', radius: 8, hollow: !q.change, label: q.change ? Tx('büküm', 'inflection') + ` (${nf(c.x)}, ${nf(q.y.num)})` : Tx('büküm DEĞİL', 'not an inflection') + ` (${nf(c.x)})` });
      });
      // second derivative test
      const cr = crits(p);
      if (cr.mode === 'list') {
        cr.items.forEach((q) => {
          if (q.verdict === 'inconclusive') return;
          canvas.addMarker({ x: q.x, y: q.y.num, color: q.verdict === 'max' ? canvas.green() : canvas.red(), shape: 'circle', radius: 6, label: (q.verdict === 'max' ? Tx('yerel maks', 'local max') : Tx('yerel min', 'local min')) + ` (${nf(q.x)}, ${nf(q.y.num)})` });
        });
      }
      // moving point with tangent
      const x0 = Math.max(p.xl, Math.min(p.xh, p.x0)), y0 = fNum(p, x0), s0 = fpNum(p, x0), c0 = f2Num(p, x0);
      if (isFinite(y0)) {
        const label = `x = ${nf(x0)}: f'' = ${isFinite(c0) ? nf(c0) : '—'} → ${isFinite(c0) ? (Math.abs(c0) < 1e-9 ? Tx('düz', 'flat') : c0 > 0 ? Tx('yukarı bükey ∪', 'concave up ∪') : Tx('aşağı bükey ∩', 'concave down ∩')) : Tx('f\'\' yok', "f'' n/a")}`;
        if (isFinite(s0)) {
          const hw = (p.xh - p.xl) * 0.12;
          canvas.addSegment({ x1: x0 - hw, y1: y0 - s0 * hw, x2: x0 + hw, y2: y0 + s0 * hw, color: canvas.orange(), thickness: 2, dashed: true });
        }
        canvas.addMarker({ x: x0, y: y0, color: canvas.orange(), radius: 6, label });
        if (p.showD2 && isFinite(c0)) canvas.addMarker({ x: x0, y: c0, color: canvas.purple(), radius: 5, label: '' });
      }
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    h.addSlider({
      caption: Tx('Nokta konumu x (teğetin eğriye göre durumu)', 'Point position x (tangent relative to the curve)'),
      min: -8, max: 8, step: 0.1,
      get: () => { const p = getProblem(); return Math.max(p.xl, Math.min(p.xh, p.x0)); },
      set: (v) => { const p = getProblem(); p.x0 = Math.max(p.xl, Math.min(p.xh, v)); },
    });
    h.addCheckbox({
      caption: Tx('f\'\' grafiğini göster (mor, kesikli)', "Show the f'' graph (purple, dashed)"),
      get: () => getProblem().showD2,
      set: (v) => { getProblem().showD2 = !!v; },
    });
  }

  Topics.register('applications', {
    id: 'concavityInflection',
    tabTitle: () => Tx('Konkavlık ve Büküm Noktaları', 'Concavity & Inflection Points'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*• f''\(x\) > 0 →/, make: (rng) => createProblem(rng, 'exp', 1) },
      { match: /^\s*• f''\(x\) < 0 →/, make: (rng) => createProblem(rng, 'exp', -1) },
      { match: /^\s*• (BÜKÜM NOKTASI|INFLECTION POINT):/, make: (rng) => createProblem(rng, 'quartTwo') },
      { match: /^\s*(İKİNCİ TÜREV TESTİ|SECOND DERIVATIVE TEST)/, make: (rng) => createProblem(rng, 'quartW') },
      { match: /^\s*• f''\(x₀\) = 0 (ama|but)/, make: (rng) => createProblem(rng, 'quart0') },
      { match: /^\s*• f'' (tanımsız|undefined)/, make: (rng) => createProblem(rng, 'cbrt') },
      { match: /^\s*• f = 1\/x/, make: (rng) => createProblem(rng, 'rat') },
      { match: /^\s*• f = eˣ/, make: (rng) => createProblem(rng, 'exp') },
      { match: /^\s*• (Kübik|A cubic)/, make: (rng) => createProblem(rng, 'cubic') },
    ],
  });
})();
