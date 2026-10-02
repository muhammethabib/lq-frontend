# Moving the keyboard

- **Area:** Search page — the Word Decoder tab and the Search tab
- **Type:** Behaviour
- **Affects:** Every window wide enough for the keyboard to float (768px and up)
- **Front-end only:** this is about what the page does on screen; nothing here
  asks for a change on the server.

---

## What should happen

### Taking hold of it

1. The Word Decoder keyboard can be carried by its top bar — the strip holding
   Clear, the wildcards and the close key — by the empty space beside the key
   rows, and by its left, right and bottom edges.

2. The Search keyboard can be carried by its top bar and by its left, right
   and bottom edges — the margin around the keys. The two keyboards are held
   the same way.

3. Hovering any of those areas shows a faint field of small dots there and
   lifts the panel slightly off the page, so the user can see where to take
   hold of it before trying. The cursor is an open hand. In the empty space
   beside the key rows the dots fade away before they reach the keys. At rest
   the dots are not shown at all.

4. On the Search keyboard, until the user has typed anything — on this
   keyboard or on their own — the top bar carries a short line that teaches
   the keyboard: *Use your own keyboard or click the keys below*. While the
   line is there, the dots come up in the two stretches either side of it.
   Once the user has typed, the line goes and the dots fill the middle of the
   bar instead. The line comes back after a reload.

5. Every key, and every button on the bar, still takes its own press. The
   narrow gaps between the keys and between the rows are not part of the
   handle, and neither is the margin beside and below the Word Decoder's
   Advanced / Basic key, which belongs to the key: a press that just misses a
   key reaches the key rather than carrying the keyboard away.

6. While it is being carried the cursor is a closed hand, the keyboard follows
   the pointer exactly, and it is never allowed to leave the window.

### Putting it down

1. When the keyboard is dropped somewhere new, a small button appears in its
   top-left corner and flashes once. On the Word Decoder keyboard that corner
   is where Clear stands, so Clear steps a little to the right to make room
   for it, and returns to the corner when the button goes.

2. The button flashes once again every time the keyboard is moved and dropped
   in another place, not only the first time — each drop is a new place, and
   the flash confirms it.

3. The first time the user moves a keyboard in a visit, a short label appears
   over that button — *Put it back* — for about two seconds. It is shown once,
   counting both keyboards as one; moving a keyboard again does not repeat it.
   After a reload it is shown again.

4. Hovering the button draws an outline on the page showing where the keyboard
   will return to.

5. Pressing the button returns the keyboard to its usual place, and the button
   fades away.

6. While the keyboard is being carried back towards its usual place, a dashed
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
