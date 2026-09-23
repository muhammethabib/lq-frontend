// js/controllers/morphology_controller.js
// How a word is built.
//
// A word in a result row can be a root with three things hung off it. This
// window takes it apart: the whole word at the top, then what it is made of,
// down to the pieces that cannot be divided again. Each piece says which
// language it came from, and hovering one shows its reading and the notes
// the editors left on it.
//
// The badge that opens it sits on a word box and appears when the box is
// hovered, so the results list stays quiet until someone asks.
//
// It follows the modal rule: an empty container, the markup in a template,
// filled before Bootstrap shows it. The endpoint is documented in
// js/morphology_sample.js.

// The colour a language is drawn in. Anything else falls back to the slate
// the rest of the page uses for something unremarkable.
const ORIGINS = {
  ar: { bg: "#fff1f2", border: "#fda4af", ink: "#be123c" },
  fa: { bg: "#ecfdf5", border: "#6ee7b7", ink: "#059669" },
  tr: { bg: "#ecfeff", border: "#67e8f9", ink: "#0e7490" },
  other: { bg: "#e3f2fd", border: "#90caf9", ink: "#1565c0" }
};

// A word drawn from more than one language is shown as Persian and Arabic
// together, which is what "mix" means in the records.
const MIXED = ["fa", "ar"];

class MorphologyController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail || {});
    document.addEventListener("morphology:open", this.onOpen);
    this.onLanguageChange = () => { if (this.record) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("morphology:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.modal) this.modal.dispose();
  }

  open(request) {
    // Matches the Rails route this window expects:
    //   GET /word_analysis/show?word=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { word: request.latin || request.ottoman },
      // No backend yet: returning false cancels the request and the window is
      // fed sample data instead. Delete beforeSend once the route exists.
      beforeSend: () => { this.receive(this.sampleFor(request)); return false; },
      success: (response) => this.receive(response),
      error: () => this.receive(this.sampleFor(request))
    });
  }

  // The sample holds eight analyses. A word it does not know is shown the
  // first of them, so the window can be looked at from any row.
  sampleFor(request) {
    const records = window.LQ_MORPHOLOGY_SAMPLE || {};
    const wanted = (request.latin || "").toLowerCase().replace(/\s+/g, "-");
    const found = Object.keys(records).find((key) => {
      const record = records[key];
      return key === wanted || record.latin === request.latin || record.ottoman === request.ottoman;
    });
    return records[found || Object.keys(records)[0]];
  }

  receive(record) {
    if (!record) return;
    this.record = record;
    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    this.modal.show();
  }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template || !this.record) return;
    window.LQ.disposeWidgets(this.element);
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.element.classList.contains("show")) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;
    this.element.querySelector("[data-morphology-tree]").innerHTML = this.branchHtml(this.record, 1);
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);
  }

  // ==================== drawing the tree ====================

  // One row per level. A piece with one part below it keeps the same column
  // and is joined by a straight line; a piece with several is drawn over a
  // fan of curves, each landing on the middle of its own part.
  branchHtml(node, level) {
    const parts = node.parts || [];
    let out = `
      <div class="tree-level tree-level-${level}">
        ${level > 1 ? '<span class="tree-line" aria-hidden="true"></span>' : ""}
        ${this.nodeHtml(node)}
      </div>`;

    if (parts.length === 0) return out;
    if (parts.length === 1) return out + this.branchHtml(parts[0], level + 1);

    const width = parts.length === 2 ? 200 : 160;
    const span = parts.length * width;
    const centres = parts.map((part, index) => Math.round(width / 2 + index * width));
    const middle = Math.round(span / 2);

    out += `
      <div class="tree-fan" style="--fan-width: ${span}px">
        ${this.fanHtml(centres, middle, span)}
        ${parts.map((part, index) => `
          <div class="tree-seat" style="--seat: ${centres[index]}px">
            ${this.nodeHtml(centres[index] < middle ? Object.assign({}, part, { left: true }) : part)}
          </div>`).join("")}
      </div>`;

    // A part that is itself made of something carries that below its own
    // column rather than below the middle of the fan.
    parts.forEach((part, index) => {
      if (!part.parts || !part.parts.length) return;
      out += `
        <div class="tree-fan tree-fan-under" style="--fan-width: ${span}px">
          <span class="tree-line" style="--seat: ${centres[index]}px" aria-hidden="true"></span>
          <div class="tree-seat" style="--seat: ${centres[index]}px">
            ${this.nodeHtml(part.parts[0])}
          </div>
        </div>`;
    });
    return out;
  }

  // The lines from one piece down to the several it is made of: straight
  // down the middle, and a rounded elbow out to either side.
  fanHtml(centres, middle, span) {
    const height = 52;
    const turn = Math.round(height * 0.58);
    const paths = centres.map((at) => {
      if (at === middle) return `M${middle},0 V${height}`;
      const towards = at < middle ? -8 : 8;
      const inwards = at < middle ? 8 : -8;
      return `M${middle},0 V${turn} Q${middle},${turn + 8} ${middle + towards},${turn + 8}` +
        ` H${at - inwards} Q${at},${turn + 8} ${at},${turn + 16} V${height}`;
    });
    return `
      <svg class="tree-fan-lines" viewBox="0 0 ${span} ${height}" preserveAspectRatio="none" aria-hidden="true">
        ${paths.map((path) => `<path class="tree-path" d="${path}" />`).join("")}
      </svg>`;
  }

  nodeHtml(node) {
    const safe = window.LQ.escape;
    return `
      <div class="tree-node${node.left ? " is-left" : ""}">
        <div class="tree-node-box">
          <span class="tree-node-word" data-direction="rtl">${safe(node.ottoman)}</span>
          <span class="tree-node-origins">${this.originsHtml(node)}</span>
        </div>
        ${this.notesHtml(node)}
        ${this.readingHtml(node)}
      </div>`;
  }

  // A word written from two languages wears one badge for each; everything
  // else wears one badge, split into segments where a single piece draws on
  // more than one language.
  originsHtml(node) {
    const parts = node.parts || [];
    if (node.phrase && parts.length >= 2) {
      return this.badgeHtml(parts[0].origin) + this.badgeHtml(parts[1].origin);
    }
    return this.badgeHtml(node.origin === "mix" ? MIXED : node.origin);
  }

  badgeHtml(origin) {
    const safe = window.LQ.escape;
    const codes = Array.isArray(origin) ? origin : [origin];
    const segments = codes.map((code) => {
      const colour = ORIGINS[code] || { bg: "#f1f5f9", border: "#e2e8f0", ink: "#334155" };
      return `<span class="tree-origin" style="--origin-bg: ${colour.bg}; --origin-ink: ${colour.ink}"
                    >${safe(this.originName(code))}</span>`;
    }).join("");
    // A node in one language wears that language's own edge; a node in two
    // keeps the neutral one, which the line between the halves matches.
    const single = codes.length === 1
      ? ` style="--origin-edge: ${(ORIGINS[codes[0]] || {}).border || "#e2e8f0"}"`
      : "";
    return `<span class="tree-origin-badge${codes.length > 1 ? " is-split" : " is-single"}"${single}>${segments}</span>`;
  }

  originName(code) {
    const names = {
      ar: ["morphArabic", "Arabic"],
      fa: ["morphPersian", "Persian"],
      tr: ["morphTurkish", "Turkish"],
      other: ["morphOther", "Other language"]
    };
    const [key, fallback] = names[code] || [null, code];
    return key ? window.LQ.translate(key, fallback) : code;
  }

  notesHtml(node) {
    const notes = node.notes || [];
    if (!notes.length) return "";
    const safe = window.LQ.escape;
    return `
      <div class="tree-notes">
        ${notes.map((note) => `
          <span class="tree-note">
            <i data-feather="bookmark" aria-hidden="true"></i>
            <span>${safe(this.noteName(note))}</span>
          </span>`).join("")}
      </div>`;
  }

  noteName(note) {
    const names = {
      "Unclear Pronunciation": ["morphNoteUnclear", "Unclear pronunciation"],
      "Turkish Verb": ["morphNoteTurkishVerb", "Turkish verb"],
      Incorrect: ["morphNoteIncorrect", "Incorrect"],
      Unused: ["morphNoteUnused", "Unused"]
    };
    const [key, fallback] = names[note] || [null, note];
    return key ? window.LQ.translate(key, fallback) : note;
  }

  // What the piece reads as, and the way to say it is wrong.
  readingHtml(node) {
    const safe = window.LQ.escape;
    const crop = node.crop
      ? `<span class="tree-reading-crop"><img src="${safe(node.crop)}" alt=""></span>` : "";
    return `
      <div class="tree-reading">
        ${crop}
        <span class="tree-reading-row">
          <span class="tree-reading-text">${safe(node.latin)}</span>
          <button type="button" class="btn tree-report"
                  data-morphology-ottoman="${safe(node.ottoman)}"
                  data-morphology-latin="${safe(node.latin)}"
                  data-action="click->morphology#report"
                  aria-label="Report an error" data-i18n-aria="scanReport">
            <i data-feather="alert-triangle" aria-hidden="true"></i>
          </button>
        </span>
      </div>`;
  }

  // ==================== reporting a piece ====================

  report(event) {
    event.stopPropagation();
    const { morphologyOttoman, morphologyLatin } = event.currentTarget.dataset;
    this.element.querySelector("[data-morphology-report-ottoman]").textContent = morphologyOttoman;
    this.element.querySelector("[data-morphology-report-latin]").textContent = morphologyLatin;
    const form = this.element.querySelector("[data-morphology-report-form]");
    if (form) form.reset();
    const panel = this.element.querySelector("[data-morphology-report]");
    panel.hidden = false;
    panel.querySelector("[data-morphology-form-view]").hidden = false;
    panel.querySelector("[data-morphology-thanks]").hidden = true;
    window.LQ.refreshDynamicContent(panel);
  }

  sendReport(event) {
    if (event) event.preventDefault();
    // Matches the Rails route the report is sent to:
    //   POST /word_analysis/report
    $.ajax({
      url: "/word_analysis/report",
      type: "POST",
      data: {
        ottoman: this.element.querySelector("[data-morphology-report-ottoman]").textContent,
        latin: this.element.querySelector("[data-morphology-report-latin]").textContent,
        note: this.element.querySelector("#morphologyReportText").value
      },
      beforeSend: () => { this.thank(); return false; },
      success: () => this.thank()
    });
  }

  thank() {
    const panel = this.element.querySelector("[data-morphology-report]");
    panel.querySelector("[data-morphology-form-view]").hidden = true;
    panel.querySelector("[data-morphology-thanks]").hidden = false;
    window.LQ.refreshDynamicContent(panel);
  }

  closeReport() {
    this.element.querySelector("[data-morphology-report]").hidden = true;
  }
}

application.register("morphology", MorphologyController);
