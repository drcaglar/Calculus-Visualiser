// Test harness (see tests/run.js). Do not run by hand unless debugging: node tests/harness_check.js <chapter> check
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
const defs = run(`Topics.get('${chapter}')`, 'get').filter((d) => !d.type);
console.log(chapter + ': ' + defs.length + ' worked-example topics: ' + defs.map((d) => d.id).join(', '));

const N = chapter === 'engineering' ? 20 : 60;
const snap = {}; let problems = 0;
const base = mode === 'check' && arg ? JSON.parse(fs.readFileSync(arg, 'utf8')) : null;
let numDiffs = 0, textProblems = 0, focusFound = 0, focusMissing = [];
const BADTXT = /undefined|NaN|Infinity|\[object|\bnull\b/;
function tokens(s) { return (String(s).match(/-?\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(',', '.')).sort(); }
function runTopic(def, lang, seed) {
  const key = def.id + '|' + lang + '|' + seed;
  run(`(function(){ if (I18N.get() !== ${lang === 'tr'}) I18N.toggle(); })()`, 'lang');
  const rng = run(`new SeededRng(${seed * 7919 + 13})`, 'rng');
  let p, parts = [];
  try {
    p = def.createProblem(rng);
    parts.push(def.concept(p));
    if (def.problemStatement) parts.push(def.problemStatement(p));
    const steps = def.solveSteps(p);
    if (!steps || !steps.length) throw new Error('no steps');
    parts.push(steps.join('\n'));
    const gc = run('new GraphCanvas()', 'gc');
    def.draw(gc, p);
    if (gc.bad.length) throw new Error('draw: ' + gc.bad.slice(0, 2).join(';'));
    const evals = [...gc.functions]; for (const f of evals) { for (let i = 0; i <= 40; i++) { const x = gc.vp ? gc.vp[0] + (gc.vp[1] - gc.vp[0]) * i / 40 : i; let y; try { y = f.evaluator(x); } catch (e) { throw new Error('evaluator threw'); } if (y !== undefined && !isNaN(y) && !isFinite(y)) throw new Error('evaluator Infinity'); } }
    if (def.focus) { const f = def.focus(p); if (f !== null && f !== undefined) { if (!(isFinite(f.x) && isFinite(f.y))) throw new Error('focus not finite'); focusFound++; } else focusMissing.push(def.id); }
    if (def.drawSchematic) { const sc = run('new Schematic()', 'sc'); def.drawSchematic(sc, p); if (sc.bad.length) throw new Error('schematic: ' + sc.bad.slice(0, 2).join(';')); }
    if (def.buildControls && seed === 1) {
      const sliders = [], ret = (o) => { sliders.push(o); return new Proxy({ select: stubEl(), input: stubEl() }, { get: (t, k) => (k in t ? t[k] : noop) }); }, helpers = { addSlider: ret, addCheckbox: ret, addRadioGroup: ret, addSelect: ret, refresh: noop, regenerate: noop };
      def.buildControls(stubEl(), () => p, helpers);
      sliders.forEach((o) => { if (o.get) o.get(); });
    }
  } catch (e) { if (process.env.DBG) console.log(e.stack); console.log('FAIL', key, e.message); process.exitCode = 1; return; }
  const text = parts.join('\n');
  if ((lang === 'tr' && /undefined/.test(text)) || /NaN|Infinity|\[object/.test(text)) { textProblems++; console.log('TEXT', key, (text.match(/.{0,40}(undefined|NaN|Infinity|\[object).{0,30}/s) || [''])[0].replace(/\s+/g, ' ')); process.exitCode = 1; }
  problems++;
  const tk = tokens(text);
  if (mode === 'snap') snap[key] = tk;
  else if (base && base[key]) { if (JSON.stringify(base[key]) !== JSON.stringify(tk)) { numDiffs++; if (numDiffs <= 12) { const a = base[key].join(' '), b = tk.join(' '); console.log('NUMDIFF', key, '\n  before:', a.slice(0, 160), '\n  after: ', b.slice(0, 160)); } } }
}
for (const def of defs) for (const lang of ['tr', 'en']) for (let s = 1; s <= N; s++) runTopic(def, lang, s);
if (mode === 'snap') { fs.writeFileSync(arg, JSON.stringify(snap)); console.log('snapshot written:', problems, 'problems'); }
else console.log('checked', problems, 'problems; textProblems', textProblems, 'numeric-token diffs', numDiffs, '; focus provided on', focusFound, 'runs;', 'topics without focus():', [...new Set(defs.filter((d) => !d.focus).map((d) => d.id))].join(','));
