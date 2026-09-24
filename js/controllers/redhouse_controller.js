// js/controllers/redhouse_controller.js
// The Redhouse entry window.
//
// James Redhouse's lexicon is the one dictionary held whole rather than as
// page images alone, so its entries have a screen of their own: the column it
// was printed in, the English the lexicon itself gives, and the same entry in
// ten further languages. The tabs and the sections are two ways into the same
// list, as in the entry window.
//
// Two things tie the languages together. A word several of them share can be
// pressed to see what each one calls it and to jump there. A word the site
// can look up — the headword, an expression, one of the grammatical forms —
// hands the term to the search bar instead.
//
// It follows the modal rule: an empty container, the markup in a template,
// filled before Bootstrap shows it. The endpoint is documented in
// js/redhouse_sample.js.

class RedhouseController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail || {});
    document.addEventListener("redhouse:open", this.onOpen);
    this.onLanguageChange = () => { if (this.record) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
    // The view switcher asks for one of the main page's six screens; this
    // window is the one it calls Redhouse. A reviewing aid: this listener
    // comes out with the switcher.
    this.onViewState = (event) => this.showViewState(event.detail.state);
    document.addEventListener("view-state:change", this.onViewState);
    this.onResize = () => { this.placeImage(); this.closeEquivalents(); };
    window.addEventListener("resize", this.onResize);
  }

  disconnect() {
    document.removeEventListener("redhouse:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("view-state:change", this.onViewState);
    window.removeEventListener("resize", this.onResize);
    if (this.watcher) this.watcher.disconnect();
    if (this.modal) this.modal.dispose();
  }

  showViewState(state) {
    if (state === "redhouse") { this.open({}); return; }
    if (!this.modal) return;
    if (this.element.classList.contains("show")) { this.modal.hide(); return; }
    this.element.addEventListener("shown.bs.modal", () => this.modal.hide(), { once: true });
  }

  open(request) {
    // Matches the Rails route this window expects:
    //   GET /redhouse_entry/show?word=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { word: request.ottoman },
      // No backend yet: returning false cancels the request and the window is
      // fed sample data instead. Delete beforeSend once the route exists.
      beforeSend: () => { this.receive(window.LQ_REDHOUSE_SAMPLE); return false; },
      success: (response) => this.receive(response),
      error: () => this.receive(window.LQ_REDHOUSE_SAMPLE)
    });
  }

  receive(record) {
    this.record = record;
    this.view = (record.views && record.views[0] && record.views[0].id) || "entry";
    this.zoom = 1;
    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    this.element.addEventListener("shown.bs.modal", () => {
      this.placeImage();
      // The scan is what the entry looks like; the English is what it says,
      // so the window opens on the English with the scan above it.
      const english = (record.languages || [])[0];
      if (english) this.openSection(english.id);
    }, { once: true });
    this.modal.show();
  }

  language() {
    return document.documentElement.lang === "tr" ? "tr" : "en";
  }

  find(selector) { return this.element.querySelector(selector); }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template || !this.record) return;
    window.LQ.disposeWidgets(this.element);
    if (this.watcher) { this.watcher.disconnect(); this.watcher = null; }
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.element.classList.contains("show")) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;
    this.fill();
    this.markShared();
    this.markReadings();
    this.markFallback();
    this.watchSections();
    // The sections are written here rather than in the template, so the
    // sweep comes after them; otherwise their own keys are never seen.
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);
    this.placeImage();
  }

  // ==================== what the window shows ====================

  fill() {
    const record = this.record;
    const language = this.language();
    const safe = window.LQ.escape;

    this.find("[data-redhouse-badge]").textContent = record.badge;
    this.find("[data-redhouse-headword]").textContent = record.headword.ottoman;

    this.find("[data-redhouse-tabs]").innerHTML = `
      <button type="button" class="btn redhouse-tab" data-redhouse-tab="original"
              data-action="click->redhouse#selectTab">
        <i data-feather="file-text" aria-hidden="true"></i>
        <span data-i18n="redhouseImageTab">IMG</span>
      </button>` + (record.languages || []).map((one, index) => `
      <button type="button" class="btn redhouse-tab${index === 0 ? " active" : ""}"
              data-redhouse-tab="${safe(one.id)}" title="${safe(one.name)}"
              data-action="click->redhouse#selectTab">
        <span class="language-flag" data-flag="${safe(one.flag)}" aria-hidden="true"></span>
        ${safe(one.code)}
      </button>`).join("");

    this.find("[data-redhouse-sections]").innerHTML =
      this.scanHtml(language) + (record.languages || []).map((one) => this.languageHtml(one)).join("");
  }

  scanHtml(language) {
    const safe = window.LQ.escape;
    const record = this.record;
    const marks = (record.marks || []).map((mark) => `
      <span class="redhouse-mark redhouse-mark-${safe(mark.k)}" aria-hidden="true"
            data-redhouse-mark="${safe(mark.x)},${safe(mark.y)},${safe(mark.w)},${safe(mark.h)}"></span>`).join("");
    const views = (record.views || []).map((view) => `
      <button type="button" class="btn redhouse-mode${view.id === this.view ? " active" : ""}"
              data-redhouse-mode="${safe(view.id)}" aria-pressed="${view.id === this.view}"
              data-action="click->redhouse#selectView">${safe((view.label || {})[language] || "")}</button>`).join("");
    return `
      <section class="redhouse-section redhouse-scan-section" id="redhouse-original"
               data-redhouse-section="original">
        <h3 class="redhouse-section-head">
          <button type="button" class="btn redhouse-section-toggle" aria-expanded="true"
                  data-action="click->redhouse#toggleSection">
            <i data-feather="file-text" class="redhouse-section-icon" aria-hidden="true"></i>
            <span class="redhouse-section-title" data-i18n="redhouseImage">Original image</span>
            <i data-feather="chevron-down" class="redhouse-chevron" aria-hidden="true"></i>
          </button>
        </h3>
        <div class="redhouse-section-body">
          <div class="redhouse-image-card">
            <div class="redhouse-image-shell">
              <button type="button" class="btn redhouse-step" data-action="click->redhouse#previous"
                      aria-label="Previous image" data-i18n-aria="redhousePrevious">
                <i data-feather="chevron-left" aria-hidden="true"></i>
              </button>
              <div class="redhouse-image-window" data-redhouse-window
                   data-action="wheel->redhouse#wheel">
                <div class="redhouse-image-stage" data-redhouse-stage>
                  <img data-redhouse-image src="" alt="">
                  <span class="redhouse-highlight" data-redhouse-highlight aria-hidden="true"></span>
                  ${marks}
                </div>
              </div>
              <button type="button" class="btn redhouse-step" data-action="click->redhouse#next"
                      aria-label="Next image" data-i18n-aria="redhouseNext">
                <i data-feather="chevron-right" aria-hidden="true"></i>
              </button>
            </div>
            <div class="redhouse-image-bar">
              <div class="redhouse-modes">${views}</div>
              <div class="redhouse-zoom">
                <button type="button" class="btn redhouse-zoom-step" data-redhouse-zoom="-0.15"
                        data-action="click->redhouse#stepZoom"
                        aria-label="Zoom out" data-i18n-aria="redhouseZoomOut">−</button>
                <button type="button" class="btn redhouse-zoom-value" data-redhouse-zoom-value
                        data-action="click->redhouse#resetZoom"
                        title="Reset zoom" data-i18n-title="redhouseZoomReset">100%</button>
                <button type="button" class="btn redhouse-zoom-step" data-redhouse-zoom="0.15"
                        data-action="click->redhouse#stepZoom"
                        aria-label="Zoom in" data-i18n-aria="redhouseZoomIn">+</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <p class="redhouse-notice">
        <i data-feather="alert-circle" aria-hidden="true"></i>
        <span>${safe((record.notice || {})[language] || "")}</span>
      </p>`;
  }

  languageHtml(one) {
    const safe = window.LQ.escape;
    const record = this.record;
    const senses = (one.senses || []).map((sense) =>
      `<li class="redhouse-editable">${safe(sense)}</li>`).join("");
    const expressions = (record.expressions || []).map((pair, index) => {
      const meanings = (one.expressions || [])[index] || [];
      const body = meanings.length === 1
        ? `<p class="redhouse-meaning redhouse-editable">${safe(meanings[0])}</p>`
        : `<ol class="redhouse-subsenses">${meanings.map((text) =>
            `<li class="redhouse-editable">${safe(text)}</li>`).join("")}</ol>`;
      return `
        <div class="redhouse-expression">
          <button type="button" class="btn redhouse-expression-key redhouse-search"
                  data-redhouse-search="${safe(pair.latin)}"
                  data-action="click->redhouse#search">
            <span class="redhouse-expression-ottoman" data-direction="rtl">${safe(pair.ottoman)}</span>
            <span class="redhouse-expression-latin">${safe(pair.latin)}</span>
          </button>
          ${body}
        </div>`;
    }).join("");

    return `
      <section class="redhouse-section" id="redhouse-${safe(one.id)}" data-redhouse-section="${safe(one.id)}">
        <h3 class="redhouse-section-head">
          <button type="button" class="btn redhouse-section-toggle" aria-expanded="true"
                  data-action="click->redhouse#toggleSection">
            <span class="language-flag" data-flag="${safe(one.flag)}" aria-hidden="true"></span>
            <span class="redhouse-section-title">${safe(one.name)}</span>
            <i data-feather="chevron-down" class="redhouse-chevron" aria-hidden="true"></i>
          </button>
        </h3>
        <div class="redhouse-section-body">
          <article class="redhouse-card" data-redhouse-card="${safe(one.id)}"
                   ${one.rtl ? 'data-direction="rtl"' : ""}>
            <button type="button" class="btn redhouse-headword redhouse-search"
                    data-redhouse-search="${safe(record.headword.search)}"
                    data-action="click->redhouse#search">
              <span class="redhouse-headword-ottoman" data-direction="rtl">${safe(record.headword.ottoman)}</span>
              <span class="redhouse-headword-latin">${safe(record.headword.latin)}</span>
            </button>
            <dl class="redhouse-meta">
              <dt>${safe(one.originLabel)}</dt>
              <dd data-redhouse-shared>${safe(one.origin)}</dd>
              <dt>${safe(one.readingLabel)}</dt>
              <dd data-redhouse-reading>${safe(one.reading)}</dd>
            </dl>
            <p class="redhouse-grammar redhouse-editable" data-redhouse-grammar>${safe(one.grammar)}</p>
            <ol class="redhouse-senses" data-redhouse-senses>${senses}</ol>
            <div class="redhouse-expressions" data-redhouse-expressions>${expressions}</div>
            <div class="redhouse-edit-row">
              <button type="button" class="btn redhouse-edit" data-redhouse-start
                      data-action="click->redhouse#startEdit" data-i18n="entryEdit">Edit</button>
              <button type="button" class="btn redhouse-edit redhouse-edit-save" data-redhouse-save hidden
                      data-action="click->redhouse#saveEdit" data-i18n="save">Save</button>
              <button type="button" class="btn redhouse-edit" data-redhouse-cancel hidden
                      data-action="click->redhouse#cancelEdit" data-i18n="cancel">Cancel</button>
            </div>
            <p class="redhouse-source">${safe(record.source)}</p>
            <p class="redhouse-cite">
              <span class="redhouse-cite-label"><span data-i18n="entrySource">Source</span>:</span>
              <button type="button" class="btn redhouse-cite-style" data-redhouse-style="chicago"
                      data-action="click->redhouse#copyCitation">Chicago</button>
              <button type="button" class="btn redhouse-cite-style" data-redhouse-style="harvard"
                      data-action="click->redhouse#copyCitation">Harvard</button>
              <button type="button" class="btn redhouse-cite-style" data-redhouse-style="apa"
                      data-action="click->redhouse#copyCitation">APA</button>
            </p>
          </article>
        </div>
      </section>`;
  }

  // ==================== the sections ====================

  toggleSection(event) {
    const section = event.currentTarget.closest(".redhouse-section");
    const collapsed = section.classList.toggle("is-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  }

  expandAll() { this.setAll(false); }
  collapseAll() { this.setAll(true); }

  setAll(collapsed) {
    this.element.querySelectorAll(".redhouse-section").forEach((section) => {
      section.classList.toggle("is-collapsed", collapsed);
      const toggle = section.querySelector(".redhouse-section-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", String(!collapsed));
    });
    if (!collapsed) this.placeImage();
  }

  selectTab(event) { this.openSection(event.currentTarget.dataset.redhouseTab); }

  openSection(id) {
    const section = this.element.querySelector(`[data-redhouse-section="${CSS.escape(id)}"]`);
    if (!section) return null;
    section.classList.remove("is-collapsed");
    const toggle = section.querySelector(".redhouse-section-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    this.markTab(id);
    this.following = false;
    clearTimeout(this.followTimer);
    this.followTimer = setTimeout(() => { this.following = true; }, 650);
    section.scrollIntoView({ block: "start", behavior: "smooth" });
    if (id === "original") this.placeImage();
    return section;
  }

  markTab(id) {
    this.element.querySelectorAll(".redhouse-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.redhouseTab === id);
    });
  }

  watchSections() {
    const body = this.find("[data-redhouse-body]");
    if (!body || !window.IntersectionObserver) return;
    this.following = true;
    this.watcher = new IntersectionObserver((entries) => {
      if (!this.following) return;
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) this.markTab(visible.target.dataset.redhouseSection);
    }, { root: body, threshold: [0.25, 0.5, 0.75], rootMargin: "-10% 0px -60% 0px" });
    this.element.querySelectorAll(".redhouse-section").forEach((s) => this.watcher.observe(s));
  }

  // ==================== the scan ====================

  currentView() {
    return (this.record.views || []).find((view) => view.id === this.view) || {};
  }

  selectView(event) {
    this.view = event.currentTarget.dataset.redhouseMode;
    this.zoom = 1;
    this.element.querySelectorAll(".redhouse-mode").forEach((button) => {
      const active = button === event.currentTarget;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    this.placeImage();
  }

  stepZoom(event) {
    const by = Number(event.currentTarget.dataset.redhouseZoom);
    this.zoom = Math.min(5, Math.max(0.35, Math.round((this.zoom + by) * 100) / 100));
    this.placeImage(true);
  }

  resetZoom() { this.zoom = 1; this.placeImage(); }

  // Holding a modifier turns the wheel into the zoom, as it does in a viewer;
  // without one the page scrolls as usual.
  wheel(event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    this.zoom = Math.min(5, Math.max(0.35, Math.round((this.zoom + (event.deltaY < 0 ? 0.1 : -0.1)) * 100) / 100));
    this.placeImage(true);
  }

  // The image is sized by hand rather than by CSS: the marks over it are
  // placed in the scan's own pixels, so they only line up if the drawn width
  // is known. Keeping the centre still is what a zoom step should feel like.
  placeImage(keepCentre) {
    const window_ = this.find("[data-redhouse-window]");
    const stage = this.find("[data-redhouse-stage]");
    const image = this.find("[data-redhouse-image]");
    if (!window_ || !stage || !image) return;

    const view = this.currentView();
    const source = view.image || "";
    if (image.getAttribute("src") !== source) {
      image.setAttribute("src", source);
      image.setAttribute("alt", (view.alt || {})[this.language()] || "");
      image.addEventListener("load", () => this.placeImage(), { once: true });
    }
    const value = this.find("[data-redhouse-zoom-value]");
    if (value) value.textContent = `${Math.round(this.zoom * 100)}%`;
    if (!image.naturalWidth) return;

    const wasWidth = image.clientWidth || 1;
    const middleX = window_.scrollLeft + window_.clientWidth / 2;
    const middleY = window_.scrollTop + window_.clientHeight / 2;

    const base = this.view === "entry"
      ? Math.min(1, (window_.clientWidth - 16) / image.naturalWidth)
      : Math.min((window_.clientWidth - 34) / image.naturalWidth,
                 (window_.clientHeight - 34) / image.naturalHeight);
    const width = Math.round(image.naturalWidth * base * this.zoom);
    const height = Math.round(image.naturalHeight * base * this.zoom);
    image.style.width = `${width}px`;
    stage.style.width = `${Math.max(window_.clientWidth, width)}px`;
    stage.style.height = `${Math.max(window_.clientHeight, height)}px`;

    this.placeMarks(image, width / image.naturalWidth);

    if (keepCentre) {
      const ratio = width / wasWidth;
      window_.scrollLeft = middleX * ratio - window_.clientWidth / 2;
      window_.scrollTop = middleY * ratio - window_.clientHeight / 2;
    } else if (this.view === "entry") {
      // The entry starts a little way down its column, so the window opens
      // on it rather than on the column's first line.
      window_.scrollTop = Math.max(0, Math.round(78 * (width / image.naturalWidth)) - 24);
      window_.scrollLeft = Math.max(0, (width - window_.clientWidth) / 2);
    } else {
      window_.scrollTop = 0;
      window_.scrollLeft = 0;
    }
  }

  // The whole page is too far out for the marks to mean anything, so they are
  // only drawn on the views that show the column.
  placeMarks(image, scale) {
    const shown = this.view !== "page";
    const place = (element, x, y, w, h) => {
      element.hidden = !shown;
      if (!shown) return;
      element.style.left = `${image.offsetLeft + x * scale}px`;
      element.style.top = `${image.offsetTop + y * scale}px`;
      element.style.width = `${w * scale}px`;
      element.style.height = `${h * scale}px`;
    };
    const highlight = this.find("[data-redhouse-highlight]");
    const spot = this.record.highlight || {};
    if (highlight) place(highlight, spot.x, spot.y, spot.w, spot.h);
    this.element.querySelectorAll("[data-redhouse-mark]").forEach((mark) => {
      const [x, y, w, h] = mark.dataset.redhouseMark.split(",").map(Number);
      place(mark, x, y, w, h);
    });
  }

  previous() { this.step(-1); }
  next() { this.step(1); }

  step() {
    // One entry of the sample, so there is nowhere to step to yet; the
    // endpoint will return the neighbouring columns with the record.
    this.say(window.LQ.translate("redhouseNoNeighbour",
      "The neighbouring image is not in the sample data."));
  }

  // ==================== the words the languages share ====================

  // A word several languages use for the same thing is wrapped wherever each
  // of them says it, so pressing it can show the rest. The backend will send
  // the alignment; the sample carries the words that were aligned by hand.
  markShared() {
    (this.record.concepts || []).forEach((concept) => {
      (this.record.languages || []).forEach((one) => {
        const card = this.element.querySelector(`[data-redhouse-card="${CSS.escape(one.id)}"]`);
        const term = (concept.values || {})[one.id];
        if (card && term) this.wrapTerm(card, term, concept.key, one.id);
      });
    });
  }

  // ==================== the forms that lead back to the search ====================

  // Beside the reading and in the grammar, every Ottoman form is a way into
  // the search, as it is in the reference. The forms are written the same way
  // in every language -- the Ottoman word, then its Latin reading in brackets
  // or after a slash -- so they are read out of the text rather than listed
  // in the sample.
  markReadings() {
    this.element.querySelectorAll("[data-redhouse-reading]")
      .forEach((root) => this.markForms(root, true));
    this.element.querySelectorAll("[data-redhouse-grammar]")
      .forEach((root) => this.markForms(root, false));
  }

  markForms(root, leading) {
    const OTTOMAN = "[\\u0600-\\u06FF\\u200c]+";
    const LATIN = "[A-Za-z\\u00C0-\\u024F\\u2018\\u2019'\\u02BF\\-]+";
    const pairs = new RegExp(`(${OTTOMAN})\\s*(?:\\(\\s*(${LATIN})\\s*\\)|/\\s*(${LATIN}))`, "g");
    const first = new RegExp(`^(${LATIN})`);

    const texts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest(".redhouse-search")) texts.push(node);
    }

    texts.forEach((text, index) => {
      const value = text.nodeValue;
      const fragment = document.createDocumentFragment();
      let at = 0;
      let match;

      // The Latin reading the line opens with is a form of its own.
      if (leading && index === 0) {
        const head = value.match(first);
        if (head) { fragment.appendChild(this.formSpan(head[1], head[1])); at = head[1].length; }
      }

      pairs.lastIndex = at;
      while ((match = pairs.exec(value))) {
        const latin = match[2] || match[3];
        if (match.index > at) fragment.appendChild(document.createTextNode(value.slice(at, match.index)));
        fragment.appendChild(this.formSpan(`${match[1]} / ${latin}`, latin));
        at = match.index + match[0].length;
      }

      if (!fragment.childNodes.length) return;
      if (at < value.length) fragment.appendChild(document.createTextNode(value.slice(at)));
      text.parentNode.replaceChild(fragment, text);
    });
  }

  formSpan(shown, term) {
    const span = document.createElement("span");
    span.className = "redhouse-search redhouse-search-inline";
    span.dataset.redhouseSearch = term;
    span.dataset.action = "click->redhouse#search";
    span.textContent = shown;
    return span;
  }

  wrapTerm(card, term, concept, language) {
    const roots = card.querySelectorAll(
      "[data-redhouse-shared], [data-redhouse-grammar], .redhouse-senses li, .redhouse-meaning, .redhouse-subsenses li");
    roots.forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const found = [];
      let node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement.closest(".redhouse-link") && node.nodeValue.includes(term)) found.push(node);
      }
      found.forEach((text) => {
        const parts = text.nodeValue.split(term);
        const fragment = document.createDocumentFragment();
        parts.forEach((part, index) => {
          if (part) fragment.appendChild(document.createTextNode(part));
          if (index < parts.length - 1) {
            const link = document.createElement("span");
            link.className = "redhouse-link";
            link.dataset.redhouseConcept = concept;
            link.dataset.redhouseLanguage = language;
            link.textContent = term;
            fragment.appendChild(link);
          }
        });
        text.parentNode.replaceChild(fragment, text);
      });
    });
  }

  // ==================== the words the alignment has not reached ====================

  // Beyond the words that were aligned by hand, every other word is still a
  // way across: the cards say the same things in the same order, so the word
  // in one card's line answers the word in the same place in another's. The
  // backend's alignment will replace this; until it does the reader can look
  // anywhere rather than only at the handful of words that were matched.
  markFallback() {
    (this.record.languages || []).forEach((one) => {
      const card = this.element.querySelector(`[data-redhouse-card="${CSS.escape(one.id)}"]`);
      if (!card) return;
      this.slotsOf(card).forEach(([slot, root]) => this.wrapWords(root, slot, one.id));
    });
  }

  // The lines of a card, named so the same line can be found in every card
  slotsOf(card) {
    const slots = [];
    const named = { "[data-redhouse-shared]": "meta-0", "[data-redhouse-reading]": "meta-1",
      "[data-redhouse-grammar]": "grammar" };
    Object.keys(named).forEach((selector) => {
      const one = card.querySelector(selector);
      if (one) slots.push([named[selector], one]);
    });
    card.querySelectorAll("[data-redhouse-senses] > li").forEach((one, index) => {
      slots.push([`def-${index}`, one]);
    });
    card.querySelectorAll("[data-redhouse-expressions] .redhouse-expression")
      .forEach((block, outer) => {
        block.querySelectorAll(".redhouse-meaning, .redhouse-subsenses li")
          .forEach((one, inner) => slots.push([`exp-${outer}-${inner}`, one]));
      });
    return slots;
  }

  wrapWords(root, slot, language) {
    const WORD = /[\p{L}\p{M}\u2018\u2019'\u02BF]+/gu;
    const texts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest(".redhouse-link, .redhouse-search")) texts.push(node);
    }

    let index = 0;
    texts.forEach((text) => {
      const value = text.nodeValue;
      const fragment = document.createDocumentFragment();
      let at = 0;
      let match;
      WORD.lastIndex = 0;
      while ((match = WORD.exec(value))) {
        if (match.index > at) fragment.appendChild(document.createTextNode(value.slice(at, match.index)));
        const link = document.createElement("span");
        link.className = "redhouse-link";
        link.dataset.redhouseSlot = slot;
        link.dataset.redhouseIndex = String(index);
        link.dataset.redhouseLanguage = language;
        link.textContent = match[0];
        fragment.appendChild(link);
        index += 1;
        at = match.index + match[0].length;
      }
      if (!fragment.childNodes.length) return;
      if (at < value.length) fragment.appendChild(document.createTextNode(value.slice(at)));
      text.parentNode.replaceChild(fragment, text);
    });
  }

  bodyClick(event) {
    const link = event.target.closest(".redhouse-link");
    if (link && !link.closest(".is-editing")) {
      event.stopPropagation();
      this.openEquivalents(link);
      return;
    }
    const row = event.target.closest("[data-redhouse-row]");
    if (row) {
      event.stopPropagation();
      this.followRow(row.dataset.redhouseRowLanguage, row.dataset.redhouseRowConcept,
        row.dataset.redhouseRowSlot, row.dataset.redhouseRowIndex);
      return;
    }
    this.closeEquivalents();
  }

  openEquivalents(link) {
    const rows = link.dataset.redhouseConcept ? this.conceptRows(link) : this.slotRows(link);
    if (!rows) return;
    const safe = window.LQ.escape;
    const here = link.dataset.redhouseLanguage;
    this.element.querySelectorAll(".redhouse-link").forEach((one) => one.classList.remove("is-open"));
    link.classList.add("is-open");
    this.find("[data-redhouse-equivalents-rows]").innerHTML = rows.map((row) => `
      <button type="button" class="btn redhouse-equivalent${row.id === here ? " is-current" : ""}"
              data-redhouse-row data-redhouse-row-language="${safe(row.id)}"
              data-redhouse-row-concept="${safe(row.concept)}"
              data-redhouse-row-slot="${safe(row.slot)}"
              data-redhouse-row-index="${safe(row.index)}">
        <span class="language-flag" data-flag="${safe(row.flag)}" aria-hidden="true"></span>
        <span class="redhouse-equivalent-language">${safe(row.name)}</span>
        <span class="redhouse-equivalent-value"${row.rtl ? ' data-direction="rtl"' : ""}>${safe(row.value)}</span>
      </button>`).join("");

    const panel = this.find("[data-redhouse-equivalents]");
    panel.hidden = false;
    const spot = link.getBoundingClientRect();
    const width = Math.min(390, window.innerWidth - 24);
    const height = Math.min(panel.offsetHeight, window.innerHeight - 24);
    panel.style.left = `${Math.max(12, Math.min(spot.left, window.innerWidth - width - 12))}px`;
    panel.style.top = spot.bottom + height + 12 < window.innerHeight
      ? `${spot.bottom + 8}px`
      : `${Math.max(12, spot.top - height - 8)}px`;
    window.LQ.refreshDynamicContent(panel);
  }

  // A word that was aligned by hand: every language's own word for it
  conceptRows(link) {
    const concept = (this.record.concepts || []).find((one) => one.key === link.dataset.redhouseConcept);
    if (!concept) return null;
    return (this.record.languages || []).map((one) => ({
      id: one.id, name: one.name, flag: one.flag, rtl: one.rtl,
      value: (concept.values || {})[one.id] || "", concept: concept.key, slot: "", index: ""
    }));
  }

  // A word that was not: the word standing in the same place in each card
  slotRows(link) {
    const slot = link.dataset.redhouseSlot;
    const index = link.dataset.redhouseIndex;
    if (!slot) return null;
    return (this.record.languages || []).map((one) => {
      const word = this.element.querySelector(
        `[data-redhouse-card="${CSS.escape(one.id)}"] ` +
        `[data-redhouse-slot="${CSS.escape(slot)}"][data-redhouse-index="${CSS.escape(index)}"]`);
      return {
        id: one.id, name: one.name, flag: one.flag, rtl: one.rtl,
        value: word ? word.textContent : "", concept: "", slot, index
      };
    });
  }

  closeEquivalents() {
    const panel = this.find("[data-redhouse-equivalents]");
    if (panel) panel.hidden = true;
    this.element.querySelectorAll(".redhouse-link").forEach((one) => one.classList.remove("is-open"));
  }

  followRow(language, concept, slot, index) {
    this.closeEquivalents();
    const section = this.openSection(language);
    if (!section) return;
    const target = slot
      ? section.querySelector(
        `[data-redhouse-slot="${CSS.escape(slot)}"][data-redhouse-index="${CSS.escape(index)}"]`)
      : section.querySelector(`[data-redhouse-concept="${CSS.escape(concept)}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("is-found");
    setTimeout(() => target.classList.remove("is-found"), 1500);
  }

  // ==================== handing a word to the search ====================

  search(event) {
    const term = event.currentTarget.dataset.redhouseSearch;
    this.element.addEventListener("hidden.bs.modal", () => {
      document.dispatchEvent(new CustomEvent("search:run", { detail: { term, script: "latin" } }));
    }, { once: true });
    this.modal.hide();
  }

  // ==================== proposing a correction ====================

  startEdit(event) {
    const card = event.currentTarget.closest(".redhouse-card");
    this.before = this.before || {};
    this.before[card.dataset.redhouseCard] = card.innerHTML;
    card.classList.add("is-editing");
    card.querySelectorAll(".redhouse-editable").forEach((one) => { one.contentEditable = "true"; });
    this.showEditButtons(card, true);
  }

  saveEdit(event) {
    const card = event.currentTarget.closest(".redhouse-card");
    this.finishEdit(card);
    // Matches the Rails route the correction is sent to:
    //   POST /redhouse_entry/correction
    $.ajax({
      url: "/redhouse_entry/correction",
      type: "POST",
      data: { language: card.dataset.redhouseCard, corrected: card.innerHTML },
      beforeSend: () => { this.say(window.LQ.translate("redhouseSaved", "Change recorded")); return false; },
      success: () => this.say(window.LQ.translate("redhouseSaved", "Change recorded"))
    });
  }

  cancelEdit(event) {
    const card = event.currentTarget.closest(".redhouse-card");
    const was = (this.before || {})[card.dataset.redhouseCard];
    if (was != null) card.innerHTML = was;
    this.finishEdit(card);
    window.LQ.refreshDynamicContent(card);
  }

  finishEdit(card) {
    card.classList.remove("is-editing");
    card.querySelectorAll(".redhouse-editable").forEach((one) => { one.contentEditable = "false"; });
    this.showEditButtons(card, false);
  }

  showEditButtons(card, editing) {
    card.querySelector("[data-redhouse-start]").hidden = editing;
    card.querySelector("[data-redhouse-save]").hidden = !editing;
    card.querySelector("[data-redhouse-cancel]").hidden = !editing;
  }

  // ==================== the citation ====================

  copyCitation(event) {
    const style = event.currentTarget.dataset.redhouseStyle;
    const text = (this.record.citations || {})[style] || "";
    const done = () => this.say(window.LQ.translate("redhouseCopied", "Copied"));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  }

  // One line at the foot of the window for anything that has just happened.
  say(text) {
    const note = this.find("[data-redhouse-toast]");
    if (!note) return;
    note.textContent = text;
    note.hidden = false;
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => { note.hidden = true; }, 1800);
  }
}

application.register("redhouse", RedhouseController);
