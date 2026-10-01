// js/keyboard_placement.js
// Where the reader put a keyboard.
//
// Both keyboards float over the page and both can be dragged out of the way.
// The page picks a place for them -- under the caret, under the boxes -- and
// until now it picked again on every opening, every scroll and every search,
// which threw the reader's own decision away several times a minute. This file
// holds that decision instead, and the keyboards ask it before they place
// themselves.
//
// It holds it for this page and no longer. Nothing here is written down.
//
// That is a decision rather than an omission. Moving the keyboard is not a
// preference, it is an answer to something in the way: show me what is under
// it. The answer stops being wanted about as soon as the obstruction does, and
// a place chosen for one afternoon is the wrong place a fortnight later, on a
// window of a different size, over a page with different things on it. A place
// kept past its moment has to be watched for going stale -- which is why the
// keyboards check, on every opening, that the place they remember still leaves
// the boxes visible. Keeping it only while the reader is on the page makes the
// question much smaller, and the cost of letting it go is one drag.

// Nothing may sit closer than this to an edge of the window: a keyboard half
// off the screen cannot be dragged back on.
const PLACEMENT_MARGIN = 8;

window.LQ_PLACEMENT = {
  // This page's places, one entry per keyboard. The two float in different
  // places and are different sizes, so a place found for one says nothing
  // about the other.
  moves: {},

  // ==================== reading and writing ====================

  // The place this keyboard should open at, or null for the page's own.
  spot(name) {
    return name in this.moves ? this.moves[name] : null;
  },

  // The reader has parked the keyboard here. It stays until they put it back
  // themselves, or until the page is loaded again.
  fix(name, spot) {
    this.moves[name] = { left: Math.round(spot.left), top: Math.round(spot.top) };
  },

  // The keyboard is back where the page would have put it: there is no
  // decision left to honour.
  release(name) {
    delete this.moves[name];
  },

  // ==================== the one telling ====================

  // Whether the reader has been told what the pin is for. One record for both
  // keyboards: the line says one thing -- press this and the keyboard goes
  // back where it was -- and that is the same thing on either of them, so the
  // second telling teaches nothing and only gets in the way of the parking
  // that earned it.
  //
  // It lasts exactly as long as the page does. A reader who reloads is, as far
  // as anyone can tell from here, starting again, and starting again is when
  // being told things is useful.
  told: false,

  toldAlready() { return this.told; },

  markTold() { this.told = true; },

  // ==================== staying on the screen ====================

  // A window can be made smaller, or turned, while the panel is parked. A
  // place is only worth honouring while it is still reachable, so it is pulled
  // back inside the window rather than dropped.
  clamp(spot, width, height) {
    const right = window.innerWidth - width - PLACEMENT_MARGIN;
    const bottom = window.innerHeight - height - PLACEMENT_MARGIN;
    return {
      left: Math.round(Math.max(PLACEMENT_MARGIN, Math.min(spot.left, Math.max(PLACEMENT_MARGIN, right)))),
      top: Math.round(Math.max(PLACEMENT_MARGIN, Math.min(spot.top, Math.max(PLACEMENT_MARGIN, bottom))))
    };
  }
};
