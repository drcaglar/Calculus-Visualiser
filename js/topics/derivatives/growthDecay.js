// Exponential Growth and Decay (chapter 'derivatives'). Stewart 3.8, Thomas 7.2.
// Model used everywhere:  y(t) = Ts + (y0 − Ts)·e^(k t)   (Ts = 0 except Newton cooling; k < 0 for decay / cooling)
// problem.kind:
//   'data'       find k from y(0) and y(t1), predict y(t2), doubling time or half-life
//   'halfRemain' given half-life, amount left after a time
//   'halfTime'   given half-life, time to fall to a fraction q
//   'popDouble'  given doubling time, size after a time
//   'popTime'    given growth constant k, time to reach c times the start
//   'cool'       Newton cooling / heating: T after t2 minutes (k from one reading)
//   'coolTime'   Newton cooling / heating: time to reach a given temperature
//   'compound'   continuous vs n-times-a-year compounding
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);
  const M = (s) => String(s).replace(/-/g, '−');
  function nf(v, dec) {
    if (!isFinite(v)) return '—';
    let t = v.toFixed(dec === undefined ? 2 : dec);
    if (t.indexOf('.') >= 0) t = t.replace(/0+$/, '').replace(/[.]$/, '');
    if (t === '-0' || t === '0.00') t = '0';
    return M(t);
  }
  const ln = (x) => nf(Math.log(x), 4);
  const SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const supS = (n) => String(n).split('').map((c) => SUPD[c] || c).join('');
  const near = (a, b) => Math.abs(a - b) < 1e-9 * (1 + Math.abs(b));
  function nice(raw) {
    if (!(raw > 0)) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    const m = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
    return Math.round(m * mag * 1e12) / 1e12;
  }
  const KINDS = ['data', 'halfRemain', 'halfTime', 'popDouble', 'popTime', 'cool', 'coolTime', 'compound'];
  const isCool = (k) => k === 'cool' || k === 'coolTime';

  // ---------- scenario tables ----------
  const GROW = [
    { sym: 'N', nm: ['Bir bakteri kültüründeki bakteri sayısı', 'The number of bacteria in a culture'], u: ['bakteri', 'bacteria'], tu: ['saat', 'h'], tw: ['saat', 'hours'] },
    { sym: 'P', nm: ['Bir kasabanın nüfusu', 'The population of a town'], u: ['kişi', 'people'], tu: ['yıl', 'yr'], tw: ['yıl', 'years'] },
    { sym: 'P', nm: ['Bir gölün balık sayısı', 'The number of fish in a lake'], u: ['balık', 'fish'], tu: ['ay', 'months'], tw: ['ay', 'months'] },
  ];
  const DECAY = [
    { sym: 'm', nm: ['Radyoaktif bir numunenin kütlesi', 'The mass of a radioactive sample'], u: 'mg', tu: ['gün', 'day'], tw: ['gün', 'days'] },
    { sym: 'C', nm: ['Kandaki ilaç derişimi', 'The drug concentration in the blood'], u: 'mg/L', tu: ['saat', 'h'], tw: ['saat', 'hours'] },
    { sym: 'A', nm: ['Sönümlü bir titreşimin genliği', 'The amplitude of a damped vibration'], u: 'mm', tu: ['s', 's'], tw: ['saniye', 'seconds'] },
  ];
  const POPS = [
    { sym: 'N', nm: ['Bir bakteri kültüründeki bakteri sayısı', 'The number of bacteria in a culture'], u: ['bakteri', 'bacteria'], tu: ['saat', 'h'], tw: ['saat', 'hours'], Td: [1, 2, 3, 4], kL: [0.2, 0.3, 0.4, 0.5, 0.6], y0: [100, 200, 500, 1000] },
    { sym: 'P', nm: ['Bir kasabanın nüfusu', 'The population of a town'], u: ['kişi', 'people'], tu: ['yıl', 'yr'], tw: ['yıl', 'years'], Td: [15, 20, 25, 30, 35], kL: [0.015, 0.02, 0.025, 0.03, 0.04], y0: [10000, 20000, 50000] },
    { sym: 'P', nm: ['Bir gölün balık sayısı', 'The number of fish in a lake'], u: ['balık', 'fish'], tu: ['ay', 'months'], tw: ['ay', 'months'], Td: [4, 6, 8, 12], kL: [0.05, 0.08, 0.1, 0.15], y0: [500, 1000, 2000, 5000] },
  ];
  const ISO = [
    { nm: ['iyot-131', 'iodine-131'], T: 8, tu: ['gün', 'day'], tw: ['gün', 'days'] },
    { nm: ['sezyum-137', 'caesium-137'], T: 30, tu: ['yıl', 'yr'], tw: ['yıl', 'years'] },
    { nm: ['karbon-14', 'carbon-14'], T: 5730, tu: ['yıl', 'yr'], tw: ['yıl', 'years'] },
    { nm: ['teknesyum-99m', 'technetium-99m'], T: 6, tu: ['saat', 'h'], tw: ['saat', 'hours'] },
  ];
  const PARTS = [
    ['bir fren diski', 'a brake disc'], ['bir motor bloğu', 'an engine block'], ['sıcak bir çelik mil', 'a hot steel shaft'], ['yeni kaynak yapılmış bir parça', 'a freshly welded part'],
  ];
  const HEATP = [['bir çelik mil', 'a steel shaft'], ['bir alüminyum parça', 'an aluminium part'], ['bir rulman', 'a bearing']];

  function ranges(p) {
    const ks = p.ks;
    const k0 = p.k * ks;
    let lo = Math.min(0.6 * k0, 1.4 * k0), hi = Math.max(0.6 * k0, 1.4 * k0);
    const kst = nice(Math.abs(k0) * 0.04);
    lo = Math.floor(lo / kst) * kst; hi = Math.ceil(hi / kst) * kst;
    const yst = nice(Math.abs(p.y0) * 0.05);
    const r = { k: [lo, hi, kst], y0: [Math.floor(0.5 * p.y0 / yst) * yst, Math.ceil(1.5 * p.y0 / yst) * yst, yst] };
    if (isCool(p.kind)) { const s = nice(Math.abs(p.Ts) * 0.05); r.Ts = [Math.floor(0.5 * p.Ts / s) * s, Math.ceil(1.5 * p.Ts / s) * s, s]; }
    return r;
  }
  function curveAt(p, kk, y0, Ts, t) { return Ts + (y0 - Ts) * Math.exp(kk * t); }
  function extent(p) {
    let m = 1;
    const ks = [p.rng.k[0] / p.ks, p.rng.k[1] / p.ks], ys = [p.rng.y0[0], p.rng.y0[1]];
    const Ts = p.rng.Ts ? [p.rng.Ts[0], p.rng.Ts[1]] : [p.Ts];
    ks.forEach((kk) => ys.forEach((yy) => Ts.forEach((tt) => {
      for (let i = 0; i <= 40; i++) {
        const t = p.tMax * i / 40;
        m = Math.max(m, Math.abs(curveAt(p, kk, yy, tt, t)));
        if (p.kind === 'compound') m = Math.max(m, Math.abs(yy * Math.pow(1 + kk / p.n, p.n * t)));
      }
    })));
    return m;
  }

  function createProblem(rng) { return gen(rng, rng.pick(KINDS)); }
  function gen(rng, kind, opts) {
    opts = opts || {};
    const p = { kind, Ts: 0, data: [], showLive: true };
    const growth = (a) => a > 1;
    if (kind === 'data') {
      const grow0 = rng.pick([true, false]);
      const grow = opts.grow === undefined ? grow0 : opts.grow;
      const sc = rng.pick(grow ? GROW : DECAY);
      const rt = rng.pick(grow ? [[2, 1], [3, 1], [3, 2]] : [[1, 2], [1, 3], [3, 4]]);
      const n = rng.pick([2, 3]);
      const t1 = rng.nextInt(1, 5);
      const L = Math.pow(rt[1], n);
      const cands = [1, 2, 3, 5, 10, 20, 25, 50, 100].map((m) => L * m).filter((v) => v >= 100 && v <= 3000);
      p.sc = sc; p.grow = grow; p.rt = rt; p.t1 = t1; p.t2 = n * t1; p.n = n;
      p.y0 = rng.pick(cands.length ? cands : [L * 2]);
      p.y1 = p.y0 * rt[0] / rt[1];
      p.k = Math.log(rt[0] / rt[1]) / t1;
      p.tq = p.t2; p.yq = p.y0 * Math.pow(rt[0] / rt[1], n);
      p.data = [{ t: 0, y: p.y0 }, { t: t1, y: p.y1 }];
      p.keyT = [p.t2];
    } else if (kind === 'halfRemain' || kind === 'halfTime') {
      const iso = rng.pick(ISO);
      p.iso = iso; p.T = iso.T;
      p.y0 = rng.pick([40, 64, 80, 100, 200, 400]);
      p.k = -Math.LN2 / iso.T;
      if (kind === 'halfRemain') {
        const c = rng.pick([1.5, 2, 2.5, 3, 4]);
        p.tq = c * iso.T; p.yq = p.y0 * Math.pow(0.5, c);
      } else {
        p.q = rng.pick([0.25, 0.1, 0.05, 0.2, 0.01, 0.125]);
        p.tq = iso.T * Math.log2(1 / p.q); p.yq = p.q * p.y0;
      }
      p.data = [{ t: iso.T, y: p.y0 / 2 }];
      p.keyT = [p.tq, iso.T];
    } else if (kind === 'popDouble') {
      const sc = rng.pick(POPS);
      p.sc = sc;
      p.Td = rng.pick(sc.Td);
      p.y0 = rng.pick(sc.y0);
      const cs = [1.5, 2, 2.5, 3, 4].filter((c) => Math.abs(c * p.Td - Math.round(c * p.Td)) < 1e-9);
      p.c = rng.pick(cs);
      p.k = Math.LN2 / p.Td;
      p.tq = p.c * p.Td; p.yq = p.y0 * Math.pow(2, p.c);
      p.data = [{ t: p.Td, y: 2 * p.y0 }];
      p.keyT = [p.tq, p.Td];
    } else if (kind === 'popTime') {
      const sc = rng.pick(POPS);
      p.sc = sc;
      p.k = rng.pick(sc.kL);
      p.y0 = rng.pick(sc.y0);
      p.c = rng.pick([3, 5, 10]);
      p.tq = Math.log(p.c) / p.k; p.yq = p.c * p.y0;
      p.keyT = [p.tq, Math.LN2 / p.k];
      p.data = [{ t: Math.LN2 / p.k, y: 2 * p.y0 }];
    } else if (kind === 'cool' || kind === 'coolTime') {
      const heat0 = rng.nextInt(0, 5) === 0;
      p.heat = opts.heat === undefined ? heat0 : opts.heat;
      const r = rng.pick([[1, 2], [3, 4], [3, 5]]);
      const t1 = rng.pick([5, 10, 15, 20]);
      p.r = r; p.t1 = t1;
      if (!p.heat) {
        p.part = rng.pick(PARTS);
        p.Ts = rng.pick([20, 25, 30]);
        const D0 = rng.pick([60, 80, 100, 120, 140, 160]);
        p.y0 = p.Ts + D0;
      } else {
        p.part = rng.pick(HEATP);
        p.y0 = 20;
        p.Ts = rng.pick([120, 140, 180, 220]);
      }
      const D0 = p.y0 - p.Ts;
      p.D0 = D0;
      p.y1 = p.Ts + D0 * r[0] / r[1];
      p.k = Math.log(r[0] / r[1]) / t1;
      p.data = [{ t: 0, y: p.y0 }, { t: t1, y: p.y1 }];
      if (kind === 'cool') {
        p.t2 = rng.pick([2, 3, 4]) * t1 + rng.pick([0, 5]);
        p.tq = p.t2; p.yq = p.Ts + D0 * Math.exp(p.k * p.t2);
      } else {
        p.f = rng.pick([[1, 4], [1, 5], [1, 10]]);
        p.Dstar = D0 * p.f[0] / p.f[1];
        p.Tstar = p.Ts + p.Dstar;
        p.tq = Math.log(p.f[0] / p.f[1]) / p.k; p.yq = p.Tstar;
      }
      p.keyT = [p.tq, t1];
    } else {
      p.y0 = rng.pick([1000, 2000, 5000, 10000]);
      p.rate = rng.pick([4, 5, 6, 8]);
      p.n = rng.pick([2, 4, 12]);
      p.years = rng.pick([5, 10, 15, 20]);
      p.k = p.rate / 100;
      p.tq = p.years; p.yq = p.y0 * Math.exp(p.k * p.years);
      p.data = [{ t: 0, y: p.y0 }];
      p.keyT = [p.years, Math.LN2 / p.k];
    }
    p.tMax = Math.max.apply(null, p.keyT.concat(p.tq, p.t1 || 0)) * 1.25;
    // slider scale for k (so that fmt2 shows meaningful digits)
    const ak = Math.abs(p.k);
    p.km = Math.ceil(-Math.log10(ak) - 1e-9);
    p.ks = Math.pow(10, p.km);
    p.rng = ranges(p);
    p.vk = p.k; p.vy0 = p.y0; p.vTs = p.Ts; p.vt = p.tq;
    p.tstep = nice(p.tMax / 50);
    return p;
  }

  // ---------- helpers for text ----------
  const sym = (p) => (isCool(p.kind) ? 'T' : p.kind === 'compound' ? 'A' : p.kind === 'halfRemain' || p.kind === 'halfTime' ? 'm' : p.sc ? p.sc.sym : 'y');
  const U = (p) => {
    if (isCool(p.kind)) return '°C';
    if (p.kind === 'compound') return Tx('₺', '$');
    if (p.kind === 'halfRemain' || p.kind === 'halfTime') return 'mg';
    const u = p.sc.u; return Array.isArray(u) ? Tx(u[0], u[1]) : u;
  };
  const TU = (p) => {
    if (isCool(p.kind)) return Tx('dk', 'min');
    if (p.kind === 'compound') return Tx('yıl', 'yr');
    const s = p.kind === 'halfRemain' || p.kind === 'halfTime' ? p.iso : p.sc;
    return Tx(s.tu[0], s.tu[1]);
  };
  const TW = (p) => {
    if (isCool(p.kind)) return Tx('dakika', 'minutes');
    if (p.kind === 'compound') return Tx('yıl', 'years');
    const s = p.kind === 'halfRemain' || p.kind === 'halfTime' ? p.iso : p.sc;
    return Tx(s.tw[0], s.tw[1]);
  };
  const H = (k, t) => `── ${k}) ${t} ──`;
  const par = (x) => (x < 0 ? '(' + nf(x) + ')' : nf(x));

  // ---------- statements ----------
  function problemStatement(p) {
    const y = sym(p), u = U(p), tw = TW(p);
    switch (p.kind) {
      case 'data': {
        const nm = Tx(p.sc.nm[0], p.sc.nm[1]);
        return Tx(`${nm} başlangıçta ${nf(p.y0)} ${u}. ${p.t1} ${tw} sonra ${nf(p.y1)} ${u} olduğuna göre ${y}′ = k·${y} modelini varsayarak k sabiti kaç olur? ${p.t2} ${tw} sonra ${y} kaça ulaşır ve ${p.grow ? 'iki katına çıkma süresi' : 'yarı ömrü'} kaç ${tw} olur?`,
          `${nm} is ${nf(p.y0)} ${u} at the start and ${nf(p.y1)} ${u} after ${p.t1} ${tw}. Assuming ${y}′ = k·${y}, what is the constant k? What is ${y} after ${p.t2} ${tw}, and what is the ${p.grow ? 'doubling time' : 'half-life'}?`);
      }
      case 'halfRemain':
        return Tx(`${p.iso.nm[0]} izotopunun yarı ömrü ${p.T} ${tw}. Başlangıçta ${nf(p.y0)} mg numune varsa ${nf(p.tq)} ${tw} sonra ne kadarı kalır? Sönme sabiti k kaç olur?`,
          `The half-life of ${p.iso.nm[1]} is ${p.T} ${tw}. If a sample starts at ${nf(p.y0)} mg, how much remains after ${nf(p.tq)} ${tw}? What is the decay constant k?`);
      case 'halfTime':
        return Tx(`${p.iso.nm[0]} izotopunun yarı ömrü ${p.T} ${tw}. ${nf(p.y0)} mg numunenin ilk kütlesinin %${nf(p.q * 100)} kadarına (${nf(p.yq)} mg) düşmesi kaç ${tw} sürer?`,
          `The half-life of ${p.iso.nm[1]} is ${p.T} ${tw}. How many ${tw} does it take for a ${nf(p.y0)} mg sample to fall to ${nf(p.q * 100)}% of its initial mass (${nf(p.yq)} mg)?`);
      case 'popDouble': {
        const nm = Tx(p.sc.nm[0], p.sc.nm[1]);
        return Tx(`${nm} başlangıçta ${nf(p.y0)} ${u} ve her ${p.Td} ${tw} sürede iki katına çıkıyor (üstel büyüme). Büyüme sabiti k kaç olur? ${nf(p.tq)} ${tw} sonra ${y} kaç olur?`,
          `${nm} is ${nf(p.y0)} ${u} at the start and doubles every ${p.Td} ${tw} (exponential growth). What is the growth constant k? What is ${y} after ${nf(p.tq)} ${tw}?`);
      }
      case 'popTime': {
        const nm = Tx(p.sc.nm[0], p.sc.nm[1]);
        return Tx(`${nm} başlangıçta ${nf(p.y0)} ${u} ve ${y}′ = ${nf(p.k, 3)}·${y} (t, ${tw} cinsinden) modeline uyuyor. İki katına çıkması kaç ${tw} sürer? ${nf(p.yq)} ${u} değerine ne zaman ulaşılır?`,
          `${nm} is ${nf(p.y0)} ${u} at the start and follows ${y}′ = ${nf(p.k, 3)}·${y} (t in ${tw}). How long does it take to double? When does it reach ${nf(p.yq)} ${u}?`);
      }
      case 'cool': {
        const pt = Tx(p.part[0], p.part[1]);
        return p.heat
          ? Tx(`Sıcaklığı ${p.y0} °C olan ${pt}, ${p.Ts} °C'lik bir fırına konuyor ve Newton yasasına göre ısınıyor. ${p.t1} dakika sonra sıcaklığı ${nf(p.y1)} °C ölçülüyor. Sabit k kaç olur? ${p.t2} dakika sonra sıcaklık kaç °C olur?`,
            `${pt[0].toUpperCase() + pt.slice(1)} at ${p.y0} °C is placed in a ${p.Ts} °C furnace and warms up according to Newton's law. After ${p.t1} minutes its temperature is ${nf(p.y1)} °C. What is k? What is the temperature after ${p.t2} minutes?`)
          : Tx(`Sıcaklığı ${p.y0} °C olan ${pt}, ortam sıcaklığı ${p.Ts} °C olan bir atölyede Newton'un soğuma yasasına göre soğuyor. ${p.t1} dakika sonra ${nf(p.y1)} °C ölçülüyor. Soğuma sabiti k kaç olur? ${p.t2} dakika sonra sıcaklık kaç °C olur?`,
            `${pt[0].toUpperCase() + pt.slice(1)} at ${p.y0} °C cools in a workshop at ${p.Ts} °C following Newton's law of cooling. After ${p.t1} minutes it reads ${nf(p.y1)} °C. What is the cooling constant k? What is the temperature after ${p.t2} minutes?`);
      }
      case 'coolTime': {
        const pt = Tx(p.part[0], p.part[1]);
        return p.heat
          ? Tx(`Sıcaklığı ${p.y0} °C olan ${pt}, ${p.Ts} °C'lik bir fırına konuyor ve Newton yasasına göre ısınıyor. ${p.t1} dakika sonra ${nf(p.y1)} °C ölçülüyor. Parça kaç dakikada ${nf(p.Tstar)} °C'ye ulaşır?`,
            `${pt[0].toUpperCase() + pt.slice(1)} at ${p.y0} °C is placed in a ${p.Ts} °C furnace and warms up according to Newton's law. After ${p.t1} minutes it reads ${nf(p.y1)} °C. After how many minutes does it reach ${nf(p.Tstar)} °C?`)
          : Tx(`Sıcaklığı ${p.y0} °C olan ${pt}, ortam sıcaklığı ${p.Ts} °C olan bir atölyede Newton'un soğuma yasasına göre soğuyor. ${p.t1} dakika sonra ${nf(p.y1)} °C ölçülüyor. Parça kaç dakikada ${nf(p.Tstar)} °C'ye düşer?`,
            `${pt[0].toUpperCase() + pt.slice(1)} at ${p.y0} °C cools in a workshop at ${p.Ts} °C following Newton's law of cooling. After ${p.t1} minutes it reads ${nf(p.y1)} °C. After how many minutes does it cool to ${nf(p.Tstar)} °C?`);
      }
      default: {
        const c = Tx('₺', '$');
        const per = p.n === 2 ? ['yılda 2 kez (6 aylık)', 'twice a year'] : p.n === 4 ? ['yılda 4 kez (3 aylık)', 'four times a year'] : ['yılda 12 kez (aylık)', 'monthly (12 times a year)'];
        return Tx(`${nf(p.y0)} ${c} yıllık %${p.rate} faizle ${p.years} yıl yatırılıyor. Faiz sürekli bileşik uygulanırsa ve ${per[0]} bileşik uygulanırsa son tutarlar kaç olur? Aradaki fark ne kadardır; paranın iki katına çıkma süresi (sürekli bileşikte) kaç yıldır?`,
          `${nf(p.y0)} ${c} is invested for ${p.years} years at ${p.rate}% per year. What are the final amounts with continuous compounding and with compounding ${per[1]}? How large is the difference, and how long does the money take to double (continuous case)?`);
      }
    }
  }

  // ---------- model step shared by most kinds ----------
  function modelStep(p) {
    const y = sym(p);
    return H(1, Tx('Model: değişim hızı, miktarla orantılı', 'Model: the rate is proportional to the amount')) + '\n' +
      Tx(`${y}′(t) = k·${y}(t) denklemini değişkenlerine ayıralım:`, `Let us separate the variables in ${y}′(t) = k·${y}(t):`) + '\n' +
      `d${y}/${y} = k dt   ⇒   ln|${y}| = kt + C   ⇒   ${y}(t) = ${y}₀·e^(kt)\n` +
      Tx(`Burada ${y}₀ = ${y}(0) başlangıç değeridir. k > 0 büyüme, k < 0 sönme demektir.`, `Here ${y}₀ = ${y}(0) is the starting value. k > 0 means growth, k < 0 means decay.`);
  }
  function coolModel(p) {
    return H(1, Tx('Model: Newton yasası', "Model: Newton's law")) + '\n' +
      Tx('Sıcaklık değişim hızı, parça ile ortam arasındaki farkla orantılıdır: T′ = −k(T − Tₛ), k > 0.', 'The rate of change of temperature is proportional to the difference between part and surroundings: T′ = −k(T − Tₛ), k > 0.') + '\n' +
      Tx('u = T − Tₛ diyelim; u′ = −ku olur, bu da u = u₀·e^(−kt) çözümünü verir:', 'Let u = T − Tₛ; then u′ = −ku, whose solution is u = u₀·e^(−kt):') + '\n' +
      `T(t) = Tₛ + (T₀ − Tₛ)·e^(−kt)\n` +
      Tx(`Tₛ = ${p.Ts} °C, T₀ = ${p.y0} °C ⇒ T₀ − Tₛ = ${nf(p.D0)} °C.`, `Tₛ = ${p.Ts} °C, T₀ = ${p.y0} °C ⇒ T₀ − Tₛ = ${nf(p.D0)} °C.`);
  }

  // ---------- solution ----------
  function solveSteps(p) {
    const y = sym(p), u = U(p), tu = TU(p), tw = TW(p);
    const st = [];
    const k = p.k;
    if (p.kind === 'data') {
      const ratio = p.y1 / p.y0;
      st.push(modelStep(p));
      st.push(H(2, Tx('k sabitini verilerden bulalım', 'Find k from the data')) + '\n' +
        `${y}(${p.t1}) = ${nf(p.y0)}·e^(k·${p.t1}) = ${nf(p.y1)}\n` +
        `e^(${p.t1}k) = ${nf(p.y1)}/${nf(p.y0)} = ${nf(ratio, 4)}\n` +
        `${p.t1}k = ln ${nf(ratio, 4)} = ${ln(ratio)}\n` +
        `k = ${ln(ratio)}/${p.t1} ≈ ${nf(k, 4)}  (1/${tu})`);
      st.push(H(3, Tx('Denklem', 'The equation')) + '\n' +
        `${y}(t) = ${nf(p.y0)}·e^(${nf(k, 4)}t)`);
      st.push(H(4, Tx(`t = ${p.t2} ${tu} için değer`, `Value at t = ${p.t2} ${tu}`)) + '\n' +
        `${y}(${p.t2}) = ${nf(p.y0)}·e^(${nf(k, 4)}·${p.t2}) = ${nf(p.y0)}·e^(${nf(k * p.t2, 4)}) ≈ ${nf(p.yq)} ${u}\n` +
        Tx(`Kısa yol: ${y}(${p.t2}) = ${y}₀·(${y}₁/${y}₀)^(${p.t2}/${p.t1}) = ${nf(p.y0)}·${nf(ratio, 4)}^${p.n} = ${nf(p.yq)}.`, `Shortcut: ${y}(${p.t2}) = ${y}₀·(${y}₁/${y}₀)^(${p.t2}/${p.t1}) = ${nf(p.y0)}·${nf(ratio, 4)}^${p.n} = ${nf(p.yq)}.`));
      st.push(H(5, p.grow ? Tx('İki katına çıkma süresi', 'Doubling time') : Tx('Yarı ömür', 'Half-life')) + '\n' +
        (p.grow ? `e^(k·t_d) = 2 ⇒ t_d = ln 2/k = ${ln(2)}/${nf(k, 4)} ≈ ${nf(Math.LN2 / k)} ${tu}`
          : `e^(k·t_½) = 1/2 ⇒ t_½ = ln 2/|k| = ${ln(2)}/${nf(Math.abs(k), 4)} ≈ ${nf(Math.LN2 / Math.abs(k))} ${tu}`));
      st.push(H(6, Tx('Kontrol', 'Check')) + '\n' +
        `${y}(${p.t1}) = ${nf(p.y0)}·e^(${nf(k * p.t1, 4)}) = ${nf(p.y0 * Math.exp(k * p.t1))} ≈ ${nf(p.y1)} ✓\n` +
        Tx(`Grafikte eğri (0; ${nf(p.y0)}), (${p.t1}; ${nf(p.y1)}) noktalarından geçer ve ${p.grow ? 'yükselir' : 'alçalarak t eksenine yaklaşır'}; yeşil kare t = ${p.t2} için bulunan değeri gösterir.`,
          `On the graph the curve passes through (0; ${nf(p.y0)}) and (${p.t1}; ${nf(p.y1)}) and ${p.grow ? 'rises' : 'falls toward the t-axis'}; the green square marks the value found at t = ${p.t2}.`));
    } else if (p.kind === 'halfRemain') {
      const n = p.tq / p.T;
      st.push(modelStep(p));
      st.push(H(2, Tx('Yarı ömürden k', 'k from the half-life')) + '\n' +
        `m(${p.T}) = m₀/2 ⇒ m₀·e^(k·${p.T}) = m₀/2 ⇒ e^(${p.T}k) = 1/2\n` +
        `k = ln(1/2)/${p.T} = −ln 2/${p.T} = −${ln(2)}/${p.T} ≈ ${nf(k, 6)}  (1/${tu})`);
      st.push(H(3, Tx('Kalan miktar', 'Amount remaining')) + '\n' +
        `m(${nf(p.tq)}) = ${nf(p.y0)}·e^(${nf(k, 6)}·${nf(p.tq)}) = ${nf(p.y0)}·e^(${nf(k * p.tq, 4)})\n` +
        `= ${nf(p.y0)}·${nf(Math.exp(k * p.tq), 4)} ≈ ${nf(p.yq)} mg`);
      st.push(H(4, Tx('Kontrol (yarı ömür sayısı)', 'Check (number of half-lives)')) + '\n' +
        Tx(`${nf(p.tq)}/${p.T} = ${nf(n)} yarı ömür geçti; m = m₀·(1/2)^${nf(n)} = ${nf(p.y0)}·${nf(Math.pow(0.5, n), 4)} = ${nf(p.yq)} mg ✓`,
          `${nf(p.tq)}/${p.T} = ${nf(n)} half-lives have passed; m = m₀·(1/2)^${nf(n)} = ${nf(p.y0)}·${nf(Math.pow(0.5, n), 4)} = ${nf(p.yq)} mg ✓`) + '\n' +
        Tx(`Bu, başlangıç miktarının %${nf(100 * Math.pow(0.5, n), 2)} kadarıdır. Grafikte turuncu halka t = ${p.T} ${tu} için m₀/2 değerini, yeşil kare ise bulunan noktayı gösterir.`,
          `That is ${nf(100 * Math.pow(0.5, n), 2)}% of the starting amount. On the graph the hollow marker shows m₀/2 at t = ${p.T} ${tu}, and the green square the point found.`));
    } else if (p.kind === 'halfTime') {
      st.push(modelStep(p));
      st.push(H(2, Tx('Yarı ömürden k', 'k from the half-life')) + '\n' +
        `e^(${p.T}k) = 1/2 ⇒ k = −ln 2/${p.T} ≈ ${nf(k, 6)}  (1/${tu})`);
      st.push(H(3, Tx('Hedef kütleye ulaşma süresi', 'Time to reach the target mass')) + '\n' +
        `m(t) = ${nf(p.y0)}·e^(kt) = ${nf(p.yq)}\n` +
        `e^(kt) = ${nf(p.yq)}/${nf(p.y0)} = ${nf(p.q, 4)}\n` +
        `kt = ln ${nf(p.q, 4)} = ${ln(p.q)}\n` +
        `t = ${ln(p.q)}/(${nf(k, 6)}) ≈ ${nf(p.tq)} ${tu}`);
      st.push(H(4, Tx('Kontrol', 'Check')) + '\n' +
        Tx(`Yarı ömür cinsinden: t = ${p.T}·log₂(1/${nf(p.q, 4)}) = ${p.T}·${nf(Math.log2(1 / p.q), 4)} ≈ ${nf(p.tq)} ${tu}. Yani ${nf(Math.log2(1 / p.q), 3)} yarı ömür geçmesi gerekir; ${Math.floor(Math.log2(1 / p.q))} ile ${Math.floor(Math.log2(1 / p.q)) + 1} yarı ömür arasında olması mantıklıdır.`,
          `In half-lives: t = ${p.T}·log₂(1/${nf(p.q, 4)}) = ${p.T}·${nf(Math.log2(1 / p.q), 4)} ≈ ${nf(p.tq)} ${tu}. So ${nf(Math.log2(1 / p.q), 3)} half-lives must pass, which lies between ${Math.floor(Math.log2(1 / p.q))} and ${Math.floor(Math.log2(1 / p.q)) + 1} — sensible.`) + '\n' +
        `m(${nf(p.tq)}) = ${nf(p.y0)}·e^(${nf(k * p.tq, 4)}) = ${nf(p.y0 * Math.exp(k * p.tq))} mg ✓`);
    } else if (p.kind === 'popDouble') {
      st.push(modelStep(p));
      st.push(H(2, Tx('İki katına çıkma süresinden k', 'k from the doubling time')) + '\n' +
        `${y}(${p.Td}) = 2${y}₀ ⇒ e^(${p.Td}k) = 2 ⇒ k = ln 2/${p.Td} = ${ln(2)}/${p.Td} ≈ ${nf(k, 4)}  (1/${tu})`);
      st.push(H(3, Tx(`t = ${nf(p.tq)} ${tu} için değer`, `Value at t = ${nf(p.tq)} ${tu}`)) + '\n' +
        `${y}(${nf(p.tq)}) = ${nf(p.y0)}·e^(${nf(k, 4)}·${nf(p.tq)}) = ${nf(p.y0)}·e^(${nf(k * p.tq, 4)}) = ${nf(p.y0)}·${nf(Math.exp(k * p.tq), 4)} ≈ ${nf(p.yq)} ${u}`);
      st.push(H(4, Tx('Kontrol', 'Check')) + '\n' +
        Tx(`${nf(p.tq)}/${p.Td} = ${nf(p.c)} kez iki katına çıkma: ${y} = ${nf(p.y0)}·2^${nf(p.c)} = ${nf(p.yq)} ${u} ✓ Grafikte turuncu halka (${p.Td}; ${nf(2 * p.y0)}) noktasını, yeşil kare sonucu gösterir.`,
          `${nf(p.tq)}/${p.Td} = ${nf(p.c)} doublings: ${y} = ${nf(p.y0)}·2^${nf(p.c)} = ${nf(p.yq)} ${u} ✓ On the graph the hollow marker is the point (${p.Td}; ${nf(2 * p.y0)}) and the green square the result.`));
    } else if (p.kind === 'popTime') {
      st.push(modelStep(p));
      st.push(H(2, Tx('İki katına çıkma süresi', 'Doubling time')) + '\n' +
        `e^(kt_d) = 2 ⇒ t_d = ln 2/k = ${ln(2)}/${nf(k, 3)} ≈ ${nf(Math.LN2 / k)} ${tu}`);
      st.push(H(3, Tx(`${nf(p.yq)} ${u} değerine ulaşma süresi`, `Time to reach ${nf(p.yq)} ${u}`)) + '\n' +
        `${nf(p.y0)}·e^(${nf(k, 3)}t) = ${nf(p.yq)}\n` +
        `e^(${nf(k, 3)}t) = ${p.c}\n` +
        `${nf(k, 3)}t = ln ${p.c} = ${ln(p.c)}\n` +
        `t = ${ln(p.c)}/${nf(k, 3)} ≈ ${nf(p.tq)} ${tu}`);
      st.push(H(4, Tx('Kontrol', 'Check')) + '\n' +
        `${y}(${nf(p.tq)}) = ${nf(p.y0)}·e^(${nf(k * p.tq, 4)}) = ${nf(p.y0 * Math.exp(k * p.tq))} ≈ ${nf(p.yq)} ✓\n` +
        Tx(`${p.c} kat için süre, iki katına çıkma süresinin ln ${p.c}/ln 2 = ${nf(Math.log(p.c) / Math.LN2, 3)} katıdır: ${nf(Math.LN2 / k)}·${nf(Math.log(p.c) / Math.LN2, 3)} ≈ ${nf(p.tq)} ${tu}.`,
          `The time for a factor ${p.c} is ln ${p.c}/ln 2 = ${nf(Math.log(p.c) / Math.LN2, 3)} times the doubling time: ${nf(Math.LN2 / k)}·${nf(Math.log(p.c) / Math.LN2, 3)} ≈ ${nf(p.tq)} ${tu}.`));
    } else if (p.kind === 'cool' || p.kind === 'coolTime') {
      const kp = -k, r = p.r[0] / p.r[1];
      st.push(coolModel(p));
      st.push(H(2, Tx('Soğuma/ısınma sabiti k', 'The constant k')) + '\n' +
        `T(${p.t1}) = ${p.Ts} + ${par(p.D0)}·e^(−${p.t1}k) = ${nf(p.y1)}\n` +
        `e^(−${p.t1}k) = (${nf(p.y1)} − ${p.Ts})/${par(p.D0)} = ${nf(r, 4)}\n` +
        `−${p.t1}k = ln ${nf(r, 4)} = ${ln(r)}\n` +
        `k = ${ln(1 / r)}/${p.t1} ≈ ${nf(kp, 4)}  (1/${tu})`);
      if (p.kind === 'cool') {
        const ex = Math.exp(k * p.t2);
        st.push(H(3, Tx(`t = ${p.t2} dk için sıcaklık`, `Temperature at t = ${p.t2} min`)) + '\n' +
          `T(${p.t2}) = ${p.Ts} + ${par(p.D0)}·e^(−${nf(kp, 4)}·${p.t2}) = ${p.Ts} + ${par(p.D0)}·e^(${nf(k * p.t2, 4)})\n` +
          `= ${p.Ts} + ${par(p.D0)}·${nf(ex, 4)} = ${p.Ts} + ${nf(p.D0 * ex)} ≈ ${nf(p.yq)} °C`);
        st.push(H(4, Tx('Kontrol ve yorum', 'Check and interpretation')) + '\n' +
          Tx(`Fark (T − Tₛ) her ${nf(Math.LN2 / kp)} dk'de yarıya iner. Süre uzadıkça T → Tₛ = ${p.Ts} °C olur: grafikteki yatay çizgi (asimptot) bu değerdir. Bulunan ${nf(p.yq)} °C, ${p.y0} °C ile ${p.Ts} °C arasında kalıyor ✓`,
            `The difference (T − Tₛ) halves every ${nf(Math.LN2 / kp)} min. As time grows T → Tₛ = ${p.Ts} °C: that is the horizontal line (asymptote) on the graph. The result ${nf(p.yq)} °C lies between ${p.y0} °C and ${p.Ts} °C ✓`));
      } else {
        st.push(H(3, Tx(`${nf(p.Tstar)} °C'ye ulaşma süresi`, `Time to reach ${nf(p.Tstar)} °C`)) + '\n' +
          `${p.Ts} + ${par(p.D0)}·e^(−${nf(kp, 4)}t) = ${nf(p.Tstar)}\n` +
          `e^(−${nf(kp, 4)}t) = ${nf(p.Dstar)}/${par(p.D0)} = ${nf(p.f[0] / p.f[1], 4)}\n` +
          `−${nf(kp, 4)}t = ln ${nf(p.f[0] / p.f[1], 4)} = ${ln(p.f[0] / p.f[1])}\n` +
          `t = ${ln(p.f[1] / p.f[0])}/${nf(kp, 4)} ≈ ${nf(p.tq)} ${tu}`);
        st.push(H(4, Tx('Kontrol ve yorum', 'Check and interpretation')) + '\n' +
          `T(${nf(p.tq)}) = ${p.Ts} + ${par(p.D0)}·e^(${nf(k * p.tq, 4)}) = ${nf(p.Ts + p.D0 * Math.exp(k * p.tq))} °C ✓\n` +
          Tx(`Tₛ = ${p.Ts} °C asimptot olduğundan sıcaklık ${p.Ts} °C'ye hiçbir zaman tam olarak ulaşmaz; ${nf(p.Tstar)} °C ise ona ${nf(Math.abs(p.Dstar))} °C kadar yakındır, bu yüzden sonlu bir süre bulduk.`,
            `Since Tₛ = ${p.Ts} °C is an asymptote the part never reaches ${p.Ts} °C exactly; ${nf(p.Tstar)} °C is ${nf(Math.abs(p.Dstar))} °C away from it, so a finite time exists.`));
      }
    } else {
      const c = Tx('₺', '$'), r = p.k, n = p.n;
      const Ac = p.y0 * Math.exp(r * p.years), An = p.y0 * Math.pow(1 + r / n, n * p.years);
      st.push(H(1, Tx('Sürekli bileşik: dA/dt = rA', 'Continuous compounding: dA/dt = rA')) + '\n' +
        Tx('Para her an faiz getiriyorsa değişim hızı miktarla orantılıdır: dA/dt = r·A ⇒ A(t) = P·e^(rt).', 'If interest is added at every instant, the rate is proportional to the amount: dA/dt = r·A ⇒ A(t) = P·e^(rt).') + '\n' +
        Tx(`P = ${nf(p.y0)} ${c}, r = ${p.rate}/100 = ${nf(r, 2)}, t = ${p.years} yıl.`, `P = ${nf(p.y0)} ${c}, r = ${p.rate}/100 = ${nf(r, 2)}, t = ${p.years} years.`));
      st.push(H(2, Tx('Sürekli bileşik tutar', 'Continuous amount')) + '\n' +
        `A = ${nf(p.y0)}·e^(${nf(r, 2)}·${p.years}) = ${nf(p.y0)}·e^(${nf(r * p.years, 2)}) = ${nf(p.y0)}·${nf(Math.exp(r * p.years), 4)} ≈ ${nf(Ac)} ${c}`);
      st.push(H(3, Tx(`Yılda ${n} kez bileşik`, `Compounded ${n} times a year`)) + '\n' +
        `A = P(1 + r/n)^(nt) = ${nf(p.y0)}·(1 + ${nf(r, 2)}/${n})^(${n}·${p.years})\n` +
        `= ${nf(p.y0)}·(${nf(1 + r / n, 6)})^${n * p.years} = ${nf(p.y0)}·${nf(Math.pow(1 + r / n, n * p.years), 4)} ≈ ${nf(An)} ${c}`);
      st.push(H(4, Tx('Fark ve iki katına çıkma süresi', 'Difference and doubling time')) + '\n' +
        Tx(`Fark = ${nf(Ac)} − ${nf(An)} = ${nf(Ac - An)} ${c}. n büyüdükçe (1 + r/n)^n → e^r olduğundan sürekli bileşik, en büyük sınır değerdir.`,
          `Difference = ${nf(Ac)} − ${nf(An)} = ${nf(Ac - An)} ${c}. As n grows (1 + r/n)^n → e^r, so continuous compounding is the upper limit.`) + '\n' +
        `e^(rt) = 2 ⇒ t = ln 2/r = ${ln(2)}/${nf(r, 2)} ≈ ${nf(Math.LN2 / r)} ${Tx('yıl', 'years')}`);
      st.push(H(5, Tx('Kontrol', 'Check')) + '\n' +
        Tx(`Sürekli ve periyodik tutarlar birbirine çok yakın, sürekli olan biraz büyük ✓. Grafikte yeşil eğri sürekli (e^(rt)), mor eğri yılda ${n} kez bileşik tutarı gösterir; ikisi arasındaki makas zamanla açılır.`,
          `The continuous and periodic amounts are very close, the continuous one slightly larger ✓. On the graph the green curve is continuous (e^(rt)), the purple one is compounding ${n} times a year; the gap widens with time.`));
    }
    return st;
  }

  // ---------- concept ----------
  function concept() {
    return Tx(
`ÜSTEL BÜYÜME VE SÖNME

TANIM
Bir niceliğin değişim hızı kendisiyle orantılıysa
  dy/dt = k·y
denir. Değişkenlerine ayıralım: dy/y = k dt ⇒ ln|y| = kt + C ⇒
  y(t) = y₀·e^(kt),   y₀ = y(0).
• k > 0: üstel büyüme (nüfus, bakteri, sürekli bileşik faiz)
• k < 0: üstel sönme (radyoaktif bozunma, ilacın vücuttan atılması)

TEMEL FORMÜLLER
• İki katına çıkma süresi: t_d = ln 2 / k
• Yarı ömür: t_½ = ln 2 / |k|
• Sürekli bileşik faiz: A = P·e^(rt)
• Yılda n kez bileşik: A = P(1 + r/n)^(nt) → n → ∞ iken P·e^(rt)
• Newton'un soğuma yasası: T′ = −k(T − Tₛ) ⇒ T(t) = Tₛ + (T₀ − Tₛ)·e^(−kt)
  (Tₛ ortam sıcaklığıdır; sıcaklık bu değere yaklaşır, yatay asimptot)

NE ANLAMA GELİR?
y büyüdükçe artış hızı da büyür; bu yüzden eğri gittikçe dikleşir. Sönmede ise eğri azalarak t eksenine yaklaşır ama ona hiç değmez. Her t_d (ya da t_½) süresinde miktar sabit bir çarpanla (2 veya ½) çarpılır.

YÖNTEM
1) Modeli yazalım: y = y₀·e^(kt) (soğumada T = Tₛ + (T₀ − Tₛ)e^(−kt)).
2) Verilen iki bilgiden k bulunur: örneğin y(t₁) = y₁ ⇒ k = ln(y₁/y₀)/t₁. (Yarı ömür ya da iki katına çıkma süresi verilmişse k = ±ln 2/süre.)
3) İstenen değer yerine konur: y(t) hesaplanır ya da y(t) = hedef denklemi ln ile çözülür: t = ln(hedef/y₀)/k.
4) Birimleri yazalım ve sonucu mantıksal olarak kontrol edelim.

DİKKAT EDİLECEK NOKTALAR
• k'nın birimi 1/zaman'dır; t ile aynı zaman birimi kullanılmalıdır.
• Soğumada üstel kısım T değil, fark (T − Tₛ) üzerindedir.
• Doğrusal değil üstel: iki katına çıkma süresi sabit, her adımda eklenen miktar sabit değildir.
• %5 faiz için r = 0,05 yazılır.

MİNİ ÖRNEK
Bakteri sayısı 3 saatte 100'den 800'e çıkıyor. e^(3k) = 8 ⇒ k = ln 8/3 = ln 2 ≈ 0,693 saat⁻¹ ⇒ iki katına çıkma süresi ln 2/k = 1 saat.

AKILDA KALSIN
"Hız ∝ miktar" ⇒ e^(kt). Yarı ömür ve iki katına çıkma süresi hep ln 2 / |k| ile bulunur.

MÜHENDİSLİKTE
Radyoaktif bozunma ve ilaç/kimyasal derişimi, sönümlü titreşim genliği, ısıl işlemde parça sıcaklığı (fren diski, motor bloğu, kaynaklı parça) ve ekonomik hesaplarda kullanılır.`,
`EXPONENTIAL GROWTH AND DECAY

DEFINITION
A quantity whose rate of change is proportional to itself satisfies
  dy/dt = k·y.
Separate the variables: dy/y = k dt ⇒ ln|y| = kt + C ⇒
  y(t) = y₀·e^(kt),   y₀ = y(0).
• k > 0: exponential growth (population, bacteria, continuous compound interest)
• k < 0: exponential decay (radioactive decay, a drug leaving the body)

KEY FORMULAS
• Doubling time: t_d = ln 2 / k
• Half-life: t_½ = ln 2 / |k|
• Continuous compound interest: A = P·e^(rt)
• n times a year: A = P(1 + r/n)^(nt) → P·e^(rt) as n → ∞
• Newton's law of cooling: T′ = −k(T − Tₛ) ⇒ T(t) = Tₛ + (T₀ − Tₛ)·e^(−kt)
  (Tₛ is the surrounding temperature; T approaches it — a horizontal asymptote)

WHAT DOES IT MEAN?
As y gets bigger its growth rate gets bigger, so the curve keeps steepening. In decay the curve falls toward the t-axis but never touches it. Every t_d (or t_½) the amount is multiplied by a fixed factor (2 or ½).

METHOD
1) Write the model: y = y₀·e^(kt) (cooling: T = Tₛ + (T₀ − Tₛ)e^(−kt)).
2) Use the given information to find k: e.g. y(t₁) = y₁ ⇒ k = ln(y₁/y₀)/t₁. (If a half-life or doubling time is given, k = ±ln 2/time.)
3) Substitute to get y(t), or solve y(t) = target with ln: t = ln(target/y₀)/k.
4) Attach units and check that the result is sensible.

PITFALLS
• The unit of k is 1/time; use the same time unit as t.
• In cooling the exponential acts on the difference (T − Tₛ), not on T.
• Exponential is not linear: the doubling time is constant, the added amount per step is not.
• For 5% interest write r = 0.05.

MINI EXAMPLE
Bacteria grow from 100 to 800 in 3 hours. e^(3k) = 8 ⇒ k = ln 8/3 = ln 2 ≈ 0.693 h⁻¹ ⇒ doubling time ln 2/k = 1 hour.

MEMORY AID
"Rate ∝ amount" ⇒ e^(kt). Half-life and doubling time are always ln 2 / |k|.

IN ENGINEERING
Used in radioactive decay and drug/chemical concentration, damped-vibration amplitude, part temperature during heat treatment (brake disc, engine block, welded part) and in economics.`);
  }

  // ---------- drawing ----------
  function draw(canvas, p) {
    try {
      const y = sym(p), u = U(p);
      const xm = p.tMax * 1.05, ym = extent(p) * 1.12;
      canvas.setViewport(-xm, xm, -ym, ym);
      const win = (f) => (t) => (t < -1e-9 || t > p.tMax + 1e-9 ? NaN : f(t));
      const base = (t) => curveAt(p, p.k, p.y0, p.Ts, t);
      const live = (t) => curveAt(p, p.vk, p.vy0, p.vTs, t);
      const changed = !near(p.vk, p.k) || !near(p.vy0, p.y0) || !near(p.vTs, p.Ts);
      canvas.addFunction({ evaluator: win(base), color: canvas.accent(), thickness: 3, label: `${y}(t)` });
      if (p.kind === 'compound') {
        canvas.addFunction({ evaluator: win((t) => p.y0 * Math.pow(1 + p.k / p.n, p.n * t)), color: canvas.purple(), thickness: 2.5, label: Tx(`yılda ${p.n} kez`, `${p.n}× a year`) });
      }
      if (changed) canvas.addFunction({ evaluator: win(live), color: canvas.orange(), thickness: 2.5, dashed: true, label: Tx('deneme eğrisi', 'trial curve') });
      if (isCool(p.kind)) {
        canvas.addGuideLine({ axis: 'horizontal', position: p.vTs, color: canvas.gray(), label: `Tₛ = ${nf(p.vTs)}` });
      }
      // data points
      p.data.forEach((d, i) => {
        if (d.t > p.tMax || d.t < 0) return;
        const hl = (p.kind === 'halfRemain' || p.kind === 'halfTime' || p.kind === 'popDouble' || p.kind === 'popTime') && d.t > 0;
        const lbl = hl ? Tx(p.kind === 'halfRemain' || p.kind === 'halfTime' ? 'yarı ömür' : 'iki katına çıkma', p.kind === 'halfRemain' || p.kind === 'halfTime' ? 'half-life' : 'doubling') + ` (${nf(d.t)}; ${nf(d.y)})` : `(${nf(d.t)}; ${nf(d.y)})`;
        canvas.addMarker({ x: d.t, y: d.y, color: hl ? canvas.orange() : canvas.gold(), radius: 5, hollow: hl, label: lbl });
      });
      // marked prediction
      if (p.yq !== undefined) {
        canvas.addSegment({ x1: 0, y1: p.yq, x2: p.tq, y2: p.yq, color: canvas.green(), thickness: 1.5, dashed: true });
        canvas.addSegment({ x1: p.tq, y1: 0, x2: p.tq, y2: p.yq, color: canvas.green(), thickness: 1.5, dashed: true });
        canvas.addMarker({ x: p.tq, y: p.yq, color: canvas.green(), shape: 'square', radius: 6, label: `(${nf(p.tq)}; ${nf(p.yq)})` });
      }
      // live time marker
      const tm = Math.max(0, Math.min(p.tMax, p.vt));
      const yv = live(tm), rate = p.vk * (yv - p.vTs);
      canvas.addGuideLine({ axis: 'vertical', position: tm, color: canvas.gold(), label: `t = ${nf(tm)}` });
      canvas.addMarker({ x: tm, y: yv, color: canvas.gold(), radius: 7, label: `${y} = ${nf(yv)} ${u}, ${y}′ = ${nf(rate)}` });
    } catch (e) {
      canvas.setViewport(-5, 5, -5, 5);
    }
  }

  // ---------- controls ----------
  function supLabel(m) { return m === 0 ? '' : '×10' + supS(-m) + ' '; }
  function buildControls(rightCol, getProblem, h) {
    const kOpts = {
      caption: '', min: 0, max: 1, step: 0.01,
      get: () => {
        const p = getProblem();
        kOpts.min = p.rng.k[0]; kOpts.max = p.rng.k[1]; kOpts.step = p.rng.k[2];
        if (regK && regK.input) { regK.min = kOpts.min; regK.max = kOpts.max; setCap(regK, Tx(`k deneme değeri (${supLabel(p.km)}1/zaman)`, `trial k (${supLabel(p.km)}1/time)`)); }
        return p.vk * p.ks;
      },
      set: (v) => { const p = getProblem(); p.vk = v / p.ks; },
    };
    function setCap(reg, text) {
      const cap = reg.input && reg.input.parentElement && reg.input.parentElement.firstChild;
      if (cap && typeof cap === 'object') cap.textContent = text;
    }
    let regK = null, regY = null, regTs = null, regT = null;
    kOpts.caption = Tx('k deneme değeri', 'trial k');
    regK = h.addSlider(kOpts);
    const yOpts = {
      caption: Tx('Başlangıç değeri y₀', 'Starting value y₀'), min: 0, max: 1, step: 1,
      get: () => {
        const p = getProblem();
        yOpts.min = p.rng.y0[0]; yOpts.max = p.rng.y0[1]; yOpts.step = p.rng.y0[2];
        if (regY && regY.input) { regY.min = yOpts.min; regY.max = yOpts.max; setCap(regY, isCool(p.kind) ? Tx('Başlangıç sıcaklığı T₀ (°C)', 'Initial temperature T₀ (°C)') : Tx('Başlangıç değeri y₀', 'Starting value y₀')); }
        return p.vy0;
      },
      set: (v) => { getProblem().vy0 = v; },
    };
    regY = h.addSlider(yOpts);
    const sOpts = {
      caption: Tx('Ortam sıcaklığı Tₛ (°C)', 'Surrounding temperature Tₛ (°C)'), min: 0, max: 1, step: 1,
      get: () => {
        const p = getProblem();
        if (p.rng.Ts) { sOpts.min = p.rng.Ts[0]; sOpts.max = p.rng.Ts[1]; sOpts.step = p.rng.Ts[2]; } else { sOpts.min = 0; sOpts.max = 1; sOpts.step = 1; }
        if (regTs && regTs.input) {
          regTs.min = sOpts.min; regTs.max = sOpts.max;
          if (regTs.input.parentElement && regTs.input.parentElement.style) regTs.input.parentElement.style.display = isCool(p.kind) ? '' : 'none';
        }
        return p.vTs;
      },
      set: (v) => { const p = getProblem(); if (isCool(p.kind)) p.vTs = v; },
    };
    regTs = h.addSlider(sOpts);
    if (regTs && regTs.input && regTs.input.parentElement && regTs.input.parentElement.style) regTs.input.parentElement.style.display = isCool(getProblem().kind) ? '' : 'none';
    const tOpts = {
      caption: Tx('Zaman t (işaretli nokta)', 'Time t (marked point)'), min: 0, max: 1, step: 0.1,
      get: () => {
        const p = getProblem();
        tOpts.max = p.tMax; tOpts.step = p.tstep;
        if (regT && regT.input) { regT.max = p.tMax; regT.min = 0; }
        return p.vt;
      },
      set: (v) => { const p = getProblem(); p.vt = Math.max(0, Math.min(p.tMax, v)); },
    };
    regT = h.addSlider(tOpts);
  }

  Topics.register('derivatives', {
    id: 'growthDecay',
    tabTitle: () => Tx('Üstel Büyüme ve Sönme', 'Exponential Growth and Decay'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^• k > 0:/, make: (rng) => gen(rng, rng.pick(['data', 'popDouble', 'popTime']), { grow: true }) },
      { match: /^• k < 0:/, make: (rng) => gen(rng, rng.pick(['data', 'halfRemain']), { grow: false }) },
      { match: /^• (İki katına çıkma süresi|Doubling time):/, make: (rng) => gen(rng, rng.pick(['popDouble', 'popTime'])) },
      { match: /^• (Yarı ömür|Half-life):/, make: (rng) => gen(rng, rng.pick(['halfRemain', 'halfTime'])) },
      { match: /^• (Sürekli bileşik faiz|Continuous compound interest):/, make: (rng) => gen(rng, 'compound') },
      { match: /^• (Yılda n kez bileşik|n times a year):/, make: (rng) => gen(rng, 'compound') },
      { match: /^• (Newton'un soğuma yasası|Newton's law of cooling):/, make: (rng) => gen(rng, rng.pick(['cool', 'coolTime'])) },
    ],
  });
})();
