// js/sample_data.js
// Stand-in for the search endpoint until /search_output/results exists.
//
// The shape below is what the backend is expected to return, so the row
// renderer needs no change once the real route is wired up:
//
//   query        the term that was searched, in both scripts
//   totals       counts shown in the results header
//   spellings    alternative spellings offered above the results
//   groups[]     one block per match kind, in display order
//     key        stable identifier used for the anchor and the i18n keys
//     count      total rows in this group on the server, not just the ones sent
//     rows[]     result rows
//       category  ENTRY | SUBENTRY | RELATED  (drives the category badge)
//       resultLatin / resultOttoman    the matched form
//       headwordLatin / headwordOttoman the dictionary entry it sits under
//       dictionary / page               where it was found
//       readingVerified                 false means the Latin reading is machine-generated
//   suggestions  offered when nothing matched: the closest spellings, best first
//       misspelling                     present when the printed form is a known
//                                       misspelling; .crop names the piece of the
//                                       scan showing the word as it was printed
//
// The rows are real records from the LexiQamus corpus for the term نظر
// (nazar), including deliberately long values so row wrapping can be checked
// against realistic content rather than one short sample.

window.LQ_SAMPLE_RESULTS = {
  query: { latin: "nazar", ottoman: "نظر" },
  totals: { records: 86, dictionaries: 9, volumes: 17 },
  spellings: [
    { text: "نظر", script: "ottoman", active: true },
    { text: "نزر", script: "ottoman", active: false },
    { text: "nazar", script: "latin", active: false },
    { text: "nazır", script: "latin", active: false }
  ],
  similarPronunciationCount: 38,
  // What the endpoint offers when nothing matched: the spellings closest to
  // what was typed, in both scripts, best first.
  suggestions: [
    { ottoman: "ناظر", latin: "nâzır" },
    { ottoman: "نظری", latin: "nazarî" },
    { ottoman: "نظره", latin: "nazra" },
    { ottoman: "منظر", latin: "manzar" },
    { ottoman: "منظره", latin: "manzara" },
    { ottoman: "نظارت", latin: "nezâret" },
    { ottoman: "انتظار", latin: "intizâr" },
    { ottoman: "مناظره", latin: "münâzara" },
    { ottoman: "نظریه", latin: "nazariye" },
    { ottoman: "نظائر", latin: "nezâir" },
    { ottoman: "نظراً", latin: "nazaran" },
    { ottoman: "تناظر", latin: "tenâzur" }
  ],
  groups: [
    {
      key: "lemma",
      count: 60,
      rows: [
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lugat-ı Naci", page: "812", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Türki", page: "1451", readingVerified: false },
        // Long values: the first wraps in the result column, the second in the headword column
        { category: "ENTRY", resultLatin: "nazar-ı müsamaha ile bakılmak", resultOttoman: "نظر مسامحه ايله باقيلمق", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lugat-ı Naci", page: "813", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar-ı dikkate alınmasını istirham eylemek", resultOttoman: "نظر دقته آلينمه‌سنی استرحام ايله‌مك", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "hüsn-i nazarla muamele etmek", headwordOttoman: "حسن نظرله معامله ايتمك", dictionary: "Redhouse", page: "2022", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı itibara alınmamasını rica etmek", headwordOttoman: "نظر اعتباره آلينمامه‌سنی رجا ايتمك", dictionary: "Lehçe-i Osmani", page: "901", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "halbuki", headwordOttoman: "حالبوکی", dictionary: "Redhouse", page: "2021", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "iskara", headwordOttoman: "اسقارە", dictionary: "Ahteri-i Kebir", page: "940", readingVerified: false },
        // A row whose printed form is a known misspelling: the mark beside it
        // shows the word as the page has it and opens that page.
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "manzara", headwordOttoman: "منظره", dictionary: "Lehçe-i Osmani", page: "900", readingVerified: false,
          misspelling: { crop: "manzara.jpg" } },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "ehl-i nazar", headwordOttoman: "اهل نظر", dictionary: "Vankulu", page: "550", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Şemseddin Sami", page: "1403", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Tuhfe-i Vehbi", page: "98", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar etmek", headwordOttoman: "نظر ايتمك", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar eylemek", headwordOttoman: "نظر ايله‌مك", dictionary: "Lugat-ı Naci", page: "813", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazarî", headwordOttoman: "نظری", dictionary: "Kamus-ı Fransevi", page: "1205", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı dikkat", headwordOttoman: "نظر دقت", dictionary: "Lehçe-i Osmani", page: "901", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Alam", page: "310", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Ahteri-i Kebir", page: "941", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı âmm", headwordOttoman: "نظر عام", dictionary: "Redhouse", page: "2022", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "bir nazar", headwordOttoman: "بر نظر", dictionary: "Lugat-ı Ebuzziya", page: "551", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar boncuğu", headwordOttoman: "نظر بونجغی", dictionary: "Vankulu", page: "551", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "sarf-ı nazar", headwordOttoman: "صرف نظر", dictionary: "Şemseddin Sami", page: "1404", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Burhan-ı Katı", page: "677", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Mütercim Asım", page: "1288", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "ilm-i nazar", headwordOttoman: "علم نظر", dictionary: "Kamus-ı Türki", page: "1453", readingVerified: false },
        // From here on the rows are only reached through Show more.
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "kem-nazar", headwordOttoman: "كم نظر", dictionary: "Lugat-ı Naci", page: "814", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazargâh", headwordOttoman: "نظرگاه", dictionary: "Burhan-ı Katı", page: "678", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar değmek", headwordOttoman: "نظر دكمك", dictionary: "Mütercim Asım", page: "1289", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Tuhfe-i Şahidi", page: "204", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Ebüssürur", page: "445", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı itibar", headwordOttoman: "نظر اعتبار", dictionary: "Ahteri-i Kebir", page: "942", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı şefkat", headwordOttoman: "نظر شفقت", dictionary: "Lehçe-i Osmani", page: "902", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "manzum", headwordOttoman: "منظوم", dictionary: "Tuhfe-i Şahidi", page: "205", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nâzır", headwordOttoman: "ناظر", dictionary: "Kamus-ı Ebüssürur", page: "446", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lügat-ı Remzi", page: "730", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı hayret", headwordOttoman: "نظر حیرت", dictionary: "Mütercim Asım", page: "1290", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "münâzara", headwordOttoman: "مناظره", dictionary: "Lügat-ı Remzi", page: "731", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lehçetü'l-Lügat", page: "512", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Osmani", page: "1120", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Resimli Kamus-ı Osmani", page: "987", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lugat-ı Cudi", page: "413", readingVerified: false },
        // Longest dictionary name in the corpus, so the column is exercised
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Müntahabat-ı Lügat-ı Osmaniye", page: "233", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Meninski", page: "5177", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Bianchi", page: "1044", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Hindoglu", page: "512", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "hüsn-i nazar", headwordOttoman: "حسن نظر", dictionary: "Kamus-ı Türki", page: "1454", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "atf-ı nazar", headwordOttoman: "عطف نظر", dictionary: "Lugat-ı Naci", page: "815", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "im'ân-ı nazar", headwordOttoman: "امعان نظر", dictionary: "Redhouse", page: "2023", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nokta-i nazar", headwordOttoman: "نقطه نظر", dictionary: "Kamus-ı Osmani", page: "1121", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "kat'-ı nazar", headwordOttoman: "قطع نظر", dictionary: "Lehçetü'l-Lügat", page: "513", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı dikkate almak", headwordOttoman: "نظر دقته آلمق", dictionary: "Şemseddin Sami", page: "1405", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "daire-i nazar", headwordOttoman: "دائره نظر", dictionary: "Lugat-ı Cudi", page: "414", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar-ı mütalaa", headwordOttoman: "نظر مطالعه", dictionary: "Kamus-ı Fransevi", page: "1206", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazaran", headwordOttoman: "نظراً", dictionary: "Kamus-ı Türki", page: "1455", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazariye", headwordOttoman: "نظریه", dictionary: "Resimli Kamus-ı Osmani", page: "988", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazariyat", headwordOttoman: "نظریات", dictionary: "Kamus-ı Osmani", page: "1122", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "manzur", headwordOttoman: "منظور", dictionary: "Lugat-ı Ebuzziya", page: "552", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "manzume", headwordOttoman: "منظومه", dictionary: "Lehçetü'l-Lügat", page: "514", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazire", headwordOttoman: "نظیره", dictionary: "Meninski", page: "5178", readingVerified: true },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nezaret", headwordOttoman: "نظارت", dictionary: "Bianchi", page: "1045", readingVerified: false }
      ]
    },
    ,
    {
      key: "inflected",
      count: 6,
      rows: [
        { category: "SUBENTRY", resultLatin: "nazarı", resultOttoman: "نظری", headwordLatin: "silgi", headwordOttoman: "سیلكی", dictionary: "Tuhfe-i Vehbi", page: "115", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazara", resultOttoman: "نظره", headwordLatin: "nâzır", headwordOttoman: "ناظر", dictionary: "Lugat-ı Cudi", page: "412", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazarda", resultOttoman: "نظرده", headwordLatin: "manzara", headwordOttoman: "منظره", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: true,
          misspelling: { crop: "manzara.jpg" } },
        { category: "RELATED", resultLatin: "nazardan", resultOttoman: "نظردن", headwordLatin: "telgraf hattı", headwordOttoman: "تلغراف خطی", dictionary: "Redhouse", page: "2022", readingVerified: false },
        { category: "RELATED", resultLatin: "nazarlar", resultOttoman: "نظرلر", headwordLatin: "nazar-ı dikkati celbetmek", headwordOttoman: "نظر دقتی جلب ايتمك", dictionary: "Kamus-ı Fransevi", page: "1205", readingVerified: false },
        { category: "RELATED", resultLatin: "nazarla", resultOttoman: "نظرله", headwordLatin: "nazar boncuğu", headwordOttoman: "نظر بونجغی", dictionary: "Lehçe-i Osmani", page: "901", readingVerified: true }
      ]
    },
    ,
    {
      key: "lexicalizedInflected",
      count: 1,
      rows: [
        { category: "SUBENTRY", resultLatin: "nazarında", resultOttoman: "نظرنده", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: false }
      ]
    },
    ,
    {
      key: "partial",
      count: 6,
      rows: [
        { category: "ENTRY", resultLatin: "nazarsem etmek", resultOttoman: "نظرسم ايتمك", headwordLatin: "nazarsem", headwordOttoman: "نظرسم", dictionary: "Kamus-ı Türki", page: "888", readingVerified: false },
        { category: "ENTRY", resultLatin: "kenazar", resultOttoman: "كنظر", headwordLatin: "kenazar", headwordOttoman: "كنظر", dictionary: "Kamus-ı Türki", page: "888", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazarşe", resultOttoman: "نظرشه", headwordLatin: "nazarşe", headwordOttoman: "نظرشه", dictionary: "Vankulu", page: "601", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "anazarlanmak", resultOttoman: "آنظرلانمق", headwordLatin: "ana", headwordOttoman: "آنا", dictionary: "Lugat-ı Ebuzziya", page: "551", readingVerified: false },
        { category: "RELATED", resultLatin: "tınazar", resultOttoman: "طينظر", headwordLatin: "tın", headwordOttoman: "طين", dictionary: "Redhouse", page: "1905", readingVerified: false },
        { category: "RELATED", resultLatin: "venazar", resultOttoman: "ونظر", headwordLatin: "ve", headwordOttoman: "و", dictionary: "Ahteri-i Kebir", page: "330", readingVerified: true }
      ]
    },
    ,
    {
      key: "derived",
      count: 6,
      rows: [
        { category: "ENTRY", resultLatin: "nazarlık", resultOttoman: "نظرلق", headwordLatin: "nazarlık", headwordOttoman: "نظرلق", dictionary: "Kamus-ı Türki", page: "1451", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazarî", resultOttoman: "نظری", headwordLatin: "nazarî", headwordOttoman: "نظری", dictionary: "Lugat-ı Naci", page: "813", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazargâh", resultOttoman: "نظرگاه", headwordLatin: "telgrafçılık", headwordOttoman: "تلغرافجیلق", dictionary: "Redhouse", page: "2022", readingVerified: true },
        { category: "RELATED", resultLatin: "nâzır", resultOttoman: "ناظر", headwordLatin: "telgrafname", headwordOttoman: "تلغرافنامه", dictionary: "Kamus-ı Fransevi", page: "1206", readingVerified: false },
        { category: "RELATED", resultLatin: "münâzara", resultOttoman: "مناظره", headwordLatin: "telgrafi", headwordOttoman: "تلغرافی", dictionary: "Ahteri-i Kebir", page: "102", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "manzara", resultOttoman: "منظره", headwordLatin: "manzara", headwordOttoman: "منظره", dictionary: "Kamus-ı Türki", page: "1417", readingVerified: true,
          misspelling: { crop: "manzara.jpg" } }
      ]
    },
    ,
    {
      key: "compounds",
      count: 2,
      rows: [
        { category: "ENTRY", resultLatin: "kem-nazar", resultOttoman: "كم نظر", headwordLatin: "kem-nazar", headwordOttoman: "كم نظر", dictionary: "Lehçe-i Osmani", page: "442", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazargâh", resultOttoman: "نظرگاه", headwordLatin: "nazargâh", headwordOttoman: "نظرگاه", dictionary: "Redhouse", page: "2081", readingVerified: false }
      ]
    },
    ,
    {
      key: "phrases",
      count: 5,
      rows: [
        { category: "ENTRY", resultLatin: "nazar-ı dikkat", resultOttoman: "نظر دقت", headwordLatin: "nazar-ı dikkat", headwordOttoman: "نظر دقت", dictionary: "Kamus-ı Türki", page: "1451", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "sarf-ı nazar", resultOttoman: "صرف نظر", headwordLatin: "ihlasperverane", headwordOttoman: "اخلاص‌پرورانه", dictionary: "Lugat-ı Naci", page: "490", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazar-ı âmmi", resultOttoman: "نظر عامی", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Redhouse", page: "2022", readingVerified: true },
        { category: "RELATED", resultLatin: "nazar değmek", resultOttoman: "نظر دكمك", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Fransevi", page: "1100", readingVerified: false },
        { category: "RELATED", resultLatin: "ilm-i nazar", resultOttoman: "علم نظر", headwordLatin: "ilm", headwordOttoman: "علم", dictionary: "Kamus-ı Alam", page: "310", readingVerified: false }
      ]
    }
  ]
};
