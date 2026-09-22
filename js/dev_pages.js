// js/dev_pages.js
// What the development navigator lists.
//
// The mock is a set of separate pages, and the main page has several states
// that are otherwise reached only by searching. This is the list of both, so
// any of them can be opened directly while the work is being reviewed.
//
// This file and the navigator that reads it come out at integration; nothing
// else refers to them.

window.LQ_DEV_PAGES = [
  {
    group: "devMainPage", groupFallback: "Main page",
    entries: [
      { key: "devLanding", label: "Home", href: "home.html" },
      { key: "devResults", label: "Search results", href: "home.html?state=results" },
      { key: "devNoResults", label: "No results", href: "home.html?state=no-results" },
      { key: "devDecoder", label: "Word Decoder", href: "home.html?state=decoder" },
      { key: "devDecoderResults", label: "Decoder results", href: "home.html?state=decoder-results" }
    ]
  },
  {
    group: "devPages", groupFallback: "Pages",
    entries: [
      { key: "menuAbout", label: "About", href: "about.html" },
      { key: "menuTeam", label: "Team", href: "team.html" },
      { key: "devWhatIs", label: "What is LexiQamus?", href: "what-is-lexiqamus.html" },
      { key: "menuGuide", label: "User Guide", href: "user-guide.html" },
      { key: "devInstitutional", label: "Institutional", href: "institutional.html" },
      { key: "devV3WhatsNew", label: "3.0: What's New", href: "lq3-whats-new.html" },
      { key: "devDataModel", label: "Data model", href: "data-model.html" },
      { key: "devLexicon", label: "Lexicon project", href: "lexicon-digitization.html" },
      { key: "devV2WhatsNew", label: "2.0: What's New", href: "lq2-whats-new.html" },
      { key: "menuLQ1", label: "LexiQamus 1.0", href: "lq1.html" },
      { key: "devSuggestions", label: "Suggestions history", href: "suggestions-history.html" },
      { key: "menuPricing", label: "Pricing", href: "pricing.html" }
    ]
  },
  {
    group: "devWindows", groupFallback: "Windows",
    entries: [
      { key: "devCitation", label: "Citation", href: "home.html?state=citation" },
      { key: "devDictionaryPage", label: "Dictionary page", href: "home.html?state=dictionary-page" },
      { key: "devSignUp", label: "Sign up", href: "home.html?state=sign-up" }
    ]
  }
];
