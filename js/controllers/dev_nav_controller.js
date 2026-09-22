// js/controllers/dev_nav_controller.js
// The development navigator in the bottom left corner.
//
// The mock is separate pages, and several of the main page's states are only
// reached by searching. This panel opens any of them directly, so the work
// can be reviewed without retracing the steps that lead to each one.
//
// It is a reviewing aid, not part of the interface: the element, this
// controller, js/dev_pages.js and css/dev-nav.css come out at integration
// and nothing else refers to them.

const OPEN_KEY = "lq-dev-nav-open";
// On a narrow screen the open list would cover the page, so it starts closed
// there. The width matches the stylesheet's own breakpoint.
const NARROW = "(max-width: 767px)";

class DevNavController extends Stimulus.Controller {
  connect() {
    this.render();
    // Whether the panel is open is remembered, so it does not have to be
    // reopened on every page.
    this.onLanguageChange = () => this.render();
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
  }

  render() {
    const groups = window.LQ_DEV_PAGES || [];
    const here = this.current();
    const label = window.LQ.translate("devNavigator", "Pages");

    this.element.innerHTML = `
      <button type="button" class="btn dev-nav-toggle" data-action="click->dev-nav#toggle"
              aria-expanded="${this.isOpen()}" aria-controls="devNavList">
        <i data-feather="layers" aria-hidden="true"></i>
        <span>${window.LQ.escape(label)}</span>
        <i data-feather="chevron-up" aria-hidden="true"></i>
      </button>
      <div class="dev-nav-list" id="devNavList"${this.isOpen() ? "" : " hidden"}>
        ${groups.map((group) => this.groupHtml(group, here)).join("")}
      </div>`;
    window.LQ.refreshDynamicContent(this.element);
  }

  groupHtml(group, here) {
    const title = window.LQ.translate(group.group, group.groupFallback);
    const entries = group.entries.map((entry) => {
      const current = entry.href === here;
      const text = window.LQ.translate(entry.key, entry.label);
      return `<a class="dev-nav-link${current ? " is-current" : ""}"
                 href="${window.LQ.escape(entry.href)}"
                 ${current ? 'aria-current="page"' : ""}>${window.LQ.escape(text)}</a>`;
    }).join("");
    return `<p class="dev-nav-group">${window.LQ.escape(title)}</p>${entries}`;
  }

  // The page being read, in the same shape as the hrefs above, so the entry
  // for it can be marked.
  current() {
    const file = window.location.pathname.split("/").pop() || "home.html";
    const state = new URLSearchParams(window.location.search).get("state");
    return state ? `${file}?state=${state}` : file;
  }

  toggle() {
    const open = !this.isOpen();
    this.remember(open);
    this.render();
  }

  isOpen() {
    const byDefault = !window.matchMedia(NARROW).matches;
    try {
      const stored = window.localStorage.getItem(OPEN_KEY);
      if (stored === "open") return true;
      if (stored === "closed") return false;
      return byDefault;
    } catch (error) {
      return byDefault;
    }
  }

  remember(open) {
    try {
      window.localStorage.setItem(OPEN_KEY, open ? "open" : "closed");
    } catch (error) {
      // The panel then opens fresh on the next page, which is harmless
    }
  }
}

application.register("dev-nav", DevNavController);
