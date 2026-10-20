// Static scan of the fixed interface texts: every tx('Türkçe', 'English') call with two plain string literals in js/*.js, js/core/*.js, js/topics/*.js
// must have both branches filled, different from each other, and no Turkish letters in the English one.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const lit = "(?:'((?:[^'\\\\\\n]|\\\\.)*)'|\"((?:[^\"\\\\\\n]|\\\\.)*)\"|`((?:[^`\\\\]|\\\\.)*)`)";
const pat = new RegExp('\\b(?:I18N\\.tx|tx|Tx|T)\\(\\s*' + lit + '\\s*,\\s*' + lit + '\\s*[,)]', 'g');
const dirs = ['js', 'js/core', 'js/topics'];
let total = 0, bad = 0;
for (const d of dirs) {
  for (const f of fs.readdirSync(path.join(ROOT, d)).filter((x) => x.endsWith('.js'))) {
    const s = fs.readFileSync(path.join(ROOT, d, f), 'utf8');
    let m;
    while ((m = pat.exec(s))) {
      const a = [m[1], m[2], m[3]].find((x) => x !== undefined), b = [m[4], m[5], m[6]].find((x) => x !== undefined);
      total++;
      const words = (a.match(/[A-Za-zçğıöşüÇĞİÖŞÜ]{4,}/g) || []).length;
      let why = '';
      if (!a.trim() || !b.trim()) why = 'EMPTY branch';
      else if (a === b && words >= 2) why = 'same text in both languages';
      else if (/[çğıöşüÇĞİÖŞÜ]/.test(b.replace(/ÇAĞLAR/g, '')) && !/Turkish|Türk/.test(b)) why = 'Turkish letters in the English text';
      if (why) { bad++; console.log('FAIL', d + '/' + f, '-', why, '::', a.slice(0, 60), '|', b.slice(0, 60)); }
    }
  }
}
console.log('static_i18n: ' + total + ' text pairs scanned, failures ' + bad);
process.exitCode = bad ? 1 : 0;
