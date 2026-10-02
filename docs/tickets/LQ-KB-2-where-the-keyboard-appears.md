# LQ-KB-2 — Where the keyboard appears when a box is pressed

- **Area:** Search page — the Word Decoder tab
- **Type:** Bug / behaviour
- **Seen in:** Edge, Chrome and Firefox, each with its cache cleared first —
  the same behaviour in all three
- **Front-end only:** this is about what the page does on screen; nothing here
  asks for a change on the server.

---

## Summary

Pressing an empty letter box in the Word Decoder opens the on-screen keyboard.
On a clean browser this works: the page scrolls, the keyboard appears under
the boxes, and everything that should be on screen is on screen. But as soon
as the user moves the keyboard once, that position is remembered, and from
then on the keyboard no longer appears where it should — and clearing the page
with a hard reload does not undo it. In Firefox there is a second, separate
fault: with the bookmarks bar shown, the bottom edge of the keyboard is below
the screen.

## Problem

**1. A short lag on the first press.** There is a noticeable pause between the
press and the keyboard appearing, and the page's movement stutters rather than
running as one motion. Everything ends up in the right place; it just does not
feel immediate.

**2. A position the user chose is remembered, and breaks the rest.** The
moment the user drags the keyboard somewhere, that position goes into the
browser's memory for the site. Every later press uses it, and a hard reload —
`Ctrl+Shift+R` or `Ctrl+F5` — does not clear it. From then on the press does
one of two things:

- the page does not scroll at all, and the keyboard opens wherever the user
  last left it; or
- the page does scroll down, but the keyboard is still not under the boxes,
  and the user has to drag it there again.

**3. In Firefox, the keyboard's bottom edge is still cut off.** With the
browser's bookmarks bar shown, the visible area is shorter and the page does
not make up the difference. All the keys are on screen, but the bottom edge of
the panel is below it, and there is nothing left underneath. This one is
separate from the two above: it is there on a clean browser too, and only in
Firefox.

The first two were reproduced in Edge, Chrome and Firefox alike.

## What should happen, in order

1. The user presses a letter box.

2. The keyboard appears at once. There is no pause between the press and the
   keyboard, and the page's movement is one smooth motion rather than a
   series of small jumps.

3. The keyboard opens directly under the boxes, at any window size, without
   the user having to move it there.

4. If the boxes and the whole keyboard are already in view, with a little
   empty page below the keyboard, the page stays where it is.

5. Otherwise the page scrolls until all of it comes into view.

6. The whole keyboard is visible — its bottom edge as well as its keys — with
   a gap of empty page below it. The page makes that room for itself: it
   measures the area the browser is actually showing, so a bookmarks bar, a
   toolbar or a changed zoom level makes no difference to where things end up.
   If the window changes height while the keyboard is open, the keyboard is
   still whole on the screen afterwards.

7. The page can still be scrolled down a little from there.

8. A press always starts from the keyboard's usual place under the boxes. If
   the user moved the keyboard earlier, that position may be kept while the
   page is open, but it is never written to the browser's memory for the site,
   never survives a reload, and never stands in for the scroll.

9. Closing the keyboard leaves that extra page length in place. The page does
   not jump back, and the next press opens the keyboard in the same position.

## The same result every time

The keyboard should end up directly under the boxes, with both fully in view,
in each of these:

1. The first press after the page loads.

2. A second press, after closing the keyboard.

3. A press after switching to the Search tab and back.

4. A press after the user has moved the keyboard by hand and reloaded the
   page.

---

## Acceptance

Check in Edge, Chrome and Firefox, at a window around 1400px tall, around
900px, and around 700px.

- [ ] The keyboard appears the moment a box is pressed, with no pause, and the
      page moves in one motion.
- [ ] The keyboard opens directly under the boxes, and the user never has to
      move it there.
- [ ] Where the boxes and the whole keyboard already fit on the screen, the
      page does not move at all.
- [ ] Where they do not fit, the page scrolls until they do, and the keyboard
      is whole on the screen — bottom edge included — with a gap of empty page
      below it.
- [ ] In Firefox, turning the bookmarks bar on changes nothing about that: the
      bottom edge of the keyboard is still on screen, with the gap below it.
- [ ] After that scroll the page still answers the wheel and moves down a
      little further.
- [ ] Moving the keyboard by hand and then reloading opens it under the boxes
      again, with the page scrolled as usual. A hard reload is not needed for
      this, and nothing about the site is left in the browser's memory.
- [ ] Closing the keyboard leaves the page where it stands; nothing under the
      pointer shifts.
- [ ] The first press, a second press after closing, and a press after
      switching to the Search tab and back all end the same way.

## Not in this ticket

- Moving the keyboard around the page by dragging it — that is LQ-KB-1.
- Phone-size windows, where the keyboard sits along the bottom of the screen
  rather than floating.
