// js/controllers/search_keyboard_controller.js
// The Ottoman keyboard that belongs to the search bar.
//
// The Word Decoder's keyboard groups letters by shape, because someone
// working from a manuscript recognises a shape before they decide which
// letter it is. This one is the opposite: it is laid out like the keyboard in
// front of the reader, so that pressing K there and pressing K here do the
// same thing. The line in its header says exactly that, and shows it: K → ك,
// on a loop, until the reader has typed anything at all. Then it retires for
// the rest of the session, because it has been understood.
//
// Like the other keyboard it knows nothing about what it types into. Every
// key announces itself as a "search-keyboard:key" event and the search bar
// decides what to do with it.
//
// The header is also the handle: the panel can be dragged out of the way and
// springs back if it is let go near where it started. Anywhere else it is let
// go is where it stays -- for the session, and across visits if the reader
// asks for that. js/keyboard_placement.js holds the decision.
//
// The keys stand in the alphabet's own order, elif, be, pe, te..., because
// that is the order a reader of Ottoman looks for a letter in. Each key still
// says which key on the reader's own board writes it, and physical typing
// follows the layout's map.

// How long a key stays down after the reader's own key wrote its letter.
const SEARCH_ECHO_MS = 170;

// Let go this near the place the page picked and the panel is going back
// there, not being placed somewhere new.
const SEARCH_SNAP_PX = 40;

// How near home the panel has to be carried before its old place is drawn
// behind it. Wider than the magnet by a good margin: the outline is what
// tells the reader a magnet is there at all, so it has to arrive before
// they have already passed it.
const SEARCH_HOME_REACH = 190;

// The name this panel's place is held under, and the width below which the
// stylesheet docks it to the foot of the screen instead.
const SEARCH_KEYBOARD_PLACE = "search";
const SEARCH_KEYBOARD_DOCK_QUERY = "(max-width: 767.98px)";

// The room the word that says the panel is fixed needs above it, and how
// long it stays before it has been read.
const SEARCH_FLAG_ROOM_PX = 44;

// How long the pin takes to fade out when the panel goes back to the
// place the page picks: the stylesheet's own animation, run to the end.
const SEARCH_PIN_LEAVING_MS = 620;
// How long the pin wears the class that blinks it once on a drop: the
// stylesheet's own animation, run to the end.
const SEARCH_PIN_FLASH_MS = 620;
const SEARCH_FLAG_MS = 1900;

class SearchKeyboardController extends Stimulus.Controller {
  static targets = ["rows", "hint", "pin", "flag"]
  static values = {
    open: { type: Boolean, default: false }
  }

  connect() {
    this.render();
    this.onRequest = (event) => this.open(event.detail || {});
    this.onDismiss = () => this.close();
    document.addEventListener("search-keyboard:request", this.onRequest);
    document.addEventListener("search-keyboard:dismiss", this.onDismiss);

    // Whichever way the reader typed, the line has done its work.
    this.onTyped = () => this.retireHint();
    document.addEventListener("search-keyboard:typed", this.onTyped);

    // A letter written on the reader's own keyboard shows its key going down
    // here too, so the two boards read as one.
    this.onEcho = (event) => this.echo((event.detail || {}).char);
    document.addEventListener("search-keyboard:echo", this.onEcho);

    // The keys carry the layout of the reader's own keyboard, which is the
    // one the interface language implies.
    // The pin's label says which of its two states it is in, so it is written
    // again rather than left with the one the markup carries.
    this.onLanguageChange = () => { this.render(); this.refreshPin(); };
    document.addEventListener("language:changed", this.onLanguageChange);

    // The panel is fixed to the window, so scrolling the page does not carry
    // it along: it has to be put under the bar again, or the page scrolls out
    // from under it and a panel below the fold stays below the fold.
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
    // still under the bar where it belongs, so the page is brought to it
    // again. Not on scroll: that is the reader moving the page themselves,
    // and scrolling them back would be an argument they cannot win.
    this.onResize = () => {
      if (!this.openValue) return;
      this.place();
      if (!this.placedSpot()) window.LQ.makeRoomFor(this.element, this.below || this.anchor, this.lift());
    };
    window.addEventListener("resize", this.onResize);

    // Pressing anywhere but the bar and the keyboard closes it.
    this.onAway = (event) => {
      if (!this.openValue) return;
      if (this.element.contains(event.target)) return;
      if (event.target.closest("[data-home-target='inputWrapper']")) return;
      this.close();
    };
    document.addEventListener("pointerdown", this.onAway);
  }

  disconnect() {
    document.removeEventListener("search-keyboard:request", this.onRequest);
    document.removeEventListener("search-keyboard:dismiss", this.onDismiss);
    document.removeEventListener("search-keyboard:typed", this.onTyped);
    document.removeEventListener("search-keyboard:echo", this.onEcho);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("pointerdown", this.onAway);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onReposition, true);
  }

  layout() {
    const layouts = window.LQ_SEARCH_KEYBOARD || {};
    return layouts[document.documentElement.lang === "tr" ? "tr" : "en"] || layouts.en || {};
  }

  // ==================== the keys ====================

  render() {
    if (!this.hasRowsTarget) return;
    const layout = this.layout();
    const rows = this.alphabet().map((row) => row.map((letter) => this.letterKeyHtml(letter, layout)));
    this.rowsTarget.innerHTML = rows.map((cells) => `
      <div class="search-key-row">
        ${cells.join("")}
      </div>`).join("");
    window.LQ.refreshDynamicContent(this.element);
  }

  alphabet() {
    const layouts = window.LQ_SEARCH_KEYBOARD || {};
    return (layouts.alphabetical || {}).rows || [];
  }

  // A key: the letter, with the key on the reader's own board that writes it
  letterKeyHtml(letter, layout) {
    const safe = window.LQ.escape;
    const family = (window.LQ_SEARCH_KEYBOARD || {}).families || {};
    const shape = family[this.face(letter)] || family[letter] || "";
    return `
      <button type="button" class="btn search-key" data-search-char="${safe(letter)}"
              ${shape ? `data-family="${safe(shape)}"` : ""}
              data-action="pointerdown->search-keyboard#press">
        <span class="search-key-latin">${safe(this.physicalLabel(letter, layout))}</span>
        <span class="search-key-ottoman">${safe(this.face(letter))}</span>
      </button>`;
  }

  // The label of the physical key that writes a letter. A plain key comes first (و is w, u, o and v; the first of them),
  // then a split key's Shift or Alt label, then a letter reached only through
  // an upper-case key. A letter the layout cannot write is left unlabelled.
  physicalLabel(letter, layout) {
    const map = layout.map || {};
    const dual = layout.dual || {};
    const language = document.documentElement.lang || "en";
    const plain = Object.keys(map).find((key) => map[key] === letter && key === key.toLowerCase());
    if (plain) return plain.toLocaleUpperCase(language);
    for (const key of Object.keys(dual)) {
      const [, shift, shiftLabel, alt, altLabel] = dual[key];
      if (shift === letter) return shiftLabel;
      if (alt === letter) return altLabel;
    }
    const upper = Object.keys(map).find((key) => map[key] === letter);
    return upper ? `SHF+${upper.toLocaleUpperCase(language)}` : "";
  }

  // A ye wears no dots until a letter follows it, and the key writes the bare
  // one, so the bare one is what the key shows.
  face(letter) { return letter === "_ye_" ? "\u0649" : letter; }

  press(event) {
    // Stops the press from taking focus away from the bar.
    event.preventDefault();
    this.light(event.currentTarget);
    document.dispatchEvent(new CustomEvent("search-keyboard:key", {
      detail: { char: event.currentTarget.dataset.searchChar }
    }));
    this.retireHint();
  }

  backspace(event) {
    event.preventDefault();
    document.dispatchEvent(new CustomEvent("search-keyboard:key", { detail: { kind: "backspace" } }));
  }

  // ==================== the echo of the reader's own keyboard ====================

  // The key that writes this letter is shown pressed for as long as a press
  // of one's own lasts.
  echo(letter) {
    if (!letter || !this.hasRowsTarget) return;
    this.light(this.rowsTarget.querySelector(`[data-search-char="${CSS.escape(letter)}"]`));
  }

  // A key lights claret for a moment when it writes, however it was pressed.
  light(key) {
    if (!key) return;
    key.classList.remove("is-echo");
    // Restarting the class within the same frame would not replay it.
    void key.offsetWidth;
    key.classList.add("is-echo");
    clearTimeout(key.echoTimer);
    key.echoTimer = setTimeout(() => key.classList.remove("is-echo"), SEARCH_ECHO_MS);
  }

  // ==================== the line that teaches the keyboard ====================

  // It says it once, shows it on a loop, and stops the moment the reader has
  // typed anything, by any means. It does not come back this session.
  retireHint() {
    if (this.retired) return;
    this.retired = true;
    this.element.classList.add("is-learned");
  }

  // ==================== showing and placing ====================

  open(request) {
    this.anchor = request.anchor || null;
    this.below = request.below || null;
    this.openValue = true;
    this.element.hidden = false;
    this.element.classList.add("is-open");
    this.place();
    this.refreshPin();
    // A panel the reader has parked is already inside the window and is not
    // worth moving the page for. Every other opening is under the bar, and
    // the page comes to it -- place() has already given up a parked place
    // that no longer holds, so this reads the settled answer.
    // Tried again a few times: the panel's own height is not final until its
    // keys have been drawn, and a measurement taken before that is short.
    window.LQ.forgetScrollAim();
    if (!this.placedSpot()) [0, 80, 320].forEach((delay) => setTimeout(() => {
      // Not asked for, unlike the decoder's. This board opens under the search
      // bar, which is already near the top of the page, so it is in view
      // without the page moving at all on anything but a short window -- and
      // a page that jumps for no visible gain is worse than a page that
      // stays. It moves only when the board is short of its tail.
      if (this.openValue && !this.placedSpot()) {
        window.LQ.makeRoomFor(this.element, this.below || this.anchor, this.lift());
      }
    }, delay));
  }

  close(event) {
    if (event) event.preventDefault();
    if (!this.openValue) return;
    this.openValue = false;
    this.element.classList.remove("is-open");
    this.element.hidden = true;
    this.hideFlag();
    this.anchor = null;
    this.below = null;
    // The room the page was given stays: see roomDownTo in js/app.js.
    document.dispatchEvent(new CustomEvent("search-keyboard:closed"));
  }

  // It opens under the caret rather than under the middle of the bar: on the
  // Ottoman side the caret sits at the right-hand edge of the field.
  //
  // Under the bar, and not pulled up to fit a short window: a panel lifted
  // over the bar it types into is worse than one below the fold, and the
  // page can be scrolled to a panel below the fold. makeRoomFor does that.
  homeSpot() {
    if (!this.anchor || !this.anchor.isConnected) return null;
    const bounds = this.anchor.getBoundingClientRect();
    // Below the whole row, not just the field: on a narrow window the source
    // switch and the dictionary picker wrap onto a line of their own, and a
    // panel measured from the field alone would come down on top of them.
    const clears = (this.below && this.below.isConnected ? this.below : this.anchor).getBoundingClientRect();
    const width = this.element.offsetWidth || 700;
    const caret = bounds.right - 20;
    const left = Math.max(8, Math.min(caret - width / 2, window.innerWidth - width - 8));
    return { left: Math.round(left), top: Math.round(Math.max(8, clears.bottom + 10)) };
  }

  // The page's own place is worked out every time, because the spring-back and
  // the pin both need to know where it is -- but it is only used while the
  // reader has not placed the panel themselves.
  place() {
    if (this.drag) return;
    const home = this.homeSpot();
    if (home) this.home = home;
    const own = this.usableSpot();
    if (own) { this.moveTo(own); return; }
    if (home) this.moveTo(home);
  }

  // Below the width at which the stylesheet pins the panel to the foot of the
  // screen there is nowhere to move it to, so a place found on a wide screen
  // is neither used nor overwritten there.
  placedSpot() {
    if (window.matchMedia(SEARCH_KEYBOARD_DOCK_QUERY).matches) return null;
    return window.LQ_PLACEMENT.spot(SEARCH_KEYBOARD_PLACE);
  }

  // Whole pixels. A panel left on a half pixel puts everything inside it half
  // a pixel out as well, and a mark twelve pixels across wears that: it comes
  // out a shade heavier on one side than the other, which reads as crooked
  // long before anyone can say why.
  moveTo(spot) {
    this.element.style.left = `${Math.round(spot.left)}px`;
    this.element.style.top = `${Math.round(spot.top)}px`;
  }

  // ==================== moving it out of the way ====================

  startDrag(event) {
    // Below the width at which the stylesheet pins the panel to the foot of
    // the screen there is nowhere to drag it to.
    if (window.matchMedia(SEARCH_KEYBOARD_DOCK_QUERY).matches) return;
    // Every control in the bar, not only the two in the right-hand corner:
    // the pin stands in the left one, and a press on it was starting a drag
    // and then parking the panel again where it had just been unparked.
    if (event.target.closest("button")) return;
    event.preventDefault();
    this.hintTarget.setPointerCapture(event.pointerId);
    const bounds = this.element.getBoundingClientRect();
    this.drag = { x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
    // A spring still easing back would make the panel lag behind the pointer.
    this.element.classList.remove("is-springing");
    this.element.classList.add("is-dragging");
    this.hideFlag();
    window.LQ.hideHome();
  }

  moveDrag(event) {
    if (!this.drag) return;
    const spot = this.dragSpot(event);
    this.moveTo(spot);
    this.markHome(spot);
  }

  // The old place, drawn behind the panel whenever the panel is near it --
  // on the way back from far away, and equally on a short move that never
  // left the neighbourhood, where the reader most needs to know the magnet
  // is about to take the panel out of their hands.
  markHome(spot) {
    if (!this.home) return;
    const away = Math.hypot(spot.left - this.home.left, spot.top - this.home.top);
    if (away > SEARCH_HOME_REACH) { window.LQ.hideHome(); return; }
    const armed = away < SEARCH_SNAP_PX;
    // Faint at the edge of its reach and full by the time the magnet takes
    // over, so the outline grows as the panel is brought in rather than
    // appearing all at once.
    const near = armed ? 1 : Math.round((1 - (away - SEARCH_SNAP_PX) /
      (SEARCH_HOME_REACH - SEARCH_SNAP_PX)) * 70 + 30) / 100;
    window.LQ.showHome(this.home, this.element.offsetWidth, this.element.offsetHeight, near, armed);
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
    window.LQ.hideHome();
    if (this.home && Math.hypot(spot.left - this.home.left, spot.top - this.home.top) < SEARCH_SNAP_PX) {
      this.goHome();
      return;
    }
    // Whether the control is about to arrive rather than already standing
    // there: the one moment worth spending a word on.
    const arriving = this.hasPinTarget && this.pinTarget.hidden;
    window.LQ_PLACEMENT.fix(SEARCH_KEYBOARD_PLACE, spot);
    this.refreshPin();
    this.flashPin();
    // Once a page, counting both keyboards as one. A word that says what the
    // control does has one moment worth saying it in; after that the reader
    // knows, and the other keyboard's pin is the same pin doing the same job,
    // so saying it again there would be nagging rather than telling. A reader
    // who reloads is starting again, as far as anything here can tell, and
    // starting again is when being told things is useful.
    if (arriving && !window.LQ_PLACEMENT.toldAlready()) {
      window.LQ_PLACEMENT.markTold();
      this.showFlag();
    }
  }

  // Back to the place the page picked, with the decision dropped: the panel
  // follows the bar again from here.
  goHome() {
    const wasParked = !!this.placedSpot();
    window.LQ.hideHome();
    window.LQ_PLACEMENT.release(SEARCH_KEYBOARD_PLACE);
    this.hideFlag();
    if (wasParked) this.retirePin(); else this.refreshPin();
    if (!this.home) return;
    this.element.classList.add("is-springing");
    this.moveTo(this.home);
    setTimeout(() => this.element.classList.remove("is-springing"), 400);
  }

  // The reader's place, if it is still one the panel can be opened at. Where
  // they put it is their business -- over the boxes, over the search bar, over
  // anything: they moved it there and they can move it back. The one thing
  // the page still decides is that it has to be reachable, so a place made in
  // a larger window is pulled back inside this one rather than left half off
  // the edge.
  usableSpot() {
    const spot = this.placedSpot();
    if (!spot) return null;
    return window.LQ_PLACEMENT.clamp(spot, this.element.offsetWidth, this.element.offsetHeight);
  }

  // The strip the page is brought to: the tabs above the card, which keep the
  // other side of the page within reach while the reader works on this one.
  // Missing, the row itself is all the page is brought to.
  lift() { return document.querySelector(".search-tabs"); }

  // The pin is the one control on either panel whose mark says where the
  // panel stands rather than what pressing it would do, and a reader has to
  // reach it before the words under it can explain. So reaching it is enough:
  // the old place lights up behind the panel, drawn the way it is drawn while
  // the panel is carried back by hand, already armed because a press lands it
  // exactly there. Nothing is said, and the one moment of curiosity a small
  // mark in a corner earns is paid back at once.
  peekHome() {
    if (!this.home || !this.placedSpot()) return;
    window.LQ.showHome(this.home, this.element.offsetWidth, this.element.offsetHeight, 1, true);
  }

  unpeekHome() { window.LQ.hideHome(); }

  // ==================== the pin ====================

  // The pin shows only once the panel has been parked, so a keyboard nobody
  // has touched looks exactly as it did. It is claret the whole time it is
  // there: while it shows, this panel is fixed where the reader left it, this
  // visit and the next, and pressing it is how that ends.
  refreshPin() {
    if (!this.hasPinTarget || this.pinTarget.classList.contains("is-leaving")) return;
    this.pinTarget.hidden = !this.placedSpot();
    if (this.pinTarget.hidden) { this.hideFlag(); return; }
    this.pinTarget.setAttribute("aria-label", window.LQ.pinName());
  }

  // One blink, on every drop. The panel has a new place, and this is the
  // control that takes it back; the words beside it are said once a page and
  // then never again, so after that first time this is all there is to say
  // that the place was taken. It wears, for a moment, the fill it otherwise
  // only wears under the pointer.
  flashPin() {
    if (!this.hasPinTarget || this.pinTarget.hidden) return;
    this.pinTarget.classList.remove("is-flash");
    // Restarting the class within the same frame would not replay it.
    void this.pinTarget.offsetWidth;
    this.pinTarget.classList.add("is-flash");
    clearTimeout(this.pinFlash);
    this.pinFlash = setTimeout(() => this.pinTarget.classList.remove("is-flash"), SEARCH_PIN_FLASH_MS);
  }

  // The word for what just happened, over the pin it happened to. Above the
  // panel where there is room, under the pin where there is not. Said on the
  // parking and nowhere else: going back to the place the page picks is what
  // the reader asked the pin for, and they can see it happen.
  showFlag() {
    if (!this.hasFlagTarget) return;
    this.flagTarget.classList.toggle("is-below", this.element.getBoundingClientRect().top < SEARCH_FLAG_ROOM_PX);
    this.flagTarget.style.marginLeft = "";
    this.flagTarget.hidden = false;
    // Centred on a button that stands in the panel's corner, so left to
    // itself it hangs off that corner -- and off the window as well, on a
    // panel parked hard against the edge. It stops at whichever it meets
    // first: the line the panel is drawn to, or the window's own.
    const edge = Math.max(6, this.element.getBoundingClientRect().left);
    const past = edge - this.flagTarget.getBoundingClientRect().left;
    if (past > 0) this.flagTarget.style.marginLeft = `${Math.round(past)}px`;
    clearTimeout(this.flagTimer);
    this.flagTimer = setTimeout(() => this.hideFlag(), SEARCH_FLAG_MS);
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
    this.pinTarget.classList.remove("is-flash");
    this.pinTarget.classList.add("is-leaving");
    clearTimeout(this.pinLeaving);
    this.pinLeaving = setTimeout(() => {
      this.pinTarget.classList.remove("is-leaving");
      this.refreshPin();
    }, SEARCH_PIN_LEAVING_MS);
  }

  // Pressing the pin is the whole of it: the panel goes back where the page
  // would put it, and the place is given up for good.
  togglePin(event) {
    event.preventDefault();
    this.goHome();
  }
}

application.register("search-keyboard", SearchKeyboardController);
