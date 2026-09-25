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

  // A tooltip reads its text once, when it is built. An element whose title
  // changes -- because the language changed, or because the button now leads
  // somewhere else -- has its tooltip built again around the new words.
  // Disposing comes first: disposing is what puts the old title back on the
  // element, so setting the new one before that would lose it.
  retitle(element, text) {
    if (!element) return;
    const built = window.bootstrap ? bootstrap.Tooltip.getInstance(element) : null;
    if (built) built.dispose();
    element.setAttribute("title", text);
    if (element.hasAttribute("data-bs-title")) element.setAttribute("data-bs-title", text);
    if (element.dataset.bsToggle === "tooltip") bootstrap.Tooltip.getOrCreateInstance(element);
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
    // The panel is fixed, so it adds nothing to the page's own height and the
    // page may have nowhere to scroll to. What is wanted is not the overlap
    // but the scroll range the page is short of: the room makes up that
    // difference, and only then is there anywhere to scroll.
    const current = parseFloat(
      getComputedStyle(document.body).getPropertyValue("--lq-panel-room")) || 0;
    const reach = document.documentElement.scrollHeight - window.innerHeight;
    const short = (window.scrollY + past) - reach;
    document.body.classList.add("has-panel-room");
    if (short > 0) {
      document.body.style.setProperty("--lq-panel-room", `${Math.ceil(current + short + 20)}px`);
    } else if (!current) {
      document.body.style.setProperty("--lq-panel-room", "0px");
    }
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

  // What the pin on a floating keyboard says when the pointer reaches it.
  // Two things have to be said and a dash between them tells the reader
  // neither: what is true now, and what a press would do. So they are two
  // blocks, the second wearing a mouse -- drawn by the stylesheet, since
  // Bootstrap's tooltip strips an svg out of its own markup -- and the verb
  // in a chip, which reads as the thing to do rather than more description.
  pinTip() {
    const safe = this.escape;
    return '<span class="pin-tip-now"><b>' +
      safe(this.translate("keyboardPinnedState", "Pinned")) + '</b>' +
      '<i>' + safe(this.translate("keyboardPinnedWhat", "the keyboard always opens here")) + '</i></span>' +
      '<span class="pin-tip-do"><em>' + safe(this.translate("keyboardPinDo", "click")) + '</em>' +
      safe(this.translate("keyboardPinUndo", "to put it back")) + '</span>';
  },

  // The same in one line, for a reader who is hearing it rather than seeing it
  pinTipText() {
    return [this.translate("keyboardPinnedState", "Pinned") + ".",
            this.translate("keyboardPinnedWhat", "the keyboard always opens here") + ".",
            this.translate("keyboardPinDo", "click"),
            this.translate("keyboardPinUndo", "to put it back")].join(" ");
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

// A window opened over another -- the citation over the dictionary page --
// has to stand above it. Bootstrap gives every modal the same z-index, so
// each one opened while another is up is lifted a step, and the step is
// given back when it closes. Escape and a click on the ground then reach the
// window on top, which is the one the reader is looking at.
(() => {
  const STEP = 20;

  // Each open window holds the keyboard inside itself. The one underneath
  // has to let go, or it takes the focus back and answers the Escape meant
  // for the window on top.
  const trap = (element, active) => {
    const instance = bootstrap.Modal.getInstance(element);
    const focus = instance && instance._focustrap;
    if (!focus) return;
    if (active) focus.activate(); else focus.deactivate();
  };

  document.addEventListener("show.bs.modal", (event) => {
    const open = [...document.querySelectorAll(".modal.show")];
    const lift = open.length * STEP;
    if (open.length) {
      event.target.style.zIndex = 1055 + lift;
      open.forEach((element) => trap(element, false));
    }
    // Windows darken the page differently -- a scan is held up to the light,
    // a report is read on a stilled page -- and the backdrop is added after
    // this event, so it is marked and lifted once it exists.
    const kind = event.target.dataset.backdrop;
    requestAnimationFrame(() => {
      const backdrops = document.querySelectorAll(".modal-backdrop");
      const backdrop = backdrops[backdrops.length - 1];
      if (!backdrop) return;
      if (kind) backdrop.classList.add(`backdrop-${kind}`);
      if (lift) backdrop.style.zIndex = 1050 + lift;
    });
  });

  // Bootstrap takes the scroll lock off the body as soon as any modal closes,
  // so it is put back while one is still up.
  document.addEventListener("hidden.bs.modal", (event) => {
    event.target.style.removeProperty("z-index");
    const open = [...document.querySelectorAll(".modal.show")];
    if (!open.length) return;
    document.body.classList.add("modal-open");
    // The window that is now on top takes the keyboard back.
    trap(open[open.length - 1], true);
  });
})();
