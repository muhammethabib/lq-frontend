// js/dictionary_page_sample.js
// Stand-in for the dictionary page endpoint.
//
//   GET /dictionary_page/entry?dictionary=…&page=…&word=…
//
// One record per entry. The three views are the three ways the guide
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
      id: "kamus-turki-1417-manzara",
      dictionary: "Kamus-ı Türki",
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
              top: 15.5, left: 82.2, width: 14.9, height: 13.1 },
            { category: "related", ottoman: "نظر", latin: "nazar",
              top: 2.4, left: 56.9, width: 10.3, height: 10.1 },
            { category: "sub", ottoman: "منظره‌ی حسنه", latin: "manzara-i hasene",
              top: 50.5, left: 40.5, width: 25.0, height: 15.0 }
          ]
        },
        column: { image: null },
        page: { image: null }
      }
    },
    {
      id: "kamus-turki-1417-manzar",
      dictionary: "Kamus-ı Türki",
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
    }
  ]
};
