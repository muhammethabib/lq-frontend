// js/controllers/reading_card_controller.js
// Where a reading came from, and what to do if it is wrong.
//
// Most Latin readings in a result list are produced by machine; some have
// been read and approved by an editor. Which of the two a reading is matters
// to anyone quoting it, so hovering one opens a small card beside it that
// says so and offers the two answers a reader can give: mark it correct, or
// say what is wrong with it.
//
// One card serves every reading on the page. It opens from the right edge of
// the word rather than the right edge of the column, so a short word does not
// leave it stranded far away.

// How long the card waits before it goes, once the pointer has left both the
// reading and the card.
const CARD_LINGER = 120;

class ReadingCardController extends Stimulus.Controller {
  static values = { template: String }

  connect() {
    const template = document.getElementById(this.templateValue);
    if (!template) return;
    this.card = template.content.firstElementChild.cloneNode(true);
    this.element.appendChild(this.card);
    this.translate();
    this.onLanguageChange = () => this.translate();
    document.addEventListener("language:changed", this.onLanguageChange);
    window.LQ.refreshDynamicContent(this.card);

    this.onOver = (event) => this.handleOver(event);
    this.onOut = (event) => this.handleOut(event);
    this.onScroll = () => this.follow();
    this.element.addEventListener("mouseover", this.onOver);
    this.element.addEventListener("mouseout", this.onOut);
    window.addEventListener("scroll", this.onScroll, true);
  }

  disconnect() {
    this.element.removeEventListener("mouseover", this.onOver);
    this.element.removeEventListener("mouseout", this.onOut);
    window.removeEventListener("scroll", this.onScroll, true);
    document.removeEventListener("language:changed", this.onLanguageChange);
    clearTimeout(this.timer);
  }

  translate() {
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.card);
  }

  handleOver(event) {
    if (event.target.closest(".reading-card")) {
      clearTimeout(this.timer);
      return;
    }
    const reading = event.target.closest("[data-reading]");
    if (reading) this.show(reading);
  }

  handleOut(event) {
    const leaving = event.target.closest("[data-reading], .reading-card");
    if (!leaving) return;
    const to = event.relatedTarget;
    if (to && to.closest("[data-reading], .reading-card")) return;
    this.hide(false);
  }

  show(reading) {
    clearTimeout(this.timer);
    if (this.reading !== reading) this.markCorrect(false);
    this.reading = reading;

    const approved = reading.dataset.reading === "verified";
    const label = this.card.querySelector("[data-reading-source]");
    label.classList.toggle("is-approved", approved);
    label.setAttribute("data-i18n", approved ? "fixVerified" : "fixAuto");
    label.textContent = approved
      ? window.LQ.translate("fixVerified", "Editor-approved")
      : window.LQ.translate("fixAuto", "Auto-generated");

    this.card.classList.add("is-open");
    this.place(reading);
  }

  // Beside the word, level with it. A word near the right edge of the window
  // takes the card on its left instead.
  place(reading) {
    requestAnimationFrame(() => {
      const at = reading.getBoundingClientRect();
      const width = this.card.offsetWidth;
      const height = this.card.offsetHeight;
      const room = window.innerWidth - at.right - 16;
      const left = room >= width ? at.right + 10 : Math.max(8, at.left - width - 10);
      const top = Math.max(8, Math.min(at.top + at.height / 2 - height / 2,
        window.innerHeight - height - 8));
      this.card.style.left = `${Math.round(left)}px`;
      this.card.style.top = `${Math.round(top)}px`;
      // The menu over the word and this card both want the space around it;
      // the menu is told where the card landed so it can step aside.
      document.dispatchEvent(new CustomEvent("reading-card:placed", {
        detail: { rect: this.card.getBoundingClientRect() }
      }));
    });
  }

  follow() {
    if (!this.reading || !this.card.classList.contains("is-open")) return;
    const at = this.reading.getBoundingClientRect();
    if (at.bottom < 0 || at.top > window.innerHeight) { this.hide(true); return; }
    this.place(this.reading);
  }

  hide(now) {
    clearTimeout(this.timer);
    const close = () => {
      this.card.classList.remove("is-open");
      this.reading = null;
      document.dispatchEvent(new CustomEvent("reading-card:closed"));
    };
    if (now) close(); else this.timer = setTimeout(close, CARD_LINGER);
  }

  // ==================== the two answers ====================

  // Marking a reading correct is a vote, not a form: it stays on the card for
  // as long as the reading is under the pointer and is sent as it is pressed.
  agree() {
    const button = this.card.querySelector("[data-reading-agree]");
    const on = button.classList.toggle("is-on");
    if (!on || !this.reading) return;
    $.ajax({
      url: "/reading_votes/create",
      type: "POST",
      data: { word: this.reading.textContent.trim(), verdict: "correct" },
      // No backend yet: returning false cancels the request. Delete
      // beforeSend once the route exists.
      beforeSend: () => false
    });
  }

  markCorrect(on) {
    const button = this.card && this.card.querySelector("[data-reading-agree]");
    if (button) button.classList.toggle("is-on", on);
  }

  // Saying it is wrong needs room to explain, so it hands over to the window
  // that asks for that.
  disagree() {
    if (!this.reading) return;
    const pair = this.reading.closest(".word-pair");
    const ottoman = pair ? pair.querySelector(".ottoman-box") : null;
    const detail = {
      ottoman: ottoman ? ottoman.textContent.trim() : "",
      latin: this.reading.textContent.trim()
    };
    this.hide(true);
    document.dispatchEvent(new CustomEvent("reading:report", { detail }));
  }
}

application.register("reading-card", ReadingCardController);
