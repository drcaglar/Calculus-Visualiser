// "Copy AI prompt" helpers: builds Socratic tutoring prompts (Turkish or English, following the UI language)
// from the current topic / question, copies them to the clipboard and offers shortcuts to popular AI chats.
const AIPrompt = (function () {
  const tx = (tr, en) => I18N.tx(tr, en);

  function rules() {
    return tx(
      'Nasıl yardım etmeni istiyorum (Sokratik yöntem):\n' +
      '1. Cevabı veya çözümü HEMEN verme. Önce kısa bir soruyla bu konuda ne bildiğimi öğren.\n' +
      '2. Beni her seferinde TEK bir küçük soruyla ya da ipucuyla yönlendir ve cevabımı bekle.\n' +
      '3. Yanlış söylersem sert davranma; neden yanlış olduğunu bana düşündürecek bir soruyla düzelt.\n' +
      '4. Takılırsam kademeli ipucu ver (önce hafif, sonra daha açık). Ancak "çözümü göster" dersem tam çözümü adım adım yaz.\n' +
      '5. Sonunda kısaca özetle ve kendi başıma çözebileyim diye benzer bir soru ver.\n' +
      '6. Birinci sınıf mühendislik öğrencisine uygun, sade bir Türkçe kullan; formülleri açık yaz, sembolleri açıkla.',
      'How I want you to help (Socratic method):\n' +
      '1. Do NOT give the answer or the full solution right away. First ask a short question to find out what I already know about this.\n' +
      '2. Guide me with ONE small question or hint at a time and wait for my reply.\n' +
      '3. If I am wrong, do not be harsh; correct me with a question that makes me see why it is wrong.\n' +
      '4. If I get stuck, give graded hints (gentle first, then clearer). Only if I say "show the solution", write the full step-by-step solution.\n' +
      '5. At the end, summarise briefly and give me a similar problem to solve on my own.\n' +
      '6. Use simple English suited to a first-year engineering student; write formulas clearly and explain symbols.'
    );
  }

  function buildTopic(title, concept) {
    return tx(
      'Sen sabırlı ve deneyimli bir matematik öğretmenisin. Ben birinci sınıf Makine Mühendisliği öğrencisiyim ve Matematik I (Calculus I) dersini çalışıyorum.\n\n' +
      'KONU: ' + title + '\n\n' +
      'Ders notlarımdan ilgili özet (kullanabilirsin, gerekirse düzeltebilirsin):\n"""\n' + concept + '\n"""\n\n' +
      'Bu konuyu bana baştan sona, kavramdan uygulamaya adım adım öğret.\n\n' + rules(),
      'You are a patient and experienced mathematics teacher. I am a first-year Mechanical Engineering student studying Calculus I.\n\n' +
      'TOPIC: ' + title + '\n\n' +
      'A summary from my course notes (you may use it and correct it if needed):\n"""\n' + concept + '\n"""\n\n' +
      'Teach me this topic from scratch to application, step by step.\n\n' + rules()
    );
  }

  function buildQuestion(title, statement, steps) {
    const hasSteps = steps && steps.length;
    const stepText = hasSteps ? steps.map((s, i) => (i + 1) + '. ' + s).join('\n') : '';
    return tx(
      'Sen sabırlı ve deneyimli bir matematik öğretmenisin. Ben birinci sınıf Makine Mühendisliği öğrencisiyim ve Matematik I (Calculus I) dersini çalışıyorum.\n\n' +
      'KONU: ' + title + '\n\n' +
      (statement ? 'SORU:\n' + statement + '\n\n' : '') +
      (hasSteps ? 'Çalıştığım programın verdiği çözüm adımları (sadece SEN kontrol amaçlı kullan; bana baştan gösterme, ben isteyene kadar saklı tut ve hata varsa dürüstçe söyle):\n"""\n' + stepText + '\n"""\n\n' : '') +
      'Bu soruyu kendi başıma çözebilmem için bana yardım et.\n\n' + rules(),
      'You are a patient and experienced mathematics teacher. I am a first-year Mechanical Engineering student studying Calculus I.\n\n' +
      'TOPIC: ' + title + '\n\n' +
      (statement ? 'PROBLEM:\n' + statement + '\n\n' : '') +
      (hasSteps ? 'The solution steps given by the program I am using (use them ONLY to check; do not show them to me upfront, keep them hidden until I ask, and tell me honestly if they contain a mistake):\n"""\n' + stepText + '\n"""\n\n' : '') +
      'Help me solve this problem on my own.\n\n' + rules()
    );
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  // Builds the button block. getTopic()/getQuestion() are called at click time so the text always matches the screen.
  function mountButtons(container, getTopic, getQuestion) {
    const box = document.createElement('div');
    box.className = 'ai-box';
    box.innerHTML =
      '<div class="ai-title" data-r="t"></div>' +
      '<div class="ai-row"><button class="ai-btn" data-r="bt"></button><button class="ai-btn" data-r="bq"></button></div>' +
      '<div class="ai-links"><span data-r="open"></span> ' +
      '<a href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a>' +
      '<a href="https://claude.ai/new" target="_blank" rel="noopener">Claude</a>' +
      '<a href="https://gemini.google.com/app" target="_blank" rel="noopener">Gemini</a></div>';
    container.appendChild(box);
    const r = (n) => box.querySelector('[data-r="' + n + '"]');
    function texts() {
      r('t').textContent = tx('🤖 Yapay zekâ ile çalış', '🤖 Study with AI');
      r('bt').textContent = tx('📋 Konu promptunu kopyala', '📋 Copy topic prompt');
      r('bq').textContent = tx('📋 Soru + çözüm promptunu kopyala', '📋 Copy question + solution prompt');
      r('open').textContent = tx('Kopyaladıktan sonra yapıştır:', 'After copying, paste into:');
    }
    texts();
    function wire(btn, build, label) {
      btn.addEventListener('click', async () => {
        const ok = await copy(build());
        btn.classList.toggle('done', ok);
        btn.textContent = ok ? tx('Kopyalandı ✓', 'Copied ✓') : tx('Kopyalanamadı', 'Copy failed');
        setTimeout(() => { btn.classList.remove('done'); texts(); }, 1800);
      });
    }
    wire(r('bt'), getTopic);
    wire(r('bq'), getQuestion);
    return { retext: texts, destroy() { box.remove(); } };
  }

  return { buildTopic, buildQuestion, mountButtons };
})();
