// js/controllers/announcement_controller.js
// The announcement a first-time visitor sees.
//
// On the live site it opens once, when a reader arrives for the first time.
// Here the New Visitor screen of the view switcher asks for it, so it can be
// looked at without clearing browser storage.
//
// It follows the modal rule: an empty container on the page, the markup in a
// template, filled in before Bootstrap shows it.
//
// A reader who has read it can say so: "Don't show again" remembers the
// choice, and the announcement opens no more. The New Visitor screen of the
// switcher overrides that, because it is there to be looked at.

// Where the reader's choice is kept until the integration puts it on the
// account. It is only a preference, so a browser that refuses storage simply
// shows the announcement again.
const ANNOUNCEMENT_DISMISSED_KEY = "lq-announcement-dismissed";

class AnnouncementController extends Stimulus.Controller {
  static values = { template: String }

  connect() {
    this.onViewState = (event) => {
      // The switcher asks for it to be looked at, so it opens whatever the
      // reader has said before.
      if (event.detail.state === "new-visitor") this.open({ force: true });
      else this.close();
    };
    document.addEventListener("view-state:change", this.onViewState);
    this.onLanguageChange = () => { if (this.isOpen()) this.render(); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    document.removeEventListener("view-state:change", this.onViewState);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.modal) this.modal.dispose();
  }

  isOpen() { return this.element.classList.contains("show"); }

  open({ force = false } = {}) {
    if (!force && this.dismissed()) return;
    this.render();
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element);
    // The reference lets the page settle before the announcement arrives, so
    // the reader sees what they came for first.
    clearTimeout(this.openTimer);
    this.openTimer = setTimeout(() => this.modal.show(), 350);
  }

  close() {
    clearTimeout(this.openTimer);
    const open = bootstrap.Modal.getInstance(this.element);
    if (!open) return;
    // Bootstrap ignores hide() while the window is still coming in, which is
    // reachable here: the switcher can be pressed again straight away.
    if (this.element.classList.contains("show")) open.hide();
    else this.element.addEventListener("shown.bs.modal", () => open.hide(), { once: true });
  }

  render() {
    const template = document.getElementById(this.templateValue);
    if (!template) return;
    window.LQ.disposeWidgets(this.element);
    const existing = bootstrap.Modal.getInstance(this.element);
    if (existing && !this.isOpen()) {
      existing.dispose();
      this.modal = null;
    }
    this.element.innerHTML = template.innerHTML;
    if (window.LQ.applyTranslations) window.LQ.applyTranslations(this.element);
    window.LQ.refreshDynamicContent(this.element);
  }

  // The reader has read it and does not want it again.
  dismissForever() {
    try {
      localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, "1");
    } catch (error) {
      // Storage can be refused; the choice then lasts for this visit only
    }
    this.close();
  }

  dismissed() {
    try {
      return localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY) === "1";
    } catch (error) { return false; }
  }

  // Creating an account is the point of the announcement, so it hands over to
  // the account window rather than just closing.
  signUp() {
    this.element.addEventListener("hidden.bs.modal", () => {
      const button = document.querySelector('[data-mode="signup"]');
      if (button) button.click();
    }, { once: true });
    this.close();
  }
}

application.register("announcement", AnnouncementController);
