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
    this.settleHomeLink();
    this.watchMenu();
    this.carryLanguageHome();
    // The reader can change language after the chrome is drawn, and the way
    // back has to keep up with them.
    this.onLanguageChange = () => this.carryLanguageHome();
    document.addEventListener("language:changed", this.onLanguageChange);
    window.LQ.refreshDynamicContent(this.element);
    // The language controller ran before this markup existed, so it is told
    // to sweep again now that the chrome is on the page.
    document.dispatchEvent(new CustomEvent("page-chrome:ready"));
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
    const menu = this.element.querySelector("#sideMenu");
    if (menu && this.onMenuHidden) menu.removeEventListener("hidden.bs.offcanvas", this.onMenuHidden);
  }

  // The way back to the main page carries the language with it, so a reader
  // in Turkish does not land on the English main page. The browser usually
  // remembers the choice; this works even when it cannot.
  carryLanguageHome() {
    const language = document.documentElement.lang === "tr" ? "tr" : "en";
    this.element.querySelectorAll("[data-chrome-home]").forEach((link) => {
      link.setAttribute("href", `home.html?lang=${language}`);
    });
  }

  onHome() { return this.pageValue === "home"; }

  // The main page carries its own wordmark, so the one in the top bar is
  // there for the pages that do not. The way to the old site is the other way
  // round: it belongs to the main page, and a reading page does without it.
  settleHomeLink() {
    if (!this.onHome()) {
      const classic = this.element.querySelector(".classic-link");
      if (classic) classic.remove();
      return;
    }
    const logo = this.element.querySelector(".top-row-logo");
    if (logo) logo.remove();
  }

  // The menu opens where it was left otherwise: a version opened once would
  // still be open the next time, as though the reader had asked for it.
  watchMenu() {
    const menu = this.element.querySelector("#sideMenu");
    if (!menu) return;
    this.onMenuHidden = () => {
      menu.querySelectorAll(".side-submenu.show").forEach((submenu) => {
        bootstrap.Collapse.getOrCreateInstance(submenu, { toggle: false }).hide();
      });
      menu.querySelectorAll(".side-link-parent").forEach((parent) => {
        parent.setAttribute("aria-expanded", "false");
        parent.classList.add("collapsed");
      });
    };
    menu.addEventListener("hidden.bs.offcanvas", this.onMenuHidden);
  }

  // The logo leads home. On the main page there is nowhere to go, so it only
  // shuts the menu.
  goHome(event) {
    const menu = this.element.querySelector("#sideMenu");
    if (menu) bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
    if (this.onHome()) event.preventDefault();
  }

  // A menu entry names the page it leads to. Entries start without an href
  // and marked unavailable, because most of those pages are not rebuilt yet;
  // the ones listed as built become ordinary links.
  // Sign in and Sign up open the same window, titled for the one asked for.
  openAuth(event) {
    const mode = event.currentTarget.dataset.mode === "signup" ? "signUp" : "signIn";
    const container = this.element.querySelector("#authModal");
    const template = this.element.querySelector("#authTemplate");
    if (!container || !template) return;

    window.LQ.disposeWidgets(container);
    // Bootstrap caches the dialog element when the modal is built, so the
    // instance goes before the markup under it is replaced. The guard is the
    // one the other two windows use: disposing an open modal would take the
    // backdrop with it.
    const existing = bootstrap.Modal.getInstance(container);
    if (existing && !container.classList.contains("show")) existing.dispose();
    container.innerHTML = template.innerHTML;
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(container);
    window.LQ.refreshDynamicContent(container);

    // The window carries one form at a time, under its own name, as the
    // reference draws it: a heading, not a pair of tabs.
    const title = container.querySelector("[data-auth-title]");
    const titleKey = mode === "signUp" ? "menuSignUp" : "menuSignIn";
    title.dataset.i18n = titleKey;
    title.textContent = window.LQ.translate(titleKey, mode === "signUp" ? "Sign up" : "Sign in");
    ["signIn", "signUp"].forEach((one) => {
      const pane = container.querySelector(`#${one}Pane`);
      pane.classList.toggle("show", one === mode);
      pane.classList.toggle("active", one === mode);
    });
    // The first field is ready to type into as soon as the window is up.
    container.addEventListener("shown.bs.modal", () => {
      const first = container.querySelector(`#${mode}Pane input`);
      if (first) first.focus();
    }, { once: true });
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
      // A page opened from the main page gets a tab of its own; one opened
      // from inside that tab takes its place, so the reader ends up with one
      // tab for reading rather than one per heading.
      if (this.onHome()) link.setAttribute("target", "_blank");
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
