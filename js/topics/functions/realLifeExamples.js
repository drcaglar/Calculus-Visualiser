// Ported from Modules/Functions/RealLifeExamplesControl.vb + RealLifeControlBase.vb -
// "Hayattan Örnekler / Real-Life Examples": ten real-world word problems, one per function
// family (linear, quadratic, exponential, trig, piecewise, rational, power, shifting,
// composition, scaling). Brand names from the VB source were already genericised there.
(function () {
  // problem = { scn: Integer, p: [num, num, num, num, num] }  (mirrors VB's RlProblem: Scn + P())

  // Module-level state (closures), mirroring the base class's private _scn / _showMeaning fields -
  // must survive "New Example" clicks and only change via the scenario select / meaning button.
  let currentScenario = 0;
  let showMeaning = false;
  // Filled once by buildControls(); { block, captionEl, valueEl, input } per row, always length 4.
  // Mirrors the VB base class's _rows - a fixed set of slider rows whose caption/range/visibility
  // depend on the ACTIVE scenario and are re-synced on every draw (see syncSliders below).
  let sliderRows = [];
  // Unsubscribe for the language-change listener buildControls registers (see below); re-armed on
  // every mount so switching tabs away and back never piles up stale listeners on detached DOM.
  let offLangCustom = null;

  function Money(v) {
    // Mirrors VB's Money(): v.ToString("#,0.##") - thousands separator, up to 2 decimals.
    const neg = v < 0;
    v = Math.abs(v);
    let s = fmt2(v);
    let [intPart, decPart] = s.split('.');
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let out = decPart ? `${intPart}.${decPart}` : intPart;
    return (neg ? '-' : '') + out;
  }

  function Spec(caption, min, max, step) {
    return { caption, min, max, step };
  }

  // ============================ scenario data ============================

  function Titles() {
    return [
      I18N.tx('1. Doğrusal: otomobil ses yalıtımı maliyeti', '1. Linear: car soundproofing cost'),
      I18N.tx('2. Kuadratik: lazerle eriyik havuzu derinliği', '2. Quadratic: laser melt-pool depth'),
      I18N.tx('3. Üstel: gitar teli titreşiminin sönümlenmesi', '3. Exponential: guitar string vibration decay'),
      I18N.tx('4. Trigonometrik: ses basıncı dalgası', '4. Trigonometric: sound pressure wave'),
      I18N.tx('5. Parçalı: kalori planı', '5. Piecewise: calorie plan'),
      I18N.tx('6. Rasyonel: seyahatte kişi başı maliyet', '6. Rational: travel cost per person'),
      I18N.tx('7. Kuvvet: tel besleme hızı ve birikim hacmi', '7. Power: wire feed speed and deposited volume'),
      I18N.tx('8. Kaydırma: lastik aşınma eğrisi', '8. Shifting: tyre wear curve'),
      I18N.tx('9. Bileşke: sıcaklık ve termal genleşme', '9. Composition: temperature and thermal expansion'),
      I18N.tx('10. Ölçekleme: motor tork eğrisi', '10. Scaling: engine torque curve'),
    ];
  }

  function Specs(scn) {
    switch (scn) {
      case 0:
        return [
          Spec(I18N.tx('Sabit malzeme maliyeti (TL)', 'Fixed material cost (TL)'), 1000, 2000, 100),
          Spec(I18N.tx('Kapı başına işçilik (TL)', 'Labour per door (TL)'), 200, 600, 50),
          Spec(I18N.tx('Kapı sayısı', 'Number of doors'), 2, 6, 1),
        ];
      case 1:
        return [
          Spec(I18N.tx('a (d = -a·x² + b·x, a > 0)', 'a (d = -a·x² + b·x, a > 0)'), 1, 4, 1),
          Spec(I18N.tx('Gerçek en iyi güç (W) - b buna göre kurulur', 'True best power (W) - b is built from it'), 20, 60, 5),
        ];
      case 2:
        return [
          Spec(I18N.tx('Başlangıç genliği A₀ (mm)', 'Initial amplitude A₀ (mm)'), 3, 8, 1),
          Spec(I18N.tx('Sönüm katsayısı k', 'Decay constant k'), 0.2, 1.0, 0.1),
          Spec(I18N.tx('Zaman t (s)', 'Time t (s)'), 1, 4, 1),
        ];
      case 3:
        return [
          Spec(I18N.tx('Genlik A (Pa)', 'Amplitude A (Pa)'), 0.2, 2.0, 0.1),
          Spec(I18N.tx('m (açısal frekans ω = m·π rad/s)', 'm (angular frequency ω = m·π rad/s)'), 250, 2000, 250),
        ];
      case 4:
        return [
          Spec(I18N.tx('Sabit günlük kalori', 'Fixed daily calories'), 1200, 2000, 100),
          Spec(I18N.tx('Sabit günlerin sayısı', 'Number of fixed days'), 2, 5, 1),
          Spec(I18N.tx('Sonraki günlerde günlük artış', 'Daily increase afterwards'), 50, 200, 50),
          Spec(I18N.tx('Sorulan gün', 'Day asked'), 1, 10, 1),
        ];
      case 5:
        return [
          Spec(I18N.tx('Toplam sabit masraf (TL)', 'Total fixed cost (TL)'), 10000, 30000, 5000),
          Spec(I18N.tx('Kişi başı bilet (TL)', 'Ticket per person (TL)'), 500, 1500, 250),
          Spec(I18N.tx('Kişi sayısı', 'Number of people'), 2, 8, 1),
        ];
      case 6:
        return [
          Spec(I18N.tx('s (bilinen hız v₀ = s² mm/s)', 's (known speed v₀ = s² mm/s)'), 2, 5, 1),
          Spec(I18N.tx('Gerçek orantı sabiti k (bulunacak)', 'True proportionality constant k (to be found)'), 1, 5, 1),
          Spec(I18N.tx('s₁ (tahmin hızı v₁ = s₁² mm/s)', 's₁ (prediction speed v₁ = s₁² mm/s)'), 2, 6, 1),
        ];
      case 7:
        return [
          Spec(I18N.tx('Yatay kayma h (sağ +, sol -)', 'Horizontal shift h (right +, left -)'), -4, 4, 1),
          Spec(I18N.tx('Dikey kayma k (yukarı +, aşağı -)', 'Vertical shift k (up +, down -)'), -4, 4, 1),
        ];
      case 8:
        return [
          Spec(I18N.tx('Isınma hızı a (T = a·t)', 'Heating rate a (T = a·t)'), 20, 80, 10),
          Spec(I18N.tx('Genleşme katsayısı (×0.001)', 'Expansion coefficient (×0.001)'), 1, 6, 1),
          Spec(I18N.tx('Zaman t (s)', 'Time t (s)'), 2, 8, 1),
        ];
      default:
        return [
          Spec(I18N.tx('Dikey uzatma c', 'Vertical stretch c'), 1.1, 1.5, 0.1),
          Spec(I18N.tx('Yatay uzatma d', 'Horizontal stretch d'), 1.2, 2.0, 0.1),
        ];
    }
  }

  // ============================ question + meaning ============================

  function HorizontalPhrase(h, turkish) {
    if (h === 0) return turkish ? 'yatayda hiç kaymıyor' : 'does not move horizontally';
    if (turkish) return h > 0 ? `sağa doğru ${h} birim` : `sola doğru ${-h} birim`;
    return h > 0 ? `${h} unit(s) to the right` : `${-h} unit(s) to the left`;
  }

  function VerticalPhrase(k, turkish) {
    if (k === 0) return turkish ? 'dikeyde hiç kaymıyor' : 'does not move vertically';
    if (turkish) return k > 0 ? `yukarı doğru ${k} birim` : `aşağı doğru ${-k} birim`;
    return k > 0 ? `${k} unit(s) up` : `${-k} unit(s) down`;
  }

  function Question(p) {
    const x = p.p;
    switch (p.scn) {
      case 0:
        return I18N.tx(
          `Bir otomobile ses yalıtımı uygulandığını düşünelim. Sabit yalıtım malzemesi maliyeti ${Money(x[0])} TL ve her bir kapı için işçilik ${Money(x[1])} TL. Toplam maliyeti kapı sayısına bağlı bir fonksiyon olarak yazıp ${x[2]} kapı için hesaplayabilir miyiz?`,
          `Imagine fitting sound insulation to a car. The fixed insulation material costs ${Money(x[0])} TL and labour is ${Money(x[1])} TL per door. Let\'s write the total cost as a function of the number of doors and evaluate it for ${x[2]} doors.`
        );
      case 1:
        return I18N.tx(
          `Lazer toz yatağı füzyonu işleminde, lazer gücüne (x, watt) bağlı eriyik havuzu derinliği d(x) = -${x[0]}x² + ${2 * x[0] * x[1]}x (mikrometre) formülüyle modelleniyor. Maksimum eriyik havuzu derinliği hangi lazer gücünde elde edilir ve bu derinlik ne kadardır?`,
          `In laser powder-bed fusion, the melt-pool depth as a function of laser power (x, watts) is modelled by d(x) = -${x[0]}x² + ${2 * x[0] * x[1]}x (micrometres). At which laser power is the maximum melt-pool depth reached, and how deep is it?`
        );
      case 2:
        return I18N.tx(
          `Bir gitar telinin titreşimi tele vurulduktan sonra sönümlenir. Titreşim genliği A(t) = ${x[0]}·e^(-${fmt2(x[1])}t) milimetredir (t saniye). ${x[2]} saniye sonra telin genliği ne olur?`,
          `The vibration of a guitar string dies away after the string is plucked. The amplitude is A(t) = ${x[0]}·e^(-${fmt2(x[1])}t) millimetres (t in seconds). What is the amplitude after ${x[2]} seconds?`
        );
      case 3:
        return I18N.tx(
          `Bir kulaklıktan gelen belirli frekanstaki ses dalgasının basıncı P(t) = ${fmt2(x[0])}·sin(${x[1]}π·t) ile modelleniyor (t saniye). Ses basıncının maksimum olduğu ilk an t kaçtır?`,
          `The pressure of a sound wave of a certain frequency coming from a pair of headphones is modelled by P(t) = ${fmt2(x[0])}·sin(${x[1]}π·t) (t in seconds). At what first moment t is the sound pressure maximal?`
        );
      case 4:
        return I18N.tx(
          `Bir beslenme planında ilk ${x[1]} gün günlük sabit ${x[0]} kalori, sonraki günlerde günlük ${x[0]} + ${x[2]}(x - ${x[1]}) kalori alınıyor (x: gün numarası). ${x[3]}. gün kaç kalori alınır?`,
          `In a diet plan, the first ${x[1]} days have a fixed ${x[0]} calories per day; on later days the daily intake is ${x[0]} + ${x[2]}(x - ${x[1]}) calories (x: day number). How many calories should be taken on day ${x[3]}?`
        );
      case 5:
        return I18N.tx(
          `Bir şehir gezisinin masrafı kişi sayısına bölünüyor. Toplam sabit masraf ${Money(x[0])} TL ve kişi başı uçak bileti ${Money(x[1])} TL. Ortalama maliyet fonksiyonu C(x) = (${Money(x[0])}/x) + ${Money(x[1])} (x: kişi sayısı). ${x[2]} kişi için kişi başı maliyet nedir?`,
          `The cost of a city trip is shared among the travellers. The total fixed cost is ${Money(x[0])} TL and the plane ticket is ${Money(x[1])} TL per person. The average-cost function is C(x) = (${Money(x[0])}/x) + ${Money(x[1])} (x: number of people). What is the cost per person for ${x[2]} people?`
        );
      case 6: {
        const v0 = x[0] * x[0];
        const v1 = x[2] * x[2];
        const vol0 = x[1] * Math.pow(v0, 1.5);
        return I18N.tx(
          `Tel ark eklemeli imalat sisteminde, tel besleme hızına (v) bağlı malzeme birikim hacmi V(v) = k·v^(3/2) ile orantılıdır. Tel hızı v = ${fmt2(v0)} mm/s iken birikim hacmi V = ${fmt2(vol0)} mm³ ise orantı sabiti k kaçtır? Bulduğumuz k ile v = ${fmt2(v1)} mm/s için hacmi de tahmin edelim.`,
          `In a wire-arc additive manufacturing system, the deposited volume V(v) depends on the wire feed speed v and is proportional to k·v^(3/2). If the volume is V = ${fmt2(vol0)} mm³ at v = ${fmt2(v0)} mm/s, what is the proportionality constant k? With this k, let\'s also predict the volume at v = ${fmt2(v1)} mm/s.`
        );
      }
      case 7:
        return I18N.tx(
          `Bir otomobil lastiğinin aşınma profili y = x² ile modelleniyor. Sensörler güncellenip basınç değiştirildiğinde aşınma eğrisi ${HorizontalPhrase(Math.trunc(x[0]), true)}, ${VerticalPhrase(Math.trunc(x[1]), true)} kayıyor. Yeni aşınma formülünü birlikte yazalım.`,
          `The wear profile of a car tyre is modelled by y = x². After the sensors are updated and the pressure is changed, the wear curve moves ${HorizontalPhrase(Math.trunc(x[0]), false)} and ${VerticalPhrase(Math.trunc(x[1]), false)}. Let\'s write the new wear formula.`
        );
      case 8:
        return I18N.tx(
          `Bir simülasyon yazılımında parça sıcaklığı zamana bağlı T(t) = ${x[0]}t ile artıyor. Termal genleşme ise sıcaklığa bağlı E(T) = ${fmt2(x[1] / 1000)}T olarak biliniyor. Genleşmenin zamana bağlı bileşke fonksiyonu E(T(t)) nedir ve t = ${x[2]}. saniyede genleşme kaç olur?`,
          `In a simulation program the temperature of a part rises with time as T(t) = ${x[0]}t. The thermal expansion depends on temperature as E(T) = ${fmt2(x[1] / 1000)}T. What is the composite function E(T(t)) giving expansion as a function of time, and what is the expansion at t = ${x[2]} s?`
        );
      default:
        return I18N.tx(
          `Bir turbo benzinli motorun orijinal tork eğrisi f(x)'tir (x: devir). Yeni bir yazılımla tork tüm devirlerde ${fmt2(x[0])} katına (dikey uzatma) çıkıyor ve güç bandı ${fmt2(x[1])} katına (yatay uzatma) genişliyor. Yeni tork eğrisini f(x) cinsinden yazalım.`,
          `The original torque curve of a turbocharged petrol engine is f(x) (x: engine speed). With new software the torque rises to ${fmt2(x[0])} times its value at all speeds (vertical stretch) and the power band widens by a factor ${fmt2(x[1])} (horizontal stretch). Let\'s write the new torque curve in terms of f(x).`
        );
    }
  }

  function Meaning(p) {
    switch (p.scn) {
      case 0:
        return I18N.tx(
          "Maliyet iki parçadan oluşuyor: kapı sayısından BAĞIMSIZ bir sabit kısım ve her kapı eklendikçe artan bir değişken kısım. " +
          "'Sabit + (birim maliyet × adet)' yapısı DOĞRUSAL bir fonksiyondur: f(x) = b + m·x. Buradaki b (y-kesimi) kapı yokken bile ödenen tutar, m (eğim) her ek kapının maliyetidir. " +
          "Matematiksel olarak yapılacak iş: (1) değişkeni ve fonksiyonu tanımlamak, (2) f(x) = sabit + eğim·x formülünü kurmak, (3) x yerine kapı sayısını koyup hesaplamak.",
          "The cost has two parts: a fixed part that does NOT depend on the number of doors and a part that grows with every door. " +
          "The structure 'fixed + (unit cost × quantity)' is a LINEAR function: f(x) = b + m·x. Here b (the y-intercept) is what is paid even with no doors, and m (the slope) is the cost of each extra door. " +
          "Mathematically, we (1) define the variable and function, (2) build f(x) = fixed + slope·x, (3) substitute the number of doors and compute."
        );
      case 1:
        return I18N.tx(
          "Derinlik, güce göre AŞAĞI açılan bir parabol (x² katsayısı negatif). Aşağı açılan parabolün en yüksek noktası TEPE NOKTASIdır. " +
          "'Maksimum derinlik hangi güçte?' sorusu tepe noktasının x koordinatını, 'ne kadar derin?' sorusu ise tepe noktasının y koordinatını (fonksiyon değerini) ister. " +
          "Matematiksel olarak: d(x) = ax² + bx için x = -b/(2a) değerini bulup sonra d'ye geri koyabiliriz.",
          "Depth is a DOWNWARD-opening parabola in the power (the x² coefficient is negative). The highest point of such a parabola is its VERTEX. " +
          "'At which power is the depth maximal?' asks for the x-coordinate of the vertex, and 'how deep?' asks for its y-coordinate (the function value). " +
          "Mathematically: for d(x) = ax² + bx we find x = -b/(2a), then substitute it back into d."
        );
      case 2:
        return I18N.tx(
          "Fonksiyon e üzeri NEGATİF bir üstür: zaman geçtikçe genlik AZALIR ve sıfıra yaklaşır (üstel sönüm). " +
          "'t saniye sonra genlik ne?' sorusu, formülde t yerine o sayıyı yazıp hesaplamak demektir. Zor kısım e^(-kt) değerini hesaplamak: önce üssü (−k·t) çarparak bulabilir, sonra e üzerini hesaplayabiliriz. " +
          "Matematiksel olarak istenen: A(t) fonksiyonunun t = verilen değerdeki DEĞERİ.",
          "The function has e raised to a NEGATIVE power: as time passes the amplitude DECREASES towards zero (exponential decay). " +
          "'What is the amplitude after t seconds?' means: put that number in for t and evaluate. The tricky part is e^(-kt): we can first multiply out the exponent (−k·t), then evaluate e to that power. " +
          "Mathematically we want: the VALUE of A(t) at the given t."
        );
      case 3:
        return I18N.tx(
          "Ses basıncı bir SİNÜS dalgasıdır: sürekli yukarı-aşağı salınır. 'Maksimum olduğu ilk an' sinüsün en büyük değeri olan 1'e ilk kez ulaştığı zamandır. " +
          "Sinüs, pozitif açılar arasında ilk kez π/2'de 1 olur. Bu yüzden içteki açıyı π/2'ye eşitleyip t'yi çözeriz. " +
          "Matematiksel olarak istenen: sin(ω·t) = 1 denkleminin en küçük pozitif çözümü.",
          "Sound pressure is a SINE wave: it keeps oscillating up and down. 'The first moment it is maximal' is the first time the sine reaches its greatest value 1. " +
          "Among positive angles, sine first equals 1 at π/2, so we set the inner angle equal to π/2 and solve for t. " +
          "Mathematically we want: the smallest positive solution of sin(ω·t) = 1."
        );
      case 4:
        return I18N.tx(
          "Fonksiyon PARÇALI: farklı günlerde farklı kural geçerli. Önce sorulan günün hangi bölgeye düştüğüne bakılır: 'ilk n gün' ise sabit kural, sonrası ise artan kural. " +
          "Sonra YALNIZCA o bölgenin formülünde x yerine gün numarası yazılır. Yanlış kuralı kullanmak sık yapılan bir hatadır; buna dikkat edebiliriz. " +
          "Matematiksel olarak istenen: parçalı fonksiyonun verilen x'teki değeri.",
          "The function is PIECEWISE: different days follow different rules. First check which region the asked day falls in: 'the first n days' use the fixed rule, later days the increasing rule. " +
          "Then substitute the day number into the formula of THAT region only. Using the wrong rule is a common mistake, so it helps to watch for it. " +
          "Mathematically we want: the value of the piecewise function at the given x."
        );
      case 5:
        return I18N.tx(
          "Toplam masraf kişi sayısına BÖLÜNÜYOR, bu yüzden fonksiyonda x paydada: C(x) = sabit/x + sabit; buna RASYONEL fonksiyon denir. Kişi sayısı arttıkça sabit masrafın kişi başına düşen payı küçülür, " +
          "ama kişi başı bilet her zaman ödenir: maliyet asla bilet fiyatının altına düşmez (yatay asimptot). " +
          "Matematiksel olarak istenen: C(x)'in x = verilen kişi sayısındaki değeri (ve grafiğin yorumu).",
          "The total expense is DIVIDED by the number of people, so x is in the denominator: C(x) = constant/x + constant; this is a RATIONAL function. As more people join, the fixed cost per person shrinks, " +
          "but the ticket is always paid: the cost never falls below the ticket price (a horizontal asymptote). " +
          "Mathematically we want: the value of C(x) at the given number of people (and interpreting the graph)."
        );
      case 6:
        return I18N.tx(
          "V = k·v^(3/2) bir KUVVET fonksiyonudur ve V, v^(3/2) ile ORANTILIDIR; k orantı sabitidir. Elimizde bir veri noktası var (v, V): bunu formülde yerine yazınca yalnızca k bilinmeyen kalır, basit bir denklemle çözülür. " +
          "Sonra k bilindiği için başka bir hız için hacmi tahmin edebiliriz: model artık tamamlanmıştır. " +
          "Matematiksel olarak: (1) verileri yerine koyup k'yı bulabilir, (2) modeli başka bir girdide kullanabiliriz. Not: v^(3/2) = (√v)³.",
          "V = k·v^(3/2) is a POWER function and V is PROPORTIONAL to v^(3/2); k is the constant of proportionality. We have one data point (v, V): substituting it leaves only k unknown, a simple equation. " +
          "Once k is known we can predict the volume for another speed: the model is complete. " +
          "Mathematically: (1) we substitute the data and find k, (2) we use the model at another input. Note: v^(3/2) = (√v)³."
        );
      case 7:
        return I18N.tx(
          "Bir grafiği KAYDIRIRKEN şu kuraldan yararlanırız: y = f(x - h) grafiği f'yi h birim SAĞA kaydırır (x'in İÇİNDE çıkarma), y = f(x) + k ise k birim YUKARI kaydırır (dışarıda toplama). " +
          "Yatay kaymada işaret sezgiselin tersidir. Burada f(x) = x², yani yeni fonksiyonu bulmak için x yerine (x - h) yazılır ve sonuca k eklenir. " +
          "Matematiksel olarak istenen: y = x²'nin verilen kaymalardan sonraki denklemi.",
          "To SHIFT a graph we use the rule: y = f(x - h) shifts f h units to the RIGHT (subtraction INSIDE x), and y = f(x) + k shifts it k units UP (addition outside). " +
          "The horizontal sign is the opposite of what intuition suggests. Here f(x) = x², so to get the new function we replace x with (x - h) and add k to the result. " +
          "Mathematically we want: the equation of y = x² after the given shifts."
        );
      case 8:
        return I18N.tx(
          "İki fonksiyon zincirleme çalışıyor: önce zaman sıcaklığı verir (T(t)), sonra sıcaklık genleşmeyi verir (E(T)). Bu, BİLEŞKE fonksiyondur: E(T(t)) = E'de T gördüğümüz her yere T(t)'yi yazarız. " +
          "Sonuç doğrudan zamandan genleşmeye giden tek bir fonksiyondur. Sonra t'yi yazıp sayıyı bulabiliriz. " +
          "Matematiksel olarak: (1) bileşke E(T(t))'yi sadeleşmiş biçimde yazabilir, (2) verilen t'de değerini hesaplayabiliriz.",
          "Two functions work in a chain: first time gives temperature (T(t)), then temperature gives expansion (E(T)). This is a COMPOSITE function: E(T(t)) means wherever E has a T, we write T(t). " +
          "The result is one function going straight from time to expansion. Then we can plug in t to get the number. " +
          "Mathematically: (1) we write the composite E(T(t)) in simplified form, (2) evaluate it at the given t."
        );
      default:
        return I18N.tx(
          "f(x) belirli bir orijinal grafiktir; yeni grafik onun ÖLÇEKLENMİŞ hâlidir. DIŞARIDAN çarpmak (c·f(x)) grafiği DİKEY uzatır. x'in İÇİNİ bölmek (f(x/d)) grafiği YATAY uzatır (d > 1 için genişletir). " +
          "İç ve dış işlemler ayrı ayrı yapılır ve tek bir formülde birleştirilir. " +
          "Matematiksel olarak: 'tüm değerler c kat, yatayda d kat uzasın' cümlesini y = c·f(x/d) biçiminde yazabiliriz.",
          "f(x) is a given original graph; the new graph is a SCALED version of it. Multiplying OUTSIDE (c·f(x)) stretches the graph VERTICALLY. Dividing INSIDE x (f(x/d)) stretches it HORIZONTALLY (widening it when d > 1). " +
          "The inside and outside operations are done separately and combined into one formula. " +
          "Mathematically: we can express 'all values c times larger, widened d times horizontally' as y = c·f(x/d)."
        );
    }
  }

  // ============================ solutions ============================

  function solveSteps(problem) {
    const x = problem.p;
    const s = [];
    switch (problem.scn) {
      case 0: {
        const total = x[0] + x[1] * x[2];
        s.push(I18N.tx('1. Önce değişkenleri adlandıralım: x = kapı sayısı, f(x) = toplam maliyet (TL).', '1. First, let\'s name the variables: x = number of doors, f(x) = total cost (TL).'));
        s.push(I18N.tx(`2. Sabit kısım kapı sayısından bağımsızdır: ${Money(x[0])} TL → bu, x = 0 iken ödenen tutar, yani y-kesimi (b).`, `2. The fixed part does not depend on the number of doors: ${Money(x[0])} TL → this is what you pay at x = 0, i.e. the y-intercept (b).`));
        s.push(I18N.tx(`3. Her kapı ${Money(x[1])} TL ekler → maliyet kapı başına ${Money(x[1])} TL artar, yani eğim m = ${Money(x[1])}.`, `3. Every door adds ${Money(x[1])} TL → cost rises by ${Money(x[1])} TL per door, so the slope is m = ${Money(x[1])}.`));
        s.push(I18N.tx(`4. Doğrusal fonksiyon f(x) = b + m·x  →  f(x) = ${Money(x[0])} + ${Money(x[1])}x.`, `4. Linear function f(x) = b + m·x  →  f(x) = ${Money(x[0])} + ${Money(x[1])}x.`));
        s.push(I18N.tx(`5. x = ${x[2]} kapı için yerine koyalım: f(${x[2]}) = ${Money(x[0])} + ${Money(x[1])}·(${x[2]}).`, `5. Let\'s substitute x = ${x[2]} doors: f(${x[2]}) = ${Money(x[0])} + ${Money(x[1])}·(${x[2]}).`));
        s.push(I18N.tx(`6. Önce çarpalım: ${Money(x[1])}·${x[2]} = ${Money(x[1] * x[2])}.`, `6. Let\'s multiply first: ${Money(x[1])}·${x[2]} = ${Money(x[1] * x[2])}.`));
        s.push(I18N.tx(`7. Sonra toplayalım: f(${x[2]}) = ${Money(x[0])} + ${Money(x[1] * x[2])} = ${Money(total)} TL.`, `7. Then we add: f(${x[2]}) = ${Money(x[0])} + ${Money(x[1] * x[2])} = ${Money(total)} TL.`));
        s.push(I18N.tx('8. Kontrol edelim: f(0) sabit maliyete eşit olmalı ve x bir artınca sonuç tam olarak eğim kadar artmalı. Grafiğin eğimi bunu gösterir.', "8. Let\'s check: f(0) should equal the fixed cost, and increasing x by one should raise the result by exactly the slope. The graph's slope shows this."));
        break;
      }
      case 1: {
        const a = x[0], best = x[1];
        const b = 2 * a * best;
        s.push(I18N.tx(`1. Formül d(x) = -${a}x² + ${b}x biçiminde d(x) = Ax² + Bx + C: A = -${a}, B = ${b}, C = 0.`, `1. The formula d(x) = -${a}x² + ${b}x has the form Ax² + Bx + C with A = -${a}, B = ${b}, C = 0.`));
        s.push(I18N.tx('2. A < 0 olduğu için parabol AŞAĞI açılır: bir MAKSİMUM noktası (tepe noktası) vardır.', '2. Since A < 0 the parabola opens DOWNWARD: it has a MAXIMUM point (the vertex).'));
        s.push(I18N.tx('3. Tepe noktasının x koordinatı x = -B / (2A).', '3. The x-coordinate of the vertex is x = -B / (2A).'));
        s.push(I18N.tx(`4. Yerine koyalım: x = -(${b}) / (2·(-${a})) = -${b} / (-${2 * a}).`, `4. Substitute: x = -(${b}) / (2·(-${a})) = -${b} / (-${2 * a}).`));
        s.push(I18N.tx(`5. Sadeleştirince x = ${fmt2(best)} W → maksimum derinlik bu lazer gücünde elde edilir.`, `5. Simplifying gives x = ${fmt2(best)} W → the maximum depth is obtained at this laser power.`));
        s.push(I18N.tx(`6. Derinliği bulmak için x = ${fmt2(best)}'i d(x)'e geri koyalım: d(${fmt2(best)}) = -${a}·(${fmt2(best)})² + ${b}·(${fmt2(best)}).`, `6. To find the depth, we put x = ${fmt2(best)} back into d(x): d(${fmt2(best)}) = -${a}·(${fmt2(best)})² + ${b}·(${fmt2(best)}).`));
        s.push(I18N.tx(`7. = -${a}·${fmt2(best * best)} + ${fmt2(b * best)} = ${fmt2(-a * best * best)} + ${fmt2(b * best)} = ${fmt2(a * best * best)} mikrometre.`, `7. = -${a}·${fmt2(best * best)} + ${fmt2(b * best)} = ${fmt2(-a * best * best)} + ${fmt2(b * best)} = ${fmt2(a * best * best)} micrometres.`));
        s.push(I18N.tx(`8. Kontrol edelim (kareye tamamlama): d(x) = -${a}(x - ${fmt2(best)})² + ${fmt2(a * best * best)}; en büyük değer ${fmt2(a * best * best)}, x = ${fmt2(best)}'de.`, `8. Let\'s check (completing the square): d(x) = -${a}(x - ${fmt2(best)})² + ${fmt2(a * best * best)}; the largest value is ${fmt2(a * best * best)} at x = ${fmt2(best)}.`));
        break;
      }
      case 2: {
        const a0 = x[0], k = x[1], t = x[2];
        const ex = -k * t;
        const ev = Math.exp(ex);
        s.push(I18N.tx('1. Model: A(t) = A₀·e^(−k·t), üstel SÖNÜM (üs negatif).', '1. Model: A(t) = A₀·e^(−k·t), exponential DECAY (negative exponent).'));
        s.push(I18N.tx(`2. Verilenler: A₀ = ${a0}, k = ${fmt2(k)}, t = ${t} s.`, `2. Given: A₀ = ${a0}, k = ${fmt2(k)}, t = ${t} s.`));
        s.push(I18N.tx(`3. t yerine ${t} yazalım: A(${t}) = ${a0}·e^(−${fmt2(k)}·${t}).`, `3. Let\'s substitute t = ${t}: A(${t}) = ${a0}·e^(−${fmt2(k)}·${t}).`));
        s.push(I18N.tx(`4. Üssü hesaplayalım: −${fmt2(k)}·${t} = ${fmt2(ex)}  →  A(${t}) = ${a0}·e^(${fmt2(ex)}).`, `4. Let\'s compute the exponent: −${fmt2(k)}·${t} = ${fmt2(ex)}  →  A(${t}) = ${a0}·e^(${fmt2(ex)}).`));
        s.push(I18N.tx(`5. e^(${fmt2(ex)}) ≈ ${fmt4(ev)} (hesap makinesi ya da e ≈ 2.718 ile).`, `5. e^(${fmt2(ex)}) ≈ ${fmt4(ev)} (calculator, or e ≈ 2.718).`));
        s.push(I18N.tx(`6. A(${t}) ≈ ${a0}·${fmt4(ev)} ≈ ${fmt3(a0 * ev)} mm.`, `6. A(${t}) ≈ ${a0}·${fmt4(ev)} ≈ ${fmt3(a0 * ev)} mm.`));
        s.push(I18N.tx(`7. Yorum: başlangıç genliğinin yaklaşık %${fmt1(100 * ev)}'i kalmıştır; her saniye aynı ORANDA (e^(−${fmt2(k)}) ≈ ${fmt3(Math.exp(-k))} katı) azalır.`, `7. Interpretation: about ${fmt1(100 * ev)}% of the initial amplitude remains; each second it shrinks by the same FACTOR (e^(−${fmt2(k)}) ≈ ${fmt3(Math.exp(-k))}).`));
        s.push(I18N.tx(`8. Ek bilgi: yarı ömür t½ = ln 2 / k = 0.693/${fmt2(k)} ≈ ${fmt2(Math.log(2) / k)} s (genlik bu sürede yarıya iner).`, `8. Extra: half-life t½ = ln 2 / k = 0.693/${fmt2(k)} ≈ ${fmt2(Math.log(2) / k)} s (the amplitude halves in this time).`));
        break;
      }
      case 3: {
        const a = x[0], m = x[1];
        s.push(I18N.tx(`1. Model: P(t) = ${fmt2(a)}·sin(${m}π·t). Sinüsün alabileceği en büyük değer 1'dir, bu yüzden en büyük basınç ${fmt2(a)}'dır.`, `1. Model: P(t) = ${fmt2(a)}·sin(${m}π·t). The largest value sine can take is 1, so the maximum pressure is ${fmt2(a)}.`));
        s.push(I18N.tx('2. sin θ = 1 olan en küçük POZİTİF açı θ = π/2\'dir.', '2. The smallest POSITIVE angle with sin θ = 1 is θ = π/2.'));
        s.push(I18N.tx(`3. İçerideki açıyı buna eşitleyelim: ${m}π·t = π/2.`, `3. Let\'s set the inner angle equal to it: ${m}π·t = π/2.`));
        s.push(I18N.tx(`4. Her iki taraftaki π'leri sadeleştirelim: ${m}·t = 1/2.`, `4. Let\'s cancel the π on both sides: ${m}·t = 1/2.`));
        s.push(I18N.tx(`5. t'yi çözelim: t = 1 / (2·${m}) = 1/${2 * m} s.`, `5. Let\'s solve for t: t = 1 / (2·${m}) = 1/${2 * m} s.`));
        s.push(I18N.tx(`6. Ondalık yazılışı: t = ${fmt7(1.0 / (2 * m))} s = ${fmt3(500.0 / m)} milisaniye.`, `6. Decimal: t = ${fmt7(1.0 / (2 * m))} s = ${fmt3(500.0 / m)} milliseconds.`));
        s.push(I18N.tx(`7. Kontrol: periyot T = 2π/ω = 2π/(${m}π) = ${fmt5(2.0 / m)} s; ilk maksimum çeyrek periyotta (T/4 = ${fmt5(0.5 / m)} s) olur. ✓`, `7. Check: period T = 2π/ω = 2π/(${m}π) = ${fmt5(2.0 / m)} s; the first maximum is at a quarter period (T/4 = ${fmt5(0.5 / m)} s). ✓`));
        s.push(I18N.tx(`8. Frekans f = 1/T = ${fmt2(m / 2.0)} Hz. (Grafikte yatay eksen milisaniyedir.)`, `8. Frequency f = 1/T = ${fmt2(m / 2.0)} Hz. (On the graph the horizontal axis is in milliseconds.)`));
        break;
      }
      case 4: {
        const c0 = x[0], n0 = x[1], r = x[2], d = x[3];
        s.push(I18N.tx(`1. Fonksiyon parçalı: f(x) = ${c0} (x ≤ ${n0}),   f(x) = ${c0} + ${r}(x − ${n0}) (x > ${n0}).`, `1. The function is piecewise: f(x) = ${c0} (x ≤ ${n0}),   f(x) = ${c0} + ${r}(x − ${n0}) (x > ${n0}).`));
        s.push(I18N.tx(`2. Sorulan gün x = ${d}. Hangi bölgede? ${d} ${d <= n0 ? '≤' : '>'} ${n0}.`, `2. The asked day is x = ${d}. Which region? ${d} ${d <= n0 ? '≤' : '>'} ${n0}.`));
        if (d <= n0) {
          s.push(I18N.tx(`3. ${d} ≤ ${n0} olduğundan BİRİNCİ kural geçerli: alınan kalori sabittir.`, `3. Since ${d} ≤ ${n0}, the FIRST rule applies: the intake is constant.`));
          s.push(I18N.tx(`4. f(${d}) = ${c0} kalori.`, `4. f(${d}) = ${c0} calories.`));
        } else {
          s.push(I18N.tx(`3. ${d} > ${n0} olduğundan İKİNCİ kural geçerli.`, `3. Since ${d} > ${n0}, the SECOND rule applies.`));
          s.push(I18N.tx(`4. x = ${d} için yerine koyalım: f(${d}) = ${c0} + ${r}(${d} − ${n0}).`, `4. Let\'s substitute x = ${d}: f(${d}) = ${c0} + ${r}(${d} − ${n0}).`));
          s.push(I18N.tx(`5. Parantezi hesaplayalım: ${d} − ${n0} = ${d - n0}.`, `5. Let\'s evaluate the bracket: ${d} − ${n0} = ${d - n0}.`));
          s.push(I18N.tx(`6. Çarpalım: ${r}·${d - n0} = ${r * (d - n0)}.`, `6. Let\'s multiply: ${r}·${d - n0} = ${r * (d - n0)}.`));
          s.push(I18N.tx(`7. Toplayalım: f(${d}) = ${c0} + ${r * (d - n0)} = ${c0 + r * (d - n0)} kalori.`, `7. Then add: f(${d}) = ${c0} + ${r * (d - n0)} = ${c0 + r * (d - n0)} calories.`));
        }
        s.push(I18N.tx(`8. Kontrol edelim: iki kural x = ${n0}'da aynı değeri (${c0}) verir, bu yüzden grafik kopmadan devam eder; ${n0}. günden sonra eğim ${r} kalori/gündür.`, `8. Let\'s check: both rules give the same value (${c0}) at x = ${n0}, so the graph joins without a break; after day ${n0} the slope is ${r} calories/day.`));
        break;
      }
      case 5: {
        const f = x[0], pr = x[1], n = x[2];
        s.push(I18N.tx(`1. Model: C(x) = ${Money(f)}/x + ${Money(pr)}; x = kişi sayısı, C(x) = kişi başı ortalama maliyet.`, `1. Model: C(x) = ${Money(f)}/x + ${Money(pr)}; x = number of people, C(x) = average cost per person.`));
        s.push(I18N.tx(`2. x = ${n} yerine koyalım: C(${n}) = ${Money(f)}/${n} + ${Money(pr)}.`, `2. Let\'s substitute x = ${n}: C(${n}) = ${Money(f)}/${n} + ${Money(pr)}.`));
        s.push(I18N.tx(`3. Önce bölelim: ${Money(f)} / ${n} = ${Money(f / n)}.`, `3. Let\'s divide first: ${Money(f)} / ${n} = ${Money(f / n)}.`));
        s.push(I18N.tx(`4. Sonra toplayalım: C(${n}) = ${Money(f / n)} + ${Money(pr)} = ${Money(f / n + pr)} TL kişi başı.`, `4. Then we add: C(${n}) = ${Money(f / n)} + ${Money(pr)} = ${Money(f / n + pr)} TL per person.`));
        s.push(I18N.tx(`5. Toplam maliyet: ${n} kişi × ${Money(f / n + pr)} = ${Money(n * (f / n + pr))} TL (= ${Money(f)} + ${n}·${Money(pr)} ✓).`, `5. Total cost: ${n} people × ${Money(f / n + pr)} = ${Money(n * (f / n + pr))} TL (= ${Money(f)} + ${n}·${Money(pr)} ✓).`));
        s.push(I18N.tx(`6. Yorum: x büyüdükçe ${Money(f)}/x → 0, yani C(x) → ${Money(pr)}: y = ${Money(pr)} YATAY ASİMPTOTTUR.`, `6. Interpretation: as x grows ${Money(f)}/x → 0, so C(x) → ${Money(pr)}: y = ${Money(pr)} is a HORIZONTAL ASYMPTOTE.`));
        s.push(I18N.tx("7. Tanım kümesi: x > 0 (kişi sayısı pozitif tam sayı). x = 0'da payda sıfır olur, fonksiyon tanımsızdır (dikey asimptot).", '7. Domain: x > 0 (the number of people is a positive integer). At x = 0 the denominator is zero and the function is undefined (vertical asymptote).'));
        break;
      }
      case 6: {
        const sv = x[0], k = x[1], s1 = x[2];
        const v0 = sv * sv, v1 = s1 * s1;
        const vol0 = k * sv * sv * sv, vol1 = k * s1 * s1 * s1;
        s.push(I18N.tx(`1. Denklem: V = k·v^(3/2). Bilinen veri: v = ${fmt2(v0)} iken V = ${fmt2(vol0)}.`, `1. Equation: V = k·v^(3/2). Known data: V = ${fmt2(vol0)} when v = ${fmt2(v0)}.`));
        s.push(I18N.tx(`2. Yerine koyalım: ${fmt2(vol0)} = k·(${fmt2(v0)})^(3/2).`, `2. Let\'s substitute: ${fmt2(vol0)} = k·(${fmt2(v0)})^(3/2).`));
        s.push(I18N.tx(`3. v^(3/2) = (√v)³ olduğundan: ${fmt2(v0)}^(3/2) = (√${fmt2(v0)})³ = (${fmt2(sv)})³ = ${fmt2(sv * sv * sv)}.`, `3. Since v^(3/2) = (√v)³: ${fmt2(v0)}^(3/2) = (√${fmt2(v0)})³ = (${fmt2(sv)})³ = ${fmt2(sv * sv * sv)}.`));
        s.push(I18N.tx(`4. Denklem: ${fmt2(vol0)} = k·${fmt2(sv * sv * sv)}.`, `4. The equation becomes: ${fmt2(vol0)} = k·${fmt2(sv * sv * sv)}.`));
        s.push(I18N.tx(`5. k'yı çözelim: k = ${fmt2(vol0)} / ${fmt2(sv * sv * sv)} = ${fmt2(k)}.`, `5. Let\'s solve for k: k = ${fmt2(vol0)} / ${fmt2(sv * sv * sv)} = ${fmt2(k)}.`));
        s.push(I18N.tx(`6. Model tamam: V(v) = ${fmt2(k)}·v^(3/2).`, `6. The model is complete: V(v) = ${fmt2(k)}·v^(3/2).`));
        s.push(I18N.tx(`7. Tahmin: v = ${fmt2(v1)} için V = ${fmt2(k)}·(${fmt2(v1)})^(3/2) = ${fmt2(k)}·(${fmt2(s1)})³ = ${fmt2(k)}·${fmt2(s1 * s1 * s1)} = ${fmt2(vol1)} mm³.`, `7. Prediction: for v = ${fmt2(v1)}, V = ${fmt2(k)}·(${fmt2(v1)})^(3/2) = ${fmt2(k)}·(${fmt2(s1)})³ = ${fmt2(k)}·${fmt2(s1 * s1 * s1)} = ${fmt2(vol1)} mm³.`));
        s.push(I18N.tx(`8. Yorum: hız ${fmt2(v1 / v0)} katına çıkarsa hacim ${fmt2(vol1 / vol0)} katına çıkar ((v₁/v₀)^(3/2)); orantı doğrusal değil, kuvvet biçimindedir.`, `8. Interpretation: if speed is multiplied by ${fmt2(v1 / v0)}, volume is multiplied by ${fmt2(vol1 / vol0)} ((v₁/v₀)^(3/2)); the relationship is a power law, not linear.`));
        break;
      }
      case 7: {
        const h = Math.trunc(x[0]), k = Math.trunc(x[1]);
        s.push(I18N.tx('1. Orijinal fonksiyon: y = x².', '1. Original function: y = x².'));
        s.push(h === 0
          ? I18N.tx('2. Yatay kayma yok: x aynı kalır.', '2. No horizontal shift: x stays as it is.')
          : I18N.tx(`2. ${h > 0 ? `SAĞA ${h} birim` : `SOLA ${-h} birim`} kaymak için x yerine (x ${h > 0 ? '−' : '+'} ${Math.abs(h)}) yazılır (yatay kaymada işaret TERS): y = (x ${h > 0 ? '−' : '+'} ${Math.abs(h)})².`,
                     `2. To move ${h > 0 ? `${h} unit(s) RIGHT` : `${-h} unit(s) LEFT`} replace x with (x ${h > 0 ? '−' : '+'} ${Math.abs(h)}) (the horizontal sign is OPPOSITE): y = (x ${h > 0 ? '−' : '+'} ${Math.abs(h)})².`));
        s.push(k === 0
          ? I18N.tx('3. Dikey kayma yok: sonuca bir şey eklenmez.', '3. No vertical shift: nothing is added to the result.')
          : I18N.tx(`3. ${k > 0 ? `YUKARI ${k} birim` : `AŞAĞI ${-k} birim`} kaymak için denklemin sonuna ${k > 0 ? '+' : '−'} ${Math.abs(k)} eklenir (dikey kaymada işaret AYNI).`,
                     `3. To move ${k > 0 ? `${k} unit(s) UP` : `${-k} unit(s) DOWN`} add ${k > 0 ? '+' : '−'} ${Math.abs(k)} to the end of the equation (the vertical sign is the SAME).`));
        s.push(I18N.tx(`4. Yeni formül: y = (x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})² ${k >= 0 ? '+' : '−'} ${Math.abs(k)}.`, `4. New formula: y = (x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})² ${k >= 0 ? '+' : '−'} ${Math.abs(k)}.`));
        s.push(I18N.tx(`5. Kontrol: eski tepe noktası (0, 0) → yeni tepe noktası (${h}, ${k}). Grafikte sarı nokta.`, `5. Check: the old vertex (0, 0) → the new vertex (${h}, ${k}). The yellow point on the graph.`));
        s.push(I18N.tx(`6. Bir nokta ile test: x = ${h + 1} için y = (1)² + ${k} = ${1 + k}; eski eğride x = 1 için y = 1'di: nokta (${h}, ${k}) kadar kaymıştır.`, `6. Test with a point: x = ${h + 1} gives y = (1)² + ${k} = ${1 + k}; on the old curve x = 1 gave y = 1: the point has moved by (${h}, ${k}).`));
        break;
      }
      case 8: {
        const a = x[0], b = x[1] / 1000, t = x[2];
        s.push(I18N.tx(`1. Verilenler: T(t) = ${a}t   ve   E(T) = ${fmt2(b)}T.`, `1. Given: T(t) = ${a}t   and   E(T) = ${fmt2(b)}T.`));
        s.push(I18N.tx(`2. Bileşke: E(T(t)) demek, E(T)'de T gördüğümüz yere T(t)'yi yazmak demektir: E(T(t)) = ${fmt2(b)}·(${a}t).`, `2. Composition: E(T(t)) means we write T(t) wherever E has a T: E(T(t)) = ${fmt2(b)}·(${a}t).`));
        s.push(I18N.tx(`3. Sayıları çarpalım: ${fmt2(b)}·${a} = ${fmt2(a * b)}.`, `3. Let\'s multiply the numbers: ${fmt2(b)}·${a} = ${fmt2(a * b)}.`));
        s.push(I18N.tx(`4. Bileşke fonksiyon: E(t) = ${fmt2(a * b)}t (t zamandan genleşmeye doğrudan bir doğrusal fonksiyon).`, `4. Composite function: E(t) = ${fmt2(a * b)}t (a linear function from time straight to expansion).`));
        s.push(I18N.tx(`5. t = ${t} için: E(${t}) = ${fmt2(a * b)}·${t}.`, `5. For t = ${t}: E(${t}) = ${fmt2(a * b)}·${t}.`));
        s.push(I18N.tx(`6. E(${t}) = ${fmt2(a * b * t)} birim.`, `6. E(${t}) = ${fmt2(a * b * t)} units.`));
        s.push(I18N.tx(`7. Farklı yoldan kontrol edelim: önce T(${t}) = ${a}·${t} = ${a * t}; sonra E(${a * t}) = ${fmt2(b)}·${a * t} = ${fmt2(b * a * t)} ✓ (aynı sonuç).`, `7. Let\'s check the other way: first T(${t}) = ${a}·${t} = ${a * t}; then E(${a * t}) = ${fmt2(b)}·${a * t} = ${fmt2(b * a * t)} ✓ (same result).`));
        break;
      }
      default: {
        const c = x[0], d = x[1];
        s.push(I18N.tx('1. Orijinal tork eğrisi y = f(x).', '1. Original torque curve y = f(x).'));
        s.push(I18N.tx(`2. DİKEY uzatma (${fmt2(c)} kat): tüm y değerleri ${fmt2(c)} ile çarpılır, bu DIŞARIDAN yapılır: ${fmt2(c)}·f(x).`, `2. VERTICAL stretch (factor ${fmt2(c)}): all y-values are multiplied by ${fmt2(c)}, done OUTSIDE: ${fmt2(c)}·f(x).`));
        s.push(I18N.tx(`3. YATAY uzatma (${fmt2(d)} kat): grafik yatayda ${fmt2(d)} kat genişleyecekse x yerine x/${fmt2(d)} yazılır, bu İÇERİDE yapılır: f(x/${fmt2(d)}). (Aynı çıktıya ${fmt2(d)} kat büyük bir x'te ulaşılır.)`, `3. HORIZONTAL stretch (factor ${fmt2(d)}): to widen the graph ${fmt2(d)} times horizontally replace x with x/${fmt2(d)}, done INSIDE: f(x/${fmt2(d)}). (The same output is reached at an x that is ${fmt2(d)} times larger.)`));
        s.push(I18N.tx(`4. İkisini birleştirelim: y = ${fmt2(c)}·f(x/${fmt2(d)}).`, `4. Let\'s combine both: y = ${fmt2(c)}·f(x/${fmt2(d)}).`));
        s.push(I18N.tx(`5. Örnek f(x) = 3x(8 − x) (tepe noktası (4, 48)) alınırsa yeni tepe noktası (${fmt2(4 * d)}, ${fmt2(48 * c)}): x koordinatı ×${fmt2(d)}, y koordinatı ×${fmt2(c)}.`, `5. With the sample f(x) = 3x(8 − x) (vertex (4, 48)) the new vertex is (${fmt2(4 * d)}, ${fmt2(48 * c)}): x multiplied by ${fmt2(d)}, y multiplied by ${fmt2(c)}.`));
        s.push(I18N.tx(`6. Tanım aralığı da genişler: [0, 8] → [0, ${fmt2(8 * d)}].`, `6. The domain widens too: [0, 8] → [0, ${fmt2(8 * d)}].`));
        s.push(I18N.tx('7. Sık yapılan bir hata: f(x/d) yerine f(d·x) yazmak grafiği SIKIŞTIRIR (d > 1 için), genişletmez.', '7. Common mistake: writing f(d·x) instead of f(x/d) COMPRESSES the graph (for d > 1) instead of widening it.'));
      }
    }
    return s;
  }

  // ---- small formatting helpers mirroring VB's inline ":0.####" / ":0.###" / ":0.#" / ":0.#######" / ":0.#####" ----
  function fmtN(v, digits) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(digits);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }
  function fmt1(v) { return fmtN(v, 1); }
  function fmt3(v) { return fmtN(v, 3); }
  function fmt4(v) { return fmtN(v, 4); }
  function fmt5(v) { return fmtN(v, 5); }
  function fmt7(v) { return fmtN(v, 7); }

  // ============================ drawing ============================

  // Operating point of each scenario (the gold marker), the same one draw() highlights.
  function focusPoint(problem) {
    const x = problem.p;
    switch (problem.scn) {
      case 0: return { x: x[2], y: x[0] + x[1] * x[2] };
      case 1: return { x: x[1], y: x[0] * x[1] * x[1] };
      case 2: return { x: x[2], y: x[0] * Math.exp(-x[1] * x[2]) };
      case 3: return { x: 500.0 / x[1], y: x[0] };
      case 4: return { x: x[3], y: x[3] <= x[1] ? x[0] : x[0] + x[2] * (x[3] - x[1]) };
      case 5: return { x: x[2], y: x[0] / x[2] + x[1] };
      case 6: {
        const v0 = x[0] * x[0], v1 = x[2] * x[2];
        return { x: (v0 + v1) / 2, y: (x[1] * Math.pow(v0, 1.5) + x[1] * Math.pow(v1, 1.5)) / 2 };
      }
      case 7: return { x: Math.trunc(x[0]), y: Math.trunc(x[1]) };
      case 8: return { x: x[2], y: x[0] * (x[1] / 1000) * x[2] };
      default: return { x: 4 * x[1], y: 48 * x[0] };
    }
  }

  // Viewport centred on the focus point; it always contains the original window.
  function setVP(canvas, problem, x0, x1, y0, y1) {
    canvas.setViewport(x0, x1, y0, y1); // fixed axes
  }

  function draw(canvas, problem) {
    const x = problem.p;
    const accent = canvas.accent();
    switch (problem.scn) {
      case 0: {
        const f = (v) => x[0] + x[1] * v;
        setVP(canvas, problem, -0.6, 8, -x[0] * 0.15, x[0] + 8 * x[1] + 200);
        canvas.addFunction({ evaluator: f, color: accent, thickness: 3 });
        canvas.addMarker({ x: 0, y: x[0], color: canvas.blue(), radius: 6, label: I18N.tx('sabit', 'fixed') });
        canvas.addMarker({ x: x[2], y: f(x[2]), color: canvas.gold(), radius: 7, label: `f(${x[2]}) = ${Money(f(x[2]))}` });
        break;
      }
      case 1: {
        const a = x[0], best = x[1], b = 2 * x[0] * x[1];
        const top = a * best * best;
        setVP(canvas, problem, -best * 0.15, best * 2.15, -top * 0.2, top * 1.3);
        canvas.addFunction({ evaluator: (v) => -a * v * v + b * v, color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'vertical', position: best, color: canvas.gray() });
        canvas.addMarker({ x: best, y: top, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${fmt2(best)}, ${fmt2(top)})` });
        break;
      }
      case 2: {
        const a0 = x[0], k = x[1], t = x[2];
        setVP(canvas, problem, -0.5, 8, -a0 * 0.12, a0 * 1.2);
        canvas.addFunction({ evaluator: (v) => a0 * Math.exp(-k * v), color: accent, thickness: 3 });
        canvas.addMarker({ x: t, y: a0 * Math.exp(-k * t), color: canvas.gold(), radius: 7, label: `A(${t}) = ${fmt3(a0 * Math.exp(-k * t))}` });
        break;
      }
      case 3: {
        const a = x[0], m = x[1];
        const tMs = 500.0 / m, periodMs = 2000.0 / m;
        setVP(canvas, problem, -periodMs * 0.1, periodMs * 2.05, -a * 1.4, a * 1.4);
        canvas.addFunction({ evaluator: (v) => a * Math.sin(m * Math.PI * v / 1000.0), color: accent, thickness: 3 });
        canvas.addMarker({ x: tMs, y: a, color: canvas.gold(), radius: 7, label: `t = ${fmt3(tMs)} ms` });
        canvas.addGuideLine({ axis: 'vertical', position: tMs, color: canvas.gray() });
        break;
      }
      case 4: {
        const c0 = x[0], n0 = x[1], r = x[2], d = x[3];
        const f = (v) => (v <= n0 ? c0 : c0 + r * (v - n0));
        setVP(canvas, problem, -0.5, 12, c0 * 0.6, c0 + r * (12 - n0) * 1.1 + 100);
        canvas.addFunction({ evaluator: (v) => (v <= n0 ? c0 : NaN), color: canvas.green(), thickness: 3 });
        canvas.addFunction({ evaluator: (v) => (v >= n0 ? c0 + r * (v - n0) : NaN), color: accent, thickness: 3 });
        canvas.addMarker({ x: d, y: f(d), color: canvas.gold(), shape: 'diamond', radius: 7, label: `f(${d}) = ${f(d)}` });
        break;
      }
      case 5: {
        const fc = x[0], pr = x[1], n = x[2];
        const f = (v) => (v <= 0 ? NaN : fc / v + pr);
        setVP(canvas, problem, -0.6, 12, 0, fc / 1.5 + pr);
        canvas.addFunction({ evaluator: f, color: accent, thickness: 3 });
        canvas.addGuideLine({ axis: 'horizontal', position: pr, color: canvas.gray(), label: `y = ${Money(pr)}` });
        canvas.addMarker({ x: n, y: f(n), color: canvas.gold(), radius: 7, label: `C(${n}) = ${Money(f(n))}` });
        break;
      }
      case 6: {
        const sv = x[0], k = x[1], s1 = x[2];
        const v0 = sv * sv, v1 = s1 * s1;
        const vmax = Math.max(v0, v1) * 1.25;
        setVP(canvas, problem, -vmax * 0.06, vmax, -k * Math.pow(vmax, 1.5) * 0.06, k * Math.pow(vmax, 1.5));
        canvas.addFunction({ evaluator: (v) => (v < 0 ? NaN : k * Math.pow(v, 1.5)), color: accent, thickness: 3 });
        canvas.addMarker({ x: v0, y: k * Math.pow(v0, 1.5), color: canvas.gold(), radius: 7, label: I18N.tx('veri', 'data') });
        canvas.addMarker({ x: v1, y: k * Math.pow(v1, 1.5), color: canvas.green(), radius: 7, label: I18N.tx('tahmin', 'prediction') });
        break;
      }
      case 7: {
        const h = x[0], k = x[1];
        setVP(canvas, problem, -9, 9, -6, 12);
        canvas.addFunction({ evaluator: (v) => v * v, color: canvas.gray(), thickness: 2, dashed: true });
        canvas.addFunction({ evaluator: (v) => (v - h) * (v - h) + k, color: accent, thickness: 3 });
        canvas.addMarker({ x: h, y: k, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${fmt2(h)}, ${fmt2(k)})` });
        break;
      }
      case 8: {
        const a = x[0], b = x[1] / 1000, t = x[2];
        const top = a * b * 10;
        setVP(canvas, problem, -0.6, 10, -top * 0.08, top * 1.15);
        canvas.addFunction({ evaluator: (v) => a * b * v, color: accent, thickness: 3 });
        canvas.addMarker({ x: t, y: a * b * t, color: canvas.gold(), radius: 7, label: `E(${t}) = ${fmt2(a * b * t)}` });
        break;
      }
      default: {
        const c = x[0], d = x[1];
        const f = (v) => (v < 0 || v > 8 ? NaN : 3 * v * (8 - v));
        setVP(canvas, problem, -1, 8 * d + 2, -10, 48 * c + 14);
        canvas.addFunction({ evaluator: f, color: canvas.gray(), thickness: 2, dashed: true });
        canvas.addFunction({ evaluator: (v) => c * f(v / d), color: accent, thickness: 3 });
        canvas.addMarker({ x: 4, y: 48, color: canvas.gray(), radius: 5, label: 'f' });
        canvas.addMarker({ x: 4 * d, y: 48 * c, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${fmt2(4 * d)}, ${fmt2(48 * c)})` });
      }
    }
    // Mirrors VB's DrawProblem override (Draw(canvas, problem) followed by SyncSliders(problem)) -
    // keeps the slider rows' captions/ranges/positions in step with the active scenario on every
    // refresh, regenerate, and scenario switch, without fighting the generic addSlider helper's
    // registration-time-fixed min/max.
    syncSliders(problem);
  }

  // Shows only the sliders the current scenario uses (up to 4) and moves them to the problem's
  // values; mirrors RealLifeControlBase.SyncSliders.
  function syncSliders(problem) {
    if (sliderRows.length === 0) return;
    const specs = Specs(problem.scn);
    for (let i = 0; i < sliderRows.length; i++) {
      const row = sliderRows[i];
      if (i >= specs.length) {
        row.block.style.display = 'none';
        continue;
      }
      const sp = specs[i];
      row.block.style.display = '';
      row.captionEl.textContent = sp.caption;
      const v = problem.p[i];
      row.valueEl.textContent = fmt2(v);
      const ratio = (v - sp.min) / (sp.max - sp.min);
      row.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
    }
  }

  // ============================ framework glue ============================

  function createProblem(rng) {
    const scn = currentScenario;
    const specs = Specs(scn);
    const p = [0, 0, 0, 0, 0];
    for (let i = 0; i < specs.length; i++) {
      const sp = specs[i];
      const count = Math.round((sp.max - sp.min) / sp.step);
      p[i] = Math.round((sp.min + sp.step * rng.nextInt(0, count + 1)) * 10000) / 10000;
    }
    return { scn, p };
  }

  function concept(problem) {
    const head = I18N.tx('SORU', 'QUESTION') + '\n' + Question(problem) + '\n\n';
    if (showMeaning) {
      return head + I18N.tx('BU SORUDA MATEMATİKSEL OLARAK NE İSTENİYOR?', 'WHAT IS THIS QUESTION ASKING, MATHEMATICALLY?') + '\n' + Meaning(problem);
    }
    return head + I18N.tx(
      "(Çözmeden önce sorunun matematiksel karşılığını görmek istersek 'Soru ne demek istiyor?' düğmesine basabiliriz.)",
      "(To see what the question means mathematically before solving, we can press the 'What does the question mean?' button.)"
    );
  }

  function buildControls(rightCol, getProblem, helpers) {
    // Scenario selector - changing it needs a brand new problem shape (different P layout), so
    // regenerate(); addSelect also calls refresh() right after, which is redundant but harmless.
    const selectReg = helpers.addSelect({
      options: Titles().map((label, value) => ({ label, value })),
      get: () => currentScenario,
      set: (v) => { currentScenario = Number(v); helpers.regenerate(); },
    });

    // "What does the question mean?" toggle button (bespoke DOM, mirrors the VB _meaningButton).
    const meaningBtn = document.createElement('button');
    meaningBtn.className = 'flat-btn';
    function updateMeaningLabel() {
      meaningBtn.textContent = showMeaning
        ? I18N.tx('Soru ne demek istiyor? (Gizle)', 'What does the question mean? (Hide)')
        : I18N.tx('Soru ne demek istiyor? (Göster)', 'What does the question mean? (Show)');
    }
    updateMeaningLabel();
    meaningBtn.addEventListener('click', () => {
      showMeaning = !showMeaning;
      updateMeaningLabel();
      helpers.refresh();
    });
    rightCol.appendChild(meaningBtn);

    // Up to 4 slider rows, built by hand (not via helpers.addSlider) because that helper fixes
    // min/max/caption at registration time, while here they depend on the ACTIVE scenario and
    // must track it after every scenario switch / "New Example" click. Built with the same DOM
    // shape/classes addSlider uses so they look identical. A scenario may use fewer than 4 specs
    // (down to 2); rows beyond the current scenario's spec length are hidden by syncSliders(),
    // which runs at the end of every draw() call (mirrors VB's DrawProblem -> SyncSliders).
    sliderRows = [];
    for (let i = 0; i < 4; i++) {
      const idx = i;
      const block = document.createElement('div');
      block.className = 'we-slider-block';
      const captionEl = document.createElement('div');
      captionEl.className = 'we-slider-caption';
      const valueEl = document.createElement('div');
      valueEl.className = 'we-slider-value';
      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'we-slider';
      input.min = '0'; input.max = '1000'; input.step = '1';
      block.appendChild(captionEl);
      block.appendChild(valueEl);
      block.appendChild(input);
      rightCol.appendChild(block);

      input.addEventListener('input', () => {
        const specs = Specs(getProblem().scn);
        if (idx >= specs.length) return; // hidden row, nothing to edit
        const sp = specs[idx];
        const ratio = Number(input.value) / 1000;
        let v = sp.min + ratio * (sp.max - sp.min);
        v = Math.round(v / sp.step) * sp.step;
        v = Math.max(sp.min, Math.min(sp.max, v));
        getProblem().p[idx] = Math.round(v * 10000) / 10000;
        helpers.refresh();
      });

      sliderRows.push({ block, captionEl, valueEl, input });
    }

    // The select's OPTION TEXT and the meaning button's label are static DOM set once above, so
    // (unlike the concept text / slider captions, which are re-read from Titles()/Specs() on every
    // refresh) they need their own language-change hook to stay bilingual. Re-armed on every mount
    // (re-subscribing replaces the previous unsubscribe) so revisiting this tab never accumulates
    // listeners on old, detached DOM.
    if (offLangCustom) offLangCustom();
    offLangCustom = I18N.onChange(() => {
      const titles = Titles();
      for (let i = 0; i < selectReg.select.options.length && i < titles.length; i++) {
        selectReg.select.options[i].textContent = titles[i];
      }
      updateMeaningLabel();
    });
  }

  Topics.register('functions', {
    id: 'realLifeExamples',
    tabTitle: () => I18N.tx('Hayattan Örnekler', 'Real-Life Examples'),
    concept,
    createProblem,
    solveSteps,
    draw,
    focus: (p) => focusPoint(p),
    buildControls,
  });
})();
