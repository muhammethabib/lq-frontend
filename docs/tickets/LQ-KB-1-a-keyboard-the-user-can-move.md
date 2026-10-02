# LQ-KB-1 — Moving the keyboard

- **Area:** Search page — the Word Decoder tab and the Search tab
- **Type:** Behaviour
- **Affects:** Every window wide enough for the keyboard to float (768px and up)
- **Front-end only:** this is about what the page does on screen; nothing here
  asks for a change on the server.

---

## Summary

Both on-screen keyboards float above the page, so sooner or later they cover
something the user wants to read. The user should be able to pick a keyboard
up and move it out of the way, see where to take hold of it before trying, and
put it back in one press. A moved keyboard should stay where it was put while
the page is open — and only then.

## Problem

On the live site the keyboard can already be dragged, but the place it is
dragged to is written to the browser's memory for the site. It comes back on
every later press and on every later visit, and a hard reload —
`Ctrl+Shift+R` or `Ctrl+F5` — does not clear it. This is also what breaks the
keyboard's opening position described in LQ-KB-2.

This ticket sets out the whole of the moving behaviour as it should be.

## What should happen

### Taking hold of it

1. The Word Decoder keyboard can be carried by its top bar — the strip holding
   Clear, the wildcards and the close key — and by the empty space beside the
   key rows.

2. The Search keyboard can be carried by its top bar and by its left, right
   and bottom edges — the margin around the keys.

3. Hovering any of those areas shows a faint field of small dots there and
   lifts the panel slightly off the page, so the user can see where to take
   hold of it before trying. The cursor is an open hand. At rest the dots are
   not shown at all.

4. On the Search keyboard, until the user has typed anything — on this
   keyboard or on their own — the top bar carries a short line that teaches
   the keyboard: *Use your own keyboard or click the keys below*. While the
   line is there, the dots come up in the two stretches either side of it.
   Once the user has typed, the line goes and the dots fill the middle of the
   bar instead. The line comes back after a reload.

5. Every key, and every button on the bar, still takes its own press. On both
   keyboards the narrow gaps between the keys and between the rows are not
   part of the handle, so a press that just misses a key does not carry the
   keyboard away.

6. While it is being carried the cursor is a closed hand, the keyboard follows
   the pointer exactly, and it is never allowed to leave the window.

### Putting it down

1. When the keyboard is dropped somewhere new, a small button appears in its
   top-left corner and flashes once.

2. The first time the user moves a keyboard in a visit, a short label appears
   over that button — *Put it back* — for about two seconds. It is shown once,
   counting both keyboards as one; moving a keyboard again does not repeat it.
   After a reload it is shown again.

3. Hovering the button draws an outline on the page showing where the keyboard
   will return to.

4. Pressing the button returns the keyboard to its usual place, and the button
   fades away.

5. While the keyboard is being carried back towards its usual place, a dashed
   outline of that place appears behind it and grows clearer as it nears.
   Dropped close enough, the keyboard settles into that place by itself and
   the button disappears.

### Keeping the place

1. A keyboard the user has moved stays where it was put for as long as the
   page is open. Closing it and opening it again brings it back to the same
   place.

2. The place is never written to the browser's memory for the site. After a
   reload — an ordinary one; a hard reload is not needed — the keyboard opens
   in its usual place again.

3. On the Word Decoder, a kept place that would put the keyboard level with or
   above the boxes is let go, and the keyboard opens under the boxes instead.

### The panel itself

1. On the Word Decoder keyboard, the Advanced / Basic key sits in the
   bottom-left corner of the panel, flush with its left edge and its foot, in
   both languages.

### Phone-size windows

1. Below 768px the keyboard sits along the bottom of the screen. There is
   nowhere to move it to, so none of the above applies: no dots, no hand
   cursor, no button, no label.

## The same result every time

Moving a keyboard and putting it back should behave the same way:

1. On the Word Decoder keyboard and on the Search keyboard.

2. In both languages.

3. In Edge, Chrome and Firefox.

---

## Numbers

Where a distance or a duration is needed:

| | |
|---|---|
| The dashed outline appears within | 190px of the usual place |
| A drop settles into that place within | 40px of it |
| The label over the button is shown for | 1.9 seconds |
| The keyboard is never closer to a window edge than | 8px |
| Phone-size starts below | 768px |

## Accessibility

- The button carries a name for screen readers — *Put the keyboard back* —
  rewritten when the language changes.
- The label over the button is announced once when it appears.
- The dots are decorative and are not announced.
- Every animation here is turned off for users who have asked for reduced
  motion.
- Moving the keyboard is a pointer gesture. The keyboard is fully usable
  without it, and closing it is always one press away.

## Acceptance

Check in Edge, Chrome and Firefox, in both languages, at a window around
1400px wide.

- [ ] Word Decoder: hovering the top bar, and the empty space beside the keys,
      shows the dots there and lifts the panel.
- [ ] Search: hovering the top bar, and the left, right and bottom edges,
      shows the dots there and lifts the panel.
- [ ] Search: before anything is typed, the bar's dots sit either side of the
      teaching line; after the first letter the line is gone and the dots fill
      the middle of the bar. After a reload the line is back.
- [ ] The cursor is an open hand over those areas and a closed hand while
      carrying.
- [ ] Every key and every button on the bar still takes its own press, and a
      press in the gap between two keys or two rows does not move the
      keyboard.
- [ ] The keyboard cannot be carried out of the window.
- [ ] A drop in a new place shows the button in the top-left corner and
      flashes it once.
- [ ] The label appears over the button once in a visit, across both
      keyboards, and again after a reload.
- [ ] Hovering the button outlines the usual place on the page.
- [ ] Pressing the button returns the keyboard and removes the button.
- [ ] Carrying the keyboard back shows the dashed outline, and a drop close
      enough settles it home and removes the button.
- [ ] A moved keyboard survives a close and reopen.
- [ ] After an ordinary reload the keyboard opens in its usual place, and
      nothing about its place is left in the browser's memory.
- [ ] Below 768px the keyboard is docked, with no dots, no hand cursor and no
      button.

## Not in this ticket

- Where the keyboard appears and how the page scrolls when a box is pressed —
  that is LQ-KB-2.
- The key layouts themselves.
