// js/controllers/home_controller.js
// The main page: the search bar, the filters and the result list.

// The Ottoman side of the bar takes Arabic script, the marks that go with it,
// the two joiners, a space and the wildcard; nothing else belongs in a word
// that is going to be looked for.
const OTTOMAN_ALLOWED = /[\p{Script=Arabic}\p{Mn}\u200c\u200d \u00a0*]/u;
const NOT_OTTOMAN = /[^\p{Script=Arabic}\p{Mn}\u200c\u200d \u00a0*]/gu;
const ARABIC_LETTER = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const YE_DOTTED = "\u064A";
const YE_BARE = "\u0649";
// Keys that move around the field rather than write in it.
const PASSED_THROUGH = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp",
  "ArrowDown", "Home", "End", "Tab", "Enter", "Escape"];
// A group longer than this is not put on screen all at once: the reader is
// given a page of it and asks for the rest.
const PAGE = 25;

// Every group closes on the reference's own 8px of air: 4px of the table's
// spacing on either side of this empty row, and the row's own 4px.
const TAIL = `<tr class="group-tail" aria-hidden="true"><td colspan="4"></td></tr>`;
// A row has two halves, and which half the pointer is over decides where a
// press will go. The words themselves, and everything else that has its own
// answer to a press, are left out of that: a reader over a word is being told
// about the word, not about the row.
const ZONE_SKIP = ".word-box, .analysis-badge, .typo-mark, .category-badge, .btn, a";
// How long the row the entry window was opened from stays marked once the
// window is closed, and how long the mark takes to fade after that.
const VISITED_MS = 3200;
const VISITED_FADE_MS = 600;

class HomeController extends Stimulus.Controller {
  static targets = [
    "logo", "logoRow", "tagline", "inputWrapper", "input", "placeholderLatin", "placeholderEnglish", "placeholderOttoman",
    "sourceOption", "submit", "scriptHint", "scriptWarning",
    "filter", "filterCount", "filterDescription", "dictionary", "dictionaryLabel", "allDictionaries",
    "resultsSurface", "resultsTable", "zoneTip", "resultsAccent", "resultsTerm", "recordCount", "dictionaryCount",
    "groupCopy",
    "spellingRow", "pronunciationButton", "pronunciationCount",
    "jumpBar", "jumpLinks",
    "noMatches", "noMatchesLine", "noMatchesTerm",
    "searchFailed", "suggestions", "suggestionsBlock"
  ]

  static values = {
    endpoint: { type: String, default: "/search_output/results" },
    // "ottoman" searches the Ottoman corpus, "english" searches Redhouse definitions
    source: { type: String, default: "ottoman" },
    // Which half of the bar was clicked last: "latin" types from the left,
    // "ottoman" types from the right. Empty until a side is chosen, which is
    // when both prompts show. Only meaningful while source is "ottoman".
    side: { type: String, default: "" }
  }

  connect() {
    this.results = null;
    this.activeSpelling = null;
    this.updateFilterCount();
    this.applySide();
    this.listenForOttoman();
    // The bar is what the reader came for, so the caret is already in it. Not
    // on a touch screen: there it would throw up the device's own keyboard
    // over the page before the reader has asked for anything.
    if (window.matchMedia("(pointer: fine)").matches) this.inputTarget.focus();
    this.refreshDictionaryLabel();
    this.watchTagline();
    // Text this controller writes itself is not covered by the data-i18n sweep,
    // so it is rewritten whenever the interface language changes.
    this.element.addEventListener("language:changed", () => {
      // The line under the wordmark is a different length in each language.
      this.fitTagline();
      this.refreshDictionaryLabel();
      this.renderSpellings();
      this.renderResults();
    });

    // A word clicked on a dictionary scan is searched here rather than in a
    // new tab, so the reader keeps one page.
    this.onSearchRequest = (event) => this.runSearch(event.detail);
    document.addEventListener("search:run", this.onSearchRequest);

    // The view switcher asks for one of the main page's six screens. A
    // reviewing aid: this listener comes out with the switcher.
    this.onViewState = (event) => this.showViewState(event.detail.state);
    document.addEventListener("view-state:change", this.onViewState);

    // Coming back from the entry window, the row it was opened from is
    // pointed out again.
    this.onEntryClosed = () => this.markEntrySource();
    document.addEventListener("entry:closed", this.onEntryClosed);

    // A word opened in a new tab arrives as ?q=; the page looks it up rather
    // than showing an empty bar. Deferred by a turn so that the switcher,
    // which announces its own screen the same way, has had its say first.
    const asked = new URLSearchParams(window.location.search).get("q");
    if (asked) this.openingSearch = setTimeout(() => this.searchFor(asked), 0);
  }

  disconnect() {
    clearTimeout(this.openingSearch);
    document.removeEventListener("search:run", this.onSearchRequest);
    document.removeEventListener("view-state:change", this.onViewState);
    document.removeEventListener("entry:closed", this.onEntryClosed);
    document.removeEventListener("search-keyboard:key", this.onKeyboardKey);
    document.removeEventListener("search-keyboard:closed", this.onKeyboardClosed);
    document.removeEventListener("ottoman-keyboard:request", this.onDecoderKeyboard);
    this.inputTarget.removeEventListener("keydown", this.onKeyDown);
    if (this.onPageScroll) window.removeEventListener("scroll", this.onPageScroll);
    window.removeEventListener("resize", this.onResize);
    clearTimeout(this.taglineTimer);
  }

  // The four screens this controller owns. The other two, the entry window
  // and the Redhouse entry, belong to their own controllers.
  showViewState(state) {
    if (state === "results" || state === "no-results") {
      this.sideValue = "ottoman";
      // The term goes in first: the prompts are dropped by there being text,
      // so they have to be settled after the bar has it.
      this.inputTarget.value = "نظر";
      this.applySide();
      this.receive(state === "results" ? this.sample() : this.emptySample());
      return;
    }
    if (state === "home" || state === "new-visitor") this.resetToLanding();
  }

  // Back to the screen a reader first sees: nothing typed, nothing found and
  // no side of the bar carrying a focus colour from the screen before.
  resetToLanding() {
    this.results = null;
    this.activeSpelling = null;
    this.inputTarget.value = "";
    // No side chosen: the bar is back to advertising that it takes either.
    this.sideValue = "";
    this.applySide();
    this.closeKeyboard();
    this.element.classList.add("state-landing");
    this.element.classList.remove("state-results");
    this.fitTagline();
    this.resultsSurfaceTarget.hidden = true;
    this.noMatchesTarget.hidden = true;
  }

  // What the endpoint returns when a word is not in any dictionary: no rows,
  // and the spellings nearest to the one that was tried.
  emptySample() {
    const sample = window.LQ_SAMPLE_RESULTS || {};
    return {
      query: sample.query,
      totals: { records: 0, dictionaries: 0 },
      spellings: [],
      suggestions: sample.suggestions || [],
      groups: []
    };
  }

  // A word handed to the page in the address, in either script.
  searchFor(term) {
    this.runSearch({ term, script: ARABIC_LETTER.test(term) ? "ottoman" : "latin" });
  }

  runSearch({ term, script }) {
    this.sideValue = script === "ottoman" ? "ottoman" : "latin";
    this.applySide();
    this.inputTarget.value = term;
    this.submitTarget.click();
  }

  // ==================== search bar ====================

  // The source switch sits inside the bar, so its clicks must not also be read
  // as a click on the left or right half of the bar.
  stopSideDetection(event) {
    event.stopPropagation();
  }

  selectSource(event) {
    this.sourceValue = event.currentTarget.dataset.source;
    this.inputTarget.value = "";
    this.sourceOptionTargets.forEach((option) => {
      option.classList.toggle("active", option.dataset.source === this.sourceValue);
    });
    // English definitions are Latin-only, so the bar stops being two-sided
    if (this.sourceValue === "english") this.sideValue = "latin";
    this.submitTarget.classList.toggle("source-english", this.sourceValue === "english");
    this.applySide();
    this.inputTarget.focus();
  }

  // Clicking the left half types Latin, the right half types Ottoman.
  chooseSide(event) {
    if (this.sourceValue === "english") {
      this.sideValue = "latin";
    } else {
      const bounds = this.inputWrapperTarget.getBoundingClientRect();
      const side = (event.clientX - bounds.left) < bounds.width / 2 ? "latin" : "ottoman";
      // Switching sides mid-query would mix the two scripts in one term
      if (side !== this.sideValue) this.inputTarget.value = "";
      this.sideValue = side;
    }
    this.applySide();
    this.inputTarget.focus();
    // The Ottoman side is the one a reader needs help with, so it brings its
    // keyboard; the hint steps aside, since two floating things under one bar
    // is one too many.
    if (this.sideValue === "ottoman") this.openKeyboard(); else this.closeKeyboard();
  }

  applySide() {
    const isOttoman = this.sideValue === "ottoman" && this.sourceValue !== "english";
    this.inputTarget.dataset.direction = isOttoman ? "rtl" : "ltr";
    this.inputWrapperTarget.classList.toggle("focus-ottoman", isOttoman);
    this.inputWrapperTarget.classList.toggle("focus-latin", this.sideValue === "latin" || this.sourceValue === "english");

    // English mode searches definitions, so it shows its own prompt and drops
    // the Ottoman one.
    const englishMode = this.sourceValue === "english";
    this.placeholderLatinTarget.hidden = englishMode;
    this.placeholderEnglishTarget.hidden = !englishMode;
    this.placeholderOttomanTarget.hidden = englishMode;

    this.updatePlaceholders();
  }

  handleInput() {
    this.updatePlaceholders();
    if (this.inputTarget.value) this.hideScriptHint();
    // On the Ottoman side, a Latin letter is not a typo the reader can see:
    // it is a word that will never be found. It is taken back out and the
    // bar says why.
    if (this.isOttomanSide()) this.keepOttomanOnly();
    if (this.inputTarget.value) this.markKeyboardLearned();
  }

  // Both prompts show until a side is chosen, so the bar advertises that it
  // takes either script. Choosing a side drops that side's prompt, and any
  // text drops both.
  updatePlaceholders() {
    const hasText = this.inputTarget.value.length > 0;
    const english = this.sourceValue === "english";
    const side = english ? "latin" : this.sideValue;
    this.placeholderLatinTarget.classList.toggle("is-hidden", hasText || side === "latin");
    this.placeholderEnglishTarget.classList.toggle("is-hidden", hasText);
    this.placeholderOttomanTarget.classList.toggle("is-hidden", hasText || side === "ottoman");
  }

  // ==================== the Ottoman side ====================
  //
  // One bar takes both scripts, so everything the bar says about that is
  // temporary: it appears when it can help and steps out of the way the
  // moment the reader starts working.

  isOttomanSide() {
    return this.sideValue === "ottoman" && this.sourceValue !== "english";
  }

  listenForOttoman() {
    // Keys pressed on the on-screen keyboard.
    this.onKeyboardKey = (event) => {
      if (!this.isOttomanSide()) return;
      if (event.detail.kind === "backspace") { this.deleteBack(); return; }
      this.insertOttoman(event.detail.char);
    };
    document.addEventListener("search-keyboard:key", this.onKeyboardKey);

    // Closing the keyboard puts the bar back to rest.
    this.onKeyboardClosed = () => {
      this.keyboardOpen = false;
      if (!this.inputTarget.value) {
        this.sideValue = "";
        this.applySide();
      }
    };
    document.addEventListener("search-keyboard:closed", this.onKeyboardClosed);

    // The reader's own keyboard writes Ottoman too, which is what the line in
    // the keyboard's header promises.
    this.onKeyDown = (event) => this.typeOttoman(event);
    this.inputTarget.addEventListener("keydown", this.onKeyDown);

    // The decoder has a keyboard of its own; while either is open the bar
    // keeps its hint to itself.
    this.onDecoderKeyboard = () => this.hideScriptHint();
    document.addEventListener("ottoman-keyboard:request", this.onDecoderKeyboard);
  }

  openKeyboard() {
    this.keyboardOpen = true;
    this.hideScriptHint();
    document.dispatchEvent(new CustomEvent("search-keyboard:request", {
      detail: { anchor: this.inputWrapperTarget }
    }));
  }

  closeKeyboard() {
    if (!this.keyboardOpen) return;
    this.keyboardOpen = false;
    document.dispatchEvent(new CustomEvent("search-keyboard:dismiss"));
  }

  markKeyboardLearned() {
    document.dispatchEvent(new CustomEvent("search-keyboard:typed"));
  }

  // ---- what goes into the field

  insertOttoman(char) {
    const input = this.inputTarget;
    const letter = char === "_ye_" ? YE_BARE : char;
    const start = input.selectionStart == null ? input.value.length : input.selectionStart;
    const end = input.selectionEnd == null ? start : input.selectionEnd;
    input.value = input.value.slice(0, start) + letter + input.value.slice(end);
    input.setSelectionRange(start + 1, start + 1);
    this.settleYe();
    this.updatePlaceholders();
    this.markKeyboardLearned();
    input.focus();
  }

  deleteBack() {
    const input = this.inputTarget;
    const start = input.selectionStart == null ? input.value.length : input.selectionStart;
    const end = input.selectionEnd == null ? start : input.selectionEnd;
    if (start !== end) {
      input.value = input.value.slice(0, start) + input.value.slice(end);
      input.setSelectionRange(start, start);
    } else if (start > 0) {
      input.value = input.value.slice(0, start - 1) + input.value.slice(start);
      input.setSelectionRange(start - 1, start - 1);
    }
    this.settleYe();
    this.updatePlaceholders();
    input.focus();
  }

  // Each key of the reader's own keyboard writes the Ottoman letter printed
  // on the matching key of the on-screen one. Shift and Alt reach the second
  // and third letters that key carries.
  typeOttoman(event) {
    if (!this.isOttomanSide()) return;
    if (event.ctrlKey || event.metaKey) return;
    if (PASSED_THROUGH.includes(event.key)) return;
    const layout = this.keyboardLayout();
    const lower = event.key.toLowerCase();

    if (event.altKey) {
      // A Mac writes something else entirely for Alt combinations, so the
      // physical position of the key is read when the letter is not one the
      // layout knows.
      const named = layout.dual[lower] ? lower
        : (/^Key[A-Z]$/.test(event.code || "") ? event.code.slice(3).toLowerCase() : lower);
      const alt = (layout.dual[named] || [])[3];
      if (alt) { event.preventDefault(); this.insertOttoman(alt); }
      else if (event.key.length === 1) event.preventDefault();
      return;
    }

    const key = event.shiftKey ? event.key.toUpperCase() : lower;
    if (layout.map[key]) {
      event.preventDefault();
      this.insertOttoman(layout.map[key]);
      return;
    }
    // A letter with no Ottoman equivalent is refused rather than left to be
    // searched for and never found.
    if (event.key.length === 1 && !OTTOMAN_ALLOWED.test(event.key)) {
      event.preventDefault();
      this.warnScript();
    }
  }

  keyboardLayout() {
    const layouts = window.LQ_SEARCH_KEYBOARD || {};
    const one = layouts[document.documentElement.lang === "tr" ? "tr" : "en"] || layouts.en || {};
    return { map: one.map || {}, dual: one.dual || {} };
  }

  // Pasting, dragging and a device's own keyboard all get past keydown, so
  // whatever arrives is checked again once it is in the field.
  keepOttomanOnly() {
    const input = this.inputTarget;
    const value = input.value;
    if (!NOT_OTTOMAN.test(value)) return;
    const at = input.selectionStart == null ? value.length : input.selectionStart;
    const caret = value.slice(0, at).replace(NOT_OTTOMAN, "").length;
    input.value = value.replace(NOT_OTTOMAN, "");
    input.setSelectionRange(caret, caret);
    this.warnScript();
    this.settleYe();
  }

  // A ye keeps its dots only where a letter follows it; on its own, or at the
  // end of a word, it is written bare. The field is read right to left, so
  // "follows" is the character after it in the string.
  settleYe() {
    const input = this.inputTarget;
    const value = input.value;
    let settled = "";
    for (let at = 0; at < value.length; at += 1) {
      const letter = value[at];
      if (letter === YE_DOTTED || letter === YE_BARE) {
        const after = at < value.length - 1 ? value[at + 1] : "";
        settled += after && ARABIC_LETTER.test(after) ? YE_DOTTED : YE_BARE;
      } else {
        settled += letter;
      }
    }
    if (settled === value) return;
    const caret = input.selectionStart;
    input.value = settled;
    input.setSelectionRange(caret, caret);
  }

  warnScript() {
    const warning = this.scriptWarningTarget;
    warning.hidden = false;
    // The keyboard carries the answer to what just went wrong, so it comes up
    // with the warning.
    if (!this.keyboardOpen) this.openKeyboard();
    clearTimeout(this.warningTimer);
    this.warningTimer = setTimeout(() => { warning.hidden = true; }, 2800);
  }

  // ---- the hint under the bar

  // It says which script goes in which side, and it is worth saying only
  // while the bar is empty and nothing else is already under it.
  showScriptHint() {
    if (this.inputTarget.value) return;
    if (this.sourceValue === "english") return;
    if (this.keyboardOpen) return;
    if (document.querySelector(".ottoman-keyboard.is-open")) return;
    if (!this.element.classList.contains("state-landing")) return;
    this.placeScriptHint();
    this.scriptHintTarget.hidden = false;
  }

  hideScriptHint() {
    this.scriptHintTarget.hidden = true;
  }

  // Centred between the two carets rather than on the bar: the Latin caret
  // sits at the start of the left prompt, the Ottoman one at the end of the
  // right.
  placeScriptHint() {
    const wrapper = this.inputWrapperTarget.getBoundingClientRect();
    const latin = this.placeholderLatinTarget.getBoundingClientRect();
    const ottoman = this.placeholderOttomanTarget.getBoundingClientRect();
    const between = this.placeholderOttomanTarget.hidden
      ? wrapper.width / 2
      : ((latin.left - wrapper.left) + (ottoman.right - wrapper.left)) / 2;
    this.scriptHintTarget.style.left = `${Math.round(between)}px`;
  }

  // ==================== filters ====================

  checkAllFilters() { this.setAllFilters(true); }
  clearAllFilters() { this.setAllFilters(false); }

  setAllFilters(checked) {
    this.filterTargets.forEach((filter) => { filter.checked = checked; });
    this.updateFilterCount();
    this.renderResults();
  }

  applyFilters() {
    this.updateFilterCount();
    this.renderResults();
  }

  updateFilterCount() {
    this.filterCountTarget.textContent = this.filterTargets.filter((f) => f.checked).length;
  }

  selectedFilters(kind) {
    return this.filterTargets
      .filter((filter) => filter.dataset.filterKind === kind && filter.checked)
      .map((filter) => filter.value);
  }

  // ==================== dictionaries ====================

  // The dictionary column shows the name with its publication year. The
  // shared helper reads it off the same table the citation window uses, so
  // the two never disagree about a work.
  dictionaryLabelFor(name) {
    return window.LQ.dictionaryLabel(name);
  }

  toggleAllDictionaries(event) {
    const checked = event.currentTarget.checked;
    this.dictionaryTargets.forEach((box) => { box.checked = checked; });
    this.applyDictionaries();
  }

  applyDictionaries() {
    this.refreshDictionaryLabel();
    this.renderResults();
  }

  refreshDictionaryLabel() {
    const boxes = this.dictionaryTargets;
    const selected = boxes.filter((box) => box.checked);
    this.allDictionariesTarget.checked = selected.length === boxes.length;
    this.allDictionariesTarget.indeterminate = selected.length > 0 && selected.length < boxes.length;

    if (selected.length === boxes.length) {
      this.dictionaryLabelTarget.textContent = this.translate("allDictionaries", "All Dictionaries");
    } else if (selected.length === 0) {
      this.dictionaryLabelTarget.textContent = this.translate("noDictionaries", "No Dictionaries");
    } else {
      // The count sits inside the sentence, so the translation carries a {n}
      // slot. English needs a singular form; Turkish does not inflect here.
      const key = selected.length === 1 ? "nDictionary" : "nDictionaries";
      const fallback = selected.length === 1 ? "{n} Dictionary Selected" : "{n} Dictionaries Selected";
      this.dictionaryLabelTarget.textContent =
        this.translate(key, fallback).replace("{n}", selected.length);
    }
  }

  selectedDictionaries() {
    return this.dictionaryTargets.filter((box) => box.checked).map((box) => box.value);
  }

  // ==================== search ====================

  submit(event) {
    event.preventDefault();
    const query = this.inputTarget.value.trim();
    if (!query) return;

    // Matches the Rails route this page expects:
    //   GET /search_output/results?q=…&script=…&source=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: {
        q: query,
        script: this.sideValue,
        source: this.sourceValue,
        categories: this.selectedFilters("category"),
        groups: this.selectedFilters("group"),
        dictionaries: this.selectedDictionaries()
      },
      // No backend yet: returning false from beforeSend cancels the request and
      // the page is fed sample data instead. Delete beforeSend once the route
      // exists; success already handles the real response shape.
      beforeSend: () => { this.receive(this.sample()); return false; },
      success: (response) => this.receive(response),
      error: () => this.showError()
    });
  }

  showError() {
    this.element.classList.remove("state-landing");
    this.element.classList.add("state-results");
    this.fitTagline();
    this.resultsSurfaceTarget.hidden = false;
    this.resultsTableTarget.querySelectorAll("tbody.result-group").forEach((body) => body.remove());
    // A request that failed is not a word that could not be found, so the
    // suggestions have nothing to offer and the line says what went wrong.
    this.noMatchesLineTarget.hidden = true;
    this.suggestionsBlockTarget.hidden = true;
    this.searchFailedTarget.hidden = false;
    this.noMatchesTarget.hidden = false;
    this.element.classList.add("state-no-matches");
  }

  receive(results) {
    this.results = results;
    this.activeSpelling = (results.spellings || []).find((s) => s.active) || null;
    this.element.classList.remove("state-landing");
    this.element.classList.add("state-results");
    this.fitTagline();
    this.resultsSurfaceTarget.hidden = false;

    const totals = results.totals || {};
    this.recordCountTarget.textContent = totals.records || 0;
    this.dictionaryCountTarget.textContent = totals.dictionaries || 0;
    this.pronunciationCountTarget.textContent = results.similarPronunciationCount || 0;

    this.renderSpellings();
    this.renderTerm();
    this.renderResults();
  }

  // The sample response stands in for the endpoint. It always returns the
  // نظر (nazar) record set, whatever was typed, because those are the real
  // corpus records available here and a coherent set exercises the layout,
  // the grouping and the affix marking properly. The real endpoint keys off
  // the query instead; nothing else on the page needs to change.
  sample() {
    return window.LQ_SAMPLE_RESULTS;
  }

  // ==================== results rendering ====================

  renderSpellings() {
    const spellings = (this.results && this.results.spellings) || [];
    this.spellingRowTarget.innerHTML = spellings.map((spelling, index) => `
      <button type="button" class="btn spelling-button${spelling === this.activeSpelling ? " active" : ""}"
              data-script="${spelling.script}" data-spelling-index="${index}"
              ${spelling.script === "ottoman" ? 'data-direction="rtl"' : ""}
              data-action="click->home#selectSpelling" aria-pressed="${spelling === this.activeSpelling}">
        ${this.escape(spelling.text)}
      </button>`).join("");
  }

  selectSpelling(event) {
    const index = Number(event.currentTarget.dataset.spellingIndex);
    this.activeSpelling = this.results.spellings[index];
    this.renderSpellings();
    this.renderTerm();
    // The highlight marks whatever is around the active spelling, so the rows
    // have to be written again.
    this.renderResults();
  }

  renderTerm() {
    const spelling = this.activeSpelling;
    if (!spelling) return;
    this.resultsTermTarget.textContent = spelling.text;
    this.resultsTermTarget.dataset.direction = spelling.script === "ottoman" ? "rtl" : "ltr";
    this.resultsTermTarget.dataset.script = spelling.script;
    this.resultsAccentTarget.dataset.script = spelling.script;
  }

  togglePronunciation() {
    const button = this.pronunciationButtonTarget;
    const active = button.classList.toggle("active");
    button.setAttribute("aria-pressed", String(active));
    // With the real endpoint this re-runs the search with a wider match set
  }

  renderResults() {
    if (!this.results) return;

    const table = this.resultsTableTarget;
    const allowedCategories = this.selectedFilters("category");
    const allowedGroups = this.selectedFilters("group");
    const allowedDictionaries = this.selectedDictionaries();

    // Remove the group bodies from the previous render, keeping the header row
    table.querySelectorAll("tbody.result-group").forEach((body) => body.remove());

    let shown = 0;
    this.results.groups.forEach((group) => {
      if (!allowedGroups.includes(group.key)) return;
      const rows = group.rows.filter((row) =>
        allowedCategories.includes(row.category) && allowedDictionaries.includes(row.dictionary));
      if (rows.length === 0) return;
      shown += rows.length;
      table.insertAdjacentHTML("beforeend", this.groupHtml(group, rows));
    });

    this.buildJumpBar();
    this.noMatchesTarget.hidden = shown > 0;
    // With nothing to list, the column headings and the alternative spellings
    // are headings over an empty table; the surface is the answer instead.
    this.element.classList.toggle("state-no-matches", shown === 0);
    if (shown === 0) this.offerSpellings();
    window.LQ.refreshDynamicContent(this.resultsSurfaceTarget);
  }

  // ==================== the way around a long list ====================

  // One link per group on screen, with the group's own note as its tooltip,
  // so the reader knows what a group holds before they go to it.
  buildJumpBar() {
    const groups = Array.from(this.resultsTableTarget.querySelectorAll("tbody.result-group"));
    this.jumpLinksTarget.innerHTML = groups.map((body) => {
      const title = body.querySelector(".group-title");
      const note = body.querySelector(".group-note");
      // A long group name has a short form for the bar, kept in its copy block.
      const short = this.groupCopyTarget.querySelector(`[data-group="${body.id.replace(/^group-/, "")}"] [data-copy="short"]`);
      const label = short ? short.innerHTML.trim() : (title ? title.innerHTML : body.id);
      return `
        <button type="button" class="btn jump-link" data-jump="${this.escape(body.id)}"
                data-action="click->home#jumpToGroup"
                ${note ? `data-bs-toggle="tooltip" data-bs-title="${this.escape(note.textContent.trim())}"` : ""}>
          ${label}
        </button>`;
    }).join("");
    this.watchScrollForJumpBar();
  }

  watchScrollForJumpBar() {
    if (this.onPageScroll) return;
    this.onPageScroll = () => {
      if (this.scrollWaiting) return;
      this.scrollWaiting = true;
      requestAnimationFrame(() => {
        this.scrollWaiting = false;
        this.settleJumpBar();
      });
    };
    window.addEventListener("scroll", this.onPageScroll, { passive: true });
  }

  // It belongs to the result list, so it is there only while the list is and
  // only once the list's own heading has gone off the top.
  settleJumpBar() {
    const showing = this.element.classList.contains("state-results")
      && !this.element.classList.contains("state-no-matches")
      && window.scrollY > 250;
    this.jumpBarTarget.hidden = !showing;
    // The column head sticks just under the bar while the bar is there.
    this.element.style.setProperty("--jump-bar-height", showing ? `${this.jumpBarTarget.offsetHeight}px` : "0px");
    if (!showing) return;
    // The group the reader is in is the last one whose heading has passed
    // under the bar.
    let here = null;
    this.resultsTableTarget.querySelectorAll("tbody.result-group").forEach((body) => {
      if (body.getBoundingClientRect().top <= 200) here = body.id;
    });
    this.jumpLinksTarget.querySelectorAll(".jump-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.jump === here);
    });
  }

  jumpToGroup(event) {
    const body = document.getElementById(event.currentTarget.dataset.jump);
    if (!body) return;
    // A group the reader asked for is opened on the way.
    body.classList.remove("is-collapsed");
    const toggle = body.querySelector(".group-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    window.scrollTo({
      top: body.getBoundingClientRect().top + window.scrollY - 180,
      behavior: "smooth"
    });
  }

  // An Ottoman word can be written several ways, so when nothing matched the
  // answer is nearly often one of the spellings nearest to it. Pressing one
  // searches it, the way pressing any other word on this page does.
  offerSpellings() {
    this.noMatchesLineTarget.hidden = false;
    this.suggestionsBlockTarget.hidden = false;
    this.searchFailedTarget.hidden = true;
    const results = this.results || {};
    const term = (results.query || {}).ottoman || this.inputTarget.value;
    this.noMatchesTermTarget.textContent = term;
    const suggestions = results.suggestions || [];
    this.suggestionsTarget.innerHTML = suggestions.map((one, index) => `
      <li class="suggestion">
        <span class="suggestion-number">${index + 1}.</span>
        <span class="suggestion-pair">
          <button type="button" class="btn suggestion-word suggestion-ottoman" data-direction="rtl"
                  data-suggestion="${this.escape(one.ottoman)}" data-suggestion-script="ottoman"
                  data-action="click->home#searchSuggestion">${this.escape(one.ottoman)}</button>
          <button type="button" class="btn suggestion-word suggestion-latin"
                  data-suggestion="${this.escape(one.latin)}" data-suggestion-script="latin"
                  data-action="click->home#searchSuggestion">${this.escape(one.latin)}</button>
        </span>
      </li>`).join("");
  }

  searchSuggestion(event) {
    const { suggestion, suggestionScript } = event.currentTarget.dataset;
    this.runSearch({ term: suggestion, script: suggestionScript });
  }

  groupHtml(group, rows) {
    // The title, the note and the example come from the hidden copy block in
    // the markup, already in the current language.
    const copy = this.groupCopyTarget.querySelector(`[data-group="${group.key}"]`);
    const read = (part) => {
      const element = copy && copy.querySelector(`[data-copy="${part}"]`);
      return element ? element.innerHTML.trim() : "";
    };
    const title = read("title") || group.key;
    const note = read("note");
    const example = read("example");
    const bodyId = `group-${group.key}`;

    return `
      <tbody class="result-group" id="${bodyId}">
        <tr class="group-header">
          <th colspan="4" scope="colgroup">
           <div class="group-header-inner">
            <button type="button" class="btn group-toggle" aria-expanded="true" aria-controls="${bodyId}"
                    data-action="click->home#toggleGroup">
              <span class="group-chevron"><svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     aria-hidden="true"><path d="M1 1L5 5L9 1"/></svg></span>
              <span class="group-title">${title}</span>
            </button>
            <span class="group-count">${rows.length}</span>
            ${note ? `
              <span class="group-note is-open">
                <span class="group-note-text">${note}${example ? `<span class="group-note-example">${example}</span>` : ""}</span>
                <button type="button" class="btn group-note-toggle" aria-expanded="true"
                        data-action="click->home#toggleNote"
                        aria-label="${this.escape(this.translate("groupNoteToggle", "Show or hide this description"))}">
                  <i data-feather="info" aria-hidden="true"></i>
                  <span class="group-note-close" aria-hidden="true">✕</span>
                </button>
              </span>` : ""}
           </div>
          </th>
        </tr>
        ${rows.map((row, at) => this.rowHtml(row, group.key, at >= PAGE)).join("")}
        ${this.showMoreHtml(bodyId, Math.min(PAGE, rows.length), rows.length)}
      </tbody>`;
  }

  // ==================== back from the entry window ====================

  // The row the window was opened from is marked for a few seconds and then
  // fades back into the list. A row that has scrolled out of sight is brought
  // back to the middle first, so the mark is somewhere the reader can see.
  markEntrySource() {
    const row = this.entrySource;
    if (!row || !row.isConnected) return;

    this.resultsTableTarget.querySelectorAll("tr.is-visited").forEach((other) => {
      other.classList.remove("is-visited", "is-fading", "is-returned");
      clearTimeout(other.fadeTimer);
      clearTimeout(other.clearTimer);
    });

    row.classList.add("is-visited");
    row.fadeTimer = setTimeout(() => row.classList.add("is-fading"), VISITED_MS);
    row.clearTimer = setTimeout(() => row.classList.remove("is-visited", "is-fading"),
      VISITED_MS + VISITED_FADE_MS);

    const at = row.getBoundingClientRect();
    if (at.top < 90 || at.bottom > window.innerHeight - 20) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // One beat of the mark as the reader lands, restarted from the beginning
    // if they open and close the same row twice.
    row.classList.remove("is-returned");
    void row.offsetWidth;
    row.classList.add("is-returned");
    clearTimeout(row.returnTimer);
    row.returnTimer = setTimeout(() => row.classList.remove("is-returned"), 1500);
  }

  // ==================== what a click zone does ====================

  showZoneTip(event) {
    const zone = event.target.closest(".result-zone");
    if (!zone || event.target.closest(ZONE_SKIP)) { this.hideZoneTip(); return; }
    const tip = this.zoneTipTarget;
    const key = zone.dataset.zoneTip;
    tip.textContent = this.translate(key,
      key === "goToHeadword" ? "Go to the headword" : "Go to this result");
    tip.classList.add("is-open");

    // Anchored over the half the zone belongs to rather than at the pointer,
    // and a little right of the middle so it does not sit on the words above
    // it. A half is several cells, so they are taken together.
    const half = [...zone.closest("tr").querySelectorAll(
      `td[data-zone-focus="${zone.dataset.zoneFocus}"]`)].map((cell) =>
      cell.getBoundingClientRect());
    const at = {
      left: Math.min(...half.map((r) => r.left)),
      top: Math.min(...half.map((r) => r.top)),
      bottom: Math.max(...half.map((r) => r.bottom)),
      width: Math.max(...half.map((r) => r.right)) - Math.min(...half.map((r) => r.left))
    };
    const size = tip.getBoundingClientRect();
    const pad = 8;
    let left = at.left + at.width * 0.62 - size.width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - size.width - pad));
    let top = at.top - size.height - pad;
    if (top < pad) top = at.bottom + pad;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  hideZoneTip() {
    if (this.hasZoneTipTarget) this.zoneTipTarget.classList.remove("is-open");
  }

  // ==================== the wordmark and its line ====================

  // The line under the wordmark is set to the wordmark's own width, letter by
  // letter, so the two end together. It is measured rather than guessed
  // because the text is translated and the wordmark changes size between the
  // landing screen and the results.
  fitTagline() {
    const line = this.taglineTarget;
    const row = this.logoRowTarget;
    line.style.letterSpacing = "";
    line.style.width = "";
    line.style.marginRight = "";
    // Only the landing screen locks the line to the wordmark; everywhere else
    // it keeps the centred line the stylesheet gives it.
    if (!this.element.classList.contains("state-landing")) {
      line.style.display = "";
      line.style.textAlign = "";
      return;
    }
    const rowWidth = row.getBoundingClientRect().width;
    if (!rowWidth) return;
    // The wordmark's letters stop at 95.3% of its box: the S ends there and
    // the rest is the room the L and the Q are drawn into.
    const target = rowWidth * 0.953;
    line.style.display = "block";
    line.style.width = `${rowWidth}px`;
    line.style.textAlign = "left";
    line.style.letterSpacing = "0px";

    // Measured with no spacing of its own, in a copy that is not shown.
    const probe = document.createElement("span");
    probe.style.cssText =
      "visibility:hidden;position:absolute;white-space:nowrap;font:inherit;letter-spacing:0;";
    probe.textContent = line.textContent;
    line.appendChild(probe);
    const natural = probe.getBoundingClientRect().width;
    probe.remove();

    const length = line.textContent.trim().length;
    if (!natural || length < 2) {
      line.style.width = "";
      line.style.textAlign = "";
      line.style.letterSpacing = "";
      return;
    }
    line.style.letterSpacing = `${(target - natural) / (length - 1)}px`;
  }

  watchTagline() {
    this.onResize = () => {
      clearTimeout(this.taglineTimer);
      this.taglineTimer = setTimeout(() => this.fitTagline(), 120);
    };
    window.addEventListener("resize", this.onResize);
    this.fitTagline();
    // Web fonts land after the first paint and change every measurement.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.fitTagline());
  }

  // ==================== widening the search ====================

  // For a reader who has been through the list and not found the word: the
  // search is run again over spellings near the one they tried. Every kind of
  // result is let back in, since a reader at this point is no longer ruling
  // anything out, and the list is left at the group that holds them.
  scanSimilar() {
    // Matches the Rails route this asks for:
    //   GET /search_output/results?term=…&scan=similar
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { term: this.inputTarget.value, scan: "similar" },
      // No backend yet: returning false cancels the request and the widening
      // is done against the sample. Delete beforeSend once the route exists.
      beforeSend: () => { this.widen(); return false; },
      success: (response) => { this.results = response; this.widen(); },
      error: () => this.widen()
    });
  }

  widen() {
    this.filterTargets.forEach((filter) => { filter.checked = true; });
    this.updateFilterCount();
    if (!this.pronunciationButtonTarget.classList.contains("active")) this.togglePronunciation();
    this.renderResults();
    const similar = this.resultsTableTarget.querySelector("#group-partial");
    if (similar) similar.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ==================== a group longer than a page ====================

  // Under a group still holding rows back: one press for the next page, and,
  // where that would take several presses, one for the whole group. The last
  // press says how many are left rather than offering a page bigger than the
  // remainder.
  showMoreHtml(bodyId, shown, total) {
    if (shown >= total) return TAIL;
    const left = total - shown;
    const more = `
      <button type="button" class="btn show-more" data-action="click->home#revealMore"
              data-group-body="${bodyId}">${this.escape(this.translate("showMore25", "Show 25 more"))}</button>`;
    const all = `
      <button type="button" class="btn show-more" data-action="click->home#revealAll"
              data-group-body="${bodyId}">${this.escape(
        this.translate("showAll", "Show all {total}").replace("{total}", total))}</button>`;
    const last = `
      <button type="button" class="btn show-more" data-action="click->home#revealAll"
              data-group-body="${bodyId}">${this.escape(
        this.translate("showLast", "Show last {remaining} of {total}")
          .replace("{remaining}", left).replace("{total}", total))}</button>`;

    return `
      <tr class="show-more-row">
        <td colspan="4"><span class="show-more-cell">${left <= PAGE ? last : more + (total > PAGE * 2 ? all : "")}</span></td>
      </tr>${TAIL}`;
  }

  revealMore(event) {
    this.reveal(event.currentTarget.dataset.groupBody, PAGE);
  }

  revealAll(event) {
    this.reveal(event.currentTarget.dataset.groupBody, Infinity);
  }

  // The rows are already on the page, held back by a class, so revealing them
  // costs nothing and the row a reader was looking at does not move.
  reveal(bodyId, howMany) {
    const body = this.resultsTableTarget.querySelector(`#${bodyId}`);
    if (!body) return;
    const held = Array.from(body.querySelectorAll("tr.result-row.is-held"));
    held.slice(0, howMany).forEach((row) => row.classList.remove("is-held"));

    const total = body.querySelectorAll("tr.result-row").length;
    const shown = total - body.querySelectorAll("tr.result-row.is-held").length;
    const controls = body.querySelector("tr.show-more-row");
    const next = this.showMoreHtml(bodyId, shown, total);
    if (next) controls.outerHTML = next; else controls.remove();
    window.LQ.refreshDynamicContent(body);
  }

  rowHtml(row, groupKey, held) {
    // In the lemma group the whole word is the searched term, so there is
    // nothing around it to mark.
    const markAffixes = groupKey !== "lemma";
    const readingClass = row.readingVerified ? "" : " reading-unverified";
    const readingLabel = row.readingVerified
      ? this.translate("readingVerified", "Editor-approved reading")
      : this.translate("readingAuto", "Machine-generated reading");

    return `
      <tr class="result-row${held ? " is-held" : ""}" data-category="${row.category}">
        <td class="result-zone result-cell" data-action="click->home#openEntry" data-zone-focus="result"
            data-zone-ottoman="${this.escape(row.resultOttoman)}"
            data-zone-latin="${this.escape(row.resultLatin)}"
            data-zone-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-headword-latin="${this.escape(row.headwordLatin)}"
            data-zone-dictionary="${this.escape(row.dictionary)}"
            data-zone-page="${this.escape(row.page)}"
            data-zone-tip="goToResult">
         <div class="result-cell-pair">
          <div class="result-main">
          <div class="word-pair">
            <span class="word-ottoman">
              <span class="word-box ottoman-box" data-direction="rtl"${this.menuData(row.resultOttoman, row.resultLatin)}>${this.highlight(row.resultOttoman, "ottoman", markAffixes)}${this.analysisHtml(row.resultOttoman, row.resultLatin)}</span>
            </span>
            <span class="word-latin">
              <span class="word-box latin-box${readingClass}" data-reading="${row.readingVerified ? "verified" : "auto"}"
                    aria-label="${this.escape(readingLabel)}"${this.menuData(row.resultOttoman, row.resultLatin)}>${this.escape(row.resultLatin)}${this.analysisHtml(row.resultOttoman, row.resultLatin)}</span>
            </span>
          </div>
          </div>
          <!-- The category belongs to the result, so it stands in the result's
               own half: a press anywhere in that half opens the same entry,
               and the half lights as one. It asks for 100px and the reading
               beside it for 430; where the card cannot hold both, each gives
               ground in proportion, which is why they meet in a different
               place from one row to the next. -->
          <div class="category-slot">
            <span class="category-badge">${this.escape(this.categoryLabel(row.category))}</span>
          </div>
         </div>
        </td>
        <td class="text-center result-zone" data-action="click->home#openEntry" data-zone-focus="headword"
            data-zone-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-latin="${this.escape(row.headwordLatin)}"
            data-zone-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-headword-latin="${this.escape(row.headwordLatin)}"
            data-zone-dictionary="${this.escape(row.dictionary)}"
            data-zone-page="${this.escape(row.page)}"
            data-zone-tip="goToHeadword">
          <i class="row-arrow" data-feather="arrow-right"></i>
        </td>
        <td class="headword-cell result-zone" data-action="click->home#openEntry" data-zone-focus="headword"
            data-zone-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-latin="${this.escape(row.headwordLatin)}"
            data-zone-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-headword-latin="${this.escape(row.headwordLatin)}"
            data-zone-dictionary="${this.escape(row.dictionary)}"
            data-zone-page="${this.escape(row.page)}"
            data-zone-tip="goToHeadword">
          <div class="word-pair">
            <span class="word-ottoman">
              <span class="word-box ottoman-box${row.misspelling ? " is-misspelled" : ""}" data-direction="rtl"${this.menuData(row.headwordOttoman, row.headwordLatin)}>${this.escape(row.headwordOttoman)}${this.analysisHtml(row.headwordOttoman, row.headwordLatin)}${this.misspellingHtml(row)}</span>
            </span>
            <span class="word-latin">
              <span class="word-box latin-box"${this.menuData(row.headwordOttoman, row.headwordLatin)}>${this.escape(row.headwordLatin)}${this.analysisHtml(row.headwordOttoman, row.headwordLatin)}</span>
            </span>
          </div>
        </td>
        <td class="dictionary-cell result-zone" data-action="click->home#openEntry" data-zone-focus="headword"
            data-zone-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-latin="${this.escape(row.headwordLatin)}"
            data-zone-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-headword-latin="${this.escape(row.headwordLatin)}"
            data-zone-dictionary="${this.escape(row.dictionary)}"
            data-zone-page="${this.escape(row.page)}"
            data-zone-tip="goToHeadword">
          <div class="dictionary-row">
            <div class="dictionary-text">
              <div class="dictionary-name">${this.escape(this.dictionaryLabelFor(row.dictionary))}</div>
              <div class="dictionary-page">${this.escape(this.translate("colPage", "Page"))} ${this.escape(row.page)}</div>
            </div>
            <div class="row-actions">
            <!-- A citation is of the dictionary entry the record sits under, not
                 of the form that matched, so it names the headword. -->
            <button type="button" class="btn cite-button" data-action="click->home#cite:stop"
                    data-cite-latin="${this.escape(row.headwordLatin)}"
                    data-cite-ottoman="${this.escape(row.headwordOttoman)}"
                    data-cite-dictionary="${this.escape(row.dictionary)}"
                    data-cite-page="${this.escape(row.page)}"
                    data-tooltip="${this.escape(this.translate("cite", "Cite"))}"
                    aria-label="${this.escape(this.translate("cite", "Cite"))}: ${this.escape(row.headwordLatin)}">
              ${window.LQ.citeIcon()}
            </button>
            <!-- Staff only: editing a stored reading, as opposed to a reader
                 suggesting a correction. Restrict this when permissions land. -->
            <button type="button" class="btn cite-button admin-only" hidden data-action="click->home#editEntry:stop"
                    title="${this.escape(this.translate("editEntry", "Edit entry"))}"
                    aria-label="${this.escape(this.translate("editEntry", "Edit entry"))}">
              <i data-feather="edit-2"></i>
            </button>
            </div>
          </div>
          </td>
      </tr>`;
  }

  // Bootstrap's collapse does not apply to a tbody, so the group toggle hides
  // its own rows through a class instead.
  toggleGroup(event) {
    const button = event.currentTarget;
    const body = button.closest("tbody");
    const collapsed = body.classList.toggle("is-collapsed");
    button.setAttribute("aria-expanded", String(!collapsed));
    // Opening a group again starts it at the first page. Someone who closed a
    // group they had read all of is putting it away, not keeping their place
    // in it.
    if (!collapsed) this.resetPages(body);
  }

  resetPages(body) {
    const rows = Array.from(body.querySelectorAll("tr.result-row"));
    if (rows.length <= PAGE) return;
    rows.forEach((row, at) => row.classList.toggle("is-held", at >= PAGE));
    const controls = body.querySelector("tr.show-more-row");
    const markup = this.showMoreHtml(body.id, PAGE, rows.length);
    if (controls) controls.outerHTML = markup;
    else body.insertAdjacentHTML("beforeend", markup);
    window.LQ.refreshDynamicContent(body);
  }

  // The description of a group says what belongs in it, which is worth
  // reading once and not on every visit; the toggle beside it puts it away.
  toggleNote(event) {
    const button = event.currentTarget;
    const note = button.closest(".group-note");
    const open = note.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  }

  cite(event) {
    const { citeLatin, citeOttoman, citeDictionary, citePage } = event.currentTarget.dataset;
    // The citation window answers this; it lives on the page once and serves
    // both the search results and the Word Decoder.
    document.dispatchEvent(new CustomEvent("citation:open", {
      detail: {
        latin: citeLatin,
        ottoman: citeOttoman,
        dictionary: citeDictionary,
        page: citePage
      }
    }));
  }

  // A row has two click zones, the result and the headword; both open the
  // entry window, and which one was pressed decides where it opens: the
  // result zone asks about the phrase, the headword zone about the entry.
  openEntry(event) {
    const zone = event.currentTarget.dataset;
    // Remembered so that the row can be pointed out again when the window
    // closes: a reader should not have to hunt for where they were.
    this.entrySource = event.currentTarget.closest("tr.result-row");
    document.dispatchEvent(new CustomEvent("entry:open", {
      detail: {
        focus: zone.zoneFocus,
        ottoman: zone.zoneOttoman,
        latin: zone.zoneLatin,
        headwordOttoman: zone.zoneHeadwordOttoman,
        headwordLatin: zone.zoneHeadwordLatin,
        dictionary: zone.zoneDictionary,
        page: zone.zonePage
      }
    }));
  }

  // What the hover menu needs to know about the word it is raised over: the
  // two spellings, which are enough to look it up, to find its family and to
  // take it apart.
  menuData(ottoman, latin) {
    return ` data-menu-ottoman="${this.escape(ottoman)}" data-menu-latin="${this.escape(latin)}"` +
      ` data-action="click->home#selectWord:stop"`;
  }

  // Pressing a word in a list marks it and leaves the row alone: the zone
  // around the words is what opens the entry window, so a reader can pick a
  // word out of a long list without the window taking over the screen.
  // Pressing it again, or pressing another, clears the mark.
  selectWord(event) {
    const box = event.currentTarget;
    const wasMarked = box.classList.contains("is-selected");
    this.element.querySelectorAll(".word-box.is-selected")
      .forEach((other) => other.classList.remove("is-selected"));
    if (!wasMarked) box.classList.add("is-selected");
  }

  // ==================== what a filter means ====================

  // Pointing at a category, or reaching it by keyboard, explains it in the
  // strip under the two columns. The name is read off the label rather than
  // translated again, so it is already in the interface language; the English
  // of the line itself sits on the label, since the strip is written here.
  describeFilter(event) {
    const label = event.target.closest("[data-filter-desc]");
    if (!label) return;
    const key = label.dataset.filterDesc;
    const name = label.querySelector(".form-check-label").textContent.trim();
    const strip = this.filterDescriptionTarget;
    // The strip says something else now, so the sweep must not put the
    // "hover a category" line back on the next change of language.
    strip.removeAttribute("data-i18n");
    strip.innerHTML =
      `<span class="filter-desc-body"><b>${this.escape(name)}</b>` +
      `<span class="filter-desc-text">${this.escape(this.translate(key, label.dataset.filterDescText))}</span></span>`;
  }

  forgetFilter(event) {
    if (event.target.closest("[data-filter-desc]") === null) return;
    // Moving between two parts of the same label is not leaving it.
    const to = event.relatedTarget;
    if (to && to.closest("[data-filter-desc]") === event.target.closest("[data-filter-desc]")) return;
    const strip = this.filterDescriptionTarget;
    strip.setAttribute("data-i18n", "filtersHover");
    strip.textContent = this.translate("filtersHover", "Hover a category to see its description");
  }

  // A word can be a root with three things hung off it. The badge offers to
  // take it apart, and only shows itself when the box is hovered, so the list
  // stays quiet until someone asks.
  analysisHtml(ottoman, latin) {
    return `
      <button type="button" class="btn analysis-badge"
              data-action="click->home#openAnalysis:stop"
              data-analysis-ottoman="${this.escape(ottoman)}"
              data-analysis-latin="${this.escape(latin)}"
              aria-label="${this.escape(this.translate("morphTitle", "Morphological Analysis"))}">
        <i data-feather="git-merge" aria-hidden="true"></i>
      </button>`;
  }

  openAnalysis(event) {
    const { analysisOttoman, analysisLatin } = event.currentTarget.dataset;
    document.dispatchEvent(new CustomEvent("morphology:open", {
      detail: { ottoman: analysisOttoman, latin: analysisLatin }
    }));
  }

  // Some dictionaries print a word wrongly. The mark hangs off the corner of
  // the headword as that dictionary spells it, and carries the proof: the
  // word as the page has it. Pressing it opens that page rather than the
  // entry, so the reader can see for themselves; the zone underneath must
  // not answer the same press.
  misspellingHtml(row) {
    if (!row.misspelling) return "";
    const crop = this.escape("../assets/scans/words/" + row.misspelling.crop);
    return `
      <button type="button" class="btn typo-mark"
              data-action="click->home#openScan:stop"
              data-scan-ottoman="${this.escape(row.resultOttoman)}"
              data-scan-latin="${this.escape(row.resultLatin)}"
              data-scan-headword-ottoman="${this.escape(row.headwordOttoman)}"
              data-scan-headword-latin="${this.escape(row.headwordLatin)}"
              data-scan-dictionary="${this.escape(row.dictionary)}"
              data-scan-page="${this.escape(row.page)}"
              aria-label="${this.escape(this.translate("typoAria", "Printed differently in this dictionary"))}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="11" y="6" width="2" height="9" rx="1"></rect><circle cx="12" cy="18" r="1.5"></circle></svg>
      </button>
      <!-- The proof stands beside the mark rather than inside it: the mark
           grows under the cursor and would take the card with it. -->
      <span class="typo-card" data-action="click->home#openScan:stop"
            data-scan-ottoman="${this.escape(row.resultOttoman)}"
            data-scan-latin="${this.escape(row.resultLatin)}"
            data-scan-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-scan-headword-latin="${this.escape(row.headwordLatin)}"
            data-scan-dictionary="${this.escape(row.dictionary)}"
            data-scan-page="${this.escape(row.page)}">
        <span class="typo-card-frame"><img src="${crop}" alt="" data-i18n-alt="typoAlt"></span>
        <span class="typo-card-labels">
          <span data-i18n="typoOriginal">Original</span>
          <span data-i18n="typoPrinted">Misspelled Word</span>
        </span>
      </span>`;
  }

  openScan(event) {
    const mark = event.currentTarget.dataset;
    document.dispatchEvent(new CustomEvent("dictionary-page:open", {
      detail: {
        ottoman: mark.scanOttoman,
        latin: mark.scanLatin,
        headwordOttoman: mark.scanHeadwordOttoman,
        headwordLatin: mark.scanHeadwordLatin,
        dictionary: mark.scanDictionary,
        page: mark.scanPage
      }
    }));
  }

  editEntry() {
    // Placeholder for the staff editing screen.
  }

  // ==================== helpers ====================

  // The searched term is left plain and the affixes around it are marked, so
  // the eye lands on what the dictionary added rather than on what was typed.
  highlight(text, script, markAffixes) {
    const term = this.activeTerm(script);
    if (!markAffixes || !term || !text || text.trim() === term) return this.escape(text);
    const at = text.indexOf(term);
    if (at === -1) return this.escape(text);
    const before = text.slice(0, at);
    const after = text.slice(at + term.length);
    // The marked word is kept in one wrapper so it stays a single run of
    // text: an Ottoman letter must still join to the affix picked out beside
    // it, which it cannot do across two boxes of a flex row.
    return `<span class="wb-word">`
      + (before ? `<span class="affix">${this.escape(before)}</span>` : "")
      + this.escape(term)
      + (after ? `<span class="affix">${this.escape(after)}</span>` : "")
      + `</span>`;
  }

  // Each column is marked against the term in its own script: the active
  // spelling when the scripts match, otherwise the first offered spelling in
  // that script. A Latin search still marks affixes in the Ottoman column.
  activeTerm(script) {
    if (this.activeSpelling && this.activeSpelling.script === script) return this.activeSpelling.text;
    const spellings = (this.results && this.results.spellings) || [];
    const match = spellings.find((spelling) => spelling.script === script);
    return match ? match.text : "";
  }

  categoryLabel(category) {
    const labels = { ENTRY: "catEntry", SUBENTRY: "catSubentry", RELATED: "catRelated" };
    const fallbacks = { ENTRY: "Headword", SUBENTRY: "Subheadword", RELATED: "Related" };
    return this.translate(labels[category], fallbacks[category] || category);
  }

  // The shared helpers, named here so the calls above read the same as they
  // do in every other controller.
  translate(key, fallback) { return window.LQ.translate(key, fallback); }

  escape(value) { return window.LQ.escape(value); }
}

application.register("home", HomeController);
