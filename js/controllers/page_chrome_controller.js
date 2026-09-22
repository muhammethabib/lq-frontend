// js/controllers/page_chrome_controller.js
// Puts the shared top bar and side menu on a content page.
//
// The markup comes from js/page_chrome.js so it is written once instead of
// being copied into every page. It is injected before the language controller
// on the same element runs its sweep, so the Turkish text lands on it like
// any other markup.
//
// The chrome also carries the account window, since the buttons that open it
// are part of the side menu and every page has one.
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
  // Sign in and Sign up open the same window on different tabs.
  openAuth(event) {
    const mode = event.currentTarget.dataset.mode === "signup" ? "signUp" : "signIn";
    const container = this.element.querySelector("#authModal");
    const template = this.element.querySelector("#authTemplate");
    if (!container || !template) return;

    window.LQ.disposeTooltips(container);
    container.innerHTML = template.innerHTML;
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(container);
    window.LQ.refreshDynamicContent(container);

    // Bootstrap decides which tab is shown, so the window opens on the one
    // the reader asked for rather than always on the first.
    bootstrap.Tab.getOrCreateInstance(container.querySelector(`#${mode}Tab`)).show();
    bootstrap.Modal.getOrCreateInstance(container).show();

    // Nothing is submitted anywhere yet; the forms stand for the screens the
    // backend will render.
    container.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", (submitted) => submitted.preventDefault());
    });

    // The side menu is open behind the window on a narrow screen
    const menu = this.element.querySelector("#sideMenu");
    if (menu) bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
  }

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
