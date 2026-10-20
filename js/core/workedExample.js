// Renders one "worked example" topic: left concept panel, centre graph, right-hand live
// controls, and a bottom step-by-step panel revealed one step at a time. Mirrors
// Core/WorkedExampleControlBase.vb (including the gradual step reveal added later).
//
// Topic contract (see js/topics/numbers/*.js for real examples):
//   {
//     tabTitle: () => string,                 // re-evaluated on every render (language can change)
//     concept: (problem) => string,            // left-column text; multi-line, may depend on problem
//     problemStatement: (problem) => string,   // OPTIONAL: the question to attempt (given data + what to find, NO answer); shown in an always-visible 'SORU' card above the concept, refreshed live
//     createProblem: (rng) => object,
//     solveSteps: (problem) => string[],
//     draw: (canvas, problem) => void,          // canvas is a GraphCanvas; call its add*() methods
//     buildControls: (rightColEl, getProblem, helpers) => void,   // optional
//   }
//
// helpers passed to buildControls:
//   addSlider({caption, min, max, step, get, set})
//   addCheckbox({caption, get, set})
//   addRadioGroup({name, options: [{label, value}], get, set})
//   addSelect({options: [{label, value}], get, set})
//   refresh()      // re-run solveSteps/draw for the CURRENT problem (call after a control changes it)
//   regenerate()   // same as pressing "New Example"
//
// mountWorkedExample(hostEl, topicDef) returns { destroy() }.

// The last example of every tab is remembered, so coming back to a tab shows the same example (same numbers, same solution state).
const WE_SAVED = new WeakMap();

function mountWorkedExample(host, def) {
  const rng = new Rng();
  const saved = WE_SAVED.get(def);
  // every generated example comes from a seed; its 5-character ID (e.g. K7M2P) recreates the same example (same tab settings)
  const freshProblem = (seed) => { rng.reseed(seed); return def.createProblem(rng); };
  const seed0 = saved && saved.seed !== undefined ? saved.seed : Rng.newSeed();
  const state = saved ? { problem: saved.problem, seed: saved.seed, revealCount: saved.revealCount, stepsVisible: saved.stepsVisible } : { problem: freshProblem(seed0), seed: seed0, revealCount: 1, stepsVisible: false };
  const sliders = [];
  const ctrls = [];

  host.innerHTML = `
    <div class="we-root">
      <div class="we-top">
        <div class="we-col-left">
          <h3 data-role="conceptHeading"></h3>
          <div class="we-concept" data-role="concept"></div>
        </div>
        <div class="we-col-center${def.drawSchematic ? ' we-dual' : ''}">${def.drawSchematic
          ? '<div class="we-pane"><canvas></canvas></div><div class="we-pane we-pane-schem"><canvas class="we-schem"></canvas></div>'
          : '<canvas></canvas>'}</div>
        <div class="we-col-right">
          <div class="we-problem" data-role="problemCard" style="display:none">
            <h3 data-role="problemHeading"></h3>
            <div class="we-problem-text" data-role="problemText"></div>
            <div class="we-pid" data-role="pidRow"><span class="we-pid-lbl"></span> <b class="we-pid-id"></b> <input class="we-pid-in" type="text" maxlength="6" autocomplete="off" spellcheck="false"><button type="button" class="flat-btn we-pid-go"></button></div>
          </div>
          <h3 data-role="controlsHeading"></h3>
          <div data-role="controlsHost"></div>
          <div class="we-btn-block">
            <button class="flat-btn primary" data-role="newExampleBtn"></button>
            <button class="flat-btn" data-role="toggleStepsBtn"></button>
          </div>
          <div data-role="toolsHost"></div>
          <div data-role="aiHost"></div>
        </div>
      </div>
      <div class="we-steps-panel" data-role="stepsPanel">
        <div class="we-steps-header">
          <h3 data-role="stepsHeading"></h3>
          <button class="flat-btn" data-role="nextStepBtn"></button>
          <button class="flat-btn" data-role="showAllBtn"></button>
          <span class="we-steps-counter" data-role="counter"></span>
        </div>
        <div data-role="stepsList"></div>
      </div>
    </div>
  `;

  const q = (role) => host.querySelector(`[data-role="${role}"]`);
  const problemCard = q('problemCard');
  const problemHeading = q('problemHeading');
  const problemText = q('problemText');
  const conceptHeading = q('conceptHeading');
  const conceptEl = q('concept');
  const ai = AIPrompt.mountButtons(q('aiHost'),
    () => AIPrompt.buildTopic(def.tabTitle(), def.concept(state.problem)),
    () => AIPrompt.buildQuestion(def.tabTitle(), def.problemStatement ? def.problemStatement(state.problem) : '', def.solveSteps(state.problem)));
  // in fit-to-window mode the sliders and the New Example / Show Steps buttons float over the graph
  const centerEl = host.querySelector('.we-col-center');
  const ctrlHeadingEl = q('controlsHeading'), ctrlHostEl = q('controlsHost'), btnBlockEl = host.querySelector('.we-btn-block');
  let floatEl = null;
  host.addEventListener('gzfull', (e) => {
    const pane = e.target.closest('.we-pane') || centerEl;
    if (pane.classList.contains('we-pane-schem')) return;
    if (e.detail.on) {
      floatEl = document.createElement('div'); floatEl.className = 'gz-float';
      floatEl.appendChild(ctrlHostEl); floatEl.appendChild(btnBlockEl); pane.appendChild(floatEl);
    } else if (floatEl) {
      ctrlHeadingEl.after(ctrlHostEl); ctrlHostEl.after(btnBlockEl); floatEl.remove(); floatEl = null;
    }
  });
  const tools = SlideTools.mount(q('toolsHost'), { host });
  // White board: a button (icon only) in the top-right corner of the graph area turns the whole graph area plain white,
  // so the teacher / students can write on it (the pen of the right-hand drawing tools writes over it). Press again to bring the graph back.
  const boardCol = host.querySelector('.we-col-center');
  const boardEl = document.createElement('div');
  boardEl.className = 'we-board';
  const boardBtn = document.createElement('button');
  boardBtn.type = 'button';
  boardBtn.className = 'we-board-btn';
  boardBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21l2-4M16 21l-2-4"/><path d="M8 12l3-3 2 2 3-3"/></svg>';
  boardBtn.addEventListener('click', () => { const on = boardCol.classList.toggle('board-on'); boardBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  boardCol.appendChild(boardEl);
  boardCol.appendChild(boardBtn);
  const boardTitle = () => { boardBtn.title = I18N.tx('Beyaz tahta aç/kapat', 'Toggle white board'); boardBtn.setAttribute('aria-label', boardBtn.title); };
  boardTitle();
  // Predict-then-check card (topic def.challenge = { title?, prompt(p), target(p), tol(p), hint?(p, guess), format?(v) }):
  // the student types a number first; the program judges it (like the epsilon-delta verdict) and only then the solution is needed.
  let chEl = null, chKey = '';
  const chTries = { n: 0, solved: false, revealed: false };
  if (def.challenge) {
    chEl = document.createElement('div');
    chEl.className = 'we-challenge';
    chEl.innerHTML = '<h3 class="we-ch-title"></h3><div class="we-ch-prompt"></div><div class="we-ch-row"><input class="we-ch-input" type="text" inputmode="decimal" autocomplete="off"><button type="button" class="flat-btn primary we-ch-check"></button></div><div class="we-ch-msg" role="status" aria-live="polite"></div>';
    const bb = host.querySelector('.we-btn-block');
    bb.parentNode.insertBefore(chEl, bb);
    const inp = chEl.querySelector('.we-ch-input'), msg = chEl.querySelector('.we-ch-msg');
    const parse = (s) => {
      s = String(s).trim().replace(/−/g, '-').replace(',', '.');
      const m = /^(-?[\d.]+)\s*\/\s*(-?[\d.]+)$/.exec(s);
      if (m) return parseFloat(m[1]) / parseFloat(m[2]);
      return /^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
    };
    const fmt = (v) => (def.challenge.format ? def.challenge.format(v) : String(fmt2(v)).replace('-', '−'));
    const say = (txt, cls) => { msg.className = 'we-ch-msg ' + (cls || ''); msg.textContent = txt; };
    const check = () => {
      const g = parse(inp.value);
      if (!Number.isFinite(g)) { say(I18N.tx('Bir sayı ya da kesir yazalım (örn. 2,5 veya 3/4).', 'Let\'s type a number or fraction (e.g. 2.5 or 3/4).'), 'warn'); return; }
      const tgt = def.challenge.target(state.problem), tol = def.challenge.tol(state.problem);
      if (Math.abs(g - tgt) <= tol) { chTries.solved = true; say(I18N.tx(`✔ Doğru! Cevap ≈ ${fmt(tgt)}. Çözümü açıp adımları kendi yaklaşımımızla karşılaştırabiliriz.`, `✔ Correct! The answer is ≈ ${fmt(tgt)}. We can open the solution and compare the steps with our own approach.`), 'ok'); return; }
      chTries.n++;
      let t = Math.abs(g - tgt) <= 4 * tol ? I18N.tx('Çok yaklaştık, bir daha deneyelim.', 'Very close, let\'s try once more.') : I18N.tx('Henüz değil, bir daha deneyelim.', 'Not yet, let\'s try again.');
      const h = def.challenge.hint ? def.challenge.hint(state.problem, g) : '';
      if (h) t += ' ' + h;
      if (chTries.n >= 3) { chTries.revealed = true; t += ' ' + I18N.tx(`(Cevap ≈ ${fmt(tgt)}.)`, `(The answer is ≈ ${fmt(tgt)}.)`); }
      say(t, 'bad');
    };
    chEl.querySelector('.we-ch-check').addEventListener('click', check);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  }
  function renderChallenge() {
    if (!chEl) return;
    let prompt = '';
    try { prompt = def.challenge.prompt(state.problem); } catch (e) { prompt = ''; }
    chEl.querySelector('.we-ch-title').textContent = def.challenge.title ? I18N.tx(def.challenge.title[0], def.challenge.title[1]) : I18N.tx('🎯 Önce tahmin edelim', '🎯 Let\'s predict first');
    chEl.querySelector('.we-ch-check').textContent = I18N.tx('Kontrol et', 'Check');
    chEl.querySelector('.we-ch-input').setAttribute('aria-label', I18N.tx('Tahminimiz', 'Our prediction'));
    setRich(chEl.querySelector('.we-ch-prompt'), prompt);
    const key = prompt;
    if (key !== chKey) { chKey = key; chTries.n = 0; chTries.solved = false; chTries.revealed = false; chEl.querySelector('.we-ch-input').value = ''; chEl.querySelector('.we-ch-msg').textContent = ''; chEl.querySelector('.we-ch-msg').className = 'we-ch-msg'; }
  }
  if (chEl) { const refresh1 = refreshDisplay; refreshDisplay = function () { refresh1(); renderChallenge(); }; }
  // optional 3D view of the same example (topic def.view3d): "3B / 2B" button next to the white-board button
  let v3 = null;
  if (def.view3d && typeof View3D !== 'undefined') {
    v3 = View3D.mount(boardCol, def, () => state.problem);
    const refresh0 = refreshDisplay;
    refreshDisplay = function () { refresh0(); v3.update(); };
  }
  const controlsHeading = q('controlsHeading');
  const controlsHost = q('controlsHost');
  const newExampleBtn = q('newExampleBtn');
  const toggleStepsBtn = q('toggleStepsBtn');
  const stepsPanel = q('stepsPanel');
  const stepsHeading = q('stepsHeading');
  const nextStepBtn = q('nextStepBtn');
  const showAllBtn = q('showAllBtn');
  const counterEl = q('counter');
  const stepsListEl = q('stepsList');
  const canvasEl = host.querySelector('.we-col-center canvas');
  const canvas = new GraphCanvas(canvasEl);
  const schemEl = host.querySelector('canvas.we-schem');
  const schem = schemEl ? new Schematic(schemEl) : null;
  // side-by-side panels need room: stack them vertically when the centre column is narrow
  let stackRo = null;
  if (schem) {
    const ctr = host.querySelector('.we-col-center');
    stackRo = new ResizeObserver(() => { ctr.classList.toggle('we-stack', ctr.getBoundingClientRect().width < 480); });
    stackRo.observe(ctr);
  }
  // Numbers, Functions and Trigonometry keep the Cartesian axes fixed and centred on the page (the point moves, not the axes)
  const fixedAxes = true; // every chapter: the Cartesian system stays fixed and centred; the objects move on it
  canvas.centerOrigin = fixedAxes;
  canvas.enableInteraction();

  function getProblem() { return state.problem; }

  // ---- generic control builders (mirrors WorkedExampleControlBase's AddSlider et al.) ----

  function addSlider(opts) {
    const block = document.createElement('div');
    block.className = 'we-slider-block';
    const caption = document.createElement('div');
    caption.className = 'we-slider-caption';
    caption.textContent = opts.caption;
    const valueLabel = document.createElement('div');
    valueLabel.className = 'we-slider-value';
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'we-slider';
    input.min = '0'; input.max = '1000'; input.step = '1';
    input.setAttribute('aria-label', opts.caption);
    block.appendChild(caption);
    block.appendChild(valueLabel);
    block.appendChild(input);
    controlsHost.appendChild(block);

    const reg = { input, valueLabel, get: opts.get, set: opts.set, min: opts.min, max: opts.max };
    sliders.push(reg);
    syncOneSlider(reg);

    input.addEventListener('input', () => {
      const ratio = Number(input.value) / 1000;
      let v = opts.min + ratio * (opts.max - opts.min);
      if (opts.step) v = Math.round(v / opts.step) * opts.step;
      opts.set(v);
      valueLabel.textContent = fmt2(opts.get());
      refreshDisplay();
    });
    return reg;
  }

  function addCheckbox(opts) {
    const row = document.createElement('label');
    row.className = 'we-checkbox-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!opts.get();
    const span = document.createElement('span');
    span.textContent = opts.caption;
    row.appendChild(input);
    row.appendChild(span);
    controlsHost.appendChild(row);
    input.addEventListener('change', () => { opts.set(input.checked); refreshDisplay(); });
    return { input, refreshFromModel: () => { input.checked = !!opts.get(); } };
  }

  function addRadioGroup(opts) {
    const wrap = document.createElement('div');
    const inputs = [];
    opts.options.forEach((o, i) => {
      const row = document.createElement('label');
      row.className = 'we-radio-row';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = opts.name || ('rg-' + Math.random().toString(36).slice(2));
      input.checked = opts.get() === o.value;
      const span = document.createElement('span');
      span.textContent = o.label;
      row.appendChild(input);
      row.appendChild(span);
      wrap.appendChild(row);
      inputs.push({ input, value: o.value });
      input.addEventListener('change', () => { if (input.checked) { opts.set(o.value); refreshDisplay(); } });
    });
    controlsHost.appendChild(wrap);
    return { refreshFromModel: () => { const v = opts.get(); inputs.forEach((r) => { r.input.checked = r.value === v; }); } };
  }

  function addSelect(opts) {
    const select = document.createElement('select');
    select.className = 'we-select';
    opts.options.forEach((o) => {
      const el = document.createElement('option');
      el.value = String(o.value);
      el.textContent = o.label;
      select.appendChild(el);
    });
    select.value = String(opts.get());
    controlsHost.appendChild(select);
    select.addEventListener('change', () => {
      const raw = select.value;
      const match = opts.options.find((o) => String(o.value) === raw);
      opts.set(match ? match.value : raw);
      refreshDisplay();
    });
    return { select, refreshFromModel: () => { select.value = String(opts.get()); } };
  }

  function syncOneSlider(reg) {
    const v = reg.get();
    reg.valueLabel.textContent = fmt2(v);
    const ratio = (v - reg.min) / (reg.max - reg.min);
    reg.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }

  function resyncControls() {
    sliders.forEach(syncOneSlider);
    ctrls.forEach((c) => { try { c.refreshFromModel(); } catch (e) { /* ignore */ } });
  }

  // ---- steps ----

  // Rich text: with `math: true` the topic writes formulas as $...$ (inline) or $$...$$ (display); KaTeX typesets them.
  const useMath = !!def.math && typeof katex !== 'undefined';
  function texInto(el, tex, display) {
    try { katex.render(tex, el, { displayMode: !!display, throwOnError: false, strict: 'ignore', trust: false }); } catch (e) { el.textContent = tex; }
  }
  function setRich(el, text) {
    if (autoMath) { fillAuto(el, text); return; }
    if (!useMath) { el.textContent = text; return; }
    el.textContent = '';
    const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = document.createElement(m[1] !== undefined ? 'div' : 'span');
      span.className = m[1] !== undefined ? 'we-tex-block' : 'we-tex';
      texInto(span, m[1] !== undefined ? m[1] : m[2], m[1] !== undefined);
      el.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
  }
  // Topic text ("Konu"): ALL-CAPS lines are section headings -> numbered, bold, one point larger; the rest is normal text.
  function isHeading(line, first) {
    if (first && line.length <= 80 && /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ \-']{5,}/.test(line) && !/[=•$:]/.test(line) && !/[a-zçğıöşü]/.test(line.replace(/\([^)]*\)/g, ''))) return true;
    if (!line || /^\s/.test(line) || /[a-zçğıöşüâîû]/.test(line) || /[=•]/.test(line)) return false;
    return (line.match(/[A-ZÇĞİÖŞÜ]/g) || []).length >= 3;
  }
  function openLinked(lk) {
    if (lk.tab) { if (window.AppNav) window.AppNav.goto(lk.tab); return; }
    const p = lk.make(rng, state.problem);
    if (!p) return;
    state.problem = p; state.seed = undefined; state.revealCount = 1;
    resyncControls(); probeScale(); refreshDisplay();
    problemCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    problemCard.classList.add('we-flash'); setTimeout(() => problemCard.classList.remove('we-flash'), 1200);
  }
  function setConcept(el, text) {
    el.textContent = '';
    let n = 0, buf = [];
    const flush = () => {
      while (buf.length && !buf[0].trim()) buf.shift();
      while (buf.length && !buf[buf.length - 1].trim()) buf.pop();
      if (buf.length) { const d = document.createElement('div'); setRich(d, buf.join('\n')); el.appendChild(d); }
      buf = [];
    };
    // def.links: [{ match: RegExp, make(rng, current) -> problem }]. A concept line / heading that matches gets a small
    // "▶ Soru" link; pressing it fills the SORU card, graph and solution with an example of exactly that sub-topic.
    const linkFor = (line) => (def.links || []).find((l) => l.match.test(line));
    const addLink = (host, lk) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'we-link'; b.textContent = lk.tab ? I18N.tx('↗ Sekmeyi aç', '↗ Open tab') : I18N.tx('▶ Soru', '▶ Question');
      b.title = I18N.tx('Bu konudan örnek soru aç', 'Open an example question on this topic');
      b.addEventListener('click', () => openLinked(lk));
      host.appendChild(b);
    };
    String(text).split('\n').forEach((line, li) => {
      const lk = linkFor(line);
      if (isHeading(line.trim(), li === 0) && line === line.trim()) {
        flush();
        const h = document.createElement('div');
        h.className = 'we-h';
        h.textContent = `${++n}. ${line}`;
        if (lk) addLink(h, lk);
        el.appendChild(h);
      } else if (lk) {
        flush();
        const d = document.createElement('div');
        d.className = 'we-linkline';
        setRich(d, line);
        addLink(d, lk);
        el.appendChild(d);
      } else {
        // run-in heading: "TANIM: text ..." or "ÖZEL HALLER (hazır kalıplar):" -> heading line, the rest stays as text
        const m = /^([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ \-\/']{2,}(?: \([^)]*\))?):(?:\s+(.*))?$/.exec(line);
        if (m && !/[=•$]/.test(m[1])) {
          flush();
          const h = document.createElement('div');
          h.className = 'we-h';
          h.textContent = `${++n}. ${m[1]}:`;
          el.appendChild(h);
          if (m[2]) buf.push(m[2]);
        } else buf.push(line);
      }
    });
    flush();
  }
  // Math solution: [{ title, lines: [{ tex, note }] }] - every equation typeset, a short note under each
  function renderMathSteps(steps) {
    stepsListEl.innerHTML = '';
    steps.forEach((st) => {
      const card = document.createElement('div');
      card.className = 'we-step-card we-math-card';
      const title = document.createElement('div');
      title.className = 'we-math-title';
      title.textContent = st.title;
      card.appendChild(title);
      st.lines.forEach((ln) => {
        if (ln.tex) { const eq = document.createElement('div'); eq.className = 'we-math-eq'; texInto(eq, ln.tex, true); card.appendChild(eq); }
        if (ln.note) { const nt = document.createElement('div'); nt.className = 'we-math-note'; setRich(nt, ln.note); card.appendChild(nt); }
      });
      stepsListEl.appendChild(card);
    });
    counterEl.textContent = '';
    nextStepBtn.style.display = 'none';
    showAllBtn.style.display = 'none';
  }

  // Automatic typesetting: topics that keep plain-text maths get their text converted by Typeset (see js/core/typeset.js)
  const autoMath = !def.math && typeof katex !== 'undefined' && typeof Typeset !== 'undefined';
  const curLang = () => (I18N.get() ? 'tr' : 'en');
  function appendInline(el, segs, big) {
    segs.forEach((s) => {
      if (s.k === 't') { el.appendChild(document.createTextNode(s.v)); return; }
      const span = document.createElement('span');
      span.className = 'we-tex';
      texInto(span, Typeset.toTex(s.v, big), false);
      el.appendChild(span);
    });
  }
  function textLetters(segs) { return segs.filter((s) => s.k === 't').map((s) => s.v).join('').replace(/[^A-Za-zÀ-ɏ]/g, '').length; }
  function fillAuto(el, text) {
    el.textContent = '';
    const lang = curLang();
    String(text).split('\n').forEach((line, i, arr) => {
      const segs = Typeset.segments(line, lang);
      appendInline(el, segs, textLetters(segs) <= 6);
      if (i < arr.length - 1) el.appendChild(document.createTextNode('\n'));
    });
  }
  const ANS_TITLE = /^\s*(?:\d+\)\s*)?(?:Sonuç|Cevap|Yanıt|Çözüm\b|Result|Answer|Solution\b|Final|Conclusion)/i;
  const ANS_LINE = /^\s*(?:\d+[.)]\s*)?(?:Cevap|Yanıt|Sonuç|Answer|Result)\b/i;
  const NOT_ANS = /kontrol|yorum|grafik|dikkat|hata|sayısal|doğrulama|sağlama|kaydırıcı|ipucu|check|comment|interpretation|graph|pitfall|mistake|numeric|verif|slider|note|tip|warning/i;
  function parseStep(st, i) {
    const lines = String(st).split('\n');
    const m = /^[─\-]{2,}\s*(.+?)\s*[─\-]{2,}\s*$/.exec(lines[0]);
    if (m) return { title: m[1], body: lines.slice(1) };
    return { title: '', body: lines, num: i + 1 };
  }
  function renderAutoSteps(steps) {
    stepsListEl.innerHTML = '';
    const lang = curLang();
    const parsed = steps.map(parseStep);
    let ansIdx = parsed.findIndex((p) => p.title && ANS_TITLE.test(p.title));
    const lineMarked = parsed.some((p) => p.body.some((l) => ANS_LINE.test(l)));
    if (ansIdx < 0 && !lineMarked) {
      for (let i = parsed.length - 1; i >= 0; i--) {
        const p = parsed[i];
        const head = p.title || p.body.join(' ');
        if (!NOT_ANS.test(head)) { ansIdx = i; break; }
      }
    }
    parsed.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'we-step-card we-math-card' + (i === ansIdx ? ' we-answer' : '');
      if (p.title) {
        const t = document.createElement('div');
        t.className = 'we-math-title';
        appendInline(t, Typeset.segments(p.title, lang), false);
        card.appendChild(t);
      }
      p.body.forEach((line, li) => {
        if (!line.trim()) return;
        const text = p.num && li === 0 ? p.num + '. ' + line : line;
        const segs = Typeset.segments(text, lang);
        const ansLine = ANS_LINE.test(line);
        if (Typeset.isEquation(segs)) {
          const eq = document.createElement('div');
          eq.className = 'we-math-eq' + (ansLine ? ' we-ans-line' : '');
          const core = segs.find((s) => s.k === 'm').v;
          const tail = segs.filter((s) => s.k === 't').map((s) => s.v).join('').replace(/\s+/g, '');
          texInto(eq, Typeset.toTex(core, true) + tail, true);
          card.appendChild(eq);
        } else {
          const ln = document.createElement('div');
          ln.className = 'we-auto-line' + (ansLine ? ' we-ans-line' : '');
          appendInline(ln, segs, textLetters(segs) <= 6);
          card.appendChild(ln);
        }
      });
      stepsListEl.appendChild(card);
    });
    counterEl.textContent = '';
    nextStepBtn.style.display = 'none';
    showAllBtn.style.display = 'none';
  }

  function renderSteps(steps) {
    stepsListEl.innerHTML = '';
    const n = Math.max(1, Math.min(state.revealCount, steps.length));
    for (let i = 0; i < n; i++) {
      const card = document.createElement('div');
      card.className = 'we-step-card';
      card.textContent = `${i + 1}. ${steps[i]}`;
      stepsListEl.appendChild(card);
    }
    counterEl.textContent = `${I18N.tx('Adım', 'Step')} ${n} / ${steps.length}`;
    nextStepBtn.disabled = n >= steps.length;
  }

  // ---- main refresh (mirrors RefreshDisplay) ----

  let lastSteps = [];
  function refreshDisplay() {
    if (typeof showPid === 'function') showPid();
    setConcept(conceptEl, def.concept(state.problem));
    const statement = def.problemStatement ? def.problemStatement(state.problem) : '';
    setRich(problemText, statement || '');
    problemCard.style.display = statement ? 'block' : 'none';
    canvas.clear();
    def.draw(canvas, state.problem);
    // centre the graph on the point being asked for / investigated (topics provide focus(p) -> {x, y})
    let fp = null;
    try { fp = (def.focus && !fixedAxes) ? def.focus(state.problem) : null; } catch (e) { fp = null; }
    canvas.setFocus(fp ? fp.x : null, fp ? fp.y : null);
    canvas.render();
    if (schem && def.drawSchematic) { schem.clear(); def.drawSchematic(schem, state.problem); schem.render(); }
    // accessibility: the canvas is a picture, so give it a text alternative; sliders announce their value
    try {
      const cv = canvas.canvas;
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', (statement ? statement.replace(/\s+/g, ' ').slice(0, 220) + ' — ' : '') + canvas.describe());
      if (schem && schem.canvas) { schem.canvas.setAttribute('role', 'img'); schem.canvas.setAttribute('aria-label', I18N.tx('Şematik çizim: ', 'Schematic drawing: ') + (statement ? statement.replace(/\s+/g, ' ').slice(0, 160) : '')); }
      sliders.forEach((s) => s.input.setAttribute('aria-valuetext', s.valueLabel.textContent));
    } catch (e) { /* never block drawing */ }
    if (useMath && def.solveMath) { lastSteps = def.solveMath(state.problem); renderMathSteps(lastSteps); return; }
    if (autoMath) { lastSteps = def.solveSteps(state.problem); renderAutoSteps(lastSteps); return; }
    lastSteps = def.solveSteps(state.problem);
    state.revealCount = Math.max(1, Math.min(state.revealCount, lastSteps.length));
    renderSteps(lastSteps);
  }

  // The Cartesian window is fixed (see graph.js): so that it already fits every slider position of the current example,
  // draw once with each slider at its minimum / middle / maximum (the window only ever grows), then restore the values.
  function probeScale() {
    if (!canvas.centerOrigin || !sliders.length) return;
    const saved = sliders.map((s) => { try { return s.get(); } catch (e) { return undefined; } });
    sliders.forEach((s) => {
      if (!isFinite(s.min) || !isFinite(s.max)) return;
      [s.min, (s.min + s.max) / 2, s.max].forEach((v) => { try { s.set(v); canvas.clear(); def.draw(canvas, state.problem); } catch (e) { /* ignore */ } });
    });
    sliders.forEach((s, i) => { if (saved[i] !== undefined) { try { s.set(saved[i]); } catch (e) { /* ignore */ } } });
    canvas.clear();
  }

  function generateNewExample(seed) {
    state.seed = typeof seed === 'number' ? seed : Rng.newSeed();
    state.problem = freshProblem(state.seed);
    state.revealCount = 1;
    resyncControls();
    probeScale();
    refreshDisplay();
  }

  // ---- static text (re-applied on language change) ----

  function applyTexts() {
    boardTitle();
    problemHeading.textContent = I18N.tx('SORU', 'PROBLEM');
    conceptHeading.textContent = I18N.tx('Konu', 'Topic');
    controlsHeading.textContent = I18N.tx('Kontroller', 'Controls');
    newExampleBtn.textContent = I18N.tx('Yeni Örnek Üret', 'Generate New Example');
    toggleStepsBtn.textContent = state.stepsVisible
      ? I18N.tx('Adım Adım Çözümü Gizle', 'Hide Step-by-Step Solution')
      : I18N.tx('Adım Adım Çözümü Göster', 'Show Step-by-Step Solution');
    stepsHeading.textContent = I18N.tx('Adım Adım Çözüm', 'Step-by-Step Solution');
    nextStepBtn.textContent = I18N.tx('Sonraki adım ▸', 'Next step ▸');
    showAllBtn.textContent = I18N.tx('Hepsini göster', 'Show all');
    showPid();
  }

  newExampleBtn.addEventListener('click', () => generateNewExample());
  const pidRow = q('pidRow'), pidIn = pidRow.querySelector('.we-pid-in'), pidGo = pidRow.querySelector('.we-pid-go');
  function showPid() {
    pidRow.querySelector('.we-pid-lbl').textContent = I18N.tx('Soru No:', 'Problem ID:');
    pidRow.querySelector('.we-pid-id').textContent = state.seed === undefined ? '—' : '#' + Rng.idOf(state.seed);
    pidGo.textContent = I18N.tx('Aç', 'Open');
    pidIn.setAttribute('aria-label', I18N.tx('Soru numarasını yazalım (5 karakter)', 'Type a problem ID (5 characters)'));
    pidIn.placeholder = I18N.tx('No gir', 'Enter ID');
    pidRow.title = I18N.tx('Aynı numara, aynı sekme ayarlarında aynı soruyu üretir.', 'The same ID produces the same problem with the same tab settings.');
  }
  const openPid = () => {
    const sd = Rng.parseId(pidIn.value);
    if (!Number.isFinite(sd)) { pidIn.classList.add('bad'); return; }
    pidIn.classList.remove('bad'); pidIn.value = ''; generateNewExample(sd);
  };
  pidGo.addEventListener('click', openPid);
  pidIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') openPid(); });
  toggleStepsBtn.addEventListener('click', () => {
    state.stepsVisible = !state.stepsVisible;
    stepsPanel.classList.toggle('visible', state.stepsVisible);
    if (state.stepsVisible) state.revealCount = 1;
    applyTexts();
    refreshDisplay();
  });
  nextStepBtn.addEventListener('click', () => { state.revealCount++; renderSteps(lastSteps); });
  showAllBtn.addEventListener('click', () => { state.revealCount = lastSteps.length; renderSteps(lastSteps); });

  if (def.buildControls) {
    const keep = (r) => { ctrls.push(r); return r; };
    def.buildControls(controlsHost, getProblem, {
      addSlider, addCheckbox: (o) => keep(addCheckbox(o)), addRadioGroup: (o) => keep(addRadioGroup(o)), addSelect: (o) => keep(addSelect(o)),
      refresh: refreshDisplay, regenerate: generateNewExample,
    });
  }

  stepsPanel.classList.toggle('visible', state.stepsVisible);
  if (saved) resyncControls();
  applyTexts();
  probeScale();
  refreshDisplay();

  const offLang = I18N.onChange(() => { applyTexts(); ai.retext(); tools.retext(); refreshDisplay(); });
  const offTheme = Theme.onChange(() => { canvas.render(); if (schem && def.drawSchematic) { schem.clear(); def.drawSchematic(schem, state.problem); schem.render(); } });
  const resizeHandler = () => canvas.render();
  window.addEventListener('resize', resizeHandler);

  return {
    destroy() {
      if (v3) v3.destroy();
      WE_SAVED.set(def, { problem: state.problem, seed: state.seed, revealCount: state.revealCount, stepsVisible: state.stepsVisible });
      tools.destroy();
      offLang();
      offTheme();
      window.removeEventListener('resize', resizeHandler);
      canvas.dispose();
      if (schem) schem.destroy();
      if (stackRo) stackRo.disconnect();
    },
  };
}
