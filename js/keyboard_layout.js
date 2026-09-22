// js/keyboard_layout.js
// The on-screen Ottoman keyboard, as data.
//
// The keys are grouped by letter family rather than by QWERTY, because a
// reader working from a manuscript recognises a shape first and only then
// decides which letter it is.
//
// Three kinds of key:
//
//   letter   a specific letter, written into the box as it is
//   rasm     the bare skeleton shared by several letters, with an asterisk
//            marking where dots would sit. Picking one says "this shape, dots
//            unclear", and `matches` lists the letters it stands for.
//   wildcard "a letter I cannot read at all" or "an unknown number of letters"
//
// A rasm key carries its own base character, so nothing has to be drawn: the
// dotless forms already exist in Unicode and render in Noto Naskh Arabic.

window.LQ_KEYBOARD_LAYOUT = {
  // Written into the pattern for the two wildcards
  wildcards: {
    any: { symbol: "٭", labelKey: "wildcardAny" },   // U+066D, one unreadable letter
    many: { symbol: "…", labelKey: "wildcardMany" }  // an unknown number of letters
  },

  basic: [
    [
      { type: "letter", char: "ا" },
      { type: "letter", char: "ء" },
      { type: "rasm", char: "ٮ", dots: "none", matches: ["ن", "ب", "پ", "ت", "ث", "ء", "ی"] },
      { type: "rasm", char: "ٮ", dots: "above", matches: ["ت", "ث", "ن"] },
      { type: "rasm", char: "ٮ", dots: "below", matches: ["ب", "پ", "ی"] },
      { type: "letter", char: "ب" },
      { type: "letter", char: "پ" },
      { type: "letter", char: "ت" },
      { type: "letter", char: "ث" }
    ],
    [
      { type: "letter", char: "ج" },
      { type: "letter", char: "چ" },
      { type: "letter", char: "ح" },
      { type: "letter", char: "خ" },
      { type: "rasm", char: "ح", dots: "either", matches: ["ج", "چ", "ح", "خ"] }
    ],
    [
      { type: "letter", char: "د" },
      { type: "letter", char: "ذ" },
      { type: "rasm", char: "د", dots: "above", matches: ["د", "ذ"] },
      { type: "letter", char: "ر" },
      { type: "letter", char: "ز" },
      { type: "letter", char: "ژ" },
      { type: "rasm", char: "ر", dots: "above", matches: ["ر", "ز", "ژ"] }
    ],
    [
      { type: "letter", char: "س" },
      { type: "letter", char: "ش" },
      { type: "rasm", char: "س", dots: "above", matches: ["س", "ش"] },
      { type: "letter", char: "ص" },
      { type: "letter", char: "ض" },
      { type: "rasm", char: "ص", dots: "above", matches: ["ص", "ض"] },
      { type: "letter", char: "ط" },
      { type: "letter", char: "ظ" },
      { type: "rasm", char: "ط", dots: "above", matches: ["ط", "ظ"] }
    ],
    [
      { type: "letter", char: "ع" },
      { type: "letter", char: "غ" },
      { type: "rasm", char: "ع", dots: "above", matches: ["ع", "غ"] },
      { type: "letter", char: "ف" },
      { type: "letter", char: "ق" },
      { type: "rasm", char: "ڡ", dots: "above", matches: ["ق", "ف"] }
    ],
    [
      { type: "letter", char: "ك" },
      { type: "letter", char: "گ" },
      { type: "letter", char: "ڭ" },
      { type: "rasm", char: "ك", dots: "above", matches: ["ك", "گ", "ڭ"] }
    ],
    [
      { type: "letter", char: "ل" },
      { type: "letter", char: "م" },
      { type: "letter", char: "ن" },
      { type: "letter", char: "و" },
      { type: "letter", char: "ه", matches: ["ە", "ه", "ة"] },
      { type: "letter", char: "ى" }
    ]
  ],

  // Everything the basic panel leaves out: the hamza carriers, the he
  // variants, and the zero-width space for letters that look separated but
  // belong to one word.
  advanced: [
    [
      { type: "letter", char: "ا" },
      { type: "letter", char: "آ" },
      { type: "letter", char: "أ" },
      { type: "letter", char: "إ" },
      { type: "letter", char: "ئ" },
      { type: "letter", char: "ء" },
      { type: "rasm", char: "ٮ", dots: "none", matches: ["ن", "ب", "پ", "ت", "ث", "ء", "ی"] },
      { type: "rasm", char: "ٮ", dots: "above", matches: ["ت", "ث", "ن"] },
      { type: "rasm", char: "ٮ", dots: "below", matches: ["ب", "پ", "ی"] }
    ],
    [
      { type: "letter", char: "ب" },
      { type: "letter", char: "پ" },
      { type: "letter", char: "ت" },
      { type: "letter", char: "ث" },
      { type: "letter", char: "ج" },
      { type: "letter", char: "چ" },
      { type: "letter", char: "ح" },
      { type: "letter", char: "خ" },
      { type: "rasm", char: "ح", dots: "either", matches: ["ج", "چ", "ح", "خ"] }
    ],
    [
      { type: "letter", char: "د" },
      { type: "letter", char: "ذ" },
      { type: "rasm", char: "د", dots: "above", matches: ["د", "ذ"] },
      { type: "letter", char: "ر" },
      { type: "letter", char: "ز" },
      { type: "letter", char: "ژ" },
      { type: "rasm", char: "ر", dots: "above", matches: ["ر", "ز", "ژ"] }
    ],
    [
      { type: "letter", char: "س" },
      { type: "letter", char: "ش" },
      { type: "rasm", char: "س", dots: "above", matches: ["س", "ش"] },
      { type: "letter", char: "ص" },
      { type: "letter", char: "ض" },
      { type: "rasm", char: "ص", dots: "above", matches: ["ص", "ض"] },
      { type: "letter", char: "ط" },
      { type: "letter", char: "ظ" },
      { type: "rasm", char: "ط", dots: "above", matches: ["ط", "ظ"] }
    ],
    [
      { type: "letter", char: "ع" },
      { type: "letter", char: "غ" },
      { type: "rasm", char: "ع", dots: "above", matches: ["ع", "غ"] },
      { type: "letter", char: "ف" },
      { type: "letter", char: "ق" },
      { type: "rasm", char: "ڡ", dots: "above", matches: ["ق", "ف"] }
    ],
    [
      { type: "letter", char: "ك" },
      { type: "letter", char: "گ" },
      { type: "letter", char: "ڭ" },
      { type: "rasm", char: "ك", dots: "above", matches: ["ك", "گ", "ڭ"] },
      { type: "letter", char: "ل" },
      { type: "letter", char: "م" },
      { type: "letter", char: "ن" },
      { type: "letter", char: "و" },
      { type: "letter", char: "ؤ" }
    ],
    [
      { type: "letter", char: "ھ" },
      { type: "letter", char: "ە" },
      { type: "letter", char: "ۀ" },
      { type: "letter", char: "ة" },
      { type: "letter", char: "ى" },
      { type: "letter", char: "ئ" },
      // Zero-width space: the strokes look separated, but it is one word
      { type: "joiner", char: "​", face: "][", labelKey: "zeroWidthSpace" }
    ]
  ]
};
