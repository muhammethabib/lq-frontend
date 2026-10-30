// js/controllers/search_hint_controller.js
// The two-step hint a first-time visitor gets about the search bar.
//
// Some readers take the bar for Latin only, others for Ottoman only. On a
// first visit the bar points out each half in turn: a card under it says
// what that half takes and offers a word to try, and the half itself is
// ringed in its script's colour. Step one is the Latin half, step two the
// Ottoman one.
//
// It never stands in the reader's way. Typing in the bar, pressing in it or
// trying the offered word ends it -- the reader has found the bar -- and so
// does the close mark. "Got it", or a press anywhere else, moves it on to the
// next step. It waits for any window that is open (the announcement a first
// visitor also gets) to close first, and it does not come back once it has
// been seen. The New Visitor screen of the view switcher shows it again
// after the announcement, because it is there to be looked at.

// Where "seen" is kept until the integration puts it on the account. A
// browser that refuses storage simply shows it again next time.
const SEARCH_HINT_SEEN_KEY = "lq-search-hint-seen";
// The page settles first, so the reader sees what they came for before
// anything is pointed out on it.
const SEARCH_HINT_DELAY_MS = 700;

class SearchHintController extends Stimulus.Controller {
  static targets = ["spot", "card", "title", "body", "example", "count"]

  connect() {
    // Not inside the innovations page's preview of this one, and not on a
    // screen the switcher was asked for in the address: those are being
    // looked at for something else.
    const asked = new URLSearchParams(window.location.search).get("state");
    if (window.self === window.top && !asked && !this.seen()) {
      this.startTimer = setTimeout(() => this.startWhenClear(), SEARCH_HINT_DELAY_MS);
    }

    this.onViewState = (event) => {
      if (event.detail.state === "new-visitor") this.startWhenClear({ force: true });
      else if (event.detail.state !== "home") this.end({ remember: false });
    };
    document.addEventListener("view-state:change", this.onViewState);

    this.onPress = (event) => this.press(event);
    document.addEventListener("pointerdown", this.onPress);
    this.onType = () => this.end();
    this.input = document.getElementById("homeSearchInput");
    if (this.input) this.input.addEventListener("input", this.onType);
    this.onLanguageChange = () => { if (this.step) this.show(this.step); };
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    clearTimeout(this.startTimer);
    document.removeEventListener("view-state:change", this.onViewState);
    document.removeEventListener("pointerdown", this.onPress);
    document.removeEventListener("language:changed", this.onLanguageChange);
    if (this.input) this.input.removeEventListener("input", this.onType);
  }

  // ==================== when ====================

  // Behind whatever window is open, or about to open: the announcement
  // takes a moment to arrive, so a window in the middle of opening counts.
  // The New Visitor screen asks before its announcement has opened, so it
  // waits for that one to come and go.
  startWhenClear({ force = false, waited = false } = {}) {
    clearTimeout(this.startTimer);
    if (!force && this.seen()) return;
    const open = document.querySelector(".modal.show");
    const announcement = document.getElementById("announcementModal");
    const coming = force && !waited && announcement && !announcement.classList.contains("show");
    if (open || coming) {
      (open || announcement).addEventListener("hidden.bs.modal", () => {
        this.startTimer = setTimeout(() => this.startWhenClear({ force, waited: true }), 300);
      }, { once: true });
      return;
    }
    // Only on the landing screen, with nothing typed: over a page of
    // results the bar is not the thing to point out.
    const home = this.element.closest(".home-surface");
    if (home && !home.classList.contains("state-landing")) return;
    if (this.input && this.input.value) return;
    this.show(1);
  }

  seen() {
    try { return localStorage.getItem(SEARCH_HINT_SEEN_KEY) === "1"; } catch (error) { return false; }
  }

  remember() {
    try { localStorage.setItem(SEARCH_HINT_SEEN_KEY, "1"); } catch (error) { /* this visit only */ }
  }

  // ==================== the two steps ====================

  show(step) {
    this.step = step;
    const latin = step === 1;
    const say = (key, fallback) => window.LQ.translate(key, fallback);
    this.titleTarget.textContent = latin
      ? say("hintLatinTitle", "You can search Ottoman words in Latin letters too.")
      : say("hintOttomanTitle", "You can search Ottoman words in Ottoman letters too.");
    this.bodyTarget.textContent = latin
      ? say("hintLatinBody", "Just type in the left side of the bar.")
      : say("hintOttomanBody", "Just type in the right side of the bar.");
    this.exampleTarget.textContent = latin ? "meyve" : "میوه";
    this.exampleTarget.dataset.direction = latin ? "ltr" : "rtl";
    this.countTarget.textContent = `${step} / 2`;
    [this.spotTarget, this.cardTarget].forEach((element) => {
      element.classList.toggle("is-latin", latin);
      element.classList.toggle("is-ottoman", !latin);
      element.hidden = false;
    });
  }

  next() {
    if (this.step === 1) this.show(2);
    else this.end();
  }

  end({ remember = true } = {}) {
    clearTimeout(this.startTimer);
    if (!this.step) return;
    this.step = null;
    this.spotTarget.hidden = true;
    this.cardTarget.hidden = true;
    if (remember) this.remember();
  }

  close() { this.end(); }

  // The offered word is looked up straight away, in its own script.
  tryExample() {
    const latin = this.step === 1;
    const term = this.exampleTarget.textContent;
    this.end();
    document.dispatchEvent(new CustomEvent("search:run", {
      detail: { term, script: latin ? "latin" : "ottoman" }
    }));
  }

  // A press in the bar means the reader has found it; a press anywhere else
  // but the card moves the hint on, as "Got it" does.
  press(event) {
    if (!this.step) return;
    if (this.cardTarget.contains(event.target)) return;
    if (event.target.closest(".script-input-wrapper")) { this.end(); return; }
    this.next();
  }
}

application.register("search-hint", SearchHintController);
