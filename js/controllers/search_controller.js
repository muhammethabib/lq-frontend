// js/controllers/search_controller.js
// Drives the search page: language mode, submit, result rendering and the detail modal.

class SearchController extends Stimulus.Controller {
  static targets = ["input", "languagePill", "resultsBody", "resultsTable", "emptyState", "detailModal"]
  static values = {
    language: { type: String, default: "latin" },
    endpoint: { type: String, default: "/search_output/results" }
  }

  connect() {
    this.applyLanguageMode();
  }

  // ---- language mode -------------------------------------------------

  selectLanguage(event) {
    this.languageValue = event.currentTarget.dataset.language;
    this.applyLanguageMode();
  }

  applyLanguageMode() {
    this.languagePillTargets.forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.language === this.languageValue);
    });
    // Direction is data-driven so the Rails side can set it from the real record
    this.inputTarget.dataset.direction = this.languageValue === "ottoman" ? "rtl" : "ltr";
  }

  // ---- search --------------------------------------------------------

  submit(event) {
    event.preventDefault();
    const query = this.inputTarget.value.trim();
    if (!query) return;

    // Matches the future Rails route: GET /search_output/results?q=...&language=...
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { q: query, language: this.languageValue },
      // No backend yet: returning false from beforeSend cancels the real request
      // and the page is fed sample data instead. Remove beforeSend once the route exists.
      beforeSend: () => { this.renderResults(this.sampleResults(query)); return false; },
      success: (response) => this.renderResults(response)
    });
  }

  renderResults(results) {
    this.resultsBodyTarget.innerHTML = results.map((result) => this.resultRowHtml(result)).join("");
    const hasResults = results.length > 0;
    this.resultsTableTarget.classList.toggle("d-none", !hasResults);
    this.emptyStateTarget.classList.toggle("d-none", hasResults);
    window.LQ.refreshDynamicContent(this.resultsBodyTarget);
  }

  resultRowHtml(result) {
    return `
      <tr>
        <td><span class="result-category" data-category="${result.category}">${result.categoryLabel}</span></td>
        <td class="fw-semibold">${result.headword}</td>
        <td data-direction="rtl">${result.ottoman}</td>
        <td class="result-definition">${result.definition}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-secondary"
                  data-action="click->search#openDetail"
                  data-headword="${result.headword}"
                  data-definition="${result.definition}">
            <i data-feather="external-link"></i>
          </button>
        </td>
      </tr>`;
  }

  // ---- detail modal ---------------------------------------------------

  openDetail(event) {
    const { headword, definition } = event.currentTarget.dataset;
    const modalElement = this.detailModalTarget;
    modalElement.innerHTML = document.getElementById("searchDetailTemplate").innerHTML;
    modalElement.querySelector(".detail-headword").textContent = headword;
    modalElement.querySelector(".detail-definition").innerHTML = definition;
    window.LQ.refreshDynamicContent(modalElement);
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  // ---- sample data ----------------------------------------------------

  // Replaces the server response until /search_output/results exists.
  // Includes short, long and highlighted content so the layout is exercised.
  sampleResults(query) {
    return [
      {
        category: "entry", categoryLabel: "Entry",
        headword: query, ottoman: "كتاب",
        definition: `<span class="result-match">${query}</span>: a bound set of written pages.`
      },
      {
        category: "sub-entry", categoryLabel: "Sub-entry",
        headword: `${query}hane`, ottoman: "كتابخانه",
        definition: "A library; also a bookshop. A very long definition follows so that wrapping and row height can be checked against real dictionary text, which is rarely one line long and frequently mixes <b>bold headwords</b> with plain text."
      },
      {
        category: "related", categoryLabel: "Related",
        headword: "kâtip", ottoman: "كاتب",
        definition: "Scribe."
      }
    ];
  }
}

application.register("search", SearchController);
