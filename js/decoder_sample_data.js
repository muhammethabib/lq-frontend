// js/decoder_sample_data.js
// Stand-in for the Word Decoder endpoint until /word_decoder/results exists.
//
// The decoder is asked a different question from the search box. The reader
// gives a partial spelling, so the server answers with several candidate
// readings that all fit it, each backed by its own dictionary records:
//
//   pattern      the pattern the server matched, echoed back for the header
//   totals       counts shown under the pattern
//   expansions   offers to widen the match; count is how many rows it would add
//   groups[]     one block per match kind, in display order
//     key        stable identifier, the same set the search page uses
//     rows[]     one row per dictionary record
//       category            ENTRY | SUBENTRY | RELATED
//       candidateOttoman    the candidate reading this record supports
//       candidateLatin      its Latin transcription
//       headwordOttoman     the dictionary entry the record sits under
//       headwordLatin
//       dictionary / page   where it was found
//
// Rows arrive flat; the controller groups them by candidate, because which
// records belong to which reading is a display decision, not a data one.
//
// These are real records for the pattern ح ا ٭ ر: the reader can make out
// ha, elif and re, but not the third letter.

window.LQ_DECODER_RESULTS = {
  pattern: { display: "حا٭ر" },
  // What the endpoint offers when nothing fits the description: the readings
  // whose spelling comes nearest to it. Fixed here rather than derived from
  // the pattern, so the empty answer reads the same whatever is searched
  // while there is no backend to work them out.
  suggestions: [
    { ottoman: "حاضر", latin: "hâzır" },
    { ottoman: "حاذر", latin: "hâzir" },
    { ottoman: "حافر", latin: "hâfir" },
    { ottoman: "حاسر", latin: "hâsir" },
    { ottoman: "حاشر", latin: "hâşir" }
  ],
  totals: { records: 22, dictionaries: 9, volumes: 17 },
  expansions: [
    { key: "pronunciation", count: 14 },
    { key: "rika" },
    { key: "divani" }
  ],
  groups: [
    {
      key: "lemma",
      rows: [
        { category: "ENTRY", candidateOttoman: "حاضر", candidateLatin: "hâzır", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Kamus-ı Türki", page: "522" },
        { category: "ENTRY", candidateOttoman: "حاضر", candidateLatin: "hâzır", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Lugat-ı Naci", page: "412" },
        { category: "ENTRY", candidateOttoman: "حاضر", candidateLatin: "hâzır", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Kamusu'l-A'lam", page: "201" },
        { category: "RELATED", candidateOttoman: "حاضر", candidateLatin: "hâzır", headwordOttoman: "حضور", headwordLatin: "huzûr", dictionary: "Lehçe-i Osmani", page: "633" },
        { category: "RELATED", candidateOttoman: "حاضر", candidateLatin: "hâzır", headwordOttoman: "محضر", headwordLatin: "mahzar", dictionary: "Ahteri-i Kebir", page: "150" },
        { category: "ENTRY", candidateOttoman: "حاصر", candidateLatin: "hâsır", headwordOttoman: "حاصر", headwordLatin: "hâsır", dictionary: "Kamus-ı Fransevi - Musavver", page: "560" },
        { category: "RELATED", candidateOttoman: "حاصر", candidateLatin: "hâsır", headwordOttoman: "محاصره", headwordLatin: "muhâsara", dictionary: "Kamus-ı Türki", page: "523" },
        // A candidate with a single record renders as a plain row, not a group of one
        { category: "ENTRY", candidateOttoman: "حافر", candidateLatin: "hâfir", headwordOttoman: "حافر", headwordLatin: "hâfir", dictionary: "Ahteri-i Kebir", page: "152" },
        { category: "ENTRY", candidateOttoman: "حاجر", candidateLatin: "hâcir", headwordOttoman: "حاجر", headwordLatin: "hâcir", dictionary: "Lugat-ı Naci", page: "413" }
      ]
    },
    ,
    {
      key: "inflected",
      rows: [
        { category: "SUBENTRY", candidateOttoman: "حاضری", candidateLatin: "hâzırı", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Kamus-ı Türki", page: "522" },
        { category: "SUBENTRY", candidateOttoman: "حاضری", candidateLatin: "hâzırı", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Lehçe-i Osmani", page: "634" },
        { category: "SUBENTRY", candidateOttoman: "حاضره", candidateLatin: "hâzıra", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Lugat-ı Naci", page: "412" }
      ]
    },
    ,
    {
      // Empty on purpose: a section with no candidates says so rather than vanishing
      key: "lexicalizedInflected",
      rows: []
    },
    ,
    {
      key: "partial",
      rows: [
        { category: "ENTRY", candidateOttoman: "محاضره", candidateLatin: "muhâzara", headwordOttoman: "محاضره", headwordLatin: "muhâzara", dictionary: "Kamus-ı Türki", page: "1310" },
        { category: "ENTRY", candidateOttoman: "محاضره", candidateLatin: "muhâzara", headwordOttoman: "محاضره", headwordLatin: "muhâzara", dictionary: "Lexicon", page: "88" },
        { category: "RELATED", candidateOttoman: "استحضار", candidateLatin: "istihzâr", headwordOttoman: "حضور", headwordLatin: "huzûr", dictionary: "Ahteri-i Kebir", page: "151" },
        { category: "ENTRY", candidateOttoman: "محاضرات", candidateLatin: "muhâzarât", headwordOttoman: "محاضرات", headwordLatin: "muhâzarât", dictionary: "Kamusu'l-A'lam", page: "202" }
      ]
    },
    ,
    {
      key: "derived",
      rows: [
        { category: "ENTRY", candidateOttoman: "حاضرلق", candidateLatin: "hâzırlık", headwordOttoman: "حاضرلق", headwordLatin: "hâzırlık", dictionary: "Kamus-ı Türki", page: "524" },
        { category: "ENTRY", candidateOttoman: "حاضرلق", candidateLatin: "hâzırlık", headwordOttoman: "حاضرلق", headwordLatin: "hâzırlık", dictionary: "Lehçe-i Osmani", page: "635" },
        { category: "RELATED", candidateOttoman: "حاضرجه", candidateLatin: "hâzırca", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Lugat-ı Ebuzziya", page: "233" }
      ]
    },
    ,
    {
      key: "compounds",
      rows: [
        { category: "SUBENTRY", candidateOttoman: "حاضر جواب", candidateLatin: "hâzır-cevâb", headwordOttoman: "جواب", headwordLatin: "cevâb", dictionary: "Lugat-ı Naci", page: "414" }
      ]
    },
    ,
    {
      key: "phrases",
      rows: [
        { category: "SUBENTRY", candidateOttoman: "حاضر اولمق", candidateLatin: "hâzır olmak", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Kamus-ı Türki", page: "522" },
        { category: "SUBENTRY", candidateOttoman: "حاضر اولمق", candidateLatin: "hâzır olmak", headwordOttoman: "حاضر", headwordLatin: "hâzır", dictionary: "Türkçeden Almancaya Lügat Kitabı", page: "340" }
      ]
    }
  ]
};
