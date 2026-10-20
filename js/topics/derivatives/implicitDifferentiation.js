// Implicit Differentiation (chapter 'derivatives'). Ported from Modules/Derivatives/ImplicitDifferentiationControl.vb
// (circle / ellipse / hyperbola traced by a moving point, implicit-formula tangent vs. numeric tangent from two nearby
// curve points) and extended to worked examples with an integer point on the curve.
// Every curve is G(x,y) = 0 with partial derivatives Gx, Gy:  Gx + Gy*y' = 0  =>  y' = -Gx/Gy.
// problem.kind: circle | ellipse | cubic | hyper | xyk | mixed | tilt | elliptic | quartic | sin | exy | vb
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  const N = (v) => M(fmt2(v));
  const S = (n) => M(String(n === 0 ? 0 : n));
  const P = (s) => { s = String(s); return (s[0] === '−' || s[0] === '-') ? '(' + s + ')' : s; };
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 4 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
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
  const frAdd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
  const frMul = (a, b) => fr(a.n * b.n, a.d * b.d);
  const frNeg = (a) => fr(-a.n, a.d);
  function lineS(m, c) { // y = m x + c with fractions
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
  const sub = (v, h) => (h === 0 ? v : h > 0 ? `${v} − ${h}` : `${v} + ${-h}`);
  const par = (v, h) => (h === 0 ? v : `(${sub(v, h)})`);
  const sq = (v, h) => (h === 0 ? v + '²' : `(${sub(v, h)})²`);
  const negStr = (s) => {
    if (s.startsWith('−(') && s.endsWith(')') && s.indexOf(')') === s.length - 1) return s.slice(2, -1);
    const compound = / [+−] /.test(s);
    if (s[0] === '−' && !compound) return s.slice(1);
    return compound ? '−(' + s + ')' : '−' + s;
  };
  const Pf = (f) => (f.d > 1 || f.n < 0 ? '(' + frS(f) + ')' : frS(f));
  const xm = (v) => (v === 0 ? 'x' : v > 0 ? `x − ${v}` : `x + ${-v}`);
  const ymm = (v) => (v === 0 ? 'y' : v > 0 ? `y − ${v}` : `y + ${-v}`);
  const cf = (a) => (a === 1 ? '' : a === -1 ? '−' : S(a));
  const cfd = (a) => (a === 1 ? '' : a === -1 ? '−' : S(a) + '·');

  const ctl = { rows: [], sel: null, label: null, boxes: [] };
  let resizeHandler = null;

  // ---------------- VB examples ----------------
  const VB = [
    { name: () => Tx('Çember: x² + y² = 9', 'Circle: x² + y² = 9'), eq: 'x² + y² = 9', xt: (t) => 3 * Math.cos(t), yt: (t) => 3 * Math.sin(t), tMin: 0.001, tMax: 2 * Math.PI - 0.001, slope: (x, y) => -x / y, vp: 4,
      deriv: () => Tx("Her iki tarafın x'e göre türevini alırız: 2x + 2y·(dy/dx) = 0, dolayısıyla dy/dx = −x/y.", 'We differentiate both sides with respect to x: 2x + 2y·(dy/dx) = 0, so dy/dx = −x/y.'), ySym: "y' = −x/y" },
    { name: () => Tx('Elips: x²/16 + y²/4 = 1', 'Ellipse: x²/16 + y²/4 = 1'), eq: 'x²/16 + y²/4 = 1', xt: (t) => 4 * Math.cos(t), yt: (t) => 2 * Math.sin(t), tMin: 0.001, tMax: 2 * Math.PI - 0.001, slope: (x, y) => -(4 * x) / (16 * y), vp: 5,
      deriv: () => Tx('Her iki tarafın türevini alırız: (2x/16) + (2y/4)·(dy/dx) = 0, dolayısıyla dy/dx = −(4x)/(16y).', 'We differentiate both sides: (2x/16) + (2y/4)·(dy/dx) = 0, so dy/dx = −(4x)/(16y).'), ySym: "y' = −(4x)/(16y) = −x/(4y)" },
    { name: () => Tx('Hiperbol: xy = 6', 'Hyperbola: xy = 6'), eq: 'xy = 6', xt: (t) => t, yt: (t) => 6 / t, tMin: 0.6, tMax: 6, slope: (x, y) => -y / x, vp: 8,
      deriv: () => Tx('Çarpım kuralıyla her iki tarafın türevini alırız: x·(dy/dx) + y = 0, dolayısıyla dy/dx = −y/x.', 'We differentiate both sides using the product rule: x·(dy/dx) + y = 0, so dy/dx = −y/x.'), ySym: "y' = −y/x" },
  ];

  // ---------------- curve definitions ----------------
  const TRIPLES = [[3, 4], [4, 3], [0, 5], [5, 0], [6, 8], [8, 6], [5, 12], [12, 5], [1, 0], [0, 2], [2, 0], [0, 3], [3, 0], [0, 1], [4, 0]];

  const AXIS_TRIPLES = [[1, 0], [0, 2], [2, 0], [0, 3], [3, 0], [0, 1], [4, 0], [0, 5], [5, 0]];
  function createProblem(rng) {
    const kinds = ['circle', 'circle', 'ellipse', 'cubic', 'hyper', 'xyk', 'mixed', 'tilt', 'elliptic', 'quartic', 'sin', 'exy', 'vb'];
    return genKind(rng, rng.pick(kinds));
  }
  function genKind(rng, kind, opt) {
    opt = opt || {};
    const p = { kind, showTan: true, showNormal: false, showNumeric: true };
    switch (kind) {
      case 'circle': {
        const t = rng.pick(opt.axis ? AXIS_TRIPLES : TRIPLES);
        p.h = rng.nextInt(-2, 3); p.k = rng.nextInt(-2, 3);
        p.dx = t[0] * rng.pick([1, -1]); p.dy = t[1] * rng.pick([1, -1]);
        if (rng.nextInt(0, 2) === 0) { const q = p.dx; p.dx = p.dy; p.dy = q; }
        p.r2 = p.dx * p.dx + p.dy * p.dy;
        p.r = Math.round(Math.sqrt(p.r2));
        p.x0 = p.h + p.dx; p.y0 = p.k + p.dy;
        break;
      }
      case 'ellipse': {
        p.a = rng.pick([1, 2, 3, 4, 5]); p.b = rng.pick([1, 2, 3, 4, 5]);
        if (p.a === p.b) p.b = p.a === 5 ? 3 : p.a + 1;
        p.x0 = rng.nonZeroInt(-3, 3); p.y0 = rng.nonZeroInt(-3, 3);
        p.c = p.a * p.x0 * p.x0 + p.b * p.y0 * p.y0;
        break;
      }
      case 'cubic':
        do { p.x0 = rng.nextInt(-3, 4); p.y0 = rng.nonZeroInt(-3, 3); } while (p.x0 * p.x0 === 0 && false);
        p.c = p.x0 * p.x0 * p.x0 + p.y0 * p.y0 * p.y0;
        break;
      case 'hyper':
        p.x0 = rng.nonZeroInt(-4, 4); p.y0 = rng.nonZeroInt(-4, 4);
        if (Math.abs(p.x0) === Math.abs(p.y0)) p.y0 = p.y0 > 0 ? p.y0 + 1 : p.y0 - 1;
        p.c = p.x0 * p.x0 - p.y0 * p.y0;
        break;
      case 'xyk':
        p.x0 = rng.nonZeroInt(-4, 4); p.y0 = rng.nonZeroInt(-4, 4);
        p.c = p.x0 * p.y0;
        break;
      case 'mixed': {
        let tries = 0;
        do {
          p.x0 = rng.nonZeroInt(-3, 3); p.y0 = rng.nonZeroInt(-3, 3);
        } while (p.x0 * p.x0 + 2 * p.x0 * p.y0 === 0 && tries++ < 50);
        if (p.x0 * p.x0 + 2 * p.x0 * p.y0 === 0) { p.x0 = 1; p.y0 = 1; }
        p.c = p.x0 * p.x0 * p.y0 + p.x0 * p.y0 * p.y0;
        break;
      }
      case 'tilt': {
        let tries = 0;
        do {
          p.x0 = rng.nextInt(-3, 4); p.y0 = rng.nextInt(-3, 4);
        } while ((p.x0 + 2 * p.y0 === 0 || (p.x0 === 0 && p.y0 === 0)) && tries++ < 50);
        if (p.x0 + 2 * p.y0 === 0) { p.x0 = 1; p.y0 = 1; }
        p.c = p.x0 * p.x0 + p.x0 * p.y0 + p.y0 * p.y0;
        break;
      }
      case 'elliptic': {
        let tries = 0;
        do {
          p.x0 = rng.nextInt(-2, 4); p.y0 = rng.nonZeroInt(-3, 3); p.a = rng.nextInt(-3, 3);
          p.b = p.y0 * p.y0 - p.x0 * p.x0 * p.x0 - p.a * p.x0;
        } while ((4 * p.a * p.a * p.a + 27 * p.b * p.b === 0 || Math.abs(p.b) > 12) && tries++ < 200);
        if (4 * p.a * p.a * p.a + 27 * p.b * p.b === 0 || Math.abs(p.b) > 12) { p.x0 = 2; p.y0 = 3; p.a = 0; p.b = 1; }
        break;
      }
      case 'quartic':
        p.x0 = rng.nonZeroInt(-2, 2); p.y0 = rng.nonZeroInt(-2, 2);
        p.c = Math.pow(p.x0, 4) + Math.pow(p.y0, 4);
        break;
      case 'sin':
        p.a = rng.pick([1, 2, 3]); p.x0 = rng.nonZeroInt(-3, 3); p.y0 = 0; p.c = p.x0 * p.x0;
        break;
      case 'exy':
        p.x0 = rng.pick([1, 2, 3, 4, -1, -2, -3]); p.y0 = 0; p.c = p.x0;
        break;
      case 'lny':
        p.a = rng.pick([1, 2, 3]); p.x0 = rng.nonZeroInt(-3, 3); p.y0 = 1; p.c = p.x0 * p.x0;
        break;
      default: // vb
        p.idx = rng.nextInt(0, 3); p.s = rng.pick([0.15, 0.3, 0.45, 0.6, 0.8]);
    }
    applyVisibility(p);
    return p;
  }

  // ---------------- model ----------------
  // returns { eq, check, d1, rule, gxS, gyS, ySym, G, Gx, Gy, gx0, gy0, x0, y0, draw:{type,...}, R, cx, cy }
  function build(p) {
    const x0 = p.x0, y0 = p.y0;
    switch (p.kind) {
      case 'circle': {
        const { h, k, r2, r } = p;
        return {
          eq: `${sq('x', h)} + ${sq('y', k)} = ${r2}`,
          check: `(${S(x0)}${h === 0 ? '' : (h > 0 ? ' − ' + h : ' + ' + (-h))})² + (${S(y0)}${k === 0 ? '' : (k > 0 ? ' − ' + k : ' + ' + (-k))})² = ${P(S(p.dx))}² + ${P(S(p.dy))}² = ${r2} ✓`,
          d1: `2${par('x', h)} + 2${par('y', k)}·y' = 0`, rule: 'chain',
          gxS: `2${par('x', h)}`, gyS: `2${par('y', k)}`, ySym: `y' = −${par('x', h)} / ${par('y', k)}`,
          G: (x, y) => (x - h) * (x - h) + (y - k) * (y - k) - r2, Gx: (x) => 2 * (x - h), Gy: (x, y) => 2 * (y - k),
          draw: { type: 'param', xt: (t) => h + r * Math.cos(t), yt: (t) => k + r * Math.sin(t), t0: 0, t1: 2 * Math.PI },
          cx: h, cy: k, R: r * 1.4 + 0.8,
        };
      }
      case 'ellipse': {
        const { a, b, c } = p;
        const sa = Math.sqrt(c / a), sb = Math.sqrt(c / b);
        return {
          eq: `${cf(a)}x² + ${cf(b)}y² = ${c}`,
          check: `${cfd(a)}(${S(x0)})² + ${cfd(b)}(${S(y0)})² = ${a * x0 * x0} + ${b * y0 * y0} = ${c} ✓`,
          d1: `${S(2 * a)}x + ${S(2 * b)}y·y' = 0`, rule: 'chain',
          gxS: `${S(2 * a)}x`, gyS: `${S(2 * b)}y`, ySym: `y' = −${cf(a)}x / (${cf(b)}y)`,
          G: (x, y) => a * x * x + b * y * y - c, Gx: (x) => 2 * a * x, Gy: (x, y) => 2 * b * y,
          draw: { type: 'param', xt: (t) => sa * Math.cos(t), yt: (t) => sb * Math.sin(t), t0: 0, t1: 2 * Math.PI },
          cx: 0, cy: 0, R: Math.max(sa, sb) * 1.25 + 0.5,
        };
      }
      case 'cubic': {
        const c = p.c;
        return {
          eq: `x³ + y³ = ${c}`,
          check: `${P(S(x0))}³ + ${P(S(y0))}³ = ${S(x0 * x0 * x0)} + ${P(S(y0 * y0 * y0))} = ${c} ✓`,
          d1: `3x² + 3y²·y' = 0`, rule: 'chain', gxS: '3x²', gyS: '3y²', ySym: `y' = −x² / y²`,
          G: (x, y) => x * x * x + y * y * y - c, Gx: (x) => 3 * x * x, Gy: (x, y) => 3 * y * y,
          draw: { type: 'func', fns: [(x) => Math.cbrt(c - x * x * x)] }, cx: x0 * 0.5, cy: y0 * 0.5, R: 5.5,
        };
      }
      case 'hyper': {
        const c = p.c;
        return {
          eq: `x² − y² = ${c}`,
          check: `${P(S(x0))}² − ${P(S(y0))}² = ${x0 * x0} − ${y0 * y0} = ${c} ✓`,
          d1: `2x − 2y·y' = 0`, rule: 'chain', gxS: '2x', gyS: '−2y', ySym: `y' = x / y`,
          G: (x, y) => x * x - y * y - c, Gx: (x) => 2 * x, Gy: (x, y) => -2 * y,
          draw: { type: 'contour' }, cx: 0, cy: 0, R: Math.max(Math.abs(x0), Math.abs(y0)) * 1.3 + 2,
        };
      }
      case 'xyk': {
        const c = p.c;
        return {
          eq: `xy = ${c}`,
          check: `${P(S(x0))}·${P(S(y0))} = ${c} ✓`,
          d1: `y + x·y' = 0`, rule: 'product', gxS: 'y', gyS: 'x', ySym: `y' = −y / x`,
          G: (x, y) => x * y - c, Gx: (x, y) => y, Gy: (x) => x,
          draw: { type: 'func', fns: [(x) => (Math.abs(x) < 1e-9 ? NaN : c / x)] }, cx: 0, cy: 0, R: Math.max(Math.abs(x0), Math.abs(y0)) * 1.4 + 2,
        };
      }
      case 'mixed': {
        const c = p.c;
        return {
          eq: `x²y + xy² = ${c}`,
          check: `${P(S(x0))}²·${P(S(y0))} + ${P(S(x0))}·${P(S(y0))}² = ${x0 * x0 * y0} + ${P(S(x0 * y0 * y0))} = ${c} ✓`,
          d1: `2xy + x²·y' + y² + 2xy·y' = 0`, rule: 'product', gxS: '2xy + y²', gyS: 'x² + 2xy', ySym: `y' = −(2xy + y²) / (x² + 2xy)`,
          G: (x, y) => x * x * y + x * y * y - c, Gx: (x, y) => 2 * x * y + y * y, Gy: (x, y) => x * x + 2 * x * y,
          draw: { type: 'contour' }, cx: x0 * 0.4, cy: y0 * 0.4, R: 5,
        };
      }
      case 'tilt': {
        const c = p.c;
        return {
          eq: `x² + xy + y² = ${c}`,
          check: `${P(S(x0))}² + ${P(S(x0))}·${P(S(y0))} + ${P(S(y0))}² = ${x0 * x0} + ${P(S(x0 * y0))} + ${y0 * y0} = ${c} ✓`,
          d1: `2x + y + x·y' + 2y·y' = 0`, rule: 'product', gxS: '2x + y', gyS: 'x + 2y', ySym: `y' = −(2x + y) / (x + 2y)`,
          G: (x, y) => x * x + x * y + y * y - c, Gx: (x, y) => 2 * x + y, Gy: (x, y) => x + 2 * y,
          draw: { type: 'contour' }, cx: 0, cy: 0, R: Math.sqrt(4 * c / 3) * 1.35 + 1,
        };
      }
      case 'elliptic': {
        const { a, b } = p;
        const cub = (x) => x * x * x + a * x + b;
        const rhs = `x³${a === 0 ? '' : (a < 0 ? ' − ' + (-a === 1 ? '' : -a) : ' + ' + (a === 1 ? '' : a)) + 'x'}${b === 0 ? '' : (b < 0 ? ' − ' + (-b) : ' + ' + b)}`;
        return {
          eq: `y² = ${rhs}`,
          check: `y₀² = ${P(S(y0))}² = ${y0 * y0};  x₀³${a === 0 ? '' : ` ${a < 0 ? '−' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a) + '·'}${P(S(x0))}`}${b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}`} = ${S(cub(x0))}  ⇒  ${y0 * y0} = ${S(cub(x0))} ✓`,
          d1: `2y·y' = 3x² ${a < 0 ? '− ' + (-a) : '+ ' + a}`.replace('+ 0', '').trim(), rule: 'chain', gxS: `−(3x² ${a < 0 ? '− ' + (-a) : '+ ' + a})`.replace(' + 0', ''), gyS: '2y', ySym: `y' = (3x² ${a < 0 ? '− ' + (-a) : '+ ' + a}) / (2y)`.replace(' + 0', ''),
          G: (x, y) => y * y - cub(x), Gx: (x) => -(3 * x * x + a), Gy: (x, y) => 2 * y,
          draw: { type: 'func', fns: [(x) => { const v = cub(x); return v < 0 ? NaN : Math.sqrt(v); }, (x) => { const v = cub(x); return v < 0 ? NaN : -Math.sqrt(v); }] },
          cx: x0 * 0.4, cy: 0, R: 5.5,
        };
      }
      case 'quartic': {
        const c = p.c;
        return {
          eq: `x⁴ + y⁴ = ${c}`,
          check: `${P(S(x0))}⁴ + ${P(S(y0))}⁴ = ${Math.pow(x0, 4)} + ${Math.pow(y0, 4)} = ${c} ✓`,
          d1: `4x³ + 4y³·y' = 0`, rule: 'chain', gxS: '4x³', gyS: '4y³', ySym: `y' = −x³ / y³`,
          G: (x, y) => Math.pow(x, 4) + Math.pow(y, 4) - c, Gx: (x) => 4 * x * x * x, Gy: (x, y) => 4 * y * y * y,
          draw: { type: 'func', fns: [(x) => { const v = c - Math.pow(x, 4); return v < 0 ? NaN : Math.pow(v, 0.25); }, (x) => { const v = c - Math.pow(x, 4); return v < 0 ? NaN : -Math.pow(v, 0.25); }] },
          cx: 0, cy: 0, R: Math.pow(c, 0.25) * 1.4 + 0.8,
        };
      }
      case 'sin': {
        const { a, c } = p;
        return {
          eq: `x² + ${cf(a)}sin y = ${c}`,
          check: `${P(S(x0))}² + ${cfd(a)}sin 0 = ${x0 * x0} + 0 = ${c} ✓`,
          d1: `2x + ${cfd(a)}cos y·y' = 0`, rule: 'chain', gxS: '2x', gyS: `${cf(a)}cos y`, ySym: `y' = −2x / (${cf(a)}cos y)`,
          G: (x, y) => x * x + a * Math.sin(y) - c, Gx: (x) => 2 * x, Gy: (x, y) => a * Math.cos(y),
          draw: { type: 'contour' }, cx: 0, cy: 0, R: 5,
        };
      }
      case 'exy': {
        const c = p.c;
        return {
          eq: `x·e^y = ${c}`,
          check: `${P(S(x0))}·e^0 = ${P(S(x0))}·1 = ${c} ✓`,
          d1: `e^y + x·e^y·y' = 0`, rule: 'product', gxS: 'e^y', gyS: 'x·e^y', ySym: `y' = −e^y / (x·e^y) = −1/x`,
          G: (x, y) => x * Math.exp(y) - c, Gx: (x, y) => Math.exp(y), Gy: (x, y) => x * Math.exp(y),
          draw: { type: 'func', fns: [(x) => (Math.abs(x) < 1e-9 || c / x <= 0 ? NaN : Math.log(c / x))] }, cx: 0, cy: 0, R: 5,
        };
      }
      case 'lny': {
        const { a, c } = p;
        return {
          eq: `x² + ${cf(a)}ln y = ${c}`,
          check: `${P(S(x0))}² + ${cfd(a)}ln 1 = ${x0 * x0} + 0 = ${c} ✓`,
          d1: `2x + ${a}·(1/y)·y' = 0`, rule: 'chain', gxS: '2x', gyS: `${a}/y`, ySym: `y' = −2x / (${a}/y) = −${a === 1 ? '2xy' : '2xy/' + a}`,
          G: (x, y) => (y > 0 ? x * x + a * Math.log(y) - c : NaN), Gx: (x) => 2 * x, Gy: (x, y) => a / y,
          draw: { type: 'func', fns: [(x) => Math.exp((c - x * x) / a)] }, cx: 0, cy: 0, R: 5,
        };
      }
      default: return buildVb(p);
    }
  }
  function buildVb(p) {
    const e = VB[p.idx];
    const t = e.tMin + p.s * (e.tMax - e.tMin);
    const x = e.xt(t), y = e.yt(t);
    return {
      eq: e.eq, vb: true, e, t,
      G: null, x0: x, y0: y,
      draw: { type: 'param', xt: e.xt, yt: e.yt, t0: e.tMin, t1: e.tMax },
      cx: 0, cy: 0, R: e.vp * 0.75, ySym: e.ySym,
    };
  }

  // exact quantities for the integer-point kinds
  function exact(p, m) {
    const gx0 = m.Gx(p.x0, p.y0), gy0 = m.Gy(p.x0, p.y0);
    let slope = null;
    if (gy0 !== 0) slope = fr(-gx0, gy0);
    return { gx0, gy0, slope };
  }
  const secantSlope = (p, m) => {
    // Newton on the curve for y(x) near x0 (y0 + tangent guess)
    const e = exact(p, m);
    if (e.gy0 === 0) return NaN;
    const h = 1e-3;
    const yOf = (x) => { let y = p.y0 + frV(e.slope) * (x - p.x0); for (let i = 0; i < 40; i++) { const g = m.G(x, y), gy = m.Gy(x, y); if (!gy) break; y -= g / gy; } return y; };
    return (yOf(p.x0 + h) - yOf(p.x0 - h)) / (2 * h);
  };

  // ---------------- texts ----------------
  function problemStatement(p) {
    const m = build(p);
    if (m.vb) {
      return Tx(`${m.eq} eğrisi üzerinde, kaydırıcıyla seçilen P(${N(m.x0)}, ${N(m.y0)}) noktasında kapalı türev formülüyle dy/dx'i bulalım; sonucu, eğriden yalnızca iki yakın nokta alınarak elde edilen sayısal eğimle karşılaştıralım.`,
        `On the curve ${m.eq}, at the point P(${N(m.x0)}, ${N(m.y0)}) chosen with the slider, let's find dy/dx with the implicit-differentiation formula and compare it with the numeric slope obtained from two nearby curve points only.`);
    }
    return Tx(`${m.eq} eğrisi üzerindeki P(${S(p.x0)}, ${S(p.y0)}) noktasında kapalı türevle dy/dx ifadesini bulalım; sonra P'deki eğimi hesaplayıp teğet ile normal doğrunun denklemlerini yazabiliriz.`,
      `On the curve ${m.eq}, let's use implicit differentiation to find dy/dx, then compute the slope at P(${S(p.x0)}, ${S(p.y0)}) and write the equations of the tangent and normal lines there.`);
  }

  function concept() {
    return Tx(
      "TANIM: Bazı eğriler y = f(x) biçiminde yazılamaz (örn. x² + y² = 25). Kapalı türevde y'yi x'in gizli bir fonksiyonu sayar, denklemin iki yanını x'e göre türeterek dy/dx'i buluruz.\n" +
      "\n" +
      "KİLİT FİKİR: y, x'in fonksiyonudur; bu yüzden y içeren her terim ZİNCİR KURALIYLA türetilir:\n" +
      "   d/dx [yⁿ] = n·yⁿ⁻¹·y'          d/dx [sin y] = cos y·y'\n" +
      "   d/dx [e^y] = e^y·y'              d/dx [ln y] = y'/y\n" +
      "   d/dx [x·y] = y + x·y'   (ÇARPIM kuralı)     d/dx [x²y] = 2xy + x²·y'\n" +
      "\n" +
      "YÖNTEM:\n" +
      "   (1) Önce noktanın eğri üzerinde olduğunu doğrularız (denklemi sağlaması gerekir).\n" +
      "   (2) Denklemin iki yanını da x'e göre türetiriz; y içeren her terimin sonuna y' (= dy/dx) yazılır.\n" +
      "   (3) y' içeren tüm terimler bir tarafa, diğerleri öbür tarafa toplanır.\n" +
      "   (4) y' ortak çarpan olarak parantez dışına alınır: y'·(…) = (…).\n" +
      "   (5) Bölerek y' yalnız bırakılır: y' = −Gx / Gy biçimi (Gx: x'e göre kısmi türev, Gy: y'ye göre).\n" +
      "   (6) P(x₀, y₀) noktasını yerine koyarak eğimi buluruz; teğet: y − y₀ = m(x − x₀), normal: eğim −1/m.\n" +
      "\n" +
      "ÖZEL DURUMLAR / SIK YAPILAN HATALAR:\n" +
      "   - Payda 0 (Gy = 0) ise teğet DÜŞEYDİR: x = x₀ (eğim tanımsız); pay 0 (Gx = 0) ise teğet YATAYDIR: y = y₀.\n" +
      "   - y' çarpanını unutmak en yaygın hatadır: d/dx[y²] = 2y·y' (2y değil).\n" +
      "   - Sonuç genelde hem x hem y içerir; eğim için bir NOKTA (x₀, y₀) gerekir.\n" +
      "   - Nokta eğri üzerinde olmalıdır; önce denklemi sağladığını kontrol etmek iyi olur.\n" +
      "   - Normal doğrunun eğimi −1/m'dir (m = 0 ise normal düşeydir).\n" +
      "\n" +
      "MİNİ ÖRNEK: x² + y² = 25. Türev: 2x + 2y·y' = 0 ⇒ y' = −x/y. (3, 4) noktasında eğim −3/4; teğet: y − 4 = −(3/4)(x − 3), normal: y − 4 = (4/3)(x − 3).\n" +
      "\n" +
      "BAĞLANTI: Aynı sonuç, üst yarı çember için y = √(25 − x²) alınıp zincir kuralıyla türetilirse de bulunur: y' = −x/√(25 − x²) = −x/y. Kapalı türev her iki yarıyı tek formülle verir.\n" +
      "\n" +
      "BU SEKMEDE: çember, elips, x³ + y³, xy = k, x² − y², karma terimli ve trigonometrik/üstel eğriler; ayrıca VB'deki çember/elips/hiperbol için noktayı eğri boyunca kaydırarak formül teğetini (altın) ve iki yakın noktadan hesaplanan sayısal teğeti (kesikli) karşılaştırma.",
      "DEFINITION: Some curves cannot be written as y = f(x) (e.g. x² + y² = 25). Implicit differentiation treats y as a hidden function of x and differentiates both sides of the equation with respect to x to find dy/dx.\n" +
      "\n" +
      "KEY IDEA: y is a function of x, so every term containing y is differentiated with the CHAIN RULE:\n" +
      "   d/dx [yⁿ] = n·yⁿ⁻¹·y'          d/dx [sin y] = cos y·y'\n" +
      "   d/dx [e^y] = e^y·y'              d/dx [ln y] = y'/y\n" +
      "   d/dx [x·y] = y + x·y'   (PRODUCT rule)      d/dx [x²y] = 2xy + x²·y'\n" +
      "\n" +
      "METHOD:\n" +
      "   (1) First we verify that the point lies on the curve (it has to satisfy the equation).\n" +
      "   (2) We differentiate both sides with respect to x and attach y' (= dy/dx) to every term that came from y.\n" +
      "   (3) We collect all terms containing y' on one side and the rest on the other.\n" +
      "   (4) We factor out y': y'·(…) = (…).\n" +
      "   (5) We divide to isolate y': the form y' = −Gx / Gy (Gx: partial derivative in x, Gy: in y).\n" +
      "   (6) Substituting P(x₀, y₀) gives the slope; tangent: y − y₀ = m(x − x₀), normal: slope −1/m.\n" +
      "\n" +
      "SPECIAL CASES / COMMON PITFALLS:\n" +
      "   - If the denominator is 0 (Gy = 0) the tangent is VERTICAL: x = x₀ (the slope does not exist); if the numerator is 0 (Gx = 0) the tangent is HORIZONTAL: y = y₀.\n" +
      "   - Forgetting the y' factor is the most common mistake: d/dx[y²] = 2y·y' (not 2y).\n" +
      "   - The result usually contains both x and y; a POINT (x₀, y₀) is needed for the slope.\n" +
      "   - The point must lie on the curve; it helps to check first that it satisfies the equation.\n" +
      "   - The normal line has slope −1/m (it is vertical when m = 0).\n" +
      "\n" +
      "MINI EXAMPLE: x² + y² = 25. Differentiate: 2x + 2y·y' = 0 ⇒ y' = −x/y. At (3, 4) the slope is −3/4; tangent: y − 4 = −(3/4)(x − 3), normal: y − 4 = (4/3)(x − 3).\n" +
      "\n" +
      "LINK: the same result comes from the upper half circle y = √(25 − x²) with the chain rule: y' = −x/√(25 − x²) = −x/y. Implicit differentiation gives both halves in one formula.\n" +
      "\n" +
      "IN THIS TAB: circle, ellipse, x³ + y³, xy = k, x² − y², mixed-term and trigonometric/exponential curves; plus the VB circle/ellipse/hyperbola where we can slide the point along the curve and compare the formula tangent (gold) with the numeric tangent from two nearby points (dashed).");
  }

  const H = (n, t) => `── ${n}) ${t} ──\n`;

  function solveSteps(p) {
    const m = build(p);
    if (m.vb) return stepsVb(p, m);
    const e = exact(p, m);
    const x0 = p.x0, y0 = p.y0;
    const vertical = e.gy0 === 0;
    const st = [];
    st.push(Tx(H(1, 'Noktanın eğri üzerinde olduğunu doğrulayalım') + `${m.eq}\nP(${S(x0)}, ${S(y0)}):  ${m.check}`,
      H(1, 'Check that the point lies on the curve') + `${m.eq}\nP(${S(x0)}, ${S(y0)}):  ${m.check}`));
    const ruleTr = m.rule === 'product' ? "Çarpım terimleri için çarpım kuralı, y içeren terimler için zincir kuralı (y' çarpanı) kullanılır." : "y içeren her terim zincir kuralıyla türetilir: d/dx[g(y)] = g'(y)·y'.";
    const ruleEn = m.rule === 'product' ? "Product terms need the product rule, and terms in y need the chain rule (the factor y')." : "Every term in y is differentiated with the chain rule: d/dx[g(y)] = g'(y)·y'.";
    st.push(Tx(H(2, "İki yanı x'e göre türetelim") + `${ruleTr}\n${m.d1}`, H(2, 'Differentiate both sides with respect to x') + `${ruleEn}\n${m.d1}`));
    st.push(Tx(H(3, "y' terimlerini toplayalım") + `y' içeren terimleri bir tarafa alıp y'yi ortak çarpan yapabiliriz:\ny'·(${m.gyS}) = ${negStr(m.gxS)}`,
      H(3, "Collect the y' terms") + `We can move the y' terms to one side and factor out y':\ny'·(${m.gyS}) = ${negStr(m.gxS)}`));
    st.push(Tx(H(4, "y'yi yalnız bırakalım") + `${m.ySym}   (dy/dx = −Gx/Gy)`, H(4, "Isolate y'") + `${m.ySym}   (dy/dx = −Gx/Gy)`));
    if (vertical) {
      st.push(Tx(H(5, 'P noktasında değerlendirelim') + `Pay: ${negStr(m.gxS)} = ${S(-e.gx0)};  payda: ${m.gyS} = 0.\nPayda 0 ve pay ≠ 0 ⇒ eğim tanımsız: teğet DÜŞEYDİR.`,
        H(5, 'Evaluate at P') + `Numerator: ${negStr(m.gxS)} = ${S(-e.gx0)};  denominator: ${m.gyS} = 0.\nDenominator 0 and numerator ≠ 0 ⇒ the slope does not exist: the tangent is VERTICAL.`));
      st.push(Tx(H(6, 'Teğet ve normal') + `Teğet: x = ${S(x0)}.\nNormal (yatay): y = ${S(y0)}.`, H(6, 'Tangent and normal') + `Tangent: x = ${S(x0)}.\nNormal (horizontal): y = ${S(y0)}.`));
      st.push(Tx(H(7, 'Yorum') + `Bu noktada eğri x yönünde en uç konumundadır (düşey teğet); y, x'in fonksiyonu değildir (dy/dx tanımsız), ama x, y'nin fonksiyonudur: dx/dy = 0.`,
        H(7, 'Interpretation') + `At this point the curve reaches its extreme position in the x direction (vertical tangent); y is not a function of x there (dy/dx does not exist), but x is a function of y with dx/dy = 0.`));
      return st;
    }
    const sl = e.slope;
    st.push(Tx(H(5, 'P noktasında değerlendirin') + `Pay: ${negStr(m.gxS)} = ${S(-e.gx0)};  payda: ${m.gyS} = ${S(e.gy0)}.\ndy/dx = ${S(-e.gx0)} / ${P(S(e.gy0))} = ${frS(sl)}  (≈ ${N(frV(sl))}).`,
      H(5, 'Evaluate at P') + `Numerator: ${negStr(m.gxS)} = ${S(-e.gx0)};  denominator: ${m.gyS} = ${S(e.gy0)}.\ndy/dx = ${S(-e.gx0)} / ${P(S(e.gy0))} = ${frS(sl)}  (≈ ${N(frV(sl))}).`));
    const c = frAdd(fr(y0), frNeg(frMul(sl, fr(x0))));
    let normal;
    if (sl.n === 0) normal = `x = ${S(x0)}`;
    else { const mn = fr(-sl.d, sl.n); normal = lineS(mn, frAdd(fr(y0), frNeg(frMul(mn, fr(x0))))); }
    const tangent = lineS(sl, c);
    const mn = sl.n === 0 ? null : fr(-sl.d, sl.n);
    const yPart = ymm(y0), xPart = xm(x0);
    const tLine = `${yPart} = ${Pf(sl)}(${xPart})  ⇒  ${tangent}`;
    const nLine = sl.n === 0 ? normal : `${yPart} = ${Pf(mn)}(${xPart})  ⇒  ${normal}`;
    st.push(Tx(H(6, 'Teğet ve normal doğrular') + `Teğet: ${tLine}.
Normal (eğim ${sl.n === 0 ? 'tanımsız: düşey' : frS(mn)}): ${nLine}.`,
      H(6, 'Tangent and normal lines') + `Tangent: ${tLine}.
Normal (slope ${sl.n === 0 ? 'not defined: vertical' : frS(mn)}): ${nLine}.`));
    const sec = secantSlope(p, m);
    st.push(Tx(H(7, 'Sayısal kontrol') + `Eğri üzerinde x₀ ± 0.001 noktalarının y değerlerini Newton yöntemiyle bulursak iki nokta arasındaki eğim ≈ ${nf(sec, 4)} çıkar (formül: ${nf(frV(sl), 4)}) ✓.`,
      H(7, 'Numeric check') + `Solving for y on the curve at x₀ ± 0.001 (Newton's method), the slope between the two points is ≈ ${nf(sec, 4)} (formula: ${nf(frV(sl), 4)}) ✓.`));
    const dirTr = sl.n === 0 ? 'Teğet yataydır: bu nokta yerel tepe/çukur adayıdır.' : sl.n > 0 ? 'Eğim pozitif: eğri P civarında yukarı doğru gider.' : 'Eğim negatif: eğri P civarında aşağı doğru gider.';
    const dirEn = sl.n === 0 ? 'The tangent is horizontal: P is a candidate for a local peak/trough.' : sl.n > 0 ? 'Positive slope: the curve rises near P.' : 'Negative slope: the curve falls near P.';
    st.push(Tx(H(8, 'Yorum') + dirTr + ` Teğet ile normal birbirine diktir (eğimlerin çarpımı −1).`, H(8, 'Interpretation') + dirEn + ' The tangent and the normal are perpendicular (product of the slopes is −1).'));
    return st;
  }
  function stepsVb(p, m) {
    const e = m.e, x = m.x0, y = m.y0;
    const imp = e.slope(x, y);
    const vertical = !isFinite(imp) || Math.abs(imp) > 500;
    const h = (e.tMax - e.tMin) * 0.001;
    const xp = e.xt(m.t + h), yp = e.yt(m.t + h), xm = e.xt(m.t - h), ym = e.yt(m.t - h);
    const num = (yp - ym) / (xp - xm);
    const st = [];
    st.push(Tx(H(1, 'Eğri ve nokta') + `${e.eq}.  Parametre t = ${nf(m.t, 3)} ⇒ P(${N(x)}, ${N(y)}).`, H(1, 'Curve and point') + `${e.eq}.  Parameter t = ${nf(m.t, 3)} ⇒ P(${N(x)}, ${N(y)}).`));
    st.push(Tx(H(2, 'Kapalı türev') + e.deriv(), H(2, 'Implicit derivative') + e.deriv()));
    st.push(Tx(H(3, 'Formül') + e.ySym, H(3, 'Formula') + e.ySym));
    if (vertical) {
      st.push(Tx(H(4, 'Noktada değerlendirelim') + `P'de payda ≈ 0: teğet (neredeyse) DÜŞEYDİR; eğim çok büyük (|dy/dx| > 500) veya tanımsızdır. Noktayı kaydırıcıyla biraz oynatmayı deneyebiliriz.`,
        H(4, 'Evaluate at the point') + `At P the denominator is ≈ 0: the tangent is (almost) VERTICAL; the slope is huge (|dy/dx| > 500) or not defined. It helps to move the point a little with the slider.`));
    } else {
      st.push(Tx(H(4, 'Noktada değerlendirme') + `dy/dx = ${N(imp)}  (kapalı formülden).`, H(4, 'Evaluate at the point') + `dy/dx = ${N(imp)}  (from the implicit formula).`));
      st.push(Tx(H(5, 'Eğriden sayısal eğim') + `Eğri üzerinde t ± h noktaları: (${nf(xm, 4)}, ${nf(ym, 4)}) ve (${nf(xp, 4)}, ${nf(yp, 4)}).\nEğim ≈ (${nf(yp, 4)} − ${P(nf(ym, 4))}) / (${nf(xp, 4)} − ${P(nf(xm, 4))}) ≈ ${nf(num, 4)}.`,
        H(5, 'Numeric slope from the curve') + `Curve points at t ± h: (${nf(xm, 4)}, ${nf(ym, 4)}) and (${nf(xp, 4)}, ${nf(yp, 4)}).\nSlope ≈ (${nf(yp, 4)} − ${P(nf(ym, 4))}) / (${nf(xp, 4)} − ${P(nf(xm, 4))}) ≈ ${nf(num, 4)}.`));
      st.push(Tx(H(6, 'Karşılaştıralım') + `Formül: ${nf(imp, 4)}   |   sayısal: ${nf(num, 4)}  ⇒ iki teğet çakışır (grafikte altın düz çizgi ve kesikli çizgi). Bu, kapalı türev formülünün eğrinin gerçek geometrik eğimini ölçtüğünün grafiksel kanıtıdır.`,
        H(6, 'Comparison') + `Formula: ${nf(imp, 4)}   |   numeric: ${nf(num, 4)}  ⇒ the two tangents coincide (the solid gold line and the dashed line on the graph). This is the graphical proof that the implicit formula measures the real geometric slope of the curve.`));
      st.push(Tx(H(7, 'Teğet') + `y ${y < 0 ? '+' : '−'} ${N(Math.abs(y))} = ${P(N(imp))}(x ${x < 0 ? '+' : '−'} ${N(Math.abs(x))}).`, H(7, 'Tangent') + `y ${y < 0 ? '+' : '−'} ${N(Math.abs(y))} = ${P(N(imp))}(x ${x < 0 ? '+' : '−'} ${N(Math.abs(x))}).`));
    }
    return st;
  }

  // ---------------- drawing ----------------
  function fitView(canvas, cx, cy, R) {
    let w = 1, h = 1;
    try { if (canvas.canvas && canvas.canvas.clientWidth > 10 && canvas.canvas.clientHeight > 10) { w = canvas.canvas.clientWidth; h = canvas.canvas.clientHeight; } } catch (e) { w = h = 1; }
    const asp = w / h;
    let xh, yh;
    if (asp >= 1) { yh = R; xh = R * asp; } else { xh = R; yh = R / asp; }
    canvas.setViewport(cx - xh, cx + xh, cy - yh, cy + yh);
    return { x0: cx - xh, x1: cx + xh, y0: cy - yh, y1: cy + yh, xh, yh };
  }
  function contourSegs(G, v, nx, ny) {
    const dx = (v.x1 - v.x0) / nx, dy = (v.y1 - v.y0) / ny;
    const vals = [];
    for (let i = 0; i <= nx; i++) {
      const col = [];
      for (let j = 0; j <= ny; j++) { const g = G(v.x0 + i * dx, v.y0 + j * dy); col.push(isFinite(g) ? g : NaN); }
      vals.push(col);
    }
    const segs = [];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const a = vals[i][j], b = vals[i + 1][j], c = vals[i + 1][j + 1], d = vals[i][j + 1];
        if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) continue;
        const xl = v.x0 + i * dx, yb = v.y0 + j * dy;
        const idx = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (c > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const pt = (e) => {
          switch (e) {
            case 0: return [xl + dx * (a / (a - b)), yb];
            case 1: return [xl + dx, yb + dy * (b / (b - c))];
            case 2: return [xl + dx * (d / (d - c)), yb + dy];
            default: return [xl, yb + dy * (a / (a - d))];
          }
        };
        const add = (e1, e2) => { const p1 = pt(e1), p2 = pt(e2); if (isFinite(p1[0] + p1[1] + p2[0] + p2[1])) segs.push([p1[0], p1[1], p2[0], p2[1]]); };
        switch (idx) {
          case 1: case 14: add(3, 0); break;
          case 2: case 13: add(0, 1); break;
          case 3: case 12: add(3, 1); break;
          case 4: case 11: add(1, 2); break;
          case 6: case 9: add(0, 2); break;
          case 7: case 8: add(3, 2); break;
          case 5: { const ctr = (a + b + c + d) / 4; if (ctr > 0) { add(0, 1); add(2, 3); } else { add(3, 0); add(1, 2); } break; }
          default: { const ctr = (a + b + c + d) / 4; if (ctr > 0) { add(3, 0); add(1, 2); } else { add(0, 1); add(2, 3); } }
        }
      }
    }
    return segs;
  }

  function addLineThrough(canvas, x, y, dirx, diry, half, color, dashed, thick) {
    const len = Math.sqrt(dirx * dirx + diry * diry) || 1;
    const ux = dirx / len, uy = diry / len;
    canvas.addSegment({ x1: x - ux * half, y1: y - uy * half, x2: x + ux * half, y2: y + uy * half, color, dashed, thickness: thick });
  }

  function focusPt(p, m) { return m.vb ? { x: m.x0, y: m.y0 } : { x: p.x0, y: p.y0 }; }
  function focus(p) { return focusPt(p, build(p)); }

  function draw(canvas, p) {
    try {
      const m = build(p);
      const fp = focusPt(p, m);
      const v = fitView(canvas, fp.x, fp.y, m.R + Math.max(Math.abs(fp.x - m.cx), Math.abs(fp.y - m.cy)));
      const acc = canvas.accent();
      const d = m.draw;
      if (d.type === 'param') {
        canvas.addParametric({ xOfT: d.xt, yOfT: d.yt, tMin: d.t0, tMax: d.t1, color: acc, thickness: 3, samples: 400 });
      } else if (d.type === 'func') {
        d.fns.forEach((f) => canvas.addFunction({ evaluator: (x) => { const y = f(x); return isFinite(y) && Math.abs(y) < 1e4 ? y : NaN; }, color: acc, thickness: 3 }));
      } else {
        contourSegs(m.G, v, 130, 90).forEach((s) => canvas.addSegment({ x1: s[0], y1: s[1], x2: s[2], y2: s[3], color: acc, thickness: 2.6 }));
      }
      const half = Math.min(v.xh, v.yh) * 0.6;
      if (m.vb) {
        const x = m.x0, y = m.y0, e = m.e;
        const imp = e.slope(x, y);
        const hh = (e.tMax - e.tMin) * 0.001;
        const xp = e.xt(m.t + hh), yp = e.yt(m.t + hh), xm = e.xt(m.t - hh), ym = e.yt(m.t - hh);
        const hw = e.vp * 0.18 * 2.2;
        if (p.showTan && isFinite(imp)) addLineThrough(canvas, x, y, 1, imp, hw, canvas.gold(), false, 3);
        if (p.showNumeric && isFinite(yp) && isFinite(ym) && Math.abs(xp - xm) > 1e-12) addLineThrough(canvas, x, y, xp - xm, yp - ym, hw, canvas.gray(), true, 1.8);
        if (p.showNormal && isFinite(imp) && Math.abs(imp) > 1e-9) addLineThrough(canvas, x, y, -imp, 1, hw, canvas.blue(), true, 2);
        canvas.addMarker({ x, y, color: acc, radius: 7, label: `P(${N(x)}, ${N(y)})` });
        return;
      }
      const e = exact(p, m);
      const x0 = p.x0, y0 = p.y0;
      if (p.showTan) {
        if (e.gy0 === 0) addLineThrough(canvas, x0, y0, 0, 1, half, canvas.gold(), false, 3);
        else addLineThrough(canvas, x0, y0, 1, frV(e.slope), half, canvas.gold(), false, 3);
      }
      if (p.showNormal) {
        if (e.gy0 === 0) addLineThrough(canvas, x0, y0, 1, 0, half, canvas.blue(), true, 2);
        else if (e.slope.n === 0) addLineThrough(canvas, x0, y0, 0, 1, half, canvas.blue(), true, 2);
        else addLineThrough(canvas, x0, y0, -frV(e.slope), 1, half, canvas.blue(), true, 2);
      }
      if (p.showNumeric && e.gy0 !== 0) {
        const sec = secantSlope(p, m);
        if (isFinite(sec)) addLineThrough(canvas, x0, y0, 1, sec, half * 0.8, canvas.gray(), true, 1.6);
      }
      canvas.addMarker({ x: x0, y: y0, color: canvas.gold(), radius: 7, label: `P(${S(x0)}, ${S(y0)})` });
    } catch (err) {
      canvas.setViewport(-5, 5, -5, 5);
    }
  }

  // ---------------- controls ----------------
  function applyVisibility(p) {
    const isVb = p.kind === 'vb';
    ctl.rows.forEach((r) => { if (r.input && r.input.parentElement && r.input.parentElement.style) r.input.parentElement.style.display = isVb ? '' : 'none'; });
    if (ctl.sel && ctl.sel.select) { ctl.sel.select.style.display = isVb ? '' : 'none'; ctl.sel.select.value = String(p.idx === undefined ? 0 : p.idx); }
    if (ctl.label) ctl.label.style.display = isVb ? '' : 'none';
    ctl.boxes.forEach((b) => { if (b && b.refreshFromModel) b.refreshFromModel(); });
  }
  function buildControls(rightCol, getProblem, h) {
    ctl.rows = []; ctl.boxes = [];
    ctl.boxes.push(h.addCheckbox({ caption: Tx('Teğet doğru (altın)', 'Tangent line (gold)'), get: () => getProblem().showTan, set: (v) => { getProblem().showTan = v; } }));
    ctl.boxes.push(h.addCheckbox({ caption: Tx('Normal doğru (mavi)', 'Normal line (blue)'), get: () => getProblem().showNormal, set: (v) => { getProblem().showNormal = v; } }));
    ctl.boxes.push(h.addCheckbox({ caption: Tx('Eğriden sayısal teğet (kesikli gri)', 'Numeric tangent from the curve (dashed gray)'), get: () => getProblem().showNumeric, set: (v) => { getProblem().showNumeric = v; } }));
    const lab = document.createElement('div');
    lab.className = 'we-slider-caption';
    lab.style.fontWeight = '600';
    lab.textContent = Tx('Eğri (VB örnekleri) ve nokta:', 'Curve (VB examples) and point:');
    rightCol.appendChild(lab);
    ctl.label = lab;
    ctl.sel = h.addSelect({
      options: VB.map((e, i) => ({ label: e.name(), value: i })),
      get: () => (getProblem().idx === undefined ? 0 : getProblem().idx),
      set: (v) => { const q = getProblem(); if (q.kind === 'vb') q.idx = Number(v); },
    });
    ctl.rows.push(h.addSlider({
      caption: Tx('Noktayı eğri boyunca sürükleyebiliriz', 'We can drag the point along the curve'), min: 0, max: 1, step: 0.01,
      get: () => (getProblem().s === undefined ? 0.3 : getProblem().s),
      set: (v) => { const q = getProblem(); if (q.kind === 'vb') q.s = Math.max(0, Math.min(1, v)); },
    }));
    applyVisibility(getProblem());
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    resizeHandler = () => { try { h.refresh(); } catch (e) { /* ignore */ } };
    window.addEventListener('resize', resizeHandler);
  }

  Topics.register('derivatives', {
    id: 'implicitDifferentiation',
    tabTitle: () => Tx('Kapalı Türev', 'Implicit Differentiation'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus,
    buildControls,
    links: [
      { match: /^\s+d\/dx \[yⁿ\] = /, make: (rng) => genKind(rng, rng.pick(['circle', 'cubic', 'quartic', 'sin'])) },
      { match: /^\s+d\/dx \[e\^y\] = /, make: (rng) => genKind(rng, rng.pick(['exy', 'lny'])) },
      { match: /^\s+d\/dx \[x·y\] = /, make: (rng) => genKind(rng, rng.pick(['xyk', 'mixed'])) },
      { match: /^\s+- (Payda 0 \(Gy = 0\)|If the denominator is 0 \(Gy = 0\))/, make: (rng) => genKind(rng, 'circle', { axis: true }) },
    ],
    // test hooks (harmless)
    _check: (p) => {
      const m = build(p);
      if (m.vb) return { vb: true };
      const e = exact(p, m);
      return { G: m.G, x0: p.x0, y0: p.y0, vertical: e.gy0 === 0, slope: e.slope ? frV(e.slope) : null, slopeStr: e.slope ? frS(e.slope) : null, sec: secantSlope(p, m) };
    },
  });
})();
