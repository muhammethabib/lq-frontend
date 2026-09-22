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
// Attribute keys are handled too: data-i18n-title, data-i18n-aria,
// data-i18n-alt and data-i18n-src set title, aria-label, alt and src. The
// last is for a screenshot of the interface, which differs by language.
// Elements carrying data-i18n-html have their markup replaced instead of
// their text, for copy that contains tags.


class LanguageController extends Stimulus.Controller {
  static targets = ["option"]
  static values = { current: { type: String, default: "en" } }

  connect() {
    this.originals = {};
    this.apply(this.currentValue);

    // Markup that arrives after this controller has run - the chrome, the
    // citation window - asks for its own sweep rather than waiting for the
    // next language change.
    window.LQ.applyTranslations = (root) => this.sweep(root, this.currentValue);

    // The shared chrome is injected after this controller connects, so its
    // markup is swept once it arrives.
    this.onChromeReady = () => this.apply(this.currentValue);
    document.addEventListener("page-chrome:ready", this.onChromeReady);
  }

  disconnect() {
    document.removeEventListener("page-chrome:ready", this.onChromeReady);
  }

  select(event) {
    this.currentValue = event.currentTarget.dataset.language;
    this.apply(this.currentValue);
  }

  apply(language) {
    document.documentElement.lang = language;
    this.sweep(document, language);

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

  // Puts the current language on everything inside root that asks for it.
  sweep(root, language) {
    const dictionary = (window.LQ_TRANSLATIONS && window.LQ_TRANSLATIONS[language]) || {};
    this.translateText(root, dictionary);
    this.translateAttribute(root, dictionary, "i18nTitle", "title");
    this.translateAttribute(root, dictionary, "i18nAria", "aria-label");
    this.translateAttribute(root, dictionary, "i18nAlt", "alt");
    this.translateAttribute(root, dictionary, "i18nSrc", "src");
  }

  translateText(root, dictionary) {
    root.querySelectorAll("[data-i18n]").forEach((element) => {
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
  translateAttribute(root, dictionary, datasetKey, attribute) {
    const selector = `[data-${datasetKey.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}]`;
    root.querySelectorAll(selector).forEach((element) => {
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
