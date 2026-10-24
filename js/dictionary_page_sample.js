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
// The column and page views also name their slices: each slice gives its top
// and bottom as a percentage of the scan's height, and carries the boxes that
// fall inside it (still given as percentages of the whole scan). The window
// marks the record's own slice and lights up any other as the cursor
// crosses it.
//
// The sample has the slice scans of two entries and the whole of column 3 of
// page 1417. A view with no image renders the window's empty state, so the
// interface can be seen without pretending to have a scan the sample does
// not hold.

// Column 3 of page 1417, shared by every record in it. The scan was put
// together from screenshots of the column, so it starts at the column's top
// and stops partway down the manzara entry.
const KAMUS_TURKI_1417_COLUMN_3 = {
  image: "../assets/scans/kamus-turki-1417-column-3.png",
  ratio: 500 / 2215,
  slices: [
    { number: 1, top: 0.0, bottom: 10.97, boxes: [
        { category: "related", ottoman: "منطقیون", latin: "mantıkıyyun", top: 0.54, left: 9.2, width: 24.8, height: 2.26 }
    ] },
    { number: 2, top: 10.97, bottom: 24.38, boxes: [
        { category: "related", ottoman: "منطلقه", latin: "müntalıka", top: 11.47, left: 9.6, width: 18.0, height: 1.76 },
        { category: "entry", ottoman: "منطلق", latin: "müntalık", top: 11.83, left: 74.4, width: 24.4, height: 3.7 },
        { category: "related", ottoman: "طلاق", latin: "talak", top: 13.63, left: 38.8, width: 15.8, height: 2.21 }
    ] },
    { number: 3, top: 24.38, bottom: 40.41, boxes: [
        { category: "related", ottoman: "منطوقه", latin: "mantuka", top: 24.74, left: 9.0, width: 20.4, height: 2.12 },
        { category: "entry", ottoman: "منطوق", latin: "mantuk", top: 25.51, left: 71.4, width: 27.4, height: 3.21 },
        { category: "related", ottoman: "نطق", latin: "nutk", top: 27.09, left: 40.6, width: 12.8, height: 2.17 }
    ] },
    { number: 4, top: 40.41, bottom: 50.43, boxes: [
        { category: "related", ottoman: "منطویه", latin: "müntaviye", top: 40.72, left: 6.2, width: 20.4, height: 2.44 },
        { category: "entry", ottoman: "منطوی", latin: "müntavi", top: 41.31, left: 68.2, width: 31.0, height: 3.3 },
        { category: "related", ottoman: "طی", latin: "tay", top: 43.21, left: 38.4, width: 8.6, height: 2.17 }
    ] },
    { number: 5, top: 50.43, bottom: 61.49, boxes: [
        { category: "entry", ottoman: "منظر", latin: "manzar", top: 50.79, left: 77.4, width: 22.4, height: 4.79 },
        { category: "related", ottoman: "نظر", latin: "nazar", top: 51.33, left: 19.6, width: 11.4, height: 2.21 },
        { category: "sub", ottoman: "كریه المنظر", latin: "kerih ül-manzar", top: 56.43, left: 3.6, width: 14.6, height: 2.39 },
        { category: "sub", ottoman: "كریه المنظر", latin: "kerih ül-manzar", top: 59.01, left: 73.6, width: 16.8, height: 2.3 }
    ] },
    { number: 6, top: 61.49, bottom: 72.42, boxes: [
        { category: "entry", ottoman: "منظر", latin: "minzar", top: 61.72, left: 78.4, width: 19.4, height: 4.2 },
        { category: "related", ottoman: "نظر", latin: "nazar", top: 61.9, left: 19.8, width: 11.2, height: 2.12 }
    ] },
    { number: 7, top: 72.42, bottom: 100.0, boxes: [
        { category: "entry", ottoman: "منظره", latin: "manzara", top: 72.69, left: 73.4, width: 24.2, height: 4.11 },
        { category: "related", ottoman: "مناظر", latin: "menazır", top: 72.78, left: 8.2, width: 17.2, height: 2.17 },
        { category: "related", ottoman: "نظر", latin: "nazar", top: 75.21, left: 46.6, width: 11.0, height: 2.12 }
    ] }
  ]
};

window.LQ_DICTIONARY_PAGE_SAMPLE = {
  entries: [
    {
      id: "kamus-turki-1417-nazar",
      category: "related",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "نظر",
      headwordLatin: "nazar",
      slice: 5,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: KAMUS_TURKI_1417_COLUMN_3, page: { image: null } }
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
      slice: 5,
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
        column: KAMUS_TURKI_1417_COLUMN_3,
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
      slice: 7,
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
        column: KAMUS_TURKI_1417_COLUMN_3,
        page: { image: null }
      }
    },
    {
      id: "kamus-turki-1417-manzara-i-hasene",
      category: "sub",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "منظره‌ی حسنه",
      headwordLatin: "manzara-i hasene",
      slice: 7,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: KAMUS_TURKI_1417_COLUMN_3, page: { image: null } }
    },
    {
      id: "kamus-turki-1417-manzum",
      category: "sub",
      dictionary: "Kamus-ı Türkî",
      headwordOttoman: "منظوم",
      headwordLatin: "manzum",
      slice: 8,
      column: 3,
      page: 1417,
      views: { slice: { image: null }, column: KAMUS_TURKI_1417_COLUMN_3, page: { image: null } }
    }
  ]
};
