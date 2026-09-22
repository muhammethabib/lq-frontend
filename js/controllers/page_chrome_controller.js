// js/controllers/page_chrome_controller.js
// Puts the shared top bar and side menu on a content page.
//
// The markup comes from js/page_chrome.js so it is written once instead of
// being copied into every page. It is injected before the language controller
// on the same element runs its sweep, so the Turkish text lands on it like
// any other markup.
//
// A page whose menu entry is already built names it, so that entry is a live
// link and drops its "soon" badge:
//   <div data-controller="page-chrome language" data-page-chrome-page-value="about"></div>

class PageChromeController extends Stimulus.Controller {
  static values = { page: String }

  connect() {
    this.element.innerHTML = window.LQ_PAGE_CHROME || "";
    this.markBuiltPages();
    window.LQ.refreshDynamicContent(this.element);
    // The language controller ran before this markup existed, so it is told
    // to sweep again now that the chrome is on the page.
    document.dispatchEvent(new CustomEvent("page-chrome:ready"));
  }

  // A menu entry names the page it leads to. Entries start without an href
  // and marked unavailable, because most of those pages are not rebuilt yet;
  // the ones listed as built become ordinary links.
  markBuiltPages() {
    const built = window.LQ_BUILT_PAGES || [];
    this.element.querySelectorAll("[data-page]").forEach((link) => {
      const name = link.dataset.page;
      if (!built.includes(name)) return;
      link.setAttribute("href", `${name}.html`);
      link.classList.remove("is-unavailable");
      link.removeAttribute("aria-disabled");
      const badge = link.querySelector(".side-soon");
      if (badge) badge.remove();
      // The entry for the page being read is marked as the current one
      if (this.hasPageValue && name === this.pageValue) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }
}

application.register("page-chrome", PageChromeController);
