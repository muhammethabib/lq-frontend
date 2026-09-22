// js/cognates_sample.js
// The words that share a root with the one being looked at.
//
// Stands in for:
//   GET /cognates/show?word=…
// which answers with one family: the word the family is named after, and the
// five lists hung off it. The window splits the last list in two, compounds
// and phrases, by whether the reading has a space in it, so the records keep
// one list rather than two that would have to be kept in step.
//
// A family is keyed by the Ottoman spelling of the word it is named after.
// Every word that belongs to a family is listed in `aliases`, in both
// scripts, so a row can be looked up by whichever of the two was clicked.
// Two words of the same family can still name different families: manzara is
// derived from nazar, and has a family of its own underneath it.
//
// Each word carries the languages it draws on: ar Arabic, fa Persian,
// tr Turkish. A word built from two of them carries both.
window.LQ_COGNATES_SAMPLE = {
  families: {
    // نظر (nazar) is a root itself, so it has nothing above it.
    "نظر": {
      anchorOttoman: "نظر",
      anchorLatin: "nazar",
      root: [],
      parallel: [
        { ottoman: "نظرگر", latin: "nazarger", languages: ["fa"] },
        { ottoman: "نظرآمیز", latin: "nazarâmiz", languages: ["fa", "ar"] },
        { ottoman: "منظوره", latin: "manzûre", languages: ["ar"] },
        { ottoman: "نظرستان", latin: "nazaristan", languages: ["fa"] },
        { ottoman: "نظرچی", latin: "nazarcı", languages: ["tr"] },
        { ottoman: "نظرلقلی", latin: "nazarlıklı", languages: ["tr", "ar"] },
        { ottoman: "منظرگاه", latin: "manzargâh", languages: ["ar", "fa"] },
        { ottoman: "نظرسز", latin: "nazarsız", languages: ["tr"] }
      ],
      lexicalized: [],
      derived: [
        { ottoman: "انتظار", latin: "intizar", languages: ["ar"] },
        { ottoman: "منتظر", latin: "muntazar", languages: ["ar"] },
        { ottoman: "منظر", latin: "manzar", languages: ["ar"] },
        { ottoman: "منظره", latin: "manzara", languages: ["ar", "tr"] },
        { ottoman: "نظرباز", latin: "nazarbaz", languages: ["ar", "fa"] },
        { ottoman: "نظاره", latin: "nezâre", languages: ["ar"] },
        { ottoman: "نظراً", latin: "nazaran", languages: ["ar"] },
        { ottoman: "نظریه", latin: "nazariyye", languages: ["ar"] },
        { ottoman: "نظرلنمق", latin: "nazarlanmak", languages: ["ar", "tr"] },
        { ottoman: "نظرلق", latin: "nazarlık", languages: ["ar", "tr"] },
        { ottoman: "نظرگاه", latin: "nazargâh", languages: ["ar", "fa"] },
        { ottoman: "ناظر", latin: "nazır", languages: ["ar"] },
        { ottoman: "ناظره", latin: "nazıra", languages: ["ar"] },
        { ottoman: "نظاره‌جی", latin: "nazzaracı", languages: ["ar", "tr"] },
        { ottoman: "منتظره", latin: "muntazara", languages: ["ar"] },
        { ottoman: "نازر", latin: "nazir", languages: ["ar"] }
      ],
      compounds: [
        { ottoman: "آرقەیه ارجاع نظر ایتدی", latin: "arkaya ircâ-ı nazar etti", languages: ["tr", "ar"] },
        { ottoman: "بر ایشدن صرف نظر ایتمك", latin: "bir işten sarf-ı nazar etmek", languages: ["tr", "ar"] },
        { ottoman: "حسن نظر", latin: "hüsn-i nazar", languages: ["ar"] },
        { ottoman: "امعان نظر", latin: "im‘ân-ı nazar", languages: ["ar"] },
        { ottoman: "امعان نظر ایتمك", latin: "im‘ân-ı nazar etmek", languages: ["ar", "tr"] },
        { ottoman: "اصابت نظر", latin: "isâbet-i nazar", languages: ["ar"] },
        { ottoman: "قطع نظر", latin: "kat‘-ı nazar", languages: ["ar"] },
        { ottoman: "مد نظر", latin: "medd-i nazar", languages: ["ar"] },
        { ottoman: "نظر ايتمك", latin: "nazar etmek", languages: ["ar", "tr"] },
        { ottoman: "نظر اولمق", latin: "nazar olmak", languages: ["ar", "tr"] },
        { ottoman: "نظر دكمك", latin: "nazar değmek", languages: ["ar", "tr"] },
        { ottoman: "نظر سالمق", latin: "nazar salmak", languages: ["ar", "tr"] },
        { ottoman: "نظر قيلمق", latin: "nazar kılmak", languages: ["ar", "tr"] },
        { ottoman: "پیش نظر", latin: "pîş-i nazar", languages: ["fa", "ar"] },
        { ottoman: "صرف نظر ایتمك", latin: "sarf-ı nazar etmek", languages: ["ar", "tr"] },
        { ottoman: "شاه نظر", latin: "şâh-ı nazar", languages: ["fa", "ar"] },
        { ottoman: "صحیه نظارتی", latin: "Sıhhiye Nezâreti", languages: ["ar", "tr"] }
      ]
    },

    // منظره (manzara) is derived from nazar and heads a family of its own.
    "منظره": {
      anchorOttoman: "منظره",
      anchorLatin: "manzara",
      root: [
        { ottoman: "نظر", latin: "nazar", languages: ["ar"] }
      ],
      parallel: [
        { ottoman: "ناظر", latin: "nazır", languages: ["ar"] }
      ],
      lexicalized: [],
      derived: [
        { ottoman: "منظره‌لی", latin: "manzaralı", languages: ["tr"] }
      ],
      compounds: [
        { ottoman: "منظره‌لی او", latin: "manzaralı ev", languages: ["tr"] }
      ]
    },

    "انسانی": {
      anchorOttoman: "انسانی",
      anchorLatin: "insani",
      root: [
        { ottoman: "انسان", latin: "insan", languages: ["ar"] }
      ],
      parallel: [],
      lexicalized: [],
      derived: [
        { ottoman: "انسانیت", latin: "insaniyet", languages: ["ar"] }
      ],
      compounds: [
        { ottoman: "انسانی حرکت", latin: "insani hareket", languages: ["tr", "ar"] }
      ]
    }
  },

  // Which family a word belongs to, by either spelling. Latin keys are
  // lowercased before they are looked up.
  aliases: {
    "نظر": "نظر", "ناظر": "نظر", "منظر": "نظر", "نظاره": "نظر", "نظریه": "نظر",
    "نظرباز": "نظر", "انتظار": "نظر", "منتظر": "نظر", "نظرلق": "نظر",
    "نظر ايتمك": "نظر", "ناظره": "نظر", "نظرلنمق": "نظر", "نظاره‌جی": "نظر",
    "منتظره": "نظر", "نازر": "نظر", "نظراً": "نظر", "نظر اولمق": "نظر",
    "نظر دكمك": "نظر", "نظر سالمق": "نظر", "نظر قيلمق": "نظر",
    "nazar": "نظر", "nazır": "نظر", "manzar": "نظر", "nazariye": "نظر",
    "nazariyye": "نظر", "intizar": "نظر", "muntazar": "نظر", "nazarlık": "نظر",
    "nazar etmek": "نظر", "nazarlanmak": "نظر", "nazarbaz": "نظر",
    "nazargâh": "نظر", "nazıra": "نظر", "nazzaracı": "نظر", "nazaran": "نظر",
    "muntazara": "نظر", "nazir": "نظر", "nazar olmak": "نظر",
    "nazar değmek": "نظر", "nazar salmak": "نظر", "nazar kılmak": "نظر",

    "منظره": "منظره", "منظره‌لی": "منظره",
    "manzara": "منظره", "manzaralı": "منظره", "manzaralı ev": "منظره",

    "انسانی": "انسانی", "انسان": "انسانی", "انسانیت": "انسانی",
    "insani": "انسانی", "insan": "انسانی", "insaniyet": "انسانی"
  }
};
