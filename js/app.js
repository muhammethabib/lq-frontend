// Application bootstrap shared by every page.
// Starts Stimulus and exposes helpers that controllers call after inserting HTML.

const application = Stimulus.Application.start();

// Feather icons and Bootstrap tooltips are rendered once on load and must be
// re-run whenever new HTML is injected (modals, AJAX results). Controllers call
// window.LQ.refreshDynamicContent(rootElement) after such changes.
//
// feather.replace() has no scoped form, so it always sweeps the whole document;
// it only touches elements that still carry data-feather, so re-running it is
// cheap. The root argument scopes the tooltip pass, which does support it.
window.LQ = {
  refreshDynamicContent(root = document) {
    feather.replace();
    root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      bootstrap.Tooltip.getOrCreateInstance(element);
    });
  },

  // A tooltip holds a reference to its element, so it is disposed before the
  // element leaves the page rather than left behind. The root is swept too,
  // because querySelectorAll never matches the element it is called on.
  disposeTooltips(root) {
    this.disposeWidgets(root, { Tooltip: '[data-bs-toggle="tooltip"]' });
  },

  // Bootstrap keeps one instance per element, so a widget inside markup that
  // is about to be replaced is disposed first: otherwise the instance outlives
  // the element it was built for. Controllers that re-render a modal from its
  // template call this before writing the new markup.
  disposeWidgets(root, widgets) {
    if (!root) return;
    const kinds = widgets || {
      Tooltip: '[data-bs-toggle="tooltip"]',
      Popover: '[data-bs-toggle="popover"]',
      Tab: '[data-bs-toggle="tab"]'
    };
    Object.keys(kinds).forEach((kind) => {
      const selector = kinds[kind];
      const dispose = (element) => {
        const instance = bootstrap[kind].getInstance(element);
        if (instance) instance.dispose();
      };
      if (root.matches && root.matches(selector)) dispose(root);
      if (root.querySelectorAll) root.querySelectorAll(selector).forEach(dispose);
    });
  },

  // The Turkish string for a key, or the English fallback.
  translate(key, fallback) {
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    const dictionary = (window.LQ_TRANSLATIONS && window.LQ_TRANSLATIONS[language]) || {};
    return key in dictionary ? dictionary[key] : fallback;
  },

  // Anything going into generated markup passes through here first.
  escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  },

  // A panel fixed to the window can open below the fold, and a fixed panel
  // cannot be scrolled to: the page has to have somewhere to scroll first.
  // These give the page exactly the room the panel needs and take it back
  // when the panel closes. Both keyboards use them.
  makeRoomFor(panel) {
    const past = panel.getBoundingClientRect().bottom + 16 - window.innerHeight;
    if (past <= 0) { this.releaseRoom(); return; }
    document.body.classList.add("has-panel-room");
    document.body.style.setProperty("--lq-panel-room", `${Math.ceil(past)}px`);
    window.scrollBy({ top: past, behavior: "smooth" });
  },

  // Taking the room back moves everything under the pointer, and a press that
  // lands on one thing and lets go over another is a press that never
  // happened. So the room goes only when the page is back at the top, which
  // is the one moment nothing moves.
  releaseRoom() {
    if (window.scrollY > 0) {
      if (this.waitingForTop) return;
      this.waitingForTop = () => {
        if (window.scrollY > 0) return;
        window.removeEventListener("scroll", this.waitingForTop);
        this.waitingForTop = null;
        this.releaseRoom();
      };
      window.addEventListener("scroll", this.waitingForTop, { passive: true });
      return;
    }
    document.body.classList.remove("has-panel-room");
    document.body.style.removeProperty("--lq-panel-room");
  },

  // The mark on every button that opens the citation window. It is a pair of
  // quotation marks, which Feather has no icon for, so it is drawn here once
  // rather than pasted into each of the four places that cite.
  citeIcon() {
    return `<svg class="cite-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(24,0) scale(-1,1)"><rect x="1.6" y="10.8" width="8.4" height="8.4" rx="3"></rect><path d="M3.5 14.6V10.3C3.5 7.4 4.8 6 7.2 5.2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path><rect x="13.2" y="10.8" width="8.4" height="8.4" rx="3"></rect><path d="M15.1 14.6V10.3C15.1 7.4 16.4 6 18.8 5.2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`;
  },

  // A dictionary is shown with its publication year where one is known.
  dictionaryLabel(name) {
    const record = (window.LQ_DICTIONARIES || {})[name];
    const year = record && record.year;
    return year ? `${name}, ${year}` : name;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.LQ.refreshDynamicContent();
});
