# LQ-KB-2 — Where the keyboard appears when a box is pressed

- **Area:** Search page — the Word Decoder tab
- **Type:** Bug / behaviour
- **Affects:** Mid-size and smaller browser windows
- **Front-end only:** this is about what the page does on screen; nothing here
  asks for a change on the server.

---

## Summary

Pressing an empty letter box in the Word Decoder opens the on-screen keyboard.
The keyboard should appear directly under the boxes, with the boxes and the
whole keyboard in view together. At the moment it often appears away from
them, and the user has to drag it into place before they can type.

## Problem

On mid-size and smaller screens the Word Decoder keyboard behaves
unpredictably when a letter box is pressed. The page scrolls too little: the
keyboard ends up in the middle of the screen rather than under the boxes, and
the user has to drag it into place by hand. Sometimes the page does not scroll
at all, and the keyboard opens over the boxes.

## What should happen, in order

1. The user presses a letter box.

2. The keyboard opens directly under the boxes, at any window size, without the
   user having to move it there.

3. If the boxes and the whole keyboard are already in view, with a little empty
   page below the keyboard, the page stays where it is.

4. Otherwise the page scrolls until all of it comes into view.

5. The whole keyboard is visible, with a gap of empty page below it.

6. The page can still be scrolled down a little from there.

7. Closing the keyboard leaves that extra page length in place. The page does
   not jump back, and the next press opens the keyboard in the same position.

## The same result every time

The keyboard should end up directly under the boxes, with both fully in view,
in each of these:

1. The first press after the page loads.

2. A second press, after closing the keyboard.

3. A press after switching to the Search tab and back.

---

## Acceptance

Check each at a window around 1400px tall, around 900px, and around 700px.

- [ ] The keyboard opens directly under the boxes, and the user never has to
      move it there.
- [ ] Where the boxes and the whole keyboard already fit on the screen, the
      page does not move at all.
- [ ] Where they do not fit, the page scrolls until they do, and the keyboard
      is whole on the screen with a gap of empty page below it.
- [ ] After that scroll the page still answers the wheel and moves down a
      little further.
- [ ] Closing the keyboard leaves the page where it stands; nothing under the
      pointer shifts.
- [ ] The first press, a second press after closing, and a press after
      switching to the Search tab and back all end the same way.

## Not in this ticket

- Moving the keyboard around the page by dragging it — that is LQ-KB-1.
- Phone-size windows, where the keyboard sits along the bottom of the screen
  rather than floating.
