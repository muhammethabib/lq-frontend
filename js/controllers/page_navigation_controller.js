// js/controllers/page_navigation_controller.js
// What every content page does with its own links, images and length.
//
// Four things, none of which belongs to any one page:
//
//   - a link to another part of the same page marks where it lands and
//     offers the way back for five seconds, because a reader who follows a
//     cross-reference nearly always wants to return to what they were
//     reading;
//   - a link to another page opens beside this one rather than taking the
//     reader's place;
//   - an image opens at its own size when pressed;
//   - a page long enough to lose the top of offers the way back to it.
//
// A page opts in with the controller on its surface:
//   <div data-controller="language page-navigation">

// How long the way back stays on offer after a jump.
const WAY_BACK_SECONDS = 5;

class PageNavigationController extends Stimulus.Controller {
  connect() {
    this.onClick = (event) => this.handleClick(event);
    this.element.addEventListener("click", this.onClick);

    // Anything the reader does next means they have moved on.
    this.onMoveOn = (event) => {
      if (event.target.closest && event.target.closest(".way-back")) return;
      this.dropWayBack();
    };
    ["mousedown", "wheel", "touchstart"].forEach((kind) => {
      document.addEventListener(kind, this.onMoveOn, { passive: true, capture: true });
    });
    this.onEscape = (event) => { if (event.key === "Escape") { this.goBack(); this.closeViewer(); } };
    document.addEventListener("keydown", this.onEscape);

    this.markOutwardLinks();
    this.buildBackToTop();
    this.buildViewer();
    // The links are rewritten whenever the page is: a language change
    // replaces the text around them.
    this.onLanguageChange = () => this.markOutwardLinks();
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    this.element.removeEventListener("click", this.onClick);
    ["mousedown", "wheel", "touchstart"].forEach((kind) => {
      document.removeEventListener(kind, this.onMoveOn, { capture: true });
    });
    document.removeEventListener("keydown", this.onEscape);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.onScroll) window.removeEventListener("scroll", this.onScroll);
    this.dropWayBack();
  }

  handleClick(event) {
    const image = event.target.closest(".page-content img, .article-body img, .guide-body img");
    if (image) { this.openViewer(image); return; }

    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // A contents list is a way of reading the page rather than a
    // cross-reference, so it does not offer the way back to itself.
    this.jumpTo(target, !link.closest(".page-toc, .toc, .guide-toc, .article-toc"));
  }

  // ==================== following a cross-reference ====================

  jumpTo(target, offerWayBack) {
    const from = window.scrollY;
    this.dropWayBack();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${target.id}`);

    // The heading, not the whole section: a section-wide flash is a flash of
    // the screen, and the reader is looking for one line.
    const head = target.matches("h1, h2, h3, h4") ? target
      : (target.querySelector("h1, h2, h3, h4") || target);
    // Only the latest landing is marked: two lit headings would be two
    // answers to one question.
    document.querySelectorAll(".is-landed").forEach((one) => one.classList.remove("is-landed"));
    void head.offsetWidth;
    head.classList.add("is-landed");
    clearTimeout(this.landedTimer);
    this.landedTimer = setTimeout(() => head.classList.remove("is-landed"), 2400);

    if (offerWayBack) this.offerWayBack(head, from);
  }

  offerWayBack(head, from) {
    this.from = from;
    this.host = head;
    head.classList.add("way-back-host");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "way-back";
    button.innerHTML = `<i data-feather="corner-up-left" aria-hidden="true"></i>
      <span>${window.LQ.escape(window.LQ.translate("wayBack", "Back"))}</span>`;
    button.addEventListener("click", () => this.goBack());
    head.appendChild(button);
    window.LQ.refreshDynamicContent(button);
    this.wayBack = button;
    requestAnimationFrame(() => button.classList.add("is-shown"));
    // It is an offer, not a state: after five seconds the reader has clearly
    // stayed where they landed.
    clearTimeout(this.wayBackTimer);
    this.wayBackTimer = setTimeout(() => this.dropWayBack(), WAY_BACK_SECONDS * 1000);
  }

  goBack() {
    if (this.from == null) return;
    window.scrollTo({ top: this.from, behavior: "smooth" });
    this.dropWayBack();
  }

  dropWayBack() {
    clearTimeout(this.wayBackTimer);
    this.from = null;
    if (this.wayBack) { this.wayBack.remove(); this.wayBack = null; }
    if (this.host) { this.host.classList.remove("way-back-host"); this.host = null; }
  }

  // ==================== links that leave the page ====================

  // A cross-page link opens beside what the reader is reading rather than
  // taking its place, so a reference costs them nothing to follow.
  markOutwardLinks() {
    this.element.querySelectorAll(".page-content a[href], .article-body a[href], .guide-body a[href]")
      .forEach((link) => {
        const href = link.getAttribute("href") || "";
        if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        if (link.hasAttribute("target")) return;
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
      });
  }

  // ==================== the way back to the top ====================

  // Only on a page long enough to have lost the top: on a short one the
  // button would be an answer to a question nobody asked. A page can become
  // long after it loads — a search fills the main page with results — so the
  // length is checked as the reader scrolls rather than once on arrival.
  buildBackToTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
    const label = window.LQ.translate("backToTop", "Back to top");
    button.setAttribute("aria-label", label);
    button.innerHTML = `<i data-feather="arrow-up" aria-hidden="true"></i>
      <span>${window.LQ.escape(label)}</span>`;
    button.addEventListener("click", () => {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    });
    document.body.appendChild(button);
    this.backToTop = button;

    let shown = false;
    let waiting = false;
    const update = () => {
      waiting = false;
      // One screen past the top, as the reference has it: by then the way
      // back is out of reach and worth offering.
      const wanted = window.scrollY > window.innerHeight;
      if (wanted === shown) return;
      shown = wanted;
      button.classList.toggle("is-shown", shown);
      button.setAttribute("aria-hidden", String(!shown));
      button.tabIndex = shown ? 0 : -1;
    };
    this.onScroll = () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", this.onScroll, { passive: true });
    update();
  }

  // ==================== an image at its own size ====================

  buildViewer() {
    const viewer = document.createElement("div");
    viewer.className = "image-viewer";
    viewer.hidden = true;
    viewer.addEventListener("click", () => this.closeViewer());
    document.body.appendChild(viewer);
    this.viewer = viewer;
  }

  openViewer(image) {
    if (!this.viewer) return;
    const large = document.createElement("img");
    large.src = image.currentSrc || image.src;
    large.alt = image.alt || "";
    this.viewer.innerHTML = "";
    this.viewer.appendChild(large);
    this.viewer.hidden = false;
  }

  closeViewer() {
    if (!this.viewer) return;
    this.viewer.hidden = true;
    this.viewer.innerHTML = "";
  }
}

application.register("page-navigation", PageNavigationController);
