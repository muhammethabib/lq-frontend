// js/search_keyboard_layout.js
// The Ottoman keyboard that belongs to the search bar.
//
// This one is laid out like the keyboard in front of the reader: the same
// three rows, in the same order, each key showing the Latin letter it sits
// under and the Ottoman letter it writes. Pressing K on a real keyboard and
// pressing the K key here do the same thing, which is the whole point of it.
//
// There is one layout per keyboard the reader is likely to have. A key can
// carry up to three letters: the plain press, Shift, and Alt.
//
//   map    Latin key (lower case, or upper case for a Shift-only letter)
//          to the Ottoman letter it writes
//   dual   keys that carry more than one letter:
//          [plain, shift, shift label, alt, alt label]
//
// Both say which key on the reader's own board writes a letter, which is what
// each key of the board prints over its letter.
//
// "_ye_" is not a letter but a decision: a ye is written without its dots
// until a letter follows it, and js/controllers/home_controller.js settles
// which of the two it ends up as.
//
// `alphabetical` is the board itself: the Ottoman alphabet as it is recited,
// elif, be, pe, te..., three rows read from the right. It is the alphabet, so
// it holds each letter once: the detached he, which a Turkish keyboard still
// writes on its E key, would be a second guzel he standing beside the first.
// After the alphabet come the three letters that carry a hemze -- vav, he and
// ye -- each standing beside the letter it is carried on, and written with
// the Shift of that letter's key.

window.LQ_SEARCH_KEYBOARD = {
  // Which letters share a skeleton. In the alphabet's order the families fall
  // next to each other -- be, pe, te, se; cim, çim, ha, hı -- and a reader
  // looking for one of them is looking at the shape, not the dots. The keys
  // of a family carry one ground, so the family is visible as a block.
  // A letter with a skeleton of its own is not in any family and keeps the
  // plain ground.
  families: {
    "ب": "be", "پ": "be", "ت": "be", "ث": "be",
    "ج": "cim", "چ": "cim", "ح": "cim", "خ": "cim",
    "د": "dal", "ذ": "dal",
    "ر": "re", "ز": "re", "ژ": "re",
    "س": "sin", "ش": "sin",
    "ص": "sad", "ض": "sad",
    "ط": "ti", "ظ": "ti",
    "ع": "ayn", "غ": "ayn",
    "ف": "fe", "ق": "fe",
    "ك": "kef", "گ": "kef", "ڭ": "kef",
    "و": "vav", "ؤ": "vav",
    "ه": "he", "ة": "he", "ۀ": "he",
    "ى": "ye", "_ye_": "ye", "ئ": "ye"
  },

  alphabetical: {
    rows: [
      ["ا", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر", "ز"],
      ["ژ", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "گ"],
      ["ڭ", "ل", "م", "ن", "و", "ؤ", "ه", "ة", "ۀ", "_ye_", "ئ", "ء"]
    ]
  },

  en: {
    map: {
      q: "ق", w: "و", e: "ع", r: "ر", t: "ت", y: "_ye_",
      u: "و", i: "_ye_", o: "و", p: "پ",
      a: "ا", s: "س", d: "د", f: "ف", g: "ج", h: "ه",
      j: "ژ", k: "ك", l: "ل",
      z: "ز", x: "خ", c: "چ", v: "و", b: "ب", n: "ن", m: "م",
      A: "ء", T: "ط", G: "غ", S: "ش", D: "ض", H: "ح",
      K: "گ", N: "ڭ", Z: "ظ",
      W: "ؤ", Y: "ئ", E: "ۀ"
    },
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"]
    ],
    dual: {
      t: ["ت", "ط", "SHF+T", "ث", "ALT+T"],
      g: ["ج", "غ", "SHF+G"],
      a: ["ا", "ء", "SHF+A"],
      s: ["س", "ش", "SHF+S", "ص", "ALT+S"],
      d: ["د", "ض", "SHF+D"],
      h: ["ه", "ح", "SHF+H", "ة", "ALT+H"],
      k: ["ك", "گ", "SHF+K"],
      n: ["ن", "ڭ", "SHF+N"],
      z: ["ز", "ظ", "SHF+Z", "ذ", "ALT+Z"]
    }
  },

  tr: {
    map: {
      q: "ق", w: "و", e: "ە", r: "ر", t: "ت", y: "_ye_",
      u: "و", "ı": "ع", o: "و", p: "پ", "ğ": "غ", "ü": "و",
      a: "ا", s: "س", d: "د", f: "ف", g: "گ", h: "ه",
      j: "ژ", k: "ك", l: "ل", "ş": "ش", i: "_ye_",
      z: "ز", x: "خ", c: "ج", v: "و", b: "ب",
      n: "ن", m: "م", "ç": "چ", "ö": "و",
      T: "ط", A: "ء", N: "ڭ", S: "ص", H: "ح", D: "ض", Z: "ظ",
      W: "ؤ", Y: "ئ", E: "ۀ"
    },
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "ı", "o", "p", "ğ", "ü"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ş", "i"],
      ["z", "x", "c", "v", "b", "n", "m", "ö", "ç"]
    ],
    dual: {
      z: ["ز", "ظ", "SHF+Z", "ذ", "ALT+Z"],
      s: ["س", "ص", "SHF+S", "ث", "ALT+S"],
      t: ["ت", "ط", "SHF+T", "ة", "ALT+T"],
      a: ["ا", "ء", "SHF+A"],
      n: ["ن", "ڭ", "SHF+N"],
      d: ["د", "ض", "SHF+D"],
      h: ["ه", "ح", "SHF+H"]
    }
  }
};
