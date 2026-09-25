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

// The name this panel's place is held under, and the width below which the
// stylesheet docks it to the foot of the screen instead.
const SEARCH_KEYBOARD_PLACE = "search";
const SEARCH_KEYBOARD_DOCK_QUERY = "(max-width: 767.98px)";

// The room the word that says the panel is fixed needs above it, and how
// long it stays before it has been read.
const SEARCH_FLAG_ROOM_PX = 44;
const SEARCH_FLAG_MS = 1900;

// How long the pin wears the class that pops it in and sends its two rings
// out: the stylesheet's own animations, run to the end.
const SEARCH_PIN_ARRIVAL_MS = 2500;

class SearchKeyboardController extends Stimulus.Controller {
  static targets = ["rows", "hint", "pin", "flag", "remember"]
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

    this.onReposition = () => { if (this.openValue) this.place(); };
    window.addEventListener("resize", this.onReposition);

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
    window.removeEventListener("resize", this.onReposition);
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
    this.openValue = true;
    this.element.hidden = false;
    this.element.classList.add("is-open");
    this.place();
    this.refreshPin();
    window.LQ.makeRoomFor(this.element);
  }

  close(event) {
    if (event) event.preventDefault();
    if (!this.openValue) return;
    this.openValue = false;
    this.element.classList.remove("is-open");
    this.element.hidden = true;
    this.hideFlag();
    this.anchor = null;
    window.LQ.releaseRoom();
    document.dispatchEvent(new CustomEvent("search-keyboard:closed"));
  }

  // It opens under the caret rather than under the middle of the bar: on the
  // Ottoman side the caret sits at the right-hand edge of the field.
  homeSpot() {
    if (!this.anchor || !this.anchor.isConnected) return null;
    const bounds = this.anchor.getBoundingClientRect();
    const width = this.element.offsetWidth || 700;
    const height = this.element.offsetHeight || 260;
    const caret = bounds.right - 20;
    const left = Math.max(8, Math.min(caret - width / 2, window.innerWidth - width - 8));
    const top = Math.min(bounds.bottom + 10, Math.max(8, window.innerHeight - height - 8));
    return { left: Math.round(left), top: Math.round(top) };
  }

  // The page's own place is worked out every time, because the spring-back and
  // the pin both need to know where it is -- but it is only used while the
  // reader has not placed the panel themselves.
  place() {
    if (this.drag) return;
    const home = this.homeSpot();
    if (home) this.home = home;
    const own = this.placedSpot();
    if (own) { this.moveTo(window.LQ_PLACEMENT.clamp(own, this.element.offsetWidth, this.element.offsetHeight)); return; }
    if (home) this.moveTo(home);
  }

  // Below the width at which the stylesheet pins the panel to the foot of the
  // screen there is nowhere to move it to, so a place found on a wide screen
  // is neither used nor overwritten there.
  placedSpot() {
    if (window.matchMedia(SEARCH_KEYBOARD_DOCK_QUERY).matches) return null;
    return window.LQ_PLACEMENT.spot(SEARCH_KEYBOARD_PLACE);
  }

  moveTo(spot) {
    this.element.style.left = `${spot.left}px`;
    this.element.style.top = `${spot.top}px`;
  }

  // ==================== moving it out of the way ====================

  startDrag(event) {
    if (event.target.closest(".search-keyboard-button")) return;
    event.preventDefault();
    this.hintTarget.setPointerCapture(event.pointerId);
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
    if (this.home && Math.hypot(spot.left - this.home.left, spot.top - this.home.top) < SEARCH_SNAP_PX) {
      this.goHome();
      return;
    }
    // Whether the control is about to arrive rather than already standing
    // there, which is the only moment worth drawing an eye to.
    const arriving = this.hasPinTarget && this.pinTarget.hidden;
    window.LQ_PLACEMENT.hold(SEARCH_KEYBOARD_PLACE, spot);
    this.refreshPin();
    if (arriving) this.flashPin();
    this.showFlag();
  }

  // Back to the place the page picked, with the decision dropped: the panel
  // follows the bar again from here.
  goHome() {
    window.LQ_PLACEMENT.release(SEARCH_KEYBOARD_PLACE);
    this.refreshPin();
    if (!this.home) return;
    this.element.classList.add("is-springing");
    this.moveTo(this.home);
    setTimeout(() => this.element.classList.remove("is-springing"), 400);
  }

  // ==================== the pin ====================

  // The pin only shows once the panel has been parked, so a keyboard nobody
  // has touched looks exactly as it did. It is claret the whole time it is
  // there: while it shows, this panel is fixed where the reader left it.
  refreshPin() {
    if (!this.hasPinTarget) return;
    this.pinTarget.hidden = !this.placedSpot();
    if (this.hasRememberTarget) {
      const kept = window.LQ_PLACEMENT.kept(SEARCH_KEYBOARD_PLACE);
      this.rememberTarget.setAttribute("aria-pressed", kept ? "true" : "false");
      this.rememberTarget.classList.toggle("is-on", kept);
    }
    if (this.pinTarget.hidden) this.hideFlag();
  }

  // A control that appears quietly in a corner is a control nobody sees.
  flashPin() {
    if (!this.hasPinTarget || this.pinTarget.hidden) return;
    this.pinTarget.classList.remove("is-arriving");
    // Restarting the class within the same frame would not replay it.
    void this.pinTarget.offsetWidth;
    this.pinTarget.classList.add("is-arriving");
    clearTimeout(this.pinArrival);
    this.pinArrival = setTimeout(() => this.pinTarget.classList.remove("is-arriving"), SEARCH_PIN_ARRIVAL_MS);
  }

  // The word for what just happened, over the pin that now says it. Above the
  // panel where there is room for it, under the pin where there is not.
  showFlag() {
    if (!this.hasFlagTarget) return;
    const room = this.element.getBoundingClientRect().top;
    this.flagTarget.classList.toggle("is-below", room < SEARCH_FLAG_ROOM_PX);
    this.flagTarget.hidden = false;
    clearTimeout(this.flagTimer);
    this.flagTimer = setTimeout(() => this.hideFlag(), SEARCH_FLAG_MS);
  }

  hideFlag() {
    if (this.hasFlagTarget) this.flagTarget.hidden = true;
  }

  // Pressing the pin is how the panel goes back where the page would put it.
  togglePin(event) {
    event.preventDefault();
    this.goHome();
  }

  // The one choice the pin carries, offered when the pointer reaches it: keep
  // this place for the next visit as well. Pressed again, it is given up --
  // without moving the panel, which the reader did not ask for.
  toggleRemember(event) {
    event.preventDefault();
    const spot = this.placedSpot();
    if (!spot) return;
    if (window.LQ_PLACEMENT.kept(SEARCH_KEYBOARD_PLACE)) window.LQ_PLACEMENT.unkeep(SEARCH_KEYBOARD_PLACE);
    else window.LQ_PLACEMENT.keep(SEARCH_KEYBOARD_PLACE, spot);
    this.refreshPin();
  }
}

application.register("search-keyboard", SearchKeyboardController);
