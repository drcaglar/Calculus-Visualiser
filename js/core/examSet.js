// "Soru Seti (40)" tab: the student picks topics, the app builds a 40-question multiple-choice set (hidden
// easy/medium/hard mix: 8 / 16 / 16, ordered easy -> hard) and can PRINT (or save as PDF) the question paper and a
// matching answer key with short solutions. The questions are deliberately never listed on screen.
// Question pools come from window.ExamPools[chapterId] (generators with a numeric `.level` 1/2/3).

const EXAM_SIZES = [10, 20, 30, 40, 50];
const EXAM_SIZES_ALL = [10, 20, 30, 40, 50, 60, 80, 100];
// chapters that own an exam pool, in the order of the sidebar; the "Sınav Oluşturucu" tab (chapterId 'all') mixes any of their topics
const EXAM_ALL = ['numbers', 'functions', 'trig', 'limits', 'derivatives', 'applications', 'integrals', 'calc2', 'engineering'];
// hidden difficulty mix: 20% easy / 40% medium / 40% hard (40 questions -> 8 / 16 / 16)
function examMix(n) { const e = Math.round(n * 0.2), m = Math.round(n * 0.4); return { 1: e, 2: m, 3: n - e - m }; }

// Small seeded RNG so a Set No always reproduces the same paper (question sheet and key share one built set anyway).
class SeededRng extends Rng {
  constructor(seed) { super(); this.s = (seed >>> 0) || 1; }
  nextDouble() {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  nextInt(minIncl, maxExcl) { return minIncl + Math.floor(this.nextDouble() * (maxExcl - minIncl)); }
}

const EXAM_SAVED = new Map(); // chapterId -> state, so the question set survives switching tabs

function mountExamSet(host, chapterTitle, chapterId) {
  const ALL = chapterId === 'all';
  const sizes = ALL ? EXAM_SIZES_ALL : EXAM_SIZES;
  const chTitle = (id) => { const c = (typeof CHAPTERS !== 'undefined' ? CHAPTERS : []).find((k) => k.id === id); return c ? c.title() : id; };
  const pool = ALL ? EXAM_ALL.flatMap((c) => ((window.ExamPools && window.ExamPools[c]) || []).map((g) => ({ g, ch: c })))
    : ((window.ExamPools && window.ExamPools[chapterId]) || []).map((g) => ({ g, ch: chapterId }));
  let topicGroups = null;       // [{name, gens:[...]}] built lazily
  let selected = new Set();
  let built = null;             // { setNo, title, questions:[{q, level}] }
  let titleText = null;
  let busy = false;
  let examSize = 40;
  const sv = EXAM_SAVED.get(chapterId);
  if (sv) { topicGroups = sv.topicGroups; selected = sv.selected; built = sv.built; titleText = sv.titleText; examSize = sv.examSize; }

  host.innerHTML = '<div class="quiz-root es-root" data-role="root"></div>';
  const root = host.querySelector('[data-role="root"]');
  const tx = (a, b) => I18N.tx(a, b);
  const CODE = chapterCode(chapterId);
  // Set No = chapter code - seed - size - hex mask of the selected topics: this alone recreates the same paper and key.
  function examCode(seed, size) { const gs = groups(); let mask = 0n; gs.forEach((t, i) => { if (selected.has(t.name)) mask |= (1n << BigInt(i)); }); return CODE + '-' + Rng.idOf(seed) + '-' + size + '-' + mask.toString(16).toUpperCase(); }
  function openCode(txt) {
    const m = /^([A-Z0-9]{3})-([0-9A-Z]{5})-(\d{1,3})-([0-9A-F]{1,80})$/.exec(String(txt).trim().toUpperCase().replace(/^#/, ''));
    if (!m) return tx('Set numarası biçimi geçersiz (örn. ' + CODE + '-K7M2P-40-3F).', 'The set number format is not valid (e.g. ' + CODE + '-K7M2P-40-3F).');
    if (m[1] !== CODE) return tx(`Bu numara başka bir bölüme ait (${m[1]}). O bölümün Soru Seti sekmesinde açalım.`, `This number belongs to another chapter (${m[1]}). Let's open it in that chapter's Question Set tab.`);
    const size = +m[3], mask = BigInt('0x' + m[4]), gs = groups();
    if (!sizes.includes(size)) return tx('Set numarasındaki soru sayısı geçersiz.', 'The question count in the set number is not valid.');
    if ((mask >> BigInt(gs.length)) !== 0n) return tx('Bu numara bu program sürümünün konu listesine uymuyor.', 'This number does not fit the topic list of this program version.');
    selected = new Set(gs.filter((t, i) => (mask >> BigInt(i)) & 1n).map((t) => t.name));
    if (!selected.size) return tx('Set numarasında seçili konu yok.', 'The set number has no selected topics.');
    examSize = size;
    const seed = Rng.parseId(m[2]);
    built = { setNo: examCode(seed, size), seed, title: (titleText != null ? titleText : (ALL ? tx('Karma Sınav', 'Mixed Exam') : `${chapterTitle()}`)), questions: buildSet(seed, size), size };
    SetHistory.add({ kind: 'exam', ch: CODE, id: built.setNo, size });
    render();
    return '';
  }

  function groups() {
    if (topicGroups) return topicGroups;
    const map = new Map();
    pool.forEach(({ g, ch }) => {
      let name = '?';
      try { name = g(new SeededRng(7)).topic || '?'; } catch (e) { /* ignore */ }
      if (ALL) name = chTitle(ch) + ': ' + name;
      if (!map.has(name)) map.set(name, { ch, gens: [] });
      map.get(name).gens.push(g);
    });
    topicGroups = [...map.entries()].map(([name, v]) => ({ name, gens: v.gens, ch: v.ch }));
    if (!ALL) topicGroups.forEach((t) => selected.add(t.name));
    return topicGroups;
  }

  function render() {
    const gs = groups();
    root.innerHTML = '';
    const h = document.createElement('h2');
    h.textContent = ALL ? tx('Sınav Oluşturucu — tüm bölümlerden karma sınav', 'Exam Creator — a mixed exam from all chapters') : tx(`${chapterTitle()} — Soru Seti`, `${chapterTitle()} — Question Set`);
    root.appendChild(h);
    const p = document.createElement('p');
    p.style.cssText = 'color:var(--subtle-fg);line-height:1.6;max-width:760px;';
    p.textContent = tx(
      `Çalışmak ya da sınav provası yapmak için bir soru seti hazırlayabiliriz. Soru adedini ve konuları seçip "Soru Seti Oluştur"a basmamız yeterli. Sorular ekranda gösterilmez: çıktısını alıp (ya da PDF olarak kaydedip) kâğıt üzerinde çözebilir, sonra aynı setin cevap anahtarını yazdırıp kontrol edebiliriz. Sorular kolaydan zora doğru sıralanır ve her sette sayılar değişir.`,
      `Prepare a question set for study or an exam rehearsal. Pick the number of questions and the topics, then press "Create question set". The questions are not shown on screen: print them (or save as PDF), solve on paper, then print the answer key of the same set to check. Questions run from easy to hard and the numbers change in every set.`);
    root.appendChild(p);

    const tools = document.createElement('div');
    tools.className = 'es-tools';
    const mk = (txt, fn, cls) => { const b = document.createElement('button'); b.className = 'flat-btn' + (cls ? ' ' + cls : ''); b.textContent = txt; b.addEventListener('click', fn); return b; };
    tools.appendChild(mk(tx('Tümünü seç', 'Select all'), () => { gs.forEach((t) => selected.add(t.name)); render(); }));
    tools.appendChild(mk(tx('Seçimi temizle', 'Clear selection'), () => { selected.clear(); render(); }));
    root.appendChild(tools);

    const grid = document.createElement('div');
    grid.className = 'es-topics';
    let lastCh = null;
    gs.forEach((t) => {
      if (ALL && t.ch !== lastCh) {
        lastCh = t.ch;
        const head = document.createElement('div');
        head.className = 'es-chhead';
        const nm = document.createElement('b'); nm.textContent = chTitle(t.ch); head.appendChild(nm);
        const mine = gs.filter((u) => u.ch === t.ch);
        const b1 = document.createElement('button'); b1.type = 'button'; b1.className = 'flat-btn'; b1.textContent = tx('Bölümü seç', 'Select chapter');
        b1.addEventListener('click', () => { mine.forEach((u) => selected.add(u.name)); render(); });
        const b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'flat-btn'; b2.textContent = tx('Bölümü temizle', 'Clear chapter');
        b2.addEventListener('click', () => { mine.forEach((u) => selected.delete(u.name)); render(); });
        head.appendChild(b1); head.appendChild(b2);
        grid.appendChild(head);
      }
      const lab = document.createElement('label');
      lab.className = 'es-topic' + (selected.has(t.name) ? ' on' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selected.has(t.name);
      cb.addEventListener('change', () => { if (cb.checked) selected.add(t.name); else selected.delete(t.name); lab.classList.toggle('on', cb.checked); refreshState(); });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(' ' + (ALL ? t.name.slice(t.name.indexOf(': ') + 2) : t.name)));
      grid.appendChild(lab);
    });
    root.appendChild(grid);

    const sizeBox = document.createElement('div');
    sizeBox.className = 'es-sizes';
    const sl = document.createElement('div');
    sl.className = 'es-sizes-label';
    sl.textContent = tx('İstediğiniz soru sayısını seçebilirsiniz:', 'Choose the number of questions:');
    sizeBox.appendChild(sl);
    const sg = document.createElement('div');
    sg.className = 'es-size-group';
    sizes.forEach((n) => {
      const b = document.createElement('button');
      b.className = 'es-size' + (n === examSize ? ' on' : '');
      b.textContent = n + ' ' + tx('soru', 'questions');
      b.addEventListener('click', () => {
        examSize = n; built = null;
        sg.querySelectorAll('.es-size').forEach((x) => x.classList.toggle('on', x === b));
        refreshState();
      });
      sg.appendChild(b);
    });
    sizeBox.appendChild(sg);
    root.appendChild(sizeBox);

    const row = document.createElement('div');
    row.className = 'es-row';
    const lbl = document.createElement('label');
    lbl.textContent = tx('Başlık: ', 'Title: ');
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'es-title';
    inp.value = titleText != null ? titleText : (ALL ? tx('Karma Sınav', 'Mixed Exam') : `${chapterTitle()}`);
    inp.addEventListener('input', () => { titleText = inp.value; });
    lbl.appendChild(inp);
    row.appendChild(lbl);
    root.appendChild(row);

    const actions = document.createElement('div');
    actions.className = 'es-actions';
    const createBtn = mk(tx('Soru Seti Oluştur', 'Create question set'), create, 'primary');
    createBtn.dataset.role = 'create';
    actions.appendChild(createBtn);
    root.appendChild(actions);

    const recall = document.createElement('div');
    recall.className = 'quiz-idbox';
    recall.innerHTML = '<div class="quiz-idbox-t"></div><div class="quiz-idrow"><input class="quiz-idin es-idin" type="text" maxlength="120" autocomplete="off" spellcheck="false"><button type="button" class="flat-btn"></button></div><div class="quiz-idmsg" role="status" aria-live="polite"></div>';
    recall.querySelector('.quiz-idbox-t').textContent = tx('Set numarası ile geri çağır (soru kâğıdı ve cevap anahtarı aynı çıkar):', 'Recall a set by its number (the same paper and key come back):');
    recall.querySelector('input').setAttribute('aria-label', tx('Set numarası', 'Set number'));
    recall.querySelector('button').textContent = tx('Seti aç', 'Open set');
    recall.querySelector('button').addEventListener('click', () => { const msg = openCode(recall.querySelector('input').value); if (msg) recall.querySelector('.quiz-idmsg').textContent = msg; });
    root.appendChild(recall);
    const hist = SetHistory.list('exam', CODE).slice(0, 6);
    if (hist.length) {
      const hh = document.createElement('div'); hh.className = 'quiz-idbox';
      hh.innerHTML = '<div class="quiz-idbox-t"></div>'; hh.firstChild.textContent = tx('Önceki setlerimiz (bu tarayıcıda):', 'Our previous sets (in this browser):');
      hist.forEach((h) => {
        const row = document.createElement('div'); row.className = 'quiz-hist-row';
        row.innerHTML = '<b></b> <span></span> <button type="button" class="flat-btn"></button>';
        row.querySelector('b').textContent = h.id; row.querySelector('span').textContent = h.size + ' ' + tx('soru', 'questions') + ' — ' + fmtDate(h.date);
        row.querySelector('button').textContent = tx('Aç', 'Open');
        row.querySelector('button').addEventListener('click', () => { const msg = openCode(h.id); if (msg) recall.querySelector('.quiz-idmsg').textContent = msg; });
        hh.appendChild(row);
      });
      root.appendChild(hh);
    }

    const status = document.createElement('div');
    status.className = 'es-status';
    status.dataset.role = 'status';
    root.appendChild(status);

    const printRow = document.createElement('div');
    printRow.className = 'es-actions';
    printRow.dataset.role = 'printRow';
    root.appendChild(printRow);
    refreshState();
  }

  function refreshState() {
    const createBtn = root.querySelector('[data-role="create"]');
    const status = root.querySelector('[data-role="status"]');
    const printRow = root.querySelector('[data-role="printRow"]');
    if (!createBtn) return;
    createBtn.disabled = selected.size === 0 || busy;
    printRow.innerHTML = '';
    if (selected.size === 0) { status.textContent = tx('Başlamak için en az bir konu seçelim.', 'Select at least one topic.') + (ALL ? tx(' (Konuları bölümlere göre seçebiliriz.)', ' (Topics are grouped by chapter.)') : ''); }
    else if (!built) { status.textContent = tx(`${selected.size} konu seçili.`, `${selected.size} topic(s) selected.`); }
    if (built) {
      status.textContent = tx(`Set No: ${built.setNo} — ${built.size} soru hazır. Sorular ekranda gösterilmez; aşağıdan çıktısını alabilirsiniz.`, `Set No: ${built.setNo} — ${built.size} questions ready. Questions are not shown on screen; print them below.`);
      const b1 = document.createElement('button');
      b1.className = 'flat-btn primary';
      b1.textContent = tx('Soru Kâğıdını Yazdır / PDF', 'Print question paper / PDF');
      b1.addEventListener('click', () => printDoc(false));
      const b2 = document.createElement('button');
      b2.className = 'flat-btn';
      b2.textContent = tx('Cevap Anahtarını Yazdır / PDF', 'Print answer key / PDF');
      b2.addEventListener('click', () => printDoc(true));
      printRow.appendChild(b1);
      printRow.appendChild(b2);
    }
  }

  // ---------- building the set ----------
  function pickGenerators(level) {
    // generators of the chosen topics for this level; if none, fall back to the nearest levels
    const chosen = groups().filter((t) => selected.has(t.name));
    const all = chosen.flatMap((t) => t.gens.map((g) => ({ g, topic: t.name })));
    for (const order of [[level], [level - 1, level + 1], [level - 2, level + 2]]) {
      const r = all.filter((x) => order.includes(x.g.level || 2));
      if (r.length) return r;
    }
    return all;
  }

  function buildSet(setNo, size) {
    const mix = examMix(size);
    const rng = new SeededRng(setNo);
    const usedText = new Set();
    const out = [];
    [1, 2, 3].forEach((level) => {
      const need = mix[level];
      const cand = pickGenerators(level);
      // round-robin over topics so the set is spread across the chosen topics
      const byTopic = new Map();
      cand.forEach((c) => { if (!byTopic.has(c.topic)) byTopic.set(c.topic, []); byTopic.get(c.topic).push(c.g); });
      const queues = [...byTopic.values()].map((arr) => shuffleArr(arr.slice(), rng));
      shuffleArr(queues, rng);
      const cursors = queues.map(() => 0);
      let produced = 0, guard = 0;
      while (produced < need && guard++ < need * 60) {
        const qi = guard % queues.length;
        const arr = queues[qi];
        const g = arr[cursors[qi]++ % arr.length];
        let q = null;
        try { q = g(rng); } catch (e) { q = null; }
        if (!q || !q.text) continue;
        const key = q.text + '|' + q.options.join('|');
        if (usedText.has(key)) continue;
        usedText.add(key);
        out.push({ q, level });
        produced++;
      }
    });
    return out.slice(0, size);
  }

  function create() {
    if (!selected.size || busy) return;
    busy = true;
    const status = root.querySelector('[data-role="status"]');
    status.textContent = tx('Hazırlanıyor…', 'Preparing…');
    setTimeout(() => {
      const seed = Rng.newSeed();
      built = { setNo: examCode(seed, examSize), seed, title: (titleText != null ? titleText : (ALL ? tx('Karma Sınav', 'Mixed Exam') : `${chapterTitle()}`)), questions: buildSet(seed, examSize), size: examSize };
      SetHistory.add({ kind: 'exam', ch: CODE, id: built.setNo, size: examSize });
      busy = false;
      refreshState();
    }, 30);
  }

  // ---------- printing ----------
  function plotImage(spec) {
    // Draw the plot on an off-screen canvas with the LIGHT palette (so it prints cleanly), return a PNG data URL.
    const root_ = document.documentElement;
    const prev = root_.getAttribute('data-theme');
    const holder = document.createElement('div');
    // match the canvas aspect to the plot's viewport so circles stay round and units stay equal
    const dx = spec.xMax - spec.xMin, dy = spec.yMax - spec.yMin;
    let pw = 360, ph = dx > 0 && dy > 0 ? pw * dy / dx : 240;
    if (ph > 280) { ph = 280; pw = Math.max(200, ph * dx / dy); }
    ph = Math.max(150, ph);
    holder.style.cssText = `position:fixed;left:-9999px;top:0;width:${Math.round(pw)}px;height:${Math.round(ph)}px;`;
    const cv = document.createElement('canvas');
    holder.appendChild(cv);
    document.body.appendChild(holder);
    let url = '';
    try {
      root_.setAttribute('data-theme', 'light');
      const gc = new GraphCanvas(cv);
      gc.setViewport(spec.xMin, spec.xMax, spec.yMin, spec.yMax);
      (spec.curves || []).forEach((c) => gc.addFunction({ evaluator: c.f, color: c.dashed ? gc.gray() : gc.accent(), dashed: !!c.dashed }));
      (spec.points || []).forEach((p) => gc.addMarker({ x: p.x, y: p.y, label: p.label || '', hollow: !!p.hollow }));
      (spec.segments || []).forEach((s) => gc.addSegment({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }));
      gc.render();
      url = cv.toDataURL('image/png');
    } catch (e) { url = ''; }
    root_.setAttribute('data-theme', prev || 'dark');
    document.body.removeChild(holder);
    return url;
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const H = (s) => (typeof Typeset !== 'undefined' && typeof katex !== 'undefined' ? Typeset.html(s) : esc(s));

  function buildPrintHtml(isKey) {
    const L = (i) => String.fromCharCode(65 + i);
    const qs = built.questions;
    const head = `<div class="pr-head"><div class="pr-title">${esc(built.title)}</div>
      <div class="pr-sub">${isKey ? esc(tx('CEVAP ANAHTARI', 'ANSWER KEY')) : esc(tx('SORU KÂĞIDI', 'QUESTION PAPER'))} &nbsp;|&nbsp; Set No: <b>${built.setNo}</b> &nbsp;|&nbsp; ${built.size} ${esc(tx('soru', 'questions'))}</div></div>`;
    if (!isKey) {
      const info = `<div class="pr-info"><span>${esc(tx('Ad Soyad', 'Name'))}: ________________________</span><span>${esc(tx('Numara', 'ID'))}: ____________</span><span>${esc(tx('Tarih', 'Date'))}: ____________</span></div>
        <div class="pr-note">${esc(tx('Her sorunun yalnızca bir doğru cevabı vardır. Kolaydan zora doğru sıralanmıştır.', 'Each question has exactly one correct answer. Questions run from easy to hard.'))}</div>`;
      const body = qs.map((it, i) => {
        const q = it.q;
        const img = q.plot ? plotImage(q.plot) : '';
        return `<div class="pr-q"><div class="pr-qt"><b>${i + 1}.</b> ${H(q.text)}</div>${img ? `<img class="pr-img" src="${img}">` : ''}
          <div class="pr-opts">${q.options.map((o, k) => `<div>${L(k)}) ${H(o)}</div>`).join('')}</div></div>`;
      }).join('');
      return head + info + `<div class="pr-cols">${body}</div>`;
    }
    const summary = qs.map((it, i) => `<span class="pr-ans"><b>${i + 1}</b>-${L(it.q.correctIndex)}</span>`).join('');
    const detail = qs.map((it, i) => {
      const q = it.q;
      const steps = (q.solution || []).map((s) => `<li>${H(s)}</li>`).join('');
      const img = q.plot ? plotImage(q.plot) : '';
      return `<div class="pr-k"><div class="pr-qt"><b>${i + 1}.</b> ${H(q.text)}</div>${img ? `<img class="pr-img" src="${img}">` : ''}
        <div class="pr-correct">${esc(tx('Doğru cevap', 'Correct answer'))}: <b>${L(q.correctIndex)}) ${H(q.options[q.correctIndex])}</b></div>
        <ol class="pr-steps">${steps}</ol></div>`;
    }).join('');
    return head + `<div class="pr-summary">${summary}</div>` + `<div class="pr-detail">${detail}</div>`;
  }

  function printDoc(isKey) {
    if (!built) return;
    let area = document.getElementById('printArea');
    if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
    area.innerHTML = buildPrintHtml(isKey);
    document.body.classList.add('printing');
    const prevTitle = document.title;
    document.title = `${built.title} - ${isKey ? tx('Cevap Anahtarı', 'Answer Key') : tx('Soru Kâğıdı', 'Questions')} - Set ${built.setNo}`;
    const cleanup = () => {
      document.body.classList.remove('printing');
      document.title = prevTitle;
      area.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => { window.print(); }, 350);
  }

  const offLang = I18N.onChange(() => { built = null; topicGroups = null; selected = new Set(); render(); });
  render();
  return { _test: { groups, select: (names) => { selected = new Set(names); }, setSize: (n) => { examSize = n; }, create: () => { const seed = Rng.newSeed(); built = { setNo: examCode(seed, examSize), seed, title: 't', questions: buildSet(seed, examSize), size: examSize }; return built; }, openCode, state: () => ({ built, selected, examSize }) }, destroy() { EXAM_SAVED.set(chapterId, { topicGroups, selected, built, titleText, examSize }); if (offLang) offLang(); } };
}
