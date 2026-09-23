// js/dictionary_page_sample.js
// Stand-in for the dictionary page endpoint.
//
//   GET /dictionary_page/entry?dictionary=…&page=…&word=…
//
// One record per entry. `category` says what kind of record it is -- entry,
// sub or related -- which is what the window's three-way switch steps
// through. The three views are the three ways the guide
// describes reading an entry: the slice it occupies in its column, the whole
// column, and the whole page. Each view names its scan and the boxes drawn
// on it; a box gives its rectangle as a percentage of the scan, because the
// scan is shown at whatever size the window allows.
//
// Only the slice scans are in this sample. A view with no image renders the
// window's empty state, so the interface can be seen without pretending to
// have a scan the sample does not hold.

window.LQ_DICTIONARY_PAGE_SAMPLE = {
  entries: [
    {
      id: "kamus-turki-1417-nazar",
      category: "related",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "نظر",
      headwordLatin: "nazar",
      slice: 2,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: { image: null }, page: { image: null } }
    },
    {
      id: "kamus-turki-1417-nazir",
      category: "related",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "ناظر",
      headwordLatin: "nazır",
      slice: 3,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: { image: null }, page: { image: null } }
    },
    {
      id: "kamus-turki-1417-manzar",
      category: "entry",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "منظر",
      headwordLatin: "manzar",
      slice: 4,
      column: 3,
      page: 1417,
      views: {
        slice: {
          image: "../assets/scans/kamus-turki-1417-manzar-slice.png",
          ratio: 1021 / 477,
          boxes: [
            { category: "entry", ottoman: "منظر", latin: "manzar",
              top: 16.4, left: 76.5, width: 22.5, height: 18.4 },
            { category: "related", ottoman: "نظر", latin: "nazar",
              top: 4.5, left: 21.0, width: 12.0, height: 14.0 }
          ]
        },
        column: { image: null },
        page: { image: null }
      }
    },

    // A subheadword and a related word of the same column, so the arrows have
    // somewhere to go under each of the three kinds. The sample has no scan
    // cut for either, so the window shows its empty state for them; the
    // endpoint will return one slice per record.,
    {
      id: "kamus-turki-1417-manzara",
      category: "entry",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "منظره",
      headwordLatin: "manzara",
      slice: 5,
      column: 3,
      page: 1417,
      views: {
        slice: {
          image: "../assets/scans/kamus-turki-1417-manzara-slice.jpg",
          ratio: 871 / 499,
          boxes: [
            { category: "entry", ottoman: "منظره", latin: "manzara",
              top: 3.8, left: 80.1, width: 17.62, height: 23.19 },
            { category: "related", ottoman: "نظر", latin: "nazar",
              top: 1.3, left: 57.17, width: 9.39, height: 13.61 }
          ]
        },
        column: { image: null },
        page: { image: null }
      }
    },
    {
      id: "kamus-turki-1417-manzara-i-hasene",
      category: "sub",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "منظره‌ی حسنه",
      headwordLatin: "manzara-i hasene",
      slice: 5,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: { image: null }, page: { image: null } }
    },
    {
      id: "kamus-turki-1417-manzum",
      category: "sub",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "منظوم",
      headwordLatin: "manzum",
      slice: 6,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: { image: null }, page: { image: null } }
    }
  ]
};
