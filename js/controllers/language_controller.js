// js/controllers/language_controller.js
// Switches the interface between English and Turkish.
//
// English text is written directly in the HTML. Every translatable element
// carries a data-i18n key; the Turkish string for that key comes from
// js/translations.js. The English original is captured on first use, so
// switching back needs no second copy of the page.
//
// An element with data-i18n has its whole content replaced, so put the key on
// the span holding just that text, never on a parent that also holds icons,
// badges or other children.
//
// Attribute keys are handled too: data-i18n-title and data-i18n-aria set
// title and aria-label. Elements carrying data-i18n-html have their markup
// replaced instead of their text, for copy that contains tags.
//
// It also points every menu link at the page for the chosen language.

class LanguageController extends Stimulus.Controller {
  static targets = ["option"]
  static values = { current: { type: String, default: "en" } }

  connect() {
    this.originals = {};
    this.apply(this.currentValue);
  }

  select(event) {
    this.currentValue = event.currentTarget.dataset.language;
    this.apply(this.currentValue);
  }

  apply(language) {
    const dictionary = (window.LQ_TRANSLATIONS && window.LQ_TRANSLATIONS[language]) || {};
    document.documentElement.lang = language;

    this.translateText(dictionary);
    this.translateAttribute(dictionary, "i18nTitle", "title");
    this.translateAttribute(dictionary, "i18nAria", "aria-label");
    this.switchPageLinks(language);

    this.optionTargets.forEach((option) => {
      const isActive = option.dataset.language === language;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });

    // Let other controllers re-render text they generated themselves
    this.element.dispatchEvent(new CustomEvent("language:changed", {
      detail: { language }, bubbles: true
    }));
  }

  // Menu entries exist once and carry both language variants, so switching the
  // language rewrites the href rather than duplicating the menu. They stay
  // ordinary links: hover shows the destination and middle-click works.
  //
  // An entry marked .is-unavailable names a page that has not been rebuilt
  // yet, so it is left without an href and cannot be followed. Removing that
  // class is all it takes to turn the entry back into a working link.
  switchPageLinks(language) {
    document.querySelectorAll("[data-page-en]").forEach((link) => {
      if (link.classList.contains("is-unavailable")) {
        link.removeAttribute("href");
        return;
      }
      const target = language === "tr" ? link.dataset.pageTr : link.dataset.pageEn;
      if (target) link.setAttribute("href", target);
    });
  }

  translateText(dictionary) {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      const allowsHtml = element.hasAttribute("data-i18n-html");
      const store = `text:${key}`;
      if (!(store in this.originals)) {
        this.originals[store] = allowsHtml ? element.innerHTML : element.textContent;
      }
      const value = key in dictionary ? dictionary[key] : this.originals[store];
      if (allowsHtml) element.innerHTML = value; else element.textContent = value;
    });
  }

  // datasetKey is the camelCase form of the data attribute, e.g. "i18nTitle"
  translateAttribute(dictionary, datasetKey, attribute) {
    const selector = `[data-${datasetKey.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}]`;
    document.querySelectorAll(selector).forEach((element) => {
      const key = element.dataset[datasetKey];
      const store = `${attribute}:${key}`;
      if (!(store in this.originals)) {
        this.originals[store] = element.getAttribute(attribute) || "";
      }
      element.setAttribute(attribute, key in dictionary ? dictionary[key] : this.originals[store]);
    });
  }
}

application.register("language", LanguageController);
