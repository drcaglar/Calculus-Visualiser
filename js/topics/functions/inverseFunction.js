// Ported from Modules/Functions/InverseFunctionControl.vb - Ters Fonksiyonlar (Thomas' Calculus, Section 1.6).
// Kind: 0 linear, 1 shifted cube, 2 restricted square root, 3 rational, 4 exponential,
// 5 NOT one-to-one (restricted parabola), 6 monotone cubic (no formula), 7 temperature conversion.
(function () {
  const tx = (tr, en) => I18N.tx(tr, en);

  // ---------- text helpers (mirror FnTabs1 Sg/Suffix/N2, QuizKit PolyStr/Cf/Sup, QuizBank XTerm/Frac) ----------
  function sg(v) { return v >= 0 ? '+ ' + fmt2(v) : '- ' + fmt2(Math.abs(v)); }
  function suffix(v) { return Math.abs(v) < 0.0000001 ? '' : ' ' + sg(v); }
  function n2(v) { return fmt2(v); }
  function cf(n) { return n === 1 ? '' : (n === -1 ? '-' : String(n)); }
  function sup(n) { const s = '⁰¹²³⁴⁵⁶⁷⁸⁹'; return n >= 0 && n <= 9 ? s[n] : '^' + n; }
  function xTerm(h) { if (h === 0) return 'x'; return h > 0 ? `(x - ${h})` : `(x + ${-h})`; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b !== 0) { const t = a % b; a = b; b = t; } return a === 0 ? 1 : a; }
  function frac(n, d) {
    if (d === 0) return tx('tanımsız', 'undefined');
    const g = gcd(n, d);
    n = Math.trunc(n / g); d = Math.trunc(d / g);
    if (d < 0) { n = -n; d = -d; }
    return d === 1 ? String(n) : `${n}/${d}`;
  }
  function polyStr(...c) {
    let out = '';
    for (let d = c.length - 1; d >= 0; d--) {
      const v = c[d];
      if (v === 0) continue;
      const mag = Math.abs(v);
      let body;
      if (d === 0) body = String(mag);
      else { const x = d === 1 ? 'x' : 'x' + sup(d); body = mag === 1 ? x : mag + x; }
      out += out.length === 0 ? (v < 0 ? '-' : '') + body : (v < 0 ? ' - ' : ' + ') + body;
    }
    return out.length === 0 ? '0' : out;
  }
  function sum(coefs, vars) {
    let out = '';
    for (let i = 0; i < coefs.length; i++) {
      const v = coefs[i];
      if (v === 0) continue;
      const mag = Math.abs(v);
      const body = vars[i] === '' ? String(mag) : (mag === 1 ? vars[i] : mag + vars[i]);
      out += out.length === 0 ? (v < 0 ? '-' : '') + body : (v < 0 ? ' - ' : ' + ') + body;
    }
    return out.length === 0 ? '0' : out;
  }
  const xSuf = (v) => 'x' + suffix(v);
  const sqrtOf = (inner) => inner === 0 ? '√x' : '√(x' + suffix(inner) + ')';
  function linInv(a, b) {
    const num = 'x' + suffix(-b);
    if (a === 1) return num;
    const numP = b === 0 ? num : '(' + num + ')';
    return numP + '/' + (a < 0 ? '(' + a + ')' : String(a));
  }
  const round = (v, d) => { const m = Math.pow(10, d); return Math.round(v * m) / m; };
  // Coordinates in "(a, b)" pairs always use a decimal point.
  function inv2(v) {
    if (!isFinite(v)) return '?';
    return fmt2(round(v, 2));
  }

  // ---------- the functions ----------
  const baseVal = (p) => [2.0, 3.0, 0.5, Math.E][p.baseIdx] !== undefined ? [2.0, 3.0, 0.5, Math.E][p.baseIdx] : Math.E;
  const baseText = (p) => ['2', '3', '(1/2)', 'e'][p.baseIdx] || 'e';
  const logName = (p) => ['log₂', 'log₃', 'log_(1/2)', 'ln'][p.baseIdx] || 'ln';
  const safe = (v) => (isFinite(v) ? v : NaN);
  const cbrt = (v) => Math.sign(v) * Math.pow(Math.abs(v), 1.0 / 3.0);

  function isOneToOne(p) {
    switch (p.kind) {
      case 0: return p.a !== 0;
      case 3: return p.a * p.d - p.b * p.c !== 0 && (p.c !== 0 || p.d !== 0);
      case 5: return false;
      case 6: return p.a >= 0;
      default: return true;
    }
  }

  // f itself (full natural domain). Never throws; NaN outside the domain.
  function fn(p, x) {
    try {
      switch (p.kind) {
        case 0: return safe(p.a * x + p.b);
        case 1: return safe(Math.pow(x - p.a, 3) + p.b);
        case 2: return x < p.a ? NaN : safe(Math.sqrt(x - p.a) + p.b);
        case 3: {
          const den = p.c * x + p.d;
          if (Math.abs(den) < 0.000001) return NaN;
          return safe((p.a * x + p.b) / den);
        }
        case 4: return safe(Math.pow(baseVal(p), x) + p.b);
        case 5: return safe((x - p.a) * (x - p.a) + p.b);
        case 6: return safe(x * x * x + p.a * x + p.b);
        default: return safe(5.0 / 9.0 * (x - 32));
      }
    } catch (e) { return NaN; }
  }

  // f restricted to a one-to-one piece (only differs from fn for kind 5).
  function fRestricted(p, x) {
    if (p.kind === 5) {
      if (p.branch === 0 && x < p.a) return NaN;
      if (p.branch === 1 && x > p.a) return NaN;
    }
    return fn(p, x);
  }

  function solve6(p, y) {
    if (p.a < 0) return NaN;
    let lo = -8.0, hi = 8.0;
    if (y < fn(p, lo) || y > fn(p, hi)) return NaN;
    for (let i = 1; i <= 60; i++) {
      const mid = (lo + hi) / 2;
      if (fn(p, mid) < y) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // The inverse (of the restricted f for kind 5). Never throws; NaN outside its domain.
  function inv(p, y) {
    try {
      switch (p.kind) {
        case 0: return p.a === 0 ? NaN : safe((y - p.b) / p.a);
        case 1: return safe(cbrt(y - p.b) + p.a);
        case 2: return y < p.b ? NaN : safe((y - p.b) * (y - p.b) + p.a);
        case 3: {
          const den = -p.c * y + p.a;
          if (Math.abs(den) < 0.000001) return NaN;
          return safe((p.d * y - p.b) / den);
        }
        case 4: return y - p.b <= 0 ? NaN : safe(Math.log(y - p.b) / Math.log(baseVal(p)));
        case 5:
          if (y < p.b) return NaN;
          return p.a + (p.branch === 0 ? 1 : -1) * Math.sqrt(y - p.b);
        case 6: return solve6(p, y);
        default: return safe(9.0 / 5.0 * y + 32);
      }
    } catch (e) { return NaN; }
  }

  function recip(p, inf) {
    if (isNaN(inf.B0)) return '?';
    if (p.kind === 3) {
      const a0 = Math.trunc(inf.A0);
      const n = p.a * a0 + p.b, m = p.c * a0 + p.d;
      return n === 0 ? tx('tanımsız', 'undefined') : frac(m, n);
    }
    if (Math.abs(inf.B0) < 0.0000001) return tx('tanımsız', 'undefined');
    if (Math.abs(inf.B0 - Math.round(inf.B0)) < 0.0000001) return frac(1, Math.round(inf.B0));
    return '≈ ' + inv2(1.0 / inf.B0);
  }

  function getInfo(p) {
    const r = { valid: true, FExpr: '', InvExpr: '', DomF: '', RngF: '', DomI: '', RngI: '', A0: 0, B0: 0, A0T: '', B0T: '' };
    r.valid = isOneToOne(p) || p.kind === 5; // kind 5: the RESTRICTED f is one-to-one
    const reals = '(-∞, ∞)';
    switch (p.kind) {
      case 0:
        r.FExpr = polyStr(p.b, p.a);
        if (r.valid) r.InvExpr = linInv(p.a, p.b);
        r.DomF = reals; r.RngF = r.valid ? reals : '{' + p.b + '}'; r.DomI = r.RngF; r.RngI = reals;
        r.A0 = p.t; r.B0 = p.a * p.t + p.b;
        break;
      case 1: {
        r.FExpr = xTerm(p.a) + '³' + suffix(p.b);
        r.InvExpr = '∛(' + xSuf(-p.b) + ')' + suffix(p.a);
        r.DomF = reals; r.RngF = reals; r.DomI = reals; r.RngI = reals;
        const t = Math.max(-2, Math.min(2, p.t));
        r.A0 = p.a + t; r.B0 = t * t * t + p.b;
        break;
      }
      case 2: {
        r.FExpr = sqrtOf(-p.a) + suffix(p.b);
        r.InvExpr = (p.b === 0 ? 'x²' : '(x' + suffix(-p.b) + ')²') + suffix(p.a);
        r.DomF = `[${p.a}, ∞)`; r.RngF = `[${p.b}, ∞)`; r.DomI = r.RngF; r.RngI = r.DomF;
        const t = Math.abs(p.t);
        r.A0 = p.a + t * t; r.B0 = p.b + t;
        break;
      }
      case 3: {
        r.FExpr = '(' + polyStr(p.b, p.a) + ')/(' + polyStr(p.d, p.c) + ')';
        if (r.valid) r.InvExpr = '(' + sum([p.d, -p.b], ['x', '']) + ')/(' + sum([-p.c, p.a], ['x', '']) + ')';
        if (p.c !== 0) {
          r.DomF = `x ≠ ${frac(-p.d, p.c)}`; r.RngF = `y ≠ ${frac(p.a, p.c)}`;
          r.DomI = `x ≠ ${frac(p.a, p.c)}`; r.RngI = `y ≠ ${frac(-p.d, p.c)}`;
        } else { r.DomF = reals; r.RngF = reals; r.DomI = reals; r.RngI = reals; }
        let a0 = p.t;
        if (p.c * a0 + p.d === 0) a0 += 1;
        const n = p.a * a0 + p.b, m = p.c * a0 + p.d;
        r.A0 = a0;
        r.B0 = m === 0 ? NaN : n / m;
        break;
      }
      case 4:
        r.FExpr = baseText(p) + '^x' + suffix(p.b);
        r.InvExpr = logName(p) + '(' + xSuf(-p.b) + ')';
        r.DomF = reals; r.RngF = `(${p.b}, ∞)`; r.DomI = r.RngF; r.RngI = reals;
        r.A0 = p.t; r.B0 = Math.pow(baseVal(p), p.t) + p.b;
        break;
      case 5: {
        r.FExpr = (p.a === 0 ? 'x²' : '(x' + suffix(-p.a) + ')²') + suffix(p.b);
        const root = sqrtOf(-p.b);
        r.InvExpr = p.branch === 0 ? root + suffix(p.a) : '-' + root + suffix(p.a);
        r.DomF = reals; r.RngF = `[${p.b}, ∞)`;
        r.DomI = r.RngF; r.RngI = p.branch === 0 ? `[${p.a}, ∞)` : `(-∞, ${p.a}]`;
        const t = Math.max(1, Math.abs(p.t));
        r.A0 = p.a + (p.branch === 0 ? t : -t); r.B0 = t * t + p.b;
        break;
      }
      case 6:
        r.FExpr = polyStr(p.b, p.a, 0, 1);
        r.InvExpr = tx('(basit bir formülü yok)', '(no simple formula)');
        r.DomF = reals; r.RngF = r.valid ? reals : '?'; r.DomI = r.RngF; r.RngI = reals;
        r.B0 = 5 * p.t;
        r.A0 = solve6(p, r.B0);
        break;
      default:
        r.FExpr = '(5/9)(x - 32)';
        r.InvExpr = '(9/5)x + 32';
        r.DomF = reals; r.RngF = reals; r.DomI = reals; r.RngI = reals;
        r.A0 = 32 + 9 * p.t; r.B0 = 5 * p.t;
    }
    r.A0T = inv2(r.A0);
    if (p.kind === 3) {
      const a0 = Math.trunc(r.A0);
      const n = p.a * a0 + p.b, m = p.c * a0 + p.d;
      r.B0T = m === 0 ? '?' : frac(n, m);
    } else r.B0T = inv2(r.B0);
    return r;
  }

  // ---------- problem generation ----------
  function createProblem(rng) {
    const p = { kind: rng.nextInt(0, 8), a: 0, b: 0, c: 0, d: 0, baseIdx: rng.nextInt(0, 4), branch: rng.nextInt(0, 2), t: rng.nextInt(-3, 4) };
    switch (p.kind) {
      case 0: p.a = rng.nonZeroInt(-3, 3); p.b = rng.nextInt(-4, 5); break;
      case 1: p.a = rng.nextInt(-2, 3); p.b = rng.nextInt(-2, 3); p.t = rng.nextInt(-2, 3); break;
      case 2: p.a = rng.nextInt(-3, 3); p.b = rng.nextInt(-3, 4); p.t = rng.nextInt(0, 4); break;
      case 3:
        do {
          p.a = rng.nextInt(-3, 4); p.b = rng.nextInt(-3, 4);
          p.c = [-2, -1, 1, 2][rng.nextInt(0, 4)]; p.d = rng.nextInt(-3, 4);
        } while (p.a * p.d - p.b * p.c === 0);
        break;
      case 4: p.b = rng.nextInt(-3, 4); break;
      case 5: p.a = rng.nextInt(-3, 4); p.b = rng.nextInt(-3, 4); p.t = rng.nextInt(1, 4); break;
      case 6: p.a = rng.nextInt(1, 4); p.b = rng.nextInt(-3, 4); p.t = [-2, -1, 1, 2][rng.nextInt(0, 4)]; break;
      default: p.t = rng.nextInt(-3, 4);
    }
    return p;
  }

  // ---------- problem statement ----------
  function problemStatement(p) {
    const F = getInfo(p).FExpr;
    switch (p.kind) {
      case 5:
        return tx(`f(x) = ${F} fonksiyonu bire-bir midir? Değilse tanım kümesini uygun biçimde kısıtlayıp tersini bulalım; tanım ve değer kümelerini de yazalım.`,
          `Is f(x) = ${F} one-to-one? If not, let's restrict its domain suitably, then find the inverse and state both domains and ranges.`);
      case 6:
        return tx(`f(x) = ${F} fonksiyonu bire-bir midir? f⁻¹ için cebirsel bir formül yazılabilir mi? Nedenini birlikte düşünelim.`,
          `Is f(x) = ${F} one-to-one? Can f⁻¹ be written with an algebraic formula? Let's explain why.`);
      case 7:
        return tx(`f(x) = ${F} Fahrenheit'ten Celsius'a dönüşümü veriyor. f bire-bir midir? f⁻¹(x) ters fonksiyonunu bulup ne anlama geldiğini yorumlayalım.`,
          `f(x) = ${F} converts Fahrenheit to Celsius. Is f one-to-one? Let's find f⁻¹(x) and interpret what it does.`);
      default:
        return tx(`f(x) = ${F} fonksiyonu bire-bir midir? Bire-birse f⁻¹(x) ters fonksiyonunu bulalım ve tanım ve değer kümelerini yazalım.`,
          `Is f(x) = ${F} one-to-one? If so, let's find the inverse f⁻¹(x) and state its domain and range.`);
    }
  }

  // ---------- worked solution ----------
  function solveSteps(p) {
    const inf = getInfo(p);
    const steps = [];
    let k = 0;
    const S = (tr, en) => { k++; steps.push(k + ') ' + tx(tr, en)); };
    const F = inf.FExpr;
    const a0 = inf.A0T, b0 = inf.B0T;
    const a = p.a, b = p.b, c = p.c, d = p.d;
    let verTr = '', verEn = '', intTr = '', intEn = '';

    switch (p.kind) {
      case 0: {
        S(`Verilen: f(x) = ${F}. Ters fonksiyonu 4 adımda bulacağız.`, `Given: f(x) = ${F}. We find the inverse with the 4-step recipe.`);
        if (!inf.valid) {
          S(`ADIM 1 - Bire-bir mi? a = 0 olduğundan f(x) = ${b} sabit fonksiyondur: grafik y = ${b} yatay doğrusudur ve bu doğru kendisiyle sonsuz noktada kesişir. Örneğin f(1) = f(2) = ${b}.`,
            `STEP 1 - One-to-one? Since a = 0, f(x) = ${b} is a constant function: its graph is the horizontal line y = ${b}, which meets itself everywhere. E.g. f(1) = f(2) = ${b}.`);
          S("SONUÇ: Yatay doğru testi başarısız, f bire-bir DEĞİL, dolayısıyla ters fonksiyonu YOKTUR. Sağdaki 'a' kaydırıcısını sıfırdan farklı yaparak deneyebiliriz.",
            "RESULT: the horizontal line test fails, f is NOT one-to-one, so it has NO inverse. We can try moving the 'a' slider away from zero.");
          return steps;
        }
        S(`ADIM 1 - Bire-bir mi? Grafik eğimi a = ${a} ≠ 0 olan bir doğrudur; her yatay doğru onu tam bir kez keser (yatay doğru testi geçer). Cebirsel kanıt: f(x₁) = f(x₂) ⇒ ${a}x₁${suffix(b)} = ${a}x₂${suffix(b)} ⇒ ${a}x₁ = ${a}x₂ ⇒ x₁ = x₂ (${a} ≠ 0'a bölünür). Bire-bir.`,
          `STEP 1 - One-to-one? The graph is a line with slope a = ${a} ≠ 0; every horizontal line meets it exactly once (the horizontal line test passes). Algebraic proof: f(x₁) = f(x₂) ⇒ ${a}x₁${suffix(b)} = ${a}x₂${suffix(b)} ⇒ ${a}x₁ = ${a}x₂ ⇒ x₁ = x₂ (divide by ${a} ≠ 0). One-to-one.`);
        S(`ADIM 2 - y = f(x) yazalım: y = ${F}`, `STEP 2 - Let's write y = f(x): y = ${F}`);
        const xs = (b === 0 ? 'y' : '(y' + suffix(-b) + ')') + (a === 1 ? '' : '/' + (a < 0 ? '(' + a + ')' : String(a)));
        S(`ADIM 3 - x için çözelim: y${suffix(-b)} = ${cf(a)}x  ⇒  x = ${xs}   (her iki yanı önce sabitten arındırıp sonra x'in katsayısına bölebiliriz).`,
          `STEP 3 - Solve for x: y${suffix(-b)} = ${cf(a)}x  ⇒  x = ${xs}   (first remove the constant from both sides, then divide by the coefficient of x).`);
        S(`ADIM 4 - x ile y'yi değiştir: f⁻¹(x) = ${inf.InvExpr}`, `STEP 4 - Swap x and y: f⁻¹(x) = ${inf.InvExpr}`);
        verTr = `f(${a0}) = ${a}·(${a0})${suffix(b)} = ${b0}.  f⁻¹(${b0}) = (${b0}${suffix(-b)})/${a} = ${a0}. Yani f⁻¹(f(${a0})) = ${a0} ve f(f⁻¹(${b0})) = f(${a0}) = ${b0}.`;
        verEn = `f(${a0}) = ${a}·(${a0})${suffix(b)} = ${b0}.  f⁻¹(${b0}) = (${b0}${suffix(-b)})/${a} = ${a0}. So f⁻¹(f(${a0})) = ${a0} and f(f⁻¹(${b0})) = f(${a0}) = ${b0}.`;
        intTr = `f önce x'i ${a} ile çarpar sonra ${b >= 0 ? b + ' ekler' : (-b) + ' çıkarır'}; f⁻¹ işlemleri TERS SIRADA ve ters yönde yapar: önce ${b >= 0 ? b + ' çıkarır' : (-b) + ' ekler'}, sonra ${a}'ya böler. f⁻¹'in eğimi 1/${a} (a'nın çarpmaya göre tersi).`;
        intEn = `f first multiplies x by ${a} and then ${b >= 0 ? 'adds ' + b : 'subtracts ' + (-b)}; f⁻¹ undoes the operations in REVERSE ORDER and opposite direction: first ${b >= 0 ? 'subtract ' + b : 'add ' + (-b)}, then divide by ${a}. The slope of f⁻¹ is 1/${a}, the reciprocal of a.`;
        break;
      }
      case 1: {
        const t = Math.max(-2, Math.min(2, p.t));
        S(`Verilen: f(x) = ${F}. (Merkezi (${a}, ${b}) olan öteleme ile kaydırılmış x³.)`, `Given: f(x) = ${F}. (The cubic x³ shifted so that its centre is (${a}, ${b}).)`);
        S(`ADIM 1 - Bire-bir mi? x³ grafiği her yerde artandır, ötelemeler bunu bozmaz; her yatay doğru grafiği tam bir kez keser. Cebirsel kanıt: f(x₁) = f(x₂) ⇒ (x₁${suffix(-a)})³ = (x₂${suffix(-a)})³ ⇒ küp kök alınca x₁${suffix(-a)} = x₂${suffix(-a)} ⇒ x₁ = x₂. Sayısal: f(${a}) = ${b}, f(${a + 1}) = ${b + 1}, f(${a + 2}) = ${b + 8} hep farklı.`,
          `STEP 1 - One-to-one? The x³ graph is increasing everywhere and shifts do not change that; every horizontal line meets the graph exactly once. Algebraic proof: f(x₁) = f(x₂) ⇒ (x₁${suffix(-a)})³ = (x₂${suffix(-a)})³ ⇒ taking cube roots x₁${suffix(-a)} = x₂${suffix(-a)} ⇒ x₁ = x₂. Numerically: f(${a}) = ${b}, f(${a + 1}) = ${b + 1}, f(${a + 2}) = ${b + 8} are all different.`);
        S(`ADIM 2 - y = ${F}`, `STEP 2 - y = ${F}`);
        S(`ADIM 3 - x için çözelim: y${suffix(-b)} = ${xTerm(a)}³  ⇒  küp kök alalım: ∛(y${suffix(-b)}) = x${suffix(-a)}  ⇒  x = ∛(y${suffix(-b)})${suffix(a)}  (her reel sayının tek bir reel küp kökü vardır, negatifler dahil).`,
          `STEP 3 - Solve for x: y${suffix(-b)} = ${xTerm(a)}³  ⇒  we take cube roots: ∛(y${suffix(-b)}) = x${suffix(-a)}  ⇒  x = ∛(y${suffix(-b)})${suffix(a)}  (every real number has exactly one real cube root, negatives included).`);
        S(`ADIM 4 - x ile y'yi değiştir: f⁻¹(x) = ${inf.InvExpr}`, `STEP 4 - Swap x and y: f⁻¹(x) = ${inf.InvExpr}`);
        verTr = `f(${a0}) = (${a0}${suffix(-a)})³${suffix(b)} = ${t}³${suffix(b)} = ${b0}.  f⁻¹(${b0}) = ∛(${b0}${suffix(-b)})${suffix(a)} = ∛(${t * t * t})${suffix(a)} = ${t}${suffix(a)} = ${a0}.`;
        verEn = verTr;
        intTr = 'f küpe yükseltip kaydırır; f⁻¹ geri kaydırıp KÜP KÖK alır. Küp kök negatif sayılar için de tanımlı olduğundan her iki fonksiyonun tanım kümesi tüm reel sayılardır.';
        intEn = 'f cubes and shifts; f⁻¹ shifts back and takes the CUBE ROOT. A cube root exists for negative numbers too, so both functions are defined on all reals.';
        break;
      }
      case 2: {
        const t = Math.abs(p.t);
        S(`Verilen: f(x) = ${F}. Tanım kümesi x ≥ ${a} (kökün içi negatif olamaz), değer kümesi y ≥ ${b} (karekök en az 0).`, `Given: f(x) = ${F}. Domain x ≥ ${a} (the radicand cannot be negative), range y ≥ ${b} (a square root is at least 0).`);
        S(`ADIM 1 - Bire-bir mi? Karekök fonksiyonu kesin artandır, +${b} ötelemesi bunu bozmaz; her yatay doğru grafiği en çok bir kez keser. Cebirsel kanıt: f(x₁) = f(x₂) ⇒ √(x₁${suffix(-a)}) = √(x₂${suffix(-a)}) ⇒ (kare alırız) x₁ = x₂. Sayısal: f(${a}) = ${b}, f(${a + 1}) = ${b + 1}, f(${a + 4}) = ${b + 2} hep farklı.`,
          `STEP 1 - One-to-one? The square root function is strictly increasing and the shift keeps that; every horizontal line meets the graph at most once. Algebraic proof: f(x₁) = f(x₂) ⇒ √(x₁${suffix(-a)}) = √(x₂${suffix(-a)}) ⇒ (square) x₁ = x₂. Numerically: f(${a}) = ${b}, f(${a + 1}) = ${b + 1}, f(${a + 4}) = ${b + 2} are all different.`);
        S(`ADIM 2 - y = ${F}`, `STEP 2 - y = ${F}`);
        S(`ADIM 3 - x için çözelim: önce kökü yalnız bırak: y${suffix(-b)} = ${sqrtOf(-a)}  (bu yüzden y ≥ ${b} olmalı). Her iki yanın karesini alırsak: (y${suffix(-b)})² = x${suffix(-a)}  ⇒  x = (y${suffix(-b)})²${suffix(a)}.`,
          `STEP 3 - Solve for x: first isolate the root: y${suffix(-b)} = ${sqrtOf(-a)}  (so we need y ≥ ${b}). Square both sides: (y${suffix(-b)})² = x${suffix(-a)}  ⇒  x = (y${suffix(-b)})²${suffix(a)}.`);
        S(`ADIM 4 - x ile y'yi değiştir: f⁻¹(x) = ${inf.InvExpr}, YALNIZCA x ≥ ${b} için (aksi halde parabolün diğer yarısına geçeriz).`,
          `STEP 4 - Swap x and y: f⁻¹(x) = ${inf.InvExpr}, ONLY for x ≥ ${b} (otherwise we would pick up the other half of the parabola).`);
        verTr = `f(${a0}) = √(${a0}${suffix(-a)})${suffix(b)} = √${t * t}${suffix(b)} = ${t}${suffix(b)} = ${b0}.  f⁻¹(${b0}) = (${b0}${suffix(-b)})²${suffix(a)} = ${t}²${suffix(a)} = ${t * t}${suffix(a)} = ${a0}.`;
        verEn = verTr;
        intTr = 'f karekök alır, f⁻¹ kare alır. f⁻¹ bir tam parabol değil, yalnızca x ≥ ' + b + ' için çizilen YARIM parabolün (sağ kolun) kendisidir: bu kısıt f\'nin değer kümesinden gelir.';
        intEn = 'f takes a square root, f⁻¹ squares. f⁻¹ is not a full parabola but only the HALF parabola drawn for x ≥ ' + b + ': that restriction comes from the range of f.';
        break;
      }
      case 3: {
        if (!inf.valid) {
          S(`Verilen: f(x) = ${F}.`, `Given: f(x) = ${F}.`);
          if (c === 0 && d === 0) {
            S('Payda her yerde 0: f hiçbir yerde tanımlı değil. Sağdaki c ya da d kaydırıcısını değiştirerek deneyebiliriz.', 'The denominator is 0 everywhere: f is not defined anywhere. We can try changing the c or d slider.');
          } else {
            S(`ADIM 1 - ad - bc = ${a}·(${d}) - (${b})·(${c}) = ${a * d - b * c} ! Bu durumda f(x) = ${frac(a, c)} sabit fonksiyondur (x = ${frac(-d, c)} dışında): her yatay doğru ya hiç kesmez ya da sonsuz noktada keser.`,
              `STEP 1 - ad - bc = ${a}·(${d}) - (${b})·(${c}) = ${a * d - b * c} ! Then f(x) = ${frac(a, c)} is a constant function (except at x = ${frac(-d, c)}): a horizontal line either misses it or meets it everywhere.`);
            S('SONUÇ: f bire-bir DEĞİL, ters fonksiyonu YOKTUR. Bire-birlik için ad - bc ≠ 0 gerekir; kaydırıcılardan birini değiştirerek deneyebiliriz.',
              'RESULT: f is NOT one-to-one and has NO inverse. One-to-one needs ad - bc ≠ 0; move one of the sliders.');
          }
          return steps;
        }
        const det = a * d - b * c;
        const A0i = Math.trunc(inf.A0);
        const nn = a * A0i + b, mm = c * A0i + d;
        S(`Verilen: f(x) = ${F}  (a, b, c, d) = (${a}, ${b}, ${c}, ${d}).`, `Given: f(x) = ${F}  (a, b, c, d) = (${a}, ${b}, ${c}, ${d}).`);
        S(`ADIM 1 - Bire-bir mi? ad - bc = ${a}·(${d}) - (${b})·(${c}) = ${det} ≠ 0. Cebirsel kanıt: f(x₁) - f(x₂) = (ad - bc)(x₁ - x₂) / [(cx₁ + d)(cx₂ + d)]. Pay ancak x₁ = x₂ iken 0 olabileceğinden f(x₁) = f(x₂) ⇒ x₁ = x₂. Grafik: ${c !== 0 ? 'iki kolu olan bir hiperbol (yatay doğrular her kolu en çok bir kez keser)' : 'bir doğru'}.`,
          `STEP 1 - One-to-one? ad - bc = ${a}·(${d}) - (${b})·(${c}) = ${det} ≠ 0. Algebraic proof: f(x₁) - f(x₂) = (ad - bc)(x₁ - x₂) / [(cx₁ + d)(cx₂ + d)]. The numerator can be 0 only when x₁ = x₂, so f(x₁) = f(x₂) ⇒ x₁ = x₂. Graph: ${c !== 0 ? 'a hyperbola with two branches (a horizontal line meets each branch at most once)' : 'a line'}.`);
        S(`ADIM 2 - y = ${F}`, `STEP 2 - y = ${F}`);
        S(`ADIM 3a - Paydayı çarp: y·(${polyStr(d, c)}) = ${polyStr(b, a)}`, `STEP 3a - Clear the denominator: y·(${polyStr(d, c)}) = ${polyStr(b, a)}`);
        S(`ADIM 3b - Dağıt: ${sum([c, d], ['xy', 'y'])} = ${polyStr(b, a)}`, `STEP 3b - Expand: ${sum([c, d], ['xy', 'y'])} = ${polyStr(b, a)}`);
        S(`ADIM 3c - x'li terimleri sola, diğerlerini sağa topla: ${sum([c, -a], ['xy', 'x'])} = ${sum([-d, b], ['y', ''])}`, `STEP 3c - Collect the x-terms on the left and the rest on the right: ${sum([c, -a], ['xy', 'x'])} = ${sum([-d, b], ['y', ''])}`);
        S(`ADIM 3d - x'i parantezine al: x·(${sum([c, -a], ['y', ''])}) = ${sum([-d, b], ['y', ''])}  ⇒  x = (${sum([-d, b], ['y', ''])}) / (${sum([c, -a], ['y', ''])}). Pay ve paydayı -1 ile çarparsak: x = (${sum([d, -b], ['y', ''])}) / (${sum([-c, a], ['y', ''])}).`,
          `STEP 3d - Factor out x: x·(${sum([c, -a], ['y', ''])}) = ${sum([-d, b], ['y', ''])}  ⇒  x = (${sum([-d, b], ['y', ''])}) / (${sum([c, -a], ['y', ''])}). Multiplying numerator and denominator by -1: x = (${sum([d, -b], ['y', ''])}) / (${sum([-c, a], ['y', ''])}).`);
        S(`ADIM 4 - x ile y'yi değiştir: f⁻¹(x) = ${inf.InvExpr}   (genel kural: (ax+b)/(cx+d) ⇒ (dx-b)/(-cx+a)).`, `STEP 4 - Swap x and y: f⁻¹(x) = ${inf.InvExpr}   (general rule: (ax+b)/(cx+d) ⇒ (dx-b)/(-cx+a)).`);
        if (c !== 0) {
          S(`Dışlanan değerler: f için x ≠ ${frac(-d, c)} (payda 0) ve y ≠ ${frac(a, c)} (denklemin x'i çözülemeyen değeri); f⁻¹ için bunlar yer değiştirir: x ≠ ${frac(a, c)}. Grafikte f'nin dikey asimptotu x = ${frac(-d, c)}, f⁻¹'in YATAY asimptotu y = ${frac(-d, c)} olur (ve tersi).`,
            `Excluded values: for f, x ≠ ${frac(-d, c)} (zero denominator) and y ≠ ${frac(a, c)} (the value for which the equation cannot be solved for x); for f⁻¹ they swap: x ≠ ${frac(a, c)}. On the graph the vertical asymptote x = ${frac(-d, c)} of f becomes the HORIZONTAL asymptote y = ${frac(-d, c)} of f⁻¹ (and vice versa).`);
        }
        const fwd = `${nn}/${mm}` + (`${nn}/${mm}` === b0 ? '' : ' = ' + b0);
        const invNum = d * nn - b * mm, invDen = -c * nn + a * mm;
        verTr = `f(${a0}) = (${a}·(${a0})${suffix(b)})/(${c}·(${a0})${suffix(d)}) = ${fwd}.  f⁻¹(${b0}) = (${d}·(${b0})${suffix(-b)})/(${-c}·(${b0})${suffix(a)}) = (${invNum}/${mm}) / (${invDen}/${mm}) = ${frac(invNum, invDen)}.`;
        verEn = verTr;
        intTr = "Ters fonksiyon yine aynı türden bir kesirli ifadedir. Asimptotlar aynadaki gibi yer değiştirir: f'nin sınırsız büyüdüğü yer, f⁻¹'in yaklaştığı değerdir.";
        intEn = 'The inverse is again a fraction of the same type. The asymptotes swap like a mirror image: where f blows up, f⁻¹ levels off.';
        break;
      }
      case 4: {
        const bs = baseText(p), lg = logName(p);
        const isE = p.baseIdx === 3;
        S(`Verilen: f(x) = ${F}. Taban ${bs} > 0 ve ≠ 1; üstel fonksiyon her zaman pozitiftir, dolayısıyla f(x) > ${b}.`, `Given: f(x) = ${F}. The base ${bs} is positive and ≠ 1; an exponential is always positive, so f(x) > ${b}.`);
        S(`ADIM 1 - Bire-bir mi? ${bs}^x ${p.baseIdx === 2 ? 'kesin AZALAN' : 'kesin ARTAN'} bir fonksiyondur, yatay doğrular y = ${b} asimptotunun üstünde grafiği tam bir kez keser. Cebirsel kanıt: ${bs}^x₁${suffix(b)} = ${bs}^x₂${suffix(b)} ⇒ ${bs}^x₁ = ${bs}^x₂ ⇒ x₁ = x₂. Sayısal: f(0) = ${n2(1 + b)}, f(1) = ${n2(baseVal(p) + b)} farklı.`,
          `STEP 1 - One-to-one? ${bs}^x is strictly ${p.baseIdx === 2 ? 'DECREASING' : 'INCREASING'}; every horizontal line above the asymptote y = ${b} meets the graph exactly once. Algebraic proof: ${bs}^x₁${suffix(b)} = ${bs}^x₂${suffix(b)} ⇒ ${bs}^x₁ = ${bs}^x₂ ⇒ x₁ = x₂. Numerically: f(0) = ${n2(1 + b)}, f(1) = ${n2(baseVal(p) + b)} differ.`);
        S(`ADIM 2 - y = ${F}`, `STEP 2 - y = ${F}`);
        S(`ADIM 3 - x için çözelim: y${suffix(-b)} = ${bs}^x  (y > ${b} olmalı). Her iki yanın ${isE ? 'doğal logaritmasını (ln)' : bs + ' tabanında logaritmasını'} al: ${isE ? 'ln' : lg}(y${suffix(-b)}) = ${isE ? 'ln(e^x)' : lg + '(' + bs + '^x)'} = x.`,
          `STEP 3 - Solve for x: y${suffix(-b)} = ${bs}^x  (we need y > ${b}). Take the ${isE ? 'natural logarithm (ln)' : 'logarithm base ' + bs} of both sides: ${isE ? 'ln' : lg}(y${suffix(-b)}) = ${isE ? 'ln(e^x)' : lg + '(' + bs + '^x)'} = x.`);
        S(`ADIM 4 - x ile y'yi değiştir: f⁻¹(x) = ${inf.InvExpr}, x > ${b} için.`, `STEP 4 - Swap x and y: f⁻¹(x) = ${inf.InvExpr}, for x > ${b}.`);
        const pw = n2(round(Math.pow(baseVal(p), p.t), 4));
        verTr = `f(${a0}) = ${bs}^(${a0})${suffix(b)} = ${b0}.  f⁻¹(${b0}) = ${lg}(${b0}${suffix(-b)}) = ${lg}(${pw}) = ${lg}(${bs}^(${a0})) = ${a0}.`;
        verEn = verTr;
        intTr = "Üstel fonksiyon ile logaritma birbirinin tersidir: logaritma 'bu değeri elde etmek için tabanın kaçıncı kuvveti gerekir?' sorusunu yanıtlar. Üstelin yatay asimptotu y = " + b + ', logaritmanın dikey asimptotu x = ' + b + ' olur.';
        intEn = "The exponential and the logarithm are inverses: the logarithm answers 'to what power must the base be raised to get this value?'. The horizontal asymptote y = " + b + ' of the exponential becomes the vertical asymptote x = ' + b + ' of the logarithm.';
        break;
      }
      case 5: {
        const t = Math.max(1, Math.abs(p.t));
        const sgn = p.branch === 0 ? '≥' : '≤';
        const other = p.branch === 0 ? '≤' : '≥';
        S(`Verilen: f(x) = ${F} (parabol; tepe noktası (${a}, ${b})).`, `Given: f(x) = ${F} (a parabola with vertex (${a}, ${b})).`);
        S(`ADIM 1 - Bire-bir mi? HAYIR. y = ${inf.B0T} yatay doğrusu grafiği iki noktada keser: f(${a - t}) = (${a - t}${suffix(-a)})²${suffix(b)} = ${t * t + b} ve f(${a + t}) = (${a + t}${suffix(-a)})²${suffix(b)} = ${t * t + b}. Farklı iki girdi aynı çıktıyı veriyor ⇒ yatay doğru testi BAŞARISIZ ⇒ f'nin (tüm reel sayılarda) tersi YOKTUR.`,
          `STEP 1 - One-to-one? NO. The horizontal line y = ${inf.B0T} meets the graph in two points: f(${a - t}) = (${a - t}${suffix(-a)})²${suffix(b)} = ${t * t + b} and f(${a + t}) = (${a + t}${suffix(-a)})²${suffix(b)} = ${t * t + b}. Two different inputs give the same output ⇒ the horizontal line test FAILS ⇒ f has NO inverse on all of ℝ.`);
        S(`ÇARE - Tanım kümesini KISITLA: x ${sgn} ${a} alınırsa parabolün tek bir kolu kalır; orada f kesin ${p.branch === 0 ? 'artan' : 'azalan'}dır ve bire-birdir. (Seçilen: x ${sgn} ${a}; alternatif x ${other} ${a} sağdaki seçenek düğmeleriyle denenir, grafikte soluk gösterilir.)`,
          `REMEDY - RESTRICT the domain: taking x ${sgn} ${a} keeps just one branch of the parabola, on which f is strictly ${p.branch === 0 ? 'increasing' : 'decreasing'} and one-to-one. (Chosen: x ${sgn} ${a}; the alternative x ${other} ${a} can be tried with the radio buttons and is shown faintly on the graph.)`);
        S(`ADIM 2 - y = ${F}, x ${sgn} ${a}`, `STEP 2 - y = ${F}, x ${sgn} ${a}`);
        const sgnPM = p.branch === 0 ? '+' : '-', minus = p.branch === 0 ? '' : '-';
        S(`ADIM 3 - x için çözelim: y${suffix(-b)} = (${xSuf(-a)})²  (y ≥ ${b} olmalı)  ⇒  kök al: x${suffix(-a)} = ±√(y${suffix(-b)}). Kısıtımız x ${sgn} ${a}, yani x${suffix(-a)} ${sgn} 0 olduğundan ${sgnPM} işaretini seçeriz: x = ${minus}√(y${suffix(-b)})${suffix(a)}.`,
          `STEP 3 - Solve for x: y${suffix(-b)} = (${xSuf(-a)})²  (we need y ≥ ${b})  ⇒  take roots: x${suffix(-a)} = ±√(y${suffix(-b)}). Our restriction is x ${sgn} ${a}, i.e. x${suffix(-a)} ${sgn} 0, so we pick the ${sgnPM} sign: x = ${minus}√(y${suffix(-b)})${suffix(a)}.`);
        S(`ADIM 4 - x ile y'yi değiştir: f⁻¹(x) = ${inf.InvExpr}  (kısıtlı f'nin tersi). Alternatif kol için ters: ${p.branch === 0 ? '-' : ''}${sqrtOf(-b)}${suffix(a)}.`,
          `STEP 4 - Swap x and y: f⁻¹(x) = ${inf.InvExpr}  (the inverse of the restricted f). For the other branch the inverse is ${p.branch === 0 ? '-' : ''}${sqrtOf(-b)}${suffix(a)}.`);
        const wrong = n2(a + (p.branch === 0 ? -t : t));
        verTr = `f(${a0}) = (${a0}${suffix(-a)})²${suffix(b)} = ${t * t}${suffix(b)} = ${b0}.  f⁻¹(${b0}) = ${minus}√(${b0}${suffix(-b)})${suffix(a)} = ${minus}√${t * t}${suffix(a)} = ${minus}${t}${suffix(a)} = ${a0}. (Yanlış işaret seçseydik ${wrong} bulurduk: öbür kolun noktası.)`;
        verEn = `f(${a0}) = (${a0}${suffix(-a)})²${suffix(b)} = ${t * t}${suffix(b)} = ${b0}.  f⁻¹(${b0}) = ${minus}√(${b0}${suffix(-b)})${suffix(a)} = ${minus}√${t * t}${suffix(a)} = ${minus}${t}${suffix(a)} = ${a0}. (With the wrong sign we would get ${wrong}: the point of the other branch.)`;
        intTr = 'Bire-bir olmayan bir fonksiyonun ters fonksiyonu için tanım kümesi kısıtlanır; hangi kolu seçtiğin tersin formülünü (±√) ve değer kümesini belirler. x² için x ≥ 0 kısıtı √x verir.';
        intEn = 'To invert a function that is not one-to-one, restrict its domain; the branch you choose decides the formula (±√) and the range of the inverse. For x², the restriction x ≥ 0 gives √x.';
        break;
      }
      case 6: {
        S(`Verilen: f(x) = ${F}.`, `Given: f(x) = ${F}.`);
        if (!inf.valid) {
          S(`ADIM 1 - Bire-bir mi? p = ${a} < 0 olduğundan f'(x) = 3x² + p, |x| küçükken NEGATİFtir: grafik artar, azalır, yine artar (bir tümsek/çukur oluşur). Bazı yatay doğrular grafiği 3 noktada keser ⇒ f bire-bir DEĞİL. Çare: kısıtlama (örn. grafiğin yükseldiği bir parça). 'p' kaydırıcısını 0 ya da pozitif yaparak deneyebiliriz.`,
            `STEP 1 - One-to-one? Since p = ${a} < 0, f'(x) = 3x² + p is NEGATIVE for small |x|: the graph rises, falls and rises again (a hump). Some horizontal lines meet it 3 times ⇒ f is NOT one-to-one. Remedy: restrict the domain. Move the 'p' slider to 0 or a positive number.`);
          return steps;
        }
        S(`ADIM 1 - Bire-bir mi? x₁ < x₂ ise x₁³ < x₂³ ve ${cf(a)}x₁ ≤ ${cf(a)}x₂ (p = ${a} ≥ 0) olduğundan f(x₁) < f(x₂): f KESİN ARTANDIR, yatay doğru testini geçer ⇒ bire-bir, ters fonksiyonu vardır.`,
          `STEP 1 - One-to-one? If x₁ < x₂ then x₁³ < x₂³ and ${cf(a)}x₁ ≤ ${cf(a)}x₂ (p = ${a} ≥ 0), so f(x₁) < f(x₂): f is STRICTLY INCREASING, passes the horizontal line test ⇒ one-to-one, an inverse exists.`);
        S(`ADIM 2 - y = ${F}`, `STEP 2 - y = ${F}`);
        S(`ADIM 3 - x için çözmeye çalış: ${F} = y üçüncü dereceden bir denklemdir; x'i y cinsinden basit (kök/logaritma içeren kısa) bir formülle YAZAMAYIZ. Ters fonksiyon vardır ama formülü yoktur; adım 4'te x ile y'yi değiştirmek de bir şey kazandırmaz.`,
          `STEP 3 - Try to solve for x: ${F} = y is a cubic equation; we CANNOT write x in terms of y with a short formula. The inverse exists but has no simple formula; swapping x and y in step 4 gains nothing.`);
        S(`ADIM 4 - Formül gerekmez: f⁻¹(${b0}) = t, f(t) = ${b0} demektir. YARILAMA ile çöz ([-8, 8] aralığı, f artan):`,
          `STEP 4 - No formula is needed: f⁻¹(${b0}) = t means f(t) = ${b0}. Solve it by BISECTION (interval [-8, 8], f increasing):`);
        let lo = -8.0, hi = 8.0;
        const y0 = inf.B0;
        for (let i = 1; i <= 6; i++) {
          const mid = (lo + hi) / 2;
          const fm = fn(p, mid);
          const goRight = fm < y0;
          steps.push('     ' + tx(
            `${i}. [${n2(lo)}, ${n2(hi)}]: orta = ${n2(mid)}, f(orta) = ${n2(round(fm, 3))} ${goRight ? '<' : '>'} ${b0} → ` + (goRight ? 'sağ yarıyı al.' : 'sol yarıyı al.'),
            `${i}. [${n2(lo)}, ${n2(hi)}]: mid = ${n2(mid)}, f(mid) = ${n2(round(fm, 3))} ${goRight ? '<' : '>'} ${b0} → ` + (goRight ? 'keep the right half.' : 'keep the left half.')));
          if (goRight) lo = mid; else hi = mid;
        }
        const aR = n2(round(inf.A0, 3));
        S(`Devam edilince (60 yarılama) t ≈ ${aR} bulunur: f⁻¹(${b0}) ≈ ${aR}. Grafikte bu, y = ${b0} yüksekliğine ulaşan x değerini YANA doğru okumaktır.`,
          `Continuing (60 halvings) gives t ≈ ${aR}: f⁻¹(${b0}) ≈ ${aR}. On the graph this means reading, SIDEWAYS, the x-value at which the curve reaches height y = ${b0}.`);
        const fAt = n2(round(fn(p, round(inf.A0, 3)), 3));
        verTr = `f(${aR}) = ${fAt} ≈ ${b0}  ⇒ f(f⁻¹(${b0})) ≈ ${b0} ✓. Tanım/değer kümeleri: f ve f⁻¹ için tüm reel sayılar.`;
        verEn = `f(${aR}) = ${fAt} ≈ ${b0}  ⇒ f(f⁻¹(${b0})) ≈ ${b0} ✓. Domain/range: all real numbers for both f and f⁻¹.`;
        intTr = "Bir ters fonksiyonun var olması için formülünün olması gerekmez; bire-birlik yeterlidir. f⁻¹'in değerleri, grafik y = x'e göre aynalanarak ya da sayısal yöntemlerle bulunur.";
        intEn = 'An inverse exists whenever f is one-to-one, with or without a formula. Values of f⁻¹ come from reflecting the graph in y = x or from numerical methods.';
        break;
      }
      default: {
        const fT = 32 + 9 * p.t, cT = 5 * p.t;
        S("Verilen: C = f(F) = (5/9)(F - 32). Grafikte x = F (°F), y = C (°C) alınır. Amaç: °C'yi °F'ye çeviren ters fonksiyon.",
          'Given: C = f(F) = (5/9)(F - 32). On the graph x = F (°F), y = C (°C). Goal: the inverse, which converts °C back to °F.');
        S('ADIM 1 - Bire-bir mi? Grafik eğimi 5/9 ≠ 0 olan bir doğrudur; her sıcaklık farklı bir °C verir (F₁ ≠ F₂ ⇒ f(F₁) - f(F₂) = (5/9)(F₁ - F₂) ≠ 0). Bire-bir. Sayısal: f(32) = 0, f(212) = 100.',
          'STEP 1 - One-to-one? The graph is a line of slope 5/9 ≠ 0; different temperatures give different °C values (F₁ ≠ F₂ ⇒ f(F₁) - f(F₂) = (5/9)(F₁ - F₂) ≠ 0). One-to-one. Numerically: f(32) = 0, f(212) = 100.');
        S('ADIM 2 - C = (5/9)(F - 32)', 'STEP 2 - C = (5/9)(F - 32)');
        S('ADIM 3 - F için çöz: iki yanı 9/5 ile çarp: (9/5)C = F - 32  ⇒  F = (9/5)C + 32.', 'STEP 3 - Solve for F: multiply both sides by 9/5: (9/5)C = F - 32  ⇒  F = (9/5)C + 32.');
        S('ADIM 4 - Girdi değişkenini x ile göster: f⁻¹(x) = (9/5)x + 32  (x: °C, sonuç: °F).', 'STEP 4 - Call the input variable x: f⁻¹(x) = (9/5)x + 32  (x: °C, result: °F).');
        verTr = `f(${fT}) = (5/9)(${fT} - 32) = (5/9)·${fT - 32} = ${cT}.  f⁻¹(${cT}) = (9/5)·(${cT}) + 32 = ${9 * p.t} + 32 = ${fT}. Gerçek hayat: ${fT}°F = ${cT}°C ve ${cT}°C = ${fT}°F.`;
        verEn = `f(${fT}) = (5/9)(${fT} - 32) = (5/9)·${fT - 32} = ${cT}.  f⁻¹(${cT}) = (9/5)·(${cT}) + 32 = ${9 * p.t} + 32 = ${fT}. In real life: ${fT}°F = ${cT}°C and ${cT}°C = ${fT}°F.`;
        intTr = "f °F'yi °C'ye, f⁻¹ °C'yi °F'ye çevirir; biri diğerinin yaptığını geri alır. (a, b) = (°F, °C) çifti ile (b, a) çifti aynı dönüşümün iki yönüdür: girdi ve çıktı rol değiştirir.";
        intEn = 'f converts °F to °C, f⁻¹ converts °C to °F; each undoes the other. The pair (a, b) = (°F, °C) and the pair (b, a) are the same conversion in two directions: input and output swap roles.';
      }
    }

    // ---- common tail ----
    S(`Tanım ve değer kümeleri: f: tanım ${inf.DomF}, değer ${inf.RngF}.  f⁻¹: tanım ${inf.DomI}, değer ${inf.RngI}.  (Tanım(f⁻¹) = Değer(f) ve Değer(f⁻¹) = Tanım(f)` + (p.kind === 5 ? ', kısıtlı f için' : '') + '.)',
      `Domains and ranges: f: domain ${inf.DomF}, range ${inf.RngF}.  f⁻¹: domain ${inf.DomI}, range ${inf.RngI}.  (Domain(f⁻¹) = Range(f) and Range(f⁻¹) = Domain(f)` + (p.kind === 5 ? ', for the restricted f' : '') + '.)');
    S('DOĞRULAMA: ' + verTr, 'CHECK: ' + verEn);
    const mid2 = inv2((inf.A0 + inf.B0) / 2);
    S(`GRAFİK: (a, b) = (${a0}, ${b0}) noktası f üzerinde, (b, a) = (${b0}, ${a0}) noktası f⁻¹ üzerindedir. Bu iki noktayı birleştiren yeşil doğru parçası y = x'e diktir (eğimi -1) ve orta noktası (${mid2}, ${mid2}) y = x üzerindedir: f⁻¹, f'nin y = x'e göre AYNA GÖRÜNTÜSÜDÜR.`,
      `GRAPH: the point (a, b) = (${a0}, ${b0}) lies on f and (b, a) = (${b0}, ${a0}) lies on f⁻¹. The green segment joining them is perpendicular to y = x (slope -1) and its midpoint (${mid2}, ${mid2}) lies on y = x: f⁻¹ is the MIRROR IMAGE of f in y = x.`);
    S('YORUM: ' + intTr, 'MEANING: ' + intEn);
    const rc = recip(p, inf);
    S('NOT: f⁻¹(x) ile 1/f(x) birbirine karıştırılmamalıdır. Burada f⁻¹(' + b0 + ') = ' + a0 + ' iken 1/f(' + a0 + ') = ' + rc + '.',
      'NOTE: it helps not to confuse f⁻¹(x) with 1/f(x). Here f⁻¹(' + b0 + ') = ' + a0 + ' whereas 1/f(' + a0 + ') = ' + rc + '.');
    return steps;
  }

  // ---------- drawing ----------
  const F_COLOR = '#1e90ff';                    // DodgerBlue
  const G_COLOR = '#ff4500';                    // OrangeRed
  const F_FAINT = 'rgba(30,144,255,0.43)';
  const G_FAINT = 'rgba(255,69,0,0.43)';
  const VIOLET = '#c71585';                     // MediumVioletRed

  function aspectOf(canvas) {
    const el = canvas.canvas;
    if (el && el.clientWidth > 50 && el.clientHeight > 50) return el.clientWidth / el.clientHeight;
    return 1.4;
  }

  function draw(canvas, p) {
    const inf = getInfo(p);
    updateControls(p);

    const aspect = aspectOf(canvas);
    const centre = p.kind === 7 ? 25.0 : 0.0;
    const a0 = isNaN(inf.A0) ? centre : inf.A0, b0 = isNaN(inf.B0) ? centre : inf.B0;
    let m = Math.max(Math.abs(a0 - centre), Math.abs(b0 - centre));
    if (p.kind !== 7 && p.kind !== 0 && p.kind !== 6 && p.kind !== 3) m = Math.max(m, Math.max(Math.abs(p.a), Math.abs(p.b)));
    if (p.kind === 3 && p.c !== 0) m = Math.max(m, Math.max(Math.abs(p.d / p.c), Math.abs(p.a / p.c)));
    let hh = Math.max(p.kind === 7 ? 45.0 : 7.0, Math.ceil(m * 1.25) + 2);
    hh = Math.max(hh, hh / Math.min(1.0, aspect)); // narrow canvas: widen so the x-range still covers the points
    canvas.setViewport(centre - hh * aspect, centre + hh * aspect, centre - hh, centre + hh);

    // mirror line y = x
    canvas.addFunction({ evaluator: (x) => x, color: canvas.gray(), thickness: 1.5, dashed: true, label: 'y = x' });

    if (p.kind === 5) {
      canvas.addFunction({ evaluator: (x) => fn(p, x), color: F_FAINT, thickness: 1.5, dashed: true });
      // alternative branch inverse, faint
      canvas.addFunction({ evaluator: (x) => (x < p.b ? NaN : p.a + (p.branch === 0 ? -1 : 1) * Math.sqrt(x - p.b)), color: G_FAINT, thickness: 1.5, dashed: true });
    }
    canvas.addFunction({ evaluator: (x) => fRestricted(p, x), color: F_COLOR, thickness: 3.0, label: 'f' });

    if (inf.valid) {
      if (p.kind === 6) {
        canvas.addParametric({ xOfT: (t) => fn(p, t), yOfT: (t) => t, tMin: -12, tMax: 12, samples: 800, color: G_COLOR, thickness: 3.0 });
      } else {
        canvas.addFunction({ evaluator: (x) => inv(p, x), color: G_COLOR, thickness: 3.0, label: 'f⁻¹' });
      }
    }
    if (p.kind === 5) {
      // horizontal line test: y = b meets the full parabola twice
      const t = Math.max(1, Math.abs(p.t));
      canvas.addGuideLine({ axis: 'horizontal', position: inf.B0, color: VIOLET });
      canvas.addMarker({ x: p.a - t, y: inf.B0, color: VIOLET, radius: 5, hollow: p.branch === 0 });
      canvas.addMarker({ x: p.a + t, y: inf.B0, color: VIOLET, radius: 5, hollow: p.branch === 1 });
    }
    // asymptotes
    if (p.kind === 3 && p.c !== 0 && inf.valid) {
      canvas.addGuideLine({ axis: 'vertical', position: -p.d / p.c, color: F_COLOR });
      canvas.addGuideLine({ axis: 'horizontal', position: p.a / p.c, color: F_COLOR });
      canvas.addGuideLine({ axis: 'vertical', position: p.a / p.c, color: G_COLOR });
      canvas.addGuideLine({ axis: 'horizontal', position: -p.d / p.c, color: G_COLOR });
    } else if (p.kind === 4) {
      canvas.addGuideLine({ axis: 'horizontal', position: p.b, color: F_COLOR });
      canvas.addGuideLine({ axis: 'vertical', position: p.b, color: G_COLOR });
    }

    // the marker pair (a, b) on f and (b, a) on f^-1, with the segment joining them
    if (inf.valid && !isNaN(inf.A0) && !isNaN(inf.B0)) {
      canvas.addSegment({ x1: inf.A0, y1: inf.B0, x2: inf.B0, y2: inf.A0, color: canvas.green(), thickness: 2.0, dashed: true });
      canvas.addMarker({ x: inf.A0, y: inf.B0, color: canvas.gold(), radius: 6.5, label: `(${inf.A0T}, ${inf.B0T})` });
      canvas.addMarker({ x: inf.B0, y: inf.A0, color: canvas.gold(), radius: 6.5, label: `(${inf.B0T}, ${inf.A0T})` });
    }
  }

  // ---------- controls ----------
  function paramCaptions(kind) {
    switch (kind) {
      case 0: return [tx('a (eğim, ≠ 0)', 'a (slope, ≠ 0)'), tx('b (y-kesişimi)', 'b (y-intercept)'), '-', '-'];
      case 1: case 2: case 5: return [tx('h (yatay kayma)', 'h (horizontal shift)'), tx('k (dikey kayma)', 'k (vertical shift)'), '-', '-'];
      case 3: return ['a', 'b', 'c', 'd  (f = (ax+b)/(cx+d))'];
      case 4: return [tx('- (taban rastgele)', '- (base is random)'), tx('k (dikey kayma)', 'k (vertical shift)'), '-', '-'];
      case 6: return ['p  (f = x³ + px + q)', 'q', '-', '-'];
      default: return ['-', '-', '-', '-'];
    }
  }
  function testCaption(kind) {
    switch (kind) {
      case 1: return tx('Test noktası T:  a = h + T  (|T| ≤ 2)', 'Test point T:  a = h + T  (|T| ≤ 2)');
      case 2: return tx('Test noktası T:  a = h + T²', 'Test point T:  a = h + T²');
      case 5: return tx('Test noktası T:  a = h ± |T|', 'Test point T:  a = h ± |T|');
      case 6: return tx('Hedef T:  f⁻¹(5·T) hesaplanır', 'Target T:  computes f⁻¹(5·T)');
      case 7: return tx('Test noktası T:  °F = 32 + 9T', 'Test point T:  °F = 32 + 9T');
      default: return tx('Test noktası a (T)', 'Test point a (T)');
    }
  }
  function usedParams(kind) {
    switch (kind) {
      case 0: case 1: case 2: case 5: case 6: return [true, true, false, false];
      case 3: return [true, true, true, true];
      case 4: return [false, true, false, false];
      default: return [false, false, false, false];
    }
  }
  const PARAM_KEYS = ['a', 'b', 'c', 'd'];

  // Per-mount UI handles (filled by buildControls, read by updateControls from draw()).
  let ui = null;

  function updateControls(p) {
    if (!ui) return;
    const caps = paramCaptions(p.kind), used = usedParams(p.kind);
    for (let i = 0; i < 4; i++) {
      const row = ui.params[i];
      row.caption.textContent = caps[i];
      row.input.disabled = !used[i];
      row.block.style.opacity = used[i] ? '1' : '0.45';
      row.input.value = String(p[PARAM_KEYS[i]]);
      row.value.textContent = String(p[PARAM_KEYS[i]]);
    }
    ui.test.caption.textContent = testCaption(p.kind);
    ui.test.input.value = String(p.t);
    ui.test.value.textContent = String(p.t);
    ui.header.textContent = tx('Kısıtlama (yalnızca bire-bir olmayan örnek):', 'Restriction (non-one-to-one example only):');
    const names = [tx('x ≥ h  (sağ kol)', 'x ≥ h  (right branch)'), tx('x ≤ h  (sol kol)', 'x ≤ h  (left branch)')];
    for (let i = 0; i < 2; i++) {
      ui.radios[i].span.textContent = names[i];
      ui.radios[i].input.disabled = p.kind !== 5;
      ui.radios[i].input.checked = p.branch === i;
      ui.radios[i].row.style.opacity = p.kind === 5 ? '1' : '0.45';
    }
  }

  function buildControls(rightCol, getProblem, h) {
    // The equal-scale viewport depends on the canvas pixel size: re-run draw() when the window resizes.
    window.addEventListener('resize', () => h.refresh());

    ui = { params: [], radios: [], test: null, header: null };
    const radioName = 'inv-branch-' + Math.random().toString(36).slice(2);

    const header = document.createElement('div');
    header.className = 'we-slider-caption';
    header.style.fontWeight = 'bold';
    rightCol.appendChild(header);
    ui.header = header;
    for (let i = 0; i < 2; i++) {
      const row = document.createElement('label');
      row.className = 'we-radio-row';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = radioName;
      const span = document.createElement('span');
      row.appendChild(input);
      row.appendChild(span);
      rightCol.appendChild(row);
      const idx = i;
      input.addEventListener('change', () => { if (input.checked) { getProblem().branch = idx; h.refresh(); } });
      ui.radios.push({ row, input, span });
    }

    function makeRow(min, max, onInput) {
      const block = document.createElement('div');
      block.className = 'we-slider-block';
      const caption = document.createElement('div');
      caption.className = 'we-slider-caption';
      const value = document.createElement('div');
      value.className = 'we-slider-value';
      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'we-slider';
      input.min = String(min); input.max = String(max); input.step = '1';
      block.appendChild(caption);
      block.appendChild(value);
      block.appendChild(input);
      rightCol.appendChild(block);
      input.addEventListener('input', () => {
        const n = Math.round(Number(input.value));
        input.value = String(n);
        value.textContent = String(n);
        onInput(n);
        h.refresh();
      });
      return { block, caption, value, input };
    }

    for (let i = 0; i < 4; i++) {
      const key = PARAM_KEYS[i];
      ui.params.push(makeRow(-5, 5, (n) => { getProblem()[key] = n; }));
    }
    ui.test = makeRow(-3, 3, (n) => { getProblem().t = n; });
    updateControls(getProblem());
  }

  Topics.register('functions', {
    id: 'inverseFunction',
    tabTitle: () => tx('Ters Fonksiyon', 'Inverse Functions'),
    concept: () => tx(
      'TERS FONKSİYONLAR (Thomas Calculus, Bölüm 1.6)\n\n' +
      '• BİRE-BİR (one-to-one): D kümesinde x₁ ≠ x₂ iken her zaman f(x₁) ≠ f(x₂) ise f bire-birdir; yani farklı girdiler farklı çıktılar verir.\n' +
      "• YATAY DOĞRU TESTİ: f bire-birdir ⇔ hiçbir yatay doğru grafiği birden fazla noktada kesmez. (Dikey doğru testi 'fonksiyon mu?' sorusunu, yatay doğru testi 'bire-bir mi?' sorusunu yanıtlar.) Kesin artan ya da kesin azalan fonksiyonlar her zaman bire-birdir.\n" +
      "• TERS FONKSİYON: f, D üzerinde bire-bir ve değer kümesi R ise f⁻¹, R üzerinde f⁻¹(b) = a ⇔ f(a) = b ile tanımlanır. f⁻¹, f'nin yaptığını geri alır.\n\n" +
      'f⁻¹ BULMAK İÇİN 4 ADIM:\n' +
      "  1. Önce f'nin bire-bir olduğunu kontrol edelim (yatay doğru testi + cebirsel kanıt).\n" +
      '  2. y = f(x) yazalım.\n' +
      '  3. Denklemi x için çözersek x = f⁻¹(y) elde edilir.\n' +
      "  4. x ile y'nin yerini değiştirip y = f⁻¹(x) yazarız.\n\n" +
      '• ÖZELLİKLER: f⁻¹(f(x)) = x (x ∈ D) ve f(f⁻¹(x)) = x (x ∈ R). Tanım kümesi(f⁻¹) = Değer kümesi(f); Değer kümesi(f⁻¹) = Tanım kümesi(f): girdi ve çıktının rolleri yer değiştirir.\n' +
      "• GRAFİK: (a, b) noktası f üzerindeyse (b, a) noktası f⁻¹ üzerindedir. f⁻¹'in grafiği, f'nin y = x doğrusuna göre AYNADAKİ GÖRÜNTÜSÜDÜR (iki noktayı birleştiren doğru parçası y = x'e diktir ve onun tarafından ortalanır). Grafikte iki eksenin ölçeği eşit tutulmuştur.\n" +
      "• NOTASYON: f⁻¹(x) ile 1/f(x) farklı şeylerdir. f⁻¹ 'ters fonksiyon', 1/f(x) = (f(x))⁻¹ 'çarpmaya göre ters' demektir. Örn. f(x) = 2x + 1 için f⁻¹(x) = (x - 1)/2 iken 1/f(x) = 1/(2x + 1).\n\n" +
      "• f BİRE-BİR DEĞİLSE: tanım kümesini f'nin bire-bir olduğu bir parçaya KISITLAYABİLİRİZ. Örn. x² bire-bir değildir (f(-2) = f(2)), ama x ≥ 0 ile kısıtlanırsa tersi √x'tir; x ≤ 0 ile kısıtlanırsa tersi -√x'tir.\n" +
      '• Bazen cebirsel bir formül yoktur (x³ + x gibi): f bire-bir olsa da x için çözülemez; ters değerler grafikten ya da sayısal yöntemle (yarılama) okunur.\n\n' +
      "Sağdaki kaydırıcılar katsayıları ve test noktasını değiştirir; 'Yeni Örnek' başka bir fonksiyon türü getirir. Mavi: f, turuncu: f⁻¹, kesikli gri: y = x.",
      "INVERSE FUNCTIONS (Thomas' Calculus, Section 1.6)\n\n" +
      '• ONE-TO-ONE: f is one-to-one on D if f(x₁) ≠ f(x₂) whenever x₁ ≠ x₂; different inputs always give different outputs.\n' +
      "• HORIZONTAL LINE TEST: f is one-to-one ⇔ no horizontal line meets its graph more than once. (The vertical line test asks 'is it a function?', the horizontal line test asks 'is it one-to-one?'.) Strictly increasing or strictly decreasing functions are always one-to-one.\n" +
      '• INVERSE FUNCTION: if f is one-to-one on D with range R, then f⁻¹ is defined on R by f⁻¹(b) = a ⇔ f(a) = b. f⁻¹ undoes what f did.\n\n' +
      'THE 4-STEP RECIPE FOR f⁻¹:\n' +
      "  1. Let's check that f is one-to-one (horizontal line test + an algebraic argument).\n" +
      '  2. We write y = f(x).\n' +
      '  3. We solve this equation for x and get x = f⁻¹(y).\n' +
      '  4. We swap x and y and write y = f⁻¹(x).\n\n' +
      '• PROPERTIES: f⁻¹(f(x)) = x (x ∈ D) and f(f⁻¹(x)) = x (x ∈ R). Domain(f⁻¹) = Range(f); Range(f⁻¹) = Domain(f): inputs and outputs swap roles.\n' +
      '• GRAPH: if (a, b) lies on f then (b, a) lies on f⁻¹. The graph of f⁻¹ is the MIRROR IMAGE of f about the line y = x (the segment joining the two points is perpendicular to y = x and bisected by it). Both axes use the same scale here so the symmetry is real.\n' +
      "• NOTATION: f⁻¹(x) and 1/f(x) are different things. f⁻¹ means 'inverse function', while 1/f(x) = (f(x))⁻¹ means 'reciprocal'. E.g. for f(x) = 2x + 1: f⁻¹(x) = (x - 1)/2 but 1/f(x) = 1/(2x + 1).\n\n" +
      '• IF f IS NOT ONE-TO-ONE: RESTRICT the domain to a piece on which it is. E.g. x² is not one-to-one (f(-2) = f(2)), but restricted to x ≥ 0 its inverse is √x; restricted to x ≤ 0 its inverse is -√x.\n' +
      '• Sometimes there is no algebraic formula (like x³ + x): f is one-to-one yet cannot be solved for x; read inverse values from the graph or numerically (bisection).\n\n' +
      "The sliders on the right change the coefficients and the test point; 'New Example' brings another type of function. Blue: f, orange: f⁻¹, dashed grey: y = x."
    ),
    problemStatement,
    createProblem,
    links: [
      { match: /^• (BİRE-BİR \(one-to-one\)|ONE-TO-ONE):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [0,1,4].includes(p.kind)) },
      { match: /^• (YATAY DOĞRU TESTİ|HORIZONTAL LINE TEST):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [5].includes(p.kind)) },
      { match: /^• (TERS FONKSİYON|INVERSE FUNCTION):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [0,3,4,7].includes(p.kind)) },
      { match: /^• (ÖZELLİKLER|PROPERTIES):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [3].includes(p.kind)) },
      { match: /^• (GRAFİK|GRAPH):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [1,2].includes(p.kind)) },
      { match: /^• (NOTASYON|NOTATION):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [0].includes(p.kind)) },
      { match: /^• (f BİRE-BİR DEĞİLSE|IF f IS NOT ONE-TO-ONE):/, make: (rng) => FnKit.until(createProblem, rng, (p) => [5].includes(p.kind)) },
      { match: /^• (Bazen cebirsel|Sometimes there is no algebraic)/, make: (rng) => FnKit.until(createProblem, rng, (p) => [6].includes(p.kind)) },
    ],
    solveSteps,
    draw,
    focus: (p) => { const inf = getInfo(p); const c0 = p.kind === 7 ? 25 : 0; if (inf.valid && !isNaN(inf.A0) && !isNaN(inf.B0)) { const m = (inf.A0 + inf.B0) / 2; return { x: m, y: m }; } return { x: c0, y: c0 }; },
    buildControls,
  });
})();
