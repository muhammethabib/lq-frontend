# Where the keyboard appears when a box is pressed

This is about the Word Decoder on the search page — what happens to the page
when the user presses one of the empty letter boxes and the keyboard opens.

**Problem.** On mid-size and smaller screens the Word Decoder keyboard behaves
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
