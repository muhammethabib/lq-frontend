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
// How much of the window is left under a panel once the page has been brought
// to it. Enough that the panel plainly ends above the fold rather than sitting
// against it, so a reader can see there is nothing below it they are missing.
// It is also what decides whether the page moves at all: a panel that already
// has this much under it is a panel nothing is wrong with.
const PANEL_TAIL = 72;

// Where the strip above the row -- the tabs -- lands when the page is brought
// to the panel. The row, the panel and the tabs then read as one block at the
// top of the window, the same block at every size that has room for it.
const PANEL_LIFT = 16;

// ...and how near the top of the window the row itself may be pulled, when
// the window is too short to have the tabs as well. The row goes last: a
// panel whose own row is off the top has lost what it is for.
const PANEL_HEADROOM = 24;

// The one outline that shows a carried panel where it came from. There is
// never more than one panel in hand, so there is never more than one.
const HOME_GHOST_ID = "lq-home-ghost";

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
  // The room alone, without moving the reader: the page is made long enough
  // that the panel can be scrolled to. Called as the page scrolls, so that a
  // panel following the row it belongs to is always reachable, whatever the
  // reader does with the scrollbar.
  roomFor(panel) {
    const past = panel.getBoundingClientRect().bottom + PANEL_TAIL - window.innerHeight;
    if (past <= 0) { this.releaseRoom(); return 0; }
    this.roomToScroll(past);
    return past;
  },

  // The page made long enough to be scrolled by a given distance. The panel
  // is fixed, so it adds nothing to the page's own height and the page may
  // have nowhere to scroll to; what is wanted is not the overlap but the
  // scroll range the page is short of, and only once that is made up is
  // there anywhere to scroll.
  roomToScroll(want) {
    if (want <= 0) { this.releaseRoom(); return; }
    // A release still waiting for the top of the page would take the room
    // away the moment the reader got there, with the panel still needing it.
    this.stopWaitingForTop();
    const current = parseFloat(
      getComputedStyle(document.body).getPropertyValue("--lq-panel-room")) || 0;
    const reach = document.documentElement.scrollHeight - window.innerHeight;
    const short = (window.scrollY + want) - reach;
    document.body.classList.add("has-panel-room");
    if (short > 0) {
      document.body.style.setProperty("--lq-panel-room", `${Math.ceil(current + short + 20)}px`);
    } else if (!current) {
      document.body.style.setProperty("--lq-panel-room", "0px");
    }
  },

  // The room, and the page brought to the panel.
  //
  // Whether it moves at all is one question: a panel that already has its
  // tail of window under it is a panel nothing is wrong with, and the page
  // stays where it is -- on a tall window, and equally where the reader has
  // already scrolled somewhere that works. Nobody is argued with.
  //
  // How far it moves is the other, and it is not "the least it can". A panel
  // that only just clears the fold is a panel the reader is not sure has
  // finished, and they start dragging it about to see the rest. So the page
  // goes all the way: the strip above the row to the top of the window, the
  // row under it, the panel under that, the same block at every size with
  // room for it. Where there is not room, the lift gives way first and the
  // row last -- it may come no nearer the top than its own headroom.
  makeRoomFor(panel, row, lift) {
    const past = panel.getBoundingClientRect().bottom + PANEL_TAIL - window.innerHeight;
    if (past <= 0) { this.releaseRoom(); return; }
    if (!row || !row.isConnected) {
      this.roomToScroll(past);
      window.scrollBy({ top: past, behavior: "smooth" });
      return;
    }

    const rowBox = row.getBoundingClientRect();
    const block = panel.getBoundingClientRect().bottom - rowBox.top;
    // Where the row lands if the strip above it is brought to the top
    const wanted = lift && lift.isConnected
      ? rowBox.top - lift.getBoundingClientRect().top + PANEL_LIFT
      : PANEL_HEADROOM;
    const target = Math.max(PANEL_HEADROOM,
      Math.min(wanted, window.innerHeight - PANEL_TAIL - block));
    const step = Math.round(rowBox.top - target);
    if (step <= 0) return;
    // Room for the whole journey, not just the overlap: without it the scroll
    // runs out of page and the block lands somewhere in between, which is the
    // wandering this was meant to put a stop to.
    this.roomToScroll(step);
    window.scrollBy({ top: step, behavior: "smooth" });
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
        this.stopWaitingForTop();
        this.releaseRoom();
      };
      window.addEventListener("scroll", this.waitingForTop, { passive: true });
      return;
    }
    this.stopWaitingForTop();
    document.body.classList.remove("has-panel-room");
    document.body.style.removeProperty("--lq-panel-room");
  },

  stopWaitingForTop() {
    if (!this.waitingForTop) return;
    window.removeEventListener("scroll", this.waitingForTop);
    this.waitingForTop = null;
  },

  // The place a carried panel came from, drawn behind it while the reader
  // brings it back. A panel that snaps home from somewhere near it is a
  // kindness nobody can use if they cannot see where near is: the outline
  // says where to aim, and firms up once letting go would land it there.
  // Nothing can be pressed on it and nothing reads it aloud -- it is a mark
  // on the page, not a control.
  showHome(spot, width, height, near, armed) {
    let ghost = document.getElementById(HOME_GHOST_ID);
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.id = HOME_GHOST_ID;
      ghost.className = "keyboard-home-ghost";
      ghost.setAttribute("aria-hidden", "true");
      document.body.appendChild(ghost);
    }
    ghost.style.left = `${Math.round(spot.left)}px`;
    ghost.style.top = `${Math.round(spot.top)}px`;
    ghost.style.width = `${Math.round(width)}px`;
    ghost.style.height = `${Math.round(height)}px`;
    ghost.style.setProperty("--lq-ghost", String(near));
    ghost.classList.toggle("is-armed", !!armed);
    ghost.hidden = false;
  },

  hideHome() {
    const ghost = document.getElementById(HOME_GHOST_ID);
    if (ghost) ghost.hidden = true;
  },

  // The mark on every button that opens the citation window. It is a pair of
  // quotation marks, which Feather has no icon for, so it is drawn here once
  // rather than pasted into each of the four places that cite.
  citeIcon() {
    return `<svg class="cite-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(24,0) scale(-1,1)"><rect x="1.6" y="10.8" width="8.4" height="8.4" rx="3"></rect><path d="M3.5 14.6V10.3C3.5 7.4 4.8 6 7.2 5.2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path><rect x="13.2" y="10.8" width="8.4" height="8.4" rx="3"></rect><path d="M15.1 14.6V10.3C15.1 7.4 16.4 6 18.8 5.2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`;
  },

  // What the control on a floating keyboard says when the pointer reaches it.
  // Only what a press would do. That the panel is standing where the reader
  // put it is not news to them -- they put it there, and the panel sitting
  // somewhere the page never puts it says so without a word. The mouse in
  // front is drawn by the stylesheet, since Bootstrap's tooltip strips an svg
  // out of its own markup, and the verb sits alone in a chip so it reads as
  // the thing to do rather than more description.
  pinTip() {
    const safe = this.escape;
    return '<span class="pin-tip-do"><em>' +
      safe(this.translate("keyboardPinDo", "click")) + '</em>' +
      safe(this.translate("keyboardPinUndo", "to put it back")) + '</span>';
  },

  // The same for a reader who is hearing it rather than seeing it, where a
  // button is named by what it does.
  pinTipText() {
    return this.translate("keyboardPinBack", "Put the keyboard back");
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
