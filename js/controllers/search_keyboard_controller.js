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
// The keys can take a second order: the alphabet's, elif, be, pe, te..., for a
// reader who does not know the keyboard's, or wants a letter where the
// alphabet puts it. The order is a value, remembered in localStorage, and the
// button in the header switches it. Physical typing is unaffected: it follows
// the layout's map whichever order the keys are shown in.

const SEARCH_KEYBOARD_ORDER_KEY = "lq-search-keyboard-order";

class SearchKeyboardController extends Stimulus.Controller {
  static targets = ["rows", "hint", "orderButton"]
  static values = {
    open: { type: Boolean, default: false },
    order: { type: String, default: "keyboard" }   // "keyboard" | "alphabetical"
  }

  // The remembered order is read before the first render, and before the
  // value's own first callback, which would otherwise write the default over it.
  initialize() {
    this.orderValue = this.rememberedOrder() || "keyboard";
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

    // The keys carry the layout of the reader's own keyboard, which is the
    // one the interface language implies.
    this.onLanguageChange = () => { this.labelOrderButton(); this.render(); };
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
    const rows = this.orderValue === "alphabetical"
      ? this.alphabet().map((row) => row.map(([letter, latin]) => this.letterKeyHtml(letter, latin)))
      : (layout.rows || []).map((row) => row.map((key) => this.keyHtml(key, layout)));
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

  // A key of the alphabetical order: the letter, with its transliteration
  // where the other order shows the key's name.
  letterKeyHtml(letter, latin) {
    const safe = window.LQ.escape;
    const isMark = /^[\u02BF\u02BE]$/.test(latin);   // ʿ and ʾ, too faint at label size
    return `
      <button type="button" class="btn search-key" data-search-char="${safe(letter)}"
              data-action="pointerdown->search-keyboard#press">
        <span class="search-key-latin${isMark ? " search-key-latin-mark" : ""}">${safe(latin)}</span>
        <span class="search-key-ottoman">${safe(this.face(letter))}</span>
      </button>`;
  }

  // ==================== the order of the keys ====================

  toggleOrder(event) {
    // Like a key press, it must not take focus away from the bar.
    event.preventDefault();
    this.orderValue = this.orderValue === "alphabetical" ? "keyboard" : "alphabetical";
  }

  orderValueChanged(order, previous) {
    const alphabetical = order === "alphabetical";
    this.element.classList.toggle("is-alphabetical", alphabetical);
    if (previous !== undefined) this.rememberOrder();   // a change, not the first reading
    this.labelOrderButton();
    this.render();
  }

  // The button's title says where a press leads, in the interface language.
  // It is set here rather than left to the translation sweep, because the key
  // it carries changes with the order and the sweep keeps the first title it
  // saw as the English one.
  labelOrderButton() {
    if (!this.hasOrderButtonTarget) return;
    const alphabetical = this.orderValue === "alphabetical";
    const key = alphabetical ? "keyboardOrderKeyboard" : "keyboardOrderAlphabetical";
    const english = alphabetical ? "Back to keyboard layout" : "Alphabetical order (elif, be, te\u2026)";
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    const dictionary = (window.LQ_TRANSLATIONS || {})[language] || {};
    const text = dictionary[key] || english;
    const button = this.orderButtonTarget;
    button.dataset.i18nTitle = key;
    button.dataset.i18nAria = key;
    button.setAttribute("title", text);
    button.setAttribute("aria-label", text);
    button.setAttribute("aria-pressed", String(alphabetical));
    // The tooltip took its text when it was built; it is built again.
    window.LQ.refreshDynamicContent(button.parentElement);
  }

  rememberedOrder() {
    try {
      const order = localStorage.getItem(SEARCH_KEYBOARD_ORDER_KEY);
      return order === "alphabetical" || order === "keyboard" ? order : null;
    } catch (error) { return null; }
  }

  rememberOrder() {
    try { localStorage.setItem(SEARCH_KEYBOARD_ORDER_KEY, this.orderValue); } catch (error) { /* private mode */ }
  }

  keyHtml(key, layout) {
    const safe = window.LQ.escape;
    const pair = (layout.dual || {})[key];
    if (pair) {
      const [plain, shift, shiftLabel, alt, altLabel] = pair;
      return `
        <div class="search-key search-key-split${alt ? " search-key-triple" : ""}">
          ${this.partHtml(key, plain, key)}
          ${this.partHtml(shiftLabel, shift, key)}
          ${alt ? this.partHtml(altLabel, alt, key) : ""}
        </div>`;
    }
    const letter = (layout.map || {})[key];
    if (!letter) return "";
    return `
      <button type="button" class="btn search-key" data-search-char="${safe(letter)}"
              data-action="pointerdown->search-keyboard#press">
        <span class="search-key-latin">${safe(key)}</span>
        <span class="search-key-ottoman">${safe(this.face(letter))}</span>
      </button>`;
  }

  partHtml(label, letter, key) {
    const safe = window.LQ.escape;
    return `
      <button type="button" class="btn search-key-part" data-search-char="${safe(letter)}"
              data-search-key="${safe(key)}"
              data-action="pointerdown->search-keyboard#press">
        <span class="search-key-latin">${safe(label)}</span>
        <span class="search-key-ottoman">${safe(this.face(letter))}</span>
      </button>`;
  }

  // A ye is written without its dots and gains them when a letter follows,
  // so the key has to show something: the dotted one, which is what a reader
  // looking for the key expects to see.
  face(letter) { return letter === "_ye_" ? "ي" : letter; }

  press(event) {
    // Stops the press from taking focus away from the bar.
    event.preventDefault();
    document.dispatchEvent(new CustomEvent("search-keyboard:key", {
      detail: { char: event.currentTarget.dataset.searchChar }
    }));
    this.retireHint();
  }

  backspace(event) {
    event.preventDefault();
    document.dispatchEvent(new CustomEvent("search-keyboard:key", { detail: { kind: "backspace" } }));
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
