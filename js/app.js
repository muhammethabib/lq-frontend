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

// Slack. While a panel is open the page carries this much scroll beyond
// whatever the panel itself needs, so there is always somewhere further down
// to go. A page that ends exactly where the panel does answers a flick of the
// wheel with nothing, which reads as the page being stuck rather than
// finished, and a reader who cannot move the page goes looking for something
// to drag instead.
const PANEL_SLACK = 140;

// How far the line being scrolled to may move before the page is sent after
// it a second time. Smaller than any real change of destination, larger than
// the panel settling into its final height.
const PANEL_AIM_SLACK = 12;

// How long the page takes to travel, and the least it will ever take. The
// browser's own smooth scroll eases in as well as out, so for the first
// eighty milliseconds it moves less than a pixel -- and a panel that has
// already appeared, over a page that has not yet started, reads as two
// events rather than one movement. This one leaves at once and arrives
// gently, which is the shape of a thing being carried rather than nudged.
const PANEL_GLIDE_MS = 320;
const PANEL_GLIDE_MIN_MS = 180;

// The one outline that shows a carried panel where it came from. There is
// never more than one panel in hand, so there is never more than one.
const HOME_GHOST_ID = "lq-home-ghost";

window.LQ = {
  // The line down the document the page is currently travelling to, or null
  // when it is not travelling anywhere. See makeRoomFor.
  scrollAim: null,

  // How far the page has already been made to reach. See roomToReach.
  reached: -Infinity,

  // The animation frame the page is being carried on, and the listener that
  // hands it back to the reader. See glideTo.
  gliding: 0,
  glideAim: null,
  glideOff: null,

  // A fresh journey: the next ask is not a repeat of the last one, and what
  // the page reaches is worked out again rather than remembered -- the panel
  // may be a different one, and the page under it a different length.
  forgetScrollAim() {
    this.scrollAim = null;
    this.reached = -Infinity;
  },

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
    const box = panel.getBoundingClientRect();
    this.roomToReach(window.scrollY + box.bottom + PANEL_TAIL + PANEL_SLACK - window.innerHeight);
    return Math.max(0, box.bottom + PANEL_TAIL - window.innerHeight);
  },

  // The page made long enough to be scrolled as far as a given line. The panel
  // is fixed, so it adds nothing to the page's own height and the page may
  // have nowhere to scroll to; this is what makes somewhere.
  //
  // It asks the page how far it reaches rather than working it out, and tops
  // the room up until the answer is far enough. Working it out needs the
  // page's natural height, which is its height now less the room already
  // given -- and the height now is whatever the browser last settled on,
  // which in the same breath as adding the room is a height from before the
  // room existed. Reading it back is also what makes the browser settle the
  // new height, so each turn of the loop both corrects the last guess and
  // makes the next reading true. It takes one or two turns and stops.
  //
  // The line is a line down the document, not a distance from where the
  // reader happens to be standing. A room measured from the current scroll
  // grows every time it is asked for, because scrolling into the room it has
  // just added makes the page short again -- and this is asked for on every
  // scroll event.
  //
  // It is never taken back. A panel that closes has no more use for the room,
  // but taking it away moves everything under the pointer. What is left
  // behind is a tail of empty page below the content, which costs a reader
  // who scrolls to the very end a moment's puzzlement and costs everyone else
  // nothing -- and the next opening asks to reach the same line rather than a
  // line further down, so it does not build up.
  roomToReach(reach) {
    // Asked for on every scroll event, so the cheap answer matters: a line
    // already reached is a line already reached, and saying so costs nothing.
    // Measuring it instead means reading the page's height straight after the
    // panel has been moved, which makes the browser work the whole layout out
    // there and then -- seventeen times across a scroll, and the frame it
    // lands in is the frame that drops.
    // Whole pixels throughout. Rounded up at the moment it is written but
    // compared as it was asked for, the room gains a pixel on each opening
    // and the page quietly lengthens over a session.
    const want = Math.ceil(reach);
    if (want <= this.reached) return;
    for (let turn = 0; turn < 3; turn += 1) {
      const short = want - (document.documentElement.scrollHeight - window.innerHeight);
      if (short <= 0) break;
      const current = parseFloat(
        getComputedStyle(document.body).getPropertyValue("--lq-panel-room")) || 0;
      document.body.classList.add("has-panel-room");
      document.body.style.setProperty("--lq-panel-room", `${Math.ceil(current + short)}px`);
    }
    this.reached = want;
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
  //
  // Asked for outright -- the reader has just pressed a box -- it goes
  // whether or not the panel is short of its tail. The panel landing in the
  // same place every time is worth more than the page being left alone: a
  // keyboard that sometimes appears under the boxes and sometimes wherever
  // the page happened to be standing is a keyboard the reader has to look
  // for, and looking for it is what the whole arrangement is meant to spare
  // them.
  //
  // The foot it is brought to can be given rather than measured. A panel the
  // reader has carried off somewhere is still opened by a press on the boxes,
  // and what that press asks for is the boxes -- so the page is brought to
  // where the panel's foot would be if it were standing where the page puts
  // it, not to wherever the panel has been left.
  makeRoomFor(panel, row, lift, asked, foot) {
    const panelBox = panel.getBoundingClientRect();
    const bottom = typeof foot === "number" ? foot : panelBox.bottom;
    const past = bottom + PANEL_TAIL - window.innerHeight;
    this.roomFor(panel);
    // Nothing to carry when the window is tall enough to hold it all already:
    // the row stands whole on the screen, and the panel's foot, with its tail
    // of page beneath it, is above the bottom edge. Asking is for the page
    // that has to travel, not for the page that is already where it is being
    // asked to go -- a page that jumps on a screen with room to spare is the
    // same complaint from the other side.
    const rowTop = row && row.isConnected ? row.getBoundingClientRect().top : 0;
    if (past <= 0 && (!asked || rowTop >= 0)) return 0;
    if (!row || !row.isConnected) {
      if (past > 0) window.scrollBy({ top: past, behavior: "smooth" });
      return Math.max(0, past);
    }

    const rowBox = row.getBoundingClientRect();
    const block = bottom - rowBox.top;
    // Where the row lands if the strip above it is brought to the top
    const wanted = lift && lift.isConnected
      ? rowBox.top - lift.getBoundingClientRect().top + PANEL_LIFT
      : PANEL_HEADROOM;
    const target = Math.max(PANEL_HEADROOM,
      Math.min(wanted, window.innerHeight - PANEL_TAIL - block));
    const step = Math.round(rowBox.top - target);
    if (step <= 0) return 0;
    // Room for the whole journey, not just the overlap: without it the scroll
    // runs out of page and the block lands somewhere in between, which is the
    // wandering this was meant to put a stop to. And the slack past the end of
    // it, so the page the reader lands on still answers the wheel. The line is
    // where the journey ends, which is a line down the document and the same
    // one however often this is asked.
    this.roomToReach(window.scrollY + step + PANEL_SLACK);
    // Asked for once, not once per measurement. This is worked out again a few
    // times while the panel finishes drawing, and each time it is asked for
    // the browser throws away the smooth scroll in flight and starts a fresh
    // one from a standstill -- so the page sets off, stops, sets off again.
    // The line being aimed at is a line down the document and does not move
    // while the page travels towards it, so a second ask for the same line is
    // the same ask and is let go. A dozen pixels of slack covers the panel
    // turning out slightly taller than it first measured; anything more than
    // that is a different destination and is worth interrupting for.
    const aim = Math.round(window.scrollY + step);
    if (this.scrollAim === null || Math.abs(aim - this.scrollAim) > PANEL_AIM_SLACK) {
      this.scrollAim = aim;
      this.glideTo(aim);
    }
    // How far the page is about to travel, for a caller that has to judge
    // where things will be rather than where they are: the scroll is smooth
    // and has not happened yet.
    return step;
  },

  // The page carried to a line, by hand rather than by the browser.
  //
  // Two reasons not to leave it to the browser. It eases in, so the first
  // stretch of the journey is invisible and the page looks stuck while the
  // panel sits there already open; and a second request throws the first away
  // and starts again from a standstill, which is felt as a stumble. This one
  // leaves at its fastest and slows into the mark, and a second request for
  // the same mark is let go before it ever gets here.
  //
  // The reader wins. A wheel, a touch or a key during the journey ends it
  // where it stands: a page that argues with the hand on it is worse than a
  // page that never moved. And where motion is not wanted at all, it simply
  // arrives.
  glideTo(aim) {
    // Already on the way there. The opening can be announced more than once --
    // the field asks, the page forwards -- and a second telling must not throw
    // away a journey already under way and start it again from a standstill.
    if (this.gliding && this.glideAim === aim) return;
    this.stopGlide();
    this.glideAim = aim;
    const from = window.scrollY;
    const far = aim - from;
    if (!far) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: aim, behavior: "instant" });
      return;
    }
    const ms = Math.max(PANEL_GLIDE_MIN_MS,
      Math.min(PANEL_GLIDE_MS, Math.abs(far) * 1.1));
    const start = performance.now();
    this.glideOff = () => this.stopGlide();
    ["wheel", "touchstart", "keydown"].forEach((name) =>
      window.addEventListener(name, this.glideOff, { passive: true, once: true }));
    const step = (now) => {
      if (!this.gliding) return;
      const part = Math.min(1, (now - start) / ms);
      // Out of the gate at full speed, and settling rather than stopping.
      const eased = 1 - Math.pow(1 - part, 3);
      // Spelled out, because the page itself asks for smooth scrolling: left
      // to the stylesheet every frame of this would start its own little
      // animation and none of them would arrive.
      window.scrollTo({ top: Math.round(from + far * eased), behavior: "instant" });
      if (part < 1) this.gliding = requestAnimationFrame(step); else this.stopGlide();
    };
    this.gliding = requestAnimationFrame(step);
  },

  stopGlide() {
    if (this.gliding) cancelAnimationFrame(this.gliding);
    this.gliding = 0;
    this.glideAim = null;
    if (!this.glideOff) return;
    ["wheel", "touchstart", "keydown"].forEach((name) =>
      window.removeEventListener(name, this.glideOff));
    this.glideOff = null;
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

  // The button's own name, for a reader hearing the page: named by what it
  // does, as a button is. It is all this control says in words now -- the
  // line that teaches it is shown once when it arrives, and a hover on it
  // lights the old place up on the page, which says it better than a tooltip
  // could and does not talk over itself.
  pinName() {
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
