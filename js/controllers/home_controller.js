// js/controllers/home_controller.js
// The main page: the search bar, the filters and the result list.

class HomeController extends Stimulus.Controller {
  static targets = [
    "inputWrapper", "input", "placeholderLatin", "placeholderEnglish", "placeholderOttoman",
    "sourceOption", "submit",
    "filter", "filterCount", "dictionary", "dictionaryLabel", "allDictionaries",
    "resultsSurface", "resultsAccent", "resultsTerm", "recordCount", "dictionaryCount",
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
    this.refreshDictionaryLabel();
    // Text this controller writes itself is not covered by the data-i18n sweep,
    // so it is rewritten whenever the interface language changes.
    this.element.addEventListener("language:changed", () => {
      this.refreshDictionaryLabel();
      this.renderSpellings();
      this.renderResults();
    });
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
  }

  applySide() {
    const isOttoman = this.sideValue === "ottoman" && this.sourceValue !== "english";
    this.inputTarget.dataset.direction = isOttoman ? "rtl" : "ltr";
    this.inputTarget.style.textAlign = isOttoman ? "right" : "left";
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
      beforeSend: () => { this.receive(this.sampleFor(query)); return false; },
      success: (response) => this.receive(response)
    });
  }

  receive(results) {
    this.results = results;
    this.activeSpelling = (results.spellings || []).find((s) => s.active) || null;
    this.element.classList.remove("state-landing");
    this.element.classList.add("state-results");
    this.emptyStateTarget.hidden = true;
    this.resultsSurfaceTarget.hidden = false;

    this.recordCountTarget.textContent = results.totals.records;
    this.dictionaryCountTarget.textContent = results.totals.dictionaries;
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
  sampleFor(query) {
    return window.LQ_SAMPLE_RESULTS;
  }

  // ==================== results rendering ====================

  renderSpellings() {
    const spellings = (this.results && this.results.spellings) || [];
    this.spellingRowTarget.innerHTML = spellings.map((spelling, index) => `
      <button type="button" class="spelling-button${spelling === this.activeSpelling ? " active" : ""}"
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

    const table = this.resultsSurfaceTarget.querySelector(".results-table");
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
    // Translation keys follow the group key: lemma -> groupLemma, groupLemmaNote,
    // groupLemmaExample.
    const base = "group" + group.key.charAt(0).toUpperCase() + group.key.slice(1);
    const title = this.translate(base, this.groupTitles[group.key] || group.key);
    const note = this.translate(`${base}Note`, this.groupNotes[group.key] || "");
    const example = this.translate(`${base}Example`, this.groupExamples[group.key] || "");
    const bodyId = `group-${group.key}`;

    return `
      <tbody class="result-group" id="${bodyId}">
        <tr class="group-header">
          <th colspan="6" scope="colgroup">
            <button type="button" class="group-toggle" aria-expanded="true" aria-controls="${bodyId}"
                    data-action="click->home#toggleGroup">
              <span class="group-chevron"><i data-feather="chevron-down"></i></span>
              <span class="group-title">${this.escape(title)}</span>
              <span class="group-count">${group.count}</span>
            </button>
            ${note ? `<span class="group-note">${this.escape(note)}${example ? ` &middot; ${example}` : ""}</span>` : ""}
            <!-- note is escaped; example is our own markup with <b>, not data -->
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
        <td>
          <div class="word-pair">
            <span class="word-ottoman">
              <span class="word-box ottoman-box" data-direction="rtl">${this.highlight(row.resultOttoman, "ottoman", markAffixes)}</span>
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
        <td class="headword-cell">
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
          <button type="button" class="cite-button" data-action="click->home#cite"
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
          <button type="button" class="cite-button admin-only" data-action="click->home#editEntry"
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
    // The citation modal is its own feature; until it exists the reference is
    // put on the clipboard so the action is not a dead end.
    const reference = `${citeOttoman} (${citeLatin}). ${this.dictionaryLabelFor(citeDictionary)}, p. ${citePage}.`;
    if (navigator.clipboard) navigator.clipboard.writeText(reference).catch(() => {});
  }

  editEntry() {
    // Placeholder for the staff editing screen.
  }

  // ==================== side menu ====================

  // Menu entries carry both language variants, so the link follows the
  // interface language instead of duplicating the menu per language.
  openPage(event) {
    event.preventDefault();
    const link = event.currentTarget;
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    const target = language === "tr" ? link.dataset.pageTr : link.dataset.pageEn;
    if (target) window.open(target, "_blank", "noopener");
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

  translate(key, fallback) {
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    const dictionary = (window.LQ_TRANSLATIONS && window.LQ_TRANSLATIONS[language]) || {};
    return key in dictionary ? dictionary[key] : fallback;
  }

  escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  get groupTitles() {
    return {
      lemma: "Lemma",
      inflected: "Inflected Forms",
      lexicalizedInflected: "Lexicalized Inflected Forms",
      derived: "Derived Forms",
      phrases: "Phrases",
      compounds: "Compounds",
      partial: "Similar Spellings"
    };
  }

  get groupNotes() {
    return {
      lemma: "Results without an affix, including the base or singular form of a value",
      inflected: "Results showing inflected forms of the search term",
      lexicalizedInflected: "Inflected forms that carry their own dictionary meaning",
      derived: "Words built with derivational affixes",
      phrases: "Phrases containing the search term",
      compounds: "Compound words containing the search term",
      partial: "Results spelled close to the search term"
    };
  }

  get groupExamples() {
    return {
      lemma: "<b>kalem</b>, <b>dost</b>",
      inflected: "<b>kalem</b> &rarr; <b>kalem</b>i, <b>kalem</b>e",
      lexicalizedInflected: "<b>civar</b> &rarr; <b>civarında</b>",
      derived: "<b>kalem</b> &rarr; <b>kalem</b>lik, <b>kalem</b>ci",
      phrases: "<b>nazar</b> &rarr; <b>nazar</b> değmek",
      compounds: "<b>nazar</b> &rarr; <b>nazar</b>gâh",
      partial: ""
    };
  }
}

application.register("home", HomeController);
