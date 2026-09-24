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
// springs back if it is let go near where it started.
//
// The keys stand in the alphabet's own order, elif, be, pe, te..., because
// that is the order a reader of Ottoman looks for a letter in. Each key still
// says which key on the reader's own board writes it, and physical typing
// follows the layout's map.

// How long a key stays down after the reader's own key wrote its letter.
const SEARCH_ECHO_MS = 170;

class SearchKeyboardController extends Stimulus.Controller {
  static targets = ["rows", "hint"]
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
    this.onLanguageChange = () => this.render();
    document.addEventListener("language:changed", this.onLanguageChange);

    this.onReposition = () => { if (this.openValue && !this.moved) this.place(); };
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
    this.moved = false;
    this.element.hidden = false;
    this.element.classList.add("is-open");
    this.place();
    window.LQ.makeRoomFor(this.element);
  }

  close(event) {
    if (event) event.preventDefault();
    if (!this.openValue) return;
    this.openValue = false;
    this.element.classList.remove("is-open");
    this.element.hidden = true;
    this.anchor = null;
    window.LQ.releaseRoom();
    document.dispatchEvent(new CustomEvent("search-keyboard:closed"));
  }

  // It opens under the caret rather than under the middle of the bar: on the
  // Ottoman side the caret sits at the right-hand edge of the field.
  place() {
    if (!this.anchor || !this.anchor.isConnected) return;
    const bounds = this.anchor.getBoundingClientRect();
    const width = this.element.offsetWidth || 700;
    const height = this.element.offsetHeight || 260;
    const caret = bounds.right - 20;
    const left = Math.max(8, Math.min(caret - width / 2, window.innerWidth - width - 8));
    const top = Math.min(bounds.bottom + 10, Math.max(8, window.innerHeight - height - 8));
    this.home = { left: Math.round(left), top: Math.round(top) };
    this.element.style.left = `${this.home.left}px`;
    this.element.style.top = `${this.home.top}px`;
  }

  // ==================== moving it out of the way ====================

  startDrag(event) {
    if (event.target.closest(".search-keyboard-button")) return;
    event.preventDefault();
    this.hintTarget.setPointerCapture(event.pointerId);
    const bounds = this.element.getBoundingClientRect();
    this.drag = { x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
    this.element.classList.add("is-dragging");
  }

  moveDrag(event) {
    if (!this.drag) return;
    this.moved = true;
    this.element.style.left = `${this.drag.left + event.clientX - this.drag.x}px`;
    this.element.style.top = `${this.drag.top + event.clientY - this.drag.y}px`;
  }

  // Let go near where it started and it goes back: the reader was putting it
  // back rather than placing it somewhere new.
  endDrag(event) {
    if (!this.drag) return;
    const left = this.drag.left + event.clientX - this.drag.x;
    const top = this.drag.top + event.clientY - this.drag.y;
    this.drag = null;
    this.element.classList.remove("is-dragging");
    if (!this.home) return;
    if (Math.hypot(left - this.home.left, top - this.home.top) < 40) {
      this.element.classList.add("is-springing");
      this.element.style.left = `${this.home.left}px`;
      this.element.style.top = `${this.home.top}px`;
      this.moved = false;
      setTimeout(() => this.element.classList.remove("is-springing"), 400);
    }
  }
}

application.register("search-keyboard", SearchKeyboardController);
