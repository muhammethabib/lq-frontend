// js/controllers/innovations_controller.js
// The 2026 innovations, read under the main page.
//
// The tool comes first. Someone who arrives to look up a word sees the search
// bar and nothing else: the main page is one fixed screen, it does not move,
// and the story is parked below it out of sight. The prompt at the foot of
// the screen is the only way in.
//
// Once it is open the story is read like a deck rather than a page: one
// movement of the wheel, one swipe of a trackpad or one press of Page Down
// moves exactly one screen, so every reader sees the same composition
// whatever the height of their window. Nothing is ever half-cut.
//
// And the story always gives way. The moment the reader touches either side
// of the search bar, the filters, the dictionary list or a decoder box, the
// story and the prompt are gone and the page is the tool alone, until the
// reader comes back to the main screen or reloads. Nothing is thrown away;
// it is only out of the way.
//
// Four states on the body say where things stand:
//   story-armed   the story is parked below; the page is locked to one screen
//   story-open    the deck is open and a gesture moves one screen
//   tool-focus    a search tool is in use; the story has stepped aside
//   lqs-fit       the lock itself, which is what keeps the scrollbar away

// How long one gesture holds the deck still, so the tail of a trackpad swipe
// cannot carry it past the next screen.
const GESTURE_LOCK = 700;

// How far the invitation stands off the bottom of the first screen, and the
// margin it keeps when there is no room to pin it there.
const PROMPT_GAP = 24;
const PROMPT_MARGIN = 46;

// Keys that move around rather than reach for a tool.
const NAVIGATION_KEYS = ["PageDown", "PageUp", "Home", "End", "Tab", "Escape",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];

// What a search tool looks like from here. Touching any of them puts the
// story away.
const TOOLS = ".script-input-wrapper, .filter-trigger, .filter-panel," +
  " .dictionary-trigger, .dictionary-panel, .slot-strip, .decoder-row";

// Where the entry looks to have been read from on the scan, as a share of
// the picture. The backend will send these with the record; for the story
// they were read off the page by hand.
const READ_REGIONS = {
  "innovations-layer-entry": [{ t: 0, h: 8, l: 80, w: 18 }],
  "innovations-layer-sub": [
    { t: 3, h: 4, l: 10, w: 20 }, { t: 8, h: 4, l: 15, w: 18 }, { t: 14, h: 4, l: 10, w: 22 },
    { t: 19, h: 4, l: 12, w: 20 }, { t: 25, h: 4, l: 15, w: 18 }, { t: 30, h: 4, l: 10, w: 20 },
    { t: 36, h: 4, l: 12, w: 18 }, { t: 41, h: 4, l: 15, w: 15 }, { t: 47, h: 4, l: 10, w: 22 },
    { t: 52, h: 4, l: 12, w: 20 }, { t: 58, h: 4, l: 15, w: 18 }, { t: 63, h: 4, l: 10, w: 20 },
    { t: 69, h: 4, l: 12, w: 18 }, { t: 74, h: 4, l: 15, w: 15 }, { t: 80, h: 4, l: 10, w: 22 },
    { t: 85, h: 4, l: 12, w: 20 }, { t: 90, h: 4, l: 10, w: 18 }, { t: 88, h: 5, l: 85, w: 12 },
    { t: 95, h: 5, l: 60, w: 10 }, { t: 95, h: 5, l: 70, w: 10 }, { t: 95, h: 5, l: 80, w: 10 },
    { t: 95, h: 5, l: 90, w: 8 }
  ],
  "innovations-layer-rel": [
    { t: 3, h: 4, l: 52, w: 13 }, { t: 8, h: 4, l: 68, w: 12 }, { t: 38, h: 4, l: 85, w: 13 },
    { t: 72, h: 4, l: 52, w: 15 }, { t: 85, h: 4, l: 55, w: 12 }
  ]
};

// The characters that fall between the two cards while the page is being read.
const RAIN = ["حركة", "سكوت", "تلاش", "عطالات", "اراده", "دوره",
  "ا", "ب", "ج", "د", "٠", "١", "٢", "X", "Y", "0", "1"];

class InnovationsController extends Stimulus.Controller {
  connect() {
    this.screens = Array.from(this.element.querySelectorAll(".snap-section"));
    this.arm();
    this.watchGestures();
    this.watchTools();
    this.watchScreens();
    this.startNetwork();

    // The view switcher asks for one of the main page's screens; coming back
    // to the main one brings the story back with it. A reviewing aid: this
    // listener comes out with the switcher.
    this.onViewState = (event) => {
      const state = event.detail.state;
      if (state === "home" || state === "new-visitor") this.arm();
      else this.standAside();
    };
    document.addEventListener("view-state:change", this.onViewState);

    // The invitation sits at the foot of the main page, outside this element,
    // so its press is bound here rather than with a data-action.
    this.prompt = document.querySelector(".innovations-prompt");
    this.onPrompt = () => this.open();
    if (this.prompt) this.prompt.addEventListener("click", this.onPrompt);

    this.onResize = () => { this.placePrompt(); this.park(); this.sizeCanvases(); this.placeBadges(); };
    window.addEventListener("resize", this.onResize);
  }

  disconnect() {
    if (this.prompt) this.prompt.removeEventListener("click", this.onPrompt);
    document.removeEventListener("view-state:change", this.onViewState);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("wheel", this.onWheel, { capture: true });
    document.removeEventListener("keydown", this.onKey, { capture: true });
    document.removeEventListener("pointerdown", this.onTool, { capture: true });
    document.removeEventListener("keydown", this.onToolKey, { capture: true });
    if (this.watcher) this.watcher.disconnect();
    cancelAnimationFrame(this.rainFrame);
    cancelAnimationFrame(this.networkFrame);
    document.body.classList.remove("story-armed", "story-open", "tool-focus", "lqs-fit");
  }

  // ==================== where things stand ====================

  // Parked below the fold, with the page locked to the one screen above it.
  arm() {
    document.body.classList.add("story-armed");
    document.body.classList.remove("story-open", "tool-focus");
    window.scrollTo({ top: 0 });
    this.placePrompt();
    this.park();
    [100, 400, 1200].forEach((delay) => setTimeout(() => this.placeBadges(), delay));
    this.lock();
  }

  // The prompt was pressed: the lock comes off and the first screen is
  // brought up.
  reveal(prompt) {
    if (document.body.classList.contains("tool-focus")) return;
    // The prompt has done its work; leaving the focus ring on it would follow
    // the reader down the story.
    if (prompt && prompt.blur) prompt.blur();
    document.body.classList.add("story-open");
    document.body.classList.remove("lqs-fit");
    this.goToIndex(1);
  }

  // A tool was touched. Nothing is deleted; the story is only out of the way.
  standAside() {
    document.body.classList.add("tool-focus");
    document.body.classList.remove("story-open", "lqs-fit");
  }

  // The invitation sits on the bottom edge of the first screen, so the page
  // above it is read as one whole thing with an opening at its foot. On a
  // short screen there is nothing to pin it to, and it keeps its own margin.
  placePrompt() {
    const prompt = document.querySelector(".innovations-prompt");
    if (!prompt || getComputedStyle(prompt).display === "none") return;
    if (!document.body.classList.contains("story-armed") || window.innerHeight < 680) {
      prompt.style.marginTop = "";
      return;
    }
    prompt.style.marginTop = "0px";
    const top = prompt.getBoundingClientRect().top + window.scrollY;
    const wanted = window.innerHeight - prompt.offsetHeight - PROMPT_GAP;
    const room = Math.max(PROMPT_MARGIN, Math.round(wanted - top));
    prompt.style.marginTop = `${room}px`;
    // Setting the margin can move what it was measured from, the way the
    // story band's does, so the remainder is added on a second look.
    const left = Math.round((window.innerHeight - PROMPT_GAP) -
      (prompt.getBoundingClientRect().bottom + window.scrollY));
    if (left) prompt.style.marginTop = `${Math.max(PROMPT_MARGIN, room + left)}px`;
  }

  // The story begins exactly one screen down, so the main page is whole and
  // the story's first screen is whole, with nothing of either peeking in at
  // the other's edge.
  park() {
    if (!document.body.classList.contains("story-armed")) {
      this.element.style.marginTop = "";
      return;
    }
    this.element.style.marginTop = "0px";
    const top = this.element.getBoundingClientRect().top + window.scrollY;
    const room = Math.max(0, Math.round(window.innerHeight - top));
    this.element.style.marginTop = `${room}px`;
    // Setting the margin can move the element it was measured from, so the
    // measurement is taken once more and the remainder added.
    const left = Math.round(window.innerHeight -
      (this.element.getBoundingClientRect().top + window.scrollY));
    if (left) this.element.style.marginTop = `${Math.max(0, room + left)}px`;
  }

  // The lock is what keeps the main screen still and the scrollbar away. It
  // is only applied while the story is parked, and it gives way by itself
  // when something genuinely needs the room: an open keyboard adds its own
  // space to the page, and the stylesheet lets that win.
  lock() {
    if (!document.body.classList.contains("story-armed")) return;
    if (document.body.classList.contains("story-open")) return;
    document.body.classList.add("lqs-fit");
  }

  // ==================== one gesture, one screen ====================

  watchGestures() {
    this.onWheel = (event) => this.handleWheel(event);
    this.onKey = (event) => this.handleKey(event);
    document.addEventListener("wheel", this.onWheel, { passive: false, capture: true });
    document.addEventListener("keydown", this.onKey, { capture: true });
  }

  // While the story is parked the page does not move at all; once it is open
  // a gesture is worth exactly one screen, however long the reader keeps
  // swiping.
  handleWheel(event) {
    if (document.body.classList.contains("tool-focus")) return;
    if (event.target.closest(".ottoman-keyboard, .search-keyboard, .modal")) return;
    if (document.body.classList.contains("story-open")) {
      event.preventDefault();
      this.step(event.deltaY > 0 ? 1 : -1);
      return;
    }
    if (document.body.classList.contains("story-armed")) event.preventDefault();
  }

  handleKey(event) {
    if (document.body.classList.contains("tool-focus")) return;
    if (event.target.closest("input, textarea, [contenteditable='true'], .modal")) return;
    // Space is how a focused control is worked, so a control keeps it; the
    // page keys belong to the deck wherever the focus happens to be.
    if (event.key === " " && event.target.closest("button, a, [role='button']")) return;
    const forward = event.key === "PageDown" || event.key === " " || event.key === "ArrowDown";
    const back = event.key === "PageUp" || event.key === "ArrowUp";
    if (!forward && !back) return;
    if (document.body.classList.contains("story-open")) {
      event.preventDefault();
      this.step(forward ? 1 : -1);
      return;
    }
    if (document.body.classList.contains("story-armed")) event.preventDefault();
  }

  step(by) {
    if (this.held) return;
    this.held = true;
    clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => { this.held = false; }, GESTURE_LOCK);
    this.goToIndex(this.currentIndex() + by);
  }

  // The stops are the main screen and each screen of the story, in order.
  stops() {
    return [0].concat(this.screens.map(
      (screen) => Math.round(screen.getBoundingClientRect().top + window.scrollY)));
  }

  currentIndex() {
    const stops = this.stops();
    const here = window.scrollY;
    let closest = 0;
    stops.forEach((stop, index) => {
      if (Math.abs(stop - here) < Math.abs(stops[closest] - here)) closest = index;
    });
    return closest;
  }

  goToIndex(index) {
    const stops = this.stops();
    const at = Math.max(0, Math.min(index, stops.length - 1));
    // Back past the first screen is back to the main page, and the lock goes
    // on again behind the reader.
    if (at === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => this.arm(), 600);
      return;
    }
    window.scrollTo({ top: stops[at], behavior: "smooth" });
  }

  // The prompt at the foot of the main page, and the arrows inside the story.
  open() { this.reveal(); }
  goTop() { this.goToIndex(0); }

  goTo(event) {
    const screen = document.getElementById(event.currentTarget.dataset.innovationsScreen);
    if (!screen) return;
    const at = this.screens.indexOf(screen);
    if (at >= 0) this.goToIndex(at + 1);
  }

  // ==================== giving way to the tool ====================

  watchTools() {
    this.onTool = (event) => {
      // The prompt lives at the foot of the main page, outside this element,
      // so its press is heard here rather than bound to it.
      const prompt = event.target.closest(".innovations-prompt");
      if (prompt) { this.reveal(prompt); return; }
      if (event.target.closest(TOOLS)) this.standAside();
    };
    // Moving around is not using a tool, so the navigation keys are let past.
    this.onToolKey = (event) => {
      if (NAVIGATION_KEYS.includes(event.key)) return;
      if (event.target.closest(".script-input-wrapper, .slot-strip")) this.standAside();
    };
    document.addEventListener("pointerdown", this.onTool, { capture: true });
    document.addEventListener("keydown", this.onToolKey, { capture: true });
  }

  // ==================== the screens as they are reached ====================

  watchScreens() {
    if (!window.IntersectionObserver) return;
    this.watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("start-anim", entry.isIntersecting);
        if (!entry.isIntersecting) return;
        // The books line up the first time the shelf is reached, and stay
        // lined up after that.
        if (entry.target.id === "innovations-library") entry.target.classList.add("books-in");
        if (entry.target.id === "innovations-flow" && !this.flowPlayed) {
          this.flowPlayed = true;
          this.playFlow();
        }
      });
    }, { threshold: 0.3 });
    const card = document.getElementById("innovations-hero-card");
    if (card) this.watcher.observe(card);
    ["innovations-flow", "innovations-library"].forEach((id) => {
      const screen = document.getElementById(id);
      if (screen) this.watcher.observe(screen);
    });
  }

  // ==================== the third screen: how a page is read ====================

  wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms * 0.5)); }

  find(selector) { return this.element.querySelector(selector); }

  // The stage is scaled down on a short window, so every measurement taken
  // from the page has to be divided by that scale before it is written back.
  stageScale() {
    const stage = this.find("#innovations-flow .stage-container");
    if (!stage || !stage.offsetWidth) return 1;
    return stage.getBoundingClientRect().width / stage.offsetWidth;
  }

  async playFlow() {
    const raw = document.getElementById("innovations-card-raw");
    const processed = document.getElementById("innovations-card-processed");
    const strip = document.getElementById("innovations-scan-strip");
    if (!raw || !processed) return;

    this.centre(raw);
    raw.style.display = "block";
    raw.style.opacity = "0";
    await this.tellTheStory();

    raw.style.transform = "translate(-50%, -50%) scale(0.8)";
    strip.style.clipPath = "inset(0 100% 0 0)";
    strip.style.transition = "none";
    void raw.offsetWidth;
    raw.style.transition = "all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)";
    raw.style.opacity = "1";
    raw.style.transform = "translate(-50%, -50%) scale(1)";
    strip.style.transition = "clip-path 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
    strip.style.clipPath = "inset(0 0 0 0)";
    await this.wait(1600);

    this.moveToSpot(raw, "innovations-spot-raw", 1200);
    await this.wait(1000);

    processed.style.display = "block";
    processed.style.width = raw.style.width;
    processed.style.top = raw.style.top;
    processed.style.left = raw.style.left;
    processed.style.transform = raw.style.transform;
    processed.style.transition = "none";
    document.getElementById("innovations-layer-filter").style.opacity = "1";
    processed.style.opacity = "1";
    await this.wait(200);
    document.getElementById("innovations-layer-base").classList.add("wipe-left-reveal");
    await this.wait(1500);

    processed.classList.add("digital-ready");
    processed.style.transition = "all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)";
    processed.style.top = "60%";
    processed.style.left = "50%";
    processed.style.transform = "translate(-50%, -50%) scale(1.1) rotate(0deg)";
    this.startRain();
    await this.wait(1500);

    const say = (key, fallback) => window.LQ.translate(key, fallback);
    await this.readLayer(processed, "innovations-layer-entry", "#0d9488",
      say("storyScanHeadword", "HEADWORD"), false, true);
    await this.wait(500);
    await this.readLayer(processed, "innovations-layer-sub", "#d97706",
      say("storyScanSubheadwords", "SUBHEADWORDS"), false);
    await this.wait(500);
    await this.readLayer(processed, "innovations-layer-rel", "#2563eb",
      say("storyScanRelated", "RELATED WORDS"), true);
    await this.wait(1000);

    this.stopRain();
    this.moveToSpot(processed, "innovations-spot-processed", 1500);
    await this.wait(1600);
    await this.drawPyramid();

    this.element.classList.add("interaction-enabled");
    this.element.querySelectorAll(".active-card").forEach((card) => {
      card.addEventListener("mouseenter", () => this.element.classList.add("hover-mode-on"));
      card.addEventListener("mouseleave", () => this.element.classList.remove("hover-mode-on"));
    });
  }

  // The heading and the two lines under it, one after the other.
  async tellTheStory() {
    const strips = document.getElementById("innovations-flow-strips");
    await this.wait(300);
    this.find(".flow-header-area").classList.add("header-visible");
    await this.wait(1000);
    strips.classList.add("border-draw-active");
    await this.wait(1000);
    strips.classList.add("pulsing-mode");
    document.getElementById("innovations-strip-1").classList.add("strip-active");
    await this.wait(3500);
    document.getElementById("innovations-strip-2").classList.add("strip-active");
    await this.wait(4500);
    strips.classList.remove("pulsing-mode");
  }

  centre(card) {
    card.style.width = "300px";
    card.style.top = "60%";
    card.style.left = "50%";
    card.style.transition = "none";
  }

  moveToSpot(card, spotId, duration) {
    const spot = document.getElementById(spotId);
    const stage = this.find(".stage-container");
    if (!spot || !stage) return;
    const place = spot.getBoundingClientRect();
    const around = stage.getBoundingClientRect();
    card.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`;
    card.style.width = `${place.width}px`;
    card.style.top = `${place.top - around.top}px`;
    card.style.left = `${place.left - around.left}px`;
    const tilt = spotId === "innovations-spot-raw" ? "3deg"
      : spotId === "innovations-spot-processed" ? "-6deg" : "0deg";
    card.style.transform = `translate(0,0) rotate(${tilt})`;
  }

  // A beam runs down the page and each word of that kind lights as it passes.
  readLayer(card, layerId, colour, label, last, blink) {
    return new Promise((resolve) => {
      const line = document.getElementById("innovations-scan-line");
      const beam = document.getElementById("innovations-scan-beam");
      const badge = document.getElementById("innovations-scan-label");
      const layer = document.getElementById(layerId);
      this.rainColour = colour;
      beam.style.background = colour;
      beam.style.boxShadow = `0 0 15px ${colour}`;
      badge.style.background = colour;
      badge.style.color = "#fff";
      badge.textContent = label;

      const run = () => {
        card.classList.add("scanning");
        this.markRegions(layerId, colour);
        const marks = Array.from(this.element.querySelectorAll(".smart-box"));
        const flash = document.getElementById("innovations-flash");
        let started = null;
        const duration = 2500;
        const frame = (now) => {
          if (!started) started = now;
          const through = Math.min(1, (now - started) / duration);
          line.style.top = `${through * 100}%`;
          layer.style.clipPath = `inset(0 0 ${(1 - through) * 100}% 0)`;
          const reached = through * flash.offsetHeight;
          marks.forEach((mark) => {
            if (mark.classList.contains("flash-active")) return;
            if (reached >= Number(mark.dataset.from) - 10) mark.classList.add("flash-active");
          });
          if (through < 1) { requestAnimationFrame(frame); return; }
          line.style.opacity = "0";
          card.classList.remove("scanning");
          if (!last) layer.classList.add("turn-to-bw");
          resolve();
        };
        requestAnimationFrame(frame);
      };

      if (!blink) { line.style.opacity = "1"; run(); return; }
      // The first pass announces itself before it starts.
      line.style.top = "0%";
      let shown = 0;
      const blinker = setInterval(() => {
        line.style.opacity = shown % 2 ? "0" : "1";
        shown += 1;
        if (shown < 4) return;
        clearInterval(blinker);
        line.style.opacity = "1";
        run();
      }, 150);
    });
  }

  markRegions(layerId, colour) {
    const flash = document.getElementById("innovations-flash");
    flash.innerHTML = "";
    const regions = READ_REGIONS[layerId] || [];
    const height = flash.offsetHeight;
    flash.innerHTML = regions.map((region) => `
      <span class="smart-box" data-from="${(region.t / 100) * height}"
            style="top:${region.t}%;left:${region.l}%;width:${region.w}%;height:${region.h}%;color:${colour}"></span>`).join("");
  }

  // ==================== what the reading produced ====================

  async drawPyramid() {
    const node = document.getElementById("innovations-node-main");
    const orb = document.getElementById("innovations-orb");
    const stage = this.find(".stage-container");
    if (!node || !orb || !stage) return;
    const around = stage.getBoundingClientRect();
    const scale = this.stageScale();

    // The orb leaves from where the headword was read, so a probe is put in
    // its place for a moment to find out where that ended up on screen.
    const flash = document.getElementById("innovations-flash");
    const region = READ_REGIONS["innovations-layer-entry"][0];
    const probe = document.createElement("div");
    probe.className = "innovations-probe";
    probe.style.cssText = `top:${region.t}%;left:${region.l}%;width:${region.w}%;height:${region.h}%`;
    flash.appendChild(probe);
    const from = probe.getBoundingClientRect();
    probe.remove();

    orb.style.left = `${(from.left + from.width / 2 - around.left) / scale - 6}px`;
    orb.style.top = `${(from.top + from.height / 2 - around.top) / scale - 6}px`;
    orb.style.opacity = "1";
    orb.classList.add("orb-pulse");
    await this.wait(1200);
    orb.classList.remove("orb-pulse");

    orb.style.transition = "all 0.55s cubic-bezier(0.45, 0, 0.55, 1)";
    const seat = node.getBoundingClientRect();
    const settled = Math.max(seat.height, 77);
    orb.style.left = `${(seat.left + seat.width / 2 - around.left) / scale - 6}px`;
    orb.style.top = `${(seat.top + settled / 2 - around.top) / scale - 6}px`;
    await this.wait(1000);
    orb.style.opacity = "0";

    node.style.opacity = "1";
    node.style.transform = "translateX(-50%) scale(1)";
    await this.wait(300);
    await this.type("innovations-node-ottoman", "حركت", 150);
    await this.wait(200);
    await this.type("innovations-node-latin", "hareket", 80);
    await this.wait(500);

    const lines = document.getElementById("innovations-pyramid-lines");
    lines.innerHTML = "";
    ["innovations-sub-1", "innovations-sub-2", "innovations-sub-3",
     "innovations-rel-1", "innovations-rel-2", "innovations-rel-3", "innovations-rel-4"]
      .forEach((id) => this.drawPath("innovations-node-main", id, id.includes("sub") ? "sub" : "rel"));
    lines.style.clipPath = "inset(0 0 0 0)";
    await this.wait(2500);

    this.element.querySelectorAll(".mini-node").forEach((one) => {
      one.style.clipPath = "inset(0 0 0 0)";
    });
    await this.wait(1000);
    await this.wait(2500);

    const show = (id, shift) => {
      const box = document.getElementById(id);
      if (!box) return;
      box.style.opacity = "1";
      box.style.transform = shift;
    };
    show("innovations-desc-main", "translateX(20px)");
    await this.wait(1500);
    show("innovations-desc-sub", "translateY(20px)");
    await this.wait(1500);
    show("innovations-desc-rel", "translateY(20px)");
    await this.wait(500);
  }

  drawPath(fromId, toId, kind) {
    const area = document.getElementById("innovations-pyramid");
    const lines = document.getElementById("innovations-pyramid-lines");
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (!area || !lines || !from || !to) return;
    const around = area.getBoundingClientRect();
    const start = from.getBoundingClientRect();
    const end = to.getBoundingClientRect();
    const scale = this.stageScale();
    const x1 = ((start.left + start.width / 2) - around.left) / scale;
    const y1 = ((start.bottom - around.top) - 2) / scale;
    const x2 = ((end.left + end.width / 2) - around.left) / scale;
    const y2 = (end.top - around.top) / scale;
    const drop = (y2 - y1) * 0.45;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M${x1},${y1} C${x1},${y1 + drop} ${x2},${y2 - drop} ${x2},${y2}`);
    path.setAttribute("class", `conn-path path-${kind}`);
    lines.appendChild(path);
  }

  async type(id, text, speed) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = "";
    const caret = document.createElement("span");
    caret.className = "typing-cursor";
    target.appendChild(caret);
    for (const letter of text) {
      caret.insertAdjacentText("beforebegin", letter);
      await this.wait(speed);
    }
    caret.remove();
  }

  // ==================== the characters falling between the cards ====================

  startRain() {
    const canvas = document.getElementById("innovations-rain");
    if (!canvas || this.raining) return;
    this.raining = true;
    this.rainColour = this.rainColour || "#06b6d4";
    this.sizeCanvases();
    this.drops = Array.from({ length: 50 }, () => this.newDrop());
    this.rain();
  }

  stopRain() {
    this.raining = false;
    cancelAnimationFrame(this.rainFrame);
    const canvas = document.getElementById("innovations-rain");
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }

  newDrop() {
    const from = document.getElementById("innovations-card-raw");
    const to = document.getElementById("innovations-card-processed");
    if (!from || !to) return null;
    const start = from.getBoundingClientRect();
    const end = to.getBoundingClientRect();
    return {
      startX: start.left + start.width * 0.5,
      startY: start.top + start.height * 0.2 + Math.random() * start.height * 0.6,
      endX: end.left + end.width * 0.5,
      endY: end.top + end.height * 0.2 + Math.random() * end.height * 0.6,
      through: 0,
      speed: 0.005 + Math.random() * 0.003,
      size: 10 + Math.random() * 6,
      text: RAIN[Math.floor(Math.random() * RAIN.length)]
    };
  }

  rain() {
    if (!this.raining) return;
    const canvas = document.getElementById("innovations-rain");
    const paper = canvas.getContext("2d");
    paper.clearRect(0, 0, canvas.width, canvas.height);
    this.drops = this.drops.map((drop) => {
      if (!drop) return this.newDrop();
      drop.through += drop.speed;
      if (drop.through >= 1) return this.newDrop();
      const x = drop.startX + (drop.endX - drop.startX) * drop.through;
      const y = drop.startY + (drop.endY - drop.startY) * drop.through;
      const fade = drop.through < 0.2 ? drop.through * 5
        : drop.through > 0.8 ? (1 - drop.through) * 5 : 1;
      paper.save();
      paper.globalAlpha = fade * 0.6;
      paper.shadowColor = this.rainColour;
      paper.shadowBlur = 5;
      paper.fillStyle = this.rainColour;
      paper.font = `${drop.size}px 'Noto Naskh Arabic', monospace`;
      paper.fillText(drop.text, x, y);
      paper.restore();
      return drop;
    });
    this.rainFrame = requestAnimationFrame(() => this.rain());
  }

  // ==================== the last screen: words joined up ====================

  startNetwork() {
    const canvas = document.getElementById("innovations-network");
    if (!canvas) return;
    this.sizeCanvases();
    const count = Math.min(canvas.width * 0.1, 80);
    this.dots = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1
    }));
    this.network();
  }

  network() {
    const canvas = document.getElementById("innovations-network");
    if (!canvas) return;
    const paper = canvas.getContext("2d");
    paper.clearRect(0, 0, canvas.width, canvas.height);
    this.dots.forEach((dot) => {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
      if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
      paper.beginPath();
      paper.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      paper.fillStyle = "rgba(251, 191, 36, 0.7)";
      paper.fill();
    });
    this.dots.forEach((one, index) => {
      this.dots.slice(index + 1).forEach((other) => {
        const apart = Math.hypot(one.x - other.x, one.y - other.y);
        if (apart >= 150) return;
        paper.beginPath();
        paper.strokeStyle = `rgba(255, 255, 255, ${0.15 - apart / 1000})`;
        paper.lineWidth = 0.5;
        paper.moveTo(one.x, one.y);
        paper.lineTo(other.x, other.y);
        paper.stroke();
      });
    });
    this.networkFrame = requestAnimationFrame(() => this.network());
  }

  sizeCanvases() {
    ["innovations-rain", "innovations-network"].forEach((id) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    });
  }

  // ==================== the fourth screen: the two views ====================

  showResults() { this.setView(0); }
  showEntry() { this.setView(1); }

  setView(which) {
    this.element.querySelectorAll(".toggle-btn").forEach((button, index) => {
      button.classList.toggle("active", index === which);
    });
    const pairs = [
      ["innovations-shot-results", "innovations-card-results"],
      ["innovations-shot-popup", "innovations-card-popup"]
    ];
    pairs.forEach((pair, index) => {
      pair.forEach((id) => {
        const one = document.getElementById(id);
        if (one) one.classList.toggle("active", index === which);
      });
    });
    if (which === 1) this.mountEntryWindow();
  }

  // The entry window shown inside the story is the real one, in a frame of
  // its own, so the story shows the site rather than a picture of it.
  mountEntryWindow() {
    const frame = document.getElementById("innovations-popup-frame");
    if (!frame || frame.dataset.ready) return;
    frame.dataset.ready = "1";
    frame.src = "home.html?state=popup";
  }

  // Pressing the results picture opens the page it came from, and says how to
  // read what it opened.
  openOriginal() {
    this.setView(1);
    const hint = document.getElementById("innovations-hover-hint");
    if (!hint) return;
    this.placeBadges();
    [60, 200, 600].forEach((delay) => setTimeout(() => this.placeBadges(), delay));
    hint.classList.add("show");
    clearTimeout(this.hoverHintTimer);
    this.hoverHintTimer = setTimeout(() => hint.classList.remove("show"), 7000);
  }

  // The two badges over the screenshot sit at the same point of it whatever
  // its size: a little right of centre, a third of the way down, over the row
  // they are talking about. They are placed in whole pixels, because a badge
  // landing on a half pixel blurs the writing on it.
  placeBadges() {
    const host = this.element.querySelector(".screen-content");
    if (!host) return;
    const width = host.clientWidth, height = host.clientHeight;
    host.querySelectorAll(".lqs-openhint, .lqs-hoverhint").forEach((badge) => {
      const left = Math.round(width * 0.62 - badge.offsetWidth / 2);
      const top = Math.round(height * 0.34 - badge.offsetHeight / 2);
      badge.style.left = `${left}px`;
      badge.style.top = `${top}px`;
      const box = badge.getBoundingClientRect();
      badge.style.left = `${left - (box.left - Math.round(box.left))}px`;
      badge.style.top = `${top - (box.top - Math.round(box.top))}px`;
    });
  }
}

application.register("innovations", InnovationsController);
