// One command for all automated checks:   node tests/run.js        (all)   |   node tests/run.js engineering   (one chapter)
// Each job runs in its own process; the last line of its output is the summary. Exit code is 1 if anything failed.
const { spawnSync } = require('child_process');
const path = require('path');
const only = process.argv[2];
const CH = ['numbers', 'functions', 'trig', 'limits', 'derivatives', 'applications', 'integrals', 'calc2', 'engineering'];
const CHALLENGE = ['limits', 'derivatives', 'applications', 'integrals', 'calc2'];
const jobs = [['core_rng.js', []]];
if (!only) { jobs.push(['exam_all.js', []]); jobs.push(['static_i18n.js', []]); jobs.push(['quiz_pools.js', []]); }
for (const c of CH) {
  if (only && only !== c) continue;
  jobs.push(['harness_check.js', [c, 'check']]);
  jobs.push(['harness_modes.js', [c, 'links']]);
  jobs.push(['lang_audit.js', [c]]);
  if (CHALLENGE.includes(c)) { jobs.push(['harness_modes.js', [c, 'challenge']]); jobs.push(['harness_modes.js', [c, 'numeric']]); }
  if (c === 'engineering') jobs.push(['harness_modes.js', [c, 'units']]);
  if (c === 'engineering' || c === 'calc2') jobs.push(['harness_modes.js', [c, '3d']]);
}
let bad = 0;
for (const [file, args] of jobs) {
  const r = spawnSync(process.execPath, [path.join(__dirname, file), ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const lines = (r.stdout + r.stderr).split('\n').filter((l) => l.trim());
  const fails = lines.filter((l) => /^FAIL|LOAD ERROR|Error:/.test(l));
  const last = lines.filter((l) => !/^no (links|challenge)/.test(l)).slice(-1)[0] || '(no output)';
  const status = r.status === 0 && !fails.length ? 'OK  ' : 'FAIL';
  if (status === 'FAIL') { bad++; fails.slice(0, 5).forEach((l) => console.log('    ' + l.slice(0, 200))); }
  console.log(status + ' ' + file.replace('.js', '') + ' ' + args.join(' ') + '  → ' + last.slice(0, 110));
}
console.log(bad ? '\n' + bad + ' job(s) FAILED' : '\nAll ' + jobs.length + ' jobs passed');
process.exitCode = bad ? 1 : 0;
