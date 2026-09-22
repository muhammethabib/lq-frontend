// js/dictionaries.js
// The works in the database, with what a citation needs.
//
// The search endpoint returns a dictionary by name, so this is the lookup
// that turns that name into a reference: the key must be exactly the name
// the endpoint sends. At integration this becomes a table, and a stable id
// on each record would be steadier than the name; until then the names here
// and in the sample data have to be kept spelled the same.
//
// A city is a name and differs by language, so it is given in both.

window.LQ_DICTIONARIES = {
  "Ahteri-i Kebir": { author: "Ahterî Mustafa Efendi", year: 1826, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Bianchi": { author: "Thomas-Xavier Bianchi", year: 1846, volume: 2, publisher: "Imprimerie Royale", city: { en: "Vienna", tr: "Viyana" } },
  "Burhan-ı Katı": { author: "Mütercim Âsım Efendi", year: 1797, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Hindoglu": { author: "Artin Hindoğlu", year: 1838, volume: 1, publisher: "F. Beck", city: { en: "Vienna", tr: "Viyana" } },
  "Kamus-ı Alam": { author: "Şemseddin Sami", year: 1889, volume: 6, publisher: "Mihran Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Kamus-ı Ebüssürur": { author: "Ebüssürur Efendi", year: 1884, volume: 1, publisher: "Matbaa-i Osmaniye", city: { en: "Istanbul", tr: "İstanbul" } },
  "Kamus-ı Fransevi": { author: "Şemseddin Sami", year: 1882, volume: 2, publisher: "Mihran Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Kamus-ı Osmani": { author: "Mehmed Salahi", year: 1896, volume: 4, publisher: "Mahmud Bey Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Kamus-ı Türki": { author: "Şemseddin Sami", year: 1899, volume: 1, publisher: "İkdam Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Lehçe-i Osmani": { author: "Ahmed Vefik Paşa", year: 1888, volume: 1, publisher: "Mahmud Bey Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Lehçetü'l-Lügat": { author: "Mehmed Esad Efendi", year: 1802, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Lugat-ı Cudi": { author: "İbrahim Cûdî Efendi", year: 1913, volume: 1, publisher: "Karadeniz Matbaası", city: { en: "Trabzon", tr: "Trabzon" } },
  "Lugat-ı Ebuzziya": { author: "Ebüzziya Tevfik", year: 1888, volume: 1, publisher: "Matbaa-i Ebüzziya", city: { en: "Istanbul", tr: "İstanbul" } },
  "Lugat-ı Naci": { author: "Muallim Naci", year: 1901, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Lügat-ı Remzi": { author: "Hüseyin Remzi", year: 1888, volume: 2, publisher: "Hüseyin Remzi Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Meninski": { author: "Franciszek Meniński", year: 1680, volume: 3, publisher: "Typographia Orientalis", city: { en: "Vienna", tr: "Viyana" } },
  "Müntahabat-ı Lügat-ı Osmaniye": { author: "Cemiyet-i İlmiye-i Osmaniye", year: 1852, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Mütercim Asım": { author: "Mütercim Âsım Efendi", year: 1817, volume: 3, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Redhouse": { author: "James W. Redhouse", year: 1890, volume: 1, publisher: "A. H. Boyajian", city: { en: "Istanbul", tr: "İstanbul" } },
  "Resimli Kamus-ı Osmani": { author: "Ali Seydi", year: 1911, volume: 2, publisher: "Matbaa-i Kütübhane-i Cihan", city: { en: "Istanbul", tr: "İstanbul" } },
  "Tuhfe-i Vehbi": { author: "Sünbülzade Vehbi", year: 1798, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Tuhfe-i Şahidi": { author: "İbrahim Şahidî", year: 1515, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Vankulu": { author: "Vankulu Mehmed Efendi", year: 1729, volume: 2, publisher: "Darü't-Tıbaati'l-Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Şemseddin Sami": { author: "Şemseddin Sami", year: 1899, volume: 1, publisher: "İkdam Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },

  // Named separately in the sample data, so they need their own record:
  // a work the search returns under a name with no entry here would cite as
  // a row of dashes.
  "Kamusu'l-A'lam": { author: "Şemseddin Sami", year: 1889, volume: 6, publisher: "Mihran Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Kamus-ı Fransevi - Musavver": { author: "Şemseddin Sami", year: 1905, volume: 1, publisher: "Mihran Matbaası", city: { en: "Istanbul", tr: "İstanbul" } },
  "Türkçeden Almancaya Lügat Kitabı": { author: "Galancızade Hakkı Tevfik", year: 1907, volume: 1, publisher: "Matbaa-i Âmire", city: { en: "Istanbul", tr: "İstanbul" } },
  "Lexicon": { author: "James W. Redhouse", year: 1890, volume: 1, publisher: "A. H. Boyajian", city: { en: "Istanbul", tr: "İstanbul" } }
};
