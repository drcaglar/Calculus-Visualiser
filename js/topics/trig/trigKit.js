// Shared helpers for the Trigonometry chapter (ports of QuizKit.PiStr/ExactTrig/Cf/Sup in QuizBankPart1.vb
// and Quiz helpers Gcd/Frac in QuizBank.vb). Global object `TrigKit`; loaded before every js/topics/trig/*.js file.
const TrigKit = (() => {
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = a % b; a = b; b = t; }
    return a === 0 ? 1 : a;
  }

  // "n/d" reduced; integers as "n"; zero denominator -> localized "undefined".
  function frac(n, d) {
    if (d === 0) return I18N.tx('tanımsız', 'undefined');
    const g = gcd(n, d);
    n = n / g; d = d / g;
    if (d < 0) { n = -n; d = -d; }
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  // (n/d)·π as text: piStr(1,6)="π/6", piStr(2,3)="2π/3", piStr(2,1)="2π", piStr(-1,2)="-π/2", piStr(0,1)="0".
  function piStr(n, d) {
    if (n === 0) return '0';
    const g = gcd(n, d);
    n = n / g; d = d / g;
    if (d < 0) { n = -n; d = -d; }
    const core = Math.abs(n) === 1 ? (n < 0 ? '-π' : 'π') : `${n}π`;
    return d === 1 ? core : `${core}/${d}`;
  }

  // Coefficient prefix: cf(1)="" cf(-1)="-" cf(3)="3".
  function cf(n) { return n === 1 ? '' : (n === -1 ? '-' : String(n)); }

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sup(n) { return n >= 0 && n <= 9 ? SUP[n] : '^' + n; }

  // Exact value of sin/cos/tan at a multiple of 30° or 45°, as text ("√2/2", "-1/2", "√3/3", "0", localized "undefined").
  function exactTrig(fn, deg) {
    const d = ((deg % 360) + 360) % 360;
    let ref, quad;
    if (d <= 90) { ref = d; quad = 1; }
    else if (d <= 180) { ref = 180 - d; quad = 2; }
    else if (d <= 270) { ref = d - 180; quad = 3; }
    else { ref = 360 - d; quad = 4; }
    const idx = [0, 30, 45, 60, 90].indexOf(ref);
    if (idx < 0) return '?';
    const sinT = ['0', '1/2', '√2/2', '√3/2', '1'];
    const cosT = ['1', '√3/2', '√2/2', '1/2', '0'];
    const tanT = ['0', '√3/3', '1', '√3', null];
    let v, positive;
    if (fn === 'sin') { v = sinT[idx]; positive = quad === 1 || quad === 2; }
    else if (fn === 'cos') { v = cosT[idx]; positive = quad === 1 || quad === 4; }
    else { v = tanT[idx]; positive = quad === 1 || quad === 3; }
    if (v === null) return I18N.tx('tanımsız', 'undefined');
    if (v === '0' || positive) return v;
    return '-' + v;
  }

  // Degrees <-> radians for display helpers.
  function toRad(deg) { return deg * Math.PI / 180; }
  function toDeg(rad) { return rad * 180 / Math.PI; }

  // Signed term text: sg(3)="+ 3", sg(-3)="- 3" (numbers via fmt2).
  function sg(v) { return v >= 0 ? '+ ' + fmt2(v) : '- ' + fmt2(Math.abs(v)); }

  return { gcd, frac, piStr, cf, sup, exactTrig, toRad, toDeg, sg };
})();
