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

class OttomanKeyboardController extends Stimulus.Controller {
  static targets = ["basicPanel", "advancedPanel", "clear"]
  static values = { open: { type: Boolean, default: false } }

  connect() {
    this.renderPanels();
    this.showPanel("basic");

    // The field being typed into asks for the keyboard and says where it is
    this.onRequest = (event) => this.openNear(event.detail.anchor, event.detail.canClear);
    this.onDismiss = () => this.close();
    document.addEventListener("ottoman-keyboard:request", this.onRequest);
    document.addEventListener("ottoman-keyboard:dismiss", this.onDismiss);

    this.onReposition = () => { if (this.openValue) this.place(); };
    window.addEventListener("resize", this.onReposition);
    window.addEventListener("scroll", this.onReposition, true);

    // Re-label the panel switches after a language change
    this.element.addEventListener("language:changed", () => window.LQ.refreshDynamicContent(this.element));
  }

  disconnect() {
    document.removeEventListener("ottoman-keyboard:request", this.onRequest);
    document.removeEventListener("ottoman-keyboard:dismiss", this.onDismiss);
    window.removeEventListener("resize", this.onReposition);
    window.removeEventListener("scroll", this.onReposition, true);
  }

  // ==================== building the keys ====================

  renderPanels() {
    const layout = window.LQ_KEYBOARD_LAYOUT || { basic: [], advanced: [] };
    this.basicPanelTarget.innerHTML = this.panelHtml(layout.basic, "advanced");
    this.advancedPanelTarget.innerHTML = this.panelHtml(layout.advanced, "basic");
    window.LQ.refreshDynamicContent(this.element);
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
    const title = key.matches
      ? `${this.translate("keyMatches", "Matches")}: ${key.matches.join(" ")}`
      : (key.labelKey ? this.translate(key.labelKey, key.face || key.char) : "");

    return `<button type="button" class="btn key"
      data-kind="${key.type}"${key.dots ? ` data-dots="${key.dots}"` : ""}
      data-char="${this.escape(key.char)}"
      ${key.matches ? `data-matches="${this.escape(key.matches.join(" "))}"` : ""}
      data-action="pointerdown->ottoman-keyboard#press"
      ${title ? `data-bs-toggle="tooltip" data-bs-title="${this.escape(title)}"` : ""}
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

  announce(detail) {
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:key", { detail }));
  }

  // ==================== showing and placing ====================

  openNear(anchor, canClear) {
    this.anchor = anchor || null;
    this.openValue = true;
    this.element.classList.add("is-open");
    this.clearTarget.hidden = !canClear;
    this.place();
    // Only on opening: doing it from place() would make the page scroll
    // itself every time the scroll listener fired.
    if (window.matchMedia("(max-width: 767px)").matches) this.scrollAnchorClear();
  }

  close(event) {
    if (event) event.preventDefault();
    this.openValue = false;
    this.element.classList.remove("is-open");
    this.anchor = null;
  }

  // Sits under whatever asked for it, kept inside the viewport. Below 768px
  // the stylesheet pins it to the bottom of the screen instead, so the inline
  // position is cleared to let that win.
  place() {
    if (!this.anchor || !this.anchor.isConnected) return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      this.element.style.left = "";
      this.element.style.top = "";
      return;
    }
    const bounds = this.anchor.getBoundingClientRect();
    const width = this.element.offsetWidth || 460;
    const height = this.element.offsetHeight || 340;
    const left = Math.min(
      Math.max(8, bounds.left + bounds.width / 2 - width / 2),
      window.innerWidth - width - 8
    );
    const top = Math.min(Math.max(8, bounds.bottom + 8), window.innerHeight - height - 8);
    this.element.style.left = `${Math.round(left)}px`;
    this.element.style.top = `${Math.round(top)}px`;
  }

  // Keeps the field clear of the docked keyboard, with a little room to spare
  scrollAnchorClear() {
    const gap = 16;
    const bounds = this.anchor.getBoundingClientRect();
    const keyboardTop = window.innerHeight - (this.element.offsetHeight || 0);
    const overlap = bounds.bottom + gap - keyboardTop;
    if (overlap > 0) window.scrollBy({ top: overlap, behavior: "smooth" });
  }

  // ==================== helpers ====================

  translate(key, fallback) {
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    const dictionary = (window.LQ_TRANSLATIONS && window.LQ_TRANSLATIONS[language]) || {};
    return key in dictionary ? dictionary[key] : fallback;
  }

  escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }
}

application.register("ottoman-keyboard", OttomanKeyboardController);
