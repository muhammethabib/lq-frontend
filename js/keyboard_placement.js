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
// A move lasts the session. If the reader asks for it to be kept it lasts
// until they put the keyboard back themselves. Nothing is written down that
// was not asked for.

// One entry per keyboard. The two float in different places and are different
// sizes, so a place found for one says nothing about the other.
const PLACEMENT_PREFIX = "lq.keyboard-place.";

// How many times the offer to keep a position may go unanswered before it
// stops asking. Saying nothing is an answer too.
const PLACEMENT_OFFER_LIMIT = 3;

// Nothing may sit closer than this to an edge of the window: a keyboard half
// off the screen cannot be dragged back on.
const PLACEMENT_MARGIN = 8;

window.LQ_PLACEMENT = {
  // This session's places, whether or not they are being kept. A page with no
  // storage at all still honours a move for as long as the reader is here.
  moves: {},

  // ==================== reading and writing ====================

  // The place this keyboard should open at, or null for the page's own.
  spot(name) {
    if (name in this.moves) return this.moves[name];
    const kept = this.read(`${PLACEMENT_PREFIX}${name}`);
    return kept && typeof kept.left === "number" && typeof kept.top === "number" ? kept : null;
  },

  // The reader has just put the keyboard down somewhere. It stays there for
  // the session, and is written down as well if they asked for that.
  hold(name, spot) {
    this.moves[name] = { left: Math.round(spot.left), top: Math.round(spot.top) };
    if (this.kept(name)) this.write(`${PLACEMENT_PREFIX}${name}`, this.moves[name]);
  },

  // The keyboard is back where the page would have put it: there is no
  // decision left to honour, here or in storage.
  release(name) {
    delete this.moves[name];
    this.remove(`${PLACEMENT_PREFIX}${name}`);
    this.remove(`${PLACEMENT_PREFIX}${name}.kept`);
  },

  // ==================== keeping it across visits ====================

  kept(name) { return this.read(`${PLACEMENT_PREFIX}${name}.kept`) === true; },

  keep(name, spot) {
    this.write(`${PLACEMENT_PREFIX}${name}.kept`, true);
    this.hold(name, spot);
    this.answered(name);
  },

  // ==================== the offer ====================

  // The offer is made once a session and gives up after a few unanswered
  // sessions. Answering it, either way, ends it for good.
  mayOffer(name) {
    if (this.kept(name)) return false;
    if (this.offeredThisSession && this.offeredThisSession[name]) return false;
    return (this.read(`${PLACEMENT_PREFIX}${name}.asked`) || 0) < PLACEMENT_OFFER_LIMIT;
  },

  offered(name) {
    this.offeredThisSession = this.offeredThisSession || {};
    this.offeredThisSession[name] = true;
    this.write(`${PLACEMENT_PREFIX}${name}.asked`,
      (this.read(`${PLACEMENT_PREFIX}${name}.asked`) || 0) + 1);
  },

  answered(name) { this.write(`${PLACEMENT_PREFIX}${name}.asked`, PLACEMENT_OFFER_LIMIT); },

  // ==================== staying on the screen ====================

  // A window can be made smaller, or turned, between one visit and the next.
  // A place is only worth honouring while it is still reachable, so it is
  // pulled back inside the window rather than dropped.
  clamp(spot, width, height) {
    const right = window.innerWidth - width - PLACEMENT_MARGIN;
    const bottom = window.innerHeight - height - PLACEMENT_MARGIN;
    return {
      left: Math.round(Math.max(PLACEMENT_MARGIN, Math.min(spot.left, Math.max(PLACEMENT_MARGIN, right)))),
      top: Math.round(Math.max(PLACEMENT_MARGIN, Math.min(spot.top, Math.max(PLACEMENT_MARGIN, bottom))))
    };
  },

  // ==================== storage, which may not be there ====================

  // A private window, or a reader who has turned site data off, throws on the
  // first touch. That costs them the keeping across visits and nothing else.
  read(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    } catch (error) { return null; }
  },

  write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* session only */ }
  },

  remove(key) {
    try { window.localStorage.removeItem(key); } catch (error) { /* nothing to remove */ }
  }
};
