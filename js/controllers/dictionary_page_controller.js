// js/controllers/dictionary_page_controller.js
// The original dictionary page window.
//
// A result row has two click zones: the result itself and the headword. Both
// open this window on the scan the record came from; the zone only decides
// which entry it opens on. The row announces "dictionary-page:open" and this
// controller answers, the same way the citation window is opened.
//
// The window follows the modal rule: an empty container on the page, the
// markup in a <template>, filled in before Bootstrap shows it.
//
// The endpoint the backend will provide is documented in
// js/dictionary_page_sample.js.

const VIEWS = ["slice", "column", "page"];
// The three kinds of record a column holds. The arrows step through one kind
// at a time, because a reader following the headwords down a column does not
// want to be taken through every subentry on the way.
const KINDS = ["entry", "sub", "related"];

class DictionaryPageController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail);
    document.addEventListener("dictionary-page:open", this.onOpen);
    this.onLanguageChange = () => { if (this.entry) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("dictionary-page:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.modal) this.modal.dispose();
  }

  open(request) {
    // Matches the Rails route this window expects:
    //   GET /dictionary_page/entry?dictionary=…&page=…&word=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { dictionary: request.dictionary, page: request.page, word: request.ottoman },
      // No backend yet: returning false cancels the request and the window is
      // fed sample data instead. Delete beforeSend once the route exists.
      beforeSend: () => { this.receive(this.sample(request), request); return false; },
      success: (response) => this.receive(response, request),
      error: () => this.receive(null, request)
    });
  }

  // The sample holds two entries of one column, so the arrows have somewhere
  // to go; the headword the row carries picks the one to open on.
  sample(request) {
    const data = window.LQ_DICTIONARY_PAGE_SAMPLE || { entries: [] };
    const wanted = data.entries.findIndex((entry) =>
      entry.headwordLatin === request.headwordLatin ||
      entry.headwordOttoman === request.headwordOttoman);
    return { entries: data.entries, index: wanted < 0 ? 0 : wanted };
  }

  receive(response, request) {
    this.entries = (response && response.entries) || [];
    this.index = (response && response.index) || 0;
    this.entry = this.entries[this.index] || null;
    // The arrows start on the kind of record the window opened on.
    this.kind = (this.entry && this.entry.category) || "entry";
    this.view = "slice";
    this.request = request;
    this.reporting = null;

    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    this.modal.show();
  }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template) return;
    window.LQ.disposeWidgets(this.element);
    // Bootstrap caches the dialog element when the modal is constructed, so
    // the instance is disposed before the markup under it is replaced. Not
    // while the window is open, though: disposing then would take the
    // backdrop with it and leave the page covered.
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.element.classList.contains("show")) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    this.fill();
    window.LQ.refreshDynamicContent(this.element);
  }

  fill() {
    const entry = this.entry;
    const find = (selector) => this.element.querySelector(selector);
    if (!entry) {
      const frame = find("[data-scan-frame]");
      if (frame) frame.hidden = true;
      find("[data-scan-missing]").hidden = false;
      return;
    }

    find("[data-scan-dictionary]").textContent = window.LQ.dictionaryLabel(entry.dictionary);
    find("[data-scan-headword-ottoman]").textContent = entry.headwordOttoman;
    find("[data-scan-headword-latin]").textContent = entry.headwordLatin;

    VIEWS.forEach((name) => {
      const button = find(`[data-scan-view="${name}"]`);
      if (!button) return;
      button.setAttribute("aria-pressed", String(name === this.view));
      button.querySelector("[data-scan-count]").textContent = entry[name];
    });

    this.fillKinds();
    this.drawView();
  }

  // ==================== stepping through the column ====================

  // Which records the arrows will walk, in the order they sit in the column.
  neighbours() {
    return this.entries.filter((record) => (record.category || "entry") === this.kind);
  }

  fillKinds() {
    const find = (selector) => this.element.querySelector(selector);
    const here = this.neighbours();
    const at = here.indexOf(this.entry);

    KINDS.forEach((kind, column) => {
      const button = find(`[data-scan-kind="${kind}"]`);
      if (!button) return;
      const chosen = kind === this.kind;
      button.classList.toggle("active", chosen);
      button.setAttribute("aria-pressed", String(chosen));
      button.disabled = !this.entries.some((record) => (record.category || "entry") === kind);
      if (chosen) {
        const marker = find("[data-scan-kind-marker]");
        if (marker) marker.style.setProperty("--scan-kind-at", column);
      }
    });

    // The arrows say which kind they will step through, and are disabled at
    // the ends of it rather than wrapping round.
    const label = find(`[data-scan-kind="${this.kind}"] span`);
    const name = label ? label.textContent.trim() : "";
    const previous = find("[data-scan-previous]");
    const next = find("[data-scan-next]");
    if (previous) {
      previous.disabled = at <= 0;
      previous.setAttribute("aria-label",
        `${this.translate("scanPrevious", "Previous")} ${name}`.trim());
    }
    if (next) {
      next.disabled = at < 0 || at >= here.length - 1;
      next.setAttribute("aria-label",
        `${this.translate("scanNext", "Next")} ${name}`.trim());
    }
  }

  // Switching kind lands on the record of that kind nearest the one on
  // screen, so the reader stays roughly where they were in the column.
  selectKind(event) {
    this.kind = event.currentTarget.dataset.scanKind;
    const here = this.neighbours();
    if (!here.length) return;
    const nearest = here.reduce((best, record) =>
      Math.abs(this.entries.indexOf(record) - this.index) <
      Math.abs(this.entries.indexOf(best) - this.index) ? record : best, here[0]);
    this.entry = nearest;
    this.index = this.entries.indexOf(nearest);
    this.fill();
  }

  translate(key, fallback) {
    return window.LQ.translate(key, fallback);
  }

  drawView() {
    const view = (this.entry.views || {})[this.view] || {};
    const frame = this.element.querySelector("[data-scan-frame]");
    const missing = this.element.querySelector("[data-scan-missing]");
    frame.hidden = !view.image;
    missing.hidden = Boolean(view.image);
    if (!view.image) return;

    const image = frame.querySelector("img");
    image.src = view.image;
    image.alt = window.LQ.translate("scanAlt", "The entry as printed in the source volume");
    frame.style.setProperty("--scan-ratio", view.ratio || 2);

    // A box is a rectangle on the scan, so it is placed as a percentage and
    // the scan can be shown at any size.
    frame.querySelectorAll(".scan-box").forEach((box) => box.remove());
    (view.boxes || []).forEach((box, position) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `scan-box scan-box-${box.category}`;
      element.dataset.scanBox = String(position);
      element.style.top = `${box.top}%`;
      element.style.left = `${box.left}%`;
      element.style.width = `${box.width}%`;
      element.style.height = `${box.height}%`;
      element.setAttribute("aria-label", `${box.latin} — ${box.ottoman}`);
      element.dataset.action = "mouseenter->dictionary-page#showWord " +
        "focus->dictionary-page#showWord mouseleave->dictionary-page#hideWord " +
        "blur->dictionary-page#hideWord";
      frame.appendChild(element);
    });
  }

  // ==================== the box under the cursor ====================

  showWord(event) {
    const box = this.boxFor(event.currentTarget);
    if (!box) return;
    const card = this.element.querySelector("[data-scan-card]");
    card.querySelector("[data-scan-word-ottoman]").textContent = box.ottoman;
    card.querySelector("[data-scan-word-latin]").textContent = box.latin;
    card.dataset.scanFor = event.currentTarget.dataset.scanBox;
    card.hidden = false;

    // The card hangs under the box it describes, in the frame's own
    // coordinates. They are custom properties rather than top and left so the
    // stylesheet can dock the card at the foot of the frame on a narrow
    // screen, where there is no room beside the box.
    const element = event.currentTarget;
    card.style.setProperty("--card-left", element.style.left);
    card.style.setProperty("--card-top",
      `calc(${element.style.top} + ${element.style.height})`);
    // A box in the right half would push the card off the scan, so there the
    // card hangs from the box's right edge instead.
    const left = parseFloat(element.style.left) || 0;
    const width = parseFloat(element.style.width) || 0;
    card.style.setProperty("--card-right", `${Math.max(0, 100 - left - width)}%`);
    card.classList.toggle("is-flipped", left + width / 2 > 55);
  }

  hideWord(event) {
    // Moving onto the card itself must not dismiss it
    const card = this.element.querySelector("[data-scan-card]");
    if (event.relatedTarget && card.contains(event.relatedTarget)) return;
    card.hidden = true;
  }

  boxFor(element) {
    const view = (this.entry.views || {})[this.view] || {};
    return (view.boxes || [])[Number(element.dataset.scanBox)];
  }

  // ==================== the controls ====================

  selectView(event) {
    this.view = event.currentTarget.dataset.scanView;
    this.fill();
  }

  previous() { this.step(-1); }
  next() { this.step(1); }

  step(direction) {
    const here = this.neighbours();
    const wanted = here.indexOf(this.entry) + direction;
    if (wanted < 0 || wanted >= here.length) return;
    this.entry = here[wanted];
    this.index = this.entries.indexOf(this.entry);
    this.fill();
  }

  // A word on the scan is a search waiting to be run, so the window closes
  // and the page searches it.
  search(event) {
    const card = event.currentTarget.closest("[data-scan-card]");
    const script = event.currentTarget.dataset.scanScript;
    const term = card.querySelector(`[data-scan-word-${script}]`).textContent;
    this.modal.hide();
    document.dispatchEvent(new CustomEvent("search:run", { detail: { term, script } }));
  }

  // The citation window is the same one the row's Cite button opens. This
  // window closes first rather than stacking a second one on top of it.
  cite() {
    const detail = {
      latin: this.entry.headwordLatin,
      ottoman: this.entry.headwordOttoman,
      dictionary: this.entry.dictionary,
      page: this.entry.page
    };
    this.element.addEventListener("hidden.bs.modal", () => {
      document.dispatchEvent(new CustomEvent("citation:open", { detail }));
    }, { once: true });
    this.modal.hide();
  }

  // Staff only: opens the editing screen for the word's stored value. The
  // reader's route is the flag beside it, which files a report instead.
  editWord() {
    // Placeholder for the staff editing screen, as on a result row.
  }

  // ==================== reporting an error ====================

  report(event) {
    const card = event.currentTarget.closest("[data-scan-card]");
    this.reporting = {
      ottoman: card.querySelector("[data-scan-word-ottoman]").textContent,
      latin: card.querySelector("[data-scan-word-latin]").textContent
    };
    const report = this.element.querySelector("[data-scan-report]");
    report.querySelector("[data-scan-report-ottoman]").textContent = this.reporting.ottoman;
    report.querySelector("[data-scan-report-latin]").textContent = this.reporting.latin;
    report.querySelector("[data-scan-report-form]").hidden = false;
    report.querySelector("[data-scan-report-thanks]").hidden = true;
    report.querySelector("textarea").value = "";
    this.element.querySelector("[data-scan-card]").hidden = true;
    this.element.querySelector("[data-scan-view-body]").hidden = true;
    report.hidden = false;
  }

  sendReport(event) {
    event.preventDefault();
    // Nothing is submitted anywhere yet; the form stands for the screen the
    // backend will render.
    const report = this.element.querySelector("[data-scan-report]");
    report.querySelector("[data-scan-report-form]").hidden = true;
    report.querySelector("[data-scan-report-thanks]").hidden = false;
  }

  closeReport() {
    this.element.querySelector("[data-scan-report]").hidden = true;
    this.element.querySelector("[data-scan-view-body]").hidden = false;
  }
}

application.register("dictionary-page", DictionaryPageController);
