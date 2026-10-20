// Related Rates (chapter 'applications'). Port of Modules/Applications/RelatedRatesControl.vb (expanding circle + sliding ladder),
// extended with the classic textbook families: ladder (both ways), circle (area / circumference / reverse), sphere (volume /
// surface / reverse), conical tank (filling / draining), cylinder (filling / changing radius AND height), lamp-post shadow
// (length / tip), two cars on perpendicular roads, rectangle (area / diagonal).
// problem = { kind, ask?, ...data, u (0..100: position of the slider through the allowed states), ghost }
// Every scenario is built from a clean numeric instant (Pythagorean triples, simple ratios) so that the stated rate is exact.
// spec(p) returns { texts..., Q(t) (the wanted quantity as a function of time, used for a numeric check), ansVal, lo/hi/star, rate(s), geo(s) }.
// The slider moves the SYSTEM through its states (foot distance, radius, water depth, elapsed time...). The gold/gray ghost keeps the
// instant of the question visible; the readout on the picture shows the rate at the slider state.
(function () {
  const Tx = (tr, en) => I18N.tx(tr, en);

  // ---------- small helpers ----------
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
  const frS = (x) => (x.d === 1 ? S(x.n) : S(x.n) + '/' + x.d);
  // up to 3 decimals, never "-0"
  function dc(v) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0' || s === '') s = '0';
    return M(s);
  }
  // exact fraction + decimal:  "3/4 = 0.75" or "8/3 ≈ 2.667"
  function fracDec(f) {
    if (f.d === 1) return S(f.n);
    const v = f.n / f.d, r = Math.round(v * 1000) / 1000;
    return frS(f) + (Math.abs(v - r) < 1e-12 ? ' = ' : ' ≈ ') + dc(v);
  }
  // raw unreduced fraction text, then the reduced form (raw is dropped when identical)
  function rawEq(n, d, f) { const raw = S(n) + '/' + d; return (raw === frS(f) ? '' : raw + ' = ') + fracDec(f); }
  // n/d * pi^k  (k in -1, 0, 1) -> { s: exact text, v: value }
  function coefPi(n, d, k) {
    const f = fr(n, d);
    const a = Math.abs(f.n), neg = f.n < 0 ? '−' : '';
    let s;
    if (k === 0) s = frS(f);
    else if (k === 1) {
      const num = a === 1 ? 'π' : a + 'π';
      s = f.n === 0 ? '0' : neg + (f.d === 1 ? num : num + '/' + f.d);
    } else {
      s = f.n === 0 ? '0' : neg + (f.d === 1 ? a + '/π' : a + '/(' + f.d + 'π)');
    }
    return { s, v: (f.n / f.d) * Math.pow(Math.PI, k) };
  }
  const PI = Math.PI;
  const sq = (x) => x * x;
  const sgnW = (n) => (n < 0 ? '−' + Math.abs(n) : '+' + n); // +3 / −3

  function aspect(canvas) {
    const el = canvas && canvas.canvas;
    if (el && el.clientWidth > 50 && el.clientHeight > 50) return el.clientWidth / el.clientHeight;
    return 1.5;
  }
  function Hdr(n, tr, en) { return Tx('── ' + n + ') ' + tr + ' ──', '── ' + n + ') ' + en + ' ──'); }

  // time window [lo, hi] (hours/seconds...) in which every moving quantity pos + vel*t stays >= 25 % of its starting value
  function timeRange(items) {
    let cap = 0;
    items.forEach((it) => { cap = Math.max(cap, it.pos / Math.abs(it.vel)); });
    cap *= 0.9;
    let lo = -cap, hi = cap;
    items.forEach((it) => {
      if (it.vel > 0) lo = Math.max(lo, -0.75 * it.pos / it.vel);
      else hi = Math.min(hi, 0.75 * it.pos / Math.abs(it.vel));
    });
    return { lo, hi };
  }

  // ---------- kinds ----------
  let forcedKind = 'random';
  const KINDS = ['ladder', 'ladderRev', 'circleA', 'circleC', 'circleRev', 'sphereV', 'sphereS', 'sphereRev', 'coneFill', 'coneDrain', 'cylFill', 'cylBoth', 'shadowLen', 'shadowTip', 'cars', 'rectA', 'rectD'];
  function kindLabel(k) {
    switch (k) {
      case 'ladder': return Tx('Kayan merdiven: üst uç ne hızla iniyor?', 'Sliding ladder: how fast does the top fall?');
      case 'ladderRev': return Tx('Kayan merdiven: ayak ne hızla uzaklaşıyor?', 'Sliding ladder: how fast does the foot move out?');
      case 'circleA': return Tx('Genişleyen daire: alan hızı', 'Expanding circle: area rate');
      case 'circleC': return Tx('Genişleyen daire: çevre hızı', 'Expanding circle: circumference rate');
      case 'circleRev': return Tx('Yayılan leke: alan hızı verilmiş, yarıçap hızı?', 'Spreading slick: area rate given, radius rate?');
      case 'sphereV': return Tx('Küre: hacim hızı', 'Sphere: volume rate');
      case 'sphereS': return Tx('Küre: yüzey alanı hızı', 'Sphere: surface-area rate');
      case 'sphereRev': return Tx('Şişen balon: hacim hızı verilmiş, yarıçap hızı?', 'Inflating balloon: volume rate given, radius rate?');
      case 'coneFill': return Tx('Koni depo dolarken seviye hızı', 'Conical tank filling: level rate');
      case 'coneDrain': return Tx('Koni depo boşalırken seviye hızı', 'Conical tank draining: level rate');
      case 'cylFill': return Tx('Silindirik depo: seviye hızı', 'Cylindrical tank: level rate');
      case 'cylBoth': return Tx('Silindir: yarıçap ve yükseklik birlikte değişiyor', 'Cylinder: radius and height both change');
      case 'shadowLen': return Tx('Lamba ve gölge: gölge uzunluğu hızı', 'Lamp and shadow: shadow-length rate');
      case 'shadowTip': return Tx('Lamba ve gölge: gölge ucunun hızı', 'Lamp and shadow: shadow-tip speed');
      case 'cars': return Tx('İki araç: aralarındaki uzaklık', 'Two cars: distance between them');
      case 'rectA': return Tx('Dikdörtgen: alan hızı', 'Rectangle: area rate');
      case 'rectD': return Tx('Dikdörtgen: köşegen hızı', 'Rectangle: diagonal rate');
      default: return Tx('Rastgele', 'Random');
    }
  }

  const TRIPLES = [[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13], [8, 15, 17], [12, 16, 20], [7, 24, 25], [10, 24, 26]];
  const LADDER_TRIPLES = [[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13], [8, 15, 17], [12, 16, 20]];
  const CONES = [[3, 6], [4, 8], [5, 10], [2, 6], [3, 9], [3, 4], [6, 8], [2, 4], [6, 12]]; // [R, H]
  const LAMPS = [[6, 2], [8, 2], [9, 3], [12, 4], [10, 2], [15, 5], [12, 3], [8, 5]];      // [lamp, person]

  function createProblem(rng, kindArg) {
    const kind = kindArg || (forcedKind === 'random' ? rng.pick(KINDS) : forcedKind);
    const p = { kind, u: 50, ghost: true };
    switch (kind) {
      case 'ladder': case 'ladderRev': {
        const t = rng.pick(LADDER_TRIPLES), foot = rng.nextInt(0, 2) === 0;
        p.L = t[2]; p.x = foot ? t[0] : t[1]; p.y = foot ? t[1] : t[0];
        p.vn = rng.pick([1, 2, 3, 1, 3, 5]); p.vd = p.vn === 5 || p.vn === 3 && rng.nextInt(0, 2) === 0 ? 2 : 1;
        break;
      }
      case 'circleA': case 'circleC': p.r = rng.nextInt(2, 11); p.v = rng.pick([1, 2, 3, 4]); break;
      case 'circleRev': p.r = rng.nextInt(2, 9); p.c = rng.pick([8, 10, 12, 16, 20, 30]); break;
      case 'sphereV': case 'sphereS': p.r = rng.nextInt(2, 9); p.v = rng.pick([1, 2, 3]); break;
      case 'sphereRev': p.r = rng.pick([2, 3, 4, 5, 6, 10]); p.c = rng.pick([20, 40, 50, 100, 200]); break;
      case 'coneFill': case 'coneDrain': {
        const t = rng.pick(CONES); p.R = t[0]; p.H = t[1];
        p.h = rng.nextInt(1, p.H); p.c = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
        break;
      }
      case 'cylFill': p.r = rng.pick([1, 2, 3, 4, 5]); p.h = rng.nextInt(2, 7); p.Ht = p.h + rng.nextInt(2, 5); p.c = rng.pick([2, 3, 5, 6, 8, 10, 12]); break;
      case 'cylBoth': {
        for (;;) {
          p.r = rng.nextInt(2, 9); p.h = rng.nextInt(3, 13); p.a = rng.nextInt(1, 4); p.b = rng.nextInt(1, 4);
          if (2 * p.r * p.h * p.a - sq(p.r) * p.b !== 0) break;
        }
        break;
      }
      case 'shadowLen': case 'shadowTip': {
        const t = rng.pick(LAMPS); p.H = t[0]; p.h = t[1]; p.d = rng.nextInt(3, 9);
        p.vn = rng.pick([1, 2, 3, 4, 3, 5]); p.vd = p.vn === 3 || p.vn === 5 ? 2 : 1;
        break;
      }
      case 'cars': {
        for (;;) {
          const t = rng.pick(TRIPLES), sw = rng.nextInt(0, 2) === 0;
          p.a = sw ? t[0] : t[1]; p.b = sw ? t[1] : t[0]; p.D = t[2];
          p.sa = rng.pick([1, -1]); p.sb = rng.pick([1, -1]);
          p.va = rng.pick([20, 30, 40, 50, 60]); p.vb = rng.pick([20, 30, 40, 50, 60]);
          if (p.a * p.sa * p.va + p.b * p.sb * p.vb !== 0) break;
        }
        break;
      }
      default: { // rectA, rectD
        for (;;) {
          const t = rng.pick(TRIPLES), sw = rng.nextInt(0, 2) === 0;
          p.l = sw ? t[0] : t[1]; p.w = sw ? t[1] : t[0]; p.D = t[2];
          p.ld = rng.nonZeroInt(-3, 3); p.wd = rng.nonZeroInt(-3, 3);
          const val = kind === 'rectA' ? p.ld * p.w + p.l * p.wd : p.l * p.ld + p.w * p.wd;
          if (val !== 0) break;
        }
      }
    }
    const o = spec(p);
    p.u = Math.max(0, Math.min(100, Math.round(100 * (o.star - o.lo) / (o.hi - o.lo))));
    return p;
  }

  // ---------- the scenarios ----------
  function spec(p) {
    const o = { unit: '', name: '', ansVal: 0, lo: 0, hi: 1, star: 0.5 };
    switch (p.kind) {
      // ---------------------------------------------------------------- sliding ladder, top speed wanted
      case 'ladder': {
        const L = p.L, x = p.x, y = p.y, v = fr(p.vn, p.vd), vS = dc(p.vn / p.vd);
        const ans = fr(-x * p.vn, y * p.vd);
        o.unit = 'm/s'; o.name = 'dy/dt'; o.ansVal = ans.n / ans.d;
        o.Q = (t) => Math.sqrt(sq(L) - sq(x + (p.vn / p.vd) * t));
        o.lo = 0.12 * L; o.hi = Math.max(0.96 * L, x * 1.02); o.star = x;
        o.rate = (s) => -(s / Math.sqrt(sq(L) - sq(s))) * (p.vn / p.vd);
        o.geo = (s) => ladderGeo(L, s, o.rate(s), 'dy/dt');
        o.stmt = Tx(`${L} m uzunluğunda bir merdiven düşey bir duvara dayalıdır. Merdivenin alt ucu (ayağı) duvardan ${vS} m/s hızla uzaklaştırılıyor. Ayağın duvara uzaklığı ${x} m olduğu anda merdivenin duvardaki (üst) ucu ne hızla kayıyor?`,
          `A ${L} m ladder leans against a vertical wall. Its foot is pulled away from the wall at ${vS} m/s. At the instant the foot is ${x} m from the wall, how fast is the top of the ladder sliding along the wall?`);
        o.vars = Tx(`x(t) = ayağın duvara uzaklığı (m), y(t) = üst ucun yerden yüksekliği (m), L = ${L} m SABİT (merdiven boyu değişmez). x ve y zamanla (t, saniye) değişir.`,
          `x(t) = distance of the foot from the wall (m), y(t) = height of the top above the ground (m), L = ${L} m is CONSTANT (the ladder does not change length). x and y change with time (t in seconds).`);
        o.known = Tx(`x = ${x} m, dx/dt = +${vS} m/s (artıyor: ayak uzaklaşıyor).\nÜst ucun yüksekliği bu anda: y = √(L² − x²) = √(${sq(L)} − ${sq(x)}) = √${sq(y)} = ${y} m.\nİstenen: dy/dt = ?`,
          `x = ${x} m, dx/dt = +${vS} m/s (increasing: the foot moves away).\nHeight of the top at this instant: y = √(L² − x²) = √(${sq(L)} − ${sq(x)}) = √${sq(y)} = ${y} m.\nWanted: dy/dt = ?`);
        o.rel = Tx(`Pisagor: x² + y² = L² = ${sq(L)}.`, `Pythagoras: x² + y² = L² = ${sq(L)}.`);
        o.diff = Tx(`ZİNCİR KURALI (x ve y, t'nin fonksiyonu): 2x·(dx/dt) + 2y·(dy/dt) = 0   (L sabit olduğundan sağ taraf 0).\nDüzenle: dy/dt = −(x/y)·(dx/dt).\nUYARI: x = ${x} ve y = ${y} sayılarını türevden ÖNCE yerleştirmeyin: x ve y değişir, sabitlenirse türev yanlış çıkar.`,
          `CHAIN RULE (x and y are functions of t): 2x·(dx/dt) + 2y·(dy/dt) = 0   (the right side is 0 because L is constant).\nRearrange: dy/dt = −(x/y)·(dx/dt).\nWARNING: do NOT put x = ${x} and y = ${y} in before differentiating: x and y change; freezing them gives a wrong derivative.`);
        o.subs = Tx(`ŞİMDİ anlık değerleri koy: dy/dt = −(${x}/${y})·${vS} = ${fracDec(ans)} m/s.`,
          `Now insert the instantaneous values: dy/dt = −(${x}/${y})·${vS} = ${fracDec(ans)} m/s.`);
        o.ans = Tx(`dy/dt = ${fracDec(ans)} m/s.`, `dy/dt = ${fracDec(ans)} m/s.`);
        o.interp = Tx(`Eksi işaret: y AZALIYOR, yani üst uç duvardan AŞAĞI ${dc(-o.ansVal)} m/s hızla kayıyor. Ayak sabit hızla gitse de |dy/dt| = (x/y)·${vS} büyür; x → L iken y → 0 ve hız sonsuza gider (kaydırıcıyı sağa çekerek görün).`,
          `The minus sign: y is DECREASING, so the top slides DOWN the wall at ${dc(-o.ansVal)} m/s. Although the foot moves at a constant speed, |dy/dt| = (x/y)·${vS} keeps growing; as x → L, y → 0 and the speed blows up (drag the slider right to see it).`);
        o.what = Tx('x ve y bir bağıntıyla bağlı: kısa bir süre sonra x büyüdüğünde y mutlaka küçülür. Soru, bu bağıntının zaman türevinden dy/dt\'yi bulmak.', 'x and y are tied by one relation: when x grows a little y must shrink. The task is to get dy/dt from the time derivative of that relation.');
        break;
      }
      // ---------------------------------------------------------------- sliding ladder, foot speed wanted
      case 'ladderRev': {
        const L = p.L, x = p.x, y = p.y, u = p.vn / p.vd, uS = dc(u);
        const ans = fr(y * p.vn, x * p.vd);
        o.unit = 'm/s'; o.name = 'dx/dt'; o.ansVal = ans.n / ans.d;
        o.Q = (t) => Math.sqrt(sq(L) - sq(y - u * t));
        o.lo = 0.12 * L; o.hi = Math.max(0.96 * L, x * 1.02); o.star = x;
        o.rate = (s) => (Math.sqrt(sq(L) - sq(s)) / s) * u;
        o.geo = (s) => ladderGeo(L, s, o.rate(s), 'dx/dt');
        o.stmt = Tx(`${L} m uzunluğundaki bir merdiven düşey bir duvara dayalıdır ve üst ucu duvar boyunca AŞAĞI doğru ${uS} m/s hızla kayıyor. Üst uç yerden ${y} m yüksekteyken merdivenin alt ucu (ayağı) duvardan ne hızla uzaklaşıyor?`,
          `A ${L} m ladder leans against a vertical wall and its top slides DOWN the wall at ${uS} m/s. When the top is ${y} m above the ground, how fast is the foot of the ladder moving away from the wall?`);
        o.vars = Tx(`x(t) = ayağın duvara uzaklığı (m), y(t) = üst ucun yüksekliği (m), L = ${L} m SABİT.`, `x(t) = distance of the foot from the wall (m), y(t) = height of the top (m), L = ${L} m is CONSTANT.`);
        o.known = Tx(`y = ${y} m, dy/dt = −${uS} m/s (AZALIYOR: aşağı iniyor, bu yüzden eksi!).\nAyağın uzaklığı bu anda: x = √(L² − y²) = √(${sq(L)} − ${sq(y)}) = ${x} m.\nİstenen: dx/dt = ?`,
          `y = ${y} m, dy/dt = −${uS} m/s (DECREASING: it moves down, hence the minus!).\nDistance of the foot at this instant: x = √(L² − y²) = √(${sq(L)} − ${sq(y)}) = ${x} m.\nWanted: dx/dt = ?`);
        o.rel = Tx(`Pisagor: x² + y² = L² = ${sq(L)}.`, `Pythagoras: x² + y² = L² = ${sq(L)}.`);
        o.diff = Tx(`t'ye göre türet (zincir kuralı): 2x·(dx/dt) + 2y·(dy/dt) = 0.\nDüzenle: dx/dt = −(y/x)·(dy/dt).`, `Differentiate in t (chain rule): 2x·(dx/dt) + 2y·(dy/dt) = 0.\nRearrange: dx/dt = −(y/x)·(dy/dt).`);
        o.subs = Tx(`dx/dt = −(${y}/${x})·(−${uS}) = +${fracDec(ans)} m/s.`, `dx/dt = −(${y}/${x})·(−${uS}) = +${fracDec(ans)} m/s.`);
        o.ans = Tx(`dx/dt = ${fracDec(ans)} m/s.`, `dx/dt = ${fracDec(ans)} m/s.`);
        o.interp = Tx(`Artı işaret: x ARTIYOR, ayak duvardan ${dc(o.ansVal)} m/s hızla uzaklaşıyor. Üst uç aşağı indikçe y küçülür, oran y/x azalır ve ayağın hızı önce ${uS} m/s'den küçük, merdiven yataya yaklaşınca çok büyük olur (kaydırıcıya bakın).`,
          `The plus sign: x is INCREASING, the foot moves away from the wall at ${dc(o.ansVal)} m/s. Its speed is (y/x)·${uS}; it is small while the ladder is steep and becomes very large near the horizontal position (see the slider).`);
        o.what = Tx('Üst ucun hızı verilmiş, ayağın hızı isteniyor: aynı Pisagor bağıntısını bu kez dx/dt için çözeriz. Verilen hızın işaretine dikkat (aşağı = eksi).', 'The top speed is given and the foot speed is wanted: we use the same Pythagoras relation, now solving for dx/dt. Mind the sign of the given rate (down = minus).');
        break;
      }
      // ---------------------------------------------------------------- circle: area / circumference
      case 'circleA': case 'circleC': {
        const r = p.r, v = p.v, area = p.kind === 'circleA';
        const cp = area ? coefPi(2 * r * v, 1, 1) : coefPi(2 * v, 1, 1);
        o.unit = area ? 'cm²/s' : 'cm/s'; o.name = area ? 'dA/dt' : 'dC/dt'; o.ansVal = cp.v;
        o.Q = (t) => (area ? PI * sq(r + v * t) : 2 * PI * (r + v * t));
        o.lo = 0.3 * r; o.hi = 2 * r; o.star = r;
        o.rate = (s) => (area ? 2 * PI * s * v : 2 * PI * v);
        o.geo = (s) => circleGeo(s, area ? PI * s * s : 2 * PI * s, area ? 'A' : 'C', o.rate(s), o.name, o.unit, 'cm', area ? 'cm²' : 'cm');
        o.stmt = area
          ? Tx(`Durgun bir gölete atılan taş dairesel bir dalga oluşturuyor. Dalganın yarıçapı ${r} cm iken yarıçap ${v} cm/s hızla artıyor. Bu anda dalganın çevrelediği ALAN ne hızla artıyor?`,
            `A stone dropped in still water makes a circular ripple. When the radius of the ripple is ${r} cm it is increasing at ${v} cm/s. How fast is the AREA enclosed by the ripple increasing at that moment?`)
          : Tx(`Durgun bir gölete atılan taş dairesel bir dalga oluşturuyor. Dalganın yarıçapı ${r} cm iken yarıçap ${v} cm/s hızla artıyor. Bu anda dalganın ÇEVRESİ ne hızla artıyor?`,
            `A stone dropped in still water makes a circular ripple. When the radius of the ripple is ${r} cm it is increasing at ${v} cm/s. How fast is the CIRCUMFERENCE of the ripple increasing at that moment?`);
        o.vars = Tx(`r(t) = dalganın yarıçapı (cm), ${area ? 'A(t) = daire alanı (cm²)' : 'C(t) = çevre (cm)'}; ikisi de zamanla (t, saniye) değişir.`,
          `r(t) = radius of the ripple (cm), ${area ? 'A(t) = area of the circle (cm²)' : 'C(t) = circumference (cm)'}; both change with time (t in seconds).`);
        o.known = Tx(`r = ${r} cm, dr/dt = +${v} cm/s (artıyor).\nİstenen: ${o.name} = ?`, `r = ${r} cm, dr/dt = +${v} cm/s (increasing).\nWanted: ${o.name} = ?`);
        o.rel = area ? Tx('Daire alanı: A = πr².', 'Area of a circle: A = πr².') : Tx('Çember uzunluğu: C = 2πr.', 'Circumference of a circle: C = 2πr.');
        o.diff = area
          ? Tx(`t'ye göre türet (zincir kuralı: r, t'nin fonksiyonu): dA/dt = 2πr·(dr/dt).\nUYARI: r = ${r} sayısını türevden önce koyarsanız A = ${coefPi(r * r, 1, 1).s} sabit olur ve türev 0 çıkar.`,
            `Differentiate in t (chain rule: r is a function of t): dA/dt = 2πr·(dr/dt).\nWARNING: if you put r = ${r} in before differentiating, A = ${coefPi(r * r, 1, 1).s} becomes a constant and its derivative would be 0.`)
          : Tx('t\'ye göre türet: dC/dt = 2π·(dr/dt). (r bu denklemde görünmez!)', 'Differentiate in t: dC/dt = 2π·(dr/dt). (r does not appear in this equation!)');
        o.subs = area
          ? Tx(`Anlık değerleri koy: dA/dt = 2π·${r}·${v} = ${cp.s} cm²/s.`, `Insert the instantaneous values: dA/dt = 2π·${r}·${v} = ${cp.s} cm²/s.`)
          : Tx(`Anlık değer koy: dC/dt = 2π·${v} = ${cp.s} cm/s.`, `Insert the value: dC/dt = 2π·${v} = ${cp.s} cm/s.`);
        o.ans = Tx(`${o.name} = ${cp.s} ≈ ${dc(cp.v)} ${o.unit}.`, `${o.name} = ${cp.s} ≈ ${dc(cp.v)} ${o.unit}.`);
        o.interp = area
          ? Tx(`Artı işaret: alan ARTIYOR. Yarıçap hızı sabit (${v} cm/s) olsa da alan hızı r ile ORANTILI büyür: yarıçap iki katına çıkınca alan hızı da iki katına çıkar (kaydırıcı).`,
            `The plus sign: the area is INCREASING. Even with a constant radius speed (${v} cm/s) the area rate grows in PROPORTION to r: doubling the radius doubles the area rate (slider).`)
          : Tx(`Çevre hızı r'den BAĞIMSIZDIR: yalnızca dr/dt'ye bağlıdır (kaydırıcıda değeri sabit kalır). Çevre r ile doğrusal, alan ise karesel büyür.`,
            `The circumference rate does NOT depend on r: only on dr/dt (it stays the same on the slider). The circumference grows linearly with r while the area grows quadratically.`);
        o.what = Tx(`r zamanla değişiyor ve ${area ? 'alan' : 'çevre'} r'ye bağlı: bileşke bir fonksiyon. "${area ? 'Alan' : 'Çevre'} ne hızla artıyor?" = ${o.name}; zincir kuralıyla bulunur.`,
          `r changes with time and the ${area ? 'area' : 'circumference'} depends on r: a composite function. "How fast is the ${area ? 'area' : 'circumference'} growing?" = ${o.name}, found by the chain rule.`);
        break;
      }
      // ---------------------------------------------------------------- circle, area rate given
      case 'circleRev': {
        const r = p.r, c = p.c;
        const cp = coefPi(c, 2 * r, -1);
        o.unit = Tx('m/dk', 'm/min'); o.name = 'dr/dt'; o.ansVal = cp.v;
        o.Q = (t) => Math.sqrt((PI * sq(r) + c * t) / PI);
        o.lo = 0.4 * r; o.hi = 2 * r; o.star = r;
        o.rate = (s) => c / (2 * PI * s);
        o.geo = (s) => circleGeo(s, PI * s * s, 'A', o.rate(s), o.name, o.unit, 'm', 'm²');
        o.stmt = Tx(`Denizde dairesel bir yağ lekesinin alanı ${c} m²/dk hızla artıyor. Lekenin yarıçapı ${r} m iken yarıçap ne hızla artıyor?`,
          `The area of a circular oil slick on the sea is increasing at ${c} m²/min. When the radius of the slick is ${r} m, how fast is the radius increasing?`);
        o.vars = Tx('r(t) = leke yarıçapı (m), A(t) = leke alanı (m²), t = dakika.', 'r(t) = radius of the slick (m), A(t) = area of the slick (m²), t = minutes.');
        o.known = Tx(`dA/dt = +${c} m²/dk (artıyor), r = ${r} m.\nİstenen: dr/dt = ?`, `dA/dt = +${c} m²/min (increasing), r = ${r} m.\nWanted: dr/dt = ?`);
        o.rel = Tx('A = πr².', 'A = πr².');
        o.diff = Tx(`t'ye göre türet (zincir kuralı): dA/dt = 2πr·(dr/dt).\nBu kez BİLİNEN dA/dt, BİLİNMEYEN dr/dt: dr/dt = (dA/dt)/(2πr).`, `Differentiate in t (chain rule): dA/dt = 2πr·(dr/dt).\nThis time dA/dt is KNOWN and dr/dt is UNKNOWN: dr/dt = (dA/dt)/(2πr).`);
        o.subs = Tx(`dr/dt = ${c}/(2π·${r}) = ${c}/(${2 * r}π) = ${cp.s} m/dk.`, `dr/dt = ${c}/(2π·${r}) = ${c}/(${2 * r}π) = ${cp.s} m/min.`);
        o.ans = Tx(`dr/dt = ${cp.s} ≈ ${dc(cp.v)} m/dk.`, `dr/dt = ${cp.s} ≈ ${dc(cp.v)} m/min.`);
        o.interp = Tx(`Alan hızı sabit olduğu hâlde yarıçap hızı 1/r ile AZALIR: leke büyüdükçe aynı alan artışı yarıçapı daha az değiştirir (kaydırıcı).`,
          `Although the area rate is constant the radius rate falls like 1/r: the larger the slick, the less the radius has to change to add the same area (slider).`);
        o.what = Tx('Alanın artış hızı verilmiş, yarıçapın artış hızı isteniyor: A = πr² bağıntısını zamana göre türetip bilinmeyen dr/dt\'yi çözeriz.', 'The rate of the area is given and the rate of the radius is wanted: differentiate A = πr² in t and solve for the unknown dr/dt.');
        break;
      }
      // ---------------------------------------------------------------- sphere: volume / surface area
      case 'sphereV': case 'sphereS': {
        const r = p.r, v = p.v, vol = p.kind === 'sphereV';
        const cp = vol ? coefPi(4 * r * r * v, 1, 1) : coefPi(8 * r * v, 1, 1);
        o.unit = vol ? 'cm³/s' : 'cm²/s'; o.name = vol ? 'dV/dt' : 'dS/dt'; o.ansVal = cp.v;
        o.Q = (t) => (vol ? (4 / 3) * PI * Math.pow(r + v * t, 3) : 4 * PI * sq(r + v * t));
        o.lo = 0.3 * r; o.hi = 2 * r; o.star = r;
        o.rate = (s) => (vol ? 4 * PI * s * s * v : 8 * PI * s * v);
        o.geo = (s) => circleGeo(s, vol ? (4 / 3) * PI * s * s * s : 4 * PI * s * s, vol ? 'V' : 'S', o.rate(s), o.name, o.unit, 'cm', vol ? 'cm³' : 'cm²');
        o.stmt = vol
          ? Tx(`Küre biçimli bir balon şişirilirken yarıçapı ${r} cm iken ${v} cm/s hızla artıyor. Bu anda balonun HACMİ ne hızla artıyor?`, `A spherical balloon is being inflated; when its radius is ${r} cm the radius is increasing at ${v} cm/s. How fast is the VOLUME of the balloon increasing at that moment?`)
          : Tx(`Küre biçimli bir balon şişirilirken yarıçapı ${r} cm iken ${v} cm/s hızla artıyor. Bu anda balonun YÜZEY ALANI ne hızla artıyor?`, `A spherical balloon is being inflated; when its radius is ${r} cm the radius is increasing at ${v} cm/s. How fast is the SURFACE AREA of the balloon increasing at that moment?`);
        o.vars = Tx(`r(t) = yarıçap (cm), ${vol ? 'V(t) = hacim (cm³)' : 'S(t) = yüzey alanı (cm²)'}; t = saniye.`, `r(t) = radius (cm), ${vol ? 'V(t) = volume (cm³)' : 'S(t) = surface area (cm²)'}; t = seconds.`);
        o.known = Tx(`r = ${r} cm, dr/dt = +${v} cm/s.\nİstenen: ${o.name} = ?`, `r = ${r} cm, dr/dt = +${v} cm/s.\nWanted: ${o.name} = ?`);
        o.rel = vol ? Tx('Küre hacmi: V = (4/3)πr³.', 'Volume of a sphere: V = (4/3)πr³.') : Tx('Küre yüzey alanı: S = 4πr².', 'Surface area of a sphere: S = 4πr².');
        o.diff = vol
          ? Tx(`t'ye göre türet (zincir kuralı): dV/dt = (4/3)π·3r²·(dr/dt) = 4πr²·(dr/dt).`, `Differentiate in t (chain rule): dV/dt = (4/3)π·3r²·(dr/dt) = 4πr²·(dr/dt).`)
          : Tx(`t'ye göre türet (zincir kuralı): dS/dt = 4π·2r·(dr/dt) = 8πr·(dr/dt).`, `Differentiate in t (chain rule): dS/dt = 4π·2r·(dr/dt) = 8πr·(dr/dt).`);
        o.subs = vol
          ? Tx(`Anlık değerleri koy: dV/dt = 4π·${r}²·${v} = 4π·${r * r}·${v} = ${cp.s} cm³/s.`, `Insert the values: dV/dt = 4π·${r}²·${v} = 4π·${r * r}·${v} = ${cp.s} cm³/s.`)
          : Tx(`Anlık değerleri koy: dS/dt = 8π·${r}·${v} = ${cp.s} cm²/s.`, `Insert the values: dS/dt = 8π·${r}·${v} = ${cp.s} cm²/s.`);
        o.ans = Tx(`${o.name} = ${cp.s} ≈ ${dc(cp.v)} ${o.unit}.`, `${o.name} = ${cp.s} ≈ ${dc(cp.v)} ${o.unit}.`);
        o.interp = vol
          ? Tx(`Hacim hızı r² ile büyür: balon büyüdükçe aynı yarıçap hızı çok daha fazla havanın girmesi anlamına gelir.`, `The volume rate grows like r²: the bigger the balloon, the more air the same radius speed demands.`)
          : Tx(`Yüzey hızı r ile doğrusal büyür; hacim hızı ise r² ile büyür.`, `The surface rate grows linearly with r, the volume rate grows like r².`);
        o.what = Tx(`${vol ? 'Hacim' : 'Yüzey alanı'} yarıçapa, yarıçap da zamana bağlı: bileşke fonksiyon. "Ne hızla artıyor?" = ${o.name} (zincir kuralı).`, `The ${vol ? 'volume' : 'surface area'} depends on the radius, and the radius depends on time: a composite function. "How fast is it increasing?" = ${o.name} (chain rule).`);
        break;
      }
      // ---------------------------------------------------------------- sphere, volume rate given
      case 'sphereRev': {
        const r = p.r, c = p.c;
        const cp = coefPi(c, 4 * r * r, -1);
        o.unit = 'cm/s'; o.name = 'dr/dt'; o.ansVal = cp.v;
        o.Q = (t) => Math.cbrt((3 / (4 * PI)) * ((4 / 3) * PI * Math.pow(r, 3) + c * t));
        o.lo = 0.4 * r; o.hi = 2 * r; o.star = r;
        o.rate = (s) => c / (4 * PI * s * s);
        o.geo = (s) => circleGeo(s, (4 / 3) * PI * s * s * s, 'V', o.rate(s), o.name, o.unit, 'cm', 'cm³');
        o.stmt = Tx(`Küre biçimli bir balona ${c} cm³/s hızla hava pompalanıyor. Balonun yarıçapı ${r} cm iken yarıçap ne hızla artıyor?`, `Air is pumped into a spherical balloon at ${c} cm³/s. When the radius of the balloon is ${r} cm, how fast is the radius increasing?`);
        o.vars = Tx('V(t) = hacim (cm³), r(t) = yarıçap (cm), t = saniye.', 'V(t) = volume (cm³), r(t) = radius (cm), t = seconds.');
        o.known = Tx(`dV/dt = +${c} cm³/s, r = ${r} cm.\nİstenen: dr/dt = ?`, `dV/dt = +${c} cm³/s, r = ${r} cm.\nWanted: dr/dt = ?`);
        o.rel = Tx('V = (4/3)πr³.', 'V = (4/3)πr³.');
        o.diff = Tx(`t'ye göre türet: dV/dt = 4πr²·(dr/dt)  ⇒  dr/dt = (dV/dt)/(4πr²).`, `Differentiate in t: dV/dt = 4πr²·(dr/dt)  ⇒  dr/dt = (dV/dt)/(4πr²).`);
        o.subs = Tx(`dr/dt = ${c}/(4π·${r}²) = ${c}/(${4 * r * r}π) = ${cp.s} cm/s.`, `dr/dt = ${c}/(4π·${r}²) = ${c}/(${4 * r * r}π) = ${cp.s} cm/s.`);
        o.ans = Tx(`dr/dt = ${cp.s} ≈ ${dc(cp.v)} cm/s.`, `dr/dt = ${cp.s} ≈ ${dc(cp.v)} cm/s.`);
        o.interp = Tx(`Hava sabit hızla girse de yarıçap hızı 1/r² ile AZALIR: balon şiştikçe daha yavaş büyür gibi görünür.`, `Even though the air enters at a constant rate, the radius rate falls like 1/r²: the balloon seems to grow more and more slowly.`);
        o.what = Tx('Hacmin artış hızı verilmiş, yarıçapın artış hızı isteniyor: V = (4/3)πr³ bağıntısını zamana göre türetip dr/dt\'yi çözeriz.', 'The volume rate is given and the radius rate is wanted: differentiate V = (4/3)πr³ in t and solve for dr/dt.');
        break;
      }
      // ---------------------------------------------------------------- conical tank, filling / draining
      case 'coneFill': case 'coneDrain': {
        const R = p.R, H = p.H, h = p.h, c = p.c, fill = p.kind === 'coneFill';
        const sgn = fill ? 1 : -1;
        const cp = coefPi(sgn * c * H * H, R * R * h * h, -1);
        const coef = fr(R * R, 3 * H * H); // V = (pi R^2/(3H^2)) h^3
        const coefS = (coef.n === 1 ? '' : coef.n) + 'π' + (coef.d === 1 ? '' : '/' + coef.d);
        const dcoef = fr(R * R, H * H); // V' = (pi R^2/H^2) h^2 h'
        const dcoefS = (dcoef.n === 1 ? '' : dcoef.n) + 'π' + (dcoef.d === 1 ? '' : '/' + dcoef.d);
        o.unit = Tx('m/dk', 'm/min'); o.name = 'dh/dt'; o.ansVal = cp.v;
        o.Q = (t) => Math.cbrt((3 * H * H / (PI * R * R)) * (PI * R * R * Math.pow(h, 3) / (3 * H * H) + sgn * c * t));
        o.lo = Math.min(0.12 * H, 0.8 * h); o.hi = Math.max(0.96 * H, h + 0.04 * H); o.star = h;
        o.rate = (s) => sgn * c * H * H / (PI * R * R * s * s);
        o.geo = (s) => coneGeo(R, H, s, o.rate(s));
        o.stmt = fill
          ? Tx(`Tepesi aşağıda, üst yarıçapı ${R} m ve yüksekliği ${H} m olan koni biçimli bir depoya ${c} m³/dk hızla su dolduruluyor. Su derinliği ${h} m iken su seviyesi ne hızla yükseliyor?`,
            `Water is poured at ${c} m³/min into a conical tank with its apex pointing down, top radius ${R} m and height ${H} m. When the water is ${h} m deep, how fast is the water level rising?`)
          : Tx(`Tepesi aşağıda, üst yarıçapı ${R} m ve yüksekliği ${H} m olan koni biçimli bir depodan ${c} m³/dk hızla su boşaltılıyor. Su derinliği ${h} m iken su seviyesi ne hızla değişiyor?`,
            `Water drains at ${c} m³/min from a conical tank with its apex pointing down, top radius ${R} m and height ${H} m. When the water is ${h} m deep, how fast is the water level changing?`);
        o.vars = Tx(`h(t) = su derinliği (m), r(t) = su yüzeyinin yarıçapı (m), V(t) = suyun hacmi (m³), t = dakika. Depo sabit: R = ${R} m, H = ${H} m.`, `h(t) = depth of the water (m), r(t) = radius of the water surface (m), V(t) = volume of the water (m³), t = minutes. The tank is fixed: R = ${R} m, H = ${H} m.`);
        o.known = Tx(`h = ${h} m, dV/dt = ${fill ? '+' + c + ' m³/dk (su giriyor: artıyor)' : '−' + c + ' m³/dk (su çıkıyor: AZALIYOR, bu yüzden eksi!)'}.\nİstenen: dh/dt = ?`,
          `h = ${h} m, dV/dt = ${fill ? '+' + c + ' m³/min (water enters: increasing)' : '−' + c + ' m³/min (water leaves: DECREASING, hence the minus!)'}.\nWanted: dh/dt = ?`);
        o.rel = Tx(`Koni hacmi: V = (1/3)πr²h. Üç değişken (V, r, h) var; benzer üçgenlerle r'yi h'ye bağlarız: r/h = R/H = ${R}/${H} ⇒ r = ${frS(fr(R, H))}·h.\nYerine koy: V = (1/3)π(${frS(fr(R, H))}·h)²·h = ${coefS}·h³.`,
          `Volume of a cone: V = (1/3)πr²h. There are three variables (V, r, h); similar triangles tie r to h: r/h = R/H = ${R}/${H} ⇒ r = ${frS(fr(R, H))}·h.\nSubstitute: V = (1/3)π(${frS(fr(R, H))}·h)²·h = ${coefS}·h³.`);
        o.diff = Tx(`t'ye göre türet (zincir kuralı): dV/dt = ${dcoefS}·h²·(dh/dt).\nBuradan dh/dt = (dV/dt)·${frS(fr(H * H, R * R))}/(π·h²).\nÖNEMLİ: r'yi türevden ÖNCE h cinsinden yazmak şart; yoksa dV/dt'de iki bilinmeyen kalır.`,
          `Differentiate in t (chain rule): dV/dt = ${dcoefS}·h²·(dh/dt).\nHence dh/dt = (dV/dt)·${frS(fr(H * H, R * R))}/(π·h²).\nIMPORTANT: r must be written in terms of h BEFORE differentiating; otherwise two unknown rates remain in dV/dt.`);
        o.subs = Tx(`dh/dt = ${S(sgn * c)}·${H * H}/(π·${R * R}·${h * h}) = ${S(sgn * c * H * H)}/(${R * R * h * h}π) = ${cp.s} m/dk.`, `dh/dt = ${S(sgn * c)}·${H * H}/(π·${R * R}·${h * h}) = ${S(sgn * c * H * H)}/(${R * R * h * h}π) = ${cp.s} m/min.`);
        o.ans = Tx(`dh/dt = ${cp.s} ≈ ${dc(cp.v)} m/dk.`, `dh/dt = ${cp.s} ≈ ${dc(cp.v)} m/min.`);
        o.interp = fill
          ? Tx(`Artı işaret: seviye YÜKSELİYOR. Su yükseldikçe yüzey genişler, aynı debi seviyeyi daha yavaş yükseltir: dh/dt, 1/h² ile azalır (kaydırıcı).`, `The plus sign: the level is RISING. As the water gets deeper the surface widens, so the same flow raises the level more slowly: dh/dt falls like 1/h² (slider).`)
          : Tx(`Eksi işaret: seviye ALÇALIYOR (${dc(-cp.v)} m/dk). Seviye düştükçe yüzey daralır ve aynı debiyle seviye daha hızlı düşer: |dh/dt| 1/h² ile artar (kaydırıcı).`, `The minus sign: the level is FALLING (${dc(-cp.v)} m/min). As the surface shrinks, the same outflow lowers the level faster and faster: |dh/dt| grows like 1/h² (slider).`);
        o.what = Tx('Suyun hacmi hem yarıçapa hem yüksekliğe bağlı; ikisi benzer üçgenle bağlanır. Hacim hızı verilmiş, seviye hızı isteniyor.', 'The volume of water depends on both the radius and the height, tied by similar triangles. The volume rate is given and the level rate is wanted.');
        break;
      }
      // ---------------------------------------------------------------- cylindrical tank
      case 'cylFill': {
        const r = p.r, h = p.h, Ht = p.Ht, c = p.c;
        const cp = coefPi(c, r * r, -1);
        o.unit = Tx('m/dk', 'm/min'); o.name = 'dh/dt'; o.ansVal = cp.v;
        o.Q = (t) => (PI * r * r * h + c * t) / (PI * r * r);
        o.lo = 0.1 * Ht; o.hi = 0.95 * Ht; o.star = h;
        o.rate = () => c / (PI * r * r);
        o.geo = (s) => cylTankGeo(r, Ht, s, o.rate(s));
        o.stmt = Tx(`Yarıçapı ${r} m olan dik silindirik bir depoya ${c} m³/dk hızla su doluyor. Su derinliği ${h} m iken su seviyesi ne hızla yükseliyor?`, `Water flows at ${c} m³/min into an upright cylindrical tank of radius ${r} m. When the water is ${h} m deep, how fast is the water level rising?`);
        o.vars = Tx(`h(t) = su derinliği (m), V(t) = suyun hacmi (m³), r = ${r} m SABİT (depo yarıçapı), t = dakika.`, `h(t) = depth of the water (m), V(t) = volume of the water (m³), r = ${r} m is CONSTANT (tank radius), t = minutes.`);
        o.known = Tx(`dV/dt = +${c} m³/dk, r = ${r} m (sabit), h = ${h} m.\nİstenen: dh/dt = ?`, `dV/dt = +${c} m³/min, r = ${r} m (constant), h = ${h} m.\nWanted: dh/dt = ?`);
        o.rel = Tx(`Silindir hacmi: V = πr²h = π·${r * r}·h = ${coefPi(r * r, 1, 1).s}·h  (r sabit olduğundan yalnızca h değişir).`, `Volume of a cylinder: V = πr²h = π·${r * r}·h = ${coefPi(r * r, 1, 1).s}·h  (r is constant, so only h changes).`);
        o.diff = Tx(`t'ye göre türet: dV/dt = π·${r * r}·(dh/dt)  ⇒  dh/dt = (dV/dt)/(π·${r * r}).\nr sabit olduğundan türevde 1 çarpan olarak kalır; h'nin değeri sonucu ETKİLEMEZ.`, `Differentiate in t: dV/dt = π·${r * r}·(dh/dt)  ⇒  dh/dt = (dV/dt)/(π·${r * r}).\nr is constant, so it stays as a factor; the value of h does NOT affect the result.`);
        o.subs = Tx(`dh/dt = ${c}/(${r * r}π) = ${cp.s} m/dk.`, `dh/dt = ${c}/(${r * r}π) = ${cp.s} m/min.`);
        o.ans = Tx(`dh/dt = ${cp.s} ≈ ${dc(cp.v)} m/dk.`, `dh/dt = ${cp.s} ≈ ${dc(cp.v)} m/min.`);
        o.interp = Tx(`Silindirde kesit alanı sabit olduğundan seviye SABİT hızla yükselir (kaydırıcıda hız değişmez); koni depodan farkı budur.`, `A cylinder has a constant cross-section, so the level rises at a CONSTANT speed (the rate does not change on the slider); this is the difference from the conical tank.`);
        o.what = Tx('Hacim hızı verilmiş, seviye hızı isteniyor; depo yarıçapı değişmediği için bağıntı çok basit: V = πr²h.', 'The volume rate is given and the level rate is wanted; the tank radius never changes, so the relation is simple: V = πr²h.');
        break;
      }
      // ---------------------------------------------------------------- cylinder with changing radius and height
      case 'cylBoth': {
        const r = p.r, h = p.h, a = p.a, b = p.b;
        const cnum = 2 * r * h * a - sq(r) * b;
        const cp = coefPi(cnum, 1, 1);
        o.unit = 'cm³/s'; o.name = 'dV/dt'; o.ansVal = cp.v;
        o.Q = (t) => PI * sq(r + a * t) * (h - b * t);
        const tr = timeRange([{ pos: r, vel: a }, { pos: h, vel: -b }]);
        o.lo = tr.lo; o.hi = tr.hi; o.star = 0;
        o.rate = (s) => PI * (2 * (r + a * s) * (h - b * s) * a + sq(r + a * s) * (-b));
        o.geo = (s) => cylFreeGeo(r + a * s, h - b * s, s, o.rate(s));
        o.stmt = Tx(`Dik dairesel bir silindirin yarıçapı ${r} cm iken ${a} cm/s hızla artıyor; yüksekliği ${h} cm iken ${b} cm/s hızla azalıyor. Bu anda hacmi ne hızla değişiyor?`,
          `The radius of a right circular cylinder is ${r} cm and is increasing at ${a} cm/s; its height is ${h} cm and is decreasing at ${b} cm/s. How fast is the volume changing at that moment?`);
        o.vars = Tx('r(t) = yarıçap (cm), h(t) = yükseklik (cm), V(t) = hacim (cm³); üçü de zamanla (t, saniye) değişir.', 'r(t) = radius (cm), h(t) = height (cm), V(t) = volume (cm³); all three change with time (t in seconds).');
        o.known = Tx(`r = ${r} cm, dr/dt = +${a} cm/s; h = ${h} cm, dh/dt = −${b} cm/s (AZALIYOR: eksi!).\nİstenen: dV/dt = ?`, `r = ${r} cm, dr/dt = +${a} cm/s; h = ${h} cm, dh/dt = −${b} cm/s (DECREASING: minus!).\nWanted: dV/dt = ?`);
        o.rel = Tx('V = πr²h.', 'V = πr²h.');
        o.diff = Tx(`t'ye göre türet: İKİ değişen çarpan var, bu yüzden ÇARPIM KURALI + ZİNCİR KURALI:\ndV/dt = π[ 2r·(dr/dt)·h + r²·(dh/dt) ].`, `Differentiate in t: there are TWO changing factors, so PRODUCT RULE + CHAIN RULE:\ndV/dt = π[ 2r·(dr/dt)·h + r²·(dh/dt) ].`);
        o.subs = Tx(`dV/dt = π[ 2·${r}·${a}·${h} + ${r}²·(−${b}) ] = π[ ${2 * r * a * h} ${r * r * b ? '− ' + r * r * b : ''} ] = ${cp.s} cm³/s.`, `dV/dt = π[ 2·${r}·${a}·${h} + ${r}²·(−${b}) ] = π[ ${2 * r * a * h} ${r * r * b ? '− ' + r * r * b : ''} ] = ${cp.s} cm³/s.`);
        o.ans = Tx(`dV/dt = ${cp.s} ≈ ${dc(cp.v)} cm³/s.`, `dV/dt = ${cp.s} ≈ ${dc(cp.v)} cm³/s.`);
        o.interp = cnum > 0
          ? Tx(`Artı işaret: hacim ARTIYOR. Yarıçap artışının etkisi (${2 * r * a * h}π), yükseklik azalışının etkisinden (${r * r * b}π) büyük.`, `The plus sign: the volume is INCREASING. The effect of the growing radius (${2 * r * a * h}π) beats the effect of the shrinking height (${r * r * b}π).`)
          : Tx(`Eksi işaret: hacim AZALIYOR. Yükseklik azalışının etkisi (${r * r * b}π), yarıçap artışının etkisinden (${2 * r * a * h}π) büyük.`, `The minus sign: the volume is DECREASING. The effect of the shrinking height (${r * r * b}π) beats the effect of the growing radius (${2 * r * a * h}π).`);
        o.what = Tx('Hacim iki değişen niceliğin çarpımına bağlı; ikisi de zamanla değişiyor. Bu yüzden çarpım ve zincir kuralı birlikte gerekir.', 'The volume depends on the product of two changing quantities, both changing with time, so the product and chain rules are needed together.');
        break;
      }
      // ---------------------------------------------------------------- lamp post and shadow
      case 'shadowLen': case 'shadowTip': {
        const Hh = p.H, h = p.h, d = p.d, v = p.vn / p.vd, vS = dc(v), len = p.kind === 'shadowLen';
        const ans = len ? fr(h * p.vn, (Hh - h) * p.vd) : fr(Hh * p.vn, (Hh - h) * p.vd);
        o.unit = 'm/s'; o.name = len ? 'ds/dt' : 'dz/dt'; o.ansVal = ans.n / ans.d;
        o.Q = (t) => (len ? (h * (d + v * t)) / (Hh - h) : (Hh * (d + v * t)) / (Hh - h));
        o.lo = 0.4 * d; o.hi = 2 * d; o.star = d;
        o.rate = () => o.ansVal;
        o.geo = (s) => shadowGeo(Hh, h, s, o.ansVal, o.name, o.unit, len, 2 * d);
        o.stmt = len
          ? Tx(`${Hh} m yüksekliğindeki bir sokak lambasının direğinden, boyu ${h} m olan bir kişi ${vS} m/s hızla düz bir yolda uzaklaşıyor. Kişi direkten ${d} m uzaktayken GÖLGESİNİN UZUNLUĞU ne hızla artıyor?`,
            `A person ${h} m tall walks away from the base of a ${Hh} m street lamp along a straight road at ${vS} m/s. When the person is ${d} m from the pole, how fast is the LENGTH OF THE SHADOW increasing?`)
          : Tx(`${Hh} m yüksekliğindeki bir sokak lambasının direğinden, boyu ${h} m olan bir kişi ${vS} m/s hızla düz bir yolda uzaklaşıyor. Kişi direkten ${d} m uzaktayken GÖLGENİN UCU (yerdeki uç nokta) direğe göre ne hızla ilerliyor?`,
            `A person ${h} m tall walks away from the base of a ${Hh} m street lamp along a straight road at ${vS} m/s. When the person is ${d} m from the pole, how fast is the TIP OF THE SHADOW (the end point on the ground) moving relative to the pole?`);
        o.vars = Tx(`x(t) = kişinin direğe uzaklığı (m), s(t) = gölgenin uzunluğu (m)${len ? '' : ', z(t) = x + s = gölge ucunun direğe uzaklığı (m)'}; lamba H = ${Hh} m ve kişi h = ${h} m SABİT. t = saniye.`,
          `x(t) = distance of the person from the pole (m), s(t) = length of the shadow (m)${len ? '' : ', z(t) = x + s = distance of the shadow tip from the pole (m)'}; lamp H = ${Hh} m and person h = ${h} m are CONSTANT. t = seconds.`);
        o.known = Tx(`x = ${d} m, dx/dt = +${vS} m/s.\nİstenen: ${o.name} = ?`, `x = ${d} m, dx/dt = +${vS} m/s.\nWanted: ${o.name} = ?`);
        o.rel = Tx(`Işın lambanın tepesinden kişinin başına ve yerdeki gölge ucuna gider. İki benzer üçgen: büyük (yükseklik ${Hh}, taban x + s) ve küçük (yükseklik ${h}, taban s):\n${Hh}/(x + s) = ${h}/s  ⇒  ${Hh}·s = ${h}(x + s)  ⇒  ${Hh - h}·s = ${h}·x.`,
          `The light ray goes from the top of the lamp past the person's head to the tip of the shadow on the ground. Two similar triangles: the large one (height ${Hh}, base x + s) and the small one (height ${h}, base s):\n${Hh}/(x + s) = ${h}/s  ⇒  ${Hh}·s = ${h}(x + s)  ⇒  ${Hh - h}·s = ${h}·x.`);
        o.diff = len
          ? Tx(`t'ye göre türet: ${Hh - h}·(ds/dt) = ${h}·(dx/dt)  ⇒  ds/dt = (${h}/${Hh - h})·(dx/dt).\nx'in değeri (${d} m) formülde YOK: gölge uzunluğu hızı kişinin nerede olduğuna bağlı değildir.`,
            `Differentiate in t: ${Hh - h}·(ds/dt) = ${h}·(dx/dt)  ⇒  ds/dt = (${h}/${Hh - h})·(dx/dt).\nThe value of x (${d} m) does not appear: the shadow-length rate does not depend on where the person stands.`)
          : Tx(`Önce z = x + s: ${Hh - h}·s = ${h}·x ⇒ ${Hh - h}·(z − x) = ${h}x ⇒ ${Hh - h}z = ${Hh}x.\nt'ye göre türet: ${Hh - h}·(dz/dt) = ${Hh}·(dx/dt)  ⇒  dz/dt = (${Hh}/${Hh - h})·(dx/dt).`,
            `First z = x + s: ${Hh - h}·s = ${h}·x ⇒ ${Hh - h}·(z − x) = ${h}x ⇒ ${Hh - h}z = ${Hh}x.\nDifferentiate in t: ${Hh - h}·(dz/dt) = ${Hh}·(dx/dt)  ⇒  dz/dt = (${Hh}/${Hh - h})·(dx/dt).`);
        o.subs = len
          ? Tx(`ds/dt = (${h}/${Hh - h})·${vS} = ${fracDec(ans)} m/s.`, `ds/dt = (${h}/${Hh - h})·${vS} = ${fracDec(ans)} m/s.`)
          : Tx(`dz/dt = (${Hh}/${Hh - h})·${vS} = ${fracDec(ans)} m/s.`, `dz/dt = (${Hh}/${Hh - h})·${vS} = ${fracDec(ans)} m/s.`);
        o.ans = Tx(`${o.name} = ${fracDec(ans)} m/s.`, `${o.name} = ${fracDec(ans)} m/s.`);
        o.interp = len
          ? Tx(`Artı işaret: gölge UZUYOR ve bunu SABİT hızla yapar (${dc(o.ansVal)} m/s = yürüme hızı ${vS} m/s × ${h}/${Hh - h}). Kaydırıcıda hız değişmez: kişi nerede olursa olsun aynıdır.`, `The plus sign: the shadow is GROWING and does so at a CONSTANT rate (${dc(o.ansVal)} m/s = walking speed ${vS} m/s × ${h}/${Hh - h}). It does not change on the slider: it is the same wherever the person stands.`)
          : Tx(`Gölge ucu kişiden DAHA HIZLI gider (${dc(o.ansVal)} m/s > ${vS} m/s) çünkü ${Hh}/${Hh - h} > 1; hız kişinin konumundan bağımsızdır.`, `The tip of the shadow moves FASTER than the person (${dc(o.ansVal)} m/s > ${vS} m/s) because ${Hh}/${Hh - h} > 1; the speed does not depend on the person's position.`);
        o.what = Tx('Kişinin yeri ile gölgenin boyu benzer üçgenlerle bağlı. Kişinin hızı verilmiş, gölgeyle ilgili hız isteniyor.', "The person's position and the length of the shadow are tied by similar triangles. The speed of the person is given and a speed linked to the shadow is wanted.");
        break;
      }
      // ---------------------------------------------------------------- two cars
      case 'cars': {
        const a = p.a, b = p.b, D = p.D, ap = p.sa * p.va, bp = p.sb * p.vb;
        const ans = fr(a * ap + b * bp, D);
        o.unit = Tx('km/sa', 'km/h'); o.name = 'dD/dt'; o.ansVal = ans.n / ans.d;
        o.Q = (t) => Math.sqrt(sq(a + ap * t) + sq(b + bp * t));
        const tr = timeRange([{ pos: a, vel: ap }, { pos: b, vel: bp }]);
        o.lo = tr.lo; o.hi = tr.hi; o.star = 0;
        o.rate = (s) => { const A = a + ap * s, B = b + bp * s; return (A * ap + B * bp) / Math.sqrt(A * A + B * B); };
        o.geo = (s) => carsGeo(a + ap * s, b + bp * s, p.sa, p.sb, s, o.rate(s));
        const mv = (name, toTr, fromTr, dirEn, sg, vel) => sg > 0
          ? [`${name} aracı kavşaktan ${toTr} doğru ${vel} km/sa hızla UZAKLAŞIYOR`, `car ${name} is driving ${dirEn} AWAY from the intersection at ${vel} km/h`]
          : [`${name} aracı kavşağa ${fromTr} ${vel} km/sa hızla YAKLAŞIYOR`, `car ${name} is APPROACHING the intersection from the ${dirEn} at ${vel} km/h`];
        const mA = mv('A', 'doğuya', 'doğudan', 'east', p.sa, p.va), mB = mv('B', 'kuzeye', 'kuzeyden', 'north', p.sb, p.vb);
        o.stmt = Tx(`İki yol dik açıyla kesişiyor. ${mA[0]}; ${mB[0]}. A kavşağın ${a} km doğusunda, B kavşağın ${b} km kuzeyinde iken araçlar arasındaki uzaklık ne hızla değişiyor?`,
          `Two roads cross at right angles. ${mA[1].replace(/^car/, 'Car')}; ${mB[1]}. When A is ${a} km east of the intersection and B is ${b} km north of it, how fast is the distance between the cars changing?`);
        o.vars = Tx('a(t) = A\'nın kavşağa (doğuya) uzaklığı (km), b(t) = B\'nin kavşağa (kuzeye) uzaklığı (km), D(t) = araçlar arası uzaklık (km); t = saat.', 'a(t) = distance of A from the intersection (east, km), b(t) = distance of B from the intersection (north, km), D(t) = distance between the cars (km); t = hours.');
        o.known = Tx(`a = ${a} km, da/dt = ${sgnW(ap)} km/sa${p.sa < 0 ? ' (YAKLAŞIYOR: a azalıyor, eksi!)' : ' (uzaklaşıyor)'}; b = ${b} km, db/dt = ${sgnW(bp)} km/sa${p.sb < 0 ? ' (YAKLAŞIYOR: b azalıyor, eksi!)' : ' (uzaklaşıyor)'}.\nBu anda D = √(${a}² + ${b}²) = √${sq(a) + sq(b)} = ${D} km.\nİstenen: dD/dt = ?`,
          `a = ${a} km, da/dt = ${sgnW(ap)} km/h${p.sa < 0 ? ' (APPROACHING: a decreases, minus!)' : ' (moving away)'}; b = ${b} km, db/dt = ${sgnW(bp)} km/h${p.sb < 0 ? ' (APPROACHING: b decreases, minus!)' : ' (moving away)'}.\nAt this instant D = √(${a}² + ${b}²) = √${sq(a) + sq(b)} = ${D} km.\nWanted: dD/dt = ?`);
        o.rel = Tx('Pisagor: D² = a² + b².', 'Pythagoras: D² = a² + b².');
        o.diff = Tx(`t'ye göre türet (zincir kuralı): 2D·(dD/dt) = 2a·(da/dt) + 2b·(db/dt)  ⇒  dD/dt = [ a·(da/dt) + b·(db/dt) ] / D.`, `Differentiate in t (chain rule): 2D·(dD/dt) = 2a·(da/dt) + 2b·(db/dt)  ⇒  dD/dt = [ a·(da/dt) + b·(db/dt) ] / D.`);
        o.subs = Tx(`dD/dt = [ ${a}·(${S(ap)}) + ${b}·(${S(bp)}) ] / ${D} = ${rawEq(a * ap + b * bp, D, ans)} km/sa.`, `dD/dt = [ ${a}·(${S(ap)}) + ${b}·(${S(bp)}) ] / ${D} = ${rawEq(a * ap + b * bp, D, ans)} km/h.`);
        o.ans = Tx(`dD/dt = ${fracDec(ans)} km/sa.`, `dD/dt = ${fracDec(ans)} km/h.`);
        o.interp = o.ansVal > 0
          ? Tx(`Artı işaret: araçlar arasındaki uzaklık ARTIYOR (${dc(o.ansVal)} km/sa). Bu, iki hızın bileşkesi değil, hızların D doğrultusuna izdüşümlerinin toplamıdır.`, `The plus sign: the distance between the cars is INCREASING (${dc(o.ansVal)} km/h). It is the sum of the components of the two velocities along the line joining the cars, not the sum of the speeds.`)
          : Tx(`Eksi işaret: araçlar birbirine YAKLAŞIYOR (${dc(-o.ansVal)} km/sa). Yaklaşan bir araç, uzaklaşanın etkisini kısmen götürür.`, `The minus sign: the cars are getting CLOSER (${dc(-o.ansVal)} km/h). An approaching car partly cancels the effect of the receding one.`);
        o.what = Tx('Aralarındaki uzaklık iki dik uzaklığın Pisagor bağıntısıyla bağlı. İki aracın hızı verilmiş, uzaklığın değişim hızı isteniyor.', 'The distance between them is tied to the two perpendicular distances by Pythagoras. Both car speeds are given and the rate of change of the distance is wanted.');
        break;
      }
      // ---------------------------------------------------------------- rectangle
      default: {
        const l = p.l, w = p.w, D = p.D, ld = p.ld, wd = p.wd, area = p.kind === 'rectA';
        const ans = area ? fr(ld * w + l * wd) : fr(l * ld + w * wd, D);
        o.unit = area ? 'cm²/s' : 'cm/s'; o.name = area ? 'dA/dt' : 'dD/dt'; o.ansVal = ans.n / ans.d;
        o.Q = area ? (t) => (l + ld * t) * (w + wd * t) : (t) => Math.sqrt(sq(l + ld * t) + sq(w + wd * t));
        const tr = timeRange([{ pos: l, vel: ld }, { pos: w, vel: wd }]);
        o.lo = tr.lo; o.hi = tr.hi; o.star = 0;
        o.rate = (s) => { const A = l + ld * s, B = w + wd * s; return area ? ld * B + A * wd : (A * ld + B * wd) / Math.sqrt(A * A + B * B); };
        o.geo = (s) => rectGeo(l + ld * s, w + wd * s, s, o.rate(s), o.name, o.unit);
        const mv = (nm, val, rate) => (rate > 0 ? Tx(`${nm} ${val} cm iken ${rate} cm/s hızla ARTIYOR`, `${nm} is ${val} cm and INCREASING at ${rate} cm/s`) : Tx(`${nm} ${val} cm iken ${-rate} cm/s hızla AZALIYOR`, `${nm} is ${val} cm and DECREASING at ${-rate} cm/s`));
        o.stmt = Tx(`Bir dikdörtgenin uzunluğu ${mv('uzunluğu', l, ld).replace(/^uzunluğu /, '')}; genişliği ${mv('genişliği', w, wd).replace(/^genişliği /, '')}. Bu anda dikdörtgenin ${area ? 'ALANI' : 'KÖŞEGENİ'} ne hızla değişiyor?`,
          `The length of a rectangle ${mv('the length', l, ld).replace(/^the length /, '')}; its width ${mv('the width', w, wd).replace(/^the width /, '')}. How fast is the ${area ? 'AREA' : 'DIAGONAL'} of the rectangle changing at that moment?`);
        o.vars = Tx(`l(t) = uzunluk (cm), w(t) = genişlik (cm), ${area ? 'A(t) = alan (cm²)' : 'D(t) = köşegen (cm)'}; t = saniye.`, `l(t) = length (cm), w(t) = width (cm), ${area ? 'A(t) = area (cm²)' : 'D(t) = diagonal (cm)'}; t = seconds.`);
        o.known = Tx(`l = ${l} cm, dl/dt = ${sgnW(ld)} cm/s; w = ${w} cm, dw/dt = ${sgnW(wd)} cm/s.${area ? '' : `\nBu anda D = √(${l}² + ${w}²) = √${sq(l) + sq(w)} = ${D} cm.`}\nİstenen: ${o.name} = ?`,
          `l = ${l} cm, dl/dt = ${sgnW(ld)} cm/s; w = ${w} cm, dw/dt = ${sgnW(wd)} cm/s.${area ? '' : `\nAt this instant D = √(${l}² + ${w}²) = √${sq(l) + sq(w)} = ${D} cm.`}\nWanted: ${o.name} = ?`);
        o.rel = area ? Tx('Alan: A = l·w.', 'Area: A = l·w.') : Tx('Köşegen (Pisagor): D² = l² + w².', 'Diagonal (Pythagoras): D² = l² + w².');
        o.diff = area
          ? Tx(`t'ye göre türet: iki değişen çarpan var ⇒ ÇARPIM KURALI: dA/dt = (dl/dt)·w + l·(dw/dt).`, `Differentiate in t: two changing factors ⇒ PRODUCT RULE: dA/dt = (dl/dt)·w + l·(dw/dt).`)
          : Tx(`t'ye göre türet (zincir kuralı): 2D·(dD/dt) = 2l·(dl/dt) + 2w·(dw/dt)  ⇒  dD/dt = [ l·(dl/dt) + w·(dw/dt) ] / D.`, `Differentiate in t (chain rule): 2D·(dD/dt) = 2l·(dl/dt) + 2w·(dw/dt)  ⇒  dD/dt = [ l·(dl/dt) + w·(dw/dt) ] / D.`);
        o.subs = area
          ? Tx(`dA/dt = (${S(ld)})·${w} + ${l}·(${S(wd)}) = ${S(ld * w)} ${wd * l < 0 ? '−' : '+'} ${Math.abs(l * wd)} = ${S(ld * w + l * wd)} cm²/s.`, `dA/dt = (${S(ld)})·${w} + ${l}·(${S(wd)}) = ${S(ld * w)} ${wd * l < 0 ? '−' : '+'} ${Math.abs(l * wd)} = ${S(ld * w + l * wd)} cm²/s.`)
          : Tx(`dD/dt = [ ${l}·(${S(ld)}) + ${w}·(${S(wd)}) ] / ${D} = ${rawEq(l * ld + w * wd, D, ans)} cm/s.`, `dD/dt = [ ${l}·(${S(ld)}) + ${w}·(${S(wd)}) ] / ${D} = ${rawEq(l * ld + w * wd, D, ans)} cm/s.`);
        o.ans = Tx(`${o.name} = ${fracDec(ans)} ${o.unit}.`, `${o.name} = ${fracDec(ans)} ${o.unit}.`);
        o.interp = o.ansVal > 0
          ? Tx(`Artı işaret: ${area ? 'alan' : 'köşegen'} ARTIYOR. Bir kenar kısalırken diğeri uzuyor; net etkiyi işaretli terimlerin toplamı belirler.`, `The plus sign: the ${area ? 'area' : 'diagonal'} is INCREASING. One side shrinks while the other grows; the signed terms decide the net effect.`)
          : Tx(`Eksi işaret: ${area ? 'alan' : 'köşegen'} AZALIYOR. Bir kenar kısalırken diğeri uzuyor; kısalan kenarın etkisi baskın.`, `The minus sign: the ${area ? 'area' : 'diagonal'} is DECREASING. One side shrinks while the other grows; the shrinking side dominates.`);
        o.what = area
          ? Tx('Alan iki kenarın çarpımı, ikisi de zamanla değişiyor: çarpım kuralı gerekir.', 'The area is the product of two sides that both change with time: the product rule is needed.')
          : Tx('Köşegen iki kenara Pisagor ile bağlı; kenar hızları verilmiş, köşegen hızı isteniyor.', 'The diagonal is tied to the two sides by Pythagoras; the side rates are given and the diagonal rate is wanted.');
      }
    }
    return o;
  }

  // ---------- geometry (shared by the picture) ----------
  // each geo(s) returns { segs: [{x1,y1,x2,y2,role}], circles: [{cx,cy,r,role}], arcs: [{cx,cy,r,a0,a1,role}], marks: [{x,y,role,label}], live: {x,y,text} }
  function rateTxt(name, rate, unit) { return `${name} = ${dc(rate)} ${unit}`; }
  function ladderGeo(L, x, rate, name) {
    const y = Math.sqrt(Math.max(0, L * L - x * x));
    return {
      segs: [{ x1: -0.05 * L, y1: 0, x2: 1.05 * L, y2: 0, role: 'fixed' }, { x1: 0, y1: 0, x2: 0, y2: 1.05 * L, role: 'fixed' }, { x1: x, y1: 0, x2: 0, y2: y, role: 'main' }],
      circles: [], arcs: [{ cx: 0, cy: 0, r: L, a0: 0, a1: PI / 2, role: 'aux' }],
      marks: [{ x, y: 0, role: 'gold', label: `x = ${dc(x)}` }, { x: 0, y, role: 'red', label: `y = ${dc(y)}` }],
      live: { x: x / 2, y: y / 2, text: rateTxt(name, rate, 'm/s') },
    };
  }
  function circleGeo(r, q, qn, rate, name, unit, lu, qu) {
    return {
      segs: [{ x1: 0, y1: 0, x2: r, y2: 0, role: 'aux' }], circles: [{ cx: 0, cy: 0, r, role: 'main' }], arcs: [],
      marks: [{ x: r, y: 0, role: 'gold', label: `r = ${dc(r)} ${lu}` }, { x: 0, y: 0, role: 'live', label: '' }],
      live: { x: 0, y: -0.25 * r, text: `${qn} = ${dc(q)} ${qu}   ${rateTxt(name, rate, unit)}` },
    };
  }
  function coneGeo(R, H, h, rate) {
    const rho = R / H, segs = [{ x1: -R, y1: H, x2: 0, y2: 0, role: 'fixed' }, { x1: 0, y1: 0, x2: R, y2: H, role: 'fixed' }, { x1: -R, y1: H, x2: R, y2: H, role: 'fixed' },
      { x1: -rho * h, y1: h, x2: rho * h, y2: h, role: 'main' }];
    for (let i = 1; i < 12; i++) { const yy = h * i / 12; segs.push({ x1: -rho * yy, y1: yy, x2: rho * yy, y2: yy, role: 'water' }); }
    return {
      segs, circles: [], arcs: [],
      marks: [{ x: rho * h, y: h, role: 'gold', label: `h = ${dc(h)} m` }],
      live: { x: 0, y: H * 1.06, text: rateTxt('dh/dt', rate, Tx('m/dk', 'm/min')) },
    };
  }
  function cylTankGeo(r, Ht, h, rate) {
    const segs = [{ x1: -r, y1: 0, x2: -r, y2: Ht, role: 'fixed' }, { x1: r, y1: 0, x2: r, y2: Ht, role: 'fixed' }, { x1: -r, y1: 0, x2: r, y2: 0, role: 'fixed' },
      { x1: -r, y1: h, x2: r, y2: h, role: 'main' }];
    for (let i = 1; i < 12; i++) { const yy = h * i / 12; segs.push({ x1: -r, y1: yy, x2: r, y2: yy, role: 'water' }); }
    return { segs, circles: [], arcs: [], marks: [{ x: r, y: h, role: 'gold', label: `h = ${dc(h)} m` }], live: { x: 0, y: Ht * 1.06, text: rateTxt('dh/dt', rate, Tx('m/dk', 'm/min')) } };
  }
  function cylFreeGeo(r, h, tau, rate) {
    return {
      segs: [{ x1: -r, y1: 0, x2: r, y2: 0, role: 'main' }, { x1: r, y1: 0, x2: r, y2: h, role: 'main' }, { x1: r, y1: h, x2: -r, y2: h, role: 'main' }, { x1: -r, y1: h, x2: -r, y2: 0, role: 'main' },
        { x1: 0, y1: 0, x2: r, y2: 0, role: 'aux' }],
      circles: [], arcs: [],
      marks: [{ x: r, y: 0, role: 'gold', label: `r = ${dc(r)}` }, { x: r, y: h, role: 'orange', label: `h = ${dc(h)}` }],
      live: { x: 0, y: h / 2, text: `t = ${dc(tau)} s   ${rateTxt('dV/dt', rate, 'cm³/s')}` },
    };
  }
  function shadowGeo(H, h, x, rate, name, unit, len, xmax) {
    const z = H * x / (H - h), s = z - x, zmax = H * xmax / (H - h);
    return {
      segs: [{ x1: -0.04 * zmax, y1: 0, x2: 1.04 * zmax, y2: 0, role: 'fixed' }, { x1: 0, y1: 0, x2: 0, y2: H, role: 'fixed' }, { x1: x, y1: 0, x2: x, y2: h, role: 'main' },
        { x1: 0, y1: H, x2: z, y2: 0, role: 'ray' }, { x1: x, y1: 0, x2: z, y2: 0, role: 'shadow' }],
      circles: [], arcs: [],
      marks: [{ x: 0, y: H, role: 'gold', label: `H = ${H} m` }, { x, y: h, role: 'orange', label: `x = ${dc(x)} m` }, { x: z, y: 0, role: 'red', label: len ? `s = ${dc(s)} m` : `z = ${dc(z)} m` }],
      live: { x: z * 0.55, y: H * 0.55, text: rateTxt(name, rate, unit) },
    };
  }
  function carsGeo(a, b, sa, sb, tau, rate) {
    const len = 0.18 * Math.max(a, b);
    return {
      segs: [{ x1: 0, y1: 0, x2: 1.1 * a + len, y2: 0, role: 'fixed' }, { x1: 0, y1: 0, x2: 0, y2: 1.1 * b + len, role: 'fixed' }, { x1: a, y1: 0, x2: 0, y2: b, role: 'main' },
        { x1: a, y1: 0, x2: a + sa * len, y2: 0, role: 'aux' }, { x1: 0, y1: b, x2: 0, y2: b + sb * len, role: 'aux' }],
      circles: [], arcs: [],
      marks: [{ x: a, y: 0, role: 'gold', label: `A: a = ${dc(a)} km` }, { x: 0, y: b, role: 'orange', label: `B: b = ${dc(b)} km` }],
      live: { x: a / 2, y: b / 2, text: `t = ${dc(tau)} h   ${rateTxt('dD/dt', rate, Tx('km/sa', 'km/h'))}` },
    };
  }
  function rectGeo(l, w, tau, rate, name, unit) {
    return {
      segs: [{ x1: 0, y1: 0, x2: l, y2: 0, role: 'main' }, { x1: l, y1: 0, x2: l, y2: w, role: 'main' }, { x1: l, y1: w, x2: 0, y2: w, role: 'main' }, { x1: 0, y1: w, x2: 0, y2: 0, role: 'main' },
        { x1: 0, y1: 0, x2: l, y2: w, role: 'aux' }],
      circles: [], arcs: [],
      marks: [{ x: l, y: 0, role: 'gold', label: `l = ${dc(l)}` }, { x: 0, y: w, role: 'orange', label: `w = ${dc(w)}` }],
      live: { x: l / 2, y: w / 2, text: `t = ${dc(tau)} s   ${rateTxt(name, rate, unit)}` },
    };
  }

  // ---------- text ----------
  function problemStatement(p) { return spec(p).stmt; }

  function concept(p) {
    const o = spec(p);
    const head = Tx('ŞU ANKİ ÖRNEK\n' + kindLabel(p.kind) + '\n\n', 'CURRENT EXAMPLE\n' + kindLabel(p.kind) + '\n\n');
    return head + Tx(
      'İLGİLİ DEĞİŞİM HIZLARI\n' +
      '\n' +
      'TANIM\n' +
      'İlgili değişim hızları: iki ya da daha fazla nicelik bir geometrik/fiziksel bağıntıyla bağlıdır ve hepsi zamanla (t) değişir. Bağıntının t\'ye göre türevi, bilinen hızdan bilinmeyen hızı verir (ZİNCİR KURALI: d/dt[x²] = 2x·dx/dt).\n' +
      '\n' +
      '6 ADIMLI TARİF\n' +
      '1. ÇİZ ve değişkenleri adlandır (zamanla değişenleri sembolle, sabitleri sayıyla).\n' +
      '2. BİLİNENLER ve İSTENEN: hangi hızlar verilmiş (dx/dt = ...), hangisi isteniyor (dy/dt = ?). İşaretlere dikkat: artıyorsa +, azalıyorsa −.\n' +
      '3. BAĞINTIYI yaz (Pisagor, alan, hacim, benzer üçgenler, trigonometri).\n' +
      '4. Her iki tarafın t\'ye göre TÜREVİNİ al (zincir kuralı!).\n' +
      '5. ANLIK DEĞERLERİ ŞİMDİ yerine koy (türevden ÖNCE değil!), bilinmeyen hızı çöz.\n' +
      '6. BİRİMLİ ve İŞARETLİ cevap yaz.\n' +
      '\n' +
      'SIK BAĞINTILAR\n' +
      'Daire A = πr², çevre C = 2πr; küre V = 4/3πr³, S = 4πr²; silindir V = πr²h; koni V = 1/3πr²h; dikdörtgen A = l·w, köşegen D² = l² + w²; Pisagor x² + y² = L²; benzer üçgenler (lamba-gölge, koni depo).\n' +
      '\n' +
      'ÖZEL DURUMLAR\n' +
      '• Üç değişken varsa (koni: V, r, h) önce benzer üçgenle birini diğerine bağlayıp bağıntıyı TEK değişkene indirin, sonra türetin.\n' +
      '• Sabit nicelikler (merdiven boyu, depo yarıçapı, lamba yüksekliği) türevde 0 verir; değişenler ise zincir kuralı çarpanı (dx/dt) taşır.\n' +
      '• İşaret kuralı: artan nicelik için hız +, azalan için −. "Kavşağa yaklaşıyor", "boşalıyor", "iniyor" ifadeleri eksi hız demektir.\n' +
      '• İki değişen çarpan (V = πr²h, A = l·w) varsa çarpım kuralı gerekir.\n' +
      '\n' +
      'TUZAKLAR\n' +
      '• ANLIK sayıları türevden önce yerine koymak: değişen niceliği sabitlersiniz ve türev sıfır olur.\n' +
      '• İşaret hataları (azalan nicelik için negatif hız).\n' +
      '• Birim karışıklığı (cm/s ile m/s).\n' +
      '• Yanlış bağıntı seçmek (ör. koni için su yüksekliği ile yarıçapı ilişkilendirmeyi unutmak).\n' +
      '\n' +
      'MİNİ ÖRNEKLER\n' +
      '• Genişleyen daire: A = πr², dA/dt = 2πr·dr/dt. r = 5 cm ve dr/dt = 2 cm/s ise dA/dt = 2π·5·2 = 20π ≈ 62,8 cm²/s.\n' +
      '• Kayan merdiven: L = 10 m, x² + y² = 100 → 2x·x\' + 2y·y\' = 0 → y\' = −(x/y)x\'. x = 6, y = 8, x\' = 1 m/s ise y\' = −(6/8)·1 = −0,75 m/s (üst uç aşağı iner).\n' +
      '\n' +
      'GRAFİK: Şekil sistemin anlık görüntüsüdür. Kaydırıcı sistemi zaman içinde (ya da değişkenin farklı değerlerinde) gezdirir; şeklin üzerindeki yazı o andaki değişim hızını gösterir. Gri kesikli çizim sorunun sorulduğu anı korur.',
      'RELATED RATES\n' +
      '\n' +
      'DEFINITION\n' +
      'Related rates: two or more quantities are linked by a geometric/physical relationship and all vary with time t. Differentiating the relationship with respect to t turns a known rate into an unknown rate (CHAIN RULE: d/dt[x²] = 2x·dx/dt).\n' +
      '\n' +
      'THE 6-STEP RECIPE\n' +
      '1. DRAW and name variables (symbols for things that change in time, numbers for constants).\n' +
      '2. KNOWN and WANTED: which rates are given (dx/dt = ...), which is requested (dy/dt = ?). Mind the signs: + if increasing, − if decreasing.\n' +
      '3. WRITE THE RELATION (Pythagoras, area, volume, similar triangles, trigonometry).\n' +
      '4. DIFFERENTIATE both sides with respect to t (chain rule!).\n' +
      '5. SUBSTITUTE the instantaneous values NOW (not before differentiating!) and solve for the unknown rate.\n' +
      '6. State the answer WITH UNITS and SIGN.\n' +
      '\n' +
      'COMMON RELATIONS\n' +
      'Circle A = πr², C = 2πr; sphere V = 4/3πr³, S = 4πr²; cylinder V = πr²h; cone V = 1/3πr²h; rectangle A = l·w, diagonal D² = l² + w²; Pythagoras x² + y² = L²; similar triangles (lamp and shadow, conical tank).\n' +
      '\n' +
      'SPECIAL CASES\n' +
      '• With three variables (cone: V, r, h) first tie one to another by similar triangles so the relation has ONE variable, then differentiate.\n' +
      '• Constant quantities (ladder length, tank radius, lamp height) differentiate to 0; changing ones carry a chain-rule factor (dx/dt).\n' +
      '• Sign rule: + for an increasing quantity, − for a decreasing one. "Approaching", "draining", "sliding down" mean a negative rate.\n' +
      '• Two changing factors (V = πr²h, A = l·w) need the product rule.\n' +
      '\n' +
      'PITFALLS\n' +
      '• Substituting INSTANTANEOUS numbers before differentiating: you freeze a changing quantity and its derivative becomes zero.\n' +
      '• Sign errors (negative rate for a decreasing quantity).\n' +
      '• Unit mix-ups (cm/s with m/s).\n' +
      '• Choosing the wrong relation (e.g. for a cone, forgetting to relate water height and radius).\n' +
      '\n' +
      'MINI EXAMPLES\n' +
      '• Expanding circle: A = πr², dA/dt = 2πr·dr/dt. With r = 5 cm and dr/dt = 2 cm/s, dA/dt = 2π·5·2 = 20π ≈ 62.8 cm²/s.\n' +
      '• Sliding ladder: L = 10 m, x² + y² = 100 → 2x·x\' + 2y·y\' = 0 → y\' = −(x/y)x\'. With x = 6, y = 8, x\' = 1 m/s, y\' = −(6/8)·1 = −0.75 m/s (the top slides down).\n' +
      '\n' +
      'GRAPH: the picture is a snapshot of the system. The slider moves the system through time (or through other values of the variable); the text on the picture shows the rate at that state. The gray dashed drawing keeps the instant of the question in view.') +
      (p.showWhat ? '\n\n' + Tx('SORU NE DEMEK İSTİYOR?\n', 'WHAT DOES THE QUESTION MEAN?\n') + o.what : '');
  }

  function solveSteps(p) {
    const o = spec(p), st = [];
    st.push(Hdr(1, 'Çiz ve adlandır', 'Draw and name the variables') + '\n' + o.vars);
    st.push(Hdr(2, 'Bilinenler ve istenen', 'Known and wanted') + '\n' + o.known);
    st.push(Hdr(3, 'Bağıntıyı yaz', 'Write the relation') + '\n' + o.rel);
    st.push(Hdr(4, 'Her iki tarafın t\'ye göre türevini al', 'Differentiate both sides with respect to t') + '\n' + o.diff);
    st.push(Hdr(5, 'Anlık değerleri ŞİMDİ yerleştir', 'Substitute the instantaneous values NOW') + '\n' + o.subs);
    const hh = 1e-6, num = (o.Q(hh) - o.Q(-hh)) / (2 * hh);
    st.push(Hdr(6, 'Birimli ve işaretli cevap', 'Answer with units and sign') + '\n' + o.ans + '\n' + o.interp + '\n' +
      Tx(`Sayısal kontrol: t'yi çok az değiştirip ${o.name} ≈ [Q(+10⁻⁶) − Q(−10⁻⁶)] / (2·10⁻⁶) = ${dc(num)} ${o.unit} bulunur; formülle aynı.`,
        `Numerical check: nudging t slightly gives ${o.name} ≈ [Q(+10⁻⁶) − Q(−10⁻⁶)] / (2·10⁻⁶) = ${dc(num)} ${o.unit}; the same as the formula.`));
    return st;
  }

  // ---------- drawing ----------
  function paint(canvas, g, ghost) {
    const col = (role) => {
      switch (role) {
        case 'fixed': return canvas.gray();
        case 'main': return canvas.accent();
        case 'aux': return canvas.orange();
        case 'ray': return canvas.orange();
        case 'water': return canvas.blue();
        case 'shadow': return canvas.purple();
        default: return canvas.gray();
      }
    };
    g.segs.forEach((s) => {
      if (ghost) { if (s.role === 'main') canvas.addSegment({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, color: canvas.gray(), thickness: 1.6, dashed: true }); return; }
      const thick = s.role === 'main' ? 4 : s.role === 'shadow' ? 5 : s.role === 'water' ? 1 : s.role === 'fixed' ? 2 : 1.6;
      canvas.addSegment({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, color: col(s.role), thickness: thick, dashed: s.role === 'aux' || s.role === 'ray' });
    });
    g.circles.forEach((c) => canvas.addParametric({ xOfT: (t) => c.cx + c.r * Math.cos(t), yOfT: (t) => c.cy + c.r * Math.sin(t), tMin: 0, tMax: 2 * PI, color: ghost ? canvas.gray() : col(c.role), thickness: ghost ? 1.6 : 3, dashed: ghost }));
    g.arcs.forEach((c) => { if (!ghost) canvas.addParametric({ xOfT: (t) => c.cx + c.r * Math.cos(t), yOfT: (t) => c.cy + c.r * Math.sin(t), tMin: c.a0, tMax: c.a1, color: canvas.gray(), thickness: 1.2, dashed: true }); });
    g.marks.forEach((m) => {
      if (ghost) { canvas.addMarker({ x: m.x, y: m.y, color: canvas.gray(), radius: 5, hollow: true, label: '' }); return; }
      if (m.role === 'live') return;
      const c = m.role === 'gold' ? canvas.gold() : m.role === 'red' ? canvas.red() : m.role === 'orange' ? canvas.orange() : canvas.accent();
      canvas.addMarker({ x: m.x, y: m.y, color: c, radius: 6, label: m.label });
    });
    if (!ghost && g.live) canvas.addMarker({ x: g.live.x, y: g.live.y, color: canvas.green(), shape: 'diamond', radius: 4, label: g.live.text });
  }

  function bbox(o) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const add = (x, y) => { if (isFinite(x) && isFinite(y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } };
    const states = [o.star];
    for (let i = 0; i <= 24; i++) states.push(o.lo + (o.hi - o.lo) * i / 24);
    states.forEach((s) => {
      const g = o.geo(s);
      g.segs.forEach((q) => { add(q.x1, q.y1); add(q.x2, q.y2); });
      g.circles.forEach((c) => { add(c.cx - c.r, c.cy - c.r); add(c.cx + c.r, c.cy + c.r); });
      g.arcs.forEach((c) => { add(c.cx + c.r, c.cy); add(c.cx, c.cy + c.r); add(c.cx, c.cy); });
      g.marks.forEach((m) => add(m.x, m.y));
      if (g.live) add(g.live.x, g.live.y);
    });
    return [x0, x1, y0, y1];
  }

  function draw(canvas, p) {
    try {
      const o = spec(p);
      const b = bbox(o), asp = aspect(canvas);
      const cx = (b[0] + b[1]) / 2, cy = (b[2] + b[3]) / 2;
      const halfH = Math.max((b[3] - b[2]) / 2 * 1.22, (b[1] - b[0]) / 2 * 1.22 / asp, 1e-3);
      const halfW = halfH * asp;
      // shift right a little so the left-hand labels have room
      canvas.setViewport(cx - halfW, cx + halfW, cy - halfH, cy + halfH);
      if (p.ghost) paint(canvas, o.geo(o.star), true);
      const s = o.lo + (o.hi - o.lo) * Math.max(0, Math.min(100, p.u)) / 100;
      paint(canvas, o.geo(s), false);
    } catch (e) { /* never throw */ }
  }

  function buildControls(rightCol, getProblem, h) {
    const sel = h.addSelect({
      options: [{ label: Tx('Örnek türü: Rastgele', 'Example type: Random'), value: 'random' }].concat(KINDS.map((k) => ({ label: kindLabel(k), value: k }))),
      get: () => forcedKind,
      set: (v) => { forcedKind = String(v); h.regenerate(); },
    });
    h.addSlider({
      caption: Tx('Zaman / durum kaydırıcısı (%): sistemi hareket ettir', 'Time / state slider (%): move the system'),
      min: 0, max: 100, step: 1,
      get: () => getProblem().u,
      set: (v) => { getProblem().u = Math.max(0, Math.min(100, Math.round(v))); },
    });
    h.addCheckbox({
      caption: Tx('Sorunun sorulduğu anı (gri, kesikli) göster', 'Show the instant of the question (gray, dashed)'),
      get: () => getProblem().ghost,
      set: (v) => { getProblem().ghost = !!v; },
    });
    h.addCheckbox({
      caption: Tx('Soru ne demek istiyor? (konu metnine ekle)', 'What does the question mean? (add to the topic text)'),
      get: () => !!getProblem().showWhat,
      set: (v) => { getProblem().showWhat = !!v; },
    });
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', () => h.refresh());
  }

  Topics.register('applications', {
    id: 'relatedRates',
    tabTitle: () => Tx('İlgili Değişim Hızları', 'Related Rates'),
    concept,
    problemStatement,
    createProblem,
    solveSteps,
    draw,
    buildControls,
    links: [
      { match: /^\s*• (Üç değişken varsa|With three variables)/, make: (rng) => createProblem(rng, 'coneFill') },
      { match: /^\s*• (Sabit nicelikler|Constant quantities)/, make: (rng) => createProblem(rng, 'shadowLen') },
      { match: /^\s*• (İşaret kuralı|Sign rule)/, make: (rng) => createProblem(rng, 'coneDrain') },
      { match: /^\s*• (İki değişen çarpan|Two changing factors)/, make: (rng) => createProblem(rng, 'cylBoth') },
      { match: /^\s*• (Genişleyen daire|Expanding circle)/, make: (rng) => createProblem(rng, 'circleA') },
      { match: /^\s*• (Kayan merdiven|Sliding ladder)/, make: (rng) => createProblem(rng, 'ladder') },
    ],
    _kinds: KINDS,
    _spec: spec,
    _setKind: (k) => { forcedKind = k; },
  });
})();
