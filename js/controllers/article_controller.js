// js/controllers/article_controller.js
// The contents list on a long article page.
//
// The data model and digitization pages are articles rather than screens:
// they are read straight through, so the list beside the text is both a way
// in and a place marker. It is built from the headings, keeps up with the
// reading position, and on a narrow screen folds into a bar that names the
// section being read.
//
// Two shapes, set by data-article-mode-value:
//   "decimal"  the headings carry their own numbering, which is lifted out
//              into a badge, and each section's sub-headings are listed
//              under it - shown only while that section is being read.
//   "letters"  the sections are lettered A, B, C and their sub-headings
//              A1, A2 ...; the letter is written onto the heading as a badge
//              and each sub-heading carries its code.
//   "plain"    section headings only, with no numbering.

const ARTICLE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

class ArticleController extends Stimulus.Controller {
  static targets = ["toc", "list", "now"]
  static values = { mode: { type: String, default: "plain" } }

  connect() {
    this.buildList();
    window.LQ.refreshDynamicContent(this.element);
    // The list is written from the headings, so it is rebuilt rather than
    // translated string by string.
    this.onLanguageChange = () => this.buildList();
    document.addEventListener("language:changed", this.onLanguageChange);
    this.onAway = (event) => {
      if (!this.tocTarget.contains(event.target)) this.setOpen(false);
    };
    this.onEscape = (event) => { if (event.key === "Escape") this.setOpen(false); };
    document.addEventListener("click", this.onAway);
    document.addEventListener("keydown", this.onEscape);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("click", this.onAway);
    document.removeEventListener("keydown", this.onEscape);
    if (this.onScroll) window.removeEventListener("scroll", this.onScroll);
    if (this.onResize) window.removeEventListener("resize", this.onResize);
  }

  toggle(event) {
    event.stopPropagation();
    this.setOpen(!this.tocTarget.classList.contains("is-open"));
  }

  setOpen(open) {
    this.tocTarget.classList.toggle("is-open", open);
    const button = this.element.querySelector(".article-toc-toggle");
    if (button) button.setAttribute("aria-expanded", String(open));
  }

  // "7.1. Heading" -> ["7.1", "Heading"]. A heading with no number of its own
  // keeps its whole text and gets no badge.
  static split(text) {
    const match = text.match(/^\s*(\d+(?:\.\d+)*)\.?\s+(.+)$/);
    return match ? [match[1], match[2]] : [null, text.trim()];
  }

  buildList() {
    const list = this.listTarget;
    list.innerHTML = "";
    this.entries = [];
    const body = this.element.querySelector(".article-body");
    if (!body) return;

    const sections = [...body.querySelectorAll(".article-h2")].filter((h) => h.id);
    let lettered = 0;
    sections.forEach((heading, index) => {
      const subs = this.modeValue === "plain" ? [] : this.subsUnder(heading, sections[index + 1]);
      // A heading may name itself differently in the list than on the page:
      // "LexiQamus 2.0" opens the page, but the list calls it Introduction.
      const named = heading.dataset.tocKey
        ? window.LQ.translate(heading.dataset.tocKey, heading.dataset.tocLabel || "")
        : null;
      // An opening section carries no letter, and does not spend one.
      if (this.modeValue === "letters" && heading.dataset.tocPlain !== undefined) {
        this.entries.push({ heading, code: null, label: named || heading.textContent.trim(), subs: [] });
        return;
      }
      if (this.modeValue === "letters") {
        const letter = ARTICLE_LETTERS[lettered] || String(lettered + 1);
        lettered += 1;
        const label = this.letterHeading(heading, letter);
        subs.forEach((sub, position) => {
          sub.code = `${letter}${position + 1}`;
          sub.heading.dataset.code = sub.code;
        });
        this.entries.push({ heading, code: letter, label: named || label, subs });
        return;
      }
      const [code, label] = ArticleController.split(heading.textContent);
      this.entries.push({ heading, code, label: named || label, subs });
    });
    if (!this.entries.length) return;

    // A section whose one sub-heading repeats its own name says it twice in
    // the list, so the sub-heading is left out.
    this.entries.forEach((entry) => {
      if (entry.subs.length !== 1) return;
      const sub = entry.subs[0].label.toLocaleLowerCase();
      if (sub === entry.label.toLocaleLowerCase()) entry.subs = [];
    });

    const hasCodes = this.entries.some((entry) => entry.code);
    this.tocTarget.classList.toggle("has-codes", hasCodes);
    this.tocTarget.dataset.mode = this.modeValue;

    this.links = [];
    this.entries.forEach((entry) => {
      const item = document.createElement("li");
      item.appendChild(this.linkFor(entry, "article-toc-sec"));
      if (entry.subs.length) {
        const nested = document.createElement("ol");
        entry.subs.forEach((sub) => {
          const subItem = document.createElement("li");
          subItem.appendChild(this.linkFor(sub, ""));
          nested.appendChild(subItem);
        });
        item.appendChild(nested);
      }
      list.appendChild(item);
    });

    this.watchReading();
  }

  // A lettered section wears its letter as a badge, drawn in by CSS from the
  // code left here. The heading's own words stay where they are, so the
  // translation that replaces them has nothing of ours to tread on.
  letterHeading(heading, letter) {
    heading.dataset.code = letter;
    heading.classList.add("has-letter");
    return heading.textContent.trim();
  }

  // Every sub-heading between this section's heading and the next one.
  subsUnder(heading, next) {
    const body = this.element.querySelector(".article-body");
    const all = [...body.querySelectorAll(".article-h3")];
    return all
      .filter((sub) => {
        const afterThis = heading.compareDocumentPosition(sub) & Node.DOCUMENT_POSITION_FOLLOWING;
        const beforeNext = !next || (next.compareDocumentPosition(sub) & Node.DOCUMENT_POSITION_PRECEDING);
        return afterThis && beforeNext;
      })
      .map((sub) => {
        const [code, label] = ArticleController.split(sub.textContent);
        if (!sub.id) sub.id = ArticleController.slug(label);
        return { heading: sub, code, label };
      });
  }

  linkFor(entry, className) {
    const link = document.createElement("a");
    link.href = `#${entry.heading.id}`;
    if (className) link.className = className;
    link.dataset.title = entry.label;
    if (entry.code) {
      const badge = document.createElement("span");
      badge.className = className ? "article-toc-code" : "article-toc-number";
      badge.textContent = entry.code;
      link.appendChild(badge);
      link.classList.add("has-code");
    }
    link.appendChild(document.createTextNode(entry.label));
    link.addEventListener("click", () => this.setOpen(false));
    this.links.push({ link, heading: entry.heading });
    return link;
  }

  static slug(text) {
    const base = text
      .toLocaleLowerCase("en")
      .replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
      .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
    let id = base;
    let n = 2;
    while (document.getElementById(id)) id = `${base}-${n++}`;
    return id;
  }

  // Which section is being read. The heading that has last passed a line near
  // the top of the window wins, so the list keeps up with the page without
  // flickering between two headings on the same screen.
  watchReading() {
    if (!this.onScroll) {
      this.onScroll = () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => { this.ticking = false; this.markReading(); });
      };
      window.addEventListener("scroll", this.onScroll, { passive: true });
    }
    if (!this.onResize) {
      this.onResize = () => { this.current = -1; this.markReading(); };
      window.addEventListener("resize", this.onResize);
    }
    this.current = -1;
    this.markReading();
  }

  markReading() {
    if (!this.links || !this.links.length) return;
    const line = Math.min(window.innerHeight * 0.3, 240);
    let index = 0;
    this.links.forEach((entry, i) => {
      if (entry.heading.getBoundingClientRect().top <= line) index = i;
    });
    if (index === this.current) return;
    this.current = index;

    this.links.forEach((entry, i) => entry.link.classList.toggle("active", i === index));
    const active = this.links[index].link;
    const section = active.closest(".article-toc-list > li");
    this.listTarget.querySelectorAll(":scope > li").forEach((item) => {
      item.classList.toggle("is-open", item === section);
    });
    const sectionLink = section.querySelector(".article-toc-sec");
    sectionLink.classList.add("active");
    this.nameReading(active, sectionLink);
    this.keepInView(active);
  }

  // The bar on a narrow screen says where the reader is: the section, and
  // the sub-heading within it when there is one.
  nameReading(active, sectionLink) {
    if (!this.hasNowTarget) return;
    const code = active.querySelector(".article-toc-code, .article-toc-number");
    const mark = code ? `<span class="article-toc-now-code">${window.LQ.escape(code.textContent)}</span>` : "";
    const section = window.LQ.escape(sectionLink.dataset.title || "");
    if (active === sectionLink) {
      this.nowTarget.innerHTML = `${mark}<b>${section}</b>`;
      return;
    }
    const sub = window.LQ.escape(active.dataset.title || "");
    this.nowTarget.innerHTML =
      `${mark}<b class="article-toc-now-sec">${section}</b><span class="article-toc-now-sub">${sub}</span>`;
  }

  // A long list scrolls inside its own card, so the place being read stays
  // on screen rather than sliding out of the top of it.
  keepInView(active) {
    const toc = this.tocTarget;
    if (window.innerWidth <= 900 || toc.scrollHeight <= toc.clientHeight + 2) return;
    const link = active.getBoundingClientRect();
    const box = toc.getBoundingClientRect();
    if (link.top < box.top + 40 || link.bottom > box.bottom - 20) {
      toc.scrollTop += (link.top - box.top) - toc.clientHeight / 3;
    }
  }
}

application.register("article", ArticleController);
