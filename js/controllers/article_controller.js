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
  }

  toggle(event) {
    const button = event.currentTarget;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    this.tocTarget.classList.toggle("is-open", !open);
  }

  // Only the top-level headings go in the list: the articles run to forty
  // sub-headings, and a list that long is no longer a way in.
  buildList() {
    const list = this.listTarget;
    list.innerHTML = "";
    this.element.querySelectorAll(".article-body .article-h2").forEach((heading) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      item.appendChild(link);
      list.appendChild(item);
    });
  }
}

application.register("article", ArticleController);
