// js/controllers/dictionary_page_controller.js
// The original dictionary page window.
//
// A result row has two click zones: the result itself and the headword. Both
// open this window on the scan the record came from; the zone only decides
// which entry it opens on. The row announces "dictionary-page:open" and this
// controller answers, the same way the citation window is opened.
//
// The window follows the modal rule: an empty container on the page, the
// markup in a <template>, filled in before Bootstrap shows it.
//
// The endpoint the backend will provide is documented in
// js/dictionary_page_sample.js.

const VIEWS = ["slice", "column", "page"];
// The three kinds of record a column holds. The arrows step through one kind
// at a time, because a reader following the headwords down a column does not
// want to be taken through every subentry on the way.

class DictionaryPageController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail);
    document.addEventListener("dictionary-page:open", this.onOpen);
    this.onLanguageChange = () => { if (this.entry) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("dictionary-page:open", this.onOpen);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.modal) this.modal.dispose();
  }

  open(request) {
    // Matches the Rails route this window expects:
    //   GET /dictionary_page/entry?dictionary=…&page=…&word=…
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      data: { dictionary: request.dictionary, page: request.page, word: request.ottoman },
      // No backend yet: returning false cancels the request and the window is
      // fed sample data instead. Delete beforeSend once the route exists.
      beforeSend: () => { this.receive(this.sample(request), request); return false; },
      success: (response) => this.receive(response, request),
      error: () => this.receive(null, request)
    });
  }

  // The sample holds two entries of one column, so the arrows have somewhere
  // to go; the headword the row carries picks the one to open on.
  sample(request) {
    const data = window.LQ_DICTIONARY_PAGE_SAMPLE || { entries: [] };
    const wanted = data.entries.findIndex((entry) =>
      entry.headwordLatin === request.headwordLatin ||
      entry.headwordOttoman === request.headwordOttoman);
    return { entries: data.entries, index: wanted < 0 ? 0 : wanted };
  }

  receive(response, request) {
    this.entries = (response && response.entries) || [];
    this.index = (response && response.index) || 0;
    this.entry = this.entries[this.index] || null;
    this.view = "slice";
    this.request = request;

    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    // The switch has no width until the window is on screen, so the pane
    // behind the three views is placed once it is.
    this.element.addEventListener("shown.bs.modal", () => this.placeIndicator(),
                                  { once: true });
    this.modal.show();
  }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template) return;
    window.LQ.disposeWidgets(this.element);
    // Bootstrap caches the dialog element when the modal is constructed, so
    // the instance is disposed before the markup under it is replaced. Not
    // while the window is open, though: disposing then would take the
    // backdrop with it and leave the page covered.
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.element.classList.contains("show")) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    this.fill();
    window.LQ.refreshDynamicContent(this.element);
  }

  fill() {
    const entry = this.entry;
    const find = (selector) => this.element.querySelector(selector);
    if (!entry) {
      const frame = find("[data-scan-frame]");
      if (frame) frame.hidden = true;
      find("[data-scan-missing]").hidden = false;
      return;
    }

    // The badge is a stamp of the volume, so it carries the name alone; the
    // year belongs with a citation, not here.
    find("[data-scan-dictionary]").textContent = entry.dictionary;
    find("[data-scan-headword-latin]").textContent = entry.headwordLatin;

    VIEWS.forEach((name) => {
      const button = find(`[data-scan-view="${name}"]`);
      if (!button) return;
      button.setAttribute("aria-pressed", String(name === this.view));
      button.querySelector("[data-scan-count]").textContent = entry[name];
    });
    this.placeIndicator();

    this.fillArrows();
    this.drawView();
  }

  // The white pane behind the three views. It is placed rather than styled
  // on the button so it can slide from one to the next; the switch is one
  // control, not three that light up in turn.
  placeIndicator() {
    const views = this.element.querySelector(".scan-views");
    const indicator = this.element.querySelector("[data-scan-indicator]");
    if (!views || !indicator) return;
    const width = (views.offsetWidth - 4) / VIEWS.length;
    indicator.style.setProperty("--scan-indicator-width", `${width}px`);
    indicator.style.setProperty("--scan-indicator-x",
      `${VIEWS.indexOf(this.view) * width}px`);
  }

  // ==================== stepping through the column ====================

  // The arrows walk the column's records in the order they sit in it, and
  // are disabled at its ends rather than wrapping round.
  fillArrows() {
    const find = (selector) => this.element.querySelector(selector);
    const previous = find("[data-scan-previous]");
    const next = find("[data-scan-next]");
    // The arrows name the kind of record they step through, the way the
    // switch beneath them does: Previous Slice, Next Column.
    const kind = this.translate(
      `scan${this.view.charAt(0).toUpperCase()}${this.view.slice(1)}`, this.view);
    const label = (key, fallback) => `${this.translate(key, fallback)} ${kind}`;
    if (previous) {
      previous.disabled = this.index <= 0;
      this.labelArrow(previous, label("scanPrevious", "Previous"));
    }
    if (next) {
      next.disabled = this.index >= this.entries.length - 1;
      this.labelArrow(next, label("scanNext", "Next"));
    }
  }

  // The tooltip is built when the window opens, so its text is replaced
  // through Bootstrap rather than by setting the attribute alone.
  labelArrow(button, text) {
    button.setAttribute("aria-label", text);
    button.setAttribute("title", text);
    const tip = bootstrap.Tooltip.getInstance(button);
    if (tip) tip.setContent({ ".tooltip-inner": text });
  }

  translate(key, fallback) {
    return window.LQ.translate(key, fallback);
  }

  drawView() {
    const view = (this.entry.views || {})[this.view] || {};
    const frame = this.element.querySelector("[data-scan-frame]");
    const sheet = this.element.querySelector("[data-scan-sheet]");
    const missing = this.element.querySelector("[data-scan-missing]");
    const card = this.element.querySelector("[data-scan-card]");
    // A view that names its slices is a sheet to scroll; the slice view is
    // one picture fitted to the window.
    const sliced = Array.isArray(view.slices);
    card.hidden = true;
    frame.hidden = !view.image || sliced;
    sheet.hidden = !view.image || !sliced;
    missing.hidden = Boolean(view.image);
    this.boxes = [];
    if (!view.image) return;
    if (sliced) { this.drawSheet(view, sheet, card); return; }

    frame.appendChild(card);
    this.placeImage(frame, view);

    // A box is a rectangle on the scan, so it is placed as a percentage and
    // the scan can be shown at any size.
    frame.querySelectorAll(".scan-box").forEach((box) => box.remove());
    (view.boxes || []).forEach((box) => {
      const element = this.makeBox(box);
      element.style.top = `${box.top}%`;
      element.style.height = `${box.height}%`;
      frame.appendChild(element);
    });
  }

  placeImage(frame, view) {
    const image = frame.querySelector("img");
    image.src = view.image;
    image.alt = window.LQ.translate("scanAlt", "The entry as printed in the source volume");
    frame.style.setProperty("--scan-ratio", view.ratio || 2);
  }

  // One word on the scan. Its place across is a share of the scan's width;
  // its place down is set by the caller, against whatever holds it.
  makeBox(box) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = `scan-box scan-box-${box.category}`;
    element.dataset.scanBox = String(this.boxes.length);
    element.style.left = `${box.left}%`;
    element.style.width = `${box.width}%`;
    element.setAttribute("aria-label", `${box.latin} — ${box.ottoman}`);
    element.dataset.action = "mouseenter->dictionary-page#showWord " +
      "focus->dictionary-page#showWord mouseleave->dictionary-page#hideWord " +
      "blur->dictionary-page#hideWord";
    this.boxes.push(box);
    return element;
  }

  // The column as a sheet of paper, with its slices laid over it. The
  // record's own slice keeps its colours; every other slice is grey until
  // the cursor crosses it, and then the whole slice shows -- its edges and
  // every word in it in its own colour. A word under the cursor still opens
  // its card as on the slice view. The boxes sit inside their slice, so the
  // slice stays lit while the cursor is on one of its words.
  drawSheet(view, sheet, card) {
    const frame = sheet.querySelector("[data-scan-sheet-frame]");
    this.placeImage(frame, view);
    frame.querySelectorAll(".scan-slice").forEach((slice) => slice.remove());
    view.slices.forEach((slice) => {
      const span = slice.bottom - slice.top;
      const element = document.createElement("div");
      element.className = "scan-slice";
      element.classList.toggle("is-current", slice.number === this.entry.slice);
      element.style.top = `${slice.top}%`;
      element.style.height = `${span}%`;
      const number = document.createElement("span");
      number.className = "scan-slice-number";
      number.textContent = `${this.translate("scanSlice", "Slice")} ${slice.number}`;
      element.appendChild(number);
      (slice.boxes || []).forEach((box) => {
        const word = this.makeBox(box);
        word.style.top = `${(box.top - slice.top) / span * 100}%`;
        word.style.height = `${box.height / span * 100}%`;
        element.appendChild(word);
      });
      frame.appendChild(element);
    });
    frame.appendChild(card);
    // The record's own slice is brought into the middle of the sheet. The
    // sheet only has a size once the window is on screen.
    const centre = () => this.centreSlice(sheet);
    if (this.element.classList.contains("show")) requestAnimationFrame(centre);
    else this.element.addEventListener("shown.bs.modal", centre, { once: true });
    // Until the scan has arrived the sheet may have no height to scroll in.
    const image = frame.querySelector("img");
    if (!image.complete) image.addEventListener("load", centre, { once: true });
  }

  centreSlice(sheet) {
    const current = sheet.querySelector(".scan-slice.is-current");
    if (!current || sheet.hidden) return;
    const sheetBox = sheet.getBoundingClientRect();
    const sliceBox = current.getBoundingClientRect();
    const offset = sliceBox.top - sheetBox.top + sheet.scrollTop;
    sheet.scrollTop = Math.max(0, offset - (sheet.clientHeight - sliceBox.height) / 2);
  }

  // ==================== the box under the cursor ====================

  showWord(event) {
    const box = this.boxFor(event.currentTarget);
    if (!box) return;
    clearTimeout(this.cardTimer);
    const card = this.element.querySelector("[data-scan-card]");
    card.querySelector("[data-scan-word-ottoman]").textContent = box.ottoman;
    card.querySelector("[data-scan-word-latin]").textContent = box.latin;
    card.dataset.scanFor = event.currentTarget.dataset.scanBox;
    card.hidden = false;

    // The card stands over the box it describes, centred on it, in the
    // frame's own coordinates. They are custom properties rather than top and
    // left so the stylesheet can dock the card at the foot of the frame on a
    // narrow screen, where there is no room above the box. They are measured
    // rather than read off the box, because on a sheet the box is placed
    // inside its slice, not on the frame.
    const element = event.currentTarget;
    const frameBox = card.parentElement.getBoundingClientRect();
    const place = element.getBoundingClientRect();
    card.style.setProperty("--card-left", `${place.left + place.width / 2 - frameBox.left}px`);
    // A box close to the top of what can be seen leaves no room above it, so
    // there the card drops below the box instead.
    const body = this.element.querySelector(".modal-body").getBoundingClientRect();
    const high = place.top - Math.max(body.top, 0) < 120;
    card.style.setProperty("--card-top",
      high ? `${place.bottom - frameBox.top + 10}px` : `${place.top - frameBox.top - 10}px`);
    card.style.setProperty("--card-anchor",
      high ? "translate(-50%, 0)" : "translate(-50%, -100%)");
    // The flag hangs to the right of the card; where that would take it off
    // the screen it swaps to the other side.
    card.classList.remove("is-flipped");
    card.classList.toggle("is-flipped",
      card.getBoundingClientRect().right + 40 > window.innerWidth);
  }

  // The card stays while the cursor is on it, so the word can be searched or
  // reported; it is given a moment to be reached on the way over.
  holdWord() {
    clearTimeout(this.cardTimer);
  }

  hideWord() {
    const card = this.element.querySelector("[data-scan-card]");
    clearTimeout(this.cardTimer);
    this.cardTimer = setTimeout(() => { card.hidden = true; }, 300);
  }

  boxFor(element) {
    return (this.boxes || [])[Number(element.dataset.scanBox)];
  }

  // ==================== the controls ====================

  selectView(event) {
    this.view = event.currentTarget.dataset.scanView;
    this.fill();
  }

  previous() { this.step(-1); }
  next() { this.step(1); }

  step(direction) {
    const wanted = this.index + direction;
    if (wanted < 0 || wanted >= this.entries.length) return;
    this.index = wanted;
    this.entry = this.entries[wanted];
    this.fill();
  }

  // A word on the scan is a search waiting to be run, so the window closes
  // and the page searches it.
  search(event) {
    const card = event.currentTarget.closest("[data-scan-card]");
    const script = event.currentTarget.dataset.scanScript;
    const term = card.querySelector(`[data-scan-word-${script}]`).textContent;
    this.modal.hide();
    document.dispatchEvent(new CustomEvent("search:run", { detail: { term, script } }));
  }

  // The citation window is the same one the row's Cite button opens. This
  // window closes first rather than stacking a second one on top of it.
  // The citation opens over the scan rather than in its place: the reader is
  // citing the page in front of them and goes back to it when they are done.
  cite() {
    document.dispatchEvent(new CustomEvent("citation:open", {
      detail: {
        latin: this.entry.headwordLatin,
        ottoman: this.entry.headwordOttoman,
        dictionary: this.entry.dictionary,
        page: this.entry.page
      }
    }));
  }

  // Staff only: opens the editing screen for the word's stored value. The
  // reader's route is the flag beside it, which files a report instead.
  editWord() {
    // Placeholder for the staff editing screen, as on a result row.
  }

  // ==================== reporting an error ====================

  // The card that asks what is wrong opens over the scan rather than in its
  // place, so the page the word was read from is still there afterwards.
  report(event) {
    const card = event.currentTarget.closest("[data-scan-card]");
    document.dispatchEvent(new CustomEvent("typo:report", {
      detail: {
        ottoman: card.querySelector("[data-scan-word-ottoman]").textContent,
        latin: card.querySelector("[data-scan-word-latin]").textContent,
        dictionary: this.entry ? this.entry.dictionary : "",
        page: this.entry ? this.entry.page : ""
      }
    }));
  }
}

application.register("dictionary-page", DictionaryPageController);
