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

// An address at a university in Türkiye or the TRNC, the ones the EKUAL
// agreement covers: anything ending in .edu.tr after the @.
const UNIVERSITY_ADDRESS = /@([a-z0-9-]+\.)*edu\.tr$/i;

// The shape of an email address: something, an @, and a domain with a dot.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

// The mail providers people mistype most. A domain a letter or two away
// from one of these is taken for a slip and offered back corrected.
const COMMON_MAIL_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
  "yandex.com", "live.com", "hotmail.com.tr", "outlook.com.tr", "yandex.com.tr"
];
// Real domains that sit close to one of those, and so are never "corrected".
const OTHER_MAIL_DOMAINS = [
  "mail.com", "ymail.com", "gmx.com", "gmx.de", "gmx.net", "me.com", "mac.com",
  "aol.com", "msn.com", "proton.me", "protonmail.com", "yandex.ru", "mail.ru",
  "email.com", "ttmail.com"
];
// The usual slips at the end of a university address.
const UNIVERSITY_SLIPS = [[/edutr$/i, "edu.tr"], [/edu\.rt$/i, "edu.tr"], [/\.edu\.t$/i, ".edu.tr"],
  [/\.edu\.trr$/i, ".edu.tr"], [/\.eud\.tr$/i, ".edu.tr"], [/\.ude\.tr$/i, ".edu.tr"]];

// How many single-letter changes turn one word into the other.
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const kept = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = kept;
    }
  }
  return row[b.length];
}

// The address as it was probably meant, or null when it looks right.
function correctedAddress(address) {
  const at = address.lastIndexOf("@");
  if (at < 1) return null;
  const local = address.slice(0, at);
  const domain = address.slice(at + 1).toLowerCase();
  for (const [slip, fix] of UNIVERSITY_SLIPS) {
    if (slip.test(domain)) return `${local}@${domain.replace(slip, fix)}`;
  }
  if (COMMON_MAIL_DOMAINS.includes(domain) || OTHER_MAIL_DOMAINS.includes(domain)) return null;
  if (domain.length < 5 || UNIVERSITY_ADDRESS.test(address)) return null;
  let best = null;
  let bestDistance = 3;
  COMMON_MAIL_DOMAINS.forEach((known) => {
    const distance = editDistance(domain, known);
    if (distance > 0 && distance < bestDistance) { best = known; bestDistance = distance; }
  });
  return best ? `${local}@${best}` : null;
}

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
  // there for the pages that do not.
  settleHomeLink() {
    if (!this.onHome()) return;
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

  // The sign-up form, beyond what the markup does on its own.
  //
  // A university address is what makes the account free, so the line under
  // the field says so the moment one is typed, and a second field opens for
  // a personal address: some university mail servers hold back the
  // confirmation email, so a link goes to that address too. It is asked for
  // only then; anyone else is already giving their own address.
  //
  // Each address is checked for its shape and for the usual slips before
  // the form can go on, and then shown back large to be read once more:
  // a mistyped address is one the link never reaches. Until the backend
  // answers, the steps after that are all the form does.
  wireSignUp(container) {
    const form = container.querySelector("#signUpPane form");
    const email = container.querySelector("#signUpEmail");
    const hint = container.querySelector("#signUpEmailHint");
    const personalField = container.querySelector("#signUpPersonalField");
    const personal = container.querySelector("#signUpPersonal");
    if (!form || !email || !personal) return;

    const isUniversity = (address) => UNIVERSITY_ADDRESS.test(address.trim());
    const field = (input) => input.closest(".auth-field");
    const showError = (input, kind) => {
      const error = field(input).querySelector(".auth-error");
      error.hidden = !kind;
      error.querySelectorAll("[data-auth-error]").forEach((line) => { line.hidden = line.dataset.authError !== kind; });
      input.setAttribute("aria-invalid", String(Boolean(kind)));
    };
    const showSuggestion = (input, suggestion) => {
      const box = field(input).querySelector(".auth-suggest");
      box.hidden = !suggestion;
      box.querySelector("[data-auth-suggest-fix]").textContent = suggestion || "";
      if (suggestion) input.setAttribute("aria-invalid", "true");
    };
    const settleUniversity = () => {
      const university = isUniversity(email.value);
      hint.classList.toggle("is-edu", university);
      personalField.hidden = !university;
      personal.required = university;
      if (!university) { showError(personal, null); showSuggestion(personal, null); }
    };
    // An address that is not right yet: what is wrong is said under it.
    const problem = (input) => {
      const address = input.value.trim();
      if (!address) return input === personal ? "missing" : "format";
      if (!EMAIL_SHAPE.test(address)) return "format";
      if (correctedAddress(address)) return "slip";
      if (input === personal && isUniversity(address)) return "university";
      return null;
    };
    const report = (input) => {
      const kind = problem(input);
      showError(input, kind === "slip" ? null : kind);
      showSuggestion(input, kind === "slip" ? correctedAddress(input.value.trim()) : null);
      return !kind;
    };

    [email, personal].forEach((input) => {
      input.addEventListener("input", () => {
        showError(input, null);
        showSuggestion(input, null);
        if (input === email) settleUniversity();
      });
      // Said as soon as the reader leaves the field, not only on sending.
      input.addEventListener("blur", () => { if (input.value.trim()) report(input); });
      field(input).querySelector("[data-auth-suggest-fix]").addEventListener("click", (event) => {
        input.value = event.currentTarget.textContent;
        showSuggestion(input, null);
        showError(input, null);
        if (input === email) settleUniversity();
        input.focus();
      });
    });

    form.addEventListener("submit", () => {
      const emailOk = report(email);
      const university = emailOk && isUniversity(email.value);
      const personalOk = !university || report(personal);
      if (!emailOk) { email.focus(); return; }
      if (!personalOk) { personal.focus(); return; }
      this.confirmAddresses(container, email.value.trim(), university ? personal.value.trim() : "");
    });
  }

  // The addresses, large, before the account is made.
  confirmAddresses(container, address, personalAddress) {
    const two = Boolean(personalAddress);
    container.querySelector("[data-auth-confirm-main]").textContent = address;
    container.querySelector("[data-auth-confirm-personal]").textContent = personalAddress;
    container.querySelector("[data-auth-confirm-second]").hidden = !two;
    container.querySelector("[data-auth-confirm-label]").hidden = !two;
    this.showAuthPane(container, "signUpConfirmPane",
      two ? "authConfirmTitleTwo" : "authConfirmTitleOne",
      two ? "Check your email addresses" : "Check your email address");
    container.querySelector("[data-auth-confirm-yes]").onclick = () => this.showSent(container, address, personalAddress);
    container.querySelector("[data-auth-confirm-fix]").onclick = () => {
      this.showAuthPane(container, "signUpPane", "menuSignUp", "Sign up");
      container.querySelector("#signUpEmail").focus();
    };
  }

  // Where the confirmation links went, in place of the form.
  showSent(container, address, personalAddress) {
    const two = Boolean(personalAddress);
    container.querySelector("[data-auth-sent-to]").textContent = address;
    container.querySelector("[data-auth-sent-main]").textContent = address;
    container.querySelector("[data-auth-sent-personal]").textContent = personalAddress;
    container.querySelector("[data-auth-lead-one]").hidden = two;
    container.querySelector("[data-auth-lead-two]").hidden = !two;
    container.querySelector("[data-auth-open-one]").hidden = two;
    container.querySelector("[data-auth-open-two]").hidden = !two;
    this.showAuthPane(container, "signUpSentPane", "authSentTitle", "Check your inbox");
  }

  // One pane of the account window at a time, under its own title.
  showAuthPane(container, id, titleKey, fallback) {
    const title = container.querySelector("[data-auth-title]");
    title.dataset.i18n = titleKey;
    title.textContent = window.LQ.translate(titleKey, fallback);
    container.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.toggle("show", pane.id === id);
      pane.classList.toggle("active", pane.id === id);
    });
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
    this.wireSignUp(container);

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
