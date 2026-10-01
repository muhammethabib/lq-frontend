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

Two cases make it worse:

- **Anything that shortens the window.** With the browser's bookmarks bar
  open, the visible area is shorter, and the page does not make up the
  difference. The keys are all on screen, but the bottom edge of the keyboard
  is below it — the panel looks cut off, and there is nothing left under it.

- **A position the user chose, kept too long.** Once the user has dragged the
  keyboard somewhere to see it, that position comes back on later presses, and
  on later visits. The keyboard then opens near the edge of the screen, and
  the page stops scrolling altogether.

## What should happen, in order

1. The user presses a letter box.

2. The keyboard opens directly under the boxes, at any window size, without the
   user having to move it there.

3. If the boxes and the whole keyboard are already in view, with a little empty
   page below the keyboard, the page stays where it is.

4. Otherwise the page scrolls until all of it comes into view.

5. The whole keyboard is visible — its bottom edge as well as its keys — with
   a gap of empty page below it.

6. The page makes that room for itself. It measures the area the browser is
   actually showing, so a bookmarks bar, a toolbar, a notification strip or a
   changed zoom level makes no difference to where things end up. If the
   window changes height while the keyboard is open, the keyboard is still
   whole on the screen afterwards.

7. The page can still be scrolled down a little from there.

8. A press always starts from the keyboard's usual place under the boxes. If
   the user moved the keyboard earlier, that position may be kept while the
   page is open, but it is never carried into a later visit, and it never
   stands in for the scroll: a kept position that would put the keyboard level
   with the boxes, over them, or at the edge of the screen is let go.

9. Closing the keyboard leaves that extra page length in place. The page does
   not jump back, and the next press opens the keyboard in the same position.

## The same result every time

The keyboard should end up directly under the boxes, with both fully in view,
in each of these:

1. The first press after the page loads.

2. A second press, after closing the keyboard.

3. A press after switching to the Search tab and back.

---

## Acceptance

Check each at a window around 1400px tall, around 900px, and around 700px —
and then repeat the 900px and 700px rounds with the browser's bookmarks bar
turned on.

- [ ] The keyboard opens directly under the boxes, and the user never has to
      move it there.
- [ ] Where the boxes and the whole keyboard already fit on the screen, the
      page does not move at all.
- [ ] Where they do not fit, the page scrolls until they do, and the keyboard
      is whole on the screen — bottom edge included — with a gap of empty page
      below it.
- [ ] Turning the bookmarks bar on changes nothing about that result.
- [ ] After that scroll the page still answers the wheel and moves down a
      little further.
- [ ] Moving the keyboard by hand, then pressing a box again in a later visit,
      opens it under the boxes with the page scrolled as usual.
- [ ] Closing the keyboard leaves the page where it stands; nothing under the
      pointer shifts.
- [ ] The first press, a second press after closing, and a press after
      switching to the Search tab and back all end the same way.

## Not in this ticket

- Moving the keyboard around the page by dragging it — that is LQ-KB-1.
- Phone-size windows, where the keyboard sits along the bottom of the screen
  rather than floating.
