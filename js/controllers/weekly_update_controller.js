// js/controllers/weekly_update_controller.js
// The "This week on LexiQamus" card under the search card.
//
// The wording lives in js/weekly_update.js so a week's news is one edit to
// one file. The card is written from it in the page's language, and again
// whenever the language changes. A week with nothing to say hides the card.

class WeeklyUpdateController extends Stimulus.Controller {
  static targets = ["card", "dates", "lines", "next", "nextRow"]

  connect() {
    this.onLanguageChange = (event) => this.render(event.detail.language);
    document.addEventListener("language:changed", this.onLanguageChange);
    this.render(document.documentElement.lang);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
  }

  render(language) {
    const data = window.LQ_WEEKLY_UPDATE || {};
    const week = data[language] || data.en;
    const lines = (week && week.lines) || [];
    this.element.hidden = lines.length === 0;
    if (!lines.length) return;

    this.cardTarget.href = data.href || "#";
    this.datesTarget.textContent = week.dates || "";
    this.linesTarget.replaceChildren(...lines.map(([dictionary, change]) => {
      const line = document.createElement("div");
      line.className = "weekly-line";
      const name = document.createElement("b");
      name.textContent = `${dictionary}:`;
      line.append(name, ` ${change}`);
      return line;
    }));
    this.nextTarget.textContent = week.next || "";
    this.nextRowTarget.hidden = !week.next;
  }
}

application.register("weekly-update", WeeklyUpdateController);
