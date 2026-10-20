// Small random-number helper passed to every topic's createProblem(rng), mirroring the
// convenience methods topic authors relied on in VB.NET's System.Random-based generators.
class Rng {
  // Seeded mode: after reseed(n) every number comes from a reproducible mulberry32 stream, so a problem can be recreated from its ID.
  // Without reseed() the generator behaves exactly as before (Math.random).
  reseed(seed) { this._s = seed >>> 0; }
  static newSeed() { return 1 + Math.floor(Math.random() * (36 ** 5 - 1)); }
  static idOf(seed) { return seed.toString(36).toUpperCase().padStart(5, '0'); }
  static parseId(txt) { const t = String(txt).trim().replace(/^#/, ''); return /^[0-9a-z]{1,5}$/i.test(t) ? parseInt(t, 36) : NaN; }
  _next() {
    if (this._s === undefined) return Math.random();
    this._s = (this._s + 0x6D2B79F5) >>> 0;
    let t = this._s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // Integer in [minIncl, maxExcl) - same convention as VB's rng.Next(min, max).
  nextInt(minIncl, maxExcl) {
    return minIncl + Math.floor(this._next() * (maxExcl - minIncl));
  }
  nextDouble() {
    return this._next();
  }
  pick(arr) {
    return arr[this.nextInt(0, arr.length)];
  }
  // Integer in [lo, hi] that is never 0 (handy for slopes/denominators).
  nonZeroInt(lo, hi) {
    let v;
    do { v = this.nextInt(lo, hi + 1); } while (v === 0);
    return v;
  }
}
