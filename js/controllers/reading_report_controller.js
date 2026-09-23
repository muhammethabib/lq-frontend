// js/controllers/reading_report_controller.js
// Saying what is wrong with a reading.
//
// Opened from the card beside a reading. The window names the word in both
// scripts, asks which of three things the reader wants to say -- it is right,
// it is wrong, or here is a thought -- and changes what it asks for in the
// box underneath to match. The three are not the same request: agreeing
// wants nothing more, disagreeing wants a reason.
//
// It follows the modal rule: an empty container, the markup in a template,
// filled before Bootstrap shows it.

// What the box asks for, under each of the three answers.
const PROMPTS = {
  correct: { key: "rmOkPh", text: "Anything to add? (optional)" },
  incorrect: { key: "rmWhy", text: "Please explain why this pronunciation is incorrect. If you know the correct form, you may include it as well." },
  comment: { key: "rmNotePh", text: "Share your thoughts about this reading" }
};

class ReadingReportController extends Stimulus.Controller {
  static values = { template: String, endpoint: String }

  connect() {
    this.onOpen = (event) => this.open(event.detail || {});
    document.addEventListener("reading:report", this.onOpen);
  }

  disconnect() {
    document.removeEventListener("reading:report", this.onOpen);
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
    this.element.querySelector("[data-reading-report-ottoman]").textContent = this.word.ottoman;
    this.element.querySelector("[data-reading-report-latin]").textContent = this.word.latin;
    // The window is opened from a reader who has just said the reading looks
    // wrong, so that is the answer it starts on.
    this.choose("incorrect");
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);
  }

  pick(event) {
    this.choose(event.currentTarget.dataset.readingVerdict);
  }

  choose(verdict) {
    this.verdict = verdict;
    this.element.querySelectorAll("[data-reading-verdict]").forEach((option) => {
      const on = option.dataset.readingVerdict === verdict;
      option.classList.toggle("is-on", on);
      option.setAttribute("aria-pressed", String(on));
    });
    const prompt = PROMPTS[verdict];
    const box = this.element.querySelector("[data-reading-report-text]");
    box.setAttribute("data-i18n-placeholder", prompt.key);
    box.placeholder = window.LQ.translate(prompt.key, prompt.text);
  }

  send(event) {
    event.preventDefault();
    const note = this.element.querySelector("[data-reading-report-text]").value;
    // Matches the Rails route this window expects:
    //   POST /reading_reports/create
    $.ajax({
      url: this.endpointValue,
      type: "POST",
      data: { word: this.word.latin, ottoman: this.word.ottoman, verdict: this.verdict, note },
      // No backend yet: returning false cancels the request and the reader is
      // thanked anyway. Delete beforeSend once the route exists.
      beforeSend: () => { this.thank(); return false; },
      success: () => this.thank(),
      error: () => this.thank()
    });
  }

  thank() {
    this.element.querySelector("[data-reading-report-form]").hidden = true;
    const thanks = this.element.querySelector("[data-reading-report-thanks]");
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

application.register("reading-report", ReadingReportController);
