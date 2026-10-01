# LQ-KB-1 — The floating keyboards can be moved, and say so

**Area:** Search page (`pages/home.html`) — the Search board and the Word
Decoder board
**Type:** Feature + UI correction
**Depends on:** nothing
**Related:** LQ-KB-2 (the page scroll when a board opens). The two tickets
touch the same panels; LQ-KB-2 owns everything about the page moving.

---

## Summary

Both floating keyboards can already be dragged, but nothing on screen says
so, and the controls around that — where a moved board is remembered, how it
is sent back, where the Advanced/Basic key sits — were either missing or in
the wrong place. This ticket specifies the whole of it: the handle, the marks
that make it discoverable, the home outline and its magnet, the control that
undoes a move, and the one line of text that explains that control.

The reference implementation is on `main` in this repository and is the
authority where this document is silent. Everything below has been measured
in the running build at 1280 and 1440 wide, in both languages, on both
boards.

---

## Why

A keyboard that floats over the page sooner or later covers something the
reader wants. They can move it — but a reader who does not know that reads
the panel as an obstruction, and the only thing they can do about it is close
it. Three things follow from that:

1. **The handle has to be visible before the pointer is on it.** A cursor
   that only changes once you are already over the bar teaches nobody.
2. **A move has to be undoable in one press**, and the control that undoes it
   has to say what it does without being hunted for.
3. **A moved board has to stay moved.** The page used to re-place it on every
   scroll and every search, which threw the reader's decision away several
   times a minute.

---

## Scope

**In scope**

- Dragging both boards, and the marks that advertise it.
- The home outline, its magnet, and the snap back.
- Remembering a moved board, and the control that ends that.
- The one-line label on that control.
- The position of the Advanced/Basic key.

**Out of scope**

- The page scrolling when a board opens — that is LQ-KB-2.
- Narrow screens. Below 768px both boards dock to the foot of the window,
  there is nowhere to move them to, and none of this applies (see §9).
- The key layouts themselves.

---

## 1. The handle

The board is held by its **bar** (the strip at the top carrying Clear, the
wildcards and the close key) and by the **empty space inside the panel** —
the ragged margin the key rows leave beside them.

| | |
|---|---|
| Starts a drag | `pointerdown` anywhere on the bar or on the panel that is not itself a control |
| Does not start a drag | any key, Clear, the wildcards, delete, close, the Advanced/Basic key, the pin |
| Cursor | `grab` over the handle, `grabbing` while dragging |
| While dragging | the panel keeps the pointer's offset exactly; no re-centring |

The press is read on the panel rather than on each row, so the gaps **between**
rows carry the panel too.

## 2. Making the handle visible

Two marks, both of them fields of dots, both of them invisible until a pointer
is over the area they belong to:

**2a. On the bar.** A field of dots in the two stretches of bar that are not
controls — between Clear and the wildcards, and between the wildcards and the
delete key. 9×9px tiles, `background-repeat: space` so only whole dots are
ever drawn, faded out at both ends over 34% of their width. `opacity: 0` → `1`
on hover of the bar.

**2b. Beside the keys.** The key rows are ragged and leave one or two tall
stretches of nothing beside them. Each stretch is **one mark**, not one per
row — a reader sees a single empty area there, and a mark that lights a strip
at a time says the panel is held by rows, which it is not.

- A stretch is cut to its real staircase shape with `clip-path`, not to the
  rectangle that fits inside it. What is clipped away is neither drawn nor
  hovered, so **the mark and the area that answers are the same shape to the
  pixel**. Cut to a rectangle, the wider rows kept a margin that dragged the
  panel and showed nothing for it.
- 13×13px tiles, `background-repeat: space`, masked with a radial gradient so
  the field fades at its edges.
- Only the stretch the pointer is in lights up.
- Measured in Turkish at 1280 on the basic board: two stretches, 195×102 and
  246×102, above and below the row that reaches furthest across.
- The stretches are **measured at runtime**, not written down: the two
  layouts are ragged in different places and the raggedness moves with the
  language and the window. Re-measure on open, on panel switch and on resize.

**2c. The panel lifts.** `box-shadow: 0 20px 48px -8px rgba(0,0,0,.26)` while
the bar is hovered or the panel is being dragged, over a `.16s` transition.

## 3. Going home

**3a. The outline.** While a board is being dragged, if its current position
is within **190px** of the place the page would put it, a dashed outline of
that place is drawn on the page behind it: `position: fixed`, `2px dashed`,
the panel's exact size. Its opacity rises as the panel nears it.

**3b. The magnet.** Dropped within **40px** of home, the board goes home: the
stored place is forgotten and the pin disappears.

**3c. On the control.** Hovering the pin (§5) lights the same outline on the
page at full size, solid claret rather than dashed.

## 4. Remembering a moved board

Dropped anywhere else, the place is stored and honoured on the next opening.

| | |
|---|---|
| Storage | `localStorage`, key `lq.keyboard-place.decoder` / `lq.keyboard-place.search` |
| Shape | `{ "left": <int>, "top": <int> }`, window coordinates, whole pixels |
| If storage throws | the place still holds for the rest of the visit, in memory |
| Clamping | never closer than 8px to any window edge; a place that no longer fits a smaller window is pulled back inside rather than dropped |
| Rounding | whole pixels. A panel on a half pixel puts every 12px mark inside it half a pixel out, which reads as crooked long before anyone can say why |

**A stored place is kept only while it sits below the boxes it belongs to.**
The place is a window position and the boxes are not, so a place that cleared
them when it was chosen covers them at another scroll position — and it is
stored for the next visit, where the page starts at the top. A place level
with or above the boxes has stopped being a place: it is let go, and the board
opens where the page puts it. **When this is judged is specified in LQ-KB-2
§4** — it must be judged after the page has been brought, not before.

## 5. The control that undoes it

A 22×22px button in the panel's **top-left corner**, shown only while a place
is stored.

**5a. Its mark.** The home outline of §3a, cut down to what survives at 12px:
four corner brackets and the spot they stand around. The dashes do not
survive — at this size they blur into a ring — and corners are what a dashed
frame becomes when only the corners are kept. The mark names the place rather
than the journey: reaching the control already lights that same outline up on
the page at full size.

**5b. Its colour.** Claret as the ink, not as the ground: paper background,
`1px` claret border, claret mark. Filled, it was the only solid block of
colour in a bar of outlines — Clear, the wildcards, delete and close are all a
line on paper — and the eye read it as a mass rather than a control. Under the
pointer it fills claret with a white mark. Transition `.12s`.

**5c. Its place.** The panel's two top corners belong to the panel itself:
close in one, put-this-back in the other; everything between them is about the
typing. On the Search board the pin already stands in that corner with nothing
beside it. On the Decoder board **Clear holds the corner while the pin is away
and steps 27px to the right when it arrives** — a slot held permanently open
would show every reader an unexplained indent for a state most never enter,
and the step only ever happens as the panel itself is flying across the page.

**5d. Pressing it** sends the board back to the place the page picks and
forgets the stored place, including in storage. The control fades out over
`.6s` rather than blinking out from under the pointer.

**5e. It carries no tooltip.** A hover on it already lights the old place up
on the page; a second answer to the same gesture, in words, over the top of
the first, is noise. It keeps its `aria-label`.

**5f. It blinks once on every drop** — one `.6s` ease-out of the fill it
otherwise only wears under the pointer. The words (§6) are said once a visit
and then never again, so after that first time this is all there is to say
that the place was taken, and every drop is a new place to take.

## 6. The one line

A claret label over the pin, two lines of 10.5px text, centred on it.

- Text: `keyboardPinSay` — EN *Click to put it back*, TR *Tıkla, eski yerini
  alsın*.
- Shown for **1.9s**, then it goes.
- Shown **once a visit, counting both boards as one.** The line is about one
  idea — press this and the board goes back where it was — and that idea is
  the same on either board, so the second telling teaches nothing and only
  gets in the way of the parking that earned it.
- The record is kept in `sessionStorage` under `lq.keyboard-told`, so moving
  to another page and parking a board there does not say it again, while a
  reader coming back days later is reminded rather than nagged. A page with no
  storage still holds it in memory for as long as the reader stays.
- It is clamped to **the panel's own left edge as well as the window's**.
  Centred on a button in the corner it hangs 24px off that corner, which reads
  as a label belonging to nothing.
- It flips below the pin when there is less than 44px of window above the
  panel.

## 7. The Advanced / Basic key

It stands in the panel's **bottom-left corner**, flush with the panel's left
edge and its foot.

The rule that puts it there must be bound to **the row that contains it**, not
to the row that happens to be last. The marks of §2b are written into the
panel after its rows, so a `:last-child` rule silently stops applying and the
key drifts: it measured 62, 70, 83 and 85 pixels in from the corner across the
two languages and the two boards.

The row runs right to left, so the slack is taken on the **right** — the side
the letters are on — which pushes the key into the corner rather than away
from it.

## 8. Accessibility

- The pin keeps an `aria-label` (`keyboardPinBack` — *Put the keyboard back* /
  *Klavyeyi eski yerine al*), rewritten on a language change.
- The one line is a `role="status"`, so it is announced once when it appears.
- Every animation in this ticket is disabled under
  `prefers-reduced-motion: reduce`.
- The marks of §2 are decorative: `aria-hidden="true"`.
- Dragging is pointer-only by design; the board is fully usable without it,
  and closing it is always one key away.

## 9. Narrow screens

Below 768px both boards dock to the foot of the window. There is nowhere to
move them to, so: no handle cursor, no marks, no pin, no label, no outline. A
place found on a wide screen is **neither used nor overwritten** — a reader
who turns their phone sideways gets their place back.

The breakpoint is **`767.98px`** — the top of Bootstrap's md range — in
every rule and every script that means "narrower than md". Half the project
spelled it `767px`, which left a sliver where one keyboard still floated
while the shared chrome around it had already gone and the other keyboard
was already docked. Fixed in this repository; worth checking on the way in,
since the two spellings behave identically at every integer width and the
difference only shows on a fractional one.

## 10. Reference implementation

| | |
|---|---|
| Markup | `pages/home.html` — the two `.keyboard-bar` blocks |
| Shared chrome | `css/base.css` — `.keyboard-pin*`, `.keyboard-home-ghost` |
| Boards | `css/ottoman-keyboard.css`, `css/search-keyboard.css` |
| Behaviour | `js/controllers/ottoman_keyboard_controller.js`, `js/controllers/search_keyboard_controller.js` |
| The stored place | `js/keyboard_placement.js` |
| The outline | `js/app.js` — `showHome` / `hideHome` |
| Turkish copy | `js/translations.js` — `keyboardPinSay`, `keyboardPinBack` |

---

## Acceptance criteria

- [ ] Hovering the bar shows the dot field in both stretches, in both
      languages, on both boards; the panel lifts.
- [ ] Hovering either empty stretch beside the keys lights **that stretch
      only**, over its whole staircase shape — including the wide part of the
      shortest row, where a rectangle would have stopped.
- [ ] A press anywhere on either stretch, and in the gaps between rows,
      carries the panel.
- [ ] Every key, Clear, the wildcards, delete, close, the Advanced/Basic key
      and the pin still take their own presses, in both languages.
- [ ] Dragging back towards home shows the dashed outline inside 190px; a
      drop inside 40px snaps home and the pin goes.
- [ ] A drop elsewhere stores the place, shows the pin in the top-left corner
      and blinks it once; Clear steps to the right.
- [ ] The line appears over the pin once, then never again in that visit — on
      either board, across a reload, across both boards in either order.
- [ ] The line never hangs off the panel's left edge or the window's.
- [ ] The pin has no tooltip; hovering it lights the home outline.
- [ ] Pressing the pin returns the board and clears
      `lq.keyboard-place.<name>`.
- [ ] A stored place survives a close and reopen, and a reload.
- [ ] A stored place level with or above the boxes is let go, and the board
      opens under them.
- [ ] The Advanced/Basic key is flush with the panel's bottom-left corner in
      both languages on both boards.
- [ ] Below 768px: docked, no pin, no marks; a wide-screen place is not
      overwritten.
- [ ] No console errors through all of the above.
