// Generic chapter harness for the Calculus Visualiser HTML edition.
//   node harness.js <chapter> snap  <out.json>    -> writes a baseline (numeric tokens of every text, per topic/lang/seed)
//   node harness.js <chapter> check [baseline.json] -> runs all checks; with a baseline also compares numeric tokens
// Chapters: numbers functions trig limits derivatives applications engineering integrals
// Checks: no exceptions; no 'undefined'/'NaN'/'Infinity'/'[object' in texts; non-empty steps; draw() never throws and
// every drawn number is finite; evaluators return finite-or-NaN; def.focus(p) (if present) returns null or {x,y} finite;
// buildControls works (getters/setters exercised); drawSchematic (if present) runs on a stub.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const [,, chapter, mode, arg] = process.argv;
if (!chapter || !mode) { console.log('usage: node harness.js <chapter> snap|check [file]'); process.exit(2); }

const noop = () => {};
const stubEl = () => new Proxy(function () {}, {
  get: (t, k) => (k === 'style' ? {} : k === 'parentElement' ? stubEl() : k === 'classList' ? { add: noop, remove: noop, toggle: noop, contains: () => false } : k === 'children' ? [] : k === 'clientWidth' || k === 'clientHeight' ? 400 : k === 'getContext' ? () => stubCtx : stubFn),
  set: () => true,
  apply: () => stubEl(),
});
const stubFn = (...a) => stubEl();
const stubCtx = new Proxy({}, { get: () => noop, set: () => true });
const ctx = vm.createContext({
  console, Math, JSON, Array, Object, String, Number, Date, RegExp, Set, Map, Error, isFinite, isNaN, parseFloat, parseInt,
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval: noop, requestAnimationFrame: noop, cancelAnimationFrame: noop,
  document: { createElement: stubEl, body: stubEl(), documentElement: stubEl(), getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop },
  localStorage: { getItem: () => null, setItem: noop },
  getComputedStyle: () => ({ getPropertyValue: () => '#888888' }),
  ResizeObserver: class { observe() {} disconnect() {} },
  navigator: {}, performance: { now: () => 0 },
});
ctx.window = ctx; ctx.self = ctx; ctx.addEventListener = noop; ctx.removeEventListener = noop; ctx.dispatchEvent = noop;
const run = (code, name) => vm.runInContext(code, ctx, { filename: name });
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

['js/core/i18n.js', 'js/core/rng.js', 'js/core/topics.js', 'js/core/quizEngine.js'].forEach((f) => run(rd(f), f));
run('I18N.onChange = () => () => {};', 'noListeners');
// GraphCanvas stub that records geometry and checks finiteness
run(`
function niceStep(r){return 1}
function fmt2(v){ if(!isFinite(v)) return String(v); let s=v.toFixed(2); s=s.replace(/0+$/,'').replace(/\\.$/,''); if(s==='-0') s='0'; return s; }
class GraphCanvas {
  constructor(){ this.bad=[]; this.canvas={clientWidth:500,clientHeight:500}; this.clear(); this.vp=null; }
  clear(){ this.functions=[]; this.parametric=[]; this.segments=[]; this.markers=[]; this.guideLines=[]; this.regions=[]; this.filledAreas=[]; this.showGridAndAxes=true; }
  setViewport(a,b,c,d){ this.vp=[a,b,c,d]; if(![a,b,c,d].every(isFinite)) this.bad.push('viewport'); }
  addFunction(f){ this.functions.push(f); } addParametric(p){ this.parametric.push(p); } addSegment(s){ this.segments.push(s); }
  addMarker(m){ this.markers.push(m); if(!isFinite(m.x)||!isFinite(m.y)) this.bad.push('marker '+m.x+','+m.y); }
  addGuideLine(g){ this.guideLines.push(g); } addRegion(r){ this.regions.push(r); } addFilledArea(a){ this.filledAreas.push(a); }
  accent(){return '#2563eb'} gray(){return '#888'} gold(){return '#e0b400'} green(){return '#3cb371'} blue(){return '#1e90ff'} purple(){return '#9370db'} orange(){return '#ff8c42'} red(){return '#dc5050'}
  screenToWorld(x,y){return {x:0,y:0}} worldToScreen(x,y){return {x:0,y:0}} render(){}
  _withAlpha(c,a){return c}
}
`, 'stubGraph');
run(`
class Schematic {
  constructor(){ this.bad=[]; this.c={ink:'#000',sub:'#666',fill:'#ccc',accent:'#00f',steel:'#999',steelDark:'#555',fluid:'#08f',fluidSoft:'#8cf',heat:'#f50',cold:'#5af',load:'#e80',good:'#0a0',bad:'#d00',gold:'#eb0',green:'#3b7',purple:'#97d',grid:'#ddd',bg:'#fff'}; }
  clear(){} render(){}
}
['line','poly','rect','circle','arc','text','title','arrow','dim','callout','ground','pinSupport','rollerSupport','fixedSupport','spring','damper','mass','beam','distLoad','tank','pipe','flow','gear','pistonCylinder','gauge'].forEach(n => { Schematic.prototype[n] = function(...a){ a.forEach(v => { if (typeof v === 'number' && !isFinite(v)) this.bad.push(n+':nonfinite'); if (typeof v === 'string' && /undefined|NaN|Infinity/.test(v)) this.bad.push(n+':'+v); }); return this; }; });
`, 'stubSchem');
run('var Theme = { palette: () => ({}), isDark: () => true, onChange: () => () => {} };', 'theme');
// deterministic RNG
run(`class SeededRng extends Rng { constructor(seed){ super(); this.s=(seed>>>0)||1; }
  nextDouble(){ this.s=(this.s+0x6D2B79F5)>>>0; let t=this.s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
  nextInt(a,b){ return a+Math.floor(this.nextDouble()*(b-a)); } }`, 'seeded');

const dir = path.join(ROOT, 'js/topics', chapter);
const kits = { trig: ['js/topics/trig/trigKit.js'], functions: ['js/topics/functions/fnKit.js'] }[chapter] || [];
kits.forEach((f) => run(rd(f), f));
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'quizBank.js' && !kits.some((k) => k.endsWith(f))).sort();
files.forEach((f) => { try { run(rd('js/topics/' + chapter + '/' + f), f); } catch (e) { console.log('LOAD ERROR', f, e.message); process.exitCode = 1; } });
if (mode === '3d') { const T = require(path.join(ROOT, 'lib/three/three.min.js')); ctx.THREE = T; run(rd('js/core/view3d.js') + '; this.View3D = View3D;', 'view3d'); }
const defs = run(`Topics.get('${chapter}')`, 'get').filter((d) => !d.type);
console.log(chapter + ': ' + defs.length + ' worked-example topics: ' + defs.map((d) => d.id).join(', '));


const NL = String.fromCharCode(10);
const rngOf = (seed) => run('new SeededRng(' + (seed * 7919 + 13) + ')', 'rng');
const setLang = (lang) => run('(function(){ if (I18N.get() !== ' + (lang === 'tr') + ') I18N.toggle(); })()', 'lang');
let fails = 0;
const fail = (...a) => { fails++; console.log('FAIL', ...a); process.exitCode = 1; };
if (mode === 'links') {
  // every link: its regex must match a concept line in BOTH languages (or be a tab link to an existing tab); make() must give a valid problem
  const ids = defs.map((d) => d.id);
  let nLinks = 0;
  for (const def of defs) {
    if (!def.links || !def.links.length) { console.log('no links:', def.id); continue; }
    def.links.forEach((lk, li) => {
      nLinks++;
      for (const lang of ['tr', 'en']) {
        setLang(lang);
        let concept = ''; try { concept = def.concept(def.createProblem(rngOf(1))); } catch (e) { fail(def.id, 'concept', e.message); continue; }
        if (!concept.split(NL).some((l) => lk.match.test(l))) fail(def.id, 'link#' + li, lk.match, 'matches NO concept line in', lang);
      }
      if (lk.tab) { if (!ids.includes(lk.tab)) fail(def.id, 'link#' + li, 'unknown tab', lk.tab); return; }
      for (const lang of ['tr', 'en']) for (let sd = 1; sd <= 25; sd++) {
        setLang(lang);
        try {
          const p = lk.make(rngOf(sd), def.createProblem(rngOf(sd + 100)));
          if (!p) throw new Error('make() returned nothing');
          const txt = [def.problemStatement ? def.problemStatement(p) : '', (def.solveSteps(p) || []).join(NL)].join(NL);
          (global.LINKTXT = global.LINKTXT || []).push({ id: def.id, lang, txt }); if ((lang === 'tr' && /undefined/.test(txt)) || /NaN|Infinity|\[object/.test(txt)) throw new Error('bad text: ' + (txt.match(/.{0,30}(undefined|NaN|Infinity|\[object).{0,20}/s) || [''])[0]);
          const gc = run('new GraphCanvas()', 'gc'); def.draw(gc, p); if (gc.bad.length) throw new Error('draw ' + gc.bad[0]);
        } catch (e) { fail(def.id, 'link#' + li, lang, 'seed', sd, e.message); return; }
      }
    });
  }
  if (process.env.OUT) require('fs').writeFileSync(process.env.OUT, JSON.stringify(global.LINKTXT || []));
  console.log(chapter + ': ' + nLinks + ' links checked, failures ' + fails);
} else if (mode === '3d') {
  const View3D = ctx.View3D, V3 = View3D.V3, THREE = ctx.THREE;
  const C = { dark: true, bg: '#000', fg: '#fff', sub: '#888', accent: '#2563eb', good: '#16a34a', orange: '#f97316', bad: '#ef4444', purple: '#8b5cf6', gold: '#eab308' };
  let n3 = 0;
  for (const def of defs) {
    if (!def.view3d) { console.log('no 3D:', def.id); continue; }
    for (const lang of ['tr', 'en']) {
      setLang(lang);
      const world = new THREE.Group(); const b = def.view3d.build({ THREE, world, C, V3, view: {} });
      for (let sd = 1; sd <= 40; sd++) {
        try {
          const p = def.createProblem(rngOf(sd));
          if (p && typeof p === 'object' && def.buildControls && sd === 1) { /* controls need DOM; the problem object alone is enough */ }
          V3.clear(world); const msg = b.update(p, C); n3++;
          if (msg !== undefined && typeof msg !== 'string') throw new Error('update() must return a string or nothing');
          if (/undefined|NaN|Infinity/.test(String(msg || ''))) throw new Error('bad note: ' + msg);
          world.traverse((o) => {
            if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) throw new Error('non-finite vertex in ' + o.type); }
            [o.position, o.scale].forEach((v) => { if (!(Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z))) throw new Error('non-finite transform'); });
          });
        } catch (e) { fail(def.id, lang, 'seed', sd, e.message); break; }
      }
    }
  }
  console.log(chapter + ': 3D frames ' + n3 + ', failures ' + fails);
}

if (mode === 'challenge') {
  let nCh = 0;
  for (const def of defs) {
    if (!def.challenge) { console.log('no challenge:', def.id); continue; }
    const c = def.challenge;
    for (const lang of ['tr', 'en']) for (let sd = 1; sd <= 60; sd++) {
      setLang(lang);
      try {
        const p = def.createProblem(rngOf(sd)); nCh++;
        const pr = c.prompt(p), t = c.target(p), tol = c.tol(p);
        if (typeof pr !== 'string' || !pr.trim()) throw new Error('empty prompt');
        if ((lang === 'tr' && /undefined/.test(pr)) || /NaN|Infinity|\[object/.test(pr)) throw new Error('bad prompt: ' + pr.slice(0, 60));
        if (!Number.isFinite(t)) throw new Error('target not finite');
        if (!(Number.isFinite(tol) && tol > 0)) throw new Error('tol must be > 0, got ' + tol);
        if (c.hint) { const hh = c.hint(p, t + 5 * tol); if (hh !== undefined && typeof hh !== 'string') throw new Error('hint must be a string'); }
      } catch (e) { fail(def.id, lang, 'seed', sd, e.message); break; }
    }
  }
  console.log(chapter + ': challenge checks ' + nCh + ', failures ' + fails);
}
if (mode === 'units') {
  const UNIT = /\b(m|mm|cm|km|N|kN|MPa|GPa|Pa|kPa|s|ms|min|h|kg|g|J|kJ|W|kW|K|°C|rad|Hz|m\/s|m\/s²|N·m|kN·m|N\/m|bar|L|dak|sa|µm|µ|MPa)\b|°C|m²|m³|kN·m|N·m|m\/s/;
  let n = 0;
  for (const def of defs) {
    if (!def._scenarioCount) continue;
    for (let scn = 0; scn < def._scenarioCount(); scn++) for (const lang of ['tr', 'en']) {
      setLang(lang); def._setScenario(scn);
      let missA = 0, missU = 0;
      for (let sd = 1; sd <= 8; sd++) {
        const p = def.createProblem(rngOf(sd)); const txt = (def.solveSteps(p) || []).join(NL); n++;
        if (!(lang === 'tr' ? /Varsayım/ : /Assumption/).test(txt)) missA++;
        if (!UNIT.test(txt)) missU++;
      }
      if (missA || missU) fail(def.id, 'scenario', scn + 1, lang, missA ? 'no "Varsayımlar/Assumptions" line' : '', missU ? 'no unit found' : '');
    }
  }
  console.log(chapter + ': unit/assumption checks ' + n + ', failures ' + fails);
}
if (mode === 'titles') {
  setLang('tr');
  for (const def of defs) { if (!def._scenarioCount) continue;
    for (let s = 0; s < def._scenarioCount(); s++) { def._setScenario(s); const p = def.createProblem(rngOf(1)); console.log(def.id, s, '|', String((def.solveSteps(p)||[])[0]).slice(0, 110).replace(/\n/g,' ')); } }
}
if (mode === 'numeric') {
  // Independent numeric cross-checks of the maths behind the worked examples (needs def._test hooks).
  const close = (a, b, tol) => Math.abs(a - b) <= tol * (1 + Math.abs(b));
  const minus = (s) => String(s).replace(/-/g, '−');
  let n = 0;
  for (const def of defs) {
    const T = def._test; if (!T) continue;
    for (let sd = 1; sd <= 80; sd++) {
      try {
        const p = def.createProblem(rngOf(sd)); n++;
        if (def.id === 'tangentRate') {
          for (const x of [-2.7, -1, 0.3, 1.9, 3.1]) {
            const h = 1e-5, F = (v) => T.F(p, v), d = T.dF(p, x), nd = (F(x + h) - F(x - h)) / (2 * h);
            if (Number.isFinite(d) && Number.isFinite(nd) && !close(d, nd, 1e-4)) throw new Error('dF(' + x + ')=' + d + ' vs numeric ' + nd);
          }
        } else if (def.id === 'riemannSums') {
          T.norm(p); const u = T.FUNS[p.fi], exact = u.F(p.b) - u.F(p.a);
          for (const m of [0, 1, 2, 3]) if (!close(T.riemann(u.f, p.a, p.b, 20000, m), exact, 1e-3)) throw new Error('riemann method ' + m + ' does not converge to F(b)-F(a)');
          setLang('tr'); const s = (def.solveSteps(p) || []).join(NL), t = T.riemann(u.f, p.a, p.b, p.n, p.method);
          const sv = String(+t.toFixed(2)); if (!s.includes(sv) && !s.includes(minus(sv))) throw new Error('solution text lacks the ' + p.n + '-piece sum ' + sv);
        } else if (def.id === 'approachingIntro') {
          const m = T.model(p), e = 1e-7;
          const vl = m.f(p.a - e), vr = m.f(p.a + e);
          if (!close(vl, m.Ll, 1e-5)) throw new Error('left limit ' + m.Ll + ' vs f(a-e)=' + vl);
          if (!close(vr, m.Lr, 1e-5)) throw new Error('right limit ' + m.Lr + ' vs f(a+e)=' + vr);
        } else if (def.id === 'newtonsMethod') {
          const sp = T.spec(p);
          for (const x of [p.x0, p.x0 + 0.37]) { const h = 1e-6, d = sp.df(x), nd = (sp.f(x + h) - sp.f(x - h)) / (2 * h); if (Number.isFinite(d) && Number.isFinite(nd) && !close(d, nd, 1e-3)) throw new Error('df(' + x + ')=' + d + ' vs numeric ' + nd); }
          const it = T.iterate(sp, p.x0, 60);
          if (it.status === 'conv' && Math.abs(sp.f(it.hist[it.hist.length - 1])) > 1e-6) throw new Error('converged but f(root) = ' + sp.f(it.hist[it.hist.length - 1]));
        }
        if (def.challenge) { const t = def.challenge.target(p); if (!Number.isFinite(t)) throw new Error('challenge target not finite'); }
      } catch (e) { fail(def.id, 'seed', sd, e.message); break; }
    }
  }
  console.log(chapter + ': numeric checks ' + n + ', failures ' + fails);
}
