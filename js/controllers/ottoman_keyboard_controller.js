// js/controllers/ottoman_keyboard_controller.js
// The on-screen Ottoman keyboard.
//
// It knows nothing about what it types into. Every key announces itself as an
// "ottoman-keyboard:key" event on the document, and whichever field is open
// decides what to do with it. That keeps the keyboard reusable: the word
// decoder listens today, the search bar can listen later.
//
// The keys come from js/keyboard_layout.js and are grouped by letter family,
// because a reader working from a manuscript recognises a shape before they
// decide which letter it is.
//
// Every key uses pointerdown rather than click, so pressing one never takes
// focus away from the field being typed into.
//
// The empty stretches of the top bar are the handle: the panel can be dragged
// off the boxes it covers, springs back if it is let go near where it started,
// and otherwise stays where it was put. js/keyboard_placement.js holds that
// decision, for the session and, if the reader asks, across visits.

// Below this width the stylesheet docks the keyboard to the bottom of the
// screen; the same query lives in css/ottoman-keyboard.css.
const KEYBOARD_DOCK_QUERY = "(max-width: 767px)";

// How long a key stays down after the reader's own key wrote its letter.
const KEY_ECHO_MS = 170;

// Let go this near the place the page picked and the panel is going back
// there, not being placed somewhere new.
const KEYBOARD_SNAP_PX = 40;

// The name this panel's place is held under.
const KEYBOARD_PLACE = "decoder";

// The room the word that says the panel is fixed needs above it, and how
// long it stays before it has been read.
const KEYBOARD_FLAG_ROOM_PX = 44;

// How long the pin takes to fade out when the panel goes back to the
// place the page picks: the stylesheet's own animation, run to the end.
const KEYBOARD_PIN_LEAVING_MS = 620;
const KEYBOARD_FLAG_MS = 1900;

// How long the pin wears the class that pops it in and sends its two rings
// out: the stylesheet's own animations, run to the end.
const KEYBOARD_PIN_ARRIVAL_MS = 2500;

// The face of the key that leads to the other keyboard, and the arrows that
// say which way it goes.
const KEYBOARD_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="2" y="4" width="20" height="16" rx="2"/>' +
  '<path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>';
const ARROW_LEFT = '<svg class="panel-switch-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
const ARROW_RIGHT = '<svg class="panel-switch-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

class OttomanKeyboardController extends Stimulus.Controller {
  static targets = ["basicPanel", "advancedPanel", "wildcardRow", "bar", "pin", "flag"]
  static values = { open: { type: Boolean, default: false } }

  connect() {
    this.renderPanels();
    this.showPanel("basic");

    // The field being typed into asks for the keyboard and says where it is
    this.onRequest = (event) => {
      this.owner = event.detail.owner || null;
      this.below = event.detail.below || null;
      this.guard = event.detail.guard || null;
      this.openNear(event.detail.anchor);
    };
    this.onDismiss = () => this.close();
    document.addEventListener("ottoman-keyboard:request", this.onRequest);
    document.addEventListener("ottoman-keyboard:dismiss", this.onDismiss);

    // The panel follows the row as the page scrolls, and the page keeps
    // whatever length it takes to be able to scroll to it: a keyboard the
    // reader can see but cannot reach is a keyboard they have lost.
    this.onReposition = () => {
      if (!this.openValue) return;
      this.place();
      if (!this.placedSpot()) window.LQ.roomFor(this.element);
    };
    window.addEventListener("scroll", this.onReposition, true);

    // A window made smaller can leave the panel below the fold although it is
    // still under the boxes where it belongs, so the page is brought to it
    // again. Not on scroll: that is the reader moving the page themselves,
    // and scrolling them back would be an argument they cannot win.
    this.onResize = () => {
      if (!this.openValue) return;
      this.place();
      if (!this.placedSpot()) this.scrollIntoReach();
    };
    window.addEventListener("resize", this.onResize);

    // The keys carry their labels and tooltips, so a language change rebuilds
    // them. The event is dispatched on the page root, an ancestor of this
    // element, so it is listened for on document where it bubbles to.
    this.onLanguageChange = () => {
      window.LQ.disposeTooltips(this.element);
      this.renderPanels();
      this.showPanel(this.advancedPanelTarget.classList.contains("is-active") ? "advanced" : "basic");
      // The pin's label says which of its two states it is in, so it is
      // written again rather than left with the one the markup carries.
      this.refreshPin();
    };
    document.addEventListener("language:changed", this.onLanguageChange);

    // The panel's Clear is always on show: while the keyboard covers the row,
    // it is the only one there is.
    this.onState = () => {};
    document.addEventListener("ottoman-keyboard:state", this.onState);

    // A letter written on the reader's own keyboard shows its key going down
    // here too, and retires the line that says the board takes it.
    this.onEcho = (event) => {
      const detail = event.detail || {};
      if (detail.wildcard) this.echoWildcard(detail.wildcard); else this.echo(detail.char);
    };
    document.addEventListener("ottoman-keyboard:echo", this.onEcho);
  }

  disconnect() {
    document.removeEventListener("ottoman-keyboard:request", this.onRequest);
    document.removeEventListener("ottoman-keyboard:dismiss", this.onDismiss);
    document.removeEventListener("ottoman-keyboard:echo", this.onEcho);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("ottoman-keyboard:state", this.onState);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onReposition, true);
    window.LQ.disposeTooltips(this.element);
  }

  // ==================== building the keys ====================

  renderPanels() {
    const layout = window.LQ_KEYBOARD_LAYOUT || { basic: [], advanced: [], wildcards: {} };
    this.renderWildcards(layout.wildcards || {});
    this.basicPanelTarget.innerHTML = this.panelHtml(layout.basic, "advanced");
    this.advancedPanelTarget.innerHTML = this.panelHtml(layout.advanced, "basic");
    window.LQ.refreshDynamicContent(this.element);
  }

  // The face of a wildcard key is the same symbol it writes into the slot
  renderWildcards(wildcards) {
    this.wildcardRowTarget.innerHTML = Object.keys(wildcards).map((name) => {
      const wildcard = wildcards[name];
      const label = this.translate(wildcard.labelKey, wildcard.label || name);
      // The label may break itself over two lines; the reader who hears it
      // rather than sees it gets the line as one sentence.
      const spoken = label.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return `<button type="button" class="btn wildcard-key" data-wildcard="${this.escape(name)}"
        data-action="pointerdown->ottoman-keyboard#pressWildcard"
        data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${this.escape(label)}"
        data-bs-custom-class="keyboard-tip keyboard-tip-nowrap"
        aria-label="${this.escape(spoken)}">${wildcard.mark || this.escape(wildcard.symbol)}</button>`;
    }).join("");
  }

  panelHtml(rows, switchTo) {
    return rows.map((row, index) => {
      const isLast = index === rows.length - 1;
      return `<div class="keyboard-row">
        ${row.map((key) => this.keyHtml(key)).join("")}
        ${isLast ? this.switchHtml(switchTo) : ""}
      </div>`;
    }).join("");
  }

  // ==================== the echo of the reader's own keyboard ====================

  // The key that writes a letter is shown pressed for as long as a press of
  // one's own lasts. A skeleton cannot echo: it stands for several letters
  // and no single key on the board wrote it.
  echo(letter) {
    if (!letter) return;
    const panel = this.advancedPanelTarget.classList.contains("is-active")
      ? this.advancedPanelTarget : this.basicPanelTarget;
    this.light(panel.querySelector(`.key[data-kind="letter"][data-char="${CSS.escape(letter)}"]`));
  }

  // The star the reader typed lights the star on the board, for the same
  // reason: the two boards are meant to read as one.
  echoWildcard(name) {
    if (!name || !this.hasWildcardRowTarget) return;
    this.light(this.wildcardRowTarget.querySelector(`[data-wildcard="${CSS.escape(name)}"]`));
  }

  // A key lights claret for a moment when it writes, however it was pressed.
  // The class is taken off and put back on with a reflow between, so a second
  // press of the same key starts the light again rather than leaving it on.
  light(key) {
    if (!key) return;
    key.classList.remove("is-echo");
    void key.offsetWidth;
    key.classList.add("is-echo");
    clearTimeout(key.echoTimer);
    key.echoTimer = setTimeout(() => key.classList.remove("is-echo"), KEY_ECHO_MS);
  }

  keyHtml(key) {
    // A key whose shape no font draws the same way wears a drawn face: the
    // skeletons, and the letters that carry an asterisk where their dots
    // would be. Everything else is the letter itself, in the Ottoman face.
    const marks = window.LQ_KEYBOARD_MARKS || {};
    const face = key.mark && marks[key.mark] ? marks[key.mark] : this.escape(key.face || key.char);
    // A skeleton stands for several letters, and which ones is the whole
    // point of the key, so they are shown as themselves rather than listed in
    // a line of running text.
    const title = key.matches
      ? `<span class="key-matches-label">${this.escape(this.translate("keyMatches", "Matches"))}</span>` +
        `<span class="key-matches">${key.matches.map((letter) =>
          `<span class="key-match">${this.escape(letter)}</span>`).join("")}</span>`
      : (key.labelKey ? this.escape(this.translate(key.labelKey, key.label || key.face || key.char)) : "");

    const families = (window.LQ_KEYBOARD_LAYOUT || {}).families || {};
    const family = families[key.char] || "";
    // A drawn face is a picture, and some of them are drawn without a letter
    // in them, so the key says in words what it stands for.
    const spoken = key.mark
      ? (key.matches
          ? `${this.translate("keyMatches", "Matches")}: ${key.matches.join(" ")}`
          : (key.face || key.char))
      : "";

    return `<button type="button" class="btn key"
      data-kind="${key.type}"${key.dots ? ` data-dots="${key.dots}"` : ""}${family ? ` data-family="${family}"` : ""}
      data-char="${this.escape(key.char)}"${key.mark ? ` data-mark="${this.escape(key.mark)}"` : ""}
      ${key.matches ? `data-matches="${this.escape(key.matches.join(" "))}"` : ""}
      ${spoken ? `aria-label="${this.escape(spoken)}"` : ""}
      data-action="pointerdown->ottoman-keyboard#press"
      ${title ? `data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${this.escape(title)}"` : ""}
      >${face}</button>`;
  }

  // The key that leads to the other keyboard. It is the only key on the board
  // that is not a letter, so it is drawn as a keyboard rather than a letter,
  // stands apart in the blue of the interface, and says where it leads twice:
  // in the arrow beside its name and in the tooltip above it.
  switchHtml(target) {
    const advanced = target === "advanced";
    const label = advanced
      ? this.translate("keyboardAdvanced", "Advanced")
      : this.translate("keyboardBasic", "Basic");
    const title =
      `<span class="switch-tip-lead">${this.escape(this.translate("keyboardGoTo", "Go to"))}</span>` +
      `<span class="switch-tip-name">${this.escape(advanced
        ? this.translate("keyboardAdvancedLayout", "Advanced Layout")
        : this.translate("keyboardBasicLayout", "Basic Layout"))}</span>`;
    const arrow = advanced ? ARROW_LEFT : ARROW_RIGHT;
    return `<button type="button" class="btn panel-switch" data-panel="${target}"
      data-action="pointerdown->ottoman-keyboard#switchPanel"
      data-bs-toggle="tooltip" data-bs-html="true" data-bs-custom-class="keyboard-tip"
      data-bs-title="${this.escape(title)}">
      <span class="panel-switch-face" aria-hidden="true">${KEYBOARD_GLYPH}</span>
      <span class="panel-switch-label">${advanced ? arrow : ""}${this.escape(label)}${advanced ? "" : arrow}</span>
    </button>`;
  }

  switchPanel(event) {
    event.preventDefault();
    this.showPanel(event.currentTarget.dataset.panel);
  }

  showPanel(name) {
    this.basicPanelTarget.classList.toggle("is-active", name === "basic");
    this.advancedPanelTarget.classList.toggle("is-active", name === "advanced");
  }

  // ==================== keys ====================

  press(event) {
    // Stops the press from moving focus out of the field being typed into
    event.preventDefault();
    const key = event.currentTarget;
    this.light(key);
    this.announce({
      kind: key.dataset.kind,
      char: key.dataset.char,
      mark: key.dataset.mark || null,
      dots: key.dataset.dots || null,
      matches: key.dataset.matches ? key.dataset.matches.split(" ") : null
    });
  }

  pressWildcard(event) {
    event.preventDefault();
    this.announce({ kind: "wildcard", wildcard: event.currentTarget.dataset.wildcard });
  }

  backspace(event) {
    event.preventDefault();
    this.announce({ kind: "backspace" });
  }

  clearAll(event) {
    event.preventDefault();
    this.announce({ kind: "clear" });
  }

  // The press is addressed to whoever asked for the keyboard, so a second
  // field listening later does not also act on it.
  announce(detail) {
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:key", {
      detail: { ...detail, owner: this.owner }
    }));
  }

  // ==================== showing and placing ====================

  openNear(anchor) {
    this.anchor = anchor || null;
    this.openValue = true;
    this.element.classList.add("is-open");
    this.place();
    this.refreshPin();
    // A panel the reader has parked is already inside the window and is not
    // worth moving the page for. Every other opening is under the boxes, and
    // the page comes to it -- place() has already given up a parked place
    // that no longer holds, so this reads the settled answer.
    if (this.placedSpot()) return;
    // Only on opening: doing it from place() would make the page scroll
    // itself every time the scroll listener fired. It is tried again a few
    // times because the panel's own height is not final until its marks have
    // been drawn, and a measurement taken before that is short.
    [0, 80, 320, 700].forEach((delay) => setTimeout(() => this.scrollIntoReach(), delay));
  }

  close(event) {
    if (event) event.preventDefault();
    if (!this.openValue) return;
    this.openValue = false;
    this.element.classList.remove("is-open");
    this.hideFlag();
    this.anchor = null;
    this.below = null;
    this.guard = null;
    this.owner = null;
    window.LQ.releaseRoom();
    // Whoever was typing needs to know: the Clear that was hidden behind the
    // panel comes back, and the row's hint is allowed again.
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:closed"));
  }

  // Sits under whatever asked for it, kept inside the viewport -- unless the
  // reader has dragged it somewhere, in which case that is where it belongs
  // and the page does not get a say. Below 768px the stylesheet pins it to
  // the bottom of the screen instead, so the inline position is cleared to
  // let that win.
  place() {
    if (this.drag) return;
    if (window.matchMedia(KEYBOARD_DOCK_QUERY).matches) {
      this.element.style.left = "";
      this.element.style.top = "";
      return;
    }
    const home = this.homeSpot();
    if (home) this.home = home;
    const own = this.usableSpot();
    if (own) { this.moveTo(own); return; }
    if (home) this.moveTo(home);
  }

  // Where the page would put it: lined up with whatever asked for it, but
  // clear of the row that holds it -- the boxes carry their own controls
  // underneath, and a panel over them would be as good as taking them away.
  homeSpot() {
    if (!this.anchor || !this.anchor.isConnected) return null;
    const bounds = this.anchor.getBoundingClientRect();
    const clears = (this.below && this.below.isConnected ? this.below : this.anchor).getBoundingClientRect();
    const width = this.element.offsetWidth || 460;
    const left = Math.min(
      Math.max(8, bounds.left + bounds.width / 2 - width / 2),
      window.innerWidth - width - 8
    );
    // Not clamped to the bottom of the window: the panel belongs under what
    // asked for it, and scrollIntoReach() brings the page to it instead of
    // letting it slide up over the row.
    const top = Math.max(8, clears.bottom + 4);
    return { left: Math.round(left), top: Math.round(top) };
  }

  // Docked at the foot of a narrow screen there is nowhere to move the panel
  // to, so a place found on a wide screen is neither used nor overwritten.
  placedSpot() {
    if (window.matchMedia(KEYBOARD_DOCK_QUERY).matches) return null;
    return window.LQ_PLACEMENT.spot(KEYBOARD_PLACE);
  }

  moveTo(spot) {
    this.element.style.left = `${spot.left}px`;
    this.element.style.top = `${spot.top}px`;
  }

  // ==================== moving it out of the way ====================

  // The bar is the handle wherever it is not a control: the stretch between
  // Clear and the wildcards, and the one between them and the delete key.
  startDrag(event) {
    if (window.matchMedia(KEYBOARD_DOCK_QUERY).matches) return;
    if (event.target.closest("button")) return;
    event.preventDefault();
    this.barTarget.setPointerCapture(event.pointerId);
    const bounds = this.element.getBoundingClientRect();
    this.drag = { x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
    // A spring still easing back would make the panel lag behind the pointer.
    this.element.classList.remove("is-springing");
    this.element.classList.add("is-dragging");
    this.hideFlag();
  }

  moveDrag(event) {
    if (!this.drag) return;
    this.moveTo(this.dragSpot(event));
  }

  // Where the pointer has taken the panel, never past an edge of the window:
  // a panel dragged off the top cannot be dragged back, and the place is
  // remembered now, so it would be off the top next time as well.
  dragSpot(event) {
    return window.LQ_PLACEMENT.clamp(
      { left: this.drag.left + event.clientX - this.drag.x,
        top: this.drag.top + event.clientY - this.drag.y },
      this.element.offsetWidth, this.element.offsetHeight);
  }

  // Let go near where it started and it goes back: the reader was putting it
  // back rather than placing it somewhere new. Anywhere else, the panel has
  // been placed, and nothing the page does moves it again.
  endDrag(event) {
    if (!this.drag) return;
    const spot = this.dragSpot(event);
    this.drag = null;
    this.element.classList.remove("is-dragging");
    if (!this.clearsGuard(spot) ||
        this.home && Math.hypot(spot.left - this.home.left, spot.top - this.home.top) < KEYBOARD_SNAP_PX) {
      this.goHome();
      return;
    }
    // Whether the control is about to arrive rather than already standing
    // there, which is the only moment worth drawing an eye to.
    const arriving = this.hasPinTarget && this.pinTarget.hidden;
    window.LQ_PLACEMENT.fix(KEYBOARD_PLACE, spot);
    this.refreshPin();
    if (arriving) this.flashPin();
    this.showFlag(window.LQ.translate("keyboardPinnedState", "Pinned"));
  }

  // Back to the place the page picked, with the decision dropped: the panel
  // follows the boxes again from here.
  goHome() {
    const wasParked = !!this.placedSpot();
    window.LQ_PLACEMENT.release(KEYBOARD_PLACE);
    if (wasParked) this.retirePin(); else this.refreshPin();
    // Said every time, not only after a pin: a panel that springs back from a
    // place it was refused has to say why it moved.
    this.showFlag(window.LQ.translate("keyboardHomeState", "Default position"));
    if (!this.home) return;
    this.element.classList.add("is-springing");
    this.moveTo(this.home);
    setTimeout(() => this.element.classList.remove("is-springing"), 400);
  }

  // ==================== where the panel may not be ====================

  // A place is the reader's to choose, with one exception: the row this
  // panel serves. A keyboard over the boxes it types into, or over the
  // button that searches them, is a keyboard in the way of its own work.
  // So a place that covers any of it is refused -- on the drop, and again
  // on every opening, because a window can be resized or the page reflowed
  // under a place that was fine when it was made.
  clearsGuard(spot) {
    if (!this.guard || !this.guard.isConnected) return true;
    const row = this.guard.getBoundingClientRect();
    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    return spot.left >= row.right || spot.left + width <= row.left ||
           spot.top >= row.bottom || spot.top + height <= row.top;
  }

  // The reader's place, if it is still one the panel can be opened at: it
  // has to fit the window as it stands, not only the window it was made in,
  // and it has to clear the row above. Anything else and the place is given
  // up and the panel goes back to opening where the page puts it.
  usableSpot() {
    const spot = this.placedSpot();
    if (!spot) return null;
    const inside = window.LQ_PLACEMENT.clamp(spot, this.element.offsetWidth, this.element.offsetHeight);
    if (inside.left === spot.left && inside.top === spot.top && this.clearsGuard(spot)) return spot;
    window.LQ_PLACEMENT.release(KEYBOARD_PLACE);
    this.refreshPin();
    return null;
  }

  // ==================== the pin ====================

  // The pin shows only once the panel has been parked, so a keyboard nobody
  // has touched looks exactly as it did. It is claret the whole time it is
  // there: while it shows, this panel is fixed where the reader left it, this
  // visit and the next, and pressing it is how that ends.
  refreshPin() {
    if (!this.hasPinTarget || this.pinTarget.classList.contains("is-leaving")) return;
    this.pinTarget.hidden = !this.placedSpot();
    if (this.pinTarget.hidden) { this.hideFlag(); return; }
    window.LQ.retitle(this.pinTarget, window.LQ.pinTip());
    this.pinTarget.setAttribute("aria-label", window.LQ.pinTipText());
  }

  // A control that appears quietly in a corner is a control nobody sees.
  flashPin() {
    if (!this.hasPinTarget || this.pinTarget.hidden) return;
    this.pinTarget.classList.remove("is-arriving");
    // Restarting the class within the same frame would not replay it.
    void this.pinTarget.offsetWidth;
    this.pinTarget.classList.add("is-arriving");
    clearTimeout(this.pinArrival);
    this.pinArrival = setTimeout(() => this.pinTarget.classList.remove("is-arriving"), KEYBOARD_PIN_ARRIVAL_MS);
  }

  // The word for what just happened, over the pin it happened to. Above the
  // panel where there is room, under the pin where there is not.
  showFlag(word) {
    if (!this.hasFlagTarget) return;
    this.flagTarget.textContent = word;
    this.flagTarget.classList.toggle("is-below", this.element.getBoundingClientRect().top < KEYBOARD_FLAG_ROOM_PX);
    this.flagTarget.hidden = false;
    clearTimeout(this.flagTimer);
    this.flagTimer = setTimeout(() => this.hideFlag(), KEYBOARD_FLAG_MS);
  }

  hideFlag() {
    if (this.hasFlagTarget) this.flagTarget.hidden = true;
  }

  // The panel is back where the page puts it, so the pin has nothing left to
  // say. It goes quietly rather than blinking out from under the pointer.
  retirePin() {
    if (!this.hasPinTarget || this.pinTarget.hidden) return;
    const built = window.bootstrap ? bootstrap.Tooltip.getInstance(this.pinTarget) : null;
    if (built) built.hide();
    this.pinTarget.classList.remove("is-arriving");
    this.pinTarget.classList.add("is-leaving");
    clearTimeout(this.pinLeaving);
    this.pinLeaving = setTimeout(() => {
      this.pinTarget.classList.remove("is-leaving");
      this.refreshPin();
    }, KEYBOARD_PIN_LEAVING_MS);
  }

  // Pressing the pin is the whole of it: the panel goes back where the page
  // would put it, and the place is given up for good.
  togglePin(event) {
    event.preventDefault();
    this.goHome();
  }
  // The keyboard must be reachable wherever it lands. Docked at the foot of a
  // narrow screen it can cover the field, so the page moves the field clear
  // of it; on a wide screen it opens under the box and can fall past the
  // bottom edge, so the page moves it into view instead.
  scrollIntoReach() {
    if (!this.anchor || !this.anchor.isConnected) return;
    if (window.matchMedia(KEYBOARD_DOCK_QUERY).matches) {
      const gap = 16;
      const bounds = this.anchor.getBoundingClientRect();
      const keyboardTop = window.innerHeight - (this.element.offsetHeight || 0);
      const overlap = bounds.bottom + gap - keyboardTop;
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: "smooth" });
      return;
    }
    window.LQ.makeRoomFor(this.element);
  }

  // ==================== helpers ====================

  translate(key, fallback) { return window.LQ.translate(key, fallback); }

  escape(value) { return window.LQ.escape(value); }
}

application.register("ottoman-keyboard", OttomanKeyboardController);
