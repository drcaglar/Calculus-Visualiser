// Ported from Modules/Applications/RealLifeApplicationsControl.vb over RealLifeControlBase.vb (same pattern as
// js/topics/derivatives/realLifeDerivatives.js): ten engineering word problems (open box, fenced area, cubic profit,
// sliding ladder, oil slick = related rates, Newton's method, L'Hopital sensor ratio, linear approximation of a plate side,
// mean value theorem as average speed, beam deflection = critical point). problem = { scn, p: [numbers] } (mirrors RlProblem).
// Module-level state (scenario selector, 'what does the question mean?' toggle) survives "New Example".
(function () {
  let currentScenario = 0;
  let showMeaning = false;
  let sliderRows = [];
  let offLangCustom = null;

  const tx = (a, b) => I18N.tx(a, b);
  const N2 = (v) => fmt2(v).replace(/-/g, '−');
  const Spec = (caption, min, max, step) => ({ caption, min, max, step });
  // up to `dec` decimals (VB 0.#### -> F4)
  function F(v, dec) {
    if (!isFinite(v)) return String(v);
    let s = v.toFixed(dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/[.]$/, '');
    if (s === '-0') s = '0';
    return s.replace(/-/g, '−');
  }
  const F4 = (v) => F(v, 4);
  const PI = Math.PI;
  const safe = (fn) => (u) => { try { const r = fn(u); return Number.isFinite(r) ? r : NaN; } catch (e) { return NaN; } };

  function Titles() {
    return [
      tx('1. Optimizasyon: sacdan en büyük hacimli kutu', '1. Optimization: largest-volume box from sheet metal'),
      tx('2. Optimizasyon: duvar kenarında çit alanı', '2. Optimization: fenced area along a wall'),
      tx('3. Optimizasyon: kübik kâr eğrisi', '3. Optimization: cubic profit curve'),
      tx('4. İlişkili değişim: kayan merdiven', '4. Related rates: sliding ladder'),
      tx('5. İlişkili değişim: yayılan yağ lekesi', '5. Related rates: spreading oil spill'),
      tx("6. Newton yöntemi: x³ + x = k", "6. Newton's method: x³ + x = k"),
      tx("7. L'Hôpital: 0/0 türünde sensör oranı", "7. L'Hôpital: 0/0 sensor ratio"),
      tx('8. Doğrusal yaklaşım: levhanın kenar uzunluğu', '8. Linear approximation: plate side length'),
      tx('9. Ortalama değer teoremi: ortalama hız', '9. Mean value theorem: average speed'),
      tx('10. Kritik nokta: kirişin en büyük çökmesi', '10. Critical point: maximum beam deflection'),
    ];
  }

  function Specs(scn) {
    switch (scn) {
      case 0: return [Spec(tx('Kare sac kenarı L (cm)', 'Square sheet side L (cm)'), 12, 48, 6)];
      case 1: return [Spec(tx('Toplam çit uzunluğu F (m)', 'Total fence length F (m)'), 40, 120, 20)];
      case 2: return [Spec(tx('a (kâr eğrisi şekli)', 'a (profit curve shape)'), 1, 5, 1), Spec(tx('k (ölçek, bin TL)', 'k (scale, thousand TL)'), 1, 5, 1)];
      case 3: return [Spec(tx('m (merdiven 5m, taban 3m, duvar 4m)', 'm (ladder 5m, base 3m, wall 4m)'), 1, 4, 1), Spec(tx('Tabanın kayma hızı (m/s)', 'Base sliding speed (m/s)'), 1, 3, 1)];
      case 4: return [Spec(tx('Anlık yarıçap r (m)', 'Current radius r (m)'), 2, 10, 1), Spec(tx('Yarıçap artış hızı (m/dk)', 'Radius growth rate (m/min)'), 1, 4, 1)];
      case 5: return [Spec(tx('Gerçek kök r (k = r³ + r)', 'True root r (k = r³ + r)'), 2, 4, 1), Spec(tx('Başlangıç tahmini x₀', 'Initial guess x₀'), 1, 5, 1)];
      case 6: return [Spec('a', 1, 6, 1), Spec('b', 1, 6, 1)];
      case 7: return [Spec(tx('Yakın tam kare: a (alan a²)', 'Nearby perfect square: a (area a²)'), 4, 10, 1), Spec(tx('Ek alan d (cm²)', 'Extra area d (cm²)'), 1, 5, 1)];
      case 8: return [Spec(tx('a (s = a·t² + b·t)', 'a (s = a·t² + b·t)'), 1, 4, 1), Spec(tx('b (m/s)', 'b (m/s)'), 1, 10, 1), Spec(tx('Süre T (s)', 'Duration T (s)'), 2, 10, 2)];
      default: return [Spec(tx('Kiriş boyu L (m)', 'Beam length L (m)'), 2, 8, 2), Spec(tx('Yük katsayısı k', 'Load factor k'), 1, 5, 1)];
    }
  }

  // ============================ question ============================
  function Question(p) {
    const x = p.p;
    switch (p.scn) {
      case 0:
        return tx(`${N2(x[0])} cm kenarlı kare bir sacın dört köşesinden eş kareler kesilip kenarlar katlanarak üstü açık bir kutu yapılacaktır. Hacmi en büyük yapmak için kesilecek karenin kenarı ne olmalıdır ve en büyük hacim kaç cm³ olur?`,
          `A square sheet of side ${N2(x[0])} cm has equal squares cut from its four corners and the sides are folded up to make an open box. What side length should be cut so that the volume is largest, and what is that largest volume in cm³?`);
      case 1:
        return tx(`Bir duvara yaslanan dikdörtgen bir alan, duvar tarafı çitlenmeden yalnızca üç kenardan ${N2(x[0])} m çitle çevrilecektir. Alanı en büyük yapan boyutlar nedir ve en büyük alan kaç m² olur?`,
          `A rectangular area next to a wall is to be fenced on only three sides (no fence along the wall) using ${N2(x[0])} m of fencing. What dimensions maximise the area, and what is the maximum area in m²?`);
      case 2:
        return tx(`Bir atölyenin kârı (bin TL) üretim miktarına x (yüz adet) bağlı P(x) = ${N2(x[1])}·(3·${N2(x[0])}·x² − x³) ile modelleniyor. Kârı en büyük yapan üretim miktarı nedir ve en büyük kâr kaç bin TL'dir?`,
          `A workshop's profit (thousand TL) depends on output x (hundreds of units) as P(x) = ${N2(x[1])}·(3·${N2(x[0])}·x² − x³). What output gives the largest profit, and what is that profit in thousand TL?`);
      case 3: {
        const m = x[0];
        return tx(`${N2(5 * m)} m boyunda bir merdiven duvara yaslanmıştır; taban duvardan ${N2(3 * m)} m uzaktadır ve ${N2(x[1])} m/s hızla duvardan uzaklaşacak şekilde kaymaktadır. Bu anda merdivenin duvardaki ucu ne hızla aşağı kayıyor?`,
          `A ladder ${N2(5 * m)} m long leans against a wall; its base is ${N2(3 * m)} m from the wall and slides away from the wall at ${N2(x[1])} m/s. How fast is the top of the ladder sliding down the wall at this moment?`);
      }
      case 4:
        return tx(`Bir depodan sızan yağ, dairesel bir leke olarak yayılıyor. Lekenin yarıçapı r = ${N2(x[0])} m iken yarıçap ${N2(x[1])} m/dk hızla artıyor. Bu anda lekenin alanı ne kadar hızla (m²/dk) büyüyor?`,
          `Oil leaking from a storage tank spreads as a circular slick. When the radius is r = ${N2(x[0])} m it is growing at ${N2(x[1])} m/min. How fast (m²/min) is the area of the slick growing at that moment?`);
      case 5: {
        const k = x[0] * x[0] * x[0] + x[0];
        return tx(`Bir akış sisteminin ayar değeri x, x³ + x = ${N2(k)} denklemini sağlamalıdır. Newton yöntemini x₀ = ${N2(x[1])} ile başlatarak x₁ ve x₂ yaklaşımlarını bulun.`,
          `The set-point x of a flow system must satisfy x³ + x = ${N2(k)}. Start Newton's method from x₀ = ${N2(x[1])} and find the approximations x₁ and x₂.`);
      }
      case 6:
        return tx(`Bir titreşim sensörünün çıkışı S(t) = sin(${N2(x[0])}t) ve referans sinyal R(t) = ${N2(x[1])}t'dir. Sensör başlatıldığında (t → 0) S(t)/R(t) oranının limiti nedir? (Doğrudan yerine koymak 0/0 verir.)`,
          `A vibration sensor outputs S(t) = sin(${N2(x[0])}t) and the reference signal is R(t) = ${N2(x[1])}t. What is the limit of the ratio S(t)/R(t) as t → 0 when the sensor starts? (Direct substitution gives 0/0.)`);
      case 7:
        return tx(`Bir kare levhanın alanı ${N2(x[0] * x[0])} cm² iken kenarı ${N2(x[0])} cm'dir. Levha ısıl işlemle genleşip alanı ${N2(x[0] * x[0] + x[1])} cm²'ye çıkıyor. Doğrusal yaklaşımla yeni kenar uzunluğunu tahmin edin ve gerçek değerle karşılaştırın.`,
          `A square plate of area ${N2(x[0] * x[0])} cm² has side ${N2(x[0])} cm. After heat treatment it expands and its area becomes ${N2(x[0] * x[0] + x[1])} cm². Use linear approximation to estimate the new side length and compare it with the true value.`);
      case 8:
        return tx(`Bir araç düz bir yolda s(t) = ${N2(x[0])}t² + ${N2(x[1])}t (metre, t saniye) konum fonksiyonuna göre hareket ediyor. İlk ${N2(x[2])} saniyedeki ortalama hızı bulun ve anlık hızın bu ortalamaya eşit olduğu anı belirleyin.`,
          `A vehicle moves along a straight road with position s(t) = ${N2(x[0])}t² + ${N2(x[1])}t (metres, t in seconds). Find its average speed over the first ${N2(x[2])} seconds and the moment when the instantaneous speed equals this average.`);
      default:
        return tx(`Uzunluğu L = ${N2(x[0])} m olan iki ucundan basit mesnetli bir kirişin düşey çökmesi y(x) = ${N2(x[1])}·(x⁴ − 2Lx³ + L³x)/1000 mm ile modelleniyor (x mesnetten olan uzaklık, 0 ≤ x ≤ L). En büyük çökme nerede oluşur ve kaç mm'dir?`,
          `The vertical deflection of a simply supported beam of length L = ${N2(x[0])} m is modelled by y(x) = ${N2(x[1])}·(x⁴ − 2Lx³ + L³x)/1000 mm (x = distance from a support, 0 ≤ x ≤ L). Where does the largest deflection occur, and how large is it in mm?`);
    }
  }

  // units + physical meaning of the derivative (always shown)
  function Info(p) {
    switch (p.scn) {
      case 0: return tx('Birimler: x ve L cm, V cm³. Türevin anlamı: V\'(x) = kesilen kare büyürken hacmin değişim hızı; hacim tepe noktasında hız 0\'dır (yatay teğet).', 'Units: x and L in cm, V in cm³. Meaning of the derivative: V\'(x) = the rate at which the volume changes as the cut square grows; at the peak the rate is 0 (horizontal tangent).');
      case 1: return tx('Birimler: x, y, F metre, A m². Türevin anlamı: A\'(x) = bir kenarı uzatınca alanın değişim hızı; alanın en büyük olduğu yerde A\'(x) = 0.', 'Units: x, y, F in metres, A in m². Meaning of the derivative: A\'(x) = the rate at which the area changes as one side is lengthened; at the largest area A\'(x) = 0.');
      case 2: return tx('Birimler: x yüz adet, P bin TL. Türevin anlamı: P\'(x) = marjinal kâr (yüz adet daha üretince kârın değişimi); kâr tepesinde marjinal kâr 0\'dır.', 'Units: x in hundreds of units, P in thousand TL. Meaning of the derivative: P\'(x) = marginal profit (change in profit per extra hundred units); at the profit peak the marginal profit is 0.');
      case 3: return tx('Birimler: x, y, L metre, hızlar m/s. Türevin anlamı: bağlı değişim hızları; x ve y zamanla değişir ama x² + y² = L² her an geçerlidir. Eksi işaret = aşağı doğru.', 'Units: x, y, L in metres, rates in m/s. Meaning of the derivative: related rates; x and y change with time but x² + y² = L² holds at every instant. Minus sign = downwards.');
      case 4: return tx('Birimler: r metre, A m², t dakika, dA/dt m²/dk. Türevin anlamı: alanın zamanla artış hızı; yarıçap üzerinden zincirleme etki (dA/dt = 2πr·dr/dt).', 'Units: r in metres, A in m², t in minutes, dA/dt in m²/min. Meaning of the derivative: how fast the area grows with time, passed on through the radius (dA/dt = 2πr·dr/dt).');
      case 5: return tx('Birimler: x ayar değeri (birimsiz), f(x) denklemin sol tarafı eksi k. Türevin anlamı: f\'(x) teğetin eğimi; Newton adımı teğetin x eksenini kestiği yeri yeni tahmin yapar.', 'Units: x is the set-point (unitless), f(x) is the left side minus k. Meaning of the derivative: f\'(x) is the slope of the tangent; a Newton step takes where the tangent meets the x-axis as the new guess.');
      case 6: return tx('Birimler: t saniye, S ve R sinyal birimi, oran birimsiz. Türevin anlamı: pay ve paydanın değişim hızlarının oranı; 0/0 durumunda limiti bu oran belirler.', 'Units: t in seconds, S and R in signal units, the ratio is unitless. Meaning of the derivative: the ratio of the rates of change of numerator and denominator; in a 0/0 case this ratio determines the limit.');
      case 7: return tx('Birimler: A cm², kenar cm. Türevin anlamı: f\'(a) = √A fonksiyonunun a noktasındaki eğimi; doğrusal yaklaşım f(a) + f\'(a)·ΔA ile bu eğimi kullanır.', 'Units: A in cm², side in cm. Meaning of the derivative: f\'(a) = the slope of √A at the point a; linear approximation f(a) + f\'(a)·ΔA uses this slope.');
      case 8: return tx('Birimler: s metre, t saniye, hız m/s. Türevin anlamı: s\'(t) anlık hız (teğet eğimi), (s(T) − s(0))/T ortalama hız (kesen eğimi); ODT ikisinin eşit olduğu bir an garanti eder.', 'Units: s in metres, t in seconds, speed in m/s. Meaning of the derivative: s\'(t) is the instantaneous speed (tangent slope), (s(T) − s(0))/T is the average speed (secant slope); the MVT guarantees a moment when they are equal.');
      default: return tx('Birimler: x ve L metre, y mm. Türevin anlamı: y\'(x) kirişin eğimi (çökme eğrisinin teğeti); en büyük çökmede eğim 0\'dır (yatay teğet).', 'Units: x and L in metres, y in mm. Meaning of the derivative: y\'(x) is the slope of the deflection curve; at the largest deflection the slope is 0 (horizontal tangent).');
    }
  }

  // ============================ meaning ============================
  function Meaning(p) {
    switch (p.scn) {
      case 0:
        return tx("'Hacmi en büyük yap' bir OPTİMİZASYON sorusudur: hacmi kesilen karenin kenarı x'e bağlı tek değişkenli bir fonksiyon olarak yazarız ve bu fonksiyonun en büyük değerini ararız. " +
          'Türevlenebilir bir fonksiyonun en büyük değeri ya kritik noktada (V\'(x) = 0) ya da tanım aralığının uçlarında olur. ' +
          "Matematiksel istek: V(x) = x(L − 2x)² fonksiyonunu 0 < x < L/2 üzerinde maksimum yapan x'i ve V'nin o noktadaki değerini bul.",
          "'Make the volume largest' is an OPTIMIZATION question: write the volume as a function of one variable, the side x of the cut square, and look for its largest value. " +
          'A differentiable function attains its largest value either at a critical point (V\'(x) = 0) or at an end of its domain. ' +
          'Mathematical task: find the x that maximises V(x) = x(L − 2x)² on 0 < x < L/2 and the value of V there.');
      case 1:
        return tx('Alan, çitin iki farklı kenarına bağlıdır ama çit uzunluğu SABİTTİR; bu sabit uzunluk bir KISIT denklemidir. Kısıt ile bir değişkeni diğerine bağlayıp alanı tek değişkene indirgeriz. ' +
          "Sonra 'alan en büyük' demek, bu tek değişkenli fonksiyonun maksimumunu bulmak demektir: türev sıfır olan nokta. " +
          "Matematiksel istek: A(x) = x(F − 2x) fonksiyonunun maksimumunu bul.",
          'The area depends on two sides, but the fence length is FIXED; this fixed length is a CONSTRAINT equation. We use the constraint to express one variable through the other and reduce the area to one variable. ' +
          "Then 'largest area' means the maximum of this one-variable function: the point where the derivative is zero. " +
          'Mathematical task: find the maximum of A(x) = x(F − 2x).');
      case 2:
        return tx("Kâr, üretim arttıkça önce yükselir sonra düşer (kübik bir eğri). 'Kârı en büyük yapan üretim' eğrinin tepe noktasıdır ve orada teğet yataydır: P'(x) = 0. " +
          'Ancak P\' = 0 olan her nokta maksimum değildir; minimum da olabilir. Bu yüzden ikinci türev testiyle ayırt etmek gerekir. ' +
          "Matematiksel istek: P'(x) = 0'ı çöz, P''(x) işaretiyle maksimumu seç, P'yi o noktada hesapla.",
          "Profit first rises and then falls as output grows (a cubic curve). 'The output with the largest profit' is the peak of the curve, where the tangent is horizontal: P'(x) = 0. " +
          'But not every point with P\' = 0 is a maximum; it may be a minimum. So we need the second derivative test to tell them apart. ' +
          "Mathematical task: solve P'(x) = 0, choose the maximum using the sign of P''(x), and evaluate P there.");
      case 3:
        return tx('Taban ile duvar ucu aynı anda değişir ama merdiven boyu SABİTTİR: x² + y² = L². Bu bağıntı zamanla değişen iki niceliği birbirine bağlar. ' +
          "İlişkili değişim sorusunda her iki tarafın t'ye göre türevi alınır (zincir kuralı); böylece bilinen hız dx/dt ile istenen hız dy/dt arasında bir denklem kurulur. " +
          "Matematiksel istek: x² + y² = L²'yi t'ye göre türet, sorulan andaki x, y, dx/dt'yi yerleştirip dy/dt'yi çöz. (Eksi işaret 'aşağı' demektir.)",
          'The base and the top move together, but the ladder length is FIXED: x² + y² = L². This relation ties two changing quantities together. ' +
          'In a related-rates problem we differentiate both sides with respect to t (chain rule), which gives an equation between the known rate dx/dt and the wanted rate dy/dt. ' +
          "Mathematical task: differentiate x² + y² = L² in t, insert x, y, dx/dt at the given moment and solve for dy/dt. (A minus sign means 'downwards'.)");
      case 4:
        return tx('Alan yarıçapa bağlıdır (A = πr²) ve yarıçap zamanla değişir; dolayısıyla alan da zamanla değişir. Bu bir İLİŞKİLİ DEĞİŞİM sorusudur: A(t) = π·r(t)². ' +
          "'Alan ne kadar hızla büyüyor?' sorusu dA/dt'yi ister; bunu zincir kuralıyla dA/dt = (dA/dr)·(dr/dt) olarak buluruz. " +
          "Matematiksel istek: A = πr²'yi t'ye göre türet ve sorulan andaki r ile dr/dt'yi yerleştir.",
          'The area depends on the radius (A = πr²) and the radius changes with time, so the area changes with time too. This is a RELATED-RATES question: A(t) = π·r(t)². ' +
          "'How fast is the area growing?' asks for dA/dt, which we get with the chain rule as dA/dt = (dA/dr)·(dr/dt). " +
          'Mathematical task: differentiate A = πr² in t and insert the current r and dr/dt.');
      case 5:
        return tx('Denklem x³ + x = k elle çözülemeyecek kadar zor olabilir; bunun yerine kökü SAYISAL olarak yaklaşık buluruz. Önce her şeyi bir tarafa alıp f(x) = x³ + x − k = 0 yazarız. ' +
          'Newton yöntemi, eğriye x₀\'da çizilen TEĞETİN x eksenini kestiği noktayı yeni tahmin yapar: xₙ₊₁ = xₙ − f(xₙ)/f\'(xₙ). Bu adım tekrarlandıkça tahmin köke hızla yaklaşır. ' +
          "Matematiksel istek: f ve f'yi yaz, formülü iki kez uygula.",
          'The equation x³ + x = k may be too hard to solve by hand; instead we find the root NUMERICALLY. First move everything to one side: f(x) = x³ + x − k = 0. ' +
          "Newton's method takes the point where the TANGENT at x₀ meets the x-axis as the new guess: xₙ₊₁ = xₙ − f(xₙ)/f'(xₙ). Repeating this makes the guess approach the root quickly. " +
          "Mathematical task: write f and f', apply the formula twice.");
      case 6:
        return tx("t = 0'da hem pay hem payda sıfırdır: 0/0 BELİRSİZ biçimi. Bu, limitin yok olduğu anlamına gelmez; oranın t → 0'da yaklaştığı bir değer olabilir. " +
          "L'Hôpital kuralı: 0/0 biçiminde limit, pay ve paydanın TÜREVLERİNİN oranının limitine eşittir (yeter ki o limit var olsun). " +
          "Matematiksel istek: lim S/R için önce 0/0 olduğunu doğrula, sonra S'/R' oranının limitini hesapla.",
          "At t = 0 both numerator and denominator are zero: an INDETERMINATE 0/0 form. This does not mean the limit does not exist; the ratio may approach some value as t → 0. " +
          "L'Hôpital's rule: a 0/0 limit equals the limit of the ratio of the DERIVATIVES of numerator and denominator (provided that limit exists). " +
          "Mathematical task: for lim S/R first check that it is 0/0, then evaluate the limit of S'/R'.");
      case 7:
        return tx('Kenar uzunluğu, alanın karekökü: s = √A. A\'nın değeri bilinen bir tam kare civarında az değiştiğinde, √ fonksiyonunu o noktadaki TEĞET DOĞRUSUYLA yaklaşık hesaplarız: f(x) ≈ f(a) + f\'(a)(x − a). ' +
          'Teğet doğrusu, küçük değişimler için eğriye çok yakındır ve zor bir karekökü basit bir toplamaya çevirir. ' +
          'Matematiksel istek: f(x) = √x için a = tam kare noktasında doğrusallaştırmayı kur, yeni alanı yerleştir, gerçek √ ile karşılaştır.',
          "The side length is the square root of the area: s = √A. When A changes only a little from a known perfect square, we approximate √ by its TANGENT LINE at that point: f(x) ≈ f(a) + f'(a)(x − a). " +
          'For small changes the tangent line is very close to the curve and turns a hard square root into a simple addition. ' +
          'Mathematical task: for f(x) = √x build the linearisation at the perfect-square point, insert the new area, compare with the true √.');
      case 8:
        return tx("ORTALAMA hız, toplam yer değiştirmenin süreye bölümüdür: (s(T) − s(0))/T; bu, iki nokta arasındaki KESEN doğrunun eğimidir. ANLIK hız ise s'(t), yani teğetin eğimidir. " +
          "Ortalama Değer Teoremi, s sürekli ve türevlenebilirse aralıkta en az bir c anında teğet eğiminin kesen eğimine eşit olduğunu söyler: s'(c) = (s(T) − s(0))/T. " +
          "Matematiksel istek: kesen eğimini hesapla, s'(c) = bu değer denklemini çöz.",
          "The AVERAGE speed is total displacement divided by time: (s(T) − s(0))/T; this is the slope of the SECANT line between two points. The INSTANTANEOUS speed is s'(t), the slope of the tangent. " +
          "The Mean Value Theorem says that if s is continuous and differentiable, then at least one moment c in the interval has tangent slope equal to the secant slope: s'(c) = (s(T) − s(0))/T. " +
          "Mathematical task: compute the secant slope, then solve s'(c) = that value.");
      default:
        return tx("'En büyük çökme' fonksiyonun en büyük değeridir. Kapalı [0, L] aralığında sürekli bir fonksiyonun en büyüğü kritik noktada ya da uçlarda olur; burada uçlarda (mesnetlerde) çökme sıfırdır. " +
          "Kritik nokta y'(x) = 0 denkleminin aralık içindeki çözümüdür (eğim sıfır, yatay teğet). Hangi çözümlerin aralığın içinde olduğunu kontrol etmek gerekir. " +
          "Matematiksel istek: y'(x) = 0'ı çöz, aralık içindeki kökü seç, y''(x) veya uç değerlerle maksimum olduğunu doğrula, y'yi hesapla.",
          "'Largest deflection' is the largest value of the function. On a closed interval [0, L] a continuous function has its largest value at a critical point or at an end; here the deflection is zero at the ends (the supports). " +
          "A critical point is a solution of y'(x) = 0 inside the interval (zero slope, horizontal tangent). We must check which solutions actually lie inside the interval. " +
          "Mathematical task: solve y'(x) = 0, pick the root inside the interval, confirm it is a maximum with y''(x) or the end values, then evaluate y.");
    }
  }

  // ============================ steps ============================
  function Steps(problem) {
    const x = problem.p;
    const s = [];
    const add = (a, b) => s.push(tx(a, b));
    switch (problem.scn) {
      case 0: {
        const L = x[0], c = L / 6, vmax = 2 * L * L * L / 27;
        add(`Değişkenler: x = kesilen karenin kenarı (cm), V = kutunun hacmi (cm³). Sac kenarı L = ${N2(L)} cm sabittir.`, `Variables: x = side of the cut square (cm), V = volume of the box (cm³). The sheet side L = ${N2(L)} cm is fixed.`);
        add('Katlanınca kutunun tabanı (L − 2x) × (L − 2x), yüksekliği x olur.', 'After folding, the base is (L − 2x) by (L − 2x) and the height is x.');
        add(`Hedef fonksiyon: V(x) = x(L − 2x)² = x(${N2(L)} − 2x)². Tek değişken var, ayrı bir kısıt gerekmez.`, `Objective: V(x) = x(L − 2x)² = x(${N2(L)} − 2x)². There is one variable, so no separate constraint is needed.`);
        add(`Tanım aralığı: x > 0 ve L − 2x > 0, yani 0 < x < ${N2(L / 2)}.`, `Domain: x > 0 and L − 2x > 0, i.e. 0 < x < ${N2(L / 2)}.`);
        add(`Türev (çarpım kuralı): V'(x) = (L − 2x)² − 4x(L − 2x) = (L − 2x)(L − 6x). Yani V' = 0 ⇒ x = ${N2(L / 2)} veya x = ${N2(c)}.`, `Derivative (product rule): V'(x) = (L − 2x)² − 4x(L − 2x) = (L − 2x)(L − 6x). So V' = 0 ⇒ x = ${N2(L / 2)} or x = ${N2(c)}.`);
        add(`x = ${N2(L / 2)} aralığın ucudur (taban 0, V = 0), aday değil. Aralık içindeki tek aday x = ${N2(c)}.`, `x = ${N2(L / 2)} is the end of the domain (base 0, V = 0), not a candidate. The only interior candidate is x = ${N2(c)}.`);
        add(`Doğrulama: V'' = 24x − 8L; x = ${N2(c)} için V'' = ${N2(24 * c - 8 * L)} < 0 ⇒ MAKSİMUM. Uçlarda V = 0, yani daha küçük.`, `Verify: V'' = 24x − 8L; at x = ${N2(c)} V'' = ${N2(24 * c - 8 * L)} < 0 ⇒ MAXIMUM. At the ends V = 0, which is smaller.`);
        add(`Hacim: taban = ${N2(L - 2 * c)} cm, yükseklik = ${N2(c)} cm ⇒ V = ${N2(L - 2 * c)}²·${N2(c)} = ${N2(vmax)} cm³ (= 2L³/27).`, `Volume: base = ${N2(L - 2 * c)} cm, height = ${N2(c)} cm ⇒ V = ${N2(L - 2 * c)}²·${N2(c)} = ${N2(vmax)} cm³ (= 2L³/27).`);
        add('Yorum: köşelerden sac kenarının 1/6\'sı kesilmelidir; daha küçük kesimde yükseklik, daha büyükte taban çok küçülür. Grafikte sarı nokta tepe noktasıdır.', 'Interpretation: cut one sixth of the sheet side from each corner; a smaller cut gives too little height, a larger one too small a base. The yellow point on the graph is the peak.');
        break;
      }
      case 1: {
        const f = x[0], w = f / 4, amax = f * f / 8;
        add('Değişkenler: x = duvara dik iki kenardan her birinin uzunluğu (m), y = duvara paralel kenar (m), A = alan (m²).', 'Variables: x = length of each of the two sides perpendicular to the wall (m), y = the side parallel to the wall (m), A = area (m²).');
        add(`Kısıt (çit uzunluğu sabit): 2x + y = ${N2(f)}.`, `Constraint (fixed fence length): 2x + y = ${N2(f)}.`);
        add('Hedef: A = x·y (en büyük olacak).', 'Objective: A = x·y (to be maximised).');
        add(`Kısıttan y = ${N2(f)} − 2x; yerine koy: A(x) = x(${N2(f)} − 2x) = ${N2(f)}x − 2x².`, `From the constraint y = ${N2(f)} − 2x; substitute: A(x) = x(${N2(f)} − 2x) = ${N2(f)}x − 2x².`);
        add(`Tanım aralığı: x > 0 ve y > 0 ⇒ 0 < x < ${N2(f / 2)}.`, `Domain: x > 0 and y > 0 ⇒ 0 < x < ${N2(f / 2)}.`);
        add(`Türev: A'(x) = ${N2(f)} − 4x = 0 ⇒ x = ${N2(w)} m.`, `Derivative: A'(x) = ${N2(f)} − 4x = 0 ⇒ x = ${N2(w)} m.`);
        add(`Doğrulama: A'' = −4 < 0 ⇒ MAKSİMUM. Uçlarda (x = 0 ve x = ${N2(f / 2)}) A = 0.`, `Verify: A'' = −4 < 0 ⇒ MAXIMUM. At the ends (x = 0 and x = ${N2(f / 2)}) A = 0.`);
        add(`Boyutlar: x = ${N2(w)} m, y = ${N2(f)} − ${N2(2 * w)} = ${N2(f - 2 * w)} m; A = ${N2(w)}·${N2(f - 2 * w)} = ${N2(amax)} m².`, `Dimensions: x = ${N2(w)} m, y = ${N2(f)} − ${N2(2 * w)} = ${N2(f - 2 * w)} m; A = ${N2(w)}·${N2(f - 2 * w)} = ${N2(amax)} m².`);
        add('Yorum: duvara paralel kenar, dik kenarların iki katı olmalıdır (y = 2x).', 'Interpretation: the side along the wall must be twice each perpendicular side (y = 2x).');
        break;
      }
      case 2: {
        const a = x[0], k = x[1];
        add(`Model: P(x) = ${N2(k)}(3·${N2(a)}·x² − x³) = ${N2(k)}(${N2(3 * a)}x² − x³). x ≥ 0 (yüz adet).`, `Model: P(x) = ${N2(k)}(3·${N2(a)}·x² − x³) = ${N2(k)}(${N2(3 * a)}x² − x³). x ≥ 0 (hundreds of units).`);
        add(`Anlamlı bölge: P ≥ 0 ⇒ x ≤ ${N2(3 * a)} (sonrasında zarar).`, `Meaningful region: P ≥ 0 ⇒ x ≤ ${N2(3 * a)} (beyond that there is a loss).`);
        add(`Birinci türev: P'(x) = ${N2(k)}(${N2(6 * a)}x − 3x²) = ${N2(3 * k)}x(${N2(2 * a)} − x).`, `First derivative: P'(x) = ${N2(k)}(${N2(6 * a)}x − 3x²) = ${N2(3 * k)}x(${N2(2 * a)} − x).`);
        add(`P' = 0 ⇒ x = 0 veya x = ${N2(2 * a)} (kritik noktalar).`, `P' = 0 ⇒ x = 0 or x = ${N2(2 * a)} (critical points).`);
        add(`İkinci türev: P''(x) = ${N2(k)}(${N2(6 * a)} − 6x).`, `Second derivative: P''(x) = ${N2(k)}(${N2(6 * a)} − 6x).`);
        add(`x = 0: P'' = ${N2(6 * a * k)} > 0 ⇒ yerel MİNİMUM (P = 0). x = ${N2(2 * a)}: P'' = ${N2(-6 * a * k)} < 0 ⇒ yerel MAKSİMUM.`, `x = 0: P'' = ${N2(6 * a * k)} > 0 ⇒ local MINIMUM (P = 0). x = ${N2(2 * a)}: P'' = ${N2(-6 * a * k)} < 0 ⇒ local MAXIMUM.`);
        add(`İşaret kontrolü: P' = ${N2(3 * k)}x(${N2(2 * a)} − x) x = ${N2(2 * a)}'de + iken − olur (artıştan azalışa).`, `Sign check: P' = ${N2(3 * k)}x(${N2(2 * a)} − x) changes from + to − at x = ${N2(2 * a)} (from increasing to decreasing).`);
        add(`Değer: P(${N2(2 * a)}) = ${N2(k)}·(${N2(12 * a * a * a)} − ${N2(8 * a * a * a)}) = ${N2(4 * k * a * a * a)} bin TL.`, `Value: P(${N2(2 * a)}) = ${N2(k)}·(${N2(12 * a * a * a)} − ${N2(8 * a * a * a)}) = ${N2(4 * k * a * a * a)} thousand TL.`);
        add(`Yorum: en iyi üretim ${N2(200 * a)} adet; daha fazla üretmek maliyet artışı nedeniyle kârı DÜŞÜRÜR.`, `Interpretation: the best output is ${N2(200 * a)} units; producing more LOWERS profit because costs grow faster.`);
        break;
      }
      case 3: {
        const m = x[0], v = x[1];
        const bx = 3 * m, hy = 4 * m, ll = 5 * m;
        add(`Değişkenler: x = taban–duvar uzaklığı, y = merdiven ucunun yüksekliği, L = ${N2(ll)} m sabit. Zamanla x ve y değişir.`, `Variables: x = base-to-wall distance, y = height of the ladder top, L = ${N2(ll)} m fixed. Both x and y change with time.`);
        add(`Bilinenler: x = ${N2(bx)} m, dx/dt = ${N2(v)} m/s. İstenen: dy/dt.`, `Known: x = ${N2(bx)} m, dx/dt = ${N2(v)} m/s. Wanted: dy/dt.`);
        add(`Bağıntı (Pisagor): x² + y² = ${N2(ll * ll)}.`, `Relation (Pythagoras): x² + y² = ${N2(ll * ll)}.`);
        add(`Sorulan andaki y: y = √(${N2(ll * ll)} − ${N2(bx * bx)}) = √${N2(hy * hy)} = ${N2(hy)} m.`, `y at this moment: y = √(${N2(ll * ll)} − ${N2(bx * bx)}) = √${N2(hy * hy)} = ${N2(hy)} m.`);
        add('t\'ye göre türet (zincir kuralı): 2x·(dx/dt) + 2y·(dy/dt) = 0 (sağ taraf sabit ⇒ 0).', 'Differentiate in t (chain rule): 2x·(dx/dt) + 2y·(dy/dt) = 0 (constant right side ⇒ 0).');
        add('dy/dt\'yi çöz: dy/dt = −(x/y)·(dx/dt).', 'Solve for dy/dt: dy/dt = −(x/y)·(dx/dt).');
        add(`Değerleri koy: dy/dt = −(${N2(bx)}/${N2(hy)})·${N2(v)} = ${N2(-0.75 * v)} m/s.`, `Insert the values: dy/dt = −(${N2(bx)}/${N2(hy)})·${N2(v)} = ${N2(-0.75 * v)} m/s.`);
        add(`Yorum: eksi işaret ucun AŞAĞI indiğini gösterir; hız ${N2(0.75 * v)} m/s.`, `Interpretation: the minus sign means the top moves DOWN; its speed is ${N2(0.75 * v)} m/s.`);
        add('Kontrol: taban duvardan uzaklaştıkça x/y büyür, yani uç giderek DAHA hızlı düşer (x → L iken hız sonsuza gider). Grafikte eğim −x/y\'dir.', 'Check: as the base moves out x/y grows, so the top falls FASTER and faster (the speed tends to infinity as x → L). On the graph the slope is −x/y.');
        break;
      }
      case 4: {
        const r = x[0], v = x[1];
        add('Değişkenler: r(t) = leke yarıçapı (m), A(t) = leke alanı (m²), t = dakika.', 'Variables: r(t) = slick radius (m), A(t) = slick area (m²), t = minutes.');
        add(`Bilinenler: r = ${N2(r)} m, dr/dt = ${N2(v)} m/dk. İstenen: dA/dt.`, `Known: r = ${N2(r)} m, dr/dt = ${N2(v)} m/min. Wanted: dA/dt.`);
        add('Bağıntı: A = πr².', 'Relation: A = πr².');
        add('t\'ye göre türet (zincir kuralı): dA/dt = 2πr·(dr/dt).', 'Differentiate in t (chain rule): dA/dt = 2πr·(dr/dt).');
        add(`Değerleri koy: dA/dt = 2π·${N2(r)}·${N2(v)}.`, `Insert the values: dA/dt = 2π·${N2(r)}·${N2(v)}.`);
        add(`Sayıyı hesapla: 2·${N2(r)}·${N2(v)} = ${N2(2 * r * v)} ⇒ dA/dt = ${N2(2 * r * v)}π ≈ ${N2(2 * r * v * PI)} m²/dk.`, `Compute: 2·${N2(r)}·${N2(v)} = ${N2(2 * r * v)} ⇒ dA/dt = ${N2(2 * r * v)}π ≈ ${N2(2 * r * v * PI)} m²/min.`);
        add(`Şu anki alan: A = π·${N2(r)}² = ${N2(PI * r * r)} m².`, `Current area: A = π·${N2(r)}² = ${N2(PI * r * r)} m².`);
        add('Yorum: yarıçap sabit hızla artsa da alan büyüme hızı r ile ORANTILI artar; leke büyüdükçe kirlenen alan giderek daha hızlı genişler (grafikte teğet eğimi 2πr).', 'Interpretation: even with a constant radius speed, the area growth rate grows in PROPORTION to r; the bigger the slick, the faster the contaminated area spreads (tangent slope 2πr on the graph).');
        break;
      }
      case 5: {
        const r = x[0], x0 = x[1], k = r * r * r + r;
        const f0 = x0 * x0 * x0 + x0 - k, d0 = 3 * x0 * x0 + 1;
        const x1 = x0 - f0 / d0;
        const f1 = x1 * x1 * x1 + x1 - k, d1 = 3 * x1 * x1 + 1;
        const x2 = x1 - f1 / d1;
        add(`Denklemi sıfıra eşitle: f(x) = x³ + x − ${N2(k)} = 0.`, `Move to zero form: f(x) = x³ + x − ${N2(k)} = 0.`);
        add("Türev: f'(x) = 3x² + 1 (her zaman ≥ 1, yani sıfıra bölme riski yok).", "Derivative: f'(x) = 3x² + 1 (always ≥ 1, so no risk of division by zero).");
        add(`Newton formülü: xₙ₊₁ = xₙ − (xₙ³ + xₙ − ${N2(k)}) / (3xₙ² + 1).`, `Newton's formula: xₙ₊₁ = xₙ − (xₙ³ + xₙ − ${N2(k)}) / (3xₙ² + 1).`);
        add(`x₀ = ${N2(x0)}: f(x₀) = ${F4(f0)}, f'(x₀) = ${F4(d0)}.`, `x₀ = ${N2(x0)}: f(x₀) = ${F4(f0)}, f'(x₀) = ${F4(d0)}.`);
        add(`x₁ = ${N2(x0)} − (${F4(f0)}) / ${F4(d0)} = ${F4(x1)}.`, `x₁ = ${N2(x0)} − (${F4(f0)}) / ${F4(d0)} = ${F4(x1)}.`);
        add(`x₁ için: f(x₁) = ${F4(f1)}, f'(x₁) = ${F4(d1)}.`, `At x₁: f(x₁) = ${F4(f1)}, f'(x₁) = ${F4(d1)}.`);
        add(`x₂ = ${F4(x1)} − (${F4(f1)}) / ${F4(d1)} = ${F4(x2)}.`, `x₂ = ${F4(x1)} − (${F4(f1)}) / ${F4(d1)} = ${F4(x2)}.`);
        add(`Kontrol: gerçek kök x = ${N2(r)} (çünkü ${N2(r)}³ + ${N2(r)} = ${N2(k)}). Hata: |x₂ − ${N2(r)}| = ${F4(Math.abs(x2 - r))}.`, `Check: the true root is x = ${N2(r)} (since ${N2(r)}³ + ${N2(r)} = ${N2(k)}). Error: |x₂ − ${N2(r)}| = ${F4(Math.abs(x2 - r))}.`);
        add('Yorum: her adımda hata kabaca karesel küçülür (basamak sayısı ikiye katlanır); grafikte x₀\'daki teğet x eksenini x₁\'de keser.', 'Interpretation: each step roughly squares the error (correct digits about double); on the graph the tangent at x₀ meets the x-axis at x₁.');
        break;
      }
      case 6: {
        const a = x[0], b = x[1];
        add(`Oran: S(t)/R(t) = sin(${N2(a)}t) / (${N2(b)}t).`, `Ratio: S(t)/R(t) = sin(${N2(a)}t) / (${N2(b)}t).`);
        add(`t → 0: pay sin(0) = 0 ve payda ${N2(b)}·0 = 0 ⇒ 0/0 belirsizliği.`, `As t → 0: numerator sin(0) = 0 and denominator ${N2(b)}·0 = 0 ⇒ 0/0 indeterminate form.`);
        add(`L'Hôpital koşulları: iki fonksiyon da türevlenebilir ve payda türevi ${N2(b)} ≠ 0.`, `L'Hôpital conditions: both functions are differentiable and the denominator derivative ${N2(b)} ≠ 0.`);
        add(`Payın türevi (zincir kuralı): d/dt sin(${N2(a)}t) = ${N2(a)}cos(${N2(a)}t).`, `Numerator derivative (chain rule): d/dt sin(${N2(a)}t) = ${N2(a)}cos(${N2(a)}t).`);
        add(`Paydanın türevi: d/dt (${N2(b)}t) = ${N2(b)}.`, `Denominator derivative: d/dt (${N2(b)}t) = ${N2(b)}.`);
        add(`Yeni oran: lim ${N2(a)}cos(${N2(a)}t) / ${N2(b)}.`, `New ratio: lim ${N2(a)}cos(${N2(a)}t) / ${N2(b)}.`);
        add(`t → 0 için cos(0) = 1: limit = ${N2(a)}·1 / ${N2(b)} = ${N2(a)}/${N2(b)} = ${F4(a / b)}.`, `As t → 0, cos(0) = 1: limit = ${N2(a)}·1 / ${N2(b)} = ${N2(a)}/${N2(b)} = ${F4(a / b)}.`);
        add(`Yorum: t = 0'da oran tanımsızdır (grafikte boşluk) ama sensör başlarken oran ${F4(a / b)} değerine yaklaşır. Bu, sin θ ≈ θ (küçük açı) ile uyumludur.`, `Interpretation: at t = 0 the ratio is undefined (a gap on the graph) but as the sensor starts the ratio tends to ${F4(a / b)}. This agrees with sin θ ≈ θ for small angles.`);
        break;
      }
      case 7: {
        const a = x[0], d = x[1], area = a * a + d;
        const approx = a + d / (2 * a), tr = Math.sqrt(area);
        add(`Model: kenar s = f(A) = √A. Bilinen tam kare: a² = ${N2(a * a)} (√ = ${N2(a)}).`, `Model: side s = f(A) = √A. Known perfect square: a² = ${N2(a * a)} (√ = ${N2(a)}).`);
        add('Doğrusallaştırma: L(A) = f(a²) + f\'(a²)(A − a²).', 'Linearisation: L(A) = f(a²) + f\'(a²)(A − a²).');
        add(`Türev: f'(A) = 1/(2√A) ⇒ f'(${N2(a * a)}) = 1/(2·${N2(a)}) = 1/${N2(2 * a)}.`, `Derivative: f'(A) = 1/(2√A) ⇒ f'(${N2(a * a)}) = 1/(2·${N2(a)}) = 1/${N2(2 * a)}.`);
        add(`L(A) = ${N2(a)} + (A − ${N2(a * a)})/${N2(2 * a)}.`, `L(A) = ${N2(a)} + (A − ${N2(a * a)})/${N2(2 * a)}.`);
        add(`Yeni alan A = ${N2(area)}: değişim ΔA = ${N2(d)} cm² (küçük, yaklaşım güvenilir).`, `New area A = ${N2(area)}: the change is ΔA = ${N2(d)} cm² (small, so the approximation is reliable).`);
        add(`Yerine koy: L(${N2(area)}) = ${N2(a)} + ${N2(d)}/${N2(2 * a)} = ${N2(a)} + ${F4(d / (2 * a))}.`, `Substitute: L(${N2(area)}) = ${N2(a)} + ${N2(d)}/${N2(2 * a)} = ${N2(a)} + ${F4(d / (2 * a))}.`);
        add(`Tahmin: s ≈ ${F4(approx)} cm.`, `Estimate: s ≈ ${F4(approx)} cm.`);
        add(`Gerçek değer: √${N2(area)} = ${F4(tr)} cm. Hata = ${F4(approx - tr)} cm (yaklaşım biraz fazla, çünkü √ konkavdır ve teğet eğrinin ÜSTÜNDEDİR).`, `True value: √${N2(area)} = ${F4(tr)} cm. Error = ${F4(approx - tr)} cm (slight overestimate because √ is concave and the tangent lies ABOVE the curve).`);
        add('Yorum: ΔA küçük kaldıkça hata çok küçüktür; mühendislikte ölçüm belirsizliğinden bile küçük olabilir.', 'Interpretation: while ΔA stays small the error is tiny, often smaller than the measurement uncertainty in engineering.');
        break;
      }
      case 8: {
        const a = x[0], b = x[1], t = x[2];
        const sT = a * t * t + b * t, avg = a * t + b;
        add(`s(t) = ${N2(a)}t² + ${N2(b)}t polinomdur: her yerde sürekli ve türevlenebilir ⇒ ODT koşulları sağlanır.`, `s(t) = ${N2(a)}t² + ${N2(b)}t is a polynomial: continuous and differentiable everywhere ⇒ the MVT conditions hold.`);
        add(`Uç değerler: s(0) = 0, s(${N2(t)}) = ${N2(a)}·${N2(t * t)} + ${N2(b)}·${N2(t)} = ${N2(sT)} m.`, `End values: s(0) = 0, s(${N2(t)}) = ${N2(a)}·${N2(t * t)} + ${N2(b)}·${N2(t)} = ${N2(sT)} m.`);
        add(`Ortalama hız: (s(${N2(t)}) − s(0))/${N2(t)} = ${N2(sT)}/${N2(t)} = ${N2(avg)} m/s.`, `Average speed: (s(${N2(t)}) − s(0))/${N2(t)} = ${N2(sT)}/${N2(t)} = ${N2(avg)} m/s.`);
        add(`Anlık hız: s'(t) = ${N2(2 * a)}t + ${N2(b)}.`, `Instantaneous speed: s'(t) = ${N2(2 * a)}t + ${N2(b)}.`);
        add(`ODT: s'(c) = ortalama hız ⇒ ${N2(2 * a)}c + ${N2(b)} = ${N2(avg)}.`, `MVT: s'(c) = average speed ⇒ ${N2(2 * a)}c + ${N2(b)} = ${N2(avg)}.`);
        add(`${N2(b)}'yi çıkar: ${N2(2 * a)}c = ${N2(a * t)}.`, `Subtract ${N2(b)}: ${N2(2 * a)}c = ${N2(a * t)}.`);
        add(`c = ${N2(a * t)} / ${N2(2 * a)} = ${N2(t / 2)} s.`, `c = ${N2(a * t)} / ${N2(2 * a)} = ${N2(t / 2)} s.`);
        add(`Kontrol: c = ${N2(t / 2)} aralığın (0, ${N2(t)}) içindedir ✓ ve s'(${N2(t / 2)}) = ${N2(2 * a * t / 2 + b)} = ortalama ✓.`, `Check: c = ${N2(t / 2)} lies inside (0, ${N2(t)}) ✓ and s'(${N2(t / 2)}) = ${N2(2 * a * t / 2 + b)} = the average ✓.`);
        add('Yorum: sabit ivmeli harekette anlık hız, ilk ve son hızın ortasında olduğu için tam süre ortasında ortalamaya eşittir. Grafikte teğet (kesikli) kesene paraleldir.', 'Interpretation: with constant acceleration the speed is the mean of the first and last speed, so it equals the average exactly at mid-time. On the graph the tangent (dashed) is parallel to the secant.');
        break;
      }
      default: {
        const L = x[0], k = x[1];
        const ymax = 5 * k * L * L * L * L / 16000;
        add(`Model: y(x) = ${N2(k)}·(x⁴ − 2·${N2(L)}x³ + ${N2(L * L * L)}x)/1000, 0 ≤ x ≤ ${N2(L)}.`, `Model: y(x) = ${N2(k)}·(x⁴ − 2·${N2(L)}x³ + ${N2(L * L * L)}x)/1000, 0 ≤ x ≤ ${N2(L)}.`);
        add(`Uçlar: y(0) = 0 ve y(${N2(L)}) = 0 (mesnetlerde çökme yok).`, `Ends: y(0) = 0 and y(${N2(L)}) = 0 (no deflection at the supports).`);
        add(`Türev: y'(x) = ${N2(k)}·(4x³ − 6·${N2(L)}x² + ${N2(L * L * L)})/1000.`, `Derivative: y'(x) = ${N2(k)}·(4x³ − 6·${N2(L)}x² + ${N2(L * L * L)})/1000.`);
        add('Çarpanlara ayır: 4x³ − 6Lx² + L³ = (2x − L)(2x² − 2Lx − L²).', 'Factor: 4x³ − 6Lx² + L³ = (2x − L)(2x² − 2Lx − L²).');
        add(`y' = 0 ⇒ x = L/2 = ${N2(L / 2)} m veya 2x² − 2Lx − L² = 0 ⇒ x = L(1 ± √3)/2 ≈ ${N2(L * (1 - Math.sqrt(3)) / 2)} ya da ${N2(L * (1 + Math.sqrt(3)) / 2)}.`, `y' = 0 ⇒ x = L/2 = ${N2(L / 2)} m or 2x² − 2Lx − L² = 0 ⇒ x = L(1 ± √3)/2 ≈ ${N2(L * (1 - Math.sqrt(3)) / 2)} or ${N2(L * (1 + Math.sqrt(3)) / 2)}.`);
        add(`Aralık kontrolü: son iki kök [0, ${N2(L)}] DIŞINDA; tek geçerli kritik nokta x = ${N2(L / 2)} m.`, `Domain check: the last two roots are OUTSIDE [0, ${N2(L)}]; the only valid critical point is x = ${N2(L / 2)} m.`);
        add(`İkinci türev: y'' = ${N2(k)}(12x² − 12Lx)/1000; x = L/2'de y'' = ${N2(-3 * k * L * L / 1000)} < 0 ⇒ MAKSİMUM (uçlarda y = 0 daha küçük).`, `Second derivative: y'' = ${N2(k)}(12x² − 12Lx)/1000; at x = L/2, y'' = ${N2(-3 * k * L * L / 1000)} < 0 ⇒ MAXIMUM (the ends, y = 0, are smaller).`);
        add(`Değer: y(L/2) = ${N2(k)}·L⁴(1/16 − 1/4 + 1/2)/1000 = ${N2(k)}·(5L⁴/16)/1000 = ${N2(ymax)} mm.`, `Value: y(L/2) = ${N2(k)}·L⁴(1/16 − 1/4 + 1/2)/1000 = ${N2(k)}·(5L⁴/16)/1000 = ${N2(ymax)} mm.`);
        add(`Yorum: en büyük çökme, simetriden beklendiği gibi kiriş ORTASINDA (${N2(L / 2)} m) oluşur.`, `Interpretation: as symmetry suggests, the largest deflection occurs at the MIDDLE of the beam (${N2(L / 2)} m).`);
      }
    }
    // numbered section headings in the house style
    return s.map((t, i) => tx(`── ${i + 1}) ──\n`, `── ${i + 1}) ──\n`) + t);
  }

  // ============================ drawing ============================
  function draw(canvas, problem) {
    try {
      const x = problem.p;
      const accent = canvas.accent();
      const fn = (f, o) => canvas.addFunction(Object.assign({ evaluator: safe(f), color: accent, thickness: 3 }, o));
      switch (problem.scn) {
        case 0: {
          const L = x[0], c = L / 6, vmax = 2 * L * L * L / 27;
          canvas.setViewport(-L * 0.05, L * 0.55, -vmax * 0.12, vmax * 1.3);
          fn((v) => (v < 0 || v > L / 2 ? NaN : v * (L - 2 * v) * (L - 2 * v)));
          canvas.addGuideLine({ axis: 'vertical', position: c, color: canvas.gray() });
          canvas.addMarker({ x: c, y: vmax, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${N2(c)}, ${N2(vmax)})` });
          break;
        }
        case 1: {
          const f = x[0], w = f / 4, amax = f * f / 8;
          canvas.setViewport(-f * 0.03, f * 0.53, -amax * 0.12, amax * 1.3);
          fn((v) => (v < 0 || v > f / 2 ? NaN : v * (f - 2 * v)));
          canvas.addGuideLine({ axis: 'vertical', position: w, color: canvas.gray() });
          canvas.addMarker({ x: w, y: amax, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${N2(w)}, ${N2(amax)})` });
          break;
        }
        case 2: {
          const a = x[0], k = x[1], pm = 4 * k * a * a * a;
          canvas.setViewport(-0.3 * a, 3.3 * a, -pm * 0.2, pm * 1.3);
          fn((v) => k * (3 * a * v * v - v * v * v));
          canvas.addGuideLine({ axis: 'vertical', position: 2 * a, color: canvas.gray() });
          canvas.addMarker({ x: 2 * a, y: pm, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${N2(2 * a)}, ${N2(pm)})` });
          break;
        }
        case 3: {
          const m = x[0], bx = 3 * m, hy = 4 * m, ll = 5 * m;
          canvas.setViewport(-ll * 0.1, ll * 1.1, -ll * 0.1, ll * 1.1);
          fn((v) => (v < 0 || v > ll ? NaN : Math.sqrt(ll * ll - v * v)));
          canvas.addSegment({ x1: bx, y1: 0, x2: 0, y2: hy, color: canvas.orange(), thickness: 4 });
          canvas.addMarker({ x: bx, y: hy, color: canvas.gold(), radius: 7, label: `(x, y) = (${N2(bx)}, ${N2(hy)})` });
          break;
        }
        case 4: {
          const r = x[0], a = PI * r * r, sl = 2 * PI * r, rm = r * 1.6;
          canvas.setViewport(-rm * 0.05, rm, -PI * rm * rm * 0.08, PI * rm * rm);
          fn((v) => PI * v * v);
          fn((v) => a + sl * (v - r), { color: canvas.gray(), thickness: 2, dashed: true });
          canvas.addMarker({ x: r, y: a, color: canvas.gold(), radius: 7, label: `A = ${N2(a)}` });
          break;
        }
        case 5: {
          const r = x[0], x0 = x[1], k = r * r * r + r;
          const f0 = x0 * x0 * x0 + x0 - k, d0 = 3 * x0 * x0 + 1;
          const x1 = x0 - f0 / d0;
          const xm = Math.max(x0, r) + 1;
          canvas.setViewport(-0.6, xm, -k * 1.3, Math.max(k, xm * xm * xm) * 0.6 + 5);
          fn((v) => v * v * v + v - k);
          fn((v) => f0 + d0 * (v - x0), { color: canvas.gray(), thickness: 2, dashed: true });
          canvas.addMarker({ x: x0, y: f0, color: canvas.green(), radius: 6, label: 'x₀' });
          canvas.addMarker({ x: x1, y: 0, color: canvas.gold(), shape: 'diamond', radius: 7, label: `x₁ = ${F4(x1)}` });
          canvas.addMarker({ x: r, y: 0, color: canvas.blue(), radius: 5, label: tx('kök', 'root') });
          break;
        }
        case 6: {
          const a = x[0], b = x[1], lim = a / b, w = 2 * PI / a;
          canvas.setViewport(-w, w, -lim * 0.4, lim * 1.5);
          fn((v) => (Math.abs(v) < 1e-9 ? NaN : Math.sin(a * v) / (b * v)));
          canvas.addMarker({ x: 0, y: lim, color: canvas.gold(), shape: 'diamond', radius: 7, label: `lim = ${F4(lim)}` });
          break;
        }
        case 7: {
          const a = x[0], d = x[1], area = a * a + d, approx = a + d / (2 * a);
          canvas.setViewport(a * a - 8, a * a + 8, a - 1.2, a + 1.2);
          fn((v) => (v < 0 ? NaN : Math.sqrt(v)));
          fn((v) => a + (v - a * a) / (2 * a), { color: canvas.gray(), thickness: 2, dashed: true });
          canvas.addMarker({ x: a * a, y: a, color: canvas.blue(), radius: 5, label: `(${N2(a * a)}, ${N2(a)})` });
          canvas.addMarker({ x: area, y: approx, color: canvas.gold(), shape: 'diamond', radius: 7, label: `L = ${F4(approx)}` });
          break;
        }
        case 8: {
          const a = x[0], b = x[1], t = x[2];
          const sT = a * t * t + b * t, avg = a * t + b, c = t / 2, sc = a * c * c + b * c;
          canvas.setViewport(-t * 0.08, t * 1.1, -sT * 0.1, sT * 1.2);
          fn((v) => (v < 0 || v > t ? NaN : a * v * v + b * v));
          fn((v) => avg * v, { color: canvas.green(), thickness: 2 });
          fn((v) => sc + avg * (v - c), { color: canvas.gray(), thickness: 2, dashed: true });
          canvas.addMarker({ x: c, y: sc, color: canvas.gold(), shape: 'diamond', radius: 7, label: `c = ${N2(c)}` });
          break;
        }
        default: {
          const L = x[0], k = x[1], ymax = 5 * k * L * L * L * L / 16000;
          canvas.setViewport(-L * 0.06, L * 1.06, -ymax * 0.2, ymax * 1.3);
          fn((v) => (v < 0 || v > L ? NaN : k * (v * v * v * v - 2 * L * v * v * v + L * L * L * v) / 1000));
          canvas.addGuideLine({ axis: 'vertical', position: L / 2, color: canvas.gray() });
          canvas.addMarker({ x: L / 2, y: ymax, color: canvas.gold(), shape: 'diamond', radius: 7, label: `(${N2(L / 2)}, ${N2(ymax)})` });
        }
      }
    } catch (e) { /* never throw */ }
  }

  // ============================ framework glue ============================
  function syncSliders(problem) {
    if (sliderRows.length === 0) return;
    const specs = Specs(problem.scn);
    for (let i = 0; i < sliderRows.length; i++) {
      const row = sliderRows[i];
      if (i >= specs.length) { row.block.style.display = 'none'; continue; }
      const sp = specs[i];
      row.block.style.display = '';
      row.captionEl.textContent = sp.caption;
      const v = problem.p[i];
      row.valueEl.textContent = fmt2(v);
      const ratio = (v - sp.min) / (sp.max - sp.min);
      row.input.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
    }
  }

  function createProblem(rng, forcedScn) {
    if (forcedScn !== undefined) currentScenario = forcedScn;
    const scn = currentScenario;
    const specs = Specs(scn);
    const p = [0, 0, 0, 0, 0];
    for (let i = 0; i < specs.length; i++) {
      const sp = specs[i];
      const count = Math.round((sp.max - sp.min) / sp.step);
      p[i] = Math.round((sp.min + sp.step * rng.nextInt(0, count + 1)) * 10000) / 10000;
    }
    const prob = { scn, p };
    syncSliders(prob);
    return prob;
  }

  function problemStatement(problem) { return Question(problem); }

  function concept(problem) {
    const head = tx('HAYATTAN ÖRNEK', 'REAL-LIFE EXAMPLE') + '\n' + Titles()[problem.scn] + '\n\n' +
      tx('BİRİM VE ANLAM', 'UNITS AND MEANING') + '\n' + Info(problem) + '\n\n';
    const how = tx(
      "NASIL ÇÖZÜLÜR?\n   (1) Sorudaki anahtar sözcüğü tanı: \n      • 'en büyük/en küçük' = OPTİMİZASYON\n      • 'ne hızla artıyor/azalıyor' = İLİŞKİLİ DEĞİŞİM HIZI\n      • 'yaklaşık kök' = NEWTON\n      • 'belirsiz 0/0' = L'HÔPITAL\n      • 'küçük değişimle tahmin' = DOĞRUSAL YAKLAŞIM\n      • 'ortalama = anlık olduğu an' = ORTALAMA DEĞER TEOREMİ\n   (2) Modeli ve (varsa) kısıtı yaz; değişkenleri tek değişkene indir ya da ilişkili hızlar için bağıntıyı yaz.\n   (3) Türevi önce genel olarak al, SONRA verilen sayıları yerine koy (ilişkili değişimde türevden ÖNCE sayı koymayın).\n   (4) Adayları (V' = 0, uç noktalar, tanımsız noktalar) karşılaştır ya da formülü uygula; sonucu BİRİMİ ve İŞARETİYLE yorumla.\n\n",
      "HOW TO SOLVE IT\n   (1) Recognise the key phrase: \n      • 'largest/smallest' = OPTIMIZATION\n      • 'how fast is it increasing/decreasing' = RELATED RATES\n      • 'approximate root' = NEWTON\n      • 'indeterminate 0/0' = L'HÔPITAL\n      • 'estimate from a small change' = LINEAR APPROXIMATION\n      • 'moment when instantaneous = average' = MEAN VALUE THEOREM\n   (2) Write the model and (if any) the constraint; reduce to one variable, or write the relation for related rates.\n   (3) Differentiate for the general variable FIRST, THEN insert the given numbers (in related rates never insert numbers BEFORE differentiating).\n   (4) Compare the candidates (V' = 0, endpoints, points where the derivative fails to exist) or apply the formula; interpret the result WITH its UNIT and SIGN.\n\n");
    if (showMeaning) {
      return head + how + tx('BU SORUDA MATEMATİKSEL OLARAK NE İSTENİYOR?', 'WHAT IS THIS QUESTION ASKING, MATHEMATICALLY?') + '\n' + Meaning(problem);
    }
    return head + how + tx(
      "(Çözmeden önce sorunun matematiksel karşılığını görmek için 'Soru ne demek istiyor?' düğmesine basın.)",
      "(To see what the question means mathematically before solving, press the 'What does the question mean?' button.)");
  }

  function buildControls(rightCol, getProblem, helpers) {
    const selectReg = helpers.addSelect({
      options: Titles().map((label, value) => ({ label, value })),
      get: () => currentScenario,
      set: (v) => { currentScenario = Number(v); helpers.regenerate(); },
    });

    const meaningBtn = document.createElement('button');
    meaningBtn.className = 'flat-btn';
    function updateMeaningLabel() {
      meaningBtn.textContent = showMeaning
        ? tx('Soru ne demek istiyor? (Gizle)', 'What does the question mean? (Hide)')
        : tx('Soru ne demek istiyor? (Göster)', 'What does the question mean? (Show)');
    }
    updateMeaningLabel();
    meaningBtn.addEventListener('click', () => {
      showMeaning = !showMeaning;
      updateMeaningLabel();
      helpers.refresh();
    });
    rightCol.appendChild(meaningBtn);

    sliderRows = [];
    for (let i = 0; i < 3; i++) {
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
        if (idx >= specs.length) return;
        const sp = specs[idx];
        const ratio = Number(input.value) / 1000;
        let v = sp.min + ratio * (sp.max - sp.min);
        v = Math.round(v / sp.step) * sp.step;
        v = Math.max(sp.min, Math.min(sp.max, v));
        getProblem().p[idx] = Math.round(v * 10000) / 10000;
        valueEl.textContent = fmt2(getProblem().p[idx]);
        helpers.refresh();
      });
      sliderRows.push({ block, captionEl, valueEl, input });
    }
    syncSliders(getProblem());

    if (offLangCustom) offLangCustom();
    offLangCustom = I18N.onChange(() => {
      const titles = Titles();
      for (let i = 0; i < selectReg.select.options.length && i < titles.length; i++) {
        selectReg.select.options[i].textContent = titles[i];
      }
      updateMeaningLabel();
      syncSliders(getProblem());
    });
  }

  Topics.register('applications', {
    id: 'realLifeApplications',
    tabTitle: () => tx('Hayattan Örnekler', 'Real-Life Examples'),
    concept,
    problemStatement,
    createProblem,
    solveSteps: Steps,
    draw,
    buildControls,
    links: [
      { match: /^\s*• 'en büyük\/en küçük'|^\s*• 'largest\/smallest'/, make: (rng) => createProblem(rng, 0) },
      { match: /^\s*• 'ne hızla artıyor|^\s*• 'how fast is it increasing/, make: (rng) => createProblem(rng, 3) },
      { match: /^\s*• 'yaklaşık kök'|^\s*• 'approximate root'/, make: (rng) => createProblem(rng, 5) },
      { match: /^\s*• 'belirsiz 0\/0'|^\s*• 'indeterminate 0\/0'/, make: (rng) => createProblem(rng, 6) },
      { match: /^\s*• 'küçük değişimle|^\s*• 'estimate from a small change/, make: (rng) => createProblem(rng, 7) },
      { match: /^\s*• 'ortalama = anlık|^\s*• 'moment when instantaneous/, make: (rng) => createProblem(rng, 8) },
    ],
    // test hooks (harmless)
    _scenarioCount: () => Titles().length,
    _setScenario: (i) => { currentScenario = i; },
  });
})();
