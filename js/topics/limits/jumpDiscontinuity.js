// Limits & Continuity - "Jump Discontinuity" (ported from Modules/Limits/JumpDiscontinuityControl.vb, enriched).
// problem = { kind, a, s, off, closed, show, ... }
//   'pieces' : two polynomial pieces; s = jump size (R - L); f(a) belongs to the right / left piece, or is a separate value
//   'sign'   : f(x) = s * |x-a|/(x-a) + d  (f(a) not defined)       -> L = d - s, R = d + s
//   'floor'  : f(x) = s * floor(x), a integer                       -> L = s(a-1), R = s a
// s = 0 is allowed on purpose: the "jump" disappears and the text switches to the "no jump" case.
(function () {
  const T = (tr, en) => I18N.tx(tr, en);
  const OFF_MIN = 0.01, OFF_MAX = 4;

  function nf(v, d) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0' || s === '') s = '0';
    return s;
  }
  function par(v) { return v < 0 ? '(' + fmt2(v) + ')' : fmt2(v); }
  function polyStr(c) {
    const n = c.length - 1;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const k = c[i];
      if (k === 0) continue;
      const d = n - i, ab = Math.abs(k);
      const body = d === 0 ? fmt2(ab) : ((ab === 1 ? '' : fmt2(ab)) + 'x' + (d === 1 ? '' : d === 2 ? '²' : '³'));
      if (s === '') s = (k < 0 ? '-' : '') + body; else s += (k < 0 ? ' - ' : ' + ') + body;
    }
    return s || '0';
  }
  function polyEval(c, x) { let r = 0; for (let i = 0; i < c.length; i++) r = r * x + c[i]; return r; }
  function xi(a) { return a === 0 ? 'x' : (a > 0 ? 'x - ' + a : 'x + ' + (-a)); }
  function xm(a) { return a === 0 ? 'x' : (a > 0 ? '(x - ' + a + ')' : '(x + ' + (-a) + ')'); }

  function model(p) {
    const a = p.a, s = p.s, m = { a, kind: p.kind };
    if (p.kind === 'sign') {
      const d = p.d;
      m.Ll = d - s; m.Lr = d + s; m.fa = null;
      m.fL = (x) => (x < a ? d - s : NaN);
      m.fR = (x) => (x > a ? d + s : NaN);
      m.f = (x) => (x < a ? d - s : x > a ? d + s : NaN);
      m.str = `${s === 1 ? '' : s === -1 ? '-' : s + '·'}|${xi(a)}| / ${xm(a)}${d === 0 ? '' : (d > 0 ? ' + ' + d : ' - ' + (-d))}`;
      m.strL = fmt2(d - s); m.strR = fmt2(d + s);
    } else if (p.kind === 'floor') {
      const k = s;
      m.Ll = k * (a - 1); m.Lr = k * a; m.fa = k * a;
      m.f = (x) => k * Math.floor(x + 1e-12);
      m.fL = (x) => (x < a ? m.f(x) : NaN);
      m.fR = (x) => (x >= a ? m.f(x) : NaN);
      m.str = `${k === 1 ? '' : k === -1 ? '-' : k + '·'}⌊x⌋`;
      m.strL = fmt2(m.Ll); m.strR = fmt2(m.Lr);
    } else {
      const cl = p.cl, Ll = polyEval(cl, a), Lr = Ll + s;
      const cr = [p.m2, Lr - p.m2 * a];
      m.cl = cl; m.cr = cr; m.Ll = Ll; m.Lr = Lr;
      const closed = p.closed;
      m.fa = closed === 'right' ? Lr : closed === 'left' ? Ll : Lr + p.dv;
      m.leftIncl = closed === 'left'; m.rightIncl = closed === 'right';
      m.fL = (x) => (x < a || (m.leftIncl && x === a) ? polyEval(cl, x) : NaN);
      m.fR = (x) => (x > a || (m.rightIncl && x === a) ? polyEval(cr, x) : NaN);
      m.f = (x) => (x < a ? polyEval(cl, x) : x > a ? polyEval(cr, x) : m.fa);
      m.strL = polyStr(cl); m.strR = polyStr(cr);
      const cL = m.leftIncl ? '≤' : '<', cR = m.rightIncl ? '≥' : '>';
      m.str = `${polyStr(cl)}  (x ${cL} ${a}),   ${polyStr(cr)}  (x ${cR} ${a})` + (closed === 'value' ? `,   f(${a}) = ${fmt2(m.fa)}` : '');
    }
    m.jump = m.Lr - m.Ll;
    return m;
  }

  function createProblem(rng) { return gen(rng, rng.pick(['pieces', 'pieces', 'pieces', 'sign', 'floor'])); }
  function gen(rng, kind, closedForce) {
    const p = { kind, off: 3, show: false, a: rng.nextInt(-3, 4) };
    if (kind === 'pieces') {
      p.cl = rng.pick([[rng.nonZeroInt(-2, 2), rng.nextInt(-3, 4)], [1, rng.nextInt(-2, 3), rng.nextInt(-2, 3)], [1, 0, rng.nextInt(-3, 2)]]);
      p.m2 = rng.pick([-2, -1, 0, 1, 2]);
      p.s = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      p.closed = rng.pick(['right', 'left', 'value']);
      if (closedForce) p.closed = closedForce;
      p.dv = rng.pick([-2, -1, 1, 2]);
    } else if (kind === 'sign') {
      p.s = rng.nonZeroInt(-3, 3);
      p.d = rng.nextInt(-2, 3);
    } else {
      p.s = rng.pick([1, 1, 2, 3, -1]);
    }
    return p;
  }

  function problemStatement(p) {
    const m = model(p);
    return T(
      `f(x) = ${m.str}\nx = ${p.a} noktasında soldan limit L₁ = lim(x→${p.a}⁻) f(x) ile sağdan limit L₂ = lim(x→${p.a}⁺) f(x) değerlerini bulalım. İki taraflı limit var mı? Süreksizliğin türünü ve (varsa) sıçrama büyüklüğünü söyleyebilir miyiz? f(${p.a}) hangi parçaya ait olur?`,
      `f(x) = ${m.str}\nLet's find the left limit L₁ = lim(x→${p.a}⁻) f(x) and the right limit L₂ = lim(x→${p.a}⁺) f(x) at x = ${p.a}. Does the two-sided limit exist? We can name the type of discontinuity and the jump size (if any). Which piece does f(${p.a}) belong to?`);
  }

  const CONCEPT_TR = [
    'TANIM',
    'Sol limit L₁ = lim(x→a⁻) f(x) ve sağ limit L₂ = lim(x→a⁺) f(x) ikisi de SONLU birer sayı ama L₁ ≠ L₂ ise f, x = a\'da SIÇRAMA süreksizliğine sahiptir. Grafik, aralarında boşluk bulunan iki parçadan oluşur.',
    '   Sıçrama büyüklüğü: |L₂ − L₁|   (işaretli fark L₂ − L₁: yukarı sıçrama ise +, aşağı ise −).',
    '   L₁ ≠ L₂ olduğundan lim(x→a) f(x) YOKTUR.',
    '',
    'KALDIRILAMAZ',
    '   Tek bir f(a) değeri hem L₁\'e hem L₂\'ye eşit olamaz; bu yüzden sıçrama hiçbir yeniden tanımlamayla düzeltilemez (delikten farkı).',
    '   f(a) tanımlı olabilir: sağ parçaya (x ≥ a) ya da sol parçaya (x ≤ a) ait olabilir ya da ayrı bir değerdir. Dolu nokta = fonksiyonun değeri, boş daire = parçanın ulaşmadığı uç.',
    '',
    'SIÇRAMA GÖSTEREN FONKSİYONLAR',
    '   - Parçalı tanımlı fonksiyonlar (x < a için bir formül, x ≥ a için başka formül).',
    '   - İşaret fonksiyonu sgn(x) = |x|/x: x = 0\'da L₁ = −1, L₂ = +1.',
    '   - Tam değer (taban) fonksiyonu ⌊x⌋: her tam sayıda 1 birimlik sıçrama (yukarı basamak).',
    '',
    'YÖNTEM',
    '   (1) a\'nın solundaki ve sağındaki formüller belirlenir (parçanın hangi ucunun dahil olduğuna bakılır).',
    '   (2) Sol formülde x = a yazarak L₁\'i, sağ formülde yazarak L₂\'yi buluruz (polinom parçalar süreklidir).',
    '   (3) Karşılaştırırız: L₁ = L₂ ise sıçrama yoktur (limit vardır); L₁ ≠ L₂ ise sıçrama vardır, limit yoktur.',
    '   (4) Sıçrama büyüklüğü |L₂ − L₁| olarak yazılır.',
    '   (5) f(a)\'nın hangi parçaya ait olduğuna bakılır ve dolu/boş daireler buna göre çizilir.',
    '',
    'SIK HATALAR',
    '   - L₁ ya da L₂\'yi f(a) ile karıştırmak; f(a) bir limit değildir.',
    '   - f(a) tanımlı diye süreklilik varsaymak: L₁ ≠ L₂ ise f(a) ne olursa olsun süreksizlik vardır.',
    '   - İki parçayı da aynı formülde x = a koyarak hesaplamak; her taraf kendi formülüyle hesaplanır.',
    '   - Sonlu sıçramayı sonsuz süreksizlikle karıştırmak: burada iki limit de sonlu sayıdır.',
    '   - Sıçrama büyüklüğünü negatif yazmak: büyüklük mutlak değerdir.',
    '',
    'MİNİ ÖRNEK',
    '   f(x) = x + 1 (x < 2), f(x) = 5 − x (x ≥ 2): L₁ = 3, L₂ = 3 eşit ⇒ sıçrama yok (limit 3; f(2) = 3 olduğundan süreklidir).',
    '   g(x) = x (x < 2), g(x) = x + 2 (x ≥ 2): L₁ = 2, L₂ = 4 ⇒ sıçrama = 2, limit yok.',
    '',
    'AKILDA TUTMA: "Sol parça bir yüksekliğe iner, sağ parça başka yükseklikten başlar; aralarında atlama var."',
  ].join('\n');

  const CONCEPT_EN = [
    'DEFINITION',
    'If the left limit L₁ = lim(x→a⁻) f(x) and the right limit L₂ = lim(x→a⁺) f(x) are both FINITE numbers but L₁ ≠ L₂, f has a JUMP discontinuity at x = a. The graph consists of two pieces with a gap between them.',
    '   Jump size: |L₂ − L₁|   (the signed difference L₂ − L₁ is + for an upward jump and − for a downward one).',
    '   Since L₁ ≠ L₂, lim(x→a) f(x) DOES NOT EXIST.',
    '',
    'NOT REMOVABLE',
    '   A single value f(a) cannot equal both L₁ and L₂, so no redefinition can repair a jump (unlike a hole).',
    '   f(a) may be defined: it may belong to the right piece (x ≥ a), to the left piece (x ≤ a), or be a separate value. Filled dot = the value of the function, open circle = the end the piece does not reach.',
    '',
    'FUNCTIONS WITH JUMPS',
    '   - Piecewise functions (one formula for x < a, another for x ≥ a).',
    '   - The sign function sgn(x) = |x|/x: at x = 0, L₁ = −1 and L₂ = +1.',
    '   - The floor function ⌊x⌋: a jump of 1 (an upward step) at every integer.',
    '',
    'METHOD',
    '   (1) We identify the formulas to the left and right of a (noting which end of each piece is included).',
    '   (2) We substitute x = a into the left formula to get L₁ and into the right formula to get L₂ (polynomial pieces are continuous).',
    '   (3) We compare: if L₁ = L₂ there is no jump (the limit exists); if L₁ ≠ L₂ there is a jump and no limit.',
    '   (4) The jump size is written as |L₂ − L₁|.',
    '   (5) We check which piece f(a) belongs to and draw the filled and open circles accordingly.',
    '',
    'COMMON PITFALLS',
    '   - Confusing L₁ or L₂ with f(a); f(a) is not a limit.',
    '   - Assuming continuity because f(a) is defined: if L₁ ≠ L₂ there is a discontinuity whatever f(a) is.',
    '   - Substituting x = a into the same formula on both sides; each side uses its own formula.',
    '   - Mixing up a finite jump with an infinite discontinuity: here both limits are finite numbers.',
    '   - Writing the jump size as a negative number: the size is an absolute value.',
    '',
    'MINI EXAMPLE',
    '   f(x) = x + 1 (x < 2), f(x) = 5 − x (x ≥ 2): L₁ = 3, L₂ = 3 equal ⇒ no jump (the limit is 3; since f(2) = 3 it is continuous).',
    '   g(x) = x (x < 2), g(x) = x + 2 (x ≥ 2): L₁ = 2, L₂ = 4 ⇒ jump = 2, no limit.',
    '',
    'MEMORY AID: "The left piece lands at one height, the right piece starts at another; in between there is a jump."',
  ].join('\n');

  function concept() { return T(CONCEPT_TR, CONCEPT_EN); }

  function solveSteps(p) {
    const m = model(p), a = p.a, S = [];
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    const L1 = fmt2(m.Ll), L2 = fmt2(m.Lr), J = Math.abs(m.jump);
    const isJump = Math.abs(m.jump) > 1e-9;

    // 1) formulas
    let s1;
    if (p.kind === 'pieces') {
      s1 = T(`── 1) Parçaları belirleyelim ──\nSol taraf (x < ${a}): f₁(x) = ${m.strL}\nSağ taraf (x > ${a}): f₂(x) = ${m.strR}\nx = ${a}: ${p.closed === 'right' ? 'sağ parçaya (x ≥ ' + a + ') dahil' : p.closed === 'left' ? 'sol parçaya (x ≤ ' + a + ') dahil' : 'ayrı bir değer: f(' + a + ') = ' + fmt2(m.fa)}.`,
        `── 1) Identify the pieces ──\nLeft side (x < ${a}): f₁(x) = ${m.strL}\nRight side (x > ${a}): f₂(x) = ${m.strR}\nAt x = ${a}: ${p.closed === 'right' ? 'included in the right piece (x ≥ ' + a + ')' : p.closed === 'left' ? 'included in the left piece (x ≤ ' + a + ')' : 'a separate value: f(' + a + ') = ' + fmt2(m.fa)}.`);
    } else if (p.kind === 'sign') {
      s1 = T(`── 1) Mutlak değeri açalım ──\nx > ${a} için ${xm(a)} > 0 ⇒ |${xi(a)}|/${xm(a)} = +1.\nx < ${a} için ${xm(a)} < 0 ⇒ |${xi(a)}|/${xm(a)} = −1.\nx = ${a} noktasında payda 0: f(${a}) tanımsızdır.`,
        `── 1) Remove the absolute value ──\nFor x > ${a}, ${xm(a)} > 0 ⇒ |${xi(a)}|/${xm(a)} = +1.\nFor x < ${a}, ${xm(a)} < 0 ⇒ |${xi(a)}|/${xm(a)} = −1.\nAt x = ${a} the denominator is 0: f(${a}) is not defined.`);
    } else {
      s1 = T(`── 1) Tam değer fonksiyonunu açık yazalım ──\n⌊x⌋ = x'ten büyük olmayan en büyük tam sayıdır.\n${a - 1} ≤ x < ${a} için ⌊x⌋ = ${a - 1}; ${a} ≤ x < ${a + 1} için ⌊x⌋ = ${a}. Bu yüzden f(x) = ${m.str} bu aralıklarda ${fmt2(m.Ll)} ve ${fmt2(m.Lr)} değerlerini alır.`,
        `── 1) Write the floor function explicitly ──\n⌊x⌋ is the greatest integer not exceeding x.\nFor ${a - 1} ≤ x < ${a}, ⌊x⌋ = ${a - 1}; for ${a} ≤ x < ${a + 1}, ⌊x⌋ = ${a}. So f(x) = ${m.str} takes the values ${fmt2(m.Ll)} and ${fmt2(m.Lr)} on these intervals.`);
    }
    S.push(s1);

    // 2) left, 3) right
    const how = (side) => {
      if (p.kind === 'pieces') return side === 'L' ? `f₁(${a}) = ${m.strL} |ₓ₌${a}` : `f₂(${a}) = ${m.strR} |ₓ₌${a}`;
      if (p.kind === 'sign') return side === 'L' ? `${par(p.d)} + ${par(p.s)}·(−1)` : `${par(p.d)} + ${par(p.s)}·(+1)`;
      return side === 'L' ? `${par(p.s)}·${par(a - 1)}` : `${par(p.s)}·${par(a)}`;
    };
    S.push(T(`── 2) Soldan limit ──\nL₁ = lim(x→${a}⁻) f(x) = ${how('L')} = ${L1}`,
      `── 2) Left limit ──\nL₁ = lim(x→${a}⁻) f(x) = ${how('L')} = ${L1}`));
    S.push(T(`── 3) Sağdan limit ──\nL₂ = lim(x→${a}⁺) f(x) = ${how('R')} = ${L2}`,
      `── 3) Right limit ──\nL₂ = lim(x→${a}⁺) f(x) = ${how('R')} = ${L2}`));

    // 4) compare
    if (isJump) {
      S.push(T(`── 4) Karşılaştıralım ──\nL₁ = ${L1} ≠ L₂ = ${L2}: iki limit de sonlu ama farklı.\nlim(x→${a}) f(x) YOKTUR.\nSıçrama büyüklüğü |L₂ − L₁| = |${L2} − ${par(m.Ll)}| = ${fmt2(J)}   (işaretli fark ${fmt2(m.jump)}: ${m.jump > 0 ? 'yukarı' : 'aşağı'} sıçrama).`,
        `── 4) Compare ──\nL₁ = ${L1} ≠ L₂ = ${L2}: both limits are finite but different.\nlim(x→${a}) f(x) DOES NOT EXIST.\nJump size |L₂ − L₁| = |${L2} − ${par(m.Ll)}| = ${fmt2(J)}   (signed difference ${fmt2(m.jump)}: an ${m.jump > 0 ? 'upward' : 'downward'} jump).`));
    } else {
      S.push(T(`── 4) Karşılaştıralım ──\nL₁ = L₂ = ${L1}: iki taraf aynı değere gidiyor, sıçrama yok. lim(x→${a}) f(x) = ${L1} VARDIR.\nBu durumda bir sıçrama süreksizliği değil; f(${a}) tanımsız ya da farklıysa kaldırılabilir süreksizlik, f(${a}) = ${L1} ise süreklilik söz konusudur.`,
        `── 4) Compare ──\nL₁ = L₂ = ${L1}: both sides head to the same value, so there is no jump. lim(x→${a}) f(x) = ${L1} EXISTS.\nThis is not a jump discontinuity; it is removable if f(${a}) is not defined or differs, and f is continuous if f(${a}) = ${L1}.`));
    }

    // 5) f(a)
    let s5;
    if (m.fa === null) {
      s5 = T(`── 5) f(${a}) ──\nf(${a}) tanımsızdır; iki parçanın ${a} noktasındaki uçları da boş dairedir: (${a}, ${L1}) ve (${a}, ${L2}).`,
        `── 5) f(${a}) ──\nf(${a}) is not defined; both pieces end in open circles at x = ${a}: (${a}, ${L1}) and (${a}, ${L2}).`);
    } else {
      const rel = Math.abs(m.fa - m.Lr) < 1e-9 && Math.abs(m.fa - m.Ll) < 1e-9
        ? T('hem L₁ hem L₂ ile eşit (süreklilik)', 'equal to both L₁ and L₂ (continuity)')
        : Math.abs(m.fa - m.Lr) < 1e-9 ? T('L₂ ile eşit (sağdan sürekli); L₁ ≠ f(a)', 'equal to L₂ (right-continuous); L₁ ≠ f(a)')
          : Math.abs(m.fa - m.Ll) < 1e-9 ? T('L₁ ile eşit (soldan sürekli); L₂ ≠ f(a)', 'equal to L₁ (left-continuous); L₂ ≠ f(a)')
            : T('ne L₁ ne L₂ ile eşit (ayrı bir değer)', 'equal to neither L₁ nor L₂ (a separate value)');
      s5 = T(`── 5) f(${a}) ──\nf(${a}) = ${fmt2(m.fa)}: ${rel}.\nDolu nokta (${a}, ${fmt2(m.fa)}); diğer uç(lar) boş daire.`,
        `── 5) f(${a}) ──\nf(${a}) = ${fmt2(m.fa)}: ${rel}.\nFilled dot at (${a}, ${fmt2(m.fa)}); the other end(s) are open circles.`);
    }
    S.push(s5);

    // 6) classification
    if (isJump) {
      S.push(T(`── 6) Süreksizlik türü ──\nSol ve sağ limit sonlu ve eşit değil ⇒ SIÇRAMA süreksizliği. Tek bir f(${a}) değeri hem ${L1} hem ${L2} olamayacağından bu süreksizlik KALDIRILAMAZ (delikten farkı).`,
        `── 6) Type of discontinuity ──\nThe left and right limits are finite and not equal ⇒ a JUMP discontinuity. A single value f(${a}) cannot equal both ${L1} and ${L2}, so it is NOT REMOVABLE (unlike a hole).`));
    } else {
      S.push(T(`── 6) Süreksizlik türü ──\nSıçrama = 0: kaydırıcıyla sıçrama parametresini değiştirerek iki parçanın yeniden ayrıldığını izleyebiliriz.`,
        `── 6) Type of discontinuity ──\nJump = 0: we can change the jump parameter with the slider and watch the two pieces separate again.`));
    }

    // 7) numeric
    const xl = a - off, xr = a + off;
    S.push(T(`── 7) Sayısal kontrol (kaydırıcı) ──\n   Sol nokta:  x = ${nf(xl, 3)}   →   f(x) = ${nf(m.f(xl), 4)}\n   Sağ nokta: x = ${nf(xr, 3)}   →   f(x) = ${nf(m.f(xr), 4)}\nx → ${a} iken sol nokta ${L1} değerine, sağ nokta ${L2} değerine yerleşir; ikisi hiç buluşmaz${isJump ? ' (aralarındaki fark sabit ' + fmt2(J) + ')' : ''}.`,
      `── 7) Numerical check (slider) ──\n   Left point:  x = ${nf(xl, 3)}   →   f(x) = ${nf(m.f(xl), 4)}\n   Right point: x = ${nf(xr, 3)}   →   f(x) = ${nf(m.f(xr), 4)}\nAs x → ${a} the left point settles at ${L1} and the right point at ${L2}${isJump ? '; they never meet (the gap stays ' + fmt2(J) + ')' : ''}.`));
    return S;
  }

  function draw(canvas, p) {
    const m = model(p), a = p.a;
    const off = Math.max(OFF_MIN, Math.min(OFF_MAX, p.off));
    // viewport
    const ref = [m.Ll, m.Lr];
    if (m.fa !== null) ref.push(m.fa);
    let lo = Math.min.apply(null, ref), hi = Math.max.apply(null, ref);
    const halfX = p.kind === 'floor' ? 3.5 : 4.5;
    if (p.kind === 'floor') {
      lo = Math.min(p.s * (a - 4), p.s * (a + 3)); hi = Math.max(p.s * (a - 4), p.s * (a + 3));
    } else {
      const c = (lo + hi) / 2;
      for (let i = 0; i <= 80; i++) {
        const y = m.f(a - halfX + 2 * halfX * i / 80);
        if (isFinite(y) && Math.abs(y - c) <= 12) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
      }
    }
    let h = hi - lo;
    if (h < 6) { const c = (lo + hi) / 2; lo = c - 3; hi = c + 3; h = 6; }
    canvas.setViewport(a - halfX, a + halfX, lo - h * 0.12, hi + h * 0.12);

    canvas.addGuideLine({ axis: 'vertical', position: a, color: canvas.gray(), label: 'x = ' + a });
    if (p.show) {
      canvas.addGuideLine({ axis: 'horizontal', position: m.Ll, color: canvas.blue(), label: 'L₁ = ' + fmt2(m.Ll) });
      canvas.addGuideLine({ axis: 'horizontal', position: m.Lr, color: canvas.red(), label: 'L₂ = ' + fmt2(m.Lr) });
    }
    if (p.kind === 'floor') {
      const k = p.s;
      for (let n = Math.floor(a - halfX) - 1; n <= Math.ceil(a + halfX); n++) {
        canvas.addSegment({ x1: n, y1: k * n, x2: n + 1, y2: k * n, color: canvas.accent(), thickness: 3 });
        canvas.addMarker({ x: n, y: k * n, color: canvas.accent(), radius: 4 });
        canvas.addMarker({ x: n + 1, y: k * n, color: canvas.accent(), radius: 4, hollow: true });
      }
    } else {
      canvas.addFunction({ evaluator: m.fL, color: canvas.accent(), thickness: 3, label: 'f(x)' });
      canvas.addFunction({ evaluator: m.fR, color: canvas.accent(), thickness: 3 });
    }
    // special points at x = a
    const leftClosed = p.kind === 'pieces' && p.closed === 'left';
    const rightClosed = (p.kind === 'pieces' && p.closed === 'right') || p.kind === 'floor';
    if (p.kind !== 'floor') {
      canvas.addMarker({ x: a, y: m.Ll, color: canvas.blue(), radius: 7, hollow: !leftClosed });
      canvas.addMarker({ x: a, y: m.Lr, color: canvas.purple(), radius: 7, hollow: !rightClosed });
    } else {
      canvas.addMarker({ x: a, y: m.Ll, color: canvas.blue(), radius: 7, hollow: true });
      canvas.addMarker({ x: a, y: m.Lr, color: canvas.purple(), radius: 7 });
    }
    if (p.kind === 'pieces' && p.closed === 'value') {
      canvas.addMarker({ x: a, y: m.fa, color: canvas.gold(), radius: 6, label: 'f(' + a + ') = ' + fmt2(m.fa) });
    }
    // the two moving points
    const xl = a - off, xr = a + off;
    const yl = m.f(xl), yr = m.f(xr);
    if (isFinite(yl)) canvas.addMarker({ x: xl, y: yl, color: canvas.blue(), radius: 6 });
    if (isFinite(yr)) canvas.addMarker({ x: xr, y: yr, color: canvas.purple(), radius: 6 });
  }

  function buildControls(rightCol, getProblem, h) {
    const hint = (typeof document !== 'undefined' && document.createElement) ? document.createElement('div') : {};
    hint.className = 'we-slider-caption';
    function hintText(p) {
      if (p.kind === 'sign') return T('Bu örnekte s = c : f(x) = c·|x−a|/(x−a) + d', 'In this example s = c : f(x) = c·|x−a|/(x−a) + d');
      if (p.kind === 'floor') return T('Bu örnekte s = k : f(x) = k·⌊x⌋', 'In this example s = k : f(x) = k·⌊x⌋');
      return T('Bu örnekte s = L₂ − L₁ (sağ limit − sol limit)', 'In this example s = L₂ − L₁ (right limit − left limit)');
    }
    h.addSlider({
      caption: T('Süreksizliğin konumu a', 'Location of the discontinuity a'), min: -4, max: 4, step: 1,
      get: () => getProblem().a, set: (v) => { getProblem().a = Math.round(v); },
    });
    h.addSlider({
      caption: T('Sıçrama parametresi s (0 olunca sıçrama kaybolur)', 'Jump parameter s (the jump vanishes at 0)'), min: -5, max: 5, step: 1,
      get: () => { hint.textContent = hintText(getProblem()); return getProblem().s; },
      set: (v) => { getProblem().s = Math.round(v); hint.textContent = hintText(getProblem()); },
    });
    try { rightCol.appendChild(hint); } catch (e) { /* stub host */ }
    h.addSlider({
      caption: T('Noktaları a\'ya yaklaştıralım (uzaklık; sola çekince küçülür)', 'Moving the points towards a (distance; dragging left shrinks it)'),
      min: OFF_MIN, max: OFF_MAX, step: 0.01,
      get: () => getProblem().off, set: (v) => { getProblem().off = Math.max(OFF_MIN, Math.min(OFF_MAX, v)); },
    });
    h.addCheckbox({
      caption: T('Sol ve sağ limit çizgilerini göster', 'Show the left and right limit lines'),
      get: () => getProblem().show, set: (v) => { getProblem().show = !!v; },
    });
  }

  Topics.register('limits', {
    id: 'jumpDiscontinuity',
    tabTitle: () => T('Sıçrama Süreksizliği', 'Jump Discontinuity'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => { const m = model(p); return { x: p.a, y: (m.Ll + m.Lr) / 2 }; },
    buildControls,
    links: [
      { match: /^\s*- (Parçalı tanımlı|Piecewise functions)/, make: (rng) => gen(rng, 'pieces') },
      { match: /^\s*- (İşaret fonksiyonu|The sign function)/, make: (rng) => gen(rng, 'sign') },
      { match: /^\s*- (Tam değer|The floor function)/, make: (rng) => gen(rng, 'floor') },
      { match: /^\s*f\(a\) (tanımlı olabilir|may be defined)/, make: (rng) => gen(rng, 'pieces', 'value') },
    ],
  });
})();
