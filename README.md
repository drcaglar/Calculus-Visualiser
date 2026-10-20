# Calculus Visualiser

An interactive, bilingual (English / Turkish) visual learning tool for Calculus: web edition.

*Matematik / Kalkülüs dersleri için hazırlanmış, etkileşimli ve iki dilli (English / Türkçe) görsel öğrenme programının web sürümü.*

**Author / Hazırlayan:** Dr. Halil Emre ÇAĞLAR

[English](#english) · [Türkçe](#türkçe) · [Licence / Lisans](#copyright-and-licence--telif-hakkı-ve-lisans) · [References / Kaynaklar](#references-and-suggested-reading--kaynaklar-ve-önerilen-okumalar)

---

## English

### What is inside?

This web edition contains the following chapters (the first tab of each finished chapter is **Getting started**: a short summary with 2D/3D animations):

- **Numbers & Cartesian**: number sets, inequalities, absolute value, slope and angle of inclination, equations of lines, parallel/perpendicular lines, distance, circle, parabola
- **Functions**: function explorer, domain and range, piecewise functions, transformations, ellipse, inverse functions and more
- **Trigonometry**: radians, unit circle, identities, periodic functions, transformations, inverse trigonometric functions
- **Limits & Continuity**: rates of change and tangents, limit laws, the ε–δ definition, one-sided limits, types of discontinuity, limits at infinity and asymptotes, continuity (Intermediate Value Theorem)
- **Derivatives**: tangent and rate of change, differentiation rules, trigonometric derivatives, chain rule, implicit differentiation
- **Applications of Derivatives**: extrema, Mean Value Theorem, concavity, optimization, related rates, L'Hôpital's rule, Newton's method, curve sketching
- **Integrals**: area, Riemann sums, the Fundamental Theorem of Calculus, substitution
- **Integral Applications & Differential Equations**: techniques of integration (integration by parts, trigonometric integrals, trigonometric substitution, partial fractions), numerical integration (trapezoid, Simpson), improper integrals, volumes of revolution, shells, arc length and surface area, work, centroids, fluid force, probability density functions; differential equations: slope fields and Euler's method, separable and first-order linear equations, applications, autonomous equations and the phase line (the volume, shell, arc, work, centroid and fluid-force tabs have a 3D view)
- **Sequences, Series, Parametric & Polar** and **Multivariable Calculus**: the topic lists appear as "Coming soon"; their content is not ready yet
- **Engineering Applications**: statics, dynamics, thermo-fluid and materials scenarios (every solution ends with an *Assumptions and units* line)
- **Exam Creator**: pick topics from any chapter and build a printable mixed exam (10–100 questions) with an answer key; the Set No (`ALL-…`) recalls the same exam
- **About**: copyright and terms of use

In every topic: first the **PROBLEM** card, then (in some topics) a **prediction card**, a live graph with sliders, a detailed topic explanation and a **step-by-step** solution that opens gradually. "Generate New Example" creates unlimited new problems; every example has a **Problem ID** (e.g. `#K7M2P`), and typing the same ID into the box brings back the same problem (with the same tab settings). Finished chapters (except Sequences & Series and Multivariable Calculus) have a 10-question **Quiz** and a printable **Question Set** with an answer key. Every quiz gets a number (e.g. `LIM-P9YVJ`) and every question set a Set No (e.g. `LIM-B5ZK4-40-3FFF`: chapter-seed-question count-selected topics). Typing the number brings back the same questions and the answer key; finished quizzes are stored with our answers in this browser and can be reopened from the list.

On narrow screens (phone) the order is: PROBLEM card, prediction card, graph, sliders, topic explanation.

The Windows desktop application is a separate program and is not part of this repository.

### How to use

- **Computer / phone / tablet:** open the link in a browser. No installation needed.
- **Single file:** `CalculusVisualiser_Web.html` works on its own; double-click it and open it in a browser.
- **As a folder:** open `index.html` (the whole folder must stay together).
- Change the language (EN | tr) and the theme (dark / light) at the top right.

A modern browser is required (Chrome, Edge, Firefox, Safari). The program works completely offline (KaTeX and Three.js are included locally); the internet is only needed to open external links such as LinkedIn, Google Scholar and the AI links. The program does not send data to any server.

### For developers

`FRAMEWORK.md` explains how to add a new tab or chapter. Automated tests:

```
node tests/run.js              # all checks (takes a few minutes)
node tests/run.js engineering  # one chapter
```

The tests include scans for errors/NaN/"undefined", link and prediction-card checks, the engineering units and assumptions audit, the 3D scene check, a translation audit (Turkish/English), a quiz-pool check, and independent numeric verification for some topics (derivative, Riemann sum, limit, Newton step).

---

## Türkçe

### Neler var?

Bu web sürümü şu bölümleri içerir (hazır bölümlerin ilk sekmesi, kısa bir özet ve 2B/3B animasyonlar içeren **Başlangıç** sekmesidir):

- **Sayılar ve Kartezyen**: sayı kümeleri, eşitsizlikler, mutlak değer, eğim ve eğim açısı, doğru denklemi, paralel/dik doğrular, uzaklık, çember, parabol
- **Fonksiyonlar**: Fonksiyon Gezgini, tanım/değer kümesi, parçalı fonksiyonlar, dönüşümler, elips, ters fonksiyon ve daha fazlası
- **Trigonometri**: radyan, birim çember, özdeşlikler, periyodik fonksiyonlar, dönüşümler, ters trigonometrik fonksiyonlar
- **Limitler ve Süreklilik**: değişim hızı ve teğet, limit kuralları, ε–δ tanımı, tek taraflı limitler, süreksizlik türleri, sonsuzda limit ve asimptotlar, süreklilik (Ara Değer Teoremi)
- **Türev**: teğet ve değişim hızı, türev kuralları, trigonometrik türevler, zincir kuralı, kapalı türev
- **Türevin Uygulamaları**: ekstremum, Ortalama Değer Teoremi, konkavlık, optimizasyon, ilgili hızlar, L'Hôpital, Newton, eğri çizimi
- **İntegraller**: alan, Riemann toplamları, Analizin Temel Teoremi, yerine koyma
- **İntegral Uygulamaları ve Diferansiyel Denklemler**: integral teknikleri (kısmi integral, trigonometrik integraller, trigonometrik yerine koyma, basit kesirler), sayısal integral (yamuk, Simpson), genelleştirilmiş integraller, dönel cisim hacimleri, kabuk yöntemi, yay uzunluğu ve yüzey alanı, iş, ağırlık merkezi, akışkan kuvveti, olasılık yoğunluk fonksiyonları; diferansiyel denklemler: eğim alanı ve Euler yöntemi, değişkenlerine ayrılabilir ve birinci mertebe lineer denklemler, uygulamalar, otonom denklemler ve faz çizgisi (hacim, kabuk, yay, iş, ağırlık merkezi ve akışkan kuvveti sekmeleri 3B görünümlüdür)
- **Diziler, Seriler, Parametrik ve Kutupsal** ve **Çok Değişkenli Kalkülüs**: konu listeleri "Yakında" olarak görünür, içerikleri henüz hazır değildir
- **Mühendislik Uygulamaları**: statik, dinamik, ısı-akışkan ve malzeme senaryoları (her çözümün sonunda *Varsayımlar ve birimler* satırı vardır)
- **Sınav Oluşturucu**: tüm bölümlerin konularından istediğimiz konuları seçip (10–100 soru) yazdırılabilir karma sınav ve cevap anahtarı hazırlar; Set No (`ALL-…`) ile aynı sınav geri çağrılır
- **Program Hakkında**: telif ve kullanım bilgileri

Her konuda: önce **SORU** kartı, sonra (bazı konularda) bir **tahmin kartı**, canlı grafik ve kaydırıcılar, detaylı konu anlatımı ve **adım adım** açılan çözüm. "Yeni Örnek Üret" ile sınırsız yeni soru üretilir; her örneğin bir **Soru No**'su (örn. `#K7M2P`) vardır, aynı numarayı kutuya yazınca aynı soru yeniden gelir (aynı sekme ayarlarıyla). Hazır bölümlerde (Seriler ve Çok Değişkenli Kalkülüs hariç) 10 soruluk **Sınav (Quiz)** ve yazdırılabilir **Soru Seti** (cevap anahtarıyla) bulunur. Her quiz bir numara alır (örn. `LIM-P9YVJ`), her soru seti de bir Set No alır (örn. `LIM-B5ZK4-40-3FFF`: bölüm-tohum-soru sayısı-seçili konular). Numara yazılınca aynı sorular ve cevap anahtarı geri gelir; bitirilen quizler cevaplarımızla birlikte bu tarayıcıda saklanır ve listeden yeniden açılabilir.

Dar ekranlarda (telefon) sıra şöyledir: SORU kartı, tahmin kartı, grafik, kaydırıcılar, konu anlatımı.

Windows masaüstü uygulaması bu web sürümünden ayrı bir programdır; bu deponun konusu değildir.

### Nasıl kullanılır?

- **Bilgisayar / telefon / tablet:** Verilen bağlantıyı tarayıcıda açın. Kurulum gerekmez.
- **Tek dosya:** `CalculusVisualiser_Web.html` dosyası tek başına çalışır; çift tıklayıp tarayıcıda açın.
- **Klasör olarak:** `index.html` dosyasını açın (tüm klasörün birlikte durması gerekir).
- Sağ üstten dili (TR | en) ve temayı (koyu / açık) değiştirebilirsiniz.

Modern bir tarayıcı gerekir (Chrome, Edge, Firefox, Safari). Program tamamen çevrimdışı çalışır (KaTeX ve Three.js yerel olarak dahildir); internet yalnızca LinkedIn, Google Scholar ve yapay zekâ bağlantıları gibi dış bağlantıları açmak için gerekir. Program başka bir sunucuya veri göndermez.

### Geliştiriciler için

`FRAMEWORK.md` dosyası yeni sekme/bölüm ekleme adımlarını anlatır. Otomatik testler için:

```
node tests/run.js              # tüm kontroller (çalışma süresi birkaç dakika)
node tests/run.js engineering  # tek bölüm
```

Testler hata/NaN/"undefined" taraması, link ve tahmin kartı kontrolleri, mühendislik birim ve varsayım denetimi, 3B sahne denetimi, çeviri (Türkçe/İngilizce) denetimi, quiz havuzu denetimi ve bazı konularda bağımsız sayısal doğrulamaları (türev, Riemann toplamı, limit, Newton adımı) içerir.

---

## Copyright and licence / Telif hakkı ve lisans

Copyright © 2026 **Dr. Halil Emre ÇAĞLAR**. Some rights reserved. / Bazı hakları saklıdır.

[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)

*This work is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)** licence: you may share it with attribution, for non-commercial purposes and **without modification**. Distributing modified versions or commercial use requires the author's written permission. See [LICENSE](LICENSE) (it includes the full legal text).*

Bu eser **Creative Commons Atıf-GayriTicari-TürevYapılamaz 4.0 Uluslararası (CC BY-NC-ND 4.0)** lisansı ile sunulmuştur: yazara atıf yaparak, ticari olmayan amaçlarla ve **değiştirmeden** paylaşabilirsiniz. Değiştirilmiş sürümlerin dağıtımı ve ticari kullanım için yazarın yazılı izni gerekir. Ayrıntılar ve tam hukuki metin: [LICENSE](LICENSE).

Suggested credit / Önerilen atıf: *"Calculus Visualiser © 2026 Dr. Halil Emre ÇAĞLAR, licensed under CC BY-NC-ND 4.0."*

Third-party components such as KaTeX and Three.js are under their own (MIT) licences: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) / KaTeX ve Three.js gibi üçüncü taraf bileşenler kendi (MIT) lisanslarına tabidir.
Permission requests and copyright notices / İzin talepleri ve telif bildirimleri: drcaglar.academic@gmail.com

## References and suggested reading / Kaynaklar ve önerilen okumalar

*The topic order follows the common university calculus curriculum; the text, figures, problems and solutions are original. No affiliation with the authors or publishers. ISBNs vary by edition and regional version.*

Konu sırası ve kapsam yaygın üniversite kalkülüs müfredatını izler; programdaki metin, şekil, soru ve çözümler bu kitaplardan alınmamıştır. Yazar/yayıncılarla bağlantı veya onay ilişkisi yoktur. ISBN baskıya ve ülke sürümüne göre değişir.

- Hass, J. R., Heil, C. E., Bogacki, P., & Weir, M. D. (2023). *Thomas' Calculus: Early Transcendentals* (15th ed.). Pearson. ISBN 9780137559824.
- Stewart, J., Clegg, D. K., & Watson, S. (2020). *Calculus: Early Transcendentals* (9th ed.). Cengage Learning. ISBN 9781337613927.
- Anton, H., Bivens, I. C., & Davis, S. (2022). *Calculus: Early Transcendentals* (12th ed., Wiley international adaptation). Wiley. ISBN 9781119820482.
- Larson, R., & Edwards, B. H. (2022). *Calculus* (12th ed.). Cengage Learning. ISBN 9780357749135.
- Balcı, M. (1997). *Matematik Analiz* (2 cilt). Balcı Yayınları, Ankara. ISBN 9789756683026 (kütüphane kataloğuna göre; cilt bazlı ISBN doğrulanmadı / according to the library catalogue; volume-level ISBNs not verified).

## Disclaimer / Sorumluluk reddi

The content is for teaching purposes; solutions and results should be verified before being relied on, for example in an assessed exam. Please contact the author to report errors.

İçerik öğretim amaçlıdır; çözümler ve sonuçlar sınav gibi önemli durumlarda kullanılmadan önce doğrulanmalıdır. Hata bildirimleri için yazar ile iletişime geçiniz.
