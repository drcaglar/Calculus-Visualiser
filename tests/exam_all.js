// "Sınav Oluşturucu" (mixed exam over all chapters): script test with the same stub DOM as the harness.
// Loads every chapter's topic files (quiz banks fill window.ExamPools), mounts the exam tab with chapterId 'all', and checks mixing,
// determinism of the set number and a few error cases.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(__dirname, 'harness_modes.js'), 'utf8');
const pre = src.slice(src.indexOf('const noop'), src.indexOf("const dir = path.join(ROOT, 'js/topics', chapter);")).replace(/run\(`class SeededRng[\s\S]*?'seeded'\);/, '');
const { run, rd } = new Function('fs', 'path', 'vm', 'ROOT', 'chapter', 'mode', 'arg', pre + '\nreturn { run, rd };')(fs, path, vm, ROOT, 'x', 'x');
const CH = ['numbers', 'functions', 'trig', 'limits', 'derivatives', 'applications', 'integrals', 'calc2', 'engineering'];
const kits = { trig: ['js/topics/trig/trigKit.js'], functions: ['js/topics/functions/fnKit.js'] };
['js/core/assessment.js', 'js/core/typeset.js'].forEach((f) => { try { run(rd(f), f); } catch (e) { /* optional */ } });
run('var CHAPTERS = ' + JSON.stringify(CH.map((id) => ({ id }))) + '.map((c) => ({ id: c.id, title: () => c.id.toUpperCase() }));', 'chapters');
for (const c of CH) {
  (kits[c] || []).forEach((f) => run(rd(f), f));
  const dir = path.join(ROOT, 'js/topics', c);
  fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !(kits[c] || []).some((k) => k.endsWith(f))).sort().forEach((f) => {
    try { run(rd('js/topics/' + c + '/' + f), c + '/' + f); } catch (e) { console.log('LOAD ERROR', c + '/' + f, e.message); process.exitCode = 1; }
  });
}
run('document.createTextNode = () => ({}); document.getElementById = () => null;', 'domfix');
run(rd('js/core/examSet.js'), 'examSet');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); process.exitCode = 1; } };
const pools = run('Object.keys(window.ExamPools).map((k) => k + ":" + window.ExamPools[k].length).join(" ")', 'pools');
console.log('pools: ' + pools);
const mount = () => run("mountExamSet(document.body, () => 'Exam Creator', 'all')", 'mount');
const ex = mount();
const T = ex._test, gs = T.groups();
const chs = [...new Set(gs.map((g) => g.ch))];
ok(chs.length === CH.length, 'every chapter contributes topic groups, got ' + chs.join(','));
ok(gs.every((g) => g.name.includes(': ')), 'group names carry the chapter title');
ok(T.state().selected.size === 0, 'nothing selected by default in the creator');
// pick two topics from each of four chapters
const pick = []; for (const c of ['numbers', 'limits', 'integrals', 'engineering']) pick.push(...gs.filter((g) => g.ch === c).slice(0, 2).map((g) => g.name));
T.select(pick); T.setSize(40);
const b1 = T.create();
ok(b1.questions.length === 40, 'set has 40 questions, got ' + b1.questions.length);
const used = new Set(b1.questions.map((x) => x.q.topic));
console.log('distinct topics in the 40: ' + used.size + ' of ' + pick.length + ' selected');
ok(used.size >= pick.length - 2, 'questions are spread over the selected topics (' + used.size + '/' + pick.length + ')');
ok(b1.questions.every((x) => x.q.options.length === 4 && x.q.correctIndex >= 0 && x.q.text), 'every question has 4 options and a correct index');
ok(/^ALL-[0-9A-Z]{5}-40-[0-9A-F]+$/.test(b1.setNo), 'set number format ' + b1.setNo);
const sig = (b) => b.questions.map((x) => x.q.text + '|' + x.q.options.join('/') + '|' + x.q.correctIndex).join('#');
// reopen by number in a fresh mount: same paper and same key
const ex2 = mount();
const msg = ex2._test.openCode(b1.setNo.toLowerCase());
ok(msg === '', 'openCode accepts its own number: ' + msg);
const b2 = ex2._test.state().built;
ok(b2 && sig(b2) === sig(b1), 'same set number gives the same questions and key');
ok(ex2._test.state().examSize === 40 && ex2._test.state().selected.size === pick.length, 'size and topic selection restored from the number');
// other code gives a different set
const alt = b1.setNo.replace(/^ALL-.{5}/, 'ALL-' + (b1.setNo.slice(4, 9) === 'ZZZZZ' ? '00001' : 'ZZZZZ'));
ex2._test.openCode(alt); ok(sig(ex2._test.state().built) !== sig(b1), 'different seed gives a different set');
// errors
ok(/biçimi geçersiz|format/.test(ex2._test.openCode('hello')), 'bad format rejected');
ok(/başka bir bölüm|another chapter/.test(ex2._test.openCode('LIM-00001-40-3')), 'chapter code of another chapter rejected');
ok(/soru sayısı|question count/.test(ex2._test.openCode('ALL-00001-45-3')), 'bad size rejected');
ok(/konu listesine|topic list/.test(ex2._test.openCode('ALL-00001-40-' + 'F'.repeat(70))), 'mask beyond topic list rejected');
ok(/seçili konu yok|no selected/.test(ex2._test.openCode('ALL-00001-40-0')), 'empty mask rejected');
// size 100 over all chapters, all topics
T.select(gs.map((g) => g.name)); T.setSize(100);
const t0 = Date.now(); const big = T.create();
ok(big.questions.length === 100, '100-question set over all topics, got ' + big.questions.length);
const chOf = new Set(big.questions.map((x) => x.q.topic)); ok(chOf.size > 30, 'a 100-question set touches many topics: ' + chOf.size);
console.log('100 questions built in ' + (Date.now() - t0) + ' ms; code length ' + big.setNo.length);
const ex3 = mount(); ok(ex3._test.openCode(big.setNo) === '' && sig(ex3._test.state().built) === sig(big), 'a 100-question all-topics number round-trips');
console.log('exam_all: failures ' + fails);
