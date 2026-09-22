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

class HomeController extends Stimulus.Controller {
  static targets = [
    "inputWrapper", "input", "placeholderLatin", "placeholderEnglish", "placeholderOttoman",
    "sourceOption", "submit", "scriptHint", "scriptWarning",
    "filter", "filterCount", "dictionary", "dictionaryLabel", "allDictionaries",
    "resultsSurface", "resultsTable", "resultsAccent", "resultsTerm", "recordCount", "dictionaryCount",
    "groupCopy",
    "spellingRow", "pronunciationButton", "pronunciationCount",
    "emptyState", "noMatches"
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
    // Text this controller writes itself is not covered by the data-i18n sweep,
    // so it is rewritten whenever the interface language changes.
    this.element.addEventListener("language:changed", () => {
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
  }

  disconnect() {
    document.removeEventListener("search:run", this.onSearchRequest);
    document.removeEventListener("view-state:change", this.onViewState);
    document.removeEventListener("search-keyboard:key", this.onKeyboardKey);
    document.removeEventListener("search-keyboard:closed", this.onKeyboardClosed);
    document.removeEventListener("ottoman-keyboard:request", this.onDecoderKeyboard);
    this.inputTarget.removeEventListener("keydown", this.onKeyDown);
  }

  // The four screens this controller owns. The other two, the entry window
  // and the Redhouse entry, belong to their own controllers.
  showViewState(state) {
    if (state === "results" || state === "no-results") {
      this.sideValue = "ottoman";
      this.applySide();
      this.inputTarget.value = "نظر";
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
    this.emptyStateTarget.hidden = false;
    this.resultsSurfaceTarget.hidden = true;
    this.noMatchesTarget.hidden = true;
  }

  emptySample() {
    return { term: "نظر", totals: { records: 0, dictionaries: 0 }, spellings: [], groups: [] };
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

  // The dictionary column shows the name with its publication year.
  dictionaryLabelFor(name) {
    const year = (window.LQ_DICTIONARY_YEARS || {})[name];
    return year ? `${name}, ${year}` : name;
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
    this.emptyStateTarget.hidden = true;
    this.resultsSurfaceTarget.hidden = false;
    this.resultsTableTarget.querySelectorAll("tbody.result-group").forEach((body) => body.remove());
    this.noMatchesTarget.textContent = this.translate("searchFailed", "The search could not be completed. Please try again.");
    this.noMatchesTarget.hidden = false;
  }

  receive(results) {
    this.results = results;
    this.activeSpelling = (results.spellings || []).find((s) => s.active) || null;
    this.element.classList.remove("state-landing");
    this.element.classList.add("state-results");
    this.emptyStateTarget.hidden = true;
    this.resultsSurfaceTarget.hidden = false;

    const totals = results.totals || {};
    this.recordCountTarget.textContent = totals.records || 0;
    this.dictionaryCountTarget.textContent = totals.dictionaries || 0;
    this.pronunciationCountTarget.textContent = results.similarPronunciationCount || 0;
    this.noMatchesTarget.textContent = this.translate("noResults", "No results found.");

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

  togglePronunciation(event) {
    const button = event.currentTarget;
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

    this.noMatchesTarget.hidden = shown > 0;
    window.LQ.refreshDynamicContent(this.resultsSurfaceTarget);
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
          <th colspan="6" scope="colgroup">
            <button type="button" class="btn group-toggle" aria-expanded="true" aria-controls="${bodyId}"
                    data-action="click->home#toggleGroup">
              <span class="group-chevron"><i data-feather="chevron-down"></i></span>
              <span class="group-title">${title}</span>
              <span class="group-count">${group.count}</span>
            </button>
            ${note ? `<span class="group-note">${note}${example ? ` &middot; ${example}` : ""}</span>` : ""}
          </th>
        </tr>
        ${rows.map((row) => this.rowHtml(row, group.key)).join("")}
      </tbody>`;
  }

  rowHtml(row, groupKey) {
    // In the lemma group the whole word is the searched term, so there is
    // nothing around it to mark.
    const markAffixes = groupKey !== "lemma";
    const readingClass = row.readingVerified ? "" : " reading-unverified";
    const readingLabel = row.readingVerified
      ? this.translate("readingVerified", "Editor-approved reading")
      : this.translate("readingAuto", "Machine-generated reading");

    return `
      <tr class="result-row" data-category="${row.category}">
        <td class="result-zone" data-action="click->home#openEntry" data-zone-focus="result"
            data-zone-ottoman="${this.escape(row.resultOttoman)}"
            data-zone-latin="${this.escape(row.resultLatin)}"
            data-zone-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-headword-latin="${this.escape(row.headwordLatin)}"
            data-zone-dictionary="${this.escape(row.dictionary)}"
            data-zone-page="${this.escape(row.page)}"
            title="${this.escape(this.translate("goToResult", "Go to this result"))}">
          <div class="word-pair">
            <span class="word-ottoman">
              <span class="word-box ottoman-box" data-direction="rtl">${this.highlight(row.resultOttoman, "ottoman", markAffixes)}</span>
              ${this.misspellingHtml(row)}
            </span>
            <span class="word-latin">
              <span class="word-box latin-box${readingClass}" title="${this.escape(readingLabel)}">${this.escape(row.resultLatin)}</span>
            </span>
          </div>
        </td>
        <td class="text-center">
          <span class="category-badge">${this.escape(this.categoryLabel(row.category))}</span>
        </td>
        <td class="text-center">
          <i class="row-arrow" data-feather="arrow-right"></i>
        </td>
        <td class="headword-cell result-zone" data-action="click->home#openEntry" data-zone-focus="headword"
            data-zone-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-latin="${this.escape(row.headwordLatin)}"
            data-zone-headword-ottoman="${this.escape(row.headwordOttoman)}"
            data-zone-headword-latin="${this.escape(row.headwordLatin)}"
            data-zone-dictionary="${this.escape(row.dictionary)}"
            data-zone-page="${this.escape(row.page)}"
            title="${this.escape(this.translate("goToHeadword", "Go to the headword"))}">
          <div class="word-pair">
            <span class="word-ottoman">
              <span class="word-box ottoman-box" data-direction="rtl">${this.escape(row.headwordOttoman)}</span>
            </span>
            <span class="word-latin">
              <span class="word-box latin-box">${this.escape(row.headwordLatin)}</span>
            </span>
          </div>
        </td>
        <td class="dictionary-cell">
          <div class="dictionary-name">${this.escape(this.dictionaryLabelFor(row.dictionary))}</div>
          <div class="dictionary-page">${this.escape(this.translate("colPage", "Page"))} ${this.escape(row.page)}</div>
        </td>
        <td>
          <div class="row-actions">
          <button type="button" class="btn cite-button" data-action="click->home#cite"
                  data-cite-latin="${this.escape(row.resultLatin)}"
                  data-cite-ottoman="${this.escape(row.resultOttoman)}"
                  data-cite-dictionary="${this.escape(row.dictionary)}"
                  data-cite-page="${this.escape(row.page)}"
                  title="${this.escape(this.translate("cite", "Cite"))}"
                  aria-label="${this.escape(this.translate("cite", "Cite"))}: ${this.escape(row.resultLatin)}">
            <i data-feather="clipboard"></i>
          </button>
          <!-- Staff only: editing a stored reading, as opposed to a reader
               suggesting a correction. Restrict this when permissions land. -->
          <button type="button" class="btn cite-button admin-only" data-action="click->home#editEntry"
                  title="${this.escape(this.translate("editEntry", "Edit entry"))}"
                  aria-label="${this.escape(this.translate("editEntry", "Edit entry"))}">
            <i data-feather="edit-2"></i>
          </button>
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

  // Some dictionaries print a word wrongly. The row carries the mark, and
  // the mark carries the proof: the word as the page has it. Pressing it
  // opens that page rather than the entry, so the reader can see for
  // themselves; the zone underneath must not answer the same press.
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
        <i data-feather="alert-circle" aria-hidden="true"></i>
        <span class="typo-card">
          <img src="${crop}" alt="" data-i18n-alt="typoAlt">
          <span class="typo-card-labels">
            <span data-i18n="typoOriginal">Original</span>
            <span data-i18n="typoPrinted">As printed</span>
          </span>
        </span>
      </button>`;
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
    return (before ? `<span class="affix">${this.escape(before)}</span>` : "")
      + this.escape(term)
      + (after ? `<span class="affix">${this.escape(after)}</span>` : "");
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
