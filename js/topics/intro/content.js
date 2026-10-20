// "Başlangıç / Getting started" tab of every chapter: short summary + animations (2D, 3D or both). Placed first in each chapter.
(function () {
  const A = IntroAnims2D, B = IntroAnims3D;
  const TITLE = ['Bu bölümde neler var?', 'What is in this chapter?'];
  const defs = {
    numbers: { bullets: [
      ['Sayı kümeleri ve sayı doğrusu: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ', 'Number sets and the number line: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ'],
      ['Eşitsizlikler, aralık gösterimi ve mutlak değer (|x| = sıfıra uzaklık)', 'Inequalities, interval notation and absolute value (|x| = distance from zero)'],
      ['Kartezyen düzlem: nokta, uzaklık, orta nokta ve eğim', 'The Cartesian plane: points, distance, midpoint and slope'],
      ['Doğru denklemleri, paralel ve dik doğrular', 'Equations of lines, parallel and perpendicular lines'],
      ['Çember ve parabol denklemleri', 'Equations of circles and parabolas'],
    ], anims: [A.numberLine, A.cartesian, A.intervalLine, A.lineSlope] },
    functions: { bullets: [
      ['Fonksiyon kavramı, tanım ve değer kümesi', 'The function concept, domain and range'],
      ['Grafik dönüşümleri: kaydırma, ölçekleme, yansıma', 'Graph transformations: shifting, scaling, reflecting'],
      ['Artan/azalan, tek/çift ve parçalı fonksiyonlar', 'Increasing/decreasing, even/odd and piecewise functions'],
      ['Bileşke ve ters fonksiyon', 'Composite and inverse functions'],
      ['Üstel, logaritmik ve hiperbolik fonksiyonlar; modelleme', 'Exponential, logarithmic and hyperbolic functions; modelling'],
    ], anims: [A.transform, A.inverse, A.composite, A.expLog] },
    trig: { bullets: [
      ['Radyan ve derece, yay uzunluğu', 'Radians and degrees, arc length'],
      ['Birim çember: sin, cos, tan', 'The unit circle: sin, cos, tan'],
      ['Trigonometrik özdeşlikler ve periyodik fonksiyonlar', 'Trigonometric identities and periodic functions'],
      ['Grafik dönüşümleri: genlik, periyot, faz', 'Graph transformations: amplitude, period, phase'],
      ['Ters trigonometrik fonksiyonlar, sinüs ve kosinüs teoremi', 'Inverse trigonometric functions, the laws of sines and cosines'],
    ], anims: [A.unitCircle, A.radian, A.sineParams, A.tanAsym] },
    limits: { bullets: [
      ['Limit nedir? Bir değere yaklaşmak', 'What is a limit? Approaching a value'],
      ['Tek taraflı limitler ve limit kuralları', 'One-sided limits and the limit laws'],
      ['ε–δ tanımı: yaklaşmanın kesin dili', 'The ε–δ definition: the precise language of approaching'],
      ['Süreklilik ve süreksizlik türleri', 'Continuity and the types of discontinuity'],
      ['Sonsuzda limit ve asimptotlar', 'Limits at infinity and asymptotes'],
    ], anims: [A.approach, A.epsDelta, A.jump, A.atInf] },
    derivatives: { bullets: [
      ['Teğet doğrusu ve anlık değişim hızı', 'The tangent line and the instantaneous rate of change'],
      ['Türevin limit tanımı: kesenden teğete', 'The limit definition of the derivative: from secant to tangent'],
      ['Türev kuralları: kuvvet, çarpım, bölüm, zincir', 'Differentiation rules: power, product, quotient, chain'],
      ['Trigonometrik, üstel, logaritmik ve kapalı türevler', 'Trigonometric, exponential, logarithmic and implicit derivatives'],
      ['Yüksek mertebeden türevler; hız ve ivme', 'Higher derivatives; velocity and acceleration'],
    ], anims: [A.secant, A.fprime, A.productRule, A.chainDemo] },
    applications: { bullets: [
      ['Artan/azalan fonksiyonlar ve yerel ekstremumlar', 'Increasing/decreasing functions and local extrema'],
      ['Konkavlık, büküm noktaları ve eğri çizimi', 'Concavity, inflection points and curve sketching'],
      ['Optimizasyon ve bağıntılı hızlar', 'Optimization and related rates'],
      ['Ortalama değer teoremi, doğrusal yaklaşım', 'The mean value theorem, linear approximation'],
      ['Newton yöntemi ve L\'Hôpital kuralı', 'Newton\'s method and L\'Hôpital\'s rule'],
    ], anims: [A.sign, A.optimize, A.concavity, A.ladder] },
    engineering: { bullets: [
      ['Statik: kuvvet, moment, ağırlık merkezi, baraj kapağı', 'Statics: force, moment, centre of mass, dam gate'],
      ['Dinamik: konum, hız, ivme ve titreşim', 'Dynamics: position, velocity, acceleration and vibration'],
      ['Isı ve akışkan: soğuma, debi, basınç', 'Heat and fluids: cooling, flow rate, pressure'],
      ['Malzeme: gerilme, yük ve kiriş', 'Materials: stress, load and beams'],
      ['Türev ve integral gerçek mühendislik problemlerinde', 'Derivatives and integrals in real engineering problems'],
    ], anims: [A.springMass, B.beam, A.cooling, B.pipeFlow] },
    integrals: { bullets: [
      ['Alan ve birikim: işaretli alan ve toplam alan', 'Area and accumulation: signed area and total area'],
      ['Riemann toplamları ve sigma gösterimi', 'Riemann sums and sigma notation'],
      ['Belirli integral, özellikleri ve ortalama değer', 'The definite integral, its properties and the average value'],
      ['Analizin Temel Teoremi: türev ile integralin ilişkisi', 'The Fundamental Theorem: how derivative and integral are linked'],
      ['Ters türev, yerine koyma ve iki eğri arasındaki alan', 'Antiderivatives, substitution and the area between two curves'],
    ], anims: [B.disks, B.riemannBars, B.antiFamily, B.betweenStrips] },
    calc2: { bullets: [
      ['Hacim: kesit, disk, rondela ve silindirik kabuk yöntemleri', 'Volume: cross-sections, disks, washers and cylindrical shells'],
      ['Yay uzunluğu ve dönel yüzey alanı', 'Arc length and surface area of revolution'],
      ['İş: yay, halat ve sıvı pompalama', 'Work: springs, ropes and pumping liquids'],
      ['Moment, ağırlık merkezi ve Pappus teoremi', 'Moments, centre of mass and Pappus\' theorem'],
      ['Integral teknikleri: kısmi integral, trigonometrik integraller ve yerine koyma, basit kesirler', 'Integration techniques: parts, trigonometric integrals and substitution, partial fractions'],
      ['Sayısal integral (yamuk, Simpson) ve genelleştirilmiş integraller', 'Numerical integration (trapezoid, Simpson) and improper integrals'],
      ['Akışkan kuvveti ve olasılık yoğunluk fonksiyonları', 'Fluid force and probability density functions'],
      ['Diferansiyel denklemler: eğim alanı, Euler, değişkenlerine ayrılabilir ve lineer denklemler, uygulamalar, faz çizgisi', 'Differential equations: slope fields, Euler, separable and linear equations, applications, the phase line'],
    ], anims: [B.shells, B.slices, B.washers, B.pumping] },
  };
  Object.keys(defs).forEach((ch) => Intro.register(ch, { title: TITLE, bullets: defs[ch].bullets, anims: defs[ch].anims }));
})();
