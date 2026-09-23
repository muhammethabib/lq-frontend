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

class OttomanKeyboardController extends Stimulus.Controller {
  static targets = ["basicPanel", "advancedPanel", "wildcardRow"]
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
  }

  disconnect() {
    document.removeEventListener("ottoman-keyboard:request", this.onRequest);
    document.removeEventListener("ottoman-keyboard:dismiss", this.onDismiss);
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
      const label = this.translate(wildcard.labelKey, name);
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

  switchHtml(target) {
    const label = target === "advanced"
      ? this.translate("keyboardAdvanced", "Advanced")
      : this.translate("keyboardBasic", "Basic");
    return `<button type="button" class="btn panel-switch" data-panel="${target}"
      data-action="pointerdown->ottoman-keyboard#switchPanel">
      <i data-feather="${target === "advanced" ? "chevrons-left" : "chevrons-right"}"></i>${this.escape(label)}
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
