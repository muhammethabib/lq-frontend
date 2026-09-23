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
    // symbol is what the pattern carries in writing; mark is the face it wears
    // on the key, in the slot and in the pattern pill, drawn rather than typed
    // because no font has this star at this weight.
    any: { symbol: "٭", labelKey: "wildcardAny", mark: '<svg class="wildcard-star" viewBox="17.5 17.5 11 11" aria-hidden="true"><g transform="matrix(0.54,0,0,0.4398,-65.821,-15.934)"><path fill="currentColor" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round" d="M168.073,76.772L170.466,78.58L166.877,86.716L174.055,86.716L174.055,90.332L166.877,90.332L170.466,98.468L168.073,100.276L164.484,92.14L160.895,100.276L158.502,98.468L162.091,90.332L154.913,90.332L154.913,86.716L162.091,86.716L158.502,78.58L160.895,76.772L164.484,84.908L168.073,76.772Z"/></g></svg>' },
    many: { symbol: "∞", labelKey: "wildcardMany" }
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

// Which Latin key produces which Ottoman letter, so a reader can type the
// letters they recognise on their own keyboard.
//
// A few keys carry more than one letter: Shift reaches the second and Alt the
// third, matching the layers below.
window.LQ_OTTOMAN_KEYMAP = {
  single: {
    q: "ق", w: "و", e: "ع", r: "ر", u: "و", o: "و",
    p: "پ", f: "ف", j: "ژ", l: "ل", c: "چ", v: "و",
    b: "ب", m: "م", x: "خ",
    // ye is written the same way for both keys
    y: "ی", i: "ی"
  },
  // key: [plain, shift, alt]
  layered: {
    t: ["ت", "ط", "ث"],
    g: ["ج", "غ"],
    a: ["ا", "ء"],
    s: ["س", "ش", "ص"],
    d: ["د", "ض"],
    h: ["ه", "ح", "ة"],
    k: ["ك", "گ"],
    n: ["ن", "ڭ"],
    z: ["ز", "ظ", "ذ"]
  }
};
