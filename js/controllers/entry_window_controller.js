// js/controllers/entry_window_controller.js
// The dictionary entry window.
//
// This is the screen a result row opens: the entry as the press printed it,
// and beside it what the entry says in every language the team has recorded.
// The language tabs and the panels below them are two ways into the same
// list, so pressing a tab opens that panel and takes the reader to it, and
// scrolling the panels moves the tab.
//
// Three things connect the panels back to the page the entry came from:
// a word marked on the scan shows what it reads as, a word inside a panel
// shows the piece of the scan it was read from, and a word several panels
// share opens the list of what each one calls it.
//
// A row announces "entry:open" with the record it stands for and this window
// answers, the same way the citation window is opened. It follows the modal
// rule: an empty container, the markup in a template, filled before Bootstrap
// shows it.
//
// The endpoint it will call is documented in js/entry_sample.js.

class EntryWindowController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail || {});
    document.addEventListener("entry:open", this.onOpen);
    this.onLanguageChange = () => { if (this.record) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
    // The view switcher asks for one of the main page's six screens; this
    // window is the one it calls Popup. A reviewing aid: this listener comes
    // out with the switcher.
    this.onViewState = (event) => this.showViewState(event.detail.state);
    document.addEventListener("view-state:change", this.onViewState);
    // The hover cards sit outside the scrolling panels, so a scroll or a
    // resize puts them somewhere they no longer belong.
    this.onAway = () => this.hideCards();
    window.addEventListener("resize", this.onAway);
    // The list behind this window points out again the row it was opened
    // from, so it is told when the window has gone.
    this.onHidden = () => document.dispatchEvent(new CustomEvent("entry:closed"));
    this.element.addEventListener("hidden.bs.modal", this.onHidden);
  }

  disconnect() {
    document.removeEventListener("entry:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("view-state:change", this.onViewState);
    window.removeEventListener("resize", this.onAway);
    this.element.removeEventListener("hidden.bs.modal", this.onHidden);
    if (this.watcher) this.watcher.disconnect();
    if (this.modal) this.modal.dispose();
  }

  showViewState(state) {
    if (state === "popup") { this.open({ focus: "headword" }); return; }
    // Switching to any other screen leaves this one, mid-opening or not.
    if (!this.modal) return;
    if (this.element.classList.contains("show")) { this.modal.hide(); return; }
    this.element.addEventListener("shown.bs.modal", () => this.modal.hide(), { once: true });
  }

  open(request) {
    this.focusOn = request.focus || "headword";
    // Matches the Rails route this window expects:
    //   GET /dictionary_entry/show?dictionary=…&page=…&word=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { dictionary: request.dictionary, page: request.page, word: request.ottoman },
      // No backend yet: returning false cancels the request and the window is
      // fed sample data instead. Delete beforeSend once the route exists.
      beforeSend: () => { this.receive(window.LQ_ENTRY_SAMPLE); return false; },
      success: (response) => this.receive(response),
      error: () => this.receive(window.LQ_ENTRY_SAMPLE)
    });
  }

  receive(record) {
    this.record = record;
    this.view = (record.views && record.views[0] && record.views[0].id) || "slice";
    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    this.element.addEventListener("shown.bs.modal", () => {
      this.focus();
      this.placeIndicator();
    }, { once: true });
    this.modal.show();
  }

  language() {
    return document.documentElement.lang === "tr" ? "tr" : "en";
  }

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
    this.markConcepts();
    this.watchSections();
    // The panels are written here rather than in the template, so the sweep
    // comes after them; otherwise their own keys are never seen.
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);
  }

  find(selector) { return this.element.querySelector(selector); }

  // ==================== what the window shows ====================

  fill() {
    const record = this.record;
    const language = this.language();
    const safe = window.LQ.escape;

    this.find("[data-entry-badge]").textContent = record.badge || record.dictionary;
    this.find("[data-entry-breadcrumb]").innerHTML = (record.breadcrumb || [])
      .map((pair, index) => `<span class="entry-pair${index ? " entry-pair-current" : ""}">
          <span class="entry-pair-ottoman" data-direction="rtl">${safe(pair.ottoman)}</span>
          <span class="entry-pair-latin">${safe(pair.latin)}</span>
        </span>`)
      .join('<i data-feather="chevron-right" class="entry-pair-arrow" aria-hidden="true"></i>');

    this.find("[data-entry-notice]").textContent = (record.notice || {})[language] || "";

    this.find("[data-entry-tabs]").innerHTML = (record.tabs || []).map((tab, index) => `
      <button type="button" class="btn entry-tab${index === 0 ? " active" : ""}"
              data-entry-tab="${safe(tab.section)}" title="${safe((tab.title || {})[language] || "")}"
              data-action="click->entry-window#selectTab">
        <span class="language-flag" data-flag="${safe(tab.flag || "")}" aria-hidden="true"></span>
        ${safe(tab.code)}
      </button>`).join('<span class="entry-tab-divider" aria-hidden="true"></span>');

    this.find("[data-entry-sections]").innerHTML =
      (record.sections || []).map((section) => this.sectionHtml(section, language)).join("");

    // The white pane behind the three slides to the one in hand, so the
    // switch reads as one control rather than three buttons.
    this.find("[data-entry-views]").innerHTML =
      '<span class="entry-view-indicator" data-entry-indicator aria-hidden="true"></span>' +
      (record.views || []).map((view) => `
      <button type="button" class="btn entry-view${view.id === this.view ? " active" : ""}"
              data-entry-view="${safe(view.id)}" aria-pressed="${view.id === this.view}"
              data-action="click->entry-window#selectView">
        <span class="entry-view-label">${safe((view.label || {})[language] || "")}</span>
        <span class="entry-view-divider" aria-hidden="true"></span>
        <span class="entry-view-count">${safe(view.count)}</span>
      </button>`).join("");
  }

  // The pane has no width until the window is on screen, so it is placed
  // once it is and again whenever the view changes.
  placeIndicator() {
    const views = this.element.querySelector(".entry-views");
    const indicator = this.element.querySelector("[data-entry-indicator]");
    if (!views || !indicator) return;
    const buttons = [...views.querySelectorAll(".entry-view")];
    if (!buttons.length) return;
    const width = (views.offsetWidth - 4) / buttons.length;
    const at = buttons.findIndex((button) => button.classList.contains("active"));
    indicator.style.setProperty("--entry-indicator-width", `${width}px`);
    indicator.style.setProperty("--entry-indicator-x", `${Math.max(0, at) * width}px`);
  }

  sectionHtml(section, language) {
    const safe = window.LQ.escape;
    const count = section.count && section.count[language]
      ? `<span class="entry-section-count">${safe(section.count[language])}</span>` : "";
    return `
      <section class="entry-section${section.collapsed ? " is-collapsed" : ""}"
               id="entry-${safe(section.id)}" data-entry-section="${safe(section.id)}">
        <h3 class="entry-section-head">
          <button type="button" class="btn entry-section-toggle"
                  aria-expanded="${!section.collapsed}"
                  data-action="click->entry-window#toggleSection">
            <span class="language-flag" data-flag="${safe(section.flag || "")}" aria-hidden="true"></span>
            <span class="entry-section-title">${safe((section.title || {})[language] || "")}</span>
            ${count}
            <i data-feather="chevron-down" class="entry-chevron" aria-hidden="true"></i>
          </button>
        </h3>
        <div class="entry-section-body">
          ${section.id === "original" ? this.scanHtml(section) : this.panelHtml(section, language)}
        </div>
      </section>`;
  }

  // The scan is its own thing: the page as printed, with the places the entry
  // occupies drawn on top of it.
  scanHtml(section) {
    const safe = window.LQ.escape;
    const boxes = (section.boxes || []).map((box) => `
      <button type="button" class="entry-box entry-box-${safe(box.slot)}"
              data-entry-box="${safe(box.slot)}" data-entry-kind="${safe(box.kind)}"
              ${box.pair ? `data-entry-pair="${safe(box.pair)}"` : ""}
              data-entry-ottoman="${safe(box.ottoman)}" data-entry-latin="${safe(box.latin)}"
              aria-label="${safe(box.latin)}"></button>`).join("");
    return `
      <div class="entry-scan">
        <button type="button" class="btn entry-scan-arrow entry-scan-previous"
                data-action="click->entry-window#previous"
                aria-label="Previous entry" data-i18n-aria="scanPrevious">
          <i data-feather="chevron-left" aria-hidden="true"></i>
        </button>
        <div class="entry-scan-viewport">
          <div class="entry-scan-frame" data-entry-frame>
            <img src="${safe(this.record.scan)}" alt=""
                 data-i18n-alt="scanAlt" class="entry-scan-image">
            ${boxes}
          </div>
        </div>
        <button type="button" class="btn entry-scan-arrow entry-scan-next"
                data-action="click->entry-window#next"
                aria-label="Next entry" data-i18n-aria="scanNext">
          <i data-feather="chevron-right" aria-hidden="true"></i>
        </button>
      </div>`;
  }

  panelHtml(section, language) {
    const safe = window.LQ.escape;
    const body = section.systems
      ? this.systemsHtml(section, language)
      : `<div class="entry-text${section.rtl ? " entry-text-rtl" : ""}"
              ${section.rtl ? 'data-direction="rtl"' : ""}
              data-entry-text="${safe(section.id)}">${(section.content || {})[language] || ""}</div>
         ${this.editActionsHtml(section.id)}`;
    return `
      <div class="entry-panel">
        <p class="entry-panel-label">${safe((section.panelLabel || {})[language] || "")}</p>
        ${section.systems ? "" : this.editButtonHtml(section.id)}
        ${body}
        <p class="entry-source">${(section.note || {})[language] || ""}</p>
        ${this.citeRowHtml()}
      </div>`;
  }

  // The transliteration panel holds one text per system, each opening on its
  // own, with its own pair of controls above them.
  systemsHtml(section, language) {
    const safe = window.LQ.escape;
    return `
      <div class="entry-system-controls">
        <button type="button" class="btn entry-control" data-action="click->entry-window#expandSystems"
                data-i18n="entryExpandAll">Expand all</button>
        <span class="entry-control-divider" aria-hidden="true"></span>
        <button type="button" class="btn entry-control" data-action="click->entry-window#collapseSystems"
                data-i18n="entryCollapseAll">Collapse all</button>
      </div>
      <div class="entry-systems">
        ${(section.systems || []).map((system) => `
          <div class="entry-system" data-entry-system="${safe(system.id)}">
            <div class="entry-system-head">
              <button type="button" class="btn entry-system-toggle" aria-expanded="true"
                      data-action="click->entry-window#toggleSystem">
                <i data-feather="chevron-down" class="entry-chevron" aria-hidden="true"></i>
                <span class="entry-system-label">${safe((system.label || {})[language] || "")}</span>
              </button>
              ${this.editButtonHtml("trl-" + system.id)}
            </div>
            <div class="entry-system-body">
              <div class="entry-text" data-entry-text="trl-${safe(system.id)}">${(system.content || {})[language] || ""}</div>
              ${this.editActionsHtml("trl-" + system.id)}
            </div>
          </div>`).join("")}
      </div>`;
  }

  // Anyone may propose a correction; what they write is sent for review
  // rather than stored, so this is not restricted to staff.
  editButtonHtml(id) {
    const safe = window.LQ.escape;
    return `
      <button type="button" class="btn entry-edit" data-entry-edit="${safe(id)}"
              data-action="click->entry-window#toggleEdit"
              aria-label="Suggest a correction" data-i18n-aria="entryEdit">
        <i data-feather="edit-2" aria-hidden="true"></i>
        <span data-i18n="entryEdit">Edit</span>
      </button>`;
  }

  editActionsHtml(id) {
    const safe = window.LQ.escape;
    return `
      <div class="entry-edit-actions" data-entry-actions="${safe(id)}" hidden>
        <button type="button" class="btn entry-save" data-entry-save="${safe(id)}"
                data-action="click->entry-window#saveEdit" data-i18n="save">Save</button>
        <button type="button" class="btn entry-cancel" data-entry-cancel="${safe(id)}"
                data-action="click->entry-window#cancelEdit" data-i18n="cancel">Cancel</button>
      </div>`;
  }

  citeRowHtml() {
    return `
      <p class="entry-cite">
        <span class="entry-cite-label"><span data-i18n="entrySource">Source</span>:</span>
        <button type="button" class="btn entry-cite-style" data-entry-style="chicago"
                data-action="click->entry-window#copyCitation">Chicago</button>
        <button type="button" class="btn entry-cite-style" data-entry-style="harvard"
                data-action="click->entry-window#copyCitation">Harvard</button>
        <button type="button" class="btn entry-cite-style" data-entry-style="apa"
                data-action="click->entry-window#copyCitation">APA</button>
      </p>`;
  }

  // ==================== the panels ====================

  toggleSection(event) {
    const section = event.currentTarget.closest(".entry-section");
    const collapsed = section.classList.toggle("is-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    this.hideCards();
  }

  expandAll() { this.setAll(false); }
  collapseAll() { this.setAll(true); }

  setAll(collapsed) {
    this.element.querySelectorAll(".entry-section").forEach((section) => {
      section.classList.toggle("is-collapsed", collapsed);
      const toggle = section.querySelector(".entry-section-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", String(!collapsed));
    });
    this.hideCards();
  }

  toggleSystem(event) {
    const system = event.currentTarget.closest(".entry-system");
    const collapsed = system.classList.toggle("is-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  }

  expandSystems() { this.setSystems(false); }
  collapseSystems() { this.setSystems(true); }

  setSystems(collapsed) {
    this.element.querySelectorAll(".entry-system").forEach((system) => {
      system.classList.toggle("is-collapsed", collapsed);
      const toggle = system.querySelector(".entry-system-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  // A tab and a panel are two ways into the same thing, so the tab opens its
  // panel and takes the reader to it.
  selectTab(event) {
    this.openSection(event.currentTarget.dataset.entryTab);
  }

  openSection(id) {
    const section = this.element.querySelector(`[data-entry-section="${CSS.escape(id)}"]`);
    if (!section) return null;
    section.classList.remove("is-collapsed");
    const toggle = section.querySelector(".entry-section-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    this.markTab(id);
    // The tab was pressed, so the reader is not scrolling: the panel under
    // the cursor must not steal the mark back while the scroll runs.
    this.following = false;
    clearTimeout(this.followTimer);
    this.followTimer = setTimeout(() => { this.following = true; }, 600);
    section.scrollIntoView({ block: "start", behavior: "smooth" });
    return section;
  }

  markTab(id) {
    this.element.querySelectorAll(".entry-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.entryTab === id);
    });
  }

  // Scrolling the panels moves the tab with them.
  watchSections() {
    const body = this.find("[data-entry-body]");
    if (!body || !window.IntersectionObserver) return;
    this.following = true;
    this.watcher = new IntersectionObserver((entries) => {
      if (!this.following) return;
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) this.markTab(visible.target.dataset.entrySection);
    }, { root: body, threshold: [0.25, 0.5, 0.75], rootMargin: "-10% 0px -60% 0px" });
    this.element.querySelectorAll(".entry-section").forEach((s) => this.watcher.observe(s));
  }

  // ==================== the ways of looking at the page ====================

  selectView(event) {
    this.view = event.currentTarget.dataset.entryView;
    this.element.querySelectorAll(".entry-view").forEach((button) => {
      const active = button === event.currentTarget;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    this.placeIndicator();
    // The endpoint returns one image per view; the sample carries the slice.
  }

  previous() { this.step(-1); }
  next() { this.step(1); }

  step() {
    // One entry of the sample, so there is nowhere to step to yet; the
    // endpoint will return the neighbours with the record.
  }

  // ==================== the words ====================

  // A word several panels share is wrapped where each of them says it, so
  // pressing it can list what the others call it.
  markConcepts() {
    const concepts = this.record.concepts || {};
    Object.keys(concepts).forEach((name) => {
      (concepts[name].rows || []).forEach((row) => {
        if (row.section === "original" || !row.value) return;
        const key = row.target || row.section;
        const root = this.element.querySelector(`[data-entry-text="${CSS.escape(key)}"]`);
        if (root) this.wrapTerm(root, row.value, name, key);
      });
    });
  }

  wrapTerm(root, term, concept, key) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest(".entry-link") && node.nodeValue.includes(term)) found.push(node);
    }
    found.forEach((text) => {
      const parts = text.nodeValue.split(term);
      const fragment = document.createDocumentFragment();
      parts.forEach((part, index) => {
        if (part) fragment.appendChild(document.createTextNode(part));
        if (index < parts.length - 1) {
          const link = document.createElement("span");
          link.className = "entry-link";
          link.dataset.entryConcept = concept;
          link.dataset.entryFrom = key;
          link.textContent = term;
          fragment.appendChild(link);
        }
      });
      text.parentNode.replaceChild(fragment, text);
    });
  }

  // Pressing a shared word, a word on the scan, or a marked word in a panel
  // is one listener: the window is rebuilt from the record, so bound handlers
  // would have to be bound again each time.
  bodyClick(event) {
    const link = event.target.closest(".entry-link");
    if (link) { event.stopPropagation(); this.openParallel(link); return; }
    const row = event.target.closest("[data-entry-row]");
    if (row) { event.stopPropagation(); this.followRow(row); return; }
    const word = event.target.closest(".entry-word");
    if (word) { this.openSection("original"); this.hideCards(); return; }
    this.closeParallel();
  }

  bodyOver(event) {
    const word = event.target.closest(".entry-word");
    if (word) { this.showCrops(word); return; }
    const box = event.target.closest(".entry-box");
    if (box) this.showBoxCard(box);
  }

  bodyOut(event) {
    if (event.target.closest(".entry-word, .entry-box")) this.hideSoon();
  }

  // The scan the word was read from, above it; the phrase it belongs to,
  // below it.
  showCrops(word) {
    clearTimeout(this.hideTimer);
    const crops = this.record.crops || "";
    const above = this.find("[data-entry-crop-above]");
    const below = this.find("[data-entry-crop-below]");
    const spot = word.getBoundingClientRect();
    above.innerHTML = `<img src="${window.LQ.escape(crops + word.dataset.img)}" alt="">`;
    above.hidden = false;
    above.style.left = `${spot.left + spot.width / 2}px`;
    above.style.top = `${spot.top - 12}px`;
    const compound = word.dataset.compound;
    if (compound) {
      below.innerHTML = compound.split(",").reverse()
        .map((name) => `<img src="${window.LQ.escape(crops + name.trim())}" alt="">`).join("");
      below.hidden = false;
      below.style.left = `${spot.left + spot.width / 2}px`;
      below.style.top = `${spot.bottom + 12}px`;
    } else {
      below.hidden = true;
    }
  }

  // A place marked on the scan says what it reads as, in both scripts, and
  // offers to search it or to report it. Two boxes that make up one phrase
  // light together and the phrase itself is shown under them.
  showBoxCard(box) {
    clearTimeout(this.hideTimer);
    const pair = box.dataset.entryPair;
    const group = pair
      ? Array.from(this.element.querySelectorAll(`[data-entry-pair="${CSS.escape(pair)}"]`))
      : [box];
    this.element.querySelectorAll(".entry-box").forEach((one) => one.classList.remove("is-lit"));
    group.forEach((one) => one.classList.add("is-lit"));

    const card = this.find("[data-entry-box-card]");
    const spot = box.getBoundingClientRect();
    card.innerHTML = this.cardHtml(box.dataset.entryOttoman, box.dataset.entryLatin);
    card.hidden = false;
    card.style.left = `${spot.left + spot.width / 2}px`;
    card.style.top = spot.top < 160 ? `${spot.bottom + 10}px` : `${spot.top - 10}px`;
    card.classList.toggle("is-below", spot.top < 160);

    const phrase = this.find("[data-entry-phrase]");
    if (group.length > 1) {
      phrase.innerHTML = this.cardHtml(
        group.map((one) => one.dataset.entryOttoman).join(" "),
        group.map((one) => one.dataset.entryLatin).join(" ")
      );
      phrase.hidden = false;
      phrase.style.left = `${spot.left + spot.width / 2}px`;
      phrase.style.top = `${spot.bottom + 10}px`;
    } else {
      phrase.hidden = true;
    }
  }

  cardHtml(ottoman, latin) {
    const safe = window.LQ.escape;
    const line = (text, script) => `
      <span class="entry-card-line">
        <button type="button" class="btn entry-card-word" data-entry-search="${safe(text)}"
                data-entry-script="${script}" ${script === "ottoman" ? 'data-direction="rtl"' : ""}>${safe(text)}</button>
        <button type="button" class="btn entry-card-report"
                data-entry-report-ottoman="${safe(ottoman)}" data-entry-report-latin="${safe(latin)}"
                aria-label="Report an error" data-i18n-aria="scanReport">
          <i data-feather="alert-triangle" aria-hidden="true"></i>
        </button>
      </span>`;
    return line(ottoman, "ottoman") + '<span class="entry-card-divider" aria-hidden="true"></span>' + line(latin, "latin");
  }

  hideSoon() {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hideCards(), 260);
  }

  holdCards() { clearTimeout(this.hideTimer); }

  hideCards() {
    ["[data-entry-crop-above]", "[data-entry-crop-below]", "[data-entry-box-card]", "[data-entry-phrase]"]
      .forEach((selector) => { const card = this.find(selector); if (card) card.hidden = true; });
    this.element.querySelectorAll(".entry-box").forEach((one) => one.classList.remove("is-lit"));
  }

  // ==================== what the other panels call it ====================

  openParallel(link) {
    const concept = (this.record.concepts || {})[link.dataset.entryConcept];
    if (!concept) return;
    const language = this.language();
    const safe = window.LQ.escape;
    this.element.querySelectorAll(".entry-link").forEach((one) => one.classList.remove("is-open"));
    link.classList.add("is-open");
    this.find("[data-entry-parallel-rows]").innerHTML = (concept.rows || []).map((row) => `
      <button type="button" class="btn entry-parallel-row" data-entry-row
              data-entry-section-name="${safe(row.section)}"
              data-entry-target="${safe(row.target || "")}"
              data-entry-concept="${safe(link.dataset.entryConcept)}">
        <span class="entry-parallel-lang">${safe((row.label || {})[language] || "")}</span>
        <span class="entry-parallel-value">${safe(row.value || (row.prompt || {})[language] || "")}</span>
      </button>`).join("");

    const panel = this.find("[data-entry-parallel]");
    panel.hidden = false;
    const spot = link.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    const height = Math.min(520, window.innerHeight - 40);
    panel.style.left = `${Math.max(16, Math.min(spot.left, window.innerWidth - width - 16))}px`;
    panel.style.top = spot.bottom + height + 12 < window.innerHeight
      ? `${spot.bottom + 8}px`
      : `${Math.max(20, spot.top - height - 8)}px`;
    window.LQ.refreshDynamicContent(panel);
  }

  closeParallel() {
    const panel = this.find("[data-entry-parallel]");
    if (panel) panel.hidden = true;
    this.element.querySelectorAll(".entry-link").forEach((one) => one.classList.remove("is-open"));
  }

  followRow(row) {
    const { entrySectionName, entryTarget, entryConcept } = row.dataset;
    this.closeParallel();
    if (entrySectionName === "original") { this.markOnScan(entryConcept); return; }
    const section = this.openSection(entrySectionName);
    if (!section) return;
    const key = entryTarget || entrySectionName;
    const text = this.element.querySelector(`[data-entry-text="${CSS.escape(key)}"]`);
    const target = text && text.querySelector(`[data-entry-concept="${CSS.escape(entryConcept)}"]`);
    if (!target) return;
    const system = target.closest(".entry-system");
    if (system) {
      system.classList.remove("is-collapsed");
      const toggle = system.querySelector(".entry-system-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("is-found");
    setTimeout(() => target.classList.remove("is-found"), 1500);
  }

  // The scan answers the same question by drawing a frame around the place
  // the word sits in.
  markOnScan(name) {
    const concept = (this.record.concepts || {})[name];
    const section = this.openSection("original");
    const frame = this.find("[data-entry-frame]");
    if (!concept || !concept.rect || !section || !frame) return;
    let mark = frame.querySelector(".entry-scan-mark");
    if (!mark) {
      mark = document.createElement("div");
      mark.className = "entry-scan-mark";
      frame.appendChild(mark);
    }
    const rect = concept.rect;
    Object.assign(mark.style, {
      left: `${rect.left}%`, top: `${rect.top}%`,
      width: `${rect.width}%`, height: `${rect.height}%`
    });
    mark.classList.remove("is-shown");
    void mark.offsetWidth;
    setTimeout(() => mark.classList.add("is-shown"), 280);
  }

  // ==================== proposing a correction ====================

  toggleEdit(event) {
    const id = event.currentTarget.dataset.entryEdit;
    const text = this.element.querySelector(`[data-entry-text="${CSS.escape(id)}"]`);
    if (!text) return;
    if (text.isContentEditable) { this.closeEdit(id); return; }
    this.before = this.before || {};
    this.before[id] = text.innerHTML;
    text.contentEditable = "true";
    text.focus();
    event.currentTarget.classList.add("is-editing");
    this.element.querySelector(`[data-entry-actions="${CSS.escape(id)}"]`).hidden = false;
  }

  closeEdit(id, restore) {
    const text = this.element.querySelector(`[data-entry-text="${CSS.escape(id)}"]`);
    const actions = this.element.querySelector(`[data-entry-actions="${CSS.escape(id)}"]`);
    const button = this.element.querySelector(`[data-entry-edit="${CSS.escape(id)}"]`);
    if (text) {
      text.contentEditable = "false";
      if (restore && this.before && this.before[id] != null) text.innerHTML = this.before[id];
    }
    if (actions) actions.hidden = true;
    if (button) button.classList.remove("is-editing");
  }

  cancelEdit(event) { this.closeEdit(event.currentTarget.dataset.entryCancel, true); }

  saveEdit(event) {
    const id = event.currentTarget.dataset.entrySave;
    const text = this.element.querySelector(`[data-entry-text="${CSS.escape(id)}"]`);
    const was = (this.before || {})[id] || "";
    if (!text || text.innerHTML === was) { this.closeEdit(id, true); return; }
    this.correction = { panel: id, original: was, corrected: text.innerHTML };
    this.closeEdit(id);
    const form = this.find("[data-entry-contribute-form]");
    if (form) form.reset();
    this.show("[data-entry-contribute]");
  }

  sendCorrection(event) {
    if (event) event.preventDefault();
    this.postCorrection({
      firstName: this.find("#entryContribFirst").value,
      lastName: this.find("#entryContribLast").value,
      email: this.find("#entryContribEmail").value
    });
  }

  sendAnonymously() { this.postCorrection(null); }

  postCorrection(contributor) {
    // Matches the Rails route the correction is sent to:
    //   POST /dictionary_entry/correction
    $.ajax({
      url: "/dictionary_entry/correction",
      type: "POST",
      data: Object.assign({}, this.correction, { contributor: contributor }),
      // No backend yet; the thanks is shown as though it had been accepted.
      beforeSend: () => { this.thank("[data-entry-contribute]"); return false; },
      success: () => this.thank("[data-entry-contribute]")
    });
    this.correction = null;
  }

  closeContribute() { this.hide("[data-entry-contribute]"); }

  // ==================== reporting a word ====================

  report(event) {
    const button = event.target.closest(".entry-card-report");
    if (!button) return;
    event.stopPropagation();
    this.hideCards();
    this.find("[data-entry-report-word-ottoman]").textContent = button.dataset.entryReportOttoman;
    this.find("[data-entry-report-word-latin]").textContent = button.dataset.entryReportLatin;
    const form = this.find("[data-entry-report-form]");
    if (form) form.reset();
    this.show("[data-entry-report]");
  }

  sendReport(event) {
    if (event) event.preventDefault();
    // Matches the Rails route the report is sent to:
    //   POST /dictionary_entry/report
    $.ajax({
      url: "/dictionary_entry/report",
      type: "POST",
      data: {
        ottoman: this.find("[data-entry-report-word-ottoman]").textContent,
        latin: this.find("[data-entry-report-word-latin]").textContent,
        note: this.find("#entryReportText").value
      },
      beforeSend: () => { this.thank("[data-entry-report]"); return false; },
      success: () => this.thank("[data-entry-report]")
    });
  }

  closeReport() { this.hide("[data-entry-report]"); }

  // ==================== the takeovers ====================

  show(selector) {
    const panel = this.find(selector);
    if (!panel) return;
    panel.hidden = false;
    panel.querySelector("[data-entry-form-view]").hidden = false;
    panel.querySelector("[data-entry-thanks]").hidden = true;
    window.LQ.refreshDynamicContent(panel);
  }

  hide(selector) {
    const panel = this.find(selector);
    if (panel) panel.hidden = true;
  }

  thank(selector) {
    const panel = this.find(selector);
    if (!panel) return;
    panel.querySelector("[data-entry-form-view]").hidden = true;
    panel.querySelector("[data-entry-thanks]").hidden = false;
    window.LQ.refreshDynamicContent(panel);
  }

  // ==================== the citation ====================

  toggleCite(event) {
    const pop = this.find("[data-entry-cite-pop]");
    const open = pop.hidden;
    pop.hidden = !open;
    event.currentTarget.setAttribute("aria-expanded", String(open));
  }

  // The window's own Cite button hands over to the citation window, the same
  // one a result row opens, so a reader sees one citation screen either way.
  cite() {
    const record = this.record;
    const first = (record.breadcrumb || [])[0] || {};
    const detail = {
      latin: first.latin,
      ottoman: first.ottoman,
      dictionary: record.dictionary,
      page: record.page
    };
    this.element.addEventListener("hidden.bs.modal", () => {
      document.dispatchEvent(new CustomEvent("citation:open", { detail }));
    }, { once: true });
    this.modal.hide();
  }

  // A panel's own Source line copies the reference outright.
  copyCitation(event) {
    const button = event.currentTarget;
    const style = button.dataset.entryStyle;
    const text = (this.record.citations || {})[style] || "";
    const done = () => {
      button.classList.add("is-copied");
      setTimeout(() => button.classList.remove("is-copied"), 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  }

  // ==================== opening on the right place ====================

  // A row's result zone asks about the sub-entry, its headword zone about the
  // entry itself, so the window opens where the reader was looking.
  focus() {
    const body = this.find("[data-entry-body]");
    if (!body) return;
    if (this.focusOn !== "result") { body.scrollTop = 0; return; }
    const boxes = Array.from(this.element.querySelectorAll('[data-entry-pair="sub"]'));
    if (!boxes.length) { body.scrollTop = 0; return; }
    const area = body.getBoundingClientRect();
    const top = Math.min(...boxes.map((box) => box.getBoundingClientRect().top));
    const bottom = Math.max(...boxes.map((box) => box.getBoundingClientRect().bottom));
    const middle = (top + bottom) / 2 - area.top + body.scrollTop;
    const limit = Math.max(0, body.scrollHeight - body.clientHeight);
    body.scrollTop = Math.max(0, Math.min(middle - body.clientHeight / 2, limit));
    boxes.forEach((box) => box.classList.add("is-lit"));
    clearTimeout(this.litTimer);
    this.litTimer = setTimeout(() => {
      boxes.forEach((box) => box.classList.remove("is-lit"));
    }, 2600);
  }

  // Pressing a word on the scan searches it, so the window gives way to the
  // results behind it.
  search(event) {
    const button = event.target.closest("[data-entry-search]");
    if (!button) return;
    event.stopPropagation();
    const { entrySearch, entryScript } = button.dataset;
    this.element.addEventListener("hidden.bs.modal", () => {
      document.dispatchEvent(new CustomEvent("search:run", {
        detail: { term: entrySearch, script: entryScript }
      }));
    }, { once: true });
    this.modal.hide();
  }
}

application.register("entry-window", EntryWindowController);
