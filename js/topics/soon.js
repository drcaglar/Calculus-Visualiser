// Placeholder tabs ("Hazırlanıyor") for the Calculus II topics and the multivariable chapter that are not written yet.
// Each entry: [id, TR title, EN title, dims ('2D' | '3D' | '2D+3D'), TR plan, EN plan]. Content is filled in later.
const Soon = (function () {
  const tx = (a, b) => I18N.tx(a, b);
  function mount(host, def) {
    host.innerHTML = '<div class="in-root"><h2 class="in-title"></h2><div class="soon-badges"></div><p class="soon-note"></p><p class="soon-plan"></p></div>';
    const root = host.querySelector('.in-root');
    function build() {
      root.querySelector('.in-title').textContent = def.tabTitle();
      const b = root.querySelector('.soon-badges'); b.innerHTML = '';
      def.dims.split('+').forEach((d) => { const s = document.createElement('span'); s.className = 'in-badge'; s.textContent = d === '3D' ? tx('3B', '3D') : tx('2B', '2D'); b.appendChild(s); });
      root.querySelector('.soon-note').textContent = tx('🛠 Hazırlanıyor: bu sekmenin içeriği (konu anlatımı, örnekler, grafikler, sorular) daha sonra eklenecek.', '🛠 In preparation: the content of this tab (topic text, examples, graphs, questions) will be added later.');
      root.querySelector('.soon-plan').textContent = tx('Planlanan içerik: ', 'Planned content: ') + tx(def.plan[0], def.plan[1]);
    }
    build();
    const off = I18N.onChange(build);
    return { destroy() { off(); } };
  }
  function reg(chapter, rows) {
    rows.forEach(([id, tr, en, dims, ptr, pen]) => Topics.register(chapter, { id, type: 'soon', tabTitle: () => tx(tr, en), dims, plan: [ptr, pen] }));
  }

  // ---- Sequences, series, parametric and polar ----
  reg('series', [
    ['soonSeq', 'Diziler ve Limitleri', 'Sequences and Their Limits', '2D', 'Dizi kavramı, monotonluk, sınırlılık, dizinin limiti.', 'The sequence concept, monotonicity, boundedness, limits of sequences.'],
    ['soonSeries', 'Sonsuz Seriler ve Yakınsaklık', 'Infinite Series and Convergence', '2D', 'Kısmi toplamlar, yakınsak ve ıraksak seriler.', 'Partial sums, convergent and divergent series.'],
    ['soonGeo', 'Geometrik ve Teleskopik Seriler', 'Geometric and Telescoping Series', '2D', 'Geometrik seri toplamı, teleskopik toplamlar.', 'Sum of a geometric series, telescoping sums.'],
    ['soonIntTest', 'İntegral Testi ve p-Serileri', 'The Integral Test and p-Series', '2D', 'İntegral testi, harmonik seri, p-serileri.', 'The integral test, the harmonic series, p-series.'],
    ['soonCompare', 'Karşılaştırma Testleri', 'Comparison Tests', '2D', 'Doğrudan ve limit karşılaştırma testleri.', 'Direct and limit comparison tests.'],
    ['soonRatio', 'Oran ve Kök Testleri', 'Ratio and Root Tests', '2D', 'Oran testi, kök testi, hangi test ne zaman.', 'The ratio test, the root test, which test when.'],
    ['soonAlt', 'Alterne Seriler ve Mutlak Yakınsaklık', 'Alternating Series and Absolute Convergence', '2D', 'Alterne seri testi, şartlı ve mutlak yakınsaklık, hata tahmini.', 'Alternating series test, conditional and absolute convergence, error estimates.'],
    ['soonPower', 'Kuvvet Serileri', 'Power Series', '2D', 'Yakınsaklık yarıçapı ve aralığı, kuvvet serilerinin türev ve integrali.', 'Radius and interval of convergence, differentiating and integrating power series.'],
    ['soonTaylor', 'Taylor ve Maclaurin Serileri', 'Taylor and Maclaurin Series', '2D', 'Taylor polinomu ile yaklaşım, eˣ, sin x, cos x, ln(1+x) serileri.', 'Approximation with Taylor polynomials, series of eˣ, sin x, cos x, ln(1+x).'],
    ['soonTaylorErr', 'Taylor Polinomu Hata Tahmini', 'Taylor Remainder and Error', '2D', 'Taylor teoremi, kalan terim, hata sınırı.', 'Taylor\'s theorem, the remainder term, error bounds.'],
    ['soonParam', 'Parametrik Eğriler', 'Parametric Curves', '2D', 'x(t), y(t) ile eğriler, çevrim eğrisi (sikloid), yön ve eğim.', 'Curves given by x(t), y(t), the cycloid, direction and slope.'],
    ['soonParamCalc', 'Parametrik Türev, Alan ve Yay Uzunluğu', 'Parametric Derivatives, Area and Arc Length', '2D', 'dy/dx = (dy/dt)/(dx/dt), parametrik alan ve yay uzunluğu.', 'dy/dx = (dy/dt)/(dx/dt), parametric area and arc length.'],
    ['soonPolar', 'Kutupsal Koordinatlar', 'Polar Coordinates', '2D', 'r ve θ, dönüşüm formülleri, kutupsal eğriler.', 'r and θ, conversion formulas, polar curves.'],
    ['soonPolarCalc', 'Kutupsal Eğrilerde Alan ve Yay Uzunluğu', 'Area and Arc Length in Polar Coordinates', '2D', 'Kutupsal alan ½∫r²dθ ve yay uzunluğu.', 'Polar area ½∫r²dθ and arc length.'],
    ['soonConicsPolar', 'Koni Kesitleri ve Kutupsal Denklemler', 'Conic Sections and Polar Equations', '2D+3D', 'Odak–doğrultman tanımı, dış merkezlik, koni kesitlerinin kutupsal denklemi.', 'The focus–directrix definition, eccentricity, polar equations of conics.'],
  ]);

  // ---- Multivariable calculus ----
  reg('calc3', [
    ['soonSpace', 'Uzayda Koordinatlar ve Vektörler', 'Space Coordinates and Vectors', '3D', 'Üç boyutlu koordinat sistemi, vektörler, uzunluk, birim vektör.', 'The 3D coordinate system, vectors, length, unit vectors.'],
    ['soonDotCross', 'Nokta ve Çapraz Çarpım', 'Dot and Cross Product', '3D', 'Açı, izdüşüm, alan ve hacim, sağ el kuralı.', 'Angle, projection, area and volume, the right-hand rule.'],
    ['soonLinesPlanes', 'Doğrular ve Düzlemler', 'Lines and Planes in Space', '3D', 'Parametrik doğru, düzlem denklemi, uzaklıklar.', 'Parametric lines, equations of planes, distances.'],
    ['soonQuadrics', 'Yüzeyler ve Kuadrikler', 'Surfaces and Quadrics', '3D', 'Silindir, elipsoit, paraboloit, hiperboloit, koni; kesitler.', 'Cylinders, ellipsoids, paraboloids, hyperboloids, cones; traces.'],
    ['soonVecFun', 'Vektör Değerli Fonksiyonlar ve Uzay Eğrileri', 'Vector-Valued Functions and Space Curves', '3D', 'r(t), türev, integral, uzay eğrisinin yay uzunluğu.', 'r(t), derivative, integral, arc length of space curves.'],
    ['soonMotion', 'Eğrilik ve Uzayda Hareket', 'Curvature and Motion in Space', '2D+3D', 'Teğet, normal ve binormal; eğrilik; hız ve ivme bileşenleri.', 'Tangent, normal and binormal; curvature; velocity and acceleration components.'],
    ['soonMultiFun', 'Çok Değişkenli Fonksiyonlar ve Seviye Eğrileri', 'Functions of Several Variables and Level Curves', '2D+3D', 'z = f(x, y) yüzeyi, seviye eğrileri ve kontur haritası.', 'The surface z = f(x, y), level curves and contour maps.'],
    ['soonMultiLimit', 'Limit ve Süreklilik (Çok Değişkenli)', 'Limits and Continuity in Several Variables', '2D+3D', 'Farklı yollardan yaklaşma, limitin var olmaması.', 'Approaching along different paths, when a limit does not exist.'],
    ['soonPartial3', 'Kısmi Türevler', 'Partial Derivatives', '2D+3D', 'Kısmi türev, yüksek mertebe, eğim yorumları.', 'Partial derivatives, higher order, slope interpretation.'],
    ['soonChain3', 'Zincir Kuralı ve Kapalı Türev', 'The Chain Rule and Implicit Differentiation', '2D+3D', 'Çok değişkenli zincir kuralı, ağaç diyagramı.', 'The multivariable chain rule, tree diagrams.'],
    ['soonGrad', 'Gradyan ve Yönlü Türev', 'The Gradient and Directional Derivatives', '2D+3D', 'Gradyan vektörü, en hızlı artış yönü, yönlü türev.', 'The gradient vector, direction of steepest ascent, directional derivatives.'],
    ['soonTangentPlane', 'Teğet Düzlem ve Lineer Yaklaşım', 'Tangent Planes and Linear Approximation', '3D', 'Teğet düzlem, lineer yaklaşım, toplam diferansiyel.', 'The tangent plane, linear approximation, the total differential.'],
    ['soonExtrema3', 'Ekstremumlar ve Eyer Noktaları', 'Extrema and Saddle Points', '2D+3D', 'Kritik noktalar, ikinci türev testi, mutlak ekstremum.', 'Critical points, the second-derivative test, absolute extrema.'],
    ['soonLagrange', 'Lagrange Çarpanları', 'Lagrange Multipliers', '2D+3D', 'Kısıtlı optimizasyon, gradyanların paralelliği.', 'Constrained optimization, parallel gradients.'],
    ['soonDouble', 'Çift İntegral', 'Double Integrals', '2D+3D', 'Dikdörtgen ve genel bölgelerde çift integral, hacim, integral sırası.', 'Double integrals over rectangles and general regions, volume, order of integration.'],
    ['soonDoublePolar', 'Kutupsal Koordinatlarda Çift İntegral', 'Double Integrals in Polar Coordinates', '2D+3D', 'dA = r dr dθ, dairesel bölgeler.', 'dA = r dr dθ, circular regions.'],
    ['soonTriple', 'Üçlü İntegral', 'Triple Integrals', '3D', 'Üç boyutlu bölgelerde integral, hacim, kütle, ağırlık merkezi.', 'Integrals over 3D regions, volume, mass, centre of mass.'],
    ['soonCylSph', 'Silindirik ve Küresel Koordinatlar', 'Cylindrical and Spherical Coordinates', '3D', 'Koordinat dönüşümleri, üçlü integralde kullanımı.', 'Coordinate conversions, use in triple integrals.'],
    ['soonJacobian', 'Değişken Değiştirme ve Jacobian', 'Change of Variables and the Jacobian', '2D+3D', 'Jacobian determinantı, dönüşümle integral.', 'The Jacobian determinant, integrals under a change of variables.'],
    ['soonVecField', 'Vektör Alanları', 'Vector Fields', '2D+3D', 'Alan çizimi, rotasyonel ve diverjans.', 'Drawing fields, curl and divergence.'],
    ['soonLineInt', 'Çizgi İntegralleri', 'Line Integrals', '2D+3D', 'Skaler ve vektörel çizgi integrali, iş.', 'Scalar and vector line integrals, work.'],
    ['soonConservative', 'Korunumlu Alanlar ve Potansiyel', 'Conservative Fields and Potentials', '2D+3D', 'Yoldan bağımsızlık, potansiyel fonksiyon.', 'Path independence, potential functions.'],
    ['soonGreen', 'Green Teoremi', 'Green\'s Theorem', '2D', 'Çizgi integrali ile çift integral arasındaki ilişki.', 'The link between line integrals and double integrals.'],
    ['soonSurfInt', 'Yüzey İntegralleri', 'Surface Integrals', '3D', 'Parametrik yüzeyler, yüzey alanı, akı.', 'Parametric surfaces, surface area, flux.'],
    ['soonStokes', 'Stokes Teoremi', 'Stokes\' Theorem', '3D', 'Yüzey ve sınır eğrisi arasındaki ilişki.', 'The link between a surface and its boundary curve.'],
    ['soonDiv', 'Diverjans Teoremi', 'The Divergence Theorem', '3D', 'Akı ile hacim integrali arasındaki ilişki.', 'The link between flux and volume integrals.'],
  ]);
  return { mount };
})();
