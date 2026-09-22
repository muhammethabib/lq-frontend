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
  groups: [
    {
      key: "lemma",
      count: 60,
      rows: [
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lugat-ı Naci", page: "812", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Türki", page: "1451", readingVerified: true },
        // Long values: the first wraps in the result column, the second in the headword column
        { category: "ENTRY", resultLatin: "nazar-ı müsamaha ile bakılmak", resultOttoman: "نظر مسامحه ايله باقيلمق", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Lugat-ı Naci", page: "813", readingVerified: false },
        { category: "ENTRY", resultLatin: "nazar-ı dikkate alınmasını istirham eylemek", resultOttoman: "نظر دقته آلينمه‌سنی استرحام ايله‌مك", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "iskara", headwordOttoman: "اسقارە", dictionary: "Ahteri-i Kebir", page: "940", readingVerified: true },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "manzara", headwordOttoman: "منظره", dictionary: "Lehçe-i Osmani", page: "900", readingVerified: false },
        { category: "RELATED", resultLatin: "nazar", resultOttoman: "نظر", headwordLatin: "nazarî", headwordOttoman: "نظری", dictionary: "Kamus-ı Fransevi", page: "1205", readingVerified: true }
      ]
    },
    {
      key: "inflected",
      count: 6,
      rows: [
        { category: "SUBENTRY", resultLatin: "nazarı", resultOttoman: "نظری", headwordLatin: "silgi", headwordOttoman: "سیلكی", dictionary: "Tuhfe-i Vehbi", page: "115", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "nazara", resultOttoman: "نظره", headwordLatin: "nâzır", headwordOttoman: "ناظر", dictionary: "Lugat-ı Cudi", page: "412", readingVerified: false },
        { category: "SUBENTRY", resultLatin: "nazarda", resultOttoman: "نظرده", headwordLatin: "manzara", headwordOttoman: "منظره", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: false }
      ]
    },
    {
      key: "lexicalizedInflected",
      count: 1,
      rows: [
        { category: "SUBENTRY", resultLatin: "nazarında", resultOttoman: "نظرنده", headwordLatin: "nazar", headwordOttoman: "نظر", dictionary: "Kamus-ı Türki", page: "1452", readingVerified: true }
      ]
    },
    {
      key: "derived",
      count: 6,
      rows: [
        { category: "ENTRY", resultLatin: "nazarlık", resultOttoman: "نظرلق", headwordLatin: "nazarlık", headwordOttoman: "نظرلق", dictionary: "Kamus-ı Türki", page: "1451", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazarî", resultOttoman: "نظری", headwordLatin: "nazarî", headwordOttoman: "نظری", dictionary: "Lugat-ı Naci", page: "813", readingVerified: true }
      ]
    },
    {
      key: "phrases",
      count: 5,
      rows: [
        { category: "ENTRY", resultLatin: "nazar-ı dikkat", resultOttoman: "نظر دقت", headwordLatin: "nazar-ı dikkat", headwordOttoman: "نظر دقت", dictionary: "Kamus-ı Türki", page: "1451", readingVerified: true },
        { category: "SUBENTRY", resultLatin: "sarf-ı nazar", resultOttoman: "صرف نظر", headwordLatin: "ihlasperverane", headwordOttoman: "اخلاص‌پرورانه", dictionary: "Lugat-ı Naci", page: "490", readingVerified: false }
      ]
    },
    {
      key: "compounds",
      count: 2,
      rows: [
        { category: "ENTRY", resultLatin: "kem-nazar", resultOttoman: "كم نظر", headwordLatin: "kem-nazar", headwordOttoman: "كم نظر", dictionary: "Lehçe-i Osmani", page: "442", readingVerified: true },
        { category: "ENTRY", resultLatin: "nazargâh", resultOttoman: "نظرگاه", headwordLatin: "nazargâh", headwordOttoman: "نظرگاه", dictionary: "Redhouse", page: "2081", readingVerified: true }
      ]
    },
    {
      key: "partial",
      count: 6,
      rows: [
        { category: "ENTRY", resultLatin: "nazarsem etmek", resultOttoman: "نظرسم ايتمك", headwordLatin: "nazarsem", headwordOttoman: "نظرسم", dictionary: "Kamus-ı Türki", page: "888", readingVerified: false },
        { category: "ENTRY", resultLatin: "kenazar", resultOttoman: "كنظر", headwordLatin: "kenazar", headwordOttoman: "كنظر", dictionary: "Kamus-ı Türki", page: "888", readingVerified: true }
      ]
    }
  ]
};

// Publication year per dictionary, shown next to the dictionary name.
// On the server this comes from the dictionary record.
window.LQ_DICTIONARY_YEARS = {
  "Ahteri-i Kebir": 1826,
  "Bianchi": 1846,
  "Burhan-ı Katı": 1797,
  "Hindoglu": 1838,
  "Kamus-ı Alam": 1889,
  "Kamus-ı Ebüssürur": 1884,
  "Kamus-ı Fransevi": 1882,
  "Kamus-ı Osmani": 1896,
  "Kamus-ı Türki": 1899,
  "Lehçe-i Osmani": 1888,
  "Lehçetü'l-Lügat": 1802,
  "Lugat-ı Cudi": 1913,
  "Lugat-ı Ebuzziya": 1888,
  "Lugat-ı Naci": 1901,
  "Lügat-ı Remzi": 1888,
  "Meninski": 1680,
  "Müntahabat-ı Lügat-ı Osmaniye": 1852,
  "Mütercim Asım": 1817,
  "Redhouse": 1890,
  "Resimli Kamus-ı Osmani": 1911,
  "Tuhfe-i Vehbi": 1798,
  "Tuhfe-i Şahidi": 1515,
  "Vankulu": 1729,
  "Şemseddin Sami": 1899
};
