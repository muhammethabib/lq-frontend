// js/controllers/typo_report_controller.js
// Saying that a word on a scan is read wrongly.
//
// Opened from the flag beside a word on the original dictionary page. It
// names the word in both scripts, asks what is wrong in a sentence, and
// thanks the reader. It is the same card as the reading report
// (css/report-window.css) without the three-way answer: the reader has
// already said which word, and there is nothing to agree with.
//
// It stands over the scan rather than in its place, so the page the word was
// read from is still there when the card is closed.
//
// It follows the modal rule: an empty container, the markup in a template,
// filled before Bootstrap shows it.

class TypoReportController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail || {});
    document.addEventListener("typo:report", this.onOpen);
  }

  disconnect() {
    document.removeEventListener("typo:report", this.onOpen);
    if (this.modal) this.modal.dispose();
  }

  open(word) {
    this.word = word;
    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    this.modal.show();
  }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template) return;
    window.LQ.disposeWidgets(this.element);
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.element.classList.contains("show")) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;
    this.element.querySelector("[data-typo-report-ottoman]").textContent = this.word.ottoman || "";
    this.element.querySelector("[data-typo-report-latin]").textContent = this.word.latin || "";
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);
  }

  send(event) {
    event.preventDefault();
    const note = this.element.querySelector("[data-typo-report-text]").value;
    // Matches the Rails route this window expects:
    //   POST /typo_reports/create
    $.ajax({
      url: this.endpointValue,
      type: "POST",
      data: {
        word: this.word.latin,
        ottoman: this.word.ottoman,
        dictionary: this.word.dictionary,
        page: this.word.page,
        note
      },
      // No backend yet: returning false cancels the request and the reader is
      // thanked anyway. Delete beforeSend once the route exists.
      beforeSend: () => { this.thank(); return false; },
      success: () => this.thank(),
      error: () => this.thank()
    });
  }

  thank() {
    this.element.querySelector("[data-typo-report-form]").hidden = true;
    const thanks = this.element.querySelector("[data-typo-report-thanks]");
    thanks.hidden = false;
    window.LQ.refreshDynamicContent(this.element);
    // The button that was pressed has just been hidden, so the focus would
    // otherwise fall out of the window and Escape would stop closing it.
    thanks.querySelector("button").focus();
  }

  // The tick turns into a face on the way out, so the window is seen to be
  // pleased rather than just closing.
  close() {
    const icon = this.element.querySelector(".report-window-icon");
    if (icon) icon.classList.add("is-face");
    setTimeout(() => this.modal.hide(), 800);
  }
}

application.register("typo-report", TypoReportController);
