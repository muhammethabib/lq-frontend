// js/controllers/pricing_controller.js
// The term switch on the pricing page.
//
// A price is the total for the whole term, not a monthly figure, so picking a
// longer term changes both the number and the period beside it. The savings
// are given by the price list rather than worked out here, because they are
// rounded the way the sales page rounds them.

// [total in TL, saving against the one-month price in percent]
const LQ_PRICES = {
  standard: { 1: [1500, 0], 3: [3000, 33], 6: [5250, 42], 12: [8400, 53] },
  premium: { 1: [2250, 0], 3: [4350, 36], 6: [7500, 44], 12: [12750, 53] }
};

class PricingController extends Stimulus.Controller {
  static targets = ["term"]

  connect() {
    this.term = "1";
    this.render();
    // The plans are re-rendered in the new language, since the period and the
    // saving are sentences rather than plain numbers.
    this.onLanguageChange = () => this.render();
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
  }

  selectTerm(event) {
    this.term = event.currentTarget.dataset.term;
    this.render();
  }

  render() {
    this.termTargets.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.term === this.term));
    });

    // Only the paid plans have a period that moves with the term. Free is
    // free by the month whatever term is chosen, so its period is plain
    // markup with its own data-i18n key and is left alone here.
    this.element.querySelectorAll("[data-price-period]").forEach((element) => {
      element.textContent = this.periodText();
    });

    Object.keys(LQ_PRICES).forEach((plan) => {
      const [total, saving] = LQ_PRICES[plan][this.term];
      const price = this.element.querySelector(`[data-price-plan="${plan}"]`);
      const note = this.element.querySelector(`[data-price-saving="${plan}"]`);
      if (price) price.textContent = this.money(total);
      if (note) {
        note.textContent = saving
          ? window.LQ.translate("planSaving", "Save {n}%").replace("{n}", saving)
          : "";
      }
    });
  }

  // A price is grouped the way the reader's language groups thousands, so
  // 8.400 TL in Turkish is 8,400 TL in English. The currency is the same in
  // both, and at integration it comes from the plan record.
  money(total) {
    const language = document.documentElement.lang === "tr" ? "tr-TR" : "en-GB";
    return `${total.toLocaleString(language)} ${window.LQ.translate("currency", "TL")}`;
  }

  // "/ month", "/ 3 months", "/ year" - the three shapes the period takes.
  // {n} rather than a bare number, because Turkish writes the count after the
  // sign ("%53 tasarruf") and English before it ("Save 53%").
  periodText() {
    if (this.term === "1") return window.LQ.translate("periodMonth", "/ month");
    if (this.term === "12") return window.LQ.translate("periodYear", "/ year");
    return window.LQ.translate("periodMonths", "/ {n} months").replace("{n}", this.term);
  }
}

application.register("pricing", PricingController);
