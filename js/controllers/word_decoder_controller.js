// js/controllers/word_decoder_controller.js
// The Word Decoder: describe a word you cannot fully read, and see which
// dictionary entries fit the description.
//
// The strip is a row of slots, one per letter position, read right to left.
// A slot can hold:
//   - a letter the reader recognised
//   - several letters, meaning "this position is one of these"
//   - a skeleton shape with the dots unclear
//   - a wildcard: one unreadable letter, or an unknown number of letters
//
// Between two slots sits a join marker recording whether the letters are
// written joined, apart, or the reader cannot tell. That is a real reading
// clue in Ottoman script, so it is sent with the pattern rather than dropped.

class WordDecoderController extends Stimulus.Controller {
  static targets = [
    "strip", "clear", "results", "resultsTable", "pattern",
    "recordCount", "dictionaryCount", "expansionRow", "emptyState", "error", "groupCopy"
  ]

  static values = {
    endpoint: { type: String, default: "/word_decoder/results" },
    slots: { type: Number, default: 5 }
  }

  connect() {
    this.results = null;
    this.lastPattern = null;
    this.activeExpansion = null;
    this.buildStrip();

    // Keys arrive from the on-screen keyboard as events, so the keyboard does
    // not need to know this controller exists.
    this.onKey = (event) => this.applyKey(event.detail);
    document.addEventListener("ottoman-keyboard:key", this.onKey);

    // A click outside both the strip and the keyboard puts it away
    this.onOutside = (event) => {
      if (event.target.closest(".ottoman-keyboard")) return;
      // The whole strip counts, not just a cell: the join marker, the insert
      // button and the trash button all sit outside the cells.
      if (event.target.closest(".slot-strip")) return;
      this.dismissKeyboard();
    };
    document.addEventListener("pointerdown", this.onOutside);

    // language:changed is dispatched on the page root, which is an ancestor of
    // this element, so it is listened for on document where it bubbles to.
    this.onLanguageChange = () => {
      this.relabelStrip();
      this.renderPattern();
      this.renderResults();
    };
    document.addEventListener("language:changed", this.onLanguageChange);

    this.openRequestedState();
  }

  // The development navigator opens a state of this tab directly. It fills
  // the strip with the guide's worked example, ح ا ٭ ر, because a decoder
  // with nothing in it has nothing to show. A reviewing aid, and it comes out
  // with the navigator at integration.
  openRequestedState() {
    const state = new URLSearchParams(window.location.search).get("state");
    if (state !== "decoder" && state !== "decoder-results") return;

    const tab = document.getElementById("decoderTab");
    if (tab) bootstrap.Tab.getOrCreateInstance(tab).show();
    if (state !== "decoder-results") return;

    const cells = Array.from(this.stripTarget.querySelectorAll(".slot-cell"));
    [{ char: "ح" }, { char: "ا" }, { wildcard: "any" }, { char: "ر" }]
      .forEach((content, index) => {
        if (cells[index]) this.writeCell(cells[index], content);
      });
    this.refreshClear();
    const search = this.element.querySelector(".decoder-submit");
    if (search) search.click();
  }

  disconnect() {
    document.removeEventListener("ottoman-keyboard:key", this.onKey);
    document.removeEventListener("pointerdown", this.onOutside);
    document.removeEventListener("language:changed", this.onLanguageChange);
    window.LQ.disposeTooltips(this.element);
  }

  // The strip's tooltips are written once, so their text is replaced in place
  // rather than rebuilding the strip and losing what the reader has entered.
  relabelStrip() {
    const labels = [
      [".slot-remove", "decoderRemoveSlot", "Remove this letter"],
      [".cell-add", "decoderAddAlternative", "It could also be this letter"],
      [".cell-remove", "decoderRemoveAlternative", "Remove this alternative"],
      [".gap-insert", "decoderInsertSlot", "Insert a letter here"]
    ];
    labels.forEach(([selector, key, fallback]) => {
      this.stripTarget.querySelectorAll(selector).forEach((element) => {
        this.setTooltip(element, this.translate(key, fallback));
      });
    });
    this.stripTarget.querySelectorAll(".gap-join").forEach((join) => {
      this.setTooltip(join, this.joinLabel(join.dataset.join));
    });
  }

  // A Bootstrap tooltip is not read out, so the same words are also the
  // control's accessible name.
  setTooltip(element, text) {
    element.setAttribute("data-bs-title", text);
    element.setAttribute("aria-label", text);
    const tooltip = bootstrap.Tooltip.getInstance(element);
    if (tooltip) tooltip.setContent({ ".tooltip-inner": text });
  }

  // ==================== building the strip ====================

  buildStrip() {
    const parts = [this.gapHtml(false)];
    for (let index = 0; index < this.slotsValue; index += 1) {
      parts.push(this.slotHtml());
      parts.push(this.gapHtml(index < this.slotsValue - 1));
    }
    this.stripTarget.innerHTML = parts.join("");
    this.refreshGaps();
    this.refreshClear();
    window.LQ.refreshDynamicContent(this.stripTarget);
  }

  slotHtml(char = "") {
    return `
      <div class="slot">
        <div class="slot-frame">${this.cellHtml(char)}</div>
        <button type="button" class="btn slot-remove" data-action="click->word-decoder#removeSlot"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderRemoveSlot", "Remove this letter"))}"
                aria-label="${this.escape(this.translate("decoderRemoveSlot", "Remove this letter"))}">
          <i data-feather="trash-2"></i>
        </button>
      </div>`;
  }

  cellHtml(char = "") {
    return `
      <div class="slot-cell">
        <button type="button" class="btn cell-action cell-add" data-action="click->word-decoder#addAlternative"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderAddAlternative", "It could also be this letter"))}"
                aria-label="${this.escape(this.translate("decoderAddAlternative", "It could also be this letter"))}">
          <i data-feather="plus"></i>
        </button>
        <button type="button" class="btn cell-action cell-remove" data-action="click->word-decoder#removeAlternative"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderRemoveAlternative", "Remove this alternative"))}"
                aria-label="${this.escape(this.translate("decoderRemoveAlternative", "Remove this alternative"))}">
          <i data-feather="x"></i>
        </button>
        <input type="text" class="slot-input" maxlength="1" spellcheck="false" value="${this.escape(char)}"
               data-direction="rtl" aria-label="${this.escape(this.translate("decoderLetter", "Letter"))}"
               data-action="focus->word-decoder#openKeyboard keydown->word-decoder#handleKey input->word-decoder#handleInput">
      </div>`;
  }

  // A gap always offers to insert a letter here; only the gaps between two
  // letters carry a join marker.
  gapHtml(withJoin) {
    return `
      <div class="gap">
        <button type="button" class="btn gap-insert" data-action="click->word-decoder#insertSlot"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderInsertSlot", "Insert a letter here"))}"
                aria-label="${this.escape(this.translate("decoderInsertSlot", "Insert a letter here"))}">+</button>
        ${withJoin ? this.joinHtml() : ""}
      </div>`;
  }

  joinHtml() {
    return `
      <button type="button" class="btn gap-join" data-join="separate"
              data-action="pointerdown->word-decoder#cycleJoin"
              data-bs-toggle="tooltip" data-bs-placement="bottom"
              data-bs-title="${this.escape(this.joinLabel("separate"))}"
              aria-label="${this.escape(this.joinLabel("separate"))}">
        <span class="query" aria-hidden="true">?</span>
        <svg viewBox="0 0 60 40" width="34" height="17" aria-hidden="true">
          <rect class="ring ring-start" x="4" y="11" width="22" height="14" rx="7" ry="7"></rect>
          <line class="bar" x1="15" y1="18" x2="45" y2="18"></line>
          <rect class="ring ring-end" x="34" y="11" width="22" height="14" rx="7" ry="7"></rect>
        </svg>
      </button>`;
  }

  // The two outer gaps have nothing on either side to join, so they never
  // carry a marker. Run after every change to the number of slots.
  refreshGaps() {
    const gaps = Array.from(this.stripTarget.querySelectorAll(".gap"));
    gaps.forEach((gap, index) => {
      const isEdge = index === 0 || index === gaps.length - 1;
      const join = gap.querySelector(".gap-join");
      if (isEdge && join) { window.LQ.disposeTooltips(join); join.remove(); }
      if (!isEdge && !join) gap.insertAdjacentHTML("beforeend", this.joinHtml());
    });
    window.LQ.refreshDynamicContent(this.stripTarget);
  }

  // ==================== editing the strip ====================

  insertSlot(event) {
    const gap = event.currentTarget.closest(".gap");
    gap.insertAdjacentHTML("afterend", this.slotHtml() + this.gapHtml(true));
    this.refreshGaps();
    this.refreshClear();
    const input = gap.nextElementSibling.querySelector(".slot-input");
    if (input) input.focus();
  }

  removeSlot(event) {
    const slot = event.currentTarget.closest(".slot");
    const gap = slot.nextElementSibling;
    window.LQ.disposeTooltips(slot);
    if (gap) window.LQ.disposeTooltips(gap);
    slot.remove();
    if (gap) gap.remove();
    this.refreshGaps();
    this.refreshClear();
  }

  addAlternative(event) {
    const frame = event.currentTarget.closest(".slot-frame");
    frame.insertAdjacentHTML("beforeend", this.cellHtml());
    window.LQ.refreshDynamicContent(frame);
    const cells = frame.querySelectorAll(".slot-input");
    cells[cells.length - 1].focus();
  }

  removeAlternative(event) {
    const cell = event.currentTarget.closest(".slot-cell");
    const frame = cell.closest(".slot-frame");
    window.LQ.disposeTooltips(cell);
    cell.remove();
    // A slot with no cells left is no longer a letter position
    if (!frame.querySelector(".slot-cell")) {
      const slot = frame.closest(".slot");
      const gap = slot.nextElementSibling;
      window.LQ.disposeTooltips(slot);
      if (gap) window.LQ.disposeTooltips(gap);
      slot.remove();
      if (gap) gap.remove();
      this.refreshGaps();
    }
    this.refreshClear();
  }

  // separate -> connected -> uncertain -> separate
  cycleJoin(event) {
    // Keeps focus in the letter field rather than moving it to this button
    event.preventDefault();
    const button = event.currentTarget;
    const order = ["separate", "connected", "uncertain"];
    const next = order[(order.indexOf(button.dataset.join) + 1) % order.length];
    button.dataset.join = next;

    this.setTooltip(button, this.joinLabel(next));
  }

  joinLabel(state) {
    const labels = {
      separate: ["joinSeparate", "Letters written apart"],
      connected: ["joinConnected", "Letters written joined"],
      uncertain: ["joinUncertain", "Cannot tell"]
    };
    const [key, fallback] = labels[state] || labels.separate;
    return this.translate(key, fallback);
  }

  clearStrip() {
    window.LQ.disposeTooltips(this.stripTarget);
    this.buildStrip();
    this.dismissKeyboard();
  }

  // ==================== typing ====================

  // Letters the reader recognises can be typed on their own keyboard
  handleKey(event) {
    const input = event.currentTarget;

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      if (this.cellIsFilled(input.closest(".slot-cell"))) {
        this.clearCell(input.closest(".slot-cell"));
      } else {
        const step = event.key === "Backspace" ? 1 : -1;
        const target = this.nextFilled(input, step);
        if (target) { this.clearCell(target.closest(".slot-cell")); target.focus(); }
      }
      this.refreshClear();
      return;
    }

    // The strip reads right to left, so the next letter is the one to the left
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      this.move(input, event.key === "ArrowLeft" ? 1 : -1);
      return;
    }

    if (event.key === "Enter") { event.preventDefault(); this.submit(event); return; }
    if (event.ctrlKey || event.metaKey) return;

    const letter = this.letterFor(event.key, event.shiftKey, event.altKey);
    if (!letter) return;
    event.preventDefault();
    this.writeCell(input.closest(".slot-cell"), { char: letter });
    this.advance(input);
  }

  // Which Ottoman letter a physical key produces. A key can carry up to three
  // letters: Shift reaches the second, Alt the third.
  letterFor(key, withShift, withAlt) {
    const map = window.LQ_OTTOMAN_KEYMAP || { single: {}, layered: {} };
    const lower = key.length === 1 ? key.toLowerCase() : key;
    const layers = map.layered[lower];
    if (layers) {
      if (withAlt) return layers[2] || null;
      if (withShift) return layers[1] || null;
      return layers[0];
    }
    // Alt on a macOS keyboard produces its own character, so the key is read
    // from the physical position instead of what it typed.
    if (withAlt || withShift) return null;
    return map.single[lower] || null;
  }

  handleInput(event) {
    // A letter pasted or typed straight into the field replaces whatever mark
    // was there, so the record of that mark has to go with it.
    const cell = event.currentTarget.closest(".slot-cell");
    if (event.currentTarget.value) this.forgetMark(cell);
    this.refreshClear();
  }

  // Everything that made a cell a wildcard or a skeleton, cleared together
  forgetMark(cell) {
    const mark = cell.querySelector(".slot-mark");
    if (mark) mark.remove();
    delete cell.dataset.wildcard;
    delete cell.dataset.rasm;
    delete cell.dataset.dots;
    delete cell.dataset.matches;
  }

  // ==================== the on-screen keyboard ====================

  openKeyboard(event) {
    this.activeCell = event.currentTarget.closest(".slot-cell");
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:request", {
      detail: { anchor: this.stripTarget, canClear: this.isDirty(), owner: this.ownerName }
    }));
  }

  dismissKeyboard() {
    this.activeCell = null;
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:dismiss"));
  }

  get ownerName() { return "word-decoder"; }

  applyKey(detail) {
    // The keyboard is shared, so only keys addressed here are acted on
    if (detail.owner !== this.ownerName) return;
    if (detail.kind === "clear") { this.clearStrip(); return; }
    if (!this.activeCell || !this.activeCell.isConnected) return;
    const input = this.activeCell.querySelector(".slot-input");

    if (detail.kind === "backspace") {
      if (this.cellIsFilled(this.activeCell)) {
        this.clearCell(this.activeCell);
      } else {
        const target = this.nextFilled(input, 1);
        if (target) { this.clearCell(target.closest(".slot-cell")); target.focus(); this.activeCell = target.closest(".slot-cell"); }
      }
      this.refreshClear();
      return;
    }

    if (detail.kind === "wildcard") {
      this.writeCell(this.activeCell, { wildcard: detail.wildcard });
    } else if (detail.kind === "rasm") {
      this.writeCell(this.activeCell, { rasm: detail.char, dots: detail.dots, matches: detail.matches });
    } else {
      this.writeCell(this.activeCell, { char: detail.char });
    }
    this.advance(input);
  }

  // ==================== reading and writing a cell ====================

  // A cell holds exactly one of: a letter in the field, or a mark drawn over
  // it. The field stays empty under a mark so the caret still shows and
  // typing replaces the mark.
  writeCell(cell, content) {
    const input = cell.querySelector(".slot-input");
    const existing = cell.querySelector(".slot-mark");
    if (existing) existing.remove();

    if (content.char) {
      input.value = content.char;
      this.forgetMark(cell);
      return;
    }

    input.value = "";
    if (content.wildcard) {
      const symbol = (window.LQ_KEYBOARD_LAYOUT.wildcards[content.wildcard] || {}).symbol || "*";
      cell.dataset.wildcard = content.wildcard;
      delete cell.dataset.rasm;
      cell.insertAdjacentHTML("beforeend",
        `<span class="slot-mark" data-wildcard="${content.wildcard}" aria-hidden="true">${this.escape(symbol)}</span>`);
    } else if (content.rasm) {
      cell.dataset.rasm = content.rasm;
      cell.dataset.dots = content.dots || "";
      cell.dataset.matches = (content.matches || []).join(" ");
      delete cell.dataset.wildcard;
      const dots = content.dots === "either"
        ? '<span class="dot-mark">*</span><span class="dot-mark">*</span>'
        : '<span class="dot-mark">*</span>';
      cell.insertAdjacentHTML("beforeend",
        `<span class="slot-mark" data-dots="${this.escape(content.dots || "")}" aria-hidden="true">${this.escape(content.rasm)}${dots}</span>`);
    }
    this.refreshClear();
  }

  clearCell(cell) {
    cell.querySelector(".slot-input").value = "";
    this.forgetMark(cell);
  }

  cellIsFilled(cell) {
    return Boolean(cell.querySelector(".slot-input").value.trim() || cell.querySelector(".slot-mark"));
  }

  // ==================== moving between cells ====================

  inputs() {
    return Array.from(this.stripTarget.querySelectorAll(".slot-input"));
  }

  move(input, step) {
    const all = this.inputs();
    const next = all[all.indexOf(input) + step];
    if (next) next.focus();
  }

  // Typing past the last slot grows the strip, so a longer word needs no setup
  advance(input) {
    const all = this.inputs();
    const index = all.indexOf(input);
    if (index < all.length - 1) {
      all[index + 1].focus();
      this.activeCell = all[index + 1].closest(".slot-cell");
    } else {
      this.stripTarget.insertAdjacentHTML("beforeend", this.slotHtml() + this.gapHtml(false));
      this.refreshGaps();
      const created = this.inputs()[index + 1];
      if (created) { created.focus(); this.activeCell = created.closest(".slot-cell"); }
    }
    this.refreshClear();
  }

  nextFilled(input, step) {
    const all = this.inputs();
    for (let index = all.indexOf(input) + step; index >= 0 && index < all.length; index += step) {
      if (this.cellIsFilled(all[index].closest(".slot-cell"))) return all[index];
    }
    return null;
  }

  // ==================== the Clear button ====================

  isDirty() {
    if (this.stripTarget.querySelectorAll(".slot").length !== this.slotsValue) return true;
    if (this.stripTarget.querySelector(".slot-mark")) return true;
    if (this.stripTarget.querySelector('.gap-join:not([data-join="separate"])')) return true;
    return this.inputs().some((input) => input.value.trim() !== "");
  }

  refreshClear() {
    const dirty = this.isDirty();
    this.clearTarget.hidden = !dirty;
    // The keyboard carries its own Clear, so it is told when the strip changes
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:state", { detail: { canClear: dirty } }));
  }

  // ==================== the pattern ====================

  // Reads the strip into the shape the endpoint is given. Slots come out in
  // reading order, and the joins come out as one entry per gap between them.
  readPattern() {
    const slots = Array.from(this.stripTarget.querySelectorAll(".slot")).map((slot) => {
      const cells = Array.from(slot.querySelectorAll(".slot-cell"));
      const wildcard = cells.find((cell) => cell.dataset.wildcard);
      if (wildcard) return { kind: wildcard.dataset.wildcard };

      const rasm = cells.find((cell) => cell.dataset.rasm);
      if (rasm) {
        return {
          kind: "rasm",
          shape: rasm.dataset.rasm,
          dots: rasm.dataset.dots || null,
          matches: rasm.dataset.matches ? rasm.dataset.matches.split(" ") : []
        };
      }

      const letters = cells
        .map((cell) => cell.querySelector(".slot-input").value.trim())
        .filter(Boolean);
      if (letters.length === 0) return { kind: "empty" };
      return { kind: letters.length > 1 ? "alternatives" : "letter", letters };
    });

    const joins = Array.from(this.stripTarget.querySelectorAll(".gap-join"))
      .map((join) => join.dataset.join);

    return { slots, joins };
  }

  // A one-line form of the pattern, for the header and for logging
  patternText(pattern) {
    const wildcards = (window.LQ_KEYBOARD_LAYOUT || {}).wildcards || {};
    return pattern.slots.map((slot) => {
      if (slot.kind === "letter") return slot.letters[0];
      if (slot.kind === "alternatives") return `[${slot.letters.join("")}]`;
      if (slot.kind === "rasm") return slot.shape + "*";
      if (slot.kind === "any") return (wildcards.any || {}).symbol || "٭";
      if (slot.kind === "many") return (wildcards.many || {}).symbol || "…";
      return "";
    }).join("");
  }

  // ==================== searching ====================

  submit(event) {
    if (event) event.preventDefault();
    const pattern = this.readPattern();
    const described = pattern.slots.filter((slot) => slot.kind !== "empty");
    if (described.length === 0) return;

    this.dismissKeyboard();
    this.lastPattern = pattern;
    this.runSearch(null);
  }

  // Matches the Rails route this page expects:
  //   GET /word_decoder/results?pattern=<json>&q=<readable form>&expand=<key>
  runSearch(expansion) {
    const pattern = this.lastPattern;
    if (!pattern) return;

    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: {
        pattern: JSON.stringify(pattern),
        q: this.patternText(pattern),
        expand: expansion || ""
      },
      // No backend yet: returning false from beforeSend cancels the request and
      // the page is fed sample data instead. Delete beforeSend once the route
      // exists; success already handles the real response shape.
      beforeSend: () => { this.receive(window.LQ_DECODER_RESULTS, expansion); return false; },
      success: (response) => this.receive(response, expansion),
      error: () => this.showError()
    });
  }

  receive(results, expansion) {
    this.results = results;
    this.activeExpansion = expansion || null;
    this.emptyStateTarget.hidden = true;
    this.errorTarget.hidden = true;
    this.resultsTarget.hidden = false;

    const totals = results.totals || {};
    this.recordCountTarget.textContent = totals.records || 0;
    this.dictionaryCountTarget.textContent = totals.dictionaries || 0;

    this.renderPattern();
    this.renderExpansions();
    this.renderResults();
  }

  // A failure gets its own element, so it is not overwritten the next time the
  // language sweep rewrites the empty-state copy.
  showError() {
    this.errorTarget.hidden = false;
    this.emptyStateTarget.hidden = true;
    this.resultsTarget.hidden = true;
  }

  // ==================== rendering ====================

  // The pattern is shown slot by slot rather than as a string, so the reader
  // recognises the shape they described.
  renderPattern() {
    if (!this.results) return;
    const pattern = this.readPattern();
    const wildcards = (window.LQ_KEYBOARD_LAYOUT || {}).wildcards || {};
    this.patternTarget.innerHTML = pattern.slots
      .filter((slot) => slot.kind !== "empty")
      .map((slot) => {
        if (slot.kind === "letter") return `<span class="pattern-slot" data-kind="letter">${this.escape(slot.letters[0])}</span>`;
        if (slot.kind === "alternatives") return `<span class="pattern-slot" data-kind="alternatives">${this.escape(slot.letters.join("/"))}</span>`;
        if (slot.kind === "rasm") return `<span class="pattern-slot" data-kind="rasm">${this.escape(slot.shape)}*</span>`;
        const symbol = (wildcards[slot.kind] || {}).symbol || "*";
        return `<span class="pattern-slot" data-kind="${slot.kind}">${this.escape(symbol)}</span>`;
      }).join("");
  }

  renderExpansions() {
    const expansions = (this.results && this.results.expansions) || [];
    const labels = {
      pronunciation: this.translate("expandPronunciation", "Similar pronunciation"),
      rika: this.translate("expandRika", "Rika script"),
      divani: this.translate("expandDivani", "Divani script")
    };
    this.expansionRowTarget.innerHTML =
      `<span class="expansion-label" data-i18n="expandLabel">${this.escape(this.translate("expandLabel", "Expand search"))}</span>` +
      expansions.map((expansion) => `
        <button type="button" class="btn expansion-chip${expansion.key === this.activeExpansion ? " active" : ""}"
                data-expansion="${this.escape(expansion.key)}"
                aria-pressed="${expansion.key === this.activeExpansion}"
                data-action="click->word-decoder#toggleExpansion">
          ${this.escape(labels[expansion.key] || expansion.key)}
          ${expansion.count ? `<span class="expansion-count">+${this.escape(expansion.count)}</span>` : ""}
        </button>`).join("");
  }

  // The chips are alternatives, so turning one on turns the others off
  toggleExpansion(event) {
    const chip = event.currentTarget;
    const wasActive = chip.classList.contains("active");
    this.expansionRowTarget.querySelectorAll(".expansion-chip").forEach((other) => {
      other.classList.remove("active");
      other.setAttribute("aria-pressed", "false");
    });
    if (!wasActive) {
      chip.classList.add("active");
      chip.setAttribute("aria-pressed", "true");
    }
    this.runSearch(wasActive ? null : chip.dataset.expansion);
  }

  renderResults() {
    if (!this.results) return;
    const table = this.resultsTableTarget;
    table.querySelectorAll("tbody.result-group").forEach((body) => body.remove());
    this.results.groups.forEach((group) => {
      table.insertAdjacentHTML("beforeend", this.groupHtml(group));
    });
    window.LQ.refreshDynamicContent(table);
  }

  groupHtml(group) {
    // Looked up by comparing the attribute, so a group key never has to be
    // safe to put inside a selector.
    const copy = Array.from(this.groupCopyTarget.children)
      .find((element) => element.dataset.group === group.key);
    const title = copy ? copy.textContent.trim() : group.key;
    const bodyId = `decoder-group-${this.escape(group.key)}`;
    const candidates = this.groupByCandidate(group.rows);

    const body = candidates.length === 0
      ? `<tr class="group-empty"><td colspan="6"><span>${this.escape(this.translate("decoderEmptyGroup", "No candidate readings in this section."))}</span></td></tr>`
      : candidates.map((candidate) => this.candidateHtml(candidate)).join("");

    return `
      <tbody class="result-group" id="${bodyId}">
        <tr class="group-header">
          <th colspan="6" scope="colgroup">
            <button type="button" class="btn group-toggle" aria-expanded="true" aria-controls="${bodyId}"
                    data-action="click->word-decoder#toggleGroup">
              <span class="group-chevron"><i data-feather="chevron-down"></i></span>
              <span class="group-title">${this.escape(title)}</span>
              <span class="group-count">${group.rows.length}</span>
            </button>
          </th>
        </tr>
        ${body}
      </tbody>`;
  }

  // One candidate reading, with every record that supports it. Order of first
  // appearance is kept, so the server decides the ranking.
  groupByCandidate(rows) {
    const order = [];
    const byKey = {};
    rows.forEach((row) => {
      const key = `${row.candidateOttoman}␟${row.candidateLatin}`;
      if (!byKey[key]) {
        byKey[key] = { ottoman: row.candidateOttoman, latin: row.candidateLatin, rows: [] };
        order.push(key);
      }
      byKey[key].rows.push(row);
    });
    return order.map((key) => byKey[key]);
  }

  // A candidate with one record is a plain row; there is nothing to expand.
  candidateHtml(candidate) {
    if (candidate.rows.length === 1) return this.rowHtml(candidate, candidate.rows[0], false);

    const dictionaries = new Set(candidate.rows.map((row) => row.dictionary)).size;
    const id = `candidate-${Math.random().toString(36).slice(2, 9)}`;

    return `
      <tr class="candidate-header" data-candidate="${id}">
        <th colspan="6" scope="colgroup">
          <button type="button" class="candidate-toggle" aria-expanded="false"
                  data-action="click->word-decoder#toggleCandidate">
            <span class="candidate-chevron"><i data-feather="chevron-down"></i></span>
            <span class="word-pair">
              <span class="word-ottoman"><span class="word-box ottoman-box" data-direction="rtl">${this.escape(candidate.ottoman)}</span></span>
              <span class="word-latin"><span class="word-box latin-box">${this.escape(candidate.latin)}</span></span>
            </span>
            <span class="candidate-meta">
              <b>${candidate.rows.length}</b> ${this.escape(this.translate("decoderRecords", "Records"))}
              &nbsp;·&nbsp;
              <b>${dictionaries}</b> ${this.escape(this.translate("decoderDictionaries", "Dictionaries"))}
            </span>
          </button>
        </th>
      </tr>
      ${candidate.rows.map((row) => this.rowHtml(candidate, row, true, id)).join("")}`;
  }

  rowHtml(candidate, row, nested, candidateId) {
    return `
      <tr class="result-row${nested ? " is-nested" : ""}" data-category="${this.escape(row.category)}"
          ${candidateId ? `data-belongs-to="${candidateId}"` : ""} ${nested ? "hidden" : ""}>
        <td>
          <div class="word-pair">
            <span class="word-ottoman"><span class="word-box ottoman-box" data-direction="rtl">${this.escape(candidate.ottoman)}</span></span>
            <span class="word-latin"><span class="word-box latin-box">${this.escape(candidate.latin)}</span></span>
          </div>
        </td>
        <td class="text-center"><span class="category-badge">${this.escape(this.categoryLabel(row.category))}</span></td>
        <td class="text-center"><i class="row-arrow" data-feather="arrow-right"></i></td>
        <td class="headword-cell">
          <div class="word-pair">
            <span class="word-ottoman"><span class="word-box ottoman-box" data-direction="rtl">${this.escape(row.headwordOttoman)}</span></span>
            <span class="word-latin"><span class="word-box latin-box">${this.escape(row.headwordLatin)}</span></span>
          </div>
        </td>
        <td class="dictionary-cell">
          <div class="dictionary-name">${this.escape(window.LQ.dictionaryLabel(row.dictionary))}</div>
          ${row.page ? `<div class="dictionary-page">${this.escape(this.translate("colPage", "Page"))} ${this.escape(row.page)}</div>` : ""}
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn cite-button" data-action="click->word-decoder#cite"
                    data-cite-latin="${this.escape(candidate.latin)}"
                    data-cite-ottoman="${this.escape(candidate.ottoman)}"
                    data-cite-dictionary="${this.escape(row.dictionary)}"
                    data-cite-page="${this.escape(row.page)}"
                    aria-label="${this.escape(this.translate("cite", "Cite"))}: ${this.escape(candidate.latin)}">
              <i data-feather="clipboard"></i>
            </button>
            <!-- Staff only: editing a stored reading, as opposed to a reader
                 suggesting a correction. Restrict this when permissions land. -->
            <button type="button" class="btn cite-button admin-only" data-action="click->word-decoder#editEntry"
                    aria-label="${this.escape(this.translate("editEntry", "Edit entry"))}">
              <i data-feather="edit-2"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }

  cite(event) {
    const { citeLatin, citeOttoman, citeDictionary, citePage } = event.currentTarget.dataset;
    // The citation window answers this; it lives on the page once and serves
    // both the search results and the Word Decoder.
    document.dispatchEvent(new CustomEvent("citation:open", {
      detail: {
        latin: citeLatin,
        ottoman: citeOttoman,
        dictionary: citeDictionary,
        page: citePage
      }
    }));
  }

  editEntry() {
    // Placeholder for the staff editing screen.
  }

  toggleCandidate(event) {
    const button = event.currentTarget;
    const header = button.closest(".candidate-header");
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    header.classList.toggle("is-open", open);
    header.closest("tbody")
      .querySelectorAll(`[data-belongs-to="${header.dataset.candidate}"]`)
      .forEach((row) => { row.hidden = !open; });
  }

  // Bootstrap's collapse does not apply to a tbody, so the group toggle hides
  // its own rows through a class instead.
  toggleGroup(event) {
    const button = event.currentTarget;
    const body = button.closest("tbody");
    const collapsed = body.classList.toggle("is-collapsed");
    button.setAttribute("aria-expanded", String(!collapsed));
  }

  // ==================== helpers ====================

  categoryLabel(category) {
    const labels = { ENTRY: "catEntry", SUBENTRY: "catSubentry", RELATED: "catRelated" };
    const fallbacks = { ENTRY: "Headword", SUBENTRY: "Subheadword", RELATED: "Related" };
    return this.translate(labels[category], fallbacks[category] || category);
  }

  translate(key, fallback) { return window.LQ.translate(key, fallback); }

  escape(value) { return window.LQ.escape(value); }
}

application.register("word-decoder", WordDecoderController);
