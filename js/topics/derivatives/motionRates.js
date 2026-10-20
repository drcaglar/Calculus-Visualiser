// Velocity, Acceleration and Rates of Change (chapter 'derivatives'). Thomas 3.4, Stewart 3.7.
// Every problem carries a polynomial f(t) with INTEGER coefficients (coef[k] is the coefficient of t^k):
//   kinState / kinRest / kinDist : s(t) = ±(2t³ − 3(r1+r2)t² + 6 r1 r2 t) + s0   (v = ±6(t−r1)(t−r2))
//   projMax / projImpact          : s(t) = s0 + v0 t − 5t²   (g = 10 m/s²; impact time T = v0/5 + q integer)
//   marginal                      : C(x) = a x² + b x + c0
//   profit                        : P(x) = R(x) − C(x),  R = p x − q x²
//   rate                          : temperature / bacteria / concentration / draining tank
// The graph shows f, f', f'' on ONE fixed system (t >= 0 only), the tangent at the marker time, the secant over [t, t+h].
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 2 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0') t = '0';
    return M(t);
  }
  const SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = (n) => (n === 1 ? '' : String(n).split('').map((c) => SUPD[c] || c).join(''));
  const ev = (co, x) => co.reduceRight((a, c) => a * x + c, 0);
  const dp = (co) => (co.length <= 1 ? [0] : co.slice(1).map((c, i) => c * (i + 1)));
  const isInt = (x) => Math.abs(x - Math.round(x)) < 1e-9;
  const sgn = (x) => (Math.abs(x) < 1e-9 ? 0 : x > 0 ? 1 : -1);

  function polyStr(co, v) {
    let s = '';
    for (let k = co.length - 1; k >= 0; k--) {
      const c = co[k];
      if (!c) continue;
      const a = Math.abs(c);
      const body = k === 0 ? String(a) : (a === 1 ? '' : String(a)) + v + sup(k);
      if (s === '') s = (c < 0 ? '−' : '') + body;
      else s += (c < 0 ? ' − ' : ' + ') + body;
    }
    return s || '0';
  }
  function subStr(co, x, v) {
    const X = (isInt(x) && x >= 0) ? nf(x) : '(' + nf(x) + ')';
    let s = '';
    for (let k = co.length - 1; k >= 0; k--) {
      const c = co[k];
      if (!c) continue;
      const a = Math.abs(c);
      let body;
      if (k === 0) body = String(a);
      else if (k === 1) body = (a === 1 ? '' : a + '·') + X;
      else body = (a === 1 ? '' : a + '·') + X + sup(k);
      if (s === '') s = (c < 0 ? '−' : '') + body;
      else s += (c < 0 ? ' − ' : ' + ') + body;
    }
    return s || '0';
  }

  const KINDS = ['kinState', 'kinRest', 'kinDist', 'projMax', 'projImpact', 'marginal', 'profit', 'rate'];
  const isKin = (k) => k === 'kinState' || k === 'kinRest' || k === 'kinDist';
  const isProj = (k) => k === 'projMax' || k === 'projImpact';
  const isMotion = (k) => isKin(k) || isProj(k);
  const isEco = (k) => k === 'marginal' || k === 'profit';

  let prefTan = true, prefSec = true;

  const RATE_SC = [
    { id: 'temp', sym: 'T', q: ['sıcaklığı', 'temperature'], what: ['bir motor parçasının sıcaklığı', 'the temperature of an engine part'], uq: '°C', ut: ['dk', 'min'], tw: ['dakika', 'minutes'] },
    { id: 'pop', sym: 'P', q: ['bakteri sayısı', 'bacteria count'], what: ['bir kültürdeki bakteri sayısı', 'the number of bacteria in a culture'], uq: ['bakteri', 'bacteria'], ut: ['saat', 'h'], tw: ['saat', 'hours'] },
    { id: 'conc', sym: 'C', q: ['ilaç derişimi', 'drug concentration'], what: ['kandaki ilaç derişimi', 'the drug concentration in the blood'], uq: 'mg/L', ut: ['saat', 'h'], tw: ['saat', 'hours'] },
    { id: 'tank', sym: 'V', q: ['depodaki su hacmi', 'water volume in the tank'], what: ['boşalan bir depodaki su hacmi', 'the water volume in a draining tank'], uq: 'L', ut: ['dk', 'min'], tw: ['dakika', 'minutes'] },
  ];
  const uq = (sc) => (Array.isArray(sc.uq) ? Tx(sc.uq[0], sc.uq[1]) : sc.uq);
  const ut = (sc) => Tx(sc.ut[0], sc.ut[1]);

  function createProblem(rng) { return gen(rng, rng.pick(KINDS)); }
  function gen(rng, kind) {
    const p = { kind, h: 1, step: 0.1, showTan: prefTan, showSec: prefSec };
    if (isKin(kind)) {
      const sg = rng.pick([1, -1]);
      const r1 = rng.nextInt(0, 3);
      const r2 = r1 + rng.nextInt(1, 4);
      const s0 = rng.nextInt(-5, 6);
      const base = [0, 6 * r1 * r2, -3 * (r1 + r2), 2];
      p.coef = base.map((c) => sg * c); p.coef[0] += s0;
      p.sg = sg; p.r1 = r1; p.r2 = r2; p.s0 = s0;
      p.tMax = r2 + 2;
      let t0;
      do { t0 = rng.nextInt(0, p.tMax + 1); } while (t0 === r1 || t0 === r2 || 2 * t0 === r1 + r2);
      p.t0 = t0;
      p.T = rng.nextInt(2, p.tMax + 1);
      p.tm = kind === 'kinDist' ? p.T : t0;
    } else if (isProj(kind)) {
      const v0 = kind === 'projMax' ? rng.pick([10, 20, 30, 40]) : rng.pick([0, 10, 20, 30, 40]);
      const q = v0 === 0 ? rng.nextInt(2, 5) : rng.nextInt(0, 3);
      const T = v0 / 5 + q;
      p.v0 = v0; p.q = q; p.s0 = 5 * T * q; p.T = T;
      p.coef = [p.s0, v0, -5];
      p.tMax = T;
      p.tm = Math.round(T * 5) / 10;
    } else if (kind === 'marginal') {
      p.a = rng.pick([1, 2]); p.b = rng.nextInt(5, 21); p.c0 = rng.pick([100, 150, 200]);
      p.coef = [p.c0, p.b, p.a];
      p.tMax = 20; p.step = 1; p.x0 = rng.nextInt(2, 17); p.tm = p.x0;
    } else if (kind === 'profit') {
      p.pr = rng.nextInt(6, 11) * 10; p.q = rng.pick([1, 2]); p.a = rng.pick([1, 2]);
      p.b = rng.nextInt(1, 4) * 10; p.c0 = rng.pick([100, 150, 200]);
      p.coef = [-p.c0, p.pr - p.b, -(p.q + p.a)];
      p.tMax = 40; p.step = 1; p.x0 = rng.nextInt(5, 31); p.tm = p.x0;
    } else {
      const sc = rng.pick(RATE_SC);
      p.sc = sc;
      if (sc.id === 'temp') { p.coef = [rng.pick([20, 30, 40]), rng.pick([10, 12, 14, 16]), -1]; p.tMax = 8; }
      else if (sc.id === 'pop') { p.coef = [rng.nextInt(2, 11) * 50, rng.pick([10, 20, 30]), rng.pick([2, 3, 4])]; p.tMax = 6; }
      else if (sc.id === 'conc') { const b = rng.pick([6, 9]); p.coef = [0, 0, b, -1]; p.tMax = b; }
      else { const a = rng.nextInt(2, 6); p.coef = [100 * a, -20 * a, a]; p.tMax = 10; }
      p.h = 2;
      p.t0 = rng.nextInt(1, p.tMax - p.h + 1);
      p.tm = p.t0;
    }
    return p;
  }

  // ---------- model ----------
  const F0 = (p) => (t) => ev(p.coef, t);
  const F1 = (p) => (t) => ev(dp(p.coef), t);
  const F2 = (p) => (t) => ev(dp(dp(p.coef)), t);
  function names(p) {
    if (isMotion(p.kind)) return { v: 't', f: 's', d1: 'v', d2: 'a' };
    if (p.kind === 'marginal') return { v: 'x', f: 'C', d1: 'C′', d2: 'C″' };
    if (p.kind === 'profit') return { v: 'x', f: 'P', d1: 'P′', d2: 'P″' };
    return { v: 't', f: p.sc.sym, d1: p.sc.sym + '′', d2: p.sc.sym + '″' };
  }
  const cur = () => Tx('₺', '$');
  const dirWord = (v) => (v > 0 ? Tx('pozitif yönde (ileri)', 'in the positive direction (forward)') : v < 0 ? Tx('negatif yönde (geri)', 'in the negative direction (backward)') : Tx('durgun (v = 0)', 'at rest (v = 0)'));

  // ---------- statements ----------
  function problemStatement(p) {
    const f = polyStr(p.coef, names(p).v);
    switch (p.kind) {
      case 'kinState':
        return Tx(`Doğru boyunca hareket eden bir cismin konumu s(t) = ${f} (s metre, t saniye) olsun. t = ${nf(p.t0)} s anında hızı ve ivmesi kaç olur? Cisim hangi yönde gidiyor, hızlanıyor mu yavaşlıyor mu?`,
          `A particle moves along a line with position s(t) = ${f} (s in metres, t in seconds). What are its velocity and acceleration at t = ${nf(p.t0)} s? Which way is it moving, and is it speeding up or slowing down?`);
      case 'kinRest':
        return Tx(`Konumu s(t) = ${f} (m, t ≥ 0 için s) olan cisim ne zaman durgundur? Hangi aralıklarda ileri, hangilerinde geri gider; hangi aralıklarda hızlanır?`,
          `A particle has position s(t) = ${f} (metres, t ≥ 0 in seconds). When is it at rest? On which intervals does it move forward or backward, and when is it speeding up?`);
      case 'kinDist':
        return Tx(`Konumu s(t) = ${f} (m) olan cisim için t = 0 ile t = ${nf(p.T)} s arasında yer değiştirme ve toplam alınan yol kaç metre olur?`,
          `A particle has position s(t) = ${f} (m). What are the displacement and the total distance travelled between t = 0 and t = ${nf(p.T)} s?`);
      case 'projMax':
        return Tx(`Bir top, yerden ${nf(p.s0)} m yükseklikten ${nf(p.v0)} m/s hızla düşey yukarı fırlatılıyor (g = 10 m/s² alalım). Top en fazla kaç metre yüksekliğe çıkar ve bu yüksekliğe kaçıncı saniyede ulaşır?`,
          `A ball is thrown straight up from a height of ${nf(p.s0)} m with speed ${nf(p.v0)} m/s (take g = 10 m/s²). What maximum height does it reach, and at what time?`);
      case 'projImpact':
        return p.v0 === 0
          ? Tx(`Bir cisim ${nf(p.s0)} m yükseklikten serbest bırakılıyor (g = 10 m/s² alalım). Yere kaç saniyede çarpar ve çarpma anındaki sürati kaç m/s olur?`,
            `An object is dropped from a height of ${nf(p.s0)} m (take g = 10 m/s²). How long does it take to hit the ground, and what is its speed at impact?`)
          : Tx(`Bir top, ${nf(p.s0)} m yükseklikten ${nf(p.v0)} m/s hızla düşey yukarı fırlatılıyor (g = 10 m/s² alalım). Yere kaç saniyede çarpar ve çarpma anındaki sürati kaç m/s olur?`,
            `A ball is thrown straight up from a height of ${nf(p.s0)} m with speed ${nf(p.v0)} m/s (take g = 10 m/s²). How long until it hits the ground, and what is its speed at impact?`);
      case 'marginal':
        return Tx(`Bir atölyede x adet parçanın üretim maliyeti C(x) = ${f} ${cur()} olsun. x = ${p.x0} adet üretilirken marjinal maliyet C′(${p.x0}) kaç olur? Gerçek maliyet artışı C(${p.x0 + 1}) − C(${p.x0}) ile ne kadar farklıdır?`,
          `The cost of producing x parts in a workshop is C(x) = ${f} ${cur()}. At a production level of x = ${p.x0}, what is the marginal cost C′(${p.x0})? How does it compare with the actual extra cost C(${p.x0 + 1}) − C(${p.x0})?`);
      case 'profit':
        return Tx(`x adet satışta gelir R(x) = ${polyStr([0, p.pr, -p.q], 'x')} ${cur()}, maliyet C(x) = ${polyStr([p.c0, p.b, p.a], 'x')} ${cur()} olsun. x = ${p.x0} adetteyken marjinal gelir, marjinal maliyet ve marjinal kâr kaç olur? Bir birim daha üretmek kârlı mıdır?`,
          `For x items sold, revenue is R(x) = ${polyStr([0, p.pr, -p.q], 'x')} ${cur()} and cost is C(x) = ${polyStr([p.c0, p.b, p.a], 'x')} ${cur()}. At x = ${p.x0}, what are the marginal revenue, marginal cost and marginal profit? Is producing one more unit worthwhile?`);
      default: {
        const sc = p.sc, n = names(p);
        return Tx(`${sc.what[0][0].toUpperCase() + sc.what[0].slice(1)} ${n.f}(t) = ${polyStr(p.coef, 't')} ${uq(sc)} olarak modelleniyor (t, ${sc.tw[0]} cinsinden). t = ${p.t0} anındaki anlık değişim hızı birimiyle kaç olur? [${p.t0}, ${p.t0 + p.h}] aralığındaki ortalama değişim hızından ne kadar farklıdır?`,
          `${sc.what[1][0].toUpperCase() + sc.what[1].slice(1)} is modelled by ${n.f}(t) = ${polyStr(p.coef, 't')} ${uq(sc)} (t in ${sc.tw[1]}). What is the instantaneous rate of change at t = ${p.t0}, with units? How does it differ from the average rate over [${p.t0}, ${p.t0 + p.h}]?`);
      }
    }
  }

  // ---------- sign chart for kinematics ----------
  function chart(p) {
    const v = F1(p), a = F2(p);
    const bp = [0];
    const pts = [];
    if (isKin(p.kind)) { pts.push(p.r1, p.r2, (p.r1 + p.r2) / 2); }
    pts.filter((x) => x > 1e-9 && x < p.tMax - 1e-9).sort((x, y) => x - y).forEach((x) => { if (Math.abs(x - bp[bp.length - 1]) > 1e-9) bp.push(x); });
    bp.push(p.tMax);
    const rows = [];
    for (let i = 0; i + 1 < bp.length; i++) {
      const lo = bp[i], hi = bp[i + 1], tt = (lo + hi) / 2;
      const sv = sgn(v(tt)), sa = sgn(a(tt));
      rows.push({ lo, hi, sv, sa, up: sv * sa > 0 });
    }
    return rows;
  }
  function rowText(r) {
    const vs = r.sv > 0 ? 'v > 0' : 'v < 0', as = r.sa > 0 ? 'a > 0' : 'a < 0';
    const dir = r.sv > 0 ? Tx('ileri', 'forward') : Tx('geri', 'backward');
    const sp = r.up ? Tx('hızlanıyor (v·a > 0)', 'speeding up (v·a > 0)') : Tx('yavaşlıyor (v·a < 0)', 'slowing down (v·a < 0)');
    return `${nf(r.lo)} < t < ${nf(r.hi)} :  ${vs},  ${as}  →  ${dir},  ${sp}`;
  }

  // ---------- solution ----------
  function solveSteps(p) {
    const n = names(p), f0 = F0(p), f1 = F1(p), f2 = F2(p);
    const co1 = dp(p.coef), co2 = dp(co1);
    const H = (k, t) => `── ${k}) ${t} ──`;
    const st = [];
    if (isKin(p.kind)) {
      const hdr = H(1, Tx('Konum, hız, ivme', 'Position, velocity, acceleration')) + '\n' +
        `s(t) = ${polyStr(p.coef, 't')}\n` +
        Tx('Hız, konumun türevidir; terim terim türev alalım (tⁿ → n·tⁿ⁻¹):', 'Velocity is the derivative of position; differentiate term by term (tⁿ → n·tⁿ⁻¹):') + '\n' +
        `v(t) = s′(t) = ${polyStr(co1, 't')}   (m/s)\n` +
        Tx('İvme, hızın türevidir:', 'Acceleration is the derivative of velocity:') + '\n' +
        `a(t) = v′(t) = ${polyStr(co2, 't')}   (m/s²)`;
      st.push(hdr);
    }
    if (p.kind === 'kinState') {
      const t0 = p.t0, v0 = f1(t0), a0 = f2(t0);
      st.push(H(2, Tx(`t = ${nf(t0)} s anında hız ve ivme`, `Velocity and acceleration at t = ${nf(t0)} s`)) + '\n' +
        `v(${nf(t0)}) = ${subStr(co1, t0, 't')} = ${nf(v0)} m/s\n` +
        `a(${nf(t0)}) = ${subStr(co2, t0, 't')} = ${nf(a0)} m/s²\n` +
        `s(${nf(t0)}) = ${subStr(p.coef, t0, 't')} = ${nf(f0(t0))} m`);
      st.push(H(3, Tx('Yön ve sürat', 'Direction and speed')) + '\n' +
        Tx(`Hızın işareti yönü gösterir: v = ${nf(v0)} olduğundan cisim ${dirWord(v0)} hareket eder.`, `The sign of the velocity gives the direction: v = ${nf(v0)}, so the particle moves ${dirWord(v0)}.`) + '\n' +
        Tx(`Sürat, hızın mutlak değeridir: |v| = ${nf(Math.abs(v0))} m/s.`, `Speed is the absolute value of velocity: |v| = ${nf(Math.abs(v0))} m/s.`));
      const pr = v0 * a0;
      st.push(H(4, Tx('Hızlanıyor mu, yavaşlıyor mu?', 'Speeding up or slowing down?')) + '\n' +
        Tx('Hız ve ivme aynı işaretliyse sürat artar; zıt işaretliyse azalır. Çarpımlarına bakalım:', 'If velocity and acceleration have the same sign the speed grows; if opposite, it shrinks. Let us look at their product:') + '\n' +
        `v·a = ${nf(v0)} · ${nf(a0)} = ${nf(pr)}\n` +
        (pr > 0 ? Tx('v·a > 0 ⇒ cisim hızlanıyor.', 'v·a > 0 ⇒ the particle is speeding up.')
          : pr < 0 ? Tx('v·a < 0 ⇒ cisim yavaşlıyor.', 'v·a < 0 ⇒ the particle is slowing down.')
            : Tx('v·a = 0 ⇒ bu anda sürat anlık olarak sabit (v veya a sıfır).', 'v·a = 0 ⇒ the speed is momentarily constant (v or a is zero).')));
      st.push(H(5, Tx('Kontrol', 'Check')) + '\n' +
        Tx(`Grafikte s(t) eğrisinin t = ${nf(t0)} noktasındaki teğetinin eğimi ${nf(v0)} olmalıdır (turuncu eğri v, mor eğri a değerini verir). Birimler de uyuşuyor: m/s ve m/s².`,
          `On the graph, the tangent to s(t) at t = ${nf(t0)} must have slope ${nf(v0)} (the orange curve gives v, the purple one gives a). Units agree: m/s and m/s².`));
    } else if (p.kind === 'kinRest') {
      const A = p.sg * 6, r1 = p.r1, r2 = p.r2, m = (r1 + r2) / 2;
      const fac = (r) => (r === 0 ? 't' : `(t − ${r})`);
      st.push(H(2, Tx('Durgun olduğu anlar (v = 0)', 'When is it at rest (v = 0)?')) + '\n' +
        `${polyStr(co1, 't')} = 0\n` +
        Tx(`Her terimi ${nf(A)} ile bölüp çarpanlarına ayıralım:`, `Divide every term by ${nf(A)} and factor:`) + '\n' +
        `t² − ${r1 + r2}t + ${r1 * r2} = 0  ⇒  ${fac(r1)}${fac(r2)} = 0\n` +
        `t = ${r1}  ${Tx('ve', 'and')}  t = ${r2}`);
      const rows = chart(p);
      st.push(H(3, Tx('İşaret tablosu (0 ≤ t ≤ ' + p.tMax + ')', 'Sign chart (0 ≤ t ≤ ' + p.tMax + ')')) + '\n' +
        Tx(`İvme a(t) = 0 olduğu an: ${polyStr(co2, 't')} = 0 ⇒ t = ${nf(m)} s. Bölünme noktaları 0, ${[r1, r2, m].filter((x) => x > 0 && x < p.tMax).sort((x, y) => x - y).map((x) => nf(x)).join(', ')} ve ${p.tMax} olur; her aralıktan bir test değeri seçip v ile a işaretlerine bakalım:`,
          `Acceleration is zero when ${polyStr(co2, 't')} = 0 ⇒ t = ${nf(m)} s. The break points are 0, ${[r1, r2, m].filter((x) => x > 0 && x < p.tMax).sort((x, y) => x - y).map((x) => nf(x)).join(', ')} and ${p.tMax}; test one value in each interval for the signs of v and a:`) + '\n' +
        rows.map(rowText).join('\n'));
      const turns = [r1, r2].filter((x) => x > 0);
      st.push(H(4, Tx('Yorum', 'Conclusion')) + '\n' +
        Tx(`Durgun: t = ${r1} s ve t = ${r2} s anlarında (v = 0).`, `At rest: at t = ${r1} s and t = ${r2} s (v = 0).`) + '\n' +
        Tx(`Yön değiştirir: ${turns.length ? turns.map((x) => `t = ${x} s (konum ${nf(f0(x))} m)`).join(' ve ') : 'yok (yalnızca t = 0 anında durgundur)'} — burada v işaret değiştirir.`,
          `Changes direction: ${turns.length ? turns.map((x) => `t = ${x} s (position ${nf(f0(x))} m)`).join(' and ') : 'never (it is at rest only at t = 0)'} — v changes sign there.`) + '\n' +
        Tx('Hızlanma aralıkları: ', 'Speeding up on: ') + (rows.filter((r) => r.up).map((r) => `(${nf(r.lo)}, ${nf(r.hi)})`).join(' ∪ ') || '—') + '\n' +
        Tx('Yavaşlama aralıkları: ', 'Slowing down on: ') + (rows.filter((r) => !r.up).map((r) => `(${nf(r.lo)}, ${nf(r.hi)})`).join(' ∪ ') || '—'));
      st.push(H(5, Tx('Kontrol', 'Check')) + '\n' +
        `v(${r1}) = ${nf(f1(r1))},  v(${r2}) = ${nf(f1(r2))}.\n` +
        Tx('Grafikte turuncu v eğrisi, tam bu anlarda t eksenini keser; s eğrisinin teğeti de bu noktalarda yataydır.', 'On the graph the orange v-curve crosses the t-axis exactly at these times, and the tangent to s is horizontal there.'));
    } else if (p.kind === 'kinDist') {
      const T = p.T, r1 = p.r1, r2 = p.r2;
      const turns = [r1, r2].filter((x) => x > 0 && x < T);
      const bps = [0].concat(turns).concat([T]);
      st.push(H(2, Tx('Durgun (dönüş) anları', 'Rest (turning) times')) + '\n' +
        `v(t) = ${polyStr(co1, 't')} = ${nf(p.sg * 6)}(t${r1 === 0 ? '' : ' − ' + r1})(t − ${r2}) = 0  ⇒  t = ${r1}  ${Tx('ve', 'and')}  t = ${r2}\n` +
        (turns.length ? Tx(`(0, ${T}) aralığında kalanlar: ${turns.join(', ')}. Cisim bu anlarda yön değiştirir.`, `Those inside (0, ${T}): ${turns.join(', ')}. The particle reverses direction at these times.`)
          : Tx(`(0, ${T}) aralığında dönüş anı yoktur; cisim hep aynı yönde gider.`, `There is no turning time inside (0, ${T}); the particle always moves the same way.`)));
      st.push(H(3, Tx('Önemli anlardaki konumlar', 'Positions at the key times')) + '\n' +
        bps.map((x) => `s(${nf(x)}) = ${subStr(p.coef, x, 't')} = ${nf(f0(x))} m`).join('\n'));
      const disp = f0(T) - f0(0);
      st.push(H(4, Tx('Yer değiştirme', 'Displacement')) + '\n' +
        Tx('Yer değiştirme yalnızca başlangıç ve bitiş konumuna bakar:', 'Displacement only compares the final and initial positions:') + '\n' +
        `Δs = s(${nf(T)}) − s(0) = ${nf(f0(T))} − ${f0(0) < 0 ? '(' + nf(f0(0)) + ')' : nf(f0(0))} = ${nf(disp)} m`);
      let D = 0;
      const parts = [];
      for (let i = 0; i + 1 < bps.length; i++) { const d = f0(bps[i + 1]) - f0(bps[i]); D += Math.abs(d); parts.push(`|${nf(f0(bps[i + 1]))} − ${f0(bps[i]) < 0 ? '(' + nf(f0(bps[i])) + ')' : nf(f0(bps[i]))}| = ${nf(Math.abs(d))}`); }
      st.push(H(5, Tx('Toplam alınan yol', 'Total distance travelled')) + '\n' +
        Tx('Yön değiştirdiği her parçanın uzunluğunu ayrı ayrı toplayalım:', 'Add the length of each piece between direction changes:') + '\n' +
        parts.join('\n') + '\n' +
        `${Tx('Toplam yol', 'Total distance')} = ${nf(D)} m`);
      st.push(H(6, Tx('Karşılaştırma ve kontrol', 'Comparison and check')) + '\n' +
        `|Δs| = ${nf(Math.abs(disp))} m  ≤  ${nf(D)} m.\n` +
        (turns.length ? Tx('Cisim yön değiştirdiği için toplam yol, yer değiştirmeden büyüktür.', 'Because the particle turned around, the total distance exceeds the displacement.')
          : Tx('Yön değişmediği için toplam yol, yer değiştirmenin mutlak değerine eşittir.', 'With no direction change, the total distance equals the size of the displacement.')) + '\n' +
        Tx(`Ortalama hız = Δs/Δt = ${nf(disp / T)} m/s, ortalama sürat = yol/Δt = ${nf(D / T)} m/s.`, `Average velocity = Δs/Δt = ${nf(disp / T)} m/s, average speed = distance/Δt = ${nf(D / T)} m/s.`));
    } else if (p.kind === 'projMax') {
      const tp = p.v0 / 10, H0 = f0(tp);
      st.push(H(1, Tx('Konum, hız, ivme modeli', 'Position, velocity, acceleration model')) + '\n' +
        `s(t) = s₀ + v₀t − ½gt² = ${nf(p.s0)} + ${nf(p.v0)}t − 5t²   (g = 10 m/s²)\n` +
        `v(t) = s′(t) = ${nf(p.v0)} − 10t\n` +
        `a(t) = v′(t) = −10 m/s²  ${Tx('(yerçekimi, aşağı yönde)', '(gravity, pointing down)')}`);
      st.push(H(2, Tx('En üst nokta: v = 0', 'Highest point: v = 0')) + '\n' +
        Tx('Cisim yükselirken v > 0, düşerken v < 0 olur; tepe noktasında anlık olarak durur:', 'While rising v > 0 and while falling v < 0; at the top it momentarily stops:') + '\n' +
        `${nf(p.v0)} − 10t = 0  ⇒  t = ${nf(p.v0)}/10 = ${nf(tp)} s`);
      st.push(H(3, Tx('En büyük yükseklik', 'Maximum height')) + '\n' +
        `s(${nf(tp)}) = ${nf(p.s0)} + ${nf(p.v0)}·${nf(tp)} − 5·${nf(tp)}² = ${nf(H0)} m\n` +
        Tx(`Kısaca: s₀ + v₀²/(2g) = ${nf(p.s0)} + ${nf(p.v0)}²/20 = ${nf(H0)} m.`, `In short: s₀ + v₀²/(2g) = ${nf(p.s0)} + ${nf(p.v0)}²/20 = ${nf(H0)} m.`));
      st.push(H(4, Tx('Kontrol', 'Check')) + '\n' +
        Tx(`a = −10 < 0 olduğundan v azalır; t = ${nf(tp)} s'de + işaretinden − işaretine geçer, yani bu nokta gerçekten bir tepedir. Grafikte s eğrisinin zirvesi (${nf(tp)}; ${nf(H0)}) noktasındadır ve v eğrisi orada t eksenini keser.`,
          `Since a = −10 < 0, v decreases and changes from + to − at t = ${nf(tp)} s, so this really is a peak. On the graph the top of the s-curve is at (${nf(tp)}; ${nf(H0)}) and the v-curve crosses the axis there.`));
    } else if (p.kind === 'projImpact') {
      const T = p.T, B = p.v0 / 5, C = p.s0 / 5, disc = B * B + 4 * C, rt = Math.sqrt(disc);
      const vi = p.v0 - 10 * T;
      st.push(H(1, Tx('Konum ve hız modeli', 'Position and velocity model')) + '\n' +
        `s(t) = ${nf(p.s0)} + ${nf(p.v0)}t − 5t²   (g = 10 m/s²)\n` +
        `v(t) = s′(t) = ${nf(p.v0)} − 10t`);
      st.push(H(2, Tx('Yere çarpma anı: s = 0', 'Impact time: s = 0')) + '\n' +
        `${nf(p.s0)} + ${nf(p.v0)}t − 5t² = 0\n` +
        Tx(`Her terimi −5'e bölersek: t² − ${nf(B)}t − ${nf(C)} = 0`, `Dividing by −5: t² − ${nf(B)}t − ${nf(C)} = 0`) + '\n' +
        `Δ = ${nf(B)}² + 4·${nf(C)} = ${nf(disc)},  √Δ = ${nf(rt)}\n` +
        `t = (${nf(B)} ± ${nf(rt)})/2  ⇒  t = ${nf((B + rt) / 2)}  ${Tx('veya', 'or')}  t = ${nf((B - rt) / 2)}\n` +
        Tx(`Negatif zaman fırlatmadan öncesidir, bu yüzden t = ${nf(T)} s alınır.`, `A negative time is before the launch, so we keep t = ${nf(T)} s.`));
      st.push(H(3, Tx('Çarpma sürati', 'Impact speed')) + '\n' +
        `v(${nf(T)}) = ${nf(p.v0)} − 10·${nf(T)} = ${nf(vi)} m/s\n` +
        Tx(`Eksi işareti aşağı yönü gösterir; sürat |v| = ${nf(Math.abs(vi))} m/s (yaklaşık ${nf(Math.abs(vi) * 3.6, 1)} km/sa).`, `The minus sign means downward; the speed is |v| = ${nf(Math.abs(vi))} m/s (about ${nf(Math.abs(vi) * 3.6, 1)} km/h).`));
      st.push(H(4, Tx('Kontrol', 'Check')) + '\n' +
        `s(${nf(T)}) = ${subStr(p.coef, T, 't')} = ${nf(f0(T))} m ✓\n` +
        Tx('Grafikte s eğrisi t eksenini t = ' + nf(T) + ' s noktasında keser; orada v eğrisi negatiftir (cisim aşağı iner).', 'On the graph the s-curve meets the t-axis at t = ' + nf(T) + ' s, where the v-curve is negative (the object is moving down).'));
    } else if (p.kind === 'marginal') {
      const x0 = p.x0, mc = f1(x0), ex = f0(x0 + 1) - f0(x0);
      st.push(H(1, Tx('Maliyet ve marjinal maliyet fonksiyonu', 'Cost and marginal cost functions')) + '\n' +
        `C(x) = ${polyStr(p.coef, 'x')}\n` +
        Tx('Marjinal maliyet, maliyetin türevidir (bir sonraki birimin yaklaşık maliyeti):', 'Marginal cost is the derivative of cost (roughly the cost of the next unit):') + '\n' +
        `C′(x) = ${polyStr(dp(p.coef), 'x')}  (${cur()}/${Tx('adet', 'unit')})`);
      st.push(H(2, Tx(`x = ${x0} için marjinal maliyet`, `Marginal cost at x = ${x0}`)) + '\n' +
        `C′(${x0}) = ${subStr(dp(p.coef), x0, 'x')} = ${nf(mc)} ${cur()}/${Tx('adet', 'unit')}`);
      st.push(H(3, Tx('Gerçek maliyet artışı', 'Actual cost increase')) + '\n' +
        `C(${x0 + 1}) = ${subStr(p.coef, x0 + 1, 'x')} = ${nf(f0(x0 + 1))}\n` +
        `C(${x0}) = ${subStr(p.coef, x0, 'x')} = ${nf(f0(x0))}\n` +
        `C(${x0 + 1}) − C(${x0}) = ${nf(ex)} ${cur()}`);
      st.push(H(4, Tx('Karşılaştırma', 'Comparison')) + '\n' +
        Tx(`Fark: ${nf(ex)} − ${nf(mc)} = ${nf(ex - mc)} ${cur()}. Bu fark ${nf(p.a)} = a olur (ikinci türevin yarısı): teğet ile kesen aynı değildir.`, `Difference: ${nf(ex)} − ${nf(mc)} = ${nf(ex - mc)} ${cur()}. It equals ${nf(p.a)} = a (half the second derivative): tangent and secant are not the same line.`) + '\n' +
        Tx(`Göreli hata yalnızca %${nf(100 * Math.abs(ex - mc) / ex, 1)} olduğundan C′(${x0}) iyi bir tahmindir.`, `The relative error is only ${nf(100 * Math.abs(ex - mc) / ex, 1)}%, so C′(${x0}) is a good estimate.`));
      st.push(H(5, Tx('Kontrol', 'Check')) + '\n' +
        Tx(`Grafikte x = ${x0} noktasındaki teğetin eğimi ${nf(mc)}, kesenin eğimi (${x0} → ${x0 + 1}) ${nf(ex)} olur; ikisi birbirine çok yakındır.`, `On the graph the tangent slope at x = ${x0} is ${nf(mc)} and the secant slope (${x0} → ${x0 + 1}) is ${nf(ex)}; they are very close.`));
    } else if (p.kind === 'profit') {
      const x0 = p.x0, Rm = p.pr - 2 * p.q * x0, Cm = p.b + 2 * p.a * x0, Pm = Rm - Cm;
      const exact = f0(x0 + 1) - f0(x0), xs = (p.pr - p.b) / (2 * (p.q + p.a));
      st.push(H(1, Tx('Gelir, maliyet ve kâr', 'Revenue, cost and profit')) + '\n' +
        `R(x) = ${polyStr([0, p.pr, -p.q], 'x')},  C(x) = ${polyStr([p.c0, p.b, p.a], 'x')}\n` +
        `P(x) = R(x) − C(x) = ${polyStr(p.coef, 'x')}`);
      st.push(H(2, Tx('Marjinal fonksiyonlar', 'Marginal functions')) + '\n' +
        `R′(x) = ${polyStr([p.pr, -2 * p.q], 'x')},  C′(x) = ${polyStr([p.b, 2 * p.a], 'x')},  P′(x) = R′(x) − C′(x) = ${polyStr(dp(p.coef), 'x')}`);
      st.push(H(3, Tx(`x = ${x0} için değerler`, `Values at x = ${x0}`)) + '\n' +
        `R′(${x0}) = ${subStr([p.pr, -2 * p.q], x0, 'x')} = ${nf(Rm)} ${cur()}/${Tx('adet', 'unit')}\n` +
        `C′(${x0}) = ${subStr([p.b, 2 * p.a], x0, 'x')} = ${nf(Cm)} ${cur()}/${Tx('adet', 'unit')}\n` +
        `P′(${x0}) = ${nf(Rm)} − ${nf(Cm)} = ${nf(Pm)} ${cur()}/${Tx('adet', 'unit')}  (${nf(f1(x0))})`);
      st.push(H(4, Tx('Bir birim daha üretmek kârlı mı?', 'Is one more unit worthwhile?')) + '\n' +
        (Pm > 0 ? Tx(`P′(${x0}) > 0: bir birim daha üretmek kârı yaklaşık ${nf(Pm)} ${cur()} artırır.`, `P′(${x0}) > 0: one more unit raises profit by about ${nf(Pm)} ${cur()}.`)
          : Pm < 0 ? Tx(`P′(${x0}) < 0: bir birim daha üretmek kârı yaklaşık ${nf(-Pm)} ${cur()} azaltır.`, `P′(${x0}) < 0: one more unit lowers profit by about ${nf(-Pm)} ${cur()}.`)
            : Tx('P′ = 0: kâr bu noktada (yaklaşık) en büyüktür.', 'P′ = 0: profit is (about) at its maximum here.')) + '\n' +
        Tx(`Gerçek değişim: P(${x0 + 1}) − P(${x0}) = ${nf(f0(x0 + 1))} − ${f0(x0) < 0 ? '(' + nf(f0(x0)) + ')' : nf(f0(x0))} = ${nf(exact)} ${cur()}.`, `Actual change: P(${x0 + 1}) − P(${x0}) = ${nf(f0(x0 + 1))} − ${f0(x0) < 0 ? '(' + nf(f0(x0)) + ')' : nf(f0(x0))} = ${nf(exact)} ${cur()}.`));
      st.push(H(5, Tx('Kontrol ve yorum', 'Check and interpretation')) + '\n' +
        Tx(`P′(x) = 0 ⇒ R′ = C′ ⇒ x = ${nf(xs, 1)}: kârın en büyük olduğu üretim düzeyi. x = ${x0} bu değerin ${x0 < xs ? 'altında' : x0 > xs ? 'üstünde' : 'kendisinde'}; P′ işareti de buna uyar. Grafikte mor...turuncu P′ eğrisi x = ${nf(xs, 1)}'de t eksenini keser.`,
          `P′(x) = 0 ⇒ R′ = C′ ⇒ x = ${nf(xs, 1)}: the production level of maximum profit. x = ${x0} is ${x0 < xs ? 'below' : x0 > xs ? 'above' : 'exactly at'} it, matching the sign of P′. On the graph the orange P′ curve crosses the axis at x = ${nf(xs, 1)}.`).replace('mor...turuncu', 'turuncu'));
    } else {
      const sc = p.sc, nm = names(p), t0 = p.t0, h = p.h;
      const r = f1(t0), avg = (f0(t0 + h) - f0(t0)) / h, U = uq(sc), UT = ut(sc);
      st.push(H(1, Tx('Değişim hızı = türev', 'Rate of change = derivative')) + '\n' +
        `${nm.f}(t) = ${polyStr(p.coef, 't')}   (${U})\n` +
        `${nm.d1}(t) = ${polyStr(dp(p.coef), 't')}   (${U}/${UT})`);
      st.push(H(2, Tx(`t = ${t0} anında anlık hız`, `Instantaneous rate at t = ${t0}`)) + '\n' +
        `${nm.d1}(${t0}) = ${subStr(dp(p.coef), t0, 't')} = ${nf(r)} ${U}/${UT}\n` +
        (r > 0 ? Tx('Pozitif: nicelik bu anda artıyor.', 'Positive: the quantity is increasing at this moment.') : r < 0 ? Tx('Negatif: nicelik bu anda azalıyor.', 'Negative: the quantity is decreasing at this moment.') : Tx('Sıfır: nicelik bu anda durağan.', 'Zero: the quantity is momentarily steady.')));
      st.push(H(3, Tx(`[${t0}, ${t0 + h}] aralığında ortalama hız`, `Average rate over [${t0}, ${t0 + h}]`)) + '\n' +
        `${nm.f}(${t0 + h}) = ${subStr(p.coef, t0 + h, 't')} = ${nf(f0(t0 + h))},  ${nm.f}(${t0}) = ${subStr(p.coef, t0, 't')} = ${nf(f0(t0))}\n` +
        `Δ${nm.f}/Δt = (${nf(f0(t0 + h))} − ${f0(t0) < 0 ? '(' + nf(f0(t0)) + ')' : nf(f0(t0))})/${h} = ${nf(avg)} ${U}/${UT}`);
      st.push(H(4, Tx('Karşılaştırma ve kontrol', 'Comparison and check')) + '\n' +
        Tx(`Ortalama hız (kesenin eğimi) ${nf(avg)}, anlık hız (teğetin eğimi) ${nf(r)}; fark ${nf(avg - r)} ${U}/${UT}. Aralık daraldıkça kesen, teğete yaklaşır.`,
          `The average rate (secant slope) is ${nf(avg)}, the instantaneous rate (tangent slope) is ${nf(r)}; the difference is ${nf(avg - r)} ${U}/${UT}. As the interval shrinks, the secant approaches the tangent.`) + '\n' +
        Tx('Birim kontrolü: (niceliğin birimi) / (zaman birimi) olarak yazılır.', 'Unit check: (unit of the quantity) / (unit of time).'));
    }
    return st;
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
`HIZ, İVME VE DEĞİŞİM HIZI

TANIM VE TEMEL FORMÜLLER
Bir cisim doğru boyunca hareket ederken konumu zamana bağlı bir s(t) fonksiyonudur.
• Ortalama hız = Δs/Δt  (s grafiğindeki kesenin eğimi)
• Anlık hız v(t) = s′(t)  (teğetin eğimi)
• İvme a(t) = v′(t) = s″(t)
• Sürat = |v(t)|  (yön bilgisi içermez)
Genel olarak herhangi bir Q(t) niceliğinin anlık değişim hızı Q′(t) türevidir; birimi (Q birimi)/(zaman birimi) olur.

NE ANLAMA GELİR?
Hızın işareti yönü söyler: v > 0 ileri (pozitif yön), v < 0 geri. v = 0 ise cisim o anda durgundur. İvme, hızın nasıl değiştiğini anlatır. Sürat, v ile a aynı işaretliyse artar (v·a > 0), zıt işaretliyse azalır (v·a < 0).

SERBEST DÜŞME VE EĞİK/DÜŞEY ATIŞ
s(t) = s₀ + v₀t − ½gt²,  v(t) = v₀ − gt,  a = −g  (g ≈ 9,8 m/s²).
Tepe noktasında v = 0; yere çarpma anında s = 0.

EKONOMİDE DEĞİŞİM HIZI
C(x) maliyet, R(x) gelir, P = R − C kâr olsun. Marjinal maliyet C′(x), bir birim daha üretmenin yaklaşık maliyetidir:  C′(x) ≈ C(x+1) − C(x). Marjinal kâr P′ = R′ − C′ ve P′ = 0 olduğunda kâr en büyüktür.

YÖNTEM
1) Konum (veya nicelik) fonksiyonunu yazalım.
2) Türev alarak v = s′, sonra a = v′ bulalım.
3) Durgunluk için v = 0 denklemini çözelim; işaret tablosu yapalım.
4) Hızlanma/yavaşlama için v·a işaretine bakalım.
5) Yer değiştirme = s(b) − s(a); toplam yol için dönüş anlarında aralığı parçalayıp |Δs| değerlerini toplayalım.
6) Sonuca birim ekleyelim.

DİKKAT EDİLECEK NOKTALAR
• v = 0 olması a = 0 demek değildir (tepe noktasında v = 0 ama a = −g).
• Yer değiştirme ile toplam yol farklıdır; cisim geri dönüyorsa yol daha büyüktür.
• "Hızlanıyor" demek v > 0 demek değildir; geriye giderken de hızlanılabilir.
• C′(x) tam olarak C(x+1) − C(x) değil, ona çok yakın bir tahmindir.

MİNİ ÖRNEK
s = t² − 4t ⇒ v = 2t − 4, a = 2. v = 0 ⇒ t = 2 s. t < 2'de v < 0, a > 0: yavaşlar; t > 2'de hızlanır. [0, 5]'te yer değiştirme s(5) − s(0) = 5 m, toplam yol 4 + 9 = 13 m.

AKILDA KALSIN
Konum → (türev) → hız → (türev) → ivme.  v·a > 0 ⇒ hızlanır.

MÜHENDİSLİKTE
Piston ve robot kolu hareketleri, soğuma/ısınma hızları, üretim maliyet analizi ve debi (depo boşalma hızı) hesaplarında kullanılır.`,
`VELOCITY, ACCELERATION AND RATES OF CHANGE

DEFINITION AND KEY FORMULAS
For a particle moving along a line, the position is a function s(t) of time.
• Average velocity = Δs/Δt  (slope of the secant on the s-graph)
• Instantaneous velocity v(t) = s′(t)  (slope of the tangent)
• Acceleration a(t) = v′(t) = s″(t)
• Speed = |v(t)|  (no direction information)
More generally, the instantaneous rate of change of any quantity Q(t) is the derivative Q′(t); its unit is (unit of Q)/(unit of time).

WHAT DOES IT MEAN?
The sign of velocity gives the direction: v > 0 forward (positive direction), v < 0 backward. If v = 0 the particle is at rest at that instant. Acceleration says how the velocity changes. The speed grows when v and a have the same sign (v·a > 0) and shrinks when they have opposite signs (v·a < 0).

FREE FALL AND VERTICAL PROJECTILE
s(t) = s₀ + v₀t − ½gt²,  v(t) = v₀ − gt,  a = −g  (g ≈ 9.8 m/s²).
At the top v = 0; at impact s = 0.

RATES OF CHANGE IN ECONOMICS
Let C(x) be cost, R(x) revenue and P = R − C profit. Marginal cost C′(x) is roughly the cost of one more unit:  C′(x) ≈ C(x+1) − C(x). Marginal profit is P′ = R′ − C′, and profit is largest where P′ = 0.

METHOD
1) Write the position (or quantity) function.
2) Differentiate: v = s′, then a = v′.
3) For rest, solve v = 0 and build a sign chart.
4) For speeding up / slowing down, check the sign of v·a.
5) Displacement = s(b) − s(a); for total distance, split the interval at the turning times and add the |Δs| of each piece.
6) Attach units to the result.

PITFALLS
• v = 0 does not mean a = 0 (at the top v = 0 but a = −g).
• Displacement and total distance are different; if the particle turns back, the distance is larger.
• "Speeding up" does not mean v > 0; a particle can speed up while moving backward.
• C′(x) is not exactly C(x+1) − C(x), only a very close estimate.

MINI EXAMPLE
s = t² − 4t ⇒ v = 2t − 4, a = 2. v = 0 ⇒ t = 2 s. For t < 2: v < 0, a > 0 so it slows down; for t > 2 it speeds up. On [0, 5] the displacement is s(5) − s(0) = 5 m, the total distance 4 + 9 = 13 m.

MEMORY AID
Position → (derivative) → velocity → (derivative) → acceleration.  v·a > 0 ⇒ speeding up.

IN ENGINEERING
Used for piston and robot-arm motion, heating/cooling rates, production-cost analysis and flow (tank draining) calculations.`);
  }

  // ---------- drawing ----------
  function extent(p) {
    const f0 = F0(p), f1 = F1(p), f2 = F2(p);
    let m = 1;
    for (let i = 0; i <= 80; i++) {
      const t = p.tMax * i / 80;
      m = Math.max(m, Math.abs(f0(t)), Math.abs(f1(t)), Math.abs(f2(t)));
    }
    return m;
  }
  function draw(canvas, p) {
    try {
      const f0 = F0(p), f1 = F1(p), f2 = F2(p), nm = names(p), tm = Math.max(0, Math.min(p.tMax, p.tm));
      const xm = p.tMax + 0.5, ym = extent(p) * 1.15;
      canvas.setViewport(-xm, xm, -ym, ym);
      const win = (f) => (t) => (t < -1e-9 || t > p.tMax + 1e-9 ? NaN : f(t));
      canvas.addFunction({ evaluator: win(f0), color: canvas.accent(), thickness: 3, label: `${nm.f}(${nm.v})` });
      canvas.addFunction({ evaluator: win(f1), color: canvas.orange(), thickness: 2.5, label: `${nm.d1}(${nm.v})` });
      canvas.addFunction({ evaluator: win(f2), color: canvas.purple(), thickness: 2.5, label: `${nm.d2}(${nm.v})` });
      // question time / live marker
      const q = p.kind === 'kinDist' ? p.T : (p.t0 !== undefined ? p.t0 : p.x0);
      if (p.kind === 'kinDist') canvas.addRegion({ xMin: 0, xMax: p.T });
      if (q !== undefined && Math.abs(q - tm) > 1e-9) canvas.addGuideLine({ axis: 'vertical', position: q, color: canvas.gray(), label: `${p.kind === 'kinDist' ? 'T' : nm.v + '₀'} = ${nf(q)}` });
      canvas.addGuideLine({ axis: 'vertical', position: tm, color: canvas.gold(), label: `${nm.v} = ${nf(tm)}` });
      const y = f0(tm), d = f1(tm), a2 = f2(tm);
      if (p.showTan) {
        const hw = Math.max(1, p.tMax / 4);
        canvas.addFunction({ evaluator: (x) => (Math.abs(x - tm) <= hw ? y + d * (x - tm) : NaN), color: canvas.gold(), thickness: 2, dashed: true, label: Tx('teğet (eğim = ' + nm.d1 + ')', 'tangent (slope = ' + nm.d1 + ')') });
      }
      if (p.showSec) {
        const t1 = tm + p.h <= p.tMax + 1e-9 ? tm + p.h : tm - p.h;
        const y1 = f0(t1);
        canvas.addSegment({ x1: tm, y1: y, x2: t1, y2: y1, color: canvas.red(), thickness: 2, dashed: true });
        canvas.addMarker({ x: t1, y: y1, color: canvas.red(), radius: 4, hollow: true, label: Tx('ort. eğim ' + nf((y1 - y) / (t1 - tm)), 'avg slope ' + nf((y1 - y) / (t1 - tm))) });
      }
      canvas.addMarker({ x: tm, y, color: canvas.gold(), radius: 7, label: `${nm.f} = ${nf(y)}` });
      canvas.addMarker({ x: tm, y: d, color: canvas.orange(), radius: 6, label: `${nm.d1} = ${nf(d)}` });
      canvas.addMarker({ x: tm, y: a2, color: canvas.purple(), radius: 6, label: `${nm.d2} = ${nf(a2)}` });
      // direction / trend label
      let lab;
      if (isMotion(p.kind)) {
        const dir = sgn(d) > 0 ? Tx('→ ileri', '→ forward') : sgn(d) < 0 ? Tx('← geri', '← backward') : Tx('durgun', 'at rest');
        const sp = sgn(d * a2) > 0 ? Tx('hızlanıyor', 'speeding up') : sgn(d * a2) < 0 ? Tx('yavaşlıyor', 'slowing down') : Tx('sürat sabit (anlık)', 'steady speed (instant)');
        lab = `${dir}, ${sp}`;
      } else {
        lab = sgn(d) > 0 ? Tx('↑ artıyor', '↑ increasing') : sgn(d) < 0 ? Tx('↓ azalıyor', '↓ decreasing') : Tx('durağan', 'steady');
      }
      canvas.addMarker({ x: tm, y: 0, color: canvas.gold(), shape: 'diamond', radius: 5, hollow: true, label: lab });
      // key points
      if (isKin(p.kind)) {
        [p.r1, p.r2].filter((r) => r > 0 && r <= p.tMax).forEach((r) => canvas.addMarker({ x: r, y: 0, color: canvas.orange(), radius: 4, hollow: true, label: 'v = 0' }));
      }
      if (isProj(p.kind)) {
        if (p.v0 > 0) canvas.addMarker({ x: p.v0 / 10, y: f0(p.v0 / 10), color: canvas.green(), shape: 'square', radius: 5, label: Tx('zirve ' + nf(f0(p.v0 / 10)), 'top ' + nf(f0(p.v0 / 10))) });
        canvas.addMarker({ x: p.T, y: 0, color: canvas.red(), shape: 'square', radius: 5, label: Tx('yere çarpma', 'impact') });
      }
      if (p.kind === 'profit') {
        const xs = (p.pr - p.b) / (2 * (p.q + p.a));
        if (xs > 0 && xs <= p.tMax) canvas.addMarker({ x: xs, y: 0, color: canvas.green(), shape: 'square', radius: 5, hollow: true, label: Tx("P′ = 0 (en büyük kâr)", "P′ = 0 (max profit)") });
      }
    } catch (e) {
      canvas.setViewport(-5, 5, -5, 5);
    }
  }

  // ---------- controls ----------
  function buildControls(rightCol, getProblem, h) {
    let regT = null, regTT = null;
    const tOpts = {
      caption: Tx('Zaman t (veya miktar x)', 'Time t (or quantity x)'), min: 0, max: getProblem().tMax, step: getProblem().step,
      get: () => {
        const p = getProblem();
        tOpts.max = p.tMax; tOpts.step = p.step;
        if (regT && regT.input) { regT.max = p.tMax; regT.min = 0; const cap = regT.input && regT.input.parentElement && regT.input.parentElement.firstChild; if (cap && typeof cap === 'object') cap.textContent = names(p).v === 'x' ? Tx('Üretim miktarı x', 'Quantity x') : Tx('Zaman t', 'Time t'); }
        return p.tm;
      },
      set: (v) => { const p = getProblem(); v = Math.max(0, Math.min(p.tMax, v)); p.tm = Math.round(v / p.step) * p.step; },
    };
    regT = h.addSlider(tOpts);
    const TOpts = {
      caption: Tx('Bitiş zamanı T (yer değiştirme/yol için)', 'End time T (for displacement/distance)'), min: 1, max: 6, step: 1,
      get: () => {
        const p = getProblem();
        if (regTT && regTT.input && regTT.input.parentElement && regTT.input.parentElement.style) { regTT.input.parentElement.style.display = p.kind === 'kinDist' ? '' : 'none'; regTT.max = TOpts.max = Math.max(2, p.tMax); }
        return p.T === undefined ? 1 : p.T;
      },
      set: (v) => { const p = getProblem(); if (p.kind === 'kinDist') p.T = Math.max(1, Math.min(p.tMax, Math.round(v))); },
    };
    regTT = h.addSlider(TOpts);
    if (regTT && regTT.input && regTT.input.parentElement && regTT.input.parentElement.style) regTT.input.parentElement.style.display = getProblem().kind === 'kinDist' ? '' : 'none';
    h.addCheckbox({ caption: Tx('Teğet doğrusunu göster', 'Show the tangent line'), get: () => prefTan, set: (v) => { prefTan = v; getProblem().showTan = v; } });
    h.addCheckbox({ caption: Tx('Ortalama değişim (kesen) çizgisini göster', 'Show the average-rate (secant) line'), get: () => prefSec, set: (v) => { prefSec = v; getProblem().showSec = v; } });
  }

  Topics.register('derivatives', {
    id: 'motionRates',
    tabTitle: () => Tx('Hız, İvme ve Değişim Hızı', 'Velocity, Acceleration and Rates of Change'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^• (Ortalama hız|Average velocity) =/, make: (rng) => gen(rng, 'rate') },
      { match: /^• (Anlık hız|Instantaneous velocity) /, make: (rng) => gen(rng, 'kinState') },
      { match: /^• (İvme|Acceleration) a\(t\)/, make: (rng) => gen(rng, 'kinState') },
      { match: /^• (Sürat|Speed) =/, make: (rng) => gen(rng, 'kinState') },
      { match: /^(Genel olarak herhangi bir Q\(t\)|More generally, the instantaneous rate)/, make: (rng) => gen(rng, 'rate') },
      { match: /^(SERBEST DÜŞME VE EĞİK\/DÜŞEY ATIŞ|FREE FALL AND VERTICAL PROJECTILE)$/, make: (rng) => gen(rng, rng.pick(['projMax', 'projImpact'])) },
      { match: /^(EKONOMİDE DEĞİŞİM HIZI|RATES OF CHANGE IN ECONOMICS)$/, make: (rng) => gen(rng, rng.pick(['marginal', 'profit'])) },
      { match: /^3\) (Durgunluk için|For rest,)/, make: (rng) => gen(rng, 'kinRest') },
      { match: /^4\) (Hızlanma\/yavaşlama|For speeding up)/, make: (rng) => gen(rng, 'kinState') },
      { match: /^5\) (Yer değiştirme =|Displacement =)/, make: (rng) => gen(rng, 'kinDist') },
    ],
  });
})();
