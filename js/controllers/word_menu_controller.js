// js/controllers/word_menu_controller.js
// The little menu over a word.
//
// Hovering a word in a result list raises a small dark menu above it with the
// three things that can be done with that word: look it up in a new tab, see
// the words that share its root, and take it apart. The menu is one element
// reused by every word box on the page rather than one per box, so a list of
// several hundred words carries no weight until it is asked for.
//
// The menu follows the pointer between the box and itself: leaving the box
// for the menu keeps it up, and leaving both takes it down after a moment, so
// a reader crossing the gap does not lose it.

// How long the menu waits before it goes, once the pointer has left both the
// word and the menu.
const LINGER = 150;

class WordMenuController extends Stimulus.Controller {
  static values = { template: String }

  connect() {
    const template = document.getElementById(this.templateValue);
    if (!template) return;
    this.menu = template.content.firstElementChild.cloneNode(true);
    this.element.appendChild(this.menu);
    // The page is swept for translations once, and the menu may arrive after
    // that sweep has run, so it is translated on its own here and again
    // whenever the interface language changes.
    this.translate();
    this.onLanguageChange = () => this.translate();
    document.addEventListener("language:changed", this.onLanguageChange);
    window.LQ.refreshDynamicContent(this.menu);

    this.onOver = (event) => this.handleOver(event);
    this.onOut = (event) => this.handleOut(event);
    this.onScroll = () => this.follow();
    this.element.addEventListener("mouseover", this.onOver);
    this.element.addEventListener("mouseout", this.onOut);
    // The menu is anchored to a word, so it travels with it rather than
    // being left behind when the page moves under the pointer.
    window.addEventListener("scroll", this.onScroll, true);
    // The card beside a reading opens into the same space; the menu steps
    // aside rather than covering it.
    this.onCard = (event) => this.stepAside(event.detail.rect);
    this.onCardGone = () => { this.pushed = false; if (this.box) this.place(this.box); };
    document.addEventListener("reading-card:placed", this.onCard);
    document.addEventListener("reading-card:closed", this.onCardGone);
  }

  disconnect() {
    this.element.removeEventListener("mouseover", this.onOver);
    this.element.removeEventListener("mouseout", this.onOut);
    window.removeEventListener("scroll", this.onScroll, true);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("reading-card:placed", this.onCard);
    document.removeEventListener("reading-card:closed", this.onCardGone);
    clearTimeout(this.timer);
  }

  translate() {
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.menu);
  }

  // Moved clear of the card beside the reading, to its left, keeping the
  // tail pointing at the middle of the word it belongs to.
  stepAside(card) {
    if (!this.menu.classList.contains("is-open")) return;
    const at = this.menu.getBoundingClientRect();
    const clear = at.right <= card.left - 6 || at.left >= card.right ||
      at.bottom <= card.top || at.top >= card.bottom;
    if (clear) return;
    const left = Math.max(8, card.left - at.width - 10);
    this.menu.style.left = `${Math.round(left)}px`;
    this.pushed = true;
    if (this.box) {
      const word = this.box.getBoundingClientRect();
      const tail = Math.max(12, Math.min(at.width - 12, word.left + word.width / 2 - left));
      this.menu.style.setProperty("--word-menu-tail", `${Math.round(tail)}px`);
    }
  }

  // Keeps the menu over its word while the page scrolls; a word carried out
  // of the window takes the menu with it.
  follow() {
    if (!this.box || !this.menu.classList.contains("is-open")) return;
    const at = this.box.getBoundingClientRect();
    if (at.bottom < 0 || at.top > window.innerHeight) { this.hide(true); return; }
    this.place(this.box);
  }

  handleOver(event) {
    if (this.menu && event.target.closest(".word-menu")) {
      clearTimeout(this.timer);
      return;
    }
    const box = event.target.closest(".word-box[data-menu-latin]");
    // The badge in the corner of a box does its own job; the menu stays out
    // of its way rather than covering it.
    if (box && !event.target.closest(".analysis-badge")) this.show(box);
  }

  handleOut(event) {
    const leavingBox = event.target.closest(".word-box[data-menu-latin]");
    const leavingMenu = event.target.closest(".word-menu");
    if (!leavingBox && !leavingMenu) return;
    const to = event.relatedTarget;
    if (to && (to.closest(".word-box[data-menu-latin]") || to.closest(".word-menu"))) return;
    this.hide(false);
  }

  show(box) {
    clearTimeout(this.timer);
    this.box = box;
    this.pushed = false;
    this.menu.style.removeProperty("--word-menu-tail");
    this.menu.classList.add("is-open");
    this.place(box);
  }

  // Measured after it is shown, because a menu that is still hidden has no
  // size to place by. A word near an edge of the window pulls the menu back
  // inside it; a word carrying a typo mark, whose own card opens above it,
  // gets the menu underneath instead.
  place(box) {
    requestAnimationFrame(() => {
      const at = box.getBoundingClientRect();
      const width = this.menu.offsetWidth;
      const height = this.menu.offsetHeight;
      const below = !!box.closest(".word-ottoman")?.querySelector(".typo-mark");
      let left = at.left + at.width / 2 - width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      const top = below
        ? Math.min(at.bottom + 10, window.innerHeight - height - 8)
        : at.top - height - 8;
      this.menu.classList.toggle("is-below", below);
      this.menu.style.top = `${Math.round(top)}px`;
      if (this.pushed) return;
      this.menu.style.left = `${Math.round(left)}px`;
      this.menu.style.removeProperty("--word-menu-tail");
    });
  }

  hide(now) {
    clearTimeout(this.timer);
    const close = () => {
      this.menu.classList.remove("is-open");
      this.box = null;
    };
    if (now) close(); else this.timer = setTimeout(close, LINGER);
  }

  // ==================== the three things ====================

  // A word looked up from here opens in its own tab, so the list it was found
  // in stays where it is.
  searchInTab() {
    const word = this.box && this.box.dataset.menuLatin;
    this.hide(true);
    if (word) window.open(`home.html?q=${encodeURIComponent(word)}`, "_blank", "noopener");
  }

  sameRoot() {
    this.handOver("cognates:open");
  }

  analysis() {
    this.handOver("morphology:open");
  }

  handOver(name) {
    if (!this.box) return;
    const { menuOttoman, menuLatin } = this.box.dataset;
    this.hide(true);
    document.dispatchEvent(new CustomEvent(name, {
      detail: { ottoman: menuOttoman, latin: menuLatin }
    }));
  }
}

application.register("word-menu", WordMenuController);
