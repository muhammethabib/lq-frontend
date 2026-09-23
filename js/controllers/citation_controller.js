// js/controllers/citation_controller.js
// The Bibliographic Information window.
//
// A result row's Cite button does not open this itself; it announces
// "citation:open" on the document with the record it stands for, and this
// controller answers. That keeps the search results and the Word Decoder
// from each needing their own copy of the window.
//
// The window follows the modal rule: the container on the page is empty, the
// markup lives in a <template>, and it is filled in before Bootstrap shows
// it. At integration the template becomes a server-rendered snippet and
// nothing else about this changes.

const CITATION_STYLES = ["apa", "chicago", "harvard"];

class CitationController extends Stimulus.Controller {
  static values = { template: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail);
    document.addEventListener("citation:open", this.onOpen);
    // The window is filled in the language it is opened in, so a switch
    // while it is open re-renders it rather than leaving half of it English.
    this.onLanguageChange = () => {
      if (!this.record) return;
      // The window is rebuilt from its English template, so the style the
      // reader had chosen is put back afterwards.
      const chosen = this.element.querySelector(".cite-tab.active");
      const target = chosen && chosen.dataset.bsTarget;
      this.render();
      const restored = target && this.element.querySelector(`[data-bs-target="${target}"]`);
      if (restored) bootstrap.Tab.getOrCreateInstance(restored).show();
    };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("citation:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    clearTimeout(this.resetTimer);
    if (this.modal) this.modal.dispose();
  }

  open(record) {
    this.record = record;
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
    // The markup comes from the template in English, so it is swept before
    // the generated values are written into it.
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    this.fill();
    window.LQ.refreshDynamicContent(this.element);
  }

  // The record names its dictionary; the rest of the reference comes from the
  // dictionary table, since a result row carries only the page.
  fill() {
    const record = this.record;
    const source = (window.LQ_DICTIONARIES || {})[record.dictionary] || {};
    const values = {
      word: record.ottoman,
      reading: record.latin,
      title: record.dictionary,
      author: source.author || "—",
      year: source.year || "—",
      volume: source.volume || "—",
      page: record.page || "—"
    };
    Object.keys(values).forEach((name) => {
      const slot = this.element.querySelector(`[data-citation-field="${name}"]`);
      if (slot) slot.textContent = values[name];
    });

    CITATION_STYLES.forEach((style) => {
      const slot = this.element.querySelector(`[data-citation-style="${style}"]`);
      if (slot) slot.innerHTML = this.reference(style, values, source);
    });
  }

  // The three styles differ in how they order author, year, volume and page.
  // Every value is escaped: the page and the volume come from the record, and
  // this string is written with innerHTML.
  reference(style, values, source) {
    const safe = window.LQ.escape;
    const title = `<em>${safe(values.title)}</em>`;
    const author = safe(values.author);
    const place = `${safe(this.city(source))}: ${safe(source.publisher || "—")}`;
    const year = safe(values.year);
    const volumeNumber = safe(values.volume);
    const pageNumber = safe(values.page);
    const volume = safe(window.LQ.translate("citeVolumeShort", "vol."));
    const page = safe(window.LQ.translate("citePageShort", "p."));
    if (style === "chicago") {
      return `${author}. ${title}. ${volume} ${volumeNumber}, ${place}, ${year}, ${page} ${pageNumber}.`;
    }
    // Harvard names the publisher before the place, and neither is bound to
    // the other, so this one style does not use the place pair above.
    if (style === "harvard") {
      const publisher = safe(source.publisher || "—");
      const city = safe(this.city(source));
      return `${author} ${year}, ${title}, ${volume} ${volumeNumber}, ${page} ${pageNumber}, ${publisher}, ${city}.`;
    }
    return `${author} (${year}). ${title} (${volume} ${volumeNumber}, ${page} ${pageNumber}). ${place}.`;
  }

  // A place of publication is a name, and names differ between languages:
  // Vienna is Viyana in Turkish. The record carries both.
  city(source) {
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    const city = source.city;
    if (!city) return "—";
    return typeof city === "string" ? city : (city[language] || city.en || "—");
  }

  // The reference is copied as plain text, so the italics do not travel into
  // whatever the reader pastes it into.
  copy(event) {
    const button = event.currentTarget;
    const active = this.element.querySelector(".tab-pane.active [data-citation-style]");
    if (!active) return;
    const label = button.querySelector("[data-citation-label]");
    const done = () => {
      label.textContent = window.LQ.translate("citeCopied", "Copied");
      button.classList.add("is-copied");
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => {
        label.textContent = window.LQ.translate("citeCopy", "Copy reference");
        button.classList.remove("is-copied");
      }, 1600);
    };
    const text = active.textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
    else done();
  }
}

application.register("citation", CitationController);
