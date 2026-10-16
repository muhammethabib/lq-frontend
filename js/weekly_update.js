// js/weekly_update.js
// What the "This week on LexiQamus" card on the main page says.
//
// This is the one file to edit each week. Each language carries its own
// wording: the dates, one line per dictionary that changed (usually one,
// sometimes two), and what comes next. A line is [dictionary, what changed]:
// the dictionary name is set in bold, the rest follows it on the same line.
// Leave "next" empty to drop that line; leave "lines" empty to hide the card.
//
// href is where a press on the card goes.

window.LQ_WEEKLY_UPDATE = {
  href: "#",
  en: {
    dates: "7–13 October",
    lines: [
      ["Redhouse", "Latin-script readings added to 2,300 entries."],
      ["Kamus-ı Türkî", "900 words and phrases marked in 400 entries."]
    ],
    next: "900 words from Lehçe-i Osmânî"
  },
  tr: {
    dates: "7–13 Ekim",
    lines: [
      ["Redhouse", "2.300 maddenin Latin harfli okunuşu eklendi."],
      ["Kamus-ı Türkî", "400 maddede 900 kelime ve ibare işaretlendi."]
    ],
    next: "Lehçe-i Osmânî’den 900 kelime"
  }
};
