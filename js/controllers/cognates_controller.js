// js/controllers/cognates_controller.js
// The words that share a root with this one.
//
// Opened from the menu that appears over a word box. The window is one long
// list cut into six parts -- the root above the word, the words beside it,
// the ones that came out of it, and the compounds and phrases it turns up in
// -- with a row of tabs across the top that both jumps to a part and says
// which part is being read.
//
// A part with nothing in it is closed and says so in a line of its own,
// rather than being left out: a reader who wants to know whether a word has
// derived forms is told that it has none.
//
// It follows the modal rule: an empty container, the markup in a template,
// filled before Bootstrap shows it. The endpoint is documented in
// js/cognates_sample.js.

// The Ottoman alphabet, in the order the dictionaries put it. A letter the
// list does not know sorts after every letter it does.
const OTTOMAN_ALPHABET = [..."ءابپتثجچحخدذرزژسشصضطظعغفقكگڭلمنوهی"];
const OTTOMAN_RANK = Object.fromEntries(OTTOMAN_ALPHABET.map((letter, at) => [letter, at]));

// The six parts, in the order they are read. `key` names the list in the
// record; compounds and phrases come out of the one list of compounds, split
// by whether the reading has a space in it. The English of each line sits
// beside its key, because this markup is written here rather than in the
// page and so is not reached by the sweep that translates the page itself.
const PARTS = [
  {
    id: "cognate-root", key: "root",
    label: "cogTabRoot", labelText: "Root",
    note: "cogSubRoot", noteText: "The base word this one stems from",
    empty: "cogEmptyRoot", emptyText: "No separate root record exists for this word."
  },
  {
    id: "cognate-parallel", key: "parallel",
    label: "cogTabParallel", labelText: "Parallel",
    note: "cogSubParallel", noteText: "Same-root words with no direct derivational link to this word",
    empty: "cogEmptyParallel", emptyText: "No parallel form from the same root has been identified for this word."
  },
  {
    id: "cognate-lexicalized", key: "lexicalized",
    label: "cogSecLexInfl", labelText: "Lexicalized Inflected Forms",
    note: "cogSubLexInfl", noteText: "Inflected forms of this word that have gained a distinct meaning of their own",
    empty: "cogEmptyLexInfl", emptyText: "No lexicalized inflected form exists for this word."
  },
  {
    id: "cognate-derived", key: "derived",
    label: "cogTabDerived", labelText: "Derived",
    note: "cogSubDerived", noteText: "Words derived further from this word",
    empty: "cogEmptyDerived", emptyText: "No further derived form exists for this word."
  },
  {
    id: "cognate-compounds", key: "compounds",
    label: "cogTabCompounds", labelText: "Compounds",
    note: "cogSubCompounds", noteText: "Compounds containing this word or a word derived from it",
    empty: "cogEmptyCompounds", emptyText: "No recorded compound containing this word has been found."
  },
  {
    id: "cognate-phrases", key: "phrases",
    label: "cogTabPhrases", labelText: "Phrases",
    note: "cogSubPhrases", noteText: "Phrases containing this word or a word derived from it",
    empty: "cogEmptyPhrases", emptyText: "No recorded phrase containing this word has been found."
  }
];

// The languages a word can draw on, in the order their marks are shown.
const LANGUAGES = ["tr", "ar", "fa"];

class CognatesController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail || {});
    document.addEventListener("cognates:open", this.onOpen);
    this.onLanguageChange = () => { if (this.record) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("cognates:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.modal) this.modal.dispose();
  }

  open(request) {
    // Matches the Rails route this window expects:
    //   GET /cognates/show?word=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { word: request.latin || request.ottoman },
      // No backend yet: returning false cancels the request and the window is
      // fed sample data instead. Delete beforeSend once the route exists.
      beforeSend: () => { this.receive(this.sampleFor(request)); return false; },
      success: (response) => this.receive(response),
      error: () => this.receive(this.sampleFor(request))
    });
  }

  // A word is looked up by either of its spellings. The sample knows three
  // families; a word outside them is shown the first, so the window can be
  // opened from any row.
  sampleFor(request) {
    const sample = window.LQ_COGNATES_SAMPLE || { families: {}, aliases: {} };
    const ottoman = (request.ottoman || "").trim();
    const latin = (request.latin || "").toLowerCase().trim();
    const key = sample.aliases[ottoman] || sample.aliases[latin] ||
      (sample.families[ottoman] ? ottoman : Object.keys(sample.families)[0]);
    return sample.families[key];
  }

  receive(record) {
    if (!record) return;
    this.record = record;
    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    this.modal.show();
  }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template || !this.record) return;
    window.LQ.disposeWidgets(this.element);
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.element.classList.contains("show")) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;

    this.element.querySelector("[data-cognates-body]").innerHTML = this.sectionsHtml();

    // Generated markup is not covered by the data-i18n sweep of the page, so
    // it is translated here, after it has been written.
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);

    this.body = this.element.querySelector("[data-cognates-body]");
    this.body.scrollTop = 0;
    this.travellingTo = null;
    this.onBodyScroll = () => this.markPartFromScroll();
    this.body.addEventListener("scroll", this.onBodyScroll, { passive: true });
    this.markPart(PARTS[0].id);
  }

  // ==================== the six parts ====================

  sectionsHtml() {
    return PARTS.map((part) => {
      const words = this.wordsFor(part.key);
      const filled = words.length > 0;
      const label = this.translate(part.label, part.labelText);
      const body = filled
        ? `<div class="cognates-grid">${words.map((word) => this.wordHtml(word)).join("")}</div>`
        : `<p class="cognate-empty-note" data-i18n="${part.empty}">${this.translate(part.empty, part.emptyText)}</p>`;

      return `
        <section class="cognate-section${filled ? "" : " is-collapsed"}" id="${part.id}">
          <button type="button" class="btn cognate-section-header"
                  data-action="click->cognates#toggleSection"
                  data-cognates-section="${part.id}"
                  aria-expanded="${filled}" aria-controls="${part.id}-body"
                  aria-label="${window.LQ.escape(label)}">
            <span class="cognate-header-center">
              <span class="cognate-section-title" data-i18n="${part.label}">${window.LQ.escape(label)}</span>
              <span class="cognate-section-count">${words.length}</span>
              <span class="cognate-section-subtitle" data-i18n="${part.note}">${this.translate(part.note, part.noteText)}</span>
            </span>
            <i class="cognate-section-chevron" data-feather="chevron-down" aria-hidden="true"></i>
          </button>
          <div class="cognate-section-content" id="${part.id}-body">${body}</div>
        </section>`;
    }).join("");
  }

  // Compounds and phrases are kept as one list in the record and told apart
  // here: a reading with a space in it is a phrase, anything else a compound.
  wordsFor(key) {
    const record = this.record || {};
    let words = record[key] || [];
    if (key === "compounds") words = (record.compounds || []).filter((word) => !word.latin.includes(" "));
    if (key === "phrases") words = (record.compounds || []).filter((word) => word.latin.includes(" "));
    return [...words].sort((left, right) => this.compareOttoman(left, right));
  }

  wordHtml(word) {
    const safe = window.LQ.escape;
    const marks = LANGUAGES.filter((code) => (word.languages || []).includes(code)).map((code) =>
      `<span class="cognate-language cognate-language-${code}">${code.toUpperCase()}</span>`).join("");

    // Each word opens in its own tab, so the family stays where it is.
    return `
      <div class="cognate-item">
        <span class="cognate-languages">${marks}</span>
        <div class="cognate-word-row">
          <span class="cognate-ottoman-slot">
            <a class="word-box ottoman-box" data-direction="rtl"
               href="home.html?q=${encodeURIComponent(word.ottoman)}" target="_blank"
               rel="noopener">${safe(word.ottoman)}</a>
          </span>
          <span class="cognate-centre-gap" aria-hidden="true"></span>
          <span class="cognate-latin-slot">
            <a class="word-box latin-box"
               href="home.html?q=${encodeURIComponent(word.latin)}" target="_blank"
               rel="noopener">${safe(word.latin)}</a>
          </span>
        </div>
      </div>`;
  }

  // ==================== sorting ====================

  // Ottoman is sorted by its own alphabet, not by the order the code points
  // happen to fall in. The marks above and below the line are dropped and the
  // letters that are written more than one way are brought together first, so
  // that two spellings of the same word land next to each other.
  compareOttoman(left, right) {
    const one = [...this.sortable(left.ottoman)];
    const other = [...this.sortable(right.ottoman)];
    const shared = Math.min(one.length, other.length);
    for (let at = 0; at < shared; at += 1) {
      const a = OTTOMAN_RANK[one[at]] ?? OTTOMAN_ALPHABET.length + one[at].codePointAt(0);
      const b = OTTOMAN_RANK[other[at]] ?? OTTOMAN_ALPHABET.length + other[at].codePointAt(0);
      if (a !== b) return a - b;
    }
    if (one.length !== other.length) return one.length - other.length;
    return left.latin.localeCompare(right.latin);
  }

  sortable(text) {
    return (text || "")
      .normalize("NFKD")
      .replace(/[ً-ٰٟۖ-ۭ]/g, "")
      .replace(/[آأإٱ]/g, "ا")
      .replace(/[کڪ]/g, "ك")
      .replace(/[يىئ]/g, "ی")
      .replace(/[ةۀە]/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/[^ء-ی]/g, "");
  }

  // ==================== the tabs ====================

  // A tab both jumps to its part and opens it, since jumping to a part that
  // is closed would land on a heading with nothing under it.
  goToPart(event) {
    const id = event.currentTarget.dataset.cognatesSection;
    const section = this.element.querySelector(`#${id}`);
    if (!section) return;
    section.classList.remove("is-collapsed");
    this.setExpanded(section, true);
    this.markPart(id);
    // The list travels there rather than jumping, and the tabs must not
    // follow what passes under them on the way, so the part asked for keeps
    // the mark until the list has arrived.
    this.travellingTo = id;
    // The body is the scrolling box and the sections are laid out against
    // it, so a section's own offset is where the body has to be scrolled to.
    requestAnimationFrame(() => { this.body.scrollTop = section.offsetTop; });
  }

  toggleSection(event) {
    const id = event.currentTarget.dataset.cognatesSection;
    const section = this.element.querySelector(`#${id}`);
    if (!section) return;
    const collapsed = section.classList.toggle("is-collapsed");
    this.setExpanded(section, !collapsed);
    this.markPart(id);
  }

  openAll() { this.setAll(false); }
  closeAll() { this.setAll(true); }

  setAll(collapsed) {
    this.element.querySelectorAll(".cognate-section").forEach((section) => {
      section.classList.toggle("is-collapsed", collapsed);
      this.setExpanded(section, !collapsed);
    });
  }

  setExpanded(section, open) {
    const header = section.querySelector(".cognate-section-header");
    if (header) header.setAttribute("aria-expanded", String(open));
  }

  markPart(id) {
    this.element.querySelectorAll(".cognates-tab").forEach((tab) => {
      const active = tab.dataset.cognatesSection === id;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
  }

  // Which part is being read: the last one whose heading has passed the top
  // of the window. At the very bottom the last open part wins, so that a
  // short final part still lights its tab.
  markPartFromScroll() {
    const sections = [...this.element.querySelectorAll(".cognate-section:not(.is-collapsed)")];
    if (!sections.length) return;
    const top = this.body.getBoundingClientRect().top;
    const asked = this.travellingTo && this.element.querySelector(`#${this.travellingTo}`);
    if (asked) {
      // Still on the way: hold the mark. Arrived: let go of it, and the next
      // scroll the reader makes is read as usual.
      if (Math.abs(asked.getBoundingClientRect().top - top) > 2) {
        this.markPart(this.travellingTo);
        return;
      }
      this.travellingTo = null;
    }
    const line = 12;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top - top <= line) current = section;
    });
    if (this.body.scrollTop + this.body.clientHeight >= this.body.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    this.markPart(current.id);
  }

  translate(key, fallback) {
    return window.LQ.translate(key, fallback);
  }
}

application.register("cognates", CognatesController);
