// Renders the "Program Hakkında / About" chapter: authorship, copyright notice, licence (CC BY-NC-ND 4.0), attribution/citation,
// third-party notices, privacy, disclaimer and contact. Static content, re-rendered on every language change.
// NOTE: keep the licence wording in sync with LICENSE, README.md and THIRD_PARTY_NOTICES.md.

const APP_INFO = { name: 'Calculus Visualiser', year: 2026, version: '1.0', date: '2026-10', author: 'Dr. Halil Emre ÇAĞLAR', email: 'drcaglar.academic@gmail.com',
  licence: 'CC BY-NC-ND 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/', legalUrl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode' };

function mountAbout(host) {
  const A = APP_INFO;
  const tx = (a, b) => I18N.tx(a, b);
  function section(titleTr, titleEn, bodyTr, bodyEn) {
    return `
      <div class="about-section">
        <h3>${tx(titleTr, titleEn)}</h3>
        <p>${tx(bodyTr, bodyEn)}</p>
      </div>
    `;
  }

  // Textbooks (verified against publisher / library catalogue listings; ISBN differs by edition, region and format)
  const BOOKS = [
    { a: 'Hass, J. R., Heil, C. E., Bogacki, P., & Weir, M. D.', t: "Thomas' Calculus: Early Transcendentals", e: '15th ed.', p: 'Pearson', y: '2023', isbn: '9780137559824',
      n: 'Pearson Canada kataloğu / Pearson Canada catalogue (SI Units sürümü / edition: 9781292727912)' },
    { a: 'Stewart, J., Clegg, D. K., & Watson, S.', t: 'Calculus: Early Transcendentals', e: '9th ed.', p: 'Cengage Learning', y: '2020', isbn: '9781337613927', n: '' },
    { a: 'Anton, H., Bivens, I. C., & Davis, S.', t: 'Calculus: Early Transcendentals', e: '12th ed.', p: 'Wiley', y: '2022', isbn: '9781119820482',
      n: 'Wiley uluslararası uyarlama / international adaptation' },
    { a: 'Larson, R., & Edwards, B. H.', t: 'Calculus', e: '12th ed.', p: 'Cengage Learning', y: '2022', isbn: '9780357749135', n: '' },
    { a: 'Balcı, M.', t: 'Matematik Analiz (2 cilt / 2 vols.)', e: '', p: 'Balcı Yayınları, Ankara', y: '1997', isbn: '9789756683026',
      n: 'Kütüphane kataloğuna göre / per library catalogue; cilt bazlı ISBN doğrulanmadı / volume-level ISBN not confirmed' },
  ];
  const bookList = () => '<ul class="about-list">' + BOOKS.map((b) =>
    `<li>${b.a} (${b.y}). <i>${b.t}</i>${b.e ? ' (' + b.e + ')' : ''}. ${b.p}. ISBN <a href="https://search.worldcat.org/search?q=bn%3A${b.isbn}" target="_blank" rel="noopener">${b.isbn}</a>${b.n ? ' <span class="about-note">(' + b.n + ')</span>' : ''}</li>`).join('') + '</ul>';
  const MIT = () => `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

  function render() {
    const mail = `<a href="mailto:${A.email}">${A.email}</a>`;
    host.innerHTML = `
      <div class="about-root">
        <h1>${tx('Calculus Visualiser Hakkında', 'About Calculus Visualiser')}</h1>
        <p class="about-byline">© ${A.year} ${A.author} — ${tx('Bazı hakları saklıdır', 'Some rights reserved')} (<a href="${A.licenceUrl}" target="_blank" rel="noopener license">${A.licence}</a>)
          &nbsp;|&nbsp; ${tx('Sürüm', 'Version')} ${A.version} (${A.date})</p>

        ${section(
          '1) Telif Hakkı Bildirimi',
          '1) Copyright Notice',
          `© ${A.year} ${A.author}. Calculus Visualiser adlı bu yazılım; kaynak kodu, kullanıcı arayüzü tasarımı, ders içerikleri, ` +
            'örnek üretim algoritmaları, adım adım çözüm metinleri, sınav soru bankaları, animasyonlar ve görsel/etkileşimli ' +
            'unsurları dâhil olmak üzere yazar tarafından oluşturulmuş bir eserdir ve telif hakları yazara aittir. Eser, ' +
            '5846 sayılı Fikir ve Sanat Eserleri Kanunu\'nun yanı sıra Bern Sözleşmesi (Edebî ve Sanatsal Eserlerin Korunmasına ' +
            'İlişkin Bern Sözleşmesi), TRIPS Anlaşması ve WIPO Telif Hakkı Antlaşması gibi uluslararası sözleşmeler uyarınca ' +
            'korunmaktadır; yazarın manevi hakları (eser sahibi olarak anılma ve eserin bütünlüğünün korunması) saklıdır.',
          `© ${A.year} ${A.author}. This software, Calculus Visualiser — including its source code, user-interface design, course ` +
            'content, random-example generation logic, step-by-step solution text, quiz question banks, animations, and all ' +
            'visual/interactive elements — is a work created by the author, who holds the copyright. The work is protected under ' +
            'Turkish Law No. 5846 on Intellectual and Artistic Works and under international treaties including the Berne Convention ' +
            'for the Protection of Literary and Artistic Works, the TRIPS Agreement and the WIPO Copyright Treaty. The author\'s moral ' +
            'rights (to be credited as the author and to the integrity of the work) are reserved.'
        )}

        ${section(
          '2) Lisans: Creative Commons BY-NC-ND 4.0',
          '2) Licence: Creative Commons BY-NC-ND 4.0',
          `Bu eser, <a href="${A.licenceUrl}" target="_blank" rel="noopener license">Creative Commons Atıf-GayriTicari-TürevYapılamaz 4.0 Uluslararası (CC BY-NC-ND 4.0)</a> ` +
            'lisansı ile sunulmaktadır. Kısaca: (BY) yazara atıf yapmak, lisansa bağlantı vermek ve değişiklik yapılmadığını belirtmek ' +
            'koşuluyla, (NC) ticari olmayan amaçlarla, (ND) <b>değiştirmeden</b> olduğu gibi kopyalayabilir ve paylaşabilirsiniz. ' +
            'Eserin değiştirilmiş, çevrilmiş veya uyarlanmış sürümlerini dağıtmak ya da ondan türev eser üretip yayımlamak, ' +
            'ticari amaçla kullanmak ve telif/atıf bildirimlerini kaldırmak bu lisansla izinli değildir. Bağlayıcı hukuki metin ' +
            `<a href="${A.legalUrl}" target="_blank" rel="noopener">lisansın resmî metnidir</a>; bu özet onun yerine geçmez. ` +
            'Lisans yalnızca yazarın özgün katkısını kapsar; aşağıdaki üçüncü taraf bileşenler kendi lisanslarına tabidir.',
          `This work is licensed under the <a href="${A.licenceUrl}" target="_blank" rel="noopener license">Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)</a> ` +
            'licence. In short: you may copy and share it as is — (BY) provided you credit the author, link to the licence and ' +
            'indicate that no changes were made, (NC) for non-commercial purposes only, (ND) <b>without modification</b>. ' +
            'Distributing modified, translated or adapted versions, publishing derivative works, commercial use, and removing ' +
            'copyright/attribution notices are not permitted under this licence. The legally binding text is ' +
            `<a href="${A.legalUrl}" target="_blank" rel="noopener">the official licence text</a>; this summary does not replace it. ` +
            'The licence covers only the author\'s original contribution; the third-party components listed below remain under their own licences.'
        )}

        ${section(
          '3) Nasıl Atıf Yapılır / Alıntılanır',
          '3) How to Attribute / Cite',
          `Önerilen atıf: <i>“${A.name} © ${A.year} ${A.author}, ${A.licence} lisansı ile.”</i> ` +
            `Kaynak gösterme (APA): ÇAĞLAR, H. E. (${A.year}). <i>${A.name}</i> (Sürüm ${A.version}) [İnteraktif yazılım]. ${A.licence}. ` +
            'Akademik yayında alıntılama için lütfen yazara bildirin.',
          `Suggested credit: <i>“${A.name} © ${A.year} ${A.author}, licensed under ${A.licence}.”</i> ` +
            `Citation (APA): ÇAĞLAR, H. E. (${A.year}). <i>${A.name}</i> (Version ${A.version}) [Interactive software]. ${A.licence}. ` +
            'For citation in an academic publication, please let the author know.'
        )}

        ${section(
          '4) Amaç ve Ticari Olmayan Nitelik',
          '4) Purpose and Non-Commercial Nature',
          'Bu program; Matematik/Kalkülüs derslerinde (limit, türev, integral, integral uygulamaları ve mühendislik uygulamaları; ' +
            'dizi-seri ve çok değişkenli kalkülüs bölümleri hazırlık aşamasındadır) öğrencilere kavramları görselleştirerek ve ' +
            'etkileşimli örneklerle pekiştirerek yardımcı olmak amacıyla, tamamen eğitim amaçlı ve kâr amacı gütmeksizin ' +
            'geliştirilmiştir. Yazılım ücret karşılığı satılmamakta, reklam veya ticari gelir amacı taşımamaktadır. Bu ticari ' +
            'olmayan nitelik, yazarın telif haklarından feragat ettiği veya eserin kamu malı (public domain) olduğu anlamına gelmez.',
          'This program was developed purely for educational purposes and without any profit motive, to help students in ' +
            'Mathematics/Calculus courses (limits, derivatives, integrals, applications of integration and engineering applications; ' +
            'sequences-and-series and multivariable calculus chapters are in preparation) visualise concepts and reinforce them ' +
            'through interactive examples. It is not sold and carries no advertising or commercial revenue purpose. This ' +
            'non-commercial nature does not mean the author waives any copyright, nor does it place the work in the public domain.'
        )}

        ${section(
          '5) Fikri Mülkiyet ve Özgünlük',
          '5) Intellectual Property and Originality',
          'Programdaki tüm rastgele örnek üretme algoritmaları, adım adım çözüm anlatımları, sınav soruları ve yanlış cevap ' +
            'analizleri özgün olarak yazara aittir. Konu başlıkları, standart kalkülüs müfredatını ve yaygın ders kitaplarındaki ' +
            '(ör. Thomas\' Calculus, Stewart Calculus) konu sıralamasını referans alabilir; ancak herhangi bir ders kitabından ' +
            'metin, şekil veya soru birebir kopyalanmamıştır. Yazılımda görülen şirket/marka benzeri adlar yalnızca gerçek hayat ' +
            'uygulaması örneği oluşturmak için seçilmiş, jenerik ve kurgusal referanslardır.',
          'Every random-example generator, step-by-step solution narrative, quiz question and wrong-answer analysis in this ' +
            'program is the author\'s original work. Topic headings may follow the standard calculus curriculum and the topic order ' +
            'commonly used in textbooks such as Thomas\' Calculus and Stewart\'s Calculus, but no text, figure, or problem has been ' +
            'copied verbatim from any textbook. Any company/brand-like names that appear are generic, fictional placeholders ' +
            'chosen solely to illustrate a real-world application.'
        )}

        <div class="about-section">
          <h3>${tx('6) Kaynaklar ve Önerilen Okumalar', '6) References and Suggested Reading')}</h3>
          <p>${tx(
            'Bu programın konu sırası ve kapsamı, yaygın üniversite kalkülüs müfredatını ve aşağıdaki ders kitaplarının konu düzenini izler. Programdaki metin, şekil, soru ve çözümler bu kitaplardan alınmamıştır, özgündür; kitaplar yalnızca daha derin okuma için önerilir. Bu kitapların yazar ve yayıncılarıyla bir bağlantı veya onay ilişkisi yoktur. ISBN numaraları baskıya, ülke sürümüne ve cilt/biçime göre değişir; kendi baskınızı kontrol edin.',
            'The topic order and scope of this program follow the common university calculus curriculum and the topic organisation of the textbooks below. The text, figures, problems and solutions in the program are not taken from these books; they are original, and the books are suggested only for deeper reading. There is no affiliation with or endorsement by the authors or publishers. ISBNs differ by edition, regional version and volume/format; please check your own edition.'
          )}</p>
          ${bookList()}
        </div>

        <div class="about-section">
          <h3>${tx('7) Üçüncü Taraf Yazılım Bildirimleri', '7) Third-Party Software Notices')}</h3>
          <p>${tx(
            'Bu program aşağıdaki açık kaynaklı bileşenleri, özgün lisans bildirimleriyle birlikte içerir. Bu bileşenler yazarın CC BY-NC-ND lisansından bağımsız olarak kendi lisanslarına tabidir.',
            'This program includes the following open-source components together with their original licence notices. They remain under their own licences, independent of the author\'s CC BY-NC-ND licence.'
          )}</p>
          <ul class="about-list">
            <li><b>KaTeX</b> v0.16.11 — Copyright (c) 2013-2020 Khan Academy and other contributors — MIT License (<code>lib/katex/LICENSE</code>) — <a href="https://katex.org" target="_blank" rel="noopener">katex.org</a></li>
            <li><b>Three.js</b> — Copyright 2010-2021 Three.js Authors — MIT License (<code>lib/three/LICENSE</code>) — <a href="https://threejs.org" target="_blank" rel="noopener">threejs.org</a></li>
          </ul>
          <details class="about-details"><summary>${tx('MIT Lisansı metni (KaTeX ve Three.js)', 'MIT Licence text (KaTeX and Three.js)')}</summary>
            <pre>The MIT License (MIT)

Copyright (c) 2013-2020 Khan Academy and other contributors  (KaTeX)
Copyright 2010-2021 Three.js Authors  (Three.js)

${MIT()}</pre>
          </details>
        </div>

        ${section(
          '8) Gizlilik ve Veri',
          '8) Privacy and Data',
          'Bu program hesap, giriş, izleme veya reklam içermez; kişisel veri toplamaz ve herhangi bir sunucuya veri göndermez. ' +
            'Tek dosya olarak internet bağlantısı olmadan çalışır. Yalnızca arayüz tercihlerinizi (dil, tema, yazı boyutu, panel ' +
            'durumu) cihazınızdaki tarayıcının yerel depolamasında (localStorage) saklar; bunları tarayıcı ayarlarından silebilirsiniz. ' +
            '"Yapay zekâya sor" düğmeleri ve LinkedIn bağlantısı yalnızca siz bastığınızda ilgili üçüncü taraf sitesini açar (soru metni panonuza kopyalanır); bu sitelerin kendi gizlilik koşulları geçerlidir.',
          'This program has no accounts, log-in, tracking or advertising; it collects no personal data and sends no data to any ' +
            'server. As a single file it works without an internet connection. It only stores your interface preferences (language, ' +
            'theme, text size, panel state) in your browser\'s local storage (localStorage) on your own device; you can delete them ' +
            'in the browser settings. ' +
            'The "Ask AI" buttons and the LinkedIn link open the respective third-party site only when you press them (the question text is copied to your clipboard); those sites\' own privacy terms apply.'
        )}

        ${section(
          '9) Sorumluluk Reddi',
          '9) Disclaimer of Warranty and Liability',
          'Bu yazılım "olduğu gibi" sunulmaktadır; doğruluğu, hatasız çalışacağı veya belirli bir amaca uygun olacağı konusunda ' +
            'açık ya da zımni herhangi bir garanti verilmemektedir. Program, resmî ders materyallerinin, öğretim üyesinin ' +
            'anlatımının veya ders kitabının yerini tutmaz; yalnızca ek bir çalışma aracıdır. Çözümler ve sonuçlar, sınav gibi ' +
            'önemli kararlarda güvenilmeden önce doğrulanmalıdır. Yazar; yazılımın kullanımından, olası hesaplama/gösterim ' +
            'hatalarından veya bu yazılıma dayanılarak alınan akademik kararlardan doğabilecek hiçbir doğrudan veya dolaylı ' +
            'zarardan, yürürlükteki hukukun izin verdiği ölçüde, sorumlu tutulamaz.',
          'This software is provided "as is", without any express or implied warranty of accuracy, error-free operation, or ' +
            'fitness for a particular purpose. It does not replace official course materials, the instructor\'s teaching, or the ' +
            'assigned textbook — it is only a supplementary study tool. Solutions and results should be verified before being relied ' +
            'on for important decisions such as an exam. To the extent permitted by applicable law, the author accepts no liability ' +
            'for any direct or indirect damage arising from the use of this software, from any calculation or display error it may ' +
            'contain, or from academic decisions made in reliance on it.'
        )}

        ${section(
          '10) Marka, Kurum ve Üçüncü Taraf Adları',
          '10) Trademarks, Institutions and Third-Party Names',
          'Bu yazılımda adı geçebilecek üniversite, bölüm, ders, ders kitabı veya yazılım adları yalnızca hangi ders için ' +
            'hazırlandığını veya hangi kaynağa atıf yapıldığını belirtmek amacıyla kullanılmış olabilir ve ilgili kurum veya ' +
            'hak sahibiyle bir ortaklık, onay veya resmi bağlantı iddiası taşımaz. Tüm ticari markalar ilgili sahiplerine aittir.',
          'Any university, department, course, textbook or software names that may appear in this software are used solely to ' +
            'indicate which course it was prepared for or which source is referenced, and do not imply any partnership, ' +
            'endorsement, or official affiliation. All trademarks are the property of their respective owners.'
        )}

        ${section(
          '11) İzin Talepleri, Telif İhlali Bildirimi ve İletişim',
          '11) Permission Requests, Copyright Infringement Notices and Contact',
          'CC BY-NC-ND 4.0 kapsamı dışındaki kullanımlar (ör. değiştirilmiş sürüm dağıtımı, çeviri/uyarlama, ticari kullanım) için ' +
            `yazardan önceden yazılı izin gerekir. İzin talepleri ve eserin izinsiz kullanıldığını düşündüğünüz durumlara ilişkin bildirimler için: ${mail}. ` +
            'Bildirimde lütfen ihlal edildiğini düşündüğünüz içeriği ve konumunu (bağlantı) ile iletişim bilgilerinizi belirtin.',
          'Uses outside the scope of CC BY-NC-ND 4.0 (for example distributing a modified version, translating/adapting, or commercial use) ' +
            `require prior written permission from the author. For permission requests and for notices about suspected unauthorised use of the work, contact: ${mail}. ` +
            'Please include the content you believe is infringing, where it can be found (a link), and your contact details.'
        )}

        ${section(
          '12) Sürüm, Değişiklikler ve Uygulanacak Hukuk',
          '12) Version, Changes and Governing Law',
          `Sürüm ${A.version} (${A.date}). Yazar, yazılımın içeriğini, işlevlerini veya bu bildirimin şartlarını önceden bildirimde ` +
            'bulunmaksızın güncelleme hakkını saklı tutar; bir sürüme verilen lisans, o sürümün dağıtımı için geçerliliğini korur. ' +
            'Bu bildirime Türkiye Cumhuriyeti hukuku uygulanır; zorunlu tüketici ve telif hakkı hükümleri saklıdır.',
          `Version ${A.version} (${A.date}). The author reserves the right to update the software\'s content, features, or the terms of this notice ` +
            'without prior announcement; a licence granted for a version remains valid for the distribution of that version. ' +
            'This notice is governed by the laws of the Republic of Türkiye, subject to mandatory consumer and copyright provisions.'
        )}

        <p class="about-footer">${tx(
          'Calculus Visualiser — Matematik/Kalkülüs dersleri için hazırlanmış etkileşimli bir kalkülüs görselleştirme aracıdır.',
          'Calculus Visualiser — an interactive calculus visualisation tool prepared for Mathematics/Calculus courses.'
        )}</p>
      </div>
    `;
  }

  render();
  const offLang = I18N.onChange(render);

  return {
    destroy() {
      offLang();
    },
  };
}
