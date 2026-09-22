// js/controllers/view_switcher_controller.js
// The view switcher in the bottom left corner of the main page.
//
// The main page has six screens, and most of them are reached by searching.
// This puts each of them one click away while the work is being reviewed. It
// switches the screen in place rather than reloading, which is what the
// reference mock does.
//
// A reviewing aid, not part of the interface: this controller,
// js/view_states.js and css/view-switcher.css come out at integration, along
// with the element in pages/home.html and the "view-state:change" listeners
// in the three controllers that answer it.

class ViewSwitcherController extends Stimulus.Controller {
  static values = { state: { type: String, default: "home" } }

  connect() {
    this.render();
    // ?state= opens a screen directly, so a link can point at one. The
    // controllers that answer connect after this one, so the first
    // announcement waits for them rather than being made to an empty room.
    const asked = new URLSearchParams(window.location.search).get("state");
    const known = (window.LQ_VIEW_STATES || []).some((one) => one.state === asked);
    this.startTimer = setTimeout(() => this.show(known ? asked : this.stateValue));

    this.onLanguageChange = () => this.render();
    document.addEventListener("language:changed", this.onLanguageChange);
  }

  disconnect() {
    clearTimeout(this.startTimer);
    document.removeEventListener("language:changed", this.onLanguageChange);
  }

  render() {
    this.element.innerHTML = (window.LQ_VIEW_STATES || []).map((one) => `
      <button type="button" class="btn view-state${one.state === this.stateValue ? " active" : ""}"
              data-state="${window.LQ.escape(one.state)}"
              data-action="click->view-switcher#select">
        ${window.LQ.escape(window.LQ.translate(one.key, one.label))}
      </button>`).join("");
  }

  select(event) {
    this.show(event.currentTarget.dataset.state);
  }

  show(state) {
    this.stateValue = state;
    this.render();
    // The screens live in the controllers that own them, so the switcher only
    // says which one is wanted.
    document.dispatchEvent(new CustomEvent("view-state:change", { detail: { state } }));
  }
}

application.register("view-switcher", ViewSwitcherController);
