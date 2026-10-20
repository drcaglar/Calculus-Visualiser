// Seeded Rng: the same problem ID must always give the same numbers; different IDs must differ; ID text round-trips.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = vm.createContext({ Math });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/core/rng.js'), 'utf8') + '; this.Rng = Rng;', ctx);
const Rng = ctx.Rng;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const seq = (seed) => { const r = new Rng(); r.reseed(seed); return Array.from({ length: 40 }, () => r.nextInt(-9, 10)).join(','); };
ok(seq(12345) === seq(12345), 'same seed gives same sequence');
ok(seq(12345) !== seq(54321), 'different seeds give different sequences');
for (let i = 0; i < 200; i++) { const sd = Rng.newSeed(); ok(Rng.parseId(Rng.idOf(sd)) === sd, 'ID round trip ' + sd); ok(Rng.idOf(sd).length === 5, 'ID has 5 characters'); }
ok(Number.isNaN(Rng.parseId('!!')) && Number.isNaN(Rng.parseId('')) && Number.isNaN(Rng.parseId('ABCDEFG')), 'bad IDs rejected');
const r = new Rng(); let lo = 9, hi = -9; for (let i = 0; i < 2000; i++) { const v = r.nextInt(-3, 4); lo = Math.min(lo, v); hi = Math.max(hi, v); }
ok(lo === -3 && hi === 3, 'unseeded Rng still covers its range');
console.log('core_rng: failures ' + fails);
process.exitCode = fails ? 1 : 0;
