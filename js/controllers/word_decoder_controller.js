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

// The characters that mean "a letter I cannot read" on the reader's own
// keyboard: the star they have, and the Arabic one they may be typing.
const WILDCARD_KEYS = ["*", "\u066D"];

class WordDecoderController extends Stimulus.Controller {
  static targets = [
    "strip", "clear", "rowHint", "results", "resultsTable", "pattern",
    "recordCount", "dictionaryCount", "expansionRow", "error", "groupCopy"
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

    // The view switcher asks for one of the main page's screens. A reviewing
    // aid: this listener comes out with the switcher.
    this.onViewState = (event) => this.showViewState(event.detail.state);
    document.addEventListener("view-state:change", this.onViewState);

    // The keyboard covers the row, so the two Clear buttons take turns: the
    // panel's while it is open, this one once it is closed.
    this.onKeyboardOpen = (event) => {
      if (event.detail.owner !== this.ownerName) return;
      this.keyboardOpen = true;
      this.hideRowHint();
      this.refreshClear();
    };
    this.onKeyboardClosed = () => {
      this.keyboardOpen = false;
      // The press that closed the keyboard is still on its way to whatever it
      // was aimed at. Letting the row's Clear back in now would move the row
      // out from under the cursor and the press would land on nothing, so the
      // row is left as it is until the finger comes up.
      if (this.pointerDown) { this.clearPending = true; return; }
      this.refreshClear();
    };
    this.onPointerDown = () => { this.pointerDown = true; };
    this.onPointerUp = () => {
      this.pointerDown = false;
      if (!this.clearPending) return;
      this.clearPending = false;
      this.refreshClear();
    };
    document.addEventListener("pointerdown", this.onPointerDown, true);
    document.addEventListener("pointerup", this.onPointerUp, true);
    document.addEventListener("ottoman-keyboard:request", this.onKeyboardOpen);
    document.addEventListener("ottoman-keyboard:closed", this.onKeyboardClosed);
    // The search bar has a keyboard of its own; the row's hint stays away
    // while either is on screen.
    this.onOtherKeyboard = () => this.hideRowHint();
    document.addEventListener("search-keyboard:request", this.onOtherKeyboard);
  }

  // The reference mock fills the row with the guide's worked example whenever
  // the page is shown in a searched state, and empties it otherwise. The row
  // holds exactly the four letters of that example there, with no spare box
  // trailing it, and the search has already been run: the reader arriving in
  // that state sees what the description found.
  showViewState(state) {
    if (state === "results" || state === "no-results") {
      const described = [{ char: "ح" }, { char: "ا" }, { wildcard: "any" }, { char: "ر" }];
      this.buildStrip(described.length);
      const cells = Array.from(this.stripTarget.querySelectorAll(".slot-cell"));
      described.forEach((content, index) => {
        if (cells[index]) this.writeCell(cells[index], content);
      });
      this.lastPattern = this.readPattern();
      this.runSearch(null);
    } else {
      this.clearStrip();
      this.results = null;
      this.lastPattern = null;
      this.resultsTarget.hidden = true;
      this.errorTarget.hidden = true;
    }
    this.refreshClear();
  }

  disconnect() {
    document.removeEventListener("ottoman-keyboard:key", this.onKey);
    document.removeEventListener("ottoman-keyboard:request", this.onKeyboardOpen);
    document.removeEventListener("ottoman-keyboard:closed", this.onKeyboardClosed);
    document.removeEventListener("search-keyboard:request", this.onOtherKeyboard);
    document.removeEventListener("pointerdown", this.onOutside);
    document.removeEventListener("pointerdown", this.onPointerDown, true);
    document.removeEventListener("pointerup", this.onPointerUp, true);
    document.removeEventListener("language:changed", this.onLanguageChange);
    document.removeEventListener("view-state:change", this.onViewState);
    window.LQ.disposeTooltips(this.element);
  }

  // The strip's tooltips are written once, so their text is replaced in place
  // rather than rebuilding the strip and losing what the reader has entered.
  relabelStrip() {
    const labels = [
      [".cell-add", "decoderAddAlternative", "Alternative letter"],
      [".cell-remove", "decoderRemoveAlternative", "Delete only this box"],
      [".gap-insert", "decoderInsertSlot", "Add new box"]
    ];
    labels.forEach(([selector, key, fallback]) => {
      this.stripTarget.querySelectorAll(selector).forEach((element) => {
        this.setTooltip(element, this.translate(key, fallback));
      });
    });
    this.stripTarget.querySelectorAll(".gap-join").forEach((join) => {
      this.setTooltip(join, this.joinLabel(join.dataset.join));
    });
    this.stripTarget.querySelectorAll(".slot").forEach((slot) => this.relabelSlotRemove(slot));
  }

  // A Bootstrap tooltip is not read out, so the same words are also the
  // control's accessible name.
  setTooltip(element, text) {
    element.setAttribute("data-bs-title", text);
    element.setAttribute("aria-label", text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    const tooltip = bootstrap.Tooltip.getInstance(element);
    if (tooltip) tooltip.setContent({ ".tooltip-inner": text });
  }

  // ==================== building the strip ====================

  buildStrip(count = this.slotsValue) {
    const parts = [this.gapHtml(false)];
    for (let index = 0; index < count; index += 1) {
      parts.push(this.slotHtml());
      parts.push(this.gapHtml(index < count - 1));
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
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.slotRemoveLabel(1))}"
                aria-label="${this.escape(this.slotRemoveLabel(1))}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
        </button>
      </div>`;
  }

  cellHtml(char = "") {
    return `
      <div class="slot-cell">
        <button type="button" class="btn cell-action cell-add" data-action="click->word-decoder#addAlternative"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderAddAlternative", "Alternative letter"))}"
                aria-label="${this.escape(this.translate("decoderAddAlternative", "Alternative letter"))}">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><line x1="5" y1="1" x2="5" y2="9" stroke="white" stroke-width="2.5" stroke-linecap="round"></line><line x1="1" y1="5" x2="9" y2="5" stroke="white" stroke-width="2.5" stroke-linecap="round"></line></svg>
        </button>
        <button type="button" class="btn cell-action cell-remove" data-action="click->word-decoder#removeAlternative"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderRemoveAlternative", "Delete only this box"))}"
                aria-label="${this.escape(this.translate("decoderRemoveAlternative", "Delete only this box"))}">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><line x1="2" y1="2" x2="8" y2="8" stroke="white" stroke-width="2.5" stroke-linecap="round"></line><line x1="8" y1="2" x2="2" y2="8" stroke="white" stroke-width="2.5" stroke-linecap="round"></line></svg>
        </button>
        <input type="text" class="slot-input" maxlength="1" spellcheck="false" value="${this.escape(char)}"
               data-direction="rtl" aria-label="${this.escape(this.translate("decoderLetter", "Letter"))}"
               data-action="focus->word-decoder#openKeyboard click->word-decoder#openKeyboard keydown->word-decoder#handleKey input->word-decoder#handleInput">
      </div>`;
  }

  // A gap always offers to insert a letter here; only the gaps between two
  // letters carry a join marker.
  gapHtml(withJoin) {
    return `
      <div class="gap">
        <button type="button" class="btn gap-insert" data-action="click->word-decoder#insertSlot"
                data-bs-toggle="tooltip" data-bs-title="${this.escape(this.translate("decoderInsertSlot", "Add new box"))}"
                aria-label="${this.escape(this.translate("decoderInsertSlot", "Add new box"))}"><span class="gap-plus">+</span></button>
        ${withJoin ? this.joinHtml() : ""}
      </div>`;
  }

  joinHtml() {
    return `
      <button type="button" class="btn gap-join can-hover" data-join="separate"
              data-action="pointerdown->word-decoder#cycleJoin
                           pointerleave->word-decoder#restoreJoinHover"
              data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-html="true"
              data-bs-title="${this.escape(this.joinLabel("separate"))}"
              aria-label="${this.escape(this.joinSpoken("separate"))}">
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

  // The button under a box takes the whole box away, and a box that has been
  // given alternatives takes all of them, so it says which it is.
  slotRemoveLabel(count) {
    return count > 1
      ? this.translate("decoderRemoveSlotAll", "Delete all boxes")
      : this.translate("decoderRemoveSlot", "Delete box");
  }

  relabelSlotRemove(slot) {
    const button = slot.querySelector(".slot-remove");
    if (!button) return;
    this.setTooltip(button, this.slotRemoveLabel(slot.querySelectorAll(".slot-cell").length));
  }

  // A press of the plus is a field the reader asked for, so it stays even if
  // they leave it empty: leaving one empty is how a box is made to stand for
  // "this letter, or nothing".
  addAlternative(event) {
    this.openAlternative(event.currentTarget.closest(".slot-cell"), false);
  }

  // The word is written from the right, so an alternative offered from a box
  // opens on that box's left, the way the old site opens it: the new field
  // goes in front of the one it was offered from, and takes the caret. It is
  // marked as just opened, which is what makes the next letter open another;
  // `offered` says the board opened it rather than the reader, and only such a
  // field is swept up when the reader moves on.
  openAlternative(cell, offered) {
    if (!cell) return;
    const frame = cell.closest(".slot-frame");
    cell.insertAdjacentHTML("beforebegin", this.cellHtml());
    const fresh = cell.previousElementSibling;
    if (fresh) {
      fresh.dataset.autoExpand = "1";
      if (offered) fresh.dataset.offered = "1";
    }
    window.LQ.refreshDynamicContent(frame);
    this.relabelSlotRemove(frame.closest(".slot"));
    const input = fresh && fresh.querySelector(".slot-input");
    if (input) { input.focus(); this.activeCell = fresh; }
  }

  // Where the caret goes once something has been written. On the old site a
  // box opened by the plus keeps offering: write into it -- a letter, a
  // skeleton, a wildcard, it makes no difference there -- and the next empty
  // alternative is already open and waiting, so a reader listing the letters
  // a shape might be never reaches for the plus again. Everywhere else the
  // caret simply moves along the strip.
  afterWrite(input) {
    const cell = input.closest(".slot-cell");
    if (cell && cell.dataset.autoExpand) {
      delete cell.dataset.autoExpand;
      this.openAlternative(cell, true);
      return;
    }
    this.advance(input);
  }

  // The field the board opened and the reader never used is taken back the
  // moment they move on, so a box that was filled through the plus is left
  // holding only the letters they wrote. A field the reader opened themselves
  // is never taken back, which is how an empty alternative can be kept on
  // purpose. `keep` is the box the caret is moving into, and is left alone.
  sweepOffered(keep) {
    this.stripTarget.querySelectorAll(".slot").forEach((slot) => {
      if (slot === keep) return;
      const cells = Array.from(slot.querySelectorAll(".slot-cell"));
      if (cells.length < 2) return;
      cells.forEach((cell) => {
        if (!cell.dataset.offered || this.cellIsFilled(cell)) return;
        if (slot.querySelectorAll(".slot-cell").length < 2) return;
        window.LQ.disposeTooltips(cell);
        cell.remove();
      });
      this.relabelSlotRemove(slot);
    });
  }

  removeAlternative(event) {
    const cell = event.currentTarget.closest(".slot-cell");
    const frame = cell.closest(".slot-frame");
    window.LQ.disposeTooltips(cell);
    cell.remove();
    this.relabelSlotRemove(frame.closest(".slot"));
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
  // ==================== the chains ====================

  // What a box can be joined to, as the joining classes of the letters it
  // could hold: one class for a letter, several for a box that offers a
  // choice or wears a skeleton, all three for a wildcard, which could be any
  // letter at all. A box with nothing in it answers nothing.
  joinTypes(slot) {
    const classes = (window.LQ_KEYBOARD_LAYOUT || {}).joining || {};
    const typeOf = (letter) => {
      if ((classes.dual || "").includes(letter)) return "dual";
      if ((classes.right || "").includes(letter)) return "right";
      if ((classes.none || "").includes(letter)) return "none";
      return "dual";
    };
    if (!slot || slot.kind === "empty") return null;
    if (slot.kind === "any" || slot.kind === "many") return ["dual", "right", "none"];
    const letters = slot.kind === "rasm" ? (slot.matches || []) : (slot.letters || []);
    if (letters.length === 0) return ["dual", "right", "none"];
    return [...new Set(letters.map(typeOf))];
  }

  // The chain between two boxes, read off the letters themselves. A letter is
  // written on to the one before it when that one carries a join and it is
  // not the hamze, which stands alone. Where every letter the two boxes could
  // hold answers the same way the chain says so; where they disagree -- a
  // wildcard beside a letter, a skeleton that stands for both kinds -- the
  // chain says it does not know, which is the question mark.
  deriveJoin(previous, next) {
    const before = this.joinTypes(previous);
    const after = this.joinTypes(next);
    if (!before || !after) return "separate";
    let joins = false;
    let parts = false;
    before.forEach((a) => after.forEach((b) => {
      if (a === "dual" && b !== "none") joins = true; else parts = true;
    }));
    if (joins && !parts) return "connected";
    if (!joins) return "separate";
    return "uncertain";
  }

  // Every chain the reader has not taken over is set from the boxes it sits
  // between, after each change to the strip. A chain the reader has pressed
  // is theirs from then on: they may know something about the hand that the
  // letters do not say.
  refreshJoins() {
    if (!this.hasStripTarget) return;
    const slots = this.readSlots();
    const chains = Array.from(this.stripTarget.querySelectorAll(".gap-join"));
    chains.forEach((chain, index) => {
      if (chain.dataset.manual) return;
      const state = this.deriveJoin(slots[index], slots[index + 1]);
      if (chain.dataset.join === state) return;
      chain.dataset.join = state;
      this.setTooltip(chain, this.joinLabel(state));
    });
  }

  cycleJoin(event) {
    // Keeps focus in the letter field rather than moving it to this button
    event.preventDefault();
    const button = event.currentTarget;
    const order = ["separate", "connected", "uncertain"];
    const next = order[(order.indexOf(button.dataset.join) + 1) % order.length];
    button.dataset.join = next;
    // From the first press the chain is the reader's, and the board stops
    // setting it from the letters.
    button.dataset.manual = "1";
    // The rings have just been set; the hover preview would argue with them
    // while the hand is still there, so it waits until the hand has left.
    button.classList.remove("can-hover");

    this.setTooltip(button, this.joinLabel(next));

    // Whether two boxes were written together is part of what was asked for,
    // so a search already on the page is answering an older question: it is
    // asked again, and the pattern shown over the results is set from the
    // chains as they stand.
    if (this.results) {
      this.lastPattern = this.readPattern();
      this.runSearch(this.activeExpansion || null);
    }
  }

  restoreJoinHover(event) {
    event.currentTarget.classList.add("can-hover");
  }

  // What the rings say now, and under it, in small type, that a press changes
  // it -- as the reference words it.
  joinLabel(state) {
    const labels = {
      separate: ["joinSeparate", "Letters separate"],
      connected: ["joinConnected", "Letters connected"],
      uncertain: ["joinUncertain", "Uncertain"]
    };
    const [key, fallback] = labels[state] || labels.separate;
    return `${this.escape(this.translate(key, fallback))}` +
      `<span class="join-tip-change">${this.escape(this.translate("joinChange", "Click to change"))}</span>`;
  }

  // The tooltip carries two lines; a reader who hears it gets the first.
  joinSpoken(state) {
    return this.joinLabel(state).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  // Both Clear buttons do the same work; they differ in what is left behind.
  // The row's own one closed the keyboard on purpose, so it stays closed.
  clearStrip() {
    this.resetStrip();
    this.dismissKeyboard();
  }

  // The panel's Clear is pressed with the keyboard open, so it stays open and
  // the caret goes back to the first box, ready for the next attempt.
  clearFromKeyboard() {
    this.resetStrip();
    const first = this.stripTarget.querySelector(".slot-input");
    if (first) {
      first.focus();
      this.activeCell = first.closest(".slot-cell");
    }
  }

  resetStrip() {
    window.LQ.disposeTooltips(this.stripTarget);
    this.buildStrip();
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
        // Backspace reaches back over the empty boxes to the last letter
        // written; Delete reaches forward. The strip is read right to left,
        // so "back" is the box before this one in the row's own order.
        const step = event.key === "Backspace" ? -1 : 1;
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

    // The star on the reader's own keyboard writes the same mark the star on
    // the board writes, drawn rather than typed: a letter I cannot read.
    if (WILDCARD_KEYS.includes(event.key)) {
      event.preventDefault();
      this.writeWildcard(input, "any");
      return;
    }

    const letter = this.letterFor(event.key, event.shiftKey, event.altKey);
    if (!letter) return;
    event.preventDefault();
    this.writeCell(input.closest(".slot-cell"), { char: letter });
    // The key that writes this letter is shown going down on the on-screen
    // keyboard as well, so the two boards read as one.
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:echo", { detail: { char: letter } }));
    this.afterWrite(input);
  }

  // A wildcard written into the box the caret is in, from wherever it came:
  // the board's own key, the reader's keyboard, or a paste.
  writeWildcard(input, name) {
    this.writeCell(input.closest(".slot-cell"), { wildcard: name });
    // The key that writes it is shown going down on the board as well, so the
    // two read as one.
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:echo", { detail: { wildcard: name } }));
    this.afterWrite(input);
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

  // A letter that reaches the field without passing through the key handler --
  // pasted, or typed on a board that writes Ottoman itself -- takes the same
  // road afterwards as one written from a key: it clears whatever mark was
  // there, and the caret moves on exactly as it would have.
  handleInput(event) {
    const input = event.currentTarget;
    const cell = input.closest(".slot-cell");
    // A star that arrives any other way -- pasted, or from a board that
    // writes it itself -- becomes the same drawn mark.
    if (WILDCARD_KEYS.includes(input.value)) {
      input.value = "";
      this.writeWildcard(input, "any");
      return;
    }
    if (input.value) { this.forgetMark(cell); delete cell.dataset.offered; }
    this.refreshClear();
    if (!input.value) return;
    this.afterWrite(input);
  }

  // Everything that made a cell a wildcard or a skeleton, cleared together
  forgetMark(cell) {
    const mark = cell.querySelector(".slot-mark");
    if (mark) mark.remove();
    delete cell.dataset.wildcard;
    delete cell.dataset.rasm;
    delete cell.dataset.dots;
    delete cell.dataset.matches;
    delete cell.dataset.mark;
  }

  // ==================== the on-screen keyboard ====================

  // The keyboard opens under the row of boxes and stays there: it belongs to
  // the row, not to the box that happened to be pressed, and a panel that
  // jumped sideways with every box would be read as a new panel each time.
  openKeyboard(event) {
    const cell = event.currentTarget.closest(".slot-cell");
    // Moving to another box gives up the field the board was still offering
    this.sweepOffered(cell && cell.closest(".slot"));
    this.activeCell = cell;
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:request", {
      detail: {
        anchor: this.stripTarget,
        // The boxes carry the join rings and the add and remove buttons
        // underneath, so the panel starts below the whole row.
        below: this.stripTarget,
        // The row the panel serves: the boxes, Clear and Search. A keyboard
        // over any of it is a keyboard in the way of its own work, so the
        // panel is never placed there and cannot be parked there either.
        guard: this.element.querySelector(".decoder-row"),
        canClear: this.isDirty(),
        owner: this.ownerName
      }
    }));
  }

  dismissKeyboard() {
    this.sweepOffered(null);
    this.activeCell = null;
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:dismiss"));
  }

  get ownerName() { return "word-decoder"; }

  applyKey(detail) {
    // The keyboard is shared, so only keys addressed here are acted on
    if (detail.owner !== this.ownerName) return;
    if (detail.kind === "clear") { this.clearFromKeyboard(); return; }
    if (!this.activeCell || !this.activeCell.isConnected) return;
    const input = this.activeCell.querySelector(".slot-input");

    if (detail.kind === "backspace") {
      if (this.cellIsFilled(this.activeCell)) {
        this.clearCell(this.activeCell);
      } else {
        // The box under the caret is empty, so the key takes the last letter
        // written rather than doing nothing.
        const target = this.nextFilled(input, -1);
        if (target) { this.clearCell(target.closest(".slot-cell")); target.focus(); this.activeCell = target.closest(".slot-cell"); }
      }
      this.refreshClear();
      return;
    }

    if (detail.kind === "wildcard") {
      this.writeCell(this.activeCell, { wildcard: detail.wildcard });
    } else if (detail.kind === "rasm") {
      this.writeCell(this.activeCell, { rasm: detail.char, mark: detail.mark, dots: detail.dots, matches: detail.matches });
    } else {
      this.writeCell(this.activeCell, { char: detail.char });
    }
    this.afterWrite(input);
  }

  // ==================== reading and writing a cell ====================

  // A cell holds exactly one of: a letter in the field, or a mark drawn over
  // it. The field stays empty under a mark so the caret still shows and
  // typing replaces the mark.
  writeCell(cell, content) {
    const input = cell.querySelector(".slot-input");
    const existing = cell.querySelector(".slot-mark");
    if (existing) existing.remove();
    // Once something is written in it, the field is the reader's and is no
    // longer the board's to take back.
    delete cell.dataset.offered;

    if (content.char) {
      input.value = content.char;
      this.forgetMark(cell);
      return;
    }

    input.value = "";
    if (content.wildcard) {
      // The box wears the face the key wore: the star is the same drawn star,
      // in the claret of the box rather than the green of the key. The other
      // wildcard has no drawn face -- its sign is a letter in Georgia -- and
      // falls back to the character the pattern carries.
      const wildcard = window.LQ_KEYBOARD_LAYOUT.wildcards[content.wildcard] || {};
      const face = wildcard.slotMark || wildcard.mark || this.escape(wildcard.symbol || "*");
      cell.dataset.wildcard = content.wildcard;
      delete cell.dataset.rasm;
      cell.insertAdjacentHTML("beforeend",
        `<span class="slot-mark" data-wildcard="${content.wildcard}" aria-hidden="true">${face}</span>`);
    } else if (content.rasm) {
      cell.dataset.rasm = content.rasm;
      cell.dataset.dots = content.dots || "";
      cell.dataset.matches = (content.matches || []).join(" ");
      // Which drawn face it is, so the pattern over the results can wear the
      // same one rather than spelling it out with a typed asterisk.
      if (content.mark) cell.dataset.mark = content.mark; else delete cell.dataset.mark;
      delete cell.dataset.wildcard;
      // The box wears the same drawn face the key wore, so the shape the
      // reader chose and the shape now standing in the box are the same shape.
      const marks = window.LQ_KEYBOARD_MARKS || {};
      const face = content.mark && marks[content.mark]
        ? marks[content.mark] : this.escape(content.rasm);
      cell.insertAdjacentHTML("beforeend",
        `<span class="slot-mark" data-dots="${this.escape(content.dots || "")}" aria-hidden="true">${face}</span>`);
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
      this.sweepOffered(this.activeCell.closest(".slot"));
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

  // The row's own Clear appears only when there is something to clear, and
  // never while the keyboard is open: the panel covers the row, so a button
  // behind it would be one the reader cannot see.
  // Called after every change to the strip, so the chains are read off the
  // letters here as well as the Clear button off whether anything is written.
  refreshClear() {
    this.refreshJoins();
    const dirty = this.isDirty();
    // Its place in the row is kept whether it is on screen or not: a button
    // appearing to the left of the boxes would push them sideways, and a row
    // that moves under the cursor loses the press that was meant for it.
    this.clearTarget.classList.toggle("is-hidden", !dirty || Boolean(this.keyboardOpen));
    // The keyboard carries its own Clear, so it is told when the strip changes
    document.dispatchEvent(new CustomEvent("ottoman-keyboard:state", { detail: { canClear: dirty } }));
  }

  // ==================== the row's hint ====================

  // For a first-time reader: the boxes take the reader's own keyboard too.
  // The keyboard says the same in its own header, so one of them is enough.
  showRowHint() {
    if (this.keyboardOpen) return;
    if (document.querySelector(".search-keyboard.is-open")) return;
    this.rowHintTarget.hidden = false;
  }

  hideRowHint() {
    this.rowHintTarget.hidden = true;
  }

  // ==================== the pattern ====================

  // Reads the strip into the shape the endpoint is given. Slots come out in
  // reading order, and the joins come out as one entry per gap between them.
  // What each box says, in the order the word is written
  readSlots() {
    return Array.from(this.stripTarget.querySelectorAll(".slot")).map((slot) => {
      const cells = Array.from(slot.querySelectorAll(".slot-cell"));
      const wildcard = cells.find((cell) => cell.dataset.wildcard);
      if (wildcard) return { kind: wildcard.dataset.wildcard };

      const rasm = cells.find((cell) => cell.dataset.rasm);
      if (rasm) {
        return {
          kind: "rasm",
          shape: rasm.dataset.rasm,
          mark: rasm.dataset.mark || null,
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
  }

  readPattern() {
    const slots = this.readSlots();
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
    this.resultsTarget.hidden = true;
  }

  // ==================== rendering ====================

  // Boxes the reader has chained as written together are set in one run, so
  // the letters take the shapes they take in a word -- the alif after the ha
  // hanging off it rather than standing beside it. Only plain letters can
  // join: a skeleton or a wildcard wears a drawn face, a box of alternatives
  // wears a chip, and none of those is type to be shaped. A box left empty
  // parts its neighbours, as an empty box does on the board.
  patternRuns(pattern) {
    const runs = [];
    let openRun = null;
    pattern.slots.forEach((slot, index) => {
      if (slot.kind === "empty") { openRun = null; return; }
      const chained = index > 0 && pattern.joins[index - 1] === "connected";
      if (slot.kind === "letter" && chained && openRun) {
        openRun.letters.push(slot.letters[0]);
        return;
      }
      const run = { slot, letters: slot.kind === "letter" ? [slot.letters[0]] : [] };
      runs.push(run);
      openRun = slot.kind === "letter" ? run : null;
    });
    return runs;
  }

  // The pattern is shown slot by slot rather than as a string, so the reader
  // recognises the shape they described.
  renderPattern() {
    if (!this.results) return;
    const pattern = this.readPattern();
    const wildcards = (window.LQ_KEYBOARD_LAYOUT || {}).wildcards || {};
    this.patternTarget.innerHTML = this.patternRuns(pattern)
      .map(({ slot, letters }) => {
        if (slot.kind === "letter") {
          return `<span class="pattern-slot" data-kind="letter">${this.escape(letters.join(""))}</span>`;
        }
        if (slot.kind === "alternatives") {
          // One box offering several letters is drawn as that box: a small
          // chip inside the pill, its letters at the size of every other
          // letter, parted by the line the boxes are parted by.
          return `<span class="pattern-slot" data-kind="alternatives">` +
            slot.letters.map((letter) => `<span>${this.escape(letter)}</span>`).join("") +
            `</span>`;
        }
        if (slot.kind === "rasm") {
          // The skeleton wears the face it wears on the key and in the box --
          // the shape drawn with its asterisk where the dots would be --
          // rather than the shape with a typed asterisk left beside it.
          const marks = window.LQ_KEYBOARD_MARKS || {};
          const face = slot.mark && marks[slot.mark] ? marks[slot.mark] : this.escape(slot.shape);
          return `<span class="pattern-slot" data-kind="rasm">${face}</span>`;
        }
        const mark = wildcards[slot.kind] || {};
        return `<span class="pattern-slot" data-kind="${slot.kind}">${mark.mark || this.escape(mark.symbol || "*")}</span>`;
      }).join("");
  }

  // The pronunciation chip carries an ear, the two script chips a stroke of
  // the hand they are named after: the mark says what the widening reaches
  // for faster than the name does.
  expansionMark(key) {
    if (key === "pronunciation") {
      return `<svg class="expansion-icon is-ear" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C7.03 2 3 6.03 3 11v4c0 1.1.9 2 2 2h2v-6H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-2v6h2c1.1 0 2-.9 2-2v-4c0-4.97-4.03-9-9-9z"></path></svg>`;
    }
    if (key === "rika") {
      return `<svg class="expansion-icon" viewBox="0 0 130 130" aria-hidden="true"><path transform="translate(-10, 12)" d="M19.732,74.393c-0.607,0.406 -0.849,1.04 -0.81,1.85c0.408,0.793 1.107,1.172 2.082,1.157c12.974,-1.2 26.354,-0.762 28.682,-0.754c35.572,0.121 61.243,-13.199 75.535,-37.442c2.94,-4.988 8.93,-14.323 10.564,-20.721c0,0 0.196,-0.929 0.173,-1.221c0.05,-0.465 0.007,-2.148 -0.594,-3.091c-0.583,-0.476 -1.558,-0.295 -1.83,0.197c-5.327,9.436 -13.871,16.548 -24.75,21.974c-21.059,11.957 -42.589,22.7 -64.881,30.648c-7.737,3.091 -15.817,4.927 -24.171,7.402Z" fill="currentColor"></path></svg>`;
    }
    if (key === "divani") {
      return `<svg class="expansion-icon is-large" viewBox="0 -15 40 70" aria-hidden="true"><path transform="translate(0, -5)" d="M26.641,35.701c-0.01,-1.282 -2.556,-3.149 -6.225,-5.275c-1.924,-1.03 -3.034,-2.874 -2.849,-6.014c0.534,-6.47 2.385,-11.677 6.436,-14.771c2.889,-2.451 5.411,-2.033 7.597,1.002c4.058,4.675 3.321,16.873 1.952,20.679c-5.085,14.136 -12.208,20.328 -29.014,20.178c8.985,-2.513 16.214,-6.956 22.104,-15.8Zm-0.791,-9.628c2.441,1.021 2.87,3.568 2.638,6.7c4.269,-7.004 5.493,-12.335 1.794,-15.404c-2.89,-2.474 -6.382,-2.51 -9.337,2.479c-1.396,1.559 -0.267,3.164 1.475,3.966l3.431,2.259Z" fill="currentColor" stroke="currentColor" stroke-width="0.8"></path></svg>`;
    }
    return "";
  }

  renderExpansions() {
    const expansions = (this.results && this.results.expansions) || [];
    const labels = {
      pronunciation: this.translate("soundsLike", "Similar pronunciation"),
      rika: "Rika",
      divani: "Divani"
    };
    this.expansionRowTarget.innerHTML =
      `<span class="expansion-label" data-i18n="expandLabel">${this.escape(this.translate("expandLabel", "Expand search"))}</span>` +
      expansions.map((expansion) => `
        <button type="button" class="btn expansion-chip${expansion.key === this.activeExpansion ? " active" : ""}"
                data-expansion="${this.escape(expansion.key)}"
                aria-pressed="${expansion.key === this.activeExpansion}"
                data-bs-toggle="tooltip" data-bs-html="true"
                data-bs-title="${this.escape(this.expansionNote(expansion.key))}"
                data-action="click->word-decoder#toggleExpansion">
          ${expansion.key === "pronunciation" ? this.expansionMark(expansion.key) : `<span class="expansion-plus" aria-hidden="true">+</span>`}
          ${this.escape(labels[expansion.key] || expansion.key)}
          ${expansion.key === "pronunciation" ? "" : this.expansionMark(expansion.key)}
          ${expansion.count ? `<span class="expansion-count">${this.escape(expansion.count)}</span>` : ""}
        </button>`).join("");
    // The chips are written here rather than in the page, so their tooltips
    // and icons have to be started by hand.
    window.LQ.refreshDynamicContent(this.expansionRowTarget);
  }

  // What each widening actually does, with an example of the letters it will
  // treat as equal. A name like "Rika script" says nothing on its own.
  expansionNote(key) {
    const notes = {
      pronunciation: {
        what: ["expandPronunciationNote", "Expand with phonetically similar letters"],
        like: ["expandPronunciationLike", "e.g. ث ≈ س, ت ≈ ط"]
      },
      rika: {
        what: ["expandRikaNote", "Expand with letters that look alike in the Rika hand"],
        like: ["expandRikaLike", "e.g. و ≈ د ≈ ر"]
      },
      divani: {
        what: ["expandDivaniNote", "Expand with letters that look alike in the Divani hand"],
        like: ["expandDivaniLike", "e.g. د ≈ و ≈ ا"]
      }
    };
    const note = notes[key];
    if (!note) return "";
    return `${this.translate(note.what[0], note.what[1])}` +
      `<span class="expansion-example">${this.translate(note.like[0], note.like[1])}</span>`;
  }

  // For a reader who has been through the candidates and recognised none of
  // them: the search is run again over letters that sound close to the ones
  // given, which is the widest of the three expansions.
  scanSimilar() {
    const chip = this.expansionRowTarget.querySelector('[data-expansion="pronunciation"]');
    if (!chip || chip.classList.contains("active")) return;
    chip.click();
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

  // The description of a group says what belongs in it, which is worth
  // reading once and not on every visit; the toggle beside it puts it away.
  toggleNote(event) {
    const button = event.currentTarget;
    const note = button.closest(".group-note");
    const open = note.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
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
    const read = (part) => {
      const element = copy && copy.querySelector(`[data-copy="${part}"]`);
      return element ? element.innerHTML.trim() : "";
    };
    const title = read("title") || group.key;
    const note = read("note");
    const example = read("example");
    const bodyId = `decoder-group-${this.escape(group.key)}`;
    const candidates = this.groupByCandidate(group.rows);

    const body = candidates.length === 0
      ? `<tr class="group-empty"><td colspan="4"><span>${this.escape(this.translate("decoderEmptyGroup", "No candidate readings in this section."))}</span></td></tr>`
      : candidates.map((candidate) => this.candidateHtml(candidate)).join("");

    return `
      <tbody class="result-group" id="${bodyId}">
        <tr class="group-header">
          <th colspan="4" scope="colgroup">
           <div class="group-header-inner">
            <button type="button" class="btn group-toggle" aria-expanded="true" aria-controls="${bodyId}"
                    data-action="click->word-decoder#toggleGroup">
              <span class="group-chevron"><svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         aria-hidden="true"><path d="M1 1L5 5L9 1"/></svg></span>
              <span class="group-title">${title}</span>
            </button>
            <span class="group-count">${group.rows.length}</span>
            ${note ? `
              <span class="group-note is-open">
                <span class="group-note-text">${note}${example ? `<span class="group-note-example">${example}</span>` : ""}</span>
                <button type="button" class="btn group-note-toggle" aria-expanded="true"
                        data-action="click->word-decoder#toggleNote"
                        aria-label="${this.escape(this.translate("groupNoteToggle", "Show or hide this description"))}">
                  <i data-feather="info" aria-hidden="true"></i>
                  <span class="group-note-close" aria-hidden="true">✕</span>
                </button>
              </span>` : ""}
           </div>
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
        <th colspan="4" scope="colgroup">
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
        <td class="result-cell">
          <div class="result-cell-pair">
            <div class="result-main">
              <div class="word-pair">
                <span class="word-ottoman"><span class="word-box ottoman-box" data-direction="rtl">${this.escape(candidate.ottoman)}</span></span>
                <span class="word-latin"><span class="word-box latin-box">${this.escape(candidate.latin)}</span></span>
              </div>
            </div>
            <div class="category-slot"><span class="category-badge">${this.escape(this.categoryLabel(row.category))}</span></div>
          </div>
        </td>
        <td class="text-center"><i class="row-arrow" data-feather="arrow-right"></i></td>
        <td class="headword-cell">
          <div class="word-pair">
            <span class="word-ottoman"><span class="word-box ottoman-box" data-direction="rtl">${this.escape(row.headwordOttoman)}</span></span>
            <span class="word-latin"><span class="word-box latin-box">${this.escape(row.headwordLatin)}</span></span>
          </div>
        </td>
        <td class="dictionary-cell">
          <div class="dictionary-row">
            <div class="dictionary-text">
              <div class="dictionary-name">${this.escape(window.LQ.dictionaryLabel(row.dictionary))}</div>
              ${row.page ? `<div class="dictionary-page">${this.escape(this.translate("colPage", "Page"))} ${this.escape(row.page)}</div>` : ""}
            </div>
            <div class="row-actions">
              <!-- A citation is of the dictionary entry the record sits under,
                   not of the reading that matched, so it names the headword. -->
              <button type="button" class="btn cite-button" data-action="click->word-decoder#cite:stop"
                      data-cite-latin="${this.escape(row.headwordLatin)}"
                      data-cite-ottoman="${this.escape(row.headwordOttoman)}"
                      data-cite-dictionary="${this.escape(row.dictionary)}"
                      data-cite-page="${this.escape(row.page)}"
                      aria-label="${this.escape(this.translate("cite", "Cite"))}: ${this.escape(row.headwordLatin)}">
                ${window.LQ.citeIcon()}
              </button>
              <!-- Staff only: editing a stored reading, as opposed to a reader
                   suggesting a correction. Restrict this when permissions land. -->
              <button type="button" class="btn cite-button admin-only" hidden data-action="click->word-decoder#editEntry"
                      aria-label="${this.escape(this.translate("editEntry", "Edit entry"))}">
                <i data-feather="edit-2"></i>
              </button>
            </div>
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
