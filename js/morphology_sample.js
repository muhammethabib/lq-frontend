// js/morphology_sample.js
// Stand-in for the word-analysis endpoint.
//
//   GET /word_analysis/show?word=…
//
// How a word is built: the whole word at the top, then what it is made of,
// down to the pieces that cannot be taken apart. Each piece says which
// language it came from, and carries the notes the editors left on it.
//
//   origin   ar | fa | tr | other | mix, or a list where a piece draws on
//            more than one language
//   notes    what the editors marked about the piece
//   phrase   true where the word is two words written together, which is
//            shown with one origin badge per word rather than one for both
//
// The reference mock shows a crop of the word from the scan above each
// piece; the images for it were never in the repository, so a record here
// carries no crop and the card shows the reading alone. A backend that has
// the crops can send a "crop" beside "latin".

window.LQ_MORPHOLOGY_SAMPLE = {
  "ihlasperverane": {
    "ottoman": "اخلاص‌پرورانه",
    "latin": "ihlasperverane",
    "origin": "mix",
    "notes": [
      "Unclear Pronunciation",
      "Turkish Verb",
      "Incorrect",
      "Unused"
    ],
    "parts": [
      {
        "ottoman": "اخلاص‌پرور",
        "latin": "ihlasperver",
        "origin": "mix",
        "notes": [
          "Turkish Verb",
          "Incorrect",
          "Unused"
        ],
        "parts": [
          {
            "ottoman": "پرور",
            "latin": "perver",
            "origin": "fa",
            "notes": [
              "Unused"
            ]
          },
          {
            "ottoman": "اخلاص",
            "latin": "ihlas",
            "origin": "ar",
            "notes": [
              "Turkish Verb"
            ]
          }
        ]
      }
    ]
  },
  "halbuki": {
    "ottoman": "حالبوکی",
    "latin": "halbuki",
    "origin": [
      "fa",
      "tr",
      "ar"
    ],
    "parts": [
      {
        "ottoman": "کی",
        "latin": "ki",
        "origin": "fa"
      },
      {
        "ottoman": "بو",
        "latin": "bu",
        "origin": "tr"
      },
      {
        "ottoman": "حال",
        "latin": "hal",
        "origin": "ar"
      }
    ]
  },
  "iskara": {
    "ottoman": "اسقارە",
    "latin": "iskara",
    "origin": "other"
  },
  "silgi": {
    "ottoman": "سیلكی",
    "latin": "silgi",
    "origin": "tr",
    "parts": [
      {
        "ottoman": "سیل",
        "latin": "sil",
        "origin": "tr"
      }
    ]
  },
  "telgraf-hatti": {
    "ottoman": "تلغراف خطی",
    "latin": "telgraf hattı",
    "origin": [
      "tr",
      "ar",
      "other"
    ],
    "phrase": true,
    "parts": [
      {
        "ottoman": "خطی",
        "latin": "hattı",
        "origin": [
          "tr",
          "ar"
        ],
        "parts": [
          {
            "ottoman": "خط",
            "latin": "hat",
            "origin": "ar"
          }
        ]
      },
      {
        "ottoman": "تلغراف",
        "latin": "telgraf",
        "origin": "other"
      }
    ]
  },
  "telgrafilk": {
    "ottoman": "تلغرافجیلق",
    "latin": "telgrafçılık",
    "origin": [
      "tr",
      "other"
    ],
    "parts": [
      {
        "ottoman": "تلغرافجی",
        "latin": "telgrafçı",
        "origin": [
          "tr",
          "other"
        ],
        "parts": [
          {
            "ottoman": "تلغراف",
            "latin": "telgraf",
            "origin": "other"
          }
        ]
      }
    ]
  },
  "telgrafi": {
    "ottoman": "تلغرافی",
    "latin": "telgrafi",
    "origin": [
      "ar",
      "other"
    ],
    "parts": [
      {
        "ottoman": "تلغراف",
        "latin": "telgraf",
        "origin": "other"
      }
    ]
  },
  "telgrafname": {
    "ottoman": "تلغرافنامه",
    "latin": "telgrafname",
    "origin": [
      "fa",
      "other"
    ],
    "parts": [
      {
        "ottoman": "نامه",
        "latin": "name",
        "origin": "fa"
      },
      {
        "ottoman": "تلغراف",
        "latin": "telgraf",
        "origin": "other"
      }
    ]
  }
};
