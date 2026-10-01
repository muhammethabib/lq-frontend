# LQ-KB-2 — A press on a box always brings the page to the keyboard

- **Area:** Search page (`pages/home.html`) — the Word Decoder board and the
  Search board
- **Type:** Bug + behaviour specification
- **Depends on:** nothing
- **Related:** LQ-KB-1 (moving the boards). §4 here settles when a remembered
  place is judged; LQ-KB-1 §4 settles what makes a place worth keeping.

---

## Summary

Press a box on the Word Decoder and the keyboard is supposed to appear
immediately under it, with the page brought up so that the tabs, the boxes and
the keyboard read as one block at the top of the window. It did that
sometimes. The rest of the time the keyboard turned up level with the boxes,
or beside them, or below the fold, on a page that would not scroll — and the
reader was left shoving a panel around to see what was underneath.

Three independent faults produced that one symptom. All three are fixed on
`main` in this repository; this ticket specifies the behaviour and names the
traps, because two of the three are easy to write again.

---

## Why this matters more than it looks

The boards are `position: fixed`. A fixed panel adds nothing to the page's own
height, so **the page may have nowhere to scroll to** — the panel can sit
below the fold on a page that is already at its bottom. Everything in this
ticket follows from that one fact. The page has to be *given* the length
before it can be *moved*.

---

## 1. The rule

**A press on a box, or on the search bar, brings the page.** Every time.

The block that is brought up is: the **tabs**, the **row** that asked for the
board (the strip of boxes, or the search bar), and the **board** under it.

| | |
|---|---|
| The tabs land | 16px from the top of the window |
| If the window is too short for that | the lift gives way first and the row last — the row comes no nearer the top than 24px |
| Under the board | 72px of window is left where the window allows, so the board plainly ends above the fold rather than against it |
| Motion | `scrollBy({ behavior: "smooth" })` |

**It goes whether or not the board is short of that 72px.** This is the first
fault: the page used to move only when the board overflowed the window, so the
same press brought the page up on a short window and left it alone on a tall
one — or wherever the reader happened to have scrolled to. The board landing
in a different place each time is the looking-for-it the whole arrangement is
meant to spare them. **Determinism is worth more here than leaving the page
alone.**

Measured on the fixed build at seven window heights (580, 620, 660, 700, 740,
800, 1000) by four routes in — first press, second press, after scrolling by
hand, and after switching tabs back and forth three times — the board sits
**26px under the boxes in all twenty-eight cases, at the same scroll position
each time.**

## 2. Giving the page somewhere to go

A spacer at the foot of the document, driven by a custom property:

```css
body.has-panel-room::after { content: ""; display: block; height: var(--lq-panel-room, 0); }
```

**2a. Measure down the document, never from the current scroll.** This is the
second fault, and the expensive one. The room is asked for on every scroll
event, so if it is measured from `window.scrollY`, scrolling into the room it
has just added makes the page short again and it adds more. Measured: the page
reached **11,881px** after a few presses on a window that needed 264.

The board follows the row it belongs to, so the line it needs is the same line
down the document however far the page has been scrolled. Ask twice, get the
same answer:

```
line = scrollY + panelBottom + 72 + 140      // a document position, stable
need = line − (documentHeight − currentRoom)
room = max(currentRoom, need, 0)
```

**2b. The room only ever grows while a board is open.** Taking it back out
from under a reader standing on it drops them up the page.

**2c. It is released when the board closes — but not before the page is back
at the top.** Taking the room away moves everything under the pointer, and a
press that lands on one thing and lets go over another is a press that never
happened. So: on close, if `scrollY > 0`, wait for a scroll event that brings
it to 0 and release then. Cancel that wait if a board opens again in the
meantime.

**2d. 140px of slack past wherever the board settles.** A page that ends
exactly where the board does answers a flick of the wheel with nothing, which
reads as stuck rather than finished — and a reader who cannot move the page
goes looking for something to drag instead. The slack is measured to the
**end of the journey**, which is a document position and therefore stable:

```
roomDownTo(scrollY + step + innerHeight + 140)
```

## 3. Measuring before the board has finished drawing

The board's own height is not final until its keys and its marks have been
drawn, and a measurement taken before that is short. Repeat the whole
calculation at **0, 80, 320 and 700ms** after opening. Each repeat is
idempotent: once the block is in place the computed step is 0 and nothing
moves.

## 4. A parked board (see LQ-KB-1 §4)

This is the third fault, and the one the reported screenshot was of.

A board the reader has parked used to ask for nothing at all — no room, no
scroll. So a place carried over from an earlier visit opened the keyboard
beside or over the boxes with the page pinned at the top and nowhere to go.

**The page is brought to the boxes whether or not the board is parked.** What
the press asks for is the boxes, so:

- The block is computed from **where the board's foot would be at the place
  the page picks**, not from wherever the board has been left. Pass that
  figure in rather than measuring the parked panel.
- The stored place is judged **after** that, and against **where the boxes are
  about to land** — not where they are. The scroll is smooth and has not
  happened yet, so the routine that scrolls must return the distance it is
  about to travel, and the judgement subtracts it. A place judged against a
  row in mid-air is judged against nothing: judged too early, every park is
  thrown away on the next reload.

## 5. Narrow screens

Below 768px the board is docked to the foot of the window and none of the
above applies. There the risk is the opposite one — the board covering the
field being typed into — so the page scrolls the field **up**, far enough to
leave 16px between it and the top of the board, and no further.

## 6. Reference implementation

| | |
|---|---|
| The room and the journey | `js/app.js` — `roomFor`, `roomDownTo`, `makeRoomFor`, and the `PANEL_TAIL` / `PANEL_LIFT` / `PANEL_HEADROOM` / `PANEL_SLACK` constants |
| The spacer | `css/base.css` — `body.has-panel-room::after` |
| Who asks, and when | `js/controllers/ottoman_keyboard_controller.js` — `openNear`, `scrollIntoReach`, `dropStalePlace`; the same three in `js/controllers/search_keyboard_controller.js` |

---

## Acceptance criteria

Run each of these at **580, 700, 800 and 1000px** window height.

- [ ] Pressing a box puts the keyboard immediately under the boxes, with the
      tabs at the top of the window — on the first press.
- [ ] Closing and pressing a different box gives **the same** result, to the
      pixel and to the scroll position.
- [ ] Scrolling the page by hand first, then pressing a box, gives the same
      result.
- [ ] Switching to Search and back three times, then pressing a box, gives
      the same result.
- [ ] Scrolling to the very bottom of the page first, then pressing a box,
      gives the same result.
- [ ] After the board has settled, the wheel still moves the page down by
      about 140px.
- [ ] `document.documentElement.scrollHeight` does **not** grow on repeated
      opens, scrolls and tab switches. Open a board, scroll up and down ten
      times, read it; it must be the same figure it was after the first open.
- [ ] Closing the board at the top of the page removes the spacer at once;
      closing it mid-page leaves it until the reader returns to the top, and
      nothing jumps under the pointer.
- [ ] A board parked **below** the boxes still opens there, and the page is
      still brought to the boxes — across a close and reopen, and across a
      reload.
- [ ] A board parked **level with or above** the boxes opens under the boxes
      instead, with the pin gone.
- [ ] Below 768px: the board docks to the foot and the field being typed into
      is scrolled clear of it by 16px.
- [ ] No console errors through all of the above.

## Known deviation from the old mock

The old mock does not scroll on a tall window: at 1000px high it leaves the
page where it is and the board ends 886px down. Ours brings the block to the
top at every size. **This is deliberate** — see §1 — and is the point of the
ticket, not a regression against the reference.
