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
