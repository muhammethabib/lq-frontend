# LQ-KB-1 — A keyboard the user can move

- **Area:** Search page — the Word Decoder tab and the Search tab
- **Type:** Feature
- **Affects:** Every window wide enough for the keyboard to float (768px and up)
- **Front-end only:** this is about what the page does on screen; nothing here
  asks for a change on the server.

---

## Summary

The on-screen keyboard floats above the page, so sooner or later it covers
something the user wants to read. They should be able to pick it up and move
it out of the way, see that they can before they try, and put it back in one
press.

## Why

A floating panel that cannot be moved reads as an obstruction, and the only
thing the user can do about it is close it — which also takes away the
keyboard they were using. Three things follow: the handle has to be visible
before the pointer is on it, a move has to be undoable in one press, and a
keyboard the user has moved has to stay where they put it.

## What should happen

### Picking it up

1. The keyboard can be carried by its top bar — the strip holding Clear, the
   wildcards and the close key — and by the empty space beside the key rows.

2. Hovering either of those areas shows a field of small dots there and lifts
   the panel slightly off the page, so the user can see where to take hold of
   it before trying. The dots follow the real shape of the empty space.

3. The cursor is an open hand over those areas and a closed hand while the
   keyboard is being carried.

4. Every key, and every button on the bar, still takes its own press. None of
   them starts a move.

5. While it is being carried the keyboard follows the pointer exactly, and it
   is never allowed to leave the window.

### Putting it back

1. When the keyboard is dropped somewhere new, a small button appears in its
   top-left corner and flashes once. Pressing that button returns the keyboard
   to its usual place under the boxes, and the button fades away.

2. The first time the user moves the keyboard in a visit, a short label
   appears over that button — *Put it back* — for about two seconds. It is
   shown once; moving the keyboard again does not repeat it. A reload starts
   the visit over, so it is shown again.

3. Hovering the button draws an outline on the page showing where the keyboard
   will return to.

4. While the keyboard is being carried back towards its usual place, a dashed
   outline of that place appears behind it and grows clearer as it nears.
   Dropped close enough, the keyboard settles into that place by itself and
   the button disappears.

### Keeping the place

1. A keyboard the user has moved stays where they put it for as long as the
   page is open. Closing it and opening it again brings it back to the same
   place.

2. The place is not remembered between visits. After a reload the keyboard
   opens under the boxes again.

3. A place that would put the keyboard level with or above the boxes it
   belongs to is let go rather than used, and the keyboard opens under them.

### The panel itself

1. The Advanced / Basic key sits in the bottom-left corner of the panel,
   flush with its left edge and its foot, in both languages and on both
   tabs.

2. Everything above applies to the Search tab's keyboard in the same way.

### Phone-size windows

1. Below 768px the keyboard sits along the bottom of the screen. There is
   nowhere to move it to, so none of the above applies: no dots, no hand
   cursor, no button, no label.

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
- Moving the keyboard is a pointer gesture by choice. The keyboard is fully
  usable without it, and closing it is always one press away.

## Acceptance

Check in both languages, on both tabs, at a window around 1400px wide.

- [ ] Hovering the top bar, and the empty space beside the keys, shows the
      dots there and lifts the panel.
- [ ] The cursor is an open hand over those areas and a closed hand while
      dragging.
- [ ] Every key and every button on the bar still takes its own press.
- [ ] A drop in a new place shows the button in the top-left corner and
      flashes it once.
- [ ] The label appears over the button once in a visit, and again after a
      reload.
- [ ] Hovering the button outlines the usual place on the page.
- [ ] Carrying the keyboard back shows the dashed outline, and a drop close
      enough settles it home and removes the button.
- [ ] Pressing the button returns the keyboard and removes the button.
- [ ] A moved keyboard survives a close and reopen, and returns to its usual
      place after a reload.
- [ ] The Advanced / Basic key is flush with the panel's bottom-left corner.
- [ ] Below 768px the keyboard is docked, with no dots, no hand cursor and no
      button.
- [ ] No errors in the browser console through any of the above.

## Not in this ticket

- Where the keyboard appears and how the page scrolls when a box is pressed —
  that is LQ-KB-2.
- The key layouts themselves.
