// Ported from Modules/Preliminaries/QuizBank.vb - random question generators, one per topic group
// of the "Sayılar ve Kartezyen" chapter. generateSet (js/core/quizEngine.js) picks 10 different
// groups at random and builds one fresh question from each.
(function () {
  // ---------- local helpers (mirror Plus/Gcd/Frac/LineStr/XTerm in QuizBank.vb) ----------

  function plus(n) {
    return n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) { const t = a % b; a = b; b = t; }
    return a === 0 ? 1 : a;
  }

  function frac(n, d) {
    if (d === 0) return I18N.tx('tanımsız', 'undefined');
    const g = gcd(n, d);
    n = Math.trunc(n / g); d = Math.trunc(d / g);
    if (d < 0) { n = -n; d = -d; }
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  function lineStr(m, b) {
    const mp = m === 1 ? 'x' : (m === -1 ? '-x' : `${m}x`);
    return b === 0 ? `y = ${mp}` : `y = ${mp} ${plus(b)}`;
  }

  function xTerm(h) {
    if (h === 0) return 'x';
    return h > 0 ? `(x - ${h})` : `(x + ${-h})`;
  }

  function trimParens(s) {
    return s.replace(/^[()]+/, '').replace(/[()]+$/, '');
  }

  // Mirrors VB's ":0.###" numeric format (up to 3 decimals, no trailing zeros).
  function fmt3(v) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(3);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }

  function intWrongNotes(...specificNotes) {
    const result = specificNotes.slice();
    result.push(I18N.tx('Doğru sonuçtan 1 fazla: son adımda küçük bir toplama/çıkarma hatası.', 'One more than the correct result: a small addition/subtraction slip in the last step.'));
    result.push(I18N.tx('Doğru sonuçtan 1 eksik: son adımda küçük bir toplama/çıkarma hatası.', 'One less than the correct result: a small addition/subtraction slip in the last step.'));
    result.push(I18N.tx('Doğru sonuçtan 2 fazla: bir terimi yanlış hesaplamış olabilirsin.', 'Two more than the correct result: one term may have been computed wrongly.'));
    result.push(I18N.tx('Doğru sonuçtan 2 eksik: bir terimi yanlış hesaplamış olabilirsin.', 'Two less than the correct result: one term may have been computed wrongly.'));
    result.push(I18N.tx('Doğru sonuçtan 3 fazla: birkaç adımda hata birikmiş olabilir.', 'Three more than the correct result: errors may have piled up over several steps.'));
    result.push(I18N.tx('Doğru sonuçtan 3 eksik: birkaç adımda hata birikmiş olabilir.', 'Three less than the correct result: errors may have piled up over several steps.'));
    return result;
  }

  // ---------- generators ----------

  function genIrrational(rng) {
    const p = [2, 3, 5, 6, 7, 10, 11][rng.nextInt(0, 7)];
    const k = rng.nextInt(2, 9);
    const correct = `√${p}`;
    const wrongs = [`√${k * k}`, `${rng.nextInt(1, 6)}/${rng.nextInt(6, 12)}`, '0.75', `-${k}`];
    return makeQuestion(
      I18N.tx('Sayı sistemleri', 'Number systems'),
      I18N.tx('Aşağıdakilerden hangisi İRRASYONEL bir sayıdır?', 'Which of the following is an IRRATIONAL number?'),
      correct, wrongs,
      [
        I18N.tx('İrrasyonel sayı, iki tam sayının oranı (a/b) olarak yazılamayan sayıdır.', 'An irrational number cannot be written as a ratio of two integers (a/b).'),
        I18N.tx(`√${k * k} = ${k} tam sayıdır; kesirler ve sonlu ondalıklar rasyoneldir.`, `√${k * k} = ${k} is an integer; fractions and terminating decimals are rational.`),
        I18N.tx(`√${p}, tam kare olmayan bir sayının karekökü olduğu için irrasyoneldir.`, `√${p} is irrational because it is the square root of a non-perfect square.`),
      ],
      rng,
      [
        I18N.tx(`√${k * k} bir tam karenin karekökü olduğundan tam sayıya eşittir; kök işareti tek başına irrasyonel yapmaz.`, `√${k * k} is the root of a perfect square, so it equals a whole number; the root sign alone does not make it irrational.`),
        I18N.tx('İki tam sayının oranı olan her kesir rasyoneldir; kesir yazımı irrasyonel olmayı göstermez.', 'Any fraction of two integers is rational; being written with a slash never makes a number irrational.'),
        I18N.tx('Sonlu ondalık sayılar paydası 10\'un kuvveti olan kesirlere eşittir, dolayısıyla rasyoneldir.', 'A terminating decimal equals a fraction with a power of 10 in the denominator, so it is rational.'),
        I18N.tx('Negatif bir tam sayı da rasyoneldir; eksi işareti sayıyı irrasyonel yapmaz.', 'A negative integer is still rational; a minus sign does not make a number irrational.'),
      ]
    );
  }

  function genSets(rng) {
    const pool = Array.from({ length: 9 }, (_, i) => i + 1);
    shuffleArr(pool, rng);
    const a = pool.slice(0, rng.nextInt(4, 6)).sort((x, y) => x - y);
    const pool2 = Array.from({ length: 9 }, (_, i) => i + 1);
    shuffleArr(pool2, rng);
    const b = pool2.slice(0, rng.nextInt(4, 6)).sort((x, y) => x - y);
    const inter = a.filter((v) => b.includes(v)).length;
    const uni = new Set(a.concat(b)).size;
    const sa = '{' + a.join(', ') + '}';
    const sb = '{' + b.join(', ') + '}';
    return makeQuestion(
      I18N.tx('Kümeler', 'Sets'),
      I18N.tx(`A = ${sa} ve B = ${sb} olduğuna göre A ∪ B kümesinin eleman sayısı kaçtır?`, `Given A = ${sa} and B = ${sb}, how many elements does A ∪ B have?`),
      String(uni),
      intWrongs(uni, a.length + b.length, inter),
      [
        I18N.tx('Birleşim (∪): iki kümedeki tüm elemanlar, ortak elemanlar bir kez sayılarak.', 'Union (∪): all elements of both sets, counting common elements once.'),
        `|A| = ${a.length}, |B| = ${b.length}, |A ∩ B| = ${inter}`,
        `|A ∪ B| = |A| + |B| - |A ∩ B| = ${a.length} + ${b.length} - ${inter} = ${uni}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('Sadece eleman sayılarını topladın; ortak elemanları iki kez saymış oldun.', 'You just added the two set sizes, so the common elements were counted twice.'),
        I18N.tx('Birleşim yerine kesişimin eleman sayısını verdin; ortak elemanlar sadece kesişimdedir.', 'You gave the size of the intersection instead of the union; only the common elements are in it.')
      )
    );
  }

  function genOrdering(rng) {
    const fr = [];
    let tries = 0;
    while (fr.length < 4 && tries < 500) {
      tries++;
      const d = rng.nextInt(2, 10);
      const n = rng.nextInt(1, d * 2);
      const v = n / d;
      if (fr.every((f) => Math.abs(f[0] / f[1] - v) > 0.05)) fr.push([n, d]);
    }
    let best = fr[0];
    for (let i = 1; i < fr.length; i++) {
      if (fr[i][0] / fr[i][1] > best[0] / best[1]) best = fr[i];
    }
    const strs = fr.map((f) => `${f[0]}/${f[1]}`);
    const correct = `${best[0]}/${best[1]}`;
    const steps = [I18N.tx('Her kesri ondalık sayıya çevirip reel sayı doğrusunda karşılaştır (sağdaki büyüktür):', 'Convert each fraction to a decimal and compare on the real line (the one further right is larger):')];
    for (const f of fr) {
      steps.push(`${f[0]}/${f[1]} = ${fmt3(f[0] / f[1])}`);
    }
    steps.push(I18N.tx(`En büyük değer ${correct} kesridir.`, `The largest value is the fraction ${correct}.`));
    return makeQuestion(
      I18N.tx('Reel sayı doğrusu ve sıralama', 'Real line and ordering'),
      I18N.tx('Aşağıdaki sayılardan hangisi en büyüktür?', 'Which of the following numbers is the largest?'),
      correct, strs, steps, rng,
      fr.map((fq) => (fq === best ? '' : I18N.tx(`${fq[0]}/${fq[1]} = ${fmt3(fq[0] / fq[1])} en büyük değil; payları ya da paydaları karşılaştırmak yerine ondalığa çevirmelisin.`, `${fq[0]}/${fq[1]} = ${fmt3(fq[0] / fq[1])} is not the largest; compare decimal values instead of just numerators or denominators.`)))
    );
  }

  function genLinearIneq(rng) {
    const a = [2, 3, 4, 5, -2, -3, -4][rng.nextInt(0, 7)];
    const b = rng.nextInt(-6, 7);
    const x0 = rng.nextInt(-5, 6);
    const c = a * x0 + b;
    const gt = rng.nextInt(0, 2) === 0;
    const opText = gt ? '>' : '<';
    const solGt = a > 0 ? gt : !gt;
    const s = solGt ? '>' : '<';
    const o = solGt ? '<' : '>';
    const correct = `x ${s} ${x0}`;
    const wrongs = [`x ${o} ${x0}`, `x ${s} ${-x0}`, `x ${o} ${-x0}`, `x ${s} ${x0 + 1}`, `x ${s} ${x0 - 1}`];
    const notes = [
      a > 0
        ? I18N.tx('Pozitif sayıya bölerken eşitsizlik yönünü gereksiz yere çevirdin.', 'You flipped the inequality sign although you divided by a positive number.')
        : I18N.tx('Negatif sayıya bölürken eşitsizlik yönünü çevirmeyi unuttun.', 'You forgot to flip the inequality sign when dividing by a negative number.'),
      I18N.tx('Sabiti taşırken işaretini değiştirmeyi unutup sınır değerin işaretini ters yazdın.', 'You moved the constant without changing its sign, so the boundary value has the wrong sign.'),
      I18N.tx('Hem sınır değerin işaretini hem eşitsizlik yönünü yanlış aldın.', 'You got both the sign of the boundary value and the direction of the inequality wrong.'),
      I18N.tx('Sınır değer bir fazla çıktı; sabiti taşıma ya da bölme adımında küçük bir hata var.', 'The boundary is one too large; there is a small slip when moving the constant or dividing.'),
      I18N.tx('Sınır değer bir eksik çıktı; sabiti taşıma ya da bölme adımında küçük bir hata var.', 'The boundary is one too small; there is a small slip when moving the constant or dividing.'),
    ];
    const steps = [
      `${a}x ${plus(b)} ${opText} ${c}`,
      I18N.tx(`${-b} her iki tarafa ekle: ${a}x ${opText} ${c - b}`, `Add ${-b} to both sides: ${a}x ${opText} ${c - b}`),
      a > 0
        ? I18N.tx(`${a} > 0 olduğundan eşitsizlik yönü değişmez: x ${s} ${x0}`, `Since ${a} > 0 the inequality sign does not change: x ${s} ${x0}`)
        : I18N.tx(`${a} < 0 ile bölerken eşitsizlik yönü DEĞİŞİR: x ${s} ${x0}`, `Dividing by ${a} < 0 REVERSES the inequality sign: x ${s} ${x0}`),
    ];
    return makeQuestion(
      I18N.tx('Doğrusal eşitsizlik', 'Linear inequality'),
      I18N.tx(`${a}x ${plus(b)} ${opText} ${c} eşitsizliğinin çözümü hangisidir?`, `Which is the solution of the inequality ${a}x ${plus(b)} ${opText} ${c}?`),
      correct, wrongs, steps, rng, notes
    );
  }

  function genQuadIneq(rng) {
    let r1, r2;
    do {
      r1 = rng.nextInt(-6, 6);
      r2 = rng.nextInt(r1 + 1, 8);
    } while (r1 === -r2);
    const less = rng.nextInt(0, 2) === 0;
    const inside = `${r1} < x < ${r2}`;
    const outside = I18N.tx(`x < ${r1} veya x > ${r2}`, `x < ${r1} or x > ${r2}`);
    const negInside = `${-r2} < x < ${-r1}`;
    const negOutside = I18N.tx(`x < ${-r2} veya x > ${-r1}`, `x < ${-r2} or x > ${-r1}`);
    const correct = less ? inside : outside;
    const wrongs = [less ? outside : inside, less ? negInside : negOutside, `x < ${r1}`, `x > ${r2}`];
    const notes = [
      I18N.tx('Kökler arası ile dışını karıştırdın; yukarı açılan parabolün işaretini ters okudun.', 'You mixed up between the roots and outside the roots; the sign of an upward parabola was read the wrong way.'),
      I18N.tx('Köklerin işaretlerini ters aldın; (x - a) çarpanının kökü +a\'dır, -a değil.', 'You reversed the signs of the roots; the factor (x - a) has root +a, not -a.'),
      I18N.tx('Sadece küçük kökün soluna baktın; çözümün diğer parçasını ya da köklerin arasını unuttun.', 'You only looked left of the smaller root and left out the rest of the solution set.'),
      I18N.tx('Sadece büyük kökün sağına baktın; çözümün diğer parçasını ya da köklerin arasını unuttun.', 'You only looked right of the larger root and left out the rest of the solution set.'),
    ];
    const steps = [
      I18N.tx(`Kökler: x = ${r1} ve x = ${r2}`, `Roots: x = ${r1} and x = ${r2}`),
      I18N.tx('Parabol yukarı açılır (x² katsayısı +1): köklerin arası negatif, dışı pozitiftir.', 'The parabola opens upward (x² coefficient +1): negative between the roots, positive outside.'),
      less
        ? I18N.tx(`< 0 istendiği için köklerin arası: ${inside}`, `Since < 0 is required, between the roots: ${inside}`)
        : I18N.tx(`> 0 istendiği için köklerin dışı: ${outside}`, `Since > 0 is required, outside the roots: ${outside}`),
    ];
    return makeQuestion(
      I18N.tx('İkinci derece eşitsizlik', 'Quadratic inequality'),
      I18N.tx(`${xTerm(r1)}${xTerm(r2)} ${less ? '<' : '>'} 0 eşitsizliğinin çözüm kümesi hangisidir?`, `Which is the solution set of the inequality ${xTerm(r1)}${xTerm(r2)} ${less ? '<' : '>'} 0?`),
      correct, wrongs, steps, rng, notes
    );
  }

  function genAbsValue(rng) {
    const a = -rng.nextInt(1, 10);
    const b = rng.nextInt(-5, 5);
    const c = b + rng.nextInt(2, 9);
    const ans = Math.abs(a) + Math.abs(b - c);
    return makeQuestion(
      I18N.tx('Mutlak değer', 'Absolute value'),
      I18N.tx(`|${a}| + |${b} - ${c}| işleminin sonucu kaçtır?`, `What is the value of |${a}| + |${b} - ${c}|?`),
      String(ans),
      intWrongs(ans, a + (b - c), Math.abs(a) - Math.abs(b - c), -ans),
      [
        I18N.tx('Mutlak değer sayının sıfıra uzaklığıdır, sonuç negatif olamaz.', 'Absolute value is the distance of a number from zero; it cannot be negative.'),
        I18N.tx(`|${a}| = ${Math.abs(a)}   ve   |${b} - ${c}| = |${b - c}| = ${Math.abs(b - c)}`, `|${a}| = ${Math.abs(a)}   and   |${b} - ${c}| = |${b - c}| = ${Math.abs(b - c)}`),
        I18N.tx(`Toplam: ${Math.abs(a)} + ${Math.abs(b - c)} = ${ans}`, `Sum: ${Math.abs(a)} + ${Math.abs(b - c)} = ${ans}`),
      ],
      rng,
      intWrongNotes(
        I18N.tx(`Mutlak değer almadan ${a} + (${b - c}) toplamını hesapladın; mutlak değer işaretlerini yok saydın.`, `You added ${a} + (${b - c}) without taking absolute values; the bars were ignored.`),
        I18N.tx('İkinci mutlak değeri toplamak yerine çıkardın; iki mutlak değer toplanmalıdır.', 'You subtracted the second absolute value instead of adding; the two are added.'),
        I18N.tx('Sonucun işaretini negatif yazdın; mutlak değerlerin toplamı negatif olamaz.', 'You gave the negative of the result; a sum of absolute values cannot be negative.')
      )
    );
  }

  function genAbsEquation(rng) {
    let h;
    do { h = rng.nextInt(-6, 7); } while (h === 0);
    const k = rng.nextInt(1, 6);
    const lo = h - k;
    const hi = h + k;
    const correct = I18N.tx(`x = ${lo} veya x = ${hi}`, `x = ${lo} or x = ${hi}`);
    const wrongs = [
      `x = ${hi}`,
      `x = ${lo}`,
      I18N.tx(`x = ${-h - k} veya x = ${-h + k}`, `x = ${-h - k} or x = ${-h + k}`),
      I18N.tx(`x = ${h} veya x = ${k}`, `x = ${h} or x = ${k}`),
      I18N.tx('Çözüm yok', 'No solution'),
    ];
    const term = trimParens(xTerm(h));
    return makeQuestion(
      I18N.tx('Mutlak değer denklemi', 'Absolute value equation'),
      I18N.tx(`|${term}| = ${k} denkleminin çözüm kümesi hangisidir?`, `Which is the solution set of the equation |${term}| = ${k}?`),
      correct, wrongs,
      [
        I18N.tx(`|A| = ${k} ise A = ${k} veya A = -${k}`, `If |A| = ${k} then A = ${k} or A = -${k}`),
        `x ${plus(-h)} = ${k}  →  x = ${hi}`,
        `x ${plus(-h)} = -${k}  →  x = ${lo}`,
      ],
      rng,
      [
        I18N.tx('Sadece A = +k durumunu çözdün; mutlak değer denkleminde A = -k durumu da vardır.', 'You solved only the case A = +k; an absolute value equation also has the case A = -k.'),
        I18N.tx('Sadece A = -k durumunu çözdün; A = +k durumunu da çözmelisin.', 'You solved only the case A = -k; the case A = +k must be solved as well.'),
        I18N.tx('Kökleri 0 merkezli sandın; x - h ifadesinde merkez +h\'dir, -h değil.', 'You centered the roots at the wrong point; in x - h the centre is +h, not -h.'),
        I18N.tx('h ve k sayılarını doğrudan çözüm olarak yazdın; iki doğrusal denklemi çözmedin.', 'You wrote h and k straight down as solutions instead of solving the two linear equations.'),
        I18N.tx('Sağ taraf pozitif olduğu için çözüm vardır; mutlak değer denklemi boş küme vermez.', 'The right side is positive, so solutions exist; the solution set is not empty.'),
      ]
    );
  }

  // Why a student might pick quadrant j when the point really lies in quadrant idx (which sign was misread).
  function quadrantNote(j, idx) {
    if (j === idx) return '';
    const xPos = (q) => q === 0 || q === 3;
    const yPos = (q) => q === 0 || q === 1;
    const xWrong = xPos(j) !== xPos(idx);
    const yWrong = yPos(j) !== yPos(idx);
    if (xWrong && yWrong) return I18N.tx('İki koordinatın da işaretini ters okumuşsun: hem x hem y\'nin işaretine tekrar bak.', 'You misread the sign of both coordinates: check the signs of x and y again.');
    if (xWrong) return I18N.tx('x koordinatının işaretini yanlış değerlendirmişsin: x pozitifse sağda, negatifse solda olur.', 'You misjudged the sign of x: positive x is to the right, negative x to the left.');
    return I18N.tx('y koordinatının işaretini yanlış değerlendirmişsin: y pozitifse yukarıda, negatifse aşağıda olur.', 'You misjudged the sign of y: positive y is up, negative y is down.');
  }

  function genQuadrant(rng) {
    const x = rng.nextInt(1, 8) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    const y = rng.nextInt(1, 8) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    const names = [I18N.tx('I. bölge', 'Quadrant I'), I18N.tx('II. bölge', 'Quadrant II'), I18N.tx('III. bölge', 'Quadrant III'), I18N.tx('IV. bölge', 'Quadrant IV')];
    const idx = x > 0 ? (y > 0 ? 0 : 3) : (y > 0 ? 1 : 2);
    return {
      topic: I18N.tx('Kartezyen koordinat sistemi', 'Cartesian coordinate system'),
      text: I18N.tx(`P(${x}, ${y}) noktası hangi bölgededir?`, `Which quadrant is the point P(${x}, ${y}) in?`),
      options: names.slice(),
      correctIndex: idx,
      wrongNotes: [0, 1, 2, 3].map((j) => quadrantNote(j, idx)),
      plot: { xMin: -8, xMax: 8, yMin: -8, yMax: 8, points: [{ x, y, label: 'P' }] },
      solution: [
        I18N.tx(`x = ${x} ${x > 0 ? '> 0' : '< 0'} ve y = ${y} ${y > 0 ? '> 0' : '< 0'}`, `x = ${x} ${x > 0 ? '> 0' : '< 0'} and y = ${y} ${y > 0 ? '> 0' : '< 0'}`),
        'I: (+,+)   II: (-,+)   III: (-,-)   IV: (+,-)',
        I18N.tx(`Bu nedenle nokta ${names[idx]}dedir.`, `Therefore the point lies in ${names[idx]}.`),
      ],
    };
  }

  function genSlope(rng) {
    const x1 = rng.nextInt(-5, 5);
    const y1 = rng.nextInt(-5, 6);
    const dx = rng.nextInt(1, 6) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    let dy;
    do { dy = rng.nextInt(-6, 7); } while (dy === 0);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const correct = frac(dy, dx);
    const dxw = dx + 1 === 0 ? dx + 2 : dx + 1; // avoid a zero denominator (would print "undefined")
    const wrongs = [frac(dx, dy), frac(-dy, dx), frac(dy, dxw), frac(dy + 1, dx), frac(dy - 1, dx)];
    const q = makeQuestion(
      I18N.tx('Artışlar ve eğim', 'Increments and slope'),
      I18N.tx(`A(${x1}, ${y1}) ve B(${x2}, ${y2}) noktalarından geçen doğrunun eğimi kaçtır?`, `What is the slope of the line through A(${x1}, ${y1}) and B(${x2}, ${y2})?`),
      correct, wrongs,
      [
        `Δx = ${x2} - (${x1}) = ${dx}     Δy = ${y2} - (${y1}) = ${dy}`,
        I18N.tx('Eğim m = Δy / Δx', 'Slope m = Δy / Δx'),
        `m = ${dy}/${dx} = ${correct}`,
      ],
      rng,
      [
        I18N.tx('Eğimi Δx/Δy olarak hesapladın; doğrusu yükselme bölü yatay farktır (Δy/Δx).', 'You computed Δx/Δy; slope is rise over run, Δy/Δx.'),
        I18N.tx('Farkları farklı sırayla aldın (biri y₁ - y₂, diğeri x₂ - x₁), bu yüzden işaret ters çıktı.', 'You subtracted in opposite orders for y and x, so the sign came out reversed.'),
        I18N.tx('Paydada Δx yerine Δx + 1 kullandın; x farkını hesaplarken küçük bir hata yaptın.', 'You used Δx + 1 in the denominator; there was a small slip in computing the x difference.'),
        I18N.tx('Payda Δy yerine Δy + 1 kullandın; y farkını hesaplarken küçük bir hata yaptın.', 'You used Δy + 1 in the numerator; there was a small slip in computing the y difference.'),
        I18N.tx('Payda Δy yerine Δy - 1 kullandın; y farkını hesaplarken küçük bir hata yaptın.', 'You used Δy - 1 in the numerator; there was a small slip in computing the y difference.'),
      ]
    );
    const mx = Math.max(Math.max(Math.abs(x1), Math.abs(x2)), Math.max(Math.abs(y1), Math.abs(y2))) + 2;
    q.plot = { xMin: -mx, xMax: mx, yMin: -mx, yMax: mx, segments: [{ x1, y1, x2, y2 }], points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] };
    return q;
  }

  function genLine(rng) {
    let m;
    do { m = rng.nextInt(-3, 4); } while (m === 0);
    const x1 = rng.nextInt(-4, 5);
    const y1 = rng.nextInt(-5, 6);
    const b = y1 - m * x1;
    const wrongs = [lineStr(m, y1 + m * x1), lineStr(m, y1), lineStr(m, -b), lineStr(-m, b), lineStr(m, b + 1), lineStr(m, b - 1), lineStr(m, b + 2), lineStr(-m, -b)];
    const expandTr = `Aç: y = ${m}x ${plus(-m * x1)} ${plus(y1)}`.replace(/ {2}/g, ' ');
    const expandEn = `Expand: y = ${m}x ${plus(-m * x1)} ${plus(y1)}`.replace(/ {2}/g, ' ');
    const q = makeQuestion(
      I18N.tx('Doğru denklemi', 'Equation of a line'),
      I18N.tx(`(${x1}, ${y1}) noktasından geçen ve eğimi ${m} olan doğrunun denklemi hangisidir?`, `Which is the equation of the line through (${x1}, ${y1}) with slope ${m}?`),
      lineStr(m, b), wrongs,
      [
        I18N.tx(`Nokta-eğim formu: y - ${y1} = ${m}(x - (${x1}))`, `Point-slope form: y - ${y1} = ${m}(x - (${x1}))`),
        I18N.tx(expandTr, expandEn),
        I18N.tx(`Sadeleştir: ${lineStr(m, b)}`, `Simplify: ${lineStr(m, b)}`),
      ],
      rng,
      [
        I18N.tx('Kesim noktasını bulurken m·x₁ değerini y₁\'den çıkarmak yerine ekledin; işaret hatası.', 'When finding the intercept you added m·x₁ to y₁ instead of subtracting it; a sign error.'),
        I18N.tx('Noktanın y değerini doğrudan kesim noktası (b) sandın; bu sadece x₁ = 0 iken doğrudur.', 'You took the point\'s y-value as the intercept b; that only holds when x₁ = 0.'),
        I18N.tx('Kesim noktasını ters işaretle yazdın; b = y₁ - m·x₁ değerini eksiyle çarpmışsın.', 'You wrote the intercept with the wrong sign; b = y₁ - m·x₁ was negated.'),
        I18N.tx('Eğimin işaretini ters aldın; verilen eğim m\'dir, -m değil.', 'You changed the sign of the slope; the given slope is m, not -m.'),
        I18N.tx('Kesim noktası bir fazla çıktı; m·x₁ çarpımında küçük bir hata var.', 'The intercept is one too large; there is a small slip in computing m·x₁.'),
        I18N.tx('Kesim noktası bir eksik çıktı; m·x₁ çarpımında küçük bir hata var.', 'The intercept is one too small; there is a small slip in computing m·x₁.'),
        I18N.tx('Kesim noktası iki fazla çıktı; m·x₁ çarpımında hata var.', 'The intercept is two too large; there is a slip in computing m·x₁.'),
        I18N.tx('Hem eğimin hem kesim noktasının işaretini ters yazdın.', 'You reversed the sign of both the slope and the intercept.'),
      ]
    );
    q.plot = { xMin: -8, xMax: 8, yMin: -10, yMax: 10, points: [{ x: x1, y: y1, label: 'P' }] };
    return q;
  }

  function genPerpendicular(rng) {
    let p, q;
    do {
      p = rng.nextInt(1, 6) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
      q = rng.nextInt(1, 5);
      const g = gcd(p, q);
      p = Math.trunc(p / g); q = Math.trunc(q / g);
    } while (Math.abs(p) === q);
    const c = rng.nextInt(-5, 6);
    const parallel = rng.nextInt(0, 3) === 0;
    const correct = parallel ? frac(p, q) : frac(-q, p);
    const wrongs = [frac(q, p), frac(-p, q), frac(-q, p), frac(p, q)];
    const inner = q === 1 ? (p === 1 ? '' : (p === -1 ? '-' : String(p))) : `(${p}/${q})`;
    const given = `y = ${inner}x ${plus(c)}`;
    const qs = makeQuestion(
      I18N.tx('Paralel ve dik doğrular', 'Parallel and perpendicular lines'),
      I18N.tx(`${given} doğrusuna ${parallel ? 'PARALEL' : 'DİK'} olan bir doğrunun eğimi kaçtır?`, `What is the slope of a line ${parallel ? 'PARALLEL' : 'PERPENDICULAR'} to the line ${given}?`),
      correct, wrongs,
      [
        I18N.tx(`Verilen doğrunun eğimi m = ${frac(p, q)}`, `The slope of the given line is m = ${frac(p, q)}`),
        parallel
          ? I18N.tx('Paralel doğruların eğimleri eşittir: m₁ = m₂', 'Parallel lines have equal slopes: m₁ = m₂')
          : I18N.tx('Dik doğrularda m₁·m₂ = -1, yani m₂ = -1/m₁ (ters çevir, işareti değiştir)', 'For perpendicular lines m₁·m₂ = -1, so m₂ = -1/m₁ (invert and change the sign)'),
        I18N.tx(`İstenen eğim = ${correct}`, `Required slope = ${correct}`),
      ],
      rng,
      [
        I18N.tx('Eğimi sadece ters çevirdin; dik doğrularda işaret de değişmelidir, paralelde ise hiçbir şey değişmez.', 'You only inverted the slope; perpendicular also needs a sign change, and parallel needs neither.'),
        I18N.tx('Eğimin sadece işaretini değiştirdin; dik için ters çevirmek de gerekir, paralel için ise hiçbiri gerekmez.', 'You only negated the slope; perpendicular also needs inverting, and parallel needs neither.'),
        parallel ? I18N.tx('Paralel doğrularda eğim aynıdır; dik doğru kuralını (ters çevir ve işaret değiştir) uyguladın.', 'Parallel lines share the same slope; you applied the perpendicular rule (invert and negate).') : '',
        parallel ? '' : I18N.tx('Verilen doğrunun eğimini olduğu gibi aldın; bu paralel doğru için geçerlidir, dik için değil.', 'You kept the given slope unchanged; that is right for a parallel line, not a perpendicular one.'),
      ]
    );
    const slopeGiven = p / q;
    const icpt = c;
    qs.plot = { xMin: -8, xMax: 8, yMin: -8, yMax: 8, curves: [{ f: (x) => slopeGiven * x + icpt }] };
    return qs;
  }

  function genDistance(rng) {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
    const t = triples[rng.nextInt(0, triples.length)];
    const x1 = rng.nextInt(-4, 5);
    const y1 = rng.nextInt(-4, 5);
    const x2 = x1 + t[0] * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    const y2 = y1 + t[1] * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    const q = makeQuestion(
      I18N.tx('İki nokta arası uzaklık', 'Distance between two points'),
      I18N.tx(`A(${x1}, ${y1}) ve B(${x2}, ${y2}) noktaları arasındaki uzaklık kaçtır?`, `What is the distance between A(${x1}, ${y1}) and B(${x2}, ${y2})?`),
      String(t[2]),
      intWrongs(t[2], t[0] + t[1], t[2] * t[2], Math.abs(t[0] - t[1])),
      [
        'd = √[(x₂ - x₁)² + (y₂ - y₁)²]',
        `Δx = ${x2 - x1}, Δy = ${y2 - y1}  →  d = √(${t[0] * t[0]} + ${t[1] * t[1]}) = √${t[2] * t[2]}`,
        `d = ${t[2]}`,
      ],
      rng,
      intWrongNotes(
        I18N.tx('Yatay ve dikey farkları doğrudan topladın; karelerini alıp karekök almayı unuttun.', 'You added the horizontal and vertical differences directly instead of squaring, adding and taking the root.'),
        I18N.tx('Karelerin toplamını aldın ama karekökü almayı unuttun.', 'You summed the squares but forgot to take the square root.'),
        I18N.tx('İki farkın farkını aldın; uzaklık formülünde farkların kareleri toplanır.', 'You subtracted the two differences; the distance formula adds their squares.')
      )
    );
    const dm = Math.max(Math.max(Math.abs(x1), Math.abs(x2)), Math.max(Math.abs(y1), Math.abs(y2))) + 2;
    q.plot = { xMin: -dm, xMax: dm, yMin: -dm, yMax: dm, segments: [{ x1, y1, x2, y2 }], points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] };
    return q;
  }

  function genCircle(rng) {
    let h, k;
    do {
      h = rng.nextInt(-5, 6);
      k = rng.nextInt(-5, 6);
    } while (h === 0 || k === 0 || h === k || h === -k);
    const r = rng.nextInt(2, 8);
    const correct = I18N.tx(`Merkez (${h}, ${k}), r = ${r}`, `Center (${h}, ${k}), r = ${r}`);
    const wrongs = [
      I18N.tx(`Merkez (${-h}, ${-k}), r = ${r}`, `Center (${-h}, ${-k}), r = ${r}`),
      I18N.tx(`Merkez (${h}, ${k}), r = ${r * r}`, `Center (${h}, ${k}), r = ${r * r}`),
      I18N.tx(`Merkez (${k}, ${h}), r = ${r}`, `Center (${k}, ${h}), r = ${r}`),
      I18N.tx(`Merkez (${-h}, ${-k}), r = ${r * r}`, `Center (${-h}, ${-k}), r = ${r * r}`),
    ];
    const q = makeQuestion(
      I18N.tx('Çember', 'Circle'),
      I18N.tx(`${xTerm(h)}² + ${xTerm(k).replace('x', 'y')}² = ${r * r} çemberinin merkezi ve yarıçapı hangisidir?`, `Which are the center and radius of the circle ${xTerm(h)}² + ${xTerm(k).replace('x', 'y')}² = ${r * r}?`),
      correct, wrongs,
      [
        I18N.tx('Standart form: (x - h)² + (y - k)² = r²  →  merkez (h, k), yarıçap r', 'Standard form: (x - h)² + (y - k)² = r²  →  center (h, k), radius r'),
        I18N.tx(`x'in yanındaki işaret ters okunur: h = ${h}, k = ${k}`, `Read the signs inside the brackets reversed: h = ${h}, k = ${k}`),
        `r² = ${r * r}  →  r = ${r}`,
      ],
      rng,
      [
        I18N.tx('Parantez içindeki işaretleri olduğu gibi okudun; (x - h)\'da merkez +h\'dir, işaret ters çevrilir.', 'You read the centre coordinates with the wrong signs; in (x - h) the centre is +h.'),
        I18N.tx('Sağ taraftaki r² değerini yarıçap sandın; yarıçap için karekök almalısın.', 'You took the right-hand side r² as the radius; the radius needs a square root.'),
        I18N.tx('Merkezin x ve y koordinatlarını yer değiştirdin; ilk parantez x, ikinci parantez y ile ilgilidir.', 'You swapped the x and y coordinates of the centre; the first bracket is x, the second y.'),
        I18N.tx('Hem merkezin işaretlerini yanlış okudun hem de r² değerini yarıçap sandın.', 'You misread the centre\'s signs and also took r² as the radius.'),
      ]
    );
    const cm = Math.max(Math.abs(h), Math.abs(k)) + r + 1;
    // AddCircle(h, k, r) has no direct equivalent in the plot spec (curves are y=f(x) only), so the
    // circle is drawn as its upper/lower semicircle functions, which trace the same circle.
    const upper = (x) => { const d = r * r - (x - h) * (x - h); return d < 0 ? NaN : k + Math.sqrt(d); };
    const lower = (x) => { const d = r * r - (x - h) * (x - h); return d < 0 ? NaN : k - Math.sqrt(d); };
    q.plot = { xMin: -cm, xMax: cm, yMin: -cm, yMax: cm, curves: [{ f: upper }, { f: lower }] };
    return q;
  }

  function genParabola(rng) {
    let h;
    do { h = rng.nextInt(-5, 6); } while (h === 0);
    const c = rng.nextInt(-6, 7);
    const wrongs = [`x = ${-h}`, `x = ${2 * h}`, `x = ${-2 * h}`, `x = ${h + 1}`];
    const q = makeQuestion(
      I18N.tx('Parabol', 'Parabola'),
      I18N.tx(`y = x² ${plus(-2 * h)}x ${plus(c)} parabolünün tepe noktasının x koordinatı kaçtır?`, `What is the x-coordinate of the vertex of the parabola y = x² ${plus(-2 * h)}x ${plus(c)}?`),
      `x = ${h}`, wrongs,
      [
        I18N.tx('y = ax² + bx + c için tepe noktası x = -b / (2a)', 'For y = ax² + bx + c the vertex is at x = -b / (2a)'),
        `a = 1, b = ${-2 * h}  →  x = -(${-2 * h}) / 2`,
        `x = ${h}`,
      ],
      rng,
      [
        I18N.tx('-b/(2a) formülünde b\'nin işaretini değiştirmeyi unuttun; sonuç ters işaretli çıktı.', 'You forgot to negate b in -b/(2a); the sign of the result came out reversed.'),
        I18N.tx('Paydada 2a yerine a kullandın; -b\'yi sadece a\'ya böldün, 2 ile bölmeyi unuttun.', 'You divided -b by a only and forgot the factor 2 in the denominator 2a.'),
        I18N.tx('b\'yi işaretini değiştirmeden a\'ya böldün; hem 2 çarpanını hem eksi işaretini unuttun.', 'You divided b by a, missing both the factor 2 and the minus sign in -b/(2a).'),
        I18N.tx('Sonuç gerçek değerden bir fazla çıktı; bölme işleminde küçük bir hata var.', 'The result is one more than the true value; there is a small slip in the division.'),
      ]
    );
    const hh = h, cc = c;
    const yAtVertexMinus2 = c - h * h - 2.0;
    const yMin = Math.min(-3.0, yAtVertexMinus2);
    const yMax = Math.max(6.0, Math.min(yMin + 24.0, 30.0));
    q.plot = { xMin: -10, xMax: 10, yMin, yMax, curves: [{ f: (x) => x * x - 2.0 * hh * x + cc }] };
    return q;
  }

  // ---------- angle of inclination / perpendicular generators ----------

  // Mirrors AngleWrongs: specific [value, note] pairs first, then clean-angle fillers, all distinct from correct.
  function angleWrongs(correct, specific) {
    const wrongs = [];
    const notes = [];
    const used = new Set([correct]);
    for (const sp of specific) {
      if (!used.has(sp[0])) {
        used.add(sp[0]);
        wrongs.push(`${sp[0]}°`);
        notes.push(sp[1]);
      }
    }
    for (const v of [30, 45, 60, 90, 120, 135, 150, 0, 180]) {
      if (!used.has(v)) {
        used.add(v);
        wrongs.push(`${v}°`);
        notes.push(I18N.tx('Tablodaki özel açıları (tan 30° = √3/3, tan 45° = 1, tan 60° = √3) karıştırdın.', 'You mixed up the special angles (tan 30° = √3/3, tan 45° = 1, tan 60° = √3).'));
      }
    }
    return { wrongs, notes };
  }

  function genSlopeAngle(rng) {
    const table = [['0', 0], ['1', 45], ['-1', 135], ['√3', 60], ['-√3', 120], ['√3/3', 30], ['-√3/3', 150], ['undef', 90]];
    const pick = table[rng.nextInt(0, table.length)];
    const th = pick[1];
    const isVertical = pick[0] === 'undef';
    const text = isVertical
      ? I18N.tx('Eğimi tanımsız olan (dikey) bir doğrunun pozitif x ekseniyle saat yönünün tersine yaptığı açı kaçtır?', 'What angle (counter-clockwise from the positive x-axis) does a vertical line (undefined slope) make?')
      : I18N.tx(`Eğimi m = ${pick[0]} olan doğrunun pozitif x ekseniyle saat yönünün tersine yaptığı açı (eğim açısı) kaçtır?`, `What is the angle of inclination (counter-clockwise from the positive x-axis) of a line with slope m = ${pick[0]}?`);
    const specific = [];
    if (!isVertical) {
      if (th > 90) {
        specific.push([th - 180, I18N.tx('arctan(m) negatif çıkar; saat yönünün tersine ölçmek için 180° eklemeyi unuttun.', 'arctan(m) is negative; you forgot to add 180° to measure counter-clockwise.')]);
        specific.push([180 - th, I18N.tx('Negatif eğimde θ = 180° - |arctan m| olmalı; sadece |arctan m| değerini aldın.', 'For a negative slope θ = 180° - |arctan m|; you only used |arctan m|.')]);
        specific.push([th - 90, I18N.tx('tan θ = m ilişkisini cot ile karıştırıp 90° kaydırdın.', 'You confused tan with cot and shifted by 90°.')]);
      } else if (th === 0) {
        specific.push([90, I18N.tx('Eğimi 0 olan doğru yataydır (θ = 0°); dikey doğruyla karıştırdın.', 'A line with slope 0 is horizontal (θ = 0°); you mixed it up with a vertical line.')]);
        specific.push([180, I18N.tx('θ = 0° ile 180° aynı doğruyu verir ama ana değer 0° ≤ θ < 180° aralığındadır.', 'θ = 0° and 180° describe the same line, but the principal value is in 0° ≤ θ < 180°.')]);
      } else {
        specific.push([90 - th, I18N.tx('Eğimi tan θ yerine cot θ gibi aldın (arctan(1/m)); açı tümlerine dönüştü.', 'You used the slope like cot θ (arctan(1/m)); the angle became its complement.')]);
        specific.push([180 - th, I18N.tx('Pozitif eğimde θ dar açıdır; 180° - θ negatif eğim için geçerlidir.', 'For a positive slope θ is acute; 180° - θ belongs to a negative slope.')]);
        specific.push([th + 90, I18N.tx('Gereksiz yere 90° ekledin; m = tan θ ilişkisinde θ = arctan m yeterlidir.', 'You added 90° needlessly; θ = arctan m is enough here.')]);
      }
    } else {
      specific.push([0, I18N.tx('Dikey doğruyu yatay doğruyla karıştırdın; yatay doğruda θ = 0°.', 'You mixed up vertical with horizontal; a horizontal line has θ = 0°.')]);
      specific.push([180, I18N.tx('180° yatay bir doğrunun (aynı doğru) açısıdır; dikey doğru pozitif x eksenine diktir.', '180° belongs to a horizontal line; a vertical line is perpendicular to the positive x-axis.')]);
      specific.push([45, I18N.tx('Eğim tanımsızken açı 45° olmaz; 45° eğimi 1 olan doğrudur.', 'An undefined slope does not give 45°; 45° belongs to slope 1.')]);
    }
    const aw = angleWrongs(th, specific);
    const sol = [];
    if (isVertical) {
      sol.push(I18N.tx('Dikey doğru pozitif x eksenine diktir.', 'A vertical line is perpendicular to the positive x-axis.'));
      sol.push('θ = 90°');
    } else {
      sol.push('m = tan θ');
      if (th > 90) {
        const a = 180 - th;
        sol.push(`arctan(${pick[0]}) = -${a}°  (m < 0)`);
        sol.push(`θ = 180° - ${a}° = ${th}°`);
      } else {
        sol.push(`θ = arctan(${pick[0]}) = ${th}°`);
      }
    }
    return makeQuestion(I18N.tx('Eğim açısı', 'Angle of inclination'), text, `${th}°`, aw.wrongs, sol, rng, aw.notes);
  }

  function genPerpSlopeFromPoints(rng) {
    const x1 = rng.nextInt(-5, 5);
    const y1 = rng.nextInt(-5, 6);
    let dx, dy;
    do {
      dx = rng.nextInt(1, 6) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
      dy = rng.nextInt(1, 6) * (rng.nextInt(0, 2) === 0 ? 1 : -1);
    } while (Math.abs(dx) === Math.abs(dy));
    const x2 = x1 + dx, y2 = y1 + dy;
    const correct = frac(-dx, dy);
    const wrongs = [frac(dy, dx), frac(dx, dy), frac(-dy, dx), frac(-dx, dy + 1), frac(dx, dy + 1), frac(-dx - 1, dy)];
    const notes = [
      I18N.tx('AB doğrusunun eğimini verdin; dik doğru için ters çevirip işaret değiştirmek gerekir.', 'You gave the slope of AB itself; the perpendicular needs flipping and a sign change.'),
      I18N.tx('Eğimi sadece ters çevirdin; dik doğruda işaret de değişmelidir (m · m⊥ = -1).', 'You only flipped the slope; the sign must change too (m · m⊥ = -1).'),
      I18N.tx('Eğimin sadece işaretini değiştirdin; dik doğruda ayrıca ters çevirmek gerekir.', 'You only changed the sign; the perpendicular also needs the slope flipped.'),
      I18N.tx('Dik eğimi bulurken paydada küçük bir hata yaptın.', 'There is a small slip in the denominator of the perpendicular slope.'),
      I18N.tx('Dik eğimi bulurken paydada küçük bir hata yaptın.', 'There is a small slip in the denominator of the perpendicular slope.'),
      I18N.tx('Dik eğimi bulurken payda küçük bir hata yaptın.', 'There is a small slip in the numerator of the perpendicular slope.'),
    ];
    const mText = frac(dy, dx);
    const q = makeQuestion(
      I18N.tx('Dik doğrunun eğimi', 'Slope of a perpendicular line'),
      I18N.tx(`A(${x1}, ${y1}) ve B(${x2}, ${y2}) noktalarından geçen doğruya dik olan doğrunun eğimi kaçtır?`, `What is the slope of a line perpendicular to the line through A(${x1}, ${y1}) and B(${x2}, ${y2})?`),
      correct, wrongs,
      [
        `m = Δy/Δx = ${dy}/${dx} = ${mText}`,
        I18N.tx('Dik doğruda m · m⊥ = -1 → m⊥ = -1/m', 'For a perpendicular m · m⊥ = -1 → m⊥ = -1/m'),
        `m⊥ = -1/(${mText}) = ${correct}`,
      ],
      rng, notes
    );
    const mxv = Math.max(Math.max(Math.abs(x1), Math.abs(x2)), Math.max(Math.abs(y1), Math.abs(y2))) + 2;
    q.plot = { xMin: -mxv, xMax: mxv, yMin: -mxv, yMax: mxv, equalAspect: true, segments: [{ x1, y1, x2, y2 }], points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] };
    return q;
  }

  function genPerpAngle(rng) {
    const angles = [30, 45, 60, 120, 135, 150];
    const th = angles[rng.nextInt(0, angles.length)];
    const correct = th < 90 ? th + 90 : th - 90;
    const specific = [];
    if (th < 90) {
      specific.push([90 - th, I18N.tx('90° - θ (tümler açı) aldın; dik doğrunun açısı θ + 90°\'dir.', 'You took 90° - θ (the complement); the perpendicular\'s angle is θ + 90°.')]);
      specific.push([180 - th, I18N.tx('180° - θ aldın; bu doğrunun ayna görüntüsüdür, dik doğru değil.', 'You took 180° - θ; that is the mirror image of the line, not its perpendicular.')]);
      specific.push([th - 90, I18N.tx('θ - 90° negatif açı verir; saat yönünün tersine ölçmek için 180° eklemelisin (θ + 90°).', 'θ - 90° gives a negative angle; add 180° to measure counter-clockwise (θ + 90°).')]);
    } else {
      specific.push([th + 90, I18N.tx('θ + 90° 180°\'yi aşar; ana değer 0° ≤ θ < 180° olmalı, bu yüzden θ - 90° alınır.', 'θ + 90° exceeds 180°; the principal value lies in 0° ≤ θ < 180°, so use θ - 90°.')]);
      specific.push([180 - th, I18N.tx('180° - θ aldın; bu ayna görüntüsüdür, dik doğrunun açısı θ - 90°\'dir.', 'You took 180° - θ; that is the mirror image, the perpendicular\'s angle is θ - 90°.')]);
      specific.push([90 - th, I18N.tx('90° - θ negatif çıkar; doğrusu θ - 90°\'dir.', '90° - θ comes out negative; it should be θ - 90°.')]);
    }
    const aw = angleWrongs(correct, specific);
    const sol = [
      I18N.tx('Dik doğrular arasında 90° fark vardır; açı 0° ≤ θ < 180° aralığında kalmalıdır.', 'Perpendicular lines differ by 90°; the angle must stay in 0° ≤ θ < 180°.'),
      th < 90 ? `θ⊥ = θ + 90° = ${th}° + 90° = ${correct}°` : `θ⊥ = θ - 90° = ${th}° - 90° = ${correct}°`,
    ];
    const q = makeQuestion(
      I18N.tx('Dik doğrunun eğim açısı', 'Angle of a perpendicular line'),
      I18N.tx(`Eğim açısı ${th}° olan bir doğruya dik olan doğrunun eğim açısı (0° ≤ θ < 180°) kaçtır?`, `A line has angle of inclination ${th}°. What is the angle of inclination (0° ≤ θ < 180°) of a line perpendicular to it?`),
      `${correct}°`, aw.wrongs, sol, rng, aw.notes
    );
    const tn = Math.tan(th * Math.PI / 180.0);
    q.plot = { xMin: -6, xMax: 6, yMin: -6, yMax: 6, equalAspect: true, curves: [{ f: (x) => tn * x }] };
    return q;
  }

  // ---------- exam-pool helpers (used only by the generators below) ----------

  const T = (tr, en) => I18N.tx(tr, en);
  const absN = Math.abs;

  function coef(a, v, first) {
    const body = (absN(a) === 1 ? '' : String(absN(a))) + v;
    return first ? (a < 0 ? '-' : '') + body : (a < 0 ? '- ' : '+ ') + body;
  }
  // "ax + by + c = 0"
  function genForm(a, b, c) {
    let s = coef(a, 'x', true);
    if (b) s += ' ' + coef(b, 'y', false);
    if (c) s += ` ${c < 0 ? '-' : '+'} ${absN(c)}`;
    return s + ' = 0';
  }
  // "ax + by = c"
  function eqStr(a, b, c) {
    let s = coef(a, 'x', true);
    if (b) s += ' ' + coef(b, 'y', false);
    return s + ` = ${c}`;
  }
  function quad(a, b, c) {
    let s = (a === 1 ? '' : (a === -1 ? '-' : String(a))) + 'x²';
    if (b) s += ` ${b < 0 ? '-' : '+'} ${absN(b) === 1 ? '' : absN(b)}x`;
    if (c) s += ` ${c < 0 ? '-' : '+'} ${absN(c)}`;
    return s;
  }
  function circEq(h, k, R) { return `${xTerm(h)}² + ${xTerm(k).replace('x', 'y')}² = ${R}`; }
  function circGen(D, E, F) {
    let s = 'x² + y²';
    if (D) s += ` ${D < 0 ? '-' : '+'} ${absN(D)}x`;
    if (E) s += ` ${E < 0 ? '-' : '+'} ${absN(E)}y`;
    if (F) s += ` ${F < 0 ? '-' : '+'} ${absN(F)}`;
    return s + ' = 0';
  }
  function circCR(h, k, r) { return T(`Merkez (${h}, ${k}), r = ${r}`, `Center (${h}, ${k}), r = ${r}`); }
  function iv(l, r, lc, rc) { return `${lc ? '[' : '('}${l}, ${r}${rc ? ']' : ')'}`; }
  function ou(lo, hi, lc, rc) { return `(-∞, ${lo}${lc ? ']' : ')'} ∪ ${rc ? '[' : '('}${hi}, ∞)`; }
  function rootsStr(a, b) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return T(`x = ${lo} veya x = ${hi}`, `x = ${lo} or x = ${hi}`);
  }
  function pt(x, y) { return `(${x}, ${y})`; }
  function lineM(num, den, b) {
    const g = gcd(num, den);
    num = Math.trunc(num / g); den = Math.trunc(den / g);
    if (den < 0) { num = -num; den = -den; }
    if (den === 1) return lineStr(num, b);
    return b === 0 ? `y = (${num}/${den})x` : `y = (${num}/${den})x ${plus(b)}`;
  }
  function sg(rng) { return rng.nextInt(0, 2) === 0 ? 1 : -1; }
  // pairs: [[option, note], ...] -> parallel arrays
  function wr(pairs) { return { w: pairs.map((p) => p[0]), n: pairs.map((p) => p[1]) }; }
  function subset(rng, lo, hi, nmin, nmax) {
    const pool = [];
    for (let i = lo; i <= hi; i++) pool.push(i);
    shuffleArr(pool, rng);
    return pool.slice(0, rng.nextInt(nmin, nmax + 1)).sort((x, y) => x - y);
  }

  // ---------- NEW level 1 generators ----------

  function genSetOps(rng) {
    let a, b, inter, ab, ba;
    do {
      a = subset(rng, 1, 9, 4, 5); b = subset(rng, 1, 9, 4, 5);
      inter = a.filter((v) => b.includes(v));
      ab = a.filter((v) => !b.includes(v));
      ba = b.filter((v) => !a.includes(v));
    } while (!inter.length || !ab.length || !ba.length);
    const S = (arr) => '{' + arr.join(', ') + '}';
    const uni = Array.from(new Set(a.concat(b))).sort((x, y) => x - y);
    const ops = [
      ['A ∩ B', inter, T('ortak elemanlar', 'the common elements')],
      ['A \\ B', ab, T('A\'da olup B\'de olmayanlar', 'elements in A but not in B')],
      ['B \\ A', ba, T('B\'de olup A\'da olmayanlar', 'elements in B but not in A')],
      ['A ∪ B', uni, T('tüm elemanlar', 'all the elements')],
    ];
    const asked = rng.nextInt(0, 3);
    const wrongs = [];
    const notes = [];
    for (let i = 0; i < 4; i++) {
      if (i === asked) continue;
      wrongs.push(S(ops[i][1]));
      notes.push(T(`Bu küme ${ops[i][0]} işleminin sonucudur (${ops[i][2]}); sorulan işlem ${ops[asked][0]}.`, `This set is the result of ${ops[i][0]} (${ops[i][2]}); the question asks for ${ops[asked][0]}.`));
    }
    return makeQuestion(
      T('Kümeler', 'Sets'),
      T(`A = ${S(a)} ve B = ${S(b)} olduğuna göre ${ops[asked][0]} kümesi hangisidir?`, `Given A = ${S(a)} and B = ${S(b)}, which set is ${ops[asked][0]}?`),
      S(ops[asked][1]), wrongs,
      [
        `${ops[asked][0]} = ${ops[asked][2]}`,
        `A = ${S(a)},  B = ${S(b)}`,
        `${ops[asked][0]} = ${S(ops[asked][1])}`,
      ],
      rng, notes
    );
  }

  function genIntervalNotation(rng) {
    const kind = rng.nextInt(0, 3);
    let text, correct, wrongs, notes;
    const hint = T('Köşeli parantez "dahil", yuvarlak parantez "hariç" demektir; eşitsizlik işaretiyle (≤ / <) eşleştir.', 'A square bracket means "included", a round bracket "excluded"; match them with the sign (≤ / <).');
    if (kind === 0) {
      const lo = rng.nextInt(-6, 2), hi = lo + rng.nextInt(2, 8);
      const lc = rng.nextInt(0, 2) === 0, rc = rng.nextInt(0, 2) === 0;
      text = `${lo} ${lc ? '≤' : '<'} x ${rc ? '≤' : '<'} ${hi}`;
      correct = iv(lo, hi, lc, rc);
      wrongs = [iv(lo, hi, !lc, !rc), iv(lo, hi, !lc, rc), iv(lo, hi, lc, !rc), iv(-hi, -lo, lc, rc)];
      notes = [T('İki uçtaki parantez türlerini de ters aldın.', 'You reversed the bracket type at both ends.'), T('Sol uçtaki parantezi ters aldın.', 'You reversed the bracket at the left end.'), T('Sağ uçtaki parantezi ters aldın.', 'You reversed the bracket at the right end.'), T('Uç noktaların işaretini değiştirdin.', 'You changed the sign of the endpoints.')];
    } else {
      const a = rng.nonZeroInt(-6, 6);
      const greater = rng.nextInt(0, 2) === 0, cl = rng.nextInt(0, 2) === 0;
      const op = greater ? (cl ? '≥' : '>') : (cl ? '≤' : '<');
      text = `x ${op} ${a}`;
      correct = greater ? `${cl ? '[' : '('}${a}, ∞)` : `(-∞, ${a}${cl ? ']' : ')'}`;
      wrongs = greater
        ? [`${cl ? '(' : '['}${a}, ∞)`, `(-∞, ${a}${cl ? ']' : ')'}`, `(-∞, ${a}${cl ? ')' : ']'}`, `${cl ? '[' : '('}${-a}, ∞)`]
        : [`(-∞, ${a}${cl ? ')' : ']'}`, `${cl ? '[' : '('}${a}, ∞)`, `${cl ? '(' : '['}${a}, ∞)`, `(-∞, ${-a}${cl ? ']' : ')'}`];
      notes = [T('Uç noktanın dahil olup olmadığını (≥ / >) yanlış yorumladın.', 'You misread whether the endpoint is included (≥ / >).'), T('Yönü ters aldın: büyük/küçük yönü karıştı.', 'You reversed the direction (greater/less).'), T('Yönü ve uç noktayı birlikte yanlış aldın.', 'You got both the direction and the endpoint wrong.'), T('Uç noktanın işaretini ters yazdın.', 'You wrote the endpoint with the wrong sign.')];
    }
    return makeQuestion(
      T('Reel sayı doğrusu ve sıralama', 'Real line and ordering'),
      T(`${text} eşitsizliğinin aralık gösterimi hangisidir?`, `Which is the interval notation of ${text}?`),
      correct, wrongs,
      [hint, `${text}  →  ${correct}`],
      rng, notes
    );
  }

  function genMidpoint(rng) {
    const x1 = rng.nextInt(-6, 7), y1 = rng.nextInt(-6, 7);
    const dx = rng.nonZeroInt(-4, 4), dy = rng.nonZeroInt(-4, 4);
    const x2 = x1 + 2 * dx, y2 = y1 + 2 * dy;
    const mx = x1 + dx, my = y1 + dy;
    const w = wr([
      [pt(x1 + x2, y1 + y2), T('Koordinatları toplayıp 2\'ye bölmeyi unuttun.', 'You added the coordinates but forgot to divide by 2.')],
      [pt(dx, dy), T('Orta nokta yerine farkın yarısını (Δ/2) yazdın; ilk noktayı da eklemelisin.', 'You wrote half the difference (Δ/2) instead of the midpoint; the starting point must be added.')],
      [pt(my, mx), T('x ve y koordinatlarını yer değiştirdin.', 'You swapped the x and y coordinates.')],
      [pt(mx + 1, my), T('x koordinatında küçük bir hesap hatası var.', 'There is a small slip in the x-coordinate.')],
      [pt(mx, my - 1), T('y koordinatında küçük bir hesap hatası var.', 'There is a small slip in the y-coordinate.')],
    ]);
    return makeQuestion(
      T('İki nokta arası uzaklık', 'Distance between two points'),
      T(`A(${x1}, ${y1}) ve B(${x2}, ${y2}) noktalarını birleştiren doğru parçasının orta noktası hangisidir?`, `Which is the midpoint of the segment joining A(${x1}, ${y1}) and B(${x2}, ${y2})?`),
      pt(mx, my), w.w,
      [
        T('Orta nokta M = ((x₁ + x₂)/2, (y₁ + y₂)/2)', 'Midpoint M = ((x₁ + x₂)/2, (y₁ + y₂)/2)'),
        `x = (${x1} ${plus(x2)})/2 = ${mx},   y = (${y1} ${plus(y2)})/2 = ${my}`,
        `M = ${pt(mx, my)}`,
      ],
      rng, w.n,
      { xMin: -14, xMax: 14, yMin: -14, yMax: 14, segments: [{ x1, y1, x2, y2 }], points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] }
    );
  }

  // ---------- NEW level 2 generators ----------

  function genCircleExpand(rng) {
    let h, k;
    do { h = rng.nextInt(-5, 6); k = rng.nextInt(-5, 6); } while (h === 0 || k === 0 || h === k || h === -k);
    const r = rng.nextInt(2, 7);
    const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
    const w = wr([
      [circGen(-D, -E, F), T('Merkezin işaretini ters aldın: (x - h)² açılınca x teriminin katsayısı -2h olur.', 'You reversed the sign of the centre: expanding (x - h)² gives -2h as the x coefficient.')],
      [circGen(D, E, h * h + k * k + r * r), T('Sabit terimi h² + k² + r² aldın; doğrusu h² + k² - r².', 'You used h² + k² + r² as the constant; it is h² + k² - r².')],
      [circGen(-h, -k, F), T('Katsayıdaki 2 çarpanını unuttun; (x - h)² = x² - 2hx + h².', 'You forgot the factor 2: (x - h)² = x² - 2hx + h².')],
      [circGen(D, E, h * h + k * k - r), T('r² yerine r kullandın.', 'You used r instead of r².')],
      [circGen(D, E, -r * r), T('Sabit terime h² ve k² eklemeyi unuttun.', 'You forgot to add h² and k² to the constant.')],
    ]);
    return makeQuestion(
      T('Çember', 'Circle'),
      T(`Merkezi (${h}, ${k}) ve yarıçapı ${r} olan çemberin denklemi (x² + y² + Dx + Ey + F = 0 biçiminde) hangisidir?`, `Which is the equation (in the form x² + y² + Dx + Ey + F = 0) of the circle with centre (${h}, ${k}) and radius ${r}?`),
      circGen(D, E, F), w.w,
      [
        circEq(h, k, r * r),
        T(`Parantezleri aç: x² ${plus(-2 * h)}x ${plus(h * h)} + y² ${plus(-2 * k)}y ${plus(k * k)} = ${r * r}`, `Expand: x² ${plus(-2 * h)}x ${plus(h * h)} + y² ${plus(-2 * k)}y ${plus(k * k)} = ${r * r}`),
        T(`Sağ tarafı sola at: ${circGen(D, E, F)}`, `Move everything to the left: ${circGen(D, E, F)}`),
      ],
      rng, w.n
    );
  }

  function genParabolaVertex(rng) {
    let h, k;
    do { h = rng.nextInt(-5, 6); k = rng.nextInt(-6, 7); } while (h === 0 || k === 0);
    const b = -2 * h, c = h * h + k;
    const w = wr([
      [pt(-h, k), T('Tepe noktasının x değerini -b/(2a) yerine b/(2a) aldın (işaret hatası).', 'You used b/(2a) instead of -b/(2a) for the vertex x (sign error).')],
      [pt(h, c), T('Sabit terim c\'yi tepe noktasının y değeri sandın; c, y eksenini kestiği değerdir.', 'You took the constant c as the vertex y-value; c is the y-intercept.')],
      [pt(h, -k), T('Tepe noktasının y değerinin işaretini ters aldın.', 'You reversed the sign of the vertex y-value.')],
      [pt(-h, c), T('x değerinde işaret hatası var ve y için c kullanıldı.', 'Sign error in x, and c was used as the y-value.')],
      [pt(h, k + 1), T('y değerinde küçük bir hesap hatası var.', 'There is a small slip in the y-value.')],
    ]);
    const yMin = Math.min(-3, k - 2), yMax = Math.max(6, Math.min(yMin + 24, 30));
    return makeQuestion(
      T('Parabol', 'Parabola'),
      T(`y = ${quad(1, b, c)} parabolünün tepe noktası hangisidir?`, `Which is the vertex of the parabola y = ${quad(1, b, c)}?`),
      pt(h, k), w.w,
      [
        T('x = -b/(2a) formülüyle tepe noktasının x değerini bul.', 'Use x = -b/(2a) for the vertex x-value.'),
        `x = -(${b})/2 = ${h}`,
        `y = ${h}² ${plus(b * h)} ${plus(c)} = ${k}   →   ${pt(h, k)}`,
      ],
      rng, w.n,
      { xMin: -10, xMax: 10, yMin, yMax, curves: [{ f: (x) => x * x + b * x + c }], points: [{ x: h, y: k, label: 'T' }] }
    );
  }

  function genAbsIneq(rng) {
    let h;
    do { h = rng.nextInt(-6, 7); } while (h === 0);
    const k = rng.nextInt(1, 7);
    const less = rng.nextInt(0, 2) === 0, cl = rng.nextInt(0, 2) === 0;
    const op = less ? (cl ? '≤' : '<') : (cl ? '≥' : '>');
    const lo = h - k, hi = h + k;
    const inside = (c) => iv(lo, hi, c, c);
    const outside = (c) => ou(lo, hi, c, c);
    const correct = less ? inside(cl) : outside(cl);
    const w = wr(less ? [
      [outside(cl), T('Küçüktür türünde çözüm iki sayı ARASINDADIR; dışını yazdın.', 'For a "less than" absolute value inequality the solution lies BETWEEN the two numbers; you wrote the outside.')],
      [iv(-h - k, -h + k, cl, cl), T('Merkezi ters işaretle aldın; |x - h| ifadesinin merkezi +h\'dir.', 'You used the wrong sign for the centre; for |x - h| the centre is +h.')],
      [iv(-k, k, cl, cl), T('Merkezi (h) kaydırmayı unuttun; aralık 0 merkezli değildir.', 'You forgot to shift by the centre h; the interval is not centred at 0.')],
      [inside(!cl), T('Uç noktaların dahil olup olmadığını (≤ / <) yanlış yorumladın.', 'You misread whether the endpoints are included (≤ / <).')],
    ] : [
      [inside(cl), T('Büyüktür türünde çözüm DIŞTADIR; iki sayı arasını yazdın.', 'For a "greater than" absolute value inequality the solution is OUTSIDE; you wrote the interval between.')],
      [ou(-h - k, -h + k, cl, cl), T('Merkezi ters işaretle aldın; |x - h| ifadesinin merkezi +h\'dir.', 'You used the wrong sign for the centre; for |x - h| the centre is +h.')],
      [ou(-k, k, cl, cl), T('Merkezi (h) kaydırmayı unuttun.', 'You forgot to shift by the centre h.')],
      [outside(!cl), T('Uç noktaların dahil olup olmadığını (≥ / >) yanlış yorumladın.', 'You misread whether the endpoints are included (≥ / >).')],
    ]);
    const term = trimParens(xTerm(h));
    const lop = cl ? '≤' : '<';
    return makeQuestion(
      T('Mutlak değer', 'Absolute value'),
      T(`|${term}| ${op} ${k} eşitsizliğinin çözüm kümesi hangisidir?`, `Which is the solution set of |${term}| ${op} ${k}?`),
      correct, w.w,
      [
        less ? `|A| ${op} k  ⇔  -k ${op} A ${op} k` : T(`|A| ${op} k  ⇔  A ${lop} -k  veya  A ${op} k`, `|A| ${op} k  ⇔  A ${lop} -k  or  A ${op} k`),
        less ? `-${k} ${op} ${term} ${op} ${k}  →  ${lo} ${op} x ${op} ${hi}` : T(`${term} ${lop} -${k}  veya  ${term} ${op} ${k}  →  x ${lop} ${lo}  veya  x ${op} ${hi}`, `${term} ${lop} -${k}  or  ${term} ${op} ${k}  →  x ${lop} ${lo}  or  x ${op} ${hi}`),
        `x ∈ ${correct}`,
      ],
      rng, w.n
    );
  }

  function genLineTwoPoints(rng) {
    const q = rng.pick([2, 3, 4]);
    let p;
    do { p = rng.nonZeroInt(-5, 5); } while (gcd(p, q) !== 1);
    const b = rng.nonZeroInt(-5, 5);
    const s = rng.pick([-2, -1, 1, 2]);
    const x1 = q * s, y1 = p * s + b, x2 = x1 + q, y2 = y1 + p;
    const w = wr([
      [lineM(q, p, b), T('Eğimi Δx/Δy olarak hesapladın (ters).', 'You computed the slope as Δx/Δy (inverted).')],
      [lineM(-p, q, b), T('Eğimin işaretini ters aldın.', 'You reversed the sign of the slope.')],
      [lineM(p, q, -b), T('Kesim noktasının işaretini ters yazdın.', 'You wrote the intercept with the wrong sign.')],
      [lineM(p, q, b + p), T('Kesim noktasını hesaplarken A yerine B\'nin y değerini kullandın.', 'When finding the intercept you used the y-value of B in place of A\'s.')],
      [lineM(p, q, y1), T('Noktanın y değerini doğrudan kesim noktası sandın.', 'You took the point\'s y-value as the intercept.')],
    ]);
    return makeQuestion(
      T('Doğru denklemi', 'Equation of a line'),
      T(`A(${x1}, ${y1}) ve B(${x2}, ${y2}) noktalarından geçen doğrunun denklemi hangisidir?`, `Which is the equation of the line through A(${x1}, ${y1}) and B(${x2}, ${y2})?`),
      lineM(p, q, b), w.w,
      [
        `m = (${y2} - (${y1}))/(${x2} - (${x1})) = ${p}/${q}`,
        T(`Nokta-eğim: y - (${y1}) = (${p}/${q})(x - (${x1}))`, `Point-slope: y - (${y1}) = (${p}/${q})(x - (${x1}))`),
        T(`Sadeleştir: ${lineM(p, q, b)}`, `Simplify: ${lineM(p, q, b)}`),
      ],
      rng, w.n,
      { xMin: -9, xMax: 9, yMin: -12, yMax: 12, segments: [{ x1, y1, x2, y2 }], points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] }
    );
  }

  function genMidpointEndpoint(rng) {
    let x1, y1, mx, my, x2, y2;
    do {
      x1 = rng.nextInt(-6, 7); y1 = rng.nextInt(-6, 7);
      mx = rng.nextInt(-5, 6); my = rng.nextInt(-5, 6);
      x2 = 2 * mx - x1; y2 = 2 * my - y1;
    } while ((x2 === x1 && y2 === y1) || x1 === y1 || x2 === y2 || mx === my);
    const w = wr([
      [pt(mx - x1, my - y1), T('Orta noktadan A\'yı çıkarıp bıraktın; farkı M\'ye bir kez daha eklemelisin (B = 2M - A).', 'You only subtracted A from M; the difference must be added to M again (B = 2M - A).')],
      [pt(x1 - 2 * mx, y1 - 2 * my), T('A - 2M hesapladın; doğrusu 2M - A.', 'You computed A - 2M; it should be 2M - A.')],
      [pt(2 * mx + x1, 2 * my + y1), T('2M - A yerine 2M + A aldın.', 'You used 2M + A instead of 2M - A.')],
      [pt(mx + x1, my + y1), T('M ile A\'yı topladın; orta nokta formülünü tersine çevirmelisin.', 'You added M and A; the midpoint formula must be inverted properly.')],
      [pt(y2, x2), T('x ve y koordinatlarını yer değiştirdin.', 'You swapped the x and y coordinates.')],
    ]);
    return makeQuestion(
      T('İki nokta arası uzaklık', 'Distance between two points'),
      T(`M(${mx}, ${my}) noktası, A(${x1}, ${y1}) ve B noktalarını birleştiren doğru parçasının orta noktasıdır. B noktası hangisidir?`, `M(${mx}, ${my}) is the midpoint of the segment joining A(${x1}, ${y1}) and B. Which is B?`),
      pt(x2, y2), w.w,
      [
        T('M = ((x₁ + x₂)/2, (y₁ + y₂)/2) olduğundan x₂ = 2xₘ - x₁, y₂ = 2yₘ - y₁', 'Since M = ((x₁ + x₂)/2, (y₁ + y₂)/2): x₂ = 2xₘ - x₁, y₂ = 2yₘ - y₁'),
        `x₂ = 2(${mx}) - (${x1}) = ${x2},   y₂ = 2(${my}) - (${y1}) = ${y2}`,
        `B = ${pt(x2, y2)}`,
      ],
      rng, w.n
    );
  }

  function genSlopeFromEquation(rng) {
    let a, b;
    do { a = rng.nonZeroInt(-6, 6); b = rng.nonZeroInt(-6, 6); } while (absN(a) === absN(b));
    const c = rng.nextInt(-9, 10);
    const correct = frac(-a, b);
    const w = wr([
      [frac(a, b), T('x\'in katsayısını y\'ninkine böldün ama eksi işaretini unuttun (m = -a/b).', 'You divided the x coefficient by the y coefficient but forgot the minus sign (m = -a/b).')],
      [frac(-b, a), T('Eğimi -b/a aldın (ters); doğrusu -a/b.', 'You used -b/a (inverted); it is -a/b.')],
      [frac(b, a), T('Hem tersini aldın hem eksi işaretini unuttun.', 'You inverted it and also forgot the minus sign.')],
      [frac(-a, b + 1), T('Paydada küçük bir hata var.', 'There is a small slip in the denominator.')],
      [frac(-a - 1, b), T('Payda küçük bir hata var.', 'There is a small slip in the numerator.')],
    ]);
    return makeQuestion(
      T('Artışlar ve eğim', 'Increments and slope'),
      T(`${genForm(a, b, c)} doğrusunun eğimi kaçtır?`, `What is the slope of the line ${genForm(a, b, c)}?`),
      correct, w.w,
      [
        T('y\'yi yalnız bırak: y = mx + n biçimine getir.', 'Solve for y to get the form y = mx + n.'),
        `${b}y = ${-a}x ${plus(-c)}`,
        `m = ${-a}/${b} = ${correct}`,
      ],
      rng, w.n
    );
  }

  function genParabolaIntercepts(rng) {
    let r1, r2;
    do { r1 = rng.nonZeroInt(-6, 6); r2 = rng.nonZeroInt(-6, 6); } while (r1 === r2 || r1 === -r2);
    const b = -(r1 + r2), c = r1 * r2;
    const w = wr([
      [rootsStr(-r1, -r2), T('Kökleri ters işaretle yazdın; (x - r) çarpanının kökü +r\'dir.', 'You wrote the roots with reversed signs; the factor (x - r) has root +r.')],
      [rootsStr(r1, -r2), T('Köklerden birinin işaretini ters aldın.', 'You reversed the sign of one of the roots.')],
      [rootsStr(-r1, r2), T('Köklerden birinin işaretini ters aldın.', 'You reversed the sign of one of the roots.')],
      [rootsStr(b, c), T('Katsayıları (b ve c) doğrudan kök sandın.', 'You took the coefficients b and c directly as the roots.')],
      [rootsStr(r1, r2 + 1), T('Köklerden biri bir fazla çıktı; çarpanlara ayırmada küçük bir hata var.', 'One root is one too large; there is a slip in factoring.')],
    ]);
    return makeQuestion(
      T('Parabol', 'Parabola'),
      T(`y = ${quad(1, b, c)} parabolü x eksenini hangi x değerlerinde keser?`, `At which x-values does the parabola y = ${quad(1, b, c)} cross the x-axis?`),
      rootsStr(r1, r2), w.w,
      [
        T('x eksenini kestiği yerde y = 0: x² + bx + c = 0.', 'On the x-axis y = 0: x² + bx + c = 0.'),
        T(`Toplamları ${-b}, çarpımları ${c} olan iki sayı: ${r1} ve ${r2}`, `Two numbers with sum ${-b} and product ${c}: ${r1} and ${r2}`),
        `${xTerm(r1)}${xTerm(r2)} = 0  →  ${rootsStr(r1, r2)}`,
      ],
      rng, w.n
    );
  }

  // ---------- NEW level 3 generators ----------

  function genCompoundIneq(rng) {
    const m = rng.pick([2, 3, 4, -2, -3]);
    const b = rng.nonZeroInt(-6, 6);
    const p = rng.nextInt(-5, 3), q = p + rng.nextInt(2, 6);
    const opL = rng.pick(['<', '≤']), opR = rng.pick(['<', '≤']);
    const cL = opL === '≤', cR = opR === '≤';
    let L, U, lc, rc;
    if (m > 0) { L = m * p + b; U = m * q + b; lc = cL; rc = cR; } else { U = m * p + b; L = m * q + b; lc = cR; rc = cL; }
    const correct = iv(p, q, lc, rc);
    const w = wr([
      [m < 0 ? iv(p, q, cL, cR) : iv(p, q, !lc, !rc), m < 0 ? T('Negatif sayıya bölerken eşitsizlik yönleri (dolayısıyla parantez türleri) yer değiştirir; bunu unuttun.', 'Dividing by a negative number reverses the inequalities (and so swaps the brackets); you forgot this.') : T('Parantez türlerini ters aldın (≤ dahil, < hariç).', 'You reversed the bracket types (≤ included, < excluded).')],
      [iv(frac(L, m), frac(U, m), lc, rc), T('Önce sabit terimi (b) çıkarmayı unuttun; doğrudan x\'in katsayısına böldün.', 'You forgot to subtract the constant b first and divided straight by the coefficient of x.')],
      [iv(-q, -p, lc, rc), T('Uç noktaların işaretini ters aldın.', 'You reversed the signs of the endpoints.')],
      [iv(p, q, lc, !rc), T('Sağ uçtaki parantez türünü yanlış aldın.', 'You took the wrong bracket at the right end.')],
      [iv(p, q, !lc, rc), T('Sol uçtaki parantez türünü yanlış aldın.', 'You took the wrong bracket at the left end.')],
    ]);
    const mid = `${L - b} ${opL} ${m}x ${opR} ${U - b}`;
    return makeQuestion(
      T('Doğrusal eşitsizlik', 'Linear inequality'),
      T(`${L} ${opL} ${m}x ${plus(b)} ${opR} ${U} eşitsizliğinin çözüm aralığı hangisidir?`, `Which interval solves ${L} ${opL} ${m}x ${plus(b)} ${opR} ${U}?`),
      correct, w.w,
      [
        T(`Her yandan ${b} çıkar: ${mid}`, `Subtract ${b} from every part: ${mid}`),
        m > 0 ? T(`${m} > 0 ile böl (yön değişmez)`, `Divide by ${m} > 0 (signs unchanged)`) : T(`${m} < 0 ile böl: eşitsizlik yönleri DEĞİŞİR`, `Divide by ${m} < 0: the inequality signs REVERSE`),
        `x ∈ ${correct}`,
      ],
      rng, w.n
    );
  }

  function genAbsIneqLinear(rng) {
    const a = rng.pick([2, 3, -2, -3]);
    let h; do { h = rng.nextInt(-4, 5); } while (h === 0);
    const k = rng.nextInt(1, 5);
    const b = -a * h, c = absN(a) * k;
    const less = rng.nextInt(0, 2) === 0, cl = rng.nextInt(0, 2) === 0;
    const op = less ? (cl ? '≤' : '<') : (cl ? '≥' : '>');
    const lop = cl ? '≤' : '<';
    const lo = h - k, hi = h + k;
    const set = (l, r, c2) => (less ? iv(l, r, c2, c2) : ou(l, r, c2, c2));
    const other = (l, r, c2) => (less ? ou(l, r, c2, c2) : iv(l, r, c2, c2));
    const correct = set(lo, hi, cl);
    const w = wr([
      [other(lo, hi, cl), less ? T('Küçüktür türünde çözüm iki sayı ARASINDADIR.', 'For "less than" the solution lies BETWEEN the two numbers.') : T('Büyüktür türünde çözüm DIŞTADIR.', 'For "greater than" the solution is OUTSIDE.')],
      [set(-c - b, c - b, cl), T('x\'in katsayısına (a) bölmeyi unuttun.', 'You forgot to divide by the coefficient of x.')],
      [set(-h - k, -h + k, cl), T('Merkezin işaretini ters aldın.', 'You reversed the sign of the centre.')],
      [set(h - c, h + c, cl), T('Yarıçapı (c) a\'ya bölmeyi unuttun.', 'You did not divide the radius c by a.')],
      [set(lo, hi, !cl), T('Uç noktaların dahil olup olmadığını yanlış yorumladın.', 'You misread whether the endpoints are included.')],
    ]);
    const E = `${a}x ${plus(b)}`;
    return makeQuestion(
      T('Mutlak değer', 'Absolute value'),
      T(`|${E}| ${op} ${c} eşitsizliğinin çözüm kümesi hangisidir?`, `Which is the solution set of |${E}| ${op} ${c}?`),
      correct, w.w,
      [
        less ? `-${c} ${op} ${E} ${op} ${c}` : T(`${E} ${lop} -${c}  veya  ${E} ${op} ${c}`, `${E} ${lop} -${c}  or  ${E} ${op} ${c}`),
        T(`${E} = ${a}(x ${plus(-h)}) olduğundan |${a}|·|x ${plus(-h)}| ${op} ${c}  →  |x ${plus(-h)}| ${op} ${k}`, `${E} = ${a}(x ${plus(-h)}), so |${a}|·|x ${plus(-h)}| ${op} ${c}  →  |x ${plus(-h)}| ${op} ${k}`),
        `x ∈ ${correct}`,
      ],
      rng, w.n
    );
  }

  function genRationalIneq(rng) {
    let p, q;
    do { p = rng.nextInt(-5, 6); q = rng.nextInt(-5, 6); } while (p === q);
    const ge = rng.nextInt(0, 2) === 0;
    const lo = Math.min(p, q), hi = Math.max(p, q);
    const sol = (pp, qq, geq) => {
      const l = Math.min(pp, qq), h2 = Math.max(pp, qq);
      if (geq) return pp === l ? ou(l, h2, true, false) : ou(l, h2, false, true);
      return pp === l ? iv(l, h2, true, false) : iv(l, h2, false, true);
    };
    const correct = sol(p, q, ge);
    const w = wr([
      [ge ? ou(lo, hi, true, true) : iv(lo, hi, true, true), T(`Paydayı sıfır yapan x = ${q} değerini de çözüme kattın; payda 0 olamaz.`, `You included x = ${q}, which makes the denominator 0; it is not allowed.`)],
      [sol(p, q, !ge), T('İşaret tablosunu ters okudun: ≥ 0 için kritik noktaların dışı, ≤ 0 için arası alınır.', 'You read the sign chart backwards: ≥ 0 means outside the critical values, ≤ 0 means between them.')],
      [sol(q, p, ge), T('Hangi kritik noktanın dahil (pay) hangisinin hariç (payda) olduğunu karıştırdın.', 'You mixed up which critical point is included (numerator) and which is excluded (denominator).')],
      [ge ? `[${p}, ∞)` : `(-∞, ${p}]`, T('Paydayı yok sayıp sadece payın işaretine baktın.', 'You ignored the denominator and looked only at the numerator.')],
    ]);
    const tp = trimParens(xTerm(p)), tq = trimParens(xTerm(q));
    return makeQuestion(
      T('İkinci derece eşitsizlik', 'Quadratic inequality'),
      T(`(${tp})/(${tq}) ${ge ? '≥' : '≤'} 0 eşitsizliğinin çözüm kümesi hangisidir?`, `Which is the solution set of (${tp})/(${tq}) ${ge ? '≥' : '≤'} 0?`),
      correct, w.w,
      [
        T(`Kritik noktalar: pay = 0 → x = ${p} (dahil), payda = 0 → x = ${q} (hariç).`, `Critical points: numerator = 0 → x = ${p} (included), denominator = 0 → x = ${q} (excluded).`),
        T('İşaret tablosu: oran kritik noktaların dışında pozitif, arasında negatiftir.', 'Sign chart: the quotient is positive outside the critical points and negative between them.'),
        `x ∈ ${correct}`,
      ],
      rng, w.n
    );
  }

  function genQuadIneqExpanded(rng) {
    let r1, r2;
    do { r1 = rng.nonZeroInt(-6, 6); r2 = rng.nonZeroInt(-6, 6); } while (r1 >= r2 || r1 === -r2);
    const a = rng.pick([1, -1]);
    const op = rng.pick(['<', '≤', '>', '≥']);
    const closed = op === '≤' || op === '≥';
    const flipOp = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
    const eff = a === 1 ? op : flipOp[op];
    const inType = eff === '<' || eff === '≤';
    const S = (isIn, l, h2, c) => (isIn ? iv(l, h2, c, c) : ou(l, h2, c, c));
    const correct = S(inType, r1, r2, closed);
    const B = -a * (r1 + r2), C = a * r1 * r2;
    const w = wr([
      [S(!inType, r1, r2, closed), a === -1 ? T('Başkatsayı negatif: x² katsayısını pozitif yaparken eşitsizlik yönü değişir; bunu unuttun.', 'The leading coefficient is negative: making it positive reverses the inequality; you forgot this.') : T('Yukarı açılan parabol için işareti ters okudun (arası negatif, dışı pozitif).', 'You read the sign the wrong way for an upward parabola (negative between, positive outside).')],
      [S(inType, r1, r2, !closed), T('Uç noktaların dahil olup olmadığını (≤/≥ ya da </>) yanlış yorumladın.', 'You misread whether the endpoints are included.')],
      [S(inType, -r2, -r1, closed), T('Kökleri ters işaretle aldın.', 'You took the roots with reversed signs.')],
      [S(!inType, r1, r2, !closed), T('Hem yönü hem uç noktaların dahil olmasını karıştırdın.', 'You mixed up both the direction and whether endpoints are included.')],
    ]);
    return makeQuestion(
      T('İkinci derece eşitsizlik', 'Quadratic inequality'),
      T(`${quad(a, B, C)} ${op} 0 eşitsizliğinin çözüm kümesi hangisidir?`, `Which is the solution set of ${quad(a, B, C)} ${op} 0?`),
      correct, w.w,
      [
        a === -1 ? T(`-1 ile çarp (yön değişir): ${quad(1, -(r1 + r2), r1 * r2)} ${eff} 0`, `Multiply by -1 (the sign reverses): ${quad(1, -(r1 + r2), r1 * r2)} ${eff} 0`) : T(`Çarpanlara ayır: ${quad(1, B, C)}`, `Factor: ${quad(1, B, C)}`),
        T(`${xTerm(r1)}${xTerm(r2)} ${eff} 0   (kökler: ${r1}, ${r2})`, `${xTerm(r1)}${xTerm(r2)} ${eff} 0   (roots: ${r1}, ${r2})`),
        `x ∈ ${correct}`,
      ],
      rng, w.n
    );
  }

  function genPointLineDist(rng) {
    const tr = rng.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10]]);
    let a = tr[0], b = tr[1];
    if (rng.nextInt(0, 2) === 0) { const t = a; a = b; b = t; }
    a *= sg(rng); b *= sg(rng);
    const n = tr[2];
    let x0, y0, c, val;
    do {
      x0 = rng.nextInt(-5, 6); y0 = rng.nextInt(-5, 6); c = rng.nonZeroInt(-9, 9);
      val = a * x0 + b * y0 + c;
    } while (val === 0);
    const av = absN(val);
    const correct = frac(av, n);
    const w = wr([
      [frac(-av, n), T('Uzaklık negatif olamaz; payı mutlak değer içine almayı unuttun.', 'A distance cannot be negative; the numerator needs the absolute value.')],
      [frac(av, absN(a) + absN(b)), T('Paydada √(a² + b²) yerine |a| + |b| kullandın.', 'You used |a| + |b| instead of √(a² + b²) in the denominator.')],
      [frac(av, n * n), T('Paydada karekök almayı unuttun (a² + b² kullandın).', 'You forgot the square root in the denominator (used a² + b²).')],
      [String(av), T('Payı √(a² + b²) değerine bölmeyi unuttun.', 'You forgot to divide the numerator by √(a² + b²).')],
      [frac(absN(a * x0 + b * y0), n), T('Sabit terim c\'yi hesaba katmadın.', 'You left out the constant term c.')],
      [frac(av + 1, n), T('Payda küçük bir hesap hatası var.', 'There is a small arithmetic slip in the numerator.')],
    ]);
    return makeQuestion(
      T('İki nokta arası uzaklık', 'Distance between two points'),
      T(`P(${x0}, ${y0}) noktasının ${genForm(a, b, c)} doğrusuna uzaklığı kaçtır?`, `What is the distance from P(${x0}, ${y0}) to the line ${genForm(a, b, c)}?`),
      correct, w.w,
      [
        T('Nokta-doğru uzaklığı: d = |ax₀ + by₀ + c| / √(a² + b²)', 'Point-line distance: d = |ax₀ + by₀ + c| / √(a² + b²)'),
        `|${a}(${x0}) + ${b}(${y0}) ${plus(c)}| = |${val}| = ${av},   √(${a * a} + ${b * b}) = ${n}`,
        `d = ${av}/${n} = ${correct}`,
      ],
      rng, w.n
    );
  }

  function genCircleDiameter(rng) {
    let h, k, u, v;
    do {
      h = rng.nonZeroInt(-4, 4); k = rng.nonZeroInt(-4, 4);
      u = rng.nonZeroInt(-4, 4); v = rng.nonZeroInt(-4, 4);
    } while (h === k || h === -k);
    const R = u * u + v * v;
    const Ax = h - u, Ay = k - v, Bx = h + u, By = k + v;
    const w = wr([
      [circEq(h, k, 4 * R), T('Çapın karesini yarıçapın karesi sandın; r = çap/2, yani r² = çap²/4.', 'You used the diameter squared as r²; r = diameter/2, so r² = diameter²/4.')],
      [circEq(-h, -k, R), T('Merkezin işaretini ters yazdın.', 'You wrote the centre with reversed signs.')],
      [circEq(h, k, 2 * R), T('r² hesabında çarpan hatası var.', 'There is a factor error in r².')],
      [circEq(-h, -k, 4 * R), T('Merkezin işareti ters ve r² için çapın karesi alındı.', 'The centre signs are reversed and the diameter squared was used for r².')],
      [circEq(h, k, R + 1), T('r² için küçük bir hesap hatası var.', 'There is a small slip in r².')],
    ]);
    return makeQuestion(
      T('Çember', 'Circle'),
      T(`A(${Ax}, ${Ay}) ve B(${Bx}, ${By}) noktaları bir çemberin çapının uç noktalarıdır. Çemberin denklemi hangisidir?`, `A(${Ax}, ${Ay}) and B(${Bx}, ${By}) are the endpoints of a diameter of a circle. Which is its equation?`),
      circEq(h, k, R), w.w,
      [
        T(`Merkez = AB'nin orta noktası = (${h}, ${k})`, `Centre = midpoint of AB = (${h}, ${k})`),
        T(`r² = (merkez-A uzaklığı)² = (${u})² + (${v})² = ${R}`, `r² = (centre-to-A distance)² = (${u})² + (${v})² = ${R}`),
        circEq(h, k, R),
      ],
      rng, w.n,
      { xMin: -12, xMax: 12, yMin: -12, yMax: 12, segments: [{ x1: Ax, y1: Ay, x2: Bx, y2: By }], points: [{ x: Ax, y: Ay, label: 'A' }, { x: Bx, y: By, label: 'B' }] }
    );
  }

  function genCircleCompleteSquare(rng) {
    let h, k;
    do { h = rng.nonZeroInt(-5, 5); k = rng.nonZeroInt(-5, 5); } while (h === k || h === -k);
    const r = rng.nextInt(2, 7);
    const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
    const w = wr([
      [circCR(-h, -k, r), T('Merkezin işaretlerini ters aldın; x² + Dx için merkez x = -D/2\'dir.', 'You reversed the signs of the centre; for x² + Dx the centre is x = -D/2.')],
      [circCR(h, k, r * r), T('r² değerini yarıçap sandın; karekök almalısın.', 'You took r² as the radius; a square root is needed.')],
      [circCR(D, E, r), T('D ve E katsayılarını ikiye bölmeyi (ve işaretini değiştirmeyi) unuttun.', 'You forgot to halve D and E (and change the sign).')],
      [circCR(-h, -k, r * r), T('Merkezin işareti ters ve r² yarıçap alındı.', 'The centre signs are reversed and r² was taken as the radius.')],
      [circCR(h, k, r + 1), T('Yarıçapta küçük bir hesap hatası var.', 'There is a small arithmetic slip in the radius.')],
    ]);
    return makeQuestion(
      T('Çember', 'Circle'),
      T(`${circGen(D, E, F)} denklemiyle verilen çemberin merkezi ve yarıçapı hangisidir?`, `Which are the centre and radius of the circle ${circGen(D, E, F)}?`),
      circCR(h, k, r), w.w,
      [
        T('Tam kareye tamamla: x ve y terimlerini gruplayıp (x - h)² + (y - k)² = r² biçimine getir.', 'Complete the square in x and y to reach (x - h)² + (y - k)² = r².'),
        `(x² ${plus(D)}x ${plus(h * h)}) + (y² ${plus(E)}y ${plus(k * k)}) = ${-F} + ${h * h} + ${k * k}`,
        `${circEq(h, k, r * r)}   →   ${circCR(h, k, r)}`,
      ],
      rng, w.n
    );
  }

  function genCircleTangentLine(rng) {
    const tr = rng.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10]]);
    let a = tr[0], b = tr[1];
    if (rng.nextInt(0, 2) === 0) { const t = a; a = b; b = t; }
    a *= sg(rng); b *= sg(rng);
    const n = tr[2];
    const h = rng.nextInt(-4, 5), k = rng.nextInt(-4, 5);
    const r = rng.nextInt(1, 5);
    const c = sg(rng) * n * r - a * h - b * k;
    const w = wr([
      [circEq(h, k, r), T('Denklemin sağ tarafına r² yerine r yazdın.', 'You put r instead of r² on the right-hand side.')],
      [circEq(h, k, n * n * r * r), T('Uzaklığı √(a² + b²) değerine bölmeyi unuttun; r yerine payı kullandın.', 'You forgot to divide by √(a² + b²), using the numerator as the radius.')],
      [circEq(-h, -k, r * r), T('Merkezin işaretini ters yazdın.', 'You wrote the centre with reversed signs.')],
      [circEq(h, k, n * r), T('Hem bölmeyi unuttun hem de karesini almadın.', 'You skipped both the division and the squaring.')],
      [circEq(h, k, r * r + 1), T('r² için küçük bir hesap hatası var.', 'There is a small slip in r².')],
    ]);
    return makeQuestion(
      T('Çember', 'Circle'),
      T(`Merkezi (${h}, ${k}) olan ve ${genForm(a, b, c)} doğrusuna teğet olan çemberin denklemi hangisidir?`, `Which is the equation of the circle with centre (${h}, ${k}) that is tangent to the line ${genForm(a, b, c)}?`),
      circEq(h, k, r * r), w.w,
      [
        T('Teğet çemberde yarıçap = merkezin doğruya uzaklığı.', 'For a tangent circle the radius = distance from the centre to the line.'),
        `r = |${a}(${h}) + ${b}(${k}) ${plus(c)}| / √(${a * a} + ${b * b}) = ${n * r}/${n} = ${r}`,
        circEq(h, k, r * r),
      ],
      rng, w.n
    );
  }

  function genLineThroughIntersection(rng) {
    let m1, m2;
    do { m1 = rng.nonZeroInt(-4, 4); m2 = rng.nonZeroInt(-4, 4); } while (m1 === m2);
    const px = rng.nextInt(-4, 5), py = rng.nextInt(-5, 6);
    const b1 = py - m1 * px, b2 = py - m2 * px;
    const perp = rng.nextInt(0, 2) === 0;
    let m3, m;
    if (perp) { m3 = rng.pick([1, -1]); m = -m3; } else { m3 = rng.nonZeroInt(-3, 3); m = m3; }
    const given = lineStr(m3, rng.nextInt(-6, 7));
    const bb = py - m * px;
    const wm = perp ? m3 : -m3;
    const w = wr([
      [lineStr(m, py + m * px), T('b = y₁ - m·x₁ yerine y₁ + m·x₁ hesapladın.', 'You computed y₁ + m·x₁ instead of y₁ - m·x₁ for the intercept.')],
      [lineStr(m, py), T('Kesişim noktasının y değerini doğrudan kesim noktası (b) sandın.', 'You took the intersection\'s y-value as the intercept b.')],
      [lineStr(-m, bb), T('Eğimin işaretini ters aldın.', 'You reversed the sign of the slope.')],
      [lineStr(wm, py - wm * px), perp ? T('Dik doğrunun eğimini bulmak yerine verilen doğrunun eğimini kullandın (paralel).', 'You used the given line\'s slope (parallel) instead of the perpendicular slope.') : T('Paralel doğruya ters işaretli eğim verdin.', 'You gave the parallel line the opposite slope.')],
      [lineStr(m, bb + 1), T('Kesim noktasında küçük bir hata var.', 'There is a small slip in the intercept.')],
      [lineStr(m, bb - 1), T('Kesim noktasında küçük bir hata var.', 'There is a small slip in the intercept.')],
    ]);
    return makeQuestion(
      T('Doğru denklemi', 'Equation of a line'),
      T(`${lineStr(m1, b1)} ve ${lineStr(m2, b2)} doğrularının kesişim noktasından geçen ve ${given} doğrusuna ${perp ? 'DİK' : 'PARALEL'} olan doğrunun denklemi hangisidir?`, `Which is the equation of the line through the intersection of ${lineStr(m1, b1)} and ${lineStr(m2, b2)} that is ${perp ? 'PERPENDICULAR' : 'PARALLEL'} to ${given}?`),
      lineStr(m, bb), w.w,
      [
        T(`Kesişim: ${m1}x ${plus(b1)} = ${m2}x ${plus(b2)}  →  x = ${px},  y = ${py}`, `Intersection: ${m1}x ${plus(b1)} = ${m2}x ${plus(b2)}  →  x = ${px},  y = ${py}`),
        perp ? T(`Dik doğrunun eğimi: m = -1/(${m3}) = ${m}`, `Perpendicular slope: m = -1/(${m3}) = ${m}`) : T(`Paralel doğrunun eğimi: m = ${m}`, `Parallel slope: m = ${m}`),
        `y - (${py}) = ${m}(x - (${px}))  →  ${lineStr(m, bb)}`,
      ],
      rng, w.n
    );
  }

  function genPerpBisector(rng) {
    let h, k, u, v;
    do {
      h = rng.nextInt(-4, 5); k = rng.nextInt(-4, 5);
      u = rng.nonZeroInt(-4, 4); v = rng.nonZeroInt(-4, 4);
    } while (absN(u) === absN(v) || gcd(u, v) !== 1);
    const Ax = h - u, Ay = k - v, Bx = h + u, By = k + v;
    const c = u * h + v * k;
    const correct = eqStr(u, v, c);
    const w = wr([
      [eqStr(v, -u, v * h - u * k), T('Orta noktadan geçen ama AB\'ye PARALEL olan doğruyu yazdın; orta dikme AB\'ye diktir.', 'You wrote the line through the midpoint PARALLEL to AB; the perpendicular bisector is perpendicular to AB.')],
      [eqStr(u, v, u * Ax + v * Ay), T('Orta noktadan değil A noktasından geçen doğruyu yazdın.', 'You wrote the line through A, not through the midpoint.')],
      [eqStr(v, u, v * h + u * k), T('Normal vektörün bileşenlerini yer değiştirdin.', 'You swapped the components of the normal vector.')],
      [eqStr(u, v, u * h - v * k), T('Orta noktanın koordinatlarını yerine koyarken işaret hatası yaptın.', 'You made a sign error when substituting the midpoint.')],
      [eqStr(u, v, c + 1), T('Sabit terimde küçük bir hata var.', 'There is a small slip in the constant.')],
    ]);
    return makeQuestion(
      T('Doğru denklemi', 'Equation of a line'),
      T(`A(${Ax}, ${Ay}) ve B(${Bx}, ${By}) noktalarını birleştiren doğru parçasının orta dikmesinin denklemi hangisidir?`, `Which is the equation of the perpendicular bisector of the segment joining A(${Ax}, ${Ay}) and B(${Bx}, ${By})?`),
      correct, w.w,
      [
        T(`Orta nokta M = (${h}, ${k});  AB'nin yön vektörü (${2 * u}, ${2 * v})`, `Midpoint M = (${h}, ${k});  direction of AB = (${2 * u}, ${2 * v})`),
        T(`Orta dikme AB'ye dik olduğundan normali (${u}, ${v}) alınır: ${u}(x - ${h}) + ${v}(y - ${k}) = 0`, `The bisector is perpendicular to AB, so its normal is (${u}, ${v}): ${u}(x - ${h}) + ${v}(y - ${k}) = 0`),
        correct,
      ],
      rng, w.n,
      { xMin: -12, xMax: 12, yMin: -12, yMax: 12, equalAspect: true, segments: [{ x1: Ax, y1: Ay, x2: Bx, y2: By }], points: [{ x: Ax, y: Ay, label: 'A' }, { x: Bx, y: By, label: 'B' }] }
    );
  }

  function genParabolaVertexScaled(rng) {
    const a = rng.pick([2, 3, -1, -2, -3]);
    let h, k;
    do { h = rng.nextInt(-4, 5); k = rng.nextInt(-6, 7); } while (h === 0 || k === 0);
    const b = -2 * a * h, c = a * h * h + k;
    const w = wr([
      [pt(-h, 3 * a * h * h + c), T('Tepe noktasının x değerini b/(2a) aldın (işaret hatası); y değeri de buna göre yanlış çıktı.', 'You used b/(2a) for the vertex x (sign error), so the y-value is wrong too.')],
      [pt(h, c), T('Sabit terim c\'yi tepe noktasının y değeri sandın; tepe y değeri f(h)\'dir.', 'You took the constant c as the vertex y-value; the vertex y is f(h).')],
      [pt(2 * h, c), T('x = -b/(2a) yerine -b/a kullandın (2\'yi unuttun).', 'You used -b/a instead of -b/(2a) (forgot the 2).')],
      [pt(-h, k), T('x değerinin işaretini ters aldın.', 'You reversed the sign of the x-value.')],
      [pt(h, -k), T('y değerinin işaretini ters aldın.', 'You reversed the sign of the y-value.')],
    ]);
    return makeQuestion(
      T('Parabol', 'Parabola'),
      T(`y = ${quad(a, b, c)} parabolünün tepe noktası hangisidir?`, `Which is the vertex of the parabola y = ${quad(a, b, c)}?`),
      pt(h, k), w.w,
      [
        `x = -b/(2a) = -(${b})/(2·${a}) = ${h}`,
        `y = ${a}(${h})² ${plus(b)}(${h}) ${plus(c)} = ${k}`,
        T(`Tepe noktası ${pt(h, k)} (a ${a > 0 ? '> 0: yukarı' : '< 0: aşağı'} açılır)`, `Vertex ${pt(h, k)} (a ${a > 0 ? '> 0: opens up' : '< 0: opens down'})`),
      ],
      rng, w.n,
      { xMin: -10, xMax: 10, yMin: Math.min(-8, k - 6), yMax: Math.max(8, k + 6), curves: [{ f: (x) => a * x * x + b * x + c }], points: [{ x: h, y: k, label: 'T' }] }
    );
  }

  function genParabolaLine(rng) {
    let r1, r2, b, m;
    do {
      r1 = rng.nonZeroInt(-5, 5); r2 = rng.nonZeroInt(-5, 5);
      b = rng.nextInt(-4, 5); m = b + r1 + r2;
    } while (r1 === r2 || r1 === -r2 || m === 0);
    const c = rng.nextInt(-5, 6);
    const n = c - r1 * r2;
    const w = wr([
      [rootsStr(-r1, -r2), T('Denklemi düzenlerken işaret hatası yaptın; kökler ters işaretle çıktı.', 'A sign error while rearranging produced roots with reversed signs.')],
      [rootsStr(r1, -r2), T('Köklerden birinin işaretini ters aldın.', 'You reversed the sign of one root.')],
      [rootsStr(-r1, r2), T('Köklerden birinin işaretini ters aldın.', 'You reversed the sign of one root.')],
      [rootsStr(r1, r2 + 1), T('Köklerden biri bir fazla çıktı; çarpanlara ayırmada küçük hata.', 'One root is one too large; there is a small slip in factoring.')],
      [rootsStr(b, m), T('Katsayıları kök sandın.', 'You took the coefficients as the roots.')],
    ]);
    return makeQuestion(
      T('Parabol', 'Parabola'),
      T(`y = ${quad(1, b, c)} parabolü ile ${lineStr(m, n)} doğrusunun kesişim noktalarının x koordinatları hangisidir?`, `Which are the x-coordinates of the intersection points of the parabola y = ${quad(1, b, c)} and the line ${lineStr(m, n)}?`),
      rootsStr(r1, r2), w.w,
      [
        T(`Eşitle: ${quad(1, b, c)} = ${m}x ${plus(n)}`, `Set equal: ${quad(1, b, c)} = ${m}x ${plus(n)}`),
        T(`Düzenle: ${quad(1, b - m, c - n)} = 0`, `Rearrange: ${quad(1, b - m, c - n)} = 0`),
        `${xTerm(r1)}${xTerm(r2)} = 0  →  ${rootsStr(r1, r2)}`,
      ],
      rng, w.n,
      { xMin: -10, xMax: 10, yMin: -15, yMax: 30, curves: [{ f: (x) => x * x + b * x + c }, { f: (x) => m * x + n }] }
    );
  }

  function genDiscriminantParam(rng) {
    const s = rng.nextInt(2, 7);
    const c = s * s;
    const mode = rng.nextInt(0, 3);
    const cands = [
      [iv(-2 * s, 2 * s, false, false), T('reel kök yok (Δ < 0)', 'no real roots (Δ < 0)')],
      [ou(-2 * s, 2 * s, false, false), T('iki farklı reel kök (Δ > 0)', 'two distinct real roots (Δ > 0)')],
      [T(`k = ${-2 * s} veya k = ${2 * s}`, `k = ${-2 * s} or k = ${2 * s}`), T('çift kök (Δ = 0)', 'a double root (Δ = 0)')],
    ];
    const texts = [
      T(`x² + kx + ${c} = 0 denkleminin reel kökü olmaması için k hangi aralıkta olmalıdır?`, `For which interval of k does x² + kx + ${c} = 0 have no real roots?`),
      T(`x² + kx + ${c} = 0 denkleminin iki farklı reel kökü olması için k hangi değerleri almalıdır?`, `For which values of k does x² + kx + ${c} = 0 have two distinct real roots?`),
      T(`x² + kx + ${c} = 0 denkleminin çift katlı (tek) kökü olması için k hangi değerleri alır?`, `For which k does x² + kx + ${c} = 0 have a repeated (double) root?`),
    ];
    const wrongs = [], notes = [];
    for (let i = 0; i < 3; i++) {
      if (i === mode) continue;
      wrongs.push(cands[i][0]);
      notes.push(T(`Bu küme ${cands[i][1]} durumuna aittir; sorulan durum farklı.`, `This set corresponds to ${cands[i][1]}; the question asks a different case.`));
    }
    wrongs.push(mode === 2 ? iv(-s, s, false, false) : (mode === 0 ? iv(-s, s, false, false) : ou(-s, s, false, false)));
    notes.push(T('Δ = k² - 4c ifadesinde 2√c yerine √c aldın.', 'In Δ = k² - 4c you used √c instead of 2√c.'));
    wrongs.push(mode === 0 ? iv(-2 * s, 2 * s, true, true) : (mode === 1 ? ou(-2 * s, 2 * s, true, true) : `k = ${2 * s}`));
    notes.push(T('Uç noktalarda Δ = 0 olur; kesin eşitsizlik/çift kök durumunu karıştırdın.', 'Δ = 0 at the endpoints; you mixed up strict inequality and the double-root case.'));
    const rel = mode === 0 ? '<' : (mode === 1 ? '>' : '=');
    return makeQuestion(
      T('İkinci derece eşitsizlik', 'Quadratic inequality'),
      texts[mode],
      cands[mode][0], wrongs,
      [
        `Δ = k² - 4·1·${c} = k² - ${4 * c}`,
        `Δ ${rel} 0  →  k² ${rel} ${4 * c}  →  |k| ${rel} ${2 * s}`,
        `k: ${cands[mode][0]}`,
      ],
      rng, notes
    );
  }

  function genCollinear(rng) {
    const q = rng.nextInt(1, 4);
    const p = rng.nonZeroInt(-4, 4);
    const x1 = rng.nextInt(-4, 3), y1 = rng.nextInt(-5, 6);
    const x2 = x1 + q, y2 = y1 + p;
    let t; do { t = rng.nonZeroInt(-3, 3); } while (t === 1);
    const x3 = x1 + t * q, k = y1 + t * p;
    return makeQuestion(
      T('Artışlar ve eğim', 'Increments and slope'),
      T(`A(${x1}, ${y1}), B(${x2}, ${y2}) ve C(${x3}, k) noktaları doğrusal (aynı doğru üzerinde) ise k kaçtır?`, `If A(${x1}, ${y1}), B(${x2}, ${y2}) and C(${x3}, k) are collinear, what is k?`),
      String(k),
      intWrongs(k, y1 - t * p, t * p, y1 + t * q),
      [
        T('Doğrusal ise m_AB = m_AC', 'Collinear points satisfy m_AB = m_AC'),
        `m_AB = (${y2} - (${y1}))/(${x2} - (${x1})) = ${frac(p, q)},   m_AC = (k - (${y1}))/(${x3} - (${x1}))`,
        `(k - (${y1}))/${x3 - x1} = ${frac(p, q)}  →  k = ${y1} + ${frac(p, q)}·(${x3 - x1}) = ${k}`,
      ],
      rng,
      intWrongNotes(
        T('Eğim eşitliğinde artışı eklemek yerine çıkardın (işaret hatası).', 'You subtracted the increment instead of adding it (sign error).'),
        T('y₁ değerini eklemeyi unuttun; sadece Δy kadarını aldın.', 'You forgot to add y₁ and only used Δy.'),
        T('Δy yerine Δx kullandın (eğimi ters kurdun).', 'You used Δx in place of Δy (inverted slope).')
      )
    );
  }

  function genPerpParam(rng) {
    const a1 = rng.pick([2, 3, 4]);
    const b1 = rng.nonZeroInt(-4, 4);
    const t = rng.nonZeroInt(-3, 3);
    const b2 = a1 * t;
    const m = -b1 * t;
    const c1 = rng.nextInt(-5, 6), c2 = rng.nextInt(-5, 6);
    const w = wr([
      [String(-m), T('Dik olma koşulundaki eksi işaretini unuttun (a₁a₂ + b₁b₂ = 0).', 'You lost the minus sign in the perpendicularity condition (a₁a₂ + b₁b₂ = 0).')],
      [frac(a1 * b2, b1), T('Paralellik koşulunu (eğimler eşit) kullandın; dik için eğimlerin çarpımı -1 olmalı.', 'You used the parallel condition (equal slopes); perpendicular needs slope product -1.')],
      [frac(-b2, a1), T('Koşulda b₁ çarpanını unuttun.', 'You dropped the factor b₁ in the condition.')],
      [String(m + 1), T('Son adımda küçük bir hesap hatası var.', 'There is a small slip in the last step.')],
      [String(m - 1), T('Son adımda küçük bir hesap hatası var.', 'There is a small slip in the last step.')],
      [String(m + 2), T('Son adımda hesap hatası var.', 'There is a slip in the last step.')],
    ]);
    const l2 = `mx ${coef(b2, 'y', false)} ${plus(c2)} = 0`;
    return makeQuestion(
      T('Paralel ve dik doğrular', 'Parallel and perpendicular lines'),
      T(`${genForm(a1, b1, c1)} ve ${l2} doğruları birbirine dik ise m kaçtır?`, `If the lines ${genForm(a1, b1, c1)} and ${l2} are perpendicular, what is m?`),
      String(m), w.w,
      [
        `m₁ = -${a1}/(${b1}) = ${frac(-a1, b1)},   m₂ = -m/(${b2})`,
        `m₁·m₂ = -1  →  (${frac(-a1, b1)})·(-m/${b2}) = -1`,
        `m = ${m}`,
      ],
      rng, w.n
    );
  }

  // ---------- difficulty levels (1 easy, 2 medium, 3 hard) - used only by the printable exam ----------

  [genIrrational, genSets, genOrdering, genQuadrant, genAbsValue, genSlope, genDistance, genSlopeAngle,
    genSetOps, genIntervalNotation, genMidpoint].forEach((g) => { g.level = 1; });
  [genLinearIneq, genQuadIneq, genAbsEquation, genLine, genPerpendicular, genPerpSlopeFromPoints, genPerpAngle,
    genCircle, genParabola,
    genCircleExpand, genParabolaVertex, genAbsIneq, genLineTwoPoints, genMidpointEndpoint, genSlopeFromEquation,
    genParabolaIntercepts].forEach((g) => { g.level = 2; });
  [genCompoundIneq, genAbsIneqLinear, genRationalIneq, genQuadIneqExpanded, genPointLineDist, genCircleDiameter,
    genCircleCompleteSquare, genCircleTangentLine, genLineThroughIntersection, genPerpBisector,
    genParabolaVertexScaled, genParabolaLine, genDiscriminantParam, genCollinear, genPerpParam].forEach((g) => { g.level = 3; });

  const GENERATORS = [
    genIrrational, genSets, genOrdering, genLinearIneq,
    genQuadIneq, genAbsValue, genAbsEquation, genQuadrant,
    genSlope, genLine, genPerpendicular, genDistance,
    genCircle, genParabola,
    genSlopeAngle, genPerpSlopeFromPoints, genPerpAngle,
  ];

  Topics.register('numbers', {
    type: 'quiz',
    tabTitle: () => I18N.tx('Sınav (Quiz)', 'Quiz'),
    generators: GENERATORS,
  });

  // Pool for the printable exam set (all generators incl. extra harder ones; each has a numeric .level 1-3).
  window.ExamPools = window.ExamPools || {};
  window.ExamPools.numbers = GENERATORS.concat([
    genSetOps, genIntervalNotation, genMidpoint, genCircleExpand, genParabolaVertex, genAbsIneq, genLineTwoPoints, genMidpointEndpoint, genSlopeFromEquation, genParabolaIntercepts, genCompoundIneq, genAbsIneqLinear, genRationalIneq, genQuadIneqExpanded, genPointLineDist, genCircleDiameter, genCircleCompleteSquare, genCircleTangentLine, genLineThroughIntersection, genPerpBisector, genParabolaVertexScaled, genParabolaLine, genDiscriminantParam, genCollinear, genPerpParam,
  ]);
})();
