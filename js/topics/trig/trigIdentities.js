// Ported from Modules/Trigonometry/TrigIdentitiesControl.vb - "Trigonometrik Özdeşlikler / Trigonometric Identities":
// (a) Pythagorean, (b) sum/difference, (c) double angle, (d) half angle, (e) prove an identity, (f) simplify cos(x + π/2) etc.
(function () {
  const KIND_COUNT = 6;
  const tx = (tr, en) => I18N.tx(tr, en);
  let forcedKind = -1;
  let kindSel = null;
  let offLang = null;

  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const BANGLES = [15, 75, 105, 165];
  const SUM_DECOMP = [[45, 30, -1], [60, 45, -1], [45, 30, 1], [30, 45, 1], [60, 45, 1], [135, 30, -1], [120, 45, 1], [135, 30, 1]];
  const HALF_TWICE = [30, 45, 135, 150, 210, 225];
  const idiv = (a, b) => Math.trunc(a / b);
  const mod = (a, n) => ((a % n) + n) % n;

  // ================= exact radicals (N/D)·√R =================
  function gcdI(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = a % b; a = b; b = t; }
    return Math.max(1, a);
  }
  class Rad {
    constructor(n, d, r) {
      if (n === 0) { this.N = 0; this.D = 1; this.R = 1; }
      else {
        const g = gcdI(Math.abs(n), Math.abs(d));
        const sgn = d < 0 ? -1 : 1;
        this.N = idiv(sgn * n, g); this.D = idiv(Math.abs(d), g); this.R = r;
      }
    }
    get value() { return this.N / this.D * Math.sqrt(this.R); }
    mul(o) {
      let n2 = this.N * o.N, d2 = this.D * o.D, r2 = this.R * o.R;
      for (const s of [2, 3]) {
        while (r2 % (s * s) === 0) { r2 = idiv(r2, s * s); n2 *= s; }
      }
      return new Rad(n2, d2, r2);
    }
    neg() { return new Rad(-this.N, this.D, this.R); }
    numText() {
      if (this.N === 0) return '0';
      const a = Math.abs(this.N);
      const body = this.R === 1 ? String(a) : (a === 1 ? '' : String(a)) + '√' + this.R;
      return (this.N < 0 ? '−' : '') + body;
    }
    toString() { return this.numText() + (this.D === 1 ? '' : '/' + this.D); }
    paren() { return '(' + this.toString() + ')'; }
  }
  const Mk = (n, d, r) => new Rad(n, d, r);

  // exact sin and cos of a multiple of 30 or 45 degrees
  function SC(deg) {
    const d = mod(deg, 360);
    let ra, q;
    if (d <= 90) { ra = d; q = 1; }
    else if (d <= 180) { ra = 180 - d; q = 2; }
    else if (d <= 270) { ra = d - 180; q = 3; }
    else { ra = 360 - d; q = 4; }
    let bs, bc;
    switch (ra) {
      case 0: bs = Mk(0, 1, 1); bc = Mk(1, 1, 1); break;
      case 30: bs = Mk(1, 2, 1); bc = Mk(1, 2, 3); break;
      case 45: bs = Mk(1, 2, 2); bc = Mk(1, 2, 2); break;
      case 60: bs = Mk(1, 2, 3); bc = Mk(1, 2, 1); break;
      default: bs = Mk(1, 1, 1); bc = Mk(0, 1, 1);
    }
    return { s: q >= 3 ? bs.neg() : bs, c: (q === 2 || q === 3) ? bc.neg() : bc };
  }

  // ================= text helpers =================
  function Fr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    let a = Math.abs(n), b = d;
    while (b !== 0) { const t = a % b; a = b; b = t; }
    const g = Math.max(1, a);
    n = idiv(n, g); d = idiv(d, g);
    const body = Math.abs(n).toString() + (d === 1 ? '' : '/' + d);
    return (n < 0 ? '−' : '') + body;
  }
  function Mn(n) { return String(n).replace(/-/g, '−'); }
  function Eq(n, d) { const r = Fr(n, d); return r === Mn(n) + '/' + d ? '' : ' = ' + r; }
  function FrP(n, d) { return '(' + Fr(n, d) + ')'; }
  function f4(v) { const s = v.toFixed(4); return /^-0\.0+$/.test(s) ? s.slice(1) : s; }
  function f6(v) { const s = v.toFixed(6); return /^-0\.0+$/.test(s) ? s.slice(1) : s; }
  function f1(v) { let s = v.toFixed(1).replace(/0+$/, '').replace(/\.$/, ''); return s === '-0' ? '0' : s; }
  function D4(v) { return (isNaN(v) || !isFinite(v)) ? tx('tanımsız', 'undefined') : f4(v); }
  function D2s(v) {
    if (isNaN(v) || !isFinite(v)) return tx('tanımsız', 'undefined');
    const s = v.toFixed(2);
    return /^-0\.0+$/.test(s) ? s.slice(1) : s;
  }
  function Hdr(i, tr, en) { return '── ' + i + ') ' + tx(tr, en) + ' ──\n'; }
  function Dv(n, d) { return Math.abs(d) < 1e-9 ? NaN : n / d; }
  function Tn(x) { return Dv(Math.sin(x), Math.cos(x)); }
  function FnName(i) { return ['sin', 'cos', 'tan'][i]; }
  function FnVal(i, x) {
    switch (i) { case 0: return Math.sin(x); case 1: return Math.cos(x); default: return Tn(x); }
  }
  function DegText(deg2) { return (deg2 % 2 === 0 ? String(idiv(deg2, 2)) : (deg2 / 2.0).toFixed(1)) + '°'; }
  function QuadName(q) { return tx(q + '. bölge', 'quadrant ' + q); }
  function SignWord(positive) { return positive ? tx('pozitif', 'positive') : tx('negatif', 'negative'); }

  const BLUE = '#1e90ff', ORANGERED = '#ff4500', LIME = '#32cd32';

  function concept() {
    return tx(
      'Trigonometrik özdeşlik, tanımlı olduğu HER açı için doğru olan bir eşitliktir. Bir özdeşliği kanıtlamak için bir iki sayıyla denemek yetmez; iki tarafın cebirsel olarak aynı ifadeye dönüştüğünü göstermek gerekir.\n\n' +
      'PİSAGOR ÖZDEŞLİKLERİ (birim çemberden: x² + y² = 1)\n' +
      '  sin²θ + cos²θ = 1\n' +
      '  1 + tan²θ = sec²θ   (cos²θ\'ya bölünür)\n' +
      '  1 + cot²θ = csc²θ   (sin²θ\'ya bölünür)\n\n' +
      'TOPLAM VE FARK FORMÜLLERİ\n' +
      '  cos(A ± B) = cos A cos B ∓ sin A sin B\n' +
      '  sin(A ± B) = sin A cos B ± cos A sin B\n' +
      '  tan(A ± B) = (tan A ± tan B)/(1 ∓ tan A tan B)\n\n' +
      'ÇİFT AÇI (A = B = θ alınır)\n' +
      '  sin 2θ = 2 sin θ cos θ\n' +
      '  cos 2θ = cos²θ − sin²θ = 2cos²θ − 1 = 1 − 2sin²θ\n' +
      '  tan 2θ = 2 tan θ/(1 − tan²θ)\n\n' +
      'YARIM AÇI (cos 2θ formüllerinin yeniden yazılması)\n' +
      '  cos²θ = (1 + cos 2θ)/2     sin²θ = (1 − cos 2θ)/2\n' +
      '  tan(θ) = sin 2θ/(1 + cos 2θ) = (1 − cos 2θ)/sin 2θ\n' +
      'Yarım açıda kök alırken işaret, açının bulunduğu BÖLGEDEN seçilir.\n\n' +
      'YÖNTEM\n' +
      '1) Önce bildiğimiz standart açıları (30°, 45°, 60°, 90°...) belirleyelim.\n' +
      '2) Uygun formülü yazıp değerleri parantez içinde yerine koyabiliriz.\n' +
      '3) Kök çarpımlarını sadeleştirebiliriz (√2·√3 = √6).\n' +
      '4) Ondalık değerle kontrol edebiliriz.\n' +
      '5) Özdeşlik ispatında karmaşık tarafı sadeleştirip diğer tarafa ulaşabiliriz (tanım kümesini de düşünelim).',
      'A trigonometric identity is an equation that is true for EVERY angle where both sides are defined. Checking a few numbers is not a proof; it helps to transform one side algebraically into the other.\n\n' +
      'PYTHAGOREAN IDENTITIES (from the unit circle: x² + y² = 1)\n' +
      '  sin²θ + cos²θ = 1\n' +
      '  1 + tan²θ = sec²θ   (divide by cos²θ)\n' +
      '  1 + cot²θ = csc²θ   (divide by sin²θ)\n\n' +
      'SUM AND DIFFERENCE FORMULAS\n' +
      '  cos(A ± B) = cos A cos B ∓ sin A sin B\n' +
      '  sin(A ± B) = sin A cos B ± cos A sin B\n' +
      '  tan(A ± B) = (tan A ± tan B)/(1 ∓ tan A tan B)\n\n' +
      'DOUBLE ANGLE (we put A = B = θ)\n' +
      '  sin 2θ = 2 sin θ cos θ\n' +
      '  cos 2θ = cos²θ − sin²θ = 2cos²θ − 1 = 1 − 2sin²θ\n' +
      '  tan 2θ = 2 tan θ/(1 − tan²θ)\n\n' +
      'HALF ANGLE (the cos 2θ formulas rewritten)\n' +
      '  cos²θ = (1 + cos 2θ)/2     sin²θ = (1 − cos 2θ)/2\n' +
      '  tan(θ) = sin 2θ/(1 + cos 2θ) = (1 − cos 2θ)/sin 2θ\n' +
      'When taking the square root, we choose the sign from the QUADRANT of the angle.\n\n' +
      'METHOD\n' +
      '1) First we identify the standard angles we know (30°, 45°, 60°, 90°...).\n' +
      '2) We write the right formula and substitute the values in parentheses.\n' +
      '3) We simplify the radical products (√2·√3 = √6).\n' +
      '4) We check with a decimal value.\n' +
      '5) To prove an identity, we simplify the more complicated side until it becomes the other (and keep the domain in mind).');
  }

  function createProblem(rng) {
    return genProblem(rng, forcedKind >= 0 ? forcedKind : rng.nextInt(0, KIND_COUNT));
  }

  function genProblem(rng, kind) {
    const p = {};
    p.kind = kind;
    p.triple = rng.nextInt(0, TRIPLES.length);
    p.swap = rng.nextInt(0, 2) === 0;
    p.useCos = rng.nextInt(0, 2) === 0;
    p.quad = rng.nextInt(1, 5);
    p.fn = rng.nextInt(0, 3);
    p.choice = rng.nextInt(0, 12);
    p.testX = Math.round((rng.nextDouble() * 8.0 - 4.0) * 10) / 10;
    if (Math.abs(p.testX) < 0.05) p.testX = 0.7;
    if (kindSel && kindSel.select) kindSel.select.value = String(p.kind);
    return p;
  }

  // ---- derived data ----
  function Trip(p, useCos) {
    const t = TRIPLES[Math.max(0, Math.min(TRIPLES.length - 1, p.triple))];
    const legA = p.swap ? t[1] : t[0];
    const legB = p.swap ? t[0] : t[1];
    const d = t[2];
    const sSign = p.quad <= 2 ? 1 : -1;
    const cSign = (p.quad === 1 || p.quad === 4) ? 1 : -1;
    let sn, cn;
    if (useCos) { cn = cSign * legA; sn = sSign * legB; }
    else { sn = sSign * legA; cn = cSign * legB; }
    return { sn, cn, d };
  }
  function ThetaRad(sn, cn) {
    let a = Math.atan2(sn, cn);
    if (a < 0) a += 2.0 * Math.PI;
    return a;
  }
  function BIdx(p) {
    const c = mod(p.choice, 8);
    const ai = c % 4;
    const deg = BANGLES[ai];
    const pick = idiv(c, 4) % 2;
    let found = -1;
    for (let i = 0; i < SUM_DECOMP.length; i++) {
      const dd = SUM_DECOMP[i][0] + SUM_DECOMP[i][2] * SUM_DECOMP[i][1];
      if (dd === deg) {
        found++;
        if (found === pick) return { deg, a: SUM_DECOMP[i][0], b: SUM_DECOMP[i][1], op: SUM_DECOMP[i][2] };
      }
    }
    return { deg, a: 45, b: 30, op: 1 };
  }

  // ================= graph specification =================
  const PiTxt = (a) => (a === 2 ? 'π/2' : 'π');
  function FormTxt(form, a) {
    switch (form) {
      case 0: return 'x + ' + PiTxt(a);
      case 1: return 'x − ' + PiTxt(a);
      default: return PiTxt(a) + ' − x';
    }
  }
  function IdTexts(v) {
    switch (v) {
      case 0: return { l: '(1 − cos²x)/sin x', r: 'sin x' };
      case 1: return { l: 'sin 2x/(1 + cos 2x)', r: 'tan x' };
      case 2: return { l: '(sin x + cos x)²', r: '1 + sin 2x' };
      case 3: return { l: 'tan x + cot x', r: '2/sin 2x' };
      case 4: return { l: '(1 − sin x)(1 + sin x)', r: 'cos²x' };
      default: return { l: 'cos⁴x − sin⁴x', r: 'cos 2x' };
    }
  }
  function IdFunc(v, left) {
    switch (v) {
      case 0:
        if (left) return (x) => Dv(1 - Math.pow(Math.cos(x), 2), Math.sin(x));
        return (x) => (Math.abs(Math.sin(x)) < 1e-9 ? NaN : Math.sin(x));
      case 1:
        if (left) return (x) => Dv(Math.sin(2 * x), 1 + Math.cos(2 * x));
        return (x) => Tn(x);
      case 2:
        if (left) return (x) => Math.pow(Math.sin(x) + Math.cos(x), 2);
        return (x) => 1 + Math.sin(2 * x);
      case 3:
        if (left) return (x) => Tn(x) + Dv(Math.cos(x), Math.sin(x));
        return (x) => Dv(2, Math.sin(2 * x));
      case 4:
        if (left) return (x) => (1 - Math.sin(x)) * (1 + Math.sin(x));
        return (x) => Math.pow(Math.cos(x), 2);
      default:
        if (left) return (x) => Math.pow(Math.cos(x), 4) - Math.pow(Math.sin(x), 4);
        return (x) => Math.cos(2 * x);
    }
  }

  function GetSpec(p) {
    const s = { lhs: null, rhs: null, lName: '', rName: '', yMin: -2.5, yMax: 2.5, thetaX: NaN, thetaY: 0, thetaLabel: '', thetaAppend: true };
    switch (p.kind) {
      case 0: {
        s.lhs = (x) => Math.pow(Math.sin(x), 2) + Math.pow(Math.cos(x), 2);
        s.rhs = () => 1.0;
        s.lName = 'sin²x + cos²x'; s.rName = '1';
        s.yMin = -1; s.yMax = 3;
        const t = Trip(p, p.useCos);
        s.thetaX = ThetaRad(t.sn, t.cn); s.thetaY = 1; s.thetaAppend = false;
        s.thetaLabel = `θ ≈ ${f1(s.thetaX * 180.0 / Math.PI)}°`;
        break;
      }
      case 1: {
        const { deg, a, b, op } = BIdx(p);
        const br = b * Math.PI / 180.0;
        const sB = Math.sin(br), cB = Math.cos(br), tB = Math.tan(br);
        const f = p.fn;
        const ops = op > 0 ? '+' : '−';
        const opi = op > 0 ? '−' : '+';
        switch (f) {
          case 0:
            s.lhs = (x) => Math.sin(x + op * br);
            s.rhs = (x) => Math.sin(x) * cB + op * Math.cos(x) * sB;
            s.rName = `sin x cos ${b}° ${ops} cos x sin ${b}°`;
            break;
          case 1:
            s.lhs = (x) => Math.cos(x + op * br);
            s.rhs = (x) => Math.cos(x) * cB - op * Math.sin(x) * sB;
            s.rName = `cos x cos ${b}° ${opi} sin x sin ${b}°`;
            break;
          default:
            s.lhs = (x) => Tn(x + op * br);
            s.rhs = (x) => Dv(Tn(x) + op * tB, 1 - op * Tn(x) * tB);
            s.rName = `(tan x ${ops} tan ${b}°)/(1 ${opi} tan x tan ${b}°)`;
            s.yMin = -4; s.yMax = 4;
        }
        if (f < 2) { s.yMin = -1.8; s.yMax = 1.8; }
        s.lName = `${FnName(f)}(x ${ops} ${b}°)`;
        s.thetaX = a * Math.PI / 180.0;
        s.thetaY = FnVal(f, deg * Math.PI / 180.0);
        s.thetaLabel = `x = ${a}°: ${FnName(f)} ${deg}°`;
        break;
      }
      case 2: {
        s.lhs = (x) => Math.sin(2 * x);
        s.rhs = (x) => 2 * Math.sin(x) * Math.cos(x);
        s.lName = 'sin 2x'; s.rName = '2 sin x cos x';
        s.yMin = -1.8; s.yMax = 1.8;
        const t = Trip(p, false);
        s.thetaX = ThetaRad(t.sn, t.cn);
        s.thetaY = Math.sin(2 * s.thetaX); s.thetaLabel = 'θ: sin 2θ';
        break;
      }
      case 3: {
        const idx = mod(p.choice, 6);
        const alpha = HALF_TWICE[idx] / 2.0 * Math.PI / 180.0;
        switch (p.fn) {
          case 0:
            s.lhs = (x) => Math.pow(Math.sin(x), 2);
            s.rhs = (x) => (1 - Math.cos(2 * x)) / 2;
            s.lName = 'sin²x'; s.rName = '(1 − cos 2x)/2';
            s.thetaX = alpha; s.thetaY = Math.pow(Math.sin(alpha), 2); s.thetaLabel = 'x = α: sin²α';
            s.yMin = -1; s.yMax = 2;
            break;
          case 1:
            s.lhs = (x) => Math.pow(Math.cos(x), 2);
            s.rhs = (x) => (1 + Math.cos(2 * x)) / 2;
            s.lName = 'cos²x'; s.rName = '(1 + cos 2x)/2';
            s.thetaX = alpha; s.thetaY = Math.pow(Math.cos(alpha), 2); s.thetaLabel = 'x = α: cos²α';
            s.yMin = -1; s.yMax = 2;
            break;
          default:
            s.lhs = (x) => Tn(x / 2);
            s.rhs = (x) => Dv(Math.sin(x), 1 + Math.cos(x));
            s.lName = 'tan(x/2)'; s.rName = 'sin x/(1 + cos x)';
            s.thetaX = 2 * alpha; s.thetaY = Tn(alpha); s.thetaLabel = 'x = 2α: tan α';
            s.yMin = -4; s.yMax = 4;
        }
        break;
      }
      case 4: {
        const v = mod(p.choice, 6);
        const t = IdTexts(v);
        s.lName = t.l; s.rName = t.r;
        s.lhs = IdFunc(v, true); s.rhs = IdFunc(v, false);
        s.yMin = v === 3 ? -6 : -3; s.yMax = v === 3 ? 6 : 3;
        break;
      }
      default: {
        const v = mod(p.choice, 12);
        const { fnI, a, form } = VariantParts(v);
        const aVal = a === 2 ? Math.PI / 2 : Math.PI;
        let argF;
        switch (form) {
          case 0: argF = (x) => x + aVal; break;
          case 1: argF = (x) => x - aVal; break;
          default: argF = (x) => aVal - x;
        }
        s.lhs = (x) => (fnI === 0 ? Math.sin(argF(x)) : Math.cos(argF(x)));
        const { cs, cc } = SimplifyCoefs(v);
        s.rhs = (x) => cs * Math.sin(x) + cc * Math.cos(x);
        s.lName = `${FnName(fnI)}(${FormTxt(form, a)})`;
        s.rName = SimplifiedText(cs, cc);
        s.yMin = -1.8; s.yMax = 1.8;
      }
    }
    return s;
  }

  // ---- kind f: symbolic simplification with sum/difference formulas ----
  function VariantParts(v) {
    return { fnI: idiv(v, 6), a: idiv(v % 6, 3) === 0 ? 2 : 1, form: v % 3 };
  }
  const MkX = (isSin) => ({ num: 1, name: isSin ? 'sin x' : 'cos x', isX: true, text: isSin ? 'sin x' : 'cos x' });
  const MkNum = (n, txt) => ({ num: n, name: null, isX: false, text: txt });
  function ProdFactors(f1_, f2_) {
    return { c: f1_.num * f2_.num, name: f1_.isX ? f1_.name : f2_.name };
  }
  function BuildFactors(v) {
    const { a, form } = VariantParts(v);
    const sav = a === 2 ? 1 : 0;
    const cav = a === 2 ? 0 : -1;
    const an = PiTxt(a);
    const sAf = MkNum(sav, 'sin ' + an);
    const cAf = MkNum(cav, 'cos ' + an);
    if (form === 2) return { sA: sAf, cA: cAf, sB: MkX(true), cB: MkX(false), sg: -1 };
    return { sA: MkX(true), cA: MkX(false), sB: sAf, cB: cAf, sg: form === 0 ? 1 : -1 };
  }
  function SimplifyCoefs(v) {
    const { sA, cA, sB, cB, sg } = BuildFactors(v);
    const { fnI } = VariantParts(v);
    let c1, c2, n1, n2;
    if (fnI === 0) {
      const a1 = ProdFactors(sA, cB); c1 = a1.c; n1 = a1.name;
      const a2 = ProdFactors(cA, sB); c2 = sg * a2.c; n2 = a2.name;
    } else {
      const a1 = ProdFactors(cA, cB); c1 = a1.c; n1 = a1.name;
      const a2 = ProdFactors(sA, sB); c2 = -sg * a2.c; n2 = a2.name;
    }
    let cs = 0, cc = 0;
    if (n1 === 'sin x') cs += c1; else cc += c1;
    if (n2 === 'sin x') cs += c2; else cc += c2;
    return { cs, cc };
  }
  function SimplifiedText(cs, cc) {
    if (cs === 0 && cc === 0) return '0';
    if (cs !== 0) return (cs < 0 ? '−' : '') + (Math.abs(cs) === 1 ? '' : String(Math.abs(cs))) + 'sin x';
    return (cc < 0 ? '−' : '') + (Math.abs(cc) === 1 ? '' : String(Math.abs(cc))) + 'cos x';
  }
  function Par(f) { return f.isX ? f.text : '(' + String(f.num).replace(/-/g, '−') + ')'; }

  // ================= problem statement =================
  function problemStatement(p) {
    switch (p.kind) {
      case 0: {
        const t = Trip(p, p.useCos);
        const given = p.useCos ? t.cn : t.sn;
        const gName = p.useCos ? 'cos θ' : 'sin θ';
        return tx(`${gName} = ${Fr(given, t.d)} ve θ, ${QuadName(p.quad)}'de olduğuna göre diğer beş trigonometrik oranı bulalım.`,
          `Given ${gName} = ${Fr(given, t.d)} and θ lies in ${QuadName(p.quad)}, let's find the other five trigonometric functions.`);
      }
      case 1: {
        const { deg, a, b, op } = BIdx(p);
        const opS = op > 0 ? '+' : '−';
        const fn = FnName(p.fn);
        return tx(`${fn} ${deg}° değerini, ${deg}° = ${a}° ${opS} ${b}° yazarak toplam/fark formülü ile tam (kök içinde) olarak hesaplayalım.`,
          `Using ${deg}° = ${a}° ${opS} ${b}° and the sum/difference formula, let's find ${fn} ${deg}° exactly (in radical form).`);
      }
      case 2: {
        const t = Trip(p, false);
        return tx(`sin θ = ${Fr(t.sn, t.d)} ve θ, ${QuadName(p.quad)}'de olduğuna göre sin 2θ, cos 2θ ve tan 2θ değerlerini bulalım.`,
          `Given sin θ = ${Fr(t.sn, t.d)} and θ lies in ${QuadName(p.quad)}, let's find sin 2θ, cos 2θ and tan 2θ.`);
      }
      case 3: {
        const t2 = HALF_TWICE[mod(p.choice, 6)];
        const alphaT = DegText(t2);
        const fn = FnName(p.fn);
        return tx(`${fn} ${alphaT} değerini, ${alphaT} = (${t2}°)/2 olduğunu kullanarak yarım açı formülü ile tam olarak hesaplayalım.`,
          `Using ${alphaT} = (${t2}°)/2 and the half-angle formula, let's find ${fn} ${alphaT} exactly.`);
      }
      case 4: {
        const { l, r } = IdTexts(mod(p.choice, 6));
        return tx(`${l} = ${r} özdeşliğini ispatlayalım (x = ${fmt2(p.testX)} için sayısal kontrol de yapabiliriz).`,
          `Let's prove the identity ${l} = ${r} (we can also check it numerically at x = ${fmt2(p.testX)}).`);
      }
      default: {
        const v = mod(p.choice, 12);
        const { fnI, a, form } = VariantParts(v);
        const expr = `${FnName(fnI)}(${FormTxt(form, a)})`;
        return tx(`${expr} ifadesini toplam/fark formülü ile sadeleştirerek sin x ya da cos x cinsinden yazalım.`,
          `Let's simplify ${expr} with the sum/difference formula and write it in terms of sin x or cos x.`);
      }
    }
  }

  // ================= steps =================
  function solveSteps(p) {
    switch (p.kind) {
      case 0: return StepsPythagorean(p);
      case 1: return StepsSumDiff(p);
      case 2: return StepsDouble(p);
      case 3: return StepsHalf(p);
      case 4: return StepsProve(p);
      default: return StepsSimplify(p);
    }
  }

  function TestStep(i, p, sp) {
    const x = p.testX;
    const l = sp.lhs(x), r = sp.rhs(x);
    let t = Hdr(i, 'Grafikteki deneme noktası', 'The test point on the graph');
    t += tx(`Kaydırıcıyla seçtiğimiz x = ${fmt2(x)} rad için: sol taraf ${sp.lName} = ${D4(l)}, sağ taraf ${sp.rName} = ${D4(r)}.`,
      `For the slider value x = ${fmt2(x)} rad: left side ${sp.lName} = ${D4(l)}, right side ${sp.rName} = ${D4(r)}.`);
    if (isNaN(l) || isNaN(r)) {
      t += '\n' + tx("Bu x'te ifadelerden biri tanımsızdır (payda 0 ya da tan'ın kutbu); özdeşlik yalnızca iki tarafın da tanımlı olduğu x'ler için geçerlidir. Grafikte eğrinin koptuğu yerler bunlardır.",
        'At this x one of the expressions is undefined (zero denominator or a pole of tan); an identity only holds where both sides are defined. These are the places where the curves break.');
    } else {
      t += '\n' + tx(`Fark ≈ ${f6(Math.abs(l - r))}: iki eğri çakışıktır (çizgili eğri düz eğrinin üzerinden geçer).`,
        `Difference ≈ ${f6(Math.abs(l - r))}: the two curves coincide (the dashed curve runs exactly over the solid one).`);
    }
    return t;
  }

  // ---- (a) Pythagorean ----
  function StepsPythagorean(p) {
    const L = [];
    const { sn, cn, d } = Trip(p, p.useCos);
    const q = p.quad;
    const given = p.useCos ? cn : sn;
    const other = p.useCos ? sn : cn;
    const gName = p.useCos ? 'cos θ' : 'sin θ';
    const oName = p.useCos ? 'sin θ' : 'cos θ';
    const sinPos = sn > 0, cosPos = cn > 0;
    const deg = ThetaRad(sn, cn) * 180.0 / Math.PI;
    const o3 = oName.slice(0, 3), g3 = gName.slice(0, 3);

    L.push(Hdr(1, 'Verilenler', 'Given') +
      tx(`${gName} = ${Fr(given, d)} ve θ, ${QuadName(q)}'de. Bulmak istediğimiz: diğer beş trigonometrik oran. Bize bir oran ve bir bölge verildi; Pisagor özdeşlikleri geri kalanını belirler.`,
        `${gName} = ${Fr(given, d)} and θ lies in ${QuadName(q)}. We want the other five trigonometric functions. One value and a quadrant are given; the Pythagorean identities determine everything else.`));
    L.push(Hdr(2, 'Pisagor özdeşliği ile diğer oranın büyüklüğü', 'Size of the other function from the Pythagorean identity') +
      tx(`sin²θ + cos²θ = 1 olduğundan ${o3}²θ = 1 − ${g3}²θ.\n${o3}²θ = 1 − (${Fr(given, d)})² = 1 − ${given * given}/${d * d} = (${d * d} − ${given * given})/${d * d} = ${other * other}/${d * d}.\nKök alırsak |${oName}| = ${Math.abs(other)}/${d}.`,
        `Since sin²θ + cos²θ = 1, ${o3}²θ = 1 − ${g3}²θ.\n${o3}²θ = 1 − (${Fr(given, d)})² = 1 − ${given * given}/${d * d} = (${d * d} − ${given * given})/${d * d} = ${other * other}/${d * d}.\nTaking the square root, |${oName}| = ${Math.abs(other)}/${d}.`));
    L.push(Hdr(3, 'İşareti bölgeden seçelim', 'Choose the sign from the quadrant') +
      tx(`${QuadName(q)}'de sin θ ${SignWord(sinPos)}, cos θ ${SignWord(cosPos)} (CAST/ASTC kuralı: I'de hepsi +, II'de yalnız sin +, III'te yalnız tan +, IV'te yalnız cos +).\nDolayısıyla sin θ = ${Fr(sn, d)} ve cos θ = ${Fr(cn, d)}.`,
        `In ${QuadName(q)}, sin θ is ${SignWord(sinPos)} and cos θ is ${SignWord(cosPos)} (All-Students-Take-Calculus rule: in I all +, in II only sin +, in III only tan +, in IV only cos +).\nTherefore sin θ = ${Fr(sn, d)} and cos θ = ${Fr(cn, d)}.`));
    L.push(Hdr(4, 'tan θ ve cot θ', 'tan θ and cot θ') +
      tx(`tan θ = sin θ / cos θ = (${Fr(sn, d)}) / (${Fr(cn, d)}) = ${Fr(sn, cn)}.\ncot θ = cos θ / sin θ = ${Fr(cn, sn)}  (tan'ın çarpmaya göre tersi).`,
        `tan θ = sin θ / cos θ = (${Fr(sn, d)}) / (${Fr(cn, d)}) = ${Fr(sn, cn)}.\ncot θ = cos θ / sin θ = ${Fr(cn, sn)}  (the reciprocal of tan).`));
    L.push(Hdr(5, 'sec θ ve csc θ', 'sec θ and csc θ') +
      tx(`sec θ = 1/cos θ = ${Fr(d, cn)}   ve   csc θ = 1/sin θ = ${Fr(d, sn)}.`,
        `sec θ = 1/cos θ = ${Fr(d, cn)}   and   csc θ = 1/sin θ = ${Fr(d, sn)}.`));
    L.push(Hdr(6, 'Diğer iki Pisagor özdeşliğiyle kontrol edelim', 'Check with the other two Pythagorean identities') +
      tx(`1 + tan²θ = 1 + (${Fr(sn, cn)})² = 1 + ${sn * sn}/${cn * cn} = ${cn * cn + sn * sn}/${cn * cn} = ${d * d}/${cn * cn}, ve sec²θ = (${Fr(d, cn)})² = ${d * d}/${cn * cn}. Eşit ✓\n1 + cot²θ = 1 + (${Fr(cn, sn)})² = 1 + ${cn * cn}/${sn * sn} = ${sn * sn + cn * cn}/${sn * sn} = ${d * d}/${sn * sn}, ve csc²θ = (${Fr(d, sn)})² = ${d * d}/${sn * sn}. Eşit ✓`,
        `1 + tan²θ = 1 + (${Fr(sn, cn)})² = 1 + ${sn * sn}/${cn * cn} = ${cn * cn + sn * sn}/${cn * cn} = ${d * d}/${cn * cn}, and sec²θ = (${Fr(d, cn)})² = ${d * d}/${cn * cn}. Equal ✓\n1 + cot²θ = 1 + (${Fr(cn, sn)})² = 1 + ${cn * cn}/${sn * sn} = ${sn * sn + cn * cn}/${sn * sn} = ${d * d}/${sn * sn}, and csc²θ = (${Fr(d, sn)})² = ${d * d}/${sn * sn}. Equal ✓`));
    const dec = `θ ≈ ${fmt2(deg)}°`;
    const sumSq = Math.pow(sn / d, 2) + Math.pow(cn / d, 2);
    L.push(Hdr(7, 'Ondalık kontrol', 'Decimal check') +
      tx(`${dec} (aynı bölgede). sin θ ≈ ${f4(sn / d)}, cos θ ≈ ${f4(cn / d)}, tan θ ≈ ${f4(sn / cn)}, sin²θ + cos²θ ≈ ${f4(sumSq)}.`,
        `${dec} (same quadrant). sin θ ≈ ${f4(sn / d)}, cos θ ≈ ${f4(cn / d)}, tan θ ≈ ${f4(sn / cn)}, sin²θ + cos²θ ≈ ${f4(sumSq)}.`));
    L.push(TestStep(8, p, GetSpec(p)));
    return L;
  }

  // ---- (b) sum / difference ----
  function SumText(p, q) {
    if (p.N === 0) return q.toString();
    if (q.N === 0) return p.toString();
    if (p.D !== q.D) return p.toString() + (q.N < 0 ? ' − ' : ' + ') + q.neg().toString().replace(/−/g, '');
    let a = p, b = q;
    if (a.N < 0 && b.N > 0) { a = q; b = p; }
    const bt = b.N < 0 ? ' − ' + b.neg().numText() : ' + ' + b.numText();
    return '(' + a.numText() + bt + ')' + (a.D === 1 ? '' : '/' + a.D);
  }

  function StepsSumDiff(p) {
    const L = [];
    const { deg, a, b, op } = BIdx(p);
    const f = p.fn;
    const { s: sA, c: cA } = SC(a);
    const { s: sB, c: cB } = SC(b);
    const opS = op > 0 ? '+' : '−';
    const opInv = op > 0 ? '−' : '+';
    const opSp = ' ' + opS + ' ';
    const opInvSp = ' ' + opInv + ' ';

    const pS = sA.mul(cB), qS = cA.mul(sB);
    const pC = cA.mul(cB), qC = sA.mul(sB);
    const sinP = pS, sinQ = op > 0 ? qS : qS.neg();
    const cosP = pC, cosQ = op > 0 ? qC.neg() : qC;
    const sinTot = sinP.value + sinQ.value;
    const cosTot = cosP.value + cosQ.value;
    const sinExact = SumText(sinP, sinQ);
    const cosExact = SumText(cosP, cosQ);
    const target = deg * Math.PI / 180.0;
    const rad = tx('(kök çarpımları: √2·√3 = √6, √2·√2 = 2, √3·√3 = 3)', '(radical products: √2·√3 = √6, √2·√2 = 2, √3·√3 = 3)');

    L.push(Hdr(1, 'Fikir: standart açılardan oluşturalım', 'Idea: build the angle from standard angles') +
      tx(`${deg}° standart bir açı değil ama ${a}° ${opS} ${b}° olarak yazılabilir (${a} ${opS} ${b} = ${deg}). Sinüs, kosinüs ve tanjant değerlerini 30°, 45°, 60° için biliyoruz; toplam/fark formülü bunları birleştirir.\nBulmak istediğimiz: ${FnName(f)} ${deg}°.`,
        `${deg}° is not a standard angle but it can be written as ${a}° ${opS} ${b}° (${a} ${opS} ${b} = ${deg}). We know the sine, cosine and tangent of 30°, 45°, 60°; the sum/difference formula combines them.\nWe want: ${FnName(f)} ${deg}°.`));
    L.push(Hdr(2, 'Gereken formüller', 'The formulas needed') +
      tx(`sin(A ${opS} B) = sin A cos B ${opS} cos A sin B\ncos(A ${opS} B) = cos A cos B ${opInv} sin A sin B` + (f === 2 ? '\ntan θ = sin θ / cos θ (tanjant için önce sin ve cos\'u bulup bölüyoruz).' : '') + `\nBurada A = ${a}°, B = ${b}°.`,
        `sin(A ${opS} B) = sin A cos B ${opS} cos A sin B\ncos(A ${opS} B) = cos A cos B ${opInv} sin A sin B` + (f === 2 ? '\ntan θ = sin θ / cos θ (for tangent we first find sin and cos, then divide).' : '') + `\nHere A = ${a}°, B = ${b}°.`));
    L.push(Hdr(3, 'Bilinen değerler tablosu', 'Table of known values') +
      `sin ${a}° = ${sA}   cos ${a}° = ${cA}\nsin ${b}° = ${sB}   cos ${b}° = ${cB}`);

    if (f === 0 || f === 2) {
      L.push(Hdr(4, `sin ${deg}° için yerine koyalım`, `Substitute for sin ${deg}°`) +
        `sin(${a}° ${opS} ${b}°) = sin ${a}° cos ${b}° ${opS} cos ${a}° sin ${b}°\n` +
        `= ${sA.paren()}${cB.paren()}${opSp}${cA.paren()}${sB.paren()}\n` +
        tx(`= ${pS}${opSp}${qS.paren()}   ${rad}`, `= ${pS}${opSp}${qS.paren()}   ${rad}`) + '\n' +
        `= ${sinExact}\n` +
        tx(`Ondalık kontrol: ${sinExact} ≈ ${D4(sinTot)} ve sin ${deg}° = ${D4(Math.sin(target))} ✓`, `Decimal check: ${sinExact} ≈ ${D4(sinTot)} and sin ${deg}° = ${D4(Math.sin(target))} ✓`));
    }
    if (f === 1 || f === 2) {
      L.push(Hdr(f === 1 ? 4 : 5, `cos ${deg}° için yerine koyalım`, `Substitute for cos ${deg}°`) +
        `cos(${a}° ${opS} ${b}°) = cos ${a}° cos ${b}° ${opInv} sin ${a}° sin ${b}°\n` +
        `= ${cA.paren()}${cB.paren()}${opInvSp}${sA.paren()}${sB.paren()}\n` +
        tx(`= ${pC}${opInvSp}${qC.paren()}   ${rad}`, `= ${pC}${opInvSp}${qC.paren()}   ${rad}`) + '\n' +
        `= ${cosExact}\n` +
        tx(`Ondalık kontrol: ${cosExact} ≈ ${D4(cosTot)} ve cos ${deg}° = ${D4(Math.cos(target))} ✓`, `Decimal check: ${cosExact} ≈ ${D4(cosTot)} and cos ${deg}° = ${D4(Math.cos(target))} ✓`));
    }
    if (f === 2) {
      const sgn = deg > 90 ? -1 : 1;
      let fin, top, ratio;
      switch (deg) {
        case 15: top = '(√6 − √2)²'; fin = '2 − √3'; break;
        case 75: top = '(√6 + √2)²'; fin = '2 + √3'; break;
        case 105: top = '(√6 + √2)²'; fin = '−(2 + √3)'; break;
        default: top = '(√6 − √2)²'; fin = '−(2 − √3) = √3 − 2';
      }
      switch (deg) {
        case 15: ratio = '(√6 − √2)/(√6 + √2)'; break;
        case 75: ratio = '(√6 + √2)/(√6 − √2)'; break;
        case 105: ratio = '(√6 + √2)/(√2 − √6) = −(√6 + √2)/(√6 − √2)'; break;
        default: ratio = '(√6 − √2)/(−(√6 + √2)) = −(√6 − √2)/(√6 + √2)';
      }
      const minusSide = deg === 15 || deg === 165;
      const conj = minusSide ? '(√6 − √2)' : '(√6 + √2)';
      const num = minusSide ? '8 − 4√3' : '8 + 4√3';
      const sgnTxt = minusSide ? '−' : '+';
      L.push(Hdr(6, `tan ${deg}° = sin/cos`, `tan ${deg}° = sin/cos`) +
        `tan ${deg}° = sin ${deg}° / cos ${deg}° = ${ratio}\n` +
        tx(`Paydaki kökü yok etmek için pay ve paydayı eşleniğiyle ${conj} çarpabiliriz:`, `To remove the radical from the denominator, we can multiply top and bottom by the conjugate ${conj}:`) + '\n' +
        tx('pay', 'numerator') + `: ${top} = 6 + 2 ${sgnTxt} 2√12 = 6 + 2 ${sgnTxt} 4√3 = ${num};   ` + tx('payda', 'denominator') + ': (√6)² − (√2)² = 6 − 2 = 4.\n' +
        (sgn < 0 ? `tan ${deg}° = −(${num})/4 = ${fin}` : `tan ${deg}° = (${num})/4 = ${fin}`) + '\n' +
        tx(`Ondalık kontrol: ${fin} ≈ ${D4(Math.tan(target))} ve tan ${deg}° = ${D4(Math.tan(target))} ✓`, `Decimal check: ${fin} ≈ ${D4(Math.tan(target))} and tan ${deg}° = ${D4(Math.tan(target))} ✓`));
    }
    const sp = GetSpec(p);
    L.push(Hdr(L.length + 1, 'Grafik neyi gösteriyor?', 'What the graph shows') +
      tx(`Grafikte A yerine x değişkenini koyarız: sol taraf ${sp.lName}, sağ taraf ${sp.rName}. İki eğri her x'te çakışır; x = ${a}° noktasındaki işaretli değer ${FnName(f)} ${deg}° sonucudur.`,
        `The graph treats A as the variable x: left side ${sp.lName}, right side ${sp.rName}. The two curves coincide at every x; the marked value at x = ${a}° is the result ${FnName(f)} ${deg}°.`));
    L.push(TestStep(L.length + 1, p, sp));
    return L;
  }

  // ---- (c) double angle ----
  function StepsDouble(p) {
    const L = [];
    const { sn, cn, d } = Trip(p, false);
    const q = p.quad;
    const s2n = 2 * sn * cn;
    const c2n = cn * cn - sn * sn;
    const dd = d * d;
    const th = ThetaRad(sn, cn);
    const deg = th * 180.0 / Math.PI;
    const two = (2 * deg) % 360.0;

    L.push(Hdr(1, 'Verilenler', 'Given') +
      tx(`sin θ = ${Fr(sn, d)} ve θ, ${QuadName(q)}'de. Bulmak istediğimiz: sin 2θ, cos 2θ, tan 2θ. Çift açı formülleri hem sin θ hem cos θ ister; cos θ'yı Pisagor özdeşliğiyle bulabiliriz.`,
        `sin θ = ${Fr(sn, d)} and θ lies in ${QuadName(q)}. We want sin 2θ, cos 2θ, tan 2θ. The double-angle formulas need both sin θ and cos θ; we can get cos θ from the Pythagorean identity.`));
    L.push(Hdr(2, "cos θ'yı bulalım", 'Find cos θ') +
      tx(`cos²θ = 1 − sin²θ = 1 − ${sn * sn}/${dd} = ${cn * cn}/${dd} ⇒ |cos θ| = ${Math.abs(cn)}/${d}.\n${QuadName(q)}'de cos θ ${SignWord(cn > 0)} olduğundan cos θ = ${Fr(cn, d)}.`,
        `cos²θ = 1 − sin²θ = 1 − ${sn * sn}/${dd} = ${cn * cn}/${dd} ⇒ |cos θ| = ${Math.abs(cn)}/${d}.\nIn ${QuadName(q)} cos θ is ${SignWord(cn > 0)}, so cos θ = ${Fr(cn, d)}.`));
    L.push(Hdr(3, 'sin 2θ = 2 sin θ cos θ', 'sin 2θ = 2 sin θ cos θ') +
      `sin 2θ = 2·${FrP(sn, d)}·${FrP(cn, d)} = ${Fr(2 * sn * cn, dd)}\n` +
      tx(`(pay: 2·${Mn(sn)}·${Mn(cn)} = ${Mn(s2n)}, payda: ${d}·${d} = ${dd})`, `(numerator: 2·${Mn(sn)}·${Mn(cn)} = ${Mn(s2n)}, denominator: ${d}·${d} = ${dd})`));
    L.push(Hdr(4, "cos 2θ'nın üç eşdeğer biçimine bakalım", 'The three equivalent forms of cos 2θ') +
      `(i)   cos²θ − sin²θ = ${cn * cn}/${dd} − ${sn * sn}/${dd} = ${Mn(c2n)}/${dd}${Eq(c2n, dd)}\n` +
      `(ii)  2cos²θ − 1 = 2·${cn * cn}/${dd} − 1 = (${2 * cn * cn} − ${dd})/${dd} = ${Mn(2 * cn * cn - dd)}/${dd}${Eq(2 * cn * cn - dd, dd)}\n` +
      `(iii) 1 − 2sin²θ = 1 − 2·${sn * sn}/${dd} = (${dd} − ${2 * sn * sn})/${dd} = ${Mn(dd - 2 * sn * sn)}/${dd}${Eq(dd - 2 * sn * sn, dd)}\n` +
      tx('Üçü de aynı sonucu verir; çünkü sin²θ + cos²θ = 1.', 'All three agree, because sin²θ + cos²θ = 1.'));
    L.push(Hdr(5, 'tan 2θ', 'tan 2θ') +
      tx(`tan 2θ = sin 2θ / cos 2θ = (${Fr(s2n, dd)}) / (${Fr(c2n, dd)}) = ${Fr(s2n, c2n)}.\nKontrol: tan θ = ${Fr(sn, cn)} ise 2tanθ/(1 − tan²θ) = ${Fr(2 * sn * cn, cn * cn - sn * sn)} (pay ve paydayı cos²θ ile çarpınca aynı sonucu görürüz).`,
        `tan 2θ = sin 2θ / cos 2θ = (${Fr(s2n, dd)}) / (${Fr(c2n, dd)}) = ${Fr(s2n, c2n)}.\nCheck: with tan θ = ${Fr(sn, cn)}, 2tanθ/(1 − tan²θ) = ${Fr(2 * sn * cn, cn * cn - sn * sn)} (multiply top and bottom by cos²θ to see they agree).`));
    L.push(Hdr(6, 'Pisagor ile kontrol edelim', 'Pythagorean check') +
      `sin²2θ + cos²2θ = (${Fr(s2n, dd)})² + (${Fr(c2n, dd)})² = ${s2n * s2n} / ${dd * dd} + ${c2n * c2n} / ${dd * dd} = ${s2n * s2n + c2n * c2n}/${dd * dd} = 1 ✓`);
    L.push(Hdr(7, 'Ondalık kontrol', 'Decimal check') +
      tx(`θ ≈ ${fmt2(deg)}° ⇒ 2θ ≈ ${fmt2(2 * deg)}° (≡ ${fmt2(two)}°). sin 2θ ≈ ${f4(Math.sin(2 * th))} (≈ ${f4(s2n / dd)}), cos 2θ ≈ ${f4(Math.cos(2 * th))} (≈ ${f4(c2n / dd)}), tan 2θ ≈ ${D4(Math.tan(2 * th))}.`,
        `θ ≈ ${fmt2(deg)}° ⇒ 2θ ≈ ${fmt2(2 * deg)}° (≡ ${fmt2(two)}°). sin 2θ ≈ ${f4(Math.sin(2 * th))} (≈ ${f4(s2n / dd)}), cos 2θ ≈ ${f4(Math.cos(2 * th))} (≈ ${f4(c2n / dd)}), tan 2θ ≈ ${D4(Math.tan(2 * th))}.`));
    L.push(TestStep(8, p, GetSpec(p)));
    return L;
  }

  // ---- (d) half angle ----
  function DenestNote(alpha, f) {
    const a = Math.round(alpha * 2);
    if (a === 30 || a === 150 || a === 210) {
      const big = '(√6 + √2)/4', small = '(√6 − √2)/4';
      const useBig = (f === 1 && a === 30) || (f === 0 && a !== 30);
      const sg = (f === 1 && a === 210) ? '−' : '';
      const v = sg + (useBig ? big : small);
      return '\n' + tx(`İç içe kök sadeleşir: bu değer ${v} ile aynıdır (iki tarafın karesini alarak doğrulanabilir).`,
        `The nested radical simplifies: this value equals ${v} (square both sides to verify).`);
    }
    return '';
  }

  function StepsHalf(p) {
    const L = [];
    const idx = mod(p.choice, 6);
    const t2 = HALF_TWICE[idx];
    const f = p.fn;
    const alpha = t2 / 2.0;
    const alphaT = DegText(t2);
    const { s: s2, c: c2 } = SC(t2);
    const cosNeg = alpha > 90;
    const aRad = alpha * Math.PI / 180.0;
    const sgnN = c2.N;
    const rr = '√' + c2.R;
    const plusTxt = sgnN > 0 ? '2 + ' + rr : '2 − ' + rr;
    const minusTxt = sgnN > 0 ? '2 − ' + rr : '2 + ' + rr;
    const sinVal = '√(' + minusTxt + ')/2';
    const cosVal = (cosNeg ? '−' : '') + '√(' + plusTxt + ')/2';

    L.push(Hdr(1, 'Fikir', 'Idea') +
      tx(`${alphaT} = (${t2}°)/2 ve ${t2}° standart bir açı. Bulmak istediğimiz: ${FnName(f)} ${alphaT}. Yarım açı formülleri cos ${t2}°'den ${FnName(f)} ${alphaT}'yi verir.`,
        `${alphaT} = (${t2}°)/2 and ${t2}° is a standard angle. We want ${FnName(f)} ${alphaT}. The half-angle formulas turn cos ${t2}° into ${FnName(f)} ${alphaT}.`));
    L.push(Hdr(2, "Formüller (cos 2α'dan)", 'Formulas (from cos 2α)') +
      'cos²α = (1 + cos 2α)/2\nsin²α = (1 − cos 2α)/2\ntan α = sin 2α/(1 + cos 2α)\n' +
      tx(`Burada 2α = ${t2}°: cos ${t2}° = ${c2}, sin ${t2}° = ${s2}.`, `Here 2α = ${t2}°: cos ${t2}° = ${c2}, sin ${t2}° = ${s2}.`));
    if (f === 1) {
      L.push(Hdr(3, 'cos²α\'yı hesaplayalım', 'Compute cos²α') +
        `cos²(${alphaT}) = (1 + ${c2.paren()})/2 = ((${plusTxt})/2)/2 = (${plusTxt})/4\n` +
        tx('(1 + cos 2α bir kesir olarak (2 ± √r)/2 olur; sonra 2\'ye böleriz.)', '(1 + cos 2α becomes (2 ± √r)/2 as one fraction; then we divide by 2.)'));
    } else if (f === 0) {
      L.push(Hdr(3, 'sin²α\'yı hesaplayalım', 'Compute sin²α') +
        `sin²(${alphaT}) = (1 − ${c2.paren()})/2 = ((${minusTxt})/2)/2 = (${minusTxt})/4\n` +
        tx('(1 − cos 2α bir kesir olarak (2 ∓ √r)/2 olur; sonra 2\'ye böleriz.)', '(1 − cos 2α becomes (2 ∓ √r)/2 as one fraction; then we divide by 2.)'));
    }
    if (f === 1) {
      L.push(Hdr(4, 'Kökü alalım, işareti bölgeden seçelim', 'Take the root; sign from the quadrant') +
        tx(`α = ${alphaT}, ${cosNeg ? 'II. bölgede' : 'I. bölgede'} ⇒ cos α ${SignWord(!cosNeg)}.\ncos(${alphaT}) = ${cosNeg ? '−' : '+'}√((${plusTxt})/4) = ${cosVal}.`,
          `α = ${alphaT} is in ${cosNeg ? 'quadrant II' : 'quadrant I'} ⇒ cos α is ${SignWord(!cosNeg)}.\ncos(${alphaT}) = ${cosNeg ? '−' : '+'}√((${plusTxt})/4) = ${cosVal}.`));
      const v = Math.cos(aRad);
      L.push(Hdr(5, 'Ondalık kontrol', 'Decimal check') +
        `${cosVal} ≈ ${cosNeg ? '−' : ''}√(${f4(2 + sgnN * Math.sqrt(c2.R))})/2 ≈ ${D4(v)}  ↔  cos(${alphaT}) = ${D4(v)} ✓` + DenestNote(alpha, 1));
    } else if (f === 0) {
      L.push(Hdr(4, 'Kökü alalım, işareti bölgeden seçelim', 'Take the root; sign from the quadrant') +
        tx(`α = ${alphaT}, ${cosNeg ? 'II. bölgede' : 'I. bölgede'} ⇒ sin α pozitif (her iki bölgede de).\nsin(${alphaT}) = +√((${minusTxt})/4) = ${sinVal}.`,
          `α = ${alphaT} is in ${cosNeg ? 'quadrant II' : 'quadrant I'} ⇒ sin α is positive (in both quadrants).\nsin(${alphaT}) = +√((${minusTxt})/4) = ${sinVal}.`));
      const v = Math.sin(aRad);
      L.push(Hdr(5, 'Ondalık kontrol', 'Decimal check') +
        `${sinVal} ≈ √(${f4(2 - sgnN * Math.sqrt(c2.R))})/2 ≈ ${D4(v)}  ↔  sin(${alphaT}) = ${D4(v)} ✓` + DenestNote(alpha, 0));
    } else {
      let res, mid;
      switch (t2) {
        case 30: mid = '= 1/(2 + √3) = (2 − √3)/((2 + √3)(2 − √3)) = (2 − √3)/(4 − 3)'; res = '2 − √3'; break;
        case 45: mid = '= √2/(2 + √2) = √2(2 − √2)/((2 + √2)(2 − √2)) = (2√2 − 2)/(4 − 2)'; res = '√2 − 1'; break;
        case 135: mid = '= √2/(2 − √2) = √2(2 + √2)/((2 − √2)(2 + √2)) = (2√2 + 2)/(4 − 2)'; res = '√2 + 1'; break;
        case 150: mid = '= 1/(2 − √3) = (2 + √3)/((2 − √3)(2 + √3)) = (2 + √3)/(4 − 3)'; res = '2 + √3'; break;
        case 210: mid = '= −1/(2 − √3) = −(2 + √3)/((2 − √3)(2 + √3)) = −(2 + √3)/(4 − 3)'; res = '−(2 + √3)'; break;
        default: mid = '= −√2/(2 − √2) = −√2(2 + √2)/((2 − √2)(2 + √2)) = −(2√2 + 2)/(4 − 2)'; res = '−(√2 + 1)';
      }
      const top = `(${s2.toString()})/(1 + ${c2.paren()})`;
      const simp = (t2 === 30 || t2 === 150 || t2 === 210)
        ? `(${t2 === 210 ? '−' : ''}1/2)/((2 ${t2 === 30 ? '+' : '−'} √3)/2)`
        : `(${t2 === 225 ? '−' : ''}√2/2)/((2 ${t2 === 45 ? '+' : '−'} √2)/2)`;
      L.push(Hdr(3, 'İşaret sorunu olmayan tanjant formülü', 'The tangent formula has no sign problem') +
        tx(`tan(${alphaT}) = sin ${t2}° / (1 + cos ${t2}°) = ${top}\n= ${simp}   (pay ve paydayı 2 ile genişlettik)\n${mid} = ${res}.`,
          `tan(${alphaT}) = sin ${t2}° / (1 + cos ${t2}°) = ${top}\n= ${simp}   (we cleared the halves)\n${mid} = ${res}.`));
      const v = Math.tan(aRad);
      L.push(Hdr(4, 'Ondalık kontrol', 'Decimal check') +
        `${res} ≈ ${D4(v)}  ↔  tan(${alphaT}) = ${D4(v)} ✓\n` +
        tx('(Bu formülde kök olmadığından işaret kendiliğinden doğru çıkar; II. bölgede tanjant negatiftir.)', '(There is no square root here, so the sign comes out right automatically; tangent is negative in quadrant II.)'));
    }
    const sp = GetSpec(p);
    L.push(Hdr(L.length + 1, 'Grafik neyi gösteriyor?', 'What the graph shows') +
      tx(`Soldaki ${sp.lName} ile sağdaki ${sp.rName} aynı eğridir. İşaretli nokta ${sp.thetaLabel} değerini gösterir.`,
        `${sp.lName} on the left and ${sp.rName} on the right are the same curve. The marked point shows ${sp.thetaLabel}.`));
    L.push(TestStep(L.length + 1, p, sp));
    return L;
  }

  // ---- (e) prove an identity ----
  function StepsProve(p) {
    const L = [];
    const v = mod(p.choice, 6);
    const { l: lt, r: rt } = IdTexts(v);
    const sp = GetSpec(p);
    const x = p.testX;
    const sx = Math.sin(x), cx = Math.cos(x);
    let dom;
    switch (v) {
      case 0: dom = 'sin x ≠ 0 (x ≠ kπ)'; break;
      case 1: dom = 'cos x ≠ 0 (x ≠ π/2 + kπ)'; break;
      case 3: dom = tx('sin x ≠ 0 ve cos x ≠ 0 (x ≠ kπ/2)', 'sin x ≠ 0 and cos x ≠ 0 (x ≠ kπ/2)'); break;
      default: dom = tx('her x', 'every x');
    }
    L.push(Hdr(1, 'Neyi kanıtlayacağız?', 'What is to be proved') +
      tx(`${lt} = ${rt}    (geçerli olduğu yer: ${dom}).\nÖnce bir sayıyla kontrol ederiz (güven verir ama ispat değildir), sonra cebirle gösteririz.`,
        `${lt} = ${rt}    (valid for: ${dom}).\nFirst we test it with a number (this builds confidence but is not a proof), then we prove it algebraically.`));
    const lv = sp.lhs(x), rv = sp.rhs(x);
    const bad = isNaN(lv) || isNaN(rv);
    L.push(Hdr(2, 'Sayısal doğrulama', 'Numerical verification') +
      tx(`x = ${fmt2(x)} rad seçelim: sin x ≈ ${f4(sx)}, cos x ≈ ${f4(cx)}.\nSol: ${lt} ≈ ${D4(lv)}\nSağ: ${rt} ≈ ${D4(rv)}\n` +
        (bad ? 'Bu x özdeşliğin tanım kümesi dışında; başka bir x seçebiliriz.' : "İki sayı eşit ⇒ özdeşlik bu x için doğru ✓ (ama diğer tüm x'ler için bunu cebir gösterecek)."),
        `Take x = ${fmt2(x)} rad: sin x ≈ ${f4(sx)}, cos x ≈ ${f4(cx)}.\nLeft: ${lt} ≈ ${D4(lv)}\nRight: ${rt} ≈ ${D4(rv)}\n` +
        (bad ? 'This x is outside the domain of the identity; we can pick another x.' : 'The two numbers agree ⇒ the identity holds at this x ✓ (algebra will show it for every other x).')));
    let proof;
    switch (v) {
      case 0:
        proof = tx('Sol tarafla başlayalım: (1 − cos²x)/sin x.\nsin²x + cos²x = 1 olduğundan 1 − cos²x = sin²x.\nSol = sin²x / sin x = sin x   (sin x ≠ 0 olduğundan sadeleşir) = Sağ ∎',
          'Start with the left side: (1 − cos²x)/sin x.\nSince sin²x + cos²x = 1, 1 − cos²x = sin²x.\nLeft = sin²x / sin x = sin x   (cancel, because sin x ≠ 0) = Right ∎');
        break;
      case 1:
        proof = tx('Sol: sin 2x/(1 + cos 2x).\nPay: sin 2x = 2 sin x cos x.\nPayda: 1 + cos 2x = 1 + (2cos²x − 1) = 2cos²x.\nSol = 2 sin x cos x / (2cos²x) = sin x / cos x = tan x   (cos x ≠ 0) = Sağ ∎',
          'Left: sin 2x/(1 + cos 2x).\nNumerator: sin 2x = 2 sin x cos x.\nDenominator: 1 + cos 2x = 1 + (2cos²x − 1) = 2cos²x.\nLeft = 2 sin x cos x / (2cos²x) = sin x / cos x = tan x   (cos x ≠ 0) = Right ∎');
        break;
      case 2:
        proof = tx('Sol: (sin x + cos x)² açılımı (a + b)² = a² + 2ab + b²:\n= sin²x + 2 sin x cos x + cos²x\n= (sin²x + cos²x) + 2 sin x cos x = 1 + sin 2x = Sağ ∎',
          'Left: expand (sin x + cos x)² using (a + b)² = a² + 2ab + b²:\n= sin²x + 2 sin x cos x + cos²x\n= (sin²x + cos²x) + 2 sin x cos x = 1 + sin 2x = Right ∎');
        break;
      case 3:
        proof = tx('Sol: tan x + cot x = sin x/cos x + cos x/sin x.\nOrtak payda: (sin²x + cos²x)/(sin x cos x) = 1/(sin x cos x).\nsin 2x = 2 sin x cos x olduğundan sin x cos x = (sin 2x)/2, dolayısıyla Sol = 2/sin 2x = Sağ ∎',
          'Left: tan x + cot x = sin x/cos x + cos x/sin x.\nCommon denominator: (sin²x + cos²x)/(sin x cos x) = 1/(sin x cos x).\nSince sin 2x = 2 sin x cos x, sin x cos x = (sin 2x)/2, so Left = 2/sin 2x = Right ∎');
        break;
      case 4:
        proof = tx('Sol: (1 − sin x)(1 + sin x) iki kare farkıdır (a − b)(a + b) = a² − b²:\n= 1 − sin²x = cos²x   (sin²x + cos²x = 1) = Sağ ∎',
          'Left: (1 − sin x)(1 + sin x) is a difference of squares (a − b)(a + b) = a² − b²:\n= 1 − sin²x = cos²x   (sin²x + cos²x = 1) = Right ∎');
        break;
      default:
        proof = tx('Sol: cos⁴x − sin⁴x iki kare farkıdır (cos²x)² − (sin²x)²:\n= (cos²x − sin²x)(cos²x + sin²x)\n= (cos²x − sin²x)·1 = cos 2x   (çift açı formülü) = Sağ ∎',
          'Left: cos⁴x − sin⁴x is a difference of squares (cos²x)² − (sin²x)²:\n= (cos²x − sin²x)(cos²x + sin²x)\n= (cos²x − sin²x)·1 = cos 2x   (double-angle formula) = Right ∎');
    }
    L.push(Hdr(3, 'Cebirsel ispat (sol taraftan sağa doğru)', 'Algebraic proof (left side to right side)') + proof);
    L.push(Hdr(4, 'Neden tek bir sayı yetmez?', 'Why a number is not enough') +
      tx("Bir sayıyla kontrol yalnızca o x için doğruluğu gösterir; iki farklı ifade tesadüfen bir x'te eşit olabilir (ör. sin x ile x, x = 0'da). Cebirsel ispat TÜM x'ler için geçerlidir. Grafikte bu, iki eğrinin her yerde çakışması olarak görünür.",
        'A numerical check proves the identity only at that x; two different expressions can agree by accident at some x (e.g. sin x and x at x = 0). The algebraic proof holds for ALL x. On the graph this shows up as the two curves coinciding everywhere.'));
    L.push(TestStep(5, p, sp));
    return L;
  }

  // ---- (f) simplify with sum/difference ----
  function StepsSimplify(p) {
    const L = [];
    const v = mod(p.choice, 12);
    const { fnI, a, form } = VariantParts(v);
    const { sA, cA, sB, cB, sg } = BuildFactors(v);
    const aTxt = PiTxt(a);
    const sav = a === 2 ? 1 : 0, cav = a === 2 ? 0 : -1;
    const expr = `${FnName(fnI)}(${FormTxt(form, a)})`;
    const Aname = form === 2 ? aTxt : 'x';
    const Bname = form === 2 ? 'x' : aTxt;
    const sgS = sg > 0 ? '+' : '−';
    const sgInv = sg > 0 ? '−' : '+';
    const { cs, cc } = SimplifyCoefs(v);
    const res = SimplifiedText(cs, cc);
    const sp = GetSpec(p);

    const formula = fnI === 0 ? `sin(A ${sgS} B) = sin A cos B ${sgS} cos A sin B` : `cos(A ${sgS} B) = cos A cos B ${sgInv} sin A sin B`;
    L.push(Hdr(1, 'Hangi formül?', 'Which formula?') +
      tx(`${expr} ifadesini sadeleştirelim. Argüman iki terimin ${sg > 0 ? 'toplamı' : 'farkıdır'}: A = ${Aname}, B = ${Bname}.\nKullanabileceğimiz formül: ${formula}.`,
        `Let's simplify ${expr}. The argument is a ${sg > 0 ? 'sum' : 'difference'} of two terms: A = ${Aname}, B = ${Bname}.\nFormula we can use: ${formula}.`));
    L.push(Hdr(2, `${aTxt}'nin sin ve cos değerleri`, `The sin and cos of ${aTxt}`) +
      tx(`sin ${aTxt} = ${Mn(sav)},   cos ${aTxt} = ${Mn(cav)}  (birim çemberde ${a === 2 ? '(0, 1) noktası' : '(−1, 0) noktası'}).`,
        `sin ${aTxt} = ${Mn(sav)},   cos ${aTxt} = ${Mn(cav)}  (on the unit circle this is the point ${a === 2 ? '(0, 1)' : '(−1, 0)'}).`));
    let line1, line2;
    if (fnI === 0) {
      line1 = `${expr} = sin ${Aname} cos ${Bname} ${sgS} cos ${Aname} sin ${Bname}`;
      line2 = `= ${Par(sA)}${Par(cB)} ${sgS} ${Par(cA)}${Par(sB)}`;
    } else {
      line1 = `${expr} = cos ${Aname} cos ${Bname} ${sgInv} sin ${Aname} sin ${Bname}`;
      line2 = `= ${Par(cA)}${Par(cB)} ${sgInv} ${Par(sA)}${Par(sB)}`;
    }
    L.push(Hdr(3, 'Yerine koyalım', 'Substitute') + line1 + '\n' + line2);
    let c1, c2, n1, n2;
    if (fnI === 0) {
      const a1 = ProdFactors(sA, cB); c1 = a1.c; n1 = a1.name;
      const a2 = ProdFactors(cA, sB); c2 = sg * a2.c; n2 = a2.name;
    } else {
      const a1 = ProdFactors(cA, cB); c1 = a1.c; n1 = a1.name;
      const a2 = ProdFactors(sA, sB); c2 = -sg * a2.c; n2 = a2.name;
    }
    const t1 = c1 < 0 ? '(−' + Math.abs(c1) + ')' : String(c1);
    const t2 = String(Math.abs(c2));
    L.push(Hdr(4, 'Sadeleştirelim', 'Simplify') +
      `= ${t1}·${n1} ${c2 < 0 ? '−' : '+'} ${t2}·${n2}\n` +
      tx(`Sıfırla çarpılan terim yok olur. Sonuç: ${expr} = ${res}.`, `The term multiplied by zero vanishes. Result: ${expr} = ${res}.`));
    const x = p.testX;
    L.push(Hdr(5, 'Sayısal kontrol edelim', 'Numerical check') +
      tx(`x = ${fmt2(x)} için: sol ${expr} = ${D4(sp.lhs(x))}, sağ ${res} = ${D4(sp.rhs(x))}. Eşit ✓`,
        `For x = ${fmt2(x)}: left ${expr} = ${D4(sp.lhs(x))}, right ${res} = ${D4(sp.rhs(x))}. Equal ✓`));
    L.push(Hdr(6, 'Geometrik anlam', 'Geometric meaning') +
      tx(`Bu tür sonuçlara 'eş fonksiyon' kuralları denir: π/2 kaymak sin ve cos'u birbirine çevirir, π kaymak işareti değiştirir. Grafikte ${expr} eğrisi, ${res} eğrisinin kaymış hâlidir ve ikisi çakışıktır.`,
        `Results like these are the 'co-function' rules: shifting by π/2 turns sin into cos and vice versa, shifting by π flips the sign. On the graph the curve ${expr} is ${res} and the two coincide.`));
    L.push(TestStep(7, p, sp));
    return L;
  }

  // ================= drawing =================
  // the point asked for (theta marker), otherwise the test point on the left curve
  function focusPoint(p) {
    const sp = GetSpec(p);
    if (!isNaN(sp.thetaX) && !isNaN(sp.thetaY) && isFinite(sp.thetaY)) return { x: sp.thetaX, y: sp.thetaY };
    const l = sp.lhs(p.testX);
    return { x: p.testX, y: (!isNaN(l) && isFinite(l)) ? l : 0 };
  }

  function draw(canvas, p) {
    const sp = GetSpec(p);
    const fp = focusPoint(p);
    const cx = 0, cy = (sp.yMax + sp.yMin) / 2; // fixed axes: the origin stays where it is
    const half = (sp.yMax - sp.yMin) / 2;
    canvas.setViewport(cx - 2 * Math.PI, cx + 2 * Math.PI, cy - half, cy + half);
    canvas.addFunction({ evaluator: sp.lhs, color: BLUE, thickness: 4, label: sp.lName });
    canvas.addFunction({ evaluator: sp.rhs, color: ORANGERED, thickness: 2.5, dashed: true, label: sp.rName });

    const lx = cx - 2 * Math.PI + 0.25;
    const span = sp.yMax - sp.yMin;
    const yTop = cy + half;
    canvas.addMarker({ x: lx, y: yTop - 0.07 * span, color: BLUE, radius: 4, label: tx('Sol: ', 'Left: ') + sp.lName });
    canvas.addMarker({ x: lx, y: yTop - 0.14 * span, color: ORANGERED, shape: 'diamond', radius: 4, label: tx('Sağ (çizgili): ', 'Right (dashed): ') + sp.rName });

    const x = p.testX;
    const l = sp.lhs(x), r = sp.rhs(x);
    if (!isNaN(l) && isFinite(l)) {
      canvas.addSegment({ x1: x, y1: 0, x2: x, y2: l, color: canvas.gray(), dashed: true, thickness: 1.5 });
      canvas.addMarker({ x, y: l, color: canvas.gold(), radius: 7, label: `LHS = ${D2s(l)}, RHS = ${D2s(r)}` });
    } else {
      canvas.addGuideLine({ axis: 'vertical', position: x, color: canvas.gray(), label: tx('x: tanımsız', 'x: undefined') });
    }
    if (!isNaN(sp.thetaX) && !isNaN(sp.thetaY) && isFinite(sp.thetaY)) {
      canvas.addMarker({ x: sp.thetaX, y: sp.thetaY, color: LIME, shape: 'square', radius: 6 });
      canvas.addMarker({ x: lx, y: yTop - 0.21 * span, color: LIME, shape: 'square', radius: 4, label: sp.thetaLabel + (sp.thetaAppend ? ' = ' + D2s(sp.thetaY) : '') });
    }
  }

  // ================= controls =================
  function buildControls(rightCol, getProblem, h) {
    const labels = () => [
      tx('a) Pisagor özdeşlikleri', 'a) Pythagorean identities'),
      tx('b) Toplam/fark formülleri', 'b) Sum/difference formulas'),
      tx('c) Çift açı', 'c) Double angle'),
      tx('d) Yarım açı', 'd) Half angle'),
      tx('e) Özdeşlik ispatı', 'e) Prove an identity'),
      tx('f) Sadeleştirme', 'f) Simplify'),
    ];
    kindSel = h.addSelect({
      options: labels().map((label, value) => ({ label, value })),
      get: () => getProblem().kind,
      set: (v) => { forcedKind = Number(v); h.regenerate(); forcedKind = -1; },
    });
    if (offLang) offLang();
    offLang = I18N.onChange(() => {
      const ls = labels();
      for (let i = 0; i < kindSel.select.options.length && i < ls.length; i++) kindSel.select.options[i].textContent = ls[i];
    });
    const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
    h.addSlider({ caption: tx('Deneme açısı x (rad)', 'Test angle x (rad)'), min: -6.28, max: 6.28,
      get: () => getProblem().testX, set: (v) => { const r = Math.round(v * 100) / 100; getProblem().testX = r === 0 ? 0 : r; } });
    h.addSlider({ caption: tx('Bölge (a, c türü: 1–4)', 'Quadrant (types a, c: 1–4)'), min: 1, max: 4,
      get: () => getProblem().quad, set: (v) => { getProblem().quad = clampInt(v, 1, 4); } });
    h.addSlider({ caption: tx('Pisagor üçlüsü (a, c türü: 1–5)', 'Pythagorean triple (types a, c: 1–5)'), min: 1, max: 5,
      get: () => getProblem().triple + 1, set: (v) => { getProblem().triple = Math.max(0, Math.min(4, Math.round(v) - 1)); } });
    h.addSlider({ caption: tx('Fonksiyon (b, d türü: 1 sin, 2 cos, 3 tan)', 'Function (types b, d: 1 sin, 2 cos, 3 tan)'), min: 1, max: 3,
      get: () => getProblem().fn + 1, set: (v) => { getProblem().fn = Math.max(0, Math.min(2, Math.round(v) - 1)); } });
    h.addSlider({ caption: tx('Seçim no (b: 1–8, d, e: 1–6, f: 1–12)', 'Choice no. (b: 1–8, d, e: 1–6, f: 1–12)'), min: 1, max: 12,
      get: () => getProblem().choice + 1, set: (v) => { getProblem().choice = Math.max(0, Math.min(11, Math.round(v) - 1)); } });
  }

  Topics.register('trig', {
    id: 'trigIdentities',
    tabTitle: () => tx('Trigonometrik Özdeşlikler', 'Trigonometric Identities'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    links: [
      { match: /^(PİSAGOR ÖZDEŞLİKLERİ|PYTHAGOREAN IDENTITIES) \(/, make: (rng) => genProblem(rng, 0) },
      { match: /^\s+cos\(A ± B\) = /, make: (rng) => Object.assign(genProblem(rng, 1), { fn: 1 }) },
      { match: /^\s+sin\(A ± B\) = /, make: (rng) => Object.assign(genProblem(rng, 1), { fn: 0 }) },
      { match: /^\s+tan\(A ± B\) = /, make: (rng) => Object.assign(genProblem(rng, 1), { fn: 2 }) },
      { match: /^(ÇİFT AÇI|DOUBLE ANGLE) \(/, make: (rng) => genProblem(rng, 2) },
      { match: /^\s+cos²θ = \(1 \+ cos 2θ\)\/2/, make: (rng) => Object.assign(genProblem(rng, 3), { fn: rng.nextInt(0, 2) }) },
      { match: /^\s+tan\(θ\) = sin 2θ\//, make: (rng) => Object.assign(genProblem(rng, 3), { fn: 2 }) },
      { match: /^5\) (Özdeşlik ispatında|To prove an identity)/, make: (rng) => genProblem(rng, 4) },
    ],
    draw,
    focus: (p) => focusPoint(p),
    buildControls,
  });
})();
