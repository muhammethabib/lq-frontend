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

// Below this width the stylesheet docks the keyboard to the bottom of the
// screen; the same query lives in css/ottoman-keyboard.css.
const KEYBOARD_DOCK_QUERY = "(max-width: 767px)";

// How long a key stays down after the reader's own key wrote its letter.
const KEY_ECHO_MS = 170;

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
  static targets = ["basicPanel", "advancedPanel", "wildcardRow", "teach"]
  static values = { open: { type: Boolean, default: false } }

  connect() {
    this.renderPanels();
    this.showPanel("basic");

    // The field being typed into asks for the keyboard and says where it is
    this.onRequest = (event) => {
      this.owner = event.detail.owner || null;
      this.below = event.detail.below || null;
      this.openNear(event.detail.anchor);
    };
    this.onDismiss = () => this.close();
    document.addEventListener("ottoman-keyboard:request", this.onRequest);
    document.addEventListener("ottoman-keyboard:dismiss", this.onDismiss);

    this.onReposition = () => { if (this.openValue) this.place(); };
    window.addEventListener("resize", this.onReposition);
    window.addEventListener("scroll", this.onReposition, true);

    // The keys carry their labels and tooltips, so a language change rebuilds
    // them. The event is dispatched on the page root, an ancestor of this
    // element, so it is listened for on document where it bubbles to.
    this.onLanguageChange = () => {
      window.LQ.disposeTooltips(this.element);
      this.renderPanels();
      this.showPanel(this.advancedPanelTarget.classList.contains("is-active") ? "advanced" : "basic");
    };
    document.addEventListener("language:changed", this.onLanguageChange);

    // The panel's Clear is always on show: while the keyboard covers the row,
    // it is the only one there is.
    this.onState = () => {};
    document.addEventListener("ottoman-keyboard:state", this.onState);

    // A letter written on the reader's own keyboard shows its key going down
    // here too, and retires the line that says the board takes it.
    this.onEcho = (event) => { this.echo((event.detail || {}).char); this.retireTeach(); };
    document.addEventListener("ottoman-keyboard:echo", this.onEcho);
  }

  disconnect() {
    document.removeEventListener("ottoman-keyboard:request", this.onRequest);
    document.removeEventListener("ottoman-keyboard:dismiss", this.onDismiss);
    document.removeEventListener("ottoman-keyboard:echo", this.onEcho);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("ottoman-keyboard:state", this.onState);
    window.removeEventListener("resize", this.onReposition);
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
      return `<button type="button" class="btn wildcard-key" data-wildcard="${this.escape(name)}"
        data-action="pointerdown->ottoman-keyboard#pressWildcard"
        data-bs-toggle="tooltip" data-bs-title="${this.escape(label)}"
        aria-label="${this.escape(label)}">${wildcard.mark || this.escape(wildcard.symbol)}</button>`;
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

  // ==================== the line that teaches the keyboard ====================

  // It says it once, shows it on a loop, and stops the moment the reader has
  // typed anything, by either board. It does not come back this session.
  retireTeach() {
    if (this.taught) return;
    this.taught = true;
    this.element.classList.add("is-learned");
  }

  // ==================== the echo of the reader's own keyboard ====================

  // The key that writes a letter is shown pressed for as long as a press of
  // one's own lasts. Only a letter key can echo: a skeleton stands for
  // several letters and no single key on the board wrote it.
  echo(letter) {
    if (!letter) return;
    const panel = this.advancedPanelTarget.classList.contains("is-active")
      ? this.advancedPanelTarget : this.basicPanelTarget;
    const key = panel.querySelector(`.key[data-kind="letter"][data-char="${CSS.escape(letter)}"]`);
    if (!key) return;
    key.classList.remove("is-echo");
    void key.offsetWidth;
    key.classList.add("is-echo");
    clearTimeout(key.echoTimer);
    key.echoTimer = setTimeout(() => key.classList.remove("is-echo"), KEY_ECHO_MS);
  }

  keyHtml(key) {
    // A skeleton key shows where the missing dots would sit
    const dots = key.type === "rasm"
      ? (key.dots === "either" ? '<span class="dot-mark">*</span><span class="dot-mark">*</span>'
        : '<span class="dot-mark">*</span>')
      : "";
    // A skeleton stands for several letters, and which ones is the whole
    // point of the key, so they are shown as themselves rather than listed in
    // a line of running text.
    const title = key.matches
      ? `<span class="key-matches-label">${this.escape(this.translate("keyMatches", "Matches"))}</span>` +
        `<span class="key-matches">${key.matches.map((letter) =>
          `<span class="key-match">${this.escape(letter)}</span>`).join("")}</span>`
      : (key.labelKey ? this.escape(this.translate(key.labelKey, key.face || key.char)) : "");

    return `<button type="button" class="btn key"
      data-kind="${key.type}"${key.dots ? ` data-dots="${key.dots}"` : ""}
      data-char="${this.escape(key.char)}"
      ${key.matches ? `data-matches="${this.escape(key.matches.join(" "))}"` : ""}
      data-action="pointerdown->ottoman-keyboard#press"
      ${title ? `data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${this.escape(title)}"` : ""}
      >${this.escape(key.face || key.char)}${dots}</button>`;
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
        ? this.translate("keyboardAdvancedLayout", "Advanced layout")
        : this.translate("keyboardBasicLayout", "Basic layout"))}</span>`;
    const arrow = advanced ? ARROW_LEFT : ARROW_RIGHT;
    return `<button type="button" class="btn panel-switch" data-panel="${target}"
      data-action="pointerdown->ottoman-keyboard#switchPanel"
      data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="${this.escape(title)}">
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
    this.announce({
      kind: key.dataset.kind,
      char: key.dataset.char,
      dots: key.dataset.dots || null,
      matches: key.dataset.matches ? key.dataset.matches.split(" ") : null
    });
    this.retireTeach();
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
    this.anchor = null;
    this.below = null;
    this.owner = null;
    window.LQ.releaseRoom();
    // Whoever was typing needs to know: the Clear that was hidden behind the
    // panel comes back, and the row's hint is allowed again.
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:closed"));
  }

  // Sits under whatever asked for it, kept inside the viewport. Below 768px
  // the stylesheet pins it to the bottom of the screen instead, so the inline
  // position is cleared to let that win.
  place() {
    if (!this.anchor || !this.anchor.isConnected) return;
    if (window.matchMedia(KEYBOARD_DOCK_QUERY).matches) {
      this.element.style.left = "";
      this.element.style.top = "";
      return;
    }
    // Lined up with whatever asked for it, but clear of the row that holds it:
    // the boxes carry their own controls underneath, and a panel over them
    // would be as good as taking them away.
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
    const top = Math.max(8, clears.bottom + 8);
    this.element.style.left = `${Math.round(left)}px`;
    this.element.style.top = `${Math.round(top)}px`;
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
