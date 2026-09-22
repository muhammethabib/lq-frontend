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
    window.LQ.refreshDynamicContent(this.element);
    // The contents list is written from the headings, so it is rebuilt in the
    // new language rather than translated string by string.
    this.onLanguageChange = () => { this.buildList(); this.markCrossReferences(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
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
      const item = document.createElement("li");
      item.appendChild(this.entry(section.id, section.dataset.code, heading.textContent));

      const blocks = section.querySelectorAll(".guide-block");
      if (blocks.length) {
        const inner = document.createElement("ol");
        inner.className = "guide-toc-sub";
        blocks.forEach((block) => {
          const subheading = block.querySelector(".guide-h3");
          const line = document.createElement("li");
          line.appendChild(this.entry(block.id, block.dataset.code, subheading.textContent));
          inner.appendChild(line);
        });
        item.appendChild(inner);
      }
      list.appendChild(item);
    });
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
    this.element.querySelectorAll('.guide-section a[href^="#"]').forEach((link) => {
      const target = this.element.querySelector(`[id="${CSS.escape(link.hash.slice(1))}"]`);
      link.classList.add("guide-xref");
      link.dataset.code = (target && target.dataset.code) || "";
    });
  }
}

application.register("guide", GuideController);
