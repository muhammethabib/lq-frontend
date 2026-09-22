// js/controllers/guide_controller.js
// The User Guide's contents list and its heading codes.
//
// The guide is long, so every section gets a letter (A, B, C ...) and every
// block inside it a code (A1, A2 ...). The codes are written onto the
// headings here rather than into the markup, so adding a section renumbers
// the rest by itself. The contents list is built from the same pass.
//
// A link that points at a block inside the guide gets that block's code
// appended, so a cross-reference reads "Search Results C" without the author
// having to keep the codes in step by hand.

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

class GuideController extends Stimulus.Controller {
  static targets = ["toc", "list"]

  connect() {
    this.numberHeadings();
    this.buildList();
    this.markCrossReferences();
    this.markPins();
    window.LQ.refreshDynamicContent(this.element);
    // The contents list is written from the headings, so it is rebuilt in the
    // new language rather than translated string by string.
    this.onLanguageChange = () => { this.buildList(); this.markCrossReferences(); this.markPins(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.onScroll) window.removeEventListener("scroll", this.onScroll);
  }

  // The toggle is the contents list on a narrow screen; on a wide one the
  // list is always open and the button is hidden by the stylesheet.
  toggle(event) {
    const button = event.currentTarget;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    this.tocTarget.classList.toggle("is-open", !open);
  }

  numberHeadings() {
    this.element.querySelectorAll(".guide-section").forEach((section, index) => {
      const letter = LETTERS[index] || String(index + 1);
      section.dataset.code = letter;
      const heading = section.querySelector(".guide-h2");
      if (heading) heading.dataset.code = letter;
      section.querySelectorAll(".guide-block").forEach((block, position) => {
        const code = `${letter}${position + 1}`;
        block.dataset.code = code;
        const subheading = block.querySelector(".guide-h3");
        if (subheading) subheading.dataset.code = code;
      });
    });
  }

  buildList() {
    const list = this.listTarget;
    list.innerHTML = "";
    this.element.querySelectorAll(".guide-section").forEach((section) => {
      const heading = section.querySelector(".guide-h2");
      if (!heading) return;
      const item = document.createElement("li");
      item.appendChild(this.entry(section.id, section.dataset.code, heading.textContent));

      const blocks = section.querySelectorAll(".guide-block");
      if (blocks.length) {
        const inner = document.createElement("ol");
        inner.className = "guide-toc-sub";
        blocks.forEach((block) => {
          const subheading = block.querySelector(".guide-h3");
          if (!subheading) return;
          const line = document.createElement("li");
          line.appendChild(this.entry(block.id, block.dataset.code, subheading.textContent));
          inner.appendChild(line);
        });
        item.appendChild(inner);
      }
      list.appendChild(item);
    });
    this.watchReading();
  }

  // Which part of the guide is being read. The heading that has last passed a
  // line near the top of the window wins, so the list keeps up with the page
  // without flickering between two headings on the same screen.
  watchReading() {
    this.marks = Array.from(this.listTarget.querySelectorAll("a")).map((link) => ({
      link,
      heading: this.element.querySelector(`[id="${CSS.escape(link.hash.slice(1))}"]`)
    })).filter((mark) => mark.heading);
    if (!this.onScroll) {
      this.onScroll = () => this.markReading();
      window.addEventListener("scroll", this.onScroll, { passive: true });
    }
    this.markReading();
  }

  markReading() {
    if (!this.marks || !this.marks.length) return;
    let current = this.marks[0];
    this.marks.forEach((mark) => {
      if (mark.heading.getBoundingClientRect().top <= 120) current = mark;
    });
    this.marks.forEach((mark) => mark.link.classList.toggle("active", mark === current));
  }

  entry(anchor, code, text) {
    const link = document.createElement("a");
    link.href = `#${anchor}`;
    link.innerHTML = `<span class="guide-code">${window.LQ.escape(code)}</span>` +
      `<span>${window.LQ.escape(text)}</span>`;
    return link;
  }

  // A link to a block in this page shows that block's code, so the reader
  // knows where they are being sent before they follow it.
  markCrossReferences() {
    this.element.querySelectorAll('.guide-section a[href^="#"]:not(.guide-pin)').forEach((link) => {
      const target = this.element.querySelector(`[id="${CSS.escape(link.hash.slice(1))}"]`);
      link.classList.add("guide-xref");
      link.dataset.code = (target && target.dataset.code) || "";
    });
  }

  // A marker drawn on a screenshot wears the code of the passage it leads to,
  // so the picture and the contents list speak the same language. The codes
  // are worked out from the order of the sections, so they are written here
  // rather than into the page.
  markPins() {
    this.element.querySelectorAll('.guide-pin[href^="#"]').forEach((pin) => {
      const target = this.element.querySelector(`[id="${CSS.escape(pin.hash.slice(1))}"]`);
      const code = target && target.dataset.code;
      const heading = target && target.querySelector(".guide-h2, .guide-h3");
      const name = heading ? heading.textContent.trim() : "";
      // A marker reaching in from the side of a tall screenshot is a dot:
      // there is no room for a code beside the picture, so it carries its
      // name for a screen reader instead.
      const labelled = !pin.closest(".guide-map-bands");
      pin.textContent = labelled && code ? code : "";
      pin.setAttribute("aria-label", [code, name].filter(Boolean).join(" · "));
    });
  }
}

application.register("guide", GuideController);
