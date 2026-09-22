// js/controllers/article_controller.js
// The contents list on a long article page.
//
// The data model and digitization pages are articles rather than screens:
// their headings already carry their own numbering, so this controller only
// gathers them into a contents list and handles the collapse on a narrow
// screen. The guide has its own controller because its codes are generated.

class ArticleController extends Stimulus.Controller {
  static targets = ["toc", "list"]

  connect() {
    this.buildList();
    window.LQ.refreshDynamicContent(this.element);
    // The list is written from the headings, so it is rebuilt rather than
    // translated string by string.
    this.onLanguageChange = () => this.buildList();
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.onScroll) window.removeEventListener("scroll", this.onScroll);
  }

  toggle(event) {
    const button = event.currentTarget;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    this.tocTarget.classList.toggle("is-open", !open);
  }

  // Only the top-level headings go in the list: the articles run to forty
  // sub-headings, and a list that long is no longer a way in.
  //
  // A heading that begins with its own number has that number lifted out into
  // a badge, so the numbers line up down the left and the titles line up
  // beside them however long a number grows.
  buildList() {
    const list = this.listTarget;
    list.innerHTML = "";
    this.headings = [];
    this.element.querySelectorAll(".article-body .article-h2").forEach((heading) => {
      if (!heading.id) return;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${heading.id}`;

      const text = heading.textContent.trim();
      const numbered = text.match(/^(\d+)\.\s*(.*)$/);
      if (numbered) {
        const code = document.createElement("span");
        code.className = "article-toc-code";
        code.textContent = numbered[1];
        link.appendChild(code);
        link.appendChild(document.createTextNode(numbered[2]));
        link.classList.add("has-code");
      } else {
        link.textContent = text;
      }

      item.appendChild(link);
      list.appendChild(item);
      this.headings.push({ heading, link });
    });
    this.watchReading();
  }

  // Which section is being read. The heading that has last passed a line near
  // the top of the window wins, so the list keeps up with the page without
  // flickering between two headings on the same screen.
  watchReading() {
    if (!this.onScroll) {
      this.onScroll = () => this.markReading();
      window.addEventListener("scroll", this.onScroll, { passive: true });
    }
    this.markReading();
  }

  markReading() {
    if (!this.headings || !this.headings.length) return;
    let current = this.headings[0];
    this.headings.forEach((entry) => {
      if (entry.heading.getBoundingClientRect().top <= 120) current = entry;
    });
    this.headings.forEach((entry) => {
      entry.link.classList.toggle("active", entry === current);
    });
  }
}

application.register("article", ArticleController);
