// Typeset: turns the plain-text maths used in the topic texts (x², √x, a/b, ∫ₐᵇ, ⇒ ...) into KaTeX segments.
// Only pure-maths stretches are converted; every ordinary word stays ordinary text. Nothing is added or dropped
// (the converter is checked against all topic texts: digits and structure must survive, KaTeX must parse them).
//   Typeset.segments(line, lang)  -> [{ k: 't' | 'm', v }]   ('t' plain text, 'm' TeX)
//   Typeset.isEquation(segs)      -> true when the line is a single equation (rendered centred, display style)
//   Typeset.toTex(core, display)  -> TeX string of one maths stretch
const Typeset = (function () {
  const SUP = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
    'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e', 'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ⁱ': 'i', 'ʲ': 'j', 'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ⁿ': 'n', 'ᵒ': 'o', 'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u', 'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z',
  };
  const SUB = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
    'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o', 'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u', 'ᵥ': 'v', 'ₓ': 'x', '꜀': 'c',
  };
  const SYM = {
    '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '≈': '\\approx ', '≡': '\\equiv ', '∈': '\\in ', '∉': '\\notin ', '⊂': '\\subset ', '⊆': '\\subseteq ', '⊄': '\\not\\subset ',
    '∪': '\\cup ', '∩': '\\cap ', '∞': '\\infty ', '∫': '\\int ', '∑': '\\sum ', '∏': '\\prod ', '±': '\\pm ', '∓': '\\mp ', '×': '\\times ', '÷': '\\div ', '·': '\\cdot ',
    '⇒': '\\Rightarrow ', '⇔': '\\Leftrightarrow ', '⟺': '\\Longleftrightarrow ', '→': '\\to ', '↔': '\\leftrightarrow ', '↦': '\\mapsto ', '↗': '\\nearrow ', '↘': '\\searrow ',
    '∘': '\\circ ', '∅': '\\varnothing ', '∖': '\\setminus ', '⊥': '\\perp ', '⟂': '\\perp ', '∝': '\\propto ', '≪': '\\ll ', '≫': '\\gg ', '∂': '\\partial ', '∇': '\\nabla ',
    '…': '\\ldots ', '⌊': '\\lfloor ', '⌋': '\\rfloor ', '⌈': '\\lceil ', '⌉': '\\rceil ', '°': '{}^{\\circ}', '′': "'", '″': "''", '‴': "'''",
    'ℝ': '\\mathbb{R}', 'ℕ': '\\mathbb{N}', 'ℤ': '\\mathbb{Z}', 'ℚ': '\\mathbb{Q}', 'ℂ': '\\mathbb{C}', '½': '\\frac12 ', '¾': '\\frac34 ',
    'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'ε': '\\varepsilon ', 'ζ': '\\zeta ', 'η': '\\eta ', 'θ': '\\theta ', 'ι': '\\iota ', 'κ': '\\kappa ',
    'λ': '\\lambda ', 'μ': '\\mu ', 'µ': '\\mu ', 'ν': '\\nu ', 'ξ': '\\xi ', 'π': '\\pi ', 'ρ': '\\rho ', 'σ': '\\sigma ', 'ς': '\\sigma ', 'τ': '\\tau ', 'υ': '\\upsilon ',
    'φ': '\\varphi ', 'ϕ': '\\phi ', 'χ': '\\chi ', 'ψ': '\\psi ', 'ω': '\\omega ',
    'Γ': '\\Gamma ', 'Δ': '\\Delta ', 'Θ': '\\Theta ', 'Λ': '\\Lambda ', 'Ξ': '\\Xi ', 'Π': '\\Pi ', 'Σ': '\\Sigma ', 'Φ': '\\Phi ', 'Ψ': '\\Psi ', 'Ω': '\\Omega ',
  };
  const SYMRE = new RegExp('[' + Object.keys(SYM).join('') + ']', 'g');
  const SUPRE = new RegExp('[' + Object.keys(SUP).join('') + ']+', 'g');
  const SUBRE = new RegExp('[' + Object.keys(SUB).join('') + ']+', 'g');
  const NATIVE_FN = 'sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|coth|arcsin|arccos|arctan|ln|log|exp|lim|max|min|det|gcd';
  const OTHER_FN = 'arccot|arcsec|arccsc|sech|csch|sgn|lcm';
  const FN_RE = new RegExp('(?<![\\\\A-Za-z])(' + NATIVE_FN + '|' + OTHER_FN + ')(?![A-Za-z])', 'g');
  const MATHWORD = new RegExp('^(?:' + NATIVE_FN + '|' + OTHER_FN + '|d[xyztuvsθ])$');
  const LET = 'A-Za-zÀ-ÖØ-öø-ɏ';
  const OPEN = '([{', CLOSE = ')]}';
  // little words that must never be glued into an equation
  const STOP = new Set(('ve ile de da ki mi mu bu şu ne mı mü her bir iki üç dört beş en ya hem ise ama çok göre gibi kadar daha için çünkü ya da öyle şöyle ayrıca yani ancak fakat veya ' +
    'and or the is are for to of in on at by as if so no we it be an not but per all any one two can may has was its our you let then than from with this that thus here also over each both').split(' '));
  const OPCH = /[=+\-−·×/^<>≤≥≈≠(∫√]/;
  const TEXTSPLIT = /(\s\|\s|[•✓✗—–─∎₺‰]+)/;
  const STRONG = /[=<>≤≥≈≠≡∈∉⊂⊆⊄∪∩∞∫√∛^\/α-ωΑ-Ωπ±∓×÷⇒⇔→↔⟺∑∏∂∇′″‴∘∅½¾⌊⌋⌈⌉⊥⟂∝≪≫↗↘↦ℝℕℤℚℂ…⁰-⁹⁺-⁾ⁿ₀-₎ₐ-ₜᵃ-ᶻ꜀*·]|[A-Za-z]|\u0304/;

  function balancedClose(s, i) { // index of the bracket closing s[i] (same family), or -1
    const o = s[i], c = o === '(' ? ')' : o === '[' ? ']' : '}';
    let d = 0;
    for (let j = i; j < s.length; j++) { if (s[j] === o) d++; else if (s[j] === c) { d--; if (d === 0) return j; } }
    return -1;
  }
  function protectSlash(x) { return x.replace(/\//g, '\u0002'); }

  // ---------- stage 1: sub/superscripts, roots, escapes ----------
  function pre(s) {
    s = s.replace(/[−–]/g, '-').replace(/\u0304/g, '\u0304');
    s = s.replace(/([A-Za-zα-ωΑ-Ω])\u0304/g, '\\bar{$1}');
    s = s.replace(/\\/g, '');                                   // no stray backslashes
    s = s.replace(/[{}]/g, (m) => '\\' + m).replace(/%/g, '\\%').replace(/#/g, '\\#').replace(/&/g, '\\&').replace(/\$/g, '\\$');
    s = s.replace(SUPRE, (m) => '^{' + protectSlash([...m].map((c) => SUP[c]).join('')) + '}');
    s = s.replace(SUBRE, (m) => '_{' + protectSlash([...m].map((c) => SUB[c]).join('')) + '}');
    // ASCII  x^(...)  x^-3  x^2  x^n  and  x_min  x_1
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '^' && s[i + 1] !== '{') {
        if (s[i + 1] === '(') {
          const j = balancedClose(s, i + 1);
          if (j > 0) { out += '^{' + protectSlash(s.slice(i + 2, j)) + '}'; i = j + 1; continue; }
        }
        const m = /^\^(-?[A-Za-z0-9.]+(?:_[A-Za-z0-9]+)?)/.exec(s.slice(i));
        if (m) { out += '^{' + m[1].replace(/_([A-Za-z0-9]+)/, (x, t) => '_{' + (/^[A-Za-z]{2,}$/.test(t) ? '\\mathrm{' + t + '}' : t) + '}') + '}'; i += m[0].length; continue; }
        out += '\\^{}'; i++; continue;
      }
      if (c === '_' && s[i + 1] === '{') { out += c; i++; continue; }
      if (c === '_' ) {
        const m = /^_([A-Za-z0-9]+)/.exec(s.slice(i));
        if (m) { const t = m[1]; out += '_{' + (/^[A-Za-z]{2,}$/.test(t) ? '\\mathrm{' + t + '}' : t) + '}'; i += m[0].length; continue; }
        out += '\\_'; i++; continue;
      }
      if (c === '*') {
        if (/[A-Za-z]$/.test(out) && s.slice(i + 1, i + 3) === '^{') { out = out.slice(0, -1) + '{' + out[out.length - 1] + '^{*}}'; i++; continue; }
        out += /[A-Za-z)]$/.test(out) ? '^{*}' : '\\ast '; i++; continue;
      }
      out += c; i++;
    }
    s = out;
    // roots  √(...)  ∛(...)  √x  √3  √π
    for (let guard = 0; guard < 40; guard++) {
      const k = s.search(/[√∛]/);
      if (k < 0) break;
      const idx = s[k] === '∛' ? '[3]' : '';
      const rest = s.slice(k + 1);
      if (rest[0] === '(') {
        const j = balancedClose(s, k + 1);
        if (j > 0) { s = s.slice(0, k) + '\\sqrt' + idx + '{' + s.slice(k + 2, j) + '}' + s.slice(j + 1); continue; }
      }
      const m = /^(?:\d+(?:\.\d+)?|[A-Za-z]|[α-ωΑ-Ω])(?:_\{[^}]*\})?(?:\^\{[^}]*\})?/.exec(rest);
      if (m) { s = s.slice(0, k) + '\\sqrt' + idx + '{' + m[0] + '}' + rest.slice(m[0].length); continue; }
      s = s.slice(0, k) + '\\sqrt' + idx + '{}' + rest;
    }
    return s;
  }

  // ---------- stage 2: tight a/b become fractions ----------
  const STOPCH = /[\s+\-=<>,;:·×±∓÷⇒⇔⟺→↔↦∈∉⊂⊆∪∩∖…≤≥≈≠≡]/;
  function unwrap(x) {
    if (x[0] === '(' && balancedClose(x, 0) === x.length - 1) return x.slice(1, -1);
    return x;
  }
  const LBOUND = new Set(['=', '(', '[', ',', ';', ':', '⇒', '→', '≈', '<', '>', '≤', '≥', '⇔']);
  const RBOUND = new Set([')', ']', ',', ';', '=', '⇒', '→', '≈', '<', '>', '≤', '≥', '⇔', '.']);
  function matchOpenBack(s, j) { // index of the opener matching the closer at s[j], or -1
    const c = s[j], o = c === ')' ? '(' : c === ']' ? '[' : '{';
    let d = 0;
    for (let k = j; k >= 0; k--) { if (s[k] === c) d++; else if (s[k] === o) { d--; if (d === 0) return k; } }
    return -1;
  }
  function chunkLeft(s, from, lo) { // start index of the factor chain that ends at s[from]
    let j = from;
    while (j >= lo) {
      const c = s[j];
      if (CLOSE.includes(c)) { const k = matchOpenBack(s, j); if (k < lo) break; j = k - 1; continue; }
      if (OPEN.includes(c) || STOPCH.test(c)) break;
      j--;
    }
    return j + 1;
  }
  function chunkRight(s, from) { // end index (exclusive) of the factor chain that starts at s[from]
    let j = from;
    while (j < s.length) {
      const c = s[j];
      if (OPEN.includes(c)) { const k = balancedClose(s, j); if (k < 0) break; j = k + 1; continue; }
      if (CLOSE.includes(c) || STOPCH.test(c)) break;
      j++;
    }
    return j;
  }
  // brackets inside text that is not part of a top-level fraction: look inside them for fractions
  function deep(s, cmd) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (OPEN.includes(c)) {
        const j = balancedClose(s, i);
        if (j > 0) { out += c + fracs(s.slice(i + 1, j), cmd) + s[j]; i = j; continue; }
      }
      out += c;
    }
    return out;
  }
  function fracs(s, cmd) {
    let res = '', pos = 0, i = 0;
    while (i < s.length) {
      const c = s[i];
      if (OPEN.includes(c)) { const j = balancedClose(s, i); if (j > 0) { i = j + 1; continue; } }
      if (c !== '/') { i++; continue; }
      let a = i - 1, b = i + 1, spaced = false;
      if (s[a] === ' ' && s[b] === ' ') { spaced = true; while (a >= pos && s[a] === ' ') a--; while (b < s.length && s[b] === ' ') b++; }
      else if (a < pos || /\s/.test(s[a]) || b >= s.length || /\s/.test(s[b])) { s = s.slice(0, i) + '\u0004' + s.slice(i + 1); i++; continue; }
      let L = chunkLeft(s, a, pos), R = chunkRight(s, b);
      if (L > a || R <= b) { s = s.slice(0, i) + '\u0004' + s.slice(i + 1); i++; continue; }
      if (spaced) {
        let p = L - 1; while (p >= pos && s[p] === ' ') p--;
        if (p >= pos && s[p] === '-') { let q = p - 1; while (q >= pos && s[q] === ' ') q--; if (q < pos || LBOUND.has(s[q])) { L = p; p = q; } }
        let q = R; while (q < s.length && s[q] === ' ') q++;
        const lok = p < pos || LBOUND.has(s[p]), rok = q >= s.length || RBOUND.has(s[q]);
        if (!(lok && rok)) { s = s.slice(0, i) + '\u0004' + s.slice(i + 1); i++; continue; }
      }
      let N = s.slice(L, a + 1), D = s.slice(b, R), sign = '';
      if (N[0] === '-') { sign = '-'; N = N.slice(1).trim(); }
      if (!N) { s = s.slice(0, i) + '\u0004' + s.slice(i + 1); i++; continue; }
      res += deep(s.slice(pos, L), cmd) + sign + cmd + '{' + fracs(unwrap(N), cmd) + '}{' + fracs(unwrap(D), cmd) + '}';
      pos = R; i = R;
    }
    return res + deep(s.slice(pos), cmd);
  }

  // ---------- stage 3: symbols, functions, spaces, big brackets ----------
  function bigParens(s) {
    const marks = [];
    for (const [o, c] of [['(', ')'], ['[', ']']]) {
      const st = [];
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '\\' && (s[i + 1] === '{' || s[i + 1] === '}')) { i++; continue; }
        if (s[i] === o) st.push(i);
        else if (s[i] === c && st.length) {
          const a = st.pop();
          if (/\\d?frac/.test(s.slice(a, i))) marks.push([a, i]);
        }
      }
    }
    if (!marks.length) return s;
    const openAt = new Set(marks.map((m) => m[0])), closeAt = new Set(marks.map((m) => m[1]));
    let out = '';
    for (let i = 0; i < s.length; i++) {
      out += openAt.has(i) ? '\\left' + s[i] : closeAt.has(i) ? '\\right' + s[i] : s[i];
    }
    return out;
  }
  function post(s) {
    s = s.replace(/ {2,}/g, '\u0005').replace(/([,;]) /g, '$1\u0006').replace(/(\d) (?=\d)/g, '$1\u0006').replace(/(\d) (?=[A-Za-z])/g, '$1\\,');
    s = s.replace(SYMRE, (c) => SYM[c]);
    s = s.replace(FN_RE, (m, f) => (new RegExp('^(?:' + NATIVE_FN + ')$').test(f) ? '\\' + f + ' ' : '\\operatorname{' + f + '}'));
    s = s.replace(/([A-Za-z0-9}\)])\s+(d[xyztus]|d\\theta)(?![A-Za-z])/g, '$1\\,$2');
    s = s.replace(/\^\{\\circ\}\s*([CF])(?![A-Za-z])/g, '^{\\circ}\\mathrm{$1}').replace(/\{\}\^\{\\circ\}/g, (m, off, str) => (off > 0 && /[0-9A-Za-z}\)]$/.test(str.slice(0, off)) ? '^{\\circ}' : m));
    s = s.replace(/\u0005/g, '\\quad ').replace(/\u0006/g, '\\ ');
    s = s.replace(/\u0002/g, '/').replace(/\u0004/g, '/');
    return s;
  }
  function toTex(core, display) {
    return post(bigParens(fracs(pre(core), display ? '\\dfrac' : '\\frac')));
  }

  // ---------- segmentation of a text line ----------
  function peelEdges(run) {
    let pre_ = '', post_ = '', s = run;
    for (let n = 0; n < 60; n++) {
      const before = s;
      let m = /^[\s•✓✗—–─:;,.!?"“”‘’]+/.exec(s); if (m) { pre_ += m[0]; s = s.slice(m[0].length); }
      m = /[\s•✓✗—–─:;,.!?"“”‘’]+$/.exec(s); if (m) { post_ = m[0] + post_; s = s.slice(0, s.length - m[0].length); }
      if (s[0] === '(' || s[0] === '[') { if (balancedClose(s, 0) < 0) { pre_ += s[0]; s = s.slice(1); } }
      if (s.length && (s[s.length - 1] === ')' || s[s.length - 1] === ']')) {
        const cl = s[s.length - 1], op = cl === ')' ? '(' : '[';
        let d = 0, ok = false;
        for (let j = s.length - 1; j >= 0; j--) { if (s[j] === cl) d++; else if (s[j] === op) { d--; if (d === 0) { ok = true; break; } } }
        if (!ok) { post_ = cl + post_; s = s.slice(0, -1); }
      }
      if (s[0] === ')' || s[0] === ']') { pre_ += s[0]; s = s.slice(1); }
      if (s.length && (s[s.length - 1] === '(' || s[s.length - 1] === '[')) { post_ = s[s.length - 1] + post_; s = s.slice(0, -1); }
      if (s === before) break;
    }
    return [pre_, s, post_];
  }
  function peelMarker(core) { // "1) ", "2. ", "(a) " list markers stay plain text
    const m = /^(?:\d{1,2}[.)]|\([a-z]\)|[a-z]\))\s+(?=\S)/.exec(core);
    return m ? [m[0], core.slice(m[0].length)] : ['', core];
  }
  function runSegments(run, lang, out, hyphenAfter) {
    if (!run) return;
    // text-only separators inside a run
    if (TEXTSPLIT.test(run)) {
      run.split(TEXTSPLIT).forEach((p, i, arr) => { if (p) { if (i % 2 === 1) out.push({ k: 't', v: p }); else runSegments(p, lang, out, !!hyphenAfter && i === arr.length - 1); } });
      return;
    }
    // Turkish/English suffix after an apostrophe:  x'ten  f'(x)'i  (x's)
    const sufRe = lang === 'tr' ? /'([eaıiuüoö])(?![A-Za-z0-9ÇĞİıÖŞÜçğöşü(])/ : /'([eaıiuüoös])(?![A-Za-z0-9ÇĞİıÖŞÜçğöşü(])/;
    let m = sufRe.exec(run);
    if (m && m.index > 0 && /[A-Za-z0-9)}\]⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱˣʸ₀-₉°]/.test(run[m.index - 1])) {
      runSegments(run.slice(0, m.index), lang, out, false);
      out.push({ k: 't', v: m[0] });
      runSegments(run.slice(m.index + m[0].length), lang, out, hyphenAfter);
      return;
    }
    let tail = '';
    if (hyphenAfter && /'$/.test(run)) { run = run.slice(0, -1); tail = "'"; }
    else if (hyphenAfter && /[A-Za-z0-9)]-$/.test(run)) { run = run.slice(0, -1); tail = '-'; }
    const [p0, rest, p2] = peelEdges(run);
    const [mk, core] = peelMarker(rest);
    if (p0 + mk) out.push({ k: 't', v: p0 + mk });
    if (core) {
      let isMath = STRONG.test(core);
      if (isMath && lang === 'en' && /^(?:a|I)$/.test(core)) isMath = false;
      if (isMath && /^[A-Za-z]$/.test(core) === false && !/[A-Za-z\u0304=<>≤≥≈≠≡∈∉⊂⊆∪∩∞∫√∛^\/α-ωΑ-Ωπ±∓×÷⇒⇔→↔⟺∑∏∂∇′″‴∘∅½¾⌊⌋⌈⌉⊥⟂∝≪≫↗↘↦ℝℕℤℚℂ…⁰-⁹⁺-⁾ⁿ₀-₎ₐ-ₜᵃ-ᶻ꜀*]/.test(core)) isMath = false;
      out.push(isMath ? { k: 'm', v: core } : { k: 't', v: core });
    }
    if (p2 + tail) out.push({ k: 't', v: p2 + tail });
  }
  function segments(line, lang) {
    lang = lang || 'tr';
    const WORD = new RegExp('([A-Za-zα-ωΑ-Ω][′\']*_[A-Za-z0-9]+)|([' + LET + ']{2,})', 'g');
    const words = []; let m;
    while ((m = WORD.exec(line)) !== null) {
      if (m[1]) continue;                                   // x_min, D_max ... stay inside the maths run
      const w = m[2];
      if (MATHWORD.test(w)) continue;
      words.push({ i: m.index, w });
    }
    const hasMathy = /[=<>≤≥≈≠\d]/.test(line);
    // short words glued to an operator (F = mg, y = ax) are variables, not words; ALL-CAPS 2-3 letters are point/segment names
    const keep = words.filter((x) => {
      const w = x.w;
      if (w.length > 3 || STOP.has(w.toLowerCase()) || !/^[A-Za-z]+$/.test(w)) return true;
      if (/^[A-Z]{2,3}$/.test(w) && hasMathy) return false;
      let a = x.i - 1; while (a >= 0 && line[a] === ' ') a--;
      let b = x.i + w.length; while (b < line.length && line[b] === ' ') b++;
      return !((a >= 0 && OPCH.test(line[a])) || (b < line.length && OPCH.test(line[b])));
    });
    const out = []; let last = 0;
    keep.forEach((x) => {
      runSegments(line.slice(last, x.i), lang, out, true);
      out.push({ k: 't', v: x.w });
      last = x.i + x.w.length;
    });
    runSegments(line.slice(last), lang, out, false);
    // merge neighbours of the same kind
    const merged = [];
    out.forEach((s) => { const l = merged[merged.length - 1]; if (l && l.k === s.k && s.k === 't') l.v += s.v; else merged.push({ k: s.k, v: s.v }); });
    return merged;
  }
  function isEquation(segs) {
    const ms = segs.filter((s) => s.k === 'm');
    if (ms.length !== 1) return false;
    return segs.every((s) => s.k === 'm' || /^[\s.,;:]*$/.test(s.v));
  }
  // HTML string for a text (quiz questions, options, solutions, printed papers): maths typeset with KaTeX, the rest escaped.
  const escH = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function html(text, lang) {
    if (typeof katex === 'undefined') return escH(text).replace(/\n/g, '<br>');
    lang = lang || (typeof I18N !== 'undefined' && !I18N.get() ? 'en' : 'tr');
    return String(text).split('\n').map((line) => {
      const segs = segments(line, lang);
      const letters = segs.filter((s) => s.k === 't').map((s) => s.v).join('').replace(/[^A-Za-zÀ-ɏ]/g, '').length;
      return segs.map((s) => {
        if (s.k === 't') return escH(s.v);
        try { return katex.renderToString(toTex(s.v, letters <= 6), { throwOnError: false, strict: 'ignore', trust: false }); } catch (e) { return escH(s.v); }
      }).join('');
    }).join('<br>');
  }
  return { segments, isEquation, toTex, html, _pre: pre };
})();
if (typeof module !== 'undefined') module.exports = Typeset;
