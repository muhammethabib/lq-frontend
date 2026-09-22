// js/controllers/pricing_controller.js
// The term switch on the pricing page.
//
// A price is the total for the whole term, not a monthly figure, so picking a
// longer term changes both the number and the period beside it. The prices
// come from the endpoint; the shape of the response is in
// js/pricing_sample.js.

class PricingController extends Stimulus.Controller {
  static targets = ["term"]
  static values = { endpoint: String }

  connect() {
    this.term = "1";
    this.prices = {};
    this.currency = "TL";
    this.load();
    // The plans are re-rendered in the new language, since the period and the
    // saving are sentences rather than plain numbers.
    this.onLanguageChange = () => this.render();
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("language:changed", this.onLanguageChange);
  }

  load() {
    // Matches the Rails route this page expects:
    //   GET /pricing/plans
    $.ajax({
      url: this.endpointValue,
      type: "GET",
      // No backend yet: returning false cancels the request and the page is
      // fed sample data instead. Delete beforeSend once the route exists;
      // success already handles the real response shape.
      beforeSend: () => { this.receive(window.LQ_PRICING_SAMPLE); return false; },
      success: (response) => this.receive(response),
      error: () => this.receive(window.LQ_PRICING_SAMPLE)
    });
  }

  receive(response) {
    this.prices = (response && response.plans) || {};
    this.currency = (response && response.currency) || "TL";
    this.render();
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

    Object.keys(this.prices).forEach((plan) => {
      const { total, saving } = this.prices[plan][this.term] || {};
      if (total == null) return;
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
  // 8.400 TL in Turkish is 8,400 TL in English. The currency comes with the
  // prices rather than being written in here.
  money(total) {
    const language = document.documentElement.lang === "tr" ? "tr-TR" : "en-GB";
    return `${total.toLocaleString(language)} ${this.currency}`;
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
