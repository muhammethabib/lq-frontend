// js/translations.js
// Turkish strings for the interface.
//
// English is written directly in the HTML, so this file only carries the
// Turkish equivalent for each data-i18n key. That keeps one page per feature
// instead of one page per language. The key names match the ones the reference
// mock used, so the two codebases stay comparable.
//
// The language controller reads window.LQ_TRANSLATIONS[<language>].

window.LQ_TRANSLATIONS = {
  tr: {
    // --- page chrome ---
    subtitle: "OSMANLI TÜRKÇESİ DİLBİLİMSEL ANALİZ ARACI",
    legacyLink: "Klasik sürüm",
    legacyTitle: "Önceki kararlı sürümü aç",
    ariaHome: "LexiQamus ana sayfa",
    menuHeading: "Menü",

    // --- side menu ---
    menuSignIn: "Giriş yap",
    menuSignUp: "Kaydol",
    menuAbout: "Hakkımızda",
    menuTeam: "Ekip",
    menuWhat: "LexiQamus Nedir?",
    menuGuide: "Kullanım Kılavuzu",
    menuInstitutional: "Kurumsal Üyeler",
    menuLQ3: "LexiQamus 3.0",
    menuV3DataModel: "Dijitalleştirme ve Veri Modeli",
    menuV3WhatsNew: "Yenilikler",
    menuLQ2: "LexiQamus 2.0",
    menuLexicon: "Lexicon Dijitalleştirme Projesi",
    menuV2WhatsNew: "Yenilikler",
    menuLQ1: "LexiQamus 1.0",
    menuUpdates: "Öneri ve Düzeltme Geçmişi",
    menuPricing: "Fiyatlar",

    // --- tabs ---
    tabDecoder: "Kelime Çözücü",
    tabSearch: "Ara",
    decoderSoon: "Kelime Çözücü kendi başına bir bölüm olarak yeniden yazılıyor.",
    decoderSoonNote: "Harflerini tam okuyamadığınız bir kelimeyi, okunamayan her harf yerine bir joker koyarak aramanızı sağlar.",

    // --- search bar ---
    btnSearch: "Ara",
    sourceOttoman: "OSM",
    sourceEnglish: "İNG",
    sourceEnglishTitle: "Redhouse'ta İngilizce tanımlar içinde ara",
    ariaMainSearch: "Aranacak kelime",
    placeholderLatin: "Latin harfleriyle ara...",
    placeholderEnglish: "İngilizce tanımları arayın...",
    placeholderOttoman: "عثمانلى حرفلريله آره...",
    dmlBtn: "Kütüphaneniz LexiQamus’a üye mi?",

    // --- filters ---
    filtersLabel: "Filtreler",
    filtersTitle: "Arama Filtreleri",
    filtersAll: "Tümü",
    filtersNone: "Hiçbiri",
    filtersColWord: "Kelime Türü",
    filtersColMatch: "Sonuçlar",
    selectAll: "Tümünü Seç",
    allDictionaries: "Tüm Sözlükler",
    noDictionaries: "Sözlük Seçilmedi",
    nDictionary: "{n} sözlük seçili",
    nDictionaries: "{n} sözlük seçili",

    // --- results header ---
    searchResultsLabel: "Arama Sonuçları",
    recordsFound: "Sonuç Bulundu.",
    dictsScanned: "Sözlük (17 Cilt) Tarandı.",
    spellingLabel: "YAZILIŞA GÖRE ARA",
    expandLabel: "ARAMAYI GENİŞLET",
    soundsLike: "Benzer Okunuş",

    // --- results table ---
    colResult: "Sonuç",
    colCategory: "Kategori",
    colEntry: "Madde Başı",
    colDict: "Sözlük",
    colPage: "Sayfa",
    colLeadsTo: "Şu maddede",
    colActions: "İşlemler",
    catEntry: "Madde Başı",
    catSubentry: "Alt Madde",
    catRelated: "İlişkili",
    readingVerified: "Editör onaylı okunuş",
    readingAuto: "Otomatik üretilmiş okunuş",
    cite: "Künye",
    editEntry: "Maddeyi düzenle",
    emptyState: "Bir kelime yazıp Ara düğmesine basın.",
    noResults: "Seçtiğiniz filtrelerle sonuç bulunamadı.",

    // --- result groups: <key>, <key>Note, <key>Example ---
    chipLemma: "Lemma",
    chipInflected: "Çekimli Biçimler",
    chipLexInfl: "Sözlükselleşmiş Çekimli Formlar",
    chipDerived: "Türemiş Biçimler",
    chipPhrases: "İbareler",
    chipCompounds: "Birleşik Kelimeler",
    chipPartial: "Benzer İmlalar",

    groupLemma: "LEMMA",
    groupLemmaNote: "Ek almamış sonuçlar; bir değerin temel veya tekil biçimi",
    groupLemmaExample: "<b>kalem</b>, <b>dost</b>",

    groupInflected: "ÇEKİMLİ BİÇİMLER",
    groupInflectedNote: "Arama teriminin çekimli biçimlerini gösteren sonuçlar",
    groupInflectedExample: "<b>kalem</b> &rarr; <b>kalem</b>i, <b>kalem</b>e",

    groupLexicalizedInflected: "SÖZLÜKSELLEŞMİŞ ÇEKİMLİ FORMLAR",
    groupLexicalizedInflectedNote: "Sözlükte kendine ait ayrı bir anlam kazanmış çekimli biçimler",
    groupLexicalizedInflectedExample: "<b>civar</b> &rarr; <b>civarında</b>",

    groupDerived: "TÜREMİŞ BİÇİMLER",
    groupDerivedNote: "Yapım ekleriyle oluşturulmuş kelimeleri gösteren sonuçlar",
    groupDerivedExample: "<b>kalem</b> &rarr; <b>kalem</b>lik, <b>kalem</b>ci",

    groupPhrases: "İBARELER",
    groupPhrasesNote: "Arama terimini içeren ibareler",
    groupPhrasesExample: "<b>nazar</b> &rarr; <b>nazar</b> değmek",

    groupCompounds: "BİRLEŞİK KELİMELER",
    groupCompoundsNote: "Arama terimini içeren birleşik kelimeler",
    groupCompoundsExample: "<b>nazar</b> &rarr; <b>nazar</b>gâh",

    groupPartial: "BENZER İMLALAR",
    groupPartialNote: "Arama terimine yakın bir imlayla yazılmış sonuçlar",
    groupPartialExample: ""
  }
};
